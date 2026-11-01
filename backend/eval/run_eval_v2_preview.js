// Ad-hoc preview: how would the NEW (R6-R8) pipeline score on the same 39 questions,
// right now, before the R9 switch-over? This is NOT R4, NOT R9, and does not change
// roadmap status - it's an informational probe run on request.
//
// Why this can't just be "set ENABLE_CONSULTING_RAG_V2=true and rerun run_eval.js":
// match_ingest_chunks (migration_044) hardcodes `where c.is_active = true` in SQL. Every
// ingest_chunks row from R6 is still is_active=false (switch-over is a deliberate R9
// decision, not flipped here or anywhere in this script). So calling the real v2 functions
// right now would see zero rows regardless of the flag - not useful. This script does NOT
// touch is_active. It is a read-only SELECT of the same (inactive) rows, with similarity
// computed locally in JS. No student sees any of this; no table is written to.
//
// 2026-11-02 (second update, Aalhad's call): dropped the source-match check entirely.
// The earlier version required the retrieved excerpt to come from the exact casebook
// questions.jsonl named (`expected_source`) - but as more casebooks got ingested, several
// questions started failing that check while still getting a correct, faithful answer from
// a *different* valid casebook (e.g. MECE answered correctly from FMS 2023-24 instead of
// FMS 2021-22 - see the prior log.md entry). Aalhad decided this eval should score whether
// the answer is actually correct, period - not which specific book it cites. So:
//   - expected_source/expected_pages from questions.jsonl are no longer read or scored.
//   - The per-question report shows only the question and whether the answer was correct
//     (faithfulness + correct coverage/not-coverage + must_include) - no casebook name, no
//     page number, no source file, anywhere in the console output or the .md report.
//   - The citations check is dropped too - it was itself a "where did this come from"
//     check, not a correctness check.
// Source metadata is still present in the raw .json result file only (as `similarity`, not
// a casebook name) for anyone debugging the retrieval mechanics later; nothing source-
// identifying is printed to the terminal or the markdown summary.
//
// Scope unchanged: only `frameworks` and `guesstimates` questions have any v2 code path at
// all (confirmed in run_eval.js's R4 comments - qa/role/company have no grounded route in
// either pipeline). Those two features are scored here with real v2 retrieval; the rest are
// recorded with the same "no_rag_route" reason as R4.
//
// Mirrors the relevance gate just added to groundedConsultingLookup (consultingRetrieval.js):
// a row has to clear the similarity threshold AND a relevance judge, checked across every
// candidate above threshold (not just the top one), to count as "covered".

import "dotenv/config";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { embedTexts, generateJSON } from "../src/lib/gemini.js";
import { decideCoverage, AI_FALLBACK_LABEL } from "../src/lib/consultingRetrieval.js";
import { GUESSTIMATES_SOURCE_FILE } from "../src/lib/guesstimateRetrieval.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUESTIONS_PATH = path.join(__dirname, "questions.jsonl");
const RESULTS_DIR = path.join(__dirname, "results");

// Every Consulting casebook R6 ingested (is_active=false), latest version per source.
// Stopped at these 9 - Aalhad's call ("we have enough data for consulting now"), FMS
// Consulting Club 2025-26 and FMS 2024-25 deliberately not ingested (see log.md, R6 marked
// done in .gsd/ROADMAP.md at 7/9 by decision, not a gap).
const DOC_IDS = [
  "e9229429-3eec-478b-b54a-7d5a1cdf6de0", // The FMS Consulting Casebook 2021-22, v3
  "0a6c4f9e-b1bd-4bf8-bbee-7475ba8a6c14", // ISB Consulting Casebook 2025, v2
  "17a7c482-5181-423c-b8d5-44f79e90e392", // IIM B Consulting Casebook 2025, v2
  "6ae47aaa-ad2e-4848-9775-75ac2072f79e", // IIMK Kasebook 2025, v2
  "ab676b81-3b29-4c35-b288-6dff71756e26", // SRCC Guesstimates-Book-Volume-1-6, v2
  "fa763d15-dac2-408f-9228-8a5f34785128", // IIM L Consulting Casebook 2025, v1
  "f2c1333f-b205-46fa-991e-551548dffef7", // IIM Calcutta Consulting CaseBook 2025-26, v2
  "09c41590-6f53-40be-a19c-60fa645610f4", // IIMA-Consult-Prep-Book-Case-Book-2025-26, v2
  "faa13328-c4bc-4ed7-8172-6ec5ba38c162"  // The FMS Consulting CaseBook 2023-24, v6
];

const CHECK_NAMES = ["faithfulness", "coverage_label", "diagram_intact", "must_include"];
const NO_RAG_REASON =
  'No grounded retrieval route exists for the "{feature}" feature in EITHER pipeline ' +
  "(same finding as R4 - chat.js is an ungrounded passthrough, unaffected by is_active).";

const callCounts = { embedding: 0, judge: 0 };

function supabaseAdmin() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// Read-only: fetches the (still is_active=false) chunks for the docs above, with their
// embeddings. No write of any kind. source_file/school/club/year are fetched only because
// the join comes back with them - never read into checks, retrieved, or any printed output
// below (see the no-source-attribution note at the top of this file).
async function loadChunkPool(sb) {
  const PAGE = 1000;
  let all = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await sb
      .from("ingest_chunks")
      .select("id, document_id, page_start, page_end, content, has_diagram, embedding, ingest_documents(source_file)")
      .in("document_id", DOC_IDS)
      .range(offset, offset + PAGE - 1);
    if (error) throw error;
    all = all.concat(data);
    if (data.length < PAGE) break;
  }
  return all.map(r => ({
    document_id: r.document_id,
    content: r.content,
    has_diagram: r.has_diagram,
    source_file: r.ingest_documents?.source_file || null, // used only to scope guesstimates, never printed
    embedding: JSON.parse(r.embedding)
  }));
}

// Local equivalent of match_ingest_chunks, minus the `is_active = true` filter.
function localRetrieve(pool, queryEmbedding, { sourceFile, matchCount }) {
  const scoped = sourceFile ? pool.filter(c => c.source_file === sourceFile) : pool;
  return scoped
    .map(c => ({ content: c.content, has_diagram: c.has_diagram, similarity: cosine(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount);
}

async function judgeFaithfulness(question, excerptText) {
  callCounts.judge++;
  try {
    const parsed = await generateJSON({
      system:
        "You are a strict grader checking whether a casebook excerpt shown VERBATIM to a student " +
        "actually, faithfully and relevantly answers their interview-prep question. The excerpt " +
        "cannot contain any claim beyond itself - your only job is to judge whether it is genuinely " +
        "on-topic and answers what was asked, not just coincidentally sharing vocabulary with the " +
        'question. Respond with ONLY a JSON object, no markdown fences: {"verdict": "faithful" or ' +
        '"unfaithful", "reasoning": "one sentence explaining your judgment"}',
      prompt: `Question: ${question}\n\nExcerpt shown to the student:\n"""${excerptText.slice(0, 2000)}"""\n\nDoes this excerpt faithfully and relevantly answer the question?`,
      maxTokens: 200,
      feature: "eval-judge-v2-preview"
    });
    const verdict = parsed.verdict === "faithful" ? "faithful" : "unfaithful";
    return { verdict, reasoning: String(parsed.reasoning || "") };
  } catch (err) {
    return { verdict: "error", reasoning: `Judge call failed: ${err.message}` };
  }
}

async function evalGroundedQuestion(q, pool) {
  const isGuesstimate = q.feature === "guesstimates";
  const queryText = isGuesstimate
    ? q.question
    : `${q.question} framework diagram case study real example application`;

  callCounts.embedding++;
  const [queryEmbedding] = await embedTexts([queryText], "RETRIEVAL_QUERY");
  const rows = localRetrieve(pool, queryEmbedding, {
    sourceFile: isGuesstimate ? GUESSTIMATES_SOURCE_FILE : undefined,
    matchCount: isGuesstimate ? 8 : 6
  });
  const { covered: thresholdCovered, rows: coveringRows } = decideCoverage(rows);

  // Relevance gate: every row above threshold also has to clear a faithfulness judge,
  // same as the live groundedConsultingLookup now does.
  const judgedByRow = new Map();
  let relevantRows = [];
  if (thresholdCovered) {
    const verdicts = await Promise.all(coveringRows.map(r => judgeFaithfulness(q.question, r.content)));
    coveringRows.forEach((r, i) => judgedByRow.set(r, verdicts[i]));
    relevantRows = coveringRows.filter((_, i) => verdicts[i].verdict === "faithful");
  }
  const covered = relevantRows.length > 0;

  const checks = {};
  const top = relevantRows[0] || null;

  // Faithfulness only measures something for a question that should be covered - whether
  // the shown answer is actually correct. For a covered:false question, correctly showing
  // nothing is a full, complete success already captured by coverage_label; judging
  // "faithfulness of the thing we didn't show" isn't a meaningful separate check and must
  // not drag the overall verdict down for getting it right.
  if (!q.covered) {
    checks.faithfulness = { verdict: "n/a", reason: "This question shouldn't be covered - see coverage_label, not faithfulness, for correctness here." };
  } else if (!thresholdCovered) {
    checks.faithfulness = { verdict: "n/a", reason: "Nothing was retrieved above the similarity threshold - no answer to judge." };
  } else if (!covered) {
    checks.faithfulness = {
      verdict: "fail",
      reason: `${coveringRows.length} candidate answer(s) were found but none actually answered the question: ` +
        coveringRows.map(r => judgedByRow.get(r).reasoning).join(" | ")
    };
  } else {
    checks.faithfulness = { verdict: "pass", reason: judgedByRow.get(top).reasoning };
  }

  if (q.covered) {
    checks.coverage_label = {
      verdict: covered ? "pass" : "fail",
      reason: covered ? "A correct, relevant answer was found." : "No correct answer was found for a question that should have one."
    };
  } else {
    checks.coverage_label = {
      verdict: covered ? "fail" : "pass",
      reason: covered
        ? "An answer was shown for a question that should have returned 'not covered'."
        : `Correctly returned nothing (would show the label "${AI_FALLBACK_LABEL}").`
    };
  }

  if (!top || !top.has_diagram) {
    checks.diagram_intact = { verdict: "n/a", reason: "No diagram-bearing answer was retrieved for this question." };
  } else {
    checks.diagram_intact = {
      verdict: "n/a",
      reason: "A diagram-bearing chunk matched, but R8 (rendering the structured diagram block by page) " +
        "hasn't landed - nothing to check yet."
    };
  }

  if (!q.must_include || q.must_include.length === 0) {
    checks.must_include = { verdict: "n/a", reason: "No required terms specified for this question." };
  } else if (!covered) {
    checks.must_include = { verdict: "fail", reason: "No answer was found, so none of the required terms could be present." };
  } else {
    const haystack = top.content.toLowerCase();
    const missing = q.must_include.filter(t => !haystack.includes(String(t).toLowerCase()));
    checks.must_include = {
      verdict: missing.length === 0 ? "pass" : "fail",
      reason: missing.length === 0 ? "All required terms were present in the answer." : `Missing: ${missing.join(", ")}`
    };
  }

  return { checks, retrieved: top ? { similarity: top.similarity, content: top.content } : null };
}

function evalDarkFeature(feature) {
  const reason = NO_RAG_REASON.replace("{feature}", feature);
  const checks = {};
  for (const name of CHECK_NAMES) checks[name] = { verdict: "fail", reason };
  return { checks, retrieved: null };
}

function overallVerdict(checks) {
  const applicable = Object.values(checks).filter(c => c.verdict !== "n/a");
  if (applicable.length === 0) return "n/a";
  return applicable.every(c => c.verdict === "pass") ? "pass" : "fail";
}

function summarize(results) {
  const perCheck = {};
  for (const name of CHECK_NAMES) perCheck[name] = { pass: 0, fail: 0, error: 0, na: 0 };
  for (const r of results) {
    for (const name of CHECK_NAMES) {
      const v = r.checks[name].verdict;
      if (v === "pass") perCheck[name].pass++;
      else if (v === "fail") perCheck[name].fail++;
      else if (v === "error") perCheck[name].error++;
      else perCheck[name].na++;
    }
  }
  const scored = results.filter(r => r.overall !== "n/a");
  const overallPass = scored.filter(r => r.overall === "pass").length;
  return { totalQuestions: results.length, overallPassRate: scored.length ? overallPass / scored.length : null, overallPass, overallScored: scored.length, perCheck };
}

function pct(n, d) {
  return d ? `${Math.round((n / d) * 100)}%` : "n/a";
}

function buildMarkdown(output) {
  const { summary, results, callCounts } = output;
  const lines = [];
  lines.push(`# RAG eval — v2 preview, correctness only (${output.runAt})`);
  lines.push("");
  lines.push("**This is NOT a live-site measurement.** `is_active` was not touched - every row read " +
    "here is still inactive. This previews what switching on R6's re-ingested content would score. " +
    "**Scoring no longer checks which casebook an answer came from** (Aalhad's call, 2026-11-02) - only " +
    "whether the answer is actually correct and properly labelled covered/not-covered. No casebook name, " +
    "page number, or source file appears anywhere below.");
  lines.push("");
  lines.push(`**Overall pass rate:** ${summary.overallPass}/${summary.overallScored} (${pct(summary.overallPass, summary.overallScored)}) of ${summary.totalQuestions} total questions.`);
  lines.push("");
  lines.push("## Per-check pass rate (pass / (pass+fail+error), n/a excluded)");
  lines.push("");
  lines.push("| Check | Pass | Fail | Error | N/A | Pass rate |");
  lines.push("|---|---|---|---|---|---|");
  for (const name of CHECK_NAMES) {
    const c = summary.perCheck[name];
    const denom = c.pass + c.fail + c.error;
    lines.push(`| ${name} | ${c.pass} | ${c.fail} | ${c.error} | ${c.na} | ${pct(c.pass, denom)} |`);
  }
  lines.push("");
  lines.push("## Per-feature breakdown");
  lines.push("");
  const byFeature = {};
  for (const r of results) {
    byFeature[r.feature] = byFeature[r.feature] || { pass: 0, scored: 0, total: 0 };
    byFeature[r.feature].total++;
    if (r.overall !== "n/a") {
      byFeature[r.feature].scored++;
      if (r.overall === "pass") byFeature[r.feature].pass++;
    }
  }
  lines.push("| Feature | Pass | Scored | Total |");
  lines.push("|---|---|---|---|");
  for (const [feature, c] of Object.entries(byFeature)) lines.push(`| ${feature} | ${c.pass} | ${c.scored} | ${c.total} |`);
  lines.push("");
  lines.push("## Gemini call counts");
  lines.push("");
  lines.push(`- Embedding calls: ${callCounts.embedding}`);
  lines.push(`- Faithfulness judge calls: ${callCounts.judge}`);
  lines.push("");
  lines.push("## All frameworks/guesstimates questions, detail");
  lines.push("");
  for (const r of results.filter(r => r.feature === "frameworks" || r.feature === "guesstimates")) {
    lines.push(`### ${r.id} [${r.feature}, covered:${r.covered}] -> ${r.overall}`);
    lines.push(`Q: ${r.question}`);
    for (const name of CHECK_NAMES) {
      const c = r.checks[name];
      if (c.verdict !== "n/a") lines.push(`- **${name}** (${c.verdict}): ${c.reason}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

async function main() {
  const sb = supabaseAdmin();
  const questions = JSON.parse(`[${readFileSync(QUESTIONS_PATH, "utf8").trim().split("\n").join(",")}]`);
  console.log(`[v2-preview] Loaded ${questions.length} questions.`);

  console.log("[v2-preview] Fetching inactive ingest_chunks pool (read-only, no is_active change)...");
  const pool = await loadChunkPool(sb);
  console.log(`[v2-preview] Pool: ${pool.length} chunks across ${DOC_IDS.length} documents.`);

  const results = [];
  for (const q of questions) {
    let evalResult;
    if (q.feature === "frameworks" || q.feature === "guesstimates") {
      evalResult = await evalGroundedQuestion(q, pool);
    } else {
      evalResult = evalDarkFeature(q.feature);
    }
    const overall = overallVerdict(evalResult.checks);
    results.push({
      id: q.id, feature: q.feature, covered: q.covered, question: q.question,
      overall, checks: evalResult.checks, retrieved: evalResult.retrieved
    });
    console.log(`  ${q.id} [${q.feature}] -> ${overall}`);
  }

  const summary = summarize(results);
  mkdirSync(RESULTS_DIR, { recursive: true });
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const jsonPath = path.join(RESULTS_DIR, `${dateStr}-v2-preview.json`);
  const mdPath = path.join(RESULTS_DIR, `${dateStr}-v2-preview.md`);
  const output = { runAt: new Date().toISOString(), label: "v2-preview", isActiveTouched: false, scoresSourceAttribution: false, callCounts, summary, results };
  writeFileSync(jsonPath, JSON.stringify(output, null, 2));
  writeFileSync(mdPath, buildMarkdown(output));

  console.log(`\n[v2-preview] Overall: ${summary.overallPass}/${summary.overallScored} scored (${summary.totalQuestions} total).`);
  console.log(`[v2-preview] Gemini calls: ${callCounts.embedding} embedding, ${callCounts.judge} judge.`);
  console.log(`[v2-preview] Wrote ${jsonPath}`);
  console.log(`[v2-preview] Wrote ${mdPath}`);
}

main().catch(err => {
  console.error("[v2-preview] Fatal error:", err);
  process.exit(1);
});

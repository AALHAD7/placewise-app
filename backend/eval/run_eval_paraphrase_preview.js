// Ad-hoc preview: for every question the v2-preview relevance gate marks "covered", what
// happens if we additionally run the paraphrase layer (R7b, flag `ENABLE_ANSWER_PARAPHRASE`,
// still OFF everywhere - this script never sets it) on the top relevant chunk?
//
// This is a separate, narrower probe from run_eval_v2_preview.js - it does NOT re-derive or
// duplicate that script's retrieval/relevance-gate logic; it reuses the exact same production
// functions (judgeRelevanceOnce via consultingRetrieval.js, decideCoverage, embedTexts) and
// the exact same local-retrieval-over-inactive-rows mechanics (loadChunkPool/localRetrieve/
// cosine), copied verbatim from run_eval_v2_preview.js because that file exports nothing -
// everything reused here calls into the same underlying consultingRetrieval.js exports that
// file already calls, so "covered" here is computed identically to there, row for row.
//
// New in this script: paraphraseChunk + judgeParaphraseFaithful (the real R7b functions, not
// mocks) are run on the top relevant row for every covered question, scoring two new checks:
//   - paraphrase_faithful: does judgeParaphraseFaithful say the rewrite is faithful?
//   - must_include_survives_paraphrase: do the same must_include terms (case-insensitive
//     substring) still appear in the PARAPHRASED text, not the raw chunk?
//
// Read-only, same posture as run_eval_v2_preview.js: never touches is_active, never writes to
// any table. Does NOT set ENABLE_ANSWER_PARAPHRASE anywhere - paraphraseChunk/
// judgeParaphraseFaithful are called directly, bypassing the flag entirely (the flag only
// gates groundedConsultingLookup, which this script doesn't call).
// Per the 2026-11-02 "scoring no longer checks which casebook" decision, no casebook name,
// source file, or page number appears anywhere in the console output, the .md report, or the
// summary - only correctness.

import "dotenv/config";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { embedTexts } from "../src/lib/gemini.js";
import {
  decideCoverage,
  AI_FALLBACK_LABEL,
  judgeRelevanceOnce,
  paraphraseChunk,
  judgeParaphraseFaithful
} from "../src/lib/consultingRetrieval.js";
import { GUESSTIMATES_SOURCE_FILE } from "../src/lib/guesstimateRetrieval.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUESTIONS_PATH = path.join(__dirname, "questions.jsonl");
const RESULTS_DIR = path.join(__dirname, "results");

// Same 9 docs, same reasoning as run_eval_v2_preview.js - kept in lockstep on purpose so this
// probe and that one are reading the identical inactive pool.
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

const NEW_CHECK_NAMES = ["paraphrase_faithful", "must_include_survives_paraphrase"];
const callCounts = { embedding: 0, relevanceJudge: 0, paraphrase: 0, faithfulnessJudge: 0 };

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

// Read-only, identical to run_eval_v2_preview.js's loadChunkPool: never writes, source_file
// used only to scope guesstimates, never printed.
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
    source_file: r.ingest_documents?.source_file || null,
    embedding: JSON.parse(r.embedding)
  }));
}

function localRetrieve(pool, queryEmbedding, { sourceFile, matchCount }) {
  const scoped = sourceFile ? pool.filter(c => c.source_file === sourceFile) : pool;
  return scoped
    .map(c => ({ content: c.content, has_diagram: c.has_diagram, similarity: cosine(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount);
}

// Same 3-vote relevance gate as run_eval_v2_preview.js, calling the real judgeRelevanceOnce.
async function judgeRelevanceGate(question, excerptText) {
  const results = await Promise.all(
    [0, 1, 2].map(() => {
      callCounts.relevanceJudge++;
      return judgeRelevanceOnce(question, excerptText).catch(err => ({ faithful: false, reasoning: `Judge call failed: ${err.message}`, error: true }));
    })
  );
  const faithfulCount = results.filter(r => r.faithful).length;
  return faithfulCount >= 2;
}

function missingTerms(terms, text) {
  const haystack = String(text || "").toLowerCase();
  return (terms || []).filter(t => !haystack.includes(String(t).toLowerCase()));
}

async function evalQuestion(q, pool) {
  const isGuesstimate = q.feature === "guesstimates";
  const isFrameworks = q.feature === "frameworks";
  const queryText = isFrameworks
    ? `${q.question} framework diagram case study real example application`
    : q.question;

  callCounts.embedding++;
  const [queryEmbedding] = await embedTexts([queryText], "RETRIEVAL_QUERY");
  const rows = localRetrieve(pool, queryEmbedding, {
    sourceFile: isGuesstimate ? GUESSTIMATES_SOURCE_FILE : undefined,
    matchCount: isGuesstimate ? 8 : 6
  });
  const { covered: thresholdCovered, rows: coveringRows } = decideCoverage(rows);

  let relevantRows = [];
  if (thresholdCovered) {
    const verdicts = await Promise.all(coveringRows.map(r => judgeRelevanceGate(q.question, r.content)));
    relevantRows = coveringRows.filter((_, i) => verdicts[i]);
  }
  const covered = relevantRows.length > 0;
  const top = relevantRows[0] || null;

  const checks = {};

  if (!covered) {
    checks.paraphrase_faithful = { verdict: "n/a", reason: "Not covered - no chunk to paraphrase." };
    checks.must_include_survives_paraphrase = { verdict: "n/a", reason: "Not covered - no paraphrase to check." };
    return { checks, covered, top: null, paraphrase: null };
  }

  // Run the real R7b functions directly on the top relevant row - the flag is never read by
  // either function, so ENABLE_ANSWER_PARAPHRASE stays untouched and irrelevant here.
  let paraphraseText = null;
  let paraphraseError = null;
  try {
    callCounts.paraphrase++;
    paraphraseText = await paraphraseChunk(q.question, top.content);
  } catch (err) {
    paraphraseError = err.message;
  }

  if (paraphraseError) {
    checks.paraphrase_faithful = { verdict: "fail", reason: `paraphraseChunk threw: ${paraphraseError}` };
    checks.must_include_survives_paraphrase = {
      verdict: "n/a",
      reason: "Paraphrase call failed - no rewritten text to check must_include terms against."
    };
    return { checks, covered, top, paraphrase: null };
  }

  if (paraphraseText === top.content) {
    // paraphraseChunk returns the chunk unchanged when there's no prose to rewrite (pure
    // diagram block) - nothing was actually rewritten, so faithfulness is vacuously true and
    // must_include trivially survives (it's the same text).
    checks.paraphrase_faithful = { verdict: "n/a", reason: "No prose to rewrite (pure diagram chunk) - paraphraseChunk returned the content unchanged." };
  } else {
    callCounts.faithfulnessJudge += 5; // judgeParaphraseFaithful does its own 5-vote internally
    const faithful = await judgeParaphraseFaithful(top.content, paraphraseText);
    checks.paraphrase_faithful = {
      verdict: faithful ? "pass" : "fail",
      reason: faithful
        ? "judgeParaphraseFaithful verdict: faithful."
        : "judgeParaphraseFaithful verdict: unfaithful (rewrite introduced, dropped, or altered a claim)."
    };
  }

  if (!q.must_include || q.must_include.length === 0) {
    checks.must_include_survives_paraphrase = { verdict: "n/a", reason: "No required terms specified for this question." };
  } else {
    const missing = missingTerms(q.must_include, paraphraseText);
    checks.must_include_survives_paraphrase = {
      verdict: missing.length === 0 ? "pass" : "fail",
      reason: missing.length === 0
        ? "All required terms were still present (as substrings) in the paraphrased text."
        : `Lost after paraphrasing: ${missing.join(", ")}`
    };
  }

  return { checks, covered, top, paraphrase: paraphraseText };
}

function summarize(results) {
  const perCheck = {};
  for (const name of NEW_CHECK_NAMES) perCheck[name] = { pass: 0, fail: 0, na: 0 };
  for (const r of results) {
    for (const name of NEW_CHECK_NAMES) {
      const v = r.checks[name].verdict;
      if (v === "pass") perCheck[name].pass++;
      else if (v === "fail") perCheck[name].fail++;
      else perCheck[name].na++;
    }
  }
  return { totalQuestions: results.length, perCheck };
}

function pct(n, d) {
  return d ? `${Math.round((n / d) * 100)}%` : "n/a";
}

function buildMarkdown(output) {
  const { summary, results, callCounts } = output;
  const lines = [];
  lines.push(`# RAG eval — paraphrase layer (R7b) preview (${output.runAt})`);
  lines.push("");
  lines.push("**This is NOT a live-site measurement and `ENABLE_ANSWER_PARAPHRASE` was never set.** " +
    "`is_active` was not touched - every retrieved row is still the inactive R6 pool, read-only, same " +
    "posture as `run_eval_v2_preview.js`. This probe calls `paraphraseChunk` and `judgeParaphraseFaithful` " +
    "(the real R7b functions in `consultingRetrieval.js`) directly on the top relevant chunk for every " +
    "question the existing relevance gate marks covered, bypassing the flag entirely (neither function " +
    "reads it). **Scoring does not check which casebook an answer came from** (2026-11-02 decision) - no " +
    "casebook name, source file, or page number appears anywhere below.");
  lines.push("");
  const covered = results.filter(r => r.covered);
  const faithfulCount = covered.filter(r => r.checks.paraphrase_faithful.verdict === "pass").length;
  const unfaithfulCount = covered.filter(r => r.checks.paraphrase_faithful.verdict === "fail").length;
  const naFaithful = covered.filter(r => r.checks.paraphrase_faithful.verdict === "n/a").length;
  const mustIncludeApplicable = covered.filter(r => r.checks.must_include_survives_paraphrase.verdict !== "n/a");
  const survived = mustIncludeApplicable.filter(r => r.checks.must_include_survives_paraphrase.verdict === "pass").length;
  const lost = mustIncludeApplicable.filter(r => r.checks.must_include_survives_paraphrase.verdict === "fail").length;

  lines.push("## Summary");
  lines.push("");
  lines.push(`Of ${results.length} total questions, ${covered.length} were marked covered by the relevance gate and had a ` +
    "chunk to paraphrase. Of those:");
  lines.push(`- **Paraphrase faithfulness:** ${faithfulCount} faithful, ${unfaithfulCount} unfaithful, ${naFaithful} n/a ` +
    "(pure-diagram chunk, nothing to rewrite, or the paraphrase call itself failed).");
  lines.push(`- **must_include survival:** of ${mustIncludeApplicable.length} covered questions that specify required terms, ` +
    `${survived} kept every required term in the paraphrased text and ${lost} lost at least one term after paraphrasing.`);
  if (lost > 0) {
    lines.push("");
    lines.push("Questions that lost a must_include term after paraphrasing:");
    for (const r of mustIncludeApplicable.filter(r => r.checks.must_include_survives_paraphrase.verdict === "fail")) {
      lines.push(`  - ${r.id}: ${r.checks.must_include_survives_paraphrase.reason}` +
        ` (paraphrase_faithful: ${r.checks.paraphrase_faithful.verdict})`);
    }
  }
  lines.push("");
  lines.push("## Per-check pass rate (pass / (pass+fail), n/a excluded)");
  lines.push("");
  lines.push("| Check | Pass | Fail | N/A | Pass rate |");
  lines.push("|---|---|---|---|---|");
  for (const name of NEW_CHECK_NAMES) {
    const c = summary.perCheck[name];
    lines.push(`| ${name} | ${c.pass} | ${c.fail} | ${c.na} | ${pct(c.pass, c.pass + c.fail)} |`);
  }
  lines.push("");
  lines.push("## Gemini call counts");
  lines.push("");
  lines.push(`- Embedding calls: ${callCounts.embedding}`);
  lines.push(`- Relevance judge calls (coverage gate, 3x per covering row): ${callCounts.relevanceJudge}`);
  lines.push(`- Paraphrase calls: ${callCounts.paraphrase}`);
  lines.push(`- Faithfulness judge calls (3x per paraphrase that had prose to check): ${callCounts.faithfulnessJudge}`);
  lines.push("");
  lines.push("## Per-question detail (covered questions only)");
  lines.push("");
  for (const r of covered) {
    lines.push(`### ${r.id} [${r.feature}] -> paraphrase_faithful: ${r.checks.paraphrase_faithful.verdict}, ` +
      `must_include_survives_paraphrase: ${r.checks.must_include_survives_paraphrase.verdict}`);
    lines.push(`Q: ${r.question}`);
    lines.push(`- **paraphrase_faithful**: ${r.checks.paraphrase_faithful.reason}`);
    lines.push(`- **must_include_survives_paraphrase**: ${r.checks.must_include_survives_paraphrase.reason}`);
    lines.push("");
  }
  return lines.join("\n");
}

async function main() {
  const sb = supabaseAdmin();
  const questions = JSON.parse(`[${readFileSync(QUESTIONS_PATH, "utf8").trim().split("\n").join(",")}]`);
  console.log(`[paraphrase-preview] Loaded ${questions.length} questions.`);

  console.log("[paraphrase-preview] Fetching inactive ingest_chunks pool (read-only, no is_active change)...");
  const pool = await loadChunkPool(sb);
  console.log(`[paraphrase-preview] Pool: ${pool.length} chunks across ${DOC_IDS.length} documents.`);

  const results = [];
  for (const q of questions) {
    if (q.feature !== "frameworks" && q.feature !== "guesstimates" && q.feature !== "qa") {
      // Same dark-feature set as run_eval_v2_preview.js (role/company) - no grounded route,
      // so nothing to paraphrase; recorded as n/a, not scored into the two new checks.
      results.push({
        id: q.id, feature: q.feature, covered: false, question: q.question,
        checks: {
          paraphrase_faithful: { verdict: "n/a", reason: "No grounded retrieval route for this feature." },
          must_include_survives_paraphrase: { verdict: "n/a", reason: "No grounded retrieval route for this feature." }
        },
        retrievedSimilarity: null, paraphrase: null
      });
      console.log(`  ${q.id} [${q.feature}] -> n/a (no rag route)`);
      continue;
    }
    const evalResult = await evalQuestion(q, pool);
    results.push({
      id: q.id, feature: q.feature, covered: evalResult.covered, question: q.question,
      checks: evalResult.checks,
      retrievedSimilarity: evalResult.top ? evalResult.top.similarity : null,
      paraphrase: evalResult.paraphrase
    });
    console.log(`  ${q.id} [${q.feature}] covered:${evalResult.covered} -> ` +
      `paraphrase_faithful:${evalResult.checks.paraphrase_faithful.verdict}, ` +
      `must_include:${evalResult.checks.must_include_survives_paraphrase.verdict}`);
  }

  const summary = summarize(results);
  mkdirSync(RESULTS_DIR, { recursive: true });
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const jsonPath = path.join(RESULTS_DIR, `${dateStr}-paraphrase-preview.json`);
  const mdPath = path.join(RESULTS_DIR, `${dateStr}-paraphrase-preview.md`);
  const output = {
    runAt: new Date().toISOString(),
    label: "paraphrase-preview",
    isActiveTouched: false,
    enableAnswerParaphraseSet: false,
    scoresSourceAttribution: false,
    callCounts,
    summary,
    results
  };
  writeFileSync(jsonPath, JSON.stringify(output, null, 2));
  writeFileSync(mdPath, buildMarkdown(output));

  console.log(`\n[paraphrase-preview] Gemini calls: ${callCounts.embedding} embedding, ` +
    `${callCounts.relevanceJudge} relevance-judge, ${callCounts.paraphrase} paraphrase, ` +
    `${callCounts.faithfulnessJudge} faithfulness-judge.`);
  console.log(`[paraphrase-preview] Wrote ${jsonPath}`);
  console.log(`[paraphrase-preview] Wrote ${mdPath}`);
}

main().catch(err => {
  console.error("[paraphrase-preview] Fatal error:", err);
  process.exit(1);
});

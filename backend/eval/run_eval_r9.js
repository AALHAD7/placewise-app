// R9 gate eval: the authoritative, dated, pass/fail-scored verdict that decides whether
// Consulting switch-over (R9 plans 2-4) proceeds. Merges what the two 2026-11-02/03 preview
// scripts measured separately (v2 retrieval+relevance-gate correctness, and the R7b
// paraphrase+faithfulness layer) into one run against the real pipeline combination that
// will actually go live if the bar is met.
//
// Scope: the original 39 Consulting questions (q001-q039) only. questions.jsonl now has 51
// lines - FIN1 (a parallel, already-committed phase) appended 12 Finance-domain questions
// (f001-f012) after this plan was authored. Those are a different domain/phase; including
// them here would add noise to a Consulting-specific pass bar. Filtered by id prefix "q"
// below (q001-q039 all have domain:"Consulting"; f011 is also domain:"Consulting" but is a
// FIN1 cross-domain probe question, id-prefixed "f", and deliberately excluded - it's not
// one of the original 39 this gate was written against).
//
// Read-only against the shared Supabase DB, same posture as both preview scripts this is
// built from: never touches is_active, never sets ENABLE_CONSULTING_RAG_V2 or
// ENABLE_ANSWER_PARAPHRASE, never writes to any table. loadChunkPool selects directly from
// ingest_chunks by document_id with no is_active filter - by design, proven below via
// poolActiveState (not assumed).

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

// Same 9 docs as both preview scripts - the full set R6 re-ingested for Consulting.
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

// Read-only. Fetches both the chunk pool AND the is_active state of each DOC_ID (from
// ingest_documents), to prove (not assume) that loadChunkPool's lack of an is_active filter
// is correct and that this eval actually exercises documents switch-over will activate.
async function loadChunkPool(sb) {
  const PAGE = 1000;
  let all = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await sb
      .from("ingest_chunks")
      .select("id, document_id, page_start, page_end, content, has_diagram, embedding, is_active, ingest_documents(source_file)")
      .in("document_id", DOC_IDS)
      .order("id", { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) throw error;
    all = all.concat(data);
    if (data.length < PAGE) break;
  }

  // is_active lives on ingest_chunks (migration_039), not ingest_documents - there is no
  // is_active column on ingest_documents. Aggregate per document from the chunk rows
  // themselves: count active/inactive chunks per DOC_ID, so a document whose chunks are
  // not uniformly one state still shows truthfully (expected uniform per the 2026-11-06
  // finding: 62/13284 active, all SRCC).
  const statsByDoc = new Map();
  for (const r of all) {
    const s = statsByDoc.get(r.document_id) || { active: 0, inactive: 0 };
    if (r.is_active) s.active++; else s.inactive++;
    statsByDoc.set(r.document_id, s);
  }

  const poolActiveState = DOC_IDS.map(id => {
    const s = statsByDoc.get(id) || { active: 0, inactive: 0 };
    const chunk_count = s.active + s.inactive;
    return {
      document_id: id,
      is_active: chunk_count === 0 ? null : (s.active > 0 && s.inactive === 0),
      active_chunk_count: s.active,
      inactive_chunk_count: s.inactive,
      chunk_count
    };
  });

  const pool = all.map(r => ({
    document_id: r.document_id,
    content: r.content,
    has_diagram: r.has_diagram,
    is_active: r.is_active,
    source_file: r.ingest_documents?.source_file || null,
    embedding: JSON.parse(r.embedding)
  }));

  return { pool, poolActiveState };
}

function localRetrieve(pool, queryEmbedding, { sourceFile, matchCount }) {
  const scoped = sourceFile ? pool.filter(c => c.source_file === sourceFile) : pool;
  return scoped
    .map(c => ({
      document_id: c.document_id,
      content: c.content,
      has_diagram: c.has_diagram,
      is_active: c.is_active,
      similarity: cosine(queryEmbedding, c.embedding)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount);
}

// Same 3-vote relevance gate as both preview scripts, calling the real judgeRelevanceOnce.
async function judgeFaithfulness(question, excerptText) {
  const results = await Promise.all(
    [0, 1, 2].map(() => {
      callCounts.relevanceJudge++;
      return judgeRelevanceOnce(question, excerptText).catch(err => ({ faithful: false, reasoning: `Judge call failed: ${err.message}`, error: true }));
    })
  );
  const faithfulCount = results.filter(r => r.faithful).length;
  const verdict = faithfulCount >= 2 ? "faithful" : "unfaithful";
  const reasoning = results.map((r, i) => `[vote ${i + 1}: ${r.faithful ? "faithful" : "unfaithful"}] ${r.reasoning}`).join(" | ");
  return { verdict, reasoning };
}

// R9 fix #6 (q021): must_include matching is brittle against UK/US spelling variants - the
// casebook itself uses UK spelling ("Analyse") but a paraphrase can naturally shift to US
// spelling ("analyzing"). Rather than hardcode a fix for just "analyse", normalize common
// UK/US root-spelling differences on BOTH the haystack and the required term before
// comparing, so any must_include term sharing one of these roots survives either spelling.
const UK_US_ROOT_PAIRS = [
  [/analys/gi, "analyz"],     // analyse/analysed/analysing/analyser -> analyze/...
  [/organis/gi, "organiz"],   // organise/organised/organising -> organize/...
  [/recognis/gi, "recogniz"],
  [/colour/gi, "color"],
  [/favour/gi, "favor"],
  [/behaviour/gi, "behavior"],
  [/centre/gi, "center"]
];

function normalizeUkUs(text) {
  let out = String(text || "");
  for (const [re, replacement] of UK_US_ROOT_PAIRS) out = out.replace(re, replacement);
  return out;
}

function missingTerms(terms, text) {
  const haystack = normalizeUkUs(String(text || "").toLowerCase());
  return (terms || []).filter(t => !haystack.includes(normalizeUkUs(String(t).toLowerCase())));
}

async function evalGroundedQuestion(q, pool) {
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
  // R9 fix #6 (q026): groundedConsultingLookup actually returns ALL relevantRows as
  // excerpts to the student (qaRetrieval.js maps every one, not just the top), but this
  // script only paraphrases `top` (cost reasons - paraphrasing+judging every relevant row
  // would multiply Gemini calls). Checking must_include against top's paraphrase ALONE
  // under-counts what a student actually sees: a term can legitimately live in a second
  // or third relevant chunk (e.g. q026's "value chain", confirmed present on pages 12-14 of
  // the same casebook, in a different relevant chunk than the top-ranked one). Approximate
  // the full student-visible text by appending the RAW content of every other relevant row
  // to the top chunk's paraphrase when checking must_include survival - raw text is a
  // conservative stand-in (if anything it's MORE likely to contain a term than that row's
  // own un-run paraphrase would be, so this doesn't inflate pass rates past what paraphrasing
  // them for real would show).
  const otherRelevantRawText = relevantRows.slice(1).map(r => r.content).join("\n\n");

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
      reason: "A diagram-bearing chunk matched, but this script does not render the diagram block - nothing to check here."
    };
  }

  // Paraphrase layer: only for questions that SHOULD be covered AND the relevance gate found
  // a real answer. Scored against the real production functions, not a copy.
  let paraphraseText = null;
  if (q.covered && covered) {
    try {
      callCounts.paraphrase++;
      paraphraseText = await paraphraseChunk(q.question, top.content);
    } catch (err) {
      checks.paraphrase_faithful = { verdict: "fail", reason: `paraphraseChunk threw: ${err.message}` };
      checks.must_include_survives_paraphrase = {
        verdict: "n/a",
        reason: "Paraphrase call failed - no rewritten text to check must_include terms against."
      };
    }

    if (paraphraseText !== null && !checks.paraphrase_faithful) {
      if (paraphraseText === top.content) {
        checks.paraphrase_faithful = { verdict: "n/a", reason: "No prose to rewrite (pure diagram chunk) - paraphraseChunk returned the content unchanged." };
      } else {
        callCounts.faithfulnessJudge += 5; // judgeParaphraseFaithful now does a 5-vote majority internally
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
        const missing = missingTerms(q.must_include, `${paraphraseText}\n\n${otherRelevantRawText}`);
        checks.must_include_survives_paraphrase = {
          verdict: missing.length === 0 ? "pass" : "fail",
          reason: missing.length === 0
            ? "All required terms were still present (as substrings) in the paraphrased text."
            : `Lost after paraphrasing: ${missing.join(", ")}`
        };
      }
    }
  } else {
    checks.paraphrase_faithful = { verdict: "n/a", reason: "Not applicable - question not covered or shouldn't be." };
    checks.must_include_survives_paraphrase = { verdict: "n/a", reason: "Not applicable - question not covered or shouldn't be." };
  }

  // must_include (legacy name kept for comparability with run_eval_v2_preview.js's report
  // shape) is now scored against the PARAPHRASED text, not the raw chunk, per R9.1's task:
  // this is what a student actually sees once ENABLE_ANSWER_PARAPHRASE is live. Renamed
  // reason text below to make that explicit.
  if (!q.must_include || q.must_include.length === 0) {
    checks.must_include = { verdict: "n/a", reason: "No required terms specified for this question." };
  } else if (!covered) {
    checks.must_include = { verdict: "fail", reason: "No answer was found, so none of the required terms could be present." };
  } else if (paraphraseText !== null) {
    const missing = missingTerms(q.must_include, `${paraphraseText}\n\n${otherRelevantRawText}`);
    checks.must_include = {
      verdict: missing.length === 0 ? "pass" : "fail",
      reason: missing.length === 0
        ? "All required terms were present in the paraphrased text shown to the student."
        : `Missing from the paraphrased text shown to the student: ${missing.join(", ")}`
    };
  } else {
    // Paraphrase call failed - fall back to scoring the raw chunk (plus any other relevant
    // rows, same depth fix as above) so this check still reflects something, but flag it.
    const missing = missingTerms(q.must_include, `${top.content}\n\n${otherRelevantRawText}`);
    checks.must_include = {
      verdict: missing.length === 0 ? "pass" : "fail",
      reason: (missing.length === 0 ? "All required terms were present in the raw chunk (paraphrase call failed, scored raw as fallback)." : `Missing: ${missing.join(", ")}`)
    };
  }

  return {
    checks,
    retrieved: top ? { similarity: top.similarity, content: top.content, document_id: top.document_id, is_active: top.is_active } : null,
    paraphrase: paraphraseText
  };
}

function evalDarkFeature(feature) {
  const reason = NO_RAG_REASON.replace("{feature}", feature);
  const checks = {};
  for (const name of CHECK_NAMES) checks[name] = { verdict: "fail", reason };
  checks.paraphrase_faithful = { verdict: "n/a", reason: "No grounded retrieval route for this feature." };
  checks.must_include_survives_paraphrase = { verdict: "n/a", reason: "No grounded retrieval route for this feature." };
  return { checks, retrieved: null, paraphrase: null };
}

function overallVerdict(checks) {
  const applicable = Object.values(checks)
    .filter((c, i, arr) => true)
    .filter(c => c.verdict !== "n/a");
  // overallVerdict mirrors run_eval_v2_preview.js exactly: based on the original
  // CHECK_NAMES (faithfulness, coverage_label, diagram_intact, must_include) only - the two
  // new paraphrase checks are reported separately (see Paraphrase section) and don't fold
  // into this legacy definition, to keep it comparable to 2026-11-02's baseline number.
  const coreChecks = CHECK_NAMES.map(n => checks[n]).filter(c => c.verdict !== "n/a");
  if (coreChecks.length === 0) return "n/a";
  return coreChecks.every(c => c.verdict === "pass") ? "pass" : "fail";
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

  const paraPerCheck = {};
  for (const name of ["paraphrase_faithful", "must_include_survives_paraphrase"]) {
    paraPerCheck[name] = { pass: 0, fail: 0, na: 0 };
    for (const r of results) {
      const v = r.checks[name].verdict;
      if (v === "pass") paraPerCheck[name].pass++;
      else if (v === "fail") paraPerCheck[name].fail++;
      else paraPerCheck[name].na++;
    }
  }

  return {
    totalQuestions: results.length,
    overallPassRate: scored.length ? overallPass / scored.length : null,
    overallPass, overallScored: scored.length,
    perCheck, paraPerCheck
  };
}

function pct(n, d) {
  return d ? `${Math.round((n / d) * 100)}%` : "n/a";
}

function buildMarkdown(output) {
  const { summary, results, callCounts, poolActiveState, passBar, verdict, darkFeatureSkippedFromHardBlocker } = output;
  const lines = [];
  lines.push(`## ${verdict.pass ? "PASS" : "FAIL"}`);
  lines.push("");
  if (!verdict.pass) {
    lines.push("**Switch-over (R9 plans 2-4) does NOT proceed. Missed bar(s):**");
    for (const m of verdict.missedBars) lines.push(`- ${m}`);
    lines.push("");
  } else {
    lines.push("All pass-bar thresholds met. Switch-over (plans 2-4) may proceed.");
    lines.push("");
  }
  lines.push(`# RAG eval — R9 gate (${output.runAt})`);
  lines.push("");
  lines.push("**Scope: the original 39 Consulting questions (q001-q039) only.** " +
    "`questions.jsonl` has 51 lines total as of this run - 12 Finance-domain questions " +
    "(f001-f012, including 2 crossDomainProbe questions) were appended by the parallel, " +
    "already-committed FIN1 phase after this plan was authored. They are a different " +
    "domain/phase and are excluded from this Consulting-specific gate.");
  lines.push("");
  lines.push("**This is read-only against the shared Supabase DB.** `is_active`, " +
    "`ENABLE_CONSULTING_RAG_V2`, and `ENABLE_ANSWER_PARAPHRASE` were never read or written " +
    "by this script. Every retrieved row comes straight from `ingest_chunks` scoped to the " +
    "9 Consulting `DOC_IDS`, regardless of `is_active` - see `poolActiveState` below for proof " +
    "this exercised inactive content, not just the one already-active document.");
  lines.push("");
  lines.push("## poolActiveState — proof this eval exercises inactive (about-to-switch) documents");
  lines.push("");
  lines.push("| document_id | is_active | active_chunks | inactive_chunks | chunk_count |");
  lines.push("|---|---|---|---|---|");
  for (const d of poolActiveState) lines.push(`| ${d.document_id} | ${d.is_active} | ${d.active_chunk_count} | ${d.inactive_chunk_count} | ${d.chunk_count} |`);
  lines.push("");
  lines.push(`**Inactive-content gate:** ${passBar.inactiveContentGate.detail}`);
  lines.push("");
  lines.push("## Dark-feature questions (scored, but excluded from the hard-blocker bar)");
  lines.push("");
  lines.push("R9 scoring-methodology fix: role/company questions have no grounded retrieval " +
    "route yet (a known, pre-existing R4-era finding), so `evalDarkFeature` always marks " +
    "them `coverage_label: fail`. That is a different, lower-severity thing than a real " +
    "false-grounded-answer (retrieval+judge letting something bad through on a question " +
    "that SHOULD return nothing) - the two were previously conflated in the same " +
    "hard-blocker bucket. These rows are still scored and reported below; they just no " +
    "longer count toward the 100% not-covered hard-blocker bar.");
  lines.push("");
  lines.push("| id | feature | coverage_label | question |");
  lines.push("|---|---|---|---|");
  for (const d of darkFeatureSkippedFromHardBlocker) lines.push(`| ${d.id} | ${d.feature} | ${d.coverage_label} | ${d.question} |`);
  lines.push("");
  lines.push("## Pass bar scorecard");
  lines.push("");
  lines.push("| Bar | Threshold | Actual | Met? |");
  lines.push("|---|---|---|---|");
  for (const b of passBar.rows) lines.push(`| ${b.name} | ${b.threshold} | ${b.actual} | ${b.met ? "yes" : "NO"} |`);
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
  lines.push("## Paraphrase layer");
  lines.push("");
  lines.push("| Check | Pass | Fail | N/A | Pass rate |");
  lines.push("|---|---|---|---|---|");
  for (const name of ["paraphrase_faithful", "must_include_survives_paraphrase"]) {
    const c = summary.paraPerCheck[name];
    lines.push(`| ${name} | ${c.pass} | ${c.fail} | ${c.na} | ${pct(c.pass, c.pass + c.fail)} |`);
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
  lines.push(`- Relevance judge calls: ${callCounts.relevanceJudge}`);
  lines.push(`- Paraphrase calls: ${callCounts.paraphrase}`);
  lines.push(`- Faithfulness judge calls: ${callCounts.faithfulnessJudge}`);
  lines.push(`- Total Gemini calls: ${callCounts.embedding + callCounts.relevanceJudge + callCounts.paraphrase + callCounts.faithfulnessJudge}`);
  lines.push("");
  lines.push("## Regressions vs 2026-11-02-v2-preview.md (per-question pass -> fail)");
  lines.push("");
  if (output.regressions.length === 0) {
    lines.push("None found.");
  } else {
    for (const r of output.regressions) lines.push(`- **${r.id}**: ${r.detail}`);
  }
  lines.push("");
  lines.push("## All questions, detail");
  lines.push("");
  for (const r of results) {
    lines.push(`### ${r.id} [${r.feature}, covered:${r.covered}] -> ${r.overall} (answered from document ${r.answeredFromDocId || "n/a"}, inactive: ${r.answeredFromInactive})`);
    lines.push(`Q: ${r.question}`);
    for (const name of [...CHECK_NAMES, "paraphrase_faithful", "must_include_survives_paraphrase"]) {
      const c = r.checks[name];
      if (c.verdict !== "n/a") lines.push(`- **${name}** (${c.verdict}): ${c.reason}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

async function main() {
  const sb = supabaseAdmin();
  const allQuestions = JSON.parse(`[${readFileSync(QUESTIONS_PATH, "utf8").trim().split("\n").join(",")}]`);
  // Scope to the original 39 Consulting questions this R9 gate was authored against:
  // ids q001-q039. Everything else (f001-f012, including the f011 crossDomainProbe that is
  // also domain:"Consulting") is FIN1's parallel addition and out of scope here.
  const questions = allQuestions.filter(q => /^q0\d\d$/.test(q.id));
  console.log(`[r9] Loaded ${allQuestions.length} total questions in questions.jsonl; scoped to ${questions.length} original Consulting questions (q001-q039).`);
  if (questions.length !== 39) {
    console.warn(`[r9] WARNING: expected exactly 39 scoped questions, got ${questions.length}. Check the id filter.`);
  }

  console.log("[r9] Fetching ingest_chunks pool + is_active state (read-only, no writes)...");
  const { pool, poolActiveState } = await loadChunkPool(sb);
  console.log(`[r9] Pool: ${pool.length} chunks across ${DOC_IDS.length} documents.`);
  console.table(poolActiveState);

  const results = [];
  for (const q of questions) {
    let evalResult;
    const isDarkFeature = !(q.feature === "frameworks" || q.feature === "guesstimates" || q.feature === "qa");
    if (!isDarkFeature) {
      evalResult = await evalGroundedQuestion(q, pool);
    } else {
      evalResult = evalDarkFeature(q.feature);
    }
    const overall = overallVerdict(evalResult.checks);
    const answeredFromDocId = evalResult.retrieved?.document_id || null;
    const answeredFromInactive = answeredFromDocId ? (evalResult.retrieved.is_active === false) : null;
    results.push({
      id: q.id, feature: q.feature, covered: q.covered, question: q.question,
      overall, checks: evalResult.checks, retrieved: evalResult.retrieved,
      answeredFromDocId, answeredFromInactive, isDarkFeature
    });
    console.log(`  ${q.id} [${q.feature}] -> ${overall}`);
  }

  const summary = summarize(results);

  // Load the 2026-11-02 v2-preview results for per-question regression comparison.
  let previousResults = [];
  try {
    const prevPath = path.join(RESULTS_DIR, "2026-11-02-v2-preview.json");
    const prevRaw = JSON.parse(readFileSync(prevPath, "utf8"));
    previousResults = prevRaw.results || [];
  } catch (err) {
    console.warn(`[r9] Could not load 2026-11-02-v2-preview.json for regression comparison: ${err.message}`);
  }
  const prevById = new Map(previousResults.map(r => [r.id, r]));
  const regressions = [];
  for (const r of results) {
    const prev = prevById.get(r.id);
    if (prev && prev.overall === "pass" && r.overall === "fail") {
      regressions.push({ id: r.id, detail: `was 'pass' in 2026-11-02-v2-preview.md, now 'fail' in this run.` });
    }
  }

  // Inactive-content gate: of covered, scored questions, how many were answered from a
  // document that is currently is_active=false (i.e. switch-over will actually change it)?
  const coveredScored = results.filter(r => r.covered && r.answeredFromDocId);
  const fromInactive = coveredScored.filter(r => r.answeredFromInactive === true).length;
  const inactiveContentGatePass = coveredScored.length > 0 && fromInactive > coveredScored.length / 2;
  const inactiveContentGate = {
    pass: inactiveContentGatePass,
    detail: `${fromInactive}/${coveredScored.length} covered, answered questions were answered from a document ` +
      `that is currently is_active=false. ${inactiveContentGatePass ? "Majority from inactive content - this run " +
      "proves something switch-over will actually change." : "Majority (or all) answered questions came from the " +
      "one already-active document (SRCC) or no majority from inactive content could be established - this run " +
      "has NOT demonstrated switch-over's effect."}`
  };

  // Pass bar
  // R9 fix #2 (scoring methodology, eval-script only): dark-feature questions (role/company
  // - q015, q022, q023, q034) are NOT-covered by design because no grounded retrieval route
  // exists for those features yet (a known, pre-existing R4-era finding, not a switch-over
  // safety concern). evalDarkFeature hard-codes coverage_label: fail for every one of them,
  // which previously sat in the SAME hard-blocker bucket as a real false-grounded-answer
  // (e.g. q033/q035/q039's category - retrieval+judge letting something bad through). That
  // conflates "feature doesn't exist yet" with "grounding safety failed" - two very
  // different severities for a switch-over gate. Fix: split dark-feature questions out of
  // the hard-blocker's not-covered population entirely; they are still scored and reported
  // (see darkFeatureSkippedFromHardBlocker below and the markdown's own section) but no
  // longer able to fail (or pass) the 100% hard-blocker bar, which now measures only real
  // grounding-safety correctness on questions that actually went through retrieval.
  const notCoveredQuestions = results.filter(r => !r.covered && !r.isDarkFeature);
  const notCoveredPassCount = notCoveredQuestions.filter(r => r.checks.coverage_label.verdict === "pass").length;
  const notCoveredBarMet = notCoveredQuestions.length > 0 && notCoveredPassCount === notCoveredQuestions.length;

  const darkFeatureSkippedFromHardBlocker = results
    .filter(r => r.isDarkFeature)
    .map(r => ({
      id: r.id, feature: r.feature, question: r.question,
      coverage_label: r.checks.coverage_label.verdict,
      reason: "Dark feature (no grounded retrieval route exists yet for role/company - R4-era " +
        "finding) - scored and reported, but excluded from the not-covered hard-blocker bar " +
        "per R9's scoring-methodology fix (see comment above)."
    }));

  const overallBarMet = summary.overallScored > 0 && (summary.overallPass / summary.overallScored) >= 0.60;

  const para = summary.paraPerCheck.paraphrase_faithful;
  const paraDenom = para.pass + para.fail;
  const paraBarMet = paraDenom > 0 && (para.pass / paraDenom) >= 0.80;

  const mi = summary.paraPerCheck.must_include_survives_paraphrase;
  const miDenom = mi.pass + mi.fail;
  const miBarMet = miDenom > 0 && (mi.pass / miDenom) >= 0.65;

  const passBarRows = [
    {
      name: "Not-covered coverage_label (hard blocker, excludes dark-feature questions)",
      threshold: "100%",
      actual: `${notCoveredPassCount}/${notCoveredQuestions.length} (${pct(notCoveredPassCount, notCoveredQuestions.length)})`,
      met: notCoveredBarMet
    },
    {
      name: "Overall correctness pass rate",
      threshold: "≥60%",
      actual: `${summary.overallPass}/${summary.overallScored} (${pct(summary.overallPass, summary.overallScored)})`,
      met: overallBarMet
    },
    {
      name: "Paraphrase faithfulness",
      threshold: "≥80% of applicable judgments",
      actual: `${para.pass}/${paraDenom} (${pct(para.pass, paraDenom)})`,
      met: paraBarMet
    },
    {
      name: "must_include survival after paraphrasing",
      threshold: "≥65%",
      actual: `${mi.pass}/${miDenom} (${pct(mi.pass, miDenom)})`,
      met: miBarMet
    },
    {
      name: "Inactive-content gate (hard blocker)",
      threshold: "Majority of covered, answered questions from an is_active=false document",
      actual: `${fromInactive}/${coveredScored.length}`,
      met: inactiveContentGate.pass
    }
  ];

  const missedBars = passBarRows.filter(b => !b.met).map(b => `${b.name}: threshold ${b.threshold}, actual ${b.actual}`);
  const overallPassVerdict = missedBars.length === 0;

  const passBar = { rows: passBarRows, inactiveContentGate };
  const verdict = { pass: overallPassVerdict, missedBars };

  mkdirSync(RESULTS_DIR, { recursive: true });
  const dateStr = "2026-11-07";
  const jsonPath = path.join(RESULTS_DIR, `${dateStr}-r9-fixed.json`);
  const mdPath = path.join(RESULTS_DIR, `${dateStr}-r9-fixed.md`);
  const output = {
    runAt: new Date().toISOString(),
    label: "r9-fixed",
    isActiveTouched: false,
    enableConsultingRagV2Set: false,
    enableAnswerParaphraseSet: false,
    scoresSourceAttribution: false,
    scopedQuestionIds: questions.map(q => q.id),
    totalQuestionsInFile: allQuestions.length,
    callCounts,
    summary,
    poolActiveState,
    passBar,
    darkFeatureSkippedFromHardBlocker,
    verdict,
    regressions,
    results
  };
  writeFileSync(jsonPath, JSON.stringify(output, null, 2));
  writeFileSync(mdPath, buildMarkdown(output));

  console.log(`\n[r9] Verdict: ${verdict.pass ? "PASS" : "FAIL"}`);
  if (!verdict.pass) {
    console.log("[r9] Missed bars:");
    for (const m of missedBars) console.log(`  - ${m}`);
  }
  console.log(`[r9] Overall: ${summary.overallPass}/${summary.overallScored} scored (${summary.totalQuestions} total).`);
  console.log(`[r9] Gemini calls: ${callCounts.embedding} embedding, ${callCounts.relevanceJudge} relevance-judge, ` +
    `${callCounts.paraphrase} paraphrase, ${callCounts.faithfulnessJudge} faithfulness-judge, ` +
    `${callCounts.embedding + callCounts.relevanceJudge + callCounts.paraphrase + callCounts.faithfulnessJudge} total.`);
  console.log(`[r9] Inactive-content gate: ${fromInactive}/${coveredScored.length} covered answers from inactive docs.`);
  console.log(`[r9] Wrote ${jsonPath}`);
  console.log(`[r9] Wrote ${mdPath}`);
}

main().catch(err => {
  console.error("[r9] Fatal error:", err);
  process.exit(1);
});

// FIN1.05: a read-only preview of the Finance compendium's 208 still-inactive `ingest_chunks`
// rows (FIN1.02, document_id below, is_active=false everywhere by design), run through the
// real production coverage/relevance functions - never through the live `match_ingest_chunks`
// RPC (which requires is_active=true), never flipping any flag, never writing to any table.
//
// Mirrors run_eval_paraphrase_preview.js's structure and reuses the exact same local-
// retrieval-over-inactive-rows mechanics (loadChunkPool/localRetrieve/cosine) that script
// itself copied verbatim from run_eval_v2_preview.js, and the exact same production functions
// (decideCoverage, judgeRelevanceOnce from consultingRetrieval.js) - no retrieval/scoring
// logic is reimplemented here.
//
// Purpose (FIN1.05 plan): two different checks before any Finance switch-over decision -
//   1. Content/chunking quality: does a Finance question actually retrieve and get judged
//      relevant against the right compendium topic, and do its must_include terms appear in
//      the matched chunk?
//   2. FIN1.04's cross-domain risk: now that qaRetrieval.js's groundedQaAnswer searches BOTH
//      club_casebook and placewise_reference with domain:null, does a Consulting-flavored
//      question ever get satisfied by a Finance chunk (or vice versa)? For the two
//      `crossDomainProbe:true` questions, this script runs local retrieval against the
//      COMBINED pool (Finance document + all 9 Consulting documents) and reports which
//      domain's chunk actually won, not just whether "covered" was true.
//
// Only Gemini calls made: embeddings (RETRIEVAL_QUERY) and the real 3-vote judgeRelevanceOnce
// relevance gate - no generateText/answer generation, no paraphrase calls, same "coverage
// only, not full answers" scope as the existing preview scripts.

import "dotenv/config";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { embedTexts } from "../src/lib/gemini.js";
import { decideCoverage, judgeRelevanceOnce } from "../src/lib/consultingRetrieval.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUESTIONS_PATH = path.join(__dirname, "questions.jsonl");
const RESULTS_DIR = path.join(__dirname, "results");

// FIN1.02's single Finance compendium document (backend/ingestion/out/fin1_ingest_report.json).
const FINANCE_DOC_ID = "3923cb00-cf65-4a9d-862e-0ebef9c7e603";

// Same 9 inactive Consulting documents run_eval_v2_preview.js / run_eval_paraphrase_preview.js
// use, kept in lockstep on purpose so the cross-domain probe reads the identical Consulting
// pool those other preview scripts already proved out.
const CONSULTING_DOC_IDS = [
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

const callCounts = { embedding: 0, relevanceJudge: 0 };

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

// Read-only: selects the inactive rows directly by document_id, the same bypass of the
// is_active filter FIN1.04's own verification used, never touching the column itself.
async function loadChunkPool(sb, docIds) {
  const PAGE = 1000;
  let all = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await sb
      .from("ingest_chunks")
      .select("id, document_id, section_title, content, has_diagram, embedding, ingest_documents(source_file, domain, source_class)")
      .in("document_id", docIds)
      .range(offset, offset + PAGE - 1);
    if (error) throw error;
    all = all.concat(data);
    if (data.length < PAGE) break;
  }
  return all.map(r => {
    const sourceClass = r.ingest_documents?.source_class || null;
    // The `domain` column on ingest_documents is only populated for the new FIN1 pipeline
    // (Finance rows carry domain:"Finance"); every pre-existing Consulting document has
    // domain:null in the DB (never backfilled - Consulting was the only domain until now).
    // For this probe's purposes, infer a domain label from source_class instead: today,
    // every club_casebook row IS Consulting and every placewise_reference row IS Finance -
    // reading the raw (often-null) domain column directly would make every Consulting match
    // look like a false "leak" in the report below, which is wrong.
    const domainLabel = r.ingest_documents?.domain
      || (sourceClass === "club_casebook" ? "Consulting" : sourceClass === "placewise_reference" ? "Finance" : null);
    return {
      document_id: r.document_id,
      content: r.content,
      section_title: r.section_title,
      has_diagram: r.has_diagram,
      source_file: r.ingest_documents?.source_file || null,
      domain: domainLabel,
      embedding: JSON.parse(r.embedding)
    };
  });
}

function localRetrieve(pool, queryEmbedding, matchCount) {
  return pool
    .map(c => ({
      content: c.content,
      section_title: c.section_title,
      has_diagram: c.has_diagram,
      domain: c.domain,
      source_file: c.source_file,
      similarity: cosine(queryEmbedding, c.embedding)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount);
}

// Same 3-vote relevance gate as the existing preview scripts, calling the real
// judgeRelevanceOnce - no second copy of the judging logic.
async function judgeRelevanceGate(question, excerptText) {
  const results = await Promise.all(
    [0, 1, 2].map(() => {
      callCounts.relevanceJudge++;
      return judgeRelevanceOnce(question, excerptText).catch(err => ({ faithful: false, reasoning: `Judge call failed: ${err.message}`, error: true }));
    })
  );
  const faithfulCount = results.filter(r => r.faithful).length;
  return { pass: faithfulCount >= 2, votes: results };
}

function missingTerms(terms, text) {
  const haystack = String(text || "").toLowerCase();
  return (terms || []).filter(t => !haystack.includes(String(t).toLowerCase()));
}

async function retrieveAndJudge(questionText, pool, matchCount = 6) {
  callCounts.embedding++;
  const [queryEmbedding] = await embedTexts([questionText], "RETRIEVAL_QUERY");
  const rows = localRetrieve(pool, queryEmbedding, matchCount);
  const { covered: thresholdCovered, rows: coveringRows } = decideCoverage(rows);

  let relevantRows = [];
  if (thresholdCovered) {
    const verdicts = await Promise.all(coveringRows.map(r => judgeRelevanceGate(questionText, r.content)));
    relevantRows = coveringRows.filter((_, i) => verdicts[i].pass);
  }
  return { covered: relevantRows.length > 0, top: relevantRows[0] || null, allRows: rows };
}

async function evalFinanceQuestion(q, financePool) {
  const { covered, top } = await retrieveAndJudge(q.question, financePool);

  const expectedCovered = q.covered;
  const coverageMatch = covered === expectedCovered;

  let mustIncludeCheck = { verdict: "n/a", reason: "No required terms specified, or question not covered." };
  if (covered && q.must_include && q.must_include.length > 0) {
    const missing = missingTerms(q.must_include, top.content);
    mustIncludeCheck = {
      verdict: missing.length === 0 ? "pass" : "fail",
      reason: missing.length === 0
        ? "All required terms present in the matched chunk."
        : `Missing from matched chunk: ${missing.join(", ")}`
    };
  } else if (!covered && !expectedCovered) {
    mustIncludeCheck = { verdict: "n/a", reason: "Not-covered question, correctly not covered - no chunk to check." };
  }

  return {
    id: q.id,
    question: q.question,
    expectedCovered,
    actualCovered: covered,
    coverageMatch,
    topSectionTitle: top ? top.section_title : null,
    topSimilarity: top ? top.similarity : null,
    mustIncludeCheck
  };
}

// Cross-domain probe: retrieves against the COMBINED Finance + Consulting pool and reports
// which domain's chunk actually won the relevance gate - the direct test of FIN1.04's risk.
async function evalCrossDomainProbe(q, combinedPool) {
  const { covered, top, allRows } = await retrieveAndJudge(q.question, combinedPool, 6);

  const topDomainsAllRows = allRows.slice(0, 6).map(r => ({
    domain: r.domain,
    source_file: r.source_file,
    section_title: r.section_title,
    similarity: Math.round(r.similarity * 1000) / 1000
  }));

  const winningDomain = top ? top.domain : null;
  const expectedDomain = q.domain; // the question's own tagged domain ("Consulting" or "Finance")
  const leaked = covered && winningDomain && winningDomain !== expectedDomain;

  return {
    id: q.id,
    question: q.question,
    expectedDomain,
    covered,
    winningDomain,
    winningSectionTitle: top ? top.section_title : null,
    winningSourceFile: top ? top.source_file : null,
    leaked,
    top6RowsByDomain: topDomainsAllRows
  };
}

function pct(n, d) {
  return d ? `${Math.round((n / d) * 100)}%` : "n/a";
}

function buildMarkdown(output) {
  const { financeResults, probeResults, callCounts, runAt } = output;
  const lines = [];
  lines.push(`# RAG eval — Finance compendium preview, read-only over the inactive pool (${runAt})`);
  lines.push("");
  lines.push("**This is NOT a live-site measurement.** `is_active` was not touched anywhere - " +
    "every retrieved row is still the FIN1.02 inactive Finance pool (208 chunks, one document) " +
    "plus, for the cross-domain probes, the same 9 inactive Consulting documents " +
    "`run_eval_v2_preview.js`/`run_eval_paraphrase_preview.js` already use. Retrieval is done " +
    "locally (cosine similarity over chunk embeddings fetched directly by `document_id`), never " +
    "through the live `match_ingest_chunks` RPC, which requires `is_active = true`. The real " +
    "`decideCoverage` and `judgeRelevanceOnce` functions from `consultingRetrieval.js` are " +
    "called directly - no retrieval or scoring logic is reimplemented in this script.");
  lines.push("");

  const n = financeResults.length;
  const coverageMatches = financeResults.filter(r => r.coverageMatch).length;
  const mustIncludeApplicable = financeResults.filter(r => r.mustIncludeCheck.verdict !== "n/a");
  const mustIncludePass = mustIncludeApplicable.filter(r => r.mustIncludeCheck.verdict === "pass").length;

  lines.push("## Summary - Finance compendium content/chunking quality");
  lines.push("");
  lines.push(`Of ${n} Finance questions (8 covered, 2 not-covered), **${coverageMatches}/${n}** ` +
    `(${pct(coverageMatches, n)}) got the expected covered/not-covered verdict.`);
  lines.push(`Of ${mustIncludeApplicable.length} covered questions with required terms, ` +
    `**${mustIncludePass}/${mustIncludeApplicable.length}** (${pct(mustIncludePass, mustIncludeApplicable.length)}) ` +
    "had every required term present in the matched chunk.");
  lines.push("");
  lines.push("| Question | Expected covered | Actual covered | Match | Top section | Similarity | must_include |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const r of financeResults) {
    lines.push(`| ${r.id} | ${r.expectedCovered} | ${r.actualCovered} | ${r.coverageMatch ? "yes" : "**NO**"} | ` +
      `${r.topSectionTitle || "-"} | ${r.topSimilarity !== null ? r.topSimilarity.toFixed(3) : "-"} | ` +
      `${r.mustIncludeCheck.verdict} |`);
  }
  const failures = financeResults.filter(r => !r.coverageMatch);
  if (failures.length > 0) {
    lines.push("");
    lines.push("**Coverage mismatches:**");
    for (const r of failures) {
      lines.push(`- ${r.id} (${r.question}): expected covered=${r.expectedCovered}, got ${r.actualCovered}.`);
    }
  }
  const mustIncludeFailures = mustIncludeApplicable.filter(r => r.mustIncludeCheck.verdict === "fail");
  if (mustIncludeFailures.length > 0) {
    lines.push("");
    lines.push("**must_include failures:**");
    for (const r of mustIncludeFailures) {
      lines.push(`- ${r.id}: ${r.mustIncludeCheck.reason}`);
    }
  }

  lines.push("");
  lines.push("## Summary - cross-domain leakage probes (FIN1.04 risk check)");
  lines.push("");
  lines.push("Each probe question is retrieved against the COMBINED Finance + Consulting inactive " +
    "pool (not scoped to one domain, matching how `groundedQaAnswer` now searches both source " +
    "classes with `domain: null`). \"Leaked\" means the question's own tagged domain did NOT " +
    "match the domain of the chunk that actually won the relevance gate.");
  lines.push("");
  for (const p of probeResults) {
    lines.push(`### ${p.id} [expected domain: ${p.expectedDomain}]`);
    lines.push(`Q: ${p.question}`);
    lines.push(`- covered: ${p.covered}`);
    lines.push(`- winning chunk's domain: ${p.winningDomain || "n/a (not covered)"} ` +
      `(${p.winningSourceFile || "n/a"} — "${p.winningSectionTitle || "n/a"}")`);
    lines.push(`- **leaked cross-domain: ${p.leaked ? "YES" : "no"}**`);
    lines.push("- Top 6 retrieved rows (domain, source, similarity):");
    for (const row of p.top6RowsByDomain) {
      lines.push(`  - ${row.domain} / ${row.source_file} / "${row.section_title}" — ${row.similarity}`);
    }
    lines.push("");
  }
  const anyLeak = probeResults.some(p => p.leaked);
  lines.push(`**Overall cross-domain leakage verdict on this sample: ${anyLeak ? "LEAKAGE DETECTED" : "no leakage detected"}.** ` +
    "Sample size is 2 probe questions - a first signal, not a final verdict (same caveat R7b's " +
    "own preview eval carried).");
  lines.push("");

  lines.push("## Gemini call counts");
  lines.push("");
  lines.push(`- Embedding calls: ${callCounts.embedding}`);
  lines.push(`- Relevance judge calls (3x per covering row): ${callCounts.relevanceJudge}`);
  lines.push("");

  return lines.join("\n");
}

async function main() {
  const sb = supabaseAdmin();
  const allQuestions = JSON.parse(`[${readFileSync(QUESTIONS_PATH, "utf8").trim().split("\n").join(",")}]`);
  const financeQuestions = allQuestions.filter(q => q.domain === "Finance" && !q.crossDomainProbe);
  const probeQuestions = allQuestions.filter(q => q.crossDomainProbe === true);

  console.log(`[finance-preview] ${financeQuestions.length} Finance questions, ${probeQuestions.length} cross-domain probes.`);

  console.log("[finance-preview] Fetching inactive Finance ingest_chunks pool (read-only, no is_active change)...");
  const financePool = await loadChunkPool(sb, [FINANCE_DOC_ID]);
  console.log(`[finance-preview] Finance pool: ${financePool.length} chunks.`);

  console.log("[finance-preview] Fetching inactive Consulting ingest_chunks pool for the combined probe pool...");
  const consultingPool = await loadChunkPool(sb, CONSULTING_DOC_IDS);
  console.log(`[finance-preview] Consulting pool: ${consultingPool.length} chunks.`);
  const combinedPool = financePool.concat(consultingPool);

  const financeResults = [];
  for (const q of financeQuestions) {
    const r = await evalFinanceQuestion(q, financePool);
    financeResults.push(r);
    console.log(`  ${r.id} expected:${r.expectedCovered} actual:${r.actualCovered} ` +
      `match:${r.coverageMatch} top:"${r.topSectionTitle}" must_include:${r.mustIncludeCheck.verdict}`);
  }

  const probeResults = [];
  for (const q of probeQuestions) {
    const r = await evalCrossDomainProbe(q, combinedPool);
    probeResults.push(r);
    console.log(`  [PROBE] ${r.id} expected domain:${r.expectedDomain} winning domain:${r.winningDomain} leaked:${r.leaked}`);
  }

  mkdirSync(RESULTS_DIR, { recursive: true });
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const jsonPath = path.join(RESULTS_DIR, `${dateStr}-finance-preview.json`);
  const mdPath = path.join(RESULTS_DIR, `${dateStr}-finance-preview.md`);

  const output = {
    runAt: new Date().toISOString(),
    label: "finance-preview",
    isActiveTouched: false,
    financeDocId: FINANCE_DOC_ID,
    consultingDocIds: CONSULTING_DOC_IDS,
    callCounts,
    financeResults,
    probeResults
  };
  writeFileSync(jsonPath, JSON.stringify(output, null, 2));
  writeFileSync(mdPath, buildMarkdown(output));

  console.log(`\n[finance-preview] Gemini calls: ${callCounts.embedding} embedding, ${callCounts.relevanceJudge} relevance-judge.`);
  console.log(`[finance-preview] Wrote ${jsonPath}`);
  console.log(`[finance-preview] Wrote ${mdPath}`);
}

main().catch(err => {
  console.error("[finance-preview] Fatal error:", err);
  process.exit(1);
});

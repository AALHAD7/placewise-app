// D1.4: a read-only preview of the PM compendium's 159 still-inactive `ingest_chunks` rows
// (D1.2, document_id below, is_active=false everywhere by design), run through the real
// production coverage/relevance functions - never through the live `match_ingest_chunks` RPC
// (which requires is_active=true), never flipping any flag, never writing to any table.
//
// Mirrors run_eval_finance_preview.js's structure (which itself copied run_eval_v2_preview.js's
// local-retrieval-over-inactive-rows mechanics verbatim) and the same production functions
// (decideCoverage, judgeRelevanceOnce from consultingRetrieval.js) - no retrieval/scoring logic
// is reimplemented here.
//
// Purpose (D1.4 plan): two different checks before any PM switch-over decision (out of scope,
// Aalhad's separate call) -
//   1. Content/chunking quality: does a PM question actually retrieve and get judged relevant
//      against the right compendium topic, and do its must_include terms appear in the matched
//      chunk?
//   2. D1.3's cross-domain risk check: now that qaRetrieval.js's groundedQaAnswer searches
//      club_casebook AND placewise_reference with domain:null across Consulting, Finance AND
//      Prodman all at once, a PM-phrased question must not get answered from a Consulting or
//      Finance chunk, and vice versa. Unlike FIN1.05's 2-way pool, this runs a 3-way pool
//      (Consulting + Finance + Prodman) for every `crossDomainProbe:true` question in
//      questions.jsonl (the existing f011/f012 Consulting/Finance pair plus D1.4's new
//      pm016/pm017 PM/Consulting pair).
//
// Only Gemini calls made: embeddings (RETRIEVAL_QUERY) and the real 3-vote judgeRelevanceOnce
// relevance gate - no generateText/answer generation, no paraphrase calls, same "coverage only,
// not full answers" scope as every other preview script in this directory.

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

// D1.2's single PM compendium document (backend/ingestion/out/d1_ingest_report.json).
const PM_DOC_ID = "8976a3ed-b80f-4c4c-aefc-217575984824";

// FIN1.05's single Finance compendium document.
const FINANCE_DOC_ID = "3923cb00-cf65-4a9d-862e-0ebef9c7e603";

// The same 9 inactive Consulting documents run_eval_v2_preview.js / run_eval_paraphrase_preview.js
// / run_eval_finance_preview.js use, kept in lockstep on purpose.
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
// is_active filter every preview script in this directory uses, never touching the column.
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
    // ingest_documents.domain is populated for the FIN1/D1 pipelines (Finance rows carry
    // domain:"Finance", PM rows carry domain:"Prodman"); pre-existing Consulting documents
    // carry domain:null (never backfilled). Fall back to source_class only when domain is
    // null, so every row still gets an accurate label for the leakage report below.
    const domainLabel = r.ingest_documents?.domain
      || (sourceClass === "club_casebook" ? "Consulting" : null);
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

// Same 3-vote relevance gate as every other preview script, calling the real
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

async function evalPmQuestion(q, pmPool) {
  const { covered, top } = await retrieveAndJudge(q.question, pmPool);

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

// Cross-domain probe: retrieves against the COMBINED Consulting + Finance + Prodman pool and
// reports which domain's chunk actually won the relevance gate - the direct test of D1.3's risk.
async function evalCrossDomainProbe(q, combinedPool) {
  const { covered, top, allRows } = await retrieveAndJudge(q.question, combinedPool, 6);

  const topDomainsAllRows = allRows.slice(0, 6).map(r => ({
    domain: r.domain,
    source_file: r.source_file,
    section_title: r.section_title,
    similarity: Math.round(r.similarity * 1000) / 1000
  }));

  const winningDomain = top ? top.domain : null;
  const expectedDomain = q.domain; // the question's own tagged domain ("Consulting"/"Finance"/"Prodman")
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
  const { pmResults, probeResults, callCounts, runAt } = output;
  const lines = [];
  lines.push(`# RAG eval — PM compendium preview, read-only over the inactive pool (${runAt})`);
  lines.push("");
  lines.push("**This is NOT a live-site measurement.** `is_active` was not touched anywhere - " +
    "every retrieved row is still the D1.2 inactive PM pool (159 chunks, one document) plus, for " +
    "the cross-domain probes, the same 9 inactive Consulting documents and the FIN1.02 inactive " +
    "Finance document every other preview script in this directory already uses. Retrieval is " +
    "done locally (cosine similarity over chunk embeddings fetched directly by `document_id`), " +
    "never through the live `match_ingest_chunks` RPC, which requires `is_active = true`. The " +
    "real `decideCoverage` and `judgeRelevanceOnce` functions from `consultingRetrieval.js` are " +
    "called directly - no retrieval or scoring logic is reimplemented in this script.");
  lines.push("");

  const n = pmResults.length;
  const coverageMatches = pmResults.filter(r => r.coverageMatch).length;
  const mustIncludeApplicable = pmResults.filter(r => r.mustIncludeCheck.verdict !== "n/a");
  const mustIncludePass = mustIncludeApplicable.filter(r => r.mustIncludeCheck.verdict === "pass").length;
  const nCovered = pmResults.filter(r => r.expectedCovered).length;
  const nNotCovered = n - nCovered;

  lines.push("## Summary - PM compendium content/chunking quality");
  lines.push("");
  lines.push(`Of ${n} PM questions (${nCovered} covered, ${nNotCovered} not-covered), **${coverageMatches}/${n}** ` +
    `(${pct(coverageMatches, n)}) got the expected covered/not-covered verdict.`);
  lines.push(`Of ${mustIncludeApplicable.length} covered questions with required terms, ` +
    `**${mustIncludePass}/${mustIncludeApplicable.length}** (${pct(mustIncludePass, mustIncludeApplicable.length)}) ` +
    "had every required term present in the matched chunk.");
  lines.push("");
  lines.push("| Question | Expected covered | Actual covered | Match | Top section | Similarity | must_include |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const r of pmResults) {
    lines.push(`| ${r.id} | ${r.expectedCovered} | ${r.actualCovered} | ${r.coverageMatch ? "yes" : "**NO**"} | ` +
      `${r.topSectionTitle || "-"} | ${r.topSimilarity !== null ? r.topSimilarity.toFixed(3) : "-"} | ` +
      `${r.mustIncludeCheck.verdict} |`);
  }
  const failures = pmResults.filter(r => !r.coverageMatch);
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
  lines.push("## Summary - cross-domain leakage probes (D1.3 risk check, 3-way pool)");
  lines.push("");
  lines.push("Each probe question is retrieved against the COMBINED Consulting + Finance + Prodman " +
    "inactive pool (not scoped to one domain, matching how `groundedQaAnswer` now searches all " +
    "source classes with `domain: null`). \"Leaked\" means the question's own tagged domain did " +
    "NOT match the domain of the chunk that actually won the relevance gate.");
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
    "Sample size is 4 probe questions - a first signal, not a final verdict (same caveat every " +
    "prior preview eval in this project has carried).");
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
  const pmQuestions = allQuestions.filter(q => q.domain === "Prodman" && !q.crossDomainProbe);
  const probeQuestions = allQuestions.filter(q => q.crossDomainProbe === true);

  console.log(`[pm-preview] ${pmQuestions.length} PM questions, ${probeQuestions.length} cross-domain probes (3-way pool).`);

  console.log("[pm-preview] Fetching inactive PM ingest_chunks pool (read-only, no is_active change)...");
  const pmPool = await loadChunkPool(sb, [PM_DOC_ID]);
  console.log(`[pm-preview] PM pool: ${pmPool.length} chunks.`);

  console.log("[pm-preview] Fetching inactive Consulting + Finance ingest_chunks pools for the combined 3-way probe pool...");
  const consultingPool = await loadChunkPool(sb, CONSULTING_DOC_IDS);
  const financePool = await loadChunkPool(sb, [FINANCE_DOC_ID]);
  console.log(`[pm-preview] Consulting pool: ${consultingPool.length} chunks. Finance pool: ${financePool.length} chunks.`);
  const combinedPool = pmPool.concat(consultingPool, financePool);

  const pmResults = [];
  for (const q of pmQuestions) {
    const r = await evalPmQuestion(q, pmPool);
    pmResults.push(r);
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
  const jsonPath = path.join(RESULTS_DIR, `${dateStr}-pm-preview.json`);
  const mdPath = path.join(RESULTS_DIR, `${dateStr}-pm-preview.md`);

  const output = {
    runAt: new Date().toISOString(),
    label: "pm-preview",
    isActiveTouched: false,
    pmDocId: PM_DOC_ID,
    financeDocId: FINANCE_DOC_ID,
    consultingDocIds: CONSULTING_DOC_IDS,
    callCounts,
    pmResults,
    probeResults
  };
  writeFileSync(jsonPath, JSON.stringify(output, null, 2));
  writeFileSync(mdPath, buildMarkdown(output));

  console.log(`\n[pm-preview] Gemini calls: ${callCounts.embedding} embedding, ${callCounts.relevanceJudge} relevance-judge.`);
  console.log(`[pm-preview] Wrote ${jsonPath}`);
  console.log(`[pm-preview] Wrote ${mdPath}`);
}

main().catch(err => {
  console.error("[pm-preview] Fatal error:", err);
  process.exit(1);
});

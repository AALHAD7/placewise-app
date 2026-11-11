// R7: pure-logic coverage for consultingRetrieval.js (match_ingest_chunks' two
// consumers - the coverage decision and citation shape). No network, no
// Gemini, no Supabase call - same cost-conscious tier as skillContent.test.js's
// harness tests. The I/O wrapper (retrieveConsultingChunks) is intentionally
// not exercised here: it is a thin try/catch around embedTexts + supabase.rpc,
// already covered logically by that resilience posture, same as
// frameworksGrounding.js's existing findGrounding.
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test-gemini-key";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://fake-supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-supabase-key";

import {
  decideCoverage,
  buildCitation,
  retrieveConsultingChunks,
  excludeRowsBySourceFile,
  SIMILARITY_THRESHOLD,
  DIAGRAM_SIMILARITY_THRESHOLD,
  AI_FALLBACK_LABEL,
  stripCasebookFooterArtifacts,
  containsSourceAttribution,
  stripAttributionSentences
} from "../src/lib/consultingRetrieval.js";

// --- decideCoverage ---

test("decideCoverage: a text row at/above the plain threshold is covered", () => {
  const { covered, rows } = decideCoverage([
    { content: "a", similarity: SIMILARITY_THRESHOLD, has_diagram: false }
  ]);
  assert.equal(covered, true);
  assert.equal(rows.length, 1);
});

test("decideCoverage: a text row just below the plain threshold is not covered", () => {
  const { covered, rows } = decideCoverage([
    { content: "a", similarity: SIMILARITY_THRESHOLD - 0.01, has_diagram: false }
  ]);
  assert.equal(covered, false);
  assert.equal(rows.length, 0);
});

test("decideCoverage: a diagram row between the two thresholds is excluded (needs the higher bar)", () => {
  const { covered, rows } = decideCoverage([
    { content: "a", similarity: (SIMILARITY_THRESHOLD + DIAGRAM_SIMILARITY_THRESHOLD) / 2, has_diagram: true }
  ]);
  assert.equal(covered, false);
  assert.equal(rows.length, 0);
});

test("decideCoverage: a diagram row at/above its own threshold is covered", () => {
  const { covered, rows } = decideCoverage([
    { content: "a", similarity: DIAGRAM_SIMILARITY_THRESHOLD, has_diagram: true }
  ]);
  assert.equal(covered, true);
  assert.equal(rows.length, 1);
});

test("decideCoverage: mixed rows keep only the ones clearing their own bar", () => {
  const rows = [
    { content: "text-pass", similarity: 0.9, has_diagram: false },
    { content: "text-fail", similarity: 0.2, has_diagram: false },
    { content: "diagram-pass", similarity: 0.9, has_diagram: true },
    { content: "diagram-fail", similarity: 0.55, has_diagram: true } // above text bar, below diagram bar
  ];
  const { covered, rows: kept } = decideCoverage(rows);
  assert.equal(covered, true);
  assert.deepEqual(kept.map(r => r.content).sort(), ["diagram-pass", "text-pass"]);
});

test("decideCoverage: empty/undefined input is not covered, never throws", () => {
  assert.equal(decideCoverage([]).covered, false);
  assert.equal(decideCoverage(undefined).covered, false);
});

// --- excludeRowsBySourceFile ---
// Added 2026-11-07 (live-bug fix): MECE's Frameworks page was showing a cached
// grounded_image whose real content was from the unrelated SRCC Guesstimates Book -
// same domain ("Consulting") as every real case-cracking casebook, so filter_domain alone
// can't keep it out. This is the client-side exclusion filter frameworksGrounding.js now
// applies to keep that book out of Frameworks' results specifically.

test("excludeRowsBySourceFile: drops rows whose source_file is excluded", () => {
  const rows = [
    { source_file: "SRCC Guesstimates-Book-Volume-1-6.pdf", content: "guesstimate" },
    { source_file: "The FMS Consulting CaseBook 2023-24.pdf", content: "case" }
  ];
  const kept = excludeRowsBySourceFile(rows, ["SRCC Guesstimates-Book-Volume-1-6.pdf"]);
  assert.deepEqual(kept.map(r => r.source_file), ["The FMS Consulting CaseBook 2023-24.pdf"]);
});

test("excludeRowsBySourceFile: no-op when excludeSourceFiles is empty/undefined", () => {
  const rows = [{ source_file: "a.pdf" }, { source_file: "b.pdf" }];
  assert.deepEqual(excludeRowsBySourceFile(rows, undefined), rows);
  assert.deepEqual(excludeRowsBySourceFile(rows, []), rows);
});

test("excludeRowsBySourceFile: handles undefined/empty rows without throwing", () => {
  assert.deepEqual(excludeRowsBySourceFile(undefined, ["a.pdf"]), []);
  assert.deepEqual(excludeRowsBySourceFile([], ["a.pdf"]), []);
});

// --- stripCasebookFooterArtifacts ---
// Added 2026-11-11 (live-bug fix): the FMS Consulting Club casebook's running PDF
// header/footer template was leaking verbatim into rendered Frameworks/Q&A text (MECE's
// page showed "The Consulting Club", "© The Consulting Club, FMS Delhi 2023-24 30" and
// "Main Index"). Confirmed in the stored ingest_chunks row for MECE
// (id bff0d88e-75d8-48d9-b154-0e07b3519022) - these fixtures are copied from that row.

test("stripCasebookFooterArtifacts: strips the MECE chunk's exact multi-line footer (copyright + year + page + Main Index)", () => {
  const content =
    "The MECE principle suggests sorting options into categories.\n\n" +
    "© The Consulting Club, FMS Delhi\n2023-24\n30\n\nMain Index";
  const cleaned = stripCasebookFooterArtifacts(content);
  assert.equal(cleaned, "The MECE principle suggests sorting options into categories.");
  assert.ok(!cleaned.includes("©"));
  assert.ok(!cleaned.includes("Main Index"));
  assert.ok(!cleaned.includes("2023-24"));
});

test("stripCasebookFooterArtifacts: strips the standalone 'The Consulting Club' header line right after a heading", () => {
  const content = "# MECE Segmentation\n\nThe Consulting Club\n\nMECE = Mutually Exclusive Collectively Exhaustive";
  const cleaned = stripCasebookFooterArtifacts(content);
  assert.equal(cleaned, "# MECE Segmentation\n\nMECE = Mutually Exclusive Collectively Exhaustive");
});

test("stripCasebookFooterArtifacts: strips the single-line pipe-separated copyright+year+page variant", () => {
  const content = "Consultants can pinpoint challenges.\n\n© The Consulting Club, FMS Delhi | 2023-24 | 8\n\nMain Index";
  const cleaned = stripCasebookFooterArtifacts(content);
  assert.equal(cleaned, "Consultants can pinpoint challenges.");
});

test("stripCasebookFooterArtifacts: strips a bracketed/markdown-linked Main Index nav token", () => {
  assert.equal(stripCasebookFooterArtifacts("Some content.\n\n[Main Index](#[UNREADABLE])"), "Some content.");
  assert.equal(stripCasebookFooterArtifacts("Some content.\n\n[Main Index]"), "Some content.");
});

test("stripCasebookFooterArtifacts: strips a page-break 'Case Index | Main Index' prefix glued directly to the next case's real title", () => {
  // Real fixture: the Market Entry Framework's cached rawExcerpt (frameworks.b92348b7...),
  // the chunk underlying the live attribution bug - the page-break between two cases left
  // "Case Index | Main Index" glued with no separator onto the next case's actual title.
  const content =
    "Okay, thank you! We can wrap up this case, here.\n\n" +
    "© The Consulting Club, FMS Delhi 2023-24 160\n\n" +
    " Case Index | Main Index Sports Bike Partner Case\nMarket Entry | Moderate | McKinsey & Co.\n\n" +
    "Your client is sports bike manufacturer in Europe and they want to enter the US market.";
  const cleaned = stripCasebookFooterArtifacts(content);
  assert.ok(!cleaned.includes("Main Index"));
  assert.ok(!cleaned.includes("©"));
  assert.ok(cleaned.includes("Sports Bike Partner Case"), "the real next-case title must survive");
  assert.ok(cleaned.includes("Market Entry | Moderate | McKinsey & Co."));
  assert.ok(cleaned.includes("Your client is sports bike manufacturer"));
});

test("stripCasebookFooterArtifacts: strips a full-line FMS breadcrumb nav row", () => {
  const content =
    "Real heading text.\n\n" +
    "FMS | [Main Index](#[UNREADABLE]) | How to Get into Consulting from Here? | The Consulting Club, Faculty of Management Studies, University of Delhi";
  assert.equal(stripCasebookFooterArtifacts(content), "Real heading text.");
});

test("stripCasebookFooterArtifacts: strips inline logo placeholders and a glued 'Main Index' token, keeping real content", () => {
  const content = "[FMS Logo] Main Index 3C's [The Consulting Club Logo]";
  assert.equal(stripCasebookFooterArtifacts(content), "3C's");
});

test("stripCasebookFooterArtifacts: the 'Faculty of Management Studies' / 'University of Delhi' header lines are stripped", () => {
  const content = "The Consulting Club\nFaculty of Management Studies\nUniversity of Delhi\n\nReal prose follows.";
  assert.equal(stripCasebookFooterArtifacts(content), "Real prose follows.");
});

test("stripCasebookFooterArtifacts: collapses the blank-line gap left behind, never a ragged double gap", () => {
  const content = "First paragraph.\n\n© The Consulting Club, FMS Delhi\n2023-24\n9\n\nSecond paragraph.";
  const cleaned = stripCasebookFooterArtifacts(content);
  assert.equal(cleaned, "First paragraph.\n\nSecond paragraph.");
});

test("stripCasebookFooterArtifacts: plain prose with no artifact is returned unchanged (aside from trim)", () => {
  const content = "MECE means mutually exclusive, collectively exhaustive.";
  assert.equal(stripCasebookFooterArtifacts(content), content);
});

test("stripCasebookFooterArtifacts: never touches a diagram fence's JSON content", () => {
  const content =
    "Intro.\n\n```placewise-diagram\n{\"type\":\"flow\",\"source_page\":31}\n```\n\n© The Consulting Club, FMS Delhi\n2023-24\n31\n\nMain Index";
  const cleaned = stripCasebookFooterArtifacts(content);
  assert.ok(cleaned.includes('{"type":"flow","source_page":31}'), "diagram JSON line must survive byte-identical");
  assert.ok(!cleaned.includes("Main Index"));
});

test("stripCasebookFooterArtifacts: empty/undefined input never throws", () => {
  assert.equal(stripCasebookFooterArtifacts(""), "");
  assert.equal(stripCasebookFooterArtifacts(undefined), "");
});

// --- containsSourceAttribution / stripAttributionSentences ---
// Added 2026-11-11 (live-bug fix): the Market Entry Framework's paraphrase generated its
// own attribution sentence ("...as published by The Consulting Club at FMS Delhi."),
// something the source chunk never said - a content-generation problem, not a chunking
// one. These are the deterministic, no-extra-Gemini-call backstop that catches it.

test("containsSourceAttribution: flags a generated sentence naming the club and school", () => {
  assert.equal(
    containsSourceAttribution("This framework was, as published by The Consulting Club at FMS Delhi, a useful tool."),
    true
  );
});

test("containsSourceAttribution: flags each known institute/club name on its own", () => {
  assert.equal(containsSourceAttribution("A note from Indian School of Business on positioning."), true);
  assert.equal(containsSourceAttribution("This comes from the ISB casebook."), true);
  assert.equal(containsSourceAttribution("SRCC's consulting primer covers this."), true);
  assert.equal(containsSourceAttribution("As taught at IIM Ahmedabad."), true);
});

test("containsSourceAttribution: plain framework prose with no attribution is not flagged", () => {
  assert.equal(
    containsSourceAttribution("MECE means mutually exclusive, collectively exhaustive buckets, useful for structuring a case."),
    false
  );
});

test("containsSourceAttribution: empty/undefined input never throws, not flagged", () => {
  assert.equal(containsSourceAttribution(""), false);
  assert.equal(containsSourceAttribution(undefined), false);
});

test("stripAttributionSentences: drops only the offending sentence, keeps the rest intact", () => {
  const text =
    "Here is a case study applying the Market Sizing and Entry framework to a sports bike " +
    "manufacturer from Europe that wants to expand into the United States, as published by " +
    "The Consulting Club at FMS Delhi. To begin exploring the proposal, we should first " +
    "understand the client's current standing in the European market.";
  const stripped = stripAttributionSentences(text);
  assert.ok(!containsSourceAttribution(stripped));
  assert.ok(stripped.includes("To begin exploring the proposal"));
  assert.ok(!stripped.includes("The Consulting Club"));
});

test("stripAttributionSentences: text with no attribution is returned unchanged (aside from trim)", () => {
  const text = "MECE means mutually exclusive, collectively exhaustive buckets.";
  assert.equal(stripAttributionSentences(text), text);
});

// --- buildCitation ---

test("buildCitation: single-page chunk reports one page, not a range", () => {
  const citation = buildCitation({
    school: "FMS Delhi",
    club: null,
    source_file: "The FMS Consulting CaseBook 2023-24 (1).pdf",
    year: "2023-24",
    page_start: 12,
    page_end: 12
  });
  assert.deepEqual(citation, {
    school: "FMS Delhi",
    club: null,
    casebook: "The FMS Consulting CaseBook 2023-24 (1).pdf",
    year: "2023-24",
    pages: [12]
  });
});

test("buildCitation: multi-page chunk reports a [start, end] range", () => {
  const citation = buildCitation({
    school: "ISB",
    club: "Consulting Club",
    source_file: "ISB Consulting Casebook 2025.pdf",
    year: "2025",
    page_start: 162,
    page_end: 164
  });
  assert.deepEqual(citation.pages, [162, 164]);
  assert.equal(citation.casebook, "ISB Consulting Casebook 2025.pdf");
});

test("buildCitation: missing school/club/year fall back to null, never undefined", () => {
  const citation = buildCitation({
    school: null,
    club: null,
    source_file: "SRCC Guesstimates-Book-Volume-1-6.pdf",
    year: null,
    page_start: 6,
    page_end: 6
  });
  assert.equal(citation.school, null);
  assert.equal(citation.club, null);
  assert.equal(citation.year, null);
});

// --- fallback label ---

test("AI_FALLBACK_LABEL is a non-empty, visibly-labelled string (grounding policy)", () => {
  assert.equal(typeof AI_FALLBACK_LABEL, "string");
  assert.ok(AI_FALLBACK_LABEL.length > 0);
  assert.ok(/not from the casebooks/i.test(AI_FALLBACK_LABEL));
});

// --- retrieveConsultingChunks: sourceClasses forwarding (FIN1.04) ---
//
// Network-mocked (same pattern as consultingParaphraseFlagOn.test.js) just enough to
// capture the body sent to match_ingest_chunks's RPC endpoint - no real Supabase/Gemini
// call is made.
function installFakeFetchForRpcCapture(t, { capture, rpcRows = [] }) {
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const href = typeof url === "string" ? url : url.toString();
    if (href.includes(":embedContent")) {
      return new Response(JSON.stringify({ embedding: { values: new Array(768).fill(0) } }), { status: 200 });
    }
    if (href.includes("/rest/v1/rpc/match_ingest_chunks")) {
      capture.push(JSON.parse(opts.body));
      return new Response(JSON.stringify(rpcRows), { status: 200 });
    }
    return new Response(JSON.stringify({}), { status: 200 });
  });
}

test("retrieveConsultingChunks: passing sourceClasses forwards it as filter_source_classes", async t => {
  const calls = [];
  installFakeFetchForRpcCapture(t, { capture: calls });

  await retrieveConsultingChunks("what is the finance compendium about?", {
    sourceClasses: ["club_casebook", "placewise_reference"]
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].filter_source_classes, ["club_casebook", "placewise_reference"]);
});

test("retrieveConsultingChunks: no sourceClasses forwards filter_source_classes: null (today's exact behavior)", async t => {
  const calls = [];
  installFakeFetchForRpcCapture(t, { capture: calls });

  await retrieveConsultingChunks("what is MECE?", { domain: "Consulting" });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].filter_source_classes, null);
});

// Added 2026-11-07 (live-bug fix, see excludeRowsBySourceFile above): proves the exclusion
// actually reaches end-to-end through retrieveConsultingChunks, not just the pure helper -
// a row from the excluded Guesstimates book is dropped from what the RPC returned, while
// an unrelated row with no source_file set (should never be excluded by accident) stays.
test("retrieveConsultingChunks: excludeSourceFiles drops matching rows from the RPC response", async t => {
  const calls = [];
  installFakeFetchForRpcCapture(t, {
    capture: calls,
    rpcRows: [
      { source_file: "SRCC Guesstimates-Book-Volume-1-6.pdf", content: "guesstimate framework index", similarity: 0.71 },
      { source_file: "The FMS Consulting CaseBook 2023-24.pdf", content: "MECE segmentation", similarity: 0.78 }
    ]
  });

  const rows = await retrieveConsultingChunks("what is MECE?", {
    domain: "Consulting",
    excludeSourceFiles: ["SRCC Guesstimates-Book-Volume-1-6.pdf"]
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(rows.map(r => r.source_file), ["The FMS Consulting CaseBook 2023-24.pdf"]);
});

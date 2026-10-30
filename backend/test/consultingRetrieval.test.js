// R7: pure-logic coverage for consultingRetrieval.js (match_ingest_chunks' two
// consumers - the coverage decision and citation shape). No network, no
// Gemini, no Supabase call - same cost-conscious tier as skillContent.test.js's
// harness tests. The I/O wrapper (retrieveConsultingChunks) is intentionally
// not exercised here: it is a thin try/catch around embedTexts + supabase.rpc,
// already covered logically by that resilience posture, same as
// frameworksGrounding.js's existing findGrounding.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decideCoverage,
  buildCitation,
  SIMILARITY_THRESHOLD,
  DIAGRAM_SIMILARITY_THRESHOLD,
  AI_FALLBACK_LABEL
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

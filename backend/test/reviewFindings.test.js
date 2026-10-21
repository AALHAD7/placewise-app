import { test } from "node:test";
import assert from "node:assert/strict";
import { normaliseReviewFile, entryKey } from "../src/lib/reviewFindings.js";

const SRC = "The FMS Consulting CaseBook 2023-24 (1).pdf";

const r1 = {
  document_id: "129a2604-0221-4ba2-af50-42ac641a21a0",
  ingestion_version: 3,
  flagged: { hallucinated: [11, 56], altered: [10] },
  undetected_error_sample: { other_errors: { 106: "markdown nav typo 'Guesestimate'" } },
  pages: [
    { page_no: 31, verdict: "pass", mismatches: [], checked: "title ok" },
    {
      page_no: 31,
      verdict: "fail",
      mismatches: [
        { type: "altered", item: "a" },
        { type: "altered", item: "b" },
        { type: "missing", item: "c" },
      ],
      note: "second look",
      other_issues: ["x", "y"],
    },
  ],
};

test("duplicate page_no gives two distinct entry keys", () => {
  const rows = normaliseReviewFile("r1_review_v3", r1, SRC).filter((r) => r.page_no === 31);
  assert.equal(rows.length, 2);
  assert.notEqual(rows[0].entry_key, rows[1].entry_key);
  for (const r of rows) assert.match(r.entry_key, /^p31:[0-9a-f]{12}$/);
});

test("entry keys come from content, not position", () => {
  const keys = normaliseReviewFile("r1_review_v3", r1, SRC).slice(0, 2).map((r) => r.entry_key);
  const reordered = { ...r1, pages: [r1.pages[1], r1.pages[0]] };
  const keys2 = normaliseReviewFile("r1_review_v3", reordered, SRC).slice(0, 2).map((r) => r.entry_key);
  assert.deepEqual([...keys2].reverse(), keys, "reordering entries keeps each entry's key");
  // Key order inside the entry does not matter; any content change does.
  assert.equal(entryKey({ page_no: 3, verdict: "pass", note: "a" }), entryKey({ note: "a", verdict: "pass", page_no: 3 }));
  assert.notEqual(entryKey({ page_no: 3, verdict: "pass" }), entryKey({ page_no: 3, verdict: "fail" }));
  assert.equal(entryKey({ page_no: 3 }), entryKey({ page_no: 3 }));
});

test("a byte-identical duplicate entry becomes one row", () => {
  const dup = { document_id: "d", ingestion_version: 5, pages: [{ page_no: 7, verdict: "pass" }, { verdict: "pass", page_no: 7 }] };
  assert.equal(normaliseReviewFile("x", dup, SRC).length, 1);
});

test("mismatch types are de-duplicated and notes joined", () => {
  const row = normaliseReviewFile("r1_review_v3", r1, SRC)[1];
  assert.deepEqual(row.mismatch_types, ["altered", "missing"]);
  assert.equal(row.mismatches.length, 3);
  assert.equal(row.note, 'second look · ["x","y"]');
  assert.equal(row.raw, r1.pages[1]);
});

test("r1 flagged map and other_errors expand into rows", () => {
  const rows = normaliseReviewFile("r1_review_v3", r1, SRC);
  const flagged = rows.filter((r) => r.verdict === "flagged");
  assert.deepEqual(flagged.map((r) => r.entry_key).sort(), [
    "flagged:altered:10",
    "flagged:hallucinated:11",
    "flagged:hallucinated:56",
  ]);
  const p56 = flagged.find((r) => r.page_no === 56);
  assert.deepEqual(p56.mismatch_types, ["hallucinated"]);
  assert.match(p56.note, /flagged this page as hallucinated/);
  const other = rows.find((r) => r.entry_key === "other:106");
  assert.equal(other.page_no, 106);
  assert.equal(other.note, "markdown nav typo 'Guesestimate'");
  assert.equal(rows.length, 2 + 3 + 1);
});

test("every row carries document, version and source file", () => {
  for (const r of normaliseReviewFile("r1_review_v3", r1, SRC)) {
    assert.equal(r.document_id, r1.document_id);
    assert.equal(r.ingestion_version, 3);
    assert.equal(r.source_file, SRC);
    assert.equal(r.source_name, "r1_review_v3");
  }
});

test("missing optional keys do not throw", () => {
  const rows = normaliseReviewFile("x", { document_id: "d", ingestion_version: 5, pages: [{ page_no: 4 }] }, SRC);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].mismatch_types, []);
  assert.deepEqual(rows[0].mismatches, []);
  assert.equal(rows[0].note, null);
  assert.equal(rows[0].verdict, null);
  assert.equal(rows[0].reviewer, null);
  assert.deepEqual(normaliseReviewFile("x", {}, SRC), []);
});

test("reviewer comes from a string or an object name", () => {
  assert.equal(normaliseReviewFile("x", { reviewer: "fidelity-reviewer", pages: [{ page_no: 1 }] }, SRC)[0].reviewer, "fidelity-reviewer");
  assert.equal(normaliseReviewFile("x", { reviewer: { name: "Aalhad" }, pages: [{ page_no: 1 }] }, SRC)[0].reviewer, "Aalhad");
});

test("entry keys are unique within a file", () => {
  const rows = normaliseReviewFile("r1_review_v3", r1, SRC);
  assert.equal(new Set(rows.map((r) => r.entry_key)).size, rows.length);
});

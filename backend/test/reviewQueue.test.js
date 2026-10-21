// Offline tests for the R5 review queue helpers (no Supabase, no Gemini).
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractBlocks, validateBlock } from "../src/lib/diagramBlocks.js";
import {
  validateActionBody, diagramsFromMarkdown, summariseReasons, mapRpcError,
  isUuid, isSafeImagePath, isMissingSchemaError, latestByPage
} from "../src/lib/reviewQueue.js";

const base = { title: null, source_page: 3, notes: [] };
const VALID = {
  issue_tree: { ...base, type: "issue_tree", root: { label: "Profit", children: [
    { label: "Revenue", children: [] }, { label: "Cost", children: [{ label: "Fixed", children: [] }] }] } },
  matrix: { ...base, type: "matrix", xAxis: "Share", yAxis: "Growth", rows: ["High", "Low"], cols: ["High", "Low"],
    cells: [["Star", "Question"], ["Cow", "Dog"]] },
  funnel: { ...base, type: "funnel", stages: ["Aware", "Consider", "Buy"] },
  flow: { ...base, type: "flow", nodes: [{ id: "a", label: "Start" }, { id: "b", label: "End" }],
    edges: [{ from: "a", to: "b", label: null }] },
  chart: { ...base, type: "chart", chart_kind: "bar", xLabel: null, yLabel: null,
    series: [{ name: "Sales", points: [["2022", 10], ["2023", null]] }] },
  table: { ...base, type: "table", header: ["A", "B"], rows: [["1", "2"]] },
  other: { ...base, type: "other", description: "A picture", labels: [] }
};

const fence = obj => "```placewise-diagram\n" + (typeof obj === "string" ? obj : JSON.stringify(obj, null, 2)) + "\n```";

for (const [type, obj] of Object.entries(VALID)) {
  test(`validateBlock: valid ${type} has no errors`, () => {
    assert.deepEqual(validateBlock(obj).errors, []);
  });
}

test("validateBlock: 'other' passes with a warning, missing title is a warning", () => {
  assert.ok(validateBlock(VALID.other).warnings.length > 0);
  const { title, ...noTitle } = VALID.funnel;
  const r = validateBlock(noTitle);
  assert.deepEqual(r.errors, []);
  assert.ok(r.warnings.some(w => w.includes("title")));
});

test("validateBlock: unknown type is an error", () => {
  assert.match(validateBlock({ ...base, type: "venn" }).errors[0], /not one of/);
  assert.ok(validateBlock([]).errors.length === 1);
});

test("validateBlock: flow edge to a missing node is an error", () => {
  const bad = { ...VALID.flow, edges: [{ from: "a", to: "zzz" }] };
  assert.ok(validateBlock(bad).errors.some(e => e.includes("zzz")));
});

test("validateBlock: ragged matrix is an error", () => {
  const bad = { ...VALID.matrix, cells: [["Star", "Question"], ["Cow"]] };
  assert.ok(validateBlock(bad).errors.some(e => e.includes("cells[1]")));
  const missingRow = { ...VALID.matrix, cells: [["Star", "Question"]] };
  assert.ok(validateBlock(missingRow).errors.some(e => e.includes("cell rows")));
});

test("validateBlock: tree node without children, funnel of one, bad chart point, bad table", () => {
  assert.ok(validateBlock({ ...VALID.issue_tree, root: { label: "x" } }).errors.length > 0);
  assert.ok(validateBlock({ ...VALID.funnel, stages: ["only"] }).errors.length > 0);
  assert.ok(validateBlock({ ...VALID.chart, series: [{ name: "s", points: [["x", "ten"]] }] }).errors.length > 0);
  assert.ok(validateBlock({ ...VALID.table, rows: ["not a row"] }).errors.length > 0);
});

test("extractBlocks: finds fences in order, reports broken JSON, unclosed and in-table fences", () => {
  const md = [
    "# Page", fence(VALID.funnel), "Diagram summary: a funnel", "",
    fence("{ not json"), "", "| a | ```placewise-diagram {} ``` |", "", "```placewise-diagram", "{\"type\":"
  ].join("\n");
  const blocks = extractBlocks(md);
  assert.equal(blocks.length, 4);
  assert.deepEqual(blocks.map(b => b.index), [0, 1, 2, 3]);
  assert.equal(blocks[0].json.type, "funnel");
  assert.equal(blocks[0].parseError, null);
  assert.match(blocks[1].parseError, /invalid JSON/);
  assert.match(blocks[2].parseError, /table cell/);
  assert.match(blocks[3].parseError, /unclosed/);
  assert.deepEqual(extractBlocks(""), []);
  assert.deepEqual(extractBlocks(null), []);
  // Ordinary code fences are ignored.
  assert.deepEqual(extractBlocks("```js\nx\n```"), []);
});

test("validateActionBody: unknown or missing action", () => {
  assert.equal(validateActionBody({ action: "nope" }).ok, false);
  assert.equal(validateActionBody({}).ok, false);
  assert.equal(validateActionBody(null).ok, false);
});

test("validateActionBody: approve and reopen, note optional", () => {
  const a = validateActionBody({ action: "approve" });
  assert.equal(a.ok, true);
  assert.equal(a.note, null);
  assert.equal(a.markdown, null);
  const r = validateActionBody({ action: "reopen", note: "  second look  ", expected_status: "approved" });
  assert.equal(r.ok, true);
  assert.equal(r.note, "second look");
  assert.equal(r.expectedStatus, "approved");
  assert.equal(validateActionBody({ action: "approve", expected_status: "done" }).ok, false);
  assert.equal(validateActionBody({ action: "approve", note: 5 }).ok, false);
});

test("validateActionBody: a body email is ignored (no reviewer field returned)", () => {
  const r = validateActionBody({ action: "approve", email: "attacker@example.com", p_email: "x@y.z" });
  assert.equal(r.ok, true);
  assert.ok(!("email" in r) && !("p_email" in r));
});

test("validateActionBody: mark_wrong needs a non-blank note of at most 2000 chars", () => {
  assert.equal(validateActionBody({ action: "mark_wrong" }).ok, false);
  assert.equal(validateActionBody({ action: "mark_wrong", note: "   " }).ok, false);
  assert.equal(validateActionBody({ action: "mark_wrong", note: "x".repeat(2001) }).ok, false);
  const ok = validateActionBody({ action: "mark_wrong", note: "Root label wrong" });
  assert.equal(ok.ok, true);
  assert.equal(ok.note, "Root label wrong");
});

test("validateActionBody: edit_approve needs markdown with drawable blocks", () => {
  assert.equal(validateActionBody({ action: "edit_approve" }).ok, false);
  assert.equal(validateActionBody({ action: "edit_approve", markdown: "x".repeat(50001) }).ok, false);
  const broken = validateActionBody({ action: "edit_approve", markdown: "Text\n" + fence(VALID.flow) + "\n" + fence("{bad") });
  assert.equal(broken.ok, false);
  assert.equal(broken.blockErrors.length, 1);
  assert.equal(broken.blockErrors[0].index, 1);
  assert.match(broken.blockErrors[0].errors[0], /invalid JSON/);
  const md = "Text\n" + fence(VALID.flow) + "\n" + fence(VALID.table);
  const ok = validateActionBody({ action: "edit_approve", markdown: md });
  assert.equal(ok.ok, true);
  assert.equal(ok.markdown, md);
  assert.equal(validateActionBody({ action: "edit_approve", markdown: "Plain text, no diagrams" }).ok, true);
});

test("diagramsFromMarkdown returns the parsed blocks in order", () => {
  const d = diagramsFromMarkdown(fence(VALID.flow) + "\n\n" + fence(VALID.funnel));
  assert.deepEqual(d.map(x => x.type), ["flow", "funnel"]);
  assert.deepEqual(diagramsFromMarkdown("nothing"), []);
});

test("summariseReasons counts and sorts desc", () => {
  const r = summariseReasons([
    { review_reasons: ["low_word_coverage", "dangling_edge"] },
    { review_reasons: ["dangling_edge"] },
    { review_reasons: [] }, {}
  ]);
  assert.deepEqual(Object.entries(r), [["dangling_edge", 2], ["low_word_coverage", 1]]);
});

test("mapRpcError maps wrapped Postgres messages", () => {
  assert.equal(mapRpcError("ERROR: page_not_found").status, 404);
  assert.equal(mapRpcError("P0001: status_conflict").status, 409);
  assert.equal(mapRpcError("bad_action").status, 400);
  assert.equal(mapRpcError("note_required").status, 400);
  const other = mapRpcError("connection reset by peer at 10.0.0.1");
  assert.equal(other.status, 500);
  assert.ok(!other.error.includes("10.0.0.1"));
  assert.equal(mapRpcError(undefined).status, 500);
});

test("isUuid, isSafeImagePath, isMissingSchemaError, latestByPage", () => {
  assert.ok(isUuid("c1521f01-bcbf-4163-923d-dc501859dc31"));
  assert.ok(!isUuid("c1521f01") && !isUuid(undefined) && !isUuid("../etc/passwd"));
  assert.ok(isSafeImagePath("pages/67371722-c752-473e-bf12-a3710707e56c/46.png"));
  for (const p of ["pages/../secret.png", "/pages/67371722-c752-473e-bf12-a3710707e56c/1.png",
    "pdfs/x.pdf", "pages/67371722-c752-473e-bf12-a3710707e56c/1.png?x", null]) {
    assert.ok(!isSafeImagePath(p), String(p));
  }
  assert.ok(isMissingSchemaError({ code: "PGRST205" }));
  assert.ok(isMissingSchemaError({ code: "PGRST202" }));
  assert.ok(!isMissingSchemaError({ code: "23505" }));
  const latest = latestByPage([{ page_id: "a", id: 2 }, { page_id: "a", id: 1 }, { page_id: "b", id: 3 }]);
  assert.equal(latest.a.id, 2);
  assert.equal(latest.b.id, 3);
});

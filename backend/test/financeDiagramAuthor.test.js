// FIN1.01: pure-logic/mocked-I/O coverage for financeDiagramAuthor.js. No live Gemini
// calls - every I/O function takes an optional `{ generateJSONFn }` override (see that
// file's header comment for why: this codebase has no prior ES-module mocking convention
// for gemini.js, so dependency injection is used instead of an experimental module-mock
// flag).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  proposeDiagram,
  judgeDiagramFaithfulOnce,
  judgeDiagramFaithful,
  diagramFaithfulMajority,
  authorAndVerifyDiagram,
  isValidDiagramShape
} from "../src/lib/financeDiagramAuthor.js";

const FUNNEL_DIAGRAM = { type: "funnel", title: "Deal stages", stages: ["Sourcing", "Diligence", "Close"] };

function mockGenerateJSON(sequenceOrFn) {
  let calls = 0;
  const fn = async (...args) => {
    const result = typeof sequenceOrFn === "function" ? sequenceOrFn(calls, ...args) : sequenceOrFn[calls];
    calls += 1;
    if (result instanceof Error) throw result;
    return result;
  };
  fn.callCount = () => calls;
  return fn;
}

// --- diagramFaithfulMajority (pure) ---

test("diagramFaithfulMajority([true,true,false]) -> true", () => {
  assert.equal(diagramFaithfulMajority([true, true, false]), true);
});

test("diagramFaithfulMajority([true,false,false]) -> false", () => {
  assert.equal(diagramFaithfulMajority([true, false, false]), false);
});

// --- isValidDiagramShape ---

test("isValidDiagramShape: accepts a well-formed funnel, rejects an unknown type", () => {
  assert.equal(isValidDiagramShape(FUNNEL_DIAGRAM), true);
  assert.equal(isValidDiagramShape({ type: "mystery" }), false);
  assert.equal(isValidDiagramShape(null), false);
});

// --- proposeDiagram ---

test("proposeDiagram: model declines -> returns null", async () => {
  const generateJSONFn = mockGenerateJSON([{ diagram: null }]);
  const result = await proposeDiagram("Some prose with no explicit structure.", { generateJSONFn });
  assert.equal(result, null);
});

test("proposeDiagram: model proposes a valid shape -> returns diagram + summary", async () => {
  const generateJSONFn = mockGenerateJSON([{ diagram: FUNNEL_DIAGRAM, summary: "Three deal stages." }]);
  const result = await proposeDiagram("Sourcing, then diligence, then close.", { generateJSONFn });
  assert.deepEqual(result.diagram, FUNNEL_DIAGRAM);
  assert.equal(result.summary, "Three deal stages.");
});

test("proposeDiagram: a malformed/unknown-shape response is treated as no diagram", async () => {
  const generateJSONFn = mockGenerateJSON([{ diagram: { type: "not-a-real-type" } }]);
  const result = await proposeDiagram("text", { generateJSONFn });
  assert.equal(result, null);
});

test("proposeDiagram: a generateJSON rejection is caught and returns null (no unhandled rejection)", async () => {
  const generateJSONFn = mockGenerateJSON([new Error("quota exceeded")]);
  const result = await proposeDiagram("text", { generateJSONFn });
  assert.equal(result, null);
});

// --- judgeDiagramFaithfulOnce / judgeDiagramFaithful ---

test("judgeDiagramFaithfulOnce: parses verdict/reasoning", async () => {
  const generateJSONFn = mockGenerateJSON([{ verdict: "faithful", reasoning: "all labels present" }]);
  const result = await judgeDiagramFaithfulOnce("text", FUNNEL_DIAGRAM, { generateJSONFn });
  assert.equal(result.faithful, true);
  assert.equal(result.reasoning, "all labels present");
});

test("judgeDiagramFaithful: a failed call counts as unfaithful (fail-closed), not a crash", async () => {
  const generateJSONFn = mockGenerateJSON([
    { verdict: "faithful" },
    new Error("network error"),
    { verdict: "faithful" }
  ]);
  const faithful = await judgeDiagramFaithful("text", FUNNEL_DIAGRAM, { generateJSONFn });
  // 2/3 still faithful even though the middle call errored.
  assert.equal(faithful, true);
});

// --- authorAndVerifyDiagram: the 3 scenarios from the plan's <done> ---

test("authorAndVerifyDiagram: model declines -> null diagram, zero faithfulness calls made", async () => {
  const generateJSONFn = mockGenerateJSON([{ diagram: null }]);
  const result = await authorAndVerifyDiagram("prose with no structure", { generateJSONFn });
  assert.deepEqual(result, { diagram: null, summary: null });
  assert.equal(generateJSONFn.callCount(), 1); // only the propose call, no judge calls
});

test("authorAndVerifyDiagram: model proposes + judge says faithful (2/3+ votes) -> diagram returned", async () => {
  const generateJSONFn = mockGenerateJSON([
    { diagram: FUNNEL_DIAGRAM, summary: "Three stages." },
    { verdict: "faithful" },
    { verdict: "faithful" },
    { verdict: "unfaithful" }
  ]);
  const result = await authorAndVerifyDiagram("Sourcing, then diligence, then close.", { generateJSONFn });
  assert.deepEqual(result.diagram, FUNNEL_DIAGRAM);
  assert.equal(result.summary, "Three stages.");
  assert.equal(generateJSONFn.callCount(), 4); // 1 propose + 3 judge
});

test("authorAndVerifyDiagram: model proposes + judge says unfaithful (majority) -> diagram dropped, text-only fallback", async () => {
  const generateJSONFn = mockGenerateJSON([
    { diagram: FUNNEL_DIAGRAM, summary: "Three stages." },
    { verdict: "unfaithful" },
    { verdict: "unfaithful" },
    { verdict: "faithful" }
  ]);
  const result = await authorAndVerifyDiagram("Sourcing, then diligence, then close.", { generateJSONFn });
  assert.deepEqual(result, { diagram: null, summary: null });
});

test("authorAndVerifyDiagram: fails closed on an unexpected error anywhere in the pipeline", async () => {
  const generateJSONFn = mockGenerateJSON(() => { throw new Error("boom"); });
  const result = await authorAndVerifyDiagram("text", { generateJSONFn });
  assert.deepEqual(result, { diagram: null, summary: null });
});

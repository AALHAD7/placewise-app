// R7b (grounded-answering skill, "The paraphrase layer"): pure-logic coverage for
// consultingRetrieval.js's paraphrase pipeline - diagram-block protection/restoration and
// the faithfulness judge's vote-counting decision. No network, no Gemini, no Supabase
// call, same cost-conscious tier as consultingRetrieval.test.js's existing
// decideCoverage/buildCitation tests - judgeRelevance has no network-calling tests of its
// own either, so judgeParaphraseFaithfulOnce/judgeParaphraseFaithful (the I/O wrappers)
// are deliberately not exercised here.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  protectDiagramBlocks,
  restoreDiagramBlocks,
  faithfulMajority
} from "../src/lib/consultingRetrieval.js";

// --- protectDiagramBlocks / restoreDiagramBlocks ---

test("protectDiagramBlocks: plain prose with no diagram fence is untouched, no blocks found", () => {
  const { placeheld, blocks } = protectDiagramBlocks("Just some casebook prose, no diagram here.");
  assert.equal(placeheld, "Just some casebook prose, no diagram here.");
  assert.deepEqual(blocks, []);
});

test("protectDiagramBlocks: a placewise-diagram fence is swapped for a numbered placeholder", () => {
  const content =
    "Before the diagram.\n\n```placewise-diagram\n{\"type\":\"funnel\",\"stages\":[\"A\",\"B\"]}\n```\n\nAfter the diagram.";
  const { placeheld, blocks } = protectDiagramBlocks(content);
  assert.equal(blocks.length, 1);
  assert.ok(placeheld.includes("[[PLACEWISE_DIAGRAM_BLOCK_0]]"));
  assert.ok(!placeheld.includes("placewise-diagram"), "the fence itself must not remain in the prose sent to the model");
  assert.ok(blocks[0].includes('"type":"funnel"'));
});

test("protectDiagramBlocks: multiple fences each get their own numbered token, in order", () => {
  const content =
    "```placewise-diagram\n{\"type\":\"other\",\"description\":\"first\"}\n```\n\nmiddle\n\n```placewise-diagram\n{\"type\":\"other\",\"description\":\"second\"}\n```";
  const { placeheld, blocks } = protectDiagramBlocks(content);
  assert.equal(blocks.length, 2);
  assert.ok(placeheld.includes("[[PLACEWISE_DIAGRAM_BLOCK_0]]"));
  assert.ok(placeheld.includes("[[PLACEWISE_DIAGRAM_BLOCK_1]]"));
  assert.ok(blocks[0].includes("first"));
  assert.ok(blocks[1].includes("second"));
});

test("protectDiagramBlocks + restoreDiagramBlocks round-trip exactly reproduces the original content", () => {
  const content =
    "Intro text.\n\n```placewise-diagram\n{\"type\":\"funnel\",\"stages\":[\"A\",\"B\"]}\n```\n\nOutro text.";
  const { placeheld, blocks } = protectDiagramBlocks(content);
  // Simulate an untouched-by-the-model pass-through (the paraphrase in the happy path
  // only rewords the prose around the token, never the token itself).
  const restored = restoreDiagramBlocks(placeheld, blocks);
  assert.equal(restored, content);
});

test("restoreDiagramBlocks: a missing placeholder token fails closed (returns null)", () => {
  const content = "Intro.\n\n```placewise-diagram\n{\"type\":\"other\",\"description\":\"x\"}\n```\n\nOutro.";
  const { blocks } = protectDiagramBlocks(content);
  const modelDroppedTheToken = "Intro, rewritten. Outro, rewritten.";
  assert.equal(restoreDiagramBlocks(modelDroppedTheToken, blocks), null);
});

test("restoreDiagramBlocks: a duplicated placeholder token fails closed (returns null)", () => {
  const content = "```placewise-diagram\n{\"type\":\"other\",\"description\":\"x\"}\n```";
  const { blocks } = protectDiagramBlocks(content);
  const modelDuplicatedTheToken = "[[PLACEWISE_DIAGRAM_BLOCK_0]] and also [[PLACEWISE_DIAGRAM_BLOCK_0]] again";
  assert.equal(restoreDiagramBlocks(modelDuplicatedTheToken, blocks), null);
});

test("restoreDiagramBlocks: no blocks to restore always succeeds unchanged", () => {
  assert.equal(restoreDiagramBlocks("plain rewritten text", []), "plain rewritten text");
});

// --- faithfulMajority (the faithfulness judge's pure vote-counting decision) ---
// Bumped from 3 votes (>=2/3) to 5 votes (>=3/5) 2026-11-07 for stability against judge
// non-determinism - see consultingRetrieval.js's comment above faithfulMajority.

test("faithfulMajority: 5/5 faithful votes is faithful", () => {
  assert.equal(faithfulMajority([true, true, true, true, true]), true);
});

test("faithfulMajority: 3/5 faithful votes is faithful (majority, not unanimity)", () => {
  assert.equal(faithfulMajority([true, true, true, false, false]), true);
});

test("faithfulMajority: 2/5 faithful votes is NOT faithful", () => {
  assert.equal(faithfulMajority([true, true, false, false, false]), false);
});

test("faithfulMajority: 0/5 faithful votes is not faithful", () => {
  assert.equal(faithfulMajority([false, false, false, false, false]), false);
});

test("faithfulMajority: two failed calls (counted as false, fail-closed) can't flip a true majority on their own", () => {
  // Three real "faithful" verdicts plus two calls that errored out and were already
  // converted to `false` upstream (judgeParaphraseFaithful's .catch) - still faithful.
  assert.equal(faithfulMajority([true, true, true, false, false]), true);
});

test("faithfulMajority: three failed calls (all counted as false) correctly block a minority of faithful votes", () => {
  assert.equal(faithfulMajority([true, true, false, false, false]), false);
});

test("faithfulMajority: empty vote list (shouldn't happen, but must not throw) is not faithful", () => {
  assert.equal(faithfulMajority([]), false);
});

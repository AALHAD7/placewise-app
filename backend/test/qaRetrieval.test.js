// R7: pure-logic coverage for qaRetrieval.js's prompt construction. No network, no
// Gemini, no Supabase - same tier as guesstimateRetrieval.test.js. groundedQaAnswer
// itself (the I/O wrapper) is a thin caller of already-tested groundedConsultingLookup
// plus generateText, left to the same resilience posture, not re-tested here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGroundedQaPrompt } from "../src/lib/qaRetrieval.js";

test("buildGroundedQaPrompt: no excerpts returns the question unchanged", () => {
  assert.equal(buildGroundedQaPrompt("What is MECE?", []), "What is MECE?");
  assert.equal(buildGroundedQaPrompt("What is MECE?", null), "What is MECE?");
});

test("buildGroundedQaPrompt: one excerpt is labelled and followed by the question", () => {
  const prompt = buildGroundedQaPrompt("What is MECE?", ["MECE = Mutually Exclusive..."]);
  assert.equal(prompt, "Excerpt 1:\nMECE = Mutually Exclusive...\n\nQuestion: What is MECE?");
});

test("buildGroundedQaPrompt: multiple excerpts are each numbered", () => {
  const prompt = buildGroundedQaPrompt("Q", ["first", "second"]);
  assert.ok(prompt.includes("Excerpt 1:\nfirst"));
  assert.ok(prompt.includes("Excerpt 2:\nsecond"));
  assert.ok(prompt.endsWith("Question: Q"));
});

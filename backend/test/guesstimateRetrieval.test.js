// Guesstimates feature: pure-logic coverage for guesstimateRetrieval.js's random-pick
// decision. Same tier as consultingRetrieval.test.js - no network, no Supabase, no
// Gemini. The I/O wrappers (groundedGuesstimateLookup, getRandomGuesstimateProblem) are
// thin callers of already-tested consultingRetrieval.js logic plus this pure pick, so
// they're intentionally left to the same resilience posture, not re-tested here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pickRandomCoveringChunk, GUESSTIMATES_SOURCE_FILE } from "../src/lib/guesstimateRetrieval.js";

test("pickRandomCoveringChunk: not covered returns null", () => {
  const picked = pickRandomCoveringChunk({ covered: false, chunks: [], citations: [] });
  assert.equal(picked, null);
});

test("pickRandomCoveringChunk: covered but empty chunks returns null", () => {
  const picked = pickRandomCoveringChunk({ covered: true, chunks: [], citations: [] });
  assert.equal(picked, null);
});

test("pickRandomCoveringChunk: picks the chunk/citation pair at the rng-selected index", () => {
  const result = {
    covered: true,
    chunks: [{ content: "a" }, { content: "b" }, { content: "c" }],
    citations: [{ pages: [1] }, { pages: [2] }, { pages: [3] }]
  };
  const picked = pickRandomCoveringChunk(result, () => 0.5); // floor(0.5 * 3) = 1
  assert.equal(picked.chunk.content, "b");
  assert.deepEqual(picked.citation.pages, [2]);
});

test("pickRandomCoveringChunk: rng=0 picks the first pair, never out of bounds", () => {
  const result = {
    covered: true,
    chunks: [{ content: "only" }],
    citations: [{ pages: [5] }]
  };
  const picked = pickRandomCoveringChunk(result, () => 0);
  assert.equal(picked.chunk.content, "only");
});

test("GUESSTIMATES_SOURCE_FILE names the actual ingested casebook, not a placeholder", () => {
  assert.equal(GUESSTIMATES_SOURCE_FILE, "SRCC Guesstimates-Book-Volume-1-6.pdf");
});

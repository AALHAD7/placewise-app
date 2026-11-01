// Guesstimates feature: pure-logic coverage for guesstimateRetrieval.js's random-pick
// decision. Same tier as consultingRetrieval.test.js - no network, no Supabase, no
// Gemini. The I/O wrappers (groundedGuesstimateLookup, getRandomGuesstimateProblem) are
// thin callers of already-tested consultingRetrieval.js logic plus this pure pick, so
// they're intentionally left to the same resilience posture, not re-tested here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pickRandomCoveringChunk, looksLikeWorkedProblem, shuffle, GUESSTIMATES_SOURCE_FILE } from "../src/lib/guesstimateRetrieval.js";

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

// --- looksLikeWorkedProblem (2026-11-02 incident: random-pick showed the book's own
// index page as if it were a practice problem) ---

test("looksLikeWorkedProblem: a real problem with an ASSUMPTIONS section passes", () => {
  const content = "# NUMBER OF ORDERS PLACED ON SWIGGY IN DELHI IN A DAY\n\nASSUMPTIONS\n\n1. Rural part of Delhi population will not prefer food delivery.";
  assert.equal(looksLikeWorkedProblem(content), true);
});

test("looksLikeWorkedProblem: the book's own index/table of contents page fails", () => {
  const content = "180 DEGREES CONSULTING, SRCC PRESENTS\n\nGUESSTIMATE BOOK VOLUME 1\n\nINDEX\n\n| PARTICULARS | LEVEL | PAGE |\n| Number of orders placed on Swiggy in Delhi in a day | | 17 |";
  assert.equal(looksLikeWorkedProblem(content), false);
});

test("looksLikeWorkedProblem: a theory/methodology page fails", () => {
  const content = "# INTRODUCTION TO A GUESSTIMATE\n\nA guesstimate is an estimate made using a combination of guesswork and reasoning.";
  assert.equal(looksLikeWorkedProblem(content), false);
});

test("looksLikeWorkedProblem: case-insensitive match, and empty/undefined content fails safely", () => {
  assert.equal(looksLikeWorkedProblem("Key ASSUMPTIONS made here"), true);
  assert.equal(looksLikeWorkedProblem(""), false);
  assert.equal(looksLikeWorkedProblem(undefined), false);
});

// --- shuffle (used by getRandomGuesstimateProblem to try candidates in random order,
// since a fixed-query similarity search turned out to be the wrong tool - see that
// function's comment, 2026-11-02) ---

test("shuffle: same elements, different (or at least a valid) order, never drops/adds items", () => {
  const input = [1, 2, 3, 4, 5];
  const result = shuffle(input, () => 0.9);
  assert.deepEqual([...result].sort(), [1, 2, 3, 4, 5]);
  assert.equal(result.length, input.length);
});

test("shuffle: does not mutate the input array", () => {
  const input = [1, 2, 3];
  shuffle(input, () => 0.5);
  assert.deepEqual(input, [1, 2, 3]);
});

test("shuffle: empty and single-element arrays pass through safely", () => {
  assert.deepEqual(shuffle([], () => 0.5), []);
  assert.deepEqual(shuffle([1], () => 0.5), [1]);
});

// Guesstimates feature: pure-logic coverage for guesstimateRetrieval.js's random-pick
// decision. Same tier as consultingRetrieval.test.js - no network, no Supabase, no
// Gemini. The I/O wrappers (groundedGuesstimateLookup, getRandomGuesstimateProblem) are
// thin callers of already-tested consultingRetrieval.js logic plus this pure pick, so
// they're intentionally left to the same resilience posture, not re-tested here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pickRandomCoveringChunk, looksLikeWorkedProblem, filterCandidatesByExclusion, shuffle, splitRawQuestionFromAnswer, GUESSTIMATES_SOURCE_FILE } from "../src/lib/guesstimateRetrieval.js";

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

// --- splitRawQuestionFromAnswer (2026-11-07 fix: ASSUMPTIONS is part of the worked
// solution, not neutral problem framing, and must never reach the student pre-attempt -
// the split now happens on the raw chunk, before paraphrasing merges title and
// assumptions into one blob with no reliable boundary left) ---

test("splitRawQuestionFromAnswer: a real problem's title is a bare question, assumptions stay out of it", () => {
  const content =
    "# NUMBER OF ORDERS PLACED ON SWIGGY IN DELHI IN A DAY\n\nBain Capability Network | ⬜⬜⬜⬜⬜\n\nClick here to view detailed spreadsheet XLS\n\nASSUMPTIONS\n\n1. Rural part of Delhi population will not prefer food delivery platforms";
  const { rawQuestion, answerSource } = splitRawQuestionFromAnswer(content);
  assert.equal(rawQuestion, "NUMBER OF ORDERS PLACED ON SWIGGY IN DELHI IN A DAY");
  assert.ok(!rawQuestion.includes("ASSUMPTIONS"));
  assert.ok(answerSource.includes("ASSUMPTIONS"));
  assert.ok(answerSource.includes("Click here"));
});

test("splitRawQuestionFromAnswer: strips a leading '##' and surrounding whitespace from the title", () => {
  const content = "## EXAMPLE: GUESSTIMATE THE NUMBER OF LICENSE PLATES\n\nASSUMPTIONS Average people per household - 4";
  const { rawQuestion, answerSource } = splitRawQuestionFromAnswer(content);
  assert.equal(rawQuestion, "EXAMPLE: GUESSTIMATE THE NUMBER OF LICENSE PLATES");
  assert.equal(answerSource, "\nASSUMPTIONS Average people per household - 4");
});

test("splitRawQuestionFromAnswer: no newline at all falls back to a generic question, full content as the answer", () => {
  const content = "A single-line chunk with no title/body separation.";
  const { rawQuestion, answerSource } = splitRawQuestionFromAnswer(content);
  assert.equal(rawQuestion, "Estimate the following:");
  assert.equal(answerSource, content);
});

test("splitRawQuestionFromAnswer: skips a leading bare page-number line to find the real title", () => {
  const content = "47\n\nSIZE OF ANIMATION/VFX MARKET IN INDIA\n\nRedSeer Strategy Consultants | ⬜⬜⬜⬜⬜\n\nASSUMPTIONS\n\n1. Movies";
  const { rawQuestion, answerSource } = splitRawQuestionFromAnswer(content);
  assert.equal(rawQuestion, "SIZE OF ANIMATION/VFX MARKET IN INDIA");
  assert.ok(!rawQuestion.match(/^\d+$/));
  assert.ok(answerSource.includes("ASSUMPTIONS"));
});

test("splitRawQuestionFromAnswer: a chunk with no real title before ASSUMPTIONS falls back to a placeholder-looking question rather than crashing", () => {
  const content = "52\n\nASSUMPTIONS\n\n1. Some assumption";
  const { rawQuestion } = splitRawQuestionFromAnswer(content);
  // Known data-defect case (no real title present) - documents the current behavior
  // (picks "ASSUMPTIONS" itself as the title) rather than asserting it's good; chunks
  // like this are found and deactivated via is_active, not fixed by this function.
  assert.equal(rawQuestion, "ASSUMPTIONS");
});

// --- filterCandidatesByExclusion: ensures the same guesstimate is not asked twice ---

test("filterCandidatesByExclusion: drops candidates whose id is in excludeIds", () => {
  const candidates = [{ id: "chunk-1" }, { id: "chunk-2" }, { id: "chunk-3" }];
  const { pool, cycleReset } = filterCandidatesByExclusion(candidates, ["chunk-1", "chunk-3"]);
  assert.equal(cycleReset, false);
  assert.equal(pool.length, 1);
  assert.equal(pool[0].id, "chunk-2");
});

test("filterCandidatesByExclusion: empty excludeIds returns all candidates without cycleReset", () => {
  const candidates = [{ id: "chunk-1" }, { id: "chunk-2" }];
  const { pool, cycleReset } = filterCandidatesByExclusion(candidates, []);
  assert.equal(cycleReset, false);
  assert.equal(pool.length, 2);
});

test("filterCandidatesByExclusion: when all candidates are excluded, restarts cycle excluding only the last seen", () => {
  const candidates = [{ id: "chunk-1" }, { id: "chunk-2" }, { id: "chunk-3" }];
  const excludeIds = ["chunk-1", "chunk-2", "chunk-3"]; // All seen, chunk-3 is immediate previous
  const { pool, cycleReset } = filterCandidatesByExclusion(candidates, excludeIds);
  assert.equal(cycleReset, true);
  // Must NOT include chunk-3 (immediate previous)
  assert.equal(pool.length, 2);
  assert.ok(pool.every(c => c.id !== "chunk-3"));
});

test("filterCandidatesByExclusion: handles empty or invalid candidates list gracefully", () => {
  assert.deepEqual(filterCandidatesByExclusion([], ["chunk-1"]), { pool: [], cycleReset: false });
  assert.deepEqual(filterCandidatesByExclusion(null, ["chunk-1"]), { pool: [], cycleReset: false });
});

test("filterCandidatesByExclusion: cleans whitespace and handles Set input", () => {
  const candidates = [{ id: "chunk-1" }, { id: "chunk-2" }];
  const excludeSet = new Set([" chunk-1 "]);
  const { pool } = filterCandidatesByExclusion(candidates, excludeSet);
  assert.equal(pool.length, 1);
  assert.equal(pool[0].id, "chunk-2");
});

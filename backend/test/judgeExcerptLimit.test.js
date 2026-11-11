// D1 follow-up (2026-11-11, accuracy fix): judgeRelevanceOnce and
// judgeParaphraseFaithfulOnce used to truncate their excerpt(s) to 2000 chars before
// asking the judge whether it answers the question / is faithful to the original. Real
// chunks run up to 9556 chars (checked against ingest_chunks directly) and the
// answer-bearing content for 3 real PM-domain eval questions sat past that old 2000-char
// cutoff, so the judge voted "not faithful/relevant" on content it genuinely never saw.
// These tests prove the prompt sent to the judge now carries the FULL excerpt for a
// >2000 (but <10000) char chunk, not a truncated one - same network-mocked pattern as
// consultingParaphraseFlagOn.test.js (mock fetch, capture the request body's prompt text).
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test-gemini-key";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://fake-supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-supabase-key";

import { judgeRelevanceOnce, judgeParaphraseFaithfulOnce } from "../src/lib/consultingRetrieval.js";

function jsonResponse(obj) {
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] }), { status: 200 });
}

function promptTextOf(opts) {
  return JSON.parse(opts.body).contents[0].parts[0].text;
}

// 2500 chars of filler, with a distinctive marker planted past the old 2000-char cutoff -
// exactly the failure mode found in the PM preview eval (the answer-bearing content, e.g.
// a worked RCA root cause, sat past the old truncation point).
function longExcerptWithMarkerPast2000(marker) {
  const filler = "x".repeat(2000);
  return `${filler} ${marker} ${"y".repeat(400)}`;
}

test("judgeRelevanceOnce: a >2000-char excerpt reaches the judge prompt in full, including content past the old 2000-char cutoff", async t => {
  const marker = "ROOT_CAUSE_WAS_INVENTORY_MISMATCH";
  const excerpt = longExcerptWithMarkerPast2000(marker);
  assert.ok(excerpt.length > 2000 && excerpt.length < 10000, "fixture must sit inside the new limit's intended range");

  let capturedPrompt = null;
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const href = typeof url === "string" ? url : url.toString();
    if (href.includes(":generateContent")) {
      capturedPrompt = promptTextOf(opts);
      return jsonResponse({ verdict: "faithful", reasoning: "contains the root cause" });
    }
    return new Response(JSON.stringify({}), { status: 200 });
  });

  await judgeRelevanceOnce("What was the root cause in the streaming RCA case?", excerpt);

  assert.ok(capturedPrompt, "generateContent must have been called");
  assert.ok(capturedPrompt.includes(marker), "the marker past the old 2000-char cutoff must reach the judge prompt");
  assert.ok(capturedPrompt.includes(excerpt), "the full excerpt, byte-identical, must reach the judge prompt");
});

test("judgeParaphraseFaithfulOnce: a >2000-char original AND rewrite both reach the judge prompt in full", async t => {
  const originalMarker = "FIFTH_BLOCKCHAIN_PROPERTY_IS_IMMUTABILITY";
  const rewriteMarker = "FIFTH_PROPERTY_REWORDED_AS_IMMUTABILITY";
  const original = longExcerptWithMarkerPast2000(originalMarker);
  const rewrite = longExcerptWithMarkerPast2000(rewriteMarker);
  assert.ok(original.length > 2000 && original.length < 10000);
  assert.ok(rewrite.length > 2000 && rewrite.length < 10000);

  let capturedPrompt = null;
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const href = typeof url === "string" ? url : url.toString();
    if (href.includes(":generateContent")) {
      capturedPrompt = promptTextOf(opts);
      return jsonResponse({ verdict: "faithful", reasoning: "matches" });
    }
    return new Response(JSON.stringify({}), { status: 200 });
  });

  await judgeParaphraseFaithfulOnce(original, rewrite);

  assert.ok(capturedPrompt, "generateContent must have been called");
  assert.ok(capturedPrompt.includes(originalMarker), "original content past the old 2000-char cutoff must reach the judge prompt");
  assert.ok(capturedPrompt.includes(rewriteMarker), "rewrite content past the old 2000-char cutoff must reach the judge prompt");
});

test("judgeRelevanceOnce: a >10000-char excerpt is still truncated (the new limit is raised, not removed)", async t => {
  const marker = "SHOULD_NOT_APPEAR_PAST_LIMIT";
  const excerpt = `${"x".repeat(10000)} ${marker}`;

  let capturedPrompt = null;
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const href = typeof url === "string" ? url : url.toString();
    if (href.includes(":generateContent")) {
      capturedPrompt = promptTextOf(opts);
      return jsonResponse({ verdict: "faithful", reasoning: "ok" });
    }
    return new Response(JSON.stringify({}), { status: 200 });
  });

  await judgeRelevanceOnce("some question", excerpt);

  assert.ok(capturedPrompt);
  assert.ok(!capturedPrompt.includes(marker), "content beyond the 10000-char limit must still be cut off");
});

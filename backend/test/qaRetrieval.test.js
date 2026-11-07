// R7: pure-logic coverage for qaRetrieval.js's prompt construction. No network, no
// Gemini, no Supabase - same tier as guesstimateRetrieval.test.js. groundedQaAnswer
// itself (the I/O wrapper) is a thin caller of already-tested groundedConsultingLookup
// plus generateText, left to the same resilience posture, not re-tested here.
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test-gemini-key";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://fake-supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-supabase-key";

import { buildGroundedQaPrompt, groundedQaAnswer } from "../src/lib/qaRetrieval.js";

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

// --- groundedQaAnswer: widened retrieval scope (FIN1.04) ---
//
// Network-mocked end-to-end (same pattern as consultingParaphraseFlagOn.test.js) to prove
// the actual RPC call groundedQaAnswer triggers (via groundedConsultingLookup) carries
// filter_domain: null and filter_source_classes covering both club_casebook and
// placewise_reference - not just that qaRetrieval.js's source text calls the right
// options object, but that it really reaches match_ingest_chunks that way.
test("groundedQaAnswer: calls match_ingest_chunks with domain null and both source classes", async t => {
  const rpcCalls = [];
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const href = typeof url === "string" ? url : url.toString();
    if (href.includes(":embedContent")) {
      return new Response(JSON.stringify({ embedding: { values: new Array(768).fill(0) } }), { status: 200 });
    }
    if (href.includes("/rest/v1/rpc/match_ingest_chunks")) {
      rpcCalls.push(JSON.parse(opts.body));
      return new Response(JSON.stringify([]), { status: 200 }); // no rows -> ungrounded path
    }
    if (href.includes(":generateContent")) {
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: "general guidance answer" }] } }] }),
        { status: 200 }
      );
    }
    return new Response(JSON.stringify({}), { status: 200 });
  });

  const result = await groundedQaAnswer("What is the WACC formula?");

  assert.equal(rpcCalls.length, 1);
  assert.equal(rpcCalls[0].filter_domain, null);
  assert.deepEqual(rpcCalls[0].filter_source_classes, ["club_casebook", "placewise_reference"]);
  assert.equal(result.groundedInCasebooks, false); // no rows mocked back, so falls to AI fallback
});

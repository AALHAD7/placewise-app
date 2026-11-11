// D1.3 code review regression test (2026-11-11): the first version of this change
// gated Prodman's v2 grounding path on the already-on CONSULTING_RAG_V2_ENABLED flag,
// not a flag of its own. Prodman's 11 frameworks already have a live, working v1
// (document_chunks) grounded_example/grounded_image cached, and D1.2's new PM
// ingest_chunks rows are correctly is_active=false (no PM switch-over has happened).
// Piggybacking on the Consulting flag meant: the moment a Prodman framework's 7-day
// cache went stale, findGrounding would route it to findGroundingV2, get a clean
// `{covered: false}` (correctly - no active PM rows exist yet), and return
// `{example: null, image: null}` with no fallback, silently overwriting the good v1
// cache with null for every Prodman framework, as an unplanned side effect of time
// passing. This test proves the fix: a dedicated ENABLE_PM_RAG_V2 flag, left off here
// even with ENABLE_CONSULTING_RAG_V2 on, keeps Prodman on the v1 document_chunks path -
// zero risk to the live cache until Aalhad does a real, deliberate PM switch-over.
//
// This file imports frameworksGrounding.js in its own process-level env state, separate
// from frameworksGrounding.test.js, which sets ENABLE_PM_RAG_V2=true for its own tests -
// module-level flags are read once at import time, so the two files must run as
// independent test files (node:test runs each file in its own process), not share one.
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test-gemini-key";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://fake-supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-supabase-key";
process.env.ENABLE_CONSULTING_RAG_V2 = "true";
// Deliberately NOT set (left off, the default) - this is the exact case the review caught.
delete process.env.ENABLE_PM_RAG_V2;

const { withGroundedExamples } = await import("../src/lib/frameworksGrounding.js");

test("withGroundedExamples: a Prodman row stays on the v1 document_chunks path when ENABLE_PM_RAG_V2 is off, even with ENABLE_CONSULTING_RAG_V2 on", async t => {
  const ingestCalls = [];
  const documentCalls = [];
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const href = typeof url === "string" ? url : url.toString();
    if (href.includes(":embedContent")) {
      return new Response(JSON.stringify({ embedding: { values: new Array(768).fill(0) } }), { status: 200 });
    }
    if (href.includes("/rest/v1/rpc/match_ingest_chunks")) {
      ingestCalls.push(JSON.parse(opts.body));
      return new Response(JSON.stringify([]), { status: 200 });
    }
    if (href.includes("/rest/v1/rpc/match_document_chunks")) {
      documentCalls.push(JSON.parse(opts.body));
      // The existing live v1 cache for a real Prodman framework (e.g. AARRR) - a
      // non-empty result proves this path is actually the one serving the row, not
      // just the one being called.
      return new Response(
        JSON.stringify([
          {
            content: "AARRR maps Acquisition, Activation, Retention, Referral and Revenue.",
            similarity: 0.9,
            image_url: null,
            source_file: "pm-casebook-v1.pdf"
          }
        ]),
        { status: 200 }
      );
    }
    if (href.includes("/rest/v1/frameworks")) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    return new Response(JSON.stringify({}), { status: 200 });
  });

  const fw = { id: "fw-aarrr", domain: "Prodman", name: "AARRR Framework", grounded_checked_at: null };
  const [result] = await withGroundedExamples([fw]);

  assert.equal(ingestCalls.length, 0, "ENABLE_PM_RAG_V2 off must never call match_ingest_chunks for Prodman");
  assert.equal(documentCalls.length, 1, "Prodman must fall back to the v1 document_chunks path");
  assert.equal(documentCalls[0].filter_domain, "Prodman");
  assert.ok(result.grounded_example, "the v1 path's result should still populate grounded_example");
  assert.ok(result.grounded_example.excerpt.includes("AARRR"));
});

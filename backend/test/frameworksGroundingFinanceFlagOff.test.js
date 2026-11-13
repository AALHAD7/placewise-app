// FIN2 code review regression test (2026-11-13), same shape as D1.3's
// frameworksGroundingPmFlagOff.test.js: Finance joined RAG_V2_DOMAINS alongside
// Consulting/Prodman, but Finance's 3 seeded framework subdomains (Corporate Finance &
// M&A, Financial Statements & Accounting, Valuation) already have a live, working v1
// (document_chunks) grounded_example/grounded_image cached. If Finance's v2 lookup were
// gated on ENABLE_CONSULTING_RAG_V2 (already on) instead of its own dedicated flag, the
// moment a Finance framework's 7-day cache went stale, findGrounding would route it to
// findGroundingV2, get a clean `{covered: false}` (correctly - no active Finance
// ingest_chunks rows exist yet, is_active=false per FIN1), and return
// `{example: null, image: null}` with no fallback, silently overwriting the good v1 cache
// with null - the exact D1 regression, for a different domain. This test proves the fix:
// a dedicated ENABLE_FINANCE_RAG_V2 flag, left off here even with ENABLE_CONSULTING_RAG_V2
// and ENABLE_PM_RAG_V2 on, keeps Finance on the v1 document_chunks path - zero risk to the
// live cache until Aalhad does a real, deliberate Finance switch-over.
//
// This file imports frameworksGrounding.js in its own process-level env state, separate
// from frameworksGrounding.test.js, which sets ENABLE_FINANCE_RAG_V2=true for its own
// tests - module-level flags are read once at import time, so the two files must run as
// independent test files (node:test runs each file in its own process), not share one.
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test-gemini-key";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://fake-supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-supabase-key";
process.env.ENABLE_CONSULTING_RAG_V2 = "true";
process.env.ENABLE_PM_RAG_V2 = "true";
// Deliberately NOT set (left off, the default) - this is the exact case the review caught.
delete process.env.ENABLE_FINANCE_RAG_V2;

const { withGroundedExamples } = await import("../src/lib/frameworksGrounding.js");

test("withGroundedExamples: a Finance row stays on the v1 document_chunks path when ENABLE_FINANCE_RAG_V2 is off, even with the other two flags on", async t => {
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
      // The existing live v1 cache for a real Finance framework (e.g. WACC) - a
      // non-empty result proves this path is actually the one serving the row, not
      // just the one being called.
      return new Response(
        JSON.stringify([
          {
            content: "WACC blends the cost of equity and after-tax cost of debt, weighted by each source's share of capital.",
            similarity: 0.9,
            image_url: null,
            source_file: "finance-v1.pdf"
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

  const fw = { id: "fw-wacc", domain: "Finance", name: "WACC", grounded_checked_at: null };
  const [result] = await withGroundedExamples([fw]);

  assert.equal(ingestCalls.length, 0, "ENABLE_FINANCE_RAG_V2 off must never call match_ingest_chunks for Finance");
  assert.equal(documentCalls.length, 1, "Finance must fall back to the v1 document_chunks path");
  assert.equal(documentCalls[0].filter_domain, "Finance");
  assert.ok(result.grounded_example, "the v1 path's result should still populate grounded_example");
  assert.ok(result.grounded_example.excerpt.includes("WACC"));
});

// Regression test for the image_url RPC-drop bug found after R7:
// migration_037's drop/recreate of match_document_chunks (to add the
// is_active filter) accidentally stopped returning `image_url`, so every
// row frameworksGrounding.js's v1 `findGrounding` path received had
// image_url === undefined - topImage never matched, grounded_image stayed
// null for every live Frameworks lookup, no error ever thrown. Fixed by
// migration_043 (restores image_url to the RPC's return columns). This
// test pins the JS-side contract: *given* rows that do carry image_url (the
// shape match_document_chunks is meant to return), pickTopTextAndImage must
// actually find the image row. It can't see the DB-side regression itself
// (that's a SQL function definition, not JS), but it would catch any future
// JS-side regression in the same row-picking logic, and documents exactly
// what "fixed" looks like from the call site.
import { test } from "node:test";
import assert from "node:assert/strict";

// ENABLE_CONSULTING_RAG_V2=true, ENABLE_PM_RAG_V2=true and ENABLE_FINANCE_RAG_V2=true for
// this whole file (same pattern as consultingParaphraseFlagOn.test.js) so the D1.3/FIN2
// tests below can exercise the v2 gate for all three domains - module-level flags are read
// once at import time, so this must be set before the dynamic import, not inside an
// individual test. The pre-existing pickTopTextAndImage/isStale tests are pure functions,
// unaffected by any flag. Separate files (frameworksGroundingPmFlagOff.test.js,
// frameworksGroundingFinanceFlagOff.test.js) import the module fresh with their own flag
// left off to prove the opposite case - see the reviews these lock in, below.
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test-gemini-key";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://fake-supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-supabase-key";
process.env.ENABLE_CONSULTING_RAG_V2 = "true";
process.env.ENABLE_PM_RAG_V2 = "true";
process.env.ENABLE_FINANCE_RAG_V2 = "true";

const { pickTopTextAndImage, isStale, withGroundedExamples, RAG_V2_DOMAINS } = await import("../src/lib/frameworksGrounding.js");

test("pickTopTextAndImage: finds the image row when image_url is present and above its threshold", () => {
  const rows = [
    { content: "a plain excerpt", similarity: 0.9, image_url: null, source_file: "a.pdf" },
    {
      content: "a diagram caption",
      similarity: 0.9,
      image_url: "https://storage.example/casebook-images/foo.png",
      source_file: "b.pdf"
    }
  ];
  const { topText, topImage } = pickTopTextAndImage(rows);
  assert.equal(topText.content, "a plain excerpt");
  assert.equal(topImage.content, "a diagram caption");
  assert.equal(topImage.image_url, "https://storage.example/casebook-images/foo.png");
});

test("pickTopTextAndImage: an image row below the image threshold is not picked (even if above the text one)", () => {
  // Mirrors the real thresholds: SIMILARITY_THRESHOLD 0.5, IMAGE_SIMILARITY_THRESHOLD 0.58.
  const rows = [{ content: "weak image match", similarity: 0.52, image_url: "https://x/y.png" }];
  const { topImage } = pickTopTextAndImage(rows);
  assert.equal(topImage, undefined);
});

test("pickTopTextAndImage: this is exactly what broke - rows missing image_url never produce a topImage", () => {
  // Simulates the pre-migration_043 RPC output: no image_url column at all,
  // so every row's image_url is undefined, same as a JS object literal that
  // never sets the key.
  const rows = [{ content: "a diagram caption with no image_url column", similarity: 0.95 }];
  const { topImage } = pickTopTextAndImage(rows);
  assert.equal(topImage, undefined);
});

test("pickTopTextAndImage: empty rows never throws and returns undefined for both", () => {
  const { topText, topImage } = pickTopTextAndImage([]);
  assert.equal(topText, undefined);
  assert.equal(topImage, undefined);
});

// --- isStale (2026-11-02: MECE and 3Cs were cached in September and never re-checked
// since - the original "check once, cache forever" design had no expiry at all) ---

test("isStale: never checked (null/undefined) is always stale", () => {
  assert.equal(isStale(null), true);
  assert.equal(isStale(undefined), true);
});

test("isStale: checked 2 months ago (the actual MECE/3Cs case) is stale", () => {
  const now = new Date("2026-11-02T00:00:00Z").getTime();
  assert.equal(isStale("2026-09-01T20:50:45.138Z", now), true);
  assert.equal(isStale("2026-09-27T16:18:36.624Z", now), true);
});

test("isStale: checked within the last 7 days is not stale", () => {
  const now = new Date("2026-11-02T00:00:00Z").getTime();
  assert.equal(isStale("2026-10-30T00:00:00Z", now), false);
});

test("isStale: exactly on the 7-day boundary is not yet stale, just past it is", () => {
  const now = new Date("2026-11-02T00:00:00Z").getTime();
  assert.equal(isStale("2026-10-26T00:00:00.001Z", now), false); // just under 7 days
  assert.equal(isStale("2026-10-25T23:59:59.000Z", now), true);  // just over 7 days
});

// --- D1.3: widen the v2 grounding gate from Consulting-only to RAG_V2_DOMAINS ---
//
// Network-mocked end-to-end (same pattern as qaRetrieval.test.js's "widened retrieval
// scope" test) to prove findGrounding's actual RPC call for a Prodman framework row
// carries domain: "Prodman" (not hardcoded "Consulting") and both source classes, and
// that a domain outside RAG_V2_DOMAINS (HR) never reaches match_ingest_chunks at all -
// proving the allowlist is a real gate, not accidentally wide-open.

function installFrameworksFakeFetch(t, { ingestRows = [], documentRows = [] } = {}) {
  const ingestCalls = [];
  const documentCalls = [];
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const href = typeof url === "string" ? url : url.toString();
    if (href.includes(":embedContent")) {
      return new Response(JSON.stringify({ embedding: { values: new Array(768).fill(0) } }), { status: 200 });
    }
    if (href.includes("/rest/v1/rpc/match_ingest_chunks")) {
      ingestCalls.push(JSON.parse(opts.body));
      return new Response(JSON.stringify(ingestRows), { status: 200 });
    }
    if (href.includes("/rest/v1/rpc/match_document_chunks")) {
      documentCalls.push(JSON.parse(opts.body));
      return new Response(JSON.stringify(documentRows), { status: 200 });
    }
    if (href.includes(":generateContent")) {
      // Relevance judge (RELEVANCE_SYSTEM_PROMPT, "strict grader") - always faithful, so a
      // covering row always survives to become grounded_example/grounded_image.
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"verdict": "faithful", "reasoning": "on topic"}' }] } }] }),
        { status: 200 }
      );
    }
    if (href.includes("/rest/v1/frameworks")) {
      // The grounded_checked_at cache write (withGroundedExamples) - succeed as a no-op.
      return new Response(JSON.stringify([]), { status: 200 });
    }
    return new Response(JSON.stringify({}), { status: 200 });
  });
  return { ingestCalls, documentCalls };
}

test("RAG_V2_DOMAINS: includes Consulting, Prodman and Finance", () => {
  assert.ok(RAG_V2_DOMAINS.includes("Consulting"));
  assert.ok(RAG_V2_DOMAINS.includes("Prodman"));
  assert.ok(RAG_V2_DOMAINS.includes("Finance"));
});

test("withGroundedExamples: with ENABLE_PM_RAG_V2 on, a Prodman row calls match_ingest_chunks with domain Prodman and both source classes", async t => {
  const row = {
    content: "AARRR maps Acquisition, Activation, Retention, Referral and Revenue.",
    has_diagram: false,
    similarity: 0.9,
    source_file: "pm-compendium.pdf",
    page_start: 4,
    page_end: 4,
    school: null,
    club: null,
    year: null
  };
  const { ingestCalls, documentCalls } = installFrameworksFakeFetch(t, { ingestRows: [row] });

  const fw = { id: "fw-aarrr", domain: "Prodman", name: "AARRR Framework", grounded_checked_at: null };
  const [result] = await withGroundedExamples([fw]);

  assert.equal(ingestCalls.length, 1);
  assert.equal(ingestCalls[0].filter_domain, "Prodman");
  assert.deepEqual(ingestCalls[0].filter_source_classes, ["club_casebook", "placewise_reference"]);
  assert.equal(documentCalls.length, 0, "a Prodman row should never fall through to the v1 document_chunks path");
  assert.ok(result.grounded_example, "a covering row should produce a grounded_example");
  assert.ok(result.grounded_example.excerpt.includes("AARRR"));
});

// FIN2 (2026-11-13): same shape as the Prodman test above, proving Finance's own flag
// (not Consulting's/PM's) actually drives its v2 lookup once Finance joined RAG_V2_DOMAINS.
test("withGroundedExamples: with ENABLE_FINANCE_RAG_V2 on, a Finance row calls match_ingest_chunks with domain Finance and both source classes", async t => {
  const row = {
    content: "WACC blends the cost of equity and after-tax cost of debt, weighted by each source's share of capital.",
    has_diagram: false,
    similarity: 0.88,
    source_file: "finance_compendium.md",
    page_start: null,
    page_end: null,
    school: null,
    club: null,
    year: null
  };
  const { ingestCalls, documentCalls } = installFrameworksFakeFetch(t, { ingestRows: [row] });

  const fw = { id: "fw-wacc", domain: "Finance", name: "WACC", grounded_checked_at: null };
  const [result] = await withGroundedExamples([fw]);

  assert.equal(ingestCalls.length, 1);
  assert.equal(ingestCalls[0].filter_domain, "Finance");
  assert.deepEqual(ingestCalls[0].filter_source_classes, ["club_casebook", "placewise_reference"]);
  assert.equal(documentCalls.length, 0, "a Finance row should never fall through to the v1 document_chunks path");
  assert.ok(result.grounded_example, "a covering row should produce a grounded_example");
  assert.ok(result.grounded_example.excerpt.includes("WACC"));
});

test("withGroundedExamples: an HR row (not in RAG_V2_DOMAINS) falls back to the v1 document_chunks path", async t => {
  const { ingestCalls, documentCalls } = installFrameworksFakeFetch(t, { documentRows: [] });

  const fw = { id: "fw-hr", domain: "HR", name: "Some HR Framework", grounded_checked_at: null };
  await withGroundedExamples([fw]);

  assert.equal(ingestCalls.length, 0, "an allowlist-excluded domain must never call match_ingest_chunks");
  assert.equal(documentCalls.length, 1);
  assert.equal(documentCalls[0].filter_domain, "HR");
});

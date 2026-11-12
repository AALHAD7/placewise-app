// domainGrounding.js centralizes "is the new ingest_chunks pipeline live for
// domain X" (previously duplicated independently in frameworksGrounding.js,
// roleTopics.js and roleCompanyTopicNotes.js) and provides retrieveDomainChunks,
// a drop-in replacement for a direct match_document_chunks RPC call used by
// mockInterview.js/resume.js/story.js/skillContent.js - those 4 had no v2 path
// at all before 2026-11-13, reading only the old v1 corpus unconditionally for
// every domain. Network-mocked end-to-end (same pattern as
// frameworksGrounding.test.js's installFrameworksFakeFetch) since embedTexts
// makes a real fetch call under the hood - mocking supabase.rpc alone wouldn't
// catch that.
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test-gemini-key";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://fake-supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-supabase-key";

const { isV2EnabledForDomain, RAG_V2_DOMAINS, retrieveDomainChunks } = await import("../src/lib/domainGrounding.js");

function installFakeFetch(t, { ingestRows = [], documentRows = [] } = {}) {
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
    return new Response(JSON.stringify({}), { status: 200 });
  });
  return { ingestCalls, documentCalls };
}

test("RAG_V2_DOMAINS: includes both Consulting and Prodman", () => {
  assert.ok(RAG_V2_DOMAINS.includes("Consulting"));
  assert.ok(RAG_V2_DOMAINS.includes("Prodman"));
});

test("isV2EnabledForDomain: off by default for every domain when env vars are unset", () => {
  delete process.env.ENABLE_CONSULTING_RAG_V2;
  delete process.env.ENABLE_PM_RAG_V2;
  assert.equal(isV2EnabledForDomain("Consulting"), false);
  assert.equal(isV2EnabledForDomain("Prodman"), false);
  assert.equal(isV2EnabledForDomain("Finance"), false);
  assert.equal(isV2EnabledForDomain(null), false);
});

test("isV2EnabledForDomain: Finance is never v2-enabled regardless of flags (not in RAG_V2_DOMAINS)", () => {
  process.env.ENABLE_CONSULTING_RAG_V2 = "true";
  process.env.ENABLE_PM_RAG_V2 = "true";
  assert.equal(isV2EnabledForDomain("Finance"), false);
  delete process.env.ENABLE_CONSULTING_RAG_V2;
  delete process.env.ENABLE_PM_RAG_V2;
});

test("retrieveDomainChunks: v2-disabled domain goes straight to v1 (match_document_chunks), never calls match_ingest_chunks", async t => {
  delete process.env.ENABLE_CONSULTING_RAG_V2;
  const { ingestCalls, documentCalls } = installFakeFetch(t, {
    documentRows: [{ content: "v1 content", source_file: "v1.pdf" }]
  });

  const { chunks, usedV2 } = await retrieveDomainChunks("some query", "Consulting", { matchCount: 4 });
  assert.equal(usedV2, false);
  assert.equal(ingestCalls.length, 0);
  assert.equal(documentCalls.length, 1);
  assert.equal(documentCalls[0].filter_domain, "Consulting");
  assert.deepEqual(chunks, [{ content: "v1 content", source_file: "v1.pdf" }]);
});

test("retrieveDomainChunks: v2-enabled domain with real results uses v2 only, with both source classes", async t => {
  process.env.ENABLE_CONSULTING_RAG_V2 = "true";
  const { ingestCalls, documentCalls } = installFakeFetch(t, {
    ingestRows: [{ content: "v2 content", source_file: "v2.pdf" }]
  });

  const { chunks, usedV2 } = await retrieveDomainChunks("some query", "Consulting", { matchCount: 4 });
  assert.equal(usedV2, true);
  assert.equal(ingestCalls.length, 1);
  assert.equal(ingestCalls[0].filter_domain, "Consulting");
  assert.deepEqual(ingestCalls[0].filter_source_classes, ["club_casebook", "placewise_reference"]);
  assert.equal(documentCalls.length, 0, "v2 found results, v1 should never be called");
  assert.deepEqual(chunks, [{ content: "v2 content", source_file: "v2.pdf" }]);
  delete process.env.ENABLE_CONSULTING_RAG_V2;
});

test("retrieveDomainChunks: v2-enabled domain with an empty v2 result falls through to v1", async t => {
  process.env.ENABLE_PM_RAG_V2 = "true";
  const { ingestCalls, documentCalls } = installFakeFetch(t, {
    ingestRows: [],
    documentRows: [{ content: "v1 fallback", source_file: "v1.pdf" }]
  });

  const { chunks, usedV2 } = await retrieveDomainChunks("some query", "Prodman", { matchCount: 4 });
  assert.equal(usedV2, false);
  assert.equal(ingestCalls.length, 1, "v2 should still have been tried first");
  assert.equal(documentCalls.length, 1, "empty v2 result falls through to v1");
  assert.deepEqual(chunks, [{ content: "v1 fallback", source_file: "v1.pdf" }]);
  delete process.env.ENABLE_PM_RAG_V2;
});

test("retrieveDomainChunks: null domain never tries v2, goes straight to v1", async t => {
  process.env.ENABLE_CONSULTING_RAG_V2 = "true";
  const { ingestCalls, documentCalls } = installFakeFetch(t, {
    documentRows: [{ content: "v1 null-domain", source_file: "v1.pdf" }]
  });

  const { chunks, usedV2 } = await retrieveDomainChunks("some query", null, { matchCount: 4 });
  assert.equal(usedV2, false);
  assert.equal(ingestCalls.length, 0);
  assert.equal(documentCalls.length, 1);
  assert.deepEqual(chunks, [{ content: "v1 null-domain", source_file: "v1.pdf" }]);
  delete process.env.ENABLE_CONSULTING_RAG_V2;
});

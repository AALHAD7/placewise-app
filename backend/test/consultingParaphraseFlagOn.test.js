// R7b: end-to-end (network-mocked, same pattern as geminiNvidiaCascade.test.js) coverage
// of groundedConsultingLookup's paraphrase layer with ENABLE_ANSWER_PARAPHRASE=true - the
// happy path (faithful rewrite used), the faithfulness judge rejecting a rewrite (falls
// back to the verbatim excerpt), and a paraphrase call that breaks a diagram placeholder
// token (falls back to the verbatim excerpt without ever showing a garbled diagram).
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.SUPABASE_URL = "https://fake-supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-supabase-key";
process.env.ENABLE_ANSWER_PARAPHRASE = "true"; // the point of this test file

const { groundedConsultingLookup } = await import("../src/lib/consultingRetrieval.js");

function textOf(opts) {
  const body = JSON.parse(opts.body);
  return { text: body.contents[0].parts[0].text, system: body.systemInstruction.parts[0].text };
}

function jsonResponse(obj) {
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] }), { status: 200 });
}

function plainTextResponse(text) {
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });
}

// `row` is the single match_ingest_chunks row returned by the mocked Supabase RPC.
// `onRewrite(excerptSentToModel)` must return the exact raw text the mocked paraphrase
// call responds with. `faithfulVerdict` controls the mocked faithfulness-judge response.
function installFakeFetch(t, { row, onRewrite, faithfulVerdict = "faithful" }) {
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const href = typeof url === "string" ? url : url.toString();
    if (href.includes(":embedContent")) {
      return new Response(JSON.stringify({ embedding: { values: new Array(768).fill(0) } }), { status: 200 });
    }
    if (href.includes("/rest/v1/rpc/match_ingest_chunks")) {
      return new Response(JSON.stringify([row]), { status: 200 });
    }
    if (href.includes(":generateContent")) {
      const { text, system } = textOf(opts);
      if (system.includes("checking whether a casebook excerpt shown VERBATIM")) {
        return jsonResponse({ verdict: "faithful", reasoning: "on topic" }); // relevance gate
      }
      if (system.includes("You are rewriting a casebook excerpt")) {
        return plainTextResponse(onRewrite(text)); // paraphrase call
      }
      if (system.includes("checking whether a REWRITE")) {
        return jsonResponse({ verdict: faithfulVerdict, reasoning: "checked" }); // faithfulness judge
      }
      throw new Error(`unexpected generateContent call: ${system.slice(0, 80)}`);
    }
    return new Response(JSON.stringify({}), { status: 200 }); // llm_call_log insert, etc.
  });
}

// Each test below uses its OWN chunk content text (never reused verbatim across tests in
// this file), even across otherwise-similar scenarios. paraphraseAndVerify's in-memory
// cache (consultingRetrieval.js) is keyed on a hash of the chunk content and lives for the
// life of the process - two tests in the same file sharing one chunk's exact text would
// silently share one cached paraphrase outcome instead of each exercising its own mocked
// response, which is real production behavior (the point of the cache) but would make
// these specific tests about each other's mocks, not each test's own scenario.
function textRow(content) {
  return {
    content,
    has_diagram: false,
    similarity: 0.9,
    school: "FMS Delhi",
    club: "Consulting Club",
    source_file: "FMS Casebook 2023-24.pdf",
    year: "2023-24",
    page_start: 12,
    page_end: 12
  };
}

test("groundedConsultingLookup: flag on + faithful rewrite is used as .content, raw kept as .rawContent", async t => {
  const row = textRow("The MECE principle means mutually exclusive, collectively exhaustive buckets.");
  installFakeFetch(t, {
    row,
    onRewrite: () => "MECE means every bucket is separate (mutually exclusive) and together they cover everything (collectively exhaustive)."
  });

  const result = await groundedConsultingLookup("What is MECE?", { domain: "Consulting", paraphrase: true });

  assert.equal(result.covered, true);
  const chunk = result.chunks[0];
  assert.equal(chunk.paraphrased, true);
  assert.equal(chunk.rawContent, row.content);
  assert.ok(chunk.content.startsWith("MECE means every bucket"), "content should be the rewrite, not the verbatim excerpt");
  assert.notEqual(chunk.content, chunk.rawContent);
});

test("groundedConsultingLookup: flag on + faithfulness judge rejects the rewrite falls back to the verbatim excerpt", async t => {
  const row = textRow("The 3Cs framework stands for Company, Customers and Competitors.");
  installFakeFetch(t, {
    row,
    onRewrite: () => "The 3Cs framework actually stands for something totally different and was invented by Bain in 1999.",
    faithfulVerdict: "unfaithful"
  });

  const result = await groundedConsultingLookup("What is the 3Cs framework?", { domain: "Consulting", paraphrase: true });

  const chunk = result.chunks[0];
  assert.equal(chunk.paraphrased, false, "a rejected rewrite must not be marked as used");
  assert.equal(chunk.content, row.content, "content must fall back to the verbatim excerpt");
  assert.equal(chunk.rawContent, row.content);
});

// Same reasoning as textRow above - each diagram test gets its own distinct content text
// (the prose differs even though the fence JSON is the same shape) so none of them can
// collide on the paraphrase cache key.
function diagramRow(content) {
  return {
    content,
    has_diagram: true,
    similarity: 0.95,
    school: "ISB",
    club: "Consulting Club",
    source_file: "ISB Casebook 2025.pdf",
    year: "2025",
    page_start: 162,
    page_end: 164
  };
}

test("groundedConsultingLookup: flag on + diagram chunk keeps the diagram JSON byte-identical after a faithful rewrite", async t => {
  const row = diagramRow(
    "Here is the sales funnel framework.\n\n```placewise-diagram\n{\"type\":\"funnel\",\"title\":\"Sales funnel\",\"stages\":[\"Leads\",\"Customers\"]}\n```\n\nUse it to structure the case."
  );
  installFakeFetch(t, {
    row,
    onRewrite: text => text.replace("Here is the sales funnel framework.", "This is the sales funnel framework to use.")
                           .replace("Use it to structure the case.", "Use this to structure your case.")
  });

  const result = await groundedConsultingLookup("sales funnel framework", { domain: "Consulting", paraphrase: true });

  const chunk = result.chunks[0];
  assert.equal(chunk.paraphrased, true);
  assert.ok(chunk.content.includes('```placewise-diagram'));
  assert.ok(chunk.content.includes('"type":"funnel"'), "the diagram JSON itself must survive untouched");
  assert.ok(chunk.content.includes("This is the sales funnel framework to use."));
  assert.equal(chunk.rawContent, row.content);
});

test("groundedConsultingLookup: flag on + a rewrite that drops the diagram placeholder token fails closed to the verbatim excerpt", async t => {
  const row = diagramRow(
    "Here is the decision-tree framework.\n\n```placewise-diagram\n{\"type\":\"funnel\",\"title\":\"Sales funnel\",\"stages\":[\"Leads\",\"Customers\"]}\n```\n\nUse it to structure the case."
  );
  installFakeFetch(t, {
    row,
    // Simulates a model mangling/dropping the [[PLACEWISE_DIAGRAM_BLOCK_0]] token -
    // paraphraseChunk must throw, and the caller must fall back rather than show a
    // response with the diagram silently missing.
    onRewrite: () => "This is the framework to use. Use this to structure your case."
  });

  const result = await groundedConsultingLookup("decision tree framework", { domain: "Consulting", paraphrase: true });

  const chunk = result.chunks[0];
  assert.equal(chunk.paraphrased, false);
  assert.equal(chunk.content, row.content, "must fall back to the verbatim excerpt, diagram intact");
  assert.ok(chunk.content.includes('```placewise-diagram'));
});

// Added 2026-11-11 (live-bug fix): the Market Entry Framework's paraphrase named the
// source club in generated prose ("...as published by The Consulting Club at FMS Delhi.") -
// a content-generation problem, caught here by the deterministic attribution check, which
// must fail closed (verbatim excerpt) WITHOUT ever reaching the faithfulness judge (the
// judge mock below would throw if called, proving the cheap check runs first and short-
// circuits it).
test("groundedConsultingLookup: flag on + a rewrite naming the source club fails closed to the verbatim excerpt, never reaching the faithfulness judge", async t => {
  const row = textRow("Market entry cases assess whether and how a client should enter a new geographic market.");
  installFakeFetch(t, {
    row,
    onRewrite: () =>
      "Here is how market entry cases work, as published by The Consulting Club at FMS Delhi: you assess whether and how a client should enter a new market."
  });
  // Override the faithfulness-judge branch to throw if it's ever reached - the attribution
  // check must short-circuit before this call, not just happen to also reject it.
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const href = typeof url === "string" ? url : url.toString();
    if (href.includes(":embedContent")) {
      return new Response(JSON.stringify({ embedding: { values: new Array(768).fill(0) } }), { status: 200 });
    }
    if (href.includes("/rest/v1/rpc/match_ingest_chunks")) {
      return new Response(JSON.stringify([row]), { status: 200 });
    }
    if (href.includes(":generateContent")) {
      const { text, system } = textOf(opts);
      if (system.includes("checking whether a casebook excerpt shown VERBATIM")) {
        return jsonResponse({ verdict: "faithful", reasoning: "on topic" }); // relevance gate
      }
      if (system.includes("You are rewriting a casebook excerpt")) {
        return plainTextResponse(
          "Here is how market entry cases work, as published by The Consulting Club at FMS Delhi: " +
            "you assess whether and how a client should enter a new market."
        );
      }
      if (system.includes("checking whether a REWRITE")) {
        throw new Error("faithfulness judge must never be called when the attribution check already failed closed");
      }
      throw new Error(`unexpected generateContent call: ${system.slice(0, 80)}`);
    }
    return new Response(JSON.stringify({}), { status: 200 });
  });

  const result = await groundedConsultingLookup("What is the market entry framework?", { domain: "Consulting", paraphrase: true });

  const chunk = result.chunks[0];
  assert.equal(chunk.paraphrased, false, "a rewrite naming the source must not be marked as used");
  assert.equal(chunk.content, row.content, "content must fall back to the verbatim excerpt");
});

// Added 2026-11-11 (live-bug fix): proves groundedConsultingLookup itself strips the
// FMS Consulting Club casebook's footer/header artifact from row content before the
// relevance judge, the paraphrase call, AND the no-paraphrase raw fallback ever see it -
// not just that the pure stripCasebookFooterArtifacts function works in isolation.
test("groundedConsultingLookup: strips the casebook footer artifact from chunk content even with paraphrase off (raw fallback is also sanitized)", async t => {
  const row = {
    content: "MECE means mutually exclusive, collectively exhaustive buckets.\n\n© The Consulting Club, FMS Delhi\n2023-24\n30\n\nMain Index",
    has_diagram: false,
    similarity: 0.9,
    school: "FMS Delhi",
    club: "Consulting Club",
    source_file: "FMS Casebook 2023-24.pdf",
    year: "2023-24",
    page_start: 30,
    page_end: 30
  };
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const href = typeof url === "string" ? url : url.toString();
    if (href.includes(":embedContent")) {
      return new Response(JSON.stringify({ embedding: { values: new Array(768).fill(0) } }), { status: 200 });
    }
    if (href.includes("/rest/v1/rpc/match_ingest_chunks")) {
      return new Response(JSON.stringify([row]), { status: 200 });
    }
    if (href.includes(":generateContent")) {
      return jsonResponse({ verdict: "faithful", reasoning: "on topic" }); // relevance gate only (paraphrase stays off)
    }
    return new Response(JSON.stringify({}), { status: 200 });
  });

  // paraphrase: true but ENABLE_ANSWER_PARAPHRASE is only read once per module load in
  // production code; this file sets it "true" at the top, so exercise the no-paraphrase
  // shape directly via the caller option instead.
  const result = await groundedConsultingLookup("what is MECE?", { domain: "Consulting", paraphrase: false });

  const chunk = result.chunks[0];
  assert.ok(!chunk.content.includes("Main Index"));
  assert.ok(!chunk.content.includes("©"));
  assert.ok(chunk.content.includes("MECE means mutually exclusive"));
});

test("groundedConsultingLookup: flag on + a chunk that is purely a diagram block (no prose) is never sent to the paraphrase model", async t => {
  const pureDiagramRow = diagramRow('```placewise-diagram\n{"type":"other","description":"x"}\n```');
  let paraphraseCallMade = false;
  installFakeFetch(t, {
    row: pureDiagramRow,
    onRewrite: () => { paraphraseCallMade = true; return "should never be called"; }
  });

  const result = await groundedConsultingLookup("some diagram", { domain: "Consulting", paraphrase: true });

  assert.equal(paraphraseCallMade, false);
  assert.equal(result.chunks[0].paraphrased, false);
  assert.equal(result.chunks[0].content, pureDiagramRow.content);
});

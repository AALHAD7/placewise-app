// R7b: proves the reversibility requirement itself - with ENABLE_ANSWER_PARAPHRASE unset
// (today's default), groundedConsultingLookup(..., { paraphrase: true }) must produce
// byte-identical output to the pre-R7b shape: no rawContent/paraphrased keys, and no
// paraphrase/faithfulness Gemini calls at all (only the pre-existing relevance gate call).
// Network is mocked (same pattern as geminiNvidiaCascade.test.js) so this proves the code
// path taken, not just the shape of a hand-built object.
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.SUPABASE_URL = "https://fake-supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-supabase-key";
delete process.env.ENABLE_ANSWER_PARAPHRASE; // the point of this test file

const { groundedConsultingLookup } = await import("../src/lib/consultingRetrieval.js");

const MATCH_ROW = {
  content: "The MECE principle means mutually exclusive, collectively exhaustive buckets.",
  has_diagram: false,
  similarity: 0.9,
  school: "FMS Delhi",
  club: "Consulting Club",
  source_file: "FMS Casebook 2023-24.pdf",
  year: "2023-24",
  page_start: 12,
  page_end: 12
};

function installFakeFetch(t, { onGenerateContent }) {
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const href = typeof url === "string" ? url : url.toString();
    if (href.includes(":embedContent")) {
      return new Response(JSON.stringify({ embedding: { values: new Array(768).fill(0) } }), { status: 200 });
    }
    if (href.includes("/rest/v1/rpc/match_ingest_chunks")) {
      return new Response(JSON.stringify([MATCH_ROW]), { status: 200 });
    }
    if (href.includes(":generateContent")) {
      onGenerateContent(opts);
      // The one call this path is allowed to make: the pre-existing relevance gate.
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"verdict":"faithful","reasoning":"on topic"}' }] } }] }),
        { status: 200 }
      );
    }
    return new Response(JSON.stringify({}), { status: 200 }); // llm_call_log insert, etc.
  });
}

test("groundedConsultingLookup: flag off + paraphrase:true opt-in is still a no-op, exact pre-R7b shape", async t => {
  let generateContentCalls = 0;
  installFakeFetch(t, { onGenerateContent: () => { generateContentCalls++; } });

  const result = await groundedConsultingLookup("What is MECE?", { domain: "Consulting", paraphrase: true });

  assert.equal(result.covered, true);
  assert.equal(result.chunks.length, 1);
  assert.deepEqual(Object.keys(result.chunks[0]).sort(), ["content", "hasDiagram", "similarity"].sort());
  assert.equal(result.chunks[0].content, MATCH_ROW.content, "content must be the verbatim excerpt, not a rewrite");
  assert.equal(result.chunks[0].rawContent, undefined, "no rawContent key when paraphrasing never ran");
  assert.equal(result.chunks[0].paraphrased, undefined);

  // 3 relevance-judge votes, same as before R7b existed - zero extra calls for a
  // paraphrase or a faithfulness check.
  assert.equal(generateContentCalls, 3, "only the pre-existing 3-vote relevance gate should call generateContent");
});

test("groundedConsultingLookup: flag off + paraphrase not requested at all behaves identically", async t => {
  let generateContentCalls = 0;
  installFakeFetch(t, { onGenerateContent: () => { generateContentCalls++; } });

  const result = await groundedConsultingLookup("What is MECE?", { domain: "Consulting" });

  assert.deepEqual(Object.keys(result.chunks[0]).sort(), ["content", "hasDiagram", "similarity"].sort());
  assert.equal(generateContentCalls, 3);
});

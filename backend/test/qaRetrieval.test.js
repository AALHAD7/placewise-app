// R7: pure-logic coverage for qaRetrieval.js's prompt construction. No network, no
// Gemini, no Supabase - same tier as guesstimateRetrieval.test.js. groundedQaAnswer
// itself (the I/O wrapper) is a thin caller of already-tested groundedConsultingLookup
// plus generateText, left to the same resilience posture, not re-tested here.
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test-gemini-key";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://fake-supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-supabase-key";

import { buildGroundedQaPrompt, groundedQaAnswer, extractDiagramWithSummary, findDiagramForAnswer } from "../src/lib/qaRetrieval.js";

// A realistic ingest_chunks row content: prose, then a ```placewise-diagram fence,
// immediately followed by its ingestion-time "Diagram summary:" line (the convention
// backend/ingestion/convert.py always writes - see qaRetrieval.js's
// DIAGRAM_FENCE_WITH_SUMMARY_RE comment).
const VALUE_CHAIN_FENCE =
  '```placewise-diagram\n{"type": "flow", "title": "Value Chain", "source_page": {"page_no": 12}, "notes": [], "nodes": [{"id": "a", "label": "Inbound Logistics"}, {"id": "b", "label": "Operations"}], "edges": [{"from": "a", "to": "b", "label": null}]}\n```\nDiagram summary: The value chain shows inbound logistics feeding into operations.';
const VALUE_CHAIN_CONTENT = `The value chain breaks a firm's activities into primary and support activities.\n\n${VALUE_CHAIN_FENCE}\n\nEach activity can be a source of cost advantage or differentiation.`;

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

// --- extractDiagramWithSummary / findDiagramForAnswer (pure, no network) ---

test("extractDiagramWithSummary: pulls the fence plus its Diagram summary line", () => {
  const extracted = extractDiagramWithSummary(VALUE_CHAIN_CONTENT);
  assert.equal(extracted, VALUE_CHAIN_FENCE);
});

test("extractDiagramWithSummary: null when there is no diagram fence", () => {
  assert.equal(extractDiagramWithSummary("Just plain prose, no diagram here."), null);
});

test("findDiagramForAnswer: returns the first chunk's diagram when present", () => {
  const diagram = findDiagramForAnswer([
    { content: "no diagram in this one" },
    { content: VALUE_CHAIN_CONTENT }
  ]);
  assert.equal(diagram, VALUE_CHAIN_FENCE);
});

test("findDiagramForAnswer: prefers rawContent over content when both exist", () => {
  const diagram = findDiagramForAnswer([
    { content: "paraphrased prose with no fence", rawContent: VALUE_CHAIN_CONTENT }
  ]);
  assert.equal(diagram, VALUE_CHAIN_FENCE);
});

test("findDiagramForAnswer: null when no chunk has a diagram", () => {
  assert.equal(findDiagramForAnswer([{ content: "prose" }, { content: "more prose" }]), null);
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

// --- groundedQaAnswer: diagram support ---
//
// Full mocked flow: embedContent -> match_ingest_chunks (one covering row) ->
// 3x relevance-judge generateContent calls (RELEVANCE_SYSTEM_PROMPT, "strict grader" -
// returns a faithful verdict) -> one answer-generation generateContent call (GROUNDED_SYSTEM
// - returns plain prose). Paraphrase is off (ENABLE_ANSWER_PARAPHRASE unset), same as every
// other qaRetrieval test here, so `chunks[].content` is the verbatim row content.
function mockGeminiAndSupabase(t, { row, answerText }) {
  const generateContentCalls = [];
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const href = typeof url === "string" ? url : url.toString();
    if (href.includes(":embedContent")) {
      return new Response(JSON.stringify({ embedding: { values: new Array(768).fill(0) } }), { status: 200 });
    }
    if (href.includes("/rest/v1/rpc/match_ingest_chunks")) {
      return new Response(JSON.stringify(row ? [row] : []), { status: 200 });
    }
    if (href.includes(":generateContent")) {
      const body = JSON.parse(opts.body);
      generateContentCalls.push(body);
      const systemText = body.systemInstruction?.parts?.[0]?.text || "";
      if (systemText.includes("strict grader")) {
        return new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: '{"verdict": "faithful", "reasoning": "on topic"}' }] } }]
          }),
          { status: 200 }
        );
      }
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: answerText }] } }] }),
        { status: 200 }
      );
    }
    return new Response(JSON.stringify({}), { status: 200 });
  });
  return generateContentCalls;
}

test("groundedQaAnswer: appends the diagram fence + summary when a covering chunk has one", async t => {
  const row = {
    content: VALUE_CHAIN_CONTENT,
    has_diagram: true,
    similarity: 0.9,
    source_file: "value-chain.pdf",
    page_start: 12,
    page_end: 12,
    school: "IIMK",
    club: "Consult Club",
    year: 2024
  };
  const generateContentCalls = mockGeminiAndSupabase(t, {
    row,
    answerText: "The value chain splits a firm's activities into primary and support activities."
  });

  const result = await groundedQaAnswer("Can you explain to me how the value chain framework works?");

  assert.equal(result.groundedInCasebooks, true);
  assert.ok(result.answer.includes("The value chain splits a firm's activities"));
  assert.ok(result.answer.includes(VALUE_CHAIN_FENCE), "final answer should include the verbatim diagram fence + summary");

  // The prompt sent for answer generation (the non-judge generateContent call) must never
  // contain the raw diagram JSON - only the placeholder token.
  const answerCall = generateContentCalls.find(c => !(c.systemInstruction?.parts?.[0]?.text || "").includes("strict grader"));
  const promptText = answerCall.contents[0].parts[0].text;
  assert.ok(!promptText.includes("placewise-diagram"), "prompt sent to Gemini must not contain the diagram fence");
  assert.ok(!promptText.includes('"type": "flow"'), "prompt sent to Gemini must not contain raw diagram JSON");
  assert.ok(promptText.includes("[[PLACEWISE_DIAGRAM_BLOCK_0]]"), "prompt should carry the placeholder token instead");
});

test("groundedQaAnswer: unchanged behavior when the covering chunk has no diagram", async t => {
  const row = {
    content: "MECE means a set of categories is Mutually Exclusive and Collectively Exhaustive.",
    has_diagram: false,
    similarity: 0.8,
    source_file: "mece.pdf",
    page_start: 3,
    page_end: 3,
    school: "IIMK",
    club: "Consult Club",
    year: 2024
  };
  mockGeminiAndSupabase(t, { row, answerText: "MECE is a structuring principle used in case interviews." });

  const result = await groundedQaAnswer("What is MECE?");

  assert.equal(result.groundedInCasebooks, true);
  assert.equal(result.answer, "MECE is a structuring principle used in case interviews.");
  assert.ok(!result.answer.includes("placewise-diagram"));
});

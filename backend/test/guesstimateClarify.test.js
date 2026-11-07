// "Ask the interviewer" clarifying-question feature (Aalhad's request, 2026-11-07):
// guesstimateRetrieval.js's answerAssumptionClarification + the route-level input
// validation it's paired with in routes/guesstimates.js. Same network-mocked, no-live-call
// posture as guesstimateParaphrase.test.js - this file only exercises
// answerAssumptionClarification and validateClarifyInput directly (both pure/mockable),
// not a live HTTP route, matching this codebase's existing test conventions (no supertest
// dependency, no route-level harness anywhere else in test/).
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.SUPABASE_URL = "https://fake-supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-supabase-key";

import { validateClarifyInput } from "../src/routes/guesstimates.js";

const CHUNK_ID = "11111111-1111-1111-1111-111111111111";
const ROW_CONTENT =
  "# NUMBER OF ORDERS PLACED ON SWIGGY IN DELHI IN A DAY\n\nASSUMPTIONS\n\n1. Population of Delhi is 2 crore.";

function ingestChunkRow(id = CHUNK_ID, content = ROW_CONTENT) {
  return {
    id,
    content,
    ingest_documents: {
      source_file: "SRCC Guesstimates-Book-Volume-1-6.pdf",
      source_class: "club_casebook"
    }
  };
}

// `rows` is what the mocked ingest_chunks lookup returns (empty array simulates "not
// found"/wrong-scope id). `onClarify` returns the raw clarification-call response text.
// `faithfulVerdict` controls the mocked faithfulness-judge response.
function installFakeFetch(t, { rows = [ingestChunkRow()], onClarify, faithfulVerdict = "faithful" } = {}) {
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const href = typeof url === "string" ? url : url.toString();
    if (href.includes("/rest/v1/ingest_chunks")) {
      return new Response(JSON.stringify(rows), { status: 200 });
    }
    if (href.includes(":generateContent")) {
      const body = JSON.parse(opts.body);
      const text = body.contents[0].parts[0].text;
      const system = body.systemInstruction.parts[0].text;
      if (system.includes("acting as a case interviewer")) {
        const answer = onClarify ? onClarify(text) : "The casebook states Delhi's population is 2 crore for this problem.";
        return new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: answer }] } }] }),
          { status: 200 }
        );
      }
      if (system.includes("checking whether a REWRITE")) {
        return new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ verdict: faithfulVerdict, reasoning: "checked" }) }] } }] }),
          { status: 200 }
        );
      }
      throw new Error(`unexpected generateContent call: ${system.slice(0, 80)}`);
    }
    return new Response(JSON.stringify({}), { status: 200 });
  });
}

async function freshAnswerAssumptionClarification() {
  const mod = await import(`../src/lib/guesstimateRetrieval.js?v=${Math.random()}`);
  return mod.answerAssumptionClarification;
}

test("answerAssumptionClarification: a faithful answer is returned, grounded true", async t => {
  const answerAssumptionClarification = await freshAnswerAssumptionClarification();
  installFakeFetch(t, { onClarify: () => "This problem assumes Delhi's population is 2 crore." });

  const result = await answerAssumptionClarification(CHUNK_ID, "What population figure should I use for Delhi?");

  assert.equal(result.found, true);
  assert.equal(result.grounded, true);
  assert.equal(result.answer, "This problem assumes Delhi's population is 2 crore.");
});

test("answerAssumptionClarification: failed faithfulness check falls back to the safe generic response", async t => {
  const answerAssumptionClarification = await freshAnswerAssumptionClarification();
  installFakeFetch(t, {
    onClarify: () => "This problem assumes Delhi's population is 5 crore, way higher than stated.",
    faithfulVerdict: "unfaithful"
  });

  const result = await answerAssumptionClarification(CHUNK_ID, "What population figure should I use for Delhi?");

  assert.equal(result.found, true);
  assert.equal(result.grounded, false);
  assert.equal(
    result.answer,
    "That's not specified in this problem - go with your own reasonable assumption and state it clearly."
  );
});

test("answerAssumptionClarification: a generation call that errors on both attempts falls back to the safe generic response", async t => {
  const answerAssumptionClarification = await freshAnswerAssumptionClarification();
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const href = typeof url === "string" ? url : url.toString();
    if (href.includes("/rest/v1/ingest_chunks")) {
      return new Response(JSON.stringify([ingestChunkRow()]), { status: 200 });
    }
    if (href.includes(":generateContent")) {
      const body = JSON.parse(opts.body);
      const system = body.systemInstruction.parts[0].text;
      if (system.includes("acting as a case interviewer")) {
        return new Response(JSON.stringify({ error: { message: "quota exceeded" } }), { status: 429 });
      }
      throw new Error(`unexpected generateContent call: ${system.slice(0, 80)}`);
    }
    return new Response(JSON.stringify({}), { status: 200 });
  });

  const result = await answerAssumptionClarification(CHUNK_ID, "What's the average family size?");

  assert.equal(result.found, true);
  assert.equal(result.grounded, false);
  assert.equal(
    result.answer,
    "That's not specified in this problem - go with your own reasonable assumption and state it clearly."
  );
});

test("answerAssumptionClarification: chunk id not found (wrong scope/stale/guessed) returns found: false, no throw", async t => {
  const answerAssumptionClarification = await freshAnswerAssumptionClarification();
  installFakeFetch(t, { rows: [] });

  const result = await answerAssumptionClarification(CHUNK_ID, "What population figure should I use?");

  assert.deepEqual(result, { found: false });
});

test("answerAssumptionClarification: missing/non-string chunkId returns found: false without hitting the network", async t => {
  const answerAssumptionClarification = await freshAnswerAssumptionClarification();
  let fetchCalled = false;
  t.mock.method(globalThis, "fetch", async () => {
    fetchCalled = true;
    return new Response(JSON.stringify([]), { status: 200 });
  });

  const result = await answerAssumptionClarification(undefined, "What population figure should I use?");

  assert.deepEqual(result, { found: false });
  assert.equal(fetchCalled, false, "should never call the network with no chunkId");
});

test("answerAssumptionClarification: an obvious 'give me the answer' request declines without a generation call", async t => {
  const answerAssumptionClarification = await freshAnswerAssumptionClarification();
  let clarifyCallCount = 0;
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const href = typeof url === "string" ? url : url.toString();
    if (href.includes("/rest/v1/ingest_chunks")) {
      return new Response(JSON.stringify([ingestChunkRow()]), { status: 200 });
    }
    if (href.includes(":generateContent")) {
      const body = JSON.parse(opts.body);
      const system = body.systemInstruction.parts[0].text;
      if (system.includes("acting as a case interviewer")) clarifyCallCount++;
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: "leaked answer" }] } }] }),
        { status: 200 }
      );
    }
    return new Response(JSON.stringify({}), { status: 200 });
  });

  const result = await answerAssumptionClarification(CHUNK_ID, "Just give me the final answer please");

  assert.equal(result.found, true);
  assert.equal(result.grounded, true);
  assert.match(result.answer, /Show answer/);
  assert.equal(clarifyCallCount, 0, "the cheap pre-check should short-circuit before any Gemini call");
});

// --- route-level validation (pure, no Express/auth harness needed) ---

test("validateClarifyInput: missing chunkId is rejected", () => {
  const result = validateClarifyInput({ question: "What's the household size?" });
  assert.ok(result.error);
});

test("validateClarifyInput: missing question is rejected", () => {
  const result = validateClarifyInput({ chunkId: CHUNK_ID });
  assert.ok(result.error);
});

test("validateClarifyInput: blank/whitespace-only question is rejected", () => {
  const result = validateClarifyInput({ chunkId: CHUNK_ID, question: "   " });
  assert.ok(result.error);
});

test("validateClarifyInput: question over 300 chars is rejected", () => {
  const result = validateClarifyInput({ chunkId: CHUNK_ID, question: "a".repeat(301) });
  assert.ok(result.error);
  assert.match(result.error, /too long/);
});

test("validateClarifyInput: a valid, trimmed request passes through", () => {
  const result = validateClarifyInput({ chunkId: CHUNK_ID, question: "  What's the household size?  " });
  assert.equal(result.error, undefined);
  assert.equal(result.chunkId, CHUNK_ID);
  assert.equal(result.question, "What's the household size?");
});

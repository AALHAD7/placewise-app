// chat.js's ungrounded Q&A/chat passthrough and mockInterview.js's opening-
// question generation can try Groq's openai/gpt-oss-120b first
// (ENABLE_GROQ_CASCADE=true) before falling back to the existing Gemini
// cascade (src/lib/gemini.js's generateChatText/generateChatJSON). No real
// network calls: global.fetch is mocked per test so every Groq failure mode
// (429, 500, timeout, malformed body, wrong-shaped JSON) can be proven to
// fall through to a working Gemini response without burning any real API
// quota or waiting out a real multi-second timeout. Replaces
// geminiNvidiaCascade.test.js (NVIDIA cascade retired 2026-11-12, see
// log.md) - same shape, different provider.
import { test } from "node:test";
import assert from "node:assert/strict";

// Env vars read by gemini.js at module load time (GROQ_API_KEY, the
// timeout) must be set BEFORE the module is imported — a static import at
// the top of this file would be hoisted ahead of any process.env
// assignment, so the import is dynamic and deliberately placed after setup.
process.env.GROQ_API_KEY = "test-groq-key";
process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.SUPABASE_URL = "https://fake-supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-supabase-key";
// Short-circuits the real 5000ms AbortController timeout so the "Groq times
// out" test doesn't actually wait 5s — see GROQ_CASCADE_TIMEOUT_MS in
// gemini.js, overridable via this env var for tests only.
process.env.GROQ_CASCADE_TIMEOUT_MS = "50";

const { generateChatText, generateChatJSON } = await import("../src/lib/gemini.js");

const GEMINI_OK_BODY = {
  candidates: [{ content: { parts: [{ text: "gemini says hello" }] } }]
};
const GEMINI_JSON_BODY = {
  candidates: [{ content: { parts: [{ text: '{"question": "gemini question"}' }] } }]
};

function groqOkResponse(text = "groq says hello") {
  return new Response(
    JSON.stringify({ choices: [{ message: { content: text } }] }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function geminiOkResponse(body = GEMINI_OK_BODY) {
  return new Response(JSON.stringify(body), { status: 200 });
}

// Anything that isn't the Groq or Gemini generation endpoint (e.g. the
// fire-and-forget llm_call_log insert via supabase-js) gets a harmless 200
// so it never throws an unhandled rejection or slows the test down.
function fallbackOkResponse() {
  return new Response(JSON.stringify({}), { status: 200 });
}

function installFakeFetch(t, { groq, gemini }) {
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const href = typeof url === "string" ? url : url.toString();
    if (href.includes("api.groq.com")) {
      return groq(href, opts);
    }
    if (href.includes("generativelanguage.googleapis.com")) {
      return gemini(href, opts);
    }
    return fallbackOkResponse();
  });
}

test("generateChatText: Groq cascade disabled (flag unset) goes straight to Gemini, never calls Groq", async t => {
  delete process.env.ENABLE_GROQ_CASCADE;
  let groqCalled = false;
  installFakeFetch(t, {
    groq: () => { groqCalled = true; return groqOkResponse(); },
    gemini: () => geminiOkResponse()
  });

  const text = await generateChatText({ system: "sys", prompt: "hi", feature: "test" });
  assert.equal(text, "gemini says hello");
  assert.equal(groqCalled, false, "Groq must not be called when the flag is off");
});

test("generateChatText: Groq enabled + happy path uses Groq's response, formatted the same way", async t => {
  process.env.ENABLE_GROQ_CASCADE = "true";
  let geminiCalled = false;
  installFakeFetch(t, {
    groq: () => groqOkResponse("groq says hello"),
    gemini: () => { geminiCalled = true; return geminiOkResponse(); }
  });

  const text = await generateChatText({ system: "sys", prompt: "hi", feature: "test" });
  assert.equal(text, "groq says hello");
  assert.equal(geminiCalled, false, "Gemini must not be called when Groq already answered");
});

test("generateChatText: Groq enabled + 429 (rate limit) falls through to Gemini", async t => {
  process.env.ENABLE_GROQ_CASCADE = "true";
  installFakeFetch(t, {
    groq: () => new Response("rate limited", { status: 429 }),
    gemini: () => geminiOkResponse()
  });

  const text = await generateChatText({ system: "sys", prompt: "hi", feature: "test" });
  assert.equal(text, "gemini says hello");
});

test("generateChatText: Groq enabled + 500 falls through to Gemini", async t => {
  process.env.ENABLE_GROQ_CASCADE = "true";
  installFakeFetch(t, {
    groq: () => new Response("server error", { status: 500 }),
    gemini: () => geminiOkResponse()
  });

  const text = await generateChatText({ system: "sys", prompt: "hi", feature: "test" });
  assert.equal(text, "gemini says hello");
});

test("generateChatText: Groq enabled + timeout falls through to Gemini", async t => {
  process.env.ENABLE_GROQ_CASCADE = "true";
  installFakeFetch(t, {
    // Never resolves on its own — only the AbortController's abort (fired
    // by the short GROQ_CASCADE_TIMEOUT_MS set above) ends this call.
    groq: (href, opts) => new Promise((resolve, reject) => {
      opts.signal.addEventListener("abort", () => {
        const err = new Error("The operation was aborted");
        err.name = "AbortError";
        reject(err);
      });
    }),
    gemini: () => geminiOkResponse()
  });

  const text = await generateChatText({ system: "sys", prompt: "hi", feature: "test" });
  assert.equal(text, "gemini says hello");
});

test("generateChatText: Groq enabled + malformed/empty body falls through to Gemini", async t => {
  process.env.ENABLE_GROQ_CASCADE = "true";
  installFakeFetch(t, {
    groq: () => new Response(JSON.stringify({ choices: [] }), { status: 200 }),
    gemini: () => geminiOkResponse()
  });

  const text = await generateChatText({ system: "sys", prompt: "hi", feature: "test" });
  assert.equal(text, "gemini says hello");
});

test("generateChatText: Groq enabled + network error (fetch throws) falls through to Gemini", async t => {
  process.env.ENABLE_GROQ_CASCADE = "true";
  installFakeFetch(t, {
    groq: () => { throw new Error("ECONNREFUSED"); },
    gemini: () => geminiOkResponse()
  });

  const text = await generateChatText({ system: "sys", prompt: "hi", feature: "test" });
  assert.equal(text, "gemini says hello");
});

test("generateChatText: Groq enabled but GROQ_API_KEY missing skips Groq cleanly, Gemini still answers", async t => {
  process.env.ENABLE_GROQ_CASCADE = "true";
  const savedKey = process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY = "";
  t.after(() => { process.env.GROQ_API_KEY = savedKey; });
  installFakeFetch(t, {
    groq: () => groqOkResponse(),
    gemini: () => geminiOkResponse()
  });

  const text = await generateChatText({ system: "sys", prompt: "hi", feature: "test" });
  assert.equal(text, "gemini says hello");
});

test("generateChatJSON: Groq enabled + happy path parses Groq's JSON", async t => {
  process.env.ENABLE_GROQ_CASCADE = "true";
  let geminiCalled = false;
  installFakeFetch(t, {
    groq: () => groqOkResponse('{"question": "groq question"}'),
    gemini: () => { geminiCalled = true; return geminiOkResponse(GEMINI_JSON_BODY); }
  });

  const parsed = await generateChatJSON({ system: "sys", prompt: "hi", feature: "test" });
  assert.deepEqual(parsed, { question: "groq question" });
  assert.equal(geminiCalled, false);
});

test("generateChatJSON: Groq returns unparsable text, falls back to Gemini", async t => {
  process.env.ENABLE_GROQ_CASCADE = "true";
  installFakeFetch(t, {
    groq: () => groqOkResponse("not json at all"),
    gemini: () => geminiOkResponse(GEMINI_JSON_BODY)
  });

  const parsed = await generateChatJSON({ system: "sys", prompt: "hi", feature: "test" });
  assert.deepEqual(parsed, { question: "gemini question" });
});

test("generateChatJSON: Groq returns valid JSON that fails `validate`, falls back to Gemini", async t => {
  process.env.ENABLE_GROQ_CASCADE = "true";
  installFakeFetch(t, {
    groq: () => groqOkResponse('{"wrong_key": "oops"}'),
    gemini: () => geminiOkResponse(GEMINI_JSON_BODY)
  });

  const parsed = await generateChatJSON({
    system: "sys", prompt: "hi", feature: "test",
    validate: p => typeof p?.question === "string" && p.question.length > 0
  });
  assert.deepEqual(parsed, { question: "gemini question" });
});

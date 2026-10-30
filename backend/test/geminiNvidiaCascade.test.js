// chat.js's ungrounded Q&A/chat passthrough can now try
// nvidia/nemotron-3-ultra-550b-a55b first (ENABLE_NVIDIA_CASCADE=true) before
// falling back to the existing Gemini cascade (src/lib/gemini.js's
// generateChatText). No real network calls: global.fetch is mocked per test
// so every NVIDIA failure mode (429, 500, timeout, malformed body) can be
// proven to fall through to a working Gemini response without burning any
// real API quota or waiting out a real multi-second timeout.
import { test } from "node:test";
import assert from "node:assert/strict";

// Env vars read by gemini.js at module load time (NVIDIA_BASE_URL/API_KEY,
// the timeout) must be set BEFORE the module is imported — a static import
// at the top of this file would be hoisted ahead of any process.env
// assignment, so the import is dynamic and deliberately placed after setup.
process.env.NVIDIA_NEMOTRON3_ULTRA_BASE_URL = "https://fake-nvidia.test/v1";
process.env.NVIDIA_NEMOTRON3_ULTRA_API_KEY = "test-nvidia-key";
process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.SUPABASE_URL = "https://fake-supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-supabase-key";
// Short-circuits the real 4000ms AbortController timeout so the "NVIDIA
// times out" test doesn't actually wait 4s — see NVIDIA_TIMEOUT_MS in
// gemini.js, overridable via this env var for tests only.
process.env.NVIDIA_CASCADE_TIMEOUT_MS = "50";

const { generateChatText } = await import("../src/lib/gemini.js");

const GEMINI_OK_BODY = {
  candidates: [{ content: { parts: [{ text: "gemini says hello" }] } }]
};

function nvidiaOkResponse(text = "nvidia says hello") {
  return new Response(
    JSON.stringify({ choices: [{ message: { content: text } }] }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function geminiOkResponse() {
  return new Response(JSON.stringify(GEMINI_OK_BODY), { status: 200 });
}

// Anything that isn't the NVIDIA or Gemini generation endpoint (e.g. the
// fire-and-forget llm_call_log insert via supabase-js) gets a harmless 200
// so it never throws an unhandled rejection or slows the test down.
function fallbackOkResponse() {
  return new Response(JSON.stringify({}), { status: 200 });
}

function installFakeFetch(t, { nvidia, gemini }) {
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const href = typeof url === "string" ? url : url.toString();
    if (href.includes("fake-nvidia.test")) {
      return nvidia(href, opts);
    }
    if (href.includes("generativelanguage.googleapis.com")) {
      return gemini(href, opts);
    }
    return fallbackOkResponse();
  });
}

test("generateChatText: NVIDIA cascade disabled (flag unset) goes straight to Gemini, never calls NVIDIA", async t => {
  delete process.env.ENABLE_NVIDIA_CASCADE;
  let nvidiaCalled = false;
  installFakeFetch(t, {
    nvidia: () => { nvidiaCalled = true; return nvidiaOkResponse(); },
    gemini: () => geminiOkResponse()
  });

  const text = await generateChatText({ system: "sys", prompt: "hi", feature: "test" });
  assert.equal(text, "gemini says hello");
  assert.equal(nvidiaCalled, false, "NVIDIA must not be called when the flag is off");
});

test("generateChatText: NVIDIA enabled + happy path uses NVIDIA's response, formatted the same way", async t => {
  process.env.ENABLE_NVIDIA_CASCADE = "true";
  let geminiCalled = false;
  installFakeFetch(t, {
    nvidia: () => nvidiaOkResponse("nvidia says hello"),
    gemini: () => { geminiCalled = true; return geminiOkResponse(); }
  });

  const text = await generateChatText({ system: "sys", prompt: "hi", feature: "test" });
  assert.equal(text, "nvidia says hello");
  assert.equal(geminiCalled, false, "Gemini must not be called when NVIDIA already answered");
});

test("generateChatText: NVIDIA enabled + 429 (rate limit) falls through to Gemini", async t => {
  process.env.ENABLE_NVIDIA_CASCADE = "true";
  installFakeFetch(t, {
    nvidia: () => new Response("rate limited", { status: 429 }),
    gemini: () => geminiOkResponse()
  });

  const text = await generateChatText({ system: "sys", prompt: "hi", feature: "test" });
  assert.equal(text, "gemini says hello");
});

test("generateChatText: NVIDIA enabled + 500 falls through to Gemini", async t => {
  process.env.ENABLE_NVIDIA_CASCADE = "true";
  installFakeFetch(t, {
    nvidia: () => new Response("server error", { status: 500 }),
    gemini: () => geminiOkResponse()
  });

  const text = await generateChatText({ system: "sys", prompt: "hi", feature: "test" });
  assert.equal(text, "gemini says hello");
});

test("generateChatText: NVIDIA enabled + timeout falls through to Gemini", async t => {
  process.env.ENABLE_NVIDIA_CASCADE = "true";
  installFakeFetch(t, {
    // Never resolves on its own — only the AbortController's abort (fired
    // by the short NVIDIA_CASCADE_TIMEOUT_MS set above) ends this call.
    nvidia: (href, opts) => new Promise((resolve, reject) => {
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

test("generateChatText: NVIDIA enabled + malformed/empty body falls through to Gemini", async t => {
  process.env.ENABLE_NVIDIA_CASCADE = "true";
  installFakeFetch(t, {
    nvidia: () => new Response(JSON.stringify({ choices: [] }), { status: 200 }),
    gemini: () => geminiOkResponse()
  });

  const text = await generateChatText({ system: "sys", prompt: "hi", feature: "test" });
  assert.equal(text, "gemini says hello");
});

test("generateChatText: NVIDIA enabled + network error (fetch throws) falls through to Gemini", async t => {
  process.env.ENABLE_NVIDIA_CASCADE = "true";
  installFakeFetch(t, {
    nvidia: () => { throw new Error("ECONNREFUSED"); },
    gemini: () => geminiOkResponse()
  });

  const text = await generateChatText({ system: "sys", prompt: "hi", feature: "test" });
  assert.equal(text, "gemini says hello");
});

test("generateChatText: NVIDIA enabled but base URL/key missing skips NVIDIA cleanly, Gemini still answers", async t => {
  process.env.ENABLE_NVIDIA_CASCADE = "true";
  const savedUrl = process.env.NVIDIA_NEMOTRON3_ULTRA_BASE_URL;
  const savedKey = process.env.NVIDIA_NEMOTRON3_ULTRA_API_KEY;
  process.env.NVIDIA_NEMOTRON3_ULTRA_BASE_URL = "";
  process.env.NVIDIA_NEMOTRON3_ULTRA_API_KEY = "";
  t.after(() => {
    process.env.NVIDIA_NEMOTRON3_ULTRA_BASE_URL = savedUrl;
    process.env.NVIDIA_NEMOTRON3_ULTRA_API_KEY = savedKey;
  });
  installFakeFetch(t, {
    nvidia: () => nvidiaOkResponse(),
    gemini: () => geminiOkResponse()
  });

  const text = await generateChatText({ system: "sys", prompt: "hi", feature: "test" });
  assert.equal(text, "gemini says hello");
});

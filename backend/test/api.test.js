// Integration tests against a real running instance of the backend (spawned
// below), talking to the real Supabase + Gemini backends configured in
// backend/.env — same as every manual verification done throughout this
// project's build, just made repeatable. Kept deliberately cheap: most tests
// only exercise validation/auth-gating (no Gemini call at all), and only a
// couple of tests make one small real generation call each, to keep repeated
// test runs from burning meaningful API cost.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const PORT = 4001; // different from the dev server's 4000, so `npm test` doesn't fight a running `npm start`
const BASE = `http://localhost:${PORT}`;

let serverProcess;
let token;

async function waitForHealth(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error("Server did not become healthy in time.");
}

before(async () => {
  serverProcess = spawn(process.execPath, ["src/server.js"], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    env: { ...process.env, PORT: String(PORT) },
    stdio: "pipe"
  });
  await waitForHealth();

  const loginRes = await fetch(`${BASE}/api/dev/test-login`, { method: "POST" });
  const loginData = await loginRes.json();
  token = loginData.access_token;
  assert.ok(token, "dev test-login must return an access_token for the rest of the suite to run");
});

after(() => {
  if (serverProcess) serverProcess.kill();
});

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: "Bearer " + token };
}

test("GET /health returns ok", async () => {
  const res = await fetch(`${BASE}/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
});

test("resume routes reject requests with no auth token", async () => {
  const res = await fetch(`${BASE}/api/resume/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: "Why this role?", answer: "Because I want it." })
  });
  assert.equal(res.status, 401);
});

test("resume/feedback validates missing fields before touching Gemini", async () => {
  const res = await fetch(`${BASE}/api/resume/feedback`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ question: "Why this role?" }) // no answer
  });
  assert.equal(res.status, 400);
});

test("resume/interrogate rejects an invalid category", async () => {
  const res = await fetch(`${BASE}/api/resume/interrogate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ resumeText: "x".repeat(30), category: "NotARealCategory" })
  });
  assert.equal(res.status, 400);
});

test("resume/interrogate rejects a too-short resumeText", async () => {
  const res = await fetch(`${BASE}/api/resume/interrogate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ resumeText: "too short" })
  });
  assert.equal(res.status, 400);
});

test("tone/shift rejects an unsupported tone", async () => {
  const res = await fetch(`${BASE}/api/tone/shift`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ text: "Led a team of 5 engineers.", tones: ["sarcastic"] })
  });
  assert.equal(res.status, 400);
});

test("community/contribute rejects an invalid type", async () => {
  const res = await fetch(`${BASE}/api/community/contribute`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ type: "not_a_real_type", content: "Some contribution content here." })
  });
  assert.equal(res.status, 400);
});

test("GET /api/community lists contributions without requiring auth", async () => {
  const res = await fetch(`${BASE}/api/community`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.contributions));
});

test("GET /api/frameworks returns a list (optionally auth'd) shape", async () => {
  const res = await fetch(`${BASE}/api/frameworks`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.frameworks));
});

test("mock-interview/answer 404s for an unknown session", async () => {
  const res = await fetch(`${BASE}/api/mock-interview/answer`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ sessionId: "00000000-0000-0000-0000-000000000000", userAnswer: "A real answer here." })
  });
  assert.equal(res.status, 404);
});

test("resume/questions/clarify validates a too-short followUp", async () => {
  const res = await fetch(`${BASE}/api/resume/questions/clarify`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ question: "Some situational question here.", followUp: "?" })
  });
  assert.equal(res.status, 400);
});

// The two real, billed Gemini calls in this suite — kept to a minimum but
// present, because validation-only coverage wouldn't catch a broken prompt
// or a schema mismatch against the live model.
test("resume/feedback returns real, structured feedback (real Gemini call)", async () => {
  const res = await fetch(`${BASE}/api/resume/feedback`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      question: "Tell me about a time you led a team through a difficult decision.",
      answer: "I led a 12-person team through a scope cut two weeks before launch, prioritizing the core checkout flow over three nice-to-have features after reviewing usage data with stakeholders."
    })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.good));
  assert.ok(Array.isArray(data.fix));
});

test("tone/shift returns one rewritten variation per requested tone (real Gemini call)", async () => {
  const res = await fetch(`${BASE}/api/tone/shift`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ text: "Led a 4-member team to redesign onboarding, cutting drop-off 18%.", tones: ["professional"] })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.variations.length, 1);
  assert.equal(data.variations[0].tone, "professional");
  assert.ok(data.variations[0].text.length > 0);
});

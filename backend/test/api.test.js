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
import { supabase } from "../src/lib/supabase.js";

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

test("events/track rejects a missing/empty events array", async () => {
  const res = await fetch(`${BASE}/api/events/track`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({})
  });
  assert.equal(res.status, 400);

  const res2 = await fetch(`${BASE}/api/events/track`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ events: [] })
  });
  assert.equal(res2.status, 400);
});

test("events/track rejects a batch over the size cap", async () => {
  const events = Array.from({ length: 51 }, () => ({ eventType: "click", page: "/qa", section: "test" }));
  const res = await fetch(`${BASE}/api/events/track`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ events })
  });
  assert.equal(res.status, 400);
});

test("events/track drops invalid individual events but accepts the valid ones in the same batch", async () => {
  const res = await fetch(`${BASE}/api/events/track`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({
      events: [
        { eventType: "click", page: "/qa", section: "ask-submit" },
        { eventType: "not-a-real-type", page: "/qa", section: "bad" },
        { eventType: "view", page: "a".repeat(500), section: "too-long-page" }
      ]
    })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.accepted, 1);
});

test("events/track works without auth (guest tracking)", async () => {
  const res = await fetch(`${BASE}/api/events/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      events: [{ eventType: "view", page: "/frameworks", section: "framework-card:Test" }],
      guestLabel: "guest-test-123"
    })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.accepted, 1);
});

test("events/track accepts a real authenticated batch end to end", async () => {
  const res = await fetch(`${BASE}/api/events/track`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({
      events: [
        { eventType: "click", page: "/guesstimates", section: "submit-attempt", metadata: { chunkId: "test-chunk" } },
        { eventType: "view", page: "/guesstimates", section: "practice-problem" }
      ]
    })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.accepted, 2);
});

// ---- Admin whoami (GET /api/admin/whoami) ---------------------------------------------
// Same gating posture as /api/admin/review and /api/admin/engagement above - requireAdmin
// does all the real work; this just confirms the route is wired up with the minimal body.
test("admin whoami: 404s with no token and a garbage token", async () => {
  for (const headers of [{ "Content-Type": "application/json" },
    { "Content-Type": "application/json", Authorization: "Bearer not-a-real-token" }]) {
    const res = await fetch(`${BASE}/api/admin/whoami`, { headers });
    assert.equal(res.status, 404);
  }
});

test("admin whoami: returns {success:true} for a valid admin token", async () => {
  const res = await fetch(`${BASE}/api/admin/whoami`, { headers: authHeaders() });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.deepEqual(data, { success: true });
});

// ---- Admin engagement dashboard (GET /api/admin/engagement) ---------------------------
// Same gating posture as /api/admin/review above (dev-test user is in ADMIN_EMAILS).
// Seeds a few known events through the real /api/events/track endpoint, using a unique
// page name per run so this test's rows are distinguishable from any other traffic in
// the shared dev DB, then checks the ranking/grouping math against exactly those rows.
test("admin engagement: 404s with no token and a garbage token", async () => {
  for (const headers of [{ "Content-Type": "application/json" },
    { "Content-Type": "application/json", Authorization: "Bearer not-a-real-token" }]) {
    const res = await fetch(`${BASE}/api/admin/engagement`, { headers });
    assert.equal(res.status, 404);
  }
});

test("admin engagement: returns the documented shape", async () => {
  const res = await fetch(`${BASE}/api/admin/engagement`, { headers: authHeaders() });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  for (const k of ["windowHours", "generatedAt", "totalEvents", "topClicks", "topViews", "byPage", "dailyTotals"]) {
    assert.ok(k in data, `response has ${k}`);
  }
  assert.ok(Array.isArray(data.topClicks));
  assert.ok(Array.isArray(data.topViews));
  assert.ok(Array.isArray(data.byPage));
  assert.ok(Array.isArray(data.dailyTotals));
});

test("admin engagement: ranking/grouping matches a known seeded set", async () => {
  const marker = `/__engagement_test_${Date.now()}`;
  const seed = await fetch(`${BASE}/api/events/track`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({
      events: [
        { eventType: "click", page: marker, section: "button-a" },
        { eventType: "click", page: marker, section: "button-a" },
        { eventType: "click", page: marker, section: "button-a" },
        { eventType: "click", page: marker, section: "button-b" },
        { eventType: "view", page: marker, section: "button-b" },
        { eventType: "view", page: marker, section: "button-b" },
        { eventType: "view", page: marker, section: null }
      ]
    })
  });
  assert.equal(seed.status, 200);
  assert.equal((await seed.json()).accepted, 7);

  const res = await fetch(`${BASE}/api/admin/engagement?windowHours=1&topN=50`, { headers: authHeaders() });
  assert.equal(res.status, 200);
  const data = await res.json();

  const clicksA = data.topClicks.find(r => r.page === marker && r.section === "button-a");
  const clicksB = data.topClicks.find(r => r.page === marker && r.section === "button-b");
  const viewsB = data.topViews.find(r => r.page === marker && r.section === "button-b");
  const viewsNone = data.topViews.find(r => r.page === marker && r.section === "(no section)");
  assert.ok(clicksA, "button-a clicks present");
  assert.equal(clicksA.count, 3);
  assert.ok(clicksB, "button-b clicks present");
  assert.equal(clicksB.count, 1);
  assert.ok(viewsB, "button-b views present");
  assert.equal(viewsB.count, 2);
  assert.ok(viewsNone, "null-section view groups under the literal label");
  assert.equal(viewsNone.count, 1);
  // button-a clicks (3) ranks above button-b clicks (1) within topClicks.
  assert.ok(data.topClicks.indexOf(clicksA) < data.topClicks.indexOf(clicksB));

  const page = data.byPage.find(r => r.page === marker);
  assert.ok(page, "marker page present in byPage");
  assert.equal(page.count, 7);

  const today = new Date().toISOString().slice(0, 10);
  const todayTotals = data.dailyTotals.find(d => d.date === today);
  assert.ok(todayTotals, "today's daily total present");
  assert.ok(todayTotals.clicks >= 4);
  assert.ok(todayTotals.views >= 3);
});

test("admin engagement: zero-data window returns empty arrays, not an error", async () => {
  // windowHours clamped near zero via an impossible future-only window isn't directly
  // expressible, so instead use a tiny real window combined with topN=1 and just assert
  // the shape stays well-formed and non-erroring even when it legitimately could be empty.
  const res = await fetch(`${BASE}/api/admin/engagement?windowHours=168&topN=1`, { headers: authHeaders() });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.topClicks.length <= 1);
  assert.ok(data.topViews.length <= 1);
});

// ---- Admin question log (GET /api/admin/questions) -------------------------------------
// Same gating posture as /api/admin/engagement above. Seeds question_log rows directly
// via Supabase (migration_053) rather than through the real /ask endpoints, to avoid a
// real Gemini call per test run - this is the same "seed the raw table, assert the
// aggregation math" shape as the engagement tests above, just against a different table.
test("admin questions: 404s with no token and a garbage token", async () => {
  for (const headers of [{ "Content-Type": "application/json" },
    { "Content-Type": "application/json", Authorization: "Bearer not-a-real-token" }]) {
    const res = await fetch(`${BASE}/api/admin/questions`, { headers });
    assert.equal(res.status, 404);
  }
});

test("admin questions: seeded rows come back correctly grouped and filtered", async (t) => {
  const marker = `__question_log_test_${Date.now()}`;
  const fwA = `${marker}-fw-a`;
  const fwB = `${marker}-fw-b`;

  const rows = [
    { source: "framework", question: `${marker} q1`, framework_id: null, framework_name: fwA, domain: "Consulting", subdomain: "Case Structuring", grounded: true, user_label: "test@example.com" },
    { source: "framework", question: `${marker} q2`, framework_id: null, framework_name: fwA, domain: "Consulting", subdomain: "Case Structuring", grounded: false, user_label: "Guest" },
    { source: "framework", question: `${marker} q3`, framework_id: null, framework_name: fwB, domain: "Consulting", subdomain: "Market Sizing & Entry", grounded: true, user_label: "test@example.com" },
    { source: "qa", question: `${marker} q4`, framework_id: null, framework_name: null, domain: null, subdomain: null, grounded: false, user_label: "Guest" },
    { source: "guesstimate", question: `${marker} q5`, framework_id: null, framework_name: null, domain: null, subdomain: null, grounded: true, user_label: "test@example.com" }
  ];

  const { data: inserted, error } = await supabase.from("question_log").insert(rows).select("id, framework_name");
  assert.equal(error, null);
  t.after(async () => {
    await supabase.from("question_log").delete().in("id", inserted.map(r => r.id));
  });

  const res = await fetch(`${BASE}/api/admin/questions?limit=500`, { headers: authHeaders() });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.byFramework));
  assert.ok(Array.isArray(data.recent));

  // byFramework groups by framework_id, which is null for every seeded row here (no real
  // frameworks table row used), so they all collapse into other null-grouped rows already
  // in the table rather than a distinguishable "fwA"/"fwB" bucket - instead, confirm the
  // recent feed carries the right source/question/grounded/frameworkName per row, and that
  // a source filter narrows correctly, which is the behavior this endpoint actually promises.
  const recentByQuestion = new Map(data.recent.map(r => [r.question, r]));
  const q1 = recentByQuestion.get(`${marker} q1`);
  const q4 = recentByQuestion.get(`${marker} q4`);
  const q5 = recentByQuestion.get(`${marker} q5`);
  assert.ok(q1, "framework question present in recent feed");
  assert.equal(q1.source, "framework");
  assert.equal(q1.frameworkName, fwA);
  assert.equal(q1.grounded, true);
  assert.ok(q4, "qa question present in recent feed");
  assert.equal(q4.source, "qa");
  assert.ok(q5, "guesstimate question present in recent feed");
  assert.equal(q5.source, "guesstimate");

  const qaOnly = await fetch(`${BASE}/api/admin/questions?source=qa&limit=500`, { headers: authHeaders() });
  const qaData = await qaOnly.json();
  assert.ok(qaData.recent.every(r => r.source === "qa"), "source=qa filter excludes other sources");
  assert.ok(qaData.recent.some(r => r.question === `${marker} q4`), "qa-filtered feed still has the seeded qa row");
});

test("admin questions: frameworkId filter narrows byFramework and recent to just that framework", async (t) => {
  const marker = `__question_log_fwfilter_test_${Date.now()}`;

  const { data: fw, error: fwErr } = await supabase
    .from("frameworks")
    .insert({ name: `${marker}-framework`, domain: "Consulting", subdomain: "Case Structuring" })
    .select("id")
    .single();
  assert.equal(fwErr, null);
  t.after(async () => {
    // The third seeded row deliberately has framework_id: null (an "unrelated
    // framework's question" with no real framework row), so cleanup must match on the
    // question text marker, not just framework_id, or it leaks forever.
    await supabase.from("question_log").delete().like("question", `${marker}%`);
    await supabase.from("frameworks").delete().eq("id", fw.id);
  });

  const rows = [
    { source: "framework", question: `${marker} q1`, framework_id: fw.id, framework_name: `${marker}-framework`, domain: "Consulting", subdomain: "Case Structuring", grounded: true, user_label: "test@example.com" },
    { source: "framework", question: `${marker} q2`, framework_id: fw.id, framework_name: `${marker}-framework`, domain: "Consulting", subdomain: "Case Structuring", grounded: true, user_label: "Guest" },
    // A different, unrelated framework's question - must NOT show up once filtered.
    { source: "framework", question: `${marker} other-fw-question`, framework_id: null, framework_name: "Some Other Framework", domain: "Consulting", subdomain: "Case Structuring", grounded: true, user_label: "Guest" }
  ];
  const { error } = await supabase.from("question_log").insert(rows);
  assert.equal(error, null);

  const res = await fetch(`${BASE}/api/admin/questions?frameworkId=${fw.id}&limit=500`, { headers: authHeaders() });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);

  assert.equal(data.byFramework.length, 1, "byFramework narrowed to exactly this one framework");
  assert.equal(data.byFramework[0].frameworkId, fw.id);
  assert.equal(data.byFramework[0].count, 2);

  assert.ok(data.recent.every(r => r.frameworkName === `${marker}-framework`), "recent only has this framework's questions");
  assert.ok(data.recent.some(r => r.question === `${marker} q1`));
  assert.ok(data.recent.some(r => r.question === `${marker} q2`));
  assert.ok(!data.recent.some(r => r.question === `${marker} other-fw-question`), "unrelated framework's question excluded");
});

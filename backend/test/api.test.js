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

// ---- R5 admin review queue (/api/admin/review/*) -------------------------------------
// Read + validation only: npm test runs against the real DB, so no successful write here
// (the reversible write round-trip is a manual step, see .gsd/phases/R5/02-PLAN.md).
// The local dev-test user is in ADMIN_EMAILS, so `token` is an admin token.
const REVIEW = `${BASE}/api/admin/review`;
const V5_DOC = "c1521f01-bcbf-4163-923d-dc501859dc31";
const UNKNOWN_UUID = "11111111-2222-4333-8444-555555555555";
const MIGRATION_041_SKIP =
  "migration 041 not applied yet (ingest_page_reviews / ingest_page_findings / ingest_review_page missing): " +
  "run backend/db/migration_041_ingest_review_queue.sql, then these tests run";

async function firstV5PageId() {
  const res = await fetch(`${REVIEW}/pages?document_id=${V5_DOC}`, { headers: authHeaders() });
  const data = await res.json();
  return data.pages[0].id;
}

// The RPC answers 503 (our "not set up" message) when PostgREST reports it missing.
async function reviewSchemaReady() {
  const res = await fetch(`${REVIEW}/pages/${UNKNOWN_UUID}/actions`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ action: "approve", expected_status: "pending" })
  });
  return res.status !== 503;
}

test("admin review: every route 404s with no token and with a garbage token", async () => {
  const pageId = await firstV5PageId();
  const routes = [
    ["GET", "/documents"],
    ["GET", `/pages?document_id=${V5_DOC}`],
    ["GET", `/pages/${pageId}`],
    ["GET", `/pages/${pageId}/image`],
    ["POST", `/pages/${pageId}/actions`]
  ];
  for (const [method, path] of routes) {
    for (const headers of [{ "Content-Type": "application/json" },
      { "Content-Type": "application/json", Authorization: "Bearer not-a-real-token" }]) {
      const res = await fetch(`${REVIEW}${path}`, {
        method, headers, body: method === "POST" ? JSON.stringify({ action: "approve", expected_status: "pending" }) : undefined
      });
      assert.equal(res.status, 404, `${method} ${path} (${headers.Authorization ? "garbage" : "no"} token)`);
    }
  }
});

test("admin review: GET /documents lists ingest documents with flagged counts", async () => {
  const res = await fetch(`${REVIEW}/documents`, { headers: authHeaders() });
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.ok(!text.includes("image_path"));
  const data = JSON.parse(text);
  assert.equal(data.success, true);
  assert.equal(data.default_document_id, V5_DOC);
  const v5 = data.documents.find(d => d.id === V5_DOC);
  assert.ok(v5, "v5 document listed");
  for (const k of ["source_file", "school", "year", "ingestion_version", "status", "flagged", "pending_flagged"]) {
    assert.ok(k in v5, `document has ${k}`);
  }
  assert.ok(v5.flagged > 0);
});

test("admin review: GET /pages (v5) returns the queue shape and no image_path", async () => {
  const res = await fetch(`${REVIEW}/pages?document_id=${V5_DOC}`, { headers: authHeaders() });
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.ok(!text.includes("image_path"));
  assert.ok(!text.includes("storage/v1"));
  const data = JSON.parse(text);
  assert.equal(data.success, true);
  assert.equal(data.total, data.pages.length);
  assert.ok(data.total > 0);
  assert.ok(Object.keys(data.reason_counts).length > 0);
  const p = data.pages[0];
  for (const k of ["id", "page_no", "review_status", "review_reasons", "diagram_count", "method", "finding_count", "last_action"]) {
    assert.ok(k in p, `page has ${k}`);
  }
  assert.ok(!("markdown" in p), "list stays small (no markdown)");
  const sorted = [...data.pages].sort((a, b) => a.page_no - b.page_no);
  assert.deepEqual(data.pages.map(x => x.page_no), sorted.map(x => x.page_no));
});

test("admin review: GET /pages/:id returns the page without image_path", async () => {
  const pageId = await firstV5PageId();
  const res = await fetch(`${REVIEW}/pages/${pageId}`, { headers: authHeaders() });
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.ok(!text.includes("image_path"));
  const data = JSON.parse(text);
  assert.equal(data.success, true);
  assert.ok(typeof data.page.markdown === "string");
  assert.ok(Array.isArray(data.findings) && Array.isArray(data.history));
  assert.equal(data.document.id, V5_DOC);
  assert.equal(data.prev_page_id, null, "first page in the queue has no previous page");
});

test("admin review: GET /pages/:id findings carry version info (needs migration 041)", async t => {
  if (!(await reviewSchemaReady())) return t.skip(MIGRATION_041_SKIP);
  const pageId = await firstV5PageId();
  const data = await (await fetch(`${REVIEW}/pages/${pageId}`, { headers: authHeaders() })).json();
  assert.equal(data.review_schema_ready, true);
  for (const f of data.findings) {
    assert.ok("ingestion_version" in f && typeof f.is_current_version === "boolean");
  }
});

test("admin review: image endpoint returns a no-store PNG", async () => {
  const pageId = await firstV5PageId();
  const res = await fetch(`${REVIEW}/pages/${pageId}/image`, { headers: authHeaders() });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/png");
  assert.match(res.headers.get("cache-control"), /no-store/);
  const bytes = Buffer.from(await res.arrayBuffer());
  assert.deepEqual([...bytes.subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47]);
});

test("admin review: bad input is rejected before any write", async () => {
  const pageId = await firstV5PageId();
  const post = body => fetch(`${REVIEW}/pages/${pageId}/actions`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(body)
  });

  let res = await post({ action: "nope" });
  assert.equal(res.status, 400);

  res = await post({ action: "approve" });
  assert.equal(res.status, 400, "expected_status is required");
  assert.match((await res.json()).error, /expected_status is required/);

  res = await post({ action: "reopen", expected_status: "pending" });
  assert.equal(res.status, 400, "reopen of a pending page");

  res = await post({ action: "edit_approve", expected_status: "pending", markdown: "Text\n```placewise-diagram\n{\"type\": \"flow\", \"nodes\": [\n```" });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.block_errors.length, 1);
  assert.match(data.block_errors[0].errors[0], /invalid JSON/);

  res = await post({ action: "mark_wrong", note: "   ", expected_status: "pending" });
  assert.equal(res.status, 400);

  for (const path of ["/pages/not-a-uuid", "/pages/not-a-uuid/image", "/pages?document_id=nope"]) {
    res = await fetch(`${REVIEW}${path}`, { headers: authHeaders() });
    assert.equal(res.status, 400, path);
  }
  res = await fetch(`${REVIEW}/pages/not-a-uuid/actions`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ action: "approve", expected_status: "pending" })
  });
  assert.equal(res.status, 400);
});

test("admin review: a well-formed unknown page id is 404", async () => {
  let res = await fetch(`${REVIEW}/pages/${UNKNOWN_UUID}`, { headers: authHeaders() });
  assert.equal(res.status, 404);
  res = await fetch(`${REVIEW}/pages/${UNKNOWN_UUID}/image`, { headers: authHeaders() });
  assert.equal(res.status, 404);
  assert.equal((await res.json()).error, "Image not found.");
});

test("admin review: an action on an unknown page id is 404 from the RPC (needs migration 041)", async t => {
  if (!(await reviewSchemaReady())) return t.skip(MIGRATION_041_SKIP);
  const res = await fetch(`${REVIEW}/pages/${UNKNOWN_UUID}/actions`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ action: "approve", expected_status: "pending" })
  });
  assert.equal(res.status, 404);
});

// A real, valid token for a NON-admin user must get the same bare 404 as no token.
// A second server where ADMIN_EMAILS excludes the dev-test user makes its dev token a
// valid non-admin session (requireAdmin validates it with Supabase, then rejects it).
test("admin review: a valid non-admin token gets 404 on all 5 review routes", async () => {
  const pageId = await firstV5PageId();
  const port = PORT + 1;
  const base = `http://localhost:${port}`;
  const child = spawn(process.execPath, ["src/server.js"], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    env: { ...process.env, PORT: String(port), ADMIN_EMAILS: "nobody@example.invalid" },
    stdio: "pipe"
  });
  try {
    const start = Date.now();
    for (;;) {
      try { if ((await fetch(`${base}/health`)).ok) break; } catch {}
      if (Date.now() - start > 15000) throw new Error("non-admin server did not start");
      await new Promise(r => setTimeout(r, 250));
    }
    const login = await (await fetch(`${base}/api/dev/test-login`, { method: "POST" })).json();
    assert.ok(login.access_token, "dev token issued");
    const headers = { "Content-Type": "application/json", Authorization: "Bearer " + login.access_token };

    // Sanity: the token is valid (a normal authenticated route accepts it).
    const ok = await fetch(`${base}/api/frameworks`, { headers });
    assert.equal(ok.status, 200);

    const routes = [
      ["GET", "/documents"],
      ["GET", `/pages?document_id=${V5_DOC}`],
      ["GET", `/pages/${pageId}`],
      ["GET", `/pages/${pageId}/image`],
      ["POST", `/pages/${pageId}/actions`]
    ];
    for (const [method, path] of routes) {
      const res = await fetch(`${base}/api/admin/review${path}`, {
        method, headers,
        body: method === "POST" ? JSON.stringify({ action: "approve", expected_status: "pending" }) : undefined
      });
      assert.equal(res.status, 404, `${method} ${path} (valid non-admin token)`);
      assert.equal((await res.arrayBuffer()).byteLength, 0, `${method} ${path} returns an empty body`);
    }
  } finally {
    child.kill();
  }
});

// Isolation guarantees for sandbox.js - the out-of-process runner for
// model-generated reference solutions. No Gemini calls, no network.
// Each case here was a real, reproduced failure before sandbox.js existed:
// generated Python could read the service-role key, and a runaway loop
// froze the whole server.
import { test } from "node:test";
import assert from "node:assert/strict";

const FAKE_SECRET = "FAKE_SECRET_FOR_SANDBOX_TEST";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= FAKE_SECRET;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

const { runPythonSolve, runSqlQuery } = await import("../src/lib/skillContent.js");

const tryRead = expr => `import js
def solve():
    try:
        return str(${expr})
    except Exception as e:
        return "DENIED: " + str(e)[:120]
`;

test("generated Python sees an empty environment, not the API's secrets", async () => {
  const [env] = await runPythonSolve(tryRead("dict(js.Object.entries(js.process.env).to_py())"), [{ args: [] }]);
  assert.ok(!env.includes(secret), "service-role key visible to generated code");
  assert.equal(env, "{}");
});

test("generated Python can't read secrets from disk or /proc", async () => {
  for (const file of ["/proc/self/environ", `/proc/${process.pid}/environ`, new URL("../.env", import.meta.url).pathname]) {
    const [out] = await runPythonSolve(tryRead(`js.process.getBuiltinModule("fs").readFileSync("${file}", "utf8")`), [{ args: [] }]);
    assert.ok(!out.includes(secret), `secret leaked via ${file}`);
    assert.match(out, /^DENIED/, `${file} was readable`);
  }
});

test("generated Python can't start processes", async () => {
  const [out] = await runPythonSolve(tryRead(`js.process.getBuiltinModule("child_process").execSync("env")`), [{ args: [] }]);
  assert.match(out, /^DENIED/);
});

test("a runaway Python loop is killed on time without blocking the server's event loop", async () => {
  let ticks = 0;
  const ticker = setInterval(() => ticks++, 250);
  try {
    await assert.rejects(
      () => runPythonSolve("def solve():\n    while True:\n        pass\n", [{ args: [] }]),
      /Python verification timed out after 8000ms/
    );
  } finally {
    clearInterval(ticker);
  }
  assert.ok(ticks >= 20, `event loop was starved (only ${ticks} ticks)`);
});

test("a runaway recursive SQL query is killed on time", async () => {
  await assert.rejects(
    () => runSqlQuery("CREATE TABLE t(x);", "INSERT INTO t VALUES (1);", "WITH RECURSIVE c(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM c) SELECT count(*) FROM c;"),
    /SQL verification timed out after 8000ms/
  );
});

test("one job can't tamper with the next job's results", async () => {
  await runPythonSolve("import json\njson.dumps = lambda *a, **k: '[\"POISONED\"]'\ndef solve():\n    return 1\n", [{ args: [] }]).catch(() => {});
  assert.deepEqual(await runPythonSolve("def solve():\n    return 7\n", [{ args: [] }]), [7]);
});

test("test inputs can't break out of the harness", async () => {
  const input = "'''); import os #";
  assert.deepEqual(await runPythonSolve("def solve(s):\n    return s\n", [{ args: [input] }]), [input]);
});

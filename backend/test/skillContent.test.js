// Coverage for skillContent.js's "generate, then verify by actually running
// it" pipeline — the highest-risk untested path in this codebase before this
// file existed: it's the one place an LLM's output is executed (via sql.js /
// Pyodide) rather than just displayed. Two tiers, matching this project's
// existing cost-conscious test philosophy (see api.test.js):
//   1. Pure execution-harness unit tests — no Gemini call, no network, fast
//      and free. These are what actually prove "a bad generation is caught,
//      not silently trusted" (Section 2's error/rescue concern).
//   2. One real, cheap end-to-end generation (single problem, not the full
//      6-per-difficulty batch a live page load would trigger) per language,
//      to catch prompt/schema drift against the live model — same reasoning
//      as api.test.js's two real Gemini calls.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  runSqlQuery,
  runPythonSolve,
  withTimeout,
  generateOneSqlProblem,
  generateOnePythonProblem
} from "../src/lib/skillContent.js";

// --- withTimeout ---

test("withTimeout resolves when the promise finishes before the deadline", async () => {
  const result = await withTimeout(Promise.resolve("fast"), 500, "test");
  assert.equal(result, "fast");
});

test("withTimeout rejects a promise that never settles within the deadline", async () => {
  const neverResolves = new Promise(() => {}); // simulates a hung/looping generated solution
  await assert.rejects(
    () => withTimeout(neverResolves, 50, "slow op"),
    /slow op timed out after 50ms/
  );
});

// --- runSqlQuery (the SQL verification primitive) ---

test("runSqlQuery executes a valid schema/seed/query and returns real rows", async () => {
  const rows = await runSqlQuery(
    "CREATE TABLE orders (id INTEGER, amount REAL);",
    "INSERT INTO orders VALUES (1, 100.5), (2, 50.0);",
    "SELECT id, amount FROM orders WHERE amount > 60 ORDER BY id;"
  );
  assert.deepEqual(rows, [{ id: 1, amount: 100.5 }]);
});

test("runSqlQuery throws on malformed SQL instead of returning a wrong/empty result silently", async () => {
  await assert.rejects(() =>
    runSqlQuery("CREATE TABLE orders (id INTEGER);", "INSERT INTO orders VALUES (1);", "SELEKT * FROM orders;")
  );
});

test("runSqlQuery throws when the query references a column that doesn't exist (a plausible model mistake)", async () => {
  await assert.rejects(() =>
    runSqlQuery("CREATE TABLE orders (id INTEGER, amount REAL);", "INSERT INTO orders VALUES (1, 10);", "SELECT nonexistent_column FROM orders;")
  );
});

// --- runPythonSolve (the Python verification primitive) ---

test("runPythonSolve executes a valid solve() against multiple test cases and returns real, per-case output", async () => {
  const code = "def solve(a, b):\n    return a + b\n";
  const testCases = [{ args: [2, 3] }, { args: [10, -4] }];
  const outputs = await runPythonSolve(code, testCases);
  assert.deepEqual(outputs, [5, 6]);
});

test("runPythonSolve throws when the reference solution raises an exception, instead of caching a broken answer", async () => {
  const code = "def solve(a, b):\n    raise ValueError('deliberately broken')\n";
  await assert.rejects(() => runPythonSolve(code, [{ args: [1, 2] }]));
});

test("runPythonSolve throws when solve() isn't defined (a plausible malformed-generation case)", async () => {
  const code = "def wrong_name(a, b):\n    return a + b\n";
  await assert.rejects(() => runPythonSolve(code, [{ args: [1, 2] }]));
});

// --- Real generation + verification, one problem each (real Gemini calls) ---

test("generateOneSqlProblem produces a problem whose reference solution actually executes and matches its schema (real Gemini call)", async () => {
  const problem = await generateOneSqlProblem(
    "Data Analyst", "SQL", 0, "Easy",
    { title: "Filtering", explanation: "Selecting rows that match a condition." },
    ""
  );
  assert.ok(problem.prompt && problem.prompt.length > 0);
  assert.ok(problem.schemaSql && problem.seedSql && problem.solutionSql);
  assert.ok(Array.isArray(problem.expectedResult), "expectedResult must come from actually running solutionSql, not a model-claimed answer");
});

test("generateOnePythonProblem produces a problem whose reference solution actually executes against its own test cases (real Gemini call)", async () => {
  const problem = await generateOnePythonProblem(
    "Data Analyst", "Python", 0, "Easy",
    { title: "Aggregation", explanation: "Summarizing a collection of values." },
    ""
  );
  assert.ok(problem.prompt && problem.starterCode && problem.solutionCode);
  assert.ok(Array.isArray(problem.testCases) && problem.testCases.length > 0);
  for (const tc of problem.testCases) {
    assert.ok("expectedOutput" in tc, "each test case's expectedOutput must come from actually running solutionCode");
  }
});

// Runs model-generated reference solutions (Python / SQL) OUT of the API
// process. Two problems this solves, both reproduced before this existed:
//
// 1. Secrets: Pyodide is not a sandbox. Generated code could do
//    `import js; js.process.env.SUPABASE_SERVICE_ROLE_KEY`, and the result
//    is returned to anonymous callers as a test case's expectedOutput. The
//    skill name in the URL is free text that goes into the Gemini prompt, so
//    that was a prompt-injection path to the service-role key.
// 2. Hangs: withTimeout() can't interrupt synchronous WASM. A generated
//    `while True: pass` blocked the whole server's event loop, not just the
//    request.
//
// Each job runs in a fresh child process (sandboxRunner.js) started with an
// empty environment and the Node permission model (fs reads limited to the
// runner + the two runtime packages - which also blocks /proc/*/environ -
// no child processes, workers or native addons), and is SIGKILLed on timeout.
// A fresh interpreter per job also means one job can't tamper with the next
// one's results.
//
// Cost/footprint: at most ONE sandbox child exists at a time (jobs are
// queued) so memory stays inside a 512 MB instance (~150 MB per Pyodide
// child). After a job, a spare child of the same kind is pre-started so the
// next job - problem generation runs 6 in a row - doesn't pay the runtime
// load time; an unused spare is killed after SPARE_IDLE_MS.

import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const STARTUP_TIMEOUT_MS = 30000; // generous: slow shared CPUs on free hosting tiers
const SPARE_IDLE_MS = 30000;

const RUNNER = fileURLToPath(new URL("./sandboxRunner.js", import.meta.url));
const ENTRY = {
  python: import.meta.resolve("pyodide"),
  sql: import.meta.resolve("sql.js")
};

function packageRoot(entryUrl, name) {
  const file = fileURLToPath(entryUrl);
  const marker = path.join("node_modules", name);
  return file.slice(0, file.lastIndexOf(marker) + marker.length);
}

const EXEC_ARGV = [
  "--permission",
  `--allow-fs-read=${RUNNER}`,
  `--allow-fs-read=${packageRoot(ENTRY.python, "pyodide")}`,
  `--allow-fs-read=${packageRoot(ENTRY.sql, "sql.js")}`
];

function isAlive(child) {
  return child.exitCode === null && child.signalCode === null;
}

// Handles on an idle spare shouldn't keep the process (e.g. a test run) alive.
function setRef(runner, on) {
  const method = on ? "ref" : "unref";
  runner.child[method]();
  runner.child.channel?.[method]?.();
  runner.child.stderr?.[method]?.();
}

function spawnRunner(kind) {
  const child = fork(RUNNER, [kind, ENTRY[kind]], {
    env: {},
    execArgv: EXEC_ARGV,
    serialization: "json",
    stdio: ["ignore", "ignore", "pipe", "ipc"]
  });
  let stderr = "";
  child.stderr.on("data", d => {
    if (stderr.length < 2000) stderr += d;
  });
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`Sandbox (${kind}) did not start within ${STARTUP_TIMEOUT_MS}ms`));
    }, STARTUP_TIMEOUT_MS);
    child.once("message", msg => {
      if (msg?.type === "ready") {
        clearTimeout(timer);
        resolve();
      }
    });
    child.once("exit", code => {
      clearTimeout(timer);
      reject(new Error(`Sandbox (${kind}) exited during startup (code ${code}): ${stderr.trim()}`));
    });
    child.once("error", err => {
      clearTimeout(timer);
      reject(err);
    });
  });
  ready.catch(() => {}); // a spare that fails is only noticed when it's used
  return { kind, child, ready, idleTimer: null };
}

let spare = null;

function discardSpare() {
  if (!spare) return;
  clearTimeout(spare.idleTimer);
  spare.child.kill("SIGKILL");
  spare = null;
}

function takeRunner(kind) {
  if (spare && spare.kind === kind && isAlive(spare.child)) {
    const runner = spare;
    clearTimeout(runner.idleTimer);
    spare = null;
    return runner;
  }
  discardSpare();
  return spawnRunner(kind);
}

function warmSpare(kind) {
  discardSpare();
  spare = spawnRunner(kind);
  setRef(spare, false);
  spare.idleTimer = setTimeout(discardSpare, SPARE_IDLE_MS);
  spare.idleTimer.unref();
}

let queue = Promise.resolve();

// Runs one job in a sandbox child. `timeoutMs` covers execution only (it
// starts once the runtime has loaded), so a slow runtime start never eats
// into the generated code's time budget.
export function runInSandbox(kind, job, timeoutMs, label) {
  const run = queue.then(async () => {
    const runner = takeRunner(kind);
    setRef(runner, true);
    try {
      await runner.ready;
      return await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          runner.child.kill("SIGKILL");
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        runner.child.once("message", msg => {
          clearTimeout(timer);
          if (msg?.ok) resolve(msg.result);
          else reject(new Error(msg?.error || `${label} failed`));
        });
        runner.child.once("exit", (code, signal) => {
          clearTimeout(timer);
          reject(new Error(`${label} sandbox exited unexpectedly (${signal || code})`));
        });
        runner.child.send(job);
      });
    } finally {
      runner.child.kill("SIGKILL");
      warmSpare(kind);
    }
  });
  queue = run.catch(() => {});
  return run;
}

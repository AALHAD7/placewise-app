// Child-process half of sandbox.js - runs ONE model-generated reference
// solution (Python via Pyodide, or SQL via sql.js) and exits.
//
// The isolation comes from how sandbox.js launches this file, not from
// anything in here: an empty environment (no API keys exist in this
// process), the Node permission model (file reads limited to this file and
// the two runtime packages; no child processes, workers or native addons),
// and a hard SIGKILL on timeout. Pyodide and sql.js are NOT security
// boundaries on their own - Python can reach every JS global (process,
// fetch, ...) via `import js` - which is exactly why this runs out-of-process.
//
// Protocol: argv = [kind, runtimeEntryUrl]. Loads the runtime, sends
// {type:"ready"}, waits for one job message, replies {type:"result", ...}.

import { constants as fsConstants } from "node:fs";

const [, , kind, entryUrl] = process.argv;

// Pyodide's filesystem layer reads fs flag constants via the deprecated
// process.binding("constants"), which the permission model blocks outright.
// Serve exactly that one lookup from the public fs.constants; every other
// process.binding() call stays blocked.
const blockedBinding = process.binding;
process.binding = name => (name === "constants" ? { fs: fsConstants } : blockedBinding.call(process, name));

async function loadRunner() {
  // Imported by absolute URL (resolved by the parent) so no node_modules
  // lookup is needed - the permission model would deny those directory reads.
  const mod = await import(entryUrl);

  if (kind === "python") {
    const pyodide = await mod.loadPyodide({ stdout: () => {}, stderr: () => {} });
    return async ({ code, argsJson }) => {
      // Test inputs go in as a global rather than being spliced into the
      // source, so no input value can break out of a string literal.
      pyodide.globals.set("_ARGS_JSON", argsJson);
      const harness = `
import json as _json

${code}

_inputs = _json.loads(_ARGS_JSON)
_json.dumps([solve(*args) for args in _inputs])
`;
      return JSON.parse(await pyodide.runPythonAsync(harness));
    };
  }

  if (kind === "sql") {
    const SQL = await mod.default();
    return ({ schemaSql, seedSql, querySql }) => {
      const db = new SQL.Database();
      try {
        db.run(schemaSql);
        db.run(seedSql);
        const res = db.exec(querySql);
        if (!res.length) return [];
        const { columns, values } = res[0];
        return values.map(row => Object.fromEntries(columns.map((c, i) => [c, row[i]])));
      } finally {
        db.close();
      }
    };
  }

  throw new Error(`Unknown sandbox kind: ${kind}`);
}

const reply = msg => process.send(msg, () => process.exit(0));

try {
  const run = await loadRunner();
  process.once("message", async job => {
    try {
      reply({ type: "result", ok: true, result: await run(job) });
    } catch (err) {
      reply({ type: "result", ok: false, error: String(err?.message ?? err) });
    }
  });
  process.send({ type: "ready" });
} catch (err) {
  process.stderr.write(String(err?.stack ?? err));
  process.exit(1);
}

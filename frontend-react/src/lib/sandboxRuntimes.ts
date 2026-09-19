// sql.js and Pyodide are only loaded when a code-skill page is actually
// opened (not on every page load) - both are real WASM runtimes, no need
// to pay their download cost for users who never touch a SQL/Python skill
// page. Cached on `window` so re-running a problem, or opening a second
// code skill, doesn't reload the runtime. Ported verbatim from
// frontend/index.html lines 3438-3460.

interface SqlJsStatic {
  Database: new () => SqlJsDatabase;
}
interface SqlJsDatabase {
  run(sql: string): void;
  exec(sql: string): { columns: string[]; values: unknown[][] }[];
  close(): void;
}
interface PyodideInterface {
  runPythonAsync(code: string): Promise<string>;
}

declare global {
  interface Window {
    __pmhSqlJs?: SqlJsStatic;
    __pmhPyodide?: PyodideInterface;
    initSqlJs?: (opts: { locateFile: (f: string) => string }) => Promise<SqlJsStatic>;
    loadPyodide?: () => Promise<PyodideInterface>;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(s);
  });
}

export async function ensureSqlJs(): Promise<SqlJsStatic> {
  if (window.__pmhSqlJs) return window.__pmhSqlJs;
  if (!window.initSqlJs) await loadScript("https://cdn.jsdelivr.net/npm/sql.js@1.14.2/dist/sql-wasm.js");
  window.__pmhSqlJs = await window.initSqlJs!({ locateFile: (f) => "https://cdn.jsdelivr.net/npm/sql.js@1.14.2/dist/" + f });
  return window.__pmhSqlJs;
}

export async function ensurePyodide(): Promise<PyodideInterface> {
  if (window.__pmhPyodide) return window.__pmhPyodide;
  if (!window.loadPyodide) await loadScript("https://cdn.jsdelivr.net/pyodide/v0.28.3/full/pyodide.js");
  window.__pmhPyodide = await window.loadPyodide!();
  return window.__pmhPyodide;
}

export type { SqlJsDatabase };

export {};

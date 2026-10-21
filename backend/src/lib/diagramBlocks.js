// Parse and validate ```placewise-diagram fences in ingest_pages.markdown, for the R5
// admin review queue (edit-then-approve). This is a deliberately small JS port of the
// HARD rules in backend/ingestion/diagram_schema.py (extract_blocks / validate_block):
// only what makes a block undrawable is an error. Everything else (missing title or
// notes, chart_kind, empty edges, type "other") is a warning, so a reviewer can still
// approve. Keep in step with diagram_schema.py; R8 can share fixtures between the two.

export const KNOWN_TYPES = ["issue_tree", "matrix", "funnel", "flow", "chart", "table", "other"];
const FENCE_INFO = "placewise-diagram";
const OPEN_RE = /^```[ \t]*placewise-diagram[ \t]*$/;
const CLOSE_RE = /^```[ \t]*$/;
const TREE_DEPTH_CAP = 12;
const CHART_KINDS = ["bar", "line", "pie"];

function parse(raw) {
  try {
    return { json: JSON.parse(raw), parseError: null };
  } catch (err) {
    return { json: null, parseError: `invalid JSON: ${err.message}` };
  }
}

// Every ```placewise-diagram fence, in order: [{index, raw, json|null, parseError|null}].
// An opener that does not start its line (e.g. inside a table cell) and an unclosed
// fence are reported with a parseError, never silently dropped.
export function extractBlocks(markdown) {
  const lines = String(markdown || "").split("\n");
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (OPEN_RE.test(line)) {
      let close = -1;
      for (let j = i + 1; j < lines.length; j++) {
        if (CLOSE_RE.test(lines[j])) { close = j; break; }
      }
      if (close < 0) {
        blocks.push({ index: blocks.length, raw: lines.slice(i + 1).join("\n"), json: null,
          parseError: `unclosed ${FENCE_INFO} fence` });
        break;
      }
      const raw = lines.slice(i + 1, close).join("\n");
      blocks.push({ index: blocks.length, raw, ...parse(raw) });
      i = close;
    } else if (line.includes("```" + FENCE_INFO) && line.trim().indexOf("```") > 0) {
      blocks.push({ index: blocks.length, raw: line, json: null,
        parseError: "block inside a table cell (the fence must start its own line)" });
    }
  }
  return blocks;
}

const isStr = v => typeof v === "string";
const isNum = v => typeof v === "number" && Number.isFinite(v);
const isStrList = (v, allowNull = false) =>
  Array.isArray(v) && v.every(x => isStr(x) || (allowNull && x === null));

function checkTree(node, depth, path, errors) {
  if (depth > TREE_DEPTH_CAP) { errors.push(`issue_tree deeper than ${TREE_DEPTH_CAP} at ${path}`); return; }
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    errors.push(`tree node at ${path} must be an object with label and children`); return;
  }
  if (!isStr(node.label)) errors.push(`tree node at ${path} needs a string label`);
  if (!Array.isArray(node.children)) { errors.push(`tree node at ${path} needs a children list`); return; }
  node.children.forEach((c, k) => checkTree(c, depth + 1, `${path}.children[${k}]`, errors));
}

const TYPE_RULES = {
  issue_tree(obj, errors) {
    if (obj.root == null) { errors.push("issue_tree needs root"); return; }
    checkTree(obj.root, 1, "root", errors);
  },
  matrix(obj, errors) {
    const { rows, cols, cells } = obj;
    if (!isStrList(rows) || rows.length === 0) errors.push("matrix rows must be a non-empty list of strings");
    if (!isStrList(cols) || cols.length === 0) errors.push("matrix cols must be a non-empty list of strings");
    if (!Array.isArray(cells)) { errors.push("matrix cells must be a list of rows"); return; }
    if (Array.isArray(rows) && cells.length !== rows.length) {
      errors.push(`matrix has ${rows.length} rows but ${cells.length} cell rows`);
    }
    cells.forEach((row, r) => {
      if (!isStrList(row, true)) errors.push(`matrix cells[${r}] must be a list of strings`);
      else if (Array.isArray(cols) && row.length !== cols.length) {
        errors.push(`matrix cells[${r}] has ${row.length} entries, expected ${cols.length}`);
      }
    });
  },
  funnel(obj, errors) {
    if (!isStrList(obj.stages) || obj.stages.length < 2) errors.push("funnel stages must be a list of >= 2 strings");
  },
  flow(obj, errors, warnings) {
    const nodes = Array.isArray(obj.nodes) ? obj.nodes : [];
    if (!Array.isArray(obj.nodes) || nodes.length < 2) errors.push("flow needs >= 2 nodes");
    const ids = new Set();
    nodes.forEach((n, k) => {
      if (!n || typeof n !== "object" || !(isStr(n.id) || isNum(n.id)) || !isStr(n.label)) {
        errors.push(`flow nodes[${k}] needs id and label`); return;
      }
      if (ids.has(n.id)) errors.push(`flow node id ${JSON.stringify(n.id)} is duplicated`);
      ids.add(n.id);
    });
    if (!Array.isArray(obj.edges)) { errors.push("flow edges must be a list"); return; }
    if (nodes.length >= 2 && obj.edges.length === 0) warnings.push("flow has nodes but no edges");
    obj.edges.forEach((e, k) => {
      if (!e || typeof e !== "object" || !("from" in e) || !("to" in e)) {
        errors.push(`flow edges[${k}] needs from and to`); return;
      }
      for (const end of ["from", "to"]) {
        if (!ids.has(e[end])) errors.push(`flow edges[${k}].${end} = ${JSON.stringify(e[end])} is not a node id`);
      }
    });
  },
  chart(obj, errors, warnings) {
    if (!CHART_KINDS.includes(obj.chart_kind)) warnings.push(`chart_kind should be one of ${CHART_KINDS.join(", ")}`);
    if (!Array.isArray(obj.series)) { errors.push("chart series must be a list"); return; }
    let total = 0;
    obj.series.forEach((s, i) => {
      if (!s || typeof s !== "object" || !isStr(s.name) || !Array.isArray(s.points)) {
        errors.push(`chart series[${i}] needs name and points`); return;
      }
      s.points.forEach((p, j) => {
        const ok = Array.isArray(p) && p.length === 2 && (isStr(p[0]) || isNum(p[0])) && (p[1] === null || isNum(p[1]));
        if (!ok) errors.push(`chart series[${i}].points[${j}] must be [x, number|null]`);
        total++;
      });
    });
    if (total === 0) warnings.push("chart has no data points");
  },
  table(obj, errors) {
    if (!Array.isArray(obj.header)) errors.push("table header must be a list");
    if (!Array.isArray(obj.rows) || !obj.rows.every(r => Array.isArray(r))) errors.push("table rows must be a list of lists");
  },
  other(obj, errors, warnings) {
    if (!isStr(obj.description)) errors.push("other needs a description string");
    warnings.push("type 'other' always needs a close look");
  }
};

// Validate one parsed block: {errors: string[], warnings: string[]}.
export function validateBlock(obj) {
  const errors = [];
  const warnings = [];
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { errors: ["diagram block must be a JSON object"], warnings };
  }
  if (!KNOWN_TYPES.includes(obj.type)) {
    errors.push(`type ${JSON.stringify(obj.type)} is not one of ${KNOWN_TYPES.join(", ")}`);
    return { errors, warnings };
  }
  if (!("title" in obj)) warnings.push("title missing (use null when there is none)");
  if (!("notes" in obj)) warnings.push("notes missing (use [] when there are none)");
  if (!Number.isInteger(obj.source_page)) warnings.push("source_page should be the 1-based PDF page number");
  TYPE_RULES[obj.type](obj, errors, warnings);
  return { errors, warnings };
}

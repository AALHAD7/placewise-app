// One-off: generates a structured diagram (issue_tree | flow | matrix) for each framework
// named in TARGET_NAMES, grounded strictly in that framework's ALREADY-VERIFIED content in
// the `frameworks` table (description/example/steps/pitfalls) - no new casebook lookup, no
// new facts. The structure is deterministically rendered to ASCII by the same renderer
// functions frontend-react/src/lib/asciiDiagrams.ts already uses elsewhere (treeToAscii/
// flowToAscii/matrixToAscii, reimplemented here in plain JS since this is a one-off Node
// script, not a TS build step) - guaranteed-aligned box-drawing art, not an LLM hand-painting
// characters (which is fragile and was the actual cause of past misaligned-ASCII bugs on
// this project, per DOCUMENT.md).
//
// Usage: node scripts/generateFrameworkDiagrams.js
// Writes backups/framework-diagrams-<timestamp>.json (structure + rendered ASCII + title per
// framework) for manual review before hand-adding to asciiDiagrams.ts - this script never
// touches the database or frontend source.

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { supabase } from "../src/lib/supabase.js";
import { generateJSON } from "../src/lib/gemini.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TARGETS = [
  { name: "Dividend Discount Model (Gordon Growth Model)", hint: "flow" },
  { name: "DuPont Analysis", hint: "issue_tree" },
  { name: "Treasury Stock Method", hint: "flow" },
  { name: "Precedent Transaction Analysis", hint: "flow" },
  { name: "Residual Income Model", hint: "flow" },
  { name: "ADDIE Model", hint: "flow" },
  { name: "Harvard vs Michigan Models of HRM", hint: "issue_tree" },
  { name: "Kirkpatrick Model", hint: "flow" },
  { name: "Managerial Grid (Blake-Mouton)", hint: "matrix" },
  { name: "MoSCoW Method", hint: "issue_tree" },
  { name: "Freemium Model", hint: "issue_tree" },
  { name: "Net Promoter Score", hint: "flow" },
  { name: "Customer Satisfaction Score (CSAT)", hint: "flow" }
];

const SYSTEM_PROMPT =
  "You are turning one already-written, already-verified MBA Frameworks-page entry into a " +
  "structured diagram for a deterministic ASCII renderer. You will be given the framework's " +
  "description, example, steps, and pitfalls (already fact-checked - do not add, drop, or " +
  "change any claim, number, or name from them) and a suggested diagram type. Produce ONLY " +
  "the structure requested, using labels pulled from (or tightly paraphrased from) the given " +
  "content - never invent a new step, category, or number not already present.\n\n" +
  "For type 'issue_tree': a root label plus nested children (each child: {label, children?}), " +
  "2-4 levels deep, reflecting a real breakdown/hierarchy in the content (e.g. a metric split " +
  "into its components, two models each with their own sub-points).\n" +
  "For type 'flow': a short ordered list of {id, label} nodes (one per step, 3-7 nodes) plus " +
  "{from, to, label?} edges connecting each to the next in sequence - label an edge only if " +
  "the content specifies a real condition/branch, otherwise omit it.\n" +
  "For type 'matrix': xAxis/yAxis labels plus cols (2-3 short labels), rows (2-3 short " +
  "labels), and cells (rows x cols array of short label strings) - only for genuinely 2-" +
  "dimensional content (two independent axes with a labeled style/outcome in each cell).\n\n" +
  "Keep every label short (under 10 words) - this renders as fixed-width ASCII, long labels " +
  "break the layout. Respond with ONLY a JSON object: " +
  '{"type": "issue_tree"|"flow"|"matrix", "title": "short diagram title", ' +
  '"data": <the type-specific structure described above>}';

async function draftDiagram(fw, hint) {
  const prompt = `Framework: ${fw.name}\nSuggested type: ${hint}\n\n` +
    `Description: ${fw.description}\n\nExample: ${fw.example}\n\n` +
    `Steps:\n${(fw.steps || []).map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n` +
    `Pitfalls:\n${(fw.pitfalls || []).map(p => `- ${p}`).join("\n")}`;

  return generateJSON({
    system: SYSTEM_PROMPT,
    prompt,
    maxTokens: 900,
    temperature: 0.2,
    feature: "generateFrameworkDiagrams"
  });
}

// --- Plain-JS re-implementation of asciiDiagrams.ts's renderers (one-off script, not a TS
// build step - kept byte-for-byte equivalent to the real frontend functions) ---

function treeToAscii(node, prefix = "", isLast = true, isRoot = true) {
  if (!node) return "";
  const lines = [];
  const rawLabel = typeof node === "string" ? node : (node.label || "(node)");
  const label = String(rawLabel).replace(/\r?\n\s*/g, " · ").trim();
  const children = Array.isArray(node.children) ? node.children : [];

  if (isRoot) {
    lines.push(`[ ${label} ]`);
  } else {
    lines.push(`${prefix}${isLast ? "└── " : "├── "}[ ${label} ]`);
  }

  const childPrefix = isRoot ? "" : prefix + (isLast ? "    " : "│   ");
  for (let i = 0; i < children.length; i++) {
    const childIsLast = i === children.length - 1;
    lines.push(treeToAscii(children[i], childPrefix, childIsLast, false));
  }
  return lines.join("\n");
}

function flowToAscii(nodes, edges = []) {
  if (!Array.isArray(nodes) || nodes.length === 0) return "";
  const labelOf = new Map(nodes.map(n => [String(n.id), n.label]));
  const lines = [];
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const out = edges.filter(e => String(e.from) === String(n.id));
    lines.push(`┌── (${i + 1}) ${n.label}`);
    if (out.length > 0) {
      for (let j = 0; j < out.length; j++) {
        const target = labelOf.get(String(out[j].to)) || `Node ${out[j].to}`;
        const edgeNote = out[j].label ? ` [${out[j].label}]` : "";
        const isLastEdge = j === out.length - 1;
        lines.push(`│   ${isLastEdge ? "└──►" : "├──►"} ${target}${edgeNote}`);
      }
    }
  }
  return lines.join("\n");
}

function matrixToAscii(xAxis, yAxis, cols, rows, cells) {
  const colWidth = Math.max(...cols.map(c => c.length), ...cells.flat().map(c => (c || "").length), 12) + 2;
  const rowLabelWidth = Math.max(...rows.map(r => r.length), 8) + 2;
  const lines = [];
  if (xAxis) lines.push(" ".repeat(rowLabelWidth) + `  X-axis: ${xAxis}`);
  if (yAxis) lines.push(`Y-axis: ${yAxis}`);
  const header = " ".repeat(rowLabelWidth) + "│" + cols.map(c => ` ${c.padEnd(colWidth - 1)}`).join("│") + "│";
  const sep = "─".repeat(rowLabelWidth) + "┼" + cols.map(() => "─".repeat(colWidth)).join("┼") + "┤";
  lines.push(header, sep);
  rows.forEach((r, ri) => {
    const rowCells = (cells[ri] || []).map(c => ` ${(c || "").padEnd(colWidth - 1)}`).join("│");
    lines.push(r.padEnd(rowLabelWidth) + "│" + rowCells + "│");
  });
  return lines.join("\n");
}

function renderDiagram(diagram) {
  if (diagram.type === "issue_tree") return treeToAscii(diagram.data);
  if (diagram.type === "flow") return flowToAscii(diagram.data.nodes || diagram.data, diagram.data.edges || []);
  if (diagram.type === "matrix") {
    const d = diagram.data;
    return matrixToAscii(d.xAxis, d.yAxis, d.cols, d.rows, d.cells);
  }
  return null;
}

async function main() {
  const names = TARGETS.map(t => t.name);
  const { data: rows, error } = await supabase.from("frameworks").select("name,description,example,steps,pitfalls").in("name", names);
  if (error) throw new Error(error.message);
  const byName = new Map(rows.map(r => [r.name, r]));

  const results = [];
  for (const { name, hint } of TARGETS) {
    const fw = byName.get(name);
    if (!fw) {
      console.warn(`[diagrams] ${name}: NOT FOUND in frameworks table`);
      continue;
    }
    console.log(`[diagrams] ${name} (${hint})...`);
    try {
      const diagram = await draftDiagram(fw, hint);
      const ascii = renderDiagram(diagram);
      if (!ascii) {
        console.warn(`[diagrams] ${name}: renderer returned nothing for type ${diagram.type}`);
        results.push({ name, status: "render-failed", diagram });
        continue;
      }
      results.push({ name, status: "ok", type: diagram.type, title: diagram.title, data: diagram.data, ascii });
      console.log(`[diagrams] ${name}: ok (${diagram.type})`);
    } catch (err) {
      console.warn(`[diagrams] ${name}: FAILED - ${err.message}`);
      results.push({ name, status: "error", error: err.message });
    }
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(__dirname, "backups");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `framework-diagrams-${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  console.log(`\n[diagrams] done. ${results.filter(r => r.status === "ok").length}/${TARGETS.length} rendered.`);
  console.log(`[diagrams] output: ${outFile}`);
}

main().catch(err => {
  console.error("[diagrams] fatal:", err);
  process.exit(1);
});

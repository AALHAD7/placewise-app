// Regenerates ALL 42 original Frameworks-page diagrams through the same AI-generation +
// deterministic-render pipeline used for the 15 newly-discovered frameworks
// (generateFrameworkDiagrams.js), so every diagram on the page is produced the same way -
// no more hand-typed custom box art for the original 42 sitting next to generated
// tree/flow/matrix diagrams for everything else. This also caught a real bug: the old
// keyword-matching lookup made "AIDA Funnel" and "AARM Funnel" share one identical diagram
// (both matched the same "funnel" keyword rule) - each framework now gets its own,
// distinct, grounded diagram.
//
// Unlike generateFrameworkDiagrams.js (which was given a type hint per framework), this
// script lets the model pick issue_tree / flow / matrix itself, since picking a reasonable
// hint for 42 frameworks by hand isn't worth doing when the model can judge "is this a
// sequence, a hierarchy, or a 2D grid" from the content directly.
//
// Usage: node scripts/regenerateAllFrameworkDiagrams.js
// Output-only - never touches the database or frontend source. Writes
// backups/regenerated-diagrams-<timestamp>.json for review before hand-merging into
// asciiDiagrams.ts.

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { supabase } from "../src/lib/supabase.js";
import { generateJSON } from "../src/lib/gemini.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NAMES = JSON.parse(fs.readFileSync("/tmp/original_42_names.json", "utf8"));

const SYSTEM_PROMPT =
  "You are turning one already-written, already-verified MBA Frameworks-page entry into a " +
  "structured diagram for a deterministic ASCII renderer. You will be given the framework's " +
  "description, example, steps, and pitfalls (already fact-checked - do not add, drop, or " +
  "change any claim, number, or name from them). Choose whichever of these three diagram " +
  "types best fits the content, then produce ONLY that structure:\n\n" +
  "'issue_tree' - a root label plus nested children (each child: {label, children?}), 2-4 " +
  "levels deep - use this for a metric/concept that breaks down into components or " +
  "sub-categories (e.g. a ratio split into its drivers, a strategy with named sub-parts). " +
  "CRITICAL: never invent an intermediate grouping node to pair up items that don't actually " +
  "share a real category - if the framework's steps are N co-equal, independent items (e.g. " +
  "Porter's Five Forces: 5 flat forces, none of which groups under another), make them N " +
  "flat direct children of the root, not nested under 2-3 made-up parent labels. Only add a " +
  "middle layer when the source content ITSELF names a real grouping (e.g. SWOT's " +
  "Strengths/Weaknesses really are \"Internal\" and Opportunities/Threats really are " +
  "\"External\" - that's taught, not invented).\n" +
  "'flow' - an ordered list of {id, label} nodes (3-7 nodes, labels must NOT include their " +
  "own leading number like \"1.\" - the renderer numbers them automatically) plus {from, to, " +
  "label?} edges connecting each to the next in sequence - use this for a step-by-step " +
  "process or calculation.\n" +
  "'matrix' - xAxis/yAxis (plain strings, never arrays), cols (2-3 short labels), rows (2-3 " +
  "short labels), cells (rows x cols array of short label strings) - use this ONLY for " +
  "genuinely two-dimensional content (two independent axes with a named outcome/style in " +
  "each cell, like a 2x2 strategy grid).\n\n" +
  "Prefer 'flow' or 'issue_tree' when a framework could arguably fit more than one type - " +
  "'matrix' is for the minority of frameworks that are actually built around two axes.\n\n" +
  "Keep every label short (under 10 words) - this renders as fixed-width ASCII, long labels " +
  "break the layout. Respond with ONLY a JSON object: " +
  '{"type": "issue_tree"|"flow"|"matrix", "title": "short diagram title", ' +
  '"data": <the type-specific structure described above>}';

async function draftDiagram(fw) {
  const prompt = `Framework: ${fw.name}\n\nDescription: ${fw.description}\n\nExample: ${fw.example}\n\n` +
    `Steps:\n${(fw.steps || []).map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n` +
    `Pitfalls:\n${(fw.pitfalls || []).map(p => `- ${p}`).join("\n")}`;

  return generateJSON({
    system: SYSTEM_PROMPT,
    prompt,
    maxTokens: 900,
    temperature: 0.2,
    feature: "regenerateAllFrameworkDiagrams"
  });
}

function stripLeadingNumber(label) {
  return String(label).replace(/^\d+[.)]\s*/, "");
}

function treeToAscii(node, prefix = "", isLast = true, isRoot = true) {
  if (!node) return "";
  const lines = [];
  const rawLabel = typeof node === "string" ? node : (node.label || "(node)");
  const label = String(rawLabel).replace(/\r?\n\s*/g, " · ").trim();
  const children = Array.isArray(node.children) ? node.children : [];
  lines.push(isRoot ? `[ ${label} ]` : `${prefix}${isLast ? "└── " : "├── "}[ ${label} ]`);
  const childPrefix = isRoot ? "" : prefix + (isLast ? "    " : "│   ");
  for (let i = 0; i < children.length; i++) {
    lines.push(treeToAscii(children[i], childPrefix, i === children.length - 1, false));
  }
  return lines.join("\n");
}

function flowToAscii(nodes, edges = []) {
  if (!Array.isArray(nodes) || nodes.length === 0) return "";
  const labelOf = new Map(nodes.map(n => [String(n.id), stripLeadingNumber(n.label)]));
  const lines = [];
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const out = edges.filter(e => String(e.from) === String(n.id));
    lines.push(`┌── (${i + 1}) ${labelOf.get(String(n.id))}`);
    out.forEach((e, j) => {
      const target = labelOf.get(String(e.to)) || `Node ${e.to}`;
      const note = e.label ? ` [${e.label}]` : "";
      lines.push(`│   ${j === out.length - 1 ? "└──►" : "├──►"} ${target}${note}`);
    });
  }
  return lines.join("\n");
}

function matrixToAscii(xAxis, yAxis, cols, rows, cells) {
  const x = Array.isArray(xAxis) ? xAxis.join(" / ") : xAxis;
  const y = Array.isArray(yAxis) ? yAxis.join(" / ") : yAxis;
  const colWidth = Math.max(...cols.map(c => c.length), ...cells.flat().map(c => (c || "").length), 12) + 2;
  const rowLabelWidth = Math.max(...rows.map(r => r.length), 8) + 2;
  const lines = [];
  if (x) lines.push(" ".repeat(rowLabelWidth) + `  X-axis: ${x}`);
  if (y) lines.push(`Y-axis: ${y}`);
  lines.push(" ".repeat(rowLabelWidth) + "│" + cols.map(c => ` ${c.padEnd(colWidth - 1)}`).join("│") + "│");
  lines.push("─".repeat(rowLabelWidth) + "┼" + cols.map(() => "─".repeat(colWidth)).join("┼") + "┤");
  rows.forEach((r, ri) => {
    const rowCells = (cells[ri] || []).map(c => ` ${(c || "").padEnd(colWidth - 1)}`).join("│");
    lines.push(r.padEnd(rowLabelWidth) + "│" + rowCells + "│");
  });
  return lines.join("\n");
}

function renderDiagram(diagram) {
  if (diagram.type === "issue_tree") return treeToAscii(diagram.data);
  if (diagram.type === "flow") return flowToAscii(diagram.data.nodes, diagram.data.edges || []);
  if (diagram.type === "matrix") {
    const d = diagram.data;
    return matrixToAscii(d.xAxis, d.yAxis, d.cols, d.rows, d.cells);
  }
  return null;
}

async function main() {
  const { data: rows, error } = await supabase.from("frameworks").select("name,description,example,steps,pitfalls").in("name", NAMES);
  if (error) throw new Error(error.message);
  const byName = new Map(rows.map(r => [r.name, r]));

  const results = [];
  for (const name of NAMES) {
    const fw = byName.get(name);
    if (!fw) {
      console.warn(`[regen] ${name}: NOT FOUND`);
      results.push({ name, status: "not-found" });
      continue;
    }
    console.log(`[regen] ${name}...`);
    try {
      let diagram, ascii, lastErr;
      for (let attempt = 0; attempt < 3 && !ascii; attempt++) {
        try {
          diagram = await draftDiagram(fw);
          ascii = renderDiagram(diagram);
        } catch (err) {
          lastErr = err;
        }
      }
      if (!ascii) {
        console.warn(`[regen] ${name}: renderer returned nothing for type ${diagram?.type} after retries (${lastErr?.message || "shape mismatch"})`);
        results.push({ name, status: "render-failed", diagram });
        continue;
      }
      results.push({ name, status: "ok", type: diagram.type, title: diagram.title, data: diagram.data, ascii });
      console.log(`[regen] ${name}: ok (${diagram.type})`);
    } catch (err) {
      console.warn(`[regen] ${name}: FAILED - ${err.message}`);
      results.push({ name, status: "error", error: err.message });
    }
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(__dirname, "backups");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `regenerated-diagrams-${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  console.log(`\n[regen] done. ${results.filter(r => r.status === "ok").length}/${NAMES.length} rendered.`);
  console.log(`[regen] output: ${outFile}`);
}

main().catch(err => {
  console.error("[regen] fatal:", err);
  process.exit(1);
});

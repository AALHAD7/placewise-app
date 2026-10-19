---
name: diagram-transcription
description: The structured format PlaceWise uses to capture casebook diagrams (issue trees, 2x2 matrices, funnels, flows, charts, tables) so the frontend can redraw them faithfully. Use when writing vision prompts, parsing diagram output, validating diagram blocks, or rendering diagrams on the site.
---

# Diagram transcription

Students see a **rebuilt** diagram, not the original page image. So every diagram on a
casebook page is captured as structured data that the frontend draws.

## Where it lives
Inside a chunk's Markdown, as a fenced block:

````
```placewise-diagram
{ "type": "issue_tree", "title": "...", ... }
```
````

Right after the block, write a 1–3 sentence plain-language summary. That summary is what
gets embedded and what screen readers read.

## Types

All types share: `type`, `title` (string or null), `source_page` (int), `notes` (string[] —
footnotes or captions exactly as printed).

**issue_tree** — hierarchy (profitability trees, MECE breakdowns, mind maps)
```json
{ "type": "issue_tree", "root": { "label": "Profit decline", "children": [
  { "label": "Revenue", "children": [ { "label": "Price", "children": [] }, { "label": "Volume", "children": [] } ] },
  { "label": "Cost", "children": [] } ] } }
```

**matrix** — 2x2 and grids (BCG, Ansoff). Same shape as the existing frontend `FrameworkGridDiagram`.
```json
{ "type": "matrix", "xAxis": "Market share", "yAxis": "Growth", "cols": ["High","Low"], "rows": ["High","Low"], "cells": [["Star","Question mark"],["Cash cow","Dog"]] }
```

**funnel** — ordered narrowing stages. Same shape as `FrameworkFunnelDiagram`.
```json
{ "type": "funnel", "stages": ["Awareness","Consideration","Purchase"] }
```

**flow** — process steps, value chains, cyclic models
```json
{ "type": "flow", "nodes": [{"id":"a","label":"Inbound logistics"},{"id":"b","label":"Operations"}], "edges": [{"from":"a","to":"b","label":null}] }
```

**chart** — bar, line, pie
```json
{ "type": "chart", "chart_kind": "bar", "xLabel": "Year", "yLabel": "Revenue (₹ Cr)", "series": [{"name":"Revenue","points":[["FY22",120],["FY23",145]]}] }
```

**table** — use a Markdown table, not a block, unless cells are merged. If they are, use
`{ "type": "table", "header": [...], "rows": [[...]] }`.

**other** — anything that fits none of the above: `{ "type": "other", "description": "...", "labels": [...] }`.
Always flag it `needs_review`.

## Rules
- Copy every label, number and unit exactly as printed. Don't paraphrase, merge, correct or complete.
- Unreadable text becomes `"[UNREADABLE]"` and the page gets `needs_review`.
- Copy apostrophes and quotes exactly: `’` is not `'`, `“` is not `"`. Labels are checked character
  for character against the text layer (`label_altered`); a quote-style-only difference is repaired
  from the text layer, anything else stays flagged.
- One block per diagram. A page with two diagrams gets two blocks.
- A block is never inside a Markdown table cell: close the table, then write the block on its own lines
  (`diagram_in_table`).
- Chevrons, arrow shapes and boxes in a row are a sequence: a flow with an edge from each stage to the
  next, plus edges to the items under each stage (`flow_disconnected` if the pieces don't connect).
- Lines from two or more boxes joining into one box (converging) make it a flow, not an issue_tree:
  one node per box, an edge from each feeding box. Never repeat a box under two parents
  (`tree_duplicate_label`, `tree_convergence_suspect`).
- Letters or numbers printed in circles or badges (V, R, I, O; step 1, 2, 3) are printed text: put them
  in the node label before the word they mark ("V Valuable"). Ids are short machine letters only.
- The summary restates only what is printed: no added outcomes, judgements or branches (e.g. "No" paths).
- Navigation text (e.g. "Main Index") is plain text, never a Markdown link.
- Validation (in `fidelity.py`): valid JSON, a known `type`, required fields present, and every
  label findable in the page's text layer (when the page has one).
- The frontend must handle unknown types gracefully: show the summary text, never crash.
- Keep `matrix`/`funnel` backward compatible with `frontend-react/src/types/api.ts`. Add new
  types there when the frontend phase begins.

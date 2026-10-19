---
phase: R1
plan: 04
wave: 2
depends_on: ["01"]
agent: ingestion-engineer
gap_closure: false
paid_calls: 0
---

# Plan R1.04: Diagram-safe chunking, embedding text, and a local diagram preview

## Objective
Make sure the chunker never cuts a `placewise-diagram` block in half, keeps each block with its
summary and explanation, and embeds plain language (summary + title + labels) instead of raw JSON.
Also build a small offline previewer that draws a page's blocks as simple HTML next to the page
image. The fidelity reviewer and Aalhad use it for the R1 spot-check (plan 06). No Gemini calls.

## Context
Read first:
- `.claude/skills/casebook-ingestion/SKILL.md` (sections 4 and 5: "never mid-diagram", "embed the
  summary, not the raw JSON")
- `.claude/skills/diagram-transcription/SKILL.md`
- `backend/ingestion/chunk.py` (BOUNDARY_RE split; MAX_CHUNK_CHARS=6000 hard-slice with 400 overlap,
  which today can cut through a JSON block)
- `backend/ingestion/diagram_schema.py` (plan 01: `extract_blocks`, `collect_labels`)

Facts you need:
- All `<verify>` commands run from the repo root (`/Users/aalhad/Projects/Placement Website`).
- Original PDFs and page images are **admin-only**. The preview HTML and PNGs go to
  `backend/ingestion/out/` (gitignored by plan 02) and are never uploaded or served.
- Do not touch `convert.py`, `gemini_client.py` or `config.py`. Plan 03 owns those files, in the same wave.

## Tasks

<task type="auto">
  <name>Fence-aware chunking + embedding_text()</name>
  <files>
    backend/ingestion/chunk.py
    backend/ingestion/tests/test_chunk.py
  </files>
  <action>
    1. Compute fenced spans (any ``` fence, especially placewise-diagram) on the assembled text.
       Ignore any BOUNDARY_RE match that falls inside a fence.
    2. Over-long split: choose cut points ≤ MAX_CHUNK_CHARS that do not fall inside a fence or
       between a closing fence and its `Diagram summary:` line. Move the cut back to before the fence
       start. If one block + summary is itself > MAX_CHUNK_CHARS, keep it whole as its own part.
       Keep the existing 400-char overlap, but never start a part inside a fence.
    3. Each chunk dict gains `has_diagram: bool` (it contains ≥1 placewise-diagram block).
    4. `embedding_text(content) -> str`: replace each block (and keep its summary line) with
       `Diagram (<type>): <title or "untitled">. Labels: <first labels joined by "; ", capped at 400
       chars>.`, using `diagram_schema.extract_blocks` and `collect_labels`. Leave invalid-JSON blocks
       as the summary line only. Return the text with sentinels stripped and whitespace collapsed.
       The stored `content` keeps the raw block, because the frontend draws from it. Only the
       embedding input changes.
    5. Tests:
       - A 9,000-char page with a 2,500-char block straddling the 6,000 mark: no part has an
         unbalanced fence count, and the block + summary appear intact in exactly one part.
       - A JSON string value containing "Case 3" does not start a new chunk.
       - `embedding_text` contains the label "Market Penetration" and no `{`, `"type"` or ```.
       - Existing behaviour holds: two `# ` headings give two chunks, and page_start/page_end are right
         across a page sentinel.
  </action>
  <verify>
    cd backend/ingestion && venv/bin/python -m unittest tests.test_chunk -v
  </verify>
  <done>
    Tests green. No chunk ever has an odd number of ``` fences. `has_diagram` is set.
    `embedding_text` has no JSON syntax.
  </done>
</task>

<task type="auto">
  <name>diagram_preview.py: offline HTML preview of blocks next to the page image</name>
  <files>
    backend/ingestion/diagram_preview.py
    backend/ingestion/tests/fixtures/preview_pages.json
  </files>
  <action>
    CLI: `--pdf <path> --pages 20,52,32 --source {json|db} [--json <file>] [--version 2] [--out out/preview.html]`.
    - `json`: read a `{"pages": [{page_no, markdown, diagrams, diagram_issues, diagram_label_coverage}]}`
      file. This is the shape of `out/smoke_r1.json` from plan 03 and `out/r1_pages_v2.jsonl`-derived
      exports from plan 05. `db`: read `markdown`, `diagrams`, `diagram_issues`,
      `diagram_label_coverage` from `ingest_pages`, joined to the `ingest_documents` row for that
      PDF basename + `ingestion_version` (service-role client from config.py, read-only).
    - Render each requested page to `out/pages/p<N>.png` with pypdfium2 at 150 dpi (never PyMuPDF).
    - Write ONE self-contained HTML file. For each page, show a two-column layout: the left column has
      the `<img>` (relative path to the PNG); the right column has each block rebuilt as
      - issue_tree → nested `<ul>`
      - matrix → `<table>` with the yAxis/xAxis captions, row/col headers, cells
      - funnel → `<ol>`
      - flow → node list + an edge table (from → to, label)
      - chart → title, axes, a table of series × points
      - table → `<table>`
      - other → description + labels
      Then the summary line, the issues list (in red), and label coverage.
      HTML-escape every string.
    - Print the output path. No network access beyond the optional DB read; no uploads.
    Create `tests/fixtures/preview_pages.json` with a hand-written page 20 (Ansoff matrix block +
    summary) and a page 52 (flow block) so this plan doesn't depend on plan 03's paid output.
    Plan 03 runs in the same wave.
  </action>
  <verify>
    cd backend/ingestion && venv/bin/python diagram_preview.py --pdf "../../Data/Consulting Files/PDF Files/The FMS Consulting CaseBook 2023-24 (1).pdf" --pages 20,52 --source json --json tests/fixtures/preview_pages.json --out out/preview_fixture.html && test -s out/preview_fixture.html && test -s out/pages/p52.png && test -s out/pages/p20.png && echo PREVIEW_OK
  </verify>
  <done>
    PREVIEW_OK is printed. Opening the HTML shows page 20's image beside its rebuilt matrix.
    Nothing is written outside `backend/ingestion/out/`.
  </done>
</task>

## Must-Haves
- [ ] No chunk splits a diagram block or separates it from its summary
- [ ] Embeddings are computed from plain language, not JSON
- [ ] Reviewers can see the page image and the rebuilt diagram side by side, offline

## Success Criteria
- [ ] Unit tests green
- [ ] Preview HTML generated locally, gitignored

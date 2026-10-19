---
phase: R1
plan: 03
wave: 2
depends_on: ["01"]
agent: ingestion-engineer
gap_closure: false
paid_calls: "≤ 8 Gemini vision calls (flash-lite), about $0.01"
---

# Plan R1.03: Vision prompt v2 — structured diagram blocks + targeted retry

## Objective
Replace the converter's "render diagrams as nested bullets" instruction with a prompt that emits
one `placewise-diagram` block per diagram, each followed by a `Diagram summary:` line. Add one
automatic retry when a page's diagram blocks fail validation. The retry is told exactly which
labels or fields were wrong. Expose a per-page conversion function the re-pilot (plan 05) can call
without re-running Docling. Prove it on 3 real FMS pages with a few paid calls.

## Context
Read first:
- `CLAUDE.md`, `.claude/skills/diagram-transcription/SKILL.md`, `.claude/skills/casebook-ingestion/SKILL.md`
- `backend/ingestion/convert.py` (current `VISION_PROMPT`, `convert_document`, Docling retry)
- `backend/ingestion/gemini_client.py` (`transcribe_page`, `call_count`, flash-lite cascade)
- `backend/ingestion/diagram_schema.py` + `fidelity.py` (built in plan 01; `check_page(..., page_no)`)
- v1 output for comparison: `backend/ingestion/pilot_output.json` → `results[0].pages_full[n-1].markdown`

Facts you need:
- All `<verify>` commands run from the repo root (`/Users/aalhad/Projects/Placement Website`).
- PDF: `Data/Consulting Files/PDF Files/The FMS Consulting CaseBook 2023-24 (1).pdf` (248 pages).
- Known diagram pages (PDF index). v1 flattened all of these into bullets:
  p20 Ansoff **matrix**; p52 VRIO yes/no **flow**; p32, p48, p95 deep hierarchies (likely **issue trees**);
  p24 supply–demand **chart** (qualitative); p15/p44 Porter's Five Forces.
- `source_page` is the PDF index, not the printed footer number.
- PyMuPDF must not be added. Render with pypdfium2 (`page_classify.render_page_png`).

## Tasks

<task type="auto">
  <name>Prompt v2, per-page converter and validation-driven retry</name>
  <files>
    backend/ingestion/convert.py
    backend/ingestion/gemini_client.py
    backend/ingestion/config.py
    backend/ingestion/tests/test_convert_v2.py
  </files>
  <action>
    1. config.py: `PROMPT_VERSION = "r1-diagrams-v1"`, `VISION_MAX_TOKENS = 8192` (JSON is verbose;
       3000 risks truncation), `VISION_RETRY_ON_DIAGRAM_FAIL = True`.
    2. gemini_client.transcribe_page: add `return_meta=False`. When True, return
       `(text, {"finish_reason", "model"})`. Callers that use the default are unaffected.
       If finish_reason is `MAX_TOKENS`, convert.py treats the output as failed (issue
       `truncated`), and that triggers the retry.
    3. convert.py: `VISION_PROMPT_V2`, built from the skill's schema. Requirements:
       - Transcribe all page text as Markdown in reading order. Tables become Markdown tables, unless
         cells are merged (then use a `table` block).
       - For EVERY diagram (issue tree, 2x2/grid, funnel, process/value-chain/cycle, bar/line/pie
         chart, decision tree): emit a ```` ```placewise-diagram ```` block with valid JSON (double quotes,
         no comments, no trailing commas), then on the next line `Diagram summary: <1–3 plain sentences>`.
         Do NOT also repeat the diagram as bullets.
       - Include the compact type specs (fields per type) and two short examples: the Ansoff matrix
         and a small issue tree. Decision trees with Yes/No branches become `flow` with edge labels.
       - "This is PDF page {page_no}; set source_page to {page_no}."
       - Copy every label, number and unit exactly. `[UNREADABLE]` for unreadable text. Never complete,
         correct or summarise inside the block. If a diagram fits no type, use `other`.
       - Keep the existing raw-text-layer hint (first 1500 chars) as reference.
    4. `convert_page_vision(png, page_no, text_layer, is_scanned, call_log, reason) -> dict`:
       - Call 1 → `check_page(text_layer, md, is_scanned, page_no)`.
       - If `VISION_RETRY_ON_DIAGRAM_FAIL` and the result has diagram errors or truncation: call 2,
         with the prompt plus a "Fix these problems" hint. The hint lists up to 15 issues, e.g.
         `label "Market Devlopment" not found on page; copy it exactly as printed`,
         `block 2: invalid JSON`, `missing Diagram summary line`, `output was cut off; be concise
         in summaries`. Keep the better result. Score = number_coverage + word_coverage +
         (label_coverage or 1) − 0.5·diagram_errors. A tie keeps call 1.
       - Log every call in call_log `{page, type: "vision", reason, attempt}`. Return
         `{markdown, method: "gemini_vision_v2", prompt_version, attempts, **fidelity}`.
       - Never run more than 2 vision calls per page from this function.
    5. `convert_document` uses `convert_page_vision` for both of its vision paths (visual/scanned
       pages, and the Docling-fidelity retry). Pass `page_no` to every `check_page` call. Add the
       new keys to each page dict.
    6. Offline tests (monkeypatch `convert.transcribe_page`, no network):
       - A good fixture (valid matrix block + summary) → 1 call, diagram_count 1, needs_review False.
       - A bad-then-good fixture → 2 calls, and the second prompt contains the offending label.
       - Bad twice → 2 calls only, needs_review True, review_reasons includes `diagram_label`.
       - MAX_TOKENS meta → retry.

    AVOID: asking for JSON-only output (responseMimeType=application/json). The page Markdown and the
    blocks must come from one call, so the cost per page stays at one call.
    AVOID: a third attempt or a model upgrade on failure. Flag `needs_review` instead (budget, and
    the skill says never invent a fix).
  </action>
  <verify>
    cd backend/ingestion && venv/bin/python -m unittest discover -s tests -v
    grep -n "nested bullet" convert.py   (expect no match)
  </verify>
  <done>
    All tests are green. VISION_PROMPT_V2 is used on every vision path. A page costs at most 2 vision
    calls. Page dicts carry diagrams, diagram_issues, diagram_label_coverage, review_reasons and
    prompt_version.
  </done>
</task>

<task type="auto">
  <name>Live smoke test on 3 known diagram pages (paid, ≤ 8 calls)</name>
  <files>
    backend/ingestion/smoke_r1.py
  </files>
  <action>
    Script args: `--pdf <path> --pages 20,52,32` (default those three), `--cap 8`.
    - Open the PDF with pypdfium2, get the text layer, render PNG at RENDER_DPI.
    - For each page call `convert_page_vision`. Stop when `call_count["vision"] >= cap`.
    - Print per page: attempts, diagram_count, block types, diagram_issues, label coverage,
      needs_review, review_reasons, and the full markdown.
    - Save to `backend/ingestion/out/smoke_r1.json` (gitignored).
    - No DB writes, no storage uploads.
    Then inspect the output yourself against the v1 markdown for the same pages:
    - p20 should be a `matrix` (Product × Market, 4 cells).
    - p52 should be a `flow` or `issue_tree` keeping the V→R→I→O Yes/No branches.
    - p32 should be a block that keeps its hierarchy.
    If the prompt clearly fails (no block, wrong type, invented labels), adjust VISION_PROMPT_V2
    and re-run **once**. The total for this task must stay ≤ 8 calls. Otherwise record the
    failure and continue: R2 owns deeper prompt tuning.
  </action>
  <verify>
    cd backend/ingestion && venv/bin/python smoke_r1.py --pages 20,52,32 --cap 8
    venv/bin/python -c "import json;d=json.load(open('out/smoke_r1.json'));print([(p['page_no'],p['diagram_count'],[b['type'] for b in p['diagrams']]) for p in d['pages']])"
  </verify>
  <done>
    ≥ 2 of the 3 pages yield ≥ 1 valid block of the expected type, with zero invented labels. The
    total vision call count is printed and ≤ 8. Note the results (types, issues, call count) for the
    plan-05 log entry.
  </done>
</task>

## Must-Haves
- [ ] The converter emits placewise-diagram blocks + summaries instead of nested bullets
- [ ] Failed diagram validation triggers exactly one targeted retry, then needs_review
- [ ] Real FMS pages produce valid matrix/flow/tree blocks

## Success Criteria
- [ ] Unit tests green offline
- [ ] Smoke run ≤ 8 vision calls, results saved to out/smoke_r1.json

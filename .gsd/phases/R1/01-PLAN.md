---
phase: R1
plan: 01
wave: 1
depends_on: []
agent: ingestion-engineer
gap_closure: false
paid_calls: 0
---

# Plan R1.01: Diagram block schema, validator and fidelity integration

## Objective
Give the pipeline a single, tested definition of a valid `placewise-diagram` block and make
`fidelity.check_page()` judge diagram blocks, not just number/word coverage. Every later R1
plan (converter retry, chunker, re-pilot report, fidelity review) imports this module. No
Gemini calls, no DB writes.

## Context
Read first:
- `CLAUDE.md`
- `.claude/skills/diagram-transcription/SKILL.md` (the schema; this plan implements it exactly)
- `.claude/skills/casebook-ingestion/SKILL.md` (section 3, Fidelity)
- `backend/ingestion/fidelity.py` (current checks: number/word coverage, `[UNREADABLE]`)
- `backend/ingestion/config.py` (thresholds belong here, not inline)

Facts you need:
- All `<verify>` commands run from the repo root (`/Users/aalhad/Projects/Placement Website`).
- Run Python from `backend/ingestion/` with the existing venv: `venv/bin/python`.
- No pytest is installed. Use stdlib `unittest`; tests go in `backend/ingestion/tests/`.
- `config.py` loads `backend/.env` and raises if keys are missing; `.env` exists locally.
- `source_page` = the **PDF page index (1-based)**, not the number printed in the footer.
  (FMS page 20 prints "19" in its footer.)

## Tasks

<task type="auto">
  <name>Create diagram_schema.py: parse and validate placewise-diagram blocks</name>
  <files>
    backend/ingestion/textnorm.py
    backend/ingestion/fidelity.py   (move number helpers out only; behaviour unchanged)
    backend/ingestion/diagram_schema.py
    backend/ingestion/tests/__init__.py
    backend/ingestion/tests/test_diagram_schema.py
  </files>
  <action>
    0. Move `NUMBER_RE`, `_normalize_number` and `extract_numbers` from fidelity.py into a new
       `textnorm.py`, together with the new label normaliser. Both fidelity.py and diagram_schema.py import
       from textnorm (no import cycle). fidelity.py re-exports `extract_numbers`, so existing callers
       keep working.
    Implement diagram_schema.py as a pure-Python module (stdlib + textnorm only) with:

    1. `BLOCK_RE` matching a fenced block whose info string is exactly `placewise-diagram`
       (```` ```placewise-diagram\n ... \n``` ````), DOTALL, non-greedy.
    2. `extract_blocks(markdown) -> list[dict]`, where each dict is `{index, start, end, raw, obj|None,
       parse_error|None, summary|None}`. `summary` is the first non-empty line after the closing
       fence if it starts with `Diagram summary:` (strip that prefix), else None.
    3. `validate_block(obj, page_no) -> list[Issue]`, with Issue = `{"code", "severity": "error"|"warn", "detail"}`.
       - Common: `type` in KNOWN_TYPES = {issue_tree, matrix, funnel, flow, chart, table, other};
         `title` str|None; `source_page` int; `notes` list[str]. If `source_page != page_no`, raise
         error `source_page_mismatch`.
       - issue_tree: `root` = {label: str, children: list}, checked recursively (depth cap 12).
         A node missing `label` or `children` gives error `bad_shape`.
       - matrix: `rows`, `cols` non-empty lists; `cells` has len(rows) rows, each with len(cols)
         entries. `xAxis` and `yAxis` are str|None. Keep the key names exactly
         (`xAxis`, `yAxis`, `rows`, `cols`, `cells`), because the frontend's FrameworkGridDiagram uses them.
       - funnel: `stages` list[str], len ≥ 2.
       - flow: `nodes` [{id, label}], len ≥ 2. `edges` [{from, to, label|None}], and every from/to is
         an existing node id, otherwise error `dangling_edge`.
       - chart: `chart_kind` in {bar, line, pie}, `xLabel` and `yLabel` str|None, `series` [{name, points:
         [[x, y]]}], with y a number or None. If every series has 0 points, give **warn** `chart_no_data`
         (qualitative curves such as supply–demand are allowed).
       - table: `header` list, `rows` list of lists.
       - other: `description` str, `labels` list[str]. Always error `type_other` (the skill says flag it).
       - Any string equal to `[UNREADABLE]` anywhere gives error `unreadable`.
       - Missing summary line (from extract_blocks) gives error `missing_summary`.
       - A ```` ```json ```` (or untagged) fence whose content parses to an object with a known
         `type` key gives error `wrong_fence`. Count it so it is never silently lost as 0 diagrams.
       - Unparseable JSON gives error `invalid_json`. An unclosed fence (a line with
         ```` ```placewise-diagram ```` and no closing fence) also gives `invalid_json`.
    4. `collect_labels(obj) -> list[str]`: every human-visible string. That means the title,
       tree labels, xAxis/yAxis, rows, cols, cells, stages, node and edge labels, series names,
       string x-values, table header and cells, `other.labels`, and notes.
       `collect_numbers(obj) -> list[str]`: chart y-values and numeric x-values.
    5. `label_findable(label, text_layer_norm, text_words) -> bool`. Normalise with NFKC + lowercase,
       collapse whitespace, strip punctuation except `%` and `.` inside numbers, and join
       hyphenated line breaks. A label is found if its normalised form is a substring of the
       normalised text layer, OR every content token (len > 1) is in the text-layer word set.
       PDF text runs are often out of order, which is why the token fallback exists. Skip `[UNREADABLE]`, empty
       strings and pure-symbol labels (→, +, x).
    6. `check_diagrams(markdown, text_layer, page_no) -> dict`, which returns
       `{diagram_count, diagrams: [valid objs], diagram_issues: [{block, code, severity, detail}],
       diagram_label_coverage: float|None, diagram_errors: int}`.
       - Run the label check only when the text layer is non-empty. Otherwise coverage is None.
       - Label miss gives error `label_not_on_page` (detail = the label).
       - A chart number missing from `fidelity.extract_numbers(text_layer)` gives error `number_not_on_page`.
         (`textnorm.extract_numbers`).

    Tests (unittest), with at least one passing and one failing fixture per type:
    - The Ansoff matrix (FMS p20) as a valid matrix block against a text layer containing its labels.
    - An issue tree with a label absent from the text layer gives `label_not_on_page`.
    - A flow with a dangling edge, a chart with no points (warn only), `other` (always error),
      invalid JSON, a missing summary, and source_page mismatch.
    - Two blocks on one page are both returned.
    - A matrix block inside a ```` ```json ```` fence gives `wrong_fence`.

    AVOID: adding jsonschema-based validation. It is pinned in requirements, but hand checks give
    clearer issue codes for the review queue.
    AVOID: "fixing" labels (title-casing, spelling). The validator only reports.
  </action>
  <verify>
    cd "backend/ingestion" && venv/bin/python -m unittest tests.test_diagram_schema -v
  </verify>
  <done>
    All tests pass. Each type has ≥1 valid and ≥1 invalid fixture. `check_diagrams` returns the
    documented keys. The module imports nothing outside the stdlib and textnorm.py.
  </done>
</task>

<task type="auto">
  <name>Wire diagram checks into fidelity.check_page and move thresholds to config</name>
  <files>
    backend/ingestion/fidelity.py
    backend/ingestion/config.py
    backend/ingestion/tests/test_fidelity.py
  </files>
  <action>
    1. In config.py add: `NUMBER_COVERAGE_MIN = 1.0`, `WORD_COVERAGE_MIN = 0.98` (today's inline
       values, kept so v1 vs v2 numbers stay comparable), and `DIAGRAM_LABEL_COVERAGE_MIN = 1.0`
       (skill rule: every label must appear on the page).
    2. Change the signature to `check_page(text_layer, markdown, is_scanned, page_no=None)`. The new
       parameter is optional, so existing callers still work. Merge in `check_diagrams(...)` output
       (all its keys). Compute `needs_review` = previous rule OR `diagram_errors > 0` OR
       (label coverage is not None and < DIAGRAM_LABEL_COVERAGE_MIN). Also add
       `review_reasons: list[str]` with any of `number_coverage`, `word_coverage`, `unreadable`,
       `scanned`, `diagram_invalid`, `diagram_label`, `diagram_other`, so the report can break
       flags down by cause.
    3. Number and word coverage keep running over the full markdown, including the JSON in the blocks,
       so diagram labels and numbers count toward coverage.
    4. Tests: the old behaviour is unchanged for a page with no blocks; a page with a valid block
       and full coverage has needs_review False; a page with a bad block has needs_review True
       and the right review_reasons; a scanned page always has needs_review True.

    AVOID: lowering the coverage thresholds in this plan. Threshold tuning is R2's job, after
    real numbers exist.
  </action>
  <verify>
    cd "backend/ingestion" && venv/bin/python -m unittest discover -s tests -v
  </verify>
  <done>
    The whole test suite passes. `check_page` returns the v1 keys plus `diagram_count, diagrams,
    diagram_issues, diagram_label_coverage, diagram_errors, review_reasons`. No threshold literals
    are left in fidelity.py.
  </done>
</task>

## Must-Haves
- [ ] One module defines and validates all 7 diagram types exactly as the skill specifies
- [ ] Every block label is checked against the page text layer when one exists
- [ ] `needs_review` is set for invalid blocks, label misses, `other` blocks and `[UNREADABLE]`

## Success Criteria
- [ ] `venv/bin/python -m unittest discover -s tests` green
- [ ] No Gemini calls, no DB writes

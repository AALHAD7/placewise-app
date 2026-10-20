---
phase: R2
plan: 01
wave: 1
depends_on: []
agent: ingestion-engineer
gap_closure: true
files_modified:
  - backend/ingestion/structure_check.py
  - backend/ingestion/tests/test_structure_check.py
paid_calls: "≈ 116 flash-lite vision calls (58 pages × 2 runs), hard cap 140, ≈ $0.13 (ceiling $0.16). 0 embeddings, 0 DB writes."
---

# Plan R2.01: Structure sweep, part 1: a cheap Gemini structure-check of every unflagged tree/flow page

## Objective
R1 left about 7 wrong parents hidden in the 45 v3 tree/flow pages that are still unreviewed and unflagged
(the "55" in STATE.md was counted before the R1.10 flags; the live count is 45, listed below). The label
checkers cannot see a wrong parent, because every label is spelled right.

**Why both a Gemini check and an eyeball pass (plans 02 and 03 run in parallel, blind to this one):**
- The eyeball pass is the ground truth for this casebook. The bar is "faithful OR flagged", which needs high
  recall, and the same flash-lite model family that drew the wrong parent has correlated blind spots, so
  a Gemini check alone cannot clear a page.
- This casebook is 1 of many. In M2, eyeballing every tree page of every casebook will not scale. A
  second-opinion call that sees the page image plus the stored parent→child list is the only scalable fix
  for pattern 1 (wrong parents), pattern 5 (over-linked column stacks, p11) and the over-claiming summaries (p52, p14).
  Running it now, with the eyeball sweep as the answer key, measures its recall before anyone relies on it.
- It costs about $0.13. The eyeball pass costs no Gemini calls.

This plan builds the check, calibrates it on 13 pages whose truth is already known, and runs it on the 45
pages. It writes results to a local file only. Plan 05 compares them with the eyeball sweep and flags pages.

## Context
Read first: `CLAUDE.md`, `.claude/skills/casebook-ingestion/SKILL.md`, `.claude/skills/diagram-transcription/SKILL.md`,
`backend/ingestion/gemini_client.py` (`transcribe_page`, `set_vision_cap`, `call_count`, `BudgetExceeded`),
`backend/ingestion/diagram_schema.py` (`extract_blocks`), `backend/ingestion/page_classify.py` (`render_page_png`),
`backend/ingestion/run_patch.py` (cap/resume/jsonl pattern to copy).

Facts you need:
- All `<verify>` commands run from the repo root `/Users/aalhad/Projects/Placement Website`. Python: `backend/ingestion/venv/bin/python`.
  Tests: `cd backend/ingestion && venv/bin/python -m unittest discover -s tests` (223 pass today).
- PDF: `Data/Consulting Files/PDF Files/The FMS Consulting CaseBook 2023-24 (1).pdf`. v3 doc
  `129a2604-0221-4ba2-af50-42ac641a21a0` (`ingest_pages` rows: `page_no, markdown, text_layer, needs_review, review_reasons`).
  Read-only in this plan.
- **Sweep pool (45 pages, unflagged v3, ≥1 issue_tree/flow block parsed by `extract_blocks`, not reviewed in R1.10):**
  26, 28, 32, 33, 34, 39, 40, 41, 42, 49, 50, 51, 62, 82, 87, 89, 91, 92, 95, 96, 99, 102, 103,
  108, 109, 112, 113, 115, 136, 149, 160, 180, 182, 186, 191, 193, 199, 204, 213, 221, 225, 230, 233, 245, 246.
  Recompute it with that rule at start and print any difference. Do not silently change the list.
- **Calibration set (13 pages, truth from `out/r1_review_v3.json`):** known bad = 11 (undrawn edges), 13, 14, 238 (wrong
  parent), 52 (VRIO summary over-claims). Known good = 31, 19, 35, 83, 105, 128, 166, 188.
- Models: `VISION_MODELS` in `config.py` (flash-lite only). Cost ≈ $0.0011 per vision call.
- Page PNGs are rendered locally into `backend/ingestion/out/` (gitignored). They are admin-only and are never uploaded or printed as URLs.

## Tasks

<task type="auto">
  <name>structure_check.py: edge list, prompt, parser, dispute rule (free, unit-tested)</name>
  <files>
    backend/ingestion/structure_check.py
    backend/ingestion/tests/test_structure_check.py
  </files>
  <action>
    1. `edge_list(markdown)`: for every valid issue_tree/flow block from `extract_blocks` (skip in-table blocks), list numbered
       claims: tree → `E<n>: "<parent label>" → "<child label>"` (every parent/child pair, root included); flow →
       `E<n>: "<from label>" → "<to label>"` (every edge). Also return each block's summary line.
    2. `build_prompt(edges, summaries)`: tell the model it is checking someone else's transcription of the attached page. For each
       claim, answer `drawn` (a line, arrow, nesting or bracket on the page joins exactly these two boxes in this direction),
       `not_drawn`, or `unsure`. List `missing` connections that the page draws between two listed labels but no claim covers.
       For each summary, say `ok` or `overclaims` (it states something the page does not show) with a one-line reason.
       Ask for JSON only: `{"edges":[{"id":"E1","verdict":"…","why":"…"}],"missing":[{"from":"…","to":"…"}],"summaries":[{"i":0,"verdict":"…","why":"…"}]}`, with "why" only for not_drawn/unsure/overclaims, to keep replies short.
    3. `parse_reply(text)`: strip code fences, `json.loads`. On a parse failure return `{"parse_error": …}`; never guess.
    4. `dispute(result)`: True when any edge is `not_drawn` or `unsure`, any `missing` entry is non-empty, any summary is `overclaims`,
       or there is a parse error. `unsure` counts as a dispute on purpose, because recall matters more than precision here.
    5. Unit tests with fixture markdown (no network): edge_list on a 2-level tree and a 3-edge flow, in-table block skipped, a flow edge whose node id is missing is listed as a claim with the raw id (never dropped silently), a reply that omits a claim id counts as `unsure`, fenced
       and unfenced JSON replies parsed, a malformed reply → parse_error → dispute, each dispute trigger.
    AVOID: sending the text layer or asking the model to re-transcribe, because that turns a check into another transcription that has the same blind spots.
    AVOID: writing to the DB; this plan is read-only.
  </action>
  <verify>cd backend/ingestion && venv/bin/python -m unittest tests.test_structure_check -v 2>&1 | tail -3 && venv/bin/python -m unittest discover -s tests 2>&1 | tail -2</verify>
  <done>New tests pass. The full suite is OK, with 223 + the new tests.</done>
</task>

<task type="auto">
  <name>Calibrate on the 13 known pages, then run on the 45-page pool (2 runs each, capped)</name>
  <files>
    backend/ingestion/structure_check.py
    backend/ingestion/out/r2_structure_check.jsonl   (local, gitignored)
    backend/ingestion/out/r2_structure_check.json    (local, gitignored)
  </files>
  <action>
    1. CLI: `structure_check.py --version 3 --pages <list|calibration|pool> --runs 2 --cap 140 [--dry-run] [--resume]`.
       Load the v3 pages read-only. Render each PNG with `render_page_png` (150 dpi). Call `transcribe_page(png, prompt, max_tokens=4000, return_meta=True)` (p19-size pages have ~70 claims; a truncated reply (`finish_reason` MAX_TOKENS) counts as a parse error = dispute, and is logged)
       once per run. Append each reply to `out/r2_structure_check.jsonl` (`page_no, run, http_calls, model, result, dispute`)
       so that `--resume` skips calls that are already done. Use `set_vision_cap` for the cap. `--dry-run` prints the page list and the
       claim count for each page, and makes 0 calls.
    2. Dry run on calibration + pool (58 pages). Print the projected calls (`pages × runs`). Abort if this is over the cap.
    3. Run the calibration (13 pages × 2). Compute calibration recall (known-bad pages disputed in ≥1 run, out of 5) and the
       false-dispute rate on the known-good pages (out of 8). Print both. Go on to the pool regardless; plan 05 decides adoption.
    4. Run the pool (45 pages × 2). A page is `disputed` if either run disputes it (union, for recall).
    5. Write `out/r2_structure_check.json`: `{doc_id, version: 3, calibration: {recall, false_dispute_rate, per_page},
       pool: [{page_no, disputed, runs_agree, not_drawn_edges, missing, summary_issues}], calls: {vision, est_cost_usd}}`.
    AVOID: retrying a page past 2 runs to "get a clean answer", because that is the nondeterminism R1 ruled out.
    AVOID: opening or sharing this file with the fidelity-reviewer before plans 02 and 03 are done, because the eyeball sweep must stay blind.
  </action>
  <verify>cd backend/ingestion && venv/bin/python -c "import json;r=json.load(open('out/r2_structure_check.json'));c=r['calibration'];print('recall',c['recall'],'false',c['false_dispute_rate']);print('pool',len(r['pool']),'disputed',sum(p['disputed'] for p in r['pool']));print(r['calls'])"</verify>
  <done>The calibration covers 13 pages and the pool 45 pages, each with 2 runs (or an explicit failed-call record). The vision calls are ≤ 140 and the cost is printed. No DB rows changed.</done>
</task>

## Must-Haves
- [ ] All 45 pool pages and all 13 calibration pages have a structure-check verdict (union of 2 runs)
- [ ] Calibration recall and false-dispute rate are recorded
- [ ] ≤ 140 vision calls, flash-lite only; 0 DB writes; page images stay local

## Success Criteria
- [ ] Full ingestion test suite green
- [ ] `out/r2_structure_check.json` exists, ready for plan 05

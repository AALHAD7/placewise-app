---
phase: R1
plan: 08
wave: 6
depends_on: ["07"]
agent: ingestion-engineer
gap_closure: true
paid_calls: "smoke test ≤ 10 vision calls (≈ $0.01); counts toward the R1 gap budget of 150 vision calls"
---

# Plan R1.08: Vision prompt r1-diagrams-v2 (structure, punctuation, tables) + 5-page smoke test

## Objective
Fix at the source the patterns the R1.06 review found, so re-converted pages come out right on the
first try: converging lines and chevron chains need edges, apostrophes are copied exactly, diagram blocks
never go inside tables, circled letters are labels, summaries never infer, and navigation text is not a link.
Prove the fix on the 5 pages that show each failure, before plan 09 spends the main budget.

## Context
Read first:
- `CLAUDE.md` (budget), `.claude/skills/diagram-transcription/SKILL.md`, `.claude/skills/casebook-ingestion/SKILL.md`,
  `.claude/skills/build-log/SKILL.md`
- `backend/ingestion/convert.py` (`VISION_PROMPT_V2`, `build_vision_prompt`, `diagram_fix_hints`, `RETRY_WARN_CODES`)
- `backend/ingestion/config.py` (`PROMPT_VERSION = "r1-diagrams-v1"`)
- `backend/ingestion/smoke_r1.py` (`--pages`, `--cap`, `--out`; no DB writes)
- `backend/ingestion/out/r1_review.json` and `out/r1_v2_rescore.json` (plan 07)

Facts you need:
- All `<verify>` commands run from the repo root (`/Users/aalhad/Projects/Placement Website`).
- Plan 07 added the checks `label_altered`, `block_in_table`, `flow_disconnected`, `tree_duplicate_label`
  and `tree_convergence_suspect`, plus `restore_quotes`/`strip_invented_links`. This plan only changes the prompt and config.
- Cost basis: ~3k input + ~2k output tokens per vision call at flash-lite $0.10/M in, $0.40/M out ≈ $0.0011 per call.
- Gemini quota or 429s: stop and report. Never raise `--cap`.

## Tasks

<task type="auto">
  <name>Prompt r1-diagrams-v2 with the new rules</name>
  <files>
    backend/ingestion/convert.py
    backend/ingestion/config.py
    backend/ingestion/tests/test_convert_v2.py
    .claude/skills/diagram-transcription/SKILL.md
  </files>
  <action>
    1. config.py: `PROMPT_VERSION = "r1-diagrams-v2"`. Rename the prompt constant to `VISION_PROMPT` (keep
       `VISION_PROMPT_V2` as an alias so old imports and tests keep working).
    2. Add to the prompt (keep it short, one line each):
       - TEXT: "Copy apostrophes and quotes exactly as printed: ’ is not ', “ is not \"." Also: "Never create
         Markdown links. Write navigation text such as Main Index as plain text."
       - DIAGRAMS / flow: "Chevrons, arrow shapes and boxes placed in a row are a sequence: add an edge from each stage to the
         next, in reading order, as well as any edges to items under a stage."
       - DIAGRAMS / issue_tree: "If lines from two or more boxes join into one box (they converge), the diagram is a flow, not an
         issue_tree: one node per box, an edge from each box that feeds it. Never repeat a box under two parents."
       - RULES: "Letters or numbers printed in circles or badges (e.g. V, R, I, O; step numbers 1, 2, 3) are printed
         text: put them in the node label, before the word they mark, separated by a space, in the order printed
         (e.g. "V Valuable"). Never put printed text only in an id; ids are short letters (a, b, c)."
       - RULES: "A diagram block is never inside a table cell. If a page has a table and a diagram, close the table first,
         then write the block on its own lines."
       - Summary: "The Diagram summary only restates what is printed. Do not add outcomes, judgements or branches
         (for example 'No' paths) that the page does not show."
    3. Update the diagram-transcription skill with the same rules (circled letters, convergence → flow, chevron edges,
       no blocks in tables, exact quotes), so the frontend and future prompts agree.
    4. Tests (offline): the prompt contains each new rule; `PROMPT_VERSION == "r1-diagrams-v2"`; the new fix hints
       from plan 07 appear in `diagram_fix_hints` for synthetic issues; the prompt length grows by < 1,500 characters.

    AVOID: changing the block JSON schema. The frontend types in `frontend-react/src/types/api.ts` depend on it.
  </action>
  <verify>
    cd backend/ingestion && venv/bin/python -m unittest tests.test_convert_v2 -v && venv/bin/python -m unittest discover -s tests
  </verify>
  <done>The new rule tests pass, PROMPT_VERSION is r1-diagrams-v2, and the full suite is green.</done>
</task>

<task type="auto">
  <name>Smoke test the 5 failure pages (paid, cap 10)</name>
  <files>
    backend/ingestion/out/smoke_r1_v2.json   (local, gitignored)
    log.md
  </files>
  <action>
    1. Run `venv/bin/python smoke_r1.py --pages 11,13,19,52,77 --cap 10 --out out/smoke_r1_v2.json`.
    2. For each page, print the block types, `review_reasons`, `diagram_label_exact` and the issue codes. Expected:
       - p11: a flow (or a tree with no convergence warning) where "Crack the interview" has edges from both columns
       - p13: a block for the main 3C's diagram, `Other C’s` with U+2019, and the Company questions not under "Government"
       - p19: a flow with ≥ 6 stage-to-stage edges, no `flow_disconnected`
       - p52: the V/R/I/O letters are present, and the summary has no "disadvantages"/"No" inference
       - p77: no `diagram_in_table`, and number_coverage ≥ the v1 value from `out/r1_v2_rescore.json`
    3. Look at each result against `out/pages/p<N>.png` yourself (Read the PNG). A page fails if any of the expectations above is unmet.
    4. Write the log.md entry "R1.08: vision prompt r1-diagrams-v2 smoke test" (build-log skill), with the table, the calls used and the cost.
    5. If ≥ 2 of the 5 pages still fail the same way, stop and report `blocked` with the outputs. Do not start plan 09:
       a second prompt iteration (≤ 10 more calls, still within the 150 total) needs the orchestrator's go-ahead.
  </action>
  <verify>
    cd backend/ingestion && venv/bin/python -c "import json;r=json.load(open('out/smoke_r1_v2.json'));rs=r.get('results',r);print([(p['page_no'],[d['type'] for d in p.get('diagrams',[])],p.get('review_reasons'),p.get('http_calls')) for p in rs]);print('calls',sum(p.get('http_calls') or 0 for p in rs))" && grep -n "R1.08" ../../log.md
  </verify>
  <done>
    ≤ 10 vision calls used. At least 4 of the 5 pages meet their expectation, with p11 and p13 among them (the issue-tree blockers).
    The log entry records which pages passed or failed.
  </done>
</task>

## Must-Haves
- [ ] Prompt r1-diagrams-v2 carries all 6 rules; the skill doc matches
- [ ] p11 and p13 come out structurally right in the smoke test
- [ ] ≤ 10 paid calls, logged

## Success Criteria
- [ ] Tests green; smoke results logged with cost

---
phase: R2
plan: 02
wave: 1
depends_on: []
agent: fidelity-reviewer
gap_closure: true
files_modified:
  - backend/ingestion/out/r2_sweep_a.json   (local, gitignored)
  - ingest_pages (v3 rows only: needs_review + review_reasons)
paid_calls: 0
---

# Plan R2.02: Structure sweep, part 2a: eyeball 23 tree/flow pages and the 9 visual pages with no block

## Objective
This is the ground truth for the wrong-parent sweep. Check every parent→child link and every flow edge on the first 23 of
the 45 unreviewed, unflagged v3 tree/flow pages against the page image, and flag every page that is wrong. Also confirm
whether each of the 9 visual pages with no diagram block really has a diagram that the converter missed (STATE item 6).
You did not write the converter. Assume nothing is right until you have checked it.
Plan 03 does the other 22 pages. Plan 01 runs a Gemini structure-check on the same pages in parallel. **Do not open
`backend/ingestion/out/r2_structure_check*`**: your verdicts must be blind so that plan 05 can measure that check against you.

## Context
Read first: `CLAUDE.md`, `.claude/agents/fidelity-reviewer.md`, `.claude/skills/diagram-transcription/SKILL.md`,
`.gsd/phases/R1/10-PLAN.md` (the method and the JSON shape), `backend/ingestion/out/r1_review_v3.json` (examples of
`structure_lost` evidence: p13, p14, p238).

Facts you need:
- All `<verify>` commands run from the repo root `/Users/aalhad/Projects/Placement Website`.
- v3 doc `129a2604-0221-4ba2-af50-42ac641a21a0`, all inactive. Render the image + rebuilt blocks for a batch of pages:
  `cd backend/ingestion && venv/bin/python diagram_preview.py --pdf "../../Data/Consulting Files/PDF Files/The FMS Consulting CaseBook 2023-24 (1).pdf" --pages <list> --source db --version 3 --out out/r2_sweep_a.html`
  The PNGs land in `backend/ingestion/out/pages/p<N>.png`. Read the PNG directly, and read the block JSON from the DB `markdown`, not only the HTML.
- **Your pages (23):** 26, 28, 32, 33, 34, 39, 40, 41, 42, 49, 50, 51, 62, 82, 87, 89, 91, 92, 95, 96, 99, 102, 103.
- **Visual pages with no block (9):** 1, 8, 12, 30, 43, 53, 75, 80, 84.
- Write rights: on **v3 rows only** you may set `needs_review = true` and append `fidelity_review:<type>` to `review_reasons`
  (`array_append`, skip if the reason is already there). Before the first write, save each row's `id, page_no, needs_review, review_reasons,
  review_status` to `out/r2_sweep_a_flags_before.json`. Never set `review_status = 'approved'`. Never edit pipeline code or v1/v2 rows.
- Issue types: `missing`, `altered`, `hallucinated`, `structure_lost`, `unreadable`. The strict R1 rule applies: labels are checked character
  for character, and every number, branch and edge is checked. But the focus of this sweep is **structure**: for each child, ask "is this the
  box the page joins it to?", and for each flow edge, ask "does the page draw this exact arrow?"

## Tasks

<task type="auto">
  <name>Sweep the 23 tree/flow pages edge by edge</name>
  <files>backend/ingestion/out/r2_sweep_a.json</files>
  <action>
    1. Render the 23 pages in 2–3 batches (see the command above).
    2. For each page, and each issue_tree/flow block on it: walk every parent→child pair and every flow edge against the image. Also check
       the summary line. Record `items_checked` (the edges + labels you checked) and every mismatch as `{type, item, page_shows, stored}`.
       Floating callouts with no connecting line, stacked column boxes, and connectors that cross are the known traps (p13, p14, p11, p238).
    3. Write `out/r2_sweep_a.json`: `{document_id, ingestion_version: 3, plan: "R2.02", blind_to_structure_check: true,
       pages: [{page_no, type, role: "sweep", items_checked, mismatches, verdict}]}`.
    4. Flag every failing page (see Write rights). Use the reason of the worst issue on the page; add a second reason if there are two types.
    AVOID: passing a page because "the labels all match", because labels are exactly what the existing checkers already verify.
  </action>
  <verify>cd backend/ingestion && venv/bin/python -c "import json;r=json.load(open('out/r2_sweep_a.json'));P=[p for p in r['pages'] if p['role']=='sweep'];print(len(P),'pages',sum(p['verdict']=='pass' for p in P),'pass');print([(p['page_no'],p['verdict'],[m['type'] for m in p['mismatches']]) for p in P if p['verdict']!='pass'])"</verify>
  <done>All 23 pages have a verdict with items_checked &gt; 0. Every failing page is flagged in v3 (task 2's verify query checks it).</done>
</task>

<task type="auto">
  <name>Visual pages with no block: missing diagram or decorative?</name>
  <files>backend/ingestion/out/r2_sweep_a.json</files>
  <action>
    1. Render pages 1, 8, 12, 30, 43, 53, 75, 80, 84 and look at each image.
    2. For each one, decide `diagram_missing` (the page draws a tree, flow, matrix, funnel, chart or table-like diagram whose structure is not in the
       markdown as a block or a table) or `decorative_ok` (only logos, photos or plain text; the markdown already holds everything).
    3. Add each one to `pages` with `role: "visual_no_block"` and verdict `fail` (`missing`) or `pass`. Flag the `fail` ones `fidelity_review:missing`.
  </action>
  <verify>cd "/Users/aalhad/Projects/Placement Website" && backend/ingestion/venv/bin/python -c "
import json,sys;sys.path.insert(0,'backend/ingestion')
from pipeline import get_sb
r=json.load(open('backend/ingestion/out/r2_sweep_a.json'));fail=[p['page_no'] for p in r['pages'] if p['verdict']!='pass']
print('visual_no_block',[(p['page_no'],p['verdict']) for p in r['pages'] if p['role']=='visual_no_block'])
rows=get_sb().table('ingest_pages').select('page_no,needs_review,review_reasons').eq('document_id','129a2604-0221-4ba2-af50-42ac641a21a0').in_('page_no',fail or [0]).execute().data
bad=[x['page_no'] for x in rows if not x['needs_review'] or not any(s.startswith('fidelity_review:') for s in x['review_reasons'])]
print('failing',sorted(fail),'unflagged',bad)"</verify>
  <done>All 9 pages have a verdict. `unflagged` prints `[]`: every failing page (sweep and visual) has needs_review=true and a fidelity_review reason.</done>
</task>

## Must-Haves
- [ ] 23 sweep pages + 9 visual pages reviewed against the images, blind to the structure check
- [ ] Every failing page flagged on v3 only; before-values saved; no approvals, no pipeline edits

## Success Criteria
- [ ] `out/r2_sweep_a.json` and `out/r2_sweep_a_flags_before.json` exist
- [ ] Return a table (page, verdict, issue type, one-line evidence) and the counts

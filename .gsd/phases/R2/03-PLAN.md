---
phase: R2
plan: 03
wave: 1
depends_on: []
agent: fidelity-reviewer
gap_closure: true
files_modified:
  - backend/ingestion/out/r2_sweep_b.json   (local, gitignored)
  - ingest_pages (v3 rows only: needs_review + review_reasons)
paid_calls: 0
---

# Plan R2.03: Structure sweep, part 2b: eyeball the other 22 tree/flow pages and triage 10 visual no-block pages

## Objective
This is the second half of the ground-truth wrong-parent sweep (plan 02 does the first 23). Check every parent→child link and flow
edge on 22 v3 pages against the page image, and flag every page that is wrong. Then triage a random 10 of the 55 other unflagged visual
pages that have no diagram block, to learn whether that larger group also hides missing diagrams. Plan 06 uses that answer.
**Do not open `backend/ingestion/out/r2_structure_check*`**: your verdicts must stay blind to the Gemini check (plan 01).

## Context
Same reading, facts, render command, write rights and issue types as `.gsd/phases/R2/02-PLAN.md` → Context. Read that section
first. The differences:
- Output `out/r2_sweep_b.json` (`plan: "R2.03"`), before-values `out/r2_sweep_b_flags_before.json`, preview `out/r2_sweep_b.html`.
- **Your pages (22):** 108, 109, 112, 113, 115, 136, 149, 160, 180, 182, 186, 191, 193, 199, 204, 213, 221, 225, 230, 233, 245, 246.
- **Visual no-block triage (10, drawn with `random.Random(2021).sample` from the 55 unflagged visual pages with 0 blocks, excluding plan 02's 9):**
  123, 156, 161, 176, 181, 187, 196, 214, 240, 242.
- p113 is a chart that uses a separate callout box as its yLabel (R1.09). Judge it on the chart rules (axes, series, every data point) as well as on structure.

## Tasks

<task type="auto">
  <name>Sweep the 22 tree/flow pages edge by edge</name>
  <files>backend/ingestion/out/r2_sweep_b.json</files>
  <action>
    Same steps as plan 02, task 1, on your 22 pages. Write `out/r2_sweep_b.json` with
    `pages: [{page_no, type, role: "sweep", items_checked, mismatches, verdict}]` and `blind_to_structure_check: true`.
    Flag every failing page on v3 (save the before-values first).
    AVOID: passing a page because "the labels all match", because the existing checkers already verify the labels and miss the structure.
  </action>
  <verify>cd backend/ingestion && venv/bin/python -c "import json;r=json.load(open('out/r2_sweep_b.json'));P=[p for p in r['pages'] if p['role']=='sweep'];print(len(P),'pages',sum(p['verdict']=='pass' for p in P),'pass');print([(p['page_no'],p['verdict'],[m['type'] for m in p['mismatches']]) for p in P if p['verdict']!='pass'])"</verify>
  <done>All 22 pages have a verdict with items_checked &gt; 0.</done>
</task>

<task type="auto">
  <name>Triage 10 visual no-block pages and confirm the flags</name>
  <files>backend/ingestion/out/r2_sweep_b.json</files>
  <action>
    1. For each of the 10 triage pages, decide `diagram_missing` or `decorative_ok` (same definition as plan 02, task 2). Add each one with
       `role: "visual_triage"`. Flag the `fail` ones `fidelity_review:missing`.
    2. Add `visual_triage_rate: "<k>/10 missing"` at the top level. Plan 06 uses it: if k ≥ 1, every unflagged visual page with 0 blocks
       gets a `visual_no_block` flag in v4.
  </action>
  <verify>cd "/Users/aalhad/Projects/Placement Website" && backend/ingestion/venv/bin/python -c "
import json,sys;sys.path.insert(0,'backend/ingestion')
from pipeline import get_sb
r=json.load(open('backend/ingestion/out/r2_sweep_b.json'));fail=[p['page_no'] for p in r['pages'] if p['verdict']!='pass']
print('triage',r['visual_triage_rate'],[(p['page_no'],p['verdict']) for p in r['pages'] if p['role']=='visual_triage'])
rows=get_sb().table('ingest_pages').select('page_no,needs_review,review_reasons').eq('document_id','129a2604-0221-4ba2-af50-42ac641a21a0').in_('page_no',fail or [0]).execute().data
bad=[x['page_no'] for x in rows if not x['needs_review'] or not any(s.startswith('fidelity_review:') for s in x['review_reasons'])]
print('failing',sorted(fail),'unflagged',bad)"</verify>
  <done>All 10 triage pages have a verdict and the rate is recorded. `unflagged` prints `[]`.</done>
</task>

## Must-Haves
- [ ] 22 sweep pages + 10 triage pages reviewed against the images, blind to the structure check
- [ ] Every failing page flagged on v3 only; before-values saved; no approvals, no pipeline edits

## Success Criteria
- [ ] `out/r2_sweep_b.json` (with `visual_triage_rate`) and `out/r2_sweep_b_flags_before.json` exist
- [ ] Return a table (page, verdict, issue type, one-line evidence) and the counts

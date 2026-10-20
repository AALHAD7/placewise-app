---
phase: R2
plan: 05
wave: 2
depends_on: ["01", "02", "03"]
agent: ingestion-engineer
gap_closure: true
files_modified:
  - backend/ingestion/r2_reconcile.py
  - backend/ingestion/structure_check.py
  - backend/ingestion/pipeline.py
  - backend/ingestion/config.py
  - backend/ingestion/tests/test_structure_check.py
  - ingest_pages (v3 rows only: needs_review + review_reasons)
  - log.md
paid_calls: 0
---

# Plan R2.05: Score the Gemini structure check against the eyeball sweep, flag disputes, decide whether the pipeline adopts it

## Objective
Close STATE item 1, so that every v3 tree/flow page is now either reviewed faithful or flagged. Measure how well the cheap
structure check (plan 01) agrees with the blind eyeball sweep (plans 02 and 03). Flag every page the check disputes, even
where the reviewer passed it: over-flagging is safe, while a missed wrong parent reaches students. Then decide, using a rule fixed
in advance, whether future casebooks (M2) run this check automatically.

## Context
Read first: `CLAUDE.md`, `.claude/skills/build-log/SKILL.md`, `.gsd/phases/R2/01-PLAN.md`, `02-PLAN.md`, `03-PLAN.md`.
Inputs (local, gitignored): `backend/ingestion/out/r2_structure_check.json`, `out/r2_sweep_a.json`, `out/r2_sweep_b.json`, `out/r1_review_v3.json`.

Facts you need:
- All `<verify>` commands run from the repo root `/Users/aalhad/Projects/Placement Website`.
- v3 doc `129a2604-0221-4ba2-af50-42ac641a21a0`. On v3 rows you may set `needs_review = true` and append a reason (skip it if present).
  Save the before-values to `out/r2_reconcile_flags_before.json` first. Never set `review_status`. Never touch v1/v2 rows or `document_chunks`.
- **Ground truth "structure-bad"** = a sweep page (role `sweep`) with any mismatch of type `structure_lost` or `hallucinated`, or an `altered` summary,
  plus the 5 known-bad calibration pages (11, 13, 14, 238, 52). **"Good"** = sweep pass pages + the 8 known-good calibration pages.
- **Adoption rule (fixed now, do not tune after seeing the numbers):** adopt if recall ≥ 0.80 on structure-bad pages AND false-dispute rate ≤ 0.40
  on good pages. Otherwise do not adopt: keep `structure_check.py` as an admin tool and record that every diagram still needs a human or eyeball
  structure check before R9 (STATE "Known gaps").

## Tasks

<task type="auto">
  <name>r2_reconcile.py: agreement table, metrics, dispute flags on v3</name>
  <files>
    backend/ingestion/r2_reconcile.py
    backend/ingestion/out/r2_reconcile.json   (local, gitignored)
  </files>
  <action>
    1. Join the sweep verdicts (a + b) with the structure-check pool and calibration results by page. Compute: recall, false-dispute rate,
       run-to-run agreement, and a 2×2 (reviewer fail/pass × check disputed/clean) with the page lists.
    2. Flag on v3: every page with `disputed = true` that is not already flagged gets `structure_check:dispute`. Do not unflag anything.
    3. Print the final count of the 45-page pool: reviewed-pass-and-undisputed / flagged. The goal is 45 = pass + flagged, with each flag reason listed.
    4. Write `out/r2_reconcile.json` with the metrics, the 2×2, the adoption decision (from the fixed rule) and the flagged page list.
    5. `--report-only` re-reads `out/r2_reconcile.json` and re-prints the summary with no DB writes (used by verify). Flag writes are idempotent (skip existing reasons).
  </action>
  <verify>cd backend/ingestion && venv/bin/python r2_reconcile.py --report-only && venv/bin/python -c "
import json,sys;sys.path.insert(0,'.')
from pipeline import get_sb
r=json.load(open('out/r2_reconcile.json'));print({k:r[k] for k in ('recall','false_dispute_rate','adopt')})
pool=[26,28,32,33,34,39,40,41,42,49,50,51,62,82,87,89,91,92,95,96,99,102,103,108,109,112,113,115,136,149,160,180,182,186,191,193,199,204,213,221,225,230,233,245,246]
sw={p['page_no']:p['verdict'] for f in ('out/r2_sweep_a.json','out/r2_sweep_b.json') for p in json.load(open(f))['pages'] if p['role']=='sweep'}
rows={x['page_no']:x for x in get_sb().table('ingest_pages').select('page_no,needs_review').eq('document_id','129a2604-0221-4ba2-af50-42ac641a21a0').in_('page_no',pool).execute().data}
bad=[n for n in pool if not rows[n]['needs_review'] and sw.get(n)!='pass']
print('pool',len(pool),'flagged',sum(rows[n]['needs_review'] for n in pool),'neither_pass_nor_flagged',bad)"</verify>
  <done>`neither_pass_nor_flagged` prints `[]`. The metrics and the adoption decision are in `out/r2_reconcile.json`.</done>
</task>

<task type="auto">
  <name>Apply the adoption decision + log the sweep</name>
  <files>
    backend/ingestion/structure_check.py
    backend/ingestion/pipeline.py
    backend/ingestion/config.py
    backend/ingestion/tests/test_structure_check.py
    log.md
  </files>
  <action>
    1. If `adopt` is true: expose `structure_check.check_page(png_bytes, markdown) -> {disputed, result}` and call it in `pipeline.ingest_one_pdf`
       for pages with an issue_tree/flow block, only when `config.STRUCTURE_CHECK` is on (env `INGEST_STRUCTURE_CHECK=1`, default off, so the change is
       reversible in one step). A disputed page gets `needs_review = true` + `structure_check:dispute`. Count these calls in the run's call log.
       Add a unit test with a stubbed check (no network).
       If `adopt` is false: change no pipeline code. Add a module docstring line in `structure_check.py` that says "not adopted (R2.05)" and gives the numbers.
    2. Write the log.md entry "R2 structure sweep (R2.01–R2.05)": the pool size (45 live, not 55), the sweep table (page | verdict | issue | evidence)
       for failing pages only, the sweep error rate vs R1.10's 12.5% estimate, the 2×2, recall / false-dispute / adoption, the pages flagged
       (by reason), and the 9 + 10 visual-page results. Cost: plan 01's real vision call count and $; 0 for plans 02, 03 and 05.
       Undo: the `*_flags_before.json` files (plans 02, 03 and 05) restore needs_review/review_reasons per row.
  </action>
  <verify>cd backend/ingestion && venv/bin/python -m unittest discover -s tests 2>&1 | tail -2 && cd ../.. && grep -n "R2 structure sweep" log.md</verify>
  <done>The suite is OK. The log entry exists with the real numbers. Either the pipeline has the opt-in check with a test, or `structure_check.py` records "not adopted" with the numbers.</done>
</task>

## Must-Haves
- [ ] Every one of the 45 pool pages is reviewed-pass or flagged (STATE item 1 closed)
- [ ] Recall / false-dispute measured against a blind reviewer; adoption decided by the pre-set rule
- [ ] Flags on v3 only, before-values saved; log entry with cost

## Success Criteria
- [ ] Verify commands pass; commit `feat(R2): structure sweep reconcile ...`

---
phase: R2
plan: 08
wave: 5
depends_on: ["07"]
agent: fidelity-reviewer
files_modified:
  - backend/ingestion/out/r2_sample_review.json   (local, gitignored)
  - ingest_pages (v4 rows only: needs_review + review_reasons)
  - log.md
paid_calls: 0
---

# Plan R2.08: Independent sample review, part 2: review the other 20, score the sample against the R2 bar, log

## Objective
Review half 2 of the fresh sample drawn in plan 07, score all 40 pages, and decide whether R2's done-criterion is met:
**sample pass rate ≥ 95% and no `hallucinated` issue.** Report the result honestly. If the bar fails, return `blocked` with the patterns
and page numbers, so that the orchestrator can plan gap-closure fixes. Do not lower the bar or redraw the sample.

## Context
Read first: `.gsd/phases/R2/07-PLAN.md` (Context: render command, what is checked, outcomes, write rights; all apply unchanged),
`.claude/skills/build-log/SKILL.md`, `backend/ingestion/out/r2_sample.json`, `out/r2_sample_review.json` (half 1), `out/r2_reconcile.json` (plan 05).

Facts you need:
- All `<verify>` commands run from the repo root `/Users/aalhad/Projects/Placement Website`. Preview file: `out/r2_sample_2.html`.
- **Scoring (fixed before review):**
  - `pass rate` = (faithful + caught) / 40. Bar: ≥ 0.95, so at most 2 `missed` pages. This is R1's "every page faithful OR flagged" bar measured on a fresh sample:
    a flagged page is held for human review (R5) and is not shown to students unreviewed.
  - `raw faithful rate` = faithful / 40. Report it next to the pass rate; it is not the gate.
  - `hallucinated` gate: 0 `hallucinated` mismatches on pages that were not flagged at draw time. Any `hallucinated` issue on a flagged page is
    listed as a pipeline pattern but does not fail the gate. (This reading of the ROADMAP criterion is an assumption that Aalhad confirms in the log.)
  - Report a Wilson 95% interval for the pass rate, because 40 pages is a small sample.

## Tasks

<task type="auto">
  <name>Review half 2 (20 pages) against the images</name>
  <files>backend/ingestion/out/r2_sample_review.json</files>
  <action>
    Same method as plan 07, task 2, on the `half: 2` pages. Append them to `pages` in `out/r2_sample_review.json`, and flag `missed` pages on v4
    (append their before-values to `out/r2_sample_flags_before.json` before writing).
    AVOID: reading half 1's verdicts before you finish half 2, because that anchors your judgement.
  </action>
  <verify>cd backend/ingestion && venv/bin/python -c "
import json;r=json.load(open('out/r2_sample_review.json'));P=r['pages']
from collections import Counter;print(len(P),Counter(p['half'] for p in P),Counter(p['outcome'] for p in P),'zero_items',[p['page_no'] for p in P if not p['items_checked']])"</verify>
  <done>40 pages (20 per half) with items_checked &gt; 0 and an outcome on each.</done>
</task>

<task type="auto">
  <name>Score, record the result, log</name>
  <files>
    backend/ingestion/out/r2_sample_review.json
    log.md
  </files>
  <action>
    1. Add `result` to `out/r2_sample_review.json`: `{n, faithful, caught, missed, pass_rate, wilson_95, raw_faithful_rate,
       hallucinated_unflagged: [pages], hallucinated_flagged: [pages], bar_met: bool, patterns: [{pattern, pages}]}`.
    2. Write the log.md entry "R2 independent sample review (v4)": the table (page | stratum | flagged_at_draw | outcome | issue | evidence), the
       numbers above, the patterns, the pages flagged now, cost 0, and Undo (`r2_sample_flags_before.json`). State bar met / not met in one plain sentence.
       Under "Open issues", ask Aalhad to confirm the scoring reading (faithful-or-flagged; hallucination gate on unflagged pages).
    3. If `bar_met` is false: finish with status `blocked`, listing each failing pattern with its pages. Do not change pipeline code yourself.
  </action>
  <verify>cd "/Users/aalhad/Projects/Placement Website" && backend/ingestion/venv/bin/python -c "
import json;r=json.load(open('backend/ingestion/out/r2_sample_review.json'))['result'];print(r)
ok=r['n']==40 and r['pass_rate']>=0.95 and not r['hallucinated_unflagged'];print('R2 BAR', 'MET' if ok else 'NOT MET')" && grep -n "R2 independent sample review" log.md</verify>
  <done>`result` is complete and the log entry exists. R2 is done only if the command prints `R2 BAR MET`. Otherwise the plan returns `blocked` with the patterns (an honest failure, with the evidence attached).</done>
</task>

## Must-Haves
- [ ] All 40 sample pages reviewed against the images; missed pages flagged on v4 only
- [ ] Pass rate, raw faithful rate, Wilson interval and hallucination gate recorded with the pre-set scoring
- [ ] log.md entry; no approvals, no code edits

## Success Criteria
- [ ] `R2 BAR MET` → hand to `verifier` for the R2 phase check, then ROADMAP/STATE update and commit `docs(R2): ...`
- [ ] `R2 BAR NOT MET` → `blocked` with patterns → planner writes gap-closure plans R2.09+

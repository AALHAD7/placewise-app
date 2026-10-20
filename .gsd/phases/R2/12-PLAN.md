---
phase: R2
plan: 12
wave: 9
gap_closure: true
depends_on: ["11"]
agent: fidelity-reviewer
files_modified:
  - backend/ingestion/out/r2_sample_v5_review.json   (local, gitignored)
  - ingest_pages (v5 rows only: needs_review + review_reasons)
  - log.md
paid_calls: 0
---

# Plan R2.12: Re-check, part 2: review the other 20, score v5 against the R2 bar, and log

## Objective
Review half 2 of the plan-11 sample and score all 40 pages. Decide whether R2's done-criterion is met on v5: **sample pass rate ≥ 95% and no
`hallucinated` issue on an unflagged page.** Report the result honestly. Do not lower the bar, redraw the sample or re-score R2.07/08.

## Context
Read first: `.gsd/phases/R2/11-PLAN.md` (render command, what is checked, outcomes, write rights; all apply unchanged; the preview file is
`out/r2_sample_v5_2.html`), `.gsd/phases/R2/08-PLAN.md` (scoring method), `.claude/skills/build-log/SKILL.md`,
`backend/ingestion/out/r2_sample_v5.json`, `out/r2_sample_v5_review.json` (half 1).

Facts you need:
- All `<verify>` commands run from the repo root `/Users/aalhad/Projects/Placement Website`.
- **Scoring (fixed before review; same as R2.08 and still pending Aalhad's confirmation):**
  - pass rate = (faithful + caught) / 40. Bar: ≥ 0.95, which means at most 2 `missed` pages. Report the Wilson 95% interval and note that it
    is conservative (FPC ≈ 0.83 for n = 40 of N = 127).
  - Hallucination gate: 0 `hallucinated` mismatches on pages that were unflagged at draw. Hallucinations on flagged pages are listed as patterns.
  - Also report:
    - the raw faithful rate (faithful / 40) with a Wilson interval;
    - the **unflagged miss rate**, missed / pages unflagged at draw, with a Wilson interval (the most informative number for whether v5 is safe to show);
    - the share of pages flagged at draw, and the reasons for those flags;
    - side by side with R2.08: 34/40 pass, 13/40 faithful, 6 missed.
- After scoring, you may open `out/r2_v5_output.json` to see which sampled pages had a plan-09 repair or strip, and report how those pages
  did. A wrong repair counts against the repair rule.

## Tasks

<task type="auto">
  <name>Review half 2 (20 pages) against the images and flag missed pages on v5</name>
  <files>backend/ingestion/out/r2_sample_v5_review.json</files>
  <action>
    1. Review the 20 half-2 pages before re-reading half 1's verdicts, using the same item-by-item method.
    2. Append them to the review file with `half: 2`.
    3. Flag missed pages on v5 only, saving the before-values first by appending to `out/r2_sample_v5_flags_before.json`.
  </action>
  <verify>cd backend/ingestion && venv/bin/python -c "
import json;r=json.load(open('out/r2_sample_v5_review.json'));P=[p for p in r['pages'] if p['half']==2]
from collections import Counter;print(len(P),Counter(p['outcome'] for p in P),'zero_items',[p['page_no'] for p in P if not p['items_checked']])
print([(p['page_no'],p['outcome'],[m['type'] for m in p['mismatches']]) for p in P if p['outcome']!='faithful'])"</verify>
  <done>20 half-2 pages, each with items_checked &gt; 0 and an outcome. Missed pages are flagged on v5 only.</done>
</task>

<task type="auto">
  <name>Score all 40 pages, write the result block and the log entry</name>
  <files>
    backend/ingestion/out/r2_sample_v5_review.json
    log.md
  </files>
  <action>
    1. Add a `result` block in the R2.08 shape: n, faithful, caught, missed, pass_rate, wilson_95, raw_faithful_rate (+ Wilson),
       unflagged_n, unflagged_miss_rate (+ Wilson), missed_pages, hallucinated_unflagged, hallucinated_flagged, repaired_pages_outcomes,
       bar_met, scoring, and ranked patterns with pages and free/paid fixes.
    2. Write a `log.md` entry (R2.11–R2.12, Type: eval). Include:
       - the half-1 and half-2 tables;
       - the scores next to R2.08;
       - the flag changes;
       - 0 Gemini calls;
       - Undo: restore from `out/r2_sample_v5_flags_before.json`;
       - Open issues, which must include Aalhad's pending confirmation of the scoring reading.
    3. If the bar is met, say R2 is ready for the `verifier`. **Do not** mark ROADMAP or STATE yourself.
       If it is not met, return `blocked` with the patterns. Do not start another fix round.
  </action>
  <verify>cd backend/ingestion && venv/bin/python -c "
import json;r=json.load(open('out/r2_sample_v5_review.json'));P=r['pages'];R=r['result']
from collections import Counter;c=Counter(p['outcome'] for p in P);print(len(P),Counter(p['half'] for p in P),c)
assert R['missed']==c['missed'] and R['faithful']==c['faithful'] and len(P)==40
print('pass',R['pass_rate'],R['wilson_95'],'unflagged miss',R['unflagged_miss_rate'],'halluc_unflagged',R['hallucinated_unflagged'])
print('R2 BAR MET' if R['missed']<=2 and not R['hallucinated_unflagged'] else 'R2 BAR NOT MET')" && grep -c "R2.11" ../../log.md</verify>
  <done>40 pages scored. The result block matches the per-page outcomes, and the script prints `R2 BAR MET` or `R2 BAR NOT MET`. The log entry
  exists. Return the half-2 table, the scores and the patterns.</done>
</task>

## Must-Haves
- [ ] All 40 fresh-sample pages reviewed against the images. Scoring unchanged from R2.08.
- [ ] Honest verdict, with the unflagged miss rate and intervals. Missed pages flagged on v5 only.

## Success Criteria
- [ ] The result block and the `log.md` entry are written. If met, R2 is handed to the `verifier`; if not, `blocked` with patterns.

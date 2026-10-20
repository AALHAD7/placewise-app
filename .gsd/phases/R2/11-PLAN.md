---
phase: R2
plan: 11
wave: 8
gap_closure: true
depends_on: ["10"]
agent: fidelity-reviewer
files_modified:
  - backend/ingestion/out/r2_sample_v5.json            (local, gitignored)
  - backend/ingestion/out/r2_sample_v5_review.json     (local, gitignored)
  - backend/ingestion/out/r2_sample_v5_flags_before.json (local, gitignored)
  - ingest_pages (v5 rows only: needs_review + review_reasons)
paid_calls: 0
---

# Plan R2.11: Re-check, part 1: draw a FRESH sample of v5 pages (none ever reviewed) and review the first 20

## Objective
Measure v5 independently. Draw a new random sample of 40 pages from the v5 pages that **no earlier review or calibration has seen**, using a
new seed. Review the first 20 against the page images under the strict R1 rule. Plan 12 reviews the other 20 and scores the sample.
You did not write the fixes. Assume nothing is right until you have checked it.

## Context
Read first: `CLAUDE.md`, `.claude/agents/fidelity-reviewer.md`, `.claude/skills/casebook-ingestion/SKILL.md`,
`.claude/skills/diagram-transcription/SKILL.md`, `.gsd/phases/R2/07-PLAN.md` (the method; it applies unchanged except for what is below), and
the R2.08 and R2.09–R2.10 `log.md` entries.

Facts you need:
- All `<verify>` commands run from the repo root `/Users/aalhad/Projects/Placement Website`.
- v5 = `ingest_documents` with source_file `The FMS Consulting CaseBook 2023-24 (1).pdf` and `ingestion_version = 5` (inactive). Render pages:
  `cd backend/ingestion && venv/bin/python diagram_preview.py --pdf "../../Data/Consulting Files/PDF Files/The FMS Consulting CaseBook 2023-24 (1).pdf" --pages <list> --source db --version 5 --out out/r2_sample_v5_1.html`
  Then read `out/pages/p<N>.png`, plus the v5 `markdown` and `text_layer` from the DB.
- **Pool:** v5 pages that are not in `out/r1_review.json`, `out/r1_review_v3.json`, `out/r2_sweep_a.json`, `out/r2_sweep_b.json` or
  `out/r2_sample.json`. Expect 127 pages. Plan 09 tuned its rules only on the excluded 121 pages, so this pool is a true holdout.
- **Sample size and stats (fixed now):** n = 40, a simple random sample, seed **2023**.
  - Only about 5 text pages are left in the pool, so the visual/text strata no longer mean anything. Record `stratum` for reporting only.
  - n = 40 keeps the same bar as R2.07/08, which is at most 2 `missed` pages (pass rate ≥ 0.95), so the results can be compared directly.
  - 40 of 127 is 31% of the pool. The finite-population correction, sqrt(87/126) ≈ 0.83, narrows any interval by about 17%.
  - Plan 12 reports the plain Wilson interval (conservative) and says so.
  - 87 unreviewed pages remain after this sample for any later re-check.
- **Do not open** `out/r2_gapcheck.json` or `out/r2_v5_output.json` before you finish each page. Knowing what was repaired would bias the review.
  The draw records `flagged_at_draw` and the reasons; that is all you need.
- **What is checked** is the same as plan 07, with this change: logo or image placeholders that are not printed (e.g. "[FMS Logo]") now count
  as `hallucinated`, and leftover brackets around printed link text (e.g. "[Main Index]") count as `altered`. The orchestrator decided this
  under the grounding policy. Punctuation is compared character for character, as in R2.07/08.
- **Page outcome:** `faithful` · `caught` (≥ 1 mismatch, and v5 needs_review = true at draw) · `missed` (≥ 1 mismatch on an unflagged page).
- Write rights: on **v5 rows only**, for `missed` pages, set needs_review = true and append `fidelity_review:<type>`. Save the before-values to
  `out/r2_sample_v5_flags_before.json` first. Never approve. Never edit code, other versions or the sample.

## Tasks

<task type="auto">
  <name>Draw the fresh sample once (deterministic, holdout only)</name>
  <files>backend/ingestion/out/r2_sample_v5.json</files>
  <action>
    Run this from `backend/ingestion`:
    ```
    venv/bin/python - <<'PY'
    import json, random
    from pipeline import get_sb
    from diagram_schema import extract_blocks
    sb = get_sb()
    doc = sb.table('ingest_documents').select('id').eq('source_file','The FMS Consulting CaseBook 2023-24 (1).pdf').eq('ingestion_version',5).execute().data[0]['id']
    rows, s = [], 0
    while True:
        r = sb.table('ingest_pages').select('page_no,is_visual,markdown,needs_review,review_reasons').eq('document_id',doc).order('page_no').range(s,s+99).execute().data
        rows += r
        if len(r) < 100: break
        s += 100
    excl = set()
    for f in ('out/r1_review.json','out/r1_review_v3.json','out/r2_sweep_a.json','out/r2_sweep_b.json','out/r2_sample.json'):
        excl |= {p['page_no'] for p in json.load(open(f))['pages']}
    pool = sorted((r for r in rows if r['page_no'] not in excl), key=lambda r: r['page_no'])
    pick = random.Random(2023).sample(pool, 40)
    vis = lambda r: bool(r['is_visual']) or bool(extract_blocks(r['markdown'] or ''))
    pages = [{'page_no': r['page_no'], 'stratum': 'visual' if vis(r) else 'text', 'flagged_at_draw': bool(r['needs_review']),
              'reasons_at_draw': r['review_reasons'] or [], 'half': 1 if i % 2 == 0 else 2} for i, r in enumerate(pick)]
    json.dump({'seed': 2023, 'document_id': doc, 'ingestion_version': 5, 'pool_size': len(pool), 'excluded': sorted(excl), 'pages': pages},
              open('out/r2_sample_v5.json','w'), indent=1)
    print(len(rows), 'pool', len(pool), sorted(p['page_no'] for p in pages))
    PY
    ```
    If the pool is not 127, stop and report it; do not continue. Do not redraw or swap pages after seeing them.
  </action>
  <verify>cd backend/ingestion && venv/bin/python -c "
import json;s=json.load(open('out/r2_sample_v5.json'));P=s['pages']
print(len(P),'pool',s['pool_size'],'half1',sum(p['half']==1 for p in P),'flagged',sum(p['flagged_at_draw'] for p in P))
print('overlap with excluded',set(p['page_no'] for p in P)&set(s['excluded']))"</verify>
  <done>40 pages from a pool of 127, 20 in half 1, no overlap with any earlier review.</done>
</task>

<task type="auto">
  <name>Review half 1 (20 pages) against the images and flag missed pages on v5</name>
  <files>
    backend/ingestion/out/r2_sample_v5_review.json
    backend/ingestion/out/r2_sample_v5_flags_before.json
  </files>
  <action>
    1. Render the 20 half-1 pages in 2–3 batches. Check each page item by item: every sentence, word and punctuation mark in the prose, every
       heading, every tag, every table cell, and every block (labels, parents, edges, titles, legends). Also check for invented placeholders,
       brackets and captions.
    2. Write `out/r2_sample_v5_review.json` in the plan-07 shape: `{document_id, ingestion_version: 5, pages: [{page_no, stratum, half: 1,
       items_checked, mismatches: [{type, item, page_shows, stored}], verdict, outcome}]}`.
    3. Flag the `missed` pages on v5 (save the before-values first).
    AVOID: skimming dialogue prose. It is where every R2.08 miss was, and the plan-09 repair targets it directly.
  </action>
  <verify>cd backend/ingestion && venv/bin/python -c "
import json;r=json.load(open('out/r2_sample_v5_review.json'));P=[p for p in r['pages'] if p['half']==1]
from collections import Counter;print(len(P),Counter(p['outcome'] for p in P),'zero_items',[p['page_no'] for p in P if not p['items_checked']])
print([(p['page_no'],p['outcome'],[m['type'] for m in p['mismatches']]) for p in P if p['outcome']!='faithful'])"</verify>
  <done>20 half-1 pages, each with items_checked &gt; 0 and an outcome. Every `missed` page is flagged on v5 only.</done>
</task>

## Must-Haves
- [ ] A fresh sample with a new seed, drawn once from the 127-page holdout
- [ ] 20 pages reviewed against the images; missed pages flagged on v5 only

## Success Criteria
- [ ] `out/r2_sample_v5.json` and half 1 of `out/r2_sample_v5_review.json` exist; return the half-1 table

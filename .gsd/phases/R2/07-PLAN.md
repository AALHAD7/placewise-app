---
phase: R2
plan: 07
wave: 4
depends_on: ["06"]
agent: fidelity-reviewer
files_modified:
  - backend/ingestion/out/r2_sample.json          (local, gitignored)
  - backend/ingestion/out/r2_sample_review.json   (local, gitignored)
  - ingest_pages (v4 rows only: needs_review + review_reasons)
paid_calls: 0
---

# Plan R2.07: Independent sample review, part 1: draw a fresh random sample of v4 pages and review the first 20

## Objective
R2's done-criterion is a sample pass rate ≥ 95% with no `hallucinated` issue. Draw a **fresh** random sample of 40 v4 pages that no
earlier review has seen, and check the first 20 against the page images with the strict R1 rule. Plan 08 checks the other 20 and scores the sample.
You did not write the converter or the fixes. Assume nothing is right until you have checked it.

## Context
Read first: `CLAUDE.md`, `.claude/agents/fidelity-reviewer.md`, `.claude/skills/casebook-ingestion/SKILL.md`,
`.claude/skills/diagram-transcription/SKILL.md`, `.gsd/phases/R1/10-PLAN.md` (method and JSON shape).

Facts you need:
- All `<verify>` commands run from the repo root `/Users/aalhad/Projects/Placement Website`.
- v4 = `ingest_documents` with source_file `The FMS Consulting CaseBook 2023-24 (1).pdf` and `ingestion_version = 4` (inactive). Render pages:
  `cd backend/ingestion && venv/bin/python diagram_preview.py --pdf "../../Data/Consulting Files/PDF Files/The FMS Consulting CaseBook 2023-24 (1).pdf" --pages <list> --source db --version 4 --out out/r2_sample_1.html`
  Then read `out/pages/p<N>.png` directly, along with the v4 `markdown` and `text_layer` from the DB.
- **What is checked on every page:** the whole markdown, not only the diagrams. Every heading, sentence, number and table cell against the image;
  every block (labels character for character, parents, edges, axes, data points, summary); no invented content (links, images, nodes, edges, numbers).
  Issue types: `missing`, `altered`, `hallucinated`, `structure_lost`, `unreadable`.
- **Page outcome:** `faithful` (0 mismatches) · `caught` (≥ 1 mismatch, and the v4 page already had needs_review = true when it was drawn) ·
  `missed` (≥ 1 mismatch on a page that was not flagged).
- Write rights: on **v4 rows only**, set needs_review = true + append `fidelity_review:<type>` on `missed` pages. Save the before-values to
  `out/r2_sample_flags_before.json` first. Never approve. Never edit code or other versions.

## Tasks

<task type="auto">
  <name>Draw the sample (deterministic, excludes every page reviewed before)</name>
  <files>backend/ingestion/out/r2_sample.json</files>
  <action>
    Run this exact draw from `backend/ingestion` (seed 2022). It excludes every page in the earlier review files, then takes 24 "visual" pages
    (`is_visual` or ≥ 1 block) and 16 "text" pages (the rest), and splits each stratum evenly into half 1 and half 2:
    ```
    venv/bin/python - <<'PY'
    import json, random
    from pipeline import get_sb
    from diagram_schema import extract_blocks
    sb = get_sb()
    doc = sb.table('ingest_documents').select('id').eq('source_file','The FMS Consulting CaseBook 2023-24 (1).pdf').eq('ingestion_version',4).execute().data[0]['id']
    rows = sb.table('ingest_pages').select('page_no,is_visual,markdown,needs_review').eq('document_id',doc).execute().data
    excl = set()
    for f in ('out/r1_review.json','out/r1_review_v3.json','out/r2_sweep_a.json','out/r2_sweep_b.json'):
        excl |= {p['page_no'] for p in json.load(open(f))['pages']}
    vis = lambda r: bool(r['is_visual']) or bool(extract_blocks(r['markdown'] or ''))
    cand = sorted((r for r in rows if r['page_no'] not in excl), key=lambda r: r['page_no'])
    rng = random.Random(2022)
    pick = rng.sample([r for r in cand if vis(r)], 24) + rng.sample([r for r in cand if not vis(r)], 16)
    pages = [{'page_no': r['page_no'], 'stratum': 'visual' if vis(r) else 'text', 'flagged_at_draw': bool(r['needs_review']),
              'half': 1 if i % 2 == 0 else 2} for i, r in enumerate(pick)]
    json.dump({'seed': 2022, 'document_id': doc, 'excluded': sorted(excl), 'pages': pages}, open('out/r2_sample.json','w'), indent=1)
    print(sorted(p['page_no'] for p in pages))
    PY
    ```
    If `out/r1_review.json` has a different shape (no top-level `pages`), adapt only the exclusion read and say so in your report.
    Do not redraw or swap pages after seeing them; a hard page is part of the sample.
  </action>
  <verify>cd backend/ingestion && venv/bin/python -c "
import json;s=json.load(open('out/r2_sample.json'));P=s['pages']
print(len(P),'visual',sum(p['stratum']=='visual' for p in P),'half1',sum(p['half']==1 for p in P),'flagged',sum(p['flagged_at_draw'] for p in P))
print('overlap with excluded',set(p['page_no'] for p in P)&set(s['excluded']))"</verify>
  <done>40 pages, 24 visual, 20 in half 1, no overlap with earlier reviews.</done>
</task>

<task type="auto">
  <name>Review half 1 (20 pages) against the images</name>
  <files>
    backend/ingestion/out/r2_sample_review.json
    backend/ingestion/out/r2_sample_flags_before.json
  </files>
  <action>
    1. Render the 20 half-1 pages in 2–3 batches and check each one item by item (see "What is checked").
    2. Write `out/r2_sample_review.json`: `{document_id, ingestion_version: 4, pages: [{page_no, stratum, half: 1, items_checked, mismatches:
       [{type, item, page_shows, stored}], verdict, outcome}]}`.
    3. Flag the `missed` pages on v4 (save the before-values first).
    AVOID: skipping text pages or skimming them, because the sample has to measure the whole page, and text pages are where invented links and typos hid in R1.
  </action>
  <verify>cd backend/ingestion && venv/bin/python -c "
import json;r=json.load(open('out/r2_sample_review.json'));P=[p for p in r['pages'] if p['half']==1]
from collections import Counter;print(len(P),Counter(p['outcome'] for p in P),'zero_items',[p['page_no'] for p in P if not p['items_checked']])
print([(p['page_no'],p['outcome'],[m['type'] for m in p['mismatches']]) for p in P if p['outcome']!='faithful'])"</verify>
  <done>20 half-1 pages with items_checked &gt; 0, each with an outcome. Every `missed` page is flagged on v4.</done>
</task>

## Must-Haves
- [ ] Sample drawn once, deterministically, from pages no earlier review saw
- [ ] 20 pages reviewed against the images; missed pages flagged on v4 only

## Success Criteria
- [ ] `out/r2_sample.json` and half 1 of `out/r2_sample_review.json` exist; return the half-1 table

---
phase: R2
plan: 10
wave: 7
gap_closure: true
depends_on: ["09"]
agent: ingestion-engineer
files_modified:
  - backend/ingestion/run_v5.py                  (new)
  - backend/ingestion/tests/test_v5_carry.py     (new)
  - backend/ingestion/out/r2_v5_output.json      (local, gitignored)
  - backend/ingestion/out/r1_embeddings_v5.json  (local, gitignored)
  - ingest_documents / ingest_pages / ingest_chunks (insert-only: new v5 rows, is_active = false)
  - log.md
paid_calls: "≤ 400 embedding calls (gemini-embedding-001, 768 dims), ≈ $0.04 at most; 0 vision calls"
---

# Plan R2.10: Gap closure, part 2: carry v4 plus the plan-09 fixes and flags into v5 (insert-only, inactive)

## Objective
Store the plan-09 repairs, strips and flags as a new version, **v5**, built from v4. The build makes no vision calls, no prompt calls and no
deletes. It writes nothing to v1–v4 or `document_chunks`. Embeddings are made only for chunk texts that changed. Plans 11 and 12 review v5 on
a fresh sample. Nothing reads v5 until R9, so the step can be undone by ignoring `ingestion_version = 5`.

## Context
Read first: `CLAUDE.md`, `.claude/skills/casebook-ingestion/SKILL.md`, `.claude/skills/build-log/SKILL.md`, `.gsd/phases/R2/09-PLAN.md`,
the R2.06 `log.md` entry (how v4 was carried), `backend/ingestion/run_v4.py` (reuse its pure functions and its guard order),
`backend/ingestion/out/r2_gapcheck.json` (it must say all gates pass).

Facts you need:
- All `<verify>` commands run from the repo root `/Users/aalhad/Projects/Placement Website`.
- Base: v4 doc `d1510e35-9ecc-419b-a497-85a37e062792` (248 pages, 384 chunks, 152 needs_review, all inactive). New: `ingestion_version = 5`.
- `run_v4.py` hard-codes v3 checks: `V3_DOC_ID`, `r2_fixcheck.json` document_id, the `diagram_in_table` proof and the visual triage.
  **Do not edit `run_v4.py`.** Write `run_v5.py`, which imports the pure helpers (`label_lines_for`, `merge_reasons`, `new_embed_texts`,
  `load_doc_pages`) and takes the base doc id `d1510e35…` as a constant guard.
- Reasons: v5 reasons = v4 reasons ∪ new `check_page` reasons ∪ `structure_unreviewed`. **No reason is ever dropped**, including the human
  `fidelity_review:*` flags on pages that a repair has now fixed. A human clears those in R5.
- Drift guard: count only pages whose markdown did not change and that gained a reason code which **already existed in v4**. Exclude the new
  codes (`seq_diff`, `invented_text`, `framework_as_text`, `structure_unreviewed`). Stop if the count is more than 10.
- Embedding cache: seed it from `out/r1_embeddings_v4.json`. Cap at 400 new calls; stop before any write if the cap would be passed.
  Expected: about 100–250 calls (changed chunks on pages with strips or repairs), at about $0.0001 per call, so ≤ $0.04.
- Data safety: insert-only through `pipeline.write_version`. Set `reused_from_page_id` to the v4 page id. Image paths stay v1's
  (`pages/67371722…`). `review_status` is pending on all pages. `is_active = false` on all chunks.

## Tasks

<task type="auto">
  <name>Write run_v5.py with guards, test the carry, and dry-run it</name>
  <files>
    backend/ingestion/run_v5.py
    backend/ingestion/tests/test_v5_carry.py
  </files>
  <action>
    1. `run_v5.py` has the same shape as `run_v4.py`: `--dry-run`, `--resume`, and `--embed-cap 400`. It aborts in each of these cases:
       - the base doc id is not `d1510e35…`;
       - the sha256 does not match v1 and v4;
       - the page counts differ;
       - the `source_class` is not `club_casebook`;
       - v5 already exists with a status other than done (if it is done, print "already done" and exit 0);
       - `out/r2_gapcheck.json` is missing, is not for v4, or has a failing gate.
    2. Per page (pure `carry_page_v5`):
       - compute `boilerplate_lines` once from all 248 text layers;
       - run `postprocess_markdown` with the seq, invented, typo and hash logs and the boilerplate set, then `check_page(..., is_visual=..., boilerplate=...)`;
       - merge the reasons;
       - add `structure_unreviewed` from plan 09's pure function;
       - record the per-page info: changed, repairs, strips, added reasons, and needs_review v4 → v5.
    3. The dry-run prints:
       - pages changed;
       - repairs and strips by kind;
       - reasons added by code;
       - needs_review v4 152 → v5 N;
       - the drift count;
       - chunks and new embedding calls, with the $ estimate.
       It also asserts that the v5 markdown for pages 135, 137, 143, 150, 183 and 231 matches what `r2_gapcheck.json` recorded.
    4. `test_v5_carry.py` (no DB) checks that:
       - reasons are never dropped;
       - new reason codes do not count as drift;
       - `structure_unreviewed` is added only to unreviewed tree or flow pages;
       - a second carry over v5 output changes 0 pages.
    AVOID: recomputing reasons from scratch, because that would drop R1/R2 human flags. Merge only.
  </action>
  <verify>cd backend/ingestion && venv/bin/python -m unittest discover -s tests -t . 2>&1 | tail -3 && venv/bin/python run_v5.py --dry-run; echo "exit=$?"</verify>
  <done>The suite is OK. The dry-run exits 0 with `DRY RUN: 0 Gemini calls, 0 DB writes`, drift ≤ 10, new embedding calls ≤ 400, and the
  needs_review count matches the projection in `r2_gapcheck.json` (±0).</done>
</task>

<task type="auto">
  <name>Build v5 (embeddings only), verify the row counts, and log it</name>
  <files>
    backend/ingestion/out/r2_v5_output.json
    backend/ingestion/out/r1_embeddings_v5.json
    log.md
  </files>
  <action>
    1. Run `venv/bin/python run_v5.py`. If it stops cleanly (exit 2), re-run with `--resume`.
    2. Check the counts after the write:
       - v1–v4 page and chunk counts are unchanged (248/363, 248/395, 248/390, 248/384);
       - v5 has 248 pages and N chunks, with 0 active;
       - `document_chunks` = 22457;
       - active `ingest_chunks` = 0.
       Run `check_schema.py`.
    3. Write a `log.md` entry, R2.09–R2.10, Type: ingestion | fix. It covers:
       - the new rules;
       - the repair-versus-whole-page decision and why;
       - the G1–G6 gate table;
       - repairs and strips by kind;
       - the new flags by code, and needs_review 152 → N;
       - embedding calls and cost;
       - Undo: ignore `ingestion_version = 5`, or revert the plan-09/10 files;
       - Open issues: `structure_unreviewed` and `framework_as_text` make the R5 review queue larger; patterns 2 and 3 still need a human or a vision re-call.
    AVOID: running without `--dry-run` before task 1 passes, because the write is insert-only and a second v5 cannot be made without a new version number.
  </action>
  <verify>cd backend/ingestion && venv/bin/python check_schema.py | tail -2 && venv/bin/python -c "
from pipeline import get_sb;sb=get_sb()
for v in (1,2,3,4,5):
    d=sb.table('ingest_documents').select('id').eq('source_file','The FMS Consulting CaseBook 2023-24 (1).pdf').eq('ingestion_version',v).execute().data[0]['id']
    p=sb.table('ingest_pages').select('id',count='exact').eq('document_id',d).execute().count
    c=sb.table('ingest_chunks').select('id',count='exact').eq('document_id',d).execute().count
    a=sb.table('ingest_chunks').select('id',count='exact').eq('document_id',d).eq('is_active',True).execute().count
    print(v,d[:8],p,c,'active',a)
print('document_chunks',sb.table('document_chunks').select('id',count='exact').limit(1).execute().count)"</verify>
  <done>`check_schema` PASS. v1–v4 counts are unchanged, v5 has 248 pages with active 0, and `document_chunks` = 22457. The log entry exists
  with the call count and cost. Return the v5 doc id.</done>
</task>

## Must-Haves
- [ ] v5 stored insert-only and inactive. No earlier version, `document_chunks` or `review_status` changed.
- [ ] No reason dropped. needs_review on v5 ≥ 152.
- [ ] Gemini spend: embeddings only, ≤ 400 calls.

## Success Criteria
- [ ] Both verifies pass. The `log.md` entry is written. The v5 doc id is reported.

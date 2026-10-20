---
phase: R2
plan: 06
wave: 3
depends_on: ["04", "05"]
agent: ingestion-engineer
gap_closure: true
files_modified:
  - backend/ingestion/run_v4.py
  - backend/ingestion/tests/test_v4_carry.py
  - log.md
  - ingest_documents / ingest_pages / ingest_chunks (insert-only, new v4 rows, is_active = false)
paid_calls: "0 vision. Embeddings only for chunk texts whose content changed (cache seeded from v3): estimated ≤ 120, hard cap 250, ≈ $0.01."
---

# Plan R2.06: Build v4 = v3 + the free fixes + every R1/R2 flag (insert-only, inactive)

## Objective
Apply the plan-04 fixes to every page, including the 15 fallback_v1 pages, and carry every flag forward. Store the result as
`ingestion_version = 4`, with all chunks `is_active = false`. v4 becomes the R2 candidate, and the independent sample review
(plans 07 and 08) runs on it. This is insert-only: v1, v2 and v3 rows and `document_chunks` are never touched. No vision calls are made:
v4 is v3's content with deterministic repairs.

## Context
Read first: `CLAUDE.md` (data safety), `.claude/skills/casebook-ingestion/SKILL.md`, `.claude/skills/build-log/SKILL.md`,
`backend/ingestion/run_patch.py` (reuse `load_v1`, `sha256_file`, embed cache helpers, `version_status`/`write_version` usage and abort rules),
`backend/ingestion/pipeline.py` (`write_version(..., reused_from=, image_paths=)`, `chunkable_pages`), `backend/ingestion/pilot_report.py`,
`backend/ingestion/r2_fixcheck.py` (plan 04), `backend/ingestion/out/r2_sweep_b.json` → `visual_triage_rate`.

Facts you need:
- All `<verify>` commands run from the repo root `/Users/aalhad/Projects/Placement Website`.
- PDF `Data/Consulting Files/PDF Files/The FMS Consulting CaseBook 2023-24 (1).pdf`. v1 doc `67371722-…` (248/363), v2 `e6cdd69b-…` (248/395),
  v3 `129a2604-0221-4ba2-af50-42ac641a21a0` (248/390, needs_review 110 before R2, more after plans 02, 03 and 05). `document_chunks` = 22457.
- Image paths: reuse v1's (`pages/67371722-…/<n>.png`). Upload nothing.
- **Reason merge rule** (over-flagging is safe; silently dropping a flag is not):
  `v4 reasons = v3 reasons ∪ check_page(v4 markdown).reasons`. The only reason that may be dropped is `diagram_in_table`, and only on a page where plan 04
  proved a false positive AND the new check no longer raises it. `needs_review = bool(v4 reasons)`. `review_status` = `pending`.
- **visual_no_block:** if `visual_triage_rate` has k ≥ 1, every page with `is_visual`, 0 valid blocks and no other flag gets `visual_no_block`.
  If k = 0, add nothing and log that the triage found none.
- Cost: embeddings ≈ 600 tokens at $0.15/M each.

## Tasks

<task type="auto">
  <name>run_v4.py: carry v3 + fixes + merged flags, dry run (free)</name>
  <files>
    backend/ingestion/run_v4.py
    backend/ingestion/tests/test_v4_carry.py
  </files>
  <action>
    1. Args: `--base-version 3 --version 4 --embed-cap 250 [--dry-run] [--resume]`. Abort, as run_patch does, on a sha256 mismatch, a page-count mismatch,
       an existing v4 with status ≠ done (no deletes), or a `source_class` other than `club_casebook`.
    2. For each v3 page: `markdown = postprocess_markdown(v3.markdown, text_layer)[0]`. Re-run `check_page` with the page's **cached** `label_lines`
       (from `out/r1_pages_v3.jsonl` for re-converted pages, else `out/r1_pages_v2.jsonl`, via `run_patch.load_v2_label_lines`), because re-running
       postprocess on already-collapsed markdown returns empty label_lines and would change the label checks. Merge the reasons by the rule, keep `method` and
       `prompt_version`, and set `reused_from_page_id` = the v3 page id.
    3. Chunk with `chunk_document(chunkable_pages(pages))`. Count the chunk texts not in the embedding cache (seeded from `out/r1_embeddings_v3.json` into
       `out/r1_embeddings_v4.json`).
    4. Dry run prints: pages with changed markdown (list), reasons added/dropped per page, needs_review v3 → v4, chunks, and the new embedding calls + $.
       It makes 0 calls and 0 writes. **Drift guard:** if more than 10 pages whose markdown did NOT change gain a new automatic reason, stop and
       investigate (that is checker drift, not content), and report it before any write.
       The proven in-table false positives come from `out/r2_fixcheck.json` → `in_table` (plan 04), never from a hand-typed list.
    5. Tests for the merge function: a fidelity_review/structure_check reason survives; `diagram_in_table` is dropped only on a proven false positive;
       visual_no_block is applied only when k ≥ 1 and the page is unflagged; an unchanged page's chunks are all cache hits (0 new embedding calls).
    AVOID: recomputing flags from scratch, because check_page cannot see the human and structure-check flags and would silently clear them.
  </action>
  <verify>cd backend/ingestion && venv/bin/python -m unittest tests.test_v4_carry -v 2>&1 | tail -3 && venv/bin/python run_v4.py --dry-run 2>&1 | tail -15</verify>
  <done>Tests pass. The dry run shows 248 pages, needs_review(v4) ≥ needs_review(v3) minus the proven in-table false positives, and an embedding estimate ≤ 250.</done>
</task>

<task type="auto">
  <name>Store v4 (inactive), report, prove data safety, log</name>
  <files>
    backend/ingestion/run_v4.py
    backend/ingestion/out/r1_pilot_report_v4.json   (local, gitignored)
    log.md
  </files>
  <action>
    1. Run `run_v4.py` for real. Stop with nothing written if the embedding cap would be exceeded or any vector is not 768 dims.
    2. Run `pilot_report.py` for v4 against v3 (the same flags pilot_report uses for versions 2 and 3) → `out/r1_pilot_report_v4.json`.
    3. Re-run `r2_fixcheck.py` against v4 (add a `--version` arg if it lacks one): every evidence page must be clean.
    4. log.md entry "R2.06: v4 stored (inactive)": the before → after row counts (queried), needs_review v3 → v4 by reason, changed pages, the embedding
       call count and $, and Undo (nothing reads v4; identify it by `ingestion_version = 4`).
  </action>
  <verify>cd backend/ingestion && venv/bin/python check_schema.py | tail -1 && venv/bin/python r2_fixcheck.py --version 4; echo "fixcheck=$?" && venv/bin/python -c "
import sys;sys.path.insert(0,'.')
from pipeline import get_sb
sb=get_sb()
for v in (1,2,3,4):
  d=sb.table('ingest_documents').select('id').eq('source_file','The FMS Consulting CaseBook 2023-24 (1).pdf').eq('ingestion_version',v).execute().data[0]['id']
  p=sb.table('ingest_pages').select('id',count='exact').eq('document_id',d).execute().count
  c=sb.table('ingest_chunks').select('id',count='exact').eq('document_id',d).execute().count
  a=sb.table('ingest_chunks').select('id',count='exact').eq('document_id',d).eq('is_active',True).execute().count
  print(v,d[:8],p,c,'active',a)
print('document_chunks',sb.table('document_chunks').select('id',count='exact').limit(1).execute().count)"</verify>
  <done>check_schema PASS; fixcheck=0. v1 248/363, v2 248/395, v3 248/390 unchanged; v4 has 248 pages and 0 active chunks; document_chunks = 22457. The log entry is written.</done>
</task>

## Must-Haves
- [ ] v4 exists, all inactive, with every v3 flag carried (none silently dropped)
- [ ] Plan-04 fixes visible in v4 on every evidence page, including fallback_v1 pages
- [ ] No v1/v2/v3/document_chunks change; embeddings ≤ 250; 0 vision calls

## Success Criteria
- [ ] Verify passes; commit `feat(R2): v4 carry with free fixes (inactive)`; log entry

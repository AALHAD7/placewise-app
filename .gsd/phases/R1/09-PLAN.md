---
phase: R1
plan: 09
wave: 7
depends_on: ["07", "08"]
agent: ingestion-engineer
gap_closure: true
paid_calls: "≈ 77 vision calls (55 pages × 1.4), hard cap 140 (150 total for the R1 gaps minus ≤ 10 used by the plan 08 smoke test) ≈ $0.09, ceiling $0.16; ≤ 250 embedding calls, only for changed chunk texts (cached), ≈ $0.02"
---

# Plan R1.09: Patch the affected pages as ingestion_version 3 (insert-only, per-page v1 fallback)

## Objective
Re-convert **only** the pages the review and re-pilot found broken, with prompt r1-diagrams-v2. Carry every
other page over from v2 with the free plan-07 repairs (curly quotes, stripped links) applied. Fall back to the v1
markdown per page where the new output still captures fewer of the page's numbers or words than v1 did. Store the
result as a new document, `ingestion_version = 3`, `is_active = false`. **Insert-only**: no v1 or v2 row is
updated or deleted. v3 replaces v2 as the R1 candidate, and v2 stays as it is, for comparison.

## Context
Read first:
- `CLAUDE.md` (data safety, budget), `.claude/skills/casebook-ingestion/SKILL.md`, `.claude/skills/build-log/SKILL.md`
- `backend/ingestion/run_repilot.py`: reuse its helpers (`load_v1`, `sha256_file`, jsonl cache, `--resume`,
  `set_vision_cap`, embedding cache, cap and stop logic). Do not change its v2 behaviour.
- `backend/ingestion/pipeline.py`: `write_version(..., image_paths=, reused_from=)` (insert-only; the one update
  is the new doc's own status), `chunkable_pages`, `version_status`
- `backend/ingestion/pilot_report.py`, `diagram_preview.py`
- `backend/ingestion/out/r1_v2_rescore.json` (plan 07), `out/smoke_r1_v2.json` (plan 08)

Facts you need:
- All `<verify>` commands run from the repo root (`/Users/aalhad/Projects/Placement Website`).
- PDF: `Data/Consulting Files/PDF Files/The FMS Consulting CaseBook 2023-24 (1).pdf`. v1 doc
  `67371722-c752-473e-bf12-a3710707e56c` (248 pages, 363 chunks). v2 doc `e6cdd69b-75be-4050-b128-d34170adcb7d`
  (248 pages, 395 chunks, `prompt_version r1-diagrams-v1`). Both have `is_active = false`. Neither may be modified.
- Page images: v3 rows use v1's image paths (`pages/67371722-…/<n>.png`). Nothing is uploaded.
- **Fixed page set (55 pages, computed by the planner from the local caches):**
  - review failures: 11, 13, 14, 19, 52
  - sector pages: 58–79 (all 22; 12 of them have a block inside a table: 58, 59, 60, 63, 65, 67, 69, 72, 73, 74, 77, 79)
  - visual pages with no block: 1, 8, 12, 30, 31, 43, 53, 75, 80, 81, 84
  - v2 number coverage below v1 (24 pages): 41, 56, 58, 65, 71, 74, 77, 79, 86, 93, 101, 103, 127, 129, 136, 137,
    152, 175, 185, 198, 203, 227, 229, 236
  Plus (optional, at lowest priority) the pages newly flagged in `r1_v2_rescore.json` for `diagram_in_table`,
  `diagram_structure` or `diagram_label_altered` that are not already in the set, and pages in its
  `coverage_below_v1` (word coverage) list, but only while the projected calls stay within the cap.
- Priority when trimming to fit the cap: review failures → diagram_in_table → no-block → coverage below v1 (numbers)
  → diagram_structure → label_altered → word coverage below v1. Print any trimmed pages. They stay as carried v2 and keep their flags.
- Cost: ≈ $0.0011 per vision call; embeddings ≈ 600 tokens at $0.15/M.

## Tasks

<task type="auto">
  <name>run_patch.py: page selection, per-page fallback, dry run (free)</name>
  <files>
    backend/ingestion/run_patch.py
    backend/ingestion/tests/test_patch_select.py
  </files>
  <action>
    Args: `--base-version 2 --version 3 --cap 140 --rescore out/r1_v2_rescore.json --dry-run --resume --accept-failed`.
    1. Load v1 pages and the v2 pages from the DB (id, page_no, flags, text_layer, markdown, docling_markdown, method,
       prompt_version, reused_from_page_id). Check that the sha256 matches the v1 doc. If `(source_file, 3)` exists:
       when `done`, print "already done" and exit 0; otherwise abort (no deletes).
    2. A pure `select_patch_pages(fixed, rescore, cap, est_per_page=1.4) -> (selected, trimmed)` with the priority above.
    3. A pure `choose_page(v1, v2_post, v3)` that returns `(page_dict, method, reused_from_page_id)`:
       - re-converted page: take v3 unless its number_coverage or word_coverage is lower than v1's by > 0.01 AND
         v2_post is not better. Then take whichever of v2_post / v1 has the higher (number_coverage, word_coverage).
         If v1 is chosen: method `fallback_v1`, `reused_from_page_id` = the v1 page id, and add review reason
         `fallback_v1`; on a visual page also set `needs_review = true`, because its diagram blocks are lost.
       - carried page: v2 markdown with `collapse_multiline_labels_with_lines` + `restore_quotes` +
         `strip_invented_links`, re-checked with `check_page`, method `carried_v2`, `reused_from_page_id` = the v2 page id.
       Each page keeps its own `prompt_version` (v2 or v3 value; null for v1 text).
    4. `--dry-run` prints the selected pages by priority group, the trimmed pages, the estimated vision calls and
       embedding calls (count of chunk texts not in `out/r1_embeddings_v2.json`, found by actually chunking the
       carried + v2 text), and the cost. It makes 0 Gemini calls and 0 DB writes. Exit 1 if the estimate is over the cap.
    5. Tests: priority order and trimming at a small cap; choose_page picks v3 normally, v2_post when v3 is worse,
       `fallback_v1` with needs_review on a visual page; carried pages get the reused_from = v2 id; a fake-client
       test of the whole write path asserts only inserts + 1 status update on the new doc's id, 0 deletes, every chunk
       `is_active=False`, `ingestion_version=3`.
  </action>
  <verify>
    cd backend/ingestion && venv/bin/python -m unittest discover -s tests && venv/bin/python check_schema.py && venv/bin/python run_patch.py --base-version 2 --version 3 --cap 140 --dry-run
  </verify>
  <done>
    Tests are green, check_schema passes, and the dry run prints ≥ 55 selected pages (or the trimmed list), an estimated
    ≤ 140 vision calls, ≤ 250 embeddings and ≤ $0.20 total, with 0 calls and 0 writes.
  </done>
</task>

<task type="auto">
  <name>Run the patch (paid) and write v3</name>
  <files>
    backend/ingestion/out/r1_pages_v3.jsonl   (local, gitignored)
    backend/ingestion/out/r1_embeddings_v3.json   (local, gitignored)
    backend/ingestion/patch_output.json   (gitignored)
  </files>
  <action>
    1. Read the vision calls the plan 08 smoke test used (`out/smoke_r1_v2.json`). Set `--cap` = 150 − that number
       (never above 140).
    2. Run `venv/bin/python run_patch.py --base-version 2 --version 3 --cap <cap>`. Each page is appended to the jsonl
       as soon as it is done. On a quota stop, re-run later with `--resume`. Never raise the cap.
    3. Chunk all 248 pages. Embed only the texts missing from the v2 embedding cache (seed the v3 cache from it).
       Every vector must have 768 dims.
    4. Only after all pages and embeddings have succeeded: `write_version(version=3, prompt_version="r1-diagrams-v2",
       notes="R1 gap fix: N re-converted, M carried from v2, K fallback_v1", reuse_file_id=<v1 id>,
       reused_from=<per page>)`.
    5. Save `patch_output.json`: call_log, final vision/embedding calls, and per page `{page_no, method, chosen_from}`.
  </action>
  <verify>
    cd backend/ingestion && venv/bin/python check_schema.py && venv/bin/python -c "
from pipeline import get_sb
sb=get_sb();S='The FMS Consulting CaseBook 2023-24 (1).pdf'
for v in (1,2,3):
  d=sb.table('ingest_documents').select('id,status').eq('source_file',S).eq('ingestion_version',v).execute().data[0]
  p=sb.table('ingest_pages').select('id',count='exact').eq('document_id',d['id']).execute().count
  c=sb.table('ingest_chunks').select('id',count='exact').eq('document_id',d['id']).execute().count
  print(v,d['status'],p,c)
print('active',sb.table('ingest_chunks').select('id',count='exact').eq('is_active',True).execute().count)
print('document_chunks',sb.table('document_chunks').select('id',count='exact').execute().count)"
  </verify>
  <done>
    Printed: v1 done 248 363; v2 done 248 395; v3 done 248 &lt;n&gt;; active 0; document_chunks 22457. Vision calls
    ≤ cap (from patch_output.json). The v1 and v2 counts are unchanged.
  </done>
</task>

<task type="auto">
  <name>v3 report, review candidates and log</name>
  <files>
    backend/ingestion/pilot_report.py
    backend/ingestion/out/r1_pilot_report_v3.json   (local, gitignored)
    backend/ingestion/out/r1_candidates_v3.html   (local, gitignored)
    log.md
  </files>
  <action>
    1. pilot_report.py: add `--out` and count the new reasons (`diagram_label_altered`, `diagram_in_table`,
       `diagram_structure`, `fallback_v1`), the method counts (`gemini_vision_v2`/`carried_v2`/`fallback_v1`), and
       "pages with coverage below v1". Candidates: only blocks that are valid, have label coverage 1.0, no
       `label_altered` issue and `needs_review = false`. Up to 5 issue_tree (listing p11/p13/p14 separately as `recheck`,
       whatever their state), 3 chart, 3 flow, 1 matrix (p20).
    2. Run `pilot_report.py --source-file "<pdf>" --version 3 --compare 1 --out out/r1_pilot_report_v3.json`, then
       `diagram_preview.py --source db --version 3` for the candidates and rechecks → `out/r1_candidates_v3.html`.
    3. Write the log.md entry "R1.09: affected pages re-converted as ingestion_version 3 (inactive)". Include a
       v1/v2/v3 table (needs_review, reasons, number/word coverage mean/min, blocks by type, in-table blocks, visual
       pages with 0 blocks), the plan 07 rescore summary, the pages trimmed (if any), the fallback_v1 pages, the
       row counts before → after, the calls and cost (vision, smoke + patch, ≤ 150; embeddings), and Undo: nothing
       reads v3; it is identifiable by `ingestion_version = 3`.
  </action>
  <verify>
    cd backend/ingestion && venv/bin/python -c "import json;r=json.load(open('out/r1_pilot_report_v3.json'));print(r['v3']['needs_review'],r['v3']['review_reasons']);print(r['diagrams']['by_type'],r['diagrams']['visual_pages_zero_blocks'][:15]);print({k:[c['page_no'] for c in v] for k,v in r['candidates'].items()})" && test -s out/r1_candidates_v3.html && grep -n "R1.09" ../../log.md
  </verify>
  <done>
    No v3 page has `diagram_in_table`. The visual pages with 0 blocks no longer include the pages listed in Facts, unless
    each one is noted in the log as a true no-diagram page. There are ≥ 2 fresh issue_tree candidates. The log entry exists with the cost.
  </done>
</task>

## Must-Haves
- [ ] Only affected pages were re-converted. Total R1 gap vision calls ≤ 150 (≈ $0.20 max)
- [ ] v1 and v2 rows are unchanged; v3 is insert-only and inactive
- [ ] Per-page v1 fallback was applied and listed

## Success Criteria
- [ ] Tests green; row-count proof; report and log written

---
phase: R1
plan: 05
wave: 3
depends_on: ["01", "02", "03", "04"]
agent: ingestion-engineer
gap_closure: false
paid_calls: "~300 vision (cap 350) + ~370 embedding calls; about $0.40 at flash-lite rates (ceiling $1)"
---

# Plan R1.05: Re-pilot the FMS Consulting casebook 2023-24 as ingestion_version 2

## Objective
Re-convert the FMS casebook with prompt v2 and store the result **alongside** the v1 pilot, as
`ingestion_version = 2` with `is_active = false`. Reuse everything v1 already paid for that
doesn't need redoing: classification, text layers, Docling output, page images in storage, and the
uploaded PDF. Then produce the pilot report R1's done-criterion asks for: coverage stats,
`needs_review` count, diagram counts by type, and Gemini calls and cost.

## Context
Read first:
- `CLAUDE.md` (data safety, budget), `.claude/skills/casebook-ingestion/SKILL.md` ("Proof of done"),
  `.claude/skills/build-log/SKILL.md`
- `backend/ingestion/pipeline.py` (`ingest_one_pdf`: today it hard-codes version 1 and re-uploads the PDF and every PNG)
- `backend/ingestion/run_pilot.py`, `convert.py` (`convert_page_vision`, plan 03),
  `chunk.py` (`chunk_document`, `embedding_text`, plan 04), `fidelity.py` (plan 01),
  `check_schema.py` (plan 02)

Facts you need:
- All `<verify>` commands run from the repo root (`/Users/aalhad/Projects/Placement Website`).
- v1 cache: `backend/ingestion/pilot_output.json` → `results[0]`: `file_id`
  `67371722-c752-473e-bf12-a3710707e56c`, and `pages_full[]` (248 entries) with `page_no, is_text,
  is_table, is_visual, is_scanned, text_layer, markdown, docling_markdown, method, ...`.
  v1: 184 visual, 60 table, 4 text, 0 scanned. All 248 ended as `docling+gemini` (184 visual + 64
  Docling-fidelity retries). 57 were needs_review. 363 chunks. 248 vision + 363 embedding calls.
- v1 storage paths: PDF `pdfs/67371722-....pdf`, pages `pages/67371722-.../<n>.png` in the private
  `casebook-source` bucket. v2 page rows point at the **same** image paths: same PDF, same render, no re-upload.
- Migration 040 (plan 02) must be applied: `venv/bin/python check_schema.py` exits 0.
- Page selection rule (from analysis of the v1 output): re-convert a page if `is_visual`, OR its v1 markdown
  has ≥ 2 indented bullet lines (`^\s{2,}[-*]\s`), OR it matches
  `matrix|2x2|axis|chart|funnel|→|->|framework|BCG|Ansoff|Porter|issue tree` (case-insensitive).
  On FMS this selects **235** pages and reuses **13**. Reused pages keep their v1 markdown but are
  re-checked with the new `check_page` (free).

## Tasks

<task type="auto">
  <name>Versioned writer + cache-aware run_repilot.py with dry run</name>
  <files>
    backend/ingestion/pipeline.py
    backend/ingestion/run_repilot.py
    backend/ingestion/tests/test_repilot_select.py
    backend/ingestion/tests/test_pipeline_write.py
  </files>
  <action>
    pipeline.py:
    - Add `write_version(meta, source_file, sha256, page_count, pages, chunks, version, prompt_version,
      notes, reuse_file_id=None)`. It inserts the `ingest_documents` row (status `pending`, the given
      `ingestion_version`, prompt_version, notes) → `ingest_pages` in batches of 50 (including the new
      columns `diagrams, diagram_count, diagram_issues, diagram_label_coverage, review_reasons,
      prompt_version, reused_from_page_id`; `image_path` = v1's path when reuse_file_id is given) →
      `ingest_chunks` in batches of 20 (`ingestion_version=version, is_active=False, has_diagram`) →
      sets status `done`.
    - Refactor `ingest_one_pdf` to accept `version=1` and call `write_version`. Its behaviour for
      new PDFs stays the same (it still uploads). Before converting, it skips if
      `(source_file, version)` already has status `done`.
    - Never issue `delete` or `update` against rows of another version. The only update is the new
      doc's own status.

    run_repilot.py (args: `--version 2 --cap 350 --dry-run --resume`):
    1. Load the v1 per-page cache **from the DB** (`ingest_pages` for the v1 doc: id, page_no, flags,
       text_layer, markdown, docling_markdown, image_path), the source of truth. Fall back to
       pilot_output.json only if the DB read fails, and say so in the output. Compute the PDF's sha256 and compare it with v1's
       `ingest_documents.sha256` (fetch by source_file + ingestion_version=1). Abort on mismatch.
    2. If a `(source_file, 2)` row exists with status `done` → print "already done" and exit 0. If it
       exists with status `pending` → abort with a clear message (no deletes). Fix it by hand or
       use `--version 3`.
    3. (v1 page ids and image paths come from step 1.)
    4. Selection as above, implemented as a pure function `select_pages(pages) -> (selected, reused)`. `--dry-run` prints: selected count, reused count, the selected page list,
       estimated vision calls (selected × 1.25), estimated embeddings (≈ v1 chunk count), and the
       estimated cost. Use these figures: ~3k input tokens + ~2k output tokens per vision call at
       flash-lite $0.10/M in, $0.40/M out; embeddings ~600 tokens at $0.15/M. Exit without calls.
    5. Live: per selected page, render the PNG (pypdfium2, 150 dpi) → `convert_page_vision(...)`.
       Append each page result to `out/r1_pages_v2.jsonl` immediately. `--resume` skips page_nos
       already in the jsonl, so a crash or a day's quota never costs a page twice.
       Stop cleanly (exit 2, nothing written to the DB) if `call_count["vision"] >= cap`, or if a
       vision call raises (quota or network). Print the resume command.
    6. Reused pages: markdown/docling_markdown from the cache, `check_page(..., page_no)`, method
       `reused_v1`, `reused_from_page_id` = the v1 page id.
    7. Chunk all 248 pages in order (`chunk_document`). For each chunk, embed `embedding_text(content)`
       and cache it to `out/r1_embeddings_v2.json` (resumable). Check that every vector has length 768.
    8. Only after every page and embedding has succeeded: `write_version(..., version=2,
       prompt_version=PROMPT_VERSION, notes="R1 re-pilot; N reused from v1", reuse_file_id=v1 id)`.
    9. Save `repilot_output.json` (gitignored), shaped like pilot_output.json, plus `call_log`,
       `final_vision_calls`, `final_embedding_calls`.

    Tests (offline):
    - test_repilot_select: is_visual page → selected; a text page with 2 indented bullets → selected;
      a text page with "Ansoff" → selected; a plain prose page → reused.
    - test_pipeline_write: call `write_version` with a fake supabase client that records every call.
      Assert there are only `insert` calls, plus exactly one `update` filtered on the new doc's own id.
      Assert no `delete`, and that every chunk row has `is_active=False` and `ingestion_version=2`.
      This guards the data-safety rule against regressions.
  </action>
  <verify>
    cd backend/ingestion && venv/bin/python -m unittest discover -s tests -v && venv/bin/python check_schema.py && venv/bin/python run_repilot.py --version 2 --dry-run
  </verify>
  <done>
    The dry run prints 235 selected / 13 reused (± a few if the regex changed), ~294 estimated vision
    calls, ~363 embeddings, and an estimated cost under $1. It makes zero Gemini calls and zero DB writes.
    The unit test suite is still green.
  </done>
</task>

<task type="auto">
  <name>Run the re-pilot (paid) and produce the pilot report</name>
  <files>
    backend/ingestion/pilot_report.py
  </files>
  <action>
    1. Run `venv/bin/python run_repilot.py --version 2 --cap 350`. If it stops on quota, re-run with
       `--resume` later. Never raise the cap without logging why.
    2. Write pilot_report.py (`--source-file <pdf name> --version 2 --compare 1`). It reads only from
       the DB, refuses to report on a doc whose status is not `done` (exit 1, with a message), and writes `out/r1_pilot_report.json`, plus a Markdown table on stdout with:
       - pages by type (text/table/visual/scanned), method counts (gemini_vision_v2 / reused_v1),
         and pages that needed a retry
       - mean/min number_coverage and word_coverage (v2 vs v1 side by side)
       - **needs_review count** (v2 vs v1), with a breakdown by review_reasons
       - diagram blocks: total, by type, pages with ≥1 block, invalid blocks, mean diagram_label_coverage,
         and visual pages with 0 blocks (a list of page numbers, for R2)
       - chunks: count, has_diagram count, and the embedding dim of a sample row (must be 768)
       - Gemini calls: vision and embedding (from repilot_output.json), est. cost
       - **v1 integrity**: v1 doc present, 248 pages, 363 chunks, and the count of `is_active=true`
         in ingest_chunks (must be 0)
       - **sample candidates**: for each of issue_tree, matrix, chart, flow, up to 3 v2 pages whose
         block is valid with label coverage 1.0, preferring p20 (matrix) and p52 (flow) if they qualify
    3. Run `diagram_preview.py --source db --version 2` for the candidate pages, producing
       `out/r1_candidates.html`, for plan 06.
  </action>
  <verify>
    cd backend/ingestion && venv/bin/python pilot_report.py --source-file "The FMS Consulting CaseBook 2023-24 (1).pdf" --version 2 --compare 1
    venv/bin/python check_schema.py   (v1 counts still 248/363/0)
  </verify>
  <done>
    The v2 document row has status `done`, 248 v2 pages and N v2 chunks (all `is_active=false`). The report
    prints every section above. The v1 counts are unchanged. Vision calls ≤ 350. At least one
    candidate exists for issue_tree, for matrix, and for chart-or-flow. If a type has no candidate, say so
    explicitly. That is a finding for R2, not something to paper over.
  </done>
</task>

<task type="auto">
  <name>log.md entry + plain-language summary</name>
  <files>
    log.md
  </files>
  <action>
    Follow `.claude/skills/build-log/SKILL.md`. One entry, "R1 re-pilot (ingestion_version 2)",
    covering:
    - migration 040 applied (paste the check_schema output)
    - the prompt change (v1 nested bullets → v2 placewise-diagram blocks)
    - smoke-test results from plan 03 (read `out/smoke_r1.json`)
    - the report table (coverage, needs_review v1 → v2, diagrams by type)
    - Gemini calls and cost
    - the v1 integrity proof
    - Undo: v2 rows are inert (`is_active=false`) and identifiable by `ingestion_version=2`; the migration
      rollback is in the file
    - Open issues: visual pages with 0 blocks, `other` blocks, and pages failing label checks (for R2)
    Then give Aalhad a 5–8 line plain-language summary in the hand-back.
  </action>
  <verify>
    cd "/Users/aalhad/Projects/Placement Website" && grep -n "ingestion_version 2" log.md | head -3
  </verify>
  <done>The log entry exists, with real numbers copied from the report output (no estimates where actuals exist).</done>
</task>

## Must-Haves
- [ ] v2 rows exist alongside v1. Nothing in v1 or document_chunks was changed or deleted
- [ ] Pilot report with coverage stats and needs_review count (R1 done-criterion, part 1)
- [ ] Gemini calls and cost recorded; vision calls ≤ 350

## Success Criteria
- [ ] check_schema.py still reports v1 248/363/0
- [ ] r1_pilot_report.json + r1_candidates.html exist under out/

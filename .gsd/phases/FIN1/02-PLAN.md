---
phase: FIN1
plan: 02
wave: 2
depends_on: ["01", "03"]
files_modified:
  - backend/scripts/ingestFinanceCompendium.js
  - backend/ingestion/out/fin1_ingest_report.json
autonomous: true
user_setup: []

must_haves:
  truths:
    - "finance_compendium.md is ingested into ingest_documents (one row, source_class='placewise_reference', domain='Finance') and ingest_chunks (one row per topic/part, is_active=false)"
    - "No existing row in ingest_documents/ingest_chunks/document_chunks is deleted, overwritten, or flipped to is_active=true by this run (data-safety rule)"
    - "Every chunk's embedding is 768-dim gemini-embedding-001, matching the rest of the project"
    - "The actual Gemini call count and rough cost are logged, not estimated after the fact"
  artifacts:
    - "backend/scripts/ingestFinanceCompendium.js exists, is idempotent (aborts with no writes if the source_file already has a row, same ABORT posture as run_v4.py/run_patch.py)"
    - "backend/ingestion/out/fin1_ingest_report.json exists with row counts, diagram-authored count, diagram-faithful count, call counts"
---

# Plan FIN1.02: Run the Finance compendium ingestion

<objective>
Wire FIN1.01's parser and diagram-author modules into a runnable script that embeds every
chunk and writes `ingest_documents`/`ingest_chunks` rows for `finance_compendium.md`, then
run it for real. This is the one plan in FIN1 that spends real Gemini budget. Everything
written stays `is_active = false` — nothing here is reachable by any student-facing code
path until a future, separate switch-over decision (not part of FIN1).

Purpose: get the 208 Finance topics (now chunk-ready objects with metadata and, for a
conservative minority, a verified diagram) into the exact tables and shape
(`ingest_documents`/`ingest_chunks`) the rest of the retrieval stack already reads, so
FIN1.04's Q&A wiring has real rows to query against (even if only via the local,
`is_active`-bypassing preview pattern FIN1.05 uses, not the live RPC, until switch-over).
Output: populated `ingest_documents`/`ingest_chunks` rows (inactive); a cost/count report.
</objective>

<context>
Load for context:
- `backend/src/lib/financeCompendiumParser.js`, `backend/src/lib/financeDiagramAuthor.js`
  (built in FIN1.01 — read their exported function signatures, don't re-derive them)
- `backend/db/migration_049_finance_source_class.sql` (FIN1.03 — read the final column/RPC
  shape this script writes against, especially the new `ingest_chunks.metadata` column)
- `backend/ingestion/run_patch.py` / `run_v4.py` — read their ABORT-on-pre-existing-row and
  dimension-check patterns (lines ~250-290 of `run_patch.py`) to mirror the same safety
  posture in JS, even though this script is otherwise unrelated to those (PDF-pipeline-only)
  scripts
- `backend/src/lib/gemini.js` — `embedTexts` (task type `RETRIEVAL_DOCUMENT`), `generateJSON`
  (already used inside `financeDiagramAuthor.js`)
- `backend/src/lib/supabase.js` — the service-role client (same one every other
  `backend/scripts/*.js` uses)
</context>

<tasks>

<task type="auto">
  <name>Build the ingestion run script</name>
  <files>
    backend/scripts/ingestFinanceCompendium.js
  </files>
  <action>
    Steps:
    1. Read `Data Extracted from Claude Cowork/Data/Finance Files/finance_compendium.md`,
       compute its sha256 (same field `ingest_documents.sha256` already uses for every other
       document — `node:crypto` `createHash("sha256")`).
    2. Query `ingest_documents` for an existing row with
       `source_file = 'finance_compendium.md'`. If one exists, print
       `ABORT: finance_compendium.md already has an ingest_documents row (id=<id>, status=<status>)`
       and exit 1 without writing anything — same no-deletes, no-silent-overwrite posture as
       every Python run_*.py script's ABORT checks. Support a `--resume` flag only if a prior
       run left a `pending` row with zero chunks (crashed mid-run); otherwise this script
       always does a full, one-shot run (no versioning complexity needed — this is a first
       ingestion, not a re-ingestion like R4/R5/R6).
    3. `parseCompendium(markdownText)` → records (FIN1.01).
    4. For each record, call `authorAndVerifyDiagram(record.content)` (FIN1.01). If it
       returns a diagram, append the `placewise-diagram` fenced block + summary to the
       record's content in the same shape the diagram-transcription skill specifies (fenced
       block, then 1-3 sentence summary right after) — this is the ONLY place in the pipeline
       a diagram block gets attached, so it must exactly match the format `has_diagram`
       detection and the frontend renderer already expect (check `backend/ingestion/chunk.py`'s
       `has_diagram(content)` for the exact detection regex and mirror it, don't diverge).
    5. Call `embedTexts(records.map(r => r.content), "RETRIEVAL_DOCUMENT")` — batch call,
       same function every other ingestion path uses. If any returned vector isn't 768-dim,
       abort with no writes (mirror `run_v4.py`'s `ABORT: embedding with {len(vec)} dims`
       check exactly — this has bitten the project before, per that script's comment).
    6. Insert one `ingest_documents` row: `source_file: 'finance_compendium.md'`,
       `school: null`, `club: null`, `year: '2026'`, `source_class: 'placewise_reference'`,
       `domain: 'Finance'`, `page_count: <total line count of the source file>` (there are no
       PDF pages; reuse the column honestly as "source file length" with a comment, same
       repurposing call as FIN1.01's page_start/page_end), `sha256`, `status: 'done'`.
    7. Insert one `ingest_chunks` row per record: `page_start`/`page_end` = the record's
       `lineStart`/`lineEnd` (FIN1.01's repurposing), `section_title: record.title`,
       `content` (with diagram block appended if any), `content_type: 'concept'`,
       `embedding`, `has_diagram: !!record.diagram`, `metadata: record.metadata` (jsonb),
       `parent_item_id` set for split parts exactly as `chunk_document` does in
       `backend/ingestion/chunk.py`, `is_active: false` (default — don't even pass it,
       so a future column-default change can't accidentally get overridden here).
    8. Write `backend/ingestion/out/fin1_ingest_report.json`:
       `{ documentId, totalRecords, chunksWritten, diagramsAuthored, diagramsFaithful,
       diagramsDropped, geminiCalls: { embedding, diagramProposal, diagramJudge },
       startedAt, finishedAt }`.
    AVOID writing partial rows on a mid-run failure — batch the `ingest_chunks` insert as one
    multi-row insert (or wrap in a way that a failure after documents-insert-but-before-
    chunks-insert is detectable on the next run via the `--resume` check in step 2), because
    a document row with zero chunks is a worse state to discover later than a clean abort.
  </action>
  <verify>
    cd backend && node scripts/ingestFinanceCompendium.js --dry-run
  </verify>
  <done>
    `--dry-run` parses the real file, runs the diagram-author gate on all 208(+split) records,
    prints the would-be row counts and the would-be Gemini call count, and makes zero Supabase
    writes and zero embedding calls (only the cheap-tier diagram-proposal calls, which this
    plan's cost estimate already counts) — confirms the live run's shape before spending the
    embedding budget.
  </done>
</task>

<task type="auto">
  <name>Run the ingestion for real and record the cost</name>
  <files>
    backend/ingestion/out/fin1_ingest_report.json
  </files>
  <action>
    Run `node backend/scripts/ingestFinanceCompendium.js` for real (no `--dry-run`). This
    makes real Gemini calls: ~208-224 embedding calls (accounting for the ~16 split parts)
    plus one diagram-proposal call per record plus up to 3 faithfulness-judge calls for each
    record where a diagram was proposed (expected: a minority of the 208 — see this phase's
    cost note in the handback report). All generation calls use the existing flash-lite
    cascade (`GENERATION_MODELS.slice(0, MAX_CASCADE_TIER)` in `gemini.js` — no code change
    needed, this is already the default for every `generateJSON`/`generateText` call with no
    `allowEscalation`). After it finishes, read back
    `backend/ingestion/out/fin1_ingest_report.json` and report the real counts (don't
    estimate after the fact — use what the script actually logged).
  </action>
  <verify>
    cat backend/ingestion/out/fin1_ingest_report.json
    # Then, in the SQL editor or via a one-off query:
    #   select count(*) from ingest_documents where source_file = 'finance_compendium.md';
    #   select count(*), count(*) filter (where has_diagram) from ingest_chunks c
    #     join ingest_documents d on d.id = c.document_id where d.source_file = 'finance_compendium.md';
    # expect: 1 document row; chunk count ~= 208 + split parts; is_active = false on every row
  </verify>
  <done>
    `fin1_ingest_report.json`'s `chunksWritten` matches the real `ingest_chunks` row count for
    this document; every written chunk has `is_active = false`; `diagramsFaithful <=
    diagramsAuthored` (sanity — some proposed diagrams are expected to fail the judge and be
    dropped, that's the gate working as designed, not a bug); a `log.md` entry is written per
    the `build-log` skill (ingestion type, real call count, rough cost against the $20/month
    budget, "Undo: delete nothing — set is_active stays false; to fully undo, delete the
    `finance_compendium.md` row from `ingest_documents` (cascades to `ingest_chunks`)").
  </done>
</task>

</tasks>

<verification>
After all tasks:
- [ ] `ingest_documents` has exactly one `finance_compendium.md` row, `source_class =
      'placewise_reference'`, `domain = 'Finance'`, `status = 'done'`
- [ ] `ingest_chunks` has one row per topic (plus split parts), all `is_active = false`
- [ ] No existing row anywhere was deleted or overwritten
- [ ] `log.md` has an entry with the real Gemini call count and cost
</verification>

<success_criteria>
- [ ] Both tasks verified passing
- [ ] Must-haves confirmed
- [ ] `backend/ingestion/out/fin1_ingest_report.json` committed or at least referenced from
      the `log.md` entry so the numbers aren't lost
</success_criteria>

---
phase: R1
plan: 02
wave: 1
depends_on: []
agent: ingestion-engineer
gap_closure: false
paid_calls: 0
---

# Plan R1.02: Migration 040 — versioned re-ingestion and diagram columns

## Objective
Let a second ingestion of the same PDF live **alongside** the v1 pilot instead of colliding
with it, and give `ingest_pages` / `ingest_chunks` somewhere to store diagram blocks and their
validation results. Today `ingest_documents.source_file` is `UNIQUE` (migration 039), so a v2 insert
for "The FMS Consulting CaseBook 2023-24 (1).pdf" would fail. Deleting the v1 rows is forbidden
(data-safety rule), so uniqueness moves to `(source_file, ingestion_version)`. This plan also
keeps casebook-derived artefacts out of git.

## Context
Read first:
- `CLAUDE.md` (data-safety rule: never delete or overwrite chunks or tables)
- `.claude/skills/backend-conventions/SKILL.md` (migration conventions)
- `.claude/skills/casebook-ingestion/SKILL.md` ("Re-runs bump `ingestion_version`")
- `backend/db/migration_039_ingestion_v2.sql`

Facts you need:
- All `<verify>` commands run from the repo root (`/Users/aalhad/Projects/Placement Website`).
- Migrations in this project are **applied by Aalhad by hand in the Supabase SQL editor**. There is
  no DATABASE_URL in `backend/.env`, only `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (PostgREST),
  so agents cannot run DDL.
- v1 pilot rows: one `ingest_documents` row with id `67371722-c752-473e-bf12-a3710707e56c`,
  248 `ingest_pages`, 363 `ingest_chunks`, all with `ingestion_version = 1`, `is_active = false`.
- `backend/ingestion/` is currently **untracked** in git, as are its `venv/`, `__pycache__/`,
  `pilot_output.json` (2.4 MB, contains casebook text) and `old_chunks_fms.json`.

## Tasks

<task type="auto">
  <name>Write migration_040 (additive, idempotent) and the schema check script</name>
  <files>
    backend/db/migration_040_ingest_versioning_diagrams.sql
    backend/ingestion/check_schema.py
  </files>
  <action>
    Migration (every statement idempotent, no DROP TABLE, no DELETE, no UPDATE of existing rows):
    ```sql
    alter table ingest_documents drop constraint if exists ingest_documents_source_file_key;
    alter table ingest_documents add constraint ingest_documents_source_file_version_key
      unique (source_file, ingestion_version);           -- guard with a DO block / IF NOT EXISTS on pg_constraint
    alter table ingest_documents add column if not exists prompt_version text;
    alter table ingest_documents add column if not exists notes text;

    alter table ingest_pages add column if not exists diagrams jsonb not null default '[]'::jsonb;
    alter table ingest_pages add column if not exists diagram_count integer not null default 0;
    alter table ingest_pages add column if not exists diagram_issues jsonb not null default '[]'::jsonb;
    alter table ingest_pages add column if not exists diagram_label_coverage numeric;
    alter table ingest_pages add column if not exists review_reasons text[] not null default '{}';
    alter table ingest_pages add column if not exists prompt_version text;
    alter table ingest_pages add column if not exists reused_from_page_id uuid references ingest_pages(id);

    alter table ingest_chunks add column if not exists has_diagram boolean not null default false;
    create index if not exists ingest_pages_diagram_count_idx on ingest_pages(diagram_count);
    ```
    - Header comment: why the constraint changes, and that v1 rows are untouched (defaults fill
      new columns). Add a commented ROLLBACK section (drop the new constraint and re-add
      `unique(source_file)`, which only works while one version per file exists; columns can stay).
    - End with verification SELECTs Aalhad can read in the editor output:
      `select conname from pg_constraint where conrelid = 'ingest_documents'::regclass;` and
      `select ingestion_version, count(*) from ingest_documents group by 1;`
    - RLS: no new tables, so existing RLS still applies. Add no policies.

    check_schema.py (uses the venv's supabase client + config.py):
    - `select("diagrams, diagram_count, diagram_issues, diagram_label_coverage, review_reasons,
      prompt_version, reused_from_page_id").limit(1)` on ingest_pages, `has_diagram` on
      ingest_chunks, and `prompt_version, notes` on ingest_documents. Print OK/MISSING per column.
    - Print v1 integrity counts: ingest_documents rows, ingest_pages for the v1 doc id (expect 248),
      ingest_chunks with ingestion_version=1 (expect 363), ingest_chunks with is_active=true
      (expect 0). Use `count="exact"`.
    - Exit code 0 only if every column exists and the integrity counts match.
  </action>
  <verify>
    grep -Eic "drop table|delete from|truncate|update " backend/db/migration_040_ingest_versioning_diagrams.sql   (expect 0)
    cd backend/ingestion && venv/bin/python check_schema.py   (BEFORE apply: expect MISSING columns, integrity counts 248/363/0, exit 1)
  </verify>
  <done>
    The migration file exists, is additive only, and has a rollback note and verification SELECTs.
    check_schema.py runs and reports the pre-migration state correctly (columns MISSING,
    v1 counts 248 / 363 / 0).
  </done>
</task>

<task type="auto">
  <name>Keep ingestion artefacts with casebook content out of git</name>
  <files>
    .gitignore
  </files>
  <action>
    Append:
    ```
    # Ingestion: local venv, caches and outputs containing casebook text/page images
    backend/ingestion/venv/
    backend/ingestion/**/__pycache__/
    backend/ingestion/*_output.json
    backend/ingestion/old_chunks_*.json
    backend/ingestion/out/
    ```
    Do not commit in this plan. The commit happens after R1 is verified (pipeline flow).
    AVOID: `git rm` or moving any file. These artefacts are inputs to plan 05 (pilot_output.json is
    the v1 cache).
  </action>
  <verify>
    cd "/Users/aalhad/Projects/Placement Website" && git status --porcelain backend/ingestion | grep -E "venv|__pycache__|_output.json|old_chunks" ; echo "exit=$?"   (expect exit=1, i.e. nothing listed)
    git check-ignore backend/ingestion/pilot_output.json   (expect the path printed)
  </verify>
  <done>git status shows only the .py source, requirements.txt and tests under backend/ingestion.</done>
</task>

<task type="checkpoint:human-action">
  <name>Aalhad applies migration 040 in the Supabase SQL editor</name>
  <action>
    Ask Aalhad to paste `backend/db/migration_040_ingest_versioning_diagrams.sql` into the
    Supabase SQL editor and run it. Then run check_schema.py.
    Expected editor output: constraint `ingest_documents_source_file_version_key` is listed and
    `ingest_documents_source_file_key` is not; version 1 → 1 row.
  </action>
  <verify>
    cd backend/ingestion && venv/bin/python check_schema.py   (expect all columns OK, 248/363/0, exit 0)
  </verify>
  <done>check_schema.py exits 0. Paste its output into the log entry written in plan 05.</done>
</task>

## Must-Haves
- [ ] The v1 pilot rows are untouched (counts identical before and after)
- [ ] A second version of the same source_file can be inserted
- [ ] Diagram blocks, issues, label coverage and review reasons have columns

## Success Criteria
- [ ] check_schema.py exit 0 after apply
- [ ] No casebook-content artefact shows in `git status`

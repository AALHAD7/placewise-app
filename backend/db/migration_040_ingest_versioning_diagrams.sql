-- Phase R1 (plan 02): versioned re-ingestion + diagram columns on the ingest_* tables.
--
-- Why the constraint changes:
--   migration_039 made ingest_documents.source_file UNIQUE, so a second (v2) ingestion of
--   the same PDF (e.g. "The FMS Consulting CaseBook 2023-24 (1).pdf") cannot be inserted
--   while the v1 pilot row exists. Removing the v1 rows is forbidden by the data-safety
--   rule, so uniqueness moves to (source_file, ingestion_version): each re-run bumps
--   ingestion_version and lives alongside the earlier versions.
--
-- What this migration does NOT do:
--   It removes no rows and rewrites no existing values. The v1 pilot rows (1 document,
--   248 pages, 363 chunks, ingestion_version = 1, is_active = false) are left exactly as
--   they are; every new column has a default (or is nullable), so existing rows simply
--   pick up the default. No new tables, so the RLS set up in migration_039 still applies
--   and no policies are added.
--
-- Every statement is idempotent: running this file twice is safe.

-- 1. ingest_documents: unique per (source_file, ingestion_version) instead of source_file.
--    The new constraint is added before the old one is removed, so there is never a moment
--    without a uniqueness guard.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'ingest_documents'::regclass
      and conname = 'ingest_documents_source_file_version_key'
  ) then
    alter table ingest_documents
      add constraint ingest_documents_source_file_version_key
      unique (source_file, ingestion_version);
  end if;
end $$;

alter table ingest_documents drop constraint if exists ingest_documents_source_file_key;

alter table ingest_documents add column if not exists prompt_version text;
alter table ingest_documents add column if not exists notes text;

-- 2. ingest_pages: structured diagram blocks (diagram-transcription skill format) and
--    their validation results.
alter table ingest_pages add column if not exists diagrams jsonb not null default '[]'::jsonb;
alter table ingest_pages add column if not exists diagram_count integer not null default 0;
alter table ingest_pages add column if not exists diagram_issues jsonb not null default '[]'::jsonb;
alter table ingest_pages add column if not exists diagram_label_coverage numeric;
alter table ingest_pages add column if not exists review_reasons text[] not null default '{}';
alter table ingest_pages add column if not exists prompt_version text;
-- Set when a v2 page reuses a v1 page's conversion (cache hit) instead of a new Gemini call.
alter table ingest_pages add column if not exists reused_from_page_id uuid references ingest_pages(id);

create index if not exists ingest_pages_diagram_count_idx on ingest_pages(diagram_count);

-- 3. ingest_chunks: flag chunks that carry a diagram block.
alter table ingest_chunks add column if not exists has_diagram boolean not null default false;

-- ROLLBACK (manual, only if needed; the new columns can stay, they are harmless).
-- Re-add the old constraint FIRST, then drop the new one, so there is never a moment
-- without a uniqueness guard (same order as the forward migration):
--   alter table ingest_documents add constraint ingest_documents_source_file_key unique (source_file);
--   alter table ingest_documents drop constraint if exists ingest_documents_source_file_version_key;
-- Re-adding unique(source_file) only succeeds while each source_file has a single version;
-- if it fails, stop there (the new constraint is still in place).

-- Verification (read the output in the SQL editor):
--   expect ingest_documents_source_file_version_key listed, ingest_documents_source_file_key absent
select conname from pg_constraint where conrelid = 'ingest_documents'::regclass;
--   expect version 1 -> 1 row
select ingestion_version, count(*) from ingest_documents group by 1;

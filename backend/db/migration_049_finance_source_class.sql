-- FIN1 (plan 03): widen match_ingest_chunks to a second source_class, add chunk metadata.
--
-- Why:
--   match_ingest_chunks hardcodes d.source_class = 'club_casebook' (migration_042/044).
--   The Finance compendium (FIN1.02) will be ingested as source_class = 'placewise_reference'.
--   Add an optional array parameter so a caller can opt in to both source classes; every
--   existing caller, which never passes it, gets byte-identical behavior via coalesce to the
--   single-value array that reproduces today's hardcoded filter exactly.
--   ingest_chunks also gets a generic nullable-default jsonb metadata column so the
--   compendium's per-topic tags (domain/level/roles/keywords) have somewhere to live without
--   a further migration. Nothing reads this column yet.
--
-- What this migration does NOT do:
--   It deletes no rows, flips no is_active flag, and changes no existing
--   ingest_documents/ingest_chunks row's value. The 3-arg and 4-arg historical callers
--   (consultingRetrieval.js, frameworkCatalog.js, guesstimateRetrieval.js) are unaffected -
--   filter_source_classes defaults to null, which coalesces to array['club_casebook'], the
--   exact filter every row has always been evaluated against. FIN1.04 is the plan that
--   starts passing filter_source_classes to also read 'placewise_reference' rows.
--
-- Why DROP + CREATE instead of CREATE OR REPLACE: Postgres treats a new parameter as a
-- different function signature, so CREATE OR REPLACE would add a second overloaded
-- match_ingest_chunks(vector,int,text,text,text[]) alongside the existing 4-arg one rather
-- than replacing it - same quirk migration_043/044 hit.
--
-- Every statement is idempotent: running this file twice is safe.

alter table ingest_chunks add column if not exists metadata jsonb not null default '{}'::jsonb;

drop function if exists match_ingest_chunks(vector, integer, text, text);

create function match_ingest_chunks(
  query_embedding vector(768),
  match_count int default 6,
  filter_domain text default null,
  filter_source_file text default null,
  filter_source_classes text[] default null
)
returns table (
  id uuid,
  document_id uuid,
  page_start integer,
  page_end integer,
  content text,
  content_type text,
  has_diagram boolean,
  similarity float,
  school text,
  club text,
  year text,
  source_file text,
  ingestion_version integer
)
language sql stable
as $$
  select
    c.id,
    c.document_id,
    c.page_start,
    c.page_end,
    c.content,
    c.content_type,
    c.has_diagram,
    1 - (c.embedding <=> query_embedding) as similarity,
    d.school,
    d.club,
    d.year,
    d.source_file,
    c.ingestion_version
  from ingest_chunks c
  join ingest_documents d on d.id = c.document_id
  where c.is_active = true
    and d.source_class = any(coalesce(filter_source_classes, array['club_casebook']))
    and (filter_domain is null or d.domain = filter_domain)
    and (filter_source_file is null or d.source_file = filter_source_file)
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

revoke all on function match_ingest_chunks(vector, integer, text, text, text[]) from public, anon, authenticated;

-- Record, in the schema itself, that source_class = 'placewise_reference' documents (e.g.
-- the Finance compendium) repurpose page_start/page_end as 1-based source-markdown line
-- numbers rather than PDF page numbers, so a future reader of the schema directly (not the
-- ingestion code) isn't misled by the column name.
comment on column ingest_chunks.page_start is
  'PDF page number for source_class = ''club_casebook'' documents. For source_class = ''placewise_reference'' documents without real pages (e.g. the Finance compendium), this holds the 1-based start line number in the source markdown file instead - see backend/src/lib/financeCompendiumParser.js.';
comment on column ingest_chunks.page_end is
  'PDF page number for source_class = ''club_casebook'' documents. For source_class = ''placewise_reference'' documents without real pages (e.g. the Finance compendium), this holds the 1-based end line number in the source markdown file instead - see backend/src/lib/financeCompendiumParser.js.';

-- ROLLBACK (manual, only if needed; reverts to migration_044's 4-arg shape):
--   drop function if exists match_ingest_chunks(vector, integer, text, text, text[]);
--   create function match_ingest_chunks(
--     query_embedding vector(768), match_count int default 6, filter_domain text default null,
--     filter_source_file text default null
--   ) returns table (
--     id uuid, document_id uuid, page_start integer, page_end integer, content text,
--     content_type text, has_diagram boolean, similarity float, school text, club text,
--     year text, source_file text, ingestion_version integer
--   ) language sql stable as $$
--     select c.id, c.document_id, c.page_start, c.page_end, c.content, c.content_type,
--       c.has_diagram, 1 - (c.embedding <=> query_embedding) as similarity, d.school, d.club,
--       d.year, d.source_file, c.ingestion_version
--     from ingest_chunks c join ingest_documents d on d.id = c.document_id
--     where c.is_active = true and d.source_class = 'club_casebook'
--       and (filter_domain is null or d.domain = filter_domain)
--       and (filter_source_file is null or d.source_file = filter_source_file)
--     order by c.embedding <=> query_embedding limit match_count;
--   $$;
--   revoke all on function match_ingest_chunks(vector, integer, text, text) from public, anon, authenticated;
--   -- ingest_chunks.metadata and the page_start/page_end comments can stay; they have no
--   -- effect until code (FIN1.02/FIN1.04) reads/writes them.

-- Verification (read the output in the SQL editor):
select proname, pronargs from pg_proc where proname = 'match_ingest_chunks';
-- expect exactly one row, pronargs = 5
select column_name from information_schema.columns
  where table_name = 'ingest_chunks' and column_name = 'metadata';
-- expect one row

-- Guesstimates feature: match_ingest_chunks needs an optional source_file filter so
-- retrieval can be scoped to one specific casebook (the SRCC Guesstimates Book) instead
-- of every Consulting document. filter_domain alone can't do this - FMS/SRCC/ISB are all
-- domain = 'Consulting'.
--
-- What this migration does NOT do:
--   No row in ingest_chunks/ingest_documents is touched. is_active stays exactly as the
--   ingestion pipeline left it (false) - this does not switch anything live. The existing
--   3-argument call sites (consultingRetrieval.js) are unaffected: filter_source_file
--   defaults to null, which reproduces today's behavior exactly (no source_file filter).
--
-- Why DROP + CREATE instead of CREATE OR REPLACE: Postgres treats a new parameter as a
-- different function signature, so CREATE OR REPLACE would add a second overloaded
-- match_ingest_chunks(vector,int,text,text) alongside the existing 3-arg one rather than
-- replacing it - same quirk migration_043 hit with match_document_chunks's column list.
--
-- Every statement is idempotent: running this file twice is safe.

drop function if exists match_ingest_chunks(vector, integer, text);

create function match_ingest_chunks(
  query_embedding vector(768),
  match_count int default 6,
  filter_domain text default null,
  filter_source_file text default null
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
    and d.source_class = 'club_casebook'
    and (filter_domain is null or d.domain = filter_domain)
    and (filter_source_file is null or d.source_file = filter_source_file)
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

revoke all on function match_ingest_chunks(vector, integer, text, text) from public, anon, authenticated;

-- ROLLBACK (manual, only if needed; reverts to migration_042's 3-arg shape):
--   drop function if exists match_ingest_chunks(vector, integer, text, text);
--   create function match_ingest_chunks(
--     query_embedding vector(768), match_count int default 6, filter_domain text default null
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
--     order by c.embedding <=> query_embedding limit match_count;
--   $$;
--   revoke all on function match_ingest_chunks(vector, integer, text) from public, anon, authenticated;

-- Verification (read the output in the SQL editor):
--   select proname, pronargs from pg_proc where proname = 'match_ingest_chunks';
--   -- expect exactly one row, pronargs = 4

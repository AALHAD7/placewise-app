-- Phase R7 (plan 01): domain tagging on ingest_documents + match_ingest_chunks RPC.
--
-- Why:
--   R7 wires grounded retrieval to the new ingestion pipeline (ingest_chunks) instead of
--   the old document_chunks table, with real page-level citations. ingest_documents has no
--   domain column yet (migration_039 never added one - everything ingested so far happened
--   to be Consulting by construction, via Data/Consulting Files/). Frameworks is filtered by
--   domain (see frameworks.domain, migration_019), so the new retrieval path needs the same.
--
-- What this migration does NOT do:
--   It removes no rows and rewrites no existing value other than filling in the new, until-
--   now-nonexistent domain column. ingest_chunks.is_active stays exactly as the ingestion
--   pipeline left it (false) - this migration does not switch anything live. Future
--   ingestion runs for other domains (M2) must set ingest_documents.domain explicitly; this
--   migration only backfills the 11 rows that already exist, all of which are Consulting
--   club casebooks (FMS, SRCC, ISB - verified by source_file before writing this).
--
-- Every statement is idempotent: running this file twice is safe.

alter table ingest_documents add column if not exists domain text;

update ingest_documents set domain = 'Consulting'
where domain is null
  and source_file in (
    'The FMS Consulting CaseBook 2023-24 (1).pdf',
    'SRCC Guesstimates-Book-Volume-1-6.pdf',
    'ISB Consulting Casebook 2025.pdf',
    'The FMS Consulting Casebook 2021-22.pdf'
  );

create index if not exists ingest_documents_domain_idx on ingest_documents(domain);

-- match_ingest_chunks: the ingest_chunks equivalent of match_document_chunks, with real
-- citation fields (school/club/year/page range) that document_chunks never carried. Only
-- returns chunks whose document is both club_casebook (grounding policy, CLAUDE.md) and
-- is_active = true - today that is zero rows for every casebook (R9 hasn't switched any
-- version live yet), so this intentionally returns nothing until that explicit step.
create or replace function match_ingest_chunks(
  query_embedding vector(768),
  match_count int default 6,
  filter_domain text default null
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
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- Same posture as the other ingest_* access (migration_039/041): service role only. The
-- backend never exposes this RPC to the frontend directly - every caller is server-side
-- (src/lib/consultingRetrieval.js), same as match_document_chunks today.
revoke all on function match_ingest_chunks(vector, integer, text) from public, anon, authenticated;

-- ROLLBACK (manual, only if needed; harmless to leave in place otherwise).
--   drop function if exists match_ingest_chunks(vector, integer, text);
--   -- domain column/backfill can stay; it has no effect until match_ingest_chunks (or a
--   -- later caller) reads it.

-- Verification (read the output in the SQL editor):
--   expect all 11 existing rows -> 'Consulting'
select domain, count(*) from ingest_documents group by 1;

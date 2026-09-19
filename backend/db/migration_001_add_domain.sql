-- One-time migration: adds multi-domain support to an already-created document_chunks table.
-- Safe to run anytime, including while an ingestion is in progress (additive only).

alter table document_chunks add column if not exists domain text;
create index if not exists document_chunks_domain_idx on document_chunks(domain);

-- Existing rows predate domain tagging — they're all from the Prodman (product management) files.
update document_chunks set domain = 'Prodman' where domain is null;

-- Function signature changed (added filter_domain + domain in the return columns), so the
-- old one must be dropped rather than replaced — Postgres won't let CREATE OR REPLACE change
-- a function's return columns.
drop function if exists match_document_chunks(vector(768), int);

create or replace function match_document_chunks(
  query_embedding vector(768),
  match_count int default 6,
  filter_domain text default null
)
returns table (
  id bigint,
  domain text,
  source_file text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    document_chunks.id,
    document_chunks.domain,
    document_chunks.source_file,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where filter_domain is null or document_chunks.domain = filter_domain
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;

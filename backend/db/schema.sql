-- Run this in the Supabase SQL editor once, 
--before ingesting data.

create extension if not exists vector;

create table if not exists document_chunks (
  id bigint generated always as identity primary key,
  domain text, -- e.g. "Prodman", "Consulting", "Marketing" — derived from the source folder name
  source_file text not null,
  chunk_index integer not null,
  content text not null,
  embedding vector(768), -- gemini-embedding-001 output dimension (truncated via outputDimensionality)
  created_at timestamptz default now()
);

create index if not exists document_chunks_domain_idx on document_chunks(domain);

-- Similarity search used by the resume interrogation endpoint.
-- filter_domain is optional: pass null to search across all domains, or a domain
-- name to restrict retrieval to just that one (e.g. once a role/domain is selected).
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

-- Run this AFTER ingesting data (index quality depends on having rows to build against).
create index if not exists document_chunks_embedding_idx
  on document_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

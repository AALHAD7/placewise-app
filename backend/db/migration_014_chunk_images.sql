-- Run in the Supabase SQL editor. Extends document_chunks so an "image
-- chunk" can sit alongside ordinary text chunks in the same table and the
-- same retrieval pipeline (match_document_chunks): rather than trying to
-- attach an image to a specific existing text chunk (which would need page
-- numbers document_chunks doesn't currently track — chunking discards page
-- boundaries once it's split on them), each meaningfully-informative image
-- pulled out of a source PDF becomes its own row: `content` holds a Gemini-
-- generated caption (embedded exactly like a text chunk, so it's searchable
-- the same way), and `image_url` points at the actual image file in Supabase
-- Storage so the frontend can render it once that image chunk is retrieved
-- as a relevant source. See scripts/extract_images.py (pulls images out of
-- each PDF) and scripts/ingestImages.js (captions, uploads, embeds, inserts).

alter table document_chunks add column if not exists image_url text;
alter table document_chunks add column if not exists is_image boolean not null default false;

create index if not exists document_chunks_is_image_idx on document_chunks(is_image);

-- Postgres can't change a function's RETURNS TABLE column list via
-- CREATE OR REPLACE — the old signature must be dropped first.
drop function if exists match_document_chunks(vector(768), int, text);

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
  similarity float,
  image_url text
)
language sql stable
as $$
  select
    document_chunks.id,
    document_chunks.domain,
    document_chunks.source_file,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity,
    document_chunks.image_url
  from document_chunks
  where filter_domain is null or document_chunks.domain = filter_domain
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- Storage bucket creation is not a SQL operation — ingestImages.js creates
-- the "casebook-images" bucket itself (idempotent, via the storage API with
-- the service-role key) the first time it runs, so there's no separate
-- manual dashboard step needed for that part.

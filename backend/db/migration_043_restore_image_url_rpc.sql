-- Fix: migration_037's drop/recreate of match_document_chunks (to add the
-- is_active filter) rebuilt the function's RETURNS TABLE list from scratch
-- and accidentally dropped `image_url`, which migration_014 had added back
-- in the Phase that introduced image chunks (`is_image` rows alongside text
-- chunks, same table, same retrieval pipeline). migration_037's own comments
-- and the duplicate-deactivation list it carries are entirely about
-- is_active/source_class - nothing there says image support was meant to go
-- away, so this reads as an accidental regression, not an intentional
-- removal.
--
-- Effect of the regression: `frameworksGrounding.js`'s v1 path (`findGrounding`,
-- used whenever ENABLE_CONSULTING_RAG_V2 is off, or on but fw.domain is not
-- "Consulting") reads `r.image_url` off every row `match_document_chunks`
-- returns to pick `topImage` for a framework's `grounded_image`. With the
-- column missing from the RPC's result, every row has `image_url ===
-- undefined`, so `topImage` was never found, `grounded_image` stayed null
-- for live Frameworks lookups, and no error was ever thrown - exactly the
-- silent-miss pattern flagged after R7 (see log.md 2026-10-30 R7 entry).
--
-- Fix: restore `image_url` to the RPC's return list and select list. The
-- underlying column (document_chunks.image_url, added by migration_014) was
-- never dropped or altered - only the function's output stopped surfacing
-- it - so this is a pure RPC definition fix. No document_chunks row is
-- read, written or touched by this migration.
--
-- Same Postgres quirk migration_014/037 both hit: CREATE OR REPLACE can't
-- change a function's RETURNS TABLE column list, so drop first.
drop function if exists match_document_chunks(vector, integer, text);

create function match_document_chunks(
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
  where is_active = true
    and (filter_domain is null or document_chunks.domain = filter_domain)
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- ROLLBACK (manual, only if needed; reverts to migration_037's shape):
--   drop function if exists match_document_chunks(vector, integer, text);
--   create function match_document_chunks(
--     query_embedding vector(768), match_count int default 6,
--     filter_domain text default null
--   ) returns table (
--     id bigint, domain text, source_file text, content text, similarity float
--   ) language sql stable as $$
--     select document_chunks.id, document_chunks.domain, document_chunks.source_file,
--       document_chunks.content, 1 - (document_chunks.embedding <=> query_embedding) as similarity
--     from document_chunks
--     where is_active = true and (filter_domain is null or document_chunks.domain = filter_domain)
--     order by document_chunks.embedding <=> query_embedding limit match_count;
--   $$;
--
-- Verification (read the output in the SQL editor):
--   select * from match_document_chunks(
--     (select embedding from document_chunks where is_image = true limit 1),
--     6, null
--   );
--   -- expect an `image_url` column in the result, non-null for any is_image=true row
--   -- that scores in the top match_count.

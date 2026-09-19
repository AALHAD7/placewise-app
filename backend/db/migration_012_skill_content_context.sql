-- Run in the Supabase SQL editor. Adds a `context` column to
-- skill_content_cache so the retrieved-context RAG excerpts (see
-- retrieveContext() in backend/src/lib/skillContent.js) are cached
-- alongside a skill's concepts/problems - retrieved once per skill and
-- reused when generating problems for additional difficulty tiers, instead
-- of re-embedding/re-querying every time.

alter table skill_content_cache add column if not exists context text;

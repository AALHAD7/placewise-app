-- Run in the Supabase SQL editor. Adds a lazily-computed, cached "real
-- example" to each framework, grounded in the ingested casebook corpus
-- (document_chunks) instead of invented - see
-- backend/src/lib/frameworksGrounding.js. Computed once per framework on
-- its first request; grounded_checked_at being set (even when
-- grounded_example is left null, meaning no good match was found) is what
-- stops it from being re-queried on every subsequent request.

alter table frameworks add column if not exists grounded_example jsonb;
alter table frameworks add column if not exists grounded_checked_at timestamptz;

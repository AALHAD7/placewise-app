-- G3 (pulled forward ahead of its normal M3 sequencing, same explicit call as
-- migration_045's G2 work: "use casebook data everywhere it genuinely
-- applies, not just one section"). company_value_chain_cache and
-- company_timeline_cache currently have no casebook retrieval at all - both
-- are pure Gemini + Google-Search-grounded research. This migration only
-- adds the columns needed to persist an explicit grounded/not-grounded flag
-- plus a real citation, same shape as migration_045. No existing row is
-- read, deleted or rewritten - every new column is nullable or has a safe
-- default, and old cached rows simply read as "not grounded" (they'll pick
-- up the new behavior naturally on their next 60-day TTL refresh, same
-- invalidation path these two tables already use for any other change).
--
-- company_overview_cache and company_roles_cache are deliberately NOT
-- touched here - see log.md for why (false-positive risk: overview's
-- share-price/financials/headcount are time-sensitive facts a casebook
-- could easily be stale or wrong on; roles.js is recruiting/HR data with no
-- real conceptual overlap with case content).
--
-- Every statement is idempotent: running this file twice is safe.

alter table company_value_chain_cache
  add column if not exists grounded_in_casebooks boolean not null default false,
  add column if not exists citation jsonb;

alter table company_timeline_cache
  add column if not exists grounded_in_casebooks boolean not null default false,
  add column if not exists citation jsonb;

-- ROLLBACK (manual, only if needed; harmless to leave in place otherwise -
-- these columns have no effect until the G3 code paths read them):
--   alter table company_value_chain_cache drop column if exists grounded_in_casebooks;
--   alter table company_value_chain_cache drop column if exists citation;
--   alter table company_timeline_cache drop column if exists grounded_in_casebooks;
--   alter table company_timeline_cache drop column if exists citation;

-- Verification (read the output in the SQL editor):
--   select column_name from information_schema.columns
--   where table_name in ('company_value_chain_cache','company_timeline_cache')
--     and column_name in ('grounded_in_casebooks','citation');
--   -- expect 4 rows

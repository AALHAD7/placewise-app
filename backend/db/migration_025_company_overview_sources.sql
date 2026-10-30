-- Run in the Supabase SQL editor. company_overview.js was switched from a
-- plain (ungrounded) generateJSON call to the same grounded-research-then-
-- format pattern as company_business_model_cache/company_rating_cache - now
-- needed for the overview to cover time-sensitive facts (share price,
-- listed status) with real citations instead of parametric-recall guesses.
-- These two columns match those caches' shape exactly.

alter table company_overview_cache add column if not exists sources jsonb not null default '[]'::jsonb;
alter table company_overview_cache add column if not exists grounded boolean not null default false;

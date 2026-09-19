-- Run in the Supabase SQL editor. Backs the Company page's "about / facts /
-- investments / recruitment process" content, previously hardcoded static
-- data for 9 named companies in the frontend. Same caching pattern as
-- news_cache (migration_003): generated live by Gemini (grounded in real
-- fetched news, see companyOverview.js) rather than requiring hand-authored
-- seed data per company, so it works for any company a user picks. Cached
-- for days, not hours, since company facts move slower than news.

create table if not exists company_overview_cache (
  id uuid primary key default gen_random_uuid(),
  company_name text not null unique,
  about text not null default '',
  facts jsonb not null default '[]'::jsonb,
  investments jsonb not null default '[]'::jsonb,
  process_note text not null default '',
  rounds jsonb not null default '[]'::jsonb,
  fetched_at timestamptz not null default now()
);
create index if not exists company_overview_cache_name_idx on company_overview_cache(company_name);

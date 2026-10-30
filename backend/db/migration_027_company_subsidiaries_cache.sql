-- Run in the Supabase SQL editor. Backs the Company page's Subsidiary
-- picker - real, search-grounded major/notable subsidiary names for a
-- parent or group company (see companySubsidiaries.js), never an invented
-- list. An empty `subsidiaries` array is the expected, common result for a
-- standalone company - that's what makes the frontend's Subsidiary field
-- correctly gray itself out rather than always looking available.

create table if not exists company_subsidiaries_cache (
  id uuid primary key default gen_random_uuid(),
  company_name text not null unique,
  subsidiaries jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  grounded boolean not null default false,
  fetched_at timestamptz not null default now()
);
create index if not exists company_subsidiaries_cache_name_idx on company_subsidiaries_cache(company_name);
alter table company_subsidiaries_cache disable row level security;

-- Run in the Supabase SQL editor. Backs the Company page's leadership panel
-- (CXOs shown alongside "About the company") - real, search-grounded names
-- and titles (see companyLeadership.js), never invented ones. `photoUrl`
-- inside each executives[] entry is either a real Wikipedia photo (only
-- attached when the matched Wikipedia page's own text corroborates the
-- company - see lookupWikipediaPhoto) or null, in which case the frontend
-- renders an initials avatar instead of a fabricated photo.

create table if not exists company_leadership_cache (
  id uuid primary key default gen_random_uuid(),
  company_name text not null unique,
  executives jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  grounded boolean not null default false,
  fetched_at timestamptz not null default now()
);
create index if not exists company_leadership_cache_name_idx on company_leadership_cache(company_name);
alter table company_leadership_cache disable row level security;

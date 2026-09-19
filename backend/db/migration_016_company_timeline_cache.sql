-- Run in the Supabase SQL editor. Backs the Company page's history timeline
-- (major milestones since founding - e.g. "2005: Oracle acquires
-- PeopleSoft") - same live-grounded-research-then-cache pattern as
-- company_roles_cache/role_overview_cache, not the 6h-cache recent-news
-- pipeline (news_cache) - a timeline needs real historical depth a handful
-- of recent headlines can't provide.

create table if not exists company_timeline_cache (
  id uuid primary key default gen_random_uuid(),
  company_name text not null unique,
  events jsonb not null default '[]'::jsonb,
  fetched_at timestamptz not null default now()
);
create index if not exists company_timeline_cache_name_idx on company_timeline_cache(company_name);
alter table company_timeline_cache disable row level security;

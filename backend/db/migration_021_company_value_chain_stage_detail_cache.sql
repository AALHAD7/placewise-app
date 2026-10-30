-- Run in the Supabase SQL editor. Backs clicking into a single value-chain
-- stage (company_value_chain_cache, migration_017) for the real, grounded
-- detail on how that specific stage actually operates - a second,
-- search-grounded research call per (company, stage) rather than expanding
-- on the summary already generated for the stage list, since a student
-- wants verifiable depth here, not a longer version of the same guess.
-- `sources` holds the real citations generateGroundedText returned
-- (title + Google grounding-redirect uri) so the detail can be shown next
-- to the actual sources it came from, not just asserted.

create table if not exists company_value_chain_stage_detail_cache (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  stage_name text not null,
  detail text not null default '',
  sources jsonb not null default '[]'::jsonb,
  grounded boolean not null default false,
  fetched_at timestamptz not null default now(),
  unique (company_name, stage_name)
);
create index if not exists company_value_chain_stage_detail_cache_lookup_idx on company_value_chain_stage_detail_cache(company_name, stage_name);
alter table company_value_chain_stage_detail_cache disable row level security;

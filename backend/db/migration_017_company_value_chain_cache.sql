-- Run in the Supabase SQL editor. Backs the Company page's value chain
-- diagram (how the company actually creates and captures value, stage by
-- stage - e.g. for a payments company: merchant onboarding -> payment
-- processing -> settlement -> value-added services) - same live-grounded-
-- research-then-cache pattern as company_timeline_cache/company_roles_cache,
-- tailored per company/industry rather than a generic Porter's-value-chain
-- template pasted for every company.

create table if not exists company_value_chain_cache (
  id uuid primary key default gen_random_uuid(),
  company_name text not null unique,
  stages jsonb not null default '[]'::jsonb,
  fetched_at timestamptz not null default now()
);
create index if not exists company_value_chain_cache_name_idx on company_value_chain_cache(company_name);
alter table company_value_chain_cache disable row level security;

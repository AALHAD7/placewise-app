-- Run in the Supabase SQL editor. Backs the Company page's "View business
-- model" button - a grounded, on-demand (not prefetched with the rest of
-- the page) research call that produces a real Business Model Canvas (9
-- Osterwalder blocks) plus a plain-language "how this actually works, end
-- to end" narrative. Rendered as ASCII art on the frontend from these
-- structured arrays (deterministic string layout, not the model drawing
-- ASCII itself - LLMs are unreliable at keeping box-drawing characters
-- aligned across wrapped multi-line cells, and the accuracy the user cares
-- about is the CONTENT, which stays exactly what was verified via search).
-- `sources` holds the real citations generateGroundedText returned, same
-- pattern as company_value_chain_stage_detail_cache (migration_021).

create table if not exists company_business_model_cache (
  id uuid primary key default gen_random_uuid(),
  company_name text not null unique,
  key_partners jsonb not null default '[]'::jsonb,
  key_activities jsonb not null default '[]'::jsonb,
  key_resources jsonb not null default '[]'::jsonb,
  value_propositions jsonb not null default '[]'::jsonb,
  customer_relationships jsonb not null default '[]'::jsonb,
  channels jsonb not null default '[]'::jsonb,
  customer_segments jsonb not null default '[]'::jsonb,
  cost_structure jsonb not null default '[]'::jsonb,
  revenue_streams jsonb not null default '[]'::jsonb,
  how_it_works text not null default '',
  sources jsonb not null default '[]'::jsonb,
  grounded boolean not null default false,
  fetched_at timestamptz not null default now()
);
create index if not exists company_business_model_cache_name_idx on company_business_model_cache(company_name);
alter table company_business_model_cache disable row level security;

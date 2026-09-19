-- Run in the Supabase SQL editor. Backs the "job role at this company"
-- picker on the Company page - was a hardcoded map covering exactly the
-- same 9 companies as the (now free-text-searchable, see companySelector()
-- in the frontend) company picker itself. Same live-generated-and-cached
-- pattern as role_overview_cache/company_overview_cache: Gemini research,
-- grounded in real web search (careers pages, LinkedIn Jobs, Naukri,
-- Glassdoor, AmbitionBox, campus placement reports - see
-- backend/src/lib/companyRoles.js), not the model's unguided recall.

create table if not exists company_roles_cache (
  id uuid primary key default gen_random_uuid(),
  company_name text not null unique,
  roles jsonb not null default '[]'::jsonb,
  fetched_at timestamptz not null default now()
);
create index if not exists company_roles_cache_name_idx on company_roles_cache(company_name);
alter table company_roles_cache disable row level security;

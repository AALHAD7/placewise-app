-- Run in the Supabase SQL editor. Backs the Role tab's optional "which
-- company" dimension: once a user picks a company alongside a role, the
-- whole overview card (what/process/salary/skills/exits) is regenerated
-- tailored to that role AT that company specifically, instead of the
-- role-wide version in role_overview_cache (migration_008). Separate table,
-- not a company column added to role_overview_cache, because the shape
-- genuinely differs — "companies" (who hires for this role, plural) doesn't
-- make sense once a single company is already fixed; "process" (this
-- company's actual interview rounds for this role) replaces it instead.
--
-- Keyed on (role_name, company_name) as typed — same "no canonical
-- snapping" reasoning already decided for role_overview_cache itself (see
-- migration_008's header and the Decisions Log entry it references): a
-- typed role/company should get an overview genuinely about what was typed.

create table if not exists role_company_overview_cache (
  id uuid primary key default gen_random_uuid(),
  role_name text not null,
  company_name text not null,
  what text not null default '',
  process jsonb not null default '[]'::jsonb,
  salary text not null default '',
  salary_note text not null default '',
  skills jsonb not null default '[]'::jsonb,
  exits jsonb not null default '[]'::jsonb,
  fetched_at timestamptz not null default now(),
  unique (role_name, company_name)
);
create index if not exists role_company_overview_cache_lookup_idx on role_company_overview_cache(role_name, company_name);
alter table role_company_overview_cache disable row level security;

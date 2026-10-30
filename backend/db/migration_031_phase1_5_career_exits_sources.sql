-- Phase 1.5 item 6: "exits" splits into career_progression (same function/
-- firm type) and exit_opportunities (genuinely different function/firm
-- type/industry) on both overview tables.
alter table role_overview_cache add column if not exists career_progression jsonb not null default '[]'::jsonb;
alter table role_overview_cache add column if not exists exit_opportunities jsonb not null default '[]'::jsonb;
alter table role_company_overview_cache add column if not exists career_progression jsonb not null default '[]'::jsonb;
alter table role_company_overview_cache add column if not exists exit_opportunities jsonb not null default '[]'::jsonb;

-- Phase 1.5 item 3: tiered source quality. has_trusted_source gates the
-- salary figure (TRUSTED only); has_supporting_source additionally gates
-- interview process (TRUSTED or SUPPORTING) on the company-specific table.
alter table role_overview_cache add column if not exists has_trusted_source boolean not null default false;
alter table role_company_overview_cache add column if not exists has_trusted_source boolean not null default false;
alter table role_company_overview_cache add column if not exists has_supporting_source boolean not null default false;

-- Old "exits" columns are superseded by the two above - dropped rather than
-- left as dead data nothing reads.
alter table role_overview_cache drop column if exists exits;
alter table role_company_overview_cache drop column if exists exits;

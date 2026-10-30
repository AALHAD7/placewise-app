-- Phase 1.7 item 3: the role-only overview (salary/companies, no company
-- fixed) never had a has_supporting_source column - only the at-company
-- variant did (migration_031). Needed now so the salary card can show a
-- 3-tier result (trusted / supporting-only "Indicative" / neither-hidden)
-- instead of its previous trusted-or-nothing binary.
alter table role_overview_cache add column if not exists has_supporting_source boolean not null default false;

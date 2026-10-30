-- Phase 1.6 role_id decision: existing content caches stay name-keyed (a
-- renamed role just regenerates under its new name, no re-keying needed -
-- see migration_034's comment). From this migration onward, mock_interview_
-- sessions - the one table confirmed to hold real per-role user state - gets
-- a role_id column. New code (backend/src/routes/mockInterview.js) writes
-- role_id on every new insert via roles.js's roleIdFor(); this migration
-- only backfills existing rows. The `role` column stays (display/free-text -
-- mock interview role input isn't constrained to the canonical list), but
-- any future join/group-by on role must use role_id.
--
-- The mapping below is generated 1:1 from ROLE_CATALOG in
-- backend/src/lib/roles.js (53 canonical roles) plus ROLE_RENAMES (5 old
-- names, for any pre-rename row that predates migration_034). A role text
-- that matches neither (free-typed, non-canonical) gets role_id = null,
-- same as roleIdFor()'s behavior in application code.

alter table mock_interview_sessions add column if not exists role_id text;

update mock_interview_sessions set role_id = case
    when lower(role) = 'associate product manager' then 'associate-product-manager'
    when lower(role) = 'product manager' then 'product-manager'
    when lower(role) = 'product analyst' then 'product-analyst'
    when lower(role) = 'product owner' then 'product-owner'
    when lower(role) = 'technical product manager' then 'technical-product-manager'
    when lower(role) = 'growth product manager' then 'growth-product-manager'
    when lower(role) = 'program manager' then 'program-manager'
    when lower(role) = 'strategy associate' then 'strategy-associate'
    when lower(role) = 'consultant' then 'consultant'
    when lower(role) = 'consultant (associate)' then 'consultant-associate'
    when lower(role) = 'corporate strategy associate' then 'corporate-strategy-associate'
    when lower(role) = 'strategy & operations analyst' then 'strategy-and-operations-analyst'
    when lower(role) = 'transformation associate' then 'transformation-associate'
    when lower(role) = 'business analyst' then 'business-analyst'
    when lower(role) = 'data analyst' then 'data-analyst'
    when lower(role) = 'business intelligence analyst' then 'business-intelligence-analyst'
    when lower(role) = 'insights & analytics associate' then 'insights-and-analytics-associate'
    when lower(role) = 'decision science analyst' then 'decision-science-analyst'
    when lower(role) = 'investment banking associate' then 'investment-banking-associate'
    when lower(role) = 'equity research analyst' then 'equity-research-analyst'
    when lower(role) = 'corporate finance analyst' then 'corporate-finance-analyst'
    when lower(role) = 'fp&a analyst' then 'fpa-analyst'
    when lower(role) = 'private equity / vc associate' then 'private-equity-vc-associate'
    when lower(role) = 'credit & risk analyst' then 'credit-and-risk-analyst'
    when lower(role) = 'treasury analyst' then 'treasury-analyst'
    when lower(role) = 'assistant brand manager' then 'assistant-brand-manager'
    when lower(role) = 'marketing manager' then 'marketing-manager'
    when lower(role) = 'category manager' then 'category-manager'
    when lower(role) = 'digital marketing manager' then 'digital-marketing-manager'
    when lower(role) = 'product marketing manager' then 'product-marketing-manager'
    when lower(role) = 'growth marketing manager' then 'growth-marketing-manager'
    when lower(role) = 'growth manager' then 'growth-manager'
    when lower(role) = 'city/cluster manager' then 'city-cluster-manager'
    when lower(role) = 'customer success manager' then 'customer-success-manager'
    when lower(role) = 'business development manager' then 'business-development-manager'
    when lower(role) = 'key account manager' then 'key-account-manager'
    when lower(role) = 'sales strategy associate' then 'sales-strategy-associate'
    when lower(role) = 'partnerships manager' then 'partnerships-manager'
    when lower(role) = 'merchant/partner success manager' then 'merchant-partner-success-manager'
    when lower(role) = 'operations manager' then 'operations-manager'
    when lower(role) = 'supply chain manager' then 'supply-chain-manager'
    when lower(role) = 'business operations associate' then 'business-operations-associate'
    when lower(role) = 'hr business partner' then 'hr-business-partner'
    when lower(role) = 'general management trainee' then 'general-management-trainee'
    when lower(role) = 'chief of staff' then 'chief-of-staff'
    when lower(role) = 'corporate development associate' then 'corporate-development-associate'
    when lower(role) = 'risk & fraud analyst' then 'risk-and-fraud-analyst'
    when lower(role) = 'compliance analyst' then 'compliance-analyst'
    when lower(role) = 'payments product manager' then 'payments-product-manager'
    when lower(role) = 'technology consultant' then 'technology-consultant'
    when lower(role) = 'digital transformation consultant' then 'digital-transformation-consultant'
    when lower(role) = 'solutions / pre-sales consultant' then 'solutions-presales-consultant'
    when lower(role) = 'technical program manager' then 'technical-program-manager'
    when lower(role) = 'investment banking analyst' then 'investment-banking-associate'
    when lower(role) = 'private equity/vc analyst' then 'private-equity-vc-associate'
    when lower(role) = 'business analyst (consulting)' then 'consultant-associate'
    when lower(role) = 'management consultant' then 'consultant-associate'
    when lower(role) = 'brand manager' then 'assistant-brand-manager'
    else null
  end
where role_id is null and role is not null;

create index if not exists mock_interview_sessions_role_id_idx on mock_interview_sessions(role_id);

-- Run this after applying, to report the backfill outcome:
--   select count(*) filter (where role_id is not null) as backfilled,
--          count(*) filter (where role_id is null and role is not null) as unmatched_free_text,
--          count(*) filter (where role is null) as no_role,
--          count(*) as total
--   from mock_interview_sessions;

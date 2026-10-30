-- Run in the Supabase SQL editor. Financials/listed-status/sector move out
-- of the loose `facts` jsonb array (where the frontend had to match on an
-- exact key string like "Listed", fragile if the model ever phrased it
-- differently) into their own typed columns, so the Company page's
-- dedicated Financials section (separate from "About the company") can
-- render them reliably. See companyOverview.js.
--
-- financials_fetched_at is separate from the existing fetched_at - it lets
-- fetchCompanyOverview() detect a row cached before this migration (these
-- new columns all null) and treat it as stale exactly once, so the
-- Financials section doesn't sit empty until the normal 4-day TTL would
-- otherwise have refreshed it.

alter table company_overview_cache add column if not exists sector text;
alter table company_overview_cache add column if not exists listed boolean;
alter table company_overview_cache add column if not exists listed_detail text;
alter table company_overview_cache add column if not exists share_price text;
alter table company_overview_cache add column if not exists financials text;
alter table company_overview_cache add column if not exists financials_fetched_at timestamptz;

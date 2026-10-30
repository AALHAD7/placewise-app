-- Phase 1.5 item 2: the arithmetic-only verifier becomes a 5-flag content
-- check (consistent/on_topic/company_forced/irrelevant_citation/
-- units_consistent). chip_panel_cache's stored result columns are renamed
-- to match - role_topics_cache/skill_content_cache store their verification
-- results inside existing jsonb columns, so no schema change needed there.
alter table chip_panel_cache rename column arithmetic_checked to content_checked;
alter table chip_panel_cache rename column arithmetic_consistent to content_passed;
alter table chip_panel_cache rename column arithmetic_issue to content_issue;

-- Phase 1.5 item 4: company alias/exclusion matching needs a real alias
-- table rather than exact-string containment - see roleCompanyTopicNotes.js.
create table if not exists company_aliases (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  alias text not null unique
);

-- Phase 1.5 item 5: every model-cascade escalation beyond MAX_CASCADE_TIER
-- (config.js) is logged here - feeds the admin usage view's daily
-- escalation count and the >50/day alert row below.
create table if not exists model_escalation_log (
  id uuid primary key default gen_random_uuid(),
  from_model text not null,
  to_model text not null,
  feature text not null,
  call_type text not null, -- 'json' | 'text' | 'grounded'
  created_at timestamptz not null default now()
);
create table if not exists admin_alerts (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  message text not null,
  created_at timestamptz not null default now(),
  acknowledged boolean not null default false
);

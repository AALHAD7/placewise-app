-- Phase 1.6 item 1: admin "Usage" page data. model_escalation_log already
-- exists (migration_030) and only captures escalations; this is the
-- general-purpose call log the "daily LLM calls by feature and call type"
-- view needs - every generateText/generateJSON/generateGroundedText call,
-- not just the ones that escalated.
create table if not exists llm_call_log (
  id uuid primary key default gen_random_uuid(),
  feature text not null,
  call_type text not null, -- 'json' | 'text' | 'grounded'
  model text not null,
  key_source text not null default 'platform', -- always 'platform' today - see gemini.js, no BYOK exists in this app
  created_at timestamptz not null default now()
);
create index if not exists llm_call_log_created_at_idx on llm_call_log (created_at);

create table if not exists admin_action_log (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

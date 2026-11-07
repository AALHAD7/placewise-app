-- Migration 050: Persistent practice evaluation cache
-- Stores evaluation results keyed by sha256(question + answer + role + company)
-- so identical submissions always receive the same score, even across server restarts
-- and across multiple serverless instances.

create table if not exists practice_eval_cache (
  cache_key   text        primary key,
  evaluation  jsonb       not null,
  created_at  timestamptz not null default now()
);

-- RLS: service role only (backend uses service key)
alter table practice_eval_cache enable row level security;

-- No public access; service role bypasses RLS by default
comment on table practice_eval_cache is
  'Persistent cache for practice question evaluations. '
  'Key = sha256(normalized question + answer + role + company). '
  'Identical submissions always receive the same cached evaluation, '
  'ensuring cross-student consistency in scoring.';

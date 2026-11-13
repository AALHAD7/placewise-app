-- Migration 053: question_log
-- Structured record of every question a student actually asks, across the three places
-- that currently only log to Google Sheets (backend/src/lib/sheetsLogger.js) and nowhere
-- else: Frameworks' "ask a follow-up" box, the standalone Q&A page, and Guesstimates'
-- "ask the interviewer" clarifying-question box. This is an ADDITIVE second write next to
-- the existing Sheets calls (never removed) - see frameworks.js/qa.js/guesstimates.js. The
-- point is a queryable, per-framework view inside /admin (GET /api/admin/questions),
-- rather than a Sheets tab Aalhad has to eyeball by hand. Same architecture as migration_051
-- (ui_events): one raw row per event, aggregated live in the admin route, no rollup table.
--
-- framework_id references frameworks(id) (confirmed uuid pk in migration_002) - set null
-- on delete so a later framework deletion/reseed never loses or blocks a log row.
-- framework_name/domain/subdomain are denormalized onto the row (copied from the
-- already-fetched `frameworks` row at write time) so the admin view never needs a join,
-- same reasoning as ui_events' denormalized page/section strings.

create table if not exists question_log (
  id             uuid        primary key default gen_random_uuid(),
  source         text        not null check (source in ('framework', 'qa', 'guesstimate')),
  question       text        not null,
  framework_id   uuid        references frameworks(id) on delete set null,
  framework_name text,
  domain         text,
  subdomain      text,
  -- Whether the answer was grounded in the casebooks vs. a labelled general-knowledge
  -- fallback (CLAUDE.md's grounding policy) - null only if a call site genuinely has no
  -- such concept (none do today, but kept nullable rather than forced false).
  grounded       boolean,
  -- Same identity posture already used for Sheets logging at every one of these call
  -- sites (frameworks.js/qa.js/guesstimates.js): real signed-in user's email, or a
  -- non-identifying "Guest (<id prefix>)"/"Guest" label - never a bare raw user id.
  user_label     text,
  created_at     timestamptz not null default now()
);

create index if not exists question_log_created_at_idx on question_log (created_at);
create index if not exists question_log_framework_id_idx on question_log (framework_id);

-- RLS: service role only (backend uses service key) - same posture as ui_events,
-- ingest_chunks and every other backend-only table in this app. No anon/authenticated
-- policies; this is admin-dashboard/internal data, never exposed to students directly.
alter table question_log enable row level security;

comment on table question_log is
  'One row per question a student asks on Frameworks ask-a-follow-up, the standalone Q&A '
  'page, or Guesstimates'' ask-the-interviewer box. Additive alongside the existing Google '
  'Sheets logging (sheetsLogger.js) - not a replacement. Read by GET /api/admin/questions.';

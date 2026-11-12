-- Migration 052: Company page "Events" (upcoming quarterly results, AGM, dividend dates,
-- etc. - the Zerodha-style corporate-events timeline Aalhad asked for, 2026-11-13).
-- Same live-grounded-research-then-cache pattern as company_rating_cache (NOT
-- company_timeline_cache's softer fallback): dates this far forward are not
-- something a model can know from memory - training data has no future dates in it -
-- so this HARD-REFUSES to show anything unless Gemini's real Google Search grounding
-- actually found a real source (same posture as company_rating_cache's `found` field).
-- Shorter TTL than the 30/60-day tiers used elsewhere: upcoming-event dates go stale
-- within weeks (a quarter closes, a new date becomes "next"), not months.

create table if not exists company_events_cache (
  id uuid primary key default gen_random_uuid(),
  company_name text not null unique,
  found boolean not null default false,
  events jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  grounded boolean not null default false,
  fetched_at timestamptz not null default now()
);
create index if not exists company_events_cache_name_idx on company_events_cache(company_name);
alter table company_events_cache disable row level security;

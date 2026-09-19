-- Run in the Supabase SQL editor. Backs the company + domain/industry news
-- endpoints with a shared cache table so we don't burn GNews's free-tier
-- request cap (100/day) on every page load — news is re-fetched only when
-- the cached row is older than the TTL the backend enforces (see news.js).

create table if not exists news_cache (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null, -- 'company' | 'domain'
  scope_value text not null, -- company name or domain/industry name (e.g. "Razorpay", "fintech")
  articles jsonb not null default '[]'::jsonb,
  fetched_at timestamptz not null default now(),
  unique (scope_type, scope_value)
);

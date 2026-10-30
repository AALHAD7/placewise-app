-- Run in the Supabase SQL editor. Backs the Company page's Glassdoor-style
-- rating section - a real, search-grounded lookup of the company's actual
-- Glassdoor rating (no Glassdoor API exists; scraping it directly is
-- fragile/against ToS, the same reasoning already decided against for
-- salary data - see the 2026-09-02 Decisions Log entry), never an invented
-- number. `company_rating_cache` is the generic, company-wide rating shown
-- by default; `company_role_rating_cache` is shown once a role is also
-- picked, and may report a *closest matching* role Glassdoor actually rates
-- (see `matched_role_title`/`is_exact_match`) rather than the exact typed
-- role, since Glassdoor's own role breakdowns rarely cover every title.

create table if not exists company_rating_cache (
  id uuid primary key default gen_random_uuid(),
  company_name text not null unique,
  found boolean not null default false,
  rating numeric,
  review_count text,
  sources jsonb not null default '[]'::jsonb,
  grounded boolean not null default false,
  fetched_at timestamptz not null default now()
);
create index if not exists company_rating_cache_name_idx on company_rating_cache(company_name);
alter table company_rating_cache disable row level security;

create table if not exists company_role_rating_cache (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  role_name text not null,
  found boolean not null default false,
  rating numeric,
  review_count text,
  matched_role_title text,
  is_exact_match boolean not null default false,
  sources jsonb not null default '[]'::jsonb,
  grounded boolean not null default false,
  fetched_at timestamptz not null default now(),
  unique (company_name, role_name)
);
create index if not exists company_role_rating_cache_lookup_idx on company_role_rating_cache(company_name, role_name);
alter table company_role_rating_cache disable row level security;

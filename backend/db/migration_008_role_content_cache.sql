-- Run in the Supabase SQL editor. Backs the "Role" tab's content: overview
-- card (about/companies/salary/skills/exits) and the deeper interview-prep
-- curriculum (topics/frameworks/model answers/pitfalls/practice prompts/
-- company notes) for any role a user picks or free-text searches, generated
-- live by Gemini and cached — same pattern as company_overview_cache
-- (migration_007). Previously both were hardcoded static content for
-- exactly 10 named roles in the frontend.
--
-- role_alias_cache backs the free-text search path: when a typed role isn't
-- one of the CANONICAL_ROLES (see backend/src/lib/roles.js), Gemini classifies
-- it to the single nearest canonical role, and that classification is cached
-- here (keyed by the normalized typed text) so the same typed phrase never
-- needs re-classifying. The other two tables are always keyed by the
-- canonical role name, never by what a user actually typed — a "Growth
-- Hacker" search and a "Head of Growth" search that both resolve to
-- "Growth Manager" share the same cached overview/topics content.

create table if not exists role_overview_cache (
  id uuid primary key default gen_random_uuid(),
  role_name text not null unique,
  what text not null default '',
  companies jsonb not null default '[]'::jsonb,
  salary text not null default '',
  salary_note text not null default '',
  skills jsonb not null default '[]'::jsonb,
  exits jsonb not null default '[]'::jsonb,
  fetched_at timestamptz not null default now()
);
create index if not exists role_overview_cache_name_idx on role_overview_cache(role_name);
alter table role_overview_cache disable row level security;

create table if not exists role_topics_cache (
  id uuid primary key default gen_random_uuid(),
  role_name text not null unique,
  topics jsonb not null default '[]'::jsonb,
  fetched_at timestamptz not null default now()
);
create index if not exists role_topics_cache_name_idx on role_topics_cache(role_name);
alter table role_topics_cache disable row level security;

create table if not exists role_alias_cache (
  id uuid primary key default gen_random_uuid(),
  typed_text text not null unique, -- normalized: trimmed + lowercased
  matched_role text not null,
  created_at timestamptz not null default now()
);
create index if not exists role_alias_cache_typed_text_idx on role_alias_cache(typed_text);
alter table role_alias_cache disable row level security;

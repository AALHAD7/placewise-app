-- Run in the Supabase SQL editor. Backs the "Skills required" click-through
-- on the Role page: concepts + hands-on practice problems for a specific
-- skill in the context of a specific role. Code-based skills (SQL, Python)
-- get problems with a verified expected result/output, computed by actually
-- executing the generated reference solution server-side (sql.js / pyodide
-- in Node - see backend/src/lib/skillContent.js) rather than trusting
-- Gemini's own claim of what the correct output is. Non-code skills get
-- concepts + open-ended practice prompts only, no grading claim.

create table if not exists skill_content_cache (
  id uuid primary key default gen_random_uuid(),
  role_name text not null,
  skill_name text not null,
  is_code boolean not null default false,
  language text, -- 'sql' | 'python' | null
  concepts jsonb not null default '[]'::jsonb,
  problems jsonb not null default '[]'::jsonb,
  fetched_at timestamptz not null default now(),
  unique (role_name, skill_name)
);
create index if not exists skill_content_cache_lookup_idx on skill_content_cache(role_name, skill_name);
alter table skill_content_cache disable row level security;

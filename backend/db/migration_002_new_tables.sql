-- Run in the Supabase SQL editor. Adds tables for the 6 endpoints built after
-- resume/interrogate: story, tone (stateless, no table needed), mock-interview,
-- frameworks, companies, and community contributions.

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  industry text,
  culture text[],
  hiring_bar text,
  created_at timestamptz default now()
);
create index if not exists companies_name_idx on companies(name);

create table if not exists company_interview_questions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  role_title text,
  question text not null,
  created_at timestamptz default now()
);
create index if not exists company_interview_questions_company_idx on company_interview_questions(company_id);

create table if not exists frameworks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text, -- e.g. "Product", "Consulting", "Ops" — filterable via ?role=
  level text, -- e.g. "mba", "ug" — filterable via ?level=
  description text,
  example text,
  steps text[],
  created_at timestamptz default now()
);
create index if not exists frameworks_role_idx on frameworks(role);

-- One row per mock interview session; `questions` accumulates the full
-- transcript (question, user's answer, feedback) as the session progresses,
-- so /answer can always work from a single row instead of a child table.
create table if not exists mock_interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  company text,
  role text,
  difficulty smallint,
  status text not null default 'in_progress', -- 'in_progress' | 'completed'
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists mock_interview_sessions_user_idx on mock_interview_sessions(user_id);

create table if not exists community_contributions (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid references auth.users(id) on delete set null,
  type text not null, -- 'interview_qa' | 'case_study' | 'framework'
  company text,
  role text,
  content text not null,
  sources text[],
  status text not null default 'pending', -- 'pending' | 'verified' | 'rejected'
  created_at timestamptz default now()
);
create index if not exists community_contributions_status_idx on community_contributions(status);

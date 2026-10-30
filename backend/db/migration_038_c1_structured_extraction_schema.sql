-- Phase C1.1: structured extraction schema. 8 tables, each carrying the
-- common provenance/classification columns the doc specifies, plus its own
-- content columns. cb_placement_stats is schema-only in this migration -
-- not populated by the C1 pilot (see the report).
--
-- extraction_version lets a future re-extraction pass (better prompt, fixed
-- bug) coexist with old rows until the new pass is verified, same pattern
-- as CONTENT_VERSION elsewhere in this codebase.

create extension if not exists pgcrypto;

create table if not exists cb_frameworks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  aliases jsonb not null default '[]'::jsonb,
  domain text,
  purpose text,
  structure jsonb not null default '[]'::jsonb,
  when_not_to_use text,
  worked_example text,
  related_frameworks jsonb not null default '[]'::jsonb,
  display_text text,
  source_chunk_ids jsonb not null default '[]'::jsonb,
  source_file text not null,
  school text,
  club text,
  year text,
  domain_tags jsonb not null default '[]'::jsonb,
  topic_tags jsonb not null default '[]'::jsonb,
  role_ids jsonb not null default '[]'::jsonb,
  company_tags jsonb not null default '[]'::jsonb,
  quality_score numeric,
  needs_review boolean not null default false,
  extraction_version integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists cb_guesstimates (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  approach_type text,
  assumptions jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  final_answer text,
  units text,
  difficulty text,
  display_text text,
  source_chunk_ids jsonb not null default '[]'::jsonb,
  source_file text not null,
  school text,
  club text,
  year text,
  domain_tags jsonb not null default '[]'::jsonb,
  topic_tags jsonb not null default '[]'::jsonb,
  role_ids jsonb not null default '[]'::jsonb,
  company_tags jsonb not null default '[]'::jsonb,
  quality_score numeric,
  needs_review boolean not null default false,
  extraction_version integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists cb_cases (
  id uuid primary key default gen_random_uuid(),
  case_type text,
  company_or_industry text,
  prompt text not null,
  clarifying_questions jsonb not null default '[]'::jsonb,
  structure jsonb not null default '{}'::jsonb,
  analysis_steps jsonb not null default '[]'::jsonb,
  recommendation text,
  interviewer_followups jsonb not null default '[]'::jsonb,
  difficulty text,
  display_text text,
  source_chunk_ids jsonb not null default '[]'::jsonb,
  source_file text not null,
  school text,
  club text,
  year text,
  domain_tags jsonb not null default '[]'::jsonb,
  topic_tags jsonb not null default '[]'::jsonb,
  role_ids jsonb not null default '[]'::jsonb,
  company_tags jsonb not null default '[]'::jsonb,
  quality_score numeric,
  needs_review boolean not null default false,
  extraction_version integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists cb_interview_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  question_type text,
  company text,
  role_or_domain text,
  round text,
  model_answer text,
  answer_outline jsonb not null default '[]'::jsonb,
  difficulty text,
  display_text text,
  source_chunk_ids jsonb not null default '[]'::jsonb,
  source_file text not null,
  school text,
  club text,
  year text,
  domain_tags jsonb not null default '[]'::jsonb,
  topic_tags jsonb not null default '[]'::jsonb,
  role_ids jsonb not null default '[]'::jsonb,
  company_tags jsonb not null default '[]'::jsonb,
  quality_score numeric,
  needs_review boolean not null default false,
  extraction_version integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists cb_interview_experiences (
  id uuid primary key default gen_random_uuid(),
  company text,
  role text,
  rounds jsonb not null default '[]'::jsonb,
  tips text,
  display_text text,
  source_chunk_ids jsonb not null default '[]'::jsonb,
  source_file text not null,
  school text,
  club text,
  year text,
  domain_tags jsonb not null default '[]'::jsonb,
  topic_tags jsonb not null default '[]'::jsonb,
  role_ids jsonb not null default '[]'::jsonb,
  company_tags jsonb not null default '[]'::jsonb,
  quality_score numeric,
  needs_review boolean not null default false,
  extraction_version integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists cb_concepts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  definition text,
  explanation text,
  formulas jsonb not null default '[]'::jsonb,
  examples jsonb not null default '[]'::jsonb,
  level text,
  display_text text,
  source_chunk_ids jsonb not null default '[]'::jsonb,
  source_file text not null,
  school text,
  club text,
  year text,
  domain_tags jsonb not null default '[]'::jsonb,
  topic_tags jsonb not null default '[]'::jsonb,
  role_ids jsonb not null default '[]'::jsonb,
  company_tags jsonb not null default '[]'::jsonb,
  quality_score numeric,
  needs_review boolean not null default false,
  extraction_version integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists cb_cv_and_hr_guidance (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  guidance text,
  sample_answers jsonb not null default '[]'::jsonb,
  display_text text,
  source_chunk_ids jsonb not null default '[]'::jsonb,
  source_file text not null,
  school text,
  club text,
  year text,
  domain_tags jsonb not null default '[]'::jsonb,
  topic_tags jsonb not null default '[]'::jsonb,
  role_ids jsonb not null default '[]'::jsonb,
  company_tags jsonb not null default '[]'::jsonb,
  quality_score numeric,
  needs_review boolean not null default false,
  extraction_version integer not null default 1,
  created_at timestamptz not null default now()
);

-- Schema only in C1 - NOT populated by the pilot. The pilot instead reports
-- whether any final-placement-report-style content (stipend/CTC tables by
-- school/company) exists anywhere in the active club_casebook corpus.
create table if not exists cb_placement_stats (
  id uuid primary key default gen_random_uuid(),
  school text,
  year text,
  role_or_domain_or_sector text,
  company text,
  stipend_or_ctc text,
  display_text text,
  source_chunk_ids jsonb not null default '[]'::jsonb,
  source_file text not null,
  school_src text,
  club text,
  cb_year text,
  domain_tags jsonb not null default '[]'::jsonb,
  topic_tags jsonb not null default '[]'::jsonb,
  role_ids jsonb not null default '[]'::jsonb,
  company_tags jsonb not null default '[]'::jsonb,
  quality_score numeric,
  needs_review boolean not null default false,
  extraction_version integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists cb_frameworks_domain_tags_idx on cb_frameworks using gin(domain_tags);
create index if not exists cb_guesstimates_domain_tags_idx on cb_guesstimates using gin(domain_tags);
create index if not exists cb_cases_domain_tags_idx on cb_cases using gin(domain_tags);
create index if not exists cb_interview_questions_domain_tags_idx on cb_interview_questions using gin(domain_tags);
create index if not exists cb_interview_experiences_domain_tags_idx on cb_interview_experiences using gin(domain_tags);
create index if not exists cb_concepts_domain_tags_idx on cb_concepts using gin(domain_tags);
create index if not exists cb_cv_and_hr_guidance_domain_tags_idx on cb_cv_and_hr_guidance using gin(domain_tags);

alter table cb_frameworks disable row level security;
alter table cb_guesstimates disable row level security;
alter table cb_cases disable row level security;
alter table cb_interview_questions disable row level security;
alter table cb_interview_experiences disable row level security;
alter table cb_concepts disable row level security;
alter table cb_cv_and_hr_guidance disable row level security;
alter table cb_placement_stats disable row level security;

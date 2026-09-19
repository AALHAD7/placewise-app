-- Run in the Supabase SQL editor. Backs the self-improving feedback loop:
-- every time /api/resume/feedback evaluates an answer, the question, answer,
-- and the feedback given get stored here (anonymized — no user_id). Future
-- feedback calls retrieve the most similar past examples via embedding
-- similarity and use them to calibrate — "here's how similar answers were
-- judged before" — so feedback quality improves as this table grows, without
-- training/fine-tuning any model.

create table if not exists answer_feedback_examples (
  id bigint generated always as identity primary key,
  question text not null,
  question_embedding vector(768), -- gemini-embedding-001 output dimension (truncated via outputDimensionality)
  answer text not null,
  good jsonb not null default '[]'::jsonb,
  fix jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

-- Similarity search used by /api/resume/feedback to find past feedback given
-- on questions describing a similar situation (numbers/specifics can differ).
create or replace function match_answer_feedback_examples(
  query_embedding vector(768),
  match_count int default 3
)
returns table (
  id bigint,
  question text,
  answer text,
  good jsonb,
  fix jsonb,
  similarity float
)
language sql stable
as $$
  select
    answer_feedback_examples.id,
    answer_feedback_examples.question,
    answer_feedback_examples.answer,
    answer_feedback_examples.good,
    answer_feedback_examples.fix,
    1 - (answer_feedback_examples.question_embedding <=> query_embedding) as similarity
  from answer_feedback_examples
  order by answer_feedback_examples.question_embedding <=> query_embedding
  limit match_count;
$$;

-- Deliberately NOT creating an ivfflat index yet, unlike document_chunks.
-- document_chunks is bulk-loaded with thousands of rows before its index is
-- built; this table starts at zero rows and grows one at a time from live
-- traffic. An ivfflat index built on a near-empty table clusters degenerately
-- (with `lists = 100` and a handful of rows, most clusters end up empty) and
-- a similarity search with the default probe count can come back with ZERO
-- matches even when a match plainly exists — confirmed by hand while testing
-- this migration. A plain sequential scan via the `<=>` operator (no index)
-- is fine up to tens of thousands of rows, which this table won't approach
-- for a long time. Add an ivfflat index later, once there's real volume —
-- see the commented statement below.
-- create index if not exists answer_feedback_examples_embedding_idx
--   on answer_feedback_examples using ivfflat (question_embedding vector_cosine_ops)
--   with (lists = 100);

-- This project appears to auto-enable RLS on tables created via the SQL
-- editor. The backend only ever talks to Supabase with the service-role key
-- (never a per-user token) and no other table in this schema (document_chunks,
-- news_cache, etc.) has RLS on — matching that here, rather than introducing
-- policies nothing else in the project uses.
alter table answer_feedback_examples disable row level security;

-- Fix for a migration that already ran with the ivfflat index created (drop
-- it if it exists — safe no-op otherwise):
drop index if exists answer_feedback_examples_embedding_idx;

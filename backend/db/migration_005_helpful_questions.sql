-- Run in the Supabase SQL editor. Backs the "helpful" checkbox on resume
-- interrogation questions: when a user ticks a question as helpful, it's
-- stored here (anonymized — no user_id, same as answer_feedback_examples).
-- Future question generation retrieves the most similar past
-- marked-helpful questions via embedding similarity and uses them as
-- calibration examples ("questions like these landed well before") — same
-- retrieval-based self-improvement pattern as the answer feedback loop, not
-- literal reuse of the same questions (each resume is different).

create table if not exists helpful_questions (
  id bigint generated always as identity primary key,
  question text not null,
  question_embedding vector(768), -- gemini-embedding-001 output dimension (truncated via outputDimensionality)
  category text, -- "Behavioural" | "Technical" | "Situational"
  tag text,
  level text, -- "Easy" | "Medium" | "Hard"
  created_at timestamptz default now()
);

create or replace function match_helpful_questions(
  query_embedding vector(768),
  match_count int default 6
)
returns table (
  id bigint,
  question text,
  category text,
  tag text,
  level text,
  similarity float
)
language sql stable
as $$
  select
    helpful_questions.id,
    helpful_questions.question,
    helpful_questions.category,
    helpful_questions.tag,
    helpful_questions.level,
    1 - (helpful_questions.question_embedding <=> query_embedding) as similarity
  from helpful_questions
  order by helpful_questions.question_embedding <=> query_embedding
  limit match_count;
$$;

-- Matches every other table in this schema — the backend is the only thing
-- that ever talks to Supabase (via the service_role key) and already gates
-- access with its own requireAuth middleware. See migration_004 for the RLS
-- issue this avoids up front.
alter table helpful_questions disable row level security;

-- Deliberately no ivfflat index yet — this table starts at zero rows and
-- grows one at a time from live usage. An ivfflat index built this early
-- returns zero matches even when an exact match exists (confirmed the hard
-- way in migration_004). Add one later once there's real volume:
-- create index if not exists helpful_questions_embedding_idx
--   on helpful_questions using ivfflat (question_embedding vector_cosine_ops)
--   with (lists = 100);

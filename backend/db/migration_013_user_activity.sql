-- Run in the Supabase SQL editor. Backs the home dashboard's Prep Streak,
-- Recent Activity, and Today's Plan widgets - see backend/src/lib/activity.js.
-- Deliberately per-user (unlike answer_feedback_examples/helpful_questions,
-- which are intentionally anonymized) since a streak/activity-feed is
-- inherently tied to one person's usage.

create table if not exists user_activity (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null, -- 'mock_interview' | 'resume_interrogation' | 'tone_shift' | 'framework_review' | 'story_builder'
  label text not null, -- human-readable detail, e.g. a role/company/framework name
  created_at timestamptz not null default now()
);
create index if not exists user_activity_user_idx on user_activity(user_id, created_at desc);
alter table user_activity disable row level security;

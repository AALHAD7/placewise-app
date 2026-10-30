-- Stores the AI-generated multi-day prep plan from the Home page's "Create
-- my plan" flow (see backend/src/routes/plan.js). One row per user - a
-- regenerate overwrites rather than accumulating history, matching "let the
-- user regenerate it" in the spec. Guests never reach this table: the route
-- only inserts/updates when req.user exists.
create table if not exists user_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  target_role text not null,
  domain text not null,
  interview_date date not null,
  hours_per_day smallint not null,
  days jsonb not null, -- [{ day, focus, tasks: [{ title, section, minutes }] }]
  created_at timestamptz not null default now()
);

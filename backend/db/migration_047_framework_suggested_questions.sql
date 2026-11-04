-- Run in the Supabase SQL editor. Adds a one-time-generated set of suggested
-- follow-up questions per framework (3-4 short questions a student is likely to
-- have, grounded in that framework's own description/steps/pitfalls - see
-- backend/scripts/generateFollowUpQuestions.js). Populated by that script, not
-- computed per-request like grounded_example - these don't change per student,
-- so there's no cache/staleness logic needed, just a plain column.

alter table frameworks add column if not exists suggested_questions text[];

-- Mock Interview: candidate can now ground the interviewer in their resume
-- (required) and, optionally, a job description - stored on the session row
-- (not just passed transiently to /start) so /answer's follow-up questions
-- and evaluation stay grounded in the same material throughout the session,
-- not just the opening question.
alter table mock_interview_sessions
  add column if not exists resume_text text,
  add column if not exists jd_text text,
  add column if not exists question_source text default 'resume'; -- 'resume' | 'jd' | 'both'

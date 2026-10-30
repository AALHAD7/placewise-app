-- Phase 1.6 item 2: the only table with real, structured per-role user data
-- is mock_interview_sessions.role (free text - confirmed live, no other
-- table tracks role-level progress; user_activity has no role column at
-- all, and user_plans doesn't exist in this database). Content caches
-- (role_overview_cache/role_topics_cache/skill_content_cache) need no
-- explicit migration - they're keyed by the role name string itself, so a
-- renamed role is simply a cache miss under its new name and regenerates
-- naturally; old rows under retired names are just unreferenced, not
-- migrated or deleted.
--
-- Run this SELECT first to see exactly what will change:
--   select role, count(*) from mock_interview_sessions
--   where lower(role) in ('investment banking analyst','private equity/vc analyst','business analyst (consulting)','management consultant','brand manager')
--   group by role;

update mock_interview_sessions set role = 'Investment Banking Associate' where lower(role) = 'investment banking analyst';
update mock_interview_sessions set role = 'Private Equity / VC Associate' where lower(role) = 'private equity/vc analyst';
update mock_interview_sessions set role = 'Consultant (Associate)' where lower(role) in ('business analyst (consulting)', 'management consultant');
update mock_interview_sessions set role = 'Assistant Brand Manager' where lower(role) = 'brand manager';

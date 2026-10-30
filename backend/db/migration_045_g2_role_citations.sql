-- G2 (pulled forward ahead of its normal M3 sequencing, Aalhad's explicit
-- call): Role Topics, Chip panels and Company-topic notes currently either
-- have NO casebook retrieval at all (chip panels), or already retrieve
-- casebook chunks but feed them to the model as loose, invisible "context"
-- it may or may not actually use (roleTopics.js, roleCompanyTopicNotes.js) -
-- never a visible citation, which is the exact "never blend the two
-- silently" violation the grounding policy (CLAUDE.md) forbids. This
-- migration only adds the columns needed to persist an explicit grounded/
-- not-grounded flag plus real citations, mirroring how migration_029 added
-- `sources`/`has_trusted_source` to role_overview_cache for the same
-- purpose. No existing row is read, deleted or rewritten - every new column
-- is nullable or has a safe default, and old cached rows simply read as
-- "not grounded" (content_version mismatch will regenerate them anyway, the
-- same invalidation path every other prompt change already uses).
--
-- Every statement is idempotent: running this file twice is safe.

alter table role_topics_cache
  add column if not exists grounded_in_casebooks boolean not null default false,
  add column if not exists citations jsonb not null default '[]'::jsonb;

alter table role_company_topic_notes_cache
  add column if not exists citations jsonb not null default '{}'::jsonb; -- map: topic name -> citation object, parallel to `notes`

alter table chip_panel_cache
  add column if not exists grounded_in_casebooks boolean not null default false,
  add column if not exists citation jsonb; -- single citation object or null

-- ROLLBACK (manual, only if needed; harmless to leave in place otherwise -
-- these columns have no effect until the G2 code paths read them):
--   alter table role_topics_cache drop column if exists grounded_in_casebooks;
--   alter table role_topics_cache drop column if exists citations;
--   alter table role_company_topic_notes_cache drop column if exists citations;
--   alter table chip_panel_cache drop column if exists grounded_in_casebooks;
--   alter table chip_panel_cache drop column if exists citation;

-- Verification (read the output in the SQL editor):
--   select column_name from information_schema.columns
--   where table_name = 'role_topics_cache' and column_name in ('grounded_in_casebooks','citations');
--   -- expect 2 rows

-- Phase 1 (Role page content-accuracy audit) schema changes.
--
-- content_version columns implement cache invalidation by version rather
-- than mangling the human-readable name/role/company key columns that
-- already exist (see backend/src/lib/contentVersion.js) - a version
-- mismatch is treated the same as "not fresh" by the existing TTL check, so
-- bumping CONTENT_VERSION after a prompt change makes every reader
-- regenerate without needing a destructive migration or a key-shape change.
alter table role_overview_cache add column if not exists content_version text not null default '1';
alter table role_overview_cache add column if not exists sources jsonb; -- [{title, uri}] from generateGroundedText, real grounding citations only

alter table role_company_overview_cache add column if not exists content_version text not null default '1';
alter table role_company_overview_cache add column if not exists sources jsonb;

alter table role_topics_cache add column if not exists content_version text not null default '1';

alter table skill_content_cache add column if not exists content_version text not null default '1';

-- "How this shows up by company" (amendment C): moved out of the topics
-- call entirely into its own call, keyed by (role, company), allowed only
-- when casebook RAG genuinely returns chunks that mention the company by
-- name (see roleCompanyTopicNotes.js - there is no structured company
-- column on document_chunks, so "chunks for that company" is a literal
-- text-containment check on the retrieved chunks' content, not a column
-- lookup). `notes` is a map of topic name -> note text, covering whichever
-- of the role's topics the retrieved chunks actually speak to; a topic with
-- no grounded note is simply absent from the map (section hides for it).
create table if not exists role_company_topic_notes_cache (
  id uuid primary key default gen_random_uuid(),
  role_name text not null,
  company_name text not null,
  content_version text not null default '1',
  notes jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  unique (role_name, company_name, content_version)
);

-- Chip panels (What?/Why?/How to apply), moved server-side from the old
-- client-only localStorage cache (amendment D). Company is deliberately NOT
-- part of the key: Phase 1 rule 3 makes these explanations company-agnostic
-- (the company-grounding instruction is now only in the free-form, never-
-- cached cross-question/pushback prompt, not these three).
create table if not exists chip_panel_cache (
  id uuid primary key default gen_random_uuid(),
  content_version text not null default '1',
  role_name text not null,
  topic text not null,
  block_id text not null,
  mode text not null, -- 'what' | 'why' | 'how'
  text text not null,
  arithmetic_checked boolean not null default false,
  arithmetic_consistent boolean,
  arithmetic_issue text,
  fetched_at timestamptz not null default now(),
  unique (content_version, role_name, topic, block_id, mode)
);

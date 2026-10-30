-- Phase C0.95: high-fidelity PDF re-ingestion schema. Three new tables,
-- entirely separate from the existing document_chunks/cb_* tables - nothing
-- here is read by the live app until an explicit switch-over (step 7/8 of
-- the C0.95 plan), and old chunks are never touched by this migration.
--
-- Note on migration numbering: the C0.95 doc asked for
-- "migration_037_ingestion_v2.sql", but migration_037 and migration_038
-- were already used this session (C0.9 corpus-cleanup schema and C1's
-- structured-extraction schema, both already applied). Using 039 instead to
-- avoid colliding with migrations you've already run.

create extension if not exists pgcrypto;

create table if not exists ingest_documents (
  id uuid primary key default gen_random_uuid(),
  source_file text not null unique,
  school text,
  club text,
  year text,
  source_class text not null,
  page_count integer not null,
  sha256 text not null,
  ingestion_version integer not null default 1,
  status text not null default 'pending', -- pending | done | needs_review
  created_at timestamptz not null default now()
);

create table if not exists ingest_pages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references ingest_documents(id) on delete cascade,
  page_no integer not null,
  is_text boolean not null default false,
  is_table boolean not null default false,
  is_visual boolean not null default false,
  is_scanned boolean not null default false,
  text_layer text,
  markdown text,
  docling_markdown text, -- debug field: Docling's own output, kept when Gemini vision's output is used instead for a visual page
  method text, -- docling | gemini_vision | docling+gemini
  number_coverage numeric,
  word_coverage numeric,
  unreadable_count integer not null default 0,
  needs_review boolean not null default false,
  review_status text not null default 'pending', -- pending | approved | fixed
  image_path text, -- storage path under the casebook-source bucket
  created_at timestamptz not null default now(),
  unique (document_id, page_no)
);

create table if not exists ingest_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references ingest_documents(id) on delete cascade,
  page_start integer not null,
  page_end integer not null,
  section_title text,
  content text not null,
  content_type text, -- case | guesstimate | framework | concept | question | other, nullable
  embedding vector(768), -- same model (gemini-embedding-001) and dimension as document_chunks
  parent_item_id uuid, -- set when a long item was split with overlap, so parts can be rejoined
  ingestion_version integer not null default 1,
  is_active boolean not null default false, -- stays false until the explicit switch-over
  created_at timestamptz not null default now()
);

create index if not exists ingest_pages_document_idx on ingest_pages(document_id);
create index if not exists ingest_pages_needs_review_idx on ingest_pages(needs_review);
create index if not exists ingest_chunks_document_idx on ingest_chunks(document_id);
create index if not exists ingest_chunks_is_active_idx on ingest_chunks(is_active);

-- RLS: service role and admin endpoints only, no anon/authenticated access
-- at all (these tables hold admin-only source material per the privacy
-- ground rule - original PDFs/page images are never shown to non-admins).
alter table ingest_documents enable row level security;
alter table ingest_pages enable row level security;
alter table ingest_chunks enable row level security;
-- No policies created = no anon/authenticated access by default under RLS;
-- the service-role key (used by the Python ingestion script and by
-- backend/src's supabase.js) bypasses RLS entirely, which is the only
-- access path these tables need.

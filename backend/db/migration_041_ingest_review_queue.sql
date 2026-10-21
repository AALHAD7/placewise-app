-- Phase R5 (plan 01): storage for the admin review queue.
--
-- Why:
--   Every converted casebook page (ingest_pages) needs a human check before the R9
--   switch-over. The R5 admin review queue lets Aalhad approve a page, mark it wrong with
--   a note, or approve an edited version. This migration adds:
--     1. ingest_page_reviews  - append-only history of every review action, including the
--                               edited markdown/diagrams, stored ALONGSIDE the original.
--     2. ingest_page_findings - the per-page reviewer findings from the R1/R2 review files
--                               (imported by backend/scripts/importReviewFindings.js), shown
--                               next to each page in the queue.
--     3. ingest_review_page() - one atomic RPC that writes the history row and updates
--                               ingest_pages.review_status in the same transaction.
--
-- What this migration does NOT do:
--   It deletes no rows and rewrites no existing values. It adds no column to, and changes no
--   default or constraint on, ingest_pages. The original ingest_pages.markdown / diagrams /
--   needs_review / review_reasons are never modified by anything here: the RPC updates
--   ingest_pages.review_status only. Edited content lives in ingest_page_reviews.
--   The new tables have RLS on and no policies (service role only), like the other ingest_*
--   tables, and the RPC is revoked from public/anon/authenticated.
--
-- Every statement is idempotent: running this file twice is safe.

-- 1. Append-only review history ------------------------------------------------------------
create table if not exists ingest_page_reviews (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references ingest_pages(id),
  document_id uuid not null references ingest_documents(id),
  page_no int not null,
  action text not null check (action in ('approve', 'mark_wrong', 'edit_approve', 'reopen')),
  prev_status text,
  new_status text not null,
  note text,
  edited_markdown text,
  edited_diagrams jsonb,
  reviewer_email text not null,
  created_at timestamptz not null default now()
);

create index if not exists ingest_page_reviews_page_created_idx
  on ingest_page_reviews (page_id, created_at desc);

alter table ingest_page_reviews enable row level security;

create or replace function ingest_page_reviews_block_change()
returns trigger
language plpgsql
as $$
begin
  raise exception 'ingest_page_reviews is append-only';
end;
$$;

drop trigger if exists ingest_page_reviews_append_only on ingest_page_reviews;
create trigger ingest_page_reviews_append_only
  before update or delete on ingest_page_reviews
  for each row execute function ingest_page_reviews_block_change();

-- Row triggers do not fire on TRUNCATE, so block that too.
drop trigger if exists ingest_page_reviews_no_truncate on ingest_page_reviews;
create trigger ingest_page_reviews_no_truncate
  before truncate on ingest_page_reviews
  for each statement execute function ingest_page_reviews_block_change();

-- 2. Imported reviewer findings ------------------------------------------------------------
create table if not exists ingest_page_findings (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references ingest_documents(id), -- the version that was reviewed
  ingestion_version int not null,
  source_file text not null,
  page_no int not null,
  source_name text not null,  -- e.g. 'r2_sweep_a'
  entry_key text not null,    -- stable per entry within a source file
  reviewer text,
  verdict text,
  outcome text,
  mismatch_types text[] not null default '{}',
  mismatches jsonb not null default '[]'::jsonb,
  note text,
  raw jsonb not null,
  imported_at timestamptz not null default now(),
  unique (source_name, entry_key)
);

create index if not exists ingest_page_findings_source_page_idx
  on ingest_page_findings (source_file, page_no);

alter table ingest_page_findings enable row level security;

-- 3. Atomic review action ------------------------------------------------------------------
create or replace function ingest_review_page(
  p_page_id uuid,
  p_action text,
  p_note text,
  p_markdown text,
  p_diagrams jsonb,
  p_email text,
  p_expected_status text
) returns jsonb
language plpgsql
-- Pinned search_path: unqualified names below always resolve to public, never to an
-- object planted earlier in a caller's search_path.
set search_path = public, pg_temp
as $$
declare
  v_page record;
  v_new_status text;
  v_review_id uuid;
begin
  select id, document_id, page_no, review_status
    into v_page
    from ingest_pages
   where id = p_page_id
   for update;

  if not found then
    raise exception 'page_not_found';
  end if;

  -- Every action must say which status the reviewer saw (optimistic concurrency), so a
  -- stale tab can never silently overwrite a newer decision.
  if p_expected_status is null then
    raise exception 'expected_status_required';
  end if;

  if p_expected_status is distinct from v_page.review_status then
    raise exception 'status_conflict';
  end if;

  if p_action = 'approve' then
    v_new_status := 'approved';
  elsif p_action = 'edit_approve' then
    if p_markdown is null then
      raise exception 'markdown_required';
    end if;
    v_new_status := 'fixed';
  elsif p_action = 'mark_wrong' then
    if p_note is null or btrim(p_note) = '' then
      raise exception 'note_required';
    end if;
    v_new_status := 'wrong';
  elsif p_action = 'reopen' then
    if v_page.review_status = 'pending' then
      raise exception 'already_pending';
    end if;
    v_new_status := 'pending';
  else
    raise exception 'bad_action';
  end if;

  insert into ingest_page_reviews (
    page_id, document_id, page_no, action, prev_status, new_status, note,
    edited_markdown, edited_diagrams, reviewer_email
  ) values (
    v_page.id, v_page.document_id, v_page.page_no, p_action, v_page.review_status, v_new_status,
    p_note,
    case when p_action = 'edit_approve' then p_markdown end,
    case when p_action = 'edit_approve' then p_diagrams end,
    p_email
  )
  returning id into v_review_id;

  -- Only review_status changes. markdown, diagrams, needs_review, review_reasons stay original.
  update ingest_pages set review_status = v_new_status where id = p_page_id;

  return jsonb_build_object(
    'review_id', v_review_id,
    'prev_status', v_page.review_status,
    'new_status', v_new_status
  );
end;
$$;

revoke all on function ingest_review_page(uuid, text, text, text, jsonb, text, text)
  from public, anon, authenticated;
revoke all on function ingest_page_reviews_block_change() from public, anon, authenticated;

-- ROLLBACK (manual, only if needed).
-- WARNING: dropping the tables loses every review decision and edited page. The normal undo
-- for R5 is hiding the admin API/UI (see the plan 4 log entry), NOT this rollback.
-- ingest_pages is untouched by this rollback (review_status values written by the RPC stay).
--   drop function if exists ingest_review_page(uuid, text, text, text, jsonb, text, text);
--   drop table if exists ingest_page_findings;
--   drop table if exists ingest_page_reviews;
--   drop function if exists ingest_page_reviews_block_change();  -- after the table (its triggers go with it)

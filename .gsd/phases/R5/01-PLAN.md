---
phase: R5
plan: 1
wave: 1
gap_closure: false
depends_on: []
agent: backend-engineer
files_modified:
  - backend/db/migration_041_ingest_review_queue.sql (new)
  - backend/src/lib/reviewFindings.js (new)
  - backend/scripts/importReviewFindings.js (new)
  - backend/test/reviewFindings.test.js (new)
  - Supabase: 2 new tables + 1 function (additive); ingest_page_findings rows
paid_calls: 0
---

# Plan R5.1: Review-queue schema (additive) and import of the R1/R2 reviewer findings

## Objective
Create the storage the admin review queue needs, without touching any existing row's content:
an append-only review history table (holds approvals, "wrong" notes and edited markdown/diagrams
alongside the original), a findings table, and one atomic RPC that records a review action.
Then import the per-page reviewer findings from the five local R1/R2 review files so they show
next to each page in the queue. No Gemini calls.

## Context
Read first: `CLAUDE.md` (data-safety rule), `.claude/skills/backend-conventions/SKILL.md`,
`backend/db/migration_039_ingestion_v2.sql`, `backend/db/migration_040_ingest_versioning_diagrams.sql`.

Facts you need (checked 2026-10-21):
- All commands run from the repo root `/Users/aalhad/Projects/Placement Website` unless a `cd` is shown.
- `ingest_pages` already has `review_status text default 'pending'` (comment: pending | approved | fixed;
  no CHECK constraint), `needs_review`, `review_reasons text[]`, `markdown`, `diagrams jsonb`,
  `diagram_issues jsonb`, `image_path`. All 5 FMS versions share `source_file =
  'The FMS Consulting CaseBook 2023-24 (1).pdf'`:
  v1 `67371722-c752-473e-bf12-a3710707e56c`, v2 `e6cdd69b-75be-4050-b128-d34170adcb7d`,
  v3 `129a2604-0221-4ba2-af50-42ac641a21a0`, v4 `d1510e35-9ecc-419b-a497-85a37e062792`,
  v5 `c1521f01-bcbf-4163-923d-dc501859dc31` (default queue doc; 248 pages, 173 needs_review, all pending).
- The ingest_* tables have RLS on and no policies (service role only). Keep it that way.
- Migrations are applied with psycopg from the ingestion venv (no `psql` on this machine);
  `backend/.env` has `DATABASE_URL`. Never print it.
- Review files (local, gitignored) in `backend/ingestion/out/`. Each has top-level `document_id`,
  `ingestion_version`, and a `pages` list; per-entry keys vary:
  | file | doc version | `pages` entries | other per-page data |
  |---|---|---|---|
  | `r1_review_v3.json` | v3 | 18 (page_no repeats once) | `flagged`: {issue_type: [page_no,…]} 21 entries; `undetected_error_sample.other_errors` {page: text} |
  | `r2_sweep_a.json` | v3 | 32 | – |
  | `r2_sweep_b.json` | v3 | 32 (`note`, `other_issues`) | – |
  | `r2_sample_review.json` | v4 | 40 (`outcome`, `stratum`) | – |
  | `r2_sample_v5_review.json` | v5 | 40 (`outcome`, `reasons_at_draw`) | – |
  Per-entry keys seen: `page_no, type, role, verdict, outcome, items_checked, items_detail, mismatches
  [{type,item,page_shows,stored}], checked, note, other_issues, decision, stratum, half,
  flagged_at_draw, reasons_at_draw`.

## Tasks

<task type="auto">
  <name>Write and apply migration 041 (history table, findings table, review RPC)</name>
  <files>backend/db/migration_041_ingest_review_queue.sql</files>
  <action>
    Header comment: why (R5 review queue), what it does NOT do (no row deleted or rewritten; original
    `ingest_pages.markdown`/`diagrams` are never modified by anything here), and a ROLLBACK block
    (drop the function, then the two tables; ingest_pages untouched). Say in the comment that dropping the tables
    loses review decisions, so the normal undo is hiding the API/UI (plan 4 log entry), not this rollback.

    1. `ingest_page_reviews` (append-only history):
       id uuid pk default gen_random_uuid(); page_id uuid not null references ingest_pages(id);
       document_id uuid not null references ingest_documents(id); page_no int not null;
       action text not null check (action in ('approve','mark_wrong','edit_approve','reopen'));
       prev_status text; new_status text not null; note text;
       edited_markdown text; edited_diagrams jsonb; reviewer_email text not null;
       created_at timestamptz not null default now().
       Index (page_id, created_at desc). RLS on, no policies.
       Trigger `ingest_page_reviews_append_only`: BEFORE UPDATE OR DELETE → raise exception
       'ingest_page_reviews is append-only'. (Do not use `on delete cascade` on the FKs.)
    2. `ingest_page_findings`:
       id uuid pk; document_id uuid not null references ingest_documents(id) (the version that was
       reviewed); ingestion_version int not null; source_file text not null; page_no int not null;
       source_name text not null (e.g. 'r2_sweep_a'); entry_key text not null (stable per entry, see task 2);
       reviewer text; verdict text; outcome text; mismatch_types text[] not null default '{}';
       mismatches jsonb not null default '[]'; note text; raw jsonb not null;
       imported_at timestamptz not null default now();
       unique (source_name, entry_key). Index (source_file, page_no). RLS on, no policies.
    3. Function `ingest_review_page(p_page_id uuid, p_action text, p_note text, p_markdown text,
       p_diagrams jsonb, p_email text, p_expected_status text) returns jsonb`, language plpgsql:
       - `select ... for update` the ingest_pages row; not found → raise 'page_not_found'.
       - If p_expected_status is not null and differs from current review_status → raise 'status_conflict'.
       - new_status: approve → 'approved'; edit_approve → 'fixed' (requires p_markdown not null);
         mark_wrong → 'wrong' (requires non-blank p_note); reopen → 'pending'. Unknown → raise 'bad_action'.
       - Insert the history row, then `update ingest_pages set review_status = new_status where id = p_page_id`.
         Update ONLY review_status. Never touch markdown, diagrams, needs_review or review_reasons.
       - Return jsonb {review_id, prev_status, new_status}.
       - `revoke all on function ... from public, anon, authenticated;` (service role keeps access).
    4. Apply it:
       `cd backend/ingestion && venv/bin/python -c "import psycopg,os; from dotenv import dotenv_values; c=psycopg.connect(dotenv_values('../.env')['DATABASE_URL'], autocommit=True); c.execute(open('../db/migration_041_ingest_review_queue.sql').read()); print('applied')"`
       Run it twice to prove idempotence (`create table if not exists`, `create or replace function`,
       `drop trigger if exists` before `create trigger`).

    AVOID: adding columns to or changing defaults on `ingest_pages`, because review state already
    has a column and content must stay original. AVOID: a CHECK constraint on `ingest_pages.review_status`
    (existing rows/pipeline write 'pending'; adding 'wrong' needs no constraint change).
    USE: the RPC for every write, because history row + status update must be atomic.
    If the DB connection fails, stop and report `needs_input`: Aalhad pastes the file into the
    Supabase SQL editor.
  </action>
  <verify>
    cd backend/ingestion && venv/bin/python -c "
import psycopg; from dotenv import dotenv_values
c=psycopg.connect(dotenv_values('../.env')['DATABASE_URL'])
q=lambda s:c.execute(s).fetchall()
print('tables', q(\"select tablename, rowsecurity from pg_tables where tablename in ('ingest_page_reviews','ingest_page_findings') order by 1\"))
print('policies', q(\"select count(*) from pg_policies where tablename in ('ingest_page_reviews','ingest_page_findings')\"))
print('fn', q(\"select proname from pg_proc where proname='ingest_review_page'\"))
print('anon exec', q(\"select has_function_privilege('anon','ingest_review_page(uuid,text,text,text,jsonb,text,text)','execute')\"))
print('v5 statuses', q(\"select review_status, count(*) from ingest_pages where document_id='c1521f01-bcbf-4163-923d-dc501859dc31' group by 1\"))
print('chunks', q('select count(*) from document_chunks'))"
  </verify>
  <done>
    Both tables exist with rowsecurity = true and 0 policies; function exists; anon execute = false;
    v5 statuses still `[('pending', 248)]`; document_chunks still 22457. Second apply run prints `applied` with no error.
  </done>
</task>

<task type="auto">
  <name>Pure findings normaliser + unit tests</name>
  <files>
    backend/src/lib/reviewFindings.js
    backend/test/reviewFindings.test.js
  </files>
  <action>
    Export `normaliseReviewFile(sourceName, json, sourceFile)` → array of rows shaped for
    `ingest_page_findings` (no I/O). Rules:
    1. One row per `pages[i]`: entry_key = `p${page_no}:${i}` (index keeps the duplicate r1 page distinct);
       verdict, outcome copied if present; mismatches = entry.mismatches || [];
       mismatch_types = unique `mismatches[].type`; note = join of non-empty
       `checked`, `note`, `items_detail`, `decision`, and `other_issues` (stringify arrays/objects) with " · ";
       reviewer = top-level `reviewer` (string, or its `name` if an object) else null;
       raw = the whole entry.
    2. r1-only: one row per (issue_type, page_no) in top-level `flagged`: entry_key = `flagged:${type}:${page_no}`,
       mismatch_types [type], verdict 'flagged', note "R1 review flagged this page as <type> (details not recorded per page)".
       And one row per `undetected_error_sample.other_errors` key: entry_key `other:${page}`, note = the text.
    3. Every row carries document_id, ingestion_version from the file's top level, and sourceFile.
    Tests (node:test, fixtures inline, no Supabase): duplicate page_no gives 2 distinct keys; mismatch types
    deduped; flagged map expands; missing optional keys do not throw; entry_keys are unique within a file.

    AVOID: reading files or env in this module, because tests must stay offline.
  </action>
  <verify>cd backend && node --test test/reviewFindings.test.js</verify>
  <done>All reviewFindings tests pass (paste the `# pass` / `# fail 0` lines).</done>
</task>

<task type="auto">
  <name>One-off import script; run it locally</name>
  <files>backend/scripts/importReviewFindings.js</files>
  <action>
    Node script (ES module, `import "dotenv/config"`, service-role client from `src/lib/supabase.js`).
    1. Reads the five files listed in Context from `backend/ingestion/out/` (skip with a warning if one is missing).
    2. Looks up each file's `document_id` in `ingest_documents` to get `source_file`; abort if not found.
    3. Normalises with `normaliseReviewFile`; `--dry-run` prints per-file row counts and exits.
    4. Otherwise upserts in batches of 100 with `onConflict: 'source_name,entry_key'` (re-runs update, never duplicate).
    5. Prints per-file counts and the total row count in the table afterwards.
    Run: dry run, real run, real run again (idempotence).
  </action>
  <verify>
    cd backend && node scripts/importReviewFindings.js --dry-run && node scripts/importReviewFindings.js && node scripts/importReviewFindings.js && node -e "
import('dotenv/config').then(async()=>{const {supabase:s}=await import('./src/lib/supabase.js');
const {count}=await s.from('ingest_page_findings').select('*',{count:'exact',head:true});console.log('rows',count);
for (const p of [90,236,56]){const {data}=await s.from('ingest_page_findings').select('source_name,ingestion_version,verdict,outcome,mismatch_types').eq('page_no',p);console.log(p,JSON.stringify(data));}})"
  </verify>
  <done>
    Table row count equals the dry-run total (expected ≈ 183: 18+21+other_errors from r1, 32, 32, 40, 40;
    report the exact number) and is unchanged after the second real run. Page 90 shows the v5 sample finding
    with `hallucinated`; page 236 shows `structure_lost` (v5); page 56 shows the r1 `hallucinated` flag.
  </done>
</task>

## Must-Haves
- [ ] No existing row's content changed: ingest_pages markdown/diagrams untouched, document_chunks = 22457.
- [ ] New tables are service-role only (RLS on, no policies); RPC not executable by anon/authenticated.
- [ ] Findings import is repeatable without duplicates.

## Success Criteria
- [ ] All three verify blocks pass; `cd backend && npm test` still green.
- [ ] Gemini calls: 0.

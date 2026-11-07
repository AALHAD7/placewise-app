---
phase: FIN1
plan: 03
wave: 1
depends_on: []
files_modified:
  - backend/db/migration_049_finance_source_class.sql
autonomous: true
user_setup:
  - service: supabase
    why: "Applying a SQL migration — this project's agents have previously hit a sandbox constraint reaching the Postgres port directly (see .gsd/STATE.md 'Known gaps'); if that's still true, run this file's SQL via the Supabase SQL editor instead of a direct psql/py connection."
    dashboard_config:
      - task: "Run backend/db/migration_049_finance_source_class.sql in the Supabase SQL editor (or via backend/scripts/apply_migration_0NN.py pattern if sandbox DB access now works — check by trying it first)"
        location: "Supabase Dashboard -> SQL Editor"

must_haves:
  truths:
    - "match_ingest_chunks can return rows where source_class = 'placewise_reference', without changing what it returns for any existing caller that doesn't opt in"
    - "ingest_chunks has a place to store the compendium's parsed tag metadata (domain/level/roles/keywords) without needing a future migration just to add it"
    - "Every existing call site (frameworkCatalog.js, guesstimateRetrieval.js, consultingRetrieval.js, the 3-arg and 4-arg historical versions) keeps working exactly as before"
  artifacts:
    - "backend/db/migration_049_finance_source_class.sql exists, idempotent, with a rollback block (same convention as migration_042/044)"
---

# Plan FIN1.03: Migration — widen match_ingest_chunks to a second source_class, add chunk metadata

<objective>
Two schema changes, bundled into one migration because they're both small, both additive,
and both needed before FIN1.02 can write real rows and FIN1.04 can read them back across
domains:

1. `match_ingest_chunks` currently hardcodes `d.source_class = 'club_casebook'`
   (`migration_042`/`migration_044`). Finance compendium rows will be
   `source_class = 'placewise_reference'`. Add an optional array parameter so a caller can
   opt in to both; every existing caller (which never passes it) gets byte-identical
   behavior.
2. `ingest_chunks` has no column for the compendium's per-topic tag metadata (`domain`,
   `level`, `roles`, `keywords`). Add one generic, nullable-default jsonb column rather than
   four new typed columns — cheaper to add now, and general enough that a future feature
   wanting to filter by level/role doesn't need yet another migration just to get a place to
   put the data.

Purpose: unblock FIN1.02 (needs the `metadata` column to write into) and FIN1.04 (needs the
widened RPC to read `placewise_reference` rows) without touching a single existing row's
behavior.
Output: `backend/db/migration_049_finance_source_class.sql`, applied.
</objective>

<context>
Load for context:
- `backend/db/migration_042_consulting_rag_v2.sql` — the original `match_ingest_chunks` (3-arg)
- `backend/db/migration_044_guesstimates_source_filter.sql` — the current 4-arg version
  (`query_embedding, match_count, filter_domain, filter_source_file`) and its DROP+CREATE
  pattern/reasoning (a new parameter changes the function signature; `create or replace`
  would add an overload, not replace — this migration follows the same DROP+CREATE approach)
- CLAUDE.md's "Data safety" rule — never delete/overwrite existing chunks or tables
</context>

<tasks>

<task type="auto">
  <name>Write and apply migration_049</name>
  <files>
    backend/db/migration_049_finance_source_class.sql
  </files>
  <action>
    Follow the exact structure/comment style of migration_042/044 (a "why" header comment, a
    "what this does NOT do" comment, idempotent statements, a manual ROLLBACK block in a
    comment, a verification SELECT at the end). Contents:

    1. `alter table ingest_chunks add column if not exists metadata jsonb not null default
       '{}'::jsonb;` — every existing row gets `'{}'`, zero behavior change (nothing reads
       this column yet except code FIN1.02/FIN1.04 add).
    2. `drop function if exists match_ingest_chunks(vector, integer, text, text);` then
       `create function match_ingest_chunks(query_embedding vector(768), match_count int
       default 6, filter_domain text default null, filter_source_file text default null,
       filter_source_classes text[] default null)` — identical body to migration_044's
       version except the `where` clause's
       `and d.source_class = 'club_casebook'` becomes
       `and d.source_class = any(coalesce(filter_source_classes, array['club_casebook']))` —
       `coalesce` to the single-value array exactly reproduces today's behavior for every
       caller that passes nothing for the new 5th argument, which is every caller that
       exists today (`consultingRetrieval.js`'s `retrieveConsultingChunks`,
       `frameworkCatalog.js`, `guesstimateRetrieval.js` — none of these change in this plan;
       FIN1.04 is the plan that starts passing the new argument).
    3. `revoke all on function match_ingest_chunks(vector, integer, text, text, text[]) from
       public, anon, authenticated;` (same posture as every prior version).
    4. Add a short SQL comment near the `ingest_chunks.page_start`/`page_end` columns (a
       `comment on column` statement, which is itself idempotent/safe to re-run) noting:
       "For source_class = 'placewise_reference' documents without real pages (e.g. the
       Finance compendium), these columns hold 1-based line numbers in the source markdown
       file instead of PDF page numbers — see backend/src/lib/financeCompendiumParser.js."
       This is the single place in the schema itself (not just a JS comment) that records
       the repurposing, so a future person reading the schema directly (not the code) isn't
       misled.
    5. End with a verification SELECT:
       `select proname, pronargs from pg_proc where proname = 'match_ingest_chunks';`
       (expect exactly one row, `pronargs = 5`) and
       `select column_name from information_schema.columns where table_name =
       'ingest_chunks' and column_name = 'metadata';` (expect one row).
  </action>
  <verify>
    # Apply via the Supabase SQL editor (paste the file) or, if sandbox DB access works now,
    # via whatever backend/scripts/apply_migration_0NN.py-style script is current practice.
    # Then, in the SQL editor:
    select proname, pronargs from pg_proc where proname = 'match_ingest_chunks';
    select column_name, data_type from information_schema.columns
      where table_name = 'ingest_chunks' and column_name = 'metadata';
  </verify>
  <done>
    Exactly one `match_ingest_chunks` function exists with `pronargs = 5`; `ingest_chunks`
    has a `metadata` column of type `jsonb`; running
    `select domain, source_class, count(*) from ingest_documents group by 1, 2;` still shows
    every pre-existing row's `domain`/`source_class` unchanged (no existing row touched); a
    `log.md` entry (migration type) is written per the `build-log` skill, with the exact SQL
    file path and an "Undo" line pointing at the rollback block in the file's comments.
  </done>
</task>

</tasks>

<verification>
After the task:
- [ ] `match_ingest_chunks` has 5 args, defaults reproduce the old 4-arg behavior exactly
- [ ] `ingest_chunks.metadata` column exists, default `'{}'`, every existing row unaffected
- [ ] No existing `ingest_documents`/`ingest_chunks` row changed value
- [ ] `log.md` entry written
</verification>

<success_criteria>
- [ ] Task verified passing
- [ ] Must-haves confirmed
- [ ] FIN1.02 and FIN1.04 can both proceed against the new schema
</success_criteria>

---
phase: R9
plan: 2
wave: 2
gap_closure: false
depends_on: ["1"]
agent: backend-engineer
files_modified:
  - backend/scripts/switchConsultingLive.js
  - log.md
paid_calls: 0 — pure Supabase data update, no Gemini calls
---

# Plan R9.2: Flip `is_active=true` on the 9 ingested Consulting documents — PRODUCTION DATA

## ⚠️ High-stakes: this plan writes to the shared production database
`ingest_chunks` is the **same table** the live Render backend queries the instant
`ENABLE_CONSULTING_RAG_V2` is on (plan 3). This plan only flips `is_active` — it does not
touch the flag — but the data change itself is irreversible-feeling in spirit even though
it is mechanically a one-line `UPDATE`. Treat it with the same care as a schema migration.

**Gate: do not run Task 2 of this plan unless Plan 1 (`01-PLAN.md`) recorded a PASS verdict
in `backend/eval/results/2026-11-06-r9-full.md` and `log.md`.** If it recorded FAIL, stop and
report back instead of proceeding.

## Objective
Per CLAUDE.md's data-safety rule ("New data is written alongside... until switch-over") and
the roadmap's R9 done-when ("switch flipped"), make the already-ingested, already-fidelity-
reviewed Consulting casebooks live in the data layer: `ingest_chunks.is_active = true` for
every row belonging to the 9 documents R6 completed. This does **not** make them visible to
students by itself — `match_ingest_chunks` is only reachable through routes gated by
`ENABLE_CONSULTING_RAG_V2` (plan 3) — but it is the actual, auditable "switch" the roadmap
means, done as a reversible, idempotent script rather than a one-off manual query, per
CLAUDE.md: "every switch-over must be reversible in one step."

Note: one of the 9 documents (SRCC, `ab676b81-3b29-4c35-b288-6dff71756e26`) already has all
62 of its rows `is_active=true` from an earlier, deliberately-scoped single-casebook test
(see log.md's 2026-11-02 entry, "First real `is_active=true` switch"). The script below must
be idempotent and safe to run against that pre-existing state — it should not fail or double-
count SRCC, and the rollback must revert SRCC along with the other 8 (this plan supersedes
that earlier partial test; after this plan, SRCC's state is governed by this switch, not the
earlier one-off).

Purpose: one script, runnable forward (`--apply`) and backward (`--rollback`), that is the
actual "switch" and the actual "rollback," not instructions that describe one.
Output: `backend/scripts/switchConsultingLive.js`; printed before/after row counts per
document; a log.md entry recording exactly what changed and the rollback command.

## Context
Load for context:
- CLAUDE.md "Data safety" section
- `backend/eval/run_eval_v2_preview.js` lines ~50-65 (the canonical `DOC_IDS` list for the 9
  completed documents, with a comment on why exactly these 9 and not the 2 skipped FMS
  casebooks — copy this list verbatim, do not re-derive it)
- `.gsd/STATE.md` R6 section (ingestion history, the domain-NULL bug already fixed for all 9
  documents — do not re-fix it, just confirm it's still fixed in Task 1)
- `backend/db/migration_044_guesstimates_source_filter.sql` and
  `backend/db/migration_042_consulting_rag_v2.sql` (confirms `match_ingest_chunks` hardcodes
  `where is_active = true` — this is exactly what this plan's flip controls)
- log.md's 2026-11-02 "First real `is_active=true` switch" entry (the SRCC precedent —
  same pattern this script formalizes: direct service-role client update, no migration file)

## Tasks

<tasks>

<task type="auto">
  <name>Write `switchConsultingLive.js`: idempotent apply/rollback for the 9 completed documents</name>
  <files>
    backend/scripts/switchConsultingLive.js
  </files>
  <action>
    Create a Node ES-module script (same `dotenv/config` + `@supabase/supabase-js` pattern as
    `backend/eval/run_eval_v2_preview.js`'s `supabaseAdmin()`). It must:

    1. Define the same 9 `DOC_IDS` from `run_eval_v2_preview.js` (import or copy verbatim,
       with the same inline comments on why these 9).
    2. Support three modes via `process.argv`: default (dry-run, no writes), `--apply`
       (sets `is_active=true` for all `ingest_chunks` rows where `document_id in DOC_IDS`),
       `--rollback` (sets `is_active=false` for the same set).
    3. Before any write, `SELECT document_id, is_active, count(*)` grouped by
       `(document_id, is_active)` for the 9 `DOC_IDS`, print it. This is the "before" state.
    4. Also check and print: how many `ingest_chunks` rows with `is_active=true` exist
       **outside** the 9 `DOC_IDS` (should be 0 before and after — confirms no stray
       document is ever activated by this script and nothing else activates one behind its
       back). Use a single `not.in` filter query, not a client-side diff of a full table scan.
    5. After the write (`--apply`/`--rollback` only), re-run the same before-query and print
       the "after" state, plus a one-line summary: how many rows changed.
    6. Dry-run mode (no flag) only prints the before-state and what *would* change — makes
       no write. This is the mode Task 2 runs first.
    7. Exit non-zero and print the Supabase error if any update call errors, rather than
       printing a misleading "done."

    AVOID: looping row-by-row with individual `.update()` calls — use one
    `.update({is_active: true}).in("document_id", DOC_IDS)` call per mode, matching the
    SRCC precedent's single-statement approach (log.md 2026-11-02).
  </action>
  <verify>
    node -c backend/scripts/switchConsultingLive.js
    cd backend && node scripts/switchConsultingLive.js   # dry-run, no args — must print before-state only, 0 writes
  </verify>
  <done>
    Dry-run prints a before-state table covering all 9 documents (SRCC already showing
    `is_active=true`, the other 8 showing `is_active=false`) and a count of stray-active
    rows outside the 9 (expect 0, confirming the earlier domain-NULL fix and SRCC test left
    nothing else active). No rows are modified in dry-run mode.
  </done>
</task>

<task type="auto">
  <name>Apply the switch (only if Plan 1 recorded PASS) and log it with before/after proof</name>
  <files>
    log.md
  </files>
  <action>
    Confirm Plan 1's verdict is PASS (re-read `backend/eval/results/2026-11-06-r9-full.md`'s
    top line). If FAIL, stop here, do not run `--apply`, and report that back instead of
    proceeding to this task.

    If PASS: run `node backend/scripts/switchConsultingLive.js --apply` from `backend/`.
    Capture its before/after output in full. Then independently confirm via a fresh read-only
    query (same `not.in` stray check from Task 1) that:
    - All 9 `DOC_IDS` now have 0 rows with `is_active=false` (every row of every completed
      document is active).
    - 0 `ingest_chunks` rows outside the 9 `DOC_IDS` have `is_active=true`.

    Write a log.md entry: what changed (row counts before/after per document), why (R9 eval
    passed its bar — link the scores), and the exact rollback command:
    `node backend/scripts/switchConsultingLive.js --rollback` (note: this reverts ALL 9,
    including SRCC, to `is_active=false` — flag this explicitly since SRCC was the one
    document already live before this plan ran).
  </action>
  <verify>
    cd backend && node scripts/switchConsultingLive.js   # dry-run again, now shows all 9 is_active=true, 0 stray
  </verify>
  <done>
    All 9 documents' `ingest_chunks` rows are `is_active=true`; 0 stray rows outside the 9
    are active. log.md has the before/after counts and the rollback command, dated.
  </done>
</task>

</tasks>

## Must-Haves
- [ ] Exactly the 9 documents R6 completed are active; no more, no fewer.
- [ ] The switch is a script, not a one-off manual query — re-runnable and rollback-capable
      in one command, per CLAUDE.md's "reversible in one step."
- [ ] Before/after state is proven with a real query, not assumed.
- [ ] Nothing in this plan touches `ENABLE_CONSULTING_RAG_V2` or `ENABLE_ANSWER_PARAPHRASE`
      — that is plan 3, deliberately separate so the data switch and the route-gate switch
      are each independently reversible.

## Success Criteria
- [ ] `switchConsultingLive.js` exists, dry-run/`--apply`/`--rollback` all work as described.
- [ ] log.md has the dated switch-over entry with proof and the rollback command.
- [ ] Only proceeds past Task 2 if Plan 1's verdict was PASS.

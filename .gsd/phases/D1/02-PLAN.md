---
phase: D1
plan: 02
wave: 2
gap_closure: false
depends_on: ["01"]
agent: ingestion-engineer
files_modified:
  - backend/scripts/ingestPmCompendium.js
  - backend/ingestion/out/d1_ingest_report.json
paid_calls: ~145-160 Gemini embedding calls (gemini-embedding-001, 768-d; no diagram-authoring or judge calls — see Objective)
---

# Plan D1.2: Run the PM compendium ingestion

## Objective
Wire D1.1's parser into a runnable script that embeds every chunk and writes
`ingest_documents`/`ingest_chunks` rows for `PM_Compendium.md`, then run it for real. This is
cheaper than FIN1's equivalent plan: there is no diagram-authoring step (no `generateJSON`
proposal + 3-vote faithfulness judge per chunk) because, per D1.1's Context, every diagram in
this source is already a self-describing plain-text fence + caption pair, carried through
verbatim as ordinary chunk content — there is nothing to author or verify here. The only paid
calls are the embedding calls, one per chunk (~145, plus a handful more for split parts).

Everything written stays `is_active = false` — nothing here is reachable by any student-
facing code path until a separate, later switch-over decision (Aalhad's call, same posture as
every other re-ingestion in this project — not part of D1's plans).

Output: populated `ingest_documents`/`ingest_chunks` rows (inactive); a cost/count report.

## Context
Load for context:
- `backend/src/lib/pmCompendiumParser.js` (D1.1) — read `parseCompendium`'s exact return
  shape; don't re-derive it.
- `backend/scripts/ingestFinanceCompendium.js` (FIN1.02) — this is the script to mirror
  almost line-for-line: same ABORT-on-pre-existing-row safety check, same `--dry-run` flag,
  same 768-dim embedding check, same report shape. The only real differences: (a) no
  diagram-authoring step to call per chunk, so skip FIN1.02's steps 4 (diagram authoring) and
  its related report fields (`diagramsAuthored`/`diagramsFaithful`/`diagramsDropped` — set
  these to `0`/omit them, don't fabricate placeholder diagram activity that didn't happen);
  (b) different source file, domain, metadata shape (see Decisions below).
- `backend/db/migration_049_finance_source_class.sql` — already-applied migration; no new
  migration is needed for D1 (`ingest_chunks.metadata` jsonb column and
  `match_ingest_chunks`'s 5-arg `filter_source_classes` shape already exist and work for any
  `source_class`/`domain` value, not just Finance's). Confirm this by reading the migration's
  final state, don't assume — if anything about the column/RPC shape looks
  Finance-specific when you read it, flag it rather than silently reworking around it.
- `backend/src/lib/gemini.js` — `embedTexts` (task type `RETRIEVAL_DOCUMENT`).
- `backend/src/lib/supabase.js` — the service-role client every `backend/scripts/*.js` uses.
- `backend/db/migration_019*.sql` (or equivalent — grep for `domain = 'Prodman'`) — confirms
  `'Prodman'` (not `'Product Management'`) is this project's existing domain value for this
  content area, used consistently by `frameworks.js`'s domain list and `frameworkCatalog.js`.
  D1.2's `ingest_documents.domain` MUST be `'Prodman'` to line up with that existing
  convention, not a new spelling — this matters for D1.3's Frameworks-grounding wiring to
  find these rows at all.

## Decisions
These are already made; implement them, don't re-derive them:
1. **`source_class: 'placewise_reference'`**, **`domain: 'Prodman'`**, **`school: null`**,
   **`club: null`**, **`year: '2026'`** (the compendium's own stated compile date, 6 November
   2026), **`source_file: 'PM_Compendium.md'`**, **`page_count`**: total line count of the
   source file (repurposed honestly, same as FIN1.02's step 6, with the same kind of
   column-repurposing comment in the script).
2. **`ingest_chunks` per record**: `page_start`/`page_end` = `lineStart`/`lineEnd`,
   `section_title` = `record.topic` (not `record.topicId` — `topic` is the human-readable
   label; `topicId` goes into `metadata` instead), `content` = `record.content` verbatim (no
   diagram block appended — it's already inside `content` from parsing), `content_type` =
   `record.type` (the parsed closed-set value — `concept`/`framework`/`worked-case`/etc.,
   reusing the chunk's own classification rather than collapsing everything to `'concept'`
   the way FIN1.02 did for its uniform Finance topics; this file's `type` values are already
   meaningful, and confirmed safe to pass through as-is: `ingest_chunks.content_type` is a
   plain `text` column (migration_039) with no CHECK constraint anywhere in `backend/db/`
   (confirmed by grep across every migration file during planning) — just a code-comment
   convention listing `case | guesstimate | framework | concept | question | other`, which
   this plan's richer closed-set values are a superset-compatible extension of, not a
   violation of), `embedding`, `has_diagram`: true if `record.content` contains a fenced code block
   whose first non-blank line looks like ASCII-art box-drawing or the literal pattern this
   file's own diagrams use (pragmatic heuristic: content contains a ``` fence AND the text
   "Figure" appears within ~3 lines after the closing fence, matching this file's own
   "every figure... followed by a caption" convention stated at line 300) — this is a
   best-effort flag for admin/audit visibility only, not load-bearing for any grounding
   decision (nothing in this project currently branches render behavior on `has_diagram` for
   `placewise_reference` rows the way it does for real `placewise-diagram` JSON blocks), so
   don't over-invest here; a simple heuristic with a code comment explaining its limits is
   enough. `metadata`: `{ topicId, aliases }` (jsonb — `type`/`topic` already have their own
   columns so don't duplicate them in metadata, just `topicId` and `aliases`),
   `parent_item_id` set for split parts exactly as `chunk_document`/FIN1.02 already do,
   `is_active: false` (default, don't pass it explicitly).
3. **Idempotent, one-shot, ABORT-on-existing-row** — identical posture to FIN1.02: if
   `ingest_documents` already has a `source_file = 'PM_Compendium.md'` row, print an ABORT
   message with that row's id/status and exit 1 without writing anything.

## Tasks

<task type="auto">
  <name>Build the ingestion run script</name>
  <files>
    backend/scripts/ingestPmCompendium.js
  </files>
  <action>
    Mirror `backend/scripts/ingestFinanceCompendium.js` structure, adapted per the Decisions
    above:
    1. Read `Data/Prodman Files/PM_Compendium.md`, compute its sha256.
    2. ABORT check against `ingest_documents` for `source_file = 'PM_Compendium.md'`.
    3. `parseCompendium(markdownText)` (D1.1) → records.
    4. Call `embedTexts(records.map(r => r.content), "RETRIEVAL_DOCUMENT")`. If any returned
       vector isn't 768-dim, abort with no writes (mirror FIN1.02's dimension-check exactly).
    5. Insert one `ingest_documents` row (fields per Decisions #1).
    6. Insert one `ingest_chunks` row per record (fields per Decisions #2), batched as one
       multi-row insert so a mid-run failure is detectable on the next run rather than leaving
       a document row with partial/zero chunks.
    7. Write `backend/ingestion/out/d1_ingest_report.json`:
       `{ documentId, totalRecords, chunksWritten, geminiCalls: { embedding },
       startedAt, finishedAt }` — no diagram-related fields (see Objective: nothing to author
       here).
    Support `--dry-run` (parses, computes would-be counts, makes zero Supabase writes and
    zero embedding calls — this script has no cheap-tier diagram-proposal calls to run even
    in dry-run, unlike FIN1.02, so `--dry-run` here is entirely free).
  </action>
  <verify>
    cd backend && node scripts/ingestPmCompendium.js --dry-run
  </verify>
  <done>
    `--dry-run` parses the real file via D1.1's parser, prints the would-be `ingest_documents`
    row (confirming `domain: 'Prodman'`, `source_class: 'placewise_reference'`) and
    `ingest_chunks` row count (expect 145 + the small number of split parts), and makes zero
    Supabase writes and zero Gemini calls of any kind.
  </done>
</task>

<task type="auto">
  <name>Run the ingestion for real and record the cost</name>
  <files>
    backend/ingestion/out/d1_ingest_report.json
  </files>
  <action>
    Run `node backend/scripts/ingestPmCompendium.js` for real (no `--dry-run`). This makes
    real embedding calls only (~145-160, accounting for split parts), using
    `gemini-embedding-001`. After it finishes, read back
    `backend/ingestion/out/d1_ingest_report.json` and report the real counts (don't estimate
    after the fact — use what the script actually logged, per CLAUDE.md's honesty rule).
  </action>
  <verify>
    cat backend/ingestion/out/d1_ingest_report.json
    # Then, in the SQL editor or via a one-off query:
    #   select count(*) from ingest_documents where source_file = 'PM_Compendium.md';
    #   select domain, source_class, status from ingest_documents where source_file = 'PM_Compendium.md';
    #   select count(*) from ingest_chunks c join ingest_documents d on d.id = c.document_id
    #     where d.source_file = 'PM_Compendium.md';
    # expect: 1 document row, domain='Prodman', source_class='placewise_reference',
    # status='done'; chunk count ~= 145 + split parts; every row is_active = false
  </verify>
  <done>
    `d1_ingest_report.json`'s `chunksWritten` matches the real `ingest_chunks` row count for
    this document; every written chunk has `is_active = false`; no existing row anywhere
    (any table) was deleted or overwritten; a `log.md` entry is written per the `build-log`
    skill (ingestion type, real embedding call count, rough cost against the ~$20/month
    budget, "Undo: delete nothing — `is_active` stays false; to fully undo, delete the
    `PM_Compendium.md` row from `ingest_documents` (cascades to `ingest_chunks`)").
  </done>
</task>

## Must-Haves
- [ ] `ingest_documents` has exactly one `PM_Compendium.md` row: `source_class =
      'placewise_reference'`, `domain = 'Prodman'`, `status = 'done'`
- [ ] `ingest_chunks` has one row per real chunk (145, plus split parts), all `is_active =
      false`
- [ ] No existing row anywhere was deleted or overwritten
- [ ] `log.md` has an entry with the real Gemini call count and cost

## Success Criteria
- [ ] Both tasks verified passing
- [ ] `backend/ingestion/out/d1_ingest_report.json` committed or at least referenced from the
      `log.md` entry so the numbers aren't lost

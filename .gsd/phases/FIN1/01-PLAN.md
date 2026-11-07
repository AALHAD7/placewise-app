---
phase: FIN1
plan: 01
wave: 1
depends_on: []
files_modified:
  - backend/src/lib/financeCompendiumParser.js
  - backend/src/lib/financeDiagramAuthor.js
  - backend/test/financeCompendiumParser.test.js
  - backend/test/financeDiagramAuthor.test.js
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Parsing the real finance_compendium.md produces exactly 208 topic records (modules 1-25 H3 sections only); module 26 (master glossary, interview bank) is explicitly excluded"
    - "No topic record's content exceeds MAX_CHUNK_CHARS (6000) without being split with overlap, same convention as backend/ingestion/chunk.py"
    - "A diagram is only authored when the source text itself already lays out the structure explicitly; a diagram that fails the 3-vote faithfulness judge is dropped, never shown"
  artifacts:
    - "backend/src/lib/financeCompendiumParser.js exists and is unit-tested with no network calls"
    - "backend/src/lib/financeDiagramAuthor.js exists, mirrors consultingRetrieval.js's paraphrase/faithfulness-judge pattern (3-vote majority, fail-closed)"
---

# Plan FIN1.01: Parse the compendium and build the conservative diagram-authoring gate

<objective>
Build the two pure/testable modules that plan FIN1.02's run script will use to actually
ingest `finance_compendium.md`: (1) a parser that turns the 208 real topic sections
(modules 1-25) into chunk-ready records with metadata, splitting any oversized section the
same way the existing PDF pipeline does; (2) a diagram-authoring module that only ever
proposes a `placewise-diagram` block when the source prose itself already lays out that
structure, gated by a 3-vote faithfulness judge that mirrors `consultingRetrieval.js`'s
existing paraphrase-faithfulness pattern (fail-closed: a failed/undecided vote means no
diagram, text stays as-is).

This plan writes no database rows and makes no real Gemini calls in its tests — it is
pure logic, fully unit-tested with mocks, so it is cheap and fast to get right before
FIN1.02 spends real API budget running it.

Purpose: isolate the two genuinely novel pieces of logic (markdown-H3 chunking instead of
PDF-page chunking; diagram authoring from prose instead of transcription from a page image)
so FIN1.02 is a thin, low-risk "wire it up and run it" plan.
Output: `backend/src/lib/financeCompendiumParser.js`, `backend/src/lib/financeDiagramAuthor.js`,
and their test files.
</objective>

<context>
Load for context:
- `Data Extracted from Claude Cowork/Data/Finance Files/finance_compendium.md` — the source
  file. Read it directly (don't assume the file's own intro section is accurate — it is not:
  it claims the compendium has 208 topics, which is correct ONLY for modules 1-25; module 26
  is a 26-letter master glossary (`### [26.0.A]`..`### [26.0.Z]`) plus 7 interview-bank
  category blocks (`### [26.1]`..`### [26.7]`, one of which is 17,396 chars — far larger than
  any real topic). Module 26 is explicitly OUT OF SCOPE for FIN1 (see Decisions below).
- `backend/ingestion/chunk.py` — `MAX_CHUNK_CHARS = 6000` and its split-with-overlap logic
  (`_split_long`, `_split_long_spans`, `protected_spans`) is the convention to mirror in JS,
  not reinvent. 16 of the 208 real topics exceed 6000 chars (max 7,631) and need splitting.
- `backend/src/lib/consultingRetrieval.js` — read `protectDiagramBlocks`/`restoreDiagramBlocks`
  (lines ~178-220) and the full paraphrase-faithfulness block (lines ~228-365:
  `paraphraseChunk`, `judgeParaphraseFaithfulOnce`, `faithfulMajority`,
  `judgeParaphraseFaithful`, `paraphraseAndVerify`). `financeDiagramAuthor.js` mirrors this
  exact shape (one proposal call + one pure vote-counter + a 3-vote judge wrapper + a
  cache-free top-level `authorAndVerifyDiagram` orchestrator — no cache needed here since
  this runs once per chunk during a one-off ingestion, not per live request).
- `.claude/skills/diagram-transcription/SKILL.md` — the `placewise-diagram` JSON shapes
  (issue_tree, matrix, funnel, flow, chart, table) the authoring prompt must produce.
- `backend/src/lib/gemini.js` — `generateJSON`, `generateText` (same functions
  `consultingRetrieval.js` already uses; no new Gemini wrapper needed).
</context>

<decisions>
These are already made; implement them, don't re-derive them:
1. **Scope: modules 1-25 only (208 topics).** Module 26 (master glossary + interview bank)
   is a different shape of content (short A-Z glossary entries; long multi-question
   interview-bank blocks, one 17,396 chars) that needs its own chunking design (e.g. one
   chunk per glossary letter vs per term, one chunk per interview question vs per category).
   Building that now would make this a 4+ task plan. It is flagged as explicit follow-up
   work (FIN2, not built here) — do not quietly fold it in, and do not quietly drop it from
   the roadmap; it's a known gap, not a forgotten one.
2. **`page_start`/`page_end` repurposed as source line numbers.** `ingest_chunks.page_start`/
   `page_end` are `not null integer` columns designed for real PDF page numbers. This source
   has no pages. Repurpose them to hold the 1-based line range of the H3 section (and its
   continuation, for split parts) in `finance_compendium.md` — a genuine, debuggable locator
   for admin/audit use, consistent with "school/casebook/page is still computed... for
   debugging/admin use" (CLAUDE.md). Document this repurposing in a code comment at the top
   of `financeCompendiumParser.js` so nobody later assumes these are PDF pages for this
   document (`source_class = 'placewise_reference'` is the signal to check).
3. **Metadata mapping.** Each H3's `<!-- tags: domain=...; level=...; roles=...;
   keywords=... -->` comment parses into a plain object: `{ module: <int>, topicId:
   "<M.T>", title: "<string after the ID>", domain, level, roles: [...], keywords: [...] }`.
   This becomes the record's `metadata` field, written verbatim (JSON) into the new
   `ingest_chunks.metadata` jsonb column FIN1.03 adds — this plan only needs to produce the
   object; FIN1.02 writes it.
4. **Diagram authoring is conservative by construction**, not by hoping the model declines:
   the proposal prompt must explicitly instruct the model to answer `{"diagram": null}` when
   the text doesn't already describe a concrete structure (a numbered step sequence, an
   explicit comparison table, an explicit tree/hierarchy described in prose, etc.) and to
   never invent a visual for a topic that merely sounds "frameworky." The faithfulness judge
   is the second, independent safety net — both exist; neither is a substitute for the other.
</decisions>

<tasks>

<task type="auto">
  <name>Parser: markdown H3 sections to chunk-ready records</name>
  <files>
    backend/src/lib/financeCompendiumParser.js
  </files>
  <action>
    Export `parseCompendium(markdownText)` returning an array of records:
    `{ topicId, module, title, metadata, content, lineStart, lineEnd }`.

    Steps:
    1. Split the document on module boundaries (`^## Module N` or `^## <N><letter>.`) to
       scope parsing, then within modules 1-25 only, split on `^### \[M\.T\]` headers
       (regex anchored to digits, e.g. `/^### \[(\d+)\.(\d+)\]/`) — this naturally excludes
       `### [26.0.A]`/`### [26.1]` etc. because module 26's own `## Module 26` boundary is
       never entered. Verify by running the parser against the real file and asserting
       `result.length === 208` as part of the test task below.
    2. For each H3 section, the first line after the header is always
       `<!-- tags: domain=...; level=...; roles=...; keywords=... -->` — parse it with a
       simple `key=value;` splitter (semicolon-separated, `roles`/`keywords` further split
       on `,` and trimmed). If the comment is missing or malformed for a given section,
       don't throw — record `metadata = { parseError: true, raw: <line> }` and let the
       caller (FIN1.02) decide whether to proceed or flag it; log a console.warn with the
       topicId.
    3. `title` is the text after `] ` on the H3 header line, through end of line.
    4. `content` is everything from after the tags comment to (not including) the next H3 or
       H2 header. Trim leading/trailing blank lines.
    5. Track 1-based line numbers of the H3 header (`lineStart`) and the line before the next
       header (`lineEnd`) for the repurposed-as-locator `page_start`/`page_end` (see
       Decisions #2) — don't compute real PDF pages, there are none.
    6. For any record whose `content.length > 6000`, split it the same way
       `backend/ingestion/chunk.py`'s `_split_long`/`_split_long_spans` do: cut at or before
       6000 chars, prefer a paragraph/blank-line boundary near the cut point (search
       backwards from the hard limit, same as chunk.py's `rfind("\n", ...)` approach — port
       the logic, don't just hard-truncate), carry a small overlap (reuse chunk.py's overlap
       window length) into the next part, and return multiple records sharing the same
       `topicId`/`module`/`metadata`/`title` but distinct `lineStart`/`lineEnd` and a
       `partIndex`/`partCount` pair so FIN1.02 can set `parent_item_id` consistently with how
       `chunk.py` already does for long casebook items (read `chunk_document`'s use of
       `parent_item_id` in `backend/ingestion/chunk.py` for the exact shape to match).
       AVOID inventing a different split heuristic from chunk.py's — two different "how do
       we split a long chunk" behaviors in the same codebase is a maintenance trap.
    Also export `splitLongContent(content, maxChars)` as a standalone, independently testable
    function (used by step 6) so its boundary behavior (paragraph-preferring cut, overlap
    length) can be asserted without needing a full 208-topic parse in every test.
  </action>
  <verify>
    cd backend && node -e "
      import('./src/lib/financeCompendiumParser.js').then(async (m) => {
        const fs = await import('node:fs');
        const text = fs.readFileSync('../Data Extracted from Claude Cowork/Data/Finance Files/finance_compendium.md', 'utf-8');
        const recs = m.parseCompendium(text);
        const topicIds = new Set(recs.map(r => r.topicId));
        console.log('records:', recs.length, 'distinct topicIds:', topicIds.size);
      });
    "
  </verify>
  <done>
    `topicIds.size === 208` (distinct topics from modules 1-25 only); `recs.length` is
    208 plus the number of split parts (every record's `content.length <= 6000`); no
    record's `metadata.parseError` is true for the real file (if any are, that's a real bug
    in the parser's tag-comment regex, not an acceptable gap — fix it before moving on).
  </done>
</task>

<task type="auto">
  <name>Conservative diagram authoring + 3-vote faithfulness gate</name>
  <files>
    backend/src/lib/financeDiagramAuthor.js
  </files>
  <action>
    Mirror `consultingRetrieval.js`'s paraphrase-faithfulness shape exactly, but for
    diagram authoring instead of prose rewriting. Export:

    - `proposeDiagram(topicContent)` — one `generateJSON` call (flash-lite cascade, same as
      `judgeRelevanceOnce`/`paraphraseChunk`) with a system prompt that: (a) shows the full
      topic text; (b) instructs the model to respond `{"diagram": null}` UNLESS the text
      already explicitly lays out one of the 6 `placewise-diagram` shapes (issue_tree,
      matrix, funnel, flow, chart, table — per `.claude/skills/diagram-transcription/
      SKILL.md`'s shapes) as a numbered sequence, explicit comparison, or explicit
      hierarchy in the prose; (c) if it does, respond `{"diagram": {...valid shape...},
      "summary": "<1-3 sentence plain-language summary>"}` using ONLY labels/numbers/steps
      that appear verbatim in the text — same "copy exactly, never invent/estimate/complete"
      rule as the diagram-transcription skill's page-image rules, adapted to "found in this
      prose" instead of "found on this page." Returns `null` when the model declines or the
      JSON fails to parse as one of the 6 known shapes (fail-closed — a malformed response is
      not a diagram, not an error to retry).
    - `judgeDiagramFaithfulOnce(topicContent, diagramJson)` — one `generateJSON` call, new
      prompt (separate from `FAITHFULNESS_SYSTEM_PROMPT` in consultingRetrieval.js — that one
      checks prose-vs-prose; this checks structured-JSON-vs-prose): "every label, number and
      step in this diagram JSON must appear in the source text; the diagram must not invent,
      merge, correct, or omit a labelled element the text describes." Returns
      `{ faithful: boolean, reasoning: string }`.
    - `diagramFaithfulMajority(votes)` — pure, `votes.filter(Boolean).length >= 2` (literally
      the same rule as `faithfulMajority`, kept as its own exported function per
      consultingRetrieval.js's own comment that this is unit-tested separately from the I/O).
    - `judgeDiagramFaithful(topicContent, diagramJson)` — 3-call `Promise.all` majority vote,
      each call's rejection/error treated as `false` (fail-closed, same as
      `judgeParaphraseFaithful`).
    - `authorAndVerifyDiagram(topicContent)` — orchestrator: call `proposeDiagram`; if `null`,
      return `{ diagram: null, summary: null }` (no Gemini faithfulness call spent on nothing
      proposed); if a diagram was proposed, call `judgeDiagramFaithful`; if faithful, return
      `{ diagram, summary }`; if not, return `{ diagram: null, summary: null }` — the
      text-only chunk content is used as-is and `has_diagram` stays `false`, exactly like the
      paraphrase layer falls back to verbatim on a failed faithfulness check. Wrap the whole
      thing in try/catch and fail closed to `{ diagram: null, summary: null }` on any error
      (network, parse) — an ingestion run must never crash on one topic's diagram attempt.
    AVOID calling the faithfulness judge when `proposeDiagram` returned null — that wastes a
    call checking "is nothing faithful to the text," which is meaningless and costs money for
    no signal.
  </action>
  <verify>
    cd backend && npm test -- --test-name-pattern="financeDiagramAuthor"
  </verify>
  <done>
    All tests pass with `generateJSON` mocked (no live Gemini calls in tests, same posture as
    `test/consultingRetrieval.test.js`). Three scenarios covered: (1) model declines →
    `authorAndVerifyDiagram` returns null diagram, zero faithfulness calls made; (2) model
    proposes + judge says faithful (2/3+ votes) → diagram returned; (3) model proposes + judge
    says unfaithful (majority) → diagram dropped, text-only fallback.
  </done>
</task>

<task type="auto">
  <name>Unit tests for both modules</name>
  <files>
    backend/test/financeCompendiumParser.test.js
    backend/test/financeDiagramAuthor.test.js
  </files>
  <action>
    `financeCompendiumParser.test.js`: use `node:test` (project convention — see any existing
    `backend/test/*.test.js`). Test against small inline markdown fixtures (don't read the
    real 12k-line file in unit tests — that's the manual `<verify>` check in task 1, not a
    unit test; a fixture keeps this test fast and independent of the source file ever
    changing). Cover: a normal-sized topic parses with correct topicId/module/title/metadata;
    a malformed tags comment doesn't throw (returns `parseError: true`); `splitLongContent`
    on a >6000-char fixture produces parts that each fit the limit, with overlap, and that
    rejoin (modulo the overlap) to the original text; module 26-shaped headers
    (`### [26.0.A]`, `### [26.1]`) are excluded even when present in the fixture.

    `financeDiagramAuthor.test.js`: mock `generateJSON` (same mocking approach as
    `test/consultingRetrieval.test.js` — check that file for the exact mock pattern used
    there, reuse it rather than inventing a new one). Cover the 3 scenarios listed in task 2's
    `<done>`, plus: `diagramFaithfulMajority([true,true,false])` → `true`;
    `diagramFaithfulMajority([true,false,false])` → `false`; a `generateJSON` rejection during
    `proposeDiagram` is caught and returns null (not an unhandled rejection).
  </action>
  <verify>cd backend && npm test</verify>
  <done>
    `npm test` is green, including the new test files; no new failures beyond the 3
    pre-existing ones already noted in `.gsd/STATE.md` (1 sandbox env-leak, 2
    `pickTopTextAndImage` — unrelated to this plan).
  </done>
</task>

</tasks>

<verification>
After all tasks:
- [ ] `parseCompendium` on the real file returns exactly 208 distinct `topicId`s from
      modules 1-25, module 26 excluded
- [ ] No parsed/split record exceeds 6000 chars
- [ ] `financeDiagramAuthor.js` never shows a diagram that failed its faithfulness vote
- [ ] `npm test` green
</verification>

<success_criteria>
- [ ] All 3 tasks verified passing
- [ ] Must-haves confirmed
- [ ] No regressions in existing tests
</success_criteria>

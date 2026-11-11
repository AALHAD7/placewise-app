---
phase: D1
plan: 01
wave: 1
gap_closure: false
depends_on: []
agent: ingestion-engineer
files_modified:
  - backend/src/lib/pmCompendiumParser.js
  - backend/test/pmCompendiumParser.test.js
---

# Plan D1.1: Parse `PM_Compendium.md` into chunk-ready records

## Objective
Build the one genuinely novel, testable piece FIN1 doesn't already give us for free: a
parser that turns `Data/Prodman Files/PM_Compendium.md`'s own `<!--chunk-->`-marked sections
into chunk-ready records with metadata. Unlike FIN1's Finance compendium, this source file
has NO Docling/H3-boundary guessing to do — it already carries explicit, stable chunk
markers and a closed `type` set (see the file's own "Notes for retrieval-system ingestion"
section, line 316-349) — so this plan is pure parsing + a size-split guard, nothing else.
No diagram-authoring module is needed here (unlike FIN1.01): every diagram in this file is
already a plain-text ASCII fence with a prose caption immediately after it, written to be
self-describing even if a retrieval system "strips or mangles" it (the file's own words,
line 300) — there is no `placewise-diagram` JSON to author or faithfulness-judge. Treat each
chunk's content, fence and caption included, as one opaque unit of text.

This plan writes no database rows and makes no Gemini calls — pure logic, fully unit-tested,
cheap to get right before D1.2 spends real embedding budget.

Output: `backend/src/lib/pmCompendiumParser.js`, its test file.

## Context
Load for context:
- `Data/Prodman Files/PM_Compendium.md` — the source file. Read its own "Notes for
  retrieval-system ingestion" section (line ~318-349) for the exact contract: split on
  `<!--chunk`, read `id`/`type`/`topic`/`aliases`, zero overlap, ids are stable.
- **A real gotcha in this exact file, confirmed by direct inspection — do not rediscover
  this the hard way**: the "Notes for retrieval-system ingestion" chunk's own content (chunk
  `id: meta.rag`, around line 318-349) contains a **fenced-code-block example** of what a
  chunk marker looks like, for the human reader:
  ```
  <!--chunk
  id: pm.example.section-id
  type: framework
  topic: example-topic
  aliases: example alias, another alias
  -->
  ```
  This example is itself textually indistinguishable from a real marker to a naive
  `split("<!--chunk")` — it starts at column 0, has `id:`/`type:`/`topic:`/`aliases:` lines,
  and a closing `-->`, exactly like every real marker. Splitting naively on every line-start
  `<!--chunk` occurrence produces **146** pieces (confirmed: `grep -c "^<!--chunk"` on the
  real file = 146), but **one of those 146 is this fake documentation example**, not a real
  retrievable section — so the true chunk count is **145**. The parser MUST exclude this
  fake example. The cleanest way: track whether the current scan position is inside a ` ``` `
  fenced block (the example sits inside one, real markers never do); a chunk-start match found
  while inside an open fence is not a real chunk boundary and must not start a new record —
  its characters stay as ordinary content of whatever real chunk contains it (here, the
  `meta.rag` chunk itself). Do not solve this by hardcoding a skip of `pm.example.section-id`
  by name — that's brittle to a future edit of this doc; detect it structurally (inside a
  fence) so the same logic would handle a similar example added anywhere else in the file.
- `backend/src/lib/financeCompendiumParser.js` (FIN1.01) — read for the general shape
  (record fields, `splitLongContent`'s paragraph-preferring cut-and-overlap logic) to reuse,
  NOT for its H3-boundary-detection logic, which doesn't apply here (this file's boundaries
  are the `<!--chunk` markers themselves, not markdown headings).
- `backend/ingestion/chunk.py` — `MAX_CHUNK_CHARS = 6000`, `_split_long`/`_split_long_spans`
  overlap convention — same split rule `financeCompendiumParser.js`'s `splitLongContent`
  already ports to JS; reuse that existing JS port (import it or copy its exact behavior),
  don't invent a third version. 13 of the 145 real chunks exceed 6000 chars (max ~13,142).
- `backend/db/migration_049_finance_source_class.sql` — the `ingest_chunks.metadata` jsonb
  column this parser's `metadata` field will eventually fill (D1.2's job, not this plan's).

## Decisions
These are already made; implement them, don't re-derive them:
1. **Closed `type` set**: `meta`, `concept`, `framework`, `worked-case`, `question-bank`,
   `primer`, `playbook`, `reference`, `glossary` (confirmed present in the real file: meta=8,
   concept=32, framework=43, worked-case=17, question-bank=12, primer=11, playbook=7,
   reference=15, glossary=1 — these sum to 146, i.e. still counts the fake example once; your
   parser's real output must sum to 145). If a chunk header has a `type` value outside this
   set, don't throw — record `metadata.typeWarning = true` and log a `console.warn` with the
   chunk id (same non-fatal posture as FIN1.01's malformed-tags handling), since a future doc
   edit could add a type without updating this plan.
2. **Metadata fields parsed per chunk**: `id` (topicId), `type`, `topic`, and `aliases`
   (comma-separated list, trimmed into an array; absent for many chunks — default `[]`, not
   an error). Keep the field name `topicId` for the parsed `id` value, consistent with
   `financeCompendiumParser.js`'s naming, so D1.2 and any shared test helpers read the same
   shape.
3. **No module/part number extraction required.** Unlike Finance's `M.T` numeric topic IDs,
   this file's `id` values are free-form dotted strings (e.g. `pm.role.definition`,
   `pm.design.circles`) — store the raw string as `topicId`, don't try to parse a numeric
   module out of it.
4. **`lineStart`/`lineEnd` are the repurposed-as-locator fields**, same convention as FIN1.01
   (`ingest_chunks.page_start`/`page_end` hold 1-based source line numbers for
   `source_class = 'placewise_reference'` documents, not real PDF pages) — this plan only
   needs to compute and return them; D1.2 writes them to the DB columns.
5. **Oversized chunks (>6000 chars) are split with the ported `chunk.py` overlap logic**,
   producing multiple records sharing `topicId`/`type`/`topic`/`aliases` but distinct
   `lineStart`/`lineEnd`/`partIndex`/`partCount`, exactly like FIN1.01's approach — reuse,
   don't reinvent.

## Tasks

<task type="auto">
  <name>Parser: `<!--chunk` markers to chunk-ready records, fence-aware</name>
  <files>
    backend/src/lib/pmCompendiumParser.js
  </files>
  <action>
    Export `parseCompendium(markdownText)` returning an array of records:
    `{ topicId, type, topic, aliases, content, lineStart, lineEnd, partIndex?, partCount? }`.

    Steps:
    1. Scan the text line by line, tracking fence state: a line consisting of (optionally
       leading-whitespace, then) exactly ``` ``` `` toggles `insideFence` between false/true
       (standard triple-backtick fence; this file never nests fences). A line matching
       `^<!--chunk\s*$` is only a real chunk boundary when `insideFence === false` at that
       point in the scan.
    2. At each real boundary, parse the following lines up to the closing `-->` as
       `key: value` pairs (same simple colon-splitter FIN1.01 used for its semicolon-tags
       line, adapted to this file's one-key-per-line format). Required keys: `id`, `type`,
       `topic`. Optional: `aliases` (split on `,`, trim each, else `[]`). Missing `id`/`type`/
       `topic` → don't throw; `metadata` carries `{ parseError: true, raw: <the raw comment
       block> }`, console.warn with line number, and the caller can decide whether to proceed.
    3. `content` is everything from after the closing `-->` of this chunk's marker up to (not
       including) the next REAL chunk-marker's start (or end of file for the last chunk).
       Trim leading/trailing blank lines. This naturally includes any fenced examples inside
       the content (like the `meta.rag` chunk's own documentation example) as ordinary text —
       which is correct: that example is legitimately part of the `meta.rag` chunk's own
       retrievable content, it's just not itself a second chunk boundary.
    4. Track 1-based `lineStart` (the `<!--chunk` line) and `lineEnd` (the line before the
       next real chunk marker, or EOF) for every record.
    5. For any record whose `content.length > 6000`, split it using the exact same
       paragraph-preferring cut + overlap logic as `financeCompendiumParser.js`'s
       `splitLongContent` (import and reuse that exported function directly rather than
       copying its body — it already exists and is tested; don't fork it). Produce multiple
       records sharing `topicId`/`type`/`topic`/`aliases`, distinct `lineStart`/`lineEnd` and
       `partIndex`/`partCount`.
    AVOID: hardcoding a skip of the one known example by its literal id string — detect "am I
    inside a fence" structurally, per the Context section's gotcha writeup, so the logic is
    robust to future edits of this document.
  </action>
  <verify>
    cd backend && node -e "
      import('./src/lib/pmCompendiumParser.js').then(async (m) => {
        const fs = await import('node:fs');
        const text = fs.readFileSync('../Data/Prodman Files/PM_Compendium.md', 'utf-8');
        const recs = m.parseCompendium(text);
        const topicIds = new Set(recs.map(r => r.topicId));
        const parseErrors = recs.filter(r => r.metadata && r.metadata.parseError);
        console.log('records:', recs.length, 'distinct topicIds:', topicIds.size, 'parseErrors:', parseErrors.length);
      });
    "
  </verify>
  <done>
    `topicIds.size === 145` (the real markers, fake documentation example excluded);
    `parseErrors.length === 0` on the real file (any parseError here is a real parser bug
    against this specific file, not an acceptable gap — fix before moving on); every record's
    `content.length <= 6000`; `recs.length` is 145 plus the number of split parts (expect a
    small number, since only 13 of the 145 chunks exceed 6000 chars in the real file).
  </done>
</task>

<task type="auto">
  <name>Unit tests, including the fenced-example regression test</name>
  <files>
    backend/test/pmCompendiumParser.test.js
  </files>
  <action>
    `node:test`, project convention (see any existing `backend/test/*.test.js`). Use small
    inline markdown fixtures — don't read the real 6,716-line file in a unit test (that's the
    manual `<verify>` check in task 1). Cover:
    1. A normal chunk parses with correct `topicId`/`type`/`topic`/`aliases`.
    2. A chunk with no `aliases` line parses with `aliases: []`, not an error.
    3. A malformed marker (missing `id`) doesn't throw — returns a record (or is dropped,
       your call, but documented) with `metadata.parseError: true`.
    4. **The regression test for the exact bug this plan exists to avoid**: a fixture
       containing one real chunk whose content includes a fenced code block with a
       `<!--chunk ... -->`-shaped example inside it (mirror the real file's `meta.rag`
       example verbatim) must parse as exactly ONE chunk, not two — assert
       `parseCompendium(fixture).length === 1` and that the one record's `content` contains
       the fenced example text as ordinary content.
    5. `splitLongContent` reuse: a >6000-char fixture produces parts that each fit the limit,
       with overlap, that rejoin (modulo overlap) to the original text — this can be a thin
       wrapper test confirming `pmCompendiumParser.js` actually calls the imported
       `financeCompendiumParser.js` function rather than reimplementing it (e.g. spy/mock, or
       just assert identical output to calling `splitLongContent` directly on the same input).
  </action>
  <verify>cd backend && npm test</verify>
  <done>
    `npm test` is green, including the new test file; no new failures beyond the 3
    pre-existing ones already noted in `.gsd/STATE.md` (1 sandbox env-leak, 2
    `pickTopTextAndImage` — unrelated to this plan). Test 4 (the fenced-example regression)
    passes.
  </done>
</task>

## Must-Haves
- [ ] `parseCompendium` on the real file returns exactly 145 distinct `topicId`s
- [ ] The fenced documentation example is never parsed as a second chunk
- [ ] No parsed/split record exceeds 6000 chars
- [ ] `npm test` green

## Success Criteria
- [ ] Both tasks verified passing
- [ ] No regressions in existing tests

---
phase: FIN1
plan: 04
wave: 2
depends_on: ["03"]
files_modified:
  - backend/src/lib/consultingRetrieval.js
  - backend/src/lib/qaRetrieval.js
  - backend/test/consultingRetrieval.test.js
  - backend/test/qaRetrieval.test.js
  - CLAUDE.md
autonomous: true
user_setup: []

must_haves:
  truths:
    - "A Finance question with no Consulting match can still be answered from the compendium via Q&A, once chunks are active — reachability is wired now even though switch-over isn't"
    - "Frameworks and Guesstimates are untouched by this plan — they keep querying club_casebook-only, Consulting-only, exactly as today (deliberate, not an oversight)"
    - "CLAUDE.md's grounding policy documents the new second source class as a recorded decision, same style as its existing 2026-11-02 notes"
  artifacts:
    - "retrieveConsultingChunks/groundedConsultingLookup accept an optional sourceClasses param, forwarded to match_ingest_chunks's 5th argument, defaulting to null (today's exact behavior)"
    - "qaRetrieval.js's groundedQaAnswer passes { domain: null, sourceClasses: ['club_casebook','placewise_reference'] }"
---

# Plan FIN1.04: Wire Q&A to search both source classes, document the policy change

<objective>
Make the Finance compendium's chunks reachable through free-form Q&A once they're active,
without touching Frameworks or Guesstimates (both stay scoped to Consulting club casebooks
exactly as today — a deliberate scope limit, not a gap). Also record, in CLAUDE.md, the
policy decision this plan implements: a second source class exists for curated non-casebook
reference material, shown identically to casebook content on screen, distinguished only
internally by `source_class`.

Purpose: close the "ingested but unreachable" gap — today, nothing in the retrieval code
would ever surface a `placewise_reference` row even after FIN1.02/FIN1.03, because
`qaRetrieval.js` hardcodes `domain: "Consulting"` and the (pre-FIN1.03) RPC hardcoded
`club_casebook`.
Output: widened Q&A retrieval, with the policy decision written down where CLAUDE.md's
other grounding-policy decisions already live.
</objective>

<context>
Load for context:
- `backend/src/lib/consultingRetrieval.js` — `retrieveConsultingChunks` (line ~59),
  `groundedConsultingLookup` (line ~391). Note the file name is Consulting-specific from R7;
  this plan extends its functions to be domain-agnostic without renaming the file (renaming
  is a larger, separate cleanup — leave a one-line comment noting the mismatch instead of
  silently renaming mid-plan).
- `backend/src/lib/qaRetrieval.js` — `groundedQaAnswer` (the only call site this plan
  changes). `frameworksGrounding.js` and `guesstimateRetrieval.js` are explicitly NOT in
  `files_modified` — do not touch them.
- `backend/db/migration_049_finance_source_class.sql` (FIN1.03) — the new 5th
  `filter_source_classes` argument on `match_ingest_chunks`.
- `backend/src/lib/consultingRetrieval.js`'s `RELEVANCE_SYSTEM_PROMPT` (lines ~89-111) — this
  is the existing safety net against cross-domain false positives: it already explicitly
  judges "is this excerpt about the SPECIFIC thing asked, not just same-category vocabulary."
  Read it before deciding whether dropping the domain filter is risky — it's the reason this
  plan's design note below says the risk is bounded, not eliminated.
- CLAUDE.md's "Grounding policy" section — read the existing 2026-11-02 decision notes'
  exact style/tone before adding a new one.
</context>

<tasks>

<task type="auto">
  <name>Thread sourceClasses through consultingRetrieval.js</name>
  <files>
    backend/src/lib/consultingRetrieval.js
    backend/test/consultingRetrieval.test.js
  </files>
  <action>
    1. `retrieveConsultingChunks(queryText, { domain, matchCount = 6, sourceFile,
       sourceClasses } = {})` — add `sourceClasses` to the destructured options and pass it
       through to the `match_ingest_chunks` RPC call as `filter_source_classes:
       sourceClasses || null`. No other line changes; every existing call site that doesn't
       pass `sourceClasses` gets `null`, which (per FIN1.03's migration) reproduces today's
       `club_casebook`-only behavior exactly.
    2. `groundedConsultingLookup(queryText, { domain = "Consulting", matchCount = 6,
       sourceFile, paraphrase = false, sourceClasses } = {})` — add `sourceClasses` to the
       destructure and forward it into the `retrieveConsultingChunks` call inside. Nothing
       else in the function changes — the relevance gate, the paraphrase gate, and the
       `buildCitation` shape all stay exactly as they are regardless of which source classes
       were searched.
    3. Add a one-line comment above `groundedConsultingLookup`'s signature noting: "File name
       is a holdover from R7 (Consulting-only); this function is domain- and
       source-class-agnostic as of FIN1 — see qaRetrieval.js's cross-domain Q&A call."
    AVOID changing `AI_FALLBACK_LABEL`, `decideCoverage`, `buildCitation`, or any of the
    paraphrase/faithfulness functions — none of them need to know or care which source
    classes were searched; that's purely a retrieval-query concern, decided before any of
    those functions run.
  </action>
  <verify>cd backend && npm test -- --test-name-pattern="consultingRetrieval"</verify>
  <done>
    New test: calling `retrieveConsultingChunks` with `sourceClasses: ['club_casebook',
    'placewise_reference']` calls the mocked `supabase.rpc` with
    `filter_source_classes: ['club_casebook', 'placewise_reference']`; calling it with no
    `sourceClasses` calls the RPC with `filter_source_classes: null`. All pre-existing
    `consultingRetrieval.test.js` tests still pass unmodified (proves the default path is
    untouched).
  </done>
</task>

<task type="auto">
  <name>Widen Q&A to search across domains and both source classes</name>
  <files>
    backend/src/lib/qaRetrieval.js
    backend/test/qaRetrieval.test.js
  </files>
  <action>
    In `groundedQaAnswer`, change the `groundedConsultingLookup` call from
    `{ domain: "Consulting", matchCount: 6, paraphrase: true }` to
    `{ domain: null, matchCount: 6, paraphrase: true, sourceClasses: ["club_casebook",
    "placewise_reference"] }`. Add a comment explaining the design call, in the same spirit
    as this file's existing comments: dropping the domain filter for Q&A (and only Q&A —
    Frameworks and Guesstimates keep their domain/source-file scoping) relies on the
    similarity threshold plus the existing 3-vote relevance judge
    (`RELEVANCE_SYSTEM_PROMPT`'s explicit "same-category vocabulary isn't enough" rule) to
    reject a Consulting question matching a Finance chunk, or vice versa, rather than adding
    a second Gemini call to classify the question's domain first — not yet justified by
    evidence (no eval has shown the relevance judge failing this way; FIN1.05's eval is the
    first real signal on this specific risk, and the roadmap can revisit if it regresses).
    This is a one-line, fully reversible change (revert the options object) if the FIN1.05
    eval shows cross-domain leakage.
  </action>
  <verify>cd backend && npm test -- --test-name-pattern="qaRetrieval"</verify>
  <done>
    New/updated test asserts `groundedQaAnswer` calls `groundedConsultingLookup` with
    `domain: null` and `sourceClasses` including both `'club_casebook'` and
    `'placewise_reference'` (mock `groundedConsultingLookup`, same pattern as existing
    `qaRetrieval.test.js` mocks). `npm test` green overall, no regressions.
  </done>
</task>

<task type="auto">
  <name>Record the policy decision in CLAUDE.md</name>
  <files>
    CLAUDE.md
  </files>
  <action>
    In the "Grounding policy" section, add one new bullet in the same style as the existing
    "Decided 2026-11-02 (Aalhad's call)" notes, e.g.:

    "- **Second source class, same presentation.** Decided 2026-11-06: in addition to
    `club_casebook`, a second `source_class` value — `placewise_reference` — exists for
    curated reference material built for RAG (not sourced from a specific club's casebook;
    first use: the Finance reference compendium, `.gsd/phases/FIN1/`). Students see
    `placewise_reference` content presented identically to `club_casebook` content — no
    visible label distinguishes them, consistent with the no-per-answer-source-line decision
    above. `source_class` stays accurate internally for Aalhad's own tracking/audit; the
    per-answer AI-fallback disclosure (casebooks don't cover this, general answer) is
    unaffected and still applies whenever NEITHER source class covers a question."

    Place it directly after the existing bullet list in "Grounding policy" that ends with
    "Below the similarity threshold, show nothing rather than a loosely related excerpt." —
    don't bury it in a different section (Sources, Data safety) where Aalhad's note-style
    reviewers wouldn't expect to find a grounding-policy decision.
  </action>
  <verify>grep -n "placewise_reference" CLAUDE.md</verify>
  <done>
    CLAUDE.md's Grounding policy section contains the new bullet, in the same bullet style
    as the existing decision notes; `git diff CLAUDE.md` shows only an addition, no existing
    line changed.
  </done>
</task>

</tasks>

<verification>
After all tasks:
- [ ] `npm test` green, new tests cover both the default (unchanged) and widened
      (`sourceClasses` passed) paths
- [ ] `qaRetrieval.js` is the only retrieval call site widened; `frameworksGrounding.js` and
      `guesstimateRetrieval.js` are unmodified (`git diff --stat` confirms)
- [ ] CLAUDE.md documents the new source class decision
</verification>

<success_criteria>
- [ ] All 3 tasks verified passing
- [ ] Must-haves confirmed
- [ ] No regressions in `npm test`
</success_criteria>

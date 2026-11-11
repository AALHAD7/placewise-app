---
phase: D1
plan: 03
wave: 2
gap_closure: false
depends_on: ["01"]
agent: rag-engineer
files_modified:
  - backend/src/lib/frameworksGrounding.js
  - backend/test/frameworksGrounding.test.js
  - CLAUDE.md
---

# Plan D1.3: Wire Frameworks to the PM domain; confirm Q&A needs no change

## Objective
Unlike FIN1 (which deliberately left Frameworks untouched, scoping its new source class to
Q&A only and flagging the Frameworks taxonomy expansion as D2 follow-up work), D1's roadmap
row explicitly requires "Frameworks/Q&A show PM content with citations." Do the smaller of
the two jobs this implies:

1. **Frameworks**: `findGroundingV2` in `frameworksGrounding.js` currently only runs for
   `fw.domain === "Consulting"`. Widen that gate to also cover `fw.domain === "Prodman"`
   (the existing domain value for Product Management rows — confirmed via
   `migration_019*.sql`'s `domain = 'Prodman'` seeding and `frameworks.js`'s domain list), and
   pass `sourceClasses: ["club_casebook", "placewise_reference"]` so it can find D1.2's
   compendium rows once they're active (there is no PM `club_casebook` data in `ingest_chunks`
   yet — this plan does not re-ingest the PM PDFs, per the roadmap's explicit 2026-11-11
   scope narrowing — but passing both source classes costs nothing and is future-proof for
   whenever PM club casebooks are added).
2. **Q&A**: confirm, don't re-build — `qaRetrieval.js`'s `groundedQaAnswer` already calls
   `groundedConsultingLookup` with `domain: null, sourceClasses: ["club_casebook",
   "placewise_reference"]` (FIN1.04 already made Q&A domain-agnostic across both source
   classes, generically, not Finance-specifically). A PM question is therefore ALREADY
   reachable via Q&A the moment D1.2's rows go active — no code change needed. This plan's
   job for Q&A is to add one regression test proving this (so a future change can't silently
   narrow it back to Finance-only or re-add a domain filter without a test failing), not to
   touch `qaRetrieval.js` itself.

Both halves stay behind the existing `is_active = false` gate (D1.2) and the existing
`ENABLE_CONSULTING_RAG_V2` flag for Frameworks — nothing here makes PM content visible to a
student until D1.2's rows are separately switched active (a later, Aalhad-gated decision,
same posture as every other switch-over in this project, e.g. R9).

## Context
Load for context:
- `backend/src/lib/frameworksGrounding.js` — `findGroundingV2`, `findGrounding`,
  `CONSULTING_RAG_V2_ENABLED` (read the full file; the gate to widen is the
  `fw.domain === "Consulting"` check inside `findGrounding`).
- `backend/src/lib/consultingRetrieval.js` — `groundedConsultingLookup`'s signature
  (`domain`, `matchCount`, `sourceFile`, `paraphrase`, `sourceClasses`, `excludeSourceFiles`)
  — already supports everything this plan needs; no change to this file.
- `backend/src/lib/qaRetrieval.js` — `groundedQaAnswer`'s existing call (already widened by
  FIN1.04); read it to confirm the exact current options object before writing the
  regression test, don't assume.
- `backend/src/routes/frameworks.js` (line ~42) — confirms `domain: "Prodman"` is the
  existing seeded domain value and its subdomains (`Metrics & Growth`, `Prioritization`,
  `Product Design`) — this plan does not add new frameworks or subdomains, just widens which
  domain's rows can be grounded via the v2 path.
- `backend/test/frameworksGrounding.test.js` — existing test file and mocking pattern to
  extend, not replace.
- CLAUDE.md's "Grounding policy" section — read the existing `placewise_reference` bullet
  (added by FIN1.04) before adding anything; this plan likely only needs a small addition
  noting Frameworks now also draws on it for Prodman, not a new policy decision from scratch.

## Decisions
1. **Generalize the gate, don't special-case a second domain string inline.** Replace
   `fw.domain === "Consulting"` with a check against a small exported allowlist (e.g.
   `const RAG_V2_DOMAINS = ["Consulting", "Prodman"]`) so a future domain (Finance, once D2
   decides to wire Frameworks for it) is a one-line addition, not a repeat of this plan's
   diff. Keep `CONSULTING_RAG_V2_ENABLED`'s name as-is (renaming the flag is a bigger, separate
   cleanup, same "leave a comment, don't silently rename" posture FIN1.04 used for
   `consultingRetrieval.js`'s own filename mismatch).
2. **No `excludeSourceFiles` needed for Prodman** — the SRCC Guesstimates Book exclusion in
   `findGroundingV2` was Consulting-specific (that book is `domain: "Consulting"`); Prodman
   queries never retrieve it since `filter_domain` already scopes to `"Prodman"` when present.
   Don't add a Prodman-specific exclusion unless a real false-positive shows up later.
3. **The query string building (`${fw.name} framework diagram case study real example
   application ${fw.subdomain || fw.role || ""}`) is unchanged** — it already uses `fw.name`/
   `fw.subdomain` generically, no Consulting-specific wording in it.

## Tasks

<task type="auto">
  <name>Widen the Frameworks v2 grounding gate to Prodman</name>
  <files>
    backend/src/lib/frameworksGrounding.js
    backend/test/frameworksGrounding.test.js
  </files>
  <action>
    1. Add `const RAG_V2_DOMAINS = ["Consulting", "Prodman"];` near
       `CONSULTING_RAG_V2_ENABLED`, with a one-line comment: "Consulting (R7) and Prodman (D1)
       — domains with real ingest_chunks data to ground against via the v2 path; a domain not
       in this list keeps using the v1 (document_chunks) fallback below."
    2. In `findGrounding`, change `if (CONSULTING_RAG_V2_ENABLED && fw.domain === "Consulting")`
       to `if (CONSULTING_RAG_V2_ENABLED && RAG_V2_DOMAINS.includes(fw.domain))`.
    3. In `findGroundingV2`, change the `groundedConsultingLookup` call's `domain: "Consulting"`
       to `domain: fw.domain` (it's already being called from a context that has the real
       `fw.domain` available; hardcoding `"Consulting"` was only ever correct because it was
       the only caller) and add `sourceClasses: ["club_casebook", "placewise_reference"]`.
    4. Keep the `excludeSourceFiles: [GUESSTIMATES_SOURCE_FILE]` argument as-is (harmless
       no-op for a Prodman query, since that file is Consulting-domain only).
    AVOID: adding a second, Prodman-specific lookup function that duplicates
    `findGroundingV2` — the whole point of generalizing the gate is that one function now
    serves both domains correctly.
  </action>
  <verify>cd backend && npm test -- --test-name-pattern="frameworksGrounding"</verify>
  <done>
    New test: a framework row with `domain: "Prodman"` and `CONSULTING_RAG_V2_ENABLED=true`
    (mock the env/flag the same way existing tests do) calls the mocked
    `groundedConsultingLookup` with `domain: "Prodman"` and `sourceClasses` including both
    `"club_casebook"` and `"placewise_reference"`. A framework row with `domain: "HR"` (not in
    `RAG_V2_DOMAINS`) still falls through to the v1 `document_chunks` path, proving the gate is
    a real allowlist, not accidentally wide-open. All pre-existing
    `frameworksGrounding.test.js` tests (including the existing Consulting-domain ones) still
    pass unmodified.
  </done>
</task>

<task type="auto">
  <name>Regression test: Q&A already reaches PM content, no code change needed</name>
  <files>
    backend/test/frameworksGrounding.test.js
  </files>
  <action>
    Add this test to whichever existing test file already covers `qaRetrieval.js`'s call
    shape (read `backend/test/qaRetrieval.test.js` first — if FIN1.04 already wrote a test
    asserting `sourceClasses` includes `'club_casebook'` and `'placewise_reference'` and
    `domain: null`, that existing test already proves this and no new test is needed; only
    add one if no existing test currently locks in this exact shape). If you add one: mock
    `groundedConsultingLookup` and assert `groundedQaAnswer` calls it with
    `domain: null` and a `sourceClasses` array containing both `'club_casebook'` and
    `'placewise_reference'` — same assertion FIN1.04 already wrote, duplicated here only if
    missing, so a future regression (e.g. someone "fixing" Q&A back to `domain: "Consulting"`
    without realizing it would silently cut off every non-Consulting domain including PM)
    fails a test immediately.
  </action>
  <verify>cd backend && npm test -- --test-name-pattern="qaRetrieval"</verify>
  <done>
    `qaRetrieval.test.js` has (pre-existing or newly added) coverage proving
    `groundedQaAnswer` searches `domain: null` across both source classes; `npm test` green.
    `qaRetrieval.js` itself is NOT in this plan's `files_modified` and should show zero diff
    (`git diff --stat backend/src/lib/qaRetrieval.js` is empty) — this task only adds/confirms
    a test, per the Objective's "confirm, don't re-build."
  </done>
</task>

<task type="auto">
  <name>Note the Frameworks extension in CLAUDE.md</name>
  <files>
    CLAUDE.md
  </files>
  <action>
    In the "Grounding policy" section, directly after the existing "Second source class, same
    presentation" bullet (added by FIN1.04), add one sentence (not a new bullet, to avoid
    bloating the section — append to the end of that existing bullet's text) noting: "Decided
    2026-11-11 (D1): unlike Finance (FIN1), which scoped `placewise_reference` to Q&A only,
    Product Management's compendium is also wired into the Frameworks page's grounded-example
    lookup (`frameworksGrounding.js`), since D1's roadmap scope required it — Finance's
    equivalent Frameworks wiring remains D2 follow-up work, not done here."
  </action>
  <verify>grep -n "D1" CLAUDE.md</verify>
  <done>
    CLAUDE.md's Grounding policy section documents this decision; `git diff CLAUDE.md` shows
    only an addition to the existing bullet, no line removed or altered elsewhere.
  </done>
</task>

## Must-Haves
- [ ] Frameworks' v2 grounding path works for `domain: "Prodman"`, not just `"Consulting"`
- [ ] A domain not in the allowlist still falls back to the v1 path (no accidental wide-open
      gate)
- [ ] Q&A's existing cross-domain reach is proven by a test, with zero diff to `qaRetrieval.js`
- [ ] CLAUDE.md documents the Frameworks-for-PM decision
- [ ] `npm test` green; no code path here can show PM content to a student before D1.2's
      rows are separately switched active

## Success Criteria
- [ ] All three tasks verified passing
- [ ] No regressions in `npm test`

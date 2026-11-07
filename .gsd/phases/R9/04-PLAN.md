---
phase: R9
plan: 4
wave: 4
gap_closure: false
depends_on: ["3"]
agent: qa-tester
files_modified:
  - log.md
paid_calls: 0 (student-style browsing/API calls against the already-switched production service; no new Gemini calls initiated beyond what real usage triggers)
---

# Plan R9.4: QA on the live site, then actually exercise the rollback once — PRODUCTION

## ⚠️ High-stakes: Tasks 2-3 flip production flags off and back on for real
This is the literal "rollback tested" done-when from the roadmap — not rollback
instructions that are written and never run. Task 2 flips the Render flags off and proves
the old behavior returns; Task 3 flips them back on and proves grounded behavior is
restored, matching Plan 3's verification exactly. Both are human-action checkpoints for the
same reason as Plan 3 (`RENDER_API_KEY` stays read-only by this project's convention).

## Objective
Test the live, switched-on site the way a student would — Frameworks, Guesstimates, Q&A —
on the real production URLs, then prove the one-step rollback actually works by running it
once, confirming it, and restoring the live state.

Purpose: close the roadmap's three done-when items for R9 together: "no regressions" (already
gated by Plan 1), "switch flipped" (Plan 2+3), and **"rollback tested"** (this plan, for real).
Output: QA screenshots (desktop + phone) from the live site; a log.md entry proving the
rollback round-trip with real before/off/after evidence.

## Context
Load for context:
- `.gsd/phases/R8/03-PLAN.md` (the prior live-adjacent QA checklist this plan reuses —
  diagram rendering, citation absence, AI-fallback label, markdown rendering)
- CLAUDE.md "Grounding policy" and "Diagrams" sections (what must never leak: raw Storage
  URLs, per-answer source lines; what must always show: the "not from the casebooks" label
  for `covered:false` questions)
- Plan 3's log.md entry (the exact rollback step this plan executes)
- Production URLs: frontend `https://placewise-io.vercel.app`, backend
  `https://placement-mastery-hub-api.onrender.com`
- `backend/src/lib/chipPanel.js`, `roleTopics.js`, `companyTimeline.js`,
  `companyValueChain.js`, `roleCompanyTopicNotes.js` (confirmed via manual eng read, not
  assumed: `ENABLE_CONSULTING_RAG_V2` is already shared, by Aalhad's own explicit design,
  across Frameworks/Guesstimates/Q&A **and** Role/Company surfaces — "one question (is the
  Consulting ingest_chunks pipeline live), not independent toggles," per `chipPanel.js`'s
  own comment. None of this is R9 eval scope and all of it fails gracefully (falls through
  to today's plain-Gemini generation on any lookup miss or error, never blocks or crashes),
  but flipping the flag in Plan 3 turns grounding on for these surfaces too, live, with zero
  eval coverage from Plan 1 — Task 1 below includes a short smoke-check for exactly this
  reason, not because it's broken, but because "no regressions" should include surfaces the
  flag touches even when they're outside R9's formal scope)

## Tasks

<tasks>

<task type="auto">
  <name>QA the live, switched-on site like a student (desktop + phone)</name>
  <files>
    log.md
  </files>
  <action>
    Using `/qa-only` (or `/browse` for interactive flows) against the real production
    frontend `https://placewise-io.vercel.app` — not localhost — check:
    1. **Frameworks:** open several Consulting frameworks; confirm diagrams render via the
       shared `PlacewiseDiagram` component, grounded excerpts are paraphrased prose (not a
       visible verbatim casebook sentence), no per-answer "source" line appears, no raw
       admin Storage URL appears anywhere in the page HTML or network responses (`grep` the
       HTML/XHR payloads for `storage/v1` or similar Supabase Storage path patterns).
    2. **Guesstimates:** confirm a real grounded guesstimate problem loads (not
       `feature_disabled`), paraphrased, with the differentiated "not available" messaging
       (R8) still correct for any edge case.
    3. **Q&A (`/qa`):** ask a known `covered:true` question — confirm a grounded, paraphrased
       answer, markdown renders correctly (no raw `###`/`**`, the R8 `MiniMarkdown` fix).
       Ask a known `covered:false` question — confirm the "AI-generated — not from the
       casebooks" label appears via `GroundingNote`, clearly, every time.
    4. **Blast-radius smoke-check (not a full QA pass, just "did this break"):** open one
       Company page and one Role page — `ENABLE_CONSULTING_RAG_V2` is the *same* flag that
       gates `chipPanel.js`/`roleTopics.js`/`companyTimeline.js`/`companyValueChain.js` (G2/
       G3 work pulled forward ahead of its M3 slot, by Aalhad's own design — see Context).
       Confirm both pages still load without error and, if a grounded citation/excerpt
       appears, it doesn't leak a raw Storage URL or break the page layout. This is a smoke
       check, not a correctness eval — Role/Company grounding quality is G2/G3's job, not
       R9's; the only thing in scope here is "the shared flag didn't break something R9
       didn't mean to touch."
    5. Screenshot desktop and ~375px-wide phone viewport for Frameworks, Guesstimates and Q&A.
    Record every finding (pass or fail) in log.md, dated, titled "R9 QA: live site". If any
    High-severity bug is found (privacy leak, missing fallback label, broken render), stop
    and report it rather than proceeding to Task 2 — a rollback test on a broken switch-over
    doesn't help Aalhad.
  </action>
  <verify>
    (Screenshots saved and referenced in the log.md entry; curl checks for leaked storage
    URLs return no matches:)
    curl -s https://placement-mastery-hub-api.onrender.com/api/qa/ask -X POST -H "Content-Type: application/json" -d '{"question":"<a covered:true question>"}' | grep -i "storage/v1" ; echo "exit $?"
  </verify>
  <done>
    log.md has a dated QA entry covering all three features, desktop+phone, with explicit
    pass/fail per check. No High-severity bug is open. If one was found, this plan stops
    here and reports it instead of proceeding.
  </done>
</task>

<task type="checkpoint:human-action">
  <name>Rollback: flip both flags off on Render, confirm old behavior returns</name>
  <files>
    log.md
  </files>
  <action>
    Hand Aalhad the exact rollback step from Plan 3's log.md entry: Render dashboard →
    `placewise-api` → Environment → set `ENABLE_CONSULTING_RAG_V2` and
    `ENABLE_ANSWER_PARAPHRASE` both to `false` → Save → wait for redeploy to show "Live".
    Once confirmed, the agent re-runs the exact same curl checks from Plan 3 Task 2 against
    production:
    - `GET /api/guesstimates/random` → must return `{available:false,
      reason:"feature_disabled"}` again (today's pre-switch behavior).
    - The same known-covered Q&A question → must no longer return the v2/paraphrased
      answer (confirms the gate, not just the paraphrase layer, actually reverted).
    Record the real curl responses in log.md, dated, under "R9 rollback test: flags off" —
    this is the literal proof the one-step rollback works, not an assumption.
  </action>
  <verify>
    curl -s https://placement-mastery-hub-api.onrender.com/api/guesstimates/random
  </verify>
  <done>
    Production confirmed back to pre-switch behavior (`feature_disabled` for guesstimates,
    no v2/paraphrased Q&A answer) with real curl evidence logged.
  </done>
</task>

<task type="checkpoint:human-action">
  <name>Restore: flip both flags back on, confirm grounded behavior returns, close out</name>
  <files>
    log.md
  </files>
  <action>
    Hand Aalhad the forward step again: same two env vars back to `true`, Save, wait for
    "Live". Once confirmed, re-run Plan 3 Task 2's verification curls once more (guesstimates
    returns a real problem, the known-covered Q&A question returns the grounded/paraphrased
    answer again). Record in log.md under "R9 rollback test: flags restored — switch-over
    complete", explicitly stating the full round-trip (on → off → on) is now proven, closing
    the roadmap's "rollback tested" done-when. Update `.gsd/ROADMAP.md`'s R9 row to
    `done (<date>)`, move ▶ to the next `todo` row (D1), and update `.gsd/STATE.md`'s
    position accordingly.
  </action>
  <verify>
    curl -s https://placement-mastery-hub-api.onrender.com/api/guesstimates/random | head -c 300
    grep -n "▶" .gsd/ROADMAP.md
  </verify>
  <done>
    Production confirmed grounded/paraphrased again. log.md has the full round-trip
    evidence. `.gsd/ROADMAP.md` shows R9 done and ▶ moved to D1. `.gsd/STATE.md` updated.
  </done>
</task>

</tasks>

## Must-Haves
- [ ] QA ran against the real production URLs, not localhost, for Frameworks, Guesstimates,
      and Q&A, desktop and phone.
- [ ] No per-answer source line, no raw Storage URL, correct AI-fallback label for
      `covered:false` questions — all confirmed live, not assumed from R8's dev-time checks.
- [ ] The rollback was actually executed once (off, confirmed, then on, confirmed) with real
      evidence — not just documented as a hypothetical step.
- [ ] Roadmap and state files reflect R9 done only after the full round-trip succeeds.

## Success Criteria
- [ ] log.md has three dated entries: live QA findings, rollback-off proof, restore-on proof.
- [ ] `.gsd/ROADMAP.md` R9 row is `done`, ▶ moved to D1.

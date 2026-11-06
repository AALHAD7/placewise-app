---
phase: R8
plan: 3
wave: 2
gap_closure: false
depends_on: ["01", "02"]
agent: qa-tester
files_modified: []
paid_calls: 0 (QA only exercises the UI; with ENABLE_CONSULTING_RAG_V2 off, no Gemini
  calls happen even when ask/submit buttons are clicked)
---

# Plan R8.3: QA screenshots — desktop + phone, for every page touched by R8.1/R8.2

## Objective
R8's done criteria is "build passes; QA screenshots desktop + phone." 01-PLAN.md and
02-PLAN.md's own `<verify>` steps only prove the build compiles — this plan is the
independent check that the pages actually render correctly, at both widths, in the
running app.

## Context
Read first:
- `.claude/skills/frontend-conventions/SKILL.md` ("Verifying a change" section — phone
  width ≈375px, check both themes).
- `.gsd/phases/R8/01-PLAN.md`, `.gsd/phases/R8/02-PLAN.md` (what changed and why).
- Use `/browse` (per CLAUDE.md's gstack routing: "Test the site → `/qa-only`... or
  `/browse`") against the local dev server (`frontend-react`: `npm run dev`; `backend`:
  `npm run dev`).

Facts you need:
- `ENABLE_CONSULTING_RAG_V2` is off by default in `backend/.env` — most of this QA pass
  happens in that state (today's live behavior). If `.env` allows it safely in a local
  dev run, also do one pass with the flag set to `true` to see Frameworks' v2 path and
  Q&A's live-answer path render (grounded excerpt/diagram fence, `GroundingNote`); if
  flipping the flag locally isn't safe/available in this environment, skip that pass and
  say so explicitly in the report rather than guessing what it would look like — note it
  as follow-up for Aalhad to confirm once he turns the flag on for real.
- Auth is required for every page this plan touches (`RequireAuth` wraps them) — sign in
  (or use whatever guest/test credentials the dev environment already provides) before
  navigating.

## Tasks

<task type="auto">
  <name>Screenshot Frameworks (desktop + phone) for both diagram types and grounded content</name>
  <files></files>
  <action>
    With the dev servers running, navigate to `/frameworks`, pick a domain/subdomain with
    at least one framework that has a `grid` diagram_type and one with `funnel` (check
    via the API response or just open a few cards), and expand each. Confirm:
    - The grid/funnel diagrams render identically in appearance to before (now via the
      shared `PlacewiseDiagram` component) — no visual regression, no "Can't draw this
      block" fallback on data that used to render fine.
    - No raw `<img>` pointing at a Supabase Storage URL appears anywhere on the page
      (inspect the DOM/network tab if a screenshot alone can't confirm this).
    - If a framework has `grounded_example`/`grounded_image` present (likely rare right
      now per the `pickTopTextAndImage` WIP noted in 01-PLAN.md), confirm it renders
      through the markdown/diagram path, not as raw JSON text.
    Take screenshots at desktop width (≈1440px) and phone width (≈375px).
  </action>
  <verify>
    Screenshots exist for /frameworks at both widths, with at least one expanded card
    showing a diagram in each.
  </verify>
  <done>
    No console errors, no visually broken diagram, no raw storage URL image on the page.
  </done>
</task>

<task type="auto">
  <name>Screenshot the new /qa page and re-check Guesstimates' not-available messaging, desktop + phone</name>
  <files></files>
  <action>
    1. Navigate to `/qa` (confirm the nav entry is reachable and doesn't break the
       header's layout at phone width — the row should scroll, not wrap, per the recent
       nav-overflow fix). Submit a question with the feature flag off and confirm the
       "isn't switched on yet" state renders cleanly. If the flag can safely be turned on
       for this pass, submit a casebook-covered question and a clearly off-topic one, and
       confirm: covered → no `GroundingNote`; not covered → the "not from the casebooks"
       label shows, and the answer still renders.
    2. Navigate to `/guesstimates`, reload a few times, and confirm the not-available
       message (if it ever appears) now reflects `reason`/`label` rather than always the
       same generic text.
    Take screenshots at desktop width and phone width for both pages.
  </action>
  <verify>
    Screenshots exist for /qa and /guesstimates at both widths.
  </verify>
  <done>
    No console errors on either page at either width; nav row doesn't wrap to a second
    line at phone width with the new entry added.
  </done>
</task>

## Must-Haves
After all tasks complete, verify:
- [ ] Screenshots captured for `/frameworks`, `/guesstimates`, `/qa` — desktop and phone,
      six images minimum.
- [ ] Any finding that blocks shipping (console error, broken layout, raw URL leak) is
      reported back, not silently skipped.

## Success Criteria
- [ ] All screenshots attached/referenced in the QA report with pass/fail per page.
- [ ] R8 can be marked done in `.gsd/ROADMAP.md`/`.gsd/STATE.md` once this plan's report
      comes back clean (or with only non-blocking notes).

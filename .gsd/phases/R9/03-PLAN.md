---
phase: R9
plan: 3
wave: 3
gap_closure: false
depends_on: ["2"]
agent: backend-engineer
files_modified:
  - log.md
paid_calls: 0
---

# Plan R9.3: Turn on `ENABLE_CONSULTING_RAG_V2` + `ENABLE_ANSWER_PARAPHRASE` on the live Render service — PRODUCTION, HUMAN-ACTION STEP

## ⚠️ High-stakes: this plan changes what every student sees, live
Everything up to this plan is inert for students — the data switch (plan 2) only matters
once the route gate is also on. This plan flips that gate on the actual production backend.

**Where "live" actually is, confirmed from `README.md` and `log.md` (2026-11-02 "Confirmed
production is still completely unaffected" entry) — do not assume `backend/.env` affects
production, it does not:**
- Frontend: Vercel, `https://placewise-io.vercel.app`.
- Backend API: Render, `https://placement-mastery-hub-api.onrender.com` (service name
  `placewise-api` per the same log.md entry).
- Both point at the **same** Supabase database `backend/.env`'s `SUPABASE_URL` points at
  locally — so plan 2's `ingest_chunks` write already took effect in the database the live
  backend reads. Only the route-level flag gate is still off in production.
- `RENDER_API_KEY` exists and was used in this project before, but **read-only** —
  checking deploy/env status, never changing config (log.md 2026-11-02: "its comment
  explicitly scopes it to read-only status checks, not config changes, so this wasn't done
  here even though it may have been technically possible"). This plan keeps that boundary:
  the flag flip itself is a **human action** in the Render dashboard, not an agent-run API
  call, even though the key might technically allow it.

## Objective
Set both `ENABLE_CONSULTING_RAG_V2=true` and `ENABLE_ANSWER_PARAPHRASE=true` on the
`placewise-api` Render service, together, in one redeploy — not just the RAG-v2 flag alone.
Reason both must flip together: CLAUDE.md's 2026-11-02 grounding decision is that showing
raw verbatim casebook excerpts is not the intended student-facing behavior; Plan 1's eval
ran (and was scored) with the paraphrase layer active. Turning on retrieval without
paraphrase would show the exact behavior Plan 1 did **not** test and Aalhad already decided
against. If Aalhad wants to stage them separately for any reason, that is his call to make
at the checkpoint below — the plan's default is both together.

Purpose: the actual go-live moment, done as one step forward and one step back.
Output: a log.md entry naming the exact before/after Render env state, with the rollback
step spelled out and already exercised once in plan 4 (not just written).

## Context
Load for context:
- `.gsd/ROADMAP.md` R9 row and CLAUDE.md's "every switch-over must be reversible in one
  step" rule
- `backend/.env.example` lines ~61, ~72 (the two flag names, exact spelling)
- log.md's 2026-11-02 "Confirmed production is still completely unaffected" entry (the
  Render service name and the read-only `RENDER_API_KEY` boundary this plan preserves)
- Plan 2's log.md entry (confirms the data switch already landed)

## Tasks

<tasks>

<task type="checkpoint:human-action">
  <name>Aalhad sets both flags on Render and redeploys</name>
  <files>
    (none — Render dashboard, not a repo file)
  </files>
  <action>
    Hand this exact checklist to Aalhad and wait for confirmation before Task 2:
    1. Render dashboard → `placewise-api` service → Environment.
    2. Add or edit two variables: `ENABLE_CONSULTING_RAG_V2` = `true`,
       `ENABLE_ANSWER_PARAPHRASE` = `true`.
    3. Save — this triggers an automatic redeploy/restart of the service.
    4. Wait for the deploy to show "Live" in the Render dashboard before telling the agent
       to continue to Task 2.
    State plainly in the handoff: this is the one deliberate step the agent will not take
    automatically, because `RENDER_API_KEY` is scoped read-only by this project's own
    convention (see Context above) — not because it's technically impossible.
  </action>
  <verify>(Aalhad confirms the Render dashboard shows the service "Live" after the redeploy.)</verify>
  <done>Both env vars are set on the live service and the latest deploy is "Live".</done>
</task>

<task type="auto">
  <name>Verify the flip landed, using the read-only Render API plus real production HTTP calls</name>
  <files>
    log.md
  </files>
  <action>
    Using `RENDER_API_KEY` **read-only** (list env vars / deploy status only — no write
    calls), confirm `ENABLE_CONSULTING_RAG_V2` and `ENABLE_ANSWER_PARAPHRASE` both appear as
    `true` among the service's configured env vars, and the latest deploy status is live/
    succeeded.

    Then hit the real production API directly (not localhost) to prove the gate is open and
    paraphrasing is active, mirroring the exact curl pattern from log.md's 2026-11-02
    production-verification entry:
    - `curl https://placement-mastery-hub-api.onrender.com/api/guesstimates/random` — must
      no longer return `{available:false, reason:"feature_disabled"}`.
    - A Q&A question known to be covered (pick one `covered:true` question from
      `questions.jsonl` that Plan 1 scored `coverage_label: pass`) via the production API —
      confirm a grounded answer comes back, and that its text does not look like a verbatim
      casebook sentence lifted unmodified (spot-check against the raw chunk if accessible,
      same spirit as the R7b manual check).
    - Confirm the API response still never includes a raw Storage URL or a per-answer
      "source" citation line, per CLAUDE.md's grounding policy (same check R8's QA did).

    Log the exact curl commands and real responses (redact nothing sensitive, there's
    nothing secret in these responses) in log.md, dated, with "R9 switch-over: flags live on
    production" as the entry title. State the rollback step explicitly:
    "Render dashboard → placewise-api → Environment → set both vars to `false` (or delete
    them) → redeploy" — this exact step gets exercised for real in Plan 4, not just written
    here.
  </action>
  <verify>
    curl -s https://placement-mastery-hub-api.onrender.com/api/guesstimates/random | head -c 300
  </verify>
  <done>
    Render API confirms both vars are `true` and the deploy is live. A real curl against
    production shows grounded, paraphrased content for a known-covered question and no
    `feature_disabled` response for guesstimates. log.md has the dated entry with real
    command output and the rollback step spelled out.
  </done>
</task>

</tasks>

## Must-Haves
- [ ] Both flags are confirmed live on the actual Render service, not assumed from local
      `.env`.
- [ ] Verification uses the real production URL, not localhost or a mocked call.
- [ ] The rollback step is written down precisely enough that Plan 4 can execute it without
      re-deriving it.
- [ ] `RENDER_API_KEY` is used read-only throughout this plan; the flag flip itself is
      Aalhad's manual action.

## Success Criteria
- [ ] Production env vars confirmed set; production API confirmed returning grounded,
      paraphrased answers for a known-covered question.
- [ ] log.md entry exists with real curl evidence and the rollback instructions.

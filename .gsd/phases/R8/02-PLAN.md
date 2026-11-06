---
phase: R8
plan: 2
wave: 1
gap_closure: false
depends_on: []
agent: frontend-engineer
files_modified:
  - frontend-react/src/pages/QaPage.tsx (new)
  - frontend-react/src/router.tsx
  - frontend-react/src/components/shell/TopNav.tsx
  - frontend-react/src/types/api.ts
  - frontend-react/src/pages/GuesstimatesPage.tsx
paid_calls: 0 (ENABLE_CONSULTING_RAG_V2 is off by default; the route returns
  {available:false} with zero Gemini calls until Aalhad flips the flag — see note below)
---

# Plan R8.2: Build the missing Q&A page, wire GroundingNote, improve Guesstimates' "not available" label

## Scope note — read this first
The task that spawned this plan assumed a Q&A page already exists on the frontend
("Q&A's actual page component — find it"). **Verified 2026-11-06, it does not exist.**
`backend/src/routes/qa.js` (`POST /api/qa/ask`) and `backend/src/lib/qaRetrieval.js`
(`groundedQaAnswer`, returns `{ groundedInCasebooks, label, answer, citations }`) are
built and tested, but no frontend route, page, or nav entry calls them.
`frontend-react/src/components/ProbeChat.tsx` (used on `RolePage.tsx`) is a *different*
feature (role-specific "probe" chat via `useProbe.ts`) — it does not call `qa.js`.

Decision: build it, as a small new page, not just "wire an existing one." Reasoning:
- The backend is done, tested, and flag-gated (`ENABLE_CONSULTING_RAG_V2`, off by
  default) — building the frontend surface is reversible in one step (delete the route +
  nav entry) and costs nothing while the flag is off, matching CLAUDE.md's "every
  switch-over must be reversible in one step."
- R8's objective ("render new diagram types, citations, AI label") is best served by
  the feature that actually has the full `groundedInCasebooks`/general-knowledge-fallback
  shape — Frameworks has no general-knowledge fallback for its own explanation text, and
  Guesstimates deliberately has none either (see 03-PLAN.md / `.gsd/STATE.md`). Q&A is
  the one place `GroundingNote` and the "AI-generated, not from the casebooks" label have
  real content to attach to.
- Kept deliberately minimal, same posture `GuesstimatesPage.tsx` already states for
  itself ("Placeholder for Aalhad to redesign where this lives/looks") — a working,
  correct page, not a polished one.

If Aalhad would rather this wait for a dedicated design pass, this plan's diff is a
single new page + one nav entry + one route — trivial to revert.

## Objective
Give free-form Q&A a frontend surface that calls `POST /api/qa/ask`, renders the answer
(through `MarkdownWithDiagrams`, since a grounded answer's source excerpts can contain a
`placewise-diagram` fence) and the "AI-generated — not from the casebooks" label via the
existing `GroundingNote` component whenever `groundedInCasebooks` is false. Also fix
Guesstimates' "not available" message, which currently can't distinguish "feature off"
from "no problem found this time" even though the backend already tells it the
difference via `label`.

## Context
Read first:
- `.claude/skills/frontend-conventions/SKILL.md`.
- `backend/src/routes/qa.js`, `backend/src/lib/qaRetrieval.js` (response shape:
  `{ success, available, groundedInCasebooks, label, answer, citations }` when
  `available: true`; `{ success, available: false, reason: "feature_disabled" }` when
  the flag is off).
- `frontend-react/src/pages/GuesstimatesPage.tsx` (the pattern to copy: loading / empty /
  error / available states, `apiFetch`, `PageHeader`).
- `frontend-react/src/components/GroundingNote.tsx` (renders nothing when
  `groundedInCasebooks` is true — only shows the fallback label; this is correct per
  CLAUDE.md's 2026-11-02 decision, don't add a positive-citation render alongside it).
- `frontend-react/src/components/MarkdownWithDiagrams.tsx`.
- `frontend-react/src/components/shell/TopNav.tsx` (`NAV` array, lines 24-102 — a fixed,
  already-tight set of entries; the project's own recent commits
  ("fix(nav): never wrap the header to a second line - scroll pills instead") added
  horizontal scrolling specifically so the row can hold more entries without wrapping —
  adding one more entry here is consistent with that fix, not a layout risk it wasn't
  built for).
- `frontend-react/src/router.tsx` (route registration pattern).
- `backend/src/lib/guesstimateRetrieval.js` lines ~140-180 (`available: false, reason:
  "not_yet_live", label: AI_FALLBACK_LABEL` vs `feature_disabled` — two different reasons
  for the same `available: false`, currently shown with one undifferentiated message).

Facts you need:
- Q&A questions are capped at 1000 chars server-side (`qa.js`); enforce the same client-side
  so the error a student sees is a disabled button, not a 400 round-trip.
- `qa.js` uses `requireAuth` + `aiLimiter` — call it through `apiClient.ts` exactly like
  `FrameworkAskBox.tsx` calls `/api/frameworks/ask` (same auth header handling already
  built in, nothing new to wire there).
- Do not build a multi-turn chat UI — `groundedQaAnswer` is single-question-in,
  single-answer-out (no conversation state server-side). One question box, one answer,
  "Ask another" to clear and start over — same shape as Guesstimates' "Try another."

## Tasks

<task type="auto">
  <name>Add QaAskResponse/QaAskRequest types, build QaPage.tsx, register the route and nav entry</name>
  <files>
    frontend-react/src/types/api.ts
    frontend-react/src/pages/QaPage.tsx
    frontend-react/src/router.tsx
    frontend-react/src/components/shell/TopNav.tsx
  </files>
  <action>
    1. In `types/api.ts`, add (near `GuesstimateResponse`, annotated with the route it
       mirrors):
       ```ts
       // POST /api/qa/ask - backend/src/routes/qa.js
       export interface QaAskResponse {
         success: true;
         available: boolean;
         reason?: "feature_disabled";
         groundedInCasebooks?: boolean;
         label?: string | null;
         answer?: string;
         citations?: GuesstimateCitation[]; // API-only; not rendered to students (CLAUDE.md)
       }
       ```
    2. Create `frontend-react/src/pages/QaPage.tsx`, modeled on
       `GuesstimatesPage.tsx`'s state machine (`loading`/`error`/`data`) but driven by a
       submit action instead of auto-load on mount:
       - A `<PageHeader title="Ask" subtitle="Ask anything from the casebooks - or anything else." />`
         (wording illustrative; keep consistent with the site's voice).
       - A `<textarea>` + "Ask" button (disabled while loading or empty, same pattern as
         `FrameworkAskBox.tsx`'s box — reuse `useVoiceRecording`/`VoiceRecordButton` the
         same way that component does, for consistency, not a new mic implementation).
       - `onAsk`: `apiFetch<QaAskResponse>("/api/qa/ask", { method: "POST", body: JSON.stringify({ question }) }, "Failed to answer that question.")`.
       - When `res.available === false`: show "Q&A isn't switched on yet - check back soon."
         (mirrors Guesstimates' disabled-feature message).
       - When `res.available === true`: render `<GroundingNote groundedInCasebooks={!!res.groundedInCasebooks} />`
         above the answer, then `<MarkdownWithDiagrams markdown={res.answer ?? ""} />`.
         Do not render `res.citations` (API-only, per CLAUDE.md).
       - "Ask another" button clears the question/answer state, same UX as Guesstimates'
         "Try another."
       - Client-side 1000-char guard on the textarea/button, matching the backend limit.
    3. Register in `router.tsx`: add `{ path: "/qa", element: <QaPage /> }` inside the
       same protected route group as `/guesstimates`.
    4. Add one `NavEntry` to `TopNav.tsx`'s `NAV` array (after `/guesstimates`, before
       `/resume`, or wherever reads best) with `to: "/qa"`, `label: "Ask"` (or "Q&A" — pick
       one and use it identically in the page's `PageHeader` title, same rule the existing
       Resume Drill comment calls out), and a simple icon (reuse an existing lucide-style
       path set already in the file rather than inventing new SVG path data from scratch —
       e.g. a question-mark-circle or chat-bubble icon matching the existing stroke style).
  </action>
  <verify>
    cd "frontend-react" && npm run build && npm run lint
  </verify>
  <done>
    Build and lint pass. `/qa` renders behind auth, shows the disabled-feature message
    with the flag off (today's default), and the page compiles against the real
    `QaAskResponse` type with no `any`.
  </done>
</task>

<task type="auto">
  <name>Differentiate Guesstimates' "not available" message using the label the backend already sends</name>
  <files>
    frontend-react/src/pages/GuesstimatesPage.tsx
  </files>
  <action>
    Currently `!state.data.available` always shows "Guesstimates practice isn't switched
    on yet - check back soon," whether the reason is `feature_disabled` or `not_yet_live`
    (backend already distinguishes these — see `guesstimateRetrieval.js`). Branch on
    `state.data.reason`:
    - `"feature_disabled"`: keep the existing message.
    - `"not_yet_live"` (or any other non-`feature_disabled` reason with a `label`): show
      the backend's own `label` text if present, else a slightly different fallback
      ("Couldn't find a fresh problem just now - try again.") so a genuinely-on feature
      that just didn't find a candidate this request doesn't read as permanently
      unavailable.
    This does not need `GroundingNote` — there's no answer content to attach a label to
    in the not-available case, just a short status message.
  </action>
  <verify>
    cd "frontend-react" && npm run build && npm run lint
  </verify>
  <done>
    Build/lint pass. `grep -n "reason" frontend-react/src/pages/GuesstimatesPage.tsx`
    shows the branch exists.
  </done>
</task>

## Must-Haves
After all tasks complete, verify:
- [ ] A student can reach `/qa`, ask a question, and see either a grounded answer (no
      label) or a general answer with the "not from the casebooks" `GroundingNote`.
- [ ] Nothing paid runs by default — the page is fully functional (shows the
      disabled-feature state) with `ENABLE_CONSULTING_RAG_V2` unset, zero Gemini calls.
- [ ] Guesstimates' not-available states are distinguishable to a student instead of
      one generic message for two different backend conditions.

## Success Criteria
- [ ] `npm run build` and `npm run lint` pass in `frontend-react/`.
- [ ] New route is reachable only inside the existing auth-gated shell (no public leak).

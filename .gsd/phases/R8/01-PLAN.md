---
phase: R8
plan: 1
wave: 1
gap_closure: false
depends_on: []
agent: frontend-engineer
files_modified:
  - frontend-react/src/pages/FrameworksPage.tsx
  - frontend-react/src/types/api.ts
paid_calls: 0
---

# Plan R8.1: Frameworks — shared diagram renderer, render grounded excerpts, fix a diagram-privacy violation

## Objective
`FrameworksPage.tsx` is the one student-facing surface still on the old, narrower diagram
path. Fix three confirmed problems, verified by reading the actual code (not the prior
survey) before writing this plan:

1. **Two diagram renderers for the same data shape.** `FrameworkGridDiagram`
   (`xAxis/yAxis/cols/rows/cells`) and `FrameworkFunnelDiagram` (`stages`) are
   field-for-field identical to `PlacewiseDiagramBlock`'s `matrix` and `funnel` variants
   (`frontend-react/src/types/api.ts:46-55` vs `:717-725`). `PlacewiseDiagram.tsx`
   already validates and renders both, with a JSON fallback on malformed data — the
   local `GridDiagram`/`FunnelDiagram` components in `FrameworksPage.tsx` do not have
   that fallback. Decision: **migrate**, don't keep both renderers. This is a pure
   frontend adapter (wrap the existing `diagram_type`/`diagram_data` into a
   `PlacewiseDiagramBlock` shape at render time) — no backend or data change, so it's
   low-risk and fully reversible by reverting this one file.
2. **`grounded_example.excerpt` and `grounded_image.caption` are fetched but never
   rendered.** Confirmed by reading the full render tree (`FrameworksPage.tsx:340-462`):
   `f.example` (a separate, always-static field) is shown via `<p>`, but
   `f.grounded_example` — the actual RAG-retrieved excerpt `frameworksGrounding.js`
   computes — has no render path at all. Same for `grounded_image.caption`. Both can
   contain a ` ```placewise-diagram ` fence (confirmed in `consultingRetrieval.js`'s
   `protectDiagramBlocks`, used on every chunk that has a diagram) — they need
   `MarkdownWithDiagrams`, the same component `GuesstimatesPage.tsx` already uses, not a
   plain `<p>`.
3. **A raw admin image URL is rendered to students.** `FrameworksPage.tsx:402-410` does
   `<img src={f.grounded_image!.url}>`. CLAUDE.md's diagram rule is explicit: "Original
   PDFs and page images stay admin-only; never expose them or their storage URLs to
   non-admin users." This is live today (not gated behind `ENABLE_CONSULTING_RAG_V2` —
   it fires whenever v1's `document_chunks` path finds an image match). Fix: drop the
   raw `<img>` entirely. The v2 path already sets `image.url: null` on purpose for this
   exact reason (see `frameworksGrounding.js`'s comment on `findGroundingV2`); the v1
   path should match that behavior, not violate it.

## Context
Read first:
- `CLAUDE.md` — "Diagrams" section (privacy rule) and the grounding/citation policy
  (per-answer citations are **not** shown to students — confirmed current and correct;
  `.claude/skills/frontend-conventions/SKILL.md`'s line "Show citations... wherever
  casebook content appears" is **stale**, predates the 2026-11-02 decision. Follow
  CLAUDE.md. Flag the stale skill line to Aalhad separately — do not edit the skill file
  as part of this plan, that's a documentation change outside R8's scope).
- `.claude/skills/frontend-conventions/SKILL.md` (routing/build/verify conventions; ignore
  the stale citations line above).
- `frontend-react/src/components/diagrams/PlacewiseDiagram.tsx` (shared renderer, 6 types).
- `frontend-react/src/components/MarkdownWithDiagrams.tsx` (already used by
  `GuesstimatesPage.tsx` — same pattern to follow here).
- `frontend-react/src/pages/FrameworksPage.tsx` (current grid/funnel renderers,
  lines ~43-90 for `GridDiagram`/`FunnelDiagram`, lines 358-462 for the card render loop).
- `frontend-react/src/types/api.ts` lines 46-75 (`Framework`, old diagram types) and
  705-739 (`PlacewiseDiagramBlock`).
- `backend/src/lib/frameworksGrounding.js` (confirms `grounded_example`/`grounded_image`
  shape, including `citation`/`rawExcerpt`/`rawCaption` fields the current `Framework`
  type is missing).

Facts you need (verified 2026-11-06, not just the prior survey):
- `ENABLE_CONSULTING_RAG_V2` is **off by default**. With it off (today's live state),
  `grounded_example`/`grounded_image` still come from the v1 `document_chunks` path
  (`findGrounding`'s `try` branch in `frameworksGrounding.js`), so this plan's changes
  are live-visible today, not dormant behind a flag — test both with the flag off and on.
- **Known, separately-flagged issue, not yours to fix:** `.gsd/STATE.md` flags
  `pickTopTextAndImage` in `frameworksGrounding.js` as uncommitted WIP that currently
  always returns `topText: null` (v1 text-grounding disabled, only images come through).
  This means `grounded_example` will be `null` for most frameworks right now regardless
  of your changes — that's expected and correct given the WIP state; your job is to make
  sure the render path is correct *when* `grounded_example` is present (v2-on, or once
  the WIP is resolved), not to change retrieval. Do not touch `frameworksGrounding.js`.
- `PlacewiseDiagramBlock`'s `matrix.cells` is `(string | null)[][]`; `FrameworkGridDiagram.cells`
  is `string[][]` — compatible, no cast needed beyond the type-level union.
- `FrameworkAskBox.tsx`'s own inline "Couldn't verify a fully grounded answer, so this
  falls back to the framework's own content above" note is **intentionally different**
  from `GroundingNote`'s "General guidance - not from the casebooks" wording — the
  ask-box fallback is to the framework's own (still casebook-derived) authored content,
  not a general-AI-knowledge answer, so `GroundingNote` does not apply there. Leave
  `FrameworkAskBox.tsx` unchanged.

## Tasks

<task type="auto">
  <name>Migrate Frameworks' diagram rendering onto PlacewiseDiagram; render grounded_example/grounded_image through MarkdownWithDiagrams; remove the raw admin image URL</name>
  <files>
    frontend-react/src/pages/FrameworksPage.tsx
    frontend-react/src/types/api.ts
  </files>
  <action>
    In `frontend-react/src/types/api.ts`:
    1. Extend `Framework.grounded_example` and `grounded_image` to include the fields
       `frameworksGrounding.js` actually returns: `citation?: GuesstimateCitation` (or an
       equivalent shared citation type if one already exists — check before adding a
       duplicate), `rawExcerpt?: string` (on `grounded_example`), `rawCaption?: string`
       (on `grounded_image`). These are for type accuracy only (debugging/admin use per
       CLAUDE.md) — do not render them to students.

    In `frontend-react/src/pages/FrameworksPage.tsx`:
    2. Add a small pure adapter, e.g.:
       ```ts
       function toDiagramBlock(type: "grid" | "funnel", data: FrameworkGridDiagram | FrameworkFunnelDiagram): PlacewiseDiagramBlock {
         if (type === "grid" && "cols" in data) return { type: "matrix", xAxis: data.xAxis, yAxis: data.yAxis, cols: data.cols, rows: data.rows, cells: data.cells };
         return { type: "funnel", stages: (data as FrameworkFunnelDiagram).stages };
       }
       ```
       Import `PlacewiseDiagramBlock` from `../types/api` and `PlacewiseDiagram` from
       `../components/diagrams/PlacewiseDiagram`.
    3. Replace the `f.diagram_type === "grid" / "funnel"` branch (currently rendering
       `<GridDiagram>`/`<FunnelDiagram>`) with
       `<PlacewiseDiagram block={toDiagramBlock(f.diagram_type, f.diagram_data)} />`,
       guarded by the same existing `f.diagram_type && f.diagram_data` checks. Delete the
       now-unused local `GridDiagram`/`FunnelDiagram` components and their only-used-there
       helpers (keep `GRID_COLORS` only if still referenced elsewhere — check with grep
       before deleting).
    4. Replace the `hasGroundedImageUrl` block (`<img src={f.grounded_image!.url}>`) with:
       render `f.grounded_image.caption` through `<MarkdownWithDiagrams markdown={...} />`
       when present — never render `.url`. Rename the local boolean from
       `hasGroundedImageUrl` to something like `hasGroundedImage` (`!!f.grounded_image`).
    5. Add a render of `f.grounded_example.excerpt` through `<MarkdownWithDiagrams
       markdown={f.grounded_example.excerpt} />` in the existing "Example" card
       (`hasExample` block) or immediately after it, clearly distinguished from `f.example`
       (keep both — `f.example` is the static authored example, `grounded_example` is the
       real casebook excerpt; don't conflate or drop either).
    6. Import `MarkdownWithDiagrams` from `../components/MarkdownWithDiagrams`.

    AVOID: casting `f.diagram_data as any` into the adapter — write the type guard so
    TypeScript accepts it without widening to `any` anywhere.
    USE: the exact field names already in `PlacewiseDiagramBlock`'s `matrix`/`funnel`
    variants (`frontend-react/src/types/api.ts:717-725`) so no runtime remapping is lossy.
  </action>
  <verify>
    cd "frontend-react" && npm run build && npm run lint
  </verify>
  <done>
    Build and lint both exit 0. `grep -n "GridDiagram\|FunnelDiagram" frontend-react/src/pages/FrameworksPage.tsx`
    shows no leftover component definitions (only the adapter/import, if named similarly).
    `grep -n "grounded_image!.url\|grounded_image.url" frontend-react/src/pages/FrameworksPage.tsx`
    returns nothing — the raw URL is never rendered.
  </done>
</task>

<task type="auto">
  <name>Confirm flag-off and flag-on behavior by inspection (no live network needed yet — full QA happens in 03-PLAN.md)</name>
  <files>
    frontend-react/src/pages/FrameworksPage.tsx
  </files>
  <action>
    Re-read the finished file end to end. Trace both states by hand against
    `frameworksGrounding.js`:
    - `ENABLE_CONSULTING_RAG_V2` unset/false (today's default): `grounded_image.url` may
      be a real Storage URL from the v1 path — confirm your new code never reads `.url`,
      only `.caption`. `grounded_example.excerpt` will almost always be absent right now
      (the `pickTopTextAndImage` WIP forces `topText: null`) — confirm the page still
      renders cleanly with `grounded_example: null` (no crash, no empty card).
    - `ENABLE_CONSULTING_RAG_V2=true`, domain `Consulting`: `grounded_image.url` is
      always `null` (v2 sets it that way on purpose) and `.caption` may contain a
      ```placewise-diagram``` fence — confirm `MarkdownWithDiagrams` would parse that
      fence (it's the same component/parser `GuesstimatesPage.tsx` already proved works
      on real fenced content — this is a code-reading check, not a new test to write).
  </action>
  <verify>
    Re-run: cd "frontend-react" && npm run build
  </verify>
  <done>
    Build still passes after the trace (no code changes expected in this task unless the
    trace finds a bug — if it does, fix it and re-verify). Written confirmation in the
    plan's execution notes that both states were traced and are safe.
  </done>
</task>

## Must-Haves
After all tasks complete, verify:
- [ ] Frameworks page uses one shared diagram component (`PlacewiseDiagram`) for every
      diagram type it shows — grid/funnel (static, authored) and any future
      `placewise-diagram` fence inside grounded content.
- [ ] No raw casebook/admin image URL is ever rendered to a student on this page.
- [ ] `grounded_example`/`grounded_image` content, when present, actually reaches the
      screen (previously it was fetched and silently dropped).

## Success Criteria
- [ ] `npm run build` and `npm run lint` pass in `frontend-react/`.
- [ ] No regressions: existing grid/funnel frameworks still render their diagram
      correctly (visually equivalent via the shared component — confirmed in 03-PLAN.md).

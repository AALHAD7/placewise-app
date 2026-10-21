---
phase: R5
plan: 3
wave: 3
gap_closure: false
depends_on: ["2"]
agent: frontend-engineer
files_modified:
  - frontend-react/src/types/api.ts (admin review types)
  - frontend-react/src/lib/apiClient.ts (apiFetchBlob)
  - frontend-react/src/components/diagrams/PlacewiseDiagram.tsx (new)
  - frontend-react/src/pages/admin/ReviewQueue.tsx (new)
  - frontend-react/src/pages/AdminPage.tsx (add the section)
  - frontend-react/src/styles/admin-review.css (new)
paid_calls: 0
---

# Plan R5.3: "Review queue" section on /admin

## Objective
Add a simple review section to the existing `/admin` page so Aalhad can pick an ingest document version
(default FMS v5), filter flagged pages by status and reason, open a page to see the original page image beside the
rebuilt markdown and drawn diagram blocks, read the review reasons and the imported reviewer findings, and then
Approve, Mark wrong (with a note), Edit and approve, or Reopen. Admin-only: nothing changes for students.

## Context
Read first: `.claude/skills/frontend-conventions/SKILL.md`, `.claude/skills/diagram-transcription/SKILL.md`,
`.gsd/phases/R5/02-PLAN.md` (endpoint shapes; read `backend/src/routes/adminReview.js` for the final ones),
`frontend-react/src/pages/AdminPage.tsx`, `frontend-react/src/lib/apiClient.ts`,
`frontend-react/src/pages/FrameworksPage.tsx` (existing `GridDiagram`/`FunnelDiagram` to reuse for matrix/funnel).

Facts you need:
- `/admin` already renders a bare 404 for non-admins when `/api/admin/usage` fails. Keep that: render the review
  section only after the usage call succeeded, and keep showing the same 404 otherwise.
- `<img src>` cannot send the Bearer token, so the image is fetched with the token as a Blob
  (`apiFetchBlob(path)` in apiClient, same token logic as `apiFetch`, throws ApiError on non-2xx) and shown via
  `URL.createObjectURL`; revoke the object URL on page change/unmount. Never build a storage URL in the browser.
- Status values: pending | approved | fixed | wrong. Actions: approve | mark_wrong | edit_approve | reopen.
- Findings come labelled with `ingestion_version` and `is_current_version`; findings from v3/v4 may describe text
  that v5 has since fixed.
- The diagram renderer is admin-only for now but is built as a shared component so R8 can reuse it for students.

## Design spec (from /plan-design-review; follow it in task 2)
Layout, desktop (≥ 900px). The reviewer's first question is "why is this flagged?", so that comes before the content:
```
+-------------------------------------------------------------------------------+
| Ingestion review   [FMS Delhi 2023-24 v5 v] [Pending v] [All reasons v]  38/173 reviewed |
+------------------+------------------------------------------------------------+
| p1  pending  2r  | Page 46 · FMS Delhi 2023-24 · v5 · pending       < prev  next > |
| p11 pending  3r  | WHY FLAGGED: [diagram_structure] [seq_diff] · 1 finding (v5):    |
|>p46 pending  1f  |   structure_lost: "Backward... integration" box under JV only    |
| p47 wrong        +-----------------------------+------------------------------+
| ...  (dense rows,| ORIGINAL PAGE (image)       | REBUILT  [Rebuilt|Raw|Issues] |
|  not cards)      |                             | text + drawn diagram blocks   |
|                  +-----------------------------+------------------------------+
|                  | > All findings (3)   > History (0)        (collapsed)        |
|                  | [Approve] [Mark wrong] [Edit] [Reopen]   (sticky footer)     |
+------------------+------------------------------------------------------------+
```
Phone (< 900px): the filters wrap, and the list becomes a page-number select plus prev/next. The "why flagged" strip comes next, then the image (full width, tap to zoom), then the rebuilt content. The action bar stays sticky with buttons at least 44px high.

States:
| feature | loading | empty | error | success |
|---|---|---|---|---|
| queue list | 6 grey skeleton rows | "Nothing left to review here" + "Show all statuses" button | "Couldn't load pages" + Retry | rows + counter |
| page image | grey box at page aspect ratio | – | "Image not available" (the content stays usable) | image |
| rebuilt content | skeleton lines | "This page has no text" | block-level "Can't draw this block" + JSON | text + diagrams |
| action | the button shows a spinner; all actions disabled | – | inline message under the bar; edit text kept | "Approved p46 · Undo" for 6 s (Undo = reopen), then advance |

Rules:
- Approve on a page that has findings of type hallucinated/altered/structure_lost/missing from the **current** version asks one inline confirm: "This page has open findings. Approve anyway?"
- The Edit view has a "Show original" toggle (read-only original next to the edit).
- Status pills use existing tokens from `global.css` (no raw hex). pending = neutral grey, approved = success/green token if one exists (else `--indigo`), fixed = `--indigo`, wrong = `--red-dark`. The status text is always shown, never colour alone.
- a11y: the content tabs are buttons with `aria-selected`; action results go to an `aria-live="polite"` region; the image alt is "Original scan of page N"; after auto-advance, focus moves to the page heading. The only keyboard shortcuts are j/k and ←/→ for navigation. No single-key Approve, to avoid accidental approvals.
- Counter "38/173 reviewed" = non-pending flagged pages / flagged pages for the selected document.

## Tasks

<task type="auto">
  <name>Types, blob fetch helper, and PlacewiseDiagram renderer for all 7 block types</name>
  <files>
    frontend-react/src/types/api.ts
    frontend-react/src/lib/apiClient.ts
    frontend-react/src/components/diagrams/PlacewiseDiagram.tsx
  </files>
  <action>
    1. Types annotated with their routes: `AdminReviewDocument`, `AdminReviewPagesResponse`, `AdminReviewPageResponse`,
       `AdminReviewFinding`, `AdminReviewHistoryItem`, `AdminReviewActionRequest/Response`, `PlacewiseDiagramBlock`
       (discriminated union on `type`).
    2. `apiFetchBlob(path): Promise<Blob>`.
    3. `PlacewiseDiagram({ block })`: issue_tree → indented nested tree (CSS borders as connectors, every label);
       flow → numbered node list with "→ target" lines and edge labels (no graph library); matrix → reuse GridDiagram
       shape; funnel → reuse FunnelDiagram shape; chart → a data table (series × points) with chart_kind, axis labels
       and title (no chart library); table → HTML table (show ragged rows as-is, not padded, so the fault stays visible);
       other → description + labels. Every type shows `title` and `notes`. Unknown type or a render error → a
       `<pre>` of the JSON plus "Can't draw this block" (error boundary), never a crash.
       Also export `splitMarkdownBlocks(md)` → segments of text and parsed blocks (parse error kept as a segment).
    AVOID: new dependencies (no markdown or chart libs); raw hex colours (use tokens from global.css).
  </action>
  <verify>cd frontend-react && npm run build 2>&1 | tail -5 && npm run lint 2>&1 | tail -5</verify>
  <done>Build and lint pass with the new files compiled.</done>
</task>

<task type="auto">
  <name>ReviewQueue section: filters, list, page view, actions</name>
  <files>
    frontend-react/src/pages/admin/ReviewQueue.tsx
    frontend-react/src/pages/AdminPage.tsx
    frontend-react/src/styles/admin-review.css
  </files>
  <action>
    Follow the Design spec section above (layout, states, rules). Layout (desktop): left column = queue list; right = page view with the image and the rebuilt content side by
    side (image left, content right; stacked under ~900px). Phone width: list above, page view below, image full width.
    1. Header row: document select (`GET /documents`, default `default_document_id`, label "School year · v5 · 173 flagged"),
       status select (Pending default / Approved / Fixed / Wrong / All), reason select from `reason_counts`
       ("All reasons" default, each with its count), and a "n of total" counter.
    2. List: page number, status pill, up to 3 reason chips (+n), a findings badge with count. Click selects.
       Keyboard: j/k or ←/→ for next/prev (uses `next_page_id`/`prev_page_id`), disabled while typing in a textarea.
    3. Page view: header "Page 46 · FMS Delhi 2023-24 · v5 · status". Image panel (blob URL, loading skeleton,
       "Image not available" on error, click toggles fit-width / actual size). Content panel tabs:
       "Rebuilt" (markdown text in a readable pre-wrap block with each placewise-diagram fence replaced by
       `PlacewiseDiagram`), "Raw markdown", "Diagram issues" (diagram_issues list). Under it: review reasons as chips;
       Findings list (source name, version badge with "earlier version" when not current, verdict/outcome,
       each mismatch as type · item · "page shows" vs "stored", note); History list (action, note, who, when).
    4. Actions bar (sticky at the bottom of the page view): Approve · Mark wrong · Edit · Reopen (Reopen only when
       status ≠ pending; Approve/Mark wrong/Edit only when pending or wrong). Mark wrong opens an inline note field
       (required). Edit swaps the content panel for a textarea pre-filled with the current markdown (or the latest
       edit, labelled) plus a live preview; "Save and approve" posts edit_approve; server block errors are shown under
       the textarea. All posts send `expected_status`; on 409 show "This page changed — reloaded" and reload it.
       After a successful action: inline confirmation, update the list item and counts in local state (do not
       refetch the whole list), and move to the next page.
       Request budget: the backend's global limiter allows 300 requests / 15 min per IP, so keep ~3 requests per page:
       no polling, no prefetching, keep the last 20 image blob URLs in an in-memory Map (revoke on eviction/unmount).
       A 429 shows "Too many requests, wait a few minutes" and keeps any unsaved edit text.
    5. States: loading, empty queue ("No pages match these filters"), error with retry.
    6. AdminPage: keep the Usage block, add an "Ingestion review" section heading below it rendering `<ReviewQueue/>`.
    AVOID: any route outside `/admin`; any link or text showing a storage path.
  </action>
  <verify>cd frontend-react && npm run build 2>&1 | tail -5 && npm run lint 2>&1 | tail -5 && grep -rn "image_path\|casebook-source\|createSignedUrl\|getPublicUrl" src || echo "no storage refs"</verify>
  <done>Build and lint pass; grep prints "no storage refs".</done>
</task>

## Must-Haves
- [ ] Section appears only for admins; non-admins still see the plain 404.
- [ ] Image shown via authenticated blob fetch only.
- [ ] All four actions reachable; Mark wrong requires a note; Edit shows server validation errors.
- [ ] Every block type draws or falls back without crashing.

## Success Criteria
- [ ] `npm run build` and `npm run lint` green.
- [ ] Hand-off to plan 4 (qa-tester) for the browser run.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | not run | - |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | ISSUES OPEN (resolved in plans, see 02-PLAN.md) | 5 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | issues_open (all folded in) | score: 5/10 → 8/10, 6 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | not run | - |

Design findings, all auto-decided and folded into the "Design spec" section:
1. Hierarchy was undefined. Fix: "why flagged" strip above the image/content split; ASCII layout added.
2. States were partial. Fix: a states table for the list, image, content and actions.
3. No progress or undo in a 173-page loop. Fix: "n/173 reviewed" counter and a 6 s Undo (reopen).
4. Risk of approving a page with open findings. Fix: inline confirm.
5. a11y and phone were thin. Fix: 44px targets, aria-live, focus, alt text, no single-key approve.
6. The edit had no comparison. Fix: "Show original" toggle.
Mockups skipped: they are paid image calls, and this is an admin-only internal tool (no DESIGN.md; tokens from global.css).

- **OUTSIDE COVERAGE:** skipped (subagent run).
- **VERDICT:** ENG + DESIGN findings folded in; ready to implement.

NO UNRESOLVED DECISIONS

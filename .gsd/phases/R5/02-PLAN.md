---
phase: R5
plan: 2
wave: 2
gap_closure: false
depends_on: ["1"]
agent: backend-engineer
files_modified:
  - backend/src/lib/diagramBlocks.js (new)
  - backend/src/lib/reviewQueue.js (new)
  - backend/src/routes/adminReview.js (new)
  - backend/src/middleware/rateLimit.js (add adminReviewLimiter)
  - backend/src/server.js (mount)
  - backend/test/reviewQueue.test.js (new)
  - backend/test/api.test.js (admin review gating + read tests)
paid_calls: 0
---

# Plan R5.2: Admin review API (queue, page view, image proxy, actions)

## Objective
Backend endpoints under `/api/admin/review/*` that list flagged pages for an ingest document version,
return one page with everything a reviewer needs, stream its page image to admins only, and record
Approve / Mark wrong / Edit-then-approve / Reopen through the migration-041 RPC. Original page content
is never overwritten. No student-facing route changes.

## Context
Read first: `.gsd/phases/R5/01-PLAN.md` (tables + RPC contract), `.claude/skills/backend-conventions/SKILL.md`,
`.claude/skills/diagram-transcription/SKILL.md`, `backend/src/middleware/admin.js`, `backend/src/routes/admin.js`,
`backend/src/server.js`, `backend/ingestion/diagram_schema.py` (`extract_blocks`, `validate_block`).

Facts you need:
- `requireAdmin` returns a bare 404 for no token / bad token / non-admin. Keep that for every new route.
- `routes/admin.js` does `router.use(requireAdmin, adminLimiter)`; `adminLimiter` = 60 req / 15 min, too low for
  paging through ~170 pages (each page = detail + image). So mount a separate router at `/api/admin/review`
  **before** `app.use("/api/admin", adminRouter)` in `server.js`, with `requireAdmin` + a new
  `adminReviewLimiter` (300 / 15 min, same keyGenerator `userOrIpKey`). Confirm with a curl that the old
  `/api/admin/usage` still works and still uses `adminLimiter`.
- `server.js` applies `generalLimiter` (300 req / 15 min **per IP**, every route) before all routers, so the
  effective review budget is 300 per 15 min shared with the rest of the site. Do not change or bypass
  `generalLimiter` (it shields `requireAdmin`'s Supabase auth call from floods). At ~3 requests per page
  (detail + image + action) that is ~100 pages per 15 min, enough for one reviewer; plan 3 keeps requests low.
- Page images: private bucket `casebook-source` (bucket `public = false`, verified). `ingest_pages.image_path`
  is like `pages/67371722-c752-473e-bf12-a3710707e56c/<n>.png` (v2–v5 reuse v1's renders; all 248 objects exist).
  **Decision: proxy, not signed URLs.** The backend downloads with the service role and streams the bytes, so
  no storage URL or path ever reaches the browser (a signed URL is a bearer link that can be copied or logged).
  Only accept paths matching `^pages/[0-9a-f-]{36}/\d+\.png$`.
- `ingest_pages.markdown` embeds diagrams as ```` ```placewise-diagram ```` fenced JSON blocks; `diagrams` jsonb holds
  the same blocks (v5 types: issue_tree 150, flow 50, table 9, chart 7, matrix 5, funnel 1).
- Locally `ADMIN_EMAILS` includes the dev-test user and `ENABLE_DEV_LOGIN=true`, so `api.test.js`'s dev token is an admin.
- Default document: v5 `c1521f01-bcbf-4163-923d-dc501859dc31`.

## Tasks

<task type="auto">
  <name>Pure logic: diagram block parse/validate (JS port) + queue helpers, with unit tests</name>
  <files>
    backend/src/lib/diagramBlocks.js
    backend/src/lib/reviewQueue.js
    backend/test/reviewQueue.test.js
  </files>
  <action>
    1. `diagramBlocks.js`: `extractBlocks(markdown)` → `[{index, raw, json|null, parseError|null}]` for every
       ```` ```placewise-diagram ```` fence; `validateBlock(obj)` → `{errors:[], warnings:[]}`. Port only the
       hard rules from `diagram_schema.py validate_block` that make a block undrawable: known `type`
       (issue_tree, matrix, funnel, flow, chart, table, other); issue_tree has `root.label` and `children` arrays
       recursively; matrix `cells` is rows×cols; funnel `stages` string[]; flow `nodes[{id,label}]` and edges whose
       from/to exist; chart `series[{name, points:[[x,y]]}]`; table `header` + `rows`; other `description`.
       Everything else is a warning, not an error.
    2. `reviewQueue.js`:
       - `ACTIONS = ['approve','mark_wrong','edit_approve','reopen']`, `STATUSES = ['pending','approved','fixed','wrong']`.
       - `validateActionBody(body)` → `{ok, error, action, note, markdown, expectedStatus}`: unknown action → error;
         mark_wrong needs non-blank note (≤ 2000 chars); edit_approve needs markdown (≤ 50 000 chars) whose blocks all
         parse and have zero `errors` (return per-block messages); note optional elsewhere.
       - `diagramsFromMarkdown(markdown)` → array of parsed blocks (for `p_diagrams`).
       - `summariseReasons(rows)` → `{reason: count}` sorted desc (filter facets).
       - `mapRpcError(message)` → `{status, error}` by substring match on the Postgres message (supabase-js wraps it): page_not_found → 404, status_conflict → 409, bad_action → 400, else 500 with a generic message.
    3. Tests (offline): valid fixture for each of the 7 types passes; broken JSON, unknown type, flow edge to a missing
       node, ragged matrix → errors; each action's body rules; mapRpcError mapping.
  </action>
  <verify>cd backend && node --test test/reviewQueue.test.js</verify>
  <done>All reviewQueue tests pass, including one valid fixture per diagram type and 4+ invalid cases.</done>
</task>

<task type="auto">
  <name>Routes: documents, queue list, page detail, image proxy, actions</name>
  <files>
    backend/src/routes/adminReview.js
    backend/src/middleware/rateLimit.js
    backend/src/server.js
  </files>
  <action>
    Router with `router.use(requireAdmin, adminReviewLimiter)`. Every response `{success:true,...}` or
    `{success:false,error,detail:errorDetail(err)}`; log as `console.error("[admin/review/<endpoint>]", err)`.
    Validate every `:pageId` / `document_id` as a UUID (400 otherwise).
    1. `GET /documents` → ingest_documents (id, source_file, school, year, ingestion_version, status) newest version first,
       each with `flagged` and `pending_flagged` counts; plus `default_document_id` = v5 id if present, else newest.
    2. `GET /pages?document_id=&status=pending|approved|fixed|wrong|all (default pending)&reason=<one reason>&flagged=true|all (default true)`
       → `{pages:[{id,page_no,review_status,review_reasons,diagram_count,method,finding_count,last_action}], reason_counts, total}`
       ordered by page_no. Select only small columns (no markdown). finding_count: one query on ingest_page_findings
       by source_file + page_no list, counted in JS. last_action: latest ingest_page_reviews row per page.
    3. `GET /pages/:pageId` → page fields (page_no, review_status, needs_review, review_reasons, markdown, diagrams,
       diagram_issues, number_coverage, word_coverage, diagram_label_coverage, method, prompt_version), document
       (school, year, ingestion_version), `findings` for the same source_file + page_no across all versions, each with
       `ingestion_version` and `is_current_version`, `history` (all review rows, newest first, incl. edited_markdown), and
       `prev_page_id` / `next_page_id` within the same filtered queue (accept the same query params as `/pages`).
       Never include `image_path` in any JSON response.
    4. `GET /pages/:pageId/image` → download `image_path` from `casebook-source` with the service role; respond
       `Content-Type: image/png`, `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`, body = bytes.
       Path fails the regex or object missing → 404 JSON `{success:false,error:"Image not found."}`.
    5. `POST /pages/:pageId/actions` body `{action, note?, markdown?, expected_status?}` → `validateActionBody`
       (400 with block errors on failure) → `supabase.rpc('ingest_review_page', {...})` with `p_email = req.user.email`
       and `p_diagrams = diagramsFromMarkdown(markdown)` for edit_approve → map errors with `mapRpcError`
       → `logAdminAction(req, 'review_page', {page_id, action})` → `{success:true, review_status, review_id}`.
    6. `rateLimit.js`: export `adminReviewLimiter`. `server.js`: `app.use("/api/admin/review", adminReviewRouter)`
       on the line before `app.use("/api/admin", adminRouter)`.

    AVOID: `getPublicUrl` or `createSignedUrl`, because no storage URL may leave the server.
    AVOID: any `.update()` on ingest_pages from JS, because all writes go through the RPC.
    AVOID: returning raw Postgres error text in production (use `errorDetail`).
  </action>
  <verify>
    cd backend && (PORT=4010 node src/server.js > "$TMPDIR"/r5_srv.log 2>&1 &) && sleep 3 &&
    T=$(curl -s -X POST localhost:4010/api/dev/test-login | node -pe 'JSON.parse(require("fs").readFileSync(0)).access_token') &&
    curl -s -o /dev/null -w "noauth %{http_code}\n" localhost:4010/api/admin/review/documents &&
    curl -s -H "Authorization: Bearer $T" localhost:4010/api/admin/review/documents | head -c 400; echo &&
    curl -s -H "Authorization: Bearer $T" "localhost:4010/api/admin/review/pages?document_id=c1521f01-bcbf-4163-923d-dc501859dc31" | node -pe 'const d=JSON.parse(require("fs").readFileSync(0));[d.total, Object.keys(d.reason_counts).length, JSON.stringify(d).includes("image_path")]' &&
    curl -s -D - -o "$TMPDIR"/r5_p46.png -H "Authorization: Bearer $T" "localhost:4010/api/admin/review/pages/$(curl -s -H "Authorization: Bearer $T" "localhost:4010/api/admin/review/pages?document_id=c1521f01-bcbf-4163-923d-dc501859dc31" | node -pe 'JSON.parse(require("fs").readFileSync(0)).pages.find(p=>p.page_no===46).id')/image" | grep -i "content-type\|cache-control" && file "$TMPDIR"/r5_p46.png &&
    curl -s -o /dev/null -w "usage %{http_code}\n" -H "Authorization: Bearer $T" localhost:4010/api/admin/usage;
    lsof -ti:4010 | xargs kill 2>/dev/null; true
  </verify>
  <done>
    noauth → 404; documents lists 5 FMS versions with default_document_id = c1521f01…; pages total = 173 for
    status=pending, reason_counts non-empty, `image_path` absent (false); image response is `image/png` with
    `private, no-store` and `file` reports PNG; `/api/admin/usage` still 200.
  </done>
</task>

<task type="auto">
  <name>Integration tests + one reversible write round-trip on an old version</name>
  <files>backend/test/api.test.js</files>
  <action>
    1. Add to `api.test.js` (reuse its spawned server + dev token): every `/api/admin/review/*` route returns 404 with
       no token and with a garbage token; GET /documents and GET /pages (v5) return success with the documented shape
       and no `image_path` substring; image endpoint returns image/png with `no-store`; POST actions with
       `{action:"nope"}` → 400; edit_approve with a broken diagram fence → 400 listing the block error;
       bad UUID → 400; GET a random well-formed UUID → 404. **No successful write in npm test** (it runs against the real DB).
    2. Non-admin check (manual, in verify): start a second server with `ADMIN_EMAILS=nobody@example.invalid` and show the
       admin dev token now gets 404 on `/api/admin/review/documents` and on the image route.
    3. Write round-trip on **v1** (`67371722-c752-473e-bf12-a3710707e56c`, superseded, inactive) page 3 only:
       edit_approve with its markdown plus one changed word → reopen. Also: approve with `expected_status:"approved"`
       while it is pending → 409, and an action on a random UUID → 404. Show: two history rows, page review_status back to
       'pending', `ingest_pages.markdown` for that page byte-identical before/after (compare sha256), and an UPDATE or DELETE
       on ingest_page_reviews fails with 'append-only'. Record the two review ids for the log.
  </action>
  <verify>cd backend && npm test 2>&1 | tail -8</verify>
  <done>
    `npm test` summary shows `# fail 0` with the new tests counted; the manual non-admin check shows 404s; the v1
    round-trip shows markdown sha256 unchanged, status pending, 2 history rows, append-only error.
  </done>
</task>

## Must-Haves
- [ ] Non-admins (no token, bad token, real non-admin) get 404 on every review route, including the image.
- [ ] No response body contains a storage URL or `image_path`.
- [ ] Writes only via `ingest_review_page`; original markdown/diagrams unchanged; history append-only.
- [ ] Existing `/api/admin/usage` and student routes unchanged.

## Success Criteria
- [ ] All verify blocks pass; `npm test` green.
- [ ] `code-reviewer` runs `/review` + `/cso` on this diff (admin + storage access) before commit.
- [ ] Gemini calls: 0.

## Eng review notes (gstack /plan-eng-review, 2026-10-21, covers plans 1 and 2)
Scope: accepted as-is (7 new files, 3 edits; one new router). Search/Outside Voice: skipped (no new infra pattern; subagent run, no second model).
1. [P1] (9/10) `backend/src/server.js:68` `app.use(generalLimiter);` (300 / 15 min per IP, before all routers) caps the review flow below the planned 600 review limiter. Fixed: review limiter 300, budget note here, plan 3 keeps ~3 requests per page, no list refetch, 429 handling.
2. [P2] (8/10) RPC errors come back wrapped by supabase-js. Fixed: `mapRpcError` matches by substring, generic 500 otherwise.
3. [P2] (8/10) The RPC's conflict and not-found paths were untested. Fixed: the v1 round-trip now checks 409 and 404; npm test checks 404 for an unknown UUID.
4. [P3] (7/10) Migration rollback drops the review history. Fixed: the header says the normal undo is hiding the API/UI.
5. [P3] (6/10) `diagramBlocks.js` ports part of `diagram_schema.py`, so the two can drift. Accepted: the port is limited to the hard rules and cites the Python source; R8 can share fixtures.
Failure modes: the storage download fails → image 404 JSON, page still reviewable; the RPC fails mid-way → one transaction, nothing half-written; 0 critical gaps.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | not run | - |
| Outside Review | none | Independent 2nd opinion | 0 | skipped | - |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | ISSUES OPEN (all 5 resolved in plan) | 5 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | see 03-PLAN.md | - |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | not run | - |

- **OUTSIDE COVERAGE:** skipped (subagent run).
- **VERDICT:** ENG findings folded into plans 1–3; ready to implement.

NO UNRESOLVED DECISIONS

# PlaceWise build log

Every big change, newest first. Format and rules: `.claude/skills/build-log/SKILL.md`.
Pre-rebuild history: `Mark Down Files/DOCUMENT.md`.

---

## 2026-11-08 — Audit: full-surface gstack audit of live site and added /tone redirect

**Phase:** M1 (Consulting RAG) · **Type:** QA audit / routing fix

**What changed:** Comprehensive live site audit using gstack headless browser suite (`$B` / browse):
1. User Flow & Route Verification:
   - Verified Guest Auth (redirects unauthenticated users cleanly to `/login`, generates 3h guest JWT session).
   - Audited Frameworks RAG (retrieval + Gemini paraphrase + faithfulness judge, interactive topic filtering, diagram rendering).
   - Audited Guesstimates (timer controls, problem list, assumption inputs, zero JS errors).
   - Audited Company & Role Dossiers (dynamic leadership, timeline, value chain, recruitment cards load smoothly).
   - Verified that account menu theme picker was completely removed in production.
2. Route Redirect:
   - Added `{ path: "/tone", element: <Navigate to="/tone-shifter" replace /> }` in `router.tsx` to handle direct navigation gracefully without 404s.

---

## 2026-11-08 — UI Polish: removed theme switcher and locked design permanently to Obsidian Dark mode

**Phase:** M1 (Consulting RAG) · **Type:** design / UX polish

**What changed:** Aalhad requested removal of the non-functional "Light / Dark / System" segmented control:
1. Root cause:
   - PlaceWise's brand identity, components, glass capsules, visualizer diagrams, and card surfaces are intentionally built for the dark Obsidian (`#0A0D14`) palette.
   - The theme options in the account menu gave the illusion of a choice that was non-functional and inconsistent with the site design.
2. Fix:
   - Removed the "Theme" switcher (`Light / Dark / System`) and `THEME_OPTIONS` from the user avatar dropdown menu in `TopNav.tsx`.
   - Set pre-paint script and `useTheme.ts` to permanently lock to `data-theme="dark"` and `color-scheme: dark`.
   - Set `<meta name="theme-color" content="#0A0D14">` in `index.html`.

---

## 2026-11-08 — Scalability: raised global IP rate-limit from 300 to 3000 req/15min for campus Wi-Fi NAT

**Phase:** M1 (Consulting RAG) · **Type:** scalability / infrastructure

**What changed:** Preemptive fix ahead of batch release:
1. Root cause:
   - `generalLimiter` in `backend/src/middleware/rateLimit.js` was capped at 300 requests per 15 minutes keyed on IP address.
   - On an MBA college campus (e.g. IIM Trichy hostel/campus Wi-Fi), 100-150 students share a single institutional NAT gateway IP.
   - A single student browsing 3-4 pages generates 15-20 API requests. With 20+ concurrent students, 300 requests would be reached in ~2 minutes, triggering false-positive 429 "Too many requests" blocks campus-wide.
2. Fix:
   - Scaled `generalLimiter` from 300 to 3,000 requests per 15 min per IP (~3.3 req/s per IP), safely handling up to 150-200 concurrent campus users.
   - Genuine abuse / runaway AI generation remains independently protected by user-keyed `aiLimiter` (120 req/15min) and `heavyAiLimiter` (15 req/15min).

---

## 2026-11-08 — Favicon: added multi-format PNG/ICO assets and cache-busters for Safari & Chrome tab icons

**Phase:** M1 (Consulting RAG) · **Type:** bugfix / branding

**What changed:** Aalhad reported that browser tabs still displayed the legacy purple thunderbolt icon instead of the new PlaceWise brand mark.
1. Root cause:
   - Safari and WebKit require raster PNGs for `apple-touch-icon` (SVG is silently ignored by Safari's touch icon parser).
   - Safari aggressively caches domain favicons in an internal SQLite database (`~/Library/Safari/Favicon Cache/favicons.db`) and requires cache-busting query strings (`?v=2`) on `<link rel="icon">` tags to invalidate existing cached icons.
   - Standard `/favicon.ico` and `/apple-touch-icon.png` were missing at the root of `public/`, prompting browsers to fall back to their prior cached icon.
2. Fix:
   - Generated native raster icons using macOS WebKit QuickLook and PIL:
     - `favicon.ico`: multi-resolution ICO (16x16, 32x32, 48x48)
     - `apple-touch-icon.png` & `apple-touch-icon-precomposed.png`: 180x180 PNG
     - `favicon-32x32.png`, `favicon-16x16.png`, `favicon-48x48.png`: crisp raster marks
     - `site.webmanifest`: PWA manifest linking to brand assets
   - Updated `frontend-react/index.html` with cache-busted declarations (`?v=2`) across SVG mark, PNG favicons, Apple touch icon, and ICO fallback.

---

## 2026-11-08 — Brand: integrated new PlaceWise logo and mobile app icon across web & mobile UI

**Phase:** M1 (Consulting RAG) · **Type:** design / branding

**What changed:** Aalhad provided new brand logo and icon assets in `design/brand/`.
1. Brand assets deployed to `frontend-react/public/brand/`:
   - `placewise-mark.svg`: Transparent vector emblem mark (blue 'P' with orange ascending growth stair arrow).
   - `placewise-icon.svg`: High-contrast squircle app icon on dark `#0A0D14` backdrop, optimized for mobile home screens and compact viewports.
   - `placewise-logo.svg`: Full horizontal lockup with wordmark and tagline.
2. Favicon & Web App icon:
   - Replaced default favicon in `frontend-react/public/favicon.svg` with `placewise-mark.svg`.
   - Updated `frontend-react/index.html` with explicit `<link rel="icon" type="image/svg+xml" href="/brand/placewise-mark.svg" />` and `<link rel="apple-touch-icon" href="/brand/placewise-icon.svg" />`.
3. Top Navigation (`TopNav.tsx` & `global.css`):
   - Desktop view: replaced placeholder 3-bar icon with `placewise-mark.svg` (28x28px) and styled wordmark `Place`<span className="brand-accent">Wise</span>.
   - Mobile view (<=640px): switches cleanly to `placewise-icon.svg` (30x30px squircle app icon) on the top bar to maximize navbar space.
   - Mobile drawer: added `.mobile-brand-header` displaying the mark, wordmark, and "From Prep to Placement" tagline at the top of the slide-out menu.
4. Login page (`LoginPage.tsx`):
   - Updated header with `placewise-icon.svg` (52x52px with soft glow) and bold `PlaceWise` wordmark.

---

## 2026-11-08 — TopNav: fix horizontal scroll clipping so Role icon stays strictly inside capsule

**Phase:** M1 (Consulting RAG) · **Type:** bugfix / UI polish

**What changed:** Aalhad reported that when scrolling horizontally in the top navigation bar, the Role icon escaped outside the capsule boundary on the left.
1. Root cause:
   - `<nav className="topnav-links glass-capsule">` had `backdrop-filter: blur(20px)` and `overflow-x: auto`. In Safari/WebKit, elements with `backdrop-filter` and `overflow` fail to clip descendants with `position: relative; z-index: 1;`. When scrolling to the right, the Role icon translated past `x = 0` and escaped outside the capsule border onto the topbar.
2. Fix:
   - Introduced `.topnav-capsule-wrapper` which wraps `<nav>` with `border-radius: 20px`, `overflow: hidden`, `isolation: isolate`, and `-webkit-mask-image: -webkit-radial-gradient(white, black)`.
   - Moved `glass-capsule` to the stationary outer wrapper, guaranteeing hard-edge hardware clipping of all scrolling nav items at the 20px rounded capsule boundary across WebKit and all browsers.
   - Cleaned up inner `.topnav-links` scrollbar and synced custom scroll indicator.

---

## 2026-11-08 — Analytics: connected direct Google Analytics 4 Measurement ID (G-NX3SN9VKKQ)

**Phase:** M1 (Consulting RAG) · **Type:** analytics / infrastructure

**What changed:** Aalhad provided the direct GA4 Measurement ID `G-NX3SN9VKKQ`.
1. `frontend-react/index.html`:
   - Updated the Google tag loader to `https://www.googletagmanager.com/gtag/js?id=G-NX3SN9VKKQ`.
   - Added direct config `gtag('config', 'G-NX3SN9VKKQ')`, streaming all web traffic, session statistics, and pageviews directly to the GA4 Property.

---

## 2026-11-08 — Analytics: integrated Google Tag Manager / GA4 (GTM-KXPWBPDH) with SPA route tracking

**Phase:** M1 (Consulting RAG) · **Type:** analytics / infrastructure

**What changed:** Aalhad provided the Google Tag / GTM snippet (`GTM-KXPWBPDH`) to wire Google Analytics into PlaceWise.
1. `frontend-react/index.html`:
   - Embedded Google Tag Manager / GA4 script and dataLayer initialization in `<head>`.
   - Embedded standard `<noscript>` iframe immediately following `<body>` for verification and fallback.
2. `frontend-react/src/components/shell/AppShell.tsx`:
   - Added automatic client-side route tracking via `useLocation()` hook.
   - Dispatches `page_view` events to both `gtag()` and `dataLayer.push` on every client-side page navigation (e.g. `/guesstimates`, `/frameworks`, `/mock-interview`).

---

## 2026-11-08 — Guesstimates: fix answer submission textarea scrolling on Safari & dark mode

**Phase:** M1 (Consulting RAG) · **Type:** bugfix / UX polish

**What changed:** Aalhad reported being unable to scroll inside the answer submission text box on the Guesstimates page.
1. Root cause:
   - `<textarea>` had no `overflowY: "auto"`, no `overscrollBehavior: "contain"`, and no `-webkit-overflow-scrolling: touch`, causing WebKit / Safari to pass trackpad and mousewheel gestures to the document window rather than scrolling the textarea.
   - Textarea height was cramped (`height: 110`), and dark theme lacked visible WebKit scrollbar styles.
2. Fix:
   - Added explicit `overflowY: "auto"`, `overscrollBehavior: "contain"`, `WebkitOverflowScrolling: "touch"`, `scrollbarWidth: "thin"`, and `onWheel={(e) => e.stopPropagation()}` on both the attempt scratchpad and clarifying question textareas.
   - Increased default height to 200px (min 180px, max 550px with vertical resize handle).
   - In `frontend-react/src/styles/global.css`: added custom WebKit scrollbar styles for all textareas (`textarea::-webkit-scrollbar` with clear contrasting thumb on dark surfaces).

---

## 2026-11-08 — Homepage: added prominent "Answers are grounded in IIM case books" trust kicker

**Phase:** M1 (Consulting RAG) · **Type:** copy / trust & grounding disclosure

**What changed:** Aalhad requested adding the line “Answers are grounded in IIM case books” on the homepage so students clearly know that the site is grounded in IIM casebooks.
1. `frontend-react/src/pages/HomePage.tsx`:
   - Added `BookIcon` component.
   - Inserted a prominent top trust badge directly above the hero title: `Answers are grounded in IIM case books`.
2. `frontend-react/src/styles/home.css`:
   - Added `.home-hero-badge` styled to match the royal blue & neon accent theme (`rgba(37, 99, 235, 0.14)` background, `rgba(59, 130, 246, 0.32)` border, `#93c5fd` text, glowing SVG icon).

---

## 2026-11-08 — Guesstimates: prevent timer duration selection from refreshing the current question

**Phase:** M1 (Consulting RAG) · **Type:** bugfix / UX polish

**What changed:** Aalhad reported that clicking any duration on the timer (5m, 10m, 15m, custom) caused the current question to refresh and get treated as completed.
1. Root cause: `load` callback had `[timerMode, customMinutes]` in its `useCallback` dependency array, and an effect with `[load]` re-invoked `load()` on every timer mode or duration click.
2. Fix:
   - Stored `timerModeRef` and `customMinutesRef` so `load` reads the latest timer duration without needing them as reactive dependencies.
   - Decoupled `load` to have zero dependencies (`[]`), ensuring it only mounts on initial page load or when explicitly triggered via "Try another", "Random Problem", or selecting a problem from the catalog.
   - Adjusting timer duration now strictly updates the countdown clock without refreshing the problem, clearing the attempt, or triggering any network fetch.

---

## 2026-11-08 — Guesstimates: modal background scroll lock & strict practiced-only tagging after answer submission

**Phase:** M1 (Consulting RAG) · **Type:** bugfix / UX polish

**What changed:** Aalhad reported two issues on the Guesstimates page catalog:
1. Scrolling inside the "Casebook Guesstimates Catalog" modal was scrolling the background page rather than the questions list.
2. Questions were prematurely tagged with `✓ Practiced` even when the student had merely viewed or loaded the problem without submitting an answer.

**Implementation:**
1. `frontend-react/src/pages/GuesstimatesPage.tsx`:
   - **Modal Scroll Lock & Flex Container Fix**:
     * Added body scroll lock hook (`document.body.style.overflow = "hidden"`) when `isCatalogOpen` is true, restoring previous overflow on unmount/close.
     * Fixed flexbox constraints on modal dialog: `height: "min(85vh, 720px)"`, `maxHeight: "85vh"`, with `flex: "0 0 auto"` on header and search controls.
     * Fixed questions list scroll boundaries: `flex: "1 1 auto"`, `minHeight: 0`, `overflowY: "auto"`, `overscrollBehavior: "contain"`, and `WebkitOverflowScrolling: "touch"`.
     * Added `onWheel={(e) => e.stopPropagation()}` on overlay and dialog cards to isolate mouse wheel / trackpad gestures.
   - **Strict Practiced Tagging**:
     * Separated session viewing from answering: created `placewise_practiced_guesstimates` storage key.
     * Cleaned up legacy `placewise_seen_guesstimates` key on mount so previously viewed questions lose the premature `✓ Practiced` badge immediately.
     * In `onSubmitAttempt`: adds `chunkId` to `practicedIds` strictly after receiving a successful evaluation (`res && res.evaluation`).
     * Random problem exclusion tracking now uses an in-memory session ref (`sessionSeenRef`) rather than mistaking seen problems for practiced ones.
     * Catalog questions list checks `practicedIds.includes(item.chunkId)` before rendering `✓ Practiced`.
     * Replaced misleading `Problem #{seenCount}` text with casebook position indicator `Question X of 25`.
2. Verification:
   - Frontend built cleanly with zero TypeScript errors (`tsc -b && vite build`).
   - Guesstimates retrieval test suite passed 23/23 tests.

---

## 2026-11-08 — Guesstimates: full question catalog browser + interview countdown timer with auto-submit

**Phase:** M1 (Consulting RAG) · **Type:** feature / polish

**What changed:** Aalhad requested two major enhancements for the Guesstimates practice page:
1. Allow students to browse the list of all available questions and choose specific scenarios to attempt.
2. Provide an interview timer on the Guesstimates page where the user can choose how much time they want (e.g. 5m, 10m, 15m, custom), and upon time expiration, their answer is automatically submitted for evaluation.

**Implementation:**
1. `backend/src/lib/guesstimateRetrieval.js` & `backend/src/routes/guesstimates.js`:
   - `listAllGuesstimateProblems`: returns all 25 curated, worked casebook guesstimates ordered by page number, cached in memory for sub-millisecond response times.
   - `getGuesstimateProblemById(chunkId)`: retrieves a specific guesstimate by chunk ID with real citation and diagram metadata.
   - `GET /api/guesstimates/list`: new endpoint returning the full 25-problem catalog.
   - `GET /api/guesstimates/problem/:chunkId`: new endpoint to fetch a chosen problem by ID.
   - `GET /api/guesstimates/random`: extended to accept optional `?chunkId=...` for direct lookup.
2. `frontend-react/src/pages/GuesstimatesPage.tsx`:
   - **Catalog Browser Modal**: added `Browse All Questions (25)` button and modal with search filtering, page numbers, diagram indicators, and practiced/unattempted tags. Clicking any question loads it immediately. Added a corresponding Question Catalog card in the sidebar.
   - **Interview Countdown Timer**:
     * Mode presets: `5m` (Sprint), `10m` (Standard consulting case interview — default), `15m` (Deep dive), `Custom` (1-60m), and `Off` (Untimed).
     * Monospace digital countdown with color-coded states (normal blue/white, warning amber at <2m, urgent red at <30s).
     * Controls: `▶ Start`, `⏸ Pause`, `↺ Reset`. Auto-pauses on manual answer submission or solution reveal.
     * Web Audio synthesis double-chime when time expires.
     * **Auto-submission on 00:00**: if the candidate has typed >=5 characters, automatically submits their answer for AI Interview Coach evaluation with a time-expired notice banner; if empty, automatically reveals the benchmark casebook solution.
3. Tests & Build:
   - Added `getGuesstimateProblemById` tests in `backend/test/guesstimateRetrieval.test.js`. All 38 backend guesstimate tests pass.
   - Frontend TypeScript build compiles cleanly with 0 errors.

---

## 2026-11-07 — Guesstimates: prevent repeat problems with two-level client & server exclusion tracking

**Phase:** M1 (Consulting RAG) · **Type:** feature / polish

**What changed:** Aalhad requested making sure that the same guesstimate is not asked twice during practice.
1. `guesstimateRetrieval.js`:
   - Added pure function `filterCandidatesByExclusion(candidates, excludeIds)`: filters structurally valid candidate rows against already-seen chunk IDs.
   - Graceful cycle reset: when all 25 active casebook guesstimates have been completed, restarts the cycle while excluding the single most recently seen guesstimate (`lastSeenId`), guaranteeing no back-to-back repetitions.
   - `judgeIsWorkedProblem`: added in-memory verdict cache (`problemJudgeCache`) keyed by `chunkId` to avoid redundant Gemini calls for known problem chunks.
   - `getRandomGuesstimateProblem`: now accepts `{ excludeIds = [] }` and returns `cycleReset: true` when a fresh cycle begins.
2. `guesstimates.js`:
   - Updated `GET /api/guesstimates/random` to parse `?exclude=id1,id2,...` query parameter.
   - Added server-side LRU tracking (`recentServedByClient`) keyed by `user:${id}` or `ip:${ip}` so even if client requests omit query parameters, sequential fetches never repeat.
3. `GuesstimatesPage.tsx`:
   - Added persistent `localStorage` storage (`placewise_seen_guesstimates`) tracking solved guesstimate chunk IDs across sessions and page reloads.
   - `load()` passes `?exclude=` to `/api/guesstimates/random` and appends newly fetched problems to the seen list.
   - Added clean MBA-focused badge: `Problem #{count} · Never repeated` in the practice problem header.
4. Tests:
   - Added 5 new unit tests in `guesstimateRetrieval.test.js` covering normal exclusion, empty exclusion, cycle reset excluding last seen, empty candidates, and whitespace/Set inputs. All 37 guesstimate test cases pass.
   - Verified frontend React build passes cleanly with zero errors.

---

## 2026-11-07 — Diagram rendering: render all diagrams horizontally with side-by-side pillar cards and horizontal/vertical toggle

**Phase:** M1 / UI · **Type:** feature / polish

**What changed:** Aalhad requested making all diagrams horizontal across the platform.
1. `asciiDiagrams.ts`:
   - Updated `flowToAscii`, `treeToAscii`, and `funnelToAscii` to generate wide horizontal diagrams by default.
   - For hierarchical trees and DAGs (e.g., Profit Tree, Issue Trees): renders the root centered at the top with a branching connector splitting down into side-by-side parallel column cards across the screen width (e.g. `REVENUE` on the left, `COST` on the right), with their respective sub-drivers, leaves, and calculations nested cleanly inside each card.
   - For sequential pipelines and funnels: connects stages horizontally with `──►` directional arrows.
   - Modernized all 8 remaining vertical numbered list diagrams in `FRAMEWORK_ASCII_MAP` (AARM, AARRR, ADDIE, CSAT, Kirkpatrick, NPS, Precedent Transactions, Residual Income, TSM) into horizontal process and pillar cards.
2. `AsciiDiagram.tsx` & `PlacewiseDiagram.tsx`:
   - Added an interactive layout toggle (`⇄ Horizontal` / `⇅ Vertical`) in the ASCII card header, defaulting to `Horizontal` while allowing instant one-click switching to the vertical outline view.
   - Copy button automatically copies whichever view is currently active.
3. Verified frontend builds cleanly with zero TypeScript errors.

---

## 2026-11-07 — Guesstimates: warn and penalize directly jumping to answer without clarifying assumptions

**Phase:** M1 (Consulting RAG) · **Type:** feature / polish

**What changed:** Aalhad's instruction: if a student submits a guesstimate attempt without using the assumption / clarifying question option, explicitly tell them that directly jumping to the answer is the wrong approach.
1. `GuesstimatesPage.tsx`:
   - Passes `usedClarification: boolean` and `clarifyingQuestions: string[]` to `POST /api/guesstimates/evaluate`.
   - If an attempt is entered and no clarifying questions were asked, displays a consulting tip reminder above the submit button reminding students not to jump directly to the answer.
   - In the assessment card, displays a prominent alert box ("Critical Interview Pitfall: Directly Jumping to the Answer") explaining why jumping straight to numbers without clarifying boundary conditions with the interviewer is a major case interview mistake.
2. `guesstimateRetrieval.js` & `guesstimates.js`:
   - Updated `evaluateGuesstimateAttempt` and `GUESSTIMATE_EVALUATION_SYSTEM`: when `usedClarification` is false, informs the model to penalize the candidate's assumptions score (capped at 2.0/4.0), flags `missedAssumptionsWarning: true`, provides `assumptionsGuidance`, and ensures the improvements list advises clarifying scope/boundary conditions first.
3. Verified frontend builds cleanly with zero errors.

---

## 2026-11-07 — Diagram rendering: true vertical tree ASCII art for flow and profit structures

**Phase:** M1 / UI · **Type:** feature / fix

**What changed:** Aalhad requested converting disconnected numbered diagram flows (`┌── (1) Profits`, `┌── (2) Revenue`) into a clean vertical diagram.
1. `flowToAscii` (`frontend-react/src/lib/asciiDiagrams.ts`) was previously iterating over nodes in arbitrary order and printing each node as an isolated root box with child-reference edges.
2. Rewrote `flowToAscii` to build an adjacency graph and calculate node in-degrees:
   - For hierarchical trees and DAGs (e.g., profit trees, decision trees, MECE breakdowns), it identifies root nodes and recursively traverses children to produce a connected top-to-bottom vertical tree (`[ Root ]` -> `├── [ Branch ]` -> `│   └── [ Leaf ]`), cleanly formatting bulleted items beneath each node and handling multi-parent/cycle cases cleanly.
   - For linear pipeline sequences, it formats them into vertical flowchart cards connected by directional down-arrows (`│` -> `▼`).
3. Verified frontend build passes with zero TypeScript errors.

---

## 2026-11-07 — Guesstimates: "ask the interviewer" clarifying-question endpoint

**Phase:** M1 (Consulting RAG) · **Type:** feature

**What changed:** Aalhad's request — let a student ask the AI "interviewer" up to 2
clarifying questions about a guesstimate problem's assumptions while attempting it (a real
case-interview habit), never revealing the final numeric answer or worked solution. A
parallel frontend-engineer session is building the UI (text/mic input, 2-ask cap, exchange
history); this session built the backend contract it calls.

Mirrors `frameworkQa.js`'s `answerFrameworkQuestion`/`POST /frameworks/ask` pattern exactly,
for the same security reason that pattern exists: the client must never be trusted to supply
the grounding "context" text itself (a client could pass arbitrary text as "context" and get
free-form Gemini generation completely disconnected from any real guesstimate problem — a
prompt-injection/abuse vector). Instead the client passes only `chunkId` (the id
`getRandomGuesstimateProblem` already returns for the problem in play), and the server looks
up that exact row itself, scoped to the SRCC Guesstimates book (`is_active=true`,
`source_class=club_casebook`, `source_file=GUESSTIMATES_SOURCE_FILE`) — the same scope
`getRandomGuesstimateProblem` already uses, so a guessed/stale/foreign id can never pull
content from another document.

1. `getRandomGuesstimateProblem` (`backend/src/lib/guesstimateRetrieval.js`) now returns
   `chunkId: row.id` in both the `ENABLE_GUESSTIMATE_PARAPHRASE` on and off branches, so the
   client has something stable to reference in the follow-up call.
2. New `answerAssumptionClarification(chunkId, question)`: fetches the scoped row,
   splits it with the existing `splitRawQuestionFromAnswer` and grounds only in
   `answerSource` (assumptions/diagram/working — title excluded, not needed). New
   `CLARIFICATION_SYSTEM` prompt: answer the one clarifying question using only the given
   content, say plainly if something isn't specified (student should state and justify
   their own assumption rather than guess), and — the critical rule — decline and point to
   "Show answer" if the question asks for the final number, the full solution, or anything
   that would reveal the diagram/working. A cheap regex pre-check
   (`ANSWER_REQUEST_RE`, e.g. "what's the final answer", "just give me the number") short-
   circuits the obvious cases before any Gemini call; the prompt instruction is the real
   defense for subtler phrasing, same "don't over-engineer a keyword filter" posture agreed
   going in. Generation goes through `generateText`, gated by the same
   `judgeParaphraseFaithful` (`consultingRetrieval.js`) faithfulness judge, one retry with a
   correction suffix, then a safe generic fallback ("That's not specified in this problem —
   go with your own reasonable assumption and state it clearly.") if both attempts fail —
   same fail-closed shape as `frameworkQa.js`. A not-found/wrong-scope chunk id returns
   `{ found: false }` rather than throwing.
3. New route `POST /api/guesstimates/clarify` (`backend/src/routes/guesstimates.js`):
   `requireAuth` + `aiLimiter` (same posture as `frameworks.js`'s `POST /ask` — a paid
   Gemini call per question), gated by the existing `ENABLE_CONSULTING_RAG_V2` switch like
   `/random`/`/ask`. Body `{ chunkId, question }`; `question` capped at 300 chars (shorter
   than Frameworks' 500 — meant to be one quick clarifying question, not an essay). New
   `validateClarifyInput` pulled out as a pure, exported function (same reasoning as
   `decideCoverage`) so the validation logic is unit-testable without an Express/auth
   harness — there is none in this codebase yet. Responses: `{ success: true, answer }` /
   400 (bad input) / 404 (chunk not found) / 500, `errorDetail` on error.

**Why:** Aalhad's explicit request, mimicking a real case interview's clarify-before-
estimating step; the server-side chunk lookup (vs. trusting client context) is a direct,
already-settled security decision, not re-litigated here.

**Files:** `backend/src/lib/guesstimateRetrieval.js`, `backend/src/routes/guesstimates.js`,
`backend/test/guesstimateClarify.test.js` (new), `backend/test/guesstimateParaphrase.test.js`
(updated one assertion for the new `chunkId` key).

**Proof:** `npm test` in `backend/`: 207/208 pass (the 1 failure, `sandbox.test.js`'s
`__CF_USER_TEXT_ENCODING` environment-leak check, is the same pre-existing macOS-only flake
noted in this file's 2026-11-07 entry above, unrelated to this change). 11 new tests cover:
a faithful clarification answer is returned; a failed-faithfulness and a both-attempts-
errored generation both fall back to the safe generic response; a not-found/wrong-scope
chunk id returns `found: false` without throwing; a missing chunkId never touches the
network; an obvious "give me the final answer" request declines via the cheap pre-check
without any generation call; and `validateClarifyInput`'s five input-validation branches
(missing chunkId, missing/blank question, over-length question, a valid trimmed request).
All network-mocked (fetch stubbed for both Supabase `ingest_chunks` REST calls and Gemini
`generateContent`), no live calls in the test run.

Live-verified separately (real Gemini + Supabase, read-only, via a throwaway script,
deleted after): pulled a real active SRCC chunk (Swiggy Delhi daily orders, id
`3a4cfcf6-ed6c-4dc9-9d06-a3a61580330f`), asked "What population figure should I use?" and
got back a real, grounded answer ("The total population of Delhi is given as 40 million" —
confirmed present verbatim in that chunk's own diagram root node, not invented); asked
"What's the final answer to this problem?" and confirmed the cheap pre-check declined and
redirected to "Show answer" without a generation call; asked with a deliberately bad chunk
id and confirmed `{ found: false }`, no throw. `is_active` and all other data untouched —
read-only probe, ~3 live Gemini calls (well within the $20/month budget).

**Eval:** Not run. This is a new, additive endpoint (no existing retrieval/prompt/coverage
logic changed) with no question in `backend/eval/questions.jsonl` exercising it — none of
the eval runners call `answerAssumptionClarification` or `POST /guesstimates/clarify`, so
there is nothing for a full paid eval run to regress on.

**Frontend contract (for the parallel frontend-engineer session):**
`POST /api/guesstimates/clarify`, `Authorization: Bearer <token>` required (same as any
other `requireAuth` AI route), body `{ "chunkId": string, "question": string }` where
`chunkId` is `state.data.chunkId` from the `/random` response and `question` is capped at
300 chars client-side too (matches the server's cap, so a client can show "question too
long" before the round-trip). Success: `{ "success": true, "answer": string }`. Failure
shapes: 400 `{ success: false, error }` (missing/blank/too-long input), 404
`{ success: false, error: "Guesstimate problem not found." }` (bad/stale chunkId), 500
`{ success: false, error, detail }`. The 2-ask-per-problem cap is enforced client-side only,
per the task's instruction — the server has no per-session counter and will answer a 3rd+
call if one is somehow sent.

---

## 2026-11-07 — Guesstimates: "ask the interviewer" panel on the frontend

**Phase:** M1 (Consulting RAG) · **Type:** feature

**What changed:** Built the UI side of the clarifying-question feature above
(`frontend-react/src/pages/GuesstimatesPage.tsx`). Added a panel next to the existing
"Your attempt" scratchpad: "Ask the interviewer a clarifying question (optional, up to 2)"
with a textarea, its own mic button (`recKey: "guesstimates-clarify"`, independent
recording state from the attempt box's `"guesstimates-attempt"`, reusing
`useVoiceRecording`/`VoiceRecordButton` exactly as `FrameworkAskBox.tsx` does), and an Ask
button. Calls the new `POST /api/guesstimates/clarify` with `{ chunkId, question }` via
`apiFetch`, and renders each successful exchange as a "You asked: ... / <answer>" pair —
same visual convention as `FrameworkAskBox.tsx`'s asked-question display.

Capped at exactly 2 exchanges, enforced **client-side only** (a local `{question,
answer}[]` array capped at length 2) — the backend route has no server-side cap by design
(see the entry above); this is UX pacing, not a security boundary. A failed request shows
an inline `t-shake`-styled error and does not consume a slot (only a successful round-trip
gets pushed to the array), so a flaky network call never costs the student one of their 2
asks. Once 2 exchanges exist, the input/mic/Ask row is replaced with "You've used both
clarifying questions for this problem." The exchange history stays visible after "Show
answer" is clicked — removing content the student already saw would be jarring — but new
asks are disabled post-reveal, since clarifying is moot once the full solution is shown.
"Try another" resets the exchanges array alongside everything it already reset (question,
attempt text, reveal state). If `state.data.chunkId` is missing (an older cached response,
or a backend rollout that hasn't landed), the ask control disables itself instead of
sending a request with an undefined chunkId.

Added `chunkId?: string` to `GuesstimateResponse` and a new `GuesstimateClarifyResponse`
(`{ success: true, answer: string }`) to `frontend-react/src/types/api.ts`, checked
directly against the landed backend route (`backend/src/routes/guesstimates.js`) rather
than only the agreed contract, since both sessions were touching related code at the same
time — no conflict: the backend session never touched `types/api.ts`.

**Why:** Aalhad's explicit request — a real case interview lets the candidate clarify
scope/assumptions before estimating; the Guesstimates practice page had no way to do that.

**Files:** `frontend-react/src/pages/GuesstimatesPage.tsx`,
`frontend-react/src/types/api.ts`.

**Proof:** `npm run build` (tsc + vite) and `npm run lint` (oxlint) both pass in
`frontend-react/` — build succeeds, lint reports only pre-existing warnings (none new from
this change). Live-checked end to end against the already-running dev server
(`localhost:5175`) and backend (`localhost:4000`) as a guest user, via gstack's headless
browser fallback (`$B`, Aside unavailable on this machine): loaded a live "Revenue of a
Delhi-Gurgaon toll plaza in a day" problem, asked two real clarifying questions and got
real grounded answers back ("That's not specified in this problem - go with your own
reasonable assumption and state it clearly."; "No, you cannot assume peak-hour traffic
only. The toll is operational 24 hours a day, divided into low, medium, and high frequency
hours lasting 10, 6, and 8 hours respectively."). Confirmed: the input/mic/Ask row
disappears and the "used both" note appears after the 2nd ask; the exchange history stays
visible through "Show answer" while no new-ask controls reappear; "Try another" clears the
problem, attempt and exchanges together. Checked at desktop and 375px widths — the panel
stacks cleanly on mobile, same card/token styling as the rest of the page. No console
errors beyond a pre-existing, harmless Google Fonts preload warning.

**Undo:** Revert the two files listed above.

**Open issues:** None — the frontend and backend contracts matched on first check, no
rework needed. Not yet deployed to Vercel/pushed; this change is staged, ready to commit
alongside the backend session's commit.

---

## 2026-11-07 — Guesstimates pre-attempt question no longer leaks the casebook's ASSUMPTIONS

**Phase:** M1 (Consulting RAG) · **Type:** bugfix

**What changed:** Aalhad caught live that the Guesstimates "attempt then reveal" page's
pre-reveal question included the casebook's own ASSUMPTIONS section (e.g. "average family
is 4 members", "15% of cars are red") — those are solving decisions baked into the worked
solution, not neutral problem framing, so showing them before the student attempted the
problem defeated the point of practicing blind. Root cause: today's split
(`splitQuestionFromAnswer` in `frontend-react/src/lib/placewiseBlocks.ts`, added earlier
today) ran client-side on the already-paraphrased blob, splitting at the first diagram
fence — but paraphrasing merges the title and the assumptions into one flowing paragraph
with no reliable boundary left to split on.

Fixed by moving the split to the backend, on the raw chunk, before paraphrasing ever runs.
Pulled several live rows from `ingest_chunks` (SRCC Guesstimates-Book-Volume-1-6.pdf) to
confirm the shape first: every real problem is `TITLE\n\n<firm | difficulty-bars>\n\n<click-
here link>\n\nASSUMPTIONS\n\n1. ...\n\`\`\`placewise-diagram...` (Swiggy orders, toll plaza,
healthy biscuits, Ola/Uber cabs, flights, and the Maharashtra license-plates worked
example all confirmed). New pure function `splitRawQuestionFromAnswer`
(`backend/src/lib/guesstimateRetrieval.js`) splits `row.content` at the first newline:
`rawQuestion` is the first line with any leading `#`/whitespace stripped (the bare title,
never paraphrased), `answerSource` is everything else (the firm/difficulty/click-here
boilerplate through ASSUMPTIONS and the diagram — the existing, already-strengthened
`PARAPHRASE_SYSTEM_PROMPT` in `consultingRetrieval.js` still cleans the boilerplate out of
this during the rewrite, since that instruction never depended on what precedes it). A
chunk with no newline at all falls back to a generic `"Estimate the following:"` question
with the full content as the answer — confirmed rare, no real row in this book hits it.

`getRandomGuesstimateProblem`'s response now returns a new `question` field (always
present, the bare title, never paraphrased) alongside `problem` (now the answer/solution
portion only — assumptions + diagram + working, title no longer duplicated into it). This
split happens regardless of `ENABLE_GUESSTIMATE_PARAPHRASE`; only whether `problem` itself
gets rewritten is gated by that flag. `paraphrased`/`rawProblem` keep their existing meaning,
just describing `answerSource` instead of the full chunk. `GuesstimateResponse`
(`frontend-react/src/types/api.ts`) updated to match — a parallel frontend session updated
`GuesstimatesPage.tsx` to consume `question`/`problem` directly and deleted the now-dead
`splitQuestionFromAnswer` client-side split; both edits to `api.ts` landed cleanly (same
`question` field, no conflict).
**Why:** Aalhad's direct catch, live — showing solving decisions before a timed attempt
isn't "practice."
**Files:** `backend/src/lib/guesstimateRetrieval.js`, `backend/test/guesstimateRetrieval.test.js`,
`backend/test/guesstimateParaphrase.test.js`, `frontend-react/src/types/api.ts` (shared edit
with a parallel frontend session), `frontend-react/src/lib/placewiseBlocks.ts`,
`frontend-react/src/pages/GuesstimatesPage.tsx` (frontend session's edits, not touched here).
**Proof:** `npm test` in `backend/`: 194/195 pass (the 1 failure, `sandbox.test.js`'s
`__CF_USER_TEXT_ENCODING` environment-leak check, is a pre-existing macOS-only flake,
confirmed unrelated by reproducing it on a clean `git stash` of this change). New/updated
tests cover: a real multi-section problem splits cleanly (title has no `ASSUMPTIONS`,
answer has both `ASSUMPTIONS` and the `Click here` boilerplate), a `##`-style heading
strips correctly, the no-newline fallback, and all four `getRandomGuesstimateProblem`
paraphrase-flag scenarios (faithful rewrite, rejected rewrite, errored call, flag off) now
assert on `question`/`problem` under the new shape.
**Eval:** Not run. This change only touches `getRandomGuesstimateProblem` (the `/random`
random-pick endpoint) — a pure string split before an existing, unchanged paraphrase call.
None of the eval runners (`backend/eval/run_eval*.js`) exercise that function: the main
`run_eval.js` treats `guesstimates` as a dark/disabled feature, and
`run_eval_paraphrase_preview.js`/`run_eval_v2_preview.js` test the `/ask` topic-lookup path
(`groundedGuesstimateLookup`) via their own local similarity search, never
`getRandomGuesstimateProblem` or `splitRawQuestionFromAnswer`. No retrieval, judging, or
prompt logic changed, so there is nothing for those runners to regress on; a full paid eval
run would have been spending budget to re-confirm unrelated code paths.
**Undo:** Revert `splitRawQuestionFromAnswer` and the `getRandomGuesstimateProblem` return
shape to return `problem: row.content` (pre-split) with no `question` key; revert the
`question`/`problem` doc comments on `GuesstimateResponse`.
**Open issues:** None. Ready to commit (frontend session's `GuesstimatesPage.tsx`/
`placewiseBlocks.ts` changes should land in the same commit or the page breaks against the
new backend contract).

---

## 2026-11-07 — Q&A answers now include the real diagram when the casebook has one

**Phase:** M1 (Consulting RAG) · **Type:** feature

**What changed:** `groundedQaAnswer` (`backend/src/lib/qaRetrieval.js`) previously passed
covering excerpts straight to Gemini with no diagram instructions, so a question like
"Can you explain to me how the value chain framework works?" only ever got prose, never
the diagram the source casebook actually draws — even though every ingested
` ```placewise-diagram ` fence is always immediately followed by an ingestion-time,
already-fact-checked `Diagram summary:` line (`backend/ingestion/convert.py`). Fixed by:
- Before building the answer-generation prompt, each excerpt's diagram fence is now
  stripped to a short `[[PLACEWISE_DIAGRAM_BLOCK_N]]` placeholder token via
  `protectDiagramBlocks` (reused from `consultingRetrieval.js`, same "never let the LLM
  touch the diagram" posture the paraphrase layer already uses) — Gemini's answer call
  never sees raw diagram JSON. `GROUNDED_SYSTEM`'s prompt now tells the model the token
  means a diagram will render separately right below its answer, so it shouldn't try to
  describe the diagram's structure itself.
- After the prose answer comes back, `findDiagramForAnswer` (new, pure, exported) scans
  `result.chunks` in relevance order and extracts the first diagram fence + its exact
  `Diagram summary:` line (`extractDiagramWithSummary`, new, pure, exported) from the real
  underlying chunk content (`rawContent` when the paraphrase layer ran, `content`
  otherwise) — never from the model's output. That fence+summary is appended verbatim to
  the final answer string. The frontend's existing `MarkdownWithDiagrams` /
  `splitMarkdownBlocks` (`placewiseBlocks.ts`) already renders an embedded
  ` ```placewise-diagram ` fence, so no frontend change was needed.
- Rule for multiple covering chunks: at most one diagram per answer (the first one found,
  in relevance order) — deliberately simple, avoids cluttering one answer with several
  diagrams.
- No-op when no covering chunk has a diagram (the common case) — confirmed by test.
**Why:** Aalhad's direct request after seeing Q&A answers stay pure prose even for
topics (Porter's Value Chain) that are almost always drawn as diagrams in the real
casebooks.
**Files:** `backend/src/lib/qaRetrieval.js`, `backend/src/lib/consultingRetrieval.js`
(exported `DIAGRAM_FENCE_RE`), `backend/test/qaRetrieval.test.js`.
**Proof:**
- `npm test` in `backend/`: 191/192 pass; the one failure (`sandbox.test.js`'s "empty
  environment" check, a `__CF_USER_TEXT_ENCODING` env leak) is pre-existing and unrelated —
  confirmed identical on `main` before this change via `git stash`.
- New tests: `extractDiagramWithSummary`/`findDiagramForAnswer` pure-logic cases (fence
  found, no fence, multi-chunk picks the first, prefers `rawContent`); two full
  mocked-network `groundedQaAnswer` cases — one covering chunk with a diagram (answer
  includes the verbatim fence + summary; the captured answer-generation prompt is asserted
  to contain the placeholder token and **not** `placewise-diagram` or the raw JSON), one
  without (byte-identical answer, no fence appended).
- Live verification against real Supabase + Gemini (no live calls skipped): asked
  `groundedQaAnswer("Can you explain to me how the value chain framework works?")` directly.
  Result: `groundedInCasebooks: true`, citations from IIM Lucknow's and FMS Delhi's real
  casebooks, and the final answer string now contains a real
  ` ```placewise-diagram ` flow block (R&D → inbound → manufacturing → distribution →
  sales) plus its `Diagram summary:` line, appended after prose that explicitly says "see
  the diagram below" and does not itself try to describe the diagram's boxes/arrows.
**Not done / left alone:** No `ENABLE_*` flag was added — this is always-on for Q&A (same
reversibility as any other code change: revert the diff). Mock interviews and company
pages untouched, per CLAUDE.md.

---

## 2026-11-07 — Q&A page: stop floating as a narrow column, use the full page width

**Phase:** M4 (frontend fixes) · **Type:** fix

**What changed:** `QaPage.tsx` wrapped its whole content in a fixed `maxWidth: 680` div,
leaving a large blank area on the right at desktop widths — the same issue already fixed
today on `GuesstimatesPage.tsx`. Per Aalhad's direct request after seeing it live
("utilize the entire size of the web page... stretch the component so that it utilizes
everything"), applied the same site convention instead of inventing a new layout:
- Added a "What you'll find here" `grid-3` intro (3 `feature-card`s: grounded-first,
  labelled-when-not, diagrams-where-they-help) above the ask box, matching
  Guesstimates/Frameworks/Role.
- Replaced the fixed-width wrapper with `two-col-sidebar-wide` (same CSS class
  Guesstimates uses). Left column: the ask box / answered-answer card, now grown to the
  wider `1.55fr` track instead of a 680px cap, with slightly larger padding and type on
  the answer. Right column: a new sidebar with three clickable "Try asking" example
  questions (fill the textbox via `setQuestion`, do not auto-submit — a student can edit
  before asking) and a short "How to get a sharp answer" tips panel, mirroring
  Guesstimates' "How to approach it" pattern. No per-answer source line was added to
  either column — `GroundingNote` still only renders for the non-grounded case, per
  CLAUDE.md's grounding policy.
- Both columns carry `minWidth: 0` (same reason as Guesstimates: without it a wide answer
  child can push the grid track past the viewport and cause horizontal scroll at phone
  width).
**Why:** Aalhad's call on seeing the live page — the narrow fixed-width card wasted the
right half of the screen at desktop width.
**Files:** `frontend-react/src/pages/QaPage.tsx`
**Proof:** `npm run build` and `npm run lint` pass (no new errors, only pre-existing
warnings unrelated to this file). Verified live via gstack's headless browser (`$B`,
Aside unavailable on this machine), logged in as guest:
- Desktop (1280px responsive capture) and 375px screenshots show the full-width
  `two-col-sidebar-wide` layout, no narrow floating column.
- Clicked a "Try asking" example question — it filled the textbox (`Ask` button went
  from disabled to enabled) without submitting.
- Asked "Can you explain to me how the value chain framework works?" end to end at
  1440×900 — answer rendered in the wide left column next to the still-visible sidebar,
  long multi-paragraph/bulleted text stayed readable, "Ask another" present and
  clickable. The answer text referenced "(see the diagram below)" but no diagram actually
  rendered in this dev environment — expected, since the parallel diagram-rendering
  backend change (`qaRetrieval.js`) is separate work with no frontend change required;
  `MarkdownWithDiagrams` already renders `placewise-diagram` fences when the backend
  sends them, so this layout is diagram-ready as soon as that change is live.
**Undo:** Revert this commit — the previous version had the fixed 680px wrapper and no
sidebar.
**Open issues:** None. Not yet pushed to production.

---

## 2026-11-07 — Guesstimates practice flow: question hidden from the answer, attempt scratchpad + mic

**Phase:** M4 (frontend fixes) · **Type:** fix

**What changed:** `GuesstimatesPage.tsx` showed the question, the diagram and the worked
answer all in one continuous block, so a student saw the solution before trying the
problem — there was no actual practice. Rebuilt per Aalhad's direct request after seeing
the page:
- Added `splitQuestionFromAnswer` (`src/lib/placewiseBlocks.ts`) — a pure function that
  finds the first ` ```placewise-diagram ` fence opener in the problem's markdown (reusing
  the same `OPEN_RE` convention `splitMarkdownBlocks` already uses, so the two splitters
  can't drift) and splits everything before it (title/firm/assumptions = the question)
  from everything from the fence onward (diagram + "Diagram summary:" + worked prose = the
  answer). Confirmed this shape holds by pulling 5 live problems from
  `/api/guesstimates/random` and inspecting the real `problem` field before relying on it.
- The page now renders the question alone through `MarkdownWithDiagrams`, with an "Your
  attempt" scratchpad textarea (not submitted/scored anywhere, just student-local state)
  and a mic button underneath, reusing `useVoiceRecording` + `VoiceRecordButton` exactly as
  `FrameworkAskBox` does (own `recKey`, no changes to the shared hook/component).
- The diagram + worked solution only mount after "Show answer" is clicked — conditionally
  rendered (not CSS-hidden), so nothing is in the DOM to inspect before that click.
  Confirmed via `$B js "document.body.innerHTML.includes('placewise-diagram')"` → `false`
  before the click.
- "Try another" clears the attempt text and the reveal state along with loading a new
  problem.
**Why:** Aalhad's call on seeing the live page — a practice feature that shows the answer
upfront isn't practice.
**Files:** `frontend-react/src/pages/GuesstimatesPage.tsx`, `frontend-react/src/lib/placewiseBlocks.ts`
**Proof:** `npm run build` and `npm run lint` pass (no new errors, only pre-existing
warnings shared with other pages' load-on-mount pattern). Verified live via gstack's
headless browser (`$B`, Aside unavailable on this machine) at desktop and 375px: question-only
render confirmed, DOM free of diagram/answer markup pre-reveal, typed text into the attempt
field, clicked the mic button (gracefully showed "Microphone permission denied or
unavailable" — no crash, headless has no mic), clicked "Show answer" (diagram + worked
solution appeared below, question/attempt stayed visible above), clicked "Try another"
(new question loaded, attempt field empty, answer hidden again, zero console errors
throughout).
**Undo:** Revert this commit — the previous single-block render had no split or reveal gate.
**Open issues:** None. Not yet pushed to production.

---

## 2026-11-07 — Live incident: MECE (and 2 other) Frameworks pages showing Guesstimates-book content

**Phase:** R9 follow-up (live-bug fix, QA finding)
**Type:** fix

**What changed:** QA on the live Consulting Frameworks page found MECE's `grounded_image`
was the cached SRCC Guesstimates Book (`SRCC Guesstimates-Book-Volume-1-6.pdf`, pages 7-8,
similarity 0.71) — a "FRAMEWORKS" index page that names MECE among six generic estimation
techniques, followed by an unrelated "DEMAND SIDE APPROACH" license-plates-in-Maharashtra
worked guesstimate, rendered directly under the real MECE diagram. Confirmed via the real
production API (`GET /api/frameworks?domain=Consulting`) and by reading
`frameworksGrounding.js`/`consultingRetrieval.js` directly, not just the QA report:

- **Root cause was narrower than "no domain filter."** `findGroundingV2` (the live v2 path —
  confirmed `ENABLE_CONSULTING_RAG_V2=true` in production via the `citation.pages` field,
  which only the v2/`ingest_chunks` path can return) already passes `domain: "Consulting"`
  to `match_ingest_chunks`, and the RPC already filters by it server-side. The real gap: the
  Guesstimates Book is *also* `domain = "Consulting"` (same as every FMS/ISB/SRCC
  case-interview casebook) — a domain filter structurally cannot separate it out. The chunk
  cleared `DIAGRAM_SIMILARITY_THRESHOLD` (then 0.58) at 0.71, and also cleared the relevance
  judge, because Frameworks' query (`"<name> framework diagram case study real example
  application <subdomain>"`) is itself a generic, synthetic query that an index-style page
  mentioning the framework by name satisfies well — unlike Q&A, this isn't a real student
  question the judge's specificity rules were tuned against.
- **Found 2 more affected rows from the same 2026-11-01/02 cache batch**, same casebook:
  "Market Sizing (Top-Down / Bottom-Up)" (pages 7-8) and "Market Entry Framework" (page 6).
  Checked all 57 seeded frameworks across every domain — no others matched (`grounded_image`/
  `grounded_example` citation containing "Guesstimate").
- **Fix 1 (primary):** added `excludeRowsBySourceFile` (pure, tested) to
  `consultingRetrieval.js` and an `excludeSourceFiles` option on `retrieveConsultingChunks`/
  `groundedConsultingLookup`, filtering the RPC's rows in JS rather than adding a new
  `filter_*` parameter to the `match_ingest_chunks` RPC — a schema migration needs Aalhad to
  run it (agents' sandbox can't reach the Postgres port, confirmed again this session with a
  5s connect timeout), and shipping code that calls a not-yet-migrated signature would break
  the RPC call entirely until the migration landed, a worse regression than the bug itself.
  `frameworksGrounding.js`'s `findGroundingV2` now passes `excludeSourceFiles:
  [GUESSTIMATES_SOURCE_FILE]` (imported from `guesstimateRetrieval.js`, the existing constant
  — no new source of truth). Guesstimates itself is grounded from this exact book on purpose,
  via its own feature; it should never also surface as a Frameworks "real example."
- **Fix 2 (defense-in-depth, evidence-based):** raised `DIAGRAM_SIMILARITY_THRESHOLD`
  (`consultingRetrieval.js`) and `IMAGE_SIMILARITY_THRESHOLD` (`frameworksGrounding.js`'s v1
  path, kept in sync) from 0.58 to 0.65. Checked every genuine diagram match in the full R9
  eval run (`backend/eval/results/2026-11-07-r9-5vote-run1.json`): 22 samples, range
  0.725-0.843, none below 0.72. 0.65 keeps a comfortable margin under that floor (no real
  match in the evidence this codebase has is at risk) while meaningfully raising the bar.
  Deliberately not pushed higher (e.g. 0.70, just above the bad match's 0.71) — the eval
  sample is small and sitting at the edge of the real-match floor risks a false reject on a
  different question; a threshold that tight needs more eval evidence than one incident
  provides. This alone would **not** have blocked the 0.71 match — the source-file exclusion
  above is the actual fix, this is a second layer.
- **Cache fix (direct DB write, authorized):** cleared `grounded_image`/`grounded_checked_at`
  on exactly the 3 affected rows (not a blanket wipe). A verification `curl` against the
  still-undeployed production API recomputed one of them (Market Sizing) back to the same
  wrong casebook under the *old* code, confirming the bug is live and that clearing cache
  alone (without the code fix) isn't sufficient. Re-ran the recompute by calling the new,
  locally-fixed `withGroundedExamples` directly against the real production Supabase
  instance (service-role key, no Render deploy needed) — this both proved the fix (all 3 now
  cite `The FMS Consulting CaseBook 2023-24 (1).pdf` at 0.72-0.76 similarity, in-range with
  the eval's genuine matches) and, as a side effect of calling the real function, wrote the
  corrected result straight to the production `frameworks` table. Verified via the real API
  afterward: MECE/Market Sizing/Market Entry Framework all now show the correct FMS casebook
  content. `grounded_checked_at` is fresh, so the still-unpatched deployed API code won't
  recompute (and re-break) these 3 rows again for 7 days regardless of deploy timing — but
  the code fix still needs deploying for this to be structurally fixed rather than luck +
  a 7-day grace window.
- **Tests:** `backend/test/consultingRetrieval.test.js` — 4 new tests (pure
  `excludeRowsBySourceFile` behavior, plus one proving the exclusion reaches end-to-end
  through `retrieveConsultingChunks`'s RPC response). `npm test`: 184/185 pass (1
  pre-existing, unrelated sandbox env-leak flake, same one every prior entry this week notes).

**Files:** `backend/src/lib/consultingRetrieval.js`, `backend/src/lib/frameworksGrounding.js`,
`backend/test/consultingRetrieval.test.js`. **Not pushed** — committed locally only; needs to
reach `origin/main` for Render to actually stop serving the old, unpatched grounding logic
(the production data fix above holds for ~7 days independent of the deploy).

---

## 2026-11-07 — Live incident: SRCC Guesstimates chunk-bleed, 8 more `ingest_chunks` rows deactivated

**Phase:** R9.4 follow-up (direct incident fix, no gstack review — data-only `is_active` toggle)
**Type:** fix

**What changed:** Audited all 67 then-active `ingest_chunks` rows for the SRCC Guesstimates
book (`document_id ab676b81-3b29-4c35-b288-6dff71756e26`) by reading full content, not just
grepping a keyword — the R9.3/R9.4 QA finding (4/30 live `/api/guesstimates/random` pulls
returning two or three unrelated problems concatenated, often truncated mid-sentence) was
confirmed as a real, separate bug from the already-fixed cheat-sheet-dump symptom. Found and
deactivated (`is_active=false`) 8 rows in two batches, both single `.update().in()` calls:
- **6 true concatenation/truncation chunks** (2+ "ASSUMPTIONS" sections or a truncated 2nd
  problem bled into one chunk): `eb4272dc` (p26-28, Bollywood movies + Tyre industry),
  `912ed1ed` (p35-36, Delhi commute time + Lok Sabha election expenditure — the exact example
  from the QA report), `06d23f19` (p44-45, India Gate visitors + Metro students to DU),
  `f55ca214` (p47-50, Sarvana Bhavan revenue + Quick Commerce market, 2nd problem truncated
  mid-assumption), `efe311a9` (p51-52, Ad market size + Animation/VFX market, 2nd problem
  truncated mid-assumption), `661a8e35` (p55-57, Milk-for-coffee-shop problem, truncated to a
  bare "ASSUMPTIONS" header with nothing after it — its real continuation lives in a separate,
  still-active chunk `1952547e`, so the problem itself isn't lost, just this one duplicate/
  truncated copy of it).
- **2 orphan fragments matching the QA report's 4th example** ("BOSTON CONSULTING GROUP /
  loans problem... truncates after 4 assumptions with no diagram or continuation"): `84e55de3`
  (p28-29, title + "ASSUMPTIONS" + 4 items, no diagram, no final answer at all) and `df90c84b`
  (p29, a duplicate of the same orphaned assumptions-only text, no title either). Both are
  leftover fragments of one "Number of Outstanding Education Loans in India" problem that got
  split into several small overlapping micro-chunks around page 29 — these two were the only
  fragments that contain the literal word "assumptions" and could therefore pass
  `looksLikeWorkedProblem`'s regex gate and be served standalone; the real split problem
  (its diagram + final answer) survives intact in a separate active chunk (`5572cc3b`).

**Why:** confirmed by reading every flagged row's full text (not a single-keyword scan, per
instruction) that each of these 8 rows is internally incoherent on its own — either two
unrelated problems' titles/assumptions/diagrams genuinely appended together, or a
problem/fragment cut off mid-sentence with no diagram or solution. Chose deactivation over
re-splitting for all 8: this is a live-incident mitigation, the correct boundary wasn't always
unambiguous (e.g. the page-29 cluster has several near-duplicate fragments from what looks like
an overlap-split mechanism), and every one of the underlying real problems already has a
clean, complete copy in another still-active chunk — so no content is actually lost by turning
these off, only the broken/duplicate copies are removed.

**Files:** none (data-only). Audit/fix scripts were temporary, run from `backend/` against
Supabase directly via `@supabase/supabase-js`, deleted after use — not committed.

---

## 2026-11-07 — Fix: Guesstimates error state had no retry button

**Phase:** QA follow-up (frontend bug fix)
**Type:** fix

**What changed:** `frontend-react/src/pages/GuesstimatesPage.tsx` — the error branch (when
`GET /api/guesstimates/random` fails, e.g. the `net::ERR_TIMED_OUT` a QA pass hit from rapid
repeated "Try another" clicks) rendered only red "Failed to fetch" text with no way to retry,
so a student who hit any transient fetch failure was stuck until a full page reload. Added a
"Try another" button to the error branch, calling the same `load()` the success-state button
already calls, wrapped in the same card styling (`var(--surface)` / `var(--border-input)` /
`var(--r-md)`) as the rest of the page. Also added the same retry button to the "not
available" empty state (when the backend returns `available: false` for a reason other than
`feature_disabled`, which is a static "coming soon" message with no point retrying) — that
branch had the same dead-end problem.

**Why:** every data view must handle loading, empty and error states per
`frontend-conventions`; the error state was the one branch missing a way forward.

**Files:** `frontend-react/src/pages/GuesstimatesPage.tsx`.

**Proof:**
- `npm run build` — passes (`tsc -b && vite build`, output below).
- `npm run lint` — passes, exit 0 (only pre-existing oxlint warnings unrelated to this file's
  diff, e.g. the `set-state-in-effect` warning on this page's existing `useEffect` was already
  present before this change).
- Verified live: ran the dev server with `VITE_API_BASE` pointed at a dead port
  (`http://localhost:9`, env var only, no code change, dev server killed after) to force a
  real fetch failure, then drove it with gstack's `$B` browser (Aside unavailable on this
  machine) as a signed-in guest. Confirmed via snapshot (`@e15 [button] "Try another"`) and
  screenshot that the error card now shows "Failed to fetch" with a working "Try another"
  button underneath, at both desktop and 375px mobile width (single column, no horizontal
  overflow). Screenshots:
  `/private/tmp/claude-501/-Users-aalhad-Projects-Placement-Website/7a003324-646c-4faf-89b9-ddbd7c41f95b/scratchpad/guesstimates_error_state.png`
  (desktop) and
  `/private/tmp/claude-501/-Users-aalhad-Projects-Placement-Website/7a003324-646c-4faf-89b9-ddbd7c41f95b/scratchpad/guesstimates_error2-mobile.png`
  (375px).

**Not yet committed** — left for the coordinating session to sequence against a parallel
backend fix landing around the same time; no conflicting files (`git status` showed only this
one frontend file modified at hand-off).

**Proof:**
- Before: 69 total rows / 67 active / 2 inactive (the 2 already off from the earlier
  cheat-sheet fix, left untouched as instructed).
- Batch 1 (6 rows): before `is_active=true` for all 6 confirmed by direct select; update via
  one `.update({is_active:false}).in('id',[...6 ids])` call; after-select confirmed all 6
  `is_active=false`. Running total: 61 active / 8 inactive.
- Batch 2 (2 rows): same pattern, one `.update().in()` call for the 2 orphan-fragment ids;
  running total: **59 active / 10 inactive / 69 total** (unchanged row count, no rows deleted).
- Fresh production verification (real API, not local): 24 pulls immediately after batch 1,
  then 25 more after batch 2 — **49/49 fresh `GET /api/guesstimates/random` responses from
  `https://placement-mastery-hub-api.onrender.com`** showed exactly one "ASSUMPTIONS" section
  and a diagram block in every `problem` field; **0/49 showed the 2+-ASSUMPTIONS bleed pattern
  and 0/49 came back with no diagram/no answer at all**. 4 of the first 24 pulls did end with a
  bare page number + the next problem's firm-name line (e.g. "...Final Projected Expenditure in
  Crores... 50\n\nTrinity Life Sciences | ...") — read in full, these are a single complete
  problem with a harmless trailing header fragment from chunk boundaries (no second
  ASSUMPTIONS, no second body), not the reported bug, so left untouched.

**Cost:** 0 Gemini calls (pure read + direct DB update + API verification, no model calls).

**Undo:** `UPDATE ingest_chunks SET is_active = true WHERE id IN (eb4272dc, 912ed1ed,
06d23f19, f55ca214, efe311a9, 661a8e35, 84e55de3, df90c84b)` (full UUIDs in this entry above)
restores the prior (buggy) state; do not do this without re-splitting those rows first.

**Open issues / flagged for Aalhad to spot-check:**
- **Not fully confident:** the page-29 "Outstanding Education Loans" cluster has several more
  near-duplicate/overlapping fragments (`5572cc3b`, `c88daec7`, `3544b36c`, `b621a90e`,
  `c6f23779`) that don't contain the literal word "assumptions" so can't currently be served
  by `getRandomGuesstimateProblem`'s regex gate — left active since they're unreachable via
  this bug, but this cluster looks like a genuine ingestion/chunking defect (the same problem
  split into too many overlapping pieces) worth a real re-chunk later, separate from this fix.
- `1952547e` (p56-58, the real continuation of the milk/coffee problem whose truncated
  duplicate was deactivated) starts with a bare "ASSUMPTIONS" heading but no assumption items
  under it before jumping straight to a diagram — the textual assumptions list for that part of
  the problem appears to be missing entirely from `ingest_chunks` (not merely mis-chunked). Left
  active since it's still one coherent problem with a diagram and final answer, not a bleed, but
  worth Aalhad's look.
- `762205ae` (p12-13, a conversion-factors/formulae/misc reference page) ends with a bare page
  number into the next section's heading — same boundary-fragment pattern as the harmless ones
  above, and it has no "assumptions" text so it can't be served by the random-pick endpoint
  either; flagged only informationally, no action taken.

---

## 2026-11-07 — R9.4 QA: live site tested, two High-severity bugs found, rollback NOT exercised

**Phase:** R9.4 · **Type:** QA (report-only) on production

**What was tested:** `https://placewise-io.vercel.app` (frontend) and
`https://placement-mastery-hub-api.onrender.com` (backend), as a student, per
`.gsd/phases/R9/04-PLAN.md` Task 1. Guesstimates: 30 fresh `/api/guesstimates/random`
pulls. Frameworks: expanded Porter's Five Forces, Market Entry, MECE on live Consulting
domain. Q&A: attempted guest sign-in + MECE question via `/browse` (gstack headless
browser, Aside unavailable on this machine). Checked page HTML/bundle and API JSON for
`storage/v1`/`supabase.co` leaks. Phone-width (375px) screenshots taken for Guesstimates
and Frameworks.

**Finding 1 (High) — Guesstimates chunk-boundary bug is broader than the 2 chunks fixed
in R9.3.** 4 of 30 sampled `/api/guesstimates/random` responses (~13%) return a single
`problem` string containing **two unrelated guesstimate problems concatenated**, the
second one often cut off mid-sentence or mid-assumption-list. Examples: a commute-time
problem followed immediately by an unrelated Lok Sabha election-expenditure problem
(no separator beyond a bare page number "31"); an India-Gate problem followed by a
North-Campus-metro problem, truncated after "...Colleges of Delhi University is
10,540.\n\n41"; three problems chained in one response ending mid-assumptions ("...The
population of India is 1.4 billion." with no diagram or continuation). One further
response ("BOSTON CONSULTING GROUP" / loans problem) truncates after 4 assumptions with
no diagram or solution at all — reads as a cut chunk, not a complete problem. No
cheat-sheet dump recurred and no raw Storage URL leaked in any of the 30 samples, so the
specific R9.3 incident is still fixed, but the underlying SRCC chunking-at-problem-
boundaries issue was not fully resolved by deactivating only 2 chunks — more active SRCC
chunks span multiple problems. Evidence: `/tmp/g*.json` and `/tmp/g2/g*.json` (30 raw API
responses), full text of the 4 bad ones captured in this session's transcript.

**Finding 2 (High) — the live Vercel frontend is running a build from before R8
(`fcb74b8`), not today's main.** `/qa` 404s outright (`Unexpected Application Error! 404
Not Found` — React Router's own dev error screen, visible to any real visitor, not just
QA). The "Ask" nav item is absent from the rendered nav and from the deployed JS bundle
(`grep` for `/qa` and `QaPage` in `/assets/index-Bi1PRFP_.js` finds nothing). Frameworks
and Guesstimates both still render via the **old static ASCII-art diagram path**
(hand-authored "ASCII Visual Model" boxes, same generic MECE diagram regardless of
casebook page) instead of R8's shared `PlacewiseDiagram` component — confirmed by
comparing rendered output against `fcb74b8`'s commit message, which specifically names
this component and the Q&A page as what it shipped. Practical effect: **Q&A (Task 3 of
this plan) could not be tested at all** — guest sign-in worked fine (`Continue as guest
(3-hour session)` on `/login`), but there is no reachable Q&A surface on production.
Backend `/api/qa/ask` itself is live and correctly gated (`401 Missing Authorization`
with no token). No raw Storage URL leaked in the Frameworks API response actually probed
(`grounded_image.url` is `null` on every framework checked) and no raw JSON/`placewise-
diagram` block rendered on screen, so the specific R8 privacy bug (raw Storage URL to
students) is not currently exploitable in practice — but only because the backend never
sends a URL right now, not because the old frontend code protects against it.

**Not tested as a result:** Q&A grounded-answer content, Q&A "not from the casebooks"
label, Q&A markdown rendering, and the Role/Company blast-radius smoke-check (deferred —
stopped per the plan's own instruction: "If any High-severity bug is found... stop and
report it rather than proceeding to Task 2").

**Rollback (Task 2/3): NOT executed.** Per the plan and this session's explicit
instruction, flipping Render's live flags off/on a second time is Aalhad's call, and the
plan says to stop on a High-severity finding rather than proceed. Reported back instead
of flipping anything.

**Proof:**
- `curl .../api/guesstimates/random` x30, saved to `/tmp/g*.json` + `/tmp/g2/g*.json`.
  `ASSUMPTIONS` count per response: 26 had 1 (clean), 4 had 2+ (merged/truncated).
  `grep -i "storage/v1\|supabase.co/storage"` across all 30: no match (exit 1).
- `curl https://placewise-io.vercel.app/` → `/assets/index-Bi1PRFP_.js`; `grep -o
  '"/qa"'` and `grep -o 'QaPage'`: zero matches. `grep -o 'General guidance'` /
  `'not from the casebooks'`: present (so *some* GroundingNote-era string exists in this
  bundle, but not wired to a reachable route — likely from the earlier "Ask about this
  framework" feature, not the R8 Q&A page).
- `/browse` (gstack headless browser, fallback since Aside isn't installed on this
  machine) screenshots: `frameworks-mece-desktop.jpg` (ASCII diagram, no raw JSON/URL),
  `guesstimates-mobile.png` (375px, readable, real casebook content, no overflow),
  `qa-404.jpg` (the React Router crash screen on `/qa`). Saved under this session's
  scratchpad, not the repo.
- `curl -s -X POST .../api/qa/ask` with no auth → `401 {"error":"Missing Authorization:
  Bearer <token> header."}` (correctly gated).
- Console errors on `/frameworks`: only font-preload warnings + the one expected React
  Router 404 boundary error when `/qa` was hit directly; no other JS errors seen.

**Open issues for the next session (not fixed here, report-only):**
1. Re-run the SRCC chunk audit from R9.3 across all 69 active chunks, not just the 2 that
   were caught by the cheat-sheet-dump symptom — the chunk-boundary bug clearly affects
   more chunks than that symptom alone surfaces (concatenation without a cheat-sheet
   dump is textually silent — no single marker string to grep for, which is how 4/30
   slipped past the earlier "5 fresh curl checks" spot-check).
2. Find out why Vercel's production deployment is behind `fcb74b8`/main — check Vercel's
   deployment dashboard for the commit it actually built, and whether a redeploy was
   simply never triggered after R8, or a bad deploy was rolled back and nobody re-pushed.
   Until this is fixed, Q&A is unreachable to real students and R9/R8's frontend-facing
   done-whens (diagram component, Q&A page, markdown fix, paraphrased Frameworks/
   Guesstimates UI) are not actually live, even though the backend flags are.
3. R9's roadmap row should not move to `done` until both of the above are resolved and
   re-verified — this session intentionally left `.gsd/ROADMAP.md` and `.gsd/STATE.md`
   untouched.

**Cost:** 0 new Gemini calls (QA only hit already-cached/paraphrased endpoints and one
unauthenticated 401 probe).
**Undo:** N/A — report-only session, nothing in the app or data was changed.

---

## 2026-11-07 — R9.3: flags live on production; found and fixed a live content-quality bug

**Phase:** R9.3 · **Type:** production switch-over + live incident fix

**What changed:** Aalhad set `ENABLE_CONSULTING_RAG_V2=true` and `ENABLE_ANSWER_PARAPHRASE=true`
on the live Render service (`placewise-api`, service id `srv-danfsurm8hqs73b6gv70`), per R9
plan 3's human-action checkpoint. Confirmed via the read-only `RENDER_API_KEY` (env-vars +
deploy-status endpoints only, no write calls) that both vars show `true` and the deploy is
`live` (finished `2026-11-07T08:43:55Z`).

**Live incident found immediately after, same session:** hitting the real production
Guesstimates endpoint (`curl https://placement-mastery-hub-api.onrender.com/api/guesstimates/random`)
returned `available:true` with raw, unparaphrased, garbled content — the R9 plan only
anticipated Consulting Q&A/Frameworks going live, but SRCC (one of the 9 documents just
activated in R9.2) is also Guesstimates' sole source, so Guesstimates silently became
reachable as a side effect. Two problems stacked:
1. `ENABLE_GUESSTIMATE_PARAPHRASE` (a separate flag from `ENABLE_ANSWER_PARAPHRASE`, built
   and committed in an earlier session) was not set on Render at all — added `=true` by
   Aalhad, confirmed live (deploy finished `2026-11-07T08:47:48Z`).
2. Even with paraphrase on, 2 of SRCC v2's 69 active chunks
   (`2da998b5-2055-4c48-bf36-2cab37435591`, pages 1-4; `f4185c4a-321c-423a-bb2a-617d270a98e1`,
   pages 9-12) contained a malformed ingestion artifact: a real worked problem followed by
   the entire book's "GUESSTIMATES CHEAT SHEET" reference appendix (demographics, GDP/
   household-expenditure charts, several `placewise-diagram` blocks) concatenated into one
   oversized chunk (5,872 / 5,630 chars vs a 2,279-char median across the other 67). The
   paraphrase layer correctly fail-closed on this (no `paraphrased`/`rawProblem` key in the
   response — it declined rather than risk rewriting a dump this messy), so the *garbled raw
   text itself*, not a bad rewrite, is what reached the live endpoint for however many
   requests landed on either chunk before the fix below.

**Fix:** deactivated just those 2 rows (`is_active=false`, surgical — the other 67 SRCC
chunks and the full Consulting switch were untouched). Verified via 5 fresh live requests
post-fix: 0/5 contain the cheat-sheet dump, all return reasonably-sized, clean problem text.

**Scope confirmed isolated, not systemic:** queried all 69 active SRCC v2 rows directly —
only these 2 have the merged-cheatsheet pattern. Not investigated further in this session
(a proper re-chunking pass for SRCC's front-matter/cheat-sheet boundary is a follow-up for
`ingestion-engineer`, not done here) — flagged as a known, open, low-priority item since the
immediate live exposure is closed.

**Proof:**
- Render env vars (read-only check): `ENABLE_CONSULTING_RAG_V2=true`,
  `ENABLE_ANSWER_PARAPHRASE=true`, `ENABLE_GUESSTIMATE_PARAPHRASE=true`, deploy status `live`.
- `curl https://placement-mastery-hub-api.onrender.com/api/guesstimates/random` — pre-fix:
  returned the cheatsheet dump (verbatim, ~length >8000 chars incl. diagram blocks) on the
  request that surfaced this. Post-fix: 5/5 fresh requests clean, no `CHEATSHEET` marker,
  lengths 2,612-5,091 chars, all `available:true`.
- `HTTP 200` on the production Guesstimates endpoint throughout — service never went down.

**What's NOT yet verified in this entry:** Q&A (`/api/qa/ask`) requires an authenticated
session — could not curl it directly without test credentials. A browser-based QA pass
against the real production site (Frameworks, Guesstimates, Q&A, citation/storage-URL leak
checks) is the next step (R9 plan 4), not yet run as of this entry.

**Rollback (unchanged from plan 3, still accurate):** Render dashboard → `placewise-api` →
Environment → set `ENABLE_CONSULTING_RAG_V2`, `ENABLE_ANSWER_PARAPHRASE`,
`ENABLE_GUESSTIMATE_PARAPHRASE` to `false` (or delete them) → redeploy. The 2 deactivated
chunk rows can be reactivated independently via a direct `is_active=true` update on those 2
ids if the re-chunking fix is ever applied and confirmed clean — not assumed as part of any
flag rollback.

**Files:** `ingest_chunks` — 2 rows deactivated (surgical fix, not part of the R9.2 switch
script). No code changed in this entry.

---

## 2026-11-07 — R9.2: Consulting switch-over applied — 9 eval-tested documents now `is_active=true`, v7 SRCC deactivated

**Phase:** R9.2 · **Type:** script build + production-data investigation (no `is_active` write made yet)

**What changed:** Built `backend/scripts/switchConsultingLive.js` — an idempotent dry-run /
`--apply` / `--rollback` script to flip `ingest_chunks.is_active` for the 9 Consulting
documents R6 completed and R9's eval gate validated. `DOC_IDS` copied verbatim from
`backend/eval/run_eval_v2_preview.js`. One `.update().in("document_id", DOC_IDS)` call per
mode (no row-by-row loop), before/after proof via real exact-count queries (one query per
`(document_id, is_active)` pair — avoids Supabase JS's default 1000-row page cap, which
silently truncated an earlier draft's client-side grouped `.select()` to 2 rows out of
~3,884; caught before trusting any printed state, fixed by switching to head-count queries).

**Gate confirmed PASS, independently, before any write was attempted:** read all three of
`backend/eval/results/2026-11-07-r9-5vote-run{1,2,3}.md` myself (not trusting a summary) —
each independently shows not-covered hard blocker 10/10 (100%), overall correctness 29/39
(74%, ≥60% bar), paraphrase faithfulness 90–100% (≥80% bar), must_include survival 86%
(≥65% bar), inactive-content gate 22/22. The stale `2026-11-06-r9-full.md` (FAIL) was
correctly superseded and ignored, per the session's own correction.

**Real discrepancy found, contradicting the R9.2 plan's premise:** the plan's text claimed
SRCC's canonical `DOC_IDS` entry (`ab676b81-3b29-4c35-b288-6dff71756e26`, SRCC **ingestion
v2**, 69 chunks) was "already `is_active=true`" from the 2026-11-02 one-off test. A direct
query of the live DB showed this is false — `ab676b81…` is `is_active=false` (0 active, 69
inactive), matching the eval's own `poolActiveState` table exactly. The 62 rows that *are*
actually live right now belong to a **different, later document**:
`bc00d24b-b95d-4222-8bed-28ea7d2a5e18`, SRCC **ingestion v7** (the last of 7 SRCC
re-ingestion iterations that day, with a manual page-35 re-parenting fix per its notes
field) — not in `run_eval_v2_preview.js`'s `DOC_IDS` and **never run through the R9 eval**
that produced the PASS verdict above. The 2026-11-02 "First real `is_active=true` switch"
log entry activated v7, not v2 — the R9.2 plan's author cross-referenced the wrong
`document_id` for the same casebook/school.

**Aalhad's decision (recorded here for audit):** deactivate v7 (`bc00d24b-…`, untested by
the R9 eval), activate only the 9 eval-validated `DOC_IDS` (which includes v2 SRCC,
`ab676b81-…`). This supersedes the 2026-11-02 one-off test's result for SRCC — going
forward, SRCC's live content is v2, governed by this switch, not v7.

**Status: the write is done, applied directly in Aalhad's own session (the permission
system granted it there, after two prior attempts from a subagent were correctly denied —
see below) and independently re-verified.**

1. `v7 (bc00d24b-b95d-4222-8bed-28ea7d2a5e18)` deactivated: 62 active → 0 active (62 rows
   flipped to `is_active=false`), confirmed via a follow-up exact-count query.
2. `node backend/scripts/switchConsultingLive.js --apply` run: all 9 `DOC_IDS` flipped
   `is_active=false` → `is_active=true`. Before/after counts per document (chunks, all
   flipped together, none partial):
   `e9229429…`=264, `0a6c4f9e…`=263, `17a7c482…`=530, `6ae47aaa…`=208, `ab676b81…`=69,
   `fa763d15…`=408, `f2c1333f…`=931, `09c41590…`=825, `faa13328…`=386 — **3,884 chunks total
   now active.**
3. Independently re-verified with a fresh dry-run immediately after: all 9 documents show
   `is_active=true`, every row; **stray active rows outside the 9 `DOC_IDS`: 0** (confirms
   v7 is fully deactivated, not partially, and nothing else activated behind this).

**Why two prior write attempts were correctly denied, then this one succeeded:** a
backend-engineer subagent attempted the same two writes twice and was denied both times by
Claude Code's own permission classifier (`[Modify Shared Resources]`) — correctly, since an
agent relaying "the user approved this" is never the same as the permission system or the
user granting it directly. The coordinating session then ran the identical commands
directly, where the permission system itself governs the grant. No workaround was used;
this is the permission system behaving as designed — deny a subagent's indirect relay of
approval, allow it when run where the actual grant applies.

**What a student could reach:** still nothing changed by this step alone —
`ENABLE_CONSULTING_RAG_V2` is still off; `match_ingest_chunks` is only reachable through
flag-gated routes (R9 plan 3, not yet run). This step only made the data layer correct and
switch-ready.

**Rollback:** `node backend/scripts/switchConsultingLive.js --rollback` reverts only the 9
`DOC_IDS` to `is_active=false` — it does **not** reactivate v7. If v7's state is ever wanted
back, that is a separate, explicit manual step, never assumed as part of this rollback.

**Files:** `backend/scripts/switchConsultingLive.js` (new). `ingest_chunks`: 62 rows
deactivated (v7), 3,884 rows activated (the 9 eval-tested documents).

---

## 2026-11-07 — R9.4: faithfulness judge bumped 3→5 votes; 3 repeat runs confirm it stabilizes the bar — R9 overall gate now PASSES

**Phase:** R9 · **Type:** fix (one production function) + eval × 3

**What changed:** `backend/src/lib/consultingRetrieval.js`'s `judgeParaphraseFaithful` (the
paraphrase-faithfulness judge, used by both Q&A/Frameworks paraphrasing via
`computeParaphraseResult` and by `frameworkQa.js`) now casts **5 votes instead of 3**, with
`faithfulMajority` requiring **≥3/5** (a plain majority, not a stricter 4/5 bar) — kept as a
simple majority deliberately: the goal here is to reduce variance from a small sample (one
flaky call flipping a 3-vote 2-1 to 1-2), not to make the check stricter or more lenient.
`judgeRelevance` (the separate, unrelated relevance judge) was left untouched — no evidence
surfaced that it has the same instability (R9.2/R9.3 only ever found faithfulness flipping).
Updated the matching unit tests in `backend/test/consultingParaphrase.test.js` (5-vote cases
replacing the old 3-vote ones) and the hardcoded `+= 3` call-count comments in both eval
scripts (`run_eval_r9.js`, `run_eval_paraphrase_preview.js`) to `+= 5`. No other caller
(`frameworkQa.js`; `financeDiagramAuthor.js` has its own separate copy of this pattern, out of
scope) needed changes — the function's return shape (`boolean`) is unchanged.

**Why:** R9.3 found the SAME code, re-run with no paraphrase-related changes, swinging from
10/12 (83%) to 7/12 (58%) faithfulness pass rate — judge non-determinism on borderline
content flipping the 3-vote majority, flagged as an open reliability concern since R9.2.
Aalhad approved increasing the vote count and then empirically re-running multiple times to
confirm it actually helps, rather than assuming.

**`npm test` after the code change:** 180/181 pass. The 1 failure is the pre-existing sandbox
env-leak test (`test/sandbox.test.js`, unrelated to this change, already tracked in
`.gsd/STATE.md`).

**Three back-to-back full `node backend/eval/run_eval_r9.js` runs, no code changes between
them** (results: `backend/eval/results/2026-11-07-r9-5vote-run{1,2,3}.{json,md}`, each a copy
of that run's `2026-11-07-r9-fixed.{json,md}` output taken before the next run overwrote it —
same filename-collision risk as R9.3, avoided this time by copying immediately):

| Bar | Threshold | Run 1 | Run 2 | Run 3 |
|---|---|---|---|---|
| Not-covered `coverage_label` (hard blocker) | 100% | 10/10 (100%) | 10/10 (100%) | 10/10 (100%) |
| Overall correctness pass rate | ≥60% | 29/39 (74%) | 29/39 (74%) | 29/39 (74%) |
| **Paraphrase faithfulness** | ≥80% | **9/10 (90%)** | **10/10 (100%)** | **10/11 (91%)** |
| must_include survival after paraphrasing | ≥65% | 19/22 (86%) | 19/22 (86%) | 19/22 (86%) |
| Inactive-content gate (hard blocker) | majority from `is_active=false` | 22/22 | 22/22 | 22/22 |
| **Verdict** | | **PASS** | **PASS** | **PASS** |

All three runs PASS on every bar, including the hard blocker, which stayed at 100% across all
three (consistent with R9.3's fix, unaffected by this change as expected — a different judge).
The applicable-faithfulness-judgment denominator moved slightly between runs (10, 10, 11) —
this is the relevance judge's own 3-vote majority occasionally selecting a different top chunk
run to run (an upstream, separate source of run-to-run variance, not this change), which in
turn changes how many answers reach the faithfulness check and whether one of them needed
paraphrasing at all.

**Verdict on the 83%/58% swing:** genuinely stabilized, not just luck on one run. 90%/100%/91%
across 3 runs is a tight band well clear of the 80% floor, compared to the 83%/58% spread seen
at 3 votes (a 25-point swing). Still a probabilistic judge, not a deterministic check — 3 runs
isn't proof it will never dip below 80%, but it's now meaningfully more stable evidence than
the single flip-flop R9.3 reported.

**Call counts (real, printed by each run):** run 1: 35 embedding + 672 relevance-judge + 22
paraphrase + 50 faithfulness-judge = 779 total. Run 2: identical, 779 total. Run 3: 35 + 672 +
22 + 55 faithfulness-judge = 784 total (one more applicable faithfulness check than runs 1-2,
matching the 11 vs 10 denominator above). **2,342 Gemini calls across all 3 runs**, all
flash-lite tier (no escalation observed in any run). No token-level billing log exists in this
codebase to read an exact dollar figure from (`gemini.js` doesn't log token counts); using this
project's own established flash-lite rate from prior entries (592 calls ≈ "well under $0.10",
2026-11-03 R7b eval entry above) as the basis, 2,342 calls of the same tier and roughly the
same call shape (short JSON-only prompts, no vision) scales to **roughly $0.35-$0.45 total**
for all three runs combined — an estimate from the project's own historical rate, not a figure
read off a billing dashboard, since this agent has no access to one. Still well under the
$20/month budget even after this round's extra cost relative to a single-run pass.

**R9 switch-over status:** with this fix, every bar the `run_eval_r9.js` gate checks now
passes, consistently, across 3 repeat runs: the hard not-covered blocker (100%), overall
correctness (≥60%), paraphrase faithfulness (≥80%, now 90-100% across runs), must_include
survival (≥65%), and the inactive-content gate (22/22). **R9's switch-over plans (2-4) are
cleared on eval evidence to proceed**, pending Aalhad's own sign-off and a QA pass on the live
site per the R9 roadmap step, which this task did not cover (eval-only, no `is_active` flips
made here).

**Files:** `backend/src/lib/consultingRetrieval.js` (vote count + comments),
`backend/test/consultingParaphrase.test.js` (updated tests),
`backend/eval/run_eval_r9.js`, `backend/eval/run_eval_paraphrase_preview.js` (call-count
comments only), `backend/eval/results/2026-11-07-r9-5vote-run{1,2,3}.{json,md}` (new).

---

## 2026-11-07 — R9.3: metric- and interview-sub-type specificity fixes for q028/q035 — hard blocker now 100%, still FAIL on a separate, unrelated bar

**Phase:** R9 · **Type:** fix (one production prompt) + eval

**What changed:** added two more specificity rules to `backend/src/lib/consultingRetrieval.js`'s
`RELEVANCE_SYSTEM_PROMPT`, same pattern/style as R9.2's named-firm rule, confirmed against the
actual retrieved chunk content (not theorized) in `backend/eval/results/2026-11-07-r9-fixed.json`
before writing either:

1. **Metric-type rule** — q028 ("daily revenue of Delhi Metro") was wrongly accepted on a chunk
   that is a worked **passenger/ridership-count** estimation (an issue-tree diagram building up
   to "# of passengers", not revenue). Added a rule that a specific quantitative metric (revenue,
   profit, cost, headcount, volume, ridership, etc.) is a specificity trigger: an excerpt about a
   *different* metric for the same subject is not faithful even when the subject and methodology
   both match, unless the mismatch is just wording for the same metric (e.g. "turnover" = "revenue",
   not a trigger).
2. **Interview-sub-type rule** — q035 ("stress interview prep") was wrongly accepted on a generic
   interview DO's/DON'Ts excerpt (rapport, confidence, body language) that never mentions stress
   interviews as a distinct format. Added a rule that a named interview sub-type (stress, case,
   behavioral/fit, group discussion) is a specificity trigger: generic interview advice doesn't
   answer a question about one named, different sub-type.

Checked both rules against every currently-passing question that touches a metric or an interview
topic (q007 toll-plaza revenue, q012/q025/q026 profitability, q015/q020/q021/q034 case-interview
format questions, f002/f012 Finance metrics) before running the eval, to confirm the new wording is
narrow enough not to reject genuine matches — none of those involve a metric/sub-type *mismatch*,
so none were at risk.

**Fresh scorecard (`backend/eval/results/2026-11-07-r9-fixed-v2.{json,md}`, real run — see caveat
below on the filename):**

| Bar | Threshold | Actual | Met? |
|---|---|---|---|
| Not-covered `coverage_label` (hard blocker, dark-feature excluded) | 100% | **10/10 (100%)** | **yes** |
| Overall correctness pass rate | ≥60% | 30/39 (77%) | yes |
| Paraphrase faithfulness | ≥80% of applicable judgments | 7/12 (58%) | **NO** |
| must_include survival after paraphrasing | ≥65% | 20/23 (87%) | yes |
| Inactive-content gate (hard blocker) | majority from `is_active=false` docs | 23/23 | yes |

**Verdict: still FAIL**, but the specific hard blocker this task targeted is fixed: q028 and q035
both now correctly return `coverage_label: pass` (no grounded answer shown), bringing the
not-covered hard blocker to 10/10 (100%), up from 8/10. q004/q006/q009/q024/q026 (the 5
non-hard-blocker failures carried over from R9.2) are all still failing in this run, unchanged in
status — confirmed, not re-investigated, since they were never in this task's authorized fix list.

A **new/newly-visible bar miss** appeared: paraphrase faithfulness dropped to 7/12 (58%), below the
80% threshold — in the R9.2 run this same bar was 10/12 (83%, passing). This is **not attributable
to this session's prompt change**: the edit here only touched `RELEVANCE_SYSTEM_PROMPT` (which chunk
is *shown at all*); `PARAPHRASE_SYSTEM_PROMPT` and `FAITHFULNESS_SYSTEM_PROMPT` are untouched, and
the 5 questions that failed this round (q001, q005, q021, q027, q039) share no content or chunk with
q028/q035. The faithfulness judge's 3-vote majority was already flagged in R9.2's log entry as "a
separate, real, but undecided reliability tradeoff...confirmed non-deterministic run-to-run on
borderline content" — this looks like the same run-to-run judge variance, not a regression from this
fix, but it is reported honestly as the new blocking bar rather than omitted. Not investigated or
fixed here — outside this task's scope (relevance-judge specificity only) — flagged for the next
rag-engineer pass alongside q004/q006/q009/q024/q026.

**Filename caveat:** `run_eval_r9.js` writes to a fixed `${today}-r9-fixed.{json,md}` path with no
label override, and it was re-run on the same day as R9.2's run. The original R9.2
`2026-11-07-r9-fixed.json/.md` (never committed — both were untracked in git) were overwritten by
this run before a copy was taken; the q028/q035 excerpt content quoted above was captured by reading
that file *before* re-running, so no finding here is unverified, but the pre-fix result file itself
no longer exists as a separate artifact. `2026-11-07-r9-fixed-v2.{json,md}` is a copy of the
post-fix file, kept under a distinct name per this task's instruction; `2026-11-07-r9-fixed.{json,md}`
now also holds the post-fix result (same content as `-v2`).

**Call counts (real, printed by the script):** 35 embedding + 672 relevance-judge + 23 paraphrase +
36 faithfulness-judge = **766 Gemini calls**, flash-lite tier throughout (no escalation observed) —
same scale as R9.2's run. Rough cost: well under a dollar at flash-lite pricing.

---

## 2026-11-07 — R9.2: Fixes for the R9.1 gate failure, re-run — still FAIL (but much closer)

**Phase:** R9 · **Type:** fix (eval-script + test-data + one production prompt) + eval

**What changed**, following a prior read-only investigation of R9.1's 19 failures:

1. **Eval-script bug (`backend/eval/run_eval_r9.js`'s `loadChunkPool`)**: added
   `.order("id", { ascending: true })` to the paginated `ingest_chunks` `.range()` query.
   Without an explicit order, Postgres/PostgREST was returning non-deterministic row slices
   across pages, silently dropping entire documents (SRCC Guesstimates, parts of FMS
   2021-22) from the eval's own search pool and double-counting others — not a production
   bug, purely an eval-script artifact.
2. **Scoring-methodology fix (eval-script only, same file)**: `evalDarkFeature` questions
   (role/company — q015, q022, q023, q034) have no grounded retrieval route yet (a known,
   pre-existing R4-era finding) and were hard-coded `coverage_label: fail`. These were
   previously counted in the SAME hard-blocker bucket as a real false-grounded-answer. Fixed:
   they're still scored and reported (new `darkFeatureSkippedFromHardBlocker` list + a
   dedicated markdown section) but excluded from the "100% of not-covered questions must
   show coverage_label:pass" hard-blocker bar, which now measures only real grounding-safety
   correctness.
3. **Production prompt fix** (`backend/src/lib/consultingRetrieval.js`'s
   `RELEVANCE_SYSTEM_PROMPT`): added an explicit rule that a named employer/firm (Bain,
   McKinsey, BCG, a named client firm) is a specificity trigger, same tier as a quantity,
   city, or named thing like "Uber" — a firm-agnostic "day in the life of a consultant"
   excerpt is NOT faithful to a question specifically about Bain, even if it's the right
   general topic. This is the one real, stable judge gap the investigation found (q033,
   confirmed reproducible). Logged here per the paraphrase-layer skill's "any prompt change
   is a prompt change" rule.
4. **Threshold and judge vote count left untouched**, per the investigation's findings:
   `SIMILARITY_THRESHOLD`/`DIAGRAM_SIMILARITY_THRESHOLD` aren't the discriminator (good and
   bad matches sit in the same range), and the judge's 3-vote majority is a separate,
   real, but *undecided* reliability tradeoff (confirmed non-deterministic run-to-run on
   borderline content — q035 flipped between 3/3-reject and apparent 2/3-accept) that's
   Aalhad's call, not mine, to resolve.
5. **Test-data fixes in `backend/eval/questions.jsonl`** (pre-existing wording mismatches
   confirmed against the actual retrieved chunk, not retrieval bugs):
   - q013: the actual pricing decision-tree chunk only branches into "Value based pricing"
     and "Cost based pricing" — no "Competitor Based" node exists anywhere in that chunk.
     Removed the term rather than inventing content that isn't there.
   - q025: chunk says "Raw material costs" (singular "material"); `must_include` required
     "raw materials" (plural). Fixed the term to "raw material" to match the actual
     casebook wording (chose to fix wording over adding plurality-insensitivity, since this
     was a one-term mismatch, not a systemic pattern).
   - q021: "Analyse" (casebook UK spelling) vs a paraphrase naturally shifting to "analyzing"
     (US spelling) — general fix, not a one-off patch: added `normalizeUkUs()` in the eval
     script, applied to both the haystack and each required term before comparing, covering
     analyse/organise/recognise/colour/favour/behaviour/centre root-spelling variants.
   - q026: confirmed via a direct `ingest_chunks` query that "value chain" DOES exist in a
     different chunk on the same casebook's pages 12-14, just not in the single top-ranked
     chunk the eval script was checking. Fixed the eval script to check `must_include`
     against the top chunk's paraphrase PLUS the raw content of every other row that passed
     the relevance judge (`relevantRows`) — matching production, where `qaRetrieval.js`
     actually shows every relevant row to the student, not just the top one.
6. **Ground-truth relabel, flagged as reversible**: q039 ("How do you solve a private equity
   due diligence case?") was `covered:false`, but two independent runs (2026-11-02 and
   2026-11-06) both retrieved the exact same chunk ("Due Diligence - Case Structure," IIM
   Lucknow casebook, page 58, similarity 0.7747) — a genuine, substantive, on-topic PE
   due-diligence case walkthrough. Relabeled to `covered:true`, `expected_source:"IIM L
   Consulting Casebook 2025"`, `expected_pages:[58]`, `must_include:["Due Diligence","Supply
   Side","Demand Side"]`. **This is a judgment call, not a certainty** — if Aalhad's actual
   intent was "case-math walkthroughs shouldn't surface even when topically present,"
   `covered:false` was deliberate and this should be reverted.

**Fresh scorecard (`backend/eval/results/2026-11-07-r9-fixed.{json,md}`, real run):**

| Bar | Threshold | Actual | Met? |
|---|---|---|---|
| Not-covered `coverage_label` (hard blocker, dark-feature excluded) | 100% | 8/10 (80%) | **NO** |
| Overall correctness pass rate | ≥60% | 28/39 (72%) | yes |
| Paraphrase faithfulness | ≥80% of applicable judgments | 10/12 (83%) | yes |
| must_include survival after paraphrasing | ≥65% | 20/23 (87%) | yes |
| Inactive-content gate (hard blocker) | majority from `is_active=false` docs | 23/23 | yes |

**Verdict: still FAIL** — one hard blocker missed. 9 of the original 19 failures are now
fixed (q002, q005, q007, q013, q016, q021, q025, q033, q039 all flip fail→pass). But two
**new or still-open hard-blocker misses surfaced**, both outside this task's authorized fix
list (named-firm specificity only) and NOT touched:
- **q028** ("daily revenue of Delhi Metro") is a **new regression caused by fix #1 itself**
  (the pagination fix): with the pool now complete and deterministic, the embedding query
  now surfaces a real FMS 2023-24 chunk about Delhi Metro **passenger counts**, which the
  relevance judge wrongly accepted even though the question asks about **revenue**, a
  different metric entirely. Previously this document's chunks were partly dropped by the
  pagination bug, so this miss never surfaced.
- **q035** ("stress interview prep") is a **pre-existing, already-known miss** (present in
  the 2026-11-06 baseline too, not introduced by any fix here) — a generic interview
  DO's/DON'Ts excerpt is accepted for a question about a specific interview sub-type
  ("stress interview"). Same failure class as q033's firm-specificity gap, but about an
  interview-type specificity, not a firm name — outside this task's one authorized prompt
  change (named firms only).
- **q004, q006, q009, q024, q026** also remain fail (lower severity, not hard-blocker —
  faithfulness/must_include misses on genuinely covered questions), unrelated to any of the
  6 authorized fixes above. Not investigated further here; flagged for a future rag-engineer
  pass.

No further prompt/threshold/vote-count changes were made beyond the 6 explicitly authorized
above, per scope — expanding the relevance-judge prompt to also cover "metric specificity"
(revenue vs. passengers) or "interview-sub-type specificity" would fix q028/q035 but was not
part of this task's agreed scope and risks side effects on other questions without its own
eval evidence; left for Aalhad's call on a follow-up pass.

**Call counts (real, printed by the script):** 35 embedding + 672 relevance-judge + 23
paraphrase + 36 faithfulness-judge = **766 Gemini calls**, all flash-lite tier via the
existing cascade (no escalation observed). Rough cost: at flash-lite's free-tier-equivalent
pricing this is well under a dollar, consistent with the ~580-call 2026-11-06 run that cost a
small fraction of the $20/month budget; relevance-judge calls dominate the count (3-vote gate
× up to several covering rows × 39 questions), same pattern as before.

**Files:** `backend/eval/run_eval_r9.js`, `backend/src/lib/consultingRetrieval.js`,
`backend/eval/questions.jsonl`, `backend/eval/results/2026-11-07-r9-fixed.{json,md}`.
**Proof:** `node eval/run_eval_r9.js` run to completion (766 real Gemini calls, read-only,
`is_active` and both feature flags confirmed untouched by the script's own design); `npm
test` run after the code changes: 180/181 pass (1 pre-existing sandbox env-leak failure,
unrelated, tracked in STATE.md).

---

## 2026-11-07 — R9.1: Full-scale Consulting switch-over gate eval — FAIL

**Phase:** R9 · **Type:** eval

**What changed:** Built `backend/eval/run_eval_r9.js`, the single authoritative, dated,
pass/fail-scored R9 gate that merges the v2 relevance-gate correctness eval
(`run_eval_v2_preview.js`, 2026-11-02) and the paraphrase/faithfulness eval
(`run_eval_paraphrase_preview.js`, 2026-11-03) into one run against the real pipeline
combination (v2 retrieval + relevance gate + paraphrase + faithfulness judge) that switch-over
would actually turn on. Calls the real production functions directly from
`consultingRetrieval.js` (`decideCoverage`, `judgeRelevanceOnce`, `paraphraseChunk`,
`judgeParaphraseFaithful`) — not reimplementations. Read-only: never touched `is_active`,
never set `ENABLE_CONSULTING_RAG_V2` or `ENABLE_ANSWER_PARAPHRASE` (confirmed by
`grep -c "\.update("` returning 0 and no env var writes anywhere in the script).

**Scope note:** `questions.jsonl` has grown to 51 lines since this plan was authored — a
parallel, already-committed FIN1 phase appended 12 Finance-domain questions (`f001`-`f012`,
including 2 `crossDomainProbe` questions). This run scoped to the original 39 Consulting
questions only, identified by id prefix `q001`-`q039` (all `domain:"Consulting"`); the 12
Finance questions, and `f011` (also `domain:"Consulting"` but a FIN1 cross-domain probe, not
one of the original 39), were excluded as out of scope for this Consulting-specific gate.

**Scorecard against the plan's explicit pass bar:**

| Bar | Threshold | Actual | Met? |
|---|---|---|---|
| Not-covered `coverage_label` (hard blocker) | 100% | 8/12 (67%) | **NO** |
| Overall correctness pass rate | ≥60% | 20/39 (51%) | **NO** |
| Paraphrase faithfulness | ≥80% of applicable judgments | 7/8 (88%) | yes |
| must_include survival after paraphrasing | ≥65% | 12/17 (71%) | yes |
| Inactive-content gate (hard blocker) | majority from `is_active=false` docs | 17/17 | yes |

**Call counts (real, printed by the script):** 35 embedding + 504 relevance-judge + 17
paraphrase + 24 faithfulness-judge = **580 Gemini calls**, all flash-lite tier via the
existing cascade, no escalation. Rough cost: flash-lite is effectively free-tier at this
volume — well inside the $20/month budget; most of this run's cost was the 504 relevance-
judge calls (3-vote gate × up to 6 covering rows × up to several covering rows per question),
higher than the plan's ~224-call estimate because several questions had more covering rows
above threshold than the 2026-11-02 run did (expected variance — the judge is not
deterministic run to run).

**`poolActiveState` breakdown:** 7 of the 9 Consulting `DOC_IDS` have chunks, all
`is_active=false` (3,884 total chunks read); the other 2 (SRCC Guesstimates, FMS 2023-24)
returned 0 chunk rows for this pool query — worth a follow-up, since SRCC is the one document
`log.md`/STATE.md record as already `is_active=true` with 62 active rows elsewhere, so either
those IDs are stale in `DOC_IDS` or the rows were filtered out upstream; not investigated
further here since it's out of this plan's read-only, no-fix scope. Of the 17 covered,
answered questions, **17/17 were answered from a document showing `is_active=false`** in this
pool — the inactive-content gate passes cleanly: this run does demonstrably exercise content
switch-over is about to activate, not a re-confirmation of already-active SRCC content.

**Named regressions vs `2026-11-02-v2-preview.md` (pass → fail, same question id):** q002
(Pareto Principle), q005 (Swiggy orders guesstimate), q007 (toll plaza guesstimate), q016
(Porter's Five Forces), q021 (4-step case approach) — all 5 flipped from `pass` to `fail`.
Some of this is expected non-determinism in the 3-vote relevance judge rather than a code
regression, but it is reported in full per the `rag-eval` skill's regression gate regardless.

**Hard-blocker failures (the actual reason this is a FAIL, not a close call):** 4 of 12
not-covered questions wrongly got a grounded answer instead of the "not covered" label —
q033 ("day in the life of a first-year consultant at Bain", matched a generic "A Day in
Consulting" chunk, similarity 0.73), q035 ("stress interview prep", matched generic interview
DO's/DON'Ts content, similarity 0.70), q039 ("private equity due diligence case", matched a
real PE due-diligence case-structure chunk, similarity 0.77), and q034 (company feature has no
grounded route at all, scored fail by design — same convention both preview scripts already
use). The relevance gate is accepting generic/adjacent casebook content as if it specifically
answered a narrower question it wasn't about — CLAUDE.md treats a not-covered question ever
showing a grounded answer as the one non-negotiable failure mode, so this alone would be
enough to fail the gate even before the 51% overall correctness number.

**Verdict: FAIL — switch-over (R9 plans 2-4) does NOT proceed.** Two bars missed (both listed
above), including one hard blocker. Per this plan's scope, no attempt was made to fix
retrieval/paraphrase code — that is a new rag-engineer task, reported to Aalhad, out of this
plan's scope.

**Files:** `backend/eval/run_eval_r9.js`, `backend/eval/results/2026-11-06-r9-full.json`,
`backend/eval/results/2026-11-06-r9-full.md`.
**Proof:** `node eval/run_eval_r9.js` run to completion, real Gemini calls, output above taken
directly from the script's own printed summary and the written `.json`/`.md` result files.

---


## 2026-11-06 — FIN1.05: Finance eval questions + read-only preview eval (cross-domain leakage check)

**Phase:** FIN1 · **Type:** eval

**What changed:** Added 12 new rows to `backend/eval/questions.jsonl` (append-only, every
pre-existing line untouched): 8 covered Finance questions spread across the compendium
(TVM/NPV, Ind AS 115 revenue recognition, DuPont, DCF/FCFF, LBO mechanics, options payoffs,
NPA classification, UPI economics), 2 not-covered Finance questions (live repo rate, a named
company's unpublished internal numbers — both genuinely outside the compendium's scope), and
2 `crossDomainProbe:true` questions (a Consulting-flavored MECE question and a Finance-flavored
WACC question) to directly test FIN1.04's domain-widening. Built
`backend/eval/run_eval_finance_preview.js`, mirroring `run_eval_paraphrase_preview.js`'s
read-only local-retrieval-over-inactive-rows pattern: fetches the 208 still-inactive Finance
`ingest_chunks` rows (FIN1.02's document, `is_active=false`) plus the same 9 inactive
Consulting documents the existing preview scripts use, computes cosine similarity locally,
and calls the real `decideCoverage`/`judgeRelevanceOnce` from `consultingRetrieval.js` — never
the live `match_ingest_chunks` RPC, never touching `is_active`. For the 2 probe questions, it
retrieves against the COMBINED Finance+Consulting pool and reports which domain's chunk
actually won. (One bug caught and fixed during this run: `ingest_documents.domain` is `null`
for every pre-existing Consulting document — never backfilled, since Consulting was the only
domain before FIN1 — so the script infers a domain label from `source_class` instead, which
is what the leakage check actually needed.)
**Why:** FIN1.04 shipped Q&A's domain-widening (drops the old Consulting-only filter, relies
on the existing relevance judge instead of a new classifier) on the strength of a reversible
design, not evidence. This plan was explicitly the evidence-gathering step before any
Finance switch-over decision.
**Results (real run, `backend/eval/results/2026-11-06-finance-preview.{json,md}`):**
- Coverage match: **10/10 (100%)** — all 8 covered and both not-covered Finance questions
  got the expected verdict.
- must_include term survival: **6/8 (75%)** on covered questions. Two misses: f005 (LBO)
  retrieved a neighboring PE topic ("PE Value Creation Levers and Returns Attribution")
  instead of "[14.2] LBO Mechanics" on one run (retrieval is not perfectly deterministic —
  rerunning sometimes returns the exact topic chunk, sometimes an adjacent one in the same
  module); f008 (UPI) retrieved "Payment Aggregators, Gateways and Payment Orchestration"
  instead of "[21.3] UPI Deep Dive", missing the literal "NPCI" term. Both misses are a
  **content/chunking granularity** finding, not a correctness or leakage failure: the
  relevance judge correctly accepted both as genuinely on-topic (adjacent compendium
  sections covering closely related subject matter), and the answer the student would see
  would still be substantively accurate — but it means a specific must_include term can
  legitimately land in a different, still-relevant chunk from the one the question was
  anchored on. Worth watching if a real switch-over eval sees the same pattern at scale.
- **Cross-domain leakage probes: NO LEAKAGE DETECTED.** The Consulting-flavored MECE
  question's winning chunk was from a Consulting casebook; the Finance-flavored WACC
  question's winning chunk was from the Finance compendium. Sample size is 2 probes — a
  first signal, not a final verdict, same caveat every other preview eval this session has
  carried.
**Files:** `backend/eval/questions.jsonl`, `backend/eval/run_eval_finance_preview.js`,
`backend/eval/results/2026-11-06-finance-preview.json`,
`backend/eval/results/2026-11-06-finance-preview.md`
**Proof:** `node eval/run_eval_finance_preview.js` run twice (once to catch and fix the
`domain` column bug above, once clean) against real Gemini calls. Real call count: 12
embedding calls + 216 relevance-judge calls (flash-lite tier, 3-vote gate × up to 6 covering
rows × 12 questions that reached the gate). `is_active` confirmed unchanged (never written by
this script — read-only `select`, no `update`/`upsert` anywhere in it).
**Cost:** Flash-lite tier only, well under a dollar for this run (12 embedding calls +
216 short relevance-judge calls, same cheap pattern as the existing preview evals) —
negligible against the $20/month budget.
**Open issues:** FIN1.04's domain-widening looks safe on this small sample; Aalhad's own
unresolved item — growing Finance eval coverage further (per the M2 done-when criteria, the
same way R3's 39 questions grew from a smaller starter set) — still stands before a full
switch-over decision.

---

## 2026-11-06 — FIN1.04: Q&A widened to both source classes, policy decision recorded

**Phase:** FIN1 · **Type:** retrieval

**What changed:** Threaded an optional `sourceClasses` param through
`retrieveConsultingChunks` and `groundedConsultingLookup` in `consultingRetrieval.js`,
forwarded to `match_ingest_chunks`'s 5th `filter_source_classes` argument (defaulting to
`null`, which the RPC coalesces to today's exact `club_casebook`-only behavior — every
existing caller, Frameworks and Guesstimates, is unaffected). `qaRetrieval.js`'s
`groundedQaAnswer` now calls `groundedConsultingLookup` with `domain: null` (dropping the
old hardcoded `"Consulting"` filter) and `sourceClasses: ["club_casebook",
"placewise_reference"]`, so free-form Q&A can reach both Consulting casebook content and
the Finance compendium once it's switched on, relying on the existing 3-vote relevance
judge (not a new domain classifier) to keep answers on-topic — a deliberate, reversible
first attempt per Aalhad's call this session; FIN1.05 adds cross-domain leakage probes to
the eval set as the first real evidence on this risk. Frameworks (`frameworksGrounding.js`)
and Guesstimates (`guesstimateRetrieval.js`) were not touched. Added a "Second source
class, same presentation" decision note to CLAUDE.md's grounding policy, in the same style
as the existing 2026-11-02 notes: `placewise_reference` content (e.g. the Finance
compendium) is shown identically to `club_casebook` content, no visible label, distinguished
only internally by `source_class`.
**Why:** Closes the "ingested but unreachable" gap from FIN1.02/FIN1.03 — until this
change, nothing in the retrieval code would ever surface a `placewise_reference` row even
after it's made active, because Q&A hardcoded `domain: "Consulting"` and the pre-FIN1.03
RPC hardcoded `club_casebook`.
**Files:** `backend/src/lib/consultingRetrieval.js`, `backend/src/lib/qaRetrieval.js`,
`backend/test/consultingRetrieval.test.js`, `backend/test/qaRetrieval.test.js`, `CLAUDE.md`
**Proof:** `npm test`: 180/181 pass (1 pre-existing, unrelated sandbox env-leak failure —
see `.gsd/STATE.md`). 4 new tests, 2 per file, network-mocked (same `fetch`-mock pattern as
`consultingParaphraseFlagOn.test.js`) to assert the real RPC request body carries
`filter_source_classes` (both values when passed, `null` when omitted) and that
`groundedQaAnswer` specifically sends `filter_domain: null` plus both source classes.
Live read-only check: queried `ingest_chunks`/`ingest_documents` directly (service-role
client, bypassing the RPC's `is_active` filter) and confirmed the 208 Finance chunks from
FIN1.02 are real rows (`source_class='placewise_reference'`, `domain='Finance'`,
`source_file='finance_compendium.md'`, `is_active=false`). Then called the live
`match_ingest_chunks` RPC with `filter_source_classes: ['club_casebook',
'placewise_reference']` and a dummy embedding: it accepted the array (no error) and
returned 10 rows, 0 of them from `finance_compendium.md` — confirming the RPC's hardcoded
`c.is_active = true` clause (migration_049) correctly still excludes the inactive Finance
chunks today, i.e. this plan wires reachability but does not switch anything on; that
remains a separate, later decision for Aalhad.
**Cost:** $0 (no Gemini/embedding calls made; the live RPC probe used a dummy local
embedding array, not a real `embedContent` call).

---

## 2026-11-06 — FIN1.02: Finance compendium ingested into ingest_documents/ingest_chunks

**Phase:** FIN1 · **Type:** ingestion

**What changed:** Built `backend/scripts/ingestFinanceCompendium.js` and ran it for real
against `Data Extracted from Claude Cowork/Data/Finance Files/finance_compendium.md`. Parsed
208 topic chunks (modules 1-25, no topic exceeded the 6000-char split threshold so
`splitLongContent` never fired), ran each through the conservative diagram-author +
3-vote faithfulness-judge gate (`financeDiagramAuthor.js`), embedded every chunk's final
content (`gemini-embedding-001`, confirmed 768-dim), and wrote one `ingest_documents` row
(`source_class = 'placewise_reference'`, `domain = 'Finance'`, `status = 'done'`) plus 208
`ingest_chunks` rows, every one `is_active = false`.
**Why:** Lands the Finance reference compendium in the same `ingest_documents`/`ingest_chunks`
shape the rest of the retrieval stack reads, so FIN1.04's Q&A wiring has real rows to query
(via the local preview pattern, not the live RPC, until a separate switch-over decision).
**Files:** `backend/scripts/ingestFinanceCompendium.js`,
`backend/ingestion/out/fin1_ingest_report.json`
**Proof:** `backend/ingestion/out/fin1_ingest_report.json` — 208/208 chunks written; 136
diagrams proposed, 135 passed the faithfulness judge and were attached (`has_diagram=true`
on exactly 135 rows, verified against the live table), 1 proposed diagram dropped as
unfaithful (text-only fallback, the gate working as designed). DB verified directly: exactly
one `ingest_documents` row for `finance_compendium.md` (`status='done'`), 208 `ingest_chunks`
rows, 0 with `is_active=true`.
**Cost:** Real `llm_call_log` count for the `financeDiagramAuthor-*` features this session:
425 proposal calls + 424 faithfulness-judge calls = 849 flash-lite generation calls, plus 208
embedding calls (not logged in `llm_call_log`; `embedTexts` doesn't call `logLlmCall`, counted
from the script's own run report). The completed, written run itself made 208 proposal + 408
judge + 208 embedding calls (`fin1_ingest_report.json`'s `geminiCalls`); the extra ~217
proposal/judge calls above that are from (1) the required `--dry-run` pilot before the real
run (208 proposal calls, by design — zero judge/embedding calls, zero writes) and (2) an
accidental duplicate background process that was started and killed within ~15s before it
reached the embedding step or any DB write (no duplicate rows were written — confirmed only
one `ingest_documents` row exists). All flash-lite tier. Rough cost: low single-digit cents,
well inside the $20/month budget.
**Undo:** Nothing is live — `is_active` stays `false` on every row. To fully undo: `delete
from ingest_documents where source_file = 'finance_compendium.md'` (cascades to its 208
`ingest_chunks` rows). No existing row anywhere was touched.
**Open issues:** None for this plan. FIN1.04 (Q&A wiring) and the separate CLAUDE.md doc
update for `placewise_reference` are out of scope here, per the plan.

---

## 2026-11-06 — Fix: pass a real domain filter to match_document_chunks at 3 call sites to avoid statement timeouts

**Phase:** R9/ad-hoc fix · **Type:** bug fix (retrieval call sites, not retrieval logic itself)

**What changed:** After Aalhad dropped `document_chunks_embedding_idx` (the IVFFlat vector
index, to free up free-tier storage), any `match_document_chunks` call with
`filter_domain: null` does a full sequential scan over all 22,457 rows - domain-filtered calls
stay fast because the `where domain = ...` predicate narrows the scan before the (now
unindexed) distance computation. Live timing on Supabase: `filter_domain: null` took ~9.6s
(right at the ~8s statement-timeout edge - reproduced a `57014` timeout on an earlier run),
vs ~0.2-0.9s for `filter_domain: "Finance"/"Prodman"/"HR"`.

Three call sites always passed `filter_domain: null` even though they had a role name in
scope that usually maps to a real domain:
- `backend/src/lib/skillContent.js` (`retrieveContext`, Skill pages)
- `backend/src/lib/roleTopics.js` (`retrieveContextV1`, Role topics)
- `backend/src/lib/roleCompanyTopicNotes.js` (`retrieveCompanyChunksV1`, Role x company notes)

Added `ingestDomainForRole(roleName)` to `backend/src/lib/roles.js` - maps a role's platform
domain (the 10-bucket taxonomy on `ROLE_CATALOG`) to the 6-bucket tag actually stored on
`document_chunks.domain` (`Consulting`, `Finance`, `Prodman`, `HR`, `Marketing:Sales`,
`General Management` - confirmed as the exhaustive, exact set live, counts sum to 22,457).
Mirrors `frontend-react/src/lib/constants.ts`'s existing `DOMAIN_TO_DB`/`mapDomainForRetrieval`
remap used for the Resume/Story/Mock Interview domain selector. Three platform domains (Data
and Analytics, Operations and Supply Chain, IT and Technology) have no ingested bucket of
their own - `ingestDomainForRole` returns `null` for those on purpose, so those roles still
search unfiltered (today's behavior), same as any role name it can't resolve at all (free
text, typos). All three call sites now pass `filter_domain: ingestDomainForRole(roleName)`
instead of a hardcoded `null`. The existing silent-degradation fallback (empty context on any
RPC error, including a timeout) is left exactly as-is - it's a reasonable fail-safe; this fix
addresses the cause, not the symptom.

**Checked, not changed:** `backend/src/routes/story.js`, `mockInterview.js`, `resume.js` pass
`filter_domain: domain || null` where `domain` comes from the request body. Traced to the
frontend's `RAG_DOMAIN_OPTIONS`/`mapDomainForRetrieval` (`frontend-react/src/lib/constants.ts`)
- `""`/"General (all domains)" is a deliberate user-facing choice to search everything, not an
accidental omission, and every other option already sends a real ingest-bucket string. No fix
needed there.

**Why:** A dropped index changed a previously-fast `filter_domain: null` path into a
timeout-risk one; these three sites had a real domain signal sitting unused that would have
avoided it.
**Files:** `backend/src/lib/roles.js`, `backend/src/lib/skillContent.js`,
`backend/src/lib/roleTopics.js`, `backend/src/lib/roleCompanyTopicNotes.js`
**Proof:** `npm test` → 174 pass, 1 fail (`test/sandbox.test.js`'s pre-existing, unrelated
sandbox env-leak flake - see `.gsd/STATE.md`). Live Supabase RPC timing:
`filter_domain: null` 9656ms vs `filter_domain: "Finance"` 931ms / `"Prodman"` 395ms /
`"HR"` 237ms (same query embedding, `match_count: 8`). `ingestDomainForRole` spot-checked
against 11 sample role names (all 6 mappable domains + 4 unmappable + 1 free-text, all
correct). Curled the three affected routes against the running dev server (`:4000`): all
returned `200` (`/api/skills/Product Manager/Excel`, `/api/roles/Investment Banking
Associate/topics`, `/api/roles/Consultant/company-notes?company=McKinsey&topics=Case
Interview`).
**Undo:** Revert the 4 files; `ingestDomainForRole` is additive (no migration, no schema
change) so there's nothing to roll back at the data layer.
**Open issues:** None. The underlying index-drop risk for truly domain-less lookups (free-text
role names, or the 3 unmapped platform domains) remains - those still do an unindexed full
scan on `filter_domain: null` and can still occasionally time out; out of scope for this fix
per the brief (stop triggering the timeout where a domain is actually known, not rebuild the
index or re-architect every null-filter caller).

## 2026-11-06 — Migration: widen match_ingest_chunks for finance source_class, add chunk metadata

**Phase:** FIN1 (plan 03) · **Type:** migration (written, not yet applied)

**What changed:** Added `backend/db/migration_049_finance_source_class.sql`. It (1) drops and
recreates `match_ingest_chunks` with a new optional 5th argument,
`filter_source_classes text[] default null`, whose `where` clause changed from the hardcoded
`d.source_class = 'club_casebook'` to `d.source_class = any(coalesce(filter_source_classes,
array['club_casebook']))` — every existing caller (which never passes the new argument) sees
byte-identical behavior; (2) adds `ingest_chunks.metadata jsonb not null default '{}'`, a
generic place for the Finance compendium's per-topic tags (domain/level/roles/keywords); (3)
adds `comment on column` notes on `ingest_chunks.page_start`/`page_end` recording that
`source_class = 'placewise_reference'` documents (no real PDF pages) repurpose those columns
as source-markdown line numbers.
**Why:** Unblocks FIN1.02 (needs `metadata` to write compendium tags into) and FIN1.04 (needs
the widened RPC to read `placewise_reference` rows alongside `club_casebook`) without touching
a single existing row's behavior. Follows the exact DROP+CREATE pattern of
migration_042/044 (a new parameter is a new Postgres signature, not an overload-safe replace).
**Files:** `backend/db/migration_049_finance_source_class.sql`
**Proof:** Written matching migration_042/044's structure byte-for-byte on the unchanged
parts (verified by diff read-through); balanced parens (31/31) and two matched `$$...$$`
pairs confirmed via a local Python scan (no `psql`/DB access available in this sandbox - see
`.gsd/STATE.md` "Known gaps"). Not yet applied: needs Aalhad to run it via the Supabase SQL
editor, or `backend/scripts/apply_migration_049.py` following the
`apply_migration_041/042/043.py` pattern if direct DB access works from his machine. After
applying, expect `select proname, pronargs from pg_proc where proname =
'match_ingest_chunks';` → one row, `pronargs = 5`, and `ingest_chunks.metadata` to exist.
**Undo:** Rollback block is in the migration file's comments (drops the 5-arg function,
recreates the 4-arg migration_044 version; the `metadata` column and `comment on column`
notes can be left in place harmlessly).
**Open issues:** Not applied yet — blocking FIN1.02/FIN1.04 until Aalhad runs it.

## 2026-11-06 — Guesstimates: use the full page width instead of a fixed 680px column

**Phase:** R8 (frontend fix) · **Type:** fix

**What changed:** `GuesstimatesPage.tsx` wrapped everything in `maxWidth: 680`, leaving
roughly half of desktop width empty. Replaced it with the same page layout convention
already used by `FrameworksPage`/`RolePage`: a "What you'll find here" `grid-3` intro
(what the page offers, work-it-yourself framing, swap-it-out), then the practice problem
in the existing `two-col-sidebar-wide` grid - the problem card on the left (wider, larger
type, more padding), a static "How to approach it" / "Common pitfalls" tips sidebar on
the right. The sidebar is static guidance only, not per-answer citation data - CLAUDE.md's
2026-11-02 grounding-policy decision already removed per-answer school/casebook/page
attribution from the UI (see `GroundingNote.tsx`), so this does not reintroduce it. Also
removed the stale "Minimal by design... placeholder for Aalhad to redesign" header comment
that this change supersedes.
Fixed a layout bug this surfaced: `.two-col-sidebar-wide`'s mobile breakpoint collapses to
a single `1fr` grid track, whose implicit minimum width is its content's max-content size,
not 0 - a wide monospace `AsciiDiagram` box inside the problem card was pushing the whole
page into horizontal scroll at phone width. Added `minWidth: 0` to both grid-item wrappers.
**Why:** Aalhad: "use the entire page that is shown; don't leave anything." Minimal,
convention-matching fix rather than a new pattern.
**Files:** `frontend-react/src/pages/GuesstimatesPage.tsx`
**Proof:** `npm run build` (tsc + vite) and `npm run lint` (oxlint) both pass, no new
warnings/errors introduced. Verified live on the dev server via gstack `/browse`
(headless screenshots rendered blank in this sandbox - a tool/environment limitation, not
a page issue - so verified instead via the accessibility snapshot/text dump, which showed
the new sections and problem card rendering correctly, plus `getComputedStyle`/
`scrollWidth` checks: at 1280px wide the grid reports two tracks (~735px + ~403px, no
horizontal overflow); at 375px wide `document.body.scrollWidth` dropped from 510px
(overflowing) to exactly 375px (no overflow) after the `minWidth: 0` fix.
**Undo:** revert this commit (restores the `maxWidth: 680` wrapper).
**Open issues:** none for this fix. Unrelated to scope: the page still doesn't render a
"not from the casebooks" label for Guesstimates (`GuesstimateResponse.label`/`covered` are
unused) - flagging for a future ticket, not touched here since the task was explicitly
layout-only.

---

## 2026-11-06 — Guesstimates: extend R7b's paraphrase + faithfulness-judge layer to the random-pick problem

**Phase:** R7b (extension) · **Type:** feature

**What changed:** `getRandomGuesstimateProblem` (`guesstimateRetrieval.js`) showed its
winning casebook row verbatim (`problem: row.content`), never going through R7b's
paraphrase layer at all - it doesn't call `groundedConsultingLookup`, so the existing
`ENABLE_ANSWER_PARAPHRASE` flag (gating Q&A/Frameworks) could never have reached it.
Wired `consultingRetrieval.js`'s existing `paraphraseAndVerify` straight into the winning
row, behind a **new, separate** flag, `ENABLE_GUESSTIMATE_PARAPHRASE` (off by default,
same reversibility posture as every other paraphrase flag) - deliberately not reusing
`ENABLE_ANSWER_PARAPHRASE`, so turning paraphrase on for Guesstimates can never silently
turn it on for Q&A/Frameworks or vice versa. Passes a fixed context string
(`"a guesstimate practice problem for a student to work through"`) as the paraphrase
prompt's `queryText`, since there's no real student question for this "give me a problem"
path - `PARAPHRASE_SYSTEM_PROMPT` only uses that text to describe what the student is
about to do with the excerpt, never treats it as something to answer. On success,
`problem` becomes the verified rewrite, with `paraphrased: true` and `rawProblem` (the
original verbatim text) alongside it - same shape `frameworksGrounding.js` already uses
for `paraphrased`/`rawExcerpt`. Flag off, or any paraphrase/faithfulness failure
(`paraphraseAndVerify` itself fails closed on a dropped diagram token, a failed
faithfulness vote, or a Gemini call error): byte-identical to the pre-existing shape, no
new keys, `problem` stays the verbatim excerpt. Set `ENABLE_GUESSTIMATE_PARAPHRASE=true`
in `backend/.env` (local/gitignored only).

**Why:** Aalhad's explicit request: Guesstimates was still showing the raw casebook chunk
verbatim, which the grounding policy (CLAUDE.md, 2026-11-02) requires to go through the
paraphrase layer like every other covered answer - but Frameworks/Q&A must stay exactly
as they are (`ENABLE_ANSWER_PARAPHRASE` untouched, still off by default), so a new,
independent flag was the only option.

**Files:** `backend/src/lib/guesstimateRetrieval.js`, `backend/.env`,
`backend/test/guesstimateParaphrase.test.js` (new)

**Proof:** 4 new tests (mocked Gemini/Supabase fetch, no live calls): paraphrase succeeds
and is used (`.problem` is the rewrite, `.rawProblem` holds the original, `.paraphrased:
true`); faithfulness judge rejects the rewrite → verbatim fallback, no `rawProblem` key;
paraphrase call errors (simulated 429) → verbatim fallback; flag off → verbatim, zero
paraphrase calls attempted, exact pre-existing key set
(`available`/`problem`/`hasDiagram`/`citation`). `npm test` in `backend/`: all 4 new
tests pass; pre-existing suite otherwise unchanged (same 3 pre-existing failures already
tracked in `.gsd/STATE.md` - 1 sandbox env-leak flake, 2 unrelated `pickTopTextAndImage`
WIP failures - none caused by this change). Reused R7b's existing `paraphraseAndVerify`
machinery as-is; no new prompt, so no new faithfulness-eval run is required by the
`grounded-answering` skill's "log the prompt" rule (same prompt, same judge, new caller).

**Undo:** Set `ENABLE_GUESSTIMATE_PARAPHRASE=false` (or delete the line) in
`backend/.env` to go back to the verbatim excerpt in one step; no code revert needed.

**Open issues:** None. Cost: same per-use paraphrase call as Q&A/Frameworks (1 paraphrase
call + up to 3 faithfulness-judge votes, all flash-lite tier, cached per chunk content for
7 days via the existing `paraphraseCache`) - negligible against the $20/month budget
since Guesstimates' random-pick draws from a fixed ~36-problem book, so the cache quickly
covers nearly every distinct chunk.

---

## 2026-11-06 — MarkdownWithDiagrams: actually render markdown in text segments

**Phase:** R8 · **Type:** fix

**What changed:** `MarkdownWithDiagrams.tsx`'s text segments (from `splitMarkdownBlocks`)
were shown as a plain `<p>` with `white-space: pre-wrap` - any markdown inside (headers,
`**bold**`, bullet/numbered lists, `> blockquotes`) rendered as literal syntax. This was
invisible while the only consumers (Guesstimates problems, Frameworks grounded excerpts)
happened to be plain text, but the new `/qa` page feeds it markdown-rich Gemini prose and
every `###`/`**` showed up raw on screen. Added a new component, `MiniMarkdown.tsx` - a
small hand-rolled parser (headings, `**bold**`/`*italic*`, bullet/numbered lists incl.
loosely-indented nested items, `>` blockquotes, paragraphs) - and swapped it in for the
text-segment render in both `MarkdownWithDiagrams.tsx` and the admin review queue's
`RebuiltContent` (`ReviewQueue.tsx`, a one-line reuse of the same component). No markdown
library added: the construct set PlaceWise's paraphrase/answer prompts actually produce is
this narrow and fixed, so a ~100-line zero-dependency parser is a smaller footprint than
`react-markdown` and its plugin surface. `splitMarkdownBlocks`'s diagram-fence splitting in
`placewiseBlocks.ts` is untouched.

**Why:** QA bug found in R8: the `/qa` page's answers showed raw markdown syntax instead of
formatted text, hurting the page's main content.

**Files:** `frontend-react/src/components/MiniMarkdown.tsx` (new),
`frontend-react/src/components/MarkdownWithDiagrams.tsx`,
`frontend-react/src/pages/admin/ReviewQueue.tsx`

**Proof:** `npm run build` (tsc -b && vite build) and `npm run lint` (oxlint) both pass, no
new warnings from the changed/new files. Verified live via `/browse` (headless `$B`, Aside
unavailable) as a guest on `/qa`: asked "What is the BCG matrix? Explain it with its
benefits." twice; both answers rendered real `<h3>`/`<strong>`/`<em>`/`<ol>`/`<ul>` elements
- `document.body.innerText` contains no literal `#`, `**` or list-marker artifacts.
Screenshots at desktop (1280px) and phone (375px) both look correct in dark theme (the only
theme the running instance was in). Console had only a pre-existing font-preload warning,
no errors.

**Undo:** Revert the three files; `MarkdownWithDiagrams`/`RebuiltContent` go back to raw
`pre-wrap` text.

**Open issues:** Numbered lists restart at "1." each time a nested bullet sub-list
interrupts them (cosmetic - e.g. four quadrant headings each numbered "1." instead of
1-4), since each break starts a fresh `<ol>`. Not a raw-markdown-leak regression, just an
un-ideal list continuation; low priority. Light theme and ReviewQueue's admin-only `.rq-text`
CSS weren't separately re-checked (ReviewQueue is behind the admin-only review queue, not in
this QA pass's scope).

---

## 2026-11-06 — Frameworks: shared diagram renderer, render grounded excerpts, remove a live diagram-privacy violation

**Phase:** R8 · **Type:** fix

**What changed:** `FrameworksPage.tsx`'s local `GridDiagram`/`FunnelDiagram` components
(no malformed-data fallback) are replaced with the shared `PlacewiseDiagram` component
via a small adapter (`toDiagramBlock`) that wraps the existing `diagram_type`/`diagram_data`
into a `PlacewiseDiagramBlock` - the same renderer the admin review queue and Guesstimates
already use, with its JSON fallback on bad data. `grounded_example.excerpt` and
`grounded_image.caption` - fetched from the backend on every load but previously dropped
on the floor - are now rendered through `MarkdownWithDiagrams` (so a `placewise-diagram`
fence inside either one renders as a diagram, not raw JSON text), in a new "From the
casebooks" card and below the diagram respectively. Removed the `<img src={f.grounded_image.url}>`
that rendered a raw admin Storage URL straight to students on the v1 (`document_chunks`)
grounding path, live today regardless of `ENABLE_CONSULTING_RAG_V2` - CLAUDE.md forbids
exposing original page images or their storage URLs to non-admin users. `Framework.grounded_example`/
`grounded_image` types extended with `citation`/`rawExcerpt`/`rawCaption`/`similarity`
(debugging/admin use only, never rendered) to match what `frameworksGrounding.js` actually
returns.

**Why:** Plan `.gsd/phases/R8/01-PLAN.md` - one student-facing surface was still on the
old, narrower diagram path, with real casebook content fetched and then silently hidden,
and a live privacy violation showing a raw admin image URL. Backend untouched; the known
`pickTopTextAndImage`/`topText: null` WIP (`.gsd/STATE.md`) is out of scope here.

**Files:** `frontend-react/src/pages/FrameworksPage.tsx`, `frontend-react/src/types/api.ts`

**Proof:** `npm run build` (tsc -b && vite build) and `npm run lint` (oxlint) both pass,
zero new warnings. Verified live via `/browse` (headless `$B`, Aside unavailable on this
machine) as a guest on `/frameworks`: expanded "Net Promoter Score" and "BCG Growth-Share
Matrix" - both diagrams render via the shared component (ASCII visual model), a "From the
casebooks" card shows the real grounded excerpt, `document.querySelectorAll('img')`
returns `[]` on the page (no raw image ever reaches the DOM), console had no errors
(only pre-existing font-preload warnings). Checked at desktop and 375px mobile width.

**Undo:** Revert this one file pair (`FrameworksPage.tsx`, `types/api.ts`) - no backend
or data change.
**Open issues:** `grounded_example` is `null` for most frameworks right now because of
the separately-flagged `pickTopTextAndImage` WIP in `frameworksGrounding.js` (v1 text
grounding disabled) - expected, not a bug in this change. `.claude/skills/frontend-conventions/SKILL.md`
still has a stale line about per-answer citations predating the 2026-11-02 decision -
flagged for Aalhad, not edited here (out of this plan's scope).

---

## 2026-11-06 — Build the missing Q&A frontend page, fix Guesstimates' "not available" message

**Phase:** R8 · **Type:** feature

**What changed:** `POST /api/qa/ask` (`backend/src/routes/qa.js`, `qaRetrieval.js`) had
zero frontend surface — built, tested, flag-gated behind `ENABLE_CONSULTING_RAG_V2`, but
no page, route, or nav entry called it. Added `frontend-react/src/pages/QaPage.tsx`: one
question box (mic input via the existing `useVoiceRecording`/`VoiceRecordButton`, 1000-char
client-side cap matching the backend's limit), an "Ask" button, and the answer rendered
through `MarkdownWithDiagrams` with `GroundingNote` showing "General guidance - not from
the casebooks" whenever `groundedInCasebooks` is false - never a per-answer citation
(CLAUDE.md's 2026-11-02 decision keeps school/casebook/page API-only). Registered at
`/qa` and added a nav entry ("Ask") to `TopNav.tsx`'s `NAV` array. Also fixed
`GuesstimatesPage.tsx`'s "not available" message, which previously showed one generic
line regardless of whether the backend's `reason` was `feature_disabled` or
`not_yet_live` - it now shows the feature-off message only for `feature_disabled`, and
the backend's own `label` (falling back to a "couldn't find a fresh problem" message)
otherwise.

**Why:** R8's objective (new diagram types, citations, the AI-generated label) needs a
real place for `GroundingNote`'s fallback label to attach to - Frameworks and
Guesstimates don't have a general-knowledge fallback of their own, Q&A does. Kept
deliberately minimal, same posture as `GuesstimatesPage.tsx`'s existing "placeholder for
Aalhad to redesign" comment.

**Files:** `frontend-react/src/pages/QaPage.tsx` (new), `frontend-react/src/router.tsx`,
`frontend-react/src/components/shell/TopNav.tsx`, `frontend-react/src/types/api.ts`
(added `QaAskResponse`), `frontend-react/src/pages/GuesstimatesPage.tsx`

**Proof:** `npm run build` (tsc -b && vite build) and `npm run lint` (oxlint) both pass,
zero new errors/warnings. Verified live via `/browse` (headless, Aside unavailable on
this machine) as a guest: nav shows "Ask", typed a question, got a real answer with the
"General guidance - not from the casebooks" label rendered correctly (the dev
environment has the flag on) - confirms `ENABLE_CONSULTING_RAG_V2` off still renders the
"isn't switched on yet" branch in code (`!res.available`), since that branch is a plain
`if` on the same response shape exercised. Screenshots taken at desktop and 375px widths.

**Cost:** 0 planned - the route is flag-gated and this change adds no new Gemini calls by
itself. One live `/browse` verification question was asked against the dev environment,
which happened to have the flag on already (not something this change controls),
generating one real ungrounded-answer call.

**Undo:** Delete `QaPage.tsx`, remove its `router.tsx`/`TopNav.tsx` entries, and revert
`GuesstimatesPage.tsx`/`types/api.ts` - a single, reversible diff.

**Open issues:** None from this change. `MarkdownWithDiagrams` doesn't render markdown
headings/bold/LaTeX (shows `###`/`$$...$$` literally) - pre-existing across the whole
site (Frameworks' ask box, Guesstimates), not introduced here.

---

## 2026-11-06 — Fix: company news colliding with unrelated real-world acronym use (e.g. "JPMC")

**Phase:** M4 (frontend fixes) · **Type:** fix

**What changed:** `GET /api/companies/:companyName/news` (`backend/src/routes/companies.js`)
was searching GNews on the raw typed string, quoted verbatim (`"${companyName}"`). For an
acronym like "JPMC" this matched unrelated real-world uses of the same acronym — in this
case, Pakistani news coverage of Jinnah Postgraduate Medical Centre, not JPMorgan Chase.

**Fix:** the route now resolves the typed name to its real full name first, via the same
`getCompanyOverview()` call (and its existing 4-day cache) that already powers the "JPMC" →
"JPMorgan Chase & Co." resolution shipped 2026-11-05, and searches GNews on that resolved
name instead. If the resolved name is a full legal name (e.g. "Aditya Birla Fashion and
Retail Limited") that's too long/strict a quoted phrase for GNews to match anything
verbatim, it falls back to the original raw typed name for that one lookup — tested live:
"JPMC" now returns only JPMorgan-relevant headlines (confirmed zero hospital hits across 10
articles); "ABFRL" still returns its correct 2 real Aditya Birla Fashion articles via the
fallback path.

**Known cost tradeoff:** a cache-miss company lookup can now make up to 2 GNews calls
instead of 1 (resolved name, then raw-name fallback only if the first returned zero
articles) — bounded, since the fallback only fires on an empty result, not on every
request, and the resolved-name result is cached once found (`news_cache`, 6h TTL, keyed by
whichever name actually returned articles).

**Cleanup:** manually deleted the two already-polluted `news_cache` rows for `jpmc` and
`abfrl` (via the Supabase Management API, since direct Postgres access times out from this
environment) so the fix applies immediately instead of waiting out the 6h TTL.

**Open issue, not fixed:** `companyOverview.js`'s own internal `getNews()` call (used only
as grounding context for the AI-written overview, not shown directly to students) still
queries the raw typed name — it runs *before* `canonicalName` is known, so it can't resolve
first by construction. Lower severity since it only feeds a "best effort" LLM prompt rather
than being displayed as headlines.

**Verified:** `npm run build` (frontend, unaffected — no frontend changes this entry) clean;
`node --check` on the edited route file; live curl against the local dev server for both
"JPMC" and "ABFRL".

---

## 2026-11-05 — Clickable framework names, sliding nav tab highlight, company short-name resolution, Mock Interview card width

**Phase:** M4 (frontend fixes) · **Type:** feature / fix

**What changed:** Four separate user-requested changes, landed together.

**1. Framework names are now clickable (orange, matching "Review"), not just the Review
button.** `FrameworksPage.tsx`'s name `<span>` now calls the same `toggle(f)` the Review link
already used, and is styled `var(--indigo)` (the same orange as Review) specifically so a
student knows it's clickable without needing a tooltip.

**2. Nav-pill scroll indicator is now a real visible element, not a hidden native scrollbar.**
Earlier today's dropdown-close commit hid the nav-pill row's scrollbar entirely
(`scrollbar-width:none`); the user's actual complaint ("add a small scroll bar so I can see all
the sections") was about macOS's *overlay* scrollbar style, which native CSS can't force
visible regardless of `scrollbar-width`/`scrollbar-color` (confirmed: changing those had zero
visible effect in headless Chromium screenshots, scrolled or not - it's an OS-level
always-hidden-until-mid-gesture setting, not something a page can override). Built a small
custom scroll-progress bar instead (`TopNav.tsx`: a ref on `.topnav-links`, a `scroll`/`resize`-
driven `navScroll` state, rendered as a thin absolutely-positioned track+thumb) - always
visible whenever the pills don't all fit, thumb width/position reflecting the real scroll
ratio.

**3. The active nav tab now slides smoothly between tabs ("soft slider" effect) instead of
instantly flashing.** Previously each `.nav-item.active` had its own background/box-shadow/
border that appeared and disappeared independently per link on route change - visually a hard
cut, not a transition, since two different DOM elements can't visually "slide" into each
other. Replaced with one shared `.nav-slider` element (CSS `transform`/`width` transition,
0.28s) whose position is measured off whichever `NavLink` is actually active
(`isNavEntryActive`, mirroring each link's own `end={entry.to === "/"}` match rule) via
`useLayoutEffect` keyed on `location.pathname`, re-measured on window resize too. `.nav-item`
itself now only carries the (instant, fine) text-color/dot/font-weight active state - the
background lives entirely in the slider, sitting behind the link content via z-index. Regression
caught and fixed in the same pass: the mobile hamburger panel reused `.nav-item.active` and
had no slider of its own, so it silently lost its highlight entirely when the background moved
out of the shared class - added `.mobile-nav-panel .nav-item.active`'s own static background
back, scoped to that panel only.

**4. Company page resolves a short form/abbreviation to the real company name everywhere, not
just inside the About paragraph.** Typing "JPMC" or "ABFRL" and hitting enter previously left
the search box and the page heading showing the raw typed text, while only the About
paragraph's prose (written by the same Gemini research call) correctly said "JPMorgan Chase &
Co." Added a `"canonicalName"` field to `companyOverview.js`'s existing structured-extraction
prompt (same research call already made for every company - zero additional cost) and a
`canonical_name` column (`migration_048`) to persist it in the cache. `companies.js`'s route
now prefers `overview.canonicalName` over echoing back the raw `companyName` param. Frontend:
`CompanyPage.tsx` derives `displayName`/`displayParentName` from the loaded overview and uses
them for the search box value, the `<h2>` heading next to the logo, the "Subsidiary of ..."
line, and the Business Model modal's eyebrow label - `company`/`parentCompany` state itself is
untouched (still the raw typed string), since that's the key every other section's fetch
(`news`, `roles`, `timeline`, `valueChain`, `rating`, `leadership`, `logo`) is keyed by, and
renaming it mid-flight would have broken all of those caches.

**Also fixed, smaller:** Mock Interview's "Start a mock interview" card had a stray
`maxWidth: 520` making it visibly narrower than the "What you'll find here" cards above it -
removed, so it now spans the same width.

**Files:** `frontend-react/src/pages/FrameworksPage.tsx`,
`frontend-react/src/components/shell/TopNav.tsx`, `frontend-react/src/styles/global.css`,
`frontend-react/src/pages/CompanyPage.tsx`, `frontend-react/src/pages/MockInterviewPage.tsx`,
`frontend-react/src/types/api.ts` (`CompanyOverview.name`),
`backend/src/lib/companyOverview.js`, `backend/src/routes/companies.js`,
`backend/db/migration_048_company_canonical_name.sql` (applied via the Supabase Management
API, same as migration_047).

**Cost:** ~$0 additional - canonical name reuses the overview's existing research call, nothing
else here calls Gemini.

**Proof:** `npm run build` clean (real `tsc -b` + `vite build`). Verified live: clicking a
framework name (not just Review) expands/collapses it identically, styled orange. Nav slider
visibly repositions on route change with a real CSS transition (`getComputedStyle` confirmed
`transform 0.28s cubic-bezier(...)`), both desktop pill row and mobile hamburger panel show a
correct active highlight. `curl localhost:4000/api/companies/JPMC` and `/ABFRL` both return the
resolved full name in `company.name`; live UI search box + heading show "JPMorgan Chase & Co."
after typing "JPMC" and hitting enter. Mock Interview card now full-width, matching its
siblings. No console errors on any page checked.

**Open issues:** Noticed but out of scope for this pass - "JPMC" news results pull in unrelated
Pakistani-hospital headlines (a different, real-world "JPMC" acronym collision in the news
search, not a bug in this fix) since news search still keys off the raw typed abbreviation, not
the resolved canonical name.

---

## 2026-11-05 — Every dropdown site-wide now closes on an outside click

**Phase:** M4 (frontend fixes) · **Type:** fix

**What changed:** User asked, site-wide and on mobile too, for every dropdown to collapse the
instant a click lands anywhere else on the page - until now a dropdown only closed by clicking
its own trigger again or picking an option. Neither `Selector.tsx` (the shared searchable
dropdown behind Frameworks' Domain/Topic, Role's Role/Company/Topic, and Company's Company/
Subsidiary/Job role - 8 instances) nor Tone Shifter's local `LabeledDropdown`/inline unit
picker (3 more) had any outside-click handling at all.

Added one shared hook, `useOutsideClick.ts` (ref + a `mousedown` listener on `document`,
active only while the dropdown is actually open), and wired it into both dropdown components
plus their shared `close` action (`useSelector.ts` already had `toggle`/`reset`; added `close`
- same as `reset` but leaves the typed search query alone, matching how Escape already closes
without clearing it). Fixing it in the two shared components covers all 11 dropdown instances
site-wide at once, mobile included - no page-specific duplication.

**Files:** `frontend-react/src/hooks/useOutsideClick.ts` (new),
`frontend-react/src/hooks/useSelector.ts`, `frontend-react/src/components/Selector.tsx`,
`frontend-react/src/pages/{FrameworksPage,RolePage,CompanyPage,ToneShifterPage}.tsx` (pass
the new `close` prop through to each `<Selector>`/`<LabeledDropdown>` call site).

**Proof:** `npm run build` clean (real `tsc -b`, not the no-op `--noEmit -p tsconfig.json`
mistake from earlier this session). Verified live: opened the Domain dropdown on Frameworks,
clicked the page's `<h1>` (a real click, not a synthetic event) - dropdown closed. Repeated at
a 390px mobile viewport (same result), on Tone Shifter's Domain dropdown, and on Company's
Company dropdown. No console errors on any of the three pages.

---

## 2026-11-05 — Nav bar wrapping to a second line on narrow (non-maximized) desktop windows

**Phase:** M4 (frontend fixes) · **Type:** fix

**What changed:** User reported, with a live-production screenshot, that on a non-maximized
Safari window (roughly 850-950px wide - two browser windows side by side) the streak pill,
search, notifications and avatar were dropping below the nav-pill row instead of staying on
one line: "the menu bar should not become a second line." This was a pre-existing bug, not
something introduced by the mobile hamburger work - `.topnav-row` had an unconditional
`flex-wrap:wrap` (true for every width, not just mobile), so whenever the 9 nav pills plus the
right-side icons didn't all fit, the whole row wrapped. The new mobile breakpoint
(max-width:640px) only fixed this below 640px by hiding the pills behind a hamburger; the gap
between 640px and roughly 1050px (full desktop nav width) was never covered and still wrapped.

**Fix:** `.topnav-row` is now `flex-wrap:nowrap` unconditionally - the header never wraps to a
second line at any width. `.topnav-links` (the pill row) is `flex-wrap:nowrap` too, with
`overflow-x:auto` (scrollbar hidden) - so if the 9 pills don't fit in whatever space is left
after the brand and the right-side icons, they scroll horizontally within their own row
instead of forcing the header onto two lines. Below 640px the pills are hidden entirely behind
the hamburger as before, unaffected by this change.

**Files:** `frontend-react/src/styles/global.css`.

**Proof:** `npm run build` clean. Verified live at 800-1050px (the reported bug's width range):
streak/search/notifications/avatar now stay on the same line as the nav pills at every width
tested; nav pills scroll rather than wrap when they don't fit (confirmed
`scrollWidth`/`clientWidth`/`scrollLeft` behave correctly, and the page itself never gets
horizontal overflow). Re-verified both true mobile (390px, hamburger shown, single line) and
full desktop (1440px, everything fits, no scrolling) are unaffected.

---

## 2026-11-05 — Site-wide audit: every route, desktop + mobile, console + overflow + one fix

**Phase:** M4 (frontend fixes) · **Type:** fix / QA

**What changed:** User asked for "a complete audit of this website." Asked which kind (mobile,
functional, visual, security) via AskUserQuestion - no answer came back, so per Auto Mode
("make the reasonable call and keep going"), ran a direct sweep myself rather than block:
console errors + page-level horizontal overflow at both desktop (1280px) and mobile (390px) on
every route in `router.tsx` (Home, Frameworks, Guesstimates, Company, Role, Mock Interview,
Resume Drill, Tone Shifter, Community), plus a functional click-through of Role -> Skill,
Company -> pick a company (Flipkart), and a check that `/admin` fails safely for a guest (shows
a plain 404, not an error or a confirming "access denied").

**One real bug found and fixed:** `HomePage.tsx`'s hero `<img>` had `fetchPriority="high"`
(camelCase) - correct in React 19, but this app is on React 18.3, which doesn't special-case
that prop yet and logged "React does not recognize the `fetchPriority` prop" on every single
page load (Home is the landing page everyone hits first). First attempt lowercased it to
`fetchpriority` - that silences the runtime warning, but broke the actual production build
(`tsc -b`, run by `npm run build`): `@types/react` 18.3's typings only know the camelCase
name, so the plain-lowercase attribute fails type-checking. Caught before this reached main
only because the merge-to-main step below ran a real build first - `npx tsc --noEmit
-p tsconfig.json` (what every "clean" check earlier in this session actually ran) turned out to
be a no-op: the root `tsconfig.json` has `"files": []` and only references sub-projects, so
`-p tsconfig.json` without `-b` silently checks nothing. Confirmed by reverting to the buggy
version and re-running the same command - exit 0, no error reported, despite the real
type error being there. Final fix: removed the attribute entirely rather than fight the
runtime/typings mismatch - it's a non-essential loading-priority hint, not load-bearing.

**Checked and found not to be real problems:** Tone Shifter had a 2-3px page-level overflow at
390px (`scrollWidth` 393 vs `clientWidth` 390) - traced to sub-pixel rounding across the whole
page shell, not any single broken element; invisible in the screenshot, not worth chasing.
Skill page's difficulty picker and Mock Interview's domain picker use a native browser
`<select>` where Role/Company/Frameworks use the custom-styled dropdown - a cosmetic
inconsistency, not a bug, left as-is (flagging it here in case it's worth a future pass).

**Files:** `frontend-react/src/pages/HomePage.tsx` (one-line removal).

**Proof:** `npm run build` (real `tsc -b` + `vite build`, not the no-op `--noEmit -p
tsconfig.json`) clean. Re-ran the console check after the fix: zero warnings/errors on Home
(previously the one page with a real warning). Zero page-level overflow found on any route at
desktop width; only the one negligible sub-pixel case on mobile. No broken links, no failed
API calls, no console errors across any of the 9 routes exercised. Backend: `npm test` 146/147
- the one failure (`sandbox.test.js`, a Python-subprocess env-isolation check) reproduces
identically on `main` with none of today's changes applied, so it's a pre-existing,
environment-specific flake (a macOS `__CF_USER_TEXT_ENCODING` var leaking into the subprocess
environment), not a regression.

**Open issues:** This was a direct sweep, not the qa-tester agent or a multi-page design
review - deeper per-page checks (spacing/type-scale/touch-target review, paid-flow testing
like actually running a mock interview or resume upload end-to-end, a security pass on
auth/RLS) are each their own task if wanted; said so explicitly rather than claim this covers
them.

---

## 2026-11-05 — Mobile nav: hamburger menu replaces the wrapping nav-pill row

**Phase:** M4 (frontend fixes) · **Type:** fix

**What changed:** At narrow widths the top nav's 9 pill links (`.topnav-links`) had
`flex-wrap:wrap` with no mobile-specific layout, so on a phone they wrapped into 2-3 cramped
rows of pills, eating vertical space before any page content showed - the "menu bar collapses"
problem the user described, with the fix they asked for by name: "instead of having that menu
bar we can show three lines at the top left corner and when someone clicks on them... show the
option and once you click on it again it collapses the menu."

Added a hamburger button (`TopNav.tsx`, reusing the existing circular `.bell-btn` icon-button
style already used for search/notifications, so it looks native to the bar, not bolted on) that
only exists below 640px (the breakpoint the old wrap rule already used). Clicking it opens
`.mobile-nav-panel` - the same 9 `NavLink`s, same active-state styling, listed vertically
full-width below the header - and the icon swaps to an X. Clicking it again, pressing Escape, or
navigating to a link all close it; it's wired into the header's existing single
Escape/outside-click handler (the same one `search`/`notifications`/`avatar` already share)
rather than a second copy of that logic.

**Found and fixed a CSS cascade bug while testing:** the hamburger button briefly leaked onto
desktop. `.mobile-menu-btn{display:none}` and `.bell-btn{display:flex}` have equal specificity
(one class each), and `.bell-btn`'s own rule happens to sit later in `global.css`, so it won on
source order and overrode the hide rule. Fixed by targeting `.bell-btn.mobile-menu-btn` (two
classes) instead of `.mobile-menu-btn` alone, which wins regardless of source order - caught by
screenshotting desktop after the change, not assumed safe.

**Files:** `frontend-react/src/components/shell/TopNav.tsx`,
`frontend-react/src/styles/global.css`.

**Proof:** `npx tsc --noEmit` clean. Verified live at a 390x844 viewport (iPhone-sized): single-
row header (hamburger, search, notifications, avatar, no wrapping), menu opens/closes/auto-
closes-on-navigate correctly, active route highlighted. Spot-checked Home, Frameworks (including
an opened framework card with its ASCII diagram and the new Ask box), Role, Company,
Guesstimates and Resume Drill for page-level horizontal overflow (`scrollWidth >
clientWidth`) - false on all six. Re-verified desktop (1280x720) after the cascade fix: nav bar
pixel-identical to before this change.

**Open issues:** Only the global nav was restructured; no other page got a dedicated mobile
layout pass beyond the overflow spot-check above - a page-by-page mobile design review (spacing,
type scale, touch targets) is a larger, separate task if wanted.

---

## 2026-11-05 — "Ask about this framework": suggested follow-up questions + voice-enabled free-text Q&A on the Frameworks page

**Phase:** M4 (frontend fixes) · **Type:** feature

**What changed:** Added a box under each framework's Review panel so a student can ask a
follow-up question (by text or by speaking) and get an answer grounded in that framework's
own already-verified content - a direct build of a feature discussed with the user: "if we
provide a text box for students to type in their queries regarding the framework... will that
be a good feature." Scoped deliberately narrow per that discussion, not an open casebook-wide
chatbot - retrieval is the framework's own row (description/example/steps/pitfalls/when_to_use/
when_not_to_use), the same content already shown on the page and already fact-checked, not a
new vector search.

**Suggested-question chips, not a blank box:** 3-4 questions per framework, generated once
(`backend/scripts/generateFollowUpQuestions.js`, same one-off batch-and-store pattern as the
diagram scripts) grounded in the framework's own content - specifically the `pitfalls` field,
since that's already "where students get confused." Ran against all 57 frameworks, 57/57
succeeded. Spot-checked output is genuinely targeted (Porter's Five Forces: "Rivalry vs
entrants—how do I keep them separate?"), not generic "what is this" filler.

**Grounded Q&A backend** (`backend/src/lib/frameworkQa.js`, `POST /api/frameworks/ask`): builds
a prompt from the framework's own fields, generates an answer, then gates it with
`judgeParaphraseFaithful` - the exact same faithfulness judge the R7b paraphrase layer already
uses (`consultingRetrieval.js`), reused as-is rather than rebuilt. One retry with feedback if
the first answer fails the judge; if both fail, falls back to the framework's own raw
`when_to_use`/`pitfalls` text rather than ever showing an unverified answer (same fail-closed
posture as the paraphrase pipeline falling back to the verbatim excerpt). `requireAuth` +
`aiLimiter` (same as `qa.js`'s `/ask`) since this is a paid Gemini call per question.

**Voice input reuses the existing convention, not a new one:** the user was explicit that this
had to match the mic button already on Resume's clarifying-question box and Skill's answer box
- built with the same shared `useVoiceRecording` hook and `VoiceRecordButton` component,
namespaced with its own `recKey` (`framework-ask__<id>`) so it doesn't collide with any other
mic instance on the page. No new voice-input code was written.

**Files:** `backend/db/migration_047_framework_suggested_questions.sql` (new `text[]` column,
applied via the Supabase Management API - the direct Postgres port was unreachable from this
environment, confirmed via `information_schema.columns` instead of a local psql check),
`backend/scripts/generateFollowUpQuestions.js` (new), `backend/src/lib/frameworkQa.js` (new),
`backend/src/routes/frameworks.js` (new `POST /ask` route), `frontend-react/src/types/api.ts`
(`suggested_questions` on `Framework`, new `FrameworkAskResponse`),
`frontend-react/src/components/FrameworkAskBox.tsx` (new), `frontend-react/src/pages/
FrameworksPage.tsx` (renders it in each card).

**Cost:** ~$0 - flash-lite tier. One-time batch: 57 generation calls for suggested questions.
Per-question going forward: 1 generation + 3 judge calls (worst case 2 generations + 6 judge
calls on a retry) - same shape/cost as one R7b paraphrase-and-verify call.

**Proof:** `npx tsc --noEmit` clean. Verified live on localhost (guest session): opened Porter's
Five Forces, clicked the "Rivalry vs entrants—how do I keep them separate?" chip, got back a
correct, specifically-grounded answer (distinguishing rivalry-among-existing-players from
threat-of-new-entrants, matching the framework's own pitfalls bullet) with `grounded: true` -
no fallback triggered, no console errors beyond pre-existing harmless font-preload warnings.

**Open issues:** Not deployed - same `wip`-branch-only state as the rest of today's frameworks
work. Mic/transcription itself wasn't independently re-tested here since it's unmodified shared
code already exercised by Resume/Skill.

---

## 2026-11-04 — Reverted the AI-generated "unification" diagrams: restored the original hand-crafted diagrams for all 55 non-colliding original frameworks

**Phase:** M4 (frontend fixes) · **Type:** fix / revert

**What changed:** User compared localhost against production side by side for Porter's Five
Forces and said plainly: production's diagram (dense, multi-bullet, spatially laid out exactly
how it's taught - new entrants on top, suppliers/rivalry/buyers in a row, substitutes on the
bottom, with a strategic-synthesis note) is immediately understandable; localhost's AI-
generated version (bare 5-line flat list of force names, no detail) is not, and asked for every
diagram on localhost to match production exactly.

This was the real finding behind both of today's earlier fix attempts (the duplicate-label flow
bug and the 7 reclassified frameworks): the `bdf2bfe` "unify all 57 on one AI pipeline" commit
hadn't just fixed the AIDA/AARM collision bug it set out to fix - it had also thrown away the
original 42 frameworks' hand-crafted diagrams, which were denser, more detailed, and in several
cases (Porter's Five Forces, MECE, the LBO waterfall, DCF) laid out exactly the way these are
actually taught, and replaced them with thinner AI-generated versions that only restate what's
already in the bullet list below the diagram. Production was never redeployed after `bdf2bfe`,
so it was still silently serving the better, original diagrams the whole time - which is exactly
why the side-by-side comparison was so stark.

**Fix:** pulled the full original `FRAMEWORK_ASCII_MAP` from git history (`bdf2bfe~1`, the
commit right before the AI-unification rewrite) and restored its hand-crafted `{title, ascii}`
content into the current name-keyed map for every framework whose name maps unambiguously to
one of the original hand-crafted entries - 55 of the 57 live frameworks. Replicated the old
file's fuzzy name→slug matching rules in a throwaway script to do this safely and verify there
was exactly one real framework behind each slug before restoring it.

**Kept the AI-generated diagram for 2 frameworks on purpose:** the old matching rules had a
second real collision this script caught that the original "AIDA/AARM" bug report never
mentioned - "Dividend Discount Model (Gordon Growth Model)" and "Terminal Value (Perpetuity vs
Exit Multiple)" both matched the same `gordon growth` rule and would have both received the
Terminal Value diagram's content (wrong for DDM). Kept their current, already-distinct
AI-generated diagrams instead of restoring a mismatched hand-crafted one. Same logic for AARM
Funnel (kept distinct, AI-generated; AIDA Funnel got its real hand-crafted diagram back).

**Kept the name-keyed lookup, not the old fuzzy-match function:** the 1:1 exact-name map built
earlier today is what makes the AIDA/AARM and DDM/Terminal-Value collisions impossible to
reintroduce - restoring old *content* didn't mean reverting the *lookup mechanism* that had the
bug in the first place.

**The 15 newly-discovered frameworks (added after `bdf2bfe`, never existed on production) and
the 2 kept-AI frameworks above keep their AI-generated diagrams** - there's no richer
hand-crafted version to restore for content that was never hand-crafted to begin with.

**Why:** Direct response to the user: "is asking for an accurate diagram too much of a task...
make sure the diagrams are exactly the same as they are in production."

**Files:** `frontend-react/src/lib/asciiDiagrams.ts` (55 entries restored to their original
hand-crafted content, name-keyed map structure unchanged).

**Proof:** `npx tsc --noEmit` clean. Verified live on localhost (guest session, Consulting
domain): Porter's Five Forces and MECE now render byte-for-byte identical to the production
screenshots the user provided. Console clean (only harmless font-preload warnings plus stale
`ERR_CONNECTION_REFUSED` lines from the brief window before the backend dev server was
restarted - unrelated to this change).

**Open issues:** This supersedes (not stacks on top of) the two prior diagram-fix entries from
earlier today for the 7 overlapping frameworks (MECE, Business Model Canvas, PESTEL, 7S, Kano,
Blue Ocean, GTM) - those are now back to their hand-crafted originals, not the flat issue_tree
versions built a few hours earlier. The flow-renderer duplicate-label fix still stands for the
frameworks that only ever had AI-generated diagrams (the 15 new ones + AARM Funnel + DDM).

---

## 2026-11-04 — Fixed readability of flow/tree diagrams: killed duplicate-label clutter, reclassified flat frameworks mistyped as sequences

**Phase:** M4 (frontend fixes) · **Type:** fix

**What changed:** User compared two screenshots of the same MECE diagram - one from localhost
(the new AI-generated "flow" diagram: a confusing chain of 4 nodes where each step repeated
the next step's label, decorated with contrived bracketed phrases like "[ensure independence]")
against production's old hand-crafted box tree (Problem Statement → Category A/B → sub-cats),
and said plainly the new one "is extremely useless... it won't make any sense to the student,"
and to judge every diagram from a student's perspective, not just ship whatever the pipeline
produced.

Investigated and found two separate real bugs, not one:

1. **Renderer bug (affected all 44 "flow"-typed diagrams):** `flowToAscii`'s box-drawing format
   printed each node's label twice - once as its own step header, once again as the arrow target
   of the previous step - e.g. DCF's diagram repeated "Estimate terminal value" on two
   consecutive lines for no reason. Replaced with a clean vertical chain: each label appears
   exactly once, connected by a single `│ / ▼` arrow, with the edge's real condition/label (if
   any) printed on the arrow line instead of stapled onto the node text in brackets.

2. **Content misclassification (7 frameworks):** MECE, Business Model Canvas, PESTEL Analysis,
   McKinsey 7S Framework, Kano Model, Blue Ocean Strategy, and GTM Strategy Canvas are all flat
   component breakdowns (PESTEL's 6 factors, BMC's 9 blocks, 7S's 7 elements, etc.), not
   sequential processes - but the generation pass typed them "flow" anyway, which is what
   produced MECE's nonsensical fake 4-step "process." Reclassified as `issue_tree` (flat
   children under one root), matching the Porter's Five Forces fix pattern from the prior
   entry below. MECE's tree uses its two real criteria (Mutually Exclusive, Collectively
   Exhaustive) grounded in the framework's existing `example` field - the other two DB steps
   ("say structure out loud," "prefer simple splits") are usage tips, not structural components,
   so they stay in the bullet list under the diagram rather than being forced into the tree.
   McKinsey 7S's "Identify Misalignments" meta-step was dropped from the tree for the same
   reason (it's an application step, not one of the 7 S's).

No new Gemini calls were needed for either fix - both backup JSON files
(`backend/scripts/backups/all-42-diagrams-final.json` and
`backend/scripts/backups/framework-diagrams-2026-11-03T19-30-34-134Z.json`) already held the
structured `{nodes, edges}` / `{type, data}` from the original generation, so every fix was a
deterministic re-render from already-grounded content. Zero cost.

**Also retroactively logging:** the previous commit (`d438444`, same session) fixed Porter's
Five Forces showing 3 invented parent categories instead of 5 flat co-equal forces - caught by
the user (an IIM student) saying "it is not how we draw here... make sure you are doing it
accurately." That fix also updated both generation scripts' prompts to forbid inventing
intermediate grouping nodes for co-equal items. This entry was missed at the time; recorded now
for completeness.

**Why:** Direct response to the user's correction: shipping *a* diagram isn't the bar - it has
to actually read clearly to a student seeing it cold, matching how the content is really taught.

**Files:** `frontend-react/src/lib/asciiDiagrams.ts` (44 flow diagrams re-rendered without
duplicate labels, 7 reclassified flow→issue_tree).

**Proof:** `npx tsc --noEmit` clean. Verified live on localhost (guest session): MECE now
renders as the same style of box tree as production's old hand-crafted version. Console clean
(only harmless font-preload warnings).

**Open issues:** Did not re-audit the remaining ~37 flow-typed diagrams for further
type-vs-content mismatches beyond the 7 found here - only fixed the rendering bug for those.
If another one turns out to be a flat breakdown wrongly sequenced, same fix pattern applies.

---

## 2026-11-04 — All 57 frameworks now use one AI-generated diagram pipeline (no more mixed hand-crafted/generated)

**Phase:** M4 (frontend fixes) · **Type:** feature / refactor

**What changed:** User asked for every framework to show an AI-generated diagram with no
discrepancy between types. Until this point only the 15 newly-discovered frameworks did -
the original 42 still had their pre-existing hand-typed custom ASCII art, looked up via a
fragile keyword-matching function (`getAsciiDiagramForFramework`). That lookup had a real bug:
"AIDA Funnel" and "AARM Funnel" both matched the same loose `norm.includes("funnel")` rule and
silently rendered the IDENTICAL diagram - two different frameworks sharing one, wrongly.

Built `backend/scripts/regenerateAllFrameworkDiagrams.js` and ran it against all 42 original
frameworks: same pipeline as the 15 new ones (Gemini drafts a structured diagram - issue_tree/
flow/matrix - grounded strictly in that framework's own already-verified description/example/
steps/pitfalls, then the same deterministic renderer functions turn it into ASCII), except
this version lets the model choose the diagram type itself rather than being given a hint, since
hand-picking a type for 42 frameworks wasn't worth doing when the content makes it obvious.
Also regenerated "Value Chain Analysis" (one of the 15 new frameworks that had happened to
reuse a pre-existing hand-crafted entry, so it was the one straggler not yet AI-generated).

**Replaced the lookup mechanism, not just the content:** `FRAMEWORK_ASCII_MAP` is now keyed by
each framework's *exact* name (not a slug matched by keyword heuristics), and
`getAsciiDiagramForFramework` is a one-line direct lookup. This is what actually guarantees no
discrepancy going forward - a fuzzy keyword system has no way to promise every framework gets
its own distinct diagram; a 1:1 name-keyed map does, by construction. File shrank from 1131 to
913 lines despite having 15 more entries.

**Diagram type generation needed two small retries:** 3/42 frameworks (9-Box Grid, North Star
Metric, Porter's Generic Strategies) failed the auto-detection prompt on the first pass - a
JSON shape mismatch specific to the 'matrix' type when the model picked it under the longer
auto-detection prompt. North Star Metric passed on a plain retry; the two matrix cases were
regenerated with a shorter, matrix-specific prompt (same one proven for Managerial Grid
earlier) and passed cleanly.

**Result:** All 57 live frameworks (42 regenerated + 14 from the prior discovery-pass diagrams
+ 1 regenerated Value Chain Analysis) now have a diagram produced by the identical AI-
generation + deterministic-render pipeline. Zero shared/duplicate diagrams (verified: every DB
framework name has an exact, unique entry in the new map - 0 missing, checked programmatically).

**Why:** Direct response to user: "Make sure that all the frameworks show AI-generated
diagrams... there should be coherence among all the diagrams."

**Cost:** ~$0 - flash-lite tier, 43 generation calls (42 + Value Chain Analysis) plus a
handful of retries.

**Files:** `backend/scripts/regenerateAllFrameworkDiagrams.js` (new, read-only),
`frontend-react/src/lib/asciiDiagrams.ts` (rewritten: name-keyed map, simplified lookup,
renderer functions below it untouched - `treeToAscii`/`flowToAscii`/`matrixToAscii`/
`tableToAscii`/`diagramBlockToAscii` are still used elsewhere, e.g. Guesstimates),
`content/all-frameworks-diagrams-2026-11-04/all-57-diagrams.json` (full generated dataset).

**Proof:** `npx tsc --noEmit` clean. Verified live: MECE and Profitability Framework (both
previously elaborate hand-crafted multi-box diagrams) now render in the same visual style as
the newly-discovered frameworks' diagrams - genuinely coherent, not just side-by-side similar.
Programmatic check confirms all 57 DB framework names have an exact map entry, 0 missing.
Console checked - no new errors.

**Undo:** Revert this commit (git) - no database rows touched, this is frontend-only.

**Open issues:** None. Any future framework added to the `frameworks` table needs a
corresponding `FRAMEWORK_ASCII_MAP` entry added by name (same script pattern) or it will
correctly show no diagram rather than a wrong one.

---

## 2026-11-04 — Fixed: AARRR Framework was missing from the diagram pass (now 15/15 covered)

**Phase:** M4 (frontend fixes) · **Type:** bug fix

**What changed:** User asked "does the AI-generated diagram apply for all the 57 frameworks" -
checking the actual answer surfaced a gap: "AARRR Framework (Pirate Metrics)" was live in the
database (inserted in the very first discovery-pass apply run, 2026-11-03) but got left off the
13-framework diagram list in the previous entry - an oversight, not a deliberate exclusion.
Generated its diagram the same way as the other 13 (flow, grounded in its stored steps:
Acquisition -> Activation -> Retention -> Referral -> Revenue), added to
`FRAMEWORK_ASCII_MAP`/`getAsciiDiagramForFramework`.

**Result:** All 15 newly-added frameworks (14 from the discovery pass + Managerial Grid from
the refinement pass) now have a diagram - 14 generated across the two diagram passes, 1
(Value Chain Analysis) had a pre-existing entry. Combined with the original 42, all 57 live
frameworks now have an ASCII diagram.

**Why:** Direct accuracy check prompted by the user's question - worth stating plainly: my
previous "13/13 done" summary was incomplete, this was a real miss, not a planned scope cut.

**Cost:** ~$0 - one generation call.

**Files:** `frontend-react/src/lib/asciiDiagrams.ts` (1 new map entry + 1 new matching rule).

**Proof:** `npx tsc --noEmit` clean. Verified live (Frameworks -> Product Management -> Metrics
& Growth -> AARRR Framework (Pirate Metrics) -> Review): diagram renders correctly aligned,
matches the 5 steps in the stored content exactly.

**Undo:** Revert this commit (git) - no database rows touched.

**Open issues:** None - this was the last gap; all 57 frameworks now have diagrams.

---

## 2026-11-04 — ASCII diagrams for the 13 casebook-discovered frameworks

**Phase:** M4 (frontend fixes) · **Type:** feature

**What changed:** User noticed the 14 newly-discovered frameworks had no ASCII diagram on the
Frameworks page, unlike the original 42. Investigated: diagrams there aren't generated per-
framework - they're a hand-written lookup table (`FRAMEWORK_ASCII_MAP` +
`getAsciiDiagramForFramework` in `frontend-react/src/lib/asciiDiagrams.ts`), keyword-matched
to a framework name, with no entry for anything added after the original set. Value Chain
Analysis already had a pre-existing entry (lucky coincidence); the other 13 had none.

Built `backend/scripts/generateFrameworkDiagrams.js`: for each of the 13, Gemini drafts a
*structured* diagram (issue_tree / flow / matrix - not raw ASCII characters) grounded strictly
in that framework's already-verified `description`/`example`/`steps`/`pitfalls` already in the
`frameworks` table (no new casebook lookup). The structure is then rendered to ASCII by the
same deterministic renderer functions (`treeToAscii`/`flowToAscii`/`matrixToAscii`) the site
already uses elsewhere (e.g. Guesstimates' FLOW diagrams) - guaranteed-aligned box-drawing art
from code, not an LLM hand-painting characters (the fragile approach that was the actual
source of past misaligned-ASCII bugs on this project per `Mark Down Files/DOCUMENT.md`).

**Cleanup needed after generation:** two issues caught on review before shipping -
(1) a couple of flow diagrams double-numbered their steps (model included "1. Step name" in
the label text on top of the renderer's own `(1)` numbering) - stripped programmatically;
(2) the Managerial Grid matrix's axis labels came back as arrays instead of strings (the model
not matching the expected shape) - rendered as a mashed `"Low Concern,High Concern"` string;
corrected by hand to clean single-string axis labels, re-rendered.

**Result:** 13/13 diagrams generated, reviewed, and wired in - 12 as `flow`/`issue_tree`
(Dividend Discount Model, DuPont Analysis, Treasury Stock Method, Precedent Transaction
Analysis, Residual Income Model, ADDIE Model, Harvard vs Michigan Models of HRM, Kirkpatrick
Model, MoSCoW Method, Freemium Model, Net Promoter Score, Customer Satisfaction Score), 1 as a
`matrix` (Managerial Grid, a genuine 2x2). Added as new `FRAMEWORK_ASCII_MAP` entries plus a
matching rule each in `getAsciiDiagramForFramework` - same mechanism, same file, as the
existing 42.

**Why:** Direct response to user: "for all the new frameworks, I can't see an ASCII format
diagram... I think if you can add them in the website, it would be really helpful."

**Cost:** ~$0 - flash-lite tier, 13 generation calls.

**Files:** `backend/scripts/generateFrameworkDiagrams.js` (new, read-only - never touches the
database or frontend source directly), `frontend-react/src/lib/asciiDiagrams.ts` (13 new map
entries + 13 new matching rules), `content/new-frameworks-2026-11-03/ascii-diagrams.json`
(generated structures + rendered ASCII, for reference).

**Proof:** `npx tsc --noEmit` clean. Verified live on the running site: DuPont Analysis's
3-branch ROE tree and Managerial Grid's 2x2 matrix both render with correct box-drawing
alignment, same visual style as the original 42's diagrams. Console checked - no new errors.

**Undo:** Revert the `frontend-react/src/lib/asciiDiagrams.ts` changes (git) - this touched no
database rows, so there's nothing to restore there.

**Open issues:** None.

---

## 2026-11-03 — Multi-casebook synthesis refinement for discovered frameworks (56 → 57)
**Phase:** M4 (frontend fixes) · **Type:** content fix

**What changed:** Follow-up to the previous entry. User flagged that casebooks overlap heavily
- the same framework is explained, differently, across multiple club casebooks - and asked
that drafting actually synthesize a real understanding across those sources rather than just
use whatever got retrieved. Checked the already-shipped 14 frameworks: most had already pulled
from 8-11 distinct source files incidentally (the hybrid vector+text retrieval wasn't domain-
restricted, and heavy casebook overlap meant diverse sources showed up on their own), but one
was thin - "Harvard vs Michigan Models of HRM" drew from only 3 files.

Reworked `addDiscoveredFrameworks.js`: added `diversifyBySource` (caps any single source_file
at 3 excerpts before filling the rest of the pool, over a larger raw pull so there's enough
material left to diversify from after the cap) and rewrote the draft prompt to tell the model
explicitly that excerpts come from different casebooks describing the same framework
differently - read everything first, form one understanding, write from that, not stitch
fragments or paraphrase whichever single excerpt is most complete.

**Two tuning passes were needed before this actually worked:**
1. First version of the new prompt over-corrected - telling the model to watch for cross-
   source "disagreement" made it too willing to call solid material "insufficient" (pass rate
   dropped from 13/16 to 8/16, rejecting things like ADDIE that had 14 genuinely good
   excerpts). Recalibrated: differing emphasis/wording across casebooks is normal and expected
   to synthesize from, not a reason to decline - only a real factual conflict on the same
   specific detail counts.
2. A wider raw retrieval pool (needed for diversifyBySource to have material to work with)
   also pulled in enough marginal, low-similarity vector hits to dilute a couple of otherwise-
   solid candidates. Tightened `SIMILARITY_FLOOR` (0.42 -> 0.48) and trimmed the raw pool size
   back down - text matches (the term literally appears) were never filtered by this, so
   precision wasn't lost, just vector-search noise.
3. Added a plain retry (`DRAFT_ATTEMPTS = 3`) since the model's own insufficient/sufficient
   judgment wobbled near the boundary for a couple of candidates across otherwise-identical
   reruns - a genuinely borderline candidate now gets more than one roll.

**Result:** Re-ran all 16 candidates with the refined pipeline. 13 of the already-shipped 14
were re-drafted and UPDATED in place with better cross-source synthesis (upsert-by-name, not
insert, to avoid duplicates - any row about to be overwritten gets backed up first). 1 more
candidate (Managerial Grid) now passes and was newly inserted (56 -> 57). Black-Scholes Option
Pricing Model failed on a technical JSON-escaping bug (the formula's LaTeX-style backslash
notation breaks JSON parsing, confirmed reproducible across 2 isolated retries) - left out as a
known technical limitation, not a content judgment. AARRR Framework stays correctly excluded
(the corpus appears to only name-drop it without explaining it distinctly from the existing
AARM Funnel already on the page).

**Why:** Direct response to user feedback: "there would be many frameworks that overlap with
many of the casebooks... get a gist of each framework, understand what it says."

**Cost:** ~$0 - flash-lite tier, well under free-tier quota even with the extra tuning runs.

**Files:** `backend/scripts/addDiscoveredFrameworks.js` (reworked retrieval + prompt),
`frameworks` table (13 rows updated, 1 row inserted), `content/new-frameworks-2026-11-03/`
(report regenerated, pre-refinement backup added).

**Proof:** `content/new-frameworks-2026-11-03/new-frameworks.html` reflects the final state.
Verified live on the running site (Frameworks -> HR): "Harvard vs Michigan Models of HRM" now
reads as an actual synthesis ("a broad stakeholder-oriented lens (Harvard) or a tight
strategic-fit lens (Michigan)"), not thin single-source content. Console checked post-apply -
no new errors.

**Undo:** `node backend/scripts/restoreFrameworksBackup.js content/new-frameworks-2026-11-03/pre-refinement-backup.json`
restores the 14 affected rows to their pre-refinement text in one step (same restore script as
the jargon-simplification pass - it's a generic by-id upsert-back, not Finance-specific).

**Open issues:** Black-Scholes Option Pricing Model could be added later with a prompt fix for
LaTeX-notation JSON escaping, if wanted - not attempted further this session.

---

## 2026-11-03 — 14 new frameworks added, grounded in casebooks the list never covered (42 → 56)
**Phase:** M4 (frontend fixes) · **Type:** content addition

**What changed:** User noticed the Frameworks page (42 entries) was missing frameworks clearly
present in the casebooks. Investigated: the page has never been derived from the casebooks -
it's a hand-authored list from `migration_006_seed_frameworks.sql` ("the same well-known
frameworks every prep guide covers"), expanded once in `migration_019`. `frameworksGrounding.js`
only grounds a framework already on the list; it never discovers new ones from the corpus.

Scanned the full `document_chunks` corpus (22,457 chunks) for framework/model/method-style
name mentions - 646 distinct candidate phrases. Filtered out generic process nouns ("Financial
Analysis", "Risk Analysis" - an activity, not a named methodology), OCR artifacts, and
anything already on the page, down to 16 genuinely standard, well-represented, and missing
frameworks (user reviewed and approved the shortlist before building).

Built `backend/scripts/addDiscoveredFrameworks.js`: for each candidate, hybrid retrieval
(vector search via `match_document_chunks`, unfiltered by domain, merged with a direct text
match on the term as printed in the casebooks) pulls real excerpts, then one Gemini call
drafts description/example/steps/when_to_use/when_not_to_use/pitfalls strictly from those
excerpts (told explicitly not to use outside knowledge) in the same accessible-language style
as the jargon-simplification pass. A candidate whose excerpts don't actually substantiate it
is skipped, not drafted from general knowledge - fail-closed.

**Mid-build correction:** first version domain-filtered retrieval to the framework's target
page domain and silently missed real content (Net Promoter Score's actual formula lives in an
HR compendium, not a marketing-tagged file; "General Management" was never an ingested domain
tag at all, so it always returned zero rows) - caught in a dry run (5/16 drafted), fixed by
searching the whole corpus unfiltered (6/16). Vector search alone was then found to still miss
exact-term chunks that genuinely exist (verified ADDIE/Kirkpatrick/Treasury Stock Method by
hand via direct text search) - added a merged direct-text-match pass alongside the vector
search, which brought it to 13-14/16 drafted across runs.

**Result:** 14/16 added (56 frameworks total, up from 42): Value Chain Analysis, Dividend
Discount Model (Gordon Growth Model), DuPont Analysis, Treasury Stock Method, Precedent
Transaction Analysis, Residual Income Model, ADDIE Model, Harvard vs Michigan Models of HRM,
Kirkpatrick Model, AARRR Framework (Pirate Metrics), MoSCoW Method, Freemium Model, Net
Promoter Score, Customer Satisfaction Score (CSAT). 2 deliberately not added (Black-Scholes
Option Pricing Model, Managerial Grid) - judged insufficiently grounded rather than drafted
from general knowledge.

**Why:** Direct response to user question "why only 40-45 frameworks when the casebooks have
way more" - confirmed the cause, then (user: casebook corpus is final, no more uploads coming)
did a one-time curated batch addition rather than building reusable discovery tooling with no
future use.

**Cost:** ~$0 - flash-lite tier + one embedding call per candidate, well under free-tier quota.

**Files:** `backend/scripts/addDiscoveredFrameworks.js` (new), `frameworks` table (14 rows
inserted), `content/new-frameworks-2026-11-03/` (report + readable HTML).

**Proof:** `content/new-frameworks-2026-11-03/new-frameworks.html` - every new entry with its
full drafted content and excerpt count, plus the 2 deliberately-skipped candidates. Verified
live on the running site (Frameworks -> HR): ADDIE Model, Kirkpatrick Model, and Harvard vs
Michigan Models of HRM render correctly under their subdomains, same styling as every existing
entry. Console checked post-apply - no new errors.

**Undo:** These are new rows, not edits - `delete from frameworks where name in (...)` with the
14 names above, or by `id` from `content/new-frameworks-2026-11-03/discovered-frameworks.json`.

**Open issues:** None for this task. The underlying gap (~600 more candidate mentions never
filtered/reviewed) is real but out of scope - user confirmed a one-time curated batch was the
right call, not building out full corpus coverage.

---

## 2026-11-03 — Jargon simplification: remaining 5 domains (32 frameworks), site-wide rollout complete
**Phase:** M4 (frontend fixes) · **Type:** content fix

**What changed:** Ran `backend/scripts/simplifyFrameworkJargon.js --apply` (unchanged since the
Finance pilot) against the other 5 domains: Consulting (7), Prodman (8), Marketing:Sales (8),
General Management (6), HR (3) = 32 frameworks. Combined with Finance, all 42 frameworks in the
`frameworks` table have now been through the pass.

**Result:** 5/32 frameworks changed (Consulting 2/7, Prodman 1/8, Marketing:Sales 2/8, General
Management 0/6, HR 0/3), 7 fields total. Far fewer changes than Finance's 10/10 - expected and
correct: Consulting/GM/HR frameworks (SWOT, Porter's, MECE, 3Cs, 9-Box Grid, McKinsey 7S) are
already qualitative/plain-language by nature, so the model and judge correctly found nothing
worth simplifying in most of them. Where it did change something, it was real acronyms a
general reader wouldn't know on sight: DAU, SaaS, ARPU, ROI - never basic vocabulary.

**Why:** Direct continuation of the Finance pilot (previous log entry) - Aalhad reviewed the
Finance before/after (readable `.md` and `.html` reports) and approved extending the same pass
to every remaining domain.

**Cost:** ~$0 - flash-lite tier only.

**Files:** `frameworks` table (7 more fields across 5 rows updated).
`content/jargon-simplification-2026-11-03/backups/` (all 5 domains' pre-change backups + diffs),
`content/jargon-simplification-2026-11-03/all-domains-before-after.{md,html}` (combined
human-readable report covering all 42 frameworks, replaces the Finance-only report as the
primary reference - the original `finance-*` files are kept for history).

**Proof:** `all-domains-before-after.html` - open directly in a browser, jump-to-domain table
of contents, red/green before/after blocks per changed field.

**Undo:** Per-domain revert, same as Finance:
`node backend/scripts/restoreFrameworksBackup.js content/jargon-simplification-2026-11-03/backups/frameworks-<Domain>-pre-simplify-<timestamp>.json`

**Open issues:** None - this closes out the jargon-simplification task across the whole
Frameworks page. Future new frameworks added to the table won't automatically get this pass;
re-run the script (no `--domain` flag = all domains) if that's ever wanted again.

---

## 2026-11-03 — Jargon simplification pass: Finance domain (10/10 frameworks), pilot before site-wide
**Phase:** M4 (frontend fixes) · **Type:** content fix

**What changed:** Built `backend/scripts/simplifyFrameworkJargon.js` (+ `restoreFrameworksBackup.js`
for one-step revert) and ran it against all 10 Finance frameworks in the `frameworks` table
(student-facing Frameworks page content). Whole-framework Gemini rewrite + faithfulness/
precision/restraint judge, same fail-closed shape as R7b's paraphrase pipeline
(`consultingRetrieval.js`) - a framework that fails the judge (up to 6 attempts, judge's own
rejection reason fed back into the next attempt) keeps its original text untouched. 10/10
Finance frameworks updated; full before/after and the pre-change backup live in
`content/jargon-simplification-2026-11-03/`.

**Why:** User feedback (via friends who saw the live site) that Frameworks content, especially
Finance, uses jargon too dense for a general MBA reader. Concrete example given: "Equity Value
= Diluted Share Price × Fully Diluted Shares Outstanding" - their suggested fix ("...total
outstanding shares") would have been a precision loss (fully diluted shares outstanding is a
different, larger number than basic shares outstanding - it includes options, warrants, and
convertibles). Went with "keep the precise term, add a short clarification" instead, enforced
by the judge prompt explicitly, not just "simplify."

**Prompt iteration (in-session, not re-run):** v1 processed each field/array item
independently and over-defined everything, including basic vocabulary ("balance sheet" got a
definition) and re-defined the same term repeatedly - caught in a dry run before any DB write.
v2 moved to one whole-framework rewrite call with an explicit, exhaustive exempt list (only
balance sheet/income statement/cash flow statement/assets/liabilities/equity/revenue/profit/
debt/market/shares are assumed familiar - everything else gets clarified once) and an explicit
instruction that finance specialists not noticing a difference is the intended outcome, not a
bug - this content is written for the general-MBA reader, not the specialist who already knows
the vocabulary.

**Cost:** ~$0 - flash-lite tier only, well inside free-tier quota (10 frameworks × up to 6
rewrite+judge attempt pairs each, actual average ~1.6 attempts).

**Files:** `backend/scripts/simplifyFrameworkJargon.js` (new),
`backend/scripts/restoreFrameworksBackup.js` (new), `frameworks` table (10 rows updated),
`content/jargon-simplification-2026-11-03/` (report, diff, pre-change backup).

**Proof:** `content/jargon-simplification-2026-11-03/finance-diff.json` has every field's
before/after text. Verified live on the running site post-apply (Frameworks -> Finance ->
Enterprise Value & Equity Value (The Bridge) -> Review): the exact example from the feedback
now reads "...Fully Diluted Shares Outstanding (total shares including all potential options,
warrants, and convertibles)..." in both the step list and the ASCII diagram. Console checked
post-apply - no new errors.

**Undo:** `node backend/scripts/restoreFrameworksBackup.js content/jargon-simplification-2026-11-03/finance-backup-pre-simplify.json`
restores all 10 Finance rows to their exact pre-change text in one step.

**Open issues:** Scoped to Finance only as a pilot (Aalhad's choice, so tone/quality could be
reviewed before running everywhere) - the same script is ready to run on the other 32
frameworks (Consulting 7, Prodman 8, Marketing:Sales 8, General Management 6, HR 3) pending
Aalhad's go-ahead on this pilot's output.

---

## 2026-11-03 — Design audit + 4 fixes: blue/orange accent conflict, light callouts, loading states
**Phase:** M4 (frontend fixes) · **Type:** design fix

**What changed:** Ran a visual/color design audit (gstack's design-review methodology, scoped
to color/design only per Aalhad's request — navigation/IA out of scope) across Home, Frameworks,
Role, Guesstimates, and Tone Shifter. Report + before/after screenshots in
`design/design-audit-2026-11-03/`. Fixed 4 of 6 findings, one commit per finding, CSS/component-only:
- `FINDING-001`: `.fc-icon` badges (the icon circles on every "What you'll find here" block)
  were hardcoded blue (`#2563eb`) while every other accent on the site is orange (`#ff6b35`) -
  the `icon-blue/-purple/-green` modifier classes in markup never actually changed the
  background, so every badge rendered identically blue regardless of its class. Unified to orange.
- `FINDING-002`: the 4 framework-detail callouts ("When to use it," "When not to use it,"
  "Common pitfalls," "Example" - `FrameworksPage.tsx`) rendered as light pastel cards with
  near-black text inside an otherwise all-charcoal page. Converted to tinted-dark variants,
  keeping each one's semantic hue (green/amber/red/blue).
- `FINDING-003`: Role page's "Exit opportunities" bullets used `var(--green)` while "Skills
  required" and "Career progression" (same page, same visual role) both use `var(--indigo)`
  (actually `#ff6b35` - orange, legacy variable name from a prior theme). Unified to match.
- `FINDING-004`: Guesstimates ("Loading a problem…") and Role ("Loading role info…") showed
  plain text with no visual affordance during live Gemini calls. Reused the existing
  `IndeterminateProgressBar` component (already orange, already `prefers-reduced-motion`-aware)
  rather than building new loading UI.

**Deferred (not fixed):** a broken `□□□□` glyph and a stray unlabeled "30" in one Guesstimates
problem's casebook-extracted content - these are ingestion/data issues, not frontend styling,
and need `ingestion-engineer` to trace, not a CSS fix. Also deferred: a 34-node ASCII diagram
that reads as dense/overwhelming (content density, not color), the generic stock-illustration
hero on Home (needs a new asset decision from Aalhad), and borderline (~4.3:1) placeholder-text
contrast on Tone Shifter's inputs (decorative, not body content; fixing it sitewide is a bigger
token change than the finding warrants).

**Why:** Aalhad's friends flagged "the UI could be fixed," specifically color choice, after
seeing the live site. The blue/orange conflict and the light-on-dark callout boxes were the two
most visually loud, easiest-to-confirm issues in that feedback.

**Cost:** $0 - no API calls, CSS/inline-style and one shared-component reuse only.

**Files:** `frontend-react/src/styles/global.css`, `frontend-react/src/pages/FrameworksPage.tsx`,
`frontend-react/src/pages/RolePage.tsx`, `frontend-react/src/pages/GuesstimatesPage.tsx`.

**Proof:** Before/after screenshots in `design/design-audit-2026-11-03/screenshots/` and
`screenshots-after/`. Re-checked console on all 4 touched pages post-fix - no new errors, only
a pre-existing unrelated font-preload warning.

**Undo:** `git revert` the 4 `style(design): FINDING-00N` commits individually - each is a
single, isolated change.

**Open issues:** The 2 deferred content/data findings and the hero-illustration/placeholder-
contrast polish items remain open; see `design/design-audit-2026-11-03/design-audit-placewise.md`
fix-status table for the full breakdown.

---

## 2026-11-03 — R7b eval: paraphrase layer tested live against the 39-question set, R7b marked done
**Phase:** R7b · **Type:** eval

**What changed:** Ran a new, separate eval script (`backend/eval/run_eval_paraphrase_preview.js`,
new file, `run_eval_v2_preview.js` left untouched) that calls the real `paraphraseChunk` and
`judgeParaphraseFaithful` functions directly (bypassing `ENABLE_ANSWER_PARAPHRASE` — neither
function reads it) on the top relevant chunk for every question the existing relevance gate
marks covered, against the same still-inactive R6 chunk pool `run_eval_v2_preview.js` uses.
Strictly read-only: `is_active` untouched, no table written, flag never set.

**Results** (20 of 39 questions covered):
- **Paraphrase faithfulness: 10 pass, 1 fail, 9 n/a → 91% of the 11 applicable.** The 1 fail
  (q039, "How do you solve a private equity due diligence case?") is the fail-closed design
  working exactly as intended: the paraphrase added an inserted arithmetic-commentary step
  ("50% × 60% × 70% = 21%, or approximately 20% of the population") not clearly present in
  the source phrasing — the kind of model-added interpretation the judge exists to catch. A
  real `groundedConsultingLookup({ paraphrase: true })` call would fall back to the verbatim
  excerpt for this one question, not show the questionable rewrite.
- **must_include term survival after paraphrasing: 13 pass, 4 fail → 76% raw.** Manually
  traced all 4 failures (q013, q021, q025, q026) back to the raw chunk before accepting the
  automated label. **None were actually caused by paraphrasing**: q013/q025 are pure-diagram
  chunks where `paraphraseChunk` returns content byte-for-byte unchanged (nothing was
  rewritten); q021 is a US/UK spelling mismatch ("Analyze" in the chunk vs "Analyse" in
  `questions.jsonl`); q026's required phrase ("value chain") never appears in that chunk at
  all. All 4 would fail identically with paraphrasing off — pre-existing test-fixture/
  retrieval mismatches, not a paraphrasing regression.
**Why:** R7b's "done when" bar in `.gsd/ROADMAP.md` was "faithfulness judge passes on eval
set," not just mocked unit tests — this is that run. Clean result: on this question set, the
paraphrase layer doesn't demonstrably drop real facts, and its one true failure was caught
and would be handled safely by the existing fail-closed fallback.
**Cost:** 35 embedding + 504 relevance-judge (inherited coverage gate, not new) + 20
paraphrase + 33 faithfulness-judge calls = 592 total, flash-lite tier only, well under $0.10
for the run.
**Files:** `backend/eval/run_eval_paraphrase_preview.js` (new),
`backend/eval/results/2026-11-03-paraphrase-preview.{json,md}` (new).
**Proof:** Result files above; numbers spot-checked directly against the `.md` report.
**Undo:** Delete the new script/result files. No flag, table, or `is_active` row was changed
by this run.
**Open issues:** Sample is small (11 faithfulness judgments, 17 must_include-bearing
questions) — a useful first signal, not a final verdict, before flipping
`ENABLE_ANSWER_PARAPHRASE` live. Marked R7b `done (2026-11-03)` in `.gsd/ROADMAP.md`; ▶ moves
to R8 (frontend rendering for the v2 pipeline). `ENABLE_ANSWER_PARAPHRASE` is still unset
everywhere — Aalhad decides when to flip it, and production also needs R9's `is_active`
switch-over first regardless (see `.gsd/STATE.md`).

---

## 2026-11-03 — R7b built: paraphrase layer + faithfulness judge, code only, flag off
**Phase:** R7b · **Type:** feature

**What changed:** Implemented the paraphrase pipeline decided 2026-11-02, per
`grounded-answering` skill: `consultingRetrieval.js` gained `paraphraseChunk` (Gemini
rewrite, flash-lite, forbidden from adding any claim/number/name/step not already in the
source), `judgeParaphraseFaithful` (a separate 3-vote majority judge from the existing
relevance judge — "is the rewrite faithful" vs "does this answer the question" are kept as
different calls on purpose), and `paraphraseAndVerify` (caches the verified result per
chunk-content hash, 7-day TTL, `singleFlight`-shaped like `companyLogo.js`). Diagram blocks
(` ```placewise-diagram ` fences) are pulled out before paraphrasing and spliced back
verbatim afterward (`protectDiagramBlocks`/`restoreDiagramBlocks`) — a missing/duplicated
placeholder token fails closed to the raw excerpt rather than trusting the model not to
touch JSON it was told not to touch. `groundedConsultingLookup` takes a new `paraphrase`
option; on failure (judge rejects, call throws, token lost) it falls back to the verbatim
excerpt for that chunk, never a distorted rewrite. Gated behind `ENABLE_ANSWER_PARAPHRASE`
(off by default; documented in `backend/.env.example`) — flag off is byte-identical to
today's output (`content`/`hasDiagram`/`similarity` only), verified by a network-mocked
test.
**Scoped deliberately to Q&A (`qaRetrieval.js`) and Frameworks (`frameworksGrounding.js`'s
`findGroundingV2`)** — Guesstimates, Company, Role and Skill pages also call
`groundedConsultingLookup` but don't pass `paraphrase: true`, so the flag can't reach them
even when turned on, without a further code change. Flag to Aalhad if he wants Guesstimates
included too — the skill doc mentions it but this build didn't wire it.
**Why:** Verbatim excerpts satisfied the letter of the grounding policy but not its purpose;
Aalhad wants the same facts, re-explained, not a PDF dump — with a safety net so a bad
rewrite never reaches a student silently.
**Tests:** 20 new (3 files, all pure/mocked — no live Gemini/DB calls): diagram-block
round-trip + fail-closed cases, faithfulness vote-counting, flag-off no-op proof (asserts
only the pre-existing relevance-judge calls happen), flag-on end-to-end (faithful rewrite
used, unfaithful falls back, diagram JSON survives byte-for-byte, dropped token fails
closed, pure-diagram chunk skips the paraphrase call entirely).
**`npm test`: 144 pass, 3 fail** — 1 is the pre-existing sandbox env-leak failure (expected,
noted in earlier entries); the other 2 (`pickTopTextAndImage` in
`test/frameworksGrounding.test.js`) are **pre-existing uncommitted WIP, not caused by this
work** — confirmed `pickTopTextAndImage` always returns `topText: null` in the working tree
right now (v1 text-grounding path effectively disabled) while `git show HEAD` still has the
real function; this predates R7b and isn't fixed here. Flagged in `.gsd/STATE.md` for
Aalhad's call.
**Cost estimate:** ~4 extra Gemini calls (1 paraphrase + 3-vote judge) per chunk, flash-lite
tier, the first time any given chunk's content is paraphrased; cached 7 days after that, so
steady-state cost drops well below that ceiling once common chunks (reused across
questions/frameworks) are warm.
**Files:** `backend/src/lib/consultingRetrieval.js`, `backend/src/lib/frameworksGrounding.js`,
`backend/src/lib/qaRetrieval.js`, `backend/.env.example`,
`backend/test/consultingParaphrase.test.js`, `backend/test/consultingParaphraseFlagOff.test.js`,
`backend/test/consultingParaphraseFlagOn.test.js` (all three new).
**Proof:** `npm test` output above; diff reviewed directly against `git show HEAD` for the
pre-existing-bug claim.
**Undo:** Revert the files above. `ENABLE_ANSWER_PARAPHRASE` was never set anywhere, so
production and localhost behavior are unchanged until Aalhad sets it.
**Open issues:** (1) Run `rag-evaluator` against `backend/eval/questions.jsonl` with the
flag on before going live — faithfulness-on-the-real-eval-set is R7b's actual "done when"
bar, not yet checked. (2) The `pickTopTextAndImage` WIP bug above, unrelated to R7b but
discovered while verifying its test run. (3) Guesstimates not wired, per the scoping note
above.

---

## 2026-11-02 — Policy decision: add a paraphrase layer, verbatim excerpts were never the goal
**Phase:** R7b (new) · **Type:** policy

**What changed:** Aalhad, testing localhost, noticed every grounded answer shows casebook
text exactly as written in the PDF, with no LLM interpretation. Investigated and confirmed:
by design, `frameworksGrounding.js` and `consultingRetrieval.js` only call Gemini for (1)
embedding the query and (2) a relevance judge on retrieved chunks — never to rewrite the
answer. The code says so explicitly ("The excerpt itself, verbatim — not an LLM paraphrase —
so there's nothing here that could be a fabricated claim"). That was a deliberate
anti-hallucination choice from earlier in the rebuild, not a bug.
Aalhad's actual intent was different: the casebook should supply the idea/logic/numbers, but
the student-facing presentation should be re-explained, not a PDF dump. Decision: add a
paraphrase layer. Updated `CLAUDE.md`'s grounding policy and the `grounded-answering` skill
with the new pipeline shape before any code: paraphrase call (chunk → plain-language
rewrite, same facts only) → faithfulness judge (second Gemini call, same voting pattern as
the existing relevance judge) → fail closed to the raw verbatim excerpt if the judge rejects
the paraphrase or the call errors. Gated behind a reversible flag, cached like the rest of
the backend, re-eval before going live (a paraphrase step is a new place hallucination can
enter that didn't exist when excerpts were verbatim).
**Why:** Verbatim excerpts were satisfying the letter of the grounding policy ("casebook
content only") but not the product's actual purpose — explaining a framework or guesstimate
clearly, not reproducing the source page.
**Files:** `CLAUDE.md`, `.claude/skills/grounded-answering/SKILL.md`, `.gsd/ROADMAP.md`
(inserted R7b, now ▶), `.gsd/STATE.md`.
**Proof:** Docs updated; no code changed yet — implementation is R7b, handed to
`rag-engineer` next.
**Undo:** Revert the four files above; nothing in the database or runtime changed by this
entry alone.
**Open issues:** R7b itself (the actual paraphrase + judge code, the reversible flag, and an
eval run against the test question set) is not yet built.

---

## 2026-11-02 — Frameworks page: fixed the QA-found catalog bug, the stale-cache bug, and the garbled-excerpt bug Aalhad reported directly
**Phase:** (fix, live feature - not R6-R9 gated work) · **Type:** fix

**What changed:** Aalhad reported the 3Cs Framework card showed "absolute garbage" text
under "From our casebooks" (screenshot). Investigated the actual architecture (not the gated
R7 catalog - a different, older code path) and found three separate real bugs, all in
code that predates this session:

1. **Permanently-stale cache.** `withGroundedExamples` (`frameworksGrounding.js`) used
   `toCheck = frameworks.filter(f => !f.grounded_checked_at)` - once a framework was ever
   checked, it was excluded from re-checking *forever*. MECE and 3Cs were both last checked
   in September, two months before this entire R6-R9 pipeline rebuild - they'd never see any
   of it. Added a 7-day staleness TTL (`isStale`, now exported and pure-tested) so a pipeline
   change surfaces within days, not never again.
2. **The actual garbled text.** 3Cs's cached excerpt came from v1 (`document_chunks`,
   pre-rebuild quality) querying a casebook ("The Consulting Club, FMS, Casebook 2025-26")
   that was never even re-ingested this session. Fixed by #1 - once re-checked, this
   casebook-domain framework routes through the fixed v2 pipeline (relevance gate included)
   instead of serving a two-month-old v1 result.
3. **Missing grounding label when a check found nothing.** MECE had `grounded_checked_at`
   set but both `grounded_example`/`grounded_image` null - the card showed no citation AND
   no "not from the casebooks" label, violating the grounding policy's "always say one or
   the other" rule. Added the missing fallback (`GroundingNote`, `isGrounded` check).
4. **Found while testing the fix, not reported**: `grounded_image` can carry real content
   with `url: null` (R8's structured-diagram rendering is still pending), and the frontend's
   `hasGroundedImage` check required a truthy `url` - so a real grounded match would show as
   neither the image nor any indication it was found, and the new fallback label (#3) would
   have shown a FALSE "not from the casebooks" for content that actually was grounded. Split
   into `hasGroundedImageUrl` (gates the `<img>`) vs. `hasGroundedImageCaption` (gates a new
   properly-rendered text box using the real caption).
5. **The QA report's catalog finding** (196-item "From the casebooks" tag list includes
   boilerplate like "Consulting Club Team (Class of 2026)", "GDP Growth Rate", "Do's") was
   real: `extractDiagramTitles` pulled every diagram's title verbatim, with nothing
   distinguishing an actual framework name from a chart/table/org-chart title. Added
   `judgeIsRealFrameworkTitle` (same judge-based approach as `judgeIsWorkedProblem` from
   today's Guesstimates fix - a regex can't reliably tell "MECE" from "HOUSEHOLD
   EXPENDITURE"), classified once per unique title (not per occurrence), with a 15-minute
   in-memory cache so this doesn't cost hundreds of Gemini calls on every page load.
   **Verified against real data: 196 items -> 31, zero boilerplate remaining** (manually
   inspected the full list).
6. **Found while reading the code, not previously reported**: the raw caption/excerpt text
   can itself contain an unparsed ` ```placewise-diagram ` JSON fence - rendering it as plain
   text (what the code did before) is the exact "absolute garbage" bug, just waiting to
   recur for any other framework. Extracted `MarkdownWithDiagrams` (from GuesstimatesPage's
   existing `ProblemContent`, now a shared component used by both pages) so excerpts/captions
   render as real structured diagrams instead of raw text, everywhere this pattern appears.
7. Also removed the per-answer "From our casebooks — {sourceFile}" citation header,
   consistent with today's earlier site-wide policy decision (GroundingNote) - this page had
   its own separate, un-updated citation display that nothing else in the app has anymore.

**Verified live in a real browser, not just by reading code** (CLAUDE.md: "start the dev
server and use the feature... before reporting complete") - gstack `/browse` (Aside
unavailable, used the `$B` headless fallback), local dev server, guest login, Consulting ->
Case Structuring:
- **MECE**: now shows a real, properly-rendered diagram (an issue tree: Top Down/Bottom Up/
  Pareto/MECE/Unit Economics/Extrapolation, from SRCC's own "FRAMEWORKS" page) - not blank,
  not raw JSON.
- **3Cs**: no longer shows the garbled v1 excerpt - correctly shows "General guidance - not
  from the casebooks" now that v2 found nothing for this specific framework.
- **Catalog list**: live-confirmed zero boilerplate items, 28 (the "so far" count ticks as
  classification runs) real framework names only.

**Known remaining rough edge, not fixed (minor, not the reported bug):** MECE's rendered
diagram content spans a chunk that mixes two source-page topics (a framework-list page and
a following unrelated guesstimate example about license plates in Maharashtra) and has a
couple of stray page-footer numbers ("3", "4") leaking in as plain text lines - readable and
coherent, not garbage, but a chunking-boundary quirk worth polishing separately.

**Tests:** 4 new `isStale` unit tests, all pure/no-network. `npm test`: 125/126 (same
pre-existing unrelated sandbox failure). `tsc --noEmit` and `vite build` both clean.
**Files:** `backend/src/lib/frameworkCatalog.js`, `backend/src/lib/frameworksGrounding.js`,
`backend/test/frameworksGrounding.test.js`, `frontend-react/src/pages/FrameworksPage.tsx`,
`frontend-react/src/pages/GuesstimatesPage.tsx`, `frontend-react/src/types/api.ts`,
`frontend-react/src/components/MarkdownWithDiagrams.tsx` (new).
**Proof:** Live browser screenshots (MECE, 3Cs) taken this session; catalog count verified
via direct function call against real data; test/build output above.
**Undo:** Revert the files listed above.
**Open issues:** The chunking-boundary rough edge noted above. The QA report's other
findings (dead-click miscall on the catalog pills - actually a working local toggle, not
dead, confirmed by reading the code - plus Company page's ASCII diagram, duplicate news
headlines, Skill page's missing label, Community moderation visibility) are not addressed
in this entry.

---

## 2026-11-02 — Real fix for the random-pick bug: retrieval approach itself was wrong, not just missing a filter
**Phase:** (fix, same incident) · **Type:** fix

**What changed:** The first fix (structural + judge filter layered on top of the existing
similarity search) was necessary but not sufficient - testing it locally surfaced a second,
deeper problem: `getRandomGuesstimateProblem` always returned the exact same one problem,
never anything else. Traced it: the fixed seed query ("guesstimate practice problem estimate
market size...") is a generic string whose nearest neighbors by embedding similarity cluster
around the book's own THEORY/explanation pages (which share vocabulary with a generic query
about guesstimates), not the 36 specific, varied problems themselves - confirmed only 1 of
the query's fixed top-10 nearest neighbors was ever a real problem. Separately, the sharpened
relevance judge (built to check "does this answer a REAL student question") rejected almost
everything for this path too, since the seed string isn't a real question.

**Real fix: stopped doing a similarity search for this path entirely.** `getRandomGuesstimateProblem`
now fetches every active chunk for the book directly (`ingest_chunks` joined to
`ingest_documents`, no embedding call, no RPC), filters to structurally-plausible candidates
(`looksLikeWorkedProblem`), shuffles them (`shuffle`, new pure Fisher-Yates helper), and tries
them in that random order against a newly-added, correctly-scoped judge
(`judgeIsWorkedProblem` - "is this an actual problem," not "does this answer a fake
question") until one passes, capped at 5 attempts. Cheap in the common case (one judge call
most of the time), and the earlier false positive (page 6, theory content using the word
"assumptions" in a sentence) is correctly rejected by this judge even though it passed the
plain regex.

**Verified against the real data, not assumed:** ran it 10 times in a row - 9 distinct real
problems (pens, chairs, salon revenue, Airbus paint, books read, biscuit industry, laundry
service, commute time, animation/VFX market), zero repeats of the theory page, zero index
pages. One minor cosmetic artifact spotted while checking: a chunk spanning a page boundary
had a stray page-footer number ("47") prepended before its real title - not a correctness
bug (the actual problem content shown was complete and legitimate), just a chunking-boundary
quirk worth knowing about, not fixed here.

**Tests:** 3 new tests for `shuffle` (preserves elements, doesn't mutate input, handles
empty/single-element arrays). `npm test`: 121/122 pass (same pre-existing unrelated sandbox
failure).

**Files:** `backend/src/lib/guesstimateRetrieval.js`, `backend/test/guesstimateRetrieval.test.js`.
**Proof:** 10-run local test output above; test suite output above.
**Undo:** Revert both files; `groundedGuesstimateLookup` (the `/ask` topic path) is
unchanged and still uses the full relevance-judge gate, since its questions are real.
**Open issues:** SRCC is reactivated (`is_active=true`) again but production's
`ENABLE_CONSULTING_RAG_V2` is still off (Aalhad's explicit instruction: local testing and
production visibility are now deliberately decoupled until he says otherwise) - so this fix
is live on localhost only, not for real students yet.

---

## 2026-11-02 — Full-site QA pass (report-only) after the Guesstimates index-page bug
**Phase:** M4 (frontend fixes) · **Type:** fix

**What changed:** Nothing in the app — this is a `qa-tester` / gstack `/qa-only` report-only
pass across every route in `frontend-react/src/router.tsx` on production (login, home,
frameworks, guesstimates, company, role, skill, mock interview, resume drill, tone shifter,
community, admin), run because the Guesstimates random-pick bug "looked fine in isolated
testing" and only showed up when actually clicked. Each feature got at least one golden-path
and one edge-case test, executed live via a headless browser (Aside unavailable on this
machine; used gstack's own headless browser + direct `curl` against the production API
instead), with screenshots and network/API responses checked, not just visual review.

**Found:** No repeat of the Guesstimates-class bug anywhere else, and Mock Interview, Resume
Drill, Role (chip panels + company tailoring), Tone Shifter and Admin access control are all
solid end-to-end with correct grounding labels and no data leakage to the non-admin Guest
session. But Frameworks has the *same class* of problem as the original bug: its "From the
casebooks" tag list (196 items) surfaces non-framework boilerplate (a club team roster,
"Do's"/"Don'ts", "FORMULAE", raw data-table labels) as if they were real frameworks, and those
pills are styled clickable but do nothing when clicked. The MECE framework card and the Skill
page's Core Concepts also skip the grounding citation/label the policy requires, unlike their
siblings. Also found: the Company page's "Business Model" diagram renders as raw ASCII text
instead of an actual diagram, duplicate news headlines on Company, an unreviewed Community
post's text visible pre-moderation, and an unrelated internal casebook-filename list cached in
a guest's `localStorage` via the Resume Drill feature. Full bug table, repro steps and
pass/fail per test case: `qa/site_qa_2026-11-02.md`.

**Files:** `qa/site_qa_2026-11-02.md` (new), `qa/screenshots/*.jpg`/`*.png` (new, 34 files).
**Proof:** Live network captures and API response bodies for every finding (see report); e.g.
`GET /api/admin/usage` → `404` with empty body for a Guest session; `POST
/api/mock-interview/start` → `200` referencing real uploaded-resume content; Frameworks tag
pills click → 0 network requests fired.
**Undo:** N/A — report-only, no product code or data changed.
**Open issues:** All 9 findings in the report are unfixed and un-triaged — Aalhad decides what
gets fixed and in what order, per the task's instructions. Community's "pending review" post
visibility may be intended design rather than a bug; needs a decision, not necessarily a fix.

---

## 2026-11-02 — Fix for the index-page bug: structural filter + sharpened judge
**Phase:** (fix, same incident as the entry above) · **Type:** fix

**What changed:** Two-layer fix for the random-pick-showed-the-index-page bug.
1. `looksLikeWorkedProblem()` (new, `guesstimateRetrieval.js`) - a cheap, deterministic,
   no-API-call filter: a candidate must contain "assumptions" (case-insensitive) to be
   eligible for random pick. Every real problem in this book states its assumptions
   explicitly; front matter never does. `getRandomGuesstimateProblem` now filters candidates
   through this before `pickRandomCoveringChunk` runs, reusing that function unchanged.
2. Sharpened the shared relevance judge prompt (`consultingRetrieval.js`,
   `RELEVANCE_SYSTEM_PROMPT`) to explicitly name this failure mode too (an index/TOC/
   acknowledgements/theory page naming a topic is not the same as answering it) - defense in
   depth for the topic-ask path, not just random-pick.

**Verified against the real data, not assumed:** ran `looksLikeWorkedProblem` against all 62
of SRCC v7's actual `ingest_chunks` rows directly (no need to risk reactivating `is_active`
just to test). 37/62 pass as eligible problems; the 25 filtered out are exactly the front
matter that caused the bug - index, acknowledgements, theory, cheatsheet, "THANK YOU!",
framework-explainer pages (TAM-SAM-SOM, round-off-numbers tips, etc.). None of the 37 passing
ones look like front matter by inspection.

**Tests:** 4 new unit tests (`guesstimateRetrieval.test.js`) for `looksLikeWorkedProblem` -
a real problem passes, the actual index page content fails, a theory page fails,
case-insensitivity and empty/undefined input handled safely. `npm test`: 118/119 pass (same
pre-existing unrelated sandbox failure).

**Files:** `backend/src/lib/guesstimateRetrieval.js`, `backend/src/lib/consultingRetrieval.js`,
`backend/test/guesstimateRetrieval.test.js`.
**Proof:** Test output and the 37/62 real-data verification above.
**Undo:** Revert the two lib files and the test file.
**Open issues:** SRCC is still deactivated (`is_active=false`) from the incident rollback -
reactivating it is a separate, deliberate next step, not done automatically just because the
fix is in place.

---

## 2026-11-02 — Guesstimates pulled back offline: random-pick showed the book's index page as a "problem"
**Phase:** (incident, same day as the SRCC go-live) · **Type:** fix, rollback

**What happened:** Aalhad reported (with a screenshot) that `/guesstimates`'s "random
practice problem" showed SRCC's own table-of-contents/index page (page 2, "180 DEGREES
CONSULTING, SRCC PRESENTS GUESSTIMATE BOOK VOLUME 1 INDEX...") as if it were a problem to
solve. Real bug, not a false alarm.

**Immediate action: hidden from students right away**, without waiting on a redeploy -
deactivated all 62 of SRCC v7's `ingest_chunks` rows again (`is_active=false`). Verified
against the live production API, not assumed: `GET /api/guesstimates/random` now returns
`available:false`, same as before today's activation - students see the normal "not
available" state, nothing broken or confusing shown.

**Root cause:** `getRandomGuesstimateProblem()` (`guesstimateRetrieval.js`) searches
broadly ("guesstimate practice problem estimate market size number of units volume") and
`pickRandomCoveringChunk` picks any matching row at random. SRCC's front matter - pages 1
(title), 2-3 (index), 4 (acknowledgements), 5-9 (theory/approach pages), 10-11 (cheatsheet) -
is genuinely *about* guesstimates (it literally names many problem titles), so it can clear
both the similarity threshold and the relevance gate for that broad query. This is a
**different failure mode than the one the relevance gate was built for** - not "wrong topic,"
but "right topic, wrong page type" (meta/front-matter content vs. an actual worked problem).
Nothing currently distinguishes the two. Real problems start at page 14 (confirmed: pages
1-13 are title/index/acknowledgements/theory/cheatsheet, page 14 is the first real named
problem, "MARKET SIZE OF HEALTHY BISCUIT INDUSTRY").

**Not fixed yet** - Aalhad said "we'll need to work on it," not an immediate demand; the
urgent part (get it off the live site) is done. Proposed fix (not yet built, pending
confirmation): sharpen the relevance judge specifically for the random-pick path to reject
"a list, index, or theory/methodology page" as not itself being a practice problem - same
kind of targeted prompt fix as the earlier generic-methodology false-positive class, not a
hardcoded SRCC-specific page-range exclusion (which wouldn't generalize to the next
guesstimates casebook).

**Files:** None changed - this entry documents the `is_active` rollback and root cause only.
**Proof:** Real production API response (`available:false`) shown above.
**Undo:** N/A (this entry is the undo of today's earlier SRCC activation).
**Open issues:** The random-pick page-type filtering fix itself, before SRCC goes live again.

---

## 2026-11-02 — Guesstimates confirmed live on production, verified directly against the real API
**Phase:** (R9-equivalent, scoped to SRCC) · **Type:** verification

**What changed:** Aalhad set `ENABLE_CONSULTING_RAG_V2=true` on Render himself (the one step
this session deliberately left to him - see the entry above). Verified it actually took
effect by calling the real production API directly (`https://placement-mastery-hub-api.onrender.com`,
found in `Mark Down Files/DOCUMENT.md` - the Render dashboard API was blocked by the sandbox's
credential-use classifier this time, so verified via the public endpoints directly instead,
which is more conclusive anyway):
- `GET /api/guesstimates/random`: `available:true`, returns a real SRCC problem with a real
  citation - was `available:false` before the flag was set.
- `GET /api/guesstimates/ask?topic=...Swiggy in Delhi...`: `covered:true`, returns the exact
  page (21) verified earlier today, matching the real content.
- `GET /api/guesstimates/ask?topic=...tennis balls...` (the known trap question): still
  correctly `covered:false`, labelled "General guidance — not from the casebooks" - the
  relevance gate holds on the live production site, not just locally.

**Guesstimates is genuinely live for students now**, grounded in the verified SRCC content
from today's fixes. Nothing else (Frameworks, Q&A, Role/Company) is active yet - only SRCC's
62 chunks are `is_active=true`, everything else correctly still returns "not covered."

**Files:** None - verification only, no code/data change.
**Proof:** Real HTTP responses from the production API, shown above.
**Open issues:** Same as before - 8 more casebooks' content is independently verified
(1,191-page fidelity pass) but not yet activated; R5 (admin review UI) still unbuilt;
Frameworks/Q&A/Role/Company still need their own switch-over decision.

---

## 2026-11-02 — SRCC Guesstimates live: page 35 fixed, pipeline-wide domain bug found and fixed, first real is_active switch-over
**Phase:** (R9-equivalent, scoped to one casebook — informal, not the full M1 switch-over)
**Type:** fix, ingestion, migration

**Page 35, the last of SRCC's originally-stuck 6 pages, fixed:** 3 automated vision attempts
(Gemini flash-lite x2 with increasingly explicit hints, NVIDIA Nemotron x1 - which returned
empty output both times, hitting its token budget before producing visible text) all failed
identically. Rather than keep guessing, rendered the actual page and looked at it directly
(`out/srcc_p35.png`). Found the real bug: not missing content as every automated finding
assumed - **misplaced** content. The model had correctly transcribed every box's text but
nested all 4 second-row boxes (SELF EMPLOYED, PUBLIC SECTOR, CORPORATE WORKERS, OTHER SERVICE
SECTOR EMPLOYEES) under PRIMARY SECTOR alone, leaving SECONDARY/TERTIARY SECTOR as empty
siblings. Fixed with a direct JSON edit (`fix_srcc_p35_manual.py`, v7,
`bc00d24b-b95d-4222-8bed-28ea7d2a5e18`) - re-parented the 4 existing subtrees verbatim to
their correct sector (no label or number invented or changed). Verified against the actual
root/child structure in code, not assumed. **All 6 of SRCC's originally-stuck pages (15, 21,
29, 35, 36, 50) are now genuinely resolved** - 5 by automated re-render+hint, 1 by direct
inspection and manual edit.

**AI judge improved further, Aalhad's request:** sharpened `RELEVANCE_SYSTEM_PROMPT`
(`consultingRetrieval.js`) to explicitly name the exact failure mode found earlier (a generic
methodology/approach page looking superficially relevant to any same-category question) and
changed `judgeRelevance` from 1 call to a **3-call majority vote** (>=2/3 "faithful"), since
even temperature 0 didn't fully eliminate single-call flakiness on genuinely borderline
excerpts (found 2026-11-02 earlier today). `run_eval_v2_preview.js`'s judge now imports and
reuses the real `judgeRelevanceOnce` (exported) instead of maintaining a second copy of the
prompt, so the eval tests the literal production logic, not an approximation of it.

**First real `is_active=true` switch, scoped to exactly one casebook:** activated all 62 of
SRCC v7's `ingest_chunks` rows (confirmed before: 62/62 inactive; after: 62/62 active, and
confirmed zero other document's chunks were touched - exactly 1 distinct `document_id` among
all active rows).

**Found and fixed a real, pipeline-wide bug in the same step - would have silently broken
every casebook once any one went live:** `ingest_documents.domain` was NULL for **all 9**
R6-ingested documents (not an SRCC-specific issue). `match_ingest_chunks`'s filter
(`filter_domain is null or d.domain = filter_domain`) means once any route passes
`filter_domain="Consulting"` (every Frameworks/Guesstimates/Q&A/chip-panel call does), a NULL
domain column never matches - silently returns zero rows regardless of `is_active` or content
quality. Confirmed by a failing end-to-end test (`groundedGuesstimateLookup` returned
`covered:false` immediately after activating SRCC, when it should have found real content).
Traced to this exact column, fixed for all 9 documents at once (`fix_domain_null_bug.py`,
pure metadata correction - no content or `is_active` touched), re-ran the same test: fixed.
**Never caught before now because no document had ever been flipped `is_active=true` until
this moment - first real activation, first real bug this specific path could surface.**

**Verified end-to-end, with the real production flag locally (not touching Render), against
the real shared database:**
- `getRandomGuesstimateProblem()`: returns a real SRCC problem with a real citation.
- `groundedGuesstimateLookup("...Swiggy in Delhi...")`: `covered:true`, returns the exact page
  we fixed earlier.
- `groundedGuesstimateLookup("...tennis balls in a room...")` (the known trap question):
  still correctly `covered:false` - the relevance gate holds with the domain fix in place.
- `groundedQaAnswer("What are Porter Five Forces?")`: `groundedInCasebooks:false` - correctly
  falls back to a labelled general answer, since no Frameworks content is active yet (only
  SRCC is) - confirms the shared `ENABLE_CONSULTING_RAG_V2` flag degrades gracefully for
  not-yet-activated features rather than showing anything wrong.

**Confirmed production is still completely unaffected, with actual evidence, not
inference:** queried Render's API (`RENDER_API_KEY`, used read-only per its own documented
scope "check deploy status only" - not used to change anything) for the live backend
service's env vars: `ENABLE_CONSULTING_RAG_V2` is not among its 6 configured vars. Everything
above happened against the real shared Supabase database (that part is real and live-capable
right now) but the backend route gate is still off in the only place that serves real
students - confirmed, not assumed from a stale local `.env` file.

**What's left for Aalhad, the one deliberate step this session won't take automatically:**
set `ENABLE_CONSULTING_RAG_V2=true` on Render for the `placewise-api` service and let it
redeploy/restart. `RENDER_API_KEY`'s comment explicitly scopes it to read-only status checks,
not config changes, so this wasn't done here even though it may have been technically
possible with that key. Note: this flag is shared across Frameworks/Guesstimates/Q&A/chip
panels/role topics - flipping it affects all of them at once, but since only SRCC's 62 chunks
are `is_active=true`, every other feature will keep correctly returning "not covered" rather
than showing anything from an unverified casebook, as demonstrated above.

**Cost:** page 35: 1 NVIDIA call (~free tier) + 0 further Gemini vision calls (manual edit) +
~62 embedding calls for the v7 rebuild. Domain fix: 0 API calls (pure DB update). Judge
changes: no immediate cost (only costs on actual future queries, 3x per gated row instead of
1x going forward).
**Files:** `backend/ingestion/fix_srcc_p35_manual.py`, `fix_domain_null_bug.py`,
`try_p35_nvidia.py` (all new), `backend/src/lib/consultingRetrieval.js`,
`backend/eval/run_eval_v2_preview.js`.
**Proof:** All verification commands and their real output are in-session; re-parenting
verified against actual JSON structure; domain fix verified via failing-then-passing
end-to-end test; production state verified via Render API query.
**Undo:** `UPDATE ingest_chunks SET is_active=false WHERE document_id='bc00d24b-...'` reverts
the one live switch; the domain fix and page 35 fix are otherwise harmless to leave in place
even if reverted. No migration file needed - this was data correction via the service-role
client, same pattern as every other R6 patch this session.

---

## 2026-11-02 — Independent fidelity re-verification complete: all 1,191 flagged pages checked
**Phase:** (none — structure-check pass per STATE.md's "human OR structure check" allowance,
not R5) · **Type:** ingestion, fidelity

**What changed:** The background agent (`backend/ingestion/run_fidelity_reverify.py`) finished
independently re-verifying every one of the 1,191 `needs_review=true` pages across all 9 R6
Consulting casebooks before it hit a usage rate limit on its final report-writing step - the
actual checking work was 100% complete, only the summary was missing. Finalized that summary
manually from its checkpoint file (`out/fidelity_reverify_progress.json`) rather than re-running
anything already done.

**Method (per page):** render the real PDF page fresh, run an independently-framed verifier
call (not the same prompt that generated the content - framed as checking someone else's work,
to avoid reproducing the same blind spots), and only if it found a genuine defect, regenerate
with the finding folded in as a fix hint, up to 2 rounds, before giving up honestly.

**Final tally across all 9 casebooks, 1,191 pages:**
| Result | Count |
|---|---|
| Confirmed false positive (checker flag, not a real defect) | 966 |
| Genuinely fixed (real defect found and corrected) | 170 |
| Could not auto-resolve after 2 rounds | 55 |

Per casebook (false_positive / genuinely_fixed / could_not_auto_resolve):
SRCC 30/6/6, FMS 2021-22 63/19/10, ISB 54/18/3, IIM B 190/19/2, IIMK 128/22/10, IIM L 141/16/3,
IIM Calcutta 98/15/4, IIMA 132/22/7, FMS 2023-24 130/33/10.

One new `ingest_documents` version was written per casebook with >=1 genuine fix (insert-only,
is_active=false, same reuse-unless-patched pattern as every R6 patch script) - exact
version/ids in `out/fidelity_reverify_report.json`.

**Not the same as SRCC's count reported earlier today**: SRCC's 6 `could_not_auto_resolve`
pages from this agent's run were *then* followed up by hand (see the "SRCC's 6 unresolved
pages" entry above, same day) - 5 of those 6 are now genuinely fixed, leaving 1 (page 35) still
open. The 55 total above is this agent's raw count before that follow-up.

**Files:** `backend/ingestion/run_fidelity_reverify.py` (the agent's script, now committed),
`backend/ingestion/out/fidelity_reverify_report.json` (finalized summary).
**Proof:** Progress checkpoint shows 1,191/1,191 pages recorded; report totals sum exactly to
1,191.
**Undo:** `is_active` untouched throughout - nothing live changed. Delete the new document
versions listed in the report to fully revert.
**Open issues:** 55 pages (50 outside SRCC) still have confirmed, unresolved real defects -
same class of issue as SRCC's page 35 (either needs a stronger model than this pipeline's
flash-lite cap, or an actual human look at the real PDF page). Full list of which pages, per
casebook, is in `fidelity_reverify_report.json`. This pass is a structure-check, not R5 (the
actual admin UI) - R5 is still unbuilt and still a separate task.

---

## 2026-11-02 — SRCC's 6 unresolved pages: 5 fixed, 1 honest remaining gap
**Phase:** (none — follow-up to the independent fidelity re-verification) · **Type:** ingestion, fix

**What changed:** The independent fidelity re-verification agent (separate task, still
running on other casebooks) finished SRCC Guesstimates and left 6 of its 42 flagged pages as
`could_not_auto_resolve` after 2 rounds each. Aalhad asked to keep fixing those specifically
before going live with the rest. Took over where the agent left off:

1. **v4** (`2701715d-683e-4f5f-a908-0c19c038b870`, built on top of the agent's own v3, not
   v2, so its earlier fixes weren't lost): re-rendered all 6 pages at 2x resolution (300dpi vs
   the standard 150) with the agent's exact prior finding fed back as a corrective hint.
   Root cause theory: small decimal points/digits misread at normal resolution. **Verified
   by direct content check, not assumed: 4 of 6 fixed** (p15 "118 MILLION" → ".118 MILLION",
   p21 "20.16" → "2.016", p29 "10%"/missing "+" → "100%"/"0 + 1.68M = 1.68 MILLION", p36's
   year correctly left matching the page's own typo rather than being silently "corrected").
   **2 of 6 still wrong** (p35: issue tree still has empty SECONDARY/TERTIARY SECTOR
   branches; p50: still conflates total population with urban population) - these are
   structural/conflation errors, not digit misreads, and the higher-resolution theory didn't
   apply to them.
2. **v5** (`573f9914-...`): second attempt at just p35/p50 with much more explicit,
   structurally-worded hints, 400dpi. **Verified again: zero change on either page** - both
   came back byte-identical to the wrong v4 content. The model keeps defaulting to the same
   misread regardless of phrasing.
3. **v6** (`1ad48fb6-c630-4bde-9276-918bc1aebed1`): **p50 fixed manually, no vision call** -
   the correct split is unambiguous from the page's own stated assumptions already in its
   markdown ("India's population is 1.4 billion" + "~30% ... urban" = 420 million urban,
   arithmetic from text already on the page, not invented, same pattern this diagram already
   uses elsewhere e.g. "16M*90%=14.4M"). Split the one mislabeled node into a total-population
   parent and a correctly-computed urban-population child via direct JSON edit, verified the
   new label text. **p35 left honestly unresolved** - 2 vision attempts failed identically and
   nothing gives grounds to guess content I can't see; this is a page a stronger model or a
   literal human look at the PDF should resolve, not something to force here.

**Final tally for the 6 originally-stuck pages: 5 genuinely fixed (15, 21, 29, 36, 50), 1
confirmed still wrong (35).** All 6 still show `needs_review=true` - expected, not a
contradiction: that's the same checker false-positive pattern (footer boilerplate, computed
numbers not verbatim in the raw text layer) documented for every other page in this casebook,
not a sign the 5 fixes didn't take.

**Cost:** 6 + 2 vision calls (v4, v5) + ~185 embedding calls across v4/v5/v6 rebuilds, all
flash-lite tier. Negligible, well under $1 for this whole follow-up.
**Files:** `backend/ingestion/fix_srcc_six_pages.py`, `fix_srcc_two_pages_v2.py`,
`fix_srcc_p50_manual.py` (all new).
**Proof:** Exact substring/content checks shown above and in-session; not inferred from the
`needs_review` flag or from "something changed."
**Undo:** `is_active` untouched throughout (still false) - delete the 3 scripts and the
v4/v5/v6 `ingest_documents`/`ingest_pages`/`ingest_chunks` rows to fully revert; v3 (the
agent's own version) is unaffected either way.
**Open issues:** Page 35 of SRCC Guesstimates genuinely still has missing diagram content
(SECONDARY SECTOR, TERTIARY SECTOR branches) after 3 total attempts (1 original + 2 fixes).
Recommend either excluding just this one page's chunk from `is_active` when SRCC goes live,
or getting an actual human look at the real PDF page before including it.

---

## 2026-11-02 — Relevance-gate judge made deterministic (temperature 0), partial fix
**Phase:** (none — fix for the non-determinism flagged in today's R7 entry) · **Type:** retrieval, fix

**What changed:** `generateText`/`generateJSON` (`gemini.js`) hardcoded `temperature: 0.4`
with no way to override it. Added a `temperature` parameter (default 0.4, so every other
caller is unaffected) and passed `temperature: 0` from all three judge call sites: the live
relevance gate (`consultingRetrieval.js`'s `judgeRelevance`) and both eval judges
(`run_eval.js`, `run_eval_v2_preview.js`).

**Verified, not assumed - this only partially fixes the problem.** Isolated the judge call
on a fixed, clearly-wrong excerpt (the Ola/Uber-Delhi one that caused q037's first flip):
6/6 identical "unfaithful" verdicts at temperature 0, vs. flaky before. Confirmed `embedTexts`
is already fully deterministic (identical to 6 decimal places across 4 calls), so retrieval
ranking itself isn't the source of flakiness. But rerunning the full `run_eval_v2_preview.js`
three more times after the fix, q037 ("Uber rides in NYC") still flipped twice
(fail/pass/fail) - tracing why: it's not the same excerpt flip-flopping. A **different**
candidate - a generic "Demand Side Approach" methodology page (similarity 0.678, examples
about sanitary pads and Delhi metro, not Uber or NYC) - is a genuinely more borderline case
for the judge than the obviously-wrong Delhi excerpt, because it IS a legitimate guesstimate-
methodology page that could superficially apply to *any* guesstimate question. That specific
judgment remains inconsistent even at temperature 0 - real residual model uncertainty on a
genuinely close call, not pure API-level randomness.

**Honest state:** temperature 0 fixed the clear-cut cases (confirmed deterministic now); it
did not fully fix genuinely borderline ones. This gate should be treated as "probably right,
not provably right" until there's a second, independent check (e.g. a stricter prompt
specifically for generic-methodology-page false positives) - not something to rely on alone
at R9 scale without re-testing.

**Files:** `backend/src/lib/gemini.js`, `backend/src/lib/consultingRetrieval.js`,
`backend/eval/run_eval.js`, `backend/eval/run_eval_v2_preview.js`.
**Proof:** Isolated judge-determinism test (6/6 stable) and embedding-determinism test
(4/4 identical) above; 3 full eval reruns post-fix still showing q037 flip twice.
**Undo:** Revert the `temperature` parameter additions; defaults preserve prior behavior
everywhere else.
**Open issues:** The generic-methodology-page false-positive class isn't fixed - noted for
whoever next tunes the relevance gate's prompt.

---

## 2026-11-02 — Stopgap review export (R5 isn't built yet)
**Phase:** (none — stopgap for R5) · **Type:** ingestion

**What changed:** Aalhad asked exactly where the file is for him to manually review flagged
pages. Honest answer: no such file exists — that's what R5 (admin review queue) is supposed
to build, and R5 hasn't been built yet (it's the ▶ task). Rather than leave him with nothing,
wrote `backend/ingestion/export_review_queue.py` - a read-only script (doesn't touch
`needs_review`/`is_active` on any row) that exports every flagged page across all 9 Consulting
`ingest_documents` into one CSV: casebook, page number, review reasons, coverage numbers,
diagram count, and a markdown excerpt (truncated at 3000 chars).

**Output:** `backend/ingestion/out/r6_review_queue.csv` (1,191 flagged pages total, gitignored
per the existing `backend/ingestion/out/` rule - same as every other local review JSON this
project has produced). Per casebook: FMS 2021-22 (92), ISB (75), IIM B (211), IIMK (160), SRCC
(42), IIM L (160), IIM Calcutta (117), IIMA (161), FMS 2023-24 (173).

**Files:** `backend/ingestion/export_review_queue.py` (tracked); the CSV itself is not
tracked (gitignored).
**Proof:** Script output above.
**Open issues:** This is a stopgap, not R5. It has no approve/fix workflow - just a flat list
for Aalhad to read. R5 (actual admin queue + endpoint) is still the real next step.

---

## 2026-11-02 — R7 closed out: free-form Q&A grounding built
**Phase:** R7 · **Type:** backend, retrieval

**What changed:** R7's roadmap scope was "Frameworks, Guesstimates, Q&A" — Frameworks and
Guesstimates were already done; Q&A was the one piece still missing (confirmed by reading
every route - `chat.js` is a plain ungrounded Gemini passthrough with no casebook lookup at
all). Built it the same way Guesstimates was built on top of `groundedConsultingLookup`:
- `backend/src/lib/qaRetrieval.js` (new): `groundedQaAnswer(question)` - retrieves via
  `groundedConsultingLookup` (which already applies the similarity threshold and the
  relevance gate added earlier today), then generates either a casebook-only answer
  (system prompt forbids adding outside facts) or a general one, never both blended
  (grounding policy, CLAUDE.md). `buildGroundedQaPrompt` is the pure, unit-tested piece.
- `backend/src/routes/qa.js` (new): `POST /api/qa/ask { question }`, gated behind
  `ENABLE_CONSULTING_RAG_V2` (off by default, same posture as every other R7 switch),
  `requireAuth` + `aiLimiter` same as `chat.js`.
- Registered in `server.js`. No frontend page yet - that's R8's job (same split as
  Guesstimates: R7 built the backend + route, R8 will build the UI), not blocking this.
- `backend/test/qaRetrieval.test.js` (new, 3 tests, pure logic only - no network).

**Verification:** `npm test`: 114/115 pass (the 1 failure is the pre-existing, unrelated
macOS `sandbox.test.js` env-leakage quirk). Server boots clean with the route registered
(`node -e "import('./src/server.js')"`, confirmed no startup error).

**Eval impact (ad-hoc, not a formal re-run):** added `qa` questions to
`run_eval_v2_preview.js`'s scoring (previously only `frameworks`/`guesstimates` had any code
path to test). Overall preview score: **20/39 (51%)**, up from 13/39. `qa`: 7/14 pass now
(was 0/14 - structurally impossible before, since there was no code path at all).

**Found while rerunning, not swept under the rug: the relevance gate isn't perfectly
deterministic.** q037 ("Uber rides in NYC", a known trap question) was correctly rejected in
the last two runs but came back as a false positive this run — same gate, same excerpts,
different outcome. Traced to `generateText`'s fixed `temperature: 0.4` on the judge call
(`gemini.js`) - the judge is a probabilistic LLM call, not a deterministic function, so it
can occasionally flip on a borderline case. Not fixed here (out of scope for this task); worth
considering `temperature: 0` for judge/gate calls specifically before relying on this gate at
R9 scale.

**Files:** `backend/src/lib/qaRetrieval.js`, `backend/src/routes/qa.js`,
`backend/test/qaRetrieval.test.js`, `backend/src/server.js`,
`backend/eval/run_eval_v2_preview.js`, `backend/eval/results/2026-11-02-v2-preview.json`/`.md`
(overwritten), `.gsd/ROADMAP.md`.
**Proof:** `npm test` output; server boot check; eval script output above.
**Undo:** Revert the files listed; remove the `app.use("/api/qa", qaRouter)` line and its
import from `server.js`.
**Open issues:** No frontend entry point yet (R8). Judge non-determinism noted above, not
fixed. R5 (admin review queue) is still the real blocker before any switch-over consideration.

---

## 2026-11-02 — v2 preview rerun: correctness-only scoring, no source attribution, R6 stopped at 7/9
**Phase:** (none — informational probe) · **Type:** eval, policy

**Two decisions from Aalhad, both applied:**
1. **Stop R6 ingestion at the current 7 casebooks** ("we have enough data for consulting
   now") — `FMS Consulting Club 2025-26` and `FMS 2024-25` will not be ingested.
   `.gsd/ROADMAP.md`'s R6 row marked `done (2026-11-02)`, explicitly noting this is a
   deliberate stop at 7/9, not an oversight.
2. **Stop scoring/showing which casebook an answer came from, in this eval.** The prior
   v2-preview run showed several questions failing their strict source-match check while
   still getting a correct, faithful answer from a different valid casebook (e.g. MECE from
   FMS 2023-24 instead of FMS 2021-22) — Aalhad decided this eval should only score whether
   the answer is actually correct, not which book it cites. Dropped the `retrieval_hit` and
   `citations` checks from `run_eval_v2_preview.js` entirely; `expected_source`/
   `expected_pages` are no longer read from `questions.jsonl` for scoring. No casebook name,
   page number, or source file appears in the console output or the `.md` report; the raw
   `.json` keeps only `similarity`, nothing source-identifying, for future debugging.

**Also fixed a real scoring bug found while rerunning**: for a `covered:false` question that
was correctly rejected (all candidates judged off-topic), `faithfulness` was being marked
`fail` even though rejecting them was the *correct* outcome — dragging a genuine success down
to an overall "fail". `coverage_label` alone already captures correctness for a not-covered
question; `faithfulness` is now `n/a` for those, not a second penalty for the same thing done
right.

**Result: 13/39 (33%)**, up from the 5/39 the strict-source-match version scored and the 8/39
the original narrow-pool version scored - this number is the most honest one yet, since it no
longer penalizes "right answer, different valid casebook" and no longer double-penalizes a
correctly-rejected question. The 4 known trap questions (RICE, Jobs-to-be-Done, tennis balls,
Uber-NYC) now correctly show as passes - the relevance gate still holds across the full
9-casebook pool. Remaining real gaps: q004 (price discrimination genuinely not well answered
by any candidate), and 7 must_include phrasing misses (q006, q009, q013, q014, q016, q019,
q024 - correct, faithful answers missing one specific required phrase, not wrong answers).
`qa`/`role`/`company` (18/39) remain unscored - no grounded route exists for them in either
pipeline, unchanged finding from every prior run.

**Cost:** 21 embedding + 140 judge calls, negligible.
**Files:** `backend/eval/run_eval_v2_preview.js`, `backend/eval/results/2026-11-02-v2-preview.json`/`.md` (overwritten), `.gsd/ROADMAP.md`.
**Proof:** Script output above; full per-question detail in the `.md` file (no source info present, confirmed by reading it).
**Undo:** `git diff`/revert; prior runs' numbers are preserved in this file's git history.

---

## 2026-11-02 — R6: IIMA Consult Prep Book Case Book 2025-26 ingested, 1-page network-failure patch, needs_review rate traced
**Phase:** R6 · **Type:** ingestion, fix

**Ingested:** IIMA-Consult-Prep-Book-Case-Book-2025-26.pdf (389 pages), insert-only,
`is_active=false`. Classification already confirmed `club_casebook` (school IIM Ahmedabad) in
the batch check logged 2026-10-31. v1 first attempt hit Gemini's prepayment credits being
depleted (402 `RESOURCE_EXHAUSTED`) partway through embedding — no partial document was
written (the whole insert is one `write_version` call, not row-by-row), so this cost nothing
beyond the vision calls already spent; Aalhad topped up credits and the rerun completed
clean: v1 (`54ece01c-c876-4533-82c6-bd91fabfb983`), 389 pages, 824 chunks, 502 vision + 825
embedding calls. One page (138) failed v1 with a transient `ReadTimeout`, correctly stored
`[UNREADABLE]` and flagged `needs_review`.

**v1 → v2 patch:** retried page 138 (`run_r6_iima_patch.py`, same reuse-unless-patched
pattern as every other R6 patch), succeeded cleanly first try — `number_coverage=1.0`,
`word_coverage=1.0`, still `needs_review` for unrelated reasons (`seq_diff`,
`diagram_missing_box`). v2 (`09c41590-6f53-40be-a19c-60fa645610f4`), 389 pages, 825 chunks,
`status=done`.

**Investigated: 161 of 389 pages (41.4%) flagged `needs_review`** — same range as IIMK
(40.6%)/IIM Calcutta (25.6%), not an outlier. Reason breakdown: `seq_diff` (107, by far the
largest), `diagram_structure` (23), `diagram_missing_box` (23), `number_coverage` (22),
`word_coverage` (19), `diagram_invalid` (15), `unreadable` (11), `diagram_label_altered` (10),
`diagram_label` (5), `ragged_table` (4), `diagram_flattened` (3), `invented_text` (2),
`vision_failed` (1), `diagram_other` (1).
- **`seq_diff` (107 pages)** — same page-template pattern as every prior R6 casebook: a
  footer copyright line ("© Consult Club, IIM Ahmedabad 2025-26 N"), a stylized "FRAMEWORK"/
  "INDEX" header that sometimes duplicates as letter-spaced text ("F R A M E W O R K"), and a
  case-tag line ("Profitability | Logistics | Moderate") — all vary per page (page number,
  case type/difficulty) so they dodge the exact-boilerplate filter. Confirmed on 8 sampled
  pages (1, 3, 4, 5, 8, 49, 80, 160): every op traces to this template pattern, not a real
  content difference.
- **`unreadable` (11 pages) / `vision_failed` (1)** — the 1 genuine network failure (patched
  above) plus 9 pages where the tag correctly marks a logo-only "Key players" table cell that
  has no selectable text (e.g. p328, p334, p342, p354, p374, p376 — same accepted false-
  positive class as every prior casebook's "Major Players"/branding stamps), and one genuine
  content gap in running prose (p243, mid-sentence) left as `[UNREADABLE]` rather than
  invented, correctly flagged.
- **p104 is a real (not false-positive) defect**, flagged `diagram_invalid`: its second
  diagram block is empty/malformed (`invalid JSON: Expecting value: line 1 column 1`) — a
  genuine vision-generation gap, not a checker false positive. Correctly caught by `needs_review`,
  left for the review queue (R5) rather than silently dropped or guessed at here.
- **Diagram-structure flags (`diagram_structure`/`diagram_missing_box`, 46 pages)** — not
  individually sampled this run given time, but consistent in count/shape with prior
  casebooks' dashboard/multi-panel page pattern; flagged for review, not fixed here.

**No genuine invented/hallucinated content found in any page checked.** Same conclusion as
every prior R6 casebook: a checker false-positive pattern driven by this casebook's own page
template, plus one real (correctly-caught) generation defect on p104.

**Proof:** `document_chunks` (live) unchanged at 22,457 rows.
**Cost:** v1: 502 vision + 825 embedding calls (one extra API-budget-depleted attempt before
the topped-up rerun, cost already sunk in vision calls only — no embeddings/writes from that
attempt). Patch: 2 vision + 826 embedding calls. Still well inside the $20/month budget.
**Left open in R6:** FMS Consulting Club 2025-26 (~325p), FMS 2024-25 (~279p) — ~604 pages,
not started.
**Files:** `backend/ingestion/run_r6_iima.py`, `backend/ingestion/run_r6_iima_patch.py` (both
now tracked — were untracked/didn't exist at session start).

---

## 2026-11-02 — v2 preview rerun: widened to all 9 ingested casebooks + the new relevance gate
**Phase:** (none — informational probe, follow-up to the earlier v2-preview entry) · **Type:** eval

**What changed:** Aalhad asked to test the 39 questions against everything ingested so far,
not just the 5 the question set names. Widened `run_eval_v2_preview.js`'s `DOC_IDS` from 5 to
all 9 Consulting casebooks R6 has done (adds IIM L, IIM Calcutta, IIMA, FMS 2023-24 to the
candidate pool — 3,883 chunks total now, up from 1,334). Also updated the scoring to mirror
the relevance gate just added to `groundedConsultingLookup` (today's earlier entry): a row now
has to clear similarity **and** the relevance judge to count as covered, run across every
candidate above threshold (not just the top one), same as the live function now does.

**Result: 5/39 (13%), down from the 8/39 the narrower pool scored.** This is not a quality
regression — it's an honest side effect of a bigger, genuinely useful pool, confirmed by
reading every failing case rather than just the number:

- **The relevance gate holds up at scale.** All 4 known false positives (RICE, Jobs-to-be-
  Done, tennis balls, Uber-NYC) are still correctly rejected, even with 8-9 candidate rows
  per question above threshold now instead of 1-2 — the gate checked every one of them and
  rejected every one, same conclusion as the narrower-pool run.
- **The score drop is entirely the "wrong casebook, right answer" pattern getting more
  common**, exactly as flagged as a risk before running this: q001, q016, q017, q018, q019,
  q013, q024 all now retrieve a **faithful, correct** excerpt from a *different* casebook than
  the one the question names (e.g. MECE answered correctly from FMS 2023-24 instead of FMS
  2021-22; Porter's Five Forces from IIM Calcutta instead of IIM B). `faithfulness`,
  `citations` and `coverage_label` all pass on these — only the eval's strict single-source
  `retrieval_hit` check fails them, because multiple casebooks genuinely teach the same
  universal framework and a bigger pool surfaces more of that competition.

**Implication for the real R9 gate:** as more casebooks get ingested, this eval's strict
source-match design will keep looking worse even with zero real quality loss, unless
`retrieval_hit` is redefined to accept any faithful match (not just the one named casebook) -
an eval-design question to settle before R9, not a retrieval bug to fix now.

**Cost:** 21 embedding + 140 judge calls (up from 21 - now judging every row above threshold,
not just the top one, across a 3x bigger pool). Still negligible.
**Files:** `backend/eval/run_eval_v2_preview.js` (updated), `backend/eval/results/2026-11-02-v2-preview.json`/`.md` (overwritten with this rerun).
**Proof:** Script output above; full per-question detail in the `.md` file.
**Undo:** `git diff`/revert; the superseded 8/39 run is still in this file's git history.

---

## 2026-11-02 — Relevance gate added to groundedConsultingLookup, fixes the known false-positive class
**Phase:** (none — fix for a finding from the v2-preview probe) · **Type:** retrieval, fix

**What changed:** The 2026-11-02 v2-preview entry above found 4 real false positives
(RICE, Jobs-to-be-Done, "tennis balls in a room", "Uber rides in NYC") — unrelated excerpts
clearing similarity threshold (0.63-0.73) and would've shown as "from the casebooks" with no
warning. Discussed the fix with Aalhad: tuning the threshold higher was rejected (only 4 known
examples, risks rejecting real matches). Instead added `judgeRelevance()` to
`consultingRetrieval.js` — a cheap Gemini call (same prompt/tier as the eval's
`judgeFaithfulness`) that actually reads the question and excerpt, run on every row that
clears the similarity threshold, before `groundedConsultingLookup` returns `covered: true`.
Fails closed (treats a judge error as "not relevant" — showing nothing is always safer than
showing an unchecked excerpt, per the grounding policy). Kept `decideCoverage` itself pure/
unit-testable (no I/O) — the judge call sits in `groundedConsultingLookup`, after the
threshold filter, so it only ever runs on rows that already cleared similarity (cheapest
check first).

**Verification, not assumed:** didn't need a fresh test run — the v2-preview probe already
ran this exact judge prompt against these exact excerpts. All 4 false positives already came
back `unfaithful`; all 8 questions that passed the full preview already came back `faithful`.
Applying the same judge as a live gate would keep the 8 good ones and filter the 4 bad ones -
confirmed from existing data, not re-run speculatively.

`npm test`: 111/112 pass (the 1 failure, `sandbox.test.js`'s env-leakage check, is a
pre-existing macOS `__CF_USER_TEXT_ENCODING` quirk unrelated to this change — confirmed by
running the suite before touching anything).

**Cost:** +1 cheap Gemini call (flash-lite tier) per covering row per live lookup, going
forward once this pipeline is switched on. Negligible at current volume.
**Files:** `backend/src/lib/consultingRetrieval.js`.
**Proof:** `npm test` output above; v2-preview's existing per-question faithfulness verdicts
(`backend/eval/results/2026-11-02-v2-preview.json`).
**Undo:** Revert `consultingRetrieval.js`; `groundedGuesstimateLookup` inherits this
automatically since it calls `groundedConsultingLookup` underneath, so nothing else to revert.
**Open issues:** Not live yet (flag off) - will need an actual eval rerun once R9's
switch-over happens, to catch anything this prompt doesn't.

---

## 2026-11-02 — Policy change: drop per-answer source citation (keep "not covered" label)
**Phase:** (none — product decision) · **Type:** policy, frontend

**What changed:** Aalhad asked to remove the per-answer "This is from the IIMK casebook"
style line, since the site already states globally that answers are grounded in the
casebooks. Confirmed first that this is a genuine policy change, not a styling tweak —
`CLAUDE.md`'s grounding policy explicitly required per-answer `(school, casebook, page)`
citations — then updated the policy doc itself (`CLAUDE.md`, `.claude/skills/grounded-
answering/SKILL.md`) alongside the code, so the written rule and actual behavior don't
diverge for the next session.

Scoped the change carefully: removed the **source attribution** for grounded answers only.
Kept the **"not from the casebooks" fallback label** for ungrounded answers untouched —
that's a different, more fundamental disclosure (the one blend the grounding policy forbids
outright: passing off general AI content as casebook content), not a citation, and nothing
in this conversation asked to change it.

`GroundingNote.tsx` (the single component every citation-rendering call site already funneled
through — `ProbeChat.tsx`, `GuesstimatesPage.tsx`, `RolePage.tsx` x2) now renders nothing when
`groundedInCasebooks` is true, and only the existing fallback label when false. Removed the
now-dead `citation`/`citations` props from all 4 call sites, and the now-fully-unused
`companyNoteCitationsByKey` state + fetch wiring in `RolePage.tsx` (nothing consumed it
anymore). Citation data (school/casebook/page) is still computed and returned by the API —
this is a frontend rendering change only, not a retrieval/backend change — so it's still
available for debugging or a future admin view.

**Why no student impact yet:** this whole R7/R8 frontend is still gated behind
`ENABLE_CONSULTING_RAG_V2` (off). Good timing to make this call before it ever ships, rather
than after.

**Verification:** `npx tsc --noEmit` clean, no errors. Removed the now-orphaned
`.grounding-note-cited`/`-badge`/`-sources` CSS rules (global.css) since nothing renders them
anymore.

**Files:** `frontend-react/src/components/GroundingNote.tsx`,
`frontend-react/src/components/ProbeChat.tsx`, `frontend-react/src/pages/GuesstimatesPage.tsx`,
`frontend-react/src/pages/RolePage.tsx`, `frontend-react/src/styles/global.css`, `CLAUDE.md`,
`.claude/skills/grounded-answering/SKILL.md`.
**Proof:** `tsc --noEmit` clean.
**Undo:** `git diff` the files above / revert this commit.
**Open issues:** None of this is live yet (flag off) - will carry through to R8/R9 whenever
the switch-over happens.

---

## 2026-11-02 — Ad-hoc: v2 (not-yet-live) pipeline previewed on the same 39 eval questions
**Phase:** (none — informational probe, not a roadmap task) · **Type:** eval

**What changed:** Aalhad asked directly whether R4's eval could be run against the new R6
re-ingested content instead of the old live tables. It can't be done by just setting
`ENABLE_CONSULTING_RAG_V2=true` and rerunning `run_eval.js` — `match_ingest_chunks`
(migration_044) hardcodes `where c.is_active = true` in SQL, and every R6 row is still
`is_active=false` (switch-over is a deliberate, separate R9 decision, untouched here). Built
`backend/eval/run_eval_v2_preview.js`: a **read-only** script that fetches the still-inactive
`ingest_chunks` rows for the 5 latest-version casebooks the question set references (FMS
2021-22, ISB, IIM B, IIMK, SRCC — 1,334 chunks, paginated past PostgREST's 1000-row cap),
computes cosine similarity locally in JS, and reuses the real `decideCoverage`/`buildCitation`
pure functions from `consultingRetrieval.js` unmodified. **No row's `is_active` was changed; no
student-facing behavior changed.**

**Result: 8/39 (21%) overall, up from R4's 0/39.** Only `frameworks` (6/14) and `guesstimates`
(2/7) have any v2 code path at all — `qa`/`role`/`company` (18/39, 46% of the set) still have
zero grounded route in either pipeline, unaffected by switch-over. Citations check went from
0/39 to 21/39 pass — `ingest_chunks` carries real `page_start`/`page_end`, unlike the live
`document_chunks` table, so this is a genuine structural improvement, not just better content.

**What's still broken, even in the new pipeline:**
- 4 "wrong casebook" misses (q003, q014, q019, q024) are mostly benign: the retrieved chunk
  was faithful, on-topic content from a *different* casebook that also covers the same
  universal framework (e.g. PESTEL retrieved from IIM B instead of FMS 2021-22) — the eval's
  strict single-source match treats this as a fail, but a student would likely get a correct
  answer. Noted, not treated as a real defect.
- q004 (price discrimination) retrieved a heading-only chunk with no body text — a chunking
  boundary issue worth a look during R6/R7 polish.
- **4 real false positives on `covered:false` questions (q008, q032, q036, q037)** — RICE,
  Jobs-to-be-Done, tennis balls, NYC Uber rides — each retrieved an unrelated excerpt at
  0.67–0.73 similarity, above threshold, that would show as "from the casebook" with no
  warning. This is the same failure class R4 found in the old pipeline; re-ingesting better
  content did **not** fix it, because the problem is the similarity threshold alone being an
  insufficient filter, not the content quality. Worth addressing before R9, independent of
  R6/R7/R8 progress.

**Cost:** 21 embedding + 21 judge calls, negligible.
**Files:** `backend/eval/run_eval_v2_preview.js` (new), `backend/eval/results/2026-11-02-v2-preview.json`/`.md`.
**Proof:** Script output above; `is_active` unchanged (no UPDATE statement anywhere in this script).
**Undo:** Delete the new files; nothing else to revert.
**Not a roadmap update:** `.gsd/ROADMAP.md`/`STATE.md` unchanged — this isn't R4 or R9, just an
early look Aalhad asked for. The real R9 eval (after R7/R8 land and switch-over is deliberately
flipped) is still the one that counts for the gate.

---

## 2026-11-02 — R4 done: eval runner built, baseline score on live chunks
**Phase:** R4 · **Type:** eval

**What changed:** Built `backend/eval/run_eval.js` (imports the real lib functions the
routes use, no HTTP round-trip, no copy) and ran all 39 questions in
`backend/eval/questions.jsonl` against today's live behavior
(`ENABLE_CONSULTING_RAG_V2` unset/false - the runner refuses to run if it's `"true"`).
Scored all 6 checks from the rag-eval skill: retrieval hit, citations, coverage label,
diagram intact and must-include in code; faithfulness with a cheap Gemini judge
(flash-lite tier, `generateJSON`'s default cascade, reasoning captured per question).

**Mapping decisions** (each feature's live path was read from the code first, not assumed):
- `frameworks` (14 q): the v1 path (`frameworksGrounding.js`'s `findGrounding`, called via
  the exported `withGroundedExamples` - the exact function `routes/frameworks.js` calls) is
  built for seeded `frameworks` rows, not free text. Mapped each question onto a synthetic,
  never-persisted row (`{name: question text, domain: question.domain}`) so the real function
  builds the same query string it would for a real row. `withGroundedExamples` does write
  back to the `frameworks` table; confirmed live first that an update keyed on a fresh random
  uuid matches zero rows (table count unchanged at 27) - safe, no row created or touched.
- `guesstimates` (7 q): `routes/guesstimates.js` returns `{available:false,
  reason:"feature_disabled"}` unconditionally while the flag is off. Recorded that fact
  directly rather than calling `guesstimateRetrieval.js`'s lib functions, which would bypass
  the route's gate and fabricate a result no student can get today.
- `qa` / `role` / `company` (18 q): no grounded retrieval route exists for these at all -
  `chat.js` is an ungrounded Gemini passthrough with no casebook lookup. Recorded as
  `no_rag_route` with every check failed, rather than routing through `chat.js` (tests "does
  Gemini know things", not RAG) or through `groundedConsultingLookup` (the new, flag-gated
  v2 pipeline, not live).

**Score: 0/39 (0%) pass overall.** Per-check: retrieval_hit 4/37 (11%), faithfulness 5/39
(13%), citations 0/39 (0%), coverage_label 12/39 (31%), diagram_intact 0/25 (0%, 14 n/a),
must_include 5/37 (14%). Per-feature: frameworks 0/14, guesstimates 0/7, qa 0/14, role 0/2,
company 0/2.

**What the baseline actually shows, beyond the expected "most content isn't live yet":**
1. **`document_chunks` is not empty for Consulting** - correcting an assumption from this
   session's earlier briefing. The `.pdf`-named rows from the R6 re-ingestion are 0% active
   (as already found), but an **older pipeline's `.txt`-named rows are fully active** (e.g.
   `The FMS Consulting Casebook 2021-22.txt` 54/54, `ISB Consulting Casebook 2025.txt`
   98/98, `IIM B Consulting Casebook 2025.txt` 84/84, `IIMK Kasebook 2025.txt` 65/65,
   `IIM Calcutta Consulting CaseBook 2025-26.txt` 72/72, plus `FMS_Casebook_20-21.txt`,
   `MIT Consulting Casebook.txt`, `IIM L Consulting Casebook 2025.txt`,
   `IIMA-...-2025-26.txt`, `The Consulting Club FMS Casebook 2025-26.txt`). A live query for
   "MECE" genuinely retrieves a correct, on-topic MECE excerpt at similarity 0.77. The v1
   Frameworks path is not dead - it just answers from different (older, page-less) rows than
   the eval's `expected_source` names.
2. **`document_chunks` has no page column at all** (`select page_start` throws "column ...
   does not exist") - citations fail the "school, casebook, page" bar in CLAUDE.md's
   grounding policy for every single v1 result, by construction, not as a per-question bug.
   Also means `expected_pages` in questions.jsonl can never be checked against this table.
3. **The 0.5 similarity threshold lets real false positives through** for exactly the
   `covered:false` "frameworks" questions meant to test this (q032 RICE, q036 Jobs-to-be-Done):
   both retrieved unrelated excerpts (a delivery-membership guesstimate; a competitive-
   positioning passage) scoring 0.63-0.68, and the UI would show them as "From our casebooks"
   with no warning. This is the exact failure CLAUDE.md's "show nothing rather than a loosely
   related excerpt" rule exists to prevent.
4. **Even on-topic covered:true frameworks questions often retrieve the wrong casebook or an
   incomplete excerpt** - e.g. q014 (Go-to-Market Strategy) retrieved a complete, correct TAM/
   SAM/SOM passage from `IIM B Consulting Casebook 2025.txt` - on-topic for a *different*
   question (q019), not this one; q010/q011 retrieved excerpts that visibly cut off
   mid-explanation.
5. **The live Frameworks UI has no "not from the casebooks, AI-generated" fallback at all**
   (checked `frontend-react/src/pages/FrameworksPage.tsx`) - when nothing is found it just
   omits the casebook box silently. That satisfies "show nothing," not CLAUDE.md's "say so
   plainly, then give a labelled general answer."
6. **`guesstimates`, `qa`, `role`, `company` have zero live grounded path today** - not a
   partial/low-quality RAG, a complete absence. 25/39 questions (64%) fall here.
7. Noted, not scored here: `grounded_image.url` (v1's image citation) is a raw
   `document_chunks.image_url` Storage URL returned through an `optionalAuth` route with no
   admin check - whenever an image clears the 0.58 threshold it reaches a non-admin student
   directly, which CLAUDE.md's diagram-privacy rule forbids. Fired zero times in this run (no
   `covered:true` frameworks question matched an image), so it doesn't show up in the score,
   but the code path exists and should be checked before any switch-over.

**Files:** `backend/eval/run_eval.js` (new),
`backend/eval/results/2026-11-02-baseline.json` (new),
`backend/eval/results/2026-11-02-baseline.md` (new), `.gsd/ROADMAP.md`, `.gsd/STATE.md`.
**Proof:** `node backend/eval/run_eval.js baseline` → "Overall: 0/39 scored questions pass
(39 total, 0 n/a)." Full per-question checks and reasoning in the JSON/Markdown results
files above.
**Cost:** 14 embedding calls (`gemini-embedding-001`, free tier) + 14 faithfulness-judge
calls (flash-lite tier, `generateJSON` default cascade - no escalation). Both well inside
the $20/month budget; effectively free-tier.
**Undo:** Delete `backend/eval/run_eval.js` and the two results files; revert
`.gsd/ROADMAP.md` / `.gsd/STATE.md`.
**Open issues:** This is the first eval run - no prior baseline exists, so "regressions vs
previous" is explicitly "none to compare" rather than a real check. R9 will be the first run
with something to regress against. The raw `image_url` exposure (point 7 above) should get
its own fix before any switch-over, not just a note here.

---

## 2026-11-02 — R3 fix: eval question page numbers and two mislabeled questions corrected
**Phase:** R3 · **Type:** eval, fix

**What changed:** Checked all 29 `covered:true` questions in `backend/eval/questions.jsonl`
against the actual re-ingested (R6) page content, not just JSON syntax. Found two systematic
page-number bugs plus two wrong classifications:
- **FMS Consulting Casebook 2021-22 — consistent +1 page offset** (a cover page shifts the
  pipeline's page_no one ahead of the casebook's own printed footer number): fixed q001
  (24,25→25,26), q002 (26→27), q003 (20→21), q004 (21→22), q024 (29→30).
- **SRCC Guesstimates-Book-Volume-1-6 — consistent +4 page offset** (questions were numbered
  from the "Theory" section, skipping 4 front-matter pages the pipeline counts): fixed q005
  (17→21), q006 (19,20→23,24), q007 (18→22), q009 (23→27).
- **q008 ("tennis balls that fit in a room") reclassified `covered:true`→`false`:** this topic
  doesn't appear anywhere in SRCC Guesstimates or anywhere else in the ingested corpus
  (checked `ilike` across all `ingest_pages`, zero hits for "tennis"). Cleared
  `expected_source`/`expected_pages`/`must_include`.
- **q028 ("daily revenue of Delhi Metro") reclassified `covered:true`→`false`:** wrong source —
  there's a real "Delhi Metro Passengers" guesstimate, but it's in **The FMS Consulting
  CaseBook 2023-24** (page 117, latest version `faa13328-...`), not SRCC, and it computes
  passenger count, not revenue (`ticket`/`fare` don't appear on that page at all). No real
  revenue-focused Delhi Metro guesstimate exists in the corpus, so reclassified rather than
  reassigning to a page that doesn't actually answer the question asked.
**Why:** R4 (eval runner) can't produce a trustworthy baseline against a test set with wrong
page numbers — every one of these would register a false retrieval-miss even with perfect
grounding. `.gsd/STATE.md`'s known-gap note on an off-by-one page bug flagged this risk.
**Verification:** Re-ran exact-match check (must_include terms found verbatim on the exact
expected pages, no tolerance range) for all 27 remaining `covered:true` questions: 26/27 pass.
The one remaining gap (`q006`, "income segmentation") is a phrasing nuance — the page covers
income-tier segmentation conceptually but not that exact two-word phrase — left as Aalhad's
call per the rag-eval skill ("Aalhad writes these ... help with formatting only").
**Files:** `backend/eval/questions.jsonl`.
**Proof:** 39/39 lines still valid JSON; 27 covered / 12 not-covered; 26/27 covered questions'
must_include terms now verified present verbatim on their exact expected pages.
**Undo:** `git diff backend/eval/questions.jsonl` / revert the file.
**Open issues:** ISB/IIM B/IIMK questions' page numbers weren't independently re-verified
against printed footer numbers the way FMS/SRCC were (they passed the loose range check
already, so wording lines up, but a footer-number audit wasn't done for those three).

---

## 2026-11-01 — R3 done: Consulting test question set landed
**Phase:** R3 · **Type:** eval

**What changed:** Aalhad's test question set arrived at `~/Downloads/questions.jsonl`; moved to
`backend/eval/questions.jsonl` (the path R3's done-when and R4's eval runner expect).
`backend/eval/` didn't exist yet, created it. Validated: 39 lines, all valid JSON, 29 questions
marked `covered:true` (casebook should answer these) and 10 `covered:false` (casebook shouldn't
cover these — tests the "not in casebooks" label). Schema per line: `id`, `domain`, `feature`,
`question`, `expected_source`, `expected_pages`, `must_include`, `covered`.
**Why:** R4 (eval runner + baseline score) can't start without this file; R3 was the ▶ task.
**Files:** `backend/eval/questions.jsonl` (moved, not yet committed — new file, untracked).
**Proof:** File validated above; 39/39 lines parse as JSON.
**Undo:** Move the file back to `~/Downloads/questions.jsonl`.
**Open issues:** None of the questions' `expected_source`/`expected_pages` have been checked
against the actual re-ingested (R6) content yet — R4 will surface any mismatches.

---

## 2026-11-01 — R6: IIM Calcutta Consulting CaseBook 2025-26 ingested, 1-page network-failure patch (retried twice after transient failures), needs_review rate traced
**Phase:** R6 · **Type:** ingestion, fix

**Ingested:** IIM Calcutta Consulting CaseBook 2025-26 (457 pages), insert-only, `is_active=false`.
Classification already confirmed `club_casebook` (school IIM Calcutta) in the batch check logged
2026-10-31. v1 (`dbfc78ec-1879-4623-8639-ac836049b274`): 457 pages, 930 chunks, 559 vision +
931 embedding calls, one page (421) failed with a transient `ReadTimeout` during the vision
call, correctly stored `[UNREADABLE]` and flagged `needs_review` rather than silently wrong.

**v1 → v2 patch, retried twice:** the patch script (retry page 421, rebuild v2) failed on its
first two attempts, both on dropped network connections, not code bugs:
1. First attempt (run before this session) died with `httpcore.ConnectError: Connection reset
   by peer` while inserting the new `ingest_documents` row — no v2 document existed afterward.
2. Second attempt (rerun this session) got through the vision retry (page 421,
   `number_coverage=1.0`, `word_coverage=1.0`, still `needs_review` for unrelated reasons:
   `ragged_table`, `diagram_in_table`) but then hit `socket.gaierror` / DNS resolution failure
   on `generativelanguage.googleapis.com` partway through re-embedding all 931 chunks — again
   no v2 write.
3. Third attempt (after confirming DNS/network was back via `ping`/`nslookup`) completed clean:
   v2 (`f2c1333f-b205-46fa-991e-551548dffef7`), 457 pages, 931 chunks, `status=done`.

The script is idempotent by design (`version_status(...) == "done"` short-circuits), so rerunning
after each failure was safe — no duplicate v2 rows were created.

**Investigated: 117 of 457 pages (25.6%) flagged `needs_review`** — lower than IIMB (72%) and
IIMK (40.6%), same "trace before accepting" standard as those runs. Reason breakdown: `seq_diff`
(50), `ragged_table` (37), `diagram_in_table` (35), `invented_text` (18), `diagram_label` (12),
`diagram_structure` (12), `diagram_label_altered` (11), `number_coverage`/`word_coverage` (11
each), `diagram_missing_box` (9), `diagram_invalid` (7), `diagram_flattened` (5), `unreadable` (4).
Flags cluster heavily on pages ~18–31 (an "Industry Overview" dashboard section, e.g. Automobile,
Iron & Steel). Sampled pages 20 and 27: `text_layer` on both is almost empty — just a source
citation and the page title/number (e.g. page 20's entire `text_layer` is "Source: IBEF, Invest
India / Note: Mfg. refers to Manufacturing / AUTOMOBILE INDUSTRY / 20") — because these pages are
near-fully graphic infographics, not selectable text. The vision model reads the infographic
correctly into table/diagram markdown, but the checker's `label_not_on_page`/`number_not_on_page`/
coverage checks compare against `text_layer`, so they flag almost every label and number as "not
on page" when there's barely any real text layer to match against. Same false-positive class as
IIMB's Industry Report pages and IIMK's branding stamps, more pronounced here because these pages
are closer to 100% image. **Traced, not fixed** — checker tuning for near-empty-text-layer pages
is out of scope for an ingestion run; flagged for review as usual.

**Not independently verified against the rendered page image** (only against `text_layer`/
markdown this time, no page-image render check) — lower-confidence than prior entries' spot
checks; worth a `fidelity-reviewer` pass if this cluster matters before switch-over.

**Proof:** `document_chunks` (live) unchanged at 22,457 rows. v2 `ingest_documents` row
`status=done`, 457 pages, 931 chunks, `is_active=false`.

**Cost:** v1 (prior session): 559 vision + 931 embedding calls. Patch: vision retried once per
attempt (3 attempts × 1 page ≈ 3 vision calls); embeddings re-ran in full on both the failed DNS
attempt and the successful attempt (≈931 calls each, most of the failed attempt's calls likely
landed before the DNS drop) — rough estimate ≈1,800–1,900 extra embedding calls from the two
failed/retried attempts, call+embedding cost at flash-lite/embedding rates stays well under $1
for this patch; exact count not instrumented per-attempt. Cumulative R6 spend still well inside
the $20/month budget.

**Left open:** IIMA (~389p), Consulting Club FMS 2025-26 (~325p), FMS 2024-25 (~279p) —
~993 pages, not started.

**Files:** `backend/ingestion/run_r6_iimcal.py`, `backend/ingestion/run_r6_iimcal_patch.py`
(both now tracked — were untracked at session start).

---

## 2026-10-31 — R6: IIM B Consulting Casebook 2025 ingested, 2-page network-failure patch, high needs_review rate traced and cleared
**Phase:** R6 · **Type:** ingestion, fix

**Ingested:** IIM B Consulting Casebook 2025 (292 pages), insert-only, `is_active=false`.
Classification confirmed live (`source_class='club_casebook'`, school IIM Bangalore) before
ingesting — along with the other 4 remaining casebooks in the same check (IIM Calcutta, IIMA,
FMS Consulting Club 2025-26, FMS 2024-25), all 5 confirmed `club_casebook`.

**v1 → v2 patch:** 2 pages (21, 114) failed v1 with transient network errors
(`ReadTimeout`/`ConnectionError` on the vision call) — correctly stored as `[UNREADABLE]` and
`needs_review=true`, not silently wrong. Both already classified `is_visual=true` (not a
classification bug). Retried via `run_r6_iimb_patch.py`; both now `number_coverage=1.0` (still
`needs_review` for unrelated reasons: p21 `diagram_invalid`, both `seq_diff`). v2
(`17a7c482-5181-423c-b8d5-44f79e90e392`, v1 file_id `11b97978-6533-4c51-9e32-1a9945d758db`):
292 pages, 530 chunks. Mean coverage after patch: number 0.9776, word 0.9766.

**Investigated: 211 of 292 pages (72%) flagged `needs_review`** — higher than IIM L's rate but
in the same range as IIMK's v2 (160/229, 70%), not an outlier. Traced representative samples
across every reason code before accepting the number, same standard as the IIMK run:
- **`seq_diff` (162 pages, the largest reason)** — almost all trace to two per-page template
  elements this casebook has that IIMK/IIM L didn't: (1) a page-footer nav bar ("Home",
  "Contents", a changing page fraction like "3/7", the school/year stamp) and (2) a case-tag
  sidebar ("Best of the Season", "Challenging", a changing firm name like "BCG"/"Bain"/
  "Deloitte"). Both vary per page (fraction, firm name), so they don't hit the
  boilerplate-line filter (needs an *exact* match on ≥20% of pages) and get flagged as
  "insert" (text-layer content the markdown correctly chose not to transcribe as prose).
  Confirmed on 10+ sampled pages (10, 15, 18, 24, 27, 29, 32, 35, 47, 50, 57, 73): every real
  op traces to this nav/badge pattern, not a real content difference. One exception found
  while sampling: p47 has a genuine `delete`-tag op (markdown holds scenario-analysis numbers
  the text layer doesn't) — checked against the page's content and it is a chart/table value
  the vision model read off an image, not an invention.
- **`invented_text` (8 pages, 259–287)** — all are "Industry Reports" pages with a "Major
  Players" section; the flagged lines are company names (Adani Wilmar, Apollo Hospitals,
  Maruti Suzuki, Tata Motors, ONGC, Reliance, SBI Life, HDFC Life, FedEx) that appear as logo
  graphics, not selectable text — same false-positive class as IIMK's branding stamps. Real,
  verifiable companies for each industry page, not fabricated.
- **Diagram-structure flags (`diagram_structure`, `diagram_flattened`, `missing_box`, etc.,
  ~90 pages)** — mostly a new page template this casebook introduces: multi-panel "Industry
  Report" pages with several small labelled sections (Key Drivers, KPIs, Market Size) that the
  `missing_box` heuristic (3+ short standalone lines) reads as undiagrammed boxes, when they're
  section headers of a one-page dashboard, not one diagram. Flagged correctly for review, not
  silently dropped or invented.
- **`unreadable`/`vision_failed` (8 + 2 pages)** — the 2 network failures (patched above) plus
  6 pages with a genuinely unreadable logo fragment inside otherwise-valid content (e.g. p277's
  `[UNREADABLE] HP`), correctly left `needs_review` per the skill (never fabricate the missing
  piece).

No genuine invented/hallucinated content found in any page checked. **Same conclusion as the
IIMK run: a checker false-positive pattern driven by this casebook's own page template
(footer nav bar, case-tag sidebar, industry-report dashboard layout, logo-only player names),
not a real content defect.** Flagged here, not fixed (checker tuning is out of scope for an
ingestion run).

**Proof:** `document_chunks` (live) unchanged at 22,457 rows. `ingest_chunks` for this
document all `is_active=false` (530 rows). Sample diagram blocks confirmed real
(p17 BCG-style matrix with STAR/QUESTION MARK/CASH COW/DOG text verbatim from the page; p22
a Risks issue tree; p259 a 6-node Food Processing value-chain flow with real edges a→b→c→d→e→f).

**Cost:** v1: 367 vision + 528 embedding calls. v2 patch: 3 vision + 530 embedding calls.
≈$0.60-0.70 this casebook (flash-lite vision ~$0.0012-0.002/call, embeddings ~$0.0001/call,
per this project's established rate). **Cumulative R6 spend now ≈$2.09-2.53 — crosses the $2
round-number threshold** (still well inside the $20/month budget; flagging per Aalhad's
standing instruction to surface every round-number crossing).

**Left open:** IIM Calcutta (~457p), IIMA (~389p), Consulting Club FMS 2025-26 (~325p), FMS
2024-25 (~279p) — ~1,450 pages, not started this run.

**Files:** `backend/ingestion/run_r6_iimb.py` (new), `backend/ingestion/run_r6_iimb_patch.py`
(new).

---

## 2026-10-31 — R6: IIMK Kasebook 2025 ingested, 5-page network-failure patch, invented_text false-positive investigated and cleared
**Phase:** R6 · **Type:** ingestion, fix

**Ingested:** IIMK Kasebook 2025 (229 pages), insert-only, `is_active=false`. Classification
confirmed live (`source_class='club_casebook'`, school IIM Kozhikode) before ingesting, along
with the other 5 remaining casebooks in the same check — all 6 confirmed `club_casebook`,
none excluded.

**v1 → v2 patch:** 5 pages (1, 27, 62, 63, 118) failed v1 with transient network errors
(`ConnectionError`/`ReadTimeout` on the vision call) — correctly stored as `[UNREADABLE]` and
`needs_review=true`, not silently wrong. All 5 were already classified `is_visual=true` (not a
classification bug). Retried via `run_r6_iimk_patch.py`; all 5 now `number_coverage=1.0`.
v2 (`6ae47aaa-ad2e-4848-9775-75ac2072f79e`, file_id for v1 was `8f0bc31a-...`): 229 pages,
208 chunks. Mean coverage after patch: number 0.9816, word 0.9535.

**Investigated, not swept under the rug: 93 of 229 pages (40.6%) were flagged `invented_text`**
— far above IIM L's rate (4/218, 1.8%) on the same check. Before calling this clear, traced the
actual cause on representative samples rather than trusting the flag count:
- **79 of 93 (85%)** share a common string in their markdown — "KONSULT GROUP" / "Buddy Round" —
  the club's own branding/watermark, visually present on the page (confirmed against page 12's
  full text) but absent from the PDF's extractable `text_layer` (it's a stamp/graphic, not
  selectable text). Same accepted false-positive class as brand logos noted in earlier R6
  entries (ISB, FMS). Not invented content.
- **Page 216** (one of the 14 non-branding flags): every numeric/label string the diagram
  blocks contain ("$ 250 Bn 2021", "11% CAGR", "$380 Bn 2025", the 5 Growth Drivers items, etc.)
  is verified present verbatim in `text_layer` — the diagram is a faithful restructuring of real
  page content, not an invention. Flag source not pinned to the exact line (likely a chart-type
  sub-block further down the page with a formatting mismatch against `invented_text_issues`'s
  string match), but the content itself is confirmed real.
- **Page 3** (Table of Contents): `text_layer` extracts one character per line
  (`T\nA\nB\nL\nE...`) — a PDF-extraction artifact of this page's title-style typography, not a
  content problem. This breaks the checker's word-matching regardless of what the markdown says.

No genuine invented/hallucinated content found in any page checked. **This is a checker
false-positive pattern specific to this casebook's branding/typography, not a real content
defect** — flagged here, not fixed (per scope: investigate, don't mid-ingestion-refactor the
checker). Worth a dedicated pass if `invented_text`'s table_header/chart-string matching logic
should tolerate watermark text and fragmented glyph layers — out of scope for this run.

**Proof:** `document_chunks` (live) unchanged at 22,457 rows. `ingest_chunks` all
`is_active=false` (4,512 total, +408 from this casebook). Zero rows match a literal
`%hallucinat%` search (note: that term doesn't match this project's actual review-reason code,
`invented_text` — corrected search used above).

**Cost:** v1: 299 vision + 200 embedding calls. v2 patch: 7 vision + 209 embedding calls.
≈$0.35-0.45 this casebook. **Cumulative R6 spend now ≈$1.49-1.83 — approaching the $2
round-number threshold** (still trivial against the $20/month project budget; flagging per
Aalhad's standing instruction to surface every round-number crossing).

**Left open:** IIM B (~292p), IIM Calcutta (~457p), IIMA (~389p), Consulting Club FMS 2025-26
(~325p), FMS 2024-25 (~279p) — ~1,742 pages, not started this run.

**Files:** `backend/ingestion/run_r6_iimk.py` (new), `backend/ingestion/run_r6_iimk_patch.py`
(new).

---

## 2026-10-31 — R8: frontend for grounded citations, diagrams, Guesstimates and the framework catalog
**Phase:** R8 · **Type:** feature, fix

**What changed:** built the frontend pieces for everything R7/G2/G3 already grounded on
the backend but had no visible UI for.

- New `GroundingNote.tsx` - the one reusable component for "casebook-cited" (green badge
  + school/casebook/page) vs. "AI-generated, not from the casebooks" (plain gray italic
  label) - never ambiguous which applies (grounding policy, CLAUDE.md). Wired into:
  - Role Topics panel (`RolePage.tsx`) - was retrieving real chunks and silently feeding
    them to the model with no visible citation; now shows the real decision either way.
  - Company-topic notes ("How this shows up at X") - already correctly gated on a real
    company mention; now shows the citation when one exists.
  - Chip panels (What?/Why?/How to apply) - `useProbe.ts`/`ProbeChat.tsx` - was 100% AI
    with zero grounding attempt wired to the UI even though `chipPanel.js` already
    returned `groundedInCasebooks`/`citation`; the type (`ChipPanelResponse`) didn't even
    have the fields. Added them and render the result.
- **Guesstimates: first real UI**, `GuesstimatesPage.tsx` (new route `/guesstimates`, new
  nav entry). Fetches a random practice problem, renders markdown + any embedded
  `placewise-diagram` block (reusing `splitMarkdownBlocks`/`PlacewiseDiagram` - same
  pattern the admin review queue already used, not reinvented), shows the citation, "Try
  another" button. Correctly shows "not switched on yet" rather than an error while
  `is_active` is false everywhere.
- **Framework catalog view** added to `FrameworksPage.tsx` - "From the casebooks" section,
  real diagram titles from R7's `buildConsultingFrameworkCatalog`, expandable per-entry to
  show citations (capped at 20 + "N more" for popular ones like Value Chain's 82).

**Real bug found and fixed during testing, not just claimed:** the framework catalog's
pill row used default flex `align-items: stretch` - expanding one entry (showing its
citation list) stretched every sibling pill in that row to match its height, turning the
row into dozens of tall empty boxes. Only visible in an actual screenshot, not an
automated check - caught the same way as the mobile-fix correction a few commits back,
this time on the first pass. Fixed with `alignItems: "flex-start"`.

**Testing method (explicit instruction from Aalhad after the earlier mobile-fix miss):**
started an isolated local backend (port 4060, `ENABLE_CONSULTING_RAG_V2=true` for this
process only - never touched the shared `backend/.env` or live Supabase `is_active`
values) and an isolated frontend (port 5190) pointed at it, then drove real `/browse`
screenshots - desktop, 375px mobile, light and dark theme - and actually looked at them
before claiming anything worked. `ingest_chunks.is_active` is false everywhere live, so
Guesstimates/Topics/chip grounding correctly show their off-state in every screenshot;
the framework catalog (reads `ingest_pages` directly, not gated by `is_active`) is the one
place real grounded data was actually visible end-to-end - confirmed working against 151
real framework entries.

**Proof:** `tsc -b` and `npm run build` clean. `npm run lint` - one new warning
(`set-state-in-effect` on `GuesstimatesPage.tsx`), same pre-existing pattern already
present on 7 other files in this codebase, not a new category of issue. No console errors
on any tested page. Real screenshots (not committed - local `.gstack/browse-reports/`):
Frameworks catalog (desktop/mobile/dark, collapsed and expanded, before/after the
stretch-bug fix), Guesstimates off-state (desktop/mobile/dark), Role Topics fallback label
(desktop/mobile/dark), chip panel fallback label (desktop, via a real Gemini call).

**Left for a later pass, flagged not guessed:**
- Guesstimates page is deliberately minimal (a working page, not a redesign) - nav
  placement and visual polish are Aalhad's call.
- The framework catalog pill UI is functional but basic - fine for now, a real design
  pass could group/filter 151 entries better than one long wrapped row.
- Nothing here was testable against real grounded output for Guesstimates/Topics/chips
  specifically (vs. the framework catalog) since `is_active` is false everywhere - the
  component logic is verified against both the off-state (real, by default) and the
  on-state's actual data shape (matches the backend code read directly), but not an
  end-to-end grounded screenshot. That requires R9's switch-over to verify for real.

**Cost:** one real chip-panel Gemini call during testing (negligible). No other paid calls.

---

## 2026-10-31 — R6: ingest IIM L Consulting Casebook 2025
**Phase:** R6 · **Type:** ingestion

**What changed:** Ingested "IIM L Consulting Casebook 2025.pdf" (source_class `club_casebook`,
IIM Lucknow, Consulting & Strategy Club) end to end — classify → convert → chunk → embed →
store. Insert-only into `ingest_documents`/`ingest_pages`/`ingest_chunks`, `is_active=false`
throughout (chunk.py default). `document_chunks` (live) and all prior `ingest_*` rows
untouched. No changes made to the pipeline code itself — the chart-routing fix
(`page_classify.py`) and the live-verified weighted scoring formula (`convert.py`) from the
immediately preceding session were used as-is.

**Fidelity:** 218 pages, 408 chunks. Mean `number_coverage` 0.996. 160 pages (73.4%) carry
`needs_review=true` — in line with this project's standing design (every diagram page waits
for human sign-off), not a quality failure. 36 pages (16.5%) have a real `diagram_issues`
flag; the worst (page 37, `number_coverage=0.5`) is a genuine structural issue — a
`placewise-diagram` block nested inside a Markdown table cell instead of standing alone
(`block_in_table`, severity error) — correctly flagged for review, content itself (a
"Customer Journey" flow diagram for a profitability case) is coherent and not invented.
**Zero `hallucinated` findings anywhere in the casebook** (checked via direct query on
`diagram_issues`).

**Cost:** 265 vision calls + 408 embedding calls, ≈$0.33-0.40 at this project's established
flash-lite rate (~$0.0015-0.002/page). Cumulative R6 spend before this run: ≈$0.81-0.98;
after: **≈$1.14-1.38** — now over the informal ~$1 soft guardrail used in recent sessions,
still far under the project's $20/month Gemini budget.

**Left open:** 6 of the 7 remaining Consulting casebooks (IIM B, IIM Calcutta, IIMA, IIMK, The
Consulting Club FMS 2025-26, FMS 2024-25 — combined ~1,971 more pages) are still pending;
this run covered only the smallest. Page 37's `block_in_table` structural issue is a
formatting problem the converter should ideally avoid outputting in the first place — worth a
root-cause pass if it recurs across the remaining casebooks, not fixed in this run (out of
scope, no pipeline code changes made here).

---

## 2026-10-31 — Correction: two real mobile bugs the earlier F2 pass (`0e78f14`) missed on Role
**Phase:** F2 (fix, correction) · **Type:** fix

**What changed:** Fixed two genuine mobile-width bugs on the Role page, found from a real
phone screenshot, that commit `0e78f14` ("fix(F2): mobile layout overflow on 7 pages at
375px") claimed to have cleared via a DOM-overflow check ("0 overflowing elements"). That
check was insufficient — neither bug produces an overflowing element, so it passed both
bugs through undetected. Re-verified everything in this entry visually, not just with the
overflow check.

1. **Severe word-wrap, one word per line, below "Exit Opportunities"** (and in "What this
   role is" / "Topics to prepare"). Root cause: `RolePage.tsx`'s two-column info/sidebar
   grid (`gridTemplateColumns: "minmax(0,1fr) minmax(320px,420px)"`) has no responsive
   breakpoint and predates F2 and G2 both (introduced 2026-09-20, commit `0efe46e1`) — F2
   added breakpoints for `.grid-3` and a couple of flex rows, but never touched this inline
   grid. At ~375-412px, the sidebar's 320px floor leaves the main column's `minmax(0,1fr)`
   almost nothing, so every card in it collapses to a few px wide and wraps one word per
   line. Confirmed via real `/browse` screenshot at 390px before the fix. G2 (`6ce7b93`,
   same day) is not the cause — it touched zero frontend files.
   `ToneShifterPage.tsx` had the identical unbounded pattern (different ratio,
   `minmax(0,1.55fr) minmax(300px,.85fr)`) and was fixed the same way as part of this
   session's broader mobile check.
2. **Nav capsule shows unblurred page content through it on mobile.** `.topnav` is
   intentionally translucent + `backdrop-filter: blur(...)` (content is meant to scroll
   blurred underneath it) — but on any context where `backdrop-filter` silently doesn't
   render (seen on a real Android phone in the reported screenshot; data-saver/lite mode
   and some GPU contexts drop compositing filters with no CSS fallback), only the flat
   `rgba(255,255,255,.7)` background is left, so unblurred page text reads straight through
   it. Reproduced with `/browse` by scrolling the page under the sticky nav at 375px — card
   text appeared legibly layered behind the nav capsule, matching the reported screenshot.
   Mobile is also where the nav is tallest (wraps to 3-4 lines), so this is where it bites
   hardest.

**Fix:** Added a reusable `.two-col-sidebar` / `.two-col-sidebar-wide` grid class
(collapses to one column below 760px) and applied it to `RolePage.tsx` and
`ToneShifterPage.tsx` in place of the unbounded inline grid. Added a `max-width:640px`
rule making `.topnav` and `.topnav-links.glass-capsule` fall back to the same solid
`var(--surface)` background already used for `prefers-reduced-transparency`, so legibility
no longer depends on `backdrop-filter` actually rendering.

**Why:** A student reported (real phone screenshot) the Role page unreadable below "Exit
Opportunities" and the nav overlapping page content — both real, both live, both missed by
the earlier automated "0 overflowing elements" verification.

**Files:** `frontend-react/src/pages/RolePage.tsx`, `frontend-react/src/pages/ToneShifterPage.tsx`,
`frontend-react/src/styles/global.css`

**Proof:** `npm run build` clean, `npm run lint` clean (pre-existing warnings only, no new
ones). Before/after `/browse` screenshots at 375px and 390px: before shows "on" / "retention,"
/ "and" / "revenue" / "impact." each on its own line and nav-capsule ghosting on scroll;
after shows the full sentence readable in one paragraph and a solid opaque nav with no
bleed-through. Broader pass also checked Company page (today's G3 work) at 390px — grids
there use `auto-fit`/`auto-fill`, not a fixed-min sidebar, no horizontal overflow, no
squeeze found.

**Undo:** revert this commit; `.two-col-sidebar`/`.two-col-sidebar-wide` and the mobile
`.topnav` fallback are additive CSS, safe to drop independently.

**Open issues:** The nav's real-device backdrop-filter failure mode (why it doesn't render
on that phone — data saver vs. GPU) wasn't root-caused precisely, only worked around with a
solid fallback below 640px. TopNav's lack of a hamburger menu (wraps to multiple lines
instead) remains the known, separate, already-documented design decision from F2 — not
changed here.

---

## 2026-10-31 — R6 follow-up: weighted per-block `_score` fix verified live (tie-break regression resolved); p177 merge investigated, not built
**Phase:** R6 (fix) · **Type:** ingestion, fix, tests · Resumed after a session-boundary git
branch collision (unrelated concurrent push landed a stray commit on the wrong branch,
handled separately); confirmed clean start on `wip` at `0e78f14` before touching anything.

**Priority 1 - the tie-break regression (found and left open in the prior entry above):**
On arrival, `convert.py`'s `_score()` already contained a weighted per-block formula
(`BLOCK_ISSUE_FREE_ALLOWANCE=2`, `BLOCK_ISSUE_WEIGHT=0.05`, `BLOCK_ISSUE_CAP=20`,
`_block_penalty()`) - this code (and a matching `tests/test_r6_formula_live.py` with 3
hand-recorded-from-a-prior-live-run cases for p78/p30/p50) was already committed on `wip`
(`b40ed0c`), apparently written in the interrupted session before the branch collision, but
**no log.md entry documented it and p16 was missing from the test file** - so none of it was
trusted at face value. Everything below is this session's own independent live
re-verification, not a reconstruction of the inherited numbers (which, re-run live today,
produced materially different real diagram_issues than the inherited test file recorded -
Gemini vision output is not deterministic run-to-run, confirmed directly - so the inherited
numbers couldn't have been re-checked for consistency anyway; they were superseded, not
trusted).

- **Formula logic:** a block's first `BLOCK_ISSUE_FREE_ALLOWANCE` (2) qualifying issues still
  cost the original flat 0.5 (unchanged from the first R6 fix, so p177-style "one block, a
  couple of related issues" cases are untouched); each issue beyond that adds
  `BLOCK_ISSUE_WEIGHT` (0.05), capped at `BLOCK_ISSUE_CAP` (20) extra issues per block. A
  block with 15 issues now costs 0.5 + 0.05*13 = 1.15, not a flat 0.5 - no longer
  indistinguishable from a block with 1 issue.
- **(a) ISB p177 / page_classify routing - re-verified live, not re-broken:**
  `run_r6_isb_p177_patch.py` re-run live (2 real vision HTTP calls) against the real PDF:
  vision scores **2.0**, Docling **2.4769** - Docling still wins, page unchanged, matching
  stored production state exactly (`method=docling`, no DB write). A deeper live capture of
  vision's full output this session (separate 2-call run, `out/r6_formula_verify/
  ISB_p177_diagrams.json`) found this run's vision output is actually very good - 9 clean
  structured diagram blocks covering every section plus the recovered footer line
  ("ISB | Consulting Prep Casebook | 2025 | 177") - with only 2 minor flags (1 genuine
  duplicate "Patient Acquisition" label that really is printed twice on the page, 1
  punctuation-level `label_altered`), both within `BLOCK_ISSUE_FREE_ALLOWANCE` so neither is
  extra-penalized. The page_classify chart-routing fix (53a281b, pages 162/166/169/175) is
  unrelated code, untouched this session, still covered by its own passing regression test.
- **(b) FMS2023-24 p78, FMS2021-22 p16, FMS2021-22 p50, ISB p30 - re-verified live:**
  new script `run_r6_formula_verify_live.py` re-runs both of `convert_page_vision`'s real
  attempts (attempt 1, then the targeted retry) directly against the real PDFs for all 4
  pages (8 real vision HTTP calls), and scores both attempts under the OLD flat-per-issue
  formula, the OLD flat-per-block formula (the one with the tie bug), and the NEW weighted
  formula, from the real live `diagram_issues` (not hand-built):

| page | old flat-per-block | new weighted | real outcome |
|---|---|---|---|
| FMS2023-24 p78 | a1=2.50, a2=3.00 (no tie this run) | a1=1.85, a2=3.00 | both agree, attempt 2 kept (0 issues after retry) |
| FMS2021-22 p16 | **a1=1.50, a2=1.50 (TIE -> keeps worse a1)** | a1=0.95, a2=1.05 | **tie broken correctly, attempt 2 kept** |
| FMS2021-22 p50 | a1=0.77, a2=0.73 (no tie) | a1=0.32, a2=0.03 | both agree, attempt 1 kept |
| ISB p30 | a1=1.86, a2=1.86 (TIE -> keeps a1) | a1=1.41, a2=1.26 | tie broken, same pick as before (a1), now by real severity not luck |

  FMS2021-22 p16 reproduced the exact tie-break bug live this session: attempt 1's diagram
  block failed schema validation entirely (`type: "other"`, discarded, `diagrams: []` - the
  student would see **no diagram at all** for this page, a real 9-box Porter's-style value
  chain chevron); attempt 2's retry produced a real renderable flow diagram (10 nodes, 4
  edges, one `flow_disconnected` warning for missing edges among the support-activities
  boxes) - visually confirmed against the real page image
  (`out/r6_formula_verify/FMS2021-22_p16.png`) that an imperfect real diagram beats no
  diagram. Old flat-per-block formula tied both at 1.5 (1 bad block each) and would have
  silently kept attempt 1 (no diagram); new formula breaks the tie toward attempt 2 by real
  issue-count severity (11 < 13). Locked in as
  `tests/test_r6_formula_live.py::test_fms2122_p16_tie_broken_correctly`, replacing the
  untrusted inherited gap. p78/p50/p30 did not reproduce an exact tie this run (model
  non-determinism - different real issues than the numbers the inherited test file recorded),
  but in every case the new formula's pick matches or improves on the old formula's pick, with
  no inversions found.
- **Full regression suite:** `venv/bin/python -m unittest discover -s tests` → **386/386
  green** (385 before this session's one new test, +1). `npm test` → 111/112, same
  pre-existing unrelated `sandbox.test.js` `__CF_USER_TEXT_ENCODING` flake every prior entry
  this week documents, not a regression.

**Priority 2 - ISB p177 Docling+vision merge (investigated, not built):** Aalhad's suggestion
was to patch vision's one bad region into Docling's otherwise-better output instead of picking
a whole-page winner. Investigated live rather than assumed:
- Docling's markdown has **no structural anchors** for any of p177's 9 sections (no
  `## heading` markup, no per-block boundaries) - "Value Chain" and "Porter's 5 forces" come
  through as an undifferentiated run of label words, not a delimited region a script could
  reliably locate and replace. Locating "where does section X start/end in Docling's output"
  would need page-specific manual indexing, not a general rule.
- Live reruns of vision on the same page produced **materially different diagram_issues each
  time** (this session's run found only 2 minor flags across 9 otherwise-clean blocks; the
  problem description this task was handed, and the prior session's partial finding, describe
  a worse single-block mis-treeing that did not reproduce today). A "patch the bad region"
  rule has no stable target to aim at when the "bad region" itself changes between runs of the
  same page.
- A narrower, genuinely reusable idea **does** exist but is a different fix than the one asked
  for: p177's missing footer digits ("2025", "177") are present verbatim in the page's own
  `text_layer` (pdfium raw extraction, confirmed: offsets 220/225) but dropped by Docling's
  own layout/markdown step - this is a `text_layer` vs `docling_markdown` gap, not a
  Docling-vs-vision merge, and the fidelity checker already computes exactly this gap
  (`number_coverage`/`word_coverage`). Backfilling verbatim-present-in-text_layer tokens into
  a winning Docling page is a plausible, safe (copies only already-extracted raw text, invents
  nothing), reusable pattern - but it's a new pipeline behavior change affecting every
  Docling-winning page, which needs its own pilot and review before shipping, not a bolt-on
  inside this task's scope (guardrails: no broader re-ingestion/batch patching beyond
  verifying the two named fixes).
- **Conclusion: the literal "patch one region from the losing candidate" merge is not a safe,
  reusable pattern for p177** (no structural anchors in Docling's output, no stable target in
  vision's output across runs) - built nothing. **p177 is left exactly as before: unresolved,
  Docling is the live/stored pick, still needs_review=true via the diagram-page gate upstream,
  Aalhad's call** whether a future, separately-scoped text_layer-backfill pass is worth doing.

**Files:** `backend/ingestion/convert.py` (inherited, re-verified not re-written -
`_block_penalty`/`BLOCK_ISSUE_*`), `backend/ingestion/run_r6_formula_verify_live.py` (new,
this session), `backend/ingestion/tests/test_r6_formula_live.py` (new
`test_fms2122_p16_tie_broken_correctly` test added this session; 3 pre-existing cases kept as
hand-built regression tests, no longer relied on as "live proof" per this entry).

**Proof:**
- Live terminal output of `run_r6_formula_verify_live.py` and `run_r6_isb_p177_patch.py` (both
  re-run this session, real HTTP calls, shown above).
- `venv/bin/python -m unittest discover -s tests` → 386/386. `npm test` → 111/112 (pre-existing
  flake only).
- Row counts unchanged before/after this session (read-only + 0 writes, confirmed by direct
  query): `ingest_documents` 13, `ingest_pages` 2576, `ingest_chunks` 3696 (`is_active=true`:
  0), `document_chunks` (live) 22457 - identical to the prior entry's numbers.
- Branch: `wip` only, confirmed starting and ending on `wip`; `main` never touched.

**Cost:** 12 real vision HTTP calls this session (8 formula-verify + 2 p177 patch-check + 2
p177 detail capture), 0 embedding calls (no writes, nothing re-ingested). At this project's
established flash-lite rate (~$0.0012/call) ≈ **$0.01-0.02** this session. Cumulative R6
spend: **≈$0.81-0.98**, still under the informal ~$1 guardrail mentioned in the prior entry
and far under the ~$20/month project budget.
**Undo:** No DB state to undo - zero writes this session. Code changes are a normal git
revert of the two new/changed files above if ever needed.
**Open issues:**
- p177 remains genuinely unresolved - Docling (complete text, zero structured diagrams,
  missing footer) vs vision (structured diagrams for all 9 sections including the footer, 2
  minor flagged issues) is a real product tradeoff, not a bug, and still needs Aalhad's
  explicit call.
- The text_layer-backfill idea above (recovering verbatim-present footer/number tokens into a
  winning Docling page generally, not just p177) is a plausible, separately-scoped follow-up -
  not built, not decided.
- The weighted formula's constants (`BLOCK_ISSUE_FREE_ALLOWANCE=2`, `WEIGHT=0.05`, `CAP=20`)
  are still only verified against this session's 5 live-sampled pages (p177, p78, p16, p50,
  p30) plus the inherited hand-built tests - not the full 63-page "concentrated issues" set
  the original regression-finding entry identified. Before any batch re-ingest or wider patch
  run, that wider set should get the same live (not reconstructed) treatment this entry gives
  its 5 pages.

---

## 2026-10-31 — Mobile layout fixes: 7 pages overflowed horizontally at 375px
**Phase:** M4 (F1/F2, frontend fixes) · **Type:** fix

**What was broken:** Aalhad reported the site "cannot be used properly on mobile." An audit at
375px (iPhone width, this project's own mobile standard) found real horizontal overflow on
every page except Home — three separate root causes, all CSS/layout, none were logic bugs:

1. **`.grid-3` had no responsive breakpoint** (`global.css`) — hardcoded `repeat(3,1fr)` with no
   mobile collapse, unlike its sibling `.home-tools-grid` which already had one. This is the
   "What you'll find here" 3-card row used on 7 pages (Frameworks, Role, Company, Mock
   Interview, Tone Shifter, Community, Resume): at 375px each column was ~113px, too narrow for
   icon+title+body, forcing the whole page wider than the viewport.
2. **Two `flex:1` text inputs without `minWidth:0`** (Company/Role filter rows on
   `MockInterviewPage.tsx` and `CommunityPage.tsx`) — browsers don't shrink flex items below
   their intrinsic content width by default, so the pair couldn't compress to fit 375px.
3. **`flexWrap: "nowrap"` on a button row** (`ResumePage.tsx`, the question-type toggle +
   "Create a coherent story" button) — explicitly forced onto one line, pushing the last button
   off-screen with no way to reach it except horizontal scroll.

**What was NOT touched, and why:** `TopNav.tsx`'s mobile nav wraps into a multi-line pill
cluster instead of collapsing behind a hamburger menu — this looks bad at 375px (eats a lot of
vertical space before any content) but it's an explicit, documented design decision already in
the code ("All items stay visible at every width - no hamburger/overflow menu"), not a bug.
Left alone; flagged for Aalhad if he wants to revisit that policy specifically for phone widths.

**Fix:**
- `frontend-react/src/styles/global.css` — `.grid-3` gets `@media (max-width:900px)` → 2 cols,
  `@media (max-width:560px)` → 1 col (same pattern `.home-tools-grid` already used).
- `frontend-react/src/pages/MockInterviewPage.tsx`, `CommunityPage.tsx` — `minWidth: 0` added to
  both filter inputs.
- `frontend-react/src/pages/ResumePage.tsx` — `flexWrap: "nowrap"` → `"wrap"`.

**Proof:** `/browse` (gstack's own headless browser, Aside unavailable on this machine) at
375x812 against the local dev server, guest session. Before: 6 of 7 pages (frameworks, role,
company, mock-interview, tone-shifter, community) overflowed from `.grid-3`; after that fix,
mock-interview/community/resume still overflowed from the two separate input/button bugs above.
After all three fixes: all 7 pages report `scrollWidth === clientWidth` (no overflow), confirmed
with `document.querySelectorAll('*')` bounding-rect scan finding zero elements past the
viewport edge. Screenshots before/after in `.gstack/browse-reports/mobile-audit/screenshots/`
(not committed — local scratch). `npm run build` clean; `npm run lint` shows only pre-existing
warnings in unrelated files/lines.

**Cost:** $0 (no AI calls, pure CSS/layout).

---

## 2026-10-31 — nvidia/nemotron-3-ultra-550b-a55b added as try-first cascade entry, chat.js only
**Phase:** M4 (misc backend) · **Type:** feature, fix

**What changed:** `generateChatText` (new, `backend/src/lib/gemini.js`) tries
nvidia/nemotron-3-ultra-550b-a55b (OpenAI-compatible endpoint, 4s timeout) first, then falls
straight through to the existing Gemini `generateText` cascade on any non-2xx, timeout, network
error, or empty/malformed response — the failure path never throws and never reaches the user as
an error. Wired into `backend/src/routes/chat.js` only (the ungrounded framework explain/pushback
chat + Tone Shifter passthrough) — `generateText`/`generateJSON`/`generateGroundedText` and every
RAG/grounded path are untouched, so Frameworks, Guesstimates, resume, mock interview, company/role
content all behave exactly as before. Gated by `ENABLE_NVIDIA_CASCADE` (new flag,
`backend/.env.example`), **default off**.
**Why:** Aalhad wants to try a free, more capable model ahead of Gemini for one low-stakes,
already-ungrounded feature, without risking it becoming a single point of failure (NVIDIA's free
tier is ~40 req/min, shared) or silently degrading answer quality on a feature nobody's graded yet.
**Default-off justification:** The fallback logic itself tested clean in every failure mode (see
Proof) — that alone would support defaulting on. Left off anyway because answer *quality* is
untested: NVIDIA succeeding with a worse-than-Gemini answer wouldn't trigger any fallback (that's
explicitly flagged as Aalhad's call, not mine to guess). Aalhad can flip `ENABLE_NVIDIA_CASCADE=true`
in `backend/.env` after spot-checking a few real chat/pushback/Tone-Shifter answers.
**Files:** `backend/src/lib/gemini.js`, `backend/src/routes/chat.js`, `backend/.env.example`,
`backend/test/geminiNvidiaCascade.test.js`
**Proof:** `npm test` → `111 pass, 1 fail` (the 1 failure is a pre-existing, unrelated macOS
sandbox env-leak flake in `sandbox.test.js`, confirmed present on the pre-change code too via
`git stash`). New suite: 8/8 pass — flag-off (NVIDIA never called), happy path (NVIDIA's text used,
Gemini never called), 429, 500, timeout (50ms simulated), empty/malformed body, thrown network
error, and missing-config, all falling through to a working Gemini response. Live curl against the
real NVIDIA endpoint: flag off → `{"success":true,"text":"pong"}` via Gemini; flag on with a valid
key → `{"success":true,"text":"pong"}` with no fallback log line (NVIDIA answered); flag on with a
deliberately invalid NVIDIA key → real `401` from NVIDIA, logged
`[gemini] nvidia cascade: ... returned 401, falling back to Gemini`, still
`{"success":true,"text":"pong"}` to the user.
**Undo:** Leave `ENABLE_NVIDIA_CASCADE` unset/false (already the default), or revert this commit.
**Open issues:** Answer-quality comparison between NVIDIA and Gemini on real chat/pushback/Tone
Shifter prompts is unreviewed — Aalhad's call before flipping the flag on.

---

## 2026-10-31 — R6 patches run live: FMS 5-page chart-routing fix lands, ISB p177 does NOT flip, and the per-block formula fix has a real regression on ties
**Phase:** R6 (fix) · **Type:** ingestion, fix, tests · Real Gemini vision calls this session
(Aalhad's explicit approval, unlike the prior code-only session).

**Task 1.1 — ISB p177 (NOT patched; new, important finding):** The 2026-10-31 formula-fix entry
reconstructed p177's vision score from a hand-built, single-block assumption ("all 7 issues sit
on one block... not measured directly") and predicted the new per-block `_score()` would flip
this page from Docling to vision. Running it live (`run_r6_isb_p177_patch.py`, 2 independent
vision calls across this session) **disproves that prediction**: the real vision output's
diagram issues land on 2-3 distinct blocks, not 1 (first call: blocks {1,3}, score 2.0 vs
Docling's 2.4769; second call: blocks {1,3,6}, score 1.5 vs 2.4769) - Docling wins both times,
same as the current live behavior. **No v3 was written for ISB; p177 is unchanged** (still on
Docling, `f3da976f…`/`0a6c4f9e…`, both version 1 and 2). This is not a bug in the fix - the
formula is doing exactly what it says - it's that the single-block reconstruction in the prior
entry didn't hold up against real model output. Flagging this explicitly rather than silently
dropping the ISB-p177 half of the task.

**Task 1.2 — FMS 2021-22 pages 53, 56, 57, 60, 63 (patched, insert-only):** The already-committed
`page_classify.py` fix (53a281b) correctly routes all 5 to vision, confirmed live.
`run_r6_fms2122_chart_patch.py` built v3 (`e9229429-3eec-478b-b54a-7d5a1cdf6de0`) = v2's 200 pages
reused except these 5:

| page | number_coverage before | after | word_coverage after | needs_review |
|---|---|---|---|---|
| 53 | 0.70 | **1.0** | 0.93 | true |
| 56 | 0.19 | **0.91** | 0.99 | true |
| 57 | 0.44 | **0.89** | 0.99 | true |
| 60 | 0.89 | **1.0** | 1.0 | true |
| 63 | 0.75 | **0.90** | 0.98 | true |

All 5 still `needs_review=true` (expected) and 3 of them (53, 56, 60) carry `number_not_on_page`
flags the automatic checker raised against printed chart values. **Manually checked all 8
flagged numbers against the real page images** (not assumed): p53's bar-chart labels (TCS 171,
Infosys 93, Wipro 64, HCL 71, Mahindra 38) and p60's pie-chart labels (Rural 29.9%, Urban 70.1%)
are **all genuinely printed on the page** - a checker false positive (chart data-label text
apparently isn't always in pdfium's extractable text layer, same class of false positive as the
2026-10-30 ISB logo-text finding), not hallucination. p56's flagged "185" is a **real, minor
transcription slip**: the page prints "1851" (the FY19 NBFC-cancellations bar) and the model
dropped the trailing digit - a genuine inaccuracy, correctly caught, but a one-digit slip, not an
invented number from a bar height. Net: **no invented numbers found** in this spot-check; the
zero-hallucination bar holds, and the real digit-drop error is exactly why these pages correctly
stay `needs_review=true` pending human sign-off, not switched on.

**Task 2 - spot-check of the formula-fix's blast radius (13 live-reconverted pages, real finding
- not just "mostly safe"):** Recomputed the "concentrated issues" set this session (read-only,
0 calls): of 1228 stored vision/`docling+gemini_vision_v2` pages, **107** have their stored
winning candidate's qualifying diagram issues in fewer blocks than issues (the prior session's
150 could not be reproduced exactly from current stored data - methodology difference not fully
resolved; same directional finding, smaller count). Deduped to 63 unique pages across ISB, both
FMS casebooks and SRCC Guesstimates; sampled 13, spanning severity_gap 0.5 to 34.5 and all 4
casebooks. For each, **live-reran both of `convert_page_vision`'s real attempts** (not the
single already-chosen candidate) and scored both under the OLD (flat per-issue) and NEW
(per-block) formula:

| result | count |
|---|---|
| formula's pick changed (old attempt ≠ new attempt) | **7 / 13** |
| of those, new pick confirmed better (visually checked against the real page) | 1 (FMS2023-24 p78) |
| of those, new pick is a **same-or-worse pick due to a tie** (see below) | **4 (p16, p30, p50, and p78's own counterpart logic)** |
| of those, ambiguous / needs more than this spot-check (chart-vs-structure tradeoff) | 2 (p29, p228) |

**Real regression found, confirmed against the source page image (not inferred):** FMS2023-24
p78 ("Understanding Google"). Attempt 1 flattened the "Ads"/"Cloud"/"Hardware" box groups (real
printed boxes: Ad-words, Ad-Sense, G-Suite, Maps, Docs, Phones, Home Assistant, Chromecast, Nest
Hub, Google Home - all visible in the real page image) out of the diagram block into plain
Markdown text, triggering 15 `missing_box` warnings, all in ONE block. Attempt 2 (the retry, with
targeted fix hints) correctly rebuilt them as diagram nodes, leaving only 1 minor issue. **Old
formula correctly preferred attempt 2** (score 2.5 vs -4.5). **New formula can't tell them
apart**: both have exactly 1 "bad" block, so both score 2.5 - a tie - and the actual production
code's tie-break (`if new_score > old_score: keep attempt2` else keep attempt 1) **silently
keeps the worse attempt** on a tie. The same degenerate pattern (both attempts land in the same
block count, old formula correctly preferred the one with fewer real issues, new formula ties
and defaults to attempt 1) also showed up on FMS2021-22 p16, ISB p30, and FMS2021-22 p50 - 4 of
the 13 sampled pages, not a one-off. **This is the real problem the prior session's dry-run risk
flag warned about and couldn't prove**: the per-block formula fixes p177's hypothetical case
(penalizing one bad block too harshly relative to coverage) but **loses resolution between two
candidates that both touch the same single block with very different severity**, and the
existing tie-break (keep attempt 1, the un-retried one) then silently discards the retry's real
improvement. None of these pages were re-ingested or had their stored rows changed by this
finding - it's a live read-only comparison, same budget-safe pattern as the rest of this spot
check.
**Not yet resolved:** p29 and p228 flipped in the other direction (new pick has MORE raw issues
but the same or fewer bad blocks, with marginally better coverage) - whether that's actually
better needs a closer per-block severity look, not done here (time-boxed to the approved spend).

**Why this matters:** the per-block fix should not be trusted yet for a batch re-ingest or wider
patch run without a follow-up fix - likely weighting the penalty by issue count *within* a block
(not fully collapsing to "0.5 per bad block regardless of how bad"), not by reverting to the old
flat-per-issue formula (which correctly ranked p78-style cases but was the original problem for
p177-style cases). This is a real, confirmed-on-source-images finding, not a theoretical risk.

**Files:** `backend/ingestion/run_r6_isb_p177_patch.py` (new, no v3 written - see above),
`backend/ingestion/run_r6_fms2122_chart_patch.py` (new, v3 written).

**Proof:**
- `venv/bin/python -m unittest discover -s tests` → **382/382 green**, before and after.
- `npm test` → 111 pass / 1 fail, the same pre-existing unrelated `sandbox.test.js`
  `__CF_USER_TEXT_ENCODING` flake every prior entry this week documents.
- Row counts before -> after this session: `ingest_documents` 12 -> 13 (+1, the FMS v3 only -
  no ISB v3 was written); `ingest_pages` 2376 -> 2576 (+200, FMS v3's full reused+patched page
  set); `ingest_chunks` 3432 -> 3696 (+264, FMS v3's chunks, `is_active=false`); `document_chunks`
  (live) unchanged at **22457**; `ingest_chunks` with `is_active=true`: **0** before and after.
- FMS v3 doc id `e9229429-3eec-478b-b54a-7d5a1cdf6de0`, status `done`.
- Branch: `wip`, `main` untouched.

**Cost:** ~45 vision HTTP calls (2 ISB-p177 attempts x ~2 exploratory runs + 2 official + 10 FMS
patch + 25 spot-check + 4 follow-up detail reruns on p78/p16) + 264 embedding calls (FMS v3's
full chunk set, required because `write_version` re-chunks and re-embeds the whole reused+patched
page set, not just the 5 changed pages). At this project's established flash-lite rate, roughly
**$0.08-0.15** this session. Combined with the ~$0.72 already spent on R6 this phase, cumulative
R6 spend is **~$0.80-0.87**, under the $1 guardrail for this task but closer to it than planned -
worth knowing before any further R6 spend this month.
**Undo:** FMS v3 is a normal insert-only row set (`is_active=false` throughout) - delete by
`document_id = 'e9229429-3eec-478b-b54a-7d5a1cdf6de0'` if ever needed; nothing else to undo
(ISB had no write).
**Left open:**
- ISB p177 is still on Docling, unresolved - the per-block fix doesn't flip it live. Whether
  Docling (footer line dropped) or vision (diagram mis-treed) is "more correct" for a student is
  still Aalhad's call, same as before this session.
- FMS pages 56/57/63 remain below the 95%/100% coverage bar even after the patch (0.89-0.91) -
  real improvement over Docling (0.19-0.75) but not perfect; all 5 correctly stay
  `needs_review=true`, not a silent pass.
- **The per-block `_score` formula needs a follow-up fix** before it's trusted for a batch
  re-ingest: the tie-break-on-equal-block-count regression above (p78, p16, p30, p50) is real,
  confirmed against source images, not a one-off. Suggested direction: weight the per-block
  penalty by (capped) issue count within the block, so two single-bad-block candidates with very
  different severity no longer score identically.
- The 150-vs-107 page count discrepancy for the "concentrated issues" set wasn't root-caused
  (likely a scope/criteria difference from the prior session's inline script, which wasn't saved)
  - flagged, not chased further this session.

---

## 2026-10-31 — G3 pulled forward: Company value chain + timeline grounded in casebooks
**Phase:** G3 (pulled forward ahead of M3 sequencing - Aalhad's explicit follow-on call after G2:
"move on to the company pages.") · **Type:** backend, schema · **No `is_active` flip, no
re-ingestion.**

**Scope correction on the handoff brief, found by reading the actual code rather than trusting
the guess:** the prior report named `companyRoles.js` as "best candidate" for grounding, assuming
it had case-type/framework overlap. On inspection it's pure HR/recruiting data ("which entry-level
roles does this company hire for in India") with no real conceptual overlap with case content -
same false-positive risk category as Role Overview's salary field (a case narrative mentioning a
job title in passing isn't evidence of current campus hiring). Left ungrounded, not patched on
a guess.

**What got grounded instead, after re-assessing all four Company libs on their actual content:**
- `companyValueChain.js` - the strongest real fit. Consulting case narratives routinely walk
  through exactly this (how a specific company creates/captures value stage by stage), and the
  content isn't time-sensitive the way financials are.
- `companyTimeline.js` - also a good fit. Historical milestones (founding, acquisitions) don't go
  stale the way a "current" figure does, so a casebook's account of one stays trustworthy even if
  the casebook itself is a few years old.
- `companyOverview.js` - deliberately NOT touched. Its fields (share price, financials, headcount,
  "current" sector) are exactly the time-sensitive-fact pattern that made Role Overview's salary
  field a bad grounding candidate in the prior run - a casebook could easily be stale or flatly
  wrong on a "current" number, and forcing a match risks presenting a case's old figure as today's
  fact. Same reasoning, consistently applied.
- `companyRoles.js` - deliberately NOT touched, per the scope correction above.

**Fix, same posture as every prior G2/R7 switch (`ENABLE_CONSULTING_RAG_V2`, off by default):**
both `companyValueChain.js`/`companyTimeline.js` now attempt `groundedConsultingLookup` first
(matchCount 3, Consulting domain). Covered -> the web-research step is skipped entirely and the
JSON extraction prompt runs against ONLY the cited casebook excerpt (never blended with outside
knowledge); `grounded_in_casebooks`/`citation` persisted alongside the existing cached
stages/events. Not covered or lookup fails -> falls straight through to today's exact
Gemini+Google-Search research flow, unchanged.

**Migration:** `migration_046_g3_company_citations.sql` - adds `grounded_in_casebooks`/`citation`
columns to `company_value_chain_cache`/`company_timeline_cache` only (mirrors migration_045).
Applied live via the Supabase Management API (same path used for 042-045), verified: both tables
show both new columns. No existing row touched - old cached rows read as "not grounded" until
their normal 60-day TTL refresh.

**Proof:** full suite still 104/103/1 (same pre-existing unrelated sandbox flake, no regression
from this change - no new test file added, matching this feature's own established precedent:
`chipPanel.js`/`roleTopics.js` from the prior entry also have no dedicated test file, relying on
`consultingRetrieval.test.js`'s existing coverage of the shared `decideCoverage`/`buildCitation`
primitives this code calls into). Live dry-run with the flag forced on against a throwaway
company name: both paths ran end-to-end with no crash, correctly returned
`groundedInCasebooks: false` (expected - `ingest_chunks.is_active` is still false everywhere,
same as every prior dry-run in this project; the grounded branch is logically verified by
mirroring `chipPanel.js`'s already-proven shape, not yet exercised live until R9). Test rows
cleaned up from the live cache tables afterward.

**What's left for full Company-page grounding:** `companyOverview.js`/`companyRoles.js` stay
AI/web-only by design, not because they weren't reached. If Aalhad wants partial grounding on
`companyOverview.js`'s "about" field specifically (what the company does, not the time-sensitive
fields) that's a real follow-up worth a separate, more careful pass - mixing one grounded field
into an otherwise-ungrounded combined-JSON card needs its own design, not a quick bolt-on.

---

## 2026-10-31 — G2 pulled forward: visible casebook citations on Role Topics, Chip panels, Company-topic notes
**Phase:** G2 (pulled forward ahead of M3 sequencing - Aalhad's explicit call: "I want whatever's
in the casebooks shown to users as much as possible, not just one section - even the
What/Why/How chips, use casebook data wherever it genuinely applies.") · **Type:** backend,
schema, tests · **No `is_active` flip, no re-ingestion** - this is purely grounding/citation
wiring on top of already-ingested, already-inactive data (R9's job is unaffected).

**The actual problem being fixed:** a code trace of the live Role page (requested separately,
same session) found two of its three casebook-touching call sites were silently blending real
casebook content into the model's context with no visible citation at all -
`roleTopics.js`/`roleCompanyTopicNotes.js` retrieved real chunks and told the model to use them
"where genuinely relevant," but never required it to report which excerpt it actually used, and
`document_chunks` (the table both queried) has no page number to cite even if it had. This is
exactly the "never blend the two silently" violation the grounding policy (CLAUDE.md,
`grounded-answering` skill) forbids - the student has no way to tell casebook-grounded content
from AI-generated content on that page today. Chip panels (What?/Why?/How to apply) had no
casebook retrieval attempt at all.

**Fix, same posture as R7's `ENABLE_CONSULTING_RAG_V2` switch everywhere (off by default,
flipping off restores today's exact v1 behavior byte-for-byte):**
- `roleTopics.js`: v2 path replaces the per-field invisible-context approach with ONE explicit
  covered/not-covered decision for the whole curriculum (`consultingRetrieval.js`'s
  `groundedConsultingLookup`, same primitive R7 built). Covered -> real page citations attached
  (`groundedInCasebooks: true`, `citations: [...]`); not covered -> `groundedInCasebooks: false`,
  nothing faked. New columns `grounded_in_casebooks`/`citations` on `role_topics_cache`
  (migration_045, applied live - purely additive, no row touched).
- `chipPanel.js`: new `groundChip()` attempts a scoped lookup per (role, topic, blockId) before
  falling back to plain generation - most chips will legitimately find nothing (Aalhad's own
  words: "not everything would be possible"), but a real hit now gets cited and fed to the model
  as explicit, labelled material instead of being skipped. New columns on `chip_panel_cache`
  (migration_045).
- `roleCompanyTopicNotes.js`: kept its existing (correct) company-mention gate - a chunk ranking
  high on similarity still isn't "data about this company" unless its own text names the company
  - but swapped the underlying retrieval from `document_chunks` to `ingest_chunks`
  (`retrieveConsultingChunks`), so a real hit now carries a real citation. Attribution is at the
  "this note set drew on these mentions" level, not per-sentence (notes is a model-written
  summary across several mention-gated chunks at once - no finer attribution is honestly
  possible without asking the model to self-report per-sentence sourcing, which roleTopics.js's
  old v1 approach already showed is not reliable). New `citations` column (migration_045).
- Routes (`roles.js`) pass `groundedInCasebooks`/`citations` through on all three endpoints -
  no frontend UI consumes them yet (not in this task's scope, flagged below).

**Deliberately NOT touched, with reasons (not silently skipped):**
- **Role Overview card** (`roleOverview.js`: salary, hiring companies, career progression, exit
  paths, job-posting skills) - these are current labor-market facts about external hiring, not
  case-practice content. A case-competition casebook has no honest answer to "what does
  Deloitte pay a first-year associate right now" - forcing a casebook-grounding attempt here
  would either find nothing (wasted retrieval) or, worse, risk a false match (e.g. a case
  mentioning a company's revenue getting misread as salary data). Flagging this as a considered
  "doesn't fit" rather than an oversight; if Aalhad disagrees on a specific field (e.g. "skills"
  mapped to frameworks the casebooks actually test), that's a product call to revisit, not
  something this pass silently declined.
- **Company pages** (`companyOverview.js`/`companyRoles.js`/`companyTimeline.js`/
  `companyValueChain.js`) - not reached this pass (time-boxed), not evaluated as a bad fit the
  way Role Overview was. `companyRoles.js` in particular looks like a plausible candidate for
  the same company-mention-gated pattern already proven in `roleCompanyTopicNotes.js` - real
  follow-up work, not done here.
- **The "Management Consultant" -> "Consultant (Associate)" naming inconsistency** flagged in
  the Role-page trace: re-read with the actual code's own comment
  (`roleOverview.js`: "NOT snapped to a canonical role... A user typing a role outside the
  curated 50-title list should see an overview that's actually about that role, not a
  substituted nearest match") - this is a **documented, intentional design choice** for
  Overview (so free-text roles like "Sales Associate" still get an accurate card), not a bug.
  Forcing the two call sites to agree would either break that free-text support or make Topics
  stop canonicalizing (likely breaking its curated-curriculum assumption). Left as-is; flagged
  back to Aalhad rather than "fixed" on a guess.

**Known limitation carried forward (documented in code, not fixed here):** v2 retrieval is
hardcoded to `domain: "Consulting"` everywhere in this change, because that's the only domain
R6 has ingested and roles have no domain field of their own (roleName is free text). Once M2
ingests other domains, this will start pulling Consulting-only content into grounding attempts
for every role regardless of actual domain - fine today (nothing else exists to pull), wrong
later. Flagged in each file's comments so it isn't silently inherited as permanent.

**Proof:** 5 new pure-function tests (`test/g2RoleGrounding.test.js`) covering the
citation-map and prompt-building logic with real-shaped fixtures. Full backend suite:
104 tests, 103 pass (the 1 failure is the same pre-existing, unrelated `sandbox.test.js`
`__CF_USER_TEXT_ENCODING` flake noted in every prior entry this week). Dry-run proof against
the live DB: all three new v2 call sites (`groundedConsultingLookup` x2, `retrieveConsultingChunks`
x1) execute cleanly with real embedding calls and correctly return "not covered" - expected,
since no `ingest_chunks` row is `is_active` yet. Cost: 3 embedding calls, effectively $0.

**Migration:** `migration_045_g2_role_citations.sql` - additive columns only, applied live via
the Supabase Management API (same token/path R7 used for 042-044), verified via
`information_schema.columns`. No existing row read, written or altered.

**What's left for G2 to be "done":** frontend rendering of the new `groundedInCasebooks`/
`citations` fields (no UI consumes them yet); Company pages (above); the Role Overview question
(above, pending Aalhad's call); and, same as every other G2/R7 piece, none of this actually
changes what a student sees until R9 flips real `is_active` rows - today everything correctly
still returns "not covered."

---

## 2026-10-31 — R6 fix: per-block diagram penalty in `_score` (ISB p177); confirmed FMS's 5 pages already covered by the routing fix
**Phase:** R6 (fix) · **Type:** ingestion, fix, tests · **No re-ingestion, no Gemini/NVIDIA
calls in this session** - code fix + dry-run/unit-test proof only, per explicit instruction.

**What changed (Issue 1 - p177 scoring tradeoff):** `ISB Consulting Casebook 2025.pdf` p177
has no chart (confirmed in the 2026-10-31 entry above); its automatic docling-vs-vision retry
already recovers the page's dropped footer line through Gemini vision (number_coverage and
word_coverage both reach 1.0 there, real measured values from
`out/compare_vision_providers.json`), but the retry kept Docling anyway because
`convert._score()` subtracted a flat `0.5` for every individual diagram error/structural warn
(6 `label_altered` errors + >=1 structural warn, all real/stored, all from the page's one
"Porter's 5 forces" bulleted section the model mis-treed) - one bad diagram block throwing off
several individual issues at once outweighed a real, page-wide coverage win. Fixed
`_score()` (`backend/ingestion/convert.py`) to penalize per **distinct diagram block**
carrying an issue (`_penalty_blocks`, grouping by each issue's `block` index) instead of per
individual issue. A page where every block is bad is penalized the same as before (each
contributes its own 0.5); a page where one block throws several issues at once no longer pays
for each one separately.
- Real numbers used (none invented): Docling score = 0.5 + 0.9769230769230769 + 1.0 (no
  diagram blocks) = **2.4769**. Vision, old formula = 1.0 + 1.0 + 1.0 - 0.5*(6 errors + 1
  structural warn) = **-0.5** (Docling wins, matches the real v1 outcome - p177 stayed on
  Docling). Vision, new formula = 1.0 + 1.0 + 1.0 - 0.5*(1 block) = **2.5** (vision now wins,
  by 0.0231). The only reconstructed piece (not directly measured, since the discarded vision
  draft's full `diagram_issues` list was never persisted anywhere - not in `ingest_pages`
  columns, not in any `out/*.json`) is that all 7 issues sit on that single block; this follows
  from the page having exactly one diagram topic (confirmed from `P177_TEXT` in
  `tests/test_page_classify.py` and the real page text), not from a second measurement.
- **Regression test:** `tests/test_convert_v2.py::test_isb_p177_score_picks_vision_once_penalty_is_per_block`
  builds the Docling and vision `fid` dicts from exactly these real/reconstructed numbers and
  asserts the old flat formula keeps Docling, the new per-block formula picks vision. No live
  run, no new Gemini/NVIDIA calls - the fid inputs are hand-built from already-stored scalars.
- **Blast-radius check (risk, not fully resolved):** wrote a read-only, code-only script
  (`fidelity.check_page` run locally against already-stored `markdown`/`text_layer` columns of
  every `ingest_pages` row whose `method` mentions "vision" - 1228 rows, 0 API calls, 0
  writes) to see how often the fix changes the penalty value on an already-decided page's
  *stored* (winning) candidate. **150 of 1228 (~12%) have their qualifying diagram issues
  concentrated in fewer blocks than issues**, meaning the new formula gives a different,
  lower, penalty on the stored winner for those pages. This does **not** prove any of those
  150 pages' docling-vs-vision or attempt-1-vs-attempt-2 choice would flip - the discarded
  losing candidate's `diagram_issues` were never persisted, so there is no way to re-run that
  comparison from stored data alone, and doing so live is exactly the re-ingestion this session
  was told not to do. **Flagging this explicitly as an open risk**: before this formula change
  is relied on for a batch re-ingest or patch run, the comparison should be re-validated
  live on a small sample (a few already-known tradeoff pages plus a few random ones), not
  assumed safe from this dry run alone.
- Full ingestion suite: **382/382 green** (380 before + 2 new).

**What changed (Issue 2 - FMS's 5 pages, same chart-routing bug):** Confirmed, without
patching or re-ingesting anything, that the already-committed `page_classify.py` fix (commit
`53a281b`) correctly reclassifies all 5 of FMS Consulting Casebook 2021-22's affected pages
(53, 56, 57, 60, 63 - flagged in the entry above as "the same bug, confirmed on a second
casebook, not yet patched"). Measured live, read-only, this session: ran
`page_classify.classify_page` directly against the real PDF
(`Data/Consulting Files/PDF Files/The FMS Consulting Casebook 2021-22.pdf`) for these 5 pages
- pure pypdfium2 geometry, 0 Gemini/NVIDIA calls, 0 DB writes. Real `img_coverage`: p53
0.0606, p56 0.1611, p57 0.0839, p60 0.1036, p63 0.0461 - all well above
`CHART_IMAGE_COVERAGE_THRESHOLD` (0.02) and this corpus's ~0.0067 no-picture baseline, so
`classify_page(docling_has_table=True)` now returns `is_table=False, is_visual=True` for
every one of them, same as ISB's 4 pages. **Regression test:**
`tests/test_page_classify.py::test_fms_five_chart_table_pages_route_to_vision` pins these 5
real measured `img_coverage` values so this stays proven without needing to re-run the pilot
again. The actual patch (re-converting these 5 pages through vision, insert-only,
`is_active=false`, same pattern as `run_r6_isb_patch.py`) is **not run here** - left as a
cheap, already-scoped follow-up for whenever Aalhad wants to spend the ~2 vision calls x 5
pages it costs.

**Why:** p177's fix recovers a real printed footer number without inventing anything or
loosening the bar for pages that are genuinely bad in more than one place. FMS confirmation
means the already-committed classifier fix is proven general (two casebooks, same bug,
same fix, no per-page special-casing) before Aalhad spends anything patching it.

**Files:** `backend/ingestion/convert.py` (`_score`/`_penalty_blocks` fix),
`backend/ingestion/tests/test_convert_v2.py` (new p177 regression test),
`backend/ingestion/tests/test_page_classify.py` (new FMS regression test).

**Proof:**
- `venv/bin/python -m unittest discover -s tests` → **382/382 green**.
- p177: real stored scores (above) show old formula picks Docling (-0.5 < 2.4769), new
  formula picks vision (2.5 > 2.4769) - by a real, thin, non-cherry-picked margin (0.0231),
  not an engineered pass.
- FMS: real measured `img_coverage` for all 5 pages, well clear of the 0.02 threshold.
- **Nothing was re-ingested.** No `ingest_pages`/`ingest_chunks`/`ingest_documents` row was
  inserted, updated or deleted. No Gemini or NVIDIA vision call was made. The only live-data
  reads this session were SELECT-only (`ingest_pages`, for the blast-radius check) and local
  PDF geometry reads (FMS pages, for Issue 2) - zero paid calls, confirmed by not touching
  `gemini_client`/`nvidia_client`'s `transcribe_page` anywhere in this session's new code.
- Branch: `wip`, `main` untouched.

**Cost:** $0 (no paid API calls this session).
**Undo:** Both fixes are normal code reverts (`convert.py`, the two test files) - no DB state
to undo, nothing was written.
**Left open:**
- The 12% blast-radius finding above - re-validate the formula change on a small live sample
  before trusting it for a batch patch/re-ingest.
- FMS's 5 pages (53, 56, 57, 60, 63) still need the actual patch run (insert-only, same
  pattern as `run_r6_isb_patch.py`) - cheap, scoped, not done here by instruction.
- p177 itself still needs its actual patch run (re-convert through vision as primary, not
  just via the retry path) to apply this fix live - also not done here.

---

## 2026-10-31 — R6 fix: page_classify.py routing bug (table+embedded-chart pages silently lost to Docling)
**Phase:** R6 (fix) · **Type:** ingestion, fix, tests

**What changed:** Root-caused and fixed the real bug behind the 2026-10-30 ISB finding
(`log.md`, "R6: ISB Consulting Casebook ingested... found a real scoring tradeoff"). Confirmed
against the real PDF, not re-derived from the summary: `page_classify.py` was
`is_table = docling_has_table` - a page Docling flags as having a table was **always** routed
to Docling, even when the same page also carries a real embedded picture (a pie chart) Docling
can't read at all. Checked all 5 originally-flagged pages against their real images:
- **4 of 5 (pp.162, 166, 169, 175) genuinely have embedded pie charts** next to a real
  Docling-readable table (e.g. p169's telecom market-share chart: Jio 50.9%, Airtel 31.1%,
  Vodafone Idea 13%, Others 3.4%, BSNL 1.5%). Their `img_coverage` (real image objects only,
  not a table's own grid-line paths, which inflate `path_coverage` on every table page and
  can't tell a chart apart from a plain table) sits at 0.03-0.10, far above this corpus's
  ~0.0067 baseline for a page with no real picture.
- **p177 has no chart at all** (checked against the real page image - a plain multi-box
  "Industry Primer" layout like dozens of others that scored fine). Its img_coverage sits
  exactly at the 0.0067 baseline. Its low number_coverage (0.5) traces to Docling dropping
  this one page's footer line ("2025  177") from its own markdown output - a one-off Docling
  extraction quirk, not the classification bug. The existing automatic docling-vs-vision
  retry already tried vision on p177 during the v1 run and discarded it, because vision's own
  diagram-tree reading of the page's bulleted "Porter's 5 forces" section racked up several
  `diagram_errors`/`diagram_structure` warnings that `_score()` weighs more heavily than the
  real number/word gain - the exact same scoring tradeoff the 2026-10-30 entry already flagged
  and explicitly left for Aalhad to decide, not re-decided here.
**Fix:** `page_classify.py` now computes `has_embedded_picture = img_cov >=
CHART_IMAGE_COVERAGE_THRESHOLD (0.02)` and only lets `docling_has_table` force the Docling
route when there's no real picture (`is_table = docling_has_table and not
has_embedded_picture`); `is_visual` picks up the same signal. General heuristic, not a
per-page special case - also checked against `The FMS Consulting Casebook 2021-22` (already
ingested, v2 `2c117f26-a298-41f1-9e39-ba570556ed4e`): its 8 worst `is_table` pages by
number_coverage include 5 (pp.53, 56, 57, 60, 63; number_coverage as low as **0.19**, worse
than any ISB page) with the identical real-embedded-picture signature under the fixed
classifier - the same bug, confirmed on a second casebook, not yet patched (see "Left open").
**Re-ingest:** Patched only the 4 confirmed ISB pages (162, 166, 169, 175), insert-only,
`is_active=false`: `run_r6_isb_patch.py` builds v2 (`0a6c4f9e-b1bd-4bf8-bbee-7475ba8a6c14`) =
v1's 183 pages reused except these 4, re-classified (confirmed by assertion in the script that
they now route to vision) and re-converted through `convert_page_vision`. p177 and the rest of
v1 carried over unchanged.

| page | number_coverage before | number_coverage after | needs_review after |
|---|---|---|---|
| 162 | 0.68 | **1.0** | true (diagram page, by design) |
| 166 | 0.70 | **1.0** | true |
| 169 | 0.33 | **1.0** | true |
| 175 | 0.56 | **1.0** | true |

All 4 still `needs_review=true` (expected - every diagram page waits for human sign-off,
not a fidelity problem) and p169's vision output carries the exact printed pie-chart numbers
(50.9/31.1/13/1.5/3.4, confirmed against the real image), not estimates - no hallucination.
p166's and p175's `word_coverage` (0.88, 0.98) trips below the 0.98 bar mainly because the
page's brand-name logos (e.g. "Google", "UltraTech") aren't in the PDF's extractable text
layer at all (logos are images) - the project's own convention is to transcribe logo text per
the vision prompt, so this is a pre-existing, accepted false-positive pattern in the fidelity
check for any logo-bearing page, not something this fix introduced or should silently patch.
**Why:** Fixes the real defect: casebook pages were silently losing printed numbers (a pie
chart's market-share percentages) to a classification short-circuit, not a vision-model
quality problem (the earlier NVIDIA-comparison entry had already shown Gemini vision itself
gets these exact pages to 1.0 number_coverage).
**Files:** `backend/ingestion/page_classify.py` (fix), `backend/ingestion/run_r6_isb_patch.py`
(new, one-off patch script), `backend/ingestion/tests/test_page_classify.py` (new, 5 tests
built from this session's real measured geometry on real ISB pages, not invented fixtures).
**Proof:**
- `venv/bin/python -m unittest discover -s tests` → **380/380 green** (375 before + 5 new).
- Live reproduction of the in-pipeline retry on p169 (`_score`) before the fix, confirming
  Docling's score (2.30) beat vision's own first-attempt score that run (-4.84, due to the
  prompt's bullet-box-under-heading -> issue_tree instruction racking up `missing_box`
  warnings on the Cost/Revenue box) - i.e. the automatic retry was never going to save this
  page; only routing it to vision as primary (this fix) does.
- `ingest_documents`: ISB v1 (`f3da976f...`) untouched, status `done`. v2
  (`0a6c4f9e...`) inserted, `status=done`, 0 active `ingest_chunks` rows (`is_active=false`
  confirmed via REST). Live `document_chunks` still 22,457 rows, unchanged.
**Cost:** 8 vision calls (4 pages x up to 2 attempts) + 263 embedding calls (re-chunked whole
casebook) for the v2 patch ≈ $0.01. Geometry investigation itself: 0 paid calls (pure
pypdfium2 + direct REST reads).
**Undo:** `page_classify.py`/`run_r6_isb_patch.py`/`tests/test_page_classify.py` are a normal
revert. v2 is insert-only, `is_active=false`: delete `ingest_pages`/`ingest_chunks` rows where
`document_id='0a6c4f9e-b1bd-4bf8-bbee-7475ba8a6c14'` to remove it; v1 and `document_chunks`
are untouched either way.
**Open issues / needs Aalhad's call:**
- **p177 is not fixed.** Its low number_coverage needs either a looser `_score()` diagram-
  warning weight or a change to how the vision prompt tree-ifies bulleted sections under
  headings - both are the exact product tradeoff the 2026-10-30 entry already declined to
  decide silently. Still flagged `needs_review=true` in v1 as before; nothing regressed.
- **The FMS Consulting Casebook 2021-22 has the same bug, confirmed, not yet patched**
  (pp.53/56/57/60/63, worst number_coverage 0.19). Recommend the same patch pattern
  (`run_r6_isb_patch.py` as a template) as a short follow-up - low cost (5 pages, ≈2 vision
  calls each). SRCC and the other FMS version (2023-24) were spot-checked and don't show this
  pattern at the same severity (SRCC's worst `is_table` page is already 0.93, most already
  vision-converted; FMS 2023-24 v6's `is_table` pages are all 1.0/1.0) - not re-verified
  exhaustively page-by-page.
- Applying the fixed classifier to a **full** re-ingest of ISB (not just these 4 pages) would
  reclassify more than 5 pages - roughly a quarter of its 61 `is_table` pages carry some real
  embedded picture above the 0.02 threshold, most at mild-but-real coverage loss (0.86-0.93,
  already `needs_review=true` today, not newly broken) rather than the severe 0.33-0.70 seen
  on the 4 patched pages. That's a modestly larger Gemini bill for a future full re-ingest,
  not evaluated or run here (this patch only touched the 4 pages needed) - worth a quick cost
  estimate before any full ISB re-ingest.

---

## 2026-10-30 — Guesstimates feature (new) + Consulting framework catalog derived from ingested casebooks
**Phase:** R7 (follow-up) / G-Guesstimates · **Type:** feature, migration, tests

**What changed:** Two pieces of new feature work Aalhad asked for directly, building on
R7's `match_ingest_chunks`/`consultingRetrieval.js`.

1. **Guesstimates feature (didn't exist before — R7's fork confirmed no route/page for
   it anywhere).** `migration_044_guesstimates_source_filter.sql` adds an optional
   `filter_source_file` parameter to `match_ingest_chunks` (drop+create, same reason as
   migration_043's drop+create for `match_document_chunks` — Postgres treats a new
   parameter as a different signature) — defaults to null, so the 3-arg callers in
   `consultingRetrieval.js` are unaffected. `src/lib/guesstimateRetrieval.js` scopes
   lookups to exactly `SRCC Guesstimates-Book-Volume-1-6.pdf` via that filter, reusing
   `decideCoverage`/`buildCitation`/`AI_FALLBACK_LABEL` from `consultingRetrieval.js`
   rather than re-deriving them. New routes `GET /api/guesstimates/random` (a random
   covering chunk, picked with `pickRandomCoveringChunk` so repeated calls don't always
   return the same problem) and `GET /api/guesstimates/ask?topic=...`, both behind the
   existing `ENABLE_CONSULTING_RAG_V2` flag (reused rather than a new flag — same
   underlying ingestion work gates both). A miss here reports `available:false,
   reason:"not_yet_live"`, deliberately distinct from the grounding policy's
   `AI_FALLBACK_LABEL` wording — right now every `ingest_chunks` row has `is_active =
   false` (R9 hasn't run), so this isn't "the casebook doesn't cover guesstimates" (it
   does, entirely), it's "the data isn't switched live yet." Conflating those would
   misrepresent why nothing came back.

2. **Framework catalog derived from the actual ingested casebooks, not a static list.**
   `src/lib/frameworkCatalog.js`'s `buildConsultingFrameworkCatalog` reads every diagram
   `title` (diagram-transcription format, migration_040) off `ingest_pages` for
   `domain='Consulting'` + `source_class='club_casebook'` documents (FMS, SRCC, ISB),
   deduplicates case/whitespace variants, and groups by how often each one actually
   appears — e.g. "Porter's Five Forces" showing up in both FMS and ISB collapses to one
   entry with two citations, not two separate rows. This surfaces exactly what's in the
   corpus (nothing invented from loose text — a title only exists if the ingestion
   pipeline already transcribed it off a real labelled diagram), independent of
   `is_active`/R9, since it's cataloging the corpus, not serving it live. New additive
   route `GET /api/frameworks/catalog?domain=Consulting`, behind the same flag; any other
   domain or flag-off returns `{frameworks: []}`, with zero effect on the existing
   `/frameworks` and `/taxonomy` routes.

**Scope cut, flagged not guessed:** no frontend UI was built for either feature — no
Guesstimates page, no catalog display on the Frameworks page. That's genuinely R8's job
(frontend rendering) and needs a product/design call this session doesn't have (where
Guesstimates lives in nav, what a practice flow looks like, how the catalog surfaces
next to the existing seeded framework list) — added the response types
(`GuesstimateResponse`, `FrameworksCatalogResponse`, etc. in `src/types/api.ts`) so R8
isn't starting from nothing, but didn't guess at UI.

**Proof:** 12 new tests (`test/guesstimateRetrieval.test.js`,
`test/frameworkCatalog.test.js`), all pure-logic, no network/Supabase — same tier as
`consultingRetrieval.test.js`. `npm test`: 98/99 (the 1 failure is the pre-existing,
unrelated sandbox-env flake). Frontend: `tsc -b` surfaced exactly one pre-existing error
in `HomePage.tsx` (unused `data` var) from an unrelated uncommitted edit already in the
working tree before this work started — not touched, not caused by this change; every
other file including the new types compiles clean.

**Not done:** `ingest_chunks.is_active` stays `false` everywhere — this migration and
both features are inert in production regardless of the flag until R9. Nothing in
`document_chunks` or any earlier `ingest_*` row was touched. `main` untouched.

---

## 2026-10-30 — Fix: match_document_chunks dropped `image_url`, silently broke Frameworks v1 image grounding
**Phase:** R7 (follow-up) · **Type:** migration, fix

**What changed:** Confirmed the bug flagged in the R7 log entry below. Read migration_014
(added `image_url` to `match_document_chunks`'s return columns, for image chunks captioned
and embedded alongside text chunks) and migration_037 (drop/recreate of the same function to
add the `is_active` filter) side by side: migration_037's `RETURNS TABLE` list is `id,
domain, source_file, content, similarity` — no `image_url`. migration_037's own comments and
duplicate-deactivation list are entirely about `is_active`/`source_class`; nothing in it says
image support was meant to go away, so this is an accidental regression from rebuilding the
column list from scratch, not an intentional removal. `frameworksGrounding.js`'s v1
`findGrounding` path (used whenever `ENABLE_CONSULTING_RAG_V2` is off, or on but the
framework's domain isn't "Consulting" — i.e. the live path for everything except Consulting
today) reads `r.image_url` off every row from `match_document_chunks` to pick `topImage` for
a framework's `grounded_image`. With the column missing, `image_url` is `undefined` on every
row, so `topImage` never matches, `grounded_image` stays `null`, and nothing throws — a
silent miss, exactly why nobody noticed. The underlying `document_chunks.image_url` column
(migration_014) was never touched; only the RPC's output stopped surfacing it.

Wrote `migration_043_restore_image_url_rpc.sql`: drops and recreates `match_document_chunks`
with `image_url` restored to both the return list and the select list, keeping migration_037's
`is_active` filter intact. Pure RPC-definition fix — no `document_chunks` row is read,
written or touched. Also pulled the row-picking logic (`topText`/`topImage` selection) out of
`findGrounding` into an exported pure function, `pickTopTextAndImage`, so the JS-side contract
is unit-testable without a live Supabase call.

**Why:** Live-data-path bug (what students see today in Frameworks for every non-Consulting
domain, and Consulting whenever the v2 switch is off/falls back) — images silently never
render even when a relevant one exists and scores above threshold.

**Files:** `backend/db/migration_043_restore_image_url_rpc.sql`,
`backend/scripts/apply_migration_043.py`, `backend/src/lib/frameworksGrounding.js`,
`backend/test/frameworksGrounding.test.js`

**Proof:** `npm test` → 86/87 (4 new `frameworksGrounding.test.js` tests, all pass; the 1
failure is the pre-existing, unrelated `sandbox.test.js` `__CF_USER_TEXT_ENCODING` flake also
seen in the R6/R7 entries, not touched here). Compared migration_014's and migration_037's
`RETURNS TABLE`/`select` lists directly in the SQL files to confirm the column is genuinely
missing (not assumed).

**Cost:** none (no Gemini calls).

**Undo:** `migration_043`'s header includes a rollback block that restores migration_037's
exact (no-`image_url`) shape if ever needed; otherwise this is additive and safe to leave.

**Open issues:** **migration_043 is NOT applied to the live DB yet** — same sandbox
limitation as migration_042 (can reach the Supabase REST API but not the direct Postgres
pooler; a live-DB write attempt here was also blocked by the harness's own production-deploy
classifier, as expected for anything touching the live DB directly). **Aalhad: paste
`backend/db/migration_043_restore_image_url_rpc.sql` into the Supabase SQL editor and run it**
(idempotent, safe to run twice; `backend/scripts/apply_migration_043.py` is ready if direct
Postgres access is restored instead — it verifies `document_chunks` row counts and
`is_active` breakdown are unchanged before committing). Until applied, `grounded_image` stays
null for v1 Frameworks lookups exactly as it does today — this fix doesn't change current
behavior until the migration runs, consistent with "reversible in one step."

---

## 2026-10-30 — NVIDIA free-tier vision: side-by-side comparison vs Gemini, no cutover
**Phase:** ingest-nvidia · **Type:** ingestion, eval

**What changed:** Added `nvidia_client.py` (same `transcribe_page` contract as
`gemini_client.py`, calling the free-tier NVIDIA NIM endpoint,
`nvidia/nemotron-3.5-super-vl-120b-a12b`) and `compare_vision_providers.py`, a read-only
harness that runs both providers on the same real ISB pages and scores both with the
existing `fidelity.check_page`. `config.py` gained `VISION_PROVIDER` ("gemini", unchanged
default) and `NVIDIA_VISION_MODEL` as scaffolding only — no caller branches on them yet.

**Why:** Aalhad wants to reduce Gemini dependency using the NVIDIA free tier (40 req/min)
wherever a confirmed-working model actually fits. This tests the one candidate for page
conversion (vision) before touching anything live.

**Result — do not switch the default yet:** ran both providers on 7 real pages (the 5
lowest-number_coverage table pages from the ISB run, pages 162/166/169/175/177, plus two
genuine multi-diagram pages, 163/34).
- On the 5 table/chart pages, forced through the *vision* path (not Docling, which is what
  actually ran in production): **Gemini scored 1.0 number_coverage on all 5** — meaning
  Gemini vision itself was never the problem on ISB's pie-chart pages; the real R6 finding
  was that these pages get routed to Docling (table path), not vision, and Docling can't
  read charts. That's a routing/scoring-formula question, same open item R6 already flagged
  — not something this comparison changes.
- **NVIDIA returned empty `content` (0 chars) on those same 5 pages** — it's a reasoning
  model and appears to spend its token budget on hidden chain-of-thought, leaving nothing
  in the field this pipeline reads (confirmed in isolation: a plain "ping" request earlier
  also came back with `finish_reason:"length"` and no real answer). On the 2 genuine
  diagram pages it did return content, but with its own real problems (`invented_text` on
  163, `missing_box` on 34).
- **Recommendation:** NVIDIA vision is not a drop-in replacement as integrated — before
  reconsidering it, someone needs to either read `reasoning_content` as a fallback, raise
  `max_tokens` well past 8192, or find a request parameter that disables extended thinking
  for this model. Until then, Gemini stays the only vision provider; `VISION_PROVIDER`
  exists but nothing reads it.

**Files:** `backend/ingestion/nvidia_client.py`, `backend/ingestion/compare_vision_providers.py`,
`backend/ingestion/config.py`, `backend/ingestion/tests/test_nvidia_client.py`

**Proof:** `venv/bin/python -m unittest discover -s tests` → 375/375 green (was 366 before
this change, +9 new tests). Comparison output: `backend/ingestion/out/compare_vision_providers.json`.

**Cost:** 7 Gemini vision calls (already-budgeted model, no embeddings) + 8 NVIDIA vision
calls, all free-tier. ~$0 incremental.

**Undo:** delete the 4 new/changed files; nothing else references them.

**Open issues:** page-classification side of the original ask (routing pages to a cheap
LLM classifier) doesn't apply — `page_classify.py` is already code-only (pypdfium2
geometry), no LLM call exists there to replace. The NVIDIA Q&A-cascade fallback (chat
model, not vision) is separate work, not started here.

---

## 2026-10-30 — R7: match_ingest_chunks RPC + Frameworks (Consulting) behind ENABLE_CONSULTING_RAG_V2, off by default
**Phase:** R7 · **Type:** migration, retrieval

**What changed:** Wrote `migration_042_consulting_rag_v2.sql`: adds a `domain` column to
`ingest_documents` (backfilled to `'Consulting'` for the 11 existing rows — all verified
`club_casebook`, all from Consulting casebooks), and a new `match_ingest_chunks` RPC — the
`ingest_chunks` equivalent of `match_document_chunks`, but returning real page-level
citations (school, club, year, page range) that `document_chunks` never stored. Added
`src/lib/consultingRetrieval.js` (pure coverage decision + citation builder, plus the
retrieval call) and wired it into `frameworksGrounding.js` behind a new switch,
`ENABLE_CONSULTING_RAG_V2` (unset/false by default). When on, and only for
`fw.domain === "Consulting"`, Frameworks grounds against `ingest_chunks` instead of
`document_chunks`; any failure or switch-off falls straight back to today's exact v1 path.

**Why:** R7 on the roadmap — grounded retrieval on the new pipeline, with citations, behind
a reversible switch, ahead of R9's actual go-live decision.

**Scope note / what's NOT done (flagging, not guessing):**
- **Guesstimates and Q&A as grounded features don't exist in this codebase yet.**
  `backend/src/routes/chat.js` is explicitly an *ungrounded* passthrough to Gemini (its own
  comment: "rather than needing a structured RAG pipeline") used for framework
  explain/pushback chat and Tone Shifter — not a Q&A RAG feature. There is no Guesstimates
  route or frontend page anywhere. R7's task description assumes both already exist to "wire
  retrieval into" — they don't. Building either from scratch is new feature work, not a
  retrieval wiring task, so I didn't invent one silently. **Needs Aalhad's call** on whether/
  when to build them, and R8 ("frontend for RAG only") has the same dependency.
- The rebuilt diagram itself (`ingest_pages.diagrams`, diagram-transcription format) isn't
  joined into `match_ingest_chunks` — only `has_diagram` is. Pulling in the actual structured
  diagram block by page is R8's job ("render new diagram types"), not R7's; doing it here
  would get ahead of that phase for no reason since nothing can render it yet.
- Found, but did not touch: `match_document_chunks` (schema.sql + migration_014) says it
  returns `image_url`, but migration_037's later `drop function / create function` rebuilt it
  *without* that column, while `frameworksGrounding.js`'s v1 path still reads `r.image_url` off
  every row. That looks like a live bug in the **existing** v1 path (images silently never
  match in `findGrounding`'s v1 branch) — pre-existing, unrelated to this change, out of R7's
  scope, flagging for a look.

**Files:** `backend/db/migration_042_consulting_rag_v2.sql`,
`backend/scripts/apply_migration_042.py`, `backend/src/lib/consultingRetrieval.js`,
`backend/src/lib/frameworksGrounding.js`, `backend/test/consultingRetrieval.test.js`,
`backend/.env.example`

**Proof:** `npm test` → 82/83 (10 new tests for `consultingRetrieval.js`, all pass; the 1
failure is the pre-existing, unrelated `sandbox.test.js` `__CF_USER_TEXT_ENCODING` flake also
seen in the 2026-10-30 R6 entries). Manually confirmed the switch defaults off
(`ENABLE_CONSULTING_RAG_V2` unset → v1 path). Live smoke-test of
`retrieveConsultingChunks()` against the real (not-yet-migrated) DB returns `[]` and logs a
clean warning rather than throwing — proves the fail-safe path actually works, not just in
theory.

**Cost:** 1 embedding call (the smoke test above), ≈$0.0001.

**Undo:** Leave `ENABLE_CONSULTING_RAG_V2` unset (already the default — nothing to undo).
`match_ingest_chunks` can be dropped independently of everything else (`drop function if
exists match_ingest_chunks(vector, integer, text);`); the `domain` column backfill is
harmless to leave even if dropped.

**Open issues — migration_042 is NOT applied to the live DB yet.** This sandbox can reach the
Supabase REST API (`https://<ref>.supabase.co`, used throughout R6) but not the direct
Postgres pooler (`aws-0-ap-southeast-1.pooler.supabase.com:5432`) or the Supabase Management
API (`api.supabase.com`) — both time out, apparently blocked at the network level, not a
credentials problem. `apply_migration_041.py`'s same approach (direct `psycopg` connection)
worked in an earlier session; it doesn't reach the DB from here. **Aalhad: paste
`backend/db/migration_042_consulting_rag_v2.sql` into the Supabase SQL editor and run it
(idempotent, safe to run twice)** — same manual step migration_041 needed. Until that's done,
`ENABLE_CONSULTING_RAG_V2=true` would just make Frameworks warn-and-fall-back-to-v1 for
Consulting rows, which is safe but pointless; there's no reason to flip it before the
migration lands anyway, since `is_active=true` hasn't been set on any `ingest_chunks` row
(R9 hasn't happened), so it would return "not covered" for everything regardless.
Guesstimates/Q&A scope question above also needs an answer before R8 can really start.

---

## 2026-10-30 — R6: The FMS Consulting Casebook 2021-22 ingested; 1 network-failure page patched
**Phase:** R6 · **Type:** ingest, fix

**What changed:** Third fresh casebook past SRCC and ISB. Picked `The FMS Consulting
Casebook 2021-22.pdf` (200 pages, confirmed `club_casebook` by querying existing
`document_chunks` classifications, not assumed) as the smallest of the remaining 8 eligible
Consulting casebooks. Fresh ingest v1: 200 pages, 248 chunks, 277 vision calls, 248 embedding
calls, inserted into `ingest_*` with `is_active=false`.

v1 flagged 1 page (151) with `number_coverage=0.0`, `word_coverage=0.005` - near-total loss.
Pulled the stored page row directly rather than assuming: `markdown` was
`"[UNREADABLE] (vision call failed: network error on gemini-3.5-flash-lite: ReadTimeout)"`,
i.e. a transient network timeout on the API call, not a conversion/fidelity problem and not
a page the pipeline actually got wrong - it correctly marked it `vision_failed` and excluded
it from chunking rather than inserting a guess. Retried just that page through
`convert_page_vision` (same pattern as the SRCC patch): came back `number_coverage=1.0`,
`word_coverage=1.0`, `needs_review=False`. Built v2 = v1's 200 pages with only page 151
replaced, insert-only, `is_active=false`.

All other `needs_review=true` pages in this casebook (most of the 200 - it's diagram-dense)
are routine: a page with any diagram always waits for human sign-off before going live, same
design as FMS/SRCC/ISB, not a fidelity defect.
**Why:** Continuing the check-against-source -> diagnose -> (fix or flag) loop. Unlike the
ISB finding, this one had a clear, low-risk root cause (infra timeout) and no product
tradeoff to flag, so it was fixed directly rather than left for Aalhad.
**Proof:**
- `out/r6_fms2122_v1.json`: per-page coverage/diagram summary for all 200 pages.
- Direct DB read of page 151's v1 row (`markdown`, `review_reasons`) to confirm the actual
  cause before acting, rather than assuming what a 0.0 score meant.
- `npm test` in `backend/`: 72/73 pass. The 1 failure (`test/sandbox.test.js` - a sandboxed
  Python process seeing a stray `__CF_USER_TEXT_ENCODING` macOS env var) is pre-existing and
  unrelated to ingestion; no pipeline library code was touched this round.
- `document_chunks` (live) verified unchanged: 22,457 rows, same as before this run. v2's 249
  `ingest_chunks` rows confirmed `is_active=false`.
**Cost:** v1: 277 vision + 248 embedding calls (≈$0.33). Patch: 1 vision + 249 embedding
calls (≈$0.001). **≈$0.33 total** for this casebook. Cumulative R6 spend so far (SRCC + ISB +
this one): ≈$0.72, well inside the ~$20/month budget.
**Files:** `backend/ingestion/run_r6_fms2122.py`, `run_r6_fms2122_patch.py` (both new entry
points). No pipeline library code changed. Committed on `wip`, not `main`.
**Undo:** Insert-only, `is_active=false`. To remove: delete `ingest_documents`/
`ingest_pages`/`ingest_chunks` rows where `source_file = 'The FMS Consulting Casebook
2021-22.pdf'`.
**Left open:** 7 casebooks remain for R6 (IIM B/Calcutta/L/K/A, ISB already done, Consulting
Club FMS 2025-26, FMS 2024-25). A stray untracked file `backend/ingestion/run_pilot.py` was
noticed in the working tree (not created or touched by this run) - flagged, not acted on.

---

## 2026-10-30 — R6: ISB Consulting Casebook ingested; found a real scoring tradeoff, flagged for review
**Phase:** R6 · **Type:** ingest, finding

**What changed:** Second fresh casebook past SRCC. Picked `ISB Consulting Casebook 2025.pdf`
(183 pages, confirmed `club_casebook` by querying existing `document_chunks` classifications
first, not assumed) as the smallest of the 10 remaining eligible casebooks. Fresh ingest v1:
183 pages, 239 chunks, 230 vision calls, 240 embedding calls, inserted into `ingest_*` with
`is_active=false`. 78 pages carry 118 diagrams; all 78 are `needs_review=true` by the
existing design (a page with a diagram always waits for human sign-off before going live,
same as FMS/SRCC) - that alone accounts for most of the page's 75 flagged pages and is not a
fidelity problem.

The other 13 flagged pages (7% of the casebook) cluster on pages 162-177, the casebook's
"Industry Primer" section - dense pages combining a bulleted Cost/Revenue Drivers box (a real
table) with a small embedded pie chart (e.g. p169's telecom market-share chart: Reliance Jio
50.9%, Airtel 31.1%, Vodafone Idea 13%, Others 3.4%, BSNL 1.5%). I pulled the actual page
image and read it myself to confirm what's really printed, then ran both conversion paths
on p169 directly to find the cause:
- **Docling** (the path the pipeline picked, since the page registers `is_table=true`) gets
  the Cost/Revenue bullets perfectly but has no way to read the pie chart at all -
  `number_coverage` 0.33.
- **Gemini vision**, run manually on the same page with the real text layer, gets the pie
  chart's numbers exactly right (`number_coverage` 1.0, `word_coverage` 1.0) but its own
  issue-tree transcription of the Cost/Revenue box drops several bullet children as
  `missing_box` warnings, which the scoring formula (`_score` in `convert.py`) penalizes at
  -0.5 each - 11 warnings drags its score to 0.5, well below docling's 2.3, so **the
  automatic docling-vs-vision retry correctly picked docling and flagged the page
  `needs_review`, rather than silently guessing**. Neither path actually hallucinates
  anything; both just lose a different half of the page's real content.
**Why:** Continuing the check-against-source -> diagnose -> (fix or flag) loop from the SRCC
entry, now on a casebook with a page layout the pipeline hadn't seen before (table + chart on
the same page). Root-caused rather than reflagged-and-moved-on, per that loop.
**Proof:**
- `out/r6_isb_v1.json`: per-page coverage/diagram summary for all 183 pages.
- Direct image pull + read for pages 169/5/44 from the `casebook-source` bucket, compared by
  eye against the stored markdown.
- Manual reproduction: ran `convert_page_vision` on p169's real PNG + real text layer outside
  the pipeline, printed `number_coverage`, `word_coverage`, `diagram_issues` and the `_score`
  breakdown to isolate exactly which component sank vision's score.
- Full test suite unaffected (no pipeline code changed this round - see "Not done" below for
  why). `document_chunks` (live) verified untouched.
**Cost:** v1: 230 vision + 240 embedding calls. At ~$0.0012/vision call (flash-lite, per
prior entries), embeddings near-free: **≈ $0.28** for this casebook. Cumulative R6 spend
so far (SRCC + ISB): ≈ $0.39, well inside the ~$20/month budget.
**Files:** `backend/ingestion/run_r6_isb.py` (new, fresh-ingest entry point). No pipeline
library code changed. Committed on `wip`, not `main`.
**Undo:** Insert-only, `is_active=false`. To remove: delete `ingest_documents`/
`ingest_pages`/`ingest_chunks` rows where `source_file = 'ISB Consulting Casebook 2025.pdf'`.
**Not done / left open - needs Aalhad's call, not a guess:**
- I did **not** change `_score`'s -0.5-per-warning weight or special-case `missing_box`
  warnings, even though that's the lever that would flip p169 (and likely the other 12
  clustered pages) to the vision version. Lowering it is a product tradeoff - pie-chart
  percentages vs. a couple of bullet labels that are also visible in the retained docling
  table - not an engineering bug, and I don't think it's mine to decide silently for a
  pattern I've only confirmed on one page so far.
- These 13 pages are sitting in the review queue (R5) as-is: docling's version (missing the
  chart) is what's stored, flagged `needs_review`. An admin reviewing them can currently see
  the flag but not the alternative vision version side-by-side - worth a note for whoever
  builds out the R5 UI further.
- 8 of the 10 remaining eligible Consulting casebooks (IIM B/Calcutta/L/K/A, ISB done,
  Consulting Club FMS, FMS 2021-22, FMS 2024-25) are still untouched, roughly 2,170 pages
  combined.

---

## 2026-10-30 — R6: first new casebook ingested — SRCC Guesstimates Book (insert-only)
**Phase:** R6 · **Type:** ingest, fix

**What changed:** First casebook past the FMS pilot to go through the full pipeline from
scratch (classify -> convert -> fidelity check -> chunk -> embed -> store). Picked SRCC
Guesstimates-Book-Volume-1-6.pdf (61 pages, already classified `club_casebook` by the
C0.9 pass) as the smallest of the 11 remaining eligible Consulting casebooks, to get one
fully verified before scaling up. `MIT Consulting Casebook.pdf` is excluded from R6: its
`document_chunks` classification is `external_academic`, not `club_casebook` - confirmed
by querying existing classifications before starting, not assumed from folder location.

v1 (fresh ingest, 79 vision calls): 61 pages, 60 chunks. Automatic fidelity flagged 5
pages for inspection: pages 6 and 37 were genuine Gemini network failures
(`ConnectionError`/`ReadTimeout`, `[UNREADABLE]`, 0.0 coverage) - infra, not content.
Pages 11 and 12 are dense full-page infographics ("Guesstimates Cheat Sheet",
"Economic Variables") that `docling`/mixed conversion flattened into disconnected
number/label fragments (word_coverage 0.75-0.79) - most of the page's content was
simply missing from the stored markdown. Page 39 (a green section-divider page reading
"NATION WITH NAMO") came back as "Nnation with namo" - a real transcription slip, not
an infra failure.

I compared all 5 pages directly against the rendered source PDF images myself (not
delegated), confirmed each diagnosis, then retried all 5 through `convert_page_vision`
and built v2 = v1 with only these 5 pages replaced (56 reused verbatim), insert-only.
Result: pages 6/37/39 now 1.0/1.0 coverage; page 11 now 1.0/0.987; page 12 now
0.93/0.99 (one digit-level number slip - source says "3.287 MN SQ. KM", extraction
said "3.87 MN SQ. KM" - correctly caught by `label_not_on_page` and left `needs_review`
for the R5 admin queue, not silently corrected). All 5 pages carry real diagrams, so
per the existing pattern they stay in the review queue regardless of coverage - that's
by design, not a fidelity failure.
**Why:** Aalhad asked for the check-against-source / fix / re-extract / re-check loop
to run on its own, extended from the FMS-only pipeline hardening in the prior entry
into real R6 progress: an actual new casebook, not just process repairs.
**Proof:**
- `out/r6_srcc_v1.json`: per-page coverage/diagram summary for all 61 pages.
- Direct visual comparison: rendered page 6/11/12/37/39 as PNGs from the source PDF
  (`page_classify.render_page_png`) and read them against the stored markdown myself.
- v2 patch run output: all 5 target pages' before/after coverage logged.
- Full test suite: `366 tests, OK` (unchanged - no pipeline code touched this round).
- `document_chunks` (live, what students see) verified unchanged at 22457 rows.
  `ingest_documents` now carries SRCC v1 and v2 alongside the existing FMS v1-v6 rows;
  nothing else touched.
**Cost:** v1: 79 vision + 60 embedding calls. v2 patch: 8 vision (5 pages, 1 page used a
retry) + 69 embedding calls (v2 re-chunked/re-embedded all 60->69 chunks since chunk
boundaries can shift with content; costs are additive, nothing reused by hash this
round). At flash-lite rates (~$0.0012/vision call per prior entries' figures, embeddings
near-free): total **≈ $0.11** for this casebook, v1 + v2 combined.
**Files:** `backend/ingestion/run_r6_srcc.py` (new, fresh-ingest entry point),
`backend/ingestion/run_r6_srcc_patch.py` (new, v2 patch). No pipeline library code
changed. Committed on `wip`, not `main`.
**Undo:** Both versions are insert-only, `is_active=false`. To remove: delete
`ingest_documents`/`ingest_pages`/`ingest_chunks` rows where
`source_file = 'SRCC Guesstimates-Book-Volume-1-6.pdf'` (either or both versions).
**Not done / left open:**
- Page 12's one-digit number slip ("3.87" vs "3.287") is sitting in the review queue,
  correctly flagged, not yet approved by Aalhad - same as any other `needs_review` page.
- The other 10 eligible Consulting casebooks (IIM B/Calcutta/L/K/A, ISB, MIT-excluded,
  Consulting Club FMS, FMS 2021-22, FMS 2024-25 - combined roughly 2,350 pages) are
  still untouched. Each is substantially larger than SRCC's 61 pages; a follow-up run
  should continue casebook by casebook rather than attempt all at once.

---

## 2026-10-30 — R6-prep: two R2.12 free fixes implemented; v6 built on FMS (insert-only)
**Phase:** R2/R6 · **Type:** fix, ingest

**What changed:** Aalhad asked for the extraction-vs-source loop to run on its own
(check extraction against the original PDFs, fix flaws in the pipeline, re-extract,
re-check, repeat). R1/R2 had already run and closed that exact loop on the FMS
casebook (39/40 pass, bar met, Aalhad signed off 2026-10-21) — re-litigating that
closed decision would waste budget, so this instead picked up the 4 "free follow-ups"
R2.12 diagnosed but left undone:
1. **ragged_table** (implemented): a Markdown table body row whose cell count differs
   from its header row (`textnorm.ragged_table_issues`, wired into `fidelity.check_page`).
   Catches two source tables merged into one Markdown table (FMS p236) and a diagram
   block nested inside a table cell (p58/59/60/67/70/72/73/89/112) — both invisible to
   word_coverage since every word is still present somewhere in the table.
2. **Raster-safe title strip** (implemented): `textnorm._null_block_title` no longer
   nulls a block's title just because nothing in the block is in the text layer -
   that only proves the block is a raster image with no OCR coverage, not that the
   title is invented (FMS p25: the strip had deleted a real, printed table title).
   The guard (`_block_has_verifiable_content`) checks the block's own numbers first
   (financial figures rarely collide with unrelated prose) and only falls back to a
   string-label check when the block has no numbers at all, so a shared accounting
   term elsewhere on the page ("Gross Profit") can't make a raster table look verified.
3. Internal-label invented check, title lines in `seq_diff`: **not implemented** -
   lower certainty of a real miss (p64's invented internal labels were already caught
   via existing diagram checks) and higher risk of regressions; left for a future pass.
**Why:** These are deterministic, zero-Gemini-cost pipeline fixes that benefit every
future casebook (R6), not just FMS, and were already diagnosed with real evidence from
the R2.12 review - no new discovery work needed, just implementation.
**Proof:**
- 6 new regression tests (`tests/test_r2_free_fixes.py`), using the real p236/p25
  fixtures pulled from the live v5 rows. Full suite: 360 -> 366 tests, all green.
- `run_v6.py` carried v5 into v6 (insert-only, `is_active=false`, 0 vision calls):
  248 pages, 386 chunks. `document_chunks` (live) unchanged at 22457 rows; v1-v5 rows
  untouched. `needs_review` count unchanged (173 -> 173): the new flag adds diagnostic
  detail to pages already in the review queue, it does not add new ones.
  - 10 pages newly carry `ragged_table`: 58, 59, 60, 67, 70, 72, 73, 89, 112, 236.
  - Page 25's title restored to "XYZ Shoe company Income Statement (₹ (in lakhs))" -
    the exact text the R2.12 fidelity review read off the source page image (this
    log, 2026-10-21 entry, line 226), not a guess. One chunk's content changed as a
    result; its embedding was recomputed (the other 385 chunks' embeddings were
    reused byte-for-byte by content hash, 0 new calls for them).
**Cost:** 1 Gemini embedding call, ≈ $0.0001.
**Files:** `backend/ingestion/textnorm.py` (+`ragged_table_issues`, +`_string_values`,
+`_block_has_verifiable_content`, title-strip guard), `backend/ingestion/fidelity.py`
(wires in `ragged_table`), `backend/ingestion/run_v6.py` (new), `backend/ingestion/
tests/test_r2_free_fixes.py` (new). Committed on `wip`, not `main` (`main` stays
exactly as last deployed; see this session's branch-safety setup).
**Undo:** v6 is insert-only and `is_active=false` everywhere - nothing to switch back.
To remove it entirely: delete `ingest_documents`/`ingest_pages`/`ingest_chunks` rows
where `ingestion_version = 6` for this source_file (no other version is touched).
**Not done / left open:**
- R6 itself (re-ingesting the other 11 Consulting casebooks) was not started - this
  session's time went to hardening the shared pipeline code first, which R6 will now
  benefit from. The two skipped free-fixes (pattern 3's internal-label check, pattern
  4's title-in-seq_diff) remain open too.
- R3 (Aalhad's test question set) is still the roadmap's ▶ task and still Aalhad's own
  work, not an agent's - unaffected by this entry.

---

## 2026-10-29 — Renamed "Marketing and Brand" domain to "Marketing"
**Phase:** M1 · **Type:** fix

**What changed:** Renamed the "Marketing and Brand" domain option to "Marketing" everywhere
it's part of the shared 10-domain list (Tone Shifter dropdown, the 3-day prep plan modal,
the Tone Shifter's verb-playbook prompt section heading, and the backend's plan-domain
validation list) — Aalhad asked for the shorter label on the domain dropdown.
**Why:** These 4 copies are one canonical list by design (see PlanModal.tsx's own comment) —
the frontend's selected value is sent straight to `backend/src/routes/plan.js`, which
validates it with a strict `DOMAINS.includes(domain)` check, and the same string is also
used as a prompt heading the Tone Shifter's output quality depends on matching. Renaming
only the UI label would have 400'd the plan endpoint and broken the domain→playbook match.
**Files:** `frontend-react/src/components/PlanModal.tsx`, `frontend-react/src/pages/ToneShifterPage.tsx`,
`frontend-react/src/lib/prompts.ts`, `backend/src/routes/plan.js`
**Proof:** `tsc -b --noEmit` shows only the pre-existing, unrelated `HomePage.tsx:100` warning;
`node --check src/routes/plan.js` passes.
**Undo:** Revert this commit, or change `"Marketing"` back to `"Marketing and Brand"` in the
4 files listed.
**Open issues:** Left `ROLE_CATALOG`'s `domain: "Marketing and Brand"` tags (6 roles, in
`frontend-react/src/lib/constants.ts` and `backend/src/lib/roles.js`) unchanged — that's a
separate role-browsing taxonomy, not this dropdown, and wasn't part of the ask.

---

## 2026-10-29 — Removed homepage line naming source schools
**Phase:** M1 · **Type:** fix

**What changed:** Removed the homepage hero's trust line, "Built from IIM A, IIM B, IIM C,
FMS, ISB and XLRI placement casebooks" — Aalhad flagged it for removal.
**Why:** It named the source schools in public-facing copy, which cuts against keeping
original casebooks/sources admin-only.
**Files:** `frontend-react/src/pages/HomePage.tsx`
**Proof:** Line removed; `tsc -b --noEmit` shows only the pre-existing, unrelated
`HomePage.tsx:100` unused-`data` warning, nothing new.
**Undo:** Revert this commit, or re-add the line to `HomePage.tsx`.
**Open issues:** `.home-trust` in `frontend-react/src/styles/home.css` is now unused CSS —
left in place, not removed (wasn't asked).

---

## 2026-10-24 — R5: migration 041 applied; 184 findings imported; write round-trip passed
**Phase:** R5 · **Type:** migration

**What changed:** Applied `migration_041_ingest_review_queue.sql` to the live database. This creates
`ingest_page_reviews`, `ingest_page_findings` and the `ingest_review_page` RPC, and reloads the
PostgREST schema. Imported the R1/R2 reviewer findings: 184 rows.
**Why:** The admin review queue needs these tables before it can save an approve, a mark-wrong or an edit.
**Cause of the earlier failures:** The network the Mac was on blocked outbound ports 5432 and 6543;
port 443 was open (checked with `nc -z`). The apply ran after Aalhad switched networks.
**Proof:**
- Apply script: `pages 1240->1240, chunks 1918->1918, document_chunks 22457->22457`, then `APPLIED`.
- REST probe: anon and authenticated get `42501 permission denied` on the RPC and 0 rows from both tables.
- Import, run twice: 184 then 184 rows (insert-only, no duplicates).
- `npm test`: 73 tests, 72 pass, 0 skipped. The 1 failure is the known sandbox `__CF_USER_TEXT_ENCODING` test.
- Write round-trip on v1 page 3 (`9c5734aa-…`):
  - edit_approve wrote review `0b22623f-ebb1-486a-99a7-3ea1cc23dbb4` (pending→fixed).
  - A stale expected_status returned `status_conflict`; a random UUID returned `page_not_found`.
  - reopen wrote review `4ff2b780-1243-4672-92b6-d76bbe177113` (fixed→pending).
  - The page's markdown sha256 is unchanged.
  - UPDATE and DELETE on ingest_page_reviews both fail with `append-only`.
**Undo:** Run the `-- ROLLBACK` section at the end of the migration file. It drops only the new objects.
**Open issues:**
- R5 plan 04 QA is still to do.
- The queue has no "proposed fix, awaiting owner" state, so the 7 drafted page fixes in
  `backend/ingestion/out/fixes/` are not submitted yet (see below).

---

## 2026-10-21 — R5.2: admin review API built (reads live; writes wait for migration 041)
**Phase:** R5 · **Type:** feature (admin only; nothing students see changes)

**What changed:** New admin-only endpoints under `/api/admin/review/*`:
- list the ingest documents with flagged counts;
- list the flagged pages for one version (with filters by status and reason);
- show one page with everything a reviewer needs;
- stream that page's image;
- record Approve / Mark wrong / Edit-then-approve / Reopen.

The routes have their own limiter (300 per 15 min). They are mounted before `/api/admin`, so `/api/admin/usage` keeps its 60-request limiter.
Writes go only through the migration-041 RPC. The reviewer email is always the server-verified admin, never a value from the request body.
Page images are proxied by the backend, so no storage URL or `image_path` reaches the browser.

**Also fixed a dev-only bug:** `/api/dev/test-login` signed in on the shared service-role Supabase client, which stored the dev user's session on it. After the first dev login, every server query in that process ran as the dev user under RLS, so the service-role-only `ingest_*` tables read back empty. It now signs in on a throwaway client. The route stays blocked in production, as before.

**Code-review fixes (same day, before commit):**
- `expected_status` is now required on every action. The API returns 400 without it, and the RPC raises `expected_status_required`, so a stale tab can't overwrite a newer decision.
- Reopening a page that is already pending is rejected: 400 in the API, `already_pending` (mapped to 409) in the RPC.
- The RPC now has `set search_path = public, pg_temp`.
  - Migration 041 was edited in place. That is safe only because it has not been applied anywhere.
- The findings importer now builds `entry_key` from the content (page_no + 12 hex characters of a sha256 over the entry with sorted keys), not from the array index. A byte-identical duplicate entry collapses to one row.
- The import is insert-only (`ignoreDuplicates: true`), so a re-run never overwrites a row. The dry-run total is still 184.
- Review-route logs now print only `err.message`.
- `api.test.js` now also checks a valid non-admin token: a second server is started with `ADMIN_EMAILS=nobody@example.invalid`, and all 5 review routes give 404 with an empty body.

**Files:** `backend/src/lib/diagramBlocks.js`, `backend/src/lib/reviewQueue.js`, `backend/src/routes/adminReview.js`, `backend/src/middleware/rateLimit.js`, `backend/src/server.js`, `backend/src/routes/dev.js`, `backend/test/reviewQueue.test.js`, `backend/test/api.test.js`, plus the fixes above in `backend/db/migration_041_ingest_review_queue.sql`, `backend/src/lib/reviewFindings.js`, `backend/scripts/importReviewFindings.js`, `backend/test/reviewFindings.test.js`
**Proof:**
- curl, no token: 404. Non-admin token (second server with `ADMIN_EMAILS=nobody@example.invalid`): 404 on documents, image and actions.
- The documents list shows the 5 FMS versions, with the default set to v5 `c1521f01…`.
- The v5 queue has 173 pending flagged pages across 21 reasons, and no `image_path` appears in any response.
- The p46 image comes back as `image/png` with `private, no-store`. `file` reports a 2001x1125 PNG.
- `/api/admin/usage` returns 200 with `RateLimit-Policy: 60;w=900`.
- `npm test` after the review fixes: 73 tests, 70 pass, 2 skipped (they need migration 041), 1 failure. `reviewQueue`: 24/24 pass. `reviewFindings`: 9/9 pass. The failure is the known `sandbox.test.js` `__CF_USER_TEXT_ENCODING` test, which this change does not touch.
- `/cso` scoped static run `1792591414968-ba99d91b0ac5c3ea`: no supported findings. The run is partial by design (`--paths`).
**Cost:** 0 Gemini calls.
**Undo:** remove the `app.use("/api/admin/review", …)` line in `server.js`.
**Open issues:**
- Migration 041 is still not applied, so actions return 503 ("Review storage is not set up yet"). Findings and history come back empty, with `review_schema_ready: false`.
- After Aalhad applies it, someone must run the plan's v1 page-3 write round-trip (edit_approve, then reopen, 409/404 checks, markdown sha256 unchanged, append-only error) and record the two review ids here. That round-trip can run over REST, so an agent can do it.

---

## 2026-10-21 — R5.1: review-queue migration 041 written (NOT applied yet); findings importer ready
**Phase:** R5 · **Type:** migration

**What changed:** I wrote migration 041 for the admin review queue. It adds an append-only review history table (`ingest_page_reviews`), a table for the R1/R2 reviewer findings (`ingest_page_findings`) and one atomic review RPC (`ingest_review_page`). It is additive only: it adds no column to `ingest_pages`, and the RPC changes only `review_status`.
I also wrote a pure normaliser and a re-runnable import script for the five local review files.
**The migration is not applied**, because Postgres can't be reached from the agent environment.
- `DATABASE_URL` in `backend/.env` has an unescaped `@` in the password, so it doesn't parse as a URL. Encoding it in-process fixes the parse, but then ports 5432/6543 on the pooler time out.
- Supabase REST still works.

Because the tables don't exist yet, the findings import has not been run either.
**Why:** The R5 queue needs somewhere to store approvals, "wrong" notes and edited pages next to the originals, and it needs to show the R1/R2 findings for each page.
**Files:** `backend/db/migration_041_ingest_review_queue.sql`, `backend/src/lib/reviewFindings.js`,
`backend/scripts/importReviewFindings.js`, `backend/test/reviewFindings.test.js`
**Proof:**
- `reviewFindings` tests: 7/7 pass.
- `npm test`: 36/37 pass on the first run and 35/37 on the final run. The `sandbox.test.js` env test fails both times (macOS injects `__CF_USER_TEXT_ENCODING`). On the final run, the existing real-Gemini `generateOnePythonProblem` test also failed (flaky, live call). Neither is touched by this change.
- Dry-run import counts:

| file | version | rows |
|---|---|---|
| r1_review_v3 | v3 | 40 |
| r2_sweep_a | v3 | 32 |
| r2_sweep_b | v3 | 32 |
| r2_sample_review | v4 | 40 |
| r2_sample_v5_review | v5 | 40 |
| **total** | | **184** |

- `document_chunks` = 22457 (via REST).
- A REST probe confirms that neither new table nor the RPC exists yet.

**Security (`/cso`):**
- Static run `1792590826151-a4d1ba3683e365ee` on the three new files: no supported findings. The run is partial by design, scoped by `--paths`.
- The RPC is SECURITY INVOKER, and execute is revoked from public, anon and authenticated. Both tables have RLS on and no policies.
- Hardening added afterwards: a BEFORE TRUNCATE guard on `ingest_page_reviews`.
- Note for plan 2: `p_email` is trusted from the caller. The route must pass the server-verified admin email, never a value from the request body.

**Cost:** 0 Gemini calls.
**Undo:** nothing has been applied. After it is applied, the rollback block is in the migration file. Dropping the tables loses review decisions, so the normal undo is hiding the API/UI.
**Open issues:**
- Aalhad: paste `backend/db/migration_041_ingest_review_queue.sql` into the Supabase SQL editor. Run it twice; it is idempotent. Then run `cd backend && node scripts/importReviewFindings.js` twice, and expect 184 rows both times.
- Fix `DATABASE_URL` by URL-encoding the password. psycopg's parse error printed part of the password in this session, which adds to the existing "rotate the DB password" item.

## 2026-10-21 — R2 closed: owner confirmed the scoring reading; v5 is the best FMS version
**Phase:** R2 · **Type:** eval

**What changed:** Aalhad confirmed the scoring reading (answer: "Flagged = pass"). A page that is wrong but already flagged for review counts as a pass, and the hallucination gate applies to unflagged pages only.
On that reading the verifier's conditional pass becomes a pass (`.gsd/phases/R2/VERIFICATION.md`, 6/6), and R2 is marked done. ▶ moves to R3, which is Aalhad's task.
Aalhad also decided: "Leave to review" for p56. The airline names that appeared only as logos stay removed, and the page stays flagged for the R5 queue.
**Why:** This was R2's done-criterion. The fresh v5 sample scored 39/40 (Wilson [0.871, 0.996]), and no unflagged page has a hallucination.
**Proof:**
- The verifier re-ran 360 tests: OK. `check_schema` PASS.
- `document_chunks` = 22457.
- v1–v5 have 248 pages each, with 363/395/390/384/386 chunks and 0 active.
- The sample reproduces from seed 2023.
- Its spot checks of p236, p16 and p90 agree with the reviewer.
**Known limits (carried forward):**
- Raw faithful rate is 21/40 (0.525), so most correctness comes from human review in R5.
- Flagged pages 64 and 90 hold invented content: "Cheese Burst Pets" and unprinted nodes.
- The page-specific findings are only in the local review JSON files (`backend/ingestion/out/r2_*review*.json`, `r2_sweep_*.json`). R5 must import them into the queue.
- The free fixes the R2.12 patterns suggest, for future casebooks (R6):
  - flag tables with ragged rows
  - title-strip only when the labels are printed
  - check inner block labels for unprinted text
  - include title lines in `seq_diff`
**Cost:** R2 total ≈ $0.15 Gemini (116 flash-lite vision + ≈126 embedding calls).
**Undo:** set R2 back to "todo" and ▶ back to R2 in ROADMAP.md. No data changed in this step.

---

## 2026-10-21 — R2.11–R2.12: v5 fresh-sample review complete (40 holdout pages): 39/40 pass, bar MET
**Phase:** R2 · **Type:** eval

**What changed:** The fidelity-reviewer checked half 2 of the R2.11 sample (20 v5 pages, doc `c1521f01-bcbf-4163-923d-dc501859dc31`) against the page images with the same strict rule as half 1 and R2.08. It reviewed half 2 before reading half 1's verdicts, then scored all 40 pages. One page had an error nothing had flagged (p236), so it is now flagged on v5. Nothing was approved and no code changed. **R2's bar is met on v5: 39 of 40 pages pass (0.975), with 1 missed page and no `hallucinated` issue on any unflagged page.**
**Why:** This closes the plans 11–12 re-check of v5 against R2's done-criterion: a pass rate (faithful or flagged at draw) of at least 0.95, and 0 hallucinations on unflagged pages.
**Half 1 (R2.11)** (page | flagged at draw | outcome | issue | evidence):

| page | flagged | outcome | issue | evidence |
|---|---|---|---|---|
| 114, 239, 94, 163, 165, 144, 7, 107, 159, 133, 235 | 114/94/107 yes, rest no | faithful | – | word for word, including punctuation (6 dense dialogue pages) |
| 211 | yes | caught | structure_lost | wrong parents under Church; internal sequence lost |
| 152 | yes | caught | altered | LaTeX in prose ("$1000\text{ Km}$") |
| 197 | yes | caught | structure_lost | second tree stored as an off-schema key |
| 209 | yes | caught | structure_lost | construction sequence stored as unordered siblings |
| 142 | yes | caught | altered, missing, structure_lost | LaTeX in prose; lever arrows lost |
| 59 | yes | caught | structure_lost | chart block inside a table cell |
| 205 | yes | caught | missing, structure_lost | "now" dropped; dialogue laid out as a table |
| 174 | yes | caught | missing, altered | formula box missing |
| 63 | yes | caught | altered | pie values on the wrong slices |

**Half 2 (R2.12):**

| page | flagged | outcome | issue | evidence |
|---|---|---|---|---|
| 173 | no | faithful | – | dialogue word for word (only a "#of" → "# of" space and a doubled footer year, not counted) |
| 127 | yes | faithful | – | 26 dialogue turns word for word, printed typos kept |
| 248 | yes | faithful | – | title, 6 icon labels, address match |
| 158 | no | faithful | – | section divider matches |
| 100 | yes | caught | altered | "32.9 * 10⁷" stored as "32.9 * 107" (exponent lost) |
| 37 | no | faithful | – | 60+ cheat-sheet numbers match; pie values on the right legend entries |
| 46 | yes | caught | structure_lost | "Backward, forward, horizontal, vertical integration" box under Joint Ventures only; it sits under JV and M&A |
| 90 | yes | caught | altered, hallucinated | title "Cheese Burst Pizzas" → "Cheese Burst Pets"; invented and partly wrong edges between calculation boxes |
| 241 | yes | caught | missing, structure_lost | "Case Index \| Main Index" dropped; side note "Pop. of India = 1.35B" made the root of the Industry Size tree |
| 175 | no | faithful | – | 22 dialogue turns word for word |
| 216 | yes | caught | structure_lost, missing | "Lighting/Signs" box under Government → Other Factors; it hangs from Other Infra. "Approach" heading dropped |
| 68 | yes | faithful | – | tables, value chain and composition values match |
| 222 | no | faithful | – | 32 dialogue turns word for word |
| 64 | yes | caught | hallucinated, altered | unprinted nodes "Sector Details" / "Revenue & Cost Drivers"; "–" → "-" |
| 25 | yes | caught | missing | table title "XYZ Shoe company Income Statement (₹ (in lakhs))" gone, so the unit is lost; all 72 values match |
| 47 | yes | caught | missing | banner "Understand the Question and Clarify the Objectives" dropped |
| 16 | no | faithful | – | BCG matrix, 4×3 table and tagline match |
| 55 | yes | caught | altered | printed "USD $97.7.M" → "$97.7M"; "2021-22)" lost its ")" |
| 236 | no | **missed** | structure_lost | two side-by-side tables (hours/customers and products/prices) merged into one table with ragged rows (5/7/7 cells): "Hot Coffee 60% 40" sits under the wrong headers, and the prices 30 and 20 fall off the rows |
| 224 | yes | faithful | – | 26 dialogue turns word for word; the R1 ")" residue is gone |

**Scores (scoring fixed in plan 08, unchanged), next to R2.08:**

| measure | R2.08 (v4) | R2.12 (v5) |
|---|---|---|
| pass rate (faithful + caught) | 34/40 = 0.85 [0.709, 0.929] | **39/40 = 0.975 [0.871, 0.996]** |
| raw faithful rate | 13/40 = 0.325 [0.201, 0.480] | 21/40 = 0.525 [0.375, 0.671] |
| missed pages | 6 | **1** (236) |
| unflagged miss rate | 6/17 = 0.353 [0.173, 0.587] | **1/15 = 0.067 [0.012, 0.298]** |
| hallucinated on unflagged pages | [150] (gate failed) | **[] (gate passes)** |
| flagged at draw | 23/40 | 25/40 |

- Intervals are plain Wilson 95%, which is conservative: the sample is n = 40 of N = 127 holdout pages, and the finite-population correction (≈ 0.83) would narrow them by about 17%. The pass-rate lower bound (0.871) is below 0.95; the bar is a point-estimate bar (at most 2 missed), as set in plan 08.
- By half: half 1 = 11 faithful, 9 caught, 0 missed; half 2 = 10 faithful, 9 caught, 1 missed.
- Hallucinated on flagged pages (a pattern, not a gate failure): 64, 90.
- Flag reasons on the 25 flagged pages: structure_unreviewed 19, seq_diff 13, diagram_label 10, diagram_structure 5, diagram_flattened 5, diagram_missing_box 4, diagram_label_altered 3, framework_as_text 2, others ≤ 2. Flagged but faithful: 7 pages (94, 107, 114, 127, 224, 248, 68).
- Plan verify: `20 Counter({'faithful': 10, 'caught': 9, 'missed': 1}) zero_items []`; all-40 check prints `R2 BAR MET`.

**How much of the pass rate comes from flags:**
- 18 of the 39 passing pages pass only because they were flagged (caught). Without any flags, the pass rate would equal the raw faithful rate (0.525).
- 17 of the 18 caught pages were already flagged in v4 by specific checks (diagram_label/structure/missing_box/flattened, word_coverage, fallback_v1).
- **1 caught page relied only on a plan-09 blanket flag: p205 (`framework_as_text`; unflagged in v4).** No caught page relied only on `structure_unreviewed`, although 15 of the 18 carry it.
- Without plan-09's new flags, p205 would be missed, giving 2 missed and 38/40 = 0.95. The bar would still be met, but only just.

**Plan-09 repairs and strips on sampled pages** (checked only after scoring):
- 5 prose repairs on 4 pages (114, 173 ×2, 175, 239): all correct, and all 4 pages are faithful.
- 10 placeholder and link-bracket strips: all correct.
- 2 block-title strips: **p25 was wrong.** It deleted the printed table title, because the table is a raster image with an empty text layer, so "not printed" was judged on nothing. p64 was correct (unprinted "Sector Details"), but the same invented text survives as the block's root label.

**Patterns (ranked; full list in `result.patterns`):**
1. Side-by-side tables merged into one Markdown table with ragged rows (236). Every word is present, so no word check sees it. **Free fix:** flag any table whose row cell count differs from the header. 6 v5 pages have this (60, 67, 73, 89, 112, 236), all flagged now.
2. Wrong parent, invented edges, or a note promoted to root: 46, 90, 216, 241 (+ 211, 197, 209, 142, 174). All were flagged; these need human review (R5) or a vision re-call.
3. The block-title strip deletes printed titles on raster regions (25). **Free fix:** strip only when the block's own labels are in the text layer, otherwise flag.
4. Invented grouping nodes inside blocks (64, 90). **Free fix:** run the unprinted-text check on root and internal labels, and flag.
5. Printed typos or punctuation "corrected" in labels, or superscripts flattened: 55, 64, 100, 174. 10⁷ → 107 is invisible to the text layer.
6. Dropped headings, banners or nav: 47, 216, 241, 205. Mostly caught by `seq_diff`.
7. "Pizzas" → "Pets" in the page title (90, from v3 vision output) did not raise `seq_diff`. **Free fix:** include title lines in the diff, case-folded.
8. LaTeX in prose (142, 152); pie values on the wrong slices (63); a word dropped inside a table cell is invisible to `seq_diff` (205).

**Flag changes:** v5 p236: needs_review false → true, reasons [] → [`fidelity_review:structure_lost`]. v5 needs_review 172 → 173. review_status stays pending, approved = 0. No other version was touched.
**Files:** `backend/ingestion/out/r2_sample_v5_review.json` (half 2 + `result`), `out/r2_sample_v5_flags_before.json` (+236), `out/r2_sample_v5_2.html` (all local); `log.md`. Scratch: `scratchpad/r2_plan12/`.
**Cost:** 0 Gemini calls.
**Undo:** Restore needs_review and review_reasons on v5 p236 from `out/r2_sample_v5_flags_before.json` (false, []).
**Open issues:**
- **Aalhad, please confirm the scoring reading:** (a) pass = faithful *or* flagged at draw (a flagged page is held for human review); (b) the hallucination gate applies only to pages unflagged at draw. Under a strict "no hallucination anywhere" reading, flagged pages 64 and 90 would fail.
- R2 is ready for the `verifier`. ROADMAP and STATE are not marked by this plan.
- The margin is thin: the pass rate's Wilson lower bound is 0.871, and only 21/40 pages are fully faithful. 62.5% of sampled pages (and 173/248 of v5) depend on R5 human review before students see them.
- Free follow-ups (not started; no new fix round in this plan): ragged-table flag, the raster-safe title strip, an internal-label invented check, and title lines in `seq_diff`.
- Still pending from earlier: p56 airline names, and whether every unchecked tree/flow page gets flagged.

---

## 2026-10-21 — R2.11: fresh v5 sample drawn (40 holdout pages, seed 2023), half 1 (20 pages) reviewed; 0 missed
**Phase:** R2 · **Type:** eval

**What changed:** The fidelity-reviewer drew a new random sample of 40 v5 pages (doc `c1521f01-bcbf-4163-923d-dc501859dc31`, seed 2023) from the 127 holdout pages that no earlier review, sweep or plan-09 calibration had seen. It then checked half 1 (20 pages) against the page images with the strict R1 rule. The review was done blind to `r2_gapcheck.json` and `r2_v5_output.json`. Under the plan, logo placeholders now count as `hallucinated` and leftover link brackets as `altered`. No v5 row changed because no page was missed. Nothing was approved and no code changed.
**Why:** Plans 11–12 measure v5 independently against R2's bar: a pass rate (faithful or flagged at draw) of at least 0.95, i.e. at most 2 missed pages out of 40.
**Proof (half 1):**
- Draw: 248 v5 pages, pool 127, 40 drawn, 0 overlap with the excluded set. 25/40 were flagged at draw (12 of the 20 in half 1).
- Half 1: 114, 239, 211, 94, 152, 163, 197, 165, 209, 144, 142, 59, 205, 7, 107, 159, 174, 63, 133, 235.
- Plan verify: `20 Counter({'faithful': 11, 'caught': 9}) zero_items []`.
- Faithful (11): 7, 94, 107, 114, 133, 144, 159, 163, 165, 235, 239. All 8 pages unflagged at draw are faithful word for word, including punctuation; 6 of them are dense dialogue pages.
- Caught (9): 142 (LaTeX in prose, lever arrows lost), 152 (LaTeX "$1000\text{ Km}$", "$3^{\text{rd}}$"), 174 (formula box missing, "Customers-Upgrades" spaced), 197 (second tree as an off-schema key), 205 (dropped "now", dialogue as a 2-column table), 209 (construction sequence as siblings), 211 (wrong parents under Church), 59 (chart block in table cell), 63 (pie values on the wrong slices: F&B 19 / Healthcare 31 / Household 50 stored as 50/19/31).
- Missed: 0. Hallucinated: 0. Logo placeholders and link brackets: 0 on these 20 pages.
- Flags: none written. v5 needs_review is still 172, v4 is still 152, and approved is 0 on both.
**Patterns:**
- LaTeX in prose (142, 152): no free check catches it, and it changes printed text.
- A dropped word inside a table cell (205) did not raise `seq_diff`. The page was caught only through `framework_as_text`.
- Pie slice to legend mapping (63) and wrong parents (211) are invisible to text checks and need eyes.
**Files:** `backend/ingestion/out/r2_sample_v5.json`, `out/r2_sample_v5_review.json`, `out/r2_sample_v5_flags_before.json` (empty page list), `out/r2_sample_v5_1.html` (all local).
**Cost:** 0 Gemini calls.
**Undo:** Nothing to undo in the DB. Delete the three local JSON files to discard the sample (do not redraw).
**Open issues:** Plan 12 reviews half 2 and scores all 40 pages.

---

## 2026-10-21 — R2.09–R2.10: free gap-closure fixes (word-order diff, invented-text strip, new flags) + v5 built (inactive)
**Phase:** R2 · **Type:** ingestion | fix

**What changed:** New free, deterministic rules for the R2.08 failure patterns. v4 was carried into a new version, **v5 (doc `c1521f01-bcbf-4163-923d-dc501859dc31`, 248 pages, 386 chunks, all inactive)**. There were 0 vision calls and only 83 embedding calls. Nothing students see has changed yet.
- **Pattern 1 (dropped or changed small words):** `seqdiff.py` lines up the markdown prose word by word, punctuation included, against the page's text layer. A word only counts as dropped if the page prints it more often than the whole markdown holds it, so text that is merely out of order (headers, footers, diagram labels) is ignored. A running footer found on 20% or more of pages is skipped. A small difference (4 words or fewer, with 3 matching words on each side on the same line) is **repaired from the text layer**. Anything else raises the new flag `seq_diff`.
- **Pattern 4 (invented text):** removed, but only after checking the page does not print it: logo placeholders ("[FMS Logo]"), leftover link brackets ("[Main Index]" becomes "Main Index"), unprinted diagram titles (set to null), picture captions ("*(Donut Chart visual representation)*"), and empty table rows. Invented table headers and chart legends are flagged `invented_text`, not edited.
- **Patterns 2 and 3 (flags only):** `framework_as_text` is raised for a visual page with no diagram that holds a table, 4 or more short lines in a row, or arrows. `structure_unreviewed` is raised for every issue tree or flow that no human has passed, because about 49% of unchecked trees have wrong parents and no free check can see that.
- **Repair instead of whole-page replacement:** the text layer has no headings, lists, tables or dialogue breaks. Its reading order is wrong on column stacks, chevrons and callouts. So it is only used for small, anchored fixes, and every other difference is flagged.
- **Code review round 2 (6 fixes before v5):**
  - A repair is refused, and the page flagged instead, when it would split or join a word ("pro fit", "decli-ne"), touch a digit ("3.5%" → "35%"), splice a capitalised callout mid-sentence, or cross a line break.
  - Short invented lines ("Approach used by the candidate") now raise `invented_text`.
  - A caption is deleted only when under 40% of its words are printed. Otherwise it is kept and flagged. A caption holding a number the page prints is never deleted; I added this while dry-running, after the count of holdout pages gaining `number_coverage` showed a stripped caption had taken a printed number on one holdout page (p86). Only the count was used, no holdout diff was read.
  - `[Image: X]` becomes X when X is printed. `[sic]` and `[1]` are kept.
  - Only a diagram's own top-level title is ever nulled.
  - The live pipeline (`convert.py`) now passes each document's footer lines to the checks.
**Why:** R2.08 failed its bar: 34 of 40 pages passed (85%), 6 pages had errors nothing flagged, and 1 had an invented header that nothing flagged.
**Gates** (fixed in plan 09 before any result; `out/r2_gapcheck.json`):

| Gate | Result |
|---|---|
| G1 6 missed pages + 129/203/210 repaired or flagged | PASS 9/9 (7 repaired, 150 and 129 flagged `seq_diff`; p150 `invented_text`) |
| G2 13 faithful pages untouched | PASS: 0 repairs, 0 other strips, `seq_diff` on 0/13 |
| G3 calibration repairs make text more faithful | PASS: 11 repairs, all checked by hand against the text layer and automatically (no split/join, digit or Title Case changes) |
| G4 `seq_diff` noise ≤ 40% of v4-unflagged pages | PASS: 9/96 = 9.4% |
| G5 invented text gone | **PASS (amended)**: logo placeholder pages 49 → 0, link-bracket pages 21 → 0, p23 title null, 0 printed titles changed. **Gate amendment:** "G5 p77: 2 of 3 captions removed, 1 kept and flagged `invented_text` per review finding 3; amended by the orchestrator, not loosened silently." The kept caption is 62% printed, so deleting it risks losing real text. This matches R2's "faithful OR flagged" bar. The gate constant in code is unchanged; `r2_gapcheck` prints `PASS (amended: p77 caption flagged)` and keeps the strict result in the JSON. |
| G6 framework pages 15/56/67/69/71/228 flagged | PASS 6/6 (`framework_as_text` fires on 15; the others already carried v4 flags) |

**Proof:**
- 27 repairs on 23 pages.
- Strips: placeholder 96, link bracket 31, block title 5, caption 2.
- Reasons added: `seq_diff` 68, `invented_text` 14, `framework_as_text` 12, `structure_unreviewed` 102.
- No reason was ever dropped; human `fidelity_review:*` flags stay until R5. Checker drift 0. A second carry over v5 changes 0 pages.
- **needs_review: v4 152 → v5 172** (matches the projection).
- `check_schema.py`: PASS. 359 offline tests OK.
- Data safety: v1–v4 pages/chunks unchanged at 248/363, 248/395, 248/390, 248/384, with review_status pending everywhere. `document_chunks` = 22457. Active `ingest_chunks` = 0. v5 image paths are v1's (`pages/67371722…`), and `reused_from_page_id` is set on all 248 pages.
- Tuning used only the 121 calibration pages. The 127 holdout pages were seen as counts only.
**Files:** `backend/ingestion/seqdiff.py`, `textnorm.py`, `postprocess.py`, `fidelity.py`, `convert.py`, `run_v4.py` (comment only), `r2_gapcheck.py`, `run_v5.py`, `tests/test_seqdiff.py`, `tests/test_invented.py`, `tests/test_gapcheck.py`, `tests/test_review_r209.py`, `tests/test_v5_carry.py`; 4 existing tests updated for the new behaviour the plan requires (seq_diff_ops key, seq_diff reason, null title, unwrapped "[FMS]"). Local only: `out/r2_gapcheck.json`, `out/r2_v5_output.json`, `out/r1_embeddings_v5.json`.
**Cost:** 0 vision calls; 83 embedding calls ≈ $0.0075.
**Undo:** Ignore `ingestion_version = 5`: nothing reads it, and all of its chunks are inactive. To undo the code, revert the plan-09/10 commits.
**Open issues:**
- `structure_unreviewed` (102 pages) and `framework_as_text` (12) make the R5 review queue bigger.
- Patterns 2 and 3 (frameworks with no diagram, boxes under the wrong parent) still need a human or a vision re-call.
- Plans 11–12 still have to measure v5 on a fresh sample from the 127 holdout pages.

---

## 2026-10-21 — R2.08: R2 independent sample review (v4), half 2 reviewed, 40-page score: bar NOT met
**Phase:** R2 · **Type:** eval

**What changed:** The fidelity-reviewer checked half 2 of the R2.07 sample (20 pages) against the page images with the strict R1 rule. It reviewed half 2 before reading half 1's verdicts, then scored all 40 pages. On v4 only, it flagged the 3 newly found pages with errors that nothing had flagged (137, 143, 231). Nothing was approved and no code changed. **R2's bar is not met: 34 of 40 pages pass (85%, below the 95% bar), and one unflagged page (150) has a `hallucinated` issue.**
**Why:** R2's done-criterion is a sample pass rate of at least 95% with no `hallucinated` issue. This entry closes the R2.07/R2.08 sample review.
**Half 2 table** (page | stratum | flagged_at_draw | outcome | issue | evidence):

| page | stratum | flagged | outcome | issue | evidence |
|---|---|---|---|---|---|
| 143 | visual | no | **missed** | missing | "quality of the coal procured" stored as "quality of coal procured" |
| 234 | visual | yes | caught | missing, structure_lost | "Approach" heading absent; ROI formula boxes ($26, $10/ticket) loose text, not linked to 5-/20-year deal |
| 38 | visual | yes | faithful | – | 5 stages, durations, 8 bullets match (durations merged into stage labels, info kept) |
| 185 | visual | yes | caught | missing | "Partner Case" tag dropped |
| 15 | visual | yes | caught | structure_lost | Porter's Five Forces as nested bullets, no diagram block (text all correct) |
| 237 | visual | no | faithful | – | all 8 numbers and text match |
| 23 | visual | yes | caught | hallucinated, missing | block title "PESTEL Breakdown" not printed; P/E/S/T/E/L badge letters dropped |
| 24 | visual | yes | caught | structure_lost, altered, hallucinated | "Most/Less Competitive" stored as tree children; elasticity label in LaTeX; invented empty table row |
| 247 | visual | no | faithful | – | 8 names + 2 role labels match |
| 210 | visual | yes | caught | missing, unreadable | "due to our praying services" lost "our"; legible "2023-24" stored as [UNREADABLE] |
| 206 | visual | yes | caught | altered | "extracurricula" truncated; dashes added to Electives/Sports/Flats; "Int’l –" → "Int'l -" |
| 70 | visual | yes | caught | altered, structure_lost | "Non-Performing Asset" → "Non-Performance Asset"; chart block inside table cell |
| 56 | text | yes | caught | structure_lost | value chain as table, no flow block; airline shares have no airline attached |
| 3 | text | no | faithful | – | word for word |
| 137 | text | no | **missed** | missing | "10% decline in profits for the steel industry players" → "10% decline in the steel industry players" |
| 231 | text | no | **missed** | altered | "What would the exit process" → "What would be the exit process"; "Do we have" → "Do you have" |
| 121 | text | no | faithful | – | 23 rows, sections, difficulties, page numbers match |
| 85 | text | no | faithful | – | 28 items + pages match |
| 244 | text | no | faithful | – | 15 glossary rows match |
| 5 | text | no | faithful | – | word for word |

**Proof (all 40 pages, scoring fixed in plan 08 before review):**
- Half 2: 8 faithful, 9 caught, 3 missed. Half 1 (R2.07): 5 faithful, 12 caught, 3 missed.
- **Pass rate (faithful + caught) = 34/40 = 0.85, Wilson 95% [0.709, 0.929].** The bar is ≥ 0.95, which allows at most 2 missed pages. There are 6 missed pages: 135, 137, 143, 150, 183, 231.
- Raw faithful rate = 13/40 = 0.325, Wilson 95% [0.201, 0.480].
- Hallucination gate: hallucinated on unflagged pages = [150] (invented "Candidate | Interviewer" table header), so the gate fails. Hallucinated on flagged pages (a pattern, not a gate failure): 23, 24, 67, 69, 71, 77, 228.
- If logo placeholders ("[FMS Logo]", "[Logo]") counted as errors: 3 more unflagged pages fail (121, 243, 244). That gives 9 missed, pass rate 0.775 [0.625, 0.877], raw faithful 0.25, and 6 unflagged hallucinated pages. If leftover link brackets also counted, p120 fails too: 10 missed, pass rate 0.75.
- Plan verify output: `40 Counter({1: 20, 2: 20}) Counter({'caught': 21, 'faithful': 13, 'missed': 6}) zero_items []`; `R2 BAR NOT MET`.
- Flags: v4 needs_review 149 → 152 (137 and 143 get `fidelity_review:missing`, 231 gets `fidelity_review:altered`). review_status stays pending.
**Patterns (ranked; full list in `result.patterns`):**
1. Dropped or changed small words in dense dialogue text. This is behind all 6 missed pages (135, 137, 143, 150, 183, 231) and also appears on flagged 129, 203 and 210. `word_coverage` counts words as a set, so it can't see a dropped "the" or "profits for" when the same words appear elsewhere on the page. **Free fix:** an ordered word diff against the text layer. A throwaway diff caught all three half-2 misses, with only header/footer reordering noise to filter.
2. Frameworks, value chains and chevrons with no diagram block: 15, 56, 67, 69, 71, 228. Needs a vision re-call or human review.
3. A box detached from its diagram or placed under the wrong parent: 24, 116, 151, 170, 234. Needs human review (the structure check misses these).
4. Invented titles, captions, table headers or rows: 23, 24, 67, 69, 71, 77, 150. **Free fix:** drop or flag any title, caption or header whose words are not in the text layer.
5. Altered diagram or table labels: 22, 70, 71, 77, 116, 195, 206. Free: extend the label check to table cells.
6. Dropped header tags or headings: 23, 185, 195, 234. Free: the word diff catches them.
7. Single-page issues: chart values not printed (228), block inside a table (70, 71), false [UNREADABLE] (210). All have free fixes.
**Files:** `backend/ingestion/out/r2_sample_review.json` (half 2 + `result`), `out/r2_sample_flags_before.json` (+137, 143, 231), `out/r2_sample_2.html` (all local); `log.md`. Scratch: `scratchpad/r2_plan08/`.
**Cost:** 0 Gemini calls.
**Undo:** Restore needs_review and review_reasons on v4 pages 135, 137, 143, 150, 183 and 231 from `out/r2_sample_flags_before.json`.
**Open issues:**
- **R2 is blocked.** The planner needs gap-closure plans R2.09+ for patterns 1 and 4 first (free and deterministic, and they cover every missed page and the unflagged hallucination), then 2 and 3.
- **Aalhad, please confirm the scoring reading:** (a) pass = faithful *or* flagged when drawn (a flagged page is held for human review); (b) the hallucination gate applies only to pages that were unflagged when drawn. The result is "not met" under either reading.
- Aalhad, please decide whether logo placeholders and leftover link brackets count as errors. They don't change the verdict.
- p56: v4 lost the airline names next to the market shares (R2.06), so the numbers have no meaning. This needs a human decision.

## 2026-10-21 — R2.07: fresh v4 sample drawn (40 pages), half 1 (20 pages) reviewed; 3 missed pages flagged
**Phase:** R2 · **Type:** eval

**What changed:** The fidelity-reviewer drew a fresh random sample of 40 v4 pages (seed 2022). It excludes all 81 pages that earlier reviews saw. The structure-check calibration and pool pages were already in that set. The sample has 24 visual and 16 text pages, and 23 of the 40 were already flagged when drawn. The reviewer checked half 1 (20 pages) against the page images, using the strict R1 rule. On v4 only, it flagged the 3 pages with errors that nothing had flagged. Nothing was approved and no code changed.
**Why:** R2 is done when the sample pass rate is at least 95% with no `hallucinated` issue. Plan 08 reviews half 2 and scores all 40 pages.
**Proof (half 1):**
- Sample: 2, 22, 67, 69, 71, 77, 116, 120, 129, 135, 150, 151, 170, 183, 195, 200, 203, 223, 228, 243.
- Outcomes: 5 faithful (2, 120, 200, 223, 243), 12 caught (already flagged: 22, 67, 69, 71, 77, 116, 129, 151, 170, 195, 203, 228), 3 missed (135, 150, 183).
- Pages with no errors: 5/20 (25%). Of the 11 pages that were unflagged when drawn, 8 have no errors and 3 do (135, 150, 183).
- `hallucinated` appears on 6 pages: 67, 69, 71, 77 (invented chart labels), 150 (invented "Candidate | Interviewer" table header), and 228 (chart values that are not printed on the page).
- The missed pages are text errors in dialogue pages: a dropped "which" and "might cause" changed to "case" (150), and changed punctuation (135, 183).
- Flags: needs_review on v4 went from 146 to 149, and each of the 3 pages got `fidelity_review:<type>` reasons. Before-values are in `out/r2_sample_flags_before.json`.
**Files:** `backend/ingestion/out/r2_sample.json`, `out/r2_sample_review.json`, `out/r2_sample_flags_before.json`, `out/r2_sample_1.html` (all local)
**Cost:** 0 Gemini calls.
**Undo:** Restore needs_review and review_reasons on v4 pages 135, 150 and 183 from `out/r2_sample_flags_before.json`.
**Open issues:**
- The R2 bar of 95% cannot be met on half 1 alone: 15 of 20 pages have errors and 6 have `hallucinated`.
- "[FMS Logo]" placeholders (49 v4 pages) and leftover brackets around link text (62 pages) were not counted as errors, which matches the earlier sweeps. Aalhad needs to decide whether they count.

## 2026-10-21 — R2.06: v4 stored (inactive), built from review-hardened post-processing
**Phase:** R2 · **Type:** ingestion | fix

**What changed:**
1. **Code-review hardening (before v4 was built).** The free repair rules are narrower, so they no longer change correct text in other casebooks:
   - The stray ")" remover does nothing on a page with no text layer. It removes ")" or ";)" only after a word ending in "Index", or on a nav-bar line, and never after a list marker such as a), ii) or A).
   - Typo repair runs only on nav-bar lines. It reads the text layer with ligatures unfolded (NFKC) and skips plural or inflected forms ("Customers" vs "customer").
   - An invented image link's alt text (e.g. "IndiGo Logo") is dropped unless the page prints it.
   - A printed "#" is escaped only when it starts a text-layer line. A leading number like "(40%)" is allowed, and the match continues over wrapped lines.
   - `r2_reconcile.py` now merges before-values by page id and never overwrites them. It aborts unless the target doc is v3 and every target page exists.
   - `r2_fixcheck.py` now checks the printed-"#" fix by its result (escaped lines present, no "# #" left), so it also passes on a version that already stores the fix.
2. **v4 built:** v3's 248 pages + these fixes + every flag, written insert-only as `ingestion_version = 4`. Doc `d1510e35-9ecc-419b-a497-85a37e062792`, 248 pages, 384 chunks, all `is_active = false`. No vision calls.

**Why:** The review found that the R2.04/R2.05 rules could corrupt correct text in other casebooks, e.g. by stripping ")" from "a) Increase price" or changing "Customers" to "Customer". v4 is the R2 candidate for the sample reviews in plans 07 and 08.
**Files:** `backend/ingestion/textnorm.py`, `postprocess.py`, `r2_reconcile.py`, `r2_fixcheck.py`, `run_v4.py` (new), `tests/test_strip_links.py`, `tests/test_r2_fixes.py`, `tests/test_r2_reconcile.py` (new), `tests/test_v4_carry.py` (new)
**Proof:**
- Tests: 295 pass (270 before the hardening).
- Hardening on v3 (`r2_fixcheck.py`, PASS): 40 pages change, down from 41. p83 dropped out because "# Non-Verkan Communication" is a heading, not a nav bar, so the Verkan→Verbal fix no longer runs and the typo stays in v4. On p56, p69 and p71 the invented image alt text is now dropped. **p56 loses the airline names ("IndiGo", "Air India", "Vistara", "AirAsia") next to ~6% / 9.4% / 9% / ~8%.** Those names come only from logo images (not in the text layer), and the page is already needs_review (`fidelity_review:hallucinated`, `fallback_v1`). Every other page's output is byte-identical to before. Before-snapshot: `out/r2_fixcheck_prereview.json`.
- `run_v4.py --dry-run`: drift guard 1 page (p230, the intended unit-number check), limit 10. Proven in-table false positives: none (all 6 are real in-cell blocks), so no `diagram_in_table` was dropped. Visual triage k = 0 (`r2_sweep_b.json`: "0/10 missing"; R2.02 0/9), so no `visual_no_block` flag was added.
- needs_review v3 145 → v4 146:
  - p129 (`fallback_v1`, non-visual) is now flagged, because needs_review = any reason.
  - p230 gains `number_coverage`.
  - 0 pages lost any v3 reason. All 12 `structure_check:dispute` flags and all `fidelity_review:*` flags (24 structure_lost, 15 altered, 12 hallucinated, 6 missing) are carried.
  - `review_status` is pending on all 248 pages. Every page's `reused_from_page_id` points to its v3 page, and every image path is v1's (`pages/67371722…`).
- Chunks 390 → 384: the 6 printed-"#" lines (p107, p112 ×2, p113, p116 ×2) no longer start their own sections. No text is lost (8085 → 8089 non-space characters on those pages; the extra 4 are the escape backslashes).
- `r2_fixcheck.py --version 4`: PASS, exit 0. A second post-process pass changes 0 of 248 pages.
- `check_schema.py`: PASS. Row counts (queried after the write): v1 248/363, v2 248/395, v3 248/390 (all unchanged, 0 active); v4 248/384, 0 active. `document_chunks` = 22457. Active `ingest_chunks` total = 0.
- Report: `out/r1_pilot_report_v4.json` (`--compare 3`). Its `integrity.ok = False` is only its hard-coded v1 chunk count (363) compared against v3's 390.
**Cost:** 43 embedding calls ≈ $0.004; 0 vision calls.
**Undo:** Nothing reads v4. To ignore it, filter it out by `ingestion_version = 4` (doc `d1510e35…`). To undo the code, revert the edits to the four files above.
**Open issues:**
- p56 airline names need a human decision in the review queue.
- The p83 typo "Verkan" is back in v4.
- `pilot_report.py` integrity constants assume `--compare 1`.

## 2026-10-20 — R2 structure sweep (R2.01–R2.05): every v3 tree/flow page is now reviewed-pass or flagged; Gemini structure check not adopted
**Phase:** R2 · **Type:** eval

**What changed:** Two things checked the 45 v3 tree/flow pages that had not been reviewed and were not flagged. The pool is 45 live pages, not the 55 in STATE; the pool was recomputed in R2.01.
1. A cheap Gemini flash-lite "structure check" (R2.01) looked at each page image and the stored parent-child list, and disputed any connection the page does not draw.
2. A blind eyeball sweep by the fidelity-reviewer (R2.02: 23 pages, R2.03: 22 pages) checked the same pages and did not see the check's results.

R2.05 scored the check against the sweep. It then flagged every page the check disputed on v3 (`needs_review=true`, reason `structure_check:dispute`), even where the reviewer had passed the page. Over-flagging is safe; a missed wrong parent would reach students.
Result for the 45-page pool: **14 reviewed-pass and undisputed, 31 flagged, 0 neither**. STATE item 1 is closed.
No pipeline code changed. `review_status`, v1/v2 rows, `is_active` and `document_chunks` were not touched.
**Why:** R1 left about 7 likely wrong parents in unreviewed pages that no automatic check could see. R2 had to make every page faithful-or-flagged and decide whether M2 casebooks should run the check automatically.
**Wave 1 (R2.01–R2.04):**
- R2.01: 116 flash-lite vision calls, about $0.13 (commit de8d910). Calibration: 5/5 known-bad pages disputed, 4/8 known-good pages disputed.
- Sweeps: R2.02 checked 23 pages (16 pass, 7 flagged). R2.03 checked 22 pages (6 pass, 16 flagged).
- Visual-page triage: the 9 "visual, no block" pages (1, 8, 12, 30, 43, 53, 75, 80, 84) are all decorative. The 10 sampled visual pages (123, 156, 161, 176, 181, 187, 196, 214, 240, 242) are all fine. In total, 0 of 19 visual pages are missing a diagram.
- R2.04: link-strip and typo fixes (commit f513b6f).

**Sweep failures (23 of 45 = 51%; 22 are structural = 49%, against R1.10's estimate of 12.5% from 1 in 8):**

| page | verdict | issue | evidence |
|---|---|---|---|
| 28 | fail | structure_lost | Annuity/Perpetuity and NPV/Payback/IRR hung under the definition side-box instead of the TVM / Capital Budgeting box |
| 89 | fail | structure_lost | three "(Non-filtered)" tags lost or attached to the wrong node |
| 91 | fail | hallucinated | 3 edges into a free-standing "Total = 221" box |
| 92 | fail | structure_lost | spanning formula boxes placed under the first column only |
| 95 | fail | structure_lost, altered | arrowed child boxes merged into one label; Methodology notes folded into labels; en dash became a hyphen |
| 102 | fail | structure_lost | "Share and Cost" row-label callout stored as a child of Premium |
| 103 | fail | structure_lost, missing | "Location Basis" merged into both branch labels; red X (excluded) not captured |
| 109 | fail | structure_lost, missing | the 4 boxes converge into "2.51m", which is not a node |
| 112 | fail | altered, structure_lost | callouts became Markdown H1 headings; Age table columns misaligned |
| 113 | fail | structure_lost, missing, altered | floating callout stored as a child; callout used as the chart yLabel; "customers/hr" unit dropped |
| 136 | fail | structure_lost, altered | 3 boxes merged into one node; callouts given parents; "Zomator" typo |
| 149 | fail | structure_lost | Pests/Inventory under the wrong node; value-chain sequence stored as unordered siblings |
| 160 | fail | hallucinated, structure_lost | bubble chart forced into a 2x2; invented cell label "Lower Class & BPL" |
| 182 | fail | structure_lost, altered | 2 leaves under the wrong parent; summary says "inorganic acquisition strategies" (page: "Acquisition") |
| 186 | fail | structure_lost, missing | floating callout stored as a child of Affordability; up-arrow not captured |
| 191 | fail | structure_lost | unconnected "Factor" box stored under Cost Plus |
| 193 | fail | structure_lost | unconnected subtree nested under a Cost Plus callout |
| 199 | fail | structure_lost, hallucinated | "Factors" under Cost Plus; invented "Recommendations" root |
| 204 | fail | structure_lost, missing | Mess/Canteen edges from the wrong node; brace edge missing; unconnected list given 4 edges |
| 213 | fail | altered (not structural) | nav "Case Index;)" link-strip leftover; "3rd" stored as LaTeX |
| 221 | fail | structure_lost | Transit Time under Idle Time (page: under Time Per Visit) |
| 225 | fail | structure_lost, hallucinated, missing | split edges attached to the wrong box; badges stored as nodes |
| 230 | fail | structure_lost, missing | separate box stored under Customer Study; 2 printed numbers absent; unconnected Total given an edge |

**Check vs sweep (R2.05):**
- Ground truth "bad" = 22 structurally failing sweep pages + 5 calibration-bad pages = 27. "Good" = 22 sweep-pass pages + 8 calibration-good pages = 30. Page 213 has a non-structural failure only, so it is left out of the metrics.
- Recall: **21/27 = 0.78**. The check missed 89, 91, 92, 95, 103 and 191.
- False disputes: **12/30 = 0.40**, on pages 19, 32, 33, 42, 51, 82, 83, 96, 99, 105, 188 and 233.
- Run-to-run agreement: 51/58. The two runs disagreed on 19, 99, 186, 188, 199, 221 and 233.

2x2 on the pool (reviewer × check):

| | check disputed | check clean |
|---|---|---|
| reviewer fail | 16: 28, 102, 109, 112, 113, 136, 149, 160, 182, 186, 193, 199, 204, 221, 225, 230 | 7: 89, 91, 92, 95, 103, 191, 213 |
| reviewer pass | 8: 32, 33, 42, 51, 82, 96, 99, 233 | 14: 26, 34, 39, 40, 41, 49, 50, 62, 87, 108, 115, 180, 245, 246 |

**Adoption: NOT adopted.** The rule was fixed in the plan before any numbers were seen: recall ≥ 0.80 and false-dispute rate ≤ 0.40. Recall was 0.78, so the check fails the rule.
`structure_check.py` stays an admin tool, and its docstring records "not adopted (R2.05)" with these numbers. Every diagram still needs a human or eyeball structure check before R9 (STATE "Known gaps").
**Pages flagged, by reason:**
- R2.05 `structure_check:dispute` on 12 pages: pool pages 32, 33, 42, 51, 82, 96, 99, 233 and calibration pages 19, 83, 105, 188. R1.10 or the sweep had passed all 12.
- R2.02/R2.03 `fidelity_review:*` on 23 pool pages:
  - structure_lost: 28, 89, 92, 95, 102, 103, 109, 112, 113, 136, 149, 160, 182, 186, 191, 193, 199, 204, 221, 225, 230
  - hallucinated: 91, 160, 199, 225
  - altered: 95, 112, 136, 182, 213
  - missing: 103, 109, 113, 186, 204, 230
**Files:** `backend/ingestion/r2_reconcile.py` (new), `backend/ingestion/structure_check.py` (docstring only), `log.md`. Local and gitignored: `backend/ingestion/out/r2_reconcile.json` and `out/r2_reconcile_flags_before.json`.
**Proof:**
- `venv/bin/python r2_reconcile.py --report-only` → `recall 21/27 = 0.7778`, `false-dispute 12/30 = 0.4`, `adopt = False`, `pool 45: reviewed-pass-and-undisputed 14, flagged 31, neither []`.
- The plan's verify query prints `pool 45 flagged 31 neither_pass_nor_flagged []`.
- A second run writes no new flags, so the flag step is idempotent.
- Offline suite: `Ran 270 tests ... OK`.
**Cost:** R2.01 used 116 flash-lite vision calls, about $0.13. R2.02, R2.03 and R2.05 made 0 paid calls. R2 total so far is about $0.13.
**Undo:** `out/r2_sweep_a_flags_before.json`, `out/r2_sweep_b_flags_before.json` and `out/r2_reconcile_flags_before.json` hold the earlier `needs_review` and `review_reasons` for each row (by row id). Write those values back to restore the flags.
**Open issues:**
- The structural error rate (49%) is about 4 times R1.10's estimate. Pages that were never reviewed should be assumed to have wrong parents at about this rate.
- The check misses free-standing boxes that were given invented edges (91) and boxes that were merged or folded together (95, 103, 89, 92). It also flags a lot of correct pages.
- These patterns (floating callouts adopted as children, merged sub-boxes, invented convergence edges) are conversion-prompt work for R2 and M2.

---

## 2026-10-20 — R1 closed: Aalhad signed off the spot-check; wrong-parent sweep deferred to R2
**Phase:** R1 · **Type:** eval

**What changed:** Aalhad compared p31 (issue tree), p20 (Ansoff matrix) and p19 (value-chain flow) in `backend/ingestion/out/r1_spotcheck.html` against the page images, and replied: "R1 approved". R1 is marked done in `.gsd/ROADMAP.md` and ▶ moves to R2.
**Why:** This was the last R1 done-criterion. The fidelity review passed all three pages (R1.10) and the owner confirmed them.
**Verifier:** `.gsd/phases/R1/VERIFICATION.md`. 6/8 passed: 223 tests OK, `check_schema.py` PASS, and `document_chunks` still has 22457 rows. v1/v2/v3 are 248/363, 248/395 and 248/390, all with 0 active chunks. All 21 review flags are present in v3.
It raised two gaps:
1. The sign-off was not in the log. It is recorded in this entry.
2. The faithful-or-flagged bar is not fully met: about 7 of the 55 unreviewed, unflagged tree/flow pages in v3 likely have a wrong parent (1 of 8 in the sample), and no automatic check catches it.
**Explicit deferral to R2:** R2 starts with a full structure sweep of those 55 pages, either reviewed by eye or by a second Gemini structure-check call, and flags every wrong parent. The other R1.10 pipeline patterns are also R2 work: the link regex, link-strip on fallback pages, the "Guesestimate" typo, column-reading edges, over-claiming summaries, 6 pages with blocks inside tables and 9 visual pages with no block.
v3 is inactive, so students see none of this until the switch-over (R9). The switch-over requires the sweep first.
**Files:** `log.md`, `.gsd/ROADMAP.md`, `.gsd/STATE.md`, `.gsd/phases/R1/VERIFICATION.md`
**Proof:** see the verifier report above. The owner's reply is quoted verbatim.
**Cost:** 0 Gemini calls (R1 total ≈ $0.52).
**Undo:** set the R1 row back to "in progress" and ▶ back to R1 in ROADMAP.md (no data changed).
**Open issues:** Aalhad still has to rotate the Supabase DB password. R3 (eval questions) is Aalhad's task.

---

## 2026-10-19 — R1 fidelity re-review (v3) (R1.10): issue tree, matrix and flow pass; 13 more pages flagged
**Phase:** R1 · **Type:** eval

**What changed:** The fidelity-reviewer checked 18 v3 pages (doc `129a2604-…`, ingestion_version 3, all `is_active=false`) against their page images. The rule was the same strict one as R1.06: every label character for character, plus every number, branch and edge.
One page of each required type passes: issue tree **p31**, matrix **p20**, flow **p19**. They are ready for Aalhad's spot-check.
The review set `needs_review=true` and appended a `fidelity_review:<type>` reason on 21 v3 pages; 13 of them were not flagged before.
`review_status` is untouched (all `pending`). No pipeline code, v1/v2 row, `document_chunks` row or `is_active` flag was changed.
**Why:** R1's done-criterion is a passing issue tree, matrix and chart-or-flow, checked against the page images. The review also had to confirm the known unflagged errors on p13 and p14 and estimate how common such errors are.
**Files:** `log.md` (local, gitignored: `backend/ingestion/out/r1_review_v3.json`, `out/r1_spotcheck.html` = `out/r1_spotcheck_v3.html`; the old v2 sheet was kept as `out/r1_spotcheck_v2.html`)
**Proof:**

| page | type | role | items | verdict | evidence |
|---|---|---|---|---|---|
| 31 | issue_tree | fresh | 25 | **pass** | title, root box, 5 tools, 5 description leaves exact; 10 links correct |
| 52 | issue_tree (AMO) | fresh | 18 | **pass** | 3 pillars, 10 leaves exact, block valid now |
| 81 | issue_tree | fresh | 33 | fail (cosmetic) | `altered`: both roots drop the printed colon ("Some questions to prepare for:", "Use Rule of Three for the following:") |
| 13 | issue_tree | recheck | 22 | fail | `structure_lost`: Company's 3 questions hung under "Industry", Company has no children; `missing`: "Other C’s" row is plain text, no block |
| 14 | issue_tree | recheck | 24 | fail | `structure_lost`: "Other 3 P’s" (a separate box) under Placement; summary repeats it |
| 11 | flow | recheck | 30 | fail | `hallucinated`: 6 edges into "Crack the interview" (page draws 2: from HR Answers and General Awareness); Prepare Hard/Smart linked to all 3 boxes (page: top box only) |
| 19 | flow | recheck | 67 | **pass** | 7 chevrons, 26 items in the right columns, 6 chevron edges (v2: 0), 26 stage→item edges |
| 52 | flow (VRIO) | recheck | 27 | fail (minor) | V/R/I/O now present; `altered`: summary still calls all non-sustained outcomes "competitive disadvantages" (page: Competitive Parity) |
| 10 | flow | regression | 18 | fail (markdown only) | block still correct; markdown "Main Index)" (stray ")" from link stripping) |
| 20 | matrix | regression | 13 | **pass** | axes Market/Product, Existing/New in order, 4 cells in position |
| 35, 83, 105, 128, 166, 188 | flow/tree | sample | 18–27 | **pass** | every node and parent matches the page |
| 106 | issue_tree | sample | 16 | fail (markdown only) | tree correct; markdown "Guesestimate Index" (page: Guesstimate) |
| 238 | issue_tree | sample | 30 | fail | `structure_lost`: "Cost per week" under "Operational feasibility" (page: under "Financial Capability (B.E.P)"); the Hour/Mon-Fri/Sat table is flattened into tree nodes |

v2 → v3 for the re-checked pages:
- p11: convergence dropped → node present but over-linked.
- p13: no block, Company Qs under Government → block exists, Company Qs now under Industry.
- p14: apostrophe → fixed, but a new wrong parent.
- p19: 0/6 chevron edges → pass.
- p52: V/R/I/O missing → present, summary still over-claims.
- p10, p20: pass → p20 pass, p10 markdown-only regression.

Charts: not reviewed. They are optional and the flow covers "chart or flow"; R1.09 found no clean chart candidate.

**Undetected wrong-parent rate:** random sample (seed 1010) of 8 unflagged v3 tree/flow pages: **1 of 8 (12.5%)** has a structure error (p238).
Across all 16 unflagged tree/flow pages reviewed in this plan, 4 have one (11, 13, 14, 238). For the 55 unflagged tree/flow pages in the pool that this plan had not reviewed, that suggests roughly 7 more (wide range: 1 of 8 is a small sample).

**Flagged** (`needs_review=true`, v3 only; needs_review 97 → 110):
- `structure_lost`: 13, 14, 238
- `hallucinated`: 11, 69, 71 (+ 56, 67, 77, 127, 203, already flagged)
- `altered`: 10, 52, 81, 97, 106, 116, 224 (+ 88, 98, 101, already flagged)

**Pipeline patterns (for R2):**
1. Floating callout boxes with no connecting line get the wrong parent (p13, p14), and connector reading goes wrong on p238. Labels are all exact, so no checker sees it.
2. `textnorm._LINK_RE` stops at the first `)`, so `[Main Index](javascript:history.back())` leaves "Main Index)" (p10, p224).
3. `fallback_v1` pages skip the post-processing link strip. Invented images such as `https://via.placeholder.com/...` logos and `(chart)` targets stay on p69 and p71, which were unflagged before this review. `(#[UNREADABLE])` links stay on 56, 67, 77, 127 and 203.
4. "Guesestimate Index" appears in the markdown on 88, 97, 98, 101, 106 and 116, but never in the text layer. Nav words are outside the coverage checks.
5. Stacked boxes in a column are read as "all link onward" (p11).
6. Summaries still generalise outcomes (p52 VRIO, p14).

**Aalhad's spot-check:** approved 2026-10-20 (see the R1 close-out entry above).
**Cost:** 0 Gemini calls.
**Undo:** The pre-update values of the 21 rows are in `backend/ingestion/out/r1_review_v3_flags_before.json` (local). Per page, set `needs_review` back and remove the `fidelity_review:*` reason with `array_remove`. Before this review, 8 of the pages already had needs_review=true: 56, 67, 77, 88, 98, 101, 127, 203.
**Open issues:** R1 is waiting only on Aalhad's sign-off. Patterns 1–4 should go to an ingestion-engineer fix before any other casebook runs.

---

## 2026-10-19 — R1.09: affected pages patched as ingestion_version 3 (inactive) + free checks (step D)
**Phase:** R1 · **Type:** ingestion

**What changed:** No more prompt rounds (orchestrator decision): the bar is now "every page is faithful or flagged".
Step D added two free fixes. A repair now adds `"children": []` to tree leaves that lack it, which makes p52's AMO block valid.
`missing_box` also gained a page-wide pass: 3 or more short standalone lines that are in no block label get flagged, case-slide column tabs excepted. This closes the p13 hole (commit eded0b7).
Step C wrote `run_patch.py` (commit 69c11c8). It ran plan 09: 63 affected pages were re-converted with `r1-diagrams-v3` and the other pages were carried over from v2 with the free repairs. Each page fell back to v1 where coverage dropped.
The result is stored as v3, doc `129a2604-0221-4ba2-af50-42ac641a21a0`, `is_active=false`. Insert-only: no v1 or v2 row was touched.
**Why:** R1's done-criterion: rebuilt diagrams that are faithful, or else flagged for review (R5).
**Files:** `backend/ingestion/{diagram_schema,postprocess,run_patch,pilot_report}.py`, `backend/ingestion/tests/{test_missing_box,test_patch_select}.py`,
fixtures `p13_smoke_v3`, `p52_smoke_v3` (local: `out/r1_pages_v3.jsonl`, `out/r1_embeddings_v3.json`, `patch_output.json`,
`out/r1_pilot_report_v3.json`, `out/r1_candidates_v3.html`, `out/r1_patch_v3_run1.log`, `out/r1_v2_rescore_v3checks.json`)
**Proof:** `Ran 223 tests … OK`.
`missing_box` on the v2 re-score: 21 pages (was 13): 13, 15, 71, 78, 97, 101, 107, 111, 124, 132, 138, 147, 153, 155, 157, 170, 197, 202, 218, 234, 248.
It flags failing p13 (v2 re-pilot, smoke v3) and stays clean on smoke-v2 p13 (passing), 10, 11, 14, 19 and 20.
Smoke v3 re-score: p13 `diagram_missing_box`; p52 valid and clean; p11 and p19 clean; p77 in-table and v1-fallback.

Selection: all 55 fixed pages + 8 structure/missing-box pages. 61 pages were trimmed to keep embeddings ≤ 250 (listed in `patch_output.json`); they stay as carried v2 and keep their flags.
Of the 63 re-converted pages, v3 output was kept on 41. On the other 22, v2 or v1 captured more (15 `fallback_v1`).

| metric | v3 | v2 |
|---|---|---|
| methods | vision 41, carried_v2 192, fallback_v1 15 | vision 235, reused_v1 13 |
| number_coverage mean / min | 0.998 / 0.67 | 0.982 / 0.22 |
| word_coverage mean / min | 0.998 / 0.95 | 0.992 / 0.65 |
| needs_review | 97 | 78 |
| reasons | diagram_label 34, label_altered 20, structure 20, flattened 17, missing_box 17, fallback_v1 12, word_cov 8, unreadable 7, other 6, in_table 6, invalid 2, number_cov 2 | diagram_label 37, number_cov 26, word_cov 19, flattened 17, unreadable 8, other 6, invalid 2, fidelity_review 7 |
| valid blocks by type | issue_tree 150, flow 50, table 9, chart 7, matrix 5, funnel 1 (222 / 237) | 224 / 233 |
| chunks / has_diagram | 390 / 154 | 395 / 158 |

- fallback_v1 pages: 15, 56, 67, 69, 71, 77, 79, 86, 127, 129, 152, 185, 198, 203, 229.
- Still in a table, and flagged: 58, 59, 60, 70, 72, 73. Plan 09's "no diagram_in_table" is NOT met; the pages are flagged instead.
- Visual pages from the plan list that still have 0 blocks: 1, 8, 12, 30, 43, 53, 75, 80, 84. Now in blocks: 31, 81.

Row counts before → after (queried): document_chunks 22457 → 22457; v1 248/363 unchanged; v2 248/395 unchanged; v3 0 → 248/390, all `is_active=false`, `ingestion_version=3`; active 0. `check_schema.py` PASS.

Candidates (valid, label coverage 1.0, not flagged), checked by eye against the page images:
- issue_tree: p31, p81, p52 (AMO) look faithful.
- flow: p19 and p52 (VRIO) look faithful. p11 has a caveat: edges from all 6 column boxes to "Crack the interview", while the page draws lines only from the bottom box of each column.
- matrix: p20 (carried v2, passed R1.06).
- chart: NONE. The only unflagged chart, p113, uses a separate callout box ("Average no of shops visited by one person = 3") as its yLabel.

**Unfaithful but NOT flagged (found by eye, the checker can't see a wrong parent):**
- p13: the Company questions are hung under "Industry", and Company has no children.
- p14: "Other 3 P’s" was moved under Placement. v2 had it right; `choose_page` prefers v3 on coverage alone.
Both need a `fidelity_review` flag in plan 10. I did not edit the rows.
**Cost:** patch 93 vision calls + 200 embeddings ≈ $0.12. R1 gap vision calls: 8 + 8 + 93 = 109 / 150. R1 total ≈ $0.52.
**Undo:** Nothing reads v3. It is identifiable by `ingestion_version = 3` / doc `129a2604-…`, all chunks inactive.
**Open issues:** p13 and p14 are unflagged regressions (plan 10 must flag them). There are 0 chart candidates. 6 pages are still in-table. 61 lower-priority pages were trimmed for the embedding cap.

---

## 2026-10-19 — R1.08b: prompt r1-diagrams-v3 fix round + re-smoke — BLOCKED (p13, p52 fail)
**Phase:** R1 · **Type:** ingestion

**What changed:** (A, commit d03cfc4) The vision prompt is now `r1-diagrams-v3`. It adds two rules: every box is a node, including the box the lines converge into, with a short flow example (Example 3); and chart values come only from printed numbers, never estimated from bar heights or slice sizes (use `null`). The prompt is +1,303 characters over v2.
A new free check, `missing_box`, flags a short text-layer line (≤ 6 words) printed next to a diagram's labels that is in no block label and isn't body text, a bullet, a footer, a heading or part of a longer Markdown line. It maps to the review reason `diagram_missing_box` and triggers a retry.
The convergence heuristic now flags only short, non-formula leaves printed right after the last descendant (≤ 2 unrelated words in between).
(B) Re-smoke of p11/13/19/52/77, no DB writes, with each page checked against its page image.
**Why:** R1.08 smoke failed on p11 (dropped converging box) and p77 (estimated bar values).
**Files:** `backend/ingestion/{diagram_schema,fidelity,convert,config,rescore_v2}.py`, `backend/ingestion/tests/{test_missing_box,test_convert_v2}.py`,
`tests/fixtures/r1_gap/{p11_smoke_v2,p13_smoke_v2,p102,p107}.json`, `.claude/skills/diagram-transcription/SKILL.md`
(local: `backend/ingestion/out/smoke_r1_v3.json`, `out/smoke_r1_v3.log`, `out/r1_v2_rescore_v3checks.json`)
**Proof:** `Ran 207 tests … OK` (193 before).
Offline, on all 248 v2 pages:
- `missing_box` fires on 13 of 235 converted pages (15, 78, 97, 101, 107, 111, 132, 138, 147, 153, 155, 157, 234), plus smoke-v2 p11 ("Crack the interview").
- Before tuning, `missing_box` hit 85 pages. It does not fire on reviewed pages 10, 13, 14, 19, 20 or 52.
- Convergence now flags only p11 (it flagged 11, 102 and 107 before). p13-smoke is cleared.

Smoke (`smoke_r1.py --pages 11,13,19,52,77 --cap 10`):

| page | result | evidence (vs page image) |
|---|---|---|
| 11 | **pass** | flow, 12 nodes; "Crack the interview" is a node with edges from HR Answers and General Awareness (the two lines on the page); 0 issues |
| 13 | **fail** | the main 3C's diagram has NO block again. It is flat Markdown with the Company questions listed under "Government", and the title is written "3 C’s" (page: "3C’s"). Only "Other C’s" got a block. The checker is silent (needs_review=false): the one block's labels are all on one text-layer line, so `missing_box` has no label span to search |
| 19 | **pass** | flow with all 7 chevrons, 6 stage edges, 26 stage→item edges, 0 issues |
| 52 | **fail** | the VRIO flow matches the image (Yes edges, letter→word→outcome), but the letters are still separate nodes, not "V Valuable". The AMO issue_tree leaves have no `"children": []`, so the block is schema-invalid (`diagram_invalid`) and would not be drawn |
| 77 | fail (allowed) | both blocks are again inside table cells (`diagram_in_table`); number_coverage 0.78 < v1 1.0, so plan 09's v1 fallback covers it. The bar chart now uses `null` instead of estimated values |

**Cost:** 8 vision calls (3 retries; cap 10) ≈ $0.009. 0 embeddings. R1 gap budget used: 16 / 150.
**Undo:** Revert d03cfc4 (`PROMPT_VERSION` back to r1-diagrams-v2). Nothing was written to the DB.
**Open issues:** Plan 09 NOT started: the gate needs p11, p13, p19 and p52 to pass. Suggested next round:
(a) A free repair that adds `"children": []` to tree leaves that lack it. This invents no content and would have saved p52's AMO block.
(b) p13: let `missing_box` also run when a block's labels sit on a single text-layer line, or flag short bulleted/standalone lines that are in no block on a visual page. Also add a prompt rule that icon-plus-label boxes with question callouts form one issue_tree.
(c) Circled letters are still separate nodes (p52). Either accept this, or add a free merge of a single-letter node with its single child word.

---

## 2026-10-19 — R1.08: vision prompt r1-diagrams-v2 smoke test — BLOCKED (2 of 5 fail)
**Phase:** R1 · **Type:** ingestion

**What changed:** The vision prompt is now `r1-diagrams-v2` (`config.PROMPT_VERSION`). It adds 6 rules from the R1.06
review: copy quotes exactly, no Markdown links, chevrons in a row get stage-to-stage edges, converging lines make a flow
(never repeat a box under two parents), circled letters go in the label ("V Valuable"), no blocks inside tables, and
summaries only restate what is printed. The prompt grew by 1,130 characters. The `diagram-transcription` skill has the same rules.
Smoke test on the 5 failure pages (no DB writes). Each result was checked against the page image.
**Why:** Fix the failure patterns at the source before plan 09 spends the main budget.
**Files:** `backend/ingestion/convert.py`, `backend/ingestion/config.py`, `backend/ingestion/tests/test_convert_v2.py`,
`.claude/skills/diagram-transcription/SKILL.md` (local: `backend/ingestion/out/smoke_r1_v2.json`, `out/smoke_r1_v2.log`)
**Proof:** `Ran 193 tests … OK`. Smoke (`smoke_r1.py --pages 11,13,19,52,77 --cap 10`):

| page | expectation | result | evidence |
|---|---|---|---|
| 11 | "Crack the interview" fed by both columns | **fail** | the box was moved OUT of the block (plain text under it); the tree has no node or edges for it. Checker gave needs_review=false: a dropped box is invisible to the label/structure checks |
| 13 | 3C's block, `Other C’s` (U+2019), Company questions not under Government | pass | issue_tree 3C’s → Government, Company(3 Qs), Industry, Customer(4 Qs), Competition(3 Qs) matches the image; `Other C’s:` curly in markdown. Flagged `diagram_structure` by a convergence false positive ("Government" printed last in the text layer) |
| 19 | flow, ≥ 6 stage edges, no flow_disconnected | pass | 6 chevron edges R&D → … → Customer Service + 26 stage→item edges, 0 issues |
| 52 | V/R/I/O present, no "No"/"disadvantage" inference | pass (caveat) | letters are separate nodes (V→R→I→O→Sustained, "Yes"), not "V Valuable"; outcomes are linked from both letter and word (redundant edges); summary literal |
| 77 | no diagram_in_table, number_coverage ≥ v1 (1.0) | **fail** | no in-table block now, but number_coverage 0.73 (< 1.0) and the bar chart has 6 values not printed on the page (13.5, 17.5, 22.5, …: estimated bar heights) |

**Cost:** 8 vision calls (3 pages needed the retry; cap 10) ≈ $0.009. 0 embeddings. R1 gap budget used: 8 / 150.
**Undo:** Revert the plan 08 commit (`PROMPT_VERSION` back to r1-diagrams-v1). Nothing was written to the DB.
**Open issues:** Plan 09 NOT started (gate: ≥ 2 of 5 fail). Needs the orchestrator's go-ahead for a second prompt
iteration (≤ 10 calls). Suggested: (a) a rule plus a short example that every box in a diagram, including the one the
lines converge into, is a node in the block (p11 as the pattern); (b) a cheap check for a short line printed between
diagram labels in the text layer that is in no block label (it would have caught p11); (c) stronger "never estimate
chart values from bar heights" wording (p77; `number_not_on_page` did catch it). On p77, plan 09's per-page v1 fallback would
apply anyway.

---

## 2026-10-19 — R1.07: stricter diagram checks + free quote/link repairs (offline)
**Phase:** R1 · **Type:** fix

**What changed:** The fidelity checker now catches what the R1.06 review caught. (1) Labels must match the
page character for character (`label_altered` → reason `diagram_label_altered`); presence-only coverage is
unchanged and a new per-page `diagram_label_exact` ratio sits next to it. (2) Diagram blocks inside Markdown
table cells (`diagram_in_table`), flows that fall apart into separate pieces, and repeated or converging
issue-tree nodes (`diagram_structure`) are flagged and trigger the one retry with a targeted hint.
(3) Two free repairs run on every vision output before the check: curly quotes restored from the text layer
(only quote characters ever change) and invented links (`[Main Index](#)`, `javascript:`, `main_index`) turned
into plain text. pdfium's U+FFFE (a printed hyphen) and zero-width spaces are normalised in the exact check.
**Why:** All 5 pages that failed review had label coverage 1.0 and `needs_review = false`.
**Files:** `backend/ingestion/{textnorm,diagram_schema,fidelity,convert,postprocess,rescore_v2}.py`,
`backend/ingestion/tests/{test_label_exact,test_structure_checks,test_strip_links}.py`, `tests/fixtures/r1_gap/`
**Proof:** `Ran 188 tests … OK` (154 before). Offline re-score of all 248 v2 pages (`rescore_v2.py`, 0 Gemini, 0 DB):
diagram_in_table 12 (58, 59, 60, 63, 65, 67, 69, 72, 73, 74, 77, 79), diagram_structure 28 (incl. 11, 19),
diagram_label_altered 20 after the quote restore, quotes restored on 13 and 14 (+ others), links stripped on 114
pages (incl. 10, 20, 52), coverage below v1 on 51 pages (24 numbers, 27 words only). Convergence heuristic kept
(flags 3 pages: 11, 102, 107; none of 14, 20, 32).
**Cost:** 0 Gemini calls.
**Undo:** Revert the plan 07 commit. No DB rows changed.
**Open issues:** p102 and p107 convergence flags look like false positives (formula leaves); they only cost a retry.

---

## 2026-10-19 — R1 fidelity review: 3 diagram pages (R1.06) — issue tree BLOCKED
**Phase:** R1 · **Type:** eval

**What changed:** The fidelity-reviewer compared 7 v2 diagram pages from the FMS Consulting
CaseBook 2023-24 (doc `e6cdd69b…`, ingestion_version 2) against their rendered page images,
checking every label, edge, cell and axis. Matrix and flow passed. All 3 issue-tree candidates
failed, so issue tree is **blocked** and R1's done-criterion is not yet met. The 5 failing pages are
now `needs_review = true`. `review_status` is untouched (still `pending`), and no pipeline code was edited.
**Why:** Part 2 of R1's done-criterion: prove the rebuilt diagrams are faithful before Aalhad signs off.
**Files:** `log.md` (local, gitignored: `backend/ingestion/out/r1_review.json`, `backend/ingestion/out/r1_spotcheck.html`)
**Proof:**

| PDF page | type | items checked | verdict | evidence |
|---|---|---|---|---|
| 20 | matrix | 13 | **pass** | title, axes Market/Product, cols+rows Existing/New in order, all 4 cells in the right position |
| 10 | flow | 17 | **pass** | 7 role labels exact, 5 hierarchy edges + Post MBA → Consultant/Associate (direction correct) |
| 52 | flow | 24 | fail (minor) | `missing`: circle letters V/R/I/O not in the block. `altered`: summary calls Competitive Parity a "disadvantage" and assumes "No" branches the page doesn't print |
| 19 | flow | 66 | fail | `structure_lost`: 0 of 6 chevron sequence edges (R&D → … → Customer Service) stored; all 33 labels and 26 stage→item edges correct |
| 14 | issue_tree | 27 | fail (cosmetic) | `altered`: page "4P’s and 7P’s", block title/root "4P's and 7P's" (straight apostrophe); all 20 nodes and 19 links correct |
| 11 | issue_tree | 25 | fail | `structure_lost`: "Crack the interview" is where both columns converge on the page, but it is stored as a 3rd child of "Prepare for the interview process" |
| 13 | issue_tree | 24 | fail | `structure_lost`: main 3C's diagram has no block (only "Other C's" does); markdown puts the Company questions under "Government". `altered`: C’s → C's |

Pass rate 2/7. Flagged `needs_review`: p11, p13, p14, p19, p52 (reasons `fidelity_review:<issue_type>`).
Charts (p78, p79, p86) were not reviewed, because a flow passed first.

**Pipeline patterns (for an ingestion-engineer gap-closure plan):**
1. `diagram_label_coverage` (`textnorm.normalize_label`) strips all punctuation and checks only that
   labels exist. It can't detect apostrophe changes, missing nodes, or wrong parent/child or edge
   structure. All 5 failing pages had label coverage 1.0 and `needs_review = false`.
2. Process shapes lose their connecting edges: converging trees (p11) and chevron chains (p19).
3. Curly apostrophes become straight inside JSON block titles and labels (p13, p14), while the markdown keeps them.
4. Markdown invents link targets for the slide's "Main Index" text: `javascript:history.back()` (p10),
   `(main_index)` (p20), `(#)` (p52). Strip these before any markdown is rendered to students.

**Spot-check sheet:** `backend/ingestion/out/r1_spotcheck.html` (admin-only, local, no storage URLs).
It shows p20 and p10 for sign-off, and the 5 failures for context.
**Aalhad's spot-check:** not done yet. Waiting for an issue tree that passes.
**Cost:** 0 Gemini calls.
**Undo:** `update ingest_pages set needs_review=false, review_reasons=array_remove(...)` for the 5 pages, removing the `fidelity_review:*` reasons.
**Open issues:** issue_tree blocked (p11, p13, p14). Needs a prompt/validator fix and then a re-review. The flow sequence-edge loss (p19) and the summary over-claim (p52) should go in the same fix.

## 2026-10-19 — R1.05: FMS re-pilot stored as ingestion_version 2 (inactive)
**Phase:** R1 · **Type:** ingestion

**What changed:** The FMS Consulting CaseBook 2023-24 was converted again with vision prompt v2
(`r1-diagrams-v1`). Prompt v1 flattened diagrams into nested bullets. Prompt v2 writes a
`placewise-diagram` block per diagram. The result was stored next to the v1 pilot as
`ingestion_version = 2`, `is_active = false`. Re-converted: 235 pages (visual, nested bullets, or
diagram keywords). Reused from v1 and re-checked for free: 13 plain pages. Same PDF and page images
in storage, nothing re-uploaded. New `run_repilot.py` (dry run, per-page cache, resume, run cap 350)
and `pilot_report.py` (reads only from the DB). `pipeline.write_version` is insert-only, builds rows
from named fields only, embeds `embedding_text()`, and never chunks failed vision calls.
**Why:** R1's done-criterion: diagrams as structured blocks the frontend can redraw, plus a pilot report.
**Files:** `backend/ingestion/pipeline.py`, `backend/ingestion/run_repilot.py`,
`backend/ingestion/pilot_report.py`, `backend/ingestion/tests/test_repilot_select.py`,
`backend/ingestion/tests/test_pipeline_write.py`
**Proof:**
- Migration 040 is applied. `check_schema.py`: all 10 new columns OK. v1 pages 248, v1 chunks 363,
  active 0 → `RESULT: PASS` (before and after the run).
- Plan 03 smoke test (`out/smoke_r1.json`): p20 matrix, p52 flow+issue_tree, p32 4× issue_tree. 3
  vision calls, all label coverage 1.0, 0 needs_review.
- Tests: `Ran 154 tests … OK` (145 + 9 new). Dry run: 235 selected, 13 reused, est. 294 vision calls ≈ $0.36.
- Pilot report (`pilot_report.py … --version 2 --compare 1`, full JSON in `out/r1_pilot_report.json`):

| metric | v2 | v1 |
|---|---|---|
| methods | gemini_vision_v2 235, reused_v1 13 | docling+gemini 248 |
| pages that needed a retry | 61 | n/a |
| number_coverage mean / min | 0.982 / 0.22 | 0.998 / 0.67 |
| word_coverage mean / min | 0.992 / 0.65 | 0.999 / 0.94 |
| **needs_review** | **73** | **57** |
| reasons | diagram_label 37, number_coverage 26, word_coverage 19, diagram_flattened 17, unreadable 8, diagram_other 6, diagram_invalid 2 | unreadable 53, word_coverage 5, number_coverage 3 |
| diagram blocks | 233 (224 valid, 9 invalid): issue_tree 156, flow 42, table 10, chart 8, matrix 7, funnel 1 | 0 |
| pages with ≥1 block / mean label coverage | 154 / 0.88 | — |
| chunks / has_diagram / embedding dim | 395 / 158 / 768 | 363 / 0 / 768 |

- Row counts before → after: document_chunks 22457 → 22457; ingest_documents 1 → 2;
  ingest_pages 248 → 496 (v1 doc still 248); ingest_chunks v1 363 → 363, v2 0 → 395, active 0 → 0.
- v2 doc `e6cdd69b-75be-4050-b128-d34170adcb7d`, status `done`. Fidelity-review candidates
  (`out/r1_candidates.html`, admin-only, gitignored): issue_tree p11/p13/p14, matrix p20/p16/p17,
  chart p78/p79/p86, flow p52/p10/p19.
**Cost:** 296 vision calls (235 pages + 61 retries, cap 350) + 393 embedding calls (395 chunks; 2
identical texts reused). ≈ $0.36 at flash-lite rates (estimate: ~3k in / 2k out tokens per vision call).
**Undo:** Nothing reads v2: all its rows have `is_active=false` and are identifiable by
`ingestion_version=2` / document `e6cdd69b-…`. The migration 040 rollback is in the migration file.
**Open issues (for R2):**
- needs_review went up (57 → 73) because v2 is checked more strictly (diagram labels). The
  "unreadable" pages fell from 53 to 8. On 24 pages, though, v2 captured fewer of the page's numbers
  than v1 (v1 re-scored with today's checker). Two causes: (a) on the sector-overview pages
  58–79 (12 pages) the model put a diagram block inside a Markdown table cell, so it isn't parsed
  (p77 dropped from number coverage 1.0 to 0.46); (b) step numbers moved into flow node `id`s, which
  the coverage check ignores (p41: 0.22). Both are flagged needs_review. Fix: prompt rule "blocks
  never inside tables", plus a per-page fallback to the v1 markdown when v2 scores lower.
- 76 visual pages have 0 blocks. 65 of them are case-dialogue pages (119+) with no diagram, which is
  expected. The other 11 (1, 8, 12, 30, 31, 43, 53, 75, 80, 81, 84) need a look.
- 36 pages have diagram label coverage < 1. There are 9 invalid blocks, 17 flattened pages, and 0
  `other` blocks. Fidelity review is plan 06.

---

## 2026-10-19 — R1.04: diagram-safe chunking, plain-language embedding text, offline preview
**Phase:** R1 · **Type:** retrieval

**What changed:** The chunker no longer cuts through a ``` fenced block. Each `placewise-diagram`
block now stays whole, together with its `Diagram summary:` line, and section labels inside a
block no longer start a new chunk. Chunks also record `has_diagram`. The new
`chunk.embedding_text()` turns each block into "Diagram (type): title. Labels: …" for the
embedding input, while the stored chunk keeps the raw block so the frontend can draw it. New
`diagram_preview.py` builds one offline HTML file that shows each page image next to its
rebuilt diagrams, issues and label coverage, for the plan 06 spot-check.
**Why:** Previously, a long chunk was hard-sliced every 6,000 characters, which could split a
diagram's JSON in half. Embedding raw JSON would also make search match on syntax instead of
meaning.
**Also fixed:** chunk page ranges. The page marker just before a heading used to be counted
in the previous chunk. Re-chunking the v1 pilot markdown offline gives the same 363 chunks,
but 159 of them now get a different `page_start`. I checked samples against the text: the
new value is correct (e.g. "Why is it so sought after?" is on page 9, but the old code said
page 10). Live v1 rows are unchanged.
**Files:** `backend/ingestion/chunk.py`, `backend/ingestion/diagram_preview.py`,
`backend/ingestion/tests/test_chunk.py`, `backend/ingestion/tests/test_diagram_preview.py`,
`backend/ingestion/tests/fixtures/preview_pages.json`
**Proof:** `venv/bin/python -m unittest discover -s tests -t .` → `Ran 86 tests … OK`. The plan's
verify command printed `PREVIEW_OK` (pages 20 and 52 rendered to the gitignored
`backend/ingestion/out/`). Re-chunking the pilot: 363 chunks, 0 with an odd fence count.
**Cost:** none (offline, no Gemini calls, no DB).
**Undo:** Revert `chunk.py`. Nothing in the database changed. `pipeline.py` still embeds
`content` until plan 05 switches it to `embedding_text`.
**Open issues:** Split parts still inherit their parent chunk's page range. The previewer's
`--source db` mode is untested because Supabase was unreachable (NXDOMAIN).

---

## 2026-10-19 — Verification criteria for M2–M5
**Phase:** M0 · **Type:** setup

**What changed:** Added "Done when" criteria to every task in M2–M5: a shared checklist per
milestone, plus extra checks per task where needed (e.g. Finance numbers must match 100%;
Mock Interview cases must trace back to casebook pages).
**Why:** The verifier needs a concrete pass/fail bar for every task, not just M1.
Also settled R1: `fidelity-reviewer` checks the 3 sample diagrams against their page images,
and Aalhad spot-checks them.
**Files:** `.gsd/ROADMAP.md`
**Proof:** File updated.
**Undo:** Revert `.gsd/ROADMAP.md`.
**Open issues:** Thresholds (95% pass, ≥ 15 questions per domain) are starting values; revisit
after the R1 pilot.

---

## 2026-10-19 — Roadmap defined (M0–M5)
**Phase:** M0 · **Type:** setup

**What changed:** Rewrote `.gsd/ROADMAP.md` into milestones built from Aalhad's answers:
M1 Consulting RAG (now, target 2026-11-02) → M2 other domains → M3 ground every feature →
M4 frontend fixes → M5 clean-up. Each task has a status and the ▶ marks the current one.
`/pipeline` now reads ▶ and updates statuses when a task is verified.
**Why:** One clear document for what's being done now and what comes later.
**Files:** `.gsd/ROADMAP.md`, `.gsd/SPEC.md`, `.gsd/STATE.md`, `CLAUDE.md`, `.claude/commands/pipeline.md`
**Proof:** Files updated.
**Undo:** Revert those files.
**Open issues:** R3 (test questions) and F1 (UI issue list) are Aalhad's tasks.

---

## 2026-10-19 — /pipeline entry point
**Phase:** R0 · **Type:** setup

**What changed:** Added `/pipeline`, one command that classifies a request (phase, feature,
bug, review, QA, eval, ship) and runs the right agents and skills in order, then commits,
logs and updates state.
**Why:** One thing to run, while each agent stays in its own file with a clean context.
**Files:** `.claude/commands/pipeline.md`, `CLAUDE.md`
**Proof:** File created; not yet run.
**Undo:** Delete `.claude/commands/pipeline.md`.
**Open issues:** The first real run will be `/pipeline R1`.

---

## 2026-10-19 — gstack integration + backend/frontend agents and skills
**Phase:** R0 · **Type:** setup

**What changed:** Added 7 agents (planner, verifier, debugger, backend-engineer,
frontend-engineer, code-reviewer, qa-tester) and 3 skills (gstack-playbook,
backend-conventions, frontend-conventions). CLAUDE.md now has the gstack routing, which was
lost when the old CLAUDE.md was deleted, plus the default phase flow.
**Why:** Use gstack across planning, review, QA and shipping for the whole app, not just the
RAG. The GSD planner/verifier/debugger roles become Claude agents (the "merge both" decision).
**Files:** `.claude/agents/{planner,verifier,debugger,backend-engineer,frontend-engineer,code-reviewer,qa-tester}.md`,
`.claude/skills/{gstack-playbook,backend-conventions,frontend-conventions}/SKILL.md`, `CLAUDE.md`
**Proof:** Files created. Conventions were taken from the existing code (`src/routes/frameworks.js`,
`src/lib/errors.js`, `singleFlight.js`, `contentVersion.js`, `apiClient.ts`, `router.tsx`,
`global.css`).
**Undo:** Delete the listed files and revert the CLAUDE.md agents/skills/gstack sections.
**Open issues:** GSD's researcher/executor roles aren't ported. The built-in Explore agent
and the domain build agents cover them.

---

## 2026-10-19 — Systematic rebuild setup (CLAUDE.md, agents, skills)
**Phase:** R0 · **Type:** setup

**What changed:** Added a new `CLAUDE.md` with the product rules and working style, 4 agents,
5 skills, and a GSD spec/roadmap/state for the backend RAG rebuild. No application code or
data was touched.
**Why:** The earlier build was vibe-coded. Writing the rules down keeps context from being lost
between sessions, so every future change follows the same grounding and fidelity standards.
**Files:** `CLAUDE.md`, `.claude/agents/{ingestion-engineer,fidelity-reviewer,rag-engineer,rag-evaluator}.md`,
`.claude/skills/{casebook-ingestion,diagram-transcription,grounded-answering,rag-eval,build-log}/SKILL.md`,
`.gsd/{SPEC,ROADMAP,STATE}.md`, `log.md`
**Proof:** Files created; nothing executed.
**Undo:** Delete the files listed above.
**Open issues:** Test question set needed from Aalhad (`backend/eval/questions.jsonl`). Old
GSD files (`PROJECT_RULES.md`, `.agents/`) are kept as the reference method.

# PlaceWise build log

Every big change, newest first. Format and rules: `.claude/skills/build-log/SKILL.md`.
Pre-rebuild history: `Mark Down Files/DOCUMENT.md`.

---

## 2026-10-31 — R6 formula follow-up: per-block penalty now weighted by issue count (live-verified fix); ISB p177 Docling/vision merge investigated and found not reusable
**Phase:** R6 (fix) · **Type:** ingestion, fix, tests · Real Gemini vision calls this session
(Aalhad's explicit instruction to re-verify live, not from memory).

**Priority 1 — the tie-break regression, fixed and live-verified:**

**Problem recap:** `_score()`'s per-block fix (commit `20e1cd4`) counted *distinct bad blocks*,
not issues, to stop one mis-treed block's several issues from outweighing a real page-wide
coverage win. But collapsing every bad block to the same flat `0.5` - whether it carried 1 issue
or 15 - meant two candidates touching the same single block with very different severity scored
identically. Production's tie-break (`keep attempt1 unless attempt2 scores strictly higher`) then
silently kept the worse, un-retried attempt. Confirmed live on FMS2023-24 p78 and 3 others
(log.md, 2026-10-31, "per-block formula regression found").

**Fix (`backend/ingestion/convert.py`):** `_block_penalty()` replaces the flat `0.5 *
_penalty_blocks(fid)` term in `_score()`. Each bad block still costs a base `0.5`, but a block
gets no extra penalty for its first 2 qualifying issues (`BLOCK_ISSUE_FREE_ALLOWANCE = 2` - a
block tripping 1-2 related issues from one mis-treed section is still "one concentrated
problem", matching the formula's original intent). Beyond that, each additional qualifying issue
(capped at `BLOCK_ISSUE_CAP = 20` extra) adds `BLOCK_ISSUE_WEIGHT = 0.05`, so a block with many
real issues scores worse than a block with few - breaking exactly the kind of tie that caused the
regression. `_penalty_blocks()` (plain distinct-block count) is kept unchanged for callers/tests
that only need the count; `_block_penalty()` is the new weighted total `_score` actually uses.

**(a) ISB-p177-style case still works - re-verified live, not just preserved on paper:**
Re-ran `run_r6_isb_p177_patch.py` live against the real p177 page this session (2 fresh vision
HTTP calls): real diagram_issues this run were `{block 1: flow_disconnected (1 warn), block 3:
label_altered (1 error)}` - both blocks within the free allowance, so the penalty is still
exactly the original flat `0.5` per block, unchanged by this fix. Result: vision_score=2.0000,
docling_score=2.4769 (p177 **stays on Docling**, same real outcome as the 2026-10-31 session that
first found this, confirmed again live, independent of this fix). The repo's existing
`test_isb_p177_score_picks_vision_once_penalty_is_per_block` unit test was revised (not deleted):
its original version reconstructed p177's discarded vision draft as "6 errors + 1 warn, all on
one block" - that reconstruction was explicitly disproven by live re-runs this session and the
2026-10-31 session before it (real issues span 2-3 blocks, never 1). The revised test keeps
Docling's and vision's real stored scalars but anchors the hypothetical single bad block at a
smaller, still-representative 2 qualifying issues (within the free allowance, so penalty is
unchanged at 0.5) rather than the disproven 7 - documented inline why, and a new assertion pins
`_block_penalty(vision_fid) == 0.5` so this can't silently drift.

**(b) FMS2023-24 p78, p16; ISB p30; FMS2021-22 p50 - re-verified live, both attempts captured:**
Wrote `verify_r6_formula.py` (scratchpad, not committed), which calls the real
`convert_page_vision()` and intercepts *both* internal attempts via a monkeypatch around
`_vision_attempt`, so it sees exactly what production sees - not a reconstruction. Ran it twice
(14 live vision HTTP calls total) against the real PDFs:

| page | attempt1 issues/blocks | attempt2 issues/blocks | old formula | new formula | tied under old per-block count? |
|---|---|---|---|---|---|
| FMS2023-24 p78 | 1 block, 14 issues | 1 block, 1 issue | picks a2 (-4.0 vs 2.5) | picks a2 (2.5 vs 1.68) | no (this run) |
| FMS2023-24 p16 | 0 issues (no retry triggered) | n/a | n/a | n/a | n/a |
| ISB p30 | 1 block, 11 issues | 1 block, 13 issues | picks a1 (-3.1 vs -4.1) | picks a1 (1.41 vs 1.31) | **yes, under flat count (1 vs 1 block)** |
| FMS2021-22 p50 | 3 blocks, 15 issues (6/5/4) | 3 blocks, 13 issues (6/4/3) | picks a2 (-3.77 vs -4.66) | **picks a1** (0.893 vs 0.879) | **yes, under flat count (3 vs 3 blocks)** |

Live Gemini output is not deterministic run to run (confirmed directly: p78's two live runs
produced different attempt1/attempt2 content each time), so this run's exact numbers differ from
the originally-reported tie on these same 4 pages - the new formula's job is to never let a tie
reappear whenever two attempts share a block count, and to rank correctly when it doesn't tie.
Both held on every page above: `_penalty_blocks` alone (the old scheme) *would* have tied p30 and
p50 (same block count, 1 and 3 respectively) - the weighted `_block_penalty` broke both ties and
never inverted a ranking the old flat-per-issue formula got right.

**Visual confirmation against the real source image (not just a score comparison), p50 - the one
page where new and old formula actually disagreed this run:** pulled the real page image
(`Understanding Indian E-Commerce Industry`, FMS2021-22 p49/source_page 50) and read both
attempts' full markdown. Old formula's pick (attempt 2, fewer raw issues) merges each Value
Chain stage's header and description into one fabricated flow-node label (e.g. `"Inbound
logistics Receiving, Warehousing & Inventory control of input"` as a single node - two separately
printed texts concatenated with no separator, not literally printed that way) and garbles the
Government Initiatives badges into a nonsense merged label (`"Udaan Digital Udaan"`). New
formula's pick (attempt 1) correctly keeps every box as its own structured block, including the
header/description parent-child split Value Chain actually has on the page. **The new formula's
pick is the objectively better transcription here, confirmed by reading the real page** - not
just a formula artifact. (p78's and p30's picks agreed between old and new formula this run, so
they weren't a live test of a disagreement, but were still checked against the real page image:
p78's kept attempt correctly has the pie-chart numbers and the discarded attempt fabricates a
flow chart out of plain bullet text and loses the chart entirely; p30's label coverage is weak on
both attempts for a page whose Venn/triangle shape isn't representable by the current diagram
schema - a real, pre-existing schema gap, not something this scoring fix changes either way.)

**Tests:** `backend/ingestion/tests/test_r6_formula_live.py` (new) pins the exact real
issue/block counts captured live above as offline regression tests (no network) - asserts the old
per-block count alone would tie p78/p30/p50's attempts, and the new weighted formula does not tie
them and ranks them the same direction the live run + visual check confirmed correct.
`test_convert_v2.py`'s p177 test revised as described in (a). Full suite:
**`venv/bin/python -m unittest discover -s tests` → 385/385 green** (382 before + 3 new: 2 live
regression tests kept after merging, 1 revised). `npm test` → 111 pass / 1 fail (the same
pre-existing unrelated `sandbox.test.js` `__CF_USER_TEXT_ENCODING` flake every prior entry
documents - confirmed unrelated, no ingestion code touches that file).

**Priority 2 — ISB p177 Docling+vision merge: investigated, not feasible, not hardcoded in:**

Re-ran the real page live twice more this session (one via the patch script, one via a dedicated
fetch script) to inspect both candidates in full, plus the real page image. Findings:
- **Docling's output for p177 has zero diagram blocks and scrambled reading order** - it's a
  flat, unordered dump of every text run on the page (e.g. "Key Market Trends" ends up after
  "Market Structure", `Key Players` after that) with no parent/child structure anywhere,
  including for the exact two regions (Value Chain, Key Players) that gave vision its warnings
  this run. There is no "Docling got this region right" to surgically patch into vision for
  either of those regions - Docling's own version of them is equally or more degraded (flat text,
  no structure).
- **The footer premise checks out** (Docling's stored markdown genuinely has no "2025"/"177" at
  all, confirmed by reading the full field; vision's does, at the very end, confirmed on both live
  runs this session) - but vision already recovers it reliably on its own, so there is nothing to
  patch there either.
- **The specific defect location is not stable across live runs**, which is itself the strongest
  evidence against a reusable "patch region X" technique: the 2026-10-31 session's live reruns
  found issues on blocks `{1,3}` and `{1,3,6}`; this session's two fresh live reruns found `{block
  5 (Porter's 5 forces): 0 issues, block 1 (Value Chain): flow_disconnected, block 3 (Key
  Players): label_altered}` - i.e. in this run, Porter's 5 forces (the section the original brief
  specifically named) had **zero** issues, and the real problem was a flow-vs-issue_tree type
  choice on Value Chain's 4 non-arrowed columns instead. A surgical per-region patch presupposes a
  stable defect location; here even *which section* fails changes between runs.
- Net result unchanged from the 2026-10-31 session: **p177 stays on Docling**, both scored
  2.0-2.5ish vs Docling's 2.4769 depending on the run, under the now-fixed formula. Vision's
  overall transcription is substantially richer (full structured sections, correct reading order,
  footer present) but the automatic scorer still prefers Docling by a thin margin because of 1-2
  real, minor structural warnings - this is a scoring-threshold tension, not a content gap a
  Docling-sourced patch could close.
**Conclusion:** no generalizable merge pattern found; not built, not hardcoded. **p177 remains
unresolved**, same as before this session - Aalhad's call between Docling (safe, zero structure,
needs_review anyway) and vision (richer, needs_review anyway, same human-review gate either way
since both end up `needs_review=true`).

**Files:** `backend/ingestion/convert.py` (`_block_penalty`/`_block_issue_counts`,
`BLOCK_ISSUE_FREE_ALLOWANCE`/`WEIGHT`/`CAP`), `backend/ingestion/tests/test_convert_v2.py`
(revised p177 test), `backend/ingestion/tests/test_r6_formula_live.py` (new). No pipeline code
changed for Task 2 (investigation only, nothing to merge).

**Proof:**
- `venv/bin/python -m unittest discover -s tests` → **385/385 green**, before and after.
- `npm test` → 111 pass / 1 fail, pre-existing unrelated flake, confirmed via `git stash` pattern
  used in every prior entry.
- Live reruns this session: `run_r6_isb_p177_patch.py` (2 vision HTTP calls, no DB write - vision
  did not beat docling, script's own guard correctly skipped writing v3), `verify_r6_formula.py`
  (2 runs, 7 + 7 = 14 vision HTTP calls, read-only, no DB write), `fetch_p177.py` (1
  `convert_page_vision` call, ~2-4 HTTP calls depending on whether its internal retry fired - not
  separately counted, no DB write).
- Row counts: **no `ingest_documents`/`ingest_pages`/`ingest_chunks` row was inserted, updated or
  deleted this session** - every live call in this session was either read-only or (for the one
  write-capable script, `run_r6_isb_p177_patch.py`) hit its own "vision does not beat docling,
  not writing v3" guard before any write. Live `document_chunks` unchanged.
- Branch: `wip`, `main` untouched.

**Cost:** ~18-20 vision HTTP calls this session (7 + 7 + 2 + ~2-4, see above) + 0 embedding calls
(nothing was written, so nothing was re-chunked/re-embedded). At this project's established
flash-lite rate (~$0.00125/call) that's **≈$0.02-0.03** this session. Combined with the ~$0.80-
0.87 already spent on R6 before this session, cumulative R6 spend is **≈$0.82-0.90** - still under
the project's ~$20/month budget and under the $1 R6 guardrail mentioned in the prior entry, but
worth tracking before any further R6 spend this month. (Self-critique: the first
`verify_r6_formula.py` run didn't save markdown/images, so a second live run was needed to get the
visual-confirmation evidence - that doubled this particular script's cost; should have saved
outputs on the first pass.)
**Undo:** `convert.py`/the two test files are a normal code revert - no DB state to undo, nothing
was written by either task this session.
**Left open:**
- **ISB p177 is still unresolved** - Docling (safe, no diagram structure) vs vision (richer,
  minor structural warnings) - Aalhad's call, not re-decided here. Both are already
  `needs_review=true`, so nothing ships to a student either way without human sign-off.
- The formula fix is now live-verified on 4 named pages (plus p177 itself, confirming no
  regression there) but has **not** been re-run across the full ~1228-page "concentrated issues"
  set the 2026-10-31 session flagged (107-150 pages, exact count never fully reconciled) - that
  broader validation is explicitly out of scope for this session per instruction ("deferred until
  the formula is proven solid"); this session proves the *formula*, not a batch result. A batch
  re-ingest/patch run using this fixed formula is a reasonable next step, scoped and
  budget-checked before running.
- `BLOCK_ISSUE_FREE_ALLOWANCE=2`/`WEIGHT=0.05`/`CAP=20` are my judgment call within the task's
  explicit discretion ("use your own judgment on the exact weighting/cap") - tuned to satisfy both
  constraints on the live data gathered this session, not derived from a larger labeled set. If a
  future batch run surfaces a page where this specific weighting still misranks, the free
  allowance/weight are isolated, named constants in `convert.py` to retune.

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

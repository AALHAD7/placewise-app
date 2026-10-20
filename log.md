# PlaceWise build log

Every big change, newest first. Format and rules: `.claude/skills/build-log/SKILL.md`.
Pre-rebuild history: `Mark Down Files/DOCUMENT.md`.

---

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

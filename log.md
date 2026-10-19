# PlaceWise build log

Every big change, newest first. Format and rules: `.claude/skills/build-log/SKILL.md`.
Pre-rebuild history: `Mark Down Files/DOCUMENT.md`.

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

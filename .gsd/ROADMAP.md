# PlaceWise Roadmap

The single list of what we're doing now and what comes later. `/pipeline` reads this file
to decide what to work on next.

**How to use it**
- Status: `todo` · `in progress` · `done` · `blocked` · `later`
- One task is **current** at a time (marked ▶). `/pipeline` with no arguments works on it.
- When a task is verified, its status becomes `done (YYYY-MM-DD)`, ▶ moves to the next
  `todo`, and a `log.md` entry is written. Edit statuses only, never delete rows.
- Need a new task? Add a row in the right milestone and mention it in `log.md`.

**Context:** the site is live for Aalhad's batch, and the target is to have trustworthy
Consulting content within 2–4 weeks of 2026-10-19. Every switch-over must be reversible in
one step, because students are using the site.

---

## M0 — Project setup ✅

| ID | Task | Agent | Status |
|---|---|---|---|
| S1 | CLAUDE.md, agents, skills, `/pipeline`, log, roadmap | — | done (2026-10-19) |

---

## M1 — Consulting casebooks, trustworthy (NOW · target 2026-11-02)

Goal: every Consulting answer on the live site is faithful to the casebook page it cites,
diagrams included.

| ID | Task | Agent | Done when | Status |
|---|---|---|---|---|
| R1 | Structured diagram output in the converter (`placewise-diagram` blocks) + diagram validation in fidelity checks; re-pilot on FMS Consulting casebook | ingestion-engineer → fidelity-reviewer | Pilot report: coverage stats, `needs_review` count; `fidelity-reviewer` compares 3 sample diagram pages (an issue tree, a matrix, a chart or flow) against their page images and finds every label, number and branch matching; Aalhad spot-checks the 3 | done (2026-10-20) |
| R2 | Independent fidelity review of the pilot; fix any pipeline patterns it finds | fidelity-reviewer → ingestion-engineer | Sample pass rate ≥ 95%, no `hallucinated` issues | done (2026-10-21) |
| R3 | Test question set for Consulting (20–30 real questions, a few the casebooks don't cover) | **Aalhad** | `backend/eval/questions.jsonl` exists | done (2026-11-01) |
| R4 | Eval runner + baseline score on the current live chunks | rag-evaluator | Baseline results file saved | done (2026-11-02) |
| R5 | Admin review queue: list flagged pages, approve/fix (backend endpoint + simple Admin page section) | backend-engineer, frontend-engineer | Aalhad can approve a flagged page from `/admin` | todo |
| R6 | Re-ingest Consulting club casebooks | ingestion-engineer | All Consulting PDFs `done`; flagged pages queued; cost logged | done (2026-11-02) — stopped at 7/9 by Aalhad's call ("we have enough data"); FMS Consulting Club 2025-26 and FMS 2024-25 deliberately not ingested, not a gap |
| R7 | Grounded retrieval on new chunks behind a switch: Frameworks, Guesstimates, Q&A (Consulting) with citations + labelled AI fallback | rag-engineer | `npm test` green; switch off = old behaviour | done (2026-11-02) |
| R7b | Paraphrase layer: Gemini re-presents retrieved chunk(s) in plain language (idea/logic/numbers unchanged) + faithfulness judge gate, fail-closed to verbatim excerpt; reversible flag | rag-engineer | Faithfulness judge passes on eval set; manual check: same facts, different wording, no verbatim casebook sentences shown by default; flag off = today's verbatim behaviour | done (2026-11-03) — code + tests + eval all pass bar; `ENABLE_ANSWER_PARAPHRASE` still off everywhere, Aalhad to flip when ready |
| R8 | Frontend for RAG only: render new diagram types, citations, "AI-generated — not from the casebooks" label | frontend-engineer | Build passes; QA screenshots desktop + phone | done (2026-11-06) |
| R9 | Eval new vs baseline; switch Consulting live; QA on live site | rag-evaluator → qa-tester | No regressions; switch flipped; rollback tested | done (2026-11-11) |

---

## M2 — Remaining domains (NEXT)

Same loop for each domain: re-ingest → fidelity review → add test questions → eval →
switch live.

**Done when (every domain D1–D5):**
1. Every club casebook PDF in that domain's `Data/<Domain> Files/PDF Files/` is `done` in
   `ingest_documents`; flagged pages are in the review queue; Gemini calls and cost are logged.
2. `fidelity-reviewer` sample: ≥ 95% pass, zero `hallucinated` issues.
3. Aalhad has added ≥ 15 test questions for the domain (≥ 3 the casebooks don't cover).
4. `rag-evaluator`: no regressions against that domain's baseline, and every not-covered
   question shows the AI label.
5. Domain switched live; switching back tested; `qa-tester` screenshots from the live site.

| ID | Task | Agent | Extra done-when | Status |
|---|---|---|---|---|
| ▶ D1 | Product management — Aalhad's call 2026-11-11: use ONLY `Data/Prodman Files/PM_Compendium.md` (already consolidates all the PM club casebooks); do not re-ingest the original PM casebook PDFs. Same shape as FIN1: `source_class = placewise_reference`, chunked on its own `<!--chunk-->` markers (no Docling/vision conversion needed, it's already clean text), ingested into `ingest_documents`/`ingest_chunks`, `is_active=false` until switch-over | ingestion-engineer → backend-engineer → rag-engineer → rag-evaluator | All ~20 Parts chunked and embedded (chunk count = number of `<!--chunk-->` markers in the file); `match_ingest_chunks`/Q&A can retrieve PM content via `placewise_reference`; ≥15 PM eval questions added and scored (a few the compendium doesn't cover, per M2's shared done-when); Frameworks/Q&A show PM content with citations; cost logged | todo |
| FIN1 | Finance reference compendium (`finance_compendium.md`, 208 topics) — curated reference material, not a club casebook; new `source_class = placewise_reference`, ingested into `ingest_documents`/`ingest_chunks` and wired to Q&A, `is_active=false` until Aalhad switches it on | ingestion-engineer → backend-engineer → rag-engineer → rag-evaluator | 208 topic chunks ingested and embedded; `match_ingest_chunks` accepts `placewise_reference` alongside `club_casebook`; Q&A can retrieve Finance content; ≥10 Finance eval questions added and scored; CLAUDE.md's grounding policy documents the new source class; cost logged | todo |
| D2 | Finance (club casebooks) | ingestion-engineer | Charts and tables: all numbers match the source (number coverage = 100%); Frameworks-page taxonomy expansion for the FIN1 compendium's 26 modules is follow-up work here, not in FIN1 | todo |
| D3 | Marketing / Sales | ingestion-engineer | — | todo |
| D4 | HR | ingestion-engineer | — | todo |
| D5 | General Management | ingestion-engineer | — | todo |

---

## M3 — Ground every feature

Casebook content wherever it exists. Anything the casebooks can't answer is AI-generated with
a visible label.

**Done when (every G task):** grounded parts show citations; AI parts show the label; the
feature's caching still returns the same content for the same selection (`singleFlight`);
`CONTENT_VERSION` bumped if prompts changed; `npm test` green; `code-reviewer` verdict
"ship"; `qa-tester` screenshots; switch off = old behaviour.

| ID | Task | Agent | Extra done-when | Status |
|---|---|---|---|---|
| G1 | Mock Interview: real casebook cases; feedback compared with casebook solutions | rag-engineer | ≥ 10 test questions/cases added; in a run of 10 mock sessions, every case is traceable to a casebook page and feedback cites the solution page | todo |
| G2 | Role + Skill pages | rag-engineer | For 5 sampled roles, every grounded claim traces to a cited chunk (`rag-evaluator` faithfulness check) | todo |
| G3 | Company pages: casebook mentions first, AI for the rest | rag-engineer | Companies with casebook mentions show them with citations; companies without show only labelled AI content | todo |
| G4 | Resume, Tone Shifter, Community: decide what can be grounded, label the rest | planner → rag-engineer | Decision written in `.gsd/SPEC.md`; the chosen changes meet the common done-when | todo |

---

## M4 — Frontend fixes (LATER)

| ID | Task | Agent | Done when | Status |
|---|---|---|---|---|
| F1 | Aalhad lists the current UI issues | **Aalhad** | Issue list in `.gsd/phases/F/ISSUES.md`, each with page and what's wrong | later |
| F2 | Fix them; `/design-review` pass across all pages | frontend-engineer | Every F1 issue closed with a before/after screenshot; `npm run build` + `lint` pass; `qa-tester` finds no high-severity bugs at desktop or ~375px; both themes checked | later |
| F3 | Remove references to the retired `frontend/` folder | frontend-engineer | `grep` for `frontend/` (excluding `frontend-react`) finds no live references; build passes | later |

---

## M5 — Clean-up and future ideas (LATER)

| ID | Task | Done when | Status |
|---|---|---|---|
| L1 | Retire old `document_chunks` once every domain is switched (archive, don't delete) | All D tasks done; no code path reads `document_chunks` (`grep`); table renamed or archived, not dropped; restore steps written in `log.md` | later |
| L2 | Monthly Gemini cost check against the ~$20 budget | A monthly `log.md` entry with calls and cost per feature (from `llmCallLog`); if over budget, the cheapest fix is identified | later |
| L3 | Open to students at other colleges | `/cso` with no high-severity findings; rate limits checked under load (`/benchmark`); `/canary` monitoring set up; Aalhad confirms casebook usage rights for a wider audience | later |

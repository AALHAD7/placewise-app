# PlaceWise — Claude Code guide

PlaceWise is a one-stop placement-prep site for MBA students. Instead of reading a
350-page casebook to learn one framework, a student asks for exactly what they need and
gets it — grounded in real college casebooks, with the diagram, the explanation, and the
page it came from.

Owner: Aalhad (MBA student, building this solo). Previous versions were vibe-coded; the
rebuild is systematic. Enhance what exists — never wipe it.

---

## Current focus

**`.gsd/ROADMAP.md` is the source of truth** for what's being done now (the ▶ task) and
what comes later. Milestones: M1 Consulting RAG (now) → M2 other domains → M3 ground every
feature → M4 frontend fixes → M5 clean-up. When a task is verified, mark it done there,
move ▶ to the next task, and log it.

Spec: `.gsd/SPEC.md`. Session position: `.gsd/STATE.md`.

---

## Product rules (non-negotiable)

**Grounding policy**
- If the casebooks cover a question, the answer uses **casebook content only**. The site
  states globally that answers are grounded in the casebooks, so individual answers do
  **not** repeat a per-answer source line ("This is from the IIMK casebook") — that was
  removed 2026-11-02 as redundant (Aalhad's call). School/casebook/page is still computed
  and returned by the API for debugging/admin use; it's just not rendered to students.
- If they don't, say so plainly, then give a general answer **clearly labelled** as not from
  the casebooks. Never blend the two silently. This disclosure stays per-answer — it's the
  one thing that must never be silently omitted, since hiding it would let general AI
  guidance pass as casebook content.
- Below the similarity threshold, show nothing rather than a loosely related excerpt.

**What is grounded in the casebooks**
- Frameworks page (by domain/subdomain): explanation + rebuilt diagram from casebooks.
- Guesstimates.
- Product management content.
- Free-form Q&A whenever the casebooks cover the topic.
- Eventually every feature (Mock Interview, Role, Skill, Company, …) uses casebook content
  wherever it exists, with labelled AI generation for the rest. Order: `.gsd/ROADMAP.md`.
- The site is live for Aalhad's batch: every switch-over must be reversible in one step.

**Sources** — only `source_class = club_casebook` feeds the RAG. PrepInsta, commercial,
certification, external_academic and unattributed files are excluded.

**Diagrams** — students see a **rebuilt** diagram (structured data the frontend draws) plus
the explanation. Original PDFs and page images stay admin-only; never expose them or their
storage URLs to non-admin users. See the `diagram-transcription` skill.

**Data safety** — never delete or overwrite existing chunks or tables. New data is written
alongside (`ingest_*` tables, `is_active = false`) until switch-over.

---

## How to work with Aalhad

- **No approval needed** for any step, including paid API calls, migrations and commits.
- **Every big change gets a `log.md` entry** (repo root) — see the `build-log` skill. Big =
  new/changed migration, ingestion run, retrieval or prompt change, switch-over, new
  agent/skill, anything that changes what students see, or any batch of paid calls.
- **Explain in plain language** after each step: what changed, why, how to check it works.
  Go deeper only when asked.
- **Budget: ~$20/month** on Gemini. Prefer the free tier and flash-lite models; batch heavy
  work; report call counts and rough cost in the log.
- Report results honestly. If an eval fails or a step was skipped, say so with the output.

---

## Workflow (GSD, merged)

Canonical method: `PROJECT_RULES.md` — **SPEC → PLAN → EXECUTE → VERIFY → COMMIT**, with
proof for every change (command output, curl response, test output, eval score). Where this
file is more specific, this file wins:

- This machine is macOS/zsh, so `&&` chaining is fine.
- Instead of `invoke_subagent`, use the Claude agents in `.claude/agents/`.
- The GSD planner/executor/verifier definitions in `.agents/` remain the reference method.
- Commit format: `type(scope): description`, scope = phase (e.g. `feat(R1): ...`).

---

## Agents (`.claude/agents/`)

| Agent | Use for |
|---|---|
| `planner` | Turn a roadmap phase into small plan files (GSD + gstack plan reviews) |
| `ingestion-engineer` | Changing or running the PDF → chunk pipeline |
| `fidelity-reviewer` | Checking converted pages against the source PDF; flagging for review |
| `rag-engineer` | Retrieval, `match_*` RPCs, grounded prompts, wiring features to chunks |
| `backend-engineer` | Other API work: routes, admin endpoints, caching, migrations, tests |
| `frontend-engineer` | React pages, components, styles, diagrams and citations on screen |
| `debugger` | Root-causing one hard bug (gstack `/investigate`) |
| `code-reviewer` | Reviewing a diff before commit or ship (gstack `/review`, `/cso`) |
| `qa-tester` | Testing the running site like a student (gstack `/qa-only` / `/qa`, `/browse`) |
| `rag-evaluator` | Running the test question set and scoring answers against source pages |
| `verifier` | Independently proving a phase is done before it's marked complete |

**Entry point:** `/pipeline` (`.claude/commands/pipeline.md`) routes any request (a phase,
feature, bug, review, QA, eval or ship) through the right agents and skills.

**Default flow for a phase:** `planner` → build agent(s) → `code-reviewer` → `qa-tester` /
`rag-evaluator` → `verifier` → commit + `log.md`.

## Skills (`.claude/skills/`)

| Skill | What it encodes |
|---|---|
| `gstack-playbook` | Which gstack skill to use at each stage, for RAG, backend and frontend |
| `casebook-ingestion` | The ingestion pipeline: classify → convert → verify → chunk → embed → store |
| `diagram-transcription` | The structured diagram format (issue tree, matrix, funnel, flow, chart, table) |
| `grounded-answering` | Grounding policy, citations, thresholds, the "not in casebooks" label |
| `rag-eval` | Test-set format, how to run evals, scoring, regressions |
| `backend-conventions` | Express route shape, errors, middleware, caching, migrations, tests |
| `frontend-conventions` | React structure, API client, types, CSS tokens, verifying UI changes |
| `build-log` | How and when to write `log.md` entries |
| `model-routing` | Which model/effort to use when delegating, so trivial lookups don't cost the same as correctness-critical work |

## gstack (global install, required)

`.claude/hooks/check-gstack.sh` blocks skills if gstack is missing. Full map:
`gstack-playbook` skill. Quick routing:

- Ideas / scope → `/office-hours`, `/plan-ceo-review` · Spec → `/spec`
- Plan review → `/autoplan`, or `/plan-eng-review` (backend/RAG) and `/plan-design-review` (UI)
- UI design → `/design-consultation`, `/design-shotgun`, `/design-html` · polish → `/design-review`
- Bugs → `/investigate` · Diff review → `/review` (+ `/cso` for auth/admin/RLS/uploads)
- Test the site → `/qa-only` (report) or `/qa` (fix) · Performance → `/benchmark`
- Ship → `/ship`, `/land-and-deploy` · after deploy → `/canary`
- Session → `/context-save`, `/context-restore` · Safety → `/careful`, `/freeze`, `/guard`
- Weekly → `/retro` · Docs → `/document-release`

Use `/browse` for all web browsing. Don't use `mcp__claude-in-chrome__*` tools.

---

## Stack and layout

- **Backend** `backend/` — Node 22, Express, ES modules. `npm run dev`, `npm test`
  (node:test). Routes in `src/routes/`, logic in `src/lib/`. Gemini wrapper with model
  cascade: `src/lib/gemini.js`.
- **Database** — Supabase Postgres + pgvector. Migrations in `backend/db/migration_NNN_*.sql`
  (latest: 039). Live chunks: `document_chunks`, queried via the `match_document_chunks` RPC.
  New pipeline: `ingest_documents`, `ingest_pages`, `ingest_chunks` (RLS, service-role only).
- **Embeddings** — `gemini-embedding-001`, **768 dims**. New chunks must match exactly.
- **Ingestion** `backend/ingestion/` — offline Python: `pipeline.py` (orchestrator),
  `page_classify.py`, `convert.py` (Docling + Gemini vision), `fidelity.py`, `chunk.py`,
  `gemini_client.py`, `config.py`. PyMuPDF is AGPL — keep it out of the deployed backend.
- **Source data** `Data/<Domain> Files/PDF Files/` (domains: Consulting, Finance, Prodman,
  HR, Marketing:Sales, General Management).
- **Frontend** `frontend-react/` — Vite + React + TS. Framework diagrams are typed in
  `src/types/api.ts` (`diagram_type`, `diagram_data`). The old `frontend/` is retired.
- **History** — `Mark Down Files/DOCUMENT.md` is the pre-rebuild build log (read-only
  history). New entries go in `log.md`.
- Secrets live in `backend/.env` — never print or commit them.

---
name: gstack-playbook
description: Which gstack skill to use at each stage of PlaceWise work — planning, building, reviewing, testing, shipping and monitoring — for the RAG pipeline, the Express backend and the React frontend. Use when starting any non-trivial task, before committing, before deploying, or when unsure which gstack skill fits.
---

# gstack playbook for PlaceWise

gstack is installed globally (`~/.claude/skills/gstack`), and `.claude/hooks/check-gstack.sh`
blocks skill use if it's missing. Invoke gstack skills with the Skill tool (`/name`). An agent
without the Skill tool reads `~/.claude/skills/<name>/SKILL.md` and follows it.

Use `/browse` for all web browsing and site checks. Don't use `mcp__claude-in-chrome__*` tools.

## The lifecycle

```
idea ─► plan ─► build ─► review ─► test ─► ship ─► watch ─► retro
```

| Stage | All work | RAG pipeline | Backend (Express/Supabase) | Frontend (React) |
|---|---|---|---|---|
| **Idea / scope** | `/office-hours`, `/plan-ceo-review` | — | — | — |
| **Spec** | `/spec` → feeds `.gsd/SPEC.md` | `/eval-plan` before paid eval or ingestion batches | — | — |
| **Plan review** | `/autoplan` (runs all reviews) | `/plan-eng-review` | `/plan-eng-review`, `/plan-devex-review` for API shape | `/plan-design-review` |
| **Design** | — | — | — | `/design-consultation`, `/design-shotgun`, `/design-html`, `design-taste-frontend` |
| **Build** | project agents (see CLAUDE.md) | `ingestion-engineer`, `rag-engineer` | `backend-engineer` | `frontend-engineer` |
| **Debug** | `/investigate` (via `debugger` agent) | same, plus `fidelity-reviewer` for conversion losses | same | same + `/browse` console |
| **Review diff** | `/review` (via `code-reviewer` agent) | + `rag-evaluator` run | + `/cso` when auth, admin, RLS, uploads or keys change | + `/design-review` for visual changes |
| **Test** | `/qa-only` (report) or `/qa` (fix) via `qa-tester` | `rag-eval` skill | `npm test` + `/qa` on API flows | `/qa`, `/benchmark` for performance |
| **Ship** | `/ship` (PR), `/land-and-deploy` | switch-over logged in `log.md` | `/setup-deploy` once, then `/land-and-deploy` | Vercel via `/land-and-deploy` |
| **Watch** | `/canary` after deploy | — | — | `/benchmark` regressions |
| **Docs** | `/document-release`, `/document-generate` | — | — | — |
| **Reflect** | `/retro` weekly, `/learn` for lessons | — | — | — |

## Safety and context
- `/careful` before risky shell or DB work. `/freeze <dir>` restricts edits to one area (e.g.
  `backend/ingestion` during a pipeline change). `/guard` does both. `/unfreeze` clears it.
- `/context-save` at the end of a session and `/context-restore` at the start. These
  complement `.gsd/STATE.md`.
- `/health` gives a code-quality dashboard. `/test-audit` finds low-value tests.
  `/deslop-shared-libs` finds duplicated code worth extracting (useful in `backend/src/lib`).

## Rules
- gstack skills don't override `CLAUDE.md` product rules (grounding policy, data safety,
  privacy).
- When a gstack skill wants to commit, push or deploy, follow `CLAUDE.md`: no approval needed,
  but a `log.md` entry is required for big changes.
- Record which gstack skill produced a review or QA result in the log's **Proof** line.

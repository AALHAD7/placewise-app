---
description: Run PlaceWise work end to end — picks the right agents and skills for the job, runs them in order, verifies, commits and logs. Usage — /pipeline (continue roadmap), /pipeline R1 (a phase), or /pipeline <task in plain words>.
argument-hint: "[phase id | task description]"
---

# PlaceWise pipeline

Request: **$ARGUMENTS**

You are the orchestrator. You don't do the heavy work yourself. You route it to the agents
in `.claude/agents/` (Agent tool, `subagent_type` = agent name) and the skills in
`.claude/skills/` or gstack (Skill tool). Agent definitions live in their own files. Never
copy them here or into prompts.

## 0. Load context (always)
Read `CLAUDE.md`, `.gsd/STATE.md` and `.gsd/ROADMAP.md`. Nothing else yet.

## 1. Classify the request
| If the request is… | Route |
|---|---|
| empty | the ROADMAP task marked ▶ → **Phase** (if it's an **Aalhad** task, tell the user what's needed from them and stop) |
| a task id (`R1`, `D2`, `G1`, …) | that task → **Phase** |
| a new feature or change | **Feature** |
| a bug, error, or "X is wrong" | **Bug** |
| "review", "check my changes" | **Review** |
| "test", "QA", "does the site work" | **QA** |
| "eval", "how accurate is it" | **Eval** |
| "ship", "deploy", "push" | **Ship** |

Tell the user in one line which route you picked and why. Then continue without waiting.

## 2. Routes

Pick the build agent from the area: `backend/ingestion/` → `ingestion-engineer`; retrieval
or answers → `rag-engineer`; other `backend/` → `backend-engineer`; `frontend-react/` →
`frontend-engineer`.

**Phase**
1. `planner` → plans in `.gsd/phases/<phase>/`. On `needs_input`, ask the user once, then rerun.
2. For each wave in order, run that wave's plans with the agent named in each plan's
   frontmatter. Plans in the same wave run in parallel.
3. Pipeline conversion steps: after `ingestion-engineer`, run `fidelity-reviewer` on its output.
4. `code-reviewer` on the phase diff. If the verdict is "fix first", send the findings back to
   the same build agent, then review again (max 2 rounds).
5. Test: touched retrieval/ingestion → `rag-evaluator`; touched the UI or API flows → `qa-tester`.
6. `verifier`. On `gaps_found`, rerun `planner` in gaps mode for just those gaps, then repeat
   steps 2–6 once. Still failing → stop and report.

**Feature** — the same as Phase, but first run `/spec` to turn the request into a short spec
appended to `.gsd/SPEC.md`, and plan it as an ad-hoc phase `F-<short-name>`. A small change
(one or two files) skips planner: build agent → `code-reviewer` → test.

**Bug** — `debugger` → `code-reviewer` → test as in Phase step 5. If the debugger hits its
3-strike stop, report what it learned and stop.

**Review** — `code-reviewer` on `git diff` (uncommitted) or the given range. Report only.

**QA** — `qa-tester` in report mode (`/qa-only`). Offer fix mode in one line at the end.

**Eval** — `rag-evaluator`. If `backend/eval/questions.jsonl` is missing, say so and stop.

**Ship** — `code-reviewer`, then `qa-tester`, then gstack `/ship` (PR) and `/land-and-deploy`,
then `/canary`. Any high-severity finding stops the ship.

## 3. Close out (every route that changed files)
1. **Commit** only the files this run touched (`git add <paths>`, never `git add -A`). Keep
   pre-existing uncommitted changes out. Format: `type(scope): description`. One commit per
   plan task where plans exist.
2. **Log**: add a `log.md` entry per the `build-log` skill.
3. **Roadmap + state**: when the verifier passes, mark the task `done (YYYY-MM-DD)` in
   `.gsd/ROADMAP.md` and move ▶ to the next `todo`. Never delete rows. Update `.gsd/STATE.md`.
4. **Report** to the user in plain language: what was done, the proof (test/eval/QA numbers),
   what failed or was skipped, and the suggested next `/pipeline` command.

## Rules
- Give each agent the paths it needs and the goal, never file contents. Agents start with no
  memory of this conversation.
- Read agents' compact results. Don't re-read files an agent already summarised.
- Grounding policy, data safety and privacy from `CLAUDE.md` override any agent or skill.
- No user approval is needed for any step (CLAUDE.md), but every big change gets logged.
- An agent that returns `blocked` stops the route. Report which capability was missing.
- Don't run paid batches (full re-ingestion, evals) more than once per run without a
  reason in the log.

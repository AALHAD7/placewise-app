---
name: model-routing
description: Which model/effort to use when delegating a task on PlaceWise, so trivial lookups don't run on the same model as correctness-critical work. Use before every Agent tool call that isn't one of this project's named agents, and when deciding whether a named agent needs its model overridden for one specific call.
---

# Model routing for PlaceWise

## The constraint that shapes everything else

None of this project's 11 named agents (`.claude/agents/*.md`) set a `model` in their
frontmatter — each one runs on the parent session's model unless overridden at call time.
`subagent_type: "fork"` **cannot** be downgraded at all; the tool ignores a `model` override
on a fork. So the only real lever is: pass `model`/`effort` explicitly on the Agent call
itself, for work that isn't a fork.

## Why the 11 named agents are NOT blanket-downgraded

This project's whole design is accuracy over speed (grounding policy, fidelity-review loop,
data-safety rules). A cheaper model is the kind of thing that skips the "wait, is this claim
actually measured or just assumed" step — which is exactly the failure mode that produced a
real regression earlier in this project's history (a scoring-formula fix "proven" from
reconstructed numbers instead of a live re-check). Don't downgrade `debugger`,
`fidelity-reviewer`, `rag-engineer`, `rag-evaluator`, `verifier`, `code-reviewer`,
`ingestion-engineer`, `backend-engineer`, `frontend-engineer`, `planner`, or `qa-tester` to
save cost. If one of these feels slow/expensive, that's the cost of the correctness bar this
project set for itself, not a routing problem.

## What to actually route cheaper

Use this for **ad-hoc delegation you do yourself** — a one-off `Explore` call, a
general-purpose research fork-alternative, anything that isn't invoking one of the 11 named
agents above:

| Task shape | Model/effort |
|---|---|
| "Where is X defined", "which file calls Y", a single grep-shaped lookup | `Explore`, `model: "haiku"` |
| Multi-file but mechanical (find-and-report, a pattern you already specified exactly) | `effort: "lower"` on whatever agent fits |
| Research that needs synthesis/judgment to be useful (e.g. "trace how this feature actually works and tell me what's grounded vs not") | Default model, no override — downgrading loses the judgment that makes the report worth reading |
| Anything feeding a decision Aalhad will act on directly (a go/no-go, a security-relevant finding, a "is this safe to ship") | Never downgrade |

## Using it

When about to call the Agent tool for a task that isn't one of the 11 named agents, check
which row above it matches before deciding whether to pass `model` or `effort`. When in
doubt, don't downgrade — a wrong cheap answer costs more (in tokens and trust) than a correct
one did.

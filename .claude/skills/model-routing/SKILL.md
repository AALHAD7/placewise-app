---
name: model-routing
description: Which model/effort to use when delegating a task on PlaceWise, so trivial lookups don't run on the same model as correctness-critical work — and how to keep raw tool output out of the main context so sessions don't bloat. Use before every Agent tool call that isn't one of this project's named agents, when deciding whether a named agent needs its model overridden for one specific call, and whenever a task would pull a lot of raw file/search output into the conversation.
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

For anything in the "mechanical but multi-file" or routable rows above, don't just fire the
cheap call and hand its output straight to Aalhad — use the `delegate-review-loop` skill to
review the result yourself and send it back for fixes before it's reported as done.

## Token economy, not just dollar economy

Routing to a cheaper model saves cost, not context size — the same volume of tokens still
gets generated and reviewed. If the actual goal is keeping a session's total context small,
these matter more than model choice:

- **Keep raw output out of the main thread.** A `Read` of a whole file, a wide `grep`, or an
  agent's full tool transcript all sit in context for the rest of the session. Push that into
  a `fork` (for exploratory/throwaway research whose output isn't needed again) or a fresh
  agent (for a self-contained lookup) so only the summary comes back.
- **Read narrow, not wide.** `Grep`/`Glob` to find the right lines before `Read`-ing; use
  `offset`/`limit` instead of pulling a whole large file; use `Explore` for "where is X
  defined" instead of reading candidate files one by one.
- **Don't re-read what you just wrote.** `Edit`/`Write` already error on failure — there's no
  need to `Read` a file back afterward to confirm it worked.
- **Cap what you ask subagents to return.** When delegating (including through
  `delegate-review-loop`), ask for a bounded report ("under 200 words", "list only") instead
  of a full narrative — that report is what lands in your context, not the subagent's.
- **Batch independent tool calls** in one turn instead of serial round-trips; each separate
  turn re-sends the accumulated context so far.

These are habits, not a separate workflow — apply them whenever a task would otherwise pull a
lot of raw output into the conversation, regardless of which model is doing the work.

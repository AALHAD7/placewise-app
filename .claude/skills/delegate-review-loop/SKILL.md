---
name: delegate-review-loop
description: Delegate a task to a cheaper model, review its work yourself, and send it back with specific fixes until it's actually right — only then report the result. Use for any ad-hoc task that model-routing says is safe to route cheap (not one of PlaceWise's 11 named agents, not correctness-critical). Load model-routing first to pick the model; this skill is the loop around that choice.
---

# Delegate → review → fix loop

The point: don't run every task on the top-tier model just because that's what's answering
right now. For work a cheaper model can actually do, delegate the doing, keep the reviewing
on the strong model, and loop until the review passes — so Aalhad only ever sees finished
work, never a half-right first draft.

## When this applies

Check `model-routing` first. This loop is for the same territory that skill says is safe to
route cheap: ad-hoc delegation that isn't one of the 11 named agents
(`backend-engineer`, `rag-engineer`, `code-reviewer`, `debugger`, `fidelity-reviewer`,
`frontend-engineer`, `ingestion-engineer`, `planner`, `qa-tester`, `rag-evaluator`,
`verifier`) and isn't feeding a decision Aalhad acts on directly without a check.

Do **not** use this loop to downgrade those 11 agents, and don't use it for anything
security-, grounding-, or data-safety-sensitive (see CLAUDE.md product rules) — those get
the full model with no intermediate cheap draft, full stop.

Good fits: "summarize these 40 files", "find every place X is used and list it", "draft the
copy for this page", "convert this CSV into that JSON shape", "write a batch of test
questions", "extract the diagram structure from this page description" — bounded,
checkable-by-inspection tasks.

## The loop

1. **Scope the task and the bar.** Before delegating, decide in one or two sentences what
   "done right" looks like for this specific task — the thing you'll actually check against
   in step 3. If you can't state that bar, the task is probably too open-ended for this loop
   (do it yourself, or use `planner`/a named agent instead).

2. **Delegate to the cheap model.** Call the `Agent` tool (not `subagent_type: "fork"` — a
   fork always inherits your model and ignores overrides) with an explicit downgrade:
   - `model: "haiku"` for mechanical/lookup-shaped work, or
   - default model with `effort: "lower"` when it needs a bit more reasoning than a bare
     lookup but is still bounded and checkable.
   Write the prompt as a self-contained brief — the subagent has no context from this
   conversation. State the task, the inputs, the expected output shape, and the bar from
   step 1.

3. **Review the result yourself, at full strength.** Don't delegate the review — that
   defeats the point. Check the subagent's output against the bar from step 1: is it
   correct, complete, in the right shape, free of invented facts? For code or data, verify
   concretely (run it, grep for the claim, diff against the source) rather than taking the
   subagent's summary at face value — the same "trust but verify" rule that applies to any
   subagent report applies doubly to a cheaper one.

4. **If it's wrong or incomplete, send it back — don't redo it yourself and don't
   re-spawn fresh.** Use `SendMessage` to the same agent (by the name/id the `Agent` call
   returned), listing exactly what's wrong and what to fix. This keeps the cheap model's
   existing context instead of paying to rebuild it, and keeps the fix instructions specific
   rather than "try again."

5. **Repeat step 3–4 until the review passes, with a cap.** Three rounds is a good default
   cap. If it still isn't right after three rounds, that's a signal the task was harder than
   it looked — stop delegating and either do it yourself on the full model or re-scope the
   task, rather than burning a fourth round on the same cheap model.

6. **Report the finished result to Aalhad, not the intermediate drafts.** One line noting it
   was delegated and reviewed (and, if it took more than one round, that a fix pass was
   needed) is enough — he doesn't need the back-and-forth transcript, just the result and
   enough confidence that it's correct.

## Why review stays on the strong model, not the loop itself

The failure mode this guards against isn't "the cheap model is slow" — it's "the cheap model
quietly produces something plausible-looking but wrong, and nobody catches it before it
reaches Aalhad." Keeping step 3 on the full model is the whole mechanism; delegating the
review too would just move the risk one level down instead of removing it.

---
name: build-log
description: How and when to write entries in PlaceWise's log.md — the running record of every big change. Use after any migration, ingestion run, retrieval/prompt change, eval run, switch-over, new agent or skill, paid API batch, or anything that changes what students see.
---

# Build log (`log.md`)

Aalhad doesn't approve steps one by one. The log is how they keep track, so it must be
complete and readable without opening any code.

## When
Write an entry for every **big change**:
- a migration created or applied
- an ingestion run (pilot or batch)
- a retrieval, threshold or prompt change
- an eval run
- a switch-over (`is_active` flips)
- a new or changed agent/skill/CLAUDE.md
- any batch of paid API calls
- anything that changes what students see
- anything deleted, moved or deprecated

Small refactors and typo fixes don't need an entry.

## Format
Newest entry at the **top**, under the `---` divider after the header.

```markdown
## 2026-10-19 — <short title>
**Phase:** R1 · **Type:** ingestion | migration | retrieval | eval | setup | fix

**What changed:** plain language, 1–3 sentences.
**Why:** the problem it solves.
**Files:** `path/one`, `path/two`
**Proof:** command/test/eval output, or numbers (coverage, pass rate, call count).
**Cost:** Gemini calls ≈ N, ≈ $X (omit if none).
**Undo:** how to roll back (e.g. "set is_active=false", "revert commit abc123").
**Open issues:** anything left unresolved.
```

## Rules
- Use real dates (YYYY-MM-DD), never "today".
- Proof is captured output, not "should work".
- Report failures as plainly as successes.
- Keep each entry short. Long detail goes in the commit or `.gsd/` phase files, linked from the entry.

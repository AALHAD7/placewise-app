---
name: rag-eval
description: How PlaceWise proves its RAG is accurate — the test question set Aalhad writes, how to run it, how to score answers against source pages, and how to catch regressions. Use after any change to ingestion, chunking, embeddings, retrieval thresholds or answer prompts, and before switching new chunks live.
---

# RAG evaluation

## Test set
File: `backend/eval/questions.jsonl`, one question per line. **Aalhad writes these** —
real questions from placement prep. Don't generate questions to fill the set. Help with
formatting only.

```json
{"id":"q001","domain":"Consulting","feature":"qa","question":"How do I structure a profitability case?","expected_source":"FMS Consulting CaseBook 2023-24","expected_pages":[12,13],"must_include":["revenue","cost"],"covered":true}
```

- `covered: false` marks questions the casebooks should *not* answer. They test the
  "not in casebooks" label.
- `expected_source`, `expected_pages` and `must_include` are optional. When they're
  missing, the evaluator checks against the retrieved pages.

## What to score (per question)
| Check | Pass when |
|---|---|
| Retrieval hit | An expected page (if given) is in the top-k retrieved chunks |
| Faithfulness | Every claim in the answer is supported by a cited chunk |
| Citations | Citations exist and point to the chunks actually used |
| Coverage label | `covered:true` → grounded answer, `covered:false` → "not covered" + labelled general answer |
| Diagram intact | When the source page has a diagram, the answer/chunk carries a valid diagram block |
| Must-include | All `must_include` terms present |

Use a cheap Gemini model as judge for faithfulness, and show its reasoning in the report.
Check retrieval, citations, labels and diagrams with code, not an LLM.

## Running
- Runner: `backend/eval/run_eval.js`. It calls the same functions the routes use, not a copy.
- Output: `backend/eval/results/<YYYY-MM-DD>-<label>.json` plus a short Markdown summary.
- Compare against the previous run. Any question that went pass → fail is a **regression**
  and must be listed.

## Gates
- Before switch-over: no regressions, and every `covered:false` question is labelled correctly.
- Record each run in `log.md` (score, regressions, what changed).
- Until the test set exists, say so. Don't claim the RAG is "accurate".

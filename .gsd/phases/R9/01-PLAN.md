---
phase: R9
plan: 1
wave: 1
gap_closure: false
depends_on: []
agent: rag-evaluator
files_modified:
  - backend/eval/run_eval_r9.js
  - backend/eval/results/2026-11-06-r9-full.json
  - backend/eval/results/2026-11-06-r9-full.md
  - log.md
paid_calls: ~310 Gemini calls (embedding + flash-lite judge tiers only, no escalation) — see Task 2
---

# Plan R9.1: Full-scale eval of the new (v2 + paraphrase) pipeline, with an explicit pass bar

## Objective
R9 is "eval new vs baseline; switch Consulting live; QA on live site." This plan is the
**gate**: it decides whether switch-over (plans 2–4) happens at all. It does NOT touch
`is_active` or any environment flag anywhere — it is read-only against the shared Supabase
database, exactly like the existing `run_eval_v2_preview.js` / `run_eval_paraphrase_preview.js`
probes. Nothing a student can see changes as a result of this plan.

Why a new script instead of reusing the two preview scripts as-is: they were each a partial,
dated "first signal" —
- `run_eval_v2_preview.js` (2026-11-02) scored correctness (faithfulness/coverage/must_include)
  on all 39 questions but **without** the paraphrase layer (R7b landed after it ran):
  21/39 (54%) overall pass.
- `run_eval_paraphrase_preview.js` (2026-11-03) added paraphrase faithfulness and
  must-include-survival checks, but only on the 20 questions the relevance gate marked
  "covered" at that time, and `.gsd/STATE.md` explicitly calls it "a first signal, not a
  final verdict" because the faithfulness sample was only 11 applicable judgments.

Neither is the authoritative, dated, pass/fail-scored R9 gate the roadmap's "no regressions"
done-when requires. This plan produces exactly one script that merges both checks and scores
the real pipeline that will actually go live if the bar is met: v2 retrieval (relevance gate)
**and** the paraphrase layer together, since CLAUDE.md's 2026-11-02 grounding decision means
showing raw verbatim excerpts is not the intended student-facing behavior — switching
Consulting live without the paraphrase layer on would contradict that decision. So this eval
must test the combination that switch-over will flip, not retrieval alone.

Purpose: produce a single, dated, scored verdict — PASS or FAIL against the stated bar —
that plans 2–4 are gated on.
Output: `backend/eval/run_eval_r9.js`, `backend/eval/results/2026-11-06-r9-full.{json,md}`,
a log.md entry with the verdict.

## Context
Load for context:
- `.claude/skills/rag-eval/SKILL.md` (scoring rules, gates)
- `backend/eval/questions.jsonl` (39 questions, 29 covered / 10 not-covered)
- `backend/eval/run_eval_v2_preview.js` (reuse its `DOC_IDS`, `loadChunkPool`,
  `localRetrieve`, `cosine`, `decideCoverage`/`judgeRelevanceOnce` usage pattern —
  copy the retrieval/coverage logic, do not re-derive it)
- `backend/eval/run_eval_paraphrase_preview.js` (reuse its paraphrase/faithfulness-judge
  usage pattern on top of the above)
- `backend/src/lib/consultingRetrieval.js` (exports: `decideCoverage`, `judgeRelevanceOnce`,
  `paraphraseChunk`, `judgeParaphraseFaithful`, `AI_FALLBACK_LABEL` — call these directly,
  they are the real production functions, not copies)
- `backend/eval/results/2026-11-02-v2-preview.md` and `2026-11-03-paraphrase-preview.md`
  (the two baselines this run must beat or explain)
- `.gsd/STATE.md` (R6/R7/R7b/R8 history, the 9 `DOC_IDS` and why 2 casebooks were skipped)

## Tasks

<tasks>

<task type="auto">
  <name>Write `run_eval_r9.js`: full 39-question correctness + paraphrase eval, read-only</name>
  <files>
    backend/eval/run_eval_r9.js
  </files>
  <action>
    Start from `run_eval_v2_preview.js` (copy its `DOC_IDS`, `loadChunkPool`, `localRetrieve`,
    `cosine`, `evalGroundedQuestion`, `evalDarkFeature`, `judgeFaithfulness`, `summarize`,
    `buildMarkdown` structure — same no-source-attribution posture: never print casebook
    name/page/source file anywhere, per the 2026-11-02 decision already baked into that file).

    Extend `evalGroundedQuestion` so that, for every question where `covered === true` (the
    relevance gate found a real answer) AND `q.covered === true` (it's supposed to be
    covered), it additionally:
    1. Calls `paraphraseChunk(q.question, top.content)` on the top relevant row (reuse
       `run_eval_paraphrase_preview.js`'s exact call pattern) — increment a `paraphrase`
       call counter.
    2. If `paraphraseChunk` returned the content unchanged (pure-diagram chunk, nothing to
       rewrite), mark `checks.paraphrase_faithful = {verdict: "n/a", ...}` — do not call the
       judge (matches `run_eval_paraphrase_preview.js`'s existing short-circuit).
    3. Otherwise calls `judgeParaphraseFaithful(top.content, paraphraseText)` (its own
       internal 3-vote judge — increment the faithfulness-judge counter by 3) and records
       `checks.paraphrase_faithful` pass/fail.
    4. Recomputes `checks.must_include` **against the paraphrased text**, not the raw chunk
       (this is the "must_include_survives_paraphrase" check from the preview script) —
       rename the existing `must_include` check's reason text so the report is clear it is
       scoring the paraphrased text, since that is what a student will actually see once the
       `ENABLE_ANSWER_PARAPHRASE` flag is live.

    This covers every question the relevance gate marks covered this run (the full set, not
    a fixed subset) — do not hardcode 20 or any other number of questions.

    **Critical check, added after a live finding (2026-11-06, parallel rag-engineer
    investigation): right now only 62 of 13,284 `ingest_chunks` rows are `is_active=true`,
    all belonging to one document (SRCC). `loadChunkPool()` (copied from
    `run_eval_v2_preview.js`) selects directly from `ingest_chunks` by `document_id`, with
    no `is_active` filter at all — this is already correct, by design (same as both existing
    preview scripts) — but it must be PROVEN, not assumed, or this eval risks exactly the
    failure mode just found live: a "no regressions" result that only ever exercised the one
    document already active, while silently skipping the other 8 documents' (FMS, ISB, IIM-
    x, etc.) content that switch-over (plan 2) is actually about to activate.** Add this to
    `loadChunkPool`'s return/logging: for each of the 9 `DOC_IDS`, print its current
    `is_active` state (should show 8 inactive, 1 active — SRCC) and the count of chunks
    retrieved from it. Record this breakdown in the output JSON as `poolActiveState` so
    Task 2 can verify, per question, whether the chunk that answered it belongs to a
    currently-inactive document (i.e., the eval is actually proving something switch-over
    will change, not re-confirming already-active SRCC content).

    Never read or set `process.env.ENABLE_CONSULTING_RAG_V2` or `ENABLE_ANSWER_PARAPHRASE`;
    never write `is_active` anywhere. Output file: `backend/eval/results/2026-11-06-r9-full.json`
    and `.md` (reuse `buildMarkdown`'s structure, add a "Paraphrase" section with faithfulness
    and must-include-survival pass rates, same style as `2026-11-03-paraphrase-preview.md`).

    AVOID: calling `embedTexts`/`judgeRelevanceOnce`/`paraphraseChunk`/`judgeParaphraseFaithful`
    through any new wrapper — import and call them directly from `consultingRetrieval.js` so
    this measures the literal production logic, not an approximation (same rule the preview
    scripts already follow — see their file-header comments).
  </action>
  <verify>
    node -c backend/eval/run_eval_r9.js
    grep -n "is_active" backend/eval/run_eval_r9.js  # must show 0 write occurrences (read-select only, if any)
  </verify>
  <done>
    File parses. `grep -c "\.update(" backend/eval/run_eval_r9.js` returns 0 — the script
    never writes to any table. Script imports `paraphraseChunk`/`judgeParaphraseFaithful`
    from `consultingRetrieval.js` and calls both for every covered question, scored against
    the paraphrased (not raw) text for `must_include`.
  </done>
</task>

<task type="auto">
  <name>Run the eval, score against the stated pass bar, write the verdict to log.md</name>
  <files>
    backend/eval/results/2026-11-06-r9-full.json
    backend/eval/results/2026-11-06-r9-full.md
    log.md
  </files>
  <action>
    Run: `node backend/eval/run_eval_r9.js` from `backend/`. Expect roughly 35 embedding
    calls + ~224 relevance-judge calls (same order as `2026-11-02-v2-preview.md`, since
    retrieval/coverage logic is unchanged) + ~20-29 paraphrase calls + ~30-90 faithfulness-
    judge calls (3x per paraphrase with prose to judge) — total order ~300-350 Gemini calls,
    all flash-lite tier via the existing cascade, no `allowEscalation`. Report the actual
    counts printed by the script; do not estimate.

    **Pass bar for this run (state these numbers explicitly in the report; this is the
    concrete "no regressions" criterion — the 0% baseline from R4 is not a meaningful floor
    on its own, since anything above it is trivially "no regression"):**
    - Every `covered: false` question in `questions.jsonl` scores `coverage_label: pass`
      (100% — a not-covered question ever showing a grounded answer is the one failure mode
      CLAUDE.md treats as non-negotiable; this is a hard blocker, not a percentage).
    - Overall correctness pass rate (`faithfulness` + `coverage_label` + `must_include`,
      same `overallVerdict` definition `run_eval_v2_preview.js` already uses) ≥ 60% — a real
      improvement over the pre-paraphrase 2026-11-02 preview's 54%, not just "not zero".
    - Paraphrase faithfulness ≥ 80% of applicable judgments (2026-11-03's preview measured
      91% on a smaller sample; 80% gives headroom for the larger sample while still being a
      real bar, not a rubber stamp).
    - must_include survival after paraphrasing ≥ 65% (2026-11-03's preview measured 13/17 =
      76%; 65% gives headroom while catching a real regression).
    - **New hard gate, not optional:** using the `poolActiveState` breakdown from Task 1,
      confirm that the majority of scored, covered questions were answered from a chunk
      belonging to a document that was `is_active=false` at eval time (i.e., content
      switch-over is actually about to activate) — not predominantly from the one document
      (SRCC) already active today. Report the exact split (e.g. "X/Y covered questions
      answered from a currently-inactive document"). If most scored questions turn out to
      be answered from SRCC alone, this run has NOT actually tested switch-over's effect and
      must be flagged `## FAIL — eval did not exercise inactive content` regardless of the
      other bars, with a note that the question set or retrieval needs investigation before
      switch-over proceeds.

    If every bar is met (including the inactive-content gate above): write `## PASS` at the top of the .md report and a log.md entry
    ("R9 eval: PASS — switch-over plans 2-4 may proceed") with the scores. If any bar is
    missed: write `## FAIL` with the specific missed bar(s) and do **not** mark plans 2-4 as
    cleared to run — state this explicitly in both the report and the log.md entry, and stop
    here (do not attempt to fix retrieval/paraphrase code as part of this plan — that is a
    new rag-engineer task, out of this plan's scope).

    Compare per-question results against `2026-11-02-v2-preview.md` by question id; list any
    question that went pass→fail as a named regression in the report, per the `rag-eval`
    skill's gate, even if the overall bar is still met.
  </action>
  <verify>
    cat backend/eval/results/2026-11-06-r9-full.md | head -5
    grep -n "R9 eval" log.md | tail -1
  </verify>
  <done>
    Results files exist and contain a `## PASS` or `## FAIL` verdict with every bar's actual
    number against its threshold. log.md has a dated entry with the verdict, scores, call
    counts and rough cost. If FAIL, the entry says plainly that switch-over does not proceed.
  </done>
</task>

</tasks>

## Must-Haves
After both tasks complete, verify:
- [ ] A dated, scored eval run exists at full scale (all 29 covered + 10 not-covered
      questions), covering retrieval, coverage labelling, paraphrase faithfulness and
      must-include survival together — not a subset, not retrieval alone.
- [ ] A concrete, stated pass bar was applied (not "beat 0%").
- [ ] The eval is proven to have exercised currently-inactive documents (not just the one
      already-active SRCC document) — the `poolActiveState` breakdown is in the report.
- [ ] `is_active` and both flags (`ENABLE_CONSULTING_RAG_V2`, `ENABLE_ANSWER_PARAPHRASE`)
      are untouched by this plan — confirmed by `grep` showing no writes in the script and
      no env var being set anywhere in it.
- [ ] The verdict (PASS/FAIL) is unambiguous in both the .md report and log.md.

## Success Criteria
- [ ] `node backend/eval/run_eval_r9.js` runs to completion and writes both result files.
- [ ] log.md has the dated R9 eval entry.
- [ ] If PASS: plan 2 may proceed. If FAIL: report to Aalhad and stop; do not execute
      plans 2-4.

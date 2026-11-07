---
phase: FIN1
plan: 05
wave: 3
depends_on: ["02", "04"]
files_modified:
  - backend/eval/questions.jsonl
  - backend/eval/run_eval_finance_preview.js
  - backend/eval/results/<date>-finance-preview.json
  - backend/eval/results/<date>-finance-preview.md
autonomous: true
user_setup: []

must_haves:
  truths:
    - "There is a real, honestly-reported accuracy signal for Finance Q&A before any switch-over decision is made"
    - "The widened Q&A domain filter (FIN1.04) doesn't show obvious cross-domain leakage (a Consulting question answered from a Finance chunk, or vice versa) on this question set"
    - "is_active is never touched by this plan — this is a preview, not a switch-over"
  artifacts:
    - "backend/eval/questions.jsonl has at least 10 new Finance questions (feature: qa), including at least 2 not-covered-by-the-compendium questions"
    - "backend/eval/run_eval_finance_preview.js exists, mirrors run_eval_paraphrase_preview.js's read-only local-retrieval-over-inactive-rows pattern"
    - "A results file under backend/eval/results/ reports real numbers, not estimates"
---

# Plan FIN1.05: Finance eval questions + a read-only preview run against the inactive pool

<objective>
Before anyone decides whether to switch the Finance compendium live, get a real accuracy
read on it: add Finance test questions (Aalhad's job for every other domain per the M2
done-when criteria, but FIN1 needs at least a starter set to unblock this plan — write a
reasonable first batch now, flag to Aalhad that more coverage is welcome later, the same way
R3's 39 questions grew from an initial smaller set), then run them against the FIN1.02
chunks the same way `run_eval_paraphrase_preview.js` proved out R7b before its own
switch-over: locally, by document ID, over the still-inactive rows — never through the live
RPC (which requires `is_active = true`), never flipping any flag.

Purpose: catch two different failure modes before they'd otherwise only surface in
production — (1) the compendium's own content/chunking quality (does a Finance question
actually get answered faithfully from the right topic chunk), and (2) FIN1.04's design bet
that dropping Q&A's domain filter doesn't cause Consulting/Finance cross-contamination.
Output: a results file with real pass/fail numbers, reported honestly even if something
fails.
</objective>

<context>
Load for context:
- `backend/eval/questions.jsonl` — existing format (one JSON object per line: `id, domain,
  feature, question, expected_source, expected_pages, must_include, covered`). For Finance
  rows, `expected_pages` should hold the `lineStart`/`lineEnd` line-range FIN1.01/FIN1.02
  wrote (the repurposed locator, not PDF pages — note this in a comment if the format needs
  one, or just use the numbers as-is since the field is generic).
- `backend/eval/run_eval_paraphrase_preview.js` — the exact pattern to mirror: it loads a
  fixed set of inactive document IDs' chunks directly from `ingest_chunks`
  (`loadChunkPool`/local cosine retrieval, NOT the `match_ingest_chunks` RPC, because that
  RPC requires `is_active = true`), then calls the real production functions
  (`decideCoverage`, `judgeRelevanceOnce` from `consultingRetrieval.js`) on that locally
  retrieved pool — reuse these exact functions, don't reimplement retrieval scoring.
- `backend/eval/run_eval_v2_preview.js` — `run_eval_paraphrase_preview.js`'s own comment says
  its local-retrieval/cosine mechanics were "copied verbatim" from this file; read it for the
  actual cosine-similarity helper to reuse rather than re-deriving a third copy.
- `backend/ingestion/out/fin1_ingest_report.json` (FIN1.02) — the Finance compendium's
  `ingest_documents.id`, needed as this script's fixed document-ID constant (same pattern as
  `DOC_IDS` in the paraphrase-preview script).
- `backend/src/lib/qaRetrieval.js` (post-FIN1.04) — this plan's cross-domain check reuses
  `decideCoverage`/`judgeRelevanceOnce` directly (same as the existing preview scripts do),
  not `groundedQaAnswer` itself (that calls `generateText` for the final answer, which this
  preview doesn't need to pay for — same reasoning as the existing preview scripts only
  checking coverage/relevance, not generating full answers).
</context>

<tasks>

<task type="auto">
  <name>Write Finance test questions</name>
  <files>
    backend/eval/questions.jsonl
  </files>
  <action>
    Append at least 12 new lines (don't touch or reorder existing lines — this file is
    append-only in spirit, matching the data-safety posture elsewhere in the project):
    - 8 "covered" questions, each targeting a different module's topic across a spread of
      the compendium (not all from Module 1) — e.g. one on TVM/NPV (Module 1), one on
      ratio analysis or DuPont (Module 4), one on revenue recognition or leases (Module 2),
      one on valuation/DCF or WACC (Module 8/9-area — check the real module list via
      `grep "^## Module" finance_compendium.md` for exact topic coverage), one on M&A or
      LBO basics, one on a markets/derivatives topic, one on banking/NPA or risk, one on
      fintech/UPI (the compendium's own "India first" emphasis — a good faithfulness test
      since these facts are India-specific and easy to spot-check). `must_include` terms
      must be phrases that genuinely appear in that topic's actual text — verify by grepping
      the source file for each term before writing it into the question, the same discipline
      R3's original 39 questions used.
    - 2 "not covered" questions — something genuinely outside the compendium's 26 modules
      (reuse the spirit of R3's not-covered questions; e.g. something hyper-specific to a
      named real company's unpublished internal numbers, or a request for current/live
      market data the compendium explicitly flags as `[VERIFY: source]` rather than giving a
      number for).
    - 2 cross-domain probe questions: one phrased as a classic Consulting question (e.g.
      MECE, a market-sizing guesstimate) and one phrased as a classic Finance question (e.g.
      WACC, DuPont) — both already have `covered: true` rows from R3/this task, but tag these
      two specifically with a `"crossDomainProbe": true` extra field so FIN1.05's second task
      can report on them separately: does the Consulting-phrased one, now that Q&A searches
      both source classes, ever get answered from a Finance chunk (or vice versa)? That would
      be the leakage failure mode FIN1.04 flagged as a risk to watch.
    Use `domain: "Finance"`, `feature: "qa"`, `expected_source: "finance_compendium.md"` for
    every new Finance row.
  </action>
  <verify>
    cd backend && node -e "
      const fs = require('fs');
      const lines = fs.readFileSync('eval/questions.jsonl','utf-8').trim().split('\n');
      const finance = lines.map(l => JSON.parse(l)).filter(q => q.domain === 'Finance');
      console.log('Finance questions:', finance.length, 'covered:', finance.filter(q=>q.covered).length);
    "
  </verify>
  <done>
    At least 12 Finance questions in `questions.jsonl`; every existing (pre-FIN1) line is
    byte-identical to before (`git diff` shows only additions).
  </done>
</task>

<task type="auto">
  <name>Build and run the read-only Finance preview eval</name>
  <files>
    backend/eval/run_eval_finance_preview.js
  </files>
  <action>
    Mirror `run_eval_paraphrase_preview.js`'s structure: load the Finance compendium's
    inactive `ingest_chunks` rows directly by `document_id` (from `fin1_ingest_report.json`),
    compute local cosine similarity against each Finance question's embedding (same
    `embedTexts`/cosine helper `run_eval_v2_preview.js` already has), apply `decideCoverage`,
    then `judgeRelevanceOnce` on surviving rows — report, per question: covered (yes/no vs
    expected `covered` field), top match's `topicId`/section title, whether `must_include`
    terms appear in the matched chunk's raw content. For the 2 `crossDomainProbe` questions,
    additionally run the SAME local retrieval against BOTH the Finance pool and the existing
    Consulting inactive-pool document IDs (reuse the `DOC_IDS` list already in
    `run_eval_v2_preview.js`/`run_eval_paraphrase_preview.js`) combined, and report which
    domain's chunk actually won — this directly tests FIN1.04's cross-domain risk without
    needing the live RPC or any flag change.
    Never write to any table; never read/write `is_active`. Write
    `backend/eval/results/<today's date>-finance-preview.{json,md}` (same two-format
    convention as every other eval run in `backend/eval/results/`).
  </action>
  <verify>cd backend && node eval/run_eval_finance_preview.js</verify>
  <done>
    The script runs to completion against real (paid, cheap flash-lite tier) Gemini calls
    and produces a results file with real pass/fail counts — reported plainly in the plan
    execution's handback even if the pass rate is low or a cross-domain probe shows leakage
    (per CLAUDE.md: "Report results honestly. If an eval fails... say so with the output.").
    A `log.md` entry (eval type) is written with the real numbers and call count.
  </done>
</task>

</tasks>

<verification>
After all tasks:
- [ ] `questions.jsonl` has ≥12 new Finance rows, existing rows untouched
- [ ] A results file exists under `backend/eval/results/` with real numbers
- [ ] The 2 cross-domain probe questions have a reported, honest answer to "did FIN1.04's
      domain-widening cause cross-domain leakage on this sample" — yes, no, or inconclusive,
      not skipped
- [ ] `is_active` unchanged everywhere; `log.md` entry written
</verification>

<success_criteria>
- [ ] Both tasks verified passing
- [ ] Must-haves confirmed
- [ ] Numbers reported honestly, including any failures or the small-sample caveat (same
      caveat R7b's own preview eval carried — 12-ish questions is a first signal, not a
      final verdict)
</success_criteria>

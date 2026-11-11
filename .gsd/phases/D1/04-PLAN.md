---
phase: D1
plan: 04
wave: 3
gap_closure: false
depends_on: ["02", "03"]
agent: rag-evaluator
files_modified:
  - backend/eval/questions.jsonl
  - backend/eval/run_eval_pm_preview.js
  - backend/eval/results/<date>-pm-preview.json
  - backend/eval/results/<date>-pm-preview.md
paid_calls: real flash-lite-tier Gemini calls for embedding the question set + relevance-judge votes during the preview run (small, same order of magnitude as FIN1.05's ~12-15 question run — no escalation tier used)
---

# Plan D1.4: PM eval questions + a read-only preview run against the inactive pool

## Objective
Before any switch-over decision is made (out of scope for this plan and this phase — see
Note below), get a real accuracy read on the PM compendium, mirroring FIN1.05's exact method:
add PM test questions (at least 15, a few the compendium doesn't cover, per M2's shared
done-when criteria), then run them against D1.2's chunks locally, by document ID, over the
still-inactive rows — never through the live RPC (which requires `is_active = true`), never
flipping any flag.

This also doubles as the second half of D1.3's cross-domain risk check: since Q&A now
searches `domain: null` across Consulting, Finance and Prodman all at once (FIN1.04's design,
unchanged by D1), a PM-phrased question must not get answered from a Consulting or Finance
chunk, and vice versa. Include probe questions for this, same pattern as FIN1.05's
`crossDomainProbe` field.

**Note on switch-over**: this plan proves accuracy and non-leakage; it does NOT flip
`is_active`. Per the roadmap's M2 done-when criteria and this project's standing practice
(R9's own switch-over needed Aalhad's explicit sign-off + a live QA pass after an eval gate
passed), making D1.2's rows live is a separate, later decision — not built into this
autonomous plan.

Output: PM questions appended to `backend/eval/questions.jsonl`; a results file with real
pass/fail numbers, reported honestly even if something fails.

## Context
Load for context:
- `backend/eval/questions.jsonl` — existing format: one JSON object per line (`id, domain,
  feature, question, expected_source, expected_pages, must_include, covered`, plus the
  optional `crossDomainProbe` boolean FIN1.05 introduced). Existing rows are append-only in
  spirit — do not edit or reorder any existing line.
- `backend/eval/run_eval_finance_preview.js` (FIN1.05) — the exact script to mirror: loads a
  fixed document ID's inactive `ingest_chunks` rows directly (NOT via `match_ingest_chunks`,
  which requires `is_active = true`), computes local cosine similarity, applies
  `decideCoverage`/`judgeRelevanceOnce` from `consultingRetrieval.js`, and for its
  `crossDomainProbe` questions additionally runs the same local retrieval against a combined
  pool of multiple domains' document IDs to see which domain's chunk actually wins. Reuse
  this structure for a 3-way pool (Consulting + Finance + Prodman) rather than FIN1.05's
  2-way one, since Q&A's domain filter is dropped across all three now, not just two.
- `backend/eval/run_eval_v2_preview.js` — the original source of the local cosine-similarity
  helper every preview script since has reused; reuse it again rather than re-deriving it a
  fourth time.
- `backend/ingestion/out/d1_ingest_report.json` (D1.2) — the PM compendium's
  `ingest_documents.id`, this script's fixed PM document-ID constant.
- `backend/src/lib/qaRetrieval.js` (post-D1.3/FIN1.04) — reuses `decideCoverage`/
  `judgeRelevanceOnce` directly, not `groundedQaAnswer` itself (no need to pay for full
  answer generation in a coverage/relevance preview, same reasoning as the existing preview
  scripts).

## Tasks

<task type="auto">
  <name>Write PM test questions</name>
  <files>
    backend/eval/questions.jsonl
  </files>
  <action>
    Append at least 17 new lines (don't touch or reorder existing lines):
    - 12 "covered" questions, spread across the compendium's parts rather than clustered in
      one (e.g. one on CIRCLES/product design, Part 3; one on a prioritization framework —
      RICE or Kano, Part 4; one on a metrics framework — HEART or AARRR, Part 5; one RCA
      worked-case question, Part 6; one guesstimate, Part 7; one app-critique/teardown, Part
      8; one execution topic — PRD or roadmap, Part 9; one growth topic — K-factor or PLG,
      Part 10; one strategy/pricing topic, Part 11; one platform-economics topic, Part 12;
      one technology-primer topic, Part 13; one behavioural/HR question, Part 16). For each,
      verify `must_include` terms genuinely appear in that topic's actual text by grepping
      `Data/Prodman Files/PM_Compendium.md` for each term before writing the question — same
      discipline R3's and FIN1.05's question sets used. Use `domain: "Prodman"`,
      `feature: "qa"`, `expected_source: "PM_Compendium.md"`,
      `expected_pages: [lineStart, lineEnd]` (the real line-range from D1.2's ingested rows,
      not PDF pages — same repurposing convention as FIN1's Finance rows).
    - 3 "not covered" questions — genuinely outside the compendium's scope. The compendium's
      own text (see "What is deliberately not here" and "Externally sourced sections" in its
      "About this compendium" section) flags specific gaps: ask something that would need the
      verbatim text of *Cracking the PM Interview*/*Inspired*/*Product Management in
      Practice* rather than the compendium's own description of their frameworks, or
      something requiring a named real company's actual unpublished 2026 internal metrics.
    - 2 cross-domain probe questions, `"crossDomainProbe": true`: one phrased as a classic PM
      question (e.g. CIRCLES, RICE) and one phrased as a classic Consulting or Finance
      question (e.g. MECE, WACC) — reuse/extend FIN1.05's existing two probes if they're
      still the cleanest Consulting/Finance pair, or add a third PM-vs-Finance or
      PM-vs-Consulting pair alongside them. Tag clearly so task 2 can report on them
      separately.
  </action>
  <verify>
    cd backend && node -e "
      const fs = require('fs');
      const lines = fs.readFileSync('eval/questions.jsonl','utf-8').trim().split('\n');
      const pm = lines.map(l => JSON.parse(l)).filter(q => q.domain === 'Prodman');
      console.log('PM questions:', pm.length, 'covered:', pm.filter(q=>q.covered).length, 'not covered:', pm.filter(q=>!q.covered).length);
    "
  </verify>
  <done>
    At least 17 PM questions in `questions.jsonl` (≥15 real questions per the roadmap's
    done-when, written with headroom); at least 3 marked `covered: false`; every pre-D1 line
    is byte-identical to before (`git diff` shows only additions).
  </done>
</task>

<task type="auto">
  <name>Build and run the read-only PM preview eval</name>
  <files>
    backend/eval/run_eval_pm_preview.js
  </files>
  <action>
    Mirror `run_eval_finance_preview.js`'s structure: load the PM compendium's inactive
    `ingest_chunks` rows directly by `document_id` (from `d1_ingest_report.json`), compute
    local cosine similarity against each PM question's embedding, apply `decideCoverage` then
    `judgeRelevanceOnce` on surviving rows — report per question: covered (yes/no vs expected
    `covered`), top match's `topicId`/`section_title`, whether `must_include` terms appear in
    the matched chunk's raw content. For the cross-domain probe questions, additionally run
    the same local retrieval against a combined pool of the PM document ID plus the existing
    Consulting and Finance inactive-pool document IDs (reuse the `DOC_IDS`/`CONSULTING_DOC_IDS`
    constants already present in `run_eval_v2_preview.js`/`run_eval_paraphrase_preview.js`/
    `run_eval_finance_preview.js`) and report which domain's chunk actually won.
    Never write to any table; never touch `is_active`. Write
    `backend/eval/results/<today's date>-pm-preview.{json,md}` (same two-format convention as
    every other eval run in `backend/eval/results/`).
  </action>
  <verify>cd backend && node eval/run_eval_pm_preview.js</verify>
  <done>
    The script runs to completion against real (paid, cheap flash-lite tier) Gemini calls and
    produces a results file with real pass/fail counts — reported plainly even if the pass
    rate is low or a cross-domain probe shows leakage (CLAUDE.md: "Report results honestly.").
    A `log.md` entry (eval type) is written with the real numbers and call count.
  </done>
</task>

## Must-Haves
- [ ] `questions.jsonl` has ≥15 new PM rows (≥3 not-covered), existing rows untouched
- [ ] A results file exists under `backend/eval/results/` with real numbers
- [ ] The cross-domain probe questions have a reported, honest answer — yes, no, or
      inconclusive leakage, not skipped
- [ ] `is_active` unchanged everywhere; `log.md` entry written
- [ ] D1's roadmap row's done-when (ingestion, retrieval wiring, eval questions, Frameworks/
      Q&A reachability, cost logged) is fully satisfied by plans 01-04 together; switch-over
      itself is explicitly out of scope and flagged as Aalhad's next, separate call

## Success Criteria
- [ ] Both tasks verified passing
- [ ] Numbers reported honestly, including any failures or small-sample caveats (same caveat
      every prior preview eval in this project has carried)

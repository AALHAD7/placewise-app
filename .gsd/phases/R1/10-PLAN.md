---
phase: R1
plan: 10
wave: 8
depends_on: ["09"]
agent: fidelity-reviewer
gap_closure: true
paid_calls: 0
---

# Plan R1.10: Re-review v3: an issue tree (fresh + p11/p13/p14), chart/flow and matrix regression

## Objective
Close R1's blocked done-criterion. Against the page images, check the v3 issue trees (2+ fresh candidates and
a re-check of p11, p13 and p14), the chart and flow results again, and the p20 matrix as a regression check. Use the same strict
rule as R1.06: every label character for character (punctuation included), every number, every branch and edge.
You did not write the converter, so assume nothing is right until you have checked it.

## Context
Read first:
- `CLAUDE.md`, `.claude/agents/fidelity-reviewer.md`, `.claude/skills/diagram-transcription/SKILL.md`,
  `.claude/skills/build-log/SKILL.md`, `.gsd/phases/R1/06-PLAN.md` (the method; the same item-by-item checks apply)
- `backend/ingestion/out/r1_review.json` (the v2 findings), `out/r1_pilot_report_v3.json` → `candidates`,
  `out/r1_candidates_v3.html`, `out/pages/p<N>.png`

Facts you need:
- All `<verify>` commands run from the repo root (`/Users/aalhad/Projects/Placement Website`).
- v3 = `ingest_documents` with source_file `The FMS Consulting CaseBook 2023-24 (1).pdf` and `ingestion_version = 3`.
  Render a page: `cd backend/ingestion && venv/bin/python diagram_preview.py --pdf "<pdf>" --pages <N> --source db --version 3 --out out/review_p<N>.html`.
- What failed in v2: p11 convergence stored as a 3rd child; p13 no main 3C's block, Company questions under
  "Government", `C’s` → `C's`; p14 `4P’s` → `4P's`; p19 0 of 6 chevron edges; p52 V/R/I/O missing and the summary
  over-claimed. p10 (flow) and p20 (matrix) passed.
- You may set `needs_review = true` and append `fidelity_review:<issue_type>` to `review_reasons` on **v3 pages only**.
  Never set `review_status = 'approved'`. Never edit pipeline code. Never touch v1/v2 rows.
- Issue types: `missing`, `altered`, `hallucinated`, `structure_lost`, `unreadable`.

## Tasks

<task type="auto">
  <name>Issue trees: re-check p11, p13, p14 and review fresh candidates</name>
  <files>backend/ingestion/out/r1_review_v3.json   (local, gitignored)</files>
  <action>
    1. Re-check p11, p13 and p14 in v3 item by item. Record each one as fixed or still failing per original mismatch.
       (p11 may now be a flow. Judge whether the convergence is represented, whatever the type.)
    2. Review the fresh issue_tree candidates from the report, in order, until one passes or 3 have failed.
    3. Write `out/r1_review_v3.json` like `r1_review.json`: `{document_id, ingestion_version: 3, pages: [{page_no, type,
       role: "recheck"|"fresh"|"regression", items_checked, mismatches, verdict}], result: {...}}`.
    4. Flag each failing v3 page (needs_review + reason). If no issue tree passes, report `blocked` with the patterns.
  </action>
  <verify>
    cd backend/ingestion && venv/bin/python -c "import json;r=json.load(open('out/r1_review_v3.json'));print([(p['page_no'],p['type'],p['role'],p['items_checked'],len(p['mismatches']),p['verdict']) for p in r['pages'] if p['type']=='issue_tree' or p['page_no'] in (11,13,14)])"
  </verify>
  <done>
    p11, p13 and p14 each have a recorded verdict. At least one issue_tree page has verdict `pass`, 0 mismatches and items_checked &gt; 0.
  </done>
</task>

<task type="auto">
  <name>Chart and flow results again, matrix regression, spot-check sheet and log</name>
  <files>
    backend/ingestion/out/r1_review_v3.json
    backend/ingestion/out/r1_spotcheck_v3.html   (local, gitignored)
    log.md
  </files>
  <action>
    1. Chart: review p78 and up to 2 more chart candidates (p79, p86 or the report's list), checking axis labels, series and every
       data point. The charts were never reviewed in v2.
    2. Flow: re-check p19 (chevron edges) and p52 (V/R/I/O, summary). Regression: p10 (flow) and p20 (matrix) must still pass.
    3. Add these to `r1_review_v3.json` and set `result` = `{issue_tree, matrix, chart, flow}`, each pass / fail / blocked with pages.
    4. `diagram_preview.py --source db --version 3` for one passing issue tree, p20, and one passing chart or flow →
       `out/r1_spotcheck_v3.html`.
    5. Write the log.md entry "R1 fidelity re-review (v3)" with the table (page | type | role | items | verdict | evidence),
       v2 → v3 per re-checked page, pages flagged, and any remaining pipeline pattern (for R2). 0 Gemini calls.
  </action>
  <verify>
    cd "/Users/aalhad/Projects/Placement Website" && backend/ingestion/venv/bin/python -c "import json;r=json.load(open('backend/ingestion/out/r1_review_v3.json'));print(r['result']);print([(p['page_no'],p['type'],p['verdict']) for p in r['pages']])" && test -s backend/ingestion/out/r1_spotcheck_v3.html && grep -n "R1 fidelity re-review" log.md
  </verify>
  <done>
    `result` shows issue_tree pass, matrix pass (p20), and chart or flow pass. The verdicts for p19, p52 and at least one chart
    are recorded. The sheet exists and the log entry has the table.
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Aalhad spot-checks the 3 v3 pages</name>
  <action>
    Ask Aalhad to open `backend/ingestion/out/r1_spotcheck_v3.html` locally and confirm that every label, number and branch
    matches on the 3 pages. Quote his reply in the task-2 log entry.
  </action>
  <verify>Aalhad's reply is quoted in log.md under "R1 fidelity re-review (v3)".</verify>
  <done>Aalhad confirms all 3. Then the verifier can mark R1 done in `.gsd/ROADMAP.md` (v3 is the R1 candidate, still inactive).</done>
</task>

## Must-Haves
- [ ] One issue tree, the p20 matrix, and one chart or flow pass the strict check
- [ ] p11/p13/p14/p19/p52 have re-check verdicts on record
- [ ] No approvals, no pipeline edits, no v1/v2 writes

## Success Criteria
- [ ] r1_review_v3.json + log entry + Aalhad's confirmation

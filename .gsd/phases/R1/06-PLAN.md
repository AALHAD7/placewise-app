---
phase: R1
plan: 06
wave: 4
depends_on: ["05"]
agent: fidelity-reviewer
gap_closure: false
paid_calls: 0
---

# Plan R1.06: Independent check of 3 diagram pages + Aalhad's spot-check

## Objective
Prove that the rebuilt diagrams are faithful. For one **issue tree**, one **matrix** and one **chart
or flow** from the v2 re-pilot, compare every label, number, axis, branch and edge in the stored
`placewise-diagram` block against the page image. Then hand the same 3 pages to Aalhad as a
side-by-side sheet. This is part 2 of R1's done-criterion. You did not write the converter, so
assume nothing is correct until you've checked it.

## Context
Read first:
- `CLAUDE.md`, `.claude/agents/fidelity-reviewer.md`, `.claude/skills/diagram-transcription/SKILL.md`,
  `.claude/skills/casebook-ingestion/SKILL.md`, `.claude/skills/build-log/SKILL.md`
- `backend/ingestion/out/r1_pilot_report.json`: the `sample candidates` section (plan 05)
- `backend/ingestion/out/r1_candidates.html` + `out/pages/p<N>.png` (local, admin-only)

Facts you need:
- All `<verify>` commands run from the repo root (`/Users/aalhad/Projects/Placement Website`).
- PDF: `Data/Consulting Files/PDF Files/The FMS Consulting CaseBook 2023-24 (1).pdf`
- v2 rows: `ingest_documents` where source_file = that PDF name and `ingestion_version = 2`. Read
  pages with the service-role client: `cd backend/ingestion && venv/bin/python -c "..."` using
  `config.py` + `supabase.create_client`.
- Render any page you need: `venv/bin/python diagram_preview.py --pdf <pdf> --pages <N> --source db
  --version 2 --out out/review_p<N>.html` (writes `out/pages/p<N>.png`). Read the PNG directly to look at it.
- You may set `needs_review = true` (and append a review reason) on a v2 page. You must never
  set `review_status = 'approved'`, and you never edit pipeline code.
- Issue types: `missing`, `altered`, `hallucinated`, `structure_lost`, `unreadable`.

## Tasks

<task type="auto">
  <name>Compare 3 sample diagram pages against their page images</name>
  <files>
    backend/ingestion/out/r1_review.json   (local, gitignored)
  </files>
  <action>
    1. Pick one candidate each: issue_tree, matrix, and chart-or-flow (prefer p20 matrix and p52 flow if
       they are candidates). Pick the issue tree from the report's list.
    2. For each page: open the PNG; read `markdown` and `diagrams` from the DB; check, item by item:
       - every printed label in the diagram appears in the block, character for character (case,
         spelling, punctuation, units)
       - every number and unit matches
       - structure: tree parent→child relations, and no merged or missing nodes; matrix axis names, row/col
         order and every cell in the right position; flow node set and every edge, with its direction and
         Yes/No label; chart axis labels, series names and every data point
       - nothing in the block is absent from the page (`hallucinated`)
       - the `Diagram summary:` line says nothing the diagram doesn't show
    3. Record per page `{page_no, type, items_checked, mismatches: [{issue_type, expected, got}], verdict}`
       in `out/r1_review.json`.
    4. Any mismatch → set `needs_review = true` on that v2 page, then try the next candidate of the same
       type (at most 3 per type). If no candidate of a type passes, stop. Report `blocked`, with the
       pattern and the page numbers, so the orchestrator can open a gap-closure plan for
       ingestion-engineer (prompt fix). Do not count a partial pass as done.
  </action>
  <verify>
    cd backend/ingestion && venv/bin/python -c "import json;r=json.load(open('out/r1_review.json'));print([(p['page_no'],p['type'],p['items_checked'],len(p['mismatches']),p['verdict']) for p in r['pages']])"
  </verify>
  <done>
    Three pages are covered: one issue_tree, one matrix, and one chart or flow. Each has verdict `pass` with
    0 mismatches, and items_checked > 0 (the count of labels + numbers + edges verified).
  </done>
</task>

<task type="auto">
  <name>Build Aalhad's spot-check sheet and log the review</name>
  <files>
    backend/ingestion/out/r1_spotcheck.html   (local, gitignored)
    log.md
  </files>
  <action>
    1. Run `venv/bin/python diagram_preview.py --pdf "<pdf>" --pages <a>,<b>,<c> --source db --version 2
       --out out/r1_spotcheck.html` for the 3 passing pages.
    2. Write the log.md entry (build-log skill), "R1 fidelity review: 3 diagram pages". Include the table
       (page | type | items checked | verdict | evidence), any pages flagged needs_review during the
       search with their issue types, any pipeline pattern seen, and the path of the spot-check sheet.
  </action>
  <verify>
    cd "/Users/aalhad/Projects/Placement Website" && test -s backend/ingestion/out/r1_spotcheck.html && grep -n "R1 fidelity review" log.md
  </verify>
  <done>The sheet exists with 3 pages side by side, and the log entry has the table.</done>
</task>

<task type="checkpoint:human-verify">
  <name>Aalhad spot-checks the 3 pages</name>
  <action>
    Ask Aalhad to open `backend/ingestion/out/r1_spotcheck.html` locally (the page image is on the left,
    the rebuilt diagram on the right) and confirm, for each of the 3 pages, that every label, number and
    branch matches. Record his answer (pass, or the specific issues) in the log entry from task 2.
  </action>
  <verify>Aalhad's reply is quoted in log.md under the R1 fidelity review entry.</verify>
  <done>Aalhad confirms all 3. Then the verifier can mark R1 done in `.gsd/ROADMAP.md`.</done>
</task>

## Must-Haves
- [ ] issue tree, matrix, chart/flow: every label, number and branch matches the page image
- [ ] Aalhad's spot-check recorded
- [ ] No `approved` status set by an agent; no pipeline code edited

## Success Criteria
- [ ] out/r1_review.json shows 3 × pass
- [ ] log.md has the review entry with Aalhad's confirmation

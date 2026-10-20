---
phase: R2
plan: 04
wave: 1
depends_on: []
agent: ingestion-engineer
gap_closure: true
files_modified:
  - backend/ingestion/textnorm.py
  - backend/ingestion/postprocess.py
  - backend/ingestion/diagram_schema.py
  - backend/ingestion/run_patch.py
  - backend/ingestion/r2_fixcheck.py
  - backend/ingestion/tests/test_strip_links.py
  - backend/ingestion/tests/test_r2_fixes.py
  - backend/ingestion/out/r2_fixcheck.json   (local, gitignored)
paid_calls: 0
---

# Plan R2.04: Free pipeline fixes for the R1.10 patterns (link regex, fallback link-strip, nav typos, blocks "in tables")

## Objective
Fix the deterministic pipeline patterns from R1.10 (STATE "R2 must start with", items 2, 3, 4 and the in-table half of 6) in code,
with tests. This plan costs nothing and changes no data. Plan 06 applies the fixes to every page when it builds v4.
Not in this plan:
- Item 1 (wrong parents) and item 5 (over-linked column stacks, over-claiming summaries) have no deterministic fix and R1 ruled
  out more prompt rounds. They are handled by the structure check (plan 01), the eyeball sweep (plans 02 and 03) and flags (plan 05).
- The "visual page with no block" half of item 6 needs a vision call to fix. It is flagged instead (plans 02, 03 and 06).

## Context
Read first: `CLAUDE.md`, `.claude/skills/casebook-ingestion/SKILL.md`, `backend/ingestion/textnorm.py` (`_LINK_RE`, `strip_invented_links`),
`backend/ingestion/postprocess.py` (`postprocess_markdown`), `backend/ingestion/diagram_schema.py` (`extract_blocks` in-table detection
around lines 80–190, `check_diagrams` → `block_in_table`), `backend/ingestion/run_patch.py` (`choose_page`, `v1_page`),
`backend/ingestion/tests/test_strip_links.py`.

Facts you need:
- All `<verify>` commands run from the repo root `/Users/aalhad/Projects/Placement Website`. Tests:
  `cd backend/ingestion && venv/bin/python -m unittest discover -s tests` (223 pass today; all must still pass).
- v3 doc `129a2604-0221-4ba2-af50-42ac641a21a0`. Read-only here. Evidence pages:
  - `)` left by the link strip: p10, p224 (`[Main Index](javascript:history.back())` → `Main Index)`).
  - fallback_v1 pages never went through `postprocess_markdown`: invented images `https://via.placeholder.com/...` and `(chart)` targets on p69 and p71;
    `(#[UNREADABLE])` link targets on 56, 67, 77, 127, 203. All 15 fallback_v1 pages: 15, 56, 67, 69, 71, 77, 79, 86, 127, 129, 152, 185, 198, 203, 229.
  - "Guesestimate Index" in the markdown on 88, 97, 98, 101, 106, 116. The text layer of all six pages has "Guesstimate" (checked).
  - `block_in_table` flagged on 58, 59, 60, 70, 72, 73. On p58 the flow block sits under `## Value Chain` and is followed by its summary and
    then a table. That may be a detector false positive, not a block inside a cell.
- Plan 01 (wave 1, in parallel) owns `structure_check.py`. Do not touch it.

## Tasks

<task type="auto">
  <name>Link regex with nested parentheses + link-strip on fallback pages</name>
  <files>
    backend/ingestion/textnorm.py
    backend/ingestion/run_patch.py
    backend/ingestion/tests/test_strip_links.py
  </files>
  <action>
    1. `_LINK_RE`: allow one level of balanced parentheses inside the target, e.g. `\(((?:[^()\n]|\([^()\n]*\))*)\)`, so that
       `[Main Index](javascript:history.back())` becomes `Main Index` with no stray `)`. Keep image links (`!`) handled the same way (alt text is kept).
    2. Make sure `(#[UNREADABLE])`-style targets and `![logo](https://via.placeholder.com/150)` (not printed in the text layer) are stripped.
       Add a test for each, plus the p10 string and a real printed URL that must stay.
    3. `run_patch.choose_page`/`v1_page`: run the fallback_v1 markdown through `postprocess_markdown` (same as the other paths) and
       keep its `fallback_v1` reason. This fixes future runs; v3 itself is not rewritten (plan 06 builds v4).
    AVOID: a fully recursive regex or a markdown parser, because one level of nesting covers every case seen and keeps the regex readable.
  </action>
  <verify>cd backend/ingestion && venv/bin/python -m unittest tests.test_strip_links -v 2>&1 | tail -3</verify>
  <done>The new link tests pass, including `history.back()` → `Main Index` (no ")"), `#[UNREADABLE]` and the placeholder image.</done>
</task>

<task type="auto">
  <name>Nav-line typo repair + block_in_table root cause</name>
  <files>
    backend/ingestion/postprocess.py
    backend/ingestion/diagram_schema.py
    backend/ingestion/tests/test_r2_fixes.py
  </files>
  <action>
    1. `postprocess.fix_nav_typos(markdown, text_layer) -> (markdown, n)`. Only touch short lines outside diagram blocks (≤ 6 words). For each word of ≥ 6 letters
       that is not in the page's text-layer words, replace it only when exactly one text-layer word is within edit distance ≤ 2 (case-preserving).
       Call it inside `postprocess_markdown` after the link strip. Keep `postprocess_markdown`'s 4-tuple return unchanged: convert.py:229, rescore_v2.py:81,
       run_patch.py:156 and tests/test_missing_box.py:122 unpack 4 values. Edit distance: a ~10-line Levenshtein in postprocess.py, no new dependency. Tests: "Guesestimate Index" → "Guesstimate Index" when the text layer has "Guesstimate";
       no change when 2 candidates are equally close; no change inside a block; no change on long lines.
    2. Find out why 58, 59, 60, 70, 72 and 73 get `block_in_table`: load their v3 markdown (read-only) and run `extract_blocks`. For each page, record
       whether the block is really inside a table cell or just next to a table (for example, a table row right after the summary line).
       If it is a false positive, fix the detector so that a fenced block on its own lines (blank line or heading before it) is not `in_table`. Add a test
       built from p58's layout. If a block really is inside a cell, leave the detection alone: those pages stay flagged.
    AVOID: fixing any word on a long content line, because a "close" word in a sentence is often a different, correct word.
    AVOID: lifting real in-cell JSON out of a table with a regex, because a wrong lift is worse than a flag.
  </action>
  <verify>cd backend/ingestion && venv/bin/python -m unittest tests.test_r2_fixes -v 2>&1 | tail -3 && venv/bin/python -m unittest discover -s tests 2>&1 | tail -2</verify>
  <done>The new tests pass and the full suite is OK (≥ 223 + the new tests). Each of the 6 in-table pages has a recorded cause (false positive fixed / real, still flagged).</done>
</task>

<task type="auto">
  <name>Dry check of the fixes on the real v3 pages (read-only)</name>
  <files>backend/ingestion/r2_fixcheck.py</files>
  <action>
    Write `r2_fixcheck.py`. It loads v3 pages from the DB (read-only), runs the new `postprocess_markdown` and `check_page` on each one, and prints
    the before → after for each evidence page: stray `)` after `Index` (10, 224); remaining `](` link syntax outside blocks or `placeholder` (fallback_v1 pages);
    `Guesestimate` (88, 97, 98, 101, 106, 116); `block_in_table` (58, 59, 60, 70, 72, 73). It also prints how many of the 248 pages have changed markdown, and **every** nav-typo replacement across all 248 pages (page, old → new) so a human can audit them;
    if there are more than 20 replacements, exit non-zero and investigate before plan 06. Write the results to `out/r2_fixcheck.json`
    (`{in_table: {page: "false_positive_fixed"|"real_still_flagged"}, typo_replacements: [...], changed_pages: [...]}`); plan 06 reads `in_table` from it.
    Add `--version` (default 3) so plan 06 can re-run it on v4.
    Exit code 0 only if every evidence page is clean (in-table pages that are real and stay flagged count as clean when listed as such).
  </action>
  <verify>cd backend/ingestion && venv/bin/python r2_fixcheck.py; echo "exit=$?"</verify>
  <done>exit=0. The output lists every evidence page as fixed (or, for a real in-table block, as still flagged) and the count of changed pages.</done>
</task>

## Must-Haves
- [ ] No "Index)" leftovers, no invented links/images on fallback pages, no "Guesestimate" after postprocess
- [ ] in_table cause known for all 6 pages; false positives fixed with a test
- [ ] Full test suite green; 0 Gemini calls; 0 DB writes

## Success Criteria
- [ ] Tests and `r2_fixcheck.py` pass; commit `fix(R2): ...`

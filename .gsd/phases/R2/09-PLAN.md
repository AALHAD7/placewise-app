---
phase: R2
plan: 09
wave: 6
gap_closure: true
depends_on: ["08"]
agent: ingestion-engineer
files_modified:
  - backend/ingestion/seqdiff.py                 (new)
  - backend/ingestion/textnorm.py
  - backend/ingestion/postprocess.py
  - backend/ingestion/fidelity.py
  - backend/ingestion/r2_gapcheck.py             (new, admin tool, read-only on the DB)
  - backend/ingestion/tests/test_seqdiff.py      (new)
  - backend/ingestion/tests/test_invented.py     (new)
  - backend/ingestion/tests/test_gapcheck.py     (new)
  - backend/ingestion/out/r2_gapcheck.json       (local, gitignored)
paid_calls: 0
---

# Plan R2.09: Gap closure, part 1: free deterministic fixes for small-word drift (pattern 1), invented text (pattern 4), and complete flags (patterns 2 and 3)

## Objective
The R2.07/08 sample failed the bar: 34/40 passed, there were 6 `missed` pages (135, 137, 143, 150, 183, 231), and one unflagged page (150) had a
`hallucinated` issue. Every missed page is the same pattern: small words dropped or changed in dialogue prose, or punctuation changed. The
bag-of-words `word_coverage` cannot see these. The unflagged hallucination is an invented table header.
This plan adds **free, deterministic** post-processing and checks. **It makes 0 Gemini calls and no prompt changes, and it writes nothing to the DB.**
1. **Pattern 1 (ordered diff):** align the markdown prose with the text layer word by word, including sentence punctuation. Repair small,
   well-anchored differences from the text layer. Flag every difference that cannot be repaired safely.
2. **Pattern 4 (invented text):** remove text that the page does not print: logo placeholders, leftover link brackets, block titles,
   italic or parenthetical captions, and empty table rows. Flag invented table headers and chart legends instead of editing them.
3. **Patterns 2 and 3 (flag completeness, no vision):** flag visual frameworks stored with no diagram block, and every tree or flow block
   that no human has checked.
Plan 10 carries these fixes into a v5 version. Plans 11 and 12 measure v5 on a fresh sample.

## Context
Read first: `CLAUDE.md`, `.claude/skills/casebook-ingestion/SKILL.md`, `.claude/skills/diagram-transcription/SKILL.md`,
`.claude/skills/grounded-answering/SKILL.md` (why invented text must not reach students), and the `log.md` entries R2.08, R2.07, R2.06.
Code: `backend/ingestion/postprocess.py` (`postprocess_markdown`, the order of the existing repairs), `fidelity.py` (`check_page`,
`coverage_text`, `word_coverage`), `textnorm.py` (`normalize_exact`, `fold_quotes`, `exact_token_set`, `label_exact_on_page`,
`_outside_blocks`, `strip_invented_links`), `diagram_schema.py` (`extract_blocks`, `KNOWN_TYPES`; `title` may be a string or null),
`run_v4.py` (how pages are carried), and `out/r2_sample_review.json` (the cited errors, under `pages[].mismatches`).

Facts you need:
- All `<verify>` commands run from the repo root `/Users/aalhad/Projects/Placement Website`. Python is `backend/ingestion/venv/bin/python`.
  Tests: `cd backend/ingestion && venv/bin/python -m unittest discover -s tests -t .` (295 pass today).
- Base data: v4 = doc `d1510e35-9ecc-419b-a497-85a37e062792`, 248 pages, all with a text layer, 152 needs_review. **Read-only in this plan.**
- **Calibration set (you may tune on these pages only):** every page in `out/r1_review.json`, `out/r1_review_v3.json`, `out/r2_sweep_a.json`,
  `out/r2_sweep_b.json`, `out/r2_sample.json` (121 pages in all).
  - Known pattern-1 bad pages: 129, 135, 137, 143, 150, 183, 203, 210, 231.
  - Known faithful pages from the R2 sample: 2, 3, 5, 38, 85, 120, 121, 200, 223, 237, 243, 244, 247.
- **Holdout (do not tune on):** the other 127 v4 pages. Plans 11 and 12 draw the fresh sample from them. You may print **counts** for
  the holdout, but do not read its diffs, repairs or markdown to adjust rules or thresholds. If a rule fails a gate, fix it using
  calibration pages only, and say so in your report.
- The orchestrator decided: logo placeholders such as "[FMS Logo]" and leftover link brackets such as "[Main Index]" are **defects**.
  Under the grounding policy, invented text must not reach students.
- **Repair from the text layer, not whole-page replacement.** Do not replace page prose with the raw text layer. The text layer has no
  headings, lists, tables or dialogue turn breaks. Its reading order is wrong on column stacks (p11), chevrons and callouts, and
  header, footer and nav lines are mixed into it. An anchored local repair gets the words right where the text layer is in the same local
  order, and the page is flagged everywhere else. All edits are written only to a new inactive version (plan 10). v4 stays as it is.
- Rules must be generic: no FMS-specific strings, page numbers or speaker names in the code. M2 runs them on other casebooks.

## Tasks

<task type="auto">
  <name>Pattern 1: ordered word-and-punctuation diff with anchored repair and a `seq_diff` flag</name>
  <files>
    backend/ingestion/seqdiff.py
    backend/ingestion/postprocess.py
    backend/ingestion/fidelity.py
    backend/ingestion/tests/test_seqdiff.py
  </files>
  <action>
    Build a pure module `seqdiff.py`:
    1. **Tokens.** Normalize with `normalize_exact` and `fold_quotes`, plus NFKC. Join hyphen line breaks. Tokens are words, keeping inner
       apostrophes ("I'm" is one token), and the punctuation marks `. ? ! , ; :`. Each markdown token records its char span in the original markdown.
    1b. **Boilerplate.** Header and footer lines (for example "© The Consulting Club, FMS Delhi 2023-24") are often missing from the
       markdown on purpose. Add a pure function `boilerplate_lines(text_layers) -> set`: the normalized text-layer lines that appear on 20% or
       more of a document's pages. Callers (`r2_gapcheck.py`, plan 10's `run_v5.py`, and later `pipeline.py`) compute it once per document.
       Pass it to the repair and to `check_page` as an optional `boilerplate=None` argument. Drop those lines from the text-layer tokens
       before aligning.
    2. **Prose only.** Take markdown tokens from prose lines outside diagram blocks (`_outside_blocks`). Skip these lines: headings, table rows,
       nav-bar lines (reuse `_NAV_BAR_RE`), `Diagram summary:` lines, and lines that contain `$`, a backslash or a link.
    3. **Align.** Run `difflib.SequenceMatcher(autojunk=False)` between the prose tokens and the full text-layer token list. A deletion
       (text-layer tokens with no markdown match) counts as **real** only if a **multiset deficit** confirms it: the word appears more times
       in the text layer than anywhere in `coverage_text(markdown)`. This filters out header, footer and diagram text that is only out of order.
       An insertion is real if the markdown has more of that token than the text layer.
    4. **Repair** an op (replace, insert or delete) only when all of these hold:
       - it changes at most `REPAIR_MAX_TOKENS = 4` tokens on each side;
       - it has at least `REPAIR_ANCHOR = 3` matched tokens directly before it and after it, on the same markdown line;
       - it touches no emphasis marker (`*`, `_`, `` ` ``) or bracket;
       - its text-layer side is not a whole text-layer line. A whole line lying between two anchors is a header, a callout or a footer
         from another part of the page, not a dropped word. Flag it instead of inserting it into the sentence.
       Replace the markdown char span with the text-layer substring, whitespace collapsed. Return a log of
       `(line_before, line_after)` pairs. After repair, re-run the diff.
    5. **Flag.** `check_page` adds the reason `seq_diff` when real ops remain on the repaired markdown: more than `SEQ_DIFF_MIN_TOKENS = 1` token
       in total, or any deletion of a whole text-layer line of 3 or more words (this catches dropped headings and tags, pattern 6). Store
       `seq_diff_ops` (a count) in the fidelity dict. Leave `word_coverage` as it is.
    6. Wire the repair into `postprocess_markdown` as the **last** step. Use an optional `seq_log=None` list, and keep the return tuple shape
       (existing callers unpack 4 values). Scanned pages and pages with no text layer are untouched.
    Tests (`test_seqdiff.py`) use synthetic strings modelled on the cited errors, and at least these cases:
    - "10% decline in the steel industry players" is repaired to "...in profits for the steel industry players" (2-token insertion, anchored);
    - "which I'm sure" restored; "might cause a hit" restored from "case a hit"; "regarding this?" becomes "regarding this.";
    - "library. Should" becomes "library Should";
    - text-layer header and footer lines out of order produce no op;
    - a 6-token difference is flagged, not repaired;
    - a difference next to `**bold**` is flagged, not repaired;
    - a diagram block and a table are never edited;
    - running the repair twice gives the same result;
    - a page with no text layer is returned unchanged;
    - a footer line placed mid-sentence in the text layer is not inserted. If it is in `boilerplate`, there is no op and no flag.
    AVOID: counting a word as dropped just because it is out of order. The multiset deficit is what keeps header and footer noise out, and R2.08's throwaway diff showed that noise is the main false-positive source.
    AVOID: editing table cells or block labels here. Their order in the text layer is not reliable. Tables are flagged by task 2's checks and the existing label check.
  </action>
  <verify>cd backend/ingestion && venv/bin/python -m unittest tests.test_seqdiff -v 2>&1 | tail -5 && venv/bin/python -m unittest discover -s tests -t . 2>&1 | tail -3</verify>
  <done>`test_seqdiff` passes with every listed case. The full suite is OK, with no existing test changed to make it pass.</done>
</task>

<task type="auto">
  <name>Pattern 4: strip invented placeholders, brackets, titles and captions; flag invented headers and legends (`invented_text`)</name>
  <files>
    backend/ingestion/textnorm.py
    backend/ingestion/postprocess.py
    backend/ingestion/fidelity.py
    backend/ingestion/tests/test_invented.py
  </files>
  <action>
    Add pure functions to `textnorm.py`, next to `strip_invented_links`, so they reuse `_outside_blocks` and `exact_token_set`.
    Do not create a new module. "On the page" means `label_exact_on_page(text, exact_token_set(text_layer))`, or, for multi-word text,
    that every token of 2 or more letters is in the text-layer token set. Work outside diagram blocks unless a step says otherwise.
    **Strip (deterministic, logged as before/after):**
    1. Logo and image placeholders: a bracketed span `[ ... ]` that is not followed by `(` and contains the word "logo", "image", "icon" or "photo",
       or is exactly `[Logo]`, when its inner text is not on the page. Delete the span. Delete the line if nothing else is left on it.
    2. Leftover link brackets: a `[X]` that is not followed by `(`, where X is on the page and the page does not print the brackets. Unwrap it to X.
       Never touch `[UNREADABLE]`, `[ ]`, `[x]`, `[X]` checkboxes, or a bracketed item the text layer prints with its brackets.
    3. Block titles: inside a diagram block, a `"title": "<s>"` whose s is not on the page becomes `"title": null`. Edit the string value only,
       so the rest of the JSON keeps its formatting.
    4. Caption lines: a whole line that is italic (`*...*`, `_..._`) or parenthetical (`(...)`, `*(...)*`), with fewer than
       `CAPTION_ON_PAGE_MIN = 0.6` of its tokens of 2 or more letters on the page. Delete the line.
    5. Empty table rows: a table body row whose cells are all empty or whitespace. Delete the row. Never delete the header or the separator row.
    **Flag only (reason `invented_text`):**
    6. A table header row where no cell's text is on the page. The p150 "Candidate | Interviewer" is the model case. Deleting the header would
       break the table, so flag it for review.
    7. Chart block strings that are not on the page: series names, legend entries and axis labels. Node and leaf labels already go through the
       existing label check; do not double-flag them.
    Wire the strips into `postprocess_markdown` **before** the seqdiff step, so the diff sees clean prose. Use an optional `invented_log=None`.
    Wire the flags into `check_page`.
    Tests (`test_invented.py`) need at least:
    - "[FMS Logo]" is removed when it is not printed and kept when it is;
    - "[Main Index]" is unwrapped;
    - "[UNREADABLE]" and checkboxes are untouched;
    - a printed title stays and an unprinted title becomes null, and the JSON still parses;
    - "*(Donut Chart visual representation)*" is removed and a printed italic line stays;
    - an empty table row is removed and the header is kept;
    - a "Candidate | Interviewer" header that is not printed raises `invented_text`;
    - running the step twice gives the same result.
    AVOID: stripping a bracketed or italic line the page does print. Every strip must check the text layer first, because deleting printed text is a `missing` defect.
  </action>
  <verify>cd backend/ingestion && venv/bin/python -m unittest tests.test_invented -v 2>&1 | tail -5 && venv/bin/python -m unittest discover -s tests -t . 2>&1 | tail -3</verify>
  <done>`test_invented` passes with every listed case, and the full suite is OK.</done>
</task>

<task type="auto">
  <name>Patterns 2 and 3 flags, plus `r2_gapcheck.py`: dry-run every new rule on v4 against pre-registered gates</name>
  <files>
    backend/ingestion/fidelity.py
    backend/ingestion/r2_gapcheck.py
    backend/ingestion/tests/test_gapcheck.py
    backend/ingestion/out/r2_gapcheck.json
  </files>
  <action>
    1. **`framework_as_text`** in `check_page`, behind a new `is_visual=None` keyword argument. Raise it when the page is visual, has 0 valid
       blocks, and has either a markdown table or 4 or more consecutive short lines (6 or fewer words each: bullets or headings) or arrow
       characters (`→ ➔ ⟶ >`) between short labels.
    2. **`structure_unreviewed`**, added by the gapcheck/carry caller and not by `check_page`: any page with an `issue_tree` or `flow` block
       (anything with children or edges) whose page_no is not in a human reviewed-pass set. The reviewed-pass set is the pages with verdict
       `pass` in `r1_review_v3.json`, `r2_sweep_a.json` or `r2_sweep_b.json`, plus the R2 sample pages with outcome `faithful`.
       Wrong parents run at about 49% on unreviewed trees (R2 sweep), and no free check can see them, so the page is held for a human.
       Put this logic in a pure function `structure_unreviewed(pages, reviewed_pass)` that plan 10 imports.
    3. **`r2_gapcheck.py`** (read-only, 0 Gemini calls). Load the v4 rows. For each page, run the new `postprocess_markdown` and `check_page`
       on the v4 markdown, using the cached label_lines the same way `run_v4.label_lines_for` does. Write `out/r2_gapcheck.json` with:
       per-page repairs, strips and new reasons; counts per reason; and the gate results below. Print a gate table and `GATES PASS` or
       `GATES FAIL: <list>`. It must exit non-zero when any gate fails.
    **Pre-registered gates (fixed now; do not change them after seeing results):**
    - G1: for each of the 6 missed pages, every cited error from `r2_sample_review.json` is either **repaired** or the page gets `seq_diff`.
      Check repairs by string, after quote-folding:
      - p137 contains "decline in profits for the steel industry players";
      - p150 contains "which I'm sure" and "might cause a hit";
      - p231 contains "What would the exit process" and "Do we have";
      - p143 contains "quality of the coal procured";
      - p135 contains "regarding this.";
      - p183 contains "library Should".
      p150 must also get `invented_text`. Pages 129, 203 and 210 must be repaired or get `seq_diff`. Target: 9/9.
    - G2: 0 repairs and 0 strips on the 13 known faithful R2 pages, except logo placeholders and link brackets (now defects).
      Also `seq_diff` must fire on at most 2 of those 13 pages.
    - G3: repair precision on calibration pages. Print every repair made on the 121 calibration pages. Check each one against the
      text layer and, where unsure, the page image (`diagram_preview.py ... --source db --version 4`). 0 repairs may make the text
      less faithful.
    - G4: `seq_diff` adds a flag to at most 40% of the 96 pages that are unflagged in v4 (counted over all 248 pages). Above that it is noise, so stop and fix it on calibration pages.
    - G5: logo placeholders that are not printed: 49 v4 pages before, 0 after. Leftover link brackets: 0 after. p23 title becomes null. The
      p77 italic captions are removed. No printed block title on a calibration page is changed.
    - G6: `framework_as_text` (or an existing flag) covers 15, 56, 67, 69, 71 and 228 (6/6). Print how many v4-unflagged pages it newly flags.
    - Report the count of `structure_unreviewed` pages, and how many of them are unflagged in v4 (no ceiling; this is the honest hold).
    Unit-test the gate arithmetic and `structure_unreviewed` with fixtures (`test_gapcheck.py`). No DB is needed in the tests.
  </action>
  <verify>cd backend/ingestion && venv/bin/python -m unittest discover -s tests -t . 2>&1 | tail -3 && venv/bin/python r2_gapcheck.py; echo "exit=$?"</verify>
  <done>The suite is OK. `r2_gapcheck.py` prints `GATES PASS` with exit=0, together with the G1–G6 table. `out/r2_gapcheck.json` exists. The
  report lists the G3 repairs that were checked, plus the counts of `seq_diff`, `invented_text`, `framework_as_text` and `structure_unreviewed`
  (all pages and holdout only), plus the projected v4→v5 needs_review count.</done>
</task>

## Must-Haves
- [ ] All 6 missed pages are repaired or flagged (G1). The p150 invented header is flagged.
- [ ] No change to correct text on known faithful pages (G2, G3). Logo and link-bracket defects are gone (G5).
- [ ] Rules were tuned on calibration pages only. Holdout pages appear only as counts.
- [ ] 0 Gemini calls and 0 DB writes.

## Success Criteria
- [ ] Every task's verify passes. The suite was at 295 tests; it now has those plus the new tests, all passing.
- [ ] The report says which gates passed on the first run, and what was changed (on calibration pages only) for any that did not.

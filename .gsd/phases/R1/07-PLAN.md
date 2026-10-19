---
phase: R1
plan: 07
wave: 5
depends_on: ["06"]
agent: ingestion-engineer
gap_closure: true
paid_calls: 0
---

# Plan R1.07: Stricter diagram checks + free deterministic fixes (gap closure)

## Objective
The R1.06 fidelity review failed all 3 issue-tree candidates, yet every failing page had diagram
label coverage 1.0 and `needs_review = false`. The checker cannot see punctuation or structure.
This plan makes the checker catch what the review caught, wherever a cheap, offline check exists.
It also adds two deterministic repairs that need no Gemini call: restoring curly quotes from the PDF
text layer, and stripping invented link targets. Finally it re-scores the stored v2 pages offline,
so plan 09 knows exactly which pages to re-convert. Zero paid calls. No DB writes.

The rule stays strict: labels must match the page **character for character**, punctuation
included. Do not loosen anything to make pages pass.

## Context
Read first:
- `CLAUDE.md`, `.claude/skills/casebook-ingestion/SKILL.md`, `.claude/skills/diagram-transcription/SKILL.md`
- `log.md`: the entries "R1 fidelity review … issue tree BLOCKED" and "R1.05: FMS re-pilot"
- `backend/ingestion/out/r1_review.json`: per-page mismatches (p11, p13, p14, p19, p52 fail; p10, p20 pass)
- `backend/ingestion/textnorm.py` (`normalize_label` strips all punctuation; keep it as the loose matcher)
- `backend/ingestion/diagram_schema.py` (`extract_blocks`, `validate_block`, `_validate_flow`,
  `_validate_issue_tree`, `check_diagrams`, `_label_on_page`)
- `backend/ingestion/fidelity.py` (`check_page`, `_DIAGRAM_REASON`, `_DIAGRAM_WARN_REASON`)
- `backend/ingestion/convert.py` (`collapse_multiline_labels_with_lines` shows how a post-pass is applied before `check_page`)

Facts you need:
- All `<verify>` commands run from the repo root (`/Users/aalhad/Projects/Placement Website`).
- The v2 page outputs are cached locally in `backend/ingestion/out/r1_pages_v2.jsonl` (235 converted
  pages, with `markdown` and `label_lines`). v1 pages, including `text_layer`, are in
  `backend/ingestion/pilot_output.json` → `results[0].pages_full`. The 13 pages reused from v1 are
  not in the jsonl; their markdown is the v1 markdown. Together these let you re-score all 248 pages offline.
- Known ground truth from the review (use these as fixtures, copied from the jsonl into
  `tests/fixtures/r1_gap/p<N>.json` = `{page_no, text_layer, markdown, label_lines}`):
  p14: page prints `4P’s and 7P’s` (U+2019), block has `4P's and 7P's`. p13: `Other C’s` → `Other C's`.
  p19: 7 chevron stages with 0 stage-to-stage edges. p11: "Crack the interview" stored as the 3rd child of
  "Prepare for the interview process", while on the page both columns converge into it.
  p10/p20/p52: markdown has `[Main Index](javascript:history.back())`, `(main_index)`, `(#)`.
  12 pages put a ```placewise-diagram fence inside a Markdown table row: 58, 59, 60, 63, 65, 67, 69, 72,
  73, 74, 77, 79. p10 and p20 passed the review, so they must stay free of new structure warnings.
- New review reasons go into `review_reasons` (text[]). There is no migration in this plan.

## Tasks

<task type="auto">
  <name>Exact-label check and curly-quote restore from the text layer</name>
  <files>
    backend/ingestion/textnorm.py
    backend/ingestion/diagram_schema.py
    backend/ingestion/fidelity.py
    backend/ingestion/convert.py
    backend/ingestion/tests/test_label_exact.py
    backend/ingestion/tests/fixtures/r1_gap/
  </files>
  <action>
    1. textnorm.py: add `normalize_exact(text)`: NFC (not NFKC, which can fold characters), join a hyphenated
       line break exactly as `_HYPHEN_BREAK_RE` does, and collapse whitespace. Keep case and ALL punctuation.
       Add `QUOTE_MAP` for ' ’ ‘ " “ ” ′ ″ and `fold_quotes(text)` which maps all of them to ASCII.
    2. diagram_schema.py: for every label that passes the existing loose `_label_on_page`, also test the exact
       match token by token: split `normalize_exact(label)` on whitespace; every token must occur as an exact
       whitespace-delimited token of `normalize_exact(text_layer)` (case and punctuation kept). Token-level, not
       substring, so a label whose parts are printed apart on the slide (e.g. a circled "V" next to "Valuable")
       still matches, while `4P's` against a printed `4P’s` does not. One allowance only: a text-layer token
       may carry extra leading/trailing bullet or list punctuation (`• ▪ – - : ; , . ( )`) that the label omits,
       because a label is the box text without its bullet or trailing colon. Characters inside a token are never relaxed. If the loose match passes and the exact match fails, add issue
       `label_altered` (severity `error`, detail = label). It counts as found for `diagram_label_coverage`
       (coverage stays a measure of presence). Add a second ratio `diagram_label_exact`
       (exact matches / labels checked) to the returned dict, but do not add a DB column: store it
       inside the page's result dict only (plan 09's report reads it from there).
    3. Add `restore_quotes(markdown, text_layer) -> (markdown, n_fixed)`: for each block label (and the block
       `title`) whose exact match fails but whose `fold_quotes` tokens all match `fold_quotes` text-layer tokens,
       replace each such token with the text-layer token (so `4P's` becomes `4P’s`). Re-serialise the block with
       `json.dumps(obj, ensure_ascii=False, indent=2)`. Apply the same restore to Markdown lines outside blocks
       (headings and bullets), using the text-layer line as the source. Change nothing else. Only quote
       characters may change.
    4. convert.py: call `restore_quotes` right after `collapse_multiline_labels_with_lines` and before
       `check_page`, both on the first attempt and on retries. Record `quotes_restored` in the page result.
    5. fidelity.py: map `label_altered` to review reason `diagram_label_altered`.
    6. Tests: p14 and p13 fixtures → before the restore, `label_altered` fires; after the restore, 0 `label_altered`,
       the title is `4P’s and 7P’s` and the markdown outside the block is unchanged except quotes. A synthetic label
       `Cost-Benefit` vs a page `Cost Benefit` → `label_altered` (a hyphen is punctuation; it is not restorable, so it stays flagged).
       The p20 fixture → 0 `label_altered`.

    AVOID: changing `normalize_label`, which the loose coverage and number checks rely on.
    AVOID: "fixing" any character other than quotes/primes in restore_quotes. Anything else stays flagged for
    re-conversion or review, because the rule is character for character.
  </action>
  <verify>
    cd backend/ingestion && venv/bin/python -m unittest tests.test_label_exact -v && venv/bin/python -m unittest discover -s tests
  </verify>
  <done>
    test_label_exact passes (p14/p13 restored to U+2019, synthetic hyphen case flagged, p20 clean) and the full
    suite stays green (it had 154 tests before this plan).
  </done>
</task>

<task type="auto">
  <name>Cheap structure checks: blocks in tables, disconnected flows, converging trees</name>
  <files>
    backend/ingestion/diagram_schema.py
    backend/ingestion/fidelity.py
    backend/ingestion/convert.py
    backend/ingestion/tests/test_structure_checks.py
  </files>
  <action>
    Add these checks to `check_diagrams` / the validators. Each one has a fixture test.
    1. `block_in_table` (error → reason `diagram_in_table`): a line that contains a ```placewise-diagram
       fence opener but does not start with it (e.g. it starts with `|`, or the fence comes after cell text),
       or a block whose opening fence sits between two Markdown table rows. Also make `extract_blocks` report
       these fences as blocks with `parse_error = "block inside table cell"`, so `diagram_count` counts them
       and `diagrams` excludes them. Fixtures: p77 and p58 → flagged; p10 → not.
    2. `flow_disconnected` (warn → reason `diagram_structure`): a flow whose edges form more than one weakly
       connected component, with every node counted. p19 → flagged (7 components). p10 and the p52 VRIO flow → not.
    3. `tree_duplicate_label` (warn → `diagram_structure`): the same `normalize_exact` label on two or more
       nodes of one issue_tree. Labels of 1–2 characters and the literal values "Yes", "No" and "Others" don't count. This is the
       "two parents" signal: the model often repeats a converging node under each parent.
    4. `tree_convergence_suspect` (warn → `diagram_structure`): in an issue_tree, a depth-1 **leaf** child whose
       label's first position in the text layer comes AFTER the text-layer positions of every descendant of all
       its siblings, while at least 2 of those siblings have children. p11 must be flagged. Then measure this
       check on all 248 pages (task 3). If it flags more than 15 pages, or flags p14, p20 or p32, remove it,
       and record "convergence heuristic dropped: N false positives" in the task-3 output. In that case
       the prompt rule from plan 08 and the reviewer are the only defence for converging trees.
    5. Add `flow_disconnected`, `tree_duplicate_label` and `tree_convergence_suspect` to
       `convert.RETRY_WARN_CODES`, and give each one a fix hint in `diagram_fix_hints`:
       - disconnected: "block N: the flow has separate pieces; add an edge for every arrow or chevron between stages, in order"
       - duplicate / convergence: "block N: '<label>' is reached from more than one box (lines converge);
         use a flow with one node per box and an edge from each parent, not an issue_tree"
       - block_in_table: "never put a diagram block inside a table cell; close the table, then write the block on its own lines"

    AVOID: page-geometry/vector-line analysis (PyMuPDF drawings). It is not cheap, and PyMuPDF is AGPL.
  </action>
  <verify>
    cd backend/ingestion && venv/bin/python -m unittest tests.test_structure_checks -v && venv/bin/python -m unittest discover -s tests
  </verify>
  <done>
    p77/p58 → block_in_table; p19 → flow_disconnected; p11 → tree_convergence_suspect (or, if dropped, the test is
    marked skipped with the reason); p10, p14 and p20 have no new structure issue; the full suite is green.
  </done>
</task>

<task type="auto">
  <name>Strip invented links, then re-score all 248 v2 pages offline</name>
  <files>
    backend/ingestion/textnorm.py
    backend/ingestion/convert.py
    backend/ingestion/rescore_v2.py
    backend/ingestion/tests/test_strip_links.py
  </files>
  <action>
    1. textnorm.py: `strip_invented_links(markdown, text_layer) -> (markdown, n)`. A Markdown link `[text](target)`
       outside blocks becomes plain `text` when the target starts with `javascript:` or `#`, or has no
       scheme and no dot (e.g. `main_index`), or is any URL that does not appear in the text layer. Image links
       `![..](..)` follow the same rule. Real URLs that are printed on the page stay.
       Call it in convert.py next to `restore_quotes` and record `links_stripped`.
       Tests: the p10/p20/p52 forms → plain "Main Index"; `[site](https://x.com)` stays only if `https://x.com`
       is in the text layer.
    2. New `rescore_v2.py` (offline, no Gemini and no DB). For all 248 pages (v2 jsonl + the 13 v1-reused pages from
       pilot_output.json), apply `collapse_multiline_labels_with_lines` (the stored `label_lines`), `restore_quotes`
       and `strip_invented_links`, then run the new `check_page`. Also re-score the v1 markdown with the same checker.
       Write `out/r1_v2_rescore.json`:
       `{pages: [{page_no, v1: {nc, wc}, v2_post: {nc, wc, label_cov, label_exact, reasons, quotes_restored, links_stripped}}],
         flagged_new: {reason: [pages]}, coverage_below_v1: [pages], quotes_fixed_pages: [...], links_fixed_pages: [...],
         convergence_heuristic: "kept" | "dropped: N false positives"}`.
       If `label_altered` remains on more than 40 pages after the restore, list the 10 most common altered tokens
       in the output (`altered_tokens_top10`) so a false-positive pattern can be fixed in this plan, not waived.
       `coverage_below_v1` = pages where the v2_post number_coverage or word_coverage is lower than v1's (diff > 1e-9).
  </action>
  <verify>
    cd backend/ingestion && venv/bin/python -m unittest discover -s tests && venv/bin/python rescore_v2.py && venv/bin/python -c "import json;r=json.load(open('out/r1_v2_rescore.json'));f=r['flagged_new'];print({k:len(v) for k,v in f.items()});print('in_table',sorted(f.get('diagram_in_table',[])));print('structure',sorted(f.get('diagram_structure',[])));print('below_v1',len(r['coverage_below_v1']));print('quotes',r['quotes_fixed_pages'][:20]);print('heuristic',r['convergence_heuristic'])"
  </verify>
  <done>
    The output shows diagram_in_table ⊇ {58, 59, 60, 63, 65, 67, 69, 72, 73, 74, 77, 79}; diagram_structure contains 19
    (and 11, unless the heuristic was dropped); 13 and 14 appear in quotes_fixed_pages; the p10/p20/p52 links are stripped. The script
    made 0 Gemini calls and 0 DB calls (it imports neither gemini_client nor supabase). Paste the printed summary into the plan 09 log entry.
  </done>
</task>

## Must-Haves
- [ ] An apostrophe change fails the check (strict rule kept) and is repaired from the text layer when it is only a quote style
- [ ] Blocks inside table cells, disconnected flows and repeated/converging tree nodes raise review reasons
- [ ] Invented "Main Index" links are stripped before anything is stored
- [ ] `out/r1_v2_rescore.json` exists. It lists the newly flagged pages for plan 09.

## Success Criteria
- [ ] All tests green; 0 paid calls; 0 DB writes

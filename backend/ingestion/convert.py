"""Step 4: conversion. Docling first for the whole PDF (text/table pages),
then Gemini vision for visual/scanned pages and any page that failed its
fidelity check (automatic retry)."""
import hashlib
import json
import re
from pathlib import Path

import pypdfium2 as pdfium
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions, OcrMacOptions
from docling_core.types.doc import TableItem

from config import (PROMPT_VERSION, RENDER_DPI, VISION_MAX_CALLS_PER_PAGE, VISION_MAX_TOKENS,
                    VISION_RETRY_ON_DIAGRAM_FAIL)
from diagram_schema import FENCE_INFO, extract_blocks, has_bullet_lines  # noqa: F401
from textnorm import normalize_label  # noqa: F401
from page_classify import classify_page, render_page_png
from fidelity import check_page
from seqdiff import boilerplate_lines
from gemini_client import BudgetExceeded, VisionCallError, transcribe_page

# Vision prompt (PROMPT_VERSION in config.py; r1-diagrams-v2 adds the R1.08
# rules: exact quotes, no links, chevron edges, convergence -> flow, circled
# letters in labels, no blocks in tables, literal summaries; r1-diagrams-v3
# (R1.09 fix round) adds: every box incl. the converging one is a node
# (Example 3), and never estimate chart values). Built from the
# diagram-transcription skill. {page_no} is substituted with str.replace, not
# str.format, because the JSON examples contain braces.
VISION_PROMPT = """Transcribe EVERYTHING on this page of a business-school placement casebook, exactly.
This is PDF page {page_no}; set "source_page" to {page_no} in every diagram block.

TEXT
- Transcribe ALL text on the page as Markdown in the reading order a human would use: the title, every
  sentence, caption, note and callout box (e.g. "Best suitable for ..."), and the footer line with its page number.
  Diagram blocks never replace this text: anything printed outside a diagram must still appear as normal Markdown.
- Tables become Markdown tables. Only if a table has merged cells, use a "table" diagram block instead.
- Copy every word, number, unit and symbol exactly as printed. Do not summarise, interpret, correct, complete or add anything.
- Copy apostrophes and quotes exactly as printed: ’ is not ', “ is not ".
- Never create Markdown links. Write navigation text such as Main Index as plain text.
- If any text is unreadable, write [UNREADABLE] in its place.

DIAGRAMS
For EVERY diagram on the page (issue tree, mind map, 2x2 or grid matrix, funnel, process, value chain,
cycle, decision tree, bar/line/pie chart) output exactly one fenced block, opened with ```placewise-diagram
and closed with ```, containing ONE valid JSON object (double quotes, no comments, no trailing commas).
On the line right after the closing fence write:
Diagram summary: <1-3 plain sentences saying what the diagram shows>
The Diagram summary only restates what is printed. Do not add outcomes, judgements or branches (for example 'No' paths) that the page does not show.
Do NOT also repeat the diagram as bullet points or a list. Text on the page that is not part of a diagram stays normal Markdown.

Every block has: "type", "title" (string or null), "source_page" ({page_no}), "notes" (list of footnotes/captions exactly as printed, [] if none).
Types and their extra fields:
- issue_tree: "root": {"label": "...", "children": [ {"label": "...", "children": [...]} ]}  (hierarchies, MECE breakdowns, mind maps; every node has label and children, leaves have "children": []).
  Also use issue_tree when boxes or lists are grouped under headings with no arrows between them (heading = parent, items = children).
  If lines from two or more boxes join into one box (they converge), the diagram is a flow, not an issue_tree: one node per box, an edge from each box that feeds it. Never repeat a box under two parents.
- matrix: "xAxis", "yAxis" (string or null), "cols": [...], "rows": [...], "cells": [[...], ...]  (one inner list per row, one entry per column)
- funnel: "stages": [...]  (ordered, widest first)
- flow: "nodes": [{"id": "a", "label": "..."}], "edges": [{"from": "a", "to": "b", "label": null}]  (processes, value chains, cycles; decision trees with Yes/No branches are a flow with "Yes"/"No" edge labels). A flow must have an edge for every arrow or connector; never output a flow with no edges.
  Chevrons, arrow shapes and boxes placed in a row are a sequence: add an edge from each stage to the next, in reading order, as well as any edges to items under a stage.
- chart: "chart_kind": "bar" | "line" | "pie", "xLabel", "yLabel", "series": [{"name": "...", "points": [["x", 12.5], ...]}]  (only values printed on the page; if no values are printed use "points": [])
  Chart values: use ONLY numbers printed on the page as text (data labels, values written on or next to a bar, point or slice).
  NEVER estimate a value from a bar's height, a line's position, a slice's size or the axis gridlines. If a bar, point or slice
  has no printed number, use null for its value (["2021", null]). An estimated number is an error even if it looks close.
- table: "header": [...], "rows": [[...], ...]  (only for tables with merged cells)
- other: "description": "...", "labels": [...]  (only when the diagram fits none of the types above)

Example 1 (2x2 matrix):
```placewise-diagram
{"type": "matrix", "title": "Ansoff Matrix", "source_page": {page_no}, "notes": [], "xAxis": "Product", "yAxis": "Market", "cols": ["Existing", "New"], "rows": ["Existing", "New"], "cells": [["Market Penetration", "Product Development"], ["Market Development", "Diversification"]]}
```
Diagram summary: A 2x2 grid of growth strategies by product (existing or new) and market (existing or new).

Example 2 (issue tree):
```placewise-diagram
{"type": "issue_tree", "title": "Profit Tree", "source_page": {page_no}, "notes": [], "root": {"label": "Profit", "children": [{"label": "Revenue", "children": [{"label": "Price", "children": []}, {"label": "Volume", "children": []}]}, {"label": "Cost", "children": [{"label": "Fixed", "children": []}, {"label": "Variable", "children": []}]}]}}
```
Diagram summary: Profit splits into revenue (price and volume) and cost (fixed and variable).

Example 3 (lines from two columns join into one final box, so it is a flow and the final box is a node):
```placewise-diagram
{"type": "flow", "title": null, "source_page": {page_no}, "notes": [], "nodes": [{"id": "a", "label": "Plan"}, {"id": "b", "label": "Build skills"}, {"id": "c", "label": "Build network"}, {"id": "d", "label": "Get the offer"}], "edges": [{"from": "a", "to": "b", "label": null}, {"from": "a", "to": "c", "label": null}, {"from": "b", "to": "d", "label": null}, {"from": "c", "to": "d", "label": null}]}
```
Diagram summary: Plan leads to building skills and building a network, and both lead to getting the offer.

RULES FOR BLOCKS
- Every label, number and unit inside a block must be copied exactly as printed on the page. Never invent, rename, merge, correct or complete a label.
- Every box, node or list item that belongs to the diagram is its own node (a tree child, a flow node or a cell). Never move child boxes or list items into "notes"; "notes" are only footnotes and captions.
- Every box in a diagram is a node in its block, including the box that lines or arrows converge into (often the last box, e.g. a final goal). Never write a diagram box as plain text outside the block. If a box has two parents (lines from two boxes reach it), use a flow (Example 3).
- Keep each label on one line: replace line breaks inside a label with a space ("Short-Term Competitive Disadvantage", not "Short-Term\\nCompetitive\\nDisadvantage").
- Unreadable text inside a block becomes "[UNREADABLE]".
- A page with two diagrams gets two blocks.
- Letters or numbers printed in circles or badges (e.g. V, R, I, O; step numbers 1, 2, 3) are printed text: put them in the node label, before the word they mark, separated by a space, in the order printed (e.g. "V Valuable"). Never put printed text only in an id; ids are short letters (a, b, c).
- A diagram block is never inside a table cell. If a page has a table and a diagram, close the table first, then write the block on its own lines.
- Logos, page headers/footers, navigation buttons (e.g. "Main Index") and decorative icons are not diagrams;
  transcribe their text as normal Markdown.
- Read axes, rows, columns and cell positions from THIS page, not from the examples above.

Output Markdown only."""
VISION_PROMPT_V2 = VISION_PROMPT  # old name, kept for existing imports


def _text_layer_hint(text_layer: str) -> str:
    if not (text_layer or "").strip():
        return ""
    return ("\n\nPage's raw text layer (may be incomplete/misordered, for reference only; "
            "use it to check spelling of labels):\n" + text_layer[:1500])


def build_vision_prompt(page_no: int, text_layer: str, fix_hints=None) -> str:
    prompt = VISION_PROMPT.replace("{page_no}", str(page_no)) + _text_layer_hint(text_layer)
    if fix_hints:
        prompt += ("\n\nA previous transcription of this page had these problems. Fix these problems "
                   "(never invent text to fix them; if something is truly not on the page, leave it out "
                   "or use [UNREADABLE]):\n" + "\n".join(f"- {h}" for h in fix_hints))
    return prompt


MAX_FIX_HINTS = 15
# Warn codes that indicate lost structure: they trigger the one retry and
# count against the score like errors, but are not schema errors.
# label_multiline is not retried: collapse_multiline_labels fixes it without a second paid call.
RETRY_WARN_CODES = {"notes_flattened", "flow_no_edges", "label_flattened",
                    "flow_disconnected", "tree_duplicate_label", "tree_convergence_suspect",
                    "missing_box"}


def _retry_warns(fid: dict) -> int:
    return sum(1 for it in fid.get("diagram_issues") or []
               if it.get("severity") == "warn" and it.get("code") in RETRY_WARN_CODES)


def diagram_fix_hints(fid: dict, truncated: bool, page_no: int) -> list:
    """Turns diagram_issues (+ truncation) into short, targeted instructions
    for the retry prompt. Max MAX_FIX_HINTS lines."""
    hints = []
    if truncated:
        hints.append("output was cut off; be concise in summaries and do not repeat diagrams as text")
    for it in fid.get("diagram_issues") or []:
        if it.get("severity") != "error" and it.get("code") not in RETRY_WARN_CODES:
            continue
        b = (it.get("block") or 0) + 1
        code, detail = it.get("code"), it.get("detail", "")
        if code == "label_not_on_page":
            h = f'label "{detail}" not found on page; copy it exactly as printed'
        elif code == "number_not_on_page":
            h = (f"block {b}: number {detail} is not printed on the page; copy numbers exactly as printed and never "
                 "estimate a value from a bar height or slice size (use null when no number is printed)")
        elif code == "invalid_json":
            h = f"block {b}: invalid JSON ({detail[:120]}); use double quotes, no comments, no trailing commas"
        elif code == "missing_summary":
            h = f"block {b}: missing Diagram summary line right after the closing fence"
        elif code == "wrong_fence":
            h = f"block {b}: open the block with ```placewise-diagram, not a plain or json fence"
        elif code == "source_page_mismatch":
            h = f"block {b}: set source_page to {page_no}"
        elif code == "type_other":
            h = f"block {b}: type \"other\"; use issue_tree, matrix, funnel, flow, chart or table if the diagram fits one"
        elif code == "notes_flattened":
            h = (f"block {b}: these boxes were put in notes instead of being nodes: {detail[:300]}; "
                 "make each one its own child node under the box it hangs from")
        elif code == "flow_no_edges":
            h = (f"block {b}: flow has no edges; if the boxes are grouped under headings with no arrows, "
                 "use an issue_tree (heading = parent, items = children), otherwise add an edge per arrow")
        elif code in ("label_multiline", "label_flattened"):
            h = (f"block {b}: keep each label on one line; list items under a box are separate child nodes "
                 f"({detail[:200]})")
        elif code == "flow_disconnected":
            h = (f"block {b}: the flow has separate pieces; add an edge for every arrow or chevron "
                 "between stages, in order")
        elif code in ("tree_duplicate_label", "tree_convergence_suspect"):
            h = (f"block {b}: '{detail}' is reached from more than one box (lines converge); use a flow "
                 "with one node per box and an edge from each parent, not an issue_tree")
        elif code == "missing_box":
            h = (f'the box "{detail}" is printed in the diagram but is not a node in any block; add it as '
                 "a node with its edges (if lines from several boxes join into it, make the block a flow)")
        elif code == "block_in_table":
            h = ("never put a diagram block inside a table cell; close the table, then write the block "
                 "on its own lines")
        elif code == "label_altered":
            h = (f'label "{detail}" differs from the page in punctuation, apostrophes or case; '
                 "copy it character for character as printed")
        elif code == "unreadable":
            h = f"block {b}: has [UNREADABLE] values; re-read those labels carefully (keep [UNREADABLE] only if truly unreadable)"
        else:
            h = f"block {b}: {code}: {detail}"
        if h not in hints:
            hints.append(h)
        if len(hints) >= MAX_FIX_HINTS:
            break
    return hints[:MAX_FIX_HINTS]


def _penalty_blocks(fid: dict) -> int:
    """Distinct diagram blocks (by `block` index) carrying at least one error
    or one structure-losing warn code (RETRY_WARN_CODES) - the real unit of
    damage for scoring. One mis-treed block (e.g. a bulleted section the
    model turned into an issue_tree with the wrong shape) can throw off
    several individual issues at once (a duplicate label, a missing box, a
    couple of altered labels...), and the old flat `-0.5 per issue` penalty
    double-counted all of them as if they were independent page-wide
    problems. On a page where that one bad block sits next to otherwise
    much-better coverage (R6, ISB p177: Docling drops a footer line, vision
    gets everything including the footer but mis-trees an unrelated
    Porter's-5-forces block), the flat penalty let a handful of issues in
    ONE block wipe out a real, page-wide coverage win. Counting damage per
    block instead still fully penalizes a page where every block is bad
    (each contributes its own 0.5), but no longer piles additional penalty
    onto a block that already triggered one."""
    blocks = set()
    for it in fid.get("diagram_issues") or []:
        if it.get("severity") == "error" or it.get("code") in RETRY_WARN_CODES:
            blocks.add(it.get("block"))
    return len(blocks)


def _score(fid: dict, truncated: bool) -> float:
    """number_coverage + word_coverage + label_coverage (1 when no labels were
    checked) - 0.5 per diagram BLOCK carrying an error or structural warning
    (not per individual issue - see _penalty_blocks) - 1 if truncated."""
    cov = fid.get("diagram_label_coverage")
    return ((fid.get("number_coverage") or 0) + (fid.get("word_coverage") or 0)
            + (1.0 if cov is None else cov)
            - 0.5 * _penalty_blocks(fid)
            - (1.0 if truncated else 0.0))


# The free deterministic post-pass lives in postprocess.py (no Gemini/Docling
# imports, so offline tools such as rescore_v2.py can use it); re-exported here.
from postprocess import (collapse_multiline_labels, collapse_multiline_labels_with_lines,  # noqa: E402,F401
                         postprocess_markdown)


def _vision_attempt(png, prompt, page_no, text_layer, is_scanned, call_log, reason, attempt, max_http,
                    boilerplate=None):
    """One page attempt (it may use more than one HTTP request when the model
    cascade kicks in; every request is logged by transcribe_page). Raises
    BudgetExceeded when the run cap is hit."""
    truncated = False
    model = None
    http_calls = 0
    ctx = {"page": page_no, "reason": reason, "attempt": attempt}
    before = len(call_log)
    try:
        md, meta = transcribe_page(png, prompt, max_tokens=VISION_MAX_TOKENS, return_meta=True,
                                   max_http=max_http, call_log=call_log, log_ctx=ctx)
        truncated = (meta or {}).get("finish_reason") == "MAX_TOKENS"
        model = (meta or {}).get("model")
    except VisionCallError as e:
        md = f"[UNREADABLE] (vision call failed: {e})"
        if len(call_log) > before:
            call_log[-1]["error"] = str(e)[:200]
    http_calls = len(call_log) - before
    md, label_lines, n_quotes, n_links = postprocess_markdown(md, text_layer, boilerplate=boilerplate)
    fid = check_page(text_layer, md, is_scanned, page_no, label_lines=label_lines, boilerplate=boilerplate)
    fid["label_lines"] = label_lines
    fid["quotes_restored"] = n_quotes
    fid["links_stripped"] = n_links
    if truncated:
        fid["needs_review"] = True
        if "truncated" not in fid["review_reasons"]:
            fid["review_reasons"].append("truncated")
    return md, fid, truncated, model, http_calls


def convert_page_vision(png: bytes, page_no: int, text_layer: str, is_scanned: bool,
                        call_log: list, reason: str, boilerplate=None) -> dict:
    """Vision-convert one page with VISION_PROMPT.

    Hard cap: VISION_MAX_CALLS_PER_PAGE HTTP requests for the page, counted at
    the HTTP level (a model-cascade hop counts). One retry (with targeted fix
    hints) only when the diagram blocks fail validation, show lost structure
    (RETRY_WARN_CODES) or the output was truncated, and only if budget is
    left. Keeps the better-scoring attempt (a tie keeps attempt 1). Never
    escalates the model. After the final attempt, multi-line labels without
    list markers are collapsed to one line and the page is re-checked.
    Raises BudgetExceeded if the run-level cap (set_vision_cap) is hit before
    the first attempt; a cap hit on the retry keeps attempt 1. `boilerplate` =
    seqdiff.boilerplate_lines of the whole document (R2.09; None = per-page only)."""
    budget = VISION_MAX_CALLS_PER_PAGE
    log_start = len(call_log)
    prompt = build_vision_prompt(page_no, text_layer)
    md, fid, truncated, model, used = _vision_attempt(png, prompt, page_no, text_layer, is_scanned,
                                                      call_log, reason, 1, budget, boilerplate)
    attempts, http_calls, retry_skipped = 1, used, None
    failed_call = md.startswith("[UNREADABLE] (vision call failed")
    wants_retry = (VISION_RETRY_ON_DIAGRAM_FAIL and not failed_call
                   and (fid.get("diagram_errors") or truncated or _retry_warns(fid)))
    if wants_retry and budget - used < 1:
        retry_skipped = "page_budget"
    elif wants_retry:
        hints = diagram_fix_hints(fid, truncated, page_no)
        prompt2 = build_vision_prompt(page_no, text_layer, hints)
        try:
            md2, fid2, trunc2, model2, used2 = _vision_attempt(
                png, prompt2, page_no, text_layer, is_scanned, call_log,
                reason + "+diagram_retry", 2, budget - used, boilerplate)
            attempts, http_calls = 2, used + used2
            if _score(fid2, trunc2) > _score(fid, truncated):
                md, fid, truncated, model = md2, fid2, trunc2, model2
        except BudgetExceeded:
            retry_skipped = "run_cap"
            http_calls = len(call_log) - log_start

    # Every attempt is already post-processed (collapse, quotes, links) and
    # checked in _vision_attempt; label_lines etc. travel inside fid.
    return {
        "markdown": md,
        "method": "gemini_vision_v2",
        "prompt_version": PROMPT_VERSION,
        "attempts": attempts,
        "http_calls": http_calls,
        "retry_skipped": retry_skipped,
        "truncated": truncated,
        "vision_model": model,
        # fid carries label_lines (collapsed label -> original lines; pass to
        # check_page when re-checking), quotes_restored and links_stripped.
        **fid,
    }


IMAGE_PLACEHOLDER_RE = re.compile(r"<!--\s*🖼️❌.*?-->\s*\n?")


def _strip_docling_placeholders(md: str) -> str:
    """Docling leaves a literal HTML-comment placeholder in its Markdown for
    any picture it detected but wasn't configured to describe - confirmed
    live on a page with a decorative icon. Left in place this is junk text
    polluting chunk content, not real page content - strip it. (A page
    whose main content IS a meaningful image is routed to Gemini vision
    instead, per the is_visual classification, so this only strips
    placeholders from pages that were otherwise correctly handled by
    Docling.)"""
    return IMAGE_PLACEHOLDER_RE.sub("", md or "")


def _docling_converter() -> DocumentConverter:
    opts = PdfPipelineOptions()
    opts.ocr_options = OcrMacOptions()
    opts.do_table_structure = True
    return DocumentConverter(format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=opts)})


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def docling_markdown_per_page(docling_result) -> dict:
    """Maps Docling's document output back to page numbers. Returns
    {page_no: markdown_for_that_page}."""
    doc = docling_result.document
    per_page = {}
    for item, _level in doc.iterate_items():
        prov = getattr(item, "prov", None)
        if not prov:
            continue
        page_no = prov[0].page_no
        try:
            md = item.export_to_markdown(doc=doc)
        except Exception:
            md = getattr(item, "text", "") or ""
        if md:
            per_page.setdefault(page_no, []).append(md)
    return {p: "\n\n".join(parts) for p, parts in per_page.items()}


def docling_tables_per_page(docling_result) -> set:
    doc = docling_result.document
    pages_with_tables = set()
    for item, _level in doc.iterate_items():
        if isinstance(item, TableItem):
            prov = getattr(item, "prov", None)
            if prov:
                pages_with_tables.add(prov[0].page_no)
    return pages_with_tables


def convert_document(pdf_path: Path, call_log: list) -> dict:
    """Runs the full Step 3 + Step 4 + Step 5 pipeline for one PDF. Returns
    a dict with page_count, sha256, and a list of per-page result dicts."""
    pdf = pdfium.PdfDocument(str(pdf_path))
    page_count = len(pdf)

    docling_result = _docling_converter().convert(str(pdf_path))
    docling_pages = docling_markdown_per_page(docling_result)
    docling_table_pages = docling_tables_per_page(docling_result)

    # R2.09: classify every page first, so the document's running header/footer lines
    # (seqdiff.boilerplate_lines) are known before any page is post-processed and checked.
    classes = [classify_page(pdf[i], docling_has_table=(i + 1 in docling_table_pages)) for i in range(page_count)]
    boilerplate = boilerplate_lines([c["text_layer"] or "" for c in classes])

    pages_out = []
    for i in range(page_count):
        page_no = i + 1
        page = pdf[i]
        cls = classes[i]
        docling_md = _strip_docling_placeholders(docling_pages.get(page_no, ""))

        if cls["is_table"] or (cls["is_text"] and not cls["is_visual"]):
            markdown = docling_md
            method = "docling"
            fid = check_page(cls["text_layer"], markdown, cls["is_scanned"], page_no, boilerplate=boilerplate)
            extra = {"prompt_version": None, "attempts": 0}
        else:
            png = render_page_png(page, RENDER_DPI)
            v = convert_page_vision(png, page_no, cls["text_layer"], cls["is_scanned"],
                                    call_log, "visual_or_scanned", boilerplate)
            markdown, method = v.pop("markdown"), v.pop("method")
            fid, extra = v, {}

        # Automatic retry: if a Docling page fails its fidelity check,
        # re-run it through Gemini vision (prompt v2) and keep whichever
        # scores higher.
        docling_debug = docling_md if method == "docling" else None
        if method == "docling" and fid["needs_review"] and not cls["is_scanned"]:
            png = render_page_png(page, RENDER_DPI)
            v = convert_page_vision(png, page_no, cls["text_layer"], False,
                                    call_log, "docling_fidelity_retry", boilerplate)
            if _score(v, v.get("truncated", False)) > _score(fid, False):
                docling_debug = markdown
                markdown = v.pop("markdown")
                v.pop("method")
                method = "docling+gemini_vision_v2"
                fid, extra = v, {}

        pages_out.append({
            "page_no": page_no,
            "is_text": cls["is_text"], "is_table": cls["is_table"],
            "is_visual": cls["is_visual"], "is_scanned": cls["is_scanned"],
            "text_layer": cls["text_layer"],
            "markdown": markdown,
            "docling_markdown": docling_debug,
            "method": method,
            **extra,
            **fid
        })

    return {"page_count": page_count, "sha256": sha256_file(pdf_path), "pages": pages_out}

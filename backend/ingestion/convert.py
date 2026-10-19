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
from diagram_schema import FENCE_INFO, extract_blocks, has_bullet_lines
from textnorm import normalize_label
from page_classify import classify_page, render_page_png
from fidelity import check_page
from gemini_client import BudgetExceeded, VisionCallError, transcribe_page

# Vision prompt v2 (PROMPT_VERSION in config.py). Built from the
# diagram-transcription skill. {page_no} is substituted with str.replace, not
# str.format, because the JSON examples contain braces.
VISION_PROMPT_V2 = """Transcribe EVERYTHING on this page of a business-school placement casebook, exactly.
This is PDF page {page_no}; set "source_page" to {page_no} in every diagram block.

TEXT
- Transcribe ALL text on the page as Markdown in the reading order a human would use: the title, every
  sentence, caption, note and callout box (e.g. "Best suitable for ..."), and the footer line with its page number.
  Diagram blocks never replace this text: anything printed outside a diagram must still appear as normal Markdown.
- Tables become Markdown tables. Only if a table has merged cells, use a "table" diagram block instead.
- Copy every word, number, unit and symbol exactly as printed. Do not summarise, interpret, correct, complete or add anything.
- If any text is unreadable, write [UNREADABLE] in its place.

DIAGRAMS
For EVERY diagram on the page (issue tree, mind map, 2x2 or grid matrix, funnel, process, value chain,
cycle, decision tree, bar/line/pie chart) output exactly one fenced block, opened with ```placewise-diagram
and closed with ```, containing ONE valid JSON object (double quotes, no comments, no trailing commas).
On the line right after the closing fence write:
Diagram summary: <1-3 plain sentences saying what the diagram shows>
Do NOT also repeat the diagram as bullet points or a list. Text on the page that is not part of a diagram stays normal Markdown.

Every block has: "type", "title" (string or null), "source_page" ({page_no}), "notes" (list of footnotes/captions exactly as printed, [] if none).
Types and their extra fields:
- issue_tree: "root": {"label": "...", "children": [ {"label": "...", "children": [...]} ]}  (hierarchies, MECE breakdowns, mind maps; every node has label and children, leaves have "children": []).
  Also use issue_tree when boxes or lists are grouped under headings with no arrows between them (heading = parent, items = children).
- matrix: "xAxis", "yAxis" (string or null), "cols": [...], "rows": [...], "cells": [[...], ...]  (one inner list per row, one entry per column)
- funnel: "stages": [...]  (ordered, widest first)
- flow: "nodes": [{"id": "a", "label": "..."}], "edges": [{"from": "a", "to": "b", "label": null}]  (processes, value chains, cycles; decision trees with Yes/No branches are a flow with "Yes"/"No" edge labels). A flow must have an edge for every arrow or connector; never output a flow with no edges.
- chart: "chart_kind": "bar" | "line" | "pie", "xLabel", "yLabel", "series": [{"name": "...", "points": [["x", 12.5], ...]}]  (only values printed on the page; if no values are printed use "points": [])
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

RULES FOR BLOCKS
- Every label, number and unit inside a block must be copied exactly as printed on the page. Never invent, rename, merge, correct or complete a label.
- Every box, node or list item that belongs to the diagram is its own node (a tree child, a flow node or a cell). Never move child boxes or list items into "notes"; "notes" are only footnotes and captions.
- Keep each label on one line: replace line breaks inside a label with a space ("Short-Term Competitive Disadvantage", not "Short-Term\\nCompetitive\\nDisadvantage").
- Unreadable text inside a block becomes "[UNREADABLE]".
- A page with two diagrams gets two blocks.
- Logos, page headers/footers, navigation buttons (e.g. "Main Index") and decorative icons are not diagrams;
  transcribe their text as normal Markdown.
- Read axes, rows, columns and cell positions from THIS page, not from the examples above.

Output Markdown only."""


def _text_layer_hint(text_layer: str) -> str:
    if not (text_layer or "").strip():
        return ""
    return ("\n\nPage's raw text layer (may be incomplete/misordered, for reference only; "
            "use it to check spelling of labels):\n" + text_layer[:1500])


def build_vision_prompt(page_no: int, text_layer: str, fix_hints=None) -> str:
    prompt = VISION_PROMPT_V2.replace("{page_no}", str(page_no)) + _text_layer_hint(text_layer)
    if fix_hints:
        prompt += ("\n\nA previous transcription of this page had these problems. Fix these problems "
                   "(never invent text to fix them; if something is truly not on the page, leave it out "
                   "or use [UNREADABLE]):\n" + "\n".join(f"- {h}" for h in fix_hints))
    return prompt


MAX_FIX_HINTS = 15
# Warn codes that indicate lost structure: they trigger the one retry and
# count against the score like errors, but are not schema errors.
# label_multiline is not retried: collapse_multiline_labels fixes it without a second paid call.
RETRY_WARN_CODES = {"notes_flattened", "flow_no_edges", "label_flattened"}


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
            h = f"block {b}: number {detail} not found on page; copy numbers exactly as printed"
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
        elif code == "unreadable":
            h = f"block {b}: has [UNREADABLE] values; re-read those labels carefully (keep [UNREADABLE] only if truly unreadable)"
        else:
            h = f"block {b}: {code}: {detail}"
        if h not in hints:
            hints.append(h)
        if len(hints) >= MAX_FIX_HINTS:
            break
    return hints[:MAX_FIX_HINTS]


def _score(fid: dict, truncated: bool) -> float:
    """number_coverage + word_coverage + label_coverage (1 when no labels were
    checked) - 0.5 per diagram error or structural warning - 1 if truncated."""
    cov = fid.get("diagram_label_coverage")
    return ((fid.get("number_coverage") or 0) + (fid.get("word_coverage") or 0)
            + (1.0 if cov is None else cov)
            - 0.5 * ((fid.get("diagram_errors") or 0) + _retry_warns(fid))
            - (1.0 if truncated else 0.0))


_HYPHEN_BREAK_RE = re.compile(r"(?<=\w)-[ \t]*\r?\n\s*")


def _collapse_strings(v, lines_out):
    """Collapse whitespace in every string value that spans lines and has no
    list markers (notes are left as printed). Records the original lines of
    each collapsed string in `lines_out`. Returns (new_value, changed)."""
    if isinstance(v, str):
        if "\n" in v and not has_bullet_lines(v):
            # "Short-\nTerm" -> "Short-Term" (keep the hyphen, drop the break)
            new = " ".join(_HYPHEN_BREAK_RE.sub("-", v).split())
            if new != v:
                lines_out[normalize_label(new)] = [l for l in v.strip().split("\n") if l.strip()]
            return new, new != v
        return v, False
    if isinstance(v, list):
        out, changed = [], False
        for x in v:
            nx, c = _collapse_strings(x, lines_out)
            out.append(nx)
            changed |= c
        return out, changed
    if isinstance(v, dict):
        out, changed = {}, False
        for k, x in v.items():
            if k == "notes":
                out[k] = x
                continue
            nx, c = _collapse_strings(x, lines_out)
            out[k] = nx
            changed |= c
        return out, changed
    return v, False


def collapse_multiline_labels_with_lines(markdown: str):
    """Deterministic post-fix after the final attempt: a label like
    "Short-Term\\nCompetitive\\nDisadvantage" becomes one line. Only parsed
    placewise-diagram blocks that change are re-dumped; labels with list
    markers are left alone (they stay flagged as label_flattened).
    Returns (markdown, label_lines) where label_lines maps
    normalize_label(collapsed label) -> original lines, so the re-check can
    still accept a label whose lines are printed separately on the page."""
    md = markdown or ""
    label_lines = {}
    for b in reversed(extract_blocks(md)):
        if b["fence"] != FENCE_INFO or b["obj"] is None:
            continue
        new_obj, changed = _collapse_strings(b["obj"], label_lines)
        if changed:
            block = f"```{FENCE_INFO}\n" + json.dumps(new_obj, ensure_ascii=False) + "\n```"
            md = md[:b["start"]] + block + md[b["end"]:]
    return md, label_lines


def collapse_multiline_labels(markdown: str) -> str:
    return collapse_multiline_labels_with_lines(markdown)[0]


def _vision_attempt(png, prompt, page_no, text_layer, is_scanned, call_log, reason, attempt, max_http):
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
    fid = check_page(text_layer, md, is_scanned, page_no)
    if truncated:
        fid["needs_review"] = True
        if "truncated" not in fid["review_reasons"]:
            fid["review_reasons"].append("truncated")
    return md, fid, truncated, model, http_calls


def convert_page_vision(png: bytes, page_no: int, text_layer: str, is_scanned: bool,
                        call_log: list, reason: str) -> dict:
    """Vision-convert one page with VISION_PROMPT_V2.

    Hard cap: VISION_MAX_CALLS_PER_PAGE HTTP requests for the page, counted at
    the HTTP level (a model-cascade hop counts). One retry (with targeted fix
    hints) only when the diagram blocks fail validation, show lost structure
    (RETRY_WARN_CODES) or the output was truncated, and only if budget is
    left. Keeps the better-scoring attempt (a tie keeps attempt 1). Never
    escalates the model. After the final attempt, multi-line labels without
    list markers are collapsed to one line and the page is re-checked.
    Raises BudgetExceeded if the run-level cap (set_vision_cap) is hit before
    the first attempt; a cap hit on the retry keeps attempt 1."""
    budget = VISION_MAX_CALLS_PER_PAGE
    log_start = len(call_log)
    prompt = build_vision_prompt(page_no, text_layer)
    md, fid, truncated, model, used = _vision_attempt(png, prompt, page_no, text_layer, is_scanned,
                                                      call_log, reason, 1, budget)
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
                reason + "+diagram_retry", 2, budget - used)
            attempts, http_calls = 2, used + used2
            if _score(fid2, trunc2) > _score(fid, truncated):
                md, fid, truncated, model = md2, fid2, trunc2, model2
        except BudgetExceeded:
            retry_skipped = "run_cap"
            http_calls = len(call_log) - log_start

    collapsed, label_lines = collapse_multiline_labels_with_lines(md)
    if collapsed != md:
        md = collapsed
        fid = check_page(text_layer, md, is_scanned, page_no, label_lines=label_lines)
        if truncated:
            fid["needs_review"] = True
            if "truncated" not in fid["review_reasons"]:
                fid["review_reasons"].append("truncated")
    return {
        "markdown": md,
        "method": "gemini_vision_v2",
        "prompt_version": PROMPT_VERSION,
        "attempts": attempts,
        "http_calls": http_calls,
        "retry_skipped": retry_skipped,
        "truncated": truncated,
        "vision_model": model,
        # collapsed label -> original lines; pass to check_page when re-checking
        "label_lines": label_lines,
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

    pages_out = []
    for i in range(page_count):
        page_no = i + 1
        page = pdf[i]
        cls = classify_page(page, docling_has_table=(page_no in docling_table_pages))
        docling_md = _strip_docling_placeholders(docling_pages.get(page_no, ""))

        if cls["is_table"] or (cls["is_text"] and not cls["is_visual"]):
            markdown = docling_md
            method = "docling"
            fid = check_page(cls["text_layer"], markdown, cls["is_scanned"], page_no)
            extra = {"prompt_version": None, "attempts": 0}
        else:
            png = render_page_png(page, RENDER_DPI)
            v = convert_page_vision(png, page_no, cls["text_layer"], cls["is_scanned"],
                                    call_log, "visual_or_scanned")
            markdown, method = v.pop("markdown"), v.pop("method")
            fid, extra = v, {}

        # Automatic retry: if a Docling page fails its fidelity check,
        # re-run it through Gemini vision (prompt v2) and keep whichever
        # scores higher.
        docling_debug = docling_md if method == "docling" else None
        if method == "docling" and fid["needs_review"] and not cls["is_scanned"]:
            png = render_page_png(page, RENDER_DPI)
            v = convert_page_vision(png, page_no, cls["text_layer"], False,
                                    call_log, "docling_fidelity_retry")
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

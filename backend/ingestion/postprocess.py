"""Free, deterministic post-pass applied to every vision output before its
fidelity check (stdlib + diagram_schema + textnorm only: no Gemini, no Docling,
no DB, so offline tools can import it).

- collapse_multiline_labels_with_lines: one-line labels (R1.03)
- restore_quotes: curly quotes restored from the text layer (R1.07)
- strip_invented_links: invented Markdown link targets removed (R1.07)
"""
import json
import re

from diagram_schema import FENCE_INFO, extract_blocks, has_bullet_lines, restore_quotes
from textnorm import normalize_label, strip_invented_links

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


def postprocess_markdown(markdown: str, text_layer: str):
    """The free deterministic repairs, in order: collapse multi-line labels,
    restore curly quotes from the text layer (R1.07), strip invented links
    (R1.07). Returns (markdown, label_lines, quotes_restored, links_stripped).
    Applied to every attempt before check_page."""
    md, label_lines = collapse_multiline_labels_with_lines(markdown)
    md, n_quotes = restore_quotes(md, text_layer)
    md, n_links = strip_invented_links(md, text_layer)
    return md, label_lines, n_quotes, n_links

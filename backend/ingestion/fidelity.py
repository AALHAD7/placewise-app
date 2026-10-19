"""Step 5: automatic fidelity checks, code only."""
import json
import re

from config import DIAGRAM_LABEL_COVERAGE_MIN, NUMBER_COVERAGE_MIN, WORD_COVERAGE_MIN
from diagram_schema import SUMMARY_PREFIX, check_diagrams, extract_blocks
# Number helpers live in textnorm (shared with diagram_schema); re-exported here
# so existing `from fidelity import extract_numbers` callers keep working.
from textnorm import NUMBER_RE, _normalize_number, extract_numbers  # noqa: F401

WORD_RE = re.compile(r"[a-zA-Z0-9]+")
UNREADABLE_RE = re.compile(r"\[UNREADABLE\]", re.IGNORECASE)

# diagram issue code -> review_reasons bucket
_DIAGRAM_REASON = {
    "label_not_on_page": "diagram_label",
    "number_not_on_page": "diagram_label",
    "type_other": "diagram_other",
    "unreadable": "unreadable",
}


# diagram warn codes that still send the page to review
_DIAGRAM_WARN_REASON = {
    "notes_flattened": "diagram_flattened",
    "flow_no_edges": "diagram_shape",
    "label_flattened": "diagram_flattened",
    # label_multiline has no reason: the converter collapses those labels.
}

# Keys whose values are machine values, not page text: never counted.
_NON_CONTENT_KEYS = ("source_page", "type", "id", "from", "to", "chart_kind")
_STRING_LIT_RE = re.compile(r'"(?:[^"\\\n]|\\.)*"')
_KEY_COLON_RE = re.compile(r"\s*:")
_VALUE_AFTER_KEY_RE = re.compile(r"\s*:\s*$")


def _block_values(v, out):
    """Decoded string and number values of a parsed diagram block (keys and
    machine values such as source_page dropped), so JSON escapes like \\n
    never reach the counters."""
    if isinstance(v, str):
        out.append(v)
    elif isinstance(v, bool) or v is None:
        return
    elif isinstance(v, (int, float)):
        out.append(str(int(v)) if isinstance(v, float) and v.is_integer() else str(v))
    elif isinstance(v, dict):
        for k, x in v.items():
            if k not in _NON_CONTENT_KEYS:
                _block_values(x, out)
    elif isinstance(v, list):
        for x in v:
            _block_values(x, out)


def _raw_string_values(raw: str) -> list:
    """Quoted string VALUES of an unparseable block, JSON-decoded (\\n, \\uXXXX).
    Keys, values of machine keys, bare numbers (e.g. source_page) and any
    unquoted text are dropped: a broken block can only lower coverage, never
    raise it with JSON syntax."""
    out, last_key, last_key_end = [], None, -1
    for m in _STRING_LIT_RE.finditer(raw or ""):
        lit = m.group(0)
        try:
            val = json.loads(lit)
        except ValueError:
            continue
        if _KEY_COLON_RE.match(raw, m.end()):
            last_key, last_key_end = val, m.end()
            continue
        is_direct_value = last_key_end >= 0 and _VALUE_AFTER_KEY_RE.match(raw[last_key_end:m.start()])
        if is_direct_value and last_key in _NON_CONTENT_KEYS:
            continue
        out.append(val)
    return out


def _drop_summary_lines(text: str) -> str:
    return "\n".join(l for l in text.split("\n") if not l.strip().startswith(SUMMARY_PREFIX))


def coverage_text(markdown: str) -> str:
    """What fidelity counts: the markdown with every diagram block replaced
    by its decoded values (one per line) and every `Diagram summary:` line
    removed. Summaries are model-written prose, so a sentence that survives
    only inside a summary does not count as transcribed. An unparseable block
    contributes only its quoted string values."""
    markdown = markdown or ""
    parts, pos = [], 0
    for b in extract_blocks(markdown):
        parts.append(markdown[pos:b["start"]])
        vals = []
        if b["obj"] is not None:
            _block_values(b["obj"], vals)
        else:
            vals = _raw_string_values(b["raw"])
        parts.append("\n".join(vals))
        pos = b["end"]
    parts.append(markdown[pos:])
    return _drop_summary_lines("".join(parts))


def extract_words(text: str) -> set:
    return {m.group(0).lower() for m in WORD_RE.finditer(text) if len(m.group(0)) > 1}


def number_coverage(text_layer: str, markdown: str) -> float:
    source_numbers = extract_numbers(text_layer)
    if not source_numbers:
        return 1.0  # nothing to lose - vacuously perfect, not a review trigger
    final_numbers = extract_numbers(markdown)
    present = sum(1 for n in source_numbers if n in final_numbers)
    return present / len(source_numbers)


def word_coverage(text_layer: str, markdown: str) -> float:
    source_words = extract_words(text_layer)
    if not source_words:
        return 1.0
    final_words = extract_words(markdown)
    present = sum(1 for w in source_words if w in final_words)
    return present / len(source_words)


def unreadable_count(markdown: str) -> int:
    return len(UNREADABLE_RE.findall(markdown or ""))


def _add(reasons: list, reason: str):
    if reason not in reasons:
        reasons.append(reason)


def check_page(text_layer: str, markdown: str, is_scanned: bool, page_no=None, label_lines=None) -> dict:
    """Fidelity of one converted page. `page_no` is the 1-based PDF page index,
    used to check each diagram block's `source_page` (skipped when None).
    `label_lines` maps a collapsed label to its original lines (see
    convert.collapse_multiline_labels_with_lines)."""
    markdown = markdown or ""
    uc = unreadable_count(markdown)
    reasons = []
    if is_scanned or not text_layer or not text_layer.strip():
        # No text layer to compare against - per the ground rule, scanned
        # pages always go to review (nothing to diff against).
        nc = wc = None
        _add(reasons, "scanned")
        diag = check_diagrams(markdown, "", page_no)
    else:
        # Coverage runs over the full markdown, diagram JSON included, so
        # diagram labels and numbers count toward coverage.
        cov_text = coverage_text(markdown)
        nc = number_coverage(text_layer, cov_text)
        wc = word_coverage(text_layer, cov_text)
        if nc < NUMBER_COVERAGE_MIN:
            _add(reasons, "number_coverage")
        if wc < WORD_COVERAGE_MIN:
            _add(reasons, "word_coverage")
        diag = check_diagrams(markdown, text_layer, page_no, label_lines)
    if uc > 0:
        _add(reasons, "unreadable")

    for it in diag["diagram_issues"]:
        if it["severity"] == "error":
            _add(reasons, _DIAGRAM_REASON.get(it["code"], "diagram_invalid"))
        elif it["code"] in _DIAGRAM_WARN_REASON:
            _add(reasons, _DIAGRAM_WARN_REASON[it["code"]])
    cov = diag["diagram_label_coverage"]
    if cov is not None and cov < DIAGRAM_LABEL_COVERAGE_MIN:
        _add(reasons, "diagram_label")

    return {
        "number_coverage": nc,
        "word_coverage": wc,
        "unreadable_count": uc,
        "needs_review": bool(reasons),
        **diag,
        "review_reasons": reasons,
    }

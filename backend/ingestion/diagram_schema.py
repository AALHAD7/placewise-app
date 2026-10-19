"""Parse and validate `placewise-diagram` blocks (see the diagram-transcription skill).

Pure Python: stdlib + textnorm only. The validator only REPORTS problems as issue
codes for the review queue; it never edits labels.

Issue codes
  error: invalid_json, wrong_fence, unknown_type, bad_shape, source_page_mismatch,
         dangling_edge, type_other, unreadable, missing_summary,
         label_not_on_page, number_not_on_page,
         label_altered (on the page only once punctuation/case is ignored),
         block_in_table (a block inside a Markdown table cell)
  warn:  chart_no_data, missing_field, flow_no_edges, notes_flattened,
         label_multiline, label_flattened,
         flow_disconnected, tree_duplicate_label, tree_convergence_suspect,
         missing_box (a short printed line among the labels that no block holds)
"""
import bisect
import json
import re

from collections import Counter

from textnorm import (QUOTE_MAP, exact_token_set, extract_numbers, fold_quotes, label_exact_on_page,
                      label_tokens, normalize_exact, normalize_label, token_variants)

KNOWN_TYPES = {"issue_tree", "matrix", "funnel", "flow", "chart", "table", "other"}
CHART_KINDS = {"bar", "line", "pie"}
TREE_DEPTH_CAP = 12
UNREADABLE = "[UNREADABLE]"
SUMMARY_PREFIX = "Diagram summary:"
FENCE_INFO = "placewise-diagram"

# Canonical definition of a diagram block. extract_blocks() uses a line scanner
# that is equivalent for closed blocks and additionally reports unclosed fences
# and json/untagged fences that hold a diagram.
BLOCK_RE = re.compile(r"^```placewise-diagram[ \t]*\n(.*?)\n```[ \t]*$", re.DOTALL | re.MULTILINE)

_FENCE_OPEN_RE = re.compile(r"^```[ \t]*([^\s`]*)[ \t]*$")
_FENCE_CLOSE_RE = re.compile(r"^```[ \t]*$")
_WRONG_FENCE_INFOS = {"", "json", "json5", "jsonc"}
_SYMBOL_LABELS = {"x"}


def _issue(code, severity, detail=""):
    return {"code": code, "severity": severity, "detail": detail}


def _is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _is_str_or_none(v):
    return v is None or isinstance(v, str)


# --------------------------------------------------------------------------- extract

def _summary_after(lines, idx):
    for line in lines[idx:]:
        s = line.strip()
        if not s:
            continue
        if s.startswith(SUMMARY_PREFIX):
            return s[len(SUMMARY_PREFIX):].strip() or None
        return None
    return None


IN_TABLE_ERROR = "block inside table cell"
_FENCE_TOKEN = "```"
_DIAGRAM_OPENER = "```" + FENCE_INFO


def _is_table_row(line):
    return line.lstrip().startswith("|")


def extract_blocks(markdown):
    """Return every diagram fence in order.

    Each dict: {index, start, end, raw, obj, parse_error, summary, fence, in_table}.
    `fence` is the info string. Blocks with fence != 'placewise-diagram' are
    json/untagged fences whose content parsed to an object with a known `type`
    (reported as wrong_fence, never silently dropped). start/end are character
    offsets of the whole fenced block in `markdown`.

    A ```placewise-diagram opener that does not start its line (it follows
    table-cell text, e.g. `| ```placewise-diagram`), or a block whose opening
    fence sits between two Markdown table rows, is reported with
    parse_error = IN_TABLE_ERROR and in_table = True: it counts in
    diagram_count but is never a valid diagram.
    """
    markdown = markdown or ""
    lines = markdown.split("\n")
    offsets, pos = [], 0
    for line in lines:
        offsets.append(pos)
        pos += len(line) + 1

    def line_of(off):
        return bisect.bisect_right(offsets, off) - 1

    def parse(raw):
        try:
            return json.loads(raw), None
        except (ValueError, TypeError) as e:
            return None, f"invalid JSON: {e}"

    blocks = []
    cur = 0
    while True:
        k = markdown.find(_FENCE_TOKEN, cur)
        if k < 0:
            break
        i = line_of(k)
        line = lines[i]
        col = k - offsets[i]
        if col > 0:
            # A fence that does not start its line: only a placewise-diagram
            # opener after cell text matters (an in-table block).
            if markdown.startswith(_DIAGRAM_OPENER, k) and line[:col].strip():
                body_start = k + len(_DIAGRAM_OPENER)
                close = markdown.find(_FENCE_TOKEN, body_start)
                end = len(markdown) if close < 0 else close + len(_FENCE_TOKEN)
                raw = markdown[body_start:close if close >= 0 else len(markdown)].strip()
                obj, _err = parse(raw)
                tail = markdown[end:].split("\n", 1)[0] if close >= 0 else ""
                tail = re.sub(r"^(?:\s|<br\s*/?>)+", "", tail)
                summary = None
                if tail.startswith(SUMMARY_PREFIX):
                    summary = tail[len(SUMMARY_PREFIX):].split("|")[0].strip() or None
                blocks.append({
                    "index": len(blocks), "start": k, "end": end, "raw": raw, "obj": obj,
                    "parse_error": IN_TABLE_ERROR, "summary": summary, "fence": FENCE_INFO,
                    "in_table": True,
                })
                if close < 0:
                    break
                cur = end
                continue
            cur = k + len(_FENCE_TOKEN)
            continue
        m = _FENCE_OPEN_RE.match(line)
        if not m:
            cur = k + len(_FENCE_TOKEN)
            continue
        info = m.group(1)
        close = None
        for j in range(i + 1, len(lines)):
            if _FENCE_CLOSE_RE.match(lines[j]):
                close = j
                break
        if close is None:
            if info == FENCE_INFO:
                blocks.append({
                    "index": len(blocks), "start": offsets[i], "end": len(markdown),
                    "raw": "\n".join(lines[i + 1:]), "obj": None,
                    "parse_error": "unclosed placewise-diagram fence", "summary": None,
                    "fence": info, "in_table": False,
                })
            break
        raw = "\n".join(lines[i + 1:close])
        end = min(offsets[close] + len(lines[close]), len(markdown))
        summary = _summary_after(lines, close + 1)
        if info == FENCE_INFO:
            obj, err = parse(raw)
            # Opening fence between two table rows (row above, row below the
            # block and its summary line) is also a block inside the table.
            after = close + 1
            if after < len(lines) and lines[after].strip().startswith(SUMMARY_PREFIX):
                after += 1
            in_table = (i > 0 and _is_table_row(lines[i - 1])
                        and after < len(lines) and _is_table_row(lines[after]))
            if in_table:
                err = IN_TABLE_ERROR
            blocks.append({
                "index": len(blocks), "start": offsets[i], "end": end, "raw": raw,
                "obj": obj, "parse_error": err, "summary": summary,
                "fence": info, "in_table": in_table,
            })
        elif info.lower() in _WRONG_FENCE_INFOS:
            try:
                obj = json.loads(raw)
            except (ValueError, TypeError):
                obj = None
            if isinstance(obj, dict) and obj.get("type") in KNOWN_TYPES:
                blocks.append({
                    "index": len(blocks), "start": offsets[i], "end": end, "raw": raw,
                    "obj": obj, "parse_error": None, "summary": summary,
                    "fence": info, "in_table": False,
                })
        cur = end + 1
    return blocks


# --------------------------------------------------------------------------- validate

def _str_list(v, allow_none_items=False):
    if not isinstance(v, list):
        return False
    return all(isinstance(x, str) or (allow_none_items and x is None) for x in v)


def _walk_strings(v):
    if isinstance(v, str):
        yield v
    elif isinstance(v, dict):
        for x in v.values():
            yield from _walk_strings(x)
    elif isinstance(v, list):
        for x in v:
            yield from _walk_strings(x)


def _check_tree(node, depth, path, issues):
    if depth > TREE_DEPTH_CAP:
        issues.append(_issue("bad_shape", "error", f"issue_tree deeper than {TREE_DEPTH_CAP} at {path}"))
        return
    if not isinstance(node, dict) or "label" not in node or "children" not in node:
        issues.append(_issue("bad_shape", "error", f"tree node at {path} needs label and children"))
        return
    if not isinstance(node["label"], str):
        issues.append(_issue("bad_shape", "error", f"tree node label at {path} is not a string"))
    if not isinstance(node["children"], list):
        issues.append(_issue("bad_shape", "error", f"tree node children at {path} is not a list"))
        return
    for k, child in enumerate(node["children"]):
        _check_tree(child, depth + 1, f"{path}.children[{k}]", issues)


def _validate_issue_tree(obj, issues):
    root = obj.get("root")
    if root is None:
        issues.append(_issue("bad_shape", "error", "issue_tree needs root"))
        return
    _check_tree(root, 1, "root", issues)


def _validate_matrix(obj, issues):
    rows, cols, cells = obj.get("rows"), obj.get("cols"), obj.get("cells")
    if not _str_list(rows) or not rows:
        issues.append(_issue("bad_shape", "error", "matrix rows must be a non-empty list of strings"))
    if not _str_list(cols) or not cols:
        issues.append(_issue("bad_shape", "error", "matrix cols must be a non-empty list of strings"))
    for axis in ("xAxis", "yAxis"):
        if not _is_str_or_none(obj.get(axis)):
            issues.append(_issue("bad_shape", "error", f"matrix {axis} must be a string or null"))
    if not isinstance(cells, list):
        issues.append(_issue("bad_shape", "error", "matrix cells must be a list of rows"))
        return
    if isinstance(rows, list) and len(cells) != len(rows):
        issues.append(_issue("bad_shape", "error", f"matrix has {len(rows)} rows but {len(cells)} cell rows"))
    for r, row in enumerate(cells):
        if not _str_list(row, allow_none_items=True):
            issues.append(_issue("bad_shape", "error", f"matrix cells[{r}] must be a list of strings"))
        elif isinstance(cols, list) and len(row) != len(cols):
            issues.append(_issue("bad_shape", "error", f"matrix cells[{r}] has {len(row)} entries, expected {len(cols)}"))


def _validate_funnel(obj, issues):
    stages = obj.get("stages")
    if not _str_list(stages) or len(stages) < 2:
        issues.append(_issue("bad_shape", "error", "funnel stages must be a list of >= 2 strings"))


def _validate_flow(obj, issues):
    nodes, edges = obj.get("nodes"), obj.get("edges")
    ids = set()
    if not isinstance(nodes, list) or len(nodes) < 2:
        issues.append(_issue("bad_shape", "error", "flow needs >= 2 nodes"))
        nodes = nodes if isinstance(nodes, list) else []
    for k, n in enumerate(nodes):
        if not isinstance(n, dict) or "id" not in n or not isinstance(n.get("label"), str):
            issues.append(_issue("bad_shape", "error", f"flow nodes[{k}] needs id and label"))
            continue
        if not isinstance(n["id"], (str, int)) or isinstance(n["id"], bool):
            issues.append(_issue("bad_shape", "error", f"flow nodes[{k}] id must be a string"))
            continue
        if n["id"] in ids:
            issues.append(_issue("bad_shape", "error", f"flow node id {n['id']!r} is duplicated"))
        ids.add(n["id"])
    if not isinstance(edges, list):
        issues.append(_issue("bad_shape", "error", "flow edges must be a list"))
        return
    if len(nodes) >= 2 and not edges:
        issues.append(_issue("flow_no_edges", "warn",
                             "flow has nodes but no edges (boxes grouped under headings are an issue_tree)"))
    for k, e in enumerate(edges):
        if not isinstance(e, dict) or "from" not in e or "to" not in e:
            issues.append(_issue("bad_shape", "error", f"flow edges[{k}] needs from and to"))
            continue
        if not _is_str_or_none(e.get("label")):
            issues.append(_issue("bad_shape", "error", f"flow edges[{k}] label must be a string or null"))
        for end in ("from", "to"):
            if e[end] not in ids:
                issues.append(_issue("dangling_edge", "error", f"edges[{k}].{end} = {e[end]!r} is not a node id"))


def _validate_chart(obj, issues):
    if obj.get("chart_kind") not in CHART_KINDS:
        issues.append(_issue("bad_shape", "error", f"chart_kind must be one of {sorted(CHART_KINDS)}"))
    for axis in ("xLabel", "yLabel"):
        if not _is_str_or_none(obj.get(axis)):
            issues.append(_issue("bad_shape", "error", f"chart {axis} must be a string or null"))
    series = obj.get("series")
    if not isinstance(series, list):
        issues.append(_issue("bad_shape", "error", "chart series must be a list"))
        return
    total_points = 0
    for s_i, s in enumerate(series):
        if not isinstance(s, dict) or not isinstance(s.get("name"), str) or not isinstance(s.get("points"), list):
            issues.append(_issue("bad_shape", "error", f"chart series[{s_i}] needs name and points"))
            continue
        for p_i, p in enumerate(s["points"]):
            ok = (isinstance(p, list) and len(p) == 2
                  and (isinstance(p[0], str) or _is_num(p[0]))
                  and (p[1] is None or _is_num(p[1])))
            if not ok:
                issues.append(_issue("bad_shape", "error", f"chart series[{s_i}].points[{p_i}] must be [x, number|null]"))
            total_points += 1
    if total_points == 0:
        issues.append(_issue("chart_no_data", "warn", "chart has no data points (qualitative curve?)"))


def _validate_table(obj, issues):
    header, rows = obj.get("header"), obj.get("rows")
    if not isinstance(header, list):
        issues.append(_issue("bad_shape", "error", "table header must be a list"))
    if not isinstance(rows, list) or not all(isinstance(r, list) for r in rows):
        issues.append(_issue("bad_shape", "error", "table rows must be a list of lists"))


def _validate_other(obj, issues):
    if not isinstance(obj.get("description"), str):
        issues.append(_issue("bad_shape", "error", "other needs a description string"))
    if not _str_list(obj.get("labels")):
        issues.append(_issue("bad_shape", "error", "other labels must be a list of strings"))
    issues.append(_issue("type_other", "error", "type 'other' always needs human review"))


_TYPE_VALIDATORS = {
    "issue_tree": _validate_issue_tree,
    "matrix": _validate_matrix,
    "funnel": _validate_funnel,
    "flow": _validate_flow,
    "chart": _validate_chart,
    "table": _validate_table,
    "other": _validate_other,
}


def validate_block(obj, page_no):
    """Schema check of one parsed block. `page_no` is the 1-based PDF page index
    (None skips the source_page comparison). Returns a list of Issue dicts."""
    issues = []
    if not isinstance(obj, dict):
        return [_issue("bad_shape", "error", "diagram block must be a JSON object")]

    t = obj.get("type")
    if t not in KNOWN_TYPES:
        issues.append(_issue("unknown_type", "error", f"type {t!r} is not one of {sorted(KNOWN_TYPES)}"))

    if "title" not in obj:
        issues.append(_issue("missing_field", "warn", "title missing (use null when there is none)"))
    elif not _is_str_or_none(obj["title"]):
        issues.append(_issue("bad_shape", "error", "title must be a string or null"))

    sp = obj.get("source_page")
    if not isinstance(sp, int) or isinstance(sp, bool):
        issues.append(_issue("bad_shape", "error", "source_page must be an int (1-based PDF page index)"))
    elif page_no is not None and sp != page_no:
        issues.append(_issue("source_page_mismatch", "error", f"source_page {sp} != page {page_no}"))

    if "notes" not in obj:
        issues.append(_issue("missing_field", "warn", "notes missing (use [] when there are none)"))
    elif not _str_list(obj["notes"]):
        issues.append(_issue("bad_shape", "error", "notes must be a list of strings"))

    if t in _TYPE_VALIDATORS:
        _TYPE_VALIDATORS[t](obj, issues)

    n_unreadable = sum(1 for s in _walk_strings(obj) if s.strip() == UNREADABLE)
    if n_unreadable:
        issues.append(_issue("unreadable", "error", f"{n_unreadable} [UNREADABLE] value(s)"))
    return issues


# --------------------------------------------------------------------------- labels / numbers

def _tree_labels(node, depth, out):
    if depth > TREE_DEPTH_CAP or not isinstance(node, dict):
        return
    if isinstance(node.get("label"), str):
        out.append(node["label"])
    for child in node.get("children") or []:
        _tree_labels(child, depth + 1, out)


def _strs(v):
    return [x for x in v if isinstance(x, str)] if isinstance(v, list) else []


def collect_labels(obj):
    """Every human-visible string in a block (in document order, duplicates kept)."""
    if not isinstance(obj, dict):
        return []
    out = []
    if isinstance(obj.get("title"), str):
        out.append(obj["title"])
    t = obj.get("type")
    if t == "issue_tree":
        _tree_labels(obj.get("root"), 1, out)
    elif t == "matrix":
        for axis in ("xAxis", "yAxis"):
            if isinstance(obj.get(axis), str):
                out.append(obj[axis])
        out += _strs(obj.get("cols")) + _strs(obj.get("rows"))
        for row in obj.get("cells") or []:
            out += _strs(row)
    elif t == "funnel":
        out += _strs(obj.get("stages"))
    elif t == "flow":
        for n in obj.get("nodes") or []:
            if isinstance(n, dict) and isinstance(n.get("label"), str):
                out.append(n["label"])
        for e in obj.get("edges") or []:
            if isinstance(e, dict) and isinstance(e.get("label"), str):
                out.append(e["label"])
    elif t == "chart":
        for axis in ("xLabel", "yLabel"):
            if isinstance(obj.get(axis), str):
                out.append(obj[axis])
        for s in obj.get("series") or []:
            if not isinstance(s, dict):
                continue
            if isinstance(s.get("name"), str):
                out.append(s["name"])
            for p in s.get("points") or []:
                if isinstance(p, list) and p and isinstance(p[0], str):
                    out.append(p[0])
    elif t == "table":
        out += _strs(obj.get("header"))
        for row in obj.get("rows") or []:
            out += _strs(row)
    elif t == "other":
        out += _strs(obj.get("labels"))
    out += _strs(obj.get("notes"))
    return out


def _fmt_num(v):
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v)


def collect_numbers(obj):
    """Chart y-values and numeric x-values, as strings."""
    if not isinstance(obj, dict) or obj.get("type") != "chart":
        return []
    out = []
    for s in obj.get("series") or []:
        if not isinstance(s, dict):
            continue
        for p in s.get("points") or []:
            if not isinstance(p, list) or len(p) != 2:
                continue
            for v in p:
                if _is_num(v):
                    out.append(_fmt_num(v))
    return out


TOKEN_BAG_MIN_TOKENS = 3  # out-of-order token match only for labels this long


def label_findable(label, text_layer_norm, text_words):
    """True if `label` is on the page. `text_layer_norm` is
    normalize_label(text_layer); `text_words` is set(text_layer_norm.split()).
    Whole-word phrase match first ("tax" does not match "taxation"). Labels of
    TOKEN_BAG_MIN_TOKENS+ tokens may also match as a bag of whole words, since
    slide text layers often scramble the order of a multi-line box."""
    norm = normalize_label(label)
    if not norm:
        return False
    if f" {norm} " in f" {text_layer_norm} ":
        return True
    tokens = label_tokens(norm)
    return len(tokens) >= TOKEN_BAG_MIN_TOKENS and all(tok in text_words for tok in tokens)


# Function words that cannot carry a line of a multi-line label on their own.
STOPWORDS = frozenset("""
a an the and or of to in on at for by with from as is are was were be been it its this that these those
not no but if then than so per via into onto over under up down out off vs our your their his her
""".split())
LINE_MIN_LETTERS = 3


def _has_content_token(tokens):
    return any(sum(ch.isalpha() for ch in t) >= LINE_MIN_LETTERS and t not in STOPWORDS for t in tokens)


def _is_initial_line(tokens, next_tokens, text_words):
    """A single-letter line that is the initial of the next line's first word
    (VRIO: "V" over "Valuable") and is printed on the page as its own token.
    Its position is NOT checked: slide text layers can emit the letter far
    from the word (FMS p52 has "Valuable" 16 tokens BEFORE "V")."""
    if len(tokens) != 1 or len(tokens[0]) != 1 or not tokens[0].isalpha():
        return False
    if not next_tokens or len(next_tokens[0]) < 2 or next_tokens[0][0] != tokens[0]:
        return False
    return tokens[0] in text_words


def label_lines_findable(lines, text_layer_norm, text_words):
    """Line-by-line form of a multi-line label (slides wrap a box's text, and
    the converter may collapse it to one line). Accepted only if:
    - there are at least 2 non-empty lines;
    - every line has a token of LINE_MIN_LETTERS+ letters that is not a
      stopword, except a single-letter initial line (see _is_initial_line);
    - the remaining lines' tokens appear IN ORDER and CLOSE TOGETHER in the
      page token stream: starting at an occurrence of the first line (every
      occurrence is tried), all tokens fall within (token count) + 1, i.e. at most one stray word."""
    toks = [normalize_label(l).split(" ") for l in (lines or []) if normalize_label(l)]
    if len(toks) < 2:
        return False
    core = []
    for k, t in enumerate(toks):
        nxt = toks[k + 1] if k + 1 < len(toks) else None
        if _is_initial_line(t, nxt, text_words):
            continue
        if not _has_content_token(t):
            return False
        core.append(t)
    if not core:
        return False
    flat = [t for line in core for t in line]
    window = len(flat) + 1  # tight on purpose: a wider window let made-up labels like "Market\nStrategy" pass
    first = core[0]
    stream = text_layer_norm.split(" ") if text_layer_norm else []
    for i in range(len(stream) - len(first) + 1):
        if stream[i:i + len(first)] != first:
            continue
        stop = min(i + window, len(stream))
        j, ok = i + len(first), True
        for tok in flat[len(first):]:
            while j < stop and stream[j] != tok:
                j += 1
            if j >= stop:
                ok = False
                break
            j += 1
        if ok:
            return True
    return False


def _label_on_page(label, text_layer_norm, text_words, label_lines=None):
    """Whether a label counts as on the page.
    - Single-line labels: label_findable (M1: whole-word phrase, token bag only
      for 3+ tokens).
    - Labels that are multi-line, or were before the converter collapsed them
      (`label_lines`: normalize_label(collapsed) -> original lines): exact
      phrase, else label_lines_findable. Never the token bag, so a collapsed
      label the line rule rejects stays label_not_on_page (diagram_label)."""
    lines = None
    if "\n" in label.strip():
        lines = label.strip().split("\n")
    elif label_lines:
        lines = label_lines.get(normalize_label(label))
    if lines and sum(1 for l in lines if normalize_label(l)) >= 2:
        norm = normalize_label(label)
        # Exact phrase: the label as a whole needs a content word ("a\nthe" never
        # passes); per-line content words are only demanded by the line rule,
        # so a verbatim wrap like "Threat\nof the\nNew Entrants" still passes.
        if norm and _has_content_token(norm.split(" ")) and f" {norm} " in f" {text_layer_norm} ":
            return True
        return label_lines_findable(lines, text_layer_norm, text_words)
    return label_findable(label, text_layer_norm, text_words)


def _skip_label(label):
    if not isinstance(label, str) or not label.strip() or label.strip() == UNREADABLE:
        return True
    norm = normalize_label(label)
    return not norm or norm in _SYMBOL_LABELS


def _page_number_values(text_layer):
    vals = set()
    for n in extract_numbers(text_layer):
        try:
            vals.add(float(n))
        except ValueError:
            continue
    return vals


# --------------------------------------------------------------------------- flattening

NOTE_PHRASE_MAX_TOKENS = 6   # a "short phrase" (box label size), not a caption sentence
FLATTENED_NOTES_MIN = 2      # this many short on-page phrases in notes -> suspected flattening
_NOTE_SPLIT_RE = re.compile(r"[\n•·▪●]+")


def suspected_flattened_notes(obj, text_norm, text_words):
    """Short phrases in `notes` that are printed on the page but are not node
    labels of the block - the signature of child boxes moved into notes.
    Returns the phrases (warn when >= FLATTENED_NOTES_MIN)."""
    if not isinstance(obj, dict) or not _str_list(obj.get("notes")):
        return []
    node_labels = {normalize_label(l) for l in collect_labels(dict(obj, notes=[]))}
    out = []
    for note in obj["notes"]:
        for part in _NOTE_SPLIT_RE.split(note):
            norm = normalize_label(part)
            if not norm or norm in node_labels or len(label_tokens(norm)) == 0:
                continue
            if len(norm.split(" ")) > NOTE_PHRASE_MAX_TOKENS:
                continue
            if label_findable(part, text_norm, text_words) and part.strip() not in out:
                out.append(part.strip())
    return out


_BULLET_LINE_RE = re.compile(r"^\s*(?:[•·▪●◦‣\-*–]|\d+[.)])\s+")


def multiline_labels(obj):
    """(plain, bulleted): node labels (notes excluded) that contain a line
    break. `bulleted` ones have list markers at line starts, i.e. child
    nodes packed into one label."""
    plain, bulleted = [], []
    if not isinstance(obj, dict):
        return plain, bulleted
    for lab in collect_labels(dict(obj, notes=[])):
        if not isinstance(lab, str) or "\n" not in lab.strip():
            continue
        lines = lab.strip().split("\n")
        if any(_BULLET_LINE_RE.match(l) for l in lines[1:]) or len(lines) > 1 and _BULLET_LINE_RE.match(lines[0]):
            bulleted.append(lab)
        else:
            plain.append(lab)
    return plain, bulleted


def has_bullet_lines(text):
    return any(_BULLET_LINE_RE.match(l) for l in (text or "").split("\n"))


# --------------------------------------------------------------------------- structure (R1.07)

TREE_DUP_IGNORE = {"Yes", "No", "Others"}
# tree_convergence_suspect is measured on the whole FMS pilot by rescore_v2.py;
# set to False if it produces too many false positives (see the plan 07 log entry).
CONVERGENCE_CHECK_ENABLED = True


def flow_components(obj):
    """Number of weakly connected components of a flow (every node counted)."""
    ids = [n["id"] for n in obj.get("nodes") or [] if isinstance(n, dict) and "id" in n]
    parent = {i: i for i in ids}

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for e in obj.get("edges") or []:
        if isinstance(e, dict) and e.get("from") in parent and e.get("to") in parent:
            a, b = find(e["from"]), find(e["to"])
            if a != b:
                parent[a] = b
    return len({find(i) for i in ids})


def tree_duplicate_labels(obj):
    labels = []
    _tree_labels(obj.get("root"), 1, labels)
    counts = Counter(normalize_exact(l) for l in labels if isinstance(l, str))
    return [l for l, c in counts.items()
            if c >= 2 and len(l) > 2 and l not in TREE_DUP_IGNORE]


def _first_pos(label, padded_text_norm):
    norm = normalize_label(label)
    if not norm:
        return None
    k = padded_text_norm.find(f" {norm} ")
    return None if k < 0 else k


def _descendant_labels(node, depth=0):
    out = []
    for c in (node.get("children") or []) if isinstance(node, dict) else []:
        if isinstance(c, dict):
            if isinstance(c.get("label"), str):
                out.append(c["label"])
            if depth < TREE_DEPTH_CAP:
                out += _descendant_labels(c, depth + 1)
    return out


# R1.09 tuning: a converging box is a short box label (not a formula or
# sentence), printed right after the last box of the columns that feed it.
CONVERGE_LEAF_MAX_TOKENS = 6
# Words printed between the last descendant and the leaf that belong to no
# label of the block (p13: the "Other C's: ..." line sits before "Government").
CONVERGE_MAX_GAP_TOKENS = 2
_FORMULA_RE = re.compile(r"[=+*/\d]")


def tree_convergence_suspects(obj, text_norm):
    """Leaf children printed right AFTER every descendant of all their siblings,
    where at least 2 siblings have children: the shape of a box that lines from
    several columns converge into, stored as one more child (FMS p11). Checked
    under every parent node, not only the root.

    Not flagged (tuned on the 248 v2 pages, R1.09): leaves longer than
    CONVERGE_LEAF_MAX_TOKENS words or holding digits/operators (formula leaves,
    p102/p107), and leaves separated from the last descendant by more than
    CONVERGE_MAX_GAP_TOKENS words that are in no label of the block (a sibling
    box printed after unrelated text, p13 "Government")."""
    if not text_norm:
        return []
    padded = f" {text_norm} "
    block_tokens = set()
    for lab in collect_labels(obj):
        if isinstance(lab, str):
            block_tokens.update(normalize_label(lab).split(" "))
    out = []

    def visit(node, depth):
        if depth > TREE_DEPTH_CAP or not isinstance(node, dict):
            return
        kids = [c for c in node.get("children") or [] if isinstance(c, dict)]
        for leaf in kids:
            if leaf.get("children") or not isinstance(leaf.get("label"), str):
                continue
            norm = normalize_label(leaf["label"])
            if (not norm or len(norm.split(" ")) > CONVERGE_LEAF_MAX_TOKENS
                    or _FORMULA_RE.search(leaf["label"])):
                continue
            sibs = [c for c in kids if c is not leaf]
            if sum(1 for c in sibs if c.get("children")) < 2:
                continue
            lp = _first_pos(leaf["label"], padded)
            if lp is None:
                continue
            desc = [(p, l) for c in sibs for l in _descendant_labels(c)
                    for p in [_first_pos(l, padded)] if p is not None]
            if len(desc) < 2:
                continue
            last_pos, last_label = max(desc)
            if lp <= last_pos:
                continue
            gap = padded[last_pos + len(normalize_label(last_label)) + 1:lp].split()
            if sum(1 for t in gap if t not in block_tokens) > CONVERGE_MAX_GAP_TOKENS:
                continue
            out.append(leaf["label"])
        for c in kids:
            visit(c, depth + 1)

    visit(obj.get("root"), 1)
    return out


# --------------------------------------------------------------------------- missing box (R1.09)

# A short text-layer line printed among a diagram's labels that is in no block
# label: a box the model left out of the block (FMS p11 "Crack the interview",
# written as plain text under the block). Deterministic, text layer only.
MISSING_BOX_MAX_TOKENS = 6
MISSING_BOX_CHECK_ENABLED = True
_TL_LINE_SPLIT_RE = re.compile(r"\r?\n|\r")
_NAV_RE = re.compile(r"^(?:main index|index|back|home|next|previous)$")
_HEADING_RE = re.compile(r"^\s{0,3}#{1,6}\s+(.*)$")


def _segmentable(tokens, label_blob):
    """True if `tokens` split into consecutive pieces that each appear as a
    whole-word phrase inside some label (label_blob = ' | '-joined padded
    normalised labels). "Prepare Hard Prepare Smart" is two labels on one
    text-layer line; a wrapped label's fragment is part of one label."""
    n = len(tokens)
    ok = [True] + [False] * n
    for i in range(1, n + 1):
        for j in range(i):
            if ok[j] and f" {' '.join(tokens[j:i])} " in label_blob:
                ok[i] = True
                break
    return ok[n]


_BOX_REJECT_RE = re.compile(r"[:=|#\d]")
_LINE_END_STOPWORDS = STOPWORDS | {"with", "like", "based", "such"}


def _body_text_line(raw_line, norm):
    """Plain body text or a list line, not a box: bullets and numbered items,
    sentence ends, lowercase continuations, wrapped lines ending in a function
    word or dash, lines with ':', '=', '|', '#' or digits (key-value facts,
    formulas, headers; numbers are covered by number_coverage), and
    footer/navigation lines."""
    s = raw_line.strip()
    if not s or "©" in s or "index" in norm.split(" ") or _BULLET_LINE_RE.match(s) or s[0] in "•▪●·◦‣-–*(":
        return True
    if _BOX_REJECT_RE.search(s) or s[-1] in ".;,–-/&(":
        return True
    if norm.split(" ")[-1] in _LINE_END_STOPWORDS:
        return True
    return s[0].islower()


MISSING_BOX_TITLE_LINES = 3  # the first non-empty Markdown lines are the slide title zone


def _standalone_in_markdown(norm, markdown):
    """False if the line only appears inside longer Markdown lines (outside
    blocks), i.e. it is part of a sentence, list item or title there, or if its
    own Markdown line is in the title zone (first MISSING_BOX_TITLE_LINES
    non-empty lines). True if a Markdown line after the title zone equals it
    (p11: the dropped box written as its own line under the block), or if it is
    not in the Markdown at all."""
    from textnorm import _outside_blocks  # textnorm imports nothing from here at module level
    found = False
    seen = 0
    for seg, is_block in _outside_blocks(markdown or ""):
        if is_block:
            seen = max(seen, MISSING_BOX_TITLE_LINES)
            continue
        for line in seg.split("\n"):
            ln = normalize_label(line)
            if not ln:
                continue
            seen += 1
            if f" {norm} " not in f" {ln} ":
                continue
            found = True
            if ln == norm and seen > MISSING_BOX_TITLE_LINES:
                return True
    return not found


_BOLD_LINE_RE = re.compile(r"^\s*(?:[-*]\s+)?\*\*(.+?)\*\*:?\s*$")


def _markdown_headings(markdown):
    """Normalised Markdown headings and whole-line bold text (slide section
    tabs such as "Assumptions", "Recommendations"), outside diagram blocks."""
    from textnorm import _outside_blocks
    out = []
    for seg, is_block in _outside_blocks(markdown or ""):
        if is_block:
            continue
        for line in seg.split("\n"):
            m = _HEADING_RE.match(line) or _BOLD_LINE_RE.match(line)
            if m:
                h = normalize_label(m.group(1))
                if h:
                    out.append(h)
    return out


def missing_box_lines(objs, text_layer, markdown=""):
    """Short text-layer lines (<= MISSING_BOX_MAX_TOKENS words, with a content
    word) that sit between the first and last text-layer line holding a label of
    a block, are next to a label line, are in no block label (all blocks of the
    page, notes and titles included), are not plain body text (_body_text_line),
    are not a Markdown heading of the output and are not only part of a longer
    Markdown line. Returns the raw lines, in page order."""
    objs = [o for o in objs or [] if isinstance(o, dict)]
    if not objs or not (text_layer or "").strip():
        return []
    per_block = []
    all_labels = []
    for o in objs:
        labs = [normalize_label(l) for l in collect_labels(o) if isinstance(l, str)]
        labs = [l for l in labs if l]
        per_block.append(" | ".join(f" {l} " for l in labs))
        all_labels += labs
    blob = " | ".join(f" {l} " for l in all_labels)
    lines = [l for l in _TL_LINE_SPLIT_RE.split(text_layer)]
    norms = [normalize_label(l) for l in lines]
    covered = [bool(n) and _segmentable(n.split(" "), blob) for n in norms]
    spans = []
    for b_blob in per_block:
        idx = [i for i, n in enumerate(norms)
               if n and _has_content_token(n.split(" ")) and _segmentable(n.split(" "), b_blob)]
        if len(idx) >= 2:
            spans.append((idx[0], idx[-1]))
    if not spans:
        return []
    heading_blob = " | ".join(f" {h} " for h in _markdown_headings(markdown))
    out = []
    for i, (raw, norm) in enumerate(zip(lines, norms)):
        if covered[i] or not norm or not any(a < i < b for a, b in spans):
            continue
        toks = norm.split(" ")
        if len(toks) > MISSING_BOX_MAX_TOKENS or not _has_content_token(toks):
            continue
        if _body_text_line(raw, norm) or (heading_blob and _segmentable(toks, heading_blob)):
            continue
        # Among the labels: an adjacent text-layer line is a label line.
        if not ((i > 0 and covered[i - 1]) or (i + 1 < len(lines) and covered[i + 1])):
            continue
        if not _standalone_in_markdown(norm, markdown):
            continue
        if raw.strip() not in out:
            out.append(raw.strip())
    return out


# --------------------------------------------------------------------------- quote restore (R1.07)

_MACHINE_KEYS = ("source_page", "type", "id", "from", "to", "chart_kind")
_MD_EDGE_CHARS = "*_`#>[]|~<" + "•▪–-:;,.()!?"


def _quote_only_diff(a, b):
    return len(a) == len(b) and a != b and all(x == y or (x in QUOTE_MAP and y in QUOTE_MAP) for x, y in zip(a, b))


class _QuoteFixer:
    def __init__(self, text_layer):
        self.exact = exact_token_set(text_layer)
        self.folded = {}
        for tok in normalize_exact(text_layer).split(" "):
            for v in token_variants(tok):
                self.folded.setdefault(fold_quotes(v), Counter())[v] += 1

    def fixed(self, tok):
        """The text-layer form of `tok` if it differs only in quote characters, else None."""
        if tok in self.exact:
            return None
        cands = self.folded.get(fold_quotes(tok))
        if not cands:
            return None
        best = cands.most_common(1)[0][0]
        return best if _quote_only_diff(tok, best) else None

    def fix_label(self, label):
        """Returns (new_label, n_tokens_fixed). Only when every token is exact or
        quote-fixable; otherwise the label is left alone (it stays flagged)."""
        toks = re.findall(r"\S+", label)
        if not toks or label_exact_on_page(label, self.exact):
            return label, 0
        plan = []
        for t in toks:
            tn = normalize_exact(t)
            if tn in self.exact:
                continue
            f = self.fixed(tn)
            if f is None:
                return label, 0
            plan.append(f)
        it = iter(plan)
        n = 0

        def repl(m):
            nonlocal n
            tn = normalize_exact(m.group(0))
            if tn in self.exact:
                return m.group(0)
            n += 1
            return next(it)

        return re.sub(r"\S+", repl, label), n

    def fix_md_token(self, tok):
        if not any(ch in QUOTE_MAP for ch in tok):
            return tok, 0
        lead = len(tok) - len(tok.lstrip(_MD_EDGE_CHARS))
        trail = len(tok) - len(tok.rstrip(_MD_EDGE_CHARS))
        core = tok[lead:len(tok) - trail] if trail else tok[lead:]
        if not core or not any(ch in QUOTE_MAP for ch in core):
            return tok, 0
        f = self.fixed(core)
        if f is None:
            return tok, 0
        return tok[:lead] + f + (tok[len(tok) - trail:] if trail else ""), 1


def _fix_values(v, fixer, key=None):
    if isinstance(v, str):
        return fixer.fix_label(v) if key not in _MACHINE_KEYS else (v, 0)
    if isinstance(v, list):
        out, n = [], 0
        for x in v:
            nx, c = _fix_values(x, fixer, key)
            out.append(nx)
            n += c
        return out, n
    if isinstance(v, dict):
        out, n = {}, 0
        for k, x in v.items():
            nx, c = _fix_values(x, fixer, k)
            out[k] = nx
            n += c
        return out, n
    return v, 0


def restore_quotes(markdown, text_layer):
    """Deterministic repair: a diagram label (title, node, note) or a Markdown
    word outside the blocks that matches the page text layer except for its
    quote style (4P's vs the printed 4P’s) gets the printed quote characters.
    No other character ever changes. Changed blocks are re-serialised with
    json.dumps(ensure_ascii=False, indent=2). Returns (markdown, n_fixed)."""
    md = markdown or ""
    if not (text_layer or "").strip() or not md:
        return md, 0
    fixer = _QuoteFixer(text_layer)
    total = 0
    pieces, pos = [], 0

    def fix_plain(seg):
        nonlocal total
        def repl(m):
            nonlocal total
            new, c = fixer.fix_md_token(m.group(0))
            total += c
            return new
        return re.sub(r"\S+", repl, seg)

    for b in extract_blocks(md):
        if b["start"] < pos:
            continue
        pieces.append(fix_plain(md[pos:b["start"]]))
        seg = md[b["start"]:b["end"]]
        if b["fence"] == FENCE_INFO and b["obj"] is not None and not b.get("in_table"):
            new_obj, n = _fix_values(b["obj"], fixer)
            if n:
                total += n
                seg = f"```{FENCE_INFO}\n" + json.dumps(new_obj, ensure_ascii=False, indent=2) + "\n```"
        pieces.append(seg)
        pos = b["end"]
    pieces.append(fix_plain(md[pos:]))
    return "".join(pieces), total


# --------------------------------------------------------------------------- page check

def check_diagrams(markdown, text_layer, page_no, label_lines=None):
    """`label_lines` (optional): {normalize_label(collapsed label): [original
    lines]} for labels the converter collapsed to one line."""
    blocks = extract_blocks(markdown)
    diagrams, issues = [], []
    has_text = bool(text_layer and text_layer.strip())
    text_norm = normalize_label(text_layer) if has_text else ""
    text_words = set(text_norm.split(" ")) if has_text else set()
    page_nums = _page_number_values(text_layer) if has_text else set()
    labels_checked = labels_found = 0
    seen_labels = set()

    def add(block, code, severity, detail):
        issues.append({"block": block["index"], "code": code, "severity": severity, "detail": detail})

    exact_tokens = exact_token_set(text_layer) if has_text else set()
    padded_norm = text_norm
    key_exact = {}     # loose key -> exact so far (only for keys found loosely)
    seen_exact = set()

    for b in blocks:
        if b.get("in_table"):
            add(b, "block_in_table", "error",
                "diagram block inside a Markdown table cell; close the table, then write the block")
            continue
        if b["parse_error"]:
            add(b, "invalid_json", "error", b["parse_error"])
            continue
        if b["fence"] != FENCE_INFO:
            add(b, "wrong_fence", "error", f"diagram in a ```{b['fence']} fence; must be ```{FENCE_INFO}")
        if b["summary"] is None:
            add(b, "missing_summary", "error", f"no '{SUMMARY_PREFIX}' line after the block")
        schema_issues = validate_block(b["obj"], page_no)
        for it in schema_issues:
            add(b, it["code"], it["severity"], it["detail"])
        schema_ok = not any(it["severity"] == "error" for it in schema_issues)
        if b["fence"] == FENCE_INFO and schema_ok:
            diagrams.append(b["obj"])

        # Structure checks (cheap, text only)
        if schema_ok and isinstance(b["obj"], dict):
            t = b["obj"].get("type")
            if t == "flow":
                n_comp = flow_components(b["obj"])
                if n_comp > 1 and (b["obj"].get("edges") or []):
                    add(b, "flow_disconnected", "warn", f"{n_comp} separate pieces")
            elif t == "issue_tree":
                for lab in tree_duplicate_labels(b["obj"]):
                    add(b, "tree_duplicate_label", "warn", lab)
                if CONVERGENCE_CHECK_ENABLED and has_text:
                    for lab in tree_convergence_suspects(b["obj"], padded_norm):
                        add(b, "tree_convergence_suspect", "warn", lab)

        if not has_text:
            continue
        for label in collect_labels(b["obj"]):
            if _skip_label(label):
                continue
            key = normalize_label(label)
            ex = normalize_exact(label)
            if key in seen_labels:
                if key_exact.get(key) is not None and ex not in seen_exact:
                    seen_exact.add(ex)
                    if not label_exact_on_page(label, exact_tokens):
                        key_exact[key] = False
                        add(b, "label_altered", "error", label)
                continue
            seen_labels.add(key)
            seen_exact.add(ex)
            labels_checked += 1
            if _label_on_page(label, text_norm, text_words, label_lines):
                labels_found += 1
                ok = label_exact_on_page(label, exact_tokens)
                key_exact[key] = ok
                if not ok:
                    add(b, "label_altered", "error", label)
            else:
                add(b, "label_not_on_page", "error", label)
        for num in collect_numbers(b["obj"]):
            if abs(float(num)) not in page_nums:
                add(b, "number_not_on_page", "error", num)
        plain_ml, bullet_ml = multiline_labels(b["obj"])
        if plain_ml:
            add(b, "label_multiline", "warn", " | ".join(l.replace("\n", "\\n") for l in plain_ml)[:300])
        if bullet_ml:
            add(b, "label_flattened", "warn", " | ".join(l.replace("\n", "\\n") for l in bullet_ml)[:300])
        flat = suspected_flattened_notes(b["obj"], text_norm, text_words)
        if len(flat) >= FLATTENED_NOTES_MIN:
            add(b, "notes_flattened", "warn", " | ".join(flat))

    # Missing boxes (R1.09): one warn per short printed line among the labels that
    # no block holds. Attached to the first parsed block (the check is page-wide).
    if MISSING_BOX_CHECK_ENABLED and has_text:
        parsed = [b for b in blocks if isinstance(b["obj"], dict) and not b.get("in_table")]
        if parsed:
            for line in missing_box_lines([b["obj"] for b in parsed], text_layer, markdown):
                add(parsed[0], "missing_box", "warn", line)

    coverage = (labels_found / labels_checked) if (has_text and labels_checked) else None
    n_exact = sum(1 for v in key_exact.values() if v)
    exact = (n_exact / labels_checked) if (has_text and labels_checked) else None
    return {
        "diagram_label_exact": exact,
        "diagram_count": len(blocks),
        "diagrams": diagrams,
        "diagram_issues": issues,
        "diagram_label_coverage": coverage,
        "diagram_errors": sum(1 for it in issues if it["severity"] == "error"),
    }

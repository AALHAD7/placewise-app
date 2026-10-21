"""Text normalisation shared by fidelity.py and diagram_schema.py (stdlib only).

Kept separate so diagram_schema can use the number extractor without importing
fidelity (which imports config / .env) and without an import cycle.
"""
import re
import unicodedata

# Year-range shorthand ("2023-24") matches as ONE token before the generic
# digit matcher gets a chance to split it into "2023" + "24" - confirmed
# live this was flagging a real but harmless case: Docling correctly drops
# a repetitive "© ... 2023-24" running footer (not a content loss), but the
# naive split-number check still flagged it as a missing number.
NUMBER_RE = re.compile(r"[₹$€£]?\s?\d{4}-\d{2}\b|[₹$€£]?\s?[\d,]+(?:\.\d+)?%?")


def _normalize_number(s: str) -> str:
    # Strip currency symbols, commas, surrounding whitespace, trailing %.
    s = s.strip()
    s = re.sub(r"[₹$€£,\s]", "", s)
    s = s.rstrip("%")
    return s


def extract_numbers(text: str) -> set:
    return {_normalize_number(m.group(0)) for m in NUMBER_RE.finditer(text) if _normalize_number(m.group(0))}


# --- numbers with a unit suffix (R2.05) ---------------------------------------
# extract_numbers is a set of bare values, so "20M" on the page counted as
# transcribed whenever any "20" appeared in the markdown (FMS p230 lost
# "Pop. of AUS= 20M" with number_coverage = 1.0). A number glued to (or one
# space before, for units longer than one letter) a scale unit is ALSO extracted as "<value>|<unit>", unit
# spellings folded to one form, so "20M", "20 Mn" and "20 million" all match.
_UNIT_CANON = {
    "k": "k", "thousand": "k",
    "m": "m", "mn": "m", "mil": "m", "mill": "m", "million": "m", "millions": "m",
    "b": "b", "bn": "b", "billion": "b", "billions": "b",
    "t": "t", "tn": "t", "trillion": "t",
    "cr": "cr", "crs": "cr", "crore": "cr", "crores": "cr",
    "l": "l", "lac": "l", "lacs": "l", "lakh": "l", "lakhs": "l",
}
# A number right after a multiplication "x" ("3x100k") still counts.
# Single-letter units (K, M, B, T, L) only when glued to the number ("20M"):
# "2 b)" in a list must not read as 2 billion. Longer units may follow one space.
_LONG_UNITS = "|".join(sorted((u for u in _UNIT_CANON if len(u) > 1), key=len, reverse=True))
UNIT_NUMBER_RE = re.compile(
    r"(?:(?<=[0-9 ]x)|(?<![\w.]))(\d[\d,]*(?:\.\d+)?)(?:([kmbtl])|[ \t]?(" + _LONG_UNITS + r"))\b",
    re.IGNORECASE)


# Markdown math writes "150k" as $150\text{k}$ (FMS p192): unwrap before matching.
_LATEX_TEXT_RE = re.compile(r"\\(?:text|mathrm|textrm|mbox)\{([^{}]*)\}")


def extract_unit_numbers(text: str) -> set:
    """{"20|m", "1.2|m", "120|k", ...}: numbers with a scale unit, unit folded."""
    out = set()
    text = _LATEX_TEXT_RE.sub(r"\1", text or "")
    for m in UNIT_NUMBER_RE.finditer(text):
        v = _normalize_number(m.group(1))
        if v:
            out.add(f"{v}|{_UNIT_CANON[(m.group(2) or m.group(3)).lower()]}")
    return out


# --- label normalisation (diagram label vs page text layer) -----------------

# A hyphen at a line break ("Short-\nTerm") is a real hyphen on these slides
# (compound labels wrapped in a box), so it becomes a space like any other
# hyphen: "short term", matching the one-line label "Short-Term".
_HYPHEN_BREAK_RE = re.compile(r"(?<=\w)-[ \t]*\r?\n\s*(?=\w)")
_DECIMAL_DOT_RE = re.compile(r"(?<=\d)\.(?=\d)")
_DOT_PLACEHOLDER = "\u0000"
_PUNCT_RE = re.compile(r"[^\w\s%\u0000]|_")
_WS_RE = re.compile(r"\s+")


def normalize_label(text: str) -> str:
    """NFKC + lowercase, hyphenated line breaks become a space, strip punctuation except
    `%` and `.` inside numbers, collapse whitespace."""
    if not text:
        return ""
    t = unicodedata.normalize("NFKC", text).lower()
    t = _HYPHEN_BREAK_RE.sub(" ", t)
    t = _DECIMAL_DOT_RE.sub(_DOT_PLACEHOLDER, t)
    t = _PUNCT_RE.sub(" ", t)
    t = t.replace(_DOT_PLACEHOLDER, ".")
    return _WS_RE.sub(" ", t).strip()


def label_tokens(normalized: str) -> list:
    """Content tokens (len > 1) of an already-normalised string."""
    return [tok for tok in normalized.split(" ") if len(tok) > 1]


# --- exact label matching (R1.07) -------------------------------------------
# The loose matcher above strips all punctuation, so it cannot see an apostrophe
# change. normalize_exact keeps case and every punctuation mark: only Unicode
# composition (NFC, never NFKC, which folds characters), hyphenated line breaks
# and whitespace are normalised.

_EXACT_HYPHEN_BREAK_RE = re.compile(r"(?<=\w)-[ \t]*\r?\n\s*(?=\w)")
# Text-layer decoding artefacts, not printed characters: pdfium returns U+FFFE
# where the page prints a hyphen ("Fast\ufffetrack" is printed "Fast-track"),
# and zero-width characters glue onto tokens ("60%\u200b").
_TEXT_LAYER_FIXES = str.maketrans({"\ufffe": "-", "\u200b": None, "\u200c": None, "\u200d": None,
                                   "\u2060": None, "\ufeff": None})


def normalize_exact(text: str) -> str:
    """NFC, "Short-\\nTerm" -> "Short-Term" (the same breaks _HYPHEN_BREAK_RE
    finds, joined with the hyphen kept), whitespace collapsed. Case and all
    punctuation are kept. U+FFFE (pdfium's code for a printed hyphen) becomes
    "-" and zero-width characters are dropped."""
    if not text:
        return ""
    t = unicodedata.normalize("NFC", text).translate(_TEXT_LAYER_FIXES)
    t = _EXACT_HYPHEN_BREAK_RE.sub("-", t)
    return _WS_RE.sub(" ", t).strip()


# Quote and prime characters, mapped to their ASCII form.
QUOTE_MAP = {
    "'": "'", "’": "'", "‘": "'", "′": "'",
    '"': '"', "“": '"', "”": '"', "″": '"',
}
_QUOTE_TRANS = str.maketrans({k: v for k, v in QUOTE_MAP.items() if k != v})


def fold_quotes(text: str) -> str:
    """Every quote/prime character in QUOTE_MAP becomes its ASCII form."""
    return (text or "").translate(_QUOTE_TRANS)


# A text-layer token may carry bullet/list punctuation at its ends that a
# diagram label omits ("• Price", "Other 3 P’s:"). Nothing inside a token is relaxed.
EDGE_PUNCT = "•▪–-:;,.()"


def token_variants(tok: str):
    """tok plus every form with some of its leading and/or trailing EDGE_PUNCT
    characters removed (never characters inside the token)."""
    lead = len(tok) - len(tok.lstrip(EDGE_PUNCT))
    trail = len(tok) - len(tok.rstrip(EDGE_PUNCT))
    out = set()
    for i in range(lead + 1):
        for j in range(trail + 1):
            core = tok[i:len(tok) - j] if j else tok[i:]
            if core:
                out.add(core)
    return out


def exact_token_set(text_layer: str) -> set:
    """Every whitespace token of normalize_exact(text_layer), with its edge-punctuation variants."""
    out = set()
    for tok in normalize_exact(text_layer).split(" "):
        if tok:
            out |= token_variants(tok)
    return out


def label_exact_on_page(label: str, exact_tokens: set) -> bool:
    """Every whitespace token of normalize_exact(label) is an exact token
    (or edge-punctuation variant) of the page text layer."""
    toks = [t for t in normalize_exact(label).split(" ") if t]
    return bool(toks) and all(t in exact_tokens for t in toks)


# --- invented links (R1.07) --------------------------------------------------

# R2.04: the target may hold one level of balanced parentheses, so
# [Main Index](javascript:history.back()) is matched whole (no stray ")" left).
_LINK_RE = re.compile(r"(!?)\[([^\]\n]*)\]\(((?:[^()\n]|\([^()\n]*\))*)\)")
_SCHEME_RE = re.compile(r"^[a-zA-Z][a-zA-Z0-9+.\-]*:")


def _link_is_invented(target: str, text_layer: str) -> bool:
    t = target.strip()
    if t.startswith("<") and t.endswith(">"):
        t = t[1:-1].strip()
    t = t.split(" ")[0]  # drop a "title" part
    if not t or t.lower().startswith("javascript:") or t.startswith("#"):
        return True
    if not _SCHEME_RE.match(t) and "." not in t:
        return True
    return t not in (text_layer or "")


def _outside_blocks(markdown: str):
    """Yield (segment, is_block) parts of markdown, diagram blocks (as found by
    diagram_schema.extract_blocks, in-table ones included) kept whole."""
    from diagram_schema import extract_blocks  # lazy: diagram_schema imports textnorm
    md = markdown or ""
    pos = 0
    for b in extract_blocks(md):
        if b["start"] < pos:
            continue
        yield md[pos:b["start"]], False
        yield md[b["start"]:b["end"]], True
        pos = b["end"]
    yield md[pos:], False


def strip_invented_links(markdown: str, text_layer: str):
    """A Markdown link or image link outside diagram blocks becomes its plain
    text when the target is javascript:, a #anchor, a bare word with no scheme
    and no dot (e.g. main_index), or any URL that is not printed in the text
    layer. Real printed URLs stay. An invented image link keeps its alt text
    only when the page prints it (review hardening); otherwise it is dropped.
    Returns (markdown, n_stripped)."""
    n = 0
    out = []

    tl_norm = None

    def alt_is_printed(alt):
        nonlocal tl_norm
        if tl_norm is None:
            tl_norm = " " + normalize_label(text_layer or "") + " "
        a = normalize_label(alt)
        return bool(a) and f" {a} " in tl_norm

    def repl(m):
        nonlocal n
        if _link_is_invented(m.group(3), text_layer):
            n += 1
            # Review fix: an image's alt text is the model's description
            # ("IndiGo Logo", FMS p56), not page text. Keep it only if printed.
            if m.group(1) == "!" and not alt_is_printed(m.group(2)):
                return ""
            return m.group(2)
        return m.group(0)

    for seg, is_block in _outside_blocks(markdown):
        out.append(seg if is_block else _LINK_RE.sub(repl, seg))
    return "".join(out), n


# --- stray ")" left by the pre-R2 link regex (R2.04) ---------------------------
# The old _LINK_RE stopped at the first ")", so [Main Index](javascript:history.back())
# was stored as "Main Index)" and [Main Index](javascript:history.back();) as
# "Main Index;)" (both removed, R2.05). Only short lines (nav bars) are touched, only a ")"
# with no "(" before it on the line, right after a letter, and only when that
# token (with the ")") is not printed in the text layer.
# Review hardening: only after a word ending in "Index", or on a nav-bar line
# ("Index" and a "|"); never after a 1-2 letter list marker (a), ii), A)), and
# never without a text layer to compare against.

STRAY_PAREN_MAX_WORDS = 8
STRAY_PAREN_MIN_WORD = 3
_PAREN_NAV_BAR_RE = re.compile(r"\bIndex\b.*\||\|.*\bIndex\b")


def strip_stray_parens(markdown: str, text_layer: str):
    """Returns (markdown, n_removed). Diagram blocks are never touched."""
    if not (text_layer or "").strip():
        return markdown or "", 0
    printed = exact_token_set(text_layer)
    n = 0
    out = []

    def fix_line(line):
        nonlocal n
        if ")" not in line:
            return line
        # A bare ")" only on short lines; ";)" after a letter is the distinctive
        # history.back(); leftover and is removed on any line (FMS p213 nav bar
        # runs on with the case title: "FMS | Case Index;) | Main Index;) | Money Heist | ...").
        short = len(re.findall(r"[A-Za-z]+", line)) <= STRAY_PAREN_MAX_WORDS
        nav_bar = bool(_PAREN_NAV_BAR_RE.search(line))
        res, depth, i = [], 0, 0
        for i, ch in enumerate(line):
            if ch == "(":
                depth += 1
            elif ch == ")":
                if depth > 0:
                    depth -= 1
                else:
                    # "Index)" (pre-R2 regex on ...history.back())) or "Index;)"
                    # (on ...history.back();)): a letter, an optional ";", then ")".
                    k = i - 1 if line[i - 1:i] == ";" else i
                    if (short or k != i) and k > 0 and line[k - 1].isascii() and line[k - 1].isalpha():
                        j = k
                        while j > 0 and not line[j - 1].isspace():
                            j -= 1
                        tok = line[j:i + 1]
                        w = k
                        while w > 0 and line[w - 1].isascii() and line[w - 1].isalpha():
                            w -= 1
                        word = line[w:k]
                        allowed = len(word) >= STRAY_PAREN_MIN_WORD and (word.endswith("Index") or nav_bar)
                        if allowed and tok not in printed:
                            n += 1
                            if k != i:
                                res.pop()  # the ";" before the ")"
                            continue
            res.append(ch)
        return "".join(res)

    for seg, is_block in _outside_blocks(markdown):
        out.append(seg if is_block else "\n".join(fix_line(l) for l in seg.split("\n")))
    return "".join(out), n


# --- invented text (R2.09, pattern 4) -------------------------------------------
# Text the model wrote that the page does not print: logo/image placeholders, link
# brackets left around underlined text, block titles, italic or parenthetical captions,
# empty table rows (stripped), and table headers or chart strings (flagged only).
# "On the page" = label_exact_on_page against the text layer, or every token of >= 2
# letters is a text-layer word. Every strip checks the text layer first: deleting
# printed text would be a `missing` defect.

CAPTION_ON_PAGE_MIN = 0.6
_PLACEHOLDER_WORDS_RE = re.compile(r"\b(?:logos?|images?|icons?|photos?)\b", re.IGNORECASE)
_BRACKET_RE = re.compile(r"(?<![\]!\\])\[([^\[\]\n]*)\](?![(\[:])")
_KEEP_BRACKETS = {"unreadable", "", "x"}
_ALPHA_WORD_RE = re.compile(r"[^\W\d_]{2,}")
_ITALIC_LINE_RE = re.compile(r"^\s*(?:\*(?!\*)(.+?)(?<!\*)\*|_(?!_)(.+?)(?<!_)_)\s*$")
_PAREN_LINE_RE = re.compile(r"^\s*\((.+)\)\s*$")
_TABLE_SEP_RE = re.compile(r"^\s*\|?\s*:?-{2,}:?\s*(?:\|\s*:?-{2,}:?\s*)*\|?\s*$")
_EMPHASIS_STRIP_RE = re.compile(r"[*_`]+")


class PageText:
    """The text layer, prepared once for the 'is it on the page' checks."""

    def __init__(self, text_layer: str):
        self.raw = text_layer or ""
        self.exact = exact_token_set(self.raw)
        tl = unicodedata.normalize("NFKC", self.raw)
        self.words = {w.lower() for w in _ALPHA_WORD_RE.findall(fold_quotes(tl))}
        self.flat = fold_quotes(normalize_exact(tl))

    def on_page(self, text: str) -> bool:
        t = (text or "").strip()
        if not t:
            return False
        if label_exact_on_page(t, self.exact):
            return True
        words = _ALPHA_WORD_RE.findall(fold_quotes(unicodedata.normalize("NFKC", t)))
        return bool(words) and all(w.lower() in self.words for w in words)

    def word_share(self, text: str):
        words = _ALPHA_WORD_RE.findall(fold_quotes(unicodedata.normalize("NFKC", text or "")))
        if not words:
            return None
        return sum(1 for w in words if w.lower() in self.words) / len(words)

    def prints_bracketed(self, inner: str) -> bool:
        return f"[{fold_quotes(normalize_exact(inner))}]" in self.flat


def _is_placeholder(inner: str) -> bool:
    s = inner.strip()
    return s.lower() == "logo" or bool(_PLACEHOLDER_WORDS_RE.search(s))


def _strip_brackets_line(line: str, pt: PageText, log):
    """Logo/image placeholders deleted, leftover link brackets unwrapped."""
    def repl(m):
        inner = m.group(1)
        key = inner.strip().lower()
        if key in _KEEP_BRACKETS or pt.prints_bracketed(inner):
            return m.group(0)
        if _is_placeholder(inner):
            if pt.on_page(inner):
                return m.group(0)
            if log is not None:
                log.append(("placeholder", m.group(0), ""))
            return ""
        if pt.on_page(inner):
            if log is not None:
                log.append(("link_bracket", m.group(0), inner))
            return inner
        return m.group(0)
    new = _BRACKET_RE.sub(repl, line)
    if new != line and not new.strip():
        return None
    if new != line:
        new = re.sub(r"[ \t]{2,}", " ", new).rstrip()
    return new


def _is_caption_line(line: str, pt: PageText) -> bool:
    s = line.strip()
    if s.startswith("**") or s.startswith("__"):
        return False
    m = _ITALIC_LINE_RE.match(s)
    inner = (m.group(1) or m.group(2)) if m else None
    if inner is None:
        m = _PAREN_LINE_RE.match(s)
        inner = m.group(1) if m else None
    if inner is None:
        return False
    share = pt.word_share(inner)
    if share is None:
        return False
    if share < CAPTION_ON_PAGE_MIN:
        return True
    # R2.09 calibration (FMS p77 "*(Icons for ChatGPT, ...)*"): a caption that names a
    # picture with a placeholder word the page does not print describes an image.
    return any(not pt.on_page(w) for w in _PLACEHOLDER_WORDS_RE.findall(inner))


_BR_RE = re.compile(r"(<br\s*/?>)", re.IGNORECASE)


def _strip_cell_captions(line: str, pt: PageText, log) -> str:
    """Inside a table row, a cell piece between <br> breaks is a line of that cell:
    a caption piece (same rule as a caption line) is removed with its break."""
    if "|" not in line:
        return line
    cells = line.split("|")
    changed = False
    for ci, cell in enumerate(cells):
        parts = _BR_RE.split(cell)
        pieces = parts[0::2]
        if not any(_is_caption_line(pc, pt) for pc in pieces):
            continue
        kept = [pc for pc in pieces if not _is_caption_line(pc, pt)]
        for pc in pieces:
            if _is_caption_line(pc, pt):
                local_before = pc.strip()
                if log is not None:
                    log.append(("caption", local_before, ""))
        # drop empty pieces left at the ends, keep inner blank pieces (paragraph breaks)
        while kept and not kept[0].strip():
            kept.pop(0)
        while kept and not kept[-1].strip():
            kept.pop()
        new = "<br>".join(k.strip() for k in kept)
        lead = " " if cell.startswith(" ") else ""
        trail = " " if cell.endswith(" ") else ""
        cells[ci] = (lead + new + trail) if new else (" " if cell.strip() else cell)
        changed = True
    return "|".join(cells) if changed else line


def _cells(row: str) -> list:
    s = row.strip()
    if s.startswith("|"):
        s = s[1:]
    if s.endswith("|"):
        s = s[:-1]
    return [c.strip() for c in s.split("|")]


def _table_rows(lines):
    """Yield (start, end) line indexes of Markdown tables: a run of "|" lines whose
    second line is a separator."""
    i = 0
    while i < len(lines):
        if lines[i].lstrip().startswith("|"):
            j = i
            while j < len(lines) and lines[j].lstrip().startswith("|"):
                j += 1
            if j - i >= 2 and _TABLE_SEP_RE.match(lines[i + 1]):
                yield i, j
            i = j
        else:
            i += 1


_TITLE_LIT_RE = re.compile(r'("title"\s*:\s*)("(?:[^"\\\n]|\\.)*")')


def _null_block_title(raw_block: str, obj, pt: PageText, log):
    """`"title": "<s>"` -> `"title": null` when s is not on the page. Only the string value
    is edited; the result must still parse with the same object apart from the title."""
    import json
    title = obj.get("title") if isinstance(obj, dict) else None
    if not isinstance(title, str) or not title.strip() or pt.on_page(title):
        return raw_block
    for m in _TITLE_LIT_RE.finditer(raw_block):
        try:
            if json.loads(m.group(2)) != title:
                continue
        except ValueError:
            continue
        new = raw_block[:m.start(2)] + "null" + raw_block[m.end(2):]
        body = new.split("\n", 1)[1].rsplit("```", 1)[0]
        try:
            new_obj = json.loads(body)
        except ValueError:
            return raw_block
        if new_obj.get("title") is None and {k: v for k, v in new_obj.items() if k != "title"} == \
                {k: v for k, v in obj.items() if k != "title"}:
            if log is not None:
                log.append(("block_title", title, None))
            return new
        return raw_block
    return raw_block


def strip_invented_text(markdown: str, text_layer: str, log=None):
    """R2.09: delete or unwrap text the page does not print. Steps (each checks the text
    layer first): 1 logo/image placeholders, 2 leftover link brackets, 3 unprinted block
    titles -> null, 4 italic/parenthetical caption lines, 5 empty table body rows.
    `log` receives (kind, before, after). Returns (markdown, n_changes). Idempotent;
    pages with no text layer are untouched."""
    from diagram_schema import FENCE_INFO, extract_blocks  # lazy: diagram_schema imports textnorm
    md = markdown or ""
    if not (text_layer or "").strip() or not md:
        return md, 0
    pt = PageText(text_layer)
    local = []
    out = []
    blocks = {b["start"]: b for b in extract_blocks(md)}
    pos = 0
    for seg, is_block in _outside_blocks(md):
        start, pos = pos, pos + len(seg)
        if is_block:
            b = blocks.get(start)
            if b is not None and b["fence"] == FENCE_INFO and isinstance(b["obj"], dict) and not b.get("in_table"):
                seg = _null_block_title(seg, b["obj"], pt, local)
            out.append(seg)
            continue
        lines = seg.split("\n")
        kept = []
        for line in lines:
            new = _strip_brackets_line(line, pt, local)
            if new is None:
                continue
            if _is_caption_line(new, pt):
                local.append(("caption", new, ""))
                continue
            if new.lstrip().startswith("|"):
                new = _strip_cell_captions(new, pt, local)
            kept.append(new)
        drop = set()
        for a, z in _table_rows(kept):
            for r in range(a + 2, z):
                if all(not c for c in _cells(kept[r])):
                    drop.add(r)
                    local.append(("empty_row", kept[r], ""))
        out.append("\n".join(l for i, l in enumerate(kept) if i not in drop))
    if log is not None:
        log.extend(local)
    return "".join(out), len(local)


def invented_text_issues(markdown: str, text_layer: str) -> list:
    """Flag-only checks (reason `invented_text`): a table header row where no cell's text
    is on the page, and chart strings (axis labels, series names, legend entries) that
    are not on the page. Returns [(kind, text)]."""
    from diagram_schema import FENCE_INFO, extract_blocks
    md = markdown or ""
    if not (text_layer or "").strip() or not md:
        return []
    pt = PageText(text_layer)
    issues = []
    for seg, is_block in _outside_blocks(md):
        if is_block:
            continue
        lines = seg.split("\n")
        for a, _z in _table_rows(lines):
            cells = [_EMPHASIS_STRIP_RE.sub("", c).strip() for c in _cells(lines[a])]
            cells = [c for c in cells if c and _ALPHA_WORD_RE.search(c)]
            if cells and not any(pt.on_page(c) for c in cells):
                issues.append(("table_header", lines[a].strip()))
    for b in extract_blocks(md):
        obj = b["obj"]
        if b["fence"] != FENCE_INFO or not isinstance(obj, dict) or obj.get("type") != "chart":
            continue
        strs = [obj.get("xLabel"), obj.get("yLabel")]
        legend = obj.get("legend")
        strs += legend if isinstance(legend, list) else [legend]
        for s_ in obj.get("series") or []:
            if isinstance(s_, dict):
                strs.append(s_.get("name"))
                if obj.get("chart_kind") == "pie":
                    strs += [p[0] for p in s_.get("points") or [] if isinstance(p, list) and p]
        for s_ in strs:
            if isinstance(s_, str) and s_.strip() and _ALPHA_WORD_RE.search(s_) and not pt.on_page(s_):
                issues.append(("chart_string", s_))
    return issues

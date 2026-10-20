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
    layer. Real printed URLs stay. Returns (markdown, n_stripped)."""
    n = 0
    out = []

    def repl(m):
        nonlocal n
        if _link_is_invented(m.group(3), text_layer):
            n += 1
            return m.group(2)
        return m.group(0)

    for seg, is_block in _outside_blocks(markdown):
        out.append(seg if is_block else _LINK_RE.sub(repl, seg))
    return "".join(out), n


# --- stray ")" left by the pre-R2 link regex (R2.04) ---------------------------
# The old _LINK_RE stopped at the first ")", so [Main Index](javascript:history.back())
# was stored as "Main Index)". Only short lines (nav bars) are touched, only a ")"
# with no "(" before it on the line, right after a letter, and only when that
# token (with the ")") is not printed in the text layer.

STRAY_PAREN_MAX_WORDS = 8


def strip_stray_parens(markdown: str, text_layer: str):
    """Returns (markdown, n_removed). Diagram blocks are never touched."""
    printed = exact_token_set(text_layer)
    n = 0
    out = []

    def fix_line(line):
        nonlocal n
        if len(re.findall(r"[A-Za-z]+", line)) > STRAY_PAREN_MAX_WORDS or ")" not in line:
            return line
        res, depth, i = [], 0, 0
        for i, ch in enumerate(line):
            if ch == "(":
                depth += 1
            elif ch == ")":
                if depth > 0:
                    depth -= 1
                elif i > 0 and line[i - 1].isascii() and line[i - 1].isalpha():
                    j = i
                    while j > 0 and not line[j - 1].isspace():
                        j -= 1
                    tok = line[j:i + 1]
                    if tok not in printed:
                        n += 1
                        continue
            res.append(ch)
        return "".join(res)

    for seg, is_block in _outside_blocks(markdown):
        out.append(seg if is_block else "\n".join(fix_line(l) for l in seg.split("\n")))
    return "".join(out), n

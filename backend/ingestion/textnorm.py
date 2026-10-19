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

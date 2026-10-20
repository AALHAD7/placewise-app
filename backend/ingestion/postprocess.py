"""Free, deterministic post-pass applied to every vision output before its
fidelity check (stdlib + diagram_schema + textnorm only: no Gemini, no Docling,
no DB, so offline tools can import it).

- collapse_multiline_labels_with_lines: one-line labels (R1.03)
- restore_quotes: curly quotes restored from the text layer (R1.07)
- strip_invented_links: invented Markdown link targets removed (R1.07)
- repair_tree_leaves: "children": [] added to tree leaves that lack it (R1.09)
- strip_stray_parens: ")" left by the pre-R2 link regex removed (R2.04)
- fix_nav_typos: a misspelt long word on a short line, repaired from the text layer (R2.04)
- escape_printed_hash: a printed "#" ("number of") read as a Markdown heading is escaped (R2.05)
"""
import json
import re
import unicodedata

from diagram_schema import FENCE_INFO, extract_blocks, has_bullet_lines, restore_quotes
from textnorm import _outside_blocks, normalize_exact, normalize_label, strip_invented_links, strip_stray_parens

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


def _fill_leaf_children(node, depth=0):
    """Adds "children": [] to issue_tree nodes that have a label but no
    children key (or children null). Structure only: no label is added or
    changed. Returns the number of nodes repaired."""
    if not isinstance(node, dict) or depth > 12:
        return 0
    n = 0
    if "label" in node and node.get("children") is None:
        node["children"] = []
        n += 1
    for c in node.get("children") or []:
        n += _fill_leaf_children(c, depth + 1)
    return n


def repair_tree_leaves(markdown: str):
    """R1.09: free repair before validation. Tree leaves written without
    "children" (FMS p52 AMO block) made the whole block invalid. Only parsed
    issue_tree placewise-diagram blocks that change are re-dumped.
    Returns (markdown, nodes_repaired)."""
    md = markdown or ""
    total = 0
    for b in reversed(extract_blocks(md)):
        obj = b["obj"]
        if b["fence"] != FENCE_INFO or not isinstance(obj, dict) or obj.get("type") != "issue_tree" \
                or b.get("in_table"):
            continue
        n = _fill_leaf_children(obj.get("root"))
        if n:
            total += n
            block = f"```{FENCE_INFO}\n" + json.dumps(obj, ensure_ascii=False) + "\n```"
            md = md[:b["start"]] + block + md[b["end"]:]
    return md, total


NAV_TYPO_MAX_WORDS = 6  # no longer used: review hardening limits typo repair to nav bars
# A casebook nav bar ("FMS Guesestimate Index | Main Index Delhi Schools The
# Consulting Club", FMS p97) is one line with the running header; it gets a
# slightly longer limit. 12 already let a content line through (p134 actions -> options).
NAV_BAR_MAX_WORDS = 10
_NAV_BAR_RE = re.compile(r"\bIndex\b.*\||\|.*\bIndex\b")
NAV_TYPO_MIN_LEN = 6
NAV_TYPO_MAX_DIST = 2
_WORD_RE = re.compile(r"[A-Za-z]+")


def levenshtein(a: str, b: str) -> int:
    """Plain edit distance (insert, delete, substitute)."""
    if len(a) < len(b):
        a, b = b, a
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def _match_case(src: str, word: str) -> str:
    if src.isupper():
        return word.upper()
    if src[:1].isupper():
        return word[:1].upper() + word[1:]
    return word


# Inflection / plural suffixes: "Customers" vs "customer" is a real word form,
# not a typo, so such a pair is never "repaired".
_INFLECTIONS = ("s", "es", "ed", "d", "ing", "er", "ers", "ly")


def _stems(w: str) -> set:
    out = {w}
    for suf in _INFLECTIONS:
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            out.add(w[:-len(suf)])
    if w.endswith("ies"):
        out.add(w[:-3] + "y")
    if w.endswith("e") and len(w) >= 4:
        out.add(w[:-1])  # "price" ~ "pricing", "priced"
    return out


def is_inflection_pair(a: str, b: str) -> bool:
    """True when a and b differ only by a plural/inflection suffix."""
    a, b = a.lower(), b.lower()
    return a != b and bool(_stems(a) & _stems(b))


def fix_nav_typos(markdown: str, text_layer: str, log=None):
    """R2.04, hardened after review: only on a nav-bar line ("Index" and a "|",
    <= 10 words) outside diagram blocks, a word of >= 6 letters that is not a text-layer word is
    replaced by the one text-layer word with the same first letter within edit
    distance <= 2 ("Guesestimate" -> "Guesstimate"). No change when
    zero or several text-layer words are that close, when the two differ only
    by a plural/inflection suffix, on any non-nav-bar line, on long lines, inside
    blocks, or inside a URL/path token. The text layer is NFKC-normalised first
    (ligatures such as "ﬁ"). `log` (optional list) receives
    (old, new) pairs. Returns (markdown, n_replaced)."""
    tl = unicodedata.normalize("NFKC", text_layer or "")
    tl_words = {w.lower() for w in _WORD_RE.findall(tl)}
    if not tl_words or not markdown:
        return markdown or "", 0
    long_words = [w for w in tl_words if len(w) >= NAV_TYPO_MIN_LEN - NAV_TYPO_MAX_DIST]
    n = 0

    def candidate(w):
        lw = w.lower()
        if len(lw) < NAV_TYPO_MIN_LEN or lw in tl_words:
            return None
        # same first letter: typos keep it; "University" -> "Diversity" (FMS p60) does not
        hits = [t for t in long_words if t[0] == lw[0] and abs(len(t) - len(lw)) <= NAV_TYPO_MAX_DIST
                and levenshtein(lw, t) <= NAV_TYPO_MAX_DIST and not is_inflection_pair(lw, t)]
        return hits[0] if len(hits) == 1 else None

    def fix_line(line):
        nonlocal n
        if not _NAV_BAR_RE.search(line) or len(_WORD_RE.findall(line)) > NAV_BAR_MAX_WORDS:
            return line
        def repl(m):
            nonlocal n
            # skip words that are part of a URL, path or e-mail token
            a, b = m.start(), m.end()
            while a > 0 and not line[a - 1].isspace():
                a -= 1
            while b < len(line) and not line[b].isspace():
                b += 1
            tok = line[a:b]
            if "/" in tok or "@" in tok or "." in tok.strip(".") or "_" in tok:
                return m.group(0)
            c = candidate(m.group(0))
            if c is None:
                return m.group(0)
            new = _match_case(m.group(0), c)
            n += 1
            if log is not None:
                log.append((m.group(0), new))
            return new
        return re.sub(r"(?<![A-Za-z])[A-Za-z]+(?![A-Za-z])", repl, line)

    out = []
    for seg, is_block in _outside_blocks(markdown):
        out.append(seg if is_block else "\n".join(fix_line(l) for l in seg.split("\n")))
    return "".join(out), n


_HASH_HEADING_RE = re.compile(r"^([ \t]*)((?:#[ \t]+)+)(\S.*)$")
HASH_MIN_WORDS = 2
HASH_WRAP_LINES = 3  # a printed line may wrap onto this many following text-layer lines
_LETTER_RE = re.compile(r"[^\W\d_]")


def _printed_hash_starts(text_layer: str) -> list:
    """Whitespace-collapsed text from every "#" that starts a text-layer line
    (only a non-letter prefix such as "(40%)" or a bullet may come before it,
    FMS p113), continued over the next HASH_WRAP_LINES lines (wrapped text)."""
    lines = (text_layer or "").splitlines()
    out = []
    for k, line in enumerate(lines):
        i = line.find("#")
        if i < 0 or _LETTER_RE.search(line[:i]):
            continue
        out.append(normalize_exact(" ".join([line[i:]] + lines[k + 1:k + 1 + HASH_WRAP_LINES])) + " ")
    return out


def escape_printed_hash(markdown: str, text_layer: str, log=None):
    """R2.05: "# population 400 M" on the slide means "number of", but as a
    Markdown line it renders as a heading and the "#" disappears (FMS p112:
    "# # # Dream11 players 6 M"). A line outside diagram blocks that starts
    with one or more "# " markers becomes "\\# <text>" only when the text layer
    prints "# <text>" at the start of a text-layer line (review hardening: not
    anywhere mid-line, see _printed_hash_starts; whitespace-collapsed, ends at a
    token boundary) and <text> has >= 2 words, i.e. the "#" is printed content, not heading markup.
    Every other heading is left alone. `log` gets (old line, new line).
    Returns (markdown, n_escaped)."""
    starts = _printed_hash_starts(text_layer)
    if not starts or not markdown:
        return markdown or "", 0
    n = 0

    def fix_line(line):
        nonlocal n
        m = _HASH_HEADING_RE.match(line)
        if not m:
            return line
        rest = m.group(3).rstrip()
        if rest.startswith("#") or len(rest.split()) < HASH_MIN_WORDS:
            return line
        printed = "# " + normalize_exact(rest) + " "
        if not any(s.startswith(printed) for s in starts):
            return line
        new = m.group(1) + "\\# " + rest
        n += 1
        if log is not None:
            log.append((line, new))
        return new

    out = []
    for seg, is_block in _outside_blocks(markdown):
        out.append(seg if is_block else "\n".join(fix_line(l) for l in seg.split("\n")))
    return "".join(out), n


def postprocess_markdown(markdown: str, text_layer: str, typo_log=None, hash_log=None):
    """The free deterministic repairs, in order: add missing "children": [] to
    tree leaves (R1.09), collapse multi-line labels,
    restore curly quotes from the text layer (R1.07), strip invented links
    (R1.07; nested-paren targets and stray ")" leftovers, R2.04), fix nav-line
    typos (R2.04), escape a printed "#" read as a heading (R2.05). Returns (markdown, label_lines, quotes_restored, links_stripped),
    links_stripped counting stray ")" removals too. `typo_log` (optional list)
    receives the (old, new) typo replacements, `hash_log` the escaped lines. Applied to every attempt before check_page."""
    md, _n_leaves = repair_tree_leaves(markdown)
    md, label_lines = collapse_multiline_labels_with_lines(md)
    md, n_quotes = restore_quotes(md, text_layer)
    md, n_links = strip_invented_links(md, text_layer)
    md, n_parens = strip_stray_parens(md, text_layer)
    md, _n_typos = fix_nav_typos(md, text_layer, log=typo_log)
    md, _n_hash = escape_printed_hash(md, text_layer, log=hash_log)
    return md, label_lines, n_quotes, n_links + n_parens

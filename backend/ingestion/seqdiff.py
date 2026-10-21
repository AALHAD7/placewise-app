"""R2.09 pattern 1: ordered word-and-punctuation diff of the markdown prose against the
page text layer (stdlib + textnorm only; no Gemini, no DB).

The bag-of-words `word_coverage` cannot see a small word dropped or changed in dialogue
prose ("10% decline in [profits for] the steel industry players"), nor a changed full
stop. This module aligns the prose tokens of the markdown with the text-layer tokens in
order, repairs small, well-anchored differences from the text layer, and reports the
differences it cannot repair safely (fidelity reason `seq_diff`).

- Tokens: words (inner apostrophes, hyphens, slashes, "&", decimal points and digit
  commas kept: "I'm", "South-West", "3.5", "1,000", "10%") and the marks . ? ! , ; :
  Compared case-insensitively after NFKC and quote folding.
- Prose only: markdown lines outside diagram blocks that are not headings, table rows,
  nav bars, `Diagram summary:` lines, and hold no "$", backslash or link.
- A text-layer token with no markdown match is a *real* deletion only if the page prints
  that token more often than the whole markdown holds it (coverage_text, blocks and
  tables included): a multiset deficit. This keeps out header, footer and diagram text
  that is only out of order. A markdown token with no text-layer match is a real
  insertion only if the markdown holds it more often than the text layer.
- Boilerplate (text-layer lines on >= 20% of a document's pages, see boilerplate_lines)
  is dropped from the text-layer side before aligning.

Repair is local, never a whole-page replacement: the text layer has no headings, lists,
tables or turn breaks, and its order is wrong on column stacks, chevrons and callouts.
"""
import difflib
import re
import unicodedata
from collections import Counter

from textnorm import _EXACT_HYPHEN_BREAK_RE, _TEXT_LAYER_FIXES, _outside_blocks, fold_quotes, normalize_exact

REPAIR_MAX_TOKENS = 4      # tokens changed on each side of one repaired op
REPAIR_ANCHOR = 3          # matched tokens directly before and after, on the same markdown line
SEQ_DIFF_MIN_TOKENS = 1    # flag when more than this many real tokens differ after repair
WHOLE_LINE_MIN_WORDS = 3   # a deleted whole text-layer line this long always flags
BOILERPLATE_SHARE = 0.20   # a text-layer line on >= 20% of the pages is header/footer
BOILERPLATE_MIN_PAGES = 2
# A markdown line of <= this many words that mostly matches nothing in the text layer is
# text printed inside an image (logo subtitle, picture heading: FMS p2, p5, p85). The text
# layer cannot judge it, so it is not counted as an insertion (captions: invented_text).
IMAGE_LINE_MAX_WORDS = 6

_TOKEN_RE = re.compile(r"[^\W_]+(?:(?:['’‘′\-/.&]|(?<=\d),(?=\d))[^\W_]+)*%?|[.?!,;:]")
_PUNCT = set(".?!,;:")
_SUMMARY_PREFIX = "Diagram summary:"
_LINK_RE = re.compile(r"\]\(|https?://|www\.")
_FORBIDDEN_IN_SPAN = set("*_`[]<>|")
# Characters a repaired text-layer span may carry besides tokens and spaces.
_SPAN_OK_RE = re.compile(r"^[\w\s.?!,;:'’‘′\"“”()%&/\-–]*$")


def _key(tok: str) -> str:
    return fold_quotes(unicodedata.normalize("NFKC", tok)).lower()


def _line_key(line: str) -> str:
    return fold_quotes(normalize_exact(unicodedata.normalize("NFKC", line or ""))).lower()


def _prep_text_layer(text_layer: str) -> str:
    t = unicodedata.normalize("NFKC", text_layer or "").translate(_TEXT_LAYER_FIXES)
    return _EXACT_HYPHEN_BREAK_RE.sub("-", t)


def boilerplate_lines(text_layers) -> set:
    """Normalized text-layer lines that appear on >= 20% of a document's pages (and on at
    least 2 pages): running headers, footers and nav lines. Compute once per document."""
    layers = [t for t in (text_layers or []) if (t or "").strip()]
    if not layers:
        return set()
    seen = Counter()
    for t in layers:
        seen.update({k for k in (_line_key(l) for l in _prep_text_layer(t).split("\n")) if k})
    need = max(BOILERPLATE_MIN_PAGES, BOILERPLATE_SHARE * len(layers))
    return {k for k, c in seen.items() if c >= need}


def _tokens(text: str):
    return [_key(m.group(0)) for m in _TOKEN_RE.finditer(text or "")]


def _is_word(k: str) -> bool:
    return k not in _PUNCT


def _is_prose_line(line: str) -> bool:
    from postprocess import _NAV_BAR_RE  # lazy: postprocess imports this module
    s = line.strip()
    if not s or s.startswith("#") or s.startswith("|") or s.startswith(_SUMMARY_PREFIX):
        return False
    if s.startswith("```") or set(s) <= set("-=*_ "):
        return False
    # "|" also catches table rows written without a leading pipe (FMS p62) and "a | b" headers
    if _NAV_BAR_RE.search(s) or "$" in s or "\\" in s or "|" in s or "<" in s or _LINK_RE.search(s):
        return False
    return True


def _is_boilerplate_line(keys, bp_vocab) -> bool:
    """A markdown line made only of boilerplate words and numbers (a running footer the
    model wrote as "© Club, School | 2023-24 | 136")."""
    words = [k for k in keys if _is_word(k)]
    return bool(bp_vocab) and len(words) >= 2 and all(k in bp_vocab or k.isdigit() for k in words)


def _md_prose_tokens(markdown: str, bp_vocab=frozenset()):
    """[(key, start, end, line_id)] for prose tokens, spans in the original markdown."""
    out, pos, line_id = [], 0, 0
    for seg, is_block in _outside_blocks(markdown):
        if not is_block:
            off = pos
            for line in seg.split("\n"):
                if _is_prose_line(line):
                    ms = list(_TOKEN_RE.finditer(line))
                    if not _is_boilerplate_line([_key(m.group(0)) for m in ms], bp_vocab):
                        for m in ms:
                            out.append((_key(m.group(0)), off + m.start(), off + m.end(), line_id))
                off += len(line) + 1
                line_id += 1
        pos += len(seg)
    return out


def _tl_tokens(tl: str, boilerplate):
    """[(key, start, end, line_no)] over the prepared text layer, boilerplate lines dropped,
    plus {line_no: n_tokens} for the kept lines."""
    out, per_line, off = [], {}, 0
    for ln, line in enumerate(tl.split("\n")):
        if not (boilerplate and _line_key(line) in boilerplate):
            toks = [(_key(m.group(0)), off + m.start(), off + m.end(), ln) for m in _TOKEN_RE.finditer(line)]
            if toks:
                per_line[ln] = toks
                out += toks
        off += len(line) + 1
    return out, per_line


def _no_text_layer(text_layer) -> bool:
    return not (text_layer or "").strip()


def _anchor(A, B, per_line, md_lines, codes, idx):
    """How op `idx` is anchored. Returns (ok, md_after, tl_after): ok when it has
    REPAIR_ANCHOR matched tokens directly before AND after on one markdown line, where one
    side (not both) may instead be a line boundary on both the markdown and the text layer
    (a line start with >= 1 matched token before the op, or a line end right after it).
    md_after / tl_after: is there a matched token after the op on that line."""
    tag, i1, i2, j1, j2 = codes[idx]
    prev_eq = codes[idx - 1] if idx > 0 else None
    next_eq = codes[idx + 1] if idx + 1 < len(codes) else None
    if prev_eq is None or i1 == 0 or j1 == 0:
        return False, False, False   # the span must start after a matched token
    lid = A[i1 - 1][3]
    line_idx = md_lines[lid]
    if any(A[i][3] != lid for i in range(i1, i2)):
        return False, False, False
    run_before = prev_eq[2] - prev_eq[1]
    first_on_line = line_idx[0]
    k = i1 - first_on_line                    # tokens before the op on its md line
    full_before = run_before >= REPAIR_ANCHOR and k >= REPAIR_ANCHOR
    start_before = (1 <= k <= run_before and per_line[B[j1 - k][3]][0] is B[j1 - k])
    run_after = (next_eq[2] - next_eq[1]) if next_eq is not None else 0
    m_line = line_idx[-1] + 1 - i2            # tokens after the op on its md line
    full_after = run_after >= REPAIR_ANCHOR and m_line >= REPAIR_ANCHOR
    end_after = False
    if m_line == 0:
        last_tl = B[j2 - 1] if j2 > j1 else B[j1 - 1]
        end_after = per_line[last_tl[3]][-1] is last_tl
    ok = (full_before and (full_after or end_after)) or (start_before and full_after)
    return ok, full_after, full_after


def analyse(markdown: str, text_layer: str, boilerplate=None) -> dict:
    """Align markdown prose with the text layer. Returns
    {"ops": [op...], "real_tokens": int, "whole_line_deletions": int, "flag": bool}.
    Each op: tag, md_text, tl_text, real_del, real_ins, whole_line, repairable
    (+ md_span, replacement when repairable)."""
    from fidelity import coverage_text  # lazy: fidelity imports config
    empty = {"ops": [], "real_tokens": 0, "whole_line_deletions": 0, "flag": False}
    markdown = markdown or ""
    if _no_text_layer(text_layer) or not markdown.strip():
        return empty
    tl = _prep_text_layer(text_layer)
    bp_vocab = {k for line in (boilerplate or ()) for k in _tokens(line)}
    A = _md_prose_tokens(markdown, bp_vocab)
    B, per_line = _tl_tokens(tl, boilerplate)
    if not A and not B:
        return empty
    cov = Counter(_tokens(coverage_text(markdown)))
    tl_counts = Counter(k for k, *_ in B)
    tl_full = Counter(_tokens(tl))
    deficit = {k: c - cov.get(k, 0) for k, c in tl_counts.items() if c > cov.get(k, 0)}
    excess = {k: c - tl_full.get(k, 0) for k, c in cov.items() if c > tl_full.get(k, 0)}

    sm = difflib.SequenceMatcher(None, [a[0] for a in A], [b[0] for b in B], autojunk=False)
    codes = sm.get_opcodes()
    matched = [False] * len(A)
    for tag, i1, i2, _j1, _j2 in codes:
        if tag == "equal":
            for i in range(i1, i2):
                matched[i] = True
    md_lines = {}
    for i, a in enumerate(A):
        md_lines.setdefault(a[3], []).append(i)
    image_line = {lid for lid, idx in md_lines.items()
                  if sum(1 for i in idx if _is_word(A[i][0])) <= IMAGE_LINE_MAX_WORDS
                  and sum(1 for i in idx if not matched[i]) * 2 > len(idx)}

    cands = []
    for idx, (tag, i1, i2, j1, j2) in enumerate(codes):
        if tag == "equal":
            continue
        whole_line, whole_line_words = False, 0
        if j2 > j1:
            first, last = B[j1], B[j2 - 1]
            if per_line[first[3]][0] is first and per_line[last[3]][-1] is last:
                whole_line = True
                whole_line_words = sum(1 for k, *_ in B[j1:j2] if _is_word(k))
        anchored, md_after, tl_after = _anchor(A, B, per_line, md_lines, codes, idx)
        small = (i2 - i1) <= REPAIR_MAX_TOKENS and (j2 - j1) <= REPAIR_MAX_TOKENS
        cands.append({"idx": idx, "tag": tag, "i": (i1, i2), "j": (j1, j2), "whole_line": whole_line,
                      "whole_line_words": whole_line_words, "anchored": anchored and small and not whole_line,
                      "md_after": md_after, "tl_after": tl_after})

    # The multiset budget goes to small anchored ops first: an unrelated out-of-order run
    # (header, callout) must not use up the deficit of a word dropped mid-sentence.
    for c in sorted(cands, key=lambda c: (not c["anchored"], c["idx"])):
        i1, i2 = c["i"]
        j1, j2 = c["j"]
        real_del = 0
        for k, *_ in B[j1:j2]:
            if not c["anchored"] and len(k) == 1 and k.isalpha():
                continue  # a lone letter outside an anchored op is a badge/axis/bullet letter
            if deficit.get(k, 0) > 0:
                deficit[k] -= 1
                real_del += 1
        real_ins = 0
        for i in range(i1, i2):
            k, lid = A[i][0], A[i][3]
            if lid in image_line:
                continue  # a short line mostly unmatched in the text layer: image text
            if excess.get(k, 0) > 0:
                excess[k] -= 1
                real_ins += 1
        c["real_del"], c["real_ins"] = real_del, real_ins

    ops, real_total, whole_dels = [], 0, 0
    for c in cands:
        if not (c["real_del"] or c["real_ins"]):
            continue
        i1, i2 = c["i"]
        j1, j2 = c["j"]
        op = {"tag": c["tag"], "md_text": " ".join(a[0] for a in A[i1:i2]),
              "tl_text": " ".join(b[0] for b in B[j1:j2]), "real_del": c["real_del"],
              "real_ins": c["real_ins"], "whole_line": c["whole_line"], "repairable": False}
        if c["anchored"]:
            md_a = A[i1 - 1][2]
            md_b = A[i2][1] if c["md_after"] else (A[i2 - 1][2] if i2 > i1 else md_a)
            tl_a = B[j1 - 1][2]
            tl_b = B[j2][1] if c["tl_after"] else (B[j2 - 1][2] if j2 > j1 else tl_a)
            md_gap, tl_gap = markdown[md_a:md_b], tl[tl_a:tl_b]
            hi = j2 + 1 if c["tl_after"] else j2
            tl_lines = [b[3] for b in B[j1 - 1:hi]]
            contiguous = all(y - x <= 1 for x, y in zip(tl_lines, tl_lines[1:]))
            if contiguous and not (set(md_gap) & _FORBIDDEN_IN_SPAN) and not (set(tl_gap) & _FORBIDDEN_IN_SPAN) \
                    and "\n" not in md_gap and _SPAN_OK_RE.match(tl_gap):
                new = re.sub(r"\s+", " ", tl_gap)
                if not c["md_after"]:
                    new = new.rstrip()
                if new != md_gap:
                    op.update(repairable=True, md_span=(md_a, md_b), replacement=new)
        if c["whole_line"] and c["whole_line_words"] >= WHOLE_LINE_MIN_WORDS \
                and c["real_del"] >= c["whole_line_words"]:
            whole_dels += 1
        real_total += c["real_del"] + c["real_ins"]
        ops.append(op)
    flag = real_total > SEQ_DIFF_MIN_TOKENS or whole_dels > 0
    return {"ops": ops, "real_tokens": real_total, "whole_line_deletions": whole_dels, "flag": flag}


def repair_prose(markdown: str, text_layer: str, boilerplate=None, log=None):
    """Apply every repairable op (small, anchored on both sides on one markdown line, no
    emphasis marker or bracket, not a whole text-layer line). `log` receives
    (line_before, line_after) pairs. Returns (markdown, n_repairs). Idempotent."""
    md = markdown or ""
    if _no_text_layer(text_layer) or not md.strip():
        return md, 0
    res = analyse(md, text_layer, boilerplate)
    reps = sorted((op for op in res["ops"] if op["repairable"]), key=lambda o: o["md_span"][0], reverse=True)
    if not reps:
        return md, 0
    n = 0
    for op in reps:
        a, b = op["md_span"]
        ls = md.rfind("\n", 0, a) + 1
        le = md.find("\n", b)
        le = len(md) if le < 0 else le
        before = md[ls:le]
        md = md[:a] + op["replacement"] + md[b:]
        le2 = md.find("\n", a)
        after = md[ls:len(md) if le2 < 0 else le2]
        n += 1
        if log is not None:
            log.append((before, after))
    if log is not None:
        log.reverse()  # document order
    return md, n


def seq_diff_ops(markdown: str, text_layer: str, boilerplate=None) -> dict:
    """{"ops": n real ops left, "tokens": n real tokens, "whole_line_deletions": n, "flag": bool}
    on the given (already repaired) markdown."""
    res = analyse(markdown, text_layer, boilerplate)
    return {"ops": len(res["ops"]), "tokens": res["real_tokens"],
            "whole_line_deletions": res["whole_line_deletions"], "flag": res["flag"]}

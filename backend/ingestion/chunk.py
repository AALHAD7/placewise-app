"""Step 6: chunking at structure, not fixed size. Splits the assembled
document Markdown at headings and clear item boundaries, keeping one
case/guesstimate (with its solution) in one chunk even across a page break,
and records page_start/page_end per chunk.

Fence-aware (R1.04): a ``` fenced block (above all a `placewise-diagram` block)
is never split, and never separated from the `Diagram summary:` line that
follows it. Boundary labels inside a fence are ignored. `embedding_text()`
turns diagram JSON into plain language for the embedding input; the stored
chunk `content` keeps the raw block because the frontend draws from it."""
import re

from diagram_schema import FENCE_INFO, SUMMARY_PREFIX, collect_labels, extract_blocks

PAGE_SENTINEL = "\x00PAGE:{}\x00"
PAGE_SENTINEL_RE = re.compile(r"\x00PAGE:(\d+)\x00")

# Heading lines (Markdown # or ##) OR explicit item-boundary labels
# ("Case 3", "Guesstimate:", "Question:") start a new chunk.
BOUNDARY_RE = re.compile(
    r"^(#{1,3}\s+.+|(?:Case|Guesstimate|Question|Framework)\s*[:\-]?\s*\d*.*)$",
    re.MULTILINE
)

MAX_CHUNK_CHARS = 6000  # a chunk longer than this gets split with overlap
OVERLAP_CHARS = 400
EMBED_LABELS_CAP = 400  # chars of diagram labels put into the embedding text

_FENCE_OPEN_RE = re.compile(r"^```[ \t]*([^\s`]*)[ \t]*$")
_FENCE_CLOSE_RE = re.compile(r"^```[ \t]*$")
_FENCE_LINE_RE = re.compile(r"^[ \t]*```[^\n]*$", re.MULTILINE)
_DIAGRAM_FENCE_RE = re.compile(r"^```placewise-diagram[ \t]*$", re.MULTILINE)


def protected_spans(text: str) -> list:
    """Character spans [start, end) that must never be cut: every ``` fenced
    block, extended over trailing blank lines and a following
    `Diagram summary:` line. A fence left open is closed at the next page
    sentinel (pages are converted one at a time, so a fence can never
    legitimately cross a page) or at the end of the text."""
    lines = text.split("\n")
    offsets, pos = [], 0
    for line in lines:
        offsets.append(pos)
        pos += len(line) + 1

    def line_end(k):
        return min(offsets[k] + len(lines[k]), len(text))

    spans = []
    i = 0
    while i < len(lines):
        if not _FENCE_OPEN_RE.match(lines[i]):
            i += 1
            continue
        close = None
        stop = len(lines) - 1
        for j in range(i + 1, len(lines)):
            if PAGE_SENTINEL_RE.search(lines[j]):
                stop = j - 1
                break
            if _FENCE_CLOSE_RE.match(lines[j]):
                close = j
                break
        last = close if close is not None else max(stop, i)
        end = line_end(last)
        if close is not None:
            # Pull the summary line (after any blank lines) into the span.
            k = close + 1
            while k < len(lines) and not lines[k].strip():
                k += 1
            if k < len(lines) and lines[k].strip().startswith(SUMMARY_PREFIX):
                end = line_end(k)
                last = k
        spans.append((offsets[i], end))
        i = last + 1
    return spans


def _inside(pos: int, spans: list):
    """The span that strictly contains `pos` (start < pos < end), else None."""
    for s, e in spans:
        if s < pos < e:
            return (s, e)
    return None


def has_diagram(content: str) -> bool:
    return bool(_DIAGRAM_FENCE_RE.search(content or ""))


def _split_long_spans(text: str) -> list:
    """Split `text` into [start, end) spans of <= MAX_CHUNK_CHARS (where
    possible) with OVERLAP_CHARS overlap, never cutting or starting inside a
    protected span and never repeating a whole block in two parts. A single
    block + summary longer than MAX_CHUNK_CHARS is kept whole as its own
    (oversized) part. Works on text that still carries page sentinels, so
    each part's page range can be computed from its own span."""
    spans = protected_spans(text)
    parts = []
    start = 0
    n = len(text)
    while n - start > MAX_CHUNK_CHARS:
        cut = start + MAX_CHUNK_CHARS
        # Prefer a line break in the second half of the window.
        nl = text.rfind("\n", start + MAX_CHUNK_CHARS // 2, cut)
        if nl > start:
            cut = nl + 1
        hit = _inside(cut, spans)
        if hit:
            cut = hit[0]  # move the cut back to before the fence
            if cut <= start:
                cut = hit[1]  # the block itself is the whole part: keep it intact
        parts.append((start, cut))
        if cut >= n:
            start = n
            break
        # Overlap: start the next part OVERLAP_CHARS back, at a line start,
        # but never inside a fence and never re-including a whole block.
        ns = max(cut - OVERLAP_CHARS, start + 1)
        nl = text.find("\n", ns, cut)
        ns = nl + 1 if nl != -1 else cut
        for s_, e_ in spans:
            if s_ < cut and e_ > ns:
                ns = max(ns, e_)
        start = min(ns, cut)
    if start < n:
        parts.append((start, n))
    return parts


def _split_long(text: str) -> list:
    """Text parts of _split_long_spans (sentinels, if any, kept)."""
    out = [text[s:e].strip("\n") for s, e in _split_long_spans(text)]
    return [p for p in out if p.strip()]


def _diagram_sentence(obj) -> str:
    t = obj.get("type") if isinstance(obj, dict) else None
    title = obj.get("title") if isinstance(obj, dict) else None
    title = title.strip() if isinstance(title, str) and title.strip() else "untitled"
    labels = collect_labels(obj)
    if isinstance(obj.get("title"), str) and labels and labels[0] == obj["title"]:
        labels = labels[1:]  # collect_labels puts the title first
    seen, picked, used = set(), [], 0
    for lab in labels:
        lab = " ".join(lab.split())
        if not lab or lab.lower() in seen:
            continue
        add = len(lab) + (2 if picked else 0)
        if used + add > EMBED_LABELS_CAP:
            if not picked:
                picked.append(lab[:EMBED_LABELS_CAP])
            break
        seen.add(lab.lower())
        picked.append(lab)
        used += add
    out = f"Diagram ({t or 'unknown'}): {title}."
    if picked:
        out += f" Labels: {'; '.join(picked)}."
    return out


def embedding_text(content: str) -> str:
    """Plain-language text to embed for a chunk. Each diagram block becomes
    `Diagram (<type>): <title>. Labels: <labels>.`; its `Diagram summary:` line
    stays. A block whose JSON does not parse is dropped (its summary line
    stays). Any other fence marker lines are removed. Sentinels are stripped
    and whitespace is collapsed."""
    text = PAGE_SENTINEL_RE.sub("\n", content or "")
    pieces, pos = [], 0
    for b in extract_blocks(text):
        pieces.append(text[pos:b["start"]])
        if b["obj"] is not None and b["parse_error"] is None:
            pieces.append(_diagram_sentence(b["obj"]))
        pos = b["end"]
    pieces.append(text[pos:])
    out = "\n".join(pieces)
    out = _FENCE_LINE_RE.sub("", out)
    return " ".join(out.split())


def close_open_fence(md: str) -> str:
    """If a page's Markdown ends inside a ``` fence (e.g. a truncated
    placewise-diagram block), close it on that page, so the next pages' text
    is not swallowed by the fence when chunked, embedded or rendered. The
    broken block itself is already flagged invalid_json by fidelity."""
    md = md or ""
    open_ = False
    for line in md.split("\n"):
        if not open_ and _FENCE_OPEN_RE.match(line):
            open_ = True
        elif open_ and _FENCE_CLOSE_RE.match(line):
            open_ = False
    if not open_:
        return md
    return md + ("" if md.endswith("\n") else "\n") + "```"


def assemble_with_sentinels(pages: list) -> str:
    """pages: list of {"page_no", "markdown"} in order. Any fence left open
    on a page is closed on that page."""
    parts = []
    for p in pages:
        parts.append(PAGE_SENTINEL.format(p["page_no"]))
        parts.append(close_open_fence(p["markdown"]))
    return "\n".join(parts)


def _page_range_for_span(full: str, start: int, end: int, first_page: int) -> tuple:
    """page_start/page_end of the real content in full[start:end]: the page in
    effect at its first and last non-blank character. A sentinel that sits
    after the last content (i.e. just before the next chunk's heading) does
    not count, and the page in effect at `start` counts even when the
    sentinel lies before the span."""
    marks = [(m.start(), m.end(), int(m.group(1))) for m in PAGE_SENTINEL_RE.finditer(full)]

    def page_at(pos):
        page = first_page
        for s, _e, n in marks:
            if s <= pos:
                page = n
            else:
                break
        return page

    in_sentinel = set()
    for s, e, _n in marks:
        if e > start and s < end:
            in_sentinel.update(range(max(s, start), min(e, end)))
    content_pos = [i for i in range(start, end)
                   if i not in in_sentinel and not full[i].isspace()]
    if not content_pos:
        p = page_at(start)
        return p, p
    return page_at(content_pos[0]), page_at(content_pos[-1])


def chunk_document(pages: list) -> list:
    """Returns a list of {"page_start", "page_end", "section_title",
    "content", "parent_item_id", "has_diagram"} dicts. `content` has
    sentinels stripped and keeps diagram blocks raw (embed
    `embedding_text(content)` instead)."""
    full = assemble_with_sentinels(pages)

    # Split on boundaries, keeping the boundary line as the start of each
    # resulting piece.
    fences = protected_spans(full)
    matches = [m for m in BOUNDARY_RE.finditer(full) if not _inside(m.start(), fences)]
    spans = []
    if not matches or matches[0].start() > 0:
        start0 = 0
        end0 = matches[0].start() if matches else len(full)
        if full[start0:end0].strip(PAGE_SENTINEL_RE.pattern + " \n\x00"):
            spans.append((start0, end0))
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(full)
        spans.append((start, end))

    first_page = pages[0]["page_no"] if pages else 1
    chunks = []
    for start, end in spans:
        raw = full[start:end]
        page_start, page_end = _page_range_for_span(full, start, end, first_page)
        content = PAGE_SENTINEL_RE.sub("", raw).strip()
        if not content:
            continue
        heading_match = re.match(r"^#{1,3}\s+(.+)$", content.split("\n")[0])
        section_title = heading_match.group(1).strip() if heading_match else content.split("\n")[0][:80].strip()
        chunks.append({
            "page_start": page_start, "page_end": page_end,
            "section_title": section_title, "content": content,
            "parent_item_id": None, "has_diagram": has_diagram(content),
            "_span": (start, end),
        })

    # Split any over-long chunk with overlap, tagging the parts so they can
    # be rejoined (same parent_item_id, generated client-side at write time
    # since this module doesn't talk to the DB).
    final = []
    for c in chunks:
        span = c.pop("_span")
        if len(c["content"]) <= MAX_CHUNK_CHARS:
            final.append(c)
            continue
        # Split the span that still has its page sentinels, so every part
        # gets its own page range; strip the sentinels afterwards.
        s0, e0 = span
        pieces = []
        for ps, pe in _split_long_spans(full[s0:e0]):
            part = PAGE_SENTINEL_RE.sub("", full[s0 + ps:s0 + pe]).strip()
            if not part:
                continue
            p_start, p_end = _page_range_for_span(full, s0 + ps, s0 + pe, first_page)
            pieces.append((part, p_start, p_end))
        for idx, (part, p_start, p_end) in enumerate(pieces):
            final.append({
                "page_start": p_start, "page_end": p_end,
                "section_title": f"{c['section_title']} (part {idx + 1}/{len(pieces)})",
                "content": part, "parent_item_id": "SPLIT",  # resolved to a real id at write time
                "has_diagram": has_diagram(part)
            })

    return final

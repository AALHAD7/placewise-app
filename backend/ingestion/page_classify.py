"""Step 3: page classification, code only, no LLM. Uses pypdfium2 (not
PyMuPDF - see the licensing note in the pilot report) for the text layer and
page-object geometry."""
import pypdfium2 as pdfium
import pypdfium2.raw as pdfium_c

from config import TEXT_MIN_CHARS, VISUAL_COVERAGE_THRESHOLD


BACKGROUND_OBJECT_AREA_FRACTION = 0.90  # a single object this large is almost
# certainly a decorative full-slide background/border, not real content -
# confirmed live: this corpus is mostly PPT-exported slide decks (per
# reextract_text.py's own comment), and nearly every slide's FIRST drawn
# path object is a full-page background rectangle. Without excluding it,
# every single page registered 100% "visual" coverage regardless of actual
# content density, which would have routed almost every page to Gemini
# vision and defeated the point of using Docling as the primary converter.

CHART_IMAGE_COVERAGE_THRESHOLD = 0.02  # a table page can ALSO carry a real
# embedded picture (a pie/bar chart pasted next to a bulleted cost/revenue
# table) that Docling's table parser is blind to - confirmed live on ISB
# Consulting Casebook 2025 pp.162/166/169/175 (checked against the real page
# images; a 5th originally-flagged low-score page, 177, turned out to have no
# chart at all - see log.md and run_r6_isb_patch.py) and on The FMS
# Consulting Casebook 2021-22 pp.53/56/57/60/63: every one of those pages'
# img_coverage (real image/picture objects only - NOT path_coverage, which is
# dominated by a table's own grid-line paths on every table page and so can't
# tell charts apart from plain tables) sits well above this corpus's ~0.0067
# baseline (one small logo/header asset shared by almost every page with no
# real picture at all). Below this, img_coverage is noise; at or above it,
# there's a real picture Docling will never see.


def _union_coverage(page, obj_types, grid=60) -> float:
    """Area-union of all objects of the given type(s), via grid
    rasterization - NOT a naive sum of bounding-box areas, which
    double-counts overlapping objects badly (confirmed live: a dense table's
    cell-border paths summed to 105%+ of the page area with naive summation,
    vs a sane 56.9% with this union approach)."""
    w, h = page.get_size()
    page_area = w * h
    covered = [[False] * grid for _ in range(grid)]
    for o in page.get_objects():
        if o.type not in obj_types:
            continue
        l, b, r, t = o.get_bounds()
        obj_area = max(0.0, r - l) * max(0.0, t - b)
        if page_area > 0 and obj_area / page_area >= BACKGROUND_OBJECT_AREA_FRACTION:
            continue
        x0 = max(0, min(grid - 1, int(l / w * grid)))
        x1 = max(0, min(grid - 1, int(r / w * grid)))
        y0 = max(0, min(grid - 1, int(b / h * grid)))
        y1 = max(0, min(grid - 1, int(t / h * grid)))
        for gx in range(x0, x1 + 1):
            for gy in range(y0, y1 + 1):
                covered[gx][gy] = True
    return sum(sum(row) for row in covered) / (grid * grid)


def _looks_like_tree_or_box_layout(page) -> bool:
    """Tried and DROPPED: "many short text fragments -> tree/box diagram"
    via pypdfium2's rect count/avg-length, per the spec's third visual
    signal. Confirmed live this doesn't discriminate - pypdfium2's "rects"
    turn out to be near word-level text runs, so ANY normal flowing
    paragraph averages ~6 chars/rect too (checked against this corpus's own
    foreword/copyright-notice pages, which are prose, not diagrams, and
    tripped this heuristic every time). Implementing a real version would
    need spatial clustering (e.g. scattered/non-monotonic Y-positions vs
    normal top-to-bottom reading order), which this pilot's scope doesn't
    cover - rather than ship a guessed threshold with unknown false-positive
    rate, this signal is disabled. The gap is covered by Step 5's automatic
    Docling-fidelity-triggered retry instead: a genuine diagram page
    misclassified as "text" will fail its word/number coverage check against
    Docling's output and get retried through Gemini vision anyway."""
    return False


def classify_page(page, docling_has_table: bool) -> dict:
    """Returns {"is_text", "is_table", "is_visual", "is_scanned",
    "text_layer", "img_coverage", "path_coverage"}. A page can flag more
    than one (a table page is also text-bearing); booleans per the ground
    rule, checked in priority order so a dense table's own grid-line
    coverage doesn't get it misrouted to "visual" (Gemini vision) when
    Docling already handles tables natively with zero LLM calls."""
    text_layer = page.get_textpage().get_text_range()
    img_cov = _union_coverage(page, {pdfium_c.FPDF_PAGEOBJ_IMAGE})
    path_cov = _union_coverage(page, {pdfium_c.FPDF_PAGEOBJ_PATH})
    combined_cov = _union_coverage(page, {pdfium_c.FPDF_PAGEOBJ_IMAGE, pdfium_c.FPDF_PAGEOBJ_PATH})
    tree_pattern = _looks_like_tree_or_box_layout(page)

    has_embedded_picture = img_cov >= CHART_IMAGE_COVERAGE_THRESHOLD
    # A Docling-detected table on a page that ALSO carries a real embedded
    # picture (not just grid-line paths) must not be routed to Docling -
    # Docling reads the table but has no way to read the picture at all,
    # silently losing it (e.g. a pie chart's numbers). Route the whole page
    # to Gemini vision instead; its prompt already turns plain tables into
    # Markdown tables, so nothing is lost by giving up the Docling table
    # parse on these pages specifically.
    is_table = docling_has_table and not has_embedded_picture
    is_scanned = (len(text_layer.strip()) == 0) and combined_cov < 0.02 and img_cov < 0.02
    # A genuinely blank/near-blank page (no text, no meaningful graphics at
    # all) is scanned-with-nothing-found rather than visual - distinct from
    # a scanned page that DOES have visible content (handled below).
    is_scanned_with_content = (len(text_layer.strip()) == 0) and not is_scanned

    is_visual = (not is_table) and (
        combined_cov >= VISUAL_COVERAGE_THRESHOLD
        or tree_pattern
        or (len(text_layer.strip()) < TEXT_MIN_CHARS and combined_cov > 0.02)
        or is_scanned_with_content
        or has_embedded_picture
    )
    is_text = (not is_table) and (not is_visual) and (not is_scanned) and len(text_layer.strip()) >= TEXT_MIN_CHARS

    return {
        "is_text": is_text,
        "is_table": is_table,
        "is_visual": is_visual or is_scanned_with_content,
        "is_scanned": is_scanned,
        "text_layer": text_layer,
        "img_coverage": img_cov,
        "path_coverage": path_cov,
        "combined_coverage": combined_cov
    }


def render_page_png(page, dpi: int) -> bytes:
    scale = dpi / 72.0
    bitmap = page.render(scale=scale)
    pil_image = bitmap.to_pil()
    import io
    buf = io.BytesIO()
    pil_image.save(buf, format="PNG")
    return buf.getvalue()

"""Regression test for the R6 routing bug: a page Docling flags as a table
that ALSO carries a real embedded picture (e.g. a pie chart next to a
bulleted cost/revenue table) must route to Gemini vision, not Docling -
Docling reads the table but is blind to the picture, silently losing its
numbers. Geometry values below are REAL, not invented: measured live with
this repo's own page_classify.classify_page against the actual PDF pages of
`ISB Consulting Casebook 2025.pdf` during the R6 routing-bug investigation
(2026-10-31) - see log.md and run_r6_isb_patch.py for the full story,
before/after fidelity scores and the real pie-chart numbers these pages
print (e.g. p169: Reliance Jio 50.9%, Airtel 31.1%, Vodafone Idea 13%,
Others 3.4%, BSNL 1.5% - all captured correctly after this fix, 0.33 ->
1.0 number_coverage)."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pypdfium2.raw as pdfium_c
from page_classify import CHART_IMAGE_COVERAGE_THRESHOLD, classify_page


class _FakeObj:
    def __init__(self, obj_type, bounds):
        self.type = obj_type
        self._bounds = bounds

    def get_bounds(self):
        return self._bounds


class _FakeTextPage:
    def __init__(self, text):
        self._text = text

    def get_text_range(self):
        return self._text


def _rect_for_fraction(frac, w, h):
    """One rectangle anchored at the origin whose area is `frac` of w*h -
    close enough for _union_coverage's grid rasterization to reproduce a
    real measured img_coverage/path_coverage within rounding."""
    if not frac:
        return None
    side = frac ** 0.5
    return (0.0, 0.0, w * side, h * side)


class _FakePage:
    """Stands in for a pypdfium2 page, reproducing one real casebook page's
    measured geometry (img/path area coverage) without needing the source
    PDF at test time."""

    def __init__(self, text_layer, img_frac, path_frac, w=2000.0, h=1125.0):
        self._size = (w, h)
        self._textpage = _FakeTextPage(text_layer)
        objs = []
        img_rect = _rect_for_fraction(img_frac, w, h)
        if img_rect:
            objs.append(_FakeObj(pdfium_c.FPDF_PAGEOBJ_IMAGE, img_rect))
        path_rect = _rect_for_fraction(path_frac, w, h)
        if path_rect:
            objs.append(_FakeObj(pdfium_c.FPDF_PAGEOBJ_PATH, path_rect))
        self._objs = objs

    def get_size(self):
        return self._size

    def get_textpage(self):
        return self._textpage

    def get_objects(self):
        return self._objs


# Real text layers (trimmed) from the real pages, pulled from the stored
# ingest_pages rows of ISB Consulting Casebook 2025.pdf (document_id
# f3da976f-669c-47a3-875a-22e3fe8afe51).
P169_TEXT = ("Overview\nThe Telecom Industry facilitates communication by providing a broad "
             "range of services such as - Voice Services\nBusiness Model - Cost Drivers\n"
             "Spectrum Acquisition and Licensing Fees\nMarket Share\nReliance Jio 50.9%\n"
             "Bharti Airtel 31.1%\nVodafone Idea 13%\nBSNL 1.5%\nOthers 3.4%")
P177_TEXT = ("Healthcare (Hospitals and Clinics) Industry\nOverview\nBusiness Model\n"
             "Porter’s 5 forces\nBargaining power of suppliers :High")
P_CLEAN_TABLE_TEXT = ("Sector Index Main Index\nONGC INR 2.1\nTCS INR 3,450\n"
                       "Revenue Drivers\nCost Drivers")


class TestChartTableRouting(unittest.TestCase):
    def test_table_with_embedded_chart_routes_to_vision(self):
        """p169: real telecom pie chart + a real Cost/Revenue Drivers table
        Docling detects. img_coverage=0.1, path_coverage=0.3972 (measured
        live). Before the fix: is_table short-circuited to True regardless,
        forcing Docling and losing the chart (number_coverage 0.33 in the
        live v1 ISB ingest). After the fix: the real embedded picture wins
        and the page routes to vision."""
        page = _FakePage(P169_TEXT, img_frac=0.1, path_frac=0.3972)
        cls = classify_page(page, docling_has_table=True)
        self.assertFalse(cls["is_table"])
        self.assertTrue(cls["is_visual"])

    def test_plain_table_page_with_no_real_picture_stays_docling(self):
        """p177: same casebook, same page template, Docling also detects a
        table - but the real page has no chart at all (checked against the
        actual page image), and img_coverage sits at this corpus's ~0.0067
        baseline (one small shared logo asset), not a real picture. Must
        stay on Docling - this guards against the fix over-triggering on
        every table page's small decorative assets."""
        page = _FakePage(P177_TEXT, img_frac=0.0067, path_frac=0.3758)
        cls = classify_page(page, docling_has_table=True)
        self.assertTrue(cls["is_table"])
        self.assertFalse(cls["is_visual"])

    def test_clean_table_only_page_unaffected(self):
        """A plain table page with no embedded picture at all (img_coverage
        0.0) must be completely unaffected by this fix."""
        page = _FakePage(P_CLEAN_TABLE_TEXT, img_frac=0.0, path_frac=0.56)
        cls = classify_page(page, docling_has_table=True)
        self.assertTrue(cls["is_table"])
        self.assertFalse(cls["is_visual"])

    def test_threshold_boundary(self):
        """img_coverage must be compared against CHART_IMAGE_COVERAGE_THRESHOLD,
        not some other magic number - pins the constant so a future edit to
        it is a deliberate, visible change. Uses values well clear of the
        grid-rasterization's own rounding (grid=60) rather than the exact
        boundary, which the grid can nudge either way."""
        self.assertEqual(CHART_IMAGE_COVERAGE_THRESHOLD, 0.02)
        below = _FakePage(P177_TEXT, img_frac=0.0067, path_frac=0.3758)  # p177's real baseline
        above = _FakePage(P169_TEXT, img_frac=0.1, path_frac=0.3972)  # p169's real chart coverage
        self.assertTrue(classify_page(below, docling_has_table=True)["is_table"])
        self.assertFalse(classify_page(above, docling_has_table=True)["is_table"])

    def test_fms_five_chart_table_pages_route_to_vision(self):
        """Confirms the committed fix (commit 53a281b) covers FMS Consulting
        Casebook 2021-22's 5 chart+table pages (53, 56, 57, 60, 63), flagged
        in log.md 2026-10-31 as "the same bug, confirmed on a second
        casebook, not yet patched". These values are real: measured live
        this session with this repo's own page_classify.classify_page
        against the actual PDF pages of `The FMS Consulting Casebook
        2021-22.pdf` (img_coverage, path_coverage) - a read-only, code-only
        dry run (pypdfium2 geometry only, no Gemini/NVIDIA call, no
        ingestion, nothing written to ingest_pages/ingest_chunks). All 5 are
        well above CHART_IMAGE_COVERAGE_THRESHOLD (0.02) and this corpus's
        ~0.0067 no-picture baseline, so the already-fixed classifier routes
        every one of them to vision, same as ISB's 4 pages - no further
        code change needed for FMS; only the actual patch run (forbidden in
        this session) is left as a cheap follow-up."""
        real_geometry = {
            53: 0.0606, 56: 0.1611, 57: 0.0839, 60: 0.1036, 63: 0.0461,
        }
        for page_no, img_frac in real_geometry.items():
            with self.subTest(page_no=page_no):
                page = _FakePage(f"FMS p{page_no} text layer", img_frac=img_frac, path_frac=0.8)
                cls = classify_page(page, docling_has_table=True)
                self.assertFalse(cls["is_table"], f"p{page_no} should not stay on Docling")
                self.assertTrue(cls["is_visual"], f"p{page_no} should route to vision")

    def test_non_table_page_unaffected(self):
        """A page Docling does NOT flag as a table keeps its existing
        is_visual/is_text behavior - this fix only changes pages where
        docling_has_table is True."""
        page = _FakePage(P169_TEXT, img_frac=0.1, path_frac=0.3972)
        cls = classify_page(page, docling_has_table=False)
        self.assertFalse(cls["is_table"])
        self.assertTrue(cls["is_visual"])


if __name__ == "__main__":
    unittest.main()

"""R2.12 free fixes, not started at R2 close (log.md, 2026-10-21, "Free follow-ups"):
pattern 1 (ragged merged tables) and pattern 3 (raster-safe title strip). One test class
per fix; fixtures mirror the real FMS pages the patterns were found on (p236, p25)."""
import json
import unittest

from diagram_schema import FENCE_INFO
from textnorm import PageText, _block_has_verifiable_content, _null_block_title, ragged_table_issues


class TestRaggedTable(unittest.TestCase):
    """FMS p236: two source tables written as one Markdown table, so body rows don't
    line up with the header. Every word is still present, so word_coverage misses it."""

    def test_ragged_rows_flagged(self):
        md = ("| Hours of the day | # Operating Hours | # Customers (per hour) | Products "
              "| Perc of Customers | Price per unit |\n"
              "| --- | --- | --- | --- | --- | --- |\n"
              "| Mon-Fri | Sat | Hot Coffee | 60% | 40 |\n"
              "| Peak | 4 | 12 | 20 | Pastries | 30% | 30 |\n"
              "| Non-Peak | 8 | 0 | 10 | Water Bottle | 10% | 20 |\n")
        issues = ragged_table_issues(md)
        self.assertEqual(len(issues), 3)

    def test_regular_table_untouched(self):
        md = "| a | b |\n| --- | --- |\n| 1 | 2 |\n| 3 | 4 |\n"
        self.assertEqual(ragged_table_issues(md), [])

    def test_table_inside_diagram_block_ignored(self):
        obj = {"type": "table", "title": None, "source_page": 1, "notes": [],
               "header": ["a", "b"], "rows": [["1", "2", "3"]]}
        md = "```" + FENCE_INFO + "\n" + json.dumps(obj) + "\n```"
        self.assertEqual(ragged_table_issues(md), [])


class TestRasterSafeTitleStrip(unittest.TestCase):
    """FMS p25: an income-statement table rendered as a raster image, with no text-layer
    overlap anywhere under it. The old strip nulled its real, printed title because
    nothing in the block (the title included) could be found on the page - it judged
    "not printed" on a region with no OCR text at all, not on a genuinely invented title.
    "Gross Profit" is a real accounting term the surrounding bullet list explains in
    prose elsewhere on the page; a plain word-level check must not treat that shared
    vocabulary as proof the raster table itself has text-layer coverage."""

    TL_RASTER_PAGE = ("Basics of Accounting\nImportant Line Items\n"
                      "Gross Profit: Gross profit refers to a company's profits after "
                      "subtracting the costs of producing and distributing its products.")

    def test_title_kept_when_block_is_pure_raster(self):
        obj = {"type": "table", "title": "XYZ Shoe company Income Statement (in lakhs)",
               "source_page": 25, "notes": [],
               "header": ["Revenue:", "20X1", "20X2"],
               "rows": [["Gross Profit", "1560", "1496"], ["Total Revenue", "3160", "3016"]]}
        pt = PageText(self.TL_RASTER_PAGE)
        self.assertFalse(_block_has_verifiable_content(obj, pt))
        raw = "```" + FENCE_INFO + "\n" + json.dumps(obj) + "\n```"
        self.assertEqual(_null_block_title(raw, obj, pt, []), raw)

    def test_title_stripped_when_block_has_no_numbers_and_a_label_is_on_page(self):
        tl = "FMS Main Index Practice Cases Profitability Growth\nRevenue fell 10% last year"
        obj = {"type": "issue_tree", "title": "Revenue Breakdown Tree", "source_page": 1,
               "notes": [], "root": {"label": "Revenue", "children": []}}
        pt = PageText(tl)
        self.assertTrue(_block_has_verifiable_content(obj, pt))
        raw = "```" + FENCE_INFO + "\n" + json.dumps(obj) + "\n```"
        out = _null_block_title(raw, obj, pt, [])
        new = json.loads(out.split("\n", 1)[1].rsplit("```", 1)[0])
        self.assertIsNone(new["title"])

    def test_title_stripped_when_block_has_numbers_and_they_are_on_page(self):
        obj = {"type": "table", "title": "Invented Table Title", "source_page": 1,
               "notes": [], "header": ["Revenue"], "rows": [["1560"]]}
        pt = PageText("Revenue figures\n1560")
        self.assertTrue(_block_has_verifiable_content(obj, pt))
        raw = "```" + FENCE_INFO + "\n" + json.dumps(obj) + "\n```"
        out = _null_block_title(raw, obj, pt, [])
        new = json.loads(out.split("\n", 1)[1].rsplit("```", 1)[0])
        self.assertIsNone(new["title"])


if __name__ == "__main__":
    unittest.main()

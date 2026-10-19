"""Tests for diagram_preview.py rendering (no PDF, no network). Run from backend/ingestion:
    venv/bin/python -m unittest tests.test_diagram_preview -v
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from diagram_preview import diagram_html, page_section  # noqa: E402

TYPES = [
    {"type": "issue_tree", "root": {"label": "Profit", "children": [{"label": "Revenue", "children": []}]}},
    {"type": "matrix", "xAxis": "Product", "yAxis": "Market", "cols": ["Existing", "New"],
     "rows": ["Existing", "New"], "cells": [["Market Penetration", "Product Development"],
                                          ["Market Development", "Diversification"]]},
    {"type": "funnel", "stages": ["Awareness", "Purchase"]},
    {"type": "flow", "nodes": [{"id": "a", "label": "Valuable"}, {"id": "b", "label": "Rare"}],
     "edges": [{"from": "a", "to": "b", "label": "Yes"}]},
    {"type": "chart", "chart_kind": "bar", "xLabel": "Year", "yLabel": "Revenue (₹ Cr)",
     "series": [{"name": "Revenue", "points": [["FY22", 120], ["FY23", 145]]}]},
    {"type": "table", "header": ["A", "B"], "rows": [["1", "2"]]},
    {"type": "other", "description": "Odd picture", "labels": ["x1"]},
]


class Render(unittest.TestCase):
    def test_every_type_renders(self):
        expect = ["<li>Profit", "<table>", "<ol class='funnel'>", "<td>Rare</td>", "<td>145</td>",
                  "<td>2</td>", "Odd picture"]
        for obj, needle in zip(TYPES, expect):
            self.assertIn(needle, diagram_html(obj), obj["type"])
        self.assertIn("Market Penetration", diagram_html(TYPES[1]))

    def test_escapes_and_survives_bad_shapes(self):
        out = diagram_html({"type": "funnel", "stages": ["<script>alert(1)</script>"]})
        self.assertNotIn("<script>", out)
        self.assertIn("&lt;script&gt;", out)
        self.assertIn("unknown type", diagram_html({"type": "venn"}))
        diagram_html({"type": "matrix", "cells": "nope"})
        diagram_html({"type": "chart", "series": [{"name": "s", "points": [5]}]})

    def test_page_section_shows_issues_and_summary(self):
        md = '```placewise-diagram\n{"type": "funnel", "title": "F", "source_page": 3, "notes": [], "stages": ["A", "B"]}\n```\n\nDiagram summary: Two <stages>.\n'
        page = {"markdown": md, "diagram_issues": [{"block": 0, "code": "label_not_on_page",
                                                    "severity": "error", "detail": "B"}],
                "diagram_label_coverage": 0.5}
        html = page_section(3, page, "pages/p3.png")
        self.assertIn("class='issues'", html)
        self.assertIn("Two &lt;stages&gt;.", html)
        self.assertIn("50%", html)
        self.assertIn("src='pages/p3.png'", html)


if __name__ == "__main__":
    unittest.main()

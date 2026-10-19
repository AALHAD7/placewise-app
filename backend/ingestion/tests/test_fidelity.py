"""Tests for fidelity.check_page. Run from backend/ingestion:
    venv/bin/python -m unittest discover -s tests -v
Imports config.py, which loads backend/.env (no network, no Gemini calls).
"""
import importlib.util
import json
import os
import sys
import unittest

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)

import fidelity  # noqa: E402
from fidelity import check_page, extract_numbers  # noqa: E402

V1_KEYS = {"number_coverage", "word_coverage", "unreadable_count", "needs_review"}
V2_KEYS = V1_KEYS | {"diagram_count", "diagrams", "diagram_issues", "diagram_label_coverage",
                     "diagram_errors", "review_reasons"}

ANSOFF_TEXT = (
    "Ansoff Matrix\nProduct\nExisting New\nMarket\nExisting\nMarket\nPenetration\n"
    "Product\nDevelopment\nNew\nMarket\nDevelopment Diversification\n"
    "© The Consulting Club, FMS Delhi | 2023-24 | 19"
)
ANSOFF = {
    "type": "matrix", "title": "Ansoff Matrix", "source_page": 20, "notes": [],
    "xAxis": "Product", "yAxis": "Market", "cols": ["Existing", "New"], "rows": ["Existing", "New"],
    "cells": [["Market Penetration", "Product Development"], ["Market Development", "Diversification"]],
}


def page_md(obj, summary=True):
    md = ("# Ansoff Matrix\n\n```placewise-diagram\n" + json.dumps(obj) + "\n```\n")
    if summary:
        md += "\nDiagram summary: Four growth strategies by product and market.\n"
    return md + "\n© The Consulting Club, FMS Delhi | 2023-24 | 19\n"


def _load_v1():
    """The pre-R1 fidelity.py, if a copy is available, for a v1-equivalence check."""
    path = os.environ.get("FIDELITY_V1_PATH")
    if not path or not os.path.exists(path):
        return None
    spec = importlib.util.spec_from_file_location("fidelity_v1", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class TestCheckPage(unittest.TestCase):
    def test_reexports_extract_numbers(self):
        self.assertEqual(extract_numbers("₹1,200 and 45% in 2023-24"), {"1200", "45", "2023-24"})

    def test_no_blocks_behaves_like_v1(self):
        text = "Revenue grew 12% to ₹450 Cr in FY23 driven by volume"
        cases = [
            (text, text, False),                                   # perfect
            (text, "Revenue grew to ₹450 Cr in FY23", False),     # lost words + number
            (text, text + " [UNREADABLE]", False),                 # unreadable marker
            ("", "anything", False),                               # no text layer
            (text, text, True),                                    # scanned
        ]
        expected = [
            (1.0, 1.0, 0, False, []),
            (None, None, 0, True, None),
            (1.0, 1.0, 1, True, ["unreadable"]),
            (None, None, 0, True, ["scanned"]),
            (None, None, 0, True, ["scanned"]),
        ]
        v1 = _load_v1()
        for (tl, md, scanned), (nc, wc, uc, nr, reasons) in zip(cases, expected):
            res = check_page(tl, md, scanned)
            self.assertEqual(set(res), V2_KEYS)
            self.assertEqual(res["diagram_count"], 0)
            self.assertEqual(res["needs_review"], nr)
            self.assertEqual(res["unreadable_count"], uc)
            if nc is not None:
                self.assertEqual((res["number_coverage"], res["word_coverage"]), (nc, wc))
            if reasons is not None:
                self.assertEqual(res["review_reasons"], reasons)
            if v1 is not None:
                old = v1.check_page(tl, md, scanned)
                self.assertEqual({k: res[k] for k in V1_KEYS}, old)
        lost = check_page(*cases[1])
        self.assertLess(lost["number_coverage"], 1.0)
        self.assertEqual(set(lost["review_reasons"]), {"number_coverage", "word_coverage"})

    def test_valid_block_full_coverage_passes(self):
        res = check_page(ANSOFF_TEXT, page_md(ANSOFF), False, page_no=20)
        self.assertEqual(res["diagram_count"], 1)
        self.assertEqual(res["diagram_errors"], 0, res["diagram_issues"])
        self.assertEqual(res["diagram_label_coverage"], 1.0)
        self.assertEqual(res["review_reasons"], [])
        self.assertFalse(res["needs_review"])

    def test_invalid_block(self):
        bad = dict(ANSOFF, xAxis=5)  # wrong type, no text lost
        res = check_page(ANSOFF_TEXT, page_md(bad), False, page_no=20)
        self.assertTrue(res["needs_review"])
        self.assertEqual(res["review_reasons"], ["diagram_invalid"])

    def test_missing_summary_is_invalid(self):
        res = check_page(ANSOFF_TEXT, page_md(ANSOFF, summary=False), False, page_no=20)
        self.assertTrue(res["needs_review"])
        self.assertIn("diagram_invalid", res["review_reasons"])

    def test_label_miss(self):
        bad = dict(ANSOFF, cells=[["Market Penetration", "Product Development"],
                                  ["Market Development", "Conglomerate Diversification"]])
        res = check_page(ANSOFF_TEXT, page_md(bad), False, page_no=20)
        self.assertTrue(res["needs_review"])
        self.assertIn("diagram_label", res["review_reasons"])
        self.assertNotIn("diagram_invalid", res["review_reasons"])

    def test_other_block(self):
        other = {"type": "other", "title": None, "source_page": 20, "notes": [],
                 "description": "Ansoff grid", "labels": ["Product", "Market"]}
        res = check_page(ANSOFF_TEXT, page_md(other), False, page_no=20)
        self.assertTrue(res["needs_review"])
        self.assertIn("diagram_other", res["review_reasons"])

    def test_unreadable_in_block(self):
        bad = dict(ANSOFF, cells=[["Market Penetration", "Product Development"],
                                  ["Market Development", "[UNREADABLE]"]])
        res = check_page(ANSOFF_TEXT, page_md(bad), False, page_no=20)
        self.assertTrue(res["needs_review"])
        self.assertIn("unreadable", res["review_reasons"])
        self.assertEqual(res["unreadable_count"], 1)

    def test_scanned_always_review(self):
        res = check_page(ANSOFF_TEXT, page_md(ANSOFF), True, page_no=20)
        self.assertTrue(res["needs_review"])
        self.assertEqual(res["review_reasons"], ["scanned"])
        self.assertIsNone(res["diagram_label_coverage"])
        self.assertEqual(res["diagram_count"], 1)

    def test_page_no_optional(self):
        res = check_page(ANSOFF_TEXT, page_md(dict(ANSOFF, source_page=99)), False)
        self.assertNotIn("source_page_mismatch", {i["code"] for i in res["diagram_issues"]})

    def test_no_threshold_literals_in_fidelity(self):
        with open(fidelity.__file__, encoding="utf-8") as f:
            src = f.read()
        for literal in ("1.00", "0.98", "< 1.0", "<1.0"):
            self.assertNotIn(literal, src)


class TestCoverageDecodesBlocks(unittest.TestCase):
    """R1.03 fix round: JSON escapes in labels must not create fake tokens."""
    TEXT = ("AMO Framework\nAbility Motivation Opportunity\nHiring\nTraining\nCareer planning\n"
            "Short-Term\nCompetitive\nDisadvantage")

    def md(self):
        tree = {"type": "issue_tree", "title": "AMO Framework", "source_page": 52, "notes": [],
                "root": {"label": "AMO Framework", "children": [
                    {"label": "Ability\nHiring\nTraining", "children": []},
                    {"label": "Motivation", "children": []},
                    {"label": "Opportunity\nCareer planning", "children": []},
                    {"label": "Short-Term\nCompetitive\nDisadvantage", "children": []}]}}
        return "```placewise-diagram\n" + json.dumps(tree) + "\n```\nDiagram summary: AMO.\n"

    def test_escaped_newlines_do_not_break_words(self):
        md = self.md()
        self.assertIn("\\nHiring", md)  # the raw JSON really carries the escape
        self.assertNotIn("nhiring", fidelity.extract_words(fidelity.coverage_text(md)))
        res = check_page(self.TEXT, md, False, page_no=52)
        self.assertEqual(res["word_coverage"], 1.0)
        self.assertNotIn("word_coverage", res["review_reasons"])

    def test_invalid_json_block_still_unescaped(self):
        md = '```placewise-diagram\n{"label": "Ability\\nHiring",}\n```\n'
        self.assertIn("hiring", fidelity.extract_words(fidelity.coverage_text(md)))

    def test_flattening_warning_maps_to_review_reason(self):
        tree = {"type": "issue_tree", "title": None, "source_page": 52, "notes": ["Hiring", "Training"],
                "root": {"label": "AMO Framework", "children": [
                    {"label": "Ability", "children": []}, {"label": "Motivation", "children": []}]}}
        md = "```placewise-diagram\n" + json.dumps(tree) + "\n```\nDiagram summary: AMO.\n"
        res = check_page("AMO Framework Ability Motivation Hiring Training", md, False, page_no=52)
        self.assertEqual(res["diagram_errors"], 0)
        self.assertTrue(res["needs_review"])
        self.assertIn("diagram_flattened", res["review_reasons"])


class TestCoverageReviewFixes(unittest.TestCase):
    """Code-review fix H1: summaries and broken JSON never inflate coverage."""

    def test_sentence_only_in_summary_is_not_covered(self):
        text = "Ansoff Matrix Market Penetration\nBest suitable for Growth Strategy cases"
        tree = {"type": "issue_tree", "title": "Ansoff Matrix", "source_page": 20, "notes": [],
                "root": {"label": "Market Penetration", "children": []}}
        md = ("```placewise-diagram\n" + json.dumps(tree) + "\n```\n"
              "Diagram summary: Best suitable for Growth Strategy cases.\n")
        res = check_page(text, md, False, page_no=20)
        self.assertLess(res["word_coverage"], 1.0)
        self.assertIn("word_coverage", res["review_reasons"])
        self.assertNotIn("growth", fidelity.extract_words(fidelity.coverage_text(md)))

    def test_summary_dropped_even_if_block_broken(self):
        md = '```placewise-diagram\n{"type": "flow",,}\n```\nDiagram summary: secretword here\n'
        self.assertNotIn("secretword", fidelity.extract_words(fidelity.coverage_text(md)))

    def test_unparseable_block_source_page_not_a_number(self):
        md = ('```placewise-diagram\n{"type": "matrix", "source_page": 47, "title": "Caf\\u00e9 grid",'
              ' "cells": [["Alpha", "Beta"],]}\n```\n')
        cov = fidelity.coverage_text(md)
        self.assertNotIn("47", extract_numbers(cov))
        words = fidelity.extract_words(cov)
        self.assertIn("alpha", words)
        self.assertIn("Café", cov)  # \uXXXX decoded
        for key in ("source_page", "cells", "matrix", "type", "title"):
            self.assertNotIn(key, words, key)
        res = check_page("Report for 47 regions", md, False, page_no=47)
        self.assertEqual(res["number_coverage"], 0.0)

    def test_label_flattened_maps_to_review_reason(self):
        tree = {"type": "issue_tree", "title": None, "source_page": 32, "notes": [],
                "root": {"label": "Revenues", "children": [
                    {"label": "Segments\n• Geography\n• Channel", "children": []}]}}
        md = "```placewise-diagram\n" + json.dumps(tree) + "\n```\nDiagram summary: x.\n"
        res = check_page("Revenues Segments Geography Channel", md, False, page_no=32)
        self.assertIn("diagram_flattened", res["review_reasons"])


if __name__ == "__main__":
    unittest.main()

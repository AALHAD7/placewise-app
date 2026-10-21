"""R2.09: gate arithmetic and structure_unreviewed in r2_gapcheck.py (fixtures, no DB)."""
import json
import unittest

import r2_gapcheck as gc


def block(obj):
    return "```placewise-diagram\n" + json.dumps(obj) + "\n```"


TREE = {"type": "issue_tree", "title": None, "source_page": 1, "notes": [],
        "root": {"label": "Profit", "children": [{"label": "Revenue", "children": []}]}}
FLOW = {"type": "flow", "title": None, "source_page": 1, "notes": [],
        "nodes": [{"id": "a", "label": "A"}, {"id": "b", "label": "B"}], "edges": [{"from": "a", "to": "b"}]}
MATRIX = {"type": "matrix", "title": None, "source_page": 1, "notes": [], "xAxis": None, "yAxis": None,
          "cols": ["x"], "rows": ["y"], "cells": [["c"]]}


class TestStructureUnreviewed(unittest.TestCase):
    def test_trees_and_flows_not_passed(self):
        pages = [{"page_no": 1, "markdown": block(TREE)}, {"page_no": 2, "markdown": block(FLOW)},
                 {"page_no": 3, "markdown": block(MATRIX)}, {"page_no": 4, "markdown": "text only"},
                 {"page_no": 5, "markdown": block(TREE)},
                 {"page_no": 6, "markdown": block(dict(TREE, root={"label": "Leaf", "children": []}))}]
        self.assertEqual(gc.structure_unreviewed(pages, {5}), [1, 2])

    def test_reviewed_pass_set(self):
        docs = [{"pages": [{"page_no": 1, "verdict": "pass"}, {"page_no": 2, "verdict": "fail"}]}]
        sample = {"pages": [{"page_no": 3, "outcome": "faithful"}, {"page_no": 4, "outcome": "missed"}]}
        self.assertEqual(gc.reviewed_pass_set(docs, sample), {1, 3})

    def test_calibration_pages(self):
        self.assertEqual(gc.calibration_pages([{"pages": [{"page_no": 1}]}, {"pages": [{"page_no": 2}]}]), {1, 2})


class TestGates(unittest.TestCase):
    def test_g1_page(self):
        self.assertTrue(gc.g1_page("which I’m sure", [], ["which I'm sure"])["repaired"])  # quote folding
        self.assertTrue(gc.g1_page("x", ["seq_diff"], ["which I'm sure"])["ok"])
        self.assertFalse(gc.g1_page("x", ["word_coverage"], ["which I'm sure"])["ok"])

    def test_g2(self):
        per = {n: {"repairs": [], "strips": [], "reasons": []} for n in range(1, 6)}
        per[1]["strips"] = [["placeholder", "[Logo]", ""], ["link_bracket", "[A]", "A"]]
        per[2]["reasons"] = ["seq_diff"]
        per[3]["reasons"] = ["seq_diff"]
        self.assertTrue(gc.g2_result(per, range(1, 6))["ok"])
        per[4]["reasons"] = ["seq_diff"]                        # 3 > 2
        self.assertFalse(gc.g2_result(per, range(1, 6))["ok"])
        per[4]["reasons"] = []
        per[5]["strips"] = [["caption", "*x*", ""]]
        self.assertFalse(gc.g2_result(per, range(1, 6))["ok"])
        per[5]["strips"] = []
        per[5]["repairs"] = [("a", "b")]
        self.assertFalse(gc.g2_result(per, range(1, 6))["ok"])

    def test_g4_boundary(self):
        self.assertTrue(gc.g4_result(list(range(10)), {0, 1, 2, 3})["ok"])       # 40% allowed
        self.assertFalse(gc.g4_result(list(range(10)), {0, 1, 2, 3, 4})["ok"])
        self.assertEqual(gc.g4_result(list(range(10)), {0, 99})["seq_diff_added"], 1)

    def test_repair_improves(self):
        tl = "What would the exit process look like?"
        self.assertTrue(gc.repair_improves("What would be the exit process look like?", tl, tl))
        self.assertFalse(gc.repair_improves(tl, "What would be the exit process look like?", tl))

    def test_g6(self):
        res = gc.g6_result({1: ["x"], 2: []}, {1: [], 2: ["framework_as_text"]}, [1, 2])
        self.assertTrue(res["ok"])
        self.assertFalse(gc.g6_result({1: [], 2: []}, {1: [], 2: []}, [1, 2])["ok"])


class TestFrameworkAsText(unittest.TestCase):
    TL = "Five Forces\nBuyers\nSuppliers\nRivalry\nEntrants\nSubstitutes"
    MD = "Five Forces\n\n* Buyers\n* Suppliers\n* Rivalry\n* Entrants\n* Substitutes"

    def test_visual_page_without_block(self):
        from fidelity import check_page
        self.assertIn("framework_as_text", check_page(self.TL, self.MD, False, is_visual=True)["review_reasons"])
        self.assertNotIn("framework_as_text", check_page(self.TL, self.MD, False)["review_reasons"])
        self.assertNotIn("framework_as_text", check_page(self.TL, self.MD, False, is_visual=False)["review_reasons"])

    def test_arrows_and_tables(self):
        from fidelity import framework_as_text
        self.assertTrue(framework_as_text("Need → Analysis → Due diligence"))
        self.assertTrue(framework_as_text("| a | b |\n| --- | --- |\n| 1 | 2 |"))
        self.assertFalse(framework_as_text("One short line\n\nAnother short line\n\nThird\n\nFourth"))


if __name__ == "__main__":
    unittest.main()

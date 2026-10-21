"""R2.10: v4 -> v5 carry (run_v5.py), pure parts only (no DB)."""
import json
import unittest

import run_v5

TL = "I see. This has led to 10% decline in profits for the steel industry players. But since our client"
MD = "I see. This has led to 10% decline in the steel industry players. But since our client"
TREE = {"type": "issue_tree", "title": None, "source_page": 2, "notes": [],
        "root": {"label": "Profit", "children": [{"label": "Revenue", "children": []}]}}


def row(n, md, reasons=(), tl=TL, visual=False):
    return {"page_no": n, "id": f"id{n}", "text_layer": tl, "markdown": md, "is_visual": visual,
            "is_scanned": False, "review_reasons": list(reasons), "needs_review": bool(reasons)}


class TestCarry(unittest.TestCase):
    def test_reasons_never_dropped(self):
        page, info = run_v5.carry_page_v5(row(1, MD, ["fidelity_review:missing"]), {}, set())
        self.assertIn("in profits for the steel", page["markdown"])   # repaired ...
        self.assertIn("fidelity_review:missing", page["review_reasons"])  # ... human flag kept
        self.assertTrue(page["needs_review"])
        self.assertTrue(info["changed"])

    def test_new_codes_not_drift(self):
        infos = [{"page_no": 1, "changed": False, "added": ["seq_diff", "invented_text"]},
                 {"page_no": 2, "changed": False, "added": ["word_coverage"]},
                 {"page_no": 3, "changed": True, "added": ["word_coverage"]},
                 {"page_no": 4, "changed": False, "added": ["structure_unreviewed", "framework_as_text"]}]
        self.assertEqual(run_v5.drift_pages(infos, {"word_coverage", "seq_diff"}), [2])

    def test_structure_unreviewed_only_unreviewed_trees(self):
        tree_md = "```placewise-diagram\n" + json.dumps(TREE) + "\n```"
        pages = [{"page_no": 1, "markdown": "text", "review_reasons": [], "needs_review": False},
                 {"page_no": 2, "markdown": tree_md, "review_reasons": [], "needs_review": False},
                 {"page_no": 3, "markdown": tree_md, "review_reasons": [], "needs_review": False}]
        infos = [{"page_no": p["page_no"], "added": [], "needs_review_v5": False} for p in pages]
        su = run_v5.add_structure_unreviewed(pages, infos, reviewed_pass={3})
        self.assertEqual(su, [2])
        self.assertEqual(pages[1]["review_reasons"], ["structure_unreviewed"])
        self.assertTrue(pages[1]["needs_review"])
        self.assertEqual(pages[0]["review_reasons"], [])
        self.assertEqual(pages[2]["review_reasons"], [])

    def test_second_carry_changes_nothing(self):
        md = "[FMS Logo]\nFMS | [Main Index]\n\n" + MD + "\n*(Donut Chart visual representation)*"
        tl = "FMS Main Index\n" + TL
        p1, i1 = run_v5.carry_page_v5(row(1, md, tl=tl), {}, set())
        self.assertTrue(i1["changed"])
        p2, i2 = run_v5.carry_page_v5(row(1, p1["markdown"], p1["review_reasons"], tl=tl), {}, set())
        self.assertFalse(i2["changed"])
        self.assertEqual(p2["markdown"], p1["markdown"])

    def test_gapcheck_guard(self):
        ok = {"document_id": run_v5.V4_DOC_ID, "gates": {"G1": {"ok": True}}}
        self.assertEqual(run_v5.gapcheck_ok(ok, run_v5.V4_DOC_ID), "")
        self.assertIn("missing", run_v5.gapcheck_ok(None, run_v5.V4_DOC_ID))
        self.assertIn("not for", run_v5.gapcheck_ok(dict(ok, document_id="x"), run_v5.V4_DOC_ID))
        self.assertIn("failing", run_v5.gapcheck_ok(dict(ok, gates={"G5": {"ok": False}}), run_v5.V4_DOC_ID))


if __name__ == "__main__":
    unittest.main()

"""R1.07: exact (character-for-character) label check and curly-quote restore.

Fixtures in tests/fixtures/r1_gap/ are FMS 2023-24 v2 pages (text layer from the
v1 pilot, markdown + label_lines from the v2 re-pilot cache)."""
import json
import unittest
from pathlib import Path

from diagram_schema import FENCE_INFO, check_diagrams, extract_blocks, restore_quotes
from fidelity import check_page
from textnorm import QUOTE_MAP, fold_quotes, normalize_exact, normalize_label

FIX = Path(__file__).parent / "fixtures" / "r1_gap"


def load(n):
    return json.loads((FIX / f"p{n}.json").read_text())


def codes(res, code):
    return [it for it in res["diagram_issues"] if it["code"] == code]


def block_md(obj, summary="Diagram summary: x."):
    return f"```{FENCE_INFO}\n{json.dumps(obj, ensure_ascii=False)}\n```\n{summary}\n"


class TestNormalizeExact(unittest.TestCase):
    def test_keeps_case_and_punctuation(self):
        self.assertEqual(normalize_exact("  4P’s  and\n7P’s: "), "4P’s and 7P’s:")

    def test_hyphen_break_joined_with_hyphen(self):
        self.assertEqual(normalize_exact("Short-\nTerm"), "Short-Term")

    def test_text_layer_artefacts(self):
        # pdfium: U+FFFE where a hyphen is printed; zero-width spaces glued to tokens
        self.assertEqual(normalize_exact("Fast￾track 60%​ 40​"), "Fast-track 60% 40")

    def test_nfc_not_nfkc(self):
        self.assertEqual(normalize_exact("ﬁ"), "ﬁ")  # NFKC would fold the ligature to "fi"

    def test_fold_quotes(self):
        self.assertEqual(fold_quotes("‘a’ “b” c′ d″ e'"), "'a' \"b\" c' d\" e'")
        self.assertEqual(set(QUOTE_MAP.values()), {"'", '"'})

    def test_normalize_label_unchanged(self):
        self.assertEqual(normalize_label("4P’s and 7P’s"), "4p s and 7p s")


class TestLabelAltered(unittest.TestCase):
    def test_p14_flagged_before_restore(self):
        d = load(14)
        res = check_page(d["text_layer"], d["markdown"], False, 14, label_lines=d["label_lines"])
        self.assertIn("4P's and 7P's", [it["detail"] for it in codes(res, "label_altered")])
        self.assertIn("diagram_label_altered", res["review_reasons"])
        self.assertEqual(res["diagram_label_coverage"], 1.0)  # presence is unchanged
        self.assertLess(res["diagram_label_exact"], 1.0)

    def test_p13_flagged_before_restore(self):
        d = load(13)
        res = check_page(d["text_layer"], d["markdown"], False, 13)
        self.assertIn("Other C's", [it["detail"] for it in codes(res, "label_altered")])

    def test_p14_restored_to_curly(self):
        d = load(14)
        md, n = restore_quotes(d["markdown"], d["text_layer"])
        self.assertGreater(n, 0)
        res = check_page(d["text_layer"], md, False, 14)
        self.assertEqual(codes(res, "label_altered"), [])
        self.assertEqual(res["diagram_label_exact"], 1.0)
        obj = [b for b in extract_blocks(md) if b["obj"]][0]["obj"]
        self.assertEqual(obj["title"], "4P\u2019s and 7P\u2019s")
        self.assertEqual(obj["root"]["label"], "4P\u2019s and 7P\u2019s")
        # outside the block only quote characters changed
        b_old, b_new = extract_blocks(d["markdown"])[0], extract_blocks(md)[0]
        outside_old = d["markdown"][:b_old["start"]] + d["markdown"][b_old["end"]:]
        outside_new = md[:b_new["start"]] + md[b_new["end"]:]
        self.assertEqual(len(outside_old), len(outside_new))
        for a, b in zip(outside_old, outside_new):
            if a != b:
                self.assertIn(a, QUOTE_MAP)
                self.assertIn(b, QUOTE_MAP)
        self.assertEqual(fold_quotes(outside_old), fold_quotes(outside_new))

    def test_p13_restored(self):
        d = load(13)
        md, _ = restore_quotes(d["markdown"], d["text_layer"])
        res = check_page(d["text_layer"], md, False, 13)
        self.assertEqual(codes(res, "label_altered"), [])
        self.assertEqual(res["diagrams"][0]["title"], "Other C\u2019s")

    def test_hyphen_is_not_restorable(self):
        text = "Cost Benefit analysis of the project"
        md = block_md({"type": "issue_tree", "title": None, "source_page": 3, "notes": [],
                       "root": {"label": "Cost-Benefit", "children": [{"label": "analysis", "children": []}]}})
        res = check_diagrams(md, text, 3)
        self.assertEqual([it["detail"] for it in codes(res, "label_altered")], ["Cost-Benefit"])
        md2, n = restore_quotes(md, text)
        self.assertEqual((md2, n), (md, 0))
        self.assertEqual(len(codes(check_diagrams(md2, text, 3), "label_altered")), 1)

    def test_case_change_is_altered(self):
        text = "Business Acumen\nGuesstimates"
        md = block_md({"type": "issue_tree", "title": None, "source_page": 3, "notes": [],
                       "root": {"label": "Business acumen", "children": [{"label": "Guesstimates", "children": []}]}})
        self.assertEqual(len(codes(check_diagrams(md, text, 3), "label_altered")), 1)

    def test_bullet_and_colon_allowance(self):
        text = "• Price in the market\nOther 3 P’s:\n(Rent, Labour)"
        md = block_md({"type": "issue_tree", "title": None, "source_page": 3, "notes": [],
                       "root": {"label": "Other 3 P’s", "children": [
                           {"label": "Price in the market", "children": []},
                           {"label": "Rent, Labour", "children": []}]}})
        res = check_diagrams(md, text, 3)
        self.assertEqual(codes(res, "label_altered"), [])

    def test_inner_punctuation_never_relaxed(self):
        text = "Price-in the market"
        md = block_md({"type": "issue_tree", "title": None, "source_page": 3, "notes": [],
                       "root": {"label": "Price in the market", "children": [{"label": "market", "children": []}]}})
        # loose match passes ("price in the market"), exact fails: "Price" is not a token, "Price-in" is
        self.assertEqual(len(codes(check_diagrams(md, text, 3), "label_altered")), 1)

    def test_p20_clean(self):
        d = load(20)
        res = check_page(d["text_layer"], d["markdown"], False, 20, label_lines=d["label_lines"])
        self.assertEqual(codes(res, "label_altered"), [])
        self.assertEqual(res["diagram_label_exact"], 1.0)

    def test_restore_only_changes_quotes(self):
        text = "It’s “big” and C’s"
        md = "It's \"big\" and C's but cost-benefit stays"
        new, n = restore_quotes(md, text)
        self.assertEqual(new, "It’s “big” and C’s but cost-benefit stays")
        self.assertEqual(n, 3)

    def test_restore_noop_without_text_layer(self):
        self.assertEqual(restore_quotes("C's", ""), ("C's", 0))


if __name__ == "__main__":
    unittest.main()

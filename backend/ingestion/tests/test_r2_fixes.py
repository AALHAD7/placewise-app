"""R2.04: nav-line typo repair, postprocess wiring, block_in_table on the p58 layout,
and the fallback_v1 post-pass in run_patch."""
import json
import unittest

from diagram_schema import extract_blocks
from postprocess import fix_nav_typos, levenshtein, postprocess_markdown


class TestNavTypos(unittest.TestCase):
    def test_levenshtein(self):
        self.assertEqual(levenshtein("guesestimate", "guesstimate"), 1)
        self.assertEqual(levenshtein("kitten", "sitting"), 3)
        self.assertEqual(levenshtein("", "abc"), 3)

    def test_guesestimate_fixed(self):
        md = "[FMS] Guesestimate Index | Main Index\n\n# Smartphones"
        tl = "FMS Guesstimate Index Main Index Smartphones"
        log = []
        out, n = fix_nav_typos(md, tl, log=log)
        self.assertEqual(n, 1)
        self.assertEqual(out, "[FMS] Guesstimate Index | Main Index\n\n# Smartphones")
        self.assertEqual(log, [("Guesestimate", "Guesstimate")])

    def test_case_preserved(self):
        self.assertEqual(fix_nav_typos("GUESESTIMATE INDEX", "Guesstimate")[0], "GUESSTIMATE INDEX")
        self.assertEqual(fix_nav_typos("see guesestimate", "Guesstimate")[0], "see guesstimate")

    def test_two_candidates_no_change(self):
        md = "Guesestimate Index"
        self.assertEqual(fix_nav_typos(md, "Guesstimate Guesstimates Index"), (md, 0))
        # Markets (distance 1) and Markers (distance 2) are both within 2: not unique, no change
        self.assertEqual(fix_nav_typos("Markats", "Markets Markers")[0], "Markats")

    def test_inside_block_untouched(self):
        md = ("```placewise-diagram\n{\"type\": \"other\", \"description\": \"Guesestimate\", \"labels\": []}\n```\n"
              "Diagram summary: x.")
        self.assertEqual(fix_nav_typos(md, "Guesstimate"), (md, 0))

    def test_long_line_untouched(self):
        md = "This Guesestimate section walks through seven worked example cases in detail"
        self.assertEqual(fix_nav_typos(md, "Guesstimate"), (md, 0))

    def test_short_words_and_printed_words_kept(self):
        self.assertEqual(fix_nav_typos("Cmpany Index", "Company Index"), ("Company Index", 1))  # 6 letters
        self.assertEqual(fix_nav_typos("Revenue Index", "Revenue Revenues Index"), ("Revenue Index", 0))
        self.assertEqual(fix_nav_typos("Prfit Index", "Profit Index"), ("Prfit Index", 0))  # 5 letters

    def test_first_letter_must_match(self):
        # FMS p60: "University of Delhi" must not become "Diversity of Delhi"
        self.assertEqual(fix_nav_typos("University of Delhi", "Diversity Delhi"), ("University of Delhi", 0))

    def test_nav_bar_with_header_p97(self):
        md = "FMS Guesestimate Index | Main Index Delhi Schools The Consulting Club"
        tl = "Guesstimate Index | Main Index Delhi Schools The Consulting Club"
        self.assertEqual(fix_nav_typos(md, tl)[0],
                         "FMS Guesstimate Index | Main Index Delhi Schools The Consulting Club")
        # same length without a nav bar: left alone
        md2 = "FMS Guesestimate notes for Main section Delhi Schools The Consulting Club"
        self.assertEqual(fix_nav_typos(md2, tl), (md2, 0))

    def test_url_token_untouched(self):
        md = "www.guesestimate.com"
        self.assertEqual(fix_nav_typos(md, "Guesstimate"), (md, 0))

    def test_postprocess_wires_all_and_keeps_4_tuple(self):
        md = "[FMS] Guesestimate Index | [Main Index](javascript:history.back())\n\nMain Index)"
        res = postprocess_markdown(md, "FMS Guesstimate Index Main Index")
        self.assertEqual(len(res), 4)
        out, _ll, _q, n_links = res
        self.assertEqual(out, "[FMS] Guesstimate Index | Main Index\n\nMain Index")
        self.assertEqual(n_links, 2)
        log = []
        postprocess_markdown(md, "FMS Guesstimate Index Main Index", typo_log=log)
        self.assertEqual(log, [("Guesestimate", "Guesstimate")])


P58_LAYOUT = """FMS | Sector Index | Main Index

# Cement

## Value Chain

```placewise-diagram
{"type": "flow", "title": null, "nodes": [{"id": "a", "label": "Mining"}, {"id": "b", "label": "Retail"}], "edges": [{"from": "a", "to": "b"}], "source_page": 58}
```
Diagram summary: Mining leads to retail.
| Revenue Drivers | Growth Drivers | Sector Composition |
| :--- | :--- | :--- |
| Sale of cement (~80-90%) | • Urbanization | ```placewise-diagram
{"type": "chart", "kind": "bar", "title": null, "series": [], "source_page": 58}
```<br>Diagram summary: Sector composition shown as bars. | x |
| **Cost Drivers** | | |
"""


class TestInTableP58(unittest.TestCase):
    def test_block_before_table_is_not_in_table(self):
        b = extract_blocks(P58_LAYOUT)
        self.assertEqual(len(b), 2)
        self.assertEqual(b[0]["obj"]["type"], "flow")
        self.assertFalse(b[0]["in_table"])
        self.assertEqual(b[0]["summary"], "Mining leads to retail.")

    def test_block_in_cell_is_in_table(self):
        b = extract_blocks(P58_LAYOUT)
        self.assertTrue(b[1]["in_table"])

    def test_block_between_rows_still_in_table(self):
        md = ("| a | b |\n| --- | --- |\n```placewise-diagram\n"
              "{\"type\": \"other\", \"description\": \"x\", \"labels\": []}\n```\n"
              "Diagram summary: x.\n| c | d |\n")
        self.assertTrue(extract_blocks(md)[0]["in_table"])


class TestFallbackV1PostPass(unittest.TestCase):
    def test_v1_page_strips_invented_links(self):
        import run_patch
        v1 = {"page_no": 71, "is_text": True, "is_table": True, "is_visual": True, "is_scanned": False,
              "text_layer": "Sector Index Main Index ONGC INR 2.1",
              "markdown": "[Sector Index](#[UNREADABLE]) | [Main Index](#[UNREADABLE])\n\n"
                          "![ONGC logo](https://via.placeholder.com/40x40?text=ONGC) ONGC INR 2.1"}
        p = run_patch.v1_page(v1)
        self.assertNotIn("](", p["markdown"])
        self.assertNotIn("placeholder", p["markdown"])
        self.assertIn("ONGC logo ONGC INR 2.1", p["markdown"])
        page, method, src = run_patch.choose_page(
            p, dict(p, number_coverage=0.0, word_coverage=0.0), dict(p, number_coverage=0.0, word_coverage=0.0))
        self.assertEqual((method, src), ("fallback_v1", "v1"))
        self.assertIn("fallback_v1", page["review_reasons"])
        self.assertEqual(page["markdown"], p["markdown"])


if __name__ == "__main__":
    unittest.main()

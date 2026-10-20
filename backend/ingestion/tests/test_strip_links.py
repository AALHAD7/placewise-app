"""R1.07: invented Markdown links are stripped to plain text before storage."""
import json
import unittest
from pathlib import Path

from textnorm import strip_invented_links

FIX = Path(__file__).parent / "fixtures" / "r1_gap"


def load(n):
    return json.loads((FIX / f"p{n}.json").read_text())


class TestStripLinks(unittest.TestCase):
    def test_fms_forms(self):
        for md in ("FMS [Main Index](javascript:history.back())",
                   "FMS [Main Index](main_index)",
                   "FMS | [Main Index](#)"):
            out, n = strip_invented_links(md, "Main Index")
            self.assertEqual(n, 1, md)
            self.assertIn("Main Index", out)
            self.assertNotIn("](", out)

    def test_fixtures_p10_p20_p52(self):
        for p in (10, 20, 52):
            d = load(p)
            self.assertIn("[Main Index](", d["markdown"])
            out, n = strip_invented_links(d["markdown"], d["text_layer"])
            self.assertGreaterEqual(n, 1)
            self.assertNotIn("[Main Index](", out)
            self.assertIn("Main Index", out)

    def test_real_url_kept_only_if_printed(self):
        md = "see [site](https://x.com) now"
        self.assertEqual(strip_invented_links(md, "visit https://x.com today"), (md, 0))
        self.assertEqual(strip_invented_links(md, "visit our site"), ("see site now", 1))

    def test_image_links(self):
        out, n = strip_invented_links("![UltraTech](_page_0_Figure_5.jpeg)<br>~21 %", "UltraTech ~21 %")
        self.assertEqual((out, n), ("UltraTech<br>~21 %", 1))

    def test_links_inside_blocks_untouched(self):
        md = ("```placewise-diagram\n{\"type\": \"other\", \"description\": \"[a](#)\", \"labels\": []}\n```\n"
              "Diagram summary: x.\n[Main Index](#)")
        out, n = strip_invented_links(md, "")
        self.assertEqual(n, 1)
        self.assertIn('"[a](#)"', out)
        self.assertTrue(out.endswith("\nMain Index"))

    # ---- R2.04 -------------------------------------------------------------
    def test_history_back_leaves_no_paren(self):
        out, n = strip_invented_links("[Main Index](javascript:history.back())", "Main Index")
        self.assertEqual((out, n), ("Main Index", 1))

    def test_p10_fixture_no_stray_paren(self):
        d = load(10)
        out, n = strip_invented_links(d["markdown"], d["text_layer"])
        self.assertGreaterEqual(n, 1)
        self.assertNotIn("Index)", out)
        self.assertNotIn("](", out)

    def test_unreadable_targets(self):
        md = "[Sector Index](#[UNREADABLE]) | [Main Index](#[UNREADABLE])\n[Case Index]([UNREADABLE])"
        out, n = strip_invented_links(md, "Sector Index Main Index Case Index")
        self.assertEqual(n, 3)
        self.assertEqual(out, "Sector Index | Main Index\nCase Index")

    def test_placeholder_image(self):
        for md in ("![logo](https://via.placeholder.com/150)",
                   "![ONGC logo](https://via.placeholder.com/40x40?text=ONGC) ONGC"):
            out, n = strip_invented_links(md, "ONGC INR 2.1")
            self.assertEqual(n, 1, md)
            self.assertNotIn("placeholder", out)
            self.assertNotIn("](", out)
        self.assertEqual(strip_invented_links("![Pie](chart) | x", "x")[0], "Pie | x")

    def test_printed_url_with_parens_stays(self):
        md = "see [wiki](https://en.wikipedia.org/wiki/Mercury_(planet)) and [s](https://x.com)"
        tl = "https://en.wikipedia.org/wiki/Mercury_(planet) https://x.com"
        self.assertEqual(strip_invented_links(md, tl), (md, 0))


class TestStrayParens(unittest.TestCase):
    def test_v3_leftovers(self):
        from textnorm import strip_stray_parens
        self.assertEqual(strip_stray_parens("Main Index)\n\n# Roles", "FMS Main Index Roles"),
                         ("Main Index\n\n# Roles", 1))
        self.assertEqual(strip_stray_parens("Case Index) | Main Index)", "Case Index Main Index"),
                         ("Case Index | Main Index", 2))

    def test_balanced_printed_and_long_lines_kept(self):
        from textnorm import strip_stray_parens
        for md, tl in (("Profit (Revenue - Cost)", "Profit (Revenue - Cost)"),
                       ("a) Price b) Place", "a) Price b) Place"),
                       ("one two three four five six seven eight nine ten)", "")):
            self.assertEqual(strip_stray_parens(md, tl), (md, 0), md)

    def test_blocks_untouched(self):
        from textnorm import strip_stray_parens
        md = "```placewise-diagram\n{\"type\": \"other\", \"description\": \"x)\", \"labels\": []}\n```"
        self.assertEqual(strip_stray_parens(md, ""), (md, 0))


if __name__ == "__main__":
    unittest.main()

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
        # review hardening: invented alt text is dropped unless the page prints it
        self.assertEqual(strip_invented_links("![Pie](chart) | x", "x")[0], " | x")
        self.assertEqual(strip_invented_links("![Pie](chart) | x", "Pie x")[0], "Pie | x")
        self.assertEqual(strip_invented_links("![IndiGo Logo](#[UNREADABLE])", "IndiGo 55%"), ("", 1))

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

    def test_semicolon_leftovers_r205(self):
        from textnorm import strip_stray_parens
        self.assertEqual(strip_stray_parens("Case Index;) | Main Index;)", "Case Index | Main Index"),
                         ("Case Index | Main Index", 2))
        self.assertEqual(strip_stray_parens("FMS Main Index;)", "FMS Main Index"), ("FMS Main Index", 1))
        # printed ";)" kept; ";)" after a digit or space kept
        self.assertEqual(strip_stray_parens("smile;)", "smile;)"), ("smile;)", 0))
        self.assertEqual(strip_stray_parens("x 3;) y", ""), ("x 3;) y", 0))
        # p213: the nav bar runs on with the case title (long line); ";)" still goes, a bare ")" does not
        md = "FMS | Case Index;) | Main Index;) | Money Heist | Unconventional | Hard | McKinsey & Co. | The Consulting Club"
        self.assertEqual(strip_stray_parens(md, "Case Index Main Index Money Heist")[1], 2)
        long_bare = "FMS | Case Index) | Main Index | Money Heist | Unconventional | Hard | McKinsey & Co."
        self.assertEqual(strip_stray_parens(long_bare, ""), (long_bare, 0))

    # ---- review hardening ----------------------------------------------------
    def test_list_markers_never_stripped(self):
        from textnorm import strip_stray_parens
        md = "a) Increase price\nb) Cut cost"
        for tl in ("", "   \n", "a. Increase price"):
            self.assertEqual(strip_stray_parens(md, tl), (md, 0), repr(tl))
        for md in ("Option A) Enter", "i) Market size ii) Growth"):
            for tl in ("", "Option A Enter Market size Growth"):
                self.assertEqual(strip_stray_parens(md, tl), (md, 0), (md, tl))

    def test_only_after_index_or_on_nav_bar(self):
        from textnorm import strip_stray_parens
        # a short content line: ")" after an ordinary word stays
        self.assertEqual(strip_stray_parens("Revenue)", "Revenue Cost"), ("Revenue)", 0))
        self.assertEqual(strip_stray_parens("Market Size;)", "Market Size"), ("Market Size;)", 0))
        # "...Index)" anywhere, and any word on a nav-bar line
        self.assertEqual(strip_stray_parens("Sector Index)", "Sector Index"), ("Sector Index", 1))
        self.assertEqual(strip_stray_parens("Cases;) | Main Index", "Cases Main Index"), ("Cases | Main Index", 1))

    def test_empty_text_layer_unchanged(self):
        from textnorm import strip_stray_parens
        self.assertEqual(strip_stray_parens("Main Index)", ""), ("Main Index)", 0))

    def test_history_back_semicolon_link_r205(self):
        out, n = strip_invented_links("FMS | [Case Index](javascript:history.back();) | [Main Index](javascript:history.back();)",
                                      "Case Index Main Index")
        self.assertEqual((out, n), ("FMS | Case Index | Main Index", 2))

    def test_blocks_untouched(self):
        from textnorm import strip_stray_parens
        md = "```placewise-diagram\n{\"type\": \"other\", \"description\": \"x)\", \"labels\": []}\n```"
        self.assertEqual(strip_stray_parens(md, ""), (md, 0))


if __name__ == "__main__":
    unittest.main()

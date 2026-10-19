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


if __name__ == "__main__":
    unittest.main()

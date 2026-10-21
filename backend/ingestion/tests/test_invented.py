"""R2.09 pattern 4: invented text stripped (placeholders, link brackets, titles, captions,
empty rows) or flagged (table headers, chart strings) - textnorm.py."""
import json
import unittest

from fidelity import check_page
from postprocess import postprocess_markdown
from textnorm import invented_text_issues, strip_invented_text

TL = "FMS Main Index Practice Cases Profitability Growth\nRevenue fell 10% last year"


def strip(md, tl=TL):
    log = []
    out, n = strip_invented_text(md, tl, log)
    return out, n, log


class TestStrip(unittest.TestCase):
    def test_logo_removed_when_not_printed(self):
        out, n, log = strip("[FMS Logo] [The Club Logo]\nRevenue fell 10% last year")
        self.assertEqual(out, "Revenue fell 10% last year")
        self.assertEqual([k for k, *_ in log], ["placeholder", "placeholder"])

    def test_logo_kept_when_printed(self):
        tl = "FMS Logo contest results\nRevenue fell"
        md = "[FMS Logo] contest results"
        self.assertEqual(strip(md, tl)[:2], (md, 0))

    def test_link_bracket_unwrapped(self):
        out, n, _ = strip("FMS | [Main Index]\n| **[Profitability]** | x |")
        self.assertEqual(out, "FMS | Main Index\n| **Profitability** | x |")
        self.assertEqual(n, 2)

    def test_link_bracket_kept_when_printed_with_brackets(self):
        tl = "see [Main Index] for more"
        self.assertEqual(strip("see [Main Index] for more", tl)[1], 0)

    def test_unreadable_and_checkboxes_untouched(self):
        md = "Revenue [UNREADABLE] fell\n- [ ] Growth\n- [x] Growth\n- [X] Growth"
        self.assertEqual(strip(md)[:2], (md, 0))

    def test_block_title(self):
        def block(title):
            obj = {"type": "issue_tree", "title": title, "source_page": 1, "notes": [],
                   "root": {"label": "Revenue", "children": []}}
            return "```placewise-diagram\n" + json.dumps(obj, indent=2) + "\n```"
        printed = block("Practice Cases")
        self.assertEqual(strip(printed)[:2], (printed, 0))
        out, n, log = strip(block("Revenue Breakdown Tree"))
        self.assertEqual(n, 1)
        obj = json.loads(out.split("\n", 1)[1].rsplit("```", 1)[0])
        self.assertIsNone(obj["title"])
        self.assertEqual(obj["root"]["label"], "Revenue")
        self.assertEqual(log[0][0], "block_title")

    def test_caption_lines(self):
        out, n, _ = strip("Revenue fell\n*(Donut Chart visual representation)*\n*Revenue fell 10% last year*")
        self.assertEqual(out, "Revenue fell\n*Revenue fell 10% last year*")
        self.assertEqual(n, 1)

    def test_caption_inside_table_cell(self):
        md = "| a | b |\n| --- | --- |\n| Revenue<br><br>*(Horizontal Bar Chart)* | Growth |"
        out, n, _ = strip(md)
        self.assertEqual(out, "| a | b |\n| --- | --- |\n| Revenue | Growth |")

    def test_empty_table_row_removed_header_kept(self):
        md = "| Growth | Revenue |\n| --- | --- |\n|  |  |\n| 10% | fell |\n| | |"
        out, n, _ = strip(md)
        self.assertEqual(out, "| Growth | Revenue |\n| --- | --- |\n| 10% | fell |")
        self.assertEqual(n, 2)
        hdr_only = "|  |  |\n| --- | --- |"
        self.assertEqual(strip(hdr_only)[:2], (hdr_only, 0))

    def test_idempotent(self):
        md = "[FMS Logo]\nFMS | [Main Index]\n*(Donut Chart)*\n| a | b |\n| --- | --- |\n| | |"
        once = strip(md)[0]
        self.assertEqual(strip(once)[:2], (once, 0))

    def test_no_text_layer_untouched(self):
        md = "[FMS Logo] text"
        self.assertEqual(strip(md, "")[:2], (md, 0))


class TestFlag(unittest.TestCase):
    TL150 = "Thank you for the case. Could you tell me more about the firm?\nSure, it is an IT services firm."

    def test_unprinted_table_header_flagged(self):
        md = ("| Candidate | Interviewer |\n| --- | --- |\n"
              "| Thank you for the case. Could you tell me more about the firm? | Sure, it is an IT services firm. |")
        self.assertEqual(invented_text_issues(md, self.TL150)[0][0], "table_header")
        self.assertIn("invented_text", check_page(self.TL150, md, False)["review_reasons"])
        # flagged, not edited
        self.assertIn("| Candidate | Interviewer |", postprocess_markdown(md, self.TL150)[0])

    def test_printed_header_not_flagged(self):
        md = "| Growth | Revenue |\n| --- | --- |\n| 10% | fell |"
        self.assertEqual(invented_text_issues(md, TL), [])

    def test_chart_strings(self):
        obj = {"type": "chart", "title": None, "source_page": 1, "notes": [], "chart_kind": "bar",
               "xLabel": "Year", "yLabel": None,
               "series": [{"name": "Revenue", "points": [["2022", 10]]},
                          {"name": "Sector Composition Legend", "points": [["2022", 10]]}]}
        md = "```placewise-diagram\n" + json.dumps(obj) + "\n```"
        tl = "Revenue 2022 10 Year"
        self.assertEqual(invented_text_issues(md, tl), [("chart_string", "Sector Composition Legend")])


if __name__ == "__main__":
    unittest.main()

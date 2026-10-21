"""R2.09 code review (round 2) fixes: one test per finding."""
import json
import unittest

import convert
import r2_gapcheck as gc
from fidelity import check_page
from seqdiff import analyse, repair_block_reason, repair_prose, seq_diff_ops
from textnorm import PageText, invented_text_issues, strip_invented_text

PRE = "We now want to look at the details of the "
POST = " and then move on to the next part of the case"


def rep(md, tl, bp=None):
    return repair_prose(md, tl, bp)


class TestFinding1RepairGuards(unittest.TestCase):
    """Never copy text-layer junk; the page stays flagged seq_diff instead."""

    def check_blocked(self, md, tl):
        out, n = rep(md, tl)
        self.assertEqual((out, n), (md, 0))
        self.assertTrue(seq_diff_ops(md, tl)["flag"], md)
        self.assertIn("seq_diff", check_page(tl, md, False)["review_reasons"])

    def test_a_split_word(self):
        self.check_blocked(PRE + "total profit" + POST, PRE + "total pro fit" + POST)

    def test_a_hyphen_line_break(self):
        self.check_blocked(PRE + "steady decline in sales" + POST, PRE + "steady decli-\nne in sales" + POST)

    def test_a_slash_wrap(self):
        self.check_blocked(PRE + "cost/unit of steel" + POST, PRE + "cost/ unit of steel" + POST)

    def test_b_digits(self):
        self.check_blocked(PRE + "cost of Rs 1,000 per unit" + POST, PRE + "cost of Rs 1, 000 per unit" + POST)
        self.check_blocked(PRE + "share of 3.5% this year" + POST, PRE + "share of 35% this year" + POST)

    def test_b_callout_number_spliced(self):
        self.check_blocked("I would like to look at the revenue side first and then costs",
                           "I would like to look at 12 the revenue side first and then costs")

    def test_c_title_case_callout_spliced(self):
        self.check_blocked("I would like to look at the revenue side first and then costs",
                           "I would like to look at Key insight the revenue side first and then costs")

    def test_d_line_break_inside_op(self):
        tl = "I would like to look at the\nnew\nlocal revenue side first and then costs"
        md = "I would like to look at the revenue side first and then costs"
        self.check_blocked(md, tl)

    def test_good_repair_still_applies(self):
        tl = "I see. This has led to 10% decline in profits for the steel industry players. But since"
        md = "I see. This has led to 10% decline in the steel industry players. But since"
        self.assertIn("in profits for the steel", rep(md, tl)[0])

    def test_reason_function(self):
        self.assertEqual(repair_block_reason(" profit ", " pro fit ", ["pro", "fit"], "total"), "split_join")
        self.assertEqual(repair_block_reason(" 3.5% ", " 35% ", [], "of"), "digit")
        self.assertEqual(repair_block_reason(" ", " Key insight ", ["Key", "insight"], "look at"),
                         "title_case_insert")
        self.assertIsNone(repair_block_reason(" ", " I ", ["I"], "which"))
        self.assertEqual(repair_block_reason(" ", " our ", ["our"], "due to", op_lines_ok=False), "line_break")


class TestFinding2InventedShortLine(unittest.TestCase):
    TL = "The client is a steel maker with three plants in the north and wants to grow revenue."

    def test_invented_short_line_flagged(self):
        for line in ("Approach used by the candidate", "Key takeaway: segment first"):
            md = line + "\n\nThe client is a steel maker with three plants in the north and wants to grow revenue."
            res = check_page(self.TL, md, False)
            self.assertIn("invented_text", res["review_reasons"], line)
            self.assertNotIn("seq_diff", res["review_reasons"])        # still not counted as drift

    def test_printed_short_line_not_flagged(self):
        md = "Steel maker revenue\n\nThe client is a steel maker with three plants in the north and wants to grow revenue."
        self.assertEqual(analyse(md, self.TL)["invented_lines"], [])


class TestFinding3PageTextAndCaptions(unittest.TestCase):
    def test_words_from_prepared_text_layer(self):
        pt = PageText("steady decli-\nne in sales\nFast￾track")
        self.assertTrue(pt.on_page("decline"))
        self.assertTrue(pt.on_page("decli-ne"))
        self.assertTrue(pt.on_page("Fast-track"))

    def test_caption_with_printed_words_flagged_not_deleted(self):
        tl = "Revenue by segment chart shows growth"
        md = "Intro line\n*(Revenue segment donut visual)*"     # 2 of 4 words printed: share 0.5
        out, n = strip_invented_text(md, tl)
        self.assertEqual((out, n), (md, 0))
        self.assertIn(("caption", "*(Revenue segment donut visual)*"), invented_text_issues(md, tl))
        self.assertIn("invented_text", check_page(tl, md, False)["review_reasons"])

    def test_caption_mostly_unprinted_deleted(self):
        md = "Intro line\n*(Donut chart visual representation)*"
        self.assertEqual(strip_invented_text(md, "Intro line")[0], "Intro line")


class TestFinding4PlaceholderText(unittest.TestCase):
    def test_image_label_unwrapped_when_printed(self):
        tl = "Market growth chart\nRevenue rose"
        out, n = strip_invented_text("[Image: Market growth chart]\nRevenue rose", tl)
        self.assertEqual(out, "Market growth chart\nRevenue rose")

    def test_image_label_deleted_when_not_printed(self):
        out, _ = strip_invented_text("[Image: Market growth chart]\nRevenue rose", "Revenue rose")
        self.assertEqual(out, "Revenue rose")


class TestFinding5ConvertPassesBoilerplate(unittest.TestCase):
    def setUp(self):
        self._orig = convert.transcribe_page

    def tearDown(self):
        convert.transcribe_page = self._orig

    def test_boilerplate_reaches_check_page(self):
        footer = "© The Club, Some School 2023-24"
        tl = "The company has seen its revenue fall over the\n" + footer + "\nlast two years in all regions"
        md = "The company has seen its revenue fall over the last two years in all regions"
        convert.transcribe_page = lambda *a, **k: (md, {"finish_reason": "STOP", "model": "fake"})
        bp = {"© the club, some school 2023-24"}
        with_bp = convert.convert_page_vision(b"png", 3, tl, False, [], "t", boilerplate=bp)
        without = convert.convert_page_vision(b"png", 3, tl, False, [], "t")
        self.assertNotIn("seq_diff", with_bp["review_reasons"])
        self.assertIn("seq_diff", without["review_reasons"])


class TestFinding7Brackets(unittest.TestCase):
    def test_sic_and_numeric_left_alone(self):
        tl = "sic 1 2 Revenue grew"
        for md in ("Revenue grew [sic]", "Revenue grew [1]", "Revenue grew [2-4]"):
            self.assertEqual(strip_invented_text(md, tl), (md, 0), md)


class TestFinding8TopLevelTitle(unittest.TestCase):
    def test_nested_title_untouched(self):
        obj = {"type": "other", "title": "Invented Overview", "source_page": 1, "notes": [],
               "labels": ["Revenue"], "meta": {"title": "Invented Overview"}}
        md = "```placewise-diagram\n" + json.dumps({"meta": obj["meta"], **{k: v for k, v in obj.items()
                                                                              if k != "meta"}}, indent=2) + "\n```"
        out, n = strip_invented_text(md, "Revenue")
        new = json.loads(out.split("\n", 1)[1].rsplit("```", 1)[0])
        self.assertIsNone(new["title"])
        self.assertEqual(new["meta"]["title"], "Invented Overview")


class TestFinding6G3Judgement(unittest.TestCase):
    def test_bad_repairs_rejected(self):
        tl = "the total pro fit of the firm"
        self.assertFalse(gc.repair_improves("the total profit of the firm", tl, tl))
        tl = "a share of 35% this year"
        self.assertFalse(gc.repair_improves("a share of 3.5% this year", tl, tl))
        tl = "look at Key insight the revenue side"
        self.assertFalse(gc.repair_improves("look at the revenue side", tl, tl))
        tl = "decline in profits for the steel industry"
        self.assertTrue(gc.repair_improves("decline in the steel industry", tl, tl))


if __name__ == "__main__":
    unittest.main()

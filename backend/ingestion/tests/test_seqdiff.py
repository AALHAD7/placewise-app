"""R2.09 pattern 1: ordered word/punctuation diff with anchored repair (seqdiff.py)."""
import json
import unittest

from fidelity import check_page
from postprocess import postprocess_markdown
from seqdiff import analyse, boilerplate_lines, repair_prose, seq_diff_ops

FOOTER = "© The Club, Some School 2023-24"


def rep(md, tl, bp=None):
    log = []
    out, n = repair_prose(md, tl, bp, log)
    return out, n, log


class TestRepair(unittest.TestCase):
    def test_two_token_insertion(self):
        tl = "I see. This has led to 10% decline in profits for the steel industry players. But since our client"
        md = "I see. This has led to 10% decline in the steel industry players. But since our client"
        out, n, log = rep(md, tl)
        self.assertEqual(n, 1)
        self.assertIn("10% decline in profits for the steel industry players", out)
        self.assertEqual(len(log), 1)

    def test_which_restored(self):
        tl = "or we can try and get more projects for the firm, which I’m sure the company would anyway have done"
        md = "or we can try and get more projects for the firm, I’m sure the company would anyway have done"
        out, n, _ = rep(md, tl)
        self.assertIn("for the firm, which I’m sure the company", out)

    def test_cause_restored(self):
        tl = "Well, these are decisions that might cause a hit on the brand image of the company"
        md = "Well, these are decisions that case a hit on the brand image of the company"
        out, n, _ = rep(md, tl)
        self.assertIn("decisions that might cause a hit on the brand", out)

    def test_question_mark_to_full_stop_at_line_end(self):
        tl = "Variable pay would depend on number of deliveries. Do we have the data regarding this.\nYes we do."
        md = "Variable pay would depend on number of deliveries. Do we have the data regarding this?\n\nYes we do."
        out, n, _ = rep(md, tl)
        self.assertIn("regarding this.\n", out)
        self.assertEqual(n, 1)

    def test_full_stop_removed(self):
        tl = "copies of a particular book maintained at the library Should I explore each of these factors"
        md = "copies of a particular book maintained at the library. Should I explore each of these factors"
        out, _, _ = rep(md, tl)
        self.assertIn("at the library Should I explore", out)

    def test_header_footer_out_of_order_no_op(self):
        tl = (FOOTER + "\nThe client is a steel maker with three plants in the north.\n"
              "Steel Case Index | Main Index")
        md = ("Steel Case Index | Main Index\n\nThe client is a steel maker with three plants in the north.\n\n"
              + FOOTER)
        res = analyse(md, tl)
        self.assertEqual(res["ops"], [])
        self.assertEqual(rep(md, tl)[1], 0)

    def test_six_token_difference_flagged_not_repaired(self):
        tl = "We looked at the market and found that sales grew strongly in every single region last year overall"
        md = "We looked at the market and found that last year overall"
        out, n, _ = rep(md, tl)
        self.assertEqual(n, 0)
        self.assertEqual(out, md)
        self.assertTrue(seq_diff_ops(md, tl)["flag"])

    def test_difference_next_to_bold_flagged(self):
        tl = "The main issue is the very high cost of raw material for the plant this year"
        md = "The main issue is the **high** cost of raw material for the plant this year"
        out, n, _ = rep(md, tl)
        self.assertEqual(n, 0)
        self.assertEqual(out, md)

    def test_blocks_and_tables_never_edited(self):
        obj = {"type": "issue_tree", "title": None, "source_page": 1, "notes": [],
               "root": {"label": "Profit fell in the last year", "children": []}}
        tl = "Profit fell sharply in the last year\nRevenue | Cost grew in the last quarter\nnext line here"
        md = ("```placewise-diagram\n" + json.dumps(obj) + "\n```\n\n| Revenue | Cost grew in the quarter |\n"
              "| --- | --- |\n")
        self.assertEqual(rep(md, tl)[:2], (md, 0))

    def test_idempotent(self):
        tl = "I see. This has led to 10% decline in profits for the steel industry players. But since our client"
        md = "I see. This has led to 10% decline in the steel industry players. But since our client"
        once = rep(md, tl)[0]
        self.assertEqual(rep(once, tl)[:2], (once, 0))

    def test_no_text_layer_unchanged(self):
        md = "Anything at all here, with words."
        self.assertEqual(rep(md, "")[:2], (md, 0))
        self.assertEqual(postprocess_markdown(md, "")[0], md)

    def test_footer_mid_sentence_not_inserted(self):
        tl = ("The company has seen its revenue fall over the\n" + FOOTER + "\nlast two years in all regions")
        md = "The company has seen its revenue fall over the last two years in all regions"
        out, n, _ = rep(md, tl)
        self.assertEqual((out, n), (md, 0))
        self.assertTrue(seq_diff_ops(md, tl)["flag"])          # whole line deleted, not boilerplate
        bp = {"© the club, some school 2023-24"}
        self.assertEqual(analyse(md, tl, bp)["ops"], [])        # boilerplate: no op, no flag
        self.assertFalse(seq_diff_ops(md, tl, bp)["flag"])


class TestBoilerplateAndCheck(unittest.TestCase):
    def test_boilerplate_lines(self):
        pages = [f"{FOOTER}\nPage text {i} about cases" for i in range(10)]
        self.assertEqual(boilerplate_lines(pages), {"© the club, some school 2023-24"})
        self.assertEqual(boilerplate_lines([]), set())

    def test_check_page_reason_and_count(self):
        tl = "We looked at the market and found that sales grew strongly in every single region last year overall"
        md = "We looked at the market and found that last year overall"
        res = check_page(tl, md, False)
        self.assertIn("seq_diff", res["review_reasons"])
        self.assertGreaterEqual(res["seq_diff_ops"], 1)
        ok = check_page(tl, tl, False)
        self.assertNotIn("seq_diff", ok["review_reasons"])
        self.assertEqual(ok["seq_diff_ops"], 0)

    def test_postprocess_wires_repair_last_and_keeps_tuple(self):
        tl = "I see. This has led to 10% decline in profits for the steel industry players. But since our client"
        md = "I see. This has led to 10% decline in the steel industry players. But since our client"
        log = []
        res = postprocess_markdown(md, tl, seq_log=log)
        self.assertEqual(len(res), 4)
        self.assertIn("in profits for the steel", res[0])
        self.assertEqual(len(log), 1)


if __name__ == "__main__":
    unittest.main()

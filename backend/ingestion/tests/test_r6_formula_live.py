"""R6 follow-up fix regression tests, built from REAL live Gemini vision
re-runs (not reconstructed from memory - see log.md 2026-10-31, "per-block
formula regression found" and the follow-up fix entry). Each fid below is
the exact number_coverage/word_coverage/diagram_label_coverage and per-block
qualifying-issue count captured live this session by instrumenting
convert._vision_attempt around a real convert_page_vision() call for the
named page (no network in this test file itself - purely offline, using the
captured real numbers).
"""
import os
import sys
import unittest

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)

import convert  # noqa: E402


def _fid(num_cov, word_cov, label_cov, block_issue_counts):
    issues = []
    for block, n in block_issue_counts.items():
        issues += [{"block": block, "code": "missing_box", "severity": "warn"}] * n
    return {"number_coverage": num_cov, "word_coverage": word_cov,
            "diagram_label_coverage": label_cov, "diagram_issues": issues}


class FormulaLiveRegressionTest(unittest.TestCase):
    def test_fms2324_p78_attempt2_beats_attempt1_not_tied(self):
        """FMS2023-24 p78 ('Understanding Google'): attempt 1 flattened an
        entire box group (Ads/Cloud/Hardware products) out of the diagram
        into plain text, 14 qualifying issues all in one block. Attempt 2
        (the targeted retry) fixed all but 1. Both land in exactly 1 bad
        block, so the flat per-block formula (0.5 each) tied them at the
        same score and production's tie-break silently kept the worse,
        un-retried attempt 1. Confirmed visually against the real page
        image this session: attempt 2 (fewer issues) is correct."""
        a1 = _fid(1.0, 1.0, 1.0, {0: 14})
        a2 = _fid(1.0, 1.0, 1.0, {1: 1})
        old1 = 1.0 + 1.0 + 1.0 - 0.5 * 14
        old2 = 1.0 + 1.0 + 1.0 - 0.5 * 1
        self.assertLess(old1, old2)  # old formula already correctly preferred a2
        new1, new2 = convert._score(a1, False), convert._score(a2, False)
        self.assertEqual(convert._penalty_blocks(a1), 1)
        self.assertEqual(convert._penalty_blocks(a2), 1)  # tie under the OLD per-block count alone
        self.assertNotEqual(new1, new2)  # the fix: no longer a tie
        self.assertLess(new1, new2)  # correctly prefers the better attempt 2

    def test_isb_p30_close_call_still_ranked_correctly(self):
        """ISB p30: both attempts land in the same single block (14 vs 13
        qualifying issues - a near-tie in real severity, unlike p78). Old
        formula already (narrowly) preferred the 13-issue attempt; the new
        formula must not flip this on a page where the two attempts are
        genuinely close."""
        a1 = _fid(1.0, 1.0, 0.36363636363636365, {0: 14})
        a2 = _fid(1.0, 1.0, 0.36363636363636365, {0: 13})
        new1, new2 = convert._score(a1, False), convert._score(a2, False)
        self.assertNotEqual(new1, new2)
        self.assertLess(new1, new2)  # a2 (fewer issues) still wins, not tied

    def test_fms2122_p50_three_block_near_tie_keeps_old_ranking(self):
        """FMS2021-22 p50: both attempts spread issues across the SAME 3
        blocks, only block 2's count differs (4 vs 5). The old flat formula
        narrowly preferred attempt 1 (fewer total issues); the per-block fix
        must not invert this on a multi-block page where the attempts are
        otherwise identical."""
        a1 = _fid(1.0, 1.0, 0.8433734939759037, {1: 6, 2: 4, 10: 3})
        a2 = _fid(1.0, 1.0, 0.8433734939759037, {1: 6, 2: 5, 10: 3})
        self.assertEqual(convert._penalty_blocks(a1), convert._penalty_blocks(a2))  # tie under old per-block count
        new1, new2 = convert._score(a1, False), convert._score(a2, False)
        self.assertGreater(new1, new2)  # attempt 1 (fewer issues) still wins


if __name__ == "__main__":
    unittest.main()

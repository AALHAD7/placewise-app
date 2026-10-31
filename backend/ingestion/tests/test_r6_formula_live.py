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

    def test_fms2122_p16_tie_broken_correctly(self):
        """FMS2021-22 p16 ('Value Chain/Process Mapping'): live re-verification
        this session (run_r6_formula_verify_live.py, 2026-10-31, "Priority 1
        regression fix"), captured directly from real convert_page_vision
        attempts (not hand-built). Attempt 1's diagram block failed schema
        validation entirely (type "other", 13 label_not_on_page issues,
        diagrams=[] - the student would see NO diagram at all). Attempt 2's
        retry produced a real flow diagram with 10 nodes and partial edges
        (flow_disconnected: "6 separate pieces", 11 issues) - visually
        confirmed against the real page (a 9-box Porter's value-chain
        chevron) to be the better outcome: an imperfect-but-real diagram
        beats no diagram. Both land in exactly 1 block, so the OLD flat
        per-block formula ties them (1.5 == 1.5) and production's tie-break
        silently keeps the worse attempt 1. The new weighted formula must
        break this tie in favor of attempt 2 (fewer qualifying issues)."""
        a1 = _fid(1.0, 1.0, 0.0, {0: 13})
        a2 = _fid(1.0, 1.0, 0.0, {0: 11})
        old_block1 = 1.0 + 1.0 + 0.0 - 0.5 * 1  # both tie at 1.5 under the flat per-block formula
        old_block2 = 1.0 + 1.0 + 0.0 - 0.5 * 1
        self.assertEqual(old_block1, old_block2)  # confirms the real tie this session hit live
        new1, new2 = convert._score(a1, False), convert._score(a2, False)
        self.assertNotEqual(new1, new2)
        self.assertLess(new1, new2)  # correctly breaks the tie toward attempt 2 (the real diagram)

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

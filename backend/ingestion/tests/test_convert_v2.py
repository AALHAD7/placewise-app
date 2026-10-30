"""Tests for convert.convert_page_vision (prompt v2 + diagram retry). Offline:
convert.transcribe_page is monkeypatched, no network. Run from backend/ingestion:
    venv/bin/python -m unittest discover -s tests -v
"""
import json
import os
import sys
import unittest

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)

import convert  # noqa: E402
from config import PROMPT_VERSION  # noqa: E402
from textnorm import normalize_label  # noqa: E402

TEXT_LAYER = (
    "Ansoff Matrix\nProduct\nExisting New\nMarket\nExisting\nMarket\nPenetration\n"
    "Product\nDevelopment\nNew\nMarket\nDevelopment Diversification\n"
    "Best suitable for Growth Strategy cases\n"
    "© The Consulting Club, FMS Delhi | 2023-24 | 19"
)
ANSOFF = {
    "type": "matrix", "title": "Ansoff Matrix", "source_page": 20, "notes": [],
    "xAxis": "Product", "yAxis": "Market", "cols": ["Existing", "New"], "rows": ["Existing", "New"],
    "cells": [["Market Penetration", "Product Development"], ["Market Development", "Diversification"]],
}
BAD_LABEL = "Market Devlopment"


def page_md(obj):
    return ("# Ansoff Matrix\n\n```placewise-diagram\n" + json.dumps(obj) + "\n```\n"
            "Diagram summary: Four growth strategies by product and market.\n\n"
            "Best suitable for Growth Strategy cases\n\n"
            "© The Consulting Club, FMS Delhi | 2023-24 | 19\n")


GOOD = page_md(ANSOFF)
BAD = page_md(dict(ANSOFF, cells=[["Market Penetration", "Product Development"],
                                  [BAD_LABEL, "Diversification"]]))


class FakeGemini:
    """Stands in for gemini_client.transcribe_page: one HTTP request per call,
    logged the same way the real client logs it."""
    def __init__(self, outputs):
        self.outputs = list(outputs)  # list of (text, finish_reason)
        self.prompts = []

    def __call__(self, png, prompt, max_tokens=3000, return_meta=False, max_http=None,
                 call_log=None, log_ctx=None, **kw):
        self.prompts.append(prompt)
        if call_log is not None:
            call_log.append(dict(log_ctx or {}, type="vision", model="fake-flash-lite", http=1, status=200))
        text, finish = self.outputs.pop(0)
        meta = {"finish_reason": finish, "model": "fake-flash-lite", "http_calls": 1}
        return (text, meta) if return_meta else text


class ConvertPageVisionTest(unittest.TestCase):
    def setUp(self):
        self._orig = convert.transcribe_page

    def tearDown(self):
        convert.transcribe_page = self._orig

    def run_with(self, outputs):
        fake = FakeGemini(outputs)
        convert.transcribe_page = fake
        log = []
        res = convert.convert_page_vision(b"png", 20, TEXT_LAYER, False, log, "visual_or_scanned")
        return res, fake, log

    def test_good_first_try_one_call(self):
        res, fake, log = self.run_with([(GOOD, "STOP")])
        self.assertEqual(len(fake.prompts), 1)
        self.assertEqual(res["attempts"], 1)
        self.assertEqual(res["diagram_count"], 1)
        self.assertEqual(res["diagrams"][0]["type"], "matrix")
        self.assertFalse(res["needs_review"], res["review_reasons"])
        self.assertEqual(res["method"], "gemini_vision_v2")
        self.assertEqual(res["prompt_version"], PROMPT_VERSION)
        self.assertEqual(log, [{"page": 20, "reason": "visual_or_scanned", "attempt": 1, "type": "vision",
                                "model": "fake-flash-lite", "http": 1, "status": 200}])
        self.assertEqual(res["http_calls"], 1)
        self.assertIn("This is PDF page 20", fake.prompts[0])
        self.assertIn("placewise-diagram", fake.prompts[0])

    def test_bad_then_good_retries_with_label_hint(self):
        res, fake, log = self.run_with([(BAD, "STOP"), (GOOD, "STOP")])
        self.assertEqual(len(fake.prompts), 2)
        self.assertEqual(res["attempts"], 2)
        self.assertIn(BAD_LABEL, fake.prompts[1])
        self.assertIn("Fix these problems", fake.prompts[1])
        self.assertNotIn("Fix these problems", fake.prompts[0])
        self.assertFalse(res["needs_review"], res["review_reasons"])
        self.assertEqual(res["markdown"], GOOD)
        self.assertEqual([c["attempt"] for c in log], [1, 2])

    def test_bad_twice_stops_at_two_and_flags(self):
        res, fake, log = self.run_with([(BAD, "STOP"), (BAD, "STOP"), (GOOD, "STOP")])
        self.assertEqual(len(fake.prompts), 2)
        self.assertEqual(len(log), 2)
        self.assertTrue(res["needs_review"])
        self.assertIn("diagram_label", res["review_reasons"])
        self.assertEqual(res["markdown"], BAD)  # tie keeps attempt 1

    def test_max_tokens_triggers_retry(self):
        res, fake, log = self.run_with([(GOOD, "MAX_TOKENS"), (GOOD, "STOP")])
        self.assertEqual(len(fake.prompts), 2)
        self.assertIn("cut off", fake.prompts[1])
        self.assertFalse(res["truncated"])
        self.assertFalse(res["needs_review"], res["review_reasons"])

    def test_max_tokens_twice_flags_truncated(self):
        res, fake, log = self.run_with([(GOOD, "MAX_TOKENS"), (GOOD, "MAX_TOKENS")])
        self.assertEqual(len(fake.prompts), 2)
        self.assertTrue(res["needs_review"])
        self.assertIn("truncated", res["review_reasons"])

    def test_zero_label_coverage_not_scored_as_perfect(self):
        fid = {"number_coverage": 1.0, "word_coverage": 1.0, "diagram_label_coverage": 0.0, "diagram_errors": 0}
        self.assertEqual(convert._score(fid, False), 2.0)
        fid["diagram_label_coverage"] = None
        self.assertEqual(convert._score(fid, False), 3.0)

    def test_isb_p177_score_picks_vision_once_penalty_is_per_block(self):
        """Regression for the R6 scoring tradeoff (log.md 2026-10-31, 2026-10-30),
        REVISED 2026-10-31 (R6 formula follow-up fix): the original version of
        this test reconstructed p177's discarded vision draft as "6 errors + 1
        warn, all on one block" - the discarded draft's full diagram_issues
        list was never persisted, so that count was inferred, not measured.
        Live re-runs this session (log.md, "per-block formula regression
        found") disproved that reconstruction: the real vision output's
        issues land on 2-3 distinct blocks, not 1, so this exact scenario
        never actually occurs for the real page (p177 correctly stays on
        Docling either way, confirmed live, unrelated to this test).

        This test is kept as a narrower, honestly-scoped contract test for
        the formula's core design intent rather than a literal page
        reconstruction: a diagram block that trips a COUPLE of related
        issues from one mis-treed section (here, 2: one label error + one
        structural warn - within BLOCK_ISSUE_FREE_ALLOWANCE, so it is NOT
        extra-penalized beyond the original flat 0.5-per-block amount) must
        not out-weigh a real, page-wide coverage win, the same way the old
        flat per-issue formula (0.5 per issue) incorrectly did. Docling's
        number/word coverage here are p177's real stored scalars
        (out/r6_isb_v1.json); vision's are p177's real recovered values
        (out/compare_vision_providers.json). See test_r6_formula_live.py for
        the live, non-reconstructed re-verification of the actual tie-break
        regression this follow-up fix targets (FMS2023-24 p78/p16, ISB p30,
        FMS2021-22 p50).
        """
        docling_fid = {"number_coverage": 0.5, "word_coverage": 0.9769230769230769,
                        "diagram_label_coverage": None, "diagram_issues": []}
        vision_fid = {"number_coverage": 1.0, "word_coverage": 1.0,
                       "diagram_label_coverage": None,
                       "diagram_issues": [
                           {"block": 0, "code": "label_altered", "severity": "error"},
                           {"block": 0, "code": "tree_convergence_suspect", "severity": "warn"},
                       ]}
        docling_score = convert._score(docling_fid, False)
        vision_score = convert._score(vision_fid, False)
        # Old flat per-issue formula: Docling would have won.
        old_vision_penalty = 0.5 * 2
        old_vision_score = 1.0 + 1.0 + 1.0 - old_vision_penalty
        self.assertLess(old_vision_score, docling_score)
        # New per-block formula: the fix. Vision now wins on real coverage,
        # not discarded for one block's couple of related issues. Still
        # within the free allowance, so the penalty is the original flat 0.5
        # - unchanged by the follow-up weighting fix.
        self.assertGreater(vision_score, docling_score)
        self.assertEqual(convert._penalty_blocks(vision_fid), 1)
        self.assertEqual(convert._block_penalty(vision_fid), 0.5)

    def test_flattened_notes_trigger_one_retry(self):
        flat = dict(ANSOFF, notes=["Market Penetration", "Diversification", "Product Development"],
                    cells=[["Existing", "New"], ["Existing", "New"]])
        res, fake, log = self.run_with([(page_md(flat), "STOP"), (GOOD, "STOP")])
        self.assertEqual(len(fake.prompts), 2)
        self.assertIn("put in notes", fake.prompts[1])
        self.assertEqual(res["markdown"], GOOD)
        self.assertFalse(res["needs_review"], res["review_reasons"])

    def test_prompt_has_structure_rules(self):
        p = convert.VISION_PROMPT
        self.assertIn("Never move child boxes", p)
        self.assertIn("Keep each label on one line", p)
        self.assertIn("never output a flow with no edges", p)

    def test_multiline_label_collapses_without_retry(self):
        ml = dict(ANSOFF, cells=[["Market\nPenetration", "Product Development"],
                                 ["Market Development", "Diversification"]])
        res, fake, log = self.run_with([(page_md(ml), "STOP"), (page_md(ml), "STOP")])
        self.assertEqual(len(fake.prompts), 1)  # no paid retry: the collapse fixes it
        # collapsed deterministically after the final attempt, then re-checked
        self.assertIn('"Market Penetration"', res["markdown"])
        self.assertNotIn("Market\\nPenetration", res["markdown"])
        self.assertEqual(res["diagrams"][0]["cells"][0][0], "Market Penetration")
        self.assertNotIn("label_multiline", {i["code"] for i in res["diagram_issues"]})
        self.assertFalse(res["needs_review"], res["review_reasons"])

    def test_bulleted_label_not_collapsed_and_flagged(self):
        flat = dict(ANSOFF, cells=[["Market Penetration\n• Product Development", "Product Development"],
                                   ["Market Development", "Diversification"]])
        res, fake, log = self.run_with([(page_md(flat), "STOP"), (page_md(flat), "STOP")])
        self.assertEqual(len(fake.prompts), 2)
        self.assertEqual(res["markdown"], page_md(flat))  # untouched
        self.assertEqual(res["diagrams"][0]["cells"][0][0], "Market Penetration\n• Product Development")
        self.assertIn("diagram_flattened", res["review_reasons"])
        self.assertTrue(res["needs_review"])

    def test_collapse_leaves_notes_and_clean_blocks_alone(self):
        self.assertEqual(convert.collapse_multiline_labels(GOOD), GOOD)
        noted = page_md(dict(ANSOFF, notes=["line one\nline two"]))
        self.assertEqual(convert.collapse_multiline_labels(noted), noted)

    def test_collapsed_vrio_label_accepted_via_original_lines(self):
        tl = "VRIO Framework\nYes Yes\nValuable Rare\nV R I O\n© The Consulting Club, FMS Delhi 2023-24 51"
        obj = {"type": "flow", "title": "VRIO Framework", "source_page": 52, "notes": [],
               "nodes": [{"id": "v", "label": "V\nValuable"}, {"id": "r", "label": "R\nRare"}],
               "edges": [{"from": "v", "to": "r", "label": "Yes"}]}
        md = ("# VRIO Framework\n```placewise-diagram\n" + json.dumps(obj) + "\n```\n"
              "Diagram summary: x.\n\n© The Consulting Club, FMS Delhi 2023-24 51\n")
        fake = FakeGemini([(md, "STOP"), (md, "STOP")])
        convert.transcribe_page = fake
        res = convert.convert_page_vision(b"png", 52, tl, False, [], "t")
        self.assertEqual(len(fake.prompts), 1)  # multiline is fixed by the collapse, no retry
        self.assertEqual([n["label"] for n in res["diagrams"][0]["nodes"]], ["V Valuable", "R Rare"])
        self.assertEqual(res["diagram_label_coverage"], 1.0)
        self.assertFalse(res["needs_review"], res["review_reasons"])
        self.assertEqual(res["label_lines"][normalize_label("V Valuable")], ["V", "Valuable"])

    def test_collapse_keeps_hyphen_at_line_break(self):
        obj = dict(ANSOFF, cells=[["Market Penetration", "Short-\nTerm"], ["Market Development", "Diversification"]])
        out, lines = convert.collapse_multiline_labels_with_lines(page_md(obj))
        self.assertIn('"Short-Term"', out)
        self.assertNotIn("Short- Term", out)
        self.assertEqual(lines[normalize_label("Short-Term")], ["Short-", "Term"])

    def test_no_nested_bullet_instruction(self):
        self.assertNotIn("nested bullet", convert.VISION_PROMPT)
        self.assertIs(convert.VISION_PROMPT_V2, convert.VISION_PROMPT)  # old name kept as an alias


class TestPromptR1DiagramsV2(unittest.TestCase):
    """R1.08: the six rules from the R1.06 review are in the prompt."""
    R1_DIAGRAMS_V1_LEN = 4607  # len(VISION_PROMPT) at r1-diagrams-v1

    def test_version(self):
        # r1-diagrams-v3 (R1.09) keeps every v2 rule; its own tests: test_missing_box.py
        self.assertIn(PROMPT_VERSION, ("r1-diagrams-v2", "r1-diagrams-v3"))

    def test_rules_present(self):
        p = convert.VISION_PROMPT
        for rule in (
            "Copy apostrophes and quotes exactly as printed: ’ is not ', “ is not \".",
            "Never create Markdown links. Write navigation text such as Main Index as plain text.",
            "Chevrons, arrow shapes and boxes placed in a row are a sequence: add an edge from each stage to the next",
            "If lines from two or more boxes join into one box (they converge), the diagram is a flow, not an issue_tree",
            "Never repeat a box under two parents.",
            "Letters or numbers printed in circles or badges (e.g. V, R, I, O; step numbers 1, 2, 3) are printed text",
            '(e.g. "V Valuable"). Never put printed text only in an id; ids are short letters (a, b, c).',
            "A diagram block is never inside a table cell. If a page has a table and a diagram, close the table first",
            "The Diagram summary only restates what is printed. Do not add outcomes, judgements or branches",
        ):
            self.assertIn(rule, p)

    def test_prompt_growth_small(self):
        # v2 grew 1,130 over v1; v3 growth is checked against v2 in test_missing_box.py
        self.assertLess(len(convert.VISION_PROMPT) - self.R1_DIAGRAMS_V1_LEN, 3000)

    def test_built_prompt_has_page_and_rules(self):
        p = convert.build_vision_prompt(52, "V R I O Valuable")
        self.assertIn('"source_page" to 52', p)
        self.assertIn("V Valuable", p)
        self.assertNotIn("{page_no}", p)

    def test_new_fix_hints(self):
        fid = {"diagram_issues": [
            {"block": 0, "code": "flow_disconnected", "severity": "warn", "detail": "7 separate pieces"},
            {"block": 0, "code": "tree_duplicate_label", "severity": "warn", "detail": "Crack the interview"},
            {"block": 1, "code": "block_in_table", "severity": "error", "detail": ""},
            {"block": 1, "code": "label_altered", "severity": "error", "detail": "4P's and 7P's"}]}
        hints = convert.diagram_fix_hints(fid, False, 14)
        self.assertTrue(any("the flow has separate pieces" in h for h in hints))
        self.assertTrue(any("'Crack the interview' is reached from more than one box" in h for h in hints))
        self.assertTrue(any("never put a diagram block inside a table cell" in h for h in hints))
        self.assertTrue(any("character for character" in h for h in hints))


if __name__ == "__main__":
    unittest.main()

"""R1.09 fix round: missing-box check, tuned convergence heuristic, prompt r1-diagrams-v3."""
import json
import unittest
from pathlib import Path

import convert
from config import PROMPT_VERSION
from convert import RETRY_WARN_CODES, diagram_fix_hints
from diagram_schema import FENCE_INFO, missing_box_lines
from fidelity import check_page

FIX = Path(__file__).parent / "fixtures" / "r1_gap"


def load(name):
    return json.loads((FIX / f"{name}.json").read_text())


def check(name):
    d = load(name)
    return check_page(d["text_layer"], d["markdown"], False, d["page_no"], label_lines=d["label_lines"])


def issues(res, code):
    return [i["detail"] for i in res["diagram_issues"] if i["code"] == code]


def block_md(obj):
    return f"```{FENCE_INFO}\n{json.dumps(obj)}\n```\nDiagram summary: x.\n"


TREE = {"type": "issue_tree", "title": None, "source_page": 3, "notes": [], "root": {
    "label": "Prepare", "children": [
        {"label": "Hard Skills", "children": [{"label": "Cases", "children": []}]},
        {"label": "Soft Skills", "children": [{"label": "Speaking", "children": []}]}]}}


class TestMissingBox(unittest.TestCase):
    def test_p11_smoke_box_moved_out_is_flagged(self):
        res = check("p11_smoke_v2")
        self.assertEqual(issues(res, "missing_box"), ["Crack the interview"])
        self.assertIn("diagram_missing_box", res["review_reasons"])
        self.assertTrue(res["needs_review"])

    def test_reviewed_pages_not_flagged(self):
        for name in ("p10", "p13_smoke_v2", "p14", "p19", "p20", "p52"):  # failing p13: page-wide test
            self.assertEqual(issues(check(name), "missing_box"), [], name)

    def test_synthetic_box_between_labels(self):
        tl = "Prepare\nHard Skills Soft Skills\nCases\nGet Hired\nSpeaking\n"
        md = block_md(TREE) + "\nGet Hired\n"
        self.assertEqual(missing_box_lines([TREE], tl, md), ["Get Hired"])

    def test_body_text_bullets_footer_and_headings_ignored(self):
        tl = ("Prepare\nHard Skills Soft Skills\n• Practise daily\nThis is a sentence.\n"
              "© Club 2023-24\nMain Index\nNotes:\nSection Tab\nCases\nSpeaking\n")
        md = "## Section Tab\n\n" + block_md(TREE)
        self.assertEqual(missing_box_lines([TREE], tl, md), [])

    def test_line_only_inside_longer_markdown_line_ignored(self):
        tl = "Prepare\nHard Skills Soft Skills\nGet Hired\nCases\nSpeaking\n"
        md = "Title\n\n" + block_md(TREE) + "\nYou will Get Hired if you prepare well and keep going\n"
        self.assertEqual(missing_box_lines([TREE], tl, md), [])

    def test_outside_label_span_ignored(self):
        tl = "Get Hired\nPrepare\nHard Skills Soft Skills\nCases\nSpeaking\n"
        self.assertEqual(missing_box_lines([TREE], tl, block_md(TREE) + "\nGet Hired\n"), [])

    def test_retry_wiring(self):
        self.assertIn("missing_box", RETRY_WARN_CODES)
        hints = diagram_fix_hints({"diagram_issues": [
            {"block": 0, "code": "missing_box", "severity": "warn", "detail": "Crack the interview"}]}, False, 11)
        self.assertTrue(any('"Crack the interview" is printed in the diagram but is not a node' in h for h in hints))


class TestMissingBoxPageWide(unittest.TestCase):
    """Step D: boxes written as plain lines on a page whose block is small or whose
    block labels sit on one text-layer line (FMS p13)."""

    def test_failing_p13_outputs_flagged(self):
        for name in ("p13", "p13_smoke_v3"):
            res = check(name)
            self.assertEqual(set(issues(res, "missing_box")),
                             {"Company", "Customer Competition", "Industry", "Government"}, name)
            self.assertIn("diagram_missing_box", res["review_reasons"], name)

    def test_passing_p13_and_reviewed_pages_clean(self):
        for name in ("p13_smoke_v2", "p10", "p14", "p19", "p20", "p11"):
            self.assertEqual(issues(check(name), "missing_box"), [], name)

    def test_needs_three_lines_and_ignores_section_tabs(self):
        tree = {"type": "issue_tree", "title": None, "source_page": 3, "notes": [], "root": {
            "label": "Other", "children": [{"label": "Costs", "children": []}, {"label": "Culture", "children": []}]}}
        tl = "Alpha\nBeta\nOther Costs Culture\nApproach\nRecommendations\n"
        md = "Title\n\nx\n\ny\n\nAlpha\n\nBeta\n\nApproach\n\nRecommendations\n\n" + block_md(tree)
        self.assertEqual(missing_box_lines([tree], tl, md), [])
        tl3 = "Alpha\nBeta\nGamma\nOther Costs Culture\n"
        md3 = "Title\n\nx\n\ny\n\nAlpha\n\nBeta\n\nGamma\n\n" + block_md(tree)
        self.assertEqual(missing_box_lines([tree], tl3, md3), ["Alpha", "Beta", "Gamma"])


class TestRepairTreeLeaves(unittest.TestCase):
    def test_leaves_get_empty_children(self):
        from postprocess import repair_tree_leaves
        tree = {"type": "issue_tree", "title": None, "source_page": 3, "notes": [], "root": {
            "label": "A", "children": [{"label": "B"}, {"label": "C", "children": None}]}}
        md, n = repair_tree_leaves("x\n" + block_md(tree))
        self.assertEqual(n, 2)
        self.assertIn('{"label": "B", "children": []}', md)
        self.assertIn("Diagram summary: x.", md)

    def test_untouched_when_valid_or_not_tree(self):
        from postprocess import repair_tree_leaves
        md = block_md(TREE) + block_md({"type": "flow", "nodes": [{"id": "a", "label": "B"}], "edges": []})
        self.assertEqual(repair_tree_leaves(md), (md, 0))

    def test_p52_smoke_v3_valid_after_postprocess(self):
        from postprocess import postprocess_markdown
        d = load("p52_smoke_v3")
        raw = check_page(d["text_layer"], d["markdown"], False, 52, label_lines=d["label_lines"])
        self.assertIn("diagram_invalid", raw["review_reasons"])
        md, ll, _, _ = postprocess_markdown(d["markdown"], d["text_layer"])
        res = check_page(d["text_layer"], md, False, 52, label_lines={**d["label_lines"], **ll})
        self.assertEqual([x["type"] for x in res["diagrams"]], ["flow", "issue_tree"])
        self.assertFalse(res["needs_review"], res["review_reasons"])


class TestConvergenceTuned(unittest.TestCase):
    def test_p11_still_flagged(self):
        self.assertEqual(issues(check("p11"), "tree_convergence_suspect"), ["Crack the interview"])

    def test_false_positives_cleared(self):
        for name in ("p13_smoke_v2", "p102", "p107", "p14", "p20"):
            self.assertEqual(issues(check(name), "tree_convergence_suspect"), [], name)


class TestPromptR1DiagramsV3(unittest.TestCase):
    R1_DIAGRAMS_V2_LEN = 5737  # len(VISION_PROMPT) at r1-diagrams-v2

    def test_version(self):
        self.assertEqual(PROMPT_VERSION, "r1-diagrams-v3")

    def test_rules_present(self):
        p = convert.VISION_PROMPT
        for rule in (
            "Every box in a diagram is a node in its block, including the box that lines or arrows converge into",
            "Never write a diagram box as plain text outside the block.",
            "If a box has two parents (lines from two boxes reach it), use a flow (Example 3).",
            "Example 3 (lines from two columns join into one final box",
            "NEVER estimate a value from a bar's height, a line's position, a slice's size or the axis gridlines.",
            'use null for its value (["2021", null])',
        ):
            self.assertIn(rule, p)

    def test_example3_is_valid_flow(self):
        from diagram_schema import check_diagrams
        p = convert.build_vision_prompt(7, "")
        start = p.index("Example 3")
        res = check_diagrams(p[start:p.index("RULES FOR BLOCKS")], "", 7)
        self.assertEqual([d["type"] for d in res["diagrams"]], ["flow"])
        self.assertEqual(res["diagram_errors"], 0)

    def test_prompt_growth_small(self):
        self.assertLess(len(convert.VISION_PROMPT) - self.R1_DIAGRAMS_V2_LEN, 1500)

    def test_number_hint_says_never_estimate(self):
        hints = diagram_fix_hints({"diagram_issues": [
            {"block": 0, "code": "number_not_on_page", "severity": "error", "detail": "13.5"}]}, False, 77)
        self.assertIn("never estimate a value from a bar height", hints[0])


if __name__ == "__main__":
    unittest.main()

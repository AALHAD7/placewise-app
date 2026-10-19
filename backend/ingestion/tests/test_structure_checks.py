"""R1.07: cheap structure checks - blocks inside table cells, disconnected flows,
repeated and converging issue-tree nodes."""
import json
import unittest
from pathlib import Path

import diagram_schema
from convert import RETRY_WARN_CODES, diagram_fix_hints
from diagram_schema import FENCE_INFO, IN_TABLE_ERROR, check_diagrams, extract_blocks
from fidelity import check_page

FIX = Path(__file__).parent / "fixtures" / "r1_gap"
STRUCTURE = {"block_in_table", "flow_disconnected", "tree_duplicate_label", "tree_convergence_suspect"}


def load(n):
    return json.loads((FIX / f"p{n}.json").read_text())


def check(n):
    d = load(n)
    return check_page(d["text_layer"], d["markdown"], False, n, label_lines=d["label_lines"])


def codes(res):
    return [it["code"] for it in res["diagram_issues"]]


def block_md(obj):
    return f"```{FENCE_INFO}\n{json.dumps(obj)}\n```\nDiagram summary: x.\n"


class TestBlockInTable(unittest.TestCase):
    def test_p77_flagged(self):
        res = check(77)
        self.assertGreaterEqual(codes(res).count("block_in_table"), 2)
        self.assertIn("diagram_in_table", res["review_reasons"])
        self.assertEqual(res["diagram_count"], 2)
        self.assertEqual(res["diagrams"], [])

    def test_p58_flagged_but_top_level_block_kept(self):
        res = check(58)
        self.assertIn("block_in_table", codes(res))
        self.assertIn("flow", [d["type"] for d in res["diagrams"]])  # the Value Chain block is not in a table
        blocks = extract_blocks(load(58)["markdown"])
        self.assertTrue(any(b["in_table"] and b["parse_error"] == IN_TABLE_ERROR for b in blocks))

    def test_p10_not_flagged(self):
        self.assertNotIn("block_in_table", codes(check(10)))

    def test_fence_between_table_rows(self):
        obj = {"type": "funnel", "title": None, "source_page": 1, "notes": [], "stages": ["A", "B"]}
        md = "| a | b |\n| --- | --- |\n" + block_md(obj) + "| c | d |\n"
        res = check_diagrams(md, "", 1)
        self.assertIn("block_in_table", codes(res))
        self.assertEqual(res["diagrams"], [])
        # the same block after a closed table (blank line) is fine
        md_ok = "| a | b |\n| --- | --- |\n\n" + block_md(obj) + "\ntext\n"
        self.assertEqual(check_diagrams(md_ok, "", 1)["diagrams"], [obj])

    def test_in_table_block_does_not_open_a_fake_fence(self):
        md = "| x | ```placewise-diagram\n{\"type\": \"funnel\"}\n``` | y |\n\n```placewise-diagram\n" \
             + json.dumps({"type": "funnel", "title": None, "source_page": 1, "notes": [], "stages": ["A", "B"]}) \
             + "\n```\nDiagram summary: x.\n"
        blocks = extract_blocks(md)
        self.assertEqual([b["in_table"] for b in blocks], [True, False])
        self.assertIsNone(blocks[1]["parse_error"])


class TestFlowDisconnected(unittest.TestCase):
    def test_p19_flagged(self):
        res = check(19)
        it = [i for i in res["diagram_issues"] if i["code"] == "flow_disconnected"]
        self.assertEqual(len(it), 1)
        self.assertIn("7", it[0]["detail"])
        self.assertIn("diagram_structure", res["review_reasons"])

    def test_p10_and_p52_not_flagged(self):
        self.assertNotIn("flow_disconnected", codes(check(10)))
        self.assertNotIn("flow_disconnected", codes(check(52)))


class TestTreeChecks(unittest.TestCase):
    def tree(self, root):
        return block_md({"type": "issue_tree", "title": None, "source_page": 1, "notes": [], "root": root})

    def test_duplicate_label(self):
        root = {"label": "Root", "children": [
            {"label": "Left", "children": [{"label": "Crack it", "children": []}, {"label": "Yes", "children": []}]},
            {"label": "Right", "children": [{"label": "Crack it", "children": []}, {"label": "Yes", "children": []}]}]}
        res = check_diagrams(self.tree(root), "", 1)
        dups = [i["detail"] for i in res["diagram_issues"] if i["code"] == "tree_duplicate_label"]
        self.assertEqual(dups, ["Crack it"])  # "Yes" is ignored

    def test_p11_convergence(self):
        if not diagram_schema.CONVERGENCE_CHECK_ENABLED:
            self.skipTest("convergence heuristic dropped (see out/r1_v2_rescore.json)")
        res = check(11)
        it = [i["detail"] for i in res["diagram_issues"] if i["code"] == "tree_convergence_suspect"]
        self.assertEqual(it, ["Crack the interview"])
        self.assertIn("diagram_structure", res["review_reasons"])

    def test_p10_p14_p20_no_structure_issue(self):
        for n in (10, 14, 20):
            self.assertEqual(STRUCTURE & set(codes(check(n))), set(), n)


class TestRetryWiring(unittest.TestCase):
    def test_retry_codes(self):
        self.assertTrue({"flow_disconnected", "tree_duplicate_label", "tree_convergence_suspect"} <= RETRY_WARN_CODES)

    def test_fix_hints(self):
        fid = {"diagram_issues": [
            {"block": 0, "code": "flow_disconnected", "severity": "warn", "detail": "7 separate pieces"},
            {"block": 1, "code": "tree_convergence_suspect", "severity": "warn", "detail": "Crack the interview"},
            {"block": 2, "code": "block_in_table", "severity": "error", "detail": ""}]}
        hints = diagram_fix_hints(fid, False, 1)
        self.assertIn("block 1: the flow has separate pieces; add an edge for every arrow or chevron between "
                      "stages, in order", hints)
        self.assertTrue(any("'Crack the interview' is reached from more than one box" in h for h in hints))
        self.assertTrue(any(h.startswith("never put a diagram block inside a table cell") for h in hints))


if __name__ == "__main__":
    unittest.main()

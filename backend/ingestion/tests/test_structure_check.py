"""R2.01 structure_check: claim list, prompt, reply parsing, dispute rule (offline)."""
import json
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import structure_check as sc  # noqa: E402


def block(obj, summary=None):
    s = "```placewise-diagram\n" + json.dumps(obj) + "\n```\n"
    if summary:
        s += "Diagram summary: " + summary + "\n"
    return s


TREE = {"type": "issue_tree", "title": None, "source_page": 1, "notes": [],
        "root": {"label": "Profit", "children": [
            {"label": "Revenue", "children": [{"label": "Price", "children": []},
                                              {"label": "Volume", "children": []}]},
            {"label": "Cost", "children": []}]}}
FLOW = {"type": "flow", "title": None, "source_page": 1, "notes": [],
        "nodes": [{"id": "a", "label": "Plan"}, {"id": "b", "label": "Build"}, {"id": "c", "label": "Ship"}],
        "edges": [{"from": "a", "to": "b"}, {"from": "b", "to": "c"}, {"from": "c", "to": "a"}]}


class EdgeList(unittest.TestCase):
    def test_two_level_tree(self):
        edges, sums = sc.edge_list("# T\n\n" + block(TREE, "Profit splits into revenue and cost."))
        self.assertEqual([(e["from"], e["to"]) for e in edges],
                         [("Profit", "Revenue"), ("Revenue", "Price"), ("Revenue", "Volume"), ("Profit", "Cost")])
        self.assertEqual([e["id"] for e in edges], ["E1", "E2", "E3", "E4"])
        self.assertEqual(edges[0]["text"], 'E1: "Profit" → "Revenue"')
        self.assertEqual(sums, [{"i": 0, "block": 0, "text": "Profit splits into revenue and cost."}])

    def test_three_edge_flow_numbered_after_tree(self):
        edges, sums = sc.edge_list(block(TREE) + "\n" + block(FLOW, "A cycle."))
        flow = [e for e in edges if e["block"] == 1]
        self.assertEqual([(e["id"], e["from"], e["to"]) for e in flow],
                         [("E5", "Plan", "Build"), ("E6", "Build", "Ship"), ("E7", "Ship", "Plan")])
        self.assertEqual(sums, [{"i": 0, "block": 1, "text": "A cycle."}])

    def test_in_table_block_skipped(self):
        md = "| a | b |\n|---|---|\n| x | ```placewise-diagram\n" + json.dumps(TREE) + "\n``` |\n"
        self.assertEqual(sc.edge_list(md), ([], []))
        self.assertFalse(sc.has_struct_block(md))

    def test_missing_node_id_kept_as_raw_id(self):
        f = dict(FLOW, edges=[{"from": "a", "to": "z"}])
        edges, _ = sc.edge_list(block(f))
        self.assertEqual(len(edges), 1)
        self.assertEqual(edges[0]["to"], "[node id z]")

    def test_other_types_ignored(self):
        m = {"type": "matrix", "title": None, "source_page": 1, "notes": [], "xAxis": "x", "yAxis": "y",
             "cols": ["a"], "rows": ["b"], "cells": [["c"]]}
        self.assertEqual(sc.edge_list(block(m)), ([], []))


class Prompt(unittest.TestCase):
    def test_prompt_lists_claims_and_summaries_no_text_layer(self):
        edges, sums = sc.edge_list(block(TREE, "S."))
        p = sc.build_prompt(edges, sums)
        self.assertIn('E4: "Profit" → "Cost"', p)
        self.assertIn("S0: S.", p)
        self.assertIn("JSON only", p)
        self.assertIn("Do not transcribe", p)


class Reply(unittest.TestCase):
    OK = {"edges": [{"id": "E1", "verdict": "drawn"}, {"id": "E2", "verdict": "drawn"}],
          "missing": [], "summaries": [{"i": 0, "verdict": "ok"}]}

    def test_unfenced_and_fenced(self):
        a = sc.parse_reply(json.dumps(self.OK), ["E1", "E2"], 1)
        b = sc.parse_reply("```json\n" + json.dumps(self.OK) + "\n```", ["E1", "E2"], 1)
        self.assertEqual(a, b)
        self.assertFalse(sc.dispute(a))

    def test_omitted_claim_is_unsure_and_disputes(self):
        r = sc.parse_reply(json.dumps(dict(self.OK, edges=[{"id": "E1", "verdict": "drawn"}])), ["E1", "E2"], 1)
        self.assertEqual(r["edges"][1], {"id": "E2", "verdict": "unsure", "why": "no verdict returned"})
        self.assertTrue(sc.dispute(r))

    def test_malformed_is_parse_error_and_disputes(self):
        r = sc.parse_reply('{"edges": [', ["E1"], 0)
        self.assertIn("parse_error", r)
        self.assertTrue(sc.dispute(r))

    def test_truncated_is_parse_error(self):
        r = sc.parse_reply(json.dumps(self.OK), ["E1", "E2"], 1, finish_reason="MAX_TOKENS")
        self.assertIn("parse_error", r)
        self.assertTrue(sc.dispute(r))


class Dispute(unittest.TestCase):
    def res(self, **k):
        base = {"edges": [{"id": "E1", "verdict": "drawn"}], "missing": [], "summaries": [{"i": 0, "verdict": "ok"}]}
        base.update(k)
        return base

    def test_clean(self):
        self.assertFalse(sc.dispute(self.res()))

    def test_each_trigger(self):
        self.assertTrue(sc.dispute(self.res(edges=[{"id": "E1", "verdict": "not_drawn"}])))
        self.assertTrue(sc.dispute(self.res(edges=[{"id": "E1", "verdict": "unsure"}])))
        self.assertTrue(sc.dispute(self.res(missing=[{"from": "a", "to": "b"}])))
        self.assertTrue(sc.dispute(self.res(summaries=[{"i": 0, "verdict": "overclaims"}])))
        self.assertTrue(sc.dispute({"parse_error": "x"}))


class Report(unittest.TestCase):
    def test_union_over_runs(self):
        recs = [{"page_no": 5, "run": 1, "dispute": False, "result": {"edges": [{"id": "E1", "verdict": "drawn"}]}},
                {"page_no": 5, "run": 2, "dispute": True,
                 "result": {"edges": [{"id": "E1", "verdict": "not_drawn", "why": "hangs from X"}]}}]
        s = sc.page_summary(5, recs, {"E1": 'E1: "a" → "b"'})
        self.assertTrue(s["disputed"])
        self.assertFalse(s["runs_agree"])
        self.assertEqual(s["not_drawn_edges"], [{"claim": 'E1: "a" → "b"', "runs": [2], "why": ["hangs from X"]}])


if __name__ == "__main__":
    unittest.main()

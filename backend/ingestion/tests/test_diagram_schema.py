"""Tests for diagram_schema.py. Run from backend/ingestion:
    venv/bin/python -m unittest tests.test_diagram_schema -v
"""
import json
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import diagram_schema as ds  # noqa: E402
from diagram_schema import (  # noqa: E402
    check_diagrams, collect_labels, collect_numbers, extract_blocks, label_findable, validate_block,
)
from textnorm import normalize_label  # noqa: E402


def block(obj, summary="Diagram summary: A test diagram.", fence="placewise-diagram"):
    body = obj if isinstance(obj, str) else json.dumps(obj, ensure_ascii=False, indent=1)
    out = f"```{fence}\n{body}\n```\n"
    if summary:
        out += f"\n{summary}\n"
    return out


def codes(issues, severity=None):
    return {i["code"] for i in issues if severity is None or i["severity"] == severity}


# FMS Consulting CaseBook 2023-24, PDF page 20 (footer prints "19").
ANSOFF_TEXT = (
    "FMS The Consulting Club Faculty of Management Studies University of Delhi\n"
    "Ansoff Matrix\nProduct\nExisting New\nMarket\nExisting\nMarket\nPenetration\n"
    "Product\nDevelopment\nNew\nMarket\nDevelopment Diversification\n"
    "Best suitable for Growth Strategy cases, also handy for Market Entry, Revenue Expansion\n"
    "© The Consulting Club, FMS Delhi | 2023-24 | 19"
)
ANSOFF = {
    "type": "matrix", "title": "Ansoff Matrix", "source_page": 20,
    "xAxis": "Product", "yAxis": "Market",
    "cols": ["Existing", "New"], "rows": ["Existing", "New"],
    "cells": [["Market Penetration", "Product Development"],
              ["Market Development", "Diversification"]],
    "notes": ["Best suitable for Growth Strategy cases, also handy for Market Entry, Revenue Expansion"],
}

TREE = {
    "type": "issue_tree", "title": "Profit decline", "source_page": 5, "notes": [],
    "root": {"label": "Profit decline", "children": [
        {"label": "Revenue", "children": [
            {"label": "Price", "children": []}, {"label": "Volume", "children": []}]},
        {"label": "Cost", "children": [
            {"label": "Fixed", "children": []}, {"label": "Variable", "children": []}]}]},
}
TREE_TEXT = "Profit decline\nRevenue Cost\nPrice Volume Fixed Variable"

FUNNEL = {"type": "funnel", "title": None, "source_page": 3, "notes": [],
          "stages": ["Awareness", "Consideration", "Purchase"]}
FLOW = {"type": "flow", "title": "Value chain", "source_page": 4, "notes": [],
        "nodes": [{"id": "a", "label": "Inbound logistics"}, {"id": "b", "label": "Operations"}],
        "edges": [{"from": "a", "to": "b", "label": None}]}
CHART = {"type": "chart", "title": None, "source_page": 6, "notes": [], "chart_kind": "bar",
         "xLabel": "Year", "yLabel": "Revenue (₹ Cr)",
         "series": [{"name": "Revenue", "points": [["FY22", 120], ["FY23", 145.5]]}]}
CHART_TEXT = "Year Revenue (₹ Cr) FY22 FY23 120 145.5"
TABLE = {"type": "table", "title": None, "source_page": 7, "notes": [],
         "header": ["Segment", "Share"], "rows": [["Urban", "60%"], ["Rural", "40%"]]}
OTHER = {"type": "other", "title": None, "source_page": 8, "notes": [],
         "description": "A Venn diagram", "labels": ["Desirability", "Feasibility"]}


class TestValidateBlockPerType(unittest.TestCase):
    def assertValid(self, obj, page):
        errs = [i for i in validate_block(obj, page) if i["severity"] == "error"]
        self.assertEqual(errs, [])

    def assertError(self, obj, page, code):
        self.assertIn(code, codes(validate_block(obj, page), "error"))

    # issue_tree
    def test_issue_tree_valid(self):
        self.assertValid(TREE, 5)

    def test_issue_tree_missing_children(self):
        bad = json.loads(json.dumps(TREE))
        del bad["root"]["children"][0]["children"][1]["children"]
        self.assertError(bad, 5, "bad_shape")

    def test_issue_tree_depth_cap(self):
        node = {"label": "leaf", "children": []}
        for _ in range(15):
            node = {"label": "n", "children": [node]}
        bad = dict(TREE, root=node)
        self.assertError(bad, 5, "bad_shape")

    # matrix
    def test_matrix_valid(self):
        self.assertValid(ANSOFF, 20)

    def test_matrix_wrong_cell_count(self):
        bad = dict(ANSOFF, cells=[["Market Penetration"], ["Market Development", "Diversification"]])
        self.assertError(bad, 20, "bad_shape")

    def test_matrix_empty_rows(self):
        self.assertError(dict(ANSOFF, rows=[], cells=[]), 20, "bad_shape")

    # funnel
    def test_funnel_valid(self):
        self.assertValid(FUNNEL, 3)

    def test_funnel_one_stage(self):
        self.assertError(dict(FUNNEL, stages=["Awareness"]), 3, "bad_shape")

    # flow
    def test_flow_valid(self):
        self.assertValid(FLOW, 4)

    def test_flow_dangling_edge(self):
        bad = dict(FLOW, edges=[{"from": "a", "to": "z", "label": None}])
        self.assertError(bad, 4, "dangling_edge")

    # chart
    def test_chart_valid(self):
        self.assertValid(CHART, 6)

    def test_chart_no_points_is_warn_only(self):
        qual = dict(CHART, chart_kind="line", series=[{"name": "Demand", "points": []}])
        issues = validate_block(qual, 6)
        self.assertIn("chart_no_data", codes(issues, "warn"))
        self.assertEqual(codes(issues, "error"), set())

    def test_chart_bad_kind(self):
        self.assertError(dict(CHART, chart_kind="scatter"), 6, "bad_shape")

    def test_chart_non_numeric_y(self):
        bad = dict(CHART, series=[{"name": "R", "points": [["FY22", "120"]]}])
        self.assertError(bad, 6, "bad_shape")

    # table
    def test_table_valid(self):
        self.assertValid(TABLE, 7)

    def test_table_rows_not_lists(self):
        self.assertError(dict(TABLE, rows=["Urban", "Rural"]), 7, "bad_shape")

    # other
    def test_other_shape_ok_but_always_error(self):
        issues = validate_block(OTHER, 8)
        self.assertEqual(codes(issues, "error"), {"type_other"})

    def test_other_bad_shape(self):
        bad = dict(OTHER)
        del bad["description"]
        self.assertTrue({"type_other", "bad_shape"} <= codes(validate_block(bad, 8), "error"))

    # common
    def test_unknown_type(self):
        self.assertError(dict(FUNNEL, type="venn"), 3, "unknown_type")

    def test_source_page_mismatch(self):
        self.assertError(ANSOFF, 19, "source_page_mismatch")

    def test_source_page_none_skips_mismatch(self):
        self.assertNotIn("source_page_mismatch", codes(validate_block(ANSOFF, None)))

    def test_source_page_missing(self):
        bad = dict(FUNNEL)
        del bad["source_page"]
        self.assertError(bad, 3, "bad_shape")

    def test_unreadable_anywhere(self):
        bad = dict(FUNNEL, stages=["Awareness", "[UNREADABLE]"])
        self.assertError(bad, 3, "unreadable")

    def test_missing_title_notes_warn(self):
        lean = {"type": "funnel", "source_page": 3, "stages": ["A", "B"]}
        issues = validate_block(lean, 3)
        self.assertEqual(codes(issues, "error"), set())
        self.assertIn("missing_field", codes(issues, "warn"))


class TestExtractBlocks(unittest.TestCase):
    def test_two_blocks_one_page(self):
        md = "# Page\n\n" + block(ANSOFF) + "\nSome text.\n\n" + block(dict(FUNNEL, source_page=20))
        blocks = extract_blocks(md)
        self.assertEqual(len(blocks), 2)
        self.assertEqual([b["index"] for b in blocks], [0, 1])
        self.assertEqual(blocks[0]["obj"]["type"], "matrix")
        self.assertEqual(blocks[1]["obj"]["type"], "funnel")
        self.assertEqual(blocks[0]["summary"], "A test diagram.")
        self.assertTrue(md[blocks[0]["start"]:blocks[0]["end"]].startswith("```placewise-diagram"))
        self.assertTrue(md[blocks[0]["start"]:blocks[0]["end"]].endswith("```"))
        # BLOCK_RE agrees with the scanner on closed blocks
        self.assertEqual(len(ds.BLOCK_RE.findall(md)), 2)

    def test_missing_summary(self):
        blocks = extract_blocks(block(ANSOFF, summary=None) + "\nNext paragraph.\n")
        self.assertIsNone(blocks[0]["summary"])

    def test_invalid_json(self):
        blocks = extract_blocks(block('{"type": "matrix", "rows": [}'))
        self.assertIsNone(blocks[0]["obj"])
        self.assertIsNotNone(blocks[0]["parse_error"])

    def test_unclosed_fence(self):
        blocks = extract_blocks("text\n```placewise-diagram\n{\"type\": \"funnel\"}\n")
        self.assertEqual(len(blocks), 1)
        self.assertIn("unclosed", blocks[0]["parse_error"])

    def test_plain_code_fence_ignored(self):
        md = "```python\nprint(1)\n```\n\n```json\n{\"a\": 1}\n```\n"
        self.assertEqual(extract_blocks(md), [])


class TestLabels(unittest.TestCase):
    def test_collect_labels_matrix(self):
        labels = collect_labels(ANSOFF)
        for want in ("Ansoff Matrix", "Product", "Market", "Existing", "New",
                     "Market Penetration", "Diversification", ANSOFF["notes"][0]):
            self.assertIn(want, labels)

    def test_collect_labels_and_numbers_chart(self):
        self.assertIn("FY22", collect_labels(CHART))
        self.assertIn("Revenue (₹ Cr)", collect_labels(CHART))
        self.assertEqual(collect_numbers(CHART), ["120", "145.5"])

    def test_collect_labels_flow_edges(self):
        flow = dict(FLOW, edges=[{"from": "a", "to": "b", "label": "feeds"}])
        self.assertIn("feeds", collect_labels(flow))

    def test_normalize(self):
        self.assertEqual(normalize_label("Short-\nTerm"), "short term")
        self.assertEqual(normalize_label("Short-\nTerm"), normalize_label("Short-Term"))
        self.assertEqual(normalize_label("  Growth: 12.5%! "), "growth 12.5%")
        self.assertEqual(normalize_label("ＣＡＧＲ"), "cagr")

    def test_findable_out_of_order_tokens(self):
        # 3+ tokens: bag-of-words fallback (scrambled multi-line box)
        text = normalize_label("Competitive ... Short-Term Disadvantage")
        self.assertTrue(label_findable("Short-Term Competitive Disadvantage", text, set(text.split())))
        # 2 tokens: phrase match only
        text = normalize_label("Penetration ... Market")
        self.assertFalse(label_findable("Market Penetration", text, set(text.split())))
        self.assertFalse(label_findable("Market Saturation", text, set(text.split())))

    def test_findable_whole_words_only(self):
        for label, page in (("Tax", "Corporate taxation rules"), ("Art", "restart the process")):
            text = normalize_label(page)
            self.assertFalse(label_findable(label, text, set(text.split())), label)
        text = normalize_label("Tax rate and art direction")
        self.assertTrue(label_findable("Tax", text, set(text.split())))
        self.assertTrue(label_findable("Art", text, set(text.split())))


class TestCheckDiagrams(unittest.TestCase):
    KEYS = {"diagram_count", "diagrams", "diagram_issues", "diagram_label_coverage", "diagram_errors"}

    def test_ansoff_valid(self):
        res = check_diagrams("# Ansoff Matrix\n\n" + block(ANSOFF), ANSOFF_TEXT, 20)
        self.assertEqual(set(res), self.KEYS)
        self.assertEqual(res["diagram_count"], 1)
        self.assertEqual(res["diagrams"], [ANSOFF])
        self.assertEqual(res["diagram_errors"], 0, res["diagram_issues"])
        self.assertEqual(res["diagram_label_coverage"], 1.0)

    def test_issue_tree_label_not_on_page(self):
        tree = json.loads(json.dumps(TREE))
        tree["root"]["children"][1]["children"].append({"label": "Semi-variable", "children": []})
        res = check_diagrams(block(tree), TREE_TEXT, 5)
        misses = [i for i in res["diagram_issues"] if i["code"] == "label_not_on_page"]
        self.assertEqual([i["detail"] for i in misses], ["Semi-variable"])
        self.assertLess(res["diagram_label_coverage"], 1.0)
        self.assertEqual(res["diagrams"], [tree])  # structurally valid, label miss reported separately

    def test_chart_numbers(self):
        ok = check_diagrams(block(CHART), CHART_TEXT, 6)
        self.assertEqual(ok["diagram_errors"], 0, ok["diagram_issues"])
        bad = dict(CHART, series=[{"name": "Revenue", "points": [["FY22", 120], ["FY23", 150]]}])
        res = check_diagrams(block(bad), CHART_TEXT, 6)
        self.assertIn(("number_not_on_page", "150"),
                      {(i["code"], i["detail"]) for i in res["diagram_issues"]})

    def test_no_text_layer_coverage_none(self):
        res = check_diagrams(block(ANSOFF), "", 20)
        self.assertIsNone(res["diagram_label_coverage"])
        self.assertEqual(res["diagram_errors"], 0)

    def test_missing_summary_error(self):
        res = check_diagrams(block(ANSOFF, summary=None), ANSOFF_TEXT, 20)
        self.assertIn("missing_summary", codes(res["diagram_issues"], "error"))

    def test_invalid_json_error(self):
        res = check_diagrams(block("{not json"), ANSOFF_TEXT, 20)
        self.assertEqual(res["diagram_count"], 1)
        self.assertEqual(res["diagrams"], [])
        self.assertIn("invalid_json", codes(res["diagram_issues"], "error"))

    def test_source_page_mismatch_error(self):
        res = check_diagrams(block(ANSOFF), ANSOFF_TEXT, 19)
        self.assertIn("source_page_mismatch", codes(res["diagram_issues"], "error"))
        self.assertEqual(res["diagrams"], [])

    def test_wrong_fence_json(self):
        res = check_diagrams(block(ANSOFF, fence="json"), ANSOFF_TEXT, 20)
        self.assertEqual(res["diagram_count"], 1)
        self.assertIn("wrong_fence", codes(res["diagram_issues"], "error"))
        self.assertEqual(res["diagrams"], [])

    def test_wrong_fence_untagged(self):
        res = check_diagrams(block(ANSOFF, fence=""), ANSOFF_TEXT, 20)
        self.assertIn("wrong_fence", codes(res["diagram_issues"], "error"))

    def test_other_always_error(self):
        res = check_diagrams(block(OTHER), "Desirability Feasibility Viability", 8)
        self.assertIn("type_other", codes(res["diagram_issues"], "error"))
        self.assertGreater(res["diagram_errors"], 0)

    def test_chart_no_data_warn_only(self):
        qual = dict(CHART, chart_kind="line", xLabel="Quantity", yLabel="Price",
                    series=[{"name": "Demand", "points": []}])
        res = check_diagrams(block(qual), "Quantity Price Demand", 6)
        self.assertEqual(res["diagram_errors"], 0, res["diagram_issues"])
        self.assertIn("chart_no_data", codes(res["diagram_issues"], "warn"))

    def test_two_blocks_both_returned(self):
        funnel = dict(FUNNEL, source_page=20)
        text = ANSOFF_TEXT + "\nAwareness Consideration Purchase"
        res = check_diagrams(block(ANSOFF) + "\n" + block(funnel), text, 20)
        self.assertEqual(res["diagram_count"], 2)
        self.assertEqual(len(res["diagrams"]), 2)

    def test_no_blocks(self):
        res = check_diagrams("Just text.", "Just text.", 1)
        self.assertEqual(res["diagram_count"], 0)
        self.assertIsNone(res["diagram_label_coverage"])


class TestStructureWarnings(unittest.TestCase):
    """R1.03 fix round: lost structure is a warning, not a schema error."""
    GROCERY_TEXT = ("Groceries\nDairy Fruits Vegetables\n• Milk\n• Butter\n• Egg\n• Apple\n"
                    "• Grapes\n• Banana")

    def flat_tree(self, notes):
        return {"type": "issue_tree", "title": None, "source_page": 32, "notes": notes,
                "root": {"label": "Groceries", "children": [
                    {"label": "Dairy", "children": []}, {"label": "Fruits", "children": []}]}}

    def test_children_in_notes_warns(self):
        res = check_diagrams(block(self.flat_tree(["Milk", "Butter", "Egg"])), self.GROCERY_TEXT, 32)
        flat = [i for i in res["diagram_issues"] if i["code"] == "notes_flattened"]
        self.assertEqual(len(flat), 1)
        self.assertEqual(flat[0]["severity"], "warn")
        self.assertIn("Milk", flat[0]["detail"])
        self.assertEqual(res["diagram_errors"], 0)
        self.assertEqual(len(res["diagrams"]), 1)  # still a valid block

    def test_bulleted_note_string_warns(self):
        res = check_diagrams(block(self.flat_tree(["• Apple • Grapes • Banana"])), self.GROCERY_TEXT, 32)
        self.assertIn("notes_flattened", codes(res["diagram_issues"], "warn"))

    def test_one_short_note_or_caption_does_not_warn(self):
        res = check_diagrams(block(self.flat_tree(["Milk"])), self.GROCERY_TEXT, 32)
        self.assertNotIn("notes_flattened", codes(res["diagram_issues"]))
        res = check_diagrams("# Ansoff Matrix\n\n" + block(ANSOFF), ANSOFF_TEXT, 20)
        self.assertNotIn("notes_flattened", codes(res["diagram_issues"]))

    def test_notes_that_are_node_labels_do_not_warn(self):
        res = check_diagrams(block(self.flat_tree(["Dairy", "Fruits"])), self.GROCERY_TEXT, 32)
        self.assertNotIn("notes_flattened", codes(res["diagram_issues"]))

    def test_flow_without_edges_warns(self):
        flow = dict(FLOW, edges=[])
        issues = validate_block(flow, 4)
        self.assertIn("flow_no_edges", codes(issues, "warn"))
        self.assertNotIn("flow_no_edges", codes(issues, "error"))
        self.assertNotIn("flow_no_edges", codes(validate_block(FLOW, 4)))


class TestMultilineLabels(unittest.TestCase):
    TEXT = "Profits Revenues Costs Short-Term Competitive Disadvantage Geography Customer Segments"

    def tree(self, labels):
        return {"type": "issue_tree", "title": None, "source_page": 32, "notes": [],
                "root": {"label": "Profits", "children": [{"label": l, "children": []} for l in labels]}}

    def test_plain_multiline_label_warns(self):
        res = check_diagrams(block(self.tree(["Short-Term\nCompetitive\nDisadvantage"])), self.TEXT, 32)
        self.assertIn("label_multiline", codes(res["diagram_issues"], "warn"))
        self.assertNotIn("label_flattened", codes(res["diagram_issues"]))
        self.assertEqual(res["diagram_errors"], 0)

    def test_bulleted_label_is_flattening(self):
        res = check_diagrams(block(self.tree(["Revenues\n• Geography\n• Customer Segments"])), self.TEXT, 32)
        self.assertIn("label_flattened", codes(res["diagram_issues"], "warn"))
        self.assertNotIn("label_multiline", codes(res["diagram_issues"]))

    def test_single_line_labels_no_warning(self):
        res = check_diagrams(block(self.tree(["Revenues", "Costs"])), self.TEXT, 32)
        self.assertFalse(codes(res["diagram_issues"]) & {"label_multiline", "label_flattened"})


class TestMultilineLabelLines(unittest.TestCase):
    """Orchestrator decision: a multi-line label passes if every line is on the
    page on its own (whole words); single-line labels stay strict (M1)."""
    VRIO_TEXT = "Yes Yes Valuable Rare Inimitable Organized\nCompetitive Parity\nV R I O\nVRIO Framework"

    def flow(self, label):
        return {"type": "flow", "title": "VRIO Framework", "source_page": 52, "notes": [],
                "nodes": [{"id": "v", "label": label}, {"id": "r", "label": "Competitive Parity"}],
                "edges": [{"from": "v", "to": "r", "label": None}]}

    def misses(self, label, text, page=52, label_lines=None):
        res = check_diagrams(block(self.flow(label)), text, page, label_lines)
        return [i["detail"] for i in res["diagram_issues"] if i["code"] == "label_not_on_page"]

    def test_lines_printed_separately_pass(self):
        self.assertEqual(self.misses("V\nValuable", self.VRIO_TEXT), [])

    def test_line_wise_still_whole_words(self):
        self.assertIn("Tax\nRate", self.misses("Tax\nRate", "The taxation rate rose", page=52))

    def test_single_line_stays_strict(self):
        self.assertEqual(self.misses("V Valuable", self.VRIO_TEXT), ["V Valuable"])

    def test_collapsed_label_remembers_its_lines(self):
        lines = {normalize_label("V Valuable"): ["V", "Valuable"]}
        self.assertEqual(self.misses("V Valuable", self.VRIO_TEXT, label_lines=lines), [])
        bad = {normalize_label("Tax Rate"): ["Tax", "Rate"]}
        self.assertIn("Tax Rate", self.misses("Tax Rate", "The taxation rate rose", label_lines=bad))

    def test_every_line_must_match(self):
        self.assertEqual(self.misses("V\nVictorious", self.VRIO_TEXT), ["V\nVictorious"])


FMS_PDF = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
                       "Data", "Consulting Files", "PDF Files", "The FMS Consulting CaseBook 2023-24 (1).pdf")


def _norm_ctx(text):
    t = normalize_label(text)
    return t, set(t.split(" "))


class TestLineRuleInOrderWindow(unittest.TestCase):
    """Round-2 review: the line-by-line rule needs in-order, close-together
    tokens and a content word per line."""

    def found(self, label, page_text, label_lines=None):
        t, w = _norm_ctx(page_text)
        return ds._label_on_page(label, t, w, label_lines)

    def test_cost_growth_far_apart_not_found(self):
        page = ("Revenue drivers are price and volume. Cost structure is mostly fixed. "
                "The team reviewed the regional sales data in detail last quarter. Market growth slowed.")
        self.assertFalse(self.found("Cost\nGrowth", page))
        lines = {normalize_label("Cost Growth"): ["Cost", "Growth"]}
        self.assertFalse(self.found("Cost Growth", page, lines))  # collapsed form too

    def test_stopword_lines_not_found(self):
        page = "a the a the market"
        self.assertFalse(self.found("a\nthe", page))
        self.assertFalse(self.found("Market\nthe", page))
        # a verbatim wrapped label with a function-word line still passes as a phrase
        self.assertTrue(self.found("Threat\nof the\nNew Entrants", "Porter: Threat of the New Entrants"))

    def test_market_strategy_far_apart_not_found(self):
        page = "Market " + " ".join(f"word{k}" for k in range(20)) + " Strategy"
        self.assertFalse(self.found("Market\nStrategy", page))

    def test_in_order_close_together_found(self):
        page = "Overview: Market entry Strategy options for the client"
        self.assertTrue(self.found("Market\nStrategy", page))  # one stray word allowed

    def test_market_strategy_two_words_apart_not_found(self):
        # Round-2 orchestrator check: a 2*n+2 window let this made-up label through.
        page = "Market share held. The strategy team met."
        self.assertFalse(self.found("Market\nStrategy", page))
        lines = {normalize_label("Market Strategy"): ["Market", "Strategy"]}
        self.assertFalse(self.found("Market Strategy", page, lines))

    def test_wrong_order_not_found(self):
        self.assertFalse(self.found("Strategy\nMarket", "Market entry Strategy options"))

    def test_every_occurrence_of_first_line_tried(self):
        page = "Cost of goods rose sharply this year. Later: Cost Growth was flat."
        self.assertTrue(self.found("Cost\nGrowth", page))

    def test_initial_needs_matching_word(self):
        page = "V R I O Valuable Rare"
        self.assertTrue(self.found("V\nValuable", page))
        self.assertFalse(self.found("V\nRare", page))       # V is not the initial of Rare
        self.assertFalse(self.found("Q\nQuality", page))    # Quality not on page
        self.assertFalse(self.found("X\nXylophone", "Xylophone"))  # X not on page

    def test_rejected_collapsed_label_is_label_not_on_page(self):
        flow = {"type": "flow", "title": None, "source_page": 9, "notes": [],
                "nodes": [{"id": "a", "label": "Cost Growth"}, {"id": "b", "label": "Revenue"}],
                "edges": [{"from": "a", "to": "b", "label": None}]}
        page = "Revenue is up. Cost is flat. Many other words appear here between them. Growth."
        res = check_diagrams(block(flow), page, 9, {normalize_label("Cost Growth"): ["Cost", "Growth"]})
        self.assertIn("Cost Growth", [i["detail"] for i in res["diagram_issues"] if i["code"] == "label_not_on_page"])
        self.assertLess(res["diagram_label_coverage"], 1.0)

    @unittest.skipUnless(os.path.exists(FMS_PDF), "local FMS casebook PDF not present")
    def test_vrio_on_real_p52_text_layer(self):
        import pypdfium2 as pdfium
        pdf = pdfium.PdfDocument(FMS_PDF)
        try:
            text = pdf[51].get_textpage().get_text_range()
        finally:
            pdf.close()
        for lab in ("V\nValuable", "R\nRare", "I\nInimitable", "O\nOrganized",
                    "Short-Term\nCompetitive\nDisadvantage", "Under-utilized\nCompetitive\nDisadvantage"):
            self.assertTrue(self.found(lab, text), lab)
        self.assertFalse(self.found("Cost\nGrowth", text))
        self.assertFalse(self.found("V Valuable", text))  # single-line stays strict


class TestModuleImports(unittest.TestCase):
    def test_stdlib_and_textnorm_only(self):
        import ast
        with open(ds.__file__, encoding="utf-8") as f:
            src = f.read()
        mods = set()
        for node in ast.walk(ast.parse(src)):
            if isinstance(node, ast.Import):
                mods |= {a.name.split(".")[0] for a in node.names}
            elif isinstance(node, ast.ImportFrom):
                mods.add((node.module or "").split(".")[0])
        allowed = set(sys.stdlib_module_names) | {"textnorm"}
        self.assertEqual(mods - allowed, set())


if __name__ == "__main__":
    unittest.main()

"""R2.06 run_v4: reason merge, in-table drop rule, visual_no_block, cache hits (offline)."""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import run_v4 as v4  # noqa: E402
from chunk import chunk_document, embedding_text  # noqa: E402
from pipeline import chunkable_pages  # noqa: E402
from run_repilot import text_key  # noqa: E402


class TestMerge(unittest.TestCase):
    def test_human_and_structure_flags_survive(self):
        v3 = ["fidelity_review:structure_lost", "structure_check:dispute", "fallback_v1"]
        out, added, dropped = v4.merge_reasons(v3, [], 51, set())
        self.assertEqual(out, v3)
        self.assertEqual((added, dropped), ([], []))

    def test_union_adds_new_reasons(self):
        out, added, _ = v4.merge_reasons(["fidelity_review:missing"], ["number_coverage"], 230, set())
        self.assertEqual(out, ["fidelity_review:missing", "number_coverage"])
        self.assertEqual(added, ["number_coverage"])

    def test_in_table_dropped_only_on_proven_fp(self):
        # proven false positive and the new check no longer raises it -> dropped
        out, _, dropped = v4.merge_reasons(["diagram_in_table"], [], 58, {58})
        self.assertEqual((out, dropped), ([], ["diagram_in_table"]))
        # proven, but the new check still raises it -> kept
        self.assertEqual(v4.merge_reasons(["diagram_in_table"], ["diagram_in_table"], 58, {58})[0],
                         ["diagram_in_table"])
        # not proven -> kept
        self.assertEqual(v4.merge_reasons(["diagram_in_table"], [], 59, {58})[0], ["diagram_in_table"])
        # other reasons on a proven page are never dropped
        self.assertEqual(v4.merge_reasons(["diagram_in_table", "fidelity_review:altered"], [], 58, {58})[0],
                         ["fidelity_review:altered"])

    def test_proven_fps_from_fixcheck(self):
        fc = {"in_table": {"58": "false_positive_fixed", "59": "real_still_flagged", "60": "clean"}}
        self.assertEqual(v4.proven_in_table_fps(fc), {58})
        self.assertEqual(v4.proven_in_table_fps({}), set())


class TestVisualNoBlock(unittest.TestCase):
    def test_k_zero_adds_nothing(self):
        self.assertEqual(v4.apply_visual_no_block([], True, 0, 0), [])

    def test_k_positive_unflagged_visual_no_block(self):
        self.assertEqual(v4.apply_visual_no_block([], True, 0, 1), ["visual_no_block"])

    def test_not_applied_when_flagged_or_has_block_or_not_visual(self):
        self.assertEqual(v4.apply_visual_no_block(["word_coverage"], True, 0, 2), ["word_coverage"])
        self.assertEqual(v4.apply_visual_no_block([], True, 1, 2), [])
        self.assertEqual(v4.apply_visual_no_block([], False, 0, 2), [])

    def test_triage_k(self):
        self.assertEqual(v4.triage_k("0/10 missing"), 0)
        self.assertEqual(v4.triage_k("3/19 missing"), 3)
        with self.assertRaises(ValueError):
            v4.triage_k(None)


class TestCarryPage(unittest.TestCase):
    ROW = {"id": "x", "page_no": 7, "is_text": True, "is_table": False, "is_visual": False, "is_scanned": False,
           "text_layer": "Market sizing approach\nPopulation 1000 households 250",
           "markdown": "# Market sizing approach\n\nPopulation 1000, households 250",
           "docling_markdown": None, "method": "carried_v2", "prompt_version": "v2",
           "needs_review": True, "review_reasons": ["fidelity_review:missing"]}

    def test_unchanged_page_keeps_flags_and_fields(self):
        page, info = v4.carry_page(dict(self.ROW), {}, set(), 0)
        self.assertFalse(info["changed"])
        self.assertEqual(page["markdown"], self.ROW["markdown"])
        self.assertEqual(page["review_reasons"], ["fidelity_review:missing"])
        self.assertTrue(page["needs_review"])
        self.assertEqual((page["method"], page["prompt_version"]), ("carried_v2", "v2"))

    def test_fix_applied(self):
        row = dict(self.ROW, markdown="FMS | Guesestimate Index;) | Main Index;)\n\n# Market sizing approach",
                   text_layer="FMS Guesstimate Index Main Index\nMarket sizing approach", review_reasons=[],
                   needs_review=False)
        page, info = v4.carry_page(row, {}, set(), 0)
        self.assertTrue(info["changed"])
        self.assertTrue(page["markdown"].startswith("FMS | Guesstimate Index | Main Index"))

    def test_label_lines_source(self):
        v3_ll, v2_ll, v1_ll = {1: {"a": ["x"]}}, {1: {"b": ["y"]}, 2: {"c": ["z"]}}, {3: {"d": ["w"]}}
        self.assertEqual(v4.label_lines_for({"page_no": 1, "method": "gemini_vision_v2"}, v3_ll, v2_ll, v1_ll), {"a": ["x"]})
        self.assertEqual(v4.label_lines_for({"page_no": 1, "method": "carried_v2"}, v3_ll, v2_ll, v1_ll), {"b": ["y"]})
        self.assertEqual(v4.label_lines_for({"page_no": 3, "method": "fallback_v1"}, v3_ll, v2_ll, v1_ll), {"d": ["w"]})

    def test_unchanged_page_chunks_all_cache_hits(self):
        page, info = v4.carry_page(dict(self.ROW), {}, set(), 0)
        self.assertFalse(info["changed"])
        v3_chunks = chunk_document(chunkable_pages([dict(self.ROW)]))
        cache = {"vectors": {text_key(embedding_text(c["content"])): [0.0] * 768 for c in v3_chunks}}
        v4_chunks = chunk_document(chunkable_pages([page]))
        self.assertGreater(len(v4_chunks), 0)
        self.assertEqual(v4.new_embed_texts(v4_chunks, cache), 0)

    def test_drift_pages(self):
        infos = [{"page_no": 1, "changed": False, "new_auto_reasons": ["word_coverage"]},
                 {"page_no": 2, "changed": True, "new_auto_reasons": ["word_coverage"]},
                 {"page_no": 3, "changed": False, "new_auto_reasons": []}]
        self.assertEqual(v4.drift_pages(infos), [1])


if __name__ == "__main__":
    unittest.main()

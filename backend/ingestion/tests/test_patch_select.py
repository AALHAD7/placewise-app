"""R1.09 run_patch: page selection, per-page choice, insert-only write (offline)."""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pipeline  # noqa: E402
import run_patch as rp  # noqa: E402
from tests.test_pipeline_write import FakeClient  # noqa: E402


def pg(nc, wc, visual=False, **k):
    return {"page_no": 1, "number_coverage": nc, "word_coverage": wc, "is_visual": visual,
            "needs_review": False, "review_reasons": [], "markdown": "m", **k}


class Selection(unittest.TestCase):
    def test_priority_and_dedupe(self):
        groups = [("a", [5, 1]), ("b", [1, 2, 3]), ("c", [4])]
        sel, trim = rp.select_patch_pages(groups, cap=100)
        self.assertEqual(sel, [(5, "a"), (1, "a"), (2, "b"), (3, "b"), (4, "c")])
        self.assertEqual(trim, [])

    def test_trim_at_small_cap(self):
        groups = [("review", [11, 13]), ("in_table", [58, 59]), ("words", [200])]
        sel, trim = rp.select_patch_pages(groups, cap=5, est_per_page=1.4)  # 3 pages -> ceil(4.2)=5
        self.assertEqual([n for n, _ in sel], [11, 13, 58])
        self.assertEqual(trim, [(59, "in_table"), (200, "words")])

    def test_priority_groups_from_rescore(self):
        rescore = {"flagged_new": {"diagram_in_table": [77, 58], "diagram_structure": [11, 90],
                                   "diagram_missing_box": [13, 97], "diagram_label_altered": [17]},
                   "pages": [{"page_no": 150, "v1": {"nc": 1.0, "wc": 1.0}, "v2_post": {"nc": 0.9, "wc": 1.0}},
                             {"page_no": 151, "v1": {"nc": 1.0, "wc": 1.0}, "v2_post": {"nc": 1.0, "wc": 0.9}}]}
        g = dict(rp.priority_groups(rescore))
        self.assertEqual([x for x, _ in rp.priority_groups(rescore)][0], "review_failure")
        self.assertEqual(g["diagram_in_table"], [58, 77])
        self.assertIn(150, g["numbers_below_v1"])
        self.assertEqual(g["words_below_v1"], [151])
        self.assertEqual(g["diagram_structure"], [11, 13, 90, 97])


class EmbedTrim(unittest.TestCase):
    def test_prefix_fits_budget(self):
        chunks = [{"page_start": i, "page_end": i, "content": f"c{i}"} for i in range(1, 6)]
        cache = {"vectors": {rp.text_key(rp.embedding_text(f"c{i}")): [0] for i in range(1, 6)}}
        sel = [(1, "a"), (2, "a"), (3, "b"), (4, "b")]
        kept, trimmed, est = rp.trim_for_embeddings(sel, chunks, cache, budget=2)
        self.assertEqual(kept, [(1, "a"), (2, "a")])
        self.assertEqual(trimmed, [(3, "b"), (4, "b")])
        self.assertEqual(est, 2)


class ChoosePage(unittest.TestCase):
    def test_v3_normally(self):
        p, m, src = rp.choose_page(pg(1.0, 1.0), pg(1.0, 1.0), pg(1.0, 0.995, method="gemini_vision_v2"))
        self.assertEqual((m, src), ("gemini_vision_v2", "v3"))

    def test_v2_post_when_v3_worse(self):
        p, m, src = rp.choose_page(pg(1.0, 1.0), pg(1.0, 1.0), pg(0.8, 1.0))
        self.assertEqual((m, src), ("carried_v2", "v2"))

    def test_fallback_v1_on_visual_page_needs_review(self):
        p, m, src = rp.choose_page(pg(1.0, 1.0, visual=True), pg(0.7, 1.0), pg(0.8, 1.0))
        self.assertEqual((m, src), ("fallback_v1", "v1"))
        self.assertTrue(p["needs_review"])
        self.assertIn("fallback_v1", p["review_reasons"])

    def test_carried_page(self):
        p, m, src = rp.choose_page(pg(1.0, 1.0), pg(0.5, 0.5), None)
        self.assertEqual((m, src), ("carried_v2", "v2"))


def v1row(n):
    return {"id": f"v1-{n}", "page_no": n, "is_text": True, "is_table": False, "is_visual": n == 2,
            "is_scanned": False, "text_layer": f"Revenue 10 page {n}", "markdown": f"# P{n}\nRevenue 10 page {n}",
            "docling_markdown": None, "image_path": f"pages/v1/{n}.png"}


def v2row(n):
    return {"id": f"v2-{n}", "page_no": n, "markdown": f"# P{n}\nRevenue 10 page {n} [Main Index](#)",
            "prompt_version": "r1-diagrams-v1"}


class AssembleAndWrite(unittest.TestCase):
    def setUp(self):
        self.v1 = {n: v1row(n) for n in (1, 2, 3)}
        self.v2 = {n: v2row(n) for n in (1, 2, 3)}
        v3 = {"markdown": "# P2\nRevenue page 2", "method": "gemini_vision_v2", "prompt_version": "r1-diagrams-v3",
              "number_coverage": 0.0, "word_coverage": 1.0, "needs_review": True,
              "review_reasons": ["number_coverage"], "diagrams": [], "diagram_count": 0, "diagram_issues": [],
              "diagram_label_coverage": None, "unreadable_count": 0}
        v3ok = dict(v3, markdown="# P3\nRevenue 10 page 3", number_coverage=1.0, needs_review=False, review_reasons=[])
        self.pages, self.reused, self.choices = rp.assemble(self.v1, self.v2, {}, {2: v3, 3: v3ok})

    def test_choices_and_reused_from(self):
        m = {c["page_no"]: c["method"] for c in self.choices}
        self.assertEqual(m, {1: "carried_v2", 2: "carried_v2", 3: "gemini_vision_v2"})
        self.assertEqual(self.reused, {1: "v2-1", 2: "v2-2"})
        self.assertNotIn("(#)", self.pages[0]["markdown"])  # invented link stripped on the carried page
        self.assertEqual(self.pages[0]["prompt_version"], "r1-diagrams-v1")

    def test_write_path_insert_only(self):
        sb = FakeClient()
        chunks = [{"page_start": i, "page_end": i, "section_title": f"S{i}", "content": f"c{i}",
                   "parent_item_id": None, "has_diagram": False} for i in (1, 2, 3)]
        w = pipeline.write_version({"school": "FMS", "club": "C", "year": "2023", "source_class": "club_casebook"},
                                   "x.pdf", "sha", 3, self.pages, chunks, 3, "r1-diagrams-v3", "n",
                                   reuse_file_id="v1doc", embeddings=[[0.0] * 768] * 3,
                                   reused_from=self.reused, sb=sb)
        ops = [c[0] for c in sb.calls]
        self.assertNotIn("delete", ops)
        self.assertNotIn("upsert", ops)
        updates = [c for c in sb.calls if c[0] == "update"]
        self.assertEqual(len(updates), 1)
        self.assertEqual(updates[0][3], ("id", w["file_id"]))
        rows = [r for c in sb.calls if c[0] == "insert" and c[1] == "ingest_chunks" for r in c[2]]
        self.assertTrue(rows and all(r["is_active"] is False and r["ingestion_version"] == 3 for r in rows))
        prow = {r["page_no"]: r for c in sb.calls if c[0] == "insert" and c[1] == "ingest_pages" for r in c[2]}
        self.assertEqual(prow[1]["reused_from_page_id"], "v2-1")
        self.assertEqual(prow[3]["prompt_version"], "r1-diagrams-v3")


if __name__ == "__main__":
    unittest.main()

"""write_version is insert-only (plus one status update on its own new doc).
Offline: the Supabase client is a fake that records every call.
    venv/bin/python -m unittest tests.test_pipeline_write -v
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pipeline  # noqa: E402


class FakeQuery:
    def __init__(self, client, table):
        self.client, self.table, self.op = client, table, None

    def insert(self, rows):
        self.client.calls.append(("insert", self.table, rows, None))
        return self

    def update(self, values):
        self.op = ("update", self.table, values)
        return self

    def delete(self):
        self.client.calls.append(("delete", self.table, None, None))
        return self

    def upsert(self, rows, **k):
        self.client.calls.append(("upsert", self.table, rows, None))
        return self

    def eq(self, col, val):
        if self.op:
            self.client.calls.append(self.op + ((col, val),))
            self.op = None
        return self

    def execute(self):
        if self.op:  # update with no filter
            self.client.calls.append(self.op + (None,))
            self.op = None
        return type("R", (), {"data": []})()


class FakeClient:
    def __init__(self):
        self.calls = []

    def table(self, name):
        return FakeQuery(self, name)


def make_pages(n):
    pages = []
    for i in range(1, n + 1):
        pages.append({
            "page_no": i, "is_text": True, "is_table": False, "is_visual": i % 2 == 0, "is_scanned": False,
            "text_layer": "t", "markdown": f"# Case {i}\nBody {i}", "docling_markdown": None,
            "method": "gemini_vision_v2", "number_coverage": 1.0, "word_coverage": 1.0,
            "unreadable_count": 0, "needs_review": False, "review_reasons": [],
            "diagrams": [], "diagram_count": 0, "diagram_issues": [], "diagram_label_coverage": None,
            # extra converter keys that have no column: must never reach a row
            "label_lines": {"x": ["a", "b"]}, "http_calls": 1, "retry_skipped": None,
            "truncated": False, "vision_model": "m", "attempts": 1, "diagram_errors": 0,
        })
    pages[2]["markdown"] = "[UNREADABLE] (vision call failed: network error)"
    return pages


class WriteVersion(unittest.TestCase):
    def setUp(self):
        self.sb = FakeClient()
        self.pages = make_pages(60)
        self.chunks = [{"page_start": i, "page_end": i, "section_title": f"S{i}", "content": f"c{i}",
                        "parent_item_id": None, "has_diagram": i % 3 == 0} for i in range(1, 46)]
        self.chunks[5]["parent_item_id"] = "SPLIT"
        self.w = pipeline.write_version(
            {"school": "FMS", "club": "C", "year": "2023", "source_class": "club_casebook"},
            "x.pdf", "sha", 60, self.pages, self.chunks, 2, "r1-diagrams-v1", "note",
            reuse_file_id="v1-doc", embeddings=[[0.0] * 768] * 45,
            reused_from={4: "v1-page-4"}, sb=self.sb)

    def test_only_inserts_and_one_own_update(self):
        ops = [c[0] for c in self.sb.calls]
        self.assertNotIn("delete", ops)
        self.assertNotIn("upsert", ops)
        updates = [c for c in self.sb.calls if c[0] == "update"]
        self.assertEqual(len(updates), 1)
        self.assertEqual(updates[0][1], "ingest_documents")
        self.assertEqual(updates[0][2], {"status": "done"})
        self.assertEqual(updates[0][3], ("id", self.w["file_id"]))
        self.assertEqual(self.sb.calls[-1][0], "update")  # status flips last

    def test_batches(self):
        ins = [c for c in self.sb.calls if c[0] == "insert"]
        tables = [c[1] for c in ins]
        self.assertEqual(tables.count("ingest_documents"), 1)
        self.assertEqual([len(c[2]) for c in ins if c[1] == "ingest_pages"], [50, 10])
        self.assertEqual([len(c[2]) for c in ins if c[1] == "ingest_chunks"], [20, 20, 5])
        doc = [c for c in ins if c[1] == "ingest_documents"][0][2]
        self.assertEqual((doc["ingestion_version"], doc["status"], doc["prompt_version"]), (2, "pending", "r1-diagrams-v1"))

    def test_chunk_rows_inactive_v2(self):
        rows = [r for c in self.sb.calls if c[0] == "insert" and c[1] == "ingest_chunks" for r in c[2]]
        self.assertEqual(len(rows), 45)
        for r in rows:
            self.assertIs(r["is_active"], False)
            self.assertEqual(r["ingestion_version"], 2)
            self.assertIn("has_diagram", r)
        self.assertIsNotNone(rows[5]["parent_item_id"])

    def test_page_rows_named_fields_only(self):
        rows = [r for c in self.sb.calls if c[0] == "insert" and c[1] == "ingest_pages" for r in c[2]]
        for bad in ("label_lines", "http_calls", "retry_skipped", "truncated", "vision_model",
                    "attempts", "diagram_errors"):
            self.assertNotIn(bad, rows[0])
        for col in ("diagrams", "diagram_count", "diagram_issues", "diagram_label_coverage",
                    "review_reasons", "prompt_version", "reused_from_page_id"):
            self.assertIn(col, rows[0])
        self.assertEqual(rows[0]["image_path"], "pages/v1-doc/1.png")
        self.assertEqual(rows[3]["reused_from_page_id"], "v1-page-4")
        self.assertIsNone(rows[0]["reused_from_page_id"])
        self.assertTrue(rows[2]["needs_review"])
        self.assertIn("vision_failed", rows[2]["review_reasons"])

    def test_failed_call_pages_not_chunked(self):
        nos = [p["page_no"] for p in pipeline.chunkable_pages(self.pages)]
        self.assertNotIn(3, nos)
        self.assertEqual(len(nos), 59)


if __name__ == "__main__":
    unittest.main()

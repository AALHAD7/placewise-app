"""Tests for chunk.py (R1.04: fence-aware chunking + embedding_text). Run from backend/ingestion:
    venv/bin/python -m unittest tests.test_chunk -v
"""
import json
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import chunk as ch  # noqa: E402
from chunk import chunk_document, embedding_text, protected_spans  # noqa: E402

ANSOFF = {
    "type": "matrix", "title": "Ansoff Matrix", "source_page": 20,
    "xAxis": "Products", "yAxis": "Markets",
    "cols": ["Existing", "New"], "rows": ["Existing", "New"],
    "cells": [["Market Penetration", "Product Development"],
              ["Market Development", "Diversification"]],
    "notes": [],
}
SUMMARY = "Diagram summary: The Ansoff matrix crosses existing/new products with existing/new markets."


def block(obj, summary=SUMMARY, indent=1):
    body = obj if isinstance(obj, str) else json.dumps(obj, ensure_ascii=False, indent=indent)
    return f"```placewise-diagram\n{body}\n```\n\n{summary}\n"


def filler(n_chars, word="growth"):
    """Prose lines of plain words (no boundary labels), about n_chars long."""
    line = ("The client wants " + word + " in a mature market and asks about options. ")
    out, total = [], 0
    while total < n_chars:
        out.append(line)
        total += len(line) + 1
    return "\n".join(out)


def big_block(target):
    """An Ansoff block padded via notes to about `target` chars of JSON."""
    obj = dict(ANSOFF)
    notes, size = [], len(block(obj))
    k = 0
    while size < target:
        notes.append(f"Note {k}: strategy option footnote as printed on the page.")
        k += 1
        obj = dict(ANSOFF, notes=notes)
        size = len(block(obj))
    return block(obj)


def fence_count(text):
    return sum(1 for line in text.split("\n") if line.strip().startswith("```"))


class FenceAwareSplit(unittest.TestCase):
    def setUp(self):
        blk = big_block(2500)
        self.blk = blk.strip("\n")
        before = filler(4800)
        after = filler(9000 - len(before) - len(blk), word="profit")
        md = "# Market entry\n" + before + "\n" + blk + after
        self.md = md
        start = md.index("```placewise-diagram")
        self.assertLess(start, ch.MAX_CHUNK_CHARS)
        self.assertGreater(start + len(blk), ch.MAX_CHUNK_CHARS)  # straddles the 6,000 mark
        self.assertGreater(len(md), 8500)
        self.chunks = chunk_document([{"page_no": 20, "markdown": md}])

    def test_split_happened(self):
        self.assertGreater(len(self.chunks), 1)
        self.assertTrue(all(c["parent_item_id"] == "SPLIT" for c in self.chunks))

    def test_no_unbalanced_fence(self):
        for c in self.chunks:
            self.assertEqual(fence_count(c["content"]) % 2, 0, c["section_title"])

    def test_block_and_summary_intact_in_exactly_one_part(self):
        holders = [c for c in self.chunks if self.blk in c["content"]]
        self.assertEqual(len(holders), 1)
        self.assertEqual(sum(1 for c in self.chunks if "```placewise-diagram" in c["content"]), 1)
        self.assertTrue(holders[0]["has_diagram"])
        self.assertEqual([c["has_diagram"] for c in self.chunks].count(True), 1)

    def test_no_text_lost(self):
        joined = "\n".join(c["content"] for c in self.chunks)
        for line in self.md.split("\n"):
            if line.strip():
                self.assertIn(line, joined)

    def test_parts_within_limit_and_overlap_kept(self):
        for c in self.chunks:
            self.assertLessEqual(len(c["content"]), ch.MAX_CHUNK_CHARS)
        # The second part repeats some text of the first (overlap), unless the
        # cut landed right before the block.
        a, b = self.chunks[0]["content"], self.chunks[1]["content"]
        self.assertTrue(b.split("\n")[0] in a or b.startswith("```placewise-diagram"))

    def test_oversized_block_kept_whole(self):
        blk = big_block(7000).strip("\n")
        md = "# Big\n" + filler(3000) + "\n" + blk + "\n" + filler(3000)
        chunks = chunk_document([{"page_no": 5, "markdown": md}])
        holders = [c for c in chunks if blk in c["content"]]
        self.assertEqual(len(holders), 1)
        for c in chunks:
            self.assertEqual(fence_count(c["content"]) % 2, 0)
            self.assertFalse(c["content"].lstrip().startswith("{"))


class BoundaryInsideFence(unittest.TestCase):
    def test_json_value_with_case_3_does_not_split(self):
        obj = {"type": "flow", "title": "Case 3: Market entry", "source_page": 52,
               "nodes": [{"id": "a", "label": "Case 3"}, {"id": "b", "label": "Question: entry mode"}],
               "edges": [{"from": "a", "to": "b", "label": None}], "notes": []}
        md = "# Framework\nIntro text.\n" + block(obj, "Diagram summary: A two-step flow.")
        chunks = chunk_document([{"page_no": 52, "markdown": md}])
        self.assertEqual(len(chunks), 1)
        self.assertTrue(chunks[0]["has_diagram"])

    def test_line_starting_case_3_inside_fence_does_not_split(self):
        # A malformed block whose line literally starts with "Case 3" / "# ":
        # BOUNDARY_RE would match it if fences were not respected.
        raw = '{"type": "other", "description":\nCase 3 lies here\n# Not a heading\n"labels": []}'
        md = "# Framework\nIntro text.\n" + block(raw, "Diagram summary: Broken block.") + "After text."
        chunks = chunk_document([{"page_no": 7, "markdown": md}])
        self.assertEqual(len(chunks), 1)
        self.assertIn("After text.", chunks[0]["content"])
        self.assertIn("Diagram summary: Broken block.", chunks[0]["content"])

    def test_unclosed_fence_stops_at_page_break(self):
        pages = [
            {"page_no": 1, "markdown": "# One\n```placewise-diagram\n{\"type\": \"funnel\""},
            {"page_no": 2, "markdown": "# Two\nSecond page text."},
        ]
        chunks = chunk_document(pages)
        self.assertEqual([c["section_title"] for c in chunks], ["One", "Two"])
        self.assertEqual(chunks[1]["page_start"], 2)

    def test_summary_kept_with_block_spans(self):
        md = "Intro\n" + block(ANSOFF) + "Tail"
        spans = protected_spans(md)
        self.assertEqual(len(spans), 1)
        s, e = spans[0]
        self.assertTrue(md[s:e].startswith("```placewise-diagram"))
        self.assertTrue(md[s:e].endswith(SUMMARY))


class EmbeddingText(unittest.TestCase):
    def test_plain_language_no_json(self):
        content = "# Growth options\nUse Ansoff.\n" + block(ANSOFF) + "More text."
        out = embedding_text(content)
        self.assertIn("Market Penetration", out)
        self.assertIn("Diagram (matrix): Ansoff Matrix.", out)
        self.assertIn(SUMMARY, out)
        self.assertIn("Use Ansoff.", out)
        for bad in ("{", '"type"', "```"):
            self.assertNotIn(bad, out)

    def test_untitled_and_label_cap(self):
        obj = {"type": "funnel", "title": None, "source_page": 3, "notes": [],
               "stages": [f"Stage number {i} of the long funnel" for i in range(40)]}
        out = embedding_text(block(obj, "Diagram summary: A long funnel."))
        self.assertIn("Diagram (funnel): untitled.", out)
        labels = out.split("Labels: ", 1)[1].split(". Diagram summary")[0]
        self.assertLessEqual(len(labels), ch.EMBED_LABELS_CAP + 1)

    def test_invalid_json_keeps_summary_only(self):
        content = "Before.\n" + block('{"type": "matrix", oops', "Diagram summary: Broken grid.") + "After."
        out = embedding_text(content)
        self.assertEqual(out, "Before. Diagram summary: Broken grid. After.")

    def test_sentinels_and_whitespace(self):
        content = "A\x00PAGE:4\x00\n\n   B\n\tC"
        self.assertEqual(embedding_text(content), "A B C")

    def test_content_keeps_raw_block(self):
        md = "# Growth\n" + block(ANSOFF)
        chunks = chunk_document([{"page_no": 20, "markdown": md}])
        self.assertIn('"type": "matrix"', chunks[0]["content"])


class ExistingBehaviour(unittest.TestCase):
    def test_two_headings_two_chunks(self):
        md = "# First\nAlpha text.\n# Second\nBeta text."
        chunks = chunk_document([{"page_no": 1, "markdown": md}])
        self.assertEqual([c["section_title"] for c in chunks], ["First", "Second"])
        self.assertTrue(all(c["has_diagram"] is False for c in chunks))
        self.assertTrue(all(c["parent_item_id"] is None for c in chunks))

    def test_page_range_across_sentinel(self):
        pages = [
            {"page_no": 10, "markdown": "# Case 1 setup\nThe client sells tea."},
            {"page_no": 11, "markdown": "Solution continues on the next page."},
            {"page_no": 12, "markdown": "# Next topic\nOther content."},
        ]
        chunks = chunk_document(pages)
        self.assertEqual(len(chunks), 2)
        self.assertEqual((chunks[0]["page_start"], chunks[0]["page_end"]), (10, 11))
        self.assertIn("Solution continues", chunks[0]["content"])
        self.assertEqual((chunks[1]["page_start"], chunks[1]["page_end"]), (12, 12))
        for c in chunks:
            self.assertNotIn("\x00", c["content"])


class ReviewFixes(unittest.TestCase):
    """Code-review fixes M2 (unclosed fence) and M3 (per-part page ranges)."""

    def test_unclosed_fence_closed_per_page(self):
        pages = [
            {"page_no": 5, "markdown": "# Framework\nIntro.\n```placewise-diagram\n{\"type\": \"matrix\", \"title\""},
            {"page_no": 6, "markdown": "# Next topic\nText after the broken block."},
        ]
        full = ch.assemble_with_sentinels(pages)
        self.assertEqual(fence_count(full) % 2, 0)
        chunks = chunk_document(pages)
        nxt = [c for c in chunks if "Text after the broken block" in c["content"]]
        self.assertEqual(len(nxt), 1)
        self.assertEqual(nxt[0]["section_title"], "Next topic")
        self.assertEqual((nxt[0]["page_start"], nxt[0]["page_end"]), (6, 6))
        self.assertIn("Text after the broken block", embedding_text(nxt[0]["content"]))
        for c in chunks:
            self.assertEqual(fence_count(c["content"]) % 2, 0, c["content"][:80])

    def test_closed_fences_untouched(self):
        md = "Intro\n" + block(ANSOFF)
        self.assertEqual(ch.close_open_fence(md), md)

    def test_split_parts_get_own_page_range(self):
        pages = [{"page_no": 30, "markdown": "# Long case\n" + filler(4000)},
                 {"page_no": 31, "markdown": filler(4000, word="profit")},
                 {"page_no": 32, "markdown": filler(4000, word="margin")}]
        chunks = chunk_document(pages)
        self.assertGreater(len(chunks), 1)
        self.assertTrue(all(c["parent_item_id"] == "SPLIT" for c in chunks))
        self.assertEqual(chunks[0]["page_start"], 30)
        self.assertLess(chunks[0]["page_end"], 32)
        self.assertEqual(chunks[-1]["page_end"], 32)
        self.assertGreater(chunks[-1]["page_start"], 30)
        for c in chunks:
            self.assertNotIn("\x00", c["content"])
            self.assertLessEqual(c["page_start"], c["page_end"])
        # a part that only contains page-32 words reports page 32
        only_margin = [c for c in chunks if "margin" in c["content"] and "growth" not in c["content"]
                       and "profit" not in c["content"]]
        self.assertTrue(only_margin)
        self.assertEqual((only_margin[-1]["page_start"], only_margin[-1]["page_end"]), (32, 32))


if __name__ == "__main__":
    unittest.main()

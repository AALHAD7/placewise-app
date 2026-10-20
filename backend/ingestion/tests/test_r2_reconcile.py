"""Review hardening of r2_reconcile.py: before-value merge, v3 guard, missing-row guard."""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import r2_reconcile as rc  # noqa: E402


class _Q:
    def __init__(self, data):
        self.data = data

    def __getattr__(self, _name):
        return lambda *a, **k: self

    def execute(self):
        return self


class _SB:
    def __init__(self, data):
        self.d = data

    def table(self, _name):
        return _Q(self.d)


class TestMergeBefore(unittest.TestCase):
    def test_saved_rows_never_overwritten(self):
        existing = [{"id": "a", "page_no": 1, "needs_review": False, "review_reasons": []}]
        new = [{"id": "a", "page_no": 1, "needs_review": True, "review_reasons": ["x"]},
               {"id": "b", "page_no": 2, "needs_review": False, "review_reasons": []}]
        out = rc.merge_before_rows(existing, new)
        self.assertEqual([r["id"] for r in out], ["a", "b"])
        self.assertFalse(out[0]["needs_review"])  # the saved pre-flag value wins
        self.assertEqual(out[0]["review_reasons"], [])

    def test_empty_existing(self):
        self.assertEqual(rc.merge_before_rows([], [{"id": "z"}]), [{"id": "z"}])


class TestGuards(unittest.TestCase):
    def test_v3_doc_assert(self):
        rc.assert_v3_doc(_SB([{"id": rc.DOC_ID_V3, "ingestion_version": 3}]))
        with self.assertRaises(SystemExit):
            rc.assert_v3_doc(_SB([{"id": rc.DOC_ID_V3, "ingestion_version": 4}]))
        with self.assertRaises(SystemExit):
            rc.assert_v3_doc(_SB([]))

    def test_plan_flags_skips_missing_rows(self):
        rows = {5: {"needs_review": False}, 6: {"needs_review": True}}
        self.assertEqual(rc.plan_flags({5, 6, 7}, rows), [5])


if __name__ == "__main__":
    unittest.main()

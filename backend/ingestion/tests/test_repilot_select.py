"""select_pages: which v1 pages get re-converted. Offline.
    venv/bin/python -m unittest tests.test_repilot_select -v
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from run_repilot import select_pages  # noqa: E402


def page(n, md, visual=False):
    return {"page_no": n, "is_visual": visual, "markdown": md}


class SelectPages(unittest.TestCase):
    def test_rules(self):
        pages = [
            page(1, "Plain heading\n\nSome text.", visual=True),
            page(2, "Intro\n- Revenue\n  - Price\n  - Volume\n"),
            page(3, "We apply the Ansoff lens to growth options."),
            page(4, "The client is a mid-sized retailer in Pune. Sales fell last year."),
        ]
        selected, reused = select_pages(pages)
        self.assertEqual([p["page_no"] for p in selected], [1, 2, 3])
        self.assertEqual([p["page_no"] for p in reused], [4])

    def test_one_indented_bullet_is_not_enough(self):
        selected, reused = select_pages([page(5, "Intro\n- a\n  - only one nested\n")])
        self.assertEqual((len(selected), len(reused)), (0, 1))

    def test_arrow_and_case_insensitive(self):
        sel, _ = select_pages([page(6, "cost -> profit"), page(7, "a bcg view")])
        self.assertEqual([p["page_no"] for p in sel], [6, 7])

    def test_none_markdown(self):
        sel, reused = select_pages([page(8, None)])
        self.assertEqual((len(sel), len(reused)), (0, 1))


if __name__ == "__main__":
    unittest.main()

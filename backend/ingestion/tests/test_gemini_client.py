"""Tests for gemini_client.transcribe_page budget rules and for the per-page
HTTP cap in convert.convert_page_vision. The HTTP transport (requests.post)
is mocked: no network, no Gemini calls. Run from backend/ingestion:
    venv/bin/python -m unittest tests.test_gemini_client -v
"""
import json
import os
import sys
import unittest

import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("GEMINI_API_KEY", "test-key-not-used")

import convert  # noqa: E402
import gemini_client as gc  # noqa: E402
from config import VISION_MODELS  # noqa: E402


class Resp:
    def __init__(self, status, body):
        self.status_code = status
        self.ok = 200 <= status < 300
        self._body = body
        self.text = body if isinstance(body, str) else json.dumps(body)

    def json(self):
        return self._body if not isinstance(self._body, str) else json.loads(self._body)


def ok(text, finish="STOP"):
    return Resp(200, {"candidates": [{"content": {"parts": [{"text": text}]}, "finishReason": finish}]})


class Transport:
    """Replaces requests.post. `script` items are Resp objects or exceptions."""
    def __init__(self, script):
        self.script = list(script)
        self.urls = []

    def __call__(self, url, headers=None, json=None, timeout=None):
        self.urls.append(url)
        item = self.script.pop(0)
        if isinstance(item, Exception):
            raise item
        return item


class Base(unittest.TestCase):
    def setUp(self):
        self._post = gc.requests.post
        self._count = dict(gc.call_count)
        self._cap = gc.vision_budget["cap"]
        gc.call_count["vision"] = 0
        gc.set_vision_cap(None)
        self.sleeps = []

    def tearDown(self):
        gc.requests.post = self._post
        gc.call_count.update(self._count)
        gc.set_vision_cap(self._cap)

    def use(self, script):
        t = Transport(script)
        gc.requests.post = t
        return t

    def call(self, **kw):
        log = []
        kw.setdefault("call_log", log)
        out = gc.transcribe_page(b"png", "prompt", return_meta=True, sleep=self.sleeps.append, **kw)
        return out, log


class TranscribePageBudget(Base):
    def test_success_one_request(self):
        self.use([ok("hello")])
        (text, meta), log = self.call(log_ctx={"page": 3})
        self.assertEqual(text, "hello")
        self.assertEqual(meta["http_calls"], 1)
        self.assertEqual(gc.call_count["vision"], 1)
        self.assertEqual(len(log), 1)
        self.assertEqual(log[0]["page"], 3)
        self.assertEqual(log[0]["status"], 200)

    def test_network_error_raises_without_retry_or_cascade(self):
        for exc in (requests.ConnectionError("down"), requests.Timeout("slow")):
            gc.call_count["vision"] = 0
            t = self.use([exc, ok("never")])
            log = []
            with self.assertRaises(gc.VisionCallError):
                gc.transcribe_page(b"png", "p", call_log=log)
            self.assertEqual(len(t.urls), 1)
            self.assertEqual(gc.call_count["vision"], 1)
            self.assertEqual(len(log), 1)
            self.assertEqual(log[0]["status"], "network_error")

    def test_non_transient_4xx_does_not_cascade(self):
        t = self.use([Resp(400, '{"error": "bad request"}'), ok("never")])
        with self.assertRaises(gc.VisionCallError):
            self.call()
        self.assertEqual(len(t.urls), 1)
        self.assertEqual(gc.call_count["vision"], 1)

    def test_5xx_cascades_to_next_model_once(self):
        t = self.use([Resp(503, "unavailable"), ok("from model 2")])
        (text, meta), log = self.call()
        self.assertEqual(text, "from model 2")
        self.assertEqual(meta["model"], VISION_MODELS[1])
        self.assertEqual(len(t.urls), 2)
        self.assertIn(VISION_MODELS[0], t.urls[0])
        self.assertEqual(gc.call_count["vision"], 2)
        self.assertEqual([e["status"] for e in log], [503, 200])

    def test_429_short_delay_retries_same_model_once(self):
        body = '{"error": {"details": [{"retryDelay": "2s"}]}}'
        t = self.use([Resp(429, body), ok("after wait")])
        (text, meta), _ = self.call()
        self.assertEqual(text, "after wait")
        self.assertEqual(meta["model"], VISION_MODELS[0])
        self.assertEqual(len(self.sleeps), 1)
        self.assertEqual(len(t.urls), 2)

    def test_429_long_delay_moves_on_without_sleeping(self):
        body = '{"error": {"details": [{"retryDelay": "3600s"}]}}'
        self.use([Resp(429, body), ok("model 2")])
        (text, meta), _ = self.call()
        self.assertEqual(meta["model"], VISION_MODELS[1])
        self.assertEqual(self.sleeps, [])

    def test_max_http_caps_the_cascade(self):
        t = self.use([Resp(503, "x"), Resp(503, "x"), ok("never")])
        with self.assertRaises(gc.PageBudgetExceeded):
            self.call(max_http=2)
        self.assertEqual(len(t.urls), 2)
        self.assertEqual(gc.call_count["vision"], 2)

    def test_run_cap_checked_before_each_request(self):
        gc.set_vision_cap(1)
        t = self.use([Resp(503, "x"), ok("never")])
        with self.assertRaises(gc.BudgetExceeded):
            self.call()
        self.assertEqual(len(t.urls), 1)
        self.assertEqual(gc.call_count["vision"], 1)
        with self.assertRaises(gc.BudgetExceeded):
            self.call()
        self.assertEqual(len(t.urls), 1)  # nothing sent once the cap is reached


GOOD_TL = "Ansoff Matrix Product Existing New Market Penetration Development Diversification"
GOOD_OBJ = {"type": "matrix", "title": "Ansoff Matrix", "source_page": 20, "notes": [],
            "xAxis": "Market", "yAxis": "Product", "cols": ["Existing", "New"], "rows": ["Existing", "New"],
            "cells": [["Market Penetration", "Market Development"], ["Product Development", "Diversification"]]}


def page(obj):
    return ("# Ansoff Matrix\n```placewise-diagram\n" + json.dumps(obj) + "\n```\n"
            "Diagram summary: Growth options.\n")


BAD_PAGE = page(dict(GOOD_OBJ, title="Ansoff Matrix Invented"))


class ConvertPageBudget(Base):
    def run_page(self):
        log = []
        res = convert.convert_page_vision(b"png", 20, GOOD_TL, False, log, "test")
        return res, log

    def test_call_log_matches_call_count(self):
        self.use([ok(BAD_PAGE), ok(page(GOOD_OBJ))])
        res, log = self.run_page()
        self.assertEqual(res["attempts"], 2)
        self.assertEqual(res["http_calls"], 2)
        self.assertEqual(len(log), gc.call_count["vision"])
        self.assertEqual([e["attempt"] for e in log], [1, 2])

    def test_cascade_hop_uses_the_page_budget(self):
        # attempt 1 needs 2 requests (503 then 200) and still has an error:
        # no budget is left, so no retry, and the page stays flagged.
        t = self.use([Resp(503, "x"), ok(BAD_PAGE), ok("never")])
        res, log = self.run_page()
        self.assertEqual(len(t.urls), 2)
        self.assertEqual(res["http_calls"], 2)
        self.assertEqual(res["attempts"], 1)
        self.assertEqual(res["retry_skipped"], "page_budget")
        self.assertTrue(res["needs_review"])
        self.assertEqual(len(log), gc.call_count["vision"])

    def test_failed_call_is_flagged_not_retried(self):
        t = self.use([requests.Timeout("slow"), ok("never")])
        res, log = self.run_page()
        self.assertEqual(len(t.urls), 1)
        self.assertTrue(res["needs_review"])
        self.assertIn("unreadable", res["review_reasons"])
        self.assertIn("error", log[-1])

    def test_run_cap_before_first_attempt_stops_the_run(self):
        gc.set_vision_cap(0)
        self.use([ok("never")])
        with self.assertRaises(gc.BudgetExceeded):
            self.run_page()

    def test_run_cap_on_retry_keeps_attempt_one(self):
        gc.set_vision_cap(1)
        self.use([ok(BAD_PAGE), ok("never")])
        res, log = self.run_page()
        self.assertEqual(res["retry_skipped"], "run_cap")
        self.assertEqual(res["http_calls"], len(log))
        # R2.09: attempt one is kept after the post-pass, which nulls its unprinted title
        from postprocess import postprocess_markdown
        self.assertEqual(res["markdown"], postprocess_markdown(BAD_PAGE, GOOD_TL)[0])
        self.assertIn('"title": null', res["markdown"])
        self.assertEqual(gc.call_count["vision"], 1)


class LazyConfig(unittest.TestCase):
    def test_modules_import_without_env(self):
        import subprocess
        code = (
            "import os, dotenv\n"
            "dotenv.load_dotenv = lambda *a, **k: False\n"
            "for k in ('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY'): os.environ.pop(k, None)\n"
            "import config, textnorm, diagram_schema, fidelity, chunk, gemini_client\n"
            "try:\n    config.GEMINI_API_KEY\nexcept RuntimeError as e:\n    print('lazy-ok', 'not set' in str(e))\n"
        )
        here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        out = subprocess.run([sys.executable, "-c", code], cwd=here, capture_output=True, text=True, timeout=120)
        self.assertEqual(out.returncode, 0, out.stderr[-800:])
        self.assertIn("lazy-ok True", out.stdout)


if __name__ == "__main__":
    unittest.main()

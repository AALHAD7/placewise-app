"""Tests for nvidia_client.transcribe_page: OpenAI-shaped response parsing,
transient-error retry, and the per-page HTTP budget. Mocked transport, no
network. Run from backend/ingestion:
    venv/bin/python -m unittest tests.test_nvidia_client -v
"""
import json
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("GEMINI_API_KEY", "test-key-not-used")
os.environ.setdefault("NVIDIA_NEMOTRON3_ULTRA_BASE_URL", "https://example.invalid/v1")
os.environ.setdefault("NVIDIA_NEMOTRON3_ULTRA_API_KEY", "test-key-not-used")

import nvidia_client as nc  # noqa: E402


class Resp:
    def __init__(self, status, body):
        self.status_code = status
        self.ok = 200 <= status < 300
        self._body = body
        self.text = body if isinstance(body, str) else json.dumps(body)

    def json(self):
        return self._body if not isinstance(self._body, str) else json.loads(self._body)


def ok(text, finish="stop"):
    return Resp(200, {"choices": [{"message": {"content": text}, "finish_reason": finish}]})


class Transport:
    def __init__(self, script):
        self.script = list(script)

    def __call__(self, url, headers=None, json=None, timeout=None):
        item = self.script.pop(0)
        if isinstance(item, Exception):
            raise item
        return item


class Base(unittest.TestCase):
    def setUp(self):
        self._post = nc.requests.post
        nc.call_count["vision"] = 0
        self.sleeps = []

    def tearDown(self):
        nc.requests.post = self._post


class TestSuccess(Base):
    def test_parses_openai_shaped_response(self):
        nc.requests.post = Transport([ok("# Page\nsome markdown")])
        text, meta = nc.transcribe_page(b"png", "prompt", return_meta=True, sleep=self.sleeps.append)
        self.assertEqual(text, "# Page\nsome markdown")
        self.assertEqual(meta["model"], nc.NVIDIA_VISION_MODEL)
        self.assertEqual(meta["http_calls"], 1)
        self.assertEqual(meta["finish_reason"], "stop")  # non-"length" reasons pass through unchanged

    def test_length_finish_reason_maps_to_max_tokens(self):
        nc.requests.post = Transport([ok("truncated...", finish="length")])
        _, meta = nc.transcribe_page(b"png", "prompt", return_meta=True, sleep=self.sleeps.append)
        self.assertEqual(meta["finish_reason"], "MAX_TOKENS")

    def test_empty_content_is_not_an_error(self):
        """Observed live: the reasoning model sometimes returns an empty
        `content` string (its answer stayed in `reasoning_content`, dropped
        here) rather than failing outright. transcribe_page must not crash -
        callers score it via fidelity.check_page same as any other output,
        which correctly flags it for review (0 coverage) rather than this
        client silently treating it as success."""
        nc.requests.post = Transport([ok("")])
        text, meta = nc.transcribe_page(b"png", "prompt", return_meta=True, sleep=self.sleeps.append)
        self.assertEqual(text, "")
        self.assertEqual(meta["http_calls"], 1)


class TestRetry(Base):
    def test_transient_status_retried_then_succeeds(self):
        nc.requests.post = Transport([Resp(503, "unavailable"), ok("recovered")])
        text, meta = nc.transcribe_page(b"png", "prompt", return_meta=True, sleep=self.sleeps.append)
        self.assertEqual(text, "recovered")
        self.assertEqual(meta["http_calls"], 2)
        self.assertEqual(len(self.sleeps), 1)

    def test_non_transient_status_raises_without_retry(self):
        nc.requests.post = Transport([Resp(401, "unauthorized")])
        with self.assertRaises(nc.NvidiaVisionCallError):
            nc.transcribe_page(b"png", "prompt", sleep=self.sleeps.append)
        self.assertEqual(len(self.sleeps), 0)

    def test_exhausts_attempts_then_raises(self):
        nc.requests.post = Transport([Resp(500, "e1"), Resp(500, "e2")])
        with self.assertRaises(nc.NvidiaVisionCallError):
            nc.transcribe_page(b"png", "prompt", attempts=2, sleep=self.sleeps.append)

    def test_network_error_retried(self):
        import requests as real_requests
        nc.requests.post = Transport([real_requests.RequestException("boom"), ok("ok after network error")])
        text = nc.transcribe_page(b"png", "prompt", sleep=self.sleeps.append)
        self.assertEqual(text, "ok after network error")


class TestBudget(Base):
    def test_per_page_budget_raises_before_second_call(self):
        nc.requests.post = Transport([Resp(503, "e1"), ok("unused")])
        with self.assertRaises(nc.NvidiaVisionCallError):
            nc.transcribe_page(b"png", "prompt", max_http=1, attempts=2, sleep=self.sleeps.append)

    def test_call_log_records_every_attempt(self):
        nc.requests.post = Transport([Resp(503, "e1"), ok("ok")])
        log = []
        nc.transcribe_page(b"png", "prompt", call_log=log, log_ctx={"page": 5}, sleep=self.sleeps.append)
        self.assertEqual(len(log), 2)
        self.assertEqual(log[0]["page"], 5)
        self.assertEqual(log[0]["status"], 503)
        self.assertEqual(log[1]["status"], 200)


if __name__ == "__main__":
    unittest.main()

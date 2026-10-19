"""check_schema must never report MISSING columns when Supabase is down.
Offline: the Supabase client is a fake. Run from backend/ingestion:
    venv/bin/python -m unittest tests.test_check_schema -v
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("SUPABASE_URL", "https://example.invalid")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-key-not-used")

from postgrest.exceptions import APIError  # noqa: E402

import check_schema as cs  # noqa: E402


class FakeQuery:
    def __init__(self, err):
        self.err = err

    def select(self, *a, **k):
        return self

    def limit(self, *a):
        return self

    def eq(self, *a):
        return self

    def execute(self):
        raise self.err


class FakeClient:
    def __init__(self, err):
        self.err = err

    def table(self, name):
        return FakeQuery(self.err)


def gateway_521():
    # what postgrest-py raises for a non-JSON response (generate_default_error_message)
    return APIError({"message": "JSON could not be generated", "code": 521,
                     "hint": "Refer to full message for details", "details": "b'<html>521</html>'"})


class CheckSchemaErrors(unittest.TestCase):
    def setUp(self):
        self._sb = cs.sb

    def tearDown(self):
        cs.sb = self._sb

    def test_classify(self):
        self.assertEqual(cs.classify_api_error(APIError({"code": "42703", "message": "column x does not exist"})), "missing")
        self.assertEqual(cs.classify_api_error(APIError({"code": "PGRST204", "message": "no column"})), "missing")
        self.assertEqual(cs.classify_api_error(gateway_521()), "unreachable")
        self.assertEqual(cs.classify_api_error(APIError({"code": 503, "message": "down"})), "unreachable")
        self.assertEqual(cs.classify_api_error(APIError({"code": "PGRST301", "message": "jwt"})), "unreachable")

    def test_521_raises_unreachable_not_missing(self):
        cs.sb = FakeClient(gateway_521())
        with self.assertRaises(cs.Unreachable):
            cs.column_exists("ingest_pages", "diagrams")

    def test_real_missing_column(self):
        cs.sb = FakeClient(APIError({"code": "42703", "message": "column ingest_pages.diagrams does not exist"}))
        exists, err = cs.column_exists("ingest_pages", "diagrams")
        self.assertFalse(exists)
        self.assertIn("42703", err)

    def test_script_exits_2_on_gateway_error(self):
        import subprocess
        code = (
            "import sys, runpy, supabase\n"
            "from postgrest.exceptions import APIError\n"
            "class Q:\n"
            "    def __getattr__(self, n): return lambda *a, **k: self\n"
            "    def execute(self): raise APIError({'message': 'JSON could not be generated', 'code': 521})\n"
            "class C:\n"
            "    def table(self, n): return Q()\n"
            "supabase.create_client = lambda *a, **k: C()\n"
            "runpy.run_path('check_schema.py', run_name='__main__')\n"
        )
        here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        out = subprocess.run([sys.executable, "-c", code], cwd=here, capture_output=True, text=True, timeout=120)
        self.assertEqual(out.returncode, 2, out.stdout + out.stderr[-500:])
        self.assertIn("could not reach Supabase", out.stdout)
        self.assertNotIn("MISSING", out.stdout)


if __name__ == "__main__":
    unittest.main()

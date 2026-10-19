"""Read-only check that migration_040 is applied and the v1 pilot rows are intact.

Run from backend/ingestion:  venv/bin/python check_schema.py
Exit 0 only if every migration_040 column exists and the v1 integrity counts match.
Exit 1 if a column is MISSING (PostgREST 42703/PGRST204) or a count mismatches.
Exit 2 "could not reach Supabase" for anything else (network, 5xx, 521, non-JSON).
Makes no writes and no Gemini calls.
"""
import sys

from postgrest.exceptions import APIError
from supabase import create_client

from config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

V1_DOC_ID = "67371722-c752-473e-bf12-a3710707e56c"
EXPECTED_V1_PAGES = 248
EXPECTED_V1_CHUNKS = 363
EXPECTED_ACTIVE_CHUNKS = 0

COLUMNS = {
    "ingest_documents": ["prompt_version", "notes"],
    "ingest_pages": [
        "diagrams",
        "diagram_count",
        "diagram_issues",
        "diagram_label_coverage",
        "review_reasons",
        "prompt_version",
        "reused_from_page_id",
    ],
    "ingest_chunks": ["has_diagram"],
}

# PostgREST codes that really mean "this column does not exist".
MISSING_COLUMN_CODES = {"42703", "PGRST204"}

sb = None


class Unreachable(RuntimeError):
    """Supabase did not give a real answer (network, gateway, 5xx, auth)."""


def classify_api_error(e) -> str:
    """'missing' only for a genuine unknown-column error; anything else
    (5xx, Cloudflare 521, non-JSON gateway page, auth) is 'unreachable'."""
    code = str(getattr(e, "code", "") or "")
    if code in MISSING_COLUMN_CODES:
        return "missing"
    return "unreachable"


def column_exists(table, column):
    try:
        sb.table(table).select(column).limit(1).execute()
        return True, ""
    except APIError as e:
        if classify_api_error(e) == "missing":
            return False, f"{e.code}: {e.message}"[:120]
        raise Unreachable(f"{table}.{column}: HTTP/API error {e.code}: {str(e.message)[:120]}") from e


def count(table, **filters):
    q = sb.table(table).select("id", count="exact")
    for col, val in filters.items():
        q = q.eq(col, val)
    try:
        return q.limit(1).execute().count
    except APIError as e:
        raise Unreachable(f"count {table}: API error {e.code}: {str(e.message)[:120]}") from e


def main():
    global sb
    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    ok = True

    print("== migration_040 columns ==")
    for table, cols in COLUMNS.items():
        for col in cols:
            exists, err = column_exists(table, col)
            print(f"  {'OK     ' if exists else 'MISSING'} {table}.{col}" + (f"  ({err})" if err else ""))
            ok &= exists

    print("== v1 integrity ==")
    docs = count("ingest_documents")
    pages = count("ingest_pages", document_id=V1_DOC_ID)
    v1_chunks = count("ingest_chunks", ingestion_version=1)
    active = count("ingest_chunks", is_active=True)
    checks = [
        ("ingest_documents rows", docs, None),
        (f"ingest_pages for v1 doc {V1_DOC_ID}", pages, EXPECTED_V1_PAGES),
        ("ingest_chunks with ingestion_version=1", v1_chunks, EXPECTED_V1_CHUNKS),
        ("ingest_chunks with is_active=true", active, EXPECTED_ACTIVE_CHUNKS),
    ]
    for label, got, want in checks:
        if want is None:
            print(f"  INFO    {label}: {got}")
        else:
            match = got == want
            ok &= match
            print(f"  {'OK     ' if match else 'MISMATCH'} {label}: {got} (expect {want})")

    print("RESULT:", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:  # network, gateway (5xx/521), auth: cannot tell, so never report MISSING
        print(f"ERROR: could not reach Supabase ({type(e).__name__}: {str(e)[:200]})")
        sys.exit(2)

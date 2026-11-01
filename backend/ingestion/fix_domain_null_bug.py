"""Record of a pipeline-wide bug found 2026-11-02 during SRCC's first real
is_active=true activation: every one of R6's 9 ingest_documents rows has
domain=NULL. match_ingest_chunks' filter is `filter_domain is null or
d.domain = filter_domain` - once a route passes filter_domain="Consulting"
(every Frameworks/Guesstimates/Q&A/chip call does), a NULL domain column
never matches, silently returning zero rows regardless of is_active or
content quality. This would have broken every feature for every casebook the
moment any of them went live - never caught before because nothing had ever
been flipped is_active=true until SRCC, today.

This script is the applied fix, kept for the record - it has already been run
once (see log.md, 2026-11-02). Safe to rerun (idempotent: just sets a fixed
constant value, no content touched, no is_active touched).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import config
from supabase import create_client

DOC_IDS = [
    "3a5226fe-6538-4795-92fd-94b4ce3b828a",  # The FMS Consulting Casebook 2021-22
    "f34e4c10-9a04-41c0-8758-89c53bfb172c",  # ISB Consulting Casebook 2025
    "2deac100-5adf-45c5-8970-aed2ea1e9901",  # IIM B Consulting Casebook 2025
    "0dcb9172-15c9-4091-be23-f5cf32e29214",  # IIMK Kasebook 2025
    "bc00d24b-b95d-4222-8bed-28ea7d2a5e18",  # SRCC Guesstimates-Book-Volume-1-6 (v7)
    "b4020a62-090c-4f59-86b6-1673badee84a",  # IIM L Consulting Casebook 2025
    "6e03b993-4fd7-4f06-a13f-76bf87abe543",  # IIM Calcutta Consulting CaseBook 2025-26
    "9448d505-a9d4-43ce-a88c-7bf42ea20ebb",  # IIMA-Consult-Prep-Book-Case-Book-2025-26
    "63b73f99-3727-4f4b-9973-0e22eb89dfc9",  # The FMS Consulting CaseBook 2023-24
]


def main():
    sb = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)
    for doc_id in DOC_IDS:
        sb.table("ingest_documents").update({"domain": "Consulting"}).eq("id", doc_id).execute()
    rows = sb.table("ingest_documents").select("source_file,domain").in_("id", DOC_IDS).execute().data
    for r in rows:
        print(r["source_file"], "->", r["domain"])


if __name__ == "__main__":
    main()

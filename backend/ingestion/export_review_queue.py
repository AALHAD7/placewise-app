"""Stopgap for R5 (admin review queue, not yet built): exports every needs_review=true
page across all 9 Consulting ingest_documents into one CSV Aalhad can open and review by
hand. Read-only - does not change any row's needs_review/is_active status.
"""
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import config
from supabase import create_client

DOCS = {
    "e9229429-3eec-478b-b54a-7d5a1cdf6de0": "The FMS Consulting Casebook 2021-22",
    "0a6c4f9e-b1bd-4bf8-bbee-7475ba8a6c14": "ISB Consulting Casebook 2025",
    "17a7c482-5181-423c-b8d5-44f79e90e392": "IIM B Consulting Casebook 2025",
    "6ae47aaa-ad2e-4848-9775-75ac2072f79e": "IIMK Kasebook 2025",
    "ab676b81-3b29-4c35-b288-6dff71756e26": "SRCC Guesstimates-Book-Volume-1-6",
    "fa763d15-dac2-408f-9228-8a5f34785128": "IIM L Consulting Casebook 2025",
    "f2c1333f-b205-46fa-991e-551548dffef7": "IIM Calcutta Consulting CaseBook 2025-26",
    "09c41590-6f53-40be-a19c-60fa645610f4": "IIMA-Consult-Prep-Book-Case-Book-2025-26",
    "faa13328-c4bc-4ed7-8172-6ec5ba38c162": "The FMS Consulting CaseBook 2023-24",
}

OUT = Path(__file__).parent / "out" / "r6_review_queue.csv"


def main():
    sb = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)
    rows_out = []
    for doc_id, label in DOCS.items():
        pages = sb.table("ingest_pages").select(
            "page_no,review_reasons,number_coverage,word_coverage,diagram_count,markdown"
        ).eq("document_id", doc_id).eq("needs_review", True).order("page_no").execute().data
        for p in pages:
            md = (p["markdown"] or "")
            rows_out.append({
                "casebook": label,
                "page_no": p["page_no"],
                "review_reasons": ", ".join(p["review_reasons"] or []),
                "number_coverage": p["number_coverage"],
                "word_coverage": p["word_coverage"],
                "diagram_count": p["diagram_count"],
                "markdown_excerpt": md[:3000] + ("... [truncated]" if len(md) > 3000 else ""),
            })

    OUT.parent.mkdir(exist_ok=True)
    with open(OUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "casebook", "page_no", "review_reasons", "number_coverage",
            "word_coverage", "diagram_count", "markdown_excerpt"
        ])
        writer.writeheader()
        writer.writerows(rows_out)

    print(f"Wrote {len(rows_out)} flagged pages to {OUT}")
    by_book = {}
    for r in rows_out:
        by_book[r["casebook"]] = by_book.get(r["casebook"], 0) + 1
    for book, count in by_book.items():
        print(f"  {book}: {count}")


if __name__ == "__main__":
    main()

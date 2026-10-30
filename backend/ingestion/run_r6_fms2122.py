"""R6: ingest The FMS Consulting Casebook 2021-22 (200 pages), insert-only
ingestion_version=1, is_active=false (chunk.py sets it)."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from pipeline import ingest_one_pdf
from gemini_client import call_count

PDF = Path("../../Data/Consulting Files/PDF Files/The FMS Consulting Casebook 2021-22.pdf")
TXT_SOURCE_FILE = "The FMS Consulting Casebook 2021-22.pdf"


def main():
    call_log = []
    assert PDF.exists(), f"missing: {PDF}"
    result = ingest_one_pdf(PDF, TXT_SOURCE_FILE, call_log, version=1)
    print(f"file_id={result.get('file_id') or result.get('source_file')}")
    print(f"page_count={result.get('page_count')}")
    print(f"chunks={len(result.get('chunks', []))}")
    print(f"vision_calls={call_count['vision']} embedding_calls={call_count['embedding']}")
    out = {
        "source_file": result.get("source_file"),
        "page_count": result.get("page_count"),
        "num_chunks": len(result.get("chunks", [])),
        "vision_calls": call_count["vision"],
        "embedding_calls": call_count["embedding"],
        "pages_summary": [
            {"page_no": p["page_no"], "is_visual": p.get("is_visual"), "is_table": p.get("is_table"),
             "diagram_count": p.get("diagram_count"), "needs_review": p.get("needs_review"),
             "number_coverage": p.get("number_coverage"), "word_coverage": p.get("word_coverage")}
            for p in result.get("pages", [])
        ],
    }
    Path("out").mkdir(exist_ok=True)
    Path("out/r6_fms2122_v1.json").write_text(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()

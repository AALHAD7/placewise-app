"""Step 7: pilot runner. Converts the 2 C1 pilot files end to end, writes
to Supabase, and produces the report data (saved as JSON for assembly into
the chat report)."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from pipeline import ingest_one_pdf
from gemini_client import call_count
from config import PILOT_CALL_CAP

PILOT_FILES = [
    {
        "pdf": Path("../../Data/Consulting Files/PDF Files/The FMS Consulting CaseBook 2023-24 (1).pdf"),
        "txt_source_file": "The FMS Consulting CaseBook 2023-24 (1).txt"
    },
    {
        "pdf": Path("../../Data/Prodman Files/PDF  Files/IIMA - PM Casebook.pdf"),
        "txt_source_file": "IIMA - PM Casebook.txt"
    }
]


def main():
    call_log = []
    results = []
    for f in PILOT_FILES:
        total_calls_so_far = call_count["vision"] + call_count["embedding"]
        if total_calls_so_far >= PILOT_CALL_CAP:
            print(f"HARD STOP: {total_calls_so_far} calls used, at/past PILOT_CALL_CAP={PILOT_CALL_CAP}. Stopping before {f['pdf'].name}.")
            break
        print(f"=== {f['pdf'].name} ===")
        if not f["pdf"].exists():
            print(f"  PDF NOT FOUND: {f['pdf']}")
            continue
        result = ingest_one_pdf(f["pdf"], f["txt_source_file"], call_log)
        print(f"  {result['page_count']} pages, {len(result['chunks'])} chunks")
        print(f"  running totals: vision={call_count['vision']} embedding={call_count['embedding']}")
        results.append(result)

    out = {
        "results": [
            {
                "file_id": r["file_id"], "source_file": r["source_file"], "page_count": r["page_count"],
                "pages": [{k: v for k, v in p.items() if k != "text_layer"} | {"text_layer_len": len(p["text_layer"])} for p in r["pages"]],
                "pages_full": r["pages"],  # kept for diffing, not re-serialized to the summary print
                "chunk_count": len(r["chunks"]),
                "chunks_preview": [{"section_title": c["section_title"], "page_start": c["page_start"], "page_end": c["page_end"], "content_len": len(c["content"])} for c in r["chunks"]]
            }
            for r in results
        ],
        "call_log": call_log,
        "final_vision_calls": call_count["vision"],
        "final_embedding_calls": call_count["embedding"]
    }
    with open("pilot_output.json", "w") as fh:
        json.dump(out, fh, indent=2, default=str)
    print("\nwritten to pilot_output.json")
    print(f"TOTAL CALLS: vision={call_count['vision']} embedding={call_count['embedding']}")


if __name__ == "__main__":
    main()

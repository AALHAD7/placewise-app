"""R1.03 live smoke test: vision prompt v2 on a few known diagram pages.

Paid (Gemini flash-lite cascade), capped. No DB writes, no storage uploads.
Output: out/smoke_r1.json (gitignored - contains casebook text).

    venv/bin/python smoke_r1.py --pages 20,52,32 --cap 8
"""
import argparse
import json
from pathlib import Path

import pypdfium2 as pdfium

from config import INGESTION_DIR, PROMPT_VERSION, RENDER_DPI, VISION_MAX_CALLS_PER_PAGE, VISION_MODELS
from convert import convert_page_vision
from gemini_client import BudgetExceeded, call_count, set_vision_cap
from page_classify import render_page_png

DEFAULT_PDF = (INGESTION_DIR.parent.parent / "Data" / "Consulting Files" / "PDF Files"
               / "The FMS Consulting CaseBook 2023-24 (1).pdf")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", default=str(DEFAULT_PDF))
    ap.add_argument("--pages", default="20,52,32")
    ap.add_argument("--cap", type=int, default=8)
    ap.add_argument("--out", default=str(INGESTION_DIR / "out" / "smoke_r1.json"))
    args = ap.parse_args()

    pages = [int(x) for x in args.pages.split(",") if x.strip()]
    pdf = pdfium.PdfDocument(args.pdf)
    call_log, results, skipped = [], [], []
    set_vision_cap(args.cap)  # enforced before every HTTP request, not just here

    for page_no in pages:
        # A page may need 2 calls; don't start one that could break the cap.
        if args.cap - call_count["vision"] < VISION_MAX_CALLS_PER_PAGE:
            print(f"cap reached ({call_count['vision']}/{args.cap}); skipping page {page_no}")
            skipped.append(page_no)
            continue
        page = pdf[page_no - 1]
        text_layer = page.get_textpage().get_text_range()
        png = render_page_png(page, RENDER_DPI)
        before = call_count["vision"]
        try:
            r = convert_page_vision(png, page_no, text_layer, not text_layer.strip(), call_log, "smoke_r1")
        except BudgetExceeded as e:
            print(f"stopping: {e}")
            skipped.append(page_no)
            break
        r["page_no"] = page_no
        r["calls_used"] = call_count["vision"] - before
        results.append(r)

        print(f"\n===== page {page_no} =====")
        print(f"attempts={r['attempts']} calls={r['calls_used']} model={r.get('vision_model')} "
              f"truncated={r['truncated']}")
        print(f"diagram_count={r['diagram_count']} valid_types={[d['type'] for d in r['diagrams']]}")
        print(f"label_coverage={r['diagram_label_coverage']} number_cov={r['number_coverage']} "
              f"word_cov={r['word_coverage']}")
        print(f"needs_review={r['needs_review']} review_reasons={r['review_reasons']}")
        print(f"diagram_issues={json.dumps(r['diagram_issues'], ensure_ascii=False)}")
        print("----- markdown -----")
        print(r["markdown"])

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({
        "pdf": Path(args.pdf).name, "prompt_version": PROMPT_VERSION, "models": VISION_MODELS,
        "dpi": RENDER_DPI, "cap": args.cap, "vision_calls": call_count["vision"],
        "call_log": call_log, "skipped": skipped, "pages": results,
    }, ensure_ascii=False, indent=2))
    logged = sum(1 for c in call_log if c.get("type") == "vision")
    print(f"\nTOTAL vision calls (HTTP requests): {call_count['vision']} / cap {args.cap}; "
          f"call_log entries: {logged}" + ("" if logged == call_count["vision"] else "  MISMATCH"))
    print(f"saved {out}")


if __name__ == "__main__":
    main()

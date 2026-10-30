"""Side-by-side comparison: Gemini vision (current default) vs NVIDIA
nemotron-3.5-super-vl-120b-a12b (candidate), on real pages already flagged
needs_review from the ISB R6 run. Read-only against the source PDF; does not
touch document_chunks, ingest_* tables, or main. Reports a recommendation -
does NOT change config.VISION_PROVIDER.

Usage: python3 compare_vision_providers.py
"""
import json
import sys
import time
from pathlib import Path

import pypdfium2 as pdfium

sys.path.insert(0, str(Path(__file__).parent))

from config import RENDER_DPI, VISION_MAX_TOKENS
from convert import build_vision_prompt
from postprocess import postprocess_markdown
from fidelity import check_page
from page_classify import render_page_png
import gemini_client
import nvidia_client

PDF = Path("../../Data/Consulting Files/PDF Files/ISB Consulting Casebook 2025.pdf")

# Picked from out/r6_isb_v1.json: the lowest number_coverage table pages
# (the pie-chart-vs-bullets tradeoff the R6 report flagged) plus a couple of
# genuine multi-diagram pages for breadth, not just the worst cases.
PAGES = [162, 166, 169, 175, 177, 163, 34]


def run_one(provider_name, transcribe_fn, png, prompt, page_no, text_layer):
    call_log = []
    t0 = time.time()
    try:
        md, meta = transcribe_fn(png, prompt, max_tokens=VISION_MAX_TOKENS, return_meta=True, call_log=call_log)
    except Exception as e:  # noqa: BLE001 - comparison harness, record and move on
        return {"provider": provider_name, "error": str(e)[:300], "elapsed_s": round(time.time() - t0, 1)}
    elapsed = round(time.time() - t0, 1)
    md2, label_lines, _, _ = postprocess_markdown(md, text_layer)
    fid = check_page(text_layer, md2, is_scanned=False, page_no=page_no, label_lines=label_lines)
    return {
        "provider": provider_name,
        "model": meta.get("model"),
        "elapsed_s": elapsed,
        "number_coverage": fid.get("number_coverage"),
        "word_coverage": fid.get("word_coverage"),
        "diagram_errors": fid.get("diagram_errors"),
        "needs_review": fid.get("needs_review"),
        "review_reasons": fid.get("review_reasons"),
        "md_chars": len(md2),
    }


def main():
    assert PDF.exists(), f"missing: {PDF}"
    pdf = pdfium.PdfDocument(str(PDF))
    results = []
    for page_no in PAGES:
        page = pdf[page_no - 1]
        text_layer = page.get_textpage().get_text_range()
        png = render_page_png(page, RENDER_DPI)
        prompt = build_vision_prompt(page_no, text_layer)

        gem = run_one("gemini", gemini_client.transcribe_page, png, prompt, page_no, text_layer)
        nv = run_one("nvidia", nvidia_client.transcribe_page, png, prompt, page_no, text_layer)
        results.append({"page_no": page_no, "gemini": gem, "nvidia": nv})
        print(f"page {page_no}: gemini nc={gem.get('number_coverage')} wc={gem.get('word_coverage')} "
              f"err={gem.get('error')} | nvidia nc={nv.get('number_coverage')} wc={nv.get('word_coverage')} "
              f"err={nv.get('error')}")

    Path("out").mkdir(exist_ok=True)
    out_path = Path("out/compare_vision_providers.json")
    out_path.write_text(json.dumps({
        "pdf": str(PDF),
        "pages": PAGES,
        "gemini_vision_calls": gemini_client.call_count["vision"],
        "nvidia_vision_calls": nvidia_client.call_count["vision"],
        "results": results,
    }, indent=2))
    print(f"\nwrote {out_path}")
    print(f"gemini_vision_calls={gemini_client.call_count['vision']} "
          f"nvidia_vision_calls={nvidia_client.call_count['vision']}")


if __name__ == "__main__":
    main()

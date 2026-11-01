"""SRCC page 35: 3 attempts with Gemini flash-lite (original + 2 fix rounds) all
produced the identical gap (empty SECONDARY SECTOR / TERTIARY SECTOR branches in
the issue tree). Trying a genuinely different vision model (NVIDIA Nemotron,
already configured, not wired into the main pipeline by default - see
nvidia_client.py) rather than a 4th attempt with the same model that keeps making
the same mistake. Read-only probe: does NOT write any DB row - just prints the
result and its fidelity check so it can be inspected before deciding whether to
use it.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import config
from supabase import create_client
import pypdfium2 as pdfium

from convert import build_vision_prompt
from page_classify import render_page_png
from fidelity import check_page
import nvidia_client

V6_DOC_ID = "1ad48fb6-c630-4bde-9276-918bc1aebed1"
PDF = Path("../../Data/Consulting Files/PDF Files/SRCC Guesstimates-Book-Volume-1-6.pdf")
PAGE_NO = 35

HINT = ["The main issue tree has THREE sibling branches under '20-35 YEARS': "
        "PRIMARY SECTOR, SECONDARY SECTOR, and TERTIARY SECTOR, each with a full "
        "nested breakdown (worker type -> commute details -> number of workers / "
        "average commute time / work-from-office days per week -> hours "
        "calculation). Transcribe ALL THREE branches with their full nested "
        "breakdown - do not leave SECONDARY SECTOR or TERTIARY SECTOR as empty "
        "leaf nodes."]


def main():
    sb = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)
    v6p = sb.table("ingest_pages").select("text_layer,is_scanned").eq("document_id", V6_DOC_ID) \
        .eq("page_no", PAGE_NO).execute().data[0]

    pdf = pdfium.PdfDocument(str(PDF))
    page = pdf[PAGE_NO - 1]
    png = render_page_png(page, 300)
    prompt = build_vision_prompt(PAGE_NO, v6p["text_layer"], fix_hints=HINT)

    md, meta = nvidia_client.transcribe_page(png, prompt, max_tokens=8000, return_meta=True)
    print("=== NVIDIA result ===")
    print(md)
    print()
    print("meta:", meta)

    fid = check_page(v6p["text_layer"], md, v6p["is_scanned"], page_no=PAGE_NO)
    print()
    print("=== fidelity check ===")
    print("needs_review:", fid.get("needs_review"), "reasons:", fid.get("review_reasons"))
    print("has SECONDARY SECTOR with children:", "SECONDARY SECTOR" in md)
    import re
    m = re.search(r'"label":\s*"SECONDARY SECTOR[^"]*"\s*,\s*"children":\s*\[\s*\]', md)
    print("SECONDARY SECTOR still empty:", bool(m))


if __name__ == "__main__":
    main()

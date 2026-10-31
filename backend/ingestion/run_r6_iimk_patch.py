"""R6 patch: IIMK Kasebook 2025 v1 had 5 pages fail with transient network
errors during the vision call (ConnectionError/ReadTimeout on
gemini-3.5-flash-lite) - [UNREADABLE], correctly flagged needs_review rather
than silently wrong. All 5 were already classified is_visual=True (not a
classification bug, just a dropped request). Retries just these 5 pages
through convert_page_vision and builds v2 = v1's 229 pages reused except
these 5, insert-only, is_active=false. Mirrors run_r6_isb_patch.py's
reuse-unless-patched pattern.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import config
from supabase import create_client
import pypdfium2 as pdfium

from convert import convert_page_vision, sha256_file
from page_classify import render_page_png
from chunk import chunk_document, embedding_text
from gemini_client import embed_text, call_count, set_vision_cap
from pipeline import write_version, lookup_classification, version_status, chunkable_pages

V1_DOC_ID = "8f0bc31a-93ec-4262-a634-f6624e9a4ad0"
SOURCE_FILE = "IIMK Kasebook 2025.pdf"
TXT_SOURCE_FILE = "IIMK Kasebook 2025.pdf"
PDF = Path("../../Data/Consulting Files/PDF Files/IIMK Kasebook 2025.pdf")
PATCH_PAGES = [1, 27, 62, 63, 118]
PAGE_COLS = ("page_no, is_text, is_table, is_visual, is_scanned, text_layer, markdown, "
             "docling_markdown, method, number_coverage, word_coverage, unreadable_count, "
             "needs_review, review_reasons, diagrams, diagram_count, diagram_issues, "
             "diagram_label_coverage, prompt_version")


def main():
    sb = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)

    if version_status(SOURCE_FILE, 2, sb) == "done":
        print("v2 already done; skipping")
        return

    v1_pages = sb.table("ingest_pages").select(PAGE_COLS).eq("document_id", V1_DOC_ID) \
        .order("page_no").execute().data
    assert len(v1_pages) == 229, f"expected 229 v1 pages, got {len(v1_pages)}"
    by_no = {p["page_no"]: p for p in v1_pages}

    set_vision_cap(20)  # 5 pages x up to 2 attempts x up to 2 http calls each
    call_log = []
    pdf = pdfium.PdfDocument(str(PDF))

    patched = {}
    for pno in PATCH_PAGES:
        v1p = by_no[pno]
        page = pdf[pno - 1]
        png = render_page_png(page, config.RENDER_DPI)
        result = convert_page_vision(png, pno, v1p["text_layer"], v1p["is_scanned"], call_log,
                                     reason="r6_iimk_network_retry")
        print(f"page {pno}: method={result['method']} number_coverage={result.get('number_coverage')} "
              f"word_coverage={result.get('word_coverage')} needs_review={result.get('needs_review')} "
              f"reasons={result.get('review_reasons')}")
        patched[pno] = {
            "page_no": pno, "is_text": v1p["is_text"], "is_table": v1p["is_table"],
            "is_visual": v1p["is_visual"], "is_scanned": v1p["is_scanned"],
            "text_layer": v1p["text_layer"], "markdown": result["markdown"],
            "docling_markdown": v1p["docling_markdown"],
            "method": result["method"],
            "number_coverage": result.get("number_coverage"), "word_coverage": result.get("word_coverage"),
            "unreadable_count": result.get("unreadable_count", 0),
            "needs_review": result.get("needs_review"), "review_reasons": result.get("review_reasons") or [],
            "diagrams": result.get("diagrams") or [], "diagram_count": result.get("diagram_count", 0),
            "diagram_issues": result.get("diagram_issues") or [],
            "diagram_label_coverage": result.get("diagram_label_coverage"),
            "prompt_version": result.get("prompt_version"),
        }

    v2_pages = []
    for p in v1_pages:
        pno = p["page_no"]
        v2_pages.append(patched[pno] if pno in patched else p)

    meta = lookup_classification(TXT_SOURCE_FILE, sb)
    chunks = chunk_document(chunkable_pages(v2_pages))
    embeddings = [embed_text(embedding_text(c["content"])) for c in chunks]

    w = write_version(meta, SOURCE_FILE, sha256_file(PDF), 229, v2_pages, chunks, version=2,
                      prompt_version=config.PROMPT_VERSION,
                      notes="R6 patch: retried 5 pages (1,27,62,63,118) that failed v1 with transient "
                            "network errors (ConnectionError/ReadTimeout) during the vision call. "
                            "All 5 were already correctly classified is_visual=True - not a "
                            "classification bug, a dropped request.",
                      reuse_file_id=V1_DOC_ID, embeddings=embeddings, sb=sb)
    print(f"v2 file_id={w['file_id']} pages={len(v2_pages)} chunks={len(w['chunk_rows'])}")
    print(f"vision_calls={call_count['vision']} embedding_calls={call_count['embedding']}")


if __name__ == "__main__":
    main()

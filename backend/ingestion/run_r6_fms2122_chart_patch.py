"""R6 patch: fix the same page_classify.py routing bug (53a281b) on The FMS
Consulting Casebook 2021-22's 5 affected pages (53, 56, 57, 60, 63) - each
combines a Docling-readable table with an embedded chart Docling can't read.
Confirmed read-only in the 2026-10-31 log entry (img_coverage 0.046-0.161,
well above CHART_IMAGE_COVERAGE_THRESHOLD=0.02) but not yet patched. Mirrors
run_r6_isb_patch.py's pattern: builds v3 = v2's 200 pages reused except these
5, re-classified (confirmed by assertion that they now route to vision) and
re-converted through convert_page_vision, insert-only, is_active=false."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import config
from supabase import create_client
import pypdfium2 as pdfium

from convert import convert_page_vision, sha256_file
from page_classify import classify_page, render_page_png
from chunk import chunk_document, embedding_text
from gemini_client import embed_text, call_count, set_vision_cap
from pipeline import write_version, lookup_classification, version_status, chunkable_pages

V2_DOC_ID = "2c117f26-a298-41f1-9e39-ba570556ed4e"
SOURCE_FILE = "The FMS Consulting Casebook 2021-22.pdf"
TXT_SOURCE_FILE = "The FMS Consulting Casebook 2021-22.pdf"
PDF = Path("../../Data/Consulting Files/PDF Files/The FMS Consulting Casebook 2021-22.pdf")
PATCH_PAGES = [53, 56, 57, 60, 63]
PAGE_COLS = ("page_no, is_text, is_table, is_visual, is_scanned, text_layer, markdown, "
             "docling_markdown, method, number_coverage, word_coverage, unreadable_count, "
             "needs_review, review_reasons, diagrams, diagram_count, diagram_issues, "
             "diagram_label_coverage, prompt_version")


def main():
    sb = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)

    if version_status(SOURCE_FILE, 3, sb) == "done":
        print("v3 already done; skipping")
        return

    v2_pages = sb.table("ingest_pages").select(PAGE_COLS).eq("document_id", V2_DOC_ID) \
        .order("page_no").execute().data
    assert len(v2_pages) == 200, f"expected 200 v2 pages, got {len(v2_pages)}"
    by_no = {p["page_no"]: p for p in v2_pages}

    set_vision_cap(50)  # 5 pages x up to 2 attempts x up to 2 http calls each, generous cap
    call_log = []
    pdf = pdfium.PdfDocument(str(PDF))

    patched = {}
    for pno in PATCH_PAGES:
        v2p = by_no[pno]
        page = pdf[pno - 1]
        # Re-classify with the fixed heuristic to confirm it now routes to
        # vision before converting (not assumed).
        cls = classify_page(page, docling_has_table=True)  # all 5 are docling-table pages
        assert cls["is_visual"] and not cls["is_table"], (
            f"page {pno}: expected the fixed classifier to route to vision, got "
            f"is_table={cls['is_table']} is_visual={cls['is_visual']}")
        png = render_page_png(page, config.RENDER_DPI)
        result = convert_page_vision(png, pno, v2p["text_layer"], v2p["is_scanned"], call_log,
                                     reason="r6_classify_fix_patch_fms")
        print(f"page {pno}: method={result['method']} number_coverage={result.get('number_coverage')} "
              f"word_coverage={result.get('word_coverage')} needs_review={result.get('needs_review')} "
              f"reasons={result.get('review_reasons')}")
        patched[pno] = {
            "page_no": pno, "is_text": cls["is_text"], "is_table": cls["is_table"],
            "is_visual": cls["is_visual"], "is_scanned": cls["is_scanned"],
            "text_layer": v2p["text_layer"], "markdown": result["markdown"],
            "docling_markdown": v2p["markdown"],  # v2's docling-only markdown, kept for debug
            "method": result["method"],
            "number_coverage": result.get("number_coverage"), "word_coverage": result.get("word_coverage"),
            "unreadable_count": result.get("unreadable_count", 0),
            "needs_review": result.get("needs_review"), "review_reasons": result.get("review_reasons") or [],
            "diagrams": result.get("diagrams") or [], "diagram_count": result.get("diagram_count", 0),
            "diagram_issues": result.get("diagram_issues") or [],
            "diagram_label_coverage": result.get("diagram_label_coverage"),
            "prompt_version": result.get("prompt_version"),
        }

    v3_pages = []
    for p in v2_pages:
        pno = p["page_no"]
        v3_pages.append(patched[pno] if pno in patched else p)

    meta = lookup_classification(TXT_SOURCE_FILE, sb)
    chunks = chunk_document(chunkable_pages(v3_pages))
    embeddings = [embed_text(embedding_text(c["content"])) for c in chunks]

    w = write_version(meta, SOURCE_FILE, sha256_file(PDF), 200, v3_pages, chunks, version=3,
                      prompt_version=config.PROMPT_VERSION,
                      notes="R6 patch: page_classify.py routing fix (53a281b, table+embedded-chart "
                            "pages no longer forced to Docling) applied to pages 53,56,57,60,63 - "
                            "flagged in the 2026-10-30/31 log entries as confirmed but not yet patched. "
                            "v3 = v2's 200 pages reused except these 5.",
                      reuse_file_id=V2_DOC_ID, embeddings=embeddings, sb=sb)
    print(f"v3 file_id={w['file_id']} pages={len(v3_pages)} chunks={len(w['chunk_rows'])}")
    print(f"vision_calls={call_count['vision']} embedding_calls={call_count['embedding']}")


if __name__ == "__main__":
    main()

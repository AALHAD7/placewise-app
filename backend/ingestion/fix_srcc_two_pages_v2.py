"""Second attempt at SRCC pages 35 and 50 - the first attempt (v4) fixed 4 of
6 target pages but left these 2 structural (not digit-misread) issues
unresolved: p35's issue tree is still missing the SECONDARY/TERTIARY SECTOR
branches, p50 still conflates total population with urban population in one
label. Much more explicit, structurally-worded hints this time.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import config
from supabase import create_client
import pypdfium2 as pdfium

from convert import build_vision_prompt, _vision_attempt, sha256_file
from page_classify import render_page_png
from chunk import chunk_document, embedding_text
from gemini_client import embed_text, call_count, set_vision_cap
from pipeline import write_version, lookup_classification, version_status, chunkable_pages

V4_DOC_ID = "2701715d-683e-4f5f-a908-0c19c038b870"
SOURCE_FILE = "SRCC Guesstimates-Book-Volume-1-6.pdf"
PDF = Path("../../Data/Consulting Files/PDF Files/SRCC Guesstimates-Book-Volume-1-6.pdf")
HIGH_DPI = 400

FINDINGS = {
    35: ["The main issue tree has THREE sibling branches under '20-35 YEARS': "
         "PRIMARY SECTOR, SECONDARY SECTOR, and TERTIARY SECTOR. The previous "
         "transcription only expanded PRIMARY SECTOR's children and left "
         "SECONDARY SECTOR and TERTIARY SECTOR as empty leaf nodes with no "
         "children - this is wrong, the page shows all three sectors with the "
         "SAME kind of nested breakdown (worker type -> commute details -> "
         "number of workers / average commute time / work-from-office days per "
         "week, leading to an hours calculation). Look very carefully below the "
         "SECONDARY SECTOR and TERTIARY SECTOR labels and transcribe their full "
         "nested breakdown the same way PRIMARY SECTOR's was transcribed - do "
         "not leave them empty."],
    50: ["The diagram's top node was previously transcribed as a single label "
         "'INDIA'S URBAN POPULATION 1.4 BILLION' - this is WRONG. Per the "
         "page's own assumptions, 1.4 BILLION is India's TOTAL population, not "
         "the urban population. 'INDIA'S URBAN POPULATION' is a separate "
         "sub-header, and the actual urban population number is a smaller "
         "figure computed from 30% of 1.4 billion (around 420 million), shown "
         "as its own distinct node below or beside the total population node - "
         "NOT the same node as the 1.4 billion total. Transcribe these as two "
         "separate nodes: one for TOTAL population (1.4 Billion) and one for "
         "URBAN population (the ~30% sub-figure), connected appropriately, "
         "exactly as they appear nested on the page."],
}

PAGE_COLS = ("page_no, is_text, is_table, is_visual, is_scanned, text_layer, markdown, "
             "docling_markdown, method, number_coverage, word_coverage, unreadable_count, "
             "needs_review, review_reasons, diagrams, diagram_count, diagram_issues, "
             "diagram_label_coverage, prompt_version")


def main():
    sb = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)

    if version_status(SOURCE_FILE, 5, sb) == "done":
        print("v5 already done; skipping")
        return

    v4_pages = sb.table("ingest_pages").select(PAGE_COLS).eq("document_id", V4_DOC_ID) \
        .order("page_no").execute().data
    assert len(v4_pages) == 61, f"expected 61 v4 pages, got {len(v4_pages)}"
    by_no = {p["page_no"]: p for p in v4_pages}

    set_vision_cap(10)
    call_log = []
    pdf = pdfium.PdfDocument(str(PDF))

    patched = {}
    for pno, hints in FINDINGS.items():
        v4p = by_no[pno]
        page = pdf[pno - 1]
        png = render_page_png(page, HIGH_DPI)
        prompt = build_vision_prompt(pno, v4p["text_layer"], fix_hints=hints)
        md, fid, truncated, model, used = _vision_attempt(
            png, prompt, pno, v4p["text_layer"], v4p["is_scanned"], call_log,
            reason="srcc_2page_v2_refix", attempt=1, max_http=10
        )
        print(f"page {pno}: method={model} truncated={truncated} needs_review={fid.get('needs_review')} reasons={fid.get('review_reasons')}")
        patched[pno] = {
            "page_no": pno, "is_text": v4p["is_text"], "is_table": v4p["is_table"],
            "is_visual": v4p["is_visual"], "is_scanned": v4p["is_scanned"],
            "text_layer": v4p["text_layer"], "markdown": md,
            "docling_markdown": v4p["docling_markdown"],
            "method": model or v4p["method"],
            "number_coverage": fid.get("number_coverage"), "word_coverage": fid.get("word_coverage"),
            "unreadable_count": fid.get("unreadable_count", 0),
            "needs_review": fid.get("needs_review", True), "review_reasons": fid.get("review_reasons") or [],
            "diagrams": fid.get("diagrams") or [], "diagram_count": fid.get("diagram_count", 0),
            "diagram_issues": fid.get("diagram_issues") or [],
            "diagram_label_coverage": fid.get("diagram_label_coverage"),
            "prompt_version": fid.get("prompt_version") or v4p["prompt_version"],
        }

    v5_pages = []
    for p in v4_pages:
        pno = p["page_no"]
        v5_pages.append(patched[pno] if pno in patched else p)

    meta = lookup_classification(SOURCE_FILE, sb)
    chunks = chunk_document(chunkable_pages(v5_pages))
    embeddings = [embed_text(embedding_text(c["content"])) for c in chunks]

    w = write_version(meta, SOURCE_FILE, sha256_file(PDF), 61, v5_pages, chunks, version=5,
                      prompt_version=config.PROMPT_VERSION,
                      notes="Second targeted re-fix attempt on pages 35 and 50 - v4's first "
                            "attempt fixed 4/6 pages but these 2 structural issues (missing "
                            "diagram branches, population-label conflation) needed sharper, "
                            "more explicit hints. Other 59 pages reused unchanged from v4.",
                      reuse_file_id=V4_DOC_ID, embeddings=embeddings, sb=sb)
    print(f"v5 file_id={w['file_id']} pages={len(v5_pages)} chunks={len(w['chunk_rows'])}")
    print(f"vision_calls={call_count['vision']} embedding_calls={call_count['embedding']}")


if __name__ == "__main__":
    main()

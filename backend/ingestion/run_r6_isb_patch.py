"""R6 patch: fix the page_classify.py routing bug found after R6 (pages
162/166/169/175 of the ISB Consulting Casebook combine a real Docling-visible
table with an embedded pie chart Docling can't read at all - img_coverage
flagged them "visual" per the fixed classify_page, but docling_has_table also
flagged them "table" and that flag unconditionally won, so the chart was
silently lost: number_coverage as low as 0.33). Re-classifies and re-converts
just those 4 pages through the vision path classify_page now routes them to,
then builds v2 = v1's 183 pages reused except these 4, insert-only,
is_active=false. Mirrors run_r6_srcc_patch.py's reuse-unless-patched pattern.

Page 177 (the casebook's 5th originally-flagged low-number_coverage page) is
NOT part of this patch - checked against the real page image, it has no
chart at all (a plain multi-box "Industry Primer" layout like dozens of
others in the same section that scored fine). Its low number_coverage
(0.5) traces to Docling dropping this one page's footer line ("2025  177")
from its own markdown - a one-off Docling extraction quirk, not the
table+chart classification bug. The existing automatic docling-vs-vision
retry already tried vision on p177 in the v1 run and kept Docling anyway,
because vision's own diagram-tree reading of this page's bulleted
"Porter's 5 forces" section scores several diagram_errors/diagram_structure
warnings that _score() weighs more than the real number/word coverage gain
- the same scoring tradeoff the 2026-10-30 R6 ISB log entry already flagged
and left for Aalhad to decide (not re-decided here)."""
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

V1_DOC_ID = "f3da976f-669c-47a3-875a-22e3fe8afe51"
SOURCE_FILE = "ISB Consulting Casebook 2025.pdf"
TXT_SOURCE_FILE = "ISB Consulting Casebook 2025.txt"
PDF = Path("../../Data/Consulting Files/PDF Files/ISB Consulting Casebook 2025.pdf")
PATCH_PAGES = [162, 166, 169, 175]
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
    assert len(v1_pages) == 183, f"expected 183 v1 pages, got {len(v1_pages)}"
    by_no = {p["page_no"]: p for p in v1_pages}

    set_vision_cap(40)  # 4 pages x up to 2 attempts x up to 2 http calls each, generous cap
    call_log = []
    pdf = pdfium.PdfDocument(str(PDF))

    patched = {}
    for pno in PATCH_PAGES:
        v1p = by_no[pno]
        page = pdf[pno - 1]
        # Re-classify with the fixed heuristic to confirm it now routes to
        # vision before converting (not assumed).
        cls = classify_page(page, docling_has_table=True)  # these 4 are all Docling-table pages
        assert cls["is_visual"] and not cls["is_table"], (
            f"page {pno}: expected the fixed classifier to route to vision, got "
            f"is_table={cls['is_table']} is_visual={cls['is_visual']}")
        png = render_page_png(page, config.RENDER_DPI)
        result = convert_page_vision(png, pno, v1p["text_layer"], v1p["is_scanned"], call_log,
                                     reason="r6_classify_fix_patch")
        print(f"page {pno}: method={result['method']} number_coverage={result.get('number_coverage')} "
              f"word_coverage={result.get('word_coverage')} needs_review={result.get('needs_review')} "
              f"reasons={result.get('review_reasons')}")
        patched[pno] = {
            "page_no": pno, "is_text": cls["is_text"], "is_table": cls["is_table"],
            "is_visual": cls["is_visual"], "is_scanned": cls["is_scanned"],
            "text_layer": v1p["text_layer"], "markdown": result["markdown"],
            "docling_markdown": v1p["markdown"],  # v1's docling-only markdown, kept for debug
            "method": result["method"],
            "number_coverage": result.get("number_coverage"), "word_coverage": result.get("word_coverage"),
            "unreadable_count": result.get("unreadable_count", 0),
            "needs_review": result.get("needs_review"), "review_reasons": result.get("review_reasons") or [],
            "diagrams": result.get("diagrams") or [], "diagram_count": result.get("diagram_count", 0),
            "diagram_issues": result.get("diagram_issues") or [],
            "diagram_label_coverage": result.get("diagram_label_coverage"),
            "prompt_version": result.get("prompt_version"),
        }

    # Assemble v2 page set: patched pages override, rest (incl. p177, left
    # open above) reused verbatim from v1.
    v2_pages = []
    for p in v1_pages:
        pno = p["page_no"]
        v2_pages.append(patched[pno] if pno in patched else p)

    meta = lookup_classification(TXT_SOURCE_FILE, sb)
    chunks = chunk_document(chunkable_pages(v2_pages))
    embeddings = [embed_text(embedding_text(c["content"])) for c in chunks]

    w = write_version(meta, SOURCE_FILE, sha256_file(PDF), 183, v2_pages, chunks, version=2,
                      prompt_version=config.PROMPT_VERSION,
                      notes="R6 patch: page_classify.py routing fix (table+embedded-chart pages no "
                            "longer forced to Docling) applied to pages 162,166,169,175. Page 177 "
                            "(no chart; a Docling footer-drop quirk + the existing _score diagram-"
                            "warning tradeoff) left open for Aalhad, see run_r6_isb_patch.py docstring.",
                      reuse_file_id=V1_DOC_ID, embeddings=embeddings, sb=sb)
    print(f"v2 file_id={w['file_id']} pages={len(v2_pages)} chunks={len(w['chunk_rows'])}")
    print(f"vision_calls={call_count['vision']} embedding_calls={call_count['embedding']}")


if __name__ == "__main__":
    main()

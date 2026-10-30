"""R6 patch: re-convert ISB Consulting Casebook 2025 p177 now that convert.py's
_score() penalizes diagram issues per distinct block instead of per issue
(commit 20e1cd4). p177 was left open by run_r6_isb_patch.py (v1 -> v2): the
automatic docling-vs-vision retry already tried vision on this page and
recovered the page's dropped footer line, but the old flat per-issue penalty
kept Docling anyway. This builds v3 = v2's 183 pages reused except p177,
insert-only, is_active=false. Mirrors run_r6_isb_patch.py's pattern."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import config
from supabase import create_client
import pypdfium2 as pdfium

from convert import convert_page_vision, sha256_file, _score
from page_classify import render_page_png
from chunk import chunk_document, embedding_text
from gemini_client import embed_text, call_count, set_vision_cap
from pipeline import write_version, lookup_classification, version_status, chunkable_pages

V2_DOC_ID = "0a6c4f9e-b1bd-4bf8-bbee-7475ba8a6c14"
SOURCE_FILE = "ISB Consulting Casebook 2025.pdf"
TXT_SOURCE_FILE = "ISB Consulting Casebook 2025.txt"
PDF = Path("../../Data/Consulting Files/PDF Files/ISB Consulting Casebook 2025.pdf")
PATCH_PAGES = [177]
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
    assert len(v2_pages) == 183, f"expected 183 v2 pages, got {len(v2_pages)}"
    by_no = {p["page_no"]: p for p in v2_pages}

    set_vision_cap(10)  # 1 page x up to 2 attempts x up to 2 http calls each
    call_log = []
    pdf = pdfium.PdfDocument(str(PDF))

    patched = {}
    for pno in PATCH_PAGES:
        v2p = by_no[pno]
        docling_score = _score({
            "number_coverage": v2p["number_coverage"], "word_coverage": v2p["word_coverage"],
            "diagram_label_coverage": v2p["diagram_label_coverage"],
            "diagram_issues": v2p.get("diagram_issues") or [],
        }, False)
        png = render_page_png(pdf[pno - 1], config.RENDER_DPI)
        result = convert_page_vision(png, pno, v2p["text_layer"], v2p["is_scanned"], call_log,
                                     reason="r6_score_formula_fix_patch")
        vision_score = _score(result, result.get("truncated", False))
        print(f"page {pno}: docling_score={docling_score:.4f} vision_score={vision_score:.4f} "
              f"method={'gemini_vision_v2' if vision_score > docling_score else 'docling (kept)'}")
        print(f"page {pno}: method={result['method']} number_coverage={result.get('number_coverage')} "
              f"word_coverage={result.get('word_coverage')} needs_review={result.get('needs_review')} "
              f"reasons={result.get('review_reasons')}")
        print(f"page {pno}: diagram_issues={result.get('diagram_issues')}")
        if vision_score <= docling_score:
            print(f"page {pno}: LIVE RESULT: vision does NOT beat docling ({vision_score} <= "
                  f"{docling_score}) - this live call's real diagram_issues span more than 1 "
                  f"block (unlike the log entry's reconstructed single-block assumption). "
                  f"Not writing a v3 version; nothing changes for this page.")
            print(f"vision_calls={call_count['vision']} embedding_calls={call_count['embedding']}")
            return
        patched[pno] = {
            # is_table/is_visual are classification flags (unchanged by this
            # fix - the page is still a docling-table page; what changed is
            # which conversion the automatic docling-vs-vision retry keeps).
            "page_no": pno, "is_text": v2p["is_text"], "is_table": v2p["is_table"],
            "is_visual": v2p["is_visual"], "is_scanned": v2p["is_scanned"],
            "text_layer": v2p["text_layer"], "markdown": result["markdown"],
            "docling_markdown": v2p["markdown"],  # v2's docling-only markdown, kept for debug
            "method": "docling+gemini_vision_v2",  # same convention as convert_document's retry
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

    w = write_version(meta, SOURCE_FILE, sha256_file(PDF), 183, v3_pages, chunks, version=3,
                      prompt_version=config.PROMPT_VERSION,
                      notes="R6 patch: convert.py _score per-block diagram penalty fix (commit 20e1cd4) "
                            "applied to page 177 - the page the fix was built for. Docling dropped this "
                            "page's footer line; vision recovers it but mis-trees one Porter's-5-forces "
                            "block, which the old flat per-issue penalty weighed more than the real "
                            "coverage win. v3 = v2's 183 pages reused except page 177.",
                      reuse_file_id=V2_DOC_ID, embeddings=embeddings, sb=sb)
    print(f"v3 file_id={w['file_id']} pages={len(v3_pages)} chunks={len(w['chunk_rows'])}")
    print(f"vision_calls={call_count['vision']} embedding_calls={call_count['embedding']}")


if __name__ == "__main__":
    main()

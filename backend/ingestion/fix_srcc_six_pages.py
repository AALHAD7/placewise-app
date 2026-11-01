"""Targeted re-fix for the 6 SRCC Guesstimates pages the independent fidelity
re-verification couldn't auto-resolve after 2 rounds at normal (150 dpi) render
resolution. All 6 findings are small-digit/decimal-point misreads (e.g. "20.16"
vs "2.016", "118" vs ".118") - the likely root cause is render resolution, not
prompting, so this re-renders at 2x dpi (300) AND feeds the exact prior finding
back in as a corrective fix_hint. is_active stays false; insert-only; v2's other
55 pages are reused unchanged, per the same write_version pattern every R6 patch
script in this repo uses.
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

V2_DOC_ID = "6c1e09ab-e409-407b-9fbc-b1bc45c462ef"  # v3 - the independent fidelity
# re-verification agent's own version, which already fixed 6 *different* pages
# (false-positive reclassifications + its own genuine fixes) and correctly left
# these 6 as could_not_auto_resolve (confirmed: v3 page 21 still has "20.16",
# page 15 still has "118 MILLION" without the decimal - the bugs are still
# there). Building this fix on top of v3, not v2, so those other fixes aren't lost.
SOURCE_FILE = "SRCC Guesstimates-Book-Volume-1-6.pdf"
PDF = Path("../../Data/Consulting Files/PDF Files/SRCC Guesstimates-Book-Volume-1-6.pdf")
HIGH_DPI = 300

# The independent fidelity re-verification's exact findings per page (see
# backend/ingestion/out/fidelity_reverify_progress.json), fed back as fix_hints.
FINDINGS = {
    21: ["The issue tree node under RURAL/HIGH INCOME labelled 'ADOPTION RATE' was "
         "previously transcribed as '20.16 MILLION (70%)' - read the decimal point "
         "very carefully, it should be '2.016 MILLION (70%)'."],
    15: ["The node labelled 'LOWER' was previously transcribed as '118 MILLION' - "
         "read the decimal point very carefully, the page shows '.118 MILLION'."],
    36: ["Assumption 1 was previously transcribed with the year '2019' in its second "
         "clause - read the actual printed year very carefully and transcribe it "
         "exactly as printed, even if it looks like a typo on the page itself "
         "(do not silently correct an apparent typo - transcribe what is actually "
         "printed)."],
    35: ["The issue tree was previously transcribed severely truncated, missing "
         "entire branches below the tertiary sector level - specifically the "
         "breakdown under PRIMARY SECTOR, SECONDARY SECTOR, and the TERTIARY SECTOR "
         "calculation rows (number of workers, average time, work-from-office days). "
         "Transcribe the FULL diagram including every branch and calculation row "
         "visible on the page, however small the text."],
    29: ["Node 'el_calc' was previously transcribed as '28M * 10% = 28 MILLION' - "
         "read the percentage value very carefully, it should be '28M * 100% = 28 "
         "MILLION'. Node 'el_sum' was previously transcribed without a '+' operator "
         "between terms - make sure arithmetic operators are preserved exactly."],
    50: ["The node 'INDIA'S URBAN POPULATION' was previously transcribed as if "
         "'1.4 BILLION' were the urban population itself - read carefully: 1.4 "
         "Billion is India's TOTAL population, and the urban population is a "
         "sub-figure (e.g. 30% of 1.4B) nested under that total, not the same "
         "number. Transcribe the label structure exactly as it nests on the page."],
}

PAGE_COLS = ("page_no, is_text, is_table, is_visual, is_scanned, text_layer, markdown, "
             "docling_markdown, method, number_coverage, word_coverage, unreadable_count, "
             "needs_review, review_reasons, diagrams, diagram_count, diagram_issues, "
             "diagram_label_coverage, prompt_version")


def main():
    sb = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)

    if version_status(SOURCE_FILE, 4, sb) == "done":
        print("v4 already done; skipping")
        return

    v2_pages = sb.table("ingest_pages").select(PAGE_COLS).eq("document_id", V2_DOC_ID) \
        .order("page_no").execute().data
    assert len(v2_pages) == 61, f"expected 61 v3 pages, got {len(v2_pages)}"
    by_no = {p["page_no"]: p for p in v2_pages}

    set_vision_cap(30)  # 6 pages x up to 2 http calls each, generous headroom
    call_log = []
    pdf = pdfium.PdfDocument(str(PDF))

    patched = {}
    for pno, hints in FINDINGS.items():
        v2p = by_no[pno]
        page = pdf[pno - 1]
        png = render_page_png(page, HIGH_DPI)
        prompt = build_vision_prompt(pno, v2p["text_layer"], fix_hints=hints)
        md, fid, truncated, model, used = _vision_attempt(
            png, prompt, pno, v2p["text_layer"], v2p["is_scanned"], call_log,
            reason="srcc_6page_targeted_refix", attempt=1, max_http=30
        )
        print(f"page {pno}: method={model} truncated={truncated}")
        print(f"  markdown (first 400 chars): {md[:400]!r}")
        patched[pno] = {
            "page_no": pno, "is_text": v2p["is_text"], "is_table": v2p["is_table"],
            "is_visual": v2p["is_visual"], "is_scanned": v2p["is_scanned"],
            "text_layer": v2p["text_layer"], "markdown": md,
            "docling_markdown": v2p["docling_markdown"],
            "method": model or v2p["method"],
            "number_coverage": fid.get("number_coverage"), "word_coverage": fid.get("word_coverage"),
            "unreadable_count": fid.get("unreadable_count", 0),
            "needs_review": fid.get("needs_review", True), "review_reasons": fid.get("review_reasons") or [],
            "diagrams": fid.get("diagrams") or [], "diagram_count": fid.get("diagram_count", 0),
            "diagram_issues": fid.get("diagram_issues") or [],
            "diagram_label_coverage": fid.get("diagram_label_coverage"),
            "prompt_version": fid.get("prompt_version") or v2p["prompt_version"],
        }

    v3_pages = []
    for p in v2_pages:
        pno = p["page_no"]
        v3_pages.append(patched[pno] if pno in patched else p)

    meta = lookup_classification(SOURCE_FILE, sb)
    chunks = chunk_document(chunkable_pages(v3_pages))
    embeddings = [embed_text(embedding_text(c["content"])) for c in chunks]

    w = write_version(meta, SOURCE_FILE, sha256_file(PDF), 61, v3_pages, chunks, version=4,
                      prompt_version=config.PROMPT_VERSION,
                      notes="Targeted re-fix of the 6 pages (15,21,29,35,36,50) v3's independent "
                            "fidelity re-verification flagged as genuine (not false-positive) "
                            "defects it could not auto-resolve after 2 rounds at 150dpi - "
                            "re-rendered at 300dpi with the exact prior finding fed back as a "
                            "corrective fix_hint. Other 55 pages reused unchanged from v3 "
                            "(so v3's own fixes/reclassifications are preserved, not just v2's).",
                      reuse_file_id=V2_DOC_ID, embeddings=embeddings, sb=sb)
    print(f"v3 file_id={w['file_id']} pages={len(v3_pages)} chunks={len(w['chunk_rows'])}")
    print(f"vision_calls={call_count['vision']} embedding_calls={call_count['embedding']}")


if __name__ == "__main__":
    main()

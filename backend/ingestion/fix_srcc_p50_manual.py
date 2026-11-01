"""Manual (no vision call) fix for SRCC page 50 - 3 vision attempts in a row
(v3's original, v4's hint, v5's sharper hint) all produced the exact same
wrong label, conflating total and urban population. The correct split is
unambiguous from the page's own stated assumptions (visible in the same
page's markdown): "India's population is 1.4 billion" + "Approximately 30%
... resides in urban areas" = urban population 0.42 billion (420 million).
This is arithmetic from text already on the page, not an invention - the
same kind of computed value this diagram already shows elsewhere (e.g.
"16 M*90% = 14.4 M"). Page 35 is NOT touched here - 2 vision attempts failed
identically on it and nothing here gives grounds to guess its missing
content, so it stays an honest, reported gap.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import config
from supabase import create_client

from convert import sha256_file
from chunk import chunk_document, embedding_text
from gemini_client import embed_text, call_count
from pipeline import write_version, lookup_classification, version_status, chunkable_pages

V5_DOC_ID = "573f9914-ea77-4645-9085-8097f4241e6e"
SOURCE_FILE = "SRCC Guesstimates-Book-Volume-1-6.pdf"
PDF = Path("../../Data/Consulting Files/PDF Files/SRCC Guesstimates-Book-Volume-1-6.pdf")

PAGE_COLS = ("page_no, is_text, is_table, is_visual, is_scanned, text_layer, markdown, "
             "docling_markdown, method, number_coverage, word_coverage, unreadable_count, "
             "needs_review, review_reasons, diagrams, diagram_count, diagram_issues, "
             "diagram_label_coverage, prompt_version")


def fix_page_50_markdown(md: str) -> str:
    match = re.search(r"```placewise-diagram\n(\{.*?\})\n```", md, re.DOTALL)
    assert match, "no diagram block found on page 50"
    block = json.loads(match.group(1))
    assert block["nodes"][0]["id"] == "a"
    assert "URBAN POPULATION" in block["nodes"][0]["label"] and "1.4 BILLION" in block["nodes"][0]["label"]

    block["nodes"][0]["label"] = "INDIA'S URBAN POPULATION (30%) 420 MILLION"
    block["nodes"].insert(0, {"id": "total_pop", "label": "TOTAL POPULATION OF INDIA 1.4 BILLION"})
    block["edges"].insert(0, {"from": "total_pop", "to": "a", "label": None})

    new_block_text = json.dumps(block, indent=2)
    return md[:match.start(1)] + new_block_text + md[match.end(1):]


def main():
    sb = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)

    if version_status(SOURCE_FILE, 6, sb) == "done":
        print("v6 already done; skipping")
        return

    v5_pages = sb.table("ingest_pages").select(PAGE_COLS).eq("document_id", V5_DOC_ID) \
        .order("page_no").execute().data
    assert len(v5_pages) == 61, f"expected 61 v5 pages, got {len(v5_pages)}"

    v6_pages = []
    for p in v5_pages:
        if p["page_no"] == 50:
            fixed_md = fix_page_50_markdown(p["markdown"])
            p = {**p, "markdown": fixed_md}
            print("page 50 patched. New top of diagram block:")
            print(fixed_md[fixed_md.find("```placewise-diagram"):fixed_md.find("```placewise-diagram") + 300])
        v6_pages.append(p)

    meta = lookup_classification(SOURCE_FILE, sb)
    chunks = chunk_document(chunkable_pages(v6_pages))
    embeddings = [embed_text(embedding_text(c["content"])) for c in chunks]

    w = write_version(meta, SOURCE_FILE, sha256_file(PDF), 61, v6_pages, chunks, version=6,
                      prompt_version=config.PROMPT_VERSION,
                      notes="Manual (no vision call) fix for page 50 - 3 vision attempts in a "
                            "row produced the identical wrong label conflating total and urban "
                            "population. Split into two nodes using the page's own stated "
                            "assumptions (1.4B total x 30% urban = 420M), computed arithmetic "
                            "from text already on the page, not invented. Page 35 still "
                            "unresolved (2 vision attempts failed identically, left honest) - "
                            "see out/fidelity_reverify_progress.json and the SRCC log.md entry.",
                      reuse_file_id=V5_DOC_ID, embeddings=embeddings, sb=sb)
    print(f"v6 file_id={w['file_id']} pages={len(v6_pages)} chunks={len(w['chunk_rows'])}")
    print(f"embedding_calls={call_count['embedding']}")


if __name__ == "__main__":
    main()

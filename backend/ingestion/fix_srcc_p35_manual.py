"""Manual (no vision call) fix for SRCC page 35 - 3 vision attempts (Gemini
flash-lite x2 with increasingly explicit hints, NVIDIA Nemotron x1) all failed,
the NVIDIA ones returning empty output entirely. Looked at the actual rendered
page image directly (out/srcc_p35.png) to find the real bug: it isn't "missing"
content as the checker's finding implied - it's MISPLACED content. The model
correctly transcribed every box's text but nested all four second-row boxes
(SELF EMPLOYED, PUBLIC SECTOR, CORPORATE WORKERS, OTHER SERVICE SECTOR
EMPLOYEES) under PRIMARY SECTOR alone, leaving SECONDARY/TERTIARY SECTOR as
empty siblings. Per the page image, the correct parent for each is:
  PRIMARY SECTOR   -> SELF EMPLOYED only
  SECONDARY SECTOR -> PUBLIC SECTOR only
  TERTIARY SECTOR  -> CORPORATE WORKERS (both commuting sub-branches) AND
                       OTHER SERVICE SECTOR EMPLOYEES
Every other label/number in the tree is kept byte-identical to what 3 vision
attempts already correctly transcribed - this edit only re-parents 4 existing
subtrees, it does not invent or change any label or number.
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

V6_DOC_ID = "1ad48fb6-c630-4bde-9276-918bc1aebed1"
SOURCE_FILE = "SRCC Guesstimates-Book-Volume-1-6.pdf"
PDF = Path("../../Data/Consulting Files/PDF Files/SRCC Guesstimates-Book-Volume-1-6.pdf")

PAGE_COLS = ("page_no, is_text, is_table, is_visual, is_scanned, text_layer, markdown, "
             "docling_markdown, method, number_coverage, word_coverage, unreadable_count, "
             "needs_review, review_reasons, diagrams, diagram_count, diagram_issues, "
             "diagram_label_coverage, prompt_version")


def fix_page_35_markdown(md: str) -> str:
    match = re.search(r"```placewise-diagram\n(\{.*?\})\n```", md, re.DOTALL)
    assert match, "no diagram block found on page 35"
    block = json.loads(match.group(1))

    total_workforce = block["root"]["children"][0]["children"][1]["children"][0]
    assert total_workforce["label"] == "TOTAL WORKFORCE IN DELHI 14.5 MILLION"

    primary, secondary, tertiary = total_workforce["children"]
    assert primary["label"] == "PRIMARY SECTOR 2%"
    assert secondary["label"] == "SECONDARY SECTOR 38%"
    assert tertiary["label"] == "TERTIARY SECTOR 60%"

    self_employed, public_sector, corporate_workers, other_service = primary["children"]
    assert self_employed["label"] == "SELF EMPLOYED 20%"
    assert public_sector["label"] == "PUBLIC SECTOR 10%"
    assert corporate_workers["label"] == "CORPORATE WORKERS"
    assert other_service["label"] == "OTHER SERVICE SECTOR EMPLOYEES"

    primary["children"] = [self_employed]
    secondary["children"] = [public_sector]
    tertiary["children"] = [corporate_workers, other_service]

    new_block_text = json.dumps(block, indent=2)
    return md[:match.start(1)] + new_block_text + md[match.end(1):]


def main():
    sb = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)

    if version_status(SOURCE_FILE, 7, sb) == "done":
        print("v7 already done; skipping")
        return

    v6_pages = sb.table("ingest_pages").select(PAGE_COLS).eq("document_id", V6_DOC_ID) \
        .order("page_no").execute().data
    assert len(v6_pages) == 61, f"expected 61 v6 pages, got {len(v6_pages)}"

    v7_pages = []
    for p in v6_pages:
        if p["page_no"] == 35:
            fixed_md = fix_page_35_markdown(p["markdown"])
            p = {**p, "markdown": fixed_md}
            print("page 35 patched.")
        v7_pages.append(p)

    meta = lookup_classification(SOURCE_FILE, sb)
    chunks = chunk_document(chunkable_pages(v7_pages))
    embeddings = [embed_text(embedding_text(c["content"])) for c in chunks]

    w = write_version(meta, SOURCE_FILE, sha256_file(PDF), 61, v7_pages, chunks, version=7,
                      prompt_version=config.PROMPT_VERSION,
                      notes="Manual (no vision call) fix for page 35 - 3 vision attempts "
                            "(Gemini x2, NVIDIA Nemotron x1 which returned empty output) all "
                            "failed. Looked at the rendered page image directly: the bug was "
                            "misplacement, not missing content - all 4 second-row boxes were "
                            "nested under PRIMARY SECTOR instead of their correct sectors. "
                            "Re-parented 4 existing subtrees verbatim (SELF EMPLOYED stays "
                            "under PRIMARY, PUBLIC SECTOR moved to SECONDARY, CORPORATE "
                            "WORKERS + OTHER SERVICE SECTOR EMPLOYEES moved to TERTIARY) - no "
                            "label or number invented or changed, only re-parented. This "
                            "closes the last of SRCC's originally-stuck 6 pages (15, 21, 29, "
                            "35, 36, 50 - all now resolved).",
                      reuse_file_id=V6_DOC_ID, embeddings=embeddings, sb=sb)
    print(f"v7 file_id={w['file_id']} pages={len(v7_pages)} chunks={len(w['chunk_rows'])}")
    print(f"embedding_calls={call_count['embedding']}")


if __name__ == "__main__":
    main()

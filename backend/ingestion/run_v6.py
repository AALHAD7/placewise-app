"""R6-prep: carry v5 into v6 (insert-only), applying the two R2.12 free fixes that were
diagnosed but not implemented when R2 closed (log.md, 2026-10-21):

1. ragged_table (pattern 1): a Markdown table body row whose cell count differs from
   its header is now flagged for review (FMS p236: two source tables merged into one
   table with misaligned columns, invisible to word_coverage).
2. The raster-safe title-strip guard (pattern 3) is now in postprocess.py, so a future
   conversion won't null a real title under a raster table that has no text-layer
   overlap at all (FMS p25). It cannot undo an already-nulled title by itself - v5's
   markdown already carries `"title": null` on that block - so this run also restores
   p25's title text as a one-off, human-sourced patch: the R2.12 fidelity review read
   it directly off the source page image as "XYZ Shoe company Income Statement
   (₹ (in lakhs))" (log.md line 226), so this is a verified correction, not a guess.

No vision calls. At most one new embedding call, for the one chunk whose content
actually changes (page 25's table block); every other chunk is reused byte-for-byte
from v5 by content hash, so its embedding is reused too, not recomputed.

    venv/bin/python run_v6.py --dry-run      # 0 Gemini calls, 0 writes
    venv/bin/python run_v6.py                # write v6
    venv/bin/python run_v6.py --resume       # after a stopped embedding run

Exit codes: 0 done (or already done), 1 abort, 2 stopped cleanly before the DB write.
"""
import argparse
import json
import sys
from collections import Counter
from pathlib import Path

INGESTION_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(INGESTION_DIR))

from chunk import chunk_document, embedding_text  # noqa: E402
from config import EMBEDDING_DIM  # noqa: E402
from fidelity import check_page  # noqa: E402
from postprocess import postprocess_markdown  # noqa: E402
from run_repilot import DEFAULT_PDF, OUT_DIR, embed_cost, load_embed_cache, save_embed_cache, sha256_file, text_key  # noqa: E402
from run_v4 import PAGE_COLS, load_doc_pages  # noqa: E402
from seqdiff import boilerplate_lines  # noqa: E402
from textnorm import ragged_table_issues  # noqa: E402

V5_DOC_ID = "c1521f01-bcbf-4163-923d-dc501859dc31"
BASE_VERSION = 5
VERSION = 6
EMBED_CAP = 10  # this run should need 0 or 1 new embedding call

# Human-verified correction (R2.12 fidelity review, log.md 2026-10-21): the real,
# printed title of p25's income-statement table, read off the source page image.
P25_PAGE_NO = 25
P25_RESTORED_TITLE = "XYZ Shoe company Income Statement (₹ (in lakhs))"


def restore_p25_title(markdown: str) -> str:
    """`"title": null` -> the human-verified title, on p25's own (first, top-level)
    placewise-diagram block only. Returns markdown unchanged if the block no longer
    looks like the one this patch targets (so a surprise is an abort, not a silent
    no-op)."""
    from diagram_schema import FENCE_INFO, extract_blocks
    blocks = [b for b in extract_blocks(markdown) if b["fence"] == FENCE_INFO]
    if not blocks or not isinstance(blocks[0]["obj"], dict) or blocks[0]["obj"].get("title") is not None \
            or blocks[0]["obj"].get("type") != "table":
        raise RuntimeError("p25 block shape changed since this patch was written; aborting rather than guessing")
    b = blocks[0]
    obj = dict(b["obj"])
    obj["title"] = P25_RESTORED_TITLE
    new_block = f"```{FENCE_INFO}\n" + json.dumps(obj, ensure_ascii=False) + "\n```"
    return markdown[:b["start"]] + new_block + markdown[b["end"]:]


def carry_page_v6(row: dict, boilerplate: set):
    """One v5 row -> (v6 page dict, info). Reasons merged, never dropped. Markdown is
    untouched except on p25 (restore_p25_title)."""
    n, tl = row["page_no"], row.get("text_layer") or ""
    md_old = row.get("markdown") or ""
    md = restore_p25_title(md_old) if n == P25_PAGE_NO else md_old
    fid = check_page(tl, md, bool(row.get("is_scanned")), n, label_lines=None,
                     boilerplate=boilerplate, is_visual=bool(row.get("is_visual")))
    old_reasons = list(row.get("review_reasons") or [])
    new_reasons = list(old_reasons)
    added = []
    if ragged_table_issues(md) and "ragged_table" not in new_reasons:
        new_reasons.append("ragged_table")
        added.append("ragged_table")
    if n == P25_PAGE_NO and md != md_old:
        added.append("p25_title_restored")
    page = {k: row.get(k) for k in ("page_no", "is_text", "is_table", "is_visual", "is_scanned", "text_layer",
                                    "docling_markdown", "method", "prompt_version")}
    page.update({f: fid.get(f) for f in ("number_coverage", "word_coverage", "unreadable_count")})
    page.update(markdown=md, review_reasons=new_reasons, needs_review=bool(new_reasons))
    info = {"page_no": n, "changed": md != md_old, "added": added,
            "needs_review_v5": bool(old_reasons), "needs_review_v6": bool(new_reasons)}
    return page, info


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="R6-prep: carry v5 + ragged_table flag + p25 title patch into v6")
    ap.add_argument("--pdf", default=str(DEFAULT_PDF))
    ap.add_argument("--embed-cap", type=int, default=EMBED_CAP)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--resume", action="store_true")
    args = ap.parse_args(argv)

    from pipeline import chunkable_pages, get_sb, version_status, write_version
    sb = get_sb()
    pdf_path = Path(args.pdf)
    source_file = pdf_path.name

    v5_doc, v5_rows = load_doc_pages(sb, source_file, BASE_VERSION)
    if v5_doc["id"] != V5_DOC_ID:
        print(f"ABORT: v5 doc id {v5_doc['id']} is not the expected {V5_DOC_ID}")
        return 1
    if v5_doc.get("status") != "done":
        print(f"ABORT: v5 status {v5_doc.get('status')!r}")
        return 1
    sha = sha256_file(pdf_path)
    if v5_doc.get("sha256") != sha:
        print("ABORT: sha256 mismatch with v5")
        return 1
    status = version_status(source_file, VERSION, sb)
    if status == "done":
        print(f"already done: {source_file} v{VERSION}")
        return 0
    if status is not None:
        print(f"ABORT: v{VERSION} exists with status {status!r} (no deletes)")
        return 1

    v1_docs = (sb.table("ingest_documents").select("id, sha256").eq("source_file", source_file)
              .eq("ingestion_version", 1).limit(1).execute().data)
    if not v1_docs:
        print("ABORT: no v1 document (needed for image_paths/reuse_file_id)")
        return 1
    v1_doc_id = v1_docs[0]["id"]
    v1_pages = (sb.table("ingest_pages").select("page_no, image_path").eq("document_id", v1_doc_id)
               .order("page_no").execute().data)
    image_paths = {p["page_no"]: p["image_path"] for p in v1_pages}
    if set(image_paths) != {r["page_no"] for r in v5_rows}:
        print("ABORT: v1/v5 page sets differ")
        return 1

    bp = boilerplate_lines([r.get("text_layer") or "" for r in v5_rows])
    pages, infos = [], []
    for row in v5_rows:
        page, info = carry_page_v6(row, bp)
        pages.append(page)
        infos.append(info)
    reused_from = {r["page_no"]: r["id"] for r in v5_rows}

    changed = [i["page_no"] for i in infos if i["changed"]]
    added = Counter(a for i in infos for a in i["added"] if a != "p25_title_restored")
    nr5 = sum(1 for r in v5_rows if r.get("needs_review"))
    nr6 = sum(1 for p in pages if p["needs_review"])
    dropped = [p["page_no"] for p, row in zip(pages, v5_rows)
               if any(r not in p["review_reasons"] for r in (row.get("review_reasons") or []))]
    ragged_pages = sorted(i["page_no"] for i in infos if "ragged_table" in i["added"])
    print(f"pages {len(pages)}; markdown changed on {len(changed)} ({changed})")
    print(f"new ragged_table flags: {len(ragged_pages)} pages {ragged_pages}")
    print(f"needs_review v5 {nr5} -> v6 {nr6}")
    if dropped:
        print(f"ABORT: a reason was dropped on {dropped}")
        return 1

    chunks = chunk_document(chunkable_pages(pages))
    old_chunks = (sb.table("ingest_chunks").select("content, embedding, page_start, page_end, section_title, "
                                                    "parent_item_id, has_diagram")
                 .eq("document_id", v5_doc["id"]).eq("ingestion_version", BASE_VERSION).execute().data)
    old_by_text = {text_key(c["content"]): c["embedding"] for c in old_chunks}
    print(f"chunks {len(chunks)} (v5 had {len(old_chunks)})")

    embed_path = OUT_DIR / f"r1_embeddings_v{VERSION}.json"
    if embed_path.exists() and not args.resume and not args.dry_run:
        print(f"ABORT: {embed_path.name} exists; pass --resume")
        return 1
    cache = load_embed_cache(embed_path)
    need = [c for c in chunks if text_key(embedding_text(c["content"])) not in cache.get("vectors", {})
            and text_key(c["content"]) not in old_by_text]
    print(f"new embedding calls needed: {len(need)} ~ ${embed_cost(len(need)):.4f} (cap {args.embed_cap})")
    if len(need) > args.embed_cap:
        print("STOP: embedding cap would be exceeded. Nothing written.")
        return 2
    if args.dry_run:
        print("DRY RUN: 0 Gemini calls, 0 DB writes.")
        return 0

    from gemini_client import call_count, embed_text
    embeddings, base = [], call_count["embedding"]
    try:
        for c in chunks:
            reused = old_by_text.get(text_key(c["content"]))
            if reused is not None:
                embeddings.append(reused)
                continue
            key = text_key(embedding_text(c["content"]))
            vec = cache["vectors"].get(key)
            if vec is None:
                vec = embed_text(embedding_text(c["content"]))
                cache["vectors"][key] = vec
                cache["calls_total"] = cache.get("calls_total", 0) + (call_count["embedding"] - base)
                base = call_count["embedding"]
            if len(vec) != EMBEDDING_DIM:
                save_embed_cache(embed_path, cache)
                print(f"ABORT: embedding with {len(vec)} dims. Nothing written.")
                return 1
            embeddings.append(vec)
    except Exception as e:  # noqa: BLE001
        save_embed_cache(embed_path, cache)
        print(f"STOP: embedding failed ({type(e).__name__}). Nothing written. Resume with --resume")
        return 2
    save_embed_cache(embed_path, cache)

    if version_status(source_file, VERSION, sb) is not None:
        print("ABORT: version appeared while running")
        return 1
    meta = {k: v5_doc.get(k) for k in ("school", "club", "year", "source_class")}
    notes = (f"R6-prep: v5 carried + ragged_table flag ({len(ragged_pages)} pages) + p25 title "
             f"restored (human-verified); 0 vision calls")
    w = write_version(meta, source_file, sha, len(pages), pages, chunks, VERSION,
                      v5_doc.get("prompt_version"), notes, reuse_file_id=v1_doc_id, embeddings=embeddings,
                      image_paths=image_paths, reused_from=reused_from, sb=sb)
    print(f"WROTE v{VERSION}: doc {w['file_id']}, {len(w['page_rows'])} pages, {len(w['chunk_rows'])} chunks")

    out = {
        "file_id": w["file_id"], "version": VERSION, "base_version": BASE_VERSION, "base_doc_id": V5_DOC_ID,
        "notes": notes, "changed_pages": changed, "ragged_table_pages": ragged_pages,
        "needs_review": {"base": nr5, "new": nr6}, "pages": infos,
        "final_vision_calls": 0, "final_embedding_calls": cache.get("calls_total", 0),
        "est_cost_usd": round(embed_cost(cache.get("calls_total", 0)), 4),
    }
    (OUT_DIR / f"r2_v{VERSION}_output.json").write_text(json.dumps(out, indent=2, default=str, ensure_ascii=False))
    print(f"TOTAL CALLS: vision=0 embedding={out['final_embedding_calls']} ~ ${out['est_cost_usd']:.4f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

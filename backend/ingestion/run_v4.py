"""R2.06: build v4 = v3 + the free R2.04/R2.05 fixes (hardened after code review) + every
R1/R2 flag, as a new ingestion_version. Insert-only, all chunks is_active = false.

No vision calls: each v3 page's stored markdown goes through postprocess_markdown again and is
re-checked with check_page, using the page's CACHED label_lines (re-running postprocess on
already-collapsed markdown returns none). Reasons are merged, never recomputed:

    v4 reasons = v3 reasons ∪ check_page(v4 markdown).reasons

The only reason that may be dropped is `diagram_in_table`, and only on a page that
out/r2_fixcheck.json → in_table proves a false positive AND the new check no longer raises.
`visual_no_block` is added to unflagged visual pages with 0 valid blocks only when the R2.03
visual triage found k >= 1 missing diagrams.

Embeddings: only chunk texts not already in the cache (seeded from out/r1_embeddings_v3.json).
Nothing is written to the DB until every embedding has succeeded. v1/v2/v3 rows and
document_chunks are never read for writing.

    venv/bin/python run_v4.py --dry-run          # 0 Gemini calls, 0 writes
    venv/bin/python run_v4.py                    # embed + write v4
    venv/bin/python run_v4.py --resume           # after a stopped embedding run

Exit codes: 0 done (or already done), 1 abort, 2 stopped cleanly before the DB write.

NOTE (R2.09): postprocess_markdown and check_page have since gained the R2.09 steps
(invented-text strip, anchored prose repair, seq_diff / invented_text / framework_as_text).
Re-running this script no longer reproduces the stored v4; v4 in the DB is the record.
"""
import argparse
import json
import re
import sys
from pathlib import Path

INGESTION_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(INGESTION_DIR))

from chunk import chunk_document, embedding_text  # noqa: E402
from config import EMBEDDING_DIM  # noqa: E402
from fidelity import check_page  # noqa: E402
from postprocess import postprocess_markdown  # noqa: E402
from run_patch import load_v2_label_lines  # noqa: E402
from run_repilot import (DEFAULT_PDF, OUT_DIR, embed_cost, load_embed_cache, load_v1,  # noqa: E402
                         save_embed_cache, sha256_file, text_key)

V1_DOC_PREFIX = "67371722"
V3_DOC_ID = "129a2604-0221-4ba2-af50-42ac641a21a0"
EMBED_CAP = 250
DRIFT_MAX = 10
IN_TABLE_REASON = "diagram_in_table"
VISUAL_NO_BLOCK = "visual_no_block"
PAGE_COLS = ("id, page_no, is_text, is_table, is_visual, is_scanned, text_layer, markdown, docling_markdown, "
             "method, prompt_version, needs_review, review_reasons")
FID_FIELDS = ("number_coverage", "word_coverage", "unreadable_count", "diagram_count", "diagrams",
              "diagram_issues", "diagram_label_coverage")


# ---------------------------------------------------------------- pure

def triage_k(rate) -> int:
    """'0/10 missing' -> 0. Unparseable -> raise (never guess)."""
    m = re.match(r"\s*(\d+)\s*/\s*\d+", str(rate or ""))
    if not m:
        raise ValueError(f"cannot read visual_triage_rate {rate!r}")
    return int(m.group(1))


def proven_in_table_fps(fixcheck: dict) -> set:
    """Pages plan 04 proved to be block_in_table false positives (never a hand-typed list)."""
    return {int(n) for n, cls in (fixcheck.get("in_table") or {}).items() if cls == "false_positive_fixed"}


def merge_reasons(v3_reasons, new_reasons, page_no, proven_fps: set):
    """v3 reasons (order kept) ∪ new reasons. `diagram_in_table` is dropped only on a proven
    false-positive page where the new check no longer raises it. Returns (reasons, added, dropped)."""
    v3_reasons, new_reasons = list(v3_reasons or []), list(new_reasons or [])
    out = list(v3_reasons)
    for r in new_reasons:
        if r not in out:
            out.append(r)
    dropped = []
    if page_no in proven_fps and IN_TABLE_REASON in out and IN_TABLE_REASON not in new_reasons:
        out.remove(IN_TABLE_REASON)
        dropped.append(IN_TABLE_REASON)
    added = [r for r in out if r not in v3_reasons]
    return out, added, dropped


def apply_visual_no_block(reasons: list, is_visual: bool, valid_blocks: int, k: int) -> list:
    """visual_no_block only when the triage found k >= 1 and the page is visual, has 0 valid
    blocks and no other flag."""
    if k >= 1 and is_visual and valid_blocks == 0 and not reasons:
        return [VISUAL_NO_BLOCK]
    return list(reasons)


def label_lines_for(row: dict, v3_ll: dict, v2_ll: dict, v1_ll: dict) -> dict:
    """The label_lines that belong to the markdown v3 stored for this page: the v3 conversion
    for a page v3 re-converted and kept, the v2 conversion for a carried_v2 page, and the
    v1 post-pass for a fallback_v1 page."""
    n, method = row["page_no"], row.get("method")
    if method == "fallback_v1":
        return v1_ll.get(n) or {}
    if method == "carried_v2":
        return v2_ll.get(n) or {}
    return v3_ll.get(n) if n in v3_ll else (v2_ll.get(n) or {})


def carry_page(row: dict, label_lines: dict, proven_fps: set, k: int):
    """One v3 row -> (v4 page dict, info). Pure."""
    n, tl = row["page_no"], row.get("text_layer") or ""
    md_old = row.get("markdown") or ""
    md = postprocess_markdown(md_old, tl)[0]
    fid = check_page(tl, md, bool(row.get("is_scanned")), n, label_lines=label_lines)
    reasons, added, dropped = merge_reasons(row.get("review_reasons"), fid["review_reasons"], n, proven_fps)
    reasons = apply_visual_no_block(reasons, bool(row.get("is_visual")), len(fid.get("diagrams") or []), k)
    if VISUAL_NO_BLOCK in reasons and VISUAL_NO_BLOCK not in added:
        added.append(VISUAL_NO_BLOCK)
    page = {k_: row.get(k_) for k_ in ("page_no", "is_text", "is_table", "is_visual", "is_scanned", "text_layer",
                                         "docling_markdown", "method", "prompt_version")}
    page.update({f: fid.get(f) for f in FID_FIELDS})
    page.update(markdown=md, review_reasons=reasons, needs_review=bool(reasons))
    v3_auto_new = [r for r in fid["review_reasons"] if r not in (row.get("review_reasons") or [])]
    info = {"page_no": n, "changed": md != md_old, "added": added, "dropped": dropped,
            "new_auto_reasons": v3_auto_new,
            "needs_review_v3": bool(row.get("needs_review")), "needs_review_v4": bool(reasons)}
    return page, info


def new_embed_texts(chunks: list, cache: dict) -> int:
    return len({text_key(embedding_text(c["content"])) for c in chunks} - set(cache.get("vectors", {})))


def drift_pages(infos: list) -> list:
    """Pages whose markdown did NOT change but gain a new automatic reason (checker drift)."""
    return [i["page_no"] for i in infos if not i["changed"] and i["new_auto_reasons"]]


# ---------------------------------------------------------------- main

def load_doc_pages(sb, source_file: str, version: int):
    docs = (sb.table("ingest_documents").select("*").eq("source_file", source_file)
            .eq("ingestion_version", version).limit(1).execute().data)
    if not docs:
        raise RuntimeError(f"no v{version} document")
    rows, start = [], 0
    while True:
        r = (sb.table("ingest_pages").select(PAGE_COLS).eq("document_id", docs[0]["id"])
             .order("page_no").range(start, start + 99).execute().data)
        rows += r
        if len(r) < 100:
            break
        start += 100
    return docs[0], rows


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="R2.06: carry v3 + free fixes + all flags into v4 (insert-only)")
    ap.add_argument("--pdf", default=str(DEFAULT_PDF))
    ap.add_argument("--base-version", type=int, default=3)
    ap.add_argument("--version", type=int, default=4)
    ap.add_argument("--embed-cap", type=int, default=EMBED_CAP)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--resume", action="store_true")
    args = ap.parse_args(argv)
    if args.version <= args.base_version:
        print("ABORT: --version must be above --base-version")
        return 1

    from pipeline import chunkable_pages, get_sb, version_status, write_version
    sb = get_sb()
    pdf_path = Path(args.pdf)
    source_file = pdf_path.name

    v1_doc, v1_pages, v1_src = load_v1(sb, source_file)
    if v1_src != "db":
        print("ABORT: needs v1 pages from the DB")
        return 1
    v3_doc, v3_rows = load_doc_pages(sb, source_file, args.base_version)
    print(f"v1 doc {v1_doc['id']} ({len(v1_pages)} pages); v{args.base_version} doc {v3_doc['id']} ({len(v3_rows)} pages)")
    if args.base_version == 3 and v3_doc["id"] != V3_DOC_ID:
        print(f"ABORT: v3 doc id {v3_doc['id']} is not the expected {V3_DOC_ID}")
        return 1
    sha = sha256_file(pdf_path)
    if v1_doc.get("sha256") != sha or v3_doc.get("sha256") != sha:
        print("ABORT: sha256 mismatch with v1/v3")
        return 1
    if not (len(v1_pages) == len(v3_rows) == v3_doc.get("page_count")):
        print(f"ABORT: page counts differ (v1 {len(v1_pages)}, v3 rows {len(v3_rows)}, v3 doc {v3_doc.get('page_count')})")
        return 1
    for d in (v1_doc, v3_doc):
        if d.get("source_class") != "club_casebook":
            print(f"ABORT: source_class {d.get('source_class')!r}")
            return 1
    if v3_doc.get("status") != "done":
        print(f"ABORT: v{args.base_version} status {v3_doc.get('status')!r}")
        return 1
    status = version_status(source_file, args.version, sb)
    if status == "done":
        print(f"already done: {source_file} v{args.version}")
        return 0
    if status is not None:
        print(f"ABORT: v{args.version} exists with status {status!r} (no deletes)")
        return 1
    image_paths = {p["page_no"]: p["image_path"] for p in v1_pages}
    bad_img = [n for n, pth in image_paths.items() if not (pth or "").startswith(f"pages/{V1_DOC_PREFIX}")]
    if bad_img or set(image_paths) != {r["page_no"] for r in v3_rows}:
        print(f"ABORT: v1 image paths missing/unexpected for pages {bad_img[:10]}")
        return 1

    # Inputs: plan-04 in-table proof, R2.03 visual triage, cached label_lines.
    fixcheck = json.loads((OUT_DIR / "r2_fixcheck.json").read_text())
    if fixcheck.get("document_id") != v3_doc["id"]:
        print("ABORT: out/r2_fixcheck.json is not for the base version")
        return 1
    proven_fps = proven_in_table_fps(fixcheck)
    k = triage_k(json.loads((OUT_DIR / "r2_sweep_b.json").read_text()).get("visual_triage_rate"))
    v3_ll = load_v2_label_lines(OUT_DIR / "r1_pages_v3.jsonl")
    v2_ll = load_v2_label_lines(OUT_DIR / "r1_pages_v2.jsonl")
    v1_by_no = {p["page_no"]: p for p in v1_pages}
    v1_ll = {r["page_no"]: postprocess_markdown(v1_by_no[r["page_no"]].get("markdown") or "",
                                                v1_by_no[r["page_no"]].get("text_layer") or "")[1]
             for r in v3_rows if r.get("method") == "fallback_v1"}
    print(f"proven in-table false positives: {sorted(proven_fps)}; visual triage k = {k}"
          f"{' (none found: visual_no_block not added)' if k == 0 else ''}")

    pages, infos = [], []
    for row in v3_rows:
        page, info = carry_page(row, label_lines_for(row, v3_ll, v2_ll, v1_ll), proven_fps, k)
        pages.append(page)
        infos.append(info)
    reused_from = {r["page_no"]: r["id"] for r in v3_rows}

    changed = [i["page_no"] for i in infos if i["changed"]]
    nr3 = sum(1 for r in v3_rows if r.get("needs_review"))
    nr4 = sum(1 for p in pages if p["needs_review"])
    print(f"\npages {len(pages)}; markdown changed on {len(changed)}: {changed}")
    for i in infos:
        if i["added"] or i["dropped"] or i["needs_review_v3"] != i["needs_review_v4"]:
            print(f"  p{i['page_no']:<4} added={i['added']} dropped={i['dropped']} "
                  f"needs_review {i['needs_review_v3']} -> {i['needs_review_v4']}")
    print(f"needs_review v{args.base_version} {nr3} -> v{args.version} {nr4}")
    drift = drift_pages(infos)
    print(f"unchanged pages gaining a new automatic reason: {len(drift)} {drift}")
    if len(drift) > DRIFT_MAX:
        print(f"STOP: checker drift on {len(drift)} unchanged pages (> {DRIFT_MAX}); investigate before any write")
        return 1

    chunks = chunk_document(chunkable_pages(pages))
    embed_path = OUT_DIR / f"r1_embeddings_v{args.version}.json"
    if embed_path.exists() and not args.resume and not args.dry_run:
        print(f"ABORT: {embed_path.name} exists; pass --resume")
        return 1
    cache = load_embed_cache(embed_path)
    if not cache.get("vectors"):
        seed = load_embed_cache(OUT_DIR / f"r1_embeddings_v{args.base_version}.json")
        cache = {"calls_total": 0, "vectors": dict(seed.get("vectors", {})),
                 f"seeded_from_v{args.base_version}": len(seed.get("vectors", {}))}
    need = new_embed_texts(chunks, cache)
    print(f"chunks {len(chunks)}; new embedding calls {need} ≈ ${embed_cost(need):.4f} (cap {args.embed_cap})")
    if need + cache.get("calls_total", 0) > args.embed_cap:
        print("STOP: embedding cap would be exceeded. Nothing written.")
        return 2
    if args.dry_run:
        print("DRY RUN: 0 Gemini calls, 0 DB writes.")
        return 0

    from gemini_client import call_count, embed_text
    embeddings, base = [], call_count["embedding"]
    try:
        for c in chunks:
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

    if version_status(source_file, args.version, sb) is not None:
        print("ABORT: version appeared while running")
        return 1
    meta = {k_: v3_doc.get(k_) for k_ in ("school", "club", "year", "source_class")}
    notes = (f"R2.06: v{args.base_version} carried + free fixes (review-hardened) on {len(changed)} pages; "
             f"all flags merged; 0 vision calls")
    w = write_version(meta, source_file, sha, len(pages), pages, chunks, args.version,
                      v3_doc.get("prompt_version"), notes, reuse_file_id=v1_doc["id"], embeddings=embeddings,
                      image_paths=image_paths, reused_from=reused_from, sb=sb)
    print(f"WROTE v{args.version}: doc {w['file_id']}, {len(w['page_rows'])} pages, {len(w['chunk_rows'])} chunks")

    out = {
        "file_id": w["file_id"], "version": args.version, "base_version": args.base_version, "notes": notes,
        "changed_pages": changed, "pages": infos, "needs_review": {"base": nr3, "new": nr4},
        "proven_in_table_fps": sorted(proven_fps), "visual_triage_k": k,
        "retried_pages": [], "final_vision_calls": 0, "final_embedding_calls": cache.get("calls_total", 0),
        "est_cost_usd": round(embed_cost(cache.get("calls_total", 0)), 4),
    }
    (OUT_DIR / f"r2_v{args.version}_output.json").write_text(json.dumps(out, indent=2, default=str))
    print(f"TOTAL CALLS: vision=0 embedding={out['final_embedding_calls']} ≈ ${out['est_cost_usd']:.4f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

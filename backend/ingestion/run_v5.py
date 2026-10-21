"""R2.10: build v5 = v4 + the plan-09 free fixes and flags (review round 2 included), as a new
ingestion_version. Insert-only, all chunks is_active = false. 0 vision calls.

Each v4 page's stored markdown goes through the current postprocess_markdown (invented-text
strip, anchored prose repair; boilerplate computed once from all text layers) and is re-checked
with check_page (seq_diff, invented_text, framework_as_text), using the page's cached
label_lines (run_v4.label_lines_for). Reasons are merged, never dropped:

    v5 reasons = v4 reasons ∪ check_page(v5 markdown).reasons ∪ structure_unreviewed

Human `fidelity_review:*` flags stay even where a repair has now fixed the page; a human clears
them in R5. Embeddings only for chunk texts not in the cache (seeded from r1_embeddings_v4.json).
Nothing is written until every embedding has succeeded. v1-v4 rows and document_chunks are
never written.

    venv/bin/python run_v5.py --dry-run          # 0 Gemini calls, 0 writes
    venv/bin/python run_v5.py                    # embed + write v5
    venv/bin/python run_v5.py --resume           # after a stopped embedding run

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
from r2_gapcheck import PASS_FILES, reviewed_pass_set, structure_unreviewed  # noqa: E402
from run_patch import load_v2_label_lines  # noqa: E402
from run_repilot import (DEFAULT_PDF, OUT_DIR, embed_cost, load_embed_cache, load_v1,  # noqa: E402
                         save_embed_cache, sha256_file, text_key)
from run_v4 import FID_FIELDS, V1_DOC_PREFIX, label_lines_for, load_doc_pages, merge_reasons, new_embed_texts  # noqa: E402
from seqdiff import boilerplate_lines  # noqa: E402

V4_DOC_ID = "d1510e35-9ecc-419b-a497-85a37e062792"
BASE_VERSION = 4
VERSION = 5
EMBED_CAP = 400
DRIFT_MAX = 10
NEW_CODES = ("seq_diff", "invented_text", "framework_as_text", "structure_unreviewed")
STRUCTURE_UNREVIEWED = "structure_unreviewed"
CHECK_PAGES = (135, 137, 143, 150, 183, 231)


# ---------------------------------------------------------------- pure

def carry_page_v5(row: dict, label_lines: dict, boilerplate: set):
    """One v4 row -> (v5 page dict, info). Reasons merged (never dropped); structure_unreviewed
    is added by the caller (it needs the whole document)."""
    n, tl = row["page_no"], row.get("text_layer") or ""
    md_old = row.get("markdown") or ""
    seq_log, inv_log, typo_log, hash_log = [], [], [], []
    md = postprocess_markdown(md_old, tl, typo_log=typo_log, hash_log=hash_log, seq_log=seq_log,
                              invented_log=inv_log, boilerplate=boilerplate)[0]
    fid = check_page(tl, md, bool(row.get("is_scanned")), n, label_lines=label_lines,
                     boilerplate=boilerplate, is_visual=bool(row.get("is_visual")))
    reasons, added, _dropped = merge_reasons(row.get("review_reasons"), fid["review_reasons"], n, set())
    page = {k: row.get(k) for k in ("page_no", "is_text", "is_table", "is_visual", "is_scanned", "text_layer",
                                    "docling_markdown", "method", "prompt_version")}
    page.update({f: fid.get(f) for f in FID_FIELDS})
    page.update(markdown=md, review_reasons=reasons, needs_review=bool(reasons))
    info = {"page_no": n, "changed": md != md_old, "repairs": seq_log, "strips": [list(s) for s in inv_log],
            "typos": typo_log, "hash": hash_log, "added": added,
            "needs_review_v4": bool(row.get("needs_review")), "needs_review_v5": bool(reasons)}
    return page, info


def add_structure_unreviewed(pages: list, infos: list, reviewed_pass: set) -> list:
    """Adds structure_unreviewed to the pages structure_unreviewed() returns. Returns them."""
    su = set(structure_unreviewed(pages, reviewed_pass))
    for p, i in zip(pages, infos):
        if p["page_no"] in su and STRUCTURE_UNREVIEWED not in p["review_reasons"]:
            p["review_reasons"] = list(p["review_reasons"]) + [STRUCTURE_UNREVIEWED]
            p["needs_review"] = True
            i["added"].append(STRUCTURE_UNREVIEWED)
            i["needs_review_v5"] = True
    return sorted(su)


def drift_pages(infos: list, v4_codes: set) -> list:
    """Unchanged pages that gained a reason code that already existed in v4 (new codes excluded)."""
    return [i["page_no"] for i in infos if not i["changed"]
            and any(r in v4_codes and r not in NEW_CODES for r in i["added"])]


def gapcheck_ok(gc: dict, doc_id: str) -> str:
    """'' if r2_gapcheck.json is for this doc and every gate passes, else the reason."""
    if not gc:
        return "out/r2_gapcheck.json missing"
    if gc.get("document_id") != doc_id:
        return "out/r2_gapcheck.json is not for the base version"
    bad = [g for g, v in (gc.get("gates") or {}).items() if not v.get("ok")]
    if bad or not gc.get("gates"):
        return f"r2_gapcheck gates failing: {bad or 'none recorded'}"
    return ""


# ---------------------------------------------------------------- main

def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="R2.10: carry v4 + plan-09 fixes and flags into v5 (insert-only)")
    ap.add_argument("--pdf", default=str(DEFAULT_PDF))
    ap.add_argument("--embed-cap", type=int, default=EMBED_CAP)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--resume", action="store_true")
    args = ap.parse_args(argv)

    from pipeline import chunkable_pages, get_sb, version_status, write_version
    sb = get_sb()
    pdf_path = Path(args.pdf)
    source_file = pdf_path.name

    gc_path = OUT_DIR / "r2_gapcheck.json"
    gc = json.loads(gc_path.read_text()) if gc_path.exists() else None
    why = gapcheck_ok(gc, V4_DOC_ID)
    if why:
        print(f"ABORT: {why}")
        return 1

    v1_doc, v1_pages, v1_src = load_v1(sb, source_file)
    if v1_src != "db":
        print("ABORT: needs v1 pages from the DB")
        return 1
    v4_doc, v4_rows = load_doc_pages(sb, source_file, BASE_VERSION)
    print(f"v1 doc {v1_doc['id']} ({len(v1_pages)} pages); v4 doc {v4_doc['id']} ({len(v4_rows)} pages)")
    if v4_doc["id"] != V4_DOC_ID:
        print(f"ABORT: v4 doc id {v4_doc['id']} is not the expected {V4_DOC_ID}")
        return 1
    sha = sha256_file(pdf_path)
    if v1_doc.get("sha256") != sha or v4_doc.get("sha256") != sha:
        print("ABORT: sha256 mismatch with v1/v4")
        return 1
    if not (len(v1_pages) == len(v4_rows) == v4_doc.get("page_count")):
        print(f"ABORT: page counts differ (v1 {len(v1_pages)}, v4 rows {len(v4_rows)}, v4 doc {v4_doc.get('page_count')})")
        return 1
    for d in (v1_doc, v4_doc):
        if d.get("source_class") != "club_casebook":
            print(f"ABORT: source_class {d.get('source_class')!r}")
            return 1
    if v4_doc.get("status") != "done":
        print(f"ABORT: v4 status {v4_doc.get('status')!r}")
        return 1
    status = version_status(source_file, VERSION, sb)
    if status == "done":
        print(f"already done: {source_file} v{VERSION}")
        return 0
    if status is not None:
        print(f"ABORT: v{VERSION} exists with status {status!r} (no deletes)")
        return 1
    image_paths = {p["page_no"]: p["image_path"] for p in v1_pages}
    bad_img = [n for n, pth in image_paths.items() if not (pth or "").startswith(f"pages/{V1_DOC_PREFIX}")]
    if bad_img or set(image_paths) != {r["page_no"] for r in v4_rows}:
        print(f"ABORT: v1 image paths missing/unexpected for pages {bad_img[:10]}")
        return 1

    v3_ll = load_v2_label_lines(OUT_DIR / "r1_pages_v3.jsonl")
    v2_ll = load_v2_label_lines(OUT_DIR / "r1_pages_v2.jsonl")
    v1_by_no = {p["page_no"]: p for p in v1_pages}
    v1_ll = {r["page_no"]: postprocess_markdown(v1_by_no[r["page_no"]].get("markdown") or "",
                                                v1_by_no[r["page_no"]].get("text_layer") or "")[1]
             for r in v4_rows if r.get("method") == "fallback_v1"}
    bp = boilerplate_lines([r.get("text_layer") or "" for r in v4_rows])
    reviews = {f: json.loads((OUT_DIR / f).read_text()) for f in PASS_FILES}
    reviewed_pass = reviewed_pass_set(reviews.values(), json.loads((OUT_DIR / "r2_sample_review.json").read_text()))
    print(f"boilerplate lines {len(bp)}; reviewed-pass pages {len(reviewed_pass)}")

    pages, infos = [], []
    for row in v4_rows:
        page, info = carry_page_v5(row, label_lines_for(row, v3_ll, v2_ll, v1_ll), bp)
        pages.append(page)
        infos.append(info)
    su = add_structure_unreviewed(pages, infos, reviewed_pass)
    reused_from = {r["page_no"]: r["id"] for r in v4_rows}

    # Must match the plan-09 dry run exactly.
    gcp = gc.get("pages") or {}
    mism = []
    for n in CHECK_PAGES:
        i = next(x for x in infos if x["page_no"] == n)
        rec = gcp.get(str(n)) or {}
        if [list(x) for x in i["repairs"]] != [list(x) for x in rec.get("repairs") or []] \
                or i["strips"] != (rec.get("strips") or []) \
                or sorted(next(p for p in pages if p["page_no"] == n)["review_reasons"]) != sorted(rec.get("reasons") or []):
            mism.append(n)
    if mism:
        print(f"ABORT: v5 differs from r2_gapcheck.json on pages {mism}")
        return 1

    # Idempotence: a second carry over the v5 markdown changes nothing.
    second = sum(1 for p in pages if postprocess_markdown(p["markdown"], p["text_layer"] or "",
                                                          boilerplate=bp)[0] != p["markdown"])

    changed = [i["page_no"] for i in infos if i["changed"]]
    reps = sum(len(i["repairs"]) for i in infos)
    strips = Counter(s[0] for i in infos for s in i["strips"])
    added = Counter(r for i in infos for r in i["added"])
    nr4 = sum(1 for r in v4_rows if r.get("needs_review"))
    nr5 = sum(1 for p in pages if p["needs_review"])
    v4_codes = {r for row in v4_rows for r in (row.get("review_reasons") or [])}
    drift = drift_pages(infos, v4_codes)
    dropped = [p["page_no"] for p, row in zip(pages, v4_rows)
               if any(r not in p["review_reasons"] for r in (row.get("review_reasons") or []))]
    print(f"\npages {len(pages)}; markdown changed on {len(changed)}")
    print(f"repairs {reps} on {sum(1 for i in infos if i['repairs'])} pages; strips by kind {dict(strips)}")
    print(f"reasons added by code {dict(added)}")
    print(f"structure_unreviewed pages {len(su)}")
    print(f"needs_review v4 {nr4} -> v5 {nr5} (r2_gapcheck projection {gc['counts']['needs_review']['projected_v5']})")
    print(f"reasons dropped on {len(dropped)} pages; second carry changes {second} pages")
    print(f"unchanged pages gaining an existing v4 reason code (drift): {len(drift)} {drift}")
    if dropped:
        print("ABORT: a reason was dropped")
        return 1
    if nr5 != gc["counts"]["needs_review"]["projected_v5"]:
        print("ABORT: needs_review differs from the r2_gapcheck projection")
        return 1
    if len(drift) > DRIFT_MAX:
        print(f"STOP: checker drift on {len(drift)} unchanged pages (> {DRIFT_MAX}); investigate before any write")
        return 1

    chunks = chunk_document(chunkable_pages(pages))
    embed_path = OUT_DIR / f"r1_embeddings_v{VERSION}.json"
    if embed_path.exists() and not args.resume and not args.dry_run:
        print(f"ABORT: {embed_path.name} exists; pass --resume")
        return 1
    cache = load_embed_cache(embed_path)
    if not cache.get("vectors"):
        seed = load_embed_cache(OUT_DIR / f"r1_embeddings_v{BASE_VERSION}.json")
        cache = {"calls_total": 0, "vectors": dict(seed.get("vectors", {})),
                 f"seeded_from_v{BASE_VERSION}": len(seed.get("vectors", {}))}
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

    if version_status(source_file, VERSION, sb) is not None:
        print("ABORT: version appeared while running")
        return 1
    meta = {k: v4_doc.get(k) for k in ("school", "club", "year", "source_class")}
    notes = (f"R2.10: v4 carried + R2.09 fixes (review round 2) on {len(changed)} pages; "
             f"all flags merged; 0 vision calls")
    w = write_version(meta, source_file, sha, len(pages), pages, chunks, VERSION,
                      v4_doc.get("prompt_version"), notes, reuse_file_id=v1_doc["id"], embeddings=embeddings,
                      image_paths=image_paths, reused_from=reused_from, sb=sb)
    print(f"WROTE v{VERSION}: doc {w['file_id']}, {len(w['page_rows'])} pages, {len(w['chunk_rows'])} chunks")

    out = {
        "file_id": w["file_id"], "version": VERSION, "base_version": BASE_VERSION, "base_doc_id": V4_DOC_ID,
        "notes": notes, "changed_pages": changed, "pages": infos,
        "needs_review": {"base": nr4, "new": nr5}, "repairs": reps, "strips_by_kind": dict(strips),
        "reasons_added": dict(added), "structure_unreviewed": su, "drift": drift,
        "final_vision_calls": 0, "final_embedding_calls": cache.get("calls_total", 0),
        "est_cost_usd": round(embed_cost(cache.get("calls_total", 0)), 4),
    }
    (OUT_DIR / f"r2_v{VERSION}_output.json").write_text(json.dumps(out, indent=2, default=str, ensure_ascii=False))
    print(f"TOTAL CALLS: vision=0 embedding={out['final_embedding_calls']} ≈ ${out['est_cost_usd']:.4f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

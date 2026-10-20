"""R1.09: patch the affected pages of one casebook as a new ingestion_version (default 3).

Re-converts ONLY the pages the review / re-score found broken, with the current vision
prompt (config.PROMPT_VERSION). Every other page is carried over from the base version
(v2) with the free post-pass applied (tree-leaf repair, label collapse, curly quotes,
invented links) and re-checked. Per page, falls back to v1 markdown when the new output
captures fewer of the page's numbers or words than v1 did.

Insert-only: no v1 or v2 row is updated or deleted. Nothing is written to the DB until
every page and every embedding has succeeded.

    venv/bin/python run_patch.py --base-version 2 --version 3 --cap 134 --dry-run
    venv/bin/python run_patch.py --base-version 2 --version 3 --cap 134 --accept-failed
    venv/bin/python run_patch.py --base-version 2 --version 3 --cap 134 --accept-failed --resume

Exit codes: 0 done (or already done), 1 abort, 2 stopped cleanly before the DB write.
"""
import argparse
import json
import math
import sys
from pathlib import Path

INGESTION_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(INGESTION_DIR))

from chunk import chunk_document, embedding_text  # noqa: E402
from config import EMBEDDING_DIM, PROMPT_VERSION, RENDER_DPI, VISION_MAX_CALLS_PER_PAGE  # noqa: E402
from fidelity import check_page  # noqa: E402
from postprocess import postprocess_markdown  # noqa: E402
from run_repilot import (DEFAULT_PDF, FAILED_PREFIX, OUT_DIR, VISION_FIELDS, append_jsonl,  # noqa: E402
                         embed_cost, load_embed_cache, load_v1, read_jsonl, save_embed_cache,
                         sha256_file, text_key, vision_cost)

EST_CALLS_PER_PAGE = 1.4
EMBED_CAP = 250
COV_TOL = 0.01

# Fixed page set (plan R1.09 Facts), in priority order.
REVIEW_FAILURES = [11, 13, 14, 19, 52]
SECTOR_PAGES = list(range(58, 80))
NO_BLOCK_VISUAL = [1, 8, 12, 30, 31, 43, 53, 75, 80, 81, 84]
NUMBERS_BELOW_V1 = [41, 56, 58, 65, 71, 74, 77, 79, 86, 93, 101, 103, 127, 129, 136, 137,
                    152, 175, 185, 198, 203, 227, 229, 236]

PAGE_COLS_V2 = ("id, page_no, is_text, is_table, is_visual, is_scanned, text_layer, markdown, "
                "docling_markdown, method, prompt_version, reused_from_page_id, image_path")


# ---------------------------------------------------------------- selection (pure)

def priority_groups(rescore: dict) -> list:
    """[(group, [page_no, ...])] in priority order, from the fixed set plus the
    plan-07 re-score (flagged_new + per-page coverage vs v1)."""
    flagged = rescore.get("flagged_new") or {}
    in_table = sorted(flagged.get("diagram_in_table") or [])
    num_below, word_below = [], []
    for p in rescore.get("pages") or []:
        v1, v2 = p.get("v1") or {}, p.get("v2_post") or {}
        if v1.get("nc") is None or v2.get("nc") is None:
            continue
        if v2["nc"] < v1["nc"] - 1e-9:
            num_below.append(p["page_no"])
        elif v2["wc"] < v1["wc"] - 1e-9:
            word_below.append(p["page_no"])
    return [
        ("review_failure", REVIEW_FAILURES),
        ("diagram_in_table", in_table),
        ("sector", SECTOR_PAGES),
        ("no_block", NO_BLOCK_VISUAL),
        ("numbers_below_v1", sorted(set(NUMBERS_BELOW_V1) | set(num_below))),
        ("diagram_structure", sorted(set(flagged.get("diagram_structure") or [])
                                     | set(flagged.get("diagram_missing_box") or []))),
        ("label_altered", sorted(flagged.get("diagram_label_altered") or [])),
        ("words_below_v1", sorted(word_below)),
    ]


def select_patch_pages(groups: list, cap: int, est_per_page: float = EST_CALLS_PER_PAGE):
    """Pure. Returns (selected, trimmed): selected = [(page_no, group)] in priority
    order, each page once (highest group wins), while ceil(n * est) <= cap;
    trimmed = [(page_no, group)] that did not fit."""
    seen, selected, trimmed = set(), [], []
    for group, pages in groups:
        for n in pages:
            if n in seen:
                continue
            seen.add(n)
            if math.ceil((len(selected) + 1) * est_per_page) <= cap:
                selected.append((n, group))
            else:
                trimmed.append((n, group))
    return selected, trimmed


def _cov(p):
    return (p.get("number_coverage") if p.get("number_coverage") is not None else 1.0,
            p.get("word_coverage") if p.get("word_coverage") is not None else 1.0)


def _below(p, ref, tol=COV_TOL):
    a, b = _cov(p), _cov(ref)
    return a[0] < b[0] - tol or a[1] < b[1] - tol


def choose_page(v1: dict, v2_post: dict, v3):
    """Pure. Returns (page_dict, method, source) where source is 'v3' | 'v2' | 'v1'.

    Re-converted page (v3 given): v3 unless its number or word coverage is below v1's by
    more than COV_TOL; then v2_post unless it is also below v1; else v1 (fallback_v1).
    Carried page (v3 None): v2_post, method carried_v2.
    A fallback_v1 page gets review reason `fallback_v1`; on a visual page it is also
    needs_review = true, because its diagram blocks are lost."""
    if v3 is None:
        return dict(v2_post, method="carried_v2"), "carried_v2", "v2"
    if not _below(v3, v1):
        return v3, v3.get("method") or "gemini_vision_v2", "v3"
    if not _below(v2_post, v1):
        return dict(v2_post, method="carried_v2"), "carried_v2", "v2"
    p = dict(v1, method="fallback_v1")
    reasons = list(p.get("review_reasons") or [])
    if "fallback_v1" not in reasons:
        reasons.append("fallback_v1")
    p["review_reasons"] = reasons
    if p.get("is_visual"):
        p["needs_review"] = True
    else:
        p["needs_review"] = bool(p.get("needs_review"))
    return p, "fallback_v1", "v1"


# ---------------------------------------------------------------- page builders

def _fid_fields(fid: dict) -> dict:
    return {k: fid[k] for k in ("number_coverage", "word_coverage", "unreadable_count", "needs_review",
                                "review_reasons", "diagram_count", "diagrams", "diagram_issues",
                                "diagram_label_coverage")}


def base_page(v1: dict) -> dict:
    return {"page_no": v1["page_no"], "is_text": v1.get("is_text"), "is_table": v1.get("is_table"),
            "is_visual": v1.get("is_visual"), "is_scanned": v1.get("is_scanned"),
            "text_layer": v1.get("text_layer"), "docling_markdown": v1.get("docling_markdown")}


def v1_page(v1: dict) -> dict:
    """v1 markdown + the free post-pass (R2.04: fallback_v1 pages used to skip it, so
    invented links and placeholder images survived), re-checked with the current
    checker (free); prompt_version None."""
    tl = v1.get("text_layer") or ""
    md, ll, _q, _l = postprocess_markdown(v1.get("markdown") or "", tl)
    fid = check_page(tl, md, bool(v1.get("is_scanned")), v1["page_no"], label_lines=ll)
    return base_page(v1) | {"markdown": md, "prompt_version": None} | _fid_fields(fid)


def v2_post_page(v1: dict, v2: dict, v2_label_lines: dict) -> dict:
    """v2 markdown + the free post-pass, re-checked. Keeps v2's prompt_version."""
    tl = v1.get("text_layer") or ""
    md, ll, _q, _l = postprocess_markdown(v2.get("markdown") or "", tl)
    ll = {**(v2_label_lines or {}), **ll}
    fid = check_page(tl, md, bool(v1.get("is_scanned")), v1["page_no"], label_lines=ll)
    return base_page(v1) | {"markdown": md, "prompt_version": v2.get("prompt_version")} | _fid_fields(fid)


def v3_page(v1: dict, rec: dict) -> dict:
    p = base_page(v1) | {k: rec.get(k) for k in VISION_FIELDS}
    if (p["markdown"] or "").startswith(FAILED_PREFIX):
        p["needs_review"] = True
        p["review_reasons"] = list(p.get("review_reasons") or []) + ["vision_failed"]
    return p


def assemble(v1_by_no: dict, v2_by_no: dict, v2_ll: dict, v3_recs: dict):
    """All pages in order. Returns (pages, reused_from, choices)."""
    pages, reused_from, choices = [], {}, []
    for n in sorted(v1_by_no):
        v1, v2 = v1_by_no[n], v2_by_no[n]
        v1p = v1_page(v1)
        v2p = v2_post_page(v1, v2, v2_ll.get(n))
        v3p = v3_page(v1, v3_recs[n]) if n in v3_recs else None
        page, method, src = choose_page(v1p, v2p, v3p)
        page["method"] = method
        pages.append(page)
        if src == "v2":
            reused_from[n] = v2["id"]
        elif src == "v1":
            reused_from[n] = v1["id"]
        choices.append({"page_no": n, "method": method, "chosen_from": src,
                        "reconverted": n in v3_recs})
    return pages, reused_from, choices


# ---------------------------------------------------------------- main

def load_v2(sb, source_file: str, base_version: int):
    docs = (sb.table("ingest_documents").select("*").eq("source_file", source_file)
            .eq("ingestion_version", base_version).limit(1).execute().data)
    if not docs:
        raise RuntimeError(f"no v{base_version} document")
    pages = (sb.table("ingest_pages").select(PAGE_COLS_V2).eq("document_id", docs[0]["id"])
             .order("page_no").execute().data)
    return docs[0], pages


def load_v2_label_lines(path: Path) -> dict:
    return {r["page_no"]: r.get("label_lines") or {} for r in read_jsonl(path) if not r.get("failed_attempt")}


def embed_plan(chunks: list, cache: dict) -> int:
    return len({text_key(embedding_text(c["content"])) for c in chunks} - set(cache.get("vectors", {})))


EMBED_SLACK = 15  # re-converted pages can yield a few more chunks than their carried version


def embed_estimate(selected_nos: set, carried_chunks: list, cache: dict) -> int:
    """Upper bound on new embedding texts: every carried chunk touching a re-converted
    page, plus the other carried chunks whose text is not in the cache."""
    vecs = cache.get("vectors", {})
    n = 0
    for c in carried_chunks:
        if any(p in selected_nos for p in range(c["page_start"], c["page_end"] + 1)):
            n += 1
        elif text_key(embedding_text(c["content"])) not in vecs:
            n += 1
    return n


def trim_for_embeddings(selected: list, carried_chunks: list, cache: dict, budget: int):
    """Longest priority-order prefix of `selected` whose embed_estimate fits `budget`.
    Returns (kept, trimmed, estimate)."""
    keep = len(selected)
    while keep > 0 and embed_estimate({n for n, _ in selected[:keep]}, carried_chunks, cache) > budget:
        keep -= 1
    return selected[:keep], selected[keep:], embed_estimate({n for n, _ in selected[:keep]}, carried_chunks, cache)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Patch affected pages as a new ingestion_version")
    ap.add_argument("--pdf", default=str(DEFAULT_PDF))
    ap.add_argument("--base-version", type=int, default=2)
    ap.add_argument("--version", type=int, default=3)
    ap.add_argument("--cap", type=int, default=134, help="vision HTTP calls for this run (all resumes)")
    ap.add_argument("--embed-cap", type=int, default=EMBED_CAP)
    ap.add_argument("--rescore", default=str(OUT_DIR / "r1_v2_rescore_v3checks.json"))
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--resume", action="store_true")
    ap.add_argument("--accept-failed", action="store_true")
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
    v2_doc, v2_pages = load_v2(sb, source_file, args.base_version)
    print(f"v1 doc {v1_doc['id']} ({len(v1_pages)} pages); v{args.base_version} doc {v2_doc['id']} ({len(v2_pages)} pages)")
    sha = sha256_file(pdf_path)
    if v1_doc.get("sha256") != sha or v2_doc.get("sha256") not in (None, sha):
        print("ABORT: sha256 mismatch with v1/v2")
        return 1
    if len(v1_pages) != len(v2_pages):
        print("ABORT: v1/v2 page counts differ")
        return 1
    status = version_status(source_file, args.version, sb)
    if status == "done":
        print(f"already done: {source_file} v{args.version}")
        return 0
    if status is not None:
        print(f"ABORT: v{args.version} exists with status {status!r} (no deletes)")
        return 1

    v1_by_no = {p["page_no"]: p for p in v1_pages}
    v2_by_no = {p["page_no"]: p for p in v2_pages}
    v2_ll = load_v2_label_lines(OUT_DIR / f"r1_pages_v{args.base_version}.jsonl")
    rescore = json.loads(Path(args.rescore).read_text())

    groups = priority_groups(rescore)
    selected, trimmed = select_patch_pages(groups, args.cap)
    by_group = {}
    for n, g in selected:
        by_group.setdefault(g, []).append(n)
    for g, _ in groups:
        print(f"  {g}: {by_group.get(g, [])}")
    print(f"selected {len(selected)} pages; trimmed {len(trimmed)}: {[n for n, _ in trimmed]}")
    embed_path = OUT_DIR / f"r1_embeddings_v{args.version}.json"
    cache = load_embed_cache(embed_path)
    if not cache.get("vectors"):
        seed = load_embed_cache(OUT_DIR / f"r1_embeddings_v{args.base_version}.json")
        cache = {"calls_total": 0, "vectors": dict(seed.get("vectors", {})), "seeded_from_v2": len(seed.get("vectors", {}))}
    carried, _, _ = assemble(v1_by_no, v2_by_no, v2_ll, {})
    carried_chunks = chunk_document(chunkable_pages(carried))
    selected, embed_trimmed, est_embed = trim_for_embeddings(selected, carried_chunks, cache,
                                                             args.embed_cap - EMBED_SLACK)
    trimmed = embed_trimmed + trimmed
    if embed_trimmed:
        print(f"trimmed for the embedding cap ({args.embed_cap} - slack {EMBED_SLACK}): "
              f"{[n for n, _ in embed_trimmed]}")
    print(f"final selection {len(selected)} pages: {[n for n, _ in selected]}")
    est_vision = math.ceil(len(selected) * EST_CALLS_PER_PAGE)
    print(f"estimated vision calls {est_vision} (x{EST_CALLS_PER_PAGE}) ≈ ${vision_cost(est_vision):.3f} (cap {args.cap})")
    print(f"estimated embedding calls ≤ {est_embed} (changed carried texts + every chunk touching a "
          f"re-converted page) ≈ ${embed_cost(est_embed):.4f} (cap {args.embed_cap})")
    if args.dry_run:
        print("DRY RUN: 0 Gemini calls, 0 DB writes.")
        return 1 if est_vision > args.cap else 0
    if est_vision > args.cap:
        print("ABORT: estimate over cap")
        return 1

    import pypdfium2 as pdfium
    from page_classify import render_page_png
    from convert import convert_page_vision
    from gemini_client import BudgetExceeded, call_count, embed_text, set_vision_cap

    pages_path = OUT_DIR / f"r1_pages_v{args.version}.jsonl"
    if pages_path.exists() and not args.resume:
        print(f"ABORT: {pages_path.name} exists; pass --resume")
        return 1
    records = read_jsonl(pages_path)
    done = {r["page_no"]: r for r in records if not r.get("failed_attempt")}
    prior = sum(int(r.get("http_calls") or 0) for r in records)
    remaining = args.cap - prior
    set_vision_cap(max(remaining, 0))
    call_log, runtime_trimmed = [], []
    pdf = pdfium.PdfDocument(str(pdf_path))
    todo = [(n, g) for n, g in selected if n not in done]
    for i, (n, g) in enumerate(todo, 1):
        if remaining - call_count["vision"] < VISION_MAX_CALLS_PER_PAGE:
            runtime_trimmed = [m for m, _ in todo[i - 1:]]
            print(f"cap reached ({prior + call_count['vision']}/{args.cap}); carrying {runtime_trimmed} from v2")
            break
        v1 = v1_by_no[n]
        png = render_page_png(pdf[n - 1], RENDER_DPI)
        before = call_count["vision"]
        try:
            res = convert_page_vision(png, n, v1.get("text_layer") or "", bool(v1.get("is_scanned")),
                                      call_log, f"patch_v{args.version}:{g}")
        except BudgetExceeded as e:
            spent = call_count["vision"] - before
            if spent:
                append_jsonl(pages_path, {"page_no": n, "failed_attempt": True, "http_calls": spent})
            runtime_trimmed = [m for m, _ in todo[i - 1:]]
            print(f"cap hit ({e}); carrying {runtime_trimmed} from v2")
            break
        rec = {k: res.get(k) for k in VISION_FIELDS}
        rec.update(page_no=n, group=g, http_calls=call_count["vision"] - before)
        if (rec["markdown"] or "").startswith(FAILED_PREFIX) and not args.accept_failed:
            append_jsonl(pages_path, {"page_no": n, "failed_attempt": True, "http_calls": rec["http_calls"]})
            print(f"STOP: vision call failed on p{n}. Nothing written. Resume with --resume")
            return 2
        append_jsonl(pages_path, rec)
        done[n] = rec
        print(f"[{i}/{len(todo)}] p{n} ({g}): calls={rec['http_calls']} types="
              f"{[d.get('type') for d in rec.get('diagrams') or []]} review={rec['review_reasons']} "
              f"total={prior + call_count['vision']}", flush=True)
    pdf.close()

    pages, reused_from, choices = assemble(v1_by_no, v2_by_no, v2_ll, done)
    chunks = chunk_document(chunkable_pages(pages))
    need = embed_plan(chunks, cache)
    print(f"chunks {len(chunks)}; new embedding texts {need} (cap {args.embed_cap})")
    if need + cache.get("calls_total", 0) > args.embed_cap:
        print("STOP: embedding cap would be exceeded. Nothing written to the DB.")
        return 2
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
                print(f"ABORT: embedding with {len(vec)} dims")
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
    meta = {k: v1_doc.get(k) for k in ("school", "club", "year", "source_class")}
    if meta["source_class"] != "club_casebook":
        print(f"ABORT: source_class {meta['source_class']!r}")
        return 1
    n_re = sum(1 for c in choices if c["chosen_from"] == "v3")
    n_carry = sum(1 for c in choices if c["chosen_from"] == "v2")
    n_fb = sum(1 for c in choices if c["chosen_from"] == "v1")
    notes = f"R1 gap fix: {n_re} re-converted, {n_carry} carried from v2, {n_fb} fallback_v1"
    w = write_version(meta, source_file, sha, len(pages), pages, chunks, args.version, PROMPT_VERSION, notes,
                      reuse_file_id=v1_doc["id"], embeddings=embeddings,
                      image_paths={p["page_no"]: p["image_path"] for p in v1_pages if p.get("image_path")},
                      reused_from=reused_from, sb=sb)
    print(f"WROTE v{args.version}: doc {w['file_id']}, {len(w['page_rows'])} pages, {len(w['chunk_rows'])} chunks; {notes}")

    all_recs = read_jsonl(pages_path)
    vision_total = sum(int(r.get("http_calls") or 0) for r in all_recs)
    out = {
        "file_id": w["file_id"], "version": args.version, "prompt_version": PROMPT_VERSION, "notes": notes,
        "selected": selected, "trimmed": trimmed, "runtime_trimmed": runtime_trimmed,
        "pages": choices, "call_log": call_log,
        "retried_pages": sorted(r["page_no"] for r in all_recs if (r.get("attempts") or 0) > 1),
        "final_vision_calls": vision_total, "final_embedding_calls": cache.get("calls_total", 0),
        "est_cost_usd": round(vision_cost(vision_total) + embed_cost(cache.get("calls_total", 0)), 4),
    }
    (INGESTION_DIR / "patch_output.json").write_text(json.dumps(out, indent=2, default=str))
    print(f"TOTAL CALLS: vision={vision_total} embedding={out['final_embedding_calls']} ≈ ${out['est_cost_usd']:.3f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

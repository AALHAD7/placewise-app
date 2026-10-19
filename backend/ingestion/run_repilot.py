"""R1.05: re-pilot one casebook as a new ingestion_version (default 2), reusing
everything v1 already paid for (classification, text layers, Docling output,
page images in storage). Insert-only; writes nothing to the DB until every
page and every embedding has succeeded.

    venv/bin/python run_repilot.py --version 2 --dry-run      # free: selection + estimate
    venv/bin/python run_repilot.py --version 2 --cap 350      # paid
    venv/bin/python run_repilot.py --version 2 --cap 350 --resume

Exit codes: 0 done (or already done), 1 abort (mismatch / bad state),
2 stopped cleanly before the DB write (cap, quota, network) -> resume later.
"""
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

INGESTION_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(INGESTION_DIR))

from chunk import chunk_document, embedding_text  # noqa: E402
from config import EMBEDDING_DIM, PROMPT_VERSION, RENDER_DPI, VISION_MAX_CALLS_PER_PAGE  # noqa: E402
from fidelity import check_page  # noqa: E402

DEFAULT_PDF = (INGESTION_DIR.parent.parent / "Data" / "Consulting Files" / "PDF Files"
               / "The FMS Consulting CaseBook 2023-24 (1).pdf")
OUT_DIR = INGESTION_DIR / "out"

# Page selection rule (plan R1.05, from analysis of the v1 output).
INDENTED_BULLET_RE = re.compile(r"^\s{2,}[-*]\s", re.MULTILINE)
DIAGRAM_HINT_RE = re.compile(r"matrix|2x2|axis|chart|funnel|→|->|framework|BCG|Ansoff|Porter|issue tree",
                             re.IGNORECASE)

# Cost figures (flash-lite): ~3k in + ~2k out per vision call; embeddings ~600 tokens.
VISION_IN_TOK, VISION_OUT_TOK = 3000, 2000
VISION_IN_PRICE, VISION_OUT_PRICE = 0.10 / 1e6, 0.40 / 1e6
EMBED_TOK, EMBED_PRICE = 600, 0.15 / 1e6
EST_CALLS_PER_PAGE = 1.25

FAILED_PREFIX = "[UNREADABLE] (vision call failed"

# Named fields kept from a convert_page_vision result in the page cache.
VISION_FIELDS = ("markdown", "method", "prompt_version", "attempts", "http_calls", "retry_skipped",
                 "truncated", "vision_model", "label_lines", "number_coverage", "word_coverage",
                 "unreadable_count", "needs_review", "review_reasons", "diagram_count", "diagrams",
                 "diagram_issues", "diagram_label_coverage", "diagram_errors")


def select_pages(pages: list):
    """Pure: (selected, reused) lists of page dicts. A page is re-converted if
    it is visual, or its v1 markdown has >= 2 indented bullet lines, or it
    mentions a diagram keyword."""
    selected, reused = [], []
    for p in sorted(pages, key=lambda x: x["page_no"]):
        md = p.get("markdown") or ""
        if p.get("is_visual") or len(INDENTED_BULLET_RE.findall(md)) >= 2 or DIAGRAM_HINT_RE.search(md):
            selected.append(p)
        else:
            reused.append(p)
    return selected, reused


def vision_cost(calls: int) -> float:
    return calls * (VISION_IN_TOK * VISION_IN_PRICE + VISION_OUT_TOK * VISION_OUT_PRICE)


def embed_cost(calls: int) -> float:
    return calls * EMBED_TOK * EMBED_PRICE


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1 << 16), b""):
            h.update(block)
    return h.hexdigest()


# ---------------------------------------------------------------- v1 cache

PAGE_COLS = ("id, page_no, is_text, is_table, is_visual, is_scanned, text_layer, markdown, "
             "docling_markdown, image_path")


def load_v1(sb, source_file: str):
    """(v1 doc row, v1 pages, source) from the DB; falls back to pilot_output.json."""
    try:
        docs = (sb.table("ingest_documents").select("*").eq("source_file", source_file)
                .eq("ingestion_version", 1).limit(1).execute().data)
        if not docs:
            raise RuntimeError("no v1 ingest_documents row")
        doc = docs[0]
        pages = (sb.table("ingest_pages").select(PAGE_COLS).eq("document_id", doc["id"])
                 .order("page_no").execute().data)
        return doc, pages, "db"
    except Exception as e:  # noqa: BLE001
        print(f"WARNING: v1 DB read failed ({type(e).__name__}: {str(e)[:150]}); "
              "falling back to pilot_output.json (no v1 page ids)")
        data = json.loads((INGESTION_DIR / "pilot_output.json").read_text())["results"][0]
        doc = {"id": data["file_id"], "source_file": data["source_file"], "sha256": None}
        pages = [{"id": None, "image_path": f"pages/{data['file_id']}/{p['page_no']}.png", **p}
                 for p in data["pages_full"]]
        return doc, pages, "pilot_output.json"


# ---------------------------------------------------------------- caches

def read_jsonl(path: Path) -> list:
    if not path.exists():
        return []
    out = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            out.append(json.loads(line))
    return out


def append_jsonl(path: Path, rec: dict):
    with open(path, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
        fh.flush()


def load_embed_cache(path: Path) -> dict:
    if path.exists():
        return json.loads(path.read_text())
    return {"calls_total": 0, "vectors": {}}


def save_embed_cache(path: Path, cache: dict):
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(cache))
    tmp.replace(path)


def text_key(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------- page assembly

def reused_page(v1: dict) -> dict:
    """A page kept from v1: v1 markdown, re-checked with the current check_page
    (free). No label_lines: v1 markdown had no collapsed diagram labels."""
    fid = check_page(v1.get("text_layer") or "", v1.get("markdown") or "", bool(v1.get("is_scanned")),
                     v1["page_no"], label_lines=None)
    return base_page(v1) | {
        "markdown": v1.get("markdown"), "method": "reused_v1", "prompt_version": None,
        "number_coverage": fid["number_coverage"], "word_coverage": fid["word_coverage"],
        "unreadable_count": fid["unreadable_count"], "needs_review": fid["needs_review"],
        "review_reasons": fid["review_reasons"], "diagram_count": fid["diagram_count"],
        "diagrams": fid["diagrams"], "diagram_issues": fid["diagram_issues"],
        "diagram_label_coverage": fid["diagram_label_coverage"],
    }


def base_page(v1: dict) -> dict:
    return {
        "page_no": v1["page_no"], "is_text": v1.get("is_text"), "is_table": v1.get("is_table"),
        "is_visual": v1.get("is_visual"), "is_scanned": v1.get("is_scanned"),
        "text_layer": v1.get("text_layer"), "docling_markdown": v1.get("docling_markdown"),
    }


def vision_page(v1: dict, rec: dict) -> dict:
    p = base_page(v1) | {k: rec.get(k) for k in VISION_FIELDS}
    if (p["markdown"] or "").startswith(FAILED_PREFIX):
        p["needs_review"] = True
        p["review_reasons"] = list(p.get("review_reasons") or []) + ["vision_failed"]
    return p


# ---------------------------------------------------------------- main

def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Re-pilot a casebook as a new ingestion_version")
    ap.add_argument("--pdf", default=str(DEFAULT_PDF))
    ap.add_argument("--version", type=int, required=True)
    ap.add_argument("--cap", type=int, default=350, help="run-level cap on vision HTTP calls (all resumes)")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--resume", action="store_true")
    ap.add_argument("--accept-failed", action="store_true",
                    help="keep pages whose vision call failed as needs_review (excluded from chunks) "
                         "instead of stopping")
    args = ap.parse_args(argv)
    if args.version < 2:
        print("ABORT: --version must be >= 2 (v1 is the existing pilot)")
        return 1

    from pipeline import get_sb, version_status, write_version, chunkable_pages
    sb = get_sb()
    pdf_path = Path(args.pdf)
    source_file = pdf_path.name

    # 1. v1 cache + sha check
    v1_doc, v1_pages, v1_src = load_v1(sb, source_file)
    print(f"v1 cache: {len(v1_pages)} pages from {v1_src} (doc {v1_doc['id']})")
    sha = sha256_file(pdf_path)
    if v1_doc.get("sha256") and v1_doc["sha256"] != sha:
        print(f"ABORT: sha256 mismatch: PDF {sha[:12]} vs v1 {v1_doc['sha256'][:12]}")
        return 1
    print(f"sha256 matches v1: {sha[:16]}..." if v1_doc.get("sha256") else "sha256: v1 value unavailable")

    # 2. already done / pending
    status = version_status(source_file, args.version, sb)
    if status == "done":
        print(f"already done: {source_file} v{args.version}")
        return 0
    if status is not None:
        print(f"ABORT: {source_file} v{args.version} exists with status {status!r}. "
              f"No deletes: fix it by hand or use --version {args.version + 1}.")
        return 1

    # 4. selection
    selected, reused = select_pages(v1_pages)
    est_vision = round(len(selected) * EST_CALLS_PER_PAGE)
    est_embed = 363
    print(f"selected for vision: {len(selected)}   reused from v1: {len(reused)}")
    print("selected pages:", ",".join(str(p["page_no"]) for p in selected))
    print("reused pages:", ",".join(str(p["page_no"]) for p in reused))
    print(f"estimated vision calls: {est_vision} (x{EST_CALLS_PER_PAGE}) ≈ ${vision_cost(est_vision):.2f}")
    print(f"estimated embedding calls: ~{est_embed} ≈ ${embed_cost(est_embed):.3f}")
    print(f"estimated total: ≈ ${vision_cost(est_vision) + embed_cost(est_embed):.2f}  (cap {args.cap})")
    if args.dry_run:
        if est_vision > args.cap:
            print(f"DRY RUN: projected {est_vision} vision calls > cap {args.cap}: do NOT run live")
            return 1
        print("DRY RUN: no Gemini calls, no DB writes.")
        return 0
    if est_vision > args.cap:
        print(f"ABORT: projected {est_vision} vision calls > cap {args.cap}")
        return 1
    if v1_src != "db":
        print("ABORT: live run needs v1 page ids from the DB")
        return 1

    # 5. vision pages, cached per page
    import pypdfium2 as pdfium
    from page_classify import render_page_png
    from convert import convert_page_vision
    from gemini_client import BudgetExceeded, call_count, embed_text, set_vision_cap

    OUT_DIR.mkdir(exist_ok=True)
    pages_path = OUT_DIR / f"r1_pages_v{args.version}.jsonl"
    embed_path = OUT_DIR / f"r1_embeddings_v{args.version}.json"
    if pages_path.exists() and not args.resume:
        print(f"ABORT: {pages_path.name} exists; pass --resume to continue it")
        return 1
    records = read_jsonl(pages_path)
    done = {r["page_no"]: r for r in records if not r.get("failed_attempt")}
    prior_calls = sum(int(r.get("http_calls") or 0) for r in records)
    remaining = args.cap - prior_calls
    set_vision_cap(max(remaining, 0))
    resume_cmd = f"venv/bin/python run_repilot.py --version {args.version} --cap {args.cap} --resume"
    print(f"cache: {len(done)} pages done, {prior_calls} vision calls already spent; {remaining} left under cap")

    call_log = []
    pdf = pdfium.PdfDocument(str(pdf_path))
    todo = [p for p in selected if p["page_no"] not in done]
    for i, v1 in enumerate(todo, 1):
        if remaining - call_count["vision"] < VISION_MAX_CALLS_PER_PAGE:
            print(f"STOP: vision cap {args.cap} would be exceeded "
                  f"({prior_calls + call_count['vision']} spent). Nothing written to the DB.\nResume: {resume_cmd}")
            return 2
        n = v1["page_no"]
        png = render_page_png(pdf[n - 1], RENDER_DPI)
        before = call_count["vision"]
        try:
            res = convert_page_vision(png, n, v1.get("text_layer") or "", bool(v1.get("is_scanned")),
                                      call_log, f"repilot_v{args.version}")
        except BudgetExceeded as e:
            spent = call_count["vision"] - before
            if spent:
                append_jsonl(pages_path, {"page_no": n, "failed_attempt": True, "http_calls": spent})
            print(f"STOP: {e}. Nothing written to the DB.\nResume: {resume_cmd}")
            return 2
        rec = {k: res.get(k) for k in VISION_FIELDS}
        rec["page_no"] = n
        rec["http_calls"] = call_count["vision"] - before
        if (rec["markdown"] or "").startswith(FAILED_PREFIX) and not args.accept_failed:
            append_jsonl(pages_path, {"page_no": n, "failed_attempt": True, "http_calls": rec["http_calls"],
                                      "error": rec["markdown"][:300]})
            print(f"STOP: vision call failed on page {n}: {rec['markdown'][:200]}\n"
                  f"Nothing written to the DB. Resume: {resume_cmd}  (add --accept-failed to flag it instead)")
            return 2
        append_jsonl(pages_path, rec)
        done[n] = rec
        types = [d.get("type") for d in rec.get("diagrams") or []]
        print(f"[{i}/{len(todo)}] p{n}: calls={rec['http_calls']} attempts={rec['attempts']} "
              f"diagrams={types} review={rec['review_reasons']} total={prior_calls + call_count['vision']}",
              flush=True)
    pdf.close()

    # 6. assemble all pages in order
    by_no = {p["page_no"]: p for p in v1_pages}
    selected_nos = {p["page_no"] for p in selected}
    pages = []
    for n in sorted(by_no):
        v1 = by_no[n]
        pages.append(vision_page(v1, done[n]) if n in selected_nos else reused_page(v1))
    if len(pages) != len(v1_pages) or any(p["page_no"] in selected_nos and p["page_no"] not in done
                                          for p in pages):
        print("ABORT: page set incomplete")
        return 1

    # 7. chunk + embed (cached, resumable)
    chunks = chunk_document(chunkable_pages(pages))
    cache = load_embed_cache(embed_path)
    cache.setdefault("calls_total", 0)
    embeddings = []

    def account(base):
        cache["calls_total"] += call_count["embedding"] - base
        return call_count["embedding"]

    base = call_count["embedding"]
    try:
        for i, c in enumerate(chunks):
            text = embedding_text(c["content"])
            key = text_key(text)
            vec = cache["vectors"].get(key)
            if vec is None:
                vec = embed_text(text)
                cache["vectors"][key] = vec
                base = account(base)
                if len(cache["vectors"]) % 10 == 0:
                    save_embed_cache(embed_path, cache)
            if len(vec) != EMBEDDING_DIM:
                save_embed_cache(embed_path, cache)
                print(f"ABORT: chunk {i} embedding has {len(vec)} dims, expected {EMBEDDING_DIM}")
                return 1
            embeddings.append(vec)
    except Exception as e:  # noqa: BLE001
        account(base)
        save_embed_cache(embed_path, cache)
        print(f"STOP: embedding failed ({type(e).__name__}: {str(e)[:200]}). Nothing written to the DB.\n"
              f"Resume: {resume_cmd}")
        return 2
    save_embed_cache(embed_path, cache)
    print(f"chunks: {len(chunks)}, embeddings ok ({EMBEDDING_DIM} dims), "
          f"embedding HTTP calls total: {cache['calls_total']}")

    # 8. write (insert-only), only now
    if version_status(source_file, args.version, sb) is not None:
        print(f"ABORT: {source_file} v{args.version} appeared while running; not writing")
        return 1
    meta = {k: v1_doc.get(k) for k in ("school", "club", "year", "source_class")}
    if meta["source_class"] != "club_casebook":
        print(f"ABORT: source_class is {meta['source_class']!r}, not club_casebook")
        return 1
    n_reused = len(reused)
    w = write_version(meta, source_file, sha, len(pages), pages, chunks, args.version, PROMPT_VERSION,
                      f"R1 re-pilot; {n_reused} reused from v1", reuse_file_id=v1_doc["id"],
                      embeddings=embeddings,
                      image_paths={p["page_no"]: p["image_path"] for p in v1_pages if p.get("image_path")},
                      reused_from={p["page_no"]: p["id"] for p in reused}, sb=sb)
    print(f"WROTE v{args.version}: doc {w['file_id']}, {len(w['page_rows'])} pages, {len(w['chunk_rows'])} chunks")

    # 9. local output (gitignored)
    all_records = read_jsonl(pages_path)
    vision_total = sum(int(r.get("http_calls") or 0) for r in all_records)
    out = {
        "results": [{
            "file_id": w["file_id"], "source_file": source_file, "page_count": len(pages),
            "ingestion_version": args.version, "prompt_version": PROMPT_VERSION,
            "pages": [{k: v for k, v in p.items() if k not in ("text_layer", "markdown", "docling_markdown")}
                      | {"text_layer_len": len(p.get("text_layer") or "")} for p in pages],
            "pages_full": pages,
            "chunk_count": len(chunks),
            "chunks_preview": [{"section_title": c["section_title"], "page_start": c["page_start"],
                                "page_end": c["page_end"], "content_len": len(c["content"]),
                                "has_diagram": c["has_diagram"]} for c in chunks],
        }],
        "call_log": call_log,
        "selected": sorted(selected_nos), "reused": [p["page_no"] for p in reused],
        "retried_pages": sorted(r["page_no"] for r in all_records
                                if not r.get("failed_attempt") and (r.get("attempts") or 0) > 1),
        "failed_attempts": [r for r in all_records if r.get("failed_attempt")],
        "final_vision_calls": vision_total,
        "final_embedding_calls": cache["calls_total"],
        "est_cost_usd": round(vision_cost(vision_total) + embed_cost(cache["calls_total"]), 4),
    }
    (INGESTION_DIR / "repilot_output.json").write_text(json.dumps(out, indent=2, default=str))
    print(f"TOTAL CALLS: vision={vision_total} embedding={cache['calls_total']} "
          f"≈ ${out['est_cost_usd']:.2f}; written to repilot_output.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())

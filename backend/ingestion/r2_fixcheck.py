"""R2.04: dry check of the free pipeline fixes on the real FMS pages (read-only).

Loads every page of one ingestion_version of the FMS 2023-24 casebook from the DB
(SELECT only, no writes, no Gemini), runs the current postprocess_markdown and
check_page on each, and prints before -> after for the R1.10 evidence pages:

  stray ")" after "Index"            pages 10, 224
  "](" link syntax / placeholder     the 15 fallback_v1 pages (outside diagram blocks)
  "Guesestimate"                     pages 88, 97, 98, 101, 106, 116
  block_in_table                     pages 58, 59, 60, 70, 72, 73

It also lists how many pages' markdown changes and EVERY nav-typo replacement
(page, old -> new) for a human audit. Results: out/r2_fixcheck.json (v3) or
out/r2_fixcheck_v<N>.json; plan 06 reads `in_table` from the v3 file.

    venv/bin/python r2_fixcheck.py              # v3
    venv/bin/python r2_fixcheck.py --version 4  # after plan 06

Exit 0 only if every evidence page is clean (a real in-cell block that stays
flagged counts as clean) and there are <= 20 typo replacements.
"""
import argparse
import json
import sys
from pathlib import Path

INGESTION_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(INGESTION_DIR))

from diagram_schema import extract_blocks  # noqa: E402
from fidelity import check_page  # noqa: E402
from postprocess import postprocess_markdown  # noqa: E402
from textnorm import _outside_blocks  # noqa: E402

V3_DOC_ID = "129a2604-0221-4ba2-af50-42ac641a21a0"
PAREN_PAGES = [10, 224]
FALLBACK_V1_PAGES = [15, 56, 67, 69, 71, 77, 79, 86, 127, 129, 152, 185, 198, 203, 229]
TYPO_PAGES = [88, 97, 98, 101, 106, 116]
IN_TABLE_PAGES = [58, 59, 60, 70, 72, 73]
MAX_TYPO_REPLACEMENTS = 20
PAGE_COLS = "page_no, is_scanned, is_visual, text_layer, markdown, method, needs_review, review_reasons"


def load_pages(sb, version: int):
    src = (sb.table("ingest_documents").select("source_file").eq("id", V3_DOC_ID)
           .limit(1).execute().data)
    if not src:
        raise RuntimeError("v3 document not found")
    docs = (sb.table("ingest_documents").select("id, source_file, ingestion_version")
            .eq("source_file", src[0]["source_file"]).eq("ingestion_version", version)
            .limit(1).execute().data)
    if not docs:
        raise RuntimeError(f"no v{version} document for {src[0]['source_file']}")
    rows, start = [], 0
    while True:
        r = (sb.table("ingest_pages").select(PAGE_COLS).eq("document_id", docs[0]["id"])
             .order("page_no").range(start, start + 199).execute().data)
        rows += r
        if len(r) < 200:
            break
        start += 200
    return docs[0], rows


# ---------------------------------------------------------------- per-page measures (pure)

def index_paren_count(md: str) -> int:
    return (md or "").count("Index)")


def link_syntax_count(md: str) -> int:
    """'](' outside diagram blocks plus any 'placeholder' anywhere."""
    n = sum(seg.count("](") for seg, is_block in _outside_blocks(md or "") if not is_block)
    return n + (md or "").lower().count("placeholder")


def typo_count(md: str) -> int:
    return (md or "").count("Guesestimate")


def in_table_blocks(md: str):
    """[(block index, real_in_cell)]: real_in_cell = the opener follows cell text on its line."""
    out = []
    for b in extract_blocks(md or ""):
        if b.get("in_table"):
            md_ = md or ""
            line_start = md_.rfind("\n", 0, b["start"]) + 1
            out.append((b["index"], bool(md_[line_start:b["start"]].strip())))
    return out


def classify_in_table(before_md: str, after_md: str, after_flagged: bool) -> str:
    blocks = in_table_blocks(after_md)
    if not after_flagged and not blocks:
        return "false_positive_fixed" if in_table_blocks(before_md) else "clean"
    if blocks and all(real for _i, real in blocks):
        return "real_still_flagged"
    return "unresolved"


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Read-only dry check of the R2.04 fixes")
    ap.add_argument("--version", type=int, default=3)
    ap.add_argument("--out", default=None)
    args = ap.parse_args(argv)
    out_path = Path(args.out) if args.out else (
        INGESTION_DIR / "out" / ("r2_fixcheck.json" if args.version == 3 else f"r2_fixcheck_v{args.version}.json"))

    from pipeline import get_sb
    doc, rows = load_pages(get_sb(), args.version)
    print(f"v{args.version} doc {doc['id']}: {len(rows)} pages (read-only)")

    pages = {}
    typo_replacements, changed = [], []
    for r in rows:
        n, tl, md = r["page_no"], r.get("text_layer") or "", r.get("markdown") or ""
        log = []
        md2, _ll, _q, n_links = postprocess_markdown(md, tl, typo_log=log)
        before = check_page(tl, md, bool(r.get("is_scanned")), n)
        after = check_page(tl, md2, bool(r.get("is_scanned")), n)
        for old, new in log:
            typo_replacements.append({"page": n, "old": old, "new": new})
        if md2 != md:
            changed.append({"page": n, "links_and_parens_stripped": n_links, "typos": len(log)})
        pages[n] = {"md": md, "md2": md2, "before": before, "after": after, "method": r.get("method")}

    def flagged(f):
        return any(it["code"] == "block_in_table" for it in f["diagram_issues"])

    ok = True
    evidence = {}

    def report(group, n, b, a, clean, note=""):
        nonlocal ok
        ok &= clean
        evidence.setdefault(group, {})[str(n)] = {"before": b, "after": a, "clean": clean, **({"note": note} if note else {})}
        print(f"  p{n:<4} {b} -> {a}  {'OK' if clean else 'FAIL'} {note}")

    print("\nStray ')' after 'Index':")
    for n in PAREN_PAGES:
        p = pages[n]
        b, a = index_paren_count(p["md"]), index_paren_count(p["md2"])
        report("index_paren", n, b, a, a == 0)

    print("\nLink syntax '](' outside blocks / 'placeholder' (fallback_v1 pages):")
    for n in FALLBACK_V1_PAGES:
        p = pages[n]
        b, a = link_syntax_count(p["md"]), link_syntax_count(p["md2"])
        report("fallback_links", n, b, a, a == 0, f"method={p['method']}")

    print("\n'Guesestimate':")
    for n in TYPO_PAGES:
        p = pages[n]
        b, a = typo_count(p["md"]), typo_count(p["md2"])
        report("guesestimate", n, b, a, a == 0)

    print("\nblock_in_table:")
    in_table = {}
    for n in IN_TABLE_PAGES:
        p = pages[n]
        fb, fa = flagged(p["before"]), flagged(p["after"])
        cls = classify_in_table(p["md"], p["md2"], fa)
        in_table[str(n)] = cls
        detail = [f"block {i}: {'opener inside a cell' if real else 'opener on its own line'}"
                  for i, real in in_table_blocks(p["md2"])]
        report("in_table", n, fb, fa, cls != "unresolved", f"{cls}; " + "; ".join(detail))

    print(f"\nPages with changed markdown: {len(changed)} of {len(rows)}")
    for c in changed:
        print(f"  p{c['page']:<4} links/parens stripped={c['links_and_parens_stripped']} typos={c['typos']}")

    print(f"\nNav-typo replacements across all {len(rows)} pages: {len(typo_replacements)}")
    for t in typo_replacements:
        print(f"  p{t['page']:<4} {t['old']} -> {t['new']}")
    if len(typo_replacements) > MAX_TYPO_REPLACEMENTS:
        print(f"FAIL: more than {MAX_TYPO_REPLACEMENTS} typo replacements; investigate before plan 06")
        ok = False

    result = {
        "version": args.version, "document_id": doc["id"], "pages": len(rows),
        "in_table": in_table, "typo_replacements": typo_replacements,
        "changed_pages": [c["page"] for c in changed], "changed_detail": changed,
        "evidence": evidence, "ok": ok,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(result, indent=2))
    print(f"\nWrote {out_path}")
    print("RESULT:", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())

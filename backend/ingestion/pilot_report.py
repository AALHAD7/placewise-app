"""R1.05 pilot report: one ingestion version of one casebook, compared with an
earlier version. Reads only from the DB (plus the gitignored run output for
Gemini call counts). Makes no writes and no Gemini calls.

    venv/bin/python pilot_report.py --source-file "The FMS Consulting CaseBook 2023-24 (1).pdf" --version 2 --compare 1

Writes out/r1_pilot_report.json and prints a Markdown report. Exit 1 if the
document is missing or its status is not `done`.
"""
import argparse
import json
import statistics
import sys
from collections import Counter
from pathlib import Path

INGESTION_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(INGESTION_DIR))

from config import NUMBER_COVERAGE_MIN, WORD_COVERAGE_MIN  # noqa: E402
from run_repilot import embed_cost, vision_cost  # noqa: E402

V1_EXPECTED_PAGES, V1_EXPECTED_CHUNKS, DOCUMENT_CHUNKS_EXPECTED = 248, 363, 22457
CANDIDATE_TYPES = ("issue_tree", "matrix", "chart", "flow")
PREFERRED = {"matrix": 20, "flow": 52}
PAGE_COLS = ("id, page_no, is_text, is_table, is_visual, is_scanned, method, number_coverage, word_coverage, "
             "unreadable_count, needs_review, review_reasons, diagrams, diagram_count, diagram_issues, "
             "diagram_label_coverage, reused_from_page_id")


def fetch_all(q_factory, page=1000):
    out, start = [], 0
    while True:
        rows = q_factory().range(start, start + page - 1).execute().data
        out.extend(rows)
        if len(rows) < page:
            return out
        start += page


def get_doc(sb, source_file, version):
    rows = (sb.table("ingest_documents").select("*").eq("source_file", source_file)
            .eq("ingestion_version", version).limit(1).execute().data)
    return rows[0] if rows else None


def count(sb, table, **f):
    q = sb.table(table).select("id", count="exact")
    for k, v in f.items():
        q = q.eq(k, v)
    return q.limit(1).execute().count


def _num(v):
    return None if v is None else float(v)


def cov_stats(pages, key):
    vals = [_num(p[key]) for p in pages if p.get(key) is not None]
    if not vals:
        return {"mean": None, "min": None, "n": 0}
    return {"mean": round(statistics.mean(vals), 4), "min": round(min(vals), 4), "n": len(vals)}


def derived_v1_reasons(p):
    """v1 stored no review_reasons; derive the coverage ones from its stored numbers."""
    r = []
    if p.get("number_coverage") is not None and _num(p["number_coverage"]) < NUMBER_COVERAGE_MIN:
        r.append("number_coverage")
    if p.get("word_coverage") is not None and _num(p["word_coverage"]) < WORD_COVERAGE_MIN:
        r.append("word_coverage")
    if (p.get("unreadable_count") or 0) > 0:
        r.append("unreadable")
    if p.get("is_scanned"):
        r.append("scanned")
    return r


def page_summary(pages, version_label):
    types = {t: sum(1 for p in pages if p.get(f"is_{t}")) for t in ("text", "table", "visual", "scanned")}
    reasons = Counter()
    for p in pages:
        if not p.get("needs_review"):
            continue
        rs = p.get("review_reasons") or []
        if not rs and version_label == "v1":
            rs = [f"{x} (derived)" for x in derived_v1_reasons(p)] or ["unrecorded"]
        for r in rs:
            reasons[r] += 1
    return {
        "pages": len(pages),
        "pages_by_type": types,
        "methods": dict(Counter(p.get("method") for p in pages)),
        "number_coverage": cov_stats(pages, "number_coverage"),
        "word_coverage": cov_stats(pages, "word_coverage"),
        "needs_review": sum(1 for p in pages if p.get("needs_review")),
        "review_reasons": dict(reasons.most_common()),
    }


def diagram_summary(pages):
    by_type = Counter()
    invalid = 0
    for p in pages:
        for d in p.get("diagrams") or []:
            by_type[d.get("type")] += 1
        invalid += max(0, (p.get("diagram_count") or 0) - len(p.get("diagrams") or []))
    covs = [_num(p["diagram_label_coverage"]) for p in pages if p.get("diagram_label_coverage") is not None]
    return {
        "blocks_total": sum(p.get("diagram_count") or 0 for p in pages),
        "valid_blocks": sum(by_type.values()),
        "invalid_blocks": invalid,
        "by_type": dict(by_type.most_common()),
        "pages_with_blocks": sum(1 for p in pages if (p.get("diagram_count") or 0) > 0),
        "mean_label_coverage": round(statistics.mean(covs), 4) if covs else None,
        "pages_label_coverage_below_1": sorted(p["page_no"] for p in pages
                                               if p.get("diagram_label_coverage") is not None
                                               and _num(p["diagram_label_coverage"]) < 1.0),
        "visual_pages_zero_blocks": sorted(p["page_no"] for p in pages
                                           if p.get("is_visual") and not (p.get("diagram_count") or 0)),
        "pages_with_other_blocks": sorted(p["page_no"] for p in pages
                                          if any(d.get("type") == "other" for d in p.get("diagrams") or [])),
    }


def candidates(pages):
    """Up to 3 pages per type whose block of that type is valid and whose label
    coverage is 1.0; clean pages (no needs_review) first, preferred pages first."""
    out = {}
    for t in CANDIDATE_TYPES:
        pool = [p for p in pages
                if any(d.get("type") == t for d in p.get("diagrams") or [])
                and p.get("diagram_label_coverage") is not None and _num(p["diagram_label_coverage"]) == 1.0]
        pool.sort(key=lambda p: (p["page_no"] != PREFERRED.get(t), bool(p.get("needs_review")), p["page_no"]))
        out[t] = [{"page_no": p["page_no"], "needs_review": p.get("needs_review"),
                   "review_reasons": p.get("review_reasons"),
                   "types_on_page": [d.get("type") for d in p.get("diagrams") or []]} for p in pool[:3]]
    return out


def md_table(rows, header):
    lines = ["| " + " | ".join(header) + " |", "|" + "---|" * len(header)]
    lines += ["| " + " | ".join("" if c is None else str(c) for c in r) + " |" for r in rows]
    return "\n".join(lines)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source-file", required=True)
    ap.add_argument("--version", type=int, required=True)
    ap.add_argument("--compare", type=int, default=1)
    ap.add_argument("--run-output", default=str(INGESTION_DIR / "repilot_output.json"))
    ap.add_argument("--out", default=str(INGESTION_DIR / "out" / "r1_pilot_report.json"))
    args = ap.parse_args(argv)

    from pipeline import get_sb
    sb = get_sb()
    doc = get_doc(sb, args.source_file, args.version)
    if not doc:
        print(f"No ingest_documents row for {args.source_file!r} v{args.version}")
        return 1
    if doc["status"] != "done":
        print(f"Refusing to report: {args.source_file!r} v{args.version} has status {doc['status']!r}, not 'done'")
        return 1
    base = get_doc(sb, args.source_file, args.compare)

    def pages_of(d):
        return fetch_all(lambda: sb.table("ingest_pages").select(PAGE_COLS)
                         .eq("document_id", d["id"]).order("page_no"))

    pv = pages_of(doc)
    pb = pages_of(base) if base else []
    sv, sb_ = page_summary(pv, f"v{args.version}"), page_summary(pb, f"v{args.compare}")

    run = {}
    if Path(args.run_output).exists():
        run = json.loads(Path(args.run_output).read_text())
    retried = run.get("retried_pages", [])

    # chunks
    chunk_rows = fetch_all(lambda: sb.table("ingest_chunks").select("id, has_diagram, is_active")
                           .eq("document_id", doc["id"]).order("id"))
    sample = (sb.table("ingest_chunks").select("embedding").eq("document_id", doc["id"])
              .limit(1).execute().data)
    emb = sample[0]["embedding"] if sample else None
    if isinstance(emb, str):
        emb = json.loads(emb)
    chunks = {
        "count": len(chunk_rows),
        "has_diagram": sum(1 for c in chunk_rows if c["has_diagram"]),
        "is_active_true": sum(1 for c in chunk_rows if c["is_active"]),
        "sample_embedding_dim": len(emb) if emb else None,
    }

    v1_doc_id = base["id"] if base else None
    integrity = {
        "compare_doc_present": base is not None,
        "compare_doc_status": base and base["status"],
        "compare_pages": count(sb, "ingest_pages", document_id=v1_doc_id) if v1_doc_id else 0,
        "compare_chunks": count(sb, "ingest_chunks", ingestion_version=args.compare),
        "ingest_chunks_active_true": count(sb, "ingest_chunks", is_active=True),
        "document_chunks": count(sb, "document_chunks"),
    }
    integrity["ok"] = (integrity["compare_doc_present"] and integrity["compare_pages"] == V1_EXPECTED_PAGES
                       and integrity["compare_chunks"] == V1_EXPECTED_CHUNKS
                       and integrity["ingest_chunks_active_true"] == 0
                       and integrity["document_chunks"] == DOCUMENT_CHUNKS_EXPECTED)

    vcalls, ecalls = run.get("final_vision_calls"), run.get("final_embedding_calls")
    gemini = {"vision_calls": vcalls, "embedding_calls": ecalls,
              "est_cost_usd": round(vision_cost(vcalls or 0) + embed_cost(ecalls or 0), 4),
              "source": Path(args.run_output).name if run else "missing"}

    report = {
        "source_file": args.source_file, "version": args.version, "compare": args.compare,
        "doc_id": doc["id"], "status": doc["status"], "prompt_version": doc.get("prompt_version"),
        "notes": doc.get("notes"),
        f"v{args.version}": sv, f"v{args.compare}": sb_,
        "retried_pages": retried,
        "diagrams": diagram_summary(pv),
        "chunks": chunks, "gemini": gemini, "integrity": integrity,
        "candidates": candidates(pv),
    }
    Path(args.out).parent.mkdir(exist_ok=True)
    Path(args.out).write_text(json.dumps(report, indent=2, default=str))

    a, b = f"v{args.version}", f"v{args.compare}"
    print(f"# Pilot report: {args.source_file} {a} vs {b}\n")
    print(f"doc {doc['id']} status={doc['status']} prompt_version={doc.get('prompt_version')} notes={doc.get('notes')!r}\n")
    print("## Pages\n")
    rows = [[f"pages ({t})", sv["pages_by_type"][t], sb_["pages_by_type"].get(t)] for t in sv["pages_by_type"]]
    rows += [["pages total", sv["pages"], sb_["pages"]],
             ["methods", sv["methods"], sb_["methods"]],
             ["pages that needed a retry", len(retried), "n/a"],
             ["number_coverage mean / min", f"{sv['number_coverage']['mean']} / {sv['number_coverage']['min']}",
              f"{sb_['number_coverage']['mean']} / {sb_['number_coverage']['min']}"],
             ["word_coverage mean / min", f"{sv['word_coverage']['mean']} / {sv['word_coverage']['min']}",
              f"{sb_['word_coverage']['mean']} / {sb_['word_coverage']['min']}"],
             ["**needs_review**", f"**{sv['needs_review']}**", f"**{sb_['needs_review']}**"]]
    print(md_table(rows, ["metric", a, b]))
    print("\n## needs_review by reason (a page can have several)\n")
    keys = list(dict.fromkeys(list(sv["review_reasons"]) + list(sb_["review_reasons"])))
    print(md_table([[k, sv["review_reasons"].get(k, 0), sb_["review_reasons"].get(k, 0)] for k in keys],
                   ["reason", a, b]))
    d = report["diagrams"]
    print(f"\n## Diagram blocks ({a})\n")
    print(md_table([
        ["blocks total", d["blocks_total"]], ["valid blocks", d["valid_blocks"]],
        ["invalid blocks", d["invalid_blocks"]], ["by type", d["by_type"]],
        ["pages with >=1 block", d["pages_with_blocks"]], ["mean label coverage", d["mean_label_coverage"]],
        ["pages with label coverage < 1", f"{len(d['pages_label_coverage_below_1'])}: {d['pages_label_coverage_below_1']}"],
        ["visual pages with 0 blocks", f"{len(d['visual_pages_zero_blocks'])}: {d['visual_pages_zero_blocks']}"],
        ["pages with `other` blocks", f"{len(d['pages_with_other_blocks'])}: {d['pages_with_other_blocks']}"],
    ], ["metric", "value"]))
    print(f"\n## Chunks ({a})\n")
    print(md_table([[k, v] for k, v in chunks.items()], ["metric", "value"]))
    print("\n## Gemini calls\n")
    print(md_table([[k, v] for k, v in gemini.items()], ["metric", "value"]))
    print(f"\n## Integrity ({b} and live table)\n")
    print(md_table([[k, v] for k, v in integrity.items()], ["check", "value"]))
    print("\n## Sample candidates (valid block, label coverage 1.0)\n")
    for t, lst in report["candidates"].items():
        print(f"- {t}: " + (", ".join(f"p{c['page_no']}{' (needs_review: ' + ','.join(c['review_reasons']) + ')' if c['needs_review'] else ''}"
                                      for c in lst) or "NONE (finding for R2)"))
    print(f"\nwritten {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

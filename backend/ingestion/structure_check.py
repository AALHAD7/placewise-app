"""R2.01: a cheap second-opinion Gemini check of diagram STRUCTURE (who joins to whom).

The label checkers cannot see a wrong parent, because every label is spelled right. This
sends the page image plus the stored parent->child / from->to list and asks, per claim,
whether the page draws that connection. It never sends the text layer and never asks for
a re-transcription (that would just be another transcription with the same blind spots).

Status: not adopted (R2.05). Against the blind eyeball sweep it caught 21/27 structure-bad pages
(recall 0.78, rule needs >= 0.80) and disputed 12/30 good pages (false-dispute 0.40, rule <= 0.40);
run-to-run agreement 51/58. Kept as an admin tool only; pipeline.py does not call it. Every
diagram still needs a human or eyeball structure check before R9 (see out/r2_reconcile.json).

Read-only on the DB. Results go to out/r2_structure_check.jsonl (one line per call) and
out/r2_structure_check.json (summary). Page PNGs are rendered in memory only.

    venv/bin/python structure_check.py --version 3 --pages calibration,pool --runs 2 --cap 140 --dry-run
    venv/bin/python structure_check.py --version 3 --pages calibration --runs 2 --cap 140
    venv/bin/python structure_check.py --version 3 --pages pool --runs 2 --cap 140 --resume
"""
import argparse
import json
import re
import sys
from pathlib import Path

INGESTION_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(INGESTION_DIR))

from diagram_schema import extract_blocks  # noqa: E402

DOC_ID_V3 = "129a2604-0221-4ba2-af50-42ac641a21a0"
STRUCT_TYPES = ("issue_tree", "flow")
VERDICTS = ("drawn", "not_drawn", "unsure")

# Plan R2.01 Facts: fixed lists. The pool is recomputed at start and any difference printed.
POOL = [26, 28, 32, 33, 34, 39, 40, 41, 42, 49, 50, 51, 62, 82, 87, 89, 91, 92, 95, 96, 99, 102, 103,
        108, 109, 112, 113, 115, 136, 149, 160, 180, 182, 186, 191, 193, 199, 204, 213, 221, 225, 230,
        233, 245, 246]
CALIB_BAD = [11, 13, 14, 238, 52]
CALIB_GOOD = [31, 19, 35, 83, 105, 128, 166, 188]
CALIBRATION = CALIB_BAD + CALIB_GOOD


# ---------------------------------------------------------------- pure: claims

def _struct_blocks(markdown):
    out = []
    for b in extract_blocks(markdown or ""):
        obj = b.get("obj")
        if b.get("in_table") or b.get("parse_error") or not isinstance(obj, dict):
            continue
        if obj.get("type") in STRUCT_TYPES:
            out.append((b, obj))
    return out


def has_struct_block(markdown) -> bool:
    return bool(_struct_blocks(markdown))


def _label(node):
    if isinstance(node, dict):
        lab = node.get("label")
        return lab if isinstance(lab, str) else json.dumps(lab, ensure_ascii=False)
    return str(node)


def _tree_edges(node, out):
    if not isinstance(node, dict):
        return
    for ch in node.get("children") or []:
        out.append((_label(node), _label(ch)))
        _tree_edges(ch, out)


def edge_list(markdown):
    """Returns (edges, summaries).

    edges: [{"id": "E1", "block": i, "from": label, "to": label, "text": 'E1: "a" → "b"'}],
    numbered across the page. Trees: every parent/child pair, root included. Flows: every
    edge; an endpoint id with no node is listed with the raw id (never dropped).
    summaries: [{"i": 0, "block": i, "text": summary}] for each tree/flow block with one."""
    edges, summaries = [], []
    for bi, (b, obj) in enumerate(_struct_blocks(markdown)):
        pairs = []
        if obj["type"] == "issue_tree":
            _tree_edges(obj.get("root"), pairs)
        else:
            labels = {}
            for n in obj.get("nodes") or []:
                if isinstance(n, dict) and "id" in n:
                    labels[n["id"]] = _label(n)
            for e in obj.get("edges") or []:
                if not isinstance(e, dict):
                    continue
                f, t = e.get("from"), e.get("to")
                pairs.append((labels.get(f, f"[node id {f}]"), labels.get(t, f"[node id {t}]")))
        for a, c in pairs:
            eid = f"E{len(edges) + 1}"
            edges.append({"id": eid, "block": bi, "from": a, "to": c,
                          "text": f"{eid}: {json.dumps(a, ensure_ascii=False)} → {json.dumps(c, ensure_ascii=False)}"})
        if b.get("summary"):
            summaries.append({"i": len(summaries), "block": bi, "text": b["summary"]})
    return edges, summaries


def build_prompt(edges, summaries) -> str:
    claims = "\n".join(e["text"] for e in edges) or "(none)"
    sums = "\n".join(f"S{s['i']}: {s['text']}" for s in summaries) or "(none)"
    return f"""You are checking someone else's transcription of the diagram(s) on the attached casebook page.
Do not transcribe the page. Only judge the claims below against what is DRAWN on the image.

Each claim says that the page connects box A to box B ("A" → "B"; for a tree, A is the parent of B).
For each claim answer:
- "drawn": a line, arrow, nesting or bracket on the page joins exactly these two boxes, in this direction
  (for a tree: B sits directly under/inside A, or a line/bracket runs from A to B).
- "not_drawn": the page does not join these two boxes this way (e.g. B hangs from a different box,
  the boxes are just stacked or placed near each other with no connector, or the direction is reversed).
- "unsure": you cannot tell from the image.
Then list under "missing" any connection the page draws between two of the listed labels that no claim covers.

Claims:
{claims}

Summaries (each was written to describe the diagram). For each, answer "ok" if it states only what the page
shows, or "overclaims" if it states anything the page does not show (an added outcome, judgement, branch or step):
{sums}

Reply with JSON only, no prose, in exactly this shape:
{{"edges":[{{"id":"E1","verdict":"drawn"}}],"missing":[{{"from":"…","to":"…"}}],"summaries":[{{"i":0,"verdict":"ok"}}]}}
Answer every claim id. Add a short "why" ONLY for not_drawn, unsure or overclaims verdicts."""


# ---------------------------------------------------------------- pure: reply

_FENCE_RE = re.compile(r"^\s*```[a-zA-Z]*\s*\n?(.*?)\n?\s*```\s*$", re.S)


def parse_reply(text, edge_ids=None, n_summaries=0, finish_reason=None):
    """Parses the model's JSON. Never guesses: a parse failure or a truncated reply
    (finish_reason MAX_TOKENS) returns {"parse_error": ...}. With edge_ids given, a claim
    the reply omits (or answers with an unknown verdict) is recorded as "unsure"; a summary
    with no "ok"/"overclaims" verdict is recorded as "unsure"."""
    if finish_reason == "MAX_TOKENS":
        return {"parse_error": "truncated reply (MAX_TOKENS)"}
    s = (text or "").strip()
    m = _FENCE_RE.match(s)
    if m:
        s = m.group(1).strip()
    try:
        obj = json.loads(s)
    except (ValueError, TypeError) as e:
        return {"parse_error": f"invalid JSON: {e}"}
    if not isinstance(obj, dict):
        return {"parse_error": "reply is not a JSON object"}
    raw_edges = obj.get("edges") if isinstance(obj.get("edges"), list) else []
    by_id = {}
    for e in raw_edges:
        if isinstance(e, dict) and isinstance(e.get("id"), str):
            v = e.get("verdict") if e.get("verdict") in VERDICTS else "unsure"
            by_id.setdefault(e["id"], {"id": e["id"], "verdict": v, "why": e.get("why")})
    if edge_ids is not None:
        edges = [by_id.get(i) or {"id": i, "verdict": "unsure", "why": "no verdict returned"} for i in edge_ids]
    else:
        edges = list(by_id.values())
    missing = [m for m in (obj.get("missing") or []) if isinstance(m, dict)] if isinstance(obj.get("missing"), list) else []
    raw_s = obj.get("summaries") if isinstance(obj.get("summaries"), list) else []
    s_by_i = {}
    for x in raw_s:
        if isinstance(x, dict) and isinstance(x.get("i"), int):
            v = x.get("verdict") if x.get("verdict") in ("ok", "overclaims") else "unsure"
            s_by_i.setdefault(x["i"], {"i": x["i"], "verdict": v, "why": x.get("why")})
    if n_summaries:
        summaries = [s_by_i.get(i) or {"i": i, "verdict": "unsure", "why": "no verdict returned"}
                     for i in range(n_summaries)]
    else:
        summaries = list(s_by_i.values())
    return {"edges": edges, "missing": missing, "summaries": summaries}


def dispute(result) -> bool:
    """True on any not_drawn/unsure edge, any missing connection, any summary that is not
    "ok", or a parse error. unsure counts on purpose: recall matters more than precision."""
    if not isinstance(result, dict) or result.get("parse_error"):
        return True
    if any(e.get("verdict") != "drawn" for e in result.get("edges") or []):
        return True
    if result.get("missing"):
        return True
    return any(s.get("verdict") != "ok" for s in result.get("summaries") or [])


# ---------------------------------------------------------------- pure: report

def page_summary(page_no, recs, edges_text):
    """Union over a page's runs. recs: jsonl records for this page."""
    runs = sorted(recs, key=lambda r: r["run"])
    disputes = [bool(r.get("dispute")) for r in runs]
    not_drawn, unsure, missing, summ, errors = {}, {}, [], [], []
    for r in runs:
        res = r.get("result") or {}
        if r.get("failed"):
            errors.append({"run": r["run"], "error": r.get("error")})
            continue
        if res.get("parse_error"):
            errors.append({"run": r["run"], "error": res["parse_error"]})
        for e in res.get("edges") or []:
            tgt = not_drawn if e["verdict"] == "not_drawn" else unsure if e["verdict"] == "unsure" else None
            if tgt is not None:
                tgt.setdefault(e["id"], {"claim": edges_text.get(e["id"], e["id"]), "runs": [], "why": []})
                tgt[e["id"]]["runs"].append(r["run"])
                if e.get("why"):
                    tgt[e["id"]]["why"].append(e["why"])
        for m in res.get("missing") or []:
            missing.append(dict(m, run=r["run"]))
        for s in res.get("summaries") or []:
            if s.get("verdict") != "ok":
                summ.append(dict(s, run=r["run"]))
    return {"page_no": page_no, "runs": len(runs), "disputed": any(disputes),
            "runs_agree": len(set(disputes)) <= 1, "run_disputes": disputes,
            "not_drawn_edges": list(not_drawn.values()), "unsure_edges": list(unsure.values()),
            "missing": missing, "summary_issues": summ, "errors": errors}


# ---------------------------------------------------------------- CLI

def _load_pages(version):
    from pipeline import get_sb
    sb = get_sb()
    docs = (sb.table("ingest_documents").select("id, ingestion_version, source_file")
            .eq("id", DOC_ID_V3).limit(1).execute().data)
    if not docs or docs[0]["ingestion_version"] != version:
        raise RuntimeError(f"v{version} doc {DOC_ID_V3} not found")
    rows = (sb.table("ingest_pages").select("page_no, markdown, needs_review, review_reasons")
            .eq("document_id", DOC_ID_V3).order("page_no").execute().data)
    return docs[0], {r["page_no"]: r for r in rows}


def recompute_pool(pages, reviewed):
    return sorted(n for n, p in pages.items()
                  if not p.get("needs_review") and n not in reviewed and has_struct_block(p.get("markdown")))


def _parse_pages(arg):
    out = []
    for part in arg.split(","):
        part = part.strip()
        if part == "calibration":
            out += CALIBRATION
        elif part == "pool":
            out += POOL
        elif part:
            out.append(int(part))
    seen, res = set(), []
    for n in out:
        if n not in seen:
            seen.add(n)
            res.append(n)
    return res


def build_report(records, pages, doc_id, version):
    from run_repilot import vision_cost
    by_page = {}
    for r in records:
        by_page.setdefault(r["page_no"], []).append(r)

    def summ(n):
        edges, _ = edge_list(pages[n].get("markdown"))
        return page_summary(n, by_page.get(n, []), {e["id"]: e["text"] for e in edges})

    per_page = []
    for n in CALIBRATION:
        if n in by_page:
            per_page.append(dict(summ(n), truth="bad" if n in CALIB_BAD else "good"))
    bad = [p for p in per_page if p["truth"] == "bad"]
    good = [p for p in per_page if p["truth"] == "good"]
    calls = sum(int(r.get("http_calls") or 0) for r in records)
    return {
        "doc_id": doc_id, "version": version,
        "calibration": {
            "recall": f"{sum(p['disputed'] for p in bad)}/{len(bad)}",
            "false_dispute_rate": f"{sum(p['disputed'] for p in good)}/{len(good)}",
            "per_page": per_page,
        },
        "pool": [summ(n) for n in POOL if n in by_page],
        "calls": {"vision": calls, "est_cost_usd": round(vision_cost(calls), 4),
                  "models": sorted({r.get("model") for r in records if r.get("model")})},
    }


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Gemini structure check of tree/flow blocks (read-only)")
    ap.add_argument("--version", type=int, default=3)
    ap.add_argument("--pages", required=True, help="comma list of page numbers and/or 'calibration', 'pool'")
    ap.add_argument("--runs", type=int, default=2)
    ap.add_argument("--cap", type=int, default=140, help="vision HTTP calls across all resumes")
    ap.add_argument("--max-tokens", type=int, default=4000)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--resume", action="store_true")
    args = ap.parse_args(argv)

    from config import RENDER_DPI, VISION_MODELS
    from run_repilot import OUT_DIR, append_jsonl, read_jsonl, vision_cost

    doc, pages = _load_pages(args.version)
    reviewed = {p["page_no"] for p in json.loads((OUT_DIR / "r1_review_v3.json").read_text())["pages"]}
    live = recompute_pool(pages, reviewed)
    if live != sorted(POOL):
        print(f"POOL DIFFERS from plan list: only-live {sorted(set(live) - set(POOL))} "
              f"only-plan {sorted(set(POOL) - set(live))} (using the plan list)")
    else:
        print(f"pool recomputed: {len(live)} pages, matches the plan list")

    wanted = _parse_pages(args.pages)
    jsonl = OUT_DIR / "r2_structure_check.jsonl"
    records = read_jsonl(jsonl)
    done = {(r["page_no"], r["run"]) for r in records}
    prior = sum(int(r.get("http_calls") or 0) for r in records)
    todo = []
    for n in wanted:
        edges, sums = edge_list(pages[n].get("markdown"))
        print(f"  p{n}: {len(edges)} claims, {len(sums)} summaries")
        for run in range(1, args.runs + 1):
            if (n, run) not in done:
                todo.append((n, run, edges, sums))
    print(f"projected calls: {len(wanted)} pages x {args.runs} runs = {len(wanted) * args.runs}; "
          f"still to do {len(todo)}; already spent {prior}; cap {args.cap}; "
          f"≈ ${vision_cost(prior + len(todo)):.3f}")
    if prior + len(todo) > args.cap:
        print("ABORT: projected calls over cap")
        return 1
    if args.dry_run:
        print("DRY RUN: 0 Gemini calls, 0 DB writes.")
        return 0
    if records and not args.resume:
        print(f"ABORT: {jsonl.name} exists; pass --resume")
        return 1

    import pypdfium2 as pdfium
    from page_classify import render_page_png
    from gemini_client import BudgetExceeded, VisionCallError, call_count, set_vision_cap, transcribe_page
    from run_repilot import DEFAULT_PDF

    set_vision_cap(args.cap - prior)
    pdf = pdfium.PdfDocument(str(DEFAULT_PDF))
    png_cache = {}
    for i, (n, run, edges, sums) in enumerate(todo, 1):
        if n not in png_cache:
            png_cache = {n: render_page_png(pdf[n - 1], RENDER_DPI)}
        before = call_count["vision"]
        rec = {"page_no": n, "run": run}
        try:
            text, meta = transcribe_page(png_cache[n], build_prompt(edges, sums), max_tokens=args.max_tokens,
                                         return_meta=True, max_http=len(VISION_MODELS))
            res = parse_reply(text, [e["id"] for e in edges], len(sums), meta.get("finish_reason"))
            rec.update(http_calls=meta["http_calls"], model=meta["model"],
                       finish_reason=meta.get("finish_reason"), result=res, dispute=dispute(res))
            if res.get("parse_error"):
                rec["raw_reply"] = (text or "")[:2000]
        except BudgetExceeded as e:
            spent = call_count["vision"] - before
            if spent:
                append_jsonl(jsonl, dict(rec, http_calls=spent, failed=True, error=str(e), dispute=True))
            print(f"STOP: {e}")
            break
        except VisionCallError as e:
            rec.update(http_calls=call_count["vision"] - before, failed=True, error=str(e)[:300], dispute=True,
                       result={"parse_error": "call failed"})
        append_jsonl(jsonl, rec)
        print(f"[{i}/{len(todo)}] p{n} run{run}: calls={rec['http_calls']} model={rec.get('model')} "
              f"dispute={rec['dispute']} total={prior + call_count['vision']}", flush=True)

    records = read_jsonl(jsonl)
    report = build_report(records, pages, doc["id"], args.version)
    (OUT_DIR / "r2_structure_check.json").write_text(json.dumps(report, indent=1, ensure_ascii=False))
    c = report["calibration"]
    print(f"calibration recall {c['recall']}, false disputes {c['false_dispute_rate']}; "
          f"pool {len(report['pool'])} pages, disputed {sum(p['disputed'] for p in report['pool'])}; "
          f"calls {report['calls']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

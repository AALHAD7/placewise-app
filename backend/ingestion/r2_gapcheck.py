"""R2.09: dry run of the gap-closure rules on v4 against the pre-registered gates (read-only).

Loads every v4 page (SELECT only; 0 Gemini calls, 0 DB writes), runs the new
postprocess_markdown (invented-text strips + anchored prose repair) and check_page
(seq_diff, invented_text, framework_as_text) on the stored v4 markdown with the cached
label_lines (as run_v4.label_lines_for), adds structure_unreviewed, and scores the gates
fixed in .gsd/phases/R2/09-PLAN.md before any result was seen:

  G1  the 6 missed sample pages + 129/203/210: every cited error repaired (string check
      after quote folding) or the page gets seq_diff; p150 also gets invented_text. 9/9.
  G2  the 13 faithful R2 sample pages: 0 repairs, 0 strips except logo placeholders and
      link brackets; seq_diff on <= 2 of them.
  G3  every repair on the 121 calibration pages is listed; automatic check: the repaired
      line has fewer token trigrams the text layer does not print than before.
      A human check of the same list is recorded in the report.
  G4  seq_diff newly flags <= 40% of the pages unflagged in v4.
  G5  unprinted logo placeholders 0 after; leftover link brackets 0 after; p23 block title
      null; p77 italic captions removed; titles nulled on calibration pages listed.
  G6  15, 56, 67, 69, 71, 228 flagged by framework_as_text or an existing flag.

Holdout pages (v4 pages outside the calibration set) are reported as counts only.

    venv/bin/python r2_gapcheck.py                      # read v4 from the DB
    venv/bin/python r2_gapcheck.py --snapshot FILE      # same, from a saved JSON snapshot

Writes out/r2_gapcheck.json. Exit 0 = GATES PASS, 1 = a gate failed, 2 = could not load.
"""
import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

INGESTION_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(INGESTION_DIR))

from diagram_schema import FENCE_INFO, extract_blocks  # noqa: E402
from fidelity import check_page  # noqa: E402
from postprocess import postprocess_markdown  # noqa: E402
from seqdiff import _TOKEN_RE, _key, boilerplate_lines  # noqa: E402
from textnorm import _BRACKET_RE, _KEEP_BRACKETS, PageText, _is_placeholder, _outside_blocks, fold_quotes  # noqa: E402

OUT = INGESTION_DIR / "out"
V4_DOC_ID = "d1510e35-9ecc-419b-a497-85a37e062792"
CALIBRATION_FILES = ("r1_review.json", "r1_review_v3.json", "r2_sweep_a.json", "r2_sweep_b.json", "r2_sample.json")
PASS_FILES = ("r1_review_v3.json", "r2_sweep_a.json", "r2_sweep_b.json")
MISSED = [135, 137, 143, 150, 183, 231]
EXTRA_P1 = [129, 203, 210]
# Repair strings: G1 as written in the plan; 129/203/210 from r2_sample_review page_shows.
G1_STRINGS = {
    137: ["decline in profits for the steel industry players"],
    150: ["which I'm sure", "might cause a hit"],
    231: ["What would the exit process", "Do we have"],
    143: ["quality of the coal procured"],
    135: ["regarding this."],
    183: ["library Should"],
    129: ["are they facing the same problem?"],
    203: ["I'd like you to only focus"],
    210: ["due to our praying services"],
}
FAITHFUL = [2, 3, 5, 38, 85, 120, 121, 200, 223, 237, 243, 244, 247]
G2_ALLOWED_STRIPS = ("placeholder", "link_bracket")
G2_SEQ_MAX = 2
G4_SHARE_MAX = 0.40
G6_PAGES = [15, 56, 67, 69, 71, 228]
P77_CAPTIONS = ["Donut Chart visual representation", "(Horizontal Bar Chart)", "(Icons for"]
STRUCT_TYPES = ("issue_tree", "flow")
PAGE_COLS = ("id, page_no, is_text, is_table, is_visual, is_scanned, text_layer, markdown, method, "
             "needs_review, review_reasons")


# ---------------------------------------------------------------- pure

def calibration_pages(review_docs) -> set:
    return {p["page_no"] for d in review_docs for p in d.get("pages") or []}


def reviewed_pass_set(pass_docs, sample_review) -> set:
    """Pages a human passed: verdict 'pass' in the R1/R2 reviews, plus R2 sample pages with
    outcome 'faithful'."""
    out = {p["page_no"] for d in pass_docs for p in d.get("pages") or [] if p.get("verdict") == "pass"}
    out |= {p["page_no"] for p in (sample_review or {}).get("pages") or [] if p.get("outcome") == "faithful"}
    return out


def _has_structure(obj) -> bool:
    if not isinstance(obj, dict) or obj.get("type") not in STRUCT_TYPES:
        return False
    if obj.get("type") == "flow":
        return bool(obj.get("edges")) or bool(obj.get("nodes"))
    return bool(((obj.get("root") or {}).get("children")))


def structure_unreviewed(pages, reviewed_pass) -> list:
    """page_nos with an issue_tree or flow block (with children or edges/nodes) that no
    human has passed. `pages`: dicts with page_no and markdown."""
    out = []
    for p in pages:
        if p["page_no"] in reviewed_pass:
            continue
        if any(b["fence"] == FENCE_INFO and _has_structure(b["obj"]) for b in extract_blocks(p.get("markdown") or "")):
            out.append(p["page_no"])
    return sorted(out)


def contains_folded(md: str, s: str) -> bool:
    norm = lambda t: re.sub(r"\s+", " ", fold_quotes(t or ""))  # noqa: E731
    return norm(s) in norm(md)


def g1_page(md: str, reasons, strings) -> dict:
    repaired = all(contains_folded(md, s) for s in strings)
    flagged = "seq_diff" in (reasons or [])
    return {"repaired": repaired, "seq_diff": flagged, "ok": repaired or flagged}


def g2_result(per_page: dict, faithful) -> dict:
    """per_page: {n: {"repairs": [...], "strips": [(kind, b, a)], "reasons_new": [...], "reasons": [...]}}"""
    bad_repairs = [n for n in faithful if per_page[n]["repairs"]]
    bad_strips = [n for n in faithful if any(s[0] not in G2_ALLOWED_STRIPS for s in per_page[n]["strips"])]
    seq = [n for n in faithful if "seq_diff" in per_page[n]["reasons"]]
    return {"pages_with_repairs": bad_repairs, "pages_with_other_strips": bad_strips, "seq_diff_pages": seq,
            "ok": not bad_repairs and not bad_strips and len(seq) <= G2_SEQ_MAX}


def _trigram_misses(line: str, tl_grams: set) -> int:
    keys = [_key(m.group(0)) for m in _TOKEN_RE.finditer(line or "")]
    return sum(1 for g in zip(keys, keys[1:], keys[2:]) if g not in tl_grams)


def repair_improves(before: str, after: str, text_layer: str) -> bool:
    """The repaired line has fewer token trigrams that the text layer does not print."""
    tl_keys = [_key(m.group(0)) for m in _TOKEN_RE.finditer(text_layer or "")]
    grams = set(zip(tl_keys, tl_keys[1:], tl_keys[2:]))
    return _trigram_misses(after, grams) < _trigram_misses(before, grams)


def g4_result(v4_unflagged: list, seq_pages: set) -> dict:
    hit = [n for n in v4_unflagged if n in seq_pages]
    share = len(hit) / len(v4_unflagged) if v4_unflagged else 0.0
    return {"v4_unflagged": len(v4_unflagged), "seq_diff_added": len(hit), "share": round(share, 4),
            "ok": share <= G4_SHARE_MAX}


def unprinted_placeholders(md: str, pt: PageText) -> list:
    out = []
    for seg, is_block in _outside_blocks(md or ""):
        if is_block:
            continue
        for m in _BRACKET_RE.finditer(seg):
            inner = m.group(1)
            if _is_placeholder(inner) and not pt.on_page(inner) and not pt.prints_bracketed(inner):
                out.append(m.group(0))
    return out


def leftover_link_brackets(md: str, pt: PageText) -> list:
    out = []
    for seg, is_block in _outside_blocks(md or ""):
        if is_block:
            continue
        for m in _BRACKET_RE.finditer(seg):
            inner = m.group(1)
            if inner.strip().lower() in _KEEP_BRACKETS or pt.prints_bracketed(inner) or _is_placeholder(inner):
                continue
            if pt.on_page(inner):
                out.append(m.group(0))
    return out


def block_titles(md: str) -> list:
    return [b["obj"].get("title") for b in extract_blocks(md or "")
            if b["fence"] == FENCE_INFO and isinstance(b["obj"], dict)]


def g6_result(final_reasons: dict, new_reasons: dict, pages) -> dict:
    per = {n: {"framework_as_text": "framework_as_text" in new_reasons.get(n, []),
               "flagged": bool(final_reasons.get(n))} for n in pages}
    return {"pages": per, "ok": all(v["framework_as_text"] or v["flagged"] for v in per.values())}


# ---------------------------------------------------------------- load

def load_db():
    from pipeline import get_sb
    from run_v4 import label_lines_for
    from run_patch import load_v2_label_lines
    sb = get_sb()
    doc = (sb.table("ingest_documents").select("id, source_file, ingestion_version, source_class, page_count")
           .eq("id", V4_DOC_ID).limit(1).execute().data)
    if not doc:
        raise RuntimeError("v4 document not found")
    doc = doc[0]
    rows, start = [], 0
    while True:
        r = (sb.table("ingest_pages").select(PAGE_COLS).eq("document_id", V4_DOC_ID)
             .order("page_no").range(start, start + 99).execute().data)
        rows += r
        if len(r) < 100:
            break
        start += 100
    v1 = (sb.table("ingest_documents").select("id").eq("source_file", doc["source_file"])
          .eq("ingestion_version", 1).limit(1).execute().data)
    v1_pages = (sb.table("ingest_pages").select("page_no, text_layer, markdown").eq("document_id", v1[0]["id"])
                .order("page_no").execute().data) if v1 else []
    return doc, rows, v1_pages, label_lines_for, load_v2_label_lines


def load_snapshot(path):
    from run_v4 import label_lines_for
    from run_patch import load_v2_label_lines
    d = json.loads(Path(path).read_text())
    return d["doc"], d["rows"], d["v1_pages"], label_lines_for, load_v2_label_lines


# ---------------------------------------------------------------- main

def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="R2.09 read-only gap check on v4")
    ap.add_argument("--snapshot", default=None, help="JSON with doc, rows, v1_pages (instead of the DB)")
    ap.add_argument("--out", default=str(OUT / "r2_gapcheck.json"))
    args = ap.parse_args(argv)
    try:
        doc, rows, v1_pages, label_lines_for, load_ll = load_snapshot(args.snapshot) if args.snapshot else load_db()
    except Exception as e:  # noqa: BLE001
        print(f"ABORT: could not load v4 ({type(e).__name__}: {str(e)[:200]})")
        return 2
    if doc["id"] != V4_DOC_ID or doc.get("ingestion_version") != 4 or doc.get("source_class") != "club_casebook":
        print(f"ABORT: unexpected document {doc}")
        return 2
    print(f"v4 doc {doc['id']}: {len(rows)} pages (read-only, 0 Gemini calls)")

    reviews = {f: json.loads((OUT / f).read_text()) for f in CALIBRATION_FILES}
    calib = calibration_pages(reviews.values())
    sample_review = json.loads((OUT / "r2_sample_review.json").read_text())
    reviewed_pass = reviewed_pass_set([reviews[f] for f in PASS_FILES], sample_review)
    v3_ll = load_ll(OUT / "r1_pages_v3.jsonl")
    v2_ll = load_ll(OUT / "r1_pages_v2.jsonl")
    v1_by_no = {p["page_no"]: p for p in v1_pages}
    v1_ll = {r["page_no"]: postprocess_markdown(v1_by_no[r["page_no"]].get("markdown") or "",
                                                v1_by_no[r["page_no"]].get("text_layer") or "")[1]
             for r in rows if r.get("method") == "fallback_v1" and r["page_no"] in v1_by_no}
    bp = boilerplate_lines([r.get("text_layer") or "" for r in rows])
    print(f"calibration pages {len(calib)}; holdout {len(rows) - len(calib)}; reviewed-pass {len(reviewed_pass)}; "
          f"boilerplate lines {len(bp)}")

    per, new_md = {}, {}
    for r in rows:
        n, tl, md0 = r["page_no"], r.get("text_layer") or "", r.get("markdown") or ""
        seq_log, inv_log, typo_log, hash_log = [], [], [], []
        md = postprocess_markdown(md0, tl, typo_log=typo_log, hash_log=hash_log, seq_log=seq_log,
                                  invented_log=inv_log, boilerplate=bp)[0]
        fid = check_page(tl, md, bool(r.get("is_scanned")), n, label_lines=label_lines_for(r, v3_ll, v2_ll, v1_ll),
                         boilerplate=bp, is_visual=bool(r.get("is_visual")))
        v4r = list(r.get("review_reasons") or [])
        new = [x for x in fid["review_reasons"] if x not in v4r]
        new_md[n] = md
        per[n] = {"calibration": n in calib, "changed": md != md0, "repairs": seq_log,
                  "strips": [list(s) for s in inv_log], "reasons_v4": v4r, "reasons_new": new,
                  "seq_diff_ops": fid.get("seq_diff_ops"), "reasons": v4r + new}
    su = structure_unreviewed([{"page_no": n, "markdown": new_md[n]} for n in per], reviewed_pass)
    for n in su:
        if "structure_unreviewed" not in per[n]["reasons"]:
            per[n]["reasons_new"].append("structure_unreviewed")
            per[n]["reasons"].append("structure_unreviewed")

    gates = {}
    # G1
    g1 = {}
    for n in MISSED + EXTRA_P1:
        g1[n] = g1_page(new_md[n], per[n]["reasons"], G1_STRINGS[n])
    g1[150]["invented_text"] = "invented_text" in per[150]["reasons"]
    g1[150]["ok"] = g1[150]["ok"] and g1[150]["invented_text"]
    ok1 = sum(1 for v in g1.values() if v["ok"])
    gates["G1"] = {"pages": g1, "score": f"{ok1}/{len(g1)}", "ok": ok1 == len(g1)}
    # G2
    gates["G2"] = g2_result(per, FAITHFUL)
    # G3
    tl_by = {r["page_no"]: r.get("text_layer") or "" for r in rows}
    reps = [{"page_no": n, "before": b, "after": a, "improves": repair_improves(b, a, tl_by[n])}
            for n in sorted(per) if per[n]["calibration"] for b, a in per[n]["repairs"]]
    worse = [x for x in reps if not x["improves"]]
    gates["G3"] = {"repairs": reps, "auto_not_improved": len(worse), "ok": not worse,
                   "note": "automatic proxy; human check recorded in the plan report"}
    # G4
    v4_unflagged = [r["page_no"] for r in rows if not r.get("needs_review")]
    seq_pages = {n for n in per if "seq_diff" in per[n]["reasons_new"]}
    gates["G4"] = g4_result(v4_unflagged, seq_pages)
    # G5
    pts = {r["page_no"]: PageText(r.get("text_layer") or "") for r in rows}
    ph_before = [r["page_no"] for r in rows if unprinted_placeholders(r.get("markdown"), pts[r["page_no"]])]
    ph_after = [n for n in per if unprinted_placeholders(new_md[n], pts[n])]
    lb_before = [r["page_no"] for r in rows if leftover_link_brackets(r.get("markdown"), pts[r["page_no"]])]
    lb_after = [n for n in per if leftover_link_brackets(new_md[n], pts[n])]
    p23_titles = block_titles(new_md[23])
    p77_left = [c for c in P77_CAPTIONS if c in new_md[77]]
    calib_titles = [{"page_no": n, "title": s[1]} for n in sorted(per) if per[n]["calibration"]
                    for s in per[n]["strips"] if s[0] == "block_title"]
    printed_changed = [t for t in calib_titles if pts[t["page_no"]].on_page(t["title"])]
    gates["G5"] = {"placeholder_pages_before": len(ph_before), "placeholder_pages_after": ph_after,
                   "link_bracket_pages_before": len(lb_before), "link_bracket_pages_after": lb_after,
                   "p23_titles": p23_titles, "p77_captions_left": p77_left,
                   "calibration_titles_nulled": calib_titles, "printed_titles_changed": printed_changed,
                   "ok": (not ph_after and not lb_after and p23_titles and all(t is None for t in p23_titles)
                          and not p77_left and not printed_changed)}
    # G6
    final = {n: per[n]["reasons"] for n in per}
    gates["G6"] = g6_result(final, {n: per[n]["reasons_new"] for n in per}, G6_PAGES)
    fw_new_unflagged = [n for n in v4_unflagged if "framework_as_text" in per[n]["reasons_new"]]
    gates["G6"]["framework_as_text_newly_flags_v4_unflagged"] = len(fw_new_unflagged)

    # Counts (holdout as counts only)
    def count(reason, pages):
        return sum(1 for n in pages if reason in per[n]["reasons_new"])
    holdout = [n for n in per if not per[n]["calibration"]]
    counts = {}
    for reason in ("seq_diff", "invented_text", "framework_as_text", "structure_unreviewed"):
        counts[reason] = {"all": count(reason, per), "holdout": count(reason, holdout),
                          "v4_unflagged": count(reason, v4_unflagged)}
    counts["pages_repaired"] = {"all": sum(1 for n in per if per[n]["repairs"]),
                                "holdout": sum(1 for n in holdout if per[n]["repairs"])}
    counts["repairs"] = {"all": sum(len(per[n]["repairs"]) for n in per),
                         "holdout": sum(len(per[n]["repairs"]) for n in holdout)}
    strip_kinds = Counter(s[0] for n in per for s in per[n]["strips"])
    counts["strips_by_kind"] = dict(strip_kinds)
    counts["strips_by_kind_holdout"] = dict(Counter(s[0] for n in holdout for s in per[n]["strips"]))
    nr4 = sum(1 for r in rows if r.get("needs_review"))
    nr5 = sum(1 for n in per if per[n]["reasons"])
    counts["needs_review"] = {"v4": nr4, "projected_v5": nr5,
                              "projected_v5_holdout": sum(1 for n in holdout if per[n]["reasons"])}
    counts["structure_unreviewed_pages"] = len(su)
    counts["structure_unreviewed_v4_unflagged"] = sum(1 for n in su if n in v4_unflagged)

    failed = [g for g, v in gates.items() if not v["ok"]]
    out = {"document_id": V4_DOC_ID, "plan": "R2.09", "gemini_calls": 0, "db_writes": 0,
           "calibration_pages": sorted(calib), "boilerplate_lines": sorted(bp), "gates": gates,
           "counts": counts, "pages": {str(n): per[n] for n in sorted(per)},
           "result": "GATES PASS" if not failed else f"GATES FAIL: {', '.join(failed)}"}
    Path(args.out).write_text(json.dumps(out, indent=2, ensure_ascii=False, default=str))

    print("\nCalibration repairs (G3):")
    for x in reps:
        print(f"  p{x['page_no']:<4} improves={x['improves']}")
        print(f"     - {x['before']}")
        print(f"     + {x['after']}")
    print("\nCalibration strips:")
    for n in sorted(per):
        if per[n]["calibration"] and per[n]["strips"]:
            print(f"  p{n:<4} " + "; ".join(f"{k}: {b!r} -> {a!r}" for k, b, a in per[n]["strips"]))
    print("\nGate                        result")
    print(f"  G1 missed/pattern-1 pages  {gates['G1']['score']}  "
          + " ".join(f"p{n}:{'R' if v['repaired'] else ''}{'S' if v['seq_diff'] else ''}{'' if v['ok'] else '!'}"
                     for n, v in g1.items()) + f"  p150 invented_text={g1[150]['invented_text']}  "
          + ("PASS" if gates["G1"]["ok"] else "FAIL"))
    g2 = gates["G2"]
    print(f"  G2 faithful pages          repairs on {g2['pages_with_repairs']}, other strips on "
          f"{g2['pages_with_other_strips']}, seq_diff on {len(g2['seq_diff_pages'])}/13 {g2['seq_diff_pages']}  "
          + ("PASS" if g2["ok"] else "FAIL"))
    print(f"  G3 calibration repairs     {len(reps)} repairs, {len(worse)} not improving (auto)  "
          + ("PASS" if gates["G3"]["ok"] else "FAIL"))
    g4 = gates["G4"]
    print(f"  G4 seq_diff noise          {g4['seq_diff_added']}/{g4['v4_unflagged']} v4-unflagged pages "
          f"= {g4['share']:.1%} (max 40%)  " + ("PASS" if g4["ok"] else "FAIL"))
    g5 = gates["G5"]
    print(f"  G5 invented text           placeholder pages {g5['placeholder_pages_before']} -> "
          f"{len(g5['placeholder_pages_after'])}; link-bracket pages {g5['link_bracket_pages_before']} -> "
          f"{len(g5['link_bracket_pages_after'])}; p23 titles {g5['p23_titles']}; p77 captions left "
          f"{g5['p77_captions_left']}; printed titles changed {len(g5['printed_titles_changed'])}  "
          + ("PASS" if g5["ok"] else "FAIL"))
    g6 = gates["G6"]
    print(f"  G6 framework pages         " + " ".join(
        f"p{n}:{'F' if v['framework_as_text'] else ''}{'flagged' if v['flagged'] else 'UNFLAGGED'}"
        for n, v in g6["pages"].items()) + f"; framework_as_text newly flags "
          f"{g6['framework_as_text_newly_flags_v4_unflagged']} v4-unflagged pages  "
          + ("PASS" if g6["ok"] else "FAIL"))
    print("\nCounts (new reasons)   all  holdout  v4-unflagged")
    for reason in ("seq_diff", "invented_text", "framework_as_text", "structure_unreviewed"):
        c = counts[reason]
        print(f"  {reason:<22}{c['all']:>4}{c['holdout']:>9}{c['v4_unflagged']:>14}")
    print(f"  repairs {counts['repairs']['all']} on {counts['pages_repaired']['all']} pages "
          f"(holdout: {counts['repairs']['holdout']} on {counts['pages_repaired']['holdout']} pages)")
    print(f"  strips by kind {counts['strips_by_kind']} (holdout {counts['strips_by_kind_holdout']})")
    print(f"  structure_unreviewed pages {len(su)} ({counts['structure_unreviewed_v4_unflagged']} unflagged in v4)")
    print(f"  needs_review v4 {nr4} -> projected v5 {nr5}")
    print(f"\nwrote {args.out}")
    print(out["result"])
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())

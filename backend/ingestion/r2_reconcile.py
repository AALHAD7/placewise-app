"""R2.05: score the Gemini structure check (R2.01) against the blind eyeball sweep (R2.02/R2.03).

Ground truth "structure-bad" = a sweep page with any structure_lost / hallucinated mismatch, or an
altered *summary*, plus the 5 known-bad calibration pages. "Good" = sweep pass pages + the 8
known-good calibration pages. Sweep fails with only non-structural issues (e.g. a typo) are in
neither set and are left out of the metrics.

Adoption rule (fixed in the plan before the numbers were seen): adopt if recall >= 0.80 AND
false-dispute rate <= 0.40.

Flags: every disputed v3 page not already needs_review gets needs_review = true and the reason
"structure_check:dispute". Never unflags, never sets review_status, never touches v1/v2 rows.
Before-values go to out/r2_reconcile_flags_before.json, merged by page id (a saved row is
never overwritten). Aborts unless DOC_ID_V3 is ingestion_version 3 or if a target page is missing.

    venv/bin/python r2_reconcile.py               # compute, flag, write out/r2_reconcile.json
    venv/bin/python r2_reconcile.py --dry-run     # compute and print, no DB writes
    venv/bin/python r2_reconcile.py --report-only # re-print out/r2_reconcile.json, no DB access
"""
import argparse
import json
import sys
from pathlib import Path

INGESTION_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(INGESTION_DIR))

from structure_check import CALIB_BAD, CALIB_GOOD, DOC_ID_V3, POOL  # noqa: E402

OUT = INGESTION_DIR / "out"
REASON = "structure_check:dispute"
RECALL_MIN = 0.80
FALSE_DISPUTE_MAX = 0.40
STRUCT_TYPES = ("structure_lost", "hallucinated")


# ---------------------------------------------------------------- pure

def is_structure_bad(page) -> bool:
    for m in page.get("mismatches") or []:
        t = m.get("type")
        if t in STRUCT_TYPES:
            return True
        if t == "altered" and "summary" in str(m.get("item", "")).lower():
            return True
    return False


def sweep_truth(sweep_pages):
    """{page_no: 'bad' | 'good' | 'other'} for role == 'sweep' pages."""
    out = {}
    for p in sweep_pages:
        if p.get("role") != "sweep":
            continue
        if p.get("verdict") == "pass":
            out[p["page_no"]] = "good"
        elif is_structure_bad(p):
            out[p["page_no"]] = "bad"
        else:
            out[p["page_no"]] = "other"
    return out


def compute(sweep_pages, check, pool=POOL, calib_bad=CALIB_BAD, calib_good=CALIB_GOOD):
    truth = sweep_truth(sweep_pages)
    for n in calib_bad:
        truth[n] = "bad"
    for n in calib_good:
        truth[n] = "good"
    per = {p["page_no"]: p for p in list(check["calibration"]["per_page"]) + list(check["pool"])}
    disputed = {n for n, p in per.items() if p.get("disputed")}

    bad = sorted(n for n, t in truth.items() if t == "bad" and n in per)
    good = sorted(n for n, t in truth.items() if t == "good" and n in per)
    other = sorted(n for n, t in truth.items() if t == "other")
    caught = [n for n in bad if n in disputed]
    false_disp = [n for n in good if n in disputed]
    recall = round(len(caught) / len(bad), 4) if bad else None
    fdr = round(len(false_disp) / len(good), 4) if good else None

    two_runs = [p for p in per.values() if p.get("runs", 0) >= 2]
    agree = [p["page_no"] for p in two_runs if p.get("runs_agree")]
    disagree = sorted(p["page_no"] for p in two_runs if not p.get("runs_agree"))

    sweep_fail = sorted(n for n, t in truth.items() if t in ("bad", "other") and n in pool)
    sweep_pass = sorted(n for n, t in truth.items() if t == "good" and n in pool)
    two_by_two = {
        "reviewer_fail__check_disputed": [n for n in sweep_fail if n in disputed],
        "reviewer_fail__check_clean": [n for n in sweep_fail if n not in disputed],
        "reviewer_pass__check_disputed": [n for n in sweep_pass if n in disputed],
        "reviewer_pass__check_clean": [n for n in sweep_pass if n not in disputed],
    }
    adopt = bool(recall is not None and fdr is not None and recall >= RECALL_MIN and fdr <= FALSE_DISPUTE_MAX)
    return {
        "doc_id": check.get("doc_id", DOC_ID_V3),
        "ground_truth": {"bad": bad, "good": good, "excluded_non_structural_fail": other},
        "recall": recall, "recall_frac": f"{len(caught)}/{len(bad)}", "missed_bad": [n for n in bad if n not in disputed],
        "false_dispute_rate": fdr, "false_dispute_frac": f"{len(false_disp)}/{len(good)}", "false_disputes": false_disp,
        "run_agreement": f"{len(agree)}/{len(two_runs)}", "runs_disagree": disagree,
        "two_by_two_pool": two_by_two,
        "two_by_two_counts": {k: len(v) for k, v in two_by_two.items()},
        "rule": f"adopt if recall >= {RECALL_MIN} and false_dispute_rate <= {FALSE_DISPUTE_MAX}",
        "adopt": adopt,
        "disputed_pages": sorted(disputed),
        "check_calls": check.get("calls"),
    }


def merge_before_rows(existing, new_rows):
    """Review hardening: the before-values file is keyed by page id. Rows already
    saved are never overwritten (they hold the true pre-flag values); only rows
    for page ids not yet saved are appended. Returns the merged list."""
    saved = {r["id"] for r in existing}
    return list(existing) + [r for r in new_rows if r["id"] not in saved]


def plan_flags(disputed, rows):
    """rows: {page_no: row}. Disputed pages not already needs_review -> to flag."""
    return sorted(n for n in disputed if n in rows and not rows[n].get("needs_review"))


# ---------------------------------------------------------------- report

def print_summary(r):
    print(f"recall {r['recall_frac']} = {r['recall']}  missed: {r['missed_bad']}")
    print(f"false-dispute {r['false_dispute_frac']} = {r['false_dispute_rate']}  pages: {r['false_disputes']}")
    print(f"run-to-run agreement {r['run_agreement']}  disagree: {r['runs_disagree']}")
    print(f"excluded (non-structural sweep fail): {r['ground_truth']['excluded_non_structural_fail']}")
    print("2x2 on the 45-page pool (reviewer x check):")
    for k, v in r["two_by_two_pool"].items():
        print(f"  {k}: {len(v)} {v}")
    print(f"{r['rule']} -> adopt = {r['adopt']}")
    f = r.get("flags", {})
    print(f"flags written this run: {f.get('written', [])}; pages carrying {REASON}: {f.get('carrying_reason')}; "
          f"dry_run={f.get('dry_run')}")
    pc = r.get("pool_close")
    if pc:
        print(f"pool {pc['pool']}: reviewed-pass-and-undisputed {len(pc['pass_undisputed'])}, flagged {len(pc['flagged'])}, "
              f"neither {pc['neither']}")
        for reason, pages in pc["flag_reasons"].items():
            print(f"  {reason}: {pages}")


# ---------------------------------------------------------------- main

def assert_v3_doc(sb):
    """Abort unless DOC_ID_V3 really is ingestion_version 3 (this script only ever writes v3)."""
    d = (sb.table("ingest_documents").select("id,ingestion_version").eq("id", DOC_ID_V3)
         .limit(1).execute().data)
    if not d or d[0].get("ingestion_version") != 3:
        raise SystemExit(f"ABORT: {DOC_ID_V3} is not ingestion_version 3 ({d[0].get('ingestion_version') if d else 'missing'})")


def _rows(sb, pages):
    data = (sb.table("ingest_pages").select("id,page_no,needs_review,review_reasons,review_status")
            .eq("document_id", DOC_ID_V3).in_("page_no", pages).execute().data)
    return {x["page_no"]: x for x in data}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--report-only", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args(argv)
    out_path = OUT / "r2_reconcile.json"
    if a.report_only:
        print_summary(json.loads(out_path.read_text()))
        return 0

    sweep = []
    for f in ("r2_sweep_a.json", "r2_sweep_b.json"):
        sweep += json.loads((OUT / f).read_text())["pages"]
    check = json.loads((OUT / "r2_structure_check.json").read_text())
    r = compute(sweep, check)

    from pipeline import get_sb
    sb = get_sb()
    assert_v3_doc(sb)
    targets = sorted(set(POOL) | set(CALIB_BAD) | set(CALIB_GOOD))
    rows = _rows(sb, targets)
    missing = sorted(set(targets) - set(rows))
    if missing:
        raise SystemExit(f"ABORT: v3 has no row for page(s) {missing}")
    to_flag = plan_flags(set(r["disputed_pages"]), rows)

    before_path = OUT / "r2_reconcile_flags_before.json"
    written = []
    if not a.dry_run and to_flag:
        saved = json.loads(before_path.read_text()) if before_path.exists() else {
            "document_id": DOC_ID_V3, "ingestion_version": 3, "plan": "R2.05", "rows": []}
        if saved.get("document_id") != DOC_ID_V3:
            raise SystemExit(f"ABORT: {before_path.name} belongs to another document")
        saved["rows"] = merge_before_rows(saved.get("rows") or [], [rows[n] for n in to_flag])
        before_path.write_text(json.dumps(saved, indent=1))
        have = {x["id"] for x in saved["rows"]}
        if any(rows[n]["id"] not in have for n in to_flag):
            raise SystemExit("ABORT: a page to flag has no saved before-value row")
        for n in to_flag:
            row = rows[n]
            reasons = list(row.get("review_reasons") or [])
            if REASON not in reasons:
                reasons.append(REASON)
            sb.table("ingest_pages").update({"needs_review": True, "review_reasons": reasons}) \
                .eq("id", row["id"]).eq("document_id", DOC_ID_V3).execute()
            written.append(n)
        rows = _rows(sb, targets)
    r["flags"] = {"reason": REASON, "planned": to_flag, "written": written, "dry_run": a.dry_run,
                  "before_file": str(before_path.relative_to(INGESTION_DIR))}

    truth = sweep_truth(sweep)
    disputed = set(r["disputed_pages"])
    row = lambda n: rows.get(n) or {}  # noqa: E731  (guards a page missing after the re-read)
    flagged = sorted(n for n in POOL if row(n).get("needs_review"))
    pass_und = sorted(n for n in POOL if truth.get(n) == "good" and n not in disputed and not row(n).get("needs_review"))
    neither = sorted(n for n in POOL if not row(n).get("needs_review") and truth.get(n) != "good")
    reasons = {}
    for n in flagged:
        for rs in row(n).get("review_reasons") or []:
            reasons.setdefault(rs, []).append(n)
    r["pool_close"] = {"pool": len(POOL), "pass_undisputed": pass_und, "flagged": flagged,
                       "neither": neither, "flag_reasons": reasons}
    r["flags"]["carrying_reason"] = sorted(n for n in targets if REASON in (row(n).get("review_reasons") or []))
    r["flagged_pages_all"] = sorted(n for n in targets if row(n).get("needs_review"))
    if not a.dry_run:
        out_path.write_text(json.dumps(r, indent=1))
    print_summary(r)
    return 0


if __name__ == "__main__":
    sys.exit(main())

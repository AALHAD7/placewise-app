"""R1.07: re-score all 248 FMS v2 pages offline with the R1.07 checker.

No Gemini and no DB: reads the local caches only.
- v2 pages: out/r1_pages_v2.jsonl (235 converted pages)
- v1 pages (text layer, markdown, and the 13 pages v2 reused from v1): pilot_output.json

Each v2 page gets the free post-pass (collapse_multiline_labels_with_lines with the
stored label_lines, restore_quotes, strip_invented_links), then the new check_page.
The v1 markdown is re-scored with the same checker for comparison.

    venv/bin/python rescore_v2.py   ->  out/r1_v2_rescore.json
"""
import argparse
import json
import sys
from collections import Counter
from pathlib import Path

import diagram_schema
from diagram_schema import extract_blocks, tree_convergence_suspects
from fidelity import check_page
from postprocess import postprocess_markdown
from textnorm import normalize_exact, normalize_label

HERE = Path(__file__).parent
FLAG_REASONS = ("diagram_in_table", "diagram_structure", "diagram_label_altered")
CONVERGENCE_MAX_PAGES = 15
CONVERGENCE_MUST_NOT_FLAG = (14, 20, 32)


def load_pages(jsonl, pilot):
    v2 = {}
    for line in Path(jsonl).read_text().splitlines():
        if line.strip():
            r = json.loads(line)
            v2[r["page_no"]] = r
    v1 = {p["page_no"]: p for p in json.loads(Path(pilot).read_text())["results"][0]["pages_full"]}
    return v1, v2


def convergence_pages(v1, v2_md):
    """Pages where tree_convergence_suspects fires on the post-processed v2 markdown."""
    out = {}
    for n, md in v2_md.items():
        tl = v1[n].get("text_layer") or ""
        if not tl.strip():
            continue
        tn = normalize_label(tl)
        for b in extract_blocks(md):
            if b["parse_error"] or not isinstance(b["obj"], dict) or b["obj"].get("type") != "issue_tree":
                continue
            hits = tree_convergence_suspects(b["obj"], tn)
            if hits:
                out.setdefault(n, []).extend(hits)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--jsonl", default=str(HERE / "out" / "r1_pages_v2.jsonl"))
    ap.add_argument("--pilot", default=str(HERE / "pilot_output.json"))
    ap.add_argument("--out", default=str(HERE / "out" / "r1_v2_rescore.json"))
    args = ap.parse_args()

    assert "gemini_client" not in sys.modules and "supabase" not in sys.modules

    v1, v2 = load_pages(args.jsonl, args.pilot)
    pages, flagged = [], {}
    below_v1, quotes_pages, links_pages = [], [], []
    altered_tokens = Counter()
    altered_pages = set()
    post_md = {}

    for n in sorted(v1):
        p1 = v1[n]
        tl = p1.get("text_layer") or ""
        scanned = bool(p1.get("is_scanned"))
        r1 = check_page(tl, p1.get("markdown") or "", scanned, n)
        src = v2.get(n)
        md = (src or p1).get("markdown") or ""
        md2, ll, nq, nl = postprocess_markdown(md, tl)
        label_lines = dict((src or {}).get("label_lines") or {})
        label_lines.update(ll)
        post_md[n] = md2
        r2 = check_page(tl, md2, scanned, n, label_lines=label_lines)
        reasons = list(r2["review_reasons"])
        if src and src.get("truncated") and "truncated" not in reasons:
            reasons.append("truncated")
        for reason in reasons:
            if reason in FLAG_REASONS:
                flagged.setdefault(reason, []).append(n)
        for it in r2["diagram_issues"]:
            if it["code"] == "label_altered":
                altered_pages.add(n)
                exact = set(normalize_exact(tl).split(" "))
                for tok in normalize_exact(it["detail"]).split(" "):
                    if tok and tok not in exact:
                        altered_tokens[tok] += 1
        if nq:
            quotes_pages.append(n)
        if nl:
            links_pages.append(n)
        if r1["number_coverage"] is not None and r2["number_coverage"] is not None:
            if (r2["number_coverage"] < r1["number_coverage"] - 1e-9
                    or r2["word_coverage"] < r1["word_coverage"] - 1e-9):
                below_v1.append(n)
        pages.append({
            "page_no": n,
            "source": "v2" if src else "v1_reused",
            "v1": {"nc": r1["number_coverage"], "wc": r1["word_coverage"]},
            "v2_post": {
                "nc": r2["number_coverage"], "wc": r2["word_coverage"],
                "label_cov": r2["diagram_label_coverage"], "label_exact": r2["diagram_label_exact"],
                "reasons": reasons, "quotes_restored": nq, "links_stripped": nl,
                "diagram_types": [d["type"] for d in r2["diagrams"]],
                "diagram_count": r2["diagram_count"],
            },
        })

    conv = convergence_pages(v1, post_md)
    bad = [p for p in CONVERGENCE_MUST_NOT_FLAG if p in conv]
    if not diagram_schema.CONVERGENCE_CHECK_ENABLED:
        heuristic = f"dropped: {len(conv)} pages flagged (false positives incl. {bad or 'n/a'})"
    elif len(conv) > CONVERGENCE_MAX_PAGES or bad:
        heuristic = f"DROP REQUIRED: {len(conv)} pages flagged, must-not-flag hit {bad}"
    else:
        heuristic = "kept"

    out = {
        "pages": pages,
        "flagged_new": {k: sorted(v) for k, v in flagged.items()},
        "coverage_below_v1": below_v1,
        "quotes_fixed_pages": quotes_pages,
        "links_fixed_pages": links_pages,
        "convergence_heuristic": heuristic,
        "convergence_pages": {str(k): v for k, v in sorted(conv.items())},
        "label_altered_pages": sorted(altered_pages),
    }
    if len(altered_pages) > 40:
        out["altered_tokens_top10"] = altered_tokens.most_common(10)
    Path(args.out).write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(f"pages {len(pages)} (v2 {sum(1 for p in pages if p['source'] == 'v2')}, "
          f"v1_reused {sum(1 for p in pages if p['source'] == 'v1_reused')})")
    print(f"label_altered pages {len(altered_pages)}; top altered tokens {altered_tokens.most_common(10)}")
    print(f"convergence {heuristic}: {dict(conv)}")
    print(f"saved {args.out}  (0 Gemini calls, 0 DB calls)")


if __name__ == "__main__":
    main()

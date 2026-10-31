"""R6 follow-up: LIVE, non-reconstructed verification of the weighted
per-block `_score` fix (convert.py, BLOCK_ISSUE_FREE_ALLOWANCE/WEIGHT/CAP).

Re-runs both of convert_page_vision's real internal attempts (attempt 1,
then the targeted retry with fix hints) directly against the real page
images for the 4 confirmed-misranked pages (log.md 2026-10-31, "per-block
formula regression found"):
  - FMS2023-24 p78 ("Understanding Google")
  - FMS2021-22 p16
  - ISB p30
  - FMS2021-22 p50

For each page prints, from the REAL live diagram_issues of both attempts
(not hand-built numbers):
  - old flat per-issue score (the original, pre-R6 formula)
  - old flat per-block score (the first R6 fix, the one with the tie bug)
  - new weighted per-block score (this follow-up fix)
  - which attempt each formula's tie-break would keep

Read-only against the DB (only SELECTs on already-stored ingest_pages/
ingest_documents for text_layer/is_scanned - no writes, no re-ingestion).
The only paid calls are the vision HTTP requests made here. Also renders
each page to PNG under out/r6_formula_verify/ for manual visual
confirmation against the real source page."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import config
from supabase import create_client
import pypdfium2 as pdfium

import convert
from convert import build_vision_prompt, diagram_fix_hints, _vision_attempt, _block_issue_counts
from page_classify import render_page_png
from gemini_client import call_count, set_vision_cap

OUT_DIR = Path(__file__).parent / "out" / "r6_formula_verify"
OUT_DIR.mkdir(parents=True, exist_ok=True)

TARGETS = [
    # (label, pdf_path, doc_id, page_no)
    ("FMS2023-24_p78", "The FMS Consulting CaseBook 2023-24 (1).pdf",
     "faa13328-c4bc-4ed7-8172-6ec5ba38c162", 78),
    ("FMS2021-22_p16", "The FMS Consulting Casebook 2021-22.pdf",
     "e9229429-3eec-478b-b54a-7d5a1cdf6de0", 16),
    ("FMS2021-22_p50", "The FMS Consulting Casebook 2021-22.pdf",
     "e9229429-3eec-478b-b54a-7d5a1cdf6de0", 50),
    ("ISB_p30", "ISB Consulting Casebook 2025.pdf",
     "0a6c4f9e-b1bd-4bf8-bbee-7475ba8a6c14", 30),
]
PDF_DIR = Path("../../Data/Consulting Files/PDF Files")


def old_flat_issue_score(fid: dict, truncated: bool) -> float:
    cov = fid.get("diagram_label_coverage")
    n_issues = sum(1 for it in (fid.get("diagram_issues") or [])
                   if it.get("severity") == "error" or it.get("code") in convert.RETRY_WARN_CODES)
    return ((fid.get("number_coverage") or 0) + (fid.get("word_coverage") or 0)
            + (1.0 if cov is None else cov) - 0.5 * n_issues - (1.0 if truncated else 0.0))


def old_flat_block_score(fid: dict, truncated: bool) -> float:
    cov = fid.get("diagram_label_coverage")
    n_blocks = len(_block_issue_counts(fid))
    return ((fid.get("number_coverage") or 0) + (fid.get("word_coverage") or 0)
            + (1.0 if cov is None else cov) - 0.5 * n_blocks - (1.0 if truncated else 0.0))


def run_two_attempts(png, page_no, text_layer, is_scanned, call_log):
    prompt1 = build_vision_prompt(page_no, text_layer)
    md1, fid1, trunc1, model1, used1 = _vision_attempt(
        png, prompt1, page_no, text_layer, is_scanned, call_log,
        reason="r6_formula_verify_live", attempt=1, max_http=2)
    hints = diagram_fix_hints(fid1, trunc1, page_no)
    prompt2 = build_vision_prompt(page_no, text_layer, hints)
    md2, fid2, trunc2, model2, used2 = _vision_attempt(
        png, prompt2, page_no, text_layer, is_scanned, call_log,
        reason="r6_formula_verify_live+diagram_retry", attempt=2, max_http=2)
    fid1["markdown"], fid2["markdown"] = md1, md2
    fid1["fix_hints"] = hints
    return (fid1, trunc1), (fid2, trunc2)


def main():
    sb = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)
    set_vision_cap(40)  # 4 pages x 2 attempts x up to 2 http calls (cascade) each
    call_log = []

    for label, pdf_name, doc_id, page_no in TARGETS:
        row = sb.table("ingest_pages").select("text_layer, is_scanned") \
            .eq("document_id", doc_id).eq("page_no", page_no).execute().data[0]
        pdf = pdfium.PdfDocument(str(PDF_DIR / pdf_name))
        png = render_page_png(pdf[page_no - 1], config.RENDER_DPI)
        (OUT_DIR / f"{label}.png").write_bytes(png)

        (fid1, t1), (fid2, t2) = run_two_attempts(png, page_no, row["text_layer"], row["is_scanned"], call_log)
        (OUT_DIR / f"{label}_detail.json").write_text(json.dumps({
            "attempt1": {"markdown": fid1.get("markdown"), "diagrams": fid1.get("diagrams"),
                         "diagram_issues": fid1.get("diagram_issues"), "truncated": t1,
                         "number_coverage": fid1.get("number_coverage"), "word_coverage": fid1.get("word_coverage"),
                         "diagram_label_coverage": fid1.get("diagram_label_coverage")},
            "attempt2": {"markdown": fid2.get("markdown"), "diagrams": fid2.get("diagrams"),
                         "diagram_issues": fid2.get("diagram_issues"), "truncated": t2,
                         "number_coverage": fid2.get("number_coverage"), "word_coverage": fid2.get("word_coverage"),
                         "diagram_label_coverage": fid2.get("diagram_label_coverage")},
        }, indent=2, default=str))

        blocks1, blocks2 = _block_issue_counts(fid1), _block_issue_counts(fid2)
        print(f"\n=== {label} (page {page_no}) ===")
        print(f"attempt1: blocks_with_issues={blocks1} coverage=(n={fid1.get('number_coverage')}, "
              f"w={fid1.get('word_coverage')}, lbl={fid1.get('diagram_label_coverage')}) truncated={t1}")
        print(f"attempt2: blocks_with_issues={blocks2} coverage=(n={fid2.get('number_coverage')}, "
              f"w={fid2.get('word_coverage')}, lbl={fid2.get('diagram_label_coverage')}) truncated={t2}")

        s1_old_issue, s2_old_issue = old_flat_issue_score(fid1, t1), old_flat_issue_score(fid2, t2)
        s1_old_block, s2_old_block = old_flat_block_score(fid1, t1), old_flat_block_score(fid2, t2)
        s1_new, s2_new = convert._score(fid1, t1), convert._score(fid2, t2)

        def pick(a, b):
            return "attempt2" if b > a else "attempt1"

        print(f"OLD flat-per-issue:  a1={s1_old_issue:.4f} a2={s2_old_issue:.4f} -> keeps {pick(s1_old_issue, s2_old_issue)}")
        print(f"OLD flat-per-block:  a1={s1_old_block:.4f} a2={s2_old_block:.4f} -> keeps {pick(s1_old_block, s2_old_block)} "
              f"{'(TIE)' if s1_old_block == s2_old_block else ''}")
        print(f"NEW weighted-block:  a1={s1_new:.4f} a2={s2_new:.4f} -> keeps {pick(s1_new, s2_new)} "
              f"{'(TIE)' if s1_new == s2_new else ''}")
        print(f"page image saved to {OUT_DIR / (label + '.png')}")

    print(f"\nvision_http_calls={call_count['vision']}")


if __name__ == "__main__":
    main()

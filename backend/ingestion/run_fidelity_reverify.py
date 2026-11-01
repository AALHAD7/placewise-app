"""Independent fidelity re-verification pass over every `needs_review=true` page across
the 9 R6-ingested Consulting casebooks (1,191 pages total, all is_active=false; nothing
live touched). Replaces manual human review for this structure-check pass, per STATE.md's
"every diagram needs a human OR structure check before R9 switch-over".

For each flagged page:
  1. Render the real PDF page image fresh (page_classify.render_page_png).
  2. Run a NEW, independently-framed Gemini vision call (VERIFY_PROMPT below) whose only
     job is to catch extraction errors - given the page image AND the already-extracted
     markdown/diagram JSON, find every mismatch, fabrication or omission. This is not the
     same prompt as generation (convert.VISION_PROMPT) re-asked - it is framed as checking
     someone else's work, specifically to avoid reproducing the same blind spots.
  3. "clean" verdict -> recorded resolved: false_positive. The row is NEVER touched.
  4. "defect" verdict -> regenerate the page via a single vision attempt that folds the
     verifier's own findings in as fix hints (convert.build_vision_prompt's existing
     fix_hints mechanism), then re-verify fresh. Up to 2 regenerate+re-verify rounds.
     Clean -> genuinely_fixed (collected for a v+1 patch, same reuse-unless-patched
     pattern as every other R6 patch script). Still defect after 2 rounds ->
     could_not_auto_resolve, with the latest verifier findings as the reason. Never
     forced through, never silently dropped.
  5. A verifier call that errors or returns unparseable/uncertain output is retried once
     (fresh call) before giving up on that page.

Resumable: progress is checkpointed to out/fidelity_reverify_progress.json after every
page (thread-safe). A crash or Ctrl-C loses nothing already written there; rerunning skips
any (document_id, page_no) already recorded.

Writes exactly one new ingest_documents version per casebook THAT HAS >=1 genuinely_fixed
page (insert-only, is_active=false, reuse-unless-patched - identical pattern to every
run_r6_*_patch.py in this folder). Casebooks with zero genuine fixes get no new version -
nothing to write.
"""
import argparse
import json
import re
import sys
import threading
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import config
from supabase import create_client
import pypdfium2 as pdfium

import convert
from convert import build_vision_prompt, sha256_file, PROMPT_VERSION
from page_classify import render_page_png
from chunk import chunk_document, embedding_text
from gemini_client import embed_text, call_count, transcribe_page, VisionCallError
from pipeline import write_version, version_status, chunkable_pages

OUT_DIR = Path(__file__).parent / "out"
PROGRESS_PATH = OUT_DIR / "fidelity_reverify_progress.json"
REPORT_PATH = OUT_DIR / "fidelity_reverify_report.json"
PDF_DIR = Path(__file__).parent.parent.parent / "Data" / "Consulting Files" / "PDF Files"

PAGE_COLS = ("page_no, is_text, is_table, is_visual, is_scanned, text_layer, markdown, "
             "docling_markdown, method, number_coverage, word_coverage, unreadable_count, "
             "needs_review, review_reasons, diagrams, diagram_count, diagram_issues, "
             "diagram_label_coverage, prompt_version")

# The 9 R6-ingested Consulting casebooks (latest version each). Names mirror
# backend/eval/run_eval_v2_preview.js's DOC_IDS comments.
DOCS = [
    {"document_id": "e9229429-3eec-478b-b54a-7d5a1cdf6de0", "name": "FMS 2021-22",
     "pdf": "The FMS Consulting Casebook 2021-22.pdf"},
    {"document_id": "0a6c4f9e-b1bd-4bf8-bbee-7475ba8a6c14", "name": "ISB 2025",
     "pdf": "ISB Consulting Casebook 2025.pdf"},
    {"document_id": "17a7c482-5181-423c-b8d5-44f79e90e392", "name": "IIM B 2025",
     "pdf": "IIM B Consulting Casebook 2025.pdf"},
    {"document_id": "6ae47aaa-ad2e-4848-9775-75ac2072f79e", "name": "IIMK 2025",
     "pdf": "IIMK Kasebook 2025.pdf"},
    {"document_id": "ab676b81-3b29-4c35-b288-6dff71756e26", "name": "SRCC Guesstimates",
     "pdf": "SRCC Guesstimates-Book-Volume-1-6.pdf"},
    {"document_id": "fa763d15-dac2-408f-9228-8a5f34785128", "name": "IIM L 2025",
     "pdf": "IIM L Consulting Casebook 2025.pdf"},
    {"document_id": "f2c1333f-b205-46fa-991e-551548dffef7", "name": "IIM Calcutta 2025-26",
     "pdf": "IIM Calcutta Consulting CaseBook 2025-26.pdf"},
    {"document_id": "09c41590-6f53-40be-a19c-60fa645610f4", "name": "IIMA 2025-26",
     "pdf": "IIMA-Consult-Prep-Book-Case-Book-2025-26.pdf"},
    {"document_id": "faa13328-c4bc-4ed7-8172-6ec5ba38c162", "name": "FMS 2023-24",
     "pdf": "The FMS Consulting CaseBook 2023-24 (1).pdf"},
]

VERIFY_MAX_TOKENS = 1024
MAX_CONTENT_CHARS = 8000

VERIFY_PROMPT_TMPL = """You are checking a consultant's work, not redoing it. Below is a page image from an \
MBA placement-prep casebook, and markdown/diagram JSON someone already extracted from that exact page. Your \
ONLY job is to compare the extraction against the page image and list every genuine mismatch. Do not \
re-transcribe the page yourself.

Flag, with specific quotable detail:
- FABRICATION: a number, label, sentence or diagram node in the extraction that does NOT actually appear \
anywhere on the page image.
- WRONG VALUE: a number, label or fact that IS on the page but was copied incorrectly (wrong digit, wrong \
unit, renamed/merged/altered label).
- MALFORMED DIAGRAM: a ```placewise-diagram``` block that is empty, invalid JSON, or missing a box/edge/cell \
that is visibly part of a diagram on the page.
- MISSING CONTENT: a substantial piece of text, a whole diagram, or a whole table visible on the page that is \
completely absent from the extraction.

Do NOT flag as a defect:
- "[UNREADABLE]" used for text that genuinely is illegible, a logo, or a stamp with no real selectable text - \
that is the CORRECT way to mark it, not a defect.
- The one-line "Diagram summary:" sentence paraphrasing a diagram - that is meant to summarize, not quote.
- Apostrophe/quote style, or a footer/header/page-number boilerplate line being present, absent, or stylized.
- Anything an automated heuristic checker flagged that you independently confirm IS faithful on inspection.

Context only (make your OWN independent judgement; this automated checker is known to throw false positives \
on page-template boilerplate - do not just agree with it): it flagged this page for: {reasons}

EXTRACTED CONTENT TO CHECK (page {page_no}):
\"\"\"
{content}
\"\"\"

Respond with ONLY a JSON object, no markdown fences, no commentary, no extra text:
{{"verdict": "clean" or "defect", "findings": ["<specific, quotable description of each genuine mismatch, if any>"], "severity": "none" or "minor" or "major"}}
"clean" means the extraction is faithful to the page as defined above. "defect" means you found at least one \
genuine fabrication, wrong value, malformed diagram, or missing content."""


def build_verify_prompt(page_no, content, review_reasons):
    content = (content or "")[:MAX_CONTENT_CHARS]
    reasons = ", ".join(review_reasons) if review_reasons else "(no specific reasons recorded)"
    return VERIFY_PROMPT_TMPL.format(page_no=page_no, content=content, reasons=reasons)


_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def _parse_verify_json(text: str) -> dict:
    cleaned = _FENCE_RE.sub("", (text or "").strip()).strip()
    try:
        obj = json.loads(cleaned)
    except ValueError:
        start, end = cleaned.find("{"), cleaned.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError(f"no JSON object found in verifier response: {cleaned[:200]!r}")
        obj = json.loads(cleaned[start:end + 1])
    verdict = obj.get("verdict")
    if verdict not in ("clean", "defect"):
        raise ValueError(f"verifier returned an unrecognized verdict: {verdict!r}")
    findings = obj.get("findings") or []
    if not isinstance(findings, list):
        findings = [str(findings)]
    return {"verdict": verdict, "findings": [str(f) for f in findings], "severity": obj.get("severity")}


def verify_page_once(png, page_no, content, review_reasons, call_log, round_label):
    text, meta = transcribe_page(png, build_verify_prompt(page_no, content, review_reasons),
                                 max_tokens=VERIFY_MAX_TOKENS, return_meta=True,
                                 call_log=call_log, log_ctx={"page": page_no, "reason": f"reverify_{round_label}"})
    return _parse_verify_json(text)


def verify_page_safe(png, page_no, content, review_reasons, call_log, round_label):
    """One verify call, retried once (fresh call) on any error/unparseable/uncertain
    response, per the task's error policy. Returns (result_or_None, error_str_or_None)."""
    for attempt in (1, 2):
        try:
            return verify_page_once(png, page_no, content, review_reasons, call_log,
                                    f"{round_label}_a{attempt}"), None
        except (VisionCallError, ValueError, KeyError) as e:
            last_err = f"{type(e).__name__}: {e}"
            if attempt == 1:
                continue
            return None, last_err
    return None, "unreachable"


def regenerate_with_hints(png, page_no, text_layer, is_scanned, call_log, reason, hints):
    """One vision attempt with the verifier's findings folded in as targeted fix hints -
    same mechanism convert.py's own internal retry uses (build_vision_prompt's fix_hints),
    so this retry is told exactly what the independent verifier found wrong instead of
    blindly re-asking the generation prompt."""
    prompt = build_vision_prompt(page_no, text_layer, fix_hints=hints)
    md, fid, truncated, model, http_calls = convert._vision_attempt(
        png, prompt, page_no, text_layer, is_scanned, call_log, reason, 1,
        config.VISION_MAX_CALLS_PER_PAGE, None)
    return {
        "markdown": md, "method": "gemini_vision_v2", "prompt_version": PROMPT_VERSION,
        "attempts": 1, "http_calls": http_calls, "truncated": truncated, "vision_model": model,
        **fid,
    }


class Progress:
    """Thread-safe checkpoint store, flushed to disk after every page."""

    def __init__(self, path: Path):
        self.path = path
        self.lock = threading.Lock()
        if path.exists():
            self.data = json.loads(path.read_text())
        else:
            self.data = {"documents": {}, "call_counts": {"verify_calls": 0, "regen_calls": 0}}

    def doc_entry(self, document_id):
        with self.lock:
            return self.data["documents"].setdefault(document_id, {"pages": {}})

    def has_page(self, document_id, page_no) -> bool:
        with self.lock:
            return str(page_no) in self.data["documents"].get(document_id, {}).get("pages", {})

    def record_page(self, document_id, page_no, record):
        with self.lock:
            self.data["documents"].setdefault(document_id, {"pages": {}})["pages"][str(page_no)] = record
            self._flush()

    def bump(self, key, n=1):
        with self.lock:
            self.data["call_counts"][key] = self.data["call_counts"].get(key, 0) + n
            self._flush()

    def _flush(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.data, indent=2))
        tmp.replace(self.path)

    def save(self):
        with self.lock:
            self._flush()


def process_one_page(doc_id, page, png, call_log, progress: Progress):
    page_no = page["page_no"]
    content = page.get("markdown") or ""
    review_reasons = page.get("review_reasons") or []

    r1, err1 = verify_page_safe(png, page_no, content, review_reasons, call_log, "initial")
    progress.bump("verify_calls")
    if r1 is None:
        progress.record_page(doc_id, page_no, {
            "status": "could_not_auto_resolve",
            "reason": f"verifier technical failure after 1 retry (not independently confirmed either way): {err1}",
        })
        return

    if r1["verdict"] == "clean":
        progress.record_page(doc_id, page_no, {
            "status": "false_positive",
            "checker_reasons": review_reasons,
        })
        return

    # Defect found - round 1 fix attempt, hints = round 1 findings.
    text_layer = page.get("text_layer") or ""
    is_scanned = bool(page.get("is_scanned"))
    hints = r1["findings"] or ["the extraction does not faithfully match the page; re-check every number and label"]
    fixed = regenerate_with_hints(png, page_no, text_layer, is_scanned, call_log,
                                  "fidelity_reverify_fix_r1", hints)
    progress.bump("regen_calls")
    r2, err2 = verify_page_safe(png, page_no, fixed["markdown"], review_reasons, call_log, "fix_r1")
    progress.bump("verify_calls")

    if r2 is not None and r2["verdict"] == "clean":
        progress.record_page(doc_id, page_no, {
            "status": "genuinely_fixed", "rounds": 1,
            "original_findings": r1["findings"], "patched_page": fixed,
        })
        return

    # Round 2 fix attempt, hints = combined round 1 + round 2 findings (round 2 may be
    # None if the re-verify itself failed technically - still worth one more real attempt).
    hints2 = list(dict.fromkeys(hints + (r2["findings"] if r2 else [])))
    fixed2 = regenerate_with_hints(png, page_no, text_layer, is_scanned, call_log,
                                   "fidelity_reverify_fix_r2", hints2)
    progress.bump("regen_calls")
    r3, err3 = verify_page_safe(png, page_no, fixed2["markdown"], review_reasons, call_log, "fix_r2")
    progress.bump("verify_calls")

    if r3 is not None and r3["verdict"] == "clean":
        progress.record_page(doc_id, page_no, {
            "status": "genuinely_fixed", "rounds": 2,
            "original_findings": r1["findings"], "patched_page": fixed2,
        })
        return

    last_findings = (r3["findings"] if r3 else None) or (r2["findings"] if r2 else None) or r1["findings"]
    progress.record_page(doc_id, page_no, {
        "status": "could_not_auto_resolve",
        "reason": "2 regenerate+re-verify rounds still found a genuine defect: " + "; ".join(last_findings),
        "round1_findings": r1["findings"],
    })


def _retry_sb_call(fn, attempts=5, base_delay=3.0):
    """Transient-network retry wrapper for a Supabase call (e.g. a large page
    fetch), confirmed needed live: a ReadTimeout fetching 229 pages' worth of
    markdown/diagram JSON crashed the whole run after 3 docs had already
    completed cleanly. Checkpointed progress meant nothing was lost, but
    don't repeat the crash on resume."""
    last_err = None
    for i in range(attempts):
        try:
            return fn()
        except Exception as e:  # noqa: BLE001 - genuinely any transient I/O error here
            last_err = e
            if i == attempts - 1:
                raise
            delay = base_delay * (2 ** i)
            print(f"  [retry] Supabase call failed ({type(e).__name__}: {e}); retrying in {delay:.0f}s "
                  f"(attempt {i + 2}/{attempts})")
            time.sleep(delay)
    raise last_err


def run_doc(doc_meta, sb, progress: Progress, workers: int, limit=None):
    doc_id, name, pdf_name = doc_meta["document_id"], doc_meta["name"], doc_meta["pdf"]
    pdf_path = PDF_DIR / pdf_name
    print(f"\n=== {name} ({doc_id}) ===")

    all_pages = _retry_sb_call(lambda: sb.table("ingest_pages").select(PAGE_COLS + ", needs_review")
                               .eq("document_id", doc_id).order("page_no").execute().data)
    flagged = [p for p in all_pages if p.get("needs_review")]
    print(f"  {len(all_pages)} total pages, {len(flagged)} flagged needs_review")

    pdf = pdfium.PdfDocument(str(pdf_path))
    todo = [p for p in flagged if not progress.has_page(doc_id, p["page_no"])]
    already = len(flagged) - len(todo)
    if limit:
        todo = todo[:limit]
    print(f"  {already} already checkpointed, {len(todo)} to process this run"
          + (f" (capped at --limit {limit})" if limit else ""))

    # Pre-render PNGs sequentially (pdfium is not safe for concurrent page access on one
    # PdfDocument); the network-bound Gemini calls are then dispatched across threads.
    pngs = {}
    for p in todo:
        pngs[p["page_no"]] = render_page_png(pdf[p["page_no"] - 1], config.RENDER_DPI)

    call_log = []
    from concurrent.futures import ThreadPoolExecutor, as_completed
    done_count = 0
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(process_one_page, doc_id, p, pngs[p["page_no"]], call_log, progress): p["page_no"]
                for p in todo}
        for fut in as_completed(futs):
            pno = futs[fut]
            try:
                fut.result()
            except Exception as e:
                progress.record_page(doc_id, pno, {
                    "status": "could_not_auto_resolve",
                    "reason": f"unhandled script error, not a verifier finding: {type(e).__name__}: {e}",
                })
            done_count += 1
            if done_count % 10 == 0 or done_count == len(todo):
                print(f"  ...{done_count}/{len(todo)} pages processed "
                      f"(vision calls so far: {call_count['vision']})")

    # Assemble any genuinely-fixed pages into a new version, reuse-unless-patched.
    entry = progress.doc_entry(doc_id)
    patched = {}
    for pno_str, rec in entry["pages"].items():
        if rec.get("status") == "genuinely_fixed":
            pno = int(pno_str)
            pp = dict(rec["patched_page"])
            pp["page_no"] = pno
            orig = next(p for p in all_pages if p["page_no"] == pno)
            pp["is_text"], pp["is_table"] = orig["is_text"], orig["is_table"]
            pp["is_visual"], pp["is_scanned"] = orig["is_visual"], orig["is_scanned"]
            pp["text_layer"] = orig["text_layer"]
            pp["docling_markdown"] = orig["docling_markdown"]
            patched[pno] = pp

    if not patched:
        print(f"  No genuine fixes for {name}; no new version written.")
        return {"wrote_version": False}

    cur_version = _retry_sb_call(lambda: sb.table("ingest_documents").select("ingestion_version")
                                 .eq("id", doc_id).single().execute().data["ingestion_version"])
    new_version = cur_version + 1
    pdf_basename = pdf_path.name
    if _retry_sb_call(lambda: version_status(pdf_basename, new_version, sb)) == "done":
        print(f"  v{new_version} already done for {name}; skipping write")
        return {"wrote_version": False, "already_done": True}

    from pipeline import lookup_classification

    def resolve_txt_name():
        res = sb.table("document_chunks").select("source_file").eq("source_file", pdf_basename).limit(1).execute().data
        if res:
            return pdf_basename
        alt = pdf_basename[:-4] + ".txt" if pdf_basename.lower().endswith(".pdf") else pdf_basename
        res2 = sb.table("document_chunks").select("source_file").eq("source_file", alt).limit(1).execute().data
        if res2:
            return alt
        raise ValueError(f"No document_chunks row for {pdf_basename!r} or {alt!r}")

    meta = _retry_sb_call(lambda: lookup_classification(resolve_txt_name(), sb))
    v_next_pages = [patched[p["page_no"]] if p["page_no"] in patched else p for p in all_pages]
    chunks = chunk_document(chunkable_pages(v_next_pages))
    embeddings = [embed_text(embedding_text(c["content"])) for c in chunks]

    fixed_pages_list = sorted(patched.keys())
    # Not retry-wrapped: write_version does several sequential INSERTs (document row,
    # page batches, chunk batches); a retry after partial success would hit a duplicate
    # key on the document row rather than cleanly resuming. Left to fail loudly and be
    # rerun by hand (write_version's own checkpoints: version_status catches a prior
    # "done" run, but a half-written "pending" row needs a human look, not a silent retry).
    w = write_version(meta, pdf_basename, sha256_file(pdf_path), len(all_pages), v_next_pages, chunks,
                      version=new_version, prompt_version=config.PROMPT_VERSION,
                      notes=f"Independent fidelity re-verification (automated, not R5's admin UI): "
                            f"re-verified every needs_review page against a fresh render of the real PDF "
                            f"page using a differently-framed Gemini verifier prompt. Genuinely fixed "
                            f"{len(fixed_pages_list)} page(s) with a real extraction defect found by the "
                            f"verifier and confirmed clean on re-verification after regeneration: "
                            f"{fixed_pages_list}. All other needs_review pages reused verbatim from v{cur_version} "
                            f"- either confirmed as checker false positives, or left needs_review=true and "
                            f"unresolved (see fidelity_reverify_report.json for per-page detail).",
                      reuse_file_id=doc_id, embeddings=embeddings, sb=sb)
    print(f"  Wrote v{new_version} file_id={w['file_id']} pages={len(v_next_pages)} chunks={len(w['chunk_rows'])} "
          f"(patched pages: {fixed_pages_list})")
    return {"wrote_version": True, "new_version": new_version, "new_file_id": w["file_id"], "patched_pages": fixed_pages_list}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--doc", help="Process only this document_id (for piloting)")
    ap.add_argument("--limit", type=int, help="Cap number of flagged pages processed per doc (for piloting)")
    ap.add_argument("--workers", type=int, default=8)
    args = ap.parse_args()

    sb = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)
    progress = Progress(PROGRESS_PATH)

    docs = [d for d in DOCS if d["document_id"] == args.doc] if args.doc else DOCS
    write_results = {}
    for d in docs:
        write_results[d["document_id"]] = run_doc(d, sb, progress, args.workers, args.limit)
        progress.save()

    print(f"\nTotal vision HTTP calls so far (this process): {call_count['vision']}, "
          f"embedding calls: {call_count['embedding']}")
    print(f"Verify calls (checkpointed total): {progress.data['call_counts'].get('verify_calls', 0)}, "
          f"regen calls: {progress.data['call_counts'].get('regen_calls', 0)}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "fidelity_reverify_write_results.json").write_text(json.dumps(write_results, indent=2))


if __name__ == "__main__":
    main()

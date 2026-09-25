#!/usr/bin/env python3
"""
PDF -> text re-extraction via Gemini document vision
======================================================
Replaces the original PyMuPDF plain-text-layer extraction (Data/<Domain>
Files/Text Files/) with a Gemini vision transcription.

WHY: confirmed via a real example (Finance Files/"Comparable Company
Transaction Analysis.pdf", page 6) that PyMuPDF's plain get_text() flattens
tables into an ambiguous run of cells with no row/column structure - a
3-column "Multiple / Advantage / Disadvantage" table becomes one undifferen-
tiated block of text, and RAG chunking then slices straight through it.
PyMuPDF 1.26's own find_tables() API was tried as a free/local fix first and
returns ZERO tables on this exact page - this corpus is mostly PPT-exported
slide decks with borderless, freeform-positioned text boxes, not gridded
print-style tables its ruling-line detector needs. Gemini reads each page as
an image instead, the same way a human would, and transcribes tables as
clean markdown - preserving what the plain text layer throws away.

Matches this project's existing "Python extracts, Node ingests" split
(extract_images.py -> ingestImages.js) and reproduces the exact output
format backend/scripts/ingest.js already depends on (only its chunkText()
page-marker regex matters, confirmed by inspecting an existing .txt before
writing this):
  # <title>
  Source: <filename>
  Pages: <n>

  --- Page 1 ---
  <page 1 text>

  --- Page 2 ---
  ...

USAGE
  Cheap single-file test first (recommended before spending a whole domain's
  quota budget on it):
    python3 reextract_text.py "../../Data/Finance Files" \\
        --only "03.Stock Basics Tutorial.pdf" --out-name "Text Files (Gemini pilot)"

  Whole domain, still into the pilot folder (never overwrites the live
  Text Files/ used by ingest.js until you explicitly pass --out-name
  "Text Files"):
    python3 reextract_text.py "../../Data/Finance Files" --out-name "Text Files (Gemini pilot)"

RESUMABLE: each PDF's per-page transcriptions are cached in
"<domain folder>/.extract_cache/<pdf-stem>.json" as they complete, so a
crash, Ctrl-C, or hitting Gemini's daily quota mid-run loses nothing -
re-running picks up exactly where it left off, page by page, not file by
file.

API KEY: reads GEMINI_API_KEY from backend/.env (same key the rest of this
project's ingestion pipeline already uses) - never hardcoded in this file,
since it's a committed, shared backend script, not a personal one-off.
"""
import argparse
import json
import os
import re
import sys
import time

try:
    import fitz  # PyMuPDF
except ImportError:
    sys.exit("Missing dependency. Run: pip install pymupdf")

try:
    import requests
except ImportError:
    sys.exit("Missing dependency. Run: pip install requests")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"
# Same cascade as backend/src/lib/gemini.js - cheapest/fastest tier first,
# each model behind its own independent daily quota.
GENERATION_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
]

DEFAULT_BATCH_SIZE = 10
RENDER_ZOOM = 1.8  # ~130 DPI equivalent - sharp enough for dense table text without huge payloads

PAGE_MARKER_RE = re.compile(r"===\s*PAGE\s+(\d+)\s*===\s*\n?", re.IGNORECASE)


def load_gemini_key() -> str:
    """Reads GEMINI_API_KEY out of backend/.env directly (no python-dotenv
    dependency - this project's other Python scripts stay dependency-light,
    e.g. extract_images.py only imports fitz)."""
    env_path = os.path.join(BACKEND_DIR, ".env")
    if os.path.isfile(env_path):
        with open(env_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("GEMINI_API_KEY="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if key:
        return key
    sys.exit(f"No GEMINI_API_KEY found in {env_path} or the environment.")


def _is_transient(status: int) -> bool:
    return status in (429, 500, 502, 503, 504)


def _parse_retry_delay_s(body: str, fallback: float = 20.0) -> float:
    m = re.search(r'"retryDelay":\s*"(\d+(?:\.\d+)?)s"', body)
    return float(m.group(1)) + 1.0 if m else fallback


def _is_daily_quota_exhausted(status: int, body: str) -> bool:
    if status != 429:
        return False
    m = re.search(r'"retryDelay":\s*"(\d+(?:\.\d+)?)s"', body)
    return (not m) or float(m.group(1)) > 60


def gemini_transcribe(parts: list, api_key: str, max_tokens: int, attempts: int = 4, base_delay: float = 1.5) -> str:
    payload = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": 0.1},
    }
    last_err = None
    for m_idx, model in enumerate(GENERATION_MODELS):
        url = f"{GEMINI_BASE}/models/{model}:generateContent"
        for i in range(attempts):
            try:
                r = requests.post(
                    url,
                    headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
                    json=payload,
                    timeout=180,
                )
            except requests.RequestException as e:
                last_err = e
                time.sleep(base_delay * (2 ** i))
                continue
            if r.ok:
                if m_idx > 0:
                    print(f"      [gemini] fell back to {model}")
                data = r.json()
                candidate = (data.get("candidates") or [{}])[0]
                text_parts = (candidate.get("content") or {}).get("parts") or []
                return "".join(p.get("text", "") for p in text_parts)
            body = r.text
            last_err = RuntimeError(f"Gemini error {r.status_code}: {body[:300]}")
            if not _is_transient(r.status_code):
                print(f"      [gemini] {model} returned non-transient {r.status_code}, trying next model")
                break
            if _is_daily_quota_exhausted(r.status_code, body):
                print(f"      [gemini] {model} daily quota exhausted, trying next model")
                break
            if i == attempts - 1:
                break
            delay = _parse_retry_delay_s(body) if r.status_code == 429 else base_delay * (2 ** i)
            print(f"      [gemini] got {r.status_code} on {model}, retrying in {delay:.0f}s "
                  f"(attempt {i + 1}/{attempts})")
            time.sleep(delay)
    raise last_err or RuntimeError("Gemini: all models failed")


TRANSCRIBE_INSTRUCTIONS = """You are transcribing pages from a business/interview-prep casebook or study
module, for a student search corpus. You will be given several page images, in order, each preceded by a
label "PAGE <n> IMAGE:".

For EACH page image, transcribe ALL text content completely and exactly as written - do not summarize,
paraphrase, skip, or invent anything. If a page contains a table, reconstruct it as a proper markdown table
(| col | col |) with each value under its correct column and each row correctly grouped - this is the most
important part, since flattening a table's rows and columns together is exactly the failure this is fixing.
Preserve bullet lists, numbered lists, and headings as such. Describe any chart/graph/diagram's content and
labels in one short sentence rather than skipping it, but do not describe purely decorative elements (logos,
background art, page-number footers).

If a page is genuinely just a section divider or decorative image with no real text/data content, output
exactly NO TEXT CONTENT for that page instead of inventing something.

Output EXACTLY one block per page, in this format and nothing else - no preamble, no commentary, no markdown
fences around the whole response. Each "===PAGE <n>===" marker appears ONCE per page, immediately before
that page's content - it is an opening marker only, never a closing tag, so do NOT repeat it again after a
page's content before starting the next page:
===PAGE <n>===
<the transcribed content for that page>
===PAGE <n>===
<the transcribed content for that page>
(one such block per page image given, in the same order, using the exact page numbers given in each
"PAGE <n> IMAGE:" label)"""


def transcribe_batch(doc, page_numbers: list, api_key: str) -> dict:
    """page_numbers is 1-indexed. Returns {page_number: text}.

    IMPORTANT: Gemini's finishReason is per-CALL, not per-page - confirmed
    directly (Finance/"Commercial Banking Beginner_s Module.pdf") that when
    one page in a multi-page batch trips the API's built-in copyright-
    recitation filter (finishReason: RECITATION - this corpus includes real
    published certification modules and textbooks, recognizable enough to
    trigger it on specific pages), the ENTIRE batch's response comes back
    with zero text, silently destroying every OTHER page in that batch too,
    not just the offending one. So a batch is only ever used as a first,
    cheap attempt; any page missing from a batch's result is retried
    individually below, which isolates the actually-blocked page(s) instead
    of losing whole groups of otherwise-fine pages to one bad page.
    """
    parts = [{"text": TRANSCRIBE_INSTRUCTIONS}]
    for n in page_numbers:
        pix = doc[n - 1].get_pixmap(matrix=fitz.Matrix(RENDER_ZOOM, RENDER_ZOOM))
        png_bytes = pix.tobytes("png")
        import base64
        parts.append({"text": f"\nPAGE {n} IMAGE:"})
        parts.append({"inline_data": {"mime_type": "image/png", "data": base64.b64encode(png_bytes).decode("ascii")}})

    max_tokens = min(8192, 500 * len(page_numbers) + 500)
    raw = gemini_transcribe(parts, api_key, max_tokens)

    # The model sometimes echoes "===PAGE <n>===" a second time right after a
    # page's content, as a closing tag - confirmed directly against real
    # output (Finance/"Comparable Company Transaction Analysis.pdf" pages
    # 1-6 all came back empty on a first attempt: every page's real content
    # was followed by that same duplicate marker with nothing between it and
    # the NEXT page's opening marker, and a naive "last match wins" parse let
    # that empty segment silently overwrite the real transcription). So
    # segments are concatenated per page number rather than the last one
    # simply winning - a genuinely empty/duplicate marker then contributes
    # nothing instead of erasing what a real segment already captured.
    result = {}
    matches = list(PAGE_MARKER_RE.finditer(raw))
    for i, m in enumerate(matches):
        n = int(m.group(1))
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(raw)
        text = raw[start:end].strip()
        if text == "NO TEXT CONTENT":
            text = ""
        if text:
            result[n] = (result[n] + "\n" + text) if n in result and result[n] else text
        elif n not in result:
            result[n] = ""
    return result


def resolve_missing_pages(doc, batch: list, result: dict, api_key: str) -> None:
    """Mutates `result` in place. For any page in `batch` not already present
    in `result` (lost to a batch-wide RECITATION block or any other blip),
    retry it alone first - isolates a single bad page instead of accepting
    the whole batch's loss. If a page is STILL blocked even alone (confirmed
    real, not transient: some pages trip Gemini's recitation filter no
    matter how they're asked), fall back to the original PyMuPDF text-layer
    extraction for just that page - imperfect (the exact table-flattening
    problem this script exists to fix) but real content, since leaving a
    page silently empty is strictly worse than that, and would also make
    this file's cache never reach page_count, retrying forever on every
    future run without ever finishing."""
    still_missing = [n for n in batch if n not in result or not result[n]]
    for n in still_missing:
        try:
            solo = transcribe_batch(doc, [n], api_key)
        except Exception:
            solo = {}
        if solo.get(n):
            result[n] = solo[n]
            continue
        plain = doc[n - 1].get_text().strip()
        if plain:
            print(f"      page {n}: Gemini transcription blocked/empty even alone - "
                  f"falling back to plain-text extraction for this one page")
            result[n] = "[NOTE: Gemini vision transcription was blocked for this page " \
                        "(likely its copyright-recitation filter) - falling back to the " \
                        "plain PDF text layer, which may lose table/layout structure.]\n" + plain
        else:
            result[n] = ""  # genuinely blank/image-only page even in the plain text layer


def cache_path(domain_dir: str, pdf_stem: str) -> str:
    cache_dir = os.path.join(domain_dir, ".extract_cache")
    os.makedirs(cache_dir, exist_ok=True)
    return os.path.join(cache_dir, f"{pdf_stem}.json")


def load_cache(path: str) -> dict:
    if not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as f:
        raw = json.load(f)
    return {int(k): v for k, v in raw.items()}


def save_cache(path: str, cache: dict) -> None:
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump({str(k): v for k, v in sorted(cache.items())}, f, ensure_ascii=False)
    os.replace(tmp, path)


def write_final_text(out_dir: str, pdf_name: str, title: str, cache: dict, page_count: int) -> None:
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, os.path.splitext(pdf_name)[0] + ".txt")
    lines = [f"# {title}", f"Source: {pdf_name}", f"Pages: {page_count}", ""]
    for n in range(1, page_count + 1):
        lines.append(f"--- Page {n} ---")
        lines.append("")
        lines.append(cache.get(n, ""))
        lines.append("")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"    wrote {out_path}")


def process_pdf(pdf_path: str, domain_dir: str, out_dir: str, batch_size: int, api_key: str) -> None:
    pdf_name = os.path.basename(pdf_path)
    pdf_stem = os.path.splitext(pdf_name)[0]
    doc = fitz.open(pdf_path)
    page_count = doc.page_count

    c_path = cache_path(domain_dir, pdf_stem)
    cache = load_cache(c_path)

    missing = [p for p in range(1, page_count + 1) if p not in cache]
    if not missing:
        print(f"  {pdf_name}: {page_count}/{page_count} pages already cached, assembling output")
        write_final_text(out_dir, pdf_name, pdf_stem, cache, page_count)
        return

    print(f"  {pdf_name}: {page_count - len(missing)}/{page_count} pages cached, "
          f"transcribing {len(missing)} remaining in batches of {batch_size}")
    for i in range(0, len(missing), batch_size):
        batch = missing[i:i + batch_size]
        try:
            result = transcribe_batch(doc, batch, api_key)
        except Exception as e:
            print(f"    batch {batch[0]}-{batch[-1]} failed ({e}) - cache saved so far, "
                  f"re-run this script to resume.")
            return
        resolve_missing_pages(doc, batch, result, api_key)
        cache.update(result)
        save_cache(c_path, cache)
        got = sum(1 for n in batch if cache.get(n))
        print(f"    pages {batch[0]}-{batch[-1]}: {got}/{len(batch)} with real content "
              f"({len(cache)}/{page_count} total resolved)")

    if len(cache) < page_count:
        print(f"    {pdf_name}: only {len(cache)}/{page_count} pages resolved - "
              f"not writing output yet, re-run to retry the rest")
        return
    write_final_text(out_dir, pdf_name, pdf_stem, cache, page_count)


def main():
    ap = argparse.ArgumentParser(description="Re-extract PDF text via Gemini document vision (fixes table/layout data loss from plain PyMuPDF text extraction)")
    ap.add_argument("domain_dir", help='e.g. "../../Data/Finance Files"')
    ap.add_argument("--out-name", default="Text Files (Gemini pilot)",
                    help='Output subfolder name under domain_dir. Defaults to a pilot folder so this '
                         'never silently overwrites the live "Text Files" ingest.js reads from - pass '
                         '--out-name "Text Files" explicitly once you have reviewed pilot output.')
    ap.add_argument("--only", default="", help="Process just this one PDF filename (for a cheap first test)")
    ap.add_argument("--limit", type=int, default=0, help="Process only the first N PDFs found (0 = all)")
    ap.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE, help="Pages per Gemini call")
    args = ap.parse_args()

    domain_dir = os.path.abspath(args.domain_dir)
    pdf_dir = None
    for candidate in ("PDF Files", "PDF  Files"):
        p = os.path.join(domain_dir, candidate)
        if os.path.isdir(p):
            pdf_dir = p
            break
    if not pdf_dir:
        sys.exit(f'No "PDF Files" folder found under {domain_dir}')

    out_dir = os.path.join(domain_dir, args.out_name)
    api_key = load_gemini_key()

    pdfs = sorted(f for f in os.listdir(pdf_dir) if f.lower().endswith(".pdf"))
    if args.only:
        pdfs = [f for f in pdfs if f == args.only]
        if not pdfs:
            sys.exit(f"'{args.only}' not found in {pdf_dir}")
    if args.limit:
        pdfs = pdfs[:args.limit]

    print(f"Re-extracting {len(pdfs)} PDF(s) from {pdf_dir}")
    print(f"Output -> {out_dir}\n")

    for pdf_name in pdfs:
        process_pdf(os.path.join(pdf_dir, pdf_name), domain_dir, out_dir, args.batch_size, api_key)

    print(f"\nDone. Review {out_dir} before pointing ingest.js at it "
          f"(rename to \"Text Files\", or pass --out-name \"Text Files\" on a re-run).")


if __name__ == "__main__":
    main()

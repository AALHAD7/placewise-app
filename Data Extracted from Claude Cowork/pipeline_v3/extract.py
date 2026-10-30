#!/usr/bin/env python3
"""Placewise v3 extraction pilot: PDF pages -> grounded Markdown with a number-coverage check.

Usage:
  python3 extract.py --env /path/to/backend/.env --out OUTDIR file1.pdf [file2.pdf ...]
  python3 extract.py --dry-run --out OUTDIR file.pdf      # no API calls: render, classify, baseline

Per page:
  pass 1  Gemini Flash reads the rendered page (+ the PDF text layer as a spelling/number reference)
  check   every number in the text layer (minus headers/footers/page numbers) must appear in the output,
          counted with multiplicity, so a value repeated on several bars cannot hide a missing bar
  pass 2  failing pages are re-read with 2x2 zoomed tiles, a thinking budget, and the list of missing values
  flag    pages still failing (or image-only pages where two independent reads disagree) go to review.md
"""
import argparse, base64, collections, concurrent.futures as cf, io, json, os, re, sys, time, urllib.request, urllib.error

import pypdfium2 as pdfium

DPI = 200
NUM = re.compile(r"\d[\d,]*(?:\.\d+)?")

PROMPT = """You are transcribing ONE page of an MBA placement-preparation document (casebook, guide or slide deck) into Markdown for a search index. Fidelity is the only goal.

RULES
1. Transcribe every piece of text on the page in the order a human would read it. Do not summarise, paraphrase, correct, complete, translate or add anything. Omit only running headers, running footers and page numbers.
2. Copy every number, unit, %, currency symbol, sign and decimal exactly as shown.
3. Headings: use #, ##, ### to mirror the page's visual hierarchy.
4. Tables: Markdown tables. Keep every row and column. For a merged cell, repeat its value in every cell it covers. Leave genuinely empty cells empty.
5. Charts (bar, line, pie, waterfall, stacked, scatter, etc.):
   - First write: `Chart: <type> — <title>` and the axis titles/units and legend.
   - Then write `Data points: <C> categories × <S> series` after counting them on the image.
   - Then a Markdown table: one row per category (x-axis value or slice), one column per series, containing EVERY data label printed on the chart. The table must have exactly C rows and S value columns.
   - If a point has no printed label, estimate it from the axis only when gridlines make that possible and prefix it with `~` (e.g. ~42); otherwise write [UNLABELLED]. Never present an estimate as exact.
6. Diagrams (issue trees, frameworks, flowcharts, process flows, timelines, hub-and-spoke): nested bullet lists that preserve the hierarchy; write connections as `A → B`. For a 2x2 matrix, state both axes, then each quadrant's label and contents.
7. Pictures, icons, logos: if they carry information, one line `[Image: <what it shows>]`; if decorative, omit.
8. Interview transcripts: keep speaker labels exactly as written (e.g. Interviewer:, Candidate:), one paragraph per turn.
9. If something is unreadable, write [UNREADABLE] in its place.
10. TEXT LAYER (below the image) holds the exact characters embedded in the PDF, in scrambled order. Use it to get spelling and numbers exactly right. Every number in it must appear in your output, unless it is part of a header, footer or page number. Never output text that is not visible on the page image.

Output only the Markdown for this page."""

RETRY_SUFFIX = """

A previous transcription of this page MISSED these values, which the PDF text layer shows are on the page: {missing}
The full page is the first image; the next images are zoomed quarters (top-left, top-right, bottom-left, bottom-right) of the same page, overlapping slightly.
Re-transcribe the WHOLE page from scratch following the rules. Locate each missing value on the image and put it in its correct place (table cell, chart point, label). Do not insert a value you cannot see."""


# ---------- PDF helpers ----------
def text_layer(page):
    return page.get_textpage().get_text_range()

def render(page, dpi=DPI):
    return page.render(scale=dpi / 72).to_pil()

def png_b64(img):
    buf = io.BytesIO(); img.save(buf, "PNG"); return base64.b64encode(buf.getvalue()).decode()

def tiles(img, overlap=0.08):
    w, h = img.size; ow, oh = int(w * overlap), int(h * overlap)
    boxes = [(0, 0, w // 2 + ow, h // 2 + oh), (w // 2 - ow, 0, w, h // 2 + oh),
             (0, h // 2 - oh, w // 2 + ow, h), (w // 2 - ow, h // 2 - oh, w, h)]
    return [img.crop(b) for b in boxes]

def norm_line(l):
    return re.sub(r"\d+", "#", l.strip().lower())

def boilerplate(texts):
    n = len(texts); freq = collections.Counter()
    for t in texts: freq.update({norm_line(l) for l in t.splitlines() if l.strip()})
    return {k for k, v in freq.items() if n >= 5 and v >= max(3, 0.2 * n)}

def numbers(s):
    return collections.Counter(x.replace(",", "").rstrip(".") for x in NUM.findall(s))

def source_numbers(tl, boiler):
    keep = [l for l in tl.splitlines()
            if norm_line(l) not in boiler and not re.fullmatch(r"\s*(page\s*)?\d{1,4}\s*", l, re.I)]
    return numbers("\n".join(keep))

def missing(src, md):
    return src - numbers(md)


# ---------- Gemini ----------
# Tiered: a cheap model reads every page; pages that fail the number check (and image-only pages'
# second read) go to a stronger model. First model in each list that the key can use is chosen.
LIGHT_MODELS = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-2.5-flash-lite"]
STRONG_MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash"]
PRICES = {"gemini-3.1-flash-lite": (0.25, 1.50), "gemini-3.5-flash-lite": (0.30, 2.50),
          "gemini-2.5-flash-lite": (0.10, 0.40), "gemini-3.8-flash": (0.75, 3.75),
          "gemini-3.7-flash": (0.75, 3.75), "gemini-3.6-flash": (0.75, 3.75)}
CHOSEN = {}          # tier -> (model, thinking-config builder)
SPENT = {"usd": 0.0}
MAX_USD = 5.0

class BudgetExceeded(Exception): pass

def _thinking(style, effort):
    if style == "budget": return {"thinkingConfig": {"thinkingBudget": {"low": 0, "high": 2048}[effort]}}
    if style == "level": return {"thinkingConfig": {"thinkingLevel": {"low": "low", "high": "high"}[effort]}}
    return {}

def _post(key, model, body, timeout=180):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    req = urllib.request.Request(url, json.dumps(body).encode(), {"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)

def preflight(key):
    """Pick the first usable model per tier and the thinking-config style it accepts."""
    if key == "MOCK":
        CHOSEN.update(light=("mock-light", "none"), strong=("mock-strong", "none")); return
    for tier, models in (("light", LIGHT_MODELS), ("strong", STRONG_MODELS)):
        for m in models:
            for style in ("level", "budget", "none"):
                body = {"contents": [{"role": "user", "parts": [{"text": "Reply with OK."}]}],
                        "generationConfig": {"temperature": 0, "maxOutputTokens": 50, **_thinking(style, "low")}}
                try:
                    _post(key, m, body, timeout=60); CHOSEN[tier] = (m, style); break
                except urllib.error.HTTPError as e:
                    msg = e.read()[:300].decode("utf-8", "ignore")
                    if e.code == 400 and "think" in msg.lower(): continue      # try next thinking style
                    print(f"  preflight: {m} unavailable (HTTP {e.code}): {msg[:140]}"); break
                except urllib.error.URLError as e:
                    sys.exit(f"Cannot reach Gemini: {e}")
            if tier in CHOSEN: break
        if tier not in CHOSEN: sys.exit(f"No usable {tier} model among {models}. Nothing was spent.")
    print(f"Models: light={CHOSEN['light'][0]} ({CHOSEN['light'][1]}), strong={CHOSEN['strong'][0]} ({CHOSEN['strong'][1]})")

def gemini(key, parts, tier="light", effort="low", max_out=8192):
    model, style = CHOSEN[tier]
    if key == "MOCK":  # offline test: echo the text layer, drop one number on the light pass to exercise pass 2
        txt = parts[0]["text"].split("TEXT LAYER:", 1)[-1]
        out = re.sub(r"\d", "", txt, count=1) if tier == "light" else txt
        return out, {"in": 1000, "out": 500, "finish": "STOP", "model": model}
    if SPENT["usd"] >= MAX_USD:
        raise BudgetExceeded(f"spend cap ${MAX_USD} reached")
    body = {"contents": [{"role": "user", "parts": parts}],
            "generationConfig": {"temperature": 0, "maxOutputTokens": max_out, **_thinking(style, effort)}}
    for attempt in range(6):
        try:
            d = _post(key, model, body)
            cand = d.get("candidates", [{}])[0]
            text = "".join(p.get("text", "") for p in cand.get("content", {}).get("parts", []) if not p.get("thought"))
            u = d.get("usageMetadata", {})
            res = {"in": u.get("promptTokenCount", 0),
                   "out": u.get("candidatesTokenCount", 0) + u.get("thoughtsTokenCount", 0),
                   "finish": cand.get("finishReason"), "model": model}
            pi, po = PRICES.get(model, (0.75, 3.75))
            SPENT["usd"] += res["in"] / 1e6 * pi + res["out"] / 1e6 * po
            return text, res
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504):
                time.sleep(min(60, 3 * 2 ** attempt)); continue
            raise RuntimeError(f"HTTP {e.code}: {e.read()[:300]}")
        except (urllib.error.URLError, TimeoutError):
            time.sleep(3 * 2 ** attempt)
    raise RuntimeError("Gemini: retries exhausted")

def cost_of(usage):
    c = 0.0
    for u in usage:
        pi, po = PRICES.get(u["model"], (0.75, 3.75)); c += u["in"] / 1e6 * pi + u["out"] / 1e6 * po
    return c

def img_part(img):
    return {"inline_data": {"mime_type": "image/png", "data": png_b64(img)}}


# ---------- per page ----------
def process_page(key, img, pno, tl, src_nums, cache_dir):
    # Runs in a worker thread: only PIL + HTTP here. pdfium is NOT thread-safe, so all
    # PDF reading/rendering happens in the main thread (see run_doc).
    cp = os.path.join(cache_dir, f"p{pno:04d}.json")
    has_text = len(tl.strip()) >= 20
    ref = f"\n\nTEXT LAYER:\n{tl[:6000]}" if has_text else "\n\nTEXT LAYER: (none — this page is an image; rely on the image)"
    usage = []
    md, u = gemini(key, [{"text": PROMPT + ref}, img_part(img)], "light"); usage.append(u)
    miss = missing(src_nums, md); passes = 1; light_missing = sum(miss.values())
    if has_text and light_missing > 0:
        mlist = ", ".join(f"{k} (×{v})" if v > 1 else k for k, v in miss.items())
        parts = [{"text": PROMPT + RETRY_SUFFIX.format(missing=mlist) + ref}, img_part(img)] + [img_part(t) for t in tiles(img)]
        md2, u2 = gemini(key, parts, "strong", "high"); usage.append(u2); passes = 2
        miss2 = missing(src_nums, md2)
        if sum(miss2.values()) <= sum(miss.values()):
            md, miss = md2, miss2
    second = None
    if not has_text:  # image-only page: independent read by the strong model, compare numbers
        md_b, u3 = gemini(key, [{"text": PROMPT + ref}, img_part(img)], "strong", "high"); usage.append(u3)
        a, b = numbers(md), numbers(md_b)
        second = {"disagree": sorted(set((a - b) | (b - a)))[:40]}
        md = md_b                                   # keep the strong model's read for image-only pages
    res = {"page": pno, "markdown": md.strip(), "passes": passes, "light_missing": light_missing,
           "models": [x["model"] for x in usage],
           "src_numbers": sum(src_nums.values()), "missing": dict(miss),
           "unreadable": md.count("[UNREADABLE]"), "estimated": len(re.findall(r"~\d", md)),
           "image_only": not has_text, "second_read": second,
           "tokens_in": sum(x["in"] for x in usage), "tokens_out": sum(x["out"] for x in usage),
           "cost_usd": cost_of(usage),
           "truncated": any(x["finish"] == "MAX_TOKENS" for x in usage)}
    json.dump(res, open(cp, "w"))
    return res


# ---------- per document ----------
def meta_from_path(path):
    parts = path.split(os.sep)
    domain = next((p.replace(" Files", "") for p in parts if p.endswith(" Files")), "")
    name = os.path.splitext(os.path.basename(path))[0]
    inst = next((s for s in ["IIM Calcutta", "IIM C", "IIMA", "IIM A", "IIM B", "IIMB", "IIM L", "IIML", "IIMK", "ISB", "FMS",
                             "XLRI", "MIT", "SRCC", "Damodaran", "Beta", "PEVC"] if s.lower() in name.lower()), "")
    return {"source_file": os.path.basename(path), "domain": domain, "institute": inst, "title": name}

def run_doc(path, out, key, workers, dry):
    pdf = pdfium.PdfDocument(path); n = len(pdf)
    tls = [text_layer(pdf[i]) for i in range(n)]; boiler = boilerplate(tls)
    srcs = [source_numbers(t, boiler) for t in tls]
    meta = meta_from_path(path); stem = re.sub(r"[^A-Za-z0-9]+", "_", meta["title"]).strip("_")
    cache = os.path.join(out, ".cache", stem); os.makedirs(cache, exist_ok=True)
    if dry:
        print(f"[dry] {meta['source_file']}: {n} pages, {sum(sum(s.values()) for s in srcs)} source numbers, "
              f"{sum(1 for t in tls if len(t.strip()) < 20)} image-only pages")
        img = render(pdf[0]); print(f"      render ok {img.size}, tiles {[t.size for t in tiles(img)]}"); return None
    results = {}; inflight = {}; done = 0; stop = {}

    def collect(fs):
        nonlocal done
        for f in fs:
            p = inflight.pop(f)
            try: results[p] = f.result()
            except BudgetExceeded as e: results[p] = {"page": p, "error": str(e)}; stop["budget"] = True
            except Exception as e: results[p] = {"page": p, "error": str(e)}
            done += 1
            errs = sum(1 for r in results.values() if "error" in r)
            if done >= 8 and errs == done:
                stop["errors"] = True
            if done % 20 == 0 or done == n: print(f"  {meta['source_file']}: {done}/{n}", flush=True)

    with cf.ThreadPoolExecutor(workers) as ex:
        for i in range(n):
            pno = i + 1; cp = os.path.join(cache, f"p{pno:04d}.json")
            if os.path.exists(cp):
                results[pno] = json.load(open(cp)); done += 1; continue
            if stop:
                results[pno] = {"page": pno, "error": "skipped: " + ", ".join(stop)}; continue
            img = render(pdf[i])                      # main thread only
            inflight[ex.submit(process_page, key, img, pno, tls[i], srcs[i], cache)] = pno
            if len(inflight) >= workers * 2:          # bound memory: rendered pages waiting
                fin, _ = cf.wait(list(inflight), return_when=cf.FIRST_COMPLETED); collect(fin)
        collect(list(cf.as_completed(list(inflight))))
    write_outputs(path, out, stem, meta, n, results)
    if stop.get("errors"):
        first = next(r["error"] for r in results.values() if "error" in r)
        sys.exit(f"Stopped: every page is failing. First error: {first[:300]}")
    if stop.get("budget"):
        sys.exit(f"Stopped at the ${MAX_USD} spend cap. Re-run with a higher --max-usd to continue (finished pages are kept).")
    return results

def write_outputs(path, out, stem, meta, n, results):
    pages = [results[p] for p in range(1, n + 1)]
    ok = [r for r in pages if "error" not in r]
    src = sum(r["src_numbers"] for r in ok); miss = sum(sum(r["missing"].values()) for r in ok)
    flagged = [r for r in ok if sum(r["missing"].values()) or r["unreadable"] or r["truncated"]
               or (r["second_read"] and r["second_read"]["disagree"])]
    errors = [r for r in pages if "error" in r]
    cost = sum(r.get("cost_usd", 0) for r in ok)
    fm = ["---"] + [f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in meta.items()] + \
         [f"pages: {n}", f"extraction_models: {json.dumps(sorted({m for r in ok for m in r.get('models', [])}))}", "---", ""]
    body = []
    for r in pages:
        body.append(f"<!-- page {r['page']} -->")
        body.append(r.get("markdown", "[EXTRACTION ERROR — see review]"))
        body.append("")
    footer = ["<!-- verification",
              f"source numbers: {src}; captured: {src - miss} ({(1 - miss / src) * 100 if src else 100:.2f}%)",
              f"pages flagged: {len(flagged)}; errors: {len(errors)}; estimated values: {sum(r['estimated'] for r in ok)}",
              "-->"]
    open(os.path.join(out, stem + ".md"), "w", encoding="utf-8").write("\n".join(fm + body + footer) + "\n")
    rep = {"file": meta["source_file"], "pages": n, "source_numbers": src, "missing_numbers": miss,
           "number_coverage": round(1 - miss / src, 4) if src else 1.0,
           "pages_second_pass": sum(1 for r in ok if r["passes"] == 2),
           "light_pass_missing_numbers": sum(r.get("light_missing", 0) for r in ok),
           "pages_flagged": [{"page": r["page"], "missing": r["missing"], "unreadable": r["unreadable"],
                              "second_read_disagree": (r["second_read"] or {}).get("disagree")} for r in flagged],
           "errors": errors, "estimated_values": sum(r["estimated"] for r in ok),
           "tokens_in": sum(r["tokens_in"] for r in ok), "tokens_out": sum(r["tokens_out"] for r in ok),
           "cost_usd": round(cost, 4)}
    json.dump(rep, open(os.path.join(out, stem + ".report.json"), "w"), indent=1)
    print(f"  -> {stem}.md | coverage {rep['number_coverage']:.2%} | flagged {len(flagged)} | ${cost:.3f}")


def read_key(env_path):
    for line in open(env_path):
        if line.strip().startswith("GEMINI_API_KEY="):
            return line.split("=", 1)[1].strip().strip("'\"")
    sys.exit("GEMINI_API_KEY not found in " + env_path)

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("pdfs", nargs="+"); ap.add_argument("--out", required=True)
    ap.add_argument("--env"); ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--max-usd", type=float, default=5.0, help="hard spend cap for this run")
    a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
    MAX_USD = a.max_usd
    key = None if a.dry_run else ("MOCK" if a.env == "MOCK" else read_key(a.env))
    if key: preflight(key)
    for p in a.pdfs:
        print(f"== {p}", flush=True); run_doc(p, a.out, key, a.workers, a.dry_run)
    if key: print(f"Total spend this run: ${SPENT['usd']:.3f}")

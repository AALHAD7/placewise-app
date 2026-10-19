"""Offline preview: each requested casebook page image next to its rebuilt
`placewise-diagram` blocks, as ONE self-contained HTML file.

For the R1 fidelity spot-check (plan 06). Admin-only: the page PNGs and the HTML
are written under backend/ingestion/out/ (gitignored) and are never uploaded or
served. Rendering uses pypdfium2 (never PyMuPDF, which is AGPL).

Usage (from backend/ingestion):
  venv/bin/python diagram_preview.py --pdf <path> --pages 20,52 --source json \
      --json tests/fixtures/preview_pages.json --out out/preview_fixture.html
  venv/bin/python diagram_preview.py --pdf <path> --pages 20,52,32 --source db --version 2

--source json reads {"pages": [{page_no, markdown, diagrams, diagram_issues,
diagram_label_coverage}]}. --source db reads the same fields from ingest_pages for
the ingest_documents row matching the PDF basename + ingestion_version
(service-role client, read-only).
"""
import argparse
import json
import os
import sys
from html import escape
from pathlib import Path

from diagram_schema import FENCE_INFO, TREE_DEPTH_CAP, extract_blocks

INGESTION_DIR = Path(__file__).resolve().parent
OUT_DIR = INGESTION_DIR / "out"
PAGES_DIR = OUT_DIR / "pages"
RENDER_DPI = 150  # same as config.RENDER_DPI; not imported so json mode needs no secrets


def e(v) -> str:
    """HTML-escape any value (None -> empty)."""
    return "" if v is None else escape(str(v), quote=True)


# --------------------------------------------------------------------------- loading

def load_pages_json(path: Path) -> dict:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    pages = data.get("pages", data) if isinstance(data, dict) else data
    return {int(p["page_no"]): p for p in pages}


def load_pages_db(pdf_path: Path, page_nos: list, version: int) -> dict:
    # Lazy import: config.py needs the service-role secrets from backend/.env.
    from supabase import create_client
    from config import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL

    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    docs = (sb.table("ingest_documents").select("id")
            .eq("source_file", pdf_path.name).eq("ingestion_version", version)
            .limit(1).execute().data)
    if not docs:
        raise SystemExit(f"No ingest_documents row for {pdf_path.name!r} version {version}")
    rows = (sb.table("ingest_pages")
            .select("page_no, markdown, diagrams, diagram_issues, diagram_label_coverage")
            .eq("document_id", docs[0]["id"]).in_("page_no", page_nos).execute().data)
    return {int(r["page_no"]): r for r in rows}


# --------------------------------------------------------------------------- rendering pages

def render_page_png(pdf, page_no: int) -> Path:
    """Render 1-based `page_no` to out/pages/p<N>.png at RENDER_DPI."""
    PAGES_DIR.mkdir(parents=True, exist_ok=True)
    out = PAGES_DIR / f"p{page_no}.png"
    page = pdf[page_no - 1]
    image = page.render(scale=RENDER_DPI / 72).to_pil()
    image.save(out)
    page.close()
    return out


# --------------------------------------------------------------------------- diagram -> HTML

def _tree_html(node, depth=1) -> str:
    if not isinstance(node, dict):
        return ""
    if depth > TREE_DEPTH_CAP:
        return "<li><em>(deeper levels cut)</em></li>"
    kids = node.get("children") or []
    inner = "".join(_tree_html(c, depth + 1) for c in kids if isinstance(c, dict))
    sub = f"<ul>{inner}</ul>" if inner else ""
    return f"<li>{e(node.get('label'))}{sub}</li>"


def _grid(header, rows, corner=None) -> str:
    h = ""
    if header is not None:
        cells = ([f"<th>{e(corner)}</th>"] if corner is not None else []) + [f"<th>{e(c)}</th>" for c in header]
        h = f"<thead><tr>{''.join(cells)}</tr></thead>"
    body = []
    for r in rows:
        body.append("<tr>" + "".join(r) + "</tr>")
    return f"<table>{h}<tbody>{''.join(body)}</tbody></table>"


def _list(v):
    return v if isinstance(v, list) else []


def diagram_html(obj) -> str:
    """Rebuild one parsed block as simple HTML. Unknown shapes fall back to
    showing the escaped JSON, never raising."""
    if not isinstance(obj, dict):
        return f"<pre>{e(json.dumps(obj, ensure_ascii=False, indent=1))}</pre>"
    t = obj.get("type")
    try:
        if t == "issue_tree":
            return f"<ul class='tree'>{_tree_html(obj.get('root'))}</ul>"
        if t == "matrix":
            cols, rows, cells = _list(obj.get("cols")), _list(obj.get("rows")), _list(obj.get("cells"))
            corner = f"{obj.get('yAxis') or ''} \\ {obj.get('xAxis') or ''}".strip(" \\")
            body = []
            for i, rname in enumerate(rows):
                row = _list(cells[i]) if i < len(cells) else []
                body.append([f"<th>{e(rname)}</th>"] + [f"<td>{e(c)}</td>" for c in row])
            cap = (f"<caption>rows (yAxis): <b>{e(obj.get('yAxis'))}</b> &middot; "
                   f"cols (xAxis): <b>{e(obj.get('xAxis'))}</b></caption>")
            return _grid(cols, body, corner=corner).replace("<table>", "<table>" + cap, 1)
        if t == "funnel":
            return "<ol class='funnel'>" + "".join(f"<li>{e(s)}</li>" for s in _list(obj.get("stages"))) + "</ol>"
        if t == "flow":
            nodes = [n for n in _list(obj.get("nodes")) if isinstance(n, dict)]
            names = {n.get("id"): n.get("label") for n in nodes}
            nl = "<ul>" + "".join(f"<li><code>{e(n.get('id'))}</code> {e(n.get('label'))}</li>" for n in nodes) + "</ul>"
            rows = []
            for ed in _list(obj.get("edges")):
                if not isinstance(ed, dict):
                    continue
                rows.append([f"<td>{e(names.get(ed.get('from'), ed.get('from')))}</td>",
                             f"<td>{e(names.get(ed.get('to'), ed.get('to')))}</td>",
                             f"<td>{e(ed.get('label'))}</td>"])
            return f"<div><b>Nodes</b>{nl}</div><div><b>Edges</b>{_grid(['from', 'to', 'label'], rows)}</div>"
        if t == "chart":
            series = [s for s in _list(obj.get("series")) if isinstance(s, dict)]
            xs = []
            for s in series:
                for p in _list(s.get("points")):
                    if isinstance(p, list) and p and p[0] not in xs:
                        xs.append(p[0])
            rows = []
            for s in series:
                vals = {p[0]: (p[1] if len(p) > 1 else None) for p in _list(s.get("points"))
                        if isinstance(p, list) and p}
                rows.append([f"<th>{e(s.get('name'))}</th>"] + [f"<td>{e(vals.get(x))}</td>" for x in xs])
            head = (f"<p>{e(obj.get('chart_kind'))} chart &middot; x: <b>{e(obj.get('xLabel'))}</b>"
                    f" &middot; y: <b>{e(obj.get('yLabel'))}</b></p>")
            return head + _grid(xs, rows, corner="series")
        if t == "table":
            header = _list(obj.get("header"))
            rows = [[f"<td>{e(c)}</td>" for c in _list(r)] for r in _list(obj.get("rows"))]
            return _grid(header, rows)
        if t == "other":
            labels = "".join(f"<li>{e(x)}</li>" for x in _list(obj.get("labels")))
            return f"<p>{e(obj.get('description'))}</p><ul>{labels}</ul>"
    except Exception as ex:  # a malformed block must not break the whole preview
        return f"<p class='issue'>render error: {e(ex)}</p><pre>{e(json.dumps(obj, ensure_ascii=False, indent=1))}</pre>"
    return (f"<p class='issue'>unknown type {e(t)}</p>"
            f"<pre>{e(json.dumps(obj, ensure_ascii=False, indent=1))}</pre>")


def page_blocks(page: dict) -> list:
    """Blocks with summaries from the page markdown; falls back to the stored
    `diagrams` list (no summaries) when the markdown has none."""
    blocks = extract_blocks(page.get("markdown") or "")
    if blocks:
        return blocks
    return [{"index": i, "obj": d, "parse_error": None, "summary": None, "fence": FENCE_INFO, "raw": None}
            for i, d in enumerate(page.get("diagrams") or [])]


def page_section(page_no: int, page, img_rel: str) -> str:
    left = f"<img src='{e(img_rel)}' alt='PDF page {page_no}'>"
    if page is None:
        right = "<p class='issue'>No converted data for this page in the source.</p>"
    else:
        parts = []
        blocks = page_blocks(page)
        if not blocks:
            parts.append("<p><em>No diagram blocks on this page.</em></p>")
        for b in blocks:
            obj = b.get("obj")
            title = obj.get("title") if isinstance(obj, dict) else None
            dtype = obj.get("type") if isinstance(obj, dict) else "?"
            fence_note = "" if b.get("fence") == FENCE_INFO else f" <span class='issue'>(fence: {e(b.get('fence'))})</span>"
            parts.append(f"<div class='block'><h3>Block {b['index']}: {e(dtype)} &middot; {e(title or 'untitled')}{fence_note}</h3>")
            if b.get("parse_error"):
                parts.append(f"<p class='issue'>{e(b['parse_error'])}</p><pre>{e(b.get('raw'))}</pre>")
            else:
                parts.append(diagram_html(obj))
                notes = _list(obj.get("notes")) if isinstance(obj, dict) else []
                if notes:
                    parts.append("<p class='notes'>Notes: " + " | ".join(e(n) for n in notes) + "</p>")
            summary = b.get("summary")
            parts.append(f"<p class='summary'><b>Diagram summary:</b> {e(summary)}</p>" if summary
                         else "<p class='issue'>No 'Diagram summary:' line.</p>")
            parts.append("</div>")
        issues = page.get("diagram_issues") or []
        if issues:
            items = "".join(
                f"<li>block {e(i.get('block'))} &middot; <b>{e(i.get('code'))}</b> ({e(i.get('severity'))}) {e(i.get('detail'))}</li>"
                for i in issues if isinstance(i, dict))
            parts.append(f"<div class='issues'><b>Issues</b><ul>{items}</ul></div>")
        else:
            parts.append("<p>Issues: none</p>")
        cov = page.get("diagram_label_coverage")
        cov_txt = "n/a (no text layer or no labels)" if cov is None else f"{float(cov):.0%}"
        parts.append(f"<p>Label coverage: <b>{e(cov_txt)}</b></p>")
        parts.append(f"<details><summary>Page markdown</summary><pre>{e(page.get('markdown'))}</pre></details>")
        right = "".join(parts)
    return (f"<section><h2>PDF page {page_no}</h2><div class='cols'>"
            f"<div class='img'>{left}</div><div class='blocks'>{right}</div></div></section>")


CSS = """
body{font:14px/1.45 -apple-system,Segoe UI,sans-serif;margin:16px;color:#222}
section{border-top:2px solid #444;padding-top:8px;margin-bottom:32px}
.cols{display:flex;gap:16px;align-items:flex-start}
.img{flex:1 1 50%} .img img{width:100%;border:1px solid #ccc}
.blocks{flex:1 1 50%;min-width:0}
.block{border:1px solid #ddd;border-radius:6px;padding:8px;margin-bottom:12px}
table{border-collapse:collapse;margin:6px 0} th,td{border:1px solid #bbb;padding:4px 8px;text-align:left}
caption{caption-side:top;text-align:left;color:#555}
.issue,.issues{color:#b00020} .summary{background:#f4f7fb;padding:6px}
.notes{color:#555;font-size:12px} pre{white-space:pre-wrap;font-size:12px;background:#fafafa}
"""


def build_html(pdf_name: str, source_label: str, sections: list) -> str:
    return ("<!doctype html><html><head><meta charset='utf-8'>"
            "<meta name='robots' content='noindex'>"
            f"<title>Diagram preview: {e(pdf_name)}</title><style>{CSS}</style></head><body>"
            f"<h1>Diagram preview (admin-only, offline)</h1><p>{e(pdf_name)} &middot; source: {e(source_label)}</p>"
            + "".join(sections) + "</body></html>")


def _inside_out_dir(path: Path) -> bool:
    try:
        path.resolve().relative_to(OUT_DIR.resolve())
        return True
    except ValueError:
        return False


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--pages", required=True, help="comma-separated 1-based PDF page numbers")
    ap.add_argument("--source", choices=["json", "db"], required=True)
    ap.add_argument("--json", help="pages JSON (required for --source json)")
    ap.add_argument("--version", type=int, default=2, help="ingestion_version for --source db")
    ap.add_argument("--out", default="out/preview.html")
    args = ap.parse_args(argv)

    pdf_path = Path(args.pdf).resolve()
    page_nos = [int(x) for x in args.pages.split(",") if x.strip()]
    out_path = Path(args.out)
    if not out_path.is_absolute():
        out_path = Path.cwd() / out_path
    if not _inside_out_dir(out_path):
        raise SystemExit(f"--out must be inside {OUT_DIR} (gitignored, admin-only); got {out_path}")

    if args.source == "json":
        if not args.json:
            raise SystemExit("--json is required with --source json")
        pages = load_pages_json(Path(args.json))
        source_label = f"json {Path(args.json).name}"
    else:
        pages = load_pages_db(pdf_path, page_nos, args.version)
        source_label = f"db ingestion_version={args.version}"

    import pypdfium2 as pdfium  # local import keeps diagram_html() testable without it
    pdf = pdfium.PdfDocument(str(pdf_path))
    try:
        sections = []
        for n in page_nos:
            if not 1 <= n <= len(pdf):
                raise SystemExit(f"page {n} is outside 1..{len(pdf)}")
            png = render_page_png(pdf, n)
            rel = os.path.relpath(png, out_path.parent)
            sections.append(page_section(n, pages.get(n), rel))
    finally:
        pdf.close()

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(build_html(pdf_path.name, source_label, sections), encoding="utf-8")
    print(out_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""Orchestrator: runs convert_document() for one PDF, uploads source
material to the private storage bucket, writes ingest_documents/
ingest_pages/ingest_chunks, and returns a report dict.

Data safety: every write here is an INSERT, except the one status update on
the document row this run just inserted. Nothing touches rows of another
ingestion_version or document_chunks. DB rows are built from named fields
only (never by spreading a converter result dict, which carries extra keys
such as label_lines/http_calls that have no column)."""
import uuid
from pathlib import Path

from chunk import chunk_document, embedding_text
from gemini_client import embed_text, call_count

PAGE_BATCH = 50
CHUNK_BATCH = 20
FAILED_CALL_PREFIX = "[UNREADABLE] (vision call failed"

_sb = None


def get_sb():
    """Lazy Supabase client, so importing this module needs no secrets."""
    global _sb
    if _sb is None:
        from supabase import create_client
        from config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
        _sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _sb


def is_failed_call(markdown) -> bool:
    """A page whose vision call failed: kept as a page (needs_review), never chunked."""
    return (markdown or "").startswith(FAILED_CALL_PREFIX)


def chunkable_pages(pages: list) -> list:
    """{page_no, markdown} for every page that may be chunked (failed-call pages excluded)."""
    return [{"page_no": p["page_no"], "markdown": p["markdown"]}
            for p in sorted(pages, key=lambda x: x["page_no"]) if not is_failed_call(p.get("markdown"))]


def lookup_classification(source_file_txt_name: str, sb=None) -> dict:
    """Pulls school/club/year/source_class already written to
    document_chunks by the C0.9 classification pass, keyed by the .txt
    filename (what's actually in document_chunks.source_file)."""
    sb = sb or get_sb()
    res = sb.table("document_chunks").select("school, club, cb_year, source_class") \
        .eq("source_file", source_file_txt_name).limit(1).execute()
    if not res.data:
        raise ValueError(f"No document_chunks row found for source_file={source_file_txt_name!r}")
    row = res.data[0]
    return {"school": row["school"], "club": row["club"], "year": row["cb_year"], "source_class": row["source_class"]}


def version_status(source_file: str, version: int, sb=None):
    """Status of the (source_file, version) document row, or None if absent."""
    sb = sb or get_sb()
    res = sb.table("ingest_documents").select("id, status").eq("source_file", source_file) \
        .eq("ingestion_version", version).limit(1).execute()
    return res.data[0]["status"] if res.data else None


def page_row(document_id: str, p: dict, prompt_version, image_path, reused_from_page_id=None) -> dict:
    """One ingest_pages row from named fields only."""
    md = p.get("markdown")
    failed = is_failed_call(md)
    reasons = list(p.get("review_reasons") or [])
    if failed and "vision_failed" not in reasons:
        reasons.append("vision_failed")
    return {
        "document_id": document_id, "page_no": p["page_no"],
        "is_text": bool(p.get("is_text")), "is_table": bool(p.get("is_table")),
        "is_visual": bool(p.get("is_visual")), "is_scanned": bool(p.get("is_scanned")),
        "text_layer": p.get("text_layer"), "markdown": md,
        "docling_markdown": p.get("docling_markdown"), "method": p.get("method"),
        "number_coverage": p.get("number_coverage"), "word_coverage": p.get("word_coverage"),
        "unreadable_count": int(p.get("unreadable_count") or 0),
        "needs_review": bool(p.get("needs_review")) or failed,
        "review_status": "pending", "image_path": image_path,
        "diagrams": list(p.get("diagrams") or []),
        "diagram_count": int(p.get("diagram_count") or 0),
        "diagram_issues": list(p.get("diagram_issues") or []),
        "diagram_label_coverage": p.get("diagram_label_coverage"),
        "review_reasons": reasons,
        "prompt_version": prompt_version,
        "reused_from_page_id": reused_from_page_id,
    }


def chunk_rows_for(document_id: str, chunks: list, embeddings: list, version: int) -> list:
    """ingest_chunks rows from named fields only. `embeddings[i]` belongs to `chunks[i]`.
    Split parts share one client-generated parent_item_id."""
    if len(chunks) != len(embeddings):
        raise ValueError(f"{len(chunks)} chunks but {len(embeddings)} embeddings")
    split_group_ids = {}
    rows = []
    for c, emb in zip(chunks, embeddings):
        parent_id = None
        if c.get("parent_item_id") == "SPLIT":
            key = (c["page_start"], c["section_title"].split(" (part")[0])
            if key not in split_group_ids:
                split_group_ids[key] = str(uuid.uuid4())
            parent_id = split_group_ids[key]
        rows.append({
            "document_id": document_id, "page_start": c["page_start"], "page_end": c["page_end"],
            "section_title": c["section_title"], "content": c["content"],
            "content_type": None, "embedding": emb, "parent_item_id": parent_id,
            "ingestion_version": version, "is_active": False,
            "has_diagram": bool(c.get("has_diagram")),
        })
    return rows


def write_version(meta: dict, source_file: str, sha256: str, page_count: int, pages: list,
                  chunks: list, version: int, prompt_version, notes, reuse_file_id=None,
                  embeddings=None, image_paths=None, reused_from=None, sb=None, file_id=None) -> dict:
    """Insert one ingestion version: ingest_documents (status pending) ->
    ingest_pages (batches of 50) -> ingest_chunks (batches of 20,
    is_active=False) -> status done on this new document only.

    - embeddings: list aligned with `chunks` (required; embed before writing).
    - image_paths: {page_no: storage path}; default is pages/<reuse_file_id or new id>/<n>.png.
    - reused_from: {page_no: v1 page id} for pages reused from an earlier version.
    Returns {"file_id", "page_rows", "chunk_rows"}."""
    sb = sb or get_sb()
    if embeddings is None:
        raise ValueError("write_version needs embeddings aligned with chunks")
    file_id = file_id or str(uuid.uuid4())
    image_owner = reuse_file_id or file_id
    image_paths = image_paths or {}
    reused_from = reused_from or {}

    doc_row = {
        "id": file_id, "source_file": source_file,
        "school": meta.get("school"), "club": meta.get("club"), "year": meta.get("year"),
        "source_class": meta["source_class"], "page_count": page_count,
        "sha256": sha256, "ingestion_version": version, "status": "pending",
        "prompt_version": prompt_version, "notes": notes,
    }
    sb.table("ingest_documents").insert(doc_row).execute()

    page_rows = [page_row(file_id, p, p.get("prompt_version", prompt_version),
                          image_paths.get(p["page_no"], f"pages/{image_owner}/{p['page_no']}.png"),
                          reused_from.get(p["page_no"]))
                 for p in sorted(pages, key=lambda x: x["page_no"])]
    for i in range(0, len(page_rows), PAGE_BATCH):
        sb.table("ingest_pages").insert(page_rows[i:i + PAGE_BATCH]).execute()

    chunk_rows = chunk_rows_for(file_id, chunks, embeddings, version)
    for i in range(0, len(chunk_rows), CHUNK_BATCH):
        sb.table("ingest_chunks").insert(chunk_rows[i:i + CHUNK_BATCH]).execute()

    sb.table("ingest_documents").update({"status": "done"}).eq("id", file_id).execute()
    return {"file_id": file_id, "page_rows": page_rows, "chunk_rows": chunk_rows}


def ingest_one_pdf(pdf_path: Path, txt_source_file: str, call_log: list, version: int = 1) -> dict:
    """Full ingestion of a new PDF (converts, uploads the PDF and page PNGs).
    Skips if (source_file, version) is already done."""
    sb = get_sb()
    pdf_basename = pdf_path.name
    status = version_status(pdf_basename, version, sb)
    if status == "done":
        print(f"  already done: {pdf_basename} v{version}; skipping")
        return {"skipped": True, "source_file": pdf_basename, "version": version}
    if status is not None:
        raise RuntimeError(f"{pdf_basename} v{version} exists with status {status!r}; fix by hand or bump the version")

    meta = lookup_classification(txt_source_file, sb)
    from convert import convert_document  # lazy: Docling is heavy
    from config import STORAGE_BUCKET, RENDER_DPI, PROMPT_VERSION
    result = convert_document(pdf_path, call_log)

    # Embed before any write, so a failed embedding leaves no partial version.
    chunks = chunk_document(chunkable_pages(result["pages"]))
    embeddings = [embed_text(embedding_text(c["content"])) for c in chunks]

    # Upload the original PDF and the page renders (admin-only bucket) under one id.
    upload_id = str(uuid.uuid4())
    with open(pdf_path, "rb") as f:
        sb.storage.from_(STORAGE_BUCKET).upload(f"pdfs/{upload_id}.pdf", f.read(), {"content-type": "application/pdf"})
    import pypdfium2 as pdfium
    from page_classify import render_page_png
    pdf = pdfium.PdfDocument(str(pdf_path))
    image_paths = {}
    for p in result["pages"]:
        png = render_page_png(pdf[p["page_no"] - 1], RENDER_DPI)
        path = f"pages/{upload_id}/{p['page_no']}.png"
        sb.storage.from_(STORAGE_BUCKET).upload(path, png, {"content-type": "image/png"})
        image_paths[p["page_no"]] = path

    w = write_version(meta, pdf_basename, result["sha256"], result["page_count"], result["pages"],
                      chunks, version, PROMPT_VERSION, None,
                      embeddings=embeddings, image_paths=image_paths, sb=sb, file_id=upload_id)
    return {
        "file_id": w["file_id"], "source_file": pdf_basename, "page_count": result["page_count"],
        "pages": result["pages"], "chunks": w["chunk_rows"],
        "vision_calls": call_count["vision"], "embedding_calls": call_count["embedding"]
    }

#!/usr/bin/env python3
"""
Pulls embedded images out of every PDF in a domain's "PDF Files" folder and
saves them to "Images/<pdf-basename>/page<N>_img<M>.png", plus one
manifest.jsonl per domain listing what was extracted (consumed by
scripts/ingestImages.js — this script never talks to Supabase or Gemini
itself, matching the project's existing "Python extracts, Node ingests"
split, see extract_domain.py / ingest.js).

Filters out small/decorative images (logos, bullet icons, dividers) by pixel
area before saving, since captioning + embedding + storing those would just
add retrieval noise for zero informational value.

Usage: python3 extract_images.py "<domain folder path>"
  e.g. python3 extract_images.py "Data/Finance Files"

Idempotent: re-running skips any (pdf, page, image index) already present in
the manifest, so it's safe to re-run after adding more PDFs to a domain.
"""
import sys
import os
import json
import hashlib
import fitz  # PyMuPDF

MIN_WIDTH = 120
MIN_HEIGHT = 120
MIN_AREA = 30000  # ~120x250 or larger - filters square icons even above MIN_WIDTH/HEIGHT alone


def load_manifest(path):
    seen = set()
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                row = json.loads(line)
                seen.add((row["source_file"], row["page"], row["image_index"]))
    return seen


def append_manifest(path, row):
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(row) + "\n")


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 extract_images.py \"<domain folder path>\"")
        sys.exit(1)

    domain_dir = sys.argv[1]
    pdf_dir = None
    for candidate in ("PDF Files", "PDF  Files"):
        p = os.path.join(domain_dir, candidate)
        if os.path.isdir(p):
            pdf_dir = p
            break
    if not pdf_dir:
        print(f"No 'PDF Files' folder found under {domain_dir}")
        sys.exit(1)

    images_root = os.path.join(domain_dir, "Images")
    os.makedirs(images_root, exist_ok=True)
    manifest_path = os.path.join(images_root, "manifest.jsonl")
    already = load_manifest(manifest_path)

    total_saved, total_skipped_small, total_skipped_done, total_failed = 0, 0, 0, 0

    for fname in sorted(os.listdir(pdf_dir)):
        if not fname.lower().endswith(".pdf") or fname.startswith("."):
            continue
        src_path = os.path.join(pdf_dir, fname)
        basename = os.path.splitext(fname)[0]
        out_dir = os.path.join(images_root, basename)

        try:
            doc = fitz.open(src_path)
        except Exception as e:
            print(f"FAIL  {fname} -- could not open: {e}")
            total_failed += 1
            continue

        file_saved = 0
        # Repeated per-page graphics (a header banner, a background texture, a
        # footer logo) share the exact same image bytes every time they
        # appear - a real large document (see IIM A GenMan Guide.pdf: 3
        # distinct images each repeated ~92 times, once per page) would
        # otherwise flood the manifest with near-100% decorative noise.
        # Hashing bytes and skipping repeats within the same PDF keeps only
        # each visually distinct image once.
        seen_hashes_this_pdf = set()
        for page_index in range(doc.page_count):
            page = doc[page_index]
            page_num = page_index + 1
            for img_index, img in enumerate(page.get_images(full=True), start=1):
                key = (fname, page_num, img_index)
                if key in already:
                    total_skipped_done += 1
                    continue
                xref = img[0]
                try:
                    base = doc.extract_image(xref)
                    width, height = base.get("width", 0), base.get("height", 0)
                    if width < MIN_WIDTH or height < MIN_HEIGHT or (width * height) < MIN_AREA:
                        total_skipped_small += 1
                        already.add(key)  # decorative - never worth reconsidering on re-run
                        continue
                    img_hash = hashlib.sha256(base["image"]).hexdigest()
                    if img_hash in seen_hashes_this_pdf:
                        total_skipped_small += 1  # repeated graphic, same bucket as "not real content"
                        already.add(key)
                        continue
                    seen_hashes_this_pdf.add(img_hash)
                    os.makedirs(out_dir, exist_ok=True)
                    ext = base.get("ext", "png")
                    out_name = f"page{page_num}_img{img_index}.{ext}"
                    out_path = os.path.join(out_dir, out_name)
                    with open(out_path, "wb") as f:
                        f.write(base["image"])
                    append_manifest(manifest_path, {
                        "source_file": fname,
                        "page": page_num,
                        "image_index": img_index,
                        "path": os.path.relpath(out_path, domain_dir),
                        "width": width,
                        "height": height
                    })
                    already.add(key)
                    file_saved += 1
                    total_saved += 1
                except Exception as e:
                    print(f"  FAIL {fname} page {page_num} img {img_index} -- {e}")
                    total_failed += 1
        doc.close()
        if file_saved:
            print(f"OK   {fname}  -- {file_saved} images saved")

    print(f"\n=== {os.path.basename(domain_dir)} ===")
    print(f"Saved: {total_saved}  |  Skipped (too small/decorative): {total_skipped_small}  |  Already done: {total_skipped_done}  |  Failed: {total_failed}")
    print(f"Manifest: {manifest_path}")


if __name__ == "__main__":
    main()

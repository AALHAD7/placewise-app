# PLACEWISE: C0.95 HIGH-FIDELITY PDF RE-INGESTION

This replaces any earlier C0.95 instructions. **PAUSE C2.** Do not start C2 until this phase is approved.

## Why

The casebooks are PDFs full of issue trees, frameworks, tables, charts and slide layouts. Plain text extraction drops these. The current `.txt` chunks may be missing content, and some of the 20 C1 "author errors" may really be conversion losses. Goal: convert every active club_casebook PDF with minimal data loss, prove the fidelity with automatic checks, and store everything in Supabase in a way that every chunk can be traced back to its original page.

## Ground rules

- **Run conversion as a standalone Python script** (`backend/ingestion/`), not in Supabase Edge Functions. The script writes to Supabase through the Supabase client using the service-role key.
- **Never delete existing data.** Old chunks stay in place with `is_active` unchanged until I approve the switch-over (step 7).
- **Scope:** only files where `source_class = club_casebook`. Commercial, certification, external_academic and unattributed files are not processed.
- **Hard caps:** stop immediately and report if you hit one.
  - Pilot: 300 LLM calls (vision + any other model calls).
  - No embedding calls during the pilot beyond the 2 pilot files.
- **Privacy:** original PDFs and page images are admin-only. Never expose them, or their storage URLs, to non-admin users.

---

## Step 1: Tools

Use three tools, each for the job it is good at:

| Tool | Role |
|---|---|
| **PyMuPDF (fitz)** | Page rendering to PNG, page classification (text amount, images, vector drawings), and the raw text layer used as the ground truth for fidelity checks. Not trusted alone for reading order, tables or diagrams. |
| **Docling** | Primary converter for text and table pages: layout analysis, reading order (multi-column and slide layouts), tables to Markdown, OCR for scanned pages. |
| **Gemini vision** (MODEL_LIGHT if it accepts image/PDF input; otherwise name the cheapest vision-capable model and stop for approval) | Only for pages Docling cannot represent faithfully: issue trees, framework diagrams, flowcharts, charts, and pages with failed fidelity checks. |

**Licence check:** PyMuPDF is AGPL. Confirm it is used only in this offline ingestion script and is not imported anywhere in the deployed backend that serves users. If it is, report it. `pypdfium2` (permissive licence) can replace it for rendering and text-layer extraction.

Pin all library versions in `requirements.txt`.

---

## Step 2: Supabase storage and schema

### Storage (private bucket `casebook-source`)
- `pdfs/<file_id>.pdf`: the original PDF (the master copy).
- `pages/<file_id>/<page_no>.png`: every page rendered at 150 dpi.

### Tables
Write a migration file (`migration_037_ingestion_v2.sql`). Stop and ask me to run it if it needs an `ALTER`/`CREATE` you can't run.

**`ingest_documents`**
- id, source_file, school, club, year, source_class
- page_count, sha256 of the PDF
- ingestion_version, status (pending / done / needs_review), created_at

**`ingest_pages`**
- id, document_id, page_no
- page_type: text / table / visual / scanned (a page can have several flags; use booleans or an array)
- text_layer (raw PyMuPDF text)
- markdown (final transcription)
- method: docling / gemini_vision / docling+gemini
- number_coverage, word_coverage (0–1)
- unreadable_count
- needs_review (boolean), review_status (pending / approved / fixed)
- image_path

**`ingest_chunks`**
- id, document_id, page_start, page_end
- section_title, content (Markdown)
- content_type hint (case / guesstimate / framework / concept / question / other; may be null)
- embedding (pgvector, SAME embedding model and dimension as the current `document_chunks`)
- ingestion_version, is_active (default false until switch-over)

Enable RLS on all three tables with no anon/authenticated access. Only the service role and admin endpoints can read them.

---

## Step 3: Page classification (code only, no LLM)

For each page, with PyMuPDF:
- **text:** text layer ≥ 200 characters, and images + vector drawings cover < 30% of the page area.
- **table:** tables detected (Docling's table detection, or PyMuPDF `find_tables`).
- **visual:** images or vector drawings cover ≥ 30% of the page, OR many short text fragments placed in a tree/box pattern (likely an issue tree or framework diagram), OR text layer < 200 characters while the rendered page is not blank.
- **scanned:** no text layer, but the page is not blank.

Log the classification per page.

---

## Step 4: Conversion

1. **Run Docling on the whole PDF** first. Map its output back to page numbers.
2. **Text and table pages:** use Docling's Markdown. Tables must be Markdown tables.
3. **Visual and scanned pages:** send the rendered page PNG (plus the page's text layer as a hint, if any) to Gemini vision with exactly this prompt:

   ```
   Transcribe EVERYTHING on this page of a business-school placement casebook, exactly.
   - Preserve every number, label, unit and symbol exactly as shown.
   - Issue trees, frameworks, flowcharts and mind maps: render as nested bullet lists that keep the hierarchy and the connections.
   - Charts: give the chart title, axis labels, legend and every data value shown.
   - Tables: render as Markdown tables.
   - Keep the reading order a human would use.
   - Do not summarise, interpret, correct, complete or add anything.
   - If any part is unreadable, write [UNREADABLE] in its place.
   Output Markdown only.
   ```

4. **Merge:** for visual pages, if Docling also produced text, keep the Gemini output as the page Markdown and store Docling's in a debug field.

---

## Step 5: Automatic fidelity checks (code)

For every page:
- **number_coverage:** the share of numbers in the PyMuPDF text layer (normalise commas, ₹, %, decimals) that appear in the final Markdown. Target: 1.00.
- **word_coverage:** the share of text-layer words (lowercased, punctuation stripped, stop-words kept) present in the final Markdown. Target ≥ 0.98.
- **unreadable_count:** the number of [UNREADABLE] markers.

Rules:
- A page goes to review (`needs_review = true`) if number_coverage < 1.00, word_coverage < 0.98, or unreadable_count > 0.
- **Automatic retry:** if a Docling page fails, re-run it through Gemini vision once and re-check. Keep whichever version scores higher. Log both.
- Scanned pages have no text layer to compare against, so they always go to review in the pilot.

### Admin page review
Add an admin-only "Page review" screen: page image | final Markdown side by side, the check scores, and actions **Approve / Edit Markdown / Re-run with vision**. Log every action.

---

## Step 6: Chunking and embeddings

1. **Chunk at structure, not at a fixed size.** Split the document Markdown at headings and at clear item boundaries ("Case 3", "Guesstimate:", "Question:"). Keep one case or guesstimate in one chunk, together with its solution, even if it spans pages.
2. If a single item is very long, split it with overlap, and record that the parts belong together (`parent_item_id` or the same `section_title`).
3. Each chunk records page_start and page_end.
4. Embed with the same embedding model and dimension as the current `document_chunks`, and store in `ingest_chunks.embedding`.

---

## Step 7: Pilot (2 files only)

Files: **FMS Consulting CaseBook 2023-24** and **IIMA PM Casebook** (the C1 pilot files).

Report:
1. **Pages by type,** for each file.
2. **Calls used:** vision calls, embedding calls.
3. **Fidelity:** average and minimum number_coverage and word_coverage; pages sent to review (count, with reasons).
4. **Diff vs the old `.txt` chunks:** content present in the new extraction but missing from the old `.txt` (issue trees, tables, chart values, framework diagrams). Give a count, plus 10 examples showing old text | new text.
5. **Visual proof:** 5 visual pages, each as page image | extracted Markdown.
6. **Re-check of the 20 genuine C1 failures:** for each one, look at the original PDF page(s) and classify it:
   - CONVERSION_LOSS: the missing explanation or number is visible on the page
   - AUTHOR_ERROR: the error is on the original page too
   - UNCLEAR
   Give the counts and one line per item.
7. **Projection for all active club_casebook PDFs:**
   - total pages
   - % visual/scanned
   - vision calls
   - embedding calls
   - cost (low / expected / high)
   - time to run

**STOP and report.** Do not switch any chunks to active, and do not start C2.

---

## Step 8: After I approve (not now)

Run the full conversion with the approved settings and a hard cap that I will set. Then:
1. Report the fidelity summary for the full corpus, and work through the page review list with me.
2. **Switch-over:** set the new `ingest_chunks` active and the old `.txt`-based `document_chunks` inactive for the same files. Retrieval reads from the new chunks. Keep the old rows for rollback.
3. Re-run C2 structured extraction on the new chunks.

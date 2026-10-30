---
name: casebook-ingestion
description: How PlaceWise turns a casebook PDF into faithful, citable RAG chunks — page classification, Docling/Gemini conversion, diagram extraction, fidelity checks, chunking, embedding and storage. Use whenever changing or running anything in backend/ingestion/ or touching the ingest_* tables.
---

# Casebook ingestion

Goal: every fact, number and diagram on a casebook page survives into the chunk a student
reads, and every chunk traces back to its exact page.

## Pipeline

```
PDF ─► classify each page ─► convert ─► fidelity check ─► (retry / flag) ─► chunk ─► embed ─► store
```

Code: `backend/ingestion/` — `pipeline.py` orchestrates; run from that folder with the
pinned `requirements.txt`. Config (models, thresholds, caps) lives in `config.py`; change
values there, not inline.

### 1. Classify (code only, no LLM) — `page_classify.py`
| Type | Rule |
|---|---|
| text | text layer ≥ 200 chars and images/drawings < 30% of page |
| table | table detected (Docling or PyMuPDF `find_tables`) |
| visual | images/drawings ≥ 30%, or many short fragments in a tree/box layout, or little text on a non-blank page |
| scanned | no text layer, non-blank |

A page can carry several flags.

### 2. Convert — `convert.py`
- **text / table** → Docling (reading order, tables → Markdown). Strip Docling image placeholders.
- **visual / scanned / failed check** → Gemini vision on the 150-dpi PNG.
- Visual pages must produce **two outputs**: the Markdown transcription *and* one structured
  diagram block per diagram, following the `diagram-transcription` skill. Nested bullets alone
  are not enough — they lose the shape the student needs to see.

### 3. Fidelity — `fidelity.py`
Compare against the raw text layer:
- `number_coverage` — share of numbers in the text layer that appear in the output. Target 1.0.
- `word_coverage` — share of content words. Target ≥ 0.9.
- `unreadable_count` — `[UNREADABLE]` markers.
- Diagram blocks must validate against the schema; every label in the block must appear on the page.

Fail → one retry with a targeted hint → still failing → `needs_review = true`. Never "fix" a
page by inventing content. Scanned pages have no text layer, so they always get
`needs_review = true` until a human approves them.

### 4. Chunk — `chunk.py`
- Split on section/case boundaries, never mid-diagram or mid-table.
- A diagram block stays in the same chunk as its explanation.
- Each chunk carries `document_id`, `page_start`, `page_end`, `section_title`, and a
  `content_type` hint (case / guesstimate / framework / concept / question / other).
- Domain/subdomain comes from the source folder and existing `document_chunks` metadata.

### 5. Embed and store
- Embeddings: `gemini-embedding-001`, 768 dims (must match `document_chunks`).
- Embed the text plus a plain-language summary of any diagram, not the raw JSON.
- Write to `ingest_documents` / `ingest_pages` / `ingest_chunks` with `is_active = false`.
- Original PDF and page PNGs go to the private `casebook-source` bucket (admin-only).

## Rules
- Only `source_class = club_casebook`.
- Never delete or overwrite `document_chunks` or earlier `ingest_*` rows. Re-runs bump
  `ingestion_version`.
- Idempotent: skip a PDF whose sha256 + `ingestion_version` is already `done`.
- Count every Gemini call. Use flash-lite first (cascade in `config.py`). Before a full-corpus
  run, estimate calls × cost and record it in `log.md`. Budget is ~$20/month.
- Pilot on one PDF before any batch; record the pilot's fidelity numbers in `log.md`.

## Proof of done
Report for each run: pages by type, method counts, mean/min coverage, `needs_review` count,
chunk count, Gemini calls. Add 3 sample visual pages for spot-checking: page number, diagram
block, rendered summary.

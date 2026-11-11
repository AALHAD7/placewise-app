#!/usr/bin/env node
// D1.2: one-shot ingestion of `PM_Compendium.md` into
// `ingest_documents`/`ingest_chunks` (source_class = 'placewise_reference',
// domain = 'Prodman'). Every chunk is written is_active = false — nothing
// here is reachable by any live retrieval path until a separate,
// explicit switch-over decision.
//
// Mirrors backend/scripts/ingestFinanceCompendium.js (FIN1.02), minus the
// diagram-authoring step: this source's diagrams are already self-describing
// plain-text fence + caption pairs, carried through verbatim inside
// record.content from the parser — there is nothing to author or verify.
// The only paid calls here are the embedding calls, one per chunk.
//
// Data safety (CLAUDE.md): no delete, no overwrite of an existing row.
// Same ABORT-on-pre-existing-row and dimension-check posture as FIN1.02.
//
// Usage:
//   node scripts/ingestPmCompendium.js --dry-run   # parse only, zero embedding
//                                                   # calls, zero Supabase writes
//   node scripts/ingestPmCompendium.js             # the real run
//   node scripts/ingestPmCompendium.js --resume    # only if a prior run left a
//                                                   # 'pending' document row with
//                                                   # zero chunks (crashed mid-run)

import { createHash, randomUUID } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { supabase } from "../src/lib/supabase.js";
import { embedTexts } from "../src/lib/gemini.js";
import { parseCompendium } from "../src/lib/pmCompendiumParser.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SOURCE_FILE_NAME = "PM_Compendium.md";
const SOURCE_PATH = path.resolve(__dirname, "../../Data/Prodman Files/PM_Compendium.md");
const REPORT_PATH = path.resolve(__dirname, "../ingestion/out/d1_ingest_report.json");
const EMBEDDING_DIM = 768;
const DOMAIN = "Prodman";
const SOURCE_CLASS = "placewise_reference";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const RESUME = args.includes("--resume");

function sha256Buffer(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

/** Best-effort, admin/audit-only heuristic for `has_diagram` — not load-bearing
 * for any grounding decision (see plan D1.2 Decisions #2). This file's own
 * convention (stated at PM_Compendium.md line ~300) is "every figure ... is
 * followed by a caption": a fenced code block whose closing fence is followed,
 * within a few lines, by the literal word "Figure". */
function hasDiagramHeuristic(content) {
  const text = String(content || "");
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*```/.test(lines[i])) {
      // find the matching closing fence
      for (let j = i + 1; j < lines.length; j++) {
        if (/^\s*```/.test(lines[j])) {
          const window = lines.slice(j + 1, j + 4).join("\n");
          if (/Figure/.test(window)) return true;
          break;
        }
      }
    }
  }
  return false;
}

async function main() {
  const startedAt = new Date().toISOString();

  // --- Step 1: read source, hash it -----------------------------------
  const fileBuf = await readFile(SOURCE_PATH);
  const markdownText = fileBuf.toString("utf8");
  const sha256 = sha256Buffer(fileBuf);
  const totalLineCount = markdownText.split("\n").length;

  // --- Step 2: ABORT if a row already exists, unless a clean --resume --
  const { data: existingRows, error: existingErr } = await supabase
    .from("ingest_documents")
    .select("id, status")
    .eq("source_file", SOURCE_FILE_NAME);
  if (existingErr) throw new Error(`ingest_documents lookup failed: ${existingErr.message}`);

  let resumeDocumentId = null;
  if (existingRows && existingRows.length > 0) {
    const row = existingRows[0];
    if (RESUME && row.status === "pending") {
      const { count, error: countErr } = await supabase
        .from("ingest_chunks")
        .select("id", { count: "exact", head: true })
        .eq("document_id", row.id);
      if (countErr) throw new Error(`ingest_chunks count failed: ${countErr.message}`);
      if (count === 0) {
        resumeDocumentId = row.id;
        console.log(`RESUME: reusing pending document row id=${row.id} (0 chunks written yet)`);
      } else {
        console.log(`ABORT: ${SOURCE_FILE_NAME} already has an ingest_documents row (id=${row.id}, status=${row.status}) with ${count} chunks already written — not a clean resume target.`);
        process.exit(1);
      }
    } else {
      console.log(`ABORT: ${SOURCE_FILE_NAME} already has an ingest_documents row (id=${row.id}, status=${row.status})`);
      process.exit(1);
    }
  }

  // --- Step 3: parse -----------------------------------------------------
  const records = parseCompendium(markdownText);
  console.log(`parsed ${records.length} chunk-ready records from ${SOURCE_FILE_NAME}`);

  const wouldWriteChunks = records.length;

  if (DRY_RUN) {
    console.log("DRY RUN — no Supabase writes, no embedding calls, no diagram-authoring calls (none exist in this pipeline).");
    console.log(`would write ingest_documents row: ${JSON.stringify({
      source_file: SOURCE_FILE_NAME,
      school: null,
      club: null,
      year: "2026",
      source_class: SOURCE_CLASS,
      domain: DOMAIN,
      page_count: totalLineCount
    })}`);
    console.log(`would write ${wouldWriteChunks} ingest_chunks rows`);
    console.log(`gemini calls: { embedding: 0 }`);
    return;
  }

  // --- Step 4: embed every record's content, batch call ------------------
  const embeddings = await embedTexts(records.map(r => r.content), "RETRIEVAL_DOCUMENT");
  const embeddingCalls = records.length; // embedTexts makes one embedOne call per text

  for (const vec of embeddings) {
    if (!Array.isArray(vec) || vec.length !== EMBEDDING_DIM) {
      console.log(`ABORT: embedding with ${vec ? vec.length : "null"} dims`);
      process.exit(1);
    }
  }

  // --- Step 5: insert (or reuse, on --resume) the ingest_documents row ----
  let documentId = resumeDocumentId;
  if (!documentId) {
    const docRow = {
      source_file: SOURCE_FILE_NAME,
      school: null,
      club: null,
      year: "2026",
      source_class: SOURCE_CLASS,
      domain: DOMAIN,
      page_count: totalLineCount, // repurposed: source-file line count, not PDF pages (FIN1.01/D1.1 convention)
      sha256,
      status: "pending"
    };
    const { data: inserted, error: docErr } = await supabase
      .from("ingest_documents")
      .insert(docRow)
      .select("id")
      .single();
    if (docErr) throw new Error(`ingest_documents insert failed: ${docErr.message}`);
    documentId = inserted.id;
    console.log(`inserted ingest_documents row id=${documentId}`);
  }

  // --- Step 6: insert ingest_chunks rows, one multi-row insert ------------
  const splitGroupIds = new Map(); // topicId -> client-generated parent_item_id, same convention as chunk_document/FIN1.02
  const chunkRows = records.map((record, i) => {
    let parentItemId = null;
    if (record.partCount > 1) {
      if (!splitGroupIds.has(record.topicId)) {
        splitGroupIds.set(record.topicId, randomUUID());
      }
      parentItemId = splitGroupIds.get(record.topicId);
    }
    return {
      document_id: documentId,
      page_start: record.lineStart,
      page_end: record.lineEnd,
      section_title: record.topic,
      content: record.content,
      content_type: record.type,
      embedding: embeddings[i],
      parent_item_id: parentItemId,
      has_diagram: hasDiagramHeuristic(record.content),
      metadata: { topicId: record.topicId, aliases: record.aliases, ...(record.metadata || {}) },
      is_active: false
    };
  });

  const { error: chunkErr } = await supabase.from("ingest_chunks").insert(chunkRows);
  if (chunkErr) {
    // Document row is left 'pending' with zero chunks written (insert is
    // one atomic multi-row statement) — a clean, discoverable state for
    // --resume on the next run, not a half-written one.
    throw new Error(`ingest_chunks insert failed, document ${documentId} left pending with 0 chunks: ${chunkErr.message}`);
  }
  console.log(`inserted ${chunkRows.length} ingest_chunks rows for document ${documentId} (is_active=false)`);

  const { error: statusErr } = await supabase
    .from("ingest_documents")
    .update({ status: "done" })
    .eq("id", documentId);
  if (statusErr) throw new Error(`ingest_documents status update failed: ${statusErr.message}`);

  const finishedAt = new Date().toISOString();
  const report = {
    documentId,
    totalRecords: records.length,
    chunksWritten: chunkRows.length,
    geminiCalls: {
      embedding: embeddingCalls
    },
    startedAt,
    finishedAt
  };

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`report written: ${REPORT_PATH}`);
  console.log(JSON.stringify(report, null, 2));
}

main().catch(err => {
  console.error(`FATAL: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});

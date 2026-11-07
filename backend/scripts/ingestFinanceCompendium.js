#!/usr/bin/env node
// FIN1.02: one-shot ingestion of `finance_compendium.md` into
// `ingest_documents`/`ingest_chunks` (source_class = 'placewise_reference',
// domain = 'Finance'). Every chunk is written is_active = false — nothing
// here is reachable by any live retrieval path until a separate,
// explicit switch-over decision.
//
// Data safety (CLAUDE.md): no delete, no overwrite of an existing row.
// Same ABORT-on-pre-existing-row and dimension-check posture as
// backend/ingestion/run_patch.py / run_v4.py, ported to JS.
//
// Usage:
//   node scripts/ingestFinanceCompendium.js --dry-run   # parse + diagram-author gate only,
//                                                        # zero embedding calls, zero writes
//   node scripts/ingestFinanceCompendium.js             # the real run
//   node scripts/ingestFinanceCompendium.js --resume    # only if a prior run left a
//                                                        # 'pending' document row with zero
//                                                        # chunks (crashed mid-run)

import { createHash, randomUUID } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { supabase } from "../src/lib/supabase.js";
import { embedTexts } from "../src/lib/gemini.js";
import { parseCompendium } from "../src/lib/financeCompendiumParser.js";
import { proposeDiagram, judgeDiagramFaithful } from "../src/lib/financeDiagramAuthor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SOURCE_FILE_NAME = "finance_compendium.md";
const SOURCE_PATH = path.resolve(
  __dirname,
  "../../Data Extracted from Claude Cowork/Data/Finance Files/finance_compendium.md"
);
const REPORT_PATH = path.resolve(__dirname, "../ingestion/out/fin1_ingest_report.json");
const EMBEDDING_DIM = 768;
const DOMAIN = "Finance";
const SOURCE_CLASS = "placewise_reference";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const RESUME = args.includes("--resume");

function sha256Buffer(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

/** Mirrors backend/ingestion/chunk.py's `_DIAGRAM_FENCE_RE` exactly, so
 * `has_diagram` detection and the frontend's MarkdownWithDiagrams parser see
 * the same fence shape this script writes. */
const DIAGRAM_FENCE_RE = /^```placewise-diagram[ \t]*$/m;

function hasDiagramFence(content) {
  return DIAGRAM_FENCE_RE.test(content || "");
}

/** Appends a `placewise-diagram` fenced block + "Diagram summary:" line to
 * `content`, in the exact shape backend/ingestion/diagram_schema.py's
 * BLOCK_RE / SUMMARY_PREFIX expect (see the diagram-transcription skill). */
function attachDiagramBlock(content, diagram, summary) {
  const fence = "```placewise-diagram\n" + JSON.stringify(diagram, null, 2) + "\n```";
  const summaryLine = `Diagram summary: ${summary || ""}`.trim();
  return `${content}\n\n${fence}\n${summaryLine}\n`;
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

  // --- Step 4: diagram-author gate, one record at a time -----------------
  // Inlines proposeDiagram + judgeDiagramFaithful (the same two calls
  // authorAndVerifyDiagram makes internally) instead of calling that
  // wrapper as a black box, purely so this script can report accurate
  // proposed-vs-faithful-vs-dropped counts for the log/report — no extra
  // Gemini calls versus calling authorAndVerifyDiagram directly.
  let diagramsAuthored = 0; // proposed (passed the conservative propose gate)
  let diagramsFaithful = 0; // proposed AND passed the 3-vote faithfulness judge -> attached
  let diagramsDropped = 0; // proposed but failed the faithfulness judge -> text-only fallback
  let diagramProposalCalls = 0;
  let diagramJudgeCalls = 0;

  for (const record of records) {
    let proposal = null;
    try {
      proposal = await proposeDiagram(record.content);
      diagramProposalCalls += 1;
    } catch (err) {
      console.warn(`[ingestFinanceCompendium] proposeDiagram failed for ${record.topicId}: ${err.message}`);
    }
    if (!proposal) {
      record.diagram = null;
      record.diagramSummary = null;
      continue;
    }
    diagramsAuthored += 1;

    if (DRY_RUN) {
      // Dry run still exercises the cheap proposal-tier calls (counted in
      // the plan's cost estimate) but never spends the 3-vote judge call or
      // any embedding call.
      record.diagram = null;
      record.diagramSummary = null;
      continue;
    }

    let faithful = false;
    try {
      faithful = await judgeDiagramFaithful(record.content, proposal.diagram);
      diagramJudgeCalls += 3; // judgeDiagramFaithful always makes exactly 3 judge calls
    } catch (err) {
      console.warn(`[ingestFinanceCompendium] judgeDiagramFaithful failed for ${record.topicId}: ${err.message}`);
    }
    if (faithful) {
      diagramsFaithful += 1;
      record.diagram = proposal.diagram;
      record.diagramSummary = proposal.summary || null;
    } else {
      diagramsDropped += 1;
      record.diagram = null;
      record.diagramSummary = null;
    }
  }

  // --- Attach diagram blocks to content (the ONLY place this happens) ----
  for (const record of records) {
    if (record.diagram) {
      record.finalContent = attachDiagramBlock(record.content, record.diagram, record.diagramSummary);
    } else {
      record.finalContent = record.content;
    }
  }

  const wouldWriteChunks = records.length;
  const geminiCallsDryRun = {
    embedding: 0,
    diagramProposal: diagramProposalCalls,
    diagramJudge: diagramJudgeCalls
  };

  if (DRY_RUN) {
    console.log("DRY RUN — no Supabase writes, no embedding calls.");
    console.log(`would write: 1 ingest_documents row, ${wouldWriteChunks} ingest_chunks rows`);
    console.log(`diagramsAuthored (proposed) = ${diagramsAuthored}`);
    console.log(`gemini calls so far: ${JSON.stringify(geminiCallsDryRun)}`);
    return;
  }

  // --- Step 5: embed every record's final content, batch call ------------
  const embeddings = await embedTexts(records.map(r => r.finalContent), "RETRIEVAL_DOCUMENT");
  const embeddingCalls = records.length; // embedTexts makes one embedOne call per text

  for (const vec of embeddings) {
    if (!Array.isArray(vec) || vec.length !== EMBEDDING_DIM) {
      console.log(`ABORT: embedding with ${vec ? vec.length : "null"} dims`);
      process.exit(1);
    }
  }

  // --- Step 6: insert (or reuse, on --resume) the ingest_documents row ----
  let documentId = resumeDocumentId;
  if (!documentId) {
    const docRow = {
      source_file: SOURCE_FILE_NAME,
      school: null,
      club: null,
      year: "2026",
      source_class: SOURCE_CLASS,
      domain: DOMAIN,
      page_count: totalLineCount, // repurposed: source-file line count, not PDF pages (FIN1.01 convention)
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

  // --- Step 7: insert ingest_chunks rows, one multi-row insert ------------
  const splitGroupIds = new Map(); // topicId -> client-generated parent_item_id, same convention as chunk_rows_for in pipeline.py
  const chunkRows = records.map((record, i) => {
    let parentItemId = null;
    if (record.parentItemId === "SPLIT") {
      if (!splitGroupIds.has(record.topicId)) {
        splitGroupIds.set(record.topicId, randomUUID());
      }
      parentItemId = splitGroupIds.get(record.topicId);
    }
    return {
      document_id: documentId,
      page_start: record.lineStart,
      page_end: record.lineEnd,
      section_title: record.title,
      content: record.finalContent,
      content_type: "concept",
      embedding: embeddings[i],
      parent_item_id: parentItemId,
      has_diagram: !!record.diagram,
      metadata: record.metadata || {},
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
    diagramsAuthored,
    diagramsFaithful,
    diagramsDropped,
    geminiCalls: {
      embedding: embeddingCalls,
      diagramProposal: diagramProposalCalls,
      diagramJudge: diagramJudgeCalls
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

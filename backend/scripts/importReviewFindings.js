// One-off (re-runnable) import of the R1/R2 reviewer findings into ingest_page_findings
// (migration_041), so they show next to each page in the R5 admin review queue.
//
//   node scripts/importReviewFindings.js --dry-run   # per-file row counts, no writes
//   node scripts/importReviewFindings.js             # insert-only: existing rows are never overwritten
//
// Reads local, gitignored files from backend/ingestion/out/. No Gemini calls.
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { supabase } from "../src/lib/supabase.js";
import { normaliseReviewFile } from "../src/lib/reviewFindings.js";

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "ingestion", "out");
const SOURCES = ["r1_review_v3", "r2_sweep_a", "r2_sweep_b", "r2_sample_review", "r2_sample_v5_review"];
const BATCH = 100;
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const perFile = [];
  for (const name of SOURCES) {
    const file = path.join(OUT_DIR, `${name}.json`);
    if (!existsSync(file)) {
      console.warn(`[importReviewFindings] skipping ${name}: ${file} not found`);
      continue;
    }
    const json = JSON.parse(await readFile(file, "utf8"));
    const { data: doc, error } = await supabase
      .from("ingest_documents")
      .select("id, source_file, ingestion_version")
      .eq("id", json.document_id)
      .maybeSingle();
    if (error) throw new Error(`${name}: ingest_documents lookup failed: ${error.message}`);
    if (!doc) throw new Error(`${name}: document ${json.document_id} not found in ingest_documents`);
    const rows = normaliseReviewFile(name, json, doc.source_file);
    perFile.push({ name, rows, version: json.ingestion_version });
  }

  const total = perFile.reduce((n, f) => n + f.rows.length, 0);
  for (const f of perFile) console.log(`${f.name} (v${f.version}): ${f.rows.length} rows`);
  console.log(`total: ${total} rows${dryRun ? " (dry run, nothing written)" : ""}`);
  if (dryRun) return;

  for (const f of perFile) {
    for (let i = 0; i < f.rows.length; i += BATCH) {
      const { error } = await supabase
        .from("ingest_page_findings")
        // Insert-only (ON CONFLICT DO NOTHING): a re-run skips rows that already exist and
        // never rewrites an imported finding. entry_key is content-based (reviewFindings.js).
        .upsert(f.rows.slice(i, i + BATCH), { onConflict: "source_name,entry_key", ignoreDuplicates: true });
      if (error) throw new Error(`${f.name}: insert failed: ${error.message}`);
    }
    console.log(`inserted (new rows only) ${f.name}: ${f.rows.length} candidate rows`);
  }

  const { count, error } = await supabase
    .from("ingest_page_findings")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`count failed: ${error.message}`);
  console.log(`ingest_page_findings rows now: ${count}`);
}

main().catch((err) => {
  console.error("[importReviewFindings]", err.message || err);
  process.exit(1);
});

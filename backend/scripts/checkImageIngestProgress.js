import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { supabase } from "../src/lib/supabase.js";

// Read-only progress check for scripts/ingestImages.js - the ingestion log
// only prints a line for successfully-ingested images (see processImage's
// outcome switch in ingestImages.js), not for decorative/skipped ones, so
// counting log lines undercounts how many candidates have actually been
// processed. This instead compares each domain's manifest.jsonl (the true
// candidate count from extract_images.py) against the real row count in
// Supabase (is_image=true rows + the local decorative-skip cache), which is
// the actual source of truth ingestImages.js itself dedupes against.
// Safe to run anytime, including while ingestImages.js is still running.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_ROOT = path.join(__dirname, "..", "..", "Data");

function discoverImageDomains() {
  if (!fs.existsSync(DATA_ROOT)) return [];
  return fs
    .readdirSync(DATA_ROOT, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name.endsWith(" Files"))
    .map(entry => ({
      domain: entry.name.replace(/ Files$/, ""),
      imagesDir: path.join(DATA_ROOT, entry.name, "Images")
    }))
    .filter(d => fs.existsSync(path.join(d.imagesDir, "manifest.jsonl")));
}

function countManifestRows(manifestPath) {
  return fs.readFileSync(manifestPath, "utf8").split("\n").filter(l => l.trim()).length;
}

function countDecorativeCache(imagesDir) {
  const p = path.join(imagesDir, "decorative.jsonl");
  if (!fs.existsSync(p)) return 0;
  return fs.readFileSync(p, "utf8").split("\n").filter(l => l.trim()).length;
}

function bar(pct, width = 24) {
  const filled = Math.round((pct / 100) * width);
  return "[" + "#".repeat(filled) + "-".repeat(width - filled) + "]";
}

async function main() {
  const domains = discoverImageDomains();
  if (domains.length === 0) {
    console.log(`No "<Domain> Files/Images/manifest.jsonl" found under ${DATA_ROOT}.`);
    return;
  }

  let totalCandidates = 0;
  let totalDone = 0;
  const rows = [];

  for (const { domain, imagesDir } of domains) {
    const candidates = countManifestRows(path.join(imagesDir, "manifest.jsonl"));
    const decorativeSkipped = countDecorativeCache(imagesDir);

    const { count: ingestedCount, error } = await supabase
      .from("document_chunks")
      .select("id", { count: "exact", head: true })
      .eq("domain", domain)
      .eq("is_image", true);
    if (error) throw error;

    const done = (ingestedCount || 0) + decorativeSkipped;
    const pct = candidates ? Math.min(100, (done / candidates) * 100) : 100;
    rows.push({ domain, candidates, ingestedCount: ingestedCount || 0, decorativeSkipped, done, pct });
    totalCandidates += candidates;
    totalDone += done;
  }

  console.log("\nImage ingestion progress (live count from Supabase, not the log):\n");
  for (const r of rows) {
    console.log(
      `${r.domain.padEnd(20)} ${bar(r.pct)} ${r.pct.toFixed(1).padStart(5)}%  ` +
      `(${r.done}/${r.candidates} — ${r.ingestedCount} stored + ${r.decorativeSkipped} decorative-skipped)`
    );
  }
  const totalPct = totalCandidates ? (totalDone / totalCandidates) * 100 : 100;
  console.log(`\n${"TOTAL".padEnd(20)} ${bar(totalPct)} ${totalPct.toFixed(1).padStart(5)}%  (${totalDone}/${totalCandidates})\n`);
}

main().catch(err => {
  console.error("Progress check failed:", err);
  process.exit(1);
});

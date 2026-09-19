import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { supabase } from "../src/lib/supabase.js";
import { embedTexts, captionImage } from "../src/lib/gemini.js";

// Second half of the image pipeline (see migration_014_chunk_images.sql and
// scripts/extract_images.py for the first half). Reads each domain's
// Images/manifest.jsonl (written by extract_images.py), and for every image
// not yet processed: captions it via Gemini vision, skips it if the caption
// says the image is purely decorative, otherwise uploads the image to
// Supabase Storage and inserts a document_chunks row (is_image=true) whose
// embedding is the caption's embedding - so an image becomes retrievable
// through the exact same match_document_chunks search every text chunk uses.
//
// Dedup is DB-based (does a row for this exact image already exist?), same
// principle as ingest.js's text pipeline - safe to re-run after adding more
// images to a domain. A confirmed-decorative decision is cached in a local
// sidecar file (Images/decorative.jsonl) so a re-run doesn't re-pay for a
// Gemini call on an image already known to be skippable.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_ROOT = path.join(__dirname, "..", "..", "Data");
const BUCKET = "casebook-images";

function discoverImageDomains() {
  if (!fs.existsSync(DATA_ROOT)) return [];
  return fs
    .readdirSync(DATA_ROOT, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name.endsWith(" Files"))
    .map(entry => ({
      domain: entry.name.replace(/ Files$/, ""),
      domainDir: path.join(DATA_ROOT, entry.name),
      imagesDir: path.join(DATA_ROOT, entry.name, "Images")
    }))
    .filter(d => fs.existsSync(path.join(d.imagesDir, "manifest.jsonl")));
}

function readManifest(manifestPath) {
  return fs
    .readFileSync(manifestPath, "utf8")
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => JSON.parse(l));
}

function loadDecorativeCache(imagesDir) {
  const p = path.join(imagesDir, "decorative.jsonl");
  const set = new Set();
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      if (!line.trim()) continue;
      const row = JSON.parse(line);
      set.add(`${row.source_file}::${row.page}::${row.image_index}`);
    }
  }
  return set;
}

function appendDecorative(imagesDir, row) {
  fs.appendFileSync(path.join(imagesDir, "decorative.jsonl"), JSON.stringify(row) + "\n");
}

// page/image_index -> a stable, deterministic chunk_index so the same image
// always maps to the same row identity across runs (assumes <1000 images
// per source file, comfortably true here - largest domain topped out at a
// few hundred per file before dedup).
function chunkIndexFor(page, imageIndex) {
  return page * 1000 + imageIndex;
}

async function ensureBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  if (buckets.some(b => b.name === BUCKET)) return;
  const { error: createError } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (createError) throw createError;
  console.log(`Created storage bucket "${BUCKET}" (public)`);
}

async function alreadyIngested(domain, sourceFile, chunkIndex) {
  const { count, error } = await supabase
    .from("document_chunks")
    .select("id", { count: "exact", head: true })
    .eq("domain", domain)
    .eq("source_file", sourceFile)
    .eq("is_image", true)
    .eq("chunk_index", chunkIndex);
  if (error) throw error;
  return count > 0;
}

function extToMime(ext) {
  const e = ext.toLowerCase();
  if (e === "jpg" || e === "jpeg") return "image/jpeg";
  if (e === "png") return "image/png";
  if (e === "gif") return "image/gif";
  if (e === "webp") return "image/webp";
  return "application/octet-stream";
}

async function processImage(domain, domainDir, imagesDir, row, decorativeCache) {
  const decorativeKey = `${row.source_file}::${row.page}::${row.image_index}`;
  const chunkIndex = chunkIndexFor(row.page, row.image_index);

  if (decorativeCache.has(decorativeKey)) return "decorative-cached";
  if (await alreadyIngested(domain, row.source_file, chunkIndex)) return "already-ingested";

  const absPath = path.join(domainDir, row.path);
  const buffer = fs.readFileSync(absPath);
  const ext = path.extname(absPath).slice(1) || "png";
  const mimeType = extToMime(ext);

  const caption = await captionImage({ buffer, mimeType });

  if (!caption || caption === "DECORATIVE") {
    appendDecorative(imagesDir, { source_file: row.source_file, page: row.page, image_index: row.image_index });
    return "decorative";
  }

  const safeBaseName = path.basename(row.source_file, ".pdf").replace(/[^A-Za-z0-9._-]/g, "_");
  const storagePath = `${domain}/${safeBaseName}/page${row.page}_img${row.image_index}.${ext}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: mimeType,
    upsert: true
  });
  if (uploadError) throw uploadError;
  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const imageUrl = publicUrlData.publicUrl;

  const [embedding] = await embedTexts([caption], "RETRIEVAL_DOCUMENT");

  const { error: insertError } = await supabase.from("document_chunks").insert({
    domain,
    source_file: row.source_file,
    chunk_index: chunkIndex,
    content: caption,
    embedding,
    image_url: imageUrl,
    is_image: true
  });
  if (insertError) throw insertError;

  return "ingested";
}

async function main() {
  await ensureBucket();

  const domains = discoverImageDomains();
  if (domains.length === 0) {
    console.log(`No "<Domain> Files/Images/manifest.jsonl" found under ${DATA_ROOT} - run extract_images.py first.`);
    return;
  }

  // Milestone progress (every 30%) across the WHOLE run, not just one
  // domain - the user's ask. Tracked by candidate index processed so far
  // (matches the manifest position, including decorative skips - not just
  // successful ingests), computed once upfront rather than re-querying
  // Supabase per image, so it costs nothing extra per candidate.
  const manifestByDomain = domains.map(d => ({ ...d, rows: readManifest(path.join(d.imagesDir, "manifest.jsonl")) }));
  const globalTotal = manifestByDomain.reduce((sum, d) => sum + d.rows.length, 0);
  let globalProcessed = 0;
  let lastMilestone = 0; // last printed multiple of 30

  for (const { domain, domainDir, imagesDir, rows } of manifestByDomain) {
    const decorativeCache = loadDecorativeCache(imagesDir);
    console.log(`\n=== ${domain} (${rows.length} candidate images) ===`);

    const counts = { ingested: 0, decorative: 0, "decorative-cached": 0, "already-ingested": 0 };
    for (const row of rows) {
      try {
        const outcome = await processImage(domain, domainDir, imagesDir, row, decorativeCache);
        counts[outcome]++;
        if (outcome === "ingested") {
          console.log(`  ingested  ${row.source_file} p${row.page} img${row.image_index}`);
        }
      } catch (err) {
        console.error(`  FAIL  ${row.source_file} p${row.page} img${row.image_index} -- ${err.message}`);
      }

      globalProcessed++;
      const pct = globalTotal ? Math.floor((globalProcessed / globalTotal) * 100) : 100;
      const milestone = Math.floor(pct / 30) * 30;
      if (milestone > lastMilestone && milestone > 0) {
        lastMilestone = milestone;
        console.log(`\n>>> PROGRESS: ${pct}% overall (${globalProcessed}/${globalTotal} candidate images processed across all domains) <<<\n`);
      }
    }
    console.log(
      `${domain}: ingested ${counts.ingested}, decorative ${counts.decorative + counts["decorative-cached"]}, already done ${counts["already-ingested"]}`
    );
  }
  console.log(`\n>>> PROGRESS: 100% overall (${globalProcessed}/${globalTotal}) <<<`);
  console.log("\nImage ingestion complete.");
}

main().catch(err => {
  console.error("Image ingestion failed:", err);
  process.exit(1);
});

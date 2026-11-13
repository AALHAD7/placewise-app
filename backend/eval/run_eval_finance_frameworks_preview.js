// FIN2 bounded eval probe (read-only, no is_active change, no .env change, no DB writes to
// `frameworks`). Reuses the exact pool-loading mechanics of
// backend/eval/run_eval_finance_preview.js (loadChunkPool/cosine/localRetrieve) plus the
// real production decideCoverage/judgeRelevanceOnce from consultingRetrieval.js, but builds
// its query the same way findGroundingV2 (frameworksGrounding.js) actually does for a real
// Finance framework row: `${fw.name} framework diagram case study real example application
// ${fw.subdomain}` - proving the Frameworks-shaped query (not a Q&A-shaped question) also
// retrieves real Finance compendium chunks once ENABLE_FINANCE_RAG_V2 is flipped on.
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { embedTexts } from "../src/lib/gemini.js";
import { decideCoverage, judgeRelevanceOnce } from "../src/lib/consultingRetrieval.js";

const FINANCE_DOC_ID = "3923cb00-cf65-4a9d-862e-0ebef9c7e603";

const FRAMEWORKS = [
  { name: "WACC (Weighted Average Cost of Capital)", subdomain: "Valuation" },
  { name: "DCF (Discounted Cash Flow)", subdomain: "Valuation" },
  { name: "LBO Basics (Leveraged Buyout)", subdomain: "Corporate Finance & M&A" },
  { name: "DuPont Analysis", subdomain: "Financial Statements & Accounting" },
  { name: "Working Capital & Cash Conversion Cycle", subdomain: "Financial Statements & Accounting" }
];

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function loadFinancePool(client) {
  const PAGE = 1000;
  let all = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await client
      .from("ingest_chunks")
      .select("id, document_id, section_title, content, has_diagram, embedding, ingest_documents(source_file, source_class)")
      .eq("document_id", FINANCE_DOC_ID)
      .range(offset, offset + PAGE - 1);
    if (error) throw error;
    all = all.concat(data);
    if (data.length < PAGE) break;
  }
  return all.map(r => ({
    content: r.content,
    section_title: r.section_title,
    has_diagram: r.has_diagram,
    source_file: r.ingest_documents?.source_file || null,
    embedding: JSON.parse(r.embedding)
  }));
}

function localRetrieve(pool, queryEmbedding, matchCount) {
  return pool
    .map(c => ({ ...c, similarity: cosine(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount);
}

async function main() {
  const client = sb();
  const pool = await loadFinancePool(client);
  console.log(`[fin2-probe] Finance pool: ${pool.length} chunks.`);

  for (const fw of FRAMEWORKS) {
    const query = `${fw.name} framework diagram case study real example application ${fw.subdomain}`;
    const [queryEmbedding] = await embedTexts([query], "RETRIEVAL_QUERY");
    const rows = localRetrieve(pool, queryEmbedding, 6);
    const { covered, rows: coveringRows } = decideCoverage(rows);
    let relevant = [];
    if (covered) {
      const verdicts = await Promise.all(
        coveringRows.map(r =>
          Promise.all([0, 1, 2].map(() => judgeRelevanceOnce(query, r.content).catch(() => ({ faithful: false }))))
            .then(vs => vs.filter(v => v.faithful).length >= 2)
        )
      );
      relevant = coveringRows.filter((_, i) => verdicts[i]);
    }
    const top = relevant[0] || null;
    console.log(`\n=== ${fw.name} [${fw.subdomain}] ===`);
    console.log(`  thresholdCovered: ${covered}, relevantAfterJudge: ${relevant.length > 0}`);
    if (top) {
      console.log(`  top section: "${top.section_title}" similarity=${top.similarity.toFixed(3)} source=${top.source_file}`);
      console.log(`  excerpt: ${top.content.slice(0, 160).replace(/\n/g, " ")}...`);
    } else {
      console.log(`  (no relevant chunk - would fall back to v1 cache under retrieveDomainChunks/findGrounding's try/catch, or show nothing if v1 also empty)`);
    }
  }
}

main().catch(err => { console.error("[fin2-probe] Fatal:", err); process.exit(1); });

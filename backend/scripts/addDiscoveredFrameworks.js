// One-off content addition: the Frameworks page is a hand-curated list (migration_006 /
// migration_019), never auto-derived from the ingested casebooks - so it only ever covered
// "the standard frameworks every prep guide has," not everything the casebooks actually
// discuss. A full-corpus scan (22,457 document_chunks) found ~650 distinct framework/model/
// method-style name mentions; after removing noise (generic phrases like "Financial
// Analysis", OCR artifacts, duplicates of existing entries), CANDIDATES below is the
// resulting curated shortlist - genuinely standard, well-represented, and not already on
// the page. See the chat session / log.md entry for the filtering reasoning.
//
// Each candidate is grounded the same way frameworksGrounding.js grounds an existing
// framework: embed a query, pull the top real excerpts from document_chunks via
// match_document_chunks (domain-filtered), then ONE Gemini call drafts description/example/
// steps/when_to_use/when_not_to_use/pitfalls strictly from those excerpts - told explicitly
// not to use outside knowledge, same grounding discipline as the rest of this project.
// Written in accessible language from the start (the exempt-list calibration from
// simplifyFrameworkJargon.js, not a separate simplification pass after the fact).
//
// A candidate whose retrieved excerpts don't actually substantiate it well (similarity too
// low, or the model itself says the excerpts are insufficient) is skipped, not drafted from
// general knowledge - fail-closed, same posture as everything else grounded on this site.
//
// Usage: node scripts/addDiscoveredFrameworks.js [--apply]
// Without --apply: dry run, drafts + grounding check, writes a report, no DB insert.

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { supabase } from "../src/lib/supabase.js";
import { embedTexts, generateJSON } from "../src/lib/gemini.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// searchTerm: the bare keyword actually printed in the casebooks, for a direct text match
// (see groundCandidate) - the page display name often carries a qualifier ("(Pirate
// Metrics)", "(Blake-Mouton)") that won't literally appear in the source text.
const CANDIDATES = [
  { name: "Value Chain Analysis", domain: "Consulting", subdomain: "Case Structuring", searchTerm: "Value Chain Analysis" },
  { name: "Dividend Discount Model (Gordon Growth Model)", domain: "Finance", subdomain: "Valuation", searchTerm: "Dividend Discount Model" },
  { name: "DuPont Analysis", domain: "Finance", subdomain: "Financial Statements & Accounting", searchTerm: "DuPont" },
  { name: "Treasury Stock Method", domain: "Finance", subdomain: "Valuation", searchTerm: "Treasury Stock Method" },
  { name: "Precedent Transaction Analysis", domain: "Finance", subdomain: "Valuation", searchTerm: "Precedent Transaction" },
  { name: "Residual Income Model", domain: "Finance", subdomain: "Valuation", searchTerm: "Residual Income" },
  { name: "Black-Scholes Option Pricing Model", domain: "Finance", subdomain: "Valuation", searchTerm: "Black-Scholes" },
  { name: "ADDIE Model", domain: "HR", subdomain: "Learning & Development", searchTerm: "ADDIE" },
  { name: "Harvard vs Michigan Models of HRM", domain: "HR", subdomain: "HR Strategy", searchTerm: "Michigan Model" },
  { name: "Kirkpatrick Model", domain: "HR", subdomain: "Learning & Development", searchTerm: "Kirkpatrick" },
  { name: "Managerial Grid (Blake-Mouton)", domain: "General Management", subdomain: "Leadership & Behavioural", searchTerm: "Managerial Grid" },
  { name: "AARRR Framework (Pirate Metrics)", domain: "Prodman", subdomain: "Metrics & Growth", searchTerm: "AARRR" },
  { name: "MoSCoW Method", domain: "Prodman", subdomain: "Prioritization", searchTerm: "MoSCoW" },
  { name: "Freemium Model", domain: "Prodman", subdomain: "Metrics & Growth", searchTerm: "Freemium" },
  { name: "Net Promoter Score", domain: "Marketing:Sales", subdomain: "Customer & Brand", searchTerm: "Net Promoter Score" },
  { name: "Customer Satisfaction Score (CSAT)", domain: "Marketing:Sales", subdomain: "Customer & Brand", searchTerm: "Customer Satisfaction Score" }
];

const MATCH_COUNT = 12; // raw pool before diversifyBySource caps per-casebook contribution
// Raised from 0.42: a wider raw vector pool (for source diversity) pulled in enough
// marginal, only-tangentially-related hits that it sometimes diluted an otherwise-solid
// candidate (ADDIE, AARRR) into reading as thin/inconsistent. Text matches (the term
// literally appears) aren't filtered by this at all - they're already precise by construction.
const SIMILARITY_FLOOR = 0.48;

const DRAFT_SYSTEM_PROMPT =
  "You are writing one new entry for an MBA interview-prep Frameworks page, for a GENERAL " +
  "MBA audience (not specialists). You will be given the framework's name and several real " +
  "excerpts pulled from the actual casebooks that discuss it - likely from several DIFFERENT " +
  "club casebooks, each explaining the same framework in its own words. That's normal and " +
  "expected, not a problem: different casebooks emphasizing different aspects, using " +
  "different examples, or going into different depth is exactly the kind of variation you " +
  "should expect and synthesize from, not a reason to call the material insufficient or " +
  "contradictory. Read everything first, form your own understanding of what the framework " +
  "actually is and how it's used, and write the entry from that combined understanding - " +
  "pulling the clearest explanation of each part from wherever it appears, rather than only " +
  "paraphrasing whichever single excerpt happens to be most complete. Only treat it as a real " +
  "conflict (and quietly go with whichever is more precise) when two excerpts state an " +
  "actually incompatible fact about the SAME specific detail (e.g. a different formula, a " +
  "different number of steps) - not when they simply emphasize or word things differently.\n\n" +
  "Your job is to write a structured, accurate summary of what those excerpts say about this " +
  "framework - NOT from your own general knowledge beyond what's needed to connect/phrase " +
  "what the excerpts actually say. Only respond with " +
  '{"insufficient": true} (exactly that, nothing else) when the excerpts, taken together, ' +
  "still don't actually explain what the framework is or how to use it - not merely because " +
  "they come from different sources or don't all agree on every word.\n\n" +
  "Writing style: plain, accessible language for a general MBA reader, not a finance/" +
  "consulting/HR specialist. Leave completely alone - never clarify - this exact list of " +
  "everyday business vocabulary: balance sheet, income statement, cash flow statement, " +
  "assets, liabilities, equity, revenue, profit/net income, debt, market, shares/stock. For " +
  "every other specialized term, acronym, or named concept the excerpts use, add ONE short " +
  "inline clarification the first time it appears (parentheses, never square brackets), then " +
  "leave it bare on later mentions.\n\n" +
  "Respond with ONLY a JSON object in exactly this shape, no markdown fences, no commentary:\n" +
  '{"description": "one or two sentences, what this framework is", ' +
  '"example": "a short worked example or prompt + walkthrough, grounded in the excerpts", ' +
  '"when_to_use": "one sentence", "when_not_to_use": "one sentence", ' +
  '"steps": ["step 1", "step 2", "..."], "pitfalls": ["pitfall 1", "pitfall 2", "..."]}';

// Deliberately NOT domain-filtered: a first version restricted retrieval to the candidate's
// target page domain and silently missed real, substantive explanations living in a
// differently-tagged casebook (e.g. Net Promoter Score's actual formula was in an HR
// compendium, not a marketing-tagged document - "General Management" also was never an
// ingested domain tag at all, so it always returned zero rows). The page placement (where a
// framework is filed for students to browse) and where the casebooks happen to explain it
// are two different things - search the whole corpus and let similarity do the filtering.
const TEXT_MATCH_LIMIT = 12;
const MAX_PER_SOURCE_FILE = 3;
const FINAL_EXCERPT_LIMIT = 14;

// Vector search alone kept missing exact-term explanations that genuinely exist in the
// corpus (verified by hand for ADDIE, Kirkpatrick, MoSCoW, Treasury Stock Method - all have
// a real, substantive chunk, embedding search just didn't rank it in the top 8). A direct
// text match on the bare term the casebooks actually print catches what semantic similarity
// alone missed; the two sources are merged and de-duplicated by chunk id.
//
// These casebooks overlap heavily - the same framework shows up, explained differently, in
// several different club casebooks. Pulling the raw top-N by similarity/recency risks one
// book dominating every excerpt a candidate gets drafted from, which just reproduces that
// one book's phrasing instead of giving the model a real cross-casebook picture to
// synthesize from. So after merging, cap how many excerpts any single source_file can
// contribute (MAX_PER_SOURCE_FILE) before filling the rest of the pool - a bigger raw pull
// (MATCH_COUNT/TEXT_MATCH_LIMIT) first, so there's enough material left to diversify from
// after the cap, not just whatever the first book happened to have.
function diversifyBySource(rows, maxPerSource, limit) {
  const perSourceCount = new Map();
  const diversified = [];
  for (const row of rows) {
    const key = row.source_file || "(unknown)";
    const count = perSourceCount.get(key) || 0;
    if (count >= maxPerSource) continue;
    perSourceCount.set(key, count + 1);
    diversified.push(row);
    if (diversified.length >= limit) break;
  }
  return diversified;
}

async function groundCandidate({ name, searchTerm }) {
  const [queryEmbedding] = await embedTexts(
    [`${name} framework explanation steps example application`],
    "RETRIEVAL_QUERY"
  );
  const [{ data: vectorChunks, error: vectorError }, { data: textChunks, error: textError }] = await Promise.all([
    supabase.rpc("match_document_chunks", { query_embedding: queryEmbedding, match_count: MATCH_COUNT, filter_domain: null }),
    supabase.from("document_chunks").select("id,domain,source_file,content").ilike("content", `%${searchTerm}%`).limit(TEXT_MATCH_LIMIT)
  ]);
  if (vectorError) throw new Error(`match_document_chunks failed for "${name}": ${vectorError.message}`);
  if (textError) throw new Error(`text search failed for "${name}": ${textError.message}`);

  const vectorRows = (vectorChunks || []).filter(r => (r.similarity ?? 0) >= SIMILARITY_FLOOR);
  const seen = new Set(vectorRows.map(r => r.id));
  const merged = [...vectorRows];
  for (const row of textChunks || []) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      merged.push({ ...row, similarity: null }); // text match, not a vector score
    }
  }
  return diversifyBySource(merged, MAX_PER_SOURCE_FILE, FINAL_EXCERPT_LIMIT);
}

const DRAFT_ATTEMPTS = 3;

// "Insufficient" is a judgment call the model itself makes in the same call that drafts the
// content (unlike simplifyFrameworkJargon.js's separate judge) - at temperature 0.3 that
// judgment wobbles near the boundary (confirmed: ADDIE and AARRR both flipped pass/fail
// across otherwise-identical runs with ~14 solid excerpts each). A plain retry (not fed any
// prior failure reason, since there's no separate judge call to explain itself here) gives a
// genuinely borderline candidate more than one roll before being left out.
async function draftFramework(candidate, excerptRows) {
  const excerptsText = excerptRows
    .map((r, i) => `Excerpt ${i + 1} (source: ${r.source_file || "unknown"}):\n${r.content}`)
    .join("\n\n");

  let last = { insufficient: true };
  for (let attempt = 0; attempt < DRAFT_ATTEMPTS; attempt++) {
    const drafted = await generateJSON({
      system: DRAFT_SYSTEM_PROMPT,
      prompt: `Framework name: ${candidate.name}\nDomain: ${candidate.domain}\n\nCasebook excerpts:\n${excerptsText}`,
      maxTokens: 1600,
      temperature: 0.3,
      feature: "addDiscoveredFrameworks-draft"
    });
    last = drafted;
    if (!drafted.insufficient) return drafted;
  }
  return last;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const nameFilterIdx = process.argv.indexOf("--name");
  const nameFilter = nameFilterIdx !== -1 ? process.argv[nameFilterIdx + 1] : null;
  const candidates = nameFilter ? CANDIDATES.filter(c => c.name.includes(nameFilter)) : CANDIDATES;
  console.log(`[discover] ${candidates.length} candidate(s), apply=${apply}`);

  // Re-running this script with an improved prompt (cross-casebook synthesis, source
  // diversification) after an earlier run already inserted some of these candidates -
  // upsert by name instead of blind insert, so re-running doesn't create duplicates. Any
  // row this run is about to overwrite gets backed up first, same reversibility posture as
  // every other content script in this project.
  const existingByName = new Map();
  if (apply) {
    const names = candidates.map(c => c.name);
    const { data: existing, error } = await supabase.from("frameworks").select("*").in("name", names);
    if (error) throw new Error(`existing-row lookup failed: ${error.message}`);
    (existing || []).forEach(row => existingByName.set(row.name, row));
    if (existingByName.size) {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(__dirname, "backups", `discovered-frameworks-overwrite-backup-${stamp}.json`);
      fs.mkdirSync(path.dirname(backupFile), { recursive: true });
      fs.writeFileSync(backupFile, JSON.stringify([...existingByName.values()], null, 2));
      console.log(`[discover] backed up ${existingByName.size} existing row(s) about to be updated: ${backupFile}`);
    }
  }

  const report = [];

  for (const candidate of candidates) {
    console.log(`[discover] ${candidate.name} (${candidate.domain})...`);
    try {
      const rows = await groundCandidate(candidate);

      if (!rows.length) {
        console.log(`[discover] ${candidate.name}: skipped - no excerpts above similarity floor`);
        report.push({ ...candidate, status: "skipped-no-grounding" });
        continue;
      }

      const drafted = await draftFramework(candidate, rows);

      if (drafted.insufficient) {
        console.log(`[discover] ${candidate.name}: skipped - model judged excerpts insufficient`);
        report.push({ ...candidate, status: "skipped-insufficient", excerptCount: rows.length });
        continue;
      }

      const row = {
        name: candidate.name,
        role: candidate.domain,
        level: "mba",
        domain: candidate.domain,
        subdomain: candidate.subdomain,
        description: drafted.description,
        example: drafted.example,
        when_to_use: drafted.when_to_use,
        when_not_to_use: drafted.when_not_to_use,
        steps: drafted.steps,
        pitfalls: drafted.pitfalls
      };

      report.push({ ...candidate, status: "drafted", excerptCount: rows.length, draft: row });

      if (apply) {
        const existingRow = existingByName.get(candidate.name);
        const { error } = existingRow
          ? await supabase.from("frameworks").update(row).eq("id", existingRow.id)
          : await supabase.from("frameworks").insert(row);
        if (error) {
          console.warn(`[discover] ${existingRow ? "UPDATE" : "INSERT"} FAILED for ${candidate.name}: ${error.message}`);
          report[report.length - 1].status = existingRow ? "update-failed" : "insert-failed";
          report[report.length - 1].error = error.message;
        } else {
          console.log(`[discover] ${existingRow ? "updated" : "inserted"} ${candidate.name}`);
        }
      }
    } catch (err) {
      // One candidate's draft/grounding call failing (malformed JSON from the model, a
      // transient RPC error) shouldn't lose progress on every other candidate already
      // processed in this run - log it, record it in the report, move on.
      console.warn(`[discover] ${candidate.name}: FAILED - ${err.message}`);
      report.push({ ...candidate, status: "error", error: err.message });
    }
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportDir = path.join(__dirname, "backups");
  fs.mkdirSync(reportDir, { recursive: true });
  const reportFile = path.join(reportDir, `discovered-frameworks-${stamp}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

  const drafted = report.filter(r => r.status === "drafted").length;
  const skipped = report.length - drafted;
  console.log(`\n[discover] done. ${drafted} drafted${apply ? " and inserted" : ""}, ${skipped} skipped.`);
  console.log(`[discover] report: ${reportFile}`);
  if (!apply) console.log("[discover] DRY RUN - no database rows were written. Re-run with --apply to write.");
}

main().catch(err => {
  console.error("[discover] fatal:", err);
  process.exit(1);
});

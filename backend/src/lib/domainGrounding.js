import { supabase } from "./supabase.js";
import { embedTexts } from "./gemini.js";
import { retrieveConsultingChunks } from "./consultingRetrieval.js";

// Single source of truth for "is the new ingest_chunks pipeline live for
// domain X" - previously duplicated independently in frameworksGrounding.js,
// roleTopics.js (Consulting-only) and roleCompanyTopicNotes.js (Consulting-
// only). Centralized here 2026-11-13 while wiring the v2 pipeline into
// mockInterview.js/resume.js/story.js/skillContent.js, which had no v2 path
// at all - they were still reading only the old document_chunks table,
// unconditionally, for every domain, even Consulting and Prodman which have
// real ingest_chunks data. frameworksGrounding.js re-exports these two names
// unchanged so its own existing imports/tests keep working.
export const RAG_V2_DOMAINS = ["Consulting", "Prodman", "Finance"];

// Read live from process.env on every call (not cached at module load) -
// same reasoning as gemini.js's cascade flags: lets tests flip the flag
// between calls within one process instead of needing a fresh module
// import per scenario, and costs nothing at production scale.
//
// Finance (FIN2, 2026-11-13): own dedicated ENABLE_FINANCE_RAG_V2 flag, default
// off - deliberately NOT sharing ENABLE_CONSULTING_RAG_V2 or ENABLE_PM_RAG_V2.
// Same regression this guards against as D1 found for Prodman: Finance's 3
// seeded framework subdomains (Corporate Finance & M&A, Financial Statements &
// Accounting, Valuation) already have a live v1 (document_chunks) cached
// grounded_example/grounded_image. Piggybacking on an already-on flag would let
// findGroundingV2 start intercepting Finance frameworks the moment their 7-day
// cache goes stale, silently nulling out the working v1 cache instead of a
// deliberate switch-over.
export function isV2EnabledForDomain(domain) {
  if (domain === "Consulting") return process.env.ENABLE_CONSULTING_RAG_V2 === "true";
  if (domain === "Prodman") return process.env.ENABLE_PM_RAG_V2 === "true";
  if (domain === "Finance") return process.env.ENABLE_FINANCE_RAG_V2 === "true";
  return false;
}

async function retrieveV1Chunks(queryText, domain, matchCount) {
  try {
    const [queryEmbedding] = await embedTexts([queryText], "RETRIEVAL_QUERY");
    const { data, error } = await supabase.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      filter_domain: domain || null
    });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn(`[domainGrounding] v1 retrieval failed: ${err.message}`);
    return [];
  }
}

/**
 * Drop-in replacement for a direct `supabase.rpc("match_document_chunks", ...)`
 * call - same return shape (rows with `.content`/`.source_file`, the only two
 * fields every existing caller reads), so swapping call sites is a pure data-
 * source change with no caller-side logic to update.
 *
 * When `domain` is v2-enabled, tries the new ingest_chunks pipeline first
 * (both club_casebook and placewise_reference source classes, so a Prodman
 * caller also benefits from the PM compendium). Unlike frameworksGrounding.js's
 * findGroundingV2 (which deliberately shows nothing on a clean "not covered"
 * result, since that's the actual answer it's built to display), every
 * caller here has always tolerated an empty/best-effort context with no
 * covered/not-covered UI state of its own - so an empty v2 result falls
 * through to v1 instead of returning nothing, which can only improve on
 * today's behavior, never regress it. retrieveConsultingChunks already
 * catches its own errors and returns [] on failure, so a v2 outage falls
 * through the same way as a v2 miss - no separate error handling needed here.
 *
 * @param {string} queryText
 * @param {string|null} domain
 * @param {{matchCount?: number}} [opts]
 * @returns {Promise<{chunks: Array<{content: string, source_file: string}>, usedV2: boolean}>}
 */
export async function retrieveDomainChunks(queryText, domain, { matchCount = 6 } = {}) {
  if (domain && isV2EnabledForDomain(domain)) {
    const rows = await retrieveConsultingChunks(queryText, {
      domain, matchCount, sourceClasses: ["club_casebook", "placewise_reference"]
    });
    if (rows.length > 0) return { chunks: rows, usedV2: true };
  }
  const chunks = await retrieveV1Chunks(queryText, domain, matchCount);
  return { chunks, usedV2: false };
}

import { supabase } from "./supabase.js";
import { generateJSON, generateGroundedText } from "./gemini.js";
import { renderBmcAscii } from "./asciiBmc.js";
import { normalizeCacheKey } from "./cacheKey.js";
import { resolveSources } from "./resolveSources.js";
import { singleFlight } from "./singleFlight.js";

// Same long TTL as company_value_chain_cache/company_timeline_cache - a
// company's actual business model doesn't change often.
const CACHE_TTL_MS = 60 * 24 * 60 * 60 * 1000;

// Grounded research first, plain prose (not JSON) - same reasoning as every
// other researchX() in this codebase (see e.g. companyValueChain.js's
// comment on generateGroundedText): a strict-JSON grounded call measurably
// skips actually searching a third of the time. Explicitly told to flag
// gaps rather than invent - the user's core ask here is zero tolerance for
// fabricated specifics.
const RESEARCH_SYSTEM_PROMPT = `Research the given company's REAL, actual business model in full depth, for a student preparing for a case/consulting/product-management interview who needs the true picture, not a generic template. Actively search multiple reliable sources (the company's own investor materials/10-K or annual report if public, its own site, credible business journalism, industry analysis, case studies) before answering - do not rely on memory alone, and never invent a specific (a number, a partner name, a fee structure) you did not actually find.

Cover all nine Business Model Canvas elements for this specific company: (1) Key Partners - who it actually depends on, (2) Key Activities - what it actually does day to day to run the business, (3) Key Resources - what assets/capabilities it actually needs, (4) Value Propositions - what real problem it solves and for whom, (5) Customer Relationships - how it actually acquires/retains customers, (6) Channels - how it actually reaches customers, (7) Customer Segments - who its real customers/users are, (8) Cost Structure - its actual major costs, (9) Revenue Streams - exactly how it actually makes money, with real figures/percentages where you can find them.

Then, separately, explain HOW the business actually works end to end - the real operational flow from a customer's first contact through to the company capturing revenue, in plain language, as if walking someone through it step by step.

Plain prose, organized in ten clearly labeled short parts (the nine BMC elements plus "How it works"), under 600 words total. Where reliable sources don't cover something specific for this company, say so plainly instead of filling the gap with a plausible-sounding guess.`;

const FORMAT_SYSTEM_PROMPT = `You are extracting a structured Business Model Canvas from research text about a company. Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{
  "keyPartners": ["short phrase", ...],
  "keyActivities": ["short phrase", ...],
  "keyResources": ["short phrase", ...],
  "valuePropositions": ["short phrase", ...],
  "customerRelationships": ["short phrase", ...],
  "channels": ["short phrase", ...],
  "customerSegments": ["short phrase", ...],
  "costStructure": ["short phrase", ...],
  "revenueStreams": ["short phrase", ...],
  "howItWorks": "3-6 sentence plain-language walkthrough of how the business actually operates end to end, from customer contact to revenue capture"
}

Each array: 2-4 items, each a SHORT phrase (aim for under 6 words - these get laid out in a fixed-width text grid, so brevity matters more than completeness). Base every item directly on the research text below - never add a fact, number, or partner name the research didn't state. If the research is too thin for a category, return fewer items (even a single honest one) rather than inventing to fill the array.`;

async function researchBusinessModel(companyName) {
  try {
    const { text, grounded, sources } = await generateGroundedText({
      system: RESEARCH_SYSTEM_PROMPT,
      prompt: `COMPANY: ${companyName}`,
      maxTokens: 1400
    });
    return { text, grounded, sources };
  } catch {
    return { text: "", grounded: false, sources: [] };
  }
}

/**
 * @param {string} companyName
 * @returns {Promise<{ascii: string, howItWorks: string, sources: {title:string,uri:string}[], grounded: boolean, cached: boolean, fetchedAt: string}>}
 */
export async function getCompanyBusinessModel(companyName) {
  const cacheKey = normalizeCacheKey(companyName);
  return singleFlight(`companyBusinessModel:${cacheKey}`, () => fetchCompanyBusinessModel(companyName, cacheKey));
}

async function fetchCompanyBusinessModel(companyName, cacheKey) {
  const { data: cached, error: cacheError } = await supabase
    .from("company_business_model_cache")
    .select("*")
    .eq("company_name", cacheKey)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const isFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    const ascii = renderBmcAscii({
      keyPartners: cached.key_partners, keyActivities: cached.key_activities, keyResources: cached.key_resources,
      valuePropositions: cached.value_propositions, customerRelationships: cached.customer_relationships,
      channels: cached.channels, customerSegments: cached.customer_segments,
      costStructure: cached.cost_structure, revenueStreams: cached.revenue_streams
    }, companyName);
    return { ascii, howItWorks: cached.how_it_works, sources: cached.sources || [], grounded: cached.grounded, cached: true, fetchedAt: cached.fetched_at };
  }

  const research = await researchBusinessModel(companyName);
  const prompt = research.grounded
    ? `COMPANY: ${companyName}\n\nRESEARCH:\n${research.text}\n\nExtract the Business Model Canvas JSON as specified.`
    : `COMPANY: ${companyName}\n\n(Web search was unavailable this time - only include items you're genuinely confident about from general knowledge; return fewer items, or state gaps in "howItWorks", rather than guessing.)\n\nExtract the Business Model Canvas JSON as specified.`;
  const bmc = await generateJSON({ system: FORMAT_SYSTEM_PROMPT, prompt, maxTokens: 1200 });
  // Resolved once here (generation-time, not per page view - see
  // resolveSources.js) so the stored/returned sources deep-link to the
  // specific article/page Google's search actually found, not a bare
  // domain that reads like a homepage.
  const resolvedSources = await resolveSources(research.sources);

  const asArray = (v) => Array.isArray(v) ? v.filter(x => typeof x === "string" && x.trim()) : [];
  const row = {
    company_name: cacheKey,
    key_partners: asArray(bmc.keyPartners),
    key_activities: asArray(bmc.keyActivities),
    key_resources: asArray(bmc.keyResources),
    value_propositions: asArray(bmc.valuePropositions),
    customer_relationships: asArray(bmc.customerRelationships),
    channels: asArray(bmc.channels),
    customer_segments: asArray(bmc.customerSegments),
    cost_structure: asArray(bmc.costStructure),
    revenue_streams: asArray(bmc.revenueStreams),
    how_it_works: typeof bmc.howItWorks === "string" ? bmc.howItWorks : "",
    sources: resolvedSources,
    grounded: research.grounded,
    fetched_at: new Date().toISOString()
  };
  const { error: upsertError } = await supabase
    .from("company_business_model_cache")
    .upsert(row, { onConflict: "company_name" });
  if (upsertError) throw upsertError;

  const ascii = renderBmcAscii({
    keyPartners: row.key_partners, keyActivities: row.key_activities, keyResources: row.key_resources,
    valuePropositions: row.value_propositions, customerRelationships: row.customer_relationships,
    channels: row.channels, customerSegments: row.customer_segments,
    costStructure: row.cost_structure, revenueStreams: row.revenue_streams
  }, companyName);

  return { ascii, howItWorks: row.how_it_works, sources: row.sources, grounded: row.grounded, cached: false, fetchedAt: row.fetched_at };
}

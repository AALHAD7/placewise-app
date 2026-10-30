import { supabase } from "./supabase.js";
import { generateJSON, generateGroundedText } from "./gemini.js";
import { normalizeCacheKey } from "./cacheKey.js";
import { singleFlight } from "./singleFlight.js";
import { groundedConsultingLookup } from "./consultingRetrieval.js";

// G3 (same pulled-forward call as companyValueChain.js). Historical
// milestones are low false-positive-risk for casebook grounding - unlike
// company_overview's share-price/financials, a dated historical fact
// (founding year, an acquisition) doesn't go stale the way a "current"
// number would, so a casebook's account of it stays trustworthy even if
// the casebook itself is a few years old.
const CONSULTING_RAG_V2_ENABLED = process.env.ENABLE_CONSULTING_RAG_V2 === "true";

async function groundTimeline(companyName) {
  try {
    const result = await groundedConsultingLookup(`${companyName} history founding milestones acquisitions`, { domain: "Consulting", matchCount: 3 });
    if (!result.covered) return { groundedInCasebooks: false, citation: null, excerpt: null };
    return { groundedInCasebooks: true, citation: result.citations[0], excerpt: result.chunks[0].content };
  } catch (err) {
    console.warn(`[companyTimeline] grounding lookup failed for "${companyName}": ${err.message}`);
    return { groundedInCasebooks: false, citation: null, excerpt: null };
  }
}

// A company's history barely changes (a new major event maybe a few times a
// year at most) - longer TTL than role/company overview's 30 days, same
// "slow-moving facts, don't re-pay for this often" reasoning taken further.
const CACHE_TTL_MS = 60 * 24 * 60 * 60 * 1000;

const RESEARCH_SYSTEM_PROMPT = `Research the major historical milestones of the given company, for a student preparing for a job interview in India who wants real, specific talking points (not vague generalities) about the company's history. Actively search multiple reliable sources (Wikipedia, the company's own "About/History" page, major business news archives, Crunchbase) before answering - do not rely on memory alone. Report 6-10 real, dated milestones spanning the company's full history: founding, major funding rounds/IPO, major acquisitions or mergers (name the acquired/merging company), major product launches or pivots, and major controversies or turning points if genuinely significant. For each, give the year (or an approximate year/decade if the exact year genuinely isn't known - never invent a precise year you're not confident about) and one sentence of what happened. Plain prose, chronological order, under 350 words.`;

const FORMAT_SYSTEM_PROMPT = `You are extracting a structured timeline from research text about a company's history. Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"events": [{"year": "2005", "title": "Short label, e.g. 'Acquired PeopleSoft'", "description": "One sentence of what happened and why it mattered."}, ... 6-10 items, chronological, earliest first]}

"year" is a string - a specific year ("2005"), a range ("2001-2003"), or an approximate decade ("late 1970s") if that's the genuine precision the research supports. Never invent a specific year the research doesn't state or clearly imply. If the research is too thin to produce real events, return fewer items rather than inventing ones.`;

async function researchCompanyTimeline(companyName) {
  try {
    const { text, grounded, sources } = await generateGroundedText({
      system: RESEARCH_SYSTEM_PROMPT,
      prompt: `COMPANY: ${companyName}`,
      maxTokens: 900
    });
    return { text, grounded, sources };
  } catch {
    return { text: "", grounded: false, sources: [] };
  }
}

/**
 * @param {string} companyName - any company name, not restricted to a fixed list
 * @returns {Promise<{events: {year: string, title: string, description: string}[], groundedInCasebooks: boolean, citation: object|null, cached: boolean, fetchedAt: string}>}
 */
export async function getCompanyTimeline(companyName) {
  const cacheKey = normalizeCacheKey(companyName);
  return singleFlight(`companyTimeline:${cacheKey}`, () => fetchCompanyTimeline(companyName, cacheKey));
}

async function fetchCompanyTimeline(companyName, cacheKey) {
  const { data: cached, error: cacheError } = await supabase
    .from("company_timeline_cache")
    .select("*")
    .eq("company_name", cacheKey)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const isFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return {
      events: cached.events, groundedInCasebooks: cached.grounded_in_casebooks || false, citation: cached.citation || null,
      cached: true, fetchedAt: cached.fetched_at
    };
  }

  const grounding = CONSULTING_RAG_V2_ENABLED
    ? await groundTimeline(companyName)
    : { groundedInCasebooks: false, citation: null, excerpt: null };

  let result;
  if (grounding.groundedInCasebooks) {
    const prompt = `COMPANY: ${companyName}\n\nCASEBOOK EXCERPT (real, cited - extract milestones from this excerpt only; don't add outside knowledge or blend in general claims):\n${grounding.excerpt}\n\nExtract the timeline JSON as specified.`;
    result = await generateJSON({ system: FORMAT_SYSTEM_PROMPT, prompt, maxTokens: 1200 });
  } else {
    const research = await researchCompanyTimeline(companyName);
    const prompt = research.grounded
      ? `COMPANY: ${companyName}\n\nRESEARCH:\n${research.text}\n\nExtract the timeline JSON as specified.`
      : `COMPANY: ${companyName}\n\n(Web search was unavailable this time - use general knowledge, and only include milestones you're genuinely confident about; return fewer items rather than guessing dates.)\n\nExtract the timeline JSON as specified.`;
    result = await generateJSON({ system: FORMAT_SYSTEM_PROMPT, prompt, maxTokens: 1200 });
  }
  const events = Array.isArray(result.events) ? result.events : [];

  const row = {
    company_name: cacheKey, events,
    grounded_in_casebooks: grounding.groundedInCasebooks, citation: grounding.citation,
    fetched_at: new Date().toISOString()
  };
  const { error: upsertError } = await supabase
    .from("company_timeline_cache")
    .upsert(row, { onConflict: "company_name" });
  if (upsertError) throw upsertError;

  return { events, groundedInCasebooks: row.grounded_in_casebooks, citation: row.citation, cached: false, fetchedAt: row.fetched_at };
}

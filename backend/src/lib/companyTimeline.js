import { supabase } from "./supabase.js";
import { generateJSON, generateGroundedText } from "./gemini.js";

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
 * @returns {Promise<{events: {year: string, title: string, description: string}[], cached: boolean, fetchedAt: string}>}
 */
export async function getCompanyTimeline(companyName) {
  const { data: cached, error: cacheError } = await supabase
    .from("company_timeline_cache")
    .select("*")
    .eq("company_name", companyName)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const isFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return { events: cached.events, cached: true, fetchedAt: cached.fetched_at };
  }

  const research = await researchCompanyTimeline(companyName);
  const prompt = research.grounded
    ? `COMPANY: ${companyName}\n\nRESEARCH:\n${research.text}\n\nExtract the timeline JSON as specified.`
    : `COMPANY: ${companyName}\n\n(Web search was unavailable this time - use general knowledge, and only include milestones you're genuinely confident about; return fewer items rather than guessing dates.)\n\nExtract the timeline JSON as specified.`;
  const result = await generateJSON({ system: FORMAT_SYSTEM_PROMPT, prompt, maxTokens: 1200 });
  const events = Array.isArray(result.events) ? result.events : [];

  const row = { company_name: companyName, events, fetched_at: new Date().toISOString() };
  const { error: upsertError } = await supabase
    .from("company_timeline_cache")
    .upsert(row, { onConflict: "company_name" });
  if (upsertError) throw upsertError;

  return { events, cached: false, fetchedAt: row.fetched_at };
}

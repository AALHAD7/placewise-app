import { supabase } from "./supabase.js";
import { generateJSON, generateGroundedText } from "./gemini.js";
import { normalizeCacheKey } from "./cacheKey.js";
import { resolveSources } from "./resolveSources.js";
import { singleFlight } from "./singleFlight.js";

// Same long TTL as company_business_model_cache/company_leadership_cache - a
// group's set of major subsidiaries doesn't turn over often enough to
// justify re-researching on every visit.
const CACHE_TTL_MS = 60 * 24 * 60 * 60 * 1000;

// Deliberately asks for "major, notable" subsidiaries, not an exhaustive
// legal-entity list - a large conglomerate (Tata, Reliance, Godrej) can have
// 50-100+ registered subsidiaries, most meaningless to a student prepping
// for an interview. This is meant to answer "what are the big, recognizable
// businesses under this group" (Tata Steel, Tata Motors, TCS, ...), not
// serve as a corporate-structure filing.
const RESEARCH_SYSTEM_PROMPT = `Research whether the given company is a parent/holding company or conglomerate with major, notable subsidiary or group companies - the kind a student would actually recognize and might want to research separately for interview prep (e.g. for "Tata", that's Tata Steel, Tata Motors, Tata Consultancy Services, Tata Power, Titan, and similar - not every minor registered legal entity in the group).

Actively search real sources (the company's own site/investor relations page, recent business journalism) before answering - do not rely on memory alone.

If the company genuinely has no such notable subsidiaries (it's a standalone company, not a conglomerate or group holding company), say so plainly. Do not invent a subsidiary you are not confident is real and actually under this company.

List up to 12 of the most major/recognizable ones, one per line, using each company's real, full, commonly-used name. Under 200 words.`;

const FORMAT_SYSTEM_PROMPT = `You are extracting a structured list of subsidiary/group companies from research text. Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"subsidiaries": ["Full Company Name", ...]}

Include only real company names the research text actually named - never invent one to fill the list. Return an empty array if the research text says there are no notable subsidiaries, or if it didn't name any with confidence. At most 12 entries, most major/recognizable first.`;

async function researchSubsidiaries(companyName) {
  try {
    const { text, grounded, sources } = await generateGroundedText({
      system: RESEARCH_SYSTEM_PROMPT,
      prompt: `COMPANY: ${companyName}`,
      maxTokens: 400
    });
    return { text, grounded, sources };
  } catch {
    return { text: "", grounded: false, sources: [] };
  }
}

/**
 * @param {string} companyName
 * @returns {Promise<{subsidiaries: string[], sources: {title:string,uri:string}[], grounded: boolean, cached: boolean, fetchedAt: string}>}
 */
export async function getCompanySubsidiaries(companyName) {
  const cacheKey = normalizeCacheKey(companyName);
  return singleFlight(`companySubsidiaries:${cacheKey}`, () => fetchCompanySubsidiaries(companyName, cacheKey));
}

async function fetchCompanySubsidiaries(companyName, cacheKey) {
  const { data: cached, error: cacheError } = await supabase
    .from("company_subsidiaries_cache")
    .select("*")
    .eq("company_name", cacheKey)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const isFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return { subsidiaries: cached.subsidiaries || [], sources: cached.sources || [], grounded: cached.grounded, cached: true, fetchedAt: cached.fetched_at };
  }

  const research = await researchSubsidiaries(companyName);
  const prompt = research.text
    ? `RESEARCH:\n${research.text}\n\nExtract the subsidiaries JSON as specified.`
    : `(Web search was unavailable this time - only include a subsidiary you're genuinely confident about from general knowledge; return an empty array rather than guessing.)\n\nCOMPANY: ${companyName}\n\nExtract the subsidiaries JSON as specified.`;
  const parsed = await generateJSON({ system: FORMAT_SYSTEM_PROMPT, prompt, maxTokens: 400 });
  const subsidiaries = (Array.isArray(parsed.subsidiaries) ? parsed.subsidiaries : [])
    .filter(s => typeof s === "string" && s.trim())
    .map(s => s.trim())
    .slice(0, 12);
  const resolvedSources = await resolveSources(research.sources);

  const row = {
    company_name: cacheKey,
    subsidiaries,
    sources: resolvedSources,
    grounded: research.grounded,
    fetched_at: new Date().toISOString()
  };
  const { error: upsertError } = await supabase
    .from("company_subsidiaries_cache")
    .upsert(row, { onConflict: "company_name" });
  if (upsertError) throw upsertError;

  return { subsidiaries: row.subsidiaries, sources: row.sources, grounded: row.grounded, cached: false, fetchedAt: row.fetched_at };
}

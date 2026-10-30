import { supabase } from "./supabase.js";
import { generateJSON, generateGroundedText } from "./gemini.js";
import { normalizeCacheKey } from "./cacheKey.js";
import { singleFlight } from "./singleFlight.js";

// Roles a company hires for don't change week to week - same long-TTL
// reasoning as roleOverview.js/companyOverview.js.
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const RESEARCH_SYSTEM_PROMPT = `Research which entry-level/campus-hire job roles the given company actually hires for in India. Actively search multiple reliable sources (the company's own careers page, LinkedIn Jobs, Naukri, Glassdoor, AmbitionBox, campus placement reports) before answering - do not rely on memory alone. Report 3-5 real role titles this company commonly hires freshers/early-career candidates for. Plain prose, under 60 words.`;

const FORMAT_SYSTEM_PROMPT = `You are extracting a short list of job-role titles from research text about which roles a company hires for. Respond with ONLY a JSON object, no markdown fences, no commentary: {"roles": ["Role A", "Role B", ...3-5 items]}`;

async function researchCompanyRoles(companyName) {
  try {
    const { text, grounded } = await generateGroundedText({
      system: RESEARCH_SYSTEM_PROMPT,
      prompt: `COMPANY: ${companyName}`,
      maxTokens: 300
    });
    return { text, grounded };
  } catch {
    return { text: "", grounded: false };
  }
}

/**
 * @param {string} companyName - any company name, not restricted to a fixed list
 * @returns {Promise<{roles: string[], cached: boolean, fetchedAt: string}>}
 */
export async function getCompanyRoles(companyName) {
  const cacheKey = normalizeCacheKey(companyName);
  return singleFlight(`companyRoles:${cacheKey}`, () => fetchCompanyRoles(companyName, cacheKey));
}

async function fetchCompanyRoles(companyName, cacheKey) {
  const { data: cached, error: cacheError } = await supabase
    .from("company_roles_cache")
    .select("*")
    .eq("company_name", cacheKey)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const isFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return { roles: cached.roles, cached: true, fetchedAt: cached.fetched_at };
  }

  const research = await researchCompanyRoles(companyName);
  const prompt = research.grounded
    ? `COMPANY: ${companyName}\n\nRESEARCH:\n${research.text}\n\nExtract the role list as specified.`
    : `COMPANY: ${companyName}\n\n(Web search was unavailable this time - use general knowledge of common entry-level roles at a company like this.)\n\nExtract the role list as specified.`;
  const result = await generateJSON({ system: FORMAT_SYSTEM_PROMPT, prompt, maxTokens: 200 });
  const roles = Array.isArray(result.roles) ? result.roles : [];

  const row = { company_name: cacheKey, roles, fetched_at: new Date().toISOString() };
  const { error: upsertError } = await supabase
    .from("company_roles_cache")
    .upsert(row, { onConflict: "company_name" });
  if (upsertError) throw upsertError;

  return { roles, cached: false, fetchedAt: row.fetched_at };
}

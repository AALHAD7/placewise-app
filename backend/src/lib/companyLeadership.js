import { supabase } from "./supabase.js";
import { generateJSON, generateGroundedText } from "./gemini.js";
import { normalizeCacheKey } from "./cacheKey.js";
import { resolveSources } from "./resolveSources.js";
import { singleFlight } from "./singleFlight.js";

// Same long TTL as company_business_model_cache - a company's C-suite
// doesn't turn over often enough to justify re-researching on every visit.
const CACHE_TTL_MS = 60 * 24 * 60 * 60 * 1000;

const RESEARCH_SYSTEM_PROMPT = `Research the CURRENT, REAL senior leadership (C-suite / top executives) of the given company, for a student preparing for an interview there who wants to know who actually runs the place today. Actively search up-to-date sources (the company's own website/investor relations/leadership page, recent business journalism) before answering - do not rely on memory alone, since executives change over time and a stale or wrong name is worse than an admitted gap.

List the real, currently-serving top executives you can verify (typically: CEO/Managing Director, CFO, COO, CTO/CIO, CHRO, and other named C-suite/founder roles where applicable) - each as an exact full name and their exact current title at this company. If you cannot verify who currently holds a role, leave it out entirely rather than guessing or naming a predecessor. Never invent a name.

Plain prose, one executive per line, in the format "Full Name — Exact Title". Under 300 words. If you can verify only one or two executives (common for a smaller or more private company), that's fine - return only what you can verify.`;

const FORMAT_SYSTEM_PROMPT = `You are extracting a structured list of company executives from research text. Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"executives": [{"name": "Full Name", "title": "Exact Title"}]}

Include only entries where the research text gives a real, specific full name AND title - never invent one to fill the list. Preserve the name/title exactly as given in the research text. Return at most 6, ordered CEO/Managing Director first if present, then other C-suite roughly by seniority. If the research text names nobody with confidence, return an empty array.`;

const WIKI_TIMEOUT_MS = 5000;
const WIKI_HEADERS = { "User-Agent": "PlacewisePlatform/1.0 (student interview-prep tool; contact via repo owner)" };

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WIKI_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal, headers: WIKI_HEADERS });
  } finally {
    clearTimeout(timer);
  }
}

// Real photos only, never generated/guessed ones - a fabricated likeness of
// a real, named person is worse than showing no photo at all. Wikipedia is
// the one source here that's both free-to-use and carries enough of its own
// editorial verification to trust; it only covers well-known executives
// (mainly CEOs of large/public companies), which is expected - anyone not
// found here falls back to an initials avatar on the frontend, not a blank
// gap. The company-name check on the matched page's own text is the
// specific guard against a same-named different person's photo being
// attached to the wrong exec (e.g. a common name matching an actor or
// politician instead of the actual executive).
async function lookupWikipediaPhoto(personName, companyName) {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(personName + " " + companyName)}&format=json&srlimit=1`;
    const searchRes = await fetchWithTimeout(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const title = searchData?.query?.search?.[0]?.title;
    if (!title) return null;

    const summaryRes = await fetchWithTimeout(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!summaryRes.ok) return null;
    const summary = await summaryRes.json();
    const extract = String(summary.extract || "").toLowerCase();
    if (!extract.includes(companyName.toLowerCase())) return null;
    return summary.thumbnail?.source || null;
  } catch {
    return null;
  }
}

async function researchLeadership(companyName) {
  try {
    const { text, grounded, sources } = await generateGroundedText({
      system: RESEARCH_SYSTEM_PROMPT,
      prompt: `COMPANY: ${companyName}`,
      maxTokens: 500
    });
    return { text, grounded, sources };
  } catch {
    return { text: "", grounded: false, sources: [] };
  }
}

/**
 * @param {string} companyName
 * @returns {Promise<{executives: {name: string, title: string, photoUrl: string | null}[], sources: {title:string,uri:string}[], grounded: boolean, cached: boolean, fetchedAt: string}>}
 */
export async function getCompanyLeadership(companyName) {
  const cacheKey = normalizeCacheKey(companyName);
  return singleFlight(`companyLeadership:${cacheKey}`, () => fetchCompanyLeadership(companyName, cacheKey));
}

async function fetchCompanyLeadership(companyName, cacheKey) {
  const { data: cached, error: cacheError } = await supabase
    .from("company_leadership_cache")
    .select("*")
    .eq("company_name", cacheKey)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const isFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return { executives: cached.executives || [], sources: cached.sources || [], grounded: cached.grounded, cached: true, fetchedAt: cached.fetched_at };
  }

  const research = await researchLeadership(companyName);
  const prompt = research.text
    ? `RESEARCH:\n${research.text}\n\nExtract the executives JSON as specified.`
    : `(Web search was unavailable this time - only include an executive if you are genuinely confident about their current name and title from general knowledge; return fewer, or none, rather than guessing.)\n\nCOMPANY: ${companyName}\n\nExtract the executives JSON as specified.`;
  const parsed = await generateJSON({ system: FORMAT_SYSTEM_PROMPT, prompt, maxTokens: 500 });
  const rawExecs = (Array.isArray(parsed.executives) ? parsed.executives : [])
    .filter(e => e && typeof e.name === "string" && e.name.trim() && typeof e.title === "string" && e.title.trim())
    .slice(0, 6);

  const photos = await Promise.all(rawExecs.map(e => lookupWikipediaPhoto(e.name.trim(), companyName)));
  const executives = rawExecs.map((e, i) => ({ name: e.name.trim(), title: e.title.trim(), photoUrl: photos[i] }));
  const resolvedSources = await resolveSources(research.sources);

  const row = {
    company_name: cacheKey,
    executives,
    sources: resolvedSources,
    grounded: research.grounded,
    fetched_at: new Date().toISOString()
  };
  const { error: upsertError } = await supabase
    .from("company_leadership_cache")
    .upsert(row, { onConflict: "company_name" });
  if (upsertError) throw upsertError;

  return { executives: row.executives, sources: row.sources, grounded: row.grounded, cached: false, fetchedAt: row.fetched_at };
}

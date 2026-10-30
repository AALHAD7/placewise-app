import { supabase } from "./supabase.js";
import { generateJSON, generateGroundedText } from "./gemini.js";
import { normalizeCacheKey } from "./cacheKey.js";
import { resolveSources } from "./resolveSources.js";
import { singleFlight } from "./singleFlight.js";

// Ratings drift over months, not days - same order of magnitude as
// role_overview_cache's 30 days, shorter than the 60-day "slow-moving fact"
// tier used for value chain/timeline.
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Same research-then-format shape as companyBusinessModel.js/roleOverview.js
// - a grounded call constrained directly to strict JSON measurably skips
// actually searching a third of the time (see gemini.js's comment on
// generateGroundedText), so research is plain text first, structured
// second. No Glassdoor API exists (deprecated) and scraping it directly is
// fragile/against ToS - already decided against for salary data (see the
// 2026-09-02 Decisions Log entry) - so this is Gemini's real Google Search
// grounding finding and citing an actual Glassdoor page, never a guessed
// number.
const RATING_RESEARCH_SYSTEM_PROMPT = `Research the given company's REAL, current overall employee rating on Glassdoor. Actively search Glassdoor.com and reputable secondary sources that report real Glassdoor data (business news citing it, aggregator sites) before answering - do not rely on memory alone and never invent a plausible-sounding number.

Report: the overall rating out of 5 (e.g. "4.2"), and the approximate number of reviews it's based on if you can find it (e.g. "~1,200 reviews" - approximate is fine, an exact invented count is not).

If you cannot find a genuine, verifiable Glassdoor rating for this company, say so plainly rather than inventing one.`;

const RATING_FORMAT_SYSTEM_PROMPT = `You are extracting a structured Glassdoor rating from research text. Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"found": true|false, "rating": 4.2, "reviewCount": "~1,200 reviews"}

"found" is false (with "rating" and "reviewCount" both null) if the research did not actually locate a real, verifiable rating - never set "found": true on a guessed or estimated number. "rating" is a number between 1 and 5 (not a string) when found.`;

const ROLE_RATING_RESEARCH_SYSTEM_PROMPT = `Research the given company's REAL, current employee rating on Glassdoor SPECIFICALLY for people in the given role. Actively search Glassdoor.com and reputable secondary sources before answering - do not rely on memory alone.

Glassdoor often does not have a rating broken out for the exact role title given. If that happens, find the CLOSEST comparable role Glassdoor actually reports a rating for at this company (e.g. if asked about "Product Manager" and Glassdoor only rates "Senior Product Manager" or "Product Manager II" at this company, use that instead) and report it - but state plainly that this is a closest match, name the exact role title Glassdoor used (which may differ from what was asked), and never claim an exact-role rating exists if you could not verify one does.

If Glassdoor has no role-specific rating at all for this company (not even a close one), say so plainly rather than inventing one - the overall company rating is shown separately and doesn't need to be repeated here.`;

const ROLE_RATING_FORMAT_SYSTEM_PROMPT = `You are extracting a structured role-specific Glassdoor rating from research text. Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"found": true|false, "rating": 4.0, "reviewCount": "~85 reviews", "matchedRoleTitle": "Senior Product Manager", "isExactMatch": false}

"found" is false (with every other field null/false) if no real rating - exact or closest-match - was actually located. "matchedRoleTitle" is the exact role title Glassdoor's data is actually for (fill it even when isExactMatch is true, using the role as typed). "isExactMatch" is true only if the research confirms Glassdoor rates this exact role title, not a related one. "rating" is a number, not a string.`;

/**
 * @param {string} companyName
 * @returns {Promise<{found: boolean, rating: number|null, reviewCount: string|null, sources: {title:string,uri:string}[], grounded: boolean, cached: boolean, fetchedAt: string}>}
 */
export async function getCompanyRating(companyName) {
  const cacheKey = normalizeCacheKey(companyName);
  return singleFlight(`companyRating:${cacheKey}`, () => fetchCompanyRating(companyName, cacheKey));
}

async function fetchCompanyRating(companyName, cacheKey) {
  const { data: cached, error: cacheError } = await supabase
    .from("company_rating_cache")
    .select("*")
    .eq("company_name", cacheKey)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const isFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return {
      found: cached.found, rating: cached.rating, reviewCount: cached.review_count,
      sources: cached.sources || [], grounded: cached.grounded, cached: true, fetchedAt: cached.fetched_at
    };
  }

  // retriesIfUngrounded: confirmed live that whether the model actually
  // invokes search is itself probabilistic (the identical prompt for "TCS"/
  // "Amazon India" came back ungrounded twice, then grounded on a 3rd try) -
  // this feature hard-refuses to show a rating when ungrounded (see below),
  // so it needs a real shot at grounding firing, not one roll of the dice.
  const research = await generateGroundedText({ system: RATING_RESEARCH_SYSTEM_PROMPT, prompt: `COMPANY: ${companyName}`, maxTokens: 400, retriesIfUngrounded: 2 });
  const resolvedSources = await resolveSources(research.sources);
  const prompt = research.grounded
    ? `COMPANY: ${companyName}\n\nRESEARCH:\n${research.text}\n\nExtract the rating JSON as specified.`
    : `COMPANY: ${companyName}\n\n(Web search was unavailable this time - do not guess a rating; return "found": false.)\n\nExtract the rating JSON as specified.`;
  const result = await generateJSON({ system: RATING_FORMAT_SYSTEM_PROMPT, prompt, maxTokens: 200 });

  const row = {
    company_name: cacheKey,
    found: !!result.found,
    rating: result.found && typeof result.rating === "number" ? result.rating : null,
    review_count: result.found ? (result.reviewCount || null) : null,
    sources: resolvedSources,
    grounded: research.grounded,
    fetched_at: new Date().toISOString()
  };
  // Don't lock in "not found" for the full 30-day TTL - same reasoning as
  // news.js's empty-result handling: a failure to ground is more likely
  // transient (grounding itself is probabilistic per call - see
  // retriesIfUngrounded above) than "this company truly has no Glassdoor
  // presence." Only a genuine find gets cached; the next request retries
  // fresh instead of serving a stale, possibly-wrong "not found" for weeks.
  if (row.found) {
    const { error: upsertError } = await supabase
      .from("company_rating_cache")
      .upsert(row, { onConflict: "company_name" });
    if (upsertError) throw upsertError;
  }

  return {
    found: row.found, rating: row.rating, reviewCount: row.review_count,
    sources: row.sources, grounded: row.grounded, cached: false, fetchedAt: row.fetched_at
  };
}

/**
 * @param {string} companyName
 * @param {string} roleName
 * @returns {Promise<{found: boolean, rating: number|null, reviewCount: string|null, matchedRoleTitle: string|null, isExactMatch: boolean, sources: {title:string,uri:string}[], grounded: boolean, cached: boolean, fetchedAt: string}>}
 */
export async function getCompanyRoleRating(companyName, roleName) {
  const companyKey = normalizeCacheKey(companyName);
  const roleKey = normalizeCacheKey(roleName);
  return singleFlight(`companyRoleRating:${companyKey}::${roleKey}`, () => fetchCompanyRoleRating(companyName, roleName, companyKey, roleKey));
}

async function fetchCompanyRoleRating(companyName, roleName, companyKey, roleKey) {
  const { data: cached, error: cacheError } = await supabase
    .from("company_role_rating_cache")
    .select("*")
    .eq("company_name", companyKey)
    .eq("role_name", roleKey)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const isFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return {
      found: cached.found, rating: cached.rating, reviewCount: cached.review_count,
      matchedRoleTitle: cached.matched_role_title, isExactMatch: cached.is_exact_match,
      sources: cached.sources || [], grounded: cached.grounded, cached: true, fetchedAt: cached.fetched_at
    };
  }

  // Same retriesIfUngrounded reasoning as fetchCompanyRating above.
  const research = await generateGroundedText({ system: ROLE_RATING_RESEARCH_SYSTEM_PROMPT, prompt: `COMPANY: ${companyName}\nROLE: ${roleName}`, maxTokens: 500, retriesIfUngrounded: 2 });
  const resolvedSources = await resolveSources(research.sources);
  const prompt = research.grounded
    ? `COMPANY: ${companyName}\nROLE: ${roleName}\n\nRESEARCH:\n${research.text}\n\nExtract the rating JSON as specified.`
    : `COMPANY: ${companyName}\nROLE: ${roleName}\n\n(Web search was unavailable this time - do not guess a rating; return "found": false.)\n\nExtract the rating JSON as specified.`;
  const result = await generateJSON({ system: ROLE_RATING_FORMAT_SYSTEM_PROMPT, prompt, maxTokens: 250 });

  const row = {
    company_name: companyKey,
    role_name: roleKey,
    found: !!result.found,
    rating: result.found && typeof result.rating === "number" ? result.rating : null,
    review_count: result.found ? (result.reviewCount || null) : null,
    matched_role_title: result.found ? (result.matchedRoleTitle || roleName) : null,
    is_exact_match: result.found ? !!result.isExactMatch : false,
    sources: resolvedSources,
    grounded: research.grounded,
    fetched_at: new Date().toISOString()
  };
  // Same "don't cache a miss" reasoning as fetchCompanyRating above.
  if (row.found) {
    const { error: upsertError } = await supabase
      .from("company_role_rating_cache")
      .upsert(row, { onConflict: "company_name,role_name" });
    if (upsertError) throw upsertError;
  }

  return {
    found: row.found, rating: row.rating, reviewCount: row.review_count,
    matchedRoleTitle: row.matched_role_title, isExactMatch: row.is_exact_match,
    sources: row.sources, grounded: row.grounded, cached: false, fetchedAt: row.fetched_at
  };
}

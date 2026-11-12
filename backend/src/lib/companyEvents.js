import { supabase } from "./supabase.js";
import { generateJSON, generateGroundedText } from "./gemini.js";
import { normalizeCacheKey } from "./cacheKey.js";
import { resolveSources } from "./resolveSources.js";
import { singleFlight } from "./singleFlight.js";

// Upcoming corporate events (quarterly results, AGM, dividend/record dates,
// etc.) - the Zerodha-style "Events" timeline Aalhad asked for, 2026-11-13.
// A future date is NOT something a model can recall from training data (it
// didn't exist yet when the model was trained), so this is categorically
// higher-risk than companyTimeline.js's historical milestones - it follows
// companyRating.js's HARD-REFUSE-if-ungrounded posture, not
// companyTimeline's softer "fall back to general knowledge" one. Only
// genuinely grounded (real search occurred, real source found) results are
// ever shown or cached - see RESEARCH_SYSTEM_PROMPT and the `research.grounded
// ? ... : (hard refuse)` branch below.
//
// Short TTL (14 days, vs. 30/60 elsewhere) - an upcoming-event date goes
// stale within weeks as quarters close and a new "next" date becomes
// current, unlike a Glassdoor rating or historical milestone.
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

const RESEARCH_SYSTEM_PROMPT = `Research the given company's REAL, upcoming corporate events/calendar - things like the next quarterly or annual results date, AGM (annual general meeting), dividend/record/ex-date, or any other major scheduled corporate announcement. Actively search reliable sources before answering - moneycontrol.com, the NSE/BSE corporate announcements/corporate-actions pages, screener.in, the company's own investor-relations page - do not rely on memory alone, and NEVER estimate or extrapolate a future date from a pattern (e.g. "they usually report in late January, so probably late January this time") - only report a date that a real source actually states.

Many companies (private, unlisted, or ones with no public corporate calendar) genuinely have no findable upcoming events - if you cannot find any real, source-stated upcoming event, say so plainly rather than inventing one.

Report each real upcoming event you find: what it is, the date or date range as the source actually states it (e.g. "expected mid-January 2027" or "scheduled for March 15, 2027" - preserve the source's own precision, never sharpen an approximate statement into a false-precision exact date), and which source stated it.`;

const FORMAT_SYSTEM_PROMPT = `You are extracting a structured list of upcoming corporate events from research text. Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"found": true|false, "events": [{"type": "Quarterly Results", "title": "Q3 FY27 Results", "expectedDate": "Expected mid-January 2027", "description": "One sentence of context."}]}

"found" is false (with "events": []) if the research did not actually locate any real, source-stated upcoming event - never set "found": true with an invented or estimated date. "type" is a short category (e.g. "Quarterly Results", "AGM", "Dividend", "Other"). "expectedDate" is a string in whatever precision the source actually gave - never convert an approximate statement into a fake-precise exact date.`;

async function researchCompanyEvents(companyName) {
  // retriesIfUngrounded: same reasoning as companyRating.js - whether the
  // model actually invokes search is itself probabilistic, and this feature
  // hard-refuses to show anything when ungrounded, so it needs a real shot
  // at grounding firing rather than one roll of the dice.
  return generateGroundedText({ system: RESEARCH_SYSTEM_PROMPT, prompt: `COMPANY: ${companyName}`, maxTokens: 500, retriesIfUngrounded: 2 });
}

/**
 * @param {string} companyName
 * @returns {Promise<{found: boolean, events: {type:string,title:string,expectedDate:string,description:string}[], sources: {title:string,uri:string}[], grounded: boolean, cached: boolean, fetchedAt: string}>}
 */
export async function getCompanyEvents(companyName) {
  const cacheKey = normalizeCacheKey(companyName);
  return singleFlight(`companyEvents:${cacheKey}`, () => fetchCompanyEvents(companyName, cacheKey));
}

async function fetchCompanyEvents(companyName, cacheKey) {
  const { data: cached, error: cacheError } = await supabase
    .from("company_events_cache")
    .select("*")
    .eq("company_name", cacheKey)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const isFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return {
      found: cached.found, events: cached.events || [], sources: cached.sources || [],
      grounded: cached.grounded, cached: true, fetchedAt: cached.fetched_at
    };
  }

  const research = await researchCompanyEvents(companyName);
  const resolvedSources = await resolveSources(research.sources);

  // Hard refuse when ungrounded - never let the formatter guess from
  // general knowledge, unlike companyTimeline.js's softer fallback. A
  // future date with no real source behind it is actively misleading, not
  // just lower-quality.
  const prompt = research.grounded
    ? `COMPANY: ${companyName}\n\nRESEARCH:\n${research.text}\n\nExtract the events JSON as specified.`
    : `COMPANY: ${companyName}\n\n(Web search was unavailable this time - do not guess or estimate any event; return "found": false, "events": [].)\n\nExtract the events JSON as specified.`;
  const result = await generateJSON({ system: FORMAT_SYSTEM_PROMPT, prompt, maxTokens: 600 });

  const row = {
    company_name: cacheKey,
    found: !!result.found && Array.isArray(result.events) && result.events.length > 0,
    events: result.found && Array.isArray(result.events) ? result.events.slice(0, 10) : [],
    sources: resolvedSources,
    grounded: research.grounded,
    fetched_at: new Date().toISOString()
  };
  // Same "don't cache a miss for the full TTL" reasoning as companyRating.js -
  // a failure to ground is more likely transient than "this company's
  // calendar genuinely has zero findable events," so only a genuine find is
  // cached; the next request retries fresh.
  if (row.found) {
    const { error: upsertError } = await supabase
      .from("company_events_cache")
      .upsert(row, { onConflict: "company_name" });
    if (upsertError) throw upsertError;
  }

  return {
    found: row.found, events: row.events, sources: row.sources,
    grounded: row.grounded, cached: false, fetchedAt: row.fetched_at
  };
}

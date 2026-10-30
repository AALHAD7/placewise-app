import { supabase } from "./supabase.js";
import { generateJSON, generateGroundedText } from "./gemini.js";
import { getNews } from "./news.js";
import { normalizeCacheKey } from "./cacheKey.js";
import { resolveSources } from "./resolveSources.js";
import { singleFlight } from "./singleFlight.js";

// Cache TTL is days, not hours (contrast news_cache's 6h) — a company's
// sector, HQ, and general strategic focus don't shift day to day the way
// headlines do, so there's no benefit to regenerating (and re-paying for)
// this on every visit. Share price is the one fact here that goes stale
// faster than this TTL allows - handled by always framing it "as of <date>"
// rather than presenting it as live, same honesty discipline as everything
// else this file generates (never a bare unlabeled number that reads as
// current when it might be days old).
const CACHE_TTL_MS = 4 * 24 * 60 * 60 * 1000;

// Grounded research first, plain prose (not JSON) - same reasoning as every
// other researchX() in this codebase (see companyBusinessModel.js's
// comment): a strict-JSON grounded call measurably skips actually searching
// a third of the time. This is also what makes covering share price/listed
// status honest at all - without a real search, the model has no way to
// know a current price and would either refuse or (worse) guess one.
const RESEARCH_SYSTEM_PROMPT = `Research the given company for a student preparing for a job interview in India. You will also be given a handful of recent real news headlines about it for extra context. Actively search real sources (the company's own site/investor relations page, stock exchange listings, recent business journalism, its annual report/10-K) before answering - do not rely on memory alone.

Cover, as clearly separated parts: (1) what the company does and how it makes money, in plain language; (2) its sector/industry (e.g. FMCG, IT services, consulting, fintech, e-commerce); (3) whether it is publicly listed on a stock exchange - state this explicitly as Yes or No; if Yes, name the exchange(s) and its ticker symbol; if No, say "privately held"; if you genuinely cannot determine either way, say that plainly instead of guessing; (4) if listed, its most recent share price you can actually find, with the exact date you found it (never state or imply a live/real-time price - always attribute it to a specific date); (5) headline financial figures if publicly available (most recent annual revenue and/or profit, approximate is fine, with the period e.g. "FY24" - this applies to large private companies too, not just listed ones, if they disclose figures); (6) HQ location; (7) founding year; (8) approximate headcount; (9) 2-3 real current strategic investments/initiatives, grounded in the news headlines below where relevant; (10) typical interview-process rounds for a general role at a company of this size/sector - explicitly general guidance, not a claim about this exact company's actual process.

Be honest about uncertainty. Do NOT invent a precise statistic (exact headcount, exact revenue, exact share price, exact founding date) you are not highly confident about - use an approximate/rounded figure with a "~" prefix or state plainly that you could not find it, rather than guess. Never invent a ticker symbol or a share price.

Plain prose, organized in short clearly labeled parts. Under 550 words.`;

const FORMAT_SYSTEM_PROMPT = `You are extracting a structured company-overview card from research text about a company, for a student preparing for a job interview in India. Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{
  "about": "2-4 sentence plain-language description of what the company does and how it makes money",
  "sector": "short sector/industry label, e.g. 'FMCG', 'IT Services', 'Management Consulting', 'Fintech'",
  "listed": true, false, or null,
  "listedDetail": "NSE - RAZORPAY (example ticker)" if listed=true, "Privately held" if listed=false, or a one-line note on why it's unclear if listed=null,
  "sharePrice": "₹X,XXX (as of 12 Mar 2026)" or null,
  "financials": "one short line, e.g. 'Revenue ~₹X,XXX cr (FY24)'" or null,
  "facts": [{"k": "HQ", "v": "..."}, {"k": "Founded", "v": "..."}, {"k": "Headcount", "v": "~N,000 (approximate)"}],
  "investments": [{"title": "short label", "detail": "one sentence on this strategic focus/bet, grounded in the news context if relevant"}],
  "processNote": "one short line, e.g. 'General guidance - actual process varies by role and year'",
  "rounds": [{"name": "round name", "detail": "one sentence on what it typically covers"}]
}

Base every field strictly on the research text below - never add a number, ticker, or date the research didn't state.

"listed" must be a real boolean (true/false), not a string - use JSON null only if the research text genuinely could not determine it either way. "listedDetail" is required whenever "listed" is true or false (never leave it empty in those cases). "sharePrice" must be null unless "listed" is true AND the research gives a concrete figure with a date - never fill it in for an unlisted or uncertain company. "financials" must be null unless the research gives a concrete revenue/profit figure with a period - never write "unknown"/"not available" as its value, use null instead. "sector" is always required - give your best-supported label even if the research didn't use that exact word.

2-3 items in "facts" (HQ/Founded/Headcount only - do not repeat sector/listed/financials here, they have their own fields above), 2-3 in "investments", 3-5 in "rounds". If the research is too thin for a category, return fewer items (even a single honest one) rather than inventing to fill it.`;

async function researchOverview(companyName, newsContext) {
  try {
    const { text, grounded, sources } = await generateGroundedText({
      system: RESEARCH_SYSTEM_PROMPT,
      prompt: `COMPANY: ${companyName}\n\nRECENT NEWS HEADLINES:\n${newsContext}`,
      maxTokens: 900
    });
    return { text, grounded, sources };
  } catch {
    return { text: "", grounded: false, sources: [] };
  }
}

function normalizeListed(v) {
  return typeof v === "boolean" ? v : null;
}
function normalizeNullableString(v) {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/**
 * @param {string} companyName
 * @returns {Promise<{about, sector, listed, listedDetail, sharePrice, financials, facts, investments, processNote, rounds, sources, grounded, cached, fetchedAt}>}
 */
export async function getCompanyOverview(companyName) {
  const cacheKey = normalizeCacheKey(companyName);
  return singleFlight(`companyOverview:${cacheKey}`, () => fetchCompanyOverview(companyName, cacheKey));
}

async function fetchCompanyOverview(companyName, cacheKey) {
  const { data: cached, error: cacheError } = await supabase
    .from("company_overview_cache")
    .select("*")
    .eq("company_name", cacheKey)
    .maybeSingle();
  if (cacheError) throw cacheError;

  // financials_fetched_at (not the row's own fetched_at) gates freshness -
  // added alongside the dedicated financials columns (migration_026), so a
  // row cached before that migration (sector/listed/etc. all null) is
  // treated as stale here even if its fetched_at is recent, and gets
  // re-researched once rather than showing an empty Financials section
  // until the normal 4-day TTL would otherwise have refreshed it.
  const isFresh = cached && cached.financials_fetched_at &&
    Date.now() - new Date(cached.financials_fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return {
      about: cached.about, sector: cached.sector, listed: cached.listed, listedDetail: cached.listed_detail,
      sharePrice: cached.share_price, financials: cached.financials,
      facts: cached.facts, investments: cached.investments,
      processNote: cached.process_note, rounds: cached.rounds,
      sources: cached.sources || [], grounded: !!cached.grounded,
      cached: true, fetchedAt: cached.fetched_at
    };
  }

  // Grounding context only - best effort. A news outage shouldn't block the
  // overview from generating, it'll just lean more on general knowledge.
  let newsContext = "(no recent news context available)";
  try {
    const { articles } = await getNews("company", companyName, `"${companyName}"`);
    if (articles.length) {
      newsContext = articles.slice(0, 8).map(a => `- ${a.title}${a.description ? ": " + a.description : ""}`).join("\n");
    }
  } catch {
    // fall through with the default placeholder context
  }

  const research = await researchOverview(companyName, newsContext);
  const prompt = research.text
    ? `RESEARCH:\n${research.text}\n\nExtract the company-overview JSON as specified.`
    : `COMPANY: ${companyName}\n\nRECENT NEWS HEADLINES:\n${newsContext}\n\n(Web search was unavailable this time - only include a fact you're genuinely confident about from general knowledge; use null for "sharePrice"/"financials" and null "listed" rather than guess.)\n\nExtract the company-overview JSON as specified.`;
  const overview = await generateJSON({ system: FORMAT_SYSTEM_PROMPT, prompt, maxTokens: 1500 });
  const resolvedSources = await resolveSources(research.sources);

  const now = new Date().toISOString();
  const row = {
    company_name: cacheKey,
    about: overview.about || "",
    sector: normalizeNullableString(overview.sector),
    listed: normalizeListed(overview.listed),
    listed_detail: normalizeNullableString(overview.listedDetail),
    share_price: normalizeNullableString(overview.sharePrice),
    financials: normalizeNullableString(overview.financials),
    facts: Array.isArray(overview.facts) ? overview.facts : [],
    investments: Array.isArray(overview.investments) ? overview.investments : [],
    process_note: overview.processNote || "",
    rounds: Array.isArray(overview.rounds) ? overview.rounds : [],
    sources: resolvedSources,
    grounded: research.grounded,
    fetched_at: now,
    financials_fetched_at: now
  };
  const { error: upsertError } = await supabase
    .from("company_overview_cache")
    .upsert(row, { onConflict: "company_name" });
  if (upsertError) throw upsertError;

  return {
    about: row.about, sector: row.sector, listed: row.listed, listedDetail: row.listed_detail,
    sharePrice: row.share_price, financials: row.financials,
    facts: row.facts, investments: row.investments,
    processNote: row.process_note, rounds: row.rounds,
    sources: row.sources, grounded: row.grounded,
    cached: false, fetchedAt: row.fetched_at
  };
}

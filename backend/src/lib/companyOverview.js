import { supabase } from "./supabase.js";
import { generateJSON } from "./gemini.js";
import { getNews } from "./news.js";

// Cache TTL is days, not hours (contrast news_cache's 6h) — a company's
// sector, HQ, and general strategic focus don't shift day to day the way
// headlines do, so there's no benefit to regenerating (and re-paying for)
// this on every visit.
const CACHE_TTL_MS = 4 * 24 * 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are a research assistant building a company-overview card for a student preparing for a job interview in India. You will be given the company's name and a handful of recent real news headlines about it.

Be honest about uncertainty. Do NOT invent precise statistics (exact headcount, exact revenue, exact founding date) you are not highly confident about — use an approximate/rounded figure with a "~" prefix (e.g. "~3,000") or omit the fact entirely rather than state a specific wrong number. Base "about", "facts", and "investments" on stable, widely-known public information about the company plus the provided news headlines. Never present something as a confirmed fact if it is actually a guess.

The "rounds" field is explicitly GENERAL GUIDANCE, not a claim about this exact company's actual process — frame it that way (e.g. "Typically includes..." not "This company's process is..."). Base it on the norm for a company of this size/sector/country, not invented specifics.

Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{
  "about": "2-4 sentence plain-language description of what the company does and how it makes money",
  "facts": [{"k": "Sector", "v": "..."}, {"k": "HQ", "v": "..."}, {"k": "Founded", "v": "..."}, {"k": "Headcount", "v": "~N,000 (approximate)"}],
  "investments": [{"title": "short label", "detail": "one sentence on this strategic focus/bet, grounded in the news context if relevant"}],
  "processNote": "one short line, e.g. 'General guidance - actual process varies by role and year'",
  "rounds": [{"name": "round name", "detail": "one sentence on what it typically covers"}]
}

3-4 items in "facts", 2-3 in "investments", 3-5 in "rounds". If you genuinely don't have enough signal on a field (e.g. a very obscure company with no news), still return your best general-knowledge answer rather than leaving arrays empty, but keep it honestly generic.`;

/**
 * @param {string} companyName
 * @returns {Promise<{about, facts, investments, processNote, rounds, cached, fetchedAt}>}
 */
export async function getCompanyOverview(companyName) {
  const { data: cached, error: cacheError } = await supabase
    .from("company_overview_cache")
    .select("*")
    .eq("company_name", companyName)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const isFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return {
      about: cached.about, facts: cached.facts, investments: cached.investments,
      processNote: cached.process_note, rounds: cached.rounds,
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

  const prompt = `COMPANY: ${companyName}\n\nRECENT NEWS HEADLINES:\n${newsContext}\n\nGenerate the company-overview JSON as specified.`;
  const overview = await generateJSON({ system: SYSTEM_PROMPT, prompt, maxTokens: 1500 });

  const row = {
    company_name: companyName,
    about: overview.about || "",
    facts: Array.isArray(overview.facts) ? overview.facts : [],
    investments: Array.isArray(overview.investments) ? overview.investments : [],
    process_note: overview.processNote || "",
    rounds: Array.isArray(overview.rounds) ? overview.rounds : [],
    fetched_at: new Date().toISOString()
  };
  const { error: upsertError } = await supabase
    .from("company_overview_cache")
    .upsert(row, { onConflict: "company_name" });
  if (upsertError) throw upsertError;

  return {
    about: row.about, facts: row.facts, investments: row.investments,
    processNote: row.process_note, rounds: row.rounds,
    cached: false, fetchedAt: row.fetched_at
  };
}

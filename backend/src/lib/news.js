import { supabase } from "./supabase.js";
import { normalizeCacheKey } from "./cacheKey.js";
import { singleFlight } from "./singleFlight.js";

const GNEWS_SEARCH_URL = "https://gnews.io/api/v4/search";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours — free tier is 100 req/day, so don't hit GNews on every page load

async function fetchFromGNews(query, { max = 10, lang = "en" } = {}) {
  const url = new URL(GNEWS_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("token", process.env.GNEWS_API_KEY);
  url.searchParams.set("lang", lang);
  url.searchParams.set("max", String(max));

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GNews error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return (data.articles || []).map(a => ({
    title: a.title,
    description: a.description,
    url: a.url,
    image: a.image,
    source: a.source?.name ?? null,
    publishedAt: a.publishedAt
  }));
}

/**
 * @param {"company" | "domain"} scopeType
 * @param {string} scopeValue - company name or domain/industry name
 * @param {string} query - the search query to send GNews on a cache miss
 * @returns {Promise<{articles: object[], cached: boolean, fetchedAt: string}>}
 */
export async function getNews(scopeType, scopeValue, query) {
  const cacheKey = normalizeCacheKey(scopeValue);
  return singleFlight(`news:${scopeType}::${cacheKey}`, () => fetchNews(scopeType, cacheKey, query));
}

async function fetchNews(scopeType, cacheKey, query) {
  const { data: cached, error: cacheError } = await supabase
    .from("news_cache")
    .select("*")
    .eq("scope_type", scopeType)
    .eq("scope_value", cacheKey)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const isFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return { articles: cached.articles, cached: true, fetchedAt: cached.fetched_at };
  }

  const articles = await fetchFromGNews(query);
  const fetchedAt = new Date().toISOString();

  // Don't lock in an empty result for the full TTL — a 0-article response is more likely
  // a transient/overly-narrow-query issue than "this company/domain truly has no news ever",
  // so let the next request retry GNews instead of serving stale emptiness for 6 hours.
  if (articles.length > 0) {
    const { error: upsertError } = await supabase
      .from("news_cache")
      .upsert({ scope_type: scopeType, scope_value: cacheKey, articles, fetched_at: fetchedAt }, { onConflict: "scope_type,scope_value" });
    if (upsertError) throw upsertError;
  }

  return { articles, cached: false, fetchedAt };
}

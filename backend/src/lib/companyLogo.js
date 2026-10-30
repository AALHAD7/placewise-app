import { normalizeCacheKey } from "./cacheKey.js";
import { singleFlight } from "./singleFlight.js";

// Clearbit's autocomplete endpoint still resolves a company name to its real
// domain (confirmed live) - but Clearbit shut down the free Logo API this
// endpoint's own `logo` field used to point at, and that field is now
// always null (confirmed live: every result for "Razorpay", "TCS" etc. came
// back {"logo": null}), which is why the logo never actually showed despite
// the button code rendering it correctly. The real image now comes from
// Google's public favicon/icon service instead - the domain's own actual
// favicon, pulled live, never anything Clearbit- or AI-generated.
const AUTOCOMPLETE_URL = "https://autocomplete.clearbit.com/v1/companies/suggest?query=";
const FAVICON_SIZE = 128;
const FETCH_TIMEOUT_MS = 4000;

// In-memory only (like singleFlight's inFlight map) - a logo URL is static
// enough that per-process caching for the life of the server is plenty; no
// Supabase table needed for something this cheap and low-stakes to
// re-fetch on restart.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map();

async function fetchWithTimeout(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function resolveDomain(companyName) {
  try {
    const res = await fetchWithTimeout(AUTOCOMPLETE_URL + encodeURIComponent(companyName));
    if (!res.ok) return null;
    const results = await res.json();
    const best = Array.isArray(results) ? results[0] : null;
    return best?.domain || null;
  } catch {
    return null;
  }
}

// Google's favicon endpoint returns a genuine 404 (not a 200 fallback
// globe) when a domain has no discoverable favicon - confirmed live, e.g.
// tcs.com 404s while www.tcs.com 200s, so the bare-then-www fallback below
// catches the handful of sites that only serve one or the other. HEAD (not
// GET) so this check never downloads the image body it isn't going to use -
// the frontend fetches the actual bytes itself, once, from the URL returned.
async function faviconUrlFor(domain) {
  for (const candidate of [domain, "www." + domain]) {
    const url = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(candidate)}&sz=${FAVICON_SIZE}`;
    try {
      const res = await fetchWithTimeout(url, { method: "HEAD", redirect: "follow" });
      if (res.ok) return url;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

async function fetchLogo(companyName) {
  const domain = await resolveDomain(companyName);
  if (!domain) return { url: null, domain: null };
  const url = await faviconUrlFor(domain);
  return { url, domain };
}

/**
 * @param {string} companyName
 * @returns {Promise<{url: string | null, domain: string | null}>}
 */
export async function getCompanyLogo(companyName) {
  const cacheKey = normalizeCacheKey(companyName);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.value;

  return singleFlight(`companyLogo:${cacheKey}`, async () => {
    const value = await fetchLogo(companyName);
    cache.set(cacheKey, { value, fetchedAt: Date.now() });
    return value;
  });
}

// Gemini's search grounding gives back a real, verified citation per source
// (see gemini.js's generateGroundedText comment) - but the `title` it
// returns is just the bare domain ("razorpay.com", "vizologi.com"), and the
// `uri` is a Google redirect link (vertexaisearch.cloud.google.com/...),
// not the final page. Displayed as-is, every source under one domain looks
// identical and reads like "the homepage" even when the underlying redirect
// actually deep-links to a specific article - confirmed by hand (curl -L)
// that these redirects DO land on real, specific pages, not homepages; the
// problem was purely the label giving no indication of that.
//
// This resolves each redirect ONCE, at generation time (not per page view -
// results are cached for weeks/months alongside the rest of the grounded
// content), to its final URL and a label built from that URL's own path, so
// the link a user sees and clicks is the actual article, not a repeated
// bare domain. Runs in parallel across all sources for one generation, and
// falls back to the original (already correct, just less legible) Google
// redirect link for any source that fails to resolve in time - never
// breaks a working link over a cosmetic upgrade.
const RESOLVE_TIMEOUT_MS = 6000;

function labelFromUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const segment = u.pathname.replace(/\/$/, "").split("/").filter(Boolean).pop();
    if (!segment) return host;
    const words = segment.replace(/\.(html?|php|aspx?)$/i, "").replace(/[-_]+/g, " ").trim();
    return words ? `${host} — ${words}` : host;
  } catch {
    return url;
  }
}

async function resolveOne(source) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RESOLVE_TIMEOUT_MS);
    const res = await fetch(source.uri, { method: "HEAD", redirect: "follow", signal: controller.signal });
    clearTimeout(timer);
    const finalUrl = res.url || source.uri;
    return { title: labelFromUrl(finalUrl), uri: finalUrl };
  } catch {
    return source;
  }
}

/**
 * @param {{title: string, uri: string}[]} sources
 * @returns {Promise<{title: string, uri: string}[]>}
 */
export async function resolveSources(sources) {
  if (!sources || !sources.length) return [];
  return Promise.all(sources.map(resolveOne));
}

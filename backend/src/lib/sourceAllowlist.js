// Phase 1.7 item 3: matches the grounding result's real resolved DOMAIN, not
// its `title` - Phase 1.5's title-matching missed genuinely trusted sources
// (the Phase 1.6 test matrix found real citations from xlri.ac.in,
// iimmumbai.ac.in, michaelpage.co.in etc. in every one of 10 sampled roles,
// but 0/10 ever matched TRUSTED, because grounding titles come back as bare
// domain names like "xlri.ac.in", never phrases like "XLRI Final Placement
// Report"). Domain matching also closes the insideiim.com false-positive
// risk a different way than Phase 1.5's "drop bare acronyms" fix did:
// insideiim.com's hostname is literally "insideiim.com", which an
// ends-with/equals match against "xlri.ac.in"-style full domains, or the
// iimXXX.ac.in pattern below, never matches - so the IIM pattern can safely
// use a prefix match again without reintroducing that bug.
export const TRUSTED_SALARY_SOURCE_DOMAINS = [
  "xlri.ac.in", "isb.edu", "fms.edu", "spjimr.org", "mdi.ac.in",
  "michaelpage.co.in", "randstad.in",
  "ambitionbox.com", "glassdoor.com", "glassdoor.co.in", "naukri.com", "levels.fyi"
];
// Every IIM's own domain is "iim<campus>.ac.in" (iima.ac.in, iimb.ac.in,
// iimcal.ac.in, iimidr.ac.in, iimu.ac.in, iimrohtak.ac.in, ... 20 campuses
// and counting) - matched as a pattern rather than hand-enumerated, since a
// hand-typed list of 20 campus subdomains risks silent transcription errors
// (and a wrong guess here just means a real trusted source gets missed, not
// a bad one let through - the pattern still can't match insideiim.com or
// similar news/forum sites, which aren't .ac.in domains at all).
const TRUSTED_IIM_PATTERN = /^iim[a-z0-9]*\.ac\.in$/i;

export const SUPPORTING_SOURCE_DOMAINS = [
  "igotanoffer.com", "wallstreetoasis.com", "efinancialcareers.com", "preplounge.com", "productmanagementexercises.com",
  "indeed.com", "indeed.co.in", "payscale.com"
];

// Content farms / generic Q&A sites - confirmed live in Phase 1 testing to
// show up in real grounding results for salary queries. Never shown as a
// source badge regardless of tier, even as "supporting".
const EXCLUDED_SOURCE_DOMAINS = ["quora.com", "reddit.com", "geeksforgeeks.org", "finalroundai.com"];

const HEAD_TIMEOUT_MS = 3000;
// In-memory only, not persisted - a grounding redirect URI's resolved
// domain never changes, so this just saves a repeat HEAD request for the
// lifetime of this process; a redeploy just means a few URIs get re-resolved
// once, not a correctness issue.
const domainCache = new Map();

function stripWww(hostname) {
  return hostname.replace(/^www\./i, "").toLowerCase();
}

/**
 * Resolves a grounding result's redirect URI to the real domain it actually
 * points to, via a HEAD request following redirects. Returns null if
 * resolution fails or times out (treated as an unmatched/unclassified
 * source, never a trusted one by default).
 * @param {string} uri
 * @returns {Promise<string|null>}
 */
export async function resolveSourceDomain(uri) {
  if (!uri) return null;
  if (domainCache.has(uri)) return domainCache.get(uri);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEAD_TIMEOUT_MS);
  try {
    const res = await fetch(uri, { method: "HEAD", redirect: "follow", signal: controller.signal });
    const domain = stripWww(new URL(res.url).hostname);
    domainCache.set(uri, domain);
    return domain;
  } catch (err) {
    console.warn(`[sourceAllowlist] domain resolution failed for a source URI: ${err.message}`);
    domainCache.set(uri, null);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function isTrustedDomain(domain) {
  if (!domain) return false;
  return TRUSTED_SALARY_SOURCE_DOMAINS.some(d => domain === d || domain.endsWith("." + d)) || TRUSTED_IIM_PATTERN.test(domain);
}
function isSupportingDomain(domain) {
  if (!domain) return false;
  return SUPPORTING_SOURCE_DOMAINS.some(d => domain === d || domain.endsWith("." + d));
}
function isExcludedDomain(domain) {
  if (!domain) return false;
  return EXCLUDED_SOURCE_DOMAINS.some(d => domain === d || domain.endsWith("." + d));
}

/**
 * Classifies and filters a raw grounding `sources` list by each source's
 * REAL resolved domain (resolved in parallel, bounded by HEAD_TIMEOUT_MS
 * each). Returns the sources actually safe to show (excluded ones dropped
 * entirely) plus whether at least one TRUSTED / SUPPORTING source backs the
 * content. A source whose domain fails to resolve is kept (still a real
 * citation) but counts toward neither tier.
 * @param {{title:string, uri:string}[]} sources
 */
export async function classifySources(sources) {
  const list = sources || [];
  const domains = await Promise.all(list.map(s => resolveSourceDomain(s.uri)));
  const kept = [];
  let hasTrusted = false;
  let hasSupporting = false;
  for (let i = 0; i < list.length; i++) {
    const domain = domains[i];
    if (isExcludedDomain(domain)) continue;
    kept.push(list[i]);
    if (isTrustedDomain(domain)) hasTrusted = true;
    else if (isSupportingDomain(domain)) hasSupporting = true;
  }
  return { sources: kept, hasTrusted, hasSupporting };
}

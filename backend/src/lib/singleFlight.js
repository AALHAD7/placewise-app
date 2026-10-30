// Every cache-backed AI generator in this codebase follows the same
// check-cache / miss / generate / upsert shape. That's fine for one request
// at a time, but with concurrent users it has a real race: if two requests
// for the exact same key (e.g. two users both picking "Product Manager"
// within the same few seconds, before either has a cached answer yet) both
// see a cache miss, BOTH independently call the LLM - a non-deterministic
// call - so they get two genuinely different answers, and whichever upsert
// finishes last silently overwrites the other in the cache. User A and user
// B, who made the identical selection, end up seeing different content.
// This is a hard requirement in this app: the same selection must always
// produce the same content for every user, no matter how many are
// concurrent.
//
// singleFlight fixes it by making concurrent requests for the same key
// share one in-flight generation instead of racing: the first caller starts
// the real work, every other caller for that same key gets the exact same
// promise (and therefore the exact same resolved value) instead of starting
// its own. Once it resolves, the entry is cleared so the next distinct
// request goes through the normal cache-check path - which now finds the
// row the winning call just wrote.
//
// This is in-process only (a plain Map, not a distributed lock), which is
// sufficient here because the backend runs as a single Node process
// (`node --watch src/server.js`, not clustered/load-balanced across
// multiple instances) - every request that could possibly race for the
// same key passes through this same Map.
const inFlight = new Map();

/**
 * @param {string} key - must uniquely identify the exact request (same
 *   shape as the cache row's key, e.g. `${normalizedRole}` or
 *   `${normalizedRole}::${normalizedCompany}`)
 * @param {() => Promise<T>} fn - the check-cache-then-maybe-generate work
 * @returns {Promise<T>}
 * @template T
 */
export function singleFlight(key, fn) {
  const existing = inFlight.get(key);
  if (existing) return existing;
  const promise = Promise.resolve().then(fn).finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

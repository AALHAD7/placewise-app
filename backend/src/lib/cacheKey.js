// Cache lookup keys (company/role/domain names) are free text the user
// typed or picked, and this app deliberately never restricts them to a
// fixed canonical list before caching (see role_overview_cache's own header
// comment) - so "Razorpay" / "razorpay" / "RAZORPAY " all mean the same
// company but, compared as exact strings, hit three different cache rows.
// Each row is independently researched via a live, non-deterministic LLM
// call, so those rows genuinely differ - this was reported live as "the
// business model answer is different each time I open it" for a company
// that actually had two rows ("HashedIn" and "hashedin") from casing drift
// across sessions.
//
// Every company/role/domain-keyed cache in this codebase normalizes its
// lookup key through this function before both reading and writing, so
// casing/whitespace drift can never fork one real-world entity into
// multiple cache rows. Only the DB key is normalized - the ORIGINAL typed
// casing is still what's shown to the user and sent into research prompts,
// so display text and generated content are unaffected.
export function normalizeCacheKey(name) {
  return String(name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

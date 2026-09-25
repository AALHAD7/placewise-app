import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// Keys aiLimiter/heavyAiLimiter on the authenticated Supabase user id instead
// of IP. Originally IP-based with a comment saying per-user "would effectively
// limit nothing" under a dev-only auth bypass - that bypass is gone, every
// request (including guest sessions, which are real anonymous Supabase Auth
// users) now carries a real user id. Confirmed live during QA testing this
// session: several guest sessions from one dev machine (one shared IP)
// exhausted the old IP-keyed 30-req/15min budget in minutes and started
// throwing "Could not reach the model" - the same thing would happen to any
// group of students on one campus/hostel IP during placement week, which is
// exactly the traffic pattern this app expects. Falls back to
// express-rate-limit's IPv6-safe ipKeyGenerator only if a request somehow has
// no req.user (shouldn't happen - every route using these limiters runs
// requireAuth/optionalAuth first, see each route file), so unauthenticated
// traffic still gets a real key instead of colliding into one bucket.
function userOrIpKey(req) {
  return req.user?.id || ipKeyGenerator(req.ip);
}

// Applied only to routes that call Gemini (generation, embeddings, or
// transcription) — those are the ones with a real per-request cost. Plain
// reads (frameworks list, companies, news) aren't limited here.
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  message: { error: "Too many requests to this AI-backed endpoint. Please wait a few minutes and try again." }
});

// Generation calls that produce a lot of output (30-question generation,
// mock interview start) are more expensive per-call — a tighter budget.
export const heavyAiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  message: { error: "Too many requests to this AI-backed endpoint. Please wait a few minutes and try again." }
});

// Applied globally (server.js) to every request, AI-backed or not — cheap
// first line of defense against scripted abuse/scraping hitting the plain
// read endpoints (frameworks, companies, news) that aiLimiter never covers.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a few minutes and try again." }
});

// Reserved for a real login/signup route built on Supabase Auth — tight
// budget is deliberate brute-force protection once that exists. Not used by
// the dev test-login bypass below (see devLoginLimiter) - reusing this here
// meant every hard refresh during local development (the token is only
// cached in memory, so a refresh always re-fetches) burned into a budget
// meant for real credential-guessing protection, and got exhausted almost
// immediately under normal dev traffic.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please wait a few minutes and try again." }
});

// Dev-only test-login bypass (blocked outright in production - see dev.js).
// No credentials are checked, so there's nothing to brute-force here; this
// budget just needs to survive normal local development traffic (every
// hard refresh of the frontend, plus manual API testing).
export const devLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many dev-login requests. Please wait a few minutes and try again." }
});

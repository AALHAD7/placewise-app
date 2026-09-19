import rateLimit from "express-rate-limit";

// Applied only to routes that call Gemini (generation, embeddings, or
// transcription) — those are the ones with a real per-request cost. Plain
// reads (frameworks list, companies, news) aren't limited here.
// IP-based rather than per-user: the only auth right now is a dev-only
// bypass shared by every tester, so a per-user key would effectively limit
// nothing. Revisit once real auth exists.
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests to this AI-backed endpoint. Please wait a few minutes and try again." }
});

// Generation calls that produce a lot of output (30-question generation,
// mock interview start) are more expensive per-call — a tighter budget.
export const heavyAiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
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

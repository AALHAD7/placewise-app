---
name: backend-conventions
description: Coding conventions for the PlaceWise Express backend (backend/src) — route shape, error responses, auth and admin middleware, rate limiting, cached AI generation with singleFlight and CONTENT_VERSION, Supabase migrations, Gemini calls and tests. Use when adding or changing any backend route, lib module, migration or test.
---

# Backend conventions

Node 22, Express 4, ES modules (`import`/`export`, `.js` extensions in imports).
Run: `npm run dev` (watch) · `npm test` (node:test, `backend/test/*.test.js`).

## Routes (`src/routes/<feature>.js`)
- One `Router()` per feature, mounted in `src/server.js` under `/api/<feature>`.
- Auth middleware from `src/middleware/auth.js` (`optionalAuth`, or the required variant).
  Admin routes use `src/middleware/admin.js`, which checks `ADMIN_EMAILS` against the real
  Supabase user, server side.
- Responses are always `{ success: true, ... }` or
  `{ success: false, error: "<user-safe message>", detail: errorDetail(err) }`.
  `errorDetail` (`src/lib/errors.js`) hides internals in production.
- Log failures as `console.error("[<feature>/<endpoint>]", err)`.
- Heavy or AI endpoints get a specific limiter from `src/middleware/rateLimit.js` on top of
  the global one.

## Logic (`src/lib/`)
- Routes stay thin; logic lives in `src/lib/<thing>.js`.
- **Cached AI generation** follows check cache → miss → generate → upsert, wrapped in
  `singleFlight` (`src/lib/singleFlight.js`) so the same selection always yields the same
  content for every user.
- A materially changed generation prompt means bumping `CONTENT_VERSION`
  (`src/lib/contentVersion.js`) so stale cache rows regenerate. Log it.
- All model calls go through `src/lib/gemini.js` (model cascade, quota fallback, call
  logging via `llmCallLog.js`). Never call the Gemini API directly from a route.
- Retrieval and answers follow the `grounded-answering` skill.

## Database
- Supabase client: `src/lib/supabase.js` (service role, server only).
- Schema changes are new files: `backend/db/migration_NNN_<what>.sql`, with the next free
  number. Never edit an applied migration. Use `create ... if not exists`, plus a header
  comment explaining why.
- New tables enable RLS. Admin- or ingestion-only tables get no anon/authenticated policies.
- If a migration can't be applied from here, say so and log it as an open issue.

## Tests
- Add tests for pure logic (policy decisions, parsing, cache keys) in `backend/test/`.
  Stub Supabase and Gemini rather than calling them.
- Done means `npm test` is green. Paste the summary line as proof.

## Security
- Secrets come from `backend/.env` only. Never log, return or commit them.
- Never return storage URLs or page images of casebooks to non-admin users.
- Any change to auth, admin, RLS, uploads (`multer`) or the sandbox (`pyodide`/`sandbox.js`)
  gets a `/cso` pass.

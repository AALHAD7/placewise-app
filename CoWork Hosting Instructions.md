# Deploy Instructions for Claude Cowork

As of September 20, 2026

## Overview

Supabase only hosts the database (`document_chunks`, the cache tables, the Storage bucket for images) and Auth — it does not run the Node/Express API. Two separate deployments are needed: the backend API first, then the frontend pointed at that API's URL.

**Known limitation:** there is no real login screen yet. Every authenticated route currently runs through a dev-only bypass (`/api/dev/test-login`), which the backend intentionally disables (returns 404) whenever `NODE_ENV=production`. Until a real login flow is built, treat this as a private/staging deploy to verify the setup works, not a public launch — Resume upload, Mock Interview, and Community submissions will return 401 for real visitors under `NODE_ENV=production` without that bypass. Build a real login screen (Supabase Auth supports this out of the box client-side) before inviting real users.

## Step 1 — Deploy the backend (Render)

Repo folder: `backend/` — Node/Express, entry point `src/server.js`.

1. Push the repo to GitHub if it isn't already (Render deploys from a Git connection).
2. On [render.com](https://render.com), create **New → Web Service**, connect the repo, set root directory to `backend`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Environment variables (values from `backend/.env.example` / the user's own `.env`, never commit real keys):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `GNEWS_API_KEY`
   - `NODE_ENV` = `production`
   - `FRONTEND_ORIGIN` — leave blank for now; set in Step 3 once the frontend URL is known
   - Do **not** set `ENABLE_DEV_LOGIN` — leaving it unset keeps the dev-login bypass off in production, which is intentional
6. Deploy and note the resulting URL, e.g. `https://<service-name>.onrender.com` — this is the backend's public API base.
7. Sanity check: `curl https://<service-name>.onrender.com/api/frameworks` should return JSON, not an error or HTML.

Database migrations do not need to be run again — all of them have already been applied directly in the Supabase SQL editor. The image storage bucket (`casebook-images`) is also created automatically by the ingestion script on first run, so no manual Storage setup is needed either.

## Step 2 — Deploy the frontend (Vercel)

Repo folder: `frontend-react/` — Vite + React 18 + TypeScript, builds to static files.

1. On [vercel.com](https://vercel.com), **New Project**, import the same repo, set root directory to `frontend-react`.
2. Framework preset: Vite (auto-detected).
3. Build command: `npm run build` (runs `tsc -b && vite build`)
4. Output directory: `dist`
5. Environment variable:
   - `VITE_API_BASE` = the backend URL from Step 1 (e.g. `https://<service-name>.onrender.com`)
6. Deploy and note the resulting URL, e.g. `https://<project-name>.vercel.app`.

## Step 3 — Connect the two, then verify

1. Back in Render, set the backend's `FRONTEND_ORIGIN` env var to the Vercel URL from Step 2 (comma-separated if there's more than one, e.g. a custom domain too). Redeploy the backend so CORS picks it up — without this step, the browser blocks every API call with a CORS error.
2. Open the Vercel URL and click through Home, Role, Company, and Skill pages — they should load without "Load failed" errors.
3. Expected known gap: Resume upload, Mock Interview, and Community submit will fail with 401 until a real login screen replaces the dev bypass — this is expected, not a deploy bug.
4. Once verified, treat this as a staging/private link. Do not share it as a public launch until real login exists.

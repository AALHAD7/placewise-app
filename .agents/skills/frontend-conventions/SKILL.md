---
name: frontend-conventions
description: Coding conventions for the PlaceWise React frontend (frontend-react/) — Vite + React 18 + TypeScript, routing, the API client, shared types, CSS design tokens, auth, diagrams and how to verify UI changes. Use when adding or changing any page, component, hook, style or frontend type.
---

# Frontend conventions

`frontend-react/` is the only frontend. The old `frontend/` is retired.
Run: `npm run dev` · `npm run build` (tsc + vite) · `npm run lint` (oxlint). Deployed on Vercel
(SPA rewrite in `vercel.json`).

## Structure
- Pages: `src/pages/<Name>Page.tsx`, one per route, registered in `src/router.tsx` inside
  `RequireAuth` + `AppShell` (only `/login` sits outside).
- Shared UI: `src/components/` (app chrome in `components/shell/`). Hooks: `src/hooks/use*.ts`.
  Helpers: `src/lib/`.
- Auth state: `src/contexts/AuthContext.tsx` (Supabase: email, Google or guest).

## Talking to the backend
- Only through `src/lib/apiClient.ts`. It attaches the Supabase token, uses `API_BASE`
  (`VITE_API_BASE`), and throws `ApiError` / `AuthUnavailableError`.
- Response and request types live in `src/types/api.ts`, each annotated with the backend route
  it mirrors. When a backend response shape changes, update this file in the same change.
- Every data view handles loading, empty, error and "not from the casebooks" states.

## Styling
- Plain CSS with design tokens on `:root` in `src/styles/global.css` (`--indigo`, `--text-*`,
  `--bg`, `--surface`, `--card-border`, …). Use tokens, never raw hex values in components.
- Page-specific styles go in `src/styles/<page>.css`. Hover effects go in `hover.css`.
- Theme handling: `src/hooks/useTheme.ts`. Check new UI in both themes.
- Smooth scrolling is Lenis site-wide. Don't add a second scroll library.

## Grounded content on screen
- Show citations (school, casebook, year, page) wherever casebook content appears.
- General answers carry the visible label from the `grounded-answering` skill.
- Diagrams render from `placewise-diagram` data (`diagram-transcription` skill). Unknown types
  fall back to the summary text, never a crash. Never show original page images to non-admins.

## Verifying a change
- `npm run build` and `npm run lint` must pass. Paste the output as proof.
- Visual or flow changes: run `/qa` (or the `qa-tester` agent) against the dev server with
  `/browse`, and attach screenshots. For visual polish, run `/design-review`.
- Check at phone width (≈375px) as well as desktop.

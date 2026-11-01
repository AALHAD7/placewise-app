# STATE

**Position:** ▶ R5 (backend-engineer, frontend-engineer: admin review queue). Updated 2026-11-02.
R4 done 2026-11-02: `backend/eval/run_eval.js` built and run against the live (flag-off)
behavior. Baseline: 0/39 (0%) pass. Two findings beyond the expected "mostly not live yet":
`document_chunks` actually has active Consulting rows under older `.txt`-named source files
(not just the inactive `.pdf` re-ingestion rows already found), and v1 citations can never
carry a page number (no page column exists in `document_chunks` at all). Full breakdown:
`backend/eval/results/2026-11-02-baseline.json`/`.md`, log.md's 2026-11-02 R4 entry.
R3 done 2026-11-01: Aalhad dropped `backend/eval/questions.jsonl` (39 questions, 29 covered /
10 not-covered) into `backend/eval/` — moved there from Downloads this session.
R2 done 2026-10-21 (owner: "Flagged = pass"; p56 "Leave to review"). Best version: v5 doc
`c1521f01-bcbf-4163-923d-dc501859dc31` (inactive, 248/386, 173 flagged); sample 39/40, raw faithful 21/40.
For R5: import per-page findings from `backend/ingestion/out/r2_*review*.json` and `r2_sweep_*.json` into the review queue.
For R6: add the R2.12 free fixes first (ragged tables, title-strip guard, inner-label check, titles in seq_diff).
R1 done 2026-10-20 (Aalhad: "R1 approved").
See `.gsd/ROADMAP.md` and the top entries of `log.md`.

## R6 re-ingestion progress (running in parallel with R3/R4)
Done: IIM Lucknow, ISB, SRCC, FMS 2021-22, IIM Kozhikode, IIM Bangalore, IIM Calcutta (all
`is_active=false`, needs_review rates traced in log.md). IIMA ingestion started 2026-11-01,
still running as of this entry. Left: FMS Consulting Club 2025-26 (~325p), FMS 2024-25 (~279p).

## Where R1 left things
- FMS 2023-24 stored three times, all inactive (0 active chunks): v1 `67371722…` 248/363,
  v2 `e6cdd69b…` 248/395, v3 `129a2604-0221-4ba2-af50-42ac641a21a0` 248/390 (the best one).
  `document_chunks` unchanged at 22457. Migration 040 applied.
- v3 needs_review: 110 pages. Review results: `backend/ingestion/out/r1_review_v3.json` (local).
- R1 Gemini spend ≈ $0.52. 223 offline ingestion tests pass.
- Verifier: `.gsd/phases/R1/VERIFICATION.md` (gaps closed by log entry 2026-10-20).

## R2 must start with (deferred from R1, see log.md 2026-10-20)
1. Structure sweep of the 55 unreviewed, unflagged v3 tree/flow pages (≈7 wrong parents
   expected; checker can't see them). Eyeball review or a second Gemini structure-check call.
2. `textnorm._LINK_RE` leaves ")" (p10, p224).
3. fallback_v1 pages skip link-strip (p69/p71 placeholder images; `(#[UNREADABLE])` on 56/67/77/127/203).
4. "Guesestimate Index" typo in markdown (88, 97, 98, 101, 106, 116).
5. Column stacks read as all-link-onward (p11); over-claiming summaries (p52, p14).
6. Blocks still inside tables (58, 59, 60, 70, 72, 73); visual pages with no block (1, 8, 12, 30, 43, 53, 75, 80, 84).

## Known gaps
- No eval test set yet (R3, Aalhad): 20–30 Consulting questions in `backend/eval/questions.jsonl`.
- No admin review queue (R5). Every diagram needs a human or structure check before R9 switch-over.
- Live document_chunks may share v1's off-by-one page_start bug; check during R7.
- Aalhad to rotate the Supabase DB password (fragment printed again 2026-10-21 by an agent's psycopg parse error). The password contains '@': parse DATABASE_URL with rpartition('@') and redact errors (see backend/scripts/apply_migration_041.py). Agents' sandbox cannot reach Postgres ports; migrations need Aalhad to run them (`! ...`) or the SQL editor.
- `backend/ingestion/run_pilot.py` is untracked.

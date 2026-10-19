# STATE

**Position:** ▶ R1 (M1 Consulting RAG), in progress, BLOCKED at the plan-08 smoke gate. Updated 2026-10-19.
See `.gsd/ROADMAP.md` and the top entries of `log.md` (R1.05 – R1.08).

## R1 so far
- Plans 01–06 done; gap plans 07–08 done; 09–10 not run. Plans live in `.gsd/phases/R1/`.
- Commits: 8bc6a39 (validator, prompt, chunking, migration 040), e76a7d5 (v2 re-pilot),
  48be752 (fidelity review), 98c79d2 (strict labels, structure checks, free repairs),
  e0c024d (prompt r1-diagrams-v2).
- Migration 040 applied to live DB 2026-10-19 (additive; versioned ingest_documents).
- FMS 2023-24 v2 stored, inactive: doc `e6cdd69b-75be-4050-b128-d34170adcb7d`, 248 pages /
  395 chunks. v1 (248/363) and document_chunks (22457) unchanged.
- Fidelity review (v2): matrix p20 and flow p10 pass; all 3 issue trees failed (structure).
- Prompt v2 smoke (p11/13/19/52/77): 13, 19, 52 pass; 11 fails (converging box moved out
  of the block; checker blind to it); 77 fails (estimated bar values; v1 fallback would cover).
- Gemini spend in R1: ~$0.39 (≈313 vision + 393 embedding calls).

## Next (one more targeted round, needs a go-ahead per /pipeline gap-loop limit)
1. Prompt rule + example: every box, incl. the one lines converge into, is a node in the block.
2. Cheap check: short text-layer line among diagram labels that appears in no block label.
3. Stronger "never estimate chart values" wording; tune convergence heuristic (false + on p13).
4. Re-smoke (≤10 calls), then plan 09 (v3 patch of 55 pages, cap 150) and plan 10 (fidelity +
   Aalhad spot-check).

## Known gaps
- No eval test set yet (R3, Aalhad).
- No admin review queue (R5).
- Live document_chunks may share v1's off-by-one page_start bug; check during R7.
- Aalhad to rotate the Supabase DB password (partially printed in session 2026-10-19).

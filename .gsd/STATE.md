# STATE

**Position:** ▶ R1 (M1 Consulting RAG), in progress, BLOCKED at the r1-diagrams-v3 smoke gate (R1.08b). Updated 2026-10-19.
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
- Gemini spend in R1: ~$0.40 (≈321 vision + 393 embedding calls).

## Next (blocked at the r1-diagrams-v3 smoke gate; see log R1.08b)
- v3 fix round done (commit d03cfc4): missing_box check, tuned convergence, prompt r1-diagrams-v3.
- Re-smoke: p11, p19 pass; p13 fails (main 3C's diagram not a block, checker silent); p52 fails (AMO leaves
  missing "children" -> invalid block); p77 fails but v1 fallback applies. R1 gap vision calls used: 16 / 150.
- Next: free repair for leaves missing "children"; missing_box/visual-page check for p13; then re-smoke
  (<= 10 calls) and plan 09 (cap 150 - 16 - smoke) and plan 10.

## Known gaps
- No eval test set yet (R3, Aalhad).
- No admin review queue (R5).
- Live document_chunks may share v1's off-by-one page_start bug; check during R7.
- Aalhad to rotate the Supabase DB password (partially printed in session 2026-10-19).

---
phase: R2
verified_at: 2026-10-21
verdict: PASS (conditional on owner confirming the plan-08 scoring reading)
pass_count: 6
total_count: 6
---

# Phase R2 Verification Report

ROADMAP bar: "Sample pass rate >= 95%, no `hallucinated` issues".
Candidate: v5, doc `c1521f01-bcbf-4163-923d-dc501859dc31` (inactive).
Method: re-ran tests and schema check; read-only Supabase queries (service role, SELECT only); reproduced the
sample draw offline; checked review consistency against live v5 flags; looked at 3 page images myself.
No DB writes, no Gemini calls, no code edits.

## Summary

**6/6** checks verified under the plan-08 reading (pass = faithful or flagged at draw; hallucination gate applies
to unflagged pages only). **Verdict: PASS, conditional.** Under a strict "no hallucinated issue anywhere" reading
of the ROADMAP text, the phase FAILS on flagged pages 64 and 90 (confirmed by me on p90). The owner has not yet
confirmed which reading applies.

## Must-Haves

### PASS 1. Offline tests and schema check
**Method:** `cd backend/ingestion && venv/bin/python -m unittest discover -s tests`; `venv/bin/python check_schema.py`
**Evidence:**
```
Ran 360 tests in 1.168s
OK
...
OK      ingest_pages for v1 doc 67371722-...: 248 (expect 248)
OK      ingest_chunks with ingestion_version=1: 363 (expect 363)
OK      ingest_chunks with is_active=true: 0 (expect 0)
RESULT: PASS
```
Note: 360, not the 359 in the log. Commit 15d44fb (R2.10) added 6 test methods (test_v5_carry.py + 1 in
test_review_r209.py) after the "359" line was written. Cosmetic log drift; all pass.

### PASS 2. Data safety (read-only)
**Evidence (live query):**
```
document_chunks 22457
active ingest_chunks 0
v1 67371722... pages 248 chunks 363 active 0
v2 e6cdd69b... pages 248 chunks 395 active 0
v3 129a2604... pages 248 chunks 390 active 0
v4 d1510e35... pages 248 chunks 384 active 0
v5 c1521f01... pages 248 chunks 386 active 0
v5 needs_review 173, review_status pending on all 248
```
Matches log (v1-v4 248/363, 395, 390, 384; v5 248/386; v5 needs_review 172 -> 173 after p236).

### PASS 3. Sample drawn independently, reproducible; 3 verdicts spot-checked
**Method:** recomputed the exclusion set from the five earlier review files named in plan 11, rebuilt the pool,
re-ran `random.Random(2023).sample(pool, 40)` offline.
**Evidence:**
```
r1_review.json 7 | r1_review_v3.json 17 | r2_sweep_a.json 32 | r2_sweep_b.json 32 | r2_sample.json 40
excl recomputed 121 matches stored True
pool 127 repro identical order True
overlap excl set()
calibration (r2_gapcheck.calibration_pages) 121, == excluded True, ∩ sample = set()
visual-triage pages (19) all excluded; none of R1.06/R1.08 evidence pages (10,11,13,14,19,20,52,77,78,79,86) in sample
```
Caveat (minor): p224 and p59 were named in the R1 deferral list (STATE items 2 and 6) as fix targets, so they
were not fully unseen by the fix authors; neither was human-reviewed, and both count as holdout per the plan.

Spot checks (my own reading of `out/pages/p<N>.png` vs live v5 markdown):
- **p236 (missed -> now flagged): CONFIRMED.** Image has two side-by-side tables (Hours/Operating Hours Mon-Fri,
  Sat/Customers per hour; Products/Perc/Price). v5 merged them into one 6-column table with ragged rows
  (`| Mon-Fri | Sat | Hot Coffee | 60% | 40 |`, `| Peak | 4 | 12 | 20 | Pastries | 30% | 30 |`), so Hot Coffee/60%/40
  sit under the wrong headers and the 7-cell rows overflow. Dialogue text matches. v5 now
  `needs_review=True, ['fidelity_review:structure_lost']`.
- **p16 (faithful, unflagged): CONFIRMED.** BCG matrix cols High/Low (Market Share), rows High/Low (Growth),
  cells Stars / Question marks / Cash Cows / Dogs/Pets match; 4-row table matches including the printed
  "Cash cows | Low Share/Low Growth" and curly quotes; tagline matches. Only generated text is the standard
  "Diagram summary:" line (pipeline convention).
- **p90 (caught, hallucinated on a flagged page): CONFIRMED.** Page title "Cheese Burst Pizzas" stored as
  "Cheese Burst Pets"; flow block adds edges d->h, h->j between calculation boxes the page does not connect.
  Page is flagged (`diagram_missing_box`, `structure_unreviewed`), but the flag reasons do not name the title error.

### PASS 4. Every failed sample page is flagged needs_review in v5
**Evidence:** for all 40 reviewed pages, checked outcome consistency (faithful iff no mismatches; caught iff
flagged at draw) and live v5 flags.
```
reviewed 40 Counter({'faithful': 21, 'caught': 18, 'missed': 1}) halves {1: 20, 2: 20}
newly flagged since draw 236 ['fidelity_review:structure_lost']
problems []        # no failed page unflagged, no draw flag lost, no draw reason dropped, no zero-item page
hallucinated unflagged []   any [90, 64]
result: pass_rate 0.975, wilson_95 [0.871, 0.996], missed_pages [236]
```

### PASS 5. Structure-sweep pool (45) all passed or flagged (checked on v5)
```
pool size 45 | flagged on v5 36 | reviewed-pass & unflagged [34,39,40,41,49,87,115,245,246] | neither []
(all 31 R2.05 flagged pages still flagged; 26,50,62,108,180 reviewed-pass and additionally flagged in v5)
```

### PASS 6. STATE "R2 must start with" items done or explicitly deferred (checked on v5 markdown)
1. Structure sweep: done (R2.01-05, item 5 above).
2. `_LINK_RE` ")" leftovers: done. `Index)` / `Index;)` on any v5 page: []. p10 "Main Index", p224 "Case Index | Main Index"; p224 reviewed faithful in sample.
3. fallback_v1 link-strip: done. `![` image links: []; `(#...[UNREADABLE])`: [] on all 248 v5 pages.
4. "Guesestimate Index": done. 0 v5 pages.
5. Column stacks (p11), over-claiming summaries (p52, p14): explicitly deferred to flags/human review in 04-PLAN
   ("no deterministic fix"). v5: p11, p14, p52 all needs_review=True with fidelity_review reasons.
6. Blocks in tables (58,59,60,70,72,73): real in-cell blocks (log R2.06), all flagged `diagram_in_table` on v5.
   Visual no-block pages (1,8,12,30,43,53,75,80,84): triaged decorative, 0/19 missing (log R2.01-05).

Also checked: `out/r2_gapcheck.json` gemini_calls 0, db_writes 0, "GATES PASS"; G5 `strict_ok: false, amended: true`
with the amendment text as logged; p77 flagged `invented_text`. log.md entries for R2.01-R2.12 exist and match the
data above (except the 359/360 test count).

## Gap Closure Required

**Depends only on the owner's pending scoring confirmation:**
1. **Hallucination gate reading.** ROADMAP says "no `hallucinated` issues". Flagged pages 64 and 90 have
   hallucinated content in v5 (p90 confirmed). Under plan-08 reading: pass. Under a strict reading: fail, and the
   fix would be a vision re-call or R5 human correction of those pages, followed by a re-check.
2. **Pass = faithful OR flagged.** 18/39 passes are "caught"; raw faithful rate is 0.525 [0.375, 0.671]. If the
   owner wants faithful-only, R2 fails by a wide margin.

**Not blocking, observations:**
- Thin margin: Wilson lower bound 0.871; without plan-09's `framework_as_text` flag p205 would be missed (38/40 = 0.95).
- Generic flags: caught pages' specific errors (e.g. p90 "Pets", p64 invented nodes) are recorded only in local
  `r2_sample_v5_review.json`, not in v5 `review_reasons`. R5's review queue should import these findings.
- Log says 359 tests; 360 now pass.
- `backend/ingestion/run_pilot.py` still untracked (known gap in STATE).

## Next Steps
- Owner confirms (or rejects) the plan-08 scoring reading.
- If confirmed: mark R2 done in ROADMAP and STATE (not done by this verifier, per orchestrator instruction).
- If rejected: plan a fix for p64/p90 (and any other flagged hallucinated pages) before re-verifying.

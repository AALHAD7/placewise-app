# STATE

**Position:** ▶ D1 (Product management). R9 is done (2026-11-11) — see `.gsd/ROADMAP.md`.

R9 closed out 2026-11-11: Aalhad pushed the 2 pending commits (`4fb1f79` footer/attribution
fix, `0ca4751` rollback-script fix) and ran the Frameworks cache-clear SQL himself (both were
correctly blocked for this session's own permissions — "Production Deploy" /
"Modify Shared Resources" — and needed his direct action, per the same pattern as the original
2026-11-07 switch-over). `qa-tester` then re-confirmed MECE/Market Entry/Market Sizing live,
post-deploy, post-cache-clear: no leak, real diagrams, clean console. All of R9's done-whens
are now met (no regressions, switch flipped, rollback tested). See log.md's 2026-11-11 "R9
closed" entry.

**Carried forward, not a D1 blocker:** 2 SRCC Guesstimates-book chunks were deactivated
sometime between 2026-11-07 and 2026-11-11 with no `log.md` entry; a 2026-11-11 rollback test
unintentionally reactivated them and their IDs aren't known, so they were not restored. If
Aalhad recalls doing this, the IDs should go into `switchConsultingLive.js`'s
`EXCLUDED_CHUNK_IDS` and be turned back off.

R9.4 done 2026-11-07: bumped `judgeParaphraseFaithful`'s vote count 3→5 (`faithfulMajority`
now needs ≥3/5, same simple-majority rule, just less noisy) in `consultingRetrieval.js`, to
fix the judge non-determinism R9.3 flagged (83%→58% faithfulness swing on identical code).
Ran `node backend/eval/run_eval_r9.js` 3 times back-to-back, no code changes between runs:
faithfulness landed at 90%/100%/91% all three times (vs. the old 25-point swing), and every
other bar (100% not-covered hard blocker, 74% overall, 86% must_include survival, 22/22
inactive-content gate) passed identically in all three. **R9's full eval gate now PASSES,
consistently** — results: `backend/eval/results/2026-11-07-r9-5vote-run{1,2,3}.{json,md}`,
log.md's 2026-11-07 R9.4 entry. `npm test`: 180/181 (1 pre-existing sandbox failure, unrelated).
Switch-over (plans 2-4) is cleared on eval evidence; still needs Aalhad's sign-off + a live QA
pass before `is_active` is flipped, per the roadmap step - not done in this task (eval-only,
no `is_active` changes made).
R9.3 done 2026-11-07: added a metric-type specificity rule (revenue vs. ridership/passenger
count) and a named-interview-sub-type specificity rule (stress interview vs. generic
interview advice) to `consultingRetrieval.js`'s `RELEVANCE_SYSTEM_PROMPT`, same pattern as
R9.2's firm-name rule — fixes q028 and q035. The not-covered hard blocker is now **10/10
(100%)**, met. Overall verdict is still **FAIL**: paraphrase faithfulness dropped to 7/12
(58%, needs ≥80%) on a fresh run, on 5 questions (q001, q005, q021, q027, q039) unrelated to
this session's change (that prompt was untouched) — looks like the same faithfulness-judge
run-to-run variance R9.2's log entry already flagged as unresolved, not a new regression, but
not investigated or fixed here (out of this task's scope). q004/q006/q009/q024/q026 confirmed
still failing, unchanged, also out of scope. A follow-up rag-engineer pass is needed on the
paraphrase-faithfulness variance and the 5 non-hard-blocker misses before switch-over can
proceed. Results: `backend/eval/results/2026-11-07-r9-fixed-v2.{json,md}` (also duplicated at
the non-"-v2" filename since the script has no label override and this day's R9.2 run was
overwritten — see log.md's 2026-11-07 R9.3 entry for the caveat), log.md's 2026-11-07 R9.3 entry.
R9.2 done 2026-11-07: fixed the eval-script pagination bug (`loadChunkPool` lacked
`.order("id")`), split dark-feature (role/company) questions out of the not-covered
hard-blocker bucket (still scored, just not a hard blocker), added a named-firm specificity
rule to `consultingRetrieval.js`'s `RELEVANCE_SYSTEM_PROMPT` (fixes q033), fixed 4
test-data mismatches in `questions.jsonl` (q013, q025, q021 UK/US normalization, q026
must_include-checking depth), and relabeled q039 to `covered:true` (reversible judgment
call, flagged in log.md). Re-run: 9 of the original 19 failures now fixed, but still
**FAIL** — the not-covered hard blocker is 8/10 (80%, needs 100%): q028 (Delhi Metro
revenue, a NEW miss exposed by the pagination fix — matched a passengers chunk, not
revenue) and q035 (stress interview, a pre-existing generic-content miss, same failure
class as q033 but about interview-type specificity, not firm name) still show a grounded
answer when none should appear. q004/q006/q009/q024/q026 also still fail (non-hard-blocker).
None of these remaining 6 were in this task's authorized fix list; a follow-up rag-engineer
pass is needed before switch-over can proceed. Results:
`backend/eval/results/2026-11-07-r9-fixed.{json,md}` (superseded by R9.3's run above), log.md's
2026-11-07 R9.2 entry.
Updated 2026-11-06. R8 done: FrameworksPage migrated onto the shared `PlacewiseDiagram`
component, a live diagram-privacy bug (raw admin Storage URL rendered via `<img>`) fixed,
`grounded_example`/`grounded_image` now actually render (previously fetched and dropped);
new `/qa` page built and wired to `POST /api/qa/ask` with `GroundingNote`'s "not from the
casebooks" label; Guesstimates' "not available" messaging differentiated by `reason`; a
High-severity markdown-rendering bug on `/qa` (raw `###`/`**` syntax shown) fixed with a
new `MiniMarkdown.tsx`, reused in the admin `ReviewQueue.tsx`. `npm run build`/`lint` pass.
Verified independently (`.gsd/phases/R8/VERIFICATION.md`): build/lint clean, no raw image
URL or per-answer citation anywhere live, markdown parser logic sound and confirmed live,
QA screenshots exist for all three touched pages (desktop+phone) — `/qa` from the
session's own pass, `/frameworks` and `/guesstimates` from the verifier's own spot-check
(session scratchpad path wasn't reachable). Two non-blocking items carried forward for
Aalhad, not R8 gaps: every seeded grid/funnel framework is still intercepted by the older
ASCII-diagram lookup before reaching the new shared renderer (code path is correct and
reachable, just visually unverified live for current seeded data); a Porter's Five Forces
Q&A question came back ungrounded despite being seeded (possible retrieval-tuning gap).
Aalhad's call 2026-11-02: verbatim casebook excerpts are not the right student-facing
presentation — "the idea or the logic should be the same, but it should be presented in a
different way." Inserted R7b ahead of R5 (admin queue, still todo) and R8. CLAUDE.md's
grounding policy and the `grounded-answering` skill were updated first with the pipeline
shape (paraphrase call → faithfulness judge → fail closed to verbatim).
R7b code done 2026-11-03: `consultingRetrieval.js` (paraphrase + 3-vote faithfulness judge,
in-memory cache, diagram-block protection), wired into Q&A (`qaRetrieval.js`) and Frameworks
(`frameworksGrounding.js`) only — not Guesstimates or Company/Role/Skill pages, deliberately,
so the flag can't touch those paths without further code. `ENABLE_ANSWER_PARAPHRASE` added,
off by default. 20 new tests, all mocked/pure (no live Gemini/DB calls). `npm test`:
144/147 pass (3 pre-existing failures, not from R7b — 1 sandbox, 2 `pickTopTextAndImage`, see
below).
R7b eval done 2026-11-03: live-API probe (`backend/eval/run_eval_paraphrase_preview.js`,
read-only, `is_active` untouched, flag never set) against the real 39-question set. Of 20
covered questions: paraphrase faithfulness 10/11 applicable pass (91%) — the 1 failure
(q039, PE due-diligence math) was the fail-closed design catching the model adding derived-
number commentary not in the source, exactly as intended (would have fallen back to the raw
excerpt live). `must_include` term survival after paraphrasing: 13/17 pass; the 4 "losses"
were manually traced to the raw chunk and confirmed **pre-existing retrieval/wording
mismatches, not caused by paraphrasing** (2 pure-diagram chunks never paraphrased at all, 1
US/UK spelling mismatch, 1 term never in the chunk to begin with). Results:
`backend/eval/results/2026-11-03-paraphrase-preview.{json,md}`. Sample is small (11
faithfulness judgments) — a first signal, not a final verdict. R7b marked done; roadmap
moved to R8.

**Found while building R7b, not caused by it — flag for Aalhad:** `pickTopTextAndImage` in
`frameworksGrounding.js` is uncommitted WIP (predates this session, part of the 2026-11-02
garbled-excerpt fix in progress) that now always returns `topText: null` — the v1
(document_chunks) text-grounding path is currently disabled, only images come through. Two
tests in `test/frameworksGrounding.test.js` fail because of this (`npm test`: 144 pass/3
fail — 1 is the pre-existing sandbox env-leak failure, these 2 are new). Confirmed via `git
show HEAD` that the committed version still returns a real `topText`; this is only in the
working tree. Not fixed as part of R7b — needs Aalhad's call on whether that WIP change was
intentional.
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

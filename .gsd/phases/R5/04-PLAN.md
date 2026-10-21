---
phase: R5
plan: 4
wave: 4
gap_closure: false
depends_on: ["3"]
agent: qa-tester
files_modified:
  - log.md
  - .gsd/STATE.md
paid_calls: 0
---

# Plan R5.4: QA the admin review flow, Aalhad approves a page, log

## Objective
Prove the R5 done-criterion in a real browser: "Aalhad can approve a flagged page from `/admin`". Test the flow
as an admin and as a non-admin, at desktop and phone width, then have Aalhad do one approval himself and log the phase.

## Context
Read first: `.gsd/phases/R5/01-PLAN.md`–`03-PLAN.md`, `.claude/skills/build-log/SKILL.md`,
`.claude/skills/gstack-playbook/SKILL.md` (use `/qa-only` with `/browse`; no `mcp__claude-in-chrome__*`).

Facts you need:
- Run backend (`cd backend && npm run dev`, port 4000) and frontend (`cd frontend-react && npm run dev`).
- Locally the dev-test user (`POST /api/dev/test-login`) is in `ADMIN_EMAILS`; to sign in as it in the browser,
  use the app's email sign-in with the dev-test credentials from `backend/src/routes/dev.js`.
- For the non-admin run, restart the backend with `ADMIN_EMAILS=nobody@example.invalid` (env override only;
  do not edit `.env`).
- QA writes: use only v1 doc `67371722-c752-473e-bf12-a3710707e56c` (superseded) for actions, and finish each with
  Reopen so every page you touched ends `pending`. Do not change any v5 page; the v5 approval is Aalhad's.

## Tasks

<task type="auto">
  <name>Browser QA as admin and non-admin (/qa-only)</name>
  <files>(none; screenshots in the agent scratchpad)</files>
  <action>
    Admin run, desktop and ~375px, light and dark theme:
    1. `/admin` shows Usage plus "Ingestion review"; v5 is preselected; pending count 173 (or the current number).
    2. Filter by reason `fidelity_review:hallucinated` → list shrinks to that count; open page 90: image loads, findings show
       the v5 sample "hallucinated" note, a diagram block draws.
    3. Open pages with an issue_tree (46), a chart (63), a table (236) and a matrix (16): each draws or falls back cleanly.
    4. Switch to v1: Mark wrong without a note → blocked; with a note → status wrong; Reopen → pending.
       Edit → break the JSON in a fence → server error shown; fix → Save and approve → status fixed, history shows
       the edit; Reopen → pending. Keyboard next/prev works.
    5. DevTools/network: no request or response contains `casebook-source`, `image_path` or a supabase storage URL;
       the image response has `Cache-Control: private, no-store`. Console has no errors.
    Non-admin run: `/admin` shows the plain 404; `GET /api/admin/review/documents` and an image URL return 404.
    Report bugs by severity; fix nothing (hand fixes back to backend-/frontend-engineer, then re-run).
  </action>
  <verify>
    cd backend/ingestion && venv/bin/python -c "
import psycopg; from dotenv import dotenv_values
c=psycopg.connect(dotenv_values('../.env')['DATABASE_URL'])
print(c.execute(\"select d.ingestion_version, p.review_status, count(*) from ingest_pages p join ingest_documents d on d.id=p.document_id group by 1,2 order by 1,2\").fetchall())
print('history', c.execute('select action, count(*) from ingest_page_reviews group by 1').fetchall())"
  </verify>
  <done>
    QA report lists every step above as pass, with screenshots (desktop + 375px, both themes), and zero high-severity
    bugs open. Every version still shows only `pending` statuses (QA reopened its v1 test pages). Non-admin 404s shown.
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Aalhad approves one flagged v5 page from /admin</name>
  <action>
    Ask Aalhad to open `/admin` → Ingestion review (v5), pick any flagged page he has checked against the image, and press
    Approve (or Edit and approve). Then run the verify query of task 1 and show the history row with his email.
  </action>
  <done>One v5 page has review_status approved or fixed and a matching ingest_page_reviews row by Aalhad's email.</done>
</task>

<task type="auto">
  <name>log.md entry and STATE note</name>
  <files>log.md, .gsd/STATE.md</files>
  <action>
    Write a log.md entry (build-log skill format): migration 041 (tables, RPC, append-only trigger, rollback), findings
    imported (exact row counts per file), new admin endpoints + section, image-proxy decision, QA result with screenshots
    referenced, Aalhad's approval, Gemini cost 0, Undo (remove the `/api/admin/review` mount line and the section import
    to hide the feature; the migration rollback is in the file; review rows never alter page content).
    Note for R6/R7: chunking must use the latest `edit_approve` markdown from `ingest_page_reviews` when present, and
    should skip or hold `wrong` pages. In STATE.md add one line under Known gaps with the same note.
    Do not move ▶ or mark R5 done; the verifier does that.
  </action>
  <verify>head -40 log.md | grep -n "R5" && grep -n "R5\|edit_approve" .gsd/STATE.md</verify>
  <done>Log entry and STATE line present.</done>
</task>

## Must-Haves
- [ ] Aalhad approved a flagged page from `/admin` (history row proves it).
- [ ] Non-admins cannot reach the queue, the data or the images.
- [ ] No student-facing change; QA left no stray test statuses.

## Success Criteria
- [ ] QA report pass; log entry written; ready for `verifier`.

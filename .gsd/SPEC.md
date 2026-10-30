# SPEC — Phase R: Backend RAG rebuild

Status: FINALIZED (2026-10-19). Decisions agreed with Aalhad in a Q&A session.

## Problem
Casebook PDFs explain concepts with issue trees, frameworks, charts and tables. Text-only
extraction dropped or flattened them, so students saw content that didn't match the source.

## Goal
Every grounded answer on PlaceWise faithfully reflects the casebook pages it cites,
diagrams included.

## Decisions
| Topic | Decision |
|---|---|
| Scope | Backend RAG first; frontend later |
| Workflow | GSD merged with Claude-native CLAUDE.md, agents and skills |
| Diagrams | Rebuilt as structured data the frontend draws, plus the explanation; originals admin-only |
| Quality | Automatic fidelity checks on every page; failing pages go to a review queue Aalhad approves |
| AI provider | Gemini (existing cascade + gemini-embedding-001, 768-d) |
| Budget | ~$20/month |
| Grounded features | M1: Frameworks, guesstimates, Q&A (Consulting). Later: PM and every other feature, with labelled AI generation where casebooks don't cover it |
| Order | Consulting first, then PM, Finance, Marketing/Sales, HR, GM (see ROADMAP) |
| Deadline | Trustworthy Consulting content within 2–4 weeks of 2026-10-19; site already live for Aalhad's batch |
| Not covered | Say so, then give a clearly labelled general answer |
| Sources | `club_casebook` only |
| Approvals | None required; every big change logged in `log.md` |
| Explanations | Plain-language summaries after each step |
| Accuracy proof | Test question set written by Aalhad |

## Requirements
1. Every page is classified and converted; visual pages produce valid `placewise-diagram` blocks.
2. Fidelity metrics are stored per page; failures are flagged `needs_review`.
3. An admin can list flagged pages and approve or fix them.
4. Chunks carry document, page range, section, content type and domain; embeddings are 768-d.
5. Grounded features follow the `grounded-answering` policy, with citations.
6. The eval runner scores the test set; no regressions are allowed before switch-over.
7. The old `document_chunks` keep working until switch-over; nothing is deleted.

## Open items
- Aalhad to write `backend/eval/questions.jsonl` (20–30 real questions).

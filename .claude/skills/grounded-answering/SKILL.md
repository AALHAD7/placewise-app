---
name: grounded-answering
description: PlaceWise's grounding policy for any student-facing answer built from the casebook RAG — retrieval thresholds, casebook-only answers, citations, and the clearly-labelled general-knowledge fallback. Use when writing or changing retrieval code, match_* RPCs, answer prompts, or features like Frameworks, Guesstimates, PM content and Q&A.
---

# Grounded answering

## The policy
1. **Retrieve** club-casebook chunks for the question (filtered by domain when known).
2. **Covered** (at least one chunk above threshold that actually addresses the question) →
   answer **only** from those chunks. No outside facts, numbers or frameworks.
3. **Not covered** → say so plainly ("The casebooks don't cover this"), then give a general
   answer under a visible label such as `General guidance — not from the casebooks`.
4. **Never blend silently.** If an answer mixes both, each part is labelled.

## Citations
- Every grounded claim cites its chunk: school, casebook title, year, page(s).
- Citations come from chunk metadata, never from the model's memory.
- Never expose storage URLs, page images or PDFs to non-admin users.

## Retrieval
- RPC: `match_document_chunks` today. When the new pipeline goes live, query
  `ingest_chunks` where `is_active = true`.
- Filter `source_class = club_casebook`.
- Thresholds: text 0.5 (the existing `frameworksGrounding.js` value); images/diagrams higher.
  Tune them only with eval evidence (`rag-eval` skill) and log the change.
- Below threshold → show nothing, rather than a misleading near-miss.
- Keep diagram blocks intact when passing chunks to the model and to the frontend.

## Prompting
- The system prompt states the policy above and puts the retrieved chunks in clearly
  delimited blocks with their citation IDs.
- Tell the model: answer from the chunks only, cite chunk IDs, and output the "not covered"
  marker if the chunks don't answer the question.
- The server decides "covered vs not" from both the scores and the model's marker. It never
  trusts the model alone to declare coverage.
- Model calls go through `backend/src/lib/gemini.js` (cascade + call logging).

## Per-feature notes
- **Frameworks page:** explanation, when/when-not to use, pitfalls, and the diagram
  (`diagram-transcription` block) all come from casebook chunks for that domain/subdomain.
  If no casebook covers a framework, mark it as general content.
- **Guesstimates:** the problem, the approach structure and the numbers come from the
  casebook. Don't invent assumptions the casebook didn't make.
- **Product management:** same policy, filtered to the Prodman domain.
- **Q&A:** the full policy above.

---
name: grounded-answering
description: PlaceWise's grounding policy for any student-facing answer built from the casebook RAG — retrieval thresholds, casebook-only answers, citations, and the clearly-labelled general-knowledge fallback. Use when writing or changing retrieval code, match_* RPCs, answer prompts, or features like Frameworks, Guesstimates, PM content and Q&A.
---

# Grounded answering

## The policy
1. **Retrieve** club-casebook chunks for the question (filtered by domain when known).
2. **Covered** (at least one chunk above threshold that actually addresses the question,
   confirmed by the relevance judge) → **paraphrase** those chunks (see below). No outside
   facts, numbers or frameworks — the chunk(s) are the only source of content, verbatim
   excerpt or not.
3. **Not covered** → say so plainly ("The casebooks don't cover this"), then give a general
   answer under a visible label such as `General guidance — not from the casebooks`.
4. **Never blend silently.** If an answer mixes both, each part is labelled.

## The paraphrase layer (added 2026-11-02)
Showing the retrieved chunk verbatim is **not** the policy — it reads like a dump of the PDF,
not a tool that teaches. Every covered answer goes through one more step before it reaches
the frontend:

1. **Paraphrase call.** Prompt Gemini with the relevant chunk(s) (and, for diagrams, the
   structured `placewise-diagram` block kept intact — never flattened to prose) and instruct
   it explicitly: re-explain in clearer, more natural language; you may reorder, simplify
   sentence structure, and add connective/explanatory phrasing, but you must not introduce
   any claim, number, name, step or example that is not already in the source chunk(s). Cite
   nothing — citations are metadata, not model output (unchanged).
2. **Faithfulness judge.** A second Gemini call (same pattern as `judgeRelevance` in
   `consultingRetrieval.js` — cheap tier, a few deterministic votes) compares the paraphrase
   against the original chunk(s) and verdicts `faithful` / `unfaithful`: does the paraphrase
   contain anything the source didn't say, or does it drop/alter a number, name or step. This
   is a different question than the existing relevance judge (relevance asks "does this
   chunk answer the question"; this asks "does the rewrite still say only what the chunk
   said") — keep them as separate calls, don't conflate.
3. **Fail closed.** If the faithfulness check fails (or the paraphrase call errors), fall
   back to showing the raw verbatim excerpt for that answer rather than a possibly-distorted
   rewrite. A verbatim fallback is always safe; a failed paraphrase silently shown is not.
4. **Reversible.** Gate the whole paraphrase step behind a flag (reuse the existing
   `ENABLE_CONSULTING_RAG_V2`-style on/off pattern, or a new flag if the feature predates
   that one for a given surface) so turning it off restores raw-excerpt behavior in one
   step, per AGENTS.md's "every switch-over must be reversible" rule.
5. **Cache the result**, not just the retrieval — same `singleFlight`/`CONTENT_VERSION`
   pattern as the rest of the backend (`backend-conventions` skill), keyed so a prompt change
   invalidates old paraphrases rather than serving them forever (see the `isStale`/cache-TTL
   bug fixed 2026-11-02 for why an unbounded cache is dangerous here).
6. **Log the prompt.** Any change to the paraphrase prompt is a prompt change — `build-log`
   skill applies, and `rag-eval` should re-run before it goes live, since a paraphrase is a
   new place hallucination could sneak in that didn't exist when excerpts were verbatim.

## Citations
- Every grounded claim is still backed by its chunk's metadata (school, casebook title,
  year, page(s)) and the API still returns it — but the frontend does **not** render a
  per-answer source line to students (removed 2026-11-02, Aalhad's call: the site already
  states globally that answers are grounded, so repeating "This is from the IIMK casebook"
  on every answer was redundant). See `GroundingNote.tsx`.
- The one disclosure that stays per-answer, always, is the opposite case: when something is
  **not** covered, the general-guidance label above must still show. That's the one blend
  the policy forbids outright — silently passing off general AI content as casebook content.
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

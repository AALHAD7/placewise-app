import { groundedConsultingLookup, AI_FALLBACK_LABEL } from "./consultingRetrieval.js";

// The one casebook this feature is grounded in - ingested (R6, commit c516be7) but not
// yet switched live (is_active=false on every ingest_chunks row until R9). Scoping to
// this exact source_file (via migration_044's filter_source_file) is what keeps a
// "guesstimate" request from pulling in FMS/ISB case-interview material instead.
export const GUESSTIMATES_SOURCE_FILE = "SRCC Guesstimates-Book-Volume-1-6.pdf";

// Broad enough to surface a real problem statement from the book without biasing toward
// any one topic - a specific topic query goes through groundedGuesstimateLookup instead.
const RANDOM_PROMPT_QUERY =
  "guesstimate practice problem estimate market size number of units volume";

/**
 * Grounded lookup for a specific guesstimate topic/question, scoped to the Guesstimates
 * book only. Same covered/not-covered shape as groundedConsultingLookup - never blends a
 * casebook excerpt with a general answer (grounding policy, CLAUDE.md).
 */
export async function groundedGuesstimateLookup(queryText, { matchCount = 8 } = {}) {
  return groundedConsultingLookup(queryText, {
    domain: "Consulting",
    matchCount,
    sourceFile: GUESSTIMATES_SOURCE_FILE
  });
}

/**
 * Pure: picks one covering row at random rather than always the top match, so repeated
 * requests surface different practice problems instead of the same one every time.
 * Exported separately from the I/O so this choice is unit-testable without a network call.
 */
export function pickRandomCoveringChunk(result, rng = Math.random) {
  if (!result.covered || !result.chunks.length) return null;
  const idx = Math.floor(rng() * result.chunks.length);
  return { chunk: result.chunks[idx], citation: result.citations[idx] };
}

/**
 * Pure: does this chunk look like an actual worked guesstimate problem (a title plus
 * stated assumptions), not front matter (title page, table of contents, acknowledgements,
 * theory/methodology, cheatsheet)? Found 2026-11-02: the random-pick path showed SRCC's own
 * index page as if it were a problem - the index is genuinely *about* guesstimates (it
 * names dozens of real problem titles), so it cleared both the similarity threshold and the
 * relevance judge for the broad "give me a guesstimate" query. That's a different failure
 * mode than "wrong topic" (which the judge already catches) - this is "right topic, wrong
 * kind of page," and nothing was checking for it.
 *
 * Every real problem in this book states its assumptions explicitly (confirmed across every
 * problem page read this session - Swiggy orders, toll plaza, credit cards, tyre industry,
 * etc. all have an "ASSUMPTIONS" section); front matter never does. This is cheap,
 * deterministic, and runs with no extra API call - checked before a candidate is even
 * eligible to be picked. It also generalizes past this one casebook: stating assumptions is
 * fundamental to how a guesstimate write-up works, not an SRCC-specific quirk.
 */
export function looksLikeWorkedProblem(content) {
  return /assumptions/i.test(content || "");
}

/**
 * Full "give me a guesstimate to practice" lookup. Distinct from the grounding policy's
 * usual "not covered -> labelled general answer" path: a miss here means "the casebook
 * isn't live yet" (an R9 gating condition - is_active is still false everywhere), not
 * "the casebooks don't cover guesstimates" (they do, entirely). Returning the general
 * AI_FALLBACK_LABEL in that case would misrepresent why nothing came back, so this
 * reports `available: false` instead and leaves the labelled-fallback wording for actual
 * topic queries once the switch is on.
 */
export async function getRandomGuesstimateProblem() {
  const result = await groundedGuesstimateLookup(RANDOM_PROMPT_QUERY, { matchCount: 10 });
  if (!result.covered) {
    return { available: false, reason: "not_yet_live", label: AI_FALLBACK_LABEL };
  }
  // Only front-matter-filtered candidates are eligible to be picked - see
  // looksLikeWorkedProblem's comment for why (2026-11-02 incident).
  const worked = result.chunks
    .map((chunk, i) => ({ chunk, citation: result.citations[i] }))
    .filter(({ chunk }) => looksLikeWorkedProblem(chunk.content));
  const picked = pickRandomCoveringChunk({
    covered: worked.length > 0,
    chunks: worked.map(w => w.chunk),
    citations: worked.map(w => w.citation)
  });
  if (!picked) return { available: false, reason: "not_yet_live", label: AI_FALLBACK_LABEL };

  return {
    available: true,
    problem: picked.chunk.content,
    hasDiagram: picked.chunk.hasDiagram,
    citation: picked.citation
  };
}

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
  const picked = pickRandomCoveringChunk(result);
  if (!picked) return { available: false, reason: "not_yet_live", label: AI_FALLBACK_LABEL };

  return {
    available: true,
    problem: picked.chunk.content,
    hasDiagram: picked.chunk.hasDiagram,
    citation: picked.citation
  };
}

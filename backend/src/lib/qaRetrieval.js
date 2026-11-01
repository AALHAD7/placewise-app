import { generateText } from "./gemini.js";
import { groundedConsultingLookup, AI_FALLBACK_LABEL } from "./consultingRetrieval.js";

// R7's last unbuilt piece ("Frameworks, Guesstimates, Q&A" - Frameworks and Guesstimates
// were already done; this is Q&A). Unlike Frameworks (built from seeded framework rows)
// and Guesstimates (scoped to one source file), free-form Q&A has no pre-existing row or
// scope to anchor on - a student can ask literally anything, so the question text itself
// is the only signal retrieval has to work with.

const GROUNDED_SYSTEM =
  "You are an interview-prep assistant for Indian B-school placements. Answer the " +
  "student's question using ONLY the casebook excerpt(s) given below - never add an " +
  "outside fact, number or framework that isn't in them. If the excerpts only partially " +
  "answer the question, answer only the part they cover and say so.";

const UNGROUNDED_SYSTEM =
  "You are an interview-prep assistant for Indian B-school placements. The casebooks " +
  "don't cover this question, so answer from general knowledge. Keep it concise and " +
  "practical, like a senior would explain it.";

/**
 * Pure: builds the prompt handed to the model once coverage is already decided elsewhere
 * (groundedConsultingLookup, not the model, decides covered/not-covered - the grounding
 * policy's "never trust the model alone to declare coverage" rule). Split out so the
 * exact shape of what the model sees is testable without a network call.
 */
export function buildGroundedQaPrompt(question, excerpts) {
  if (!excerpts || excerpts.length === 0) return question;
  const joined = excerpts.map((e, i) => `Excerpt ${i + 1}:\n${e}`).join("\n\n");
  return `${joined}\n\nQuestion: ${question}`;
}

/**
 * Full Q&A answer for one free-form question: retrieve, decide coverage (via
 * groundedConsultingLookup, which already applies the similarity threshold and the
 * relevance gate), then generate either a casebook-only answer or a clearly-labelled
 * general one - never blended (grounding policy, CLAUDE.md). Citations are still
 * returned (API shape matches Frameworks/Guesstimates) but the frontend doesn't render
 * them to students (2026-11-02 decision - see GroundingNote.tsx).
 */
export async function groundedQaAnswer(question) {
  const result = await groundedConsultingLookup(question, { domain: "Consulting", matchCount: 6 });

  if (!result.covered) {
    const answer = await generateText({
      system: UNGROUNDED_SYSTEM,
      prompt: question,
      maxTokens: 700,
      feature: "qa-ungrounded"
    });
    return { groundedInCasebooks: false, label: AI_FALLBACK_LABEL, answer, citations: [] };
  }

  const excerpts = result.chunks.map(c => c.content);
  const answer = await generateText({
    system: GROUNDED_SYSTEM,
    prompt: buildGroundedQaPrompt(question, excerpts),
    maxTokens: 700,
    feature: "qa-grounded"
  });
  return { groundedInCasebooks: true, label: null, answer, citations: result.citations };
}

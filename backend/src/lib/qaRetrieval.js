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
  // paraphrase: true opts in to the paraphrase layer (grounded-answering skill) - a
  // no-op unless ENABLE_ANSWER_PARAPHRASE is also on, in which case each chunk's
  // `.content` below is the rewrite (verified faithful) rather than the verbatim excerpt.
  //
  // domain: null + sourceClasses covering both club_casebook and placewise_reference
  // (FIN1.04): a free-form question can be about any domain the casebooks/compendium
  // cover, so Q&A (and only Q&A - Frameworks and Guesstimates keep their domain/
  // source-file scoping) drops the domain filter and searches both source classes.
  // This relies on the similarity threshold plus the existing 3-vote relevance judge
  // (RELEVANCE_SYSTEM_PROMPT's explicit "same-category vocabulary isn't enough" rule) to
  // reject a Consulting question matching a Finance chunk, or vice versa, rather than
  // adding a second Gemini call to classify the question's domain first - not yet
  // justified by evidence (no eval has shown the relevance judge failing this way;
  // FIN1.05's eval is the first real signal on this specific risk). This is a one-line,
  // fully reversible change (revert this options object) if that eval shows leakage.
  const result = await groundedConsultingLookup(question, {
    domain: null,
    matchCount: 6,
    paraphrase: true,
    sourceClasses: ["club_casebook", "placewise_reference"]
  });

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

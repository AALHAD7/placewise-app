import { generateText } from "./gemini.js";
import { groundedConsultingLookup, AI_FALLBACK_LABEL, protectDiagramBlocks } from "./consultingRetrieval.js";

// R7's last unbuilt piece ("Frameworks, Guesstimates, Q&A" - Frameworks and Guesstimates
// were already done; this is Q&A). Unlike Frameworks (built from seeded framework rows)
// and Guesstimates (scoped to one source file), free-form Q&A has no pre-existing row or
// scope to anchor on - a student can ask literally anything, so the question text itself
// is the only signal retrieval has to work with.

const GROUNDED_SYSTEM =
  "You are an interview-prep assistant for Indian B-school placements. Answer the " +
  "student's question using ONLY the casebook excerpt(s) given below - never add an " +
  "outside fact, number or framework that isn't in them. If the excerpts only partially " +
  "answer the question, answer only the part they cover and say so.\n\n" +
  "An excerpt may contain a placeholder token of the exact form " +
  "[[PLACEWISE_DIAGRAM_BLOCK_N]] (N is a number) standing in for a diagram that was in the " +
  "source page. Treat that token only as a signal that a real diagram exists and will be " +
  "rendered separately, directly below your answer, after you finish writing - never " +
  "describe, list, redraw, or guess the diagram's structure, boxes or arrows yourself, and " +
  "never repeat the token in your answer. Just answer the question in prose, and if it " +
  "reads naturally you may add a short pointer like \"see the diagram below\" - otherwise " +
  "say nothing about the token at all.";

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

// Matches a ```placewise-diagram fence together with its own "Diagram summary:" line,
// which ingestion (backend/ingestion/convert.py) always writes immediately after the
// closing fence - so this one match is the whole self-contained, already-fact-checked
// unit the frontend's MarkdownWithDiagrams/splitMarkdownBlocks (placewiseBlocks.ts) knows
// how to render: the fence becomes the diagram component, the summary line right after it
// renders as plain explanatory text. Not global (only the first match in a chunk is ever
// needed here - see findDiagramForAnswer below).
const DIAGRAM_FENCE_WITH_SUMMARY_RE =
  /```[ \t]*placewise-diagram[ \t]*\n[\s\S]*?\n```[ \t]*\r?\n[ \t]*Diagram summary:[^\n]*/;

/**
 * Pure: pulls the first diagram fence + its summary line out of raw chunk content, or
 * null if it has none. Exported for testing.
 */
export function extractDiagramWithSummary(content) {
  const match = String(content || "").match(DIAGRAM_FENCE_WITH_SUMMARY_RE);
  return match ? match[0] : null;
}

/**
 * Pure: picks which single diagram (if any) to attach to the final answer. Rule: the
 * first diagram found among the covering chunks, in the order groundedConsultingLookup
 * already returned them (most-relevant first) - deliberately simple, and deliberately
 * at most one diagram per answer, so a multi-chunk answer never gets cluttered with
 * several diagrams for one question (per Aalhad's "don't over-engineer this" steer).
 * Reads each chunk's `rawContent` when present (the paraphrase layer's untouched
 * original - see consultingRetrieval.js) and falls back to `content` otherwise (every
 * non-paraphrased chunk, and every chunk when paraphrasing is off) - either way the
 * diagram fence inside is byte-identical to the source chunk, never model-touched.
 */
export function findDiagramForAnswer(chunks) {
  for (const chunk of chunks || []) {
    const diagram = extractDiagramWithSummary(chunk.rawContent || chunk.content);
    if (diagram) return diagram;
  }
  return null;
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

  // Diagram fences are stripped to a short placeholder token before the excerpt ever
  // reaches the answer-generation prompt - same "never let the LLM touch the diagram"
  // posture as the paraphrase layer's protectDiagramBlocks (consultingRetrieval.js). The
  // model never sees the diagram's structured JSON, so it can't paraphrase, mis-describe,
  // or hallucinate against it; GROUNDED_SYSTEM above tells it what the token means.
  const excerpts = result.chunks.map(c => protectDiagramBlocks(c.content).placeheld);
  const answer = await generateText({
    system: GROUNDED_SYSTEM,
    prompt: buildGroundedQaPrompt(question, excerpts),
    maxTokens: 700,
    feature: "qa-grounded"
  });

  // The real diagram (fence + its ingestion-time, already-fact-checked summary line) is
  // appended verbatim from the actual underlying chunk, never regenerated or described by
  // the model above - see findDiagramForAnswer. A no-op (finalAnswer === answer) for any
  // question whose covering chunks have no diagram, which is most questions.
  const diagram = findDiagramForAnswer(result.chunks);
  const finalAnswer = diagram ? `${answer.trim()}\n\n${diagram}` : answer;
  return { groundedInCasebooks: true, label: null, answer: finalAnswer, citations: result.citations };
}

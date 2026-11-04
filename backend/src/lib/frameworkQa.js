// Grounded free-form Q&A scoped to one framework (the "ask a follow-up" box on the
// Frameworks page). Unlike qaRetrieval.js (which searches the whole casebook corpus for an
// arbitrary question), the grounding source here is simpler and more reliable: the
// framework's own already-verified row (description/example/steps/pitfalls/when_to_use/
// when_not_to_use) - the exact same content already shown on the page and already fact-
// checked when the framework was written/regenerated. No new retrieval, no new facts - this
// only re-explains what's already there, the same "paraphrase, never invent" contract as the
// R7b paraphrase layer (grounded-answering skill), reusing its faithfulness judge directly.

import { generateText } from "./gemini.js";
import { judgeParaphraseFaithful } from "./consultingRetrieval.js";

const GROUNDED_SYSTEM =
  "You are answering one MBA student's follow-up question about a framework they're reading " +
  "about on a Frameworks page. Answer using ONLY the framework content given below - never " +
  "add an outside fact, number, step or example that isn't already in it. If the question " +
  "asks about something the given content doesn't cover, say plainly that the framework page " +
  "doesn't cover that rather than guessing. Keep the answer under 120 words, direct and " +
  "concrete - like a senior explaining it in person, not restating the page verbatim.";

const RETRY_SUFFIX =
  "\n\nYour previous answer added something not present in the framework content above - " +
  "stay strictly limited to what's given, even if that means a shorter or more general answer.";

export function buildFrameworkContext(fw) {
  const parts = [
    `Framework: ${fw.name}`,
    fw.description ? `Description: ${fw.description}` : null,
    fw.example ? `Example: ${fw.example}` : null,
    fw.steps?.length ? `Steps:\n${fw.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}` : null,
    fw.pitfalls?.length ? `Pitfalls:\n${fw.pitfalls.map(p => `- ${p}`).join("\n")}` : null,
    fw.when_to_use ? `When to use it: ${fw.when_to_use}` : null,
    fw.when_not_to_use ? `When not to use it: ${fw.when_not_to_use}` : null
  ].filter(Boolean);
  return parts.join("\n\n");
}

// Fail-closed fallback when the generated answer doesn't pass the faithfulness judge (or the
// call itself errors): never show an unverified rewrite, fall back to the framework's own
// already-verified bullets instead - same posture as consultingRetrieval.js's
// paraphraseAndVerify falling back to the verbatim excerpt.
function fallbackAnswer(fw) {
  const bits = [];
  if (fw.when_to_use) bits.push(`When to use it: ${fw.when_to_use}`);
  if (fw.pitfalls?.length) bits.push(`Common pitfalls: ${fw.pitfalls.join(" ")}`);
  if (!bits.length && fw.description) bits.push(fw.description);
  return bits.length
    ? `I couldn't verify a confident answer to that - here's what this framework page already says that's closest to it:\n\n${bits.join("\n\n")}`
    : "I couldn't verify a confident answer to that from this framework's content.";
}

/**
 * Full answer for one free-form question about one framework: generate, then gate with the
 * same faithfulness judge the paraphrase pipeline uses (consultingRetrieval.js) - one retry
 * with feedback if the first attempt fails, then fall back to raw verified content rather
 * than ever showing an unchecked answer (grounding policy, CLAUDE.md).
 */
export async function answerFrameworkQuestion(fw, question) {
  const context = buildFrameworkContext(fw);
  const prompt = `${context}\n\nStudent's question: ${question}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const answer = await generateText({
        system: attempt === 0 ? GROUNDED_SYSTEM : GROUNDED_SYSTEM + RETRY_SUFFIX,
        prompt,
        maxTokens: 400,
        temperature: 0.3,
        feature: "frameworkQa"
      });
      const faithful = await judgeParaphraseFaithful(context, answer);
      if (faithful) return { answer, grounded: true };
    } catch (err) {
      console.warn(`[frameworkQa] attempt ${attempt} failed for "${fw.name}": ${err.message}`);
    }
  }

  return { answer: fallbackAnswer(fw), grounded: false };
}

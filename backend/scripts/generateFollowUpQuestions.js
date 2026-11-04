// One-off: generates 3-4 suggested follow-up questions per framework, grounded strictly in
// that framework's own already-verified description/example/steps/pitfalls/when_to_use/
// when_not_to_use (no new casebook lookup, no new facts) - the same "already-verified content
// is the only source" pattern as generateFrameworkDiagrams.js. These are the chips a student
// sees under "Ask about this framework" instead of a blank box, generated once because the
// content underneath them doesn't change per student or per session.
//
// Usage: node scripts/generateFollowUpQuestions.js
// Writes straight to frameworks.suggested_questions (migration_047) for every framework -
// no backup file, because unlike diagrams this is pure text with no rendering step to review
// first and a bad set of questions is cheap to notice and regenerate.

import "dotenv/config";
import { supabase } from "../src/lib/supabase.js";
import { generateJSON } from "../src/lib/gemini.js";

const SYSTEM_PROMPT =
  "You are writing 3-4 short follow-up questions a confused MBA student might ask right " +
  "after reading one Frameworks-page entry, to show as clickable suggestion chips next to a " +
  "free-text question box. You will be given the framework's description, example, steps, " +
  "pitfalls, when-to-use and when-not-to-use (already fact-checked). Write questions that a " +
  "real student would actually type - about the parts most likely to confuse someone new to " +
  "it: a specific step that's easy to get wrong, the difference between this framework and a " +
  "similar one, why a pitfall happens, or when to use it vs. a lookalike framework. Do not " +
  "write generic questions like \"what is this framework\" - the description already answers " +
  "that. Ground every question in the given content; never invent a fact, example or detail " +
  "not already present. Each question under 12 words.\n\n" +
  'Respond with ONLY a JSON object: {"questions": ["...", "...", "..."]}';

async function draftQuestions(fw) {
  const prompt = `Framework: ${fw.name}\n\n` +
    `Description: ${fw.description}\n\n` +
    `Example: ${fw.example || "(none given)"}\n\n` +
    `Steps:\n${(fw.steps || []).map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n` +
    `Pitfalls:\n${(fw.pitfalls || []).map(p => `- ${p}`).join("\n") || "(none given)"}\n\n` +
    `When to use it: ${fw.when_to_use || "(none given)"}\n\n` +
    `When not to use it: ${fw.when_not_to_use || "(none given)"}`;

  const parsed = await generateJSON({
    system: SYSTEM_PROMPT,
    prompt,
    maxTokens: 400,
    temperature: 0.4,
    feature: "generateFollowUpQuestions"
  });
  const questions = Array.isArray(parsed.questions) ? parsed.questions.map(String).filter(Boolean) : [];
  if (questions.length < 2) throw new Error(`only ${questions.length} questions returned`);
  return questions.slice(0, 4);
}

async function main() {
  const { data: rows, error } = await supabase
    .from("frameworks")
    .select("id,name,description,example,steps,pitfalls,when_to_use,when_not_to_use");
  if (error) throw new Error(error.message);

  let ok = 0, failed = [];
  for (const fw of rows) {
    try {
      const questions = await draftQuestions(fw);
      const { error: updateErr } = await supabase
        .from("frameworks")
        .update({ suggested_questions: questions })
        .eq("id", fw.id);
      if (updateErr) throw new Error(updateErr.message);
      console.log(`[questions] ${fw.name}: ok (${questions.length})`);
      ok++;
    } catch (err) {
      console.warn(`[questions] ${fw.name}: FAILED - ${err.message}`);
      failed.push(fw.name);
    }
  }

  console.log(`\n[questions] done. ${ok}/${rows.length} written.`);
  if (failed.length) console.log(`[questions] failed: ${failed.join(", ")}`);
}

main().catch(err => {
  console.error("[questions] fatal:", err);
  process.exit(1);
});

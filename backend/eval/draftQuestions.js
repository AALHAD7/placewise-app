// Dev-only helper: drafts CANDIDATE eval questions for Aalhad to review by
// hand before adding any of them to questions.jsonl (rag-eval skill's real
// test set). Never writes to questions.jsonl itself, never reaches
// students, never touches the RAG pipeline — this only saves the time of
// typing question text from scratch. Uses Groq directly (not gemini.js's
// cascade helpers - there's no Gemini fallback to worry about here, a
// drafting tool failing just means re-run it) since it's fast and free,
// exactly the "cheap draft generation for your own review" case from
// model-routing's recommendations.
//
// Aalhad still has to fill in expected_source/expected_pages/must_include
// against the real casebook pages and set `covered` correctly - this script
// cannot know what the casebooks actually contain, it only proposes
// plausible-sounding question text and a rough domain/feature guess.
//
// Usage: node eval/draftQuestions.js --domain Consulting --feature frameworks --count 10 [--topic "break-even analysis"]
import "dotenv/config";
import { writeFileSync } from "node:fs";

const GROQ_MODEL = "openai/gpt-oss-120b";

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { count: 10 };
  for (let i = 0; i < args.length; i++) {
    const key = args[i].replace(/^--/, "");
    out[key] = args[i + 1];
    i++;
  }
  out.count = Number(out.count) || 10;
  return out;
}

const SYSTEM_PROMPT = `You draft CANDIDATE interview-prep eval questions for a human to review - you are not answering them, and your draft is never shown to a student. Write the kind of question an MBA student preparing for placements might ask about the given domain/feature/topic. Keep each question specific and answerable from a casebook (not vague "tell me about X" prompts).

Respond with ONLY a JSON array, no markdown fences, no commentary, in exactly this shape:
[{"question": "...", "suggested_feature": "frameworks|guesstimates|qa"}]`;

async function draftQuestions({ domain, feature, topic, count }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set in backend/.env");

  const prompt = `Domain: ${domain}\nFeature: ${feature || "(any)"}\nTopic hint: ${topic || "(none - pick varied topics typical for this domain)"}\nDraft ${count} candidate questions.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.7
    })
  });
  if (!res.ok) throw new Error(`Groq returned ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`No JSON array found in Groq response: ${text.slice(0, 300)}`);
  return JSON.parse(match[0]);
}

async function main() {
  const { domain, feature, topic, count } = parseArgs();
  if (!domain) {
    console.error("Usage: node eval/draftQuestions.js --domain <Domain> [--feature frameworks|guesstimates|qa] [--topic \"...\"] [--count 10]");
    process.exitCode = 1;
    return;
  }

  console.log(`[draftQuestions] Drafting ${count} candidate questions for domain=${domain}, feature=${feature || "(any)"}, topic=${topic || "(none)"}...`);
  const drafts = await draftQuestions({ domain, feature, topic, count });

  const outFile = `eval/questions.draft.${Date.now()}.jsonl`;
  const lines = drafts.map(d => JSON.stringify({
    domain,
    feature: d.suggested_feature || feature || "qa",
    question: d.question,
    expected_source: "FILL IN - check the real casebook",
    expected_pages: [],
    must_include: [],
    covered: null // Aalhad must set true/false by hand
  }));
  writeFileSync(outFile, lines.join("\n") + "\n");

  console.log(`[draftQuestions] Wrote ${drafts.length} draft questions to ${outFile}.`);
  console.log("[draftQuestions] REVIEW BEFORE USE: expected_source/expected_pages/must_include/covered are all placeholders - fill them in against the real casebook pages, then manually merge any good ones into eval/questions.jsonl.");
}

main().catch(err => {
  console.error("[draftQuestions] Failed:", err.message);
  process.exitCode = 1;
});

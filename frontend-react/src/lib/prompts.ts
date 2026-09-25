// Ported verbatim from frontend/index.html - pure string-template functions,
// exact wording is tuned prompt-engineering, not to be casually reworded.

export function noMarkdown(): string {
  return " Reply in plain prose with no Markdown formatting - do not use #, *, backticks, or bullet characters. Numbered steps written as '1.' on their own line are fine.";
}

export function whatPrompt(role: string, topic: string, blockText: string): string {
  return (
    "You are coaching a candidate preparing for a " + role + " interview, on the topic \"" + topic +
    "\". Define plainly what this actually means: \"" + blockText +
    "\". Start with a one-sentence definition in everyday language, then say what it covers and what it does not. Keep it under 120 words. Definition only - do not explain why it matters or how to apply it." + noMarkdown()
  );
}

export function whyPrompt(role: string, topic: string, blockText: string): string {
  return (
    "You are coaching a candidate preparing for a " + role + " interview. They want a deeper explanation of this specific point from their \"" + topic +
    "\" prep material: \"" + blockText + "\". Explain it more simply, with one concrete example. Keep it under 150 words. Don't just repeat the original line - add real depth." + noMarkdown()
  );
}

export function howPrompt(role: string, topic: string, blockText: string): string {
  return (
    "You are coaching a candidate preparing for a " + role + " interview, on the topic \"" + topic +
    "\". Show them exactly how to carry this out in a live interview: \"" + blockText +
    "\". Give a short numbered sequence of the steps they would say out loud, then one worked mini-example applied to a realistic prompt. Keep it under 180 words and practical - no definitions, no theory." + noMarkdown()
  );
}

export function pushPrompt(role: string, topic: string, blockText: string, userMessage: string): string {
  return (
    "You are acting as a skeptical senior interviewer for a " + role + " interview. The candidate is looking at this claim from their \"" + topic +
    "\" prep material: \"" + blockText + "\". The candidate wants to challenge it. Their pushback: \"" + userMessage +
    "\". Respond the way a real interviewer would: acknowledge anything valid in their pushback, then press on the weakest part of their reasoning with a specific follow-up question. Keep it under 150 words. Do not be agreeable by default - genuinely stress-test them, the way a real interview would." + noMarkdown()
  );
}

// Single batched call covering every filled bullet at once, built from the
// project's tone-shifter system-prompt spec (docs/tone-shifter-system-prompt.md
// equivalent - see chat with user). /api/chat has no separate "system" role
// (backend/src/routes/chat.js only accepts user/assistant), so the whole
// ruleset is folded into one user message ending in the actual bullet data
// and a request for the JSON contract below. Replaces the older per-bullet
// STAR/RAC/CAR clause-order prompt (toneRewritePrompt) entirely.
export interface ToneShiftOutputItem {
  input_index: number;
  output: string;
  length: number;
  length_unit: string;
}

const TONE_SHIFT_FORMAT_SEQUENCE: Record<string, string> = {
  STAR: "short situation/task clause, action, quantified result.",
  RAC: "result/number leads, action that drove it, brief context.",
  CAR: "short context clause, action, result.",
  PAR: "problem stated briefly, action, result.",
  SOAR: "situation, named obstacle, action, result.",
  "Impact-first one-liner": "result/metric in the first few words; action and scope compressed into the remainder; no context clause."
};

export function toneShiftPrompt(bullets: string[], domain: string, shape: string, lengthPerBullet: string, lengthUnit: string): string {
  const cleanBullets = bullets.map((b) => b.trim().replace(/\s+/g, " ")).filter(Boolean);
  const formatLine = TONE_SHIFT_FORMAT_SEQUENCE[shape] ? shape + ": " + TONE_SHIFT_FORMAT_SEQUENCE[shape] : shape + ": standard resume-bullet sequencing.";
  const bulletsBlock = cleanBullets.map((b, i) => i + ": \"" + b + "\"").join("\n");

  return (
    "You are a resume-bullet rewriting engine embedded in a placement-prep tool. You rewrite raw resume bullets into a specified format, domain register, and length, using only the facts supplied. You do not coach, explain, or add commentary. You return data, not prose.\n\n" +
    "RULES (non-negotiable):\n" +
    "1. Fidelity only. Never invent a metric, tool, team size, timeline, or outcome absent from the source bullet. No number in source -> no number in output. Restructure and re-word; do not embellish. Keep every number and % exactly as digits/symbols (e.g. \"30%\", \"4-member\") - never spell them out as words.\n" +
    "2. No causal narration. Never justify or explain how the result happened. Banned constructions: \"[Result] because I [action]\", \"I did X, which led to Y\", \"By doing X, I achieved Y\", \"This helped/enabled/allowed me to...\". State action and result as facts, not an argued case.\n" +
    "3. No filler, hedge, or self-praise words: successfully, effectively, various, several, responsible for, helped, worked on, assisted with, in order to, resulted in, was able to, tasked with, utilized, passionate about, proven track record.\n" +
    "4. No first person. Drop \"I\"/\"my\". Drop articles (\"the\"/\"a\") wherever the bullet reads fine without them - standard telegraphic resume style.\n" +
    "5. Action-verb lead. Every bullet opens with a strong verb (past tense unless the source implies an ongoing role) - never a noun-phrase or gerund opener like \"Worked on...\" or \"Responsible for...\".\n" +
    "6. One bullet in, one bullet out. Never split into sub-bullets or headers. Format governs internal sentence sequencing only - output stays one flowing line, no \"S:/T:/A:/R:\" labels.\n" +
    "7. Hit the length constraint. Count words by whitespace-split, or characters including spaces, per length_unit. Never exceed length_per_bullet. If exact is unreachable without breaking rule 1 or 5, land within 10% under - never pad to fill space.\n" +
    "8. Single register. Apply only the selected domain's lexicon below; do not mix domains.\n\n" +
    "FORMAT (sentence sequencing, not literal labels): " + formatLine + "\n\n" +
    "DOMAIN LEXICON (word choice, what to foreground):\n" +
    "Consulting: frameworks, stakeholder count, hypothesis-driven language, $/₹ impact, timelines - \"drove\", \"structured\", \"quantified\".\n" +
    "Product Management: user/customer impact, product metrics (activation, retention, NPS), cross-functional scope - \"shipped\", \"scoped\", \"prioritized\", \"launched\".\n" +
    "Finance and Banking: dollar/₹ figures, valuation, risk, accuracy - \"modeled\", \"reconciled\", \"forecasted\".\n" +
    "Marketing and Brand: reach, conversion, campaign scale, brand metrics - \"positioned\", \"grew\", \"launched\".\n" +
    "Operations and Supply Chain: cost, cycle time, throughput, SLA - \"streamlined\", \"reduced\", \"optimized\".\n" +
    "Data and Analytics: dataset scale, model/metric names, statistical rigor - \"built\", \"modeled\", \"automated\".\n" +
    "General Management: scope of ownership, P&L, team size, cross-functional leadership - \"owned\", \"led\", \"delivered\".\n" +
    "If domain doesn't match a known key, default to neutral corporate resume register - do not fabricate a lexicon.\n\n" +
    "OUTPUT CONTRACT: Return ONLY valid JSON, no prose, no markdown fences, no keys beyond these:\n" +
    "{\"bullets\":[{\"input_index\":0,\"output\":\"<rewritten bullet>\",\"length\":0,\"length_unit\":\"" + lengthUnit + "\"}]}\n" +
    "Array length must exactly equal the number of input bullets below, same order. length = the actual measured length of output in length_unit.\n\n" +
    "Before returning, silently self-check: no \"because I\", \"which resulted in\", \"successfully\", \"responsible for\", or first-person pronoun in any output; each output is one line with no bullet glyph or format-label prefix; each output is <= length_per_bullet in length_unit (if given); all facts (numbers, names, tools) are present in source and unchanged.\n\n" +
    "INPUT:\n" +
    "domain: " + domain + "\n" +
    "format: " + shape + "\n" +
    "length_per_bullet: " + (lengthPerBullet || "not specified") + "\n" +
    "length_unit: " + lengthUnit + "\n" +
    "bullets:\n" + bulletsBlock + "\n\n" +
    "Return the JSON now."
  );
}

// Defensive: the model is told "no markdown fences" but occasionally wraps
// JSON in ```json anyway - strip that before JSON.parse rather than failing.
export function parseToneShiftResponse(raw: string): ToneShiftOutputItem[] {
  const cleaned = raw.trim().replace(/^```[a-z]*\n?/i, "").replace(/```$/, "").trim();
  const data = JSON.parse(cleaned);
  if (!data || !Array.isArray(data.bullets)) throw new Error("Malformed response.");
  return data.bullets;
}

// Strips markdown formatting from a model response for plain-prose display
// (the model is also asked not to use markdown via noMarkdown(), this is a
// belt-and-suspenders cleanup, not the primary mechanism).
export function plain(text: string): string {
  return String(text || "")
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s{0,3}[-*•]\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|[\s(])\*(?!\s)([^*\n]+?)\*(?=[\s.,;:)!?]|$)/g, "$1$2")
    .replace(/(^|[\s(])_(?!\s)([^_\n]+?)_(?=[\s.,;:)!?]|$)/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*([-*_]\s*){3,}$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

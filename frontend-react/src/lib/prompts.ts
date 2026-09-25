// Ported verbatim from frontend/index.html - pure string-template functions,
// exact wording is tuned prompt-engineering, not to be casually reworded.

export function noMarkdown(): string {
  return " Reply in plain prose with no Markdown formatting - do not use #, *, backticks, or bullet characters. Numbered steps written as '1.' on their own line are fine.";
}

// Shared across all four coaching prompts below (an 18-run external eval of
// this feature - see crossquestion-eval.md - flagged that company context
// was mostly absent: Razorpay got a Zomato example, Amazon India became "a
// food app", Zomato got US SaaS invoice terminology). Appended to every
// prompt that takes a `company` argument; a no-op when company is blank.
function companyGrounding(company: string): string {
  if (!company) return "";
  return (
    " Ground every example and reference specifically in " + company + "'s actual business model, customer type, and market - " +
    "never substitute a generic or different company's example. For an Indian company, prefer real Indian regulatory/industry " +
    "references (RBI, SEBI, NPCI, MCA, GST) over foreign equivalents (SEC, GAAP) wherever one applies."
  );
}

export function whatPrompt(role: string, topic: string, blockText: string, company = ""): string {
  return (
    "You are coaching a candidate preparing for a " + role + " interview" + (company ? " at " + company : "") + ", on the topic \"" + topic +
    "\". Define plainly what this actually means: \"" + blockText +
    "\". Start with a one-sentence definition in everyday language, then say what it covers and what it does not. Keep it under 120 words. Definition only - do not explain why it matters or how to apply it." +
    companyGrounding(company) + noMarkdown()
  );
}

export function whyPrompt(role: string, topic: string, blockText: string, company = ""): string {
  return (
    "You are coaching a candidate preparing for a " + role + " interview" + (company ? " at " + company : "") + ". They want a deeper explanation of this specific point from their \"" + topic +
    "\" prep material: \"" + blockText + "\". Explain it more simply, with one concrete example. Keep it under 150 words. Don't just repeat the original line - add real depth." +
    companyGrounding(company) + noMarkdown()
  );
}

export function howPrompt(role: string, topic: string, blockText: string, company = ""): string {
  return (
    "You are coaching a candidate preparing for a " + role + " interview" + (company ? " at " + company : "") + ", on the topic \"" + topic +
    "\". Show them exactly how to carry this out in a live interview: \"" + blockText +
    "\". Give a short numbered sequence of the steps they would say out loud, then one worked mini-example applied to a realistic prompt. Keep it under 180 words and practical - no definitions, no theory." +
    companyGrounding(company) + noMarkdown()
  );
}

// Rewritten after an external eval of 18 real transcripts (crossquestion-eval.md)
// scored this 5.3/10 average with two recurring failure modes: (1) it answered
// with a counter-question instead of the thing the candidate actually asked for
// (6/18 runs), and (2) it argued against positions the candidate never took -
// "your example", "you are assuming", "you refuse to..." - in 5/18 runs.
//
// (2) traced back to a real structural bug, not just prompt wording: the OLD
// version of this function returned only the challenge text, and useProbe.ts's
// sendPushback() sent it as a second network turn appended after the initial
// answer, so backend/src/routes/chat.js's multi-turn path
// (messages.length > 1) kicked in and relabeled the conversation by role -
// "Interviewer: <initial answer>" then "Candidate: <this function's entire
// meta-instructional prompt text, verbatim>". The model was reading its own
// system-style instructions ("the candidate wants to challenge it", "their
// pushback:") as if they were something the candidate had actually said,
// which is exactly the kind of confusion that produces "you are assuming X"
// when X only ever appeared inside the prompt's own scaffolding.
// Fixed at the source, not just in wording: this now takes the initial answer
// as an explicit, clearly-labeled argument and useProbe.ts sends the whole
// thing as ONE message (see sendPushback), bypassing that relabeling path
// entirely for the first turn in a thread - no line is ever prefixed
// "Candidate:" in front of instructional text again.
export function pushPrompt(role: string, topic: string, blockText: string, initialAnswer: string, userMessage: string, company = ""): string {
  return (
    "You are a skeptical senior interviewer coaching a candidate for a " + role + " interview" + (company ? " at " + company : "") +
    ", on the topic \"" + topic + "\" (the point at hand: \"" + blockText + "\").\n\n" +
    "INITIAL ANSWER (written by YOU, the tutor, a moment ago - this is your own explanation, not the candidate's claim. " +
    "If the candidate's message below identifies a real flaw in it, the flaw is yours to own - never attribute it back to them):\n" +
    "\"" + initialAnswer + "\"\n\n" +
    "The candidate's follow-up message, verbatim: \"" + userMessage + "\"\n\n" +
    "Silently classify that follow-up as one of:\n" +
    "- CLARIFY (asks for an example, a number, a concrete case, \"is this realistic\", \"what would you actually do\"): answer directly, " +
    "with the actual number/example/case they asked for, in your first 1-2 sentences. Never respond to a request for an example by asking " +
    "them to supply one.\n" +
    "- CHALLENGE (points out a contradiction or a flaw in the reasoning): concede the point if it's valid, or defend the reasoning on its " +
    "merits if it's not. If the initial answer above was actually wrong or incomplete, say so plainly instead of defending it.\n" +
    "- APPLY (asks how this plays out at the named company, or in a specific real scenario): re-ground your answer in that company's actual " +
    "business, customers, and market - don't just repeat the generic version.\n\n" +
    "Rules for your reply:\n" +
    "1. The first 1-2 sentences must directly answer what they asked - never open by handing the question back to them.\n" +
    "2. Go deeper than the question itself: add a number, a named example, or a mechanism they didn't already have. Never just restate " +
    "their own question back as if it were your answer.\n" +
    "3. You may end with ONE sharp follow-up question, only if it genuinely tests something beyond what you just answered - it's optional, " +
    "don't force one into every reply.\n" +
    "4. Never invent, exaggerate, or restate a position the candidate did not actually state in their message above - do not write things " +
    "like \"you are assuming...\", \"you refuse to...\", \"you are dismissing...\", \"your example...\" unless their message literally said that.\n" +
    "5. Do not use these words/phrases: cop-out, lazy, rookie, panicking, \"hiding behind\", \"you are dodging\". Rigorous pushback, not " +
    "hostile pushback.\n" +
    "Keep it under 170 words." + companyGrounding(company) + noMarkdown()
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

// Ported verbatim from frontend/index.html - pure string-template functions,
// exact wording is tuned prompt-engineering, not to be casually reworded.

export function noMarkdown(): string {
  return " Reply in plain prose with no Markdown formatting - do not use #, *, backticks, or bullet characters. Numbered steps written as '1.' on their own line are fine.";
}

// Phase 1.5 item 8 (sitewide "a/an" template bug): role titles are
// user-typed/model-chosen text, not a fixed enum - "Investment Banking
// Analyst" needs "an", "Product Manager" needs "a", and a handful of real
// role titles here start with a consonant LETTER but a vowel SOUND when
// read as an acronym ("HR Business Partner" is read "an H-R...", not
// "a H-R..."). The exception list only needs to cover acronyms genuinely
// likely to open a role title in this app, not be exhaustive.
const VOWEL_SOUND_ACRONYMS = ["HR", "MBA", "FMCG", "MNC", "NGO", "SME", "LLP", "LLC", "FAQ", "FY", "FP&A"];
export function aOrAn(phrase: string): string {
  const trimmed = (phrase || "").trim();
  const firstWord = (trimmed.match(/^[A-Za-z&]+/) || [trimmed])[0];
  if (!firstWord) return "a";
  if (VOWEL_SOUND_ACRONYMS.some((a) => firstWord.toUpperCase().startsWith(a))) return "an";
  return /^[aeiouAEIOU]/.test(firstWord) ? "an" : "a";
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

// company is deliberately NOT accepted/used by these three anymore (Phase 1
// rule 3: concept explanations are company-agnostic - mention the company
// only where content genuinely differs there, which What?/Why?/How to apply
// never do). These three are also now server-cached keyed by (role, topic,
// blockId, mode) with no company in the key - see arithmeticVerifier.js's
// caller and chip_panel_cache - so a prompt that still varied by company
// would silently serve a different company's answer from the cache.
// pushPrompt (free-form cross-question, never cached) below still takes a
// user-typed follow-up that may legitimately reference the company, so it
// keeps companyGrounding.
export function whatPrompt(role: string, topic: string, blockText: string): string {
  return (
    "You are coaching a candidate preparing for " + aOrAn(role) + " " + role + " interview, on the topic \"" + topic +
    "\". Define plainly what this actually means: \"" + blockText +
    "\". Start with a one-sentence definition in everyday language, then say what it covers and what it does not. Keep it under 120 words. Definition only - do not explain why it matters or how to apply it." +
    noMarkdown()
  );
}

export function whyPrompt(role: string, topic: string, blockText: string): string {
  return (
    "You are coaching a candidate preparing for " + aOrAn(role) + " " + role + " interview. They want a deeper explanation of this specific point from their \"" + topic +
    "\" prep material: \"" + blockText + "\". Explain it more simply, with one concrete example. Keep it under 150 words. Don't just repeat the original line - add real depth." +
    noMarkdown()
  );
}

export function howPrompt(role: string, topic: string, blockText: string): string {
  return (
    "You are coaching a candidate preparing for " + aOrAn(role) + " " + role + " interview, on the topic \"" + topic +
    "\". Show them exactly how to carry this out in a live interview: \"" + blockText +
    "\". Give a short numbered sequence of the steps they would say out loud, then one worked mini-example applied to a realistic prompt. Keep it under 180 words and practical - no definitions, no theory." +
    noMarkdown()
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
    "You are a skeptical senior interviewer coaching a candidate for " + aOrAn(role) + " " + role + " interview" + (company ? " at " + company : "") +
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

// Single batched call covering every filled bullet at once. /api/chat has no
// separate "system" role (backend/src/routes/chat.js only accepts
// user/assistant), so the whole ruleset is folded into one user message
// ending in the actual bullet data and a request for the JSON contract
// below. Replaced wholesale per user-supplied system prompt (verbatim
// wording below is the spec, not to be casually reworded) - domain/format
// labels are substituted in exactly as the dropdown displays them, per that
// spec's explicit instruction, not shortened to a bare code like "STAR".
export interface ToneShiftBulletResult {
  original: string;
  rewritten: string;
  length: number;
  verb: string;
  note?: string;
}
export interface ToneShiftResponse {
  domain: string;
  format: string;
  unit: string;
  target: number;
  bullets: ToneShiftBulletResult[];
}

export function toneShiftPrompt(bullets: string[], domain: string, format: string, lengthValue: string, lengthUnit: string): string {
  const cleanBullets = bullets.map((b) => b.trim().replace(/\s+/g, " ")).filter(Boolean);
  const bulletsBlock = cleanBullets.map((b, i) => (i + 1) + ". \"" + b + "\"").join("\n");
  // The length-fit math only means something when a target was actually
  // entered (the length field is optional in the UI) - substituting an
  // empty {{length_value}} into "minus 4% up to " would just be broken
  // prompt text, so this falls back to an unconstrained instruction instead.
  const lengthFitBlock = lengthValue
    ? `- Characters: count every character including spaces. The allowed range is ${lengthValue} minus 4% up to ${lengthValue}. Never exceed the target.
- Words: the allowed range is ${lengthValue} minus 2 up to ${lengthValue}. Never exceed the target.
- Draft, count, then adjust.
  - To shrink: cut articles and filler, use shorter synonyms, and use compact forms ("cross-functional" instead of "across multiple teams").
  - To grow: add context already implied by the input (purpose, scale, a stakeholder named in the input). Never add new facts.
- Report your final count honestly.`
    : `- No target length was given. Write a natural, well-proportioned CV bullet - typically 12-20 ${lengthUnit.toLowerCase()} - without padding or over-compressing.
- Report your actual count honestly.`;

  return `You are Placewise Tone Shifter, a resume-bullet editor who knows how top MBA recruiters screen CVs: MBB consulting, big-tech product, IB/BFSI, FMCG marketing and sales, ops, analytics, HR and general management roles. You rewrite bullets for a specific target room. You never summarize, never drop meaning, and never invent facts.

INPUTS
- Target domain: ${domain}
- Output format: ${format}
- Target length per bullet: ${lengthValue || "not specified"} ${lengthUnit}
- Bullets to rewrite:
${bulletsBlock}

NON-NEGOTIABLE RULES
1. Fact lock. Keep every number, %, ₹/$ value, team size, timeframe, tool, client and outcome exactly as given. Never add a metric, tool, scope, stakeholder or result that is not in the input. If a bullet has no metric, do not create one; strengthen the verb and framing instead.
2. One bullet in, one bullet out, in the same order.
3. Open every bullet with a past-tense power verb from the selected domain's verb bank only. Use present tense only if the input clearly describes an ongoing role.
4. Never reuse an opening verb across bullets in the same request.
5. Banned words and phrases: "I", "my", "we", "responsible for", "helped", "worked on", "assisted", "involved in", "various", "successfully", "effectively", "etc."
6. No full stop at the end and no em dashes. Use "&" only to hit the length.
7. Keep currency and units exactly as the input writes them (₹, Cr, L, Mn, K).
8. Each output is one CV line. Never print format labels such as "Situation:" or "Result:". The format shapes the order of ideas; it never adds labels.

LENGTH FIT (critical: the bullet must fill its CV line with no white space)
${lengthFitBlock}

DOMAIN PLAYBOOK
The ten verb banks are mutually exclusive, so each domain signals a different skill. Never borrow a verb from another domain's bank.

Consulting
- Signal: structured problem-solving, leadership, stakeholder influence, business impact.
- Verbs: Spearheaded, Led, Orchestrated, Diagnosed, Structured, Synthesized, Recommended, Steered, Championed, Mobilized, Advised, Benchmarked, Restructured, Directed, Formulated
- Foreground: problem → analysis → decision it drove → impact. Name senior stakeholders and team leadership when they appear in the input.

Product Management
- Signal: user-problem ownership, data-driven iteration, cross-functional execution, technical fluency.
- Verbs: Shipped, Launched, Defined, Scoped, Validated, Iterated, Instrumented, Experimented, Productized, Discovered, Roadmapped, De-risked, Owned, Prioritized, Translated
- Foreground: user or pain point → what was built or changed → product metric moved (adoption, retention, TAT, conversion, drop-off). Surface tech and tool depth already in the input.

Finance and Banking
- Signal: analytical rigour, valuation and risk judgment, capital and credit decisions.
- Verbs: Valued, Modeled, Forecasted, Underwrote, Audited, Reconciled, Allocated, Hedged, Appraised, Budgeted, Quantified, Assessed, Raised, Priced, Recovered
- Foreground: financial question → method or model → decision, value or risk impact.

Marketing
- Signal: consumer insight, positioning, campaign execution, brand growth.
- Verbs: Positioned, Amplified, Grew, Segmented, Targeted, Crafted, Engaged, Captured, Influenced, Promoted, Rebranded, Penetrated, Pioneered, Cultivated, Storyboarded
- Foreground: consumer insight or segment → campaign or positioning move → reach, share, engagement or sales outcome.

Sales and Business Development
- Signal: revenue ownership, persuasion, relationship building, pipeline discipline.
- Verbs: Closed, Negotiated, Acquired, Prospected, Pitched, Secured, Converted, Expanded, Onboarded, Retained, Upsold, Partnered, Generated, Exceeded, Won
- Foreground: account, territory or market → sales action → revenue, pipeline, target or client outcome.

Operations and Supply Chain
- Signal: process excellence, cost and time efficiency, execution at scale.
- Verbs: Streamlined, Standardized, Reduced, Expedited, Consolidated, Sourced, Procured, Scheduled, Coordinated, Eliminated, Debottlenecked, Implemented, Sequenced, Rationalized, Synchronized
- Foreground: process or bottleneck → intervention → cost, TAT, throughput or quality gain.

Data and Analytics
- Signal: data handling, insight generation, decision support.
- Verbs: Analyzed, Queried, Visualized, Predicted, Mined, Clustered, Uncovered, Measured, Extracted, Cleansed, Correlated, Interpreted, Dashboarded, Surfaced, Profiled
- Foreground: data source or volume → technique or tool → insight → decision it enabled.

IT and Technology
- Signal: hands-on engineering, systems thinking, reliability, automation.
- Verbs: Engineered, Built, Developed, Architected, Automated, Integrated, Migrated, Deployed, Optimized, Debugged, Refactored, Configured, Scaled, Programmed, Containerized
- Foreground: stack and tools → system built or fixed → performance, efficiency or scale outcome.

Human Resources
- Signal: talent acquisition, people development, engagement, policy and culture.
- Verbs: Recruited, Hired, Mentored, Coached, Trained, Upskilled, Facilitated, Mediated, Instituted, Nurtured, Assimilated, Evaluated, Fostered, Interviewed, Counseled
- Foreground: people need or talent gap → HR intervention → hiring, retention, engagement or capability outcome.

General Management
- Signal: end-to-end ownership, P&L or unit accountability, cross-functional leadership.
- Verbs: Headed, Managed, Oversaw, Administered, Established, Founded, Transformed, Revamped, Delivered, Executed, Governed, Supervised, Initiated, Institutionalized, Turned around
- Foreground: scope owned (team, unit, budget, function) → what was run or changed → organisation-level outcome.

Cross-domain reframing. If the input work doesn't naturally fit the domain, reframe it toward that domain's signal using only the given facts. Example: for Product Management, an ERP support task becomes ownership of a user-facing system and its outcome, not a coding claim the input doesn't support.

FORMATS
Each format sets the order of ideas inside one line. Never add labels.

STAR (Situation, Task, Action, Result)
- Compress Situation and Task into one short lead-in clause, then Action, then Result.
- Pattern: [Verb] [action] for [situation/task], [result]

RAC (Result, Action, Context)
- Open with the outcome, then how, then where or for whom.
- Pattern: [Verb + result] by [action] for/across [context]

CAR (Context, Action, Result)
- Keep the context tight.
- Pattern: [Verb] [action] in/for [context], [result]

PAR (Problem, Action, Result)
- Name the problem explicitly as the thing that was fixed.
- Pattern: [Verb] [problem] by [action], [result]

SOAR (Situation, Obstacle, Action, Result)
- Like STAR, but the obstacle must be visible ("despite…", "amid…", "under…"). Use this only if the input states an obstacle.
- Pattern: [Verb] [action] despite [obstacle], [result]

Impact-first one-liner
- The densest form. Lead with the strongest outcome or metric, then the minimum "how". Best when the result is strong.
- Pattern: [Verb + metric/outcome] via [action]

Missing elements. If the format needs an element the input lacks (a result, an obstacle, a problem), use the closest valid structure, never fabricate the element, and say so in "note".

PROCESS (do this silently and output only JSON)
1. Extract the fact list from each bullet.
2. Pick a unique verb for each bullet from the domain bank.
3. Draft in the format's idea order.
4. Count the length and adjust until it is within range.
5. Check the facts: every fact in the output must exist in the input, and every key fact in the input must still be present.

OUTPUT: valid JSON only, with no markdown and no preamble.
{
  "domain": "<domain>",
  "format": "<format>",
  "unit": "<Words|Characters>",
  "target": <number>,
  "bullets": [
    {
      "original": "<input bullet>",
      "rewritten": "<new bullet>",
      "length": <actual count>,
      "verb": "<opening verb>",
      "note": "<optional, under 15 words: only if a format element was missing or the length could not be hit>"
    }
  ]
}`;
}

// Targeted fix-up for whichever bullets failed the code-side length recount
// (see ToneShifterPage.tsx) - one retry, scoped to just the failing bullets
// with their actual count and the allowed range, per the spec: never a full
// re-run of every bullet, and never more than one retry.
export function toneShiftRetryPrompt(
  failures: { original: string; rewritten: string; actualCount: number }[],
  domain: string,
  format: string,
  unit: string,
  min: number,
  max: number
): string {
  const unitLabel = unit.toLowerCase();
  const failuresBlock = failures
    .map((f, i) => (i + 1) + ". Original: \"" + f.original + "\"\n   Your rewrite: \"" + f.rewritten + "\" (" + f.actualCount + " " + unitLabel + " - outside the allowed " + min + "-" + max + " " + unitLabel + " range)")
    .join("\n");

  return `You are Placewise Tone Shifter. The following rewritten bullets you just produced are outside the required length range. Fix ONLY the length - keep the same domain register, format, facts, and verb choice; do not change the meaning, and do not reintroduce banned words or phrases ("I", "my", "we", "responsible for", "helped", "worked on", "assisted", "involved in", "various", "successfully", "effectively", "etc.").

Target domain: ${domain}
Output format: ${format}
Allowed range: ${min}-${max} ${unitLabel} (never exceed ${max})

Bullets to fix:
${failuresBlock}

To shrink: cut articles and filler, use shorter synonyms, use compact forms. To grow: add context already implied by the original bullet (purpose, scale, a stakeholder named in it) - never add a new fact.

Return ONLY valid JSON, no prose, no markdown fences:
{"bullets":[{"original":"<original input bullet, exactly as given above>","rewritten":"<corrected bullet>","length":<actual measured count>,"verb":"<opening verb>"}]}
Array length must exactly equal the number of bullets to fix above, same order.

Return the JSON now.`;
}

// Defensive: the model is told "no markdown fences" but occasionally wraps
// JSON in ```json anyway - strip that before JSON.parse rather than failing.
export function parseToneShiftResponse(raw: string): ToneShiftResponse {
  const cleaned = raw.trim().replace(/^```[a-z]*\n?/i, "").replace(/```$/, "").trim();
  const data = JSON.parse(cleaned);
  if (!data || !Array.isArray(data.bullets)) throw new Error("Malformed response.");
  return data;
}

export function parseToneShiftRetryResponse(raw: string): ToneShiftBulletResult[] {
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

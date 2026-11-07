import { groundedConsultingLookup, buildCitation, paraphraseAndVerify, judgeParaphraseFaithful, AI_FALLBACK_LABEL } from "./consultingRetrieval.js";
import { generateJSON, generateText } from "./gemini.js";
import { supabase } from "./supabase.js";

// The one casebook this feature is grounded in - ingested (R6, commit c516be7) but not
// yet switched live (is_active=false on every ingest_chunks row until R9). Scoping to
// this exact source_file (via migration_044's filter_source_file) is what keeps a
// "guesstimate" request from pulling in FMS/ISB case-interview material instead.
export const GUESSTIMATES_SOURCE_FILE = "SRCC Guesstimates-Book-Volume-1-6.pdf";

// A separate flag from ENABLE_ANSWER_PARAPHRASE, deliberately - that flag (and the
// `paraphrase: true` opt-in on groundedConsultingLookup) only ever reaches Q&A
// (qaRetrieval.js) and Frameworks (frameworksGrounding.js); getRandomGuesstimateProblem
// below doesn't call groundedConsultingLookup at all (it does its own direct
// ingest_chunks query + random pick), so turning ENABLE_ANSWER_PARAPHRASE on would never
// have touched this path anyway. This flag turns the same paraphrase + faithfulness-judge
// layer (consultingRetrieval.js's paraphraseAndVerify) on for Guesstimates specifically,
// without changing Q&A/Frameworks' behavior. Off by default, same reversibility posture as
// every other paraphrase flag.
const ENABLE_GUESSTIMATE_PARAPHRASE = process.env.ENABLE_GUESSTIMATE_PARAPHRASE === "true";

// paraphraseChunk's prompt asks the model to rewrite "for an MBA student preparing for
// case/consulting interviews" and takes a "Student's question" as context to keep the
// rewrite on-topic - there is no real question here (this is "give me a problem to
// practice", not "answer my question"), so this fixed string stands in for it: it
// describes what the student is about to do with the text, which is all the prompt
// actually uses the query for (it is never quoted back or treated as something to answer).
const GUESSTIMATE_PARAPHRASE_CONTEXT = "a guesstimate practice problem for a student to work through";


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
 * (Not used by getRandomGuesstimateProblem any more - see shuffle below for why - kept and
 * still tested as a general utility other callers may want.)
 */
export function pickRandomCoveringChunk(result, rng = Math.random) {
  if (!result.covered || !result.chunks.length) return null;
  const idx = Math.floor(rng() * result.chunks.length);
  return { chunk: result.chunks[idx], citation: result.citations[idx] };
}

/**
 * Pure: Fisher-Yates shuffle, rng injectable for tests. Used instead of a single
 * `pick random index` because getRandomGuesstimateProblem needs to try several
 * candidates in random order (cheapest-first) until one passes the problem judge, not
 * just pick one index once.
 */
export function shuffle(array, rng = Math.random) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Pure: does this chunk look like an actual worked guesstimate problem (a title plus
 * stated assumptions), not front matter (title page, table of contents, acknowledgements,
 * theory/methodology, cheatsheet)? Found 2026-11-02: the random-pick path showed SRCC's own
 * index page as if it were a problem - the index is genuinely *about* guesstimates (it
 * names dozens of real problem titles), so it cleared both the similarity threshold and the
 * relevance judge for the broad "give me a guesstimate" query. That's a different failure
 * mode than "wrong topic" (which the judge already catches) - this is "right topic, wrong
 * kind of page," and nothing was checking for it.
 *
 * Every real problem in this book states its assumptions explicitly (confirmed across every
 * problem page read this session - Swiggy orders, toll plaza, credit cards, tyre industry,
 * etc. all have an "ASSUMPTIONS" section); front matter never does. This is cheap,
 * deterministic, and runs with no extra API call - checked before a candidate is even
 * eligible to be picked. It also generalizes past this one casebook: stating assumptions is
 * fundamental to how a guesstimate write-up works, not an SRCC-specific quirk.
 */
export function looksLikeWorkedProblem(content) {
  return /assumptions/i.test(content || "");
}

const PROBLEM_JUDGE_SYSTEM =
  "You are checking whether a casebook excerpt is an ACTUAL guesstimate practice problem a " +
  "student could work through right now - not theory, an index/table of contents, " +
  "acknowledgements, or a generic methodology/framework explanation. A real problem presents " +
  "a specific scenario to estimate (even briefly) and either stated assumptions or a worked " +
  "calculation toward an answer. A page that only explains a general concept, lists problem " +
  "titles, or teaches an approach in the abstract is NOT a worked problem - even if it uses " +
  "words like \"assumption\" or \"estimate\" along the way. A worked EXAMPLE embedded inside " +
  "a theory/methodology section (e.g. illustrating a framework with one concrete scenario and " +
  "its own numbers) DOES count as a real problem - the test is whether there's an actual " +
  "scenario being solved, not where in the book it sits.\n\n" +
  'Respond with ONLY a JSON object, no markdown fences: {"verdict": "problem" or ' +
  '"not_problem", "reasoning": "one sentence"}';

/**
 * I/O: a second, more reliable gate than looksLikeWorkedProblem's cheap regex, specific to
 * the random-pick path - found 2026-11-02: the regex alone let through page 6
 * ("Introduction to a Guesstimate", generic theory that happens to use the word
 * "assumptions" in a sentence) while a plain "no embedded table markup" rule would have
 * wrongly excluded page 9's legitimate worked fast-food-chain example (its assumptions
 * appear as "? ASSUMPTIONS | Focus on Dine-in orders only", a table row, not a clean
 * standalone heading). A judge asking the right question - "is this an actual problem,"
 * not "does this answer a fake question" - handles both cases correctly where neither a
 * looser nor a stricter regex could. Runs only on candidates that already passed the cheap
 * regex, to keep the call count down. Fails closed (not a problem) on any error, same
 * posture as judgeRelevance.
 */
export async function judgeIsWorkedProblem(content) {
  try {
    const parsed = await generateJSON({
      system: PROBLEM_JUDGE_SYSTEM,
      prompt: `Excerpt:\n"""${content.slice(0, 2000)}"""\n\nIs this an actual worked guesstimate problem?`,
      maxTokens: 150,
      temperature: 0,
      feature: "guesstimate-random-pick-problem-judge"
    });
    return parsed.verdict === "problem";
  } catch (err) {
    console.warn(`[guesstimateRetrieval] problem judge failed: ${err.message}`);
    return false;
  }
}

const MAX_PROBLEM_JUDGE_ATTEMPTS = 5;

// Generic placeholder when a chunk has no newline at all to split on (rare - every real
// problem checked live in the SRCC book follows "TITLE\n\n<rest>", confirmed 2026-11-07
// across Swiggy orders / toll plaza / healthy biscuits / Ola-Uber cabs / flights / the
// Maharashtra license-plates worked example).
const GENERIC_QUESTION_FALLBACK = "Estimate the following:";

/**
 * Pure: splits a raw chunk into a bare title (`rawQuestion`, shown to the student BEFORE
 * they attempt the problem) and everything else (`answerSource`, the assumptions/working/
 * diagram that is part of the worked SOLUTION, only shown after paraphrasing/reveal).
 *
 * Found 2026-11-07 (Aalhad, live): the casebook's own ASSUMPTIONS section is a solving
 * decision (e.g. "average family is 4 members", "15% of cars are red"), not neutral problem
 * framing - showing it pre-attempt defeats the point of practicing blind. The previous fix
 * tried to split the *paraphrased* blob client-side at the first diagram fence, but
 * paraphrasing merges the title and assumptions into one flowing paragraph with no reliable
 * boundary left - so the split has to happen here, on the raw chunk, before paraphrasing
 * ever runs.
 *
 * Every real problem in this book follows "TITLE\n\n<firm | difficulty-bars>\n\n<click-here
 * link>\n\nASSUMPTIONS\n\n1. ...\n```placewise-diagram..." (confirmed live, migration
 * ingest_chunks, SRCC Guesstimates-Book-Volume-1-6.pdf, pages 21/14/15/16) - the first line
 * is always just the title, whether written as "# TITLE" or "## EXAMPLE: ...". Stripping a
 * leading "#"/whitespace run turns that into a plain bare question, not raw markdown.
 */
// A handful of chunks (found live 2026-11-07, auditing all 59 active SRCC rows) have a
// stray bare page number as their literal first line (a leftover page-break artifact from
// ingestion, e.g. "47\n\nSIZE OF ANIMATION/VFX MARKET IN INDIA\n\n...") - that number would
// otherwise become `rawQuestion`, which is nonsense shown to a student. Skip a leading
// bare-number line (and any blank lines around it) before taking the first real line as
// the title.
const BARE_PAGE_NUMBER_RE = /^\d+$/;

export function splitRawQuestionFromAnswer(content) {
  if (content.indexOf("\n") === -1) {
    // No title/body separation at all - nothing safe to call "the question".
    return { rawQuestion: GENERIC_QUESTION_FALLBACK, answerSource: content };
  }
  const lines = content.split("\n");
  let i = 0;
  while (i < lines.length && (lines[i].trim() === "" || BARE_PAGE_NUMBER_RE.test(lines[i].trim()))) {
    i++;
  }
  if (i >= lines.length) {
    return { rawQuestion: GENERIC_QUESTION_FALLBACK, answerSource: content };
  }
  const titleLine = lines[i];
  const rawQuestion = titleLine.replace(/^#+\s*/, "").trim();
  const answerSource = lines.slice(i + 1).join("\n");
  return { rawQuestion: rawQuestion || GENERIC_QUESTION_FALLBACK, answerSource };
}

/**
 * Full "give me a guesstimate to practice" lookup. Distinct from the grounding policy's
 * usual "not covered -> labelled general answer" path: a miss here means "the casebook
 * isn't live yet" (an R9 gating condition), not "the casebooks don't cover guesstimates"
 * (they do, entirely). Returning the general AI_FALLBACK_LABEL in that case would
 * misrepresent why nothing came back, so this reports `available: false` instead.
 *
 * Found 2026-11-02 (two bugs, same day): (1) an embedding-similarity search against a
 * fixed generic seed query ("guesstimate practice problem...") is the wrong tool for
 * "pick any of the 36 real problems at random" - that seed's nearest neighbors cluster
 * around the book's own THEORY/explanation pages (which share vocabulary with a generic
 * query about guesstimates), not the specific, varied problems themselves. Verified: 6
 * requests in a row all returned the exact same one problem, because only 1 of the
 * query's fixed top-10 nearest neighbors was ever a real problem. (2) the relevance judge
 * (built for "does this answer a real student question") rejected almost everything once
 * sharpened, because the seed string isn't a real question for it to check against.
 *
 * Fixed by not doing a similarity search for this path at all: fetches every active chunk
 * for this book directly, filters to structurally-plausible candidates
 * (looksLikeWorkedProblem), shuffles them, then tries them in that random order against
 * judgeIsWorkedProblem (the correctly-scoped "is this an actual problem" judge) until one
 * passes or MAX_PROBLEM_JUDGE_ATTEMPTS is reached - cheap in the common case (most
 * structurally-plausible candidates are, in fact, real problems) while still catching the
 * rare false positive like the theory page from bug (2).
 */
export async function getRandomGuesstimateProblem() {
  const { data, error } = await supabase
    .from("ingest_chunks")
    .select("id, content, has_diagram, page_start, page_end, ingest_documents!inner(source_file, school, club, year, source_class)")
    .eq("is_active", true)
    .eq("ingest_documents.source_file", GUESSTIMATES_SOURCE_FILE)
    .eq("ingest_documents.source_class", "club_casebook");

  if (error) {
    console.warn(`[guesstimateRetrieval] random-pick fetch failed: ${error.message}`);
    return { available: false, reason: "not_yet_live", label: AI_FALLBACK_LABEL };
  }

  const rows = (data || []).map(r => ({
    id: r.id,
    content: r.content,
    has_diagram: r.has_diagram,
    page_start: r.page_start,
    page_end: r.page_end,
    source_file: r.ingest_documents.source_file,
    school: r.ingest_documents.school,
    club: r.ingest_documents.club,
    year: r.ingest_documents.year
  }));

  const candidates = shuffle(rows.filter(row => looksLikeWorkedProblem(row.content)));
  for (const row of candidates.slice(0, MAX_PROBLEM_JUDGE_ATTEMPTS)) {
    if (await judgeIsWorkedProblem(row.content)) {
      // Split BEFORE paraphrasing (2026-11-07 fix, see splitRawQuestionFromAnswer): the
      // title (`rawQuestion`) is the bare question shown pre-attempt and is never
      // paraphrased - it's a short casebook heading, nothing to rewrite, and the student
      // must not see any assumptions bundled into it. `answerSource` (assumptions +
      // working + diagram) is the only part that ever gets paraphrased, same as before.
      const { rawQuestion, answerSource } = splitRawQuestionFromAnswer(row.content);

      // Flag off (default): byte-identical split behavior - no paraphrase call, no new
      // keys. Flag on: same paraphrase-then-verify-then-fail-closed pipeline R7b already
      // uses for Q&A/Frameworks (paraphraseAndVerify itself falls back to the verbatim
      // chunk on any error or failed faithfulness vote - nothing extra to fail-close
      // here), surfacing `paraphrased`/`rawProblem` the same way frameworksGrounding.js
      // surfaces `paraphrased`/`rawExcerpt` - present only when a rewrite was actually
      // used, so a caller/debugger can tell without the key always being there.
      if (!ENABLE_GUESSTIMATE_PARAPHRASE) {
        return {
          available: true,
          question: rawQuestion,
          problem: answerSource,
          hasDiagram: row.has_diagram,
          citation: buildCitation(row),
          chunkId: row.id
        };
      }
      const { content, rawContent, paraphrased } = await paraphraseAndVerify(GUESSTIMATE_PARAPHRASE_CONTEXT, answerSource);
      return {
        available: true,
        question: rawQuestion,
        problem: content,
        paraphrased,
        ...(paraphrased ? { rawProblem: rawContent } : {}),
        hasDiagram: row.has_diagram,
        citation: buildCitation(row),
        chunkId: row.id
      };
    }
  }
  return { available: false, reason: "not_yet_live", label: AI_FALLBACK_LABEL };
}

// --- Assumption clarification ("ask the interviewer") -----------------------------------

// Aalhad's request, 2026-11-07: mimic a real case interview, where a candidate can ask the
// interviewer to clarify a scope/assumption before estimating. The client passes only a
// `chunkId` (never the problem text itself) so the server - not the client - decides what
// content actually grounds the answer; trusting a client-supplied "context" string instead
// would let anyone pass arbitrary text and get free-form Gemini generation disconnected
// from any real guesstimate problem (the exact posture frameworkQa.js/`POST /ask` already
// takes for the Frameworks follow-up box - this mirrors it).
//
// Scoped to this book and `is_active`/`club_casebook` exactly like getRandomGuesstimateProblem's
// own query, so a guessed/stale id can never pull content from another document.
async function fetchScopedGuesstimateChunk(chunkId) {
  const { data, error } = await supabase
    .from("ingest_chunks")
    .select("id, content, ingest_documents!inner(source_file, source_class)")
    .eq("id", chunkId)
    .eq("is_active", true)
    .eq("ingest_documents.source_file", GUESSTIMATES_SOURCE_FILE)
    .eq("ingest_documents.source_class", "club_casebook")
    .limit(1);

  if (error) {
    console.warn(`[guesstimateRetrieval] clarification chunk lookup failed: ${error.message}`);
    return null;
  }
  return data?.[0] || null;
}

const CLARIFICATION_SYSTEM =
  "You are acting as a case interviewer answering ONE clarifying question about a " +
  "guesstimate problem's assumptions while the student is still attempting it - the same " +
  "thing a real candidate does when they ask the interviewer to clarify a scope or " +
  "assumption before estimating. Answer using ONLY the assumptions/information given below - " +
  "never add an outside fact or number. If the given content doesn't specify what's asked, " +
  "say plainly that it isn't specified and that the student should state and justify their " +
  "own reasonable assumption, rather than guessing what the casebook meant. Critically: if " +
  "the question asks for the final numeric answer, the full solution structure, or anything " +
  "that would reveal the diagram/working, you must decline and tell the student to click " +
  '"Show answer" when ready instead - never leak the solution through this clarification ' +
  "path. Keep your answer under 80 words - a real interviewer clarifies one point, they " +
  "don't re-explain the whole problem.";

const CLARIFICATION_RETRY_SUFFIX =
  "\n\nYour previous answer added something not present in the problem content above, or " +
  "risked revealing the final answer/solution - stay strictly limited to clarifying the " +
  'stated assumptions, and if asked for the answer, decline and point to "Show answer" ' +
  "instead.";

// Cheap, fast pre-check for the obvious case ("what's the answer", "just give me the
// number") - catches the clearest attempts without a Gemini round-trip. Deliberately not
// the primary defense (a keyword filter is easy to word around) - CLARIFICATION_SYSTEM's
// instruction to decline is what actually has to hold for subtler phrasing.
const ANSWER_REQUEST_RE =
  /\b(final answer|what('?s| is) the answer|give me the (answer|number)|the actual (answer|number)|full solution|solve (it|this)|just tell me)\b/i;

const CLARIFICATION_DECLINE =
  'I can\'t give you the final answer or the worked solution here - click "Show answer" ' +
  "when you're ready for that. Ask me about a specific assumption instead.";

// Fail-closed fallback when neither generation attempt passes the faithfulness judge (or
// both error) - never show an unverified rewrite, same posture as frameworkQa.js's
// fallbackAnswer and consultingRetrieval.js's paraphraseAndVerify.
const CLARIFICATION_SAFE_FALLBACK =
  "That's not specified in this problem - go with your own reasonable assumption and state " +
  "it clearly.";

/**
 * Answers one clarifying question about a specific guesstimate problem's stated assumptions,
 * scoped server-side to that exact chunk (never trusting client-supplied context - see the
 * comment above fetchScopedGuesstimateChunk). Same two-attempt generate -> faithfulness-judge
 * -> fail-closed-to-safe-fallback shape as frameworkQa.js's answerFrameworkQuestion.
 *
 * Returns `{ found: false }` if chunkId doesn't resolve to an active row in this book (bad/
 * stale/guessed id) - callers map that to a 404, never an unhandled error.
 */
export async function answerAssumptionClarification(chunkId, question) {
  if (!chunkId || typeof chunkId !== "string") return { found: false };

  let row;
  try {
    row = await fetchScopedGuesstimateChunk(chunkId);
  } catch (err) {
    console.warn(`[guesstimateRetrieval] clarification lookup threw: ${err.message}`);
    return { found: false };
  }
  if (!row) return { found: false };

  if (ANSWER_REQUEST_RE.test(question)) {
    return { found: true, answer: CLARIFICATION_DECLINE, grounded: true };
  }

  const { answerSource } = splitRawQuestionFromAnswer(row.content);
  const prompt = `Problem's assumptions/information:\n"""${answerSource}"""\n\nStudent's clarifying question: ${question}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const answer = await generateText({
        system: attempt === 0 ? CLARIFICATION_SYSTEM : CLARIFICATION_SYSTEM + CLARIFICATION_RETRY_SUFFIX,
        prompt,
        maxTokens: 250,
        temperature: 0.3,
        feature: "guesstimateClarify"
      });
      const faithful = await judgeParaphraseFaithful(answerSource, answer);
      if (faithful) return { found: true, answer, grounded: true };
    } catch (err) {
      console.warn(`[guesstimateRetrieval] clarification attempt ${attempt} failed: ${err.message}`);
    }
  }

  return { found: true, answer: CLARIFICATION_SAFE_FALLBACK, grounded: false };
}

const GUESSTIMATE_EVALUATION_SYSTEM = `You are a senior management consulting case interviewer evaluating a candidate's guesstimate practice attempt.
Be insightful, structured, and constructive.

EVALUATION RUBRIC (Total 10.0 points):
1. Structure & Formula (0.0 to 3.0):
   - 2.5 - 3.0: Clear, logical decomposition into MECE drivers (top-down population/usage or bottom-up capacity/turnover).
   - 1.5 - 2.4: Reasonable structure but minor missing factors or slight overlap.
   - 0.0 - 1.4: Jumped directly to numbers without a coherent formula or structure.

2. Assumptions & Sanity Checks (0.0 to 4.0):
   - 3.2 - 4.0: Realistic, sensible assumptions grounded in real-world benchmarks; boundary conditions checked.
   - 2.0 - 3.1: Plausible assumptions, but some numbers are overly high/low or unstated.
   - 0.0 - 1.9: Highly unrealistic or ungrounded assumptions that distort the final estimate.

3. Calculation & Order of Magnitude (0.0 to 3.0):
   - 2.5 - 3.0: Clean math, realistic order of magnitude matching the problem scale.
   - 1.5 - 2.4: Math has slight arithmetic or rounding friction; within a plausible range.
   - 0.0 - 1.4: Major arithmetic error or final number off by an order of magnitude.

SCORE & BANDS:
- score = round(structure + assumptions + calculation, 1). Range: 1.0 to 10.0.
- rating:
  * 8.0 to 10.0: "Strong"
  * 6.0 to 7.9: "Good"
  * 1.0 to 5.9: "Needs Improvement"

Respond with ONLY a valid JSON object matching this schema:
{
  "score": <number between 1.0 and 10.0>,
  "rating": "<Strong | Good | Needs Improvement>",
  "rubricBreakdown": {
    "structure": <number 0.0 to 3.0>,
    "assumptions": <number 0.0 to 4.0>,
    "calculation": <number 0.0 to 3.0>
  },
  "summary": "<1-2 sentence constructive assessment>",
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>"],
  "benchmarkComparison": "<1-2 sentences comparing candidate's structure and final number against the benchmark casebook solution>"
}`;

/**
 * Evaluates a candidate's guesstimate practice attempt against the problem's worked benchmark
 * solution using an objective, consistent rubric.
 */
export async function evaluateGuesstimateAttempt(chunkId, question, attempt) {
  let benchmarkSolution = "";
  if (chunkId && typeof chunkId === "string") {
    try {
      const row = await fetchScopedGuesstimateChunk(chunkId);
      if (row?.content) {
        const { answerSource } = splitRawQuestionFromAnswer(row.content);
        benchmarkSolution = answerSource;
      }
    } catch (err) {
      console.warn(`[guesstimateRetrieval] evaluate attempt chunk lookup failed: ${err.message}`);
    }
  }

  const prompt = `GUESSTIMATE PROBLEM:
${question}

${benchmarkSolution ? `CASEBOOK BENCHMARK SOLUTION:\n"""${benchmarkSolution.slice(0, 3000)}"""\n` : ""}
CANDIDATE'S ATTEMPT:
"""${attempt}"""

Evaluate the candidate's attempt in JSON.`;

  try {
    const raw = await generateJSON({
      system: GUESSTIMATE_EVALUATION_SYSTEM,
      prompt,
      maxTokens: 1200,
      temperature: 0.0,
      feature: "guesstimateEvaluate"
    });

    const evaluation = { ...raw };
    let score = typeof evaluation.score === "number" ? evaluation.score : 5.0;
    if (evaluation.rubricBreakdown && typeof evaluation.rubricBreakdown === "object") {
      const b = evaluation.rubricBreakdown;
      const s = typeof b.structure === "number" ? Math.max(0, Math.min(3, b.structure)) : 2.0;
      const a = typeof b.assumptions === "number" ? Math.max(0, Math.min(4, b.assumptions)) : 2.5;
      const c = typeof b.calculation === "number" ? Math.max(0, Math.min(3, b.calculation)) : 2.0;
      score = Number(Math.min(10, Math.max(1, s + a + c)).toFixed(1));
      evaluation.rubricBreakdown = {
        structure: Number(s.toFixed(1)),
        assumptions: Number(a.toFixed(1)),
        calculation: Number(c.toFixed(1))
      };
    } else {
      score = Number(Math.min(10, Math.max(1, score)).toFixed(1));
    }
    evaluation.score = score;
    evaluation.rating = score >= 8.0 ? "Strong" : score >= 6.0 ? "Good" : "Needs Improvement";

    return { found: true, evaluation };
  } catch (err) {
    console.warn(`[guesstimateRetrieval] evaluate attempt failed: ${err.message}`);
    throw err;
  }
}

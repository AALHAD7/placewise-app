import { groundedConsultingLookup, buildCitation, paraphraseAndVerify, AI_FALLBACK_LABEL } from "./consultingRetrieval.js";
import { generateJSON } from "./gemini.js";
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
export function splitRawQuestionFromAnswer(content) {
  const idx = content.indexOf("\n");
  if (idx === -1) {
    return { rawQuestion: GENERIC_QUESTION_FALLBACK, answerSource: content };
  }
  const titleLine = content.slice(0, idx);
  const rawQuestion = titleLine.replace(/^#+\s*/, "").trim();
  const answerSource = content.slice(idx + 1);
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
    .select("content, has_diagram, page_start, page_end, ingest_documents!inner(source_file, school, club, year, source_class)")
    .eq("is_active", true)
    .eq("ingest_documents.source_file", GUESSTIMATES_SOURCE_FILE)
    .eq("ingest_documents.source_class", "club_casebook");

  if (error) {
    console.warn(`[guesstimateRetrieval] random-pick fetch failed: ${error.message}`);
    return { available: false, reason: "not_yet_live", label: AI_FALLBACK_LABEL };
  }

  const rows = (data || []).map(r => ({
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
          citation: buildCitation(row)
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
        citation: buildCitation(row)
      };
    }
  }
  return { available: false, reason: "not_yet_live", label: AI_FALLBACK_LABEL };
}

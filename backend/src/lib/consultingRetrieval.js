import { createHash } from "node:crypto";
import { supabase } from "./supabase.js";
import { embedTexts, generateText, generateJSON } from "./gemini.js";
import { singleFlight } from "./singleFlight.js";

// Same text threshold frameworksGrounding.js already uses (match_document_chunks) -
// kept identical rather than re-derived, since R4's eval hasn't run against this
// pipeline yet (grounded-answering skill: "tune only with eval evidence, log it").
export const SIMILARITY_THRESHOLD = 0.5;
export const DIAGRAM_SIMILARITY_THRESHOLD = 0.58;

export const AI_FALLBACK_LABEL = "General guidance — not from the casebooks";

// R7b (grounded-answering skill, "The paraphrase layer"): off by default, so leaving it
// unset restores today's exact verbatim-excerpt behavior in one step, same reversibility
// posture as ENABLE_CONSULTING_RAG_V2 in frameworksGrounding.js. Read once at module load
// (same pattern as that flag) - a caller must also opt in with `paraphrase: true` on
// groundedConsultingLookup (see below); callers that don't (Guesstimates, Role/Skill
// chips, Company pages) are never touched by this flag, on purpose - this phase (R7b)
// only covers Q&A (qaRetrieval.js) and Frameworks (frameworksGrounding.js).
const ENABLE_ANSWER_PARAPHRASE = process.env.ENABLE_ANSWER_PARAPHRASE === "true";

/**
 * Pure decision: given scored rows from match_ingest_chunks, is this question
 * "covered" by the casebooks? A text row counts at the plain threshold; a row
 * carrying a diagram needs the higher bar (grounded-answering skill - a
 * diagram caption/summary matching loosely is a weaker signal than prose).
 * No I/O, no randomness - the whole reason this is split out from
 * retrieveConsultingChunks is so it's unit-testable without a network call.
 */
export function decideCoverage(rows) {
  const covering = (rows || []).filter(r =>
    r.similarity >= (r.has_diagram ? DIAGRAM_SIMILARITY_THRESHOLD : SIMILARITY_THRESHOLD)
  );
  return { covered: covering.length > 0, rows: covering };
}

/**
 * Pure: turns one match_ingest_chunks row into a citation object. Page
 * numbers and casebook identity come only from the row's own columns -
 * never from the model - per the grounding policy's citation rule.
 */
export function buildCitation(row) {
  return {
    school: row.school || null,
    club: row.club || null,
    casebook: row.source_file,
    year: row.year || null,
    pages: row.page_start === row.page_end ? [row.page_start] : [row.page_start, row.page_end]
  };
}

/**
 * I/O: embeds the query and calls match_ingest_chunks for the given domain.
 * Returns [] (not a throw) on any failure, same resilience posture as
 * frameworksGrounding.js's findGrounding - a retrieval miss must never take
 * down the page it's enriching.
 */
export async function retrieveConsultingChunks(queryText, { domain, matchCount = 6, sourceFile } = {}) {
  try {
    const [queryEmbedding] = await embedTexts([queryText], "RETRIEVAL_QUERY");
    const { data, error } = await supabase.rpc("match_ingest_chunks", {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      filter_domain: domain || null,
      filter_source_file: sourceFile || null
    });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn(`[consultingRetrieval] lookup failed: ${err.message}`);
    return [];
  }
}

/**
 * I/O: a cheap second gate on top of the similarity threshold. The eval found
 * real cases (RICE, Jobs-to-be-Done, "tennis balls in a room", "Uber rides in
 * NYC" - see log.md's 2026-11-02 v2-preview entry) where a chunk cleared
 * 0.63-0.73 similarity while being genuinely unrelated to the question - it
 * shared vocabulary, not topic. A single cosine threshold can't structurally
 * fix that (raising it risks rejecting real matches, on just 4 known
 * examples); a relevance check actually reads the two texts. Same prompt and
 * model tier as the eval's judgeFaithfulness (run_eval.js /
 * run_eval_v2_preview.js) - kept identical on purpose so "would this have
 * been shown" and "did the eval mark it faithful" stay the same question
 * asked the same way.
 */
const RELEVANCE_SYSTEM_PROMPT =
  "You are a strict grader checking whether a casebook excerpt shown VERBATIM to a student " +
  "actually, faithfully and relevantly answers their interview-prep question. The excerpt " +
  "cannot contain any claim beyond itself - your only job is to judge whether it is genuinely " +
  "on-topic and answers what was asked, not just coincidentally sharing vocabulary with the " +
  "question.\n\n" +
  "Watch specifically for this failure mode (found in testing 2026-11-02): a GENERIC " +
  "methodology/approach/framework page (e.g. \"how to approach any guesstimate\", \"demand-side " +
  "approach\", a generic case-cracking framework) can superficially look relevant to almost " +
  "ANY question in its category, because it never names a specific subject. That does NOT make " +
  "it faithful. A generic methodology page is only faithful if the question itself is asking " +
  "for that generic methodology - if the question names a specific entity, company, city, " +
  "quantity or topic (e.g. \"Uber rides in New York City\", \"RICE prioritization\"), the " +
  "excerpt must actually address THAT specific thing, not just be a same-category how-to.\n\n" +
  "Also watch for this different failure mode (found 2026-11-02): an excerpt that is a TABLE " +
  "OF CONTENTS, INDEX, ACKNOWLEDGEMENTS page, or a THEORY/CHEATSHEET/METHODOLOGY overview " +
  "page is NOT a faithful answer, even when it names the exact topic asked about (e.g. an " +
  "index page listing \"Number of orders placed on Swiggy in Delhi\" as a chapter title is " +
  "NOT an answer to a question about Swiggy orders - it only tells you such a chapter " +
  "exists). A faithful excerpt must actually contain the worked content (the assumptions, " +
  "the numbers, the answer), not just reference or list it.\n\n" +
  'Respond with ONLY a JSON object, no markdown fences: {"verdict": "faithful" or ' +
  '"unfaithful", "reasoning": "one sentence explaining your judgment"}';

/**
 * I/O: one judge call, full detail (verdict + reasoning). Exported so the eval
 * (run_eval_v2_preview.js) can do its own 3x voting with per-call reasoning for its report,
 * reusing this exact prompt/call instead of maintaining a second copy of it.
 */
export async function judgeRelevanceOnce(queryText, chunkContent) {
  const parsed = await generateJSON({
    system: RELEVANCE_SYSTEM_PROMPT,
    prompt: `Question: ${queryText}\n\nExcerpt:\n"""${chunkContent.slice(0, 2000)}"""\n\nDoes this excerpt faithfully and relevantly answer the question?`,
    maxTokens: 200,
    temperature: 0,
    feature: "consultingRetrieval-relevance-gate"
  });
  return { faithful: parsed.verdict === "faithful", reasoning: String(parsed.reasoning || "") };
}

/**
 * I/O: 3-call majority vote (>=2/3 "faithful") on top of the similarity threshold, not a
 * single call. Found 2026-11-02: even at temperature 0, a single judge call can flip on a
 * genuinely borderline excerpt (confirmed - Gemini's API isn't perfectly deterministic at
 * the infrastructure level even at temperature 0). Voting 3x costs 3x the judge calls
 * (still flash-lite tier, still cheap) but means one flaky call can't single-handedly flip
 * the outcome. Each call can independently fail (network/parse error); a failed call counts
 * as "unfaithful" (fail closed, see below), not as a missing vote.
 */
export async function judgeRelevance(queryText, chunkContent) {
  const votes = await Promise.all(
    [0, 1, 2].map(() =>
      judgeRelevanceOnce(queryText, chunkContent).then(r => r.faithful).catch(err => {
        // Same resilience posture as retrieveConsultingChunks: a judge failure must not
        // take the page down. Fail closed (treat as irrelevant) rather than open - showing
        // nothing is always safer than showing an unchecked excerpt, per the grounding
        // policy's "show nothing rather than a loosely related excerpt" rule.
        console.warn(`[consultingRetrieval] relevance judge call failed: ${err.message}`);
        return false;
      })
    )
  );
  const faithfulCount = votes.filter(Boolean).length;
  return faithfulCount >= 2;
}

// --- Paraphrase layer (grounded-answering skill, "The paraphrase layer", added 2026-11-02) ---
//
// Showing the retrieved chunk verbatim is the policy today, but Aalhad's call (2026-11-02):
// "the idea or the logic should be the same, but it should be presented in a different
// way." This section rewrites each relevant chunk in plainer language, then gates the
// rewrite with a second, independent Gemini call before ever showing it - never trust the
// paraphrase call alone, same "don't trust the model alone" posture as the coverage
// decision above. A diagram's ```placewise-diagram fence is real JSON the frontend draws
// (diagram-transcription skill) and ingest_chunks' content column stores it inline with
// the surrounding prose (see backend/ingestion/chunk.py's has_diagram) - it is pulled out
// before the chunk ever reaches the paraphrase prompt and spliced back in byte-for-byte
// afterwards, so no model call ever has a chance to touch it, however it's instructed.

const DIAGRAM_FENCE_RE = /```[ \t]*placewise-diagram[ \t]*\n[\s\S]*?\n```/g;
const DIAGRAM_TOKEN_RE = /\[\[PLACEWISE_DIAGRAM_BLOCK_\d+\]\]/g;
const diagramToken = i => `[[PLACEWISE_DIAGRAM_BLOCK_${i}]]`;

/**
 * Pure: pulls every ```placewise-diagram fence out of `content`, replacing each with a
 * numbered placeholder token, so the surrounding prose can be sent to an LLM without the
 * diagram's structured JSON anywhere in the prompt. `blocks[i]` is the exact original text
 * (fence markers included) that belongs back at `diagramToken(i)`.
 */
export function protectDiagramBlocks(content) {
  const blocks = [];
  const placeheld = String(content || "").replace(DIAGRAM_FENCE_RE, match => {
    const token = diagramToken(blocks.length);
    blocks.push(match);
    return token;
  });
  return { placeheld, blocks };
}

/**
 * Pure: the inverse of protectDiagramBlocks. Returns null (not a best-effort partial
 * splice) if any token isn't present exactly once in `text` - a model that drops, moves-
 * out-of-pair, or duplicates a placeholder is a sign it may have also touched the
 * surrounding instruction not to alter the diagram, and fail-closed here means that
 * output is discarded by the caller rather than shown with a missing/garbled diagram.
 */
export function restoreDiagramBlocks(text, blocks) {
  let result = text;
  for (let i = 0; i < blocks.length; i++) {
    const token = diagramToken(i);
    const occurrences = result.split(token).length - 1;
    if (occurrences !== 1) return null;
    result = result.replace(token, blocks[i]);
  }
  return result;
}

const PARAPHRASE_SYSTEM_PROMPT =
  "You are rewriting a casebook excerpt in clearer, more natural plain language for an " +
  "MBA student preparing for case/consulting interviews. You may reorder sentences, " +
  "simplify sentence structure, and add connective or explanatory phrasing that makes the " +
  "logic easier to follow. You must NOT introduce any claim, number, name, step or example " +
  "that is not already present in the excerpt - the idea and the logic must stay exactly " +
  "the same; only the presentation changes.\n\n" +
  "The excerpt may contain placeholder tokens of the exact form [[PLACEWISE_DIAGRAM_BLOCK_N]] " +
  "(N is a number) standing in for a diagram that has been removed for this step. Copy every " +
  "such token through to your output EXACTLY as written, in the same relative position in " +
  "the text, with nothing paraphrased, translated, or added around its brackets - never " +
  "alter, remove, duplicate, or re-word a token.\n\n" +
  "Respond with ONLY the rewritten excerpt text - no preamble, no markdown fences, no " +
  "commentary about what you changed.";

/**
 * I/O: rewrites one chunk's prose (never its diagram JSON, see protectDiagramBlocks
 * above). Returns `chunkContent` unchanged, with no Gemini call at all, when there is no
 * prose to rewrite (a chunk that is purely a diagram block). Throws if the model drops a
 * diagram placeholder token - the caller (paraphraseAndVerify) treats that the same as any
 * other paraphrase failure: fall back to the verbatim excerpt.
 */
export async function paraphraseChunk(queryText, chunkContent) {
  const { placeheld, blocks } = protectDiagramBlocks(chunkContent);
  const proseOnly = placeheld.replace(DIAGRAM_TOKEN_RE, "").trim();
  if (!proseOnly) return chunkContent;

  const rewritten = await generateText({
    system: PARAPHRASE_SYSTEM_PROMPT,
    prompt: `Student's question: ${queryText}\n\nCasebook excerpt:\n"""${placeheld}"""`,
    maxTokens: 900,
    temperature: 0.3,
    feature: "consultingRetrieval-paraphrase"
  });

  if (!blocks.length) return rewritten.trim();
  const restored = restoreDiagramBlocks(rewritten, blocks);
  if (restored == null) {
    throw new Error("paraphrase dropped, duplicated, or moved a diagram placeholder token");
  }
  return restored;
}

// A different question from RELEVANCE_SYSTEM_PROMPT above ("does this chunk answer the
// question") - this asks only "does the rewrite still say only what the original said",
// so it is kept as a fully separate prompt and a fully separate call, never conflated.
const FAITHFULNESS_SYSTEM_PROMPT =
  "You are a strict grader checking whether a REWRITE of a casebook excerpt is faithful to " +
  "the ORIGINAL excerpt. The rewrite is allowed to reorder sentences, simplify phrasing, " +
  "and add connective/explanatory language - that is expected and fine. What is NOT fine: " +
  "the rewrite containing any claim, number, name, step or example the original did not " +
  "contain; or the rewrite dropping, changing, or garbling a number, name or step the " +
  "original DID contain. This is not a judgment of whether the rewrite answers any " +
  "particular question - only whether the rewrite is faithful to the original excerpt.\n\n" +
  'Respond with ONLY a JSON object, no markdown fences: {"verdict": "faithful" or ' +
  '"unfaithful", "reasoning": "one sentence explaining your judgment"}';

/**
 * I/O: one judge call, full detail (verdict + reasoning) - exported for the same reason
 * judgeRelevanceOnce is (so an eval script can do its own voting/report with this exact
 * prompt instead of maintaining a second copy of it).
 */
export async function judgeParaphraseFaithfulOnce(original, paraphrase) {
  const parsed = await generateJSON({
    system: FAITHFULNESS_SYSTEM_PROMPT,
    prompt: `Original excerpt:\n"""${original.slice(0, 2000)}"""\n\nRewrite:\n"""${paraphrase.slice(0, 2000)}"""\n\nIs the rewrite faithful to the original?`,
    maxTokens: 200,
    temperature: 0,
    feature: "consultingRetrieval-paraphrase-faithfulness"
  });
  return { faithful: parsed.verdict === "faithful", reasoning: String(parsed.reasoning || "") };
}

/**
 * Pure: the vote-counting decision itself, pulled out of judgeParaphraseFaithful so it's
 * unit-testable without any network call - same reasoning as decideCoverage being split
 * out from retrieveConsultingChunks. `votes` is an array of booleans; a failed call is
 * expected to already have been converted to `false` by the caller (fail-closed) before
 * it ever reaches here, so this function only ever has to count, never decide what a
 * failure means.
 */
export function faithfulMajority(votes) {
  return votes.filter(Boolean).length >= 2;
}

/**
 * I/O: 3-call majority vote (>=2/3 "faithful"), same voting/fail-closed shape as
 * judgeRelevance above - one flaky call can't single-handedly flip the outcome, and a
 * failed call counts as "unfaithful" (showing the verbatim excerpt is always safe; a
 * possibly-distorted rewrite silently shown is not).
 */
export async function judgeParaphraseFaithful(original, paraphrase) {
  const votes = await Promise.all(
    [0, 1, 2].map(() =>
      judgeParaphraseFaithfulOnce(original, paraphrase).then(r => r.faithful).catch(err => {
        console.warn(`[consultingRetrieval] faithfulness judge call failed: ${err.message}`);
        return false;
      })
    )
  );
  return faithfulMajority(votes);
}

// Bump when PARAPHRASE_SYSTEM_PROMPT or FAITHFULNESS_SYSTEM_PROMPT changes materially -
// folded into the cache key below so a prompt change invalidates old cached paraphrases
// instead of serving them forever (the exact unbounded-cache bug fixed 2026-11-02 in
// frameworksGrounding.js's withGroundedExamples - see isStale there).
const PARAPHRASE_PROMPT_VERSION = "1";
// Same 7-day window as frameworksGrounding.js's GROUNDED_STALE_AFTER_MS - long enough to
// save almost every repeat request from re-paying the paraphrase + 3 judge calls, short
// enough that a prompt fix still reaches users within days.
const PARAPHRASE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// In-memory only, per process - same posture as companyLogo.js's cache, not a DB table
// (this phase touches no database schema). Keyed on the chunk's own content, not the
// question that happened to retrieve it, so the same excerpt surfaced by two different
// questions is only ever paraphrased once.
const paraphraseCache = new Map();

function hashChunkContent(content) {
  return createHash("sha1").update(content).digest("hex");
}

async function computeParaphraseResult(queryText, chunkContent) {
  try {
    const paraphrase = await paraphraseChunk(queryText, chunkContent);
    if (paraphrase === chunkContent) {
      // Nothing to rewrite (a pure-diagram chunk) - verbatim is already correct, no
      // faithfulness call needed.
      return { content: chunkContent, rawContent: chunkContent, paraphrased: false };
    }
    const faithful = await judgeParaphraseFaithful(chunkContent, paraphrase);
    return faithful
      ? { content: paraphrase, rawContent: chunkContent, paraphrased: true }
      : { content: chunkContent, rawContent: chunkContent, paraphrased: false };
  } catch (err) {
    // Fail closed: a paraphrase call error (quota, network, dropped diagram token) must
    // never take the answer down, and must never show something unchecked - fall back to
    // the raw excerpt, same resilience posture as retrieveConsultingChunks/judgeRelevance.
    console.warn(`[consultingRetrieval] paraphrase failed, falling back to verbatim excerpt: ${err.message}`);
    return { content: chunkContent, rawContent: chunkContent, paraphrased: false };
  }
}

/**
 * I/O: paraphrase one chunk and gate it with the faithfulness judge, caching the outcome
 * per chunk content (see paraphraseCache above) so concurrent/repeat requests for the same
 * excerpt don't re-pay the paraphrase + 3 judge calls (singleFlight dedupes concurrent
 * callers for the same key, same shape as companyLogo.js/roleTopics.js).
 */
export async function paraphraseAndVerify(queryText, chunkContent) {
  const key = `${PARAPHRASE_PROMPT_VERSION}:${hashChunkContent(chunkContent)}`;
  const cached = paraphraseCache.get(key);
  if (cached && Date.now() - cached.cachedAt < PARAPHRASE_CACHE_TTL_MS) return cached.value;

  return singleFlight(`paraphrase:${key}`, async () => {
    const value = await computeParaphraseResult(queryText, chunkContent);
    paraphraseCache.set(key, { value, cachedAt: Date.now() });
    return value;
  });
}

async function paraphraseRowForOutput(queryText, row) {
  const { content, rawContent, paraphrased } = await paraphraseAndVerify(queryText, row.content);
  return { content, rawContent, paraphrased, hasDiagram: row.has_diagram, similarity: row.similarity };
}

/**
 * Full grounded lookup for one query: retrieve, decide coverage, relevance-
 * check every surviving candidate, and either return casebook-only material
 * with citations, or the labelled "not covered" marker - never both blended
 * (grounding policy, CLAUDE.md). The relevance gate is deliberately kept out
 * of decideCoverage (which stays pure/unit-testable, no I/O) and applied
 * here instead, after the threshold filter - cheapest-check-first, so the
 * judge only ever runs on rows that already cleared similarity.
 *
 * `paraphrase` (default false - every existing caller is untouched unless it explicitly
 * opts in) additionally runs the paraphrase layer on each surviving chunk when
 * ENABLE_ANSWER_PARAPHRASE is also on. R7b only wires this from qaRetrieval.js (Q&A) and
 * frameworksGrounding.js's findGroundingV2 (Frameworks) - Guesstimates, Role/Skill chips
 * and Company pages don't pass it, so this flag can never change their output, this phase
 * or later. When paraphrase runs and is used, each chunk also carries `rawContent` (the
 * original verbatim excerpt) and `paraphrased: true` - callers that need the verbatim text
 * for any reason (or want to show both) have it; callers that just read `.content` (every
 * caller today) get the paraphrase transparently and don't need to change.
 */
export async function groundedConsultingLookup(queryText, { domain = "Consulting", matchCount = 6, sourceFile, paraphrase = false } = {}) {
  const rows = await retrieveConsultingChunks(queryText, { domain, matchCount, sourceFile });
  const { covered, rows: coveringRows } = decideCoverage(rows);

  if (!covered) {
    return { covered: false, label: AI_FALLBACK_LABEL, chunks: [], citations: [] };
  }

  const verdicts = await Promise.all(coveringRows.map(r => judgeRelevance(queryText, r.content)));
  const relevantRows = coveringRows.filter((_, i) => verdicts[i]);

  if (relevantRows.length === 0) {
    return { covered: false, label: AI_FALLBACK_LABEL, chunks: [], citations: [] };
  }

  // Flag off (or caller didn't opt in): exactly today's shape, no paraphrase call, no new
  // keys - byte-identical to pre-R7b output.
  const chunks = (paraphrase && ENABLE_ANSWER_PARAPHRASE)
    ? await Promise.all(relevantRows.map(r => paraphraseRowForOutput(queryText, r)))
    : relevantRows.map(r => ({
        content: r.content,
        hasDiagram: r.has_diagram,
        similarity: r.similarity
      }));

  return {
    covered: true,
    label: null,
    chunks,
    citations: relevantRows.map(buildCitation)
  };
}

import { supabase } from "./supabase.js";
import { embedTexts, generateJSON } from "./gemini.js";

// Same text threshold frameworksGrounding.js already uses (match_document_chunks) -
// kept identical rather than re-derived, since R4's eval hasn't run against this
// pipeline yet (grounded-answering skill: "tune only with eval evidence, log it").
export const SIMILARITY_THRESHOLD = 0.5;
export const DIAGRAM_SIMILARITY_THRESHOLD = 0.58;

export const AI_FALLBACK_LABEL = "General guidance — not from the casebooks";

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
export async function judgeRelevance(queryText, chunkContent) {
  try {
    const parsed = await generateJSON({
      system:
        "You are a strict grader checking whether a casebook excerpt shown VERBATIM to a student " +
        "actually, faithfully and relevantly answers their interview-prep question. The excerpt " +
        "cannot contain any claim beyond itself - your only job is to judge whether it is genuinely " +
        "on-topic and answers what was asked, not just coincidentally sharing vocabulary with the " +
        'question. Respond with ONLY a JSON object, no markdown fences: {"verdict": "faithful" or ' +
        '"unfaithful", "reasoning": "one sentence explaining your judgment"}',
      prompt: `Question: ${queryText}\n\nExcerpt:\n"""${chunkContent.slice(0, 2000)}"""\n\nDoes this excerpt faithfully and relevantly answer the question?`,
      maxTokens: 200,
      feature: "consultingRetrieval-relevance-gate"
    });
    return parsed.verdict === "faithful";
  } catch (err) {
    // Same resilience posture as retrieveConsultingChunks: a judge failure
    // must not take the page down. Fail closed (treat as irrelevant) rather
    // than open - showing nothing is always safer than showing an unchecked
    // excerpt, per the grounding policy's "show nothing rather than a
    // loosely related excerpt" rule.
    console.warn(`[consultingRetrieval] relevance judge failed: ${err.message}`);
    return false;
  }
}

/**
 * Full grounded lookup for one query: retrieve, decide coverage, relevance-
 * check every surviving candidate, and either return casebook-only material
 * with citations, or the labelled "not covered" marker - never both blended
 * (grounding policy, CLAUDE.md). The relevance gate is deliberately kept out
 * of decideCoverage (which stays pure/unit-testable, no I/O) and applied
 * here instead, after the threshold filter - cheapest-check-first, so the
 * judge only ever runs on rows that already cleared similarity.
 */
export async function groundedConsultingLookup(queryText, { domain = "Consulting", matchCount = 6, sourceFile } = {}) {
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

  return {
    covered: true,
    label: null,
    chunks: relevantRows.map(r => ({
      content: r.content,
      hasDiagram: r.has_diagram,
      similarity: r.similarity
    })),
    citations: relevantRows.map(buildCitation)
  };
}

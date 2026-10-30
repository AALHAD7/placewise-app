import { supabase } from "./supabase.js";
import { embedTexts } from "./gemini.js";

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
 * Full grounded lookup for one query: retrieve, decide coverage, and either
 * return casebook-only material with citations, or the labelled "not
 * covered" marker - never both blended (grounding policy, CLAUDE.md).
 */
export async function groundedConsultingLookup(queryText, { domain = "Consulting", matchCount = 6, sourceFile } = {}) {
  const rows = await retrieveConsultingChunks(queryText, { domain, matchCount, sourceFile });
  const { covered, rows: coveringRows } = decideCoverage(rows);

  if (!covered) {
    return { covered: false, label: AI_FALLBACK_LABEL, chunks: [], citations: [] };
  }

  return {
    covered: true,
    label: null,
    chunks: coveringRows.map(r => ({
      content: r.content,
      hasDiagram: r.has_diagram,
      similarity: r.similarity
    })),
    citations: coveringRows.map(buildCitation)
  };
}

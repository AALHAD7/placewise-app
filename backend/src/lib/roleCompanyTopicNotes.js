import { supabase } from "./supabase.js";
import { generateJSON, embedTexts } from "./gemini.js";
import { normalizeCacheKey } from "./cacheKey.js";
import { singleFlight } from "./singleFlight.js";
import { CONTENT_VERSION } from "./contentVersion.js";
import { ROLE_CONTENT_RULES } from "./roleContentRules.js";
import { resolveAliasGroup, mentionsCompany } from "./companyMatcher.js";
import { retrieveConsultingChunks, buildCitation } from "./consultingRetrieval.js";

// G2 switch, same env var and off-by-default posture as frameworksGrounding.js/
// roleTopics.js/chipPanel.js. The mention-gate below (not a similarity
// threshold) is the real grounding requirement here, unchanged by this
// switch - this only changes WHERE the candidate chunks come from, so a hit
// can carry a real page citation instead of none at all.
const CONSULTING_RAG_V2_ENABLED = process.env.ENABLE_CONSULTING_RAG_V2 === "true";

// "How this shows up by company" (Phase 1 amendment C) - split out of the
// topics call entirely so it can carry its own, much stricter grounding
// requirement: generate only when real casebook chunks actually mention
// this company by name.
//
// document_chunks has no structured company column (its source_file values
// are casebook filenames like "FMS_Casebook_20-21.txt" - college/year, not
// company) - so "chunks for that company" can only be checked honestly by
// real text matching on the retrieved chunks' content, not a column lookup.
// Vector similarity alone can't gate this: it always ranks and returns
// *something* for any query, with no natural "no real match" signal, so
// trusting top-K retrieval alone here would let the model generate off
// casebook text that never actually mentions the company - exactly the
// fabrication risk this amendment exists to close.
//
// Phase 1.5 item 4: that match is now alias-aware (companyMatcher.js) - a
// chunk saying "BCG" now correctly counts for a company typed as "Boston
// Consulting Group" - and exclusion-filtered, so "BCG matrix" doesn't
// falsely count as a BCG mention.
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MATCH_COUNT = 10;

// v1: document_chunks has no page number, so a hit here can never carry a
// real citation - only the excerpt text, same invisible-blend limitation
// as roleTopics.js v1 (not fixed here; v2 below replaces the data source).
async function retrieveCompanyChunksV1(roleName, companyName) {
  try {
    const aliases = await resolveAliasGroup(companyName);
    const [queryEmbedding] = await embedTexts(
      [`${companyName} ${roleName} interview case study experience`],
      "RETRIEVAL_QUERY"
    );
    const { data: chunks } = await supabase.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_count: MATCH_COUNT,
      filter_domain: null
    });
    // The real gate: keep only chunks whose own text actually names the
    // company (via any real alias, exclusions applied). A chunk that merely
    // ranked high on vector similarity (every query gets ranked results)
    // but never mentions the company is not "casebook data for this
    // company" and must not ground anything.
    const mentioning = (chunks || []).filter(c => mentionsCompany(c.content || "", aliases));
    return { context: mentioning.map((c, i) => `[Source ${i + 1}: ${c.source_file}]\n${c.content}`).join("\n\n---\n\n"), citations: [] };
  } catch {
    return { context: "", citations: [] };
  }
}

// v2: same mention-gate (vector similarity alone still can't tell "ranked
// high" from "actually about this company" - see the note above), but
// against ingest_chunks via consultingRetrieval.js, so a real hit carries a
// real page citation (school/casebook/page) instead of none. Hardcoded to
// domain "Consulting" for the same reason as roleTopics.js v2 - no
// per-role domain signal exists yet, and this is the only ingested domain.
async function retrieveCompanyChunksV2(roleName, companyName) {
  const aliases = await resolveAliasGroup(companyName);
  const rows = await retrieveConsultingChunks(`${companyName} ${roleName} interview case study experience`, {
    domain: "Consulting", matchCount: MATCH_COUNT
  });
  const mentioning = rows.filter(r => mentionsCompany(r.content || "", aliases));
  return {
    context: mentioning.map((c, i) => `[Source ${i + 1}]\n${c.content}`).join("\n\n---\n\n"),
    citations: mentioning.map(buildCitation)
  };
}

/**
 * Pure: attribution is at the "this whole note set drew on these mentions"
 * level, not per-sentence (same honest limit as roleTopics.js v2) - every
 * topic that got a note is tagged with the full set of company-mention
 * citations that fed the prompt, only when v2 actually ran (v1 has none,
 * mentionCitations is then []). Pulled out of fetchRoleCompanyTopicNotes so
 * this wiring is unit-testable without a live retrieval call.
 */
export function buildNoteCitations(notes, mentionCitations) {
  if (!mentionCitations || !mentionCitations.length) return {};
  return Object.fromEntries(Object.keys(notes).map(topic => [topic, mentionCitations]));
}

async function retrieveCompanyChunks(roleName, companyName) {
  if (CONSULTING_RAG_V2_ENABLED) {
    try {
      return await retrieveCompanyChunksV2(roleName, companyName);
    } catch (err) {
      console.warn(`[roleCompanyTopicNotes] v2 retrieval failed for "${roleName}"/"${companyName}", falling back to v1: ${err.message}`);
    }
  }
  return retrieveCompanyChunksV1(roleName, companyName);
}

const SYSTEM_PROMPT = `${ROLE_CONTENT_RULES}

You are writing short notes on how specific interview topics for a job role tend to show up at ONE specific company, strictly from real casebook excerpts about that company you are given below - never from general knowledge about the company. You will also be given the role's list of topic names.

For each topic the CONTEXT excerpts genuinely speak to, write one 1-2 sentence note grounded in what the excerpts actually say. If the excerpts don't say anything relevant to a given topic, omit that topic from the output entirely - do not fill it in with a generic or invented note.

Respond with ONLY a JSON object, no markdown fences, no commentary: {"notes": {"<topic name exactly as given>": "<note>", ...only topics the excerpts actually support}}`;

export async function getRoleCompanyTopicNotes(roleName, companyName, topicNames) {
  const roleKey = normalizeCacheKey(roleName);
  const companyKey = normalizeCacheKey(companyName);
  return singleFlight(
    `roleCompanyTopicNotes:${roleKey}::${companyKey}`,
    () => fetchRoleCompanyTopicNotes(roleName, companyName, topicNames, roleKey, companyKey)
  );
}

async function fetchRoleCompanyTopicNotes(roleName, companyName, topicNames, roleKey, companyKey) {
  const { data: cached, error: cacheError } = await supabase
    .from("role_company_topic_notes_cache")
    .select("*")
    .eq("role_name", roleKey)
    .eq("company_name", companyKey)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const isFresh = cached && cached.content_version === CONTENT_VERSION && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return { notes: cached.notes || {}, cached: true, fetchedAt: cached.fetched_at, citations: cached.citations || {} };
  }

  const { context, citations: mentionCitations } = await retrieveCompanyChunks(roleName, companyName);
  // No real casebook mentions of this company at all - hide the section
  // rather than ever calling the model with nothing to ground it in.
  if (!context) {
    const row = { role_name: roleKey, company_name: companyKey, content_version: CONTENT_VERSION, notes: {}, citations: {}, fetched_at: new Date().toISOString() };
    const { error: upsertError } = await supabase
      .from("role_company_topic_notes_cache")
      .upsert(row, { onConflict: "role_name,company_name,content_version" });
    if (upsertError) throw upsertError;
    return { notes: {}, cached: false, fetchedAt: row.fetched_at, citations: {} };
  }

  const prompt = `CONTEXT (real casebook excerpts that mention ${companyName} by name):\n${context}\n\nROLE: ${roleName}\nCOMPANY: ${companyName}\nTOPICS: ${topicNames.join(", ")}\n\nGenerate the notes JSON as specified.`;
  const result = await generateJSON({ system: SYSTEM_PROMPT, prompt, maxTokens: 500 });
  const notes = result.notes && typeof result.notes === "object" && !Array.isArray(result.notes) ? result.notes : {};
  const citations = buildNoteCitations(notes, mentionCitations);

  const row = { role_name: roleKey, company_name: companyKey, content_version: CONTENT_VERSION, notes, citations, fetched_at: new Date().toISOString() };
  const { error: upsertError } = await supabase
    .from("role_company_topic_notes_cache")
    .upsert(row, { onConflict: "role_name,company_name,content_version" });
  if (upsertError) throw upsertError;

  return { notes, cached: false, fetchedAt: row.fetched_at, citations };
}

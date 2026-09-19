import { supabase } from "./supabase.js";
import { generateJSON, embedTexts } from "./gemini.js";

// Same long TTL rationale as roleOverview.js - an interview curriculum for a
// role doesn't shift week to week.
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Same RAG pattern as resume.js/mockInterview.js/story.js: pull real
// excerpts from the ingested casebook corpus (document_chunks) so
// practicePrompts/pitfalls/the modelAnswer walkthrough can draw on actual
// interview cases instead of being invented from parametric knowledge alone.
// No domain filter - searches the whole corpus, same as those three (there's
// no UI concept of "domain" on the Role tab, and vector similarity already
// favors whichever ingested domain is actually relevant to the role).
async function retrieveContext(roleName) {
  try {
    const [queryEmbedding] = await embedTexts(
      [`${roleName} interview preparation case studies frameworks practice questions`],
      "RETRIEVAL_QUERY"
    );
    const { data: chunks } = await supabase.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_count: 8,
      filter_domain: null
    });
    return (chunks || []).map((c, i) => `[Source ${i + 1}: ${c.source_file}]\n${c.content}`).join("\n\n---\n\n");
  } catch {
    return "";
  }
}

// The "companyNotes" field is the one part of this content with real
// fabrication risk - it's tempting for a model to state a specific named
// company's actual interview quirks with false confidence. The instruction
// below is deliberately explicit about that, same anti-fabrication discipline
// already used in companyOverview.js's SYSTEM_PROMPT.
const SYSTEM_PROMPT = `You are building an interview-prep curriculum for a specific job role, for a student preparing for campus placements in India. You will be given a role title, and may be given CONTEXT excerpts from real interview casebooks.

If CONTEXT is provided, ground practicePrompts, pitfalls, and the modelAnswer's prompt/walkthrough in it where a topic genuinely matches something in the excerpts - prefer a real scenario from CONTEXT over an invented one when it fits. Don't force an irrelevant excerpt into a topic it doesn't actually match, and don't claim something is "from a real case" if it isn't - if CONTEXT is empty or doesn't fit a given topic, fall back to standard interview-prep knowledge for that topic instead.

Generate exactly 4 topics that interviewers for this role actually test. For each topic:
- "points": 3-4 short bullet phrases naming the sub-skills tested within this topic.
- "concept": 2-4 sentences explaining what this topic is really testing and why interviewers care about it (not a dictionary definition).
- "frameworks": 2-3 named frameworks/mental models relevant to this topic, each with "answers" (what question it helps answer) and "whenNotToUse" (a real limitation or a situation where a different approach is better).
- "modelAnswer": one realistic interview prompt for this topic ("prompt"), and a "walkthrough" of 4-5 sentences showing a strong structured answer to it, written as first-person reasoning steps (hypothesis, then supporting reasoning, then a recommendation) - not a generic essay.
- "pitfalls": 3-4 specific mistakes candidates commonly make on this topic.
- "practicePrompts": 3 short practice questions on this topic, each tagged "difficulty": "Easy", "Medium", or "Hard".
- "companyNotes": 2-3 entries, each {"company": "<a real, well-known Indian or India-relevant employer of this role type>", "note": "<one sentence on how this topic tends to show up there>"}. Be honest about uncertainty here specifically: frame each note as a general, typical pattern for that company's sector/scale/style ("expect X because they operate at Y scale" / "commonly framed around Z, consistent with their business model"), not a confident claim about that exact company's actual current interview process, which you cannot verify. If you are not confident enough to say something reasonably grounded in that company's known business/public profile, name a different, more suitable company instead rather than inventing specifics.

Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"topics": [{"name": "...", "points": [...], "concept": "...", "frameworks": [{"name":"...","answers":"...","whenNotToUse":"..."}], "modelAnswer": {"prompt": "...", "walkthrough": ["...", "..."]}, "pitfalls": [...], "practicePrompts": [{"question":"...","difficulty":"Easy"}], "companyNotes": [{"company":"...","note":"..."}]}, ...4 topics total]}`;

/**
 * @param {string} roleName - must already be a canonical role (see resolveRoleTitle)
 * @returns {Promise<{topics, cached, fetchedAt}>}
 */
export async function getRoleTopics(roleName) {
  const { data: cached, error: cacheError } = await supabase
    .from("role_topics_cache")
    .select("*")
    .eq("role_name", roleName)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const isFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return { topics: cached.topics, cached: true, fetchedAt: cached.fetched_at };
  }

  const context = await retrieveContext(roleName);
  const prompt = `${context ? `CONTEXT (real interview casebook excerpts - use where genuinely relevant, don't force-fit):\n${context}\n\n` : ""}ROLE: ${roleName}\n\nGenerate the 4-topic interview-prep curriculum JSON as specified.`;
  const result = await generateJSON({ system: SYSTEM_PROMPT, prompt, maxTokens: 8000 });
  const topics = Array.isArray(result.topics) ? result.topics : [];

  const row = { role_name: roleName, topics, fetched_at: new Date().toISOString() };
  const { error: upsertError } = await supabase
    .from("role_topics_cache")
    .upsert(row, { onConflict: "role_name" });
  if (upsertError) throw upsertError;

  return { topics, cached: false, fetchedAt: row.fetched_at };
}

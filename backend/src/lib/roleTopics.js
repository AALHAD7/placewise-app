import { supabase } from "./supabase.js";
import { generateJSON, embedTexts } from "./gemini.js";
import { normalizeCacheKey } from "./cacheKey.js";
import { singleFlight } from "./singleFlight.js";
import { CONTENT_VERSION } from "./contentVersion.js";
import { ROLE_CONTENT_RULES } from "./roleContentRules.js";
import { checkContentBatch, repairExplanation, verifyPracticePromptOrReplace } from "./contentVerifier.js";
import { groundedConsultingLookup } from "./consultingRetrieval.js";

// Same long TTL rationale as roleOverview.js - an interview curriculum for a
// role doesn't shift week to week.
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// G2 switch (pulled forward ahead of its normal M3 sequencing - Aalhad's
// explicit call, see log.md). Off by default, so flipping it off restores
// today's exact v1 behavior below. Same posture as frameworksGrounding.js's
// CONSULTING_RAG_V2_ENABLED - deliberately the same env var, since both are
// "is the new ingest_chunks pipeline live for Consulting content" questions,
// not independent toggles.
const CONSULTING_RAG_V2_ENABLED = process.env.ENABLE_CONSULTING_RAG_V2 === "true";

// v1: pull real excerpts from the OLD corpus (document_chunks) and hand
// them to the model as loose "context" it may or may not actually use in
// any given field. Same RAG pattern as resume.js/mockInterview.js/story.js.
// No domain filter - searches the whole corpus (there's no UI concept of
// "domain" on the Role tab, and vector similarity already favors whichever
// ingested domain is actually relevant to the role).
//
// Known, deliberate limitation of this v1 path (not fixed here): the model
// is told context may be used "where genuinely relevant" but is never asked
// to report WHICH excerpt it actually drew on, so there is no way to show a
// real citation for this path - document_chunks itself has no page number
// to cite even if the model did report it. This is exactly the "invisible
// blend" the grounding policy forbids; v2 below replaces it with an
// explicit grounded-or-not decision instead of trying to retrofit
// per-sentence attribution onto a model call that can't reliably produce
// it.
async function retrieveContextV1(roleName) {
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

// v2: one retrieval against the new ingest_chunks pipeline, then ONE
// explicit covered/not-covered decision for the whole curriculum (not a
// per-field guess) - the response either carries real page citations for
// content it actually drew on, or is labelled not-grounded. Hardcoded to
// domain "Consulting" because that's the only domain re-ingested so far
// (R6) - there is no domain concept on roles themselves (roleName is free
// text), so this intentionally queries the Consulting slice of the corpus
// regardless of what role is asked about. A role genuinely unrelated to
// consulting case prep (e.g. "Data Scientist") will correctly come back
// not-covered rather than being force-matched to irrelevant excerpts. Once
// M2 ingests other domains, this will need an actual per-role domain signal
// to stay accurate - flagged here rather than silently assumed permanent.
async function retrieveContextV2(roleName) {
  const query = `${roleName} interview preparation case studies frameworks practice questions`;
  const result = await groundedConsultingLookup(query, { domain: "Consulting" });
  if (!result.covered) return { context: "", groundedInCasebooks: false, citations: [] };
  const context = result.chunks.map((c, i) => `[Source ${i + 1}]\n${c.content}`).join("\n\n---\n\n");
  return { context, groundedInCasebooks: true, citations: result.citations };
}

async function retrieveContext(roleName) {
  if (CONSULTING_RAG_V2_ENABLED) {
    try {
      return await retrieveContextV2(roleName);
    } catch (err) {
      console.warn(`[roleTopics] v2 retrieval failed for "${roleName}", falling back to v1: ${err.message}`);
      // Fall through to v1 below, same resilience posture as
      // frameworksGrounding.js - a v2 failure must never take down Topics.
    }
  }
  const context = await retrieveContextV1(roleName);
  return { context, groundedInCasebooks: false, citations: [] };
}

// companyNotes ("How this shows up by company") moved OUT of this call
// entirely (Phase 1 amendment C) - it's the one field here that was real
// fabrication risk (a model stating a specific named company's actual
// interview quirks with false confidence, on nothing but "be honest"
// framing). It now lives in roleCompanyTopicNotes.js, keyed by (role,
// company), gated on casebook RAG actually mentioning that company by name
// - a real grounding requirement, not just an instruction to be careful.
// This call stays company-agnostic, which is also why it can stay cached by
// role alone.
const SYSTEM_PROMPT = `${ROLE_CONTENT_RULES}

You are building an interview-prep curriculum for a specific job role, for a student preparing for campus placements in India. You will be given a role title, and may be given CONTEXT excerpts from real interview casebooks.

If CONTEXT is provided, ground practicePrompts, pitfalls, and the modelAnswer's prompt/walkthrough in it where a topic genuinely matches something in the excerpts - prefer a real scenario from CONTEXT over an invented one when it fits. Don't force an irrelevant excerpt into a topic it doesn't actually match, and don't claim something is "from a real case" if it isn't - if CONTEXT is empty or doesn't fit a given topic, fall back to standard interview-prep knowledge for that topic instead.

Generate exactly 4 topics that interviewers for this role actually test. For each topic:
- "points": 3-4 short bullet phrases naming the sub-skills tested within this topic.
- "concept": 2-4 sentences explaining what this topic is really testing and why interviewers care about it (not a dictionary definition).
- "frameworks": 2-3 named frameworks/mental models relevant to this topic, each with "answers" (what question it helps answer) and "whenNotToUse" (a real limitation or a situation where a different approach is better).
- "modelAnswer": one realistic interview prompt for this topic ("prompt"), and a "walkthrough" of 4-5 sentences showing a strong structured answer to it, written as first-person reasoning steps (hypothesis, then supporting reasoning, then a recommendation) - not a generic essay.
- "pitfalls": 3-4 specific mistakes candidates commonly make on this topic.
- "practicePrompts": 3 short practice questions on this topic, each tagged "difficulty": "Easy", "Medium", or "Hard".

Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"topics": [{"name": "...", "points": [...], "concept": "...", "frameworks": [{"name":"...","answers":"...","whenNotToUse":"..."}], "modelAnswer": {"prompt": "...", "walkthrough": ["...", "..."]}, "pitfalls": [...], "practicePrompts": [{"question":"...","difficulty":"Easy"}]}, ...4 topics total]}`;

// Targeted single-field regeneration for a topic's modelAnswer that failed
// the content check - re-asks for just that one field on that one topic
// rather than re-running the whole 4-topic batch (cheaper, and doesn't risk
// a "fixed" field getting re-broken by a regeneration of a different one).
// Phase 1.7 item 4: given the actual issue text from the failed check, so
// the regeneration targets the real problem instead of blindly re-rolling.
async function regenerateModelAnswer(roleName, topicName, context, issue) {
  const result = await generateJSON({
    system: `${ROLE_CONTENT_RULES}\n\nYou are regenerating ONE field of an interview-prep topic because the previous version failed a content check. Respond with ONLY a JSON object: {"modelAnswer": {"prompt": "one realistic interview prompt for this topic", "walkthrough": ["4-5 sentences, first-person reasoning steps, strictly on-topic, every number recomputed correctly, no company name unless this topic genuinely requires one"]}}`,
    prompt: `${context ? `CONTEXT:\n${context}\n\n` : ""}ROLE: ${roleName}\nTOPIC: ${topicName}\n\nThe previous version had this problem: ${issue}. Fix it and keep everything else correct. Regenerate the modelAnswer field.`,
    maxTokens: 900
  });
  return result.modelAnswer;
}

function modelAnswerText(modelAnswer) {
  return `${modelAnswer.prompt}\n${(modelAnswer.walkthrough || []).join(" ")}`;
}

// A single fresh practice prompt at a given difficulty - used both to retry
// the same slot and, if it still fails after 2 attempts, to replace it with
// a different question entirely (Phase 1.5: a practice prompt is never
// shown unverified, so a persistent failure gets swapped out rather than
// shown with a notice).
async function generateOnePracticePrompt(roleName, topicName, difficulty, context) {
  const result = await generateJSON({
    system: `${ROLE_CONTENT_RULES}\n\nYou are writing ONE practice question for an interview-prep topic. Respond with ONLY a JSON object: {"question": "...", "difficulty": "${difficulty}"}`,
    prompt: `${context ? `CONTEXT:\n${context}\n\n` : ""}ROLE: ${roleName}\nTOPIC: ${topicName}\nDIFFICULTY: ${difficulty}\n\nGenerate one practice question, strictly on-topic, with internally consistent numbers/units if it uses any.`,
    maxTokens: 300
  });
  return { question: result.question, difficulty: result.difficulty || difficulty };
}

// Phase 1.7 item 2: every checkable field across ALL 4 topics (4
// modelAnswers + up to 12 practicePrompts) is checked in ONE batched call
// instead of one checkContent call per field - this was the single biggest
// driver of cold call counts (roughly half of all calls per role in the
// Phase 1.6 test matrix). modelAnswer failures get targeted repair (Phase
// 1.7 item 4, up to 2 attempts, each given the real issue text);
// practicePrompts keep their existing drop-and-replace behavior unchanged,
// just seeded with the batch's first-check result so they don't re-check
// the original unnecessarily.
function modelAnswerItemId(topicIndex) { return `ma-${topicIndex}`; }
function practicePromptItemId(topicIndex, promptIndex) { return `pp-${topicIndex}-${promptIndex}`; }

async function verifyAllTopics(roleName, rawTopics, context) {
  const items = [];
  rawTopics.forEach((t, ti) => {
    if (t.modelAnswer) items.push({ id: modelAnswerItemId(ti), text: modelAnswerText(t.modelAnswer) });
    (Array.isArray(t.practicePrompts) ? t.practicePrompts : []).forEach((p, pi) => {
      items.push({ id: practicePromptItemId(ti, pi), text: p.question });
    });
  });
  const checkResults = await checkContentBatch(items);

  const topics = [];
  for (let ti = 0; ti < rawTopics.length; ti++) {
    const topic = rawTopics[ti];
    const out = { ...topic };
    if (topic.modelAnswer) {
      const firstResult = checkResults.get(modelAnswerItemId(ti));
      const v = await repairExplanation(modelAnswerText(topic.modelAnswer), firstResult, async (issue) => {
        const regenerated = await regenerateModelAnswer(roleName, topic.name, context, issue);
        out.modelAnswer = regenerated || topic.modelAnswer;
        return modelAnswerText(out.modelAnswer);
      });
      out.modelAnswerVerified = { checked: v.checked, passed: v.passed, issue: v.issue };
    }
    if (Array.isArray(topic.practicePrompts) && topic.practicePrompts.length) {
      const verifiedPrompts = [];
      let anyReplaced = false;
      for (let pi = 0; pi < topic.practicePrompts.length; pi++) {
        const p = topic.practicePrompts[pi];
        const firstResult = checkResults.get(practicePromptItemId(ti, pi));
        const result = await verifyPracticePromptOrReplace(
          p.question,
          () => generateOnePracticePrompt(roleName, topic.name, p.difficulty, context).then(r => r.question),
          () => generateOnePracticePrompt(roleName, topic.name, p.difficulty, context).then(r => r.question),
          firstResult
        );
        if (result.replaced) anyReplaced = true;
        verifiedPrompts.push({ question: result.text, difficulty: p.difficulty });
      }
      out.practicePrompts = verifiedPrompts;
      // Every prompt here already passed its own check (or was replaced with
      // one that did) - this is reported for transparency, not as a
      // still-failing notice the way modelAnswerVerified is.
      out.practicePromptsVerified = { checked: true, anyReplaced };
    }
    topics.push(out);
  }
  return topics;
}

/**
 * @param {string} roleName - must already be a canonical role (see resolveRoleTitle)
 * @returns {Promise<{topics, cached, fetchedAt}>}
 */
export async function getRoleTopics(roleName) {
  const cacheKey = normalizeCacheKey(roleName);
  return singleFlight(`roleTopics:${cacheKey}`, () => fetchRoleTopics(roleName, cacheKey));
}

async function fetchRoleTopics(roleName, cacheKey) {
  const { data: cached, error: cacheError } = await supabase
    .from("role_topics_cache")
    .select("*")
    .eq("role_name", cacheKey)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const isFresh = cached && cached.content_version === CONTENT_VERSION && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return {
      topics: cached.topics, cached: true, fetchedAt: cached.fetched_at,
      groundedInCasebooks: cached.grounded_in_casebooks || false, citations: cached.citations || []
    };
  }

  const { context, groundedInCasebooks, citations } = await retrieveContext(roleName);
  const prompt = `${context ? `CONTEXT (real interview casebook excerpts - use where genuinely relevant, don't force-fit):\n${context}\n\n` : ""}ROLE: ${roleName}\n\nGenerate the 4-topic interview-prep curriculum JSON as specified.`;
  const result = await generateJSON({ system: SYSTEM_PROMPT, prompt, maxTokens: 8000 });
  const rawTopics = Array.isArray(result.topics) ? result.topics : [];
  const topics = await verifyAllTopics(roleName, rawTopics, context);

  const row = {
    role_name: cacheKey, content_version: CONTENT_VERSION, topics,
    grounded_in_casebooks: groundedInCasebooks, citations,
    fetched_at: new Date().toISOString()
  };
  const { error: upsertError } = await supabase
    .from("role_topics_cache")
    .upsert(row, { onConflict: "role_name" });
  if (upsertError) throw upsertError;

  return { topics, cached: false, fetchedAt: row.fetched_at, groundedInCasebooks, citations };
}

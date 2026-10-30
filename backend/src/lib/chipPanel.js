import { supabase } from "./supabase.js";
import { generateText } from "./gemini.js";
import { normalizeCacheKey } from "./cacheKey.js";
import { singleFlight } from "./singleFlight.js";
import { CONTENT_VERSION } from "./contentVersion.js";
import { ROLE_CONTENT_RULES } from "./roleContentRules.js";
import { verifyExplanationWithRepair } from "./contentVerifier.js";
import { groundedConsultingLookup } from "./consultingRetrieval.js";

// G2 switch (pulled forward ahead of its normal M3 sequencing - Aalhad's
// explicit call: "involve casebook data in the chips too wherever
// possible"). Off by default; flipping it off restores today's exact
// plain-Gemini behavior below. Same env var as frameworksGrounding.js/
// roleTopics.js - one question ("is the Consulting ingest_chunks pipeline
// live"), not three independent toggles.
const CONSULTING_RAG_V2_ENABLED = process.env.ENABLE_CONSULTING_RAG_V2 === "true";

// Best-effort: a chip is a short, specific coaching explanation for one
// (role, topic, blockId) triple - most of these genuinely have nothing
// case-specific to ground (Aalhad's own words: "not everything would be
// possible"). Only when real casebook content clears the threshold does
// this attach a visible citation and feed the excerpt into the prompt as
// explicit, cited material - never as silent unlabelled context. A miss
// (not covered, or the lookup itself fails) falls straight through to
// today's plain generation with no grounding claim at all.
async function groundChip(role, topic, blockId) {
  try {
    const result = await groundedConsultingLookup(`${role} ${topic} ${blockId}`, { domain: "Consulting", matchCount: 3 });
    if (!result.covered) return { groundedPrompt: null, groundedInCasebooks: false, citation: null };
    const top = result.chunks[0];
    const citation = result.citations[0];
    const groundedPrompt = `CASEBOOK EXCERPT (real, cited - ground your answer in this where it genuinely fits, don't force it if it doesn't):\n${top.content}\n\n`;
    return { groundedPrompt, groundedInCasebooks: true, citation };
  } catch (err) {
    console.warn(`[chipPanel] grounding lookup failed for "${role}"/"${topic}": ${err.message}`);
    return { groundedPrompt: null, groundedInCasebooks: false, citation: null };
  }
}

/**
 * Pure: prepends the cited casebook excerpt to the original prompt when
 * grounding found one, otherwise returns the original prompt untouched.
 * Pulled out of fetchChipPanel so this wiring is unit-testable without a
 * live retrieval call.
 */
export function buildEffectivePrompt(prompt, groundedPrompt) {
  return groundedPrompt ? `${groundedPrompt}${prompt}` : prompt;
}

// Server-side cache for What?/Why?/How to apply chip panels (Phase 1
// amendment D) - replaces the old client-only localStorage cache in
// useProbe.ts, so the first user to open a given panel pays for every
// later one. No TTL: these are short, scoped coaching explanations, not
// time-sensitive facts, so content_version (bumped when the prompt wording
// changes) is the only invalidation signal that matters here.
export async function getChipPanel({ role, topic, blockId, mode, prompt }) {
  const roleKey = normalizeCacheKey(role);
  const topicKey = normalizeCacheKey(topic);
  const blockKey = normalizeCacheKey(blockId);
  return singleFlight(
    `chipPanel:${roleKey}::${topicKey}::${blockKey}::${mode}`,
    () => fetchChipPanel(roleKey, topicKey, blockKey, mode, prompt)
  );
}

async function fetchChipPanel(roleKey, topicKey, blockKey, mode, prompt) {
  const { data: cached, error: cacheError } = await supabase
    .from("chip_panel_cache")
    .select("*")
    .eq("content_version", CONTENT_VERSION)
    .eq("role_name", roleKey)
    .eq("topic", topicKey)
    .eq("block_id", blockKey)
    .eq("mode", mode)
    .maybeSingle();
  if (cacheError) throw cacheError;

  if (cached) {
    return {
      text: cached.text, cached: true,
      contentCheck: cached.content_checked ? { checked: true, passed: cached.content_passed, issue: cached.content_issue || "" } : { checked: false, passed: true, issue: "" },
      groundedInCasebooks: cached.grounded_in_casebooks || false, citation: cached.citation || null
    };
  }

  const { groundedPrompt, groundedInCasebooks, citation } = CONSULTING_RAG_V2_ENABLED
    ? await groundChip(roleKey, topicKey, blockKey)
    : { groundedPrompt: null, groundedInCasebooks: false, citation: null };
  const effectivePrompt = buildEffectivePrompt(prompt, groundedPrompt);

  const text = await generateText({ system: ROLE_CONTENT_RULES, prompt: effectivePrompt, maxTokens: 500 });
  // Phase 1.7 item 4: targeted repair - the regenerate attempt is told what
  // was actually wrong with the previous version, not just asked to re-roll.
  const verified = await verifyExplanationWithRepair(text, (issue) =>
    generateText({ system: ROLE_CONTENT_RULES, prompt: `${effectivePrompt}\n\nThe previous version had this problem: ${issue}. Fix it and keep everything else correct.`, maxTokens: 500 })
  );

  const row = {
    content_version: CONTENT_VERSION,
    role_name: roleKey, topic: topicKey, block_id: blockKey, mode,
    text: verified.text,
    content_checked: verified.checked,
    content_passed: verified.passed,
    content_issue: verified.issue,
    grounded_in_casebooks: groundedInCasebooks,
    citation,
    fetched_at: new Date().toISOString()
  };
  const { error: upsertError } = await supabase
    .from("chip_panel_cache")
    .upsert(row, { onConflict: "content_version,role_name,topic,block_id,mode" });
  if (upsertError) throw upsertError;

  return {
    text: row.text, cached: false,
    contentCheck: { checked: row.content_checked, passed: row.content_passed, issue: row.content_issue || "" },
    groundedInCasebooks: row.grounded_in_casebooks, citation: row.citation
  };
}

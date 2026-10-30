import { supabase } from "./supabase.js";
import { generateGroundedText } from "./gemini.js";
import { normalizeCacheKey } from "./cacheKey.js";
import { resolveSources } from "./resolveSources.js";
import { singleFlight } from "./singleFlight.js";

// Same long TTL as company_value_chain_cache (companyValueChain.js) - how a
// company actually runs one stage of its value chain doesn't change often.
const CACHE_TTL_MS = 60 * 24 * 60 * 60 * 1000;

// Deliberately plain text via generateGroundedText, not generateJSON - see
// gemini.js's comment on generateGroundedText: constraining a grounded call
// to strict JSON measurably made the model skip actually searching about a
// third of the time while still *claiming* to be sourced, which is exactly
// the "AI-generated slop presented as verified" failure this endpoint
// exists to avoid. Asked for one short bullet per line (not a paragraph -
// user feedback: bullets scan faster) rather than JSON, so grounding stays
// reliable; the frontend splits on newlines to render a real list. The real
// citations (`sources`) are rendered alongside it so the answer is
// checkable, not just asserted.
const STAGE_DETAIL_SYSTEM_PROMPT = `Research exactly how the given stage of the given company's value chain actually operates, for a student preparing for a case/consulting/product-management interview who needs the real operational picture, not a generic textbook description. Actively search multiple reliable sources (the company's own site/investor materials, credible business journalism, industry analysis, case studies) before answering - do not rely on memory alone.

Cover: the concrete mechanics of what happens at this stage, which systems/technology/partners/teams are involved, any real numbers or scale you can find (volumes, facilities, timelines, geographies), and specifically how this company executes or differentiates here versus competitors doing the same stage.

Respond as 5-8 short bullet points, ONE per line, each starting with "- " and each a single self-contained fact or mechanic (not a topic sentence needing the next line for context). No paragraphs, no headers, no intro/outro sentence - just the bullet lines.

If reliable sources don't cover this stage specifically for this company, say so plainly as one of the bullets rather than inventing detail to fill the space.`;

/**
 * @param {string} companyName
 * @param {string} stageName
 * @param {string} [stageDescription] - the one-line summary already shown on the stage card, given as extra context for the research prompt
 * @returns {Promise<{detail: string, sources: {title:string, uri:string}[], grounded: boolean, cached: boolean, fetchedAt: string}>}
 */
export async function getCompanyValueChainStageDetail(companyName, stageName, stageDescription) {
  const companyKey = normalizeCacheKey(companyName);
  const stageKey = normalizeCacheKey(stageName);
  return singleFlight(`companyValueChainStage:${companyKey}::${stageKey}`, () => fetchCompanyValueChainStageDetail(companyName, stageName, stageDescription, companyKey, stageKey));
}

async function fetchCompanyValueChainStageDetail(companyName, stageName, stageDescription, companyKey, stageKey) {
  const { data: cached, error: cacheError } = await supabase
    .from("company_value_chain_stage_detail_cache")
    .select("*")
    .eq("company_name", companyKey)
    .eq("stage_name", stageKey)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const isFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return {
      detail: cached.detail, sources: cached.sources || [], grounded: cached.grounded,
      cached: true, fetchedAt: cached.fetched_at
    };
  }

  const prompt = `COMPANY: ${companyName}\nVALUE CHAIN STAGE: ${stageName}${stageDescription ? `\nSTAGE SUMMARY (already established, add real depth beyond this): ${stageDescription}` : ""}\n\nResearch and explain exactly how this stage works, as specified.`;
  const { text, grounded, sources } = await generateGroundedText({ system: STAGE_DETAIL_SYSTEM_PROMPT, prompt, maxTokens: 700 });
  // Resolved once here (generation-time, not per page view - see
  // resolveSources.js) so the stored/returned sources deep-link to the
  // specific article/page Google's search actually found, not a bare
  // domain that reads like a homepage.
  const resolvedSources = await resolveSources(sources);

  const detail = text.trim() || "- Reliable sources didn't cover enough detail on this specific stage - try again later or check the sources on the stages around it.";
  const row = {
    company_name: companyKey, stage_name: stageKey, detail, sources: resolvedSources, grounded,
    fetched_at: new Date().toISOString()
  };
  const { error: upsertError } = await supabase
    .from("company_value_chain_stage_detail_cache")
    .upsert(row, { onConflict: "company_name,stage_name" });
  if (upsertError) throw upsertError;

  return { detail, sources: resolvedSources, grounded, cached: false, fetchedAt: row.fetched_at };
}

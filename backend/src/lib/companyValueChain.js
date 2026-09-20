import { supabase } from "./supabase.js";
import { generateJSON, generateGroundedText } from "./gemini.js";

// A company's value chain (how it actually creates and captures value)
// changes about as rarely as its business model - same long TTL as the
// history timeline, for the same reason.
const CACHE_TTL_MS = 60 * 24 * 60 * 60 * 1000;

const RESEARCH_SYSTEM_PROMPT = `Research how the given company's value chain actually works, for a student preparing for a case/consulting/product interview who wants a real, specific, end-to-end picture - not a generic textbook template. Actively search multiple reliable sources (the company's own site, business news, industry analysis) before answering - do not rely on memory alone. Describe the company's ACTUAL sequence of value-creating stages, tailored to its real industry and business model - e.g. a payments company might be "merchant onboarding -> transaction processing -> risk & fraud checks -> settlement -> value-added financial services", while a manufacturer might be "raw material sourcing -> manufacturing -> quality control -> distribution -> retail -> after-sales service". Report 4-7 stages in the real order they happen, each with what happens at that stage and how the company specifically captures value or differentiates there (not a generic description that could apply to any company in the industry). Plain prose, in order, under 350 words.`;

const FORMAT_SYSTEM_PROMPT = `You are extracting a structured value chain from research text about a company. Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"stages": [{"name": "Short label, e.g. 'Merchant Onboarding'", "description": "One to two sentences: what happens at this stage and how this specific company captures value or differentiates here."}, ... 4-7 items, in the real order the company's value chain flows, first stage first]}

Tailor the stages to this company's actual business model and industry - never paste a generic Porter's Value Chain template (inbound logistics/operations/outbound logistics/marketing/service) unless the research genuinely supports that exact framing for this company. If the research is too thin to produce a real, specific value chain, return fewer stages rather than inventing generic ones.`;

async function researchCompanyValueChain(companyName) {
  try {
    const { text, grounded, sources } = await generateGroundedText({
      system: RESEARCH_SYSTEM_PROMPT,
      prompt: `COMPANY: ${companyName}`,
      maxTokens: 900
    });
    return { text, grounded, sources };
  } catch {
    return { text: "", grounded: false, sources: [] };
  }
}

/**
 * @param {string} companyName - any company name, not restricted to a fixed list
 * @returns {Promise<{stages: {name: string, description: string}[], cached: boolean, fetchedAt: string}>}
 */
export async function getCompanyValueChain(companyName) {
  const { data: cached, error: cacheError } = await supabase
    .from("company_value_chain_cache")
    .select("*")
    .eq("company_name", companyName)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const isFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return { stages: cached.stages, cached: true, fetchedAt: cached.fetched_at };
  }

  const research = await researchCompanyValueChain(companyName);
  const prompt = research.grounded
    ? `COMPANY: ${companyName}\n\nRESEARCH:\n${research.text}\n\nExtract the value chain JSON as specified.`
    : `COMPANY: ${companyName}\n\n(Web search was unavailable this time - use general knowledge of this company's actual business model, and only include stages you're genuinely confident about; return fewer items rather than guessing.)\n\nExtract the value chain JSON as specified.`;
  const result = await generateJSON({ system: FORMAT_SYSTEM_PROMPT, prompt, maxTokens: 1200 });
  const stages = Array.isArray(result.stages) ? result.stages : [];

  const row = { company_name: companyName, stages, fetched_at: new Date().toISOString() };
  const { error: upsertError } = await supabase
    .from("company_value_chain_cache")
    .upsert(row, { onConflict: "company_name" });
  if (upsertError) throw upsertError;

  return { stages, cached: false, fetchedAt: row.fetched_at };
}

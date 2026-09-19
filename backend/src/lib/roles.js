import { supabase } from "./supabase.js";
import { generateJSON } from "./gemini.js";

// Single source of truth for which 50 role titles this app has curated
// content for. Mirrored in frontend/index.html's CANONICAL_ROLES constant
// for instant client-side typeahead filtering (no network round trip per
// keystroke) — keep the two lists in sync by hand if this one changes.
export const CANONICAL_ROLES = [
  "Associate Product Manager", "Product Manager", "Senior Product Manager", "Product Analyst",
  "Product Owner", "Technical Product Manager", "Growth Product Manager", "Program Manager",
  "Strategy Associate", "Consultant", "Management Consultant", "Business Analyst (Consulting)",
  "Corporate Strategy Associate", "Strategy & Operations Analyst", "Transformation Associate",
  "Business Analyst", "Data Analyst", "Business Intelligence Analyst",
  "Insights & Analytics Associate", "Decision Science Analyst",
  "Investment Banking Analyst", "Equity Research Analyst", "Corporate Finance Analyst",
  "FP&A Analyst", "Private Equity/VC Analyst", "Credit & Risk Analyst", "Treasury Analyst",
  "Brand Manager", "Marketing Manager", "Category Manager", "Digital Marketing Manager",
  "Product Marketing Manager", "Growth Marketing Manager",
  "Growth Manager", "Operations Manager", "Supply Chain Manager",
  "Business Operations Associate", "City/Cluster Manager", "Customer Success Manager",
  "Business Development Manager", "Key Account Manager", "Sales Strategy Associate",
  "Partnerships Manager",
  "HR Business Partner", "General Management Trainee", "Chief of Staff",
  "Corporate Development Associate",
  "Risk & Fraud Analyst", "Merchant/Partner Success Manager", "Payments Product Manager",
  "Compliance Analyst"
];

function coerceToCanonical(name) {
  if (!name) return null;
  const trimmed = String(name).trim().toLowerCase();
  return CANONICAL_ROLES.find(r => r.toLowerCase() === trimmed) || null;
}

const MATCH_SYSTEM_PROMPT = `You match a candidate's typed job-role title to the single closest role from a fixed list of canonical role titles used by a campus-placement prep platform. Pick whichever canonical role a recruiter would consider the closest real-world equivalent in scope and seniority - same function and level, not just similar words. Respond with ONLY JSON in exactly this shape: {"nearest": "<one string, copied exactly from the canonical list>"}`;

/**
 * Resolves any typed role title to one of CANONICAL_ROLES: an exact
 * (case-insensitive) match returns immediately with no API call; anything
 * else is classified by Gemini to the nearest canonical role, cached in
 * role_alias_cache keyed by the normalized typed text so the same phrase
 * never needs re-classifying.
 * @param {string} typedTitle
 * @returns {Promise<string>} a value guaranteed to be in CANONICAL_ROLES
 */
export async function resolveRoleTitle(typedTitle) {
  const trimmed = String(typedTitle || "").trim();
  const exact = coerceToCanonical(trimmed);
  if (exact) return exact;

  const normalized = trimmed.toLowerCase();
  const { data: cached, error: cacheError } = await supabase
    .from("role_alias_cache")
    .select("matched_role")
    .eq("typed_text", normalized)
    .maybeSingle();
  if (cacheError) throw cacheError;
  if (cached) return cached.matched_role;

  const prompt = `TYPED ROLE TITLE: "${trimmed}"\n\nCANONICAL ROLE LIST:\n${CANONICAL_ROLES.map(r => "- " + r).join("\n")}\n\nWhich canonical role is the closest match?`;
  const result = await generateJSON({ system: MATCH_SYSTEM_PROMPT, prompt, maxTokens: 100 });
  // Gemini occasionally paraphrases instead of copying verbatim - fall back
  // to the first canonical role rather than caching/returning a title that
  // isn't actually in the list every downstream lookup depends on.
  const matched = coerceToCanonical(result.nearest) || CANONICAL_ROLES[0];

  const { error: upsertError } = await supabase
    .from("role_alias_cache")
    .upsert({ typed_text: normalized, matched_role: matched }, { onConflict: "typed_text" });
  if (upsertError) throw upsertError;

  return matched;
}

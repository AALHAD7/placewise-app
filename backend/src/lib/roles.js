import { supabase } from "./supabase.js";
import { generateJSON } from "./gemini.js";

// ============================================================================
// ROLE-KEYING RULE (Phase 1.6 item on the role_id deviation)
//
// Every EXISTING per-role cache/table (role_overview_cache, role_topics_cache,
// skill_content_cache, role_alias_cache, role_company_topic_notes_cache)
// stays keyed by role NAME, on purpose: a rename is just a cache miss under
// the new name, so no re-keying migration was needed or built for them.
//
// From Phase 1.6 onward, this is now an EXCEPTION, not the pattern. Every
// NEW table or field that stores per-user or per-role STATE (not just a
// regenerable content cache) MUST key on `role_id` (the stable slug below),
// never on the display name. This covers at minimum: Phase 2 topic
// progress, saved 7-day plans, the practice question pool, mock interview
// sessions going forward, and recent-activity rows.
//
// `mock_interview_sessions` got a `role_id` column in migration_035 - the
// `role` text column stays for display/free-text (mock interview role input
// isn't constrained to the canonical list), but anything that joins or
// groups by role must use `role_id`.
//
// Enforcement: run `npm run check-role-keying` in backend/ before adding a
// migration that introduces a role-ish column - see
// backend/scripts/checkRoleKeying.js for what it flags.
// ============================================================================

// Single source of truth for which role titles this app has curated content
// for, each with a stable `id` (slug - never changes even if `name` is
// renamed) and its `domain` (one of the 10 fixed platform domains used for
// role classification/reporting - NOT the same taxonomy as
// document_chunks.domain, which is a coarser 6-bucket ingestion tag used
// only for RAG retrieval filtering).
//
// CANONICAL_ROLES/DOMAINS below are derived from this, so every existing
// name-keyed consumer (content caches, dropdown search, prompts) keeps
// working unchanged.
//
// Phase 1.6 item 2 changes from the original 50-role list:
// - Renamed: Investment Banking Analyst -> Investment Banking Associate,
//   Private Equity/VC Analyst -> Private Equity / VC Associate,
//   Business Analyst (Consulting) -> Consultant (Associate),
//   Brand Manager -> Assistant Brand Manager
//   (all MBA-campus-hiring title corrections - see the Phase 1.5 role audit)
// - Merged: Management Consultant -> Consultant (Associate) (same title
//   correction reasoning; "Consultant" the plain generalist title is kept
//   separate, untouched)
// - Removed: Senior Product Manager (not a campus-hire-level title)
// - Added (new domain: IT and Technology, previously had zero roles):
//   Technology Consultant, Digital Transformation Consultant,
//   Solutions / Pre-sales Consultant, Technical Program Manager
export const ROLE_CATALOG = [
  { id: "associate-product-manager", name: "Associate Product Manager", domain: "Product Management" },
  { id: "product-manager", name: "Product Manager", domain: "Product Management" },
  { id: "product-analyst", name: "Product Analyst", domain: "Product Management" },
  { id: "product-owner", name: "Product Owner", domain: "Product Management" },
  { id: "technical-product-manager", name: "Technical Product Manager", domain: "Product Management" },
  { id: "growth-product-manager", name: "Growth Product Manager", domain: "Product Management" },
  { id: "program-manager", name: "Program Manager", domain: "Product Management" },

  { id: "strategy-associate", name: "Strategy Associate", domain: "Consulting" },
  { id: "consultant", name: "Consultant", domain: "Consulting" },
  { id: "consultant-associate", name: "Consultant (Associate)", domain: "Consulting" },
  { id: "corporate-strategy-associate", name: "Corporate Strategy Associate", domain: "Consulting" },
  { id: "strategy-and-operations-analyst", name: "Strategy & Operations Analyst", domain: "Consulting" },
  { id: "transformation-associate", name: "Transformation Associate", domain: "Consulting" },

  { id: "business-analyst", name: "Business Analyst", domain: "Data and Analytics" },
  { id: "data-analyst", name: "Data Analyst", domain: "Data and Analytics" },
  { id: "business-intelligence-analyst", name: "Business Intelligence Analyst", domain: "Data and Analytics" },
  { id: "insights-and-analytics-associate", name: "Insights & Analytics Associate", domain: "Data and Analytics" },
  { id: "decision-science-analyst", name: "Decision Science Analyst", domain: "Data and Analytics" },

  { id: "investment-banking-associate", name: "Investment Banking Associate", domain: "Finance and Banking" },
  { id: "equity-research-analyst", name: "Equity Research Analyst", domain: "Finance and Banking" },
  { id: "corporate-finance-analyst", name: "Corporate Finance Analyst", domain: "Finance and Banking" },
  { id: "fpa-analyst", name: "FP&A Analyst", domain: "Finance and Banking" },
  { id: "private-equity-vc-associate", name: "Private Equity / VC Associate", domain: "Finance and Banking" },
  { id: "credit-and-risk-analyst", name: "Credit & Risk Analyst", domain: "Finance and Banking" },
  { id: "treasury-analyst", name: "Treasury Analyst", domain: "Finance and Banking" },

  { id: "assistant-brand-manager", name: "Assistant Brand Manager", domain: "Marketing and Brand" },
  { id: "marketing-manager", name: "Marketing Manager", domain: "Marketing and Brand" },
  { id: "category-manager", name: "Category Manager", domain: "Marketing and Brand" },
  { id: "digital-marketing-manager", name: "Digital Marketing Manager", domain: "Marketing and Brand" },
  { id: "product-marketing-manager", name: "Product Marketing Manager", domain: "Marketing and Brand" },
  { id: "growth-marketing-manager", name: "Growth Marketing Manager", domain: "Marketing and Brand" },

  { id: "growth-manager", name: "Growth Manager", domain: "Sales and Business Development" },
  { id: "city-cluster-manager", name: "City/Cluster Manager", domain: "Sales and Business Development" },
  { id: "customer-success-manager", name: "Customer Success Manager", domain: "Sales and Business Development" },
  { id: "business-development-manager", name: "Business Development Manager", domain: "Sales and Business Development" },
  { id: "key-account-manager", name: "Key Account Manager", domain: "Sales and Business Development" },
  { id: "sales-strategy-associate", name: "Sales Strategy Associate", domain: "Sales and Business Development" },
  { id: "partnerships-manager", name: "Partnerships Manager", domain: "Sales and Business Development" },
  { id: "merchant-partner-success-manager", name: "Merchant/Partner Success Manager", domain: "Sales and Business Development" },

  { id: "operations-manager", name: "Operations Manager", domain: "Operations and Supply Chain" },
  { id: "supply-chain-manager", name: "Supply Chain Manager", domain: "Operations and Supply Chain" },
  { id: "business-operations-associate", name: "Business Operations Associate", domain: "Operations and Supply Chain" },

  { id: "hr-business-partner", name: "HR Business Partner", domain: "Human Resources" },
  { id: "talent-acquisition-associate", name: "Talent Acquisition Associate", domain: "Human Resources" },
  { id: "compensation-and-benefits-analyst", name: "Compensation & Benefits Analyst", domain: "Human Resources" },
  { id: "learning-and-development-associate", name: "Learning & Development Associate", domain: "Human Resources" },

  { id: "general-management-trainee", name: "General Management Trainee", domain: "General Management" },
  { id: "chief-of-staff", name: "Chief of Staff", domain: "General Management" },
  { id: "corporate-development-associate", name: "Corporate Development Associate", domain: "General Management" },
  { id: "risk-and-fraud-analyst", name: "Risk & Fraud Analyst", domain: "General Management" },
  { id: "compliance-analyst", name: "Compliance Analyst", domain: "General Management" },

  { id: "payments-product-manager", name: "Payments Product Manager", domain: "IT and Technology" },
  { id: "technology-consultant", name: "Technology Consultant", domain: "IT and Technology" },
  { id: "digital-transformation-consultant", name: "Digital Transformation Consultant", domain: "IT and Technology" },
  { id: "solutions-presales-consultant", name: "Solutions / Pre-sales Consultant", domain: "IT and Technology" },
  { id: "technical-program-manager", name: "Technical Program Manager", domain: "IT and Technology" }
];

export const CANONICAL_ROLES = ROLE_CATALOG.map(r => r.name);
export const DOMAINS = [...new Set(ROLE_CATALOG.map(r => r.domain))];

// Shown as a small "Lateral / 2+ yrs" label in the Role dropdown - these
// are real, valid roles to prep for, just not direct-from-campus titles at
// most firms, so the label sets expectations rather than removing them.
export const LATERAL_ROLES = new Set(["Technical Product Manager", "Growth Product Manager"]);

// Old title -> new title, for anyone arriving via an old URL/bookmark/saved
// plan. Checked before anything else in resolveRoleTitle/coerceToCanonical,
// so a renamed/merged role's old name resolves instantly (no AI call, no
// cache lookup) straight to its replacement - reusing the SAME name-based
// resolution path role_alias_cache already provides for free-typed roles,
// not a new id/slug system layered on top of it.
export const ROLE_RENAMES = {
  "investment banking analyst": "Investment Banking Associate",
  "private equity/vc analyst": "Private Equity / VC Associate",
  "business analyst (consulting)": "Consultant (Associate)",
  "management consultant": "Consultant (Associate)",
  "brand manager": "Assistant Brand Manager"
};

function coerceToCanonical(name) {
  if (!name) return null;
  const trimmed = String(name).trim().toLowerCase();
  if (ROLE_RENAMES[trimmed]) return ROLE_RENAMES[trimmed];
  return CANONICAL_ROLES.find(r => r.toLowerCase() === trimmed) || null;
}

// Cheap, no-AI, no-DB lookup: resolves a role NAME (exact match or a known
// rename only - no fuzzy/AI classification) to its stable role_id, or null
// if it isn't an exact/renamed match. Intended for write paths (e.g.
// inserting a mock_interview_sessions row) where free-typed text is common
// and paying for an AI classification just to backfill an id isn't worth it
// - a null role_id there just means "not one of our canonical roles",
// which is itself useful signal.
export function roleIdFor(name) {
  const canonical = coerceToCanonical(name);
  if (!canonical) return null;
  return ROLE_CATALOG.find(r => r.name === canonical)?.id || null;
}

export function domainForRole(name) {
  const canonical = coerceToCanonical(name);
  if (!canonical) return null;
  return ROLE_CATALOG.find(r => r.name === canonical)?.domain || null;
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

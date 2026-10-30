import { supabase } from "./supabase.js";
import { generateJSON, generateGroundedText } from "./gemini.js";
import { normalizeCacheKey } from "./cacheKey.js";
import { singleFlight } from "./singleFlight.js";
import { CONTENT_VERSION } from "./contentVersion.js";
import { ROLE_CONTENT_RULES } from "./roleContentRules.js";
import { classifySources } from "./sourceAllowlist.js";

// Cache TTL is long (30 days, not company_overview_cache's 4) - a role's
// general shape (what the job involves, typical skills, salary band, exit
// paths) moves far slower than company-specific news, so there's no benefit
// to regenerating this often.
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Phase 1.5 item 6: "career progression" (the internal ladder within the
// same function/firm type) vs "exit opportunities" (a move to a different
// firm type, function or industry) are genuinely different things that a
// single "exits" field used to conflate. coreTokens/isSameFunctionTitle is
// a code-level guard, not a prompt instruction alone - a model asked not to
// do this will still occasionally just rephrase "Senior X" as an "exit", so
// any exitOpportunities entry that reduces to the same core words as the
// role title (after stripping seniority qualifiers) is dropped rather than
// shown.
const SENIORITY_WORDS = new Set([
  "senior", "junior", "sr", "jr", "lead", "principal", "associate", "vp", "svp", "evp",
  "vice", "president", "director", "head", "chief", "executive", "manager", "intern", "of"
]);
function coreTokens(title) {
  return (title || "").toLowerCase().split(/[\s/,&-]+/).filter(w => w && !SENIORITY_WORDS.has(w));
}
function isSameFunctionTitle(roleName, candidate) {
  const roleCore = new Set(coreTokens(roleName));
  const candCore = coreTokens(candidate);
  if (!candCore.length || !roleCore.size) return false;
  const overlap = candCore.filter(w => roleCore.has(w)).length;
  return overlap / candCore.length >= 0.6;
}
function filterExitOpportunities(roleName, exits) {
  return (Array.isArray(exits) ? exits : []).filter(e => {
    const rejected = isSameFunctionTitle(roleName, e);
    if (rejected) console.warn(`[roleOverview] dropped exit "${e}" for "${roleName}" - reads as a same-function title, not a real exit`);
    return !rejected;
  });
}

// Salary, hiring companies, career progression, exit opportunities, and
// required skills are researched together via one real web-search call
// (see gemini.js's generateGroundedText) rather than left to the main
// overview call's parametric recall - all are things a search can actually
// verify, unlike "what" (a plain-language description) which stays
// descriptive rather than factual. Phase 1.5 item 3: explicitly steers the
// search toward official B-school placement reports and AmbitionBox/
// Glassdoor India over generic Q&A/forum results, which Phase 1's live
// testing showed grounding was otherwise happy to cite (quora.com,
// reddit.com) for a figure that reads as authoritative.
const RESEARCH_SYSTEM_PROMPT = `Research the given job role for a student preparing for MBA campus placements in India. Actively search multiple reliable sources before answering - do not rely on memory alone. Prefer official Indian B-school final placement reports (IIM/ISB/XLRI/FMS/SPJIMR/MDI and similar) and AmbitionBox/Glassdoor India over generic forum or Q&A sites. Report: (1) campus hiring compensation in INR LPA for MBA graduates at this role's level and domain, (2) 5-7 real companies actually hiring for this role in India right now, (3) 2-3 realistic INTERNAL PROMOTION paths within the same function/firm type (career progression), (4) 2-3 realistic EXIT paths to a genuinely different function, firm type or industry (not just a more senior title in the same job), (5) 4-5 concrete skills real job postings for this role actually list as requirements. Plain prose, under 220 words, organized as five short labeled parts.`;

const SYSTEM_PROMPT = `${ROLE_CONTENT_RULES}

You are writing a role-overview card for a student preparing for campus placements at companies in India. You will be given a job-role title and, usually, real research already gathered by web search covering salary, hiring companies, career progression, exit opportunities, and required skills.

If research is provided below, base "salary", "salaryNote", "companies", "careerProgression", "exitOpportunities", and "skills" directly on it - do not override it with your own guess or add items it didn't mention. If no research is provided (a search failure), fall back to realistic estimates using your general knowledge and say so explicitly in salaryNote.

"careerProgression" is the internal promotion ladder within the SAME function and firm type (e.g. Associate -> VP -> Director, all still doing this job at a similar kind of firm). "exitOpportunities" is a move to a genuinely DIFFERENT function, firm type or industry - never just a more senior title in the same job (e.g. do not list "Senior Product Manager" as an exit for "Product Manager").

Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{
  "what": "2-3 sentence plain-language description of what this role actually does day to day and how it's judged",
  "companies": ["Company A", "Company B", ... 5-7 real employers, from the research if provided],
  "salary": "₹X-Y LPA",
  "salaryNote": "one short line grounding the range (e.g. what it's based on, that it varies by company tier/year)",
  "skills": ["...", ... 4-5 concrete skills this role actually requires, from the research if provided],
  "careerProgression": ["...", ... 2-3 internal promotion steps, same function/firm type, from the research if provided],
  "exitOpportunities": ["...", ... 2-3 moves to a different function/firm type/industry, from the research if provided]
}`;

async function researchRole(roleName) {
  try {
    const { text, grounded, sources } = await generateGroundedText({
      system: RESEARCH_SYSTEM_PROMPT,
      prompt: `ROLE: ${roleName}`,
      maxTokens: 800
    });
    return { text, grounded, sources };
  } catch {
    // Best-effort - a failed search shouldn't block the overview from
    // generating, it'll just fall back to explicitly-flagged estimates.
    return { text: "", grounded: false, sources: [] };
  }
}

// Salary only ever shows in the UI when at least one TRUSTED source backs
// it (Phase 1.5 item 3 - stricter than Phase 1's "any source" gate).
// Process/companies/skills/careerProgression/exitOpportunities are NOT
// gated on sources - an ungrounded fallback value is still generated and
// stored for those, with salaryNote saying so explicitly.

/**
 * Generates/caches the overview genuinely for whatever roleName is given -
 * NOT snapped to a canonical role (unlike getRoleTopics). A user typing a
 * role outside the curated 50-title list (e.g. "Sales Associate") should see
 * an overview that's actually about that role, not a substituted nearest
 * match with a different name in the "what it is" text - see routes/roles.js.
 * @param {string} roleName
 * @returns {Promise<{what, companies, salary, salaryNote, skills, careerProgression, exitOpportunities, sources, hasTrustedSource, cached, fetchedAt}>}
 */
export async function getRoleOverview(roleName) {
  const cacheKey = normalizeCacheKey(roleName);
  return singleFlight(`roleOverview:${cacheKey}`, () => fetchRoleOverview(roleName, cacheKey));
}

async function fetchRoleOverview(roleName, cacheKey) {
  const { data: cached, error: cacheError } = await supabase
    .from("role_overview_cache")
    .select("*")
    .eq("role_name", cacheKey)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const isFresh = cached && cached.content_version === CONTENT_VERSION && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return {
      what: cached.what, companies: cached.companies, salary: cached.salary,
      salaryNote: cached.salary_note, skills: cached.skills,
      careerProgression: cached.career_progression || [], exitOpportunities: cached.exit_opportunities || [],
      sources: cached.sources || [], hasTrustedSource: cached.has_trusted_source || false,
      hasSupportingSource: cached.has_supporting_source || false,
      cached: true, fetchedAt: cached.fetched_at
    };
  }

  const research = await researchRole(roleName);
  const researchContext = research.grounded
    ? `RESEARCH (from real web search just now - use this for "salary", "salaryNote", "companies", "careerProgression", "exitOpportunities", and "skills", don't independently guess):\n${research.text}`
    : `(Web search was unavailable this time - use your general knowledge for salary/companies/careerProgression/exitOpportunities/skills and say in salaryNote that it's an unverified estimate.)`;

  const prompt = `ROLE: ${roleName}\n\n${researchContext}\n\nGenerate the role-overview JSON as specified.`;
  const overview = await generateJSON({ system: SYSTEM_PROMPT, prompt, maxTokens: 1000 });
  const classified = await classifySources(research.grounded ? research.sources : []);

  const row = {
    role_name: cacheKey,
    content_version: CONTENT_VERSION,
    what: overview.what || "",
    companies: Array.isArray(overview.companies) ? overview.companies : [],
    salary: overview.salary || "",
    salary_note: overview.salaryNote || "",
    skills: Array.isArray(overview.skills) ? overview.skills : [],
    career_progression: Array.isArray(overview.careerProgression) ? overview.careerProgression : [],
    exit_opportunities: filterExitOpportunities(roleName, overview.exitOpportunities),
    // Content-farm sources (quora/reddit/geeksforgeeks/finalroundai) are
    // dropped entirely, never shown even as a weak citation.
    sources: classified.sources,
    has_trusted_source: classified.hasTrusted,
    has_supporting_source: classified.hasSupporting,
    fetched_at: new Date().toISOString()
  };
  const { error: upsertError } = await supabase
    .from("role_overview_cache")
    .upsert(row, { onConflict: "role_name" });
  if (upsertError) throw upsertError;

  return {
    what: row.what, companies: row.companies, salary: row.salary,
    salaryNote: row.salary_note, skills: row.skills,
    careerProgression: row.career_progression, exitOpportunities: row.exit_opportunities,
    sources: row.sources, hasTrustedSource: row.has_trusted_source, hasSupportingSource: row.has_supporting_source,
    cached: false, fetchedAt: row.fetched_at
  };
}

// ---------------------------------------------------------------------------
// Role AT a specific company - same research-then-format shape as
// getRoleOverview above, but everything tailored to one named employer
// instead of the role generically. "companies" (who hires for this role,
// plural) doesn't apply once a company is already fixed, so "process" (that
// company's actual interview rounds for this role) replaces it - same
// company-hiring-process framing already used in companyOverview.js's
// "rounds", including the same anti-fabrication posture (approximate/
// general pattern, never a confident claim about one company's exact
// current process). Phase 1.5 item 3: process is gated on TRUSTED OR
// SUPPORTING (looser than salary's TRUSTED-only bar) - when only a
// SUPPORTING source backs it, it's still shown but labeled "Based on
// candidate reports" rather than carrying a full source badge.
// ---------------------------------------------------------------------------

const RESEARCH_AT_COMPANY_SYSTEM_PROMPT = `Research the given job role specifically AT the given company, for a student preparing for an MBA campus placement interview in India. Actively search multiple reliable sources before answering - do not rely on memory alone. Prefer official Indian B-school final placement reports and AmbitionBox/Glassdoor India over generic forum or Q&A sites; candidate-report sites (e.g. igotanoffer, WallStreetOasis, PrepLounge) are acceptable supporting detail for interview process specifically. Report, specific to this exact company where you can find it (say plainly when something is a general estimate instead, e.g. "not company-specific data found, industry-typical range shown"): (1) campus hiring compensation in INR LPA for MBA graduates at this role's level at this company, (2) this company's typical interview process/rounds for this role (e.g. number of rounds, what each round tests), (3) 2-3 realistic INTERNAL PROMOTION paths within this company/function (career progression), (4) 2-3 realistic EXIT paths to a genuinely different function, firm type or industry (not just a more senior title in the same job), (5) 4-5 concrete skills this company's own job postings/interview reports for this role actually mention. Plain prose, under 220 words, organized as five short labeled parts.`;

const AT_COMPANY_SYSTEM_PROMPT = `${ROLE_CONTENT_RULES}

You are writing a role-overview card for a student preparing for a campus placement interview for a specific role AT a specific company, in India. You will be given the role, the company, and usually real research already gathered by web search covering salary, interview process, promotion paths, exit opportunities, and required skills at that company.

If research is provided below, base "salary", "salaryNote", "process", "careerProgression", "exitOpportunities", and "skills" directly on it - do not override it with your own guess or add items it didn't mention. Never assert a precise, confident claim about this exact company's current process/numbers beyond what the research supports - approximate with "~" or frame as "typically" rather than stating an unverified specific as fact. If no research is provided (a search failure), fall back to realistic estimates using your general knowledge and say so explicitly in salaryNote.

"careerProgression" is the internal promotion ladder within this company/function. "exitOpportunities" is a move to a genuinely DIFFERENT function, firm type or industry - never just a more senior title in the same job.

Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{
  "what": "2-3 sentence plain-language description of what this role does at this company specifically - how it's judged there, what's distinctive about it at this employer if anything is",
  "process": ["...", ... 3-5 short steps/rounds describing this company's typical interview process for this role, from the research if provided],
  "salary": "₹X-Y LPA",
  "salaryNote": "one short line grounding the range to this company specifically (or noting it's an industry-typical estimate if company-specific data wasn't found)",
  "skills": ["...", ... 4-5 concrete skills this company's own postings/process for this role actually emphasize, from the research if provided],
  "careerProgression": ["...", ... 2-3 internal promotion steps at this company, from the research if provided],
  "exitOpportunities": ["...", ... 2-3 moves to a different function/firm type/industry, from the research if provided]
}`;

async function researchRoleAtCompany(roleName, companyName) {
  try {
    const { text, grounded, sources } = await generateGroundedText({
      system: RESEARCH_AT_COMPANY_SYSTEM_PROMPT,
      prompt: `ROLE: ${roleName}\nCOMPANY: ${companyName}`,
      maxTokens: 800
    });
    return { text, grounded, sources };
  } catch {
    return { text: "", grounded: false, sources: [] };
  }
}

/**
 * Same cache-or-generate shape as getRoleOverview, keyed on (role, company)
 * instead of just role. Neither side is snapped to a canonical list - see
 * migration_015's header for why.
 * @param {string} roleName
 * @param {string} companyName
 * @returns {Promise<{what, process, salary, salaryNote, skills, careerProgression, exitOpportunities, sources, hasTrustedSource, hasSupportingSource, cached, fetchedAt}>}
 */
export async function getRoleOverviewAtCompany(roleName, companyName) {
  const roleKey = normalizeCacheKey(roleName);
  const companyKey = normalizeCacheKey(companyName);
  return singleFlight(`roleOverviewAtCompany:${roleKey}::${companyKey}`, () => fetchRoleOverviewAtCompany(roleName, companyName, roleKey, companyKey));
}

async function fetchRoleOverviewAtCompany(roleName, companyName, roleKey, companyKey) {
  const { data: cached, error: cacheError } = await supabase
    .from("role_company_overview_cache")
    .select("*")
    .eq("role_name", roleKey)
    .eq("company_name", companyKey)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const isFresh = cached && cached.content_version === CONTENT_VERSION && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return {
      what: cached.what, process: cached.process, salary: cached.salary,
      salaryNote: cached.salary_note, skills: cached.skills,
      careerProgression: cached.career_progression || [], exitOpportunities: cached.exit_opportunities || [],
      sources: cached.sources || [], hasTrustedSource: cached.has_trusted_source || false, hasSupportingSource: cached.has_supporting_source || false,
      cached: true, fetchedAt: cached.fetched_at
    };
  }

  const research = await researchRoleAtCompany(roleName, companyName);
  const researchContext = research.grounded
    ? `RESEARCH (from real web search just now - use this for "salary", "salaryNote", "process", "careerProgression", "exitOpportunities", and "skills", don't independently guess):\n${research.text}`
    : `(Web search was unavailable this time - use your general knowledge for salary/process/careerProgression/exitOpportunities/skills and say in salaryNote that it's an unverified estimate.)`;

  const prompt = `ROLE: ${roleName}\nCOMPANY: ${companyName}\n\n${researchContext}\n\nGenerate the role-at-company overview JSON as specified.`;
  const overview = await generateJSON({ system: AT_COMPANY_SYSTEM_PROMPT, prompt, maxTokens: 1000 });
  const classified = await classifySources(research.grounded ? research.sources : []);

  const row = {
    role_name: roleKey,
    company_name: companyKey,
    content_version: CONTENT_VERSION,
    what: overview.what || "",
    process: Array.isArray(overview.process) ? overview.process : [],
    salary: overview.salary || "",
    salary_note: overview.salaryNote || "",
    skills: Array.isArray(overview.skills) ? overview.skills : [],
    career_progression: Array.isArray(overview.careerProgression) ? overview.careerProgression : [],
    exit_opportunities: filterExitOpportunities(roleName, overview.exitOpportunities),
    sources: classified.sources,
    has_trusted_source: classified.hasTrusted,
    has_supporting_source: classified.hasSupporting,
    fetched_at: new Date().toISOString()
  };
  const { error: upsertError } = await supabase
    .from("role_company_overview_cache")
    .upsert(row, { onConflict: "role_name,company_name" });
  if (upsertError) throw upsertError;

  return {
    what: row.what, process: row.process, salary: row.salary,
    salaryNote: row.salary_note, skills: row.skills,
    careerProgression: row.career_progression, exitOpportunities: row.exit_opportunities,
    sources: row.sources, hasTrustedSource: row.has_trusted_source, hasSupportingSource: row.has_supporting_source,
    cached: false, fetchedAt: row.fetched_at
  };
}

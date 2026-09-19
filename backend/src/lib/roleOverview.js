import { supabase } from "./supabase.js";
import { generateJSON, generateGroundedText } from "./gemini.js";

// Cache TTL is long (30 days, not company_overview_cache's 4) - a role's
// general shape (what the job involves, typical skills, salary band, exit
// paths) moves far slower than company-specific news, so there's no benefit
// to regenerating this often.
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Salary, hiring companies, exit paths, and required skills are researched
// together via one real web-search call (see gemini.js's
// generateGroundedText) rather than left to the main overview call's
// parametric recall - all four are things a search can actually verify
// (current pay data, who's actually hiring right now, common real career
// trajectories, what real job postings actually list as requirements),
// unlike "what" (a plain-language description) which stays descriptive
// rather than factual. Live-tested that one combined prompt covering all
// four still reliably triggers real search (multiple distinct queries, real
// source citations) rather than needing four separate calls.
const RESEARCH_SYSTEM_PROMPT = `Research the given job role for a student preparing for campus placements in India. Actively search multiple reliable sources (Glassdoor, AmbitionBox, Naukri, LinkedIn, Levels.fyi, job listing sites, career-path articles) before answering - do not rely on memory alone. Report: (1) the current campus/early-career salary range in INR LPA, (2) 5-7 real companies actually hiring for this role in India right now, (3) 2-3 realistic next-role/career-path options people in this role commonly move into, (4) 4-5 concrete skills real job postings for this role actually list as requirements. Plain prose, under 180 words, organized as four short labeled parts.`;

const SYSTEM_PROMPT = `You are writing a role-overview card for a student preparing for campus placements at companies in India. You will be given a job-role title and, usually, real research already gathered by web search covering salary, hiring companies, exit paths, and required skills.

If research is provided below, base "salary", "salaryNote", "companies", "exits", and "skills" directly on it - do not override it with your own guess or add items it didn't mention. If no research is provided (a search failure), fall back to realistic estimates using your general knowledge and say so explicitly in salaryNote.

Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{
  "what": "2-3 sentence plain-language description of what this role actually does day to day and how it's judged",
  "companies": ["Company A", "Company B", ... 5-7 real employers, from the research if provided],
  "salary": "₹X-Y LPA",
  "salaryNote": "one short line grounding the range (e.g. what it's based on, that it varies by company tier/year)",
  "skills": ["...", ... 4-5 concrete skills this role actually requires, from the research if provided],
  "exits": ["...", ... 2-3 realistic next roles or career paths, from the research if provided]
}`;

async function researchRole(roleName) {
  try {
    const { text, grounded, sources } = await generateGroundedText({
      system: RESEARCH_SYSTEM_PROMPT,
      prompt: `ROLE: ${roleName}`,
      maxTokens: 700
    });
    return { text, grounded, sources };
  } catch {
    // Best-effort - a failed search shouldn't block the overview from
    // generating, it'll just fall back to explicitly-flagged estimates.
    return { text: "", grounded: false, sources: [] };
  }
}

/**
 * Generates/caches the overview genuinely for whatever roleName is given -
 * NOT snapped to a canonical role (unlike getRoleTopics). A user typing a
 * role outside the curated 50-title list (e.g. "Sales Associate") should see
 * an overview that's actually about that role, not a substituted nearest
 * match with a different name in the "what it is" text - see routes/roles.js.
 * @param {string} roleName
 * @returns {Promise<{what, companies, salary, salaryNote, skills, exits, cached, fetchedAt}>}
 */
export async function getRoleOverview(roleName) {
  const { data: cached, error: cacheError } = await supabase
    .from("role_overview_cache")
    .select("*")
    .eq("role_name", roleName)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const isFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return {
      what: cached.what, companies: cached.companies, salary: cached.salary,
      salaryNote: cached.salary_note, skills: cached.skills, exits: cached.exits,
      cached: true, fetchedAt: cached.fetched_at
    };
  }

  const research = await researchRole(roleName);
  const researchContext = research.grounded
    ? `RESEARCH (from real web search just now - use this for "salary", "salaryNote", "companies", "exits", and "skills", don't independently guess):\n${research.text}`
    : `(Web search was unavailable this time - use your general knowledge for salary/companies/exits/skills and say in salaryNote that it's an unverified estimate.)`;

  const prompt = `ROLE: ${roleName}\n\n${researchContext}\n\nGenerate the role-overview JSON as specified.`;
  const overview = await generateJSON({ system: SYSTEM_PROMPT, prompt, maxTokens: 900 });

  const row = {
    role_name: roleName,
    what: overview.what || "",
    companies: Array.isArray(overview.companies) ? overview.companies : [],
    salary: overview.salary || "",
    salary_note: overview.salaryNote || "",
    skills: Array.isArray(overview.skills) ? overview.skills : [],
    exits: Array.isArray(overview.exits) ? overview.exits : [],
    fetched_at: new Date().toISOString()
  };
  const { error: upsertError } = await supabase
    .from("role_overview_cache")
    .upsert(row, { onConflict: "role_name" });
  if (upsertError) throw upsertError;

  return {
    what: row.what, companies: row.companies, salary: row.salary,
    salaryNote: row.salary_note, skills: row.skills, exits: row.exits,
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
// current process).
// ---------------------------------------------------------------------------

const RESEARCH_AT_COMPANY_SYSTEM_PROMPT = `Research the given job role specifically AT the given company, for a student preparing for a campus placement interview in India. Actively search multiple reliable sources (Glassdoor, AmbitionBox, Naukri, LinkedIn, company careers page, campus placement reports) before answering - do not rely on memory alone. Report, specific to this exact company where you can find it (say plainly when something is a general estimate instead, e.g. "not company-specific data found, industry-typical range shown"): (1) the current campus/early-career salary range in INR LPA at this company, (2) this company's typical interview process/rounds for this role (e.g. number of rounds, what each round tests), (3) 2-3 realistic next-role/promotion paths within or after this company for someone in this role, (4) 4-5 concrete skills this company's own job postings/interview reports for this role actually mention. Plain prose, under 180 words, organized as four short labeled parts.`;

const AT_COMPANY_SYSTEM_PROMPT = `You are writing a role-overview card for a student preparing for a campus placement interview for a specific role AT a specific company, in India. You will be given the role, the company, and usually real research already gathered by web search covering salary, interview process, promotion paths, and required skills at that company.

If research is provided below, base "salary", "salaryNote", "process", "exits", and "skills" directly on it - do not override it with your own guess or add items it didn't mention. Never assert a precise, confident claim about this exact company's current process/numbers beyond what the research supports - approximate with "~" or frame as "typically" rather than stating an unverified specific as fact. If no research is provided (a search failure), fall back to realistic estimates using your general knowledge and say so explicitly in salaryNote.

Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{
  "what": "2-3 sentence plain-language description of what this role does at this company specifically - how it's judged there, what's distinctive about it at this employer if anything is",
  "process": ["...", ... 3-5 short steps/rounds describing this company's typical interview process for this role, from the research if provided],
  "salary": "₹X-Y LPA",
  "salaryNote": "one short line grounding the range to this company specifically (or noting it's an industry-typical estimate if company-specific data wasn't found)",
  "skills": ["...", ... 4-5 concrete skills this company's own postings/process for this role actually emphasize, from the research if provided],
  "exits": ["...", ... 2-3 realistic promotion paths or next roles within/after this company, from the research if provided]
}`;

async function researchRoleAtCompany(roleName, companyName) {
  try {
    const { text, grounded, sources } = await generateGroundedText({
      system: RESEARCH_AT_COMPANY_SYSTEM_PROMPT,
      prompt: `ROLE: ${roleName}\nCOMPANY: ${companyName}`,
      maxTokens: 700
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
 * @returns {Promise<{what, process, salary, salaryNote, skills, exits, cached, fetchedAt}>}
 */
export async function getRoleOverviewAtCompany(roleName, companyName) {
  const { data: cached, error: cacheError } = await supabase
    .from("role_company_overview_cache")
    .select("*")
    .eq("role_name", roleName)
    .eq("company_name", companyName)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const isFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return {
      what: cached.what, process: cached.process, salary: cached.salary,
      salaryNote: cached.salary_note, skills: cached.skills, exits: cached.exits,
      cached: true, fetchedAt: cached.fetched_at
    };
  }

  const research = await researchRoleAtCompany(roleName, companyName);
  const researchContext = research.grounded
    ? `RESEARCH (from real web search just now - use this for "salary", "salaryNote", "process", "exits", and "skills", don't independently guess):\n${research.text}`
    : `(Web search was unavailable this time - use your general knowledge for salary/process/exits/skills and say in salaryNote that it's an unverified estimate.)`;

  const prompt = `ROLE: ${roleName}\nCOMPANY: ${companyName}\n\n${researchContext}\n\nGenerate the role-at-company overview JSON as specified.`;
  const overview = await generateJSON({ system: AT_COMPANY_SYSTEM_PROMPT, prompt, maxTokens: 900 });

  const row = {
    role_name: roleName,
    company_name: companyName,
    what: overview.what || "",
    process: Array.isArray(overview.process) ? overview.process : [],
    salary: overview.salary || "",
    salary_note: overview.salaryNote || "",
    skills: Array.isArray(overview.skills) ? overview.skills : [],
    exits: Array.isArray(overview.exits) ? overview.exits : [],
    fetched_at: new Date().toISOString()
  };
  const { error: upsertError } = await supabase
    .from("role_company_overview_cache")
    .upsert(row, { onConflict: "role_name,company_name" });
  if (upsertError) throw upsertError;

  return {
    what: row.what, process: row.process, salary: row.salary,
    salaryNote: row.salary_note, skills: row.skills, exits: row.exits,
    cached: false, fetchedAt: row.fetched_at
  };
}

import { supabase } from "./supabase.js";
import { generateJSON, generateGroundedText, embedTexts } from "./gemini.js";
import { runInSandbox } from "./sandbox.js";
import { normalizeCacheKey } from "./cacheKey.js";
import { singleFlight } from "./singleFlight.js";
import { CONTENT_VERSION } from "./contentVersion.js";
import { ROLE_CONTENT_RULES } from "./roleContentRules.js";
import { checkContentBatch, repairExplanation } from "./contentVerifier.js";

// Same long-TTL reasoning as roleOverview.js - a skill's core concepts and
// practice problems don't need regenerating often.
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PROBLEMS_PER_DIFFICULTY = 6;
const EXEC_TIMEOUT_MS = 8000;
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export function normalizeDifficulty(raw) {
  const s = String(raw || "").trim().toLowerCase();
  return DIFFICULTIES.find(d => d.toLowerCase() === s) || null;
}

// Only SQL and Python get an in-browser editor + verified auto-grading (the
// two languages explicitly asked for, and the two with a mature, lightweight
// WASM runtime available for both server-side verification here and
// client-side execution in the browser - sql.js and Pyodide). Everything
// else (Excel, "stakeholder management", etc.) gets concepts + open-ended
// practice prompts with no grading claim - there's no reliable way to
// auto-grade a written answer to a soft-skill prompt the way a query result
// or a function's output can be checked.
function detectLanguage(skillName) {
  const s = String(skillName || "").toLowerCase();
  if (/\bsql\b/.test(s)) return "sql";
  if (/\bpython\b/.test(s)) return "python";
  return null;
}

export function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Which concept (from the skill's own concepts list) a given problem index
// should test - assigned deterministically in code (round-robin) rather
// than trusting a model-written string to exactly match a concept title.
function conceptFor(concepts, index) {
  if (!concepts.length) return null;
  return concepts[index % concepts.length];
}

// Same RAG pattern as resume.js/mockInterview.js/story.js/roleTopics.js:
// pull real excerpts from the ingested casebook corpus so concepts and
// practice problems can draw on actual interview material. Retrieved once
// per skill (not per difficulty/problem) and cached alongside the concepts
// row - see getSkillMeta/getSkillProblems - so generating problems for a
// second or third difficulty tier reuses it instead of re-embedding.
async function retrieveContext(roleName, skillName) {
  try {
    const [queryEmbedding] = await embedTexts(
      [`${roleName} ${skillName} interview questions case studies practice`],
      "RETRIEVAL_QUERY"
    );
    const { data: chunks } = await supabase.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_count: 6,
      filter_domain: null
    });
    return (chunks || []).map((c, i) => `[Source ${i + 1}: ${c.source_file}]\n${c.content}`).join("\n\n---\n\n");
  } catch {
    return "";
  }
}

function contextBlock(context) {
  return context ? `CONTEXT (real interview casebook excerpts - use where genuinely relevant, don't force-fit):\n${context}\n\n` : "";
}

// ---------------------------------------------------------------------------
// Concepts (same for every skill/difficulty, code or not) - descriptive, not
// a verifiable-fact search candidate, so ungrounded like roleOverview.js's "what".
//
// Tiered (basic/intermediate/advanced), each concept a real explanation, not
// a one-line teaser - a live user report flagged the old one-line-plus-
// outbound-link shape as too vague ("instead of some random links... what
// exactly is GTM, how do we do GTM, does it use Porter's Five Forces").
// A concept's own explanation is now the primary content; an outbound link
// (see getConceptLink below - fetched lazily on click, not at generation
// time) is a secondary "learn more", not the only substance on the page.
// ---------------------------------------------------------------------------

const CONCEPT_TIERS = ["basic", "intermediate", "advanced"];

const CONCEPTS_SYSTEM_PROMPT = `${ROLE_CONTENT_RULES}

You are writing an in-depth learning primer for a specific skill, in the context of a specific job role, for a student preparing for campus placements in India. If CONTEXT excerpts from real interview casebooks are provided, let them inform which concepts you pick and how you frame them where genuinely relevant - don't force an irrelevant excerpt in.

Organize the primer into three tiers, each building on the last:
- basic: foundational - what any candidate should know walking in.
- intermediate: what separates a good answer from a generic one.
- advanced: what a strong, experienced candidate would bring up unprompted.
Never repeat the same concept across tiers.

For each concept, write a genuinely substantive explanation aimed at someone learning it for the first time (not someone who already half-knows it): what it actually is, how it's done/applied in practice, and any standard frameworks, models, or key terms a candidate would be expected to know when discussing it (e.g. Porter's Five Forces for a market/competitive-strategy concept, MECE for a structuring concept, specific SQL clauses for a query concept) - only when a real framework or term genuinely applies, never force one in for a concept that doesn't call for it.

Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{
  "basic": [{"title": "...", "explanation": "3-6 sentences covering what it is, why it matters for this role, and how it's actually applied"}, ... 3-4 concepts],
  "intermediate": [{"title": "...", "explanation": "..."}, ... 3-4 concepts],
  "advanced": [{"title": "...", "explanation": "..."}, ... 2-3 concepts]
}`;

function emptyTieredConcepts() {
  return { basic: [], intermediate: [], advanced: [] };
}

function isValidTieredConcepts(c) {
  return !!c && typeof c === "object" && !Array.isArray(c) &&
    CONCEPT_TIERS.every(t => Array.isArray(c[t]));
}

function flattenConcepts(tiered) {
  return CONCEPT_TIERS.flatMap(t => tiered[t] || []);
}

// Targeted single-concept regeneration for a concept whose explanation
// failed the content check - cheaper and safer than re-running the whole
// 3-tier batch (which could re-break an already-fine concept). Phase 1.7
// item 4: given the actual issue text, so the regeneration targets the real
// problem instead of blindly re-rolling.
async function regenerateConceptExplanation(roleName, skillName, tier, title, context, issue) {
  const result = await generateJSON({
    system: `${ROLE_CONTENT_RULES}\n\nYou are regenerating ONE concept's explanation because the previous version failed a content check. Respond with ONLY a JSON object: {"explanation": "3-6 sentences, strictly on-topic, every number recomputed correctly, no company name unless genuinely required"}`,
    prompt: `${contextBlock(context)}ROLE: ${roleName}\nSKILL: ${skillName}\nTIER: ${tier}\nCONCEPT: ${title}\n\nThe previous version had this problem: ${issue}. Fix it and keep everything else correct. Regenerate the explanation.`,
    maxTokens: 500
  });
  return typeof result.explanation === "string" ? result.explanation : null;
}

function conceptItemId(tier, index) { return `${tier}-${index}`; }

// Phase 1.7 item 2: every concept's explanation (8-11 per skill, across the
// 3 tiers) is checked in ONE batched call instead of one checkContent call
// per concept. Failures get targeted repair (item 4, up to 2 attempts, each
// given the real issue text) - never re-run on a cache hit, since the
// result is stored on the concept itself.
async function verifyConcepts(roleName, skillName, tiered, context) {
  const items = [];
  for (const tier of CONCEPT_TIERS) {
    (tiered[tier] || []).forEach((c, i) => items.push({ id: conceptItemId(tier, i), text: c.explanation }));
  }
  const checkResults = await checkContentBatch(items);

  const out = emptyTieredConcepts();
  for (const tier of CONCEPT_TIERS) {
    out[tier] = [];
    const list = tiered[tier] || [];
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      const next = { ...c };
      const firstResult = checkResults.get(conceptItemId(tier, i));
      const v = await repairExplanation(c.explanation, firstResult, async (issue) => {
        const regenerated = await regenerateConceptExplanation(roleName, skillName, tier, c.title, context, issue);
        next.explanation = regenerated || c.explanation;
        return next.explanation;
      });
      next.verified = { checked: v.checked, passed: v.passed, issue: v.issue };
      out[tier].push(next);
    }
  }
  return out;
}

async function generateConcepts(roleName, skillName, context) {
  const result = await generateJSON({
    system: CONCEPTS_SYSTEM_PROMPT,
    prompt: `${contextBlock(context)}ROLE: ${roleName}\nSKILL: ${skillName}\n\nGenerate the concepts JSON as specified.`,
    maxTokens: 2500
  });
  const tiered = emptyTieredConcepts();
  for (const tier of CONCEPT_TIERS) {
    if (Array.isArray(result[tier])) tiered[tier] = result[tier];
  }
  return verifyConcepts(roleName, skillName, tiered, context);
}

// A concept title on the Skill page links out to one real, in-depth
// resource on the web - found via grounded search, never a model-guessed
// content URL (LLMs hallucinate URLs far too often to trust one written
// directly into a JSON field). If grounded search genuinely finds nothing,
// every concept still gets a clickable link - a plain web search for the
// concept - rather than being left non-clickable. That's still never a
// fabricated destination (the search URL itself is always real and always
// resolves), just a lower-confidence one than a specific found article.
const CONCEPT_LINK_SYSTEM_PROMPT = `You are finding the single best external web resource to help a student learn one specific concept in depth, while preparing for a campus placement interview in India. Actively search the web and identify one specific, well-explained page - a tutorial, reference doc, or in-depth article from a reliable, well-known source (e.g. GeeksforGeeks, W3Schools, Real Python, Mode Analytics, official language/library docs, Khan Academy, freeCodeCamp) appropriate to the topic. Respond with one short sentence naming the resource and site you found.`;

function searchFallbackLink(skillName, concept) {
  const q = `${concept.title} ${skillName} explained`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

async function findConceptLink(roleName, skillName, concept) {
  try {
    const { grounded, sources } = await generateGroundedText({
      system: CONCEPT_LINK_SYSTEM_PROMPT,
      prompt: `ROLE: ${roleName}\nSKILL: ${skillName}\nCONCEPT: ${concept.title} — ${concept.explanation}\n\nFind the single best resource explaining this concept in depth.`,
      maxTokens: 200
    });
    return grounded && sources.length ? sources[0].uri : searchFallbackLink(skillName, concept);
  } catch (err) {
    console.warn(`[skillContent] concept link lookup failed for "${concept.title}": ${err.message}`);
    return searchFallbackLink(skillName, concept);
  }
}

// Phase 1.7 item 2: links are no longer fetched eagerly for every concept
// at page-generation time (a grounded search call per concept - 7-9 of a
// role's ~55 cold calls in the Phase 1.6 test matrix, for links most users
// never click). getConceptLink below fetches one on first click instead;
// this just reports whether a concept already has one cached, so the
// frontend knows to call that endpoint instead of rendering a dead link.

/**
 * Fetches (and persists) the "learn more" link for ONE concept, on first
 * click - never at page generation. Reads the current skill_content_cache
 * row, finds the concept by tier+title, returns its link if already cached,
 * otherwise finds one and writes it back into the row so every later user
 * of this role/skill gets the cached link with no further lookup.
 * @returns {Promise<string>}
 */
export async function getConceptLink(roleName, skillName, tier, title) {
  const roleKey = normalizeCacheKey(roleName);
  const skillKey = normalizeCacheKey(skillName);
  return singleFlight(`conceptLink:${roleKey}::${skillKey}::${tier}::${normalizeCacheKey(title)}`, async () => {
    const { data: cached, error: cacheError } = await supabase
      .from("skill_content_cache")
      .select("concepts")
      .eq("role_name", roleKey)
      .eq("skill_name", skillKey)
      .maybeSingle();
    if (cacheError) throw cacheError;
    const tiered = isValidTieredConcepts(cached?.concepts) ? cached.concepts : emptyTieredConcepts();
    const list = tiered[tier] || [];
    const idx = list.findIndex(c => c.title === title);
    const existing = idx >= 0 ? list[idx] : null;
    if (existing?.link) return existing.link;

    const concept = existing || { title, explanation: "" };
    const link = await findConceptLink(roleName, skillName, concept);
    if (idx >= 0) {
      list[idx] = { ...existing, link };
      const { error: updateError } = await supabase
        .from("skill_content_cache")
        .update({ concepts: tiered })
        .eq("role_name", roleKey)
        .eq("skill_name", skillKey);
      if (updateError) console.warn(`[skillContent] failed to persist concept link: ${updateError.message}`);
    }
    return link;
  });
}

// ---------------------------------------------------------------------------
// SQL problems - schema + seed data + a reference solution query, all
// generated by Gemini, then the reference solution is actually EXECUTED
// (via sql.js, the same lightweight WASM SQLite build used client-side) to
// compute the real expected result. Never trust Gemini's own claim of what
// a query returns - a hand-typed "expected result" is exactly the kind of
// thing a model can get subtly wrong.
// ---------------------------------------------------------------------------

const SQL_PROBLEM_SYSTEM_PROMPT = `You are writing a SQL practice problem for a student preparing for a job interview in India, for a specific role, at a specific difficulty level and testing a specific concept. If CONTEXT excerpts from real interview casebooks are provided and one describes a scenario relevant to the concept, base the word-problem's scenario/domain on it for realism - don't force an irrelevant excerpt in, and the schema/data/solution must still be entirely self-contained and correct regardless of what CONTEXT says. Design a small, realistic dataset (2-3 tables, 5-15 rows total) relevant to that role's domain, a word-problem question answerable with one SQL query against it, and a correct reference solution.

Respond with ONLY a JSON object, no markdown fences, no commentary:
{
  "prompt": "the word-problem question, plain English. Wrap only the few most important words or short phrases (the exact deliverable, key column/table names, specific numbers or conditions) in **double asterisks** for emphasis - most of the sentence should stay unformatted, do not bold whole clauses",
  "schemaSql": "one or more CREATE TABLE statements, SQLite-compatible syntax",
  "seedSql": "INSERT statements populating the tables with realistic sample data",
  "solutionSql": "a single correct SELECT query answering the prompt against that schema/data"
}`;

// Runs out-of-process with a hard kill on timeout (see sandbox.js) - an
// in-process sql.js query (e.g. a runaway recursive CTE) can't be
// interrupted by withTimeout().
export async function runSqlQuery(schemaSql, seedSql, querySql) {
  return runInSandbox("sql", { schemaSql, seedSql, querySql }, EXEC_TIMEOUT_MS, "SQL verification");
}

export async function generateOneSqlProblem(roleName, skillName, index, difficulty, concept, context) {
  const result = await generateJSON({
    system: SQL_PROBLEM_SYSTEM_PROMPT,
    prompt: `${contextBlock(context)}ROLE: ${roleName}\nSKILL: ${skillName}\nDIFFICULTY: ${difficulty}\nCONCEPT TO TEST: ${concept ? `${concept.title} — ${concept.explanation}` : skillName}\n\nGenerate practice problem ${index + 1} of ${PROBLEMS_PER_DIFFICULTY} (a different concrete scenario/dataset than a typical problem ${index} would use, so the set isn't repetitive), at ${difficulty} difficulty, specifically exercising the concept above.`,
    maxTokens: 1200
  });
  const { prompt, schemaSql, seedSql, solutionSql } = result;
  if (!prompt || !schemaSql || !seedSql || !solutionSql) throw new Error("Incomplete SQL problem generation");
  // Executing the reference solution IS the verification - if this throws
  // (bad SQL, schema/solution mismatch), the caller retries with a fresh
  // generation rather than caching a problem with no trustworthy answer.
  const expectedResult = await runSqlQuery(schemaSql, seedSql, solutionSql);
  return {
    id: `sql-${difficulty.toLowerCase()}-${index}`, prompt, difficulty,
    concept: concept ? concept.title : null,
    schemaSql, seedSql, solutionSql, expectedResult
  };
}

const SQL_PROBLEMS_BATCH_SYSTEM_PROMPT = `You are writing SQL practice problems for a student preparing for a job interview in India, for a specific role and difficulty level, each testing a specific concept. If CONTEXT excerpts from real interview casebooks are provided and one describes a scenario relevant to a concept, base that problem's scenario/domain on it for realism - don't force an irrelevant excerpt in, and every schema/data/solution must still be entirely self-contained and correct regardless of what CONTEXT says. For EACH problem, design its own small, realistic dataset (2-3 tables, 5-15 rows total) relevant to that role's domain, a word-problem question answerable with one SQL query against it, and a correct reference solution. Make the ${PROBLEMS_PER_DIFFICULTY} problems genuinely different scenarios/datasets from each other, not repetitive.

Respond with ONLY a JSON object, no markdown fences, no commentary:
{"problems": [{"prompt": "the word-problem question, plain English. Wrap only the few most important words or short phrases (the exact deliverable, key column/table names, specific numbers or conditions) in **double asterisks** for emphasis - most of the sentence should stay unformatted, do not bold whole clauses", "schemaSql": "one or more CREATE TABLE statements, SQLite-compatible syntax", "seedSql": "INSERT statements populating the tables with realistic sample data", "solutionSql": "a single correct SELECT query answering the prompt against that schema/data"}, ... exactly ${PROBLEMS_PER_DIFFICULTY}, one per concept given, in the same order]}`;

// Phase 1.7 item 2: all 6 problems generated in ONE call (was up to 6
// separate generation calls, each with its own up-to-3-attempt retry loop -
// up to 18 calls in the worst case). Sandbox execution still verifies every
// problem's reference solution (that's the real check, not the generation),
// but a problem that fails execution is now dropped rather than retried
// with another generation call - this trades "always exactly 6 problems"
// for "no per-problem generation calls", per the Phase 1.7 instruction.
async function generateSqlProblems(roleName, skillName, difficulty, concepts, context) {
  const targets = Array.from({ length: PROBLEMS_PER_DIFFICULTY }, (_, i) => conceptFor(concepts, i));
  const conceptList = targets.map((c, i) => `${i + 1}. ${c ? `${c.title} — ${c.explanation}` : skillName}`).join("\n");
  const result = await generateJSON({
    system: SQL_PROBLEMS_BATCH_SYSTEM_PROMPT,
    prompt: `${contextBlock(context)}ROLE: ${roleName}\nSKILL: ${skillName}\nDIFFICULTY: ${difficulty}\n\nGenerate one practice problem for each concept below, in this exact order:\n${conceptList}\n\nGenerate the JSON as specified.`,
    maxTokens: 7000
  });
  const raw = Array.isArray(result.problems) ? result.problems : [];
  const problems = [];
  for (let i = 0; i < raw.length; i++) {
    const p = raw[i] || {};
    if (!p.prompt || !p.schemaSql || !p.seedSql || !p.solutionSql) {
      console.warn(`[skillContent] SQL problem ${i} (${difficulty}) incomplete generation, dropping (no per-problem regeneration)`);
      continue;
    }
    try {
      const expectedResult = await runSqlQuery(p.schemaSql, p.seedSql, p.solutionSql);
      problems.push({
        id: `sql-${difficulty.toLowerCase()}-${i}`, prompt: p.prompt, difficulty,
        concept: targets[i] ? targets[i].title : null,
        schemaSql: p.schemaSql, seedSql: p.seedSql, solutionSql: p.solutionSql, expectedResult
      });
    } catch (err) {
      console.warn(`[skillContent] SQL problem ${i} (${difficulty}) failed sandbox execution, dropping (no per-problem regeneration): ${err.message}`);
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Python problems - a function stub, a reference solution, and test-case
// inputs, all generated by Gemini, then the reference solution is actually
// EXECUTED (via Pyodide, a WASM CPython build, in a separate sandboxed
// process - see sandbox.js) against each test input to compute the real
// expected output. Solutions are always required to define a function named
// `solve` so the harness never needs to know an arbitrary function name.
// ---------------------------------------------------------------------------

const PYTHON_PROBLEM_SYSTEM_PROMPT = `You are writing a Python practice problem for a student preparing for a job interview in India, for a specific role, at a specific difficulty level and testing a specific concept. If CONTEXT excerpts from real interview casebooks are provided and one describes a scenario relevant to the concept, base the problem's scenario/domain on it for realism - don't force an irrelevant excerpt in, and the function/logic/solution must still be entirely self-contained and correct regardless of what CONTEXT says. Design a small, realistic problem solvable with a single function.

The function MUST be named exactly "solve". Test case inputs must be JSON-serializable (numbers, strings, lists, dicts, booleans) and the function's return value must also be JSON-serializable.

Respond with ONLY a JSON object, no markdown fences, no commentary:
{
  "prompt": "the problem statement, plain English, stating the function signature expected (e.g. \\"Write solve(orders: list[dict]) -> float that returns...\\"). Wrap only the few most important words or short phrases (the function signature, key field names, specific numbers or conditions) in **double asterisks** for emphasis - most of the sentence should stay unformatted, do not bold whole clauses",
  "starterCode": "def solve(...):\\n    # your code here\\n    pass",
  "solutionCode": "def solve(...):\\n    ...(a correct, complete implementation)",
  "testCases": [{"args": [...positional arguments to call solve() with], "label": "short description of this case"}, ... 3-4 cases]
}`;

// Runs the generated solution in a sandboxed child process (see
// sandbox.js / sandboxRunner.js for the harness) - never in this process,
// which holds the API keys.
export async function runPythonSolve(code, testCases) {
  const argsJson = JSON.stringify(testCases.map(t => t.args));
  return runInSandbox("python", { code, argsJson }, EXEC_TIMEOUT_MS, "Python verification");
}

export async function generateOnePythonProblem(roleName, skillName, index, difficulty, concept, context) {
  const result = await generateJSON({
    system: PYTHON_PROBLEM_SYSTEM_PROMPT,
    prompt: `${contextBlock(context)}ROLE: ${roleName}\nSKILL: ${skillName}\nDIFFICULTY: ${difficulty}\nCONCEPT TO TEST: ${concept ? `${concept.title} — ${concept.explanation}` : skillName}\n\nGenerate practice problem ${index + 1} of ${PROBLEMS_PER_DIFFICULTY} (a different topic than a typical problem ${index} would use, so the set isn't repetitive), at ${difficulty} difficulty, specifically exercising the concept above.`,
    maxTokens: 1200
  });
  const { prompt, starterCode, solutionCode, testCases } = result;
  if (!prompt || !starterCode || !solutionCode || !Array.isArray(testCases) || !testCases.length) {
    throw new Error("Incomplete Python problem generation");
  }
  const expectedOutputs = await runPythonSolve(solutionCode, testCases);
  const cases = testCases.map((t, i) => ({ args: t.args, label: t.label || `Case ${i + 1}`, expectedOutput: expectedOutputs[i] }));
  return {
    id: `py-${difficulty.toLowerCase()}-${index}`, prompt, difficulty,
    concept: concept ? concept.title : null,
    starterCode, solutionCode, testCases: cases
  };
}

const PYTHON_PROBLEMS_BATCH_SYSTEM_PROMPT = `You are writing Python practice problems for a student preparing for a job interview in India, for a specific role and difficulty level, each testing a specific concept. If CONTEXT excerpts from real interview casebooks are provided and one describes a scenario relevant to a concept, base that problem's scenario/domain on it for realism - don't force an irrelevant excerpt in, and every function/logic/solution must still be entirely self-contained and correct regardless of what CONTEXT says. Design each as a small, realistic problem solvable with a single function. Make the ${PROBLEMS_PER_DIFFICULTY} problems genuinely different topics from each other, not repetitive.

Every function MUST be named exactly "solve". Test case inputs must be JSON-serializable (numbers, strings, lists, dicts, booleans) and each function's return value must also be JSON-serializable.

Respond with ONLY a JSON object, no markdown fences, no commentary:
{"problems": [{"prompt": "the problem statement, plain English, stating the function signature expected (e.g. \\"Write solve(orders: list[dict]) -> float that returns...\\"). Wrap only the few most important words or short phrases (the function signature, key field names, specific numbers or conditions) in **double asterisks** for emphasis - most of the sentence should stay unformatted, do not bold whole clauses", "starterCode": "def solve(...):\\n    # your code here\\n    pass", "solutionCode": "def solve(...):\\n    ...(a correct, complete implementation)", "testCases": [{"args": [...positional arguments to call solve() with], "label": "short description of this case"}, ... 3-4 cases]}, ... exactly ${PROBLEMS_PER_DIFFICULTY}, one per concept given, in the same order]}`;

// Phase 1.7 item 2: same single-call-plus-sandbox-verify approach as SQL
// above - see its comment for the drop-rather-than-retry tradeoff.
async function generatePythonProblems(roleName, skillName, difficulty, concepts, context) {
  const targets = Array.from({ length: PROBLEMS_PER_DIFFICULTY }, (_, i) => conceptFor(concepts, i));
  const conceptList = targets.map((c, i) => `${i + 1}. ${c ? `${c.title} — ${c.explanation}` : skillName}`).join("\n");
  const result = await generateJSON({
    system: PYTHON_PROBLEMS_BATCH_SYSTEM_PROMPT,
    prompt: `${contextBlock(context)}ROLE: ${roleName}\nSKILL: ${skillName}\nDIFFICULTY: ${difficulty}\n\nGenerate one practice problem for each concept below, in this exact order:\n${conceptList}\n\nGenerate the JSON as specified.`,
    maxTokens: 7000
  });
  const raw = Array.isArray(result.problems) ? result.problems : [];
  const problems = [];
  for (let i = 0; i < raw.length; i++) {
    const p = raw[i] || {};
    if (!p.prompt || !p.starterCode || !p.solutionCode || !Array.isArray(p.testCases) || !p.testCases.length) {
      console.warn(`[skillContent] Python problem ${i} (${difficulty}) incomplete generation, dropping (no per-problem regeneration)`);
      continue;
    }
    try {
      const expectedOutputs = await runPythonSolve(p.solutionCode, p.testCases);
      const cases = p.testCases.map((t, ci) => ({ args: t.args, label: t.label || `Case ${ci + 1}`, expectedOutput: expectedOutputs[ci] }));
      problems.push({
        id: `py-${difficulty.toLowerCase()}-${i}`, prompt: p.prompt, difficulty,
        concept: targets[i] ? targets[i].title : null,
        starterCode: p.starterCode, solutionCode: p.solutionCode, testCases: cases
      });
    } catch (err) {
      console.warn(`[skillContent] Python problem ${i} (${difficulty}) failed sandbox execution, dropping (no per-problem regeneration): ${err.message}`);
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Non-code skills - open-ended practice prompts, no grading claim. A single
// batched call (unlike SQL/Python, there's no per-problem execution/schema
// design to justify separate calls) generates all 6 at once, each explicitly
// targeted at one of the skill's concepts in order, so the concept tag
// assigned afterward in code actually matches what was asked for.
// ---------------------------------------------------------------------------

const OPEN_PROBLEM_SYSTEM_PROMPT = `You are writing open-ended practice prompts for a specific skill, in the context of a specific job role, for a student preparing for a job interview in India, at a specific difficulty level. If CONTEXT excerpts from real interview casebooks are provided, let them inform the scenarios where genuinely relevant to a concept - don't force an irrelevant excerpt in. In both "prompt" and "modelAnswer", wrap only the few most important words or short phrases (the core scenario, the specific ask, key terms) in **double asterisks** for emphasis - most of the text should stay unformatted, do not bold whole sentences. Respond with ONLY a JSON object: {"problems": [{"prompt": "...", "modelAnswer": "2-4 sentence strong model answer covering the key points a student should hit"}, ... exactly as many as concepts listed, same order]}`;

async function generateOpenProblems(roleName, skillName, difficulty, concepts, context) {
  const targets = Array.from({ length: PROBLEMS_PER_DIFFICULTY }, (_, i) => conceptFor(concepts, i));
  const conceptList = targets.map((c, i) => `${i + 1}. ${c ? `${c.title} — ${c.explanation}` : skillName}`).join("\n");
  const result = await generateJSON({
    system: OPEN_PROBLEM_SYSTEM_PROMPT,
    prompt: `${contextBlock(context)}ROLE: ${roleName}\nSKILL: ${skillName}\nDIFFICULTY: ${difficulty}\n\nGenerate one practice prompt for each concept below, in this exact order:\n${conceptList}\n\nGenerate the JSON as specified.`,
    maxTokens: 900
  });
  const problems = Array.isArray(result.problems) ? result.problems : [];
  return problems.map((p, i) => ({
    id: `open-${difficulty.toLowerCase()}-${i}`, prompt: p.prompt, difficulty,
    concept: targets[i] ? targets[i].title : null,
    modelAnswer: p.modelAnswer || ""
  }));
}

// ---------------------------------------------------------------------------

// Qualitative AI feedback for a candidate's own written answer to an
// open-ended (non-code) practice problem. Deliberately shaped like Mock
// Interview's answer feedback (score + strengths + improvements + a
// stronger sample) rather than a pass/fail verdict - there's no reliable
// way to auto-grade free text the way a SQL/Python result can be checked,
// but an honest qualitative read is exactly what Mock Interview already
// gives for the same kind of unstructured answer.
const ANSWER_SCORE_SYSTEM_PROMPT = `You are evaluating a candidate's written answer to an open-ended interview-style practice problem, for a specific role and skill. Be constructive but honest.

Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"score": 0-10, "strengths": ["...", "..."], "improvements": ["...", "..."], "sampleBetterAnswer": "a stronger version of the answer"}`;

export async function scoreOpenAnswer(roleName, skillName, problemPrompt, concept, userAnswer) {
  const prompt = `ROLE: ${roleName}\nSKILL: ${skillName}\n${concept ? `CONCEPT TESTED: ${concept}\n` : ""}PROBLEM: ${problemPrompt}\n\nCANDIDATE'S ANSWER: ${userAnswer}\n\nEvaluate the answer as specified.`;
  const feedback = await generateJSON({ system: ANSWER_SCORE_SYSTEM_PROMPT, prompt, maxTokens: 1500 });
  return {
    score: typeof feedback.score === "number" ? feedback.score : null,
    strengths: Array.isArray(feedback.strengths) ? feedback.strengths : [],
    improvements: Array.isArray(feedback.improvements) ? feedback.improvements : [],
    sampleBetterAnswer: feedback.sampleBetterAnswer || ""
  };
}

// ---------------------------------------------------------------------------

/**
 * Concepts + which language (if any) this skill uses - available immediately,
 * independent of any difficulty choice. Cached alongside problems in the same
 * row; regenerating concepts (TTL expiry) invalidates all cached difficulty
 * problem sets too, since their concept tags would otherwise go stale.
 *
 * @returns {Promise<{isCode: boolean, language: string|null, concepts: object[], cached: boolean}>}
 */
export async function getSkillMeta(roleName, skillName) {
  const roleKey = normalizeCacheKey(roleName);
  const skillKey = normalizeCacheKey(skillName);
  // Shared singleFlight key with getSkillProblems (same cache row) - not
  // just the same-request race, but a real read-modify-write hazard: both
  // functions read the row, compute in memory, then write back
  // `{...existingProblems, [difficulty]: problems}`. Two concurrent calls
  // for the same role/skill (even a getSkillMeta + a getSkillProblems, or
  // two different difficulties) could each read the row before the other's
  // write lands, then overwrite each other's difficulty tier on upsert -
  // silent data loss, not just an inconsistent answer. Sharing the lock
  // fully serializes all access to this row.
  return singleFlight(`skillContent:${roleKey}::${skillKey}`, () => fetchSkillMeta(roleName, skillName, roleKey, skillKey));
}

async function fetchSkillMeta(roleName, skillName, roleKey, skillKey) {
  const { data: cached, error: cacheError } = await supabase
    .from("skill_content_cache")
    .select("*")
    .eq("role_name", roleKey)
    .eq("skill_name", skillKey)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const language = detectLanguage(skillName);
  const isCode = !!language;
  const isFresh = cached && cached.content_version === CONTENT_VERSION && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  // isValidTieredConcepts (not Array.isArray) - also catches rows cached
  // before concepts became tiered, so they self-heal via regen on next
  // read instead of breaking on the old flat-array shape.
  const conceptsNeedRegen = !isFresh || !isValidTieredConcepts(cached.concepts);

  // Retrieved once here (not per-problem) and cached on the row so
  // getSkillProblems can reuse it for every difficulty tier without
  // re-embedding/re-querying.
  const context = conceptsNeedRegen ? await retrieveContext(roleName, skillName) : (cached.context || "");
  const concepts = conceptsNeedRegen ? await generateConcepts(roleName, skillName, context) : cached.concepts;

  if (conceptsNeedRegen) {
    const existingProblems = (cached?.problems && typeof cached.problems === "object" && !Array.isArray(cached.problems)) ? cached.problems : {};
    const row = {
      role_name: roleKey, skill_name: skillKey, content_version: CONTENT_VERSION,
      is_code: isCode, language,
      concepts, problems: existingProblems, context,
      fetched_at: new Date().toISOString()
    };
    const { error: upsertError } = await supabase
      .from("skill_content_cache")
      .upsert(row, { onConflict: "role_name,skill_name" });
    if (upsertError) throw upsertError;
  }

  return { isCode, language, concepts, cached: !conceptsNeedRegen };
}

/**
 * The 6 practice problems for one difficulty tier, generated (and verified,
 * for SQL/Python) on first request and cached from then on.
 *
 * @returns {Promise<{isCode: boolean, language: string|null, problems: object[]}>}
 */
export async function getSkillProblems(roleName, skillName, difficulty, { force = false } = {}) {
  const roleKey = normalizeCacheKey(roleName);
  const skillKey = normalizeCacheKey(skillName);
  // Shared lock with getSkillMeta - see its comment for why.
  return singleFlight(`skillContent:${roleKey}::${skillKey}`, () => fetchSkillProblems(roleName, skillName, difficulty, force, roleKey, skillKey));
}

async function fetchSkillProblems(roleName, skillName, difficulty, force, roleKey, skillKey) {
  const { data: cached, error: cacheError } = await supabase
    .from("skill_content_cache")
    .select("*")
    .eq("role_name", roleKey)
    .eq("skill_name", skillKey)
    .maybeSingle();
  if (cacheError) throw cacheError;

  const language = detectLanguage(skillName);
  const isCode = !!language;
  const isFresh = cached && cached.content_version === CONTENT_VERSION && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  const conceptsNeedRegen = !isFresh || !isValidTieredConcepts(cached.concepts);
  // Reuses the context retrieved (and cached) by getSkillMeta's own request
  // for this skill - only re-embeds/re-queries if that never happened or
  // has expired, so adding a 2nd/3rd difficulty tier doesn't re-pay for it.
  const context = conceptsNeedRegen ? await retrieveContext(roleName, skillName) : (cached.context || "");
  const concepts = conceptsNeedRegen ? await generateConcepts(roleName, skillName, context) : cached.concepts;
  const existingProblems = (!conceptsNeedRegen && cached.problems && typeof cached.problems === "object" && !Array.isArray(cached.problems)) ? cached.problems : {};

  if (!force && Array.isArray(existingProblems[difficulty]) && existingProblems[difficulty].length) {
    return { isCode, language, problems: existingProblems[difficulty] };
  }

  // Practice-problem concept-targeting (conceptFor, round-robin) doesn't
  // care about tiers - flatten basic/intermediate/advanced into one pool,
  // same as every problem previously drew from one flat concepts array.
  const flatConcepts = flattenConcepts(concepts);
  const problems = language === "sql" ? await generateSqlProblems(roleName, skillName, difficulty, flatConcepts, context)
    : language === "python" ? await generatePythonProblems(roleName, skillName, difficulty, flatConcepts, context)
    : await generateOpenProblems(roleName, skillName, difficulty, flatConcepts, context);

  const row = {
    role_name: roleKey, skill_name: skillKey, content_version: CONTENT_VERSION,
    is_code: isCode, language,
    concepts, problems: { ...existingProblems, [difficulty]: problems }, context,
    fetched_at: new Date().toISOString()
  };
  const { error: upsertError } = await supabase
    .from("skill_content_cache")
    .upsert(row, { onConflict: "role_name,skill_name" });
  if (upsertError) throw upsertError;

  return { isCode, language, problems };
}

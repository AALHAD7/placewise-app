import { Router } from "express";
import crypto from "node:crypto";
import { optionalAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import { errorDetail } from "../lib/errors.js";
import { resolveRoleTitle } from "../lib/roles.js";
import { getRoleOverview, getRoleOverviewAtCompany } from "../lib/roleOverview.js";
import { getRoleTopics } from "../lib/roleTopics.js";
import { getRoleCompanyTopicNotes } from "../lib/roleCompanyTopicNotes.js";
import { getChipPanel } from "../lib/chipPanel.js";
import { generateJSON } from "../lib/gemini.js";
import { logActivity } from "../lib/activity.js";
import { supabase } from "../lib/supabase.js";

const router = Router();

// Overview card (what/companies/salary/skills/exits) for the "Role" tab.
// roleName can be any typed text - generated and cached directly for
// whatever the user typed (same approach as company overviews), NOT snapped
// to a canonical role. It used to research/generate for resolveRoleTitle's
// nearest-canonical-match instead, which meant a role outside the curated 50
// (e.g. "Sales Associate") got an overview describing a different role
// entirely (e.g. "A Business Development Manager...") while the page still
// showed the user's own typed title as the heading - a visible mismatch a
// user flagged directly. Topics (below) still uses the canonical match, for
// the curriculum-quality/consistency reasons already decided there.
// Optional ?company= tailors the whole card to that role AT that company
// specifically (see getRoleOverviewAtCompany) instead of the role-wide
// version - "companies" (who hires, plural) is replaced by "process" (that
// company's interview rounds for this role) in that mode, since a single
// company is already fixed. Same free-text-whatever-was-typed treatment as
// the role-only path.
router.get("/:roleName", optionalAuth, aiLimiter, async (req, res) => {
  const { roleName } = req.params;
  const trimmed = (roleName || "").trim();
  if (!trimmed || trimmed.length > 100) {
    return res.status(400).json({ success: false, error: "roleName is required (max 100 characters)." });
  }
  const company = (req.query.company || "").toString().trim();
  if (company && company.length > 100) {
    return res.status(400).json({ success: false, error: "company, if given, must be at most 100 characters." });
  }

  try {
    if (company) {
      const overview = await getRoleOverviewAtCompany(trimmed, company);
      return res.json({
        success: true,
        role: {
          requestedTitle: trimmed,
          company,
          what: overview.what,
          process: overview.process,
          salary: overview.salary,
          salaryNote: overview.salaryNote,
          skills: overview.skills,
          careerProgression: overview.careerProgression,
          exitOpportunities: overview.exitOpportunities,
          sources: overview.sources,
          hasTrustedSource: overview.hasTrustedSource,
          hasSupportingSource: overview.hasSupportingSource,
          fetchedAt: overview.fetchedAt
        }
      });
    }

    const overview = await getRoleOverview(trimmed);
    res.json({
      success: true,
      role: {
        requestedTitle: trimmed,
        what: overview.what,
        companies: overview.companies,
        salary: overview.salary,
        salaryNote: overview.salaryNote,
        skills: overview.skills,
        careerProgression: overview.careerProgression,
        exitOpportunities: overview.exitOpportunities,
        sources: overview.sources,
        hasTrustedSource: overview.hasTrustedSource,
        hasSupportingSource: overview.hasSupportingSource,
        fetchedAt: overview.fetchedAt
      }
    });
  } catch (err) {
    console.error("[roles/:roleName]", err);
    res.status(500).json({ success: false, error: "Failed to fetch role info.", detail: errorDetail(err) });
  }
});

// Deep interview-prep curriculum (topics/frameworks/model answers/pitfalls/
// practice prompts/company notes) - separate from the overview above since
// it's a much larger generation; fetched independently so the overview can
// render first without waiting on it.
router.get("/:roleName/topics", optionalAuth, aiLimiter, async (req, res) => {
  const { roleName } = req.params;
  const trimmed = (roleName || "").trim();
  if (!trimmed || trimmed.length > 100) {
    return res.status(400).json({ success: false, error: "roleName is required (max 100 characters)." });
  }

  try {
    const matchedRole = await resolveRoleTitle(trimmed);
    const { topics, groundedInCasebooks, citations } = await getRoleTopics(matchedRole);
    res.json({ success: true, matchedRole, topics, groundedInCasebooks, citations });
  } catch (err) {
    console.error("[roles/:roleName/topics]", err);
    res.status(500).json({ success: false, error: "Failed to fetch role topics.", detail: errorDetail(err) });
  }
});

// "How this shows up by company" (Phase 1 amendment C) - separate from the
// topics call, keyed by (role, company), hidden entirely when casebook RAG
// has nothing real to say about this company (see roleCompanyTopicNotes.js).
router.get("/:roleName/company-notes", optionalAuth, aiLimiter, async (req, res) => {
  const { roleName } = req.params;
  const trimmed = (roleName || "").trim();
  if (!trimmed || trimmed.length > 100) {
    return res.status(400).json({ success: false, error: "roleName is required (max 100 characters)." });
  }
  const company = (req.query.company || "").toString().trim();
  if (!company || company.length > 100) {
    return res.status(400).json({ success: false, error: "company is required (max 100 characters)." });
  }
  const topicsParam = (req.query.topics || "").toString();
  const topicNames = topicsParam.split("|").map(t => t.trim()).filter(Boolean);
  if (!topicNames.length) {
    return res.status(400).json({ success: false, error: "topics (pipe-separated topic names) is required." });
  }

  try {
    const matchedRole = await resolveRoleTitle(trimmed);
    const { notes, citations } = await getRoleCompanyTopicNotes(matchedRole, company, topicNames);
    res.json({ success: true, notes, citations });
  } catch (err) {
    console.error("[roles/:roleName/company-notes]", err);
    res.status(500).json({ success: false, error: "Failed to fetch company notes.", detail: errorDetail(err) });
  }
});

// Chip panels (What?/Why?/How to apply) - Phase 1 amendment D. The prompt
// text itself is still built client-side (frontend/src/lib/prompts.ts owns
// the tuned wording), but caching and generation happen here so the cache
// is shared across every user instead of living in one browser's
// localStorage. company is deliberately not part of the request/key - see
// prompts.ts's whatPrompt/whyPrompt/howPrompt header.
router.post("/chip-panel", optionalAuth, aiLimiter, async (req, res) => {
  const { role, topic, blockId, mode, prompt } = req.body || {};
  if (!role || !topic || !blockId || !mode || !prompt) {
    return res.status(400).json({ success: false, error: "role, topic, blockId, mode and prompt are all required." });
  }
  if (!["what", "why", "how"].includes(mode)) {
    return res.status(400).json({ success: false, error: "mode must be one of: what, why, how." });
  }
  if (String(prompt).length > 4000) {
    return res.status(400).json({ success: false, error: "prompt: too long (max 4000 characters)." });
  }

  try {
    const result = await getChipPanel({ role, topic, blockId, mode, prompt });
    res.json({ success: true, ...result }); // includes groundedInCasebooks/citation (see chipPanel.js)
  } catch (err) {
    console.error("[roles/chip-panel]", err);
    res.status(500).json({ success: false, error: "Failed to generate panel.", detail: errorDetail(err) });
  }
});

// Two-level cache for practice evaluations:
// 1. In-memory (fast, ephemeral): survives the current server process lifetime.
// 2. Supabase persistent (durable): survives restarts and works across serverless instances.
// Both use the same sha256 key so identical submissions always get identical scores.
const practiceEvaluationCache = new Map();
const MAX_PRACTICE_EVAL_CACHE = 1000;

async function getPracticeEvalFromDB(cacheKey) {
  try {
    const { data, error } = await supabase
      .from("practice_eval_cache")
      .select("evaluation")
      .eq("cache_key", cacheKey)
      .maybeSingle();
    if (error || !data) return null;
    return data.evaluation;
  } catch {
    return null; // Table may not exist yet — graceful fallback to in-memory
  }
}

async function savePracticeEvalToDB(cacheKey, evaluation) {
  try {
    await supabase
      .from("practice_eval_cache")
      .upsert({ cache_key: cacheKey, evaluation }, { onConflict: "cache_key", ignoreDuplicates: true });
  } catch {
    // Best-effort — if table doesn't exist, in-memory cache still works
  }
}

function getPracticeEvalCacheKey(question, answer, role, company) {
  const normQ = String(question || "").trim().toLowerCase();
  const normA = String(answer || "").trim().toLowerCase();
  const normR = String(role || "").trim().toLowerCase();
  const normC = String(company || "").trim().toLowerCase();
  return crypto.createHash("sha256").update(`${normQ}:::${normA}:::${normR}:::${normC}`).digest("hex");
}

// In-page Practice Problem Evaluator - evaluates a candidate's practice
// answer using an objective standardized rubric and deterministic temperature.
router.post("/evaluate-practice", optionalAuth, aiLimiter, async (req, res) => {
  const { role, company, topic, difficulty, question, userAnswer } = req.body || {};

  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ success: false, error: "question is required." });
  }
  if (!userAnswer || typeof userAnswer !== "string" || userAnswer.trim().length < 5) {
    return res.status(400).json({ success: false, error: "Please enter an answer with at least 5 characters before evaluating." });
  }

  const cacheKey = getPracticeEvalCacheKey(question, userAnswer, role, company);
  // 1. Fast path: in-memory cache
  if (practiceEvaluationCache.has(cacheKey)) {
    if (req.user && req.user.id) {
      logActivity(req.user.id, "practice_problem", role || "General");
    }
    return res.json({ success: true, evaluation: practiceEvaluationCache.get(cacheKey) });
  }
  // 2. Persistent path: Supabase (survives restarts and serverless cold starts)
  const dbCached = await getPracticeEvalFromDB(cacheKey);
  if (dbCached) {
    practiceEvaluationCache.set(cacheKey, dbCached); // warm in-memory cache
    if (req.user && req.user.id) {
      logActivity(req.user.id, "practice_problem", role || "General");
    }
    return res.json({ success: true, evaluation: dbCached });
  }

  const systemPrompt = `You are an elite, objective interview evaluation engine evaluating practice responses for top MBA, consulting, tech, and corporate roles (e.g. Chief of Staff, PM, Investment Banking, Strategy).

CRITICAL STANDARDIZED RUBRIC & FAIRNESS RULES:
1. OBJECTIVE 4-DIMENSION RUBRIC (Each dimension is strictly graded from 0.0 to 2.5):
   - problemFraming (0.0 to 2.5): Direct relevance to the problem. Did the candidate answer the exact prompt and scenario constraints?
     * 2.0 - 2.5: Directly answers the core prompt and scenario constraints; no filler.
     * 1.0 - 1.9: Addresses the main question broadly but wanders or misses secondary prompt requirements.
     * 0.0 - 0.9: Off-topic or fails to understand the core question.
   - structure (0.0 to 2.5): MECE framework and logical grouping.
     * 2.0 - 2.5: Clear mutually exclusive, collectively exhaustive (MECE) structure, logical hierarchy, clear buckets.
     * 1.0 - 1.9: Has categorization, but some categories overlap or leave obvious blind spots.
     * 0.0 - 0.9: Disorganized laundry list or rambling unstructured text.
   - analyticalDepth (0.0 to 2.5): Specific operational mechanisms, metrics, and quantitative/commercial levers.
     * 2.0 - 2.5: Identifies specific operational mechanisms, quantitative levers, metrics, cost drivers, or real-world dynamics.
     * 1.0 - 1.9: Mentions standard high-level points but lacks concrete mechanisms or operational details.
     * 0.0 - 0.9: Generic buzzwords with no actionable depth.
   - prioritization (0.0 to 2.5): Commercial pragmatism and 80/20 prioritization.
     * 2.0 - 2.5: Clearly prioritizes the highest-impact 80/20 levers, highlights implementation realities, risks, or key trade-offs.
     * 1.0 - 1.9: Treats every bullet point with equal weight; lacks clear prioritization.
     * 0.0 - 0.9: Impractical, unrealistic, or devoid of business judgment.

2. SCENARIO ISOLATION RULE:
   If the question itself specifies an industry, company, or scenario (e.g. "A steel manufacturer...", "An edtech startup..."), evaluate the candidate strictly on that scenario. Do NOT penalize the answer for not discussing ${company || "a specific company"} if the problem explicitly posited a different company or sector.

3. SCORE CALCULATION & BANDS:
   - score = round(problemFraming + structure + analyticalDepth + prioritization, 1). Range: 1.0 to 10.0.
   - rating MUST match the score:
     * 8.5 to 10.0: "Strong" (Bar raiser; highly structured, prioritized, concrete operational levers)
     * 6.5 to 8.4: "Good" (Solid answer; good coverage but lacks deep prioritization or operational metrics)
     * 1.0 to 6.4: "Needs Improvement" (Generic, laundry list, or unstructured)

Context:
Role: ${role || "General"}
${company ? `Target Employer Context: ${company}` : ""}
${topic ? `Topic / Skill: ${topic}` : ""}
Difficulty: ${difficulty || "Medium"}

Respond with ONLY a valid JSON object matching this schema:
{
  "score": <number between 1.0 and 10.0>,
  "rating": "<Strong | Good | Needs Improvement>",
  "rubricBreakdown": {
    "problemFraming": <number 0.0 to 2.5>,
    "structure": <number 0.0 to 2.5>,
    "analyticalDepth": <number 0.0 to 2.5>,
    "prioritization": <number 0.0 to 2.5>
  },
  "summary": "<1-2 sentence objective assessment of the response against the rubric>",
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "improvements": ["<specific missed angle, weak point, or gap 1>", "<specific improvement 2>"],
  "modelAnswer": "<A structured, benchmark answer demonstrating how an exceptional candidate would tackle this problem using structured frameworks, root-cause diagnosis, or strategic levers>",
  "keyTakeaway": "<One high-impact coaching tip or heuristic for this problem archetype>"
}`;

  const prompt = `PRACTICE QUESTION:
${question}

CANDIDATE'S ANSWER:
${userAnswer}

Provide your structured evaluation in JSON.`;

  try {
    const rawEval = await generateJSON({
      system: systemPrompt,
      prompt,
      maxTokens: 2500,
      temperature: 0.0, // Zero temperature for deterministic, consistent scoring across students
      allowEscalation: false // CRITICAL: same model must always evaluate — different models give different scores
    });

    const evaluation = { ...rawEval };

    // Standardize score calculation from rubric breakdown for mathematical consistency
    let score = typeof evaluation.score === "number" ? evaluation.score : 5.0;
    if (evaluation.rubricBreakdown && typeof evaluation.rubricBreakdown === "object") {
      const b = evaluation.rubricBreakdown;
      const f = typeof b.problemFraming === "number" ? Math.max(0, Math.min(2.5, b.problemFraming)) : 1.5;
      const s = typeof b.structure === "number" ? Math.max(0, Math.min(2.5, b.structure)) : 1.5;
      const d = typeof b.analyticalDepth === "number" ? Math.max(0, Math.min(2.5, b.analyticalDepth)) : 1.5;
      const p = typeof b.prioritization === "number" ? Math.max(0, Math.min(2.5, b.prioritization)) : 1.5;
      score = Number(Math.min(10, Math.max(1, f + s + d + p)).toFixed(1));
      evaluation.rubricBreakdown = {
        problemFraming: Number(f.toFixed(1)),
        structure: Number(s.toFixed(1)),
        analyticalDepth: Number(d.toFixed(1)),
        prioritization: Number(p.toFixed(1))
      };
    } else {
      score = Number(Math.min(10, Math.max(1, score)).toFixed(1));
    }

    evaluation.score = score;
    evaluation.rating = score >= 8.5 ? "Strong" : score >= 6.5 ? "Good" : "Needs Improvement";

    // Store in bounded in-memory cache
    if (practiceEvaluationCache.size >= MAX_PRACTICE_EVAL_CACHE) {
      const oldestKey = practiceEvaluationCache.keys().next().value;
      practiceEvaluationCache.delete(oldestKey);
    }
    practiceEvaluationCache.set(cacheKey, evaluation);
    // Persist to Supabase for cross-instance and cross-restart consistency
    savePracticeEvalToDB(cacheKey, evaluation); // fire-and-forget

    if (req.user && req.user.id) {
      logActivity(req.user.id, "practice_problem", role || "General");
    }

    res.json({ success: true, evaluation });
  } catch (err) {
    console.error("[roles/evaluate-practice]", err);
    res.status(500).json({ success: false, error: "Failed to evaluate answer. Please try again.", detail: errorDetail(err) });
  }
});

export default router;

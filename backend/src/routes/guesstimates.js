import { Router } from "express";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import { errorDetail } from "../lib/errors.js";
import {
  getRandomGuesstimateProblem,
  groundedGuesstimateLookup,
  answerAssumptionClarification,
  evaluateGuesstimateAttempt,
  listAllGuesstimateProblems,
  getGuesstimateProblemById
} from "../lib/guesstimateRetrieval.js";

const router = Router();

// Shorter than the Frameworks/Q&A question cap (500 chars) - this is meant to be one quick
// clarifying question about an assumption, not an essay.
const MAX_CLARIFICATION_QUESTION_LENGTH = 300;

// Pure validation, split out so it's unit-testable without spinning up Express/auth (same
// reasoning as consultingRetrieval.js's decideCoverage) - the route handler below is a thin
// I/O wrapper around this.
export function validateClarifyInput(body) {
  const { chunkId, question } = body || {};
  if (!chunkId || typeof chunkId !== "string") {
    return { error: "chunkId is required." };
  }
  if (!question || typeof question !== "string" || !question.trim()) {
    return { error: "A question is required." };
  }
  if (question.length > MAX_CLARIFICATION_QUESTION_LENGTH) {
    return { error: `question: too long (max ${MAX_CLARIFICATION_QUESTION_LENGTH} chars).` };
  }
  return { chunkId, question: question.trim() };
}

// Same R7 switch as Frameworks (frameworksGrounding.js) - reused rather than adding a
// second flag, since this feature only exists because of the same ingestion work
// (ingest_chunks/match_ingest_chunks) that switch already gates. Off by default.
const ENABLED = process.env.ENABLE_CONSULTING_RAG_V2 === "true";

// Server-side memory tracking of recently served guesstimates per user/IP so sequential
// calls never repeat the same guesstimate even if the client didn't supply an exclude list.
const recentServedByClient = new Map();
const MAX_CLIENT_TRACKING = 1000;
const MAX_SERVED_HISTORY_PER_CLIENT = 50;

function getClientKey(req) {
  if (req.user && req.user.id) return `user:${req.user.id}`;
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "anonymous";
  return `ip:${String(ip).split(",")[0].trim()}`;
}

// GET /api/guesstimates/list - complete catalog of curated casebook guesstimates
// so students can browse questions and select exactly what they want to practice.
router.get("/list", optionalAuth, async (req, res) => {
  if (!ENABLED) {
    return res.json({ success: true, available: false, reason: "feature_disabled", problems: [] });
  }
  try {
    const problems = await listAllGuesstimateProblems();
    res.json({ success: true, available: true, count: problems.length, problems });
  } catch (err) {
    console.error("[guesstimates/list]", err);
    res.status(500).json({ success: false, error: "Failed to list guesstimate problems.", detail: errorDetail(err) });
  }
});

// GET /api/guesstimates/problem/:chunkId - fetch a specific casebook guesstimate by ID.
router.get("/problem/:chunkId", optionalAuth, async (req, res) => {
  if (!ENABLED) {
    return res.json({ success: true, available: false, reason: "feature_disabled" });
  }
  const { chunkId } = req.params;
  try {
    const result = await getGuesstimateProblemById(chunkId);
    if (!result.available) {
      return res.status(404).json({ success: false, error: "Guesstimate problem not found." });
    }
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("[guesstimates/problem/:chunkId]", err);
    res.status(500).json({ success: false, error: "Failed to fetch guesstimate problem.", detail: errorDetail(err) });
  }
});

// GET /api/guesstimates/random - one practice problem from the SRCC Guesstimates Book,
// picked at random each request, with its real page citation.
// Supports `?chunkId=...` to load a specific question, or `?exclude=id1,id2,...` to ensure
// the same guesstimate is not asked twice.
router.get("/random", optionalAuth, async (req, res) => {
  if (!ENABLED) {
    return res.json({ success: true, available: false, reason: "feature_disabled" });
  }
  try {
    // If the client explicitly requests a specific problem by ID:
    if (req.query.chunkId && typeof req.query.chunkId === "string") {
      const specific = await getGuesstimateProblemById(req.query.chunkId.trim());
      if (specific.available) {
        return res.json({ success: true, ...specific });
      }
    }

    const clientKey = getClientKey(req);
    const serverRecent = recentServedByClient.get(clientKey) || [];

    const excludeParam = req.query.exclude;
    const clientExclude = typeof excludeParam === "string"
      ? excludeParam.split(",").map((s) => s.trim()).filter(Boolean)
      : Array.isArray(excludeParam)
      ? excludeParam.map((s) => String(s).trim()).filter(Boolean)
      : [];

    const combinedExclude = Array.from(new Set([...clientExclude, ...serverRecent]));
    const result = await getRandomGuesstimateProblem({ excludeIds: combinedExclude });

    if (result.available && result.chunkId) {
      const nextHistory = result.cycleReset
        ? [result.chunkId]
        : [...serverRecent.filter((id) => id !== result.chunkId), result.chunkId].slice(-MAX_SERVED_HISTORY_PER_CLIENT);

      recentServedByClient.set(clientKey, nextHistory);
      if (recentServedByClient.size > MAX_CLIENT_TRACKING) {
        const oldest = recentServedByClient.keys().next().value;
        recentServedByClient.delete(oldest);
      }
    }

    res.json({ success: true, ...result });
  } catch (err) {
    console.error("[guesstimates/random]", err);
    res.status(500).json({ success: false, error: "Failed to fetch a guesstimate.", detail: errorDetail(err) });
  }
});

// GET /api/guesstimates/ask?topic=... - grounded lookup for a specific guesstimate topic,
// same covered/not-covered/citation shape as the rest of the grounding policy.
router.get("/ask", optionalAuth, async (req, res) => {
  const { topic } = req.query;
  if (!ENABLED) {
    return res.json({ success: true, available: false, reason: "feature_disabled" });
  }
  if (!topic || !topic.trim()) {
    return res.status(400).json({ success: false, error: "A topic is required." });
  }
  try {
    const result = await groundedGuesstimateLookup(topic);
    res.json({ success: true, available: true, ...result });
  } catch (err) {
    console.error("[guesstimates/ask]", err);
    res.status(500).json({ success: false, error: "Failed to look up that guesstimate topic.", detail: errorDetail(err) });
  }
});

// POST /api/guesstimates/clarify { chunkId, question } - the "ask the interviewer" box on
// the Guesstimates practice page: up to 2 clarifying questions per problem about its
// assumptions (the 2-ask cap is enforced client-side by the session, not here). `chunkId`
// is the id getRandomGuesstimateProblem already returns for the problem in play - the
// server looks up that exact row itself rather than trusting any client-supplied problem
// text (see the comment above fetchScopedGuesstimateChunk in guesstimateRetrieval.js for
// why). Same requireAuth + aiLimiter posture as frameworks.js's POST /ask - a paid Gemini
// call per question, not a free DB read.
router.post("/clarify", requireAuth, aiLimiter, async (req, res) => {
  if (!ENABLED) {
    return res.json({ success: true, available: false, reason: "feature_disabled" });
  }
  const validated = validateClarifyInput(req.body);
  if (validated.error) {
    return res.status(400).json({ success: false, error: validated.error });
  }
  try {
    const result = await answerAssumptionClarification(validated.chunkId, validated.question);
    if (!result.found) {
      return res.status(404).json({ success: false, error: "Guesstimate problem not found." });
    }
    res.json({ success: true, answer: result.answer });
  } catch (err) {
    console.error("[guesstimates/clarify]", err);
    res.status(500).json({ success: false, error: "Failed to answer that question.", detail: errorDetail(err) });
  }
});

// POST /api/guesstimates/evaluate { chunkId, question, attempt, usedClarification, clarifyingQuestions }
// Evaluates a candidate's written or spoken guesstimate attempt against the
// casebook's benchmark worked solution with standard rubric breakdown.
router.post("/evaluate", optionalAuth, aiLimiter, async (req, res) => {
  if (!ENABLED) {
    return res.json({ success: true, available: false, reason: "feature_disabled" });
  }
  const { chunkId, question, attempt, usedClarification, clarifyingQuestions } = req.body || {};
  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ success: false, error: "question is required." });
  }
  if (!attempt || typeof attempt !== "string" || attempt.trim().length < 5) {
    return res.status(400).json({ success: false, error: "Please enter your attempt (at least 5 characters) before submitting." });
  }
  try {
    const result = await evaluateGuesstimateAttempt({
      chunkId,
      question: question.trim(),
      attempt: attempt.trim(),
      usedClarification: Boolean(usedClarification),
      clarifyingQuestions: Array.isArray(clarifyingQuestions) ? clarifyingQuestions : []
    });
    res.json({ success: true, evaluation: result.evaluation });
  } catch (err) {
    console.error("[guesstimates/evaluate]", err);
    res.status(500).json({ success: false, error: "Failed to evaluate guesstimate attempt.", detail: errorDetail(err) });
  }
});

export default router;

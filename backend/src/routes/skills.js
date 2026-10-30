import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import { errorDetail } from "../lib/errors.js";
import { getSkillMeta, getSkillProblems, getConceptLink, normalizeDifficulty, scoreOpenAnswer } from "../lib/skillContent.js";

const router = Router();

function validateParams(req, res) {
  const roleName = (req.params.roleName || "").trim();
  const skillName = (req.params.skillName || "").trim();
  if (!roleName || roleName.length > 100 || !skillName || skillName.length > 150) {
    res.status(400).json({ success: false, error: "roleName and skillName are required (max 100/150 characters)." });
    return null;
  }
  return { roleName, skillName };
}

// Concepts primer for this skill, in the context of this role - available
// immediately, independent of the difficulty picked for practice problems.
router.get("/:roleName/:skillName", optionalAuth, aiLimiter, async (req, res) => {
  const params = validateParams(req, res);
  if (!params) return;
  try {
    const meta = await getSkillMeta(params.roleName, params.skillName);
    res.json({ success: true, role: params.roleName, skill: params.skillName, ...meta });
  } catch (err) {
    console.error("[skills/:roleName/:skillName]", err);
    res.status(500).json({ success: false, error: "Failed to fetch skill content.", detail: errorDetail(err) });
  }
});

// Phase 1.7 item 2: the "learn more" link for ONE concept, fetched on first
// click instead of eagerly for every concept at page-generation time.
router.get("/:roleName/:skillName/concept-link", optionalAuth, aiLimiter, async (req, res) => {
  const params = validateParams(req, res);
  if (!params) return;
  const tier = (req.query.tier || "").toString().trim();
  const title = (req.query.title || "").toString().trim();
  if (!["basic", "intermediate", "advanced"].includes(tier)) {
    return res.status(400).json({ success: false, error: "tier must be one of: basic, intermediate, advanced." });
  }
  if (!title || title.length > 200) {
    return res.status(400).json({ success: false, error: "title is required (max 200 characters)." });
  }
  try {
    const link = await getConceptLink(params.roleName, params.skillName, tier, title);
    res.json({ success: true, link });
  } catch (err) {
    console.error("[skills/:roleName/:skillName/concept-link]", err);
    res.status(500).json({ success: false, error: "Failed to fetch concept link.", detail: errorDetail(err) });
  }
});

// 6 practice problems at the chosen difficulty - backs the "Skills required"
// click-through's difficulty picker. Cold-cache generation can take a while
// (up to 6 SQL/Python problems, each requiring a Gemini call plus real WASM
// execution to verify the answer) - cached for 30 days after that.
// force=true bypasses the cache and overwrites it with a freshly generated
// set (shared by every user of this role/skill/difficulty going forward,
// same as the normal cache) - backs the "Generate new questions" button.
router.get("/:roleName/:skillName/problems", optionalAuth, aiLimiter, async (req, res) => {
  const params = validateParams(req, res);
  if (!params) return;
  const difficulty = normalizeDifficulty(req.query.difficulty);
  if (!difficulty) {
    return res.status(400).json({ success: false, error: "difficulty must be one of Easy, Medium, Hard." });
  }
  const force = req.query.force === "true";
  try {
    const result = await getSkillProblems(params.roleName, params.skillName, difficulty, { force });
    res.json({ success: true, role: params.roleName, skill: params.skillName, difficulty, ...result });
  } catch (err) {
    console.error("[skills/:roleName/:skillName/problems]", err);
    res.status(500).json({ success: false, error: "Failed to fetch practice problems.", detail: errorDetail(err) });
  }
});

// AI feedback (score/strengths/improvements/sample answer) for a candidate's
// own written answer to an open-ended practice problem - see scoreOpenAnswer
// in skillContent.js for why this is qualitative feedback, not a pass/fail
// verdict. Not cached - each answer is different.
router.post("/:roleName/:skillName/score", optionalAuth, aiLimiter, async (req, res) => {
  const params = validateParams(req, res);
  if (!params) return;
  const { prompt, concept, userAnswer } = req.body || {};
  if (!prompt || typeof prompt !== "string" || prompt.length > 2000) {
    return res.status(400).json({ error: "prompt (string, max 2000 characters) is required." });
  }
  if (!userAnswer || typeof userAnswer !== "string" || userAnswer.trim().length < 10) {
    return res.status(400).json({ error: "userAnswer (string, min 10 characters) is required." });
  }
  if (userAnswer.length > 4000) {
    return res.status(400).json({ error: "userAnswer: too long (max 4000 characters)." });
  }
  if (concept !== undefined && concept !== null && (typeof concept !== "string" || concept.length > 200)) {
    return res.status(400).json({ error: "concept, if given, must be a string (max 200 characters)." });
  }
  try {
    const feedback = await scoreOpenAnswer(params.roleName, params.skillName, prompt, concept || "", userAnswer.trim());
    res.json({ success: true, feedback });
  } catch (err) {
    console.error("[skills/:roleName/:skillName/score]", err);
    res.status(500).json({ success: false, error: "Failed to score answer.", detail: errorDetail(err) });
  }
});

export default router;

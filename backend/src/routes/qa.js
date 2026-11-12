import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import { errorDetail } from "../lib/errors.js";
import { groundedQaAnswer } from "../lib/qaRetrieval.js";
import { logToGoogleSheet } from "../lib/sheetsLogger.js";
import { isPromptGuardEnabled, looksLikeInjection } from "../lib/promptGuard.js";

const router = Router();

// Same R7 switch as Frameworks/Guesstimates/chip panels - off by default, so this
// additive route has zero effect on anything until the new pipeline is switched on.
const ENABLED = process.env.ENABLE_CONSULTING_RAG_V2 === "true";

// POST /api/qa/ask { question } - free-form grounded Q&A (R7's last unbuilt item).
// Checks the casebooks first: covered -> casebook-only answer; not covered -> a general
// answer, clearly labelled (grounding policy, CLAUDE.md) - never blended.
router.post("/ask", requireAuth, aiLimiter, async (req, res) => {
  const { question } = req.body || {};
  if (!ENABLED) {
    return res.json({ success: true, available: false, reason: "feature_disabled" });
  }
  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ success: false, error: "A question is required." });
  }
  if (question.length > 1000) {
    return res.status(400).json({ success: false, error: "question: too long (max 1000 chars)." });
  }
  if (isPromptGuardEnabled() && await looksLikeInjection(question.trim())) {
    return res.status(400).json({ success: false, error: "That doesn't look like a casebook question — try rephrasing it as a direct question about a topic." });
  }
  try {
    const result = await groundedQaAnswer(question.trim());

    const userLabel = req.user?.email || (req.user?.id ? `Guest (${req.user.id.slice(0, 8)})` : "Guest");
    logToGoogleSheet({
      sheet: "Questions Asked",
      user: userLabel,
      action: "Ask Page (Q&A)",
      item: question.trim(),
      details: result.groundedInCasebooks
        ? `Grounded in Casebooks (${result.citation?.school || "Casebook"} p.${result.citation?.pages?.join(",") || ""})`
        : "General Knowledge Answer"
    });

    res.json({ success: true, available: true, ...result });
  } catch (err) {
    console.error("[qa/ask]", err);
    res.status(500).json({ success: false, error: "Failed to answer that question.", detail: errorDetail(err) });
  }
});

export default router;

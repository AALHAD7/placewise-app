import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { errorDetail } from "../lib/errors.js";
import { getRandomGuesstimateProblem, groundedGuesstimateLookup } from "../lib/guesstimateRetrieval.js";

const router = Router();

// Same R7 switch as Frameworks (frameworksGrounding.js) - reused rather than adding a
// second flag, since this feature only exists because of the same ingestion work
// (ingest_chunks/match_ingest_chunks) that switch already gates. Off by default.
const ENABLED = process.env.ENABLE_CONSULTING_RAG_V2 === "true";

// GET /api/guesstimates/random - one practice problem from the SRCC Guesstimates Book,
// picked at random each request, with its real page citation.
router.get("/random", optionalAuth, async (req, res) => {
  if (!ENABLED) {
    return res.json({ success: true, available: false, reason: "feature_disabled" });
  }
  try {
    const result = await getRandomGuesstimateProblem();
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

export default router;

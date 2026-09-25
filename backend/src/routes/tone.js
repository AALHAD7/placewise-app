import { Router } from "express";
import { generateJSON } from "../lib/gemini.js";
import { requireAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import { errorDetail } from "../lib/errors.js";

const router = Router();

const ALLOWED_TONES = ["professional", "story-driven", "technical", "leader"];

const SYSTEM_PROMPT = `You rewrite interview-answer text in different tones for Indian B-school placement candidates. Keep the same underlying facts and meaning — only change style, word choice, and framing. Never add facts, numbers, or claims not present in the original text.

Respond with ONLY a JSON array, no markdown fences, no commentary, in exactly this shape:
[{"tone": "tone-name", "text": "rewritten text"}]

Return exactly one entry per requested tone, in the order requested.`;

router.post("/shift", requireAuth, aiLimiter, async (req, res) => {
  const { text, tones } = req.body || {};

  if (!text || typeof text !== "string" || text.trim().length < 5) {
    return res.status(400).json({ error: "text (string, min 5 characters) is required." });
  }
  if (text.length > 4000) {
    return res.status(400).json({ error: "text: too long (max 4000 characters)." });
  }
  if (!Array.isArray(tones) || tones.length === 0) {
    return res.status(400).json({ error: "tones (non-empty array) is required." });
  }
  const invalidTones = tones.filter(t => !ALLOWED_TONES.includes(t));
  if (invalidTones.length) {
    return res.status(400).json({ error: `Unsupported tone(s): ${invalidTones.join(", ")}. Allowed: ${ALLOWED_TONES.join(", ")}.` });
  }

  try {
    const prompt = `ORIGINAL TEXT:\n${text}\n\nREWRITE IN THESE TONES: ${tones.join(", ")}`;
    const variations = await generateJSON({ system: SYSTEM_PROMPT, prompt, maxTokens: 2000 });

    res.json({ success: true, variations });
  } catch (err) {
    console.error("[tone/shift]", err);
    res.status(500).json({ success: false, error: "Failed to generate tone variations.", detail: errorDetail(err) });
  }
});

export default router;

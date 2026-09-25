import { Router } from "express";
import { generateText } from "../lib/gemini.js";
import { requireAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import { errorDetail } from "../lib/errors.js";

const router = Router();

const SYSTEM_PROMPT = "You are a helpful, direct AI assistant embedded in an interview-prep product for Indian B-school placements. Follow the user's formatting, length, and role-play instructions exactly — they craft the full prompt themselves.";

// Generic single/multi-turn passthrough to Gemini, for frontend features that
// build their own fully-formed prompts client-side (framework explain/pushback
// chat, tone rewriting) rather than needing a structured RAG pipeline.
router.post("/", requireAuth, aiLimiter, async (req, res) => {
  const { messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages (non-empty array of {role, content}) is required." });
  }
  if (messages.length > 40) {
    return res.status(400).json({ error: "messages: too many turns (max 40)." });
  }
  // 8000 (not 4000) - Tone Shifter's batched rewrite prompt folds a long,
  // fixed ruleset (no separate "system" role on this route) plus up to 3
  // user-pasted bullets into one message; short client-built prompts
  // (framework pushback, etc.) stay well under this regardless.
  const invalid = messages.some(m =>
    !m || typeof m !== "object" ||
    !["user", "assistant"].includes(m.role) ||
    typeof m.content !== "string" || !m.content.trim() || m.content.length > 8000
  );
  if (invalid) {
    return res.status(400).json({ error: "Each message needs role ('user'|'assistant') and non-empty content (string, max 8000 chars)." });
  }

  try {
    const prompt = messages.length === 1
      ? messages[0].content
      : messages.map(m => (m.role === "assistant" ? "Interviewer" : "Candidate") + ": " + m.content).join("\n\n") +
        "\n\nContinue as the interviewer. Reply with your next turn only.";

    const text = await generateText({ system: SYSTEM_PROMPT, prompt, maxTokens: 1500 });
    if (!text) throw new Error("Empty response");

    res.json({ success: true, text });
  } catch (err) {
    console.error("[chat]", err);
    res.status(500).json({ success: false, error: "Failed to generate response.", detail: errorDetail(err) });
  }
});

export default router;

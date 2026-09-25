import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { embedTexts, generateJSON } from "../lib/gemini.js";
import { requireAuth } from "../middleware/auth.js";
import { heavyAiLimiter } from "../middleware/rateLimit.js";
import { errorDetail } from "../lib/errors.js";
import { logActivity } from "../lib/activity.js";

const router = Router();

const SYSTEM_PROMPT = `You are an interview narrative coach for Indian B-school placements (product management, consulting, and related roles). Given a candidate's resume and target role/company, build 3-4 distinct interview narratives ("tell me about yourself" / story angles) grounded ONLY in the resume and the provided context. Never invent facts, employers, or numbers not present in the resume.

Respond with ONLY a JSON array, no markdown fences, no commentary, in exactly this shape:
[{"id": "n-1", "title": "short narrative title", "story": "2-4 sentence narrative", "keyThemes": ["theme1", "theme2"], "strength": 0.0-1.0}]

Return 3 to 4 narratives, ordered by strength descending.`;

router.post("/generate", requireAuth, heavyAiLimiter, async (req, res) => {
  const { resume, role, company, focusAreas, domain } = req.body || {};

  if (!resume || typeof resume !== "string" || resume.trim().length < 20) {
    return res.status(400).json({ error: "resume (string, min 20 characters) is required." });
  }
  if (resume.length > 6000) {
    return res.status(400).json({ error: "resume: too long (max 6000 characters)." });
  }
  if (role !== undefined && (typeof role !== "string" || role.length > 200)) {
    return res.status(400).json({ error: "role must be a string (max 200 characters)." });
  }
  if (company !== undefined && (typeof company !== "string" || company.length > 200)) {
    return res.status(400).json({ error: "company must be a string (max 200 characters)." });
  }
  if (focusAreas !== undefined && (!Array.isArray(focusAreas) || focusAreas.length > 20 || focusAreas.some(f => typeof f !== "string" || f.length > 200))) {
    return res.status(400).json({ error: "focusAreas must be an array of strings (max 20 items, 200 chars each)." });
  }
  if (domain !== undefined && domain !== null && (typeof domain !== "string" || domain.length > 100)) {
    return res.status(400).json({ error: "domain, if given, must be a string (max 100 characters)." });
  }

  try {
    const [queryEmbedding] = await embedTexts([resume], "RETRIEVAL_QUERY");

    const { data: chunks, error: matchError } = await supabase.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_count: 6,
      filter_domain: domain || null
    });
    if (matchError) throw matchError;

    const context = (chunks || [])
      .map((c, i) => `[Source ${i + 1}: ${c.source_file}]\n${c.content}`)
      .join("\n\n---\n\n");

    const prompt = `CONTEXT:\n${context || "(no matching context found in the knowledge base)"}\n\nCANDIDATE RESUME:\n${resume}\n\nTARGET ROLE: ${role || "(not specified)"}\nTARGET COMPANY: ${company || "(not specified)"}\nFOCUS AREAS: ${Array.isArray(focusAreas) && focusAreas.length ? focusAreas.join(", ") : "(none specified)"}\n\nGenerate 3-4 interview narratives as specified.`;

    const narratives = await generateJSON({ system: SYSTEM_PROMPT, prompt, maxTokens: 3000 });

    logActivity(req.user.id, "story_builder", role || company || "General");
    res.json({ success: true, narratives });
  } catch (err) {
    console.error("[story/generate]", err);
    res.status(500).json({ success: false, error: "Failed to generate narratives.", detail: errorDetail(err) });
  }
});

export default router;

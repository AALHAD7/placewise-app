import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { embedTexts, generateJSON } from "../lib/gemini.js";
import { requireAuth } from "../middleware/auth.js";
import { aiLimiter, heavyAiLimiter } from "../middleware/rateLimit.js";
import { errorDetail } from "../lib/errors.js";
import { logActivity } from "../lib/activity.js";

const router = Router();
const TIME_LIMIT_SECONDS = 300;

const START_SYSTEM_PROMPT = `You are a mock interviewer for Indian B-school placements (product management, consulting, and related roles). Generate ONE strong opening interview question for the given company, role, and difficulty (1=easy, 2=medium, 3=hard), grounded in the provided context where relevant.

Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"question": "question text"}`;

const ANSWER_SYSTEM_PROMPT = `You are a mock interviewer for Indian B-school placements, evaluating a candidate's spoken/written answer to an interview question. Be constructive but honest.

Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"score": 0-10, "strengths": ["...", "..."], "improvements": ["...", "..."], "sampleBetterAnswer": "a stronger version of the answer", "followUpQuestion": "a natural follow-up question"}`;

async function retrieveContext(queryText, domain) {
  try {
    const [queryEmbedding] = await embedTexts([queryText], "RETRIEVAL_QUERY");
    const { data: chunks } = await supabase.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_count: 4,
      filter_domain: domain || null
    });
    return (chunks || []).map((c, i) => `[Source ${i + 1}: ${c.source_file}]\n${c.content}`).join("\n\n---\n\n");
  } catch {
    return "";
  }
}

router.post("/start", heavyAiLimiter, requireAuth, async (req, res) => {
  const { company, role, difficulty, domain } = req.body || {};
  const diff = Number.isInteger(difficulty) && difficulty >= 1 && difficulty <= 3 ? difficulty : 2;
  if (domain !== undefined && domain !== null && (typeof domain !== "string" || domain.length > 100)) {
    return res.status(400).json({ error: "domain, if given, must be a string (max 100 characters)." });
  }

  try {
    const context = await retrieveContext(`${role || "general"} interview questions at ${company || "a company"}`, domain);
    const prompt = `CONTEXT:\n${context || "(no matching context found)"}\n\nCOMPANY: ${company || "(not specified)"}\nROLE: ${role || "(not specified)"}\nDIFFICULTY: ${diff}\n\nGenerate the opening question.`;

    const { question } = await generateJSON({ system: START_SYSTEM_PROMPT, prompt, maxTokens: 1000 });

    const { data: session, error } = await supabase
      .from("mock_interview_sessions")
      .insert({
        user_id: req.user.id,
        company: company || null,
        role: role || null,
        difficulty: diff,
        questions: [{ question, difficulty: diff, askedAt: new Date().toISOString(), userAnswer: null }]
      })
      .select()
      .single();
    if (error) throw error;

    logActivity(req.user.id, "mock_interview", role || company || "General");
    res.json({ sessionId: session.id, question, difficulty: diff, timeLimit: TIME_LIMIT_SECONDS });
  } catch (err) {
    console.error("[mock-interview/start]", err);
    res.status(500).json({ success: false, error: "Failed to start mock interview.", detail: errorDetail(err) });
  }
});

router.post("/answer", aiLimiter, requireAuth, async (req, res) => {
  const { sessionId, userAnswer, timeSpent } = req.body || {};

  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ error: "sessionId is required." });
  }
  if (!userAnswer || typeof userAnswer !== "string" || userAnswer.trim().length < 5) {
    return res.status(400).json({ error: "userAnswer (string, min 5 characters) is required." });
  }

  try {
    const { data: session, error: fetchError } = await supabase
      .from("mock_interview_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", req.user.id)
      .single();
    if (fetchError || !session) {
      return res.status(404).json({ error: "Session not found." });
    }

    const questions = session.questions || [];
    const pendingIdx = questions.findLastIndex(q => q.userAnswer == null);
    if (pendingIdx === -1) {
      return res.status(400).json({ error: "No pending question on this session — call /start again or use the last follow-up." });
    }
    const currentQuestion = questions[pendingIdx].question;

    const prompt = `QUESTION: ${currentQuestion}\n\nCANDIDATE'S ANSWER: ${userAnswer}\n\nTIME SPENT: ${timeSpent || "unknown"} seconds (limit ${TIME_LIMIT_SECONDS}s)\n\nEvaluate the answer as specified.`;
    const feedback = await generateJSON({ system: ANSWER_SYSTEM_PROMPT, prompt, maxTokens: 2000 });

    questions[pendingIdx] = {
      ...questions[pendingIdx],
      userAnswer,
      timeSpent: timeSpent ?? null,
      feedback,
      answeredAt: new Date().toISOString()
    };
    if (feedback.followUpQuestion) {
      questions.push({
        question: feedback.followUpQuestion,
        difficulty: session.difficulty,
        askedAt: new Date().toISOString(),
        userAnswer: null
      });
    }

    const { error: updateError } = await supabase
      .from("mock_interview_sessions")
      .update({ questions, updated_at: new Date().toISOString() })
      .eq("id", sessionId);
    if (updateError) throw updateError;

    res.json({ success: true, feedback });
  } catch (err) {
    console.error("[mock-interview/answer]", err);
    res.status(500).json({ success: false, error: "Failed to evaluate answer.", detail: errorDetail(err) });
  }
});

export default router;

import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { embedTexts, generateJSON } from "../lib/gemini.js";
import { requireAuth } from "../middleware/auth.js";
import { aiLimiter, heavyAiLimiter } from "../middleware/rateLimit.js";
import { errorDetail } from "../lib/errors.js";
import { logActivity } from "../lib/activity.js";
import { logEscalationIfNeeded } from "../lib/modelEscalation.js";
import { roleIdFor } from "../lib/roles.js";

const router = Router();
const TIME_LIMIT_SECONDS = 300;

// Same cap as resume.js's MAX_RESUME_CHARS (kept as its own local constant
// here rather than a shared import - matches this codebase's existing
// pattern of small per-route constants, e.g. resume.js/mockInterview.js
// already each define their own rather than centralizing). A JD is
// typically shorter than a resume, so it gets a tighter cap.
const MAX_RESUME_CHARS = 10000;
const MAX_JD_CHARS = 10000;
const QUESTION_SOURCES = ["resume", "jd", "both"];

const START_SYSTEM_PROMPT = `You are a mock interviewer for Indian B-school placements (product management, consulting, and related roles). Generate ONE strong opening interview question for the given company, role, and difficulty (1=easy, 2=medium, 3=hard), grounded in the provided context where relevant.

If a CANDIDATE'S RESUME is given, ground the question in a specific real detail from it (a named project, tool, metric, or responsibility) rather than a generic question anyone could answer.
If a JOB DESCRIPTION is given, ground the question in what that specific posting actually asks for (a named responsibility or requirement from it) rather than a generic version of the role.
If BOTH are given, connect a specific detail from the resume to a specific requirement from the job description - test how something the candidate actually did maps to (or falls short of) something the posting explicitly asks for.

Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"question": "question text"}`;

const ANSWER_SYSTEM_PROMPT = `You are a mock interviewer for Indian B-school placements, evaluating a candidate's spoken/written answer to an interview question. Be constructive but honest.

If a CANDIDATE'S RESUME and/or JOB DESCRIPTION is given below, use it the same way the opening question did: judge whether the answer plausibly reflects the candidate's real background or the job's actual requirements, and ground the follow-up question in a specific detail from that material rather than something generic.

Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"score": 0-10, "strengths": ["...", "..."], "improvements": ["...", "..."], "sampleBetterAnswer": "a stronger version of the answer", "followUpQuestion": "a natural follow-up question"}`;

// Builds the shared "CANDIDATE'S RESUME:.../JOB DESCRIPTION:..." block used
// by both /start's opening question and /answer's evaluation+follow-up, so
// a session stays grounded in the same material end to end instead of only
// the first question being personalized.
function buildCandidateContext(resumeText, jdText, questionSource) {
  const parts = [];
  if (resumeText && (questionSource === "resume" || questionSource === "both")) {
    parts.push(`CANDIDATE'S RESUME:\n${resumeText}`);
  }
  if (jdText && (questionSource === "jd" || questionSource === "both")) {
    parts.push(`JOB DESCRIPTION:\n${jdText}`);
  }
  return parts.join("\n\n");
}

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

router.post("/start", requireAuth, heavyAiLimiter, async (req, res) => {
  const { company, role, difficulty, domain, resumeText, jdText, questionSource } = req.body || {};
  const diff = Number.isInteger(difficulty) && difficulty >= 1 && difficulty <= 3 ? difficulty : 2;
  if (domain !== undefined && domain !== null && (typeof domain !== "string" || domain.length > 100)) {
    return res.status(400).json({ error: "domain, if given, must be a string (max 100 characters)." });
  }
  if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 20) {
    return res.status(400).json({ error: "resumeText is required (upload a resume first)." });
  }
  const cleanResume = resumeText.trim().slice(0, MAX_RESUME_CHARS);

  if (jdText !== undefined && jdText !== null && typeof jdText !== "string") {
    return res.status(400).json({ error: "jdText, if given, must be a string." });
  }
  const cleanJd = typeof jdText === "string" ? jdText.trim().slice(0, MAX_JD_CHARS) : "";
  const hasJd = cleanJd.length > 0;
  // Falls back to "resume" for an invalid value AND for "jd"/"both" without
  // an actual JD present - never silently ground on a job description that
  // doesn't exist.
  const source = hasJd && QUESTION_SOURCES.includes(questionSource) ? questionSource : "resume";

  try {
    const context = await retrieveContext(`${role || "general"} interview questions at ${company || "a company"}`, domain);
    const candidateContext = buildCandidateContext(cleanResume, cleanJd, source);
    const prompt = `CONTEXT:\n${context || "(no matching context found)"}\n\n${candidateContext ? candidateContext + "\n\n" : ""}COMPANY: ${company || "(not specified)"}\nROLE: ${role || "(not specified)"}\nDIFFICULTY: ${diff}\n\nGenerate the opening question.`;

    const { question } = await generateJSON({ system: START_SYSTEM_PROMPT, prompt, maxTokens: 1000 });

    const { data: session, error } = await supabase
      .from("mock_interview_sessions")
      .insert({
        user_id: req.user.id,
        company: company || null,
        role: role || null,
        role_id: roleIdFor(role),
        difficulty: diff,
        resume_text: cleanResume,
        jd_text: hasJd ? cleanJd : null,
        question_source: source,
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

router.post("/answer", requireAuth, aiLimiter, async (req, res) => {
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

    const candidateContext = buildCandidateContext(session.resume_text, session.jd_text, session.question_source);
    const prompt = `${candidateContext ? candidateContext + "\n\n" : ""}QUESTION: ${currentQuestion}\n\nCANDIDATE'S ANSWER: ${userAnswer}\n\nTIME SPENT: ${timeSpent || "unknown"} seconds (limit ${TIME_LIMIT_SECONDS}s)\n\nEvaluate the answer as specified.`;
    // Phase 1.5 item 5: one of the 2 named evaluation-type call sites
    // allowed past the flash-lite cap - a wrong/low-quality interview score
    // is worse than the extra tokens a flash-tier escalation costs.
    const feedback = await generateJSON({
      system: ANSWER_SYSTEM_PROMPT, prompt, maxTokens: 2000,
      allowEscalation: true,
      onModelUsed: m => logEscalationIfNeeded(m, "mockInterview.evaluate", "json")
    });

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

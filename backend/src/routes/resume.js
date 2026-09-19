import { Router } from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { supabase } from "../lib/supabase.js";
import { embedTexts, generateJSON, streamGenerateJSON } from "../lib/gemini.js";
import { requireAuth } from "../middleware/auth.js";
import { aiLimiter, heavyAiLimiter } from "../middleware/rateLimit.js";
import { errorDetail } from "../lib/errors.js";
import { logActivity } from "../lib/activity.js";

const router = Router();
// Extension is re-checked below (it's what actually selects the parser), but
// gating on originalname/mimetype here rejects obviously-wrong uploads before
// they're even read into memory. Neither is trustworthy alone (both are
// client-supplied) — the real safety net is that resumeText below can only
// ever be used as plain text/embeddings input, never executed or rendered as HTML.
const ALLOWED_RESUME_EXTENSIONS = ["pdf", "docx", "txt"];
const ALLOWED_RESUME_MIMETYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = (file.originalname.split(".").pop() || "").toLowerCase();
    const baseType = (file.mimetype || "").split(";")[0].trim();
    if (!ALLOWED_RESUME_EXTENSIONS.includes(ext) || !ALLOWED_RESUME_MIMETYPES.includes(baseType)) {
      return cb(new Error("Unsupported file type"));
    }
    cb(null, true);
  }
});
// A real resume is a page or two. Cap well above that (~6000 chars) so a
// mis-upload (e.g. a whole casebook instead of a resume) can't send a huge
// embedding request that hangs/times out — this actually happened while
// testing with a 33-page PDF.
const MAX_RESUME_CHARS = 6000;

const CATEGORIES = ["Behavioural", "Technical", "Situational"];

// category is undefined for the initial full generation (all 3 categories,
// 30 questions), or one of CATEGORIES for a per-tab refresh (that category
// only, 10 questions) — see the "Refresh these questions" button, which
// deliberately only touches the tab the user is looking at, not the other two.
//
// Behavioural/Technical stay resume-grounded, but Situational deliberately
// does NOT: user feedback was that situational questions were reading as
// resume trivia ("given your work leading the 40-member club...") instead of
// the actual point of the category — a genuine corporate dilemma/trade-off a
// professional in that role hits day-to-day, tested on judgment and
// rationale, independent of anything specific to this one candidate's CV.
const CATEGORY_GUIDANCE = {
  Behavioural: `"Behavioural": leadership, conflict, failure, motivation, teamwork — grounded in specific things on the resume. Reference the candidate's actual experience, projects, or role.`,
  Technical: `"Technical": metrics, analytics, frameworks, domain-specific rigor relevant to the candidate's target role — grounded in specific things on the resume.`,
  Situational: `"Situational": realistic day-to-day corporate dilemmas and trade-offs a professional in the candidate's target role/domain regularly faces — for example conflicting stakeholder priorities, speed vs. quality, incomplete data, resourcing constraints, or competing metrics. Do NOT reference the candidate's specific resume, company, project, club, or numbers — infer only their target role/domain from the resume, then pose a generic scenario anyone in that role would plausibly face. Ask what trade-off they would make, the rationale behind it, and how they would mitigate the downside of that choice.`
};

function buildInterrogateSystemPrompt(category) {
  const scope = category
    ? `Generate questions for exactly this ONE category: "${category}".\n${CATEGORY_GUIDANCE[category]}`
    : `Generate questions in exactly 3 categories:
- ${CATEGORY_GUIDANCE.Behavioural}
- ${CATEGORY_GUIDANCE.Technical}
- ${CATEGORY_GUIDANCE.Situational}`;

  const shape = category
    ? `{"${category}": [{"q": "...", "level": "Easy"|"Medium"|"Hard", "tag": "short/tag", "note": "one short contextual note"}, ...]}`
    : `{"Behavioural": [{"q": "...", "level": "Easy"|"Medium"|"Hard", "tag": "short/tag", "note": "one short contextual note"}, ...], "Technical": [...], "Situational": [...]}`;

  const countLine = category
    ? `Return exactly 10 questions for "${category}".`
    : `Return exactly 10 questions in each of the 3 categories (30 total).`;

  return `You are an interview prep assistant for Indian B-school placements (product management, consulting, and related roles). Never invent facts, companies, or numbers that aren't supported by the context or resume. Never repeat or closely paraphrase a question across categories.

For Behavioural and Technical questions, ground every question ONLY in the provided context chunks and the candidate's resume. Situational questions follow a different rule — see below; do not apply resume-grounding to them.

${scope}

You may be given examples of questions past users marked as genuinely helpful, for calibration only — aim for that same caliber and style, but never copy them verbatim or force them in if they don't fit.

Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
${shape}

${countLine} Keep each "note" under 15 words.`;
}

// Every question object the model emits includes exactly one "level" key, so
// counting its occurrences in the partial stream is a reasonable proxy for
// "how many of the N questions are done" without waiting for valid JSON.
// target is 30 for a full generation, 10 for a single-category refresh.
function estimateGenerationProgress(raw, target) {
  const matches = raw.match(/"level"\s*:/g);
  return Math.min(99, Math.round(((matches ? matches.length : 0) / target) * 100));
}

const FEEDBACK_SYSTEM_PROMPT = `You are a blunt, no-nonsense interview coach for Indian B-school placements (product management, consulting, and related roles), evaluating ONE candidate answer to ONE interview question.

Be direct and honest. Never sugar-coat, never pad a weak answer with unearned encouragement, never soften a real problem to spare feelings. This feedback exists so the candidate does not repeat the same mistake in a real interview — a false "good job" actively hurts them. If the answer is vague, unstructured, rambling, dodges the question, or lacks specifics, say so plainly and say why it would fail with a real panel.

Judge on: whether it actually answers the question asked, structure, specificity (real detail vs vague claims), conciseness, and how a real interviewer would react.

You may be given past feedback given on similar questions/answers, for calibration only — judge this answer the same way those were judged, but never copy their wording or invent similarities that aren't there.

Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"good": ["specific, honest positive point grounded in this exact answer", ...], "fix": ["specific, blunt, actionable problem with this exact answer", ...]}

2-3 items per array. Every point must reference something concrete from THIS answer, never generic filler. If the answer is genuinely weak, "good" can have just one item, or even be empty — do not invent positives that are not there.`;

// Lets a candidate ask ONE clarifying question about a Situational question
// before answering — exactly what a real candidate would do with a real
// interviewer. Deliberately Situational-only (enforced on the frontend): a
// Behavioural/Technical question is about the candidate's own resume, so
// there's nothing genuinely ambiguous to clarify: the "clarification" would
// just be padding. A Situational dilemma is deliberately underspecified, so
// asking one sharpening question is realistic interview behavior.
const CLARIFY_SYSTEM_PROMPT = `You are the interviewer who just asked a candidate a situational interview question in a B-school placements interview (product management, consulting, or related). The candidate is asking you ONE clarifying question before answering, exactly as they would in a real interview. Their question may have come through voice transcription, so it can occasionally be garbled or nonsensical rather than a real question.

Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"understood": true|false, "answer": "your reply as the interviewer"}

Set "understood" to false ONLY if the candidate's question is genuinely unintelligible, garbled, or unrelated to the interview question entirely (e.g. a broken transcription or gibberish) — something you truly cannot make sense of as a question. In that case, "answer" should be a short, natural line like a real interviewer saying they didn't catch that and asking the candidate to repeat it.

Set "understood" to true for ANY coherent clarifying question — including one that's really just trying to get you to answer the original question for them. For a genuine, coherent question, respond the way a real interviewer would: briefly resolve real ambiguity, add a specific constraint or detail if it's reasonable to assume one, or restate what you're looking for, in 2-4 conversational sentences. Do NOT solve the dilemma for them, do NOT suggest what trade-off to make or hint at the "right" answer, and do NOT lecture. If they're fishing for the answer, redirect them back to it politely, the way a real interviewer would — e.g. "That's your call to make — what would you do given that?" (this still counts as "understood": true — it's a valid, answered exchange, just a redirect).`;

router.post("/upload", requireAuth, upload.single("resume"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded — send it as multipart/form-data under the field name \"resume\"." });
  }

  const ext = (req.file.originalname.split(".").pop() || "").toLowerCase();

  try {
    let resumeText = "";

    if (ext === "txt") {
      resumeText = req.file.buffer.toString("utf8");
    } else if (ext === "pdf") {
      const parser = new PDFParse({ data: req.file.buffer });
      try {
        const result = await parser.getText();
        resumeText = result.text;
      } finally {
        await parser.destroy();
      }
    } else if (ext === "docx") {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      resumeText = result.value;
    } else {
      return res.status(400).json({ error: "Unsupported file type. Use .pdf, .docx, or .txt (legacy .doc is not supported)." });
    }

    resumeText = (resumeText || "").trim();
    if (resumeText.length < 20) {
      return res.status(400).json({ error: "Could not extract enough text from this file." });
    }
    const truncated = resumeText.length > MAX_RESUME_CHARS;
    if (truncated) resumeText = resumeText.slice(0, MAX_RESUME_CHARS);

    res.json({ success: true, resumeText, fileName: req.file.originalname, truncated });
  } catch (err) {
    console.error("[resume/upload]", err);
    res.status(500).json({ success: false, error: "Failed to parse file.", detail: errorDetail(err) });
  }
});

// Streamed as SSE (rather than one JSON response) specifically so the frontend
// can show real generation progress — each event reflects how much of the
// response has actually landed from Gemini, not a fake timer. Pass `category`
// (one of CATEGORIES) to regenerate just that one tab's 10 questions — used by
// the per-tab "Refresh" button so a refresh never touches the other two tabs.
router.post("/interrogate", heavyAiLimiter, requireAuth, async (req, res) => {
  let { resumeText, category, domain } = req.body || {};

  if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 20) {
    return res.status(400).json({ error: "resumeText is required (min 20 characters)." });
  }
  if (category !== undefined && !CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category, if given, must be one of: ${CATEGORIES.join(", ")}.` });
  }
  if (domain !== undefined && domain !== null && (typeof domain !== "string" || domain.length > 100)) {
    return res.status(400).json({ error: "domain, if given, must be a string (max 100 characters)." });
  }
  resumeText = resumeText.trim().slice(0, MAX_RESUME_CHARS);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const send = obj => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  try {
    const [queryEmbedding] = await embedTexts([resumeText], "RETRIEVAL_QUERY");

    const { data: chunks, error: matchError } = await supabase.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_count: 10,
      filter_domain: domain || null
    });
    if (matchError) throw matchError;

    const context = (chunks || [])
      .map((c, i) => `[Source ${i + 1}: ${c.source_file}]\n${c.content}`)
      .join("\n\n---\n\n");

    const { data: helpfulExamples, error: helpfulError } = await supabase.rpc("match_helpful_questions", {
      query_embedding: queryEmbedding,
      match_count: 6
    });
    if (helpfulError) console.error("[resume/interrogate] helpful-question retrieval failed", helpfulError);

    const helpfulBlock = (helpfulExamples || [])
      .map(e => `- [${e.category || "?"}] ${e.question}`)
      .join("\n");

    const generateLine = category ? `Generate 10 questions for "${category}" as specified.` : `Generate 10 questions per category (30 total) as specified.`;
    const prompt = (helpfulBlock
      ? `QUESTIONS PAST USERS MARKED HELPFUL (for calibration only):\n${helpfulBlock}\n\n`
      : "") + `CONTEXT:\n${context || "(no matching context found in the knowledge base)"}\n\nCANDIDATE RESUME:\n${resumeText}\n\n${generateLine}`;

    send({ type: "progress", percent: 5 });
    let lastPercent = 5;
    const target = category ? 10 : 30;

    const results = await streamGenerateJSON({
      system: buildInterrogateSystemPrompt(category),
      prompt,
      maxTokens: category ? 4000 : 8000,
      onProgress: raw => {
        const pct = estimateGenerationProgress(raw, target);
        if (pct > lastPercent) {
          lastPercent = pct;
          send({ type: "progress", percent: pct });
        }
      }
    });

    logActivity(req.user.id, "resume_interrogation", category || "All categories");
    send({ type: "done", results, sourcesUsed: (chunks || []).map(c => c.source_file) });
  } catch (err) {
    console.error("[resume/interrogate]", err);
    send({ type: "error", error: "Failed to generate questions.", detail: errorDetail(err) });
  } finally {
    res.end();
  }
});

// Self-improving feedback loop: before judging a new answer, look up past
// feedback given on similar questions (via embedding similarity — same
// pgvector technique as resume question generation) and hand it to Gemini as
// calibration context. After judging, store this question/answer/feedback as
// a new example for future calls. No user_id is stored — this table exists
// purely to make feedback quality improve as more people use the feature, not
// to track individuals.
router.post("/feedback", aiLimiter, requireAuth, async (req, res) => {
  const { question, answer } = req.body || {};

  if (!question || typeof question !== "string" || !answer || typeof answer !== "string" || answer.trim().length < 5) {
    return res.status(400).json({ error: "question and answer (min 5 characters) are required." });
  }

  const trimmedQuestion = question.trim();
  const trimmedAnswer = answer.trim().slice(0, 4000);

  try {
    const [questionEmbedding] = await embedTexts([trimmedQuestion], "RETRIEVAL_QUERY");

    const { data: examples, error: matchError } = await supabase.rpc("match_answer_feedback_examples", {
      query_embedding: questionEmbedding,
      match_count: 3
    });
    if (matchError) console.error("[resume/feedback] example retrieval failed", matchError);

    const calibration = (examples || [])
      .map((e, i) => `[Past example ${i + 1}]\nQuestion: ${e.question}\nAnswer: ${e.answer}\nGood: ${(e.good || []).join(" | ") || "(none)"}\nFix: ${(e.fix || []).join(" | ") || "(none)"}`)
      .join("\n\n");

    const prompt = (calibration
      ? `PAST FEEDBACK ON SIMILAR SITUATIONS (for calibration only):\n${calibration}\n\n`
      : "") + `INTERVIEW QUESTION:\n${trimmedQuestion}\n\nCANDIDATE'S ANSWER:\n${trimmedAnswer}\n\nEvaluate this answer as specified.`;

    const result = await generateJSON({ system: FEEDBACK_SYSTEM_PROMPT, prompt, maxTokens: 1000 });
    const good = result.good || [], fix = result.fix || [];

    res.json({ success: true, good, fix });

    // Fire-and-forget: store this example for future calibration. Runs after
    // the response is already sent so a slow/failed insert never delays or
    // breaks feedback for the user who asked for it.
    supabase
      .from("answer_feedback_examples")
      .insert({ question: trimmedQuestion, question_embedding: questionEmbedding, answer: trimmedAnswer, good, fix })
      .then(({ error }) => { if (error) console.error("[resume/feedback] example store failed", error); });
  } catch (err) {
    console.error("[resume/feedback]", err);
    res.status(500).json({ success: false, error: "Failed to generate feedback.", detail: errorDetail(err) });
  }
});

// One clarifying question, answered in-character as the interviewer — see
// CLARIFY_SYSTEM_PROMPT above for why this is Situational-only. The "only
// one" limit is enforced on the frontend (the ask box disappears once a
// question has been successfully understood and answered) — EXCEPT when the
// model reports it genuinely couldn't understand the question (e.g. a
// garbled voice transcription): that case doesn't consume the limit, and the
// frontend shows a "Re-ask" button instead. Nothing here needs to track any
// of this server-side, since there's no reuse/calibration value in storing
// these exchanges.
router.post("/questions/clarify", aiLimiter, requireAuth, async (req, res) => {
  const { question, followUp } = req.body || {};

  if (!question || typeof question !== "string" || question.trim().length < 5) {
    return res.status(400).json({ error: "question is required (min 5 characters)." });
  }
  if (!followUp || typeof followUp !== "string" || followUp.trim().length < 3) {
    return res.status(400).json({ error: "followUp is required (min 3 characters)." });
  }

  try {
    const prompt = `ORIGINAL INTERVIEW QUESTION YOU ASKED:\n${question.trim()}\n\nCANDIDATE'S CLARIFYING QUESTION:\n${followUp.trim().slice(0, 500)}\n\nRespond as the interviewer, as specified.`;
    const result = await generateJSON({ system: CLARIFY_SYSTEM_PROMPT, prompt, maxTokens: 1000 });
    if (!result.answer || !result.answer.trim()) throw new Error("Empty response from model.");
    res.json({ success: true, understood: result.understood !== false, answer: result.answer.trim() });
  } catch (err) {
    console.error("[resume/questions/clarify]", err);
    res.status(500).json({ success: false, error: "Failed to get a clarification.", detail: errorDetail(err) });
  }
});

// "Helpful" checkbox on a generated question — stores it (anonymized, no
// user_id) so future /interrogate calls can retrieve semantically similar
// past questions users actually valued and use them as calibration, same
// self-improving-via-retrieval pattern as the answer feedback loop.
router.post("/questions/helpful", aiLimiter, requireAuth, async (req, res) => {
  const { question, category, tag, level } = req.body || {};

  if (!question || typeof question !== "string" || question.trim().length < 5) {
    return res.status(400).json({ error: "question is required (min 5 characters)." });
  }
  if (category !== undefined && category !== null && !CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category, if given, must be one of: ${CATEGORIES.join(", ")}.` });
  }
  if ([tag, level].some(v => v !== undefined && v !== null && (typeof v !== "string" || v.length > 100))) {
    return res.status(400).json({ error: "tag and level, if given, must be strings (max 100 characters)." });
  }

  try {
    const trimmedQuestion = question.trim().slice(0, 1000);
    const [questionEmbedding] = await embedTexts([trimmedQuestion], "RETRIEVAL_DOCUMENT");

    const { data, error } = await supabase
      .from("helpful_questions")
      .insert({
        question: trimmedQuestion,
        question_embedding: questionEmbedding,
        category: category || null,
        tag: tag || null,
        level: level || null
      })
      .select("id")
      .single();
    if (error) throw error;

    res.json({ success: true, id: data.id });
  } catch (err) {
    console.error("[resume/questions/helpful]", err);
    res.status(500).json({ success: false, error: "Failed to save." });
  }
});

router.delete("/questions/helpful/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid id." });
  }

  try {
    const { error } = await supabase.from("helpful_questions").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("[resume/questions/helpful delete]", err);
    res.status(500).json({ success: false, error: "Failed to remove." });
  }
});

export default router;

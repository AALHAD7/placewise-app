import { logLlmCall } from "./llmCallLog.js";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const EMBEDDING_MODEL = "gemini-embedding-001";
// A local model (bge-base-en-v1.5 via @huggingface/transformers) was tried as
// a replacement for this — see DOCUMENT.md — but a single batched CPU
// embedding call over ~500 real chunks (many near the 1500-char chunk-size
// cap) ran for 6+ minutes without finishing and pegged the dev machine, so
// it was reverted before any row was actually overwritten. Staying on the
// Gemini API and just eating the RPD quota constraint (see the generation
// model cascade above, and Step 21a's ingestion story) instead.
const EMBEDDING_DIM = 768; // gemini-embedding-001 supports 768 / 1536 / 3072 via Matryoshka truncation

// Ordered cheapest tier first, and within a tier newest-first. Each model
// sits behind its own independent daily quota, so falling forward when one
// is truly exhausted (see isDailyQuotaExhausted below) is safe for
// generation — unlike embeddings, two different generation calls don't need
// to share a vector space, so mixing models across requests has no
// correctness cost. All three Lite-tier models are exhausted before ever
// escalating to full Flash, to keep cost/latency down for as long as
// possible; Pro-tier models are deliberately excluded — Gemini 2.5 Pro's
// free-tier quota is a mere 150 RPD, nowhere near enough to serve as
// fallback capacity, and routing cheap Lite traffic into Pro on a quota
// miss would spike cost with no real benefit. 3.6 before 3.7 within the
// Flash tier: 3.7 is the newest/most-capable model here, so last resort.
export const GENERATION_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.7-flash"
];

// Phase 1.5 item 5: every call is capped to the flash-lite tiers
// (GENERATION_MODELS[0..MAX_CASCADE_TIER-1]) by default - escalating past
// that into full-flash pricing needs an explicit `allowEscalation: true` on
// the call, reserved for evaluation-type calls (Mock Interview answer
// evaluation, the content-check verifier) where a wrong/low-quality result
// is costlier than the extra tokens. This is a default baked into
// generateText/generateJSON/generateGroundedText themselves, not a per-
// call-site opt-in - every existing caller across the app gets the cap
// automatically with zero changes, and only the 2 explicitly-marked
// escalation call sites can go further.
export const MAX_CASCADE_TIER = 3;

// Nvidia-cascade: nvidia/nemotron-3-ultra-550b-a55b, tried first (ahead of
// every Gemini tier) for chat.js's ungrounded Q&A/chat passthrough only
// (framework explain/pushback chat, Tone Shifter) — not wired into
// generateText/generateJSON/generateGroundedText, so every grounded/RAG
// path and every other feature (resume, mock interview, company/role
// content, Guesstimates, Frameworks) is completely untouched by this. See
// generateChatText below. OpenAI-compatible /chat/completions endpoint,
// confirmed live via curl earlier this session. Off by default — see
// ENABLE_NVIDIA_CASCADE below and log.md for why.
const NVIDIA_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
// Read live from process.env on every call (not cached at module load) —
// cheap, and lets tests flip config/flag between calls within one process
// instead of needing a fresh module import per scenario.
// Free tier is ~40 req/min, shared across however many features eventually
// use it — short enough that a slow/hung call never makes the user wait
// meaningfully longer than the Gemini cascade alone would, and never serves
// as the sole path (a timeout here always falls straight through to Gemini).
// Overridable via env for tests only (simulating a timeout without a real
// multi-second wait) — unset in .env.example, so production always gets the
// 4000ms default.
const NVIDIA_TIMEOUT_MS = Number(process.env.NVIDIA_CASCADE_TIMEOUT_MS) || 4000;

export function isNvidiaCascadeEnabled() {
  return process.env.ENABLE_NVIDIA_CASCADE === "true";
}

// Every failure mode (missing config, non-2xx, timeout/abort, network
// error, malformed body, empty text) is caught here and turned into `null`
// — this function must never throw. generateChatText below treats `null`
// as "fall through to Gemini, exactly as it works today" with no special
// casing per failure type, so a quota 429, a 500, a dropped connection and
// a slow response all degrade identically and invisibly to the caller.
async function tryNvidiaChat({ system, prompt, maxTokens }) {
  const baseUrl = process.env.NVIDIA_NEMOTRON3_ULTRA_BASE_URL;
  const apiKey = process.env.NVIDIA_NEMOTRON3_ULTRA_API_KEY;
  if (!baseUrl || !apiKey) {
    console.warn("[gemini] nvidia cascade enabled but NVIDIA_NEMOTRON3_ULTRA_BASE_URL/API_KEY not set, skipping");
    return null;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NVIDIA_TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.4
      }),
      signal: controller.signal
    });
    if (!res.ok) {
      console.warn(`[gemini] nvidia cascade: ${NVIDIA_MODEL} returned ${res.status}, falling back to Gemini`);
      return null;
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text || !text.trim()) {
      console.warn("[gemini] nvidia cascade: empty response, falling back to Gemini");
      return null;
    }
    return text;
  } catch (err) {
    const reason = err?.name === "AbortError" ? `timed out after ${NVIDIA_TIMEOUT_MS}ms` : err.message;
    console.warn(`[gemini] nvidia cascade: ${reason}, falling back to Gemini`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// batchEmbedContents turned out to hit 429s persistently even at low steady-state
// rates (~40 req/min), while single embedContent calls succeed reliably — the two
// endpoints appear to sit behind different, stricter quota buckets on the free tier.
// So every embed goes through embedContent one at a time, with its own retry.
const MIN_PACING_MS = 250;
const MAX_PACING_MS = 8000;

// Google no longer publishes a fixed RPM for embedding models (it's account-
// specific, visible only on the private AI Studio dashboard) — during the
// Consulting-domain ingestion, a flat 250ms pacing kept drawing 429s every
// ~20-40 calls, each costing a flat 20s penalty per parseRetryDelayMs below,
// which dominated the actual runtime far more than the base pacing did. So
// pacing is adaptive instead of a fixed guess: back off hard the moment a
// 429 lands (recordRateLimit), then ease back down after a streak of clean,
// no-retry-needed calls (recordCleanSuccess) — self-tunes to wherever this
// account's real ceiling actually is instead of guessing a constant.
let pacingMs = MIN_PACING_MS;
let cleanStreak = 0;
const DECAY_STREAK_THRESHOLD = 15;

function recordRateLimit() {
  cleanStreak = 0;
  pacingMs = Math.min(MAX_PACING_MS, Math.round(pacingMs * 1.6) + 250);
}

function recordCleanSuccess() {
  if (pacingMs === MIN_PACING_MS) return;
  cleanStreak++;
  if (cleanStreak >= DECAY_STREAK_THRESHOLD) {
    cleanStreak = 0;
    pacingMs = Math.max(MIN_PACING_MS, Math.round(pacingMs * 0.85));
  }
}

function parseRetryDelayMs(errorBody, fallbackMs = 20000) {
  const match = errorBody.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/);
  return match ? Math.ceil(parseFloat(match[1]) * 1000) + 1000 : fallbackMs;
}

// 429 (rate limit) and 5xx capacity blips (e.g. "This model is currently
// experiencing high demand" on 503) are transient — confirmed repeatedly in
// testing that the exact same request succeeds seconds later with no other
// change. Previously these surfaced as a hard failure to the user on the
// very first blip (e.g. "Failed to generate questions"); now generateText,
// streamGenerateJSON, and transcribeAudio all retry a few times first.
function isTransientStatus(status) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

// A 429 with a short retryDelay is Google saying "you're bursting past a
// per-minute cap, try again shortly" — that's what the plain retry loop
// below already handles. A 429 with no retryDelay (or one measured in tens
// of minutes/hours) means the model's daily quota is actually gone for the
// day; retrying the same model won't help before tomorrow, so that's the
// signal to move on to the next model in the cascade instead.
function isDailyQuotaExhausted(status, body) {
  if (status !== 429) return false;
  const match = body.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/);
  return !match || parseFloat(match[1]) > 60;
}

// Tries each model in `models` in order. Within a model, transient errors
// (429 burst limits, 5xx capacity blips) retry in place with backoff, same
// as before. A model is abandoned in favor of the next one when its daily
// quota is confirmed exhausted, its retry budget runs out, OR it returns a
// non-transient error at all (e.g. 404 "model not found") — the last case
// covers a model being retired/renamed out from under this list, which has
// already happened once for this account (gemini-2.5-flash was retired
// despite still being listed by the models API — see DOCUMENT.md).
// One bad model shouldn't take down every request that happens
// to route through it while the rest of the list is perfectly usable; the
// call only fails once every model in the list has failed.
async function fetchGeminiWithRetry(buildUrl, options, label, models = GENERATION_MODELS, attempts = 5, baseDelayMs = 1500) {
  let lastErr;
  for (let m = 0; m < models.length; m++) {
    const model = models[m];
    const url = buildUrl(model);
    for (let i = 0; i < attempts; i++) {
      const res = await fetch(url, options);
      if (res.ok) {
        if (m > 0) console.warn(`[gemini] ${label}: fell back to ${model} (${models.slice(0, m).join(", ")} exhausted/unavailable)`);
        return { res, model };
      }
      const body = await res.text();
      lastErr = new Error(`Gemini ${label} error ${res.status}: ${body}`);
      if (!isTransientStatus(res.status)) {
        console.warn(`[gemini] ${label}: ${model} returned non-transient ${res.status} (possibly retired/unavailable), moving to next model`);
        break;
      }
      if (res.status === 429 && isDailyQuotaExhausted(res.status, body)) {
        console.warn(`[gemini] ${label}: ${model} daily quota exhausted, moving to next model`);
        break;
      }
      if (i === attempts - 1) break;
      const delay = res.status === 429 ? parseRetryDelayMs(body) : baseDelayMs * Math.pow(2, i);
      console.warn(`[gemini] ${label} got transient ${res.status} on ${model}, retrying in ${delay}ms (attempt ${i + 1}/${attempts})`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

const EMBED_ATTEMPTS = 6;

// Was 429-only, which is why a 503 ("service currently unavailable") during
// the Consulting-domain ingestion killed the whole run after ~140/9200
// chunks despite fetchGeminiWithRetry already treating 503 as transient
// everywhere else in this file — embedOne predates that helper and was never
// brought in line with it. Now retries every isTransientStatus code, not
// just 429: 429 backs off using Google's own suggested retryDelay (it's
// usually specific and short), other transient 5xx fall back to exponential
// backoff since there's no retryDelay in those error bodies.
async function embedOne(text, taskType, attempt = 0) {
  const res = await fetch(`${GEMINI_BASE}/models/${EMBEDDING_MODEL}:embedContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY
    },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      taskType,
      outputDimensionality: EMBEDDING_DIM
    })
  });

  if (!res.ok && isTransientStatus(res.status) && attempt < EMBED_ATTEMPTS) {
    if (res.status === 429) recordRateLimit();
    const body = await res.text();
    const delayMs = res.status === 429 ? parseRetryDelayMs(body) : 1500 * Math.pow(2, attempt);
    console.warn(`[gemini] embedding got transient ${res.status}, retrying in ${Math.round(delayMs / 1000)}s (attempt ${attempt + 1}/${EMBED_ATTEMPTS}, pacing now ${pacingMs}ms)`);
    await sleep(delayMs);
    return embedOne(text, taskType, attempt + 1);
  }

  if (!res.ok) {
    throw new Error(`Gemini embedding error ${res.status}: ${await res.text()}`);
  }

  if (attempt === 0) recordCleanSuccess();
  const data = await res.json();
  return data.embedding.values;
}

/**
 * @param {string[]} texts
 * @param {"RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"} taskType - DOCUMENT when embedding source
 *   chunks for storage, QUERY when embedding a user's resume/search text at request time.
 * @returns {Promise<number[][]>} embeddings, in the same order as `texts`
 */
export async function embedTexts(texts, taskType = "RETRIEVAL_DOCUMENT") {
  const embeddings = [];
  for (let i = 0; i < texts.length; i++) {
    embeddings.push(await embedOne(texts[i], taskType));
    if (i < texts.length - 1) await sleep(pacingMs);
  }
  return embeddings;
}

// Search-grounded generation (Gemini's "tools: [{google_search:{}}]"
// feature - confirmed live against this project's models, returns real
// groundingMetadata with actual search queries and source citations, not
// just the model's parametric recall). Deliberately returns plain text, not
// JSON: live-tested that constraining output to strict JSON in the same
// call made the model skip actually invoking search about a third of the
// time while still *claiming* in the text to be "based on Glassdoor,
// AmbitionBox..." - a worse failure mode than no grounding at all, since
// it's an unverifiable claim of a methodology that didn't happen. Callers
// that need structured output should feed this text into a normal
// generateJSON call as context instead of asking this function for JSON
// directly. `grounded` is false if the model answered without actually
// searching (check it - don't assume `sources` means grounding occurred
// only from a non-empty text).
async function generateGroundedTextOnce({ system, prompt, maxTokens = 500, feature }) {
  // Grounded search isn't in the escalation-allowed list (Phase 1.5 item 5
  // names only Mock Interview evaluation and the content-check verifier) -
  // always capped to the flash-lite tiers, no opt-in here.
  const { res, model } = await fetchGeminiWithRetry(
    model => `${GEMINI_BASE}/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: system }] },
        tools: [{ google_search: {} }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 }
      })
    },
    "generateContent(grounded)",
    GENERATION_MODELS.slice(0, MAX_CASCADE_TIER)
  );
  logLlmCall("grounded", model, feature);

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts || []).map(p => p.text || "").join("");
  const groundingMetadata = candidate?.groundingMetadata || {};
  const grounded = !!(groundingMetadata.webSearchQueries && groundingMetadata.webSearchQueries.length);
  // `uri` here is a Google grounding-redirect link (vertexaisearch.cloud.google.com/...),
  // not the bare source URL - that's expected and fine to use directly as an
  // href: it's what Google's own grounding UI links to, and it 302s straight
  // to the real page. Never substitute a model-guessed URL instead - only a
  // uri that actually came back from a real search result is trustworthy.
  const sources = (groundingMetadata.groundingChunks || [])
    .map(c => ({ title: c.web?.title || "", uri: c.web?.uri || "" }))
    .filter(s => s.uri);
  return { text, grounded, sources };
}

// Whether the model actually invokes the search tool on a given call is
// itself probabilistic, independent of the retry-on-transport-failure logic
// above - confirmed live: the identical prompt for "TCS" and "Amazon India"
// came back ungrounded twice in a row, then grounded on a 3rd attempt with
// no other change. For most callers here that's tolerable (they fall back
// to a clearly-labeled "general knowledge, unverified" framing when
// ungrounded). But a caller that hard-refuses to show anything when
// ungrounded (e.g. companyRating.js - a single number looks authoritative
// enough that an unverified guess is worse than admitting "not found")
// needs a real chance at grounding actually firing, not just one roll of
// the dice. `retriesIfUngrounded` (default 0 - no behavior change for every
// existing caller unless opted in) re-rolls up to that many extra times,
// stopping the moment one attempt comes back grounded, and returns the last
// attempt's result if none of them did.
export async function generateGroundedText({ system, prompt, maxTokens = 500, retriesIfUngrounded = 0, feature }) {
  let result = await generateGroundedTextOnce({ system, prompt, maxTokens, feature });
  for (let attempt = 0; attempt < retriesIfUngrounded && !result.grounded; attempt++) {
    result = await generateGroundedTextOnce({ system, prompt, maxTokens, feature });
  }
  return result;
}

export async function generateText({ system, prompt, maxTokens = 1200, allowEscalation = false, onModelUsed, feature, _callType = "text" }) {
  const models = allowEscalation ? GENERATION_MODELS : GENERATION_MODELS.slice(0, MAX_CASCADE_TIER);
  const { res, model } = await fetchGeminiWithRetry(
    model => `${GEMINI_BASE}/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: system }] },
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4 }
      })
    },
    "generateContent",
    models
  );
  if (onModelUsed) onModelUsed(model);
  // _callType: generateJSON calls this function internally and passes
  // "json" so the usage log reflects what the CALLER actually asked for,
  // not the fact that JSON happens to be fetched via the text endpoint.
  logLlmCall(_callType, model, feature);

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// chat.js's ungrounded Q&A/chat passthrough only (framework explain/pushback
// chat, Tone Shifter) — tries nvidia/nemotron-3-ultra-550b-a55b first when
// ENABLE_NVIDIA_CASCADE=true, then falls straight through to the existing
// Gemini generateText cascade on any failure, exactly as it behaved before
// this model existed. Caching/singleFlight in the caller is untouched: this
// function just returns a string either way, same as generateText always
// did, so whichever model answered is cached identically.
export async function generateChatText({ system, prompt, maxTokens = 1200, feature }) {
  if (isNvidiaCascadeEnabled()) {
    const text = await tryNvidiaChat({ system, prompt, maxTokens });
    if (text) {
      logLlmCall("text", NVIDIA_MODEL, feature);
      return text;
    }
  }
  return generateText({ system, prompt, maxTokens, feature });
}

// A greedy [...]/{ ...} regex can't just be tried in a fixed order: a top-level
// object containing array fields (e.g. {"strengths": [...], "improvements": [...]})
// would wrongly match from the first "[" to the last "]", straddling both arrays.
// Whichever bracket the response actually starts with determines which greedy
// match spans the real top-level structure correctly.
const TRANSCRIBE_SYSTEM_PROMPT = "Transcribe this audio recording exactly as spoken, in plain text. No commentary, no markdown, no speaker labels, no timestamps — just the words spoken, as a candidate answering an interview question.";

export async function transcribeAudio({ buffer, mimeType }) {
  const { res, model } = await fetchGeminiWithRetry(
    model => `${GEMINI_BASE}/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { inline_data: { mime_type: mimeType, data: buffer.toString("base64") } },
            { text: TRANSCRIBE_SYSTEM_PROMPT }
          ]
        }],
        generationConfig: { maxOutputTokens: 2000, temperature: 0.1 }
      })
    },
    "transcription",
    GENERATION_MODELS.slice(0, MAX_CASCADE_TIER)
  );
  logLlmCall("text", model, "transcribeAudio");

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// Same inline-image-data pattern as transcribeAudio above, for the image-
// ingestion pipeline (scripts/ingestImages.js) — captions a diagram/chart/
// screenshot pulled out of a source PDF so it becomes a searchable,
// embeddable piece of text (an image itself has no embedding — the caption
// stands in for it in document_chunks, same table/RPC as every text chunk).
const CAPTION_SYSTEM_PROMPT = "This image was extracted from a student interview-prep casebook or study guide (consulting/product/finance/HR/marketing/general management). Describe it factually and specifically enough that someone searching interview-prep material by topic would find it from this description alone: what kind of image it is (chart, framework diagram, table, screenshot, photo, etc.), what data or concept it shows, and any labels, numbers, or named frameworks visible in it. 2-4 sentences. If it is purely decorative (a logo, icon, background pattern, or divider with no informational content), respond with exactly: DECORATIVE";

export async function captionImage({ buffer, mimeType }) {
  const { res, model } = await fetchGeminiWithRetry(
    model => `${GEMINI_BASE}/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { inline_data: { mime_type: mimeType, data: buffer.toString("base64") } },
            { text: CAPTION_SYSTEM_PROMPT }
          ]
        }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.2 }
      })
    },
    "image caption",
    GENERATION_MODELS.slice(0, MAX_CASCADE_TIER)
  );
  logLlmCall("text", model, "captionImage");

  const data = await res.json();
  return (data.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
}

// Same inline-image-data pattern as captionImage/transcribeAudio above, for
// the Community page's "Add yours" proof upload. This is a soft plausibility
// read, not forensic authentication - a screenshot is trivially fakeable in
// any image/text editor and there's no email server, ATS, or company record
// to cross-check against. The result is stored for a human reviewer's
// benefit (see backend/db/migration_018_community_proof.sql); it never
// blocks a submission outright, only flags it either way.
const PROOF_CHECK_SYSTEM_PROMPT = `You are helping a human moderator sanity-check a piece of "proof" someone attached to a claim that they interviewed at a company for a role. This is a soft plausibility read, not forensic authentication - you cannot detect a sophisticated forgery, and you should not claim to. Look at the image and judge only: does it look like a genuine screenshot of something interview-related (an email thread, a calendar invite, an offer/rejection letter, a recruiting-portal message, a LinkedIn message, etc.) - not a random photo, meme, blank image, or obvious mockup; and does it plausibly reference the claimed company and/or role (an approximate or partial mention counts, exact wording is not required).

Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"plausible": true or false, "note": "One sentence for the human reviewer - what you actually saw in the image and why you judged it that way."}`;

export async function checkInterviewProof({ buffer, mimeType, company, role }) {
  const claim = [company ? `Company: ${company}` : null, role ? `Role: ${role}` : null].filter(Boolean).join(", ") || "(no company/role given)";
  const { res, model } = await fetchGeminiWithRetry(
    model => `${GEMINI_BASE}/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { inline_data: { mime_type: mimeType, data: buffer.toString("base64") } },
            { text: `Claimed interview: ${claim}\n\n${PROOF_CHECK_SYSTEM_PROMPT}` }
          ]
        }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.1 }
      })
    },
    "proof check",
    GENERATION_MODELS.slice(0, MAX_CASCADE_TIER)
  );
  logLlmCall("json", model, "checkInterviewProof");

  const data = await res.json();
  const raw = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
  try {
    const parsed = extractJSON(raw);
    return { plausible: !!parsed.plausible, note: String(parsed.note || "").slice(0, 500) };
  } catch {
    return { plausible: false, note: "Could not read the model's response - review the image manually." };
  }
}

function extractJSON(raw) {
  const firstBrace = raw.indexOf("{");
  const firstBracket = raw.indexOf("[");
  const objectFirst = firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket);

  const match = objectFirst ? raw.match(/\{[\s\S]*\}/) : raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON found in model output");
  return JSON.parse(match[0]);
}

// The model's visible answer occasionally comes back truncated or with stray text
// around the JSON (variable "thinking" token usage on reasoning-capable models can eat
// into the output budget unpredictably) — extract just the JSON substring and retry a
// couple of times before giving up, rather than failing on the first imperfect response.
export async function generateJSON({ system, prompt, maxTokens = 1200, attempts = 3, allowEscalation = false, onModelUsed, feature }) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const raw = await generateText({ system, prompt, maxTokens, allowEscalation, onModelUsed, feature, _callType: "json" });
      return extractJSON(raw);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

// Gemini has no notion of "progress" for a single generateContent call, but
// streamGenerateContent (SSE) delivers the same output incrementally as it's
// produced. onProgress gets the raw accumulated text after every chunk so a
// caller can estimate completion (e.g. by counting occurrences of a known
// repeating JSON key) without waiting for the whole response.
async function streamGenerateJSONOnce({ system, prompt, maxTokens, onProgress }) {
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: system }] },
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4 }
  });

  // Per-model attempt count kept short — confirmed by direct testing that
  // streamGenerateContent can be degraded for minutes at a time while plain
  // generateContent on the same model succeeds immediately, so it's better
  // to fail over (to the next model, and ultimately to the non-streaming
  // fallback in streamGenerateJSON below) quickly than to sit here retrying
  // a specifically-broken endpoint for a long time.
  // Not an escalation-allowed call type (Phase 1.5 item 5 names only Mock
  // Interview evaluation and the content-check verifier) - capped same as
  // everything else by default.
  const { res, model } = await fetchGeminiWithRetry(
    model => `${GEMINI_BASE}/models/${model}:streamGenerateContent?alt=sse`,
    { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY }, body },
    "streamGenerateContent",
    GENERATION_MODELS.slice(0, MAX_CASCADE_TIER),
    3
  );
  // Single caller today (resume.js's 30-question interrogation) - hardcoded
  // rather than threading a feature param through for just one call site.
  logLlmCall("json", model, "resume.js (streamGenerateJSON)");

  let raw = "";
  let buffer = "";
  const consumeEvent = evt => {
    const line = evt.trim();
    if (!line.startsWith("data:")) return;
    const jsonStr = line.slice(5).trim();
    if (!jsonStr) return;
    let parsed;
    try { parsed = JSON.parse(jsonStr); } catch { return; }
    const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      raw += text;
      if (onProgress) onProgress(raw);
    }
  };

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // Google's SSE stream separates events with "\r\n\r\n", not "\n\n" —
    // splitting on the wrong separator silently drops the entire response
    // into the leftover buffer, which never gets processed.
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop(); // last chunk may be a half-received event — keep it for next read
    events.forEach(consumeEvent);
  }
  if (buffer.trim()) consumeEvent(buffer); // stream can end without a trailing separator after the last event

  return extractJSON(raw);
}

// Even after a 200 response, the model's JSON occasionally comes back
// malformed (a stray unescaped character inside a string field, or the
// response ending mid-structure) — same class of issue generateJSON already
// retries for on the non-streaming path. streamGenerateJSONOnce previously
// had no equivalent, so a single malformed response failed the whole
// request outright with no retry. Retrying re-runs the full stream from
// scratch (onProgress starts over from 0% on a retry) rather than trying to
// patch/repair the broken JSON.
export async function streamGenerateJSON({ system, prompt, maxTokens = 1200, onProgress, attempts = 2 }) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await streamGenerateJSONOnce({ system, prompt, maxTokens, onProgress });
    } catch (err) {
      lastErr = err;
      console.warn(`[gemini] streamGenerateJSON attempt ${i + 1}/${attempts} failed: ${err.message}`);
    }
  }
  // Observed directly: streamGenerateContent returning repeated 503s for
  // several minutes straight while a plain (non-streaming) generateContent
  // call with the exact same prompt succeeded in a few seconds — the two
  // endpoints don't appear to share the same capacity/health. Falling back
  // here means a degraded streaming endpoint no longer means a hard failure
  // for the user; it just means no live progress % for this one request.
  console.warn("[gemini] streaming exhausted, falling back to non-streaming generateJSON");
  const result = await generateJSON({ system, prompt, maxTokens });
  if (onProgress) onProgress(JSON.stringify(result)); // lets progress-estimation see a complete result before returning
  return result;
}

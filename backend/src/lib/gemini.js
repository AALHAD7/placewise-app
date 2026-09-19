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
const GENERATION_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.7-flash"
];

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
export async function generateGroundedText({ system, prompt, maxTokens = 500 }) {
  const { res } = await fetchGeminiWithRetry(
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
    "generateContent(grounded)"
  );

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

export async function generateText({ system, prompt, maxTokens = 1200 }) {
  const { res } = await fetchGeminiWithRetry(
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
    "generateContent"
  );

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// A greedy [...]/{ ...} regex can't just be tried in a fixed order: a top-level
// object containing array fields (e.g. {"strengths": [...], "improvements": [...]})
// would wrongly match from the first "[" to the last "]", straddling both arrays.
// Whichever bracket the response actually starts with determines which greedy
// match spans the real top-level structure correctly.
const TRANSCRIBE_SYSTEM_PROMPT = "Transcribe this audio recording exactly as spoken, in plain text. No commentary, no markdown, no speaker labels, no timestamps — just the words spoken, as a candidate answering an interview question.";

export async function transcribeAudio({ buffer, mimeType }) {
  const { res } = await fetchGeminiWithRetry(
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
    "transcription"
  );

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
  const { res } = await fetchGeminiWithRetry(
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
    "image caption"
  );

  const data = await res.json();
  return (data.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
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
export async function generateJSON({ system, prompt, maxTokens = 1200, attempts = 3 }) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const raw = await generateText({ system, prompt, maxTokens });
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
  const { res } = await fetchGeminiWithRetry(
    model => `${GEMINI_BASE}/models/${model}:streamGenerateContent?alt=sse`,
    { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY }, body },
    "streamGenerateContent",
    GENERATION_MODELS,
    3
  );

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

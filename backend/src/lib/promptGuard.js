// Pre-filter for free-form user text headed into an LLM prompt (the Q&A box,
// chat.js's passthrough) — screens for prompt-injection/jailbreak attempts
// using Groq's meta-llama/llama-prompt-guard-2-86m classifier before the
// text ever reaches Gemini. Confirmed live 2026-11-12: this model's only
// output is a single float 0-1 (injection likelihood) in message.content -
// a benign question scored ~0.0004, two different jailbreak-style prompts
// both scored >0.999, a wide margin either side of GUARD_THRESHOLD.
//
// Fails open on any error/timeout/missing config/unexpected response shape
// — a classifier outage or a 512-token-context truncation must never block
// a legitimate question, only skip the extra check for that one request.
const GUARD_MODEL = "meta-llama/llama-prompt-guard-2-86m";
// Model's context window is 512 tokens total; routes calling this already
// cap input length themselves (qa.js: 1000 chars, chat.js: 16000 chars), so
// this trims further to stay well inside that budget — injection attempts
// are near-universally front-loaded (the "ignore previous instructions"
// framing has to come early to have any effect), so checking only the first
// slice loses essentially nothing.
const GUARD_INPUT_CHAR_LIMIT = 1500;
// Live-measured 2026-11-12: this model's FIRST call after being idle pays a
// ~3.2s cold-start tax (Groq spinning up that model's inference instance),
// then every call after that lands at ~125-130ms - same shape of problem
// the retired NVIDIA cascade had, just smaller margin. 3000ms clipped that
// cold start in testing and fell open (correctly, but losing the check for
// that one request); 5000ms gives real headroom above the observed 3182ms.
const GUARD_TIMEOUT_MS = Number(process.env.PROMPT_GUARD_TIMEOUT_MS) || 5000;
const GUARD_THRESHOLD = 0.9;

export function isPromptGuardEnabled() {
  return process.env.ENABLE_PROMPT_GUARD === "true";
}

/**
 * @param {string} text - raw user-authored text about to be sent into a prompt
 * @returns {Promise<boolean>} true only if the classifier scored it >= GUARD_THRESHOLD;
 *   false on a clean low score AND on any failure (fail-open)
 */
export async function looksLikeInjection(text) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !text || !text.trim()) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GUARD_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: GUARD_MODEL,
        messages: [{ role: "user", content: text.slice(0, GUARD_INPUT_CHAR_LIMIT) }]
      }),
      signal: controller.signal
    });
    if (!res.ok) {
      console.warn(`[promptGuard] groq returned ${res.status}, failing open`);
      return false;
    }
    const data = await res.json();
    const score = parseFloat(data?.choices?.[0]?.message?.content);
    if (Number.isNaN(score)) {
      console.warn("[promptGuard] unexpected response shape, failing open");
      return false;
    }
    return score >= GUARD_THRESHOLD;
  } catch (err) {
    const reason = err?.name === "AbortError" ? `timed out after ${GUARD_TIMEOUT_MS}ms` : err.message;
    console.warn(`[promptGuard] ${reason}, failing open`);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

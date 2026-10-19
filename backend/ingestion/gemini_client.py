"""Minimal Gemini REST client for this pipeline's two needs: vision
transcription of visual/scanned pages, and embeddings for chunks. Mirrors
the retry/cascade/quota-fallback behavior already proven in
backend/scripts/reextract_text.py (same project, same real-world failure
modes already debugged there - recitation blocks, daily quota exhaustion,
transient 5xx/429s)."""
import base64
import re
import time
import requests

import config
from config import GEMINI_BASE, VISION_MODELS, EMBEDDING_MODEL, EMBEDDING_DIM, VISION_429_MAX_WAIT_S

# One count per HTTP request actually sent (vision), so call_count, call_log
# and the bill all agree.
call_count = {"vision": 0, "embedding": 0}
# Run-level hard cap on vision HTTP requests (None = no cap). Checked before
# every request; see set_vision_cap().
vision_budget = {"cap": None}


class VisionCallError(RuntimeError):
    """A vision request failed (network error, non-transient HTTP error, or
    every model in the cascade failed). The page is flagged, not retried."""


class PageBudgetExceeded(VisionCallError):
    """The per-call HTTP budget (max_http) ran out before a success."""


class BudgetExceeded(RuntimeError):
    """The run-level vision cap is reached. Callers should stop the run."""


def set_vision_cap(cap):
    vision_budget["cap"] = cap


def _is_transient(status: int) -> bool:
    return status in (429, 500, 502, 503, 504)


def _retry_delay_s(body: str):
    m = re.search(r'"retryDelay":\s*"(\d+(?:\.\d+)?)s"', body or "")
    return float(m.group(1)) if m else None


def _parse_retry_delay_s(body: str, fallback: float = 20.0) -> float:
    d = _retry_delay_s(body)
    return d + 1.0 if d is not None else fallback


def transcribe_page(png_bytes: bytes, prompt: str, max_tokens: int = 3000, return_meta: bool = False,
                    max_http=None, call_log=None, log_ctx=None, sleep=time.sleep):
    """Sends one page image + prompt down the flash-lite cascade. Returns the
    Markdown text, or (text, {"finish_reason", "model", "http_calls"}) with
    return_meta=True.

    Budget rules (every HTTP request counts in call_count['vision'] and gets
    one call_log entry when call_log is given):
    - One request per model. A 429 is retried once on the same model only if
      Gemini asks for a wait <= VISION_429_MAX_WAIT_S; otherwise, and on 5xx
      or 404 (model unavailable), it moves to the next model.
    - A network error/timeout or any other 4xx raises VisionCallError at once
      (no retry, no cascade).
    - max_http caps requests for this call (PageBudgetExceeded); the run cap
      (set_vision_cap) is checked before each request (BudgetExceeded)."""
    parts = [
        {"text": prompt},
        {"inline_data": {"mime_type": "image/png", "data": base64.b64encode(png_bytes).decode("ascii")}}
    ]
    payload = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": 0.1},
    }
    made = 0
    last_err = None
    for model in VISION_MODELS:
        url = f"{GEMINI_BASE}/models/{model}:generateContent"
        retried_429 = False
        while True:
            cap = vision_budget["cap"]
            if cap is not None and call_count["vision"] >= cap:
                raise BudgetExceeded(f"vision cap {cap} reached")
            if max_http is not None and made >= max_http:
                raise PageBudgetExceeded(f"per-page vision budget {max_http} used up; last error: {last_err}")
            call_count["vision"] += 1
            made += 1
            entry = dict(log_ctx or {}, type="vision", model=model, http=made)
            if call_log is not None:
                call_log.append(entry)
            try:
                r = requests.post(url, headers={"Content-Type": "application/json",
                                                "x-goog-api-key": config.GEMINI_API_KEY},
                                  json=payload, timeout=180)
            except requests.RequestException as e:
                entry["status"] = "network_error"
                raise VisionCallError(f"network error on {model}: {type(e).__name__}") from e
            entry["status"] = r.status_code
            if r.ok:
                data = r.json()
                candidate = (data.get("candidates") or [{}])[0]
                text_parts = (candidate.get("content") or {}).get("parts") or []
                text = "".join(p.get("text", "") for p in text_parts)
                if return_meta:
                    return text, {"finish_reason": candidate.get("finishReason"), "model": model,
                                  "http_calls": made}
                return text
            body = r.text
            last_err = VisionCallError(f"Gemini error {r.status_code} on {model}: {body[:300]}")
            if r.status_code == 429:
                delay = _retry_delay_s(body)
                if not retried_429 and delay is not None and delay <= VISION_429_MAX_WAIT_S:
                    retried_429 = True
                    sleep(delay + 0.5)
                    continue
                break  # quota/long wait: next model
            if _is_transient(r.status_code) or r.status_code == 404:
                break  # 5xx or model unavailable: next model
            raise last_err  # other 4xx: the request itself is wrong, don't cascade
    raise last_err or VisionCallError("Gemini vision: all models failed")


def embed_text(text: str, task_type: str = "RETRIEVAL_DOCUMENT", attempts: int = 4) -> list:
    """Embeds one chunk's text, same model/dimension as document_chunks."""
    url = f"{GEMINI_BASE}/models/{EMBEDDING_MODEL}:embedContent"
    payload = {
        "model": f"models/{EMBEDDING_MODEL}",
        "content": {"parts": [{"text": text}]},
        "taskType": task_type,
        "outputDimensionality": EMBEDDING_DIM
    }
    last_err = None
    for i in range(attempts):
        call_count["embedding"] += 1
        try:
            r = requests.post(url, headers={"Content-Type": "application/json", "x-goog-api-key": config.GEMINI_API_KEY}, json=payload, timeout=60)
        except requests.RequestException as e:
            last_err = e
            time.sleep(1.5 * (2 ** i))
            continue
        if r.ok:
            return r.json()["embedding"]["values"]
        last_err = RuntimeError(f"Embed error {r.status_code}: {r.text[:300]}")
        if not _is_transient(r.status_code) or i == attempts - 1:
            break
        time.sleep(_parse_retry_delay_s(r.text) if r.status_code == 429 else 1.5 * (2 ** i))
    raise last_err or RuntimeError("Embedding: failed")

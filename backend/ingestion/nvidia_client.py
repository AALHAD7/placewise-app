"""Alternate vision provider for page transcription: NVIDIA's free-tier NIM
endpoint (OpenAI-compatible /chat/completions), evaluated side-by-side with
Gemini vision via compare_vision_providers.py. Not wired into the main
pipeline's default path - see config.VISION_PROVIDER.

Mirrors gemini_client.transcribe_page's call signature/return shape so a
caller can swap providers without touching the rest of convert.py."""
import base64
import time
import requests

import config
from config import NVIDIA_VISION_MODEL

call_count = {"vision": 0}


class NvidiaVisionCallError(RuntimeError):
    """A vision request failed (network error or non-transient HTTP error).
    Mirrors gemini_client.VisionCallError - the page is flagged, not retried."""


def _is_transient(status: int) -> bool:
    return status in (429, 500, 502, 503, 504)


def transcribe_page(png_bytes: bytes, prompt: str, max_tokens: int = 3000, return_meta: bool = False,
                    max_http=None, call_log=None, log_ctx=None, sleep=time.sleep, attempts: int = 2):
    """Same contract as gemini_client.transcribe_page: returns Markdown text,
    or (text, {"finish_reason", "model", "http_calls"}) with return_meta=True.
    One model only (no cascade - the free tier has one Nemotron VLM worth
    using); a transient error is retried up to `attempts` times with a short
    backoff, matching the retry tolerance Gemini gets via its own cascade."""
    data_url = f"data:image/png;base64,{base64.b64encode(png_bytes).decode('ascii')}"
    payload = {
        "model": NVIDIA_VISION_MODEL,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": data_url}},
            ],
        }],
        "max_tokens": max_tokens,
        "temperature": 0.1,
    }
    url = f"{config.NVIDIA_NEMOTRON3_ULTRA_BASE_URL}/chat/completions"
    made = 0
    last_err = None
    for i in range(attempts):
        if max_http is not None and made >= max_http:
            raise NvidiaVisionCallError(f"per-page vision budget {max_http} used up; last error: {last_err}")
        call_count["vision"] += 1
        made += 1
        entry = dict(log_ctx or {}, type="vision_nvidia", model=NVIDIA_VISION_MODEL, http=made)
        if call_log is not None:
            call_log.append(entry)
        try:
            r = requests.post(url, headers={"Content-Type": "application/json",
                                            "Authorization": f"Bearer {config.NVIDIA_NEMOTRON3_ULTRA_API_KEY}"},
                              json=payload, timeout=180)
        except requests.RequestException as e:
            entry["status"] = "network_error"
            last_err = NvidiaVisionCallError(f"network error: {type(e).__name__}")
            sleep(2.0 * (i + 1))
            continue
        entry["status"] = r.status_code
        if r.ok:
            data = r.json()
            choice = (data.get("choices") or [{}])[0]
            text = (choice.get("message") or {}).get("content") or ""
            finish_reason = choice.get("finish_reason")
            if return_meta:
                return text, {"finish_reason": "MAX_TOKENS" if finish_reason == "length" else finish_reason,
                              "model": NVIDIA_VISION_MODEL, "http_calls": made}
            return text
        body = r.text
        last_err = NvidiaVisionCallError(f"NVIDIA error {r.status_code}: {body[:300]}")
        if _is_transient(r.status_code) and i < attempts - 1:
            sleep(2.0 * (i + 1))
            continue
        raise last_err
    raise last_err or NvidiaVisionCallError("NVIDIA vision: all attempts failed")

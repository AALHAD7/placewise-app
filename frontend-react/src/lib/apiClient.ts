// Backend integration - ported from frontend/index.html lines 1731-1816.

import { supabase } from "./supabaseClient";

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export class ApiError extends Error {}

// Raised when a request needs a session and the visitor isn't signed in
// (not even as a guest) - the AppShell's auth guard means this should be
// rare in practice, but sign-in-only routes still need a clear error for
// the brief window before that guard redirects, or for a session that
// expired (e.g. the 3-hour guest cutoff) mid-page.
export class AuthUnavailableError extends ApiError {
  constructor() {
    super("This feature needs sign-in, which isn't available yet.");
    this.name = "AuthUnavailableError";
  }
}

// Real Supabase session (email/password, Google, or anonymous guest - see
// contexts/AuthContext.tsx) - supabase-js persists it in localStorage and
// auto-refreshes it, so this just reads whatever's current.
export async function getAuthToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new AuthUnavailableError();
  return data.session.access_token;
}

// For requests that work with or without a session: a token if one is
// available, null if sign-in isn't. Any other failure (backend down, etc.)
// still throws, so its message isn't masked.
async function getOptionalAuthToken(): Promise<string | null> {
  try {
    return await getAuthToken();
  } catch (e) {
    if (e instanceof AuthUnavailableError) return null;
    throw e;
  }
}

// Decoding a JWT payload client-side for display only, never trusted as a
// security check (the backend independently verifies every request).
export function decodeSessionDisplayName(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.is_anonymous || payload.app_metadata?.provider === "anonymous") return "Guest";
    const local = (payload.email || "").split("@")[0] || "there";
    return local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((w: string) => w[0].toUpperCase() + w.slice(1))
      .join(" ");
  } catch {
    return "there";
  }
}

// Generic chat completion used by the push-back probe chat and Tone
// Shifter. Ported from callClaude() (frontend/index.html:3007-3026) - the
// window.claude.complete branch there was a Claude.ai Artifact-sandbox
// vestige with no effect in a real browser, dropped per explicit decision
// (see migration plan Context).
export async function callClaude(messages: { role: string; content: string }[]): Promise<string> {
  const token = await getAuthToken();
  const response = await fetch(API_BASE + "/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ messages })
  });
  const data = await response.json();
  if (!data || !data.success) throw new Error((data && data.error) || "Bad response");
  return data.text as string;
}

// Fire-and-forget activity logging (feeds Home's Today's Plan/Recent
// Activity/streak) - errors are deliberately swallowed, same as the old
// app's logActivity() (frontend/index.html:2996-3005): a failed log write
// should never interrupt whatever the user was actually doing.
export async function logActivity(type: string, label: string): Promise<void> {
  try {
    const token = await getAuthToken();
    await fetch(API_BASE + "/api/activity/log", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ type, label })
    });
  } catch {
    // ignore
  }
}

// Shared fetch wrapper mirroring the `if (!res.ok || !data.success) throw new
// Error(data.error || "...")` pattern repeated at ~26 call sites in the old
// app. Pass `fallbackError` to preserve a call-site-specific message (the old
// app's error copy is fairly specific per failure, e.g. "Could not load
// activity." - keep that specificity rather than a generic message).
export async function apiFetch<T>(
  path: string,
  opts: RequestInit = {},
  fallbackError = "Request failed."
): Promise<T> {
  // No session is not an error here: most reads are public on the backend.
  // Sign-in-only routes answer 401, mapped to a clear message below.
  const token = await getOptionalAuthToken();
  const res = await fetch(API_BASE + path, {
    ...opts,
    headers: {
      ...(opts.body && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(opts.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !token) throw new AuthUnavailableError();
  if (!res.ok || data.success === false) {
    throw new ApiError(data.error || fallbackError);
  }
  return data as T;
}

// /api/resume/interrogate streams progress as SSE rather than returning one
// JSON blob - each "progress" event reflects how much of the 30-question
// response Gemini has actually produced so far, not a simulated timer.
// Ported verbatim from frontend/index.html:2138-2182 (shared by both a full
// generation and a single-category refresh). Throws on failure; callers own
// their own loading/error state.
export async function streamInterrogate(
  resumeText: string,
  category: string | null,
  onProgress: (percent: number) => void,
  domain?: string
): Promise<{ results: Record<string, unknown>; sourcesUsed?: unknown[] }> {
  const token = await getAuthToken();
  const res = await fetch(API_BASE + "/api/resume/interrogate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ resumeText, ...(category ? { category } : {}), ...(domain ? { domain } : {}) })
  });
  if (!res.ok || !res.body) throw new Error("Failed to generate questions.");

  const reader = res.body.getReader();
  try {
    const decoder = new TextDecoder();
    let buffer = "";
    let finalData: { results?: Record<string, unknown>; sourcesUsed?: unknown[] } | null = null;
    let streamErr: string | null = null;

    const consumeEvent = (evt: string) => {
      const line = evt.trim();
      if (!line.startsWith("data:")) return;
      let payload;
      try {
        payload = JSON.parse(line.slice(5).trim());
      } catch {
        return;
      }
      if (payload.type === "progress") onProgress(payload.percent);
      else if (payload.type === "done") finalData = payload;
      else if (payload.type === "error") streamErr = payload.error || "Failed to generate questions.";
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // Gemini's SSE stream separates events with "\r\n\r\n", not "\n\n".
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() as string;
      events.forEach(consumeEvent);
    }
    if (buffer.trim()) consumeEvent(buffer);
    if (streamErr) throw new Error(streamErr);
    if (!finalData || !(finalData as { results?: unknown }).results) throw new Error("Failed to generate questions.");
    return finalData as { results: Record<string, unknown>; sourcesUsed?: unknown[] };
  } catch (e) {
    try {
      reader.cancel();
    } catch {
      // ignore
    }
    throw e;
  }
}

// Resume upload needs real upload-progress events, which fetch() doesn't
// provide - kept on XMLHttpRequest for that reason alone (see
// frontend/index.html:2440-2444). Every other call site should use
// apiFetch() above instead.
export function apiUploadWithProgress<T>(
  path: string,
  formData: FormData,
  onProgress: (percent: number) => void,
  onUploadComplete?: () => void,
  networkErrorMessage = "Upload failed."
): Promise<T> {
  return getAuthToken().then(
    (token) =>
      new Promise<T>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", API_BASE + path);
        xhr.setRequestHeader("Authorization", "Bearer " + token);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        if (onUploadComplete) xhr.upload.onload = onUploadComplete;
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && data.success !== false) resolve(data as T);
            else reject(new ApiError(data.error || "Upload failed."));
          } catch {
            reject(new ApiError("Bad response from server."));
          }
        };
        xhr.onerror = () => reject(new ApiError(networkErrorMessage));
        xhr.send(formData);
      })
  );
}

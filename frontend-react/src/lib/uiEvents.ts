// Click/view event tracking - batches events client-side and flushes them to
// POST /api/events/track every few seconds (or on page hide/unmount) rather
// than one request per click. Scope as of 2026-11-12: Frameworks, Q&A,
// Guesstimates pages only (Aalhad's call) - this module itself is generic,
// nothing stops another page from calling trackClick/trackView too.
//
// Fire-and-forget, same posture as logActivity in apiClient.ts: a tracking
// failure must never interrupt what the user is actually doing. Auth is
// best-effort (includes a token when a session exists - which in practice
// is almost always true, since guest sessions are real anonymous Supabase
// Auth users per AuthContext.tsx) with a client-generated guestLabel as a
// fallback identity for the rare case auth hasn't initialized yet.
import { supabase } from "./supabaseClient";
import { API_BASE } from "./apiClient";

interface TrackedEvent {
  eventType: "click" | "view";
  page: string;
  section?: string;
  metadata?: Record<string, unknown>;
}

const FLUSH_INTERVAL_MS = 4000;
const MAX_BATCH_SIZE = 50;
const GUEST_LABEL_KEY = "pw_guest_label";

let queue: TrackedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

// Per-browser, non-identifying random id - never anything real (no email,
// no name). Wrapped in try/catch: localStorage can throw in a private
// window or with blocked site data, and tracking must degrade silently
// rather than break the page.
function getGuestLabel(): string | null {
  try {
    let label = localStorage.getItem(GUEST_LABEL_KEY);
    if (!label) {
      label = `guest-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(GUEST_LABEL_KEY, label);
    }
    return label;
  } catch {
    return null;
  }
}

async function getBestEffortToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

async function flush() {
  if (queue.length === 0) return;
  const batch = queue.slice(0, MAX_BATCH_SIZE);
  queue = queue.slice(MAX_BATCH_SIZE);

  try {
    const token = await getBestEffortToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    // keepalive lets this request complete even if it's fired right as the
    // page is being navigated away from/closed - fetch supports custom
    // headers (Authorization) unlike navigator.sendBeacon, which can't.
    await fetch(`${API_BASE}/api/events/track`, {
      method: "POST",
      headers,
      body: JSON.stringify({ events: batch, guestLabel: getGuestLabel() }),
      keepalive: true
    });
  } catch {
    // Fire-and-forget - a dropped tracking batch never surfaces to the user.
  }

  if (queue.length > 0) scheduleFlush();
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_INTERVAL_MS);
}

function enqueue(event: TrackedEvent) {
  queue.push(event);
  if (queue.length >= MAX_BATCH_SIZE) {
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    flush();
  } else {
    scheduleFlush();
  }
}

export function trackClick(page: string, section: string, metadata?: Record<string, unknown>) {
  enqueue({ eventType: "click", page, section, metadata });
}

export function trackView(page: string, section: string, metadata?: Record<string, unknown>) {
  enqueue({ eventType: "view", page, section, metadata });
}

// Flushes immediately rather than waiting for the timer - call on page
// hide (visibilitychange -> "hidden") so a batch isn't silently lost if the
// user closes the tab before FLUSH_INTERVAL_MS elapses.
export function flushUiEventsNow() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  flush();
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushUiEventsNow();
  });
}

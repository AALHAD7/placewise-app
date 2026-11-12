import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { optionalAuth } from "../middleware/auth.js";
import { eventsLimiter } from "../middleware/rateLimit.js";
import { errorDetail } from "../lib/errors.js";

const router = Router();

// POST /api/events/track { events: [{ eventType, page, section, metadata }] } - the
// frontend batches individual clicks/views (src/lib/uiEvents.ts) and flushes them here
// every few seconds rather than one request per click. optionalAuth so guest sessions
// (no login) still get tracked, identified only by a client-generated guestLabel (never
// anything identifying) instead of a real user_id.
//
// Scope as of 2026-11-12: Frameworks, Q&A and Guesstimates pages only (see log.md) -
// nothing stops another page from sending events here too, but nothing else does yet.
const MAX_EVENTS_PER_BATCH = 50;
const MAX_PAGE_LEN = 200;
const MAX_SECTION_LEN = 200;
const VALID_EVENT_TYPES = new Set(["click", "view"]);

function sanitizeEvent(e) {
  if (!e || typeof e !== "object") return null;
  if (!VALID_EVENT_TYPES.has(e.eventType)) return null;
  if (typeof e.page !== "string" || !e.page.trim() || e.page.length > MAX_PAGE_LEN) return null;
  if (e.section !== undefined && e.section !== null && (typeof e.section !== "string" || e.section.length > MAX_SECTION_LEN)) return null;
  // metadata is operator-defined per call site (see uiEvents.ts) - capped by JSON.stringify
  // length rather than a fixed key allowlist, since instrumented components vary.
  let metadata = null;
  if (e.metadata !== undefined && e.metadata !== null) {
    try {
      const str = JSON.stringify(e.metadata);
      if (str.length > 2000) return null;
      metadata = e.metadata;
    } catch {
      return null;
    }
  }
  return {
    event_type: e.eventType,
    page: e.page.trim(),
    section: e.section ? e.section.trim() : null,
    metadata
  };
}

router.post("/track", optionalAuth, eventsLimiter, async (req, res) => {
  const { events, guestLabel } = req.body || {};
  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ success: false, error: "events (non-empty array) is required." });
  }
  if (events.length > MAX_EVENTS_PER_BATCH) {
    return res.status(400).json({ success: false, error: `events: too many in one batch (max ${MAX_EVENTS_PER_BATCH}).` });
  }
  if (guestLabel !== undefined && guestLabel !== null && (typeof guestLabel !== "string" || guestLabel.length > 100)) {
    return res.status(400).json({ success: false, error: "guestLabel, if given, must be a string (max 100 chars)." });
  }

  const rows = events.map(sanitizeEvent).filter(Boolean);
  if (rows.length === 0) {
    return res.status(400).json({ success: false, error: "No valid events in this batch." });
  }

  const userId = req.user?.id || null;
  const rowsWithIdentity = rows.map(r => ({
    ...r,
    user_id: userId,
    guest_label: userId ? null : (guestLabel || null)
  }));

  try {
    const { error } = await supabase.from("ui_events").insert(rowsWithIdentity);
    if (error) throw error;
    res.json({ success: true, accepted: rowsWithIdentity.length });
  } catch (err) {
    console.error("[events/track]", err);
    res.status(500).json({ success: false, error: "Failed to record events.", detail: errorDetail(err) });
  }
});

export default router;

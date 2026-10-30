import { supabase } from "../lib/supabase.js";

// Phase 1.6 item 1: minimal server-side admin gate. Self-contained (does
// its own token validation rather than chaining after requireAuth) so
// EVERY failure case - no token, an invalid token, or a valid token for a
// real but non-admin user - returns the same 404. Chaining after
// requireAuth would 401 on "no token", which still tells a prober the
// route exists and wants auth; this middleware never emits anything but a
// 404 for anyone not in ADMIN_EMAILS, by design.
//
// Admin status is decided from the real, server-validated Supabase user's
// email against ADMIN_EMAILS (server env, never sent by or trusted from the
// client) on every request - not cached onto a session flag a client could
// replay or tamper with.
function adminEmailSet() {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(404).end();

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return res.status(404).end();

  const email = (data.user.email || "").toLowerCase();
  if (!email || !adminEmailSet().has(email)) return res.status(404).end();

  req.user = data.user;
  next();
}

// Every successful admin action gets one row here (who/what/when) - fire-
// and-forget, same posture as every other best-effort log in this codebase;
// a logging failure must never block the admin action itself.
export async function logAdminAction(req, action, details = {}) {
  try {
    await supabase.from("admin_action_log").insert({
      admin_email: req.user?.email || "unknown",
      action,
      details
    });
  } catch (err) {
    console.warn(`[admin] action log failed: ${err.message}`);
  }
}

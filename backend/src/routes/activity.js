import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { errorDetail } from "../lib/errors.js";
import { getDashboard, logActivity, isValidActivityType } from "../lib/activity.js";

const router = Router();

// Backs the home page's Prep Streak / Today's Plan / Recent Activity /
// Interview Readiness widgets - all real, derived from user_activity and
// mock_interview_sessions, nothing hardcoded. See getDashboard() for what
// each number actually means and where it stops rather than guessing.
router.get("/summary", requireAuth, async (req, res) => {
  try {
    const dashboard = await getDashboard(req.user.id);
    res.json({ success: true, ...dashboard });
  } catch (err) {
    console.error("[activity/summary]", err);
    res.status(500).json({ success: false, error: "Failed to load activity summary.", detail: errorDetail(err) });
  }
});

// Explicit client-triggered logging for actions whose generation goes
// through a shared/generic backend route (tone shifting and framework
// review both go through the same chat/JSON endpoints other features use,
// so logging inside those would mislabel or over-attribute activity).
// Mock Interview, Resume Interrogation, and Story Builder log server-side
// instead, right where they already know the outcome succeeded.
router.post("/log", requireAuth, async (req, res) => {
  const { type, label } = req.body || {};
  if (!isValidActivityType(type)) {
    return res.status(400).json({ success: false, error: "Unsupported activity type." });
  }
  if (label !== undefined && (typeof label !== "string" || label.length > 200)) {
    return res.status(400).json({ success: false, error: "label, if given, must be a string (max 200 characters)." });
  }
  await logActivity(req.user.id, type, label);
  res.json({ success: true });
});

export default router;

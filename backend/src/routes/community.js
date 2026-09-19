import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { errorDetail } from "../lib/errors.js";

const router = Router();
const ALLOWED_TYPES = ["interview_qa", "case_study", "framework"];

// No list endpoint existed before — /contribute could store a submission but
// nothing could ever read it back, so the Community page had nothing real to
// show. Public/optionalAuth since browsing shared prep notes shouldn't
// require being logged in, only submitting one should.
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("community_contributions")
      .select("id, type, company, role, content, sources, status, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;

    res.json({ success: true, contributions: data || [] });
  } catch (err) {
    console.error("[community/list]", err);
    res.status(500).json({ success: false, error: "Failed to fetch contributions.", detail: errorDetail(err) });
  }
});

router.post("/contribute", requireAuth, async (req, res) => {
  const { type, company, role, content, sources } = req.body || {};

  if (!ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${ALLOWED_TYPES.join(", ")}.` });
  }
  if (!content || typeof content !== "string" || content.trim().length < 10) {
    return res.status(400).json({ error: "content (string, min 10 characters) is required." });
  }
  if (content.length > 5000) {
    return res.status(400).json({ error: "content: too long (max 5000 characters)." });
  }
  if (company !== undefined && company !== null && (typeof company !== "string" || company.length > 200)) {
    return res.status(400).json({ error: "company must be a string (max 200 characters)." });
  }
  if (role !== undefined && role !== null && (typeof role !== "string" || role.length > 200)) {
    return res.status(400).json({ error: "role must be a string (max 200 characters)." });
  }
  if (sources !== undefined && sources !== null && (!Array.isArray(sources) || sources.length > 10 || sources.some(s => typeof s !== "string" || s.length > 500))) {
    return res.status(400).json({ error: "sources must be an array of strings (max 10 items, 500 chars each)." });
  }

  try {
    const { data, error } = await supabase
      .from("community_contributions")
      .insert({
        contributor_id: req.user.id,
        type,
        company: company || null,
        role: role || null,
        content,
        sources: Array.isArray(sources) ? sources : null
      })
      .select("id")
      .single();
    if (error) throw error;

    res.json({
      success: true,
      contributionId: data.id,
      status: "pending",
      message: "Thanks! Your contribution is being verified by our community."
    });
  } catch (err) {
    console.error("[community/contribute]", err);
    res.status(500).json({ success: false, error: "Failed to submit contribution.", detail: errorDetail(err) });
  }
});

export default router;

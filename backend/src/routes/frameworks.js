import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { optionalAuth } from "../middleware/auth.js";
import { errorDetail } from "../lib/errors.js";
import { withGroundedExamples } from "../lib/frameworksGrounding.js";

const router = Router();

router.get("/", optionalAuth, async (req, res) => {
  const { role, level } = req.query;

  try {
    let query = supabase.from("frameworks").select("*");
    if (role) query = query.eq("role", role);
    if (level) query = query.eq("level", level);

    const { data, error } = await query;
    if (error) throw error;

    const frameworks = await withGroundedExamples(data || []);
    res.json({ success: true, frameworks });
  } catch (err) {
    console.error("[frameworks]", err);
    res.status(500).json({ success: false, error: "Failed to fetch frameworks.", detail: errorDetail(err) });
  }
});

export default router;

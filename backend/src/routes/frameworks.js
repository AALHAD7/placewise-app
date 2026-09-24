import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { optionalAuth } from "../middleware/auth.js";
import { errorDetail } from "../lib/errors.js";
import { withGroundedExamples } from "../lib/frameworksGrounding.js";

const router = Router();

// Pure DB read (distinct domain/subdomain pairs already in the frameworks
// table) - no AI involved, this just tells the frontend what's actually
// browsable so the Domain -> Subdomain pickers aren't hardcoded twice.
router.get("/taxonomy", optionalAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from("frameworks").select("domain, subdomain").not("domain", "is", null);
    if (error) throw error;

    const bySubdomain = new Map();
    for (const row of data || []) {
      if (!row.domain || !row.subdomain) continue;
      if (!bySubdomain.has(row.domain)) bySubdomain.set(row.domain, new Set());
      bySubdomain.get(row.domain).add(row.subdomain);
    }
    const domains = [...bySubdomain.entries()]
      .map(([domain, subdomains]) => ({ domain, subdomains: [...subdomains].sort() }))
      .sort((a, b) => a.domain.localeCompare(b.domain));

    res.json({ success: true, domains });
  } catch (err) {
    console.error("[frameworks/taxonomy]", err);
    res.status(500).json({ success: false, error: "Failed to fetch framework taxonomy.", detail: errorDetail(err) });
  }
});

router.get("/", optionalAuth, async (req, res) => {
  const { role, level, domain, subdomain } = req.query;

  try {
    let query = supabase.from("frameworks").select("*");
    if (role) query = query.eq("role", role);
    if (level) query = query.eq("level", level);
    if (domain) query = query.eq("domain", domain);
    if (subdomain) query = query.eq("subdomain", subdomain);

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

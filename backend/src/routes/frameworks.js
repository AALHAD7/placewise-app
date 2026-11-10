import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import { errorDetail } from "../lib/errors.js";
import { withGroundedExamples } from "../lib/frameworksGrounding.js";
import { buildConsultingFrameworkCatalog } from "../lib/frameworkCatalog.js";
import { answerFrameworkQuestion } from "../lib/frameworkQa.js";
import { logToGoogleSheet } from "../lib/sheetsLogger.js";

const router = Router();

// Same R7 switch as the rest of the Consulting RAG v2 work - off by default, so this
// additive endpoint has zero effect on the existing /frameworks and /taxonomy routes
// above when it's off.
const CONSULTING_RAG_V2_ENABLED = process.env.ENABLE_CONSULTING_RAG_V2 === "true";

// GET /api/frameworks/catalog?domain=Consulting - every framework actually named in a
// diagram title across the ingested club casebooks for that domain, not the static
// seeded `frameworks` table. Currently Consulting-only (the only domain R6 has
// re-ingested); any other `domain` value returns an empty catalog, not an error.
router.get("/catalog", optionalAuth, async (req, res) => {
  const { domain } = req.query;
  if (!CONSULTING_RAG_V2_ENABLED || domain !== "Consulting") {
    return res.json({ success: true, frameworks: [] });
  }
  try {
    const frameworks = await buildConsultingFrameworkCatalog();
    res.json({ success: true, frameworks });
  } catch (err) {
    console.error("[frameworks/catalog]", err);
    res.status(500).json({ success: false, error: "Failed to build the framework catalog.", detail: errorDetail(err) });
  }
});

const FALLBACK_TAXONOMY = [
  { domain: "Consulting", subdomains: ["Case Structuring", "Market Sizing & Entry", "Profitability & Growth"] },
  { domain: "Finance", subdomains: ["Corporate Finance & M&A", "Financial Statements & Accounting", "Valuation"] },
  { domain: "General Management", subdomains: ["Business Model & Strategy", "Leadership & Behavioural", "Strategy Frameworks"] },
  { domain: "HR", subdomains: ["Performance Management", "Talent & Org Design"] },
  { domain: "Marketing:Sales", subdomains: ["Branding & Positioning", "Go-to-Market", "Growth & Scaling", "Market Analysis", "Marketing Mix"] },
  { domain: "Prodman", subdomains: ["Metrics & Growth", "Prioritization", "Product Design"] }
];

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

    res.json({ success: true, domains: domains.length ? domains : FALLBACK_TAXONOMY });
  } catch (err) {
    console.error("[frameworks/taxonomy]", err);
    res.json({ success: true, domains: FALLBACK_TAXONOMY });
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

// POST /api/frameworks/ask { frameworkId, question } - the "ask a follow-up" box on the
// Frameworks page. Grounded in that one framework's own already-verified content (not a new
// casebook search) via frameworkQa.js, with the same faithfulness-judge gate the R7b
// paraphrase layer uses. requireAuth + aiLimiter, same posture as qa.js's /ask - this is a
// paid Gemini call per question, not a free DB read.
router.post("/ask", requireAuth, aiLimiter, async (req, res) => {
  const { frameworkId, question } = req.body || {};
  if (!frameworkId || typeof frameworkId !== "string") {
    return res.status(400).json({ success: false, error: "frameworkId is required." });
  }
  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ success: false, error: "A question is required." });
  }
  if (question.length > 500) {
    return res.status(400).json({ success: false, error: "question: too long (max 500 chars)." });
  }
  try {
    const { data: fw, error } = await supabase.from("frameworks").select("*").eq("id", frameworkId).single();
    if (error || !fw) return res.status(404).json({ success: false, error: "Framework not found." });

    const result = await answerFrameworkQuestion(fw, question.trim());

    const userLabel = req.user?.email || (req.user?.id ? `Guest (${req.user.id.slice(0, 8)})` : "Guest");
    logToGoogleSheet({
      sheet: "Questions Asked",
      user: userLabel,
      action: `Framework Q&A (${fw.name})`,
      item: question.trim(),
      details: result.grounded ? "Grounded in Framework" : "General Guidance"
    });

    res.json({ success: true, ...result });
  } catch (err) {
    console.error("[frameworks/ask]", err);
    res.status(500).json({ success: false, error: "Failed to answer that question.", detail: errorDetail(err) });
  }
});

export default router;

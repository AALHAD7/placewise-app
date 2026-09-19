import { Router } from "express";
import { getNews } from "../lib/news.js";
import { optionalAuth } from "../middleware/auth.js";
import { errorDetail } from "../lib/errors.js";

const router = Router();

// Backs the Home page's "Market brief" sidebar - was 5 hardcoded headlines
// under text that literally said "Updated daily". scope_type stays "domain"
// (no schema change needed - news_cache.scope_type is free text, not a DB
// enum) with a fixed scope_value/query tuned for general business/tech/AI
// news rather than reusing the generic "${domain} news India" template the
// route below builds from a user-supplied domain string.
router.get("/market", optionalAuth, async (req, res) => {
  try {
    const { articles, cached, fetchedAt } = await getNews("domain", "market-brief", "India business finance technology AI news");
    res.json({ success: true, articles, cached, fetchedAt });
  } catch (err) {
    console.error("[news/market]", err);
    res.status(500).json({ success: false, error: "Failed to fetch market news.", detail: errorDetail(err) });
  }
});

router.get("/", optionalAuth, async (req, res) => {
  const { domain } = req.query;

  if (!domain || typeof domain !== "string" || !domain.trim()) {
    return res.status(400).json({ error: "domain query param is required, e.g. /api/news?domain=fintech" });
  }
  if (domain.length > 100) {
    return res.status(400).json({ error: "domain: too long (max 100 characters)." });
  }

  try {
    const { articles, cached, fetchedAt } = await getNews("domain", domain, `${domain} news India`);
    res.json({ success: true, domain, articles, cached, fetchedAt });
  } catch (err) {
    console.error("[news]", err);
    res.status(500).json({ success: false, error: "Failed to fetch domain news.", detail: errorDetail(err) });
  }
});

export default router;

import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { getNews } from "../lib/news.js";
import { getCompanyOverview } from "../lib/companyOverview.js";
import { getCompanyRoles } from "../lib/companyRoles.js";
import { getCompanyTimeline } from "../lib/companyTimeline.js";
import { getCompanyValueChain } from "../lib/companyValueChain.js";
import { optionalAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import { errorDetail } from "../lib/errors.js";

const router = Router();

// Was: 404 if no row existed in `companies` (a table that was seeded for
// exactly 0 companies — see DECISIONS LOG, "Company + framework seed data
// deferred"). Now always returns something useful for any company name:
// a live, Gemini-generated overview (grounded in real fetched news, cached
// for days — see companyOverview.js) instead of requiring hand-authored
// seed data per company. Any real `companies`/`company_interview_questions`
// rows are still layered in as supplementary fields when they exist, so
// seeding that table later still works and is never wasted.
router.get("/:companyName", aiLimiter, optionalAuth, async (req, res) => {
  const { companyName } = req.params;
  if (companyName.length > 100) {
    return res.status(400).json({ success: false, error: "companyName: too long (max 100 characters)." });
  }
  // ilike treats % and _ as wildcards — escape them so a URL like
  // /api/companies/%25 can't turn an exact-name lookup into a broad scan.
  const escapedName = companyName.replace(/[%_]/g, m => "\\" + m);

  try {
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .ilike("name", escapedName)
      .maybeSingle();
    if (companyError) throw companyError;

    let commonQuestions = [];
    if (company) {
      const { data: questions, error: questionsError } = await supabase
        .from("company_interview_questions")
        .select("role_title, question")
        .eq("company_id", company.id);
      if (questionsError) throw questionsError;
      commonQuestions = (questions || []).map(q => ({ role: q.role_title, question: q.question }));
    }

    const overview = await getCompanyOverview(companyName);

    // Real, first-hand accounts from actual users, not AI-generated - this is
    // exactly what community_contributions exists for. No `who` identity is
    // stored anywhere in this table (anonymized by design, same as
    // helpful_questions/answer_feedback_examples), so the role/type stands in
    // for it; genuinely empty when nobody's shared one yet, not padded with
    // invented examples.
    const { data: contributions, error: contribError } = await supabase
      .from("community_contributions")
      .select("type, role, content, created_at")
      .ilike("company", escapedName)
      .neq("status", "rejected")
      .order("created_at", { ascending: false })
      .limit(5);
    if (contribError) throw contribError;

    res.json({
      success: true,
      company: {
        name: company?.name || companyName,
        industry: company?.industry || null,
        culture: company?.culture || [],
        hiringBar: company?.hiring_bar || null,
        commonQuestions,
        about: overview.about,
        facts: overview.facts,
        investments: overview.investments,
        processNote: overview.processNote,
        rounds: overview.rounds,
        overviewCached: overview.cached,
        experiences: (contributions || []).map(c => ({
          who: (c.role ? c.role + " candidate" : c.type.replace(/_/g, " ")),
          when: c.created_at,
          text: c.content
        }))
      }
    });
  } catch (err) {
    console.error("[companies/:companyName]", err);
    res.status(500).json({ success: false, error: "Failed to fetch company intel.", detail: errorDetail(err) });
  }
});

// Backs the "job role at this company" picker on the Company page - was a
// hardcoded map covering only 9 companies (see DOCUMENT.md); now works for
// any company, grounded in real web search (see companyRoles.js).
router.get("/:companyName/roles", aiLimiter, optionalAuth, async (req, res) => {
  const { companyName } = req.params;
  const trimmed = (companyName || "").trim();
  if (!trimmed || trimmed.length > 100) {
    return res.status(400).json({ success: false, error: "companyName is required (max 100 characters)." });
  }

  try {
    const { roles } = await getCompanyRoles(trimmed);
    res.json({ success: true, company: trimmed, roles });
  } catch (err) {
    console.error("[companies/:companyName/roles]", err);
    res.status(500).json({ success: false, error: "Failed to fetch company roles.", detail: errorDetail(err) });
  }
});

// History timeline (founding, acquisitions, IPO, major pivots) for the
// Company page - separate endpoint from the main overview so it can load in
// parallel rather than delaying the rest of the page (same reasoning as
// /roles being its own call), and because it needs real historical-depth web
// search (companyTimeline.js), not the recent-news context the main
// overview call uses.
router.get("/:companyName/timeline", aiLimiter, optionalAuth, async (req, res) => {
  const { companyName } = req.params;
  const trimmed = (companyName || "").trim();
  if (!trimmed || trimmed.length > 100) {
    return res.status(400).json({ success: false, error: "companyName is required (max 100 characters)." });
  }

  try {
    const { events } = await getCompanyTimeline(trimmed);
    res.json({ success: true, company: trimmed, events });
  } catch (err) {
    console.error("[companies/:companyName/timeline]", err);
    res.status(500).json({ success: false, error: "Failed to fetch company timeline.", detail: errorDetail(err) });
  }
});

// How the company actually creates/captures value, stage by stage - separate
// endpoint (same reasoning as /timeline) so it loads in parallel and can use
// its own grounded-research prompt (companyValueChain.js) rather than the
// main overview's recent-news-focused context.
router.get("/:companyName/value-chain", aiLimiter, optionalAuth, async (req, res) => {
  const { companyName } = req.params;
  const trimmed = (companyName || "").trim();
  if (!trimmed || trimmed.length > 100) {
    return res.status(400).json({ success: false, error: "companyName is required (max 100 characters)." });
  }

  try {
    const { stages } = await getCompanyValueChain(trimmed);
    res.json({ success: true, company: trimmed, stages });
  } catch (err) {
    console.error("[companies/:companyName/value-chain]", err);
    res.status(500).json({ success: false, error: "Failed to fetch company value chain.", detail: errorDetail(err) });
  }
});

router.get("/:companyName/news", optionalAuth, async (req, res) => {
  const { companyName } = req.params;
  if (companyName.length > 100) {
    return res.status(400).json({ success: false, error: "companyName: too long (max 100 characters)." });
  }

  try {
    const { articles, cached, fetchedAt } = await getNews("company", companyName, `"${companyName}"`);
    res.json({ success: true, company: companyName, articles, cached, fetchedAt });
  } catch (err) {
    console.error("[companies/:companyName/news]", err);
    res.status(500).json({ success: false, error: "Failed to fetch company news.", detail: errorDetail(err) });
  }
});

export default router;

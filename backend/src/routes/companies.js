import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { getNews } from "../lib/news.js";
import { getCompanyOverview } from "../lib/companyOverview.js";
import { getCompanyRoles } from "../lib/companyRoles.js";
import { getCompanyTimeline } from "../lib/companyTimeline.js";
import { getCompanyValueChain } from "../lib/companyValueChain.js";
import { getCompanyValueChainStageDetail } from "../lib/companyValueChainStage.js";
import { getCompanyBusinessModel } from "../lib/companyBusinessModel.js";
import { getCompanyRating, getCompanyRoleRating } from "../lib/companyRating.js";
import { getCompanyLeadership } from "../lib/companyLeadership.js";
import { getCompanyLogo } from "../lib/companyLogo.js";
import { getCompanySubsidiaries } from "../lib/companySubsidiaries.js";
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
router.get("/:companyName", optionalAuth, aiLimiter, async (req, res) => {
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
        sector: overview.sector,
        listed: overview.listed,
        listedDetail: overview.listedDetail,
        sharePrice: overview.sharePrice,
        financials: overview.financials,
        facts: overview.facts,
        investments: overview.investments,
        processNote: overview.processNote,
        rounds: overview.rounds,
        overviewSources: overview.sources,
        overviewGrounded: overview.grounded,
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
router.get("/:companyName/roles", optionalAuth, aiLimiter, async (req, res) => {
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
router.get("/:companyName/timeline", optionalAuth, aiLimiter, async (req, res) => {
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
router.get("/:companyName/value-chain", optionalAuth, aiLimiter, async (req, res) => {
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

// Detail behind a single value-chain stage - clicking a stage card on the
// Company page re-researches it specifically (its own grounded search call,
// not just re-serving the one-line summary already in company_value_chain_
// cache), and returns the real citations alongside the prose so it's
// checkable rather than asserted. See companyValueChainStage.js.
router.get("/:companyName/value-chain/:stageName", optionalAuth, aiLimiter, async (req, res) => {
  const { companyName, stageName } = req.params;
  const trimmedCompany = (companyName || "").trim();
  const trimmedStage = (stageName || "").trim();
  if (!trimmedCompany || trimmedCompany.length > 100) {
    return res.status(400).json({ success: false, error: "companyName is required (max 100 characters)." });
  }
  if (!trimmedStage || trimmedStage.length > 150) {
    return res.status(400).json({ success: false, error: "stageName is required (max 150 characters)." });
  }
  const description = (req.query.description || "").toString().slice(0, 500);

  try {
    const result = await getCompanyValueChainStageDetail(trimmedCompany, trimmedStage, description);
    res.json({ success: true, company: trimmedCompany, stage: trimmedStage, ...result });
  } catch (err) {
    console.error("[companies/:companyName/value-chain/:stageName]", err);
    res.status(500).json({ success: false, error: "Failed to fetch value chain stage detail.", detail: errorDetail(err) });
  }
});

// The Business Model Canvas (9 Osterwalder blocks) + a plain-language "how
// it actually works" walkthrough - its own on-demand endpoint (the frontend
// only calls this from the "View business model" button, not prefetched
// with the rest of the page) since it's a heavier grounded-research call
// than the others here. See companyBusinessModel.js for the accuracy
// discipline (real search grounding, gaps stated rather than invented, real
// citations returned) and asciiBmc.js for why the ASCII layout is rendered
// in code from verified structured data rather than asked of the model.
router.get("/:companyName/business-model", optionalAuth, aiLimiter, async (req, res) => {
  const { companyName } = req.params;
  const trimmed = (companyName || "").trim();
  if (!trimmed || trimmed.length > 100) {
    return res.status(400).json({ success: false, error: "companyName is required (max 100 characters)." });
  }

  try {
    const result = await getCompanyBusinessModel(trimmed);
    res.json({ success: true, company: trimmed, ...result });
  } catch (err) {
    console.error("[companies/:companyName/business-model]", err);
    res.status(500).json({ success: false, error: "Failed to fetch business model.", detail: errorDetail(err) });
  }
});

// Glassdoor-style rating - generic (company-wide) by default; the frontend
// calls the role-specific variant below once a role is also picked, rather
// than this route taking an optional role query, so each is independently
// cacheable/singleFlight-able (see companyRating.js) and the frontend can
// show the generic rating immediately while the role-specific one is still
// loading, instead of one endpoint blocking on the other.
router.get("/:companyName/rating", optionalAuth, aiLimiter, async (req, res) => {
  const { companyName } = req.params;
  const trimmed = (companyName || "").trim();
  if (!trimmed || trimmed.length > 100) {
    return res.status(400).json({ success: false, error: "companyName is required (max 100 characters)." });
  }

  try {
    const result = await getCompanyRating(trimmed);
    res.json({ success: true, company: trimmed, ...result });
  } catch (err) {
    console.error("[companies/:companyName/rating]", err);
    res.status(500).json({ success: false, error: "Failed to fetch company rating.", detail: errorDetail(err) });
  }
});

router.get("/:companyName/rating/:roleName", optionalAuth, aiLimiter, async (req, res) => {
  const { companyName, roleName } = req.params;
  const trimmedCompany = (companyName || "").trim();
  const trimmedRole = (roleName || "").trim();
  if (!trimmedCompany || trimmedCompany.length > 100) {
    return res.status(400).json({ success: false, error: "companyName is required (max 100 characters)." });
  }
  if (!trimmedRole || trimmedRole.length > 150) {
    return res.status(400).json({ success: false, error: "roleName is required (max 150 characters)." });
  }

  try {
    const result = await getCompanyRoleRating(trimmedCompany, trimmedRole);
    res.json({ success: true, company: trimmedCompany, role: trimmedRole, ...result });
  } catch (err) {
    console.error("[companies/:companyName/rating/:roleName]", err);
    res.status(500).json({ success: false, error: "Failed to fetch role rating.", detail: errorDetail(err) });
  }
});

// Real, currently-serving CXOs shown alongside "About the company" - own
// endpoint (same reasoning as /timeline, /value-chain) so it loads in
// parallel with the rest of the page. See companyLeadership.js for the
// accuracy discipline (real search grounding, a name only included when
// verifiable, no fabricated/AI-generated photos - a Wikipedia photo only
// when a real one is found and confirmed, an initials avatar otherwise).
router.get("/:companyName/leadership", optionalAuth, aiLimiter, async (req, res) => {
  const { companyName } = req.params;
  const trimmed = (companyName || "").trim();
  if (!trimmed || trimmed.length > 100) {
    return res.status(400).json({ success: false, error: "companyName is required (max 100 characters)." });
  }

  try {
    const result = await getCompanyLeadership(trimmed);
    res.json({ success: true, company: trimmed, ...result });
  } catch (err) {
    console.error("[companies/:companyName/leadership]", err);
    res.status(500).json({ success: false, error: "Failed to fetch company leadership.", detail: errorDetail(err) });
  }
});

// The company's logo, for the "Business Model" button - proxied through the
// backend (see companyLogo.js) rather than called client-side, so a slow or
// failing third-party lookup never blocks the frontend on it directly. Not
// behind aiLimiter - this doesn't call Gemini, it's a cheap keyless lookup.
router.get("/:companyName/logo", optionalAuth, async (req, res) => {
  const { companyName } = req.params;
  const trimmed = (companyName || "").trim();
  if (!trimmed || trimmed.length > 100) {
    return res.status(400).json({ success: false, error: "companyName is required (max 100 characters)." });
  }

  try {
    const result = await getCompanyLogo(trimmed);
    res.json({ success: true, company: trimmed, ...result });
  } catch (err) {
    console.error("[companies/:companyName/logo]", err);
    res.status(500).json({ success: false, error: "Failed to fetch company logo.", detail: errorDetail(err) });
  }
});

// Major/notable subsidiary or group companies (if any) - backs the Company
// page's Subsidiary picker, which gates itself off (grayed out) when this
// comes back empty. See companySubsidiaries.js: an empty array is the
// expected, common answer for a standalone company, not an error.
router.get("/:companyName/subsidiaries", optionalAuth, aiLimiter, async (req, res) => {
  const { companyName } = req.params;
  const trimmed = (companyName || "").trim();
  if (!trimmed || trimmed.length > 100) {
    return res.status(400).json({ success: false, error: "companyName is required (max 100 characters)." });
  }

  try {
    const result = await getCompanySubsidiaries(trimmed);
    res.json({ success: true, company: trimmed, ...result });
  } catch (err) {
    console.error("[companies/:companyName/subsidiaries]", err);
    res.status(500).json({ success: false, error: "Failed to fetch company subsidiaries.", detail: errorDetail(err) });
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

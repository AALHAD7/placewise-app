import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import { errorDetail } from "../lib/errors.js";
import { resolveRoleTitle } from "../lib/roles.js";
import { getRoleOverview, getRoleOverviewAtCompany } from "../lib/roleOverview.js";
import { getRoleTopics } from "../lib/roleTopics.js";
import { getRoleCompanyTopicNotes } from "../lib/roleCompanyTopicNotes.js";
import { getChipPanel } from "../lib/chipPanel.js";

const router = Router();

// Overview card (what/companies/salary/skills/exits) for the "Role" tab.
// roleName can be any typed text - generated and cached directly for
// whatever the user typed (same approach as company overviews), NOT snapped
// to a canonical role. It used to research/generate for resolveRoleTitle's
// nearest-canonical-match instead, which meant a role outside the curated 50
// (e.g. "Sales Associate") got an overview describing a different role
// entirely (e.g. "A Business Development Manager...") while the page still
// showed the user's own typed title as the heading - a visible mismatch a
// user flagged directly. Topics (below) still uses the canonical match, for
// the curriculum-quality/consistency reasons already decided there.
// Optional ?company= tailors the whole card to that role AT that company
// specifically (see getRoleOverviewAtCompany) instead of the role-wide
// version - "companies" (who hires, plural) is replaced by "process" (that
// company's interview rounds for this role) in that mode, since a single
// company is already fixed. Same free-text-whatever-was-typed treatment as
// the role-only path.
router.get("/:roleName", optionalAuth, aiLimiter, async (req, res) => {
  const { roleName } = req.params;
  const trimmed = (roleName || "").trim();
  if (!trimmed || trimmed.length > 100) {
    return res.status(400).json({ success: false, error: "roleName is required (max 100 characters)." });
  }
  const company = (req.query.company || "").toString().trim();
  if (company && company.length > 100) {
    return res.status(400).json({ success: false, error: "company, if given, must be at most 100 characters." });
  }

  try {
    if (company) {
      const overview = await getRoleOverviewAtCompany(trimmed, company);
      return res.json({
        success: true,
        role: {
          requestedTitle: trimmed,
          company,
          what: overview.what,
          process: overview.process,
          salary: overview.salary,
          salaryNote: overview.salaryNote,
          skills: overview.skills,
          careerProgression: overview.careerProgression,
          exitOpportunities: overview.exitOpportunities,
          sources: overview.sources,
          hasTrustedSource: overview.hasTrustedSource,
          hasSupportingSource: overview.hasSupportingSource,
          fetchedAt: overview.fetchedAt
        }
      });
    }

    const overview = await getRoleOverview(trimmed);
    res.json({
      success: true,
      role: {
        requestedTitle: trimmed,
        what: overview.what,
        companies: overview.companies,
        salary: overview.salary,
        salaryNote: overview.salaryNote,
        skills: overview.skills,
        careerProgression: overview.careerProgression,
        exitOpportunities: overview.exitOpportunities,
        sources: overview.sources,
        hasTrustedSource: overview.hasTrustedSource,
        hasSupportingSource: overview.hasSupportingSource,
        fetchedAt: overview.fetchedAt
      }
    });
  } catch (err) {
    console.error("[roles/:roleName]", err);
    res.status(500).json({ success: false, error: "Failed to fetch role info.", detail: errorDetail(err) });
  }
});

// Deep interview-prep curriculum (topics/frameworks/model answers/pitfalls/
// practice prompts/company notes) - separate from the overview above since
// it's a much larger generation; fetched independently so the overview can
// render first without waiting on it.
router.get("/:roleName/topics", optionalAuth, aiLimiter, async (req, res) => {
  const { roleName } = req.params;
  const trimmed = (roleName || "").trim();
  if (!trimmed || trimmed.length > 100) {
    return res.status(400).json({ success: false, error: "roleName is required (max 100 characters)." });
  }

  try {
    const matchedRole = await resolveRoleTitle(trimmed);
    const { topics, groundedInCasebooks, citations } = await getRoleTopics(matchedRole);
    res.json({ success: true, matchedRole, topics, groundedInCasebooks, citations });
  } catch (err) {
    console.error("[roles/:roleName/topics]", err);
    res.status(500).json({ success: false, error: "Failed to fetch role topics.", detail: errorDetail(err) });
  }
});

// "How this shows up by company" (Phase 1 amendment C) - separate from the
// topics call, keyed by (role, company), hidden entirely when casebook RAG
// has nothing real to say about this company (see roleCompanyTopicNotes.js).
router.get("/:roleName/company-notes", optionalAuth, aiLimiter, async (req, res) => {
  const { roleName } = req.params;
  const trimmed = (roleName || "").trim();
  if (!trimmed || trimmed.length > 100) {
    return res.status(400).json({ success: false, error: "roleName is required (max 100 characters)." });
  }
  const company = (req.query.company || "").toString().trim();
  if (!company || company.length > 100) {
    return res.status(400).json({ success: false, error: "company is required (max 100 characters)." });
  }
  const topicsParam = (req.query.topics || "").toString();
  const topicNames = topicsParam.split("|").map(t => t.trim()).filter(Boolean);
  if (!topicNames.length) {
    return res.status(400).json({ success: false, error: "topics (pipe-separated topic names) is required." });
  }

  try {
    const matchedRole = await resolveRoleTitle(trimmed);
    const { notes, citations } = await getRoleCompanyTopicNotes(matchedRole, company, topicNames);
    res.json({ success: true, notes, citations });
  } catch (err) {
    console.error("[roles/:roleName/company-notes]", err);
    res.status(500).json({ success: false, error: "Failed to fetch company notes.", detail: errorDetail(err) });
  }
});

// Chip panels (What?/Why?/How to apply) - Phase 1 amendment D. The prompt
// text itself is still built client-side (frontend/src/lib/prompts.ts owns
// the tuned wording), but caching and generation happen here so the cache
// is shared across every user instead of living in one browser's
// localStorage. company is deliberately not part of the request/key - see
// prompts.ts's whatPrompt/whyPrompt/howPrompt header.
router.post("/chip-panel", optionalAuth, aiLimiter, async (req, res) => {
  const { role, topic, blockId, mode, prompt } = req.body || {};
  if (!role || !topic || !blockId || !mode || !prompt) {
    return res.status(400).json({ success: false, error: "role, topic, blockId, mode and prompt are all required." });
  }
  if (!["what", "why", "how"].includes(mode)) {
    return res.status(400).json({ success: false, error: "mode must be one of: what, why, how." });
  }
  if (String(prompt).length > 4000) {
    return res.status(400).json({ success: false, error: "prompt: too long (max 4000 characters)." });
  }

  try {
    const result = await getChipPanel({ role, topic, blockId, mode, prompt });
    res.json({ success: true, ...result }); // includes groundedInCasebooks/citation (see chipPanel.js)
  } catch (err) {
    console.error("[roles/chip-panel]", err);
    res.status(500).json({ success: false, error: "Failed to generate panel.", detail: errorDetail(err) });
  }
});

export default router;

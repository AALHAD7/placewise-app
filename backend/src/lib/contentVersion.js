// Bumped whenever a Role/Skill-page generation prompt changes materially -
// every cache reader below treats a stored row whose content_version
// doesn't match this as "not fresh" (same code path as TTL expiry), so a
// bump regenerates content for every user without a destructive migration.
// Bumped to "2" for the Phase 1 content-accuracy audit (ROLE CONTENT RULES
// prepended to every prompt, companyNotes removed from the topics call,
// company-grounding removed from the What/Why/How chip prompts). Bumped to
// "3" for Phase 1.5 (rules 2/4/8 generalized across all 10 domains, the
// 5-flag content check, career progression/exit opportunities split,
// source-quality tiers).
export const CONTENT_VERSION = "3";

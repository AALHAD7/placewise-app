import { Router } from "express";
import { generateJSON } from "../lib/gemini.js";
import { optionalAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import { supabase } from "../lib/supabase.js";
import { errorDetail } from "../lib/errors.js";

const router = Router();

// Same 10 domains as the Tone Shifter dropdown (frontend/src/pages/
// ToneShifterPage.tsx) - one domain list for the whole app rather than a
// second, possibly-drifting copy.
const DOMAINS = [
  "Consulting", "Product Management", "Finance and Banking", "Marketing",
  "Sales and Business Development", "Operations and Supply Chain", "Data and Analytics",
  "IT and Technology", "Human Resources", "General Management"
];

// Every task the model proposes must land on a page that actually exists -
// an invalid/hallucinated section name is replaced with "Frameworks" (see
// validateDays below), never shown as a dead link.
const SECTION_ROUTES = {
  "Role": "/role",
  "Company": "/company",
  "Frameworks": "/frameworks",
  "Resume Drill": "/resume",
  "Story Builder": "/resume?mode=story",
  "Tone Shifter": "/tone-shifter",
  "Mock Interview": "/mock-interview",
  "Community": "/community"
};
const VALID_SECTIONS = Object.keys(SECTION_ROUTES);
const PLAN_DAYS = 3;

const SYSTEM_PROMPT = `You build short, concrete interview-prep plans for Indian B-school placement candidates.

Respond with ONLY JSON, no markdown fences, no commentary, in exactly this shape:
{"days":[{"day":1,"focus":"<one short line>","tasks":[{"title":"<one short line>","section":"<one of: ${VALID_SECTIONS.join(", ")}>","minutes":<integer 10-60>}]}]}

Rules:
- Exactly ${PLAN_DAYS} days, numbered 1..${PLAN_DAYS}.
- 2-4 tasks per day.
- "section" must be exactly one of the listed names - do not invent a page.
- Tasks should build toward the stated interview date: earlier days cover groundwork (role/company/framework research), later days shift toward live practice (Resume Drill, Mock Interview).
- Total daily task minutes should roughly match the stated hours-per-day budget.
- No fabricated company facts - task titles describe what to DO ("Research Goldman Sachs' recent deals"), not invented information about the company.`;

function validateDays(parsed) {
  if (!parsed || !Array.isArray(parsed.days)) throw new Error("Model did not return a days array.");
  return parsed.days.slice(0, PLAN_DAYS).map((d, i) => ({
    day: i + 1,
    focus: typeof d.focus === "string" ? d.focus.slice(0, 200) : "",
    tasks: (Array.isArray(d.tasks) ? d.tasks : []).slice(0, 6).map(t => ({
      title: typeof t.title === "string" ? t.title.slice(0, 200) : "Prep task",
      section: VALID_SECTIONS.includes(t.section) ? t.section : "Frameworks",
      minutes: Number.isFinite(t.minutes) ? Math.min(Math.max(Math.round(t.minutes), 5), 120) : 20
    }))
  }));
}

router.post("/generate", optionalAuth, aiLimiter, async (req, res) => {
  const { targetRole, domain, interviewDate, hoursPerDay } = req.body || {};

  if (!targetRole || typeof targetRole !== "string" || targetRole.trim().length < 2 || targetRole.length > 150) {
    return res.status(400).json({ success: false, error: "targetRole (string, 2-150 chars) is required." });
  }
  if (!DOMAINS.includes(domain)) {
    return res.status(400).json({ success: false, error: `domain must be one of: ${DOMAINS.join(", ")}.` });
  }
  const parsedDate = new Date(interviewDate);
  if (!interviewDate || Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ success: false, error: "interviewDate must be a valid date." });
  }
  const todayMidnight = new Date();
  todayMidnight.setUTCHours(0, 0, 0, 0);
  if (parsedDate < todayMidnight) {
    return res.status(400).json({ success: false, error: "interviewDate must be in the future." });
  }
  const hours = Number(hoursPerDay);
  if (!Number.isFinite(hours) || hours < 1 || hours > 6) {
    return res.status(400).json({ success: false, error: "hoursPerDay must be a number between 1 and 6." });
  }

  try {
    const daysUntil = Math.max(1, Math.ceil((parsedDate - todayMidnight) / 86400000));
    const prompt = `Target role: ${targetRole}\nDomain: ${domain}\nInterview is in ${daysUntil} day(s) (${interviewDate}).\nAvailable prep time: ${hours} hour(s) per day.`;

    const parsed = await generateJSON({ system: SYSTEM_PROMPT, prompt, maxTokens: 1500 });
    const days = validateDays(parsed);

    // req.user is truthy for a guest too - an anonymous Supabase session is
    // still a real, signed-in auth.users row here (see AuthContext.tsx's
    // isGuest check). Only a genuinely signed-in (non-anonymous) user gets
    // the plan saved, matching "Guests: show the plan, plus a note" in the
    // spec - saving a guest's plan under their throwaway 3-hour identity
    // would just be a row nobody can ever read back.
    const isRealUser = req.user && !req.user.is_anonymous;
    if (isRealUser) {
      const { error } = await supabase
        .from("user_plans")
        .upsert({
          user_id: req.user.id,
          target_role: targetRole.trim(),
          domain,
          interview_date: interviewDate,
          hours_per_day: hours,
          days,
          created_at: new Date().toISOString()
        });
      if (error) throw error;
    }

    res.json({ success: true, days, saved: !!isRealUser, sectionRoutes: SECTION_ROUTES });
  } catch (err) {
    console.error("[plan/generate]", err);
    res.status(500).json({ success: false, error: "Failed to generate your plan.", detail: errorDetail(err) });
  }
});

router.get("/current", optionalAuth, async (req, res) => {
  if (!req.user || req.user.is_anonymous) return res.json({ success: true, plan: null, sectionRoutes: SECTION_ROUTES });
  try {
    const { data, error } = await supabase
      .from("user_plans")
      .select("target_role, domain, interview_date, hours_per_day, days, created_at")
      .eq("user_id", req.user.id)
      .maybeSingle();
    if (error) throw error;
    res.json({ success: true, plan: data || null, sectionRoutes: SECTION_ROUTES });
  } catch (err) {
    console.error("[plan/current]", err);
    res.status(500).json({ success: false, error: "Failed to load your plan.", detail: errorDetail(err) });
  }
});

export default router;

import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAdmin, logAdminAction } from "../middleware/admin.js";
import { adminLimiter } from "../middleware/rateLimit.js";
import { errorDetail } from "../lib/errors.js";

const router = Router();

// Every /api/admin/* route: requireAdmin first (self-contained token
// validation + admin-email check, 404s on any failure - see
// middleware/admin.js for why it doesn't chain after requireAuth), then
// adminLimiter only runs for requests that already got past the gate.
router.use(requireAdmin, adminLimiter);

function todayStart() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

// Daily LLM calls by feature + call type, today (UTC). Grouped in code, not
// SQL - this table has no admin-facing RPC yet and the row count at current
// scale doesn't need one.
router.get("/usage", async (req, res) => {
  try {
    const since = todayStart();

    const { data: calls, error: callsErr } = await supabase
      .from("llm_call_log")
      .select("feature, call_type, key_source")
      .gte("created_at", since);
    if (callsErr) throw callsErr;

    const byFeature = {};
    for (const c of calls || []) {
      const key = `${c.feature}::${c.call_type}`;
      byFeature[key] = (byFeature[key] || 0) + 1;
    }
    const callsByFeature = Object.entries(byFeature)
      .map(([key, count]) => {
        const [feature, callType] = key.split("::");
        return { feature, callType, count };
      })
      .sort((a, b) => b.count - a.count);

    // Always "platform" today - this app has no per-user BYOK key concept,
    // confirmed by reading lib/supabase.js and every generate* call site.
    // Reported honestly as the one real value rather than a fabricated
    // platform/byok split.
    const keySource = { platform: calls?.length || 0, byok: 0 };

    const { data: escalations, error: escErr } = await supabase
      .from("model_escalation_log")
      .select("feature, created_at")
      .gte("created_at", since);
    if (escErr) throw escErr;

    const { data: alerts, error: alertsErr } = await supabase
      .from("admin_alerts")
      .select("*")
      .eq("acknowledged", false)
      .order("created_at", { ascending: false });
    if (alertsErr) throw alertsErr;

    res.json({
      success: true,
      callsByFeature,
      totalCallsToday: calls?.length || 0,
      keySource,
      escalationsToday: escalations?.length || 0,
      escalationsByFeature: Object.entries(
        (escalations || []).reduce((acc, e) => { acc[e.feature] = (acc[e.feature] || 0) + 1; return acc; }, {})
      ).map(([feature, count]) => ({ feature, count })),
      openAlerts: alerts || []
    });
  } catch (err) {
    console.error("[admin/usage]", err);
    res.status(500).json({ success: false, error: "Failed to load usage.", detail: errorDetail(err) });
  }
});

const ENGAGEMENT_DEFAULT_WINDOW_HOURS = 24 * 7;
const ENGAGEMENT_MAX_WINDOW_HOURS = 24 * 90;
const ENGAGEMENT_DEFAULT_TOP_N = 15;
const ENGAGEMENT_PAGE_SIZE = 1000;

// ui_events can exceed Supabase's default row cap for a week-long window at any real
// traffic, so page through it the same way scripts/rollupUiEvents.js's fetchAllEvents
// does, rather than relying on a single .select() to return everything.
async function fetchAllUiEvents(since) {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("ui_events")
      .select("event_type, page, section, created_at")
      .gte("created_at", since)
      .range(from, from + ENGAGEMENT_PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < ENGAGEMENT_PAGE_SIZE) break;
    from += ENGAGEMENT_PAGE_SIZE;
  }
  return rows;
}

// Live replacement for the manual rollupUiEvents.js -> Google Sheets snapshot, for the
// one purpose of letting Aalhad check engagement without running a script by hand. That
// script and its Sheets tab keep existing as-is for whatever else depends on them; this
// is a separate, read-only view over the same ui_events rows. Grouped in JS, not SQL,
// same reasoning as /usage above: no RPC for this table, and current scale doesn't need one.
router.get("/engagement", async (req, res) => {
  try {
    let windowHours = Number(req.query.windowHours) || ENGAGEMENT_DEFAULT_WINDOW_HOURS;
    if (!Number.isFinite(windowHours) || windowHours <= 0) windowHours = ENGAGEMENT_DEFAULT_WINDOW_HOURS;
    windowHours = Math.min(windowHours, ENGAGEMENT_MAX_WINDOW_HOURS);

    let topN = Number(req.query.topN) || ENGAGEMENT_DEFAULT_TOP_N;
    if (!Number.isFinite(topN) || topN <= 0) topN = ENGAGEMENT_DEFAULT_TOP_N;
    topN = Math.min(topN, 100);

    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
    const events = await fetchAllUiEvents(since);

    // topClicks / topViews: group by event_type + page + section, same ranking logic as
    // rollupUiEvents.js. A null/empty section collapses to a literal label so it groups
    // with itself instead of breaking the key.
    const rankCounts = new Map(); // `${event_type}|${page}|${section}` -> count
    const byPageCounts = new Map(); // page -> count
    const dailyCounts = new Map(); // "YYYY-MM-DD" -> { clicks, views }

    for (const e of events) {
      const section = e.section && e.section.trim() ? e.section : "(no section)";
      const rankKey = `${e.event_type}|${e.page}|${section}`;
      rankCounts.set(rankKey, (rankCounts.get(rankKey) || 0) + 1);

      byPageCounts.set(e.page, (byPageCounts.get(e.page) || 0) + 1);

      const date = e.created_at.slice(0, 10); // UTC calendar day (timestamptz stored/returned as ISO UTC)
      const day = dailyCounts.get(date) || { clicks: 0, views: 0 };
      if (e.event_type === "click") day.clicks += 1;
      else if (e.event_type === "view") day.views += 1;
      dailyCounts.set(date, day);
    }

    const ranked = [...rankCounts.entries()].map(([key, count]) => {
      const [eventType, page, section] = key.split("|");
      return { eventType, page, section, count };
    });

    const topClicks = ranked
      .filter(r => r.eventType === "click")
      .sort((a, b) => b.count - a.count)
      .slice(0, topN)
      .map(({ page, section, count }) => ({ page, section, count }));
    const topViews = ranked
      .filter(r => r.eventType === "view")
      .sort((a, b) => b.count - a.count)
      .slice(0, topN)
      .map(({ page, section, count }) => ({ page, section, count }));

    const byPage = [...byPageCounts.entries()]
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count);

    const dailyTotals = [...dailyCounts.entries()]
      .map(([date, { clicks, views }]) => ({ date, clicks, views }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      windowHours,
      generatedAt: new Date().toISOString(),
      totalEvents: events.length,
      topClicks,
      topViews,
      byPage,
      dailyTotals
    });
  } catch (err) {
    console.error("[admin/engagement]", err);
    res.status(500).json({ success: false, error: "Failed to load engagement data.", detail: errorDetail(err) });
  }
});

const QUESTIONS_PAGE_SIZE = 1000;
const QUESTIONS_RECENT_DEFAULT = 50;
const QUESTIONS_RECENT_MAX = 500;
const VALID_QUESTION_SOURCES = new Set(["framework", "qa", "guesstimate"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// question_log can exceed Supabase's default row cap over time, same reasoning as
// fetchAllUiEvents above - page through it rather than relying on a single .select().
async function fetchAllQuestionLogRows(select, filters = {}) {
  const rows = [];
  let from = 0;
  while (true) {
    let query = supabase.from("question_log").select(select);
    if (filters.frameworkId) query = query.eq("framework_id", filters.frameworkId);
    if (filters.source) query = query.eq("source", filters.source);
    query = query.range(from, from + QUESTIONS_PAGE_SIZE - 1);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...data);
    if (data.length < QUESTIONS_PAGE_SIZE) break;
    from += QUESTIONS_PAGE_SIZE;
  }
  return rows;
}

// GET /api/admin/questions?frameworkId=&source= - structured view over question_log
// (migration_053), the second, additive write alongside the existing Google Sheets
// logging at Frameworks ask-a-follow-up, standalone Q&A and Guesstimates'
// ask-the-interviewer box. byFramework ranks "which framework gets the most questions"
// (source='framework' only); recent is the raw browsable feed across all sources, newest
// first, optionally filtered to one framework and/or one source.
router.get("/questions", async (req, res) => {
  try {
    const { frameworkId, source } = req.query;
    if (source !== undefined && !VALID_QUESTION_SOURCES.has(source)) {
      return res.status(400).json({ success: false, error: "source must be one of: framework, qa, guesstimate." });
    }
    // framework_id is a uuid column - an unvalidated non-uuid string would hit Postgres's
    // own 22P02 error and surface as a generic 500 instead of a clean empty/400 response.
    if (frameworkId !== undefined && !UUID_RE.test(frameworkId)) {
      return res.status(400).json({ success: false, error: "frameworkId must be a valid uuid." });
    }

    // byFramework: always computed from ALL source='framework' rows (ignoring the
    // `source` filter, which wouldn't make sense against this view), then narrowed to
    // one row if frameworkId is given - matches the task's "filters BOTH views" contract.
    const frameworkRows = await fetchAllQuestionLogRows(
      "framework_id, framework_name, domain, subdomain",
      { source: "framework" }
    );

    const byFrameworkCounts = new Map(); // framework_id -> { frameworkName, domain, subdomain, count }
    for (const r of frameworkRows) {
      if (!r.framework_id) continue;
      const existing = byFrameworkCounts.get(r.framework_id) || {
        frameworkId: r.framework_id,
        frameworkName: r.framework_name,
        domain: r.domain,
        subdomain: r.subdomain,
        count: 0
      };
      existing.count += 1;
      byFrameworkCounts.set(r.framework_id, existing);
    }

    let byFramework = [...byFrameworkCounts.values()].sort((a, b) => b.count - a.count);
    if (frameworkId) {
      byFramework = byFramework.filter((r) => r.frameworkId === frameworkId);
    }

    let recentLimit = Number(req.query.limit) || QUESTIONS_RECENT_DEFAULT;
    if (!Number.isFinite(recentLimit) || recentLimit <= 0) recentLimit = QUESTIONS_RECENT_DEFAULT;
    recentLimit = Math.min(recentLimit, QUESTIONS_RECENT_MAX);

    let recentQuery = supabase
      .from("question_log")
      .select("id, source, framework_id, framework_name, question, grounded, created_at")
      .order("created_at", { ascending: false })
      .limit(recentLimit);
    if (frameworkId) recentQuery = recentQuery.eq("framework_id", frameworkId);
    if (source) recentQuery = recentQuery.eq("source", source);

    const { data: recentRows, error: recentErr } = await recentQuery;
    if (recentErr) throw recentErr;

    const recent = (recentRows || []).map((r) => ({
      id: r.id,
      source: r.source,
      frameworkName: r.framework_name,
      question: r.question,
      grounded: r.grounded,
      createdAt: r.created_at
    }));

    res.json({ success: true, byFramework, recent });
  } catch (err) {
    console.error("[admin/questions]", err);
    res.status(500).json({ success: false, error: "Failed to load question log.", detail: errorDetail(err) });
  }
});

// Frontend's only way to know if the logged-in user is an admin, so the admin nav link
// can be shown/hidden correctly instead of requiring Aalhad to type /admin by hand.
// No body beyond success - requireAdmin above already did the real work (token validation
// + ADMIN_EMAILS check, bare 404 on any failure); this route just needs to exist and 200.
router.get("/whoami", (req, res) => {
  res.json({ success: true });
});

router.post("/alerts/:id/resolve", async (req, res) => {
  try {
    const { error } = await supabase.from("admin_alerts").update({ acknowledged: true }).eq("id", req.params.id);
    if (error) throw error;
    await logAdminAction(req, "resolve_alert", { alertId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error("[admin/alerts/resolve]", err);
    res.status(500).json({ success: false, error: "Failed to resolve alert.", detail: errorDetail(err) });
  }
});

export default router;

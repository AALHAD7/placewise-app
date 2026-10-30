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

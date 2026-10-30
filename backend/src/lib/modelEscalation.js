import { supabase } from "./supabase.js";
import { GENERATION_MODELS, MAX_CASCADE_TIER } from "./gemini.js";

// Phase 1.5 item 5. Called from the (only) two call sites allowed to pass
// `allowEscalation: true` to generateJSON/generateText - logs only the
// calls that actually NEEDED a model beyond the flash-lite cap (the lite
// tier was exhausted/unavailable), not every escalation-eligible call.
const DAILY_ALERT_THRESHOLD = 50;

export async function logEscalationIfNeeded(modelUsed, feature, callType) {
  const tierIndex = GENERATION_MODELS.indexOf(modelUsed);
  if (tierIndex < MAX_CASCADE_TIER) return; // stayed within the lite cap - nothing to log
  try {
    const { error: insertError } = await supabase
      .from("model_escalation_log")
      .insert({ from_model: GENERATION_MODELS[0], to_model: modelUsed, feature, call_type: callType });
    if (insertError) throw insertError;

    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    const { count, error: countError } = await supabase
      .from("model_escalation_log")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since.toISOString());
    if (countError) throw countError;

    // Fires exactly once per day, at the moment the count crosses the
    // threshold - not on every escalation after it.
    if (count === DAILY_ALERT_THRESHOLD) {
      await supabase.from("admin_alerts").insert({
        kind: "model_escalation",
        message: `${count} model-cascade escalations today (threshold ${DAILY_ALERT_THRESHOLD}).`
      });
    }
  } catch (err) {
    console.warn(`[modelEscalation] log failed: ${err.message}`);
  }
}

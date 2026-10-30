import { supabase } from "./supabase.js";

// Phase 1.6 item 1: logs every generateText/generateJSON/generateGroundedText
// call (not just escalations - see modelEscalation.js for that narrower
// log), feeding the admin Usage page's "daily LLM calls by feature and call
// type" view. Fire-and-forget - a logging failure must never affect the
// actual generation call it's logging.
//
// `feature` is auto-inferred from the call stack when a caller doesn't pass
// one explicitly, rather than requiring every one of the ~20 AI-backed
// routes/libs in this app to be individually retrofitted with a feature tag
// just for this. Walks past this file and gemini.js itself to the first
// real caller frame and uses its filename - "roleOverview.js",
// "resume.js", etc. Good enough for a usage breakdown; not meant to be
// perfectly precise for a caller several frames removed from the actual
// business logic (e.g. a shared helper).
function inferFeature() {
  const stack = new Error().stack || "";
  const lines = stack.split("\n").slice(1);
  for (const line of lines) {
    const match = line.match(/([a-zA-Z0-9_.-]+\.js):\d+:\d+/);
    if (!match) continue;
    const file = match[1];
    if (file === "gemini.js" || file === "llmCallLog.js") continue;
    return file;
  }
  return "unknown";
}

export function logLlmCall(callType, model, feature) {
  const resolvedFeature = feature || inferFeature();
  // Not awaited by callers - genuinely fire-and-forget, logging must never
  // add latency to the real request.
  supabase
    .from("llm_call_log")
    .insert({ feature: resolvedFeature, call_type: callType, model, key_source: "platform" })
    .then(({ error }) => {
      if (error) console.warn(`[llmCallLog] insert failed: ${error.message}`);
    });
}

// Structured, queryable record of questions students actually ask - a second, additive
// write alongside the existing Google Sheets logging (sheetsLogger.js) at the three call
// sites that have one (Frameworks ask-a-follow-up, standalone Q&A, Guesstimates'
// ask-the-interviewer box). See migration_053_question_log.sql. Read by
// GET /api/admin/questions.
//
// Fire-and-forget, same posture as logToGoogleSheet: never throws, never slows down or
// breaks the real user-facing response if the insert fails.
import { supabase } from "./supabase.js";

export function logQuestion({
  source,
  question,
  frameworkId = null,
  frameworkName = null,
  domain = null,
  subdomain = null,
  grounded = null,
  userLabel = null
}) {
  supabase
    .from("question_log")
    .insert({
      source,
      question,
      framework_id: frameworkId,
      framework_name: frameworkName,
      domain,
      subdomain,
      grounded,
      user_label: userLabel
    })
    .then(({ error }) => {
      if (error) console.error("[questionLog]", error);
    })
    .catch((err) => {
      console.error("[questionLog]", err);
    });
}

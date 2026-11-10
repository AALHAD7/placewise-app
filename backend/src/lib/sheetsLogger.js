// Live analytics integration with Google Sheets via Apps Script Webhook.
// Fire-and-forget: every call is completely asynchronous, never throws, and never
// slows down client requests.

const GOOGLE_SHEETS_WEBHOOK_URL =
  process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
  "https://script.google.com/macros/s/AKfycbyM1Q_a6saGhAaLLCktOSwjnmsgm4MdYOS4gzz2dC1GONy0oNJvzE6TIbOcDFkIVUFZxQ/exec";

/**
 * Log an event to Google Sheets.
 * Appends to both "All Activity" (live stream) and the specific category sheet.
 *
 * @param {Object} opts
 * @param {string} [opts.sheet] - Category sheet name e.g. "Companies", "Frameworks", "Resume Drills", "Guesstimates"
 * @param {string} [opts.user] - User email, name, or Guest identifier
 * @param {string} [opts.action] - Action label e.g. "Viewed Company", "Practiced Framework", "Uploaded Resume"
 * @param {string} [opts.item] - The entity name e.g. "Deloitte", "Porter's 5 Forces"
 * @param {string} [opts.details] - Any extra context or metadata
 */
export function logToGoogleSheet({
  sheet = "All Activity",
  user = "Guest",
  action = "",
  item = "",
  details = ""
} = {}) {
  if (!GOOGLE_SHEETS_WEBHOOK_URL) return;

  const send = (targetSheet) => {
    fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        sheet: targetSheet,
        user,
        action,
        item,
        details
      })
    }).catch(() => {
      // Fire-and-forget; never bubble up logging errors
    });
  };

  // 1. Always append to the unified "All Activity" chronological stream
  send("All Activity");

  // 2. If a specific category sheet was specified, append there as well
  if (sheet && sheet !== "All Activity") {
    send(sheet);
  }
}


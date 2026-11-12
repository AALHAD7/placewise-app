// Computes unique visitors for one completed UTC calendar day from ui_events
// (migration_051) and logs one row to the "Daily Unique Users" Google Sheets
// tab. Meant to run once a day shortly after midnight UTC (see Render Cron
// Job setup, log.md) so it always computes the PREVIOUS full day, not a
// still-in-progress one - running it at 23:55 instead would undercount
// anyone who visits in the last few minutes of the day.
//
// "Unique visitor" = distinct (user_id if logged in, else guest_label for
// an anonymous session) seen in ui_events that day. This only counts
// sessions that fired at least one tracked event - every page load does,
// via AppShell.tsx's page-view effect (added 2026-11-13 specifically so
// this rollup has a true site-wide signal, not just the 3 originally-
// instrumented pages). A guest who later logs in during the same day is
// counted twice (once per identity) - no way to merge those without
// something identifying, which this deliberately never collects.
//
// Usage: node scripts/dailyUniqueUsers.js [YYYY-MM-DD]  (defaults to yesterday, UTC)
import "dotenv/config";
import { supabase } from "../src/lib/supabase.js";
import { logToGoogleSheet } from "../src/lib/sheetsLogger.js";

function utcDayBounds(dateStr) {
  const start = dateStr ? new Date(`${dateStr}T00:00:00.000Z`) : (() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  })();
  if (Number.isNaN(start.getTime())) throw new Error(`Invalid date: ${dateStr}`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end, dayKey: start.toISOString().slice(0, 10) };
}

async function fetchAllIdentities(start, end) {
  const identities = new Set();
  const PAGE_SIZE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("ui_events")
      .select("user_id, guest_label")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    for (const r of data) {
      const identity = r.user_id ? `user:${r.user_id}` : (r.guest_label ? `guest:${r.guest_label}` : null);
      if (identity) identities.add(identity);
    }
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return identities;
}

async function main() {
  const { start, end, dayKey } = utcDayBounds(process.argv[2]);
  const identities = await fetchAllIdentities(start, end);
  const userCount = [...identities].filter(i => i.startsWith("user:")).length;
  const guestCount = [...identities].filter(i => i.startsWith("guest:")).length;

  console.log(`[dailyUniqueUsers] ${dayKey} (UTC): ${identities.size} unique visitors (${userCount} logged-in, ${guestCount} guest-only).`);

  logToGoogleSheet({
    sheet: "Daily Unique Users",
    user: "System",
    action: dayKey,
    item: String(identities.size),
    details: `${userCount} logged-in, ${guestCount} guest-only | computed ${new Date().toISOString()}`
  });

  // logToGoogleSheet is fire-and-forget - give it a moment before exit.
  await new Promise(r => setTimeout(r, 3000));
  console.log("[dailyUniqueUsers] Done.");
}

main().catch(err => {
  console.error("[dailyUniqueUsers] Failed:", err);
  process.exitCode = 1;
});

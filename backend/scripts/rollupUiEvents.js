// Reads raw click/view events from ui_events (migration_051) and pushes a
// human-readable top-N summary to the "Engagement" Google Sheets tab - the
// raw per-click rows stay in Supabase (queryable later), only a ranked
// rollup goes to Sheets, since thousands of individual click rows would be
// unreadable there (Aalhad's call, 2026-11-12).
//
// Each run appends one dated snapshot (top N most-clicked, top N
// most-viewed, for the given time window) rather than maintaining a live
// pivot - sheetsLogger.js only supports appending rows, so running this on
// a schedule (cron, or manually) builds a history of snapshots over time,
// each one labelled with its own window.
//
// Usage: node scripts/rollupUiEvents.js [topN=10] [windowHours=24]
import "dotenv/config";
import { supabase } from "../src/lib/supabase.js";
import { logToGoogleSheet } from "../src/lib/sheetsLogger.js";

const TOP_N = Number(process.argv[2]) || 10;
const WINDOW_HOURS = Number(process.argv[3]) || 24;

async function fetchAllEvents(since) {
  const rows = [];
  const PAGE_SIZE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("ui_events")
      .select("event_type, page, section")
      .gte("created_at", since)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

async function main() {
  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const events = await fetchAllEvents(since);

  const counts = new Map(); // `${event_type}|${page}|${section}` -> count
  for (const r of events) {
    const key = `${r.event_type}|${r.page}|${r.section || "(no section label)"}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const ranked = [...counts.entries()]
    .map(([key, count]) => {
      const [eventType, page, section] = key.split("|");
      return { eventType, page, section, count };
    })
    .sort((a, b) => b.count - a.count);

  const topClicks = ranked.filter(r => r.eventType === "click").slice(0, TOP_N);
  const topViews = ranked.filter(r => r.eventType === "view").slice(0, TOP_N);

  const windowLabel = `last ${WINDOW_HOURS}h, snapshot ${new Date().toISOString()}`;
  console.log(`[rollupUiEvents] ${events.length} raw events in the last ${WINDOW_HOURS}h.`);
  console.log(`[rollupUiEvents] Top ${topClicks.length} clicks:`, topClicks);
  console.log(`[rollupUiEvents] Top ${topViews.length} views:`, topViews);

  if (topClicks.length === 0 && topViews.length === 0) {
    console.log("[rollupUiEvents] No events in this window - nothing to log.");
    return;
  }

  topClicks.forEach((r, i) => {
    logToGoogleSheet({
      sheet: "Engagement",
      user: "System",
      action: `#${i + 1} Most Clicked`,
      item: `${r.page} > ${r.section}`,
      details: `${r.count} clicks | ${windowLabel}`
    });
  });
  topViews.forEach((r, i) => {
    logToGoogleSheet({
      sheet: "Engagement",
      user: "System",
      action: `#${i + 1} Most Viewed`,
      item: `${r.page} > ${r.section}`,
      details: `${r.count} views | ${windowLabel}`
    });
  });

  // logToGoogleSheet is fire-and-forget (fetch calls not awaited) - give
  // them a moment to actually go out before the process exits, or a script
  // run (as opposed to a long-lived server process) would drop them all.
  await new Promise(r => setTimeout(r, 4000));
  console.log("[rollupUiEvents] Done.");
}

main().catch(err => {
  console.error("[rollupUiEvents] Failed:", err);
  process.exitCode = 1;
});

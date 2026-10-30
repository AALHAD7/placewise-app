// Distinguishes an actual browser refresh from an in-app (React Router)
// remount of a page - both can leave a page reading selection state back out
// of its own URL params on mount, but the user's intent differs: navigating
// away and back within the app should keep the selection (the whole point of
// persisting it in the URL), while an actual page reload should start clean.
// The Navigation Timing API's `type` reflects how the CURRENT document was
// loaded and is stable for the whole SPA session - "reload" only for a true
// browser refresh, "navigate" for the original load a client-side route
// change happened under. That's the key gap a naive `type === "reload"`
// check misses: the entry's `type` doesn't reset per client-side route
// change, only its `name` (the URL that was actually loaded) does - it's
// fixed to whatever page the browser genuinely reloaded. Confirmed as a real
// bug, not theoretical: refresh anywhere in the app (e.g. on /role), then
// click a Skill chip - SkillPage's own isPageReload() check read the stale
// session-wide "reload" type and bounced straight back to /role, even
// though this particular arrival at /skill was a normal in-app navigation,
// not a reload of /skill itself. Pin the check to pathname-match: only
// "reload" if the page that was ACTUALLY reloaded is the one asking, so a
// reload elsewhere in the app doesn't poison every later navigation for the
// rest of the tab's session. Falls back to false (behave as if not a
// reload) if the API is unavailable or the URL can't be parsed.
export function isPageReload(): boolean {
  if (typeof performance === "undefined" || !performance.getEntriesByType) return false;
  const [nav] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  if (nav?.type !== "reload") return false;
  try {
    return new URL(nav.name).pathname === window.location.pathname;
  } catch {
    return true;
  }
}

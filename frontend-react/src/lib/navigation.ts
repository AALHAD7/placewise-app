// Distinguishes an actual browser refresh from an in-app (React Router)
// remount of a page - both can leave a page reading selection state back out
// of its own URL params on mount, but the user's intent differs: navigating
// away and back within the app should keep the selection (the whole point of
// persisting it in the URL), while an actual page reload should start clean.
// The Navigation Timing API's `type` reflects how the CURRENT document was
// loaded and is stable for the page's lifetime - "reload" only for a true
// browser refresh, "navigate" for the original load a client-side route
// change happened under. Falls back to false (behave as if not a reload) if
// the API is unavailable, rather than guessing.
export function isPageReload(): boolean {
  if (typeof performance === "undefined" || !performance.getEntriesByType) return false;
  const [nav] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  return nav?.type === "reload";
}

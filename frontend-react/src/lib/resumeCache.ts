// Caches the parsed resume text in the browser (not the backend) so a page
// refresh within a few hours doesn't force a re-upload. Deliberately
// client-side/localStorage rather than a backend table: there's no real
// login yet (see apiClient.ts), and this doesn't need to follow the user
// across devices - just survive a refresh on the same browser. Also caches
// the generated questions themselves (liveResults/liveSources) - a refresh
// must NOT silently regenerate a fresh, different set of questions;
// regeneration only ever happens when the user explicitly clicks
// Generate/Refresh. Ported verbatim from frontend/index.html lines 1843-1871.

const RESUME_CACHE_KEY = "pmh_resume_cache";
const RESUME_CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

export interface ResumeCache {
  fileName: string;
  resumeText: string;
  liveResults: unknown | null;
  liveSources: unknown[];
  savedAt: number;
}

export function saveResumeCache(
  fileName: string,
  resumeText: string,
  liveResults?: unknown,
  liveSources?: unknown[]
): void {
  try {
    localStorage.setItem(
      RESUME_CACHE_KEY,
      JSON.stringify({
        fileName,
        resumeText,
        liveResults: liveResults || null,
        liveSources: liveSources || [],
        savedAt: Date.now()
      })
    );
  } catch {
    // localStorage unavailable/full - not fatal, just no cache this session
  }
}

export function loadResumeCache(): ResumeCache | null {
  try {
    const raw = localStorage.getItem(RESUME_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached || Date.now() - cached.savedAt > RESUME_CACHE_TTL_MS) {
      localStorage.removeItem(RESUME_CACHE_KEY);
      return null;
    }
    return cached as ResumeCache;
  } catch {
    return null;
  }
}

export function clearResumeCache(): void {
  try {
    localStorage.removeItem(RESUME_CACHE_KEY);
  } catch {
    // ignore
  }
}

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createElement } from "react";
import { apiFetch, AuthUnavailableError, decodeSessionDisplayName, getAuthToken } from "../lib/apiClient";
import type { ActivitySummary } from "../types/api";

// Prep Streak / Today's Plan / Recent Activity / Interview Readiness data -
// all real, from GET /api/activity/summary (backend/src/lib/activity.js).
// Ported from frontend/index.html's loadDashboard() (1993-2021) and
// topbar's streak/name/initials (4045-4055). Loaded once at app mount (not
// Home-page-specific - the top nav's streak pill needs it everywhere), and
// reloaded whenever Home is opened so a streak/plan/activity change from
// elsewhere in the app shows up without a full page reload.

interface DashboardState {
  loading: boolean;
  error: string;
  data: ActivitySummary | null;
}

interface DashboardValue extends DashboardState {
  sessionName: string;
  reload: () => Promise<void>;
}

const DashboardContext = createContext<DashboardValue | null>(null);

function useDashboardState(): DashboardValue {
  const [state, setState] = useState<DashboardState>({ loading: true, error: "", data: null });
  const [sessionName, setSessionName] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const token = await getAuthToken();
      setSessionName((prev) => prev ?? decodeSessionDisplayName(token));
      const data = await apiFetch<ActivitySummary>("/api/activity/summary", {}, "Failed to load activity.");
      setState({ loading: false, error: "", data });
    } catch (e) {
      // Activity is per-user: with no sign-in available, show Home's empty
      // states rather than an error on the landing page.
      if (e instanceof AuthUnavailableError) {
        setState({ loading: false, error: "", data: null });
        return;
      }
      setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : "Could not load activity." }));
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, sessionName: sessionName || "there", reload };
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const value = useDashboardState();
  return createElement(DashboardContext.Provider, { value }, children);
}

export function useDashboard(): DashboardValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard() must be used within a <DashboardProvider>");
  return ctx;
}

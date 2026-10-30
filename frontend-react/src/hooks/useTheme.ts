import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

// Mirrors the inline pre-paint script in index.html exactly (same storage
// key, same light/dark/system resolution) - that script sets data-theme
// before first paint so there's no flash; this hook takes over afterward so
// the avatar menu's Light/Dark/System control can change it live.
export type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "placewise-theme";
const LIGHT_THEME_COLOR = "#F5F8FF";
const DARK_THEME_COLOR = "#0B1220";

function readStoredMode(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    // ignore - private browsing / blocked storage
  }
  return "light";
}

function resolve(mode: ThemeMode): ResolvedTheme {
  return mode === "dark" ? "dark" : "light";
}

function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", resolved === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
}

interface ThemeValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

function useThemeState(): ThemeValue {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode());
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolve(mode));

  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  useEffect(() => {
    setResolved(resolve(mode));
    if (mode !== "system") return;
    // Live-follow the OS theme while "System" is selected.
    try {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => setResolved(resolve("system"));
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    } catch {
      return undefined;
    }
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      // ignore - private browsing / blocked storage
    }
  }, []);

  return { mode, resolved, setMode };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = useThemeState();
  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme() must be used within a <ThemeProvider>");
  return ctx;
}

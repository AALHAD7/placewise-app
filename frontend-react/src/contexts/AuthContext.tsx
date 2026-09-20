import { createContext, createElement, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

// Guest sessions (Supabase anonymous auth) are real sessions with no time
// limit of their own - Supabase doesn't have a "3 hour guest" concept, so
// that's app-level policy, enforced here rather than trusted to the client
// alone (the backend can't currently tell a guest token from a real one,
// since anonymous users are still valid Supabase users - see DOCUMENT.md).
const GUEST_SESSION_MS = 3 * 60 * 60 * 1000;

function isAnonymousSession(session: Session | null): boolean {
  // Supabase marks anonymous users with is_anonymous on the user object
  // (present in supabase-js v2.latest); app_metadata.provider === "anonymous"
  // is the older/more stable signal, checked as a fallback.
  if (!session) return false;
  const user = session.user as unknown as { is_anonymous?: boolean; app_metadata?: { provider?: string } };
  return !!user.is_anonymous || user.app_metadata?.provider === "anonymous";
}

interface AuthValue {
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  guestExpiresAt: number | null; // epoch ms, null when not a guest
  error: string;
  clearError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  signOut: (reason?: string) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

function useAuthState(): AuthValue {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearError = () => setError("");

  async function signOut(reason?: string) {
    if (expiryTimer.current) {
      clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
    await supabase.auth.signOut();
    setSession(null);
    if (reason) setError(reason);
  }

  // Arms (or re-arms) the hard 3-hour cutoff whenever a guest session
  // becomes active - both on fresh sign-in and on the page-load restore
  // path below, so a guest who closes the tab and reopens it 2 hours later
  // still gets kicked at the 3-hour mark, not 3 more hours from reopening.
  function armGuestExpiry(s: Session) {
    if (expiryTimer.current) clearTimeout(expiryTimer.current);
    const createdAt = new Date(s.user.created_at).getTime();
    const msLeft = createdAt + GUEST_SESSION_MS - Date.now();
    if (msLeft <= 0) {
      signOut("Your guest session expired after 3 hours. Sign in to continue.");
      return;
    }
    expiryTimer.current = setTimeout(() => {
      signOut("Your guest session expired after 3 hours. Sign in to continue.");
    }, msLeft);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && isAnonymousSession(data.session)) armGuestExpiry(data.session);
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession && isAnonymousSession(newSession)) armGuestExpiry(newSession);
      else if (expiryTimer.current) {
        clearTimeout(expiryTimer.current);
        expiryTimer.current = null;
      }
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      sub.subscription.unsubscribe();
      if (expiryTimer.current) clearTimeout(expiryTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signInWithGoogle() {
    setError("");
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    // A successful call navigates the browser away to Google - this only
    // returns for a failure (e.g. the provider isn't configured yet).
    if (err) setError(err.message);
  }

  async function signInWithEmail(email: string, password: string) {
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
  }

  async function signUpWithEmail(email: string, password: string) {
    setError("");
    const { error: err } = await supabase.auth.signUp({ email, password });
    if (err) setError(err.message);
  }

  async function continueAsGuest() {
    setError("");
    const { error: err } = await supabase.auth.signInAnonymously();
    if (err) setError(err.message);
  }

  const isGuest = isAnonymousSession(session);
  const guestExpiresAt = isGuest && session ? new Date(session.user.created_at).getTime() + GUEST_SESSION_MS : null;

  return {
    session,
    loading,
    isGuest,
    guestExpiresAt,
    error,
    clearError,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    continueAsGuest,
    signOut
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useAuthState();
  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be used within an <AuthProvider>");
  return ctx;
}

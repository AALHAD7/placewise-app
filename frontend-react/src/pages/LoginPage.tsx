import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Full-page (outside AppShell/TopNav, see router.tsx) - matches every other
// consumer login screen's convention of not showing app chrome before a
// session exists.

type Mode = "signin" | "signup";

export default function LoginPage() {
  const { session, loading, error, clearError, signInWithGoogle, signInWithEmail, signUpWithEmail, continueAsGuest } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signupMessage, setSignupMessage] = useState("");

  // Already signed in (incl. a guest session that hasn't expired) - bounce
  // back to wherever the auth guard redirected from, or Home.
  if (!loading && session) {
    const from = (location.state as { from?: Location })?.from;
    return <Navigate to={from ? from.pathname + from.search : "/"} replace />;
  }

  async function submitEmail(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSignupMessage("");
    if (mode === "signin") {
      await signInWithEmail(email, password);
    } else {
      await signUpWithEmail(email, password);
      setSignupMessage("Check your email to confirm your account, then sign in.");
    }
    setSubmitting(false);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setSignupMessage("");
    clearError();
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ width: 380, background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "32px 30px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "center" }}>
          <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-900)" }}>Placewise</span>
        </div>
        <p style={{ margin: "8px 0 24px", textAlign: "center", color: "var(--text-gray2)", fontSize: "0.84375rem" }}>
          {mode === "signin" ? "Sign in to continue" : "Create your account"}
        </p>

        <button
          onClick={signInWithGoogle}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            border: "1px solid var(--card-border)",
            borderRadius: "var(--r-sm)",
            padding: "10px 14px",
            background: "var(--surface)",
            cursor: "pointer",
            font: "600 0.84375rem 'Instrument Sans',sans-serif",
            color: "var(--text-900)"
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24z" />
            <path fill="#FBBC05" d="M5.27 14.27A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.27V6.62H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.11C6.22 6.86 8.87 4.75 12 4.75z" />
          </svg>
          Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--track)" }} />
          <span style={{ fontSize: "0.71875rem", color: "var(--text-lightgray)" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "var(--track)" }} />
        </div>

        <form onSubmit={submitEmail} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{ border: "1px solid var(--card-border)", borderRadius: "var(--r-sm)", padding: "10px 12px", outline: "none", fontSize: "0.84375rem", color: "var(--text-900)", background: "var(--field-bg)" }}
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={{ border: "1px solid var(--card-border)", borderRadius: "var(--r-sm)", padding: "10px 12px", outline: "none", fontSize: "0.84375rem", color: "var(--text-900)", background: "var(--field-bg)" }}
          />
          {error && <div style={{ fontSize: "0.78125rem", color: "var(--red-dark)" }}>{error}</div>}
          {signupMessage && <div style={{ fontSize: "0.78125rem", color: "var(--green)" }}>{signupMessage}</div>}
          <button
            type="submit"
            disabled={submitting}
            style={{
              border: 0,
              borderRadius: "var(--r-sm)",
              padding: "10px 16px",
              font: "600 0.84375rem 'Instrument Sans',sans-serif",
              cursor: submitting ? "default" : "pointer",
              opacity: submitting ? 0.6 : 1,
              background: "var(--indigo)",
              color: "var(--surface)",
              marginTop: 2
            }}
          >
            {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p style={{ margin: "16px 0 0", textAlign: "center", fontSize: "0.78125rem", color: "var(--text-gray2)" }}>
          {mode === "signin" ? (
            <>
              Don't have an account?{" "}
              <button type="button" className="unbutton" onClick={() => switchMode("signup")} style={{ color: "var(--indigo)", fontWeight: 600, cursor: "pointer" }}>
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" className="unbutton" onClick={() => switchMode("signin")} style={{ color: "var(--indigo)", fontWeight: 600, cursor: "pointer" }}>
                Sign in
              </button>
            </>
          )}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 10px" }}>
          <div style={{ flex: 1, height: 1, background: "var(--track)" }} />
        </div>
        <button
          onClick={continueAsGuest}
          style={{ width: "100%", border: "none", background: "none", cursor: "pointer", fontSize: "0.78125rem", color: "var(--text-gray2)", textDecoration: "underline" }}
        >
          Continue as guest (3-hour session)
        </button>
      </div>
    </div>
  );
}

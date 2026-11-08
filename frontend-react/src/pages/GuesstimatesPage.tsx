import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/apiClient";
import PageHeader from "../components/PageHeader";
import MarkdownWithDiagrams from "../components/MarkdownWithDiagrams";
import GuesstimateCalculationView from "../components/GuesstimateCalculationView";
import IndeterminateProgressBar from "../components/IndeterminateProgressBar";
import VoiceRecordButton from "../components/VoiceRecordButton";
import { useVoiceRecording } from "../hooks/useVoiceRecording";
import type {
  GuesstimateClarifyResponse,
  GuesstimateResponse,
  GuesstimateEvaluation,
  GuesstimateEvaluateResponse,
  GuesstimateListItem,
  GuesstimateListResponse
} from "../types/api";

// R8: first real UI for Guesstimates (backend-only as of R7 - GET
// /api/guesstimates/random, grounded in the SRCC Guesstimates Book only,
// see guesstimateRetrieval.js). Layout follows the same "What you'll find
// here" + two-col-sidebar-wide convention as FrameworksPage/RolePage, so the
// page uses the full width instead of floating as a narrow fixed-width
// column. Per CLAUDE.md's grounding policy, the sidebar never renders
// per-answer source attribution (school/casebook/page) - that's
// debugging/admin-only - so it carries static "how to approach it" guidance
// instead.
//
// 2026-11-07 (Aalhad's call, seeing the page): question, diagram and worked
// answer rendered as one continuous block meant a student saw the answer
// before trying - there was no actual "practice" happening. The answer half
// is only mounted after "Show Answer" is clicked - conditionally rendered,
// not CSS-hidden, so there's nothing in the DOM to peek at. A scratchpad text
// field + mic button (reusing useVoiceRecording/VoiceRecordButton exactly as
// FrameworkAskBox does) let the student type or speak their own attempt
// first; it's never submitted anywhere, just local state cleared on "Try
// another".
//
// 2026-11-07 (same day, bug fix): the question used to be computed client-side
// by splitting the already-paraphrased `problem` text at the first diagram
// fence (splitQuestionFromAnswer in placewiseBlocks.ts). That leaked the
// ASSUMPTIONS section - part of the worked-solution methodology, not neutral
// problem framing - into the pre-reveal question. The split now happens
// server-side on raw content before paraphrasing: `question` is the bare
// title (always present, never paraphrased) and `problem` is now the answer
// portion only (assumptions + diagram + working). See
// backend/src/lib/guesstimateRetrieval.js's getRandomGuesstimateProblem.
//
// 2026-11-07 (same day, Aalhad's call): added an "ask the interviewer a
// clarifying question" panel next to the attempt scratchpad, mirroring real
// case interviews where you can clarify scope/assumptions before estimating.
// Capped at 2 asks per problem - enforced here only (UX pacing, not a
// security boundary; POST /api/guesstimates/clarify has no server-side cap).
// Exchanges stay visible after "Show answer" (removing content the student
// already saw would be jarring) but new asks are disabled once revealed,
// since the point is moot once the full solution is shown. Requires the new
// `chunkId` field on GuesstimateResponse; if it's missing (older cached
// response, or backend rollout hasn't landed yet), the ask control disables
// itself instead of sending a request with no chunkId.

type LoadState = { loading: boolean; error: string; data: GuesstimateResponse | null };
type ClarifyExchange = { question: string; answer: string };

const MAX_CLARIFY_ASKS = 2;
const PRACTICED_GUESSTIMATES_STORAGE_KEY = "placewise_practiced_guesstimates";

function getStoredPracticedIds(): string[] {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      // Clear legacy seen key so problems merely opened are not tagged as practiced
      if (localStorage.getItem("placewise_seen_guesstimates")) {
        localStorage.removeItem("placewise_seen_guesstimates");
      }
      const raw = localStorage.getItem(PRACTICED_GUESSTIMATES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string" && id.trim()) : [];
    }
    return [];
  } catch {
    return [];
  }
}

function saveStoredPracticedIds(ids: string[]): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(PRACTICED_GUESSTIMATES_STORAGE_KEY, JSON.stringify(ids.slice(-100)));
    }
  } catch {
    // ignore quota errors
  }
}

function playTimeUpChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Ignore audio policy errors safely
  }
}

function formatTimerSeconds(totalSeconds: number): string {
  const m = Math.floor(Math.max(0, totalSeconds) / 60);
  const s = Math.max(0, totalSeconds) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function GuesstimatesPage() {
  const [state, setState] = useState<LoadState>({ loading: true, error: "", data: null });
  const [practicedIds, setPracticedIds] = useState<string[]>(() => getStoredPracticedIds());
  const sessionSeenRef = useRef<string[]>([]);
  const [attempt, setAttempt] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [solutionViewMode, setSolutionViewMode] = useState<"both" | "text" | "diagram">("both");
  const { recording, micError, startRecording, stopRecording } = useVoiceRecording();

  // Questions catalog state
  const [catalog, setCatalog] = useState<GuesstimateListItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Lock body scroll when catalog modal is open to prevent background scrolling on macOS/iOS
  useEffect(() => {
    if (isCatalogOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isCatalogOpen]);

  // Interview Timer states (5m, 10m default, 15m, custom, off)
  const [timerMode, setTimerMode] = useState<"5" | "10" | "15" | "custom" | "off">("10");
  const [customMinutes, setCustomMinutes] = useState(10);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeExpiredNotice, setTimeExpiredNotice] = useState<string | null>(null);

  const timerModeRef = useRef(timerMode);
  useEffect(() => {
    timerModeRef.current = timerMode;
  }, [timerMode]);

  const customMinutesRef = useRef(customMinutes);
  useEffect(() => {
    customMinutesRef.current = customMinutes;
  }, [customMinutes]);

  const attemptRef = useRef(attempt);
  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  const onSubmitRef = useRef<() => void>(() => {});

  // Clarifying questions ("ask the interviewer"), 2026-11-07: capped at
  // MAX_CLARIFY_ASKS client-side only - UX pacing, not a security boundary (the
  // backend route has no server-side cap). A failed request doesn't consume a
  // slot - only a successful exchange gets pushed. Kept visible (not hidden)
  // after reveal, but new asks are disabled, since removing content the
  // student already saw would feel jarring.
  const [clarifyQuestion, setClarifyQuestion] = useState("");
  const [clarifyExchanges, setClarifyExchanges] = useState<ClarifyExchange[]>([]);
  const [clarifyLoading, setClarifyLoading] = useState(false);
  const [clarifyError, setClarifyError] = useState("");

  const [evaluation, setEvaluation] = useState<GuesstimateEvaluation | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const recKey = "guesstimates-attempt";
  const isRecording = !!recording[recKey];
  const clarifyRecKey = "guesstimates-clarify";
  const isClarifyRecording = !!recording[clarifyRecKey];

  function onToggleMic() {
    if (isRecording) {
      stopRecording(recKey);
    } else {
      startRecording(recKey, () => attempt, setAttempt);
    }
  }

  function onToggleClarifyMic() {
    if (isClarifyRecording) {
      stopRecording(clarifyRecKey);
    } else {
      startRecording(clarifyRecKey, () => clarifyQuestion, setClarifyQuestion);
    }
  }

  const clarifyAsksLeft = MAX_CLARIFY_ASKS - clarifyExchanges.length;
  const canAskClarify = !revealed && clarifyAsksLeft > 0 && !!state.data?.chunkId;

  async function onAskClarify() {
    const text = clarifyQuestion.trim();
    const chunkId = state.data?.chunkId;
    if (!text || !chunkId || clarifyLoading || clarifyAsksLeft <= 0) return;
    setClarifyLoading(true);
    setClarifyError("");
    try {
      const res = await apiFetch<GuesstimateClarifyResponse>(
        "/api/guesstimates/clarify",
        { method: "POST", body: JSON.stringify({ chunkId, question: text }) },
        "Failed to get an answer to that question."
      );
      setClarifyExchanges((ex) => [...ex, { question: text, answer: res.answer }]);
      setClarifyQuestion("");
    } catch (err) {
      setClarifyError(err instanceof Error ? err.message : "Failed to get an answer to that question.");
    } finally {
      setClarifyLoading(false);
    }
  }

  async function onSubmitAttempt(isAutoSubmit = false) {
    const text = attemptRef.current.trim();
    if (!text || submitLoading) return;
    if (text.length < 5) {
      setSubmitError("Please write an attempt with at least 5 characters.");
      return;
    }
    setTimerRunning(false); // Stop timer upon evaluation
    setSubmitLoading(true);
    setSubmitError("");
    if (isAutoSubmit) {
      setTimeExpiredNotice("⏰ Time's up! Your attempt was automatically submitted for evaluation.");
    }
    try {
      const res = await apiFetch<GuesstimateEvaluateResponse>(
        "/api/guesstimates/evaluate",
        {
          method: "POST",
          body: JSON.stringify({
            chunkId: state.data?.chunkId || "",
            question: state.data?.question || "",
            attempt: text,
            usedClarification: clarifyExchanges.length > 0,
            clarifyingQuestions: clarifyExchanges.map((ex) => ex.question)
          })
        },
        "Failed to evaluate your attempt."
      );
      if (res && res.evaluation) {
        setEvaluation(res.evaluation);
        setRevealed(true);
        if (state.data?.chunkId) {
          const currentChunkId = state.data.chunkId;
          setPracticedIds((prev) => {
            const next = Array.from(new Set([...prev, currentChunkId]));
            saveStoredPracticedIds(next);
            return next;
          });
        }
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to evaluate your attempt.");
    } finally {
      setSubmitLoading(false);
    }
  }

  useEffect(() => {
    onSubmitRef.current = () => {
      onSubmitAttempt(true);
    };
  });

  function handleSetTimerMode(mode: "5" | "10" | "15" | "custom" | "off") {
    setTimerMode(mode);
    setTimerRunning(false);
    setTimeExpiredNotice(null);
    if (mode === "off") {
      setSecondsLeft(0);
    } else if (mode === "custom") {
      setSecondsLeft(customMinutes * 60);
    } else {
      const m = parseInt(mode, 10);
      setSecondsLeft(m * 60);
    }
  }

  function handleCustomMinutesChange(mins: number) {
    const clamped = Math.max(1, Math.min(60, isNaN(mins) ? 10 : mins));
    setCustomMinutes(clamped);
    if (timerMode === "custom") {
      setTimerRunning(false);
      setSecondsLeft(clamped * 60);
    }
  }

  function handleStartTimer() {
    if (secondsLeft <= 0) {
      const initial = timerMode === "custom" ? customMinutes * 60 : parseInt(timerMode, 10) * 60;
      setSecondsLeft(initial || 600);
    }
    setTimeExpiredNotice(null);
    setTimerRunning(true);
  }

  function handlePauseTimer() {
    setTimerRunning(false);
  }

  function handleResetTimer() {
    setTimerRunning(false);
    setTimeExpiredNotice(null);
    if (timerMode === "off") {
      setSecondsLeft(0);
    } else if (timerMode === "custom") {
      setSecondsLeft(customMinutes * 60);
    } else {
      setSecondsLeft(parseInt(timerMode, 10) * 60);
    }
  }

  useEffect(() => {
    if (!timerRunning || timerMode === "off") return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerRunning(false);
          playTimeUpChime();
          const currentText = attemptRef.current.trim();
          if (currentText.length >= 5) {
            setTimeExpiredNotice("⏰ Time's up! Your attempt was automatically submitted for evaluation.");
            if (onSubmitRef.current) onSubmitRef.current();
          } else {
            setTimeExpiredNotice("⏰ Time's up! Interview timer expired before an attempt was submitted. Benchmark solution revealed below.");
            setRevealed(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerMode]);

  const load = useCallback((targetChunkId?: string) => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    setAttempt("");
    setRevealed(false);
    setEvaluation(null);
    setSubmitLoading(false);
    setSubmitError("");
    setClarifyQuestion("");
    setClarifyExchanges([]);
    setClarifyError("");
    setTimeExpiredNotice(null);

    // Reset timer to configured duration
    setTimerRunning(false);
    const mode = timerModeRef.current;
    if (mode === "off") {
      setSecondsLeft(0);
    } else if (mode === "custom") {
      setSecondsLeft(customMinutesRef.current * 60);
    } else {
      setSecondsLeft(parseInt(mode, 10) * 60);
    }

    const currentSeen = sessionSeenRef.current;
    let query = "";
    if (targetChunkId) {
      query = `?chunkId=${encodeURIComponent(targetChunkId)}`;
    } else if (currentSeen.length) {
      query = `?exclude=${encodeURIComponent(currentSeen.join(","))}`;
    }

    apiFetch<GuesstimateResponse>(`/api/guesstimates/random${query}`, {}, "Failed to load a guesstimate.")
      .then((data) => {
        setState({ loading: false, error: "", data });
        if (data.available && data.chunkId) {
          const newId = data.chunkId;
          sessionSeenRef.current = data.cycleReset
            ? [newId]
            : Array.from(new Set([...sessionSeenRef.current, newId]));
        }
      })
      .catch((e) => setState({ loading: false, error: e instanceof Error ? e.message : "Could not load a guesstimate.", data: null }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setCatalogLoading(true);
    apiFetch<GuesstimateListResponse>("/api/guesstimates/list", {}, "Failed to load questions catalog.")
      .then((res) => {
        if (res && Array.isArray(res.problems)) {
          setCatalog(res.problems);
        }
      })
      .catch(() => {})
      .finally(() => setCatalogLoading(false));
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isCatalogOpen) {
        setIsCatalogOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCatalogOpen]);

  return (
    <>
      <PageHeader title="Guesstimates" subtitle="Practice problems from the real casebooks, with their source page." />

      <div className="section-title" style={{ marginTop: 34 }}>
        What you'll find here
      </div>
      <div className="grid-3">
        <div className="feature-card" style={{ cursor: "default" }}>
          <div className="fc-icon icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
          </div>
          <div className="feature-title">A fresh problem every time</div>
          <div className="feature-desc" style={{ marginBottom: 0 }}>
            Pulled from a real casebook, not invented - one estimation problem at a time so you can practise the way it actually shows up in an interview.
          </div>
        </div>
        <div className="feature-card" style={{ cursor: "default" }}>
          <div className="fc-icon icon-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
            </svg>
          </div>
          <div className="feature-title">Work it before you scroll</div>
          <div className="feature-desc" style={{ marginBottom: 0 }}>
            Structure your own approach first - clarify the question, break it into drivers, estimate each one - before checking any diagram or working shown.
          </div>
        </div>
        <div className="feature-card" style={{ cursor: "default" }}>
          <div className="fc-icon icon-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 1l4 4-4 4" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <path d="M7 23l-4-4 4-4" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          </div>
          <div className="feature-title">Swap it out anytime</div>
          <div className="feature-desc" style={{ marginBottom: 0 }}>
            Not the right problem to practise right now? Pull another one instantly with "Try another".
          </div>
        </div>
      </div>

      <div className="two-col-sidebar-wide" style={{ marginTop: 28 }}>
        {/* minWidth: 0 overrides the default CSS grid track sizing (a "1fr" track's
            implicit minimum is its content's max-content width, not 0) - without it,
            a wide child like AsciiDiagram's monospace box pushes this column past the
            viewport and the whole page scrolls horizontally on phone widths. */}
        <div style={{ minWidth: 0 }}>
          {state.loading && (
            <div role="status" aria-live="polite" style={{ maxWidth: 420 }}>
              <div style={{ color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>Loading a problem…</div>
              <IndeterminateProgressBar />
            </div>
          )}

          {state.error && !state.loading && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "26px 28px" }}>
              <div className="t-shake" style={{ color: "var(--red-dark)", fontSize: "0.84375rem" }}>{state.error}</div>
              <button
                type="button"
                onClick={() => load()}
                style={{ marginTop: 18, border: "1px solid var(--border-soft)", borderRadius: "var(--r-pill)", padding: "8px 18px", fontSize: "0.8125rem", fontWeight: 600, color: "var(--indigo)", background: "none", cursor: "pointer" }}
              >
                Try another
              </button>
            </div>
          )}

          {!state.loading && !state.error && state.data && !state.data.available && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "26px 28px", color: "var(--text-lightgray)", fontSize: "0.875rem" }}>
              {state.data.reason === "feature_disabled"
                ? "Guesstimates practice isn't switched on yet - check back soon."
                : "Couldn't find a fresh problem just now - try again."}
              {state.data.reason !== "feature_disabled" && (
                <div>
                  <button
                    type="button"
                    onClick={() => load()}
                    style={{ marginTop: 18, border: "1px solid var(--border-soft)", borderRadius: "var(--r-pill)", padding: "8px 18px", fontSize: "0.8125rem", fontWeight: 600, color: "var(--indigo)", background: "none", cursor: "pointer" }}
                  >
                    Try another
                  </button>
                </div>
              )}
            </div>
          )}

          {!state.loading && !state.error && state.data?.available && (
            <>
              {/* Question selection action bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                  marginBottom: 14
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setIsCatalogOpen(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 14px",
                      borderRadius: "var(--r-sm)",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      background: "rgba(59, 130, 246, 0.12)",
                      border: "1px solid rgba(59, 130, 246, 0.35)",
                      color: "#93c5fd",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <span>📚</span>
                    <span>Browse All Questions ({catalog.length || 25})</span>
                    <span style={{ fontSize: "0.6875rem", opacity: 0.7 }}>▾</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => load()}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 14px",
                      borderRadius: "var(--r-sm)",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid var(--border-soft)",
                      color: "var(--text-gray2)",
                      cursor: "pointer"
                    }}
                  >
                    <span>🎲</span>
                    <span>Random Problem</span>
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {practicedIds.length > 0 && (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-lightgray)" }}>
                      <strong>{practicedIds.length}</strong> / {catalog.length || 25} practiced
                    </span>
                  )}
                </div>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "28px 32px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>
                    Practice problem
                  </div>
                  {(() => {
                    const idx = catalog.findIndex((item) => item.chunkId === state.data?.chunkId);
                    if (idx >= 0) {
                      return (
                        <div style={{ fontSize: "0.6875rem", color: "var(--indigo)", fontWeight: 600, background: "rgba(99, 102, 241, 0.08)", padding: "2px 8px", borderRadius: "var(--r-pill)" }}>
                          Question {idx + 1} of {catalog.length || 25}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div style={{ marginTop: 16, fontSize: "1.0625rem", lineHeight: 1.7 }}>
                  {state.data.question && <MarkdownWithDiagrams markdown={state.data.question} />}
                </div>

                <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--divider)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>
                      Your attempt
                    </div>

                    {/* Interview Timer */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "rgba(15, 20, 29, 0.8)",
                        border: "1px solid " + (secondsLeft <= 30 && timerRunning && timerMode !== "off" ? "rgba(239, 68, 68, 0.5)" : secondsLeft <= 120 && timerRunning && timerMode !== "off" ? "rgba(245, 158, 11, 0.4)" : "rgba(59, 130, 246, 0.25)"),
                        padding: "4px 10px",
                        borderRadius: "8px",
                        boxShadow: secondsLeft <= 30 && timerRunning && timerMode !== "off" ? "0 0 12px rgba(239, 68, 68, 0.25)" : "none",
                        transition: "all 0.3s ease",
                        flexWrap: "wrap"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: "0.6875rem", color: "#94a3b8", fontWeight: 600, marginRight: 2 }}>⏱ Timer:</span>
                        {(["5", "10", "15", "custom", "off"] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleSetTimerMode(m)}
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 600,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              border: "none",
                              cursor: "pointer",
                              background: timerMode === m ? "rgba(59, 130, 246, 0.35)" : "transparent",
                              color: timerMode === m ? "#93c5fd" : "rgba(255, 255, 255, 0.5)"
                            }}
                          >
                            {m === "off" ? "Off" : m === "custom" ? "Custom" : `${m}m`}
                          </button>
                        ))}
                      </div>

                      {timerMode === "custom" && (
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={customMinutes}
                          onChange={(e) => handleCustomMinutesChange(Number(e.target.value))}
                          style={{
                            width: 44,
                            padding: "2px 4px",
                            fontSize: "0.75rem",
                            borderRadius: 4,
                            background: "rgba(0, 0, 0, 0.4)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            color: "#ffffff",
                            textAlign: "center"
                          }}
                        />
                      )}

                      {timerMode !== "off" && (
                        <>
                          <div
                            style={{
                              fontFamily: "monospace",
                              fontSize: "0.9375rem",
                              fontWeight: 800,
                              letterSpacing: ".06em",
                              color: secondsLeft <= 30 && timerRunning ? "#f87171" : secondsLeft <= 120 && timerRunning ? "#fbbf24" : "#ffffff",
                              minWidth: 46,
                              textAlign: "center"
                            }}
                          >
                            {formatTimerSeconds(secondsLeft)}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            {!timerRunning ? (
                              <button
                                type="button"
                                onClick={handleStartTimer}
                                style={{
                                  fontSize: "0.6875rem",
                                  fontWeight: 700,
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                  background: "rgba(16, 185, 129, 0.2)",
                                  color: "#34d399",
                                  border: "1px solid rgba(16, 185, 129, 0.4)",
                                  cursor: "pointer"
                                }}
                              >
                                ▶ Start
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={handlePauseTimer}
                                style={{
                                  fontSize: "0.6875rem",
                                  fontWeight: 700,
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                  background: "rgba(245, 158, 11, 0.2)",
                                  color: "#fbbf24",
                                  border: "1px solid rgba(245, 158, 11, 0.4)",
                                  cursor: "pointer"
                                }}
                              >
                                ⏸ Pause
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={handleResetTimer}
                              title="Reset Timer"
                              style={{
                                fontSize: "0.6875rem",
                                fontWeight: 600,
                                padding: "3px 6px",
                                borderRadius: "4px",
                                background: "rgba(255, 255, 255, 0.08)",
                                color: "rgba(255, 255, 255, 0.6)",
                                border: "1px solid rgba(255, 255, 255, 0.15)",
                                cursor: "pointer"
                              }}
                            >
                              ↺
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {timeExpiredNotice && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: "8px 12px",
                        borderRadius: "6px",
                        background: "rgba(239, 68, 68, 0.15)",
                        border: "1px solid rgba(239, 68, 68, 0.35)",
                        color: "#fca5a5",
                        fontSize: "0.8125rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 8
                      }}
                    >
                      <span>⏰</span>
                      <span>{timeExpiredNotice}</span>
                    </div>
                  )}

                  <textarea
                    value={attempt}
                    onChange={(e) => setAttempt(e.target.value)}
                    placeholder="Work it out on paper, then type or speak your structure and final number here."
                    style={{
                      width: "100%",
                      minHeight: 180,
                      height: 200,
                      maxHeight: 550,
                      overflowY: "auto",
                      overscrollBehavior: "contain",
                      WebkitOverflowScrolling: "touch",
                      scrollbarWidth: "thin",
                      scrollbarColor: "rgba(255, 255, 255, 0.4) rgba(0, 0, 0, 0.2)",
                      resize: "vertical",
                      marginTop: 10,
                      border: "1px solid var(--card-border)",
                      borderRadius: "var(--r-sm)",
                      padding: "12px 14px",
                      outline: "none",
                      fontSize: "0.875rem",
                      lineHeight: 1.6,
                      color: "var(--text-900)",
                      background: "var(--field-bg)"
                    }}
                    onWheel={(e) => {
                      e.stopPropagation();
                    }}
                  />
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 9, flexWrap: "wrap" }}>
                  <VoiceRecordButton recording={isRecording} onClick={onToggleMic} />
                  <button
                    type="button"
                    onClick={() => onSubmitAttempt(false)}
                    disabled={!attempt.trim() || submitLoading}
                    className="btn-outline-indigo"
                    style={{
                      border: "1px solid var(--card-border)",
                      borderRadius: "var(--r-sm)",
                      padding: "9px 16px",
                      font: "600 0.8125rem 'Instrument Sans',sans-serif",
                      cursor: attempt.trim() && !submitLoading ? "pointer" : "default",
                      background: attempt.trim() && !submitLoading ? "linear-gradient(135deg, #ff6b35 0%, #ea580c 100%)" : "var(--surface)",
                      color: "#ffffff"
                    }}
                  >
                    {submitLoading ? "Evaluating…" : "Submit attempt"}
                  </button>
                  {micError[recKey] && <span style={{ fontSize: "0.78125rem", color: "var(--red-dark)" }}>{micError[recKey]}</span>}
                  {submitError && <span className="t-shake" style={{ fontSize: "0.78125rem", color: "var(--red-dark)" }}>{submitError}</span>}
                </div>

                {attempt.trim() && clarifyExchanges.length === 0 && !revealed && (
                  <div
                    style={{
                      marginTop: 10,
                      background: "rgba(245, 158, 11, 0.08)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      borderRadius: "var(--r-sm)",
                      padding: "8px 12px",
                      fontSize: "0.78125rem",
                      color: "#fbbf24",
                      lineHeight: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}
                  >
                    <span style={{ fontSize: "0.9375rem" }}>💡</span>
                    <span>
                      <strong>Consulting tip:</strong> Directly jumping to the answer without clarifying assumptions is the wrong approach in case interviews. Use the clarifying question option below to confirm boundary conditions first.
                    </span>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--divider)" }}>
                <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>
                  Ask the interviewer a clarifying question (optional, up to {MAX_CLARIFY_ASKS})
                </div>

                {clarifyExchanges.map((ex, i) => (
                  <div key={i} style={{ marginTop: 10, paddingBottom: 10, borderBottom: "1px solid var(--divider)" }}>
                    <div style={{ fontSize: "0.78125rem", fontWeight: 600, color: "var(--indigo)" }}>You asked: {ex.question}</div>
                    <p style={{ margin: "6px 0 0", fontSize: "0.84375rem", lineHeight: 1.55, color: "var(--text-gray2)", textWrap: "pretty" as const }}>{ex.answer}</p>
                  </div>
                ))}

                {clarifyAsksLeft <= 0 ? (
                  <div style={{ marginTop: 10, fontSize: "0.78125rem", color: "var(--text-lightgray)" }}>
                    You've used both clarifying questions for this problem.
                  </div>
                ) : (
                  <>
                    <textarea
                      value={clarifyQuestion}
                      onChange={(e) => setClarifyQuestion(e.target.value)}
                      placeholder="e.g. Should I assume this is for an urban market only?"
                      disabled={revealed || !state.data?.chunkId}
                      maxLength={300}
                      style={{
                        width: "100%",
                        height: 64,
                        minHeight: 64,
                        maxHeight: 200,
                        overflowY: "auto",
                        overscrollBehavior: "contain",
                        WebkitOverflowScrolling: "touch",
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(255, 255, 255, 0.4) rgba(0, 0, 0, 0.2)",
                        resize: "vertical",
                        marginTop: 10,
                        border: "1px solid var(--card-border)",
                        borderRadius: "var(--r-sm)",
                        padding: "9px 12px",
                        outline: "none",
                        fontSize: "0.84375rem",
                        lineHeight: 1.5,
                        color: "var(--text-900)",
                        background: "var(--field-bg)"
                      }}
                      onWheel={(e) => {
                        e.stopPropagation();
                      }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 9, flexWrap: "wrap" }}>
                      <VoiceRecordButton recording={isClarifyRecording} onClick={onToggleClarifyMic} />
                      <button
                        type="button"
                        onClick={onAskClarify}
                        disabled={!canAskClarify || !clarifyQuestion.trim() || clarifyLoading}
                        className="btn-outline-indigo"
                        style={{ border: "1px solid var(--card-border)", borderRadius: "var(--r-sm)", padding: "9px 14px", font: "600 0.8125rem 'Instrument Sans',sans-serif", cursor: canAskClarify && clarifyQuestion.trim() && !clarifyLoading ? "pointer" : "default", background: "var(--surface)", color: "var(--text-700)" }}
                      >
                        {clarifyLoading ? "Asking…" : "Ask"}
                      </button>
                      {(micError[clarifyRecKey] || clarifyError) && (
                        <span className="t-shake" style={{ fontSize: "0.78125rem", color: "var(--red-dark)" }}>{micError[clarifyRecKey] || clarifyError}</span>
                      )}
                    </div>
                    {revealed && (
                      <div style={{ marginTop: 8, fontSize: "0.75rem", color: "var(--text-lightgray)" }}>
                        The answer's already shown below, so clarifying questions are closed for this problem.
                      </div>
                    )}
                    {!revealed && !state.data?.chunkId && (
                      <div style={{ marginTop: 8, fontSize: "0.75rem", color: "var(--text-lightgray)" }}>
                        Clarifying questions aren't available for this problem right now.
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                {!revealed && (
                  <button
                    type="button"
                    onClick={() => {
                      setRevealed(true);
                      setTimerRunning(false);
                    }}
                    className="btn-outline-indigo"
                    style={{ border: "1px solid var(--card-border)", borderRadius: "var(--r-sm)", padding: "9px 16px", font: "600 0.8125rem 'Instrument Sans',sans-serif", cursor: "pointer", background: "var(--surface)", color: "var(--text-700)" }}
                  >
                    Show answer
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => load()}
                  style={{ border: "1px solid var(--border-soft)", borderRadius: "var(--r-pill)", padding: "9px 18px", fontSize: "0.8125rem", fontWeight: 600, color: "var(--indigo)", background: "none", cursor: "pointer" }}
                >
                  Try another
                </button>
              </div>

              {evaluation && (
                <div
                  style={{
                    marginTop: 22,
                    background: "rgba(15, 20, 29, 0.95)",
                    border: "1px solid rgba(59, 130, 246, 0.35)",
                    borderRadius: "14px",
                    padding: "20px",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, paddingBottom: 14, borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ fontSize: "1.375rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
                        {evaluation.score} <span style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 500 }}>/ 10</span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "999px",
                          background: evaluation.rating === "Strong" ? "rgba(16, 185, 129, 0.15)" : evaluation.rating === "Good" ? "rgba(59, 130, 246, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: evaluation.rating === "Strong" ? "#34d399" : evaluation.rating === "Good" ? "#60a5fa" : "#f87171",
                          border: `1px solid ${evaluation.rating === "Strong" ? "rgba(16, 185, 129, 0.3)" : evaluation.rating === "Good" ? "rgba(59, 130, 246, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
                        }}
                      >
                        {evaluation.rating}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      Your Attempt Assessment
                    </div>
                  </div>

                  {evaluation.rubricBreakdown && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginTop: 14 }}>
                      <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "8px", padding: "8px 10px" }}>
                        <div style={{ fontSize: "0.65625rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".06em" }}>Structure &amp; Formula</div>
                        <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#ffffff", marginTop: 2 }}>{evaluation.rubricBreakdown.structure} <span style={{ fontSize: "0.6875rem", color: "#64748b" }}>/ 3.0</span></div>
                      </div>
                      <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "8px", padding: "8px 10px" }}>
                        <div style={{ fontSize: "0.65625rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".06em" }}>Assumptions</div>
                        <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#ffffff", marginTop: 2 }}>{evaluation.rubricBreakdown.assumptions} <span style={{ fontSize: "0.6875rem", color: "#64748b" }}>/ 4.0</span></div>
                      </div>
                      <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "8px", padding: "8px 10px" }}>
                        <div style={{ fontSize: "0.65625rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".06em" }}>Calculation &amp; Scale</div>
                        <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#ffffff", marginTop: 2 }}>{evaluation.rubricBreakdown.calculation} <span style={{ fontSize: "0.6875rem", color: "#64748b" }}>/ 3.0</span></div>
                      </div>
                    </div>
                  )}

                  {(evaluation.missedAssumptionsWarning || clarifyExchanges.length === 0) && (
                    <div
                      style={{
                        marginTop: 14,
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.35)",
                        borderRadius: "10px",
                        padding: "12px 16px",
                        color: "#fca5a5",
                        fontSize: "0.84375rem",
                        lineHeight: 1.55
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#f87171", marginBottom: 4 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        Critical Interview Pitfall: Directly Jumping to the Answer
                      </div>
                      <div>
                        {evaluation.assumptionsGuidance ||
                          "You submitted an answer without clarifying any assumptions. In top-tier management consulting interviews (McKinsey, BCG, Bain), directly jumping to the answer without clarifying scope, boundary conditions, or constraints with the interviewer is considered the wrong approach. Always clarify assumptions before calculating."}
                      </div>
                    </div>
                  )}

                  {evaluation.summary && (
                    <p style={{ margin: "14px 0 16px", fontSize: "0.875rem", lineHeight: 1.6, color: "#e2e8f0" }}>
                      {evaluation.summary}
                    </p>
                  )}

                  {evaluation.benchmarkComparison && (
                    <div style={{ marginBottom: 14, background: "rgba(255, 107, 53, 0.08)", border: "1px solid rgba(255, 107, 53, 0.25)", borderRadius: "8px", padding: "10px 14px", fontSize: "0.8125rem", lineHeight: 1.55, color: "#ffedd5" }}>
                      <strong style={{ color: "#ff8c42" }}>Benchmark Comparison: </strong>
                      {evaluation.benchmarkComparison}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                    {evaluation.strengths?.length > 0 && (
                      <div style={{ background: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "10px", padding: "12px 14px" }}>
                        <div style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#34d399", marginBottom: 8 }}>Strengths</div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.8125rem", lineHeight: 1.55, color: "#cbd5e1" }}>
                          {evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {evaluation.improvements?.length > 0 && (
                      <div style={{ background: "rgba(245, 158, 11, 0.06)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "10px", padding: "12px 14px" }}>
                        <div style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#fbbf24", marginBottom: 8 }}>Areas to Improve</div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.8125rem", lineHeight: 1.55, color: "#cbd5e1" }}>
                          {evaluation.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {revealed && state.data.problem && (
                <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--divider)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>
                      Diagram &amp; worked solution
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid var(--border-soft)",
                        borderRadius: "var(--r-pill)",
                        padding: "3px 4px",
                        flexWrap: "wrap"
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setSolutionViewMode("both")}
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: "var(--r-pill)",
                          border: "none",
                          cursor: "pointer",
                          background: solutionViewMode === "both" ? "rgba(59, 130, 246, 0.35)" : "transparent",
                          color: solutionViewMode === "both" ? "#93c5fd" : "var(--text-lightgray)",
                          transition: "all 0.15s ease"
                        }}
                      >
                        📊 Diagram + 🔢 Math Steps
                      </button>
                      <button
                        type="button"
                        onClick={() => setSolutionViewMode("text")}
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: "var(--r-pill)",
                          border: "none",
                          cursor: "pointer",
                          background: solutionViewMode === "text" ? "rgba(59, 130, 246, 0.35)" : "transparent",
                          color: solutionViewMode === "text" ? "#93c5fd" : "var(--text-lightgray)",
                          transition: "all 0.15s ease"
                        }}
                      >
                        🔢 Simple Text Calculation
                      </button>
                      <button
                        type="button"
                        onClick={() => setSolutionViewMode("diagram")}
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: "var(--r-pill)",
                          border: "none",
                          cursor: "pointer",
                          background: solutionViewMode === "diagram" ? "rgba(59, 130, 246, 0.35)" : "transparent",
                          color: solutionViewMode === "diagram" ? "#93c5fd" : "var(--text-lightgray)",
                          transition: "all 0.15s ease"
                        }}
                      >
                        📊 Diagram only
                      </button>
                    </div>
                  </div>

                  {(solutionViewMode === "both" || solutionViewMode === "diagram") && (
                    <div style={{ marginTop: 16, fontSize: "1.0625rem", lineHeight: 1.7 }}>
                      <MarkdownWithDiagrams markdown={state.data.problem} />
                    </div>
                  )}

                  {(solutionViewMode === "both" || solutionViewMode === "text") && (
                    <GuesstimateCalculationView
                      markdown={state.data.problem}
                      rawProblem={state.data.rawProblem}
                    />
                  )}
                </div>
              )}
            </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          {/* Question Catalog Quick Card */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Question Catalog</div>
              <span style={{ fontSize: "0.6875rem", color: "var(--indigo)", fontWeight: 700 }}>{catalog.length || 25} Problems</span>
            </div>
            <p style={{ margin: "10px 0 14px", fontSize: "0.8125rem", lineHeight: 1.5, color: "var(--text-gray2)" }}>
              Browse all 25 real interview questions from the SRCC Casebook and choose any topic to practice.
            </p>
            <button
              type="button"
              onClick={() => setIsCatalogOpen(true)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "var(--r-sm)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                background: "rgba(59, 130, 246, 0.12)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                color: "#93c5fd"
              }}
            >
              📚 Browse All 25 Questions
            </button>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "20px 22px" }}>
            <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>How to approach it</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              {[
                "Restate the question and ask any clarifying questions you'd ask a real interviewer.",
                "Lay out your structure - the drivers you'll multiply or add - before you estimate a single number.",
                "Make reasonable assumptions out loud and sanity-check the final figure against something you know."
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 9, fontSize: "0.84375rem", lineHeight: 1.5, color: "var(--text-700)" }}>
                  <span style={{ flex: "none", width: 5, height: 5, borderRadius: "50%", background: "var(--indigo)", marginTop: 7 }}></span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "20px 22px" }}>
            <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Common pitfalls</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              {[
                "Jumping to a number before explaining the structure behind it.",
                "Picking assumptions that don't hold up against common sense (e.g. population, usage rates).",
                "Not rounding cleanly - messy arithmetic mid-interview costs more than a slightly rough estimate."
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 9, fontSize: "0.84375rem", lineHeight: 1.5, color: "var(--text-700)" }}>
                  <span style={{ flex: "none", width: 5, height: 5, borderRadius: "50%", background: "var(--red-dark)", marginTop: 7 }}></span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Questions Catalog Modal */}
      {isCatalogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsCatalogOpen(false)}
          onWheel={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.78)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            overscrollBehavior: "contain"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 720,
              height: "min(85vh, 720px)",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              background: "linear-gradient(180deg, #111622 0%, #0a0d14 100%)",
              border: "1px solid rgba(59, 130, 246, 0.35)",
              borderRadius: 14,
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.75)",
              overflow: "hidden"
            }}
          >
            {/* Header */}
            <div
              style={{
                flex: "0 0 auto",
                padding: "18px 22px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#ffffff" }}>
                  Casebook Guesstimates Catalog
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>
                  Select any of the 25 real interview questions from the SRCC Casebook
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#ffffff",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: "0.875rem",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div style={{ flex: "0 0 auto", padding: "14px 22px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter questions (e.g. Swiggy, market size, Delhi, flights, revenue, cars)..."
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(59, 130, 246, 0.25)",
                  borderRadius: 8,
                  fontSize: "0.84375rem",
                  color: "#ffffff",
                  outline: "none"
                }}
              />
            </div>

            {/* Questions list */}
            <div
              style={{
                flex: "1 1 auto",
                minHeight: 0,
                overflowY: "auto",
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
                padding: "12px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 8
              }}
            >
              {catalogLoading ? (
                <div style={{ padding: "20px 0", textAlign: "center", color: "#94a3b8", fontSize: "0.875rem" }}>
                  Loading questions catalog…
                </div>
              ) : (
                (() => {
                  const filtered = catalog.filter((item) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return item.question.toLowerCase().includes(q) || String(item.pageStart).includes(q);
                  });
                  if (filtered.length === 0) {
                    return (
                      <div style={{ padding: "20px 0", textAlign: "center", color: "#94a3b8", fontSize: "0.875rem" }}>
                        No questions match "{searchQuery}"
                      </div>
                    );
                  }
                  return filtered.map((item, index) => {
                    const isCurrent = state.data?.chunkId === item.chunkId;
                    const isPracticed = practicedIds.includes(item.chunkId);
                    return (
                      <div
                        key={item.chunkId}
                        onClick={() => {
                          setIsCatalogOpen(false);
                          load(item.chunkId);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 14px",
                          borderRadius: 8,
                          background: isCurrent ? "rgba(59, 130, 246, 0.18)" : "rgba(255, 255, 255, 0.03)",
                          border: "1px solid " + (isCurrent ? "rgba(59, 130, 246, 0.4)" : "rgba(255, 255, 255, 0.07)"),
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isCurrent ? "rgba(59, 130, 246, 0.25)" : "rgba(255, 255, 255, 0.06)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isCurrent ? "rgba(59, 130, 246, 0.18)" : "rgba(255, 255, 255, 0.03)";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 0, marginRight: 12 }}>
                          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, minWidth: 22, marginTop: 2 }}>
                            {index + 1}.
                          </span>
                          <div>
                            <div style={{ fontSize: "0.84375rem", fontWeight: 600, color: isCurrent ? "#93c5fd" : "#ffffff", lineHeight: 1.4 }}>
                              {item.question}
                            </div>
                            <div style={{ fontSize: "0.71875rem", color: "#94a3b8", marginTop: 3 }}>
                              Casebook p. {item.pageStart} {item.hasDiagram && "· 📊 Includes Visual Breakdown"}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {isCurrent && (
                            <span style={{ fontSize: "0.6875rem", background: "rgba(59, 130, 246, 0.25)", color: "#93c5fd", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
                              Active
                            </span>
                          )}
                          {isPracticed && !isCurrent && (
                            <span style={{ fontSize: "0.6875rem", background: "rgba(16, 185, 129, 0.15)", color: "#34d399", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
                              ✓ Practiced
                            </span>
                          )}
                          <span style={{ fontSize: "0.8125rem", color: "var(--indigo)" }}>
                            ➜
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

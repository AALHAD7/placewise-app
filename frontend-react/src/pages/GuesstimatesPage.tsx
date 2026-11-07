import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient";
import PageHeader from "../components/PageHeader";
import MarkdownWithDiagrams from "../components/MarkdownWithDiagrams";
import IndeterminateProgressBar from "../components/IndeterminateProgressBar";
import VoiceRecordButton from "../components/VoiceRecordButton";
import { useVoiceRecording } from "../hooks/useVoiceRecording";
import type { GuesstimateClarifyResponse, GuesstimateResponse } from "../types/api";

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

export default function GuesstimatesPage() {
  const [state, setState] = useState<LoadState>({ loading: true, error: "", data: null });
  const [attempt, setAttempt] = useState("");
  const [revealed, setRevealed] = useState(false);
  const { recording, micError, startRecording, stopRecording } = useVoiceRecording();

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

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    setAttempt("");
    setRevealed(false);
    setClarifyQuestion("");
    setClarifyExchanges([]);
    setClarifyError("");
    apiFetch<GuesstimateResponse>("/api/guesstimates/random", {}, "Failed to load a guesstimate.")
      .then((data) => setState({ loading: false, error: "", data }))
      .catch((e) => setState({ loading: false, error: e instanceof Error ? e.message : "Could not load a guesstimate.", data: null }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
                onClick={load}
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
                    onClick={load}
                    style={{ marginTop: 18, border: "1px solid var(--border-soft)", borderRadius: "var(--r-pill)", padding: "8px 18px", fontSize: "0.8125rem", fontWeight: 600, color: "var(--indigo)", background: "none", cursor: "pointer" }}
                  >
                    Try another
                  </button>
                </div>
              )}
            </div>
          )}

          {!state.loading && !state.error && state.data?.available && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "28px 32px" }}>
              <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>
                Practice problem
              </div>
              <div style={{ marginTop: 16, fontSize: "1.0625rem", lineHeight: 1.7 }}>
                {state.data.question && <MarkdownWithDiagrams markdown={state.data.question} />}
              </div>

              <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--divider)" }}>
                <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>
                  Your attempt
                </div>
                <textarea
                  value={attempt}
                  onChange={(e) => setAttempt(e.target.value)}
                  placeholder="Work it out on paper, then type or speak your structure and final number here."
                  style={{ width: "100%", height: 110, resize: "vertical", marginTop: 10, border: "1px solid var(--card-border)", borderRadius: "var(--r-sm)", padding: "10px 12px", outline: "none", fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text-900)", background: "var(--field-bg)" }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 9, flexWrap: "wrap" }}>
                  <VoiceRecordButton recording={isRecording} onClick={onToggleMic} />
                  {micError[recKey] && <span style={{ fontSize: "0.78125rem", color: "var(--red-dark)" }}>{micError[recKey]}</span>}
                </div>
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
                      style={{ width: "100%", height: 56, resize: "vertical", marginTop: 10, border: "1px solid var(--card-border)", borderRadius: "var(--r-sm)", padding: "9px 12px", outline: "none", fontSize: "0.84375rem", lineHeight: 1.5, color: "var(--text-900)", background: "var(--field-bg)" }}
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
                    onClick={() => setRevealed(true)}
                    className="btn-outline-indigo"
                    style={{ border: "1px solid var(--card-border)", borderRadius: "var(--r-sm)", padding: "9px 16px", font: "600 0.8125rem 'Instrument Sans',sans-serif", cursor: "pointer", background: "var(--surface)", color: "var(--text-700)" }}
                  >
                    Show answer
                  </button>
                )}
                <button
                  type="button"
                  onClick={load}
                  style={{ border: "1px solid var(--border-soft)", borderRadius: "var(--r-pill)", padding: "9px 18px", fontSize: "0.8125rem", fontWeight: 600, color: "var(--indigo)", background: "none", cursor: "pointer" }}
                >
                  Try another
                </button>
              </div>

              {revealed && state.data.problem && (
                <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--divider)" }}>
                  <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>
                    Diagram &amp; worked solution
                  </div>
                  <div style={{ marginTop: 16, fontSize: "1.0625rem", lineHeight: 1.7 }}>
                    <MarkdownWithDiagrams markdown={state.data.problem} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
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
    </>
  );
}

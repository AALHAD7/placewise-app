import { useState } from "react";
import { apiFetch } from "../lib/apiClient";
import { trackClick, trackView } from "../lib/uiEvents";
import PageHeader from "../components/PageHeader";
import MarkdownWithDiagrams from "../components/MarkdownWithDiagrams";
import GroundingNote from "../components/GroundingNote";
import VoiceRecordButton from "../components/VoiceRecordButton";
import { useVoiceRecording } from "../hooks/useVoiceRecording";
import type { QaAskResponse } from "../types/api";

// R8: first frontend surface for free-form Q&A (POST /api/qa/ask, qaRetrieval.js) -
// built flag-gated and off by default (ENABLE_CONSULTING_RAG_V2), same posture as
// GuesstimatesPage - a working, correct page, not a polished one. See
// .gsd/phases/R8/02-PLAN.md's scope note for why this is being built now.
//
// 2026-11-07 (Aalhad's call, seeing the page live): the question/answer card sat in a
// fixed 680px column, leaving a large blank area on the right at desktop widths - the
// same issue already fixed on GuesstimatesPage. Now follows that page's "What you'll
// find here" + two-col-sidebar-wide convention: the ask/answer card grows to fill the
// wider left track, and the right column carries clickable example questions (fill the
// box, don't auto-submit) plus short "how to ask" tips - no per-answer source line, per
// CLAUDE.md's grounding policy (school/casebook/page stays admin/debug-only).

const MAX_QUESTION_LENGTH = 1000;

const EXAMPLE_QUESTIONS = [
  "Can you explain to me how the value chain framework works?",
  "How should I structure a market entry case?",
  "What's the difference between a profitability case and a growth case?"
];

type AskState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "answered"; question: string; res: QaAskResponse };

export default function QaPage() {
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<AskState>({ status: "idle" });
  const { recording, micError, startRecording, stopRecording } = useVoiceRecording();

  const recKey = "qa-ask";
  const isRecording = !!recording[recKey];

  function onToggleMic() {
    if (isRecording) {
      stopRecording(recKey);
    } else {
      startRecording(recKey, () => question, setQuestion);
    }
  }

  async function onAsk() {
    const text = question.trim();
    if (!text || state.status === "loading") return;
    trackClick("/qa", "ask-submit");
    setState({ status: "loading" });
    try {
      const res = await apiFetch<QaAskResponse>(
        "/api/qa/ask",
        { method: "POST", body: JSON.stringify({ question: text }) },
        "Failed to answer that question."
      );
      // Question text itself isn't duplicated here - already captured
      // server-side in qa.js's /ask handler ("Questions Asked" Sheet tab).
      trackView("/qa", "answer", { grounded: !!res.groundedInCasebooks, available: !!res.available });
      setState({ status: "answered", question: text, res });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "Failed to answer that question." });
    }
  }

  function onAskAnother() {
    trackClick("/qa", "ask-another");
    setQuestion("");
    setState({ status: "idle" });
  }

  const overLimit = question.length > MAX_QUESTION_LENGTH;
  const showForm = state.status !== "answered";

  return (
    <>
      <PageHeader title="Ask" subtitle="Ask anything from the casebooks - or anything else." />

      <div className="section-title" style={{ marginTop: 34 }}>
        What you'll find here
      </div>
      <div className="grid-3">
        <div className="feature-card" style={{ cursor: "default" }}>
          <div className="fc-icon icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" />
              <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <div className="feature-title">Grounded in the casebooks first</div>
          <div className="feature-desc" style={{ marginBottom: 0 }}>
            When the casebooks cover your question, the answer is built from that content only - paraphrased, not a verbatim excerpt.
          </div>
        </div>
        <div className="feature-card" style={{ cursor: "default" }}>
          <div className="fc-icon icon-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
            </svg>
          </div>
          <div className="feature-title">Clearly labelled when it isn't</div>
          <div className="feature-desc" style={{ marginBottom: 0 }}>
            If the casebooks don't cover it, you still get a general answer - plainly marked so you know it's not casebook-sourced.
          </div>
        </div>
        <div className="feature-card" style={{ cursor: "default" }}>
          <div className="fc-icon icon-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <div className="feature-title">Diagrams where they help</div>
          <div className="feature-desc" style={{ marginBottom: 0 }}>
            Some answers come with a rebuilt diagram alongside the explanation - ask about a named framework and see.
          </div>
        </div>
      </div>

      <div className="two-col-sidebar-wide" style={{ marginTop: 28 }}>
        <div style={{ minWidth: 0 }}>
          {showForm && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "28px 32px" }}>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your question, or record it and we will transcribe."
                style={{ width: "100%", height: 120, resize: "vertical", border: "1px solid var(--card-border)", borderRadius: "var(--r-sm)", padding: "10px 12px", outline: "none", fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--text-900)", background: "var(--field-bg)" }}
              />
              <div style={{ marginTop: 6, fontSize: "0.71875rem", color: overLimit ? "var(--red-dark)" : "var(--text-lightgray)" }}>
                {question.length}/{MAX_QUESTION_LENGTH}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 9, flexWrap: "wrap" }}>
                <VoiceRecordButton recording={isRecording} onClick={onToggleMic} />
                <button
                  type="button"
                  onClick={onAsk}
                  disabled={!question.trim() || overLimit || state.status === "loading"}
                  className="btn-outline-indigo"
                  style={{
                    border: "1px solid var(--card-border)",
                    borderRadius: "var(--r-sm)",
                    padding: "9px 16px",
                    font: "600 0.8125rem 'Instrument Sans',sans-serif",
                    cursor: question.trim() && !overLimit && state.status !== "loading" ? "pointer" : "default",
                    background: "var(--surface)",
                    color: "var(--text-700)"
                  }}
                >
                  {state.status === "loading" ? "Asking…" : "Ask"}
                </button>
                {(micError[recKey] || (state.status === "error" && state.message)) && (
                  <span className="t-shake" style={{ fontSize: "0.78125rem", color: "var(--red-dark)" }}>
                    {micError[recKey] || (state.status === "error" ? state.message : "")}
                  </span>
                )}
              </div>
            </div>
          )}

          {state.status === "answered" && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "28px 32px" }}>
              {!state.res.available ? (
                <div style={{ color: "var(--text-lightgray)", fontSize: "0.875rem" }}>
                  Q&A isn't switched on yet - check back soon.
                </div>
              ) : (
                <>
                  <div style={{ fontSize: "0.78125rem", fontWeight: 600, color: "var(--indigo)" }}>You asked: {state.question}</div>
                  <div style={{ marginTop: 10 }}>
                    <GroundingNote groundedInCasebooks={!!state.res.groundedInCasebooks} />
                  </div>
                  <div style={{ marginTop: 14, fontSize: "1.0625rem", lineHeight: 1.7 }}>
                    <MarkdownWithDiagrams markdown={state.res.answer ?? ""} />
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={onAskAnother}
                style={{ marginTop: 18, border: "1px solid var(--border-soft)", borderRadius: "var(--r-pill)", padding: "7px 16px", fontSize: "0.8125rem", fontWeight: 600, color: "var(--indigo)", background: "none", cursor: "pointer" }}
              >
                Ask another
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "20px 22px" }}>
            <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Try asking</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {EXAMPLE_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    trackClick("/qa", "example-question", { question: q });
                    setQuestion(q);
                    if (state.status === "answered") setState({ status: "idle" });
                  }}
                  style={{
                    textAlign: "left",
                    border: "1px solid var(--card-border)",
                    borderRadius: "var(--r-sm)",
                    padding: "9px 12px",
                    fontSize: "0.8125rem",
                    lineHeight: 1.45,
                    color: "var(--text-700)",
                    background: "var(--field-bg)",
                    cursor: "pointer"
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "20px 22px" }}>
            <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>How to get a sharp answer</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              {[
                "Name the framework, case type or concept directly - \"how does X work\" beats a vague prompt.",
                "Ask one question at a time - split multi-part questions for a cleaner answer.",
                "If the answer isn't labelled as general, it's grounded in the casebooks - check the label either way."
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 9, fontSize: "0.84375rem", lineHeight: 1.5, color: "var(--text-700)" }}>
                  <span style={{ flex: "none", width: 5, height: 5, borderRadius: "50%", background: "var(--indigo)", marginTop: 7 }}></span>
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

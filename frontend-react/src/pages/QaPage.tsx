import { useState } from "react";
import { apiFetch } from "../lib/apiClient";
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

const MAX_QUESTION_LENGTH = 1000;

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
    setState({ status: "loading" });
    try {
      const res = await apiFetch<QaAskResponse>(
        "/api/qa/ask",
        { method: "POST", body: JSON.stringify({ question: text }) },
        "Failed to answer that question."
      );
      setState({ status: "answered", question: text, res });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "Failed to answer that question." });
    }
  }

  function onAskAnother() {
    setQuestion("");
    setState({ status: "idle" });
  }

  const overLimit = question.length > MAX_QUESTION_LENGTH;
  const showForm = state.status !== "answered";

  return (
    <>
      <PageHeader title="Ask" subtitle="Ask anything from the casebooks - or anything else." />

      <div style={{ marginTop: 28, maxWidth: 680 }}>
        {showForm && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "22px 24px" }}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question, or record it and we will transcribe."
              style={{ width: "100%", height: 92, resize: "vertical", border: "1px solid var(--card-border)", borderRadius: "var(--r-sm)", padding: "9px 12px", outline: "none", fontSize: "0.875rem", lineHeight: 1.5, color: "var(--text-900)", background: "var(--field-bg)" }}
            />
            <div style={{ marginTop: 6, fontSize: "0.71875rem", color: overLimit ? "var(--red-dark)" : "var(--text-lightgray)" }}>
              {question.length}/{MAX_QUESTION_LENGTH}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 9 }}>
              <VoiceRecordButton recording={isRecording} onClick={onToggleMic} />
              <button
                type="button"
                onClick={onAsk}
                disabled={!question.trim() || overLimit || state.status === "loading"}
                className="btn-outline-indigo"
                style={{
                  border: "1px solid var(--card-border)",
                  borderRadius: "var(--r-sm)",
                  padding: "9px 14px",
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
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "22px 24px" }}>
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
                <div style={{ marginTop: 10 }}>
                  <MarkdownWithDiagrams markdown={state.res.answer ?? ""} />
                </div>
              </>
            )}
            <button
              type="button"
              onClick={onAskAnother}
              style={{ marginTop: 14, border: "1px solid var(--border-soft)", borderRadius: "var(--r-pill)", padding: "7px 16px", fontSize: "0.8125rem", fontWeight: 600, color: "var(--indigo)", background: "none", cursor: "pointer" }}
            >
              Ask another
            </button>
          </div>
        )}
      </div>
    </>
  );
}

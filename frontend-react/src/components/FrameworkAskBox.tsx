import { useState } from "react";
import type { Framework, FrameworkAskResponse } from "../types/api";
import { apiFetch } from "../lib/apiClient";
import { useVoiceRecording } from "../hooks/useVoiceRecording";
import VoiceRecordButton from "./VoiceRecordButton";
import { trackClick } from "../lib/uiEvents";

// The "ask a follow-up" box under each framework's Review panel - suggested-question chips
// (generated once per framework, backend/scripts/generateFollowUpQuestions.js) plus a
// free-text box a student can type or speak into. Mic input reuses useVoiceRecording/
// VoiceRecordButton exactly as Resume's clarifying-question box and Skill's answer box do
// (recKey namespacing keeps this instance's recording independent of theirs) - same
// component, same behavior, on purpose: coherence across pages, not a framework-specific
// mic implementation.

interface FrameworkAskBoxProps {
  framework: Framework;
}

export default function FrameworkAskBox({ framework }: FrameworkAskBoxProps) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<{ question: string; answer: string; grounded: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { recording, micError, startRecording, stopRecording } = useVoiceRecording();

  const recKey = `framework-ask__${framework.id}`;
  const isRecording = !!recording[recKey];

  function onToggleMic() {
    if (isRecording) {
      stopRecording(recKey);
    } else {
      startRecording(recKey, () => question, setQuestion);
    }
  }

  // `source` is tracking-only metadata (which entry point was used) - the
  // question text itself is already captured server-side in frameworks.js's
  // /ask handler (the "Framework Questions" Sheet tab), so it isn't
  // duplicated into the click event here.
  async function onAsk(q: string, source: "suggested" | "typed" = "typed") {
    const text = q.trim();
    if (!text || loading) return;
    trackClick("/frameworks", "framework-ask-submit", { framework: framework.name, source });
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<FrameworkAskResponse>(
        "/api/frameworks/ask",
        { method: "POST", body: JSON.stringify({ frameworkId: framework.id, question: text }) },
        "Failed to answer that question."
      );
      setAsked({ question: text, answer: res.answer, grounded: res.grounded });
      setQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to answer that question.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 12, background: "var(--surface-alt)", border: "1px solid var(--card-border)", borderRadius: "var(--r-sm)", padding: "12px 14px" }}>
      <div style={{ fontSize: "0.65625rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--indigo)" }}>
        Ask about this framework
      </div>

      {asked && (
        <div style={{ marginTop: 10, marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid var(--divider)" }}>
          <div style={{ fontSize: "0.78125rem", fontWeight: 600, color: "var(--indigo)" }}>You asked: {asked.question}</div>
          <p style={{ margin: "6px 0 0", fontSize: "0.84375rem", lineHeight: 1.55, color: "var(--text-gray2)", textWrap: "pretty" as const }}>{asked.answer}</p>
          {!asked.grounded && (
            <div style={{ marginTop: 6, fontSize: "0.71875rem", color: "var(--text-600)" }}>
              Couldn't verify a fully grounded answer, so this falls back to the framework's own content above.
            </div>
          )}
        </div>
      )}

      {!!framework.suggested_questions?.length && (
        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 7 }}>
          {framework.suggested_questions.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onAsk(q, "suggested")}
              disabled={loading}
              className="unbutton"
              style={{
                border: "1px solid var(--card-border)",
                borderRadius: "var(--r-pill)",
                padding: "6px 13px",
                font: "600 0.78125rem 'Instrument Sans',sans-serif",
                color: "var(--indigo)",
                background: "var(--surface-sunken)",
                cursor: loading ? "default" : "pointer"
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Type your own question, or record it and we will transcribe."
        style={{ width: "100%", height: 64, resize: "vertical", marginTop: 10, border: "1px solid var(--card-border)", borderRadius: "var(--r-sm)", padding: "9px 12px", outline: "none", fontSize: "0.84375rem", lineHeight: 1.5, color: "var(--text-900)", background: "var(--field-bg)" }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 9 }}>
        <VoiceRecordButton recording={isRecording} onClick={onToggleMic} />
        <button
          type="button"
          onClick={() => onAsk(question)}
          disabled={!question.trim() || loading}
          className="btn-outline-indigo"
          style={{ border: "1px solid var(--card-border)", borderRadius: "var(--r-sm)", padding: "9px 14px", font: "600 0.8125rem 'Instrument Sans',sans-serif", cursor: question.trim() && !loading ? "pointer" : "default", background: "var(--surface)", color: "var(--text-700)" }}
        >
          {loading ? "Asking…" : "Ask"}
        </button>
        {(micError[recKey] || error) && (
          <span style={{ fontSize: "0.78125rem", color: "var(--red-dark)" }}>{micError[recKey] || error}</span>
        )}
      </div>
    </div>
  );
}

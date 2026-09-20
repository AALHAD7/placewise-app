import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/apiClient";
import { mapDomainForRetrieval, RAG_DOMAIN_OPTIONS } from "../lib/constants";
import { useVoiceRecording } from "../hooks/useVoiceRecording";
import VoiceRecordButton from "../components/VoiceRecordButton";
import PageHeader from "../components/PageHeader";
import type { MockInterviewAnswerResponse, MockInterviewFeedback, MockInterviewStartResponse } from "../types/api";

// Ported from frontend/index.html: startMockInterview/submitMockAnswer/
// nextMockQuestion/endMockInterview/mockPanel() (2553-2661), markup
// (1445-1526). The "Loaded from practice prompts" banner is purely
// informational in the source - startMockInterview() never actually sends
// the prefilled question to the backend, which always generates its own
// opening question. Preserved exactly, odd as that is - see migration plan
// principle of behavior parity over "fixing" things not asked about.
//
// mockPrefill arrives via query params (?prefillQuestion=&prefillFrom=) set
// by Role page's "Practise" button (see migration plan §0.9), replacing the
// old app's setState({active, mockPrefill}) cross-page handoff.

const RECKEY = "mock__mock";

export default function MockInterviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const prefillQuestion = searchParams.get("prefillQuestion") || "";
  const prefillFrom = searchParams.get("prefillFrom") || "";
  const [prefillCleared, setPrefillCleared] = useState(false);
  const showPrefillCard = !!prefillQuestion && !prefillCleared;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [companyInput, setCompanyInput] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [ragDomain, setRagDomain] = useState(searchParams.get("domain") || "");
  const [difficulty, setDifficulty] = useState(2);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [count, setCount] = useState(0);
  const [answerDraft, setAnswerDraft] = useState("");
  const [feedback, setFeedback] = useState<MockInterviewFeedback | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState<number | null>(null);

  const { recording, micError, startRecording, stopRecording } = useVoiceRecording();
  const isRecording = !!recording[RECKEY];
  const micErrorText = micError[RECKEY] || "";

  function clearPrefill() {
    setPrefillCleared(true);
    searchParams.delete("prefillQuestion");
    searchParams.delete("prefillFrom");
    setSearchParams(searchParams, { replace: true });
  }

  async function startMockInterview() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<MockInterviewStartResponse>("/api/mock-interview/start", {
        method: "POST",
        body: JSON.stringify({
          company: companyInput.trim() || undefined,
          role: roleInput.trim() || undefined,
          difficulty: difficulty || 2,
          domain: mapDomainForRetrieval(ragDomain)
        })
      }, "Failed to start mock interview.");
      setLoading(false);
      setSessionId(data.sessionId);
      setQuestion(data.question);
      setCount(1);
      setAnswerDraft("");
      setFeedback(null);
      setQuestionStartedAt(Date.now());
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : "Could not reach the backend.");
    }
  }

  async function submitMockAnswer() {
    const answer = answerDraft.trim();
    if (answer.length < 5 || loading) return;
    const timeSpent = questionStartedAt ? Math.round((Date.now() - questionStartedAt) / 1000) : null;
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<MockInterviewAnswerResponse>("/api/mock-interview/answer", {
        method: "POST",
        body: JSON.stringify({ sessionId, userAnswer: answer, timeSpent })
      }, "Failed to evaluate answer.");
      setLoading(false);
      setFeedback(data.feedback);
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : "Could not reach the backend.");
    }
  }

  function nextMockQuestion() {
    if (!feedback || !feedback.followUpQuestion) return;
    setQuestion(feedback.followUpQuestion);
    setAnswerDraft("");
    setFeedback(null);
    setCount((c) => c + 1);
    setQuestionStartedAt(Date.now());
  }

  function endMockInterview() {
    setSessionId(null);
    setQuestion("");
    setAnswerDraft("");
    setFeedback(null);
    setCount(0);
    setError("");
    setQuestionStartedAt(null);
  }

  const active = !!sessionId;
  const submitDisabled = answerDraft.trim().length < 5 || loading;

  return (
    <>
      <PageHeader title="Mock Interview" subtitle="Practice against a real Gemini-backed interviewer" />

      {showPrefillCard && (
        <div style={{ marginTop: 24, border: "1px solid #C7DCF9", borderRadius: "var(--r-md)", background: "var(--blue-wash)", padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: "0.65625rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--indigo)" }}>Loaded from practice prompts</span>
            <button type="button" onClick={clearPrefill} className="unbutton probe-close" style={{ cursor: "pointer", color: "var(--text-lightgray)", fontSize: "0.9375rem", lineHeight: 1 }}>×</button>
          </div>
          <p style={{ margin: "10px 0 0", fontSize: "1rem", lineHeight: 1.55, fontWeight: 600, color: "var(--text-900)" }}>{prefillQuestion}</p>
          <div style={{ marginTop: 7, fontSize: "0.78125rem", color: "var(--text-lightgray)" }}>{prefillFrom}</div>
        </div>
      )}

      {!active && (
        <>
          <div className="section-title" style={{ marginTop: 34 }}>
            What you'll find here
          </div>
          <div className="grid-3">
            <div className="feature-card" style={{ cursor: "default" }}>
              <div className="fc-icon icon-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19v3" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <rect x="9" y="2" width="6" height="13" rx="3" />
                </svg>
              </div>
              <div className="feature-title">A real interviewer</div>
              <div className="feature-desc" style={{ marginBottom: 0 }}>
                Gemini asks an opening question tailored to the company/role you enter, then follows up based on what you actually say.
              </div>
            </div>
            <div className="feature-card" style={{ cursor: "default" }}>
              <div className="fc-icon icon-purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
                  <path d="M14 2v5a1 1 0 0 0 1 1h5" />
                  <path d="M10 9H8" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                </svg>
              </div>
              <div className="feature-title">Type or speak</div>
              <div className="feature-desc" style={{ marginBottom: 0 }}>
                Answer by typing or recording your voice - recordings are transcribed automatically before scoring.
              </div>
            </div>
            <div className="feature-card" style={{ cursor: "default" }}>
              <div className="fc-icon icon-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div className="feature-title">Feedback per answer</div>
              <div className="feature-desc" style={{ marginBottom: 0 }}>
                Each answer gets scored feedback - strengths, improvements, a stronger sample - before the next question.
              </div>
            </div>
          </div>
          <div className="grid-full">
            <div className="feature-card wide" style={{ cursor: "default" }}>
              <div className="fc-icon icon-amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 21v-7" />
                  <path d="M4 10V3" />
                  <path d="M12 21v-9" />
                  <path d="M12 8V3" />
                  <path d="M20 21v-5" />
                  <path d="M20 12V3" />
                  <path d="M1 14h6" />
                  <path d="M9 8h6" />
                  <path d="M17 16h6" />
                </svg>
              </div>
              <div className="fc-body">
                <div className="feature-title">Difficulty &amp; domain</div>
                <div className="feature-desc" style={{ marginBottom: 0 }}>
                  Pick Easy/Medium/Hard and a prep domain so the questions and evaluation match what you're actually preparing for.
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!active && (
        <div style={{ marginTop: 26, background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "22px 24px", maxWidth: 520 }}>
          <div style={{ fontSize: "0.96875rem", fontWeight: 700, color: "var(--text-900)" }}>Start a mock interview</div>
          <p style={{ margin: "6px 0 0", fontSize: "0.84375rem", color: "var(--text-gray2)" }}>A real interviewer - asks an opening question, evaluates each answer, and follows up based on what you say.</p>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <input type="text" value={companyInput} onChange={(e) => setCompanyInput(e.target.value)} placeholder="Company (optional)" style={{ flex: 1, border: "1px solid #e0e1e6", borderRadius: "var(--r-sm)", padding: "9px 12px", outline: "none", fontSize: "0.84375rem", color: "var(--text-900)", background: "var(--field-bg)" }} />
            <input type="text" value={roleInput} onChange={(e) => setRoleInput(e.target.value)} placeholder="Role (optional)" style={{ flex: 1, border: "1px solid #e0e1e6", borderRadius: "var(--r-sm)", padding: "9px 12px", outline: "none", fontSize: "0.84375rem", color: "var(--text-900)", background: "var(--field-bg)" }} />
          </div>
          <select
            value={ragDomain}
            onChange={(e) => setRagDomain(e.target.value)}
            style={{ marginTop: 10, border: "1px solid #e0e1e6", borderRadius: "var(--r-sm)", padding: "9px 12px", outline: "none", fontSize: "0.84375rem", color: "var(--text-900)", background: "var(--field-bg)", cursor: "pointer" }}
          >
            {RAG_DOMAIN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {[1, 2, 3].map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                style={{ border: "1px solid " + (difficulty === d ? "var(--indigo)" : "var(--border-strong)"), borderRadius: "var(--r-sm)", padding: "9px 14px", cursor: "pointer", font: "600 0.84375rem 'Instrument Sans',sans-serif", color: difficulty === d ? "var(--indigo)" : "var(--text-700)", background: "var(--surface)" }}
              >
                {d === 1 ? "Easy" : d === 2 ? "Medium" : "Hard"}
              </button>
            ))}
          </div>
          <button onClick={startMockInterview} disabled={loading} style={{ marginTop: 16, border: 0, borderRadius: "var(--r-sm)", padding: "11px 18px", font: "600 0.875rem 'Instrument Sans',sans-serif", cursor: "pointer", background: "var(--indigo)", color: "var(--surface)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
                <path d="M20 2v4" />
                <path d="M22 4h-4" />
                <circle cx="4" cy="18" r="2" />
              </svg>
              <span>{loading ? "Starting…" : "Start mock interview"}</span>
            </span>
          </button>
          <span style={{ marginLeft: 10, fontSize: "0.78125rem", color: "var(--red-dark)" }}>{error}</span>
        </div>
      )}

      {active && (
        <div style={{ marginTop: 26, background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: "0.65625rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--text-lightgray)" }}>Question {count}</span>
            <button type="button" onClick={endMockInterview} className="unbutton probe-close" style={{ cursor: "pointer", color: "var(--text-lightgray)", fontSize: "0.8125rem", fontWeight: 600 }}>End session</button>
          </div>
          <p style={{ margin: "12px 0 0", fontSize: "1.0625rem", lineHeight: 1.55, fontWeight: 600, color: "var(--text-900)" }}>{question}</p>

          <textarea
            value={answerDraft}
            onChange={(e) => setAnswerDraft(e.target.value)}
            placeholder="Type your answer, or record it and we will transcribe."
            style={{ width: "100%", height: 120, resize: "vertical", border: "1px solid #e0e1e6", borderRadius: "var(--r-sm)", padding: "11px 13px", outline: "none", fontSize: "0.90625rem", lineHeight: 1.55, color: "var(--text-900)", background: "var(--field-bg)", marginTop: 16 }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 11 }}>
            <VoiceRecordButton
              recording={isRecording}
              onClick={() => {
                if (isRecording) stopRecording(RECKEY);
                else startRecording(RECKEY, () => answerDraft, (text) => setAnswerDraft(text));
              }}
            />
            <button onClick={submitMockAnswer} disabled={submitDisabled} style={{ border: 0, borderRadius: "var(--r-sm)", padding: "9px 16px", font: "600 0.84375rem 'Instrument Sans',sans-serif", cursor: "pointer", background: "var(--indigo)", color: "var(--surface)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
                  <path d="M20 2v4" />
                  <path d="M22 4h-4" />
                  <circle cx="4" cy="18" r="2" />
                </svg>
                <span>{loading ? "Evaluating…" : "Submit answer"}</span>
              </span>
            </button>
            <span style={{ fontSize: "0.78125rem", color: "var(--red-dark)" }}>{micErrorText}{error}</span>
          </div>

          {feedback && (
            <div style={{ marginTop: 20, borderTop: "1px solid #f1f2f5", paddingTop: 18 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontSize: "0.65625rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--text-lightgray)" }}>Score</span>
                <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-900)" }}>{feedback.score}/10</span>
              </div>
              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
                <div style={{ border: "1px solid #d9f2e5", background: "var(--green-wash)", borderRadius: "var(--r-sm)", padding: "14px 16px" }}>
                  <div style={{ color: "var(--green)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 700 }}>Strengths</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                    {feedback.strengths.map((s, i) => (
                      <div key={i} style={{ fontSize: "0.84375rem", lineHeight: 1.5, color: "var(--green-ink)" }}>{s}</div>
                    ))}
                  </div>
                </div>
                <div style={{ border: "1px solid #f6dede", background: "var(--red-wash)", borderRadius: "var(--r-sm)", padding: "14px 16px" }}>
                  <div style={{ color: "var(--red-dark)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 700 }}>To improve</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                    {feedback.improvements.map((im, i) => (
                      <div key={i} style={{ fontSize: "0.84375rem", lineHeight: 1.5, color: "var(--red-ink)" }}>{im}</div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 14, background: "var(--surface-alt)", border: "1px solid #eceef2", borderRadius: "var(--r-sm)", padding: "14px 16px" }}>
                <div style={{ fontSize: "0.65625rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--indigo)" }}>A stronger version</div>
                <p style={{ margin: "8px 0 0", fontSize: "0.84375rem", lineHeight: 1.55, color: "var(--text-700)" }}>{feedback.sampleBetterAnswer}</p>
              </div>
              {feedback.followUpQuestion && (
                <button onClick={nextMockQuestion} style={{ marginTop: 16, border: 0, borderRadius: "var(--r-sm)", padding: "11px 18px", font: "600 0.875rem 'Instrument Sans',sans-serif", cursor: "pointer", background: "var(--green)", color: "var(--surface)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    Next question
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

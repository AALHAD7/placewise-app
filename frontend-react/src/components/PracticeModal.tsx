import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "../lib/apiClient";

export interface PracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: string;
  difficulty?: string;
  role?: string;
  company?: string;
  topic?: string;
}

interface EvaluationResult {
  score: number;
  rating: "Strong" | "Good" | "Needs Improvement";
  summary: string;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
  keyTakeaway: string;
}

const DIFFICULTY_CONFIG: Record<string, { bg: string; color: string; border: string }> = {
  Easy: { bg: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "rgba(16, 185, 129, 0.3)" },
  Medium: { bg: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", border: "rgba(245, 158, 11, 0.3)" },
  Hard: { bg: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "rgba(239, 68, 68, 0.3)" }
};

export default function PracticeModal({
  isOpen,
  onClose,
  question,
  difficulty = "Medium",
  role = "",
  company = "",
  topic = ""
}: PracticeModalProps) {
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [copiedModel, setCopiedModel] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when modal opens with a new question
  useEffect(() => {
    if (isOpen) {
      setUserAnswer("");
      setEvaluation(null);
      setError(null);
      setCopiedModel(false);
      // Auto-focus textarea on open
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, question]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !evaluating) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, evaluating, onClose]);

  // Lock body & app-shell scroll and notify Lenis when modal is open
  useEffect(() => {
    if (isOpen) {
      const shell = document.querySelector<HTMLElement>(".app-shell");
      if (shell) shell.dataset.modal = "true";
      document.body.dataset.modal = "true";
      const origBodyOverflow = document.body.style.overflow;
      const origHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      return () => {
        if (shell) shell.dataset.modal = "false";
        document.body.dataset.modal = "false";
        document.body.style.overflow = origBodyOverflow;
        document.documentElement.style.overflow = origHtmlOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const diffStyle = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.Medium;
  const wordCount = userAnswer.trim() ? userAnswer.trim().split(/\s+/).length : 0;
  const charCount = userAnswer.length;

  const handleEvaluate = async () => {
    if (userAnswer.trim().length < 5) {
      setError("Please write an answer (at least 5 characters) before evaluating.");
      return;
    }

    setEvaluating(true);
    setError(null);

    try {
      const res = await apiFetch<{ success: boolean; evaluation: EvaluationResult; error?: string }>(
        "/api/roles/evaluate-practice",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role,
            company,
            topic,
            difficulty,
            question,
            userAnswer: userAnswer.trim()
          })
        }
      );

      if (res && res.success && res.evaluation) {
        setEvaluation(res.evaluation);
      } else {
        setError(res?.error || "Failed to evaluate your answer. Please try again.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect to the evaluation service.";
      setError(msg);
    } finally {
      setEvaluating(false);
    }
  };

  const handleCopyModel = () => {
    if (!evaluation?.modelAnswer) return;
    navigator.clipboard.writeText(evaluation.modelAnswer).then(() => {
      setCopiedModel(true);
      setTimeout(() => setCopiedModel(false), 2000);
    });
  };

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case "Strong":
        return { bg: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "rgba(16, 185, 129, 0.3)" };
      case "Good":
        return { bg: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", border: "rgba(59, 130, 246, 0.3)" };
      default:
        return { bg: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "rgba(239, 68, 68, 0.3)" };
    }
  };

  return createPortal(
    <div
      data-lenis-prevent
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(4, 7, 13, 0.78)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflow: "hidden"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !evaluating) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="practice-modal-title"
        data-lenis-prevent
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "760px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg, #10141d 0%, #0a0d13 100%)",
          border: "1px solid rgba(59, 130, 246, 0.35)",
          borderRadius: "16px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            background: "rgba(18, 23, 33, 0.95)",
            borderBottom: "1px solid rgba(59, 130, 246, 0.2)",
            flex: "none"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", minWidth: 0 }}>
            <span
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".08em",
                padding: "3px 10px",
                borderRadius: "999px",
                background: diffStyle.bg,
                color: diffStyle.color,
                border: `1px solid ${diffStyle.border}`
              }}
            >
              {difficulty} Practice
            </span>
            {role && (
              <span style={{ fontSize: "0.8125rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
                <span>{role}</span>
                {company && (
                  <>
                    <span>·</span>
                    <span style={{ color: "#ff8c42", fontWeight: 600 }}>{company}</span>
                  </>
                )}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={evaluating}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "8px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#cbd5e1",
              fontSize: "1.125rem",
              cursor: evaluating ? "not-allowed" : "pointer",
              transition: "all 0.15s ease"
            }}
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div
          data-lenis-prevent
          style={{
            padding: "20px 22px",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            gap: 18
          }}
        >
          {/* Question Card */}
          <div
            style={{
              background: "rgba(22, 28, 40, 0.85)",
              border: "1px solid rgba(59, 130, 246, 0.28)",
              borderRadius: "12px",
              padding: "16px 18px",
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05)"
            }}
          >
            <div
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "#ff6b35",
                marginBottom: 6
              }}
            >
              {topic ? `${topic} · Problem` : "Interview Problem"}
            </div>
            <div
              id="practice-modal-title"
              style={{
                fontSize: "1.0625rem",
                fontWeight: 600,
                lineHeight: 1.55,
                color: "#ffffff"
              }}
            >
              {question}
            </div>
          </div>

          {/* User Answer Input Area */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <label
                htmlFor="practice-answer-input"
                style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#94a3b8" }}
              >
                Your Answer / Response Framework
              </label>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                {wordCount} {wordCount === 1 ? "word" : "words"} · {charCount} chars
              </span>
            </div>
            <textarea
              id="practice-answer-input"
              ref={textareaRef}
              rows={evaluation ? 5 : 7}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={evaluating}
              data-lenis-prevent
              placeholder="Structure your answer here... (e.g., breakdown into MECE drivers, top-down vs bottom-up hypotheses, key levers, or recommended actions)"
              style={{
                width: "100%",
                background: "rgba(9, 12, 18, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                borderRadius: "10px",
                padding: "12px 14px",
                color: "#ffffff",
                fontSize: "0.90625rem",
                lineHeight: 1.6,
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s ease"
              }}
              onFocus={(e) => (e.target.style.borderColor = "#ff6b35")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.16)")}
            />
          </div>

          {/* Error notice */}
          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#f87171",
                fontSize: "0.84375rem",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <button
              type="button"
              onClick={() => {
                setUserAnswer("");
                setEvaluation(null);
                setError(null);
                textareaRef.current?.focus();
              }}
              disabled={evaluating || (!userAnswer && !evaluation)}
              style={{
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "8px",
                padding: "8px 14px",
                color: "#94a3b8",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: evaluating || (!userAnswer && !evaluation) ? "not-allowed" : "pointer",
                opacity: evaluating || (!userAnswer && !evaluation) ? 0.4 : 1
              }}
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleEvaluate}
              disabled={evaluating || userAnswer.trim().length < 5}
              style={{
                background: evaluating
                  ? "rgba(255, 107, 53, 0.4)"
                  : "linear-gradient(135deg, #ff6b35 0%, #ea580c 100%)",
                border: "none",
                borderRadius: "8px",
                padding: "10px 22px",
                color: "#ffffff",
                fontSize: "0.875rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: evaluating || userAnswer.trim().length < 5 ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(255, 107, 53, 0.35)",
                transition: "all 0.15s ease",
                opacity: userAnswer.trim().length < 5 ? 0.5 : 1
              }}
            >
              {evaluating ? (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      width: 14,
                      height: 14,
                      border: "2px solid #ffffff",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite"
                    }}
                  />
                  <span>Evaluating with Gemini…</span>
                </>
              ) : (
                <>
                  <span>✦</span>
                  <span>{evaluation ? "Re-evaluate Answer" : "Evaluate Answer"}</span>
                </>
              )}
            </button>
          </div>

          {/* Evaluation Results Card */}
          {evaluation && (
            <div
              style={{
                marginTop: 8,
                background: "rgba(15, 20, 29, 0.95)",
                border: "1px solid rgba(59, 130, 246, 0.35)",
                borderRadius: "14px",
                padding: "20px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)"
              }}
            >
              {/* Score Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: 14,
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  flexWrap: "wrap",
                  gap: 10
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      fontSize: "1.375rem",
                      fontWeight: 800,
                      color: "#ffffff",
                      letterSpacing: "-0.02em"
                    }}
                  >
                    {evaluation.score} <span style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 500 }}>/ 10</span>
                  </div>
                  {(() => {
                    const rStyle = getRatingBadge(evaluation.rating);
                    return (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "999px",
                          background: rStyle.bg,
                          color: rStyle.color,
                          border: `1px solid ${rStyle.border}`
                        }}
                      >
                        {evaluation.rating}
                      </span>
                    );
                  })()}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  AI Interview Coach Assessment
                </div>
              </div>

              {/* Summary */}
              {evaluation.summary && (
                <p style={{ margin: "14px 0 16px", fontSize: "0.875rem", lineHeight: 1.6, color: "#e2e8f0" }}>
                  {evaluation.summary}
                </p>
              )}

              {/* Strengths & Improvements Columns */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 18 }}>
                {/* Strengths */}
                {evaluation.strengths && evaluation.strengths.length > 0 && (
                  <div
                    style={{
                      background: "rgba(16, 185, 129, 0.06)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      borderRadius: "10px",
                      padding: "12px 14px"
                    }}
                  >
                    <div style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#34d399", marginBottom: 8 }}>
                      Strengths
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.84375rem", lineHeight: 1.55, color: "#cbd5e1" }}>
                      {evaluation.strengths.map((s, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {evaluation.improvements && evaluation.improvements.length > 0 && (
                  <div
                    style={{
                      background: "rgba(245, 158, 11, 0.06)",
                      border: "1px solid rgba(245, 158, 11, 0.2)",
                      borderRadius: "10px",
                      padding: "12px 14px"
                    }}
                  >
                    <div style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#fbbf24", marginBottom: 8 }}>
                      Areas for Improvement
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.84375rem", lineHeight: 1.55, color: "#cbd5e1" }}>
                      {evaluation.improvements.map((imp, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Model Answer (Benchmark) */}
              {evaluation.modelAnswer && (
                <div
                  style={{
                    background: "rgba(22, 28, 40, 0.9)",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    borderRadius: "10px",
                    overflow: "hidden",
                    marginBottom: 14
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "9px 14px",
                      background: "rgba(28, 36, 52, 0.9)",
                      borderBottom: "1px solid rgba(59, 130, 246, 0.2)"
                    }}
                  >
                    <span style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#60a5fa" }}>
                      Benchmark Model Answer
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyModel}
                      style={{
                        background: copiedModel ? "rgba(52, 211, 153, 0.15)" : "rgba(255, 255, 255, 0.08)",
                        border: "1px solid " + (copiedModel ? "rgba(52, 211, 153, 0.35)" : "rgba(255, 255, 255, 0.15)"),
                        borderRadius: "6px",
                        padding: "3px 10px",
                        color: copiedModel ? "#34d399" : "#cbd5e1",
                        fontSize: "0.71875rem",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      {copiedModel ? "Copied ✓" : "Copy Model Answer"}
                    </button>
                  </div>
                  <div
                    style={{
                      padding: "14px 16px",
                      fontSize: "0.84375rem",
                      lineHeight: 1.6,
                      color: "#e2e8f0",
                      whiteSpace: "pre-wrap",
                      fontFamily: "inherit"
                    }}
                  >
                    {evaluation.modelAnswer}
                  </div>
                </div>
              )}

              {/* Key Takeaway */}
              {evaluation.keyTakeaway && (
                <div
                  style={{
                    background: "rgba(255, 107, 53, 0.08)",
                    border: "1px solid rgba(255, 107, 53, 0.25)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    fontSize: "0.8125rem",
                    lineHeight: 1.55,
                    color: "#ffedd5",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8
                  }}
                >
                  <span style={{ color: "#ff6b35", fontSize: "1rem" }}>💡</span>
                  <div>
                    <strong style={{ color: "#ff8c42" }}>Key Takeaway: </strong>
                    {evaluation.keyTakeaway}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}


import { useState } from "react";
import { parseGuesstimateCalculation, type GuesstimateCalculationData } from "../lib/guesstimateCalculation";

interface Props {
  markdown: string;
  rawProblem?: string;
  style?: React.CSSProperties;
}

export default function GuesstimateCalculationView({ markdown, rawProblem, style }: Props) {
  const data: GuesstimateCalculationData = parseGuesstimateCalculation(markdown, rawProblem);
  const [copied, setCopied] = useState(false);
  const [activeBranchIndex, setActiveBranchIndex] = useState<number>(0);

  if (!data.hasCalculations) {
    return null;
  }

  function handleCopy() {
    let text = "=== STEP-BY-STEP GUESSTIMATE CALCULATION ===\n\n";

    if (data.basePopulation) {
      text += `Starting Base: ${data.basePopulation}\n\n`;
    }

    if (data.assumptions.length > 0) {
      text += "KEY ASSUMPTIONS:\n";
      data.assumptions.forEach((a, i) => {
        text += `${i + 1}. ${a}\n`;
      });
      text += "\n";
    }

    if (data.branches.length > 0) {
      text += "STEP-BY-STEP CALCULATION TRACKS:\n";
      data.branches.forEach((b, bi) => {
        text += `\n[Track ${bi + 1}: ${b.name}]\n`;
        b.steps.forEach((s, si) => {
          text += `  Step ${si + 1}: ${s.label}\n`;
        });
        if (b.subtotal) {
          text += `  = Track Result: ${b.subtotal}\n`;
        }
      });
      text += "\n";
    }

    if (data.flowFormulas.length > 0) {
      text += "CALCULATION FORMULAS:\n";
      data.flowFormulas.forEach((f) => {
        text += `• ${f}\n`;
      });
      text += "\n";
    }

    if (data.conclusion) {
      text += `FINAL COMPUTED RESULT:\n${data.conclusion}\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      style={{
        background: "rgba(15, 20, 29, 0.95)",
        border: "1px solid rgba(59, 130, 246, 0.3)",
        borderRadius: "14px",
        padding: "20px 22px",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
        marginTop: 18,
        ...style
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          paddingBottom: 14,
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem"
            }}
          >
            🔢
          </div>
          <div>
            <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
              Step-by-Step Calculation (Plain Text)
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>
              Linear mathematical breakdown derived directly from the diagram and casebook working
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            borderRadius: "6px",
            fontSize: "0.75rem",
            fontWeight: 600,
            background: copied ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.06)",
            border: `1px solid ${copied ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.15)"}`,
            color: copied ? "#34d399" : "var(--text-gray2)",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <span>{copied ? "✓" : "📋"}</span>
          <span>{copied ? "Copied" : "Copy calculation text"}</span>
        </button>
      </div>

      {/* Assumptions Pills */}
      {data.assumptions.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: "0.65625rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".1em",
              color: "#94a3b8",
              marginBottom: 8
            }}
          >
            Key Underlying Assumptions
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.assumptions.map((assump, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  fontSize: "0.8125rem",
                  lineHeight: 1.5,
                  color: "#cbd5e1",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "6px",
                  padding: "6px 10px"
                }}
              >
                <span style={{ color: "#60a5fa", fontWeight: 700, flexShrink: 0 }}>{idx + 1}.</span>
                <span>{assump}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step-by-Step Tracks from Tree */}
      {data.branches.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 10
            }}
          >
            <div
              style={{
                fontSize: "0.65625rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".1em",
                color: "#94a3b8"
              }}
            >
              Calculation Tracks ({data.branches.length} {data.branches.length === 1 ? "track" : "tracks"})
            </div>

            {/* Quick Track Selector Pills if multiple tracks */}
            {data.branches.length > 1 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {data.branches.map((b, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveBranchIndex(i)}
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: "4px",
                      border: "none",
                      cursor: "pointer",
                      background: activeBranchIndex === i ? "rgba(59, 130, 246, 0.35)" : "rgba(255, 255, 255, 0.05)",
                      color: activeBranchIndex === i ? "#93c5fd" : "rgba(255, 255, 255, 0.6)",
                      transition: "all 0.15s ease"
                    }}
                  >
                    Track {i + 1}: {b.name.slice(0, 24)}…
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active Track Display */}
          {(() => {
            const currentBranch = data.branches[activeBranchIndex] || data.branches[0];
            return (
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.25)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px",
                  padding: "16px 18px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: "0.84375rem", fontWeight: 700, color: "#60a5fa" }}>
                    📍 Track {activeBranchIndex + 1}: {currentBranch.name}
                  </div>
                  {currentBranch.subtotal && (
                    <div
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#34d399",
                        background: "rgba(16, 185, 129, 0.12)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        padding: "2px 8px",
                        borderRadius: "4px"
                      }}
                    >
                      Result: {currentBranch.subtotal}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {currentBranch.steps.map((step, sIdx) => {
                    const isLast = sIdx === currentBranch.steps.length - 1;
                    return (
                      <div
                        key={sIdx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          fontSize: "0.8125rem",
                          lineHeight: 1.5,
                          padding: "6px 10px",
                          borderRadius: "6px",
                          background: isLast ? "rgba(16, 185, 129, 0.08)" : "rgba(255, 255, 255, 0.02)",
                          border: isLast ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(255, 255, 255, 0.04)"
                        }}
                      >
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: isLast ? "#10b981" : "rgba(59, 130, 246, 0.2)",
                            color: isLast ? "#000000" : "#93c5fd",
                            fontSize: "0.6875rem",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}
                        >
                          {sIdx + 1}
                        </div>
                        <div style={{ flex: 1, color: isLast ? "#e2e8f0" : "#cbd5e1" }}>
                          {sIdx === 0 && <span style={{ color: "#94a3b8", fontWeight: 600 }}>Starting Pool: </span>}
                          {sIdx > 0 && !isLast && <span style={{ color: "#94a3b8", fontWeight: 600 }}>Filter / Split: </span>}
                          {isLast && <span style={{ color: "#34d399", fontWeight: 700 }}>Computed Pool: </span>}
                          <strong>{step.label}</strong>
                        </div>
                        {step.factor && (
                          <div
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              color: "#fbbf24",
                              background: "rgba(245, 158, 11, 0.15)",
                              border: "1px solid rgba(245, 158, 11, 0.3)",
                              padding: "2px 6px",
                              borderRadius: "4px"
                            }}
                          >
                            {step.factor}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Formula & Multipliers */}
      {data.flowFormulas.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              fontSize: "0.65625rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".1em",
              color: "#94a3b8",
              marginBottom: 8
            }}
          >
            Mathematical Working &amp; Formula
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.flowFormulas.map((f, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(59, 130, 246, 0.08)",
                  border: "1px solid rgba(59, 130, 246, 0.25)",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "0.84375rem",
                  lineHeight: 1.6,
                  color: "#e0f2fe",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  overflowX: "auto"
                }}
              >
                <span style={{ color: "#60a5fa", fontWeight: 800 }}>f(x)</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Descriptive Math Notes */}
      {data.mathNotes.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: "0.65625rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".1em",
              color: "#94a3b8",
              marginBottom: 6
            }}
          >
            Arithmetic Logic Notes
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.mathNotes.map((note, i) => (
              <div
                key={i}
                style={{
                  fontSize: "0.8125rem",
                  lineHeight: 1.5,
                  color: "#94a3b8",
                  paddingLeft: 10,
                  borderLeft: "2px solid rgba(59, 130, 246, 0.4)"
                }}
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Calculated Conclusion */}
      {data.conclusion && (
        <div
          style={{
            marginTop: 18,
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.2) 100%)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            borderRadius: "10px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10
          }}
        >
          <div>
            <div style={{ fontSize: "0.65625rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "#34d399" }}>
              Final Answer
            </div>
            <div style={{ fontSize: "1rem", fontWeight: 800, color: "#ffffff", marginTop: 2 }}>
              {data.conclusion}
            </div>
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "999px",
              background: "rgba(16, 185, 129, 0.25)",
              color: "#a7f3d0",
              border: "1px solid rgba(16, 185, 129, 0.4)"
            }}
          >
            Verified Casebook Solution
          </div>
        </div>
      )}
    </div>
  );
}

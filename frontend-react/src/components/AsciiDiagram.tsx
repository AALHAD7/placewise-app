import { useState } from "react";

interface AsciiDiagramProps {
  title?: string;
  ascii: string;
  subtitle?: string;
  className?: string;
}

export default function AsciiDiagram({ title, ascii, subtitle, className = "" }: AsciiDiagramProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ascii).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div
      className={`ascii-diagram-container ${className}`}
      style={{
        marginTop: 14,
        marginBottom: 14,
        borderRadius: "var(--r-md)",
        border: "1px solid rgba(59, 130, 246, 0.3)",
        background: "linear-gradient(180deg, #0e121a 0%, #090c12 100%)",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 14px",
          background: "rgba(22, 27, 36, 0.9)",
          borderBottom: "1px solid rgba(59, 130, 246, 0.2)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: "0.6875rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".08em",
              color: "#ff6b35",
              background: "rgba(255, 107, 53, 0.12)",
              padding: "2px 8px",
              borderRadius: "var(--r-pill)",
              border: "1px solid rgba(255, 107, 53, 0.25)"
            }}
          >
            ASCII Visual Model
          </span>
          {title && (
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#ffffff" }}>
              {title}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="unbutton"
          style={{
            fontSize: "0.71875rem",
            fontWeight: 600,
            color: copied ? "#34d399" : "rgba(255, 255, 255, 0.7)",
            background: copied ? "rgba(52, 211, 153, 0.15)" : "rgba(255, 255, 255, 0.08)",
            border: "1px solid " + (copied ? "rgba(52, 211, 153, 0.35)" : "rgba(255, 255, 255, 0.15)"),
            padding: "3px 10px",
            borderRadius: "var(--r-sm)",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          {copied ? "Copied ✓" : "Copy ASCII"}
        </button>
      </div>

      {subtitle && (
        <div style={{ padding: "6px 14px 0", fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.65)" }}>
          {subtitle}
        </div>
      )}

      <pre
        style={{
          margin: 0,
          padding: "16px 18px",
          fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
          fontSize: "0.8125rem",
          lineHeight: 1.45,
          color: "#e2e8f0",
          overflowX: "auto",
          whiteSpace: "pre",
          tabSize: 2
        }}
      >
        {ascii}
      </pre>
    </div>
  );
}


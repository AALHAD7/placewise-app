import type { ProbeVM } from "../hooks/useProbe";

// Ported from frontend/index.html's 3 near-identical probe blocks: points
// (726-762, What?/Why?, shows quote), frameworks (781-816, What?/Why?/How to
// apply, no quote), walkthrough (832-867, What?/Why?, shows quote) - see
// migration plan §0.6. `showHow` and `showQuote` cover that variance.

interface ProbeChatProps {
  probe: ProbeVM;
  showHow?: boolean;
  showQuote?: boolean;
}

export default function ProbeChat({ probe: p, showHow, showQuote = true }: ProbeChatProps) {
  if (!p.show) return null;
  return (
    <>
      <div style={{ display: "flex", gap: 7, marginTop: 7, marginLeft: 14 }}>
        <span onClick={p.what} className="probe-trigger" style={{ padding: "3px 9px", border: "1px solid #e5e7eb", borderRadius: 999, fontSize: 11.5, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
          What?
        </span>
        <span onClick={p.why} className="probe-trigger-why" style={{ padding: "3px 9px", border: "1px solid #e5e7eb", borderRadius: 999, fontSize: 11.5, fontWeight: 600, color: "#4F46E5", cursor: "pointer" }}>
          Why?
        </span>
        {showHow && (
          <span onClick={p.how} className="probe-trigger-how" style={{ padding: "3px 9px", border: "1px solid #e5e7eb", borderRadius: 999, fontSize: 11.5, fontWeight: 600, color: "#047857", cursor: "pointer" }}>
            How to apply
          </span>
        )}
      </div>

      {p.open && (
        <div style={{ margin: "10px 0 0 14px", border: "1px solid #e0e1e6", borderRadius: 14, background: "#fff", boxShadow: "0 10px 26px -14px rgba(16,24,40,.3)", padding: "13px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#6b7280" }}>{p.title}</span>
            <span onClick={p.close} className="probe-close" style={{ cursor: "pointer", color: "#9ca3af", fontSize: 15, lineHeight: 1 }}>
              ×
            </span>
          </div>
          <div style={{ marginTop: 7, fontSize: 12, color: "#9ca3af" }}>{p.context}</div>
          {showQuote && (
            <div style={{ marginTop: 8, padding: "9px 11px", borderLeft: "2px solid #BBD3F7", background: "#F3F7FE", fontSize: 12.5, lineHeight: 1.5, color: "#4b5563" }}>{p.quote}</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 11 }}>
            {p.messages.map((m, i) => (
              <div key={i} style={m.style}>
                {m.text}
              </div>
            ))}
          </div>
          {p.loading && <div style={{ marginTop: 10, fontSize: 13, color: "#9ca3af" }}>Thinking...</div>}
          {p.hasError && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, color: "#b91c1c" }}>{p.error}</span>
              <span onClick={p.retry} style={{ fontSize: 12.5, fontWeight: 600, color: "#4F46E5", cursor: "pointer" }}>
                Retry
              </span>
            </div>
          )}
          {p.showInput && (
            <div style={{ display: "flex", gap: 8, marginTop: 11 }}>
              <input
                value={p.draft}
                onChange={p.onDraft}
                onKeyDown={p.onKeyDown}
                placeholder={p.placeholder}
                className="probe-input"
                style={{ flex: 1, minWidth: 0, border: "1px solid #e5e7eb", borderRadius: 9, padding: "9px 11px", font: "400 13.5px 'Instrument Sans',sans-serif", color: "#111827", outline: "none", background: "#fbfbfd" }}
              />
              <button onClick={p.send} style={{ flex: "none", border: 0, borderRadius: 9, background: "#4338CA", color: "#fff", font: "600 13px 'Instrument Sans',sans-serif", padding: "0 15px", cursor: "pointer" }}>
                Send
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

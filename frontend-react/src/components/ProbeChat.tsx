import type { ProbeVM } from "../hooks/useProbe";
import IndeterminateProgressBar from "./IndeterminateProgressBar";
import GroundingNote from "./GroundingNote";

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
        <button type="button" onClick={p.what} className="unbutton probe-trigger" style={{ padding: "3px 9px", border: "1px solid var(--border-soft)", borderRadius: "var(--r-pill)", fontSize: "0.71875rem", fontWeight: 600, color: "var(--text-700)", cursor: "pointer" }}>
          What?
        </button>
        <button type="button" onClick={p.why} className="unbutton probe-trigger-why" style={{ padding: "3px 9px", border: "1px solid var(--border-soft)", borderRadius: "var(--r-pill)", fontSize: "0.71875rem", fontWeight: 600, color: "var(--indigo)", cursor: "pointer" }}>
          Why?
        </button>
        {showHow && (
          <button type="button" onClick={p.how} className="unbutton probe-trigger-how" style={{ padding: "3px 9px", border: "1px solid var(--border-soft)", borderRadius: "var(--r-pill)", fontSize: "0.71875rem", fontWeight: 600, color: "var(--green-dark)", cursor: "pointer" }}>
            How to apply
          </button>
        )}
      </div>

      {p.open && (
        <div style={{ margin: "10px 0 0 14px", border: "1px solid var(--card-border)", borderRadius: "var(--r-md)", background: "var(--surface)", padding: "13px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-gray2)" }}>{p.title}</span>
            <button type="button" onClick={p.close} aria-label="Close" className="unbutton probe-close" style={{ cursor: "pointer", color: "var(--text-lightgray)", fontSize: "0.9375rem", lineHeight: 1, padding: "2px 4px" }}>
              ×
            </button>
          </div>
          <div style={{ marginTop: 7, fontSize: "0.75rem", color: "var(--text-lightgray)" }}>{p.context}</div>
          {showQuote && (
            <div style={{ marginTop: 8, padding: "9px 11px", borderLeft: "2px solid var(--border-focus)", background: "var(--blue-wash)", fontSize: "0.78125rem", lineHeight: 1.5, color: "var(--text-600)" }}>{p.quote}</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 11 }}>
            {p.messages.map((m, i) => (
              <div key={i} style={m.style}>
                {m.text}
              </div>
            ))}
          </div>
          {p.loading && (
            <div role="status" aria-live="polite" style={{ marginTop: 10 }}>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-lightgray)" }}>Thinking…</div>
              <IndeterminateProgressBar />
            </div>
          )}
          {/* R8: only what/why/how carry a grounding decision (pushback is
              explicitly ungrounded - groundedInCasebooks stays null there). */}
          {!p.loading && p.groundedInCasebooks !== null && (
            <GroundingNote groundedInCasebooks={p.groundedInCasebooks} />
          )}
          {p.contentCheckNotice && !p.loading && (
            <div role="alert" style={{ marginTop: 10, padding: "8px 10px", borderRadius: "var(--r-sm)", background: "#fdf3e3", color: "var(--amber-ink)", fontSize: "0.78125rem", lineHeight: 1.5 }}>
              {p.contentCheckNotice}
            </div>
          )}
          {p.hasError && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <span role="alert" style={{ fontSize: "0.8125rem", color: "var(--red-dark)" }}>{p.error}</span>
              <button type="button" onClick={p.retry} className="unbutton" style={{ fontSize: "0.78125rem", fontWeight: 600, color: "var(--indigo)", cursor: "pointer" }}>
                Retry
              </button>
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
                style={{ flex: 1, minWidth: 0, border: "1px solid var(--border-soft)", borderRadius: "var(--r-sm)", padding: "9px 11px", font: "400 0.84375rem 'Instrument Sans',sans-serif", color: "var(--text-900)", outline: "none", background: "var(--field-bg-alt)" }}
              />
              <button onClick={p.send} style={{ flex: "none", border: 0, borderRadius: "var(--r-sm)", background: "var(--indigo-700)", color: "var(--surface)", font: "600 0.8125rem 'Instrument Sans',sans-serif", padding: "0 15px", cursor: "pointer" }}>
                Send
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

import { useEffect, useState } from "react";
import { apiFetch, logActivity } from "../lib/apiClient";
import { ICON_D } from "../lib/constants";
import PageHeader from "../components/PageHeader";
import type { Framework, FrameworksResponse } from "../types/api";

// Ported from frontend/index.html: loadFrameworks() (2667-2679),
// frameworksPanel() (2681-2711), markup (1527-1572). Fetched on mount here
// (the old app fetched on nav click instead - mount is the direct
// equivalent now that navigating here is a real route change, per
// migration plan §0.9).

export default function FrameworksPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [list, setList] = useState<Framework[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    apiFetch<FrameworksResponse>("/api/frameworks", {}, "Failed to load frameworks.")
      .then((data) => {
        if (cancelled) return;
        setLoading(false);
        setList(data.frameworks || []);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoading(false);
        setError(e instanceof Error ? e.message : "Could not reach the backend.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const empty = !loading && !error && list.length === 0;

  function toggle(f: Framework) {
    const opening = !open[f.id];
    setOpen((s) => ({ ...s, [f.id]: !s[f.id] }));
    // Fires only on opening, not closing - matches the old app exactly
    // (only count it as "reviewed" once actually opened).
    if (opening) logActivity("framework_review", f.name);
  }

  return (
    <>
      <PageHeader title="Frameworks" subtitle="Frameworks tuned to your target loops" />

      {loading && <div style={{ marginTop: 26, color: "#6b7280", fontSize: 13.5 }}>Loading frameworks…</div>}
      {error && <div style={{ marginTop: 26, color: "#b91c1c", fontSize: 13 }}>{error}</div>}
      {empty && <div style={{ marginTop: 26, color: "#9ca3af", fontSize: 13.5 }}>No frameworks yet.</div>}

      <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 12 }}>
        {list.map((f) => {
          const isOpen = !!open[f.id];
          const meta = (f.role || "General") + (f.level ? " · " + String(f.level).toUpperCase() : "");
          const hasExample = !!f.example;
          const hasGroundedExample = !!(f.grounded_example && f.grounded_example.excerpt);
          const groundedExcerpt = f.grounded_example
            ? f.grounded_example.excerpt.length > 420
              ? f.grounded_example.excerpt.slice(0, 420).trim() + "…"
              : f.grounded_example.excerpt
            : "";
          const steps = Array.isArray(f.steps) ? f.steps : [];

          return (
            <div key={f.id} style={{ background: "#fff", border: "1px solid #e9eaee", borderRadius: 14, boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 600, color: "#111827" }}>{f.name}</div>
                  <div style={{ marginTop: 5, color: "#6b7280", fontSize: 13.5 }}>{meta}</div>
                </div>
                <span
                  onClick={() => toggle(f)}
                  style={{ flex: "none", display: "flex", alignItems: "center", gap: 4, color: "#4F46E5", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  {isOpen ? "Hide" : "Review"}
                  <morph-icon icon={isOpen ? ICON_D.CHEVRON_UP : ICON_D.CHEVRON_DOWN} style={{ width: 14, height: 14, color: "#4F46E5" }}></morph-icon>
                </span>
              </div>
              {isOpen && (
                <div className="t-panel-in" style={{ marginTop: 16, borderTop: "1px solid #f1f2f5", paddingTop: 14 }}>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#374151", textWrap: "pretty" as const }}>{f.description}</p>
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    {steps.map((step, i) => (
                      <div key={i} style={{ fontSize: 13.5, lineHeight: 1.55, color: "#111827", textWrap: "pretty" as const }}>
                        • {step}
                      </div>
                    ))}
                  </div>
                  {hasExample && (
                    <div style={{ marginTop: 12, background: "#f8f8fb", border: "1px solid #eceef2", borderRadius: 9, padding: "12px 14px" }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#9ca3af" }}>Example</div>
                      <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "#374151", textWrap: "pretty" as const }}>{f.example}</p>
                    </div>
                  )}
                  {hasGroundedExample && (
                    <div style={{ marginTop: 12, background: "#eef6f1", border: "1px solid #cdeeda", borderRadius: 9, padding: "12px 14px" }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#059669" }}>
                        From our casebooks — {f.grounded_example?.sourceFile}
                      </div>
                      <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "#374151", textWrap: "pretty" as const, whiteSpace: "pre-wrap" }}>
                        {groundedExcerpt}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

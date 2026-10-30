import { useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient";
import type { AdminUsageResponse } from "../types/api";
import ReviewQueue from "./admin/ReviewQueue";

// Phase 1.6 item 1. No client-side admin flag anywhere on this page by
// design (the spec's own "never trust a client-side flag") - this just
// attempts the data fetch and, on a 404 (the real gate lives server-side in
// middleware/admin.js), renders a plain "not found" indistinguishable from
// any other dead route. There's deliberately no special "access denied" UI
// that would itself confirm the route exists to a non-admin.
export default function AdminPage() {
  const [data, setData] = useState<AdminUsageResponse | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [resolving, setResolving] = useState<string | null>(null);

  function load() {
    apiFetch<AdminUsageResponse>("/api/admin/usage", {}, "")
      .then(setData)
      .catch(() => setNotFound(true));
  }

  useEffect(() => {
    load();
  }, []);

  async function resolveAlert(id: string) {
    setResolving(id);
    try {
      await apiFetch(`/api/admin/alerts/${id}/resolve`, { method: "POST" }, "Failed to resolve alert.");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resolve alert.");
    } finally {
      setResolving(null);
    }
  }

  if (notFound) {
    return (
      <div style={{ marginTop: 60, textAlign: "center", color: "var(--text-gray2)" }}>
        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-900)" }}>404</div>
        <div style={{ marginTop: 8 }}>This page doesn't exist.</div>
      </div>
    );
  }

  if (!data) {
    return <div style={{ marginTop: 28, color: "var(--text-lightgray)" }}>Loading…</div>;
  }

  return (
    <>
      <h1 style={{ margin: 0, fontSize: "var(--fs-heading)", fontWeight: 700, color: "var(--text-900)" }}>Usage</h1>
      <p style={{ margin: "8px 0 0", color: "var(--text-gray2)" }}>Today, UTC.</p>

      {error && <div style={{ marginTop: 16, color: "var(--red-dark)", fontSize: "0.84375rem" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 14, marginTop: 24 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--card-border)", borderRadius: "var(--r-md)", padding: "16px 18px" }}>
          <div style={{ fontSize: "0.65625rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-lightgray)", fontWeight: 600 }}>Total LLM calls</div>
          <div style={{ marginTop: 8, fontSize: "1.75rem", fontWeight: 700, color: "var(--text-900)" }}>{data.totalCallsToday}</div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--card-border)", borderRadius: "var(--r-md)", padding: "16px 18px" }}>
          <div style={{ fontSize: "0.65625rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-lightgray)", fontWeight: 600 }}>Key source</div>
          <div style={{ marginTop: 8, fontSize: "0.9375rem", color: "var(--text-900)" }}>
            platform: {data.keySource.platform} · byok: {data.keySource.byok}
          </div>
          <div style={{ marginTop: 4, fontSize: "0.71875rem", color: "var(--text-lightgray)" }}>No BYOK exists in this app yet - always platform.</div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--card-border)", borderRadius: "var(--r-md)", padding: "16px 18px" }}>
          <div style={{ fontSize: "0.65625rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-lightgray)", fontWeight: 600 }}>Model escalations</div>
          <div style={{ marginTop: 8, fontSize: "1.75rem", fontWeight: 700, color: "var(--text-900)" }}>{data.escalationsToday}</div>
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-900)" }}>Calls by feature</div>
        <div style={{ marginTop: 10, border: "1px solid var(--card-border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
          {data.callsByFeature.length === 0 ? (
            <div style={{ padding: 16, fontSize: "0.84375rem", color: "var(--text-lightgray)" }}>No calls logged today.</div>
          ) : (
            data.callsByFeature.map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderTop: i ? "1px solid var(--card-border)" : "none", fontSize: "0.84375rem" }}>
                <span style={{ color: "var(--text-900)" }}>{row.feature} <span style={{ color: "var(--text-lightgray)" }}>· {row.callType}</span></span>
                <span style={{ fontWeight: 700, color: "var(--text-900)" }}>{row.count}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-900)" }}>Open alerts</div>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {data.openAlerts.length === 0 ? (
            <div style={{ fontSize: "0.84375rem", color: "var(--text-lightgray)" }}>No open alerts.</div>
          ) : (
            data.openAlerts.map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, border: "1px solid var(--card-border)", borderRadius: "var(--r-md)", padding: "12px 16px" }}>
                <div>
                  <div style={{ fontSize: "0.84375rem", fontWeight: 600, color: "var(--text-900)" }}>{a.kind}</div>
                  <div style={{ marginTop: 2, fontSize: "0.78125rem", color: "var(--text-gray2)" }}>{a.message}</div>
                </div>
                <button
                  type="button"
                  onClick={() => resolveAlert(a.id)}
                  disabled={resolving === a.id}
                  className="unbutton"
                  style={{ flex: "none", padding: "7px 12px", borderRadius: "var(--r-sm)", border: "1px solid var(--card-border)", background: "var(--surface)", fontSize: "0.78125rem", fontWeight: 600, color: "var(--indigo)", cursor: "pointer" }}
                >
                  {resolving === a.id ? "…" : "Mark resolved"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* R5.3: only reached after /api/admin/usage succeeded (admin-only, same 404 gate). */}
      <section style={{ marginTop: 40, borderTop: "1px solid var(--card-border)", paddingTop: 24 }} aria-labelledby="ingestion-review-heading">
        <h2 id="ingestion-review-heading" style={{ margin: 0, fontSize: "var(--fs-title)", fontWeight: 700, color: "var(--text-900)" }}>Ingestion review</h2>
        <ReviewQueue />
      </section>
    </>
  );
}

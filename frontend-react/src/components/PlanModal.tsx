import { useState } from "react";
import { apiFetch } from "../lib/apiClient";
import type { GeneratePlanResponse, PlanDay } from "../types/api";

// Same 10 domains as the Tone Shifter dropdown and backend/src/routes/
// plan.js's DOMAINS - one canonical list, kept as a second copy the same
// way CANONICAL_ROLES documents its own duplication (lib/constants.ts):
// a plain literal list needs no network round-trip to populate a <select>.
const DOMAINS = [
  "Consulting", "Product Management", "Finance and Banking", "Marketing",
  "Sales and Business Development", "Operations and Supply Chain", "Data and Analytics",
  "IT and Technology", "Human Resources", "General Management"
];

function tomorrowISODate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function PlanModal({
  isGuest,
  onClose,
  onGenerated
}: {
  isGuest: boolean;
  onClose: () => void;
  onGenerated: (days: PlanDay[], saved: boolean) => void;
}) {
  const [targetRole, setTargetRole] = useState("");
  const [domain, setDomain] = useState(DOMAINS[0]);
  const [interviewDate, setInterviewDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!targetRole.trim()) return setError("Enter your target role.");
    if (!interviewDate) return setError("Pick your interview date.");
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<GeneratePlanResponse>(
        "/api/plan/generate",
        { method: "POST", body: JSON.stringify({ targetRole: targetRole.trim(), domain, interviewDate, hoursPerDay }) },
        "Failed to generate your plan."
      );
      onGenerated(res.days, res.saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate your plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="home-modal" role="dialog" aria-label="Create my 7-day plan" aria-modal="true">
        <h2>Create my plan</h2>
        <p style={{ marginTop: 6, fontSize: "0.84375rem", color: "var(--home-body)" }}>
          A 3-day prep plan based on your target role, domain and interview date.
        </p>

        <div className="home-field">
          <label htmlFor="plan-role">Target role</label>
          <input id="plan-role" type="text" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Product Manager" maxLength={150} />
        </div>

        <div className="home-field">
          <label htmlFor="plan-domain">Domain</label>
          <select id="plan-domain" value={domain} onChange={(e) => setDomain(e.target.value)}>
            {DOMAINS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="home-field">
          <label htmlFor="plan-date">Interview date</label>
          <input id="plan-date" type="date" min={tomorrowISODate()} value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
        </div>

        <div className="home-field">
          <label htmlFor="plan-hours">Hours per day</label>
          <select id="plan-hours" value={hoursPerDay} onChange={(e) => setHoursPerDay(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((h) => (
              <option key={h} value={h}>{h} hour{h > 1 ? "s" : ""}</option>
            ))}
          </select>
        </div>

        {isGuest && (
          <div className="home-plan-note" style={{ marginTop: 12 }}>Sign in to save this plan.</div>
        )}
        {error && <div className="home-modal-error">{error}</div>}

        <div className="home-modal-actions">
          <button type="button" className="home-btn home-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="home-btn home-btn-primary" onClick={submit} disabled={loading}>
            {loading ? "Generating…" : "Create my 3-day plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

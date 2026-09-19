import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/apiClient";
import PageHeader from "../components/PageHeader";
import type { CommunityContribution, CommunityContributionType, CommunityContributeResponse, CommunityListResponse } from "../types/api";

// Ported from frontend/index.html: loadCommunity()/submitCommunityContribution()
// (2716-2753), communityPanel() (2755-2789), markup (1574-1611). Public read,
// auth required to submit, matching the backend's own gating (community.js).

const TYPES: CommunityContributionType[] = ["interview_qa", "case_study", "framework"];
const TYPE_LABELS: Record<CommunityContributionType, string> = {
  interview_qa: "Interview Q&A",
  case_study: "Case study",
  framework: "Framework"
};

function statusLabel(status: string): string {
  if (status === "verified" || status === "approved" || status === "auto_approved") return "Verified";
  if (status === "rejected") return "Rejected";
  return "Pending review";
}

function statusColor(status: string): string {
  if (status === "verified" || status === "approved" || status === "auto_approved") return "#059669";
  if (status === "rejected") return "#b91c1c";
  return "#9ca3af";
}

export default function CommunityPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [list, setList] = useState<CommunityContribution[]>([]);

  const [type, setType] = useState<CommunityContributionType>("interview_qa");
  const [company, setCompany] = useState(() => searchParams.get("company") || "");
  const [role, setRole] = useState("");
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    if (searchParams.toString()) setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadCommunity() {
    setLoading(true);
    setError("");
    apiFetch<CommunityListResponse>("/api/community", {}, "Failed to load contributions.")
      .then((data) => {
        setLoading(false);
        setList(data.contributions || []);
      })
      .catch((e) => {
        setLoading(false);
        setError(e instanceof Error ? e.message : "Could not reach the backend.");
      });
  }

  useEffect(() => {
    loadCommunity();
  }, []);

  function submit() {
    const content = draft.trim();
    if (content.length < 10 || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    setSubmitMessage("");
    apiFetch<CommunityContributeResponse>(
      "/api/community/contribute",
      {
        method: "POST",
        body: JSON.stringify({
          type,
          company: company.trim() || undefined,
          role: role.trim() || undefined,
          content
        })
      },
      "Failed to submit."
    )
      .then((data) => {
        setSubmitting(false);
        setDraft("");
        setCompany("");
        setRole("");
        setSubmitMessage(data.message || "Thanks - submitted.");
        loadCommunity();
      })
      .catch((e) => {
        setSubmitting(false);
        setSubmitError(e instanceof Error ? e.message : "Could not reach the backend.");
      });
  }

  const empty = !loading && !error && list.length === 0;
  const submitDisabled = draft.trim().length < 10 || submitting;

  return (
    <>
      <PageHeader title="Community" subtitle="Real interview questions, case debriefs, and frameworks shared by other candidates" />

      <div style={{ marginTop: 26, background: "#fff", border: "1px solid #e9eaee", borderRadius: 14, boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "20px 22px" }}>
        <div style={{ fontSize: 15.5, fontWeight: 700, color: "#111827" }}>Share something with the community</div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                border: "1px solid " + (type === t ? "#4F46E5" : "#e0e1e6"),
                borderRadius: 9,
                padding: "8px 12px",
                cursor: "pointer",
                font: "600 12.5px 'Instrument Sans',sans-serif",
                color: type === t ? "#4F46E5" : "#374151",
                background: "#fff"
              }}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company (optional)"
            style={{ flex: 1, border: "1px solid #e0e1e6", borderRadius: 9, padding: "9px 12px", outline: "none", fontSize: 13.5, color: "#111827", background: "#fcfcfd" }}
          />
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role (optional)"
            style={{ flex: 1, border: "1px solid #e0e1e6", borderRadius: 9, padding: "9px 12px", outline: "none", fontSize: 13.5, color: "#111827", background: "#fcfcfd" }}
          />
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Share a real interview question, a case debrief, or a framework that worked for you…"
          style={{
            width: "100%",
            height: 96,
            resize: "vertical",
            border: "1px solid #e0e1e6",
            borderRadius: 9,
            padding: "11px 13px",
            outline: "none",
            fontSize: 14.5,
            lineHeight: 1.55,
            color: "#111827",
            background: "#fcfcfd",
            marginTop: 10,
            font: "inherit"
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 11 }}>
          <button
            onClick={submit}
            disabled={submitDisabled}
            style={{
              border: 0,
              borderRadius: 9,
              padding: "10px 16px",
              font: "600 13.5px 'Instrument Sans',sans-serif",
              cursor: submitDisabled ? "default" : "pointer",
              opacity: submitDisabled ? 0.6 : 1,
              background: "#4F46E5",
              color: "#fff"
            }}
          >
            {submitting ? "Submitting…" : "Share with the community"}
          </button>
          {submitError && <span style={{ fontSize: 12.5, color: "#b91c1c" }}>{submitError}</span>}
          {submitMessage && <span style={{ fontSize: 12.5, color: "#059669" }}>{submitMessage}</span>}
        </div>
      </div>

      {loading && <div style={{ marginTop: 20, color: "#6b7280", fontSize: 13.5 }}>Loading…</div>}
      {error && <div style={{ marginTop: 20, color: "#b91c1c", fontSize: 13 }}>{error}</div>}
      {empty && <div style={{ marginTop: 20, color: "#9ca3af", fontSize: 13.5 }}>No contributions yet - be the first.</div>}

      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {list.map((c) => {
          const meta = [TYPE_LABELS[c.type] || c.type, c.company, c.role].filter(Boolean).join(" · ");
          return (
            <div key={c.id} style={{ background: "#fff", border: "1px solid #e9eaee", borderRadius: 14, boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "#9ca3af", fontSize: 12.5 }}>{meta}</span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: statusColor(c.status) }}>{statusLabel(c.status)}</span>
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.6, color: "#111827", textWrap: "pretty" as const }}>{c.content}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}

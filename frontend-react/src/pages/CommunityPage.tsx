import { useEffect, useRef, useState } from "react";
import IndeterminateProgressBar from "../components/IndeterminateProgressBar";
import { useSearchParams } from "react-router-dom";
import { apiFetch, apiUploadWithProgress } from "../lib/apiClient";
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
  if (status === "verified" || status === "approved" || status === "auto_approved") return "var(--green)";
  if (status === "rejected") return "var(--red-dark)";
  return "var(--text-lightgray)";
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
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const proofInputRef = useRef<HTMLInputElement>(null);

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
    if (content.length < 10 || !proofFile || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    setSubmitMessage("");

    const formData = new FormData();
    formData.append("type", type);
    if (company.trim()) formData.append("company", company.trim());
    if (role.trim()) formData.append("role", role.trim());
    formData.append("content", content);
    formData.append("proof", proofFile);

    apiUploadWithProgress<CommunityContributeResponse>("/api/community/contribute", formData, () => {}, undefined, "Failed to submit.")
      .then((data) => {
        setSubmitting(false);
        setDraft("");
        setCompany("");
        setRole("");
        setProofFile(null);
        if (proofInputRef.current) proofInputRef.current.value = "";
        setSubmitMessage(data.message || "Thanks - submitted.");
        loadCommunity();
      })
      .catch((e) => {
        setSubmitting(false);
        setSubmitError(e instanceof Error ? e.message : "Could not reach the backend.");
      });
  }

  const empty = !loading && !error && list.length === 0;
  const submitDisabled = draft.trim().length < 10 || !proofFile || submitting;

  return (
    <>
      <PageHeader title="Community" subtitle="Real interview questions, case debriefs, and frameworks shared by other candidates" />

      <div className="section-title" style={{ marginTop: 34 }}>
        What you'll find here
      </div>
      <div className="grid-3">
        <div className="feature-card" style={{ cursor: "default" }}>
          <div className="fc-icon icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M16 3.128a4 4 0 0 1 0 7.744" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            </svg>
          </div>
          <div className="feature-title">Share what you learned</div>
          <div className="feature-desc" style={{ marginBottom: 0 }}>
            Post a real interview question, a case debrief, or a framework that worked for you - tag the company and role.
          </div>
        </div>
        <div className="feature-card" style={{ cursor: "default" }}>
          <div className="fc-icon icon-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <div className="feature-title">Browse what others shared</div>
          <div className="feature-desc" style={{ marginBottom: 0 }}>
            See real interview Q&amp;As, case debriefs and frameworks from other candidates, most recent first.
          </div>
        </div>
        <div className="feature-card" style={{ cursor: "default" }}>
          <div className="fc-icon icon-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div className="feature-title">It shows up on Company too</div>
          <div className="feature-desc" style={{ marginBottom: 0 }}>
            A contribution tagged with a company also appears in that company's "Interview experiences" section.
          </div>
        </div>
      </div>

      <div style={{ marginTop: 26, background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "20px 22px" }}>
        <div style={{ fontSize: "0.96875rem", fontWeight: 700, color: "var(--text-900)" }}>Share something with the community</div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                border: "1px solid " + (type === t ? "var(--indigo)" : "var(--border-strong)"),
                borderRadius: "var(--r-sm)",
                padding: "8px 12px",
                cursor: "pointer",
                font: "600 0.78125rem 'Instrument Sans',sans-serif",
                color: type === t ? "var(--indigo)" : "var(--text-700)",
                background: "var(--surface)"
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
            style={{ flex: 1, minWidth: 0, border: "1px solid var(--card-border)", borderRadius: "var(--r-sm)", padding: "9px 12px", outline: "none", fontSize: "0.84375rem", color: "var(--text-900)", background: "var(--field-bg)" }}
          />
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role (optional)"
            style={{ flex: 1, minWidth: 0, border: "1px solid var(--card-border)", borderRadius: "var(--r-sm)", padding: "9px 12px", outline: "none", fontSize: "0.84375rem", color: "var(--text-900)", background: "var(--field-bg)" }}
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
            border: "1px solid var(--card-border)",
            borderRadius: "var(--r-sm)",
            padding: "11px 13px",
            outline: "none",
            fontSize: "0.90625rem",
            lineHeight: 1.55,
            color: "var(--text-900)",
            background: "var(--field-bg)",
            marginTop: 10,
            font: "inherit"
          }}
        />
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              ref={proofInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
              id="proof-upload"
            />
            <label
              htmlFor="proof-upload"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid var(--card-border)", borderRadius: "var(--r-sm)", padding: "8px 13px", cursor: "pointer", font: "600 0.8125rem 'Instrument Sans',sans-serif", color: "var(--text-700)", background: "var(--field-bg)" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              {proofFile ? "Change proof" : "Attach proof"}
            </label>
            {proofFile && <span style={{ fontSize: "0.8125rem", color: "var(--text-700)" }}>{proofFile.name}</span>}
          </div>
          <div style={{ marginTop: 6, fontSize: "0.75rem", color: "var(--text-lightgray)", lineHeight: 1.45 }}>
            Required: a screenshot showing you actually interviewed - an email thread, calendar invite, or offer/rejection letter works. We check it's plausible (not fake, not off-topic) before it's reviewed - it's kept private, never shown publicly.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 11 }}>
          <button
            onClick={submit}
            disabled={submitDisabled}
            style={{
              border: 0,
              borderRadius: "var(--r-sm)",
              padding: "10px 16px",
              font: "600 0.84375rem 'Instrument Sans',sans-serif",
              cursor: submitDisabled ? "default" : "pointer",
              opacity: submitDisabled ? 0.6 : 1,
              background: "var(--indigo)",
              color: "var(--surface)"
            }}
          >
            {submitting ? "Submitting…" : "Share with the community"}
          </button>
          {submitError && <span style={{ fontSize: "0.78125rem", color: "var(--red-dark)" }}>{submitError}</span>}
          {submitMessage && <span style={{ fontSize: "0.78125rem", color: "var(--green)" }}>{submitMessage}</span>}
        </div>
      </div>

      {loading && (
        <div role="status" aria-live="polite" style={{ marginTop: 20, maxWidth: 420 }}>
          <div style={{ color: "var(--text-gray2)", fontSize: "0.84375rem" }}>Loading contributions…</div>
          <IndeterminateProgressBar />
        </div>
      )}
      {error && <div style={{ marginTop: 20, color: "var(--red-dark)", fontSize: "0.8125rem" }}>{error}</div>}
      {empty && <div style={{ marginTop: 20, color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>No contributions yet - be the first.</div>}

      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {list.map((c) => {
          const meta = [TYPE_LABELS[c.type] || c.type, c.company, c.role].filter(Boolean).join(" · ");
          return (
            <div key={c.id} style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "var(--text-lightgray)", fontSize: "0.78125rem" }}>{meta}</span>
                <span style={{ fontSize: "0.71875rem", fontWeight: 600, color: statusColor(c.status) }}>{statusLabel(c.status)}</span>
              </div>
              <p style={{ margin: "10px 0 0", fontSize: "0.90625rem", lineHeight: 1.6, color: "var(--text-900)", textWrap: "pretty" as const }}>{c.content}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}

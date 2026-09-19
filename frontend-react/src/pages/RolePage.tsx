import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient";
import { CANONICAL_ROLES, POPULAR_ROLES, POPULAR_COMPANIES } from "../lib/constants";
import { isPageReload } from "../lib/navigation";
import { useSelectorOpenState } from "../hooks/useSelector";
import { useProbe } from "../hooks/useProbe";
import Selector, { type SelectorOption } from "../components/Selector";
import ProbeChat from "../components/ProbeChat";
import PageHeader from "../components/PageHeader";
import type { RoleOverview, RoleOverviewResponse, RoleTopic, RoleTopicsResponse } from "../types/api";

// Ported from frontend/index.html: roleSelector() (3861-3917), roleInfo()
// (3363-3380), roleTopicPanel() (3179-3231), loadRoleOverview/loadRoleTopics
// (3822-3853), openSkill (3387-3390), markup (607-967). The "What you'll
// find here" empty state (639-674) was added earlier this session and is
// ported as-is. See migration plan §0.6/Phase 4.

interface OverviewState { loading: boolean; error: string; data: RoleOverview | null }
interface TopicsState { loading: boolean; error: string; topics: RoleTopic[] }

// Module-level, not component state, so it survives RolePage unmounting (e.g.
// navigating to Skill and back) - /api/roles/:title[/topics] are AI-backed
// and rate-limited (30/15min), so re-fetching on every return trip burns
// through that budget fast. Only successful loads are cached; errors are not,
// so a return trip after a transient failure retries instead of getting
// stuck showing the old error.
const overviewCache: Record<string, OverviewState> = {};
const topicsCache: Record<string, TopicsState> = {};

// Overview genuinely differs by company (see migration_015/getRoleOverviewAtCompany)
// so the cache/state key must include it; topics (the curriculum) don't
// depend on company, so topicsCache stays keyed by role title alone.
function overviewKey(title: string, company: string) {
  return company ? `${title}@@${company}` : title;
}

const DIFFICULTY_TAG_STYLE: Record<string, React.CSSProperties> = {
  Easy: { background: "#e7f6ee", color: "#047857" },
  Medium: { background: "#fdf3e3", color: "#b45309" },
  Hard: { background: "#fdeaea", color: "#b91c1c" }
};

export default function RolePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [role, setRole] = useState(() => (isPageReload() ? "" : searchParams.get("role") || ""));
  const [company, setCompany] = useState(() => (isPageReload() ? "" : searchParams.get("company") || ""));
  const [roleTopic, setRoleTopic] = useState(() => (isPageReload() ? "" : searchParams.get("topic") || ""));
  const [overviewByRole, setOverviewByRole] = useState<Record<string, OverviewState>>({});
  const [topicsByRole, setTopicsByRole] = useState<Record<string, TopicsState>>({});

  const roleSel = useSelectorOpenState();
  const companySel = useSelectorOpenState();
  const topicSel = useSelectorOpenState();
  const { probeFor } = useProbe();

  // Restore role/company/topic on mount when arriving with a role already in
  // the URL from an in-app navigation (e.g. back from Skill) - avoids the
  // selector resetting to empty on every remount, which reads as the page
  // having "refreshed". A genuine browser refresh is the opposite ask - start
  // clean - so it clears any stale params instead of restoring from them.
  useEffect(() => {
    if (isPageReload()) {
      if (searchParams.toString()) setSearchParams({}, { replace: true });
      return;
    }
    const initialRole = searchParams.get("role");
    if (initialRole) {
      ensureRoleLoaded(initialRole, searchParams.get("company") || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadRoleOverview(title: string, forCompany: string) {
    const key = overviewKey(title, forCompany);
    setOverviewByRole((s) => ({ ...s, [key]: { loading: true, error: "", data: null } }));
    const url = "/api/roles/" + encodeURIComponent(title) + (forCompany ? "?company=" + encodeURIComponent(forCompany) : "");
    apiFetch<RoleOverviewResponse>(url, {}, "Failed to load role info.")
      .then((data) => {
        const next = { loading: false, error: "", data: data.role };
        overviewCache[key] = next;
        setOverviewByRole((s) => ({ ...s, [key]: next }));
      })
      .catch((e) => setOverviewByRole((s) => ({ ...s, [key]: { loading: false, error: e instanceof Error ? e.message : "Could not load role info.", data: null } })));
  }

  function loadRoleTopics(title: string) {
    setTopicsByRole((s) => ({ ...s, [title]: { loading: true, error: "", topics: [] } }));
    apiFetch<RoleTopicsResponse>("/api/roles/" + encodeURIComponent(title) + "/topics", {}, "Failed to load role topics.")
      .then((data) => {
        const next = { loading: false, error: "", topics: data.topics || [] };
        topicsCache[title] = next;
        setTopicsByRole((s) => ({ ...s, [title]: next }));
      })
      .catch((e) => setTopicsByRole((s) => ({ ...s, [title]: { loading: false, error: e instanceof Error ? e.message : "Could not load role topics.", topics: [] } })));
  }

  function ensureRoleLoaded(title: string, forCompany: string) {
    const key = overviewKey(title, forCompany);
    if (overviewCache[key]) {
      setOverviewByRole((s) => ({ ...s, [key]: overviewCache[key] }));
    } else {
      loadRoleOverview(title, forCompany);
    }
    if (topicsCache[title]) {
      setTopicsByRole((s) => ({ ...s, [title]: topicsCache[title] }));
    } else {
      loadRoleTopics(title);
    }
  }

  function pickRole(title: string) {
    setRole(title);
    setRoleTopic("");
    roleSel.reset();
    ensureRoleLoaded(title, company);
    setSearchParams(company ? { role: title, company } : { role: title });
  }

  function pickCompany(name: string) {
    setCompany(name);
    companySel.reset();
    if (role) {
      ensureRoleLoaded(role, name);
      setSearchParams({ role, company: name });
    }
  }

  function clearCompany() {
    setCompany("");
    companySel.reset();
    if (role) {
      ensureRoleLoaded(role, "");
      setSearchParams({ role });
    }
  }

  function clearRole() {
    setRole("");
    setCompany("");
    setRoleTopic("");
    roleSel.reset();
    companySel.reset();
    setSearchParams({});
  }

  function openSkill(skill: string) {
    navigate("/skill?role=" + encodeURIComponent(role) + "&skill=" + encodeURIComponent(skill));
  }

  // --- roleSelector() port ---
  const trimmed = roleSel.query.trim();
  const pool = trimmed ? CANONICAL_ROLES : POPULAR_ROLES;
  const filtered = trimmed ? pool.filter((o) => o.toLowerCase().includes(trimmed.toLowerCase())) : pool;
  const exactInList = trimmed && CANONICAL_ROLES.some((o) => o.toLowerCase() === trimmed.toLowerCase());
  const roleOptions: SelectorOption[] = filtered.map((o) => ({ label: o, selected: role === o, pick: () => pickRole(o) }));
  if (trimmed.length >= 2 && !exactInList) {
    roleOptions.push({ label: "Search for “" + trimmed + "”", selected: false, pick: () => pickRole(trimmed) });
  }

  // --- companySelector() port (optional, tailors roleInfo to one employer) ---
  const companyTrimmed = companySel.query.trim();
  const companyFiltered = companyTrimmed ? POPULAR_COMPANIES.filter((o) => o.toLowerCase().includes(companyTrimmed.toLowerCase())) : POPULAR_COMPANIES;
  const companyExactInList = companyTrimmed && POPULAR_COMPANIES.some((o) => o.toLowerCase() === companyTrimmed.toLowerCase());
  const companyOptions: SelectorOption[] = companyFiltered.map((o) => ({ label: o, selected: company === o, pick: () => pickCompany(o) }));
  if (companyTrimmed.length >= 2 && !companyExactInList) {
    companyOptions.push({ label: "Search for “" + companyTrimmed + "”", selected: false, pick: () => pickCompany(companyTrimmed) });
  }

  // --- roleInfo() port ---
  const ov = overviewByRole[overviewKey(role, company)] || { loading: false, error: "", data: null };
  const roleInfo = role
    ? {
        loading: ov.loading,
        error: ov.error,
        what: ov.loading ? "" : ov.data?.what || "",
        companies: ov.loading ? [] : ov.data?.companies || [],
        process: ov.loading ? [] : ov.data?.process || [],
        salary: ov.loading ? "" : ov.data?.salary || "",
        salaryNote: ov.loading ? "" : ov.data?.salaryNote || "",
        skills: ov.loading ? [] : (ov.data?.skills || []).map((text) => ({ text, click: () => openSkill(text) })),
        exits: ov.loading ? [] : ov.data?.exits || []
      }
    : null;

  // --- roleTopicPanel() port ---
  const td = topicsByRole[role] || { loading: false, error: "", topics: [] };
  const topics = td.topics;
  const current = topics.find((t) => t.name === roleTopic) || null;
  const topicShown = topicSel.query.trim() ? topics.map((t) => t.name).filter((o) => o.toLowerCase().includes(topicSel.query.trim().toLowerCase())) : topics.map((t) => t.name);
  const topicDisabled = td.loading || !!td.error || topics.length === 0;
  const topicPlaceholder = td.loading ? "Loading topics…" : td.error ? "Could not load topics" : "Select a topic";
  const topicOptions: SelectorOption[] = topicShown.map((o) => ({
    label: o,
    selected: roleTopic === o,
    pick: () => {
      setRoleTopic(o);
      topicSel.reset();
      setSearchParams(company ? { role, company, topic: o } : { role, topic: o });
    }
  }));

  return (
    <>
      <PageHeader title="Role" subtitle="Pick the role you are preparing for" />

      <div style={{ marginTop: 26, display: "flex", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px", maxWidth: 440 }}>
          <Selector
            label="Role"
            value={role || "Select a role"}
            hasValue={!!role}
            open={roleSel.open}
            query={roleSel.query}
            options={roleOptions}
            empty={roleOptions.length === 0}
            emptyText={`No matches for “${roleSel.query}”.`}
            searchPlaceholder="Search roles..."
            toggle={roleSel.toggle}
            onQuery={roleSel.onQuery}
            onClear={clearRole}
          />
        </div>

        <div style={{ flex: "1 1 320px", maxWidth: 440 }}>
          <Selector
            label="Company (optional)"
            value={company || "Any company"}
            hasValue={!!company}
            open={companySel.open}
            query={companySel.query}
            options={companyOptions}
            empty={companyOptions.length === 0}
            emptyText={`No matches for “${companySel.query}”.`}
            disabled={!role}
            searchPlaceholder="Search companies..."
            toggle={companySel.toggle}
            onQuery={companySel.onQuery}
            onClear={clearCompany}
          />
          {!role && <div style={{ marginTop: 6, color: "#9ca3af", fontSize: 12.5 }}>Pick a role first</div>}
          {role && company && <div style={{ marginTop: 6, color: "#9ca3af", fontSize: 12.5 }}>Showing everything tailored to {role} at {company}</div>}
        </div>
      </div>

      {!role && (
        <>
          <div className="section-title" style={{ marginTop: 34 }}>
            What you'll find here
          </div>
          <div className="grid-3">
            <div className="feature-card" style={{ cursor: "default" }}>
              <div className="fc-icon icon-purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="feature-title">Role overview</div>
              <div className="feature-desc" style={{ marginBottom: 0 }}>
                Pick a role to see what it actually involves day to day, who typically hires for it, and the salary band you can expect.
              </div>
            </div>
            <div className="feature-card" style={{ cursor: "default" }}>
              <div className="fc-icon icon-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="12" cy="12" r="1" />
                </svg>
              </div>
              <div className="feature-title">Topics to prepare</div>
              <div className="feature-desc" style={{ marginBottom: 0 }}>
                Pick a topic to see exactly what interviewers test and why, then push back with follow-up questions until it's clear.
              </div>
            </div>
            <div className="feature-card" style={{ cursor: "default" }}>
              <div className="fc-icon icon-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
                  <path d="M14 2v5a1 1 0 0 0 1 1h5" />
                  <path d="M10 9H8" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                </svg>
              </div>
              <div className="feature-title">Skills required</div>
              <div className="feature-desc" style={{ marginBottom: 0 }}>
                Each skill opens focused practice: primer concepts, hands-on problems, and AI-scored answers you can type or speak.
              </div>
            </div>
          </div>
          <div className="grid-full">
            <div className="feature-card wide" style={{ cursor: "default" }}>
              <div className="fc-icon icon-pink">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <div className="fc-body">
                <div className="feature-title">Exit opportunities</div>
                <div className="feature-desc" style={{ marginBottom: 0 }}>
                  Once you pick a role above, you'll also see where it typically leads next - so you're prepping with the bigger picture in view.
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {roleInfo && (
        <>
          {roleInfo.loading && <div style={{ marginTop: 28, color: "#9ca3af", fontSize: 13.5 }}>Loading role info…</div>}
          {roleInfo.error && <div className="t-shake" style={{ marginTop: 28, color: "#b91c1c", fontSize: 13.5 }}>{roleInfo.error}</div>}

          <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(320px,420px)", gap: 16, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#fff", border: "1px solid #e9eaee", borderRadius: 14, boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "22px 24px" }}>
                <div style={{ color: "#9ca3af", fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>What this role is</div>
                <p style={{ margin: "9px 0 0", fontSize: 15.5, lineHeight: 1.6, color: "#111827" }}>{roleInfo.what}</p>
              </div>

              <div style={{ background: "#fff", border: "1px solid #e9eaee", borderRadius: 14, boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "20px 22px 22px" }}>
                <div style={{ color: "#9ca3af", fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Topics to prepare</div>
                <div style={{ position: "relative", marginTop: 12, maxWidth: 420 }}>
                  <Selector
                    value={roleTopic || topicPlaceholder}
                    hasValue={!!roleTopic}
                    open={topicSel.open}
                    query={topicSel.query}
                    options={topicOptions}
                    empty={topicOptions.length === 0}
                    emptyText={`No matches for “${topicSel.query}”.`}
                    disabled={topicDisabled}
                    searchPlaceholder="Search topics..."
                    toggle={topicSel.toggle}
                    onQuery={topicSel.onQuery}
                  />
                </div>

                {current && (
                  <>
                    <p style={{ margin: "16px 0 0", fontSize: 14.5, lineHeight: 1.6, color: "#111827" }}>
                      What interviewers are testing when they open {current.name.toLowerCase()} for a {role}.
                    </p>
                    <div style={{ marginTop: 16, color: "#9ca3af", fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>What gets tested</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 10 }}>
                      {current.points.map((t, i) => (
                        <div key={i}>
                          <div style={{ display: "flex", gap: 9, fontSize: 14, lineHeight: 1.45, color: "#374151" }}>
                            <span style={{ flex: "none", width: 5, height: 5, borderRadius: "50%", background: "#4F46E5", marginTop: 7 }}></span>
                            <span>{t}</span>
                          </div>
                          <ProbeChat probe={probeFor(role, current.name, "p" + i, t)} />
                        </div>
                      ))}
                    </div>

                    {current.concept && (
                      <>
                        <div style={{ marginTop: 20, color: "#9ca3af", fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Concept</div>
                        <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.65, color: "#111827" }}>{current.concept}</p>
                        <ProbeChat probe={probeFor(role, current.name, "concept", current.concept)} />
                      </>
                    )}

                    {current.frameworks && current.frameworks.length > 0 && (
                      <>
                        <div style={{ marginTop: 20, color: "#9ca3af", fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Frameworks</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 10, marginTop: 11 }}>
                          {current.frameworks.map((f, i) => (
                            <div key={i} style={{ border: "1px solid #eceef2", borderRadius: 14, padding: "13px 15px", background: "#fcfcfe" }}>
                              <div style={{ fontSize: 14.5, fontWeight: 700, color: "#111827" }}>{f.name}</div>
                              <div style={{ marginTop: 8, fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#9ca3af" }}>Answers</div>
                              <p style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "#374151" }}>{f.answers}</p>
                              <div style={{ marginTop: 9, fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#9ca3af" }}>When not to use</div>
                              <p style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "#374151" }}>{f.whenNotToUse}</p>
                              <ProbeChat probe={probeFor(role, current.name, "f" + i, f.name + " - " + f.answers)} showHow showQuote={false} />
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {current.modelAnswer && (
                      <>
                        <div style={{ marginTop: 20, color: "#9ca3af", fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Model answer</div>
                        <div style={{ marginTop: 11, padding: "12px 14px", borderLeft: "2px solid #4338CA", background: "#F3F7FE", fontSize: 14.5, lineHeight: 1.55, fontWeight: 600, color: "#111827" }}>{current.modelAnswer.prompt}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 13 }}>
                          {current.modelAnswer.walkthrough.map((w, i) => (
                            <div key={i}>
                              <div style={{ display: "flex", gap: 9, fontSize: 14, lineHeight: 1.6, color: "#374151" }}>
                                <span style={{ flex: "none", width: 5, height: 5, borderRadius: "50%", background: "#059669", marginTop: 8 }}></span>
                                <span>{w}</span>
                              </div>
                              <ProbeChat probe={probeFor(role, current.name, "w" + i, w)} />
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {current.pitfalls && current.pitfalls.length > 0 && (
                      <>
                        <div style={{ marginTop: 20, color: "#9ca3af", fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Common pitfalls</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 11 }}>
                          {current.pitfalls.map((pf, i) => (
                            <div key={i} style={{ display: "flex", gap: 9, fontSize: 14, lineHeight: 1.55, color: "#374151" }}>
                              <span style={{ flex: "none", width: 5, height: 5, borderRadius: "50%", background: "#b91c1c", marginTop: 8 }}></span>
                              <span>{pf}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {current.practicePrompts && current.practicePrompts.length > 0 && (
                      <>
                        <div style={{ marginTop: 20, color: "#9ca3af", fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Practice prompts</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 11 }}>
                          {current.practicePrompts.map((q, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, border: "1px solid #eceef2", borderRadius: 9, padding: "11px 13px", background: "#fcfcfe" }}>
                              <span style={{ flex: "none", padding: "3px 9px", borderRadius: 999, fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", ...(DIFFICULTY_TAG_STYLE[q.difficulty] || { background: "#f3f4f6", color: "#4b5563" }) }}>{q.difficulty}</span>
                              <span style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.5, color: "#374151" }}>{q.question}</span>
                              <button
                                onClick={() => navigate("/mock-interview?prefillQuestion=" + encodeURIComponent(q.question) + "&prefillFrom=" + encodeURIComponent((role || "") + " · " + (roleTopic || "")))}
                                className="practise-btn"
                                style={{ flex: "none", border: "1px solid #C7DCF9", borderRadius: 9, background: "#fff", color: "#4F46E5", font: "600 12.5px 'Instrument Sans',sans-serif", padding: "8px 12px", cursor: "pointer" }}
                              >
                                Practise
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {current.companyNotes && current.companyNotes.length > 0 && (
                      <>
                        <div style={{ marginTop: 20, color: "#9ca3af", fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>How this shows up by company</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 11 }}>
                          {current.companyNotes.map((cn, i) => (
                            <div key={i} style={{ display: "flex", gap: 11, fontSize: 13.5, lineHeight: 1.55, color: "#374151" }}>
                              <span style={{ flex: "none", width: 118, fontWeight: 700, color: "#111827" }}>{cn.company}</span>
                              <span style={{ flex: 1 }}>{cn.note}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {current.samples && current.samples.length > 0 && (
                      <>
                        <div style={{ marginTop: 18, color: "#9ca3af", fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Questions you should expect</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                          {current.samples.map((q, i) => (
                            <div key={i} style={{ border: "1px solid #eceef2", borderRadius: 9, padding: "11px 13px", background: "#fcfcfe", fontSize: 14, lineHeight: 1.5, color: "#374151" }}>{q}</div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
                {!current && !td.loading && !td.error && <p style={{ margin: "14px 0 0", fontSize: 13.5, color: "#9ca3af" }}>Pick a topic to see what interviewers test within it.</p>}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#fff", border: "1px solid #e9eaee", borderRadius: 14, boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "20px 22px" }}>
                {company ? (
                  <>
                    <div style={{ color: "#9ca3af", fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Interview process at {company}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
                      {roleInfo.process.map((step, i) => (
                        <div key={i} style={{ display: "flex", gap: 9, fontSize: 14, lineHeight: 1.45, color: "#374151" }}>
                          <span style={{ flex: "none", width: 20, height: 20, borderRadius: 999, background: "#EAF1FE", color: "#1656D9", fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ color: "#9ca3af", fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Who hires for it</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                      {roleInfo.companies.map((c, i) => (
                        <span key={i} style={{ padding: "5px 11px", borderRadius: 9, background: "#f3f4f6", color: "#374151", fontSize: 13, fontWeight: 500 }}>{c}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div style={{ background: "#fff", border: "1px solid #e9eaee", borderRadius: 14, boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "20px 22px" }}>
                <div style={{ color: "#9ca3af", fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Salary range</div>
                <div style={{ marginTop: 11, fontSize: 26, fontWeight: 700, letterSpacing: "-.02em", color: "#111827" }}>{roleInfo.salary}</div>
                <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13.5 }}>{roleInfo.salaryNote}</div>
              </div>

              <div style={{ background: "#fff", border: "1px solid #e9eaee", borderRadius: 14, boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "20px 22px" }}>
                <div style={{ color: "#9ca3af", fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Skills required</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
                  {roleInfo.skills.map((sk, i) => (
                    <div key={i} onClick={sk.click} className="role-skill-link" style={{ display: "flex", gap: 9, fontSize: 14, lineHeight: 1.45, color: "#4F46E5", cursor: "pointer" }}>
                      <span style={{ flex: "none", width: 5, height: 5, borderRadius: "50%", background: "#4F46E5", marginTop: 7 }}></span>
                      <span style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>{sk.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "#fff", border: "1px solid #e9eaee", borderRadius: 14, boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "20px 22px" }}>
                <div style={{ color: "#9ca3af", fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Exit opportunities</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
                  {roleInfo.exits.map((ex, i) => (
                    <div key={i} style={{ display: "flex", gap: 9, fontSize: 14, lineHeight: 1.45, color: "#374151" }}>
                      <span style={{ flex: "none", width: 5, height: 5, borderRadius: "50%", background: "#059669", marginTop: 7 }}></span>
                      <span>{ex}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

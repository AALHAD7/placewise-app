import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/apiClient";
import { CANONICAL_ROLES, POPULAR_ROLES, POPULAR_COMPANIES, LATERAL_ROLES, titleCase, companyDisplayLabel } from "../lib/constants";
import { isPageReload } from "../lib/navigation";
import { aOrAn } from "../lib/prompts";
import { useSelectorOpenState } from "../hooks/useSelector";
import { useProbe } from "../hooks/useProbe";
import { useSimulatedProgress } from "../hooks/useSimulatedProgress";
import Selector, { type SelectorOption } from "../components/Selector";
import ProbeChat from "../components/ProbeChat";
import PageHeader from "../components/PageHeader";
import GroundingNote from "../components/GroundingNote";
import type { RoleCompanyNotesResponse, RoleOverview, RoleOverviewResponse, RoleTopic, RoleTopicsResponse } from "../types/api";

// Ported from frontend/index.html: roleSelector() (3861-3917), roleInfo()
// (3363-3380), roleTopicPanel() (3179-3231), loadRoleOverview/loadRoleTopics
// (3822-3853), openSkill (3387-3390), markup (607-967). The "What you'll
// find here" empty state (639-674) was added earlier this session and is
// ported as-is. See migration plan §0.6/Phase 4.

interface OverviewState { loading: boolean; error: string; data: RoleOverview | null }
interface TopicsState { loading: boolean; error: string; topics: RoleTopic[]; groundedInCasebooks: boolean; citations: import("../types/api").GuesstimateCitation[] }

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

// "as of Oct 2026" - Phase 1 amendment B's source badge. Month/year only
// (not a full date): these are a salary-range/process-shape snapshot, not
// something a reader needs to the day.
function asOf(fetchedAt: string): string {
  if (!fetchedAt) return "";
  const d = new Date(fetchedAt);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function SourceBadge({ sources, fetchedAt }: { sources: { title: string; uri: string }[]; fetchedAt: string }) {
  if (!sources.length) return null;
  return (
    <div style={{ marginTop: 8, color: "var(--text-lightgray)", fontSize: "0.65625rem", lineHeight: 1.6 }}>
      Sources:{" "}
      {sources.map((s, i) => (
        <span key={i}>
          <a href={s.uri} target="_blank" rel="noreferrer" style={{ color: "var(--text-lightgray)", textDecoration: "underline" }}>
            {s.title || "source"}
          </a>
          {i < sources.length - 1 ? ", " : ""}
        </span>
      ))}
      {asOf(fetchedAt) ? " · as of " + asOf(fetchedAt) : ""}
    </div>
  );
}

const DIFFICULTY_TAG_STYLE: Record<string, React.CSSProperties> = {
  Easy: { background: "#e7f6ee", color: "var(--green-dark)" },
  Medium: { background: "#fdf3e3", color: "var(--amber-ink)" },
  Hard: { background: "#fdeaea", color: "var(--red-dark)" }
};

export default function RolePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [role, setRole] = useState(() => (isPageReload() ? "" : searchParams.get("role") || ""));
  const [company, setCompany] = useState(() => (isPageReload() ? "" : searchParams.get("company") || ""));
  const [roleTopic, setRoleTopic] = useState(() => (isPageReload() ? "" : searchParams.get("topic") || ""));
  const [overviewByRole, setOverviewByRole] = useState<Record<string, OverviewState>>({});
  const [topicsByRole, setTopicsByRole] = useState<Record<string, TopicsState>>({});
  // "How this shows up by company" (Phase 1 amendment C) - a separate,
  // RAG-gated fetch keyed by (role, company), not part of the topics
  // payload anymore. Keyed in state by "role@@company" so switching role or
  // company doesn't show stale notes from a previous pairing.
  const [companyNotesByKey, setCompanyNotesByKey] = useState<Record<string, Record<string, string>>>({});
  const [companyNoteCitationsByKey, setCompanyNoteCitationsByKey] = useState<Record<string, Record<string, import("../types/api").GuesstimateCitation[]>>>({});

  // Last successfully-loaded overview for the CURRENT role (any company) -
  // switching companies re-fetches (it's a different, AI-generated result),
  // but the panel shouldn't blank to "Loading role info..." every time: it
  // keeps showing the previous company's content until the new one lands,
  // so picking a company feels instant instead of like a page reload. Reset
  // whenever the role itself changes, since that's a bigger jump where
  // starting clean is correct.
  const lastGoodRef = useRef<{ role: string; data: RoleOverview | null }>({ role: "", data: null });

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
    setTopicsByRole((s) => ({ ...s, [title]: { loading: true, error: "", topics: [], groundedInCasebooks: false, citations: [] } }));
    apiFetch<RoleTopicsResponse>("/api/roles/" + encodeURIComponent(title) + "/topics", {}, "Failed to load role topics.")
      .then((data) => {
        const next = { loading: false, error: "", topics: data.topics || [], groundedInCasebooks: data.groundedInCasebooks || false, citations: data.citations || [] };
        topicsCache[title] = next;
        setTopicsByRole((s) => ({ ...s, [title]: next }));
      })
      .catch((e) => setTopicsByRole((s) => ({ ...s, [title]: { loading: false, error: e instanceof Error ? e.message : "Could not load role topics.", topics: [], groundedInCasebooks: false, citations: [] } })));
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
    // Carry company/topic through too, not just role - Skill's own "Back to
    // Role" link round-trips these same params, so dropping them here is
    // what silently wiped a picked company/topic on the way back (a user
    // report: clicking a skill chip then "Back to Role" reset the page).
    const params = new URLSearchParams({ role, skill });
    if (company) params.set("company", company);
    if (roleTopic) params.set("topic", roleTopic);
    navigate("/skill?" + params.toString());
  }

  // --- roleSelector() port ---
  const trimmed = roleSel.query.trim();
  const pool = trimmed ? CANONICAL_ROLES : POPULAR_ROLES;
  const filtered = trimmed ? pool.filter((o) => o.toLowerCase().includes(trimmed.toLowerCase())) : pool;
  const exactInList = trimmed && CANONICAL_ROLES.some((o) => o.toLowerCase() === trimmed.toLowerCase());
  // Phase 1.6 item 2: lateral/2+yrs roles get a small inline label suffix -
  // the picked VALUE (via pickRole(o) below) always stays the clean title,
  // only the dropdown's display text carries the tag.
  const roleOptions: SelectorOption[] = filtered.map((o) => ({
    label: LATERAL_ROLES.has(o) ? `${o}  ·  Lateral / 2+ yrs` : o,
    selected: role === o,
    pick: () => pickRole(o)
  }));
  if (trimmed.length >= 2 && !exactInList) {
    const roleTitled = titleCase(trimmed);
    roleOptions.push({ label: roleTitled, selected: false, pick: () => pickRole(roleTitled) });
  }

  // --- companySelector() port (optional, tailors roleInfo to one employer) ---
  const companyTrimmed = companySel.query.trim();
  const companyFiltered = companyTrimmed ? POPULAR_COMPANIES.filter((o) => o.toLowerCase().includes(companyTrimmed.toLowerCase())) : POPULAR_COMPANIES;
  const companyExactInList = companyTrimmed && POPULAR_COMPANIES.some((o) => o.toLowerCase() === companyTrimmed.toLowerCase());
  const companyOptions: SelectorOption[] = companyFiltered.map((o) => ({ label: companyDisplayLabel(o), selected: company === o, pick: () => pickCompany(o) }));
  if (companyTrimmed.length >= 2 && !companyExactInList) {
    const companyTitled = titleCase(companyTrimmed);
    companyOptions.push({ label: companyTitled, selected: false, pick: () => pickCompany(companyTitled) });
  }

  // --- roleInfo() port ---
  const ov = overviewByRole[overviewKey(role, company)] || { loading: false, error: "", data: null };
  if (lastGoodRef.current.role !== role) lastGoodRef.current = { role, data: null };
  if (ov.data) lastGoodRef.current = { role, data: ov.data };
  const displayData = ov.data || (ov.loading ? lastGoodRef.current.data : null);
  const roleInfo = role
    ? {
        loading: ov.loading && !displayData,
        revalidating: ov.loading && !!displayData,
        error: ov.error,
        what: displayData?.what || "",
        companies: displayData?.companies || [],
        process: displayData?.process || [],
        salary: displayData?.salary || "",
        salaryNote: displayData?.salaryNote || "",
        skills: (displayData?.skills || []).map((text) => ({ text, click: () => openSkill(text) })),
        // Phase 1.5 item 6: split, not a single "exits" field anymore -
        // careerProgression is the internal ladder, exitOpportunities is a
        // genuinely different function/firm type/industry.
        careerProgression: displayData?.careerProgression || [],
        exitOpportunities: displayData?.exitOpportunities || [],
        // Phase 1.5 item 3: salary/process render based on source QUALITY,
        // not just presence - hasTrustedSource gates salary; process also
        // accepts a SUPPORTING-only source, just with a weaker label.
        sources: displayData?.sources || [],
        hasTrustedSource: displayData?.hasTrustedSource || false,
        hasSupportingSource: displayData?.hasSupportingSource || false,
        fetchedAt: displayData?.fetchedAt || ""
      }
    : null;

  // --- roleTopicPanel() port ---
  const td = topicsByRole[role] || { loading: false, error: "", topics: [], groundedInCasebooks: false, citations: [] };
  const topics = td.topics;
  const current = topics.find((t) => t.name === roleTopic) || null;

  const companyNotesKey = overviewKey(role, company);
  useEffect(() => {
    if (!role || !company || topics.length === 0 || companyNotesByKey[companyNotesKey]) return;
    const topicNames = topics.map((t) => t.name).join("|");
    apiFetch<RoleCompanyNotesResponse>(
      "/api/roles/" + encodeURIComponent(role) + "/company-notes?company=" + encodeURIComponent(company) + "&topics=" + encodeURIComponent(topicNames),
      {},
      "Failed to load company notes."
    )
      .then((data) => {
        setCompanyNotesByKey((s) => ({ ...s, [companyNotesKey]: data.notes || {} }));
        setCompanyNoteCitationsByKey((s) => ({ ...s, [companyNotesKey]: data.citations || {} }));
      })
      .catch(() => setCompanyNotesByKey((s) => ({ ...s, [companyNotesKey]: {} })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, company, topics.length]);
  const companyNote = current ? companyNotesByKey[companyNotesKey]?.[current.name] : undefined;
  const companyNoteCitations = current ? companyNoteCitationsByKey[companyNotesKey]?.[current.name] : undefined;
  const topicShown = topicSel.query.trim() ? topics.map((t) => t.name).filter((o) => o.toLowerCase().includes(topicSel.query.trim().toLowerCase())) : topics.map((t) => t.name);
  const topicDisabled = td.loading || !!td.error || topics.length === 0;
  // Topics come back as one big non-streaming generation (unlike Resume's
  // interrogation, which streams a real per-question percent) - there's no
  // real completion fraction to read mid-flight, so this ramps an estimate
  // calibrated against measured typical latency (5 live samples: 4.2s-19.5s,
  // median ~11.5s) instead of a bare "Loading…" with no sense of progress.
  const topicLoadPercent = useSimulatedProgress(td.loading);
  const topicPlaceholder = td.loading ? `Loading topics… ${topicLoadPercent}%` : td.error ? "Could not load topics" : "Select a topic";
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
          {!role && <div style={{ marginTop: 6, color: "var(--text-lightgray)", fontSize: "0.78125rem" }}>Pick a role first</div>}
          {role && company && <div style={{ marginTop: 6, color: "var(--text-lightgray)", fontSize: "0.78125rem" }}>Showing everything tailored to {role} at {company}</div>}
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
          {roleInfo.loading && <div style={{ marginTop: 28, color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>Loading role info…</div>}
          {roleInfo.revalidating && <div style={{ marginTop: 28, color: "var(--text-lightgray)", fontSize: "0.78125rem" }}>Updating{company ? ` for ${company}` : ""}…</div>}
          {roleInfo.error && <div className="t-shake" style={{ marginTop: 28, color: "var(--red-dark)", fontSize: "0.84375rem" }}>{roleInfo.error}</div>}

          <div className="two-col-sidebar" style={{ marginTop: 28 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "22px 24px" }}>
                <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>What this role is</div>
                <p style={{ margin: "9px 0 0", fontSize: "0.96875rem", lineHeight: 1.6, color: "var(--text-900)" }}>{roleInfo.what}</p>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "20px 22px 22px" }}>
                <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Topics to prepare</div>
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
                    {/* R8: whether this topic's content is grounded in a real casebook
                        citation, or general AI guidance - set once per topics load,
                        not per topic, since groundedInCasebooks/citations are a
                        response-level decision (see consultingRetrieval.js). */}
                    <GroundingNote groundedInCasebooks={td.groundedInCasebooks} citations={td.citations} />
                    {/* Phase 1.5 item 8: no .toLowerCase() on the topic name (it used
                        to mangle acronyms - "M&A Synergies" read as "m&a synergies") and
                        a real a/an check on the role instead of a hardcoded "a". */}
                    <p style={{ margin: "16px 0 0", fontSize: "0.90625rem", lineHeight: 1.6, color: "var(--text-900)" }}>
                      What interviewers are testing when they open {current.name} for {aOrAn(role)} {role}.
                    </p>
                    <div style={{ marginTop: 16, color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>What gets tested</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 10 }}>
                      {current.points.map((t, i) => (
                        <div key={i}>
                          <div style={{ display: "flex", gap: 9, fontSize: "0.875rem", lineHeight: 1.45, color: "var(--text-700)" }}>
                            <span style={{ flex: "none", width: 5, height: 5, borderRadius: "50%", background: "var(--indigo)", marginTop: 7 }}></span>
                            <span>{t}</span>
                          </div>
                          <ProbeChat probe={probeFor(role, current.name, "p" + i, t, company)} showHow />
                        </div>
                      ))}
                    </div>

                    {current.concept && (
                      <>
                        <div style={{ marginTop: 20, color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Concept</div>
                        <p style={{ margin: "10px 0 0", fontSize: "0.90625rem", lineHeight: 1.65, color: "var(--text-900)" }}>{current.concept}</p>
                        <ProbeChat probe={probeFor(role, current.name, "concept", current.concept, company)} />
                      </>
                    )}

                    {current.frameworks && current.frameworks.length > 0 && (
                      <>
                        <div style={{ marginTop: 20, color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Frameworks</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 10, marginTop: 11 }}>
                          {current.frameworks.map((f, i) => (
                            <div key={i} style={{ border: "1px solid var(--card-border)", borderRadius: "var(--r-md)", padding: "13px 15px", background: "var(--field-bg)" }}>
                              <div style={{ fontSize: "0.90625rem", fontWeight: 700, color: "var(--text-900)" }}>{f.name}</div>
                              <div style={{ marginTop: 8, fontSize: "0.65625rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-lightgray)" }}>Answers</div>
                              <p style={{ margin: "4px 0 0", fontSize: "0.84375rem", lineHeight: 1.55, color: "var(--text-700)" }}>{f.answers}</p>
                              <div style={{ marginTop: 9, fontSize: "0.65625rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-lightgray)" }}>When not to use</div>
                              <p style={{ margin: "4px 0 0", fontSize: "0.84375rem", lineHeight: 1.55, color: "var(--text-700)" }}>{f.whenNotToUse}</p>
                              <ProbeChat probe={probeFor(role, current.name, "f" + i, f.name + " - " + f.answers, company)} showHow showQuote={false} />
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {current.modelAnswer && (
                      <>
                        <div style={{ marginTop: 20, color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Model answer</div>
                        <div style={{ marginTop: 11, padding: "12px 14px", borderLeft: "2px solid var(--indigo-700)", background: "var(--blue-wash)", fontSize: "0.90625rem", lineHeight: 1.55, fontWeight: 600, color: "var(--text-900)" }}>{current.modelAnswer.prompt}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 13 }}>
                          {current.modelAnswer.walkthrough.map((w, i) => (
                            <div key={i}>
                              <div style={{ display: "flex", gap: 9, fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text-700)" }}>
                                <span style={{ flex: "none", width: 5, height: 5, borderRadius: "50%", background: "var(--green)", marginTop: 8 }}></span>
                                <span>{w}</span>
                              </div>
                              <ProbeChat probe={probeFor(role, current.name, "w" + i, w, company)} />
                            </div>
                          ))}
                        </div>
                        {current.modelAnswerVerified?.checked && !current.modelAnswerVerified.passed && (
                          <div role="alert" style={{ marginTop: 10, padding: "8px 10px", borderRadius: "var(--r-sm)", background: "#fdf3e3", color: "var(--amber-ink)", fontSize: "0.78125rem", lineHeight: 1.5 }}>
                            {/* Phase 1.7 item 4: an empty issue means the check failed
                                twice with nothing to target a repair at (a likely false
                                flag) - shown plainly rather than implying a specific,
                                known problem the (populated-issue) default message does. */}
                            {current.modelAnswerVerified.issue ? "This answer could not be fully verified. Check before relying on it." : "Automated check flagged this content."}
                          </div>
                        )}
                      </>
                    )}

                    {current.pitfalls && current.pitfalls.length > 0 && (
                      <>
                        <div style={{ marginTop: 20, color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Common pitfalls</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 11 }}>
                          {current.pitfalls.map((pf, i) => (
                            <div key={i} style={{ display: "flex", gap: 9, fontSize: "0.875rem", lineHeight: 1.55, color: "var(--text-700)" }}>
                              <span style={{ flex: "none", width: 5, height: 5, borderRadius: "50%", background: "var(--red-dark)", marginTop: 8 }}></span>
                              <span>{pf}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {current.practicePrompts && current.practicePrompts.length > 0 && (
                      <>
                        <div style={{ marginTop: 20, color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Practice prompts</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 11 }}>
                          {current.practicePrompts.map((q, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, border: "1px solid var(--card-border)", borderRadius: "var(--r-sm)", padding: "11px 13px", background: "var(--field-bg)" }}>
                              <span style={{ flex: "none", padding: "3px 9px", borderRadius: "var(--r-pill)", fontSize: "0.65625rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", ...(DIFFICULTY_TAG_STYLE[q.difficulty] || { background: "var(--surface-sunken)", color: "var(--text-600)" }) }}>{q.difficulty}</span>
                              <span style={{ flex: 1, minWidth: 0, fontSize: "0.875rem", lineHeight: 1.5, color: "var(--text-700)" }}>{q.question}</span>
                              <button
                                onClick={() => navigate("/mock-interview?prefillQuestion=" + encodeURIComponent(q.question) + "&prefillFrom=" + encodeURIComponent((role || "") + " · " + (roleTopic || "")))}
                                className="practise-btn"
                                style={{ flex: "none", border: "1px solid #99c7ff", borderRadius: "var(--r-sm)", background: "var(--surface)", color: "var(--indigo)", font: "600 0.78125rem 'Instrument Sans',sans-serif", padding: "8px 12px", cursor: "pointer" }}
                              >
                                Practise
                              </button>
                            </div>
                          ))}
                        </div>
                        {/* No "still unverified" notice here (unlike model answer above) -
                            Phase 1.5: a practice prompt is never shown unless it already
                            passed the content check, or was swapped for a fresh one that
                            did (practicePromptsVerified.anyReplaced), so there's nothing
                            to warn about by the time one renders. */}
                      </>
                    )}

                    {/* "How this shows up by company" (Phase 1 amendment C) - only
                        renders when casebook RAG actually mentioned this company by
                        name for this topic; no company selected, or nothing grounded,
                        means this section is simply absent (never a generic/invented
                        note). */}
                    {companyNote && (
                      <>
                        <div style={{ marginTop: 20, color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>How this shows up at {company}</div>
                        <p style={{ margin: "11px 0 0", fontSize: "0.84375rem", lineHeight: 1.55, color: "var(--text-700)" }}>{companyNote}</p>
                        {/* This note only exists when a real casebook chunk literally
                            mentioned the company (grounding gate above) - so it's
                            always cited when present, never a fallback label here. */}
                        {companyNoteCitations && companyNoteCitations.length > 0 && (
                          <GroundingNote groundedInCasebooks citations={companyNoteCitations} />
                        )}
                      </>
                    )}
                  </>
                )}
                {!current && !td.loading && !td.error && <p style={{ margin: "14px 0 0", fontSize: "0.84375rem", color: "var(--text-lightgray)" }}>Pick a topic to see what interviewers test within it.</p>}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "20px 22px" }}>
                {company ? (
                  roleInfo.hasTrustedSource || roleInfo.hasSupportingSource ? (
                    <>
                      <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Interview process at {company}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
                        {roleInfo.process.map((step, i) => (
                          <div key={i} style={{ display: "flex", gap: 9, fontSize: "0.875rem", lineHeight: 1.45, color: "var(--text-700)" }}>
                            <span style={{ flex: "none", width: 20, height: 20, borderRadius: "var(--r-pill)", background: "#eef6ff", color: "#0066cc", fontSize: "0.71875rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                      {/* Phase 1.5 item 3: process accepts a SUPPORTING-only source
                          (unlike salary below, TRUSTED-only) - but when that's all it
                          has, it's labeled rather than given a full source badge. */}
                      {roleInfo.hasTrustedSource ? (
                        <SourceBadge sources={roleInfo.sources} fetchedAt={roleInfo.fetchedAt} />
                      ) : (
                        <div style={{ marginTop: 8, color: "var(--text-lightgray)", fontSize: "0.65625rem" }}>Based on candidate reports</div>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Interview process at {company}</div>
                      <p style={{ margin: "11px 0 0", fontSize: "0.84375rem", color: "var(--text-lightgray)" }}>Process data not available for this role yet.</p>
                    </>
                  )
                ) : (
                  <>
                    <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Who hires for it</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                      {roleInfo.companies.map((c, i) => (
                        <span key={i} style={{ padding: "5px 11px", borderRadius: "var(--r-sm)", background: "var(--surface-sunken)", color: "var(--text-700)", fontSize: "0.8125rem", fontWeight: 500 }}>{c}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "20px 22px" }}>
                <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Salary range</div>
                {/* Phase 1.7 item 3: 3-tier display - trusted shows plainly,
                    supporting-only still shows the figure but labeled
                    indicative, neither hides it entirely. */}
                {roleInfo.hasTrustedSource ? (
                  <>
                    <div style={{ marginTop: 11, fontSize: "1.625rem", fontWeight: 700, letterSpacing: "-.02em", color: "var(--text-900)" }}>{roleInfo.salary}</div>
                    <div style={{ marginTop: 6, color: "var(--text-gray2)", fontSize: "0.84375rem" }}>{roleInfo.salaryNote}</div>
                    <SourceBadge sources={roleInfo.sources} fetchedAt={roleInfo.fetchedAt} />
                  </>
                ) : roleInfo.hasSupportingSource ? (
                  <>
                    <div style={{ marginTop: 11, fontSize: "1.625rem", fontWeight: 700, letterSpacing: "-.02em", color: "var(--text-900)" }}>{roleInfo.salary}</div>
                    <div style={{ marginTop: 6, color: "var(--text-gray2)", fontSize: "0.78125rem", fontWeight: 600 }}>Indicative · based on candidate-reported data</div>
                    <div style={{ marginTop: 4, color: "var(--text-gray2)", fontSize: "0.84375rem" }}>{roleInfo.salaryNote}</div>
                    <SourceBadge sources={roleInfo.sources} fetchedAt={roleInfo.fetchedAt} />
                  </>
                ) : (
                  <p style={{ margin: "11px 0 0", fontSize: "0.84375rem", color: "var(--text-lightgray)" }}>Salary data not available for this role yet.</p>
                )}
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "20px 22px" }}>
                <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Skills required</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
                  {roleInfo.skills.map((sk, i) => (
                    <button type="button" key={i} onClick={sk.click} className="unbutton role-skill-link" style={{ display: "flex", gap: 9, fontSize: "0.875rem", lineHeight: 1.45, color: "var(--indigo)", cursor: "pointer" }}>
                      <span style={{ flex: "none", width: 5, height: 5, borderRadius: "50%", background: "var(--indigo)", marginTop: 7 }}></span>
                      <span style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>{sk.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Phase 1.5 item 6: two cards, not one - career progression is the
                  internal ladder (same function/firm type), exit opportunities is a
                  genuinely different function/firm type/industry. Code-level filtered
                  server-side (roleOverview.js's filterExitOpportunities), so nothing
                  that just reduces to a senior version of this same role shows here. */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "20px 22px" }}>
                <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Career progression</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
                  {roleInfo.careerProgression.map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 9, fontSize: "0.875rem", lineHeight: 1.45, color: "var(--text-700)" }}>
                      <span style={{ flex: "none", width: 5, height: 5, borderRadius: "50%", background: "var(--indigo)", marginTop: 7 }}></span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "20px 22px" }}>
                <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Exit opportunities</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
                  {roleInfo.exitOpportunities.map((ex, i) => (
                    <div key={i} style={{ display: "flex", gap: 9, fontSize: "0.875rem", lineHeight: 1.45, color: "var(--text-700)" }}>
                      <span style={{ flex: "none", width: 5, height: 5, borderRadius: "50%", background: "var(--green)", marginTop: 7 }}></span>
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

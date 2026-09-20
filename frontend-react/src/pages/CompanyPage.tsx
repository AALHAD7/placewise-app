import { useMemo, useState } from "react";
import IndeterminateProgressBar from "../components/IndeterminateProgressBar";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/apiClient";
import { POPULAR_COMPANIES } from "../lib/constants";
import { useSelectorOpenState } from "../hooks/useSelector";
import Selector, { type SelectorOption } from "../components/Selector";
import PageHeader from "../components/PageHeader";
import type { CompanyNewsResponse, CompanyOverview, CompanyOverviewResponse, CompanyRolesResponse, CompanyTimelineEvent, CompanyTimelineResponse, RoleOverviewResponse } from "../types/api";

// Ported from frontend/index.html: companySelector() (3762-3815),
// companyInfo() (3924-3970), roleInCompanySel (4030-4037, a lightSelector()
// dependent on the picked company), loadCompanyNews/Overview/Roles
// (3706-3755), markup (969-1124). Selector state is colocated per-page here
// instead of the old app's global flat picks/openSel/queries maps - nothing
// outside this page ever read across selectors, so this is a safe
// simplification (see migration plan §0.5).

interface NewsState { loading: boolean; error: string; articles: CompanyNewsResponse["articles"] }
interface OverviewState { loading: boolean; error: string; data: CompanyOverview | null }
interface RolesState { loading: boolean; error: string; roles: string[] }
interface RoleAtCompanyState { loading: boolean; error: string; process: string[] }
interface TimelineState { loading: boolean; error: string; events: CompanyTimelineEvent[] }

export default function CompanyPage() {
  const navigate = useNavigate();
  const [company, setCompany] = useState("");
  const [companyRole, setCompanyRole] = useState("");
  const [newsByCompany, setNewsByCompany] = useState<Record<string, NewsState>>({});
  const [overviewByCompany, setOverviewByCompany] = useState<Record<string, OverviewState>>({});
  const [rolesByCompany, setRolesByCompany] = useState<Record<string, RolesState>>({});
  const [roleAtCompany, setRoleAtCompany] = useState<Record<string, RoleAtCompanyState>>({});
  const [timelineByCompany, setTimelineByCompany] = useState<Record<string, TimelineState>>({});

  const companySel = useSelectorOpenState();
  const roleSel = useSelectorOpenState();

  // Keyed by company@@role - a picked role's process is specific to that
  // exact combination. Reuses the same live-grounded-research endpoint the
  // Role page's optional company picker uses (getRoleOverviewAtCompany) -
  // this is the same feature from the other side: pick company first, role
  // second, instead of role first, company second.
  function loadRoleAtCompany(c: string, r: string) {
    const key = c + "@@" + r;
    setRoleAtCompany((s) => ({ ...s, [key]: { loading: true, error: "", process: [] } }));
    apiFetch<RoleOverviewResponse>("/api/roles/" + encodeURIComponent(r) + "?company=" + encodeURIComponent(c), {}, "Failed to load role info at this company.")
      .then((data) => setRoleAtCompany((s) => ({ ...s, [key]: { loading: false, error: "", process: data.role.process || [] } })))
      .catch((e) => setRoleAtCompany((s) => ({ ...s, [key]: { loading: false, error: e instanceof Error ? e.message : "Could not load role info.", process: [] } })));
  }

  function loadCompanyNews(c: string) {
    setNewsByCompany((s) => ({ ...s, [c]: { loading: true, error: "", articles: [] } }));
    apiFetch<CompanyNewsResponse>("/api/companies/" + encodeURIComponent(c) + "/news", {}, "Failed to load news")
      .then((data) => setNewsByCompany((s) => ({ ...s, [c]: { loading: false, error: "", articles: data.articles || [] } })))
      .catch(() => setNewsByCompany((s) => ({ ...s, [c]: { loading: false, error: "Live news unavailable - is the backend running?", articles: [] } })));
  }

  function loadCompanyOverview(c: string) {
    setOverviewByCompany((s) => ({ ...s, [c]: { loading: true, error: "", data: s[c]?.data || null } }));
    apiFetch<CompanyOverviewResponse>("/api/companies/" + encodeURIComponent(c), {}, "Failed to load company info.")
      .then((data) => setOverviewByCompany((s) => ({ ...s, [c]: { loading: false, error: "", data: data.company } })))
      .catch((e) => setOverviewByCompany((s) => ({ ...s, [c]: { loading: false, error: e instanceof Error ? e.message : "Could not load company info.", data: null } })));
  }

  function loadCompanyRoles(c: string) {
    setRolesByCompany((s) => ({ ...s, [c]: { loading: true, error: "", roles: [] } }));
    apiFetch<CompanyRolesResponse>("/api/companies/" + encodeURIComponent(c) + "/roles", {}, "Failed to load company roles.")
      .then((data) => setRolesByCompany((s) => ({ ...s, [c]: { loading: false, error: "", roles: data.roles || [] } })))
      .catch((e) => setRolesByCompany((s) => ({ ...s, [c]: { loading: false, error: e instanceof Error ? e.message : "Could not load company roles.", roles: [] } })));
  }

  function loadCompanyTimeline(c: string) {
    setTimelineByCompany((s) => ({ ...s, [c]: { loading: true, error: "", events: [] } }));
    apiFetch<CompanyTimelineResponse>("/api/companies/" + encodeURIComponent(c) + "/timeline", {}, "Failed to load company timeline.")
      .then((data) => setTimelineByCompany((s) => ({ ...s, [c]: { loading: false, error: "", events: data.events || [] } })))
      .catch((e) => setTimelineByCompany((s) => ({ ...s, [c]: { loading: false, error: e instanceof Error ? e.message : "Could not load company timeline.", events: [] } })));
  }

  function pickCompany(title: string) {
    setCompany(title);
    setCompanyRole("");
    companySel.reset();
    loadCompanyNews(title);
    loadCompanyOverview(title);
    loadCompanyRoles(title);
    loadCompanyTimeline(title);
  }

  // --- companySelector() port ---
  const trimmed = companySel.query.trim();
  const filtered = trimmed ? POPULAR_COMPANIES.filter((o) => o.toLowerCase().includes(trimmed.toLowerCase())) : POPULAR_COMPANIES;
  const exactInList = trimmed && POPULAR_COMPANIES.some((o) => o.toLowerCase() === trimmed.toLowerCase());
  const companyOptions: SelectorOption[] = filtered.map((o) => ({ label: o, selected: company === o, pick: () => pickCompany(o) }));
  if (trimmed.length >= 2 && !exactInList) {
    companyOptions.push({ label: "Search for “" + trimmed + "”", selected: false, pick: () => pickCompany(trimmed) });
  }

  // --- roleInCompanySel (lightSelector) port ---
  // Not disabled on an empty/errored fetched-roles list, or gated on it being
  // exhaustive - that list is itself AI-researched (getCompanyRoles) and can
  // plausibly miss a real role the company hires for (exactly what happened
  // here: IndiaMart hires Associate Product Managers, the research just
  // didn't surface it). Free text always works via the "Search for" fallback
  // below, same pattern as the Role/Company selectors.
  const cr = rolesByCompany[company] || { loading: false, error: "", roles: [] };
  const roleDisabled = !company;
  const rolePlaceholder = !company ? "Select a company first" : cr.loading ? "Loading roles…" : "Select a job role";
  const roleQueryTrimmed = roleSel.query.trim();
  const roleShown = roleQueryTrimmed ? cr.roles.filter((o) => o.toLowerCase().includes(roleQueryTrimmed.toLowerCase())) : cr.roles;
  const roleExactInList = roleQueryTrimmed && cr.roles.some((o) => o.toLowerCase() === roleQueryTrimmed.toLowerCase());
  function pickCompanyRole(r: string) {
    setCompanyRole(r);
    roleSel.reset();
    if (company) loadRoleAtCompany(company, r);
  }
  const roleOptions = roleShown.map((o) => ({
    label: o,
    selected: companyRole === o,
    pick: () => pickCompanyRole(o)
  }));
  if (roleQueryTrimmed.length >= 2 && !roleExactInList) {
    roleOptions.push({ label: "Search for “" + roleQueryTrimmed + "”", selected: false, pick: () => pickCompanyRole(roleQueryTrimmed) });
  }

  // --- companyInfo() port ---
  const ov = overviewByCompany[company] || { loading: false, error: "", data: null };
  const news = newsByCompany[company];
  const timelineInfo = timelineByCompany[company] || { loading: false, error: "", events: [] };
  // Once a role is picked, the process card switches from the generic
  // company-wide rounds (ov.data.rounds) to real research for this exact
  // role at this company (see loadRoleAtCompany) - previously `companyRole`
  // only relabeled the same generic rounds, never actually changed the data
  // shown, which is the substance of what the user flagged.
  const rac = companyRole ? roleAtCompany[company + "@@" + companyRole] : undefined;
  const companyInfo = useMemo(() => {
    if (!company) return null;
    const loading = ov.loading;
    const data = ov.data;
    const roleLoading = !!companyRole && (!rac || rac.loading);
    const useRoleProcess = !!companyRole && !!rac && !rac.loading && !rac.error;
    return {
      loading,
      error: ov.error,
      about: loading ? "" : data?.about || "",
      facts: loading ? [] : data?.facts || [],
      hasRole: !!companyRole,
      procTitle: companyRole ? "Recruitment process · " + companyRole : "Recruitment process",
      procLoading: roleLoading,
      procHint: companyRole
        ? (roleLoading ? "Researching " + companyRole + "'s process at " + company + "…" : rac?.error || (useRoleProcess ? "Researched specifically for this role at this company." : "General guidance based on public information - actual process varies by role and year."))
        : (loading ? "" : data?.processNote || "General guidance based on public information - actual process varies by role and year."),
      rounds: useRoleProcess
        ? (rac!.process || []).map((step, i) => ({ n: "R" + (i + 1), name: step, detail: "" }))
        : (loading || roleLoading ? [] : (data?.rounds || []).map((r, i) => ({ n: "R" + (i + 1), name: r.name, detail: r.detail }))),
      showNoExperiences: !loading && !ov.error && (data?.experiences || []).length === 0,
      experiences: loading ? [] : (data?.experiences || []).map((e) => ({ who: e.who, when: e.when ? new Date(e.when).toLocaleDateString() : "", text: e.text })),
      newsStatus: !news ? "" : news.loading ? "Loading live news…" : news.error ? news.error : news.articles.length ? "Live from backend" : "",
      news: news && news.articles.length
        ? news.articles.slice(0, 6).map((a) => ({ t: a.title, d: (a.source || "") + (a.publishedAt ? " · " + new Date(a.publishedAt).toLocaleDateString() : ""), url: a.url }))
        : [],
      investments: loading
        ? []
        : (data?.investments || []).map((i) => ({ t: i.title, d: i.detail, url: "https://news.google.com/search?q=" + encodeURIComponent(company + " " + i.title) }))
    };
  }, [company, companyRole, ov, news, rac]);

  function goAddExperience() {
    navigate("/community?company=" + encodeURIComponent(company));
  }

  return (
    <>
      <PageHeader title="Company" subtitle="Pick a company to read up" />

      <div style={{ marginTop: 26, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, maxWidth: 700 }}>
        <div style={{ order: 1 }}>
          <Selector
            label="Company"
            value={company || "Select a company"}
            hasValue={!!company}
            open={companySel.open}
            query={companySel.query}
            options={companyOptions}
            empty={companyOptions.length === 0}
            emptyText={`No matches for “${companySel.query}”.`}
            searchPlaceholder="Search companies..."
            toggle={companySel.toggle}
            onQuery={companySel.onQuery}
          />
        </div>
        <div style={{ order: 2 }}>
          <Selector
            label="Job role"
            value={companyRole || rolePlaceholder}
            hasValue={!!companyRole}
            open={roleSel.open}
            query={roleSel.query}
            options={roleOptions}
            empty={roleOptions.length === 0}
            emptyText={`No matches for “${roleSel.query}”.`}
            disabled={roleDisabled}
            searchPlaceholder="Search roles..."
            toggle={roleSel.toggle}
            onQuery={roleSel.onQuery}
          />
        </div>
      </div>

      {!companyInfo && (
        <>
          <div className="section-title" style={{ marginTop: 34 }}>
            What you'll find here
          </div>
          <div className="grid-3">
            <div className="feature-card" style={{ cursor: "default" }}>
              <div className="fc-icon icon-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
                  <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
                </svg>
              </div>
              <div className="feature-title">Company overview</div>
              <div className="feature-desc" style={{ marginBottom: 0 }}>
                Pick a company to see what it does, how it makes money, and the key facts - sector, HQ, founded, headcount.
              </div>
            </div>
            <div className="feature-card" style={{ cursor: "default" }}>
              <div className="fc-icon icon-purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 16 14" />
                </svg>
              </div>
              <div className="feature-title">Company timeline</div>
              <div className="feature-desc" style={{ marginBottom: 0 }}>
                A history of the company's major milestones since founding - funding rounds, acquisitions, pivots.
              </div>
            </div>
            <div className="feature-card" style={{ cursor: "default" }}>
              <div className="fc-icon icon-cyan">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                  <path d="M18 14h-4" />
                  <path d="M18 18h-4" />
                  <path d="M10 6h4" />
                  <path d="M10 10h4" />
                </svg>
              </div>
              <div className="feature-title">Live news &amp; investments</div>
              <div className="feature-desc" style={{ marginBottom: 0 }}>
                Recent news pulled live, plus what the company is actually investing in right now - not a static snapshot.
              </div>
            </div>
          </div>
          <div className="grid-full">
            <div className="feature-card wide" style={{ cursor: "default" }}>
              <div className="fc-icon icon-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div className="fc-body">
                <div className="feature-title">Recruitment process &amp; interview experiences</div>
                <div className="feature-desc" style={{ marginBottom: 0 }}>
                  See the interview process - pick a job role too and it's researched specifically for that role at this company - plus real interview experiences shared by other candidates in the Community.
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {companyInfo && (
        <>
          {companyInfo.loading && <div style={{ marginTop: 28, color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>Loading company info…</div>}
          {companyInfo.error && <div className="t-shake" style={{ marginTop: 28, color: "var(--red-dark)", fontSize: "0.84375rem" }}>{companyInfo.error}</div>}

          <div style={{ marginTop: 28, background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "22px 24px" }}>
            <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>About the company</div>
            <p style={{ margin: "9px 0 0", fontSize: "0.96875rem", lineHeight: 1.6, color: "var(--text-900)" }}>{companyInfo.about}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18, borderTop: "1px solid #f1f2f5", paddingTop: 16 }}>
              {companyInfo.facts.map((f, i) => (
                <div key={i} style={{ flex: 1, minWidth: 130 }}>
                  <div style={{ color: "var(--text-lightgray)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" }}>{f.k}</div>
                  <div style={{ marginTop: 4, fontSize: "0.90625rem", fontWeight: 600, color: "var(--text-900)" }}>{f.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 14, background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "22px 24px" }}>
            <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Company timeline</div>
            {timelineInfo.loading && (
              <div role="status" aria-live="polite" style={{ marginTop: 12, maxWidth: 420 }}>
                <div style={{ color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>Researching {company}'s history…</div>
                <IndeterminateProgressBar />
              </div>
            )}
            {timelineInfo.error && <div style={{ marginTop: 12, color: "var(--red-dark)", fontSize: "0.84375rem" }}>{timelineInfo.error}</div>}
            {!timelineInfo.loading && !timelineInfo.error && timelineInfo.events.length === 0 && (
              <div style={{ marginTop: 12, color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>No timeline available for this company yet.</div>
            )}
            {timelineInfo.events.length > 0 && (
              <div style={{ marginTop: 16, position: "relative" }}>
                <div style={{ position: "absolute", left: 71, top: 6, bottom: 6, width: 2, background: "var(--track)" }}></div>
                {timelineInfo.events.map((ev, i) => (
                  <div key={i} style={{ display: "flex", gap: 18, paddingBottom: i === timelineInfo.events.length - 1 ? 0 : 22, position: "relative" }}>
                    <div style={{ flex: "none", width: 60, textAlign: "right", paddingTop: 2, fontSize: "0.78125rem", fontWeight: 700, color: "var(--text-gray2)", letterSpacing: "-.01em" }}>{ev.year}</div>
                    <span style={{ flex: "none", width: 10, height: 10, borderRadius: "50%", background: "var(--indigo)", marginTop: 5, boxShadow: "0 0 0 3px #EAF1FE", zIndex: 1 }}></span>
                    <div style={{ minWidth: 0, paddingBottom: 2 }}>
                      <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-900)" }}>{ev.title}</div>
                      <div style={{ marginTop: 4, color: "var(--text-gray2)", fontSize: "0.84375rem", lineHeight: 1.5 }}>{ev.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Recent news</div>
                <span style={{ color: "var(--text-lightgray)", fontSize: "0.6875rem", fontWeight: 500 }}>{companyInfo.newsStatus}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
                {companyInfo.news.map((n, i) => (
                  <div key={i} style={{ display: "flex", gap: 10 }}>
                    <span style={{ flex: "none", width: 5, height: 5, borderRadius: "50%", background: "var(--indigo)", marginTop: 7 }}></span>
                    <div>
                      <a href={n.url} target="_blank" rel="noopener" className="company-link" style={{ display: "block", fontSize: "0.90625rem", fontWeight: 600, lineHeight: 1.4, color: "var(--text-900)", textDecoration: "none", borderBottom: "1px solid transparent" }}>
                        {n.t}{" "}
                        <svg width="10.5" height="10.5" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: 1 }}>
                          <path d="M15 3h6v6" />
                          <path d="M10 14 21 3" />
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        </svg>
                      </a>
                      <div style={{ marginTop: 3, color: "var(--text-gray2)", fontSize: "0.84375rem", lineHeight: 1.45 }}>{n.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "20px 22px" }}>
              <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Major investments</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
                {companyInfo.investments.map((iv, i) => (
                  <div key={i} style={{ display: "flex", gap: 10 }}>
                    <span style={{ flex: "none", width: 5, height: 5, borderRadius: "50%", background: "var(--green)", marginTop: 7 }}></span>
                    <div>
                      <a href={iv.url} target="_blank" rel="noopener" className="company-link" style={{ display: "block", fontSize: "0.90625rem", fontWeight: 600, lineHeight: 1.4, color: "var(--text-900)", textDecoration: "none", borderBottom: "1px solid transparent" }}>
                        {iv.t}{" "}
                        <svg width="10.5" height="10.5" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: 1 }}>
                          <path d="M15 3h6v6" />
                          <path d="M10 14 21 3" />
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        </svg>
                      </a>
                      <div style={{ marginTop: 3, color: "var(--text-gray2)", fontSize: "0.84375rem", lineHeight: 1.45 }}>{iv.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14, background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>{companyInfo.procTitle}</div>
                <div style={{ marginTop: 5, color: "var(--text-lightgray)", fontSize: "0.78125rem" }}>{companyInfo.procHint}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 16 }}>
              {companyInfo.rounds.map((rd, i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "13px 0", borderTop: "1px solid #f4f4f7" }}>
                  <span style={{ flex: "none", width: 30, height: 30, borderRadius: "var(--r-sm)", background: "#EAF1FE", color: "var(--indigo)", font: "700 0.75rem 'JetBrains Mono',monospace", display: "flex", alignItems: "center", justifyContent: "center" }}>{rd.n}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-900)" }}>{rd.name}</div>
                    <div style={{ marginTop: 4, color: "var(--text-gray2)", fontSize: "0.84375rem", lineHeight: 1.5 }}>{rd.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 14, background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
              <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Interview experiences</div>
              <button type="button" className="unbutton" onClick={goAddExperience} style={{ color: "var(--indigo)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}>Add yours</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
              {companyInfo.experiences.map((e, i) => (
                <div key={i} style={{ borderLeft: "2px solid #e5e5f0", padding: "2px 0 2px 16px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-900)" }}>{e.who}</span>
                    <span style={{ color: "var(--text-lightgray)", fontSize: "0.78125rem" }}>{e.when}</span>
                  </div>
                  <p style={{ margin: "7px 0 0", fontSize: "0.90625rem", lineHeight: 1.6, color: "var(--text-700)" }}>{e.text}</p>
                </div>
              ))}
              {companyInfo.showNoExperiences && <div style={{ color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>No experiences shared for this company yet - be the first.</div>}
            </div>
          </div>
        </>
      )}
    </>
  );
}

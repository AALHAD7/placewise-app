import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import IndeterminateProgressBar from "../components/IndeterminateProgressBar";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/apiClient";
import { POPULAR_COMPANIES, titleCase, companyDisplayLabel } from "../lib/constants";
import { useSelectorOpenState } from "../hooks/useSelector";
import { useExitTransition } from "../hooks/useExitTransition";
import Selector, { type SelectorOption } from "../components/Selector";
import PageHeader from "../components/PageHeader";
import type { CompanyBusinessModelResponse, CompanyExecutive, CompanyLeadershipResponse, CompanyLogoResponse, CompanyNewsResponse, CompanyOverview, CompanyOverviewResponse, CompanyRatingResponse, CompanyRolesResponse, CompanyRoleRatingResponse, CompanySubsidiariesResponse, CompanyTimelineEvent, CompanyTimelineResponse, CompanyValueChainResponse, CompanyValueChainStage, CompanyValueChainStageDetailResponse, RoleOverviewResponse } from "../types/api";

// Ported from frontend/index.html: companySelector() (3762-3815),
// companyInfo() (3924-3970), roleInCompanySel (4030-4037, a lightSelector()
// dependent on the picked company), loadCompanyNews/Overview/Roles
// (3706-3755), markup (969-1124). Selector state is colocated per-page here
// instead of the old app's global flat picks/openSel/queries maps - nothing
// outside this page ever read across selectors, so this is a safe
// simplification (see migration plan §0.5).

// Apple's palette reserves one saturated blue for accents rather than a
// rainbow per item (DESIGN.md Do's/Don'ts) - every stage gets the same
// Studio Mist tile and Apple Blue glyph, matching global.css's .icon-*.
const VALUE_CHAIN_COLORS = [
  { bg: "#f5f5f7", text: "#0066cc" },
  { bg: "#f5f5f7", text: "#0066cc" },
  { bg: "#f5f5f7", text: "#0066cc" },
  { bg: "#f5f5f7", text: "#0066cc" },
  { bg: "#f5f5f7", text: "#0066cc" },
  { bg: "#f5f5f7", text: "#0066cc" }
];

interface NewsState { loading: boolean; error: string; articles: CompanyNewsResponse["articles"] }
interface OverviewState { loading: boolean; error: string; data: CompanyOverview | null }
interface RolesState { loading: boolean; error: string; roles: string[] }
interface RoleAtCompanyState { loading: boolean; error: string; process: string[] }
interface TimelineState { loading: boolean; error: string; events: CompanyTimelineEvent[] }
interface ValueChainState { loading: boolean; error: string; stages: CompanyValueChainStage[] }
interface StageDetailState { loading: boolean; error: string; detail: string; sources: CompanyValueChainStageDetailResponse["sources"]; grounded: boolean }
interface BusinessModelState { loading: boolean; error: string; ascii: string; howItWorks: string; sources: CompanyBusinessModelResponse["sources"]; grounded: boolean }
interface RatingState { loading: boolean; error: string; found: boolean; rating: number | null; reviewCount: string | null; sources: CompanyRatingResponse["sources"]; grounded: boolean }
interface RoleRatingState { loading: boolean; error: string; found: boolean; rating: number | null; reviewCount: string | null; matchedRoleTitle: string | null; isExactMatch: boolean; sources: CompanyRoleRatingResponse["sources"]; grounded: boolean }
interface LeadershipState { loading: boolean; error: string; executives: CompanyExecutive[] }
interface LogoState { loading: boolean; url: string | null }
interface SubsidiariesState { loading: boolean; error: string; subsidiaries: string[] }

// Same initials-circle treatment as TopNav's user avatar (global.css's
// .avatar) - used here whenever an executive has no verified real photo
// (lookupWikipediaPhoto in companyLeadership.js only attaches one when it
// can confirm a genuine match), so the panel never shows a blank gap or,
// worse, a fabricated photo of a real named person.
function initialsOf(name: string): string {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
}

// The stage-detail prompt asks for one bullet per line ("- ..."); this
// splits on newlines and strips the leading marker so it renders as a real
// list instead of a wall of text. Falls back to treating it as a single
// paragraph if the model ever returns unbulleted prose (e.g. the "search
// wasn't available" fallback line) - never renders a broken one-item list.
function parseBullets(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim().replace(/^[-*•]\s*/, ""))
    .filter(Boolean);
}

// Horizontal, wrapping source chips (was a vertical list) - saves space and
// the pill/underline treatment makes it visually obvious these are links,
// not just labels.
function SourceLinks({ sources }: { sources: { title: string; uri: string }[] }) {
  if (!sources.length) return null;
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Sources</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 9 }}>
        {sources.map((src, i) => (
          <a
            key={i}
            href={src.uri}
            target="_blank"
            rel="noopener noreferrer"
            title={src.title || src.uri}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, maxWidth: 280, padding: "6px 12px", borderRadius: "var(--r-pill)", background: "var(--surface-sunken)", border: "1px solid var(--card-border)", color: "var(--indigo)", fontSize: "0.78125rem", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {src.title || src.uri} <span aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// Rounds to the nearest half-star for display - the underlying number (e.g.
// "3.7") is still shown as text alongside it, this is just the visual.
function StarRating({ rating }: { rating: number }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span style={{ display: "inline-flex", gap: 2 }} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = rounded >= n ? 1 : rounded >= n - 0.5 ? 0.5 : 0;
        return (
          <span key={n} style={{ position: "relative", fontSize: "1.125rem", lineHeight: 1, color: "var(--card-border)" }}>
            ★
            {fill > 0 && (
              <span style={{ position: "absolute", inset: 0, overflow: "hidden", width: fill === 1 ? "100%" : "50%", color: "#b64400" }}>★</span>
            )}
          </span>
        );
      })}
    </span>
  );
}

export default function CompanyPage() {
  const navigate = useNavigate();
  // `company` is the entity every section below actually researches/shows -
  // it becomes the subsidiary's name once one is picked (see pickSubsidiary),
  // so every existing lookup/fetch keyed on `company` throughout this file
  // automatically redirects to the subsidiary with no further changes.
  // `parentCompany` is separate: the top-level pick the Company selector
  // itself shows and matches against, and the key the Subsidiary list is
  // fetched/cached under - it does NOT change when a subsidiary is picked,
  // so the Subsidiary field can keep offering the same siblings the whole
  // time you're looking at one of them.
  const [company, setCompany] = useState("");
  const [parentCompany, setParentCompany] = useState("");
  const [subsidiary, setSubsidiary] = useState("");
  const [companyRole, setCompanyRole] = useState("");
  const [newsByCompany, setNewsByCompany] = useState<Record<string, NewsState>>({});
  const [overviewByCompany, setOverviewByCompany] = useState<Record<string, OverviewState>>({});
  const [rolesByCompany, setRolesByCompany] = useState<Record<string, RolesState>>({});
  const [roleAtCompany, setRoleAtCompany] = useState<Record<string, RoleAtCompanyState>>({});
  const [timelineByCompany, setTimelineByCompany] = useState<Record<string, TimelineState>>({});
  const [valueChainByCompany, setValueChainByCompany] = useState<Record<string, ValueChainState>>({});
  const [stageDetailByKey, setStageDetailByKey] = useState<Record<string, StageDetailState>>({});
  const [openStage, setOpenStage] = useState<CompanyValueChainStage | null>(null);
  const [businessModelByCompany, setBusinessModelByCompany] = useState<Record<string, BusinessModelState>>({});
  const [businessModelOpen, setBusinessModelOpen] = useState(false);
  const [ratingByCompany, setRatingByCompany] = useState<Record<string, RatingState>>({});
  const [roleRatingByKey, setRoleRatingByKey] = useState<Record<string, RoleRatingState>>({});
  const [leadershipByCompany, setLeadershipByCompany] = useState<Record<string, LeadershipState>>({});
  const [logoByCompany, setLogoByCompany] = useState<Record<string, LogoState>>({});
  const [subsidiariesByCompany, setSubsidiariesByCompany] = useState<Record<string, SubsidiariesState>>({});

  const companySel = useSelectorOpenState();
  const subsidiarySel = useSelectorOpenState();
  const roleSel = useSelectorOpenState();

  // The stage-detail modal - same enter/leave-as-a-material pattern as
  // ResumePage's story modal (portals to <body>, pushes .app-shell back
  // while open, closes on Escape or a scrim click).
  const { rendered: stageModalRendered, exiting: stageModalExiting } = useExitTransition(!!openStage, 200);
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(".app-shell");
    if (!shell) return;
    shell.dataset.modal = stageModalRendered && !stageModalExiting ? "true" : "false";
    return () => {
      shell.dataset.modal = "false";
    };
  }, [stageModalRendered, stageModalExiting]);
  useEffect(() => {
    if (!openStage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenStage(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openStage]);

  // Business model modal - same pattern, separate from the stage-detail one
  // since they're opened from different triggers and never both at once.
  const { rendered: bmModalRendered, exiting: bmModalExiting } = useExitTransition(businessModelOpen, 200);
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(".app-shell");
    if (!shell) return;
    shell.dataset.modal = bmModalRendered && !bmModalExiting ? "true" : "false";
    return () => {
      shell.dataset.modal = "false";
    };
  }, [bmModalRendered, bmModalExiting]);
  useEffect(() => {
    if (!businessModelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBusinessModelOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [businessModelOpen]);

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
      .catch((e) => setNewsByCompany((s) => ({ ...s, [c]: { loading: false, error: e instanceof Error ? e.message : "Could not load live news.", articles: [] } })));
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

  function loadCompanyValueChain(c: string) {
    setValueChainByCompany((s) => ({ ...s, [c]: { loading: true, error: "", stages: [] } }));
    apiFetch<CompanyValueChainResponse>("/api/companies/" + encodeURIComponent(c) + "/value-chain", {}, "Failed to load company value chain.")
      .then((data) => setValueChainByCompany((s) => ({ ...s, [c]: { loading: false, error: "", stages: data.stages || [] } })))
      .catch((e) => setValueChainByCompany((s) => ({ ...s, [c]: { loading: false, error: e instanceof Error ? e.message : "Could not load company value chain.", stages: [] } })));
  }

  // Glassdoor-style rating - generic (company-wide), prefetched with the
  // rest of the page like news/overview/roles/timeline/value-chain.
  function loadCompanyRating(c: string) {
    setRatingByCompany((s) => ({ ...s, [c]: { loading: true, error: "", found: false, rating: null, reviewCount: null, sources: [], grounded: false } }));
    apiFetch<CompanyRatingResponse>("/api/companies/" + encodeURIComponent(c) + "/rating", {}, "Failed to load company rating.")
      .then((data) => setRatingByCompany((s) => ({ ...s, [c]: { loading: false, error: "", found: data.found, rating: data.rating, reviewCount: data.reviewCount, sources: data.sources || [], grounded: data.grounded } })))
      .catch((e) => setRatingByCompany((s) => ({ ...s, [c]: { loading: false, error: e instanceof Error ? e.message : "Could not load company rating.", found: false, rating: null, reviewCount: null, sources: [], grounded: false } })));
  }

  // Role-specific rating - fetched once a role is also picked (see
  // pickCompanyRole), shown instead of the generic rating above. May report
  // a closest-matching role Glassdoor actually rates rather than the exact
  // typed one (see companyRating.js) - matchedRoleTitle/isExactMatch make
  // that explicit rather than silently substituting.
  function loadCompanyRoleRating(c: string, r: string) {
    const key = c + "@@" + r;
    setRoleRatingByKey((s) => ({ ...s, [key]: { loading: true, error: "", found: false, rating: null, reviewCount: null, matchedRoleTitle: null, isExactMatch: false, sources: [], grounded: false } }));
    apiFetch<CompanyRoleRatingResponse>("/api/companies/" + encodeURIComponent(c) + "/rating/" + encodeURIComponent(r), {}, "Failed to load role rating.")
      .then((data) => setRoleRatingByKey((s) => ({ ...s, [key]: { loading: false, error: "", found: data.found, rating: data.rating, reviewCount: data.reviewCount, matchedRoleTitle: data.matchedRoleTitle, isExactMatch: data.isExactMatch, sources: data.sources || [], grounded: data.grounded } })))
      .catch((e) => setRoleRatingByKey((s) => ({ ...s, [key]: { loading: false, error: e instanceof Error ? e.message : "Could not load role rating.", found: false, rating: null, reviewCount: null, matchedRoleTitle: null, isExactMatch: false, sources: [], grounded: false } })));
  }

  // Real depth on a single stage - its own grounded web-search call (see
  // companyValueChainStage.js), not just re-showing the one-line summary
  // already on the card. Keyed by company@@stage so switching companies
  // never shows a stale stage's detail under the new company's modal.
  function stageKey(c: string, stageName: string) {
    return c + "@@" + stageName;
  }

  function loadStageDetail(c: string, stage: CompanyValueChainStage) {
    const key = stageKey(c, stage.name);
    setStageDetailByKey((s) => ({ ...s, [key]: { loading: true, error: "", detail: "", sources: [], grounded: false } }));
    const url = "/api/companies/" + encodeURIComponent(c) + "/value-chain/" + encodeURIComponent(stage.name) + "?description=" + encodeURIComponent(stage.description || "");
    apiFetch<CompanyValueChainStageDetailResponse>(url, {}, "Failed to load stage detail.")
      .then((data) => setStageDetailByKey((s) => ({ ...s, [key]: { loading: false, error: "", detail: data.detail, sources: data.sources || [], grounded: data.grounded } })))
      .catch((e) => setStageDetailByKey((s) => ({ ...s, [key]: { loading: false, error: e instanceof Error ? e.message : "Could not load stage detail.", detail: "", sources: [], grounded: false } })));
  }

  function openStageDetail(stage: CompanyValueChainStage) {
    setOpenStage(stage);
    const key = stageKey(company, stage.name);
    if (!stageDetailByKey[key]) loadStageDetail(company, stage);
  }

  // On-demand only - deliberately not prefetched with the rest of the page
  // (unlike news/overview/roles/timeline/value-chain) since it's a heavier
  // grounded-research call the user explicitly wants gated behind its own
  // button, not something that fires on every company pick.
  function loadBusinessModel(c: string) {
    setBusinessModelByCompany((s) => ({ ...s, [c]: { loading: true, error: "", ascii: "", howItWorks: "", sources: [], grounded: false } }));
    apiFetch<CompanyBusinessModelResponse>("/api/companies/" + encodeURIComponent(c) + "/business-model", {}, "Failed to load business model.")
      .then((data) => setBusinessModelByCompany((s) => ({ ...s, [c]: { loading: false, error: "", ascii: data.ascii, howItWorks: data.howItWorks, sources: data.sources || [], grounded: data.grounded } })))
      .catch((e) => setBusinessModelByCompany((s) => ({ ...s, [c]: { loading: false, error: e instanceof Error ? e.message : "Could not load business model.", ascii: "", howItWorks: "", sources: [], grounded: false } })));
  }

  function openBusinessModel() {
    setBusinessModelOpen(true);
    if (!businessModelByCompany[company]) loadBusinessModel(company);
  }

  // CXOs alongside "About the company" - prefetched with the rest of the
  // page (same reasoning as news/overview/roles/timeline/value-chain/rating:
  // it's meant to be visible immediately, not gated behind its own button
  // like the heavier Business Model canvas).
  function loadCompanyLeadership(c: string) {
    setLeadershipByCompany((s) => ({ ...s, [c]: { loading: true, error: "", executives: [] } }));
    apiFetch<CompanyLeadershipResponse>("/api/companies/" + encodeURIComponent(c) + "/leadership", {}, "Failed to load company leadership.")
      .then((data) => setLeadershipByCompany((s) => ({ ...s, [c]: { loading: false, error: "", executives: data.executives || [] } })))
      .catch((e) => setLeadershipByCompany((s) => ({ ...s, [c]: { loading: false, error: e instanceof Error ? e.message : "Could not load company leadership.", executives: [] } })));
  }

  // Logo for the "Business Model" button - a failed/slow lookup just leaves
  // the button text-only (see the render below), never blocks anything else.
  function loadCompanyLogo(c: string) {
    setLogoByCompany((s) => ({ ...s, [c]: { loading: true, url: null } }));
    apiFetch<CompanyLogoResponse>("/api/companies/" + encodeURIComponent(c) + "/logo", {}, "Failed to load company logo.")
      .then((data) => setLogoByCompany((s) => ({ ...s, [c]: { loading: false, url: data.url } })))
      .catch(() => setLogoByCompany((s) => ({ ...s, [c]: { loading: false, url: null } })));
  }

  // Major/notable subsidiaries of whatever was top-level picked - an empty
  // result (the common case: most companies aren't a conglomerate) is what
  // correctly grays the Subsidiary field out below, not an error state.
  function loadCompanySubsidiaries(c: string) {
    setSubsidiariesByCompany((s) => ({ ...s, [c]: { loading: true, error: "", subsidiaries: [] } }));
    apiFetch<CompanySubsidiariesResponse>("/api/companies/" + encodeURIComponent(c) + "/subsidiaries", {}, "Failed to load company subsidiaries.")
      .then((data) => setSubsidiariesByCompany((s) => ({ ...s, [c]: { loading: false, error: "", subsidiaries: data.subsidiaries || [] } })))
      .catch((e) => setSubsidiariesByCompany((s) => ({ ...s, [c]: { loading: false, error: e instanceof Error ? e.message : "Could not load subsidiaries.", subsidiaries: [] } })));
  }

  // Shared by pickCompany and pickSubsidiary below - every section on this
  // page is fetched for whichever single entity `company` currently names.
  function loadEntity(title: string) {
    loadCompanyNews(title);
    loadCompanyOverview(title);
    loadCompanyRoles(title);
    loadCompanyTimeline(title);
    loadCompanyValueChain(title);
    loadCompanyRating(title);
    loadCompanyLeadership(title);
    loadCompanyLogo(title);
  }

  function pickCompany(title: string) {
    setCompany(title);
    setParentCompany(title);
    setSubsidiary("");
    setCompanyRole("");
    companySel.reset();
    loadEntity(title);
    loadCompanySubsidiaries(title);
  }

  // Picking a subsidiary re-points `company` at it directly - every section
  // below reads from `company`, so Tata Steel's overview/financials/value
  // chain/timeline/business model all come from the exact same code path
  // Tata Group's own did, just fetched for "Tata Steel" instead. subsidiary/
  // parentCompany are untouched by this beyond bookkeeping, so the
  // Subsidiary field keeps offering the same sibling list the whole time.
  function pickSubsidiary(sub: string) {
    setSubsidiary(sub);
    setCompany(sub);
    setCompanyRole("");
    subsidiarySel.reset();
    loadEntity(sub);
  }

  function clearSubsidiary() {
    setSubsidiary("");
    setCompany(parentCompany);
    setCompanyRole("");
    subsidiarySel.reset();
    loadEntity(parentCompany);
  }

  // --- companySelector() port ---
  // Matched/displayed against parentCompany, not company - once a
  // subsidiary is picked, `company` names the subsidiary, but this field's
  // job is to keep showing what was actually top-level picked.
  const trimmed = companySel.query.trim();
  const filtered = trimmed ? POPULAR_COMPANIES.filter((o) => o.toLowerCase().includes(trimmed.toLowerCase())) : POPULAR_COMPANIES;
  const exactInList = trimmed && POPULAR_COMPANIES.some((o) => o.toLowerCase() === trimmed.toLowerCase());
  const companyOptions: SelectorOption[] = filtered.map((o) => ({ label: companyDisplayLabel(o), selected: parentCompany === o, pick: () => pickCompany(o) }));
  if (trimmed.length >= 2 && !exactInList) {
    const titled = titleCase(trimmed);
    companyOptions.push({ label: titled, selected: false, pick: () => pickCompany(titled) });
  }

  // --- subsidiarySel (lightSelector) port - no free-text fallback: this
  // list is researched, not something a user would reliably type from
  // memory, so it only ever offers what was actually found. ---
  const subs = subsidiariesByCompany[parentCompany] || { loading: false, error: "", subsidiaries: [] };
  const subsidiaryDisabled = !parentCompany || subs.loading || subs.subsidiaries.length === 0;
  const subsidiaryPlaceholder = !parentCompany
    ? "Select a company first"
    : subs.loading
    ? "Checking for subsidiaries…"
    : subs.subsidiaries.length === 0
    ? "No subsidiaries found"
    : "Select a subsidiary";
  const subsidiaryQueryTrimmed = subsidiarySel.query.trim();
  const subsidiaryShown = subsidiaryQueryTrimmed
    ? subs.subsidiaries.filter((o) => o.toLowerCase().includes(subsidiaryQueryTrimmed.toLowerCase()))
    : subs.subsidiaries;
  const subsidiaryOptions: SelectorOption[] = subsidiaryShown.map((o) => ({ label: o, selected: subsidiary === o, pick: () => pickSubsidiary(o) }));

  // --- roleInCompanySel (lightSelector) port ---
  // Not disabled on an empty/errored fetched-roles list, or gated on it being
  // exhaustive - that list is itself AI-researched (getCompanyRoles) and can
  // plausibly miss a real role the company hires for (exactly what happened
  // here: IndiaMart hires Associate Product Managers, the research just
  // didn't surface it). Free text always works via the plain-typed-text
  // fallback below, same pattern as the Role/Company selectors.
  const cr = rolesByCompany[company] || { loading: false, error: "", roles: [] };
  const roleDisabled = !company;
  const rolePlaceholder = !company ? "Select a company first" : cr.loading ? "Loading roles…" : "Select a job role";
  const roleQueryTrimmed = roleSel.query.trim();
  const roleShown = roleQueryTrimmed ? cr.roles.filter((o) => o.toLowerCase().includes(roleQueryTrimmed.toLowerCase())) : cr.roles;
  const roleExactInList = roleQueryTrimmed && cr.roles.some((o) => o.toLowerCase() === roleQueryTrimmed.toLowerCase());
  function pickCompanyRole(r: string) {
    setCompanyRole(r);
    roleSel.reset();
    if (company) {
      loadRoleAtCompany(company, r);
      loadCompanyRoleRating(company, r);
    }
  }
  const roleOptions = roleShown.map((o) => ({
    label: o,
    selected: companyRole === o,
    pick: () => pickCompanyRole(o)
  }));
  if (roleQueryTrimmed.length >= 2 && !roleExactInList) {
    const roleQueryTitled = titleCase(roleQueryTrimmed);
    roleOptions.push({ label: roleQueryTitled, selected: false, pick: () => pickCompanyRole(roleQueryTitled) });
  }

  // --- companyInfo() port ---
  const ov = overviewByCompany[company] || { loading: false, error: "", data: null };
  const news = newsByCompany[company];
  const timelineInfo = timelineByCompany[company] || { loading: false, error: "", events: [] };
  const valueChainInfo = valueChainByCompany[company] || { loading: false, error: "", stages: [] };
  const ratingInfo = ratingByCompany[company] || { loading: false, error: "", found: false, rating: null, reviewCount: null, sources: [], grounded: false };
  const roleRatingInfo = companyRole ? roleRatingByKey[company + "@@" + companyRole] : undefined;
  const leadershipInfo = leadershipByCompany[company] || { loading: false, error: "", executives: [] };
  const logoInfo = logoByCompany[company] || { loading: false, url: null };
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
      sector: loading ? null : data?.sector ?? null,
      listed: loading ? null : data?.listed ?? null,
      listedDetail: loading ? null : data?.listedDetail ?? null,
      sharePrice: loading ? null : data?.sharePrice ?? null,
      financials: loading ? null : data?.financials ?? null,
      facts: loading ? [] : data?.facts || [],
      overviewSources: loading ? [] : data?.overviewSources || [],
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

      <div style={{ marginTop: 26, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, maxWidth: 1040 }}>
        <div style={{ order: 1 }}>
          <Selector
            label="Company"
            value={parentCompany || "Select a company"}
            hasValue={!!parentCompany}
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
          {/* Grayed out (disabled) whenever the picked company has no
              researched subsidiaries, or none are picked yet - never hidden,
              so it's always visible that the option exists and whether this
              company has any. "Clear selection" (onClear) drops back to the
              parent's own data via clearSubsidiary(). */}
          <Selector
            label="Subsidiary"
            value={subsidiary || subsidiaryPlaceholder}
            hasValue={!!subsidiary}
            open={subsidiarySel.open}
            query={subsidiarySel.query}
            options={subsidiaryOptions}
            empty={subsidiaryOptions.length === 0}
            emptyText={`No matches for “${subsidiarySel.query}”.`}
            disabled={subsidiaryDisabled}
            searchPlaceholder="Search subsidiaries..."
            toggle={subsidiarySel.toggle}
            onQuery={subsidiarySel.onQuery}
            onClear={subsidiary ? clearSubsidiary : undefined}
          />
        </div>
        <div style={{ order: 3 }}>
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
              <div className="feature-title">Company overview &amp; value chain</div>
              <div className="feature-desc" style={{ marginBottom: 0 }}>
                What it does, how it makes money, the key facts - and a stage-by-stage diagram of how it actually creates value.
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

          <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 14 }}>
            {logoInfo.url ? (
              <img src={logoInfo.url} alt="" width={44} height={44} style={{ borderRadius: 10, objectFit: "contain", flexShrink: 0, boxShadow: "0 0 0 1px var(--card-border)", background: "var(--surface)", padding: 6 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            ) : null}
            <div>
              {/* Everything below this - about, financials, rating, timeline,
                  value chain, business model - is for `company` specifically,
                  which is the subsidiary once one's picked, never the parent
                  group's own data relabeled. */}
              {subsidiary && <div style={{ fontSize: "0.78125rem", fontWeight: 600, color: "var(--text-lightgray)" }}>Subsidiary of {parentCompany}</div>}
              <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-.015em", color: "var(--text-900)" }}>{company}</h2>
            </div>
          </div>

          <div style={{ marginTop: 18, background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "22px 24px" }}>
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
              <div style={{ flex: "2 1 320px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>About the company</div>
                  <button type="button" onClick={openBusinessModel} className="unbutton" style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid var(--card-border)", borderRadius: "var(--r-pill)", padding: "6px 13px 6px 8px", cursor: "pointer", font: "600 0.78125rem 'Instrument Sans',sans-serif", color: "var(--indigo)", background: "var(--surface)" }}>
                    {logoInfo.url ? (
                      <img src={logoInfo.url} alt="" width={18} height={18} style={{ borderRadius: 4, objectFit: "contain", flexShrink: 0 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    ) : null}
                    Business Model
                  </button>
                </div>
                <p style={{ margin: "9px 0 0", fontSize: "0.96875rem", lineHeight: 1.6, color: "var(--text-900)" }}>{companyInfo.about}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18, borderTop: "1px solid var(--divider)", paddingTop: 16 }}>
                  {companyInfo.facts.map((f, i) => (
                    <div key={i} style={{ flex: 1, minWidth: 130 }}>
                      <div style={{ color: "var(--text-lightgray)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" }}>{f.k}</div>
                      <div style={{ marginTop: 4, fontSize: "0.90625rem", fontWeight: 600, color: "var(--text-900)" }}>{f.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {(leadershipInfo.loading || leadershipInfo.executives.length > 0) && (
                <div style={{ flex: "1 1 180px", minWidth: 180, borderLeft: "1px solid var(--divider)", paddingLeft: 24 }}>
                  <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Leadership</div>
                  {leadershipInfo.loading ? (
                    <div style={{ marginTop: 12, color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>Researching leadership…</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
                      {leadershipInfo.executives.map((ex, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {ex.photoUrl ? (
                            <img src={ex.photoUrl} alt="" width={38} height={38} style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <div className="avatar">{initialsOf(ex.name)}</div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-gray2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.title}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Its own section (not folded into the generic facts chips above) -
              listed status and financials are the two claims here most
              likely to be wrong if the model didn't actually search, so they
              get a dedicated, clearly-sourced spot rather than blending into
              the same row as HQ/Founded/Headcount. */}
          <div style={{ marginTop: 14, background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "22px 24px" }}>
            <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>
              Financials
            </div>
            {companyInfo.loading ? (
              <div style={{ marginTop: 12, color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>Loading financials…</div>
            ) : !companyInfo.sector && companyInfo.listed == null && !companyInfo.sharePrice && !companyInfo.financials ? (
              <div style={{ marginTop: 12, color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>Not enough public financial information found for {company}.</div>
            ) : (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 22, marginTop: 14 }}>
                  <div style={{ minWidth: 150 }}>
                    <div style={{ color: "var(--text-lightgray)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" }}>Listed</div>
                    <div style={{ marginTop: 4, fontSize: "1.0625rem", fontWeight: 700, color: companyInfo.listed === true ? "var(--green)" : companyInfo.listed === false ? "var(--text-900)" : "var(--text-lightgray)" }}>
                      {companyInfo.listed === true ? "Yes" : companyInfo.listed === false ? "No" : "Unclear"}
                    </div>
                    {companyInfo.listedDetail && <div style={{ marginTop: 2, fontSize: "0.8125rem", color: "var(--text-gray2)" }}>{companyInfo.listedDetail}</div>}
                  </div>
                  {companyInfo.sharePrice && (
                    <div style={{ minWidth: 150 }}>
                      <div style={{ color: "var(--text-lightgray)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" }}>Share price</div>
                      <div style={{ marginTop: 4, fontSize: "1.0625rem", fontWeight: 700, color: "var(--text-900)" }}>{companyInfo.sharePrice}</div>
                    </div>
                  )}
                  {companyInfo.financials && (
                    <div style={{ minWidth: 150 }}>
                      <div style={{ color: "var(--text-lightgray)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" }}>Financials</div>
                      <div style={{ marginTop: 4, fontSize: "1.0625rem", fontWeight: 700, color: "var(--text-900)" }}>{companyInfo.financials}</div>
                    </div>
                  )}
                  {companyInfo.sector && (
                    <div style={{ minWidth: 150 }}>
                      <div style={{ color: "var(--text-lightgray)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" }}>Sector</div>
                      <div style={{ marginTop: 4, fontSize: "1.0625rem", fontWeight: 700, color: "var(--text-900)" }}>{companyInfo.sector}</div>
                    </div>
                  )}
                </div>
                <SourceLinks sources={companyInfo.overviewSources} />
              </>
            )}
          </div>

          <div style={{ marginTop: 14, background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "22px 24px" }}>
            <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>
              Employee rating{companyRole ? ` · ${companyRole}` : ""}
            </div>
            {(() => {
              const genericBlock = ratingInfo.loading ? (
                <div role="status" aria-live="polite" style={{ marginTop: 12, maxWidth: 420 }}>
                  <div style={{ color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>Researching {company}'s Glassdoor rating…</div>
                  <IndeterminateProgressBar />
                </div>
              ) : ratingInfo.error ? (
                <div style={{ marginTop: 12, color: "var(--red-dark)", fontSize: "0.84375rem" }}>{ratingInfo.error}</div>
              ) : ratingInfo.found && ratingInfo.rating != null ? (
                <>
                  <div style={{ marginTop: 11, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <StarRating rating={ratingInfo.rating} />
                    <span style={{ fontSize: "1.625rem", fontWeight: 700, letterSpacing: "-.02em", color: "var(--text-900)" }}>{ratingInfo.rating.toFixed(1)}</span>
                    {ratingInfo.reviewCount && <span style={{ fontSize: "0.8125rem", color: "var(--text-gray2)" }}>{ratingInfo.reviewCount}</span>}
                  </div>
                  <SourceLinks sources={ratingInfo.sources} />
                </>
              ) : (
                <div style={{ marginTop: 12, color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>No verified Glassdoor rating found for {company}.</div>
              );

              if (!companyRole) return genericBlock;

              const rr = roleRatingInfo;
              if (!rr || rr.loading) {
                return (
                  <div role="status" aria-live="polite" style={{ marginTop: 12, maxWidth: 420 }}>
                    <div style={{ color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>Researching {companyRole}'s Glassdoor rating at {company}…</div>
                    <IndeterminateProgressBar />
                  </div>
                );
              }
              if (rr.error) {
                return <div style={{ marginTop: 12, color: "var(--red-dark)", fontSize: "0.84375rem" }}>{rr.error}</div>;
              }
              if (rr.found && rr.rating != null) {
                return (
                  <>
                    <div style={{ marginTop: 11, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <StarRating rating={rr.rating} />
                      <span style={{ fontSize: "1.625rem", fontWeight: 700, letterSpacing: "-.02em", color: "var(--text-900)" }}>{rr.rating.toFixed(1)}</span>
                      {rr.reviewCount && <span style={{ fontSize: "0.8125rem", color: "var(--text-gray2)" }}>{rr.reviewCount}</span>}
                    </div>
                    <div style={{ marginTop: 6, fontSize: "0.8125rem", color: "var(--text-gray2)" }}>
                      {rr.isExactMatch
                        ? `Rated as "${rr.matchedRoleTitle}" on Glassdoor.`
                        : `Glassdoor doesn't break out a rating for "${companyRole}" exactly - closest match found: "${rr.matchedRoleTitle}".`}
                    </div>
                    <SourceLinks sources={rr.sources} />
                  </>
                );
              }
              return (
                <>
                  <div style={{ marginTop: 12, color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>No Glassdoor rating found specifically for {companyRole} at {company} - showing the company's overall rating instead.</div>
                  {genericBlock}
                </>
              );
            })()}
          </div>

          <div style={{ marginTop: 14, background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "22px 24px" }}>
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
                    <span style={{ flex: "none", width: 10, height: 10, borderRadius: "50%", background: "var(--indigo)", marginTop: 5, boxShadow: "0 0 0 3px #eef6ff", zIndex: 1 }}></span>
                    <div style={{ minWidth: 0, paddingBottom: 2 }}>
                      <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-900)" }}>{ev.title}</div>
                      <div style={{ marginTop: 4, color: "var(--text-gray2)", fontSize: "0.84375rem", lineHeight: 1.5 }}>{ev.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 14, background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "22px 24px" }}>
            <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Value chain</div>
            <div style={{ marginTop: 5, color: "var(--text-lightgray)", fontSize: "0.78125rem" }}>How {company} actually creates and captures value, stage by stage.</div>
            {valueChainInfo.loading && (
              <div role="status" aria-live="polite" style={{ marginTop: 12, maxWidth: 420 }}>
                <div style={{ color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>Researching {company}'s value chain…</div>
                <IndeterminateProgressBar />
              </div>
            )}
            {valueChainInfo.error && <div style={{ marginTop: 12, color: "var(--red-dark)", fontSize: "0.84375rem" }}>{valueChainInfo.error}</div>}
            {!valueChainInfo.loading && !valueChainInfo.error && valueChainInfo.stages.length === 0 && (
              <div style={{ marginTop: 12, color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>No value chain available for this company yet.</div>
            )}
            {valueChainInfo.stages.length > 0 && (
              // A numbered grid, not a chained arrow diagram - arrows between
              // cards break the moment the row wraps (an arrow pointing right
              // into empty space, then the next stage appears below-left of
              // it), which happens at almost any real stage count/viewport.
              // Sequence is conveyed by the number badge + reading order
              // instead, which never breaks.
              <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(228px,1fr))", gap: 14 }}>
                {valueChainInfo.stages.map((st, i) => {
                  const c = VALUE_CHAIN_COLORS[i % VALUE_CHAIN_COLORS.length];
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => openStageDetail(st)}
                      className="unbutton value-chain-stage"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border-input)",
                        borderTop: `3px solid ${c.text}`,
                        borderRadius: "var(--r-md)",
                        padding: "16px 16px 15px",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "block",
                        width: "100%"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <span
                          style={{
                            flex: "none",
                            width: 25,
                            height: 25,
                            borderRadius: "var(--r-pill)",
                            background: c.bg,
                            color: c.text,
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          {i + 1}
                        </span>
                        <div style={{ fontSize: "0.90625rem", fontWeight: 700, color: "var(--text-900)", letterSpacing: "-.006em", lineHeight: 1.3 }}>{st.name}</div>
                      </div>
                      <div style={{ marginTop: 9, color: "var(--text-gray2)", fontSize: "0.8125rem", lineHeight: 1.55 }}>{st.description}</div>
                      <div style={{ marginTop: 10, color: "var(--indigo)", fontSize: "0.75rem", fontWeight: 600 }}>See how this actually works →</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "20px 22px" }}>
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
                        <svg width="10.5" height="10.5" viewBox="0 0 24 24" fill="none" stroke="var(--text-lightgray)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: 1 }}>
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

            <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "20px 22px" }}>
              <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Major investments</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
                {companyInfo.investments.map((iv, i) => (
                  <div key={i} style={{ display: "flex", gap: 10 }}>
                    <span style={{ flex: "none", width: 5, height: 5, borderRadius: "50%", background: "var(--green)", marginTop: 7 }}></span>
                    <div>
                      <a href={iv.url} target="_blank" rel="noopener" className="company-link" style={{ display: "block", fontSize: "0.90625rem", fontWeight: 600, lineHeight: 1.4, color: "var(--text-900)", textDecoration: "none", borderBottom: "1px solid transparent" }}>
                        {iv.t}{" "}
                        <svg width="10.5" height="10.5" viewBox="0 0 24 24" fill="none" stroke="var(--text-lightgray)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: 1 }}>
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

          <div style={{ marginTop: 14, background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>{companyInfo.procTitle}</div>
                <div style={{ marginTop: 5, color: "var(--text-lightgray)", fontSize: "0.78125rem" }}>{companyInfo.procHint}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 16 }}>
              {companyInfo.rounds.map((rd, i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "13px 0", borderTop: "1px solid var(--divider)" }}>
                  <span style={{ flex: "none", width: 30, height: 30, borderRadius: "var(--r-sm)", background: "#eef6ff", color: "var(--indigo)", font: "700 0.75rem 'JetBrains Mono',monospace", display: "flex", alignItems: "center", justifyContent: "center" }}>{rd.n}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-900)" }}>{rd.name}</div>
                    <div style={{ marginTop: 4, color: "var(--text-gray2)", fontSize: "0.84375rem", lineHeight: 1.5 }}>{rd.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 14, background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
              <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Interview experiences</div>
              <button type="button" className="unbutton" onClick={goAddExperience} style={{ color: "var(--indigo)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}>Add yours</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
              {companyInfo.experiences.map((e, i) => (
                <div key={i} style={{ borderLeft: "2px solid var(--divider)", padding: "2px 0 2px 16px" }}>
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

      {stageModalRendered && openStage && createPortal(
        <div
          className={stageModalExiting ? "t-scrim-out" : "t-scrim-in"}
          onClick={(e) => { if (e.target === e.currentTarget) setOpenStage(null); }}
          data-lenis-prevent
          style={{ position: "fixed", inset: 0, background: "rgba(17,20,45,.55)", zIndex: 50, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 20px", overflow: "auto" }}
        >
          <div role="dialog" aria-modal="true" aria-label={openStage.name} className={(stageModalExiting ? "t-panel-out" : "t-panel-in") + " glass-panel"} style={{ width: "100%", maxWidth: 640, borderRadius: "var(--r-md)" }}>
            <div style={{ padding: "24px 26px 18px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>{company} · Value chain</div>
                <h2 style={{ margin: "5px 0 0", fontSize: "1.3125rem", fontWeight: 700, letterSpacing: "-.015em", color: "var(--text-900)" }}>{openStage.name}</h2>
              </div>
              <button type="button" onClick={() => setOpenStage(null)} aria-label="Close" className="unbutton link-darken probe-close" style={{ flex: "none", color: "var(--text-lightgray)", fontSize: "1.25rem", cursor: "pointer", lineHeight: 1, padding: "2px 6px" }}>×</button>
            </div>
            <div data-lenis-prevent style={{ padding: "20px 26px 26px", maxHeight: "62vh", overflow: "auto" }}>
              {(() => {
                const sd = stageDetailByKey[stageKey(company, openStage.name)] || { loading: false, error: "", detail: "", sources: [], grounded: false };
                if (sd.loading) {
                  return (
                    <div role="status" aria-live="polite">
                      <div style={{ color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>Researching exactly how {company} runs this stage…</div>
                      <IndeterminateProgressBar />
                    </div>
                  );
                }
                if (sd.error) {
                  return <div style={{ color: "var(--red-dark)", fontSize: "0.84375rem" }}>{sd.error}</div>;
                }
                const bullets = parseBullets(sd.detail);
                return (
                  <>
                    {bullets.length > 1 ? (
                      <ul style={{ margin: 0, paddingLeft: 20, fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--text-900)", display: "flex", flexDirection: "column", gap: 8 }}>
                        {bullets.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    ) : (
                      <p style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--text-900)" }}>{sd.detail}</p>
                    )}
                    {!sd.grounded && (
                      <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--surface-sunken)", borderRadius: "var(--r-sm)", color: "var(--text-gray2)", fontSize: "0.78125rem", lineHeight: 1.5 }}>
                        Live web search wasn't available for this one, so this is general knowledge rather than a sourced answer - treat it as a starting point, not verified fact.
                      </div>
                    )}
                    <SourceLinks sources={sd.sources} />
                  </>
                );
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {bmModalRendered && createPortal(
        <div
          className={bmModalExiting ? "t-scrim-out" : "t-scrim-in"}
          onClick={(e) => { if (e.target === e.currentTarget) setBusinessModelOpen(false); }}
          data-lenis-prevent
          style={{ position: "fixed", inset: 0, background: "rgba(17,20,45,.55)", zIndex: 50, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 20px", overflow: "auto" }}
        >
          <div role="dialog" aria-modal="true" aria-label={`${company} business model`} className={(bmModalExiting ? "t-panel-out" : "t-panel-in") + " glass-panel"} style={{ width: "100%", maxWidth: 900, borderRadius: "var(--r-md)" }}>
            <div style={{ padding: "24px 26px 18px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>{company}</div>
                <h2 style={{ margin: "5px 0 0", fontSize: "1.3125rem", fontWeight: 700, letterSpacing: "-.015em", color: "var(--text-900)" }}>Business model</h2>
              </div>
              <button type="button" onClick={() => setBusinessModelOpen(false)} aria-label="Close" className="unbutton link-darken probe-close" style={{ flex: "none", color: "var(--text-lightgray)", fontSize: "1.25rem", cursor: "pointer", lineHeight: 1, padding: "2px 6px" }}>×</button>
            </div>
            <div data-lenis-prevent style={{ padding: "20px 26px 26px", maxHeight: "72vh", overflow: "auto" }}>
              {(() => {
                const bm = businessModelByCompany[company] || { loading: false, error: "", ascii: "", howItWorks: "", sources: [], grounded: false };
                if (bm.loading) {
                  return (
                    <div role="status" aria-live="polite">
                      <div style={{ color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>Researching exactly how {company} makes money, end to end…</div>
                      <IndeterminateProgressBar />
                    </div>
                  );
                }
                if (bm.error) {
                  return <div style={{ color: "var(--red-dark)", fontSize: "0.84375rem" }}>{bm.error}</div>;
                }
                return (
                  <>
                    <pre style={{ margin: 0, padding: "16px 18px", background: "#1d1d1f", color: "#d6d6d6", borderRadius: "var(--r-sm)", fontSize: "0.6875rem", lineHeight: 1.5, overflowX: "auto", fontFamily: "'JetBrains Mono',Menlo,Consolas,monospace" }}>{bm.ascii}</pre>

                    <div style={{ marginTop: 20, color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>How this actually works, end to end</div>
                    <p style={{ margin: "9px 0 0", fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--text-900)" }}>{bm.howItWorks}</p>

                    {!bm.grounded && (
                      <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--surface-sunken)", borderRadius: "var(--r-sm)", color: "var(--text-gray2)", fontSize: "0.78125rem", lineHeight: 1.5 }}>
                        Live web search wasn't available for this one, so this is general knowledge rather than a sourced answer - treat it as a starting point, not verified fact.
                      </div>
                    )}
                    <SourceLinks sources={bm.sources} />
                  </>
                );
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

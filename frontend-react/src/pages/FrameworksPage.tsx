import { useEffect, useState } from "react";
import { apiFetch, logActivity } from "../lib/apiClient";
import { trackClick, trackView } from "../lib/uiEvents";
import { ICON_D } from "../lib/constants";
import { useSelectorOpenState } from "../hooks/useSelector";
import Selector, { type SelectorOption } from "../components/Selector";
import PageHeader from "../components/PageHeader";
import AsciiDiagram from "../components/AsciiDiagram";
import FrameworkAskBox from "../components/FrameworkAskBox";
import MarkdownWithDiagrams from "../components/MarkdownWithDiagrams";
import PlacewiseDiagram from "../components/diagrams/PlacewiseDiagram";
import { getAsciiDiagramForFramework } from "../lib/asciiDiagrams";
import type { Framework, FrameworkFunnelDiagram, FrameworkGridDiagram, FrameworksResponse, FrameworksTaxonomyResponse, PlacewiseDiagramBlock } from "../types/api";

// Rebuilt around a real Domain -> Subdomain -> framework browse flow instead
// of one flat, ungrouped list (see migration_019_frameworks_taxonomy.sql +
// DOCUMENT.md Step 41). Frameworks themselves are still fetched from the
// database, not generated - only the taxonomy (which domains/subdomains
// exist) and the real casebook grounding (frameworksGrounding.js's vector
// search) are added on top of the same GET /api/frameworks this page always
// used.

// A domain label as it should read in the UI - frameworks.domain (and
// document_chunks.domain) store the raw ingestion values ("Prodman",
// "Marketing:Sales") for a direct-match RAG filter, not display-ready text.
const DOMAIN_LABELS: Record<string, string> = {
  Prodman: "Product Management",
  "Marketing:Sales": "Marketing & Sales"
};
function domainLabel(domain: string): string {
  return DOMAIN_LABELS[domain] || domain;
}

// FrameworkGridDiagram/FrameworkFunnelDiagram are field-for-field identical to
// PlacewiseDiagramBlock's "matrix"/"funnel" variants - this adapter just wraps the
// already-fetched diagram_data so PlacewiseDiagram (the shared renderer used by the
// admin review queue and Guesstimates) can draw it, with its JSON fallback on malformed
// data, instead of keeping a second, narrower local renderer here.
function toDiagramBlock(type: "grid" | "funnel", data: FrameworkGridDiagram | FrameworkFunnelDiagram): PlacewiseDiagramBlock {
  if (type === "grid" && "cols" in data) {
    return { type: "matrix", xAxis: data.xAxis, yAxis: data.yAxis, cols: data.cols, rows: data.rows, cells: data.cells };
  }
  if (type === "funnel" && "stages" in data) {
    return { type: "funnel", stages: data.stages };
  }
  return { type: "other", description: `Malformed ${type} diagram data` };
}

const DEFAULT_TAXONOMY: FrameworksTaxonomyResponse["domains"] = [
  { domain: "Consulting", subdomains: ["Case Structuring", "Market Sizing & Entry", "Profitability & Growth"] },
  { domain: "Finance", subdomains: ["Corporate Finance & M&A", "Valuation"] },
  { domain: "General Management", subdomains: ["Business Model & Strategy", "Leadership & Behavioural", "Strategy Frameworks"] },
  { domain: "HR", subdomains: ["Performance Management", "Talent & Org Design"] },
  { domain: "Marketing:Sales", subdomains: ["Branding & Positioning", "Go-to-Market", "Growth & Scaling", "Market Analysis", "Marketing Mix"] },
  { domain: "Prodman", subdomains: ["Metrics & Growth", "Prioritization", "Product Design"] }
];

export default function FrameworksPage() {
  const [taxonomy, setTaxonomy] = useState<FrameworksTaxonomyResponse["domains"]>(DEFAULT_TAXONOMY);
  const [taxonomyError, setTaxonomyError] = useState("");

  const [domain, setDomain] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const domainSel = useSelectorOpenState();
  const subdomainSel = useSelectorOpenState();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [list, setList] = useState<Framework[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    apiFetch<FrameworksTaxonomyResponse>("/api/frameworks/taxonomy", {}, "Failed to load framework topics.")
      .then((data) => {
        if (data.domains && data.domains.length) setTaxonomy(data.domains);
      })
      .catch((e) => {
        setTaxonomyError(e instanceof Error ? e.message : "Failed to load domains.");
      });
  }, []);

  useEffect(() => {
    if (!domain) {
      setList([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ domain });
    if (subdomain) params.set("subdomain", subdomain);
    apiFetch<FrameworksResponse>(`/api/frameworks?${params.toString()}`, {}, "Failed to load frameworks.")
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
  }, [domain, subdomain]);

  const empty = !loading && !error && domain && list.length === 0;

  function toggle(f: Framework) {
    const opening = !open[f.id];
    setOpen((s) => ({ ...s, [f.id]: !s[f.id] }));
    if (opening) {
      logActivity("framework_review", f.name);
      // Separate from logActivity above: that feeds the Home dashboard's
      // discrete "did something today" milestones, this feeds the raw
      // per-section engagement rollup (see backend/scripts/rollupUiEvents.js) -
      // different consumers, so both fire rather than one replacing the other.
      trackView("/frameworks", `framework-card:${f.name}`, { domain: f.domain, subdomain: f.subdomain });
    } else {
      trackClick("/frameworks", `framework-card-collapse:${f.name}`);
    }
  }

  function pickDomain(d: string) {
    setDomain(d);
    setSubdomain("");
    domainSel.reset();
    trackClick("/frameworks", `domain-select:${d}`);
  }

  function pickSubdomain(s: string) {
    setSubdomain(s);
    subdomainSel.reset();
    trackClick("/frameworks", `subdomain-select:${s}`, { domain });
  }

  const domainOptions: SelectorOption[] = taxonomy.map((d) => ({
    label: domainLabel(d.domain),
    selected: domain === d.domain,
    pick: () => pickDomain(d.domain)
  }));
  const currentDomainTaxonomy = taxonomy.find((d) => d.domain === domain);
  const subdomainOptions: SelectorOption[] = (currentDomainTaxonomy?.subdomains || []).map((s) => ({
    label: s,
    selected: subdomain === s,
    pick: () => pickSubdomain(s)
  }));

  // Group by subdomain when no subdomain filter is applied, so a domain
  // with several subdomains (e.g. Marketing & Sales) doesn't just dump every
  // framework into one undifferentiated list.
  const grouped: { subdomain: string; items: Framework[] }[] = [];
  if (!subdomain) {
    const bySubdomain = new Map<string, Framework[]>();
    for (const f of list) {
      const key = f.subdomain || "Other";
      if (!bySubdomain.has(key)) bySubdomain.set(key, []);
      bySubdomain.get(key)!.push(f);
    }
    for (const [sd, items] of bySubdomain) grouped.push({ subdomain: sd, items });
  } else {
    grouped.push({ subdomain, items: list });
  }

  return (
    <>
      <PageHeader title="Frameworks" subtitle="Real frameworks from the ingested casebooks, browsable by domain and topic" />

      <div className="section-title" style={{ marginTop: 34 }}>
        What you'll find here
      </div>
      <div className="grid-3">
        <div className="feature-card" style={{ cursor: "default" }}>
          <div className="fc-icon icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </div>
          <div className="feature-title">Pick a domain, then a topic</div>
          <div className="feature-desc" style={{ marginBottom: 0 }}>
            Marketing, Product Management, Consulting, Finance, HR, General Management - then narrow to a topic like GTM, Prioritization, or Valuation.
          </div>
        </div>
        <div className="feature-card" style={{ cursor: "default" }}>
          <div className="fc-icon icon-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <div className="feature-title">Real diagrams, not just text</div>
          <div className="feature-desc" style={{ marginBottom: 0 }}>
            BCG Matrix, Ansoff Matrix, Business Model Canvas and more come with an accurate, labeled diagram - not a wall of prose describing a shape you can't see.
          </div>
        </div>
        <div className="feature-card" style={{ cursor: "default" }}>
          <div className="fc-icon icon-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div className="feature-title">When to use it - and when not to</div>
          <div className="feature-desc" style={{ marginBottom: 0 }}>
            Every framework covers what it is, when it applies, when a different framework is the better call, and the pitfalls candidates actually get dinged for.
          </div>
        </div>
      </div>

      <div style={{ marginTop: 26, display: "flex", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px", maxWidth: 440 }}>
          <Selector
            label="Domain"
            value={domain ? domainLabel(domain) : "Select a domain"}
            hasValue={!!domain}
            open={domainSel.open}
            query={domainSel.query}
            options={domainOptions}
            empty={domainOptions.length === 0}
            emptyText={taxonomyError || "Loading domains…"}
            searchPlaceholder="Search domains..."
            toggle={domainSel.toggle}
            close={domainSel.close}
            onQuery={domainSel.onQuery}
          />
        </div>
        <div style={{ flex: "1 1 320px", maxWidth: 440 }}>
          <Selector
            label="Topic (optional)"
            value={subdomain || (domain ? "All topics" : "Select a domain first")}
            hasValue={!!subdomain}
            open={subdomainSel.open}
            query={subdomainSel.query}
            options={subdomainOptions}
            empty={subdomainOptions.length === 0}
            emptyText={`No matches for “${subdomainSel.query}”.`}
            disabled={!domain}
            searchPlaceholder="Search topics..."
            toggle={subdomainSel.toggle}
            close={subdomainSel.close}
            onQuery={subdomainSel.onQuery}
            onClear={() => setSubdomain("")}
          />
        </div>
      </div>

      {!domain && <div style={{ marginTop: 20, color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>Pick a domain above to see its frameworks.</div>}
      {loading && <div style={{ marginTop: 20, color: "var(--text-gray2)", fontSize: "0.84375rem" }}>Loading frameworks…</div>}
      {error && <div style={{ marginTop: 20, color: "var(--red-dark)", fontSize: "0.8125rem" }}>{error}</div>}
      {empty && <div style={{ marginTop: 20, color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>No frameworks for this topic yet.</div>}

      {grouped.map(({ subdomain: sd, items }) => (
        <div key={sd} style={{ marginTop: 26 }}>
          {!subdomain && <div style={{ marginBottom: 12, fontSize: "0.96875rem", fontWeight: 700, color: "var(--text-900)" }}>{sd}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map((f) => {
              const isOpen = !!open[f.id];
              const hasExample = !!f.example;
              const hasGroundedImage = !!f.grounded_image;
              const steps = Array.isArray(f.steps) ? f.steps : [];
              const pitfalls = Array.isArray(f.pitfalls) ? f.pitfalls : [];

              return (
                <div key={f.id} style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "20px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                    <div style={{ minWidth: 0 }}>
                      <span
                        onClick={() => toggle(f)}
                        title={isOpen ? "Click to collapse" : "Click to expand"}
                        style={{ fontSize: "0.96875rem", fontWeight: 600, color: "var(--indigo)", cursor: "pointer" }}
                      >
                        {f.name}
                      </span>
                      <div style={{ marginTop: 5, color: "var(--text-gray2)", fontSize: "0.84375rem" }}>{f.description}</div>
                    </div>
                    <span
                      onClick={() => toggle(f)}
                      style={{ flex: "none", display: "flex", alignItems: "center", gap: 4, color: "var(--indigo)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      {isOpen ? "Hide" : "Review"}
                      <morph-icon icon={isOpen ? ICON_D.CHEVRON_UP : ICON_D.CHEVRON_DOWN} style={{ width: 14, height: 14, color: "var(--indigo)" }}></morph-icon>
                    </span>
                  </div>
                  {isOpen && (
                    <div className="t-panel-in" style={{ marginTop: 16, borderTop: "1px solid var(--divider)", paddingTop: 14 }}>
                      {(() => {
                        const asciiDiag = getAsciiDiagramForFramework(f.name);
                        if (asciiDiag) {
                          return <AsciiDiagram title={asciiDiag.title} ascii={asciiDiag.ascii} />;
                        }
                        if (f.diagram_type && f.diagram_data) {
                          return (
                            <div style={{ marginTop: 12 }}>
                              <PlacewiseDiagram block={toDiagramBlock(f.diagram_type, f.diagram_data)} />
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {hasGroundedImage && f.grounded_image!.caption && (
                        // Never render `.url` - it's a raw admin Storage URL on the v1
                        // grounding path and always null on v2 (CLAUDE.md diagram-privacy
                        // rule: original page images stay admin-only). Only the casebook
                        // caption, run through the same fence-aware renderer as the rest
                        // of the grounded markdown, reaches students.
                        <div style={{ marginTop: 16 }}>
                          <MarkdownWithDiagrams markdown={f.grounded_image!.caption} />
                        </div>
                      )}

                      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                        {steps.map((step, i) => (
                          <div key={i} style={{ fontSize: "0.84375rem", lineHeight: 1.55, color: "var(--text-900)", textWrap: "pretty" as const }}>
                            • {step}
                          </div>
                        ))}
                      </div>

                      {f.when_to_use && (
                        <div style={{ marginTop: 12, background: "rgba(52, 211, 153, 0.08)", border: "1px solid rgba(52, 211, 153, 0.30)", borderRadius: "var(--r-sm)", padding: "12px 14px" }}>
                          <div style={{ fontSize: "0.65625rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#6ee7b7" }}>When to use it</div>
                          <p style={{ margin: "6px 0 0", fontSize: "0.84375rem", lineHeight: 1.55, color: "var(--text-gray2)", textWrap: "pretty" as const }}>{f.when_to_use}</p>
                        </div>
                      )}
                      {f.when_not_to_use && (
                        <div style={{ marginTop: 10, background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.30)", borderRadius: "var(--r-sm)", padding: "12px 14px" }}>
                          <div style={{ fontSize: "0.65625rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#fbbf24" }}>When not to use it</div>
                          <p style={{ margin: "6px 0 0", fontSize: "0.84375rem", lineHeight: 1.55, color: "var(--text-gray2)", textWrap: "pretty" as const }}>{f.when_not_to_use}</p>
                        </div>
                      )}
                      {pitfalls.length > 0 && (
                        <div style={{ marginTop: 10, background: "rgba(248, 113, 113, 0.08)", border: "1px solid rgba(248, 113, 113, 0.30)", borderRadius: "var(--r-sm)", padding: "12px 14px" }}>
                          <div style={{ fontSize: "0.65625rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#f87171" }}>Common pitfalls</div>
                          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 5 }}>
                            {pitfalls.map((p, i) => (
                              <div key={i} style={{ fontSize: "0.84375rem", lineHeight: 1.55, color: "var(--text-gray2)" }}>
                                • {p}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {hasExample && (
                        <div style={{ marginTop: 12, background: "rgba(96, 165, 250, 0.08)", border: "1px solid rgba(96, 165, 250, 0.30)", borderRadius: "var(--r-sm)", padding: "12px 14px" }}>
                          <div style={{ fontSize: "0.65625rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#60a5fa" }}>Example</div>
                          <p style={{ margin: "6px 0 0", fontSize: "0.84375rem", lineHeight: 1.55, color: "var(--text-gray2)", textWrap: "pretty" as const }}>{f.example}</p>
                        </div>
                      )}
                      {f.grounded_example?.excerpt && (
                        // f.example above is the static authored example; this is the
                        // real casebook excerpt frameworksGrounding.js retrieves - kept
                        // as a separate card so neither is dropped or conflated.
                        <div style={{ marginTop: 12, background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.30)", borderRadius: "var(--r-sm)", padding: "12px 14px" }}>
                          <div style={{ fontSize: "0.65625rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#a78bfa" }}>From the casebooks</div>
                          <div style={{ marginTop: 6 }}>
                            <MarkdownWithDiagrams markdown={f.grounded_example.excerpt} textStyle={{ fontSize: "0.84375rem", color: "var(--text-gray2)" }} />
                          </div>
                        </div>
                      )}

                      <FrameworkAskBox framework={f} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

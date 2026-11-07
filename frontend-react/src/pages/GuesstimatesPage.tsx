import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient";
import PageHeader from "../components/PageHeader";
import MarkdownWithDiagrams from "../components/MarkdownWithDiagrams";
import IndeterminateProgressBar from "../components/IndeterminateProgressBar";
import type { GuesstimateResponse } from "../types/api";

// R8: first real UI for Guesstimates (backend-only as of R7 - GET
// /api/guesstimates/random, grounded in the SRCC Guesstimates Book only,
// see guesstimateRetrieval.js). Layout follows the same "What you'll find
// here" + two-col-sidebar-wide convention as FrameworksPage/RolePage, so the
// page uses the full width instead of floating as a narrow fixed-width
// column. Per CLAUDE.md's grounding policy, the sidebar never renders
// per-answer source attribution (school/casebook/page) - that's
// debugging/admin-only - so it carries static "how to approach it" guidance
// instead.

type LoadState = { loading: boolean; error: string; data: GuesstimateResponse | null };

export default function GuesstimatesPage() {
  const [state, setState] = useState<LoadState>({ loading: true, error: "", data: null });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    apiFetch<GuesstimateResponse>("/api/guesstimates/random", {}, "Failed to load a guesstimate.")
      .then((data) => setState({ loading: false, error: "", data }))
      .catch((e) => setState({ loading: false, error: e instanceof Error ? e.message : "Could not load a guesstimate.", data: null }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader title="Guesstimates" subtitle="Practice problems from the real casebooks, with their source page." />

      <div className="section-title" style={{ marginTop: 34 }}>
        What you'll find here
      </div>
      <div className="grid-3">
        <div className="feature-card" style={{ cursor: "default" }}>
          <div className="fc-icon icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
          </div>
          <div className="feature-title">A fresh problem every time</div>
          <div className="feature-desc" style={{ marginBottom: 0 }}>
            Pulled from a real casebook, not invented - one estimation problem at a time so you can practise the way it actually shows up in an interview.
          </div>
        </div>
        <div className="feature-card" style={{ cursor: "default" }}>
          <div className="fc-icon icon-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
            </svg>
          </div>
          <div className="feature-title">Work it before you scroll</div>
          <div className="feature-desc" style={{ marginBottom: 0 }}>
            Structure your own approach first - clarify the question, break it into drivers, estimate each one - before checking any diagram or working shown.
          </div>
        </div>
        <div className="feature-card" style={{ cursor: "default" }}>
          <div className="fc-icon icon-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 1l4 4-4 4" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <path d="M7 23l-4-4 4-4" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          </div>
          <div className="feature-title">Swap it out anytime</div>
          <div className="feature-desc" style={{ marginBottom: 0 }}>
            Not the right problem to practise right now? Pull another one instantly with "Try another".
          </div>
        </div>
      </div>

      <div className="two-col-sidebar-wide" style={{ marginTop: 28 }}>
        {/* minWidth: 0 overrides the default CSS grid track sizing (a "1fr" track's
            implicit minimum is its content's max-content width, not 0) - without it,
            a wide child like AsciiDiagram's monospace box pushes this column past the
            viewport and the whole page scrolls horizontally on phone widths. */}
        <div style={{ minWidth: 0 }}>
          {state.loading && (
            <div role="status" aria-live="polite" style={{ maxWidth: 420 }}>
              <div style={{ color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>Loading a problem…</div>
              <IndeterminateProgressBar />
            </div>
          )}

          {state.error && !state.loading && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "26px 28px" }}>
              <div className="t-shake" style={{ color: "var(--red-dark)", fontSize: "0.84375rem" }}>{state.error}</div>
              <button
                type="button"
                onClick={load}
                style={{ marginTop: 18, border: "1px solid var(--border-soft)", borderRadius: "var(--r-pill)", padding: "8px 18px", fontSize: "0.8125rem", fontWeight: 600, color: "var(--indigo)", background: "none", cursor: "pointer" }}
              >
                Try another
              </button>
            </div>
          )}

          {!state.loading && !state.error && state.data && !state.data.available && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "26px 28px", color: "var(--text-lightgray)", fontSize: "0.875rem" }}>
              {state.data.reason === "feature_disabled"
                ? "Guesstimates practice isn't switched on yet - check back soon."
                : "Couldn't find a fresh problem just now - try again."}
              {state.data.reason !== "feature_disabled" && (
                <div>
                  <button
                    type="button"
                    onClick={load}
                    style={{ marginTop: 18, border: "1px solid var(--border-soft)", borderRadius: "var(--r-pill)", padding: "8px 18px", fontSize: "0.8125rem", fontWeight: 600, color: "var(--indigo)", background: "none", cursor: "pointer" }}
                  >
                    Try another
                  </button>
                </div>
              )}
            </div>
          )}

          {!state.loading && !state.error && state.data?.available && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "28px 32px" }}>
              <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>
                Practice problem
              </div>
              <div style={{ marginTop: 16, fontSize: "1.0625rem", lineHeight: 1.7 }}>
                {state.data.problem && <MarkdownWithDiagrams markdown={state.data.problem} />}
              </div>
              <button
                type="button"
                onClick={load}
                style={{ marginTop: 18, border: "1px solid var(--border-soft)", borderRadius: "var(--r-pill)", padding: "8px 18px", fontSize: "0.8125rem", fontWeight: 600, color: "var(--indigo)", background: "none", cursor: "pointer" }}
              >
                Try another
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "20px 22px" }}>
            <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>How to approach it</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              {[
                "Restate the question and ask any clarifying questions you'd ask a real interviewer.",
                "Lay out your structure - the drivers you'll multiply or add - before you estimate a single number.",
                "Make reasonable assumptions out loud and sanity-check the final figure against something you know."
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 9, fontSize: "0.84375rem", lineHeight: 1.5, color: "var(--text-700)" }}>
                  <span style={{ flex: "none", width: 5, height: 5, borderRadius: "50%", background: "var(--indigo)", marginTop: 7 }}></span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "20px 22px" }}>
            <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Common pitfalls</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              {[
                "Jumping to a number before explaining the structure behind it.",
                "Picking assumptions that don't hold up against common sense (e.g. population, usage rates).",
                "Not rounding cleanly - messy arithmetic mid-interview costs more than a slightly rough estimate."
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 9, fontSize: "0.84375rem", lineHeight: 1.5, color: "var(--text-700)" }}>
                  <span style={{ flex: "none", width: 5, height: 5, borderRadius: "50%", background: "var(--red-dark)", marginTop: 7 }}></span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

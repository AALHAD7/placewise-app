import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient";
import PageHeader from "../components/PageHeader";
import GroundingNote from "../components/GroundingNote";
import PlacewiseDiagram, { DiagramFallback } from "../components/diagrams/PlacewiseDiagram";
import { splitMarkdownBlocks } from "../lib/placewiseBlocks";
import type { GuesstimateResponse } from "../types/api";

// R8: first real UI for Guesstimates (backend-only as of R7 - GET
// /api/guesstimates/random, grounded in the SRCC Guesstimates Book only,
// see guesstimateRetrieval.js). Minimal by design - a working page that
// correctly shows grounded content with a citation, not a polished
// redesign. Placeholder for Aalhad to redesign where this lives/looks.

type LoadState = { loading: boolean; error: string; data: GuesstimateResponse | null };

// Problem text may itself contain a ```placewise-diagram fence (diagram-
// transcription skill) - same split-and-render pattern the admin review
// queue already uses (ReviewQueue.tsx's RebuiltContent).
function ProblemContent({ markdown }: { markdown: string }) {
  const segments = splitMarkdownBlocks(markdown);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {segments.map((s, i) =>
        s.kind === "text" ? (
          <p key={i} style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--text-900)", whiteSpace: "pre-wrap" }}>{s.text}</p>
        ) : s.parseError ? (
          <DiagramFallback key={i} raw={s.raw} reason={s.parseError} />
        ) : (
          <PlacewiseDiagram key={i} block={s.json} />
        )
      )}
    </div>
  );
}

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

      <div style={{ marginTop: 28, maxWidth: 680 }}>
        {state.loading && <div style={{ color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>Loading a problem…</div>}

        {state.error && !state.loading && (
          <div className="t-shake" style={{ color: "var(--red-dark)", fontSize: "0.84375rem" }}>{state.error}</div>
        )}

        {!state.loading && !state.error && state.data && !state.data.available && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "22px 24px", color: "var(--text-lightgray)", fontSize: "0.875rem" }}>
            Guesstimates practice isn't switched on yet - check back soon.
          </div>
        )}

        {!state.loading && !state.error && state.data?.available && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "22px 24px" }}>
            <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>
              Practice problem
            </div>
            <div style={{ marginTop: 14 }}>
              {state.data.problem && <ProblemContent markdown={state.data.problem} />}
            </div>
            <button
              type="button"
              onClick={load}
              style={{ marginTop: 10, border: "1px solid var(--border-soft)", borderRadius: "var(--r-pill)", padding: "7px 16px", fontSize: "0.8125rem", fontWeight: 600, color: "var(--indigo)", background: "none", cursor: "pointer" }}
            >
              Try another
            </button>
          </div>
        )}
      </div>
    </>
  );
}

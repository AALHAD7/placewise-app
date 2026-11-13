import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import type {
  AdminQuestionSource,
  AdminQuestionsByFrameworkRow,
  AdminQuestionsRecentRow,
  AdminQuestionsResponse
} from "../../types/api";

// Ad-hoc "Questions" tab on /admin, sibling of Engagement (EngagementDashboard.tsx) -
// same card shells, same admin-only 404 gate (only ever mounted after /api/admin/usage
// already succeeded), same load/error/empty pattern. What students are actually asking,
// per framework, plus the raw question feed across Frameworks/Q&A/Guesstimates.
//
// Chart choice (dataviz skill): `byFramework` is a ranked-categorical headline ("which
// framework gets asked about most"), same form as Engagement's `byPage` - ranked
// horizontal bars, one hue (var(--indigo)), largest first, value labelled at the tip,
// capped to the top 10 with a "View as table" fallback for the rest. The recent-questions
// feed is a plain list (text-first, not a chart) - the skill's form heuristic here is
// "not a chart": question text is the unit of reading, not a magnitude comparison.
//
// Grounded badge reuses GroundingNote's established visual language (a small italic
// "not from the casebooks" style) rather than inventing a new badge, per the grounded-
// answering skill's rule that the one thing shown per-answer is the not-grounded case.

type Load<T> = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; data: T };

const SOURCE_OPTIONS: { label: string; value: AdminQuestionSource | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Frameworks", value: "framework" },
  { label: "Q&A", value: "qa" },
  { label: "Guesstimates", value: "guesstimate" }
];

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--card-border)",
  borderRadius: "var(--r-md)",
  padding: "16px 18px"
};

function fmt(n: number): string {
  return n.toLocaleString();
}

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

const SOURCE_LABEL: Record<AdminQuestionSource, string> = {
  framework: "Framework",
  qa: "Q&A",
  guesstimate: "Guesstimate"
};

function TableFallback({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  return (
    <details style={{ marginTop: 10 }}>
      <summary style={{ cursor: "pointer", fontSize: "0.75rem", color: "var(--text-lightgray)" }}>View as table</summary>
      <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse", fontSize: "0.78125rem" }}>
        <caption style={{ textAlign: "left", color: "var(--text-lightgray)", fontSize: "0.71875rem", paddingBottom: 4 }}>
          {caption}
        </caption>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "4px 8px", borderBottom: "1px solid var(--card-border)", color: "var(--text-lightgray)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} style={{ padding: "4px 8px", borderBottom: "1px solid var(--divider)", color: "var(--text-900)" }}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

// Ranked horizontal bars, same shape as Engagement's PageBarChart: one hue, largest
// first, value labelled at the tip, capped to top 10, each row clickable to filter the
// rest of the section to that framework.
function FrameworkBarChart({
  rows,
  selectedId,
  onSelect
}: {
  rows: AdminQuestionsByFrameworkRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const top = rows.slice(0, 10);
  const max = Math.max(1, ...top.map((r) => r.count));
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {top.map((r) => {
          const isSelected = r.frameworkId === selectedId;
          return (
            <button
              key={r.frameworkId}
              type="button"
              className="unbutton"
              onClick={() => onSelect(r.frameworkId)}
              aria-pressed={isSelected}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                cursor: "pointer",
                background: isSelected ? "var(--surface-sunken)" : "transparent",
                borderRadius: "var(--r-xs)",
                padding: "2px 4px",
                textAlign: "left"
              }}
            >
              <span
                style={{
                  flex: "0 0 auto",
                  width: "clamp(90px, 35%, 160px)",
                  fontSize: "0.78125rem",
                  color: "var(--text-900)",
                  fontWeight: isSelected ? 700 : 400,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
                title={`${r.frameworkName}${r.domain ? ` (${r.domain}${r.subdomain ? ` · ${r.subdomain}` : ""})` : ""}`}
              >
                {r.frameworkName}
              </span>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  role="img"
                  aria-label={`${r.frameworkName}: ${fmt(r.count)}`}
                  style={{
                    height: 14,
                    borderRadius: "var(--r-xs)",
                    background: "var(--indigo)",
                    width: `${Math.max(2, (r.count / max) * 100)}%`,
                    minWidth: 4
                  }}
                />
                <span style={{ fontSize: "0.78125rem", fontWeight: 700, color: "var(--text-900)", flex: "none" }}>
                  {fmt(r.count)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <TableFallback
        caption="Frameworks by question count"
        head={["Framework", "Domain", "Subdomain", "Questions"]}
        rows={rows.map((r) => [r.frameworkName, r.domain || "—", r.subdomain || "—", fmt(r.count)])}
      />
    </div>
  );
}

function RecentQuestionRow({ row }: { row: AdminQuestionsRecentRow }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = row.question.length > 220;
  return (
    <div
      style={{
        padding: "10px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 6
      }}
    >
      <div
        style={{
          fontSize: "0.84375rem",
          color: "var(--text-900)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          maxWidth: "70ch",
          display: isLong && !expanded ? "-webkit-box" : "block",
          WebkitLineClamp: isLong && !expanded ? 3 : undefined,
          WebkitBoxOrient: isLong && !expanded ? "vertical" : undefined,
          overflow: isLong && !expanded ? "hidden" : "visible"
        }}
      >
        {row.question}
      </div>
      {isLong && (
        <button
          type="button"
          className="unbutton"
          onClick={() => setExpanded((e) => !e)}
          style={{ alignSelf: "flex-start", fontSize: "0.71875rem", color: "var(--indigo)", cursor: "pointer", fontWeight: 600 }}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: "0.71875rem", color: "var(--text-lightgray)" }}>
        <span style={{ fontWeight: 600, color: "var(--text-gray2)" }}>{SOURCE_LABEL[row.source]}</span>
        {row.frameworkName && (
          <>
            <span>·</span>
            <span>{row.frameworkName}</span>
          </>
        )}
        <span>·</span>
        <span title={row.createdAt}>{fmtWhen(row.createdAt)}</span>
        {!row.grounded && (
          <span className="grounding-note grounding-note-fallback" style={{ margin: 0 }}>
            General guidance - not from the casebooks
          </span>
        )}
      </div>
    </div>
  );
}

export default function QuestionsDashboard() {
  const [sourceFilter, setSourceFilter] = useState<AdminQuestionSource | "all">("all");
  const [frameworkFilter, setFrameworkFilter] = useState<{ id: string; name: string } | null>(null);
  const [data, setData] = useState<Load<AdminQuestionsResponse>>({ state: "loading" });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let live = true;
    setData({ state: "loading" });
    const params = new URLSearchParams();
    if (frameworkFilter) params.set("frameworkId", frameworkFilter.id);
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    const qs = params.toString();
    apiFetch<AdminQuestionsResponse>(
      `/api/admin/questions${qs ? `?${qs}` : ""}`,
      {},
      "Couldn't load questions data."
    )
      .then((r) => live && setData({ state: "ready", data: r }))
      .catch((e) => live && setData({ state: "error", message: e instanceof Error ? e.message : "Couldn't load questions data." }));
    return () => {
      live = false;
    };
  }, [frameworkFilter, sourceFilter, nonce]);

  function selectFramework(row: AdminQuestionsByFrameworkRow) {
    setFrameworkFilter((cur) => (cur?.id === row.frameworkId ? null : { id: row.frameworkId, name: row.frameworkName }));
  }

  const totalQuestions = data.state === "ready" ? data.data.byFramework.reduce((sum, r) => sum + r.count, 0) : 0;

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
        <p style={{ margin: 0, color: "var(--text-gray2)" }}>What students are actually asking, per framework and across Q&A/Guesstimates.</p>
        <div role="group" aria-label="Source" style={{ display: "flex", gap: 6 }}>
          {SOURCE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className="unbutton"
              onClick={() => setSourceFilter(o.value)}
              aria-pressed={sourceFilter === o.value}
              style={{
                padding: "6px 12px",
                borderRadius: "var(--r-sm)",
                border: "1px solid var(--card-border)",
                background: sourceFilter === o.value ? "var(--indigo)" : "var(--surface)",
                color: sourceFilter === o.value ? "var(--surface)" : "var(--text-900)",
                fontSize: "0.78125rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {frameworkFilter && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, fontSize: "0.78125rem", color: "var(--text-gray2)" }}>
          Filtered to <strong style={{ color: "var(--text-900)" }}>{frameworkFilter.name}</strong>
          <button
            type="button"
            className="unbutton"
            onClick={() => setFrameworkFilter(null)}
            style={{ padding: "4px 10px", borderRadius: "var(--r-sm)", border: "1px solid var(--card-border)", background: "var(--surface)", color: "var(--indigo)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
          >
            Show all frameworks
          </button>
        </div>
      )}

      {data.state === "loading" && <div style={{ marginTop: 20, color: "var(--text-lightgray)" }}>Loading questions data…</div>}

      {data.state === "error" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ color: "var(--red-dark)", fontSize: "0.84375rem" }}>{data.message}</div>
          <button
            type="button"
            className="unbutton"
            onClick={() => setNonce((n) => n + 1)}
            style={{ marginTop: 8, padding: "6px 12px", borderRadius: "var(--r-sm)", border: "1px solid var(--card-border)", background: "var(--surface)", color: "var(--indigo)", fontSize: "0.78125rem", fontWeight: 600, cursor: "pointer" }}
          >
            Retry
          </button>
        </div>
      )}

      {data.state === "ready" && (
        <>
          <div style={{ marginTop: 16, ...cardStyle }}>
            <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-900)" }}>Frameworks by question count</div>
            <div style={{ marginTop: 12 }}>
              {data.data.byFramework.length === 0 ? (
                <div style={{ fontSize: "0.84375rem", color: "var(--text-lightgray)" }}>No framework questions logged yet.</div>
              ) : (
                <FrameworkBarChart
                  rows={data.data.byFramework}
                  selectedId={frameworkFilter?.id ?? null}
                  onSelect={(id) => {
                    const row = data.data.byFramework.find((r) => r.frameworkId === id);
                    if (row) selectFramework(row);
                  }}
                />
              )}
            </div>
          </div>

          <div style={{ marginTop: 16, ...cardStyle }}>
            <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-900)" }}>
              Recent questions{totalQuestions > 0 && !frameworkFilter ? ` · ${fmt(totalQuestions)} total` : ""}
            </div>
            <div style={{ marginTop: 12, border: "1px solid var(--card-border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
              {data.data.recent.length === 0 ? (
                <div style={{ padding: 16, fontSize: "0.84375rem", color: "var(--text-lightgray)", textAlign: "center" }}>
                  {frameworkFilter ? `No questions logged for ${frameworkFilter.name} yet.` : "No questions logged yet."}
                </div>
              ) : (
                data.data.recent.map((row, i) => (
                  <div key={row.id} style={{ borderTop: i ? "1px solid var(--card-border)" : "none" }}>
                    <RecentQuestionRow row={row} />
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

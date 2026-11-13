import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import type {
  AdminEngagementClickRow,
  AdminEngagementDailyRow,
  AdminEngagementPageRow,
  AdminEngagementResponse
} from "../../types/api";

// Ad-hoc "Engagement" tab on /admin (sibling of the Usage section above it on
// AdminPage.tsx). Same admin-only 404 gate as /api/admin/usage - this is only ever
// mounted after that first call already succeeded. Follows ReviewQueue.tsx's
// load-state pattern but inline-styled like the rest of AdminPage.tsx, since this
// sits directly under the Usage cards, not inside the review queue's own CSS file.
//
// Chart choices (dataviz skill): `byPage` is a ranked-categorical headline, so it's
// ranked horizontal bars, one hue, largest first, value labelled at the tip. Two
// series (clicks vs views) over time is a grouped bar chart (one bar pair per day),
// not a line - changed 2026-11-13 after Aalhad's call: with only a couple of real
// days of history, a line visually implies a trend between sparse points that isn't
// really there (see DailyTrendChart's own comment for the full reasoning). Legend is
// never color-alone for >=2 series - colours are var(--indigo-700)/var(--royal-blue-light),
// the one pair from this palette that passes scripts/validate_palette.js's six checks
// against this app's dark surface. `topClicks`/`topViews` are secondary, so plain
// ranked tables. Every chart also has a "View as table" fallback per the skill's
// accessibility-twin rule.

type Load<T> = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; data: T };

const WINDOW_OPTIONS: { label: string; hours: number }[] = [
  { label: "24h", hours: 24 },
  { label: "7 days", hours: 168 },
  { label: "30 days", hours: 720 }
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
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

// Ranked horizontal bars, largest first, one hue, value labelled at the tip
// (outside the bar, so a long count never clips). Capped to the top 10 of
// whatever the backend already ranked, so the headline view stays scannable;
// the full set is still in the "View as table" fallback.
function PageBarChart({ rows }: { rows: AdminEngagementPageRow[] }) {
  const top = rows.slice(0, 10);
  const max = Math.max(1, ...top.map((r) => r.count));
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {top.map((r) => (
          <div key={r.page} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                flex: "0 0 auto",
                width: "clamp(80px, 35%, 140px)",
                fontSize: "0.78125rem",
                color: "var(--text-900)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
              title={r.page}
            >
              {r.page}
            </span>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
              <div
                role="img"
                aria-label={`${r.page}: ${fmt(r.count)}`}
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
          </div>
        ))}
      </div>
      <TableFallback
        caption="Pages/features by total activity"
        head={["Page", "Events"]}
        rows={rows.map((r) => [r.page, fmt(r.count)])}
      />
    </div>
  );
}

// Grouped bar chart, two series per day (clicks/views side by side), with a
// legend (identity is never color-alone) and a per-day hover tooltip. Changed
// from a line chart (2026-11-13, Aalhad's call) - with only a handful of real
// days of history so far, a line visually implies a continuous trend between
// sparse points, which reads as "usage is trending" when it's really just
// "day 2 had more views than day 1" (often from instrumentation coverage
// changing, not real usage change). Bars make each day a standalone
// comparison instead of implying interpolation, and stay the right form once
// there's more history too - this isn't a stopgap until enough days exist.
function DailyTrendChart({ rows }: { rows: AdminEngagementDailyRow[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 640;
  const height = 180;
  const padL = 36;
  const padR = 12;
  const padT = 10;
  const padB = 24;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const max = Math.max(1, ...rows.map((r) => Math.max(r.clicks, r.views)));
  const n = Math.max(1, rows.length);
  const slotW = plotW / n;
  // Each day's slot holds two bars (clicks, views) with a small gap between
  // them and between slots - narrows automatically as more days are shown.
  const barGap = Math.max(1, slotW * 0.08);
  const barW = Math.max(2, (slotW - barGap * 3) / 2);
  const slotX = (i: number) => padL + i * slotW;
  const barH = (v: number) => (v / max) * plotH;
  const barY = (v: number) => padT + plotH - barH(v);
  const showDateLabel = slotW >= 28;
  const hovered = hover != null ? rows[hover] : null;

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <Legend swatch="var(--indigo-700)" label="Clicks" />
        <Legend swatch="var(--royal-blue-light)" label="Views" />
      </div>
      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Daily clicks and views over the selected window, as a bar per day">
          {[0, 0.5, 1].map((g) => (
            <line
              key={g}
              x1={padL}
              x2={width - padR}
              y1={padT + plotH * (1 - g)}
              y2={padT + plotH * (1 - g)}
              stroke="var(--divider)"
              strokeWidth={1}
            />
          ))}
          <text x={4} y={padT + 4} fontSize={9} fill="var(--text-lightgray)">
            {fmt(max)}
          </text>
          <text x={4} y={padT + plotH} fontSize={9} fill="var(--text-lightgray)">
            0
          </text>
          {rows.map((r, i) => (
            <g key={r.date}>
              {hover === i && (
                <rect x={slotX(i)} y={padT} width={slotW} height={plotH} fill="var(--surface-sunken)" />
              )}
              <rect
                x={slotX(i) + barGap}
                y={barY(r.clicks)}
                width={barW}
                height={Math.max(1, barH(r.clicks))}
                rx={2}
                fill="var(--indigo-700)"
              />
              <rect
                x={slotX(i) + barGap * 2 + barW}
                y={barY(r.views)}
                width={barW}
                height={Math.max(1, barH(r.views))}
                rx={2}
                fill="var(--royal-blue-light)"
              />
              {showDateLabel && (
                <text x={slotX(i) + slotW / 2} y={height - 6} fontSize={9} fill="var(--text-lightgray)" textAnchor="middle">
                  {r.date.slice(5)}
                </text>
              )}
              {/* Invisible full-height hit column, for hover */}
              <rect
                x={slotX(i)}
                y={padT}
                width={slotW}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((cur) => (cur === i ? null : cur))}
              />
            </g>
          ))}
        </svg>
        {hovered && (
          <div
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              background: "var(--surface-sunken)",
              border: "1px solid var(--card-border)",
              borderRadius: "var(--r-xs)",
              padding: "6px 10px",
              fontSize: "0.71875rem",
              color: "var(--text-900)",
              pointerEvents: "none"
            }}
          >
            <div style={{ color: "var(--text-lightgray)" }}>{hovered.date}</div>
            <div>Clicks: <strong>{fmt(hovered.clicks)}</strong></div>
            <div>Views: <strong>{fmt(hovered.views)}</strong></div>
          </div>
        )}
      </div>
      <TableFallback
        caption="Daily clicks and views"
        head={["Date", "Clicks", "Views"]}
        rows={rows.map((r) => [r.date, fmt(r.clicks), fmt(r.views)])}
      />
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.78125rem", color: "var(--text-gray2)" }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, background: swatch, display: "inline-block" }} />
      {label}
    </span>
  );
}

// The accessibility-twin fallback every chart gets: a plain table, hidden
// behind a disclosure so it doesn't compete with the chart visually.
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

function RankedTable({ title, rows }: { title: string; rows: AdminEngagementClickRow[] }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: "0.84375rem", fontWeight: 700, color: "var(--text-900)" }}>{title}</div>
      <div style={{ marginTop: 10, border: "1px solid var(--card-border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
        {rows.length === 0 ? (
          <div style={{ padding: 16, fontSize: "0.84375rem", color: "var(--text-lightgray)" }}>No clicks logged in this window.</div>
        ) : (
          rows.map((r, i) => (
            <div
              key={`${r.page}-${r.section}-${i}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "8px 14px",
                borderTop: i ? "1px solid var(--card-border)" : "none",
                fontSize: "0.8125rem"
              }}
            >
              <span style={{ color: "var(--text-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.page} <span style={{ color: "var(--text-lightgray)" }}>· {r.section}</span>
              </span>
              <span style={{ fontWeight: 700, color: "var(--text-900)", flex: "none" }}>{fmt(r.count)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function EngagementDashboard() {
  const [windowHours, setWindowHours] = useState(168);
  const [data, setData] = useState<Load<AdminEngagementResponse>>({ state: "loading" });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let live = true;
    setData({ state: "loading" });
    apiFetch<AdminEngagementResponse>(
      `/api/admin/engagement?windowHours=${windowHours}&topN=15`,
      {},
      "Couldn't load engagement data."
    )
      .then((r) => live && setData({ state: "ready", data: r }))
      .catch((e) => live && setData({ state: "error", message: e instanceof Error ? e.message : "Couldn't load engagement data." }));
    return () => {
      live = false;
    };
  }, [windowHours, nonce]);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
        <p style={{ margin: 0, color: "var(--text-gray2)" }}>Which features and pages students actually use.</p>
        <div role="group" aria-label="Time window" style={{ display: "flex", gap: 6 }}>
          {WINDOW_OPTIONS.map((o) => (
            <button
              key={o.hours}
              type="button"
              className="unbutton"
              onClick={() => setWindowHours(o.hours)}
              aria-pressed={windowHours === o.hours}
              style={{
                padding: "6px 12px",
                borderRadius: "var(--r-sm)",
                border: "1px solid var(--card-border)",
                background: windowHours === o.hours ? "var(--indigo)" : "var(--surface)",
                color: windowHours === o.hours ? "var(--surface)" : "var(--text-900)",
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

      {data.state === "loading" && <div style={{ marginTop: 20, color: "var(--text-lightgray)" }}>Loading engagement data…</div>}

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

      {data.state === "ready" && data.data.totalEvents === 0 && (
        <div style={{ ...cardStyle, marginTop: 20, color: "var(--text-lightgray)", fontSize: "0.84375rem", textAlign: "center" }}>
          No activity tracked in this window yet.
        </div>
      )}

      {data.state === "ready" && data.data.totalEvents > 0 && (
        <>
          <p style={{ marginTop: 16, marginBottom: 0, fontSize: "0.78125rem", color: "var(--text-lightgray)" }}>
            {fmt(data.data.totalEvents)} events · as of {fmtWhen(data.data.generatedAt)}
          </p>

          <div style={{ marginTop: 16, ...cardStyle }}>
            <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-900)" }}>Most-used pages/features</div>
            <div style={{ marginTop: 12 }}>
              {data.data.byPage.length === 0 ? (
                <div style={{ fontSize: "0.84375rem", color: "var(--text-lightgray)" }}>No page views logged in this window.</div>
              ) : (
                <PageBarChart rows={data.data.byPage} />
              )}
            </div>
          </div>

          <div style={{ marginTop: 16, ...cardStyle }}>
            <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-900)" }}>Daily activity</div>
            <div style={{ marginTop: 12 }}>
              {data.data.dailyTotals.length === 0 ? (
                <div style={{ fontSize: "0.84375rem", color: "var(--text-lightgray)" }}>No daily data in this window.</div>
              ) : (
                <DailyTrendChart rows={data.data.dailyTotals} />
              )}
            </div>
          </div>

          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            <RankedTable title="Top clicks" rows={data.data.topClicks} />
            <RankedTable title="Top views" rows={data.data.topViews} />
          </div>
        </>
      )}
    </div>
  );
}

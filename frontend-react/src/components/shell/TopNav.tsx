import { Fragment } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDashboard } from "../../hooks/useDashboard";

// Ported from frontend/index.html lines 226-292. Active-state styling uses
// NavLink's isActive instead of the old item() method's per-item JS-computed
// rowStyle/iconColor/textStyle (see .nav-item/.nav-item.active in
// global.css, whose values already matched item()'s inline styles exactly)
// - a legitimate simplification, not a visual change.

interface NavEntry {
  to: string;
  label: string;
  paths: string[]; // one <path> per entry, some icons are multi-path
  circles?: { cx: number; cy: number; r: number }[];
  lines?: { x1: number; y1: number; x2: number; y2: number }[];
  rect?: { x: number; y: number; width: number; height: number; rx: number };
}

const NAV: NavEntry[] = [
  {
    to: "/",
    label: "Home",
    paths: [
      "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",
      "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
    ]
  },
  {
    to: "/role",
    label: "Role",
    paths: ["M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"],
    circles: [{ cx: 12, cy: 7, r: 4 }]
  },
  {
    to: "/company",
    label: "Company",
    paths: [
      "M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",
      "M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2",
      "M10 12h4",
      "M10 8h4",
      "M14 21v-3a2 2 0 0 0-4 0v3"
    ]
  },
  {
    to: "/frameworks",
    label: "Frameworks",
    paths: [],
    circles: [
      { cx: 18, cy: 5, r: 3 },
      { cx: 6, cy: 12, r: 3 },
      { cx: 18, cy: 19, r: 3 }
    ],
    lines: [
      { x1: 8.59, y1: 13.51, x2: 15.42, y2: 17.49 },
      { x1: 15.41, y1: 6.51, x2: 8.59, y2: 10.49 }
    ]
  },
  {
    to: "/resume",
    label: "Resume",
    paths: [
      "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
      "M14 2v5a1 1 0 0 0 1 1h5",
      "M10 9H8",
      "M16 13H8",
      "M16 17H8"
    ]
  },
  {
    to: "/tone-shifter",
    label: "Tone Shifter",
    paths: ["M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"]
  },
  {
    to: "/mock-interview",
    label: "Mock Interview",
    paths: ["M12 19v3", "M19 10v2a7 7 0 0 1-14 0v-2"],
    rect: { x: 9, y: 2, width: 6, height: 13, rx: 3 }
  },
  {
    to: "/community",
    label: "Community",
    paths: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M16 3.128a4 4 0 0 1 0 7.744", "M22 21v-2a4 4 0 0 0-3-3.87"],
    circles: [{ cx: 9, cy: 7, r: 4 }]
  }
];

function NavIcon({ entry }: { entry: NavEntry }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
      {entry.paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
      {entry.circles?.map((c, i) => (
        <circle key={i} cx={c.cx} cy={c.cy} r={c.r} />
      ))}
      {entry.lines?.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
      ))}
      {entry.rect && <rect x={entry.rect.x} y={entry.rect.y} width={entry.rect.width} height={entry.rect.height} rx={entry.rect.rx} />}
    </svg>
  );
}

export default function TopNav() {
  const navigate = useNavigate();
  const { data, sessionName, reload } = useDashboard();
  const streak = data?.streak || 0;
  const hasStreak = streak > 0;
  const initials =
    sessionName
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const goHome = () => navigate("/");
  const viewStats = () => {
    navigate("/");
    reload();
  };

  return (
    <header className="topnav">
      <div onClick={goHome} title="Back to home" className="brand-left" style={{ cursor: "pointer", flex: "none" }}>
        <div className="brand-bars">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span className="brand-name">PMH</span>
      </div>

      <nav className="topnav-links">
        {NAV.map((entry, i) => (
          <Fragment key={entry.to}>
            <NavLink to={entry.to} end={entry.to === "/"} className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
              <NavIcon entry={entry} />
              <span>{entry.label}</span>
            </NavLink>
            {(i === 0 || i === NAV.length - 2) && <span className="topnav-divider"></span>}
          </Fragment>
        ))}
      </nav>

      <div className="topbar-right" style={{ flex: "none" }}>
        {hasStreak && (
          <div className="streak-pill">
            <svg className="flame" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2c1 3-2 4-2 7a3 3 0 0 0 6 0c1 1 2 2.5 2 4.5A6.5 6.5 0 0 1 5 13.5C5 8 9 6 12 2z" />
            </svg>
            {streak} day streak
            <span className="divider"></span>
            <div className="view-stats" onClick={viewStats}>
              View stats
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </div>
        )}
        <div className="bell-btn" title="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
        </div>
        <div className="user-block" onClick={goHome} title="Back to home">
          <div className="avatar">{initials}</div>
          <div className="user-meta">
            <div className="user-name">{sessionName}</div>
            <div className="user-sub">Keep building 🎉</div>
          </div>
          <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </header>
  );
}

import { Fragment, useEffect, useRef, useState } from "react";
import { useExitTransition } from "../../hooks/useExitTransition";
import { NavLink, useNavigate } from "react-router-dom";
import { useDashboard } from "../../hooks/useDashboard";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme, type ThemeMode } from "../../hooks/useTheme";
import { buildSearchIndex, searchEntries, type SearchEntry, type SearchResultGroup } from "../../lib/searchIndex";

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
    // "Resume Interrogation" is the feature's full name (see ResumePage),
    // but doesn't fit this row alongside 8 other items - shortened per
    // spec to "Resume Drill", used identically here and on Home's card so
    // the nav and the page content never disagree on what to call it.
    to: "/resume",
    label: "Resume Drill",
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

function formatCountdown(msLeft: number): string {
  if (msLeft <= 0) return "expired";
  const totalMinutes = Math.ceil(msLeft / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: "light", label: "Light" },
  { mode: "dark", label: "Dark" },
  { mode: "system", label: "System" }
];

export default function TopNav() {
  const navigate = useNavigate();
  const { data, sessionName, reload } = useDashboard();
  const { isGuest, guestExpiresAt, signOut } = useAuth();
  const { mode: themeMode, setMode: setThemeMode } = useTheme();
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

  // Ticks every 30s so the guest countdown stays roughly live without a
  // per-second re-render - the actual sign-out is enforced by a real timer
  // in AuthContext, this is display only.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isGuest) return;
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [isGuest]);

  const goHome = () => navigate("/");
  const viewStats = () => {
    navigate("/");
    reload();
  };

  // --- Search: keyword-only, no LLM call (see searchIndex.ts). Opens as an
  // icon button rather than a persistent text box - the nav row is already
  // full-width with 9 items + the rest of this bar, and a permanently-open
  // ~260px input would force it back into the exact multi-line wrap the
  // single-line nav was just rebuilt to avoid. ------------------------------
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFullIndex, setSearchFullIndex] = useState<SearchEntry[] | null>(null);
  const [searchGroups, setSearchGroups] = useState<SearchResultGroup[]>([]);
  const [searchActive, setSearchActive] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const flatResults = searchGroups.flatMap((g) => g.items);

  useEffect(() => {
    if (!searchOpen) return;
    buildSearchIndex().then(setSearchFullIndex);
    const id = requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchFullIndex) return;
    setSearchGroups(searchEntries(searchQuery, searchFullIndex));
    setSearchActive(0);
  }, [searchQuery, searchFullIndex]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchGroups([]);
  };
  const goToResult = (entry: SearchEntry) => {
    closeSearch();
    navigate(entry.to);
  };
  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      closeSearch();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchActive((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSearchActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flatResults[searchActive]) {
      e.preventDefault();
      goToResult(flatResults[searchActive]);
    }
  };

  // --- Notifications: dropdown toggle only - there is no notification-
  // generating system anywhere in this app yet, so the only honest state is
  // the empty one (never a fabricated unread dot). -------------------------
  const [notifOpen, setNotifOpen] = useState(false);

  // --- Avatar menu: identity + Theme (Light/Dark/System) + Sign out/in. No
  // "Profile" page exists in this app (grep of router.tsx), so rather than
  // link to a 404 the menu's header row IS the profile summary (name +
  // guest/signed-in status) instead of a separate broken link. ------------
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { rendered: confirmRendered, exiting: confirmExiting } = useExitTransition(confirmOpen, 160);
  const doSignOut = () => {
    setConfirmOpen(false);
    setAvatarOpen(false);
    signOut();
    navigate("/login");
  };

  // One Escape handler for every open popover in this bar, and a click
  // listener that closes whichever one is open when the click lands outside
  // the whole header (simpler and more robust than a per-popover ref chase
  // for 4 independent popovers that never overlap).
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const anyOpen = searchOpen || notifOpen || avatarOpen || confirmOpen;
    if (!anyOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (confirmOpen) setConfirmOpen(false);
      else if (searchOpen) closeSearch();
      else if (notifOpen) setNotifOpen(false);
      else if (avatarOpen) setAvatarOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setNotifOpen(false);
        setAvatarOpen(false);
        setConfirmOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [searchOpen, notifOpen, avatarOpen, confirmOpen]);

  return (
    <header className="topnav" ref={headerRef}>
      <div className="topnav-row">
        <button type="button" onClick={goHome} title="Back to home" className="unbutton brand-left" style={{ cursor: "pointer", flex: "none" }}>
          <div className="brand-bars">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="brand-name">Placewise</span>
        </button>

        <nav className="topnav-links glass-capsule">
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

        <div className="topbar-right">
          {hasStreak && (
            <div className="streak-pill">
              <svg className="flame" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2c1 3-2 4-2 7a3 3 0 0 0 6 0c1 1 2 2.5 2 4.5A6.5 6.5 0 0 1 5 13.5C5 8 9 6 12 2z" />
              </svg>
              {streak} day streak
              <span className="divider"></span>
              <button type="button" className="unbutton view-stats" onClick={viewStats}>
                View stats
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          )}

          <div style={{ position: "relative", flex: "none" }}>
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              title="Search"
              aria-label="Search"
              aria-expanded={searchOpen}
              className={"unbutton bell-btn" + (searchOpen ? " active" : "")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
            {searchOpen && (
              <div className="search-panel glass-panel" role="search">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={onSearchKeyDown}
                  placeholder="Search anything…"
                  className="search-input"
                  aria-label="Search anything"
                  role="combobox"
                  aria-expanded={searchGroups.length > 0}
                />
                {searchQuery.trim() && (
                  <div className="search-results" role="listbox">
                    {flatResults.length === 0 ? (
                      <div className="search-empty">No matches. Try a company, role or framework name.</div>
                    ) : (
                      searchGroups.map((group) => (
                        <div key={group.section} className="search-group">
                          <div className="search-group-label">{group.section}</div>
                          {group.items.map((item) => {
                            const flatIdx = flatResults.indexOf(item);
                            return (
                              <button
                                key={item.section + item.title + flatIdx}
                                type="button"
                                role="option"
                                aria-selected={flatIdx === searchActive}
                                className={"search-result" + (flatIdx === searchActive ? " active" : "")}
                                onMouseEnter={() => setSearchActive(flatIdx)}
                                onClick={() => goToResult(item)}
                              >
                                {item.title}
                              </button>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ position: "relative", flex: "none" }}>
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              title="Notifications"
              aria-label="Notifications"
              aria-expanded={notifOpen}
              className="unbutton bell-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
              {/* No unread dot: nothing in this app generates a notification
                  yet, so real state is always "none unread" - never faked. */}
            </button>
            {notifOpen && (
              <div className={"t-pop-in glass-panel"} style={{ ["--pop-origin" as string]: "top right", position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 30, width: 260, borderRadius: "var(--r-md)", padding: 14 }}>
                <div style={{ fontSize: "0.84375rem", fontWeight: 700, color: "var(--text-900)", marginBottom: 4 }}>Notifications</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-gray2)" }}>No notifications yet.</div>
              </div>
            )}
          </div>

          <div style={{ position: "relative", flex: "none" }}>
            <button
              type="button"
              onClick={() => setAvatarOpen((v) => !v)}
              aria-expanded={avatarOpen}
              aria-haspopup="menu"
              className={"unbutton user-block" + (isGuest && !avatarOpen ? " has-tooltip" : "")}
              {...(isGuest && !avatarOpen ? { "data-tip": "Sign in to save your progress" } : {})}
            >
              <div className="avatar" aria-hidden="true">{initials}</div>
              <div className="user-meta">
                <div className="user-name">{sessionName}</div>
                <div className="user-sub">{isGuest && guestExpiresAt ? "Guest · " + formatCountdown(guestExpiresAt - now) : "Keep building 🎉"}</div>
              </div>
            </button>
            {avatarOpen && (
              <div role="menu" aria-label="Account" className="t-pop-in glass-panel" style={{ ["--pop-origin" as string]: "top right", position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 30, width: 220, borderRadius: "var(--r-md)", padding: 10 }}>
                <div style={{ padding: "6px 8px 10px", borderBottom: "1px solid var(--card-border)", marginBottom: 6 }}>
                  <div style={{ fontSize: "0.84375rem", fontWeight: 700, color: "var(--text-900)" }}>{sessionName}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-gray2)", marginTop: 2 }}>{isGuest ? "Guest session" : "Signed in"}</div>
                </div>
                <div style={{ padding: "4px 8px", fontSize: "0.71875rem", fontWeight: 700, letterSpacing: "0.04em", color: "var(--text-lightgray)", textTransform: "uppercase" }}>Theme</div>
                <div style={{ display: "flex", gap: 4, padding: "0 8px 8px" }}>
                  {THEME_OPTIONS.map((opt) => (
                    <button
                      key={opt.mode}
                      type="button"
                      role="menuitemradio"
                      aria-checked={themeMode === opt.mode}
                      onClick={() => setThemeMode(opt.mode)}
                      className="unbutton theme-pick"
                      data-active={themeMode === opt.mode}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid var(--card-border)", marginTop: 4, paddingTop: 6 }}>
                  {isGuest ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAvatarOpen(false);
                        navigate("/login");
                      }}
                      className="unbutton menu-row"
                    >
                      Sign in
                    </button>
                  ) : (
                    <button type="button" role="menuitem" onClick={() => setConfirmOpen(true)} className="unbutton menu-row">
                      Sign out
                    </button>
                  )}
                </div>
              </div>
            )}
            {confirmRendered && (
              <div
                role="dialog"
                aria-label="Confirm sign out"
                className={(confirmExiting ? "t-pop-out" : "t-pop-in") + " glass-panel"}
                style={{
                  ["--pop-origin" as string]: "top right",
                  position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 31, width: 244,
                  borderRadius: "var(--r-md)", padding: 14
                }}
              >
                <div style={{ fontSize: "0.84375rem", fontWeight: 700, color: "var(--text-900)" }}>Sign out?</div>
                <div style={{ marginTop: 5, fontSize: "0.78125rem", lineHeight: 1.5, color: "var(--text-gray2)" }}>
                  {isGuest
                    ? "This is a guest session - your work here is not saved to an account and cannot be recovered."
                    : "You can sign back in at any time."}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    className="unbutton"
                    style={{ flex: 1, textAlign: "center", padding: "8px 10px", borderRadius: "var(--r-sm)", border: "1px solid var(--card-border)", background: "var(--surface)", fontSize: "0.78125rem", fontWeight: 600, color: "var(--text-700)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={doSignOut}
                    autoFocus
                    className="unbutton"
                    style={{ flex: 1, textAlign: "center", padding: "8px 10px", borderRadius: "var(--r-sm)", border: "1px solid transparent", background: isGuest ? "var(--red)" : "var(--indigo)", fontSize: "0.78125rem", fontWeight: 700, color: "var(--surface)" }}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

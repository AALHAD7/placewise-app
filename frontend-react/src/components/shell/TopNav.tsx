import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useExitTransition } from "../../hooks/useExitTransition";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDashboard } from "../../hooks/useDashboard";
import { useAuth } from "../../contexts/AuthContext";

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
    to: "/guesstimates",
    label: "Guesstimates",
    paths: ["M12 2v4", "M12 18v4", "M4.93 4.93l2.83 2.83", "M16.24 16.24l2.83 2.83", "M2 12h4", "M18 12h4", "M4.93 19.07l2.83-2.83", "M16.24 7.76l2.83-2.83"],
    circles: [{ cx: 12, cy: 12, r: 4 }]
  },
  {
    to: "/qa",
    label: "Ask",
    paths: ["M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3", "M12 17h.01"],
    circles: [{ cx: 12, cy: 12, r: 10 }]
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

// Same match rule as each NavLink's own `end={entry.to === "/"}` below - kept
// here too so the slider can independently figure out which entry is active
// (for measuring its position) without reading it back off the DOM's class
// list, which would lag a render behind.
function isNavEntryActive(entry: NavEntry, pathname: string): boolean {
  return entry.to === "/" ? pathname === "/" : pathname.startsWith(entry.to);
}

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

export default function TopNav() {
  const navigate = useNavigate();
  const { data, sessionName, reload } = useDashboard();
  const { isGuest, guestExpiresAt, signOut } = useAuth();
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

  // Custom scroll indicator for the nav-pill row - see the render below for
  // why this exists instead of a native scrollbar.
  const navLinksRef = useRef<HTMLElement>(null);
  const [navScroll, setNavScroll] = useState({ show: false, leftPct: 0, widthPct: 100 });
  const updateNavScrollInfo = () => {
    const el = navLinksRef.current;
    if (!el) return;
    const { scrollWidth, clientWidth, scrollLeft } = el;
    const show = scrollWidth > clientWidth + 1;
    setNavScroll({
      show,
      leftPct: show ? (scrollLeft / scrollWidth) * 100 : 0,
      widthPct: show ? (clientWidth / scrollWidth) * 100 : 100
    });
  };
  useEffect(() => {
    updateNavScrollInfo();
    window.addEventListener("resize", updateNavScrollInfo);
    return () => window.removeEventListener("resize", updateNavScrollInfo);
  }, []);

  // The sliding active-tab highlight ("soft slider" between e.g. Frameworks
  // and Company) - one shared element (.nav-slider, see global.css) whose
  // position/width is measured off whichever NavLink is actually active and
  // animated there via CSS transition, instead of each link instantly
  // flashing its own background on route change.
  const navItemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [sliderRect, setSliderRect] = useState<{ x: number; width: number } | null>(null);
  const location = useLocation();
  const measureSlider = () => {
    const activeEntry = NAV.find((entry) => isNavEntryActive(entry, location.pathname));
    const el = activeEntry ? navItemRefs.current[activeEntry.to] : null;
    setSliderRect(el ? { x: el.offsetLeft, width: el.offsetWidth } : null);
  };
  useLayoutEffect(measureSlider, [location.pathname]);
  useEffect(() => {
    window.addEventListener("resize", measureSlider);
    return () => window.removeEventListener("resize", measureSlider);
  }, [location.pathname]);

  const goHome = () => navigate("/");
  const viewStats = () => {
    navigate("/");
    reload();
  };

  // --- Avatar menu: identity + Theme (Light/Dark/System) + Sign out/in. No
  // "Profile" page exists in this app (grep of router.tsx), so rather than
  // link to a 404 the menu's header row IS the profile summary (name +
  // guest/signed-in status) instead of a separate broken link. ------------
  const [avatarOpen, setAvatarOpen] = useState(false);
  // Mobile hamburger menu - see global.css's max-width:640px block for the
  // CSS that actually hides .topnav-links and shows .mobile-menu-btn; this
  // state only controls whether the vertical panel itself is open.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
    const anyOpen = avatarOpen || confirmOpen || mobileNavOpen;
    if (!anyOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (confirmOpen) setConfirmOpen(false);
      else if (avatarOpen) setAvatarOpen(false);
      else if (mobileNavOpen) setMobileNavOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
        setConfirmOpen(false);
        setMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [avatarOpen, confirmOpen, mobileNavOpen]);

  return (
    <header className="topnav" ref={headerRef}>
      <div className="topnav-row">
        <button type="button" onClick={goHome} title="Back to home" className="unbutton brand-left" style={{ cursor: "pointer", flex: "none" }}>
          <img src="/brand/placewise-mark.svg" alt="PlaceWise" width="28" height="28" className="brand-logo-desktop" />
          <img src="/brand/placewise-icon.svg" alt="PlaceWise" width="30" height="30" className="brand-logo-mobile" />
          <span className="brand-name">Place<span className="brand-accent">Wise</span></span>
        </button>

        <div className="topnav-capsule-wrapper glass-capsule">
          <nav ref={navLinksRef} onScroll={updateNavScrollInfo} className="topnav-links">
            {sliderRect && (
              <div className="nav-slider" style={{ transform: `translateX(${sliderRect.x}px)`, width: sliderRect.width }} />
            )}
            {NAV.map((entry, i) => (
              <Fragment key={entry.to}>
                <NavLink
                  to={entry.to}
                  end={entry.to === "/"}
                  ref={(el) => { navItemRefs.current[entry.to] = el; }}
                  className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
                >
                  <NavIcon entry={entry} />
                  <span>{entry.label}</span>
                </NavLink>
                {(i === 0 || i === NAV.length - 2) && <span className="topnav-divider"></span>}
              </Fragment>
            ))}
          </nav>
          {/* Custom, always-visible scroll indicator - native scrollbars are
              invisible by default on macOS ("overlay" style, shown only
              mid-gesture) regardless of CSS, which is exactly why zooming in
              made Resume Drill/Tone Shifter/Mock Interview/Community look
              like they'd vanished rather than just being scrollable. */}
          {navScroll.show && (
            <div style={{ position: "absolute", left: 10, right: 10, bottom: 2, height: 3, borderRadius: 2, background: "rgba(255, 255, 255, 0.12)", overflow: "hidden", pointerEvents: "none", zIndex: 10 }}>
              <div style={{ position: "absolute", top: 0, bottom: 0, left: `${navScroll.leftPct}%`, width: `${navScroll.widthPct}%`, borderRadius: 2, background: "rgba(255, 255, 255, 0.5)" }} />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileNavOpen((v) => !v)}
          title="Menu"
          aria-label="Menu"
          aria-expanded={mobileNavOpen}
          className={"unbutton bell-btn mobile-menu-btn" + (mobileNavOpen ? " active" : "")}
        >
          {mobileNavOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          )}
        </button>

        <div className="topbar-right">
          {hasStreak && (
            <div className="streak-pill">
              <svg className="flame" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2c1 3-2 4-2 7a3 3 0 0 0 6 0c1 1 2 2.5 2 4.5A6.5 6.5 0 0 1 5 13.5C5 8 9 6 12 2z" />
              </svg>
              <span className="streak-count-label">{streak} day streak</span>
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
              <div role="menu" aria-label="Account" className="t-pop-in glass-panel" style={{ ["--pop-origin" as string]: "top right", position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 30, width: 200, borderRadius: "var(--r-md)", padding: 10 }}>
                <div style={{ padding: "6px 8px 10px", borderBottom: "1px solid var(--card-border)", marginBottom: 6 }}>
                  <div style={{ fontSize: "0.84375rem", fontWeight: 700, color: "var(--text-900)" }}>{sessionName}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-gray2)", marginTop: 2 }}>{isGuest ? "Guest session" : "Signed in"}</div>
                </div>
                <div>
                  {isGuest && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAvatarOpen(false);
                        navigate("/login");
                      }}
                      className="unbutton menu-row"
                      style={{ marginBottom: 4, paddingBottom: 10, borderBottom: "1px solid var(--card-border)" }}
                    >
                      Sign in
                    </button>
                  )}
                  {/* Guests get both rows: "Sign in" to upgrade out of the guest
                      session, and "Sign out" to end it - same confirm-sign-out
                      dialog (with its existing guest-aware copy) as the signed-in
                      branch below, not a separate flow. A divider (above) keeps
                      the two consequence-asymmetric actions visually distinct. */}
                  <button type="button" role="menuitem" onClick={() => setConfirmOpen(true)} className="unbutton menu-row">
                    Sign out
                  </button>
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
                    style={{ flex: 1, textAlign: "center", padding: "8px 10px", borderRadius: "var(--r-sm)", border: "1px solid transparent", background: isGuest ? "var(--red)" : "var(--indigo)", fontSize: "0.78125rem", fontWeight: 700, color: "#ffffff" }}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className={"mobile-nav-panel" + (mobileNavOpen ? " open" : "")} aria-label="Mobile">
        <div className="mobile-brand-header">
          <img src="/brand/placewise-mark.svg" alt="" width="22" height="22" />
          <span className="brand-name" style={{ display: "inline-block", fontSize: "1rem" }}>
            Place<span className="brand-accent">Wise</span>
          </span>
          <span className="mobile-brand-tagline">
            From Prep to Placement
          </span>
        </div>
        {NAV.map((entry) => (
          <NavLink
            key={entry.to}
            to={entry.to}
            end={entry.to === "/"}
            onClick={() => setMobileNavOpen(false)}
            className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
          >
            <NavIcon entry={entry} />
            <span>{entry.label}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

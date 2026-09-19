import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "../hooks/useDashboard";
import FeatureCard, { type IconClass } from "../components/FeatureCard";
import type { ActivityType } from "../types/api";

// Ported from frontend/index.html lines 315-413 (hero/illustration/feature
// grid) + 1614-1689 (right panel) + dashPanel() (2037-2112) + home (4067-4098).
// Note: readinessDasharray (old dashPanel() field) was dropped - grepped
// confirmed it was computed but never read by any markup, only
// readinessRingStyle (a CSS conic-gradient, not an SVG stroke-dasharray)
// was actually used for the readiness ring.

const TYPE_PAGE: Record<ActivityType, string> = {
  resume_interrogation: "/resume",
  framework_review: "/frameworks",
  mock_interview: "/mock-interview",
  tone_shift: "/tone-shifter",
  story_builder: "/resume"
};

const TYPE_BADGE: Record<ActivityType, { bg: string; color: string; iconPath: string }> = {
  resume_interrogation: {
    bg: "#DCFCE7",
    color: "#16A34A",
    iconPath: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2zM14 2v5a1 1 0 0 0 1 1h5"
  },
  framework_review: {
    bg: "#FCE7F3",
    color: "#DB2777",
    iconPath:
      "M18 5m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M6 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M18 19m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
  },
  mock_interview: {
    bg: "#E0E7FF",
    color: "#4F46E5",
    iconPath: "M12 19v3M19 10v2a7 7 0 0 1-14 0v-2M12 15a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v7a3 3 0 0 0 3 3z"
  },
  tone_shift: {
    bg: "#CFFAFE",
    color: "#0891B2",
    iconPath: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
  },
  story_builder: {
    bg: "#FEF3C7",
    color: "#D97706",
    iconPath: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
  }
};
const DEFAULT_BADGE = { bg: "#F3F4F6", color: "#6b7280", iconPath: "M12 8v4l3 3" };

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return mins + "m ago";
  const hours = Math.round(mins / 60);
  if (hours < 24) return hours + "h ago";
  return Math.round(hours / 24) + "d ago";
}

interface Step {
  name: string;
  body: string;
  go: string;
  iconClass: IconClass;
  iconPath: string;
}

const STEPS: Step[] = [
  {
    name: "Role",
    body: "Insights on the role you are targeting: what the job actually involves day to day, the skills and salary band, and the kind of candidate that gets hired into it.",
    go: "/role",
    iconClass: "icon-purple",
    iconPath: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
  },
  {
    name: "Company",
    body: "Details about the company: what it does and how it makes money, its recent news and major investments, its recruitment process by role, and debriefs from students who interviewed there.",
    go: "/company",
    iconClass: "icon-blue",
    iconPath: "M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2M10 12h4M10 8h4M14 21v-3a2 2 0 0 0-4 0v3"
  },
  {
    name: "Resume Interrogation",
    body: "Upload your resume and get the behavioural, technical, and situational questions it invites. Answer by text or voice and get feedback on what worked and what to fix.",
    go: "/resume",
    iconClass: "icon-green",
    iconPath: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2zM14 2v5a1 1 0 0 0 1 1h5"
  },
  {
    // No standalone page of its own - it's the same flow already built into
    // the Resume tab (mode "story"), just reachable from here too.
    name: "Story Builder",
    body: "Turn your journey from 10th onwards into one coherent narrative, with variants for the resume walkthrough and the fit round.",
    go: "/resume?mode=story",
    iconClass: "icon-amber",
    iconPath: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
  },
  {
    name: "Frameworks",
    body: "The structures interviewers expect you to reach for - guesstimates, cases, product sense - with worked examples you can apply under pressure.",
    go: "/frameworks",
    iconClass: "icon-pink",
    iconPath:
      "M18 5m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M6 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M18 19m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
  },
  {
    name: "Tone Shifter",
    body: "Rewrite the same answer for the room you are in: consulting crisp, product conversational, finance precise.",
    go: "/tone-shifter",
    iconClass: "icon-cyan",
    iconPath: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
  },
  {
    name: "Mock Interview",
    body: "Run the full loop under time, built on the real interview structures used by the company and role you picked.",
    go: "/mock-interview",
    iconClass: "icon-purple",
    iconPath: "M12 19v3M19 10v2a7 7 0 0 1-14 0v-2M12 15a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v7a3 3 0 0 0 3 3z"
  }
];

export default function HomePage() {
  const navigate = useNavigate();
  const { loading, error, data } = useDashboard();

  const dash = useMemo(() => {
    const d = data;
    const plan = (d?.plan || []).map((p) => {
      const badge = TYPE_BADGE[p.type] || DEFAULT_BADGE;
      return {
        label: p.label,
        minutesLabel: p.done ? "Done" : "~" + p.minutes + " min",
        done: p.done,
        badgeBg: p.done ? "#F3F4F6" : badge.bg,
        badgeColor: p.done ? "#9ca3af" : badge.color,
        iconPath: badge.iconPath,
        labelStyle: { fontSize: 13.5, color: p.done ? "#9ca3af" : "#111827", textDecoration: p.done ? "line-through" : "none" },
        open: () => navigate(TYPE_PAGE[p.type] || "/")
      };
    });
    const recent = (d?.recent || []).map((r) => {
      const badge = TYPE_BADGE[r.type] || DEFAULT_BADGE;
      return { label: r.label, detail: r.detail, ago: timeAgo(r.createdAt), badgeBg: badge.bg, badgeColor: badge.color, iconPath: badge.iconPath };
    });
    const week = (d?.thisWeek || []).map((w) => ({
      label: w.label,
      showCheck: !!w.done,
      circleClass: w.done ? "done" : w.isFuture ? "todo" : "missed"
    }));
    const streak = d?.streak || 0;
    const streakMessage = streak >= 3 ? "You're on fire! 🔥" : streak > 0 ? "Nice, keep it going." : "Start today to build your streak.";
    const hasReadiness = !loading && !error && typeof d?.readiness === "number";
    const readinessPct = hasReadiness ? Math.max(0, Math.min(100, d!.readiness as number)) : 0;
    const readinessLabel = readinessPct >= 80 ? "Strong" : readinessPct >= 60 ? "Good" : "Building";
    return {
      loading, hasError: !loading && !!error, error: error || "",
      hasPlan: !loading && !error && plan.some((p) => !p.done),
      allPlanDone: !loading && !error && plan.length > 0 && plan.every((p) => p.done),
      plan,
      hasRecent: !loading && !error && recent.length > 0,
      noRecent: !loading && !error && recent.length === 0,
      recent,
      streak, streakMessage, week,
      hasReadiness, noReadiness: !hasReadiness,
      readiness: d?.readiness, readinessLabel,
      readinessRingStyle: { background: `conic-gradient(#1E1B4B ${readinessPct}%, #E7E6F2 0)` }
    };
  }, [loading, error, data, navigate]);

  const steps = useMemo(
    () =>
      STEPS.map((s) => ({
        ...s,
        open: () => navigate(s.go)
      })),
    [navigate]
  );
  const gridSteps = steps.slice(0, 6);
  const wideStep = steps[6];

  return (
    <>
      <div style={{ marginBottom: 26 }}>
        <div className="pill">
          <span className="check-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          RESUME-FIRST. TARGETED. PERSONALIZED.
        </div>
      </div>

      <div style={{ display: "flex", gap: 30, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="hero">
            <div>
              <div className="hero-headline">
                Interview prep
                <br />
                that starts from
                <br />
                <span className="grad">your resume.</span>
              </div>
              <p className="hero-copy">
                We read your resume, understand your target roles, and simulate the exact interview experience — so you walk in prepared, not
                guessed.
              </p>
              <div className="hero-actions">
                <div className="btn btn-primary" onClick={() => navigate("/resume")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 16a4 4 0 0 1-.4-8A5.5 5.5 0 0 1 17.4 9 4.5 4.5 0 0 1 17 16" />
                    <polyline points="12 12 12 21" />
                    <polyline points="9 15 12 12 15 15" />
                  </svg>
                  Upload your resume
                </div>
                <div className="btn btn-secondary" onClick={() => navigate("/role")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="12" cy="12" r="1" />
                  </svg>
                  Set your target
                </div>
              </div>
            </div>

            <div className="illustration">
              <div className="ring"></div>
              <svg className="sparkle" style={{ top: 2, right: 60 }} width="18" height="18" viewBox="0 0 24 24" fill="#C9C7E4">
                <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
              </svg>
              <svg className="sparkle" style={{ bottom: 70, left: 230 }} width="12" height="12" viewBox="0 0 24 24" fill="#C9C7E4">
                <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
              </svg>
              <div className="fc-dot" style={{ top: 40, left: 200 }}></div>
              <div className="fc-dot" style={{ bottom: 120, right: 40 }}></div>

              <div className="float-card fc-role">
                <div className="fc-label">Role Fit</div>
                <div className="fc-pct">91%</div>
                <svg width="80" height="20" viewBox="0 0 80 20">
                  <polyline points="0,16 12,10 24,14 36,6 48,11 60,4 72,9" fill="none" stroke="#6D61F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="float-card fc-comm">
                <div className="fc-label">Communication</div>
                <div className="fc-pct">78%</div>
                <svg width="80" height="20" viewBox="0 0 80 20">
                  <rect x="0" y="10" width="8" height="10" rx="1.5" fill="#34D399" />
                  <rect x="14" y="6" width="8" height="14" rx="1.5" fill="#34D399" />
                  <rect x="28" y="2" width="8" height="18" rx="1.5" fill="#34D399" />
                  <rect x="42" y="8" width="8" height="12" rx="1.5" fill="#A7F3D0" />
                  <rect x="56" y="4" width="8" height="16" rx="1.5" fill="#34D399" />
                </svg>
              </div>

              <div className="float-card fc-problem">
                <div className="fc-label">Problem Solving</div>
                <div className="fc-pct">85%</div>
                <svg width="80" height="20" viewBox="0 0 80 20">
                  <polyline points="0,6 12,12 24,7 36,15 48,9 60,13 72,5" fill="none" stroke="#D9A441" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="fc-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2zM14 2v5a1 1 0 0 0 1 1h5" />
                  <path d="M9 13h6M9 17h6" />
                </svg>
              </div>

              <div className="float-card fc-readiness">
                {dash.hasReadiness && (
                  <div className="ring-outer" style={dash.readinessRingStyle}>
                    <div className="ring-inner">
                      <span className="pct">{dash.readiness}%</span>
                      <span className="lbl">{dash.readinessLabel}</span>
                    </div>
                  </div>
                )}
                {dash.noReadiness && (
                  <div className="ring-outer-empty">
                    <span style={{ fontSize: 7, color: "#8A8B94", fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>
                      No data
                      <br />
                      yet
                    </span>
                  </div>
                )}
                <div>
                  <div className="fc-label" style={{ marginBottom: 2 }}>
                    Interview Readiness
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="section-title">What each section does</div>
          <div className="grid-3">
            {gridSteps.map((s) => (
              <FeatureCard key={s.name} name={s.name} body={s.body} iconClass={s.iconClass} iconPath={s.iconPath} onClick={s.open} />
            ))}
          </div>

          <div className="grid-full">
            <FeatureCard wide name={wideStep.name} body={wideStep.body} iconClass={wideStep.iconClass} iconPath={wideStep.iconPath} onClick={wideStep.open} />
          </div>
        </div>

        <aside className="rightpanel">
          <div className="rp-card">
            <div className="rp-title">Prep streak</div>
            <div className="streak-num">
              <svg className="flame-big" viewBox="0 0 24 24" fill="#F97316">
                <path d="M12 2c1 3-2 4-2 7a3 3 0 0 0 6 0c1 1 2 2.5 2 4.5A6.5 6.5 0 0 1 5 13.5C5 8 9 6 12 2z" />
              </svg>
              <span>{dash.streak} days</span>
            </div>
            <div className="streak-caption">{dash.streakMessage}</div>
            <div className="week-row">
              {dash.week.map((d, i) => (
                <div className="week-day" key={i}>
                  <div className={"day-circle " + d.circleClass}>
                    {d.showCheck && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div className="day-label">{d.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rp-card">
            <div className="rp-title">Today's plan</div>
            {dash.loading && <div style={{ color: "#9ca3af", fontSize: 12.5 }}>Loading…</div>}
            {dash.hasError && <div style={{ color: "#b91c1c", fontSize: 12.5 }}>{dash.error}</div>}
            {dash.hasPlan &&
              dash.plan.map((p, i) => (
                <div className="plan-row" onClick={p.open} key={i}>
                  <div className="row-icon" style={{ background: p.badgeBg, color: p.badgeColor }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={p.iconPath} />
                    </svg>
                  </div>
                  <div className="row-body">
                    <div className="row-title" style={p.labelStyle}>
                      {p.label}
                    </div>
                  </div>
                  <div className="row-time">{p.minutesLabel}</div>
                </div>
              ))}
            {dash.allPlanDone && <div style={{ color: "#374151", fontSize: 12.5 }}>Nice work — you've covered today's core prep already. 🎉</div>}
          </div>

          <div className="rp-card">
            <div className="rp-title">Recent activity</div>
            {dash.hasRecent &&
              dash.recent.map((r, i) => (
                <div className="activity-row" key={i}>
                  <div className="row-icon" style={{ background: r.badgeBg, color: r.badgeColor }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={r.iconPath} />
                    </svg>
                  </div>
                  <div className="row-body">
                    <div className="row-title">{r.label}</div>
                    <div className="row-sub">{r.detail}</div>
                  </div>
                  <div className="row-time">{r.ago}</div>
                </div>
              ))}
            {dash.noRecent && <div style={{ color: "#9ca3af", fontSize: 12.5 }}>Nothing logged yet — start with today's plan above.</div>}
          </div>

          <div className="rp-card quote-card">
            <div className="quote-mark">"</div>
            <div className="quote-line1">Preparation today,</div>
            <div className="quote-line2">placement tomorrow.</div>
            <div className="quote-sub">You've got this! 💪</div>
          </div>
        </aside>
      </div>
    </>
  );
}

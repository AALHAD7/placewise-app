import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useDashboard } from "../hooks/useDashboard";
import { apiFetch } from "../lib/apiClient";
import PlanModal from "../components/PlanModal";
import type { CommunitySummaryResponse, CurrentPlanResponse, PlanDay } from "../types/api";

// Home rebuild (replaces the earlier P0-P4 Home entirely - see home.css's
// header comment). Six sections only: Header (TopNav), Greeting, Hero,
// Popular tools, Plan banner, Community card.

function getGreetingWord(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  return "Good evening";
}

function LightningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h9l-1 8 10-12h-9z" />
    </svg>
  );
}
function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" /><polyline points="7 8 12 3 17 8" /><path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

// The curved hand-drawn arrow under the Caveat note - a small inline SVG,
// not an icon font glyph, so it reads as a sketch rather than a UI icon.
function CurvedArrow() {
  return (
    <svg viewBox="0 0 40 28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 4c6 2 18 2 24 12 2 3-1 7-6 6" />
      <path d="M17 20l4 2-1-5" />
    </svg>
  );
}

// TOOLS: 4 cards, tints/routes exactly as specified.
const TOOLS = [
  { title: "Company Prep", desc: "Insights on top companies, roles and interview process.", to: "/company", tint: "var(--home-tint-blue)", color: "var(--home-primary)", icon: "building" },
  { title: "Case Practice", desc: "Practise real casebook cases with AI guidance.", to: "/frameworks", tint: "var(--home-tint-purple)", color: "#7C3AED", icon: "layers" },
  { title: "Resume Drill", desc: "Get the questions your resume invites, with AI feedback.", to: "/resume", tint: "var(--home-tint-green)", color: "var(--home-success)", icon: "file" },
  { title: "Mock Interview", desc: "A live voice interview tuned to your domain and difficulty.", to: "/mock-interview", tint: "var(--home-tint-orange)", color: "#D97706", icon: "mic" }
];

function ToolIcon({ name }: { name: string }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "building") return <svg {...common}><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M10 9h4M10 13h4M10 17h4" /></svg>;
  if (name === "layers") return <svg {...common}><polygon points="12 2 2 8 12 14 22 8 12 2" /><polyline points="2 16 12 22 22 16" /><polyline points="2 12 12 18 22 12" /></svg>;
  if (name === "file") return <svg {...common}><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /></svg>;
  return <svg {...common}><rect x="9" y="2" width="6" height="13" rx="3" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><path d="M12 19v3" /></svg>;
}

export default function HomePage() {
  const { isGuest } = useAuth();
  const { sessionName, loading: dashLoading } = useDashboard();
  const firstName = sessionName.split(" ")[0] || "there";

  const [heroImgOk, setHeroImgOk] = useState(true);

  // --- Plan banner state -----------------------------------------------
  const [plan, setPlan] = useState<PlanDay[] | null>(null);
  const [planSaved, setPlanSaved] = useState(false);
  const [planCreatedAt, setPlanCreatedAt] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(!isGuest);
  const [modalOpen, setModalOpen] = useState(false);
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [sectionRoutes, setSectionRoutes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isGuest) {
      setPlanLoading(false);
      return;
    }
    apiFetch<CurrentPlanResponse>("/api/plan/current", {}, "")
      .then((res) => {
        setSectionRoutes(res.sectionRoutes || {});
        if (res.plan) {
          setPlan(res.plan.days);
          setPlanSaved(true);
          setPlanCreatedAt(res.plan.created_at);
        }
      })
      .catch(() => {})
      .finally(() => setPlanLoading(false));
  }, [isGuest]);

  const todayDayNumber = useMemo(() => {
    if (!planCreatedAt) return 1;
    const daysSince = Math.floor((Date.now() - new Date(planCreatedAt).getTime()) / 86400000);
    return Math.min(Math.max(daysSince + 1, 1), 3);
  }, [planCreatedAt]);

  useEffect(() => {
    if (plan) setOpenDay(todayDayNumber);
  }, [plan, todayDayNumber]);

  const handleGenerated = (days: PlanDay[], saved: boolean) => {
    setPlan(days);
    setPlanSaved(saved);
    setPlanCreatedAt(new Date().toISOString());
    setModalOpen(false);
    setOpenDay(1);
  };

  // --- Community card state ---------------------------------------------
  const [community, setCommunity] = useState<CommunitySummaryResponse | null>(null);
  useEffect(() => {
    apiFetch<CommunitySummaryResponse>("/api/community/summary", {}, "")
      .then(setCommunity)
      .catch(() => {});
  }, []);

  return (
    <div className="home-page">
      <div className="home-container">
        {!isGuest && !dashLoading && (
          <div className="home-greeting">{getGreetingWord()}, {firstName}</div>
        )}

        <section className="home-hero">
          <div>
            <h1>
              Interview prep that starts
              <span className="accent">from your resume</span>
            </h1>
            <p className="home-hero-sub">
              Upload your CV. Placewise finds the questions each line invites, then runs you through live mock interviews the way panels in your target domain actually ask.
            </p>
            <div className="home-hero-actions">
              <Link to="/resume" className="home-btn home-btn-primary">
                <UploadIcon /> Upload your resume
              </Link>
              <Link to="/role" className="home-btn home-btn-secondary">
                <TargetIcon /> Set your target
              </Link>
            </div>
          </div>

          <div className="home-illustration">
            <div className="home-trend-badge"><TrendIcon /></div>
            <div className="home-illu-note">
              From prep to placement
              <CurvedArrow />
            </div>
            {heroImgOk ? (
              <img
                src="/illustrations/hero-student.png"
                alt="A student working through interview prep on a laptop, checklist: Learn, Practice, Improve, Get Hired"
                width={361}
                height={212}
                fetchPriority="high"
                className="home-illu-image"
                onError={() => setHeroImgOk(false)}
              />
            ) : (
              // Never show a broken image - if the file is missing, the
              // panel still reads fine with just the gradient and note.
              <div className="home-illu-fallback" />
            )}
          </div>
        </section>

        <section className="home-section">
          <div className="home-section-head">
            <div className="home-section-title"><LightningIcon /><h2>Popular tools</h2></div>
          </div>
          <div className="home-tools-grid">
            {TOOLS.map((tool) => (
              <Link key={tool.title} to={tool.to} className="home-tool-card">
                <div className="home-tool-icon" style={{ background: tool.tint, color: tool.color }}>
                  <ToolIcon name={tool.icon} />
                </div>
                <h3>{tool.title}</h3>
                <p>{tool.desc}</p>
                <div className="home-tool-arrow"><ArrowRightIcon /></div>
              </Link>
            ))}
          </div>
        </section>

        <section className="home-section home-split">
          <div className="home-plan-banner">
            <div className="home-plan-icon"><TargetIcon /></div>
            <h2>Upcoming interviews?</h2>
            <p>Get a personalised 3-day prep plan based on your target role and timeline.</p>

            {!plan && !planLoading && (
              <div>
                <button type="button" className="home-btn home-btn-primary" onClick={() => setModalOpen(true)}>
                  Create my plan
                </button>
              </div>
            )}

            {plan && (
              <>
                {!planSaved && <div className="home-plan-note">Sign in to save this plan.</div>}
                <div className="home-plan-days">
                  {plan.map((day) => {
                    const expanded = openDay === day.day;
                    const isToday = day.day === todayDayNumber;
                    return (
                      <div key={day.day} className="home-plan-day">
                        <button
                          type="button"
                          className="home-plan-day-head"
                          aria-expanded={expanded}
                          onClick={() => setOpenDay(expanded ? null : day.day)}
                        >
                          <span>
                            {isToday ? "Today's plan" : `Day ${day.day}`}
                            <span className="focus">{day.focus}</span>
                          </span>
                          <ChevronDownIcon />
                        </button>
                        {expanded && (
                          <div className="home-plan-tasks">
                            {day.tasks.map((task, i) => (
                              <Link key={i} to={sectionRoutes[task.section] || "/frameworks"} className="home-plan-task">
                                <span>{task.title}</span>
                                <span className="minutes">{task.minutes} min</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div>
                  <button type="button" className="home-btn home-btn-secondary" onClick={() => setModalOpen(true)}>
                    Regenerate plan
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="home-community-card">
            <h2><PeopleIcon /> Join the community</h2>
            <p>Discuss, share resources, ask questions and grow together.</p>
            <div className="home-avatar-row">
              {community && community.avatars.length > 0 && (
                <div className="home-avatar-stack">
                  {community.avatars.map((a, i) => (
                    <div key={i} className="home-mini-avatar">{a.initials}</div>
                  ))}
                </div>
              )}
              {community?.showCount && <span className="home-member-count">+{community.memberCount} members</span>}
            </div>
            <div>
              <Link to="/community" className="home-btn home-btn-secondary">
                {isGuest ? "Join now" : "Open community"}
              </Link>
            </div>
          </div>
        </section>
      </div>

      {modalOpen && (
        <PlanModal isGuest={isGuest} onClose={() => setModalOpen(false)} onGenerated={handleGenerated} />
      )}
    </div>
  );
}

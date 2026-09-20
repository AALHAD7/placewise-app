import { useEffect, useState, type KeyboardEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/apiClient";
import { isPageReload } from "../lib/navigation";
import { ensurePyodide, ensureSqlJs } from "../lib/sandboxRuntimes";
import { parseBold, rowsMatch, type BoldSegment } from "../lib/skillUtils";
import { ICON_D } from "../lib/constants";
import { useVoiceRecording } from "../hooks/useVoiceRecording";
import VoiceRecordButton from "../components/VoiceRecordButton";
import IndeterminateProgressBar from "../components/IndeterminateProgressBar";
import type { SkillConcept, SkillContentResponse, SkillDifficulty, SkillProblem, SkillProblemsResponse, SkillScoreFeedback, SkillScoreResponse } from "../types/api";

// Ported from frontend/index.html: openSkill/loadSkillContent/
// onSkillDifficultyChange/loadSkillProblems (3387-3431), rowsMatch/parseBold
// (3462-3492, moved to lib/skillUtils.ts), scoreOpenProblem/runProblem
// (3500-3558), problemPanel()/skillPanel() (3563-3704), markup (1126-1312).
// See migration plan Phase 6. Reached only via a skill chip click from Role
// (no nav-bar entry of its own) - now a real URL (/skill?role=&skill=)
// instead of a setState({active,activeSkill}) handoff, a genuine
// improvement (bookmarkable/shareable/back-button-safe).
//
// sql.js/Pyodide stay genuinely lazy-loaded (see lib/sandboxRuntimes.ts) -
// only fetched when a SQL/Python problem is actually run, not bundled
// eagerly into this page's chunk.

interface RunState {
  code?: string;
  running?: boolean;
  ran?: boolean;
  error?: string;
  rows?: Record<string, unknown>[];
  passed?: boolean;
  testResults?: { label: string; got: unknown; expected: unknown; pass: boolean }[];
  showAnswer?: boolean;
  answerDraft?: string;
  scoring?: boolean;
  scoreError?: string;
  feedback?: SkillScoreFeedback;
}

export default function SkillPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "";
  const skill = searchParams.get("skill") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<"sql" | "python" | null>(null);
  const [concepts, setConcepts] = useState<SkillConcept[]>([]);

  const [difficulty, setDifficulty] = useState<SkillDifficulty | "">("");
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [problemsError, setProblemsError] = useState("");
  const [problems, setProblems] = useState<SkillProblem[]>([]);

  const [skillRuns, setSkillRuns] = useState<Record<string, RunState>>({});
  const { recording, micError, startRecording, stopRecording } = useVoiceRecording();

  useEffect(() => {
    if (!role || !skill) return;
    // This page is only ever reached via a deep link from Role/Mock
    // Interview (?role=&skill=) - unlike Role's own selector, there's no
    // "nothing selected" UI to fall back to here. A genuine browser refresh
    // should still start clean per the user's ask on Role, so send it back
    // to a page that actually has an empty state instead of re-loading
    // content for whatever role/skill happened to be in the URL.
    if (isPageReload()) {
      navigate("/role", { replace: true });
      return;
    }
    setLoading(true);
    setError("");
    setDifficulty("");
    setProblems([]);
    setProblemsError("");
    apiFetch<SkillContentResponse>("/api/skills/" + encodeURIComponent(role) + "/" + encodeURIComponent(skill), {}, "Failed to load skill content.")
      .then((data) => {
        setLoading(false);
        setLanguage(data.language);
        setConcepts(data.concepts || []);
      })
      .catch((e) => {
        setLoading(false);
        setError(e instanceof Error ? e.message : "Could not load skill content.");
      });
  }, [role, skill]);

  function loadProblems(d: SkillDifficulty, force?: boolean) {
    setProblemsLoading(true);
    setProblemsError("");
    setProblems([]);
    apiFetch<SkillProblemsResponse>(
      "/api/skills/" + encodeURIComponent(role) + "/" + encodeURIComponent(skill) + "/problems?difficulty=" + encodeURIComponent(d) + (force ? "&force=true" : ""),
      {},
      "Failed to load practice problems."
    )
      .then((data) => {
        setProblemsLoading(false);
        setProblems(data.problems || []);
      })
      .catch((e) => {
        setProblemsLoading(false);
        setProblemsError(e instanceof Error ? e.message : "Could not load practice problems.");
      });
  }

  function onDifficultyChange(d: SkillDifficulty | "") {
    setDifficulty(d);
    if (d) loadProblems(d);
  }

  const runKeyBase = role + "|" + skill + "|" + difficulty;

  async function runProblem(p: SkillProblem) {
    const runKey = runKeyBase + "|" + p.id;
    const prevRun = skillRuns[runKey] || {};
    const code = prevRun.code !== undefined ? prevRun.code : language === "python" ? p.starterCode || "" : "-- write your query here\n";
    setSkillRuns((s) => ({ ...s, [runKey]: { ...prevRun, code, running: true, ran: false, error: "" } }));

    try {
      if (language === "sql") {
        const SQL = await ensureSqlJs();
        const db = new SQL.Database();
        db.run(p.schemaSql || "");
        db.run(p.seedSql || "");
        let rows: Record<string, unknown>[] = [];
        try {
          const res = db.exec(code);
          rows = res.length ? res[0].values.map((row) => Object.fromEntries(res[0].columns.map((c, i) => [c, row[i]]))) : [];
        } finally {
          db.close();
        }
        const passed = rowsMatch(rows, p.expectedResult || []);
        setSkillRuns((s) => ({ ...s, [runKey]: { code, running: false, ran: true, error: "", rows, passed } }));
      } else if (language === "python") {
        const pyodide = await ensurePyodide();
        const argsJson = JSON.stringify((p.testCases || []).map((t) => t.args));
        const harness = "import json as _json\n\n" + code + "\n\n_inputs = _json.loads('''" + argsJson + "''')\n_json.dumps([solve(*args) for args in _inputs])";
        const resultJson = await pyodide.runPythonAsync(harness);
        const outputs = JSON.parse(resultJson);
        const testResults = (p.testCases || []).map((t, i) => ({
          label: t.label,
          got: outputs[i],
          expected: t.expectedOutput,
          pass: JSON.stringify(outputs[i]) === JSON.stringify(t.expectedOutput)
        }));
        const passed = testResults.every((t) => t.pass);
        setSkillRuns((s) => ({ ...s, [runKey]: { code, running: false, ran: true, error: "", testResults, passed } }));
      }
    } catch (e) {
      setSkillRuns((s) => ({ ...s, [runKey]: { code, running: false, ran: true, error: e instanceof Error ? e.message : "Execution failed.", passed: false } }));
    }
  }

  async function scoreOpenProblem(p: SkillProblem) {
    const runKey = runKeyBase + "|" + p.id;
    const prevRun = skillRuns[runKey] || {};
    const answer = (prevRun.answerDraft || "").trim();
    if (!answer || prevRun.scoring) return;
    setSkillRuns((s) => ({ ...s, [runKey]: { ...prevRun, scoring: true, scoreError: "" } }));
    try {
      const data = await apiFetch<SkillScoreResponse>(
        "/api/skills/" + encodeURIComponent(role) + "/" + encodeURIComponent(skill) + "/score",
        { method: "POST", body: JSON.stringify({ prompt: p.prompt, concept: p.concept || "", userAnswer: answer }) },
        "Failed to score answer."
      );
      setSkillRuns((s) => ({ ...s, [runKey]: { ...prevRun, scoring: false, scoreError: "", feedback: data.feedback } }));
    } catch (e) {
      setSkillRuns((s) => ({ ...s, [runKey]: { ...prevRun, scoring: false, scoreError: e instanceof Error ? e.message : "Could not score your answer." } }));
    }
  }

  const hasConcepts = !loading && !error && concepts.length > 0;
  const showDifficultyPicker = !loading && !error;
  const hasProblems = !loading && !error && !problemsLoading && !problemsError && problems.length > 0;

  return (
    <div style={{ marginTop: 26, width: "100%" }}>
      <button type="button" onClick={() => navigate("/role?role=" + encodeURIComponent(role))} className="unbutton link-darken" style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--text-gray2)", fontSize: "0.8125rem", fontWeight: 600, marginBottom: 14 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        <span>Back to Role</span>
      </button>
      <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>{role}</div>
      <h1 style={{ margin: "6px 0 0", fontSize: "1.625rem", fontWeight: 700, letterSpacing: "-.02em", color: "var(--text-900)" }}>{skill}</h1>

      {loading && (
        <div role="status" aria-live="polite" style={{ marginTop: 20, maxWidth: 420 }}>
          <div style={{ color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>Generating core concepts…</div>
          <IndeterminateProgressBar />
        </div>
      )}
      {error && <div className="t-shake" style={{ marginTop: 20, color: "var(--red-dark)", fontSize: "0.84375rem" }}>{error}</div>}

      {hasConcepts && (
        <div style={{ marginTop: 24, background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "20px 22px" }}>
          <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Core concepts</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
            {concepts.map((c, i) => (
              <div key={i}>
                {c.link ? (
                  <a href={c.link} target="_blank" rel="noopener noreferrer" className="skill-concept-link" style={{ fontSize: "0.90625rem", fontWeight: 700, color: "#1d4ed8", textDecoration: "underline", textUnderlineOffset: 2 }}>
                    {c.title}{" "}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: -1 }}>
                      <path d="M15 3h6v6" />
                      <path d="M10 14 21 3" />
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    </svg>
                  </a>
                ) : (
                  <div style={{ fontSize: "0.90625rem", fontWeight: 700, color: "var(--text-900)" }}>{c.title}</div>
                )}
                <p style={{ margin: "4px 0 0", fontSize: "0.84375rem", lineHeight: 1.55, color: "var(--text-600)" }}>{c.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showDifficultyPicker && (
        <div style={{ marginTop: 22, background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.84375rem", fontWeight: 700, color: "var(--text-900)" }}>Choose a difficulty to generate 6 practice problems</span>
          <select
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value as SkillDifficulty | "")}
            style={{ border: "1px solid var(--border-soft)", borderRadius: "var(--r-sm)", padding: "8px 12px", font: "600 0.8125rem 'Instrument Sans',sans-serif", color: "var(--text-900)", background: "var(--field-bg-alt)", outline: "none", cursor: "pointer" }}
          >
            <option value="">Select difficulty…</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      )}

      {problemsLoading && (
        <div role="status" aria-live="polite" style={{ marginTop: 20, maxWidth: 420 }}>
          <div style={{ color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>Generating 6 practice problems… this can take a bit longer for SQL/Python skills.</div>
          <IndeterminateProgressBar />
        </div>
      )}
      {problemsError && <div className="t-shake" style={{ marginTop: 20, color: "var(--red-dark)", fontSize: "0.84375rem" }}>{problemsError}</div>}

      {hasProblems && (
        <>
          <div style={{ marginTop: 22, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
            <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Practice problems</div>
            <button
              onClick={() => difficulty && loadProblems(difficulty, true)}
              className="link-darken"
              style={{ border: "1px solid var(--border-soft)", borderRadius: "var(--r-sm)", background: "var(--surface)", color: "var(--text-700)", font: "600 0.78125rem 'Instrument Sans',sans-serif", padding: "7px 12px", cursor: "pointer" }}
            >
              ↻ Generate new questions
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
            {problems.map((p) => {
              const runKey = runKeyBase + "|" + p.id;
              return (
                <ProblemCard
                  key={p.id}
                  p={p}
                  language={language}
                  run={skillRuns[runKey] || {}}
                  onRunChange={(patch) => setSkillRuns((s) => ({ ...s, [runKey]: { ...(s[runKey] || {}), ...patch } }))}
                  onRun={() => runProblem(p)}
                  onScore={() => scoreOpenProblem(p)}
                  recording={!!recording["skill__" + runKey]}
                  micError={micError["skill__" + runKey] || ""}
                  onToggleMic={() =>
                    recording["skill__" + runKey]
                      ? stopRecording("skill__" + runKey)
                      : startRecording("skill__" + runKey, () => skillRuns[runKey]?.answerDraft || "", (text) => setSkillRuns((s) => ({ ...s, [runKey]: { ...(s[runKey] || {}), answerDraft: text } })))
                  }
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

interface ProblemCardProps {
  p: SkillProblem;
  language: "sql" | "python" | null;
  run: RunState;
  onRunChange: (patch: Partial<RunState>) => void;
  onRun: () => void;
  onScore: () => void;
  recording: boolean;
  micError: string;
  onToggleMic: () => void;
}

function ProblemCard({ p, language, run, onRunChange, onRun, onScore, recording, micError, onToggleMic }: ProblemCardProps) {
  const isCode = language === "sql" || language === "python";
  const isSql = language === "sql";
  const isPython = language === "python";
  const code = run.code !== undefined ? run.code : isPython ? p.starterCode || "" : "-- write your query here\n";
  const rows = run.rows || [];
  const testResults = run.testResults || [];
  const ran = !!run.ran;
  const hasError = !!run.error;
  const passed = run.passed === true;
  const showAnswer = !!run.showAnswer;
  const showVerdict = ran && !hasError;
  const verdictColor = passed ? "var(--green-dark)" : "var(--red-dark)";

  const tagStyle: Record<string, string> = { Easy: "background:#e7f6ee;color:#047857", Medium: "background:#fdf3e3;color:#b45309", Hard: "background:#fdeaea;color:var(--red-dark)" };
  const tagCss = tagStyle[p.difficulty] || "background:#f3f4f6;color:#4b5563";
  const [tagBg, tagColor] = tagCss.split(";").map((s) => s.split(":")[1]);

  function onCodeKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const ta = e.currentTarget;
    const v = ta.value;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    let newValue: string, newStart: number, newEnd: number;
    if (e.shiftKey) {
      const lineStart = v.lastIndexOf("\n", start - 1) + 1;
      const removeLen = v.slice(lineStart, lineStart + 2) === "  " ? 2 : v[lineStart] === " " ? 1 : 0;
      newValue = v.slice(0, lineStart) + v.slice(lineStart + removeLen);
      newStart = Math.max(lineStart, start - removeLen);
      newEnd = Math.max(lineStart, end - removeLen);
    } else {
      newValue = v.slice(0, start) + "  " + v.slice(end);
      newStart = newEnd = start + 2;
    }
    ta.value = newValue;
    ta.selectionStart = newStart;
    ta.selectionEnd = newEnd;
    onRunChange({ code: newValue });
  }

  const promptSegments = parseBold(p.prompt);
  const modelAnswerSegments = !isCode ? parseBold(p.modelAnswer || "") : [];

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ flex: "none", padding: "3px 9px", borderRadius: "var(--r-pill)", fontSize: "0.65625rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", background: tagBg, color: tagColor }}>{p.difficulty}</span>
        {p.concept && <span style={{ flex: "none", fontSize: "0.6875rem", fontWeight: 700, color: "var(--indigo-700)", background: "#eef0ff", padding: "3px 9px", borderRadius: "var(--r-pill)" }}>Tests: {p.concept}</span>}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: "0.90625rem", lineHeight: 1.6, color: "var(--text-900)" }}>
        {promptSegments.map((seg: BoldSegment, i: number) => (
          <span key={i} style={{ fontWeight: seg.weight }}>{seg.text}</span>
        ))}
      </p>

      {isCode && (
        <>
          <textarea
            value={code}
            onChange={(e) => onRunChange({ code: e.target.value })}
            onKeyDown={onCodeKeyDown}
            spellCheck={false}
            className="code-textarea"
            style={{ marginTop: 14, width: "100%", minHeight: 120, border: "1px solid var(--border-soft)", borderRadius: "var(--r-sm)", padding: "12px 14px", font: "400 0.8125rem/1.5 'SF Mono',Menlo,Consolas,monospace", color: "var(--text-900)", background: "var(--field-bg-alt)", outline: "none", resize: "vertical", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
            <button onClick={onRun} style={{ border: 0, borderRadius: "var(--r-sm)", background: "var(--indigo-700)", color: "var(--surface)", font: "600 0.8125rem 'Instrument Sans',sans-serif", padding: "9px 16px", cursor: "pointer" }}>
              {run.running ? "Running…" : "Run"}
            </button>
            <button onClick={() => onRunChange({ showAnswer: !showAnswer })} style={{ border: "1px solid var(--border-soft)", borderRadius: "var(--r-sm)", background: "var(--surface)", color: "var(--text-700)", font: "600 0.8125rem 'Instrument Sans',sans-serif", padding: "9px 16px", cursor: "pointer" }}>
              {showAnswer ? "Hide answer" : "Show answer"}
            </button>
            {showVerdict && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.78125rem", fontWeight: 700, color: verdictColor }}>
                <morph-icon icon={passed ? ICON_D.CHECK : ICON_D.X} style={{ width: 14, height: 14, color: verdictColor }}></morph-icon>
                {passed ? "Passed" : "Not quite"}
              </span>
            )}
          </div>

          {hasError && <div style={{ marginTop: 10, padding: "10px 12px", background: "#fdeaea", borderRadius: "var(--r-sm)", fontSize: "0.78125rem", color: "var(--red-dark)", whiteSpace: "pre-wrap" }}>{run.error}</div>}

          {isSql && ran && !hasError && (
            <div style={{ marginTop: 12, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78125rem" }}>
                <tbody>
                  {rows.length > 0 && (
                    <tr>
                      {Object.keys(rows[0]).map((col) => (
                        <th key={col} style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--border-soft)", color: "var(--text-gray2)", fontWeight: 600 }}>{col}</th>
                      ))}
                    </tr>
                  )}
                  {rows.map((r, i) => (
                    <tr key={i}>
                      {Object.values(r).map((v, j) => (
                        <td key={j} style={{ padding: "6px 10px", borderBottom: "1px solid #f1f2f6", color: "var(--text-700)" }}>{String(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && <div style={{ padding: "8px 0", color: "var(--text-lightgray)", fontSize: "0.78125rem" }}>No rows returned.</div>}
            </div>
          )}

          {isPython && ran && !hasError && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {testResults.map((t, i) => (
                <div key={i} style={{ border: "1px solid " + (t.pass ? "#cdeeda" : "#f6d5d5"), background: t.pass ? "#f0faf5" : "#fdf3f3", borderRadius: "var(--r-sm)", padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78125rem", fontWeight: 700, color: t.pass ? "var(--green-dark)" : "var(--red-dark)" }}>
                    <morph-icon icon={t.pass ? ICON_D.CHECK : ICON_D.X} style={{ width: 13, height: 13, color: t.pass ? "var(--green-dark)" : "var(--red-dark)" }}></morph-icon>
                    <span>{t.label}</span>
                  </div>
                  <div style={{ marginTop: 6, font: "400 0.75rem/1.5 'SF Mono',Menlo,Consolas,monospace", color: "var(--text-600)", wordBreak: "break-word" }}>got: {JSON.stringify(t.got)}</div>
                  {!t.pass && <div style={{ marginTop: 3, font: "400 0.75rem/1.5 'SF Mono',Menlo,Consolas,monospace", color: "var(--text-600)", wordBreak: "break-word" }}>expected: {JSON.stringify(t.expected)}</div>}
                </div>
              ))}
            </div>
          )}

          {showAnswer && (
            <>
              {isSql && <pre className="t-panel-in" style={{ margin: "12px 0 0", padding: "12px 14px", background: "#161B22", color: "var(--border-soft)", borderRadius: "var(--r-sm)", font: "400 0.78125rem/1.55 'SF Mono',Menlo,Consolas,monospace", whiteSpace: "pre-wrap", overflowX: "auto" }}>{p.solutionSql}</pre>}
              {isPython && <pre className="t-panel-in" style={{ margin: "12px 0 0", padding: "12px 14px", background: "#161B22", color: "var(--border-soft)", borderRadius: "var(--r-sm)", font: "400 0.78125rem/1.55 'SF Mono',Menlo,Consolas,monospace", whiteSpace: "pre-wrap", overflowX: "auto" }}>{p.solutionCode}</pre>}
            </>
          )}
        </>
      )}

      {!isCode && !!p.modelAnswer && (
        <>
          <textarea
            value={run.answerDraft || ""}
            onChange={(e) => onRunChange({ answerDraft: e.target.value })}
            placeholder="Type your answer, or record it and we will transcribe."
            className="code-textarea-plain"
            style={{ marginTop: 14, width: "100%", minHeight: 90, border: "1px solid var(--border-soft)", borderRadius: "var(--r-sm)", padding: "12px 14px", font: "400 0.84375rem/1.55 'Instrument Sans',sans-serif", color: "var(--text-900)", background: "var(--field-bg-alt)", outline: "none", resize: "vertical", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 11 }}>
            <VoiceRecordButton recording={recording} onClick={onToggleMic} />
            <button
              onClick={onScore}
              disabled={!!run.scoring || !(run.answerDraft || "").trim()}
              style={{ border: 0, borderRadius: "var(--r-sm)", background: "var(--indigo-700)", color: "var(--surface)", font: "600 0.84375rem 'Instrument Sans',sans-serif", padding: "9px 16px", cursor: "pointer" }}
            >
              {run.scoring ? "Scoring…" : "Get AI feedback"}
            </button>
            <button onClick={() => onRunChange({ showAnswer: !showAnswer })} style={{ border: "1px solid var(--border-soft)", borderRadius: "var(--r-sm)", background: "var(--surface)", color: "var(--text-700)", font: "600 0.84375rem 'Instrument Sans',sans-serif", padding: "9px 16px", cursor: "pointer" }}>
              {showAnswer ? "Hide answer" : "Show answer"}
            </button>
            <span style={{ fontSize: "0.78125rem", color: "var(--red-dark)" }}>{micError}{run.scoreError || ""}</span>
          </div>

          {!!run.feedback && (
            <div className="t-panel-in" style={{ marginTop: 16, borderTop: "1px solid #f1f2f5", paddingTop: 14 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontSize: "0.65625rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--text-lightgray)" }}>AI feedback · Score</span>
                <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-900)" }}>{run.feedback.score}/10</span>
              </div>
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
                <div style={{ border: "1px solid #d9f2e5", background: "var(--green-wash)", borderRadius: "var(--r-sm)", padding: "12px 14px" }}>
                  <div style={{ color: "var(--green)", fontSize: "0.625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 700 }}>Strengths</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 8 }}>
                    {run.feedback.strengths.map((s, i) => (
                      <div key={i} style={{ fontSize: "0.8125rem", lineHeight: 1.5, color: "var(--green-ink)" }}>{s}</div>
                    ))}
                  </div>
                </div>
                <div style={{ border: "1px solid #f6dede", background: "var(--red-wash)", borderRadius: "var(--r-sm)", padding: "12px 14px" }}>
                  <div style={{ color: "var(--red-dark)", fontSize: "0.625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 700 }}>To improve</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 8 }}>
                    {run.feedback.improvements.map((im, i) => (
                      <div key={i} style={{ fontSize: "0.8125rem", lineHeight: 1.5, color: "var(--red-ink)" }}>{im}</div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 10, background: "var(--surface-alt)", border: "1px solid #eceef2", borderRadius: "var(--r-sm)", padding: "12px 14px" }}>
                <div style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--indigo)" }}>A stronger version</div>
                <p style={{ margin: "7px 0 0", fontSize: "0.8125rem", lineHeight: 1.55, color: "var(--text-700)" }}>{run.feedback.sampleBetterAnswer}</p>
              </div>
            </div>
          )}

          {showAnswer && (
            <p className="t-panel-in" style={{ margin: "10px 0 0", padding: "12px 14px", background: "var(--field-bg-alt)", border: "1px solid var(--border-soft)", borderRadius: "var(--r-sm)", fontSize: "0.84375rem", lineHeight: 1.6, color: "var(--text-700)" }}>
              {modelAnswerSegments.map((seg: BoldSegment, i: number) => (
                <span key={i} style={{ fontWeight: seg.weight }}>{seg.text}</span>
              ))}
            </p>
          )}
        </>
      )}
    </div>
  );
}

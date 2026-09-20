import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { apiFetch, apiUploadWithProgress, streamInterrogate } from "../lib/apiClient";
import { loadResumeCache, saveResumeCache, clearResumeCache } from "../lib/resumeCache";
import { mapDomainForRetrieval, RAG_DOMAIN_OPTIONS } from "../lib/constants";
import { ensureGoogleDriveReady, requestDriveAccessToken, openDrivePicker, fetchDriveFileAsFile } from "../lib/googleDrive";
import { useVoiceRecording } from "../hooks/useVoiceRecording";
import VoiceRecordButton from "../components/VoiceRecordButton";
import PageHeader from "../components/PageHeader";
import { useExitTransition } from "../hooks/useExitTransition";
import type {
  ResumeCategory, ResumeClarifyResponse, ResumeFeedbackResponse, ResumeHelpfulResponse,
  ResumeQuestion, ResumeResults, ResumeUploadResponse, StoryGenerateResponse, StoryNarrative
} from "../types/api";

// Ported from frontend/index.html: resume() (2495-2547), withAnswers()
// (2817-2909), uploadResumeFile/uploadFromGoogleDrive (2445-2493),
// runResumeGenerate/refreshCategory/runFeedback/askClarification/
// reaskClarification/toggleHelpful (2184-2321), storyModal()/storyVariants()/
// runStoryGenerate() (2791-2956), markup (415-605, 1694-1722 for the story
// modal). See migration plan Phase 7.
//
// Deliberately built with a plain controlled <textarea> + useState per
// answer, NOT the old app's debounced _liveAnswers/_answerFlushTimers
// optimization (that existed to fix a typing-lag bug caused by the old
// runtime recomputing all 9 pages' view-models on every keystroke - a
// problem that doesn't exist here, since only this page's own state changes
// on its own keystrokes). Revisit only if real lag is observed.
//
// picks.role/picks.company/picks.domain referenced by the old
// runStoryGenerate() are the dead wizard-UI state dropped per the migration
// plan's Context section - omitted here rather than ported as always-undefined.

type QMode = ResumeCategory | "Story";
type UploadStatus = "idle" | "uploading" | "processing" | "done" | "error";

interface FeedbackState { loading?: boolean; good?: string[]; fix?: string[]; error?: string }
interface HelpfulState { marked: boolean; saving: boolean; id: string | null }
interface ClarifyState { draft?: string; loading?: boolean; error?: string; askedQuestion?: string; answer?: string; understood?: boolean }

const STORY_FIELDS: { key: string; label: string; hint: string }[] = [
  { key: "school", label: "School years (10th and 12th)", hint: "Streams, results, and anything that shaped what you chose next." },
  { key: "ug", label: "Undergraduate", hint: "Degree, college, and the projects or roles that mattered." },
  { key: "work", label: "Work experience", hint: "Companies, what you owned, and one result you are proud of." },
  { key: "mba", label: "MBA and now", hint: "Specialisation, campus roles, internships, and what you are targeting." },
  { key: "turning", label: "Turning points", hint: "Decisions or setbacks that changed your direction." }
];
const STORY_FOCUS_LABELS: Record<string, string> = { school: "School years", ug: "Undergraduate", work: "Work experience", mba: "MBA and now", turning: "Turning points" };
const STORY_ACCENTS = ["var(--indigo)", "var(--green)", "var(--amber-ink)", "#be185d"];

const spinIconPath = "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z";

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={spinIconPath} />
      <path d="M20 2v4" />
      <path d="M22 4h-4" />
      <circle cx="4" cy="18" r="2" />
    </svg>
  );
}

export default function ResumePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const mountedModeApplied = useRef(false);

  // Prep-track filter for RAG retrieval - see RAG_DOMAIN_OPTIONS. Persisted
  // in the URL (?domain=) so it's bookmarkable/shareable, same pattern as
  // RolePage's ?role=&topic=. "" (General) means unfiltered, matching the
  // behavior before this filter existed.
  const [ragDomain, setRagDomainState] = useState(searchParams.get("domain") || "");
  function setRagDomain(value: string) {
    setRagDomainState(value);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set("domain", value);
      else next.delete("domain");
      return next;
    });
  }

  const [resumeFile, setResumeFile] = useState("");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [resumeText, setResumeText] = useState("");
  const [resumeError, setResumeError] = useState("");

  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeGenPercent, setResumeGenPercent] = useState(0);
  const [liveResults, setLiveResults] = useState<ResumeResults | null>(null);
  const [liveSources, setLiveSources] = useState<unknown[]>([]);

  const [qMode, setQMode] = useState<QMode>("Behavioural");

  const [categoryRefreshing, setCategoryRefreshing] = useState<string | null>(null);
  const [categoryRefreshPercent, setCategoryRefreshPercent] = useState(0);
  const [categoryRefreshError, setCategoryRefreshError] = useState("");

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answerOpen, setAnswerOpen] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, FeedbackState>>({});
  const [helpful, setHelpful] = useState<Record<string, HelpfulState>>({});
  const [clarify, setClarify] = useState<Record<string, ClarifyState>>({});

  const [storyModalOpen, setStoryModalOpen] = useState(false);
  // The modal enters as a material and has to leave the same way rather than
  // being dropped on the state flip, and while it owns the screen the page
  // behind it recedes instead of sitting at the same depth. It portals to
  // <body> because .app-shell's push-back transform would otherwise become
  // the containing block for its position:fixed scrim.
  const { rendered: storyModalRendered, exiting: storyModalExiting } = useExitTransition(storyModalOpen, 200);
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(".app-shell");
    if (!shell) return;
    shell.dataset.modal = storyModalRendered && !storyModalExiting ? "true" : "false";
    return () => {
      shell.dataset.modal = "false";
    };
  }, [storyModalRendered, storyModalExiting]);
  useEffect(() => {
    if (!storyModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStoryModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [storyModalOpen]);
  const [storyAnswers, setStoryAnswers] = useState<Record<string, string>>({});
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState("");
  const [storyNarratives, setStoryNarratives] = useState<StoryNarrative[]>([]);

  const { recording, micError, startRecording, stopRecording } = useVoiceRecording();

  useEffect(() => {
    const cached = loadResumeCache();
    if (cached) {
      setResumeFile(cached.fileName);
      setResumeText(cached.resumeText);
      setUploadStatus("done");
      setLiveResults((cached.liveResults as ResumeResults) || null);
      setLiveSources(cached.liveSources || []);
    }
    if (!mountedModeApplied.current) {
      mountedModeApplied.current = true;
      if (searchParams.get("mode") === "story") setQMode("Story");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- upload ---
  async function uploadResumeFile(file: File) {
    setResumeFile(file.name);
    setResumeError("");
    setResumeText("");
    setLiveResults(null);
    setUploadStatus("uploading");
    setUploadPercent(0);
    try {
      const form = new FormData();
      form.append("resume", file);
      const data = await apiUploadWithProgress<ResumeUploadResponse>(
        "/api/resume/upload",
        form,
        (pct) => setUploadPercent(pct),
        () => setUploadStatus("processing"),
        "Network error - is the backend running?"
      );
      setResumeText(data.resumeText);
      setUploadStatus("done");
      saveResumeCache(file.name, data.resumeText);
    } catch (err) {
      setUploadStatus("error");
      setResumeError(err instanceof Error ? err.message : "Could not parse this file.");
    }
  }

  async function uploadFromGoogleDrive() {
    try {
      setResumeError("");
      await ensureGoogleDriveReady();
      const accessToken = await requestDriveAccessToken();
      const doc = await openDrivePicker(accessToken);
      if (!doc) return; // user closed the picker without choosing a file
      const file = await fetchDriveFileAsFile(doc, accessToken);
      await uploadResumeFile(file);
    } catch (err) {
      setUploadStatus("error");
      setResumeError(err instanceof Error ? err.message : "Google Drive upload failed.");
    }
  }

  function clearResume() {
    clearResumeCache();
    setResumeFile("");
    setUploadStatus("idle");
    setUploadPercent(0);
    setResumeText("");
    setResumeError("");
    setLiveResults(null);
  }

  // --- generation ---
  async function runResumeGenerate(text: string) {
    const t = (text || "").trim();
    if (t.length < 20 || resumeLoading) return;
    setResumeLoading(true);
    setResumeError("");
    setResumeGenPercent(0);
    try {
      const finalData = await streamInterrogate(t, null, (pct) => setResumeGenPercent(pct), mapDomainForRetrieval(ragDomain));
      setResumeLoading(false);
      setResumeGenPercent(100);
      const results = finalData.results as ResumeResults;
      setLiveResults(results);
      setLiveSources(finalData.sourcesUsed || []);
      saveResumeCache(resumeFile, t, results, finalData.sourcesUsed || []);
    } catch (e) {
      setResumeLoading(false);
      setResumeError(e instanceof Error ? e.message : "Could not reach the backend.");
    }
  }

  async function refreshCategory(category: string) {
    const t = resumeText.trim();
    if (t.length < 20 || categoryRefreshing) return;
    setCategoryRefreshing(category);
    setCategoryRefreshPercent(0);
    setCategoryRefreshError("");
    try {
      const finalData = await streamInterrogate(t, category, (pct) => setCategoryRefreshPercent(pct), mapDomainForRetrieval(ragDomain));
      const results = finalData.results as ResumeResults;
      const newResults: ResumeResults = { ...(liveResults || {}), [category]: results[category as ResumeCategory] || [] };
      setCategoryRefreshing(null);
      setCategoryRefreshPercent(0);
      setLiveResults(newResults);
      saveResumeCache(resumeFile, t, newResults, liveSources);
    } catch (e) {
      setCategoryRefreshing(null);
      setCategoryRefreshError(e instanceof Error ? e.message : "Could not refresh questions.");
    }
  }

  // --- per-question feedback/clarify/helpful ---
  async function runFeedback(k: string, question: string, answer: string) {
    if (!(answer || "").trim()) return;
    if (feedback[k]?.loading) return;
    setFeedback((s) => ({ ...s, [k]: { loading: true } }));
    setAnswers((s) => ({ ...s, [k]: answer }));
    try {
      const data = await apiFetch<ResumeFeedbackResponse>("/api/resume/feedback", { method: "POST", body: JSON.stringify({ question, answer }) }, "Failed to get feedback.");
      setFeedback((s) => ({ ...s, [k]: { good: data.good || [], fix: data.fix || [] } }));
    } catch (err) {
      setFeedback((s) => ({ ...s, [k]: { error: err instanceof Error ? err.message : "Could not get feedback." } }));
    }
  }

  async function askClarification(k: string, question: string, followUp: string) {
    const text = (followUp || "").trim();
    if (text.length < 3) return;
    if (clarify[k]?.loading) return;
    setClarify((s) => ({ ...s, [k]: { ...s[k], loading: true, error: "" } }));
    try {
      const data = await apiFetch<ResumeClarifyResponse>("/api/resume/questions/clarify", { method: "POST", body: JSON.stringify({ question, followUp: text }) }, "Failed to get a clarification.");
      if (data.understood === false) {
        setClarify((s) => ({ ...s, [k]: { loading: false, error: "", understood: false, answer: data.answer, draft: text } }));
      } else {
        setClarify((s) => ({ ...s, [k]: { loading: false, error: "", askedQuestion: text, answer: data.answer, understood: true, draft: "" } }));
      }
    } catch (err) {
      setClarify((s) => ({ ...s, [k]: { ...s[k], loading: false, error: err instanceof Error ? err.message : "Could not get a clarification." } }));
    }
  }

  function reaskClarification(k: string) {
    setClarify((s) => ({ ...s, [k]: { draft: s[k]?.draft || "" } }));
  }

  async function toggleHelpful(k: string, r: ResumeQuestion, checked: boolean) {
    const prevId = helpful[k]?.id || null;
    if (checked) {
      setHelpful((s) => ({ ...s, [k]: { marked: true, saving: true, id: prevId } }));
      try {
        const data = await apiFetch<ResumeHelpfulResponse>(
          "/api/resume/questions/helpful",
          { method: "POST", body: JSON.stringify({ question: r.q, category: qMode, tag: r.tag, level: r.level }) },
          "Failed to save."
        );
        setHelpful((s) => ({ ...s, [k]: { marked: true, saving: false, id: data.id } }));
      } catch {
        setHelpful((s) => ({ ...s, [k]: { marked: false, saving: false, id: null } }));
      }
    } else {
      setHelpful((s) => ({ ...s, [k]: { marked: false, saving: false, id: null } }));
      if (prevId) {
        try {
          await apiFetch("/api/resume/questions/helpful/" + prevId, { method: "DELETE" });
        } catch {
          // ignore
        }
      }
    }
  }

  // --- story ---
  const storyFilled = STORY_FIELDS.filter((f) => (storyAnswers[f.key] || "").trim()).length;

  async function runStoryGenerate() {
    const resumeTextTrimmed = resumeText.trim();
    const focusAreas = Object.keys(storyAnswers).filter((k) => (storyAnswers[k] || "").trim()).map((k) => STORY_FOCUS_LABELS[k]).filter(Boolean);
    const fallbackResume = Object.entries(storyAnswers).filter(([, v]) => (v || "").trim()).map(([k, v]) => STORY_FOCUS_LABELS[k] + ": " + v).join("\n");
    const resume = resumeTextTrimmed.length >= 20 ? resumeTextTrimmed : fallbackResume;

    if (resume.trim().length < 20) {
      setStoryError("Add your resume on the Resume tab, or fill in more of the story fields, then try again.");
      return;
    }
    setStoryLoading(true);
    setStoryError("");
    try {
      const data = await apiFetch<StoryGenerateResponse>("/api/story/generate", { method: "POST", body: JSON.stringify({ resume, focusAreas, domain: mapDomainForRetrieval(ragDomain) }) }, "Failed to generate narratives.");
      setStoryLoading(false);
      setStoryNarratives(data.narratives);
    } catch (err) {
      setStoryLoading(false);
      setStoryError(err instanceof Error ? err.message : "Could not reach the backend.");
    }
  }

  function submitStoryModal() {
    setStoryModalOpen(false);
    setQMode("Story");
    runStoryGenerate();
  }

  // --- derived view state ---
  const fileStatus =
    uploadStatus === "uploading" ? "Uploading…" : uploadStatus === "processing" ? "Processing…" : uploadStatus === "done" ? "Ready" : uploadStatus === "error" ? "Upload failed" : "";
  const generateDisabled = uploadStatus !== "done" || resumeText.trim().length < 20 || resumeLoading;
  const generateLabel = resumeLoading ? "Generating… " + resumeGenPercent + "%" : "Generate questions";

  const currentList: ResumeQuestion[] = qMode !== "Story" ? liveResults?.[qMode as ResumeCategory] || [] : [];
  const resultsLabel = currentList.length ? "LIVE FROM BACKEND · " + qMode.toUpperCase() + " · " + currentList.length : qMode === "Story" ? "YOUR STORY · 2 VARIANTS" : "";
  const refreshVisible = qMode !== "Story" && currentList.length > 0;
  const refreshing = categoryRefreshing === qMode;

  const storyVariants = storyNarratives.map((n, i) => ({
    name: n.title || "Variant " + (i + 1),
    note: Array.isArray(n.keyThemes) && n.keyThemes.length ? n.keyThemes.join(" · ") : "",
    accent: STORY_ACCENTS[i % STORY_ACCENTS.length],
    paras: [n.story || ""]
  }));

  return (
    <>
      <PageHeader title="Resume Interrogation" subtitle="" />

      {!resumeFile && (
        <>
          <div className="section-title" style={{ marginTop: 34 }}>
            What you'll find here
          </div>
          <div className="grid-3">
            <div className="feature-card" style={{ cursor: "default" }}>
              <div className="fc-icon icon-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
                  <path d="M14 2v5a1 1 0 0 0 1 1h5" />
                  <path d="M10 9H8" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                </svg>
              </div>
              <div className="feature-title">Questions from your actual resume</div>
              <div className="feature-desc" style={{ marginBottom: 0 }}>
                Upload a PDF, DOC or DOCX - we parse what's really on the page and build questions from it, not a generic template.
              </div>
            </div>
            <div className="feature-card" style={{ cursor: "default" }}>
              <div className="fc-icon icon-purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="12" cy="12" r="1" />
                </svg>
              </div>
              <div className="feature-title">Behavioural, technical, or situational</div>
              <div className="feature-desc" style={{ marginBottom: 0 }}>
                Pick what to generate - or turn your whole resume into one coherent story for the walkthrough round.
              </div>
            </div>
            <div className="feature-card" style={{ cursor: "default" }}>
              <div className="fc-icon icon-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div className="feature-title">Answer, then get feedback</div>
              <div className="feature-desc" style={{ marginBottom: 0 }}>
                Type or speak each answer and get feedback on what worked, what to fix, and a stronger sample response.
              </div>
            </div>
          </div>
          <div className="grid-full">
            <div className="feature-card wide" style={{ cursor: "default" }}>
              <div className="fc-icon icon-amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
              </div>
              <div className="fc-body">
                <div className="feature-title">Prep track</div>
                <div className="feature-desc" style={{ marginBottom: 0 }}>
                  Pick a domain - Consulting, Product Management, or general - so the questions and evaluation match what you're actually preparing for.
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: 26, background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: 18 }}>
        <input
          type="file"
          ref={fileRef}
          onChange={(e) => {
            const f = e.target.files && e.target.files[0];
            if (f) uploadResumeFile(f);
          }}
          accept=".pdf,.doc,.docx,.txt"
          style={{ display: "none" }}
        />
        {resumeFile ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", border: "1px solid #d9f2e5", borderRadius: "var(--r-sm)", background: "var(--green-wash)" }}>
              <span style={{ flex: "none", width: 34, height: 34, borderRadius: "var(--r-sm)", background: "var(--green)", color: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 700 }}>✓</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.90625rem", fontWeight: 600, color: "var(--text-900)" }}>{resumeFile}</div>
                <div style={{ marginTop: 3, color: "var(--text-gray2)", fontSize: "0.8125rem" }}>{fileStatus}</div>
              </div>
              <button type="button" onClick={clearResume} className="unbutton link-darken" style={{ flex: "none", color: "var(--text-gray2)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}>Replace</button>
            </div>

            {uploadStatus === "uploading" && (
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 6, borderRadius: "var(--r-pill)", background: "var(--track)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: "var(--r-pill)", background: "var(--indigo)", transition: "width .2s ease", width: uploadPercent + "%" }}></div>
                </div>
                <div style={{ marginTop: 6, color: "var(--text-gray2)", fontSize: "0.78125rem" }}>Uploading… {uploadPercent}%</div>
              </div>
            )}
            {uploadStatus === "processing" && <div style={{ marginTop: 12, color: "var(--text-gray2)", fontSize: "0.78125rem" }}>Processing resume…</div>}
            {uploadStatus === "error" && <div style={{ marginTop: 12, color: "var(--red-dark)", fontSize: "0.78125rem" }}>{resumeError || "Something went wrong."}</div>}

            {uploadStatus === "done" && (
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={() => runResumeGenerate(resumeText)}
                  disabled={generateDisabled}
                  style={{ border: 0, borderRadius: "var(--r-sm)", padding: "11px 18px", font: "600 0.875rem 'Instrument Sans',sans-serif", background: uploadStatus === "done" && !resumeLoading ? "var(--green)" : "var(--track)", color: uploadStatus === "done" && !resumeLoading ? "var(--surface)" : "var(--text-muted)", cursor: uploadStatus === "done" && !resumeLoading ? "pointer" : "not-allowed" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <SparkleIcon />
                    <span>{generateLabel}</span>
                  </span>
                </button>
                <span style={{ fontSize: "0.78125rem", color: "var(--red-dark)" }}>{uploadStatus === "done" ? resumeError : ""}</span>
              </div>
            )}
          </>
        ) : (
          <div style={{ border: "1.5px dashed #d8d9e0", borderRadius: "var(--r-sm)", padding: "32px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "var(--field-bg)" }}>
            <div style={{ fontSize: "0.96875rem", fontWeight: 600, color: "var(--text-900)" }}>Add your resume</div>
            <div style={{ color: "var(--text-gray2)", fontSize: "0.84375rem", textAlign: "center" }}>PDF, DOC or DOCX. We parse it and build questions from what is actually on the page.</div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button onClick={() => fileRef.current?.click()} className="btn-primary-darken" style={{ border: 0, cursor: "pointer", background: "var(--indigo)", color: "var(--surface)", font: "600 0.875rem 'Instrument Sans',sans-serif", padding: "11px 18px", borderRadius: "var(--r-sm)", boxShadow: "0 1px 2px rgba(22,86,217,.4)" }}>Choose from device</button>
              <button onClick={uploadFromGoogleDrive} className="btn-outline-indigo" style={{ border: "1px solid #e0e1e6", cursor: "pointer", background: "var(--surface)", color: "var(--text-700)", font: "600 0.875rem 'Instrument Sans',sans-serif", padding: "11px 18px", borderRadius: "var(--r-sm)" }}>Google Drive</button>
            </div>
          </div>
        )}

        <div style={{ borderTop: "1px solid #f1f2f5", paddingTop: 16, marginTop: 18 }}>
          <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Prep track</div>
          <select
            value={ragDomain}
            onChange={(e) => setRagDomain(e.target.value)}
            style={{ marginTop: 8, border: "1px solid #e0e1e6", borderRadius: "var(--r-sm)", padding: "9px 12px", outline: "none", fontSize: "0.84375rem", color: "var(--text-900)", background: "var(--field-bg)", cursor: "pointer" }}
          >
            {RAG_DOMAIN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div style={{ marginTop: 14, color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>What should we generate</div>
          <div style={{ display: "flex", flexWrap: "nowrap", gap: 8, marginTop: 12 }}>
            {(["Behavioural", "Technical", "Situational"] as ResumeCategory[]).map((m) => {
              const on = qMode === m;
              return (
                <button key={m} onClick={() => setQMode(m)} className="btn-border-indigo" style={{ border: "1px solid " + (on ? "var(--indigo)" : "var(--border-strong)"), borderRadius: "var(--r-sm)", padding: "11px 16px", cursor: "pointer", font: "600 0.875rem 'Instrument Sans',sans-serif", color: on ? "var(--surface)" : "var(--text-700)", background: on ? "var(--indigo)" : "var(--surface)" }}>
                  {m} Questions
                </button>
              );
            })}
            <button onClick={() => setStoryModalOpen(true)} className="btn-border-green" style={{ border: "1px solid " + (qMode === "Story" ? "var(--green)" : "var(--border-strong)"), borderRadius: "var(--r-sm)", padding: "11px 16px", cursor: "pointer", font: "600 0.875rem 'Instrument Sans',sans-serif", color: qMode === "Story" ? "var(--surface)" : "var(--text-700)", background: qMode === "Story" ? "var(--green)" : "var(--surface)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <SparkleIcon />
                <span>Create a coherent story</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ margin: "38px 0 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, letterSpacing: ".1em", color: "var(--text-gray2)" }}>{resultsLabel}</h2>
        </div>
        {refreshVisible && (
          <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => refreshCategory(qMode)} disabled={refreshing} className="btn-outline-indigo" style={{ border: "1px solid #e0e1e6", borderRadius: "var(--r-sm)", padding: "10px 16px", font: "600 0.84375rem 'Instrument Sans',sans-serif", cursor: "pointer", background: "var(--surface)", color: "var(--text-700)" }}>
              {refreshing ? "↻ Refreshing… " + categoryRefreshPercent + "%" : "↻ Refresh these " + qMode.toLowerCase() + " questions"}
            </button>
            <span style={{ fontSize: "0.78125rem", color: "var(--red-dark)" }}>{categoryRefreshError}</span>
          </div>
        )}
      </div>

      {qMode === "Story" && (
        <>
          {storyLoading && <div style={{ color: "var(--text-gray2)", fontSize: "0.84375rem", padding: "8px 0 20px" }}>Writing your story from your resume…</div>}
          {storyError && <div style={{ color: "var(--red-dark)", fontSize: "0.8125rem", marginBottom: 12 }}>{storyError}</div>}
          {storyVariants.length > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button type="button" className="unbutton" onClick={runStoryGenerate} style={{ color: "var(--indigo)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}>↻ Regenerate</button>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {storyVariants.map((v, i) => (
              <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "22px 24px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, borderBottom: "1px solid #f1f2f5", paddingBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: "0.96875rem", fontWeight: 700, color: "var(--text-900)" }}>{v.name}</div>
                    <div style={{ marginTop: 4, color: "var(--text-gray2)", fontSize: "0.84375rem" }}>{v.note}</div>
                  </div>
                  <span style={{ flex: "none", color: "var(--indigo)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}>Copy</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 15 }}>
                  {v.paras.map((p, j) => (
                    <p key={j} style={{ margin: 0, fontSize: "0.96875rem", lineHeight: 1.65, color: "var(--text-900)" }}>{p}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {currentList.map((r, i) => {
          const k = qMode + "-" + i;
          return (
            <ResultCard
              key={k}
              k={k}
              r={r}
              isSituational={qMode === "Situational"}
              answer={answers[k] || ""}
              onAnswerChange={(v) => setAnswers((s) => ({ ...s, [k]: v }))}
              open={!!answerOpen[k]}
              toggleOpen={() => setAnswerOpen((s) => ({ ...s, [k]: !s[k] }))}
              fb={feedback[k]}
              onGetFeedback={(text) => runFeedback(k, r.q, text)}
              h={helpful[k]}
              onToggleHelpful={(checked) => toggleHelpful(k, r, checked)}
              cl={clarify[k]}
              onClarifyDraftChange={(v) => setClarify((s) => ({ ...s, [k]: { ...s[k], draft: v } }))}
              onAskClarify={() => askClarification(k, r.q, clarify[k]?.draft || "")}
              onReaskClarify={() => reaskClarification(k)}
              recording={!!recording[k]}
              micError={micError[k] || ""}
              onToggleMic={() => (recording[k] ? stopRecording(k) : startRecording(k, () => answers[k] || "", (text) => setAnswers((s) => ({ ...s, [k]: text }))))}
              clarifyRecording={!!recording[k + "__clarify"]}
              clarifyMicError={micError[k + "__clarify"] || ""}
              onToggleClarifyMic={() =>
                recording[k + "__clarify"]
                  ? stopRecording(k + "__clarify")
                  : startRecording(k + "__clarify", () => clarify[k]?.draft || "", (text) => setClarify((s) => ({ ...s, [k]: { ...s[k], draft: text } })))
              }
            />
          );
        })}
      </div>

      {storyModalRendered && createPortal(
        <div
          className={storyModalExiting ? "t-scrim-out" : "t-scrim-in"}
          onClick={(e) => { if (e.target === e.currentTarget) setStoryModalOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(17,20,45,.55)", zIndex: 50, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 20px", overflow: "auto" }}
        >
          <div role="dialog" aria-modal="true" aria-label="Your journey, 10th to now" className={storyModalExiting ? "t-panel-out" : "t-panel-in"} style={{ width: "100%", maxWidth: 620, background: "var(--surface)", borderRadius: "var(--r-md)", boxShadow: "0 24px 60px rgba(16,24,40,.28)" }}>
            <div style={{ padding: "24px 26px 18px", borderBottom: "1px solid #f1f2f5", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.3125rem", fontWeight: 700, letterSpacing: "-.015em", color: "var(--text-900)" }}>Your journey, 10th to now</h2>
                <p style={{ margin: "7px 0 0", color: "var(--text-gray2)", fontSize: "0.875rem" }}>Answer in plain sentences. We combine this with your uploaded resume to build two story variants.</p>
              </div>
              <button type="button" onClick={() => setStoryModalOpen(false)} aria-label="Close" className="unbutton link-darken probe-close" style={{ flex: "none", color: "var(--text-lightgray)", fontSize: "1.25rem", cursor: "pointer", lineHeight: 1, padding: "2px 6px" }}>×</button>
            </div>
            <div style={{ padding: "20px 26px", display: "flex", flexDirection: "column", gap: 18, maxHeight: "54vh", overflow: "auto" }}>
              {STORY_FIELDS.map((f) => (
                <div key={f.key}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-900)" }}>{f.label}</div>
                  <div style={{ marginTop: 3, color: "var(--text-lightgray)", fontSize: "0.78125rem" }}>{f.hint}</div>
                  <textarea
                    value={storyAnswers[f.key] || ""}
                    onChange={(e) => setStoryAnswers((s) => ({ ...s, [f.key]: e.target.value }))}
                    style={{ marginTop: 9, width: "100%", height: 74, resize: "vertical", border: "1px solid #e0e1e6", borderRadius: "var(--r-sm)", padding: "11px 13px", outline: "none", fontSize: "0.90625rem", lineHeight: 1.55, color: "var(--text-900)", background: "var(--field-bg)" }}
                  />
                </div>
              ))}
            </div>
            <div style={{ padding: "16px 26px 20px", borderTop: "1px solid #f1f2f5", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <span style={{ color: "var(--text-lightgray)", fontSize: "0.8125rem", fontFamily: "'JetBrains Mono',monospace" }}>{storyFilled} of 5 answered</span>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStoryModalOpen(false)} className="btn-outline-indigo" style={{ border: "1px solid #e0e1e6", background: "var(--surface)", color: "var(--text-700)", font: "600 0.90625rem 'Instrument Sans',sans-serif", padding: "12px 18px", borderRadius: "var(--r-sm)", cursor: "pointer" }}>Cancel</button>
                <button
                  onClick={submitStoryModal}
                  disabled={storyFilled === 0}
                  style={{ border: 0, borderRadius: "var(--r-sm)", padding: "12px 20px", font: "600 0.90625rem 'Instrument Sans',sans-serif", cursor: storyFilled === 0 ? "default" : "pointer", color: storyFilled === 0 ? "var(--text-lightgray)" : "var(--surface)", background: storyFilled === 0 ? "var(--surface-sunken)" : "var(--green)" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <SparkleIcon />
                    <span>Build my two stories</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

interface ResultCardProps {
  k: string;
  r: ResumeQuestion;
  isSituational: boolean;
  answer: string;
  onAnswerChange: (v: string) => void;
  open: boolean;
  toggleOpen: () => void;
  fb?: FeedbackState;
  onGetFeedback: (text: string) => void;
  h?: HelpfulState;
  onToggleHelpful: (checked: boolean) => void;
  cl?: ClarifyState;
  onClarifyDraftChange: (v: string) => void;
  onAskClarify: () => void;
  onReaskClarify: () => void;
  recording: boolean;
  micError: string;
  onToggleMic: () => void;
  clarifyRecording: boolean;
  clarifyMicError: string;
  onToggleClarifyMic: () => void;
}

function ResultCard({
  r, isSituational, answer, onAnswerChange, open, toggleOpen, fb, onGetFeedback, h, onToggleHelpful,
  cl, onClarifyDraftChange, onAskClarify, onReaskClarify, recording, micError, onToggleMic,
  clarifyRecording, clarifyMicError, onToggleClarifyMic
}: ResultCardProps) {
  const loading = !!fb?.loading;
  const clarifyAsked = !!cl?.askedQuestion;
  const clarifyMisunderstood = cl?.understood === false;
  const clarifyPending = isSituational && !clarifyAsked && !clarifyMisunderstood;
  const answerLabel = open ? "Hide answer" : answer ? "Edit your answer" : "Answer this";
  const submitActive = !!answer.trim() && !loading;

  return (
    <div className="result-card" style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderLeft: "3px solid var(--indigo)", borderRadius: "var(--r-sm)", boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "17px 19px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <p style={{ margin: 0, flex: 1, fontSize: "0.96875rem", lineHeight: 1.5, color: "var(--text-900)" }}>{r.q}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
          <span title="Copy question" className="copy-icon" style={{ cursor: "pointer", fontSize: "0.875rem", opacity: 0.45 }}>📋</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
        <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: "var(--r-sm)", background: "var(--surface-sunken)", color: "var(--text-600)", fontSize: "0.71875rem", fontWeight: 500, fontFamily: "'JetBrains Mono',monospace" }}>{r.tag}</span>
        <button type="button" onClick={toggleOpen} className="unbutton link-indigo-dark" style={{ color: "var(--indigo)", fontSize: "0.78125rem", fontWeight: 600, cursor: "pointer" }}>{answerLabel}</button>
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", color: "var(--text-gray2)", fontSize: "0.78125rem", cursor: "pointer", userSelect: "none" }}>
          <button
            type="button"
            className="t-check"
            role="checkbox"
            aria-checked={!!h?.marked}
            disabled={h?.saving}
            onClick={() => onToggleHelpful(!h?.marked)}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none", width: 16, height: 16, padding: 0, border: "1px solid " + (h?.marked ? "var(--green)" : "#d1d5db"), borderRadius: "var(--r-xs)", background: h?.marked ? "var(--green)" : "var(--surface)", cursor: "pointer" }}
          >
            <svg viewBox="0 0 10.1668 10.1668" width="9" height="9" style={{ display: "block" }}>
              <path d="M1 5.52L3.92 9.17L9.17 1" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          Helpful
        </label>
      </div>

      {open && (
        <div style={{ marginTop: 14, borderTop: "1px solid #f1f2f5", paddingTop: 14 }}>
          {isSituational && (
            <>
              {clarifyAsked && (
                <div style={{ marginBottom: 12, background: "var(--surface-alt)", border: "1px solid #eceef2", borderRadius: "var(--r-sm)", padding: "12px 14px" }}>
                  <div style={{ fontSize: "0.78125rem", fontWeight: 600, color: "var(--indigo)" }}>You asked: {cl?.askedQuestion}</div>
                  <div style={{ marginTop: 6, fontSize: "0.84375rem", lineHeight: 1.5, color: "var(--text-700)" }}>{cl?.answer}</div>
                </div>
              )}
              {clarifyMisunderstood && (
                <div style={{ marginBottom: 12, background: "var(--red-wash)", border: "1px solid #f6dede", borderRadius: "var(--r-sm)", padding: "12px 14px" }}>
                  <div style={{ fontSize: "0.84375rem", lineHeight: 1.5, color: "var(--red-ink)" }}>{cl?.answer}</div>
                  <button type="button" onClick={onReaskClarify} className="unbutton link-indigo-dark" style={{ display: "inline-block", marginTop: 8, color: "var(--indigo)", fontSize: "0.78125rem", fontWeight: 600, cursor: "pointer" }}>↻ Re-ask</button>
                </div>
              )}
              {clarifyPending && (
                <>
                  <input
                    type="text"
                    value={cl?.draft || ""}
                    onChange={(e) => onClarifyDraftChange(e.target.value)}
                    placeholder="Ask the interviewer one clarifying question before you answer…"
                    style={{ width: "100%", border: "1px solid #e0e1e6", borderRadius: "var(--r-sm)", padding: "9px 12px", outline: "none", fontSize: "0.84375rem", color: "var(--text-900)", background: "var(--field-bg)" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 9, marginBottom: 12 }}>
                    <VoiceRecordButton recording={clarifyRecording} onClick={onToggleClarifyMic} />
                    <button onClick={onAskClarify} disabled={!(cl?.draft || "").trim() || !!cl?.loading} className="btn-outline-indigo" style={{ border: "1px solid #e0e1e6", borderRadius: "var(--r-sm)", padding: "9px 14px", font: "600 0.8125rem 'Instrument Sans',sans-serif", cursor: "pointer", background: "var(--surface)", color: "var(--text-700)" }}>
                      {cl?.loading ? "Asking…" : "Ask"}
                    </button>
                    <span style={{ fontSize: "0.78125rem", color: "var(--red-dark)" }}>{clarifyMicError}</span>
                  </div>
                  {cl?.error && <div style={{ marginBottom: 12, fontSize: "0.78125rem", color: "var(--red-dark)" }}>{cl.error}</div>}
                </>
              )}
            </>
          )}

          <textarea
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Type your answer, or record it and we will transcribe."
            style={{ width: "100%", height: 96, resize: "vertical", border: "1px solid #e0e1e6", borderRadius: "var(--r-sm)", padding: "11px 13px", outline: "none", fontSize: "0.90625rem", lineHeight: 1.55, color: "var(--text-900)", background: "var(--field-bg)" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 11 }}>
            <VoiceRecordButton recording={recording} onClick={onToggleMic} />
            <button
              onClick={() => onGetFeedback(answer)}
              disabled={!answer.trim() || loading}
              style={{ border: 0, borderRadius: "var(--r-sm)", padding: "9px 16px", font: "600 0.84375rem 'Instrument Sans',sans-serif", cursor: submitActive ? "pointer" : "default", color: submitActive ? "var(--surface)" : "var(--text-lightgray)", background: submitActive ? "var(--indigo)" : "var(--surface-sunken)" }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <SparkleIcon />
                <span>{loading ? "Thinking…" : "Get feedback"}</span>
              </span>
            </button>
            <span style={{ fontSize: "0.78125rem", color: "var(--red-dark)" }}>{micError}{fb?.error || ""}</span>
          </div>

          {loading && <div style={{ marginTop: 14, color: "var(--text-gray2)", fontSize: "0.78125rem" }}>Reading your answer and thinking it through - this is blunt, not scripted, so it takes a moment…</div>}

          {!!fb?.good && (
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
              <div style={{ border: "1px solid #d9f2e5", background: "var(--green-wash)", borderRadius: "var(--r-sm)", padding: "14px 16px" }}>
                <div style={{ color: "var(--green)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 700 }}>What worked</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                  {fb.good.map((g, i) => (
                    <div key={i} style={{ fontSize: "0.84375rem", lineHeight: 1.5, color: "var(--green-ink)" }}>{g}</div>
                  ))}
                </div>
              </div>
              <div style={{ border: "1px solid #f6dede", background: "var(--red-wash)", borderRadius: "var(--r-sm)", padding: "14px 16px" }}>
                <div style={{ color: "var(--red-dark)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 700 }}>What to fix</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                  {(fb.fix || []).map((fx, i) => (
                    <div key={i} style={{ fontSize: "0.84375rem", lineHeight: 1.5, color: "var(--red-ink)" }}>{fx}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

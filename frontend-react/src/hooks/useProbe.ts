import { useState, type ChangeEvent, type CSSProperties, type KeyboardEvent } from "react";
import { callClaude, fetchChipPanel } from "../lib/apiClient";
import { howPrompt, plain, pushPrompt, whatPrompt, whyPrompt } from "../lib/prompts";
import type { GuesstimateCitation } from "../types/api";

// "Push-back chat" - ported from frontend/index.html: probeFor() (3135-3171),
// openProbe/runWhy/sendPushback/retryProbe (3070-3133). Only one probe can
// be open at a time (matches the source exactly - state.probe was a single
// global slice), scoped per-page here since only the Role page uses this
// pattern.
//
// What?/Why?/How to apply panels are server-cached now (Phase 1 amendment
// D - see chipPanel.js), keyed by (role, topic, blockId, mode) with no
// company in the key, since those three are company-agnostic content
// (rule 3). The old client-only localStorage cache (PROBE_CACHE_KEY) is
// retired along with that - a stale copy of it in an existing browser is
// removed once below rather than left to linger unused.
try {
  localStorage.removeItem("pmh.probeCache");
} catch {
  // ignore - private browsing / blocked storage
}

export type ProbeMode = "what" | "why" | "how" | "pushback";

interface ProbeMessage {
  who: "ai" | "me";
  text: string;
}

interface ContentCheckResult {
  checked: boolean;
  passed: boolean;
  issue: string;
}

interface ProbeState {
  blockId: string;
  blockText: string;
  mode: ProbeMode;
  role: string;
  topic: string;
  company: string;
  messages: ProbeMessage[];
  loading: boolean;
  error: string;
  draft: string;
  contentCheck: ContentCheckResult | null;
  // R7 (backend-only until R8)/R8: only set for what/why/how (chipPanel.js); pushback
  // (chat.js) is explicitly ungrounded, so this stays null there - never implied.
  groundedInCasebooks: boolean | null;
  citation: GuesstimateCitation | null;
}

export interface ProbeVM {
  show: boolean;
  open: boolean;
  closed: boolean;
  what: () => void;
  why: () => void;
  how: () => void;
  push: () => void;
  title: string;
  context: string;
  quote: string;
  messages: { text: string; who: string; style: CSSProperties }[];
  loading: boolean;
  hasError: boolean;
  error: string;
  contentCheckNotice: string;
  // null (not false) for pushback, where grounding never applies - distinct from
  // "checked and came back ungrounded" (false). See GroundingNote.tsx.
  groundedInCasebooks: boolean | null;
  citation: GuesstimateCitation | null;
  showInput: boolean;
  placeholder: string;
  draft: string;
  onDraft: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  send: () => void;
  retry: () => void;
  close: () => void;
}

export function useProbe() {
  const [probe, setProbe] = useState<ProbeState | null>(null);

  async function runWhy(role: string, topic: string, blockId: string, blockText: string, mode: "what" | "why" | "how") {
    try {
      const promptText =
        mode === "how" ? howPrompt(role, topic, blockText) :
        mode === "what" ? whatPrompt(role, topic, blockText) :
        whyPrompt(role, topic, blockText);
      const res = await fetchChipPanel(role, topic, blockId, mode, promptText);
      setProbe((s) => (s ? {
        ...s, loading: false, error: "", messages: [{ who: "ai", text: res.text }], contentCheck: res.contentCheck,
        groundedInCasebooks: res.groundedInCasebooks ?? false, citation: res.citation ?? null
      } : s));
    } catch {
      setProbe((s) => (s ? { ...s, loading: false, error: "Could not reach the model." } : s));
    }
  }

  function openProbe(role: string, topic: string, blockId: string, blockText: string, mode: ProbeMode, company: string) {
    const base: ProbeState = { blockId, blockText, mode, role, topic, company, messages: [], loading: false, error: "", draft: "", contentCheck: null, groundedInCasebooks: null, citation: null };
    if (mode !== "pushback") {
      setProbe({ ...base, loading: true });
      runWhy(role, topic, blockId, blockText, mode);
      return;
    }
    setProbe(base);
  }

  async function sendPushback(overrideText?: string) {
    const p = probe;
    if (!p) return;
    const userText = (overrideText ?? p.draft).trim();
    if (!userText || p.loading) return;
    const firstUser = !p.messages.some((m) => m.who === "me");
    const initialAnswer = p.messages[0]?.text || "";
    const history = p.messages.map((m) => ({ role: m.who === "ai" ? "assistant" : "user", content: m.text }));
    const messages: ProbeMessage[] = [...p.messages, { who: "me", text: userText }];
    setProbe((s) => (s ? { ...s, messages, draft: "", loading: true, error: "" } : s));
    try {
      // The first cross-question in a thread goes out as ONE self-contained
      // message with the initial answer embedded and explicitly attributed
      // (see pushPrompt) rather than appended as network history - sending it
      // as a second turn made backend/src/routes/chat.js's multi-turn path
      // relabel the conversation "Interviewer:"/"Candidate:" by role, which
      // buried this function's own meta-instructions inside a line literally
      // prefixed "Candidate:" and made the model treat instructional text as
      // something the candidate had said (confirmed root cause of the
      // attribution bugs an external eval of 18 transcripts flagged - see
      // crossquestion-eval.md). Later turns in the same thread are genuine
      // back-and-forth (real AI replies, real user text), so the history-
      // based multi-turn path is correct for those and stays as-is.
      // pushback keeps company grounding (Phase 1 rule 3 only exempts the
      // What/Why/How panels above, not a user's own free-form follow-up)
      // and stays uncached - cross-question replies are per-user, per-
      // thread, never shared.
      const text = firstUser
        ? await callClaude([{ role: "user", content: pushPrompt(p.role, p.topic, p.blockText, initialAnswer, userText, p.company) }])
        : await callClaude([...history, { role: "user", content: userText }]);
      setProbe((s) => (s ? { ...s, loading: false, messages: [...s.messages, { who: "ai", text }] } : s));
    } catch {
      setProbe((s) => (s ? { ...s, loading: false, error: "Could not reach the model." } : s));
    }
  }

  function retryProbe() {
    const p = probe;
    if (!p) return;
    if (p.mode !== "pushback") {
      setProbe((s) => (s ? { ...s, loading: true, error: "" } : s));
      runWhy(p.role, p.topic, p.blockId, p.blockText, p.mode as "what" | "why" | "how");
      return;
    }
    const last = [...p.messages].reverse().find((m) => m.who === "me");
    if (!last) {
      setProbe((s) => (s ? { ...s, error: "" } : s));
      return;
    }
    setProbe((s) => (s ? { ...s, messages: s.messages.filter((m) => m !== last), error: "" } : s));
    sendPushback(last.text);
  }

  function probeFor(role: string, topic: string, blockId: string, blockText: string, company = ""): ProbeVM {
    const p = probe;
    const open = !!(p && p.blockId === blockId);
    const base = {
      show: !!(blockText && blockText.trim()),
      what: () => openProbe(role, topic, blockId, blockText, "what", company),
      why: () => openProbe(role, topic, blockId, blockText, "why", company),
      how: () => openProbe(role, topic, blockId, blockText, "how", company),
      push: () => openProbe(role, topic, blockId, blockText, "pushback", company),
      open,
      closed: !open
    };
    if (!open || !p) {
      return {
        ...base, messages: [], loading: false, error: "", hasError: false, showInput: false, title: "", draft: "", context: "", quote: "", contentCheckNotice: "",
        groundedInCasebooks: null, citation: null,
        onDraft: () => {}, onKeyDown: () => {}, send: () => {}, retry: () => {}, close: () => {}, placeholder: ""
      };
    }
    return {
      ...base,
      title: (p.mode === "what" ? "What this means" : p.mode === "why" ? "Why this matters" : p.mode === "how" ? "How to apply it" : "Push back") + " · " + p.topic,
      context: p.role + " · " + p.topic,
      quote: p.blockText,
      messages: p.messages.map((m) => ({
        text: m.who === "ai" ? plain(m.text) : m.text,
        who: m.who === "ai" ? "Interviewer" : "You",
        style: {
          borderRadius: "var(--r-sm)", padding: "11px 13px", fontSize: "0.84375rem", lineHeight: 1.6, whiteSpace: "pre-wrap" as const,
          ...(m.who === "ai" ? { background: "var(--surface-sunken)", color: "var(--text-900)", border: "1px solid var(--border-soft)" } : { background: "var(--indigo-700)", color: "var(--surface)", alignSelf: "flex-end" as const, maxWidth: "88%" })
        }
      })),
      loading: p.loading,
      hasError: !!p.error,
      error: p.error,
      // Phase 1.5: shown when the content check (5 flags, always run - not
      // digit-gated) still failed after one regeneration attempt - never
      // shown otherwise. Phase 1.7 item 4: an empty issue means the check
      // failed twice with nothing to target a repair at (a likely false
      // flag) - shown plainly rather than implying a specific, known
      // problem the default message does.
      contentCheckNotice: p.contentCheck && p.contentCheck.checked && !p.contentCheck.passed
        ? (p.contentCheck.issue ? "This answer could not be fully verified. Check before relying on it." : "Automated check flagged this content.")
        : "",
      groundedInCasebooks: p.groundedInCasebooks,
      citation: p.citation,
      showInput: !p.loading && (p.mode === "pushback" || p.messages.length > 0),
      placeholder: p.messages.some((m) => m.who === "me") ? "Respond..." : "Cross-question this answer...",
      draft: p.draft,
      onDraft: (e: ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        setProbe((s) => (s ? { ...s, draft: v } : s));
      },
      onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          sendPushback();
        }
      },
      send: () => sendPushback(),
      retry: () => retryProbe(),
      close: () => setProbe(null)
    };
  }

  return { probeFor };
}

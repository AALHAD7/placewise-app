import { useState, type ChangeEvent, type CSSProperties, type KeyboardEvent } from "react";
import { callClaude } from "../lib/apiClient";
import { howPrompt, plain, pushPrompt, whatPrompt, whyPrompt } from "../lib/prompts";

// "Push-back chat" - ported from frontend/index.html: probeFor() (3135-3171),
// openProbe/runWhy/sendPushback/retryProbe (3070-3133), probeCache/cacheProbe
// (2972-2988). Only one probe can be open at a time (matches the source
// exactly - state.probe was a single global slice), scoped per-page here
// since only the Role page uses this pattern.

export type ProbeMode = "what" | "why" | "how" | "pushback";

interface ProbeMessage {
  who: "ai" | "me";
  text: string;
}

interface ProbeState {
  blockId: string;
  blockText: string;
  mode: ProbeMode;
  key: string;
  role: string;
  topic: string;
  messages: ProbeMessage[];
  loading: boolean;
  error: string;
  draft: string;
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
  showInput: boolean;
  placeholder: string;
  draft: string;
  onDraft: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  send: () => void;
  retry: () => void;
  close: () => void;
}

const PROBE_CACHE_KEY = "pmh.probeCache";

function readProbeCache(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PROBE_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeProbeCache(key: string, text: string): void {
  try {
    const own = readProbeCache();
    own[key] = text;
    localStorage.setItem(PROBE_CACHE_KEY, JSON.stringify(own));
  } catch {
    // ignore
  }
}

export function useProbe() {
  const [probe, setProbe] = useState<ProbeState | null>(null);

  async function runWhy(key: string, role: string, topic: string, blockText: string, mode: ProbeMode) {
    try {
      const prompt = mode === "how" ? howPrompt(role, topic, blockText) : mode === "what" ? whatPrompt(role, topic, blockText) : whyPrompt(role, topic, blockText);
      const text = await callClaude([{ role: "user", content: prompt }]);
      writeProbeCache(key, text);
      setProbe((s) => (s ? { ...s, loading: false, error: "", messages: [{ who: "ai", text }] } : s));
    } catch {
      setProbe((s) => (s ? { ...s, loading: false, error: "Could not reach the model." } : s));
    }
  }

  function openProbe(role: string, topic: string, blockId: string, blockText: string, mode: ProbeMode) {
    const key = topic + "|" + blockId + "|" + mode;
    const cached = readProbeCache()[key];
    const base: ProbeState = { blockId, blockText, mode, key, role, topic, messages: [], loading: false, error: "", draft: "" };
    if (mode !== "pushback") {
      if (cached) {
        setProbe({ ...base, messages: [{ who: "ai", text: cached }] });
        return;
      }
      setProbe({ ...base, loading: true });
      runWhy(key, role, topic, blockText, mode);
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
    const first = p.mode === "pushback" && p.messages.length === 0;
    const history = p.messages.map((m) => ({ role: m.who === "ai" ? "assistant" : "user", content: m.text }));
    const content = firstUser ? pushPrompt(p.role, p.topic, p.blockText, userText) : userText;
    const messages: ProbeMessage[] = [...p.messages, { who: "me", text: userText }];
    setProbe((s) => (s ? { ...s, messages, draft: "", loading: true, error: "" } : s));
    try {
      const text = await callClaude([...history, { role: "user", content }]);
      if (first) writeProbeCache(p.key, text);
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
      runWhy(p.key, p.role, p.topic, p.blockText, p.mode);
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

  function probeFor(role: string, topic: string, blockId: string, blockText: string): ProbeVM {
    const p = probe;
    const open = !!(p && p.blockId === blockId);
    const base = {
      show: !!(blockText && blockText.trim()),
      what: () => openProbe(role, topic, blockId, blockText, "what"),
      why: () => openProbe(role, topic, blockId, blockText, "why"),
      how: () => openProbe(role, topic, blockId, blockText, "how"),
      push: () => openProbe(role, topic, blockId, blockText, "pushback"),
      open,
      closed: !open
    };
    if (!open || !p) {
      return {
        ...base, messages: [], loading: false, error: "", hasError: false, showInput: false, title: "", draft: "", context: "", quote: "",
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
          borderRadius: 9, padding: "11px 13px", fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap" as const,
          ...(m.who === "ai" ? { background: "#f6f6fb", color: "#111827" } : { background: "#4338CA", color: "#fff", alignSelf: "flex-end" as const, maxWidth: "88%" })
        }
      })),
      loading: p.loading,
      hasError: !!p.error,
      error: p.error,
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

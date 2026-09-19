import { useRef, useState } from "react";
import { API_BASE, getAuthToken } from "../lib/apiClient";

// Ported from frontend/index.html: startRecording()/stopRecording()
// (2345-2438). Dual transcription path, both real: MediaRecorder captures
// actual audio and POSTs to /api/transcribe on stop for the authoritative
// transcript; SpeechRecognition runs live in parallel purely for instant
// on-screen preview while still recording (non-authoritative - its errors
// are silently ignored, the transcribe-on-stop result always wins). A
// generation counter per recKey guards against a stale transcription
// landing after a newer recording already started for the same slot.
//
// MediaRecorder/SpeechRecognition instances are kept in refs, not state -
// they're not serializable and don't need to trigger renders themselves
// (see frontend/index.html:1979 for the original class-field version of
// this same reasoning).
//
// Each page supplies recKey (its own field-specific naming scheme),
// getBaseText (what to prefix the transcript with, e.g. existing typed
// text), and onTranscript (where the combined text goes) per call - this
// lets one hook instance serve multiple destinations (e.g. Resume's plain
// answer vs its clarify draft) the same way state.recording/_recordGen were
// a shared flat map in the old app.

export function useVoiceRecording() {
  const recordersRef = useRef<Record<string, MediaRecorder>>({});
  const recognizersRef = useRef<Record<string, SpeechRecognition>>({});
  const genRef = useRef<Record<string, number>>({});
  const [recording, setRecording] = useState<Record<string, boolean>>({});
  const [micError, setMicError] = useState<Record<string, string>>({});

  async function startRecording(recKey: string, getBaseText: () => string, onTranscript: (text: string) => void) {
    setMicError((s) => ({ ...s, [recKey]: "" }));
    const baseText = getBaseText().trim();
    genRef.current[recKey] = (genRef.current[recKey] || 0) + 1;
    const myGen = genRef.current[recKey];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recognizersRef.current[recKey]) {
          try {
            recognizersRef.current[recKey].stop();
          } catch {
            // ignore
          }
          delete recognizersRef.current[recKey];
        }
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunks, { type: mimeType });
        try {
          const token = await getAuthToken();
          const form = new FormData();
          form.append("audio", blob, "answer." + (mimeType.split("/")[1] || "webm").split(";")[0]);
          const res = await fetch(API_BASE + "/api/transcribe", { method: "POST", headers: { Authorization: "Bearer " + token }, body: form });
          const data = await res.json();
          if (!res.ok || !data.text) throw new Error(data.error || "Transcription failed.");
          if (genRef.current[recKey] !== myGen) return; // a newer recording started before this landed - drop it
          onTranscript((baseText ? baseText + " " : "") + data.text);
        } catch (err) {
          if (genRef.current[recKey] !== myGen) return;
          setMicError((s) => ({ ...s, [recKey]: err instanceof Error ? err.message : "Could not transcribe that recording." }));
        }
      };
      recordersRef.current[recKey] = recorder;
      recorder.start();

      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        const recognizer = new SR();
        recognizer.continuous = true;
        recognizer.interimResults = true;
        recognizer.lang = "en-IN";
        recognizer.onresult = (e) => {
          let liveText = "";
          for (let i = 0; i < e.results.length; i++) liveText += e.results[i][0].transcript;
          onTranscript((baseText ? baseText + " " : "") + liveText.trim());
        };
        recognizer.onerror = () => {}; // non-fatal - the transcribe-on-stop result is the source of truth regardless
        recognizersRef.current[recKey] = recognizer;
        recognizer.start();
      }

      setRecording((s) => ({ ...s, [recKey]: true }));
    } catch {
      setMicError((s) => ({ ...s, [recKey]: "Microphone permission denied or unavailable." }));
    }
  }

  function stopRecording(recKey: string) {
    const rec = recordersRef.current[recKey];
    if (rec && rec.state !== "inactive") rec.stop(); // triggers recorder.onstop, which also stops the recognizer and starts transcription
    setRecording((s) => ({ ...s, [recKey]: false }));
  }

  return { recording, micError, startRecording, stopRecording };
}

// Ported from the repeated mic-toggle button pattern in frontend/index.html
// (e.g. mockPanel()'s micStyle/micLabel, 2647-2649) - used by Mock Interview
// and Resume (and, in a later phase, Skill).

interface VoiceRecordButtonProps {
  recording: boolean;
  onClick: () => void;
}

export default function VoiceRecordButton({ recording, onClick }: VoiceRecordButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "1px solid " + (recording ? "var(--red)" : "var(--border-strong)"),
        background: recording ? "#fef2f2" : "var(--surface)",
        color: recording ? "var(--red)" : "var(--text-700)",
        borderRadius: "var(--r-sm)",
        padding: "9px 14px",
        font: "600 0.84375rem 'Instrument Sans',sans-serif",
        cursor: "pointer"
      }}
    >
      {recording ? "◼ Stop recording" : "◉ Speak instead"}
    </button>
  );
}

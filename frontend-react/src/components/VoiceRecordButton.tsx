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
        border: "1px solid " + (recording ? "#dc2626" : "#e0e1e6"),
        background: recording ? "#fef2f2" : "#fff",
        color: recording ? "#dc2626" : "#374151",
        borderRadius: 9,
        padding: "9px 14px",
        font: "600 13.5px 'Instrument Sans',sans-serif",
        cursor: "pointer"
      }}
    >
      {recording ? "◼ Stop recording" : "◉ Speak instead"}
    </button>
  );
}

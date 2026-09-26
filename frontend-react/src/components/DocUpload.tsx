import { useRef } from "react";

export type DocUploadStatus = "idle" | "uploading" | "processing" | "done" | "error";

interface DocUploadProps {
  name: string;
  label: string;
  required?: boolean;
  fileName: string;
  status: DocUploadStatus;
  percent: number;
  error: string;
  onFile: (file: File) => void;
  onClear: () => void;
}

// Compact file-upload widget (file input -> /api/resume/upload -> extracted
// text) - same upload mechanics as ResumePage's resume uploader
// (apiUploadWithProgress, same backend endpoint, since parsing "a document
// into text" is identical work whether the document is a resume or a job
// description) but without ResumePage's caching/Google-Drive-picker
// complexity, which only that page's own flow needs.
export default function DocUpload({ name, label, required, fileName, status, percent, error, onFile, onClear }: DocUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div style={{ fontSize: "0.78125rem", fontWeight: 600, color: "var(--text-700)" }}>
        {label}
        {required && <span style={{ color: "var(--red-dark)" }}> *</span>}
      </div>
      <input
        type="file"
        name={name}
        id={"doc-upload-" + name}
        ref={fileRef}
        onChange={(e) => {
          const f = e.target.files && e.target.files[0];
          if (f) onFile(f);
        }}
        accept=".pdf,.docx,.txt"
        style={{ display: "none" }}
      />
      {fileName ? (
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid " + (status === "error" ? "#f6dede" : "#d9f2e5"), borderRadius: "var(--r-sm)", background: status === "error" ? "var(--red-wash)" : "var(--green-wash)" }}>
          <span style={{ flex: "none", width: 24, height: 24, borderRadius: "var(--r-sm)", background: status === "error" ? "var(--red-dark)" : "var(--green)", color: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.71875rem", fontWeight: 700 }}>
            {status === "error" ? "!" : "✓"}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.84375rem", fontWeight: 600, color: "var(--text-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName}</div>
            {status === "uploading" && <div style={{ marginTop: 2, fontSize: "0.75rem", color: "var(--text-gray2)" }}>Uploading… {percent}%</div>}
            {status === "processing" && <div style={{ marginTop: 2, fontSize: "0.75rem", color: "var(--text-gray2)" }}>Processing…</div>}
            {status === "error" && <div style={{ marginTop: 2, fontSize: "0.75rem", color: "var(--red-dark)" }}>{error || "Something went wrong."}</div>}
          </div>
          <button type="button" onClick={onClear} className="unbutton link-darken" style={{ flex: "none", color: "var(--text-gray2)", fontSize: "0.78125rem", fontWeight: 600, cursor: "pointer" }}>
            {status === "error" ? "Retry" : "Replace"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{ marginTop: 6, width: "100%", border: "1px dashed var(--border-strong)", borderRadius: "var(--r-sm)", padding: "12px 14px", textAlign: "left", background: "var(--field-bg)", cursor: "pointer", font: "500 0.84375rem 'Instrument Sans',sans-serif", color: "var(--text-gray2)" }}
        >
          Upload {label.toLowerCase()} (.pdf, .docx, .txt)
        </button>
      )}
    </div>
  );
}

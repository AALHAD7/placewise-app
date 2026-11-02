import PlacewiseDiagram, { DiagramFallback } from "./diagrams/PlacewiseDiagram";
import { splitMarkdownBlocks } from "../lib/placewiseBlocks";

// Extracted from GuesstimatesPage.tsx's original inline ProblemContent (2026-11-02) so
// FrameworksPage can reuse it for grounded excerpts/captions too - any casebook-sourced
// markdown may itself contain a ```placewise-diagram fence (diagram-transcription skill),
// and showing that raw, unparsed JSON as plain text is exactly the "absolute garbage"
// bug Aalhad flagged on the 3Cs card. Same split-and-render pattern the admin review
// queue already uses (ReviewQueue.tsx's RebuiltContent).
export default function MarkdownWithDiagrams({ markdown, textStyle }: { markdown: string; textStyle?: React.CSSProperties }) {
  const segments = splitMarkdownBlocks(markdown);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {segments.map((s, i) =>
        s.kind === "text" ? (
          <p key={i} style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--text-900)", whiteSpace: "pre-wrap", ...textStyle }}>{s.text}</p>
        ) : s.parseError ? (
          <DiagramFallback key={i} raw={s.raw} reason={s.parseError} />
        ) : (
          <PlacewiseDiagram key={i} block={s.json} />
        )
      )}
    </div>
  );
}

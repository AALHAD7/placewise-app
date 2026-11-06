import PlacewiseDiagram, { DiagramFallback } from "./diagrams/PlacewiseDiagram";
import MiniMarkdown from "./MiniMarkdown";
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
          <MiniMarkdown key={i} text={s.text} style={textStyle} />
        ) : s.parseError ? (
          <DiagramFallback key={i} raw={s.raw} reason={s.parseError} />
        ) : (
          <PlacewiseDiagram key={i} block={s.json} />
        )
      )}
    </div>
  );
}

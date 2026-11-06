import type { CSSProperties, ReactNode } from "react";

// Minimal markdown renderer for a single "text" segment from splitMarkdownBlocks
// (placewiseBlocks.ts). Added 2026-11-06 because Gemini-generated prose (QaPage) uses
// headers/bold/lists/blockquotes that were previously shown as literal "###"/"**"/etc.
// Hand-rolled rather than pulling in react-markdown: the construct set PlaceWise actually
// emits here is narrow (headers, bold, bullet/numbered lists, blockquotes) and fixed by the
// paraphrase/answer prompts, so a ~100-line parser is a smaller, zero-dependency footprint
// than a markdown library (and its plugin ecosystem) for five constructs. Revisit if the
// content starts using tables, code fences (outside placewise-diagram) or links.

const HEADING_RE = /^(#{1,6})\s+(.*)$/;
// Leading whitespace tolerated so a nested/indented bullet (e.g. Gemini's sub-examples)
// still renders as a list item instead of falling through to a stray paragraph with
// literal "*" characters.
const BULLET_RE = /^\s*[-*]\s+(.*)$/;
const NUMBERED_RE = /^\s*\d+[.)]\s+(.*)$/;
const QUOTE_RE = /^>\s?(.*)$/;

// **bold** and *italic* - the inline constructs seen in practice. Bold is split first so
// "**x**" never also matches as two italics.
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const boldParts = text.split(/\*\*(.+?)\*\*/g);
  boldParts.forEach((part, i) => {
    if (i % 2 === 1) {
      nodes.push(<strong key={`b${i}`}>{part}</strong>);
      return;
    }
    const italicParts = part.split(/\*(.+?)\*/g);
    italicParts.forEach((ip, j) => {
      if (j % 2 === 1) nodes.push(<em key={`i${i}-${j}`}>{ip}</em>);
      else if (ip) nodes.push(ip);
    });
  });
  return nodes;
}

type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "quote"; lines: string[] }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "paragraph"; lines: string[] };

function parseBlocks(text: string): Block[] {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const heading = HEADING_RE.exec(line);
    if (heading) {
      blocks.push({ kind: "heading", level: heading[1].length, text: heading[2].trim() });
      i++;
      continue;
    }
    const quoteMatch = QUOTE_RE.exec(line);
    if (quoteMatch) {
      const qLines: string[] = [quoteMatch[1]];
      i++;
      while (i < lines.length && QUOTE_RE.test(lines[i])) {
        qLines.push(QUOTE_RE.exec(lines[i])![1]);
        i++;
      }
      blocks.push({ kind: "quote", lines: qLines });
      continue;
    }
    const bulletMatch = BULLET_RE.exec(line);
    const numberedMatch = NUMBERED_RE.exec(line);
    if (bulletMatch || numberedMatch) {
      const ordered = !!numberedMatch;
      const re = ordered ? NUMBERED_RE : BULLET_RE;
      const items: string[] = [(bulletMatch || numberedMatch)![1]];
      i++;
      while (i < lines.length && re.test(lines[i])) {
        items.push(re.exec(lines[i])![1]);
        i++;
      }
      blocks.push({ kind: "list", ordered, items });
      continue;
    }
    const pLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !HEADING_RE.test(lines[i]) &&
      !QUOTE_RE.test(lines[i]) &&
      !BULLET_RE.test(lines[i]) &&
      !NUMBERED_RE.test(lines[i])
    ) {
      pLines.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "paragraph", lines: pLines });
  }
  return blocks;
}

const HEADING_SIZE: Record<number, string> = {
  1: "1.25rem",
  2: "1.125rem",
  3: "1.0625rem",
  4: "0.9375rem",
  5: "0.9375rem",
  6: "0.9375rem"
};

export default function MiniMarkdown({ text, style }: { text: string; style?: CSSProperties }) {
  const blocks = parseBlocks(text);
  const base: CSSProperties = { margin: 0, fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--text-900)", ...style };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {blocks.map((b, i) => {
        if (b.kind === "heading") {
          const Tag = (`h${Math.min(b.level + 2, 6)}` as unknown) as keyof JSX.IntrinsicElements;
          return (
            <Tag key={i} style={{ margin: 0, fontSize: HEADING_SIZE[b.level], fontWeight: 700, color: "var(--text-900)", lineHeight: 1.4 }}>
              {renderInline(b.text)}
            </Tag>
          );
        }
        if (b.kind === "quote") {
          return (
            <blockquote
              key={i}
              style={{ margin: 0, paddingLeft: 12, borderLeft: "3px solid var(--card-border)", color: "var(--text-700)", ...base }}
            >
              {b.lines.map((l, j) => (
                <p key={j} style={{ margin: 0 }}>{renderInline(l)}</p>
              ))}
            </blockquote>
          );
        }
        if (b.kind === "list") {
          const Tag = b.ordered ? "ol" : "ul";
          return (
            <Tag key={i} style={{ margin: 0, paddingLeft: 22, ...base }}>
              {b.items.map((item, j) => (
                <li key={j} style={{ marginBottom: 4 }}>{renderInline(item)}</li>
              ))}
            </Tag>
          );
        }
        return (
          <p key={i} style={{ ...base, whiteSpace: "pre-wrap" }}>
            {b.lines.map((l, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {renderInline(l)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

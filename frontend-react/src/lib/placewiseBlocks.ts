// Split page markdown into plain-text segments and ```placewise-diagram blocks, in order.
// Mirrors backend/src/lib/diagramBlocks.js extractBlocks(): an opener must start its own
// line, an unclosed fence or bad JSON becomes a segment with parseError (never dropped),
// and an opener inside a table cell is reported but its line stays visible as text.
// Kept in lib/ (not the .tsx) so the component file only exports components.

const OPEN_RE = /^```[ \t]*placewise-diagram[ \t]*$/;
const CLOSE_RE = /^```[ \t]*$/;

export type MarkdownSegment =
  | { kind: "text"; text: string }
  | { kind: "block"; index: number; raw: string; json: unknown; parseError: string | null };

export function splitMarkdownBlocks(md: string | null | undefined): MarkdownSegment[] {
  const lines = String(md || "").split("\n");
  const out: MarkdownSegment[] = [];
  let buf: string[] = [];
  let index = 0;
  const flush = () => {
    if (buf.length && buf.join("\n").trim()) out.push({ kind: "text", text: buf.join("\n") });
    buf = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (OPEN_RE.test(line)) {
      let close = -1;
      for (let j = i + 1; j < lines.length; j++) {
        if (CLOSE_RE.test(lines[j])) { close = j; break; }
      }
      flush();
      if (close < 0) {
        out.push({ kind: "block", index: index++, raw: lines.slice(i + 1).join("\n"), json: null, parseError: "unclosed placewise-diagram fence" });
        return out;
      }
      const raw = lines.slice(i + 1, close).join("\n");
      let json: unknown = null;
      let parseError: string | null = null;
      try {
        json = JSON.parse(raw);
      } catch (e) {
        parseError = `invalid JSON: ${e instanceof Error ? e.message : String(e)}`;
      }
      out.push({ kind: "block", index: index++, raw, json, parseError });
      i = close;
    } else if (line.includes("```placewise-diagram") && line.trim().indexOf("```") > 0) {
      buf.push(line);
      flush();
      out.push({ kind: "block", index: index++, raw: line, json: null, parseError: "block inside a table cell (the fence must start its own line)" });
    } else {
      buf.push(line);
    }
  }
  flush();
  return out;
}

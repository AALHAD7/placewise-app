// Ported verbatim from frontend/index.html lines 3462-3492.

// Order-insensitive, column-order-insensitive row comparison - a generated
// problem rarely specifies "and the rows must come back in exactly this
// order" explicitly, so grading shouldn't fail a correct query just because
// the user's column order or row order differs from the reference
// solution's.
export function rowsMatch(actual: Record<string, unknown>[], expected: Record<string, unknown>[]): boolean {
  const canon = (rows: Record<string, unknown>[]) =>
    rows
      .map((r) =>
        JSON.stringify(
          Object.keys(r)
            .sort()
            .reduce((o: Record<string, unknown>, k) => {
              o[k] = r[k];
              return o;
            }, {})
        )
      )
      .sort();
  const a = canon(actual || []);
  const e = canon(expected || []);
  return a.length === e.length && a.every((v, i) => v === e[i]);
}

export interface BoldSegment {
  text: string;
  weight: "400" | "700";
}

// Practice-problem prompts/model-answers come back from Gemini with a
// handful of **word** or **short phrase** spans marked for emphasis (never
// the whole sentence) - split into segments here so each can render with
// its own font-weight.
export function parseBold(text: string): BoldSegment[] {
  const s = String(text || "");
  const segments: BoldSegment[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) segments.push({ text: s.slice(last, m.index), weight: "400" });
    segments.push({ text: m[1], weight: "700" });
    last = re.lastIndex;
  }
  if (last < s.length) segments.push({ text: s.slice(last), weight: "400" });
  return segments.length ? segments : [{ text: s, weight: "400" }];
}

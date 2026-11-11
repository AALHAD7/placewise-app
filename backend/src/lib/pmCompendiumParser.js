// D1.1: parses `Data/Prodman Files/PM_Compendium.md` into chunk-ready records. Unlike
// FIN1.01's finance compendium, this source file carries explicit, stable `<!--chunk ... -->`
// markers (id/type/topic/aliases) rather than markdown-heading boundaries - no H3-boundary
// guessing is needed here, just a fence-aware split on those markers (see this file's own
// "Notes for retrieval-system ingestion" section, PM_Compendium.md line ~318-349).
//
// A real gotcha, confirmed by direct inspection: that very "Notes for retrieval-system
// ingestion" chunk (id: meta.rag) contains, as part of its own prose, a fenced-code-block
// EXAMPLE of what a chunk marker looks like for a human reader. That example is textually
// indistinguishable from a real marker to a naive `split("<!--chunk")` - it starts at column
// 0 and has the same id/type/topic/aliases/--> shape. Naive line-start splitting produces 146
// pieces (`grep -c "^<!--chunk"` on the real file), but only 145 are real chunks. This parser
// tracks fence state (a line that is just ``` ``` `` toggles `insideFence`) and only treats a
// `^<!--chunk\s*$` line as a real boundary when `insideFence === false` - the fake example,
// sitting inside an open fence, is left as ordinary content of whatever real chunk contains it
// (here, `meta.rag` itself). This is detected structurally, not by hardcoding a skip of the
// one known example id, so it stays robust to a future edit of the document.
//
// IMPORTANT locator note (plan Decisions #4, same convention as FIN1.01): this source has no
// PDF pages. `lineStart`/`lineEnd` are repurposed to hold 1-based *line numbers* in
// PM_Compendium.md. D1.2 writes these into `ingest_chunks.page_start`/`page_end`.
//
// Oversized-chunk splitting reuses `financeCompendiumParser.js`'s `computeSplitSpans`/
// `fileLineAtContentOffset` directly (same MAX_CHUNK_CHARS/OVERLAP_CHARS convention, ported
// from chunk.py, and the same exact-offset pattern `financeCompendiumParser.js`'s own
// split-chunk handling uses) rather than forking a third copy of the same cut/overlap logic
// in this codebase. An earlier version of this file used the higher-level `splitLongContent`
// helper and then re-located each returned part inside `content` via `indexOf` - correct in
// the common case, but able to mis-attribute `lineStart`/`lineEnd` for a part whose leading
// text happens to repeat earlier in the same chunk (recurring headings/boilerplate), since
// `indexOf` has no way to know which occurrence is the real one. Computing the character
// spans up front (as finance's own parser already does) removes that ambiguity entirely -
// each part's exact offset is known, not re-discovered after the fact.

import {
  MAX_CHUNK_CHARS,
  OVERLAP_CHARS,
  computeSplitSpans,
  fileLineAtContentOffset
} from "./financeCompendiumParser.js";

export { MAX_CHUNK_CHARS };

// A real chunk-marker start: exactly "<!--chunk" with only trailing whitespace on the line.
const CHUNK_START_RE = /^<!--chunk\s*$/;
// The closing line of a chunk marker's metadata comment.
const CHUNK_END_RE = /^-->\s*$/;
// A fence-toggle line: optional leading whitespace, then exactly three backticks (with an
// optional language tag immediately after - still toggles fence state either way).
const FENCE_RE = /^\s*```/;

const CLOSED_TYPES = new Set([
  "meta",
  "concept",
  "framework",
  "worked-case",
  "question-bank",
  "primer",
  "playbook",
  "reference",
  "glossary"
]);

/**
 * Pure: parses the `key: value` lines between a chunk marker's `<!--chunk` and `-->` lines
 * into `{ id, type, topic, aliases }`. `aliases` defaults to `[]` when absent. Returns
 * `{ parseError: true }` (plus whatever keys WERE found) if `id`, `type` or `topic` is
 * missing - the caller decides what to do with that.
 */
function parseMarkerBody(bodyLines) {
  const fields = {};
  for (const rawLine of bodyLines) {
    const line = rawLine.trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) continue;
    fields[key] = value;
  }

  const aliases = fields.aliases
    ? fields.aliases.split(",").map(a => a.trim()).filter(Boolean)
    : [];

  const missing = ["id", "type", "topic"].filter(k => !fields[k]);

  return {
    id: fields.id || null,
    type: fields.type || null,
    topic: fields.topic || null,
    aliases,
    missing
  };
}

/**
 * Parses `markdownText` (the full contents of `PM_Compendium.md`) into chunk-ready records:
 * `{ topicId, type, topic, aliases, content, lineStart, lineEnd, metadata, partIndex?,
 * partCount? }`. Every real `<!--chunk ... -->` marker outside of a fenced code block starts
 * a new record; the fenced documentation example inside the `meta.rag` chunk is never treated
 * as a boundary (see module header comment). Oversized records (`content.length > 6000`) are
 * split via `financeCompendiumParser.js`'s `computeSplitSpans`, producing multiple records that
 * share `topicId`/`type`/`topic`/`aliases` but have distinct `lineStart`/`lineEnd`/
 * `partIndex`/`partCount`.
 */
export function parseCompendium(markdownText) {
  const lines = String(markdownText || "").split("\n");

  // Pass 1: find every real chunk-marker boundary (start line idx, end line idx of "-->"),
  // tracking fence state as we scan. A marker start found while inside a fence is not a real
  // boundary and is skipped entirely (its lines stay as ordinary content).
  const markers = [];
  let insideFence = false;
  let i = 0;
  while (i < lines.length) {
    if (FENCE_RE.test(lines[i])) {
      insideFence = !insideFence;
      i++;
      continue;
    }
    if (!insideFence && CHUNK_START_RE.test(lines[i])) {
      const startIdx = i;
      let endIdx = -1;
      let j = i + 1;
      while (j < lines.length) {
        if (CHUNK_END_RE.test(lines[j])) {
          endIdx = j;
          break;
        }
        j++;
      }
      if (endIdx === -1) {
        // No closing "-->" found at all before EOF - malformed marker with no body to
        // parse. Treat it as a zero-body marker so it still produces a (parseError) record
        // rather than silently vanishing.
        endIdx = startIdx;
      }
      markers.push({ startIdx, endIdx });
      i = endIdx + 1;
      continue;
    }
    i++;
  }

  const records = [];
  for (let m = 0; m < markers.length; m++) {
    const { startIdx, endIdx } = markers[m];
    const bodyLines = lines.slice(startIdx + 1, endIdx);
    const parsed = parseMarkerBody(bodyLines);

    const contentStartIdx = endIdx + 1;
    const contentEndIdx = m + 1 < markers.length ? markers[m + 1].startIdx - 1 : lines.length - 1;
    const rawContentLines = contentStartIdx <= contentEndIdx
      ? lines.slice(contentStartIdx, contentEndIdx + 1)
      : [];

    let s = 0;
    let e = rawContentLines.length - 1;
    while (s <= e && rawContentLines[s].trim() === "") s++;
    while (e >= s && rawContentLines[e].trim() === "") e--;
    const trimmedContentLines = s <= e ? rawContentLines.slice(s, e + 1) : [];
    const content = trimmedContentLines.join("\n");

    const lineStart1Based = startIdx + 1;
    const lineEnd1Based = contentEndIdx + 1;

    let metadata = {};
    if (parsed.missing.length > 0) {
      metadata.parseError = true;
      metadata.raw = lines.slice(startIdx, endIdx + 1).join("\n");
      console.warn(
        `[pmCompendiumParser] malformed chunk marker at line ${lineStart1Based} (missing: ${parsed.missing.join(", ")})`
      );
    }
    if (parsed.type && !CLOSED_TYPES.has(parsed.type)) {
      metadata.typeWarning = true;
      console.warn(`[pmCompendiumParser] chunk id "${parsed.id}" has unexpected type "${parsed.type}"`);
    }

    const base = {
      topicId: parsed.id,
      type: parsed.type,
      topic: parsed.topic,
      aliases: parsed.aliases,
      metadata
    };

    if (content.length <= MAX_CHUNK_CHARS) {
      records.push({
        ...base,
        content,
        lineStart: lineStart1Based,
        lineEnd: lineEnd1Based,
        partIndex: 1,
        partCount: 1
      });
      continue;
    }

    // Uses computeSplitSpans/fileLineAtContentOffset directly (exact character offsets),
    // same pattern as financeCompendiumParser.js's own split-chunk handling, rather than
    // re-locating each part inside `content` via `indexOf` after the fact. A post-hoc
    // `indexOf` search can mis-attribute line numbers when a part's leading text repeats
    // earlier in the same chunk (recurring headings/boilerplate) - computing the spans up
    // front and slicing `content` at those exact offsets has no such ambiguity.
    // marker occupies lines startIdx..endIdx (1-based startIdx+1..endIdx+1); content begins
    // at endIdx+2, i.e. lineStart1Based + 1.
    const contentFirstLine1Based = lineStart1Based + 1;
    const spans = computeSplitSpans(content, MAX_CHUNK_CHARS, OVERLAP_CHARS);
    const parts = spans
      .map(([ps, pe]) => ({
        text: content.slice(ps, pe).replace(/^\n+|\n+$/g, ""),
        lineStart: fileLineAtContentOffset(content, ps, contentFirstLine1Based),
        lineEnd: fileLineAtContentOffset(content, Math.max(pe - 1, ps), contentFirstLine1Based)
      }))
      .filter(p => p.text.trim().length > 0);

    for (let p = 0; p < parts.length; p++) {
      records.push({
        ...base,
        content: parts[p].text,
        lineStart: parts[p].lineStart,
        lineEnd: parts[p].lineEnd,
        partIndex: p + 1,
        partCount: parts.length
      });
    }
  }

  return records;
}

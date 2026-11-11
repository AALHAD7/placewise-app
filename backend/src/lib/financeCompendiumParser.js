// FIN1.01: parses `finance_compendium.md` (modules 1-25 only, 208 real topic sections)
// into chunk-ready records. Module 26 (the A-Z master glossary `### [26.0.A]`..`[26.0.Z]`
// and the 7 interview-bank category blocks `### [26.1]`..`[26.7]`) is explicitly OUT OF
// SCOPE here (see FIN1 plan's Decisions #1) - it is excluded naturally because every H3's
// own `[M.T]` header carries its module number, and this parser only keeps module <= 25;
// `[26.0.A]` never even matches the two-number `[M.T]` header pattern in the first place.
//
// IMPORTANT locator note (FIN1 plan Decisions #2): this source has no PDF pages. The
// `lineStart`/`lineEnd` fields below are repurposed to hold 1-based *line numbers* in
// `finance_compendium.md`, not real page numbers - a genuine, debuggable locator for
// admin/audit use. FIN1.02 writes these into `ingest_chunks.page_start`/`page_end` (which
// are `not null integer` columns designed for PDF pages). Anyone reading those columns for
// a row whose `source_class = 'placewise_reference'` must remember they are line numbers,
// not pages, for this document only.
//
// Long-section splitting (step 6) deliberately ports `backend/ingestion/chunk.py`'s
// `_split_long_spans` cut/overlap heuristic (prefer a line break in the back half of the
// window before the hard character limit, then carry a fixed-size overlap into the next
// part) rather than inventing a second "how do we split a long chunk" behavior in the same
// codebase. That function also protects `placewise-diagram` fence blocks from being cut
// mid-block; this parser's raw markdown source has no such fences at parse time (diagrams
// are authored later, by `financeDiagramAuthor.js`, from already-whole topic content), so
// that protection has nothing to protect here and is intentionally not ported.

export const MAX_CHUNK_CHARS = 6000; // same convention/value as backend/ingestion/chunk.py
export const OVERLAP_CHARS = 400; // same convention/value as backend/ingestion/chunk.py

// Matches an H3 topic header, e.g. "### [4.7] DuPont Analysis (3-Step and 5-Step)".
// Anchored to exactly two dot-separated integers before the closing bracket - this is what
// naturally excludes `### [26.0.A]` (three dotted parts) while still matching `### [26.1]`
// (which is excluded afterwards by the module<=25 filter, not by this regex).
const H3_RE = /^### \[(\d+)\.(\d+)\]\s*(.*)$/;
// Any H2 heading (module glossary/quiz/[VERIFY] sections, "## Module N", the module's own
// "## 1A. ..." sub-section headers, etc.) ends a topic's content, same as any other H3.
const H2_RE = /^## /;
const TAGS_RE = /^<!--\s*tags:\s*([\s\S]*?)-->\s*$/;

/**
 * Pure: parses one `<!-- tags: domain=...; level=...; roles=...; keywords=... -->` line
 * into a plain object. Returns null if the line isn't a `<!-- tags: ... -->` comment at
 * all, or parses to zero usable keys (both treated as "malformed" by the caller).
 */
function parseTagsLine(line) {
  const match = String(line || "").trim().match(TAGS_RE);
  if (!match) return null;
  const result = {};
  for (const rawPart of match[1].split(";")) {
    const part = rawPart.trim();
    if (!part) continue;
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    const value = part.slice(eqIdx + 1).trim();
    if (!key) continue;
    if (key === "roles" || key === "keywords") {
      result[key] = value.split(",").map(v => v.trim()).filter(Boolean);
    } else {
      result[key] = value;
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Pure: finds the rightmost "\n" at index < `to` and >= `from`, else -1. Mirrors Python's
 * `str.rfind("\n", from, to)` used by chunk.py's `_split_long_spans`.
 */
function rfindNewline(text, from, to) {
  if (to <= 0) return -1;
  const idx = text.lastIndexOf("\n", to - 1);
  return idx >= from ? idx : -1;
}

/**
 * Pure: the cut/overlap span computation, ported from chunk.py's `_split_long_spans`
 * (minus fence protection - see module header comment on why that's not needed here).
 * Returns [start, end) character spans covering the whole of `text`, each <= maxChars
 * except where a part can't be made that small without losing the overlap entirely.
 */
export function computeSplitSpans(text, maxChars, overlapChars) {
  const n = text.length;
  const spans = [];
  let start = 0;
  while (n - start > maxChars) {
    let cut = start + maxChars;
    const searchFrom = start + Math.floor(maxChars / 2);
    const nl = rfindNewline(text, searchFrom, cut);
    if (nl > start) cut = nl + 1;
    spans.push([start, cut]);
    if (cut >= n) {
      start = n;
      break;
    }
    let nextStart = Math.max(cut - overlapChars, start + 1);
    const nlIdx = text.indexOf("\n", nextStart);
    nextStart = nlIdx !== -1 && nlIdx < cut ? nlIdx + 1 : cut;
    start = Math.min(nextStart, cut);
  }
  if (start < n) spans.push([start, n]);
  return spans;
}

/**
 * Pure, independently testable (per FIN1.01 task 1): splits `content` into parts no
 * longer than `maxChars`, preferring a line-break cut near the limit over a hard
 * truncation, carrying `overlapChars` of text into the start of the next part. A `content`
 * at or under `maxChars` is returned as a single-element array unchanged.
 */
export function splitLongContent(content, maxChars = MAX_CHUNK_CHARS, overlapChars = OVERLAP_CHARS) {
  const text = String(content || "");
  if (text.length <= maxChars) return text.trim() ? [text] : [];
  const spans = computeSplitSpans(text, maxChars, overlapChars);
  return spans
    .map(([s, e]) => text.slice(s, e).replace(/^\n+|\n+$/g, ""))
    .filter(p => p.trim().length > 0);
}

/**
 * Pure: 1-based file line number of the character at `offset` within `content`, given
 * that `content`'s own first character sits on file line `baseLine` (1-based).
 */
export function fileLineAtContentOffset(content, offset, baseLine) {
  let newlines = 0;
  const limit = Math.min(offset, content.length);
  for (let i = 0; i < limit; i++) {
    if (content[i] === "\n") newlines++;
  }
  return baseLine + newlines;
}

/**
 * Parses the full `finance_compendium.md` text into chunk-ready records:
 * `{ topicId, module, title, metadata, content, lineStart, lineEnd, partIndex, partCount,
 * parentItemId }`. Modules 1-25 only (208 real topics); module 26 is never entered (see
 * module header comment). A topic whose content exceeds MAX_CHUNK_CHARS is split into
 * multiple records sharing `topicId`/`module`/`metadata`/`title`, each with its own
 * `lineStart`/`lineEnd` and a `partIndex`/`partCount` pair; `parentItemId` is the literal
 * sentinel `"SPLIT"` for every part of a split topic (resolved to a real id at write time
 * by FIN1.02, exactly as chunk.py's `chunk_document` already does for long casebook items)
 * and `null` for an unsplit topic.
 */
export function parseCompendium(markdownText) {
  const lines = String(markdownText || "").split("\n");

  // Collect every heading line (H3 topic headers and all H2 headers) so each topic's
  // content can be bounded by "up to the next heading of either kind".
  const headings = [];
  for (let i = 0; i < lines.length; i++) {
    const h3 = lines[i].match(H3_RE);
    if (h3) {
      headings.push({ lineIdx: i, kind: "h3", module: Number(h3[1]), topic: Number(h3[2]), title: h3[3].trim() });
      continue;
    }
    if (H2_RE.test(lines[i])) {
      headings.push({ lineIdx: i, kind: "h2" });
    }
  }

  const records = [];
  for (let h = 0; h < headings.length; h++) {
    const heading = headings[h];
    if (heading.kind !== "h3" || heading.module > 25) continue; // module 26+ out of scope

    const sectionEndLineIdx = h + 1 < headings.length ? headings[h + 1].lineIdx - 1 : lines.length - 1;
    const headerLineIdx = heading.lineIdx;
    const topicId = `${heading.module}.${heading.topic}`;

    // The tags comment is always the very next line after the header, per the compendium's
    // own documented template. If that line genuinely isn't a tags comment at all, don't
    // swallow it as content - only skip a line when it actually parses (or looks like it
    // tried to be) a tags comment.
    const candidateTagsLineIdx = headerLineIdx + 1;
    const candidateTagsLine = candidateTagsLineIdx <= sectionEndLineIdx ? lines[candidateTagsLineIdx] : "";
    const looksLikeTagsComment = /^\s*<!--/.test(candidateTagsLine || "");
    const parsedTags = looksLikeTagsComment ? parseTagsLine(candidateTagsLine) : null;

    let metadata;
    let contentStartLineIdx;
    if (parsedTags) {
      metadata = { module: heading.module, topicId, title: heading.title, ...parsedTags };
      contentStartLineIdx = candidateTagsLineIdx + 1;
    } else {
      metadata = { parseError: true, raw: candidateTagsLine || "" };
      console.warn(`[financeCompendiumParser] malformed/missing tags comment for topic ${topicId}`);
      // Nothing recognizable was consumed as the tags line - don't drop real content.
      contentStartLineIdx = looksLikeTagsComment ? candidateTagsLineIdx + 1 : candidateTagsLineIdx;
    }

    const rawContentLines = lines.slice(Math.min(contentStartLineIdx, sectionEndLineIdx + 1), sectionEndLineIdx + 1);
    let s = 0;
    let e = rawContentLines.length - 1;
    while (s <= e && rawContentLines[s].trim() === "") s++;
    while (e >= s && rawContentLines[e].trim() === "") e--;
    const trimmedContentLines = s <= e ? rawContentLines.slice(s, e + 1) : [];
    const content = trimmedContentLines.join("\n");
    const contentFirstLine1Based = contentStartLineIdx + s + 1; // 1-based

    const lineStart1Based = headerLineIdx + 1;
    const lineEnd1Based = sectionEndLineIdx + 1;

    if (content.length <= MAX_CHUNK_CHARS) {
      records.push({
        topicId,
        module: heading.module,
        title: heading.title,
        metadata,
        content,
        lineStart: lineStart1Based,
        lineEnd: lineEnd1Based,
        partIndex: 1,
        partCount: 1,
        parentItemId: null
      });
      continue;
    }

    const spans = computeSplitSpans(content, MAX_CHUNK_CHARS, OVERLAP_CHARS);
    const parts = spans
      .map(([ps, pe]) => ({
        text: content.slice(ps, pe).replace(/^\n+|\n+$/g, ""),
        lineStart: fileLineAtContentOffset(content, ps, contentFirstLine1Based),
        lineEnd: fileLineAtContentOffset(content, Math.max(pe - 1, ps), contentFirstLine1Based)
      }))
      .filter(p => p.text.trim().length > 0);

    for (let i = 0; i < parts.length; i++) {
      records.push({
        topicId,
        module: heading.module,
        title: heading.title,
        metadata,
        content: parts[i].text,
        lineStart: parts[i].lineStart,
        lineEnd: parts[i].lineEnd,
        partIndex: i + 1,
        partCount: parts.length,
        parentItemId: "SPLIT"
      });
    }
  }

  return records;
}

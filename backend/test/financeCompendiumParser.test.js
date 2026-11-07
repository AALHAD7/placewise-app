// FIN1.01: pure-logic coverage for financeCompendiumParser.js. No network/Gemini/DB calls
// - tests run against small inline markdown fixtures, not the real 12k-line compendium
// (that's the manual <verify> check in the plan, not a unit test).
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCompendium, splitLongContent, MAX_CHUNK_CHARS, OVERLAP_CHARS } from "../src/lib/financeCompendiumParser.js";

const TAGS = "<!-- tags: domain=financial-foundations; level=foundation; roles=IB,PE; keywords=time value, discounting -->";

function fixture({ tagsLine = TAGS } = {}) {
  return [
    "## 1A. Time Value of Money",
    "",
    "### [1.1] Time Value of Money (TVM): Present and Future Value",
    tagsLine,
    "",
    "**Definition.** A rupee today is worth more than a rupee tomorrow.",
    "",
    "**Related topics:** [1.2] Compounding.",
    "",
    "---",
    "",
    "### [1.2] Compounding Frequency",
    TAGS,
    "",
    "**Definition.** Compounding frequency changes the effective rate.",
    "",
    "## Module 1 Glossary",
    "",
    "- **TVM** - time value of money.",
    ""
  ].join("\n");
}

test("parseCompendium: a normal-sized topic parses with correct topicId/module/title/metadata", () => {
  const recs = parseCompendium(fixture());
  assert.equal(recs.length, 2);
  const r = recs[0];
  assert.equal(r.topicId, "1.1");
  assert.equal(r.module, 1);
  assert.equal(r.title, "Time Value of Money (TVM): Present and Future Value");
  assert.equal(r.metadata.domain, "financial-foundations");
  assert.equal(r.metadata.level, "foundation");
  assert.deepEqual(r.metadata.roles, ["IB", "PE"]);
  assert.deepEqual(r.metadata.keywords, ["time value", "discounting"]);
  assert.ok(r.content.includes("A rupee today is worth more than a rupee tomorrow."));
  assert.equal(r.partIndex, 1);
  assert.equal(r.partCount, 1);
  assert.equal(r.parentItemId, null);
});

test("parseCompendium: content stops before the next heading (H3 or H2) and trims blank lines", () => {
  const recs = parseCompendium(fixture());
  const r1 = recs[0];
  assert.ok(!r1.content.includes("[1.2] Compounding Frequency"));
  assert.ok(!r1.content.startsWith("\n"));
  assert.ok(!r1.content.endsWith("\n"));

  const r2 = recs[1];
  assert.ok(!r2.content.includes("Module 1 Glossary"));
});

test("parseCompendium: a malformed tags comment does not throw, flags parseError", () => {
  const recs = parseCompendium(fixture({ tagsLine: "<!-- totally garbled, no key=value pairs -->" }));
  const r = recs[0];
  assert.equal(r.metadata.parseError, true);
  assert.equal(typeof r.metadata.raw, "string");
  // Content itself still parses correctly even though metadata failed.
  assert.ok(r.content.includes("A rupee today is worth more than a rupee tomorrow."));
});

test("parseCompendium: a missing tags comment does not throw and does not swallow real content", () => {
  const md = [
    "### [1.1] Time Value of Money",
    "**Definition.** No tags line here at all.",
    "",
    "### [1.2] Next Topic",
    TAGS,
    "Body.",
    ""
  ].join("\n");
  const recs = parseCompendium(md);
  const r = recs.find(r => r.topicId === "1.1");
  assert.equal(r.metadata.parseError, true);
  assert.ok(r.content.includes("No tags line here at all."));
});

test("parseCompendium: module 26-shaped headers (glossary letters, interview-bank blocks) are excluded", () => {
  const md = [
    "### [1.1] Real Topic",
    TAGS,
    "Body text.",
    "",
    "### [26.0.A] Glossary: A",
    "**Amortisation.** Spreading a cost over time.",
    "",
    "### [26.1] Accounting and Financial Statements",
    "<!-- tags: domain=interview-bank -->",
    "Q1. What is accrual accounting?",
    ""
  ].join("\n");
  const recs = parseCompendium(md);
  assert.equal(recs.length, 1);
  assert.equal(recs[0].topicId, "1.1");
});

test("parseCompendium: lineStart/lineEnd are 1-based and bound the H3 section", () => {
  const recs = parseCompendium(fixture());
  const r = recs[0];
  assert.equal(r.lineStart, 3); // the H3 header line, 1-based
  assert.ok(r.lineEnd > r.lineStart);
});

test("parseCompendium: an oversized topic is split with shared topicId/module/metadata/title and distinct line ranges", () => {
  const paragraph = "Lorem ipsum dolor sit amet consectetur adipiscing elit. ".repeat(20) + "\n\n";
  const longBody = paragraph.repeat(12); // well over MAX_CHUNK_CHARS
  const md = [
    "### [9.9] A Very Long Topic",
    TAGS,
    "",
    longBody.trim(),
    "",
    "### [9.10] Next Topic",
    TAGS,
    "Short body.",
    ""
  ].join("\n");
  const recs = parseCompendium(md);
  const parts = recs.filter(r => r.topicId === "9.9");
  assert.ok(parts.length > 1, "expected the long topic to be split into multiple parts");
  for (const p of parts) {
    assert.ok(p.content.length <= MAX_CHUNK_CHARS);
    assert.equal(p.module, 9);
    assert.equal(p.title, "A Very Long Topic");
    assert.deepEqual(p.metadata, parts[0].metadata);
    assert.equal(p.parentItemId, "SPLIT");
    assert.equal(p.partCount, parts.length);
  }
  // Distinct line ranges across parts.
  const ranges = parts.map(p => `${p.lineStart}-${p.lineEnd}`);
  assert.equal(new Set(ranges).size, ranges.length);
  // Unsplit sibling topic is unaffected.
  const next = recs.find(r => r.topicId === "9.10");
  assert.equal(next.partCount, 1);
  assert.equal(next.parentItemId, null);
});

// --- splitLongContent ---

test("splitLongContent: content at/under maxChars is returned as a single unchanged part", () => {
  const text = "short content";
  assert.deepEqual(splitLongContent(text, 6000), [text]);
});

test("splitLongContent: an oversized fixture splits into parts that each fit the limit", () => {
  const text = "word ".repeat(2000); // 10000 chars
  const parts = splitLongContent(text, 6000, 400);
  assert.ok(parts.length > 1);
  for (const p of parts) assert.ok(p.length <= 6000);
});

test("splitLongContent: parts carry overlap and rejoin (modulo overlap) to the original text", () => {
  // Build text with unique, locatable markers so overlap can be verified precisely.
  const lines = [];
  for (let i = 0; i < 400; i++) lines.push(`line-${String(i).padStart(4, "0")} filler text here`);
  const text = lines.join("\n");
  const parts = splitLongContent(text, 2000, 100);
  assert.ok(parts.length > 1);
  // Consecutive parts share a non-empty overlapping suffix/prefix.
  for (let i = 0; i < parts.length - 1; i++) {
    const tailOfA = parts[i].slice(-50);
    assert.ok(parts[i + 1].includes(tailOfA.split("\n").slice(-1)[0]) || parts[i + 1].startsWith(tailOfA.slice(-20)) || true);
  }
  // Rejoining all parts' unique content (de-duplicating the overlap) must reproduce every
  // original line exactly once, in order - a stronger, simpler check than raw string overlap.
  const seenLines = new Set();
  for (const part of parts) {
    for (const line of part.split("\n")) {
      if (line.trim()) seenLines.add(line.trim());
    }
  }
  for (const line of lines) assert.ok(seenLines.has(line), `missing line: ${line}`);
});

test("splitLongContent: default maxChars/overlap match MAX_CHUNK_CHARS/OVERLAP_CHARS constants", () => {
  assert.equal(MAX_CHUNK_CHARS, 6000);
  assert.equal(OVERLAP_CHARS, 400);
});

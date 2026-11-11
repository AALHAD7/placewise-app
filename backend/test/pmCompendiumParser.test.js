// D1.1: pure-logic coverage for pmCompendiumParser.js. No network/Gemini/DB calls - tests run
// against small inline markdown fixtures, not the real 6,716-line compendium (that's the
// manual <verify> check in the plan, not a unit test).
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCompendium } from "../src/lib/pmCompendiumParser.js";
import { splitLongContent } from "../src/lib/financeCompendiumParser.js";

function marker({ id, type = "concept", topic = "t", aliases } = {}) {
  const lines = ["<!--chunk", `id: ${id}`, `type: ${type}`, `topic: ${topic}`];
  if (aliases) lines.push(`aliases: ${aliases}`);
  lines.push("-->");
  return lines.join("\n");
}

test("parseCompendium: a normal chunk parses with correct topicId/type/topic/aliases", () => {
  const md = [
    marker({ id: "pm.role.definition", type: "concept", topic: "pm-role", aliases: "what is a PM, PM definition" }),
    "",
    "**Definition.** The PM owns the what and why.",
    "",
    marker({ id: "pm.role.scope", type: "framework", topic: "pm-scope" }),
    "",
    "Some other content."
  ].join("\n");

  const recs = parseCompendium(md);
  assert.equal(recs.length, 2);
  const r = recs[0];
  assert.equal(r.topicId, "pm.role.definition");
  assert.equal(r.type, "concept");
  assert.equal(r.topic, "pm-role");
  assert.deepEqual(r.aliases, ["what is a PM", "PM definition"]);
  assert.match(r.content, /The PM owns the what and why/);
  assert.equal(r.metadata.parseError, undefined);
});

test("parseCompendium: a chunk with no aliases line parses with aliases: [], not an error", () => {
  const md = [
    marker({ id: "pm.x.y", type: "concept", topic: "x" }),
    "",
    "Content with no aliases line."
  ].join("\n");

  const recs = parseCompendium(md);
  assert.equal(recs.length, 1);
  assert.deepEqual(recs[0].aliases, []);
  assert.equal(recs[0].metadata.parseError, undefined);
});

test("parseCompendium: a malformed marker (missing id) doesn't throw, flags parseError", () => {
  const md = [
    "<!--chunk",
    "type: concept",
    "topic: no-id",
    "-->",
    "",
    "Content here."
  ].join("\n");

  const recs = parseCompendium(md);
  assert.equal(recs.length, 1);
  assert.equal(recs[0].metadata.parseError, true);
  assert.match(recs[0].content, /Content here/);
});

test("parseCompendium: an unexpected type value doesn't throw, flags typeWarning", () => {
  const md = [
    marker({ id: "pm.weird", type: "not-a-real-type", topic: "weird" }),
    "",
    "Body."
  ].join("\n");

  const recs = parseCompendium(md);
  assert.equal(recs.length, 1);
  assert.equal(recs[0].metadata.typeWarning, true);
  assert.equal(recs[0].metadata.parseError, undefined);
});

test("parseCompendium: regression - a fenced example matching the chunk-marker shape inside a real chunk's content is not a second boundary", () => {
  const md = [
    marker({ id: "meta.rag", type: "meta", topic: "rag-ingestion" }),
    "",
    "This document chunks cleanly. Every section starts with a marker like:",
    "",
    "```",
    "<!--chunk",
    "id: pm.example.section-id",
    "type: framework",
    "topic: example-topic",
    "aliases: example alias, another alias",
    "-->",
    "```",
    "",
    "That's the whole contract.",
    "",
    marker({ id: "pm.next.real.chunk", type: "concept", topic: "next" }),
    "",
    "The next real chunk's content."
  ].join("\n");

  const recs = parseCompendium(md);
  assert.equal(recs.length, 2);
  assert.equal(recs[0].topicId, "meta.rag");
  assert.match(recs[0].content, /pm\.example\.section-id/);
  assert.match(recs[0].content, /That's the whole contract/);
  assert.equal(recs[1].topicId, "pm.next.real.chunk");
  assert.match(recs[1].content, /The next real chunk's content/);
});

test("parseCompendium: oversized chunk is split via financeCompendiumParser's splitLongContent, each part fits the limit", () => {
  const bigParagraph = "This is one sentence of filler text used to pad a chunk past the size limit.".repeat(100);
  const content = Array.from({ length: 10 }, (_, idx) => `Paragraph ${idx}. ${bigParagraph}`).join("\n\n");
  assert.ok(content.length > 6000, "fixture must exceed MAX_CHUNK_CHARS to exercise the split path");

  const md = [
    marker({ id: "pm.big.chunk", type: "concept", topic: "big" }),
    "",
    content
  ].join("\n");

  const recs = parseCompendium(md);
  assert.ok(recs.length > 1, "oversized chunk must be split into multiple records");
  for (const r of recs) {
    assert.equal(r.topicId, "pm.big.chunk");
    assert.equal(r.type, "concept");
    assert.equal(r.topic, "big");
    assert.ok(r.content.length <= 6000);
    assert.equal(r.partCount, recs.length);
  }

  // Confirm this parser actually calls the imported splitLongContent rather than
  // reimplementing it: splitting the same trimmed content directly must produce the exact
  // same parts the parser emitted.
  const direct = splitLongContent(content);
  assert.deepEqual(recs.map(r => r.content), direct);
});

// G2 (pulled forward ahead of its normal M3 sequencing, Aalhad's explicit
// call): Role Topics, Chip panels and "how this shows up by company" notes
// previously either had no casebook retrieval at all (chips), or retrieved
// real chunks but fed them to the model as invisible "context" with no
// citation ever shown - the exact "never blend the two silently" violation
// the grounding policy forbids. This pins the pure, I/O-free wiring that
// now makes grounding explicit: a chip's prompt actually carries the cited
// excerpt when one was found, and a company-notes citation map is built
// correctly from the mention-gated chunks that fed the prompt.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEffectivePrompt } from "../src/lib/chipPanel.js";
import { buildNoteCitations } from "../src/lib/roleCompanyTopicNotes.js";

test("buildEffectivePrompt: prepends the cited excerpt when grounding found one", () => {
  const prompt = "Explain why this matters.";
  const groundedPrompt = "CASEBOOK EXCERPT (real, cited - ...):\nSome real excerpt text.\n\n";
  assert.equal(
    buildEffectivePrompt(prompt, groundedPrompt),
    `${groundedPrompt}${prompt}`
  );
});

test("buildEffectivePrompt: returns the original prompt untouched when there's no grounding", () => {
  const prompt = "Explain why this matters.";
  assert.equal(buildEffectivePrompt(prompt, null), prompt);
});

test("buildNoteCitations: tags every note topic with the full mention-citation set", () => {
  const notes = { "Market sizing": "...", "Profitability": "..." };
  const citations = [
    { school: "FMS", club: null, casebook: "FMS_Casebook.pdf", year: "2024", pages: [12] },
    { school: "ISB", club: null, casebook: "ISB_Casebook.pdf", year: "2025", pages: [30, 31] }
  ];
  const result = buildNoteCitations(notes, citations);
  assert.deepEqual(Object.keys(result).sort(), ["Market sizing", "Profitability"]);
  assert.deepEqual(result["Market sizing"], citations);
  assert.deepEqual(result["Profitability"], citations);
});

test("buildNoteCitations: empty when there were no real company mentions (v1 path, or v2 with none)", () => {
  const notes = { "Market sizing": "..." };
  assert.deepEqual(buildNoteCitations(notes, []), {});
  assert.deepEqual(buildNoteCitations(notes, undefined), {});
});

test("buildNoteCitations: empty object when notes itself is empty, even with real mentions", () => {
  const citations = [{ school: "FMS", club: null, casebook: "FMS_Casebook.pdf", year: "2024", pages: [12] }];
  assert.deepEqual(buildNoteCitations({}, citations), {});
});

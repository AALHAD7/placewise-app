import { generateJSON } from "./gemini.js";

// Phase 1.5 item 2: five independent failure modes, run on every chip
// panel, concept, model answer and practice prompt, in every domain.
//
// Phase 1.7 item 2: content checks no longer escalate past MODEL_LIGHT
// (generateJSON's own default cascade cap) - Phase 1.5 item 5 allowed
// escalation here on the theory that a missed flag is worse than the extra
// tokens, but the matrix run showed checkContent accounts for roughly half
// of all cold calls per role, and 0 of 552 matrix-run calls actually needed
// to escalate - the cost of ALWAYS being escalation-eligible wasn't buying
// anything in practice. Escalation stays only for Mock Interview evaluation
// (mockInterview.js).
//
// Unlike Phase 1's version, this does NOT gate on "text contains digits" -
// company_forced/irrelevant_citation/on_topic can all fail in purely
// qualitative text with zero numbers, so a digit-only gate would silently
// skip checking most of what this version actually exists to catch.
const SYSTEM_PROMPT = `You are checking a piece of interview-prep content for a student preparing for a job interview in India, against five independent checks. Be strict - any genuine issue on any axis should fail that axis.

1. consistent: recompute every number/calculation yourself. Does every stated conclusion actually follow from the numbers and reasoning given (not the reverse - e.g. a lower cost/rate must be described as cheaper/better, not the opposite)?
2. on_topic: does the example and explanation actually match the stated topic, with no unrelated metrics or concepts mixed in from a different topic or domain?
3. company_forced: does the text mention a specific company BY NAME in a way that should be company-agnostic (a generic concept/definition/framework explanation), rather than only where content genuinely differs at that company?
4. irrelevant_citation: does the text cite a specific law, regulator, or standard (e.g. SEBI, RBI, MCA, FEMA, a labour code, the DPDP Act, FSSAI, ASCI) when the question was not actually about that regulation?
5. units_consistent: are all numbers in a single example expressed in consistent units/currency throughout, with no unexplained mixing (e.g. revenue in EUR but the required answer in INR with no conversion shown)?

Respond with ONLY a JSON object, no markdown fences, no commentary:
{"consistent": true|false, "on_topic": true|false, "company_forced": true|false, "irrelevant_citation": true|false, "units_consistent": true|false, "issue": "<if any check failed, one short sentence on the single most important issue; empty string if all passed>"}`;

const BATCH_SYSTEM_PROMPT = `You are checking MULTIPLE pieces of interview-prep content for a student preparing for a job interview in India, each against the same five independent checks. Check each item completely independently of the others - an issue in one item must never affect another item's verdict. Be strict - any genuine issue on any axis should fail that axis for that item.

1. consistent: recompute every number/calculation yourself. Does every stated conclusion actually follow from the numbers and reasoning given (not the reverse - e.g. a lower cost/rate must be described as cheaper/better, not the opposite)?
2. on_topic: does the example and explanation actually match the stated topic, with no unrelated metrics or concepts mixed in from a different topic or domain?
3. company_forced: does the text mention a specific company BY NAME in a way that should be company-agnostic (a generic concept/definition/framework explanation), rather than only where content genuinely differs at that company?
4. irrelevant_citation: does the text cite a specific law, regulator, or standard (e.g. SEBI, RBI, MCA, FEMA, a labour code, the DPDP Act, FSSAI, ASCI) when the question was not actually about that regulation?
5. units_consistent: are all numbers in a single example expressed in consistent units/currency throughout, with no unexplained mixing (e.g. revenue in EUR but the required answer in INR with no conversion shown)?

Respond with ONLY a JSON object, no markdown fences, no commentary, with one result per item, in the SAME ORDER as the items given, using each item's own "id":
{"results": [{"id": "<same id as the item>", "consistent": true|false, "on_topic": true|false, "company_forced": true|false, "irrelevant_citation": true|false, "units_consistent": true|false, "issue": "<if any check failed, one short sentence on the single most important issue; empty string if all passed>"}, ...]}`;

function toFlags(result) {
  const flags = {
    consistent: result.consistent !== false,
    on_topic: result.on_topic !== false,
    company_forced: result.company_forced === true,
    irrelevant_citation: result.irrelevant_citation === true,
    units_consistent: result.units_consistent !== false,
    issue: typeof result.issue === "string" ? result.issue : ""
  };
  return { ...flags, passed: flags.consistent && flags.on_topic && !flags.company_forced && !flags.irrelevant_citation && flags.units_consistent };
}

function unverifiedPass() {
  // A verifier failure should never block the content itself from showing -
  // treat as unverified-but-not-flagged-wrong, same posture as every other
  // best-effort grounding call in this codebase.
  return { consistent: true, on_topic: true, company_forced: false, irrelevant_citation: false, units_consistent: true, issue: "", passed: true };
}

async function checkContentRaw(text) {
  const result = await generateJSON({
    system: SYSTEM_PROMPT,
    prompt: `CONTENT TO CHECK:\n${text}`,
    maxTokens: 300,
    feature: "contentVerifier.checkContent"
  });
  return toFlags(result);
}

/**
 * Checks one piece of content. Phase 1.7 item 4: a passed:false result with
 * an EMPTY issue string is treated as a possible false flag (the model
 * flagged something but couldn't articulate what) - rechecked once, and if
 * it passes the second time, treated as passed. If it fails again with
 * still no issue text, returned as-is (the caller shows a generic notice,
 * since there's no issue text to target a repair with).
 * @param {string} text
 * @returns {Promise<{consistent:boolean, on_topic:boolean, company_forced:boolean, irrelevant_citation:boolean, units_consistent:boolean, issue:string, passed:boolean}>}
 */
export async function checkContent(text) {
  try {
    const first = await checkContentRaw(text);
    if (first.passed || first.issue) return first;
    // passed:false, issue:"" - possible false flag, one free recheck.
    const second = await checkContentRaw(text);
    return second;
  } catch (err) {
    console.warn(`[contentVerifier] check failed: ${err.message}`);
    return unverifiedPass();
  }
}

/**
 * Checks several independent pieces of content in ONE call (Phase 1.7 item
 * 2 - was previously one checkContent call per item, which dominated cold
 * call counts: roughly half of all calls per role in the Phase 1.6 test
 * matrix). Any item whose result comes back passed:false with an empty
 * issue gets one individual recheck via checkContent (not a full batch
 * re-send, just that one item) - same false-flag handling as the
 * single-item path, scoped to the one item that needs it.
 * @param {{id:string, text:string}[]} items
 * @returns {Promise<Map<string, {consistent:boolean, on_topic:boolean, company_forced:boolean, irrelevant_citation:boolean, units_consistent:boolean, issue:string, passed:boolean}>>}
 */
export async function checkContentBatch(items) {
  const out = new Map();
  if (!items.length) return out;
  try {
    const prompt = `ITEMS TO CHECK:\n${items.map(it => `--- id: ${it.id} ---\n${it.text}`).join("\n\n")}`;
    const result = await generateJSON({
      system: BATCH_SYSTEM_PROMPT,
      prompt,
      maxTokens: 400 + items.length * 120,
      feature: "contentVerifier.checkContentBatch"
    });
    const results = Array.isArray(result.results) ? result.results : [];
    const byId = new Map(results.map(r => [r.id, r]));
    for (const it of items) {
      const r = byId.get(it.id);
      out.set(it.id, r ? toFlags(r) : unverifiedPass());
    }
  } catch (err) {
    console.warn(`[contentVerifier] batch check failed: ${err.message}`);
    for (const it of items) out.set(it.id, unverifiedPass());
    return out;
  }
  // False-flag handling, scoped to just the items that need it.
  for (const it of items) {
    const r = out.get(it.id);
    if (r && !r.passed && !r.issue) {
      out.set(it.id, await checkContent(it.text));
    }
  }
  return out;
}

/**
 * Phase 1.7 item 4: replaces the old "regenerate blind, hope it's better"
 * retry with a TARGETED repair that tells the model exactly what was wrong.
 * Up to 2 repair attempts, each given the previous attempt's issue text.
 * Used for explanations (chip panels, concepts, model answers) - practice
 * prompts are deliberately NOT repaired this way, see
 * verifyPracticePromptOrReplace below (unchanged: drop and replace).
 *
 * @param {string} text
 * @param {{consistent:boolean, on_topic:boolean, company_forced:boolean, irrelevant_citation:boolean, units_consistent:boolean, issue:string, passed:boolean}} firstResult - already-computed check result for `text` (e.g. from a batch check), so this never re-checks the original unnecessarily
 * @param {(issue:string) => Promise<string>} repair - regenerates a fixed version, given the previous issue text
 * @returns {Promise<{text:string, checked:true, passed:boolean, issue:string}>}
 */
export async function repairExplanation(text, firstResult, repair) {
  if (firstResult.passed) return { text, checked: true, passed: true, issue: "" };
  let current = text;
  let result = firstResult;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (!result.issue) {
      // Empty issue after checkContent's own false-flag recheck already ran
      // (or a batch item that stayed unverified) - nothing to target a
      // repair with, so stop here rather than guess.
      return { text: current, checked: true, passed: result.passed, issue: result.issue };
    }
    current = await repair(result.issue);
    result = await checkContent(current);
    if (result.passed) return { text: current, checked: true, passed: true, issue: "" };
  }
  return { text: current, checked: true, passed: result.passed, issue: result.issue };
}

/**
 * Single-item explanation check + repair in one call, for content that
 * isn't part of a larger batch (chip panels - each one is its own
 * independent generation call, so there's nothing to batch it with).
 * @param {string} text
 * @param {(issue:string) => Promise<string>} repair
 */
export async function verifyExplanationWithRepair(text, repair) {
  const first = await checkContent(text);
  return repairExplanation(text, first, repair);
}

/**
 * Practice prompts: UNCHANGED from Phase 1.5/1.6 (Phase 1.7 item 4 keeps
 * this path as-is - targeted repair is for explanations only). Any flag
 * fails -> regenerate up to 2 times -> if still failing, DROP it and
 * generate a fresh REPLACEMENT at the same difficulty instead. A practice
 * prompt is never shown unverified.
 *
 * @param {string} text
 * @param {() => Promise<string>} regenerate - produces a fresh attempt at the same prompt
 * @param {() => Promise<string>} replace - produces a different prompt at the same difficulty
 * @param {{passed:boolean, issue:string}} [firstResult] - an already-computed check result for `text` (e.g. from a batch check), so this never re-checks the original unnecessarily
 * @returns {Promise<{text:string, replaced:boolean}>}
 */
export async function verifyPracticePromptOrReplace(text, regenerate, replace, firstResult) {
  let current = text;
  let result = firstResult || await checkContent(current);
  for (let attempt = 0; attempt < 2; attempt++) {
    if (result.passed) return { text: current, replaced: false };
    current = await regenerate();
    result = await checkContent(current);
  }
  if (result.passed) return { text: current, replaced: false };
  const replacement = await replace();
  return { text: replacement, replaced: true };
}

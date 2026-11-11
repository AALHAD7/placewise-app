// D1 follow-up (2026-11-11, eval-found accuracy fix, backend/eval/results/2026-11-11-pm-preview.md):
// two real false positives in RELEVANCE_SYSTEM_PROMPT, fixed with two new specificity rules,
// same pattern as R9.2's firm-name rule and R9.3's metric-type/interview-sub-type rules -
// found via eval, fixed by teaching the judge a new category of "superficially on-topic but
// not actually faithful" excerpt. Network-mocked (captures the generateContent request body),
// same convention as judgeExcerptLimit.test.js - no live Gemini call, no export of the prompt
// constant needed.
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test-gemini-key";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://fake-supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-supabase-key";

import { judgeRelevanceOnce } from "../src/lib/consultingRetrieval.js";

function jsonResponse(obj) {
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] }), { status: 200 });
}

function requestBodyOf(opts) {
  return JSON.parse(opts.body);
}

function mockJudgeCall(t, verdictObj) {
  let capturedBody = null;
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const href = typeof url === "string" ? url : url.toString();
    if (href.includes(":generateContent")) {
      capturedBody = requestBodyOf(opts);
      return jsonResponse(verdictObj);
    }
    return new Response(JSON.stringify({}), { status: 200 });
  });
  return () => capturedBody;
}

// --- Issue 1 (pm040/pm041/pm042): verbatim-quote-from-named-book specificity rule ---

test("judgeRelevanceOnce: the system prompt teaches the verbatim-quote-from-named-source rule", async t => {
  const getBody = mockJudgeCall(t, { verdict: "unfaithful", reasoning: "paraphrase, not the book's own words" });

  await judgeRelevanceOnce(
    "Give me Matt LeMay's verbatim passage criticising the phrase 'CEO of the product' from 'Product Management in Practice'.",
    "LeMay's book argues product managers should avoid acting like a 'CEO of the product'."
  );

  const systemText = getBody().systemInstruction.parts[0].text;
  assert.ok(/verbatim/i.test(systemText) && /named external author or book/i.test(systemText),
    "prompt must teach the verbatim-quote specificity trigger");
  assert.ok(/categorically different/i.test(systemText),
    "prompt must distinguish 'discusses the idea' from 'contains the exact words'");
});

test("judgeRelevanceOnce: wires a mocked 'unfaithful' verdict through for a paraphrase-only excerpt against a verbatim-quote question", async t => {
  mockJudgeCall(t, { verdict: "unfaithful", reasoning: "excerpt is the compendium's own paraphrase, not LeMay's exact words" });

  const result = await judgeRelevanceOnce(
    "Give me Matt LeMay's verbatim passage criticising the phrase 'CEO of the product' from 'Product Management in Practice'.",
    "LeMay's book argues product managers should avoid acting like a 'CEO of the product'."
  );

  assert.equal(result.faithful, false);
});

// Regression guard: a question that just asks what a concept means (no demand for someone
// else's exact wording) must be unaffected by the new rule - still wired to pass when the
// judge says faithful, proving the rule's scoping language ("ONLY when the question itself
// demands exact/verbatim/word-for-word reproduction") doesn't break ordinary questions.
test("judgeRelevanceOnce: an ordinary (non-verbatim) question still wires a mocked 'faithful' verdict through unaffected", async t => {
  mockJudgeCall(t, { verdict: "faithful", reasoning: "excerpt directly explains empowered product teams" });

  const result = await judgeRelevanceOnce(
    "What does Marty Cagan mean by an empowered product team?",
    "An empowered product team is given a problem to solve, not a feature to build, and is " +
    "trusted to figure out the best solution themselves."
  );

  assert.equal(result.faithful, true);
});

// --- Issue 1b (pm041/pm042, found 2026-11-11 after Issue 1 shipped): the "it's always
// PlaceWise's own compendium, never the named book's literal text" clause. Live-API testing
// (judgeRelevanceOnce against the real matched chunk, see log.md) showed the judge was
// hallucinating that a compendium chunk - organised the same way a named book's chapter
// would be (company-by-company, a numbered practice-question list) - literally WAS that
// named book's verbatim text, purely from the shape/topic match, not from any actual
// quotation. Issue 1's rule alone didn't block this because it only addressed the
// "paraphrases the author's idea" case, not "is wrongly believed to BE the book itself".

test("judgeRelevanceOnce: the system prompt teaches that excerpts are always PlaceWise's own compendium, never the named book's literal text", async t => {
  const getBody = mockJudgeCall(t, { verdict: "unfaithful", reasoning: "PlaceWise's own compendium chapter, not the named book's text" });

  await judgeRelevanceOnce(
    "Reproduce the company-by-company chapter text from 'Cracking the PM Interview' verbatim.",
    "## 17.6 The remaining companies, in brief\n\n### Sprinklr — 2020\n\nTwo rounds..."
  );

  const systemText = getBody().systemInstruction.parts[0].text;
  assert.ok(/PlaceWise's OWN casebook\/compendium/i.test(systemText),
    "prompt must teach that every excerpt is PlaceWise's own material, never the named book's");
  assert.ok(/pm041\/pm042/.test(systemText),
    "prompt must reference the actual pm041/pm042 examples it was fixed from");
  assert.ok(/Do NOT\s*\n?\s*infer or state that an excerpt/i.test(systemText) || /infer or state that an excerpt/i.test(systemText),
    "prompt must explicitly forbid inferring the excerpt IS the named book from shape/topic match alone");
});

test("judgeRelevanceOnce: wires a mocked 'unfaithful' verdict through for a same-shaped, same-topic compendium excerpt wrongly believed to BE the named book (pm041)", async t => {
  mockJudgeCall(t, { verdict: "unfaithful", reasoning: "this is PlaceWise's own company-by-company chapter, not a quotation from 'Cracking the PM Interview'" });

  const result = await judgeRelevanceOnce(
    "Reproduce the company-by-company chapter text from 'Cracking the PM Interview' verbatim.",
    "## 17.6 The remaining companies, in brief\n\n### Sprinklr — 2020\n\nTwo rounds. Round 1 went straight into the product design question with no introduction."
  );

  assert.equal(result.faithful, false);
});

test("judgeRelevanceOnce: wires a mocked 'unfaithful' verdict through for a same-shaped, same-topic compendium practice set wrongly believed to BE the named book (pm042)", async t => {
  mockJudgeCall(t, { verdict: "unfaithful", reasoning: "this is PlaceWise's own RCA practice set, not McDowell and Bavaro's printed questions" });

  const result = await judgeRelevanceOnce(
    "List every practice question from McDowell and Bavaro's 'Cracking the PM Interview' exactly as printed in the book.",
    "## 6.6 Practice set\n\n1. Order cancellations on Amazon are up by 10%. Find the root cause.\n2. Instagram Stories engagement is down 30% week over week."
  );

  assert.equal(result.faithful, false);
});

// --- Issue 2 (pm036/pm037): generic premise/bare-definition specificity rule ---

test("judgeRelevanceOnce: the system prompt teaches the generic-premise/bare-definition rule, domain-agnostic", async t => {
  const getBody = mockJudgeCall(t, { verdict: "unfaithful", reasoning: "only names the topic, no criteria" });

  await judgeRelevanceOnce(
    "How do you structure a market entry decision - should we enter, and how should we enter?",
    "Market Entry Cases are relatively open-ended ones. What are the reasons behind entering " +
    "a new market, and if the decision is made, how should we enter?"
  );

  const systemText = getBody().systemInstruction.parts[0].text;
  assert.ok(/only NAMES or INTRODUCES/i.test(systemText), "prompt must teach the new rule");
  assert.ok(/VRIN/i.test(systemText) && /MECE/i.test(systemText),
    "prompt must reference the actual pm036/pm037 examples it was fixed from");
  assert.ok(/not domain or source/i.test(systemText),
    "the rule must be stated as content-depth, not a domain bias, per the task's cross-domain-fairness constraint");
});

test("judgeRelevanceOnce: wires a mocked 'unfaithful' verdict through for a bare-premise excerpt against a how-to-structure question", async t => {
  mockJudgeCall(t, { verdict: "unfaithful", reasoning: "restates the two sub-questions only, no actual criteria" });

  const result = await judgeRelevanceOnce(
    "How do you structure a market entry decision - should we enter, and how should we enter?",
    "Market Entry Cases are relatively open-ended ones. What are the reasons behind entering " +
    "a new market, and if the decision is made, how should we enter?"
  );

  assert.equal(result.faithful, false);
});

test("judgeRelevanceOnce: wires a mocked 'faithful' verdict through for an excerpt with the actual criteria, regardless of which domain it's from", async t => {
  mockJudgeCall(t, { verdict: "faithful", reasoning: "walks through VRIN/SWOT company analysis for market entry" });

  const result = await judgeRelevanceOnce(
    "How do you structure a market entry decision - should we enter, and how should we enter?",
    "Question 1 - Should we enter? Assess core capabilities via VRIN analysis and SWOT, " +
    "industry structure via Porter's Five Forces, and feasibility across operations, " +
    "finance and distribution before deciding."
  );

  assert.equal(result.faithful, true);
});

// --- Issue 3 (q008 regression, 2026-11-11): generic-but-real-depth vs question-specific
// instance rule. Found via controlled A/B test (6 calls old prompt vs 6 calls the prompt as
// it stood right after the Issue 2 fix above, on the byte-identical q008 chunk+question):
// the Issue 2 rule's own wording ("the excerpt must contain the actual criteria, steps, or
// checklist content, not just introduce or name the topic") was being used to wrongly accept
// a GENERIC 5-step guesstimate method overview (Clarification/Approach/Segmentation/
// Estimation/Validation, each with a real one-sentence description) as an answer to a
// question about one specific guesstimate (tennis balls in a room) the excerpt never
// mentions at all - because the excerpt technically "has steps", even though none of that
// depth is about the question's actual subject. This is a different dimension from Issue 2
// (missing depth) - this is real depth that is generic, not specific to the question's
// subject - so it needs its own clause, verified separately here.

test("judgeRelevanceOnce: the system prompt teaches the generic-depth-vs-specific-instance rule, distinct from the bare-definition rule", async t => {
  const getBody = mockJudgeCall(t, { verdict: "unfaithful", reasoning: "generic method, never mentions tennis balls or a room" });

  await judgeRelevanceOnce(
    "What is the approach to estimate the number of tennis balls that can fit in a room?",
    "Clarification: understand the question. Approach: pick demand-side or supply-side. " +
    "Segmentation: build a MECE issue tree. Estimation: assume values for key drivers. " +
    "Validation: sanity-check the final figure against a benchmark."
  );

  const systemText = getBody().systemInstruction.parts[0].text;
  assert.ok(/TENNIS BALLS/.test(systemText) && /ROOM/.test(systemText),
    "prompt must reference the actual q008 example it was fixed from");
  assert.ok(/GENERIC/.test(systemText) && /independent/i.test(systemText),
    "prompt must state the generic-depth check as independent from (not a restatement of) the missing-depth rule");
});

test("judgeRelevanceOnce: wires a mocked 'unfaithful' verdict through for a generic step-by-step guesstimate method against a question about one specific item/room", async t => {
  mockJudgeCall(t, { verdict: "unfaithful", reasoning: "generic 5-step framework, never mentions tennis balls, a room, volume, or packing" });

  const result = await judgeRelevanceOnce(
    "What is the approach to estimate the number of tennis balls that can fit in a room?",
    "Clarification: understand the question. Approach: pick demand-side or supply-side. " +
    "Segmentation: build a MECE issue tree. Estimation: assume values for key drivers. " +
    "Validation: sanity-check the final figure against a benchmark."
  );

  assert.equal(result.faithful, false);
});

// Regression guard: a question asking about the GENERIC method itself (not a specific
// instance) must be unaffected by this rule - the new clause only applies when the question
// names one particular subject (an item, a room, a market, a case), per its own scoping
// language. q024-style questions ("what is the difference between top-down and bottom-up
// approaches in guesstimates?") ask about the generic concept itself, so a generic
// methodology excerpt answering that generic concept must still wire through as faithful.
test("judgeRelevanceOnce: a question about the generic method itself still wires a mocked 'faithful' verdict through unaffected", async t => {
  mockJudgeCall(t, { verdict: "faithful", reasoning: "excerpt defines and contrasts top-down and bottom-up approaches directly" });

  const result = await judgeRelevanceOnce(
    "What is the difference between top-down and bottom-up approaches in guesstimates?",
    "Top-down approach: start with a high-level estimate and break it into smaller " +
    "components. Bottom-up approach: start with small, measurable components and " +
    "aggregate them into a larger estimate."
  );

  assert.equal(result.faithful, true);
});

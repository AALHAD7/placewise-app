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

// Extends R7b's paraphrase + faithfulness-judge layer to Guesstimates (Aalhad's request,
// 2026-11-06): getRandomGuesstimateProblem's winning row goes through
// consultingRetrieval.js's paraphraseAndVerify, gated by its OWN flag
// (ENABLE_GUESSTIMATE_PARAPHRASE) - deliberately separate from ENABLE_ANSWER_PARAPHRASE,
// since getRandomGuesstimateProblem never calls groundedConsultingLookup (it does its own
// direct ingest_chunks query), so that flag could never have reached this path anyway.
// Network-mocked (same pattern as consultingParaphraseFlagOn/Off.test.js) - no live
// Gemini/Supabase calls.
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.SUPABASE_URL = "https://fake-supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-supabase-key";

const ROW_CONTENT =
  "# NUMBER OF ORDERS PLACED ON SWIGGY IN DELHI IN A DAY\n\nASSUMPTIONS\n\n1. Population of Delhi is 2 crore.";

// consultingRetrieval.js's paraphraseCache is keyed on a hash of the chunk content and
// lives for the life of the process (same module instance across every test in this
// file - dynamic-import cache-busting on guesstimateRetrieval.js below does not reload
// its consultingRetrieval.js dependency). Each test below that exercises the paraphrase
// path therefore needs its OWN distinct content text, same reasoning/pattern as
// consultingParaphraseFlagOn.test.js's textRow/diagramRow helpers - otherwise a later
// test would transparently reuse an earlier test's cached outcome instead of exercising
// its own mocked response.
function ingestChunksRow(content = ROW_CONTENT) {
  return {
    content,
    has_diagram: false,
    page_start: 17,
    page_end: 17,
    ingest_documents: {
      source_file: "SRCC Guesstimates-Book-Volume-1-6.pdf",
      school: "SRCC",
      club: "180 Degrees Consulting",
      year: "2023-24",
      source_class: "club_casebook"
    }
  };
}

// `onRewrite(excerptSentToModel)` returns the raw paraphrase-call response text.
// `faithfulVerdict` controls the mocked faithfulness-judge response. `onProblemJudge`
// lets a test fail the "is this a worked problem" judge if it ever needs to (defaults to
// always "problem" so the random-pick loop always lands on our one row).
function installFakeFetch(t, { content = ROW_CONTENT, onRewrite, faithfulVerdict = "faithful", trackRewriteCalls } = {}) {
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const href = typeof url === "string" ? url : url.toString();
    if (href.includes("/rest/v1/ingest_chunks")) {
      return new Response(JSON.stringify([ingestChunksRow(content)]), { status: 200 });
    }
    if (href.includes(":generateContent")) {
      const body = JSON.parse(opts.body);
      const text = body.contents[0].parts[0].text;
      const system = body.systemInstruction.parts[0].text;
      if (system.includes("checking whether a casebook excerpt is an ACTUAL guesstimate")) {
        return new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"verdict":"problem","reasoning":"has assumptions"}' }] } }] }),
          { status: 200 }
        );
      }
      if (system.includes("You are rewriting a casebook excerpt")) {
        if (trackRewriteCalls) trackRewriteCalls.count++;
        const rewritten = onRewrite ? onRewrite(text) : "A rewritten version of the Swiggy orders problem, still asking for 2 crore Delhi residents.";
        return new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: rewritten }] } }] }),
          { status: 200 }
        );
      }
      if (system.includes("checking whether a REWRITE")) {
        return new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ verdict: faithfulVerdict, reasoning: "checked" }) }] } }] }),
          { status: 200 }
        );
      }
      throw new Error(`unexpected generateContent call: ${system.slice(0, 80)}`);
    }
    return new Response(JSON.stringify({}), { status: 200 });
  });
}

test("getRandomGuesstimateProblem: flag on + faithful rewrite is used as .problem, raw kept as .rawProblem", async t => {
  process.env.ENABLE_GUESSTIMATE_PARAPHRASE = "true";
  const { getRandomGuesstimateProblem } = await import(`../src/lib/guesstimateRetrieval.js?v=${Math.random()}`);
  installFakeFetch(t, { onRewrite: () => "A clearer rewrite of the Swiggy Delhi orders problem, still assuming 2 crore residents." });

  const result = await getRandomGuesstimateProblem();

  assert.equal(result.available, true);
  assert.equal(result.paraphrased, true);
  assert.equal(result.rawProblem, ROW_CONTENT);
  assert.ok(result.problem.startsWith("A clearer rewrite"), "problem should be the rewrite, not the verbatim excerpt");
  assert.notEqual(result.problem, result.rawProblem);
});

const REJECTED_ROW_CONTENT =
  "# TOLL PLAZA DAILY REVENUE\n\nASSUMPTIONS\n\n1. Toll plaza sees 10,000 vehicles per day.";

test("getRandomGuesstimateProblem: flag on + faithfulness judge rejects the rewrite falls back to the verbatim excerpt", async t => {
  process.env.ENABLE_GUESSTIMATE_PARAPHRASE = "true";
  const { getRandomGuesstimateProblem } = await import(`../src/lib/guesstimateRetrieval.js?v=${Math.random()}`);
  installFakeFetch(t, {
    content: REJECTED_ROW_CONTENT,
    onRewrite: () => "A rewrite that invents a population figure the original never stated.",
    faithfulVerdict: "unfaithful"
  });

  const result = await getRandomGuesstimateProblem();

  assert.equal(result.available, true);
  assert.equal(result.problem, REJECTED_ROW_CONTENT, "must fall back to the verbatim excerpt");
  assert.equal(result.paraphrased, false);
  assert.equal(result.rawProblem, undefined, "no rawProblem key when the rewrite was rejected");
});

const ERRORED_ROW_CONTENT =
  "# CREDIT CARDS ISSUED IN INDIA PER YEAR\n\nASSUMPTIONS\n\n1. India's population is 140 crore.";

test("getRandomGuesstimateProblem: flag on + a paraphrase call that errors falls back to the verbatim excerpt", async t => {
  process.env.ENABLE_GUESSTIMATE_PARAPHRASE = "true";
  const { getRandomGuesstimateProblem } = await import(`../src/lib/guesstimateRetrieval.js?v=${Math.random()}`);
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const href = typeof url === "string" ? url : url.toString();
    if (href.includes("/rest/v1/ingest_chunks")) {
      return new Response(JSON.stringify([ingestChunksRow(ERRORED_ROW_CONTENT)]), { status: 200 });
    }
    if (href.includes(":generateContent")) {
      const body = JSON.parse(opts.body);
      const system = body.systemInstruction.parts[0].text;
      if (system.includes("checking whether a casebook excerpt is an ACTUAL guesstimate")) {
        return new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"verdict":"problem","reasoning":"has assumptions"}' }] } }] }),
          { status: 200 }
        );
      }
      if (system.includes("You are rewriting a casebook excerpt")) {
        // Simulates a quota/network error on the paraphrase call itself.
        return new Response(JSON.stringify({ error: { message: "quota exceeded" } }), { status: 429 });
      }
      throw new Error(`unexpected generateContent call: ${system.slice(0, 80)}`);
    }
    return new Response(JSON.stringify({}), { status: 200 });
  });

  const result = await getRandomGuesstimateProblem();

  assert.equal(result.available, true);
  assert.equal(result.problem, ERRORED_ROW_CONTENT, "must fall back to the verbatim excerpt on a paraphrase call error");
  assert.equal(result.paraphrased, false);
  assert.equal(result.rawProblem, undefined);
});

const FLAG_OFF_ROW_CONTENT =
  "# NUMBER OF TYRES SOLD IN INDIA PER YEAR\n\nASSUMPTIONS\n\n1. India has 25 crore vehicles.";

test("getRandomGuesstimateProblem: flag off returns the verbatim excerpt, no paraphrase call attempted, no new keys", async t => {
  delete process.env.ENABLE_GUESSTIMATE_PARAPHRASE;
  const { getRandomGuesstimateProblem } = await import(`../src/lib/guesstimateRetrieval.js?v=${Math.random()}`);
  const trackRewriteCalls = { count: 0 };
  installFakeFetch(t, { content: FLAG_OFF_ROW_CONTENT, trackRewriteCalls });

  const result = await getRandomGuesstimateProblem();

  assert.equal(result.available, true);
  assert.equal(result.problem, FLAG_OFF_ROW_CONTENT);
  assert.equal(trackRewriteCalls.count, 0, "no paraphrase call should be attempted at all when the flag is off");
  assert.deepEqual(Object.keys(result).sort(), ["available", "citation", "hasDiagram", "problem"].sort());
});

// FIN1.01: conservative diagram-authoring gate for the finance compendium, mirroring
// consultingRetrieval.js's paraphrase-faithfulness shape (one proposal call, one pure
// vote-counter, a 3-vote judge wrapper, a cache-free top-level orchestrator) but for
// *authoring* a `placewise-diagram` block from prose instead of *transcribing* one from a
// page image (diagram-transcription skill) or *paraphrasing* existing prose
// (consultingRetrieval.js). This runs once per topic during a one-off ingestion run, not
// per live request, so no cache/singleFlight layer is needed here (contrast
// consultingRetrieval.js's paraphraseCache).
//
// Conservative by construction (FIN1 plan Decisions #4): the proposal prompt instructs the
// model to decline (`{"diagram": null}`) unless the text already lays out a concrete,
// explicit structure, and a second, independent faithfulness judge (3-vote majority,
// fail-closed) is a separate safety net on top - neither substitutes for the other. A
// declined proposal costs zero extra Gemini calls (the faithfulness judge is never called
// when nothing was proposed).
//
// Every exported I/O function takes an optional `{ generateJSONFn }` override (defaulting
// to the real `generateJSON` from gemini.js) purely so tests can inject a mock without any
// live network/Gemini call - this codebase has no existing ES-module mocking convention
// (checked: no prior test mocks `gemini.js`), so dependency injection is used here instead
// of reaching for an experimental `node:test` module-mock flag.

import { generateJSON } from "./gemini.js";

const KNOWN_DIAGRAM_TYPES = new Set(["issue_tree", "matrix", "funnel", "flow", "chart", "table", "other"]);

/**
 * Pure: does `value` look like one of the 6 `placewise-diagram` shapes (diagram-
 * transcription skill)? Minimal shape validation only - deep field correctness is the
 * faithfulness judge's job, not this function's. Returns false for null/non-object/unknown
 * type, so a malformed or declined response is never mistaken for a diagram.
 */
export function isValidDiagramShape(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (!KNOWN_DIAGRAM_TYPES.has(value.type)) return false;
  switch (value.type) {
    case "issue_tree":
      return value.root && typeof value.root === "object";
    case "matrix":
      return Array.isArray(value.cols) && Array.isArray(value.rows) && Array.isArray(value.cells);
    case "funnel":
      return Array.isArray(value.stages);
    case "flow":
      return Array.isArray(value.nodes) && Array.isArray(value.edges);
    case "chart":
      return typeof value.chart_kind === "string" && Array.isArray(value.series);
    case "table":
      return Array.isArray(value.header) && Array.isArray(value.rows);
    case "other":
      return typeof value.description === "string";
    default:
      return false;
  }
}

const PROPOSE_DIAGRAM_SYSTEM_PROMPT =
  "You are deciding whether a finance-compendium topic's prose already lays out a concrete " +
  "visual structure that can be redrawn as a diagram. You must be conservative: respond " +
  '{"diagram": null} UNLESS the text explicitly describes one of these 6 shapes as a ' +
  "numbered step sequence, an explicit comparison/matrix, an explicit hierarchy/tree, a " +
  "narrowing funnel, a process flow, or a chart with printed numbers:\n" +
  "- issue_tree: { \"type\":\"issue_tree\", \"title\":string|null, \"root\": { \"label\":string, " +
  "\"children\":[...] } }\n" +
  "- matrix: { \"type\":\"matrix\", \"title\":string|null, \"xAxis\":string, \"yAxis\":string, " +
  "\"cols\":[string], \"rows\":[string], \"cells\":[[string]] }\n" +
  "- funnel: { \"type\":\"funnel\", \"title\":string|null, \"stages\":[string] }\n" +
  "- flow: { \"type\":\"flow\", \"title\":string|null, \"nodes\":[{\"id\":string,\"label\":string}], " +
  "\"edges\":[{\"from\":string,\"to\":string,\"label\":string|null}] }\n" +
  "- chart: { \"type\":\"chart\", \"title\":string|null, \"chart_kind\":\"bar\"|\"line\"|\"pie\", " +
  "\"xLabel\":string, \"yLabel\":string, \"series\":[{\"name\":string,\"points\":[[string,number]]}] }\n" +
  "- table: { \"type\":\"table\", \"title\":string|null, \"header\":[string], \"rows\":[[string]] }\n\n" +
  "A topic merely BEING a framework, process or comparison in spirit (i.e. it 'sounds " +
  "frameworky') is NOT enough - the diagram's labels, steps, numbers and structure must " +
  "already appear explicitly, verbatim, in the text. Never invent, estimate, complete, " +
  "merge or correct a label or number that isn't in the text; copy exactly as printed, same " +
  "rule as transcribing a diagram from a page image. If you do find such a structure, " +
  'respond {"diagram": {...one shape above...}, "summary": "<1-3 plain-language sentences ' +
  'restating only what the diagram shows>"}.\n\n' +
  "Respond with ONLY a JSON object, no markdown fences, no commentary.";

/**
 * I/O: one `generateJSON` call deciding whether `topicContent`'s prose already lays out an
 * explicit diagram structure. Returns `null` (fail-closed) when the model declines, when
 * the JSON doesn't parse as one of the 6 known shapes (`isValidDiagramShape`), or on any
 * call error - a malformed response is treated as "no diagram", never retried, never an
 * error that propagates.
 */
export async function proposeDiagram(topicContent, { generateJSONFn = generateJSON } = {}) {
  try {
    const parsed = await generateJSONFn({
      system: PROPOSE_DIAGRAM_SYSTEM_PROMPT,
      prompt: `Topic text:\n"""${String(topicContent || "").slice(0, 6000)}"""\n\nDoes this text already lay out an explicit diagram structure?`,
      maxTokens: 1200,
      temperature: 0,
      feature: "financeDiagramAuthor-propose"
    });
    if (!parsed || parsed.diagram == null) return null;
    if (!isValidDiagramShape(parsed.diagram)) return null;
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    return { diagram: parsed.diagram, summary };
  } catch (err) {
    console.warn(`[financeDiagramAuthor] proposeDiagram failed, treating as no diagram: ${err.message}`);
    return null;
  }
}

// A different question from consultingRetrieval.js's FAITHFULNESS_SYSTEM_PROMPT - that one
// compares prose-vs-prose (a rewrite against its source excerpt); this compares a
// structured-JSON diagram against the prose it was supposedly built from. Kept as a fully
// separate prompt/call on purpose, never conflated.
const JUDGE_DIAGRAM_SYSTEM_PROMPT =
  "You are a strict grader checking whether a diagram, given as JSON, is faithful to a " +
  "source text. Every label, number and step in the diagram JSON must appear in the source " +
  "text. The diagram must not invent, merge, correct, complete, or omit a labelled element " +
  "that the text describes as part of the same structure. Minor rewording of a label that " +
  "preserves its exact meaning is acceptable; an added, dropped, or altered number, name or " +
  "step is not.\n\n" +
  'Respond with ONLY a JSON object, no markdown fences: {"verdict": "faithful" or ' +
  '"unfaithful", "reasoning": "one sentence explaining your judgment"}';

/**
 * I/O: one judge call, full detail (verdict + reasoning) - exported for the same reason
 * consultingRetrieval.js's judgeParaphraseFaithfulOnce is (so a future eval/report can do
 * its own voting with this exact prompt instead of maintaining a second copy).
 */
export async function judgeDiagramFaithfulOnce(topicContent, diagramJson, { generateJSONFn = generateJSON } = {}) {
  const parsed = await generateJSONFn({
    system: JUDGE_DIAGRAM_SYSTEM_PROMPT,
    prompt: `Source text:\n"""${String(topicContent || "").slice(0, 6000)}"""\n\nDiagram JSON:\n${JSON.stringify(diagramJson)}\n\nIs the diagram faithful to the source text?`,
    maxTokens: 200,
    temperature: 0,
    feature: "financeDiagramAuthor-faithfulness"
  });
  return { faithful: parsed.verdict === "faithful", reasoning: String(parsed?.reasoning || "") };
}

/**
 * Pure: the vote-counting decision itself, unit-testable with no network call - same shape
 * as consultingRetrieval.js's faithfulMajority.
 */
export function diagramFaithfulMajority(votes) {
  return votes.filter(Boolean).length >= 2;
}

/**
 * I/O: 3-call majority vote (>=2/3 "faithful"), same voting/fail-closed shape as
 * consultingRetrieval.js's judgeParaphraseFaithful - a failed call counts as "unfaithful"
 * (dropping the diagram and falling back to text-only is always safe; showing an unchecked
 * diagram is not).
 */
export async function judgeDiagramFaithful(topicContent, diagramJson, { generateJSONFn = generateJSON } = {}) {
  const votes = await Promise.all(
    [0, 1, 2].map(() =>
      judgeDiagramFaithfulOnce(topicContent, diagramJson, { generateJSONFn }).then(r => r.faithful).catch(err => {
        console.warn(`[financeDiagramAuthor] faithfulness judge call failed: ${err.message}`);
        return false;
      })
    )
  );
  return diagramFaithfulMajority(votes);
}

/**
 * I/O: top-level orchestrator. Proposes a diagram; if none was proposed, returns
 * `{ diagram: null, summary: null }` without spending a single faithfulness-judge call
 * (checking "is nothing faithful to the text" is meaningless and costs money for no
 * signal). If a diagram was proposed, gates it with the 3-vote faithfulness judge; a
 * faithful diagram is returned, an unfaithful one is dropped (text-only fallback, same
 * posture as consultingRetrieval.js's paraphrase-faithfulness fallback). Wrapped in
 * try/catch so one topic's diagram attempt can never crash an ingestion run.
 */
export async function authorAndVerifyDiagram(topicContent, { generateJSONFn = generateJSON } = {}) {
  try {
    const proposal = await proposeDiagram(topicContent, { generateJSONFn });
    if (!proposal) return { diagram: null, summary: null };

    const faithful = await judgeDiagramFaithful(topicContent, proposal.diagram, { generateJSONFn });
    if (!faithful) return { diagram: null, summary: null };

    return { diagram: proposal.diagram, summary: proposal.summary || null };
  } catch (err) {
    console.warn(`[financeDiagramAuthor] authorAndVerifyDiagram failed, falling back to text-only: ${err.message}`);
    return { diagram: null, summary: null };
  }
}

// One-off content pass, not a persistent API feature: simplifies jargon-heavy wording in
// the `frameworks` table (student-facing Frameworks page content) while a faithfulness judge
// guards against any technical precision loss. Same simplify + judge + fail-closed shape as
// the R7b paraphrase pipeline (src/lib/consultingRetrieval.js's paraphraseChunk /
// judgeParaphraseFaithful), purpose-built for "simplify, don't blur precision."
//
// v2: rewrites one WHOLE framework per call (not per field) - v1 processed each field/array
// item independently and the model re-defined the same basic term (e.g. "balance sheet")
// over and over in every sentence it appeared in, which read as more cluttered than the
// original, not simpler. Whole-framework context lets the model clarify a genuinely niche
// term once and leave MBA-level vocabulary (balance sheet, assets, cash flow) alone, since
// the audience already knows it - the actual complaint was about things like unexplained
// acronym-dense phrasing and precision-losing simplification, not basic terminology.
//
// Usage: node scripts/simplifyFrameworkJargon.js --domain Finance [--apply] [--limit N]
// Without --apply, this is a dry run: generates + judges, writes the diff report, touches
// no database row. With --apply, frameworks whose rewrite passes the judge are written;
// a framework that fails the judge is left exactly as it was (fail-closed).
//
// Reversibility: every run writes a full pre-change backup of the targeted rows to
// backups/ before any write, so `node scripts/restoreFrameworksBackup.js <file>` can revert
// in one step.

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { supabase } from "../src/lib/supabase.js";
import { generateJSON } from "../src/lib/gemini.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SCALAR_FIELDS = ["description", "example", "when_to_use", "when_not_to_use"];
const ARRAY_FIELDS = ["steps", "pitfalls"];

const SIMPLIFY_SYSTEM_PROMPT =
  "You are simplifying one MBA interview-prep framework (the Frameworks page) for a GENERAL " +
  "MBA audience, including students who are not on a finance/consulting track and are " +
  "reading this domain's content for the first time. Some readers have deep expertise here " +
  "and won't notice a difference either way - you're writing for the reader who doesn't.\n\n" +
  "Leave completely alone - this is the ONLY exempt list, nothing else is assumed familiar - " +
  "balance sheet, income statement, cash flow statement, assets, liabilities, equity, " +
  "revenue, profit/net income, debt, market, shares/stock. Never add a clarification for a " +
  "term on this exact list.\n\n" +
  "DO add one short inline clarification, the first time it appears, for EVERY OTHER " +
  "finance/valuation-specific term - named ratios, multiples, and metrics (EBITDA, EV, P/E, " +
  "WACC, CAPM, NPV, IRR, Beta); precise valuation concepts (fully diluted shares outstanding, " +
  "terminal value, enterprise value vs equity value); modeling/deal jargon (LBO, comps, " +
  "multiples, synergies); and any acronym not already spelled out nearby. These are exactly " +
  "the terms a general MBA reader (not on a finance track) would not already know, even " +
  "though a finance specialist reading the same text wouldn't notice they needed explaining - " +
  "you are writing for the reader who doesn't have that background, not the specialist. When " +
  "in doubt whether a term belongs on the exempt list above, it does not - clarify it.\n\n" +
  "Only clarify a given term the FIRST time it appears ANYWHERE in the framework (not every " +
  "time it recurs in a later field or step - the reader remembers a definition they just " +
  "read one field ago). If the same term appears again later, leave it bare. Always use " +
  "plain parentheses for a clarification, never square brackets, even when the clarified " +
  "term already sits inside another parenthetical - rephrase with a comma instead of " +
  "nesting a second bracket style (e.g. \"(DCF, a method valuing a company from its " +
  "projected future cash flows)\" not \"(DCF [a method valuing...])\"). Also fix convoluted " +
  "or run-on sentence structure that is harder to parse than it needs to be, even where no " +
  "term needs defining.\n\n" +
  "You must NOT drop, soften, or genericize a term where its specific technical meaning " +
  "matters for a correct interview answer - swapping a precise term for a vaguer everyday " +
  "one that means a different (or less specific) thing is not simplification, it is an " +
  "error. For example, \"fully diluted shares outstanding\" must NOT become \"shares " +
  "outstanding\" or \"total outstanding shares\" - those are a different, smaller number. " +
  "When a term is load-bearing like this, keep the term and, only if it is genuinely " +
  "unfamiliar to a general MBA audience, add one short clarification instead of replacing " +
  "it.\n\n" +
  "You must NOT introduce any claim, number, name, step or example not already present, and " +
  "must NOT drop one that is present. You may reorder sentences and simplify structure. If a " +
  "field already has no jargon worth simplifying, return it completely unchanged - most " +
  "fields in a given framework should need zero or minimal changes; only reach for a " +
  "clarification where a real barrier exists.\n\n" +
  "You will receive a JSON object with these fields: description, example, when_to_use, " +
  "when_not_to_use (strings), steps, pitfalls (arrays of strings). Respond with ONLY a JSON " +
  "object in the exact same shape, same field names, same array lengths - no markdown " +
  "fences, no commentary.";

const FAITHFUL_SYSTEM_PROMPT =
  "You are a strict grader checking a REWRITE of one MBA interview-prep framework (JSON with " +
  "description, example, when_to_use, when_not_to_use, steps, pitfalls) against the ORIGINAL. " +
  "Check: (1) faithfulness - no claim, number, name, step or example was added, dropped, or " +
  "changed, and every array has the same number of items in the same order; (2) precision - " +
  "no technical term was replaced with a less precise everyday term in a way that changes " +
  "its meaning (e.g. \"fully diluted shares outstanding\" weakened to \"shares outstanding\" " +
  "is a precision failure, even though it reads as simpler); (3) restraint - the rewrite did " +
  "not add a clarification for a term on this EXACT exempt list (the only terms assumed " +
  "familiar): balance sheet, income statement, cash flow statement, assets, liabilities, " +
  "equity, revenue, profit/net income, debt, market, shares/stock. Nothing outside this list " +
  "counts as 'basic' - a named ratio/multiple/metric (EBITDA, EV, WACC, CAPM, P/E, NPV, IRR, " +
  "Beta), an unspelled acronym, or a precise valuation concept (fully diluted shares " +
  "outstanding, terminal value, LBO, comps) getting ONE clarification the first time it " +
  "appears is CORRECT and must PASS - do not fail a rewrite for clarifying a real " +
  "finance/valuation term just because it is well known to a finance specialist; the " +
  "audience is general MBA students, not specialists. Only fail restraint for: clarifying a " +
  "term actually on the exempt list above, or re-defining the same term more than once.\n\n" +
  'Respond with ONLY a JSON object, no markdown fences: {"verdict": "pass" or "fail", ' +
  '"reasoning": "one or two sentences, name the specific problem if it fails"}';

function extractFrameworkFields(row) {
  const out = {};
  for (const f of SCALAR_FIELDS) out[f] = row[f] ?? "";
  for (const f of ARRAY_FIELDS) out[f] = row[f] ?? [];
  return out;
}

function shapeMatches(original, rewritten) {
  if (!rewritten || typeof rewritten !== "object") return false;
  for (const f of SCALAR_FIELDS) {
    if (typeof rewritten[f] !== "string") return false;
  }
  for (const f of ARRAY_FIELDS) {
    if (!Array.isArray(rewritten[f]) || rewritten[f].length !== (original[f] || []).length) return false;
  }
  return true;
}

const MAX_ATTEMPTS = 6;

// Feeds the judge's own reasoning back into the next rewrite attempt (not a blind retry) -
// the judge almost always names a specific, fixable problem ("re-defined X twice",
// "clarified an exempt term"), so a targeted second pass is much more likely to pass than
// another independent sample at the same temperature would be.
async function simplifyFramework(row) {
  const original = extractFrameworkFields(row);
  let priorFeedback = "";
  let lastJudge = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const prompt = priorFeedback
      ? `Framework name: ${row.name}\n\nJSON to simplify:\n${JSON.stringify(original, null, 2)}\n\n` +
        `Your previous attempt was rejected for this reason: "${priorFeedback}". Produce a new rewrite that fixes exactly that problem.`
      : `Framework name: ${row.name}\n\nJSON to simplify:\n${JSON.stringify(original, null, 2)}`;

    const rewritten = await generateJSON({
      system: SIMPLIFY_SYSTEM_PROMPT,
      prompt,
      maxTokens: 1800,
      temperature: 0.3,
      feature: "simplifyFrameworkJargon-rewrite"
    });

    if (!shapeMatches(original, rewritten)) {
      lastJudge = { verdict: "fail", reasoning: "rewrite shape mismatch" };
      priorFeedback = "the response didn't match the required JSON shape (same fields, same array lengths)";
      continue;
    }

    const judged = await generateJSON({
      system: FAITHFUL_SYSTEM_PROMPT,
      prompt: `Original:\n${JSON.stringify(original, null, 2)}\n\nRewrite:\n${JSON.stringify(rewritten, null, 2)}\n\nDoes the rewrite pass?`,
      maxTokens: 250,
      temperature: 0,
      feature: "simplifyFrameworkJargon-judge"
    });
    lastJudge = judged;

    if (judged.verdict === "pass") {
      const fields = {};
      for (const f of [...SCALAR_FIELDS, ...ARRAY_FIELDS]) {
        const before = JSON.stringify(original[f]);
        const after = JSON.stringify(rewritten[f]);
        if (before !== after) fields[f] = { before: original[f], after: rewritten[f] };
      }
      return {
        changed: Object.keys(fields).length > 0,
        update: Object.fromEntries(Object.keys(fields).map(f => [f, rewritten[f]])),
        diff: { id: row.id, name: row.name, judgeVerdict: "pass", judgeReasoning: judged.reasoning, attempts: attempt + 1, fields }
      };
    }
    priorFeedback = judged.reasoning;
  }

  return {
    changed: false,
    update: {},
    diff: { id: row.id, name: row.name, judgeVerdict: "fail", judgeReasoning: lastJudge?.reasoning, attempts: MAX_ATTEMPTS, fields: {} }
  };
}

async function main() {
  const args = process.argv.slice(2);
  const domain = args.find((a, i) => args[i - 1] === "--domain") || null;
  const apply = args.includes("--apply");
  const limitArg = args.find((a, i) => args[i - 1] === "--limit");
  const limit = limitArg ? Number(limitArg) : null;
  const nameFilter = args.find((a, i) => args[i - 1] === "--name") || null;

  let query = supabase.from("frameworks").select("*").order("name");
  if (domain) query = query.eq("domain", domain);
  if (nameFilter) query = query.ilike("name", `%${nameFilter}%`);
  const { data: rows, error } = await query;
  if (error) throw new Error(`fetch failed: ${error.message}`);
  const targets = limit ? rows.slice(0, limit) : rows;

  console.log(`[simplify] ${targets.length} framework(s)${domain ? ` in ${domain}` : ""}, apply=${apply}`);

  const backupDir = path.join(__dirname, "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(backupDir, `frameworks-${domain || "all"}-pre-simplify-${stamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(targets, null, 2));
  console.log(`[simplify] backup written: ${backupFile}`);

  const allDiffs = [];
  let changedCount = 0;

  for (const row of targets) {
    console.log(`[simplify] ${row.name}...`);
    const { changed, update, diff } = await simplifyFramework(row);
    allDiffs.push(diff);
    if (changed) changedCount++;

    if (apply && changed) {
      const { error: updateError } = await supabase.from("frameworks").update(update).eq("id", row.id);
      if (updateError) console.warn(`[simplify] UPDATE FAILED for ${row.name}: ${updateError.message}`);
      else console.log(`[simplify] applied ${Object.keys(update).length} field(s) to ${row.name}`);
    } else if (!changed) {
      console.log(`[simplify] ${row.name}: no change (${diff.skipped || diff.judgeVerdict || "n/a"})`);
    }
  }

  const reportFile = path.join(__dirname, "backups", `frameworks-${domain || "all"}-diff-${stamp}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(allDiffs, null, 2));

  console.log(`\n[simplify] done. ${changedCount}/${targets.length} framework(s) changed.`);
  console.log(`[simplify] diff report: ${reportFile}`);
  console.log(`[simplify] backup (for revert): ${backupFile}`);
  if (!apply) console.log("[simplify] DRY RUN - no database rows were written. Re-run with --apply to write.");
}

main().catch(err => {
  console.error("[simplify] fatal:", err);
  process.exit(1);
});

// Phase 1.7 item 6: generates and caches role overview, topics, chip panels
// (What/Why/How on the first point of each of the 4 topics - 12 panels per
// role, matching exactly what the Phase 1.6 test matrix exercised) and
// skill concepts (for the role's first listed skill) for every role in
// ROLE_CATALOG. Company-agnostic only - no role-at-company or company-notes
// generation, since those are keyed per company and there's no fixed company
// list to prewarm against.
//
// BUILT, NOT RUN. Per Phase 1.7's instruction, this script is never invoked
// automatically - a human runs `npm run prewarm-roles` deliberately. Dry-run
// first with --estimate-only to see the projected call count before spending
// anything.
//
// Resumability: every generate* function this script calls already checks
// its own cache (role_overview_cache/role_topics_cache/chip_panel_cache/
// skill_content_cache) at the current CONTENT_VERSION before generating -
// calling them is itself the "skip if already cached" behavior, no separate
// bookkeeping needed. Re-running this script after an interruption just
// re-walks the role list and no-ops on everything already warm.
//
// Rate limiting: a fixed delay between each logical sub-task (not each raw
// LLM call - these functions each make several), computed from
// PREWARM_RPM. Hard stop: the running call count (read from llm_call_log,
// the same table every call already logs to) is checked BEFORE starting
// each role; once it's at or past MAX_TOTAL_CALLS, no new role is started.
// This can't interrupt a role already in progress (there's no sub-call-level
// hook into gemini.js), so a run can exceed the cap by at most one role's
// worth of calls - documented here rather than silently assumed exact.
import { supabase } from "../src/lib/supabase.js";
import { ROLE_CATALOG } from "../src/lib/roles.js";
import { getRoleOverview } from "../src/lib/roleOverview.js";
import { getRoleTopics } from "../src/lib/roleTopics.js";
import { getChipPanel } from "../src/lib/chipPanel.js";
import { getSkillMeta } from "../src/lib/skillContent.js";

const PREWARM_RPM = parseInt(process.env.PREWARM_RPM || "20", 10); // requests per minute, configurable
const MAX_TOTAL_CALLS = parseInt(process.env.PREWARM_MAX_TOTAL_CALLS || "2000", 10); // hard stop, configurable
const SUB_TASK_DELAY_MS = Math.ceil(60000 / PREWARM_RPM);
const ESTIMATE_ONLY = process.argv.includes("--estimate-only");

// Measured from the Phase 1.6 test matrix (post Phase 1.7 reduction,
// re-measured on Data Analyst/Operations Manager - see the Phase 1.7
// report for the exact before/after numbers) - used only to print an
// upfront estimate, not to enforce the actual stop (llm_call_log is the
// real source of truth for that).
const ESTIMATED_CALLS_PER_ROLE = 25;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function totalCallsSoFarToday() {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from("llm_call_log")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since.toISOString());
  if (error) throw error;
  return count || 0;
}

function whatPrompt(role, topic, blockText) {
  return `You are coaching a candidate preparing for a ${role} interview, on the topic "${topic}". Define plainly what this actually means: "${blockText}". Start with a one-sentence definition in everyday language, then say what it covers and what it does not. Keep it under 120 words. Definition only - do not explain why it matters or how to apply it. Reply in plain prose with no Markdown formatting - do not use #, *, backticks, or bullet characters. Numbered steps written as '1.' on their own line are fine.`;
}
function whyPrompt(role, topic, blockText) {
  return `You are coaching a candidate preparing for a ${role} interview. They want a deeper explanation of this specific point from their "${topic}" prep material: "${blockText}". Explain it more simply, with one concrete example. Keep it under 150 words. Don't just repeat the original line - add real depth. Reply in plain prose with no Markdown formatting - do not use #, *, backticks, or bullet characters. Numbered steps written as '1.' on their own line are fine.`;
}
function howPrompt(role, topic, blockText) {
  return `You are coaching a candidate preparing for a ${role} interview, on the topic "${topic}". Show them exactly how to carry this out in a live interview: "${blockText}". Give a short numbered sequence of the steps they would say out loud, then one worked mini-example applied to a realistic prompt. Keep it under 180 words and practical - no definitions, no theory. Reply in plain prose with no Markdown formatting - do not use #, *, backticks, or bullet characters. Numbered steps written as '1.' on their own line are fine.`;
}

async function prewarmOneRole(entry, log) {
  const { name: role } = entry;
  log(`--- ${role} (${entry.domain}) ---`);

  await sleep(SUB_TASK_DELAY_MS);
  const overview = await getRoleOverview(role);
  log(`  overview: ${overview.cached ? "cached" : "generated"}`);

  await sleep(SUB_TASK_DELAY_MS);
  const { topics, cached: topicsCached } = await getRoleTopics(role);
  log(`  topics: ${topicsCached ? "cached" : "generated"} (${topics.length} topics)`);

  for (const topic of topics) {
    const blockText = Array.isArray(topic.points) && topic.points.length ? topic.points[0] : null;
    if (!blockText) continue;
    const blockId = "point-0";
    for (const [mode, builder] of [["what", whatPrompt], ["why", whyPrompt], ["how", howPrompt]]) {
      await sleep(SUB_TASK_DELAY_MS);
      const prompt = builder(role, topic.name, blockText);
      const panel = await getChipPanel({ role, topic: topic.name, blockId, mode, prompt });
      log(`  panel ${topic.name} / ${mode}: ${panel.cached ? "cached" : "generated"}`);
    }
  }

  const firstSkill = (overview.skills || [])[0];
  if (firstSkill) {
    await sleep(SUB_TASK_DELAY_MS);
    const meta = await getSkillMeta(role, firstSkill);
    log(`  skill concepts (${firstSkill}): ${meta.cached ? "cached" : "generated"}`);
  } else {
    log(`  skill concepts: skipped (no skills listed on overview)`);
  }
}

async function main() {
  const totalRoles = ROLE_CATALOG.length;
  const estimatedTotal = totalRoles * ESTIMATED_CALLS_PER_ROLE;
  console.log(`Pre-warm plan: ${totalRoles} roles x ~${ESTIMATED_CALLS_PER_ROLE} calls/role (estimated) = ~${estimatedTotal} calls for a full cold run.`);
  console.log(`Rate limit: ${PREWARM_RPM} requests/min (${SUB_TASK_DELAY_MS}ms between sub-tasks). Hard stop: ${MAX_TOTAL_CALLS} total calls today.`);
  console.log(`Roles already cached at the current CONTENT_VERSION are skipped automatically (no extra calls) - a partial/resumed run costs less than the full estimate above.`);

  if (ESTIMATE_ONLY) {
    console.log("\n--estimate-only: stopping here, no calls made.");
    return;
  }

  let startingCalls = await totalCallsSoFarToday();
  console.log(`\nStarting. ${startingCalls} LLM calls already logged today (platform-wide, not just this script).`);

  let rolesProcessed = 0;
  for (const entry of ROLE_CATALOG) {
    const before = await totalCallsSoFarToday();
    if (before - startingCalls >= MAX_TOTAL_CALLS) {
      console.log(`\nHARD STOP: ${before - startingCalls} calls made by this run, at or past MAX_TOTAL_CALLS=${MAX_TOTAL_CALLS}. Stopping before starting "${entry.name}". Re-run later to resume (already-warm roles are skipped for free).`);
      break;
    }
    try {
      await prewarmOneRole(entry, (msg) => console.log(msg));
    } catch (err) {
      console.warn(`  FAILED on "${entry.name}": ${err.message} - continuing with the next role.`);
    }
    rolesProcessed++;
    const after = await totalCallsSoFarToday();
    console.log(`  running total this run: ${after - startingCalls} calls`);
  }

  console.log(`\nDone. ${rolesProcessed}/${totalRoles} roles processed this run.`);
}

main().catch(err => { console.error("FATAL", err); process.exit(1); });

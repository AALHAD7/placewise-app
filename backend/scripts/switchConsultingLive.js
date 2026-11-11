// R9.2: the actual "switch" for the 9 R6-completed Consulting casebooks.
//
// ⚠️ High-stakes: this writes to the SHARED PRODUCTION DATABASE (`ingest_chunks`), the
// same table `match_ingest_chunks` (migration_042/044) reads with `where is_active = true`
// the instant ENABLE_CONSULTING_RAG_V2 is on. This script only flips `is_active` - it does
// not touch that flag (that's plan 3, deliberately separate) - but treat it with the same
// care as a schema migration. Never delete rows, only toggle the column.
//
// Modes (process.argv):
//   (none)       dry-run - prints before-state only, makes NO writes. Safe to run anytime.
//   --apply      sets is_active=true for all ingest_chunks rows where document_id in DOC_IDS.
//   --rollback   sets is_active=false for the same set (reverts ALL 9, including SRCC).
//
// Idempotent: safe to run --apply or --rollback repeatedly, and safe against SRCC
// (ab676b81-3b29-4c35-b288-6dff71756e26) already being is_active=true from the 2026-11-02
// one-off test (see log.md) - this script supersedes that partial switch; after --apply,
// SRCC's state is governed by this script like the other 8, not the earlier test.
//
// One `.update().in("document_id", DOC_IDS)` call per mode - no row-by-row loop, matching
// the SRCC precedent (log.md, 2026-11-02 "First real is_active=true switch").

import "dotenv/config";
import { supabase } from "../src/lib/supabase.js";

// Every Consulting casebook R6 completed, is_active=false until this switch (except SRCC,
// already active from the 2026-11-02 one-off test). Copied verbatim from
// backend/eval/run_eval_v2_preview.js's DOC_IDS - same list, same comments on why these 9
// and not the 2 skipped FMS casebooks (FMS Consulting Club 2025-26, FMS 2024-25 - Aalhad's
// call, "we have enough data for consulting now", see log.md R6).
const DOC_IDS = [
  "e9229429-3eec-478b-b54a-7d5a1cdf6de0", // The FMS Consulting Casebook 2021-22, v3
  "0a6c4f9e-b1bd-4bf8-bbee-7475ba8a6c14", // ISB Consulting Casebook 2025, v2
  "17a7c482-5181-423c-b8d5-44f79e90e392", // IIM B Consulting Casebook 2025, v2
  "6ae47aaa-ad2e-4848-9775-75ac2072f79e", // IIMK Kasebook 2025, v2
  "ab676b81-3b29-4c35-b288-6dff71756e26", // SRCC Guesstimates-Book-Volume-1-6, v2
  "fa763d15-dac2-408f-9228-8a5f34785128", // IIM L Consulting Casebook 2025, v1
  "f2c1333f-b205-46fa-991e-551548dffef7", // IIM Calcutta Consulting CaseBook 2025-26, v2
  "09c41590-6f53-40be-a19c-60fa645610f4", // IIMA-Consult-Prep-Book-Case-Book-2025-26, v2
  "faa13328-c4bc-4ed7-8172-6ec5ba38c162"  // The FMS Consulting CaseBook 2023-24, v6
];

// 2026-11-11 incident: a live rollback/apply test (run to verify this script, per R9's
// "rollback tested" done-when) proved that --apply unconditionally sets is_active=true for
// EVERY row in DOC_IDS, with no memory of rows that were surgically deactivated afterward for
// content-quality reasons (not part of the original switch-over). That silently undid 10
// known-bad SRCC Guesstimates-book chunks (2 cheat-sheet-dump rows from the 2026-11-07 R9.3
// incident, 8 concatenation/truncation rows from the same day's follow-up fix - see log.md) -
// restored by hand afterward, cross-checked against log.md's page ranges. --apply now excludes
// this list so a future rollback/apply cycle can't reintroduce the same bug.
// KNOWN GAP: the live row count before the 2026-11-11 test was 57 active/12 inactive for SRCC,
// but only 10 inactive IDs are documented in log.md (59/10) - 2 more rows were deactivated
// between 2026-11-07 and 2026-11-11 with no log.md entry found. Those 2 IDs are NOT in this
// list because they are unknown, and were unintentionally reactivated by the 2026-11-11 test.
// Aalhad: if you know what those 2 rows were, add them here and re-deactivate them; otherwise
// this is a known, flagged gap, not a silent one.
const EXCLUDED_CHUNK_IDS = [
  "2da998b5-2055-4c48-bf36-2cab37435591", // SRCC p1-4, cheat-sheet-dump merge (R9.3)
  "f4185c4a-321c-423a-bb2a-617d270a98e1", // SRCC p9-12, cheat-sheet-dump merge (R9.3)
  "eb4272dc-d0a8-4896-b622-742f9312119b", // SRCC p26-28, 2 problems concatenated
  "912ed1ed-a641-4a6d-a691-3ca529f295bb", // SRCC p35-36, 2 problems concatenated
  "06d23f19-f23f-4bde-a57a-28d512d41e28", // SRCC p44-45, 2 problems concatenated
  "f55ca214-e436-4090-b0d6-40d80dd9e1be", // SRCC p47-50, 2nd problem truncated mid-assumption
  "efe311a9-44c3-4ca1-8ac7-07b84f256fc3", // SRCC p51-52, 2nd problem truncated mid-assumption
  "661a8e35-0ef3-49b4-845a-55bfe08dff73", // SRCC p55-57, truncated duplicate (real copy elsewhere)
  "84e55de3-8f34-4bc9-b332-e7094b9c8112", // SRCC p28-29, orphan fragment, no diagram/answer
  "df90c84b-f906-4834-ae01-7d6868226f2e", // SRCC p29, duplicate orphan fragment
];

function fail(message, err) {
  console.error(`[switchConsultingLive] ${message}`);
  if (err) console.error(err);
  process.exitCode = 1;
}

// SELECT document_id, is_active, count(*) grouped by (document_id, is_active) for the 9
// DOC_IDS. Supabase JS has no server-side GROUP BY and its default page size (1000) would
// silently truncate a raw row pull for a pool this size (3800+ rows across 9 documents) -
// so this issues one exact head-count query per (document_id, is_active) pair (18 total)
// instead of pulling and grouping raw rows client-side.
async function fetchGroupedState() {
  const rows = [];
  for (const document_id of DOC_IDS) {
    for (const is_active of [true, false]) {
      const { count, error } = await supabase
        .from("ingest_chunks")
        .select("id", { count: "exact", head: true })
        .eq("document_id", document_id)
        .eq("is_active", is_active);
      if (error) throw error;
      if (count > 0) rows.push({ document_id, is_active, count });
    }
  }
  return rows;
}

// Single not.in filter query - no client-side full-table-scan diff.
async function countStrayActiveOutsideDocIds() {
  const { count, error } = await supabase
    .from("ingest_chunks")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .not("document_id", "in", `(${DOC_IDS.join(",")})`);
  if (error) throw error;
  return count ?? 0;
}

function printState(label, rows, strayCount) {
  console.log(`\n--- ${label} ---`);
  console.table(rows.map(r => ({ document_id: r.document_id, is_active: r.is_active, count: r.count })));
  console.log(`Stray active rows outside the 9 DOC_IDS: ${strayCount} (expect 0)`);
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const rollback = args.includes("--rollback");

  if (apply && rollback) {
    fail("Pass only one of --apply or --rollback, not both.");
    return;
  }

  console.log(`[switchConsultingLive] Mode: ${apply ? "APPLY (is_active=true)" : rollback ? "ROLLBACK (is_active=false)" : "DRY-RUN (no writes)"}`);
  console.log(`[switchConsultingLive] DOC_IDS (${DOC_IDS.length}):`, DOC_IDS);

  let before, beforeStray;
  try {
    before = await fetchGroupedState();
    beforeStray = await countStrayActiveOutsideDocIds();
  } catch (err) {
    fail("Failed to read before-state.", err);
    return;
  }
  printState("BEFORE", before, beforeStray);

  if (!apply && !rollback) {
    console.log("\n[switchConsultingLive] Dry-run only - no writes made. Pass --apply or --rollback to act.");
    return;
  }

  const targetActive = apply; // true for --apply, false for --rollback

  // --apply must never resurrect a chunk that was surgically deactivated afterward for
  // content-quality reasons (see EXCLUDED_CHUNK_IDS above) - exclude those from the write.
  // --rollback intentionally still deactivates everything, EXCLUDED_CHUNK_IDS included:
  // "off" means off.
  let query = supabase.from("ingest_chunks").update({ is_active: targetActive }).in("document_id", DOC_IDS);
  if (apply && EXCLUDED_CHUNK_IDS.length) {
    query = query.not("id", "in", `(${EXCLUDED_CHUNK_IDS.join(",")})`);
  }
  const { error: updateError, count: updatedCount } = await query.select("id", { count: "exact" });

  if (updateError) {
    fail(`Update failed (mode=${apply ? "--apply" : "--rollback"}).`, updateError);
    return;
  }

  let after, afterStray;
  try {
    after = await fetchGroupedState();
    afterStray = await countStrayActiveOutsideDocIds();
  } catch (err) {
    fail("Update succeeded but failed to read after-state.", err);
    return;
  }
  printState("AFTER", after, afterStray);

  console.log(`\n[switchConsultingLive] Rows touched by this update call: ${updatedCount ?? "unknown (count not returned)"}`);
  console.log(`[switchConsultingLive] Done. Mode=${apply ? "--apply" : "--rollback"}, target is_active=${targetActive}.`);
}

main().catch(err => fail("Unexpected error.", err));

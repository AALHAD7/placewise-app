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

  const { error: updateError, count: updatedCount } = await supabase
    .from("ingest_chunks")
    .update({ is_active: targetActive })
    .in("document_id", DOC_IDS)
    .select("id", { count: "exact" });

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

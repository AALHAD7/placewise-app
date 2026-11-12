// D1 switch-over: the actual "switch" for the PM compendium document (159 chunks,
// source_class='placewise_reference', domain='Prodman').
//
// ⚠️ High-stakes: this writes to the SHARED PRODUCTION DATABASE (`ingest_chunks`), the same
// table `match_ingest_chunks` reads with `where is_active = true`. This script only flips
// `is_active` - it does not touch `ENABLE_PM_RAG_V2` (that flag is set on Render separately,
// same split as Consulting's R9 switch-over) - but treat it with the same care as a schema
// migration. Never delete rows, only toggle the column. Pattern copied from
// `switchConsultingLive.js` (R9.2) - same shape, same safety checks, PM-specific DOC_IDS.
//
// Modes (process.argv):
//   (none)       dry-run - prints before-state only, makes NO writes. Safe to run anytime.
//   --apply      sets is_active=true for all ingest_chunks rows where document_id in DOC_IDS.
//   --rollback   sets is_active=false for the same set.

import "dotenv/config";
import { supabase } from "../src/lib/supabase.js";

// The single PM compendium document D1.2 ingested (2026-11-11). Only one document today,
// unlike Consulting's 9 - kept as an array for the same shape/future-proofing if a second
// PM-domain document is ever added.
const DOC_IDS = [
  "8976a3ed-b80f-4c4c-aefc-217575984824" // PM_Compendium.md, source_class=placewise_reference, domain=Prodman
];

function fail(message, err) {
  console.error(`[switchPmLive] ${message}`);
  if (err) console.error(err);
  process.exitCode = 1;
}

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

// `domain` lives on ingest_documents, not ingest_chunks - look up every Prodman-domain
// document id first, then check for active ingest_chunks rows outside DOC_IDS among those.
async function countStrayActiveOutsideDocIds() {
  const { data: prodmanDocs, error: docsError } = await supabase
    .from("ingest_documents")
    .select("id")
    .eq("domain", "Prodman");
  if (docsError) throw docsError;

  const otherProdmanDocIds = (prodmanDocs || [])
    .map(d => d.id)
    .filter(id => !DOC_IDS.includes(id));
  if (otherProdmanDocIds.length === 0) return 0;

  const { count, error } = await supabase
    .from("ingest_chunks")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .in("document_id", otherProdmanDocIds);
  if (error) throw error;
  return count ?? 0;
}

function printState(label, rows, strayCount) {
  console.log(`\n--- ${label} ---`);
  console.table(rows.map(r => ({ document_id: r.document_id, is_active: r.is_active, count: r.count })));
  console.log(`Stray active Prodman-domain rows outside DOC_IDS: ${strayCount} (expect 0)`);
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const rollback = args.includes("--rollback");

  if (apply && rollback) {
    fail("Pass only one of --apply or --rollback, not both.");
    return;
  }

  console.log(`[switchPmLive] Mode: ${apply ? "APPLY (is_active=true)" : rollback ? "ROLLBACK (is_active=false)" : "DRY-RUN (no writes)"}`);
  console.log(`[switchPmLive] DOC_IDS (${DOC_IDS.length}):`, DOC_IDS);

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
    console.log("\n[switchPmLive] Dry-run only - no writes made. Pass --apply or --rollback to act.");
    return;
  }

  const targetActive = apply;

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

  console.log(`\n[switchPmLive] Rows touched by this update call: ${updatedCount ?? "unknown (count not returned)"}`);
  console.log(`[switchPmLive] Done. Mode=${apply ? "--apply" : "--rollback"}, target is_active=${targetActive}.`);
}

main().catch(err => fail("Unexpected error.", err));

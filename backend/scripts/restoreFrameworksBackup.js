// One-step revert for scripts/simplifyFrameworkJargon.js --apply runs. Restores every row
// in the given backup file to exactly its pre-simplification values.
//
// Usage: node scripts/restoreFrameworksBackup.js <backups/frameworks-*-pre-simplify-*.json>

import "dotenv/config";
import fs from "node:fs";
import { supabase } from "../src/lib/supabase.js";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/restoreFrameworksBackup.js <backup-file.json>");
  process.exit(1);
}

const rows = JSON.parse(fs.readFileSync(file, "utf8"));
console.log(`[restore] restoring ${rows.length} framework(s) from ${file}`);

for (const row of rows) {
  const { id, ...fields } = row;
  const { error } = await supabase.from("frameworks").update(fields).eq("id", id);
  if (error) console.warn(`[restore] FAILED for ${row.name} (${id}): ${error.message}`);
  else console.log(`[restore] restored ${row.name}`);
}

console.log("[restore] done.");

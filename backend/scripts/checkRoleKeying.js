// Phase 1.6 role-keying rule enforcement (see the header comment in
// src/lib/roles.js). Run before committing a new migration file:
//   npm run check-role-keying
//
// Scans migration files numbered 035 and up (the role-keying rule took
// effect in migration_035 - everything before it is pre-rule and exempt,
// including the many legitimately name-keyed caches from before this rule
// existed) for `create table` statements that define a role-ish text
// column (role, role_name) without also defining a role_id column in the
// same file. A table ALTERed to add role_id in a later migration (like
// mock_interview_sessions in migration_035 itself) is also exempt via
// ALTER_ROLE_ID_RE below - this is a single-pass, per-file heuristic, not a
// cross-migration schema simulator.
//
// This is a heuristic grep, not a SQL parser - it is deliberately simple
// and meant to be read when it fires, not trusted blindly.
import { readdirSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, "..", "db");

// The rule applies from this migration number onward (see src/lib/roles.js
// header comment). Earlier migrations predate it entirely and are skipped,
// not allowlisted table-by-table.
const RULE_EFFECTIVE_FROM = 35;

const ROLE_COLUMN_RE = /^\s*(role|role_name)\s+text\b/im;
const ROLE_ID_COLUMN_RE = /^\s*role_id\s+text\b/im;
const CREATE_TABLE_RE = /create table\s+(?:if not exists\s+)?(\w+)\s*\(([\s\S]*?)\n\);/gi;

function migrationNumber(filename) {
  const m = filename.match(/^migration_(\d+)_/);
  return m ? parseInt(m[1], 10) : null;
}

function check() {
  const files = readdirSync(DB_DIR)
    .filter((f) => f.endsWith(".sql"))
    .filter((f) => {
      const n = migrationNumber(f);
      return n !== null && n >= RULE_EFFECTIVE_FROM;
    });
  const violations = [];

  for (const file of files) {
    const sql = readFileSync(path.join(DB_DIR, file), "utf8");
    // A table given role_id via ALTER TABLE in this same file (e.g. an
    // existing pre-rule table being brought into compliance) is compliant
    // even though CREATE TABLE itself doesn't show it.
    const alteredTables = new Set(
      [...sql.matchAll(/alter table\s+(\w+)\s+add column(?: if not exists)?\s+role_id\s+text/gi)].map((m) => m[1])
    );

    let match;
    while ((match = CREATE_TABLE_RE.exec(sql))) {
      const [, tableName, body] = match;
      if (alteredTables.has(tableName)) continue;
      const hasRoleColumn = ROLE_COLUMN_RE.test(body);
      const hasRoleId = ROLE_ID_COLUMN_RE.test(body);
      if (hasRoleColumn && !hasRoleId) {
        violations.push({ file, tableName });
      }
    }
  }

  if (violations.length) {
    console.error(`ROLE-KEYING CHECK FAILED (migrations >= ${RULE_EFFECTIVE_FROM}) - these tables define a role/role_name text column with no role_id column:\n`);
    for (const v of violations) {
      console.error(`  ${v.file}: table "${v.tableName}"`);
    }
    console.error("\nAdd a role_id column (see src/lib/roles.js's roleIdFor()) before committing this migration.");
    process.exit(1);
  }

  console.log(`check-role-keying: OK (${files.length} migration files >= ${RULE_EFFECTIVE_FROM} scanned, 0 violations).`);
}

check();

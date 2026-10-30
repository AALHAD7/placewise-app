import { supabase } from "./supabase.js";

// Phase 1.5 item 4: word-boundary, alias-aware, exclusion-filtered company
// mention matching - replaces Phase 1's plain `content.includes(companyName)`
// substring check, which would both miss real mentions under a different
// name/abbreviation (a casebook saying "BCG" never matches a company typed
// as "Boston Consulting Group") and over-count false hits where the company
// name collides with a framework/common word (e.g. "BCG matrix").

// Generic, not specific to the current 36 seeded aliases - the user's own
// worked examples (BCG matrix, McKinsey 7S, Porter's Five Forces, Amazon as
// a geography, Apple/Shell as common words) plus the same pattern extended
// to a few more frequently-colliding names. Apple/Shell are not currently
// seeded as companies (not in the dropdown or the corpus scan), but are
// kept here so adding either later is safe by default rather than a silent
// over-count gap.
export const EXCLUSION_PHRASES = [
  "bcg matrix", "bcg growth-share matrix", "growth-share matrix", "growth share matrix",
  "mckinsey 7s", "mckinsey's 7s", "7s framework",
  "porter's five forces", "porters five forces", "porter five forces", "porter's 5 forces",
  "amazon rainforest", "amazon basin", "amazon river", "amazon jungle", "amazon delta",
  "apple pie", "apple a day", "big apple", "apple of", "apple orchard",
  "shell company", "shell corporation", "shell script", "shell scripting", "command shell"
];

let aliasCache = null;
export async function loadCompanyAliases() {
  if (aliasCache) return aliasCache;
  const { data, error } = await supabase.from("company_aliases").select("canonical_name, alias");
  if (error) throw error;
  const byCanonical = new Map();
  for (const row of data || []) {
    const list = byCanonical.get(row.canonical_name) || [];
    list.push(row.alias);
    byCanonical.set(row.canonical_name, list);
  }
  aliasCache = byCanonical;
  return byCanonical;
}

// Returns every alias (including the canonical name) for whichever company
// group `typedName` belongs to - matched against the alias table itself
// case-insensitively, so typing "BCG" resolves to the same alias group as
// typing "Boston Consulting Group". Falls back to [typedName] when the
// company isn't seeded, so matching still works (just without alias
// expansion) for a company a user free-typed that isn't in the table.
export async function resolveAliasGroup(typedName) {
  const byCanonical = await loadCompanyAliases();
  const needle = typedName.trim().toLowerCase();
  for (const [, aliases] of byCanonical) {
    if (aliases.some(a => a.toLowerCase() === needle)) return aliases;
  }
  return [typedName];
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Masks every exclusion-phrase occurrence out of the text BEFORE alias
// matching, so e.g. "BCG matrix" never contributes a "BCG" mention, while a
// standalone "BCG" elsewhere in the same text still counts normally.
function maskExclusions(text) {
  let masked = text;
  for (const phrase of EXCLUSION_PHRASES) {
    masked = masked.replace(new RegExp(escapeRegExp(phrase), "gi"), " ".repeat(phrase.length));
  }
  return masked;
}

/**
 * Word-boundary count of how many times any alias in `aliases` appears in
 * `text`, after exclusion-phrase masking.
 */
export function countMentions(text, aliases) {
  const masked = maskExclusions(text || "");
  let count = 0;
  for (const alias of aliases) {
    const re = new RegExp(`\\b${escapeRegExp(alias)}\\b`, "gi");
    const m = masked.match(re);
    if (m) count += m.length;
  }
  return count;
}

/**
 * True if `text` mentions the company (any alias, exclusions applied) at
 * least once - the gate roleCompanyTopicNotes.js uses to decide whether a
 * chunk counts as "real casebook data for this company".
 */
export function mentionsCompany(text, aliases) {
  return countMentions(text, aliases) > 0;
}

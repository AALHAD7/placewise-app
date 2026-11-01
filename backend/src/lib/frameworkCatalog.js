import { supabase } from "./supabase.js";
import { generateJSON } from "./gemini.js";

/**
 * Pure: given one ingest_pages row's `diagrams` jsonb array (diagram-transcription
 * format - { type, title, source_page, ... }, migration_040), returns the distinct,
 * non-empty titles on that page. Titles come only from what the ingestion pipeline
 * already transcribed off the real page - nothing here invents or infers a framework
 * name from loose text, so every entry traces to an actual labelled diagram.
 */
export function extractDiagramTitles(diagrams) {
  return (diagrams || [])
    .map(d => (d && typeof d.title === "string" ? d.title.trim() : null))
    .filter(Boolean);
}

// Case/whitespace-only variants (e.g. "BCG Matrix" vs "bcg matrix") collapse to one
// catalog entry; the first-seen original casing is kept as the display form.
function normalizeTitle(title) {
  return title.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Pure: groups raw (title, occurrence) pairs into a deduplicated catalog, sorted by how
 * many times each framework actually appears (most-attested first) then alphabetically.
 */
export function buildCatalogFromOccurrences(occurrences) {
  const byKey = new Map();
  for (const occ of occurrences) {
    const key = normalizeTitle(occ.title);
    if (!byKey.has(key)) byKey.set(key, { title: occ.title, occurrences: [] });
    byKey.get(key).occurrences.push({
      sourceFile: occ.sourceFile,
      school: occ.school || null,
      club: occ.club || null,
      year: occ.year || null,
      page: occ.page
    });
  }
  return [...byKey.values()].sort(
    (a, b) => b.occurrences.length - a.occurrences.length || a.title.localeCompare(b.title)
  );
}

const FRAMEWORK_TITLE_JUDGE_SYSTEM =
  "You are checking whether a diagram's title, taken from a consulting casebook, is the " +
  "name of an ACTUAL reusable business/consulting framework, methodology, or analytical " +
  "tool (e.g. \"BCG Matrix\", \"Porter's Five Forces\", \"MECE\", \"SWOT\", \"TAM-SAM-SOM\") " +
  "- as opposed to a chart/table title, a data label, an org chart, a section header, " +
  "acknowledgements, or a generic phrase that happens to sit above a diagram in the book " +
  "(e.g. \"GDP Growth Rate\", \"Consulting Club Team (Class of 2026)\", \"Do's\", " +
  "\"Contents\", \"For Interviewer\"). A real framework name is reusable across many " +
  "different cases/companies, not specific to one page's numbers or people.\n\n" +
  'Respond with ONLY a JSON object, no markdown fences: {"verdict": "framework" or ' +
  '"not_framework"}';

/**
 * I/O: is this diagram title an actual named framework, not front-matter/chart-label
 * boilerplate? Found 2026-11-02: extractDiagramTitles pulls every diagram's title
 * verbatim, including chart/table/org-chart titles that are never meant to be a
 * "framework" at all ("GDP GROWTH RATE", "Consulting Club Team (Class of 2026)") - the
 * same "right category of page, wrong kind of content" failure as the Guesstimates
 * index-page bug. A plain regex can't reliably separate these from real framework names
 * (no consistent pattern distinguishes "MECE" from "HOUSEHOLD EXPENDITURE"), so this
 * uses a judge, same approach as judgeIsWorkedProblem. Fails closed (not a framework) on
 * error, so a judge outage shrinks the catalog rather than showing more junk.
 */
export async function judgeIsRealFrameworkTitle(title) {
  try {
    const parsed = await generateJSON({
      system: FRAMEWORK_TITLE_JUDGE_SYSTEM,
      prompt: `Title: "${title}"\n\nIs this an actual named framework?`,
      maxTokens: 50,
      temperature: 0,
      feature: "framework-catalog-title-judge"
    });
    return parsed.verdict === "framework";
  } catch (err) {
    console.warn(`[frameworkCatalog] title judge failed for "${title}": ${err.message}`);
    return false;
  }
}

// In-memory cache, not DB-backed: the catalog is rebuilt from ingest_pages on every
// uncached request, and classifying each unique title costs a Gemini call - without a
// cache this would be hundreds of calls on every single Frameworks page load. The
// underlying diagram data only changes when a new ingestion run happens (rare, always a
// deliberate action, never during normal traffic), so a short TTL is purely a cost/
// latency guard, not a freshness requirement.
const CATALOG_CACHE_TTL_MS = 15 * 60 * 1000;
let catalogCache = null; // { builtAt, result }

/**
 * I/O: every diagram title transcribed from the ingested Consulting casebooks
 * (source_class = club_casebook only - grounding policy, CLAUDE.md), independent of
 * is_active - this catalogs what's actually in the corpus, not what's switched live.
 * Returns [] (not a throw) on any failure, same resilience posture as the rest of the
 * R7 retrieval code - a catalog miss must never take down the Frameworks page.
 */
export async function buildConsultingFrameworkCatalog() {
  if (catalogCache && Date.now() - catalogCache.builtAt < CATALOG_CACHE_TTL_MS) {
    return catalogCache.result;
  }
  try {
    const { data: docs, error: docErr } = await supabase
      .from("ingest_documents")
      .select("id, source_file, school, club, year")
      .eq("domain", "Consulting")
      .eq("source_class", "club_casebook");
    if (docErr) throw docErr;
    if (!docs || !docs.length) return [];

    const docById = new Map(docs.map(d => [d.id, d]));
    const { data: pages, error: pageErr } = await supabase
      .from("ingest_pages")
      .select("document_id, page_no, diagrams")
      .in("document_id", docs.map(d => d.id))
      .gt("diagram_count", 0);
    if (pageErr) throw pageErr;

    const occurrences = [];
    for (const page of pages || []) {
      const doc = docById.get(page.document_id);
      if (!doc) continue;
      for (const title of extractDiagramTitles(page.diagrams)) {
        occurrences.push({
          title,
          sourceFile: doc.source_file,
          school: doc.school,
          club: doc.club,
          year: doc.year,
          page: page.page_no
        });
      }
    }
    const rawCatalog = buildCatalogFromOccurrences(occurrences);

    // Classify once per unique title (already deduplicated by buildCatalogFromOccurrences),
    // not once per occurrence - a framework named 50 times across casebooks is judged once.
    const verdicts = await Promise.all(rawCatalog.map(entry => judgeIsRealFrameworkTitle(entry.title)));
    const result = rawCatalog.filter((_, i) => verdicts[i]);

    catalogCache = { builtAt: Date.now(), result };
    return result;
  } catch (err) {
    console.warn(`[frameworkCatalog] build failed: ${err.message}`);
    return [];
  }
}

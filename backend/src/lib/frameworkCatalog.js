import { supabase } from "./supabase.js";

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

/**
 * I/O: every diagram title transcribed from the ingested Consulting casebooks
 * (source_class = club_casebook only - grounding policy, CLAUDE.md), independent of
 * is_active - this catalogs what's actually in the corpus, not what's switched live.
 * Returns [] (not a throw) on any failure, same resilience posture as the rest of the
 * R7 retrieval code - a catalog miss must never take down the Frameworks page.
 */
export async function buildConsultingFrameworkCatalog() {
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
    return buildCatalogFromOccurrences(occurrences);
  } catch (err) {
    console.warn(`[frameworkCatalog] build failed: ${err.message}`);
    return [];
  }
}

// Framework catalog: pure-logic coverage for frameworkCatalog.js's title extraction and
// grouping. No network, no Supabase - the I/O wrapper (buildConsultingFrameworkCatalog)
// is a thin fetch-then-group around these two functions, same resilience posture as the
// rest of the R7 retrieval code (try/catch -> [] on failure, not re-tested here).
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractDiagramTitles, buildCatalogFromOccurrences } from "../src/lib/frameworkCatalog.js";

// --- extractDiagramTitles ---

test("extractDiagramTitles: pulls non-empty titles, trimmed", () => {
  const titles = extractDiagramTitles([
    { type: "matrix", title: "  BCG Matrix  " },
    { type: "flow", title: "Value Chain" }
  ]);
  assert.deepEqual(titles, ["BCG Matrix", "Value Chain"]);
});

test("extractDiagramTitles: skips null/missing/blank titles, never throws on them", () => {
  const titles = extractDiagramTitles([
    { type: "other", title: null },
    { type: "table" },
    { type: "chart", title: "   " },
    { type: "funnel", title: "AIDA Funnel" }
  ]);
  assert.deepEqual(titles, ["AIDA Funnel"]);
});

test("extractDiagramTitles: empty/undefined input is an empty array, never throws", () => {
  assert.deepEqual(extractDiagramTitles([]), []);
  assert.deepEqual(extractDiagramTitles(undefined), []);
});

// --- buildCatalogFromOccurrences ---

test("buildCatalogFromOccurrences: case/whitespace variants collapse into one entry", () => {
  const catalog = buildCatalogFromOccurrences([
    { title: "Porter's Five Forces", sourceFile: "a.pdf", page: 10 },
    { title: "porter's   five forces", sourceFile: "b.pdf", page: 22 }
  ]);
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].title, "Porter's Five Forces"); // first-seen casing kept
  assert.equal(catalog[0].occurrences.length, 2);
});

test("buildCatalogFromOccurrences: sorted by occurrence count, then alphabetically", () => {
  const catalog = buildCatalogFromOccurrences([
    { title: "BCG Matrix", sourceFile: "a.pdf", page: 1 },
    { title: "Zebra Framework", sourceFile: "a.pdf", page: 2 },
    { title: "Zebra Framework", sourceFile: "b.pdf", page: 3 },
    { title: "Ansoff Matrix", sourceFile: "a.pdf", page: 4 }
  ]);
  assert.deepEqual(catalog.map(c => c.title), ["Zebra Framework", "Ansoff Matrix", "BCG Matrix"]);
});

test("buildCatalogFromOccurrences: each occurrence carries its real citation fields, not guesses", () => {
  const catalog = buildCatalogFromOccurrences([
    { title: "SWOT", sourceFile: "ISB Consulting Casebook 2025.pdf", school: "ISB", club: "Consulting Club", year: "2025", page: 40 }
  ]);
  assert.deepEqual(catalog[0].occurrences[0], {
    sourceFile: "ISB Consulting Casebook 2025.pdf",
    school: "ISB",
    club: "Consulting Club",
    year: "2025",
    page: 40
  });
});

test("buildCatalogFromOccurrences: empty input is an empty catalog", () => {
  assert.deepEqual(buildCatalogFromOccurrences([]), []);
});

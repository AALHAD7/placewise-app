// Turns one local R1/R2 reviewer file (backend/ingestion/out/*.json) into rows for the
// ingest_page_findings table (migration_041). Pure: no file, env or network access, so the
// tests stay offline. The import script (scripts/importReviewFindings.js) does the I/O.

const NOTE_FIELDS = ["checked", "note", "items_detail", "decision", "other_issues"];

function asText(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function reviewerName(reviewer) {
  if (typeof reviewer === "string" && reviewer.trim()) return reviewer.trim();
  if (reviewer && typeof reviewer === "object" && typeof reviewer.name === "string") {
    return reviewer.name;
  }
  return null;
}

export function normaliseReviewFile(sourceName, json, sourceFile) {
  const doc = json || {};
  const base = {
    document_id: doc.document_id,
    ingestion_version: doc.ingestion_version,
    source_file: sourceFile,
    source_name: sourceName,
    reviewer: reviewerName(doc.reviewer),
  };
  const rows = [];

  const pages = Array.isArray(doc.pages) ? doc.pages : [];
  pages.forEach((entry, i) => {
    const e = entry || {};
    const mismatches = Array.isArray(e.mismatches) ? e.mismatches : [];
    const types = [...new Set(mismatches.map((m) => m && m.type).filter(Boolean))];
    const note = NOTE_FIELDS.map((k) => asText(e[k])).filter(Boolean).join(" · ");
    rows.push({
      ...base,
      page_no: e.page_no,
      entry_key: `p${e.page_no}:${i}`,
      verdict: e.verdict ?? null,
      outcome: e.outcome ?? null,
      mismatch_types: types,
      mismatches,
      note: note || null,
      raw: e,
    });
  });

  // R1 only: pages flagged by issue type, without per-page detail.
  const flagged = doc.flagged && typeof doc.flagged === "object" ? doc.flagged : {};
  for (const [type, pageNos] of Object.entries(flagged)) {
    for (const pageNo of Array.isArray(pageNos) ? pageNos : []) {
      rows.push({
        ...base,
        page_no: pageNo,
        entry_key: `flagged:${type}:${pageNo}`,
        verdict: "flagged",
        outcome: null,
        mismatch_types: [type],
        mismatches: [],
        note: `R1 review flagged this page as ${type} (details not recorded per page)`,
        raw: { flagged: type, page_no: pageNo },
      });
    }
  }

  // R1 only: other errors found in the undetected-error sample.
  const other = doc.undetected_error_sample?.other_errors;
  if (other && typeof other === "object") {
    for (const [page, text] of Object.entries(other)) {
      rows.push({
        ...base,
        page_no: Number(page),
        entry_key: `other:${page}`,
        verdict: null,
        outcome: null,
        mismatch_types: [],
        mismatches: [],
        note: asText(text) || null,
        raw: { other_error: text, page_no: Number(page) },
      });
    }
  }

  return rows;
}

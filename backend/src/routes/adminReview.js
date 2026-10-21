import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAdmin, logAdminAction } from "../middleware/admin.js";
import { adminReviewLimiter } from "../middleware/rateLimit.js";
import { errorDetail } from "../lib/errors.js";
import {
  STATUSES, isUuid, isSafeImagePath, validateActionBody, diagramsFromMarkdown,
  summariseReasons, mapRpcError, isMissingSchemaError, latestByPage
} from "../lib/reviewQueue.js";

// R5 admin review queue: /api/admin/review/*. Mounted in server.js BEFORE /api/admin so
// it gets its own, larger limiter (paging ~170 pages needs more than adminLimiter's 60).
// requireAdmin 404s for no token / bad token / non-admin, exactly like /api/admin/*.
//
// Safety rules (see .gsd/phases/R5/02-PLAN.md):
// - Reads only, except POST /actions, which writes ONLY through the ingest_review_page
//   RPC (migration 041): history row + review_status in one transaction. No .update()
//   on ingest_pages from here; original markdown/diagrams are never overwritten.
// - The reviewer is always req.user.email (server-verified by requireAdmin), never a
//   value from the request body.
// - image_path and storage URLs never leave the server: the image route proxies bytes.
const router = Router();
router.use(requireAdmin, adminReviewLimiter);

const BUCKET = "casebook-source";
const DEFAULT_DOCUMENT_ID = "c1521f01-bcbf-4163-923d-dc501859dc31"; // FMS 2023-24 v5 (R2 best)
const LIST_COLUMNS = "id, page_no, review_status, review_reasons, diagram_count, method, needs_review";
const DETAIL_COLUMNS =
  "id, document_id, page_no, review_status, needs_review, review_reasons, markdown, diagrams, diagram_issues, " +
  "number_coverage, word_coverage, diagram_label_coverage, method, prompt_version";

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// Query params shared by /pages and /pages/:pageId (prev/next). Throws HttpError(400).
function parseQueueFilters(query) {
  const status = query.status ?? "pending";
  if (status !== "all" && !STATUSES.includes(status)) {
    throw new HttpError(400, `status must be one of: ${STATUSES.join(", ")}, all.`);
  }
  const flagged = query.flagged ?? "true";
  if (flagged !== "true" && flagged !== "all") throw new HttpError(400, "flagged must be true or all.");
  const reason = query.reason;
  if (reason != null && (typeof reason !== "string" || reason.length > 100)) {
    throw new HttpError(400, "reason must be a single reason string.");
  }
  return { status, flagged, reason: reason || null };
}

// Pages of one document matching status + flagged, ordered by page_no. reason_counts
// cover this set (before the reason filter) so the UI can show every facet.
async function loadQueue(documentId, { status, flagged, reason }) {
  let q = supabase.from("ingest_pages").select(LIST_COLUMNS).eq("document_id", documentId);
  if (flagged === "true") q = q.eq("needs_review", true);
  if (status !== "all") q = q.eq("review_status", status);
  const { data, error } = await q.order("page_no", { ascending: true }).limit(1000);
  if (error) throw error;
  const rows = data || [];
  const reasonCounts = summariseReasons(rows);
  const pages = reason ? rows.filter(r => (r.review_reasons || []).includes(reason)) : rows;
  return { pages, reasonCounts };
}

// Tables from migration 041 may not exist yet: read them as empty and say so.
async function optionalRead(query) {
  const { data, error } = await query;
  if (error) {
    if (isMissingSchemaError(error)) return { rows: [], missing: true };
    throw error;
  }
  return { rows: data || [], missing: false };
}

function sendError(res, endpoint, err, fallback) {
  if (err instanceof HttpError) return res.status(err.status).json({ success: false, error: err.message });
  console.error(`[admin/review/${endpoint}]`, err);
  return res.status(500).json({ success: false, error: fallback, detail: errorDetail(err) });
}

// GET /documents - ingest documents (newest version first) with flagged counts.
router.get("/documents", async (req, res) => {
  try {
    const { data: docs, error } = await supabase
      .from("ingest_documents")
      .select("id, source_file, school, year, ingestion_version, status")
      .order("ingestion_version", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;

    // Head-only counts per document (PostgREST caps row reads at 1000, so never count rows in JS).
    const countFlagged = async (documentId, pendingOnly) => {
      let q = supabase.from("ingest_pages").select("id", { count: "exact", head: true })
        .eq("document_id", documentId).eq("needs_review", true);
      if (pendingOnly) q = q.eq("review_status", "pending");
      const { count, error: cErr } = await q;
      if (cErr) throw cErr;
      return count || 0;
    };
    const documents = await Promise.all((docs || []).map(async d => {
      const [flagged, pendingFlagged] = await Promise.all([countFlagged(d.id, false), countFlagged(d.id, true)]);
      return { ...d, flagged, pending_flagged: pendingFlagged };
    }));
    const defaultId = documents.some(d => d.id === DEFAULT_DOCUMENT_ID)
      ? DEFAULT_DOCUMENT_ID
      : documents[0]?.id || null;

    res.json({ success: true, documents, default_document_id: defaultId });
  } catch (err) {
    sendError(res, "documents", err, "Failed to load documents.");
  }
});

// GET /pages?document_id=&status=&reason=&flagged= - the queue for one document.
router.get("/pages", async (req, res) => {
  try {
    const documentId = req.query.document_id;
    if (!isUuid(documentId)) throw new HttpError(400, "document_id must be a UUID.");
    const filters = parseQueueFilters(req.query);

    const { data: doc, error: docErr } = await supabase
      .from("ingest_documents").select("id, source_file").eq("id", documentId).maybeSingle();
    if (docErr) throw docErr;
    if (!doc) throw new HttpError(404, "Document not found.");

    const { pages, reasonCounts } = await loadQueue(documentId, filters);

    const findings = await optionalRead(
      supabase.from("ingest_page_findings").select("page_no").eq("source_file", doc.source_file).limit(1000)
    );
    const findingCounts = {};
    for (const f of findings.rows) findingCounts[f.page_no] = (findingCounts[f.page_no] || 0) + 1;

    const reviews = await optionalRead(
      supabase.from("ingest_page_reviews")
        .select("page_id, action, new_status, reviewer_email, created_at")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false })
        .limit(1000)
    );
    const latest = latestByPage(reviews.rows);

    res.json({
      success: true,
      pages: pages.map(p => ({
        id: p.id,
        page_no: p.page_no,
        review_status: p.review_status,
        review_reasons: p.review_reasons || [],
        diagram_count: p.diagram_count,
        method: p.method,
        finding_count: findingCounts[p.page_no] || 0,
        last_action: latest[p.id]
          ? { action: latest[p.id].action, new_status: latest[p.id].new_status,
              reviewer_email: latest[p.id].reviewer_email, created_at: latest[p.id].created_at }
          : null
      })),
      reason_counts: reasonCounts,
      total: pages.length,
      review_schema_ready: !findings.missing && !reviews.missing
    });
  } catch (err) {
    sendError(res, "pages", err, "Failed to load the review queue.");
  }
});

// GET /pages/:pageId - everything a reviewer needs for one page (no image_path).
router.get("/pages/:pageId", async (req, res) => {
  try {
    const { pageId } = req.params;
    if (!isUuid(pageId)) throw new HttpError(400, "pageId must be a UUID.");
    const filters = parseQueueFilters(req.query);

    const { data: page, error } = await supabase
      .from("ingest_pages").select(DETAIL_COLUMNS).eq("id", pageId).maybeSingle();
    if (error) throw error;
    if (!page) throw new HttpError(404, "Page not found.");

    const { data: doc, error: docErr } = await supabase
      .from("ingest_documents")
      .select("id, source_file, school, year, ingestion_version")
      .eq("id", page.document_id).maybeSingle();
    if (docErr) throw docErr;

    const findings = doc ? await optionalRead(
      supabase.from("ingest_page_findings")
        .select("id, document_id, ingestion_version, source_name, entry_key, reviewer, verdict, outcome, mismatch_types, mismatches, note, imported_at")
        .eq("source_file", doc.source_file)
        .eq("page_no", page.page_no)
        .order("ingestion_version", { ascending: false })
        .order("source_name", { ascending: true })
    ) : { rows: [], missing: false };

    const history = await optionalRead(
      supabase.from("ingest_page_reviews")
        .select("id, action, prev_status, new_status, note, edited_markdown, edited_diagrams, reviewer_email, created_at")
        .eq("page_id", pageId)
        .order("created_at", { ascending: false })
    );

    // Neighbours within the same filtered queue. Uses page_no order, so it still works
    // when this page has just left the filter (e.g. approved while viewing "pending").
    const { pages: queue } = await loadQueue(page.document_id, filters);
    const prev = [...queue].reverse().find(p => p.page_no < page.page_no);
    const next = queue.find(p => p.page_no > page.page_no);

    const { document_id, ...pageFields } = page;
    res.json({
      success: true,
      page: pageFields,
      document: doc
        ? { id: doc.id, school: doc.school, year: doc.year, ingestion_version: doc.ingestion_version }
        : { id: document_id },
      findings: findings.rows.map(f => ({ ...f, is_current_version: f.document_id === document_id })),
      history: history.rows,
      prev_page_id: prev?.id || null,
      next_page_id: next?.id || null,
      review_schema_ready: !findings.missing && !history.missing
    });
  } catch (err) {
    sendError(res, "page", err, "Failed to load the page.");
  }
});

const imageNotFound = res => res.status(404).json({ success: false, error: "Image not found." });

// GET /pages/:pageId/image - proxies the private page render. No URL or path is sent.
router.get("/pages/:pageId/image", async (req, res) => {
  try {
    const { pageId } = req.params;
    if (!isUuid(pageId)) return res.status(400).json({ success: false, error: "pageId must be a UUID." });

    const { data: page, error } = await supabase
      .from("ingest_pages").select("image_path").eq("id", pageId).maybeSingle();
    if (error) throw error;
    if (!page || !isSafeImagePath(page.image_path)) return imageNotFound(res);

    const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(page.image_path);
    if (dlErr || !blob) {
      if (dlErr) console.warn(`[admin/review/image] download failed for page ${pageId}: ${dlErr.message}`);
      return imageNotFound(res);
    }
    const bytes = Buffer.from(await blob.arrayBuffer());
    res.set({
      "Content-Type": "image/png",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Length": String(bytes.length)
    });
    res.end(bytes);
  } catch (err) {
    sendError(res, "image", err, "Failed to load the page image.");
  }
});

// POST /pages/:pageId/actions - approve | mark_wrong | edit_approve | reopen.
router.post("/pages/:pageId/actions", async (req, res) => {
  try {
    const { pageId } = req.params;
    if (!isUuid(pageId)) throw new HttpError(400, "pageId must be a UUID.");

    const v = validateActionBody(req.body);
    if (!v.ok) {
      return res.status(400).json({ success: false, error: v.error, ...(v.blockErrors ? { block_errors: v.blockErrors } : {}) });
    }

    const { data, error } = await supabase.rpc("ingest_review_page", {
      p_page_id: pageId,
      p_action: v.action,
      p_note: v.note,
      p_markdown: v.action === "edit_approve" ? v.markdown : null,
      p_diagrams: v.action === "edit_approve" ? diagramsFromMarkdown(v.markdown) : null,
      p_email: req.user.email, // server-verified admin; never from the request body
      p_expected_status: v.expectedStatus
    });
    if (error) {
      if (isMissingSchemaError(error)) {
        console.error("[admin/review/actions] ingest_review_page missing (migration 041 not applied)", error);
        return res.status(503).json({ success: false, error: "Review storage is not set up yet (migration 041)." });
      }
      const mapped = mapRpcError(error.message);
      if (mapped.status === 500) console.error("[admin/review/actions]", error);
      return res.status(mapped.status).json({
        success: false, error: mapped.error, ...(mapped.status === 500 ? { detail: errorDetail(error) } : {})
      });
    }

    await logAdminAction(req, "review_page", { page_id: pageId, action: v.action });
    res.json({ success: true, review_status: data?.new_status, review_id: data?.review_id });
  } catch (err) {
    sendError(res, "actions", err, "Failed to record the review.");
  }
});

export default router;

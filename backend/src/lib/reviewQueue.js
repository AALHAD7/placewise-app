// Pure helpers for the R5 admin review queue (routes/adminReview.js). No I/O here, so
// test/reviewQueue.test.js runs offline.
import { extractBlocks, validateBlock } from "./diagramBlocks.js";

export const ACTIONS = ["approve", "mark_wrong", "edit_approve", "reopen"];
export const STATUSES = ["pending", "approved", "fixed", "wrong"];
export const MAX_NOTE = 2000;
export const MAX_MARKDOWN = 50000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = v => typeof v === "string" && UUID_RE.test(v);

// Only page renders written by the ingestion pipeline: pages/<document uuid>/<n>.png.
const IMAGE_PATH_RE = /^pages\/[0-9a-f-]{36}\/\d+\.png$/;
export const isSafeImagePath = v => typeof v === "string" && IMAGE_PATH_RE.test(v);

// Per-block problems in edited markdown: [{index, errors, warnings}] for blocks that
// fail to parse or have hard errors (errors non-empty), plus warnings for the rest.
export function checkMarkdownBlocks(markdown) {
  return extractBlocks(markdown).map(b => {
    if (b.parseError) return { index: b.index, errors: [b.parseError], warnings: [] };
    return { index: b.index, ...validateBlock(b.json) };
  });
}

// Validates POST /pages/:pageId/actions. Never reads an email from the body: the
// reviewer is always the server-verified admin (req.user.email) - see the route.
export function validateActionBody(body) {
  const b = body && typeof body === "object" ? body : {};
  const fail = (error, extra = {}) => ({ ok: false, error, ...extra });

  const action = b.action;
  if (!ACTIONS.includes(action)) return fail(`action must be one of: ${ACTIONS.join(", ")}.`);

  if (b.note != null && typeof b.note !== "string") return fail("note must be a string.");
  const note = typeof b.note === "string" && b.note.trim() ? b.note.trim() : null;
  if (note && note.length > MAX_NOTE) return fail(`note must be at most ${MAX_NOTE} characters.`);
  if (action === "mark_wrong" && !note) return fail("mark_wrong needs a note saying what is wrong.");

  // Required: the status the reviewer saw. The RPC refuses the action if the page has
  // changed since (409), so a stale tab cannot overwrite a newer decision.
  if (!STATUSES.includes(b.expected_status)) {
    return fail(`expected_status is required and must be one of: ${STATUSES.join(", ")}.`);
  }
  const expectedStatus = b.expected_status;
  if (action === "reopen" && expectedStatus === "pending") return fail("This page is already pending.");

  let markdown = null;
  if (action === "edit_approve") {
    if (typeof b.markdown !== "string" || !b.markdown.trim()) return fail("edit_approve needs the edited markdown.");
    if (b.markdown.length > MAX_MARKDOWN) return fail(`markdown must be at most ${MAX_MARKDOWN} characters.`);
    const blocks = checkMarkdownBlocks(b.markdown);
    const bad = blocks.filter(x => x.errors.length > 0);
    if (bad.length) {
      return fail("Some diagram blocks cannot be drawn. Fix them before approving.", {
        blockErrors: bad.map(x => ({ index: x.index, errors: x.errors }))
      });
    }
    markdown = b.markdown;
  }

  return { ok: true, error: null, action, note, markdown, expectedStatus };
}

// Parsed diagram objects from (already validated) markdown, for the RPC's p_diagrams.
export function diagramsFromMarkdown(markdown) {
  return extractBlocks(markdown).filter(b => b.json && !b.parseError).map(b => b.json);
}

// {reason: count} over rows' review_reasons, highest count first (ties alphabetical).
export function summariseReasons(rows) {
  const counts = {};
  for (const r of rows || []) {
    for (const reason of r?.review_reasons || []) counts[reason] = (counts[reason] || 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  );
}

// supabase-js wraps the Postgres exception, so match on substrings of the message.
export function mapRpcError(message) {
  const m = String(message || "");
  if (m.includes("page_not_found")) return { status: 404, error: "Page not found." };
  if (m.includes("status_conflict")) {
    return { status: 409, error: "This page's review status changed since you loaded it. Reload and try again." };
  }
  if (m.includes("already_pending")) return { status: 409, error: "This page is already pending." };
  if (m.includes("bad_action") || m.includes("note_required") || m.includes("markdown_required") ||
      m.includes("expected_status_required")) {
    return { status: 400, error: "That review action is not valid for this page." };
  }
  return { status: 500, error: "Failed to record the review." };
}

// Missing table / function (migration 041 not applied yet). PostgREST: PGRST205 = table
// not in schema cache, PGRST202 = function not found; Postgres 42P01 / 42883.
export function isMissingSchemaError(err) {
  const code = err?.code || "";
  return ["PGRST205", "PGRST202", "42P01", "42883"].includes(code);
}

// Latest review row per page_id from rows sorted newest first.
export function latestByPage(rows) {
  const out = {};
  for (const r of rows || []) if (!out[r.page_id]) out[r.page_id] = r;
  return out;
}

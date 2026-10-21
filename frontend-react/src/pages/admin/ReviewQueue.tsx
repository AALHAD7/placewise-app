import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, apiFetch, apiFetchBlob } from "../../lib/apiClient";
import { splitMarkdownBlocks } from "../../lib/placewiseBlocks";
import PlacewiseDiagram, { DiagramFallback } from "../../components/diagrams/PlacewiseDiagram";
import type {
  AdminReviewActionRequest,
  AdminReviewActionResponse,
  AdminReviewBlockError,
  AdminReviewDocument,
  AdminReviewDocumentsResponse,
  AdminReviewFinding,
  AdminReviewPageListItem,
  AdminReviewPageResponse,
  AdminReviewPagesResponse,
  ReviewAction,
  ReviewStatus
} from "../../types/api";
import "../../styles/admin-review.css";

// R5.3 "Ingestion review" section on /admin (see .gsd/phases/R5/03-PLAN.md).
// Rendered by AdminPage only after /api/admin/usage succeeded, so non-admins never
// reach it. The page image is fetched as bytes with the admin token and shown via an
// object URL; no storage path or URL is ever built, logged or rendered here.
//
// Request budget (global limiter 300 / 15 min per IP): one list call per filter change,
// one detail + at most one image call per page, no polling, no prefetching.

const BASE = "/api/admin/review";
const STATUS_OPTIONS: { value: ReviewStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "fixed", label: "Fixed" },
  { value: "wrong", label: "Wrong" },
  { value: "all", label: "All statuses" }
];
const ACTION_DONE: Record<ReviewAction, string> = {
  approve: "Approved",
  mark_wrong: "Marked wrong",
  edit_approve: "Edited and approved",
  reopen: "Reopened"
};
const SERIOUS_FINDINGS = ["hallucinated", "altered", "structure_lost", "missing"];
const IMAGE_CACHE_MAX = 20;
const SCHEMA_MSG = "Review storage is not set up yet (migration 041). You can browse pages and images; saving a review needs the migration.";

type Load<T> = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; data: T };

function errMessage(e: unknown, fallback: string): string {
  if (e instanceof ApiError) {
    if (e.status === 429) return "Too many requests, wait a few minutes.";
    if (e.status === 503) return SCHEMA_MSG;
    return e.message || fallback;
  }
  return e instanceof Error ? e.message : fallback;
}

function docLabel(d: AdminReviewDocument): string {
  const name = [d.school, d.year].filter(Boolean).join(" ") || "Untitled document";
  return `${name} · v${d.ingestion_version} · ${d.flagged} flagged`;
}

function StatusPill({ status }: { status: ReviewStatus }) {
  return <span className={`rq-pill rq-pill-${status}`}>{status}</span>;
}

function findingTypes(f: AdminReviewFinding): string[] {
  const types = new Set<string>(f.mismatch_types || []);
  for (const m of f.mismatches || []) if (m && typeof m.type === "string") types.add(m.type);
  return [...types];
}

function hasSeriousCurrentFindings(findings: AdminReviewFinding[]): boolean {
  return findings.some((f) => f.is_current_version && findingTypes(f).some((t) => SERIOUS_FINDINGS.includes(t)));
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

// Markdown text in a pre-wrap block, each placewise-diagram fence drawn.
function RebuiltContent({ markdown }: { markdown: string | null }) {
  const segments = useMemo(() => splitMarkdownBlocks(markdown), [markdown]);
  if (!markdown || !markdown.trim()) return <div className="rq-empty-inline">This page has no text.</div>;
  return (
    <div className="rq-rebuilt">
      {segments.map((s, i) =>
        s.kind === "text" ? (
          <div key={i} className="rq-text">{s.text}</div>
        ) : s.parseError ? (
          <DiagramFallback key={i} raw={s.raw} reason={s.parseError} />
        ) : (
          <PlacewiseDiagram key={i} block={s.json} />
        )
      )}
    </div>
  );
}

function FindingItem({ f }: { f: AdminReviewFinding }) {
  return (
    <li className="rq-finding">
      <div className="rq-finding-head">
        <strong>{f.source_name}</strong>
        <span className={`rq-ver${f.is_current_version ? "" : " rq-ver-old"}`}>
          v{f.ingestion_version ?? "?"}
          {f.is_current_version ? "" : " · earlier version"}
        </span>
        {(f.verdict || f.outcome) && <span className="rq-muted">{[f.verdict, f.outcome].filter(Boolean).join(" · ")}</span>}
      </div>
      {(f.mismatches || []).length > 0 && (
        <ul className="rq-mismatches">
          {(f.mismatches || []).map((m, i) => (
            <li key={i}>
              <span className="rq-chip">{m.type || "mismatch"}</span>
              {m.item ? <> {m.item}</> : null}
              {(m.page_shows || m.stored) && (
                <div className="rq-compare">
                  <span><span className="rq-muted">page shows:</span> “{m.page_shows ?? ""}”</span>
                  <span><span className="rq-muted">stored:</span> “{m.stored ?? ""}”</span>
                </div>
              )}
              {m.note ? <div className="rq-muted">{m.note}</div> : null}
            </li>
          ))}
        </ul>
      )}
      {f.note && <div className="rq-finding-note">{f.note}</div>}
    </li>
  );
}

export default function ReviewQueue() {
  const [docs, setDocs] = useState<Load<AdminReviewDocument[]>>({ state: "loading" });
  const [docId, setDocId] = useState<string>("");
  const [status, setStatus] = useState<ReviewStatus | "all">("pending");
  const [reason, setReason] = useState("");
  const [list, setList] = useState<Load<AdminReviewPagesResponse>>({ state: "loading" });
  const [listNonce, setListNonce] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Load<AdminReviewPageResponse>>({ state: "loading" });
  const [detailNonce, setDetailNonce] = useState(0);
  const [image, setImage] = useState<{ state: "loading" | "error" | "ready"; url?: string }>({ state: "loading" });
  const [zoom, setZoom] = useState(false);
  const [tab, setTab] = useState<"rebuilt" | "raw" | "issues">("rebuilt");
  const [mode, setMode] = useState<"view" | "wrong" | "edit" | "confirm">("view");
  const [note, setNote] = useState("");
  const [editText, setEditText] = useState("");
  const [editFrom, setEditFrom] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [blockErrors, setBlockErrors] = useState<AdminReviewBlockError[]>([]);
  const [toast, setToast] = useState<{ text: string; undo?: { pageId: string; status: ReviewStatus } } | null>(null);
  const [schemaReady, setSchemaReady] = useState(true);

  const imageCache = useRef(new Map<string, string>());
  const imageInflight = useRef(new Map<string, Promise<string>>());
  const shownImageId = useRef<string | null>(null);
  const mounted = useRef(true);
  // A message to show after the next detail load (e.g. the 409 notice), since loading
  // a page otherwise clears actionError.
  const pendingNotice = useRef<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusHeading = useRef(false);
  const toastTimer = useRef<number | null>(null);

  // --- documents ------------------------------------------------------
  useEffect(() => {
    apiFetch<AdminReviewDocumentsResponse>(`${BASE}/documents`, {}, "Couldn't load documents.")
      .then((r) => {
        setDocs({ state: "ready", data: r.documents });
        setDocId(r.default_document_id || r.documents[0]?.id || "");
      })
      .catch((e) => setDocs({ state: "error", message: errMessage(e, "Couldn't load documents.") }));
  }, []);

  // --- queue list -----------------------------------------------------
  const queueQuery = useCallback(
    () => `status=${encodeURIComponent(status)}${reason ? `&reason=${encodeURIComponent(reason)}` : ""}`,
    [status, reason]
  );

  useEffect(() => {
    if (!docId) return;
    let live = true;
    setList({ state: "loading" });
    apiFetch<AdminReviewPagesResponse>(
      `${BASE}/pages?document_id=${encodeURIComponent(docId)}&${queueQuery()}`,
      {},
      "Couldn't load pages."
    )
      .then((r) => {
        if (!live) return;
        setList({ state: "ready", data: r });
        if (!r.review_schema_ready) setSchemaReady(false);
        setSelectedId((cur) => (cur && r.pages.some((p) => p.id === cur) ? cur : r.pages[0]?.id ?? null));
      })
      .catch((e) => live && setList({ state: "error", message: errMessage(e, "Couldn't load pages.") }));
    return () => {
      live = false;
    };
  }, [docId, queueQuery, listNonce]);

  // --- page detail ----------------------------------------------------
  useEffect(() => {
    if (!selectedId) return;
    let live = true;
    setDetail({ state: "loading" });
    setMode("view");
    setTab("rebuilt");
    setNote("");
    setActionError(pendingNotice.current ?? "");
    pendingNotice.current = null;
    setBlockErrors([]);
    setZoom(false);
    apiFetch<AdminReviewPageResponse>(`${BASE}/pages/${selectedId}?${queueQuery()}`, {}, "Couldn't load this page.")
      .then((r) => {
        if (!live) return;
        setDetail({ state: "ready", data: r });
        if (!r.review_schema_ready) setSchemaReady(false);
      })
      .catch((e) => live && setDetail({ state: "error", message: errMessage(e, "Couldn't load this page.") }));
    return () => {
      live = false;
    };
  }, [selectedId, detailNonce, queueQuery]);

  // --- page image (blob URL, small LRU, revoked on eviction/unmount) ---
  // One fetch per page id at a time (in-flight promises are shared), a cache entry is
  // revoked before it is replaced, the image on screen is never evicted, and a fetch
  // that finishes after unmount revokes its URL straight away.
  const loadImage = useCallback((id: string): Promise<string> => {
    const pending = imageInflight.current.get(id);
    if (pending) return pending;
    const p = apiFetchBlob(`${BASE}/pages/${id}/image`, "Image not available.")
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        if (!mounted.current) {
          URL.revokeObjectURL(url);
          throw new Error("unmounted");
        }
        const cache = imageCache.current;
        const old = cache.get(id);
        if (old && old !== url) URL.revokeObjectURL(old);
        cache.delete(id);
        cache.set(id, url);
        while (cache.size > IMAGE_CACHE_MAX) {
          let victim: string | null = null;
          for (const key of cache.keys()) {
            if (key !== shownImageId.current && key !== id) { victim = key; break; }
          }
          if (!victim) break;
          URL.revokeObjectURL(cache.get(victim) as string);
          cache.delete(victim);
        }
        return url;
      })
      .finally(() => imageInflight.current.delete(id));
    imageInflight.current.set(id, p);
    return p;
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const cache = imageCache.current;
    const hit = cache.get(selectedId);
    if (hit) {
      cache.delete(selectedId);
      cache.set(selectedId, hit);
      shownImageId.current = selectedId;
      setImage({ state: "ready", url: hit });
      return;
    }
    let live = true;
    setImage({ state: "loading" });
    loadImage(selectedId)
      .then((url) => {
        if (!live) return;
        shownImageId.current = selectedId;
        setImage({ state: "ready", url });
      })
      .catch(() => live && setImage({ state: "error" }));
    return () => {
      live = false;
    };
  }, [selectedId, loadImage]);

  useEffect(() => {
    mounted.current = true;
    const cache = imageCache.current;
    return () => {
      mounted.current = false;
      cache.forEach((url) => URL.revokeObjectURL(url));
      cache.clear();
      shownImageId.current = null;
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (detail.state === "ready" && focusHeading.current) {
      focusHeading.current = false;
      headingRef.current?.focus();
    }
  }, [detail]);

  const page = detail.state === "ready" ? detail.data : null;
  const pages = list.state === "ready" ? list.data.pages : [];
  const currentDoc = docs.state === "ready" ? docs.data.find((d) => d.id === docId) : undefined;

  const goTo = useCallback((id: string | null | undefined) => {
    if (id) setSelectedId(id);
  }, []);

  // j/k and arrow keys only for navigation (no single-key approve). Ignored while typing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (!page) return;
      if (e.key === "j" || e.key === "ArrowRight") goTo(page.next_page_id);
      else if (e.key === "k" || e.key === "ArrowLeft") goTo(page.prev_page_id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, goTo]);

  function showToast(t: typeof toast) {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = window.setTimeout(() => setToast(null), 6000);
  }

  // Local bookkeeping after a successful action: list item + reviewed counter.
  function applyStatus(pageId: string, prev: ReviewStatus, next: ReviewStatus) {
    setList((l) =>
      l.state === "ready"
        ? { ...l, data: { ...l.data, pages: l.data.pages.map((p) => (p.id === pageId ? { ...p, review_status: next } : p)) } }
        : l
    );
    if ((prev === "pending") !== (next === "pending")) {
      setDocs((d) =>
        d.state === "ready"
          ? {
              ...d,
              data: d.data.map((x) =>
                x.id === docId ? { ...x, pending_flagged: x.pending_flagged + (next === "pending" ? 1 : -1) } : x
              )
            }
          : d
      );
    }
  }

  async function post(pageId: string, body: AdminReviewActionRequest) {
    return apiFetch<AdminReviewActionResponse>(
      `${BASE}/pages/${pageId}/actions`,
      { method: "POST", body: JSON.stringify(body) },
      "Failed to record the review."
    );
  }

  async function runAction(action: ReviewAction) {
    if (!page || busy) return;
    const p = page.page;
    const body: AdminReviewActionRequest = { action, expected_status: p.review_status };
    if (action === "mark_wrong") {
      if (!note.trim()) {
        setActionError("Say what is wrong before marking the page wrong.");
        return;
      }
      body.note = note.trim();
    }
    if (action === "edit_approve") body.markdown = editText;
    setBusy(true);
    setActionError("");
    setBlockErrors([]);
    try {
      const r = await post(p.id, body);
      applyStatus(p.id, p.review_status, r.review_status);
      showToast({
        text: `${ACTION_DONE[action]} p${p.page_no}`,
        undo: action === "reopen" ? undefined : { pageId: p.id, status: r.review_status }
      });
      setMode("view");
      setNote("");
      setEditText("");
      if (action !== "reopen" && page.next_page_id) {
        focusHeading.current = true;
        setSelectedId(page.next_page_id);
      } else {
        setDetailNonce((n) => n + 1);
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        pendingNotice.current = "This page changed since you loaded it, so your action was not saved. The page has been reloaded; check it and try again.";
        setDetailNonce((n) => n + 1);
      } else {
        if (e instanceof ApiError && e.status === 503) setSchemaReady(false);
        if (e instanceof ApiError && Array.isArray(e.body?.block_errors)) setBlockErrors(e.body.block_errors as AdminReviewBlockError[]);
        setActionError(errMessage(e, "Failed to record the review."));
      }
    } finally {
      setBusy(false);
    }
  }

  async function undo() {
    if (!toast?.undo || busy) return;
    const { pageId, status: st } = toast.undo;
    setBusy(true);
    try {
      await post(pageId, { action: "reopen", expected_status: st });
      applyStatus(pageId, st, "pending");
      showToast({ text: "Undone: page is pending again." });
      if (pageId === selectedId) setDetailNonce((n) => n + 1);
    } catch (e) {
      setToast(null);
      setActionError(errMessage(e, "Couldn't undo."));
    } finally {
      setBusy(false);
    }
  }

  function startEdit() {
    if (!page) return;
    const latest = page.history.find((h) => h.edited_markdown);
    setEditText(latest?.edited_markdown ?? page.page.markdown ?? "");
    setEditFrom(latest ? `Starting from the latest edit (${fmtDate(latest.created_at)}, ${latest.reviewer_email}).` : null);
    setShowOriginal(false);
    setActionError("");
    setBlockErrors([]);
    setMode("edit");
  }

  function onApproveClick() {
    if (page && hasSeriousCurrentFindings(page.findings) && mode !== "confirm") {
      setMode("confirm");
      return;
    }
    void runAction("approve");
  }

  // --- render ---------------------------------------------------------
  if (docs.state === "loading") return <div className="rq-muted rq-pad">Loading review queue…</div>;
  if (docs.state === "error")
    return (
      <div className="rq-error rq-pad" role="alert">
        {docs.message}
      </div>
    );
  if (docs.data.length === 0) return <div className="rq-muted rq-pad">No ingested documents yet.</div>;

  const reasonCounts = list.state === "ready" ? list.data.reason_counts : {};
  const reviewed = currentDoc ? currentDoc.flagged - currentDoc.pending_flagged : 0;
  const p = page?.page;
  const canDecide = p ? p.review_status === "pending" || p.review_status === "wrong" : false;
  const actionsLocked = busy || !schemaReady;
  const selectedIndex = pages.findIndex((x) => x.id === selectedId);

  return (
    <div className="rq">
      <div className="rq-filters">
        <label className="rq-field">
          <span className="rq-label">Document</span>
          <select value={docId} onChange={(e) => { setDocId(e.target.value); setReason(""); setSelectedId(null); }}>
            {docs.data.map((d) => (
              <option key={d.id} value={d.id}>{docLabel(d)}</option>
            ))}
          </select>
        </label>
        <label className="rq-field">
          <span className="rq-label">Status</span>
          <select value={status} onChange={(e) => { setStatus(e.target.value as ReviewStatus | "all"); setSelectedId(null); }}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="rq-field">
          <span className="rq-label">Reason</span>
          <select value={reason} onChange={(e) => { setReason(e.target.value); setSelectedId(null); }}>
            <option value="">All reasons</option>
            {reason && !(reason in reasonCounts) && <option value={reason}>{reason} (0)</option>}
            {Object.entries(reasonCounts).map(([r, n]) => (
              <option key={r} value={r}>{r} ({n})</option>
            ))}
          </select>
        </label>
        {currentDoc && (
          <div className="rq-counter" aria-label={`${reviewed} of ${currentDoc.flagged} flagged pages reviewed`}>
            <strong>{reviewed}/{currentDoc.flagged}</strong> reviewed
          </div>
        )}
      </div>

      {!schemaReady && (
        <div className="rq-banner" role="status">{SCHEMA_MSG}</div>
      )}

      <div className="rq-live" aria-live="polite">
        {toast && (
          <div className="rq-toast">
            {toast.text}
            {toast.undo && (
              <button type="button" className="rq-link" onClick={undo} disabled={busy}>Undo</button>
            )}
          </div>
        )}
      </div>

      <div className="rq-layout">
        {/* Queue list (desktop) */}
        <div className={`rq-list${list.state === "ready" && pages.length > 0 ? " has-pages" : ""}`} aria-label="Flagged pages">
          {list.state === "loading" &&
            Array.from({ length: 6 }, (_, i) => <div key={i} className="rq-skel rq-skel-row" />)}
          {list.state === "error" && (
            <div className="rq-pad">
              <div className="rq-error">Couldn't load pages. {list.message !== "Couldn't load pages." ? list.message : ""}</div>
              <button type="button" className="rq-btn" onClick={() => setListNonce((n) => n + 1)}>Retry</button>
            </div>
          )}
          {list.state === "ready" && pages.length === 0 && (
            <div className="rq-pad rq-empty">
              {status === "pending" && !reason ? "Nothing left to review here." : "No pages match these filters."}
              {status !== "all" && (
                <button type="button" className="rq-btn" onClick={() => { setStatus("all"); setSelectedId(null); }}>
                  Show all statuses
                </button>
              )}
            </div>
          )}
          {list.state === "ready" && pages.length > 0 && (
            <>
              <div className="rq-list-count">{pages.length} page{pages.length === 1 ? "" : "s"}</div>
              {pages.map((it: AdminReviewPageListItem) => (
                <button
                  key={it.id}
                  type="button"
                  className={`rq-row${it.id === selectedId ? " is-selected" : ""}`}
                  aria-current={it.id === selectedId ? "true" : undefined}
                  onClick={() => setSelectedId(it.id)}
                >
                  <span className="rq-row-page">p{it.page_no}</span>
                  <StatusPill status={it.review_status} />
                  <span className="rq-row-reasons">
                    {it.review_reasons.slice(0, 3).map((r) => (
                      <span key={r} className="rq-chip rq-chip-sm">{r}</span>
                    ))}
                    {it.review_reasons.length > 3 && <span className="rq-muted">+{it.review_reasons.length - 3}</span>}
                  </span>
                  {it.finding_count > 0 && (
                    <span className="rq-badge" title={`${it.finding_count} reviewer findings`}>{it.finding_count}f</span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Page picker (phone) */}
        {list.state === "ready" && pages.length > 0 && (
          <div className="rq-picker">
            <button type="button" className="rq-btn" disabled={!page?.prev_page_id} onClick={() => goTo(page?.prev_page_id)} aria-label="Previous page">‹ Prev</button>
            <select aria-label="Page" value={selectedId ?? ""} onChange={(e) => setSelectedId(e.target.value)}>
              {pages.map((it) => (
                <option key={it.id} value={it.id}>p{it.page_no} · {it.review_status}{it.finding_count ? ` · ${it.finding_count}f` : ""}</option>
              ))}
            </select>
            <button type="button" className="rq-btn" disabled={!page?.next_page_id} onClick={() => goTo(page?.next_page_id)} aria-label="Next page">Next ›</button>
          </div>
        )}

        {/* Page view */}
        <div className="rq-view">
          {!selectedId && list.state === "ready" && <div className="rq-muted rq-pad">Pick a page.</div>}
          {selectedId && detail.state === "loading" && (
            <div className="rq-pad">
              <div className="rq-skel rq-skel-line" style={{ width: "40%" }} />
              <div className="rq-skel rq-skel-line" style={{ width: "70%" }} />
            </div>
          )}
          {selectedId && detail.state === "error" && (
            <div className="rq-pad">
              <div className="rq-error">{detail.message}</div>
              <button type="button" className="rq-btn" onClick={() => setDetailNonce((n) => n + 1)}>Retry</button>
            </div>
          )}
          {page && p && (
            <>
              <div className="rq-view-head">
                <h3 ref={headingRef} tabIndex={-1} className="rq-heading">
                  Page {p.page_no} · {[page.document.school, page.document.year].filter(Boolean).join(" ") || "Document"}
                  {page.document.ingestion_version != null ? ` · v${page.document.ingestion_version}` : ""} · <StatusPill status={p.review_status} />
                </h3>
                <div className="rq-nav">
                  {selectedIndex >= 0 && <span className="rq-muted">{selectedIndex + 1} of {pages.length}</span>}
                  <button type="button" className="rq-btn" disabled={!page.prev_page_id} onClick={() => goTo(page.prev_page_id)}>‹ prev</button>
                  <button type="button" className="rq-btn" disabled={!page.next_page_id} onClick={() => goTo(page.next_page_id)}>next ›</button>
                </div>
              </div>

              <div className="rq-why">
                <span className="rq-label">Why flagged</span>
                <div className="rq-chips">
                  {(p.review_reasons || []).length === 0 && <span className="rq-muted">No reasons recorded.</span>}
                  {(p.review_reasons || []).map((r) => (
                    <span key={r} className="rq-chip">{r}</span>
                  ))}
                </div>
                {(() => {
                  const cur = page.findings.filter((f) => f.is_current_version);
                  if (cur.length === 0) return page.findings.length ? <div className="rq-muted">{page.findings.length} finding(s), all from earlier versions.</div> : null;
                  return (
                    <div className="rq-why-findings">
                      {cur.length} finding{cur.length === 1 ? "" : "s"} (current version):
                      <ul>
                        {cur.flatMap((f) => (f.mismatches || []).map((m, i) => (
                          <li key={`${f.id}-${i}`}>
                            <span className="rq-chip rq-chip-sm">{m.type || "mismatch"}</span> {m.item || m.note || ""}
                          </li>
                        ))).slice(0, 4)}
                      </ul>
                    </div>
                  );
                })()}
              </div>

              <div className="rq-split">
                <div className="rq-image-panel">
                  <div className="rq-label">Original page</div>
                  {image.state === "loading" && <div className="rq-skel rq-image-skel" />}
                  {image.state === "error" && <div className="rq-image-missing">Image not available</div>}
                  {image.state === "ready" && image.url && (
                    <button type="button" className={`unbutton rq-image-btn${zoom ? " is-zoomed" : ""}`} onClick={() => setZoom((z) => !z)} aria-label={zoom ? "Fit image to width" : "Show image at actual size"}>
                      <img src={image.url} alt={`Original scan of page ${p.page_no}`} />
                    </button>
                  )}
                </div>

                <div className="rq-content-panel">
                  {mode === "edit" ? (
                    <div className="rq-edit">
                      <div className="rq-edit-top">
                        <span className="rq-label">Edit markdown</span>
                        <label className="rq-check">
                          <input type="checkbox" checked={showOriginal} onChange={(e) => setShowOriginal(e.target.checked)} /> Show original
                        </label>
                      </div>
                      {editFrom && <div className="rq-muted rq-small">{editFrom}</div>}
                      <div className={showOriginal ? "rq-edit-cols" : undefined}>
                        <textarea className="rq-textarea" value={editText} onChange={(e) => setEditText(e.target.value)} aria-label="Edited markdown" spellCheck={false} />
                        {showOriginal && <pre className="rq-raw rq-original" aria-label="Original markdown">{p.markdown || ""}</pre>}
                      </div>
                      {blockErrors.length > 0 && (
                        <ul className="rq-block-errors" role="alert">
                          {blockErrors.map((b) => (
                            <li key={b.index}>Block {b.index + 1}: {b.errors.join("; ")}</li>
                          ))}
                        </ul>
                      )}
                      <div className="rq-label">Preview</div>
                      <RebuiltContent markdown={editText} />
                    </div>
                  ) : (
                    <>
                      <div className="rq-tabs" role="tablist" aria-label="Page content">
                        {([["rebuilt", "Rebuilt"], ["raw", "Raw markdown"], ["issues", `Diagram issues (${(p.diagram_issues || []).length})`]] as const).map(([k, label]) => (
                          <button key={k} type="button" role="tab" aria-selected={tab === k} className={`rq-tab${tab === k ? " is-active" : ""}`} onClick={() => setTab(k)}>
                            {label}
                          </button>
                        ))}
                      </div>
                      <div role="tabpanel">
                        {tab === "rebuilt" && <RebuiltContent markdown={p.markdown} />}
                        {tab === "raw" && (p.markdown ? <pre className="rq-raw">{p.markdown}</pre> : <div className="rq-empty-inline">This page has no text.</div>)}
                        {tab === "issues" &&
                          ((p.diagram_issues || []).length === 0 ? (
                            <div className="rq-empty-inline">No diagram issues recorded.</div>
                          ) : (
                            <ul className="rq-issues">
                              {(p.diagram_issues || []).map((d, i) => (
                                <li key={i}><pre className="rq-raw rq-small">{typeof d === "string" ? d : JSON.stringify(d, null, 2)}</pre></li>
                              ))}
                            </ul>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <details className="rq-details">
                <summary>All findings ({page.findings.length})</summary>
                {page.findings.length === 0 ? (
                  <div className="rq-muted rq-small">{schemaReady ? "No reviewer findings for this page." : "Findings are not available until migration 041 is applied."}</div>
                ) : (
                  <ul className="rq-findings">
                    {page.findings.map((f) => <FindingItem key={f.id} f={f} />)}
                  </ul>
                )}
              </details>
              <details className="rq-details">
                <summary>History ({page.history.length})</summary>
                {page.history.length === 0 ? (
                  <div className="rq-muted rq-small">No review actions yet.</div>
                ) : (
                  <ul className="rq-history">
                    {page.history.map((h) => (
                      <li key={h.id}>
                        <strong>{ACTION_DONE[h.action] ?? h.action}</strong>{" "}
                        <span className="rq-muted">{h.prev_status ?? "?"} → {h.new_status} · {h.reviewer_email} · {fmtDate(h.created_at)}</span>
                        {h.note && <div>{h.note}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </details>

              <div className="rq-actions">
                {mode === "wrong" && (
                  <div className="rq-note">
                    <label className="rq-label" htmlFor="rq-note">What is wrong? (required)</label>
                    <textarea id="rq-note" className="rq-textarea rq-textarea-sm" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} />
                  </div>
                )}
                {mode === "confirm" && (
                  <div className="rq-confirm" role="alert">This page has open findings. Approve anyway?</div>
                )}
                {actionError && <div className="rq-error rq-small" role="alert">{actionError}</div>}
                <div className="rq-actions-row">
                  {mode === "view" && (
                    <>
                      {canDecide && <button type="button" className="rq-btn rq-btn-primary" disabled={actionsLocked} onClick={onApproveClick}>{busy ? <span className="rq-spin" aria-hidden /> : null}Approve</button>}
                      {canDecide && <button type="button" className="rq-btn" disabled={busy} onClick={() => { setMode("wrong"); setActionError(""); }}>Mark wrong</button>}
                      {canDecide && <button type="button" className="rq-btn" disabled={busy} onClick={startEdit}>Edit</button>}
                      {p.review_status !== "pending" && <button type="button" className="rq-btn" disabled={actionsLocked} onClick={() => runAction("reopen")}>{busy ? <span className="rq-spin" aria-hidden /> : null}Reopen</button>}
                    </>
                  )}
                  {mode === "confirm" && (
                    <>
                      <button type="button" className="rq-btn rq-btn-primary" disabled={actionsLocked} onClick={() => runAction("approve")}>{busy ? <span className="rq-spin" aria-hidden /> : null}Approve anyway</button>
                      <button type="button" className="rq-btn" disabled={busy} onClick={() => setMode("view")}>Cancel</button>
                    </>
                  )}
                  {mode === "wrong" && (
                    <>
                      <button type="button" className="rq-btn rq-btn-danger" disabled={actionsLocked || !note.trim()} onClick={() => runAction("mark_wrong")}>{busy ? <span className="rq-spin" aria-hidden /> : null}Mark wrong</button>
                      <button type="button" className="rq-btn" disabled={busy} onClick={() => { setMode("view"); setActionError(""); }}>Cancel</button>
                    </>
                  )}
                  {mode === "edit" && (
                    <>
                      <button type="button" className="rq-btn rq-btn-primary" disabled={actionsLocked || !editText.trim()} onClick={() => runAction("edit_approve")}>{busy ? <span className="rq-spin" aria-hidden /> : null}Save and approve</button>
                      <button type="button" className="rq-btn" disabled={busy} onClick={() => { setMode("view"); setActionError(""); setBlockErrors([]); }}>Cancel</button>
                    </>
                  )}
                </div>
                {!schemaReady && <div className="rq-muted rq-small">Actions are off until migration 041 is applied.</div>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

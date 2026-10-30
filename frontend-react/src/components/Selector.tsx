import type { ChangeEvent, ReactNode } from "react";
import { useExitTransition } from "../hooks/useExitTransition";

// Searchable dropdown card - ported from the shared visual shape behind
// roleSelector()/companySelector()/lightSelector() in frontend/index.html
// (inline style literals at e.g. 3339-3352, 3808-3814, 3340-3353). Each
// caller supplies its own filtered/free-text-injected options (see
// useSelector.ts) - this component only renders.

export interface SelectorOption {
  label: string;
  selected: boolean;
  pick: () => void;
}

interface SelectorProps {
  /** Omit (or leave "") to skip the uppercase label row entirely - the
   * Role page's topic picker (roleTopic.sel) sits inside a card that
   * already has its own "TOPICS TO PREPARE" heading, so it renders without
   * one, more compact, in the source (frontend/index.html ~654-659). */
  label?: string;
  value: string;
  hasValue: boolean;
  open: boolean;
  query: string;
  options: SelectorOption[];
  empty: boolean;
  emptyText: string;
  disabled?: boolean;
  searchPlaceholder: string;
  toggle: () => void;
  onQuery: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Renders a "Clear selection" link inside the dropdown when passed -
   * Role's top-level selector (see migration plan §0.5) and Company's
   * Subsidiary selector (drops back to the parent company's own data) use
   * this; omit it to render without one. */
  onClear?: () => void;
  children?: ReactNode;
}

export default function Selector({
  label, value, hasValue, open, query, options, empty, emptyText, disabled, searchPlaceholder, toggle, onQuery, onClear
}: SelectorProps) {
  // The menu leaves along the path it arrived on rather than vanishing on
  // the state flip - see useExitTransition.
  const { rendered: menuRendered, exiting: menuExiting } = useExitTransition(open && !disabled, 160);
  // Enter picks the top option in the currently-filtered list - same option
  // a click would pick, just without reaching for the mouse. When nothing in
  // CANONICAL_ROLES/POPULAR_COMPANIES matches what was typed, that top (and
  // only) option is the synthetic free-text entry each caller appends (see
  // RolePage/CompanyPage) - labeled with the typed text itself, not a
  // "Search for ..." prefix, so it reads like a normal selectable row - so
  // typing a free-text role/company and hitting Enter works exactly like
  // clicking that row.
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && options.length > 0) {
      e.preventDefault();
      options[0].pick();
    } else if (e.key === "Escape") {
      e.preventDefault();
      toggle();
    }
  }
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          background: disabled ? "var(--surface-sunken)" : "var(--surface)",
          border: "1px solid " + (disabled ? "var(--card-border)" : open ? "var(--border-focus)" : "var(--border-input)"),
          borderRadius: "var(--r-md)",
          overflow: "hidden",
          opacity: disabled ? 0.75 : 1
        }}
      >
        <button
          type="button"
          className="unbutton selector-trigger"
          onClick={disabled ? undefined : toggle}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: label ? "15px 18px" : "13px 16px", cursor: disabled ? "not-allowed" : "pointer" }}
        >
          <div style={{ minWidth: 0 }}>
            {label && <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>}
            <div style={{ marginTop: label ? 3 : 0, fontSize: "0.96875rem", fontWeight: 600, color: disabled ? "var(--text-disabled)" : hasValue ? "var(--text-900)" : "var(--text-lightgray)" }}>{value}</div>
          </div>
          <span style={{ flex: "none", color: disabled ? "var(--text-disabled)" : "var(--text-lightgray)", fontSize: "0.75rem", transition: "transform .18s var(--t-ease)", transform: `rotate(${open ? 180 : 0}deg)` }}>▾</span>
        </button>
      </div>

      {menuRendered && !disabled && (
        <div
          role="listbox"
          className={(menuExiting ? "t-pop-out" : "t-pop-in") + " glass-panel"}
          style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20, borderRadius: "var(--r-sm)", padding: 8, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "2px 4px 6px", padding: "9px 12px", border: "1px solid var(--border-soft)", borderRadius: "var(--r-sm)", background: "var(--bg)" }}>
            <span style={{ color: "var(--text-lightgray)", fontSize: "0.78125rem" }}>⌕</span>
            {onClear && (
              <button type="button" className="unbutton" onClick={onClear} style={{ flex: "none", order: 2, fontSize: "0.75rem", fontWeight: 600, color: "var(--indigo)", cursor: "pointer", whiteSpace: "nowrap" }}>
                Clear selection
              </button>
            )}
            <input
              value={query}
              onChange={onQuery}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              autoFocus
              style={{ flex: 1, border: 0, outline: "none", background: "transparent", color: "var(--text-900)", font: "400 0.875rem 'Instrument Sans',sans-serif" }}
            />
          </div>
          {/* Its own capped, scrollable region (search row above stays put) -
              a long result list (e.g. a dozen-plus subsidiaries) previously
              just grew the dropdown past the viewport with no scroll of its
              own, so scrolling over it scrolled the whole page underneath
              instead. data-lenis-prevent excludes this element from Lenis's
              global wheel hijacking (same mechanism the modals already use -
              see CompanyPage.tsx's stage-detail/business-model bodies), so
              native scroll takes over here and stays contained to the list. */}
          <div data-lenis-prevent style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: "min(50vh, 320px)", overflowY: "auto" }}>
            {empty && <div style={{ padding: "11px 14px", color: "var(--text-lightgray)", fontSize: "0.84375rem" }}>{emptyText}</div>}
            {options.map((o, i) => (
              <button
                type="button"
                key={i}
                onClick={o.pick}
                role="option"
                aria-selected={o.selected}
                className="unbutton selector-option"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: "var(--r-sm)", cursor: "pointer", fontSize: "0.875rem", color: o.selected ? "var(--text-900)" : "var(--text-600)", fontWeight: o.selected ? 600 : 400, background: o.selected ? "var(--surface-sunken)" : "transparent" }}
              >
                <span>{o.label}</span>
                <span style={{ color: "var(--green)", fontSize: "0.75rem", opacity: o.selected ? 1 : 0 }}>✓</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import type { ChangeEvent, ReactNode } from "react";

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
  /** Only Role's top-level selector renders a "Clear selection" link - see
   * migration plan §0.5 (companySelector()'s own clear() exists but nothing
   * in Company's markup ever renders it). Omit to match that exactly. */
  onClear?: () => void;
  children?: ReactNode;
}

export default function Selector({
  label, value, hasValue, open, query, options, empty, emptyText, disabled, searchPlaceholder, toggle, onQuery, onClear
}: SelectorProps) {
  // Enter picks the top option in the currently-filtered list - same option
  // a click would pick, just without reaching for the mouse. When nothing in
  // CANONICAL_ROLES/POPULAR_COMPANIES matches what was typed, that top (and
  // only) option is the synthetic "Search for '<query>'" entry each caller
  // appends (see RolePage/CompanyPage), so typing a free-text role/company
  // and hitting Enter works exactly like clicking that row.
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
          background: disabled ? "#f7f7f9" : "#fff",
          border: "1px solid " + (disabled ? "#ebecf0" : open ? "#BBD3F7" : "#e9eaee"),
          borderRadius: 14,
          boxShadow: disabled ? undefined : "0 1px 2px rgba(16,24,40,.05)",
          overflow: "hidden",
          opacity: disabled ? 0.75 : 1
        }}
      >
        <div
          onClick={disabled ? undefined : toggle}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: label ? "15px 18px" : "13px 16px", cursor: disabled ? "not-allowed" : "pointer" }}
        >
          <div style={{ minWidth: 0 }}>
            {label && <div style={{ color: "#9ca3af", fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>}
            <div style={{ marginTop: label ? 3 : 0, fontSize: 15.5, fontWeight: 600, color: disabled ? "#c2c4cc" : hasValue ? "#111827" : "#9ca3af" }}>{value}</div>
          </div>
          <span style={{ flex: "none", color: disabled ? "#d1d3da" : "#9ca3af", fontSize: 12, transition: "transform .18s", transform: `rotate(${open ? 180 : 0}deg)` }}>▾</span>
        </div>
      </div>

      {open && !disabled && (
        <div
          className="t-pop-in"
          style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20, background: "#fff", border: "1px solid #e0e1e6", borderRadius: 9, boxShadow: "0 14px 34px -12px rgba(16,24,40,.28)", padding: 8, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "2px 4px 6px", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 9, background: "#f9fafb" }}>
            <span style={{ color: "#9ca3af", fontSize: 12.5 }}>⌕</span>
            {onClear && (
              <span onClick={onClear} style={{ flex: "none", order: 2, fontSize: 12, fontWeight: 600, color: "#4F46E5", cursor: "pointer", whiteSpace: "nowrap" }}>
                Clear selection
              </span>
            )}
            <input
              value={query}
              onChange={onQuery}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              autoFocus
              style={{ flex: 1, border: 0, outline: "none", background: "transparent", color: "#111827", font: "400 14px 'Instrument Sans',sans-serif" }}
            />
          </div>
          {empty && <div style={{ padding: "11px 14px", color: "#9ca3af", fontSize: 13.5 }}>{emptyText}</div>}
          {options.map((o, i) => (
            <div
              key={i}
              onClick={o.pick}
              className="selector-option"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: 9, cursor: "pointer", fontSize: 14, color: o.selected ? "#111827" : "#4b5563", fontWeight: o.selected ? 600 : 400, background: o.selected ? "#f3f4f6" : "transparent" }}
            >
              <span>{o.label}</span>
              <span style={{ color: "#059669", fontSize: 12, opacity: o.selected ? 1 : 0 }}>✓</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

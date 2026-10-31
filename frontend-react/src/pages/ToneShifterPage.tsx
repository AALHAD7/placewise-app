import { useState, type ChangeEvent } from "react";
import { useExitTransition } from "../hooks/useExitTransition";
import { callClaude, logActivity } from "../lib/apiClient";
import { parseToneShiftResponse, parseToneShiftRetryResponse, toneShiftPrompt, toneShiftRetryPrompt, type ToneShiftBulletResult } from "../lib/prompts";
import { useSelectorOpenState } from "../hooks/useSelector";
import PageHeader from "../components/PageHeader";

// UI ported from frontend/index.html: tonePanel() (3237-3292), markup
// (1314-1428) - this is the original bullet-point/domain/format/length
// rewriter built on /api/chat via callClaude(), NOT the redesign around
// /api/tone/shift this page briefly had.
//
// Rewrite LOGIC replaced per user-supplied spec (tone-shifter-system-prompt.md):
// one batched call covering every filled bullet (not one call per bullet),
// strict output-fidelity rules (no invented numbers, no causal narration, no
// filler words, no first person, action-verb lead), and a structured JSON
// contract instead of free-form prose - see toneShiftPrompt() in lib/prompts.ts.

const DOMAIN_OPTIONS = ["Consulting", "Product Management", "Finance and Banking", "Marketing", "Sales and Business Development", "Operations and Supply Chain", "Data and Analytics", "IT and Technology", "Human Resources", "General Management"];
const FORMAT_OPTIONS = ["STAR (Situation, Task, Action, Result)", "RAC (Result, Action, Context)", "CAR (Context, Action, Result)", "PAR (Problem, Action, Result)", "SOAR (Situation, Obstacle, Action, Result)", "Impact-first one-liner"];
const UNIT_OPTIONS = ["Characters", "Words"];

// Code-side recount, never trust the model's self-reported length - chars
// include spaces, words are whitespace-split tokens. min/max mirror the
// system prompt's own LENGTH FIT rule exactly (chars: target-4% to target;
// words: target-2 to target; never exceed target either way).
function countText(text: string, unit: string): number {
  return unit === "Characters" ? text.length : text.trim().split(/\s+/).filter(Boolean).length;
}
function lengthRange(target: number, unit: string): { min: number; max: number } {
  return unit === "Characters" ? { min: Math.floor(target * 0.96), max: target } : { min: target - 2, max: target };
}

interface DropdownOption { label: string; selected: boolean; pick: () => void }

function LabeledDropdown({ label, value, hasValue, open, toggle, options }: { label: string; value: string; hasValue: boolean; open: boolean; toggle: () => void; options: DropdownOption[] }) {
  const { rendered, exiting } = useExitTransition(open, 160);
  return (
    <div style={{ position: "relative" }}>
      <div style={{ background: "var(--surface)", border: "1px solid " + (open ? "var(--border-focus)" : "var(--border-input)"), borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", overflow: "hidden" }}>
        <button type="button" onClick={toggle} aria-expanded={open} aria-haspopup="listbox" className="unbutton selector-trigger" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "15px 18px", cursor: "pointer" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
            <div style={{ marginTop: 3, fontSize: "0.96875rem", fontWeight: 600, color: hasValue ? "var(--text-900)" : "var(--text-lightgray)" }}>{value}</div>
          </div>
          <span style={{ flex: "none", color: "var(--text-lightgray)", fontSize: "0.75rem", transition: "transform .18s var(--t-ease)", transform: `rotate(${open ? 180 : 0}deg)` }}>▾</span>
        </button>
      </div>
      {rendered && (
        <div data-lenis-prevent role="listbox" className={exiting ? "t-pop-out" : "t-pop-in"} style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20, background: "var(--surface)", border: "1px solid var(--card-border)", borderRadius: "var(--r-sm)", boxShadow: "0 0 0 1px var(--card-border)", padding: 8, display: "flex", flexDirection: "column", gap: 2, maxHeight: 280, overflow: "auto" }}>
          {options.map((o, i) => (
            <button type="button" key={i} onClick={o.pick} role="option" aria-selected={o.selected} className="unbutton selector-option" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: "var(--r-sm)", cursor: "pointer", fontSize: "0.875rem", color: o.selected ? "var(--text-900)" : "var(--text-600)", fontWeight: o.selected ? 600 : 400, background: o.selected ? "var(--surface-sunken)" : "transparent" }}>
              <span>{o.label}</span>
              <span style={{ color: "var(--green)", fontSize: "0.75rem", opacity: o.selected ? 1 : 0 }}>✓</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ToneOutput { label: string; text: string; badge: string }

export default function ToneShifterPage() {
  const [bullets, setBullets] = useState<string[]>(["", "", ""]);
  const [domain, setDomain] = useState("");
  const [format, setFormat] = useState("");
  const [unit, setUnit] = useState("Words");
  const [length, setLength] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [out, setOut] = useState<ToneOutput[] | null>(null);

  const domainSel = useSelectorOpenState();
  const formatSel = useSelectorOpenState();
  const unitSel = useSelectorOpenState();
  const { rendered: unitRendered, exiting: unitExiting } = useExitTransition(unitSel.open, 160);

  const filled = bullets.filter((b) => b.trim());
  const ready = filled.length > 0 && !!domain && !!format;

  function setBullet(i: number, v: string) {
    setBullets((arr) => {
      const next = arr.slice();
      next[i] = v;
      return next;
    });
  }

  function removeBullet(i: number) {
    setBullets((arr) => {
      if (arr.length <= 1) return [""];
      const next = arr.slice();
      next.splice(i, 1);
      return next;
    });
  }

  function onLength(e: ChangeEvent<HTMLInputElement>) {
    setLength(e.target.value.replace(/[^0-9]/g, "").slice(0, 4));
  }

  async function confirm() {
    if (!ready || loading) return;
    const shape = format.split(" (")[0];
    setLoading(true);
    setError("");
    try {
      // Domain/format are passed in exactly as the dropdown displays them
      // (full label, parenthetical included for format) - the prompt itself
      // asks for that verbatim.
      const raw = await callClaude([{ role: "user", content: toneShiftPrompt(filled, domain, format, length, unit) }]);
      const parsed = parseToneShiftResponse(raw);
      let finalBullets: ToneShiftBulletResult[] = parsed.bullets;

      // Code-side recount + one targeted retry - only meaningful when a
      // target length was actually set (see toneShiftPrompt's lengthFitBlock
      // fallback for the no-target case).
      if (length) {
        const target = parseInt(length, 10);
        const { min, max } = lengthRange(target, unit);
        const failing = finalBullets.filter((b) => {
          const actual = countText(b.rewritten, unit);
          return actual < min || actual > max;
        });

        if (failing.length) {
          try {
            const retryRaw = await callClaude([{
              role: "user",
              content: toneShiftRetryPrompt(
                failing.map((f) => ({ original: f.original, rewritten: f.rewritten, actualCount: countText(f.rewritten, unit) })),
                domain, format, unit, min, max
              )
            }]);
            const fixed = parseToneShiftRetryResponse(retryRaw);
            const fixedByOriginal = new Map(fixed.map((f) => [f.original, f]));
            // Still-failing bullets (no match, or the retry itself still
            // misses range) fall through as-is - "show the closest version"
            // rather than lose the first attempt.
            finalBullets = finalBullets.map((b) => fixedByOriginal.get(b.original) || b);
          } catch {
            // Retry call itself failed (network/parse) - keep the first
            // attempt's bullets rather than losing the whole result.
          }
        }
      }

      const results: ToneOutput[] = finalBullets.map((b) => {
        let badge = "";
        if (length) {
          const target = parseInt(length, 10);
          const { min, max } = lengthRange(target, unit);
          const actual = countText(b.rewritten, unit);
          if (actual > max) badge = "+" + (actual - max) + " over";
          else if (actual < min) badge = "-" + (min - actual) + " under";
        }
        const actualCount = countText(b.rewritten, unit);
        return {
          label: shape + " · " + b.verb + " · " + actualCount + " " + unit.toLowerCase(),
          text: b.rewritten,
          badge
        };
      });
      setOut(results);
      setLoading(false);
      logActivity("tone_shift", shape + " · " + domain);
    } catch {
      setLoading(false);
      setError("Could not reach the model - is the backend running?");
    }
  }

  const domainOptions: DropdownOption[] = DOMAIN_OPTIONS.map((o) => ({
    label: o,
    selected: domain === o,
    pick: () => {
      setDomain(o);
      domainSel.reset();
    }
  }));
  const formatOptions: DropdownOption[] = FORMAT_OPTIONS.map((o) => ({
    label: o,
    selected: format === o,
    pick: () => {
      setFormat(o);
      formatSel.reset();
    }
  }));
  const unitOptions: DropdownOption[] = UNIT_OPTIONS.map((o) => ({
    label: o,
    selected: unit === o,
    pick: () => {
      setUnit(o);
      unitSel.reset();
    }
  }));

  const shapeLabel = format.split(" (")[0];
  const hint = loading ? "Generating…" : error || (ready ? "Rephrases every filled bullet into the selected format." : "Fill at least one bullet and pick both a domain and a format.");
  const outMeta = out && out.length ? domain + " · " + shapeLabel + (length ? " · " + length + " " + unit.toLowerCase() : "") : "Nothing generated yet";

  return (
    <>
      <PageHeader title="Tone Shifter" subtitle="Rewrite answers for the room you are in" />

      {!out && (
        <>
          <div className="section-title" style={{ marginTop: 34 }}>
            What you'll find here
          </div>
          <div className="grid-3">
            <div className="feature-card" style={{ cursor: "default" }}>
              <div className="fc-icon icon-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 6h13" />
                  <path d="M8 12h13" />
                  <path d="M8 18h13" />
                  <path d="M3 6h.01" />
                  <path d="M3 12h.01" />
                  <path d="M3 18h.01" />
                </svg>
              </div>
              <div className="feature-title">Paste your bullets</div>
              <div className="feature-desc" style={{ marginBottom: 0 }}>
                Drop in up to 3 bullets from your resume or story - we rewrite them, we don't summarize or shorten them.
              </div>
            </div>
            <div className="feature-card" style={{ cursor: "default" }}>
              <div className="fc-icon icon-purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </div>
              <div className="feature-title">Pick domain &amp; format</div>
              <div className="feature-desc" style={{ marginBottom: 0 }}>
                Choose the room you're walking into - consulting, product, finance - and the output shape and length per bullet.
              </div>
            </div>
            <div className="feature-card" style={{ cursor: "default" }}>
              <div className="fc-icon icon-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div className="feature-title">Same facts, new voice</div>
              <div className="feature-desc" style={{ marginBottom: 0 }}>
                No invented numbers, no filler - just the same achievement, reworded for the audience you specify.
              </div>
            </div>
          </div>
        </>
      )}

      <div className="two-col-sidebar-wide" style={{ marginTop: 26 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "20px 20px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: "0.65625rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--text-lightgray)" }}>Your bullet points</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-lightgray)" }}>{filled.length + " of " + bullets.length + " filled"}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 14 }}>
            {bullets.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ flex: "none", marginTop: 13, width: 6, height: 6, borderRadius: "50%", background: "var(--border-focus)" }}></span>
                <textarea
                  value={b}
                  onChange={(e) => setBullet(i, e.target.value)}
                  placeholder={i === 0 ? "e.g. Led a 4-member team to redesign the onboarding flow, cutting drop-off by 18%" : "Add another bullet from your resume"}
                  rows={2}
                  className="tone-input"
                  style={{ flex: 1, resize: "vertical", border: "1px solid var(--border-soft)", borderRadius: "var(--r-sm)", padding: "10px 12px", font: "400 0.875rem/1.5 'Instrument Sans',sans-serif", color: "var(--text-900)", outline: "none", background: "var(--field-bg-alt)" }}
                />
                <button type="button" onClick={() => removeBullet(i)} title="Remove" className="unbutton tone-remove-bullet" style={{ flex: "none", marginTop: 10, width: 24, height: 24, borderRadius: "var(--r-sm)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-disabled)", fontSize: "0.875rem", cursor: "pointer" }}>
                  ×
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setBullets((arr) => arr.concat(""))} className="unbutton tone-add-bullet" style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", border: "1px dashed var(--border-strong)", borderRadius: "var(--r-sm)", cursor: "pointer", color: "var(--indigo)", fontSize: "0.84375rem", fontWeight: 600 }}>
            <span style={{ fontSize: "0.9375rem" }}>+</span>
            <span>Add bullet point</span>
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <LabeledDropdown label="Domain" value={domain || "Select a domain"} hasValue={!!domain} open={domainSel.open} toggle={domainSel.toggle} options={domainOptions} />
          <LabeledDropdown label="Format" value={format || "Select a format"} hasValue={!!format} open={formatSel.open} toggle={formatSel.toggle} options={formatOptions} />

          <div style={{ background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "13px 16px 15px" }}>
            <div style={{ color: "var(--text-lightgray)", fontSize: "0.65625rem", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Length per bullet</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                value={length}
                onChange={onLength}
                inputMode="numeric"
                placeholder="e.g. 40"
                className="code-textarea-plain"
                style={{ flex: 1, minWidth: 0, border: "1px solid var(--border-soft)", borderRadius: "var(--r-sm)", padding: "9px 11px", font: "600 0.90625rem 'Instrument Sans',sans-serif", color: "var(--text-900)", outline: "none", background: "var(--field-bg-alt)" }}
              />
              <div style={{ position: "relative", flex: "none", width: 126 }}>
                <button type="button" onClick={unitSel.toggle} aria-expanded={unitSel.open} aria-haspopup="listbox" className="unbutton selector-trigger" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "9px 11px", border: "1px solid " + (unitSel.open ? "var(--border-focus)" : "var(--border-soft)"), borderRadius: "var(--r-sm)", background: "var(--field-bg-alt)", cursor: "pointer" }}>
                  <span style={{ fontSize: "0.96875rem", fontWeight: 600, color: "var(--text-900)" }}>{unit}</span>
                  <span style={{ flex: "none", color: "var(--text-lightgray)", fontSize: "0.75rem", transition: "transform .18s var(--t-ease)", transform: `rotate(${unitSel.open ? 180 : 0}deg)` }}>▾</span>
                </button>
                {unitRendered && (
                  <div role="listbox" className={unitExiting ? "t-pop-out" : "t-pop-in"} style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20, background: "var(--surface)", border: "1px solid var(--card-border)", borderRadius: "var(--r-sm)", boxShadow: "0 0 0 1px var(--card-border)", padding: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                    {unitOptions.map((o, i) => (
                      <button type="button" key={i} onClick={o.pick} role="option" aria-selected={o.selected} className="unbutton selector-option" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: "var(--r-sm)", cursor: "pointer", fontSize: "0.875rem", color: o.selected ? "var(--text-900)" : "var(--text-600)", fontWeight: o.selected ? 600 : 400, background: o.selected ? "var(--surface-sunken)" : "transparent" }}>
                        <span>{o.label}</span>
                        <span style={{ color: "var(--green)", fontSize: "0.75rem", opacity: o.selected ? 1 : 0 }}>✓</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={confirm}
            style={{
              border: 0,
              borderRadius: "var(--r-sm)",
              padding: "14px 20px",
              font: "600 0.90625rem 'Instrument Sans',sans-serif",
              background: ready && !loading ? "var(--indigo-700)" : "var(--track)",
              color: ready && !loading ? "var(--surface)" : "var(--text-muted)",
              cursor: ready && !loading ? "pointer" : "not-allowed"
            }}
          >
            Confirm and rephrase
          </button>
          <p style={{ margin: 0, fontSize: "0.75rem", lineHeight: 1.5, color: "var(--text-lightgray)" }}>{hint}</p>
          <p style={{ margin: "-6px 0 0", fontSize: "0.75rem", lineHeight: 1.5, color: "var(--text-lightgray)" }}>Note: The character count includes white spaces.</p>
        </div>
      </div>

      <div style={{ marginTop: 22, background: "var(--surface)", border: "1px solid var(--border-input)", borderRadius: "var(--r-md)", boxShadow: "0 0 0 1px var(--card-border)", padding: "20px 22px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: "0.65625rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--text-lightgray)" }}>Output</span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-lightgray)" }}>{outMeta}</span>
        </div>
        {out && out.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 14 }}>
            {out.map((o, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                <span style={{ flex: "none", marginTop: 9, width: 6, height: 6, borderRadius: "50%", background: "var(--indigo)" }}></span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "0.90625rem", lineHeight: 1.6, color: "var(--text-900)" }}>{o.text}</p>
                  {/* Only shown when the one allowed retry still couldn't
                      land the bullet inside its length range - "closest
                      version" per spec, flagged rather than hidden. */}
                  {o.badge && (
                    <span style={{ display: "inline-block", marginTop: 4, padding: "2px 8px", borderRadius: "var(--r-pill)", background: "var(--amber-wash, #fff4e5)", color: "var(--amber)", fontSize: "0.6875rem", fontWeight: 700 }}>
                      {o.badge}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: "12px 0 0", fontSize: "0.875rem", color: "var(--text-lightgray)" }}>Add your bullet points, pick a domain and a format, then hit confirm. The rephrased version appears here.</p>
        )}
      </div>
    </>
  );
}

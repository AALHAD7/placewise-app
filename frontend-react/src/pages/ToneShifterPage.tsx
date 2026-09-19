import { useState, type ChangeEvent } from "react";
import { callClaude, logActivity } from "../lib/apiClient";
import { parseToneShiftResponse, toneShiftPrompt } from "../lib/prompts";
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

const DOMAIN_OPTIONS = ["Consulting", "Product Management", "Finance and Banking", "Marketing and Brand", "Operations and Supply Chain", "Data and Analytics", "General Management"];
const FORMAT_OPTIONS = ["STAR (Situation, Task, Action, Result)", "RAC (Result, Action, Context)", "CAR (Context, Action, Result)", "PAR (Problem, Action, Result)", "SOAR (Situation, Obstacle, Action, Result)", "Impact-first one-liner"];
const UNIT_OPTIONS = ["Characters", "Words"];

interface DropdownOption { label: string; selected: boolean; pick: () => void }

function LabeledDropdown({ label, value, hasValue, open, toggle, options }: { label: string; value: string; hasValue: boolean; open: boolean; toggle: () => void; options: DropdownOption[] }) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{ background: "#fff", border: "1px solid " + (open ? "#BBD3F7" : "#e9eaee"), borderRadius: 14, boxShadow: "0 1px 2px rgba(16,24,40,.05)", overflow: "hidden" }}>
        <div onClick={toggle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "15px 18px", cursor: "pointer" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#9ca3af", fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
            <div style={{ marginTop: 3, fontSize: 15.5, fontWeight: 600, color: hasValue ? "#111827" : "#9ca3af" }}>{value}</div>
          </div>
          <span style={{ flex: "none", color: "#9ca3af", fontSize: 12, transition: "transform .18s", transform: `rotate(${open ? 180 : 0}deg)` }}>▾</span>
        </div>
      </div>
      {open && (
        <div className="t-pop-in" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20, background: "#fff", border: "1px solid #e0e1e6", borderRadius: 9, boxShadow: "0 14px 34px -12px rgba(16,24,40,.28)", padding: 8, display: "flex", flexDirection: "column", gap: 2, maxHeight: 280, overflow: "auto" }}>
          {options.map((o, i) => (
            <div key={i} onClick={o.pick} className="selector-option" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: 9, cursor: "pointer", fontSize: 14, color: o.selected ? "#111827" : "#4b5563", fontWeight: o.selected ? 600 : 400, background: o.selected ? "#f3f4f6" : "transparent" }}>
              <span>{o.label}</span>
              <span style={{ color: "#059669", fontSize: 12, opacity: o.selected ? 1 : 0 }}>✓</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ToneOutput { label: string; text: string }

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
      const raw = await callClaude([{ role: "user", content: toneShiftPrompt(filled, domain, shape, length, unit) }]);
      const items = parseToneShiftResponse(raw);
      const results = items
        .slice()
        .sort((a, b) => a.input_index - b.input_index)
        .map((it) => ({
          label: shape + " · Point " + (it.input_index + 1) + " · " + it.length + " " + (it.length_unit || unit).toLowerCase(),
          text: it.output
        }));
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

      <div style={{ marginTop: 26, display: "grid", gridTemplateColumns: "minmax(0,1.55fr) minmax(300px,.85fr)", gap: 22, alignItems: "start" }}>
        <div style={{ background: "#fff", border: "1px solid #e9eaee", borderRadius: 14, boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "20px 20px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#9ca3af" }}>Your bullet points</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>{filled.length + " of " + bullets.length + " filled"}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 14 }}>
            {bullets.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ flex: "none", marginTop: 13, width: 6, height: 6, borderRadius: "50%", background: "#BBD3F7" }}></span>
                <textarea
                  value={b}
                  onChange={(e) => setBullet(i, e.target.value)}
                  placeholder={i === 0 ? "e.g. Led a 4-member team to redesign the onboarding flow, cutting drop-off by 18%" : "Add another bullet from your resume"}
                  rows={2}
                  className="tone-input"
                  style={{ flex: 1, resize: "vertical", border: "1px solid #e5e7eb", borderRadius: 9, padding: "10px 12px", font: "400 14px/1.5 'Instrument Sans',sans-serif", color: "#111827", outline: "none", background: "#fbfbfd" }}
                />
                <span onClick={() => removeBullet(i)} title="Remove" className="tone-remove-bullet" style={{ flex: "none", marginTop: 10, width: 24, height: 24, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#c2c4cc", fontSize: 14, cursor: "pointer" }}>
                  ×
                </span>
              </div>
            ))}
          </div>
          <div onClick={() => setBullets((arr) => arr.concat(""))} className="tone-add-bullet" style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", border: "1px dashed #d5d6dd", borderRadius: 9, cursor: "pointer", color: "#4F46E5", fontSize: 13.5, fontWeight: 600 }}>
            <span style={{ fontSize: 15 }}>+</span>
            <span>Add bullet point</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <LabeledDropdown label="Domain" value={domain || "Select a domain"} hasValue={!!domain} open={domainSel.open} toggle={domainSel.toggle} options={domainOptions} />
          <LabeledDropdown label="Format" value={format || "Select a format"} hasValue={!!format} open={formatSel.open} toggle={formatSel.toggle} options={formatOptions} />

          <div style={{ background: "#fff", border: "1px solid #e9eaee", borderRadius: 14, boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "13px 16px 15px" }}>
            <div style={{ color: "#9ca3af", fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Length per bullet</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                value={length}
                onChange={onLength}
                inputMode="numeric"
                placeholder="e.g. 40"
                className="code-textarea-plain"
                style={{ flex: 1, minWidth: 0, border: "1px solid #e5e7eb", borderRadius: 9, padding: "9px 11px", font: "600 14.5px 'Instrument Sans',sans-serif", color: "#111827", outline: "none", background: "#fbfbfd" }}
              />
              <div style={{ position: "relative", flex: "none", width: 126 }}>
                <div onClick={unitSel.toggle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "9px 11px", border: "1px solid " + (unitSel.open ? "#BBD3F7" : "#e5e7eb"), borderRadius: 9, background: "#fbfbfd", cursor: "pointer" }}>
                  <span style={{ fontSize: 15.5, fontWeight: 600, color: "#111827" }}>{unit}</span>
                  <span style={{ flex: "none", color: "#9ca3af", fontSize: 12, transition: "transform .18s", transform: `rotate(${unitSel.open ? 180 : 0}deg)` }}>▾</span>
                </div>
                {unitSel.open && (
                  <div className="t-pop-in" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20, background: "#fff", border: "1px solid #e0e1e6", borderRadius: 9, boxShadow: "0 14px 34px -12px rgba(16,24,40,.28)", padding: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                    {unitOptions.map((o, i) => (
                      <div key={i} onClick={o.pick} className="selector-option" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: 9, cursor: "pointer", fontSize: 14, color: o.selected ? "#111827" : "#4b5563", fontWeight: o.selected ? 600 : 400, background: o.selected ? "#f3f4f6" : "transparent" }}>
                        <span>{o.label}</span>
                        <span style={{ color: "#059669", fontSize: 12, opacity: o.selected ? 1 : 0 }}>✓</span>
                      </div>
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
              borderRadius: 9,
              padding: "14px 20px",
              font: "600 14.5px 'Instrument Sans',sans-serif",
              background: ready && !loading ? "#4338CA" : "#eceef2",
              color: ready && !loading ? "#fff" : "#a9acb6",
              cursor: ready && !loading ? "pointer" : "not-allowed"
            }}
          >
            Confirm and rephrase
          </button>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "#9ca3af" }}>{hint}</p>
          <p style={{ margin: "-6px 0 0", fontSize: 12, lineHeight: 1.5, color: "#9ca3af" }}>Note: The character count includes white spaces.</p>
        </div>
      </div>

      <div style={{ marginTop: 22, background: "#fff", border: "1px solid #e9eaee", borderRadius: 14, boxShadow: "0 1px 2px rgba(16,24,40,.05)", padding: "20px 22px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#9ca3af" }}>Output</span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{outMeta}</span>
        </div>
        {out && out.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 14 }}>
            {out.map((o, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                <span style={{ flex: "none", marginTop: 9, width: 6, height: 6, borderRadius: "50%", background: "#4F46E5" }}></span>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "#111827" }}>{o.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: "12px 0 0", fontSize: 14, color: "#9ca3af" }}>Add your bullet points, pick a domain and a format, then hit confirm. The rephrased version appears here.</p>
        )}
      </div>
    </>
  );
}

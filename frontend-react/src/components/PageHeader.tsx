// Ported from frontend/index.html lines 308-313 (page.showHeader block).
// Home and Skill opt out of this generic header (see migration plan §0.4) -
// Home has no header at all, Skill builds its own breadcrumb.
// Size/tracking/leading are set as a pair: tracking tightens as the type
// grows, leading tightens with it.

export default function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <h1 style={{ margin: 0, fontSize: "var(--fs-heading)", lineHeight: 1.12, fontWeight: 700, letterSpacing: "-.022em", color: "var(--text-900)" }}>{title}</h1>
      </div>
      <p style={{ margin: "8px 0 0", color: "var(--text-gray2)", fontSize: "var(--fs-body)", lineHeight: 1.55 }}>{subtitle}</p>
    </>
  );
}

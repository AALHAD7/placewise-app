// Ported from frontend/index.html lines 308-313 (page.showHeader block).
// Home and Skill opt out of this generic header (see migration plan §0.4) -
// Home has no header at all, Skill builds its own breadcrumb.

export default function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <h1 style={{ margin: 0, fontSize: 29, fontWeight: 700, letterSpacing: "-.022em", color: "#111827" }}>{title}</h1>
      </div>
      <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: 14.5 }}>{subtitle}</p>
    </>
  );
}

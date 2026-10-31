// Shows whether content is grounded in a real casebook citation, or is general AI
// guidance - never both, never blended (grounding policy, CLAUDE.md). R8: the first
// place this fires is wherever a backend response already carries
// `groundedInCasebooks` + a citation (R7/G2/G3 work) but the frontend wasn't
// showing it yet.

import type { GuesstimateCitation as Citation } from "../types/api";

function formatCitation(c: Citation): string {
  const pages = c.pages.length === 1 ? `p.${c.pages[0]}` : `pp.${c.pages[0]}-${c.pages[c.pages.length - 1]}`;
  const source = [c.school, c.club].filter(Boolean).join(" ") || null;
  const parts = [c.casebook, c.year, pages].filter(Boolean);
  return (source ? `${source} - ` : "") + parts.join(", ");
}

const FALLBACK_LABEL = "General guidance - not from the casebooks";

export default function GroundingNote({
  groundedInCasebooks,
  citation,
  citations
}: {
  groundedInCasebooks: boolean;
  citation?: Citation | null;
  citations?: Citation[];
}) {
  if (!groundedInCasebooks) {
    return <div className="grounding-note grounding-note-fallback">{FALLBACK_LABEL}</div>;
  }
  const list = citations && citations.length ? citations : citation ? [citation] : [];
  if (!list.length) return null;
  return (
    <div className="grounding-note grounding-note-cited">
      <span className="grounding-note-badge">From the casebooks</span>
      <span className="grounding-note-sources">{list.map(formatCitation).join(" · ")}</span>
    </div>
  );
}

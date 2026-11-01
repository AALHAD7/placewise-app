// Shows whether content is NOT grounded (general AI guidance) - never shows which
// specific casebook/page a grounded answer came from. Per-answer source attribution
// (school/casebook/page) was deliberately removed (Aalhad's call, 2026-11-02): the site
// already states globally that answers are grounded in the casebooks, so repeating "This
// is from the IIMK casebook" on every single answer was redundant. The one thing that
// still must be disclosed per-answer is the opposite case - when something is NOT from
// the casebooks at all - since silently passing off general AI guidance as casebook
// content is the one blend the grounding policy (CLAUDE.md) forbids outright. Citation
// data (school/casebook/page) is still returned by the API and still exists for
// debugging/admin use; this component just no longer renders it to students.

export default function GroundingNote({ groundedInCasebooks }: { groundedInCasebooks: boolean }) {
  if (groundedInCasebooks) return null;
  return <div className="grounding-note grounding-note-fallback">General guidance - not from the casebooks</div>;
}

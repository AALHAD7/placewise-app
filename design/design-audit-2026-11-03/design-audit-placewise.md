# PlaceWise Design Audit — 2026-11-03

## Fix status (2026-11-03, same day)

4 of 6 findings fixed, CSS/component-only, one commit per finding, verified in-browser
(screenshots in `screenshots-after/`), no new console errors introduced.

| Finding | Status | Commit |
|---|---|---|
| HIGH — blue vs orange accent conflict | **Fixed** | `style(design): FINDING-001` |
| HIGH — white EXAMPLE callout breaks dark theme | **Fixed** (all 4 callout variants, not just Example) | `style(design): FINDING-002` |
| MEDIUM — inconsistent Role page bullet colors | **Fixed** | `style(design): FINDING-003` |
| MEDIUM — unstyled loading states | **Fixed** (Guesstimates + Role; SkillPage's progress bar turned out to already be correctly orange/animated — a compressed screenshot made it look gray in the original audit) | `style(design): FINDING-004` |
| MEDIUM — broken `□□□□` glyph in guesstimate content | **Deferred** — lives in casebook-extracted content (ingestion pipeline), not frontend styling. Needs `ingestion-engineer` to trace, not a CSS fix. |  |
| LOW — 34-node ASCII diagram density, stray "30", generic hero illustration, placeholder contrast | **Deferred** — diagram density and the stray number are content/data from ingestion, not styling; the hero illustration needs a new asset decision from Aalhad; placeholder contrast (~4.3:1) is borderline but it's decorative text, not body content, and changing it is a sitewide token change out of proportion to the finding. |


Scope: visual design and color only, per owner request (friends flagged "the UI could be fixed,"
specifically color choice). Navigation/IA explicitly out of scope. No fixes applied — findings only.

Pages reviewed: Home (logged-out + guest), Frameworks list, Frameworks → MECE detail (ASCII diagram),
Guesstimates, Role → Consultant (Associate) detail, Role → Skill drill page, Tone Shifter.
Screenshots in `screenshots/`.

## Extracted design system (as rendered)

- **Background:** `rgb(16,18,22)` — near-black charcoal, consistent everywhere. Good foundation.
- **Accent colors in active use:** orange `rgb(255,107,53)` (primary — CTAs, active nav, bullets,
  links), blue `rgb(37,99,235)` (icon-circle badges, login-card border glow), green/mint
  `rgb(52,211,153)` (guesstimate checkmarks, Exit Opportunities bullets). Three accent hues competing
  with no clear semantic rule for when each is used.
- **Fonts:** `-apple-system / SF Pro Text / Inter / Plus Jakarta Sans / Helvetica Neue / Arial` as the
  UI stack, `Plus Jakarta Sans / Instrument Sans` for headings, `Caveat` (handwritten cursive) for one
  hero label, plus a monospace for ASCII diagrams. 3-4 families in practice.
- Grade (color/palette only): **C** — coherent dark base, but the orange/blue/green combination reads
  as unplanned (see findings below) rather than designed.

## Findings

### HIGH — Blue accent competes with the orange brand color, with no rule for which wins
Every "What you'll find here" icon badge (Frameworks, Role, Tone Shifter — at least 3 pages) uses
blue (`#2563EB`), while every CTA, active nav tab, bullet, and link elsewhere on the same pages uses
orange (`#FF6B35`). The login card also has a blue border glow. There's no visible logic for why some
elements get blue and others orange — it reads like two different sessions picked the accent color.
**Recommendation to consider:** pick one accent (orange, since it's already the dominant CTA color)
and use blue only for an actual second semantic meaning (e.g., "informational" vs "actionable"), or
drop it.

### HIGH — The "3-card icon-in-circle" info panel is reused near-verbatim on every page
Frameworks, Role, and Tone Shifter all open with an identical "What you'll find here" block: three
cards, each a colored icon circle + bold title + 2-line description, laid out symmetrically. This is
the single most recognizable AI-template pattern (icon-in-colored-circle, 3-up grid, matched card
heights, centered icon). Seeing it repeat page after page makes the whole site feel templated rather
than like a product with its own point of view, even though the underlying content differs per page.

### HIGH — A pure white box breaks the dark theme with no warning
On the MECE framework detail page, the "EXAMPLE" callout is rendered as a bright white card with dark
text, sitting directly below an all-charcoal ASCII diagram panel. Every other surface on the site is
dark. This one element reads as an unstyled/default component that got missed, not an intentional
design choice — it's the most jarring thing on any page reviewed. (`frameworks-consulting` /
`mece-detail` screenshots.)

### MEDIUM — Bullet/list styling is inconsistent within a single page
On the Role → Consultant detail page, three visually identical list blocks (Skills Required, Career
Progression, Exit Opportunities) are styled three different ways: Skills Required items render as
orange underlined hyperlinks wrapping across two lines; Career Progression uses plain white text with
orange dot bullets; Exit Opportunities uses plain white text with green/mint dot bullets. Nothing in
the content explains why Exit Opportunities gets the "success" green while the others don't.

### MEDIUM — Loading states are unstyled text/default gray, not on-brand
- Guesstimates: "Loading a problem…" — plain text, no skeleton shape.
- Role page: "Loading role info…" and "Loading topics… 27%" — plain text with a raw percentage.
- Skill drill page: "Generating core concepts…" with a plain gray progress bar — no accent color at
  all, looks like a default/unstyled `<progress>` element on an otherwise carefully colored page.
These are the first thing a student sees after every click, and they're the least designed moment on
the site.

### MEDIUM — Broken/missing glyph in casebook content rendering
On a Guesstimates problem (Indus Insights book-reading estimate), the source line renders as
`Indus Insights | □□□□ Click here to view...` — tofu boxes where an icon/emoji character should be.
Not a color issue, but visually broken and worth a look since it sits right in primary content.

### LOW / POLISH
- The ASCII flow diagram on the "books read" guesstimate is 34 numbered nodes deep and visually
  overwhelming — technically faithful to the source but reads as a wall of boxes rather than a diagram
  a student can scan. Worth a legibility pass separate from color.
- A bare, unlabeled "30" appears directly below the diagram summary on the same guesstimate page —
  looks like leftover debug output rather than content.
- Placeholder text in Tone Shifter's bullet-point inputs (e.g. "Add another bullet from your resume")
  is low-contrast gray-on-charcoal — borderline for comfortable reading, worth a contrast check.
- Hero illustration on Home (cartoon person at a laptop, flat-illustration style) is a generic stock
  "SaaS hero" visual that doesn't carry any PlaceWise-specific identity — swappable with any
  productivity app's homepage.

## What's already working
- The charcoal base (`#101216`) is consistent across every page and screen state — a real asset, not
  a finding.
- The Frameworks domain list (Case Structuring / Market Sizing & Entry / etc.) uses a clean row layout
  rather than cards — reads well, good information density, no AI-slop pattern there.
- Orange as a single, confident CTA color (when it isn't competing with blue) is legible and gives the
  product a distinct identity — "charcoal + orange" is a reasonable foundation to double down on
  rather than replace.
- The Role detail page's two-column info layout (What this role is / Who hires for it / Salary /
  Skills / Career progression / Exit opportunities) is well-organized and scannable once loaded.

## Suggested priority if acting on this
1. Resolve the blue-vs-orange accent conflict (HIGH, cheap — mostly a CSS token/class change).
2. Fix the white "EXAMPLE" callout box to match the dark theme (HIGH, trivial CSS fix).
3. Unify the three list styles on the Role detail page (MEDIUM, CSS-only).
4. Style the loading states with the orange accent + real skeleton shapes instead of plain text/gray
   bars (MEDIUM, moderate effort, but it's the most-seen moment on the site).
5. Decide whether to keep or redesign the repeated 3-card "What you'll find here" block — lower
   priority since it's not broken, just generic; a bigger lift if changed.

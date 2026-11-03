# Jargon simplification — all 6 domains (42 frameworks) — 2026-11-03

**Start here:** `all-domains-before-after.html` — open directly in a browser for the full
before/after across every domain (jump-to table of contents, red/green diff blocks). This
folder started as a Finance-only pilot (see below); after review, the same pass ran on the
remaining 5 domains. The `finance-*` files are the original pilot artifacts, kept for history —
`all-domains-before-after.*` is the complete, current picture.

**Combined result:** 42 frameworks reviewed across Finance (10), Consulting (7), Prodman (8),
Marketing:Sales (8), General Management (6), HR (3). 15 frameworks changed, 32 fields total —
all 10 in Finance, 5 more spread across Consulting/Prodman/Marketing:Sales. Consulting/General
Management/HR frameworks (SWOT, Porter's, MECE, 3Cs, 9-Box Grid, McKinsey 7S, etc.) are mostly
already plain-language by nature, so the pass correctly left most of them untouched rather than
forcing a change. All per-domain backups and diffs: `backups/`.

---

## Original Finance pilot notes

Reason: user feedback (via Aalhad's friends) that Frameworks page content, particularly in
Finance, uses jargon that's hard to parse without existing domain knowledge. Concrete example
given: "Equity Value = Diluted Share Price × Fully Diluted Shares Outstanding" read as too
dense for a general MBA reader.

**Important calibration note:** the friends' suggested fix for that example — "diluted share
price into total outstanding shares" — would have been a precision loss, not a simplification.
"Fully diluted shares outstanding" and "total outstanding shares" are different numbers
(fully diluted includes options, warrants, and convertibles). The approach used here instead
keeps every precise term intact and adds a short plain-language clarification the first time
it appears, so the content stays correct for finance-focused readers while becoming
accessible to general ones.

## What ran

`backend/scripts/simplifyFrameworkJargon.js` — a whole-framework Gemini rewrite pass (flash-lite
tier) followed by a faithfulness+precision+restraint judge call, same fail-closed shape as the
R7b paraphrase pipeline (`consultingRetrieval.js`'s `paraphraseChunk`/`judgeParaphraseFaithful`):
a framework whose rewrite fails the judge keeps its original text untouched, up to 6 retries
(the judge's own rejection reason is fed back into the next attempt).

**Prompt design went through several iterations during this run** (visible in the session, not
re-run here): v1 (per-field, independent) over-defined every term including basic vocabulary
("balance sheet" got a definition) and re-defined the same term repeatedly within one
framework — caught in a dry run before anything was applied. v2 moved to whole-framework
context with an explicit, exhaustive exempt list (balance sheet, income statement, cash flow
statement, assets, liabilities, equity, revenue, profit/net income, debt, market,
shares/stock — nothing else assumed familiar) and an explicit instruction that finance
specialists not noticing a difference is expected and correct, since the content is written
for the general-MBA reader, not the specialist.

## Result: 10/10 Finance frameworks updated

| Framework | Fields changed | Attempts needed |
|---|---|---|
| 3 Financial Statements Integration | example, steps | 1 |
| Beta & Capital Asset Pricing Model (CAPM) | description, when_to_use, steps | 1 |
| Comparable Company Analysis | description, when_to_use | 4 |
| DCF (Discounted Cash Flow) | example, when_to_use, when_not_to_use, steps | 3 |
| Enterprise Value & Equity Value (The Bridge) | example, when_to_use, steps | 2 |
| Income Statement Waterfall & P&L Walk | description, steps | 1 |
| LBO Basics (Leveraged Buyout) | example, when_to_use, when_not_to_use | 1 |
| Terminal Value (Perpetuity vs Exit Multiple) | description, example, steps | 2 |
| WACC (Weighted Average Cost of Capital) | when_to_use, when_not_to_use, steps | 1 |
| Working Capital & Cash Conversion Cycle | steps | 1 |

Full before/after text for every field: `finance-diff.json`. Pre-change snapshot of all 10
rows (for one-step revert): `finance-backup-pre-simplify.json`.

## The example that started this

Before: `"Start with Equity Value = Diluted Share Price × Fully Diluted Shares Outstanding (Market Cap)."`

After: `"Start with Equity Value = Diluted Share Price × Fully Diluted Shares Outstanding (total shares including all potential options, warrants, and convertibles) (Market Cap)."`

Verified live on the running site after applying (screenshot taken during the session) — same
text, including inside the ASCII diagram's step list.

## Revert

```
node backend/scripts/restoreFrameworksBackup.js content/jargon-simplification-2026-11-03/finance-backup-pre-simplify.json
```

Restores all 10 Finance rows to their exact pre-simplification text in one step.

## Status: complete

Pilot approved after review; the same pass has since run on all remaining domains. See
`all-domains-before-after.html` for the full, current before/after across all 42 frameworks.

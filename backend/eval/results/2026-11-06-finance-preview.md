# RAG eval — Finance compendium preview, read-only over the inactive pool (2026-11-06T14:43:03.219Z)

**This is NOT a live-site measurement.** `is_active` was not touched anywhere - every retrieved row is still the FIN1.02 inactive Finance pool (208 chunks, one document) plus, for the cross-domain probes, the same 9 inactive Consulting documents `run_eval_v2_preview.js`/`run_eval_paraphrase_preview.js` already use. Retrieval is done locally (cosine similarity over chunk embeddings fetched directly by `document_id`), never through the live `match_ingest_chunks` RPC, which requires `is_active = true`. The real `decideCoverage` and `judgeRelevanceOnce` functions from `consultingRetrieval.js` are called directly - no retrieval or scoring logic is reimplemented in this script.

## Summary - Finance compendium content/chunking quality

Of 10 Finance questions (8 covered, 2 not-covered), **10/10** (100%) got the expected covered/not-covered verdict.
Of 8 covered questions with required terms, **6/8** (75%) had every required term present in the matched chunk.

| Question | Expected covered | Actual covered | Match | Top section | Similarity | must_include |
|---|---|---|---|---|---|---|
| f001 | true | true | yes | Net Present Value (NPV) | 0.753 | pass |
| f002 | true | true | yes | Revenue Recognition: Ind AS 115 / IFRS 15 Five-Step Model | 0.818 | pass |
| f003 | true | true | yes | DuPont Analysis (3-Step and 5-Step) | 0.800 | pass |
| f004 | true | true | yes | Discounted Cash Flow: Building FCFF and Discounting | 0.785 | pass |
| f005 | true | true | yes | PE Value Creation Levers and Returns Attribution | 0.679 | fail |
| f006 | true | true | yes | Options: Basics, Payoffs and Moneyness | 0.719 | pass |
| f007 | true | true | yes | Asset Quality: NPAs, Provisioning, Restructuring and Write-offs | 0.780 | pass |
| f008 | true | true | yes | Payment Aggregators, Gateways and Payment Orchestration | 0.661 | fail |
| f009 | false | false | yes | - | - | n/a |
| f010 | false | false | yes | - | - | n/a |

**must_include failures:**
- f005: Missing from matched chunk: leveraged buyout, sponsor equity
- f008: Missing from matched chunk: NPCI

## Summary - cross-domain leakage probes (FIN1.04 risk check)

Each probe question is retrieved against the COMBINED Finance + Consulting inactive pool (not scoped to one domain, matching how `groundedQaAnswer` now searches both source classes with `domain: null`). "Leaked" means the question's own tagged domain did NOT match the domain of the chunk that actually won the relevance gate.

### f011 [expected domain: Consulting]
Q: What is the MECE principle and how do you use it to structure a consulting case?
- covered: true
- winning chunk's domain: Consulting (IIM Calcutta Consulting CaseBook 2025-26.pdf — "Frameworks provide clarity of thought and helps you structure your arguments bet")
- **leaked cross-domain: no**
- Top 6 retrieved rows (domain, source, similarity):
  - Consulting / IIM Calcutta Consulting CaseBook 2025-26.pdf / "Frameworks provide clarity of thought and helps you structure your arguments bet" — 0.751
  - Consulting / ISB Consulting Casebook 2025.pdf / "Structure and Approach" — 0.73
  - Consulting / ISB Consulting Casebook 2025.pdf / "How to use these frameworks?" — 0.728
  - Consulting / ISB Consulting Casebook 2025.pdf / "MECE based Framework" — 0.721
  - Consulting / ISB Consulting Casebook 2025.pdf / "Case Frameworks (part 3/6)" — 0.71
  - Consulting / ISB Consulting Casebook 2025.pdf / "Case Frameworks (part 6/6)" — 0.704

### f012 [expected domain: Finance]
Q: What is WACC and how do you calculate it from the cost of equity and after-tax cost of debt?
- covered: true
- winning chunk's domain: Finance (finance_compendium.md — "Cost of Debt and WACC in Practice")
- **leaked cross-domain: no**
- Top 6 retrieved rows (domain, source, similarity):
  - Finance / finance_compendium.md / "Cost of Debt and WACC in Practice" — 0.736
  - Finance / finance_compendium.md / "Opportunity Cost, Incremental Cash Flows and the Cost of Capital" — 0.709
  - Finance / finance_compendium.md / "Cost of Equity: CAPM, Beta Estimation and Levering/Unlevering" — 0.671
  - Consulting / IIMA-Consult-Prep-Book-Case-Book-2025-26.pdf / "Pepper Spray Manufacturer – Interview Transcript (2/2)" — 0.649
  - Consulting / IIMA-Consult-Prep-Book-Case-Book-2025-26.pdf / "Pepper Spray Manufacturer – Interview Transcript (2/2)" — 0.649
  - Finance / finance_compendium.md / "Capital Structure Theory: Modigliani-Miller, Trade-Off and Pecking Order" — 0.646

**Overall cross-domain leakage verdict on this sample: no leakage detected.** Sample size is 2 probe questions - a first signal, not a final verdict (same caveat R7b's own preview eval carried).

## Gemini call counts

- Embedding calls: 12
- Relevance judge calls (3x per covering row): 216

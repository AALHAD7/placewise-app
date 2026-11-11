# RAG eval — PM compendium preview, read-only over the inactive pool (2026-11-11T08:36:41.817Z)

**This is NOT a live-site measurement.** `is_active` was not touched anywhere - every retrieved row is still the D1.2 inactive PM pool (159 chunks, one document) plus, for the cross-domain probes, the same 9 inactive Consulting documents and the FIN1.02 inactive Finance document every other preview script in this directory already uses. Retrieval is done locally (cosine similarity over chunk embeddings fetched directly by `document_id`), never through the live `match_ingest_chunks` RPC, which requires `is_active = true`. The real `decideCoverage` and `judgeRelevanceOnce` functions from `consultingRetrieval.js` are called directly - no retrieval or scoring logic is reimplemented in this script.

## Summary - PM compendium content/chunking quality

Of 15 PM questions (12 covered, 3 not-covered), **15/15** (100%) got the expected covered/not-covered verdict.
Of 12 covered questions with required terms, **12/12** (100%) had every required term present in the matched chunk.

| Question | Expected covered | Actual covered | Match | Top section | Similarity | must_include |
|---|---|---|---|---|---|---|
| pm001 | true | true | yes | product-design | 0.822 | pass |
| pm002 | true | true | yes | prioritisation | 0.799 | pass |
| pm003 | true | true | yes | metrics | 0.780 | pass |
| pm004 | true | true | yes | root-cause-analysis | 0.784 | pass |
| pm005 | true | true | yes | guesstimates | 0.783 | pass |
| pm006 | true | true | yes | app-critique | 0.734 | pass |
| pm007 | true | true | yes | execution | 0.767 | pass |
| pm008 | true | true | yes | growth | 0.778 | pass |
| pm009 | true | true | yes | strategy | 0.775 | pass |
| pm010 | true | true | yes | platform-economics | 0.740 | pass |
| pm011 | true | true | yes | technology | 0.694 | pass |
| pm012 | true | true | yes | behavioural | 0.816 | pass |
| pm013 | false | false | yes | - | - | n/a |
| pm014 | false | false | yes | - | - | n/a |
| pm015 | false | false | yes | - | - | n/a |

## Summary - cross-domain leakage probes (D1.3 risk check, 3-way pool)

Each probe question is retrieved against the COMBINED Consulting + Finance + Prodman inactive pool (not scoped to one domain, matching how `groundedQaAnswer` now searches all source classes with `domain: null`). "Leaked" means the question's own tagged domain did NOT match the domain of the chunk that actually won the relevance gate.

### f011 [expected domain: Consulting]
Q: What is the MECE principle and how do you use it to structure a consulting case?
- covered: true
- winning chunk's domain: Consulting (The FMS Consulting CaseBook 2023-24 (1).pdf — "MECE Segmentation")
- **leaked cross-domain: no**
- Top 6 retrieved rows (domain, source, similarity):
  - Consulting / The FMS Consulting CaseBook 2023-24 (1).pdf / "MECE Segmentation" — 0.794
  - Consulting / The FMS Consulting Casebook 2021-22.pdf / "MECE Segmentation" — 0.79
  - Consulting / The FMS Consulting Casebook 2021-22.pdf / "MECE Segmentation" — 0.775
  - Consulting / IIM Calcutta Consulting CaseBook 2025-26.pdf / "Frameworks provide clarity of thought and helps you structure your arguments bet" — 0.751
  - Consulting / The FMS Consulting CaseBook 2023-24 (1).pdf / "MECE Segmentation" — 0.742
  - Consulting / ISB Consulting Casebook 2025.pdf / "Structure and Approach" — 0.73

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
  - Finance / finance_compendium.md / "Capital Structure Theory: Modigliani-Miller, Trade-Off and Pecking Order" — 0.646
  - Finance / finance_compendium.md / "Discounted Cash Flow: Building FCFF and Discounting" — 0.639

### pm016 [expected domain: Prodman]
Q: What is the RICE prioritisation framework and how do you score features with it?
- covered: true
- winning chunk's domain: Prodman (PM_Compendium.md — "prioritisation")
- **leaked cross-domain: no**
- Top 6 retrieved rows (domain, source, similarity):
  - Prodman / PM_Compendium.md / "prioritisation" — 0.788
  - Prodman / PM_Compendium.md / "prioritisation" — 0.732
  - Prodman / PM_Compendium.md / "prioritisation" — 0.715
  - Prodman / PM_Compendium.md / "prioritisation" — 0.694
  - Prodman / PM_Compendium.md / "prioritisation" — 0.692
  - Prodman / PM_Compendium.md / "prioritisation" — 0.681

### pm017 [expected domain: Consulting]
Q: What does MECE mean and why is it used to structure a consulting case?
- covered: true
- winning chunk's domain: Consulting (The FMS Consulting CaseBook 2023-24 (1).pdf — "MECE Segmentation")
- **leaked cross-domain: no**
- Top 6 retrieved rows (domain, source, similarity):
  - Consulting / The FMS Consulting CaseBook 2023-24 (1).pdf / "MECE Segmentation" — 0.783
  - Consulting / The FMS Consulting Casebook 2021-22.pdf / "MECE Segmentation" — 0.78
  - Consulting / IIM Calcutta Consulting CaseBook 2025-26.pdf / "Frameworks provide clarity of thought and helps you structure your arguments bet" — 0.762
  - Consulting / The FMS Consulting Casebook 2021-22.pdf / "MECE Segmentation" — 0.757
  - Consulting / ISB Consulting Casebook 2025.pdf / "MECE based Framework" — 0.724
  - Consulting / ISB Consulting Casebook 2025.pdf / "How to use these frameworks?" — 0.722

**Overall cross-domain leakage verdict on this sample: no leakage detected.** Sample size is 4 probe questions - a first signal, not a final verdict (same caveat every prior preview eval in this project has carried).

## Gemini call counts

- Embedding calls: 19
- Relevance judge calls (3x per covering row): 291

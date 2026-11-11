## FAIL

**Switch-over (R9 plans 2-4) does NOT proceed. Missed bar(s):**
- Paraphrase faithfulness: threshold ≥80% of applicable judgments, actual 14/23 (61%)
- Inactive-content gate (hard blocker): threshold Majority of covered, answered questions from an is_active=false document, actual 0/23

# RAG eval — R9 gate (2026-11-11T07:11:14.277Z)

**Scope: the original 39 Consulting questions (q001-q039) only.** `questions.jsonl` has 51 lines total as of this run - 12 Finance-domain questions (f001-f012, including 2 crossDomainProbe questions) were appended by the parallel, already-committed FIN1 phase after this plan was authored. They are a different domain/phase and are excluded from this Consulting-specific gate.

**This is read-only against the shared Supabase DB.** `is_active`, `ENABLE_CONSULTING_RAG_V2`, and `ENABLE_ANSWER_PARAPHRASE` were never read or written by this script. Every retrieved row comes straight from `ingest_chunks` scoped to the 9 Consulting `DOC_IDS`, regardless of `is_active` - see `poolActiveState` below for proof this exercised inactive content, not just the one already-active document.

## poolActiveState — proof this eval exercises inactive (about-to-switch) documents

| document_id | is_active | active_chunks | inactive_chunks | chunk_count |
|---|---|---|---|---|
| e9229429-3eec-478b-b54a-7d5a1cdf6de0 | true | 264 | 0 | 264 |
| 0a6c4f9e-b1bd-4bf8-bbee-7475ba8a6c14 | true | 263 | 0 | 263 |
| 17a7c482-5181-423c-b8d5-44f79e90e392 | true | 530 | 0 | 530 |
| 6ae47aaa-ad2e-4848-9775-75ac2072f79e | true | 208 | 0 | 208 |
| ab676b81-3b29-4c35-b288-6dff71756e26 | false | 57 | 12 | 69 |
| fa763d15-dac2-408f-9228-8a5f34785128 | true | 408 | 0 | 408 |
| f2c1333f-b205-46fa-991e-551548dffef7 | true | 931 | 0 | 931 |
| 09c41590-6f53-40be-a19c-60fa645610f4 | true | 825 | 0 | 825 |
| faa13328-c4bc-4ed7-8172-6ec5ba38c162 | true | 386 | 0 | 386 |

**Inactive-content gate:** 0/23 covered, answered questions were answered from a document that is currently is_active=false. Majority (or all) answered questions came from the one already-active document (SRCC) or no majority from inactive content could be established - this run has NOT demonstrated switch-over's effect.

## Dark-feature questions (scored, but excluded from the hard-blocker bar)

R9 scoring-methodology fix: role/company questions have no grounded retrieval route yet (a known, pre-existing R4-era finding), so `evalDarkFeature` always marks them `coverage_label: fail`. That is a different, lower-severity thing than a real false-grounded-answer (retrieval+judge letting something bad through on a question that SHOULD return nothing) - the two were previously conflated in the same hard-blocker bucket. These rows are still scored and reported below; they just no longer count toward the 100% not-covered hard-blocker bar.

| id | feature | coverage_label | question |
|---|---|---|---|
| q015 | role | fail | What is the STAR structure used in consulting interviews? |
| q022 | role | fail | What is the typical career progression in management consulting from entry level to partner? |
| q023 | company | fail | What are the four key service areas of management consulting? |
| q034 | company | fail | What are the differences between McKinsey, BCG, and Bain interview formats? |

## Pass bar scorecard

| Bar | Threshold | Actual | Met? |
|---|---|---|---|
| Not-covered coverage_label (hard blocker, excludes dark-feature questions) | 100% | 10/10 (100%) | yes |
| Overall correctness pass rate | ≥60% | 27/39 (69%) | yes |
| Paraphrase faithfulness | ≥80% of applicable judgments | 14/23 (61%) | NO |
| must_include survival after paraphrasing | ≥65% | 17/23 (74%) | yes |
| Inactive-content gate (hard blocker) | Majority of covered, answered questions from an is_active=false document | 0/23 | NO |

**Overall pass rate:** 27/39 (69%) of 39 total questions.

## Per-check pass rate (pass / (pass+fail+error), n/a excluded)

| Check | Pass | Fail | Error | N/A | Pass rate |
|---|---|---|---|---|---|
| faithfulness | 23 | 6 | 0 | 10 | 79% |
| coverage_label | 33 | 6 | 0 | 0 | 85% |
| diagram_intact | 0 | 4 | 0 | 35 | 0% |
| must_include | 17 | 12 | 0 | 10 | 59% |

## Paraphrase layer

| Check | Pass | Fail | N/A | Pass rate |
|---|---|---|---|---|
| paraphrase_faithful | 14 | 9 | 16 | 61% |
| must_include_survives_paraphrase | 17 | 6 | 16 | 74% |

## Per-feature breakdown

| Feature | Pass | Scored | Total |
|---|---|---|---|
| frameworks | 12 | 14 | 14 |
| guesstimates | 3 | 7 | 7 |
| qa | 12 | 14 | 14 |
| role | 0 | 2 | 2 |
| company | 0 | 2 | 2 |

## Gemini call counts

- Embedding calls: 35
- Relevance judge calls: 672
- Paraphrase calls: 23
- Faithfulness judge calls: 115
- Total Gemini calls: 845

## Regressions vs 2026-11-02-v2-preview.md (per-question pass -> fail)

- **q002**: was 'pass' in 2026-11-02-v2-preview.md, now 'fail' in this run.
- **q007**: was 'pass' in 2026-11-02-v2-preview.md, now 'fail' in this run.
- **q020**: was 'pass' in 2026-11-02-v2-preview.md, now 'fail' in this run.

## All questions, detail

### q001 [frameworks, covered:true] -> pass (answered from document faa13328-c4bc-4ed7-8172-6ec5ba38c162, inactive: false)
Q: What is the MECE principle and how is it used in case structuring?
- **faithfulness** (pass): [vote 1: faithful] The excerpt directly defines the MECE principle, explains its components, and details how it is used in case structuring through five specific tools. | [vote 2: faithful] The excerpt directly defines the MECE principle and details how it is used in case structuring through five distinct tools with examples. | [vote 3: faithful] The excerpt explicitly defines the MECE principle and details how it is used in case structuring through five distinct tools with examples.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (pass): All required terms were present in the paraphrased text shown to the student.
- **paraphrase_faithful** (pass): judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase** (pass): All required terms were still present (as substrings) in the paraphrased text.

### q002 [frameworks, covered:true] -> fail (answered from document e9229429-3eec-478b-b54a-7d5a1cdf6de0, inactive: false)
Q: Explain the Pareto Principle and its application in consulting.
- **faithfulness** (pass): [vote 1: faithful] The excerpt explicitly explains the Pareto Principle, provides cross-industry examples, and directly discusses its application in consulting and interviews (prioritizing issues and structuring recommendations). | [vote 2: faithful] The excerpt explicitly defines the Pareto Principle, provides cross-industry examples, and directly explains its application in consulting and interviews (prioritizing big issues first in issue trees and recommendations). | [vote 3: faithful] The excerpt explicitly defines the Pareto Principle, provides cross-industry examples, and directly explains its application in consulting and interviews (prioritizing issues and structuring recommendations).
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (fail): Missing from the paraphrased text shown to the student: prioritize
- **paraphrase_faithful** (fail): judgeParaphraseFaithful verdict: unfaithful (rewrite introduced, dropped, or altered a claim).
- **must_include_survives_paraphrase** (fail): Lost after paraphrasing: prioritize

### q003 [frameworks, covered:true] -> pass (answered from document 17a7c482-5181-423c-b8d5-44f79e90e392, inactive: false)
Q: What are the components of the PESTEL framework?
- **faithfulness** (pass): [vote 1: faithful] The excerpt explicitly details the components of the PESTEL framework (Political, Economic, Social, Technological, Environmental, Legal) directly answering the question. | [vote 2: faithful] The excerpt directly lists and defines the components of the PESTEL framework (Political, Economic, Social, Technological, Environmental, Legal), which perfectly answers the question. | [vote 3: faithful] The excerpt directly lists and defines the six components of the PESTEL framework (Political, Economic, Social, Technological, Environmental, and Legal) as asked in the question.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (pass): All required terms were present in the paraphrased text shown to the student.
- **paraphrase_faithful** (pass): judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase** (pass): All required terms were still present (as substrings) in the paraphrased text.

### q004 [frameworks, covered:true] -> fail (answered from document n/a, inactive: null)
Q: Describe the three types of price discrimination.
- **faithfulness** (fail): 6 candidate answer(s) were found but none actually answered the question: [vote 1: unfaithful] The excerpt is a generic pricing framework title that does not contain the definitions or explanations of the three types of price discrimination. | [vote 2: unfaithful] The excerpt is a generic pricing framework title page and does not contain the definitions or descriptions of the three types of price discrimination asked in the question. | [vote 3: unfaithful] The excerpt is a generic pricing framework title page and does not contain any content explaining the three types of price discrimination. | [vote 1: unfaithful] The excerpt is a table of contents or framework mapping for pricing problems that merely mentions a 'Segmentation & Price Discrimination Lens' rather than describing the three types of price discrimination. | [vote 2: unfaithful] The excerpt is a table of contents or framework-mapping overview page that merely mentions a 'Segmentation & Price Discrimination Lens' rather than describing the three types of price discrimination. | [vote 3: unfaithful] The excerpt is a table of contents or framework mapping for pricing problems that merely mentions a 'Segmentation & Price Discrimination Lens,' but it does not actually describe or define the three types of price discrimination. | [vote 1: unfaithful] The excerpt provides a generic pricing framework (value-based, cost-plus, competitor-based) rather than discussing or describing the three types of price discrimination asked for in the question. | [vote 2: unfaithful] The excerpt discusses a generic pricing approach issue tree (value-based, cost-plus, competitor-based) rather than describing the three types of economic price discrimination (first, second, and third degree) asked in the question. | [vote 3: unfaithful] The excerpt provides a generic pricing framework with issue trees for pricing approaches (value-based, cost-plus, competitor-based) rather than explaining the three types of price discrimination (first, second, and third degree). | [vote 1: unfaithful] The question asks for the three types of price discrimination, whereas the excerpt is a pricing case study about a Heli Taxi Service discussing cost-based, value-based, and competitor-based pricing approaches. | [vote 2: unfaithful] The question asks to describe the three types of price discrimination, whereas the excerpt is a case study about pricing a heli taxi service between Pune and Mumbai using cost-based, value-based, and competitor-based approaches. | [vote 3: unfaithful] The question asks for a description of the three types of price discrimination, whereas the excerpt is a pricing case study dialogue about a heli taxi service between Pune and Mumbai. | [vote 1: unfaithful] The excerpt is a framework index containing generic observations and does not describe the three types of price discrimination asked in the question. | [vote 2: unfaithful] The excerpt is a framework index containing general observations about pricing rather than describing the three types of price discrimination. | [vote 3: unfaithful] The excerpt is a framework index and observation list from a casebook rather than an explanation of the three types of price discrimination. | [vote 1: unfaithful] The excerpt discusses a general pricing framework (Internal/External looking, cost-based, benchmarking, value-based) but does not describe the three types of price discrimination asked in the question. | [vote 2: unfaithful] The excerpt discusses pricing frameworks (cost-based, benchmarking, value-based), whereas the question specifically asks to describe the three types of price discrimination. | [vote 3: unfaithful] The excerpt discusses a generic pricing framework with cost-based and value-based branches, but does not describe the three types of price discrimination requested by the question.
- **coverage_label** (fail): No correct answer was found for a question that should have one.
- **must_include** (fail): No answer was found, so none of the required terms could be present.

### q005 [guesstimates, covered:true] -> pass (answered from document ab676b81-3b29-4c35-b288-6dff71756e26, inactive: false)
Q: How would you estimate the number of orders placed on Swiggy in Delhi in a day?
- **faithfulness** (pass): [vote 1: faithful] The excerpt directly addresses the exact question asked, providing specific assumptions and an issue tree tailored to estimating daily Swiggy orders in Delhi. | [vote 2: faithful] The excerpt directly addresses estimating the number of daily Swiggy orders in Delhi, detailing specific assumptions, population segmentations, and an issue tree tailored to the exact question. | [vote 3: faithful] The excerpt directly addresses the exact question asked, detailing assumptions and a structured breakdown for estimating daily Swiggy orders in Delhi.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (pass): All required terms were present in the paraphrased text shown to the student.
- **paraphrase_faithful** (pass): judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase** (pass): All required terms were still present (as substrings) in the paraphrased text.

### q006 [guesstimates, covered:true] -> fail (answered from document ab676b81-3b29-4c35-b288-6dff71756e26, inactive: false)
Q: What approach would you use to estimate the number of credit cards in India?
- **faithfulness** (pass): [vote 1: faithful] The excerpt directly addresses the exact question by providing a structured estimation approach, assumptions, and an issue tree for calculating the number of credit cards in India. | [vote 2: faithful] The excerpt directly addresses the exact question asked by providing assumptions and an issue-tree approach to estimate the number of credit cards in India based on population and income segments. | [vote 3: faithful] The excerpt directly provides a structured approach, assumptions, and issue-tree breakdown specifically for estimating the number of credit cards in India.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (fail): Missing from the paraphrased text shown to the student: income segmentation
- **paraphrase_faithful** (pass): judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase** (fail): Lost after paraphrasing: income segmentation

### q007 [guesstimates, covered:true] -> fail (answered from document ab676b81-3b29-4c35-b288-6dff71756e26, inactive: false)
Q: How do you estimate the revenue of a Delhi-Gurgaon toll plaza in a day?
- **faithfulness** (pass): [vote 1: faithful] The excerpt directly and specifically addresses estimating the daily revenue of the Delhi-Gurgaon toll plaza, providing exact assumptions, vehicle frequencies, vehicle mixes, toll rates, and a final calculated revenue figure. | [vote 2: faithful] The excerpt explicitly provides a worked calculation estimating the daily revenue of the Delhi-Gurgaon toll plaza, addressing the exact entity, metric, and topic requested in the question. | [vote 3: faithful] The excerpt directly addresses the exact subject, entity, and metric requested by the question—estimating the daily revenue of a Delhi-Gurgaon toll plaza—and provides specific worked assumptions and calculations rather than just a generic methodology.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (fail): Missing from the paraphrased text shown to the student: vehicle types
- **paraphrase_faithful** (pass): judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase** (fail): Lost after paraphrasing: vehicle types

### q008 [guesstimates, covered:false] -> pass (answered from document n/a, inactive: null)
Q: What is the approach to estimate the number of tennis balls that can fit in a room?
- **coverage_label** (pass): Correctly returned nothing (would show the label "General guidance — not from the casebooks").

### q009 [guesstimates, covered:true] -> fail (answered from document n/a, inactive: null)
Q: How would you estimate the market size of the tyre industry in India?
- **faithfulness** (fail): 8 candidate answer(s) were found but none actually answered the question: [vote 1: unfaithful] The excerpt is about Bollywood movies released in India, which is completely unrelated to estimating the market size of the tyre industry. | [vote 2: unfaithful] The excerpt discusses estimating Bollywood movies released in India rather than the tyre industry. | [vote 3: unfaithful] The excerpt is about estimating the number of Bollywood movies released in India, whereas the question asks about the market size of the tyre industry in India. | [vote 1: unfaithful] The excerpt provides a guesstimate example for a fast-food chain's daily revenue rather than addressing the market size of the tyre industry in India. | [vote 2: unfaithful] The excerpt provides a generic framework for estimating the daily revenue of a fast-food chain, whereas the question asks about the market size of the tyre industry in India. | [vote 3: unfaithful] The excerpt provides a generic fast food chain revenue estimation example, which does not address estimating the market size of the tyre industry in India. | [vote 1: unfaithful] The excerpt provides a generic methodology and framework for a supply-side approach rather than estimating the specific market size of the tyre industry in India. | [vote 2: unfaithful] The excerpt provides a generic methodology and framework for a supply-side approach rather than estimating the specific tyre industry in India requested by the question. | [vote 3: unfaithful] The excerpt provides a generic methodology and framework for a supply-side approach rather than estimating the market size of the tyre industry in India. | [vote 1: unfaithful] The excerpt is a table of contents/index page that only lists the title and page number of the relevant chapter rather than providing the actual worked content, assumptions, or answer for the tyre industry market size. | [vote 2: unfaithful] The excerpt is a table of contents/index page that only lists the title of the chapter on tyre industry revenue without providing any of the actual content, numbers, or worked methodology needed to answer the question. | [vote 3: unfaithful] The provided excerpt is merely a table of contents (index) page that lists the title of a chapter on the tyre industry rather than containing the actual worked case content, assumptions, or answer. | [vote 1: unfaithful] The excerpt is a generic methodology page for the demand-side approach that does not contain any specific content, assumptions, or calculations for the Indian tyre industry. | [vote 2: unfaithful] The excerpt is a generic methodology page for the demand-side approach rather than a specific application or answer for the tyre industry in India. | [vote 3: unfaithful] The excerpt is a generic methodology page about the demand-side approach with unrelated examples, and does not provide an estimation or calculation specifically for the Indian tyre industry. | [vote 1: unfaithful] The excerpt contains generic population tiers, income brackets, conversion factors, and basic financial formulae, none of which provide a specific estimation of the tyre industry in India as requested by the question. | [vote 2: unfaithful] The excerpt contains generic population tiers, income brackets, conversion factors, and basic financial formulae, but does not provide any specific market size estimation, data, or approach for the tyre industry in India. | [vote 3: unfaithful] The excerpt provides generic tier divisions, income brackets, unit conversion factors, and basic business formulae rather than addressing the specific market size estimation of the tyre industry in India. | [vote 1: unfaithful] The excerpt provides a generic definition of what guesstimates test rather than offering a market size estimation or structured framework for the Indian tyre industry. | [vote 2: unfaithful] The excerpt provides a generic definition of guesstimates rather than offering a market size estimation for the Indian tyre industry. | [vote 3: unfaithful] The excerpt provides a generic definition of guesstimates rather than estimating the specific market size of the tyre industry in India. | [vote 1: unfaithful] The excerpt is a generic methodology page about analogies that does not name India, the tyre industry, or provide the actual worked estimation asked in the question. | [vote 2: unfaithful] The excerpt is a generic methodology page offering high-level advice on using analogies, whereas the question asks for a specific market size estimation of the tyre industry in India. | [vote 3: unfaithful] The excerpt is a generic methodology fragment about analogies that does not address the tyre industry in India, nor does it provide a worked estimation or specific numbers for the question asked.
- **coverage_label** (fail): No correct answer was found for a question that should have one.
- **must_include** (fail): No answer was found, so none of the required terms could be present.

### q010 [frameworks, covered:true] -> pass (answered from document 0a6c4f9e-b1bd-4bf8-bbee-7475ba8a6c14, inactive: false)
Q: What are the eight types of consulting cases and give an example problem statement for each?
- **faithfulness** (pass): [vote 1: faithful] The excerpt explicitly lists the eight types of consulting cases alongside an example problem statement for each, directly answering the question. | [vote 2: faithful] The excerpt explicitly lists the eight types of consulting cases alongside an example problem statement for each, directly answering the question. | [vote 3: faithful] The excerpt explicitly lists the eight types of consulting cases alongside an example problem statement for each, directly answering the question.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (pass): All required terms were present in the paraphrased text shown to the student.
- **paraphrase_faithful** (fail): judgeParaphraseFaithful verdict: unfaithful (rewrite introduced, dropped, or altered a claim).
- **must_include_survives_paraphrase** (pass): All required terms were still present (as substrings) in the paraphrased text.

### q011 [frameworks, covered:true] -> pass (answered from document 0a6c4f9e-b1bd-4bf8-bbee-7475ba8a6c14, inactive: false)
Q: What is the 3CPOR scoping method used before structuring a case?
- **faithfulness** (pass): [vote 1: faithful] The excerpt explicitly provides the 3CPOR scoping method and its breakdown into Objectives, Company, Product, Competitors, Context, and Regulation, directly answering the question. | [vote 2: faithful] The excerpt explicitly provides the details and breakdown of the 3CPOR scoping method asked about in the question. | [vote 3: faithful] The excerpt directly provides the 3CPOR scoping method and its breakdown into objectives, company, product, competitors, context, and regulation, directly answering the user's question about what this method entails.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (pass): All required terms were present in the paraphrased text shown to the student.
- **paraphrase_faithful** (pass): judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase** (pass): All required terms were still present (as substrings) in the paraphrased text.

### q012 [qa, covered:true] -> pass (answered from document 0a6c4f9e-b1bd-4bf8-bbee-7475ba8a6c14, inactive: false)
Q: How do you break down a profitability case using the P=R-C framework?
- **faithfulness** (pass): [vote 1: faithful] The question asks how to break down a profitability case using the P=R-C framework, and the provided excerpt is an issue tree specifically detailing the profitability framework breaking down Revenue (Price and Volume components). | [vote 2: faithful] The question asks how to break down a profitability case using the P=R-C framework, and the provided excerpt is a profitability case framework issue tree breaking down Revenue (Price and Volume) and its sub-components. | [vote 3: faithful] The question asks how to break down a profitability case using the P=R-C framework, and the provided excerpt is a profitability case framework issue tree breaking down the Revenue side of the equation.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (pass): All required terms were present in the paraphrased text shown to the student.
- **paraphrase_faithful** (fail): judgeParaphraseFaithful verdict: unfaithful (rewrite introduced, dropped, or altered a claim).
- **must_include_survives_paraphrase** (pass): All required terms were still present (as substrings) in the paraphrased text.

### q013 [frameworks, covered:true] -> pass (answered from document f2c1333f-b205-46fa-991e-551548dffef7, inactive: false)
Q: What is the pricing decision tree for new versus existing products?
- **faithfulness** (pass): [vote 1: faithful] The excerpt directly provides the pricing decision tree for new versus existing products as requested by the question. | [vote 2: faithful] The excerpt directly provides the pricing decision tree for new versus existing products as requested by the question. | [vote 3: faithful] The excerpt directly provides a pricing decision tree specifically addressing new versus existing products, matching the exact structure and topic requested by the question.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (pass): All required terms were present in the paraphrased text shown to the student.
- **paraphrase_faithful** (pass): judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase** (pass): All required terms were still present (as substrings) in the paraphrased text.

### q014 [frameworks, covered:true] -> pass (answered from document e9229429-3eec-478b-b54a-7d5a1cdf6de0, inactive: false)
Q: Explain the Go-to-Market Strategy framework including segmentation and channel strategy.
- **faithfulness** (pass): [vote 1: faithful] The excerpt explicitly provides the Go-to-Market Strategy framework, including specific details on segmentation and distribution channel strategy as requested. | [vote 2: faithful] The excerpt explicitly provides the Go-to-Market Strategy framework, including specific details on segmentation and distribution/channel strategy as requested by the prompt. | [vote 3: faithful] The excerpt explicitly covers the Go-to-Market Strategy framework, including specific details on segmentation and distribution/channel strategy as requested in the question.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (pass): All required terms were present in the paraphrased text shown to the student.
- **paraphrase_faithful** (pass): judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase** (pass): All required terms were still present (as substrings) in the paraphrased text.

### q015 [role, covered:true] -> fail (answered from document n/a, inactive: null)
Q: What is the STAR structure used in consulting interviews?
- **faithfulness** (fail): No grounded retrieval route exists for the "role" feature in EITHER pipeline (same finding as R4 - chat.js is an ungrounded passthrough, unaffected by is_active).
- **coverage_label** (fail): No grounded retrieval route exists for the "role" feature in EITHER pipeline (same finding as R4 - chat.js is an ungrounded passthrough, unaffected by is_active).
- **diagram_intact** (fail): No grounded retrieval route exists for the "role" feature in EITHER pipeline (same finding as R4 - chat.js is an ungrounded passthrough, unaffected by is_active).
- **must_include** (fail): No grounded retrieval route exists for the "role" feature in EITHER pipeline (same finding as R4 - chat.js is an ungrounded passthrough, unaffected by is_active).

### q016 [frameworks, covered:true] -> pass (answered from document f2c1333f-b205-46fa-991e-551548dffef7, inactive: false)
Q: What are Porter's Five Forces and what factors increase the bargaining power of suppliers?
- **faithfulness** (pass): [vote 1: unfaithful] The excerpt is cut off mid-diagram and only covers two of Porter's Five Forces (barriers to entry and supplier power) rather than outlining the full framework requested. | [vote 2: faithful] The excerpt explicitly provides the factors that increase the bargaining power of suppliers, directly addressing the second part of the user's question. | [vote 3: faithful] The excerpt directly addresses part of the question by listing the specific factors that increase the bargaining power of suppliers according to Porter's Five Forces framework.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (pass): All required terms were present in the paraphrased text shown to the student.
- **paraphrase_faithful** (pass): judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase** (pass): All required terms were still present (as substrings) in the paraphrased text.

### q017 [frameworks, covered:true] -> pass (answered from document faa13328-c4bc-4ed7-8172-6ec5ba38c162, inactive: false)
Q: Explain the BCG Growth Share Matrix including all four quadrants.
- **faithfulness** (pass): [vote 1: faithful] The excerpt explicitly explains the BCG Growth Share Matrix and covers all four quadrants (Dogs, Question Marks, Stars, Cash Cows) as requested. | [vote 2: unfaithful] The excerpt contains a major factual error in its table, incorrectly defining Cash Cows as 'Low Share/Low Growth' instead of 'High Share/Low Growth', and therefore does not faithfully explain the BCG Matrix quadrants. | [vote 3: faithful] The excerpt directly and fully explains the BCG Growth Share Matrix and all four of its quadrants (Stars, Question Marks, Cash Cows, and Dogs/Pets) as requested.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (pass): All required terms were present in the paraphrased text shown to the student.
- **paraphrase_faithful** (fail): judgeParaphraseFaithful verdict: unfaithful (rewrite introduced, dropped, or altered a claim).
- **must_include_survives_paraphrase** (pass): All required terms were still present (as substrings) in the paraphrased text.

### q018 [frameworks, covered:true] -> pass (answered from document faa13328-c4bc-4ed7-8172-6ec5ba38c162, inactive: false)
Q: What is the Ansoff Matrix and what are its four strategic options?
- **faithfulness** (pass): [vote 1: faithful] The excerpt explicitly defines the Ansoff Matrix and lists its four strategic options (Market Penetration, Market Development, Product Development, Diversification), directly answering the user's question. | [vote 2: faithful] The excerpt explicitly defines the Ansoff Matrix and lists its four strategic options (Market Penetration, Market Development, Product Development, Diversification) in direct answer to the question. | [vote 3: faithful] The excerpt explicitly defines the Ansoff Matrix and lists its four strategic options (Market Penetration, Market Development, Product Development, Diversification), directly answering the user's question.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (pass): All required terms were present in the paraphrased text shown to the student.
- **paraphrase_faithful** (fail): judgeParaphraseFaithful verdict: unfaithful (rewrite introduced, dropped, or altered a claim).
- **must_include_survives_paraphrase** (pass): All required terms were still present (as substrings) in the paraphrased text.

### q019 [frameworks, covered:true] -> pass (answered from document ab676b81-3b29-4c35-b288-6dff71756e26, inactive: false)
Q: What is the difference between TAM, SAM, and SOM?
- **faithfulness** (pass): [vote 1: faithful] The excerpt directly and clearly explains the definitions and differences between TAM, SAM, and SOM as asked in the question. | [vote 2: faithful] The excerpt directly and clearly defines TAM, SAM, and SOM and explains the differences between them, which is exactly what the question asks for. | [vote 3: faithful] The excerpt directly and clearly defines TAM, SAM, and SOM and explains the differences between them, which is precisely what the question asks for.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (pass): All required terms were present in the paraphrased text shown to the student.
- **paraphrase_faithful** (pass): judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase** (pass): All required terms were still present (as substrings) in the paraphrased text.

### q020 [qa, covered:true] -> fail (answered from document 17a7c482-5181-423c-b8d5-44f79e90e392, inactive: false)
Q: What are the five stages of a case interview discussion?
- **faithfulness** (pass): [vote 1: faithful] The excerpt explicitly details the five stages of a case interview discussion in a structured table, directly and fully answering the question. | [vote 2: faithful] The excerpt explicitly lists the five stages of a case discussion in a structured table matching the question's request. | [vote 3: faithful] The excerpt explicitly outlines the five stages of a case interview discussion in a structured table format with their expectations and skills tested.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (fail): Missing from the paraphrased text shown to the student: Case Interview Question, Developing the Structure
- **paraphrase_faithful** (pass): judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase** (fail): Lost after paraphrasing: Case Interview Question, Developing the Structure

### q021 [qa, covered:true] -> pass (answered from document 09c41590-6f53-40be-a19c-60fa645610f4, inactive: false)
Q: What are the four steps to approach a consulting case interview?
- **faithfulness** (pass): [vote 1: faithful] The excerpt directly and specifically outlines the core steps to approach a case interview, matching the question's request. | [vote 2: faithful] The question asks for the steps to approach a consulting case interview, and the excerpt directly and specifically outlines these steps (understanding/clarifying the problem statement, structuring the problem, and analyzing the case). | [vote 3: faithful] The excerpt directly and specifically outlines the approach to a consulting case interview, matching the core topic and steps requested in the question.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (pass): All required terms were present in the paraphrased text shown to the student.
- **paraphrase_faithful** (fail): judgeParaphraseFaithful verdict: unfaithful (rewrite introduced, dropped, or altered a claim).
- **must_include_survives_paraphrase** (pass): All required terms were still present (as substrings) in the paraphrased text.

### q022 [role, covered:true] -> fail (answered from document n/a, inactive: null)
Q: What is the typical career progression in management consulting from entry level to partner?
- **faithfulness** (fail): No grounded retrieval route exists for the "role" feature in EITHER pipeline (same finding as R4 - chat.js is an ungrounded passthrough, unaffected by is_active).
- **coverage_label** (fail): No grounded retrieval route exists for the "role" feature in EITHER pipeline (same finding as R4 - chat.js is an ungrounded passthrough, unaffected by is_active).
- **diagram_intact** (fail): No grounded retrieval route exists for the "role" feature in EITHER pipeline (same finding as R4 - chat.js is an ungrounded passthrough, unaffected by is_active).
- **must_include** (fail): No grounded retrieval route exists for the "role" feature in EITHER pipeline (same finding as R4 - chat.js is an ungrounded passthrough, unaffected by is_active).

### q023 [company, covered:true] -> fail (answered from document n/a, inactive: null)
Q: What are the four key service areas of management consulting?
- **faithfulness** (fail): No grounded retrieval route exists for the "company" feature in EITHER pipeline (same finding as R4 - chat.js is an ungrounded passthrough, unaffected by is_active).
- **coverage_label** (fail): No grounded retrieval route exists for the "company" feature in EITHER pipeline (same finding as R4 - chat.js is an ungrounded passthrough, unaffected by is_active).
- **diagram_intact** (fail): No grounded retrieval route exists for the "company" feature in EITHER pipeline (same finding as R4 - chat.js is an ungrounded passthrough, unaffected by is_active).
- **must_include** (fail): No grounded retrieval route exists for the "company" feature in EITHER pipeline (same finding as R4 - chat.js is an ungrounded passthrough, unaffected by is_active).

### q024 [guesstimates, covered:true] -> fail (answered from document ab676b81-3b29-4c35-b288-6dff71756e26, inactive: false)
Q: What is the difference between top-down and bottom-up approaches in guesstimates?
- **faithfulness** (pass): [vote 1: faithful] The excerpt explicitly defines both the top-down and bottom-up approaches with definitions and examples, directly answering the question about the difference between them. | [vote 2: faithful] The excerpt explicitly defines and contrasts both the top-down and bottom-up approaches with concrete examples, directly answering the question about the difference between them. | [vote 3: faithful] The excerpt explicitly defines and contrasts both the top-down and bottom-up approaches with definitions and examples, directly answering the question.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (fail): Missing from the paraphrased text shown to the student: population
- **paraphrase_faithful** (fail): judgeParaphraseFaithful verdict: unfaithful (rewrite introduced, dropped, or altered a claim).
- **must_include_survives_paraphrase** (fail): Lost after paraphrasing: population

### q025 [qa, covered:true] -> pass (answered from document f2c1333f-b205-46fa-991e-551548dffef7, inactive: false)
Q: What are the fixed and variable cost categories in a profitability analysis?
- **faithfulness** (pass): [vote 1: faithful] The excerpt explicitly lists both variable costs (raw material, cooking, servicing, billing) and fixed costs (rent, utilities, salaries) as part of a profitability analysis solution. | [vote 2: faithful] The excerpt directly answers the question by listing specific fixed and variable cost categories (such as raw material, cooking, servicing, and billing for variable costs, and rent, utilities, and salaries for fixed costs) within the context of a profitability/cost analysis. | [vote 3: faithful] The excerpt explicitly lists both variable costs (raw material, cooking, servicing, billing) and fixed costs (rent, utilities, salaries) as part of a profitability analysis solution.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (pass): All required terms were present in the paraphrased text shown to the student.
- **paraphrase_faithful** (fail): judgeParaphraseFaithful verdict: unfaithful (rewrite introduced, dropped, or altered a claim).
- **must_include_survives_paraphrase** (pass): All required terms were still present (as substrings) in the paraphrased text.

### q026 [qa, covered:true] -> fail (answered from document 6ae47aaa-ad2e-4848-9775-75ac2072f79e, inactive: false)
Q: How do you solve an airline profitability case where margins have been eroding due to maintenance issues?
- **faithfulness** (pass): [vote 1: faithful] The excerpt directly addresses how to approach an airline profitability case involving eroding margins caused by maintenance issues, specifically detailing the impact on both costs and revenues. | [vote 2: faithful] The excerpt directly addresses how to approach an airline profitability case involving margin erosion due to maintenance issues, covering both cost and revenue impacts. | [vote 3: faithful] The excerpt directly addresses how to approach an airline profitability case involving eroding margins caused by maintenance issues, specifically detailing the impact on both costs and revenues.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (fail): Missing from the paraphrased text shown to the student: value chain
- **paraphrase_faithful** (pass): judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase** (fail): Lost after paraphrasing: value chain

### q027 [qa, covered:true] -> pass (answered from document 17a7c482-5181-423c-b8d5-44f79e90e392, inactive: false)
Q: What is the 4M Framework used for root cause analysis in operations?
- **faithfulness** (pass): [vote 1: faithful] The excerpt explicitly defines the 4M Framework, its purpose for root cause analysis and process variation, and provides details on its components starting with Man and Machine. | [vote 2: faithful] The excerpt explicitly provides the 4M Framework used for root cause analysis in operations, detailing its purpose and including nodes like Man and Machine. | [vote 3: faithful] The excerpt explicitly provides the definition, notes, and components of the 4M Framework used for root cause analysis in operations, directly answering the question.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (pass): All required terms were present in the paraphrased text shown to the student.
- **paraphrase_faithful** (fail): judgeParaphraseFaithful verdict: unfaithful (rewrite introduced, dropped, or altered a claim).
- **must_include_survives_paraphrase** (pass): All required terms were still present (as substrings) in the paraphrased text.

### q028 [qa, covered:false] -> pass (answered from document n/a, inactive: null)
Q: Walk me through how to estimate the daily revenue of Delhi Metro.
- **coverage_label** (pass): Correctly returned nothing (would show the label "General guidance — not from the casebooks").

### q029 [qa, covered:true] -> pass (answered from document 0a6c4f9e-b1bd-4bf8-bbee-7475ba8a6c14, inactive: false)
Q: What does the ISB casebook describe as the 4Ss framework for case solving?
- **faithfulness** (pass): [vote 1: faithful] The excerpt explicitly lists and describes the 4Ss framework (Scope, Structure, Solve, Synthesize) as asked in the question. | [vote 2: faithful] The excerpt explicitly names and defines the 4Ss framework (Scope, Structure, Solve, Synthesize) as described in the question. | [vote 3: faithful] The excerpt explicitly names and defines the 4Ss framework (Scope, Structure, Solve, Synthesize) as described in the question.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (pass): All required terms were present in the paraphrased text shown to the student.
- **paraphrase_faithful** (pass): judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase** (pass): All required terms were still present (as substrings) in the paraphrased text.

### q030 [qa, covered:false] -> pass (answered from document n/a, inactive: null)
Q: How should I prepare for a McKinsey PEI (Personal Experience Interview)?
- **coverage_label** (pass): Correctly returned nothing (would show the label "General guidance — not from the casebooks").

### q031 [qa, covered:false] -> pass (answered from document n/a, inactive: null)
Q: What is the Victor Cheng LOMS framework for case interviews?
- **coverage_label** (pass): Correctly returned nothing (would show the label "General guidance — not from the casebooks").

### q032 [frameworks, covered:false] -> pass (answered from document n/a, inactive: null)
Q: Explain the RICE prioritization framework used by product managers.
- **coverage_label** (pass): Correctly returned nothing (would show the label "General guidance — not from the casebooks").

### q033 [qa, covered:false] -> pass (answered from document n/a, inactive: null)
Q: What is the typical day-in-the-life of a first-year consultant at Bain?
- **coverage_label** (pass): Correctly returned nothing (would show the label "General guidance — not from the casebooks").

### q034 [company, covered:false] -> fail (answered from document n/a, inactive: null)
Q: What are the differences between McKinsey, BCG, and Bain interview formats?
- **faithfulness** (fail): No grounded retrieval route exists for the "company" feature in EITHER pipeline (same finding as R4 - chat.js is an ungrounded passthrough, unaffected by is_active).
- **coverage_label** (fail): No grounded retrieval route exists for the "company" feature in EITHER pipeline (same finding as R4 - chat.js is an ungrounded passthrough, unaffected by is_active).
- **diagram_intact** (fail): No grounded retrieval route exists for the "company" feature in EITHER pipeline (same finding as R4 - chat.js is an ungrounded passthrough, unaffected by is_active).
- **must_include** (fail): No grounded retrieval route exists for the "company" feature in EITHER pipeline (same finding as R4 - chat.js is an ungrounded passthrough, unaffected by is_active).

### q035 [qa, covered:false] -> pass (answered from document n/a, inactive: null)
Q: How do you prepare for a stress interview at a consulting firm?
- **coverage_label** (pass): Correctly returned nothing (would show the label "General guidance — not from the casebooks").

### q036 [frameworks, covered:false] -> pass (answered from document n/a, inactive: null)
Q: Explain the Jobs-to-be-Done framework and how it applies to product strategy.
- **coverage_label** (pass): Correctly returned nothing (would show the label "General guidance — not from the casebooks").

### q037 [guesstimates, covered:false] -> pass (answered from document n/a, inactive: null)
Q: How would you estimate the number of Uber rides in New York City per day?
- **coverage_label** (pass): Correctly returned nothing (would show the label "General guidance — not from the casebooks").

### q038 [qa, covered:false] -> pass (answered from document n/a, inactive: null)
Q: What are the key differences between consulting and investment banking as career paths?
- **coverage_label** (pass): Correctly returned nothing (would show the label "General guidance — not from the casebooks").

### q039 [qa, covered:true] -> pass (answered from document fa763d15-dac2-408f-9228-8a5f34785128, inactive: false)
Q: How do you solve a private equity due diligence case?
- **faithfulness** (pass): [vote 1: faithful] The excerpt provides a structured approach, framework, and worked example for solving a private equity due diligence case involving a restaurant chain. | [vote 2: faithful] The excerpt provides a structured approach, framework, and worked example specifically for solving a private equity due diligence case involving a restaurant chain. | [vote 3: faithful] The excerpt provides a structured approach, framework, and worked example specifically for solving a private equity due diligence case involving a restaurant chain.
- **coverage_label** (pass): A correct, relevant answer was found.
- **must_include** (pass): All required terms were present in the paraphrased text shown to the student.
- **paraphrase_faithful** (pass): judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase** (pass): All required terms were still present (as substrings) in the paraphrased text.

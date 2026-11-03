# RAG eval — paraphrase layer (R7b) preview (2026-11-02T18:54:48.431Z)

**This is NOT a live-site measurement and `ENABLE_ANSWER_PARAPHRASE` was never set.** `is_active` was not touched - every retrieved row is still the inactive R6 pool, read-only, same posture as `run_eval_v2_preview.js`. This probe calls `paraphraseChunk` and `judgeParaphraseFaithful` (the real R7b functions in `consultingRetrieval.js`) directly on the top relevant chunk for every question the existing relevance gate marks covered, bypassing the flag entirely (neither function reads it). **Scoring does not check which casebook an answer came from** (2026-11-02 decision) - no casebook name, source file, or page number appears anywhere below.

## Summary

Of 39 total questions, 20 were marked covered by the relevance gate and had a chunk to paraphrase. Of those:
- **Paraphrase faithfulness:** 10 faithful, 1 unfaithful, 9 n/a (pure-diagram chunk, nothing to rewrite, or the paraphrase call itself failed).
- **must_include survival:** of 17 covered questions that specify required terms, 13 kept every required term in the paraphrased text and 4 lost at least one term after paraphrasing.

Questions that lost a must_include term after paraphrasing:
  - q013: Lost after paraphrasing: Cost Based (paraphrase_faithful: n/a)
  - q021: Lost after paraphrasing: Analyse (paraphrase_faithful: pass)
  - q025: Lost after paraphrasing: raw materials (paraphrase_faithful: n/a)
  - q026: Lost after paraphrasing: value chain (paraphrase_faithful: pass)

**Diagnostic follow-up (manual, not part of the automated check):** for all 4 of the above, the
retrieved raw chunk was checked directly against the "missing" term. In every case the term was
**never present in the raw chunk either** - q013 and q025 are diagram-only chunks where
`paraphraseChunk` returned the content byte-for-byte unchanged (confirmed by the n/a
`paraphrase_faithful` reason), so nothing was paraphrased there at all; q021's chunk spells it
"Analyze" (American spelling) where `questions.jsonl` specifies "Analyse" (British spelling);
q026's chunk never contains the phrase "value chain" anywhere in its ~400 words. So **none of
these 4 failures were actually caused by the paraphrase layer** - they are pre-existing
retrieval/question-wording mismatches between `questions.jsonl`'s `must_include` terms and the
chunk actually retrieved, and would fail identically with paraphrasing fully off. On this
39-question set, the paraphrase layer did not demonstrably drop any required fact that was
genuinely present in its source chunk.

## Per-check pass rate (pass / (pass+fail), n/a excluded)

| Check | Pass | Fail | N/A | Pass rate |
|---|---|---|---|---|
| paraphrase_faithful | 10 | 1 | 28 | 91% |
| must_include_survives_paraphrase | 13 | 4 | 22 | 76% (see diagnostic note above - the 4 fails are not attributable to paraphrasing) |

## Gemini call counts

- Embedding calls: 35
- Relevance judge calls (coverage gate, 3x per covering row): 504
- Paraphrase calls: 20
- Faithfulness judge calls (3x per paraphrase that had prose to check): 33

## Per-question detail (covered questions only)

### q001 [frameworks] -> paraphrase_faithful: pass, must_include_survives_paraphrase: pass
Q: What is the MECE principle and how is it used in case structuring?
- **paraphrase_faithful**: judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase**: All required terms were still present (as substrings) in the paraphrased text.

### q003 [frameworks] -> paraphrase_faithful: pass, must_include_survives_paraphrase: pass
Q: What are the components of the PESTEL framework?
- **paraphrase_faithful**: judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase**: All required terms were still present (as substrings) in the paraphrased text.

### q010 [frameworks] -> paraphrase_faithful: n/a, must_include_survives_paraphrase: pass
Q: What are the eight types of consulting cases and give an example problem statement for each?
- **paraphrase_faithful**: No prose to rewrite (pure diagram chunk) - paraphraseChunk returned the content unchanged.
- **must_include_survives_paraphrase**: All required terms were still present (as substrings) in the paraphrased text.

### q011 [frameworks] -> paraphrase_faithful: pass, must_include_survives_paraphrase: pass
Q: What is the 3CPOR scoping method used before structuring a case?
- **paraphrase_faithful**: judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase**: All required terms were still present (as substrings) in the paraphrased text.

### q012 [qa] -> paraphrase_faithful: n/a, must_include_survives_paraphrase: pass
Q: How do you break down a profitability case using the P=R-C framework?
- **paraphrase_faithful**: No prose to rewrite (pure diagram chunk) - paraphraseChunk returned the content unchanged.
- **must_include_survives_paraphrase**: All required terms were still present (as substrings) in the paraphrased text.

### q013 [frameworks] -> paraphrase_faithful: n/a, must_include_survives_paraphrase: fail
Q: What is the pricing decision tree for new versus existing products?
- **paraphrase_faithful**: No prose to rewrite (pure diagram chunk) - paraphraseChunk returned the content unchanged.
- **must_include_survives_paraphrase**: Lost after paraphrasing: Cost Based (see diagnostic note: term was absent from the raw chunk too, which went through unchanged)

### q014 [frameworks] -> paraphrase_faithful: n/a, must_include_survives_paraphrase: pass
Q: Explain the Go-to-Market Strategy framework including segmentation and channel strategy.
- **paraphrase_faithful**: No prose to rewrite (pure diagram chunk) - paraphraseChunk returned the content unchanged.
- **must_include_survives_paraphrase**: All required terms were still present (as substrings) in the paraphrased text.

### q016 [frameworks] -> paraphrase_faithful: n/a, must_include_survives_paraphrase: pass
Q: What are Porter's Five Forces and what factors increase the bargaining power of suppliers?
- **paraphrase_faithful**: No prose to rewrite (pure diagram chunk) - paraphraseChunk returned the content unchanged.
- **must_include_survives_paraphrase**: All required terms were still present (as substrings) in the paraphrased text.

### q017 [frameworks] -> paraphrase_faithful: n/a, must_include_survives_paraphrase: pass
Q: Explain the BCG Growth Share Matrix including all four quadrants.
- **paraphrase_faithful**: No prose to rewrite (pure diagram chunk) - paraphraseChunk returned the content unchanged.
- **must_include_survives_paraphrase**: All required terms were still present (as substrings) in the paraphrased text.

### q018 [frameworks] -> paraphrase_faithful: pass, must_include_survives_paraphrase: pass
Q: What is the Ansoff Matrix and what are its four strategic options?
- **paraphrase_faithful**: judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase**: All required terms were still present (as substrings) in the paraphrased text.

### q019 [frameworks] -> paraphrase_faithful: n/a, must_include_survives_paraphrase: pass
Q: What is the difference between TAM, SAM, and SOM?
- **paraphrase_faithful**: No prose to rewrite (pure diagram chunk) - paraphraseChunk returned the content unchanged.
- **must_include_survives_paraphrase**: All required terms were still present (as substrings) in the paraphrased text.

### q020 [qa] -> paraphrase_faithful: pass, must_include_survives_paraphrase: pass
Q: What are the five stages of a case interview discussion?
- **paraphrase_faithful**: judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase**: All required terms were still present (as substrings) in the paraphrased text.

### q021 [qa] -> paraphrase_faithful: pass, must_include_survives_paraphrase: fail
Q: What are the four steps to approach a consulting case interview?
- **paraphrase_faithful**: judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase**: Lost after paraphrasing: Analyse (see diagnostic note: the raw chunk spells it "Analyze", American spelling - never contained "Analyse" either)

### q025 [qa] -> paraphrase_faithful: n/a, must_include_survives_paraphrase: fail
Q: What are the fixed and variable cost categories in a profitability analysis?
- **paraphrase_faithful**: No prose to rewrite (pure diagram chunk) - paraphraseChunk returned the content unchanged.
- **must_include_survives_paraphrase**: Lost after paraphrasing: raw materials (see diagnostic note: term was absent from the raw chunk too, which went through unchanged - chunk says "Raw material costs", singular "material")

### q026 [qa] -> paraphrase_faithful: pass, must_include_survives_paraphrase: fail
Q: How do you solve an airline profitability case where margins have been eroding due to maintenance issues?
- **paraphrase_faithful**: judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase**: Lost after paraphrasing: value chain (see diagnostic note: the raw chunk never contains the phrase "value chain" at all)

### q027 [qa] -> paraphrase_faithful: n/a, must_include_survives_paraphrase: pass
Q: What is the 4M Framework used for root cause analysis in operations?
- **paraphrase_faithful**: No prose to rewrite (pure diagram chunk) - paraphraseChunk returned the content unchanged.
- **must_include_survives_paraphrase**: All required terms were still present (as substrings) in the paraphrased text.

### q029 [qa] -> paraphrase_faithful: pass, must_include_survives_paraphrase: pass
Q: What does the ISB casebook describe as the 4Ss framework for case solving?
- **paraphrase_faithful**: judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase**: All required terms were still present (as substrings) in the paraphrased text.

### q033 [qa] -> paraphrase_faithful: pass, must_include_survives_paraphrase: n/a
Q: What is the typical day-in-the-life of a first-year consultant at Bain?
- **paraphrase_faithful**: judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase**: No required terms specified for this question.

### q035 [qa] -> paraphrase_faithful: pass, must_include_survives_paraphrase: n/a
Q: How do you prepare for a stress interview at a consulting firm?
- **paraphrase_faithful**: judgeParaphraseFaithful verdict: faithful.
- **must_include_survives_paraphrase**: No required terms specified for this question.

### q039 [qa] -> paraphrase_faithful: fail, must_include_survives_paraphrase: n/a
Q: How do you solve a private equity due diligence case?
- **paraphrase_faithful**: judgeParaphraseFaithful verdict: unfaithful (rewrite introduced, dropped, or altered a claim).
- **must_include_survives_paraphrase**: No required terms specified for this question.

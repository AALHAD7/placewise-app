# PLACEWISE: CASEBOOK-FIRST REBUILD

## Context

Placewise's core asset is its ingested MBA placement casebooks (IIM A, IIM B, IIM C, FMS, XLRI, ISB and others). These casebooks contain:

- the frameworks students need, across every domain;
- solved guesstimates, using supply-side, demand-side, profit, value-chain and other approaches;
- PM frameworks (RISE, Kano, and others);
- finance, marketing, operations and HR concepts;
- full cases with structures and solutions;
- real interview questions and interview experiences.

The goal is to make **the whole website run on this casebook data**, so students who don't have access to these books can learn from them through Placewise.

AI's role is reduced to **organising, explaining and applying casebook content**. AI does not author knowledge from its own memory.

### Source hierarchy (applies to every section on every page)

| Priority | Source | When to use it |
|---|---|---|
| 1 | **CASEBOOK-STRUCTURED** | Items extracted once from the casebooks into structured tables (frameworks, guesstimates, cases, interview questions, concepts). Rendered directly. |
| 2 | **CASEBOOK-GROUNDED** | AI explains, reorganises or applies retrieved casebook passages, citing every point. AI may not add facts the passages don't contain. |
| 3 | **WEB** | Allowed **only** for company facts the casebooks cannot contain: salary, current interview process, company news, business model and financials, recent deals or launches. |
| 4 | **AI-ONLY** | Last resort. Only where no casebook content exists and the section is not company-factual. Always labelled "AI-generated · not from casebooks". The admin data-gap backlog records every use. |

Any section that can be served at levels 1–2 must never use levels 3–4.

---

## Before starting

1. Complete Phase 1.7 items 1–5 as already instructed (call breakdown, call reduction, salary source matching, targeted repair, HR roles).
2. **Skip Phase 1.7 item 6** (the pre-warm script). Pre-warming AI-generated content is superseded by this rebuild, and pre-warming will be redesigned in Phase C7.
3. Report Phase 1.7, then begin Phase C0.

**Stop gates.** Phases marked **[STOP]** require my approval before the next phase starts. Every call or cost cap in this document is a hard stop: if you hit one, stop immediately and report.

---

## PHASE C0: CORPUS INVENTORY AND SOURCE AUDIT (read-only) [STOP]

### C0.1 Casebook inventory

List every ingested file with:
- file name
- school
- club, if identifiable
- year
- chunk count
- primary domains covered

Flag:
- duplicates (the same casebook, different years or versions)
- files with garbled extraction (OCR noise, broken tables)
- files with very low chunk counts

### C0.2 Content-type estimate

Sample about 300 chunks, stratified across files. Classify each chunk as one of:
- framework explanation
- solved guesstimate
- case (prompt + structure + solution)
- interview question (with or without an answer)
- interview experience (company/round account)
- concept explanation
- HR / behavioural question
- CV / resume advice
- other / noise

Report the % of each type, and project it to the full corpus.

### C0.3 Domain coverage

For each of the 10 domains, give the estimated count of usable items per content type. Rate each domain **strong**, **adequate** or **thin**.

### C0.4 Site-wide source audit

For every page and every section, classify the CURRENT source as one of:
- CASEBOOK
- CASEBOOK-IF-FOUND
- WEB
- AI-ONLY
- USER INPUT
- DATABASE
- HARD-CODED

Output a table: page | section | current source | file/function | cached? | source badge shown?

Cover these pages: Home, Role, Skill detail, Company, Frameworks, Resume Drill, Story Builder, Tone Shifter, Mock Interview, Community, and any others.

### C0.5 Current retrieval quality

For one role per domain, run retrieval only (no generation) for the topics query. Report:
- chunks returned
- similarity scores
- the threshold the code uses
- source files

Then report:
- the % of sections site-wide that are currently CASEBOOK or CASEBOOK-IF-FOUND;
- every place where the UI or copy claims casebook grounding for content that is actually WEB or AI-ONLY.

**STOP and report.**

---

## PHASE C1: STRUCTURED EXTRACTION, DESIGN AND PILOT [STOP]

### C1.1 Schema

Create the tables below. Every row carries:
- `source_chunk_ids` (array)
- `source_file`
- `school`
- `year`
- `domain_tags`
- `topic_tags`
- `role_ids` (where applicable)
- `company_tags` (where applicable)
- `quality_score` (0–1)
- `extraction_version`

**`cb_frameworks`**
- name
- aliases
- domain
- purpose (when to use it)
- structure (ordered components/steps, as JSON)
- when_not_to_use
- worked_example (if present in the source)
- related_frameworks

**`cb_guesstimates`**
- prompt
- approach_type (supply / demand / profit / value-chain / top-down / bottom-up / other)
- assumptions (JSON list)
- steps (JSON list, with numbers)
- final_answer
- units
- difficulty (basic / intermediate / advanced)

**`cb_cases`**
- case_type (profitability / market entry / growth / pricing / M&A / operations / unconventional / guesstimate-led / product / other)
- company_or_industry
- prompt
- clarifying_questions
- structure (issue tree, as JSON)
- analysis_steps
- recommendation
- interviewer_followups
- difficulty

**`cb_interview_questions`**
- question
- question_type (technical / case / guesstimate / behavioural / HR / CV-based / puzzle / domain-concept)
- company
- role or domain
- round (if stated)
- model_answer (if present)
- answer_outline (if present)
- difficulty

**`cb_interview_experiences`**
- company
- role
- school
- year
- rounds (JSON: round name, format, questions asked)
- tips

**`cb_concepts`**
- name
- domain
- definition
- explanation
- formulas (if any)
- examples
- level (basic / intermediate / advanced)

**`cb_cv_and_hr_guidance`**
- topic (e.g. "Tell me about yourself", "Why MBA", "Why this company", "Strengths/weaknesses", CV-writing tips)
- guidance
- sample_answers (if present)

**`chunks` table additions**
- `content_type`
- `domain_tags`
- `topic_tags`
- `company_tags` (from the alias table, with exclusion phrases)
- `school`
- `year`

### C1.2 Extraction pipeline

1. **Batch.** Group adjacent chunks from the same file into windows, so a case or guesstimate that spans several chunks is extracted whole. Choose the window size and report it.
2. **Model.** Use MODEL_LIGHT with structured JSON output, one extraction call per window.
3. **Extraction rule.** The extraction prompt must say:

   ```
   Extract ONLY what is present in the text. Do not complete, correct, improve or add to it. If a field is not in the text, return null. Preserve the original numbers and steps exactly.
   ```

4. **Deduplicate.** Merge near-duplicate items across files and years (same framework or question). Merge on embedding similarity plus name match. Keep all source references. Prefer the most complete version as primary.
5. **Quality score.** Score each item on completeness, internal consistency and clarity. For guesstimates and cases, also run the content check (arithmetic and consistency). Store failed items with `quality_score` below 0.5 and `needs_review = true`. **Never delete source content.**

### C1.3 Pilot

Run the pipeline on 2 casebooks only: one consulting-heavy and one PM- or finance-heavy. Then report:

- the extracted item count per table;
- 10 random items per table, side by side with their source chunk text, so I can judge fidelity;
- extraction errors: invented content, truncated cases, wrong approach_type;
- calls used and tokens used;
- **projected calls and cost for the full corpus.**

**Hard cap: 400 LLM calls for the pilot. STOP and report.**

---

## PHASE C2: FULL EXTRACTION [STOP]

Run only after I approve the C1 pilot and the cost projection.

- Run the approved pipeline over the full corpus.
  - The run must be resumable and rate-limited.
  - Log progress.
  - **Hard-stop at MAX_TOTAL_CALLS**, which I will set when approving.
- After the run, report:
  - item counts per table, per domain;
  - the % of items with `needs_review`;
  - the domain coverage table: strong / adequate / thin, per content type;
  - the top 20 most-referenced frameworks, and the 20 most common interview question types per domain.

**STOP and report.**

---

## PHASE C3: RETRIEVAL UPGRADE

1. **Hybrid search.** Combine vector similarity with keyword/BM25 search (Postgres full-text) over chunks and structured items. Merge the results with reciprocal rank fusion.
2. **Metadata filters.** Filter by `content_type`, `domain_tags`, `topic_tags`, `company_tags`, `role_ids` and `difficulty` before ranking.
3. **Rerank.** Rerank the top 20 results down to the top 5–8 with a lightweight relevance pass. Use MODEL_LIGHT, batched, or a heuristic if cost is a concern. Report which approach you chose and why.
4. **Relevance threshold.** Calibrate the threshold on the C0 test queries. Results below it count as "no casebook content". Do not let them pass through as weak grounding.
5. **Query routing.** Each section declares what it needs (e.g. "frameworks for topic X in domain Y", "guesstimates of approach Z"). The router queries the structured tables first, then falls back to chunks.

---

## PHASE C4: GROUNDED GENERATION AND CITATIONS

### C4.1 Grounded mode

Every AI call that explains, reorganises or applies casebook content uses this block, on top of the base rules:

```
CASEBOOK GROUNDING RULES
- You are given numbered casebook passages [P1]…[Pn]. Use ONLY these passages as your source of facts, frameworks, numbers and examples.
- Every point you make must cite the passage(s) it comes from, e.g. "[P2]".
- You may: explain in simpler words, reorder, summarise, connect ideas across passages, and apply a framework from the passages to the user's question.
- You may NOT: add facts, numbers, frameworks, examples or claims that are not in the passages.
- If the passages don't cover something the user asked, say exactly: "The casebooks don't cover this." Do not fill the gap from your own knowledge.
- Keep the original numbers and steps from worked examples exactly as given.
```

### C4.2 Citation check (code)

- Every sentence or point in the output must carry at least one valid passage citation. Drop uncited points.
- Add an `unsupported_by_source` flag to the content check: does each cited point actually appear in its cited passage? This runs in the same batched check call, not an extra one.
- If any flag fails, run a targeted repair (up to 2 attempts). If it still fails, show the content with the amber notice.

### C4.3 Rendering citations

- Citations render as small superscript source chips: "IIM A '22", "FMS '21".
- Hover or tap shows the school, casebook name, year and a short excerpt of 40 words or fewer.
- A "Sources" footer lists every casebook used in the section.

---

## PHASE C5: PAGE-BY-PAGE REWIRING

The table below is the required source policy for each section. Implement it exactly. Where it says AI-ONLY fallback, show the AI-generated label **and** log the gap.

### Role page

| Section | Source |
|---|---|
| Topics to prepare | CASEBOOK-STRUCTURED: derived from topic_tags of frameworks, questions and cases for the role's domain and role_ids, ranked by frequency in casebooks. Fallback: AI-ONLY, labelled. |
| What gets tested | CASEBOOK-STRUCTURED: the most frequent question types and concepts tested for that topic, from cb_interview_questions and cb_cases. |
| What? / Why? / How to apply | CASEBOOK-GROUNDED on the passages behind that item |
| Concept | CASEBOOK-STRUCTURED from cb_concepts, then CASEBOOK-GROUNDED explanation |
| Frameworks | CASEBOOK-STRUCTURED from cb_frameworks, rendered directly (name, purpose, structure, when not to use, worked example) |
| Model answer | A real casebook question with its casebook solution (cb_cases / cb_interview_questions with model_answer), rendered with attribution. Fallback: a CASEBOOK-GROUNDED answer built from passages. Never AI-ONLY. Hide it if there's nothing. |
| Common pitfalls | CASEBOOK-GROUNDED from interviewer follow-ups, feedback and tips in cases and experiences. Hide it if there's nothing. |
| Practice prompts | Real casebook questions first (cb_interview_questions / cb_guesstimates / cb_cases), labelled with school and year. Fallback: "Practice variant based on <casebook item>", generated from a cited item. Never free AI generation. |
| How this shows up by company | CASEBOOK only (cb_interview_experiences and company_tags). Hide it otherwise. |
| Interview process | Casebook experiences first (with school and year), then WEB for the current process. Show both, labelled. |
| Salary | WEB (3-tier logic from Phase 1.7) |
| Skills required | CASEBOOK-GROUNDED from what casebooks test for the role. Fallback: WEB. |
| Career progression and exits | WEB (company and career facts) |
| What this role is | CASEBOOK-GROUNDED where casebooks describe the role. Fallback: WEB. |
| Cross-question chat | CASEBOOK-GROUNDED on the panel's passages plus a fresh retrieval for the follow-up. If it isn't covered, say "The casebooks don't cover this." Then offer: "Get a general AI answer (not from casebooks)". This opt-in is clearly labelled. |

### Skill detail page

| Section | Source |
|---|---|
| Core concepts (Basic / Intermediate / Advanced) | CASEBOOK-STRUCTURED from cb_concepts and cb_frameworks by level |
| Practice problems | Real casebook questions, guesstimates and cases at that level first. Variants only as "based on <casebook item>". The SQL/Python sandbox check stays. |
| Learn more | The casebook source of the concept is the primary link (opens a source viewer showing the passage). External links are secondary and lazy. |
| Answer feedback | CASEBOOK-GROUNDED: the user's answer is scored against the casebook solution or framework for that question. |

### Frameworks page

- An entirely CASEBOOK-STRUCTURED library from cb_frameworks.
- Filters: domain, use-case and level.
- Each framework shows: purpose, structure, when not to use, a worked example from the casebook, related frameworks, and every source casebook.
- Each framework links to real casebook questions where it applies.
- Zero AI-ONLY content on this page.

### Guesstimates

Add this as a section within Frameworks, or as a new tab.

- A CASEBOOK-STRUCTURED library from cb_guesstimates.
- Filter by approach_type (supply / demand / profit / value-chain / top-down / bottom-up), domain and difficulty.
- **Practice mode:**
  1. The user attempts the guesstimate.
  2. The user then reveals the casebook's solution step by step.
  3. AI feedback compares the user's approach with the casebook solution. This feedback is CASEBOOK-GROUNDED.

### Cases

Add this as a section, or a new page if it fits the IA.

- A CASEBOOK-STRUCTURED library from cb_cases, filterable by case_type, industry and difficulty.
- **Practice mode:**
  1. Show the prompt, then the clarifying questions.
  2. The user builds a structure.
  3. Reveal the casebook structure and solution.
  4. AI feedback is CASEBOOK-GROUNDED.

### Company page

| Section | Source |
|---|---|
| What the company does, business model, financials, recent news, deals, launches | WEB (labelled, with sources and date) |
| Interview experiences, rounds and questions asked | CASEBOOK-STRUCTURED from cb_interview_experiences and company-tagged questions, with school and year |
| Recruitment process by role | Casebook experiences first, then WEB for the current process, both labelled |

### Mock Interview

- **PLAN:** questions are drawn from cb_interview_questions, cb_cases and cb_guesstimates, filtered by domain, difficulty and role_ids. If a resume is provided, CV-based question patterns come from casebook CV-based questions, applied to the resume.
- **TURN follow-ups:** drawn from the casebook interviewer_followups for that question where available.
- **EVAL:** scores answers against the casebook solution or model answer and the framework as the rubric. The results screen links each question to its casebook source.
- Only if fewer than 5 suitable casebook questions exist for the selection: fill with AI-generated questions, labelled in the transcript.

### Resume Drill

- Question patterns come from casebook CV-based questions and interview experiences, applied to the user's resume lines (USER INPUT + CASEBOOK-GROUNDED patterns).
- Feedback references casebook CV and HR guidance.

### Story Builder

- Structure and guidance come from cb_cv_and_hr_guidance ("Tell me about yourself", "Why MBA", and so on).
- The user's story is USER INPUT, shaped by CASEBOOK-GROUNDED guidance.

### Tone Shifter

- No change (USER INPUT plus the fixed verb banks).
- Optionally add a "CV tips from casebooks" panel from cb_cv_and_hr_guidance.

### Home

- The "Popular tools" and plan banner stay.
- The 7-day plan generator must schedule real casebook items (specific frameworks, guesstimates and cases) by ID.
- The trust line must match reality after C0: "Built from the placement casebooks of …", listing only the schools actually ingested.

### Community

- No change (USER INPUT and DATABASE).

---

## PHASE C6: SOURCE TRANSPARENCY AND ATTRIBUTION

### C6.1 Badges

Every section on every page shows one of these badges:

- "From casebooks", with the school and year chips
- "Live web data · <date>"
- "AI-generated · not from casebooks"

### C6.2 Source viewer

Clicking a casebook citation opens a side panel showing:
- the casebook name, school, club (if known) and year;
- the relevant passage excerpt.

### C6.3 Attribution and excerpt policy

1. Always attribute the school, club and year for casebook content.
2. **Short items may be shown verbatim** with attribution: questions, guesstimate prompts, framework names and structures.
3. **Long solutions and explanations are shown structured and summarised** (steps, issue trees, key numbers), not as long verbatim passages.
   - The source viewer excerpt is capped at 120 words.
   - Full casebook pages are never reproduced, and full casebook files are never offered for download.
4. **Takedown support:**
   - Add a per-casebook `visibility` flag (active / hidden) in the admin page, so any casebook can be withdrawn instantly site-wide if a club asks.
   - Add a public "Content source / takedown request" contact link in the footer or on the About page.

### C6.4 Admin data-gap view

Show, by domain, role and topic:
- every AI-ONLY fallback;
- every "casebooks don't cover this" response;
- every hidden section.

Sort by user hits, so I know which casebooks to add next.

---

## PHASE C7: CACHING, PRE-WARM AND COST

1. **Cached outputs.**
   - Structured casebook content is read from the database directly, so it needs no LLM call to render.
   - Cache CASEBOOK-GROUNDED explanations by (CONTENT_VERSION, item_id, mode).
2. **Pre-warm script.** Redesign `npm run prewarm` to generate CASEBOOK-GROUNDED explanations only for the highest-traffic items. The script must be:
   - rate-limited
   - resumable
   - capped by MAX_TOTAL_CALLS
   - **built, not run**; print the estimate.
3. **Measure.** Report LLM calls per page view for each page, cold and warm, comparing the Phase 1.6 baseline with now.

---

## PHASE C8: TESTS AND FINAL REPORT

### Test matrix

Run one role per domain (all 10 domains). For each, report:
- per section: the source actually used (structured / grounded / web / AI-only);
- the citation check pass rate;
- `unsupported_by_source` flags;
- AI-ONLY fallbacks;
- calls cold and warm.

### Fidelity spot-check

Take 20 random grounded outputs. For each, quote the claim next to its cited passage, and mark it supported or unsupported.

### Final report

1. **Site-wide source share:** the % of sections served from structured casebook / grounded / web / AI-only, before vs after.
2. **Data-gap backlog:** the top 20 gaps by domain and topic.
3. Every failure, with a proposed fix.

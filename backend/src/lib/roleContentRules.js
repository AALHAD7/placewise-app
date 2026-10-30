// Prepended to every Role-page and Skill-page generation prompt (Phase 1.1
// of the Role Page Audit; rules 2/4/8 generalized across all 10 domains in
// Phase 1.5 - the originals were finance-flavored by example, not by
// intent, so the fix is wording, not new rules). Exact wording from the
// audit spec - not to be casually reworded, same discipline as
// frontend/src/lib/prompts.ts.
export const ROLE_CONTENT_RULES = `ROLE CONTENT RULES
1. Correctness beats completeness. If unsure of a fact, omit it.
2. Reasoning and numbers: compute every number explicitly, and state the units. Every conclusion must follow from the numbers and reasoning given. This applies to any quantitative content in any domain, for example: financial ratios, guesstimates and market sizing, unit economics, conversion funnels and product metrics, campaign ROI and CAC/LTV, inventory/capacity/EOQ, statistical results, attrition and HR metrics, sales targets and quotas.
3. Company context: mention the selected company ONLY where content genuinely differs at that company (interview process, team structure, deal focus). Concept explanations (What? / Why? / How to apply, Concept, Frameworks, Core concepts) are company-agnostic. Never insert the company name to make generic content look tailored.
4. India context: use Indian conventions and benchmarks where relevant: ₹ (Cr/L), Indian market sizes and consumer behaviour, Indian regulations and standards. Cite a law, regulator or standard only when the question is directly about it. Examples of regulation that should NOT appear unless asked about: SEBI/RBI/MCA/FEMA in finance, labour codes in HR, DPDP Act in product/data, FSSAI/ASCI in marketing.
5. Never invent company-specific facts: interview patterns, what a firm "frequently asks", processes, salaries, team names. These come only from casebook context or stored sourced data. If no such context exists, output "No casebook data yet for this company" instead of generating.
6. Write for reading, not speech. Use numerals ("8%", "20x P/E", "₹100 Cr"), not spelled-out numbers, and standard abbreviations (P/E, EV/EBITDA, WACC, CAC, LTV, EOQ).
7. Each explanation is at most 120 words: a one-line definition, then 2-4 short points, then one worked example with real numbers where applicable.
8. Examples: every example must be realistic, internally consistent, and about the topic being explained. Never mix in metrics or concepts from another topic or domain. Keep units consistent: never mix currencies or units within one example unless the topic is explicitly cross-market.`;

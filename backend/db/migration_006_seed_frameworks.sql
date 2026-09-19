-- Run in the Supabase SQL editor. Seeds the `frameworks` table with a small
-- set of standard, publicly-documented interview frameworks (not fabricated
-- company-specific intel — these are the same well-known frameworks every
-- PM/consulting prep guide covers) so the Frameworks Library page has real
-- content to show instead of the static 3-row mock it had before. Company-
-- specific data (companies, company_interview_questions) is still left for
-- the user to supply separately, per the existing decision in this project.

insert into frameworks (name, role, level, description, example, steps) values
(
  'CIRCLES',
  'Product',
  'mba',
  'A structured approach to product design questions ("design a product for X") that makes sure you cover the problem space before jumping to solutions.',
  'Prompt: "Design an alarm clock for the visually impaired." Walk through each step below out loud, spending the most time on Identify and List.',
  array[
    'Comprehend the situation — clarify the user, the goal, and any constraints before proposing anything.',
    'Identify the customer — pick a specific user segment to design for, not "everyone".',
    'Report the customer''s needs — list what that segment actually needs, in their words.',
    'Cut, through prioritization — pick the 1-2 needs worth solving first and say why.',
    'List solutions — brainstorm multiple ways to address the prioritized need(s).',
    'Evaluate trade-offs — weigh the solutions against impact, effort, and constraints.',
    'Summarize your recommendation — state your pick and the reasoning in one or two sentences.'
  ]
),
(
  'AARM Funnel',
  'Product',
  'mba',
  'A metrics framework for reasoning about a product''s user lifecycle, useful for "how would you improve metric X" or "diagnose this funnel" questions.',
  'Prompt: "DAU for our app dropped 15% last month — how do you investigate?" Use the funnel to isolate which stage regressed before hypothesizing why.',
  array[
    'Acquisition — how new users find and first arrive at the product.',
    'Activation — whether a new user reaches a meaningful first-value moment.',
    'Retention — whether users come back and keep using the product over time.',
    'Monetization — whether and how the product converts usage into revenue.',
    'For a metric-drop question: identify which stage moved first, then hypothesize causes specific to that stage rather than the whole funnel at once.'
  ]
),
(
  'STAR+R',
  'General',
  'mba',
  'An extension of the standard STAR behavioural framework that adds a reflection step — panels increasingly probe for self-awareness, not just outcomes.',
  'Prompt: "Tell me about a time you failed." Most candidates stop at Result; the +R step is what separates a strong answer from an average one.',
  array[
    'Situation — one to two sentences of context, no more.',
    'Task — what you specifically were responsible for.',
    'Action — what you actually did, in your own words, with enough specificity to sound real.',
    'Result — the outcome, ideally with a number or a concrete change.',
    'Reflection — what you would do differently, or what it changed about how you work now. This is the step candidates skip and panels specifically listen for.'
  ]
),
(
  'RICE',
  'Product',
  'mba',
  'A lightweight scoring framework for prioritization questions ("how would you prioritize this backlog", "what would you build next").',
  'Prompt: "You have 4 possible features and one quarter — how do you decide?" Score each on the four factors, then justify the ranking, not just the arithmetic.',
  array[
    'Reach — how many users or how much of the business this touches in a given period.',
    'Impact — how much it moves the goal metric per user reached (often scored on a simple scale).',
    'Confidence — how sure you are about the reach/impact estimates.',
    'Effort — the cost to build it, usually in person-time.',
    'Score = (Reach x Impact x Confidence) / Effort — use it to rank options, then sanity-check the ranking against judgment before presenting it.'
  ]
),
(
  'MECE',
  'Consulting',
  'mba',
  'Not a step-by-step framework but a structuring principle — used to organize any answer (market sizing, case structuring, root-cause analysis) into non-overlapping, fully-covering buckets.',
  'Prompt: "Why has this retailer''s profit declined?" A MECE structure might split into Revenue vs. Cost, then break each further, rather than listing overlapping ad-hoc reasons.',
  array[
    'Mutually Exclusive — each bucket in your structure should not overlap with another (e.g. splitting by "online vs. offline revenue", not "online revenue vs. total revenue").',
    'Collectively Exhaustive — the buckets together should cover the whole problem, with nothing left out.',
    'Say your structure out loud before diving into any one branch — panels are often evaluating the structure itself, not just the final answer.',
    'When in doubt, a simple valid split is often stronger than a clever but overlapping one.'
  ]
);

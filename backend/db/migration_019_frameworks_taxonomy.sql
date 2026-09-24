-- Run in the Supabase SQL editor. Rebuilds the Frameworks page around a
-- real domain -> subdomain -> framework taxonomy instead of one flat,
-- 5-row list with no way to browse by topic. `domain` here uses the exact
-- same values already stored on document_chunks.domain (see backend/db/
-- migration_001_add_domain.sql / migration_014_chunk_images.sql) - not a
-- remapped label - so frameworksGrounding.js's real-casebook-excerpt lookup
-- can filter straight to the right corpus with no translation layer.
--
-- when_to_use/when_not_to_use/pitfalls and the diagram fields below are all
-- static, hand-authored content (same nature as the existing description/
-- steps columns, or POPULAR_ROLES/POPULAR_COMPANIES elsewhere in this
-- codebase) - not generated per-request. A framework's real casebook
-- grounding (verbatim excerpt + a real diagram image, when the ingested
-- corpus has one) still comes from frameworksGrounding.js's vector search,
-- same as before, just now domain-filtered instead of searching everything.
--
-- diagram_type/diagram_data back a small set of coded, hand-verified visual
-- aids (a 2x2/3x3 grid or a funnel) for the handful of frameworks whose
-- value is largely in their fixed visual structure (BCG Matrix, Ansoff
-- Matrix, Business Model Canvas, SWOT, AIDA, the 9-Box Grid) - same "coded
-- visual, not a generated image file" call already made for the Company
-- Timeline feature. Most frameworks (CIRCLES, RICE, MECE, ...) have no
-- diagram_type - their existing numbered-steps display already is their
-- structure.

alter table frameworks add column if not exists domain text;
alter table frameworks add column if not exists subdomain text;
alter table frameworks add column if not exists when_to_use text;
alter table frameworks add column if not exists when_not_to_use text;
alter table frameworks add column if not exists pitfalls text[];
alter table frameworks add column if not exists diagram_type text; -- 'grid' | 'funnel' | null
alter table frameworks add column if not exists diagram_data jsonb;
-- The real casebook diagram image frameworksGrounding.js's vector search
-- finds (if any), alongside the existing text grounded_example - same
-- lazy-compute-once-cache-forever pattern, just widened to also capture
-- image_url.
alter table frameworks add column if not exists grounded_image jsonb;

create index if not exists frameworks_domain_subdomain_idx on frameworks(domain, subdomain);

-- Backfill the 5 existing rows into the new taxonomy.
update frameworks set domain = 'Prodman', subdomain = 'Product Design' where name = 'CIRCLES';
update frameworks set domain = 'Prodman', subdomain = 'Prioritization' where name = 'RICE';
update frameworks set domain = 'Prodman', subdomain = 'Metrics & Growth' where name = 'AARM Funnel';
update frameworks set domain = 'Consulting', subdomain = 'Case Structuring' where name = 'MECE';
update frameworks set domain = 'General Management', subdomain = 'Leadership & Behavioural' where name = 'STAR+R';

insert into frameworks (name, role, level, domain, subdomain, description, when_to_use, when_not_to_use, pitfalls, example, steps, diagram_type, diagram_data) values

-- ===================== Product Management =====================
(
  'Jobs To Be Done',
  'Product', 'mba', 'Prodman', 'Product Design',
  'Reframes "who is the user" questions around what job the customer is really "hiring" the product to do, independent of any specific solution.',
  'Use it when a prompt asks you to design for an underserved need, explain why customers switch products, or find whitegespace competitors are missing.',
  'Skip it for pure prioritization or metrics questions - JTBD explains motivation, it does not rank options or diagnose a funnel.',
  array['Stating the job as a feature ("wants a faster checkout") instead of the underlying goal ("wants to feel confident the purchase went through").', 'Forgetting the functional/emotional/social dimensions of a job - most real jobs have all three.'],
  'Prompt: "Why do people buy a $5 milkshake in the morning?" The classic JTBD answer: commuters are "hiring" it for a long, one-handed, filling companion for a boring drive - not because they wanted a dessert.',
  array[
    'State the job in the customer''s words: "When [situation], I want to [motivation], so I can [outcome]."',
    'Separate the functional job (the practical task) from the emotional and social jobs (how they want to feel, how they want to be seen).',
    'Identify who/what the product is really competing with - often not the obvious category competitor, but whatever else currently gets the job done.',
    'Design the solution around making that job easier, faster, or more reliable - not around adding features nobody hired the product to do.'
  ],
  null, null
),
(
  'ICE Score',
  'Product', 'mba', 'Prodman', 'Prioritization',
  'A faster, rougher cousin of RICE for prioritization under time pressure - three factors instead of four, each scored 1-10.',
  'Use it when you need to rank a long list quickly (10+ ideas) or the prompt explicitly wants speed over precision.',
  'Prefer RICE when the interviewer wants to see you reason about reach explicitly, or when effort estimates matter more than a quick gut-check.',
  array['Scoring everything a 7-8 out of politeness, which flattens the ranking and defeats the point.', 'Not stating what "10" and "1" anchor to before scoring, so the numbers are not comparable across ideas.'],
  'Prompt: "Here are 8 backlog items, rank them in 2 minutes." ICE is fast enough to actually do live, where RICE''s reach math often is not.',
  array[
    'Impact — how much this moves the goal metric if it works, 1-10.',
    'Confidence — how sure you are the impact estimate is right, 1-10.',
    'Ease — how cheap/fast this is to ship, 1-10 (inverse of effort).',
    'Score = (Impact + Confidence + Ease) / 3, or just add them - rank by score, then sanity-check the top 2-3 against judgment out loud.'
  ],
  null, null
),
(
  'North Star Metric',
  'Product', 'mba', 'Prodman', 'Metrics & Growth',
  'The single metric that best captures the core value a product delivers to customers - used to align a team around one number instead of a dashboard of vanity metrics.',
  'Use it for "how would you measure success for this product" or "what metric would you track" questions.',
  'Do not use it as a stand-in for a full metrics tree - a North Star is one number for alignment, not a diagnostic tool for "why did this metric move".',
  array['Picking a metric that is easy to move but does not track real value (e.g. app opens instead of completed trips).', 'Picking a pure revenue metric - a good North Star usually sits upstream of revenue, tied to the value exchanged, not the money collected.'],
  'Spotify''s North Star is closer to "time spent listening" than "subscription revenue" - revenue follows if that number is healthy.',
  array[
    'Identify the core value exchange: what does the customer actually get, and when do they get it?',
    'Pick a metric that only moves when real value is delivered (not a proxy that can be gamed).',
    'Check it is leading, not lagging - it should predict revenue/retention, not just restate them.',
    'Break it into 2-4 input metrics your team can actually influence day to day.'
  ],
  null, null
),

-- ===================== Consulting =====================
(
  '3Cs Framework',
  'Consulting', 'mba', 'Consulting', 'Case Structuring',
  'A quick situational lens (Company, Customer, Competitor) for opening a case before diving into a more specific structure - not a full answer on its own.',
  'Use it in the first 30-60 seconds of a case to organize your clarifying questions, especially for market-entry or strategy cases.',
  'Do not use it as your final structure for the whole case - it is too generic to carry a full profitability or M&A answer; move to a sharper, question-specific structure once you understand the situation.',
  array['Treating it as the answer instead of a warm-up - interviewers notice when a candidate never moves past 3Cs.', 'Listing generic facts under each C instead of ones specific to this client''s actual situation.'],
  'Prompt: "Our client, a mid-size airline, wants to enter the cargo business - where do we start?" Use 3Cs to quickly frame the airline''s current position, its target cargo customers, and who already competes there, then pivot into a market-entry structure.',
  array[
    'Company — what does the client do today, what are its strengths/constraints, why is it asking this question now?',
    'Customer — who is the end customer, what do they actually value, how is demand changing?',
    'Competitor — who else serves this space, how intense is the competition, what is the client''s relative position?',
    'Use the 3Cs to generate 2-3 sharp clarifying questions, then move into a structure built for the specific question (market sizing, profitability, M&A, etc.).'
  ],
  null, null
),
(
  'Porter''s Five Forces',
  'Consulting', 'mba', 'Consulting', 'Market Sizing & Entry',
  'Analyzes how attractive an industry is by looking at five sources of competitive pressure - used heavily in market-entry and industry-attractiveness cases.',
  'Use it when a prompt asks "should our client enter this industry" or "how attractive is this market", especially when there is time to go deep on one structure.',
  'Skip it for a pure market-sizing arithmetic question, or a case that is really about internal operations/cost - Five Forces answers "is this a good industry", not "how big is it" or "why are costs high".',
  array['Listing all five forces at equal length regardless of which actually matter for this industry - a strong answer identifies the 1-2 forces that dominate and spends most of the time there.', 'Confusing "competitive rivalry" with "threat of new entrants" - rivalry is about existing players, entrants is about barriers to joining.'],
  'Prompt: "Should our client, a regional grocery chain, enter meal-kit delivery?" Five Forces surfaces that low entry barriers and high buyer power (easy to switch kits) are likely the forces that matter most here.',
  array[
    'Threat of new entrants — how easy is it for someone new to start competing?',
    'Bargaining power of suppliers — can suppliers squeeze margins?',
    'Bargaining power of buyers — can customers demand lower prices or better terms?',
    'Threat of substitutes — are there other ways customers could get this job done?',
    'Competitive rivalry — how intense is competition among existing players?',
    'Identify which 1-2 forces are strongest for this specific industry and build your recommendation around those.'
  ],
  null, null
),
(
  'Market Sizing (Top-Down / Bottom-Up)',
  'Consulting', 'mba', 'Consulting', 'Market Sizing & Entry',
  'A structured way to estimate a market''s size under time pressure, from either the total population down or from a single unit up.',
  'Use it for any "how many/how much" estimation question - market size, revenue potential, units sold per year.',
  'Do not use it when the interviewer is really testing structure/strategy, not arithmetic - if the numbers are secondary to the recommendation, spend less time here.',
  array['Picking numbers that sound precise but are not sanity-checked (e.g. "43.7% of households") - round numbers with a stated rationale are stronger.', 'Not stating assumptions out loud before calculating - the interviewer is grading the logic, not just the final number.'],
  'Prompt: "How many golf balls are sold in India each year?" Top-down: population -> % who golf -> balls per golfer per year. Bottom-up: number of golf courses -> rounds played per course per day -> balls lost/bought per round.',
  array[
    'State which approach you will use and why, out loud.',
    'Top-down: start from a known total (population, market size) and multiply down by relevant percentages.',
    'Bottom-up: start from one unit (one store, one customer, one course) and multiply up by the count of units.',
    'Use round, defensible numbers and state each assumption as you use it.',
    'Sanity-check the final number against something you already know, and flag if it seems off before presenting it as final.'
  ],
  null, null
),
(
  'Profitability Framework (Revenue - Cost Tree)',
  'Consulting', 'mba', 'Consulting', 'Profitability & Growth',
  'Breaks "why did profit change" into a revenue tree and a cost tree so you can isolate which branch actually moved, instead of guessing at causes.',
  'Use it for any "profit declined/what should we do about profit" case - the most common consulting case archetype.',
  'Do not use it for a pure market-entry or M&A-synergy question where profit is not the object of the case.',
  array['Jumping straight to a hypothesis ("it must be competition") before breaking down the tree - the tree is what tells you where to look.', 'Building an unbalanced tree - a common mistake is spending 90% of the time on cost and never seriously checking revenue, or vice versa.'],
  'Prompt: "Our client''s profit fell 20% year over year - why?" Build Revenue (Price x Volume, by segment) and Cost (Fixed + Variable, by category) trees, ask for data on each branch, and isolate which one moved before hypothesizing why.',
  array[
    'Profit = Revenue - Cost. Draw both sides before asking any data questions.',
    'Revenue = Price x Volume - break Volume further by segment/channel/product line if useful.',
    'Cost = Fixed + Variable - break Variable further by category (COGS, labor, marketing, etc.).',
    'Ask for data on the branches most likely to explain a 20%+ move, not every branch equally.',
    'Once you isolate the branch that moved, hypothesize causes specific to that branch, not the business generally.'
  ],
  null, null
),

-- ===================== Marketing:Sales =====================
(
  'BCG Growth-Share Matrix',
  'Marketing', 'mba', 'Marketing:Sales', 'Market Analysis',
  'Classifies a company''s products or business units on relative market share vs. market growth rate, to decide where to invest, hold, or divest.',
  'Use it for portfolio-strategy questions - "which of these products should we invest in", "how should we allocate budget across this portfolio".',
  'Do not use it for a single-product question (it needs a portfolio to compare) or when data on relative market share genuinely is not available.',
  array['Treating "Dogs" as automatically-kill - some Dogs are cash-neutral and strategically necessary (e.g. completing a product line).', 'Confusing market growth rate with market share - the two axes are easy to swap by mistake.'],
  'Netflix''s DVD-by-mail business became a "Cash Cow" (high share, low growth) that funded its "Star" streaming business (high share, high growth) during the transition.',
  array[
    'X-axis: Relative market share (High to Low, left to right).',
    'Y-axis: Market growth rate (High to Low, top to bottom).',
    'Stars (high share, high growth): invest to maintain leadership.',
    'Question Marks (low share, high growth): invest selectively or divest - decide based on potential to become a Star.',
    'Cash Cows (high share, low growth): harvest cash, invest minimally.',
    'Dogs (low share, low growth): divest or hold only if strategically necessary.'
  ],
  'grid',
  '{"xAxis":"Relative Market Share","yAxis":"Market Growth Rate","cols":["High","Low"],"rows":["High","Low"],"cells":[["Stars","Question Marks"],["Cash Cows","Dogs"]]}'
),
(
  'Ansoff Matrix',
  'Marketing', 'mba', 'Marketing:Sales', 'Growth & Scaling',
  'Maps four growth strategies along two axes - new vs. existing products, and new vs. existing markets - to structure "how should we grow" questions.',
  'Use it for growth-strategy and scaling questions - "how should this company grow next", "should we launch this in a new market or a new product line".',
  'Do not use it for a pure profitability/cost question, or when the growth options on the table do not actually differ by product/market newness.',
  array['Picking "Diversification" by default because it sounds ambitious - it is the highest-risk quadrant and needs strong justification, not enthusiasm.', 'Not being specific about what "new" means for this client - new to the company, or new to the world?'],
  'Prompt: "How should Zomato grow next?" Market Penetration = more orders from existing cities; Product Development = launch grocery delivery to existing users; Market Development = launch food delivery in a new country; Diversification = enter an unrelated business like fintech.',
  array[
    'X-axis: Products (Existing to New, left to right).',
    'Y-axis: Markets (Existing to New, top to bottom).',
    'Market Penetration (existing product, existing market): sell more of what you have to who you already serve - lowest risk.',
    'Product Development (new product, existing market): new offerings for your current customers.',
    'Market Development (existing product, new market): take what you have into a new segment/geography.',
    'Diversification (new product, new market): highest risk, needs the strongest justification.'
  ],
  'grid',
  '{"xAxis":"Products","yAxis":"Markets","cols":["Existing","New"],"rows":["Existing","New"],"cells":[["Market Penetration","Product Development"],["Market Development","Diversification"]]}'
),
(
  'STP (Segmentation, Targeting, Positioning)',
  'Marketing', 'mba', 'Marketing:Sales', 'Branding & Positioning',
  'The standard three-step process for deciding who to sell to and how to be seen by them, before any campaign or product decision.',
  'Use it for "who should we target" or "how should we position this product" questions - almost always the right starting structure for a branding/launch case.',
  'Do not use it as a substitute for a GTM plan - STP tells you who and how you want to be perceived, not the channels/budget/timeline to get there.',
  array['Segmenting on demographics alone when behavior/needs-based segments would be sharper (two 28-year-olds can have completely different needs).', 'A positioning statement that could apply to any competitor - it should name a specific, defensible point of difference.'],
  'Prompt: "How should a new D2C protein brand position itself against Whey Gold Standard?" Segment by fitness goal (not just age), target the "convenience-first" gym-goer segment, position as "the protein you will actually finish before it expires".',
  array[
    'Segmentation — split the market into groups with meaningfully different needs (behavioral/needs-based beats demographic alone).',
    'Targeting — pick which segment(s) to pursue, based on size, growth, and fit with the company''s strengths.',
    'Positioning — define how you want the target segment to perceive you relative to alternatives, in one clear, differentiated statement.'
  ],
  null, null
),
(
  '4Ps of Marketing (Marketing Mix)',
  'Marketing', 'mba', 'Marketing:Sales', 'Marketing Mix',
  'The classic checklist for turning a positioning into an executable marketing plan - Product, Price, Place, Promotion.',
  'Use it once STP has defined who you are targeting and how, to structure the actual execution plan.',
  'Do not use it as your opening structure for a "should we enter this market" case - it is an execution checklist, not a strategic decision framework.',
  array['Listing all four Ps generically without tying each back to the specific target segment''s needs.', 'Treating Price as "as high as possible" instead of what the segment''s willingness-to-pay and the competitive set actually support.'],
  'Prompt: "Plan the marketing mix for a new budget airline route." Product = no-frills economy seating; Price = below legacy-carrier fares; Place = direct app booking + budget travel aggregators; Promotion = social-first launch campaign targeting price-sensitive travelers.',
  array[
    'Product — what exactly are you selling, and which features matter to the target segment?',
    'Price — what pricing model and level fits the segment''s willingness-to-pay and the competitive set?',
    'Place — which channels/locations should this be available through?',
    'Promotion — how will the target segment actually hear about it, and what is the core message?'
  ],
  'grid',
  '{"xAxis":null,"yAxis":null,"cols":["",""],"rows":["",""],"cells":[["Product","Price"],["Place","Promotion"]]}'
),
(
  'AIDA Funnel',
  'Marketing', 'mba', 'Marketing:Sales', 'Go-to-Market',
  'A simple model of the stages a customer moves through before buying - Attention, Interest, Desire, Action - used to diagnose or design a marketing funnel.',
  'Use it for "how would you design this campaign" or "where in the funnel are we losing customers" questions.',
  'Do not use it for post-purchase questions (retention, repeat usage) - AIDA stops at the first purchase; use AARRR/AARM instead for the fuller lifecycle.',
  array['Designing all four stages with the same message - each stage needs a different kind of content (Attention needs reach, Action needs a clear, low-friction next step).', 'Ignoring which stage is actually the bottleneck before proposing fixes across the whole funnel.'],
  'A performance-marketing funnel: Attention = a scroll-stopping video ad; Interest = a landing page explaining the product; Desire = social proof and a limited-time offer; Action = a one-tap checkout.',
  array[
    'Attention — get noticed in a crowded environment (ads, PR, social reach).',
    'Interest — hold their attention with relevant information once you have it.',
    'Desire — build an emotional or rational reason to want this specifically.',
    'Action — remove friction from the final step that converts interest into a purchase.'
  ],
  'funnel',
  '{"stages":["Attention","Interest","Desire","Action"]}'
),
(
  'GTM Strategy Canvas',
  'Marketing', 'mba', 'Marketing:Sales', 'Go-to-Market',
  'A one-page structure for planning a product or market launch - who you are targeting, what you are offering them, and how you will reach and convert them.',
  'Use it for "how would you launch this product" or "plan the go-to-market for X" questions - broader than AIDA, covering strategy as well as funnel execution.',
  'Do not use it for a pure positioning question with no launch/rollout component - use STP alone for that.',
  array['Writing a GTM plan with no sequencing - a real GTM plan phases what happens first (e.g. one city, one segment) before scaling.', 'Picking channels because they are trendy rather than because the target segment is actually there.'],
  'Prompt: "Plan the GTM for a new UPI-based lending product." Target segment: gig workers with thin credit files; value prop: instant approval using UPI transaction history; channels: partnerships with gig platforms, not broad ads; launch sequence: 1 city pilot, then scale by city.',
  array[
    'Target segment — who exactly is the first customer, and why them first?',
    'Value proposition — what specific problem does this solve for that segment, in their words?',
    'Channels — where does this segment actually spend attention, and which channels are cost-effective to reach them?',
    'Pricing & offer — what is the launch offer, and does it match the segment''s willingness-to-pay?',
    'Sequencing — what is the phased rollout (one city/segment/channel first), and what triggers expansion to the next phase?'
  ],
  null, null
),
(
  'Product Life Cycle',
  'Marketing', 'mba', 'Marketing:Sales', 'Market Analysis',
  'Describes how a product''s sales and competitive dynamics typically evolve through four stages - Introduction, Growth, Maturity, Decline - and what strategy fits each.',
  'Use it to explain why a strategy that worked at launch should change later, or to diagnose which stage a declining product is in before recommending a fix.',
  'Do not force-fit it onto a product whose trajectory genuinely does not follow this curve (e.g. a fad, or a product with structurally recurring demand) - state that explicitly rather than shoehorning it in.',
  array['Assuming every declining product is in "Decline" - a Maturity-stage dip from a fixable execution issue looks similar but needs a different fix.', 'Recommending the same playbook (aggressive growth spending) regardless of which stage the product is actually in.'],
  'A legacy SaaS product past its growth peak, facing new competitors and slowing renewals, is likely in Maturity, not Decline - the right move is often defending share and extending the cycle, not writing it off.',
  array[
    'Introduction — low sales, high marketing spend, focus on awareness and early adopters.',
    'Growth — sales accelerate, competitors enter, focus shifts to differentiation and distribution.',
    'Maturity — growth slows, market is saturated, focus shifts to efficiency, retention, and defending share.',
    'Decline — sales fall, focus shifts to harvesting cash, cost-cutting, or a deliberate exit/relaunch.'
  ],
  null, null
),

-- ===================== General Management =====================
(
  'Business Model Canvas',
  'General', 'mba', 'General Management', 'Business Model & Strategy',
  'A one-page map of the nine building blocks of how a business creates, delivers, and captures value - used to describe or design an entire business model at a glance.',
  'Use it for "explain this company''s business model" or "design a business model for X" questions - broader than a single strategy framework, covering the whole operating logic.',
  'Do not use it for a narrow tactical question (a single pricing decision, a single channel choice) - it is meant for whole-business, not single-decision, analysis.',
  array['Filling in blocks generically ("customers: everyone") instead of specifically for this business.', 'Treating Cost Structure and Revenue Streams as an afterthought - they are what makes the other seven blocks a real business, not just a product idea.'],
  'Airbnb''s canvas: Key Resources = the platform + trust/review system, not physical property; Customer Segments = both hosts and guests (two-sided); Revenue Streams = service fees from both sides of each booking.',
  array[
    'Customer Segments — who are you creating value for?',
    'Value Propositions — what problem are you solving, for which segment?',
    'Channels — how do you reach and deliver to customers?',
    'Customer Relationships — how do you acquire, retain, and grow each segment?',
    'Revenue Streams — how and from whom does the business actually get paid?',
    'Key Resources — what assets does the value proposition require?',
    'Key Activities — what must the business do well operationally?',
    'Key Partners — who do you rely on externally to make this work?',
    'Cost Structure — what are the biggest costs this model drives?'
  ],
  'grid',
  '{"xAxis":null,"yAxis":null,"cols":["","",""],"rows":["","",""],"cells":[["Key Partners","Key Activities","Value Propositions"],["Key Resources","Customer Relationships","Customer Segments"],["Cost Structure","Channels","Revenue Streams"]]}'
),
(
  'SWOT Analysis',
  'General', 'mba', 'General Management', 'Business Model & Strategy',
  'A quick internal/external scan - Strengths, Weaknesses, Opportunities, Threats - used to frame a company''s current strategic position before recommending a direction.',
  'Use it as a fast opening frame for "assess this company''s strategic position" questions, especially early in a case before going deeper.',
  'Do not stop at SWOT as your final answer - interviewers see it as a starting lens, not a recommendation; always follow it with a specific "so what" move.',
  array['Listing generic strengths/weaknesses that could apply to any company in the industry, rather than ones specific to this company.', 'Never connecting the four quadrants - a strong SWOT pairs a Strength with an Opportunity (or a Weakness with a Threat) to generate an actual recommendation.'],
  'For a legacy retailer: Strength = trusted brand and store network; Weakness = weak e-commerce; Opportunity = growing online grocery demand; Threat = pure-play online competitors. The "so what": use the trusted brand + stores as a click-and-collect advantage online competitors cannot easily copy.',
  array[
    'Strengths — internal advantages this company has today.',
    'Weaknesses — internal gaps or disadvantages today.',
    'Opportunities — external trends or gaps this company could exploit.',
    'Threats — external risks that could hurt this company.',
    'Pair quadrants together (Strength + Opportunity, Weakness + Threat) to generate a specific, actionable recommendation - do not leave the four lists unconnected.'
  ],
  'grid',
  '{"xAxis":null,"yAxis":null,"cols":["",""],"rows":["",""],"cells":[["Strengths","Weaknesses"],["Opportunities","Threats"]]}'
),
(
  'Blue Ocean Strategy (Four Actions Framework)',
  'General', 'mba', 'General Management', 'Strategy Frameworks',
  'A tool for finding uncontested market space by asking which industry factors to Eliminate, Reduce, Raise, and Create - instead of competing head-on within existing industry norms.',
  'Use it for "how can this company escape a price war" or "design a differentiated strategy" questions where competing on existing terms looks like a losing game.',
  'Do not use it when the real issue is execution, not strategy - Blue Ocean answers "what game should we play", not "why are we losing the game we are already playing".',
  array['Proposing to "Create" only, without also being willing to genuinely "Eliminate" something the industry assumes is necessary - the framework''s power is in doing both.', 'Confusing it with simple differentiation - Blue Ocean is specifically about redefining the basis of competition, not just adding one more feature.'],
  'Cirque du Soleil eliminated star performers and animal acts (standard in traditional circus), reduced the fun/humor focus, raised the artistic/theatrical quality, and created a refined theatre-going experience - competing outside the traditional circus industry entirely.',
  array[
    'Eliminate — which factors the industry takes for granted should be removed entirely?',
    'Reduce — which factors should be cut well below the industry standard?',
    'Raise — which factors should be pushed well above the industry standard?',
    'Create — which factors should be introduced that the industry has never offered?'
  ],
  null, null
),

-- ===================== Finance =====================
(
  'DCF (Discounted Cash Flow)',
  'Finance', 'mba', 'Finance', 'Valuation',
  'Values a business by projecting its future free cash flows and discounting them back to today''s value using a required rate of return.',
  'Use it when asked to value a company or investment from first principles, or to explain what actually drives a valuation rather than just quoting a multiple.',
  'Do not lean on it when reliable long-term cash flow projections are not realistic (early-stage/pre-revenue companies) - a comparables approach is usually more defensible there.',
  array['Being overly precise on far-future projections - small changes in year-10 assumptions swing the valuation wildly; state that sensitivity rather than hiding it.', 'Using an unjustified discount rate - it should reflect the actual risk of the specific cash flows, not a round number picked for convenience.'],
  'Valuing a subscription business: project 5-10 years of free cash flow from subscriber growth and margins, estimate a terminal value beyond that, then discount everything back using a rate reflecting the business''s risk (often via WACC).',
  array[
    'Project the company''s free cash flows for an explicit forecast period (commonly 5-10 years).',
    'Estimate a terminal value for cash flows beyond the forecast period (perpetuity growth or exit-multiple method).',
    'Choose a discount rate reflecting the risk of those cash flows (often the Weighted Average Cost of Capital).',
    'Discount each year''s cash flow and the terminal value back to present value and sum them.',
    'Stress-test the output against a plausible range of growth/discount-rate assumptions - a single-point answer is weaker than a defensible range.'
  ],
  null, null
),
(
  'Comparable Company Analysis',
  'Finance', 'mba', 'Finance', 'Valuation',
  'Values a company by looking at what similar, publicly-traded companies trade for (e.g. EV/Revenue, EV/EBITDA, P/E) and applying those multiples to the target.',
  'Use it for a quick, market-grounded valuation check, or when the interviewer wants a faster answer than a full DCF.',
  'Do not use it when truly comparable companies do not exist, or without adjusting for real differences in growth/margin/risk between the target and the comps.',
  array['Picking comps that look similar on the surface (same industry name) but differ hugely in growth rate or margin profile.', 'Applying a median multiple without explaining why the target should trade at, above, or below that median.'],
  'Valuing a mid-size SaaS company by taking the median EV/Revenue multiple of 5 similar public SaaS companies, then adjusting up or down based on whether the target grows faster or slower than that peer group.',
  array[
    'Select a peer group of genuinely comparable companies (industry, size, growth profile, geography).',
    'Choose the right multiple for the situation (EV/Revenue for high-growth/low-profit companies, EV/EBITDA or P/E for mature/profitable ones).',
    'Calculate the peer group''s multiples and take a representative measure (median is usually more robust than mean).',
    'Apply that multiple to the target''s relevant financial metric to get an implied valuation.',
    'Adjust for real differences between the target and the peer group before presenting the number as final.'
  ],
  null, null
),
(
  'LBO Basics (Leveraged Buyout)',
  'Finance', 'mba', 'Finance', 'Corporate Finance & M&A',
  'A simplified view of how a private equity firm buys a company using mostly debt, improves/holds it, then sells it - and what has to be true for the returns to work.',
  'Use it for "why would a PE firm buy this company" or "what makes a good LBO target" questions.',
  'Do not use it as a general M&A framework - a strategic acquirer buying for synergies is a different question than a financial sponsor buying for a leveraged return.',
  array['Forgetting that debt has to be repaid from the target''s own cash flows - a good LBO target needs stable, predictable cash flow, not just a low price.', 'Ignoring the exit - the whole model depends on being able to sell (or IPO) the company later at a good multiple.'],
  'A PE firm buys a stable, cash-generative business using 70% debt and 30% equity, uses the company''s own cash flow to pay down that debt over 5 years, then sells it - the equity return comes from debt paydown plus any operational improvement or multiple expansion.',
  array[
    'Buy the target using a mix of debt and equity, with debt typically the majority of the purchase price.',
    'The target''s own cash flows are used to service and pay down that debt over the holding period.',
    'Returns come from three levers: debt paydown, operational improvement (margin/growth), and multiple expansion (or contraction) at exit.',
    'A good LBO target has stable, predictable cash flow, room for operational improvement, and a realistic exit path.'
  ],
  null, null
),

-- ===================== HR =====================
(
  'McKinsey 7S Framework',
  'HR', 'mba', 'HR', 'Talent & Org Design',
  'A model of seven interdependent elements (Strategy, Structure, Systems, Shared Values, Skills, Style, Staff) that all need to align for an organization to work well.',
  'Use it for "why is this reorg/transformation struggling" or "assess organizational alignment" questions.',
  'Do not use it for a narrow individual-performance question - it is an organization-level diagnostic, not an individual one.',
  array['Treating the "hard" elements (Strategy, Structure, Systems) as the whole story - misalignment often actually lives in the "soft" elements (Shared Values, Style, Skills, Staff), which are easy to skip over.', 'Diagnosing misalignment without proposing which element should change first - not all seven can move at once.'],
  'A company adopts a new customer-centric Strategy but keeps its old hierarchical Structure and command-and-control Style - the misalignment between Strategy and the other Ss is why the transformation stalls.',
  array[
    'Strategy — the plan for building and sustaining an advantage.',
    'Structure — how the organization is divided and coordinated.',
    'Systems — the processes and procedures that get work done.',
    'Shared Values — the core beliefs that shape culture (the framework''s center).',
    'Skills — the capabilities the organization and its people actually have.',
    'Style — how leadership actually behaves, not just what they say.',
    'Staff — the people, their roles, and how they are developed.',
    'Identify which elements are misaligned with the intended Strategy, and which should change first to unblock the rest.'
  ],
  null, null
),
(
  '9-Box Grid',
  'HR', 'mba', 'HR', 'Performance Management',
  'Plots employees on Performance vs. Potential to inform talent decisions - who to promote, develop, or manage out.',
  'Use it for "how would you design a talent review process" or "how should this manager think about their team" questions.',
  'Do not use it as the sole input for an individual promotion/termination decision in a real organization - it is a talent-planning lens, not a complete performance review.',
  array['Conflating current Performance with future Potential - a strong current performer is not automatically high-potential for a very different future role.', 'Using it as a forced-ranking tool that pits team members against each other rather than a planning input.'],
  'An org uses the grid each year to identify its "high performance, high potential" box for accelerated leadership development, and its "low performance, low potential" box for a structured improvement plan or exit.',
  array[
    'X-axis: Performance (Low to High) — how well they are doing in their current role.',
    'Y-axis: Potential (Low to High) — how much larger a role they could realistically grow into.',
    'High performance + high potential: invest in accelerated development.',
    'High performance + low potential: recognize and retain as strong specialists, not future leaders.',
    'Low performance + high potential: coach - often a fit or ramp-up issue, not a capability ceiling.',
    'Low performance + low potential: manage through a structured improvement plan.'
  ],
  'grid',
  '{"xAxis":"Performance","yAxis":"Potential","cols":["Low","High"],"rows":["High","Low"],"cells":[["Coach","Accelerate"],["Manage Out","Retain as Specialist"]]}'
);

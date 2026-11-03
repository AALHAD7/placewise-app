import type { PlacewiseTreeNode, PlacewiseDiagramBlock } from "../types/api";

// Every diagram here is generated the same way: a Gemini call drafts a structured diagram
// (issue_tree | flow | matrix) grounded strictly in that framework's own already-verified
// description/example/steps/pitfalls (see backend/scripts/regenerateAllFrameworkDiagrams.js
// and generateFrameworkDiagrams.js), then the SAME deterministic renderer functions below
// (treeToAscii/flowToAscii/matrixToAscii) turn it into this ASCII text - never hand-typed,
// never an LLM painting box-drawing characters freehand. Keyed by the framework's exact name
// (not a fuzzy keyword match) so every framework gets its own diagram with zero collision
// risk - a prior keyword-matching version of this file made "AIDA Funnel" and "AARM Funnel"
// silently share one diagram because both matched a loose "funnel" rule.
export const FRAMEWORK_ASCII_MAP: Record<string, { title: string; ascii: string }> = {
  "3 Financial Statements Integration": {
    title: "3 Financial Statements Integration",
    ascii: `┌── (1) Net Income flows to Balance Sheet and Cash Flow
│   └──► Non-cash expenses added back on Cash Flow
┌── (2) Non-cash expenses added back on Cash Flow
│   └──► Net Working Capital changes adjust Operating Cash
┌── (3) Net Working Capital changes adjust Operating Cash
│   └──► Capex investments update PP&E on Balance Sheet
┌── (4) Capex investments update PP&E on Balance Sheet
│   └──► Financing activities adjust Debt and Equity
┌── (5) Financing activities adjust Debt and Equity
│   └──► Net change in cash links to Ending Cash
┌── (6) Net change in cash links to Ending Cash`
  },

  "3Cs Framework": {
    title: "3Cs Framework Process",
    ascii: `┌── (1) Company: Strengths, constraints, & motives
│   └──► Customer: End needs & changing demand
┌── (2) Customer: End needs & changing demand
│   └──► Competitor: Rival landscape & relative position
┌── (3) Competitor: Rival landscape & relative position
│   └──► Pivot to specific deep-dive structure
┌── (4) Pivot to specific deep-dive structure`
  },

  "4Ps of Marketing (Marketing Mix)": {
    title: "4Ps of Marketing (Marketing Mix)",
    ascii: `[ Marketing Mix ]
├── [ Product ]
│   ├── [ Core offering & features ]
│   └── [ Target segment fit ]
├── [ Price ]
│   ├── [ Pricing model ]
│   └── [ Willingness-to-pay ]
├── [ Place ]
│   ├── [ Distribution channels ]
│   └── [ Availability locations ]
└── [ Promotion ]
    ├── [ Launch campaigns ]
    └── [ Core messaging ]`
  },

  "9-Box Grid": {
    title: "9-Box Talent Grid",
    ascii: `                    X-axis: Performance
Y-axis: Potential
                  │ Low Performance      │ Medium Performance   │ High Performance     │
──────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
High Potential    │ Coach / Ramp-up      │ Develop              │ Accelerate / Invest  │
Medium Potential  │ Misaligned           │ Core Contributor     │ Retain as Specialist │
Low Potential     │ Manage Out (PIP)     │ Manage Out           │ Manage Out / Exit    │`
  },

  "AARM Funnel": {
    title: "AARM Funnel Framework",
    ascii: `┌── (1) Acquisition
│   └──► Activation [First arrival]
┌── (2) Activation
│   └──► Retention [First-value moment]
┌── (3) Retention
│   └──► Monetization [Ongoing usage]
┌── (4) Monetization
│   └──► Diagnose & Isolate Drop [Convert revenue]
┌── (5) Diagnose & Isolate Drop`
  },

  "AARRR Framework (Pirate Metrics)": {
    title: "AARRR Framework",
    ascii: `┌── (1) Acquisition metrics
│   └──► Activation metrics
┌── (2) Activation metrics
│   └──► Retention metrics
┌── (3) Retention metrics
│   └──► Referral metrics
┌── (4) Referral metrics
│   └──► Revenue metrics
┌── (5) Revenue metrics`
  },

  "ADDIE Model": {
    title: "ADDIE Model",
    ascii: `┌── (1) Analysis
│   └──► Design
┌── (2) Design
│   └──► Development
┌── (3) Development
│   └──► Implementation
┌── (4) Implementation
│   └──► Evaluation
┌── (5) Evaluation`
  },

  "AIDA Funnel": {
    title: "AIDA Funnel",
    ascii: `┌── (1) Attention
│   └──► Interest
┌── (2) Interest
│   └──► Desire
┌── (3) Desire
│   └──► Action
┌── (4) Action`
  },

  "Ansoff Matrix": {
    title: "Ansoff Matrix Growth Strategies",
    ascii: `                    X-axis: Products
Y-axis: Markets
                  │ Existing Products                │ New Products                     │
──────────────────┼──────────────────────────────────┼──────────────────────────────────┤
Existing Markets  │ Market Penetration (Lowest Risk) │ Product Development              │
New Markets       │ Market Development               │ Diversification (Highest Risk)   │`
  },

  "BCG Growth-Share Matrix": {
    title: "BCG Growth-Share Matrix",
    ascii: `               X-axis: Relative Market Share
Y-axis: Market Growth Rate
             │ High Share     │ Low Share      │
─────────────┼────────────────┼────────────────┤
High Growth  │ Stars          │ Question Marks │
Low Growth   │ Cash Cows      │ Dogs           │`
  },

  "Beta & Capital Asset Pricing Model (CAPM)": {
    title: "CAPM Cost of Equity Calculation Steps",
    ascii: `┌── (1) Select Risk-Free Rate (Rf)
│   └──► Estimate Beta (β) Sensitivity
┌── (2) Estimate Beta (β) Sensitivity
│   └──► Determine Equity Risk Premium (ERP)
┌── (3) Determine Equity Risk Premium (ERP)
│   └──► Calculate Cost of Equity (Ke)
┌── (4) Calculate Cost of Equity (Ke)
│   └──► Unlever and Relever Peer Beta
┌── (5) Unlever and Relever Peer Beta`
  },

  "Blue Ocean Strategy (Four Actions Framework)": {
    title: "Four Actions Framework",
    ascii: `┌── (1) Eliminate taken-for-granted industry factors
│   └──► Reduce factors below industry standard
┌── (2) Reduce factors below industry standard
│   └──► Raise factors above industry standard
┌── (3) Raise factors above industry standard
│   └──► Create new unoffered industry factors
┌── (4) Create new unoffered industry factors`
  },

  "Business Model Canvas": {
    title: "Business Model Canvas Steps",
    ascii: `┌── (1) Customer Segments
│   └──► Value Propositions
┌── (2) Value Propositions
│   └──► Channels
┌── (3) Channels
│   └──► Customer Relationships
┌── (4) Customer Relationships
│   └──► Revenue Streams
┌── (5) Revenue Streams
│   └──► Key Resources
┌── (6) Key Resources
│   └──► Key Activities
┌── (7) Key Activities
│   └──► Key Partners
┌── (8) Key Partners
│   └──► Cost Structure
┌── (9) Cost Structure`
  },

  "CAC vs LTV Unit Economics": {
    title: "CAC vs LTV Unit Economics Workflow",
    ascii: `┌── (1) Calculate Customer Acquisition Cost
│   └──► Calculate Lifetime Value [costs]
┌── (2) Calculate Lifetime Value
│   └──► Evaluate LTV to CAC Ratio [compare]
┌── (3) Evaluate LTV to CAC Ratio
│   └──► Calculate CAC Payback Period [speed]
┌── (4) Calculate CAC Payback Period
│   └──► Apply Strategic Levers [optimize]
┌── (5) Apply Strategic Levers`
  },

  "CIRCLES": {
    title: "CIRCLES Product Design Method",
    ascii: `┌── (1) Comprehend the situation
│   └──► Identify the customer
┌── (2) Identify the customer
│   └──► Report customer needs
┌── (3) Report customer needs
│   └──► Cut through prioritization
┌── (4) Cut through prioritization
│   └──► List solutions
┌── (5) List solutions
│   └──► Evaluate trade-offs
┌── (6) Evaluate trade-offs
│   └──► Summarize recommendation
┌── (7) Summarize recommendation`
  },

  "Comparable Company Analysis": {
    title: "Comparable Company Analysis Steps",
    ascii: `┌── (1) Select a peer group of comparable companies
│   └──► Choose the right multiple for the situation
┌── (2) Choose the right multiple for the situation
│   └──► Calculate peer multiples and take median measure
┌── (3) Calculate peer multiples and take median measure
│   └──► Apply multiple to target's financial metric
┌── (4) Apply multiple to target's financial metric
│   └──► Adjust for real differences before final valuation
┌── (5) Adjust for real differences before final valuation`
  },

  "Customer Satisfaction Score (CSAT)": {
    title: "Customer Satisfaction Score (CSAT)",
    ascii: `┌── (1) Identify segment or channel
│   └──► Map customer journey
┌── (2) Map customer journey
│   └──► Isolate operational pain points
┌── (3) Isolate operational pain points
│   └──► Analyze internal vs external factors
┌── (4) Analyze internal vs external factors
│   └──► Formulate targeted recommendations
┌── (5) Formulate targeted recommendations`
  },

  "DCF (Discounted Cash Flow)": {
    title: "Discounted Cash Flow (DCF) Valuation Steps",
    ascii: `┌── (1) Project free cash flows (5-10 years)
│   └──► Estimate terminal value
┌── (2) Estimate terminal value
│   └──► Choose discount rate (e.g., WACC)
┌── (3) Choose discount rate (e.g., WACC)
│   └──► Discount to present value and sum
┌── (4) Discount to present value and sum
│   └──► Stress-test against assumption ranges
┌── (5) Stress-test against assumption ranges`
  },

  "Dividend Discount Model (Gordon Growth Model)": {
    title: "Dividend Discount Model Workflow",
    ascii: `┌── (1) Project Earnings to EPS
│   └──► Determine Dividend Payout Ratio
┌── (2) Determine Dividend Payout Ratio
│   └──► Calculate Projected Future Dividends
┌── (3) Calculate Projected Future Dividends
│   └──► Determine Cost of Equity
┌── (4) Determine Cost of Equity
│   └──► Estimate Long-Term Growth Rate
┌── (5) Estimate Long-Term Growth Rate
│   └──► Discount to Present Value
┌── (6) Discount to Present Value`
  },

  "DuPont Analysis": {
    title: "DuPont Analysis (ROE Breakdown)",
    ascii: `[ Return on Equity (ROE) ]
├── [ Net Profit Margin ]
│   ├── [ Net Income / Sales ]
│   └── [ Operational Profitability ]
├── [ Asset Turnover Ratio ]
│   ├── [ Sales / Average Assets ]
│   └── [ Asset Efficiency ]
└── [ Equity Multiplier ]
    ├── [ Average Assets / Average Equity ]
    └── [ Financial Leverage ]`
  },

  "Enterprise Value & Equity Value (The Bridge)": {
    title: "Enterprise Value & Equity Value Bridge",
    ascii: `┌── (1) Start with Equity Value (Market Cap)
│   └──► Add Total Debt [include liabilities]
┌── (2) Add Total Debt
│   └──► Add Preferred Stock & Minority Interest [include non-equity claims]
┌── (3) Add Preferred Stock & Minority Interest
│   └──► Subtract Cash & Cash Equivalents [deduct liquid assets]
┌── (4) Subtract Cash & Cash Equivalents
│   └──► Arrive at Enterprise Value (EV) [debt-free / cash-free]
┌── (5) Arrive at Enterprise Value (EV)`
  },

  "Freemium Model": {
    title: "Freemium Model Breakdown",
    ascii: `[ Freemium Strategy ]
├── [ Product Offerings ]
│   ├── [ Free Tier Scope (Core) ]
│   └── [ Premium Features (Paid) ]
├── [ Business Metrics ]
│   ├── [ Conversion Rates ]
│   └── [ Monetization Channels ]
└── [ Key Pitfalls ]
    ├── [ Over-giving Value ]
    ├── [ Conversion Failure ]
    └── [ High Free User Costs ]`
  },

  "GTM Strategy Canvas": {
    title: "GTM Strategy Canvas",
    ascii: `┌── (1) Target Segment
│   └──► Value Proposition [define needs]
┌── (2) Value Proposition
│   └──► Channels [reach audience]
┌── (3) Channels
│   └──► Pricing & Offer [monetize]
┌── (4) Pricing & Offer
│   └──► Sequencing [roll out]
┌── (5) Sequencing`
  },

  "HEART Framework (Google)": {
    title: "HEART Framework Steps",
    ascii: `┌── (1) Happiness: NPS and sentiment
│   └──► Engagement: Frequency and depth
┌── (2) Engagement: Frequency and depth
│   └──► Adoption: New user uptake
┌── (3) Adoption: New user uptake
│   └──► Retention: Cohort return rate
┌── (4) Retention: Cohort return rate
│   └──► Task Success: Efficiency and errors
┌── (5) Task Success: Efficiency and errors
│   └──► Define Goals, Signals, Metrics
┌── (6) Define Goals, Signals, Metrics`
  },

  "Harvard vs Michigan Models of HRM": {
    title: "Harvard vs Michigan Models of HRM",
    ascii: `[ HRM Models ]
├── [ Harvard Model ]
│   ├── [ Employee Interests ]
│   └── [ Stakeholder Impacts ]
└── [ Michigan Model ]
    ├── [ Strategic Fit ]
    └── [ Corporate Goals ]`
  },

  "ICE Score": {
    title: "ICE Score Prioritization Process",
    ascii: `┌── (1) Impact: Goal metric movement (1-10)
│   └──► Confidence: Estimate certainty (1-10)
┌── (2) Confidence: Estimate certainty (1-10)
│   └──► Ease: Inverse of effort/speed (1-10)
┌── (3) Ease: Inverse of effort/speed (1-10)
│   └──► Calculate score and rank by sum/average
┌── (4) Calculate score and rank by sum/average
│   └──► Sanity check top 2-3 against judgment
┌── (5) Sanity check top 2-3 against judgment`
  },

  "Income Statement Waterfall & P&L Walk": {
    title: "Income Statement Waterfall & P&L Walk",
    ascii: `┌── (1) Gross & Net Revenue (Top Line)
│   └──► Gross Profit (Minus COGS) [minus COGS]
┌── (2) Gross Profit (Minus COGS)
│   └──► EBITDA (Minus Operating Expenses) [minus OPEX]
┌── (3) EBITDA (Minus Operating Expenses)
│   └──► EBIT / Operating Income (Minus D&A) [minus D&A]
┌── (4) EBIT / Operating Income (Minus D&A)
│   └──► EBT (Net Interest & Non-Op) [+/- interest & non-op]
┌── (5) EBT (Net Interest & Non-Op)
│   └──► Net Income (Minus Taxes) [minus tax]
┌── (6) Net Income (Minus Taxes)`
  },

  "Jobs To Be Done": {
    title: "Jobs To Be Done Framework",
    ascii: `┌── (1) State job: When [situation], I want to [motivation], so I can [outcome]
│   └──► Separate functional, emotional, and social jobs
┌── (2) Separate functional, emotional, and social jobs
│   └──► Identify true competitors getting the job done
┌── (3) Identify true competitors getting the job done
│   └──► Design solution around making the job easier, faster, or reliable
┌── (4) Design solution around making the job easier, faster, or reliable`
  },

  "Kano Model": {
    title: "Kano Model Feature Classification",
    ascii: `┌── (1) Must-Have / Basic Needs
│   └──► Performance / Linear Needs
┌── (2) Performance / Linear Needs
│   └──► Delighters / Attractive Needs
┌── (3) Delighters / Attractive Needs
│   └──► Indifferent Features
┌── (4) Indifferent Features
│   └──► Reverse Features
┌── (5) Reverse Features
│   └──► Natural Decay Over Time
┌── (6) Natural Decay Over Time`
  },

  "Kirkpatrick Model": {
    title: "Kirkpatrick Model",
    ascii: `┌── (1) Level 1: Reaction
│   └──► Level 2: Learning
┌── (2) Level 2: Learning
│   └──► Level 3: Behavior
┌── (3) Level 3: Behavior
│   └──► Level 4: Results
┌── (4) Level 4: Results`
  },

  "LBO Basics (Leveraged Buyout)": {
    title: "LBO Basics Lifecycle",
    ascii: `┌── (1) Buy target using mostly debt and some equity
│   └──► Use target cash flows to service and pay down debt
┌── (2) Use target cash flows to service and pay down debt
│   └──► Drive returns via paydown, operations, and multiples
┌── (3) Drive returns via paydown, operations, and multiples
│   └──► Exit via sale or IPO to realize equity return
┌── (4) Exit via sale or IPO to realize equity return`
  },

  "M&A Synergy & Integration Tree": {
    title: "M&A Synergy & Integration Flow",
    ascii: `┌── (1) Cost Synergies
│   └──► Revenue Synergies [Add]
┌── (2) Revenue Synergies
│   └──► Financial & Tax Synergies [Add]
┌── (3) Financial & Tax Synergies
│   └──► Implementation Costs & Friction [Subtract]
┌── (4) Implementation Costs & Friction
│   └──► Net Value Creation [Compare NPV]
┌── (5) Net Value Creation`
  },

  "MECE": {
    title: "MECE Structuring Principle",
    ascii: `┌── (1) Mutually Exclusive buckets
│   └──► Collectively Exhaustive coverage [ensure independence]
┌── (2) Collectively Exhaustive coverage
│   └──► Say structure out loud [verify completeness]
┌── (3) Say structure out loud
│   └──► Prefer simple valid splits [refine approach]
┌── (4) Prefer simple valid splits`
  },

  "Managerial Grid (Blake-Mouton)": {
    title: "Managerial Grid (Blake-Mouton)",
    ascii: `                   X-axis: Concern for People
Y-axis: Concern for Production
                 │ Low People                    │ High People                   │
─────────────────┼───────────────────────────────┼───────────────────────────────┤
High Production  │ Authority-Compliance (9,1)    │ Team Management (9,9)         │
Low Production   │ Impoverished Management (1,1) │ Country Club Management (1,9) │`
  },

  "Market Entry Framework": {
    title: "Market Entry Framework",
    ascii: `[ Market Entry Decision ]
├── [ Market Attractiveness ]
│   ├── [ Size and growth rate ]
│   ├── [ Segments and margins ]
│   └── [ Regulatory tailwinds ]
├── [ Competitive Dynamics ]
│   ├── [ Market concentration ]
│   ├── [ Competitor shares ]
│   └── [ Barriers and switching costs ]
├── [ Capabilities & Synergies ]
│   ├── [ Core competencies ]
│   ├── [ Brand transferability ]
│   └── [ Distribution and operations ]
└── [ Financials & Mode of Entry ]
    ├── [ Investment and ROI ]
    ├── [ Risk-reward profile ]
    └── [ Build, buy, or partner ]`
  },

  "Market Sizing (Top-Down / Bottom-Up)": {
    title: "Market Sizing Process",
    ascii: `┌── (1) State approach and why out loud
│   ├──► Top-down: Total population down to percentages
│   └──► Bottom-up: One unit up to total count
┌── (2) Top-down: Total population down to percentages
│   └──► Use round numbers and state assumptions
┌── (3) Bottom-up: One unit up to total count
│   └──► Use round numbers and state assumptions
┌── (4) Use round numbers and state assumptions
│   └──► Sanity-check final number against known facts
┌── (5) Sanity-check final number against known facts`
  },

  "McKinsey 7S Framework": {
    title: "McKinsey 7S Framework Steps",
    ascii: `┌── (1) Strategy
│   └──► Structure
┌── (2) Structure
│   └──► Systems
┌── (3) Systems
│   └──► Shared Values
┌── (4) Shared Values
│   └──► Skills
┌── (5) Skills
│   └──► Style
┌── (6) Style
│   └──► Staff
┌── (7) Staff
│   └──► Identify Misalignments
┌── (8) Identify Misalignments`
  },

  "MoSCoW Method": {
    title: "MoSCoW Method Prioritization",
    ascii: `[ Feature Prioritization ]
├── [ Must-Have ]
│   ├── [ Vital for launch ]
│   └── [ Non-negotiable ]
├── [ Should-Have ]
│   ├── [ Important ]
│   └── [ Not vital for day-one ]
├── [ Could-Have ]
│   └── [ Nice-to-have addition ]
└── [ Won't-Have ]
    └── [ Out of scope for now ]`
  },

  "Net Promoter Score": {
    title: "Net Promoter Score Calculation Flow",
    ascii: `┌── (1) Survey customers (0-10 scale)
│   └──► Categorize promoters (9-10)
┌── (2) Categorize promoters (9-10)
│   └──► Categorize neutral (7-8)
┌── (3) Categorize neutral (7-8)
│   └──► Categorize detractors (0-6)
┌── (4) Categorize detractors (0-6)
│   └──► Calculate score (Promoters - Detractors)
┌── (5) Calculate score (Promoters - Detractors)`
  },

  "North Star Metric": {
    title: "North Star Metric Process",
    ascii: `┌── (1) Identify core value exchange
│   └──► Pick non-gameable metric
┌── (2) Pick non-gameable metric
│   └──► Confirm metric is leading
┌── (3) Confirm metric is leading
│   └──► Break into actionable inputs
┌── (4) Break into actionable inputs`
  },

  "OKR Framework (Objectives & Key Results)": {
    title: "OKR Framework Process",
    ascii: `┌── (1) Define the Qualitative Objective
│   └──► Set 3 to 5 Quantitative Key Results
┌── (2) Set 3 to 5 Quantitative Key Results
│   └──► Keep KRs Outcome-Based
┌── (3) Keep KRs Outcome-Based
│   └──► Target Ambition with Stretch Goals
┌── (4) Target Ambition with Stretch Goals
│   └──► Cascade and Align Bi-Directionally
┌── (5) Cascade and Align Bi-Directionally`
  },

  "PESTEL Analysis": {
    title: "PESTEL Analysis Steps",
    ascii: `┌── (1) Political
│   └──► Economic [next]
┌── (2) Economic
│   └──► Social [next]
┌── (3) Social
│   └──► Technological [next]
┌── (4) Technological
│   └──► Environmental [next]
┌── (5) Environmental
│   └──► Legal [next]
┌── (6) Legal`
  },

  "Porter's Five Forces": {
    title: "Porter's Five Forces",
    ascii: `[ Industry Attractiveness ]
├── [ New Entrants ]
│   └── [ Threat of New Entrants ]
├── [ Bargaining Power ]
│   ├── [ Power of Suppliers ]
│   └── [ Power of Buyers ]
└── [ Threats & Rivalry ]
    ├── [ Threat of Substitutes ]
    └── [ Competitive Rivalry ]`
  },

  "Porter's Generic Strategies": {
    title: "Porter's Generic Strategies",
    ascii: `                 X-axis: Strategic Advantage
Y-axis: Strategic Scope
               │ Lower Cost            │ Differentiation       │
───────────────┼───────────────────────┼───────────────────────┤
Broad Target   │ Cost Leadership       │ Differentiation       │
Narrow Target  │ Cost Focus            │ Differentiation Focus │`
  },

  "Precedent Transaction Analysis": {
    title: "Precedent Transaction Analysis",
    ascii: `┌── (1) Identify Transactions
│   └──► Find Information
┌── (2) Find Information
│   └──► Calculate Multiples
┌── (3) Calculate Multiples
│   └──► Check and Interpret Results
┌── (4) Check and Interpret Results`
  },

  "Product Life Cycle": {
    title: "Product Life Cycle Stages",
    ascii: `┌── (1) Introduction
│   └──► Growth [Sales accelerate]
┌── (2) Growth
│   └──► Maturity [Market saturates]
┌── (3) Maturity
│   └──► Decline [Sales fall]
┌── (4) Decline`
  },

  "Profitability Framework (Revenue - Cost Tree)": {
    title: "Profitability Framework Steps",
    ascii: `┌── (1) Define Profit as Revenue minus Cost
│   └──► Break Revenue into Price and Volume
┌── (2) Break Revenue into Price and Volume
│   └──► Break Cost into Fixed and Variable
┌── (3) Break Cost into Fixed and Variable
│   └──► Ask for data on likely branches
┌── (4) Ask for data on likely branches
│   └──► Isolate branch and hypothesize causes
┌── (5) Isolate branch and hypothesize causes`
  },

  "RICE": {
    title: "RICE Scoring Model",
    ascii: `┌── (1) Reach
│   └──► Impact [users]
┌── (2) Impact
│   └──► Confidence [value]
┌── (3) Confidence
│   └──► Effort [certainty]
┌── (4) Effort
│   └──► Score & Rank [(R x I x C) / E]
┌── (5) Score & Rank`
  },

  "Residual Income Model": {
    title: "Residual Income Model",
    ascii: `┌── (1) Identify current book value
│   └──► Calculate annual residual income
┌── (2) Calculate annual residual income
│   └──► Discount residual income to PV
┌── (3) Discount residual income to PV
│   └──► Calculate terminal value
┌── (4) Calculate terminal value
│   └──► Sum book value and PVs
┌── (5) Sum book value and PVs`
  },

  "STAR+R": {
    title: "STAR+R Framework",
    ascii: `┌── (1) Situation
│   └──► Task
┌── (2) Task
│   └──► Action
┌── (3) Action
│   └──► Result
┌── (4) Result
│   └──► Reflection [+R]
┌── (5) Reflection`
  },

  "STP (Segmentation, Targeting, Positioning)": {
    title: "STP Framework",
    ascii: `┌── (1) Segmentation: Split market by needs
│   └──► Targeting: Pick most viable segment
┌── (2) Targeting: Pick most viable segment
│   └──► Positioning: Define perception vs alternatives
┌── (3) Positioning: Define perception vs alternatives`
  },

  "SWOT Analysis": {
    title: "SWOT Analysis Framework",
    ascii: `[ Strategic Position Scan ]
├── [ Internal Factors ]
│   ├── [ Strengths ]
│   └── [ Weaknesses ]
└── [ External Factors ]
    ├── [ Opportunities ]
    └── [ Threats ]`
  },

  "Terminal Value (Perpetuity vs Exit Multiple)": {
    title: "Terminal Value Calculation Steps",
    ascii: `┌── (1) Project discrete cash flows to steady-state
│   └──► Apply Gordon Growth or Exit Multiple method
┌── (2) Apply Gordon Growth or Exit Multiple method
│   └──► Discount Terminal Value back to Present Value
┌── (3) Discount Terminal Value back to Present Value
│   └──► Cross-check implied multiples and growth rates
┌── (4) Cross-check implied multiples and growth rates`
  },

  "Treasury Stock Method": {
    title: "Treasury Stock Method",
    ascii: `┌── (1) Assume exercise of in-the-money options
│   └──► Determine total cash proceeds
┌── (2) Determine total cash proceeds
│   └──► Calculate repurchased shares
┌── (3) Calculate repurchased shares
│   └──► Find net incremental shares
┌── (4) Find net incremental shares`
  },

  "Value Chain Analysis": {
    title: "Value Chain Analysis",
    ascii: `┌── (1) Map primary and support activities
│   └──► Examine stages to identify costs and bottlenecks
┌── (2) Examine stages to identify costs and bottlenecks
│   └──► Drill down into specific cost drivers
┌── (3) Drill down into specific cost drivers
│   └──► Synthesize findings and develop recommendations
┌── (4) Synthesize findings and develop recommendations`
  },

  "WACC (Weighted Average Cost of Capital)": {
    title: "WACC Calculation Steps",
    ascii: `┌── (1) Determine capital structure weights (E/V and D/V)
│   └──► Calculate Cost of Equity using CAPM
┌── (2) Calculate Cost of Equity using CAPM
│   └──► Determine Pre-tax Cost of Debt
┌── (3) Determine Pre-tax Cost of Debt
│   └──► Apply corporate tax shield to Cost of Debt
┌── (4) Apply corporate tax shield to Cost of Debt
│   └──► Compute WACC blended formula
┌── (5) Compute WACC blended formula
│   └──► Use WACC as DCF discount rate
┌── (6) Use WACC as DCF discount rate`
  },

  "Working Capital & Cash Conversion Cycle": {
    title: "Cash Conversion Cycle Steps",
    ascii: `┌── (1) Calculate Days Inventory Outstanding (DIO)
│   └──► Calculate Days Sales Outstanding (DSO) [Next]
┌── (2) Calculate Days Sales Outstanding (DSO)
│   └──► Calculate Days Payable Outstanding (DPO) [Next]
┌── (3) Calculate Days Payable Outstanding (DPO)
│   └──► Calculate Cash Conversion Cycle (CCC) [DIO + DSO - DPO]
┌── (4) Calculate Cash Conversion Cycle (CCC)
│   └──► Calculate Net Working Capital (NWC) [Assess Liquidity]
┌── (5) Calculate Net Working Capital (NWC)`
  }
};

/**
 * Looks up a framework's diagram by its exact name - see FRAMEWORK_ASCII_MAP above for why
 * this is a direct lookup rather than keyword matching.
 */
export function getAsciiDiagramForFramework(frameworkName: string): { title: string; ascii: string } | null {
  return FRAMEWORK_ASCII_MAP[frameworkName] || null;
}

/**
 * Converts a structured PlacewiseTreeNode (from an issue_tree block) into clean ASCII art.
 */
export function treeToAscii(node: PlacewiseTreeNode, prefix = "", isLast = true, isRoot = true): string {
  if (!node) return "";
  const lines: string[] = [];
  const rawLabel = typeof node === "string" ? node : (node.label || "(node)");
  const label = String(rawLabel).replace(/\r?\n\s*/g, " · ").trim();
  const children = Array.isArray(node.children) ? node.children : [];

  if (isRoot) {
    lines.push(`[ ${label} ]`);
  } else {
    lines.push(`${prefix}${isLast ? "└── " : "├── "}[ ${label} ]`);
  }

  const childPrefix = isRoot ? "" : prefix + (isLast ? "    " : "│   ");

  for (let i = 0; i < children.length; i++) {
    const childIsLast = i === children.length - 1;
    lines.push(treeToAscii(children[i], childPrefix, childIsLast, false));
  }

  return lines.join("\n");
}

export function flowToAscii(
  nodes: Array<{ id: string | number; label: string }>,
  edges: Array<{ from: string | number; to: string | number; label?: string | null }> = []
): string {
  if (!Array.isArray(nodes) || nodes.length === 0) return "";
  const labelOf = new Map(nodes.map(n => [String(n.id), n.label]));
  const lines: string[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const out = edges.filter(e => String(e.from) === String(n.id));
    lines.push(`┌── (${i + 1}) ${n.label}`);
    if (out.length > 0) {
      for (let j = 0; j < out.length; j++) {
        const target = labelOf.get(String(out[j].to)) || `Node ${out[j].to}`;
        const edgeNote = out[j].label ? ` [${out[j].label}]` : "";
        const isLastEdge = j === out.length - 1;
        lines.push(`│   ${isLastEdge ? "└──►" : "├──►"} ${target}${edgeNote}`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * Converts a matrix into a clean ASCII table.
 */
export function matrixToAscii(
  xAxis?: string | null,
  yAxis?: string | null,
  cols: string[] = [],
  rows: string[] = [],
  cells: (string | null)[][] = []
): string {
  const colWidth = Math.max(...cols.map(c => c.length), 16);
  const rowHeadWidth = Math.max(...rows.map(r => r.length), 12);

  const headerLine = `┌─${"─".repeat(rowHeadWidth)}─┬` + cols.map(() => `─${"─".repeat(colWidth)}─`).join("┬") + "┐";
  const dividerLine = `├─${"─".repeat(rowHeadWidth)}─┼` + cols.map(() => `─${"─".repeat(colWidth)}─`).join("┼") + "┤";
  const bottomLine = `└─${"─".repeat(rowHeadWidth)}─┴` + cols.map(() => `─${"─".repeat(colWidth)}─`).join("┴") + "┘";

  const lines: string[] = [];
  if (xAxis || yAxis) {
    lines.push(`[MATRIX] ${yAxis ? `Y: ${yAxis}` : ""} ${xAxis ? `X: ${xAxis}` : ""}`.trim());
  }
  lines.push(headerLine);

  // Column header row
  const headRow = `│ ${"".padEnd(rowHeadWidth)} │` + cols.map(c => ` ${c.padEnd(colWidth)} `).join("│") + "│";
  lines.push(headRow);
  lines.push(dividerLine);

  // Content rows
  for (let ri = 0; ri < rows.length; ri++) {
    const rowLabel = rows[ri] || `Row ${ri + 1}`;
    const rowCells = cells[ri] || [];
    const cellRow = `│ ${rowLabel.padEnd(rowHeadWidth)} │` +
      cols.map((_, ci) => ` ${(rowCells[ci] || "").padEnd(colWidth)} `).join("│") + "│";
    lines.push(cellRow);
    if (ri < rows.length - 1) lines.push(dividerLine);
  }

  lines.push(bottomLine);
  return lines.join("\n");
}

/**
 * Converts a table block into clean ASCII format.
 */
export function tableToAscii(header: string[] = [], rows: (string | null)[][] = []): string {
  if (!header.length && !rows.length) return "";
  const allRows = [header, ...rows.map(r => r.map(c => c || ""))];
  const colWidths = header.map((_, ci) =>
    Math.max(...allRows.map(r => (r[ci] || "").length), 8)
  );

  const top = "┌" + colWidths.map(w => "─".repeat(w + 2)).join("┬") + "┐";
  const mid = "├" + colWidths.map(w => "─".repeat(w + 2)).join("┼") + "┤";
  const bot = "└" + colWidths.map(w => "─".repeat(w + 2)).join("┴") + "┘";

  const lines: string[] = [top];
  lines.push("│" + header.map((h, ci) => ` ${h.padEnd(colWidths[ci])} `).join("│") + "│");
  lines.push(mid);

  for (const r of rows) {
    lines.push("│" + colWidths.map((w, ci) => ` ${(r[ci] || "").padEnd(w)} `).join("│") + "│");
  }

  lines.push(bot);
  return lines.join("\n");
}

/**
 * Converts any PlacewiseDiagramBlock into ASCII art.
 */
export function diagramBlockToAscii(block: PlacewiseDiagramBlock): { title: string; ascii: string } | null {
  if (!block || typeof block !== "object") return null;
  const title = (block as { title?: string }).title || `${(block as { type: string }).type.toUpperCase()} DIAGRAM`;

  switch (block.type) {
    case "issue_tree":
      return { title, ascii: treeToAscii(block.root) };
    case "flow":
      return { title, ascii: flowToAscii(block.nodes, block.edges) };
    case "matrix":
      return { title, ascii: matrixToAscii(block.xAxis, block.yAxis, block.cols, block.rows, block.cells) };
    case "table":
      return { title, ascii: tableToAscii(block.header, block.rows) };
    case "funnel":
      return {
        title,
        ascii: block.stages.map((s, i) => `${" ".repeat(i * 2)}▼ Stage ${i + 1}: ${s}`).join("\n")
      };
    case "other":
      return {
        title,
        ascii: `[${block.description}]\n` + (block.labels || []).map(l => ` • ${l}`).join("\n")
      };
    default:
      return null;
  }
}

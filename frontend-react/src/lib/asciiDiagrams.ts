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
    ascii: `(1) Net Income flows to Balance Sheet and Cash Flow
     │
     ▼
(2) Non-cash expenses added back on Cash Flow
     │
     ▼
(3) Net Working Capital changes adjust Operating Cash
     │
     ▼
(4) Capex investments update PP&E on Balance Sheet
     │
     ▼
(5) Financing activities adjust Debt and Equity
     │
     ▼
(6) Net change in cash links to Ending Cash`
  },

  "3Cs Framework": {
    title: "3Cs Framework Process",
    ascii: `(1) Company: Strengths, constraints, & motives
     │
     ▼
(2) Customer: End needs & changing demand
     │
     ▼
(3) Competitor: Rival landscape & relative position
     │
     ▼
(4) Pivot to specific deep-dive structure`
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
    ascii: `(1) Acquisition
     │  [First arrival]
     ▼
(2) Activation
     │  [First-value moment]
     ▼
(3) Retention
     │  [Ongoing usage]
     ▼
(4) Monetization
     │  [Convert revenue]
     ▼
(5) Diagnose & Isolate Drop`
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
    ascii: `(1) Analysis
     │
     ▼
(2) Design
     │
     ▼
(3) Development
     │
     ▼
(4) Implementation
     │
     ▼
(5) Evaluation`
  },

  "AIDA Funnel": {
    title: "AIDA Funnel",
    ascii: `(1) Attention
     │
     ▼
(2) Interest
     │
     ▼
(3) Desire
     │
     ▼
(4) Action`
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
    ascii: `(1) Select Risk-Free Rate (Rf)
     │
     ▼
(2) Estimate Beta (β) Sensitivity
     │
     ▼
(3) Determine Equity Risk Premium (ERP)
     │
     ▼
(4) Calculate Cost of Equity (Ke)
     │
     ▼
(5) Unlever and Relever Peer Beta`
  },

  "Blue Ocean Strategy (Four Actions Framework)": {
    title: "Four Actions Framework",
    ascii: `[ Four Actions Framework ]
├── [ Eliminate taken-for-granted industry factors ]
├── [ Reduce factors below industry standard ]
├── [ Raise factors above industry standard ]
└── [ Create new unoffered industry factors ]`
  },

  "Business Model Canvas": {
    title: "Business Model Canvas",
    ascii: `[ Business Model Canvas ]
├── [ Customer Segments ]
├── [ Value Propositions ]
├── [ Channels ]
├── [ Customer Relationships ]
├── [ Revenue Streams ]
├── [ Key Resources ]
├── [ Key Activities ]
├── [ Key Partners ]
└── [ Cost Structure ]`
  },

  "CAC vs LTV Unit Economics": {
    title: "CAC vs LTV Unit Economics Workflow",
    ascii: `(1) Calculate Customer Acquisition Cost
     │  [costs]
     ▼
(2) Calculate Lifetime Value
     │  [compare]
     ▼
(3) Evaluate LTV to CAC Ratio
     │  [speed]
     ▼
(4) Calculate CAC Payback Period
     │  [optimize]
     ▼
(5) Apply Strategic Levers`
  },

  "CIRCLES": {
    title: "CIRCLES Product Design Method",
    ascii: `(1) Comprehend the situation
     │
     ▼
(2) Identify the customer
     │
     ▼
(3) Report customer needs
     │
     ▼
(4) Cut through prioritization
     │
     ▼
(5) List solutions
     │
     ▼
(6) Evaluate trade-offs
     │
     ▼
(7) Summarize recommendation`
  },

  "Comparable Company Analysis": {
    title: "Comparable Company Analysis Steps",
    ascii: `(1) Select a peer group of comparable companies
     │
     ▼
(2) Choose the right multiple for the situation
     │
     ▼
(3) Calculate peer multiples and take median measure
     │
     ▼
(4) Apply multiple to target's financial metric
     │
     ▼
(5) Adjust for real differences before final valuation`
  },

  "Customer Satisfaction Score (CSAT)": {
    title: "Customer Satisfaction Score (CSAT)",
    ascii: `(1) Identify segment or channel
     │
     ▼
(2) Map customer journey
     │
     ▼
(3) Isolate operational pain points
     │
     ▼
(4) Analyze internal vs external factors
     │
     ▼
(5) Formulate targeted recommendations`
  },

  "DCF (Discounted Cash Flow)": {
    title: "Discounted Cash Flow (DCF) Valuation Steps",
    ascii: `(1) Project free cash flows (5-10 years)
     │
     ▼
(2) Estimate terminal value
     │
     ▼
(3) Choose discount rate (e.g., WACC)
     │
     ▼
(4) Discount to present value and sum
     │
     ▼
(5) Stress-test against assumption ranges`
  },

  "Dividend Discount Model (Gordon Growth Model)": {
    title: "Dividend Discount Model Workflow",
    ascii: `(1) Project Earnings to EPS
     │
     ▼
(2) Determine Dividend Payout Ratio
     │
     ▼
(3) Calculate Projected Future Dividends
     │
     ▼
(4) Determine Cost of Equity
     │
     ▼
(5) Estimate Long-Term Growth Rate
     │
     ▼
(6) Discount to Present Value`
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
    ascii: `(1) Start with Equity Value (Market Cap)
     │  [include liabilities]
     ▼
(2) Add Total Debt
     │  [include non-equity claims]
     ▼
(3) Add Preferred Stock & Minority Interest
     │  [deduct liquid assets]
     ▼
(4) Subtract Cash & Cash Equivalents
     │  [debt-free / cash-free]
     ▼
(5) Arrive at Enterprise Value (EV)`
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
    ascii: `[ GTM Strategy Canvas ]
├── [ Target Segment ]
├── [ Value Proposition ]
├── [ Channels ]
├── [ Pricing & Offer ]
└── [ Sequencing ]`
  },

  "HEART Framework (Google)": {
    title: "HEART Framework Steps",
    ascii: `(1) Happiness: NPS and sentiment
     │
     ▼
(2) Engagement: Frequency and depth
     │
     ▼
(3) Adoption: New user uptake
     │
     ▼
(4) Retention: Cohort return rate
     │
     ▼
(5) Task Success: Efficiency and errors
     │
     ▼
(6) Define Goals, Signals, Metrics`
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
    ascii: `(1) Impact: Goal metric movement (1-10)
     │
     ▼
(2) Confidence: Estimate certainty (1-10)
     │
     ▼
(3) Ease: Inverse of effort/speed (1-10)
     │
     ▼
(4) Calculate score and rank by sum/average
     │
     ▼
(5) Sanity check top 2-3 against judgment`
  },

  "Income Statement Waterfall & P&L Walk": {
    title: "Income Statement Waterfall & P&L Walk",
    ascii: `(1) Gross & Net Revenue (Top Line)
     │  [minus COGS]
     ▼
(2) Gross Profit (Minus COGS)
     │  [minus OPEX]
     ▼
(3) EBITDA (Minus Operating Expenses)
     │  [minus D&A]
     ▼
(4) EBIT / Operating Income (Minus D&A)
     │  [+/- interest & non-op]
     ▼
(5) EBT (Net Interest & Non-Op)
     │  [minus tax]
     ▼
(6) Net Income (Minus Taxes)`
  },

  "Jobs To Be Done": {
    title: "Jobs To Be Done Framework",
    ascii: `(1) State job: When [situation], I want to [motivation], so I can [outcome]
     │
     ▼
(2) Separate functional, emotional, and social jobs
     │
     ▼
(3) Identify true competitors getting the job done
     │
     ▼
(4) Design solution around making the job easier, faster, or reliable`
  },

  "Kano Model": {
    title: "Kano Model Feature Classification",
    ascii: `[ Kano Model Feature Classification ]
├── [ Must-Have / Basic Needs ]
├── [ Performance / Linear Needs ]
├── [ Delighters / Attractive Needs ]
├── [ Indifferent Features ]
├── [ Reverse Features ]
└── [ Natural Decay Over Time ]`
  },

  "Kirkpatrick Model": {
    title: "Kirkpatrick Model",
    ascii: `(1) Level 1: Reaction
     │
     ▼
(2) Level 2: Learning
     │
     ▼
(3) Level 3: Behavior
     │
     ▼
(4) Level 4: Results`
  },

  "LBO Basics (Leveraged Buyout)": {
    title: "LBO Basics Lifecycle",
    ascii: `(1) Buy target using mostly debt and some equity
     │
     ▼
(2) Use target cash flows to service and pay down debt
     │
     ▼
(3) Drive returns via paydown, operations, and multiples
     │
     ▼
(4) Exit via sale or IPO to realize equity return`
  },

  "M&A Synergy & Integration Tree": {
    title: "M&A Synergy & Integration Flow",
    ascii: `(1) Cost Synergies
     │  [Add]
     ▼
(2) Revenue Synergies
     │  [Add]
     ▼
(3) Financial & Tax Synergies
     │  [Subtract]
     ▼
(4) Implementation Costs & Friction
     │  [Compare NPV]
     ▼
(5) Net Value Creation`
  },

  "MECE": {
    title: "MECE Structuring Principle",
    ascii: `[ MECE Principle ]
├── [ Mutually Exclusive ]
│   └── [ No overlap (e.g. Online vs Offline Revenue, not vs Total) ]
└── [ Collectively Exhaustive ]
    └── [ Full coverage (e.g. Revenue vs Cost splits whole problem) ]`
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
    ascii: `(1) State approach and why out loud
     │
     ▼
(2) Top-down: Total population down to percentages
     │
     ▼
(3) Bottom-up: One unit up to total count
     │
     ▼
(4) Use round numbers and state assumptions
     │
     ▼
(5) Sanity-check final number against known facts`
  },

  "McKinsey 7S Framework": {
    title: "McKinsey 7S Framework",
    ascii: `[ McKinsey 7S Framework ]
├── [ Strategy ]
├── [ Structure ]
├── [ Systems ]
├── [ Shared Values ]
├── [ Skills ]
├── [ Style ]
└── [ Staff ]`
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
    ascii: `(1) Survey customers (0-10 scale)
     │
     ▼
(2) Categorize promoters (9-10)
     │
     ▼
(3) Categorize neutral (7-8)
     │
     ▼
(4) Categorize detractors (0-6)
     │
     ▼
(5) Calculate score (Promoters - Detractors)`
  },

  "North Star Metric": {
    title: "North Star Metric Process",
    ascii: `(1) Identify core value exchange
     │
     ▼
(2) Pick non-gameable metric
     │
     ▼
(3) Confirm metric is leading
     │
     ▼
(4) Break into actionable inputs`
  },

  "OKR Framework (Objectives & Key Results)": {
    title: "OKR Framework Process",
    ascii: `(1) Define the Qualitative Objective
     │
     ▼
(2) Set 3 to 5 Quantitative Key Results
     │
     ▼
(3) Keep KRs Outcome-Based
     │
     ▼
(4) Target Ambition with Stretch Goals
     │
     ▼
(5) Cascade and Align Bi-Directionally`
  },

  "PESTEL Analysis": {
    title: "PESTEL Analysis",
    ascii: `[ PESTEL Analysis ]
├── [ Political ]
├── [ Economic ]
├── [ Social ]
├── [ Technological ]
├── [ Environmental ]
└── [ Legal ]`
  },

  "Porter's Five Forces": {
    title: "Porter's Five Forces",
    ascii: `[ Industry Attractiveness ]
├── [ Threat of New Entrants ]
├── [ Bargaining Power of Suppliers ]
├── [ Bargaining Power of Buyers ]
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
    ascii: `(1) Identify Transactions
     │
     ▼
(2) Find Information
     │
     ▼
(3) Calculate Multiples
     │
     ▼
(4) Check and Interpret Results`
  },

  "Product Life Cycle": {
    title: "Product Life Cycle Stages",
    ascii: `(1) Introduction
     │  [Sales accelerate]
     ▼
(2) Growth
     │  [Market saturates]
     ▼
(3) Maturity
     │  [Sales fall]
     ▼
(4) Decline`
  },

  "Profitability Framework (Revenue - Cost Tree)": {
    title: "Profitability Framework Steps",
    ascii: `(1) Define Profit as Revenue minus Cost
     │
     ▼
(2) Break Revenue into Price and Volume
     │
     ▼
(3) Break Cost into Fixed and Variable
     │
     ▼
(4) Ask for data on likely branches
     │
     ▼
(5) Isolate branch and hypothesize causes`
  },

  "RICE": {
    title: "RICE Scoring Model",
    ascii: `(1) Reach
     │  [users]
     ▼
(2) Impact
     │  [value]
     ▼
(3) Confidence
     │  [certainty]
     ▼
(4) Effort
     │  [(R x I x C) / E]
     ▼
(5) Score & Rank`
  },

  "Residual Income Model": {
    title: "Residual Income Model",
    ascii: `(1) Identify current book value
     │
     ▼
(2) Calculate annual residual income
     │
     ▼
(3) Discount residual income to PV
     │
     ▼
(4) Calculate terminal value
     │
     ▼
(5) Sum book value and PVs`
  },

  "STAR+R": {
    title: "STAR+R Framework",
    ascii: `(1) Situation
     │
     ▼
(2) Task
     │
     ▼
(3) Action
     │
     ▼
(4) Result
     │  [+R]
     ▼
(5) Reflection`
  },

  "STP (Segmentation, Targeting, Positioning)": {
    title: "STP Framework",
    ascii: `(1) Segmentation: Split market by needs
     │
     ▼
(2) Targeting: Pick most viable segment
     │
     ▼
(3) Positioning: Define perception vs alternatives`
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
    ascii: `(1) Project discrete cash flows to steady-state
     │
     ▼
(2) Apply Gordon Growth or Exit Multiple method
     │
     ▼
(3) Discount Terminal Value back to Present Value
     │
     ▼
(4) Cross-check implied multiples and growth rates`
  },

  "Treasury Stock Method": {
    title: "Treasury Stock Method",
    ascii: `(1) Assume exercise of in-the-money options
     │
     ▼
(2) Determine total cash proceeds
     │
     ▼
(3) Calculate repurchased shares
     │
     ▼
(4) Find net incremental shares`
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
    ascii: `(1) Determine capital structure weights (E/V and D/V)
     │
     ▼
(2) Calculate Cost of Equity using CAPM
     │
     ▼
(3) Determine Pre-tax Cost of Debt
     │
     ▼
(4) Apply corporate tax shield to Cost of Debt
     │
     ▼
(5) Compute WACC blended formula
     │
     ▼
(6) Use WACC as DCF discount rate`
  },

  "Working Capital & Cash Conversion Cycle": {
    title: "Cash Conversion Cycle Steps",
    ascii: `(1) Calculate Days Inventory Outstanding (DIO)
     │
     ▼
(2) Calculate Days Sales Outstanding (DSO)
     │
     ▼
(3) Calculate Days Payable Outstanding (DPO)
     │  [DIO + DSO - DPO]
     ▼
(4) Calculate Cash Conversion Cycle (CCC)
     │  [Assess Liquidity]
     ▼
(5) Calculate Net Working Capital (NWC)`
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

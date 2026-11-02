import type { PlacewiseTreeNode, PlacewiseDiagramBlock } from "../types/api";

// High-fidelity handcrafted ASCII diagrams for core consulting, finance, product, marketing, HR, and strategy frameworks.
export const FRAMEWORK_ASCII_MAP: Record<string, { title: string; ascii: string }> = {
  // Profitability Framework / Profit Tree
  profitability: {
    title: "Profit Tree (Revenue & Cost Breakdown)",
    ascii: `                          ┌───────────────────────────┐
                          │          PROFIT           │
                          │     (Revenue - Costs)     │
                          └─────────────┬─────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
  ┌─────────────────────────────┐               ┌─────────────────────────────┐
  │           REVENUE           │               │            COSTS            │
  │      (Price × Volume)       │               │      (Fixed + Variable)     │
  └──────────────┬──────────────┘               └──────────────┬──────────────┘
                 │                                             │
        ┌────────┴────────┐                           ┌────────┴────────┐
        ▼                 ▼                           ▼                 ▼
 ┌─────────────┐   ┌─────────────┐             ┌─────────────┐   ┌─────────────┐
 │    PRICE    │   │   VOLUME    │             │ FIXED COSTS │   │VAR. COSTS   │
 │ (per unit)  │   │(units sold) │             │ (overhead)  │   │ (per unit)  │
 ├─────────────┤   ├─────────────┤             ├─────────────┤   ├─────────────┤
 │• Product mix│   │• Market size│             │• Rent/Leases│   │• Materials  │
 │• Discounts  │   │• Mkt share  │             │• SG&A/Salary│   │• Direct lab.│
 │• Elasticity │   │• Retention  │             │• IT & equip.│   │• Packaging  │
 │• Bundling   │   │• Distribut. │             │• Deprec.    │   │• Shipping   │
 └─────────────┘   └─────────────┘             └─────────────┘   └─────────────┘`
  },

  // MECE
  mece: {
    title: "MECE Principle (Mutually Exclusive, Collectively Exhaustive)",
    ascii: `                           ┌───────────────────────────┐
                           │     PROBLEM STATEMENT     │
                           └─────────────┬─────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
   ┌───────────────────────────┐                   ┌───────────────────────────┐
   │        CATEGORY A         │                   │        CATEGORY B         │
   │  (No Overlap with B)      │                   │  (Together Covers 100%)   │
   └─────────────┬─────────────┘                   └─────────────┬─────────────┘
                 │                                               │
        ┌────────┴────────┐                             ┌────────┴────────┐
        ▼                 ▼                             ▼                 ▼
   ┌───────────┐     ┌───────────┐                 ┌───────────┐     ┌───────────┐
   │ Sub-cat 1 │     │ Sub-cat 2 │                 │ Sub-cat 3 │     │ Sub-cat 4 │
   └───────────┘     └───────────┘                 └───────────┘     └───────────┘

   • Mutually Exclusive (ME): Zero overlap. No element falls into more than one bucket.
   • Collectively Exhaustive (CE): Zero gaps. Together all buckets cover 100% of the space.`
  },

  // 3Cs Framework
  "3cs": {
    title: "3Cs Strategic Alignment Lens",
    ascii: `                      ┌──────────────────────────────────────┐
                      │            3Cs STRATEGY LENS         │
                      └──────────────────┬───────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
 ┌──────────────┐                 ┌──────────────┐                 ┌──────────────┐
 │   COMPANY    │                 │  CUSTOMERS   │                 │ COMPETITORS  │
 ├──────────────┤                 ├──────────────┤                 ├──────────────┤
 │• Core assets │                 │• Segments    │                 │• Market share│
 │• Cost basis  │                 │• Needs & pain│                 │• Value prop  │
 │• Product mix │                 │• Price sens. │                 │• Cost curve  │
 │• Culture/DNA │                 │• Journey/CLV │                 │• Moats/IP    │
 └──────────────┘                 └──────────────┘                 └──────────────┘`
  },

  // Market Sizing
  "market sizing": {
    title: "Market Sizing: Top-Down vs Bottom-Up",
    ascii: `   TOP-DOWN APPROACH                           BOTTOM-UP APPROACH
   ┌───────────────────────────────────┐       ┌───────────────────────────────────┐
   │ Entire Population / Macro Base    │       │ Customer / Unit Base Level        │
   │ (e.g. 1.4B total population)      │       │ (e.g. Number of households/shops) │
   └─────────────────┬─────────────────┘       └─────────────────┬─────────────────┘
                     ▼ Filter: Demographics                      ▼ Multiplied by:
   ┌───────────────────────────────────┐       ┌───────────────────────────────────┐
   │ Target Demographic & Income Slice │       │ Units / Purchases per Period      │
   │ (e.g. Urban, Tier 1/2, Age 20-40) │       │ (e.g. 2 devices per household)    │
   └─────────────────┬─────────────────┘       └─────────────────┬─────────────────┘
                     ▼ Filter: Accessibility                     ▼ Multiplied by:
   ┌───────────────────────────────────┐       ┌───────────────────────────────────┐
   │ Serviceable Addressable Market    │       │ Average Order Value / Price (ASP) │
   │ (Internet penetration, awareness) │       │ (e.g. $250 avg ticket size)       │
   └─────────────────┬─────────────────┘       └─────────────────┬─────────────────┘
                     ▼ Multiply: Usage × ASP                     ▼ Equals:
   ┌───────────────────────────────────┐       ┌───────────────────────────────────┐
   │ TOTAL ADDRESSABLE MARKET (TAM)    │       │ TOTAL MARKET SIZE                 │
   └───────────────────────────────────┘       └───────────────────────────────────┘`
  },

  // Porter's Five Forces
  porter: {
    title: "Porter's Five Forces (Traditional Industry Structure Model)",
    ascii: `                                 ┌─────────────────────────────┬─────────────────────────────┐
                                 │                 THREAT OF NEW ENTRANTS                    │
                                 ├───────────────────────────────────────────────────────────┤
                                 │ • Economies of scale         • Capital requirements       │
                                 │ • Brand loyalty & identity   • Customer switching costs   │
                                 │ • Access to distribution     • Government policy & IP/pat │
                                 └─────────────────────────────┬─────────────────────────────┘
                                                               │
                                                               ▼
┌───────────────────────────────────┐        ┌─────────────────┬─────────────────┐        ┌───────────────────────────────────┐
│   BARGAINING POWER OF SUPPLIERS   │        │    RIVALRY AMONG COMPETITORS    │        │    BARGAINING POWER OF BUYERS     │
├───────────────────────────────────┤        ├─────────────────────────────────┤        ├───────────────────────────────────┤
│ • Supplier concentration vs firms │        │ • Competitor balance & count    │        │ • Buyer concentration & volume    │
│ • Input differentiation & quality │ ─────► │ • Industry growth rate (slow)   │ ◄───── │ • Buyer switching costs (low)     │
│ • Switching costs of suppliers    │        │ • High fixed costs & storage    │        │ • Price sensitivity & low margins │
│ • Availability of substitute input│        │ • Low switching costs & diff.   │        │ • Undifferentiated / commodities  │
│ • Threat of forward integration   │        │ • Capacity added in large jumps │        │ • Threat of backward integration  │
│ • Importance of volume to supplier│        │ • High exit barriers (contracts)│        │ • Full information available      │
└───────────────────────────────────┘        └─────────────────┴─────────────────┘        └───────────────────────────────────┘
                                                               ▲
                                                               │
                                 ┌─────────────────────────────┴─────────────────────────────┐
                                 │               THREAT OF SUBSTITUTE PRODUCTS               │
                                 ├───────────────────────────────────────────────────────────┤
                                 │ • Relative price & performance of substitute products     │
                                 │ • Buyer switching costs to alternative categories         │
                                 │ • Buyer propensity to substitute & changing preferences   │
                                 └───────────────────────────────────────────────────────────┘

STRATEGIC SYNTHESIS:
• Intense / Strong Forces ──► High competitive pressure ──► Low industry margins (e.g., Commercial Airlines, Commodity Retail)
• Mild / Weak Forces     ──► Low competitive pressure  ──► High industry margins (e.g., Enterprise Software, Medical Devices)`
  },

  // --- FINANCE: Valuation & Corporate Finance ---
  lbo: {
    title: "LBO Mechanics & Returns Waterfall (Leveraged Buyout)",
    ascii: `   ENTRY (Day 0)                 HOLDING PERIOD (3-7 Yrs)                 EXIT (Day N)
   ┌─────────────────────────┐   ┌───────────────────────────────┐   ┌─────────────────────────┐
   │ ACQUISITION FINANCING   │   │ OPERATIONAL VALUE CREATION    │   │ TOTAL EXIT PROCEEDS     │
   │ (Sources & Uses)        │   │ (Free Cash Flow Generation)   │   │ (Enterprise Value)      │
   ├─────────────────────────┤   ├───────────────────────────────┤   ├─────────────────────────┤
   │ Senior Debt     (40-50%)│──►│ • Free Cash Flow Generation   │──►│ Senior Debt (Repaid!)   │
   │ Subordinated    (15-25%)│   │ • Pay down senior debt        │   │ Mezzanine   (Repaid!)   │
   │ Sponsor Equity  (25-40%)│   │ • Operational margin expansion│   ├─────────────────────────┤
   │ Management Roll  (2-5%) │   │ • Organic / M&A EBITDA growth │   │ SPONSOR EQUITY RETURN   │
   │ Total Purchase: 100%    │   │ • Working capital turnaround  │   │ (Multiple of Money MoIC)│
   └─────────────────────────┘   └───────────────────────────────┘   └─────────────────────────┘

   THE 3 ENGINES OF LBO RETURNS (Target IRR: 20-25%):
   1. DEBT PAYDOWN: Target's own cash flows pay off borrowing (deleveraging equity).
   2. EBITDA GROWTH: Revenue expansion and margin enhancement increase operating profit.
   3. MULTIPLE EXPANSION: Selling the company at a higher EV/EBITDA multiple than entry.`
  },

  ev_bridge: {
    title: "Enterprise Value to Equity Value Valuation Bridge",
    ascii: `   EQUITY VALUE (Market Capitalization)
   ┌────────────────────────────────────────────────────────┐
   │ Diluted Share Price × Fully Diluted Shares Outstanding │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼  (+) Add Net Debt & Non-Common Claims
   ┌────────────────────────────────────────────────────────┐
   │ (+) Total Debt (Short-term & Long-term Debt)           │
   │ (+) Preferred Stock (Liquidation value)                │
   │ (+) Non-Controlling / Minority Interest                │
   │ (-) Cash and Cash Equivalents (and liquid investments) │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼  (=) Core Operating Value
   ┌────────────────────────────────────────────────────────┐
   │ ENTERPRISE VALUE (EV / Firm Value)                     │
   │ Represents true takeover value of operating business   │
   └────────────────────────────────────────────────────────┘

   VALUATION MULTIPLE ALIGNMENT:
   • Enterprise Value Multiples (Unlevered): EV / EBITDA  ·  EV / EBIT  ·  EV / Sales
   • Equity Value Multiples     (Levered):   P / E  ·  Price / Book  ·  Price / FCFE`
  },

  capm: {
    title: "CAPM & The Systematic Risk Spectrum (Beta)",
    ascii: `   CAPITAL ASSET PRICING MODEL (Cost of Equity):
   ┌─────────────────────────────────────────────────────────────────────────┐
   │           Expected Return (Ke) = Rf + β × [ Rm - Rf ]                   │
   │                                                                         │
   │  • Rf:  Risk-Free Rate (e.g. 10-Yr US Treasury Yield: ~4.0%)            │
   │  • β:   Beta (Sensitivity to systematic macroeconomic movements)         │
   │  • ERP: Equity Risk Premium [Rm - Rf] (Historical equity spread: ~5.5%) │
   └─────────────────────────────────────────────────────────────────────────┘

   BETA RISK SPECTRUM:
      β < 0         β = 0             0 < β < 1             β = 1             β > 1
   [ Inverted ]  [ Risk-Free ]      [ Defensive ]        [ Market ]      [ Aggressive ]
   Gold/Shorts    Treasuries    Utilities, Staples, Med    S&P 500       Tech, Luxury, PE
   Moves against  Zero equity    Low volatility, stable    Benchmark      Amplified market
   market cycle   correlation    recession-resistant       movement       swings/cyclical

   UNLEVERED BETA (Asset Beta)  = Levered Beta / [ 1 + (1 - Tax Rate) × (Debt / Equity) ]
   RELEVERED BETA (Equity Beta) = Unlevered Beta × [ 1 + (1 - Tax Rate) × (Target D/E) ]`
  },

  wacc: {
    title: "WACC (Weighted Average Cost of Capital) Architecture",
    ascii: `   ┌────────────────────────────────────────────────────────────────────────┐
   │  WACC = [ (E / V) × Ke ]  +  [ (D / V) × Kd × (1 - Tax Rate) ]          │
   └───────────────────────────────────┬────────────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
     ┌─────────────────────────────┐       ┌─────────────────────────────┐
     │   EQUITY COMPONENT          │       │    DEBT COMPONENT           │
     ├─────────────────────────────┤       ├─────────────────────────────┤
     │ • Weight: E / V             │       │ • Weight: D / V             │
     │ • Cost: Ke (via CAPM)       │       │ • Cost: Kd (Yield/Spread)   │
     │ • Riskier than debt         │       │ • Tax Shield: × (1 - Tax)   │
     │ • No contractual repayment  │       │ • Cheaper due to tax deduct │
     └─────────────────────────────┘       └─────────────────────────────┘

   CAPITAL STRUCTURE SENSITIVITY:
   • Low Debt: Safe, but WACC is suboptimal (missing out on cheap debt tax shields).
   • Optimal Debt: Minimizes WACC and maximizes Enterprise Value.
   • Excessive Debt: Increases financial distress risk; both Kd and Ke spike sharply.`
  },

  terminal_value: {
    title: "Terminal Value (Perpetual Growth vs. Exit Multiple)",
    ascii: `   DISCRETE PROJECTIONS (Years 1 to N)          TERMINAL VALUE (Year N+1 to ∞)
   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   ┌─────────────────────────────┐
   │ Yr 1 │─│ Yr 2 │─│ Yr 3 │─│ Yr 4 │─│ Yr 5 │──►│   TERMINAL VALUE HORIZON    │
   │ FCF1 │ │ FCF2 │ │ FCF3 │ │ FCF4 │ │ FCF5 │   │   (65% - 85% of Total DCF)  │
   └──────┘ └──────┘ └──────┘ └──────┘ └──────┘   └──────────────┬──────────────┘
                                                                 │
                                     ┌───────────────────────────┴───────────────────────────┐
                                     ▼                                                       ▼
                      ┌─────────────────────────────┐                         ┌─────────────────────────────┐
                      │   GORDON GROWTH PERPETUITY  │                         │    EXIT MULTIPLE METHOD     │
                      ├─────────────────────────────┤                         ├─────────────────────────────┤
                      │ TV = [ FCF_N × (1 + g) ]    │                         │ TV = EBITDA_N × Exit Mult   │
                      │      ───────────────────    │                         │ (Benchmark mature peers)    │
                      │          (WACC - g)         │                         ├─────────────────────────────┤
                      ├─────────────────────────────┤                         │ Cross-Check:                │
                      │ • g ≤ Long-term GDP (2-3%)  │                         │ Implied g =                 │
                      │ • Prevents absurd growth    │                         │ WACC - (FCF_N+1 / TV)       │
                      └─────────────────────────────┘                         └─────────────────────────────┘
                                     │                                                       │
                                     └───────────────────────────┬───────────────────────────┘
                                                                 ▼
                                                  Discount to Present Value:
                                                  PV(TV) = TV / (1 + WACC)^N`
  },

  income_statement: {
    title: "Income Statement Waterfall & P&L Walk",
    ascii: `   ┌───────────────────────────────────────────────────────────────┐
   │ GROSS REVENUES (Gross Sales / Top Line)                       │
   │ (-) Returns, Discounts & Allowances                           │
   └───────────────────────────────┬───────────────────────────────┘
                                   ▼
   ┌───────────────────────────────────────────────────────────────┐
   │ NET REVENUE                                                   │
   │ (-) Cost of Goods Sold (COGS: Raw materials, Direct labor)    │
   └───────────────────────────────┬───────────────────────────────┘
                                   ▼
   ┌───────────────────────────────────────────────────────────────┐
   │ GROSS PROFIT  (Gross Margin % = Gross Profit / Net Revenue)   │
   │ (-) Operating Expenses (SG&A, R&D, Sales & Marketing Overhead)│
   └───────────────────────────────┬───────────────────────────────┘
                                   ▼
   ┌───────────────────────────────────────────────────────────────┐
   │ EBITDA  (Earnings Before Interest, Taxes, Deprec. & Amort.)   │
   │ (-) Depreciation (Tangible PP&E) & Amortization (Intangibles) │
   └───────────────────────────────┬───────────────────────────────┘
                                   ▼
   ┌───────────────────────────────────────────────────────────────┐
   │ EBIT / OPERATING INCOME                                       │
   │ (-) Net Interest Expense (Debt interest - Cash interest)      │
   │ (+/-) Non-Operating Gains / Losses                            │
   └───────────────────────────────┬───────────────────────────────┘
                                   ▼
   ┌───────────────────────────────────────────────────────────────┐
   │ EBT (Earnings Before Taxes / Pre-Tax Income)                  │
   │ (-) Corporate Income Taxes (Cash Taxes + Deferred Taxes)      │
   └───────────────────────────────┬───────────────────────────────┘
                                   ▼
   ┌───────────────────────────────────────────────────────────────┐
   │ NET INCOME  (Bottom Line / Earnings Available to Equity)      │
   │ Divided by Diluted Share Count = Earnings Per Share (EPS)     │
   └───────────────────────────────────────────────────────────────┘`
  },

  three_statements: {
    title: "3 Financial Statements Dynamic Linkage",
    ascii: `             INCOME STATEMENT
   ┌───────────────────────────────────┐
   │ Revenue                           │
   │ (-) Expenses & Taxes              │
   │ ═════════════════════════════════ │
   │ NET INCOME                        │────────┐
   └───────────────────────────────────┘        │
                     │                          │
                     ▼                          ▼
           CASH FLOW STATEMENT            BALANCE SHEET
   ┌───────────────────────────────────┐  ┌───────────────────────────────────┐
   │ CASH FROM OPERATIONS (CFO)        │  │ ASSETS                            │
   │ • Starts with Net Income ◄────────┼──┤ • Cash (Ending cash from CFS)◄────┤──┐
   │ • (+) Add back Non-Cash (D&A) ────┼──┤ • Accounts Receivable             │  │
   │ • (+/-) Net Working Capital swings│  │ • Inventory                       │  │
   ├───────────────────────────────────┤  │ • PP&E (Net of Depreciation) ◄───┼──┤
   │ CASH FROM INVESTING (CFI)         │  ├───────────────────────────────────┤  │
   │ • (-) Capital Expenditures (Capex)├──┤ LIABILITIES                       │  │
   ├───────────────────────────────────┤  │ • Accounts Payable & Accrued      │  │
   │ CASH FROM FINANCING (CFF)         │  │ • Debt (Borrowings / Paydowns) ◄──┼──┤
   │ • (+/-) Debt issued / repaid ─────┼──┤ SHAREHOLDERS' EQUITY              │  │
   │ • (-) Dividends paid              │  │ • Common Stock                    │  │
   ├───────────────────────────────────┤  │ • Retained Earnings               │  │
   │ NET CHANGE IN CASH                │  │   (Prior RE + Net Income - Divs) ◄┼──┘
   │ + Beginning Cash = Ending Cash ───┼──┘                                   │
   └───────────────────────────────────┘  └───────────────────────────────────┘`
  },

  working_capital: {
    title: "Working Capital & Cash Conversion Cycle (CCC)",
    ascii: `   TIMELINE OF CASH INFLOWS & OUTFLOWS:
    
   Day 0: Buy Inventory              Day 35: Sell Goods             Day 50: Collect Cash
   ┌─────────────────────────────────┬──────────────────────────────┬───────────────────┐
   │       INVENTORY HELD            │      ACCOUNTS RECEIVABLE     │                   │
   │   Days Inventory Out (DIO) = 35 │  Days Sales Out (DSO) = 15   │                   │
   └─────────────────────────────────┴──────────────────────────────┴───────────────────┘
   │◄─────────────────── OPERATING CYCLE = 50 DAYS ────────────────►│
   
   ┌──────────────────────────────────────────────┐
   │           ACCOUNTS PAYABLE                   │
   │       Days Payable Out (DPO) = 60            │
   └──────────────────────────────────────────────┘
   Day 0: Receive Invoice                         Day 60: Pay Supplier
   
   ──────────────────────────────────────────────────────────────────────────────────────
   CASH CONVERSION CYCLE (CCC) = DIO + DSO - DPO
   CCC = 35 + 15 - 60 = -10 DAYS
   
   • POSITIVE CCC: Company must fund trapped working capital (receivables + inventory).
   • NEGATIVE CCC: Company collects customer cash before paying suppliers (free float).`
  },

  comps: {
    title: "Comparable Company Analysis (Trading Comps)",
    ascii: `   PEER UNIVERSE SELECTION        FINANCIAL METRICS           VALUATION MULTIPLES
   ┌───────────────────────────┐  ┌─────────────────────────┐ ┌─────────────────────────┐
   │ • Same Industry & Sector  │  │ • Revenue & Growth rate │ │ • EV / EBITDA  (Core)   │
   │ • Similar Size / MarketCap│──► • Gross & EBITDA Margin │─► • EV / EBIT    (Capex)  │
   │ • Comparable Geography    │  │ • Net Income & Margins  │ │ • EV / Sales   (Growth) │
   │ • Customer Type (B2B/B2C) │  │ • Balance Sheet Health  │ │ • P / E        (Equity) │
   └───────────────────────────┘  └─────────────────────────┘ └────────────┬────────────┘
                                                                           │
                                  BENCHMARK BENCH & VALUATION              ▼
   ┌────────────────────────────────────────────────────────────────────────────────────┐
   │ Multiples Spread:      25th Percentile       Median         75th Percentile        │
   │ Target EV/EBITDA:           8.5x              10.2x              12.0x             │
   │ Implied Enterprise Value:  $85.0M            $102.0M            $120.0M            │
   │ (-) Net Debt:              -$20.0M           -$20.0M            -$20.0M            │
   │ Implied Equity Value:      $65.0M            $82.0M             $100.0M            │
   └────────────────────────────────────────────────────────────────────────────────────┘`
  },

  dcf: {
    title: "Discounted Cash Flow (DCF) Valuation Bridge",
    ascii: `   Year 1      Year 2      Year 3      Year 4      Year 5      Terminal Value
   ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐     ┌────────────┐
   │FCF 1│     │FCF 2│     │FCF 3│     │FCF 4│     │FCF 5│     │ Perpetuity │
   └──┬──┘     └──┬──┘     └──┬──┘     └──┬──┘     └──┬──┘     └─────┬──────┘
      │           │           │           │           │              │
      ▼           ▼           ▼           ▼           ▼              ▼
   Discount each future cash flow back to Present Value using WACC:
              PV = FCF_t / (1 + WACC)^t
   ──────────────────────────────────────────────────────────────────────────
   Enterprise Value = Sum of PV(FCF_1..5) + PV(Terminal Value)
   Equity Value     = Enterprise Value - Net Debt`
  },

  // --- GENERAL MANAGEMENT & STRATEGY ---
  bmc: {
    title: "Business Model Canvas (9 Building Blocks)",
    ascii: ` ┌──────────────────┬──────────────────┬──────────────────┬──────────────────┬──────────────────┐
 │ KEY PARTNERS     │ KEY ACTIVITIES   │ VALUE            │ CUSTOMER         │ CUSTOMER         │
 │                  │                  │ PROPOSITIONS     │ RELATIONSHIPS    │ SEGMENTS         │
 │ • Suppliers      │ • Production     │                  │                  │                  │
 │ • Alliances      │ • Problem solving│ • Core solution  │ • Personal assist│ • Target niches  │
 │ • Joint ventures │ • Platform/mkt   │ • Pain relievers │ • Self-service   │ • Mass market    │
 │                  ├──────────────────┤ • Gain creators  ├──────────────────┤ • Multi-sided    │
 │                  │ KEY RESOURCES    │ • Cost / Quality │ CHANNELS         │                  │
 │                  │                  │                  │                  │                  │
 │                  │ • Physical / IP  │                  │ • Direct / Web   │                  │
 │                  │ • Human / Talent │                  │ • Sales force    │                  │
 ├──────────────────┴──────────────────┴──────────────────┴──────────────────┴──────────────────┤
 │ COST STRUCTURE                                         │ REVENUE STREAMS                     │
 │ • Fixed costs vs Variable costs                        │ • Asset sales / Subscription fees   │
 │ • Cost-driven vs Value-driven economies of scale       │ • Dynamic vs Fixed list pricing     │
 └────────────────────────────────────────────────────────┴─────────────────────────────────────┘`
  },

  blue_ocean: {
    title: "Blue Ocean Strategy: Four Actions Framework (ERRC)",
    ascii: `                            ┌───────────────────────────┐
                            │    FOUR ACTIONS (ERRC)    │
                            │  Create Uncontested Space │
                            └─────────────┬─────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
   ┌─────────────────────────────┐                 ┌─────────────────────────────┐
   │         ELIMINATE           │                 │           RAISE             │
   ├─────────────────────────────┤                 ├─────────────────────────────┤
   │ Which factors that industry │                 │ Which factors should be     │
   │ has long competed on should │                 │ raised well above the       │
   │ be completely eliminated?   │                 │ industry standard?          │
   └─────────────────────────────┘                 └─────────────────────────────┘
                  │                                               │
                  ▼                                               ▼
   ┌─────────────────────────────┐                 ┌─────────────────────────────┐
   │          REDUCE             │                 │          CREATE             │
   ├─────────────────────────────┤                 ├─────────────────────────────┤
   │ Which factors should be     │                 │ Which factors should be     │
   │ reduced well below the      │                 │ created that the industry   │
   │ industry standard?          │                 │ has never offered?          │
   └─────────────────────────────┘                 └─────────────────────────────┘`
  },

  star: {
    title: "STAR+R Behavioral Response Framework",
    ascii: ` ┌─────┬─────────────────────────────────────────────────────────┬──────────────┐
 │ S   │ Situation (Set the context, company, timeline & stakes) │ ~15% of time │
 ├─────┼─────────────────────────────────────────────────────────┼──────────────┤
 │ T   │ Task (The specific problem, goal, or mandate assigned)   │ ~15% of time │
 ├─────┼─────────────────────────────────────────────────────────┼──────────────┤
 │ A   │ Action (Your personal leadership, decisions & execution)│ ~50% of time │
 ├─────┼─────────────────────────────────────────────────────────┼──────────────┤
 │ R   │ Result (Measurable outcome, quantifiable ROI, metrics)  │ ~15% of time │
 ├─────┼─────────────────────────────────────────────────────────┼──────────────┤
 │ +R  │ Reflection (Retrospective learnings, what you'd adapt)  │ ~5% of time  │
 └─────┴─────────────────────────────────────────────────────────┴──────────────┘`
  },

  swot: {
    title: "SWOT Strategic Analysis Matrix",
    ascii: `                    INTERNAL (Capabilities)
             HELPFUL                       HARMFUL
   ┌─────────────────────────────┬─────────────────────────────┐
   │        STRENGTHS            │        WEAKNESSES           │
   │ • Proprietary tech / IP     │ • High fixed cost base      │
   │ • Strong brand & loyalty    │ • Gaps in talent/supply     │
   │ • Robust balance sheet      │ • Weak digital presence     │
   ├─────────────────────────────┼─────────────────────────────┤
   │      OPPORTUNITIES          │         THREATS             │
   │ • Emerging market expansion │ • Aggressive new entrants   │
   │ • Unmet consumer pain points│ • Changing regulations      │
   │ • Synergistic M&A targets   │ • Shifting consumer taste   │
   └─────────────────────────────┴─────────────────────────────┘
                    EXTERNAL (Environment)`
  },

  pestel: {
    title: "PESTEL Macro-Environmental Strategic Radar",
    ascii: ` ┌───────────────────────────┬───────────────────────────┬───────────────────────────┐
 │ POLITICAL                 │ ECONOMIC                  │ SOCIAL                    │
 │ • Government stability    │ • Inflation & interest    │ • Demographics & aging    │
 │ • Trade tariffs & policy  │ • Currency exchange rates │ • Consumer lifestyles     │
 │ • Taxation frameworks     │ • GDP growth trajectories │ • Cultural preferences    │
 ├───────────────────────────┼───────────────────────────┼───────────────────────────┤
 │ TECHNOLOGICAL             │ ENVIRONMENTAL             │ LEGAL                     │
 │ • AI & automation shifts  │ • Climate & carbon goals  │ • Antitrust & competition │
 │ • R&D innovation pace     │ • Raw material scarcity   │ • Labor & employment laws │
 │ • Infrastructure & cloud  │ • ESG compliance rules    │ • Data privacy (GDPR/etc) │
 └───────────────────────────┴───────────────────────────┴───────────────────────────┘`
  },

  generic_strategies: {
    title: "Porter's Generic Competitive Strategies",
    ascii: `                                    COMPETITIVE ADVANTAGE
                              LOWER COST                DIFFERENTIATION
                     ┌───────────────────────────┬───────────────────────────┐
               BROAD │     COST LEADERSHIP       │      DIFFERENTIATION      │
                     │  Lowest cost of operation │  Unique value commanding  │
                     │  in industry (e.g. Walmart│  premium price (e.g. Apple│
   STRATEGIC   SCOPE │  or Southwest Airlines)   │  or Singapore Airlines)   │
                     ├───────────────────────────┼───────────────────────────┤
              NARROW │       COST FOCUS          │   DIFFERENTIATION FOCUS   │
                     │  Cost advantage in tightly│  Elite customized product │
                     │  targeted niche segment   │  for luxury / specialist  │
                     │  (e.g. regional discounter│  niche (e.g. Ferrari)     │
                     └───────────────────────────┴───────────────────────────┘
                     WARNING: Avoid "Stuck in the Middle" (no clear advantage).`
  },

  // --- PRODMAN: Product Strategy & Prioritization ---
  circles: {
    title: "CIRCLES Method (Product Design)",
    ascii: `   ┌───┬─────────────────────────────────────────────────────────┐
   │ C │ Comprehend Situation (Context, business goal, bounds)   │
   ├───┼─────────────────────────────────────────────────────────┤
   │ I │ Identify Customer (User personas, needs, demographics)  │
   ├───┼─────────────────────────────────────────────────────────┤
   │ R │ Report Needs (Customer journeys & key friction points)  │
   ├───┼─────────────────────────────────────────────────────────┤
   │ C │ Cut & Prioritize (Select #1 highest ROI user pain)      │
   ├───┼─────────────────────────────────────────────────────────┤
   │ L │ List Solutions (Brainstorm at least 3 distinct options) │
   ├───┼─────────────────────────────────────────────────────────┤
   │ E │ Evaluate Tradeoffs (Pros, cons, feasibility, impact)    │
   ├───┼─────────────────────────────────────────────────────────┤
   │ S │ Summarize (Final recommendation, metrics, risks)        │
   └───┴─────────────────────────────────────────────────────────┘`
  },

  jtbd: {
    title: "Jobs To Be Done (JTBD) — The Four Forces of Progress",
    ascii: `            FORCES PROMOTING CHANGE           │          FORCES BLOCKING CHANGE
                                              │
                     PUSH                     │                    HABIT
      ┌────────────────────────────────┐      │      ┌────────────────────────────────┐
      │ Problems & frustrations with   │      │      │ Comfort with current workflow  │
      │ current existing solution      │      │      │ and allegiance to old behavior │
      └──────────────┬─────────────────┘      │      └────────────────┬───────────────┘
                     │                        │                       │
                     ▼                        │                       ▼
   ═══════════════════════════════════════════╪═══════════════════════════════════════════
                     ▲                        │                       ▲
                     │                        │                       │
      ┌──────────────┴─────────────────┐      │      ┌────────────────┴───────────────┐
      │ Attractiveness & appeal of the │      │      │ Fear of the unknown, switching │
      │ new product / imagined future  │      │      │ costs & onboarding friction    │
      └────────────────────────────────┘      │      └────────────────────────────────┘
                     PULL                     │                   ANXIETY
                                              │
   DECISION THRESHOLD: [ Push + Pull ]  >  [ Habit + Anxiety ]  ──►  User Adopts New Product`
  },

  north_star: {
    title: "North Star Metric & Input Driver Tree",
    ascii: `                           ┌───────────────────────────┐
                           │     NORTH STAR METRIC     │
                           │   (Core Value Delivery)   │
                           └─────────────┬─────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
          ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
          │   BREADTH   │         │    DEPTH    │         │  FREQUENCY  │
          │(Active Users│         │(Engagement/ │         │(Days Active │
          │  per Month) │         │ Time Spent) │         │  per Week)  │
          └──────┬──────┘         └──────┬──────┘         └──────┬──────┘
                 │                       │                       │
        ┌────────┴────────┐     ┌────────┴────────┐     ┌────────┴────────┐
        ▼                 ▼     ▼                 ▼     ▼                 ▼
   Acquisition       Onboarding Features used   Session Retargeting   Workflow
   Velocity          Success    per session     Length  Notifications triggers`
  },

  rice: {
    title: "RICE Prioritization Framework",
    ascii: `   ┌─────────────────────────────────────────────────────────────┐
   │              Reach × Impact × Confidence                    │
   │   RICE = ──────────────────────────────────                 │
   │                         Effort                              │
   └─────────────────────────────────────────────────────────────┘
     • Reach:      Users affected per time period (e.g. 10,000 users/month)
     • Impact:     Massive (3x), High (2x), Medium (1x), Low (0.5x), Minimal (0.25x)
     • Confidence: High (100%), Medium (80%), Low (50%)
     • Effort:     Person-months or sprints required (e.g. 2 months)`
  },

  ice: {
    title: "ICE Prioritization Scoring Matrix",
    ascii: `   ┌─────────────────────────────────────────────────────────────┐
   │            Impact  ×  Confidence  ×  Ease                   │
   │   ICE  =  ────────────────────────────────                   │
   │                          1                                  │
   └─────────────────────────────────────────────────────────────┘
     • Impact:     How much will this move the key metric? (Score 1-10)
     • Confidence: How sure are we of this impact?        (Score 1-10)
     • Ease:       How fast/cheap is this to implement?   (Score 1-10)
     ─────────────────────────────────────────────────────────────
     Total Score range: 1 to 1,000  (Sort descending to prioritize)`
  },

  kano: {
    title: "Kano Customer Satisfaction Feature Model",
    ascii: `   Customer
   Satisfaction
        ▲
        │                                 DELIGHTERS (Attractive)
   HIGH │                              ┌─────────────────────────►
        │                       ┌──────┘
        │                ┌──────┘         PERFORMANCE (Linear)
        │         ┌──────┘             ┌─────────────────────────►
        │  ┌──────┘             ┌──────┘
   NEUT ┼──┴────────────────────┴────────────────────────────────► Feature Execution
        │               ┌──────┘
        │        ┌──────┘                 MUST-HAVES (Basic Threshold)
        │ ┌──────┘                     ┌─────────────────────────►
    LOW │─┘
        ▼
   RULE OF THUMB: Must-haves cause dissatisfaction if broken; Delighters create loyalty!`
  },

  heart: {
    title: "Google HEART UX Metrics Framework",
    ascii: ` ┌────────────────┬──────────────────────┬──────────────────────┬──────────────────────┐
 │ CATEGORY       │ GOAL                 │ SIGNAL               │ METRIC               │
 ├────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
 │ HAPPINESS      │ Users love product   │ High satisfaction    │ NPS, CSAT, ratings   │
 ├────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
 │ ENGAGEMENT     │ Regular interaction  │ Active daily usage   │ Sessions/wk, visits  │
 ├────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
 │ ADOPTION       │ New user acquisition │ Signups & first use  │ Activation rate, d0  │
 ├────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
 │ RETENTION      │ Users stick around   │ Repeat active return │ D7/D30 cohort retain │
 ├────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
 │ TASK SUCCESS   │ Fast & error-free    │ Completing workflows │ Completion %, errors │
 └────────────────┴──────────────────────┴──────────────────────┴──────────────────────┘`
  },

  // --- MARKETING:SALES ---
  "4ps": {
    title: "4Ps of Marketing (Marketing Mix)",
    ascii: `   PRODUCT                              PRICE
   ┌───────────────────────────────┐    ┌───────────────────────────────┐
   │ • Features, quality, branding │    │ • Cost-plus vs value pricing  │
   │ • Packaging & product line    │    │ • Discounts, bundles, credit  │
   │ • Core value proposition      │    │ • Price elasticity & margins  │
   └───────────────────────────────┘    └───────────────────────────────┘
   PLACE                                PROMOTION
   ┌───────────────────────────────┐    ┌───────────────────────────────┐
   │ • Direct vs retail vs online  │    │ • Paid ads, PR, word-of-mouth │
   │ • Supply chain & distribution │    │ • Sales incentives & promos   │
   │ • Geographic availability     │    │ • Social, content, influencer │
   └───────────────────────────────┘    └───────────────────────────────┘`
  },

  stp: {
    title: "STP Framework (Segmentation, Targeting, Positioning)",
    ascii: `   1. SEGMENTATION                2. TARGETING                   3. POSITIONING
   ┌───────────────────────────┐  ┌───────────────────────────┐  ┌───────────────────────────┐
   │ Divide market into groups:│  │ Select attractive segment:│  │ Craft perception in mind: │
   │ • Demographics (Age/Inc)  │─►│ • Segment size & growth   │─►│ • Value proposition matrix│
   │ • Psychographics (Values) │  │ • Competitor saturation   │  │ • Perceptual positioning  │
   │ • Behavioral (Usage/LTV)  │  │ • Margin & willingness    │  │ • Differentiating moats   │
   │ • Geographic clusters     │  │ • Company capability fit  │  │ • Messaging & brand image │
   └───────────────────────────┘  └───────────────────────────┘  └───────────────────────────┘`
  },

  gtm: {
    title: "Go-to-Market (GTM) Strategic Engine",
    ascii: ` ┌───────────────────────────┬───────────────────────────┬───────────────────────────┐
 │ IDEAL CUSTOMER PROFILE    │ VALUE PROPOSITION         │ DISTRIBUTION & SALES      │
 │ • Target persona & buyer  │ • Primary pain points     │ • Product-Led (PLG) vs    │
 │ • Company size / vertical │ • Quantifiable ROI        │   Sales-Led (SLG) motion  │
 │ • Tech stack requirements │ • Messaging & positioning │ • Inbound vs Direct Outbd │
 ├───────────────────────────┴───────────────────────────┴───────────────────────────┤
 │ PRICING, PACKAGING & UNIT ECONOMICS                                               │
 │ • Freemium vs Tiered SaaS vs Usage-based  ·  Target LTV:CAC > 3x  ·  Payback < 12m│
 └───────────────────────────────────────────────────────────────────────────────────┘`
  },

  bcg: {
    title: "BCG Growth-Share Matrix (Portfolio Strategy)",
    ascii: `                 Relative Market Share
                    HIGH                  LOW
             ┌─────────────────────┬─────────────────────┐
             │       STARS         │   QUESTION MARKS    │
        HIGH │ • High Growth       │ • High Growth       │
             │ • High Investment   │ • Low Share         │
Market       │ • Future Cash Cows  │ • Invest or Discard │
Growth       ├─────────────────────┼─────────────────────┤
             │     CASH COWS       │        DOGS         │
         LOW │ • Low Growth        │ • Low Growth        │
             │ • High Cash Flow    │ • Low Cash Flow     │
             │ • Fund other units  │ • Divest/Liquidate  │
             └─────────────────────┴─────────────────────┘`
  },

  ansoff: {
    title: "Ansoff Growth Matrix",
    ascii: `                     Products / Services
                     EXISTING                   NEW
             ┌──────────────────────┬──────────────────────┐
    EXISTING │  MARKET PENETRATION  │ PRODUCT DEVELOPMENT  │
             │ • Increase share     │ • New products       │
             │ • Existing customers │ • Existing market    │
Markets      ├──────────────────────┼──────────────────────┤
             │  MARKET DEVELOPMENT  │   DIVERSIFICATION    │
         NEW │ • New geographies    │ • New products       │
             │ • New demographics   │ • New markets        │
             │ • Existing products  │ • Highest risk       │
             └──────────────────────┴──────────────────────┘`
  },

  plc: {
    title: "Product Life Cycle (PLC) Strategic Curve",
    ascii: `   Sales /
   Profits
     ▲                                   ┌──────────────┐
     │                                   │   MATURITY   │
     │                      ┌────────────┘              └────────────┐
     │                      │ (Peak Sales / Cash Cow)                │  DECLINE
     │                 ┌────┘                                        └──────────►
     │                 │   GROWTH
     │            ┌────┘ (Rapid Adoption)
     │   INTRO    │
     │ (R&D Burn) │
   ──┼────────────┴─────────────────────────────────────────────────────────────► Time
     │
     STRATEGY BY STAGE:
     • Introduction: Heavy awareness marketing, education, negative cash flow.
     • Growth: Scale distribution, defend brand share, optimize unit economics.
     • Maturity: Defend market share, maximize cash flow margins, bundle offerings.
     • Decline: Harvest profits, cut unprofitable SKUs, or sunset/divest.`
  },

  aida: {
    title: "AIDA Conversion Funnel",
    ascii: `   ┌──────────────────────────────────────────────┐
   │ A │ Attention (Reach, impressions, awareness) │
   └───┴──────────────────────┬───────────────────┘
                              ▼
         ┌──────────────────────────────────────┐
         │ I │ Interest (Engagement, clicks)    │
         └───┴────────────────┬─────────────────┘
                              ▼
                   ┌──────────────────────────┐
                   │ D │ Desire (Intent, demo)│
                   └───┴──────────┬───────────┘
                                  ▼
                             ┌──────────┐
                             │ A│ Action│ (Purchase)
                             └──┴───────┘`
  },

  unit_economics: {
    title: "CAC vs. LTV Sustainable Unit Economics Engine",
    ascii: `   CUSTOMER ACQUISITION COST (CAC)             CUSTOMER LIFETIME VALUE (LTV)
   ┌─────────────────────────────────┐         ┌─────────────────────────────────┐
   │ Total Sales & Marketing Spend   │         │  (Monthly ARPU × Gross Margin)  │
   │ ─────────────────────────────── │         │  ─────────────────────────────  │
   │   New Customers Acquired        │         │           Churn Rate            │
   └────────────────┬────────────────┘         └────────────────┬────────────────┘
                    │                                           │
                    └─────────────────────┬─────────────────────┘
                                          ▼
   THE GOLDEN UNIT ECONOMICS RATIO:
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │  LTV : CAC  ≥  3.0x   (Sustained profitable growth)                         │
   │  CAC PAYBACK PERIOD    < 12 Months (Capital-efficient runway recovery)      │
   └─────────────────────────────────────────────────────────────────────────────┘`
  },

  // --- HR & ORGANIZATION ---
  "7s": {
    title: "McKinsey 7S Framework (Organizational Alignment)",
    ascii: `                         ┌───────────────┐
                         │   STRATEGY    │
                         └───────┬───────┘
                                 │
                 ┌───────────────┼───────────────┐
                 ▼               ▼               ▼
         ┌───────────────┐┌───────────────┐┌───────────────┐
         │   STRUCTURE   ││ SHARED VALUES││    SYSTEMS    │
         │  (Hierarchy)  ││ (Culture/DNA)││  (Workflows)  │
         └───────┬───────┘└───────┬───────┘└───────┬───────┘
                 │                │                │
                 ├────────────────┴────────────────┤
                 ▼               ▼                 ▼
         ┌───────────────┐┌───────────────┐┌───────────────┐
         │     STYLE     ││     STAFF     ││    SKILLS     │
         │ (Leadership)  ││ (People/HR)   ││(Capabilities) │
         └───────────────┘└───────────────┘└───────────────┘`
  },

  nine_box: {
    title: "9-Box Talent Review & Succession Matrix",
    ascii: `                  POTENTIAL ──►
                   LOW                    MEDIUM                 HIGH
            ┌──────────────────────┬──────────────────────┬──────────────────────┐
       HIGH │      WORKHORSE       │     HIGH IMPACT      │     FUTURE STAR      │
            │ Solid performer,     │ Strong execution,    │ Prime for promotion, │
            │ low ceiling for promo│ expand leadership    │ top succession pick  │
   P        ├──────────────────────┼──────────────────────┼──────────────────────┤
   E    MED │      EFFECTIVE       │     CORE PLAYER      │    GROWTH TALENT     │
   R        │ Meets expectations,  │ Reliable contributor,│ High upside, needs   │
   F        │ steady performer     │ coach for depth      │ stretch assignments  │
   O        ├──────────────────────┼──────────────────────┼──────────────────────┤
   R    LOW │     UNDERPERFORMER   │      DILEMMA         │     ENIGMA / RISK    │
   M        │ Action plan required │ Inconsistent output, │ Brilliant but misfit │
            │ or transition out    │ needs performance PIP│ or wrong role fit    │
            └──────────────────────┴──────────────────────┴──────────────────────┘`
  },

  okr: {
    title: "OKR (Objectives & Key Results) Cascade Engine",
    ascii: `                         ┌─────────────────────────────────────────┐
                         │           COMPANY OBJECTIVE             │
                         │   (Inspiring, qualitative milestone)    │
                         └────────────────────┬────────────────────┘
                                              │
                      ┌───────────────────────┼───────────────────────┐
                      ▼                       ▼                       ▼
               ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
               │KEY RESULT 1 │         │KEY RESULT 2 │         │KEY RESULT 3 │
               │(Measurable) │         │(Measurable) │         │(Measurable) │
               └──────┬──────┘         └──────┬──────┘         └──────┬──────┘
                      │                       │                       │
                      ▼                       ▼                       ▼
               Department OKRs         Department OKRs         Department OKRs
               & Team Cascades         & Team Cascades         & Team Cascades

   CRITICAL OKR RULES:
   • 3 to 5 Key Results per Objective — strictly quantitative and outcome-oriented.
   • Target 70% achievement rate (stretch goals: 100% means bar was set too low).`
  },

  // --- CONSULTING EXTENSIONS ---
  market_entry: {
    title: "Market Entry Decision & Execution Architecture",
    ascii: `                         ┌─────────────────────────────────────────┐
                         │          MARKET ENTRY DECISION          │
                         │    "Should our client enter Market X?"  │
                         └────────────────────┬────────────────────┘
                                              │
         ┌───────────────────┬────────────────┴───────────────────┬───────────────────┐
         ▼                   ▼                                    ▼                   ▼
  ┌──────────────┐    ┌──────────────┐                     ┌──────────────┐    ┌──────────────┐
  │ 1. MARKET    │    │2. COMPETITION│                     │3. CAPABILITY │    │4. FINANCIALS │
  │ATTRACTIVENESS│    │  LANDSCAPE   │                     │  & SYNERGIES │    │  & EXECUTION │
  ├──────────────┤    ├──────────────┤                     ├──────────────┤    ├──────────────┤
  │• Market size │    │• Fragmentation│                    │• Brand fit   │    │• Capital req.│
  │• Growth CAGR │    │• Incumbent MS│                     │• Dist. power │    │• Payback ROI │
  │• Margins %   │    │• Barriers    │                     │• Supply chain│    │• Breakeven   │
  └──────────────┘    └──────────────┘                     └──────────────┘    └──────┬───────┘
                                                                                      │
                                                           ┌──────────────────────────┴────────┐
                                                           ▼                                   ▼
                                                    MODE OF ENTRY:                     Timing & Phasing:
                                                    • Build (Organic R&D)              • Wave 1: Pilot
                                                    • Buy (M&A / Acquisition)          • Wave 2: Scale
                                                    • Partner (Joint Venture/License)  • Wave 3: Dominate`
  },

  synergy: {
    title: "M&A Value Creation & Synergy Waterfall",
    ascii: `                            ┌───────────────────────────┐
                            │    TOTAL M&A SYNERGIES    │
                            └─────────────┬─────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
   ┌─────────────────────────────┐                 ┌─────────────────────────────┐
   │       COST SYNERGIES        │                 │      REVENUE SYNERGIES      │
   │       ("Hard" - ~80% Real)  │                 │     ("Soft" - High Risk)    │
   ├─────────────────────────────┤                 ├─────────────────────────────┤
   │ • Eliminate duplicate SG&A  │                 │ • Cross-selling products to │
   │ • Consolidate headquarters  │                 │   combined customer bases   │
   │ • Bulk procurement scale    │                 │ • Expand into target's geos │
   │ • Manufacturing plant merge │                 │ • Product bundling & upsell │
   │ • Supply chain optimization │                 │ • Pricing power enhancements│
   └─────────────────────────────┘                 └─────────────────────────────┘
                  │                                               │
                  └───────────────────────┬───────────────────────┘
                                          ▼
                         NET VALUE CREATED BY TRANSACTION:
         [ PV(Cost Synergies) + PV(Revenue Synergies) ]  -  [ Acquisition Premium Paid ]`
  },

  "value chain": {
    title: "Porter's Value Chain Model",
    ascii: ` ┌──────────────────────────────────────────────────────────────────┐
 │ SUPPORT ACTIVITIES                                               │
 │ • Firm Infrastructure (Finance, Planning, Legal)                 │
 │ • Human Resource Management (Recruiting, Training, Comp)         │
 │ • Technology Development (R&D, Product/Process Design, IT)       │
 │ • Procurement (Vendor selection, Supply contracts)               │
 ├──────────────────────────────────────────────────────────────────┤
 │ PRIMARY ACTIVITIES                                               │
 │ Inbound  ──► Operations ──► Outbound ──► Marketing ──► Service   │
 │ Logistics                   Logistics     & Sales                │
 └──────────────────────────────────────────────────────────────────┘
                 ════════════════════════════════════►  MARGIN`
  }
};

/**
 * Finds an ASCII diagram by framework name or keyword match.
 */
export function getAsciiDiagramForFramework(frameworkName: string): { title: string; ascii: string } | null {
  const norm = frameworkName.toLowerCase().replace(/[^a-z0-9]/g, " ");

  // Consulting & Case Structuring
  if (norm.includes("profit") || (norm.includes("revenue") && norm.includes("cost"))) {
    return FRAMEWORK_ASCII_MAP.profitability;
  }
  if (norm.includes("mece")) return FRAMEWORK_ASCII_MAP.mece;
  if (norm.includes("3c")) return FRAMEWORK_ASCII_MAP["3cs"];
  if (norm.includes("sizing") || norm.includes("top down") || norm.includes("bottom up")) {
    return FRAMEWORK_ASCII_MAP["market sizing"];
  }
  if (norm.includes("porter") && (norm.includes("5") || norm.includes("five"))) {
    return FRAMEWORK_ASCII_MAP.porter;
  }
  if (norm.includes("market entry")) return FRAMEWORK_ASCII_MAP.market_entry;
  if (norm.includes("synergy")) return FRAMEWORK_ASCII_MAP.synergy;
  if (norm.includes("value chain")) return FRAMEWORK_ASCII_MAP["value chain"];

  // Finance & Accounting
  if (norm.includes("lbo") || norm.includes("leveraged buyout")) return FRAMEWORK_ASCII_MAP.lbo;
  if (norm.includes("enterprise value") || norm.includes("equity value") || (norm.includes("ev") && norm.includes("bridge"))) {
    return FRAMEWORK_ASCII_MAP.ev_bridge;
  }
  if (norm.includes("beta") || norm.includes("capm")) return FRAMEWORK_ASCII_MAP.capm;
  if (norm.includes("wacc") || norm.includes("cost of capital")) return FRAMEWORK_ASCII_MAP.wacc;
  if (norm.includes("terminal value") || norm.includes("gordon growth") || norm.includes("perpetuity")) {
    return FRAMEWORK_ASCII_MAP.terminal_value;
  }
  if (norm.includes("income statement") || norm.includes("waterfall") || norm.includes("p l") || norm.includes("profit and loss")) {
    return FRAMEWORK_ASCII_MAP.income_statement;
  }
  if (norm.includes("3 statement") || norm.includes("three statement") || norm.includes("financial statement")) {
    return FRAMEWORK_ASCII_MAP.three_statements;
  }
  if (norm.includes("working capital") || norm.includes("cash conversion") || norm.includes("ccc")) {
    return FRAMEWORK_ASCII_MAP.working_capital;
  }
  if (norm.includes("comparable") || norm.includes("comp") || norm.includes("multiple")) {
    return FRAMEWORK_ASCII_MAP.comps;
  }
  if (norm.includes("dcf") || norm.includes("discounted cash flow") || norm.includes("valuation")) {
    return FRAMEWORK_ASCII_MAP.dcf;
  }

  // Prodman
  if (norm.includes("circle")) return FRAMEWORK_ASCII_MAP.circles;
  if (norm.includes("jtbd") || norm.includes("jobs to be done")) return FRAMEWORK_ASCII_MAP.jtbd;
  if (norm.includes("north star")) return FRAMEWORK_ASCII_MAP.north_star;
  if (norm.includes("rice")) return FRAMEWORK_ASCII_MAP.rice;
  if (norm.includes("ice score") || (norm.includes("ice") && !norm.includes("rice") && !norm.includes("price"))) {
    return FRAMEWORK_ASCII_MAP.ice;
  }
  if (norm.includes("kano")) return FRAMEWORK_ASCII_MAP.kano;
  if (norm.includes("heart")) return FRAMEWORK_ASCII_MAP.heart;

  // Marketing & Sales
  if (norm.includes("4p") || norm.includes("marketing mix")) return FRAMEWORK_ASCII_MAP["4ps"];
  if (norm.includes("stp") || norm.includes("segmentation")) return FRAMEWORK_ASCII_MAP.stp;
  if (norm.includes("gtm") || norm.includes("go to market")) return FRAMEWORK_ASCII_MAP.gtm;
  if (norm.includes("bcg") || norm.includes("growth share")) return FRAMEWORK_ASCII_MAP.bcg;
  if (norm.includes("ansoff")) return FRAMEWORK_ASCII_MAP.ansoff;
  if (norm.includes("product life cycle") || norm.includes("plc")) return FRAMEWORK_ASCII_MAP.plc;
  if (norm.includes("aida") || norm.includes("funnel") || norm.includes("aarm")) return FRAMEWORK_ASCII_MAP.aida;
  if (norm.includes("cac") || norm.includes("ltv") || norm.includes("unit economics")) {
    return FRAMEWORK_ASCII_MAP.unit_economics;
  }

  // General Management & HR
  if (norm.includes("business model") || norm.includes("canvas") || norm.includes("bmc")) {
    return FRAMEWORK_ASCII_MAP.bmc;
  }
  if (norm.includes("blue ocean") || norm.includes("four action") || norm.includes("errc")) {
    return FRAMEWORK_ASCII_MAP.blue_ocean;
  }
  if (norm.includes("star") && !norm.includes("north star")) return FRAMEWORK_ASCII_MAP.star;
  if (norm.includes("swot")) return FRAMEWORK_ASCII_MAP.swot;
  if (norm.includes("pestel") || norm.includes("pest")) return FRAMEWORK_ASCII_MAP.pestel;
  if (norm.includes("generic strateg")) return FRAMEWORK_ASCII_MAP.generic_strategies;
  if (norm.includes("7s") || norm.includes("mckinsey")) return FRAMEWORK_ASCII_MAP["7s"];
  if (norm.includes("9 box") || norm.includes("nine box")) return FRAMEWORK_ASCII_MAP.nine_box;
  if (norm.includes("okr")) return FRAMEWORK_ASCII_MAP.okr;

  return null;
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

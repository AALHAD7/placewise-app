# The Finance Domain Compendium

**A knowledge base for finance, fintech, consulting and product interviews, built for retrieval (RAG) in Placewise.**

Version 1.0 · October 2026 · 26 modules · 208 topics · 360 glossary terms · 150 interview Q&As

## How this compendium is built

- **Scope:** financial foundations, accounting, financial statement analysis, reporting standards, audit, cost accounting, corporate and strategic finance, valuation, financial modelling, M&A, investment banking, private equity and venture capital, equity markets, fixed income, derivatives, portfolio management, banking and credit, risk management, fintech and payments, international finance, taxation, regulators and macroeconomics.
- **India first:** Indian rules, institutions and examples (Ind AS, Companies Act 2013, SEBI, RBI, NPCI, Income-tax Act) come first, with global equivalents noted.
- **Worked examples:** every example uses hypothetical companies and numbers, and every calculation was recomputed in code before inclusion.
- **Accuracy flags:** anything that changes over time (rates, thresholds, limits, deadlines, regulations, market data) is tagged **[VERIFY: source]**. All flags are collected in the Appendix register. Knowledge reflects the position as of mid-2026; verify against primary sources before using a flagged fact in a live answer.
- **Not advice:** this is educational material, not legal, tax or investment advice.

## How to use it for retrieval (RAG)

- **Chunk on H3 headings.** Each `### [Module.Topic] Title` section is self-contained (600–1,500 words) and follows the same template: Definition → Why it matters → Core mechanics → Worked example → Indian context → Common mistakes → Interview angle → Related topics.
- **Metadata:** the HTML comment directly under each H3 (`<!-- tags: domain=...; level=...; roles=...; keywords=... -->`) is designed to be parsed into chunk metadata for filtering by domain, difficulty level and target role (IB, PE, ER, CF, Audit, Fintech-PM, Consulting).
- **Cross-references:** `[Module.Topic]` IDs link related chunks; resolve them to follow-up retrievals.
- **Glossaries and quizzes:** each module ends with a 15-term glossary, a 10-question quiz and its [VERIFY] list; Module 26 holds the A–Z master glossary and a 150-question interview bank.

## Conventions

- ₹ Cr = crore (10 million rupees); ₹ lakh = 100,000 rupees. Indian digit grouping is used (₹1,00,000).
- Formulas are written in plain text, e.g., WACC = E/V × Re + D/V × Rd × (1 − t).
- Percentages and rates are annual unless stated.

## Contents

**Module 1: Financial Foundations**

- [1.1] Time Value of Money (TVM): Present and Future Value
- [1.2] Compounding Frequency, Effective Rates and Real vs Nominal Returns
- [1.3] Annuities, Perpetuities, EMIs and SIPs
- [1.4] Net Present Value (NPV)
- [1.5] IRR, MIRR, Payback and Their Pitfalls
- [1.6] Risk and Return: Expected Return, Volatility and Diversification
- [1.7] Opportunity Cost, Incremental Cash Flows and the Cost of Capital

**Module 2: Financial Accounting**

- [2.1] The Conceptual Framework: Why Accounts Look the Way They Do
- [2.2] Double-Entry Bookkeeping and the Accounting Cycle
- [2.3] Accruals, Deferrals, Provisions and Contingencies
- [2.4] Revenue Recognition: Ind AS 115 / IFRS 15 Five-Step Model
- [2.5] Inventory Accounting: Ind AS 2, Cost Formulas and Net Realisable Value
- [2.6] Property, Plant and Equipment, Depreciation and Impairment
- [2.7] Intangible Assets, Goodwill and Business Combinations
- [2.8] Lease Accounting: Ind AS 116 / IFRS 16
- [2.9] Income Taxes and Deferred Tax: Ind AS 12
- [2.10] Financial Instruments: Classification, Measurement and Expected Credit Loss (Ind AS 109 / 32 / 107)
- [2.11] Share-Based Payments (ESOPs): Ind AS 102
- [2.12] Earnings Per Share (Ind AS 33) and Equity Transactions
- [2.13] Foreign Currency Transactions and Hyperinflation Basics (Ind AS 21)

**Module 3: The Three Financial Statements**

- [3.1] The Income Statement (Statement of Profit and Loss)
- [3.2] The Balance Sheet
- [3.3] The Cash Flow Statement (Ind AS 7)
- [3.4] How the Three Statements Link Together
- [3.5] Three-Statement Scenarios: Interview Drills
- [3.6] Working Capital and the Cash Conversion Cycle
- [3.7] Statement of Changes in Equity and Notes to Accounts

**Module 4: Financial Statement Analysis**

- [4.1] A Framework for Analysing Financial Statements
- [4.2] Common-Size and Trend Analysis
- [4.3] Profitability and Return Ratios
- [4.4] Liquidity Ratios
- [4.5] Solvency and Leverage Ratios
- [4.6] Efficiency (Turnover) Ratios
- [4.7] DuPont Analysis (3-Step and 5-Step)
- [4.8] Cash Flow Analysis and Free Cash Flow Quality
- [4.9] Quality of Earnings and Red Flags
- [4.10] Forensic Scoring Models: Beneish M-Score, Altman Z-Score, Piotroski F-Score
- [4.11] Sector-Specific Metrics: Banks, SaaS, Fintech, Retail, Telecom
- [4.12] Market-Based Ratios and Shareholder Returns

**Module 5: Financial Reporting and Accounting Standards**

- [5.1] The Global Standards Landscape: Ind AS, AS, IFRS and US GAAP
- [5.2] Key Differences: Ind AS / IFRS vs US GAAP vs Indian GAAP
- [5.3] Consolidation, Associates and Joint Arrangements (Ind AS 110, 111, 28)
- [5.4] Anatomy of an Indian Annual Report
- [5.5] Segment Reporting (Ind AS 108) and Interim Reporting (Ind AS 34)
- [5.6] Fair Value Measurement (Ind AS 113) and the Fair Value Hierarchy
- [5.7] Sustainability and ESG Reporting: BRSR, ISSB and Assurance

**Module 6: Audit and Assurance**

- [6.1] What an Audit Is and the Types of Audit
- [6.2] The Risk-Based Audit Process
- [6.3] Materiality (SA 320)
- [6.4] The Audit Risk Model
- [6.5] Internal Controls: COSO, IFC and SOX
- [6.6] Audit Evidence, Sampling and Data Analytics
- [6.7] The Auditor's Report: Opinions, KAMs and Going Concern
- [6.8] CARO 2020 and Other Indian Statutory Reporting
- [6.9] Auditor Independence, Rotation and Regulation (NFRA, ICAI, PCAOB)
- [6.10] Fraud, Forensic Audit and Professional Scepticism

**Module 7: Cost and Management Accounting**

- [7.1] Cost Concepts and Classification
- [7.2] Costing Methods: Job, Process and Activity-Based Costing
- [7.3] Marginal (Variable) Costing vs Absorption Costing
- [7.4] Cost-Volume-Profit Analysis, Break-Even and Operating Leverage
- [7.5] Budgeting and Planning Systems
- [7.6] Standard Costing and Variance Analysis
- [7.7] Relevant Costing for Decisions: Make or Buy, Special Orders, Shutdown
- [7.8] Transfer Pricing: Internal and Tax Perspectives

**Module 8: Corporate Finance**

- [8.1] The Goal of the Firm, Agency Problems and Corporate Governance
- [8.2] Capital Budgeting: Estimating Project Cash Flows
- [8.3] Capital Budgeting under Uncertainty: Sensitivity, Scenarios, Simulation and Real Options
- [8.4] Cost of Equity: CAPM, Beta Estimation and Levering/Unlevering
- [8.5] Cost of Debt and WACC in Practice
- [8.6] Capital Structure Theory: Modigliani-Miller, Trade-Off and Pecking Order
- [8.7] Operating, Financial and Combined Leverage; EBIT-EPS Analysis
- [8.8] Payout Policy: Dividends and Buybacks
- [8.9] Working Capital Management and Short-Term Finance
- [8.10] Sources of Finance: Equity, Debt and Hybrid Instruments in India

**Module 9: Business and Strategic Finance**

- [9.1] Financial Planning and Analysis (FP&A): Budgeting, Forecasting and Performance Management
- [9.2] Unit Economics: Contribution Margin, CAC, LTV and Payback
- [9.3] Value Drivers: ROIC, Growth, Economic Value Added and the Value Driver Formula
- [9.4] Pricing and Profitability Analysis: Price-Volume-Mix and Elasticity
- [9.5] Finance for Strategic Decisions: Business Cases, Build-Buy-Partner and Capital Allocation
- [9.6] Startup and Platform Finance Metrics

**Module 10: Valuation**

- [10.1] Valuation Approaches: An Overview
- [10.2] Discounted Cash Flow: Building FCFF and Discounting
- [10.3] Terminal Value: Gordon Growth, Exit Multiples and Consistency Checks
- [10.4] FCFE, Dividend Discount and Residual Income Models
- [10.5] From Enterprise Value to Equity Value: The Bridge and Diluted Shares
- [10.6] Trading Comparables (Comps)
- [10.7] Precedent Transactions
- [10.8] Valuing Startups and Early-Stage Companies
- [10.9] Sum-of-the-Parts (SOTP) and Holding Company Discounts
- [10.10] Valuing Financial Institutions and Special Situations
- [10.11] Choosing and Justifying Multiples
- [10.12] Football Field, Triangulation and Common Valuation Interview Questions

**Module 11: Financial Modelling**

- [11.1] Model Architecture and Best Practices
- [11.2] Forecasting Revenue and Costs with Drivers
- [11.3] Building an Integrated Three-Statement Model
- [11.4] Debt Schedules, Interest Circularity and Cash Sweeps
- [11.5] Scenarios, Sensitivities and Data Tables
- [11.6] Model Integrity: Checks, Error-Proofing and Essential Excel Functions

**Module 12: Mergers and Acquisitions**

- [12.1] M&A Rationale, Deal Types and Value Creation Logic
- [12.2] Valuing Synergies
- [12.3] Accretion/Dilution Analysis
- [12.4] Deal Structuring: Consideration, Form of Transaction and Key Terms
- [12.5] Due Diligence
- [12.6] The Indian M&A Regulatory Framework: SEBI SAST, CCI, NCLT, FEMA and Delisting
- [12.7] Post-Merger Integration and Why Deals Fail
- [12.8] Defences, Hostile Bids, Demergers and Divestitures
- [12.9] Approaching an M&A Case Interview

**Module 13: Investment Banking**

- [13.1] Structure of an Investment Bank and How It Makes Money
- [13.2] The M&A Advisory Process: Sell-Side and Buy-Side
- [13.3] Equity Capital Markets: The IPO Process in India
- [13.4] IPO Pricing, Book Building and After-Market Dynamics
- [13.5] Follow-On Equity: QIPs, Rights Issues, Preferential Allotments, OFS and Block Deals
- [13.6] Debt Capital Markets: Bonds, Loans and the Role of Ratings
- [13.7] Pitch Books, League Tables, Fees and the IB Interview

**Module 14: Private Equity and Venture Capital**

- [14.1] Fund Structure and Economics: GPs, LPs, Fees, Carry and Waterfalls
- [14.2] Leveraged Buyout (LBO) Mechanics: A Full Worked Example
- [14.3] PE Value Creation Levers and Returns Attribution
- [14.4] Venture Capital: Stages, Instruments and Term Sheets
- [14.5] Cap Tables, Dilution and the Option Pool Shuffle
- [14.6] Exits, Secondaries and the Indian PE/VC Landscape

**Module 15: Equity Markets**

- [15.1] Indian Equity Market Structure: Exchanges, Clearing, Depositories and Settlement
- [15.2] Market Participants and Flows: FPIs, DIIs, Retail and Mutual Funds
- [15.3] Stock Market Indices and Index Construction
- [15.4] Trading Mechanics: Orders, Margins, Short Selling and Circuit Limits
- [15.5] The Equity Research Process and Research Reports
- [15.6] Fundamental Analysis and Stock Screening
- [15.7] Technical Analysis Basics
- [15.8] Market Efficiency and Behavioural Finance
- [15.9] Mutual Funds, ETFs and Passive vs Active Investing

**Module 16: Fixed Income**

- [16.1] Bond Basics and Terminology
- [16.2] Bond Pricing and Yield Measures
- [16.3] Interest Rate Risk: Duration
- [16.4] Convexity and Measuring Bond Price Changes Accurately
- [16.5] The Yield Curve and Term Structure Theories
- [16.6] Credit Risk, Spreads and Credit Ratings
- [16.7] The Indian Debt Market: G-secs, T-bills, SDLs, Corporate Bonds and Money Markets
- [16.8] Other Fixed Income Instruments: Floaters, Zeros, Convertibles, Perpetuals and Securitisation
- [16.9] Debt Mutual Funds and Managing Fixed Income Portfolios

**Module 17: Derivatives**

- [17.1] Derivatives Overview: Forwards vs Futures
- [17.2] Futures Pricing: Cost of Carry, Basis and Margining
- [17.3] Options: Basics, Payoffs and Moneyness
- [17.4] Option Pricing: Put-Call Parity, Binomial Model and Black-Scholes
- [17.5] The Greeks: Delta, Gamma, Theta, Vega and Rho
- [17.6] Option Strategies
- [17.7] Swaps: Interest Rate and Currency Swaps
- [17.8] Equity Derivatives in India and Hedging Applications

**Module 18: Portfolio Management**

- [18.1] The Investment Process and the Investment Policy Statement
- [18.2] Modern Portfolio Theory and the Efficient Frontier
- [18.3] CAPM, the Capital Market Line and the Security Market Line
- [18.4] Multi-Factor Models, APT and Smart Beta
- [18.5] Asset Allocation and Rebalancing
- [18.6] Performance Measurement: Sharpe, Treynor, Jensen's Alpha, Information Ratio and Returns Calculation
- [18.7] Portfolio Construction, Risk Budgeting and Behavioural Pitfalls
- [18.8] Wealth Management, Advisory Models and Investment Products in India

**Module 19: Banking and Credit**

- [19.1] The Bank Business Model and Balance Sheet
- [19.2] Bank Profitability: NII, NIM, Cost-to-Income, RoA and RoE
- [19.3] Asset Quality: NPAs, Provisioning, Restructuring and Write-offs
- [19.4] Capital Adequacy: Basel III, CET1, AT1, Tier 2 and Risk-Weighted Assets
- [19.5] Credit Appraisal: Corporate, MSME and Retail Lending
- [19.6] Liquidity Regulation: CRR, SLR, LCR and NSFR
- [19.7] Asset-Liability Management (ALM) and Interest Rate Risk in the Banking Book
- [19.8] NBFCs, HFCs, MFIs and the Scale-Based Regulatory Framework
- [19.9] The Indian Banking Landscape, Recovery Mechanisms and the IBC

**Module 20: Risk Management**

- [20.1] Enterprise Risk Management: Frameworks, Risk Appetite and the Three Lines Model
- [20.2] Market Risk: Value at Risk, Expected Shortfall and Stress Testing
- [20.3] Credit Risk Measurement: PD, LGD, EAD, Expected and Unexpected Loss
- [20.4] Operational, Cyber, Fraud and Third-Party Risk
- [20.5] Liquidity Risk and Contingency Funding
- [20.6] Corporate Hedging: FX, Commodity and Interest Rate Risk
- [20.7] Stress Testing, Scenario Analysis and Model Risk

**Module 21: Fintech and Payments**

- [21.1] The Indian Fintech Landscape and How Fintechs Make Money
- [21.2] India's Payment Systems Architecture
- [21.3] UPI Deep Dive: Architecture, Products and Economics
- [21.4] The Cards Ecosystem: Four-Party Model, MDR and Interchange
- [21.5] Payment Aggregators, Gateways and Payment Orchestration
- [21.6] Digital Lending: Models, RBI Rules and Unit Economics
- [21.7] Digital Public Infrastructure: India Stack, Account Aggregators, ONDC, OCEN and ULI
- [21.8] Wealthtech and Broking Business Models
- [21.9] Credit Cards and Rewards Platforms, Neobanks, Insurtech and B2B Fintech
- [21.10] Fintech Regulation and Compliance: Licences, KYC/AML, Data Protection and Sandboxes
- [21.11] Fintech Metrics, Unit Economics and Approaching Fintech Case Interviews

**Module 22: International Finance**

- [22.1] The Foreign Exchange Market: Quotes, Cross Rates and the INR Market
- [22.2] Parity Conditions: Interest Rate Parity, PPP and the International Fisher Effect
- [22.3] Managing FX Risk: Exposures, Instruments and Hedge Choices
- [22.4] Balance of Payments, Capital Flows and Exchange Rate Drivers
- [22.5] FEMA and Cross-Border Investment Rules: FDI, ODI, ECB and LRS
- [22.6] International Capital Budgeting and Cross-Border Valuation
- [22.7] Trade Finance: Letters of Credit, Guarantees and Export Credit

**Module 23: Taxation for Finance Professionals**

- [23.1] Indian Direct Tax Overview: Corporate and Personal Taxation
- [23.2] Capital Gains Taxation on Securities and Other Assets
- [23.3] Taxation of Dividends, Buybacks, Interest and Withholding Taxes
- [23.4] Goods and Services Tax (GST) Fundamentals
- [23.5] Tax in Corporate Finance and Deals
- [23.6] International Taxation: DTAAs, Permanent Establishment, Transfer Pricing and Global Minimum Tax

**Module 24: Regulators and Institutions**

- [24.1] India's Financial Regulatory Architecture: Who Regulates What
- [24.2] The Reserve Bank of India: Functions, Instruments and Governance
- [24.3] SEBI: Mandate, Key Regulations and Enforcement
- [24.4] Insurance and Pension Regulation: IRDAI and PFRDA
- [24.5] Corporate, Audit, Competition and Insolvency Institutions: MCA, ICAI, NFRA, CCI, IBBI and IFSCA
- [24.6] Market Infrastructure Institutions and Financial Utilities
- [24.7] Global Institutions and Standard Setters

**Module 25: Macroeconomics for Finance**

- [25.1] GDP, National Accounts and Growth
- [25.2] Monetary Policy and Transmission
- [25.3] Inflation: Measures, Drivers and Effects on Finance
- [25.4] Fiscal Policy, Government Debt and the Bond Market
- [25.5] From Interest Rates to Valuations: How Macro Moves Asset Prices
- [25.6] Business Cycles, Leading Indicators and Reading Macro Data
- [25.7] Global Macro: The Dollar, Oil, the Fed and Spillovers to India

**Module 26: Master Glossary and Interview Bank**

**Appendix: Consolidated [VERIFY] Register**

---

# Module 1: Financial Foundations

## 1A. Time Value of Money

### [1.1] Time Value of Money (TVM): Present and Future Value
<!-- tags: domain=financial-foundations; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=time value of money, present value, future value, discount rate, compounding, discount factor -->

**Definition.** Time value of money is the principle that a rupee today is worth more than a rupee in the future, because today's rupee can be invested to earn a return, and because future cash is uncertain and eroded by inflation.

**Why it matters.** Every valuation, loan, investment decision and pricing model in finance moves cash flows across time. You cannot compare ₹100 received today with ₹120 received in three years without converting both to the same point in time. TVM is the conversion mechanism, and the discount rate is the "exchange rate" between time periods.

**Core mechanics.**
- Future value: FV = PV × (1 + r)^n
- Present value: PV = FV / (1 + r)^n
- Discount factor: DF = 1 / (1 + r)^n

Where PV = present value, FV = future value, r = rate of return per period, n = number of periods. The rate and the period must match: an annual rate needs years as periods; a monthly rate needs months.

Three forces sit inside the discount rate r:
1. **Pure time preference:** the reward for deferring consumption (the real risk-free rate).
2. **Inflation:** compensation for loss of purchasing power.
3. **Risk premium:** compensation for the chance that the cash flow does not arrive as promised.

**Worked example.** An investor deposits ₹1,00,000 at 8% per year, compounded annually, for 5 years.
- Growth factor: 1.08^5 = 1.469328
- FV = 1,00,000 × 1.469328 = **₹1,46,933**

Reverse it: what is ₹1,00,000 received in 5 years worth today at 8%?
- DF = 1 / 1.469328 = 0.680583
- PV = 1,00,000 × 0.680583 = **₹68,058**

**Indian context.** Indian fixed deposits, small savings schemes (PPF, NSC) and government bonds all quote annual rates, but compounding conventions differ by product. Bank FDs are commonly compounded quarterly [VERIFY: individual bank FD terms / RBI interest rate directions]. Always confirm compounding frequency before comparing products.

**Common mistakes.**
- Mixing an annual rate with monthly periods.
- Treating a higher absolute cash flow as better without discounting it.
- Using the same discount rate for a safe cash flow and a risky one.

**Interview angle.**
1. *Why is a rupee today worth more than a rupee tomorrow?* Because today's rupee can be invested to earn a return, it carries no uncertainty about receipt, and inflation erodes future purchasing power. The discount rate prices all three.
2. *What happens to PV if the discount rate rises?* PV falls, because each future cash flow is divided by a larger factor. Longer-dated cash flows fall the most, which is why long-duration assets (growth stocks, long bonds) are most sensitive to rate hikes.
3. *Would you take ₹1 lakh now or ₹1.4 lakh in 5 years?* It depends on my opportunity rate. At 8%, ₹1.4 lakh in 5 years is worth about ₹95,300 today, so I take ₹1 lakh now. Below roughly 6.96% (the break-even rate), I wait.

**Related topics:** [1.2] Compounding, [1.3] Annuities, [1.4] NPV, [10.1] Valuation.

---

### [1.2] Compounding Frequency, Effective Rates and Real vs Nominal Returns
<!-- tags: domain=financial-foundations; level=foundation; roles=CF,Fintech-PM,Consulting,ER; keywords=compounding frequency, effective annual rate, APR, continuous compounding, rule of 72, Fisher equation, real return -->

**Definition.** Compounding frequency is how often interest is added to principal. The effective annual rate (EAR) is the true annual return after compounding, as opposed to the stated (nominal) annual percentage rate (APR).

**Why it matters.** Two products quoting "12% per year" can deliver different returns if one compounds monthly and the other annually. Lending, credit cards, deposits and fintech products are frequently compared on headline rates; EAR is the only fair comparison. Separately, a 10% return in a 6% inflation economy is far less than it looks, which is what real returns capture.

**Core mechanics.**
- EAR = (1 + APR / m)^m − 1, where m = compounding periods per year
- Continuous compounding: EAR = e^APR − 1
- Rule of 72 (approximate doubling time): years ≈ 72 / rate in percent
- Fisher equation: (1 + nominal) = (1 + real) × (1 + inflation)
  - Real rate = (1 + nominal) / (1 + inflation) − 1
  - Approximation: real ≈ nominal − inflation (reasonable only at low rates)

**Worked example.** A stated rate of 12% per year:

| Compounding | Calculation | EAR |
|---|---|---|
| Annual | 1.12 − 1 | 12.00% |
| Quarterly | 1.03^4 − 1 | 12.55% |
| Monthly | 1.01^12 − 1 | 12.68% |
| Continuous | e^0.12 − 1 | 12.75% |

Rule of 72 at 8%: 72 / 8 = 9 years. Exact: ln 2 / ln 1.08 = 9.01 years. The rule is close for rates between roughly 6% and 10%.

Real return: nominal 10%, inflation 6%.
- Exact: 1.10 / 1.06 − 1 = **3.77%**
- Approximation: 10% − 6% = 4.00% (overstates by 0.23 points)

**Indian context.** Indian lenders must disclose an annualised cost of credit for many retail and digital loans, including fees, so borrowers can compare offers [VERIFY: RBI Digital Lending Directions and Key Fact Statement requirements]. Inflation is measured mainly by CPI (consumer prices, published by MoSPI), which is the RBI's inflation-targeting anchor [VERIFY: current target and tolerance band under the RBI Act monetary policy framework].

**Common mistakes.**
- Comparing APRs with different compounding frequencies.
- Using nominal − inflation at high inflation, where the error grows.
- Discounting nominal cash flows at a real rate (or the reverse). Keep them consistent.

**Interview angle.**
1. *A card charges 3% a month. What is the annual cost?* Not 36%. EAR = 1.03^12 − 1 = 42.6%.
2. *Why does the Rule of 72 work?* Because ln 2 ≈ 0.693 and ln(1 + r) ≈ r for small r; 72 is used instead of 69.3 because it is divisible by many numbers and corrects for the approximation at typical rates.
3. *Your FD earns 7% and inflation is 5.5%. Are you getting richer?* Slightly in pre-tax real terms (about 1.4%), but after tax on FD interest, the real post-tax return may be near zero or negative.

**Related topics:** [1.1] TVM, [16.2] Bond yields, [25.2] Inflation and monetary policy.

---

### [1.3] Annuities, Perpetuities, EMIs and SIPs
<!-- tags: domain=financial-foundations; level=foundation; roles=CF,Fintech-PM,ER,Consulting; keywords=annuity, annuity due, perpetuity, growing perpetuity, EMI, SIP, loan amortisation -->

**Definition.** An annuity is a series of equal cash flows at regular intervals for a fixed number of periods. A perpetuity is an annuity that continues forever. A growing perpetuity grows at a constant rate forever.

**Why it matters.** Loans (EMIs), SIPs, leases, pensions, bond coupons and terminal values in DCF are all annuities or perpetuities. These formulas let you value a stream of cash flows in one step.

**Core mechanics.**
- PV of ordinary annuity (payments at end of period): PV = PMT × [1 − (1 + r)^−n] / r
- FV of ordinary annuity: FV = PMT × [(1 + r)^n − 1] / r
- Annuity due (payments at start of period): multiply the ordinary annuity value by (1 + r)
- Loan EMI: EMI = P × r × (1 + r)^n / [(1 + r)^n − 1]
- Perpetuity: PV = C / r
- Growing perpetuity: PV = C₁ / (r − g), valid only when r > g; C₁ is the cash flow one period from now

**Worked example 1: home loan EMI.** Loan ₹20,00,000, 9% per year, 20 years, monthly payments.
- Monthly rate r = 9% / 12 = 0.75%; n = 240
- (1.0075)^240 = 6.00915
- EMI = 20,00,000 × 0.0075 × 6.00915 / 5.00915 = **₹17,995**
- Total paid = 17,995 × 240 ≈ ₹43.19 lakh; total interest ≈ **₹23.19 lakh**, more than the principal

Early EMIs are mostly interest. Month 1 interest = 20,00,000 × 0.0075 = ₹15,000, so only ₹2,995 of the first EMI reduces principal.

**Worked example 2: SIP.** ₹10,000 per month for 10 years at an assumed 12% annual return (1% monthly).
- (1.01)^120 = 3.300387
- FV (end-of-month investing) = 10,000 × (3.300387 − 1) / 0.01 = **₹23,00,387**
- FV (start-of-month, annuity due) = 23,00,387 × 1.01 = **₹23,23,391**
- Amount invested = ₹12,00,000

Note: 12% annual is used as 1% monthly for simplicity. The exact monthly equivalent of 12% effective annual is 1.12^(1/12) − 1 = 0.949%.

**Worked example 3: growing perpetuity.** A stock pays a dividend of ₹10 next year, growing 5% forever; required return is 12%.
- PV = 10 / (0.12 − 0.05) = **₹142.86**

This is the Gordon Growth Model, the same logic used for terminal value in a DCF.

**Indian context.** SIPs in mutual funds are regulated by SEBI; returns are market-linked and not guaranteed, so any SIP projection is illustrative [VERIFY: SEBI mutual fund advertising code on return illustrations]. Floating-rate home loans are linked to an external benchmark such as the repo rate, so EMI or tenure changes when the benchmark moves [VERIFY: RBI external benchmark lending rate framework].

**Common mistakes.**
- Using the growing perpetuity formula with g ≥ r (gives a negative or infinite value).
- Using this year's cash flow (C₀) instead of next year's (C₁) in the numerator.
- Forgetting the annuity-due adjustment when payments are at the start of the period.

**Interview angle.**
1. *Why does a 20-year loan cost more in interest than the principal?* Interest is charged on the outstanding balance, which stays high for years because early EMIs are mostly interest. Longer tenure lowers the EMI but raises total interest.
2. *Prepay a home loan or invest the surplus?* Compare the post-tax loan rate with the expected post-tax, risk-adjusted investment return. Prepaying is a guaranteed return equal to the loan rate.
3. *Why must r exceed g in Gordon Growth?* If growth exceeds the discount rate forever, value is infinite. Economically, no firm can outgrow the economy forever, so long-term g is capped near nominal GDP growth.

**Related topics:** [1.1] TVM, [10.3] Terminal value, [16.2] Bond pricing, [19.5] Retail lending.

---

## 1B. Investment Decision Rules

### [1.4] Net Present Value (NPV)
<!-- tags: domain=financial-foundations; level=foundation; roles=IB,PE,CF,Consulting,Fintech-PM; keywords=net present value, NPV, capital budgeting, hurdle rate, value creation, profitability index -->

**Definition.** NPV is the present value of all future cash flows of a project, discounted at the appropriate cost of capital, minus the initial investment.

**Why it matters.** NPV directly measures value created for shareholders, in rupees. A positive NPV means the project earns more than the return investors require for its risk. It is the primary capital budgeting rule in corporate finance, and a common way to test a business case in consulting and product strategy.

**Core mechanics.**
- NPV = −C₀ + Σ [CFₜ / (1 + r)^t], for t = 1 to n
- Decision rule: accept if NPV > 0; between mutually exclusive projects, choose the higher NPV
- Profitability index (PI) = PV of future cash flows / initial investment; accept if PI > 1. Useful for ranking under capital rationing.
- Use incremental, after-tax, free cash flows (not accounting profit)

**Worked example.** Initial investment ₹100 Cr; cash flows of ₹30, 35, 40 and 45 Cr in years 1–4; cost of capital 12%.

| Year | Cash flow (₹ Cr) | Discount factor @12% | PV (₹ Cr) |
|---|---|---|---|
| 0 | −100 | 1.000000 | −100.000 |
| 1 | 30 | 0.892857 | 26.786 |
| 2 | 35 | 0.797194 | 27.902 |
| 3 | 40 | 0.711780 | 28.471 |
| 4 | 45 | 0.635518 | 28.598 |
| **NPV** | | | **11.757** |

NPV = **₹11.76 Cr**, so accept. PI = 111.757 / 100 = **1.12**.

**Indian context.** Listed Indian companies disclose large capex plans to exchanges; analysts reverse-engineer whether the implied return beats the cost of capital. Tax effects on cash flows depend on the corporate tax regime chosen and depreciation under the Income Tax Act [VERIFY: Income Tax Act depreciation rates and section 115BAA conditions].

**Common mistakes.**
- Discounting accounting profit instead of cash flow.
- Including sunk costs (already spent and unrecoverable) or excluding opportunity costs (e.g., a factory you already own that could be sold).
- Ignoring working capital investment and its release at the end.
- Using the company-wide WACC for a project with very different risk.

**Interview angle.**
1. *Why is NPV preferred over IRR?* NPV measures value in absolute rupees, assumes reinvestment at the cost of capital (realistic), adds across projects, and handles unconventional cash flows. IRR can mislead on scale, timing and multiple sign changes.
2. *A project has positive NPV but reduces EPS next year. Do it?* Yes, if the NPV is robust. EPS is an accounting measure and short-term; NPV reflects cash value over the full life.
3. *What does NPV = 0 mean?* The project earns exactly the required return. It creates no extra value but does not destroy any.

**Related topics:** [1.5] IRR, [1.7] Cost of capital, [8.2] Capital budgeting, [10.2] DCF.

---

### [1.5] IRR, MIRR, Payback and Their Pitfalls
<!-- tags: domain=financial-foundations; level=intermediate; roles=IB,PE,CF,Consulting; keywords=internal rate of return, IRR, MIRR, payback period, discounted payback, multiple IRR, scale problem -->

**Definition.** The internal rate of return (IRR) is the discount rate at which a project's NPV equals zero. Payback period is the time needed to recover the initial investment from cash flows.

**Why it matters.** IRR is the language of private equity, project finance and investment committees because it expresses return as a percentage that is easy to compare with a hurdle rate. Payback is used as a liquidity and risk screen. Both are useful, and both have well-known failure modes that interviewers test.

**Core mechanics.**
- IRR solves: 0 = −C₀ + Σ [CFₜ / (1 + IRR)^t]. Found by trial and error or spreadsheet (IRR / XIRR).
- Accept if IRR > hurdle rate (cost of capital).
- MIRR = (FV of inflows at reinvestment rate / PV of outflows)^(1/n) − 1. Fixes the reinvestment assumption.
- Payback = years until cumulative cash flow turns positive.
- Discounted payback = same, using discounted cash flows.

**Worked example.** Same project as [1.4]: −100, then 30, 35, 40, 45 (₹ Cr).

IRR by trial:

| Rate | NPV (₹ Cr) |
|---|---|
| 12% | 11.76 |
| 16% | 2.35 |
| 17% | 0.20 |
| 18% | −1.88 |

Interpolating between 17% and 18%: 17% + 0.20 / (0.20 + 1.88) ≈ **17.1%**. Since 17.1% > 12%, accept (consistent with NPV).

MIRR at a 12% reinvestment rate:
- FV of inflows at year 4 = 30 × 1.12³ + 35 × 1.12² + 40 × 1.12 + 45 = 42.15 + 43.90 + 44.80 + 45.00 = 175.85
- MIRR = (175.85 / 100)^(1/4) − 1 = **15.2%**

MIRR is lower than IRR because IRR implicitly assumes interim cash flows are reinvested at 17.1%, which is unrealistic.

Payback: cumulative cash = 30, 65, 105 → payback = 2 + 35/40 = **2.88 years**.
Discounted payback: cumulative PV = 26.79, 54.69, 83.16, 111.76 → 3 + (100 − 83.16)/28.60 = **3.59 years**.

**Pitfall 1: multiple IRRs.** Cash flows −100, +230, −132 (e.g., a project with a clean-up cost at the end). NPV is zero at both **10% and 20%**. With more than one sign change in cash flows, IRR is not unique; use NPV.

**Pitfall 2: scale.** Mutually exclusive projects at a 10% cost of capital:

| Project | Year 0 | Year 1 | IRR | NPV @10% |
|---|---|---|---|---|
| A | −10 | +15 | 50% | 3.64 |
| B | −100 | +130 | 30% | 18.18 |

IRR picks A; NPV picks B. B creates five times more value. Choose B.

**Pitfall 3: timing.** A project with large early cash flows can have a higher IRR but lower NPV than one with large later cash flows. When rankings conflict, NPV wins.

**Indian context.** Indian PE and VC funds report IRR and multiples to LPs; SEBI's AIF regulations govern performance reporting and benchmarking [VERIFY: SEBI AIF Regulations, performance benchmarking circulars]. XIRR (IRR with exact dates) is the standard for SIP and mutual fund return calculation for irregular cash flows.

**Common mistakes.**
- Ranking mutually exclusive projects by IRR.
- Ignoring that payback ignores cash flows after the payback date and (in the simple version) TVM.
- Using IRR for cash flows with several sign changes.

**Interview angle.**
1. *When can NPV and IRR disagree?* For mutually exclusive projects differing in scale or timing, and when cash flows change sign more than once. Follow NPV.
2. *What is the reinvestment assumption?* IRR implicitly assumes interim cash flows are reinvested at the IRR itself; NPV assumes reinvestment at the cost of capital. MIRR lets you set a realistic reinvestment rate.
3. *Why do PE funds care about both IRR and MOIC?* IRR rewards speed; MOIC (money multiple) rewards absolute gain. A quick 1.3x can have a high IRR but little value. LPs look at both.
4. *Why would a company still use payback?* As a liquidity and risk screen in uncertain environments (e.g., fast-changing tech), where distant cash flows are unreliable.

**Related topics:** [1.4] NPV, [14.1] PE returns (IRR/MOIC), [8.2] Capital budgeting.

---

## 1C. Risk, Return and the Cost of Capital

### [1.6] Risk and Return: Expected Return, Volatility and Diversification
<!-- tags: domain=financial-foundations; level=foundation; roles=ER,PE,CF,Fintech-PM,Consulting; keywords=expected return, standard deviation, variance, correlation, diversification, systematic risk, unsystematic risk, CAPM, beta -->

**Definition.** Return is the gain on an investment relative to its cost. Risk is the variability of possible returns, commonly measured by standard deviation. Investors demand higher expected returns for bearing more of the risk they cannot diversify away.

**Why it matters.** Every discount rate, portfolio decision and asset price embeds a view on risk. Understanding which risk is rewarded (systematic) and which is not (diversifiable) underpins CAPM, cost of equity, portfolio construction and risk management.

**Core mechanics.**
- Expected return: E(R) = Σ pᵢ × Rᵢ
- Variance: σ² = Σ pᵢ × (Rᵢ − E(R))²; standard deviation σ = √σ²
- Two-asset portfolio variance: σp² = wA²σA² + wB²σB² + 2wAwBρABσAσB
- Diversification: when correlation ρ < 1, portfolio volatility is less than the weighted average of individual volatilities
- **Systematic risk** (market-wide: rates, inflation, recessions) cannot be diversified away and is rewarded
- **Unsystematic risk** (firm-specific: a failed product, a fraud) can be diversified away and is not rewarded
- CAPM: E(Rᵢ) = Rf + βᵢ × (E(Rm) − Rf), where β measures sensitivity to market moves

**Worked example 1: single stock.**

| Scenario | Probability | Return |
|---|---|---|
| Boom | 0.3 | 30% |
| Normal | 0.5 | 12% |
| Recession | 0.2 | −10% |

- E(R) = 0.3 × 30 + 0.5 × 12 + 0.2 × (−10) = **13%**
- Variance = 0.3 × 17² + 0.5 × 1² + 0.2 × 23² = 86.7 + 0.5 + 105.8 = 193.0
- σ = √193 = **13.9%**

**Worked example 2: diversification.** 60% in Asset A (σ = 20%) and 40% in Asset B (σ = 30%), correlation 0.2.
- σp² = 0.36 × 400 + 0.16 × 900 + 2 × 0.6 × 0.4 × 0.2 × 20 × 30 = 144 + 144 + 57.6 = 345.6
- σp = **18.6%**, versus a weighted-average volatility of 24%. The 5.4-point reduction is the diversification benefit.

**Worked example 3: CAPM.** Risk-free rate 7%, beta 1.2, market risk premium 6%.
- E(R) = 7% + 1.2 × 6% = **14.2%**

**Indian context.** The 10-year Government of India bond yield is the usual risk-free proxy for INR valuations [VERIFY: current 10-year G-sec yield, RBI/CCIL data]. Beta is typically estimated against the Nifty 50 or Sensex. The equity risk premium used for India varies widely by source [VERIFY: current India ERP estimates, e.g., Damodaran country risk data].

**Common mistakes.**
- Treating total volatility as the priced risk; for a diversified investor only beta matters.
- Assuming correlations stay stable; in crises they tend to rise toward 1, eroding diversification exactly when needed.
- Confusing a high-volatility stock with a high-beta stock; a volatile stock can have low beta if its moves are mostly firm-specific.

**Interview angle.**
1. *Why doesn't the market reward firm-specific risk?* Because investors can eliminate it cheaply by holding many stocks. Competition among diversified investors bids prices to levels that compensate only for systematic risk.
2. *Can a portfolio be less risky than its least risky asset?* Yes, if correlations are low or negative enough.
3. *What does a beta of 0.5 mean?* On average, the stock moves 0.5% for every 1% market move. It has half the systematic risk of the market and a lower required return under CAPM.

**Related topics:** [1.7] Cost of capital, [18.2] Portfolio theory, [8.4] Cost of equity, [20.1] Risk management.

---

### [1.7] Opportunity Cost, Incremental Cash Flows and the Cost of Capital
<!-- tags: domain=financial-foundations; level=foundation; roles=CF,IB,PE,Consulting,Fintech-PM; keywords=opportunity cost, sunk cost, incremental cash flow, hurdle rate, WACC, cost of capital, tax shield -->

**Definition.** Opportunity cost is the value of the best alternative given up when making a choice. The cost of capital is the opportunity cost of investors' money: the return they could earn on an investment of similar risk elsewhere.

**Why it matters.** Good financial decisions compare an option against its real alternatives, using only the cash flows the decision changes. The cost of capital converts this into the discount rate (hurdle rate) used in NPV, IRR and valuation. Getting the relevant cash flows and the right rate correct matters more than any formula.

**Core mechanics.**
- **Incremental cash flow principle:** include only cash flows that change because of the decision.
  - Include: opportunity costs, side effects on existing products (cannibalisation or synergy), working capital changes, taxes
  - Exclude: sunk costs, allocated overheads that do not change, financing costs (interest is captured in the discount rate)
- **WACC** (weighted average cost of capital): WACC = (E/V) × Re + (D/V) × Rd × (1 − t)
  - E = market value of equity; D = market value of debt; V = E + D; Re = cost of equity; Rd = pre-tax cost of debt; t = marginal tax rate
  - Debt is multiplied by (1 − t) because interest is tax-deductible (the interest tax shield)
- Project-specific risk calls for a project-specific rate, not the company average

**Worked example 1: relevant cash flows.** A company spent ₹2 Cr last year on a feasibility study for a new plant. The plant would use a warehouse the company owns, which could otherwise be leased for ₹50 lakh a year. The plant is expected to reduce sales of an existing product by ₹30 lakh of annual cash flow.
- ₹2 Cr study: **sunk**, excluded
- ₹50 lakh lease income forgone: **opportunity cost**, included as a cost each year
- ₹30 lakh lost cash flow on existing product: **cannibalisation**, included as a cost each year

**Worked example 2: WACC.** Equity 60% of value, debt 40%; cost of equity 14%; pre-tax cost of debt 9%; tax rate 25.17%.
- After-tax cost of debt = 9% × (1 − 0.2517) = 6.73%
- WACC = 0.6 × 14% + 0.4 × 6.73% = 8.40% + 2.69% = **11.09%**

**Indian context.** Domestic companies opting for the concessional regime under section 115BAA pay 22% base tax; with a 10% surcharge and 4% cess the effective rate is about 25.17% [VERIFY: Income Tax Act section 115BAA and current Finance Act surcharge/cess]. Companies not opting in face different rates. Use the rate the company actually pays at the margin.

**Common mistakes.**
- Including sunk costs to "recover" past spending.
- Using book values instead of market values for WACC weights.
- Deducting interest from cash flows and also discounting at WACC (double-counting financing).
- Assuming debt is "cheaper" so more debt always lowers WACC; more debt raises the cost of both equity and debt and adds distress risk.

**Interview angle.**
1. *Should sunk costs affect a decision to continue a project?* No. Only future incremental cash flows matter. Continuing because "we've already spent ₹50 Cr" is the sunk cost fallacy.
2. *Why is debt cheaper than equity?* Lenders have priority claims and fixed payments, so they bear less risk; interest is also tax-deductible. But adding debt makes equity riskier.
3. *When would you not use company WACC for a project?* When the project's risk differs from the company's average, such as a consumer company entering fintech lending. Use a rate based on comparable pure-play firms in the new business.
4. *A startup has no debt. What's its cost of capital?* Its cost of equity, typically high (often 25%+ for VC-stage firms) because of risk and illiquidity.

**Related topics:** [1.4] NPV, [1.6] Risk and return, [8.5] Cost of capital and capital structure, [10.2] DCF.

---

## Module 1 Glossary

| Term | Definition |
|---|---|
| Annuity | Equal cash flows at regular intervals for a fixed number of periods |
| Annuity due | Annuity with payments at the start of each period |
| APR | Stated annual interest rate before compounding effects |
| Beta (β) | Sensitivity of an asset's returns to market returns |
| Cost of capital | Return investors require for an investment of given risk; the discount rate |
| Discount factor | 1 / (1 + r)^n; converts a future cash flow to present value |
| EAR | Effective annual rate: true annual return after compounding |
| Fisher equation | (1 + nominal) = (1 + real) × (1 + inflation) |
| Incremental cash flow | Cash flow that changes because of a decision |
| IRR | Discount rate at which NPV equals zero |
| MIRR | IRR variant with an explicit reinvestment rate |
| NPV | PV of future cash flows minus initial investment |
| Opportunity cost | Value of the best alternative given up |
| Sunk cost | Past, unrecoverable cost; irrelevant to future decisions |
| WACC | Weighted average of after-tax cost of debt and cost of equity |

## Module 1 Rapid-Fire Quiz

1. ₹50,000 at 10% annually for 3 years grows to? **₹66,550** (50,000 × 1.331)
2. EAR of 18% compounded monthly? **19.56%** (1.015^12 − 1)
3. PV of ₹1,000 per year forever at 8%? **₹12,500**
4. A dividend of ₹5 next year growing 4% forever, at 10% required return? **₹83.33**
5. Two projects disagree on NPV and IRR. Which rule wins? **NPV**
6. What makes IRR non-unique? **More than one sign change in cash flows**
7. Nominal return 12%, inflation 7%; exact real return? **4.67%** (1.12 / 1.07 − 1)
8. Which risk is priced under CAPM? **Systematic (market) risk**
9. Is a feasibility study already paid for relevant to the go/no-go decision? **No, it is sunk**
10. Why is debt multiplied by (1 − t) in WACC? **Interest is tax-deductible (interest tax shield)**

## Module 1 [VERIFY] Items

1. Bank FD compounding conventions (individual bank terms / RBI interest rate directions)
2. RBI Digital Lending Directions: annualised cost of credit and Key Fact Statement requirements
3. RBI inflation target and tolerance band (RBI Act monetary policy framework)
4. SEBI mutual fund advertising rules on SIP return illustrations
5. RBI external benchmark lending rate framework for floating-rate loans
6. Income Tax Act depreciation rates and section 115BAA conditions
7. SEBI AIF Regulations: performance reporting and benchmarking
8. Current 10-year G-sec yield (RBI / CCIL)
9. Current India equity risk premium estimates
10. Section 115BAA effective rate (22% + 10% surcharge + 4% cess ≈ 25.17%) under the current Finance Act

---

# Module 2: Financial Accounting

## 2A. Foundations of Accounting

### [2.1] The Conceptual Framework: Why Accounts Look the Way They Do
<!-- tags: domain=financial-accounting; level=foundation; roles=Audit,CF,ER,IB,Consulting,Fintech-PM; keywords=conceptual framework, accrual basis, going concern, materiality, prudence, substance over form, faithful representation, Ind AS -->

**Definition.** The conceptual framework is the set of principles that underpin all accounting standards. It defines the objective of financial reporting, the qualities useful information must have, the elements of financial statements (assets, liabilities, equity, income, expenses), and when items are recognised and how they are measured.

**Why it matters.** Standards cannot anticipate every transaction. When a new business model appears (a buy-now-pay-later product, a crypto holding, a loyalty programme), accountants and auditors fall back on the framework. Interviewers use framework questions to test whether a candidate understands *why* a rule exists rather than only memorising it.

**Core mechanics.**

*Objective:* provide information useful to existing and potential investors, lenders and other creditors in making decisions about providing resources to the entity.

*Fundamental qualitative characteristics:*
- **Relevance:** the information can change a decision (it has predictive or confirmatory value). Materiality is an entity-specific aspect of relevance.
- **Faithful representation:** complete, neutral and free from error. Substance takes precedence over legal form.

*Enhancing characteristics:* comparability, verifiability, timeliness, understandability.

*Key assumptions and principles:*

| Principle | Meaning | Example |
|---|---|---|
| Going concern | Entity will continue operating for the foreseeable future | Assets carried at cost less depreciation, not at liquidation value |
| Accrual basis | Record transactions when they occur, not when cash moves | Revenue booked on delivery even if customer pays in 60 days |
| Matching | Expenses recognised in the period of the revenue they help earn | Sales commission expensed with the related sale |
| Prudence (caution) | Do not overstate assets or income, or understate liabilities | Inventory written down to net realisable value |
| Consistency | Same policies period to period unless a change is justified | FIFO used every year; a change is disclosed |
| Substance over form | Economic reality beats legal form | A "sale and repurchase" that is really a loan is shown as borrowing |
| Materiality | Omissions or misstatements that could influence decisions | A ₹5 lakh error is immaterial for a ₹10,000 Cr company, material for a ₹2 Cr startup |

*Elements (definitions under the revised IFRS framework):*
- **Asset:** a present economic resource controlled by the entity as a result of past events (an economic resource is a right with the potential to produce economic benefits).
- **Liability:** a present obligation to transfer an economic resource as a result of past events.
- **Equity:** residual interest in assets after deducting liabilities.
- **Income / expenses:** increases / decreases in assets or liabilities that change equity, other than contributions from or distributions to owners.

*Measurement bases:* historical cost, fair value, value in use, current cost. Most items are historical cost; many financial instruments are fair value.

**Worked example.** A startup signs a ₹12 lakh annual software contract on 1 January, invoices on 1 January and receives cash on 15 February. Its year ends 31 March.
- Cash basis: ₹12 lakh revenue on 15 February.
- Accrual basis: revenue is earned evenly over the service period. By 31 March, 3 of 12 months are delivered, so revenue = 12 × 3/12 = **₹3 lakh**. The remaining **₹9 lakh is a contract liability** (deferred revenue), because the company owes 9 months of service.

**Indian context.** Indian companies above specified thresholds (listed companies and unlisted companies with net worth of ₹250 Cr or more, plus their holding, subsidiary, JV and associate companies) report under Indian Accounting Standards (Ind AS), notified by MCA under the Companies Act 2013; others use the older Accounting Standards (AS) [VERIFY: Companies (Indian Accounting Standards) Rules 2015, applicability thresholds]. Ind AS are converged with IFRS with some carve-outs. Banks and insurers follow sector-specific timelines set by RBI and IRDAI [VERIFY: current RBI/IRDAI Ind AS implementation status]. Section 129 of the Companies Act requires financial statements to give a "true and fair view".

**Common mistakes.**
- Treating prudence as permission to build hidden reserves. Prudence means caution under uncertainty, not deliberate understatement.
- Confusing "profit" with "cash"; accrual accounting makes them diverge.
- Assuming materiality is a fixed percentage. It is a judgment that includes qualitative factors (e.g., a small related-party payment to a director can be material).

**Interview angle.**
1. *Why do we use accrual accounting instead of cash?* Accruals match revenue and expenses to the period in which economic activity happens, giving a truer picture of performance. Cash timing can be manipulated or lumpy; the cash flow statement covers cash separately.
2. *What does "substance over form" mean? Give an example.* Account for economic reality, not legal labels. A lease that gives control of an asset for most of its life is recorded as an asset and a liability, even though legally the lessee does not own it.
3. *When would going concern not apply?* When management intends to liquidate or has no realistic alternative. The statements are then prepared on a break-up basis, with assets at realisable values.

**Related topics:** [2.2] Double entry, [2.3] Accruals, [5.1] Accounting standards, [6.3] Audit (materiality, going concern).

---

### [2.2] Double-Entry Bookkeeping and the Accounting Cycle
<!-- tags: domain=financial-accounting; level=foundation; roles=Audit,CF,Fintech-PM,Consulting; keywords=double entry, debit, credit, journal entry, ledger, trial balance, accounting equation, accounting cycle -->

**Definition.** Double-entry bookkeeping records every transaction in at least two accounts, with equal debits and credits, so the accounting equation (Assets = Liabilities + Equity) always balances.

**Why it matters.** Every ERP (SAP, Oracle, Tally, Zoho Books), every ledger built by a fintech, and every reconciliation an auditor performs rests on double entry. Product managers building payments, lending or wallet products must design ledgers that obey these rules, or money "disappears" in reconciliation.

**Core mechanics.**

*The accounting equation:* Assets = Liabilities + Equity, and Equity = Capital + Retained earnings (Revenue − Expenses − Dividends).

*Debit and credit rules:*

| Account type | Increase | Decrease | Normal balance |
|---|---|---|---|
| Asset | Debit | Credit | Debit |
| Expense | Debit | Credit | Debit |
| Liability | Credit | Debit | Credit |
| Equity | Credit | Debit | Credit |
| Revenue | Credit | Debit | Credit |

Mnemonic: **DEAD CLIC**. Debits increase Expenses, Assets, Drawings; Credits increase Liabilities, Income, Capital.

*Traditional Indian classification (still taught and used in Tally):*
- Personal accounts: debit the receiver, credit the giver.
- Real accounts: debit what comes in, credit what goes out.
- Nominal accounts: debit expenses and losses, credit incomes and gains.

*The accounting cycle:*
1. Identify and analyse transactions (source documents: invoices, receipts, bank statements).
2. Record journal entries.
3. Post to the general ledger.
4. Prepare an unadjusted trial balance.
5. Record adjusting entries (accruals, deferrals, depreciation, provisions).
6. Prepare the adjusted trial balance.
7. Prepare financial statements.
8. Close temporary accounts (revenue, expense) to retained earnings.

**Worked example.** A new company, Beta Pvt Ltd, has these transactions in its first month:

| # | Transaction | Debit | Credit | Amount (₹) |
|---|---|---|---|---|
| 1 | Owners invest cash | Cash | Share capital | 10,00,000 |
| 2 | Buy equipment for cash | Equipment | Cash | 3,00,000 |
| 3 | Buy inventory on credit | Inventory | Trade payables | 2,00,000 |
| 4 | Sell goods costing ₹1,20,000 for ₹2,00,000 on credit | Trade receivables | Revenue | 2,00,000 |
| 4b | Record cost of the goods sold | Cost of goods sold | Inventory | 1,20,000 |
| 5 | Pay salaries | Salary expense | Cash | 50,000 |
| 6 | Collect from customers | Cash | Trade receivables | 1,50,000 |

Resulting balances:
- Cash = 10,00,000 − 3,00,000 − 50,000 + 1,50,000 = **₹8,00,000**
- Equipment ₹3,00,000; Inventory ₹80,000; Receivables ₹50,000 → **Total assets ₹12,30,000**
- Payables ₹2,00,000; Share capital ₹10,00,000; Profit = 2,00,000 − 1,20,000 − 50,000 = ₹30,000 → **Liabilities + equity ₹12,30,000**

The equation balances.

**Indian context.** Section 128 of the Companies Act 2013 requires books on an accrual basis and double-entry system, and (per 2022 amendments to the accounts rules) electronic books must be backed up on servers in India daily and maintain an audit trail (edit log) that cannot be disabled [VERIFY: Companies (Accounts) Rules 2014, Rule 3 audit-trail requirement and effective date]. Auditors report on whether the audit trail feature operated throughout the year.

**Common mistakes.**
- Thinking "debit" means "good" or "decrease". It only means left side.
- Forgetting the second leg of a sale (cost of goods sold against inventory).
- Posting a cash receipt from a customer as revenue (double-counting a sale already recorded on credit).

**Interview angle.**
1. *Why must debits equal credits?* Every transaction has a source and a use of value. Recording both keeps the accounting equation in balance and gives a built-in error check via the trial balance.
2. *If a trial balance balances, are the books correct?* No. Errors of omission, wrong account (commission), compensating errors and errors of principle all leave the trial balance balanced.
3. *(Fintech PM) How would you design a wallet ledger?* Use an immutable, double-entry ledger: every movement debits one account and credits another, balances are derived from entries rather than overwritten, and every entry links to an idempotent transaction ID for reconciliation with bank and payment-network files.

**Related topics:** [2.1] Framework, [2.3] Adjusting entries, [3.4] Three statements, [21.2] Payments ledgers.

---

### [2.3] Accruals, Deferrals, Provisions and Contingencies
<!-- tags: domain=financial-accounting; level=foundation; roles=Audit,CF,ER,Consulting; keywords=accrued expense, prepaid expense, deferred revenue, provision, contingent liability, Ind AS 37, onerous contract, warranty provision -->

**Definition.** Adjusting entries align the books with the accrual principle at period end. Accruals record revenue earned or expenses incurred before cash moves. Deferrals record cash that moved before the revenue is earned or the expense is incurred. A provision is a liability of uncertain timing or amount; a contingent liability is a possible obligation that is not recognised but disclosed.

**Why it matters.** Most earnings management happens in judgment-heavy adjustments: under-provisioning warranties, delaying expense accruals, or accelerating revenue. Analysts read provisions and contingent-liability notes to judge how conservative management is, and auditors spend much of their time on them.

**Core mechanics.**

| Type | Situation | Entry at period end |
|---|---|---|
| Accrued revenue | Service delivered, not yet billed | Dr Accrued revenue (asset) / Cr Revenue |
| Accrued expense | Expense incurred, not yet paid (e.g., electricity, salaries) | Dr Expense / Cr Accrued liability |
| Prepaid expense | Paid in advance (e.g., insurance) | Dr Prepaid (asset) / Cr Cash, then expense over time |
| Deferred revenue | Cash received before delivery | Dr Cash / Cr Contract liability, then revenue over time |

*Provision recognition (Ind AS 37 / IAS 37): recognise when all three hold:*
1. A present obligation (legal or constructive) from a past event,
2. An outflow of resources is **probable** (more likely than not), and
3. A reliable estimate can be made.

*Decision table:*

| Likelihood of outflow | Treatment |
|---|---|
| Probable, reliably measurable | Recognise provision |
| Possible (not probable) | Disclose as contingent liability |
| Remote | Nothing |
| Contingent asset, virtually certain | Recognise asset |
| Contingent asset, probable | Disclose only |

Measurement: the best estimate of the expenditure to settle the obligation, using expected value for large populations (warranties) or the most likely outcome for single obligations (a lawsuit), discounted if the effect is material.

*Onerous contract:* when unavoidable costs of meeting a contract exceed the benefits expected, recognise a provision for the net loss.

**Worked example.** A company sells 1,000 appliances with a one-year warranty. History shows 5% need repair at an average cost of ₹2,000.
- Expected repairs = 1,000 × 5% = 50
- Provision = 50 × ₹2,000 = **₹1,00,000**
- Entry: Dr Warranty expense ₹1,00,000 / Cr Warranty provision ₹1,00,000
- When a repair costing ₹2,000 is performed: Dr Warranty provision / Cr Cash (or inventory)

Separately, the company faces a customer lawsuit claiming ₹50 lakh. Lawyers assess the chance of losing as 30%. Outflow is possible but not probable, so **no provision; disclose a contingent liability** with nature and estimated effect.

**Indian context.** Contingent liabilities in Indian annual reports often include large disputed tax demands (income tax, GST, customs) under appeal. Analysts should compare these with net worth: a disputed demand of 30% of net worth is a real risk even if not provided for. Schedule III to the Companies Act requires disclosure of contingent liabilities and commitments [VERIFY: Schedule III Division II disclosure requirements].

**Common mistakes.**
- Recognising provisions for future operating losses (not allowed; there is no present obligation).
- Creating general "cookie jar" provisions in good years to release in bad years.
- Ignoring constructive obligations (e.g., a well-publicised refund policy creates an obligation even without a legal requirement).

**Interview angle.**
1. *Difference between a provision and a contingent liability?* A provision is a recognised liability where outflow is probable and estimable. A contingent liability is disclosed only, because outflow is merely possible or the amount cannot be reliably measured.
2. *Why would an analyst care about provision releases?* Releasing excess provisions boosts profit without any operating improvement. A sudden release in a weak year is a red flag for earnings management.
3. *A company receives ₹1 Cr in advance for an annual subscription. What's on the balance sheet at month 4?* Contract liability (deferred revenue) of ₹66.7 lakh; ₹33.3 lakh has been recognised as revenue.

**Related topics:** [2.4] Revenue recognition, [4.9] Quality of earnings, [6.2] Audit of estimates.

---

## 2B. Revenue, Inventory and Long-Lived Assets

### [2.4] Revenue Recognition: Ind AS 115 / IFRS 15 Five-Step Model
<!-- tags: domain=financial-accounting; level=intermediate; roles=Audit,ER,IB,Fintech-PM,CF,Consulting; keywords=Ind AS 115, IFRS 15, ASC 606, performance obligation, transaction price, standalone selling price, principal vs agent, gross vs net revenue -->

**Definition.** Ind AS 115 (equivalent to IFRS 15 and US ASC 606) requires revenue to be recognised when (or as) control of promised goods or services transfers to the customer, at the amount the entity expects to be entitled to.

**Why it matters.** Revenue is the most important line in the P&L and the most common source of restatements. For fintechs, marketplaces and SaaS firms, the standard's judgments (gross vs net, over time vs point in time, bundled offerings) can change reported revenue several-fold without changing a single rupee of cash.

**Core mechanics: the five steps.**
1. **Identify the contract** (enforceable rights, commercial substance, collection probable).
2. **Identify performance obligations:** distinct promises (the customer can benefit from it on its own and it is separately identifiable).
3. **Determine the transaction price:** fixed and variable consideration (discounts, rebates, refunds, performance bonuses), constrained so that a significant reversal is highly unlikely; adjust for significant financing components and non-cash consideration.
4. **Allocate the price** to performance obligations in proportion to their standalone selling prices (SSP).
5. **Recognise revenue** when each obligation is satisfied: **over time** (customer simultaneously receives and consumes benefits, or the entity's work creates an asset the customer controls, or no alternative use plus enforceable right to payment) or **at a point in time** (control transfers, e.g., delivery).

*Principal vs agent (gross vs net):* If the entity controls the good or service before transfer to the customer, it is the **principal** and records gross revenue. If it arranges for another party to provide it, it is an **agent** and records only its commission (net). Indicators: primary responsibility for fulfilment, inventory risk, pricing discretion.

**Worked example 1: bundle allocation.** A SaaS company sells a ₹12 lakh package: software licence, implementation and one year of support. Standalone selling prices: licence ₹8 lakh, implementation ₹3 lakh, support ₹3 lakh (total ₹14 lakh). The ₹2 lakh discount is spread proportionally.

| Obligation | SSP (₹ lakh) | Allocation (₹ lakh) | Timing |
|---|---|---|---|
| Licence | 8 | 12 × 8/14 = 6.857 | Point in time (on delivery) |
| Implementation | 3 | 12 × 3/14 = 2.571 | Over time (as work progresses) |
| Support | 3 | 12 × 3/14 = 2.571 | Over time (12 months) |
| **Total** | 14 | **12.000** | |

If the licence is delivered on day one, ₹6.857 lakh is recognised immediately, even though the customer may pay in instalments.

**Worked example 2: gross vs net.** A marketplace processes ₹1,000 Cr of gross merchandise value (GMV) and earns a 15% commission. Sellers own the inventory and set prices.
- The marketplace is an **agent**: revenue = **₹150 Cr** (net).
- If it bought the goods, held inventory and set prices (an inventory model), it would be a principal and report ₹1,000 Cr of revenue with ₹850 Cr cost of sales. Same gross profit, very different "revenue".

**Indian context.** FDI rules prohibit foreign-owned e-commerce entities from running an inventory model for B2C sales in India, so Indian marketplaces are typically structured as agents [VERIFY: DPIIT consolidated FDI policy, e-commerce provisions]. Payment aggregators typically present MDR revenue net of interchange and network costs passed to banks, or gross with those costs as expenses, depending on principal/agent assessment; read the accounting policy note before comparing take rates across firms.

**Common mistakes.**
- Comparing "revenue" across a marketplace (net) and a retailer (gross) without adjustment; compare GMV and gross profit instead.
- Recognising the full contract value upfront when obligations are satisfied over time.
- Ignoring variable consideration (returns, volume rebates) and later reversing revenue.

**Interview angle.**
1. *Walk me through Ind AS 115.* Identify the contract, identify distinct performance obligations, determine the transaction price including variable consideration, allocate it by standalone selling prices, and recognise revenue as each obligation is satisfied, over time or at a point in time.
2. *Why might two food-delivery apps report very different revenue on the same order volume?* Gross vs net presentation, treatment of delivery fees, and whether customer discounts are recorded as marketing expense or a reduction of revenue. Compare gross order value, take rate and contribution margin instead.
3. *What is deferred revenue and is it good or bad?* Cash received before delivery, recorded as a liability. Growing deferred revenue is usually a good sign for subscription businesses because it is prepaid future revenue and a source of working capital.

**Related topics:** [2.3] Deferrals, [4.11] SaaS metrics, [21.5] Payments revenue models, [4.9] Revenue red flags.

---

### [2.5] Inventory Accounting: Ind AS 2, Cost Formulas and Net Realisable Value
<!-- tags: domain=financial-accounting; level=foundation; roles=Audit,ER,CF,Consulting; keywords=Ind AS 2, inventory, FIFO, weighted average, LIFO, net realisable value, cost of goods sold, inventory write-down -->

**Definition.** Ind AS 2 (IAS 2) requires inventory to be measured at the lower of cost and net realisable value (NRV). Cost includes purchase cost, conversion cost and other costs to bring inventory to its present location and condition.

**Why it matters.** Inventory method directly changes cost of goods sold, gross margin, tax and the balance sheet. In inflationary periods, the choice of method shifts profits between years. Inventory is also a classic fraud area (fictitious stock, overvaluation).

**Core mechanics.**
- **Cost includes:** purchase price, import duties and non-recoverable taxes, freight-in, conversion costs (direct labour, fixed and variable production overheads allocated on normal capacity).
- **Cost excludes:** abnormal wastage, storage (unless necessary in production), administrative overheads, selling costs.
- **Cost formulas allowed:** FIFO (first-in, first-out), weighted average cost, and specific identification for non-interchangeable items. **LIFO is prohibited** under Ind AS and IFRS, but allowed under US GAAP.
- **NRV** = estimated selling price − estimated costs to complete − estimated costs to sell. Write down when NRV < cost; reverse the write-down (up to original cost) if NRV recovers.

**Worked example.** Opening inventory 100 units at ₹50; purchases of 200 units at ₹55, then 200 units at ₹60; 350 units sold at ₹80.

Total available = 500 units costing 5,000 + 11,000 + 12,000 = ₹28,000. Sales = 350 × 80 = ₹28,000.

| Method | COGS (₹) | Closing inventory (₹) | Gross profit (₹) |
|---|---|---|---|
| FIFO | 100×50 + 200×55 + 50×60 = **19,000** | 150 × 60 = **9,000** | 9,000 |
| Weighted average (₹56/unit) | 350 × 56 = **19,600** | 150 × 56 = **8,400** | 8,400 |

With rising prices, FIFO gives lower COGS and higher profit (and higher tax), and a balance-sheet inventory closer to current cost.

*NRV test:* if expected selling price falls so that NRV is ₹52 per unit, FIFO closing inventory of ₹9,000 exceeds NRV of 150 × 52 = ₹7,800. **Write down ₹1,200**: Dr Cost of goods sold (or inventory write-down expense) / Cr Inventory.

**Indian context.** Indian manufacturing companies commonly use weighted average; FMCG and retail use either. Income-tax computation follows the Income Computation and Disclosure Standards (ICDS II on inventories), which can differ from Ind AS in some respects [VERIFY: ICDS II valuation of inventories]. CARO requires auditors to report on physical verification of inventory and discrepancies of 10% or more in aggregate per class [VERIFY: CARO 2020 clause 3(ii)].

**Common mistakes.**
- Including abnormal wastage or idle-capacity overheads in inventory cost (inflates assets).
- Assuming LIFO can be used in India.
- Ignoring NRV for slow-moving or obsolete stock.

**Interview angle.**
1. *In inflation, which gives higher profit, FIFO or weighted average?* FIFO, because older, cheaper costs flow into COGS first.
2. *Why is LIFO banned under IFRS?* It can leave very old costs on the balance sheet, distorting inventory values, and it allows profit manipulation through timing of purchases (LIFO liquidation).
3. *Inventory grows 40% while sales grow 10%. What do you think?* Possible demand slowdown, obsolescence risk, or channel stuffing in reverse; also possible capitalisation of costs. Check inventory days, ageing and write-down history.

**Related topics:** [4.6] Inventory days and CCC, [7.2] Costing methods, [4.9] Red flags.

---

### [2.6] Property, Plant and Equipment, Depreciation and Impairment
<!-- tags: domain=financial-accounting; level=foundation; roles=Audit,ER,CF,IB,PE,Consulting; keywords=Ind AS 16, PPE, capitalisation, depreciation, straight line, written down value, useful life, Ind AS 36, impairment, recoverable amount, value in use -->

**Definition.** Property, plant and equipment (PPE) are tangible assets held for use in production, supply, rental or administration and expected to be used for more than one period. Depreciation allocates their cost over useful life. Impairment reduces carrying value when it exceeds the recoverable amount.

**Why it matters.** Capital-intensive businesses (manufacturing, telecom, power, airlines) live and die by capex efficiency. Depreciation policy shifts profit across years, and capitalising operating costs is one of the most common accounting manipulations (WorldCom capitalised line costs). Impairment charges signal that past investments failed.

**Core mechanics.**

*Initial measurement (Ind AS 16):* purchase price + import duties and non-refundable taxes + directly attributable costs (site preparation, delivery, installation, professional fees, testing) + estimated dismantling costs. Borrowing costs on qualifying assets are capitalised under Ind AS 23. Trade discounts are deducted.

*Subsequent measurement:* cost model (cost less accumulated depreciation and impairment) or revaluation model (fair value, with gains in OCI to a revaluation surplus).

*Component accounting:* significant parts with different useful lives are depreciated separately (e.g., an aircraft's engines vs airframe).

*Depreciation methods:*
- Straight-line (SLM): (Cost − Residual value) / Useful life
- Written-down value (WDV) or declining balance: fixed rate × opening carrying amount; rate = 1 − (Residual / Cost)^(1/n)
- Units of production: based on usage

*Impairment (Ind AS 36):* At each reporting date, check for indicators (market value decline, adverse changes, obsolescence, higher interest rates). If indicated, compute recoverable amount = **higher of** (fair value less costs of disposal) and (value in use, the PV of future cash flows). Impairment loss = carrying amount − recoverable amount. Goodwill and indefinite-life intangibles are tested annually regardless. Impairment of assets other than goodwill can be reversed; goodwill impairment cannot.

**Worked example 1: SLM vs WDV.** Machine cost ₹10 lakh, residual value ₹1 lakh, life 5 years.
- SLM: (10 − 1) / 5 = **₹1.8 lakh per year**
- WDV rate = 1 − (1/10)^(1/5) = **36.9%**

| Year | WDV depreciation (₹ lakh) | SLM depreciation (₹ lakh) |
|---|---|---|
| 1 | 3.690 | 1.800 |
| 2 | 2.329 | 1.800 |
| 3 | 1.469 | 1.800 |
| 4 | 0.927 | 1.800 |
| 5 | 0.585 | 1.800 |
| Total | 9.000 | 9.000 |

Same total; WDV front-loads expense, lowering early profit.

**Worked example 2: impairment.** A plant has carrying amount ₹100 Cr. Value in use is ₹80 Cr; fair value less costs of disposal is ₹85 Cr. Recoverable amount = higher = ₹85 Cr. **Impairment loss = ₹15 Cr**, charged to P&L.

**Indian context.** Schedule II of the Companies Act 2013 prescribes indicative useful lives (e.g., general plant and machinery 15 years, computers 3 years, buildings 30–60 years) [VERIFY: Schedule II useful lives]; companies may use different lives with technical justification and disclosure. Tax depreciation under the Income Tax Act uses block-of-assets WDV rates, which differ from book depreciation and create deferred tax. Note that India's new Income-tax Act 2025 replaces the 1961 Act from 1 April 2026; check renumbered sections [VERIFY: Income-tax Act 2025 commencement and depreciation provisions].

**Common mistakes.**
- Capitalising repairs and maintenance that only maintain (not enhance) the asset.
- Using "higher of" wrongly; recoverable amount is the higher of the two measures, because management would choose the better option of selling or using.
- Assuming impairment is a cash event; it is non-cash, but it signals poor returns on capital already spent.

**Interview angle.**
1. *How does capitalising an expense rather than expensing it affect the statements?* Higher current profit and assets; the cost hits later as depreciation. In the cash flow statement it moves from operating to investing outflow, so CFO looks better. Overall cash is unchanged (ignoring tax).
2. *A company lengthens asset useful lives. Why should you care?* It cuts depreciation and boosts EPS without any operational change. Check whether peers use similar lives.
3. *How is recoverable amount defined and why "higher of"?* The higher of fair value less costs of disposal and value in use, because a rational owner would either sell or keep using the asset, whichever yields more.

**Related topics:** [2.9] Deferred tax, [2.7] Goodwill impairment, [8.2] Capital budgeting, [4.9] Capitalisation red flags.

---

### [2.7] Intangible Assets, Goodwill and Business Combinations
<!-- tags: domain=financial-accounting; level=intermediate; roles=IB,PE,Audit,ER,CF; keywords=Ind AS 38, Ind AS 103, goodwill, purchase price allocation, intangible assets, R&D capitalisation, amortisation, bargain purchase -->

**Definition.** An intangible asset is an identifiable non-monetary asset without physical substance (software, brands, licences, customer relationships, patents). Goodwill is the excess of the price paid in a business combination over the fair value of identifiable net assets acquired; it represents synergies, assembled workforce and other unidentifiable value.

**Why it matters.** In tech, pharma and consumer companies, most value is intangible, yet internally generated brands and customer bases rarely appear on balance sheets. Acquisitions bring them onto the books, which is why acquirers often show large goodwill and amortisation. Analysts adjust for this when comparing organic and acquisitive companies.

**Core mechanics.**

*Recognition criteria (Ind AS 38):* identifiable (separable or arising from contractual/legal rights), controlled, future economic benefits probable, cost reliably measurable.

*Internally generated intangibles:*
- **Research phase:** always expensed.
- **Development phase:** capitalised only if all six criteria are met: technical feasibility, intention to complete, ability to use or sell, how it will generate benefits, adequate resources, and reliable measurement of expenditure.
- Internally generated brands, mastheads, customer lists and goodwill are **never** capitalised.

*Subsequent measurement:* finite-life intangibles amortised over useful life; indefinite-life intangibles and goodwill are not amortised under Ind AS/IFRS but tested for impairment annually.

*Business combinations (Ind AS 103), acquisition method:*
1. Identify the acquirer.
2. Determine the acquisition date.
3. Recognise and measure identifiable assets acquired and liabilities assumed at fair value (purchase price allocation, PPA), including intangibles not on the target's books.
4. Measure non-controlling interest (NCI): at fair value (full goodwill) or proportionate share of net assets.
5. Goodwill = Consideration + NCI + fair value of previously held interest − fair value of identifiable net assets.
6. If negative (bargain purchase), recognise the gain in OCI and accumulate in capital reserve under Ind AS (IFRS takes it to P&L), after reassessment [VERIFY: Ind AS 103 bargain purchase carve-out].

**Worked example: purchase price allocation.** Acquirer pays ₹500 Cr for 100% of Target. Target's book net assets are ₹200 Cr. Fair value adjustments: PPE up ₹30 Cr; newly identified brand ₹80 Cr; customer relationships ₹50 Cr; deferred tax liability on the step-ups at 25%.

| Item | ₹ Cr |
|---|---|
| Book net assets | 200 |
| + PPE step-up | 30 |
| + Brand | 80 |
| + Customer relationships | 50 |
| − Deferred tax liability on step-ups (160 × 25%) | (40) |
| Fair value of identifiable net assets | 320 |
| **Goodwill = 500 − 320** | **180** |

Post-deal, customer relationships (say a 10-year life) add ₹5 Cr a year of amortisation, reducing reported profit. This is why many acquirers report "adjusted" earnings excluding acquisition amortisation.

**Indian context.** Under Ind AS, goodwill is not amortised. Under the older Indian GAAP (AS 14) amalgamation goodwill could be amortised, typically over up to 5 years [VERIFY: AS 14]. For tax, goodwill is no longer a depreciable asset following Finance Act 2021 [VERIFY: Income Tax Act, goodwill depreciation amendment]. Common-control combinations (group restructurings) use the pooling of interests method under Appendix C of Ind AS 103, with no goodwill.

**Global differences.** US GAAP allows private companies to amortise goodwill (up to 10 years); public companies only test it for impairment. US GAAP expenses most development costs (except some software), whereas IFRS/Ind AS require capitalisation when criteria are met.

**Common mistakes.**
- Treating goodwill as a real, separable asset; it cannot be sold independently and is the first casualty in a downturn.
- Ignoring the deferred tax liability created by fair value step-ups, which inflates goodwill.
- Comparing ROE or ROA of an acquisitive company with an organic one without adjusting for goodwill.

**Interview angle.**
1. *How is goodwill created and how is it treated afterwards?* It arises when price paid exceeds fair value of identifiable net assets. Under Ind AS/IFRS it is not amortised but tested annually for impairment; impairment cannot be reversed.
2. *Why do acquirers recognise intangibles the target never had on its books?* The acquisition method requires all identifiable assets at fair value; the target's internally generated brand and customer relationships become identifiable through the purchase.
3. *What does a large goodwill impairment tell you?* The acquirer overpaid or the acquired business underperformed. It is non-cash but confirms capital was destroyed.

**Related topics:** [2.6] Impairment, [5.3] Consolidation, [5.3] M&A accounting, [10.1] Valuation.

---

### [2.8] Lease Accounting: Ind AS 116 / IFRS 16
<!-- tags: domain=financial-accounting; level=intermediate; roles=IB,PE,ER,Audit,CF,Consulting; keywords=Ind AS 116, IFRS 16, ASC 842, right-of-use asset, lease liability, incremental borrowing rate, EBITDA impact, operating lease -->

**Definition.** Ind AS 116 requires lessees to recognise almost all leases on the balance sheet as a right-of-use (ROU) asset and a lease liability, eliminating the old off-balance-sheet operating lease for lessees.

**Why it matters.** For retailers, airlines, telecom tower users, quick-commerce companies and restaurant chains, leases are a major form of financing. Ind AS 116 raised reported EBITDA, debt and assets for such companies. Analysts must know whether a multiple or leverage ratio is "pre-" or "post-Ind AS 116" to compare companies correctly.

**Core mechanics.**
- **Initial recognition:** Lease liability = PV of lease payments not yet paid, discounted at the rate implicit in the lease or, if not determinable, the lessee's incremental borrowing rate (IBR). ROU asset = lease liability + initial direct costs + prepaid lease payments + restoration costs − incentives received.
- **Subsequent:** ROU asset depreciated (usually straight-line) over the shorter of lease term and useful life. Liability accrues interest (effective interest method) and is reduced by payments.
- **Exemptions:** short-term leases (12 months or less) and low-value assets may be expensed straight-line.
- **P&L effect:** rent expense is replaced by depreciation (in EBIT) plus interest (below EBIT). Total expense is front-loaded.
- **Cash flow effect:** principal repayment moves to financing activities; interest to operating or financing per policy. CFO rises; total cash unchanged.
- **Lessors** still classify leases as finance or operating.
- **US GAAP (ASC 842):** lessees keep a two-model approach; operating leases are on the balance sheet but show a single straight-line lease cost in operating expenses (so EBITDA is not inflated as under IFRS 16).

**Worked example.** A retailer leases a store for 5 years at ₹10 lakh per year, paid at year end. IBR is 10%.
- Annuity factor (10%, 5 years) = 3.79079
- Lease liability = ROU asset = 10 × 3.79079 = **₹37.908 lakh**

| Year | Opening liability | Interest @10% | Payment | Closing liability |
|---|---|---|---|---|
| 1 | 37.908 | 3.791 | 10.000 | 31.699 |
| 2 | 31.699 | 3.170 | 10.000 | 24.869 |
| 3 | 24.869 | 2.487 | 10.000 | 17.355 |
| 4 | 17.355 | 1.736 | 10.000 | 9.091 |
| 5 | 9.091 | 0.909 | 10.000 | 0.000 |

Year 1 P&L: depreciation 37.908 / 5 = 7.582; interest 3.791; **total 11.372 vs 10.000 rent under the old model**. EBITDA is **₹10 lakh higher** (rent removed); EBIT higher by 10 − 7.582 = 2.418; PBT lower by 1.372 in year 1, higher in later years when interest falls. Over the five years, total expense equals ₹50 lakh under both models.

**Indian context.** Ind AS 116 applied from accounting periods beginning on or after 1 April 2019. Indian retail, QSR and aviation companies (with large aircraft leases) saw significant EBITDA and debt changes; many still report "pre-Ind AS 116 EBITDA" in investor presentations. Covenant definitions in loan agreements often specify which basis to use.

**Common mistakes.**
- Comparing EV/EBITDA of a post-Ind AS 116 company with a US GAAP peer without adjusting (lease liabilities should be included in EV if EBITDA excludes rent).
- Treating the EBITDA increase as an operational improvement.
- Forgetting that net debt rises when lease liabilities are included.

**Interview angle.**
1. *How did Ind AS 116 affect EBITDA, EBIT, net income and leverage?* EBITDA up (rent removed), EBIT up slightly (depreciation < rent), early net income slightly down (interest front-loaded), assets and debt up, leverage ratios worse, CFO up and CFF down.
2. *If you value a retailer on EV/EBITDA post-Ind AS 116, what must you do?* Be consistent: if EBITDA excludes rent, include lease liabilities in EV. Or use EBITDA after rent (EBITDAR minus rent) with EV excluding lease liabilities.
3. *Why did regulators make the change?* Operating leases were hidden debt. Airlines and retailers carried large obligations that did not appear on balance sheets, making leverage comparisons misleading.

**Related topics:** [3.3] Cash flow statement, [4.5] Leverage ratios, [10.5] Enterprise value and multiples.

---

## 2C. Taxes, Financial Instruments and Equity

### [2.9] Income Taxes and Deferred Tax: Ind AS 12
<!-- tags: domain=financial-accounting; level=intermediate; roles=Audit,ER,IB,CF; keywords=Ind AS 12, deferred tax liability, deferred tax asset, temporary difference, tax base, effective tax rate, MAT credit -->

**Definition.** Deferred tax is the tax effect of temporary differences between the carrying amount of an asset or liability in the books and its tax base. A deferred tax liability (DTL) means more tax will be payable in future; a deferred tax asset (DTA) means less.

**Why it matters.** Book profit and taxable profit differ because accounting standards and tax law follow different rules (depreciation, provisions, revenue timing). Deferred tax keeps the P&L tax charge aligned with book profit. Analysts track effective tax rates, and large DTAs from losses are only valuable if the company becomes profitable.

**Core mechanics.**
- Tax expense in P&L = Current tax (payable to the authorities this year) + Deferred tax (change in DTL/DTA).
- **Temporary difference** = Carrying amount − Tax base.
  - Asset with carrying amount > tax base → taxable temporary difference → **DTL**.
  - Asset with carrying amount < tax base, or liability (e.g., provision) not yet deductible → deductible temporary difference → **DTA**.
- **Permanent differences** (e.g., penalties not deductible, exempt income) never reverse and create no deferred tax; they change the effective tax rate.
- DTA on unused tax losses is recognised only to the extent it is **probable** that future taxable profit will be available.
- Measured at tax rates enacted or substantively enacted for the period of reversal; not discounted.
- Ind AS uses the **balance sheet approach** (compare carrying amount and tax base); old Indian GAAP AS 22 used the income statement (timing difference) approach.

**Worked example.** Asset cost ₹100. Book depreciation straight-line ₹20 a year (5-year life). Tax depreciation 40% WDV. Tax rate 25%.

| Year | Book carrying amount | Tax base | Temporary difference | DTL (25%) | Change in DTL |
|---|---|---|---|---|---|
| 1 | 80 | 60 | 20 | 5.0 | +5.0 |
| 2 | 60 | 36 | 24 | 6.0 | +1.0 |

Year 1: if profit before depreciation is ₹200 for both book and tax:
- Book PBT = 200 − 20 = 180; taxable profit = 200 − 40 = 160.
- Current tax = 160 × 25% = 40; deferred tax = +5; total tax expense = **45 = 25% of 180**. The P&L shows the "right" tax rate on book profit.

**Indian context.** Domestic companies may opt for concessional rates under section 115BAA (22% base, about 25.17% effective with surcharge and cess), giving up most deductions and incentives; companies not opting in pay the normal rate plus Minimum Alternate Tax (MAT) if applicable [VERIFY: Income Tax Act s.115BAA/s.115JB; equivalent provisions under the Income-tax Act 2025]. When a company switches regime, DTA/DTL balances are remeasured at the new rate, which can create a one-time P&L hit or gain (many Indian companies booked these in FY2019-20). Unused MAT credit is lost if a company opts for 115BAA.

**Common mistakes.**
- Recognising DTAs on losses of a company with no realistic path to profit.
- Treating DTL as "debt". It is an accounting liability, often deferred indefinitely for a growing company with ongoing capex.
- Forgetting deferred tax when computing purchase price allocation goodwill.

**Interview angle.**
1. *What creates a DTL?* Taxable temporary differences where carrying value exceeds tax base, most commonly faster tax depreciation than book depreciation.
2. *Why might a company's effective tax rate be far below the statutory rate?* Tax incentives, exempt income, recognition of previously unrecognised DTAs, lower rates in foreign subsidiaries, or a regime change.
3. *A loss-making startup shows a large DTA. Concern?* Recognition requires probable future profits. If the path to profitability is uncertain, the asset may be written off, hitting equity.

**Related topics:** [2.6] Depreciation, [2.7] PPA, [23.1] Corporate tax, [4.9] Quality of earnings.

---

### [2.10] Financial Instruments: Classification, Measurement and Expected Credit Loss (Ind AS 109 / 32 / 107)
<!-- tags: domain=financial-accounting; level=advanced; roles=Audit,ER,IB,Fintech-PM,CF; keywords=Ind AS 109, IFRS 9, amortised cost, FVOCI, FVTPL, expected credit loss, ECL stages, SPPI test, business model test, debt vs equity -->

**Definition.** Ind AS 109 (IFRS 9) governs how financial assets and liabilities are classified and measured and how credit losses are provided for. Ind AS 32 decides whether an instrument is debt or equity; Ind AS 107 sets disclosures.

**Why it matters.** For banks, NBFCs and fintech lenders, Ind AS 109 drives the biggest number in the P&L after interest income: credit cost. Classification decides whether market moves hit profit, OCI, or nothing. For companies raising money via convertible or preference instruments, Ind AS 32 can make "equity" look like debt.

**Core mechanics.**

*Classification of financial assets:* two tests.
1. **Business model test:** hold to collect contractual cash flows, hold to collect and sell, or other (trading).
2. **SPPI test:** are cash flows solely payments of principal and interest?

| Business model | SPPI met | Category | Gains/losses |
|---|---|---|---|
| Hold to collect | Yes | Amortised cost | Interest via effective interest rate; ECL in P&L |
| Hold to collect and sell | Yes | FVOCI (debt) | Fair value changes in OCI, recycled to P&L on sale |
| Trading / other | Any | FVTPL | All fair value changes in P&L |
| Equity investments (not held for trading) | n/a | FVOCI election (irrevocable) | Fair value in OCI, never recycled; dividends in P&L |

*Expected credit loss (ECL) model:* forward-looking, replaces the old incurred-loss model.
- **Stage 1** (performing, no significant increase in credit risk): 12-month ECL.
- **Stage 2** (significant increase in credit risk since origination; rebuttable presumption at 30 days past due): lifetime ECL.
- **Stage 3** (credit-impaired; rebuttable presumption at 90 days past due): lifetime ECL; interest on net carrying amount.
- ECL = PD × LGD × EAD (probability of default × loss given default × exposure at default), probability-weighted across scenarios and discounted.
- Simplified approach for trade receivables: lifetime ECL from day one using a provision matrix.

*Debt vs equity (Ind AS 32):* an instrument is a liability if the issuer has a contractual obligation to deliver cash that it cannot avoid. Mandatorily redeemable preference shares are liabilities; a convertible bond is split into a liability and an equity component (compound instrument).

**Worked example.** An NBFC has a ₹100 Cr loan book. LGD is 45%.
- If all loans are Stage 1 with a 12-month PD of 2%: ECL = 100 × 2% × 45% = **₹0.90 Cr**.
- If the same book migrates to Stage 2 with a lifetime PD of 8%: ECL = 100 × 8% × 45% = **₹3.60 Cr**.

The provision quadruples **without any default**, purely because credit risk rose. This "cliff effect" makes ECL pro-cyclical: provisions jump at the start of a downturn.

**Indian context.** NBFCs (above thresholds) report under Ind AS 109 ECL. Scheduled commercial banks still use RBI's incurred-loss provisioning norms (NPA at 90 days overdue, with prescribed provisioning percentages), while RBI has proposed moving banks to an ECL framework [VERIFY: RBI ECL framework directions for banks and effective date, expected April 2027]. NBFCs must also compare Ind AS ECL with RBI's prudential (IRACP) provisions and hold any shortfall in an impairment reserve [VERIFY: RBI March 2020 Ind AS circular for NBFCs].

**Common mistakes.**
- Treating Stage 2 as "default". It is a deterioration signal; loans may still be paying.
- Assuming FVOCI equity gains will ever reach the P&L; they never recycle.
- Classifying compulsorily convertible preference shares (CCPS) automatically as equity; check whether the conversion ratio is fixed (fixed-for-fixed test).

**Interview angle.**
1. *Explain the three ECL stages.* Stage 1: performing, 12-month ECL. Stage 2: significant increase in credit risk, lifetime ECL. Stage 3: credit-impaired, lifetime ECL and interest on net amount.
2. *How does ECL differ from the incurred-loss model?* ECL provides for expected losses from day one using forward-looking information; incurred loss waits for a loss event. ECL recognises losses earlier.
3. *(Fintech) Why does a digital lender's profit fall sharply when it grows fast?* Under ECL, each new loan carries an upfront provision while interest income arrives over time, so rapid disbursement growth depresses near-term profit.

**Related topics:** [19.3] Banking, NPAs and provisioning, [20.3] Credit risk, [21.6] Digital lending.

---

### [2.11] Share-Based Payments (ESOPs): Ind AS 102
<!-- tags: domain=financial-accounting; level=intermediate; roles=Fintech-PM,IB,PE,ER,CF; keywords=Ind AS 102, ESOP, share-based payment, grant date fair value, vesting period, Black-Scholes, dilution, RSU, SAR -->

**Definition.** A share-based payment is a transaction in which an entity receives goods or services (usually employee services) in exchange for its equity instruments (equity-settled) or cash based on its share price (cash-settled).

**Why it matters.** ESOPs are central to startup compensation. They are a real economic cost even though no cash leaves the company, because they dilute existing shareholders. Indian new-age listed companies (Zomato/Eternal, Paytm, Nykaa) have reported large ESOP charges, and analysts debate whether to "add back" ESOP cost in adjusted EBITDA. The usual professional view is that ESOP cost is a real expense.

**Core mechanics.**
- **Equity-settled:** measure at **grant-date fair value** of the options (using Black-Scholes, binomial or Monte Carlo); recognise expense over the vesting period, with a credit to equity (share-based payment reserve). Not remeasured for later share price changes.
- **Service and non-market performance conditions** affect the number of options expected to vest (true-up each period).
- **Market conditions** (e.g., TSR targets) are built into the fair value and not trued up.
- **Cash-settled** (e.g., SARs settled in cash): recognise a liability, remeasured at fair value each reporting date until settlement.
- **Dilution in EPS:** options are included in diluted shares using the treasury stock method.

**Worked example.** On 1 April, a company grants 10,000 options vesting over 4 years (service condition). Grant-date fair value per option = ₹200. All employees are expected to stay.
- Total cost = 10,000 × ₹200 = ₹20,00,000
- Annual expense = **₹5,00,000** for each of 4 years: Dr Employee benefit expense / Cr Share-based payment reserve.
- If at end of year 2 the company expects only 90% to vest: cumulative cost should be 20 lakh × 90% × 2/4 = ₹9 lakh; already booked ₹10 lakh, so year-2 expense = 9 − 5 = **₹4 lakh** (true-up).

**Indian context.** Listed companies' ESOP schemes are governed by the SEBI (Share Based Employee Benefits and Sweat Equity) Regulations 2021, including minimum vesting of one year [VERIFY: SEBI SBEB Regulations 2021]. For employees, the perquisite value (FMV on exercise minus exercise price) is taxed as salary at exercise, and capital gains tax applies on sale; eligible startups have deferral relief on TDS [VERIFY: Income Tax Act s.17(2)(vi) and s.192 startup ESOP deferral]. Promoters generally cannot receive ESOPs under the Companies Act rules except in eligible startups [VERIFY: Companies (Share Capital and Debentures) Rules, Rule 12].

**Common mistakes.**
- Treating ESOP cost as "non-cash, therefore irrelevant". It transfers value from shareholders to employees.
- Remeasuring equity-settled options at the current share price (only cash-settled are remeasured).
- Ignoring dilution when valuing per share.

**Interview angle.**
1. *Should ESOP expense be added back to EBITDA?* For cash flow analysis it is non-cash, but it is a real cost of employee compensation paid in shares. Adding it back flatters profitability; if you add it back, account for dilution in the share count.
2. *How is the ESOP expense calculated?* Grant-date fair value per option × number expected to vest, spread over the vesting period, trued up for forfeitures.
3. *Why do startups prefer ESOPs?* They conserve cash and align employees with long-term value creation; the cost is dilution.

**Related topics:** [2.12] EPS, [14.5] Cap tables, [17.4] Option pricing.

---

### [2.12] Earnings Per Share (Ind AS 33) and Equity Transactions
<!-- tags: domain=financial-accounting; level=foundation; roles=ER,IB,CF,Audit; keywords=EPS, basic EPS, diluted EPS, weighted average shares, treasury stock method, bonus issue, stock split, buyback, rights issue -->

**Definition.** Earnings per share is profit attributable to ordinary shareholders divided by the weighted average number of ordinary shares outstanding. Diluted EPS adjusts for all potentially dilutive instruments (options, warrants, convertibles).

**Why it matters.** EPS drives P/E-based valuation and is the headline number in results. Bonus issues, splits, buybacks and fresh issues change share counts, and interviewers test whether candidates can adjust correctly.

**Core mechanics.**
- **Basic EPS** = (Net profit − preference dividends) / Weighted average ordinary shares.
- Shares issued for cash during the year are weighted by the time outstanding.
- **Bonus issues and stock splits** are applied retrospectively to all periods presented (no new resources were received).
- **Rights issues** at a discount include a bonus element; prior EPS is adjusted using an adjustment factor (fair value before rights / theoretical ex-rights price).
- **Diluted EPS:** add back to earnings any costs that would disappear on conversion (e.g., after-tax interest on convertible bonds); add potential shares. Options use the **treasury stock method**: incremental shares = N × (1 − Exercise price / Average market price). Anti-dilutive instruments are excluded.

*Equity transactions at a glance:*

| Event | Cash | Shares | Equity | EPS effect |
|---|---|---|---|---|
| Bonus issue / split | None | Up | Unchanged (reserves reclassified for bonus) | Down, prior periods restated |
| Fresh issue | In | Up | Up | Depends on use of proceeds |
| Buyback | Out | Down | Down | Up if earnings yield > after-tax cost of cash |
| Dividend | Out | Unchanged | Down | None directly |

**Worked example.** Profit ₹90 Cr. 10 Cr shares at start of the year; 2 Cr new shares issued for cash on 1 October (half-year outstanding). 1 Cr options outstanding with exercise price ₹50; average market price ₹100.
- Weighted shares = 10 + 2 × 6/12 = **11 Cr**
- Basic EPS = 90 / 11 = **₹8.18**
- Treasury stock method: proceeds 1 Cr × ₹50 = ₹50 Cr buys back 50/100 = 0.5 Cr shares; incremental shares = **0.5 Cr**
- Diluted EPS = 90 / 11.5 = **₹7.83**

If instead a 1:1 bonus had been issued during the year, all share counts (current and prior year) double, halving EPS for both years so they stay comparable.

**Indian context.** Indian buybacks are governed by the Companies Act (s.68) and SEBI Buy-back Regulations 2018; post-buyback debt-to-equity generally cannot exceed 2:1 [VERIFY: Companies Act s.68 limits]. From 1 October 2024, buyback proceeds are taxed as deemed dividend in shareholders' hands rather than through a company-level buyback tax [VERIFY: Finance (No. 2) Act 2024 buyback taxation]. The tender-offer route through stock exchanges is the main method; the open-market route is being phased out [VERIFY: SEBI buyback circular phasing out open-market route].

**Common mistakes.**
- Using year-end shares instead of weighted average for fresh issues.
- Forgetting to restate prior-year EPS for bonus issues and splits.
- Including out-of-the-money options in diluted EPS.

**Interview angle.**
1. *Does a stock split create value?* No. It changes the number of shares and the price per share proportionally. It may improve liquidity and retail access.
2. *When is a buyback EPS-accretive?* When the earnings yield on repurchased shares (1 / P/E) exceeds the after-tax return forgone on the cash used (or after-tax cost of debt if borrowed).
3. *Why use the treasury stock method?* It assumes option proceeds are used to buy back shares at the average market price, so only the net new shares dilute.

**Related topics:** [2.11] ESOPs, [8.8] Dividend and buyback policy, [10.11] P/E valuation, [12.3] Accretion/dilution.

---

### [2.13] Foreign Currency Transactions and Hyperinflation Basics (Ind AS 21)
<!-- tags: domain=financial-accounting; level=intermediate; roles=Audit,CF,ER,IB; keywords=Ind AS 21, functional currency, presentation currency, monetary items, exchange difference, translation reserve, foreign operation -->

**Definition.** Ind AS 21 sets how to record transactions in foreign currencies and how to translate the financial statements of foreign operations into the reporting entity's presentation currency.

**Why it matters.** Indian IT services, pharma exporters and companies with foreign borrowings (ECBs) carry large currency exposures. Exchange gains and losses can swing reported profit, and analysts separate them from operating performance.

**Core mechanics.**
- **Functional currency:** the currency of the primary economic environment in which the entity operates (drives sales prices, costs, financing). **Presentation currency** is what the statements are reported in.
- **Initial recognition:** at the spot rate on the transaction date.
- **At reporting date:** monetary items (cash, receivables, payables, loans) are retranslated at the closing rate, with differences in **P&L**. Non-monetary items at historical cost (PPE, inventory) stay at historical rates.
- **Translation of a foreign operation:** assets and liabilities at closing rate; income and expenses at transaction (or average) rates; differences go to **OCI** (foreign currency translation reserve), recycled to P&L on disposal.

**Worked example.** An Indian exporter invoices a US client USD 1,00,000 when USD/INR = 83.00. At year end, the rate is 85.00; payment is received later at 84.00.
- Initial: receivable and revenue ₹83,00,000.
- Year end: receivable retranslated to ₹85,00,000 → **exchange gain ₹2,00,000** in P&L. Revenue stays at ₹83,00,000.
- On collection at 84.00: cash ₹84,00,000 → **exchange loss ₹1,00,000** vs year-end value. Net gain over life = ₹1,00,000.

**Indian context.** Ind AS 21 includes an optional carve-out (Ind AS 101 transition) allowing companies to continue the old AS 11 policy of capitalising or amortising exchange differences on long-term foreign currency monetary items recognised before transition [VERIFY: Ind AS 101 para D13AA]. Many Indian companies hedge through forwards and options; hedge accounting under Ind AS 109 can defer gains and losses in OCI.

**Common mistakes.**
- Retranslating revenue at the year-end rate (revenue stays at the transaction-date rate).
- Treating translation reserve movements as operating performance.
- Retranslating inventory or PPE (non-monetary items at cost are not retranslated).

**Interview angle.**
1. *Rupee depreciates 5%. Effect on an IT services company?* Revenue in rupees rises (most billing in USD), margins expand as costs are largely in INR; hedges may offset part of the gain in the short term.
2. *Where do translation differences on a foreign subsidiary go?* OCI, in the foreign currency translation reserve, recycled to P&L on disposal.
3. *Monetary vs non-monetary item?* Monetary items are rights or obligations to receive or pay a fixed or determinable number of currency units (cash, receivables, loans); non-monetary items are everything else (inventory, PPE, advances for goods).

**Related topics:** [22.3] FX markets and hedging, [17.7] Currency derivatives, [5.3] Consolidation.

---

## Module 2 Glossary

| Term | Definition |
|---|---|
| Accrual basis | Recording transactions when they occur, not when cash moves |
| Contract liability | Consideration received before revenue is earned (deferred revenue) |
| Contingent liability | Possible obligation disclosed but not recognised |
| Deferred tax liability | Future tax payable from taxable temporary differences |
| Expected credit loss | Probability-weighted estimate of credit losses (PD × LGD × EAD) |
| FVOCI | Measurement at fair value with changes in other comprehensive income |
| Goodwill | Price paid above fair value of identifiable net assets in an acquisition |
| Impairment | Write-down of an asset whose carrying amount exceeds recoverable amount |
| Net realisable value | Expected selling price less costs to complete and sell |
| Performance obligation | Distinct promise to transfer a good or service to a customer |
| Provision | Liability of uncertain timing or amount, recognised when probable and estimable |
| Recoverable amount | Higher of fair value less costs of disposal and value in use |
| Right-of-use asset | Lessee's asset representing the right to use a leased item |
| Standalone selling price | Price at which an item would be sold separately |
| Treasury stock method | Diluted share calculation assuming option proceeds buy back shares |

## Module 2 Rapid-Fire Quiz

1. Is LIFO permitted under Ind AS? **No**
2. Lawsuit with 30% chance of loss: provision or disclosure? **Disclosure as contingent liability**
3. Under Ind AS 116, what happens to EBITDA for a lessee? **It increases (rent replaced by depreciation and interest)**
4. Recoverable amount uses the higher or lower of FVLCD and value in use? **Higher**
5. Research costs: capitalise or expense? **Expense**
6. Is goodwill amortised under Ind AS? **No; tested annually for impairment**
7. ECL stage with lifetime ECL but loan still performing? **Stage 2**
8. Book carrying amount 80, tax base 60, rate 25%: DTL? **₹5**
9. Bonus issue effect on prior-year EPS? **Restated downward (shares adjusted retrospectively)**
10. Marketplace with GMV ₹500 Cr and 10% commission as agent: revenue? **₹50 Cr**

## Module 2 [VERIFY] Items

1. Companies (Indian Accounting Standards) Rules 2015: applicability thresholds
2. RBI/IRDAI Ind AS implementation status for banks and insurers
3. Companies (Accounts) Rules 2014 audit-trail (edit log) requirement
4. Schedule III Division II disclosure requirements
5. DPIIT FDI policy on e-commerce inventory model
6. ICDS II on inventory valuation
7. CARO 2020 clause 3(ii) inventory verification threshold
8. Schedule II useful lives
9. Income-tax Act 2025 commencement and depreciation provisions
10. Ind AS 103 bargain purchase treatment (capital reserve)
11. AS 14 amalgamation goodwill amortisation
12. Finance Act 2021: goodwill no longer depreciable for tax
13. Section 115BAA / 115JB (MAT) and equivalents under the Income-tax Act 2025
14. RBI ECL framework for banks and effective date
15. RBI circular on Ind AS for NBFCs (impairment reserve)
16. SEBI SBEB and Sweat Equity Regulations 2021
17. ESOP perquisite tax and startup TDS deferral
18. Companies (Share Capital and Debentures) Rules, ESOPs to promoters
19. Companies Act s.68 buyback limits
20. Finance (No. 2) Act 2024 buyback taxation in shareholders' hands
21. SEBI phase-out of open-market buybacks
22. Ind AS 101 para D13AA exchange difference carve-out

---

# Module 3: The Three Financial Statements

## 3A. The Statements

### [3.1] The Income Statement (Statement of Profit and Loss)
<!-- tags: domain=three-statements; level=foundation; roles=IB,PE,ER,CF,Audit,Consulting,Fintech-PM; keywords=income statement, profit and loss, revenue, gross profit, EBITDA, EBIT, PBT, PAT, other comprehensive income, Schedule III -->

**Definition.** The income statement reports an entity's revenue, expenses and profit over a period (a quarter or a year). Under Ind AS it is the Statement of Profit and Loss, which also includes Other Comprehensive Income (OCI).

**Why it matters.** It answers "did the business make money this period, and how?" Each subtotal (gross profit, EBITDA, EBIT, PAT) isolates a different driver: pricing power, operating efficiency, capital intensity, financing and tax.

**Core mechanics.** Typical analytical layout:

| Line | What it shows |
|---|---|
| Revenue from operations | Sales of goods and services, net of returns, discounts, GST |
| − Cost of goods sold (materials, change in inventories, direct costs) | Direct cost of what was sold |
| **= Gross profit** | Pricing power and production efficiency |
| − Employee benefit expense, other operating expenses (SG&A) | Overheads, marketing, rent (if not Ind AS 116), R&D |
| **= EBITDA** | Operating cash profit proxy before capital intensity, financing, tax |
| − Depreciation and amortisation | Consumption of long-term assets |
| **= EBIT (operating profit)** | Profit from operations, independent of financing |
| + Other income (treasury income, dividends) | Non-operating income; analyse separately |
| − Finance costs | Interest on debt and lease liabilities |
| ± Exceptional items | One-offs (restructuring, impairments, gains on sale) |
| **= Profit before tax (PBT)** | |
| − Tax expense (current + deferred) | |
| **= Profit after tax (PAT)** | Attributable to owners and non-controlling interests |
| + Other comprehensive income | FVOCI gains, actuarial gains/losses, translation differences |
| **= Total comprehensive income** | |

*Other comprehensive income* contains gains and losses that bypass profit: remeasurement of defined benefit plans, FVOCI equity investments (never recycled), FVOCI debt and cash flow hedges and foreign currency translation (recycled to P&L later).

**Worked example.** Company Alpha Ltd (₹ Cr):

| Line | ₹ Cr | Margin |
|---|---|---|
| Revenue | 1,000 | |
| COGS | (600) | |
| Gross profit | 400 | 40% |
| SG&A and employee costs | (200) | |
| EBITDA | 200 | 20% |
| D&A | (50) | |
| EBIT | 150 | 15% |
| Interest | (30) | |
| PBT | 120 | |
| Tax @25% | (30) | |
| PAT | 90 | 9% |

**Indian context.** Schedule III of the Companies Act prescribes the format by nature of expense (materials, employee costs, finance costs, D&A, other expenses), not by function. EBITDA is not a defined line; companies may present it in investor presentations, and SEBI-listed companies' quarterly results follow the SEBI LODR formats [VERIFY: SEBI LODR Regulation 33 formats]. Revenue is reported net of GST.

**Global differences.** IFRS 18 (effective for periods beginning 1 January 2027) introduces mandatory subtotals ("operating profit", "profit before financing and income taxes") and rules for management-defined performance measures [VERIFY: IFRS 18 effective date and Ind AS adoption plan].

**Common mistakes.**
- Including other income (interest on surplus cash) in operating profit.
- Treating recurring "exceptional items" as one-offs.
- Comparing EBITDA margins across companies on different lease accounting.

**Interview angle.**
1. *Why look at EBITDA?* It approximates operating cash generation before capital structure, tax and capital intensity, enabling cross-company comparison. Weaknesses: ignores capex, working capital, taxes and interest.
2. *What is OCI?* Gains and losses that bypass profit, such as actuarial remeasurements, FVOCI fair value changes and translation differences.
3. *Revenue grew 20%, PAT grew 5%. Where would you look?* Gross margin (input costs, pricing), operating leverage (opex growth), D&A (new capex), interest (new debt), tax rate and exceptional items.

**Related topics:** [3.2] Balance sheet, [3.3] Cash flow statement, [4.3] Profitability ratios.

---

### [3.2] The Balance Sheet
<!-- tags: domain=three-statements; level=foundation; roles=IB,PE,ER,CF,Audit,Consulting; keywords=balance sheet, assets, liabilities, equity, current assets, net worth, working capital, retained earnings, Schedule III -->

**Definition.** The balance sheet shows an entity's assets, liabilities and equity at a single point in time. Assets = Liabilities + Equity.

**Why it matters.** The income statement shows a period's performance; the balance sheet shows the resources used to generate it and how they are financed. Liquidity, solvency, capital efficiency (ROE, ROCE) and valuation (book value, net debt) all depend on it.

**Core mechanics.** Schedule III layout (equity and liabilities, then assets):

| Section | Key items |
|---|---|
| **Equity** | Equity share capital; other equity (securities premium, retained earnings, general reserve, OCI reserves, share-based payment reserve) |
| Non-controlling interest | Minority shareholders' share of subsidiaries |
| **Non-current liabilities** | Long-term borrowings, lease liabilities, deferred tax liabilities, long-term provisions (gratuity) |
| **Current liabilities** | Short-term borrowings, current maturities of long-term debt, trade payables, other financial liabilities, contract liabilities, short-term provisions |
| **Non-current assets** | PPE, capital work-in-progress, ROU assets, goodwill, intangibles, investments, deferred tax assets, long-term loans |
| **Current assets** | Inventories, trade receivables, cash and equivalents, other bank balances, short-term investments, other current assets |

*Current vs non-current:* an item is current if expected to be realised or settled within 12 months or the normal operating cycle.

*Key derived measures:*
- Net worth (book equity) = Total assets − Total liabilities.
- Net working capital = Current assets − Current liabilities; operating working capital excludes cash and debt.
- Net debt = Total borrowings (+ lease liabilities, if consistent) − Cash and liquid investments.
- Capital employed = Equity + Net debt (or Total assets − Current liabilities).

**Worked example.** Alpha Ltd balance sheet (₹ Cr):

| Assets | | Liabilities and equity | |
|---|---|---|---|
| Cash | 50 | Trade payables | 100 |
| Receivables | 150 | Other current liabilities | 50 |
| Inventory | 120 | Short-term debt | 50 |
| Other current assets | 30 | **Current liabilities** | **200** |
| **Current assets** | **350** | Long-term debt | 250 |
| Net PPE | 500 | Equity | 450 |
| Intangibles | 50 | | |
| **Total** | **900** | **Total** | **900** |

- Net working capital = 350 − 200 = ₹150 Cr
- Operating working capital = (150 + 120 + 30) − (100 + 50) = ₹150 Cr
- Net debt = 50 + 250 − 50 = **₹250 Cr**
- Capital employed = 450 + 300 = ₹750 Cr (equity + gross debt)

**Indian context.** Indian balance sheets commonly show capital work-in-progress (CWIP) separately with ageing schedules, and Schedule III requires ageing of receivables and payables, disclosure of promoter shareholding and key ratios with explanations for changes over 25% [VERIFY: Schedule III amendments, March 2021]. Gratuity and leave encashment provisions are common long-term liabilities.

**Common mistakes.**
- Treating book value as market value; book values of brands and talent are often zero.
- Ignoring off-balance-sheet obligations (guarantees, commitments) disclosed in notes.
- Counting cash trapped in restricted accounts or overseas as fully available.

**Interview angle.**
1. *Can a profitable company have negative equity?* Yes, if it returned large amounts via buybacks or dividends, or carries accumulated losses from the past. Several US consumer brands run negative book equity because of buybacks.
2. *What's the difference between working capital and operating working capital?* Working capital is current assets minus current liabilities; operating working capital strips out cash, short-term debt and investments to isolate operational needs.
3. *Why does the balance sheet always balance?* Every transaction affects at least two accounts with equal debits and credits; profit flows into retained earnings within equity.

**Related topics:** [3.1] Income statement, [3.4] Linkages, [4.4] Liquidity, [4.5] Leverage.

---

### [3.3] The Cash Flow Statement (Ind AS 7)
<!-- tags: domain=three-statements; level=foundation; roles=IB,PE,ER,CF,Audit,Consulting,Fintech-PM; keywords=cash flow statement, CFO, CFI, CFF, indirect method, direct method, free cash flow, Ind AS 7, non-cash items, working capital changes -->

**Definition.** The cash flow statement reports cash inflows and outflows over a period, split into operating (CFO), investing (CFI) and financing (CFF) activities.

**Why it matters.** Profit is an opinion; cash is a fact. Companies go bankrupt from running out of cash, not from reporting losses. The cash flow statement shows whether profit converts to cash, how much is reinvested, and how the business is funded. Fraud often shows up as a persistent gap between profit and operating cash flow.

**Core mechanics.**

*Indirect method for CFO (most common):*

| Line | Direction |
|---|---|
| Net profit (or PBT, as in Indian practice) | Start |
| + Depreciation and amortisation, impairments | Add back non-cash expenses |
| + ESOP expense, unrealised FX losses | Add back non-cash |
| − Gains on sale of assets | Remove (proceeds go in CFI) |
| + Finance cost, − interest/dividend income | Reclassify (if starting from PBT) |
| − Increase in receivables, inventory, other operating assets | Cash tied up |
| + Increase in payables, other operating liabilities, deferred revenue | Cash freed |
| − Taxes paid | Actual cash taxes |
| **= Cash from operations** | |

*Investing:* capex, purchase/sale of investments, acquisitions, asset disposals, interest and dividends received (Indian practice usually puts these in investing for non-financial companies).

*Financing:* debt raised/repaid, equity issued, buybacks, dividends paid, interest paid (commonly in financing), lease principal payments.

*Direct method:* lists actual receipts from customers and payments to suppliers and employees. Encouraged, rarely used.

*Free cash flow:*
- FCF (simple) = CFO − Capex
- FCFF = EBIT × (1 − t) + D&A − Capex − Increase in NWC
- FCFE = FCFF − Interest × (1 − t) + Net borrowing

**Worked example.** Gamma Ltd (₹ Cr): net profit 100; D&A 30; receivables up 20; inventory up 15; payables up 10; capex 50; debt repaid 20; dividends 15.

| Section | Calculation | ₹ Cr |
|---|---|---|
| CFO | 100 + 30 − 20 − 15 + 10 | **105** |
| CFI | −50 | **(50)** |
| CFF | −20 − 15 | **(35)** |
| Net change in cash | 105 − 50 − 35 | **+20** |
| FCF | 105 − 50 | **55** |

**Indian context.** Indian companies typically start the indirect method from PBT (not PAT) and show taxes paid separately. Ind AS 7 requires a reconciliation of liabilities arising from financing activities (debt movements, both cash and non-cash). Classification of interest and dividends received and paid is a policy choice for non-financial entities; check notes before comparing CFO across companies.

**Common mistakes.**
- Calling "net change in cash" the same as free cash flow.
- Ignoring that CFO can be flattered by stretching payables, factoring receivables, or classifying capex-like spend as investing.
- Forgetting lease principal (CFF) when comparing FCF after Ind AS 116; a fair FCF for a retailer subtracts lease payments.

**Interview angle.**
1. *Which statement is most important if you can only have one?* The cash flow statement, because it shows real cash generation and is hardest to manipulate. With two, choose the balance sheet and cash flow statement, since the income statement can be largely reconstructed from them.
2. *How can a company have positive profit and negative CFO?* Rapid growth that ties up cash in receivables and inventory, aggressive revenue recognition, or large tax payments.
3. *Why do we add back depreciation?* It is a non-cash expense; the cash was spent when the asset was bought (shown in investing).

**Related topics:** [3.4] Linkages, [4.8] Cash flow analysis, [10.2] FCFF and FCFE.

---

### [3.4] How the Three Statements Link Together
<!-- tags: domain=three-statements; level=foundation; roles=IB,PE,ER,CF,Consulting; keywords=three statement linkages, retained earnings, cash reconciliation, net income flow, balance sheet roll-forward, financial model linkage -->

**Definition.** The three statements are connected: net income flows from the income statement to retained earnings and to the top of the cash flow statement; the cash flow statement explains the change in the balance sheet's cash; balance sheet changes in working capital, PPE and debt are reflected in the cash flow statement.

**Why it matters.** "Walk me through how the three statements link" is among the most common finance interview questions. It is also the backbone of every financial model.

**Core mechanics: the key links.**
1. **Net income** → bottom of income statement → top of CFO → retained earnings (RE closing = RE opening + Net income − Dividends).
2. **D&A** → expense in income statement → added back in CFO → reduces PP&E on balance sheet (PP&E closing = opening + Capex − D&A − Disposals − Impairment).
3. **Working capital** → changes in receivables, inventory, payables on the balance sheet → adjustments in CFO.
4. **Capex** → CFI outflow → increases PP&E.
5. **Debt and equity** → CFF flows → change debt and share capital balances.
6. **Interest** → income statement expense, depends on debt balance (a circular reference in models).
7. **Ending cash** from the cash flow statement = cash on the balance sheet.

**Worked example: depreciation increases by ₹10 (tax rate 25%).**

| Statement | Effect |
|---|---|
| Income statement | EBIT −10; tax −2.5; net income **−7.5** |
| Cash flow statement | Net income −7.5; add back D&A +10; CFO **+2.5** (the tax saving); cash **+2.5** |
| Balance sheet | PP&E −10; cash +2.5; total assets **−7.5**. Retained earnings −7.5; equity **−7.5**. Balances. |

Depreciation itself is non-cash, but it creates real cash savings through lower taxes (the "depreciation tax shield").

**Indian context.** The same logic applies under Ind AS. A practical difference: Indian statements start the cash flow at PBT, so the walkthrough is "PBT falls by 10, tax paid falls by 2.5, D&A add-back +10, CFO +2.5". The end result is identical.

**Common mistakes.**
- Forgetting the tax effect (saying net income falls by the full amount).
- Saying cash falls when depreciation rises.
- Failing to make the balance sheet balance at the end of the walkthrough.

**Interview angle.**
1. *Walk me through the three statements.* Income statement shows revenue to net income. Net income goes to the top of the cash flow statement, which adjusts for non-cash items and working capital to get CFO, then adds investing and financing to get the change in cash. That cash flows to the balance sheet, where net income less dividends also increases retained earnings, and PP&E, working capital and debt reflect the cash flow items. The balance sheet balances.
2. *If you could pick two statements to build the third, which?* Balance sheet (opening and closing) plus income statement lets you derive the cash flow statement.
3. *Where does a dividend appear?* Not on the income statement; it reduces retained earnings and cash, and is a financing outflow.

**Related topics:** [3.5] More scenarios, [11.3] Three-statement model build.

---

### [3.5] Three-Statement Scenarios: Interview Drills
<!-- tags: domain=three-statements; level=intermediate; roles=IB,PE,ER,CF; keywords=three statement scenarios, inventory write-down, debt issuance, asset sale, accrued expense, prepaid, share issue, interview drill -->

**Definition.** These drills test the ability to trace a single transaction through the income statement, cash flow statement and balance sheet. Assume a 25% tax rate throughout.

**Why it matters.** Investment banking, PE and equity research interviews routinely use these questions to test fluency. The method is always the same: income statement first, then cash flow, then balance sheet, and check it balances.

**Core mechanics: method.**
1. Does it hit the income statement? If yes, compute the after-tax effect on net income.
2. On the cash flow statement: start with net income change, adjust for non-cash items and working capital, then any investing/financing flows; find the change in cash.
3. On the balance sheet: update cash and other assets; liabilities; equity (retained earnings by the net income change).
4. Check: change in assets = change in liabilities + equity.

**Worked examples.**

*A. Inventory write-down of ₹100*
- IS: pre-tax −100; net income −75.
- CFS: NI −75; add back write-down (non-cash) +100; CFO +25; cash **+25**.
- BS: inventory −100, cash +25 → assets −75. RE −75. Balances.

*B. Company raises ₹100 of debt*
- IS: no change (until interest accrues).
- CFS: CFF +100; cash **+100**.
- BS: cash +100; debt +100. Balances.

*C. Interest of ₹10 on that debt is paid in cash*
- IS: interest −10; net income −7.5.
- CFS: NI −7.5; cash **−7.5** (interest in CFO or CFF per policy).
- BS: cash −7.5; RE −7.5.

*D. Company buys equipment for ₹100 cash*
- IS: no immediate change.
- CFS: CFI −100; cash −100.
- BS: cash −100; PP&E +100. Assets unchanged.

*E. Asset with book value ₹100 sold for ₹120*
- IS: gain +20; tax −5; net income +15.
- CFS: NI +15; subtract gain −20 (non-operating); CFO −5 (the tax paid); CFI +120; cash **+115**.
- BS: cash +115; PP&E −100 → assets +15. RE +15.

*F. Customer prepays ₹100 for next year's service*
- IS: no change (revenue not yet earned).
- CFS: increase in deferred revenue +100 in CFO; cash +100.
- BS: cash +100; contract liability +100.

*G. Accrued bonus of ₹100 (not yet paid)*
- IS: expense −100; net income −75.
- CFS: NI −75; increase in accrued liabilities +100; CFO +25; cash **+25** (tax saving, assuming tax deduction allowed now; in India, bonus is deductible only on payment under the tax law, which would create a DTA instead) [VERIFY: Income Tax Act s.43B].
- BS: cash +25; accrued liabilities +100; RE −75. Assets +25 = Liabilities +100 + Equity −75.

*H. Issue ₹100 of new equity*
- CFS: CFF +100. BS: cash +100; share capital and premium +100.

**Indian context.** Section 43B of the Income Tax Act allows certain expenses (bonus, statutory dues, interest to banks, payments to micro and small enterprises beyond agreed credit periods) only on actual payment, so book and tax timing often differ [VERIFY: s.43B including clause (h) on MSME payments].

**Common mistakes.**
- Treating a debt raise or equity issue as income.
- In an asset sale, counting the full proceeds in CFO.
- Forgetting to subtract the gain in CFO (double counting the proceeds).

**Interview angle.**
1. *A company buys inventory on credit for ₹100. Effect?* No IS effect. BS: inventory +100, payables +100. CFS: inventory increase −100 and payables increase +100 net to zero; cash unchanged.
2. *Goodwill is impaired by ₹100 (not tax-deductible). Effect?* Net income −100 (no tax shield). CFO add-back +100; cash unchanged. Goodwill −100; RE −100.
3. *Why does an inventory write-down increase cash?* It doesn't directly; the tax deduction reduces cash taxes (if deductible), so cash rises by the tax saving.

**Related topics:** [3.4] Linkages, [2.5] Inventory, [2.9] Deferred tax.

---

## 3B. Working Capital and Equity Movements

### [3.6] Working Capital and the Cash Conversion Cycle
<!-- tags: domain=three-statements; level=foundation; roles=CF,PE,Consulting,ER,Fintech-PM; keywords=working capital, cash conversion cycle, DSO, DIO, DPO, negative working capital, supply chain finance, receivables -->

**Definition.** Operating working capital is the investment tied up in running day-to-day operations (receivables + inventory − payables). The cash conversion cycle (CCC) is the number of days between paying suppliers and collecting cash from customers.

**Why it matters.** A growing business consumes cash through working capital even when profitable. Negative working capital models (customers pay before suppliers are paid) let companies grow on suppliers' money: think quick-commerce, D-Mart's supplier terms, subscription businesses and marketplaces. Working capital financing is also a major fintech opportunity (invoice discounting, TReDS, supply chain finance).

**Core mechanics.**
- DSO (days sales outstanding) = Average receivables / Revenue × 365
- DIO (days inventory outstanding) = Average inventory / COGS × 365
- DPO (days payables outstanding) = Average payables / COGS × 365
- **CCC = DSO + DIO − DPO**
- Working capital investment required for growth ≈ Revenue increase × (Operating working capital / Revenue)

**Worked example.** A company has DSO 45, DIO 60, DPO 50.
- CCC = 45 + 60 − 50 = **55 days**
- With revenue of ₹365 Cr (₹1 Cr per day of sales, roughly), each day of CCC ties up about ₹1 Cr. Cutting CCC by 10 days releases about ₹10 Cr of cash (approximate; DIO and DPO use COGS).
- Growth effect: if operating working capital is 15% of revenue and revenue grows by ₹200 Cr, the business needs ₹30 Cr of additional working capital, funded by cash flow or debt.

**Indian context.** The MSME Development Act requires buyers to pay micro and small suppliers within 45 days (where agreed) and the tax law disallows deductions for late payments under s.43B(h) [VERIFY: MSMED Act s.15 and s.43B(h) from FY2023-24]. TReDS platforms (RXIL, M1xchange, Invoicemart, plus newer entrants) let MSMEs discount invoices on large corporate buyers [VERIFY: current list of RBI-authorised TReDS platforms].

**Common mistakes.**
- Calculating DPO on revenue instead of COGS.
- Assuming negative working capital is always good; it can reflect stretched suppliers, a fragile position if growth slows.
- Ignoring seasonality; year-end balances may not represent the average.

**Interview angle.**
1. *Why can fast growth bankrupt a profitable company?* Working capital and capex needs grow ahead of cash collection, so cash runs out even with reported profits.
2. *How can a company improve its CCC?* Collect faster (discounts for early payment, better credit control), hold less inventory (demand forecasting, JIT), and negotiate longer supplier terms, while protecting supplier relationships.
3. *Give an example of a negative working capital business.* Quick-commerce, food delivery and airlines (customers pay upfront; suppliers paid later); subscription software with annual prepayment.

**Related topics:** [4.6] Efficiency ratios, [8.9] Working capital management, [22.7] Supply chain finance.

---

### [3.7] Statement of Changes in Equity and Notes to Accounts
<!-- tags: domain=three-statements; level=foundation; roles=Audit,ER,IB,CF; keywords=statement of changes in equity, retained earnings, reserves, securities premium, notes to accounts, accounting policies, related party, segment -->

**Definition.** The statement of changes in equity (SOCIE) reconciles opening and closing balances of each component of equity. The notes to accounts explain accounting policies, judgments, breakdowns of line items and items not recognised (contingencies, commitments).

**Why it matters.** Equity movements reveal capital allocation (dividends, buybacks, issuances) and items bypassing profit (OCI). The notes contain most of the information an analyst actually needs: revenue policy, segment data, related-party transactions, debt maturity, contingent liabilities.

**Core mechanics.**

*SOCIE components:* share capital, securities premium, retained earnings, general reserve, OCI reserves (FVOCI, cash flow hedge, translation), share-based payment reserve, capital redemption reserve (created on buybacks out of free reserves).

*Roll-forward:* Opening balance + Profit + OCI − Dividends ± Share issues/buybacks ± Transfers between reserves = Closing balance.

*Notes worth reading first (analyst priority list):*
1. Significant accounting policies and judgments (revenue, capitalisation, ECL)
2. Segment information
3. Related-party transactions
4. Borrowings: maturity, rates, covenants, security
5. Contingent liabilities and commitments
6. Auditor's report (modified opinion, emphasis of matter, key audit matters)
7. Subsequent events

**Worked example.** Retained earnings opening ₹300 Cr; profit ₹90 Cr; dividend ₹30 Cr; transfer to general reserve ₹10 Cr.
- Closing retained earnings = 300 + 90 − 30 − 10 = **₹350 Cr**
- Total equity rises by 90 − 30 = ₹60 Cr (the transfer moves value between reserves without changing total equity).

**Indian context.** Indian annual reports also contain the Board's Report, Management Discussion and Analysis (MD&A), Corporate Governance Report, and for the top 1,000 listed companies the Business Responsibility and Sustainability Report (BRSR) [VERIFY: SEBI LODR Reg 34 BRSR applicability]. Related-party transactions above materiality thresholds need audit committee and shareholder approval under SEBI LODR Reg 23 [VERIFY: current RPT materiality thresholds].

**Common mistakes.**
- Skipping the notes and relying on headline statements.
- Missing large dividends or buybacks funded by debt (visible in SOCIE plus CFF).
- Ignoring OCI losses that never touch profit (e.g., actuarial losses on gratuity).

**Interview angle.**
1. *Which notes do you read first in an annual report?* Accounting policies, segment data, related-party transactions, borrowings, contingent liabilities and the auditor's report.
2. *Why does a transfer to general reserve not change total equity?* It reallocates within equity; it is an appropriation, not an expense.
3. *What is securities premium?* The amount received above the face value of shares issued; it can be used for bonus issues, buybacks and writing off issue expenses, but not for dividends.

**Related topics:** [5.4] Annual report anatomy, [6.7] Auditor's report, [2.12] Equity transactions.

---

## Module 3 Glossary

| Term | Definition |
|---|---|
| Capital employed | Equity plus debt (or total assets minus current liabilities) |
| Cash conversion cycle | DSO + DIO − DPO |
| CFO / CFI / CFF | Cash from operating / investing / financing activities |
| EBIT | Earnings before interest and tax |
| EBITDA | Earnings before interest, tax, depreciation and amortisation |
| Free cash flow | CFO minus capital expenditure |
| Indirect method | CFO derived from profit by adjusting non-cash items and working capital |
| Net debt | Borrowings minus cash and liquid investments |
| Net worth | Total assets minus total liabilities |
| Operating working capital | Receivables + inventory + other operating assets − payables − other operating liabilities |
| Other comprehensive income | Gains and losses bypassing profit |
| PAT | Profit after tax |
| Retained earnings | Cumulative profits not distributed as dividends |
| SOCIE | Statement of changes in equity |
| Total comprehensive income | Profit plus other comprehensive income |

## Module 3 Rapid-Fire Quiz

1. D&A rises ₹20 at 25% tax: change in cash? **+₹5**
2. Company issues ₹50 Cr debt: effect on net income? **None**
3. DSO 30, DIO 40, DPO 60: CCC? **10 days**
4. Is a dividend an expense? **No; it reduces retained earnings**
5. Asset with book ₹50 sold for ₹40 (25% tax): net income change? **−₹7.5**
6. Customer prepays ₹100: cash and revenue change? **Cash +100; revenue 0**
7. Which section holds capex? **Investing**
8. Inventory bought on credit: change in cash? **None**
9. Retained earnings 200 + profit 50 − dividend 20 = ? **230**
10. Where does ending cash on the CFS appear? **Balance sheet cash**

## Module 3 [VERIFY] Items

1. SEBI LODR Regulation 33 result formats
2. IFRS 18 effective date and Ind AS adoption plan
3. Schedule III amendments (ageing schedules, ratios, promoter shareholding)
4. Income Tax Act s.43B deductions on payment basis, including s.43B(h) MSME payments
5. MSMED Act s.15 payment timelines
6. RBI-authorised TReDS platforms
7. SEBI LODR Reg 34 BRSR applicability
8. SEBI LODR Reg 23 related-party transaction materiality thresholds

---

# Module 4: Financial Statement Analysis

> **Reference company for this module: Alpha Ltd (₹ Cr).** Current year: Revenue 1,000; COGS 600; Gross profit 400; SG&A 200; EBITDA 200; D&A 50; EBIT 150; Interest 30; PBT 120; Tax 30; PAT 90. Balance sheet: Cash 50; Receivables 150; Inventory 120; Other current assets 30; Net PPE 500; Intangibles 50; Total assets 900; Payables 100; Other current liabilities 50; Short-term debt 50; Long-term debt 250; Equity 450. Prior year: Revenue 900; Total assets 840; Equity 410; Receivables 120; Inventory 110; Payables 95. Cash flow: CFO 105; Capex 80. Market: 10 Cr shares at ₹135; dividend ₹3/share.

## 4A. Framework and Core Ratios

### [4.1] A Framework for Analysing Financial Statements
<!-- tags: domain=financial-statement-analysis; level=foundation; roles=ER,IB,PE,CF,Consulting,Audit; keywords=financial analysis framework, business model, ratio analysis, peer comparison, trend analysis, red flags, annual report reading -->

**Definition.** Financial statement analysis is the structured evaluation of a company's statements to judge its profitability, growth, efficiency, liquidity, solvency, cash generation and earnings quality, usually relative to its own history and its peers.

**Why it matters.** Ratios alone mean little. A 5% net margin is excellent for a grocery retailer and poor for a software company. A framework keeps analysis tied to the business model and the decision at hand: lending, investing, acquiring or advising.

**Core mechanics: a six-step approach.**
1. **Understand the business and industry.** How does it make money? What are the value drivers (volume, price, mix, utilisation, take rate)? Use Porter's five forces and the company's MD&A.
2. **Assess accounting quality.** Read accounting policies, auditor's report, related-party notes; adjust for one-offs and policy differences (leases, capitalisation, revenue gross vs net).
3. **Analyse ratios** across six dimensions: profitability, efficiency, liquidity, solvency, cash flow, valuation.
4. **Compare** over time (trend, at least 5 years to cover a cycle) and against peers (cross-section).
5. **Explain the drivers** behind changes (DuPont decomposition, margin bridges).
6. **Forecast and conclude** for the decision (credit rating, valuation, investment thesis).

*Purpose drives focus:*

| User | Primary questions | Key ratios |
|---|---|---|
| Lender | Can they repay? | Interest coverage, DSCR, net debt/EBITDA, current ratio |
| Equity investor | Will value grow? | ROE, ROIC vs WACC, growth, FCF, valuation multiples |
| Acquirer | What are we buying? | Quality of earnings, normalised EBITDA, working capital peg |
| Supplier | Will they pay? | Liquidity, DPO trend |
| Management / consultant | Where to improve? | Margin and efficiency drivers vs peers |

**Worked example.** Alpha's net margin is 9%. Is that good?
- Against a peer group of industrial manufacturers averaging 7%: above average.
- Against its own history (11% three years ago): declining. Next step is a margin bridge: gross margin (input costs), SG&A ratio (operating leverage), interest (new debt), tax.
- Conclusion depends on drivers, not the number.

**Indian context.** Primary sources: annual reports and quarterly results (BSE/NSE filings), investor presentations, earnings call transcripts, credit rating rationales (CRISIL, ICRA, CARE, India Ratings), and MCA filings for private companies. Credit rating rationales are an underused source of independent analysis of Indian companies.

**Common mistakes.**
- Comparing ratios across industries with different business models.
- Using a single year; one-offs distort.
- Treating ratios as answers rather than questions.

**Interview angle.**
1. *How would you analyse a company in 30 minutes?* Business model from the annual report; 5-year trend of revenue growth, margins, ROE/ROCE and CFO vs PAT; leverage and liquidity; auditor's report and contingent liabilities; compare with two peers.
2. *What are the limitations of ratio analysis?* Based on historical, accounting-driven numbers; policy differences; window dressing at year-end; inflation; no single ratio tells the full story.

**Related topics:** [4.2] Common-size analysis, [4.7] DuPont, [4.9] Quality of earnings.

---

### [4.2] Common-Size and Trend Analysis
<!-- tags: domain=financial-statement-analysis; level=foundation; roles=ER,Consulting,CF,PE; keywords=common-size statements, vertical analysis, horizontal analysis, trend analysis, CAGR, indexation, margin bridge -->

**Definition.** Common-size (vertical) analysis expresses each line as a percentage of a base: revenue for the income statement, total assets for the balance sheet. Trend (horizontal) analysis compares figures across periods, often as growth rates or indexed to a base year.

**Why it matters.** These remove scale, so a ₹500 Cr company can be compared with a ₹50,000 Cr one, and changes in cost structure become visible instantly. Consultants use them to build cost benchmarks; analysts use them to spot divergence (receivables growing faster than revenue).

**Core mechanics.**
- Common-size P&L: each line / Revenue.
- Common-size balance sheet: each line / Total assets.
- Growth rate = (Current − Prior) / Prior.
- CAGR = (Ending / Beginning)^(1/n) − 1.
- Index: base year = 100; later years = value / base × 100.
- Margin bridge: explain change in margin by component (e.g., gross margin −150 bps, SG&A +50 bps, net −100 bps).

**Worked example.** Alpha's common-size P&L: COGS 60%, gross margin 40%, SG&A 20%, EBITDA 20%, D&A 5%, EBIT 15%, interest 3%, PBT 12%, tax 3%, PAT 9%.

Trend: revenue grew from 900 to 1,000 = **11.1%**. Receivables grew from 120 to 150 = **25%**. Receivables growing over twice as fast as revenue is a warning sign: looser credit terms, collection problems, or aggressive revenue recognition.

CAGR: revenue of ₹600 Cr five years ago to ₹1,000 Cr today = (1,000/600)^(1/5) − 1 = **10.8%**.

**Indian context.** Screener.in, Trendlyne, Tijori and Capitaline/Prowess (CMIE) provide 10-year standardised data for Indian listed companies. Prowess covers many unlisted companies too, useful for private peer benchmarking.

**Common mistakes.**
- Averaging growth rates arithmetically instead of using CAGR.
- Missing that a falling cost percentage can reflect accounting reclassification rather than efficiency.
- Ignoring acquisitions in trend analysis (inorganic growth inflates revenue trends).

**Interview angle.**
1. *Revenue up 11%, receivables up 25%. What do you infer?* DSO is rising. Possible causes: growth in customers with longer terms, weaker collections, channel stuffing, or revenue recognised before it is collectable. Check ageing and bad-debt provisions.
2. *What's the difference between average growth and CAGR?* CAGR is the constant annual rate that takes the start value to the end value; arithmetic averages overstate growth when rates fluctuate.

**Related topics:** [4.3] Profitability, [4.9] Red flags.

---

### [4.3] Profitability and Return Ratios
<!-- tags: domain=financial-statement-analysis; level=foundation; roles=ER,IB,PE,CF,Consulting,Fintech-PM; keywords=gross margin, EBITDA margin, net margin, ROE, ROA, ROCE, ROIC, NOPAT, operating leverage -->

**Definition.** Profitability ratios measure how much profit a company generates per rupee of revenue (margins) and per rupee of capital (returns).

**Why it matters.** Margins show pricing power and cost control. Returns show whether the company creates value: a business that earns returns above its cost of capital creates value; below, it destroys value even when reporting profits. ROIC versus WACC is the single most important economic test of a business.

**Core mechanics.**

| Ratio | Formula | Alpha |
|---|---|---|
| Gross margin | Gross profit / Revenue | 400/1,000 = **40.0%** |
| EBITDA margin | EBITDA / Revenue | **20.0%** |
| EBIT margin | EBIT / Revenue | **15.0%** |
| Net margin | PAT / Revenue | **9.0%** |
| ROA | PAT / Average total assets | 90 / 870 = **10.3%** |
| ROE | PAT / Average equity | 90 / 430 = **20.9%** |
| ROCE | EBIT / Capital employed (equity + debt) | 150 / 750 = **20.0%** |
| ROIC | NOPAT / Invested capital (equity + debt − cash) | 112.5 / 700 = **16.1%** |

where NOPAT = EBIT × (1 − tax rate) = 150 × 0.75 = 112.5.

*Notes:*
- ROE is boosted by leverage; ROIC and ROCE are capital-structure neutral.
- ROCE is pre-tax; ROIC after-tax, so ROIC is compared with WACC.
- **Operating leverage:** % change in EBIT / % change in revenue. High fixed costs mean profits swing more than revenue.
- **Economic profit (EVA)** = (ROIC − WACC) × Invested capital.

**Worked example: value creation.** Alpha's ROIC is 16.1%. If WACC is 11%, the spread is 5.07%; economic profit = 5.07% × 700 = **≈ ₹35.5 Cr** a year. Alpha creates value. Every rupee reinvested at similar returns creates more value. If ROIC were 9% with an 11% WACC, growth would destroy value.

**Indian context.** Indian consumer staples companies (HUL, Nestlé India) report very high ROCE (often over 50–100%) because of negative working capital and asset-light models; capital goods and utilities report lower ROCE. Bank and NBFC profitability is analysed through RoA and RoE, not ROCE (see [4.11]).

**Common mistakes.**
- Using year-end instead of average balances when the balance sheet changes significantly.
- Comparing ROE across companies with very different leverage without decomposing.
- Mixing pre-tax returns with after-tax cost of capital.

**Interview angle.**
1. *Difference between ROE and ROIC?* ROE measures returns to equity holders and rises with leverage. ROIC measures returns on all invested capital, independent of financing, and is compared with WACC to judge value creation.
2. *A company has 25% ROE but 8% ROIC. What's happening?* Heavy leverage is inflating ROE. Underlying business returns are likely below cost of capital, so it is fragile.
3. *Why might a high-margin company have low ROIC?* It needs a lot of capital (heavy capex or working capital), so asset turnover is low.

**Related topics:** [4.7] DuPont, [9.3] ROIC and value drivers, [1.7] WACC.

---

### [4.4] Liquidity Ratios
<!-- tags: domain=financial-statement-analysis; level=foundation; roles=CF,Audit,ER,Consulting; keywords=current ratio, quick ratio, acid test, cash ratio, liquidity, short-term solvency, defensive interval -->

**Definition.** Liquidity ratios measure a company's ability to meet short-term obligations from short-term assets.

**Why it matters.** Lenders and suppliers use liquidity ratios to judge near-term default risk. A company can be solvent (assets exceed liabilities) and still fail for lack of liquid cash, as seen in the 2018 IL&FS crisis, where asset-liability maturity mismatches caused defaults.

**Core mechanics.**

| Ratio | Formula | Alpha | Interpretation |
|---|---|---|---|
| Current ratio | Current assets / Current liabilities | 350 / 200 = **1.75x** | ≥1.2–1.5 comfortable for manufacturers |
| Quick (acid-test) ratio | (Current assets − Inventory) / Current liabilities | 230 / 200 = **1.15x** | Excludes least liquid current asset |
| Cash ratio | (Cash + marketable securities) / Current liabilities | 50 / 200 = **0.25x** | Most conservative |
| Defensive interval | Liquid assets / Daily cash operating expenses | | Days the firm can operate without new revenue |

**Worked example.** Alpha's current ratio is 1.75x, but quick ratio is 1.15x and cash ratio only 0.25x. Most liquidity depends on collecting receivables (₹150 Cr). If DSO is rising (see [4.2]), liquidity is weaker than the current ratio suggests.

**Indian context.** Indian bank loan sanctions traditionally reference a minimum current ratio of 1.33x under the old maximum permissible bank finance (MPBF) norms, still a common internal benchmark in working capital assessment [VERIFY: individual bank credit policies]. RBI requires banks and large NBFCs to maintain liquidity coverage ratios (see [19.6]), a different, regulatory measure.

**Common mistakes.**
- Treating a high current ratio as always good; it can mean idle cash or bloated inventory.
- Ignoring that negative-working-capital businesses (retail, quick-commerce) run current ratios below 1 safely.
- Ignoring window dressing (repaying short-term debt just before year end).

**Interview angle.**
1. *Current ratio is 0.8. Is the company in trouble?* Not necessarily. Retailers and subscription businesses collect cash before paying suppliers. Check CFO, cash balance, access to credit lines, and whether the business model explains it.
2. *Why exclude inventory in the quick ratio?* Inventory takes the longest to convert to cash and may sell below book value in distress.

**Related topics:** [3.6] Working capital, [4.5] Solvency, [19.6] Bank liquidity.

---

### [4.5] Solvency and Leverage Ratios
<!-- tags: domain=financial-statement-analysis; level=foundation; roles=CF,IB,PE,ER,Consulting; keywords=debt to equity, net debt to EBITDA, interest coverage, DSCR, leverage, gearing, covenants, solvency -->

**Definition.** Solvency ratios measure a company's ability to meet long-term obligations and the extent to which it relies on debt.

**Why it matters.** Leverage magnifies returns in good times and losses in bad times. Lenders set covenants on these ratios; rating agencies map them to ratings; PE investors use them to size LBO debt.

**Core mechanics.**

| Ratio | Formula | Alpha |
|---|---|---|
| Debt-to-equity | Total debt / Equity | 300 / 450 = **0.67x** |
| Net debt-to-equity | (Debt − Cash) / Equity | 250 / 450 = **0.56x** |
| Net debt / EBITDA | (Debt − Cash) / EBITDA | 250 / 200 = **1.25x** |
| Interest coverage | EBIT / Interest | 150 / 30 = **5.0x** |
| DSCR | (EBITDA or cash available for debt service) / (Interest + Principal due) | 200 / (30 + 50) = **2.5x** |
| Debt / Capital | Debt / (Debt + Equity) | 300 / 750 = **40%** |

*Rough benchmarks for industrial companies (vary by sector and rating):* net debt/EBITDA below 2x is comfortable, 3–4x is elevated, above 5x is highly leveraged; interest coverage below 2x is weak.

**Worked example.** A lender's covenant requires net debt/EBITDA below 3.0x. Alpha is at 1.25x, so it could add about (3.0 × 200) − 250 = ₹350 Cr of net debt before breaching, ignoring the effect of the new interest cost on other covenants.

**Indian context.** Indian project and term lenders use DSCR (often with a minimum average around 1.2–1.5x) for project finance [VERIFY: bank/infrastructure lending norms]. Credit rating rationales from CRISIL, ICRA and CARE list leverage and coverage metrics with rating sensitivities ("rating may be downgraded if net debt/EBITDA exceeds X").

**Common mistakes.**
- Ignoring lease liabilities, guarantees, and supplier finance (hidden debt).
- Using EBITDA for capital-heavy businesses where maintenance capex is large (EBITDA − capex coverage is more realistic).
- Calculating on year-end debt when debt is seasonal.

**Interview angle.**
1. *Which is the better leverage metric, D/E or net debt/EBITDA?* Net debt/EBITDA, because it compares debt to cash-generating ability rather than to accounting book equity, which can be distorted by buybacks or losses.
2. *What's DSCR and why do project lenders use it?* Cash available for debt service divided by scheduled interest and principal. Project lenders rely on cash flows, not collateral, so they need cash coverage of each payment.

**Related topics:** [8.6] Capital structure, [14.2] LBO debt sizing, [19.5] Credit appraisal.

---

### [4.6] Efficiency (Turnover) Ratios
<!-- tags: domain=financial-statement-analysis; level=foundation; roles=CF,Consulting,ER,PE; keywords=asset turnover, receivables turnover, inventory turnover, payables turnover, fixed asset turnover, DSO, DIO, DPO, cash conversion cycle -->

**Definition.** Efficiency ratios measure how well a company uses its assets to generate revenue and how quickly it converts working capital into cash.

**Why it matters.** Two companies with identical margins can have very different returns if one turns its assets twice as fast. Efficiency is often the faster lever for operational improvement in consulting projects (inventory reduction, collection discipline).

**Core mechanics and Alpha's figures (using averages).**

| Ratio | Formula | Alpha |
|---|---|---|
| Total asset turnover | Revenue / Average total assets | 1,000 / 870 = **1.15x** |
| Fixed asset turnover | Revenue / Average net PPE | Revenue per rupee of fixed assets |
| Receivables turnover | Revenue / Average receivables | 1,000 / 135 = 7.4x |
| DSO | Average receivables / Revenue × 365 | **49.3 days** |
| Inventory turnover | COGS / Average inventory | 600 / 115 = 5.2x |
| DIO | Average inventory / COGS × 365 | **70.0 days** |
| DPO | Average payables / COGS × 365 | 97.5 / 600 × 365 = **59.3 days** |
| Cash conversion cycle | DSO + DIO − DPO | **59.9 days** |

**Worked example: impact of improvement.** If Alpha reduces DIO from 70 to 55 days (15 days), inventory falls by about 15/365 × 600 = **₹24.7 Cr**, releasing cash and lifting ROIC as invested capital shrinks.

**Indian context.** Indian peers vary widely: FMCG companies often run negative CCC; capital goods and EPC contractors run CCC above 100 days because of retention money and slow government payments. Compare within sector.

**Common mistakes.**
- Using revenue for inventory and payables days (use COGS, as purchases drive these balances).
- Comparing period-end ratios for seasonal businesses.
- Treating high asset turnover from old, fully depreciated assets as efficiency (low net PPE inflates turnover).

**Interview angle.**
1. *Asset turnover has fallen for three years. Why?* Heavy recent capex not yet producing revenue, falling utilisation, or rising working capital. Separate fixed and working capital turnover.
2. *Why use COGS for DIO?* Inventory is recorded at cost, so comparing it with cost-based COGS is consistent; revenue includes margin.

**Related topics:** [3.6] Working capital, [4.7] DuPont, [7.2] Operations costing.

---

## 4B. Decomposition, Cash Flow and Earnings Quality

### [4.7] DuPont Analysis (3-Step and 5-Step)
<!-- tags: domain=financial-statement-analysis; level=intermediate; roles=ER,IB,PE,CF,Consulting; keywords=DuPont analysis, ROE decomposition, net margin, asset turnover, equity multiplier, tax burden, interest burden, financial leverage -->

**Definition.** DuPont analysis decomposes return on equity into its drivers so you can see whether ROE comes from profitability, efficiency or leverage.

**Why it matters.** Two companies with 20% ROE can be completely different: one with high margins and no debt, another with thin margins and heavy leverage. DuPont shows which, and therefore how sustainable ROE is. It is a staple interview and case question.

**Core mechanics.**
- **3-step:** ROE = Net margin × Asset turnover × Equity multiplier = (PAT / Revenue) × (Revenue / Assets) × (Assets / Equity)
- **5-step:** ROE = Tax burden × Interest burden × EBIT margin × Asset turnover × Equity multiplier = (PAT / PBT) × (PBT / EBIT) × (EBIT / Revenue) × (Revenue / Assets) × (Assets / Equity)

**Worked example: Alpha (year-end balances for simplicity).**

3-step:
- Net margin = 90 / 1,000 = 9.0%
- Asset turnover = 1,000 / 900 = 1.111x
- Equity multiplier = 900 / 450 = 2.0x
- ROE = 9.0% × 1.111 × 2.0 = **20.0%**

5-step:

| Component | Formula | Value |
|---|---|---|
| Tax burden | 90 / 120 | 0.75 |
| Interest burden | 120 / 150 | 0.80 |
| EBIT margin | 150 / 1,000 | 15.0% |
| Asset turnover | 1,000 / 900 | 1.111 |
| Equity multiplier | 900 / 450 | 2.0 |
| **ROE** | product | **20.0%** |

*Comparison.* Peer Beta has ROE of 20% from net margin 4%, asset turnover 1.67x and equity multiplier 3.0x. Alpha's ROE rests on margins; Beta's rests on leverage and turnover. Beta's ROE is more vulnerable to a downturn or rate rise.

**Indian context.** Classic illustrations: Indian FMCG companies have high margins and very high asset turnover with almost no debt; retailers like DMart have thin margins with high turnover; banks have very low ROA (around 1–2%) and equity multipliers of 8–12x, so leverage drives bank ROE.

**Common mistakes.**
- Mixing average and year-end balances across components (the identity then won't multiply out exactly).
- Concluding that higher ROE is always better without checking leverage.
- Forgetting that buybacks raise the equity multiplier mechanically.

**Interview angle.**
1. *ROE rose from 15% to 20%. How do you find out why?* Decompose with DuPont: was it margin expansion, faster asset turnover, or more leverage (including buybacks reducing equity)? Margin and turnover improvements are higher quality than leverage.
2. *Why do banks have low ROA but decent ROE?* High leverage; banks fund most assets with deposits, so an equity multiplier around 10x turns 1.2% ROA into roughly 12% ROE.

**Related topics:** [4.3] Returns, [4.5] Leverage, [19.2] Bank profitability.

---

### [4.8] Cash Flow Analysis and Free Cash Flow Quality
<!-- tags: domain=financial-statement-analysis; level=intermediate; roles=ER,PE,IB,CF,Consulting; keywords=cash flow analysis, CFO to PAT, CFO to EBITDA, free cash flow, cash conversion, accruals ratio, capex intensity, maintenance capex -->

**Definition.** Cash flow analysis tests whether reported profits turn into cash, how much reinvestment the business needs, and how cash is used.

**Why it matters.** Investors pay for cash, not accounting profit. Persistent gaps between profit and operating cash flow are the most reliable early warning of aggressive accounting or a weak business model.

**Core mechanics.**

| Metric | Formula | Alpha | Good sign |
|---|---|---|---|
| CFO / PAT | | 105 / 90 = **1.17x** | ≥1 over several years |
| CFO / EBITDA (cash conversion) | | 105 / 200 = **52.5%** | Typically 70–90% for steady businesses |
| Free cash flow | CFO − Capex | 105 − 80 = **₹25 Cr** | Positive and growing |
| FCF margin | FCF / Revenue | **2.5%** | |
| Capex / D&A | | 80 / 50 = **1.6x** | >1 implies growth investment |
| Accruals ratio | (PAT − CFO) / Average total assets | (90 − 105) / 870 = **−1.7%** | Low or negative is better |

*Maintenance vs growth capex:* maintenance capex sustains current capacity (approximated by D&A, adjusted for inflation); growth capex expands it. Owner earnings ≈ PAT + D&A − Maintenance capex.

*Cash flow patterns by life stage:*

| Stage | CFO | CFI | CFF |
|---|---|---|---|
| Startup | − | − | + (raising capital) |
| Growth | + | − (heavy) | + |
| Mature | + (strong) | − (moderate) | − (dividends, buybacks, debt repayment) |
| Decline | + or − | + (asset sales) | − |

**Worked example: diagnosis.** Alpha's CFO/PAT is 1.17x (healthy), but CFO/EBITDA is only 52.5% because ₹35 Cr went into working capital (receivables up 30, inventory up 10, payables up 5) and ₹30 Cr into tax. Capex is 1.6x D&A, so Alpha is in growth mode. FCF of ₹25 Cr is thin; if receivable growth continues, FCF could turn negative. The analyst's question: is the receivables build-up a one-off or a trend?

**Indian context.** Indian analysts often compute cumulative 5- or 10-year CFO/PAT to smooth working capital swings; ratios persistently below 0.7 have historically flagged accounting problems in several Indian mid-caps. Watch for "loans and advances" to related parties classified in investing, which can hide cash leakage.

**Common mistakes.**
- Treating negative FCF as automatically bad; high-ROIC growth investment is good.
- Ignoring acquisitions (capex in disguise) when computing FCF.
- Using CFO without adjusting for factoring or supplier finance that pulls cash forward.

**Interview angle.**
1. *Profits are rising but cash flow is falling. What would you investigate?* Working capital (receivables, inventory build-up), revenue recognition, capitalised costs, and one-off timing. Compare DSO and DIO trends.
2. *How do you estimate maintenance capex?* Start with D&A, adjust for inflation and asset age, or use management disclosures and capex in low-growth years.

**Related topics:** [3.3] Cash flow statement, [4.9] Quality of earnings, [10.2] DCF.

---

### [4.9] Quality of Earnings and Red Flags
<!-- tags: domain=financial-statement-analysis; level=advanced; roles=ER,PE,IB,Audit,Consulting; keywords=quality of earnings, earnings management, red flags, channel stuffing, related party transactions, auditor resignation, pledged shares, Satyam -->

**Definition.** Earnings quality is the degree to which reported profits reflect sustainable, cash-backed economic performance. Low-quality earnings come from one-offs, aggressive estimates, or manipulation.

**Why it matters.** PE buyers commission quality-of-earnings (QoE) reports before every deal to establish "normalised EBITDA", the basis for price. Equity investors avoid large losses by spotting red flags early. Fraud cases such as Satyam (2009), where cash balances were fabricated, showed how far reported numbers can diverge from reality.

**Core mechanics: red flag checklist.**

*Revenue:*
- Receivables growing much faster than revenue (rising DSO).
- Revenue spikes in the last month of the quarter; large unbilled revenue.
- Changes in revenue recognition policy; gross-up of agency revenue.
- Channel stuffing (pushing excess stock to distributors).

*Expenses and assets:*
- Capitalising operating costs (rising CWIP that never completes, rising capitalised development costs).
- Lengthening useful lives; reducing provisions (bad debts, warranties) as sales grow.
- Inventory growing faster than sales.

*Cash and balance sheet:*
- CFO persistently below PAT.
- Large cash balances alongside high borrowing (why borrow at 10% when holding cash?). This pattern preceded several Indian frauds.
- Large loans and advances to related parties or "capital advances".
- Rising contingent liabilities and off-balance-sheet guarantees.

*Governance:*
- Auditor resignation or qualified opinion; frequent auditor changes; small audit firm for a large company.
- High promoter share pledging.
- Complex group structures, many related-party transactions.
- CFO turnover; delayed results.

*Normalisation adjustments in QoE:*
- Remove one-offs (litigation settlements, restructuring, asset sale gains).
- Adjust related-party transactions to arm's length.
- Pro forma for acquisitions and run-rate cost savings (with scepticism).
- Normalise owner's compensation in private companies.

**Worked example: normalised EBITDA.** A target reports EBITDA of ₹120 Cr. QoE findings: ₹15 Cr gain on sale of land included in other operating income; ₹8 Cr one-off legal cost; promoter's relative paid ₹5 Cr above market rent (to stop post-deal); ₹6 Cr of revenue recognised on a bill-and-hold arrangement not meeting criteria.
- Normalised EBITDA = 120 − 15 + 8 + 5 − 6 = **₹112 Cr**
- At 10x EV/EBITDA, the adjustments cut value by ₹80 Cr.

**Indian context.** SEBI LODR requires disclosure of auditor resignation reasons and detailed related-party transactions [VERIFY: SEBI circular on auditor resignation, Oct 2019]. Promoter pledge data is disclosed to exchanges. The National Financial Reporting Authority (NFRA) oversees audit quality of listed and large companies and has penalised auditors in several high-profile cases.

**Common mistakes.**
- Treating every "exceptional item" as non-recurring.
- Accepting management's "adjusted EBITDA" without reconciliation.
- Ignoring governance flags when numbers look clean.

**Interview angle.**
1. *What red flags would you look for in an annual report?* CFO below PAT over years, rising DSO and inventory days, cash plus high debt, related-party loans, auditor changes or qualifications, high pledging, rising contingent liabilities.
2. *What is a quality-of-earnings report?* A diligence report, usually by an accounting firm, that normalises EBITDA and working capital for a transaction by removing one-offs and correcting accounting.

**Related topics:** [4.10] Forensic models, [6.10] Audit and fraud, [12.5] Due diligence.

---

### [4.10] Forensic Scoring Models: Beneish M-Score, Altman Z-Score, Piotroski F-Score
<!-- tags: domain=financial-statement-analysis; level=advanced; roles=ER,PE,Audit,CF; keywords=Beneish M-score, Altman Z-score, Piotroski F-score, earnings manipulation, bankruptcy prediction, financial distress, forensic accounting -->

**Definition.** Scoring models combine several ratios into one number: Beneish M-score estimates the likelihood of earnings manipulation; Altman Z-score predicts bankruptcy risk; Piotroski F-score rates financial strength for value investing.

**Why it matters.** They provide a quick, systematic screen across many companies and are frequently asked about in equity research and forensic accounting interviews. They are screens, not verdicts.

**Core mechanics.**

*Beneish M-score (8-variable):*
M = −4.84 + 0.920 × DSRI + 0.528 × GMI + 0.404 × AQI + 0.892 × SGI + 0.115 × DEPI − 0.172 × SGAI + 4.679 × TATA − 0.327 × LVGI

| Index | Meaning |
|---|---|
| DSRI | Days sales in receivables index (this year vs last) |
| GMI | Gross margin index (last year's margin / this year's) |
| AQI | Asset quality index (non-current assets other than PPE, as share of total) |
| SGI | Sales growth index |
| DEPI | Depreciation index (slower depreciation → higher) |
| SGAI | SG&A expense index |
| TATA | Total accruals to total assets |
| LVGI | Leverage index |

Threshold: M > **−1.78** suggests likely manipulation (some practitioners use −2.22 as a more sensitive cutoff).

*Altman Z-score (public manufacturing companies):*
Z = 1.2 × X1 + 1.4 × X2 + 3.3 × X3 + 0.6 × X4 + 1.0 × X5
- X1 = Working capital / Total assets
- X2 = Retained earnings / Total assets
- X3 = EBIT / Total assets
- X4 = Market value of equity / Total liabilities
- X5 = Sales / Total assets
- Zones: **> 2.99 safe; 1.81–2.99 grey; < 1.81 distress.** (Variants Z' and Z'' exist for private and non-manufacturing firms.)

*Piotroski F-score:* 9 binary tests (1 point each); 8–9 strong, 0–2 weak.
- Profitability: positive ROA; positive CFO; improving ROA; CFO > net income (accruals).
- Leverage/liquidity: falling leverage; rising current ratio; no new share issuance.
- Efficiency: rising gross margin; rising asset turnover.

**Worked example 1: Beneish.** Indices: DSRI 1.3, GMI 1.1, AQI 1.0, SGI 1.4, DEPI 1.0, SGAI 0.9, TATA 0.05, LVGI 1.1.
- M = −4.84 + 1.196 + 0.581 + 0.404 + 1.249 + 0.115 − 0.155 + 0.234 − 0.360 = **−1.58**
- −1.58 > −1.78 → **flag for possible manipulation**; driven mainly by rising receivables (DSRI) and rapid sales growth (SGI).

**Worked example 2: Altman for Alpha.** Assume retained earnings ₹300 Cr. Total liabilities = 900 − 450 = ₹450 Cr.
- X1 = 150/900 = 0.167; X2 = 300/900 = 0.333; X3 = 150/900 = 0.167; X4 = 1,350/450 = 3.0; X5 = 1,000/900 = 1.111
- Z = 0.200 + 0.467 + 0.550 + 1.800 + 1.111 = **4.13** → safe zone.

**Indian context.** Indian studies have applied these models to listed companies with mixed accuracy; coefficients were estimated on US data and are best used comparatively. Indian research houses and forensic analysts often combine them with India-specific checks (promoter pledges, related-party advances, contingent liabilities).

**Common mistakes.**
- Treating a score as proof of fraud or bankruptcy.
- Applying the manufacturing Z-score to banks or asset-light services firms.
- Ignoring that high growth alone raises the M-score.

**Interview angle.**
1. *What does the Altman Z-score measure?* Bankruptcy risk, combining liquidity, cumulative profitability, operating returns, market-based leverage and asset turnover.
2. *Name three Beneish variables and why they matter.* DSRI (rising receivables may signal fake revenue), TATA (high accruals mean profit not backed by cash), AQI (rising soft assets may mean cost capitalisation).

**Related topics:** [4.9] Red flags, [20.3] Credit risk models.

---

### [4.11] Sector-Specific Metrics: Banks, SaaS, Fintech, Retail, Telecom
<!-- tags: domain=financial-statement-analysis; level=intermediate; roles=ER,Fintech-PM,Consulting,PE,IB; keywords=NIM, GNPA, PCR, CASA ratio, ARR, NRR, CAC payback, LTV to CAC, Rule of 40, take rate, TPV, same-store sales, ARPU -->

**Definition.** Sector metrics capture the economics that standard ratios miss. Each industry has a few KPIs that drive value and that interviewers expect candidates to know.

**Why it matters.** For fintech, SaaS and banking roles, generic ratios are not enough. Interviewers test whether candidates know how these businesses actually make money and which metrics show health.

**Core mechanics and worked examples.**

*Banks and NBFCs:*

| Metric | Formula | Example |
|---|---|---|
| Net interest margin (NIM) | (Interest earned − Interest expended) / Average earning assets | (900 − 500) / 12,000 = **3.33%** |
| Gross NPA ratio | Gross NPAs / Gross advances | 300 / 8,000 = **3.75%** |
| Provision coverage ratio (PCR) | Provisions on NPAs / Gross NPAs | 210 / 300 = **70%** |
| Net NPA ratio | (GNPA − Provisions) / (Advances − Provisions) | 90 / 7,790 = **1.16%** |
| Cost-to-income | Operating expenses / (NII + Other income) | 250 / (400 + 100) = **50%** |
| CASA ratio | (Current + Savings deposits) / Total deposits | Higher = cheaper funding |
| Credit cost | Provisions / Average advances | |
| CRAR / CET1 | Capital / Risk-weighted assets | See [19.4] |

*SaaS and subscription:*

| Metric | Formula | Example |
|---|---|---|
| ARR | Annualised recurring revenue | Start ₹100 Cr; +30 new, +15 expansion, −8 churn, −2 contraction → **₹135 Cr** |
| Net revenue retention (NRR) | (Start ARR + Expansion − Churn − Contraction) / Start ARR | (100 + 15 − 8 − 2)/100 = **105%** |
| Gross revenue retention (GRR) | (Start − Churn − Contraction) / Start | **90%** |
| CAC payback | CAC / (Monthly ARPA × Gross margin) | 50,000 / (5,000 × 80%) = **12.5 months** |
| LTV | ARPA × Gross margin / Churn rate | 5,000 × 0.8 / 2% monthly = **₹2,00,000** |
| LTV / CAC | | 2,00,000 / 50,000 = **4.0x** (≥3x healthy) |
| Rule of 40 | Revenue growth % + FCF (or EBITDA) margin % | 35% + 10% = **45** (≥40 healthy) |

*Payments and fintech:*
- TPV/GMV (total payment value), take rate (revenue / TPV), transactions per user, MAU/DAU, contribution margin per transaction.
- Lending: AUM, disbursements, yield, cost of funds, NIM, credit cost, collection efficiency, 30+/90+ DPD ratios.
- Example: TPV ₹10,000 Cr at a net take rate of 0.20% = **₹20 Cr** net revenue.

*Retail and consumer:* same-store sales growth (SSSG), revenue per sq ft, inventory turns, gross margin, store-level EBITDA, payback per store.

*Telecom:* ARPU (average revenue per user), subscribers, churn, minutes and data usage per user, capex/revenue, EBITDA margin.

*Quick commerce / delivery:* average order value, orders per day, contribution margin per order, dark store throughput, take rate.

**Indian context.** Indian banks disclose these quarterly in investor presentations. Indian SaaS companies (Freshworks, Zoho, Chargebee) and listed new-age companies (Eternal, Swiggy, Paytm, PB Fintech) report custom KPIs; definitions vary (e.g., "contribution margin" may or may not include delivery cost and discounts), so read the definitions.

**Common mistakes.**
- Comparing take rates across companies without checking gross vs net revenue.
- Computing LTV with revenue instead of gross margin.
- Using annual churn in a monthly LTV formula.

**Interview angle.**
1. *What's the most important metric for a SaaS company?* Net revenue retention, because above 100% the existing base grows on its own; combined with CAC payback, it shows capital efficiency.
2. *How does a bank make money and how do you measure it?* It earns a spread between lending yield and funding cost (NIM), plus fees, minus operating costs and credit costs. Track NIM, cost-to-income, credit cost, NPAs and capital adequacy.
3. *(Fintech PM) What drives a payments company's profitability?* TPV growth, take rate after interchange and network costs, mix shift to higher-margin products (credit, merchant services), and cost per transaction.

**Related topics:** [19.2] Banking, [21.1] Fintech business models, [9.2] Unit economics.

---

### [4.12] Market-Based Ratios and Shareholder Returns
<!-- tags: domain=financial-statement-analysis; level=foundation; roles=ER,IB,PE,CF; keywords=P/E ratio, P/B ratio, EV/EBITDA, dividend yield, payout ratio, earnings yield, sustainable growth rate, total shareholder return -->

**Definition.** Market-based ratios relate a company's share price or enterprise value to its earnings, book value, cash flow or dividends.

**Why it matters.** They bridge financial statement analysis and valuation, showing what the market expects. A high multiple implies high expected growth or low risk; an analyst asks whether fundamentals justify it.

**Core mechanics: Alpha (₹135 share price, 10 Cr shares).**

| Ratio | Formula | Alpha |
|---|---|---|
| Market cap | Price × Shares | **₹1,350 Cr** |
| EPS | PAT / Shares | 90 / 10 = **₹9.0** |
| P/E | Price / EPS | 135 / 9 = **15.0x** |
| Book value per share | Equity / Shares | **₹45** |
| P/B | Price / BVPS | **3.0x** |
| Enterprise value | Market cap + Net debt | 1,350 + 250 = **₹1,600 Cr** |
| EV/EBITDA | | 1,600 / 200 = **8.0x** |
| EV/Sales | | **1.6x** |
| Dividend payout | DPS / EPS | 3 / 9 = **33.3%** |
| Dividend yield | DPS / Price | 3 / 135 = **2.2%** |
| Earnings yield | EPS / Price | **6.7%** |
| Sustainable growth rate | ROE × Retention ratio | 20% × 66.7% = **13.3%** |

*Total shareholder return (TSR)* = (Price end − Price start + Dividends) / Price start.

*Justified P/B:* P/B = (ROE − g) / (r − g). A company earning ROE above cost of equity deserves P/B above 1.

**Worked example.** Alpha's sustainable growth rate is 13.3%: it can grow equity-funded at that rate without changing leverage or payout. If management targets 20% growth, it must raise leverage, cut dividends, issue equity or improve ROE.

**Indian context.** Nifty 50 long-run trailing P/E has generally ranged from the mid-teens to mid-20s [VERIFY: NSE historical Nifty P/E data]. Indian dividends are taxed in shareholders' hands at slab rates; dividend distribution tax was abolished from 1 April 2020.

**Common mistakes.**
- Mixing equity value (P/E, P/B) with enterprise value metrics (EV/EBITDA) inconsistently (e.g., EV / net income).
- Using P/E for loss-making or highly cyclical companies at peak earnings.
- Ignoring dilution (use diluted shares).

**Interview angle.**
1. *Why use EV/EBITDA rather than P/E?* EV/EBITDA is capital-structure neutral and unaffected by depreciation policy and tax differences, making cross-company comparison cleaner, especially for leveraged companies.
2. *What does a P/B below 1 imply?* The market expects ROE below cost of equity, or doubts book values (bad loans, impaired assets). Common for PSU banks historically.

**Related topics:** [10.11] Valuation multiples, [15.5] Equity research, [2.12] EPS.

---

## Module 4 Glossary

| Term | Definition |
|---|---|
| Accruals ratio | (Net income − CFO) / Average total assets |
| Altman Z-score | Bankruptcy prediction score from five ratios |
| Beneish M-score | Earnings manipulation likelihood score from eight indices |
| CAC payback | Months of gross profit needed to recover customer acquisition cost |
| DuPont analysis | Decomposition of ROE into margin, turnover and leverage |
| DSCR | Cash available for debt service / scheduled debt service |
| Economic profit | (ROIC − WACC) × Invested capital |
| Interest coverage | EBIT / Interest expense |
| NIM | Net interest income / Average earning assets |
| NRR | Net revenue retention from the existing customer base |
| PCR | Provision coverage ratio: NPA provisions / Gross NPAs |
| Piotroski F-score | Nine-point financial strength score |
| Quality of earnings | Degree to which profits are sustainable and cash-backed |
| ROIC | NOPAT / Invested capital |
| Sustainable growth rate | ROE × retention ratio |

## Module 4 Rapid-Fire Quiz

1. Net margin 5%, asset turnover 2x, equity multiplier 2x: ROE? **20%**
2. Current assets 300, inventory 100, current liabilities 200: quick ratio? **1.0x**
3. EBIT 80, interest 20: interest coverage? **4.0x**
4. Altman Z of 1.5 indicates? **Distress zone**
5. Beneish M of −2.5 vs threshold −1.78? **Below threshold; unlikely manipulator**
6. ARR start 100, expansion 20, churn 10: NRR? **110%**
7. ROE 18%, payout 50%: sustainable growth? **9%**
8. Price 200, EPS 10: earnings yield? **5%**
9. GNPA 400, provisions 300: PCR? **75%**
10. Which ratio isolates leverage in DuPont? **Equity multiplier (assets / equity)**

## Module 4 [VERIFY] Items

1. Bank credit policy benchmarks on current ratio (MPBF legacy)
2. Infrastructure/project finance DSCR norms
3. SEBI circular on auditor resignation disclosures (October 2019)
4. NSE historical Nifty 50 P/E range

---

# Module 5: Financial Reporting and Accounting Standards

## 5A. Standards and Structures

### [5.1] The Global Standards Landscape: Ind AS, AS, IFRS and US GAAP
<!-- tags: domain=financial-reporting; level=foundation; roles=Audit,ER,IB,CF,Consulting; keywords=Ind AS, IFRS, US GAAP, Indian GAAP, ICAI, MCA, NFRA, IASB, FASB, convergence, carve-outs -->

**Definition.** Accounting standards are the rules governing how transactions are recognised, measured, presented and disclosed. India uses two frameworks: Ind AS (converged with IFRS) for larger companies and the older Accounting Standards (AS, "Indian GAAP") for others. Globally, IFRS (set by the IASB) is used in over 140 jurisdictions, and US GAAP (set by the FASB) applies to US public companies.

**Why it matters.** Cross-border investing, Indian companies listing abroad, M&A with foreign targets and comparing Indian companies with global peers all require knowing which framework applies and where the differences lie.

**Core mechanics.**

*Standard-setting in India:*
- **ICAI** (Institute of Chartered Accountants of India), through its Accounting Standards Board, formulates standards.
- **NFRA** (National Financial Reporting Authority) recommends standards to the central government and oversees audit quality for specified entities.
- **MCA** (Ministry of Corporate Affairs) notifies standards under the Companies Act 2013.
- Sector regulators (RBI, IRDAI, SEBI) add requirements for their entities.

*Who uses what (summary):*

| Entity | Framework |
|---|---|
| Listed companies and unlisted companies with net worth ≥ ₹250 Cr, and their group companies | Ind AS |
| NBFCs with net worth ≥ ₹250 Cr | Ind AS (phased since 2018) |
| Scheduled commercial banks | Indian GAAP with RBI norms (Ind AS deferred) |
| Insurance companies | Indian GAAP with IRDAI norms (Ind AS deferred) |
| Other companies | AS (Indian GAAP), with option to adopt Ind AS voluntarily |

[VERIFY: Companies (Ind AS) Rules thresholds; RBI and IRDAI Ind AS status]

*Ind AS vs IFRS:* largely converged; key carve-outs include:
- Bargain purchase gain to capital reserve rather than P&L.
- Option to continue the AS 11 treatment of long-term foreign currency monetary items (transition).
- Certain treatment of breach of loan covenants (classification as current vs non-current) [VERIFY: Ind AS 1 carve-out].
- Common-control combinations (Appendix C to Ind AS 103) handled specifically.

**Worked example.** An Indian SaaS company with net worth of ₹180 Cr, unlisted, plans an IPO. Once listed (or once it crosses ₹250 Cr net worth), it must move to Ind AS, restating comparatives and preparing an Ind AS 101 transition reconciliation. ESOP charges, revenue recognition (Ind AS 115) and leases (Ind AS 116) may change reported numbers materially, so many IPO-bound companies adopt Ind AS voluntarily early.

**Indian context.** The Ind AS roadmap began in FY2016-17. SEBI ICDR requires restated consolidated financial information for three years in offer documents, prepared under Ind AS [VERIFY: SEBI ICDR Schedule VI financial information requirements].

**Common mistakes.**
- Assuming all Indian companies report under Ind AS (banks and insurers still largely do not).
- Treating Ind AS and IFRS as identical; carve-outs can matter in specific cases.
- Comparing a US GAAP peer's EBITDA with an Ind AS company's without lease adjustments.

**Interview angle.**
1. *What accounting framework do Indian companies use?* Ind AS (IFRS-converged) for listed and large companies, Indian GAAP for smaller companies, with banks and insurers following regulator-specific frameworks pending Ind AS.
2. *Name two key differences between IFRS and US GAAP.* LIFO allowed only under US GAAP; impairment reversals allowed under IFRS (except goodwill) but not US GAAP; lease accounting differs for lessees (single model under IFRS 16 vs two models under ASC 842); development costs capitalised under IFRS when criteria are met.

**Related topics:** [5.2] Key differences, [2.1] Conceptual framework, [6.9] NFRA and audit.

---

### [5.2] Key Differences: Ind AS / IFRS vs US GAAP vs Indian GAAP
<!-- tags: domain=financial-reporting; level=intermediate; roles=Audit,ER,IB,CF; keywords=IFRS vs US GAAP, Ind AS vs AS, LIFO, impairment reversal, development costs, revaluation, extraordinary items, proposed dividend -->

**Definition.** A comparative view of the most frequently tested accounting differences across the major frameworks.

**Why it matters.** Analysts adjust peers to a common basis, and auditors and deal teams must know where a target's numbers would shift under the acquirer's framework.

**Core mechanics.**

| Area | Ind AS / IFRS | US GAAP | Indian GAAP (AS) |
|---|---|---|---|
| Inventory cost formula | FIFO, weighted average; no LIFO | LIFO permitted | FIFO, weighted average |
| Inventory write-down reversal | Allowed | Not allowed | Allowed |
| PPE revaluation | Allowed (revaluation model) | Not allowed | Allowed |
| Impairment reversal (non-goodwill) | Allowed | Not allowed | Allowed |
| Goodwill | Not amortised; annual impairment test | Not amortised (public); private companies may amortise | Amortised (amalgamation goodwill, typically ≤5 years) |
| Development costs | Capitalised if criteria met | Generally expensed (except some software) | Capitalised if criteria met |
| Lessee leases | Single on-balance-sheet model | Finance vs operating, both on balance sheet; operating shows straight-line cost | Operating leases off balance sheet (AS 19) |
| Revenue | Ind AS 115 / IFRS 15 five-step | ASC 606 (largely converged) | AS 9, risks-and-rewards based |
| Financial instruments | Ind AS 109 / IFRS 9, ECL | ASC 326 CECL (lifetime from day one) | Limited guidance, incurred loss |
| Extraordinary items | Prohibited | Prohibited | Permitted (AS 5) |
| Proposed dividend | Not a liability until declared | Not a liability until declared | Not a liability until declared (since 2016 amendment) |
| Fair value measurement | Ind AS 113 / IFRS 13 | ASC 820 | Limited |

**Worked example.** A US-listed peer uses LIFO. Its inventory is ₹200 Cr and its disclosed LIFO reserve is ₹40 Cr. To compare with an Ind AS company using FIFO:
- FIFO inventory = 200 + 40 = **₹240 Cr**
- If the LIFO reserve rose by ₹8 Cr in the year, FIFO COGS would be ₹8 Cr lower, so pre-tax profit would be ₹8 Cr higher.

**Indian context.** Many Indian unlisted companies still report under AS, so private company benchmarking (e.g., using MCA data) mixes frameworks. Under AS 19, operating lease rentals are expensed, so EBITDA is not comparable with Ind AS 116 reporters.

**Common mistakes.**
- Assuming CECL and IFRS 9 ECL are the same; CECL books lifetime losses on day one for all loans.
- Forgetting the LIFO reserve adjustment when comparing US and Indian companies.

**Interview angle.**
1. *A US company uses LIFO in a period of rising prices. How do its statements differ from a FIFO peer?* Higher COGS, lower profit and tax, lower inventory on the balance sheet. Adjust with the LIFO reserve.
2. *How does CECL differ from IFRS 9 ECL?* CECL requires lifetime expected losses on all exposures from origination; IFRS 9 uses 12-month ECL for Stage 1 and lifetime only after significant credit deterioration.

**Related topics:** [2.5] Inventory, [2.8] Leases, [2.10] ECL.

---

### [5.3] Consolidation, Associates and Joint Arrangements (Ind AS 110, 111, 28)
<!-- tags: domain=financial-reporting; level=intermediate; roles=IB,PE,Audit,ER,CF; keywords=consolidation, control, subsidiary, non-controlling interest, equity method, associate, joint venture, joint operation, intercompany elimination, Ind AS 110 -->

**Definition.** Consolidation combines a parent and its subsidiaries into one set of financial statements as if they were a single entity. Associates (significant influence, usually 20–50%) and joint ventures (joint control) are accounted for using the equity method.

**Why it matters.** Indian business groups operate through complex holding structures. The standalone numbers of a holding company tell you little; the consolidated numbers show the group's economics. Analysts also need to understand how much of consolidated profit belongs to minority shareholders.

**Core mechanics.**

*Control (Ind AS 110):* an investor controls an investee when it has (1) power over relevant activities, (2) exposure to variable returns, and (3) ability to use power to affect returns. Control can exist below 50% (e.g., dominant voting block, contractual rights).

| Relationship | Typical stake | Accounting |
|---|---|---|
| Subsidiary | Control (often >50%) | Full consolidation, line by line, with NCI |
| Associate | Significant influence (20–50%) | Equity method |
| Joint venture | Joint control, rights to net assets | Equity method |
| Joint operation | Joint control, rights to assets and obligations for liabilities | Recognise share of assets, liabilities, revenue, expenses |
| Financial investment | No significant influence | Ind AS 109 (fair value) |

*Consolidation steps:*
1. Add line by line 100% of the subsidiary's assets, liabilities, income and expenses.
2. Eliminate the parent's investment against the subsidiary's equity; recognise goodwill.
3. Recognise non-controlling interest (NCI) in equity and its share of profit.
4. Eliminate intercompany balances, transactions and unrealised profits.
5. Align accounting policies and reporting dates.

*Equity method:* investment initially at cost; increased by share of profit (and OCI); reduced by dividends received; one line on the balance sheet and one line in P&L ("share of profit of associates").

**Worked example 1: acquisition with NCI.** Parent buys 80% of Sub for ₹400 Cr. Fair value of Sub's identifiable net assets is ₹400 Cr.
- Proportionate NCI = 20% × 400 = ₹80 Cr → goodwill = 400 + 80 − 400 = **₹80 Cr**
- Full goodwill method: NCI at fair value, say ₹95 Cr → goodwill = 400 + 95 − 400 = **₹95 Cr**
- Next year Sub earns ₹50 Cr: consolidated P&L includes all 50; NCI share = **₹10 Cr**; attributable to parent = ₹40 Cr.

**Worked example 2: unrealised profit.** Parent sells goods costing ₹80 Cr to Sub for ₹100 Cr. At year end, Sub still holds half.
- Eliminate intercompany revenue and COGS of ₹100 Cr.
- Unrealised profit in Sub's inventory = 50% × 20 = **₹10 Cr**, removed from inventory and consolidated profit.

**Worked example 3: equity method.** Investor buys 30% of an associate for ₹300 Cr. Associate earns ₹100 Cr and pays ₹40 Cr dividends.
- Share of profit = ₹30 Cr (in P&L); dividend received = ₹12 Cr (reduces investment, not income)
- Investment carrying value = 300 + 30 − 12 = **₹318 Cr**

**Indian context.** Listed companies must publish both standalone and consolidated results quarterly under SEBI LODR. The Companies Act limits layers of subsidiaries for certain companies to two [VERIFY: Companies (Restriction on Number of Layers) Rules 2017]. Many Indian conglomerates (Tata, Reliance, Adani, Aditya Birla) are analysed through sum-of-the-parts valuation of listed and unlisted subsidiaries, using consolidated and segment data.

**Common mistakes.**
- Valuing a holding company on consolidated EPS without deducting the NCI share.
- Adding associate revenue to consolidated revenue (only the share of profit is included).
- Missing that dividends from associates are not income under the equity method.

**Interview angle.**
1. *Company owns 60% of a subsidiary. How much of the subsidiary's revenue is consolidated?* 100%. The 40% minority share is shown as NCI in equity and as profit attributable to NCI.
2. *How do you account for a 30% stake?* Usually equity method: one line on the balance sheet and share of profit in P&L.
3. *(Valuation) How do you treat NCI when going from enterprise value to equity value?* Subtract NCI (at market or book value), because consolidated EBITDA includes 100% of subsidiaries but the parent's shareholders own only part.

**Related topics:** [2.7] Business combinations, [10.5] EV to equity bridge, SOTP.

---

### [5.4] Anatomy of an Indian Annual Report
<!-- tags: domain=financial-reporting; level=foundation; roles=ER,IB,Consulting,Audit,CF,Fintech-PM; keywords=annual report, board's report, MD&A, corporate governance report, BRSR, auditor's report, CARO, notes to accounts, how to read an annual report -->

**Definition.** The annual report is a company's main yearly disclosure to shareholders: statutory reports, financial statements, auditor's reports and notes.

**Why it matters.** Reading annual reports efficiently is a core skill in equity research, consulting due diligence and interview preparation for company-specific questions. Knowing where each type of information sits saves hours.

**Core mechanics: structure and what to look for.**

| Section | What it contains | What to extract |
|---|---|---|
| Chairman's / MD's letter | Strategy narrative | Tone, priorities, promises to track next year |
| Corporate overview | Business segments, products, footprint | Business model, KPIs |
| Board's Report | Statutory disclosures: dividend, transfers to reserves, material changes, related-party summary, CSR, risk management, subsidiaries | Material events, CSR spend, RPT summary |
| Management Discussion and Analysis | Industry structure, opportunities, threats, segment performance, risks, key ratio changes | Management's explanation of results |
| Corporate Governance Report | Board composition, committees, attendance, remuneration, shareholding | Independence, related-party approvals |
| BRSR (top 1,000 listed) | ESG disclosures, with "core" assurance for top companies | Environmental and social metrics |
| Independent Auditor's Report | Opinion, key audit matters, emphasis of matter, CARO annexure, internal financial controls report | Any modification; KAMs show the riskiest areas |
| Standalone financial statements | Parent only | Holding company cash, debt |
| Consolidated financial statements | Group | Group economics |
| Notes to accounts | Policies, breakdowns, contingencies | Most analytical content |
| AGM notice | Resolutions | Related-party approvals, remuneration, capital raising |

**Worked example: a 45-minute reading plan.**
1. Auditor's report (5 min): opinion type, KAMs, CARO exceptions.
2. 5-year financial highlights (5 min).
3. MD&A (10 min): segment drivers and risks.
4. Consolidated statements and cash flow (10 min).
5. Notes: revenue policy, segments, related parties, borrowings, contingencies (15 min).

**Indian context.** Annual reports are filed with stock exchanges (BSE, NSE) and MCA. Section 134 governs the Board's Report; SEBI LODR Schedule V governs MD&A and governance disclosures [VERIFY: SEBI LODR Schedule V]. CARO 2020 applies to most companies other than banks, insurers, and small private companies [VERIFY: CARO 2020 applicability exemptions].

**Common mistakes.**
- Reading only the glossy front section.
- Missing the auditor's emphasis of matter paragraphs.
- Ignoring standalone vs consolidated differences in holding structures.

**Interview angle.**
1. *Where would you find a company's segment-wise profitability?* Segment note (Ind AS 108) in the consolidated financial statements, plus MD&A commentary.
2. *What is a key audit matter?* A matter that, in the auditor's judgment, was most significant in the audit (e.g., revenue recognition, impairment, ECL); it shows where the risks lie.

**Related topics:** [6.6] Auditor's report, [3.7] Notes, [5.5] Segments.

---

### [5.5] Segment Reporting (Ind AS 108) and Interim Reporting (Ind AS 34)
<!-- tags: domain=financial-reporting; level=intermediate; roles=ER,IB,Consulting,CF; keywords=Ind AS 108, operating segments, chief operating decision maker, reportable segment, 10% threshold, Ind AS 34, interim financial reporting, quarterly results -->

**Definition.** Segment reporting discloses information about a company's operating segments as reviewed by its chief operating decision maker (CODM). Interim reporting sets requirements for financial statements covering periods shorter than a year (quarters, half-years).

**Why it matters.** Conglomerates and multi-business companies hide very different economics inside consolidated numbers. Segment data enables sum-of-the-parts valuation and shows where value is created or destroyed. Quarterly results drive market prices in the short run.

**Core mechanics.**

*Ind AS 108 (management approach):*
- Operating segment: engages in business activities, its results are regularly reviewed by the CODM, and discrete financial information is available.
- **Reportable** if any of the following is 10% or more: revenue (internal and external) of all segments; absolute profit or loss (vs the greater of total profits of profitable segments and total losses of loss-making segments); assets of all segments.
- External revenue of reportable segments must be at least **75%** of entity revenue; add segments until reached.
- Disclose: segment revenue, profit, assets (if reported to CODM), reconciliations to entity totals, entity-wide information (products, geographies, major customers ≥10% of revenue).

*Ind AS 34 interim reporting:*
- Condensed statements with selected notes.
- Same accounting policies as annual statements.
- Each interim period is a discrete period, but tax expense uses the estimated annual effective tax rate.

**Worked example.** A group has three segments: Chemicals (revenue ₹600 Cr), Textiles (₹350 Cr), Real estate (₹50 Cr); total ₹1,000 Cr.
- Real estate is 5% of revenue; if its profit and assets are also below 10% thresholds, it can be combined into "Others".
- Chemicals + Textiles = 95% of external revenue, above the 75% minimum. Two reportable segments plus "Others".

**Indian context.** SEBI LODR Regulation 33 requires listed companies to publish quarterly results within 45 days of quarter end (60 days for the annual Q4), with segment information, and a limited review report from the statutory auditor for quarterly results [VERIFY: LODR Reg 33 timelines]. Earnings calls and investor presentations typically follow.

**Common mistakes.**
- Assuming segments are defined by legal entity; they are defined by internal management reporting.
- Ignoring unallocated corporate costs when summing segment profits.
- Annualising one quarter for seasonal businesses.

**Interview angle.**
1. *How are reportable segments determined?* By what the CODM reviews, then the 10% quantitative thresholds, with the 75% external revenue coverage test.
2. *Why is segment data important for valuation?* Different segments warrant different multiples and growth assumptions; sum-of-the-parts valuation depends on segment EBITDA.

**Related topics:** [10.9] SOTP valuation, [5.4] Annual report.

---

### [5.6] Fair Value Measurement (Ind AS 113) and the Fair Value Hierarchy
<!-- tags: domain=financial-reporting; level=intermediate; roles=Audit,ER,IB,PE,CF; keywords=Ind AS 113, fair value, exit price, Level 1, Level 2, Level 3, valuation techniques, unobservable inputs, mark to model -->

**Definition.** Fair value is the price that would be received to sell an asset or paid to transfer a liability in an orderly transaction between market participants at the measurement date (an exit price).

**Why it matters.** Fair value drives financial instruments, investment property disclosures, business combination accounting, impairment testing and PE/VC fund NAVs. Level 3 valuations rely on management assumptions and are a focus of audits and regulators.

**Core mechanics.**

*Fair value hierarchy:*

| Level | Inputs | Example | Reliability |
|---|---|---|---|
| Level 1 | Quoted prices in active markets for identical assets | Listed shares on NSE | Highest |
| Level 2 | Observable inputs other than Level 1 | Corporate bonds priced from yield curves; interest rate swaps | Medium |
| Level 3 | Unobservable inputs | Unlisted startup equity; complex derivatives | Lowest; requires sensitivity disclosures |

*Valuation approaches:* market approach (comparable prices or multiples), income approach (DCF, option pricing), cost approach (replacement cost).

*Key concepts:* principal (or most advantageous) market; highest and best use for non-financial assets; transaction costs excluded from fair value; non-performance (own credit) risk included for liabilities.

**Worked example.** A corporate VC fund holds unlisted startup shares. The last funding round was 18 months ago at ₹1,000 per share. Since then, listed peer multiples have fallen 30% and the startup has missed revenue targets.
- Using the last round price is not automatically fair value; it may be stale.
- Calibrate: apply the revenue multiple implied at the last round, adjusted for peer multiple compression and performance, and consider liquidation preferences via an option pricing model.
- Classification: **Level 3**, with disclosure of inputs and sensitivity (e.g., a 10% change in the multiple changes value by ₹X).

**Indian context.** SEBI requires AIFs to value investments by an independent valuer and has issued valuation norms aligned to international guidelines (IPEV) [VERIFY: SEBI AIF valuation circular 2024]. Mutual funds value debt securities using prices from AMFI-appointed valuation agencies (CRISIL, ICRA) [VERIFY: SEBI MF valuation norms].

**Common mistakes.**
- Including transaction costs in fair value.
- Holding Level 3 investments at cost for years without recalibration.
- Using entity-specific synergies (value in use) instead of market participant assumptions.

**Interview angle.**
1. *What's the difference between Level 2 and Level 3?* Level 2 uses observable market inputs other than quoted prices for identical assets; Level 3 relies on significant unobservable inputs and management judgment.
2. *How would you value an unlisted startup stake for financial reporting?* Calibrate to the last round, then adjust using market multiples and performance, and allocate value across share classes with preferences (OPM or waterfall).

**Related topics:** [10.8] Startup valuation, [14.1] Fund NAV, [2.10] Financial instruments.

---

### [5.7] Sustainability and ESG Reporting: BRSR, ISSB and Assurance
<!-- tags: domain=financial-reporting; level=intermediate; roles=Consulting,ER,Audit,CF; keywords=BRSR, BRSR Core, ISSB, IFRS S1, IFRS S2, ESG reporting, sustainability assurance, Scope 1 2 3 emissions, value chain disclosures -->

**Definition.** Sustainability reporting discloses a company's environmental, social and governance (ESG) performance and risks. In India, SEBI mandates the Business Responsibility and Sustainability Report (BRSR); globally, the ISSB's IFRS S1 (general) and S2 (climate) standards are becoming the baseline.

**Why it matters.** ESG metrics now affect cost of capital, index inclusion, global supply chain access (e.g., EU carbon border adjustment) and investor screening. Consulting firms run large ESG practices, and finance roles increasingly handle sustainability data alongside financial data.

**Core mechanics.**
- **BRSR:** mandatory for the top 1,000 listed companies by market capitalisation; three sections (general disclosures, management and process, principle-wise performance on nine NGRBC principles).
- **BRSR Core:** a subset of key, assurable KPIs (GHG emissions, water, energy, waste, employee wellbeing, gender diversity, inclusive development, customer fairness, openness of business), with reasonable assurance phased in for the top listed companies; value chain disclosures phased separately [VERIFY: SEBI BRSR Core assurance and value chain glide path, including 2025 revisions].
- **ISSB (IFRS S1/S2):** investor-focused, financially material sustainability disclosures, with climate disclosures aligned to the former TCFD (governance, strategy, risk management, metrics and targets).
- **GHG scopes:** Scope 1 (direct emissions), Scope 2 (purchased energy), Scope 3 (value chain, often the largest).

**Worked example.** A cement company emits 0.6 tonnes CO2 per tonne of cement and produces 50 million tonnes a year.
- Scope 1 emissions ≈ 0.6 × 50 = **30 million tonnes CO2**
- If a carbon price of USD 20 per tonne were imposed, the annual cost would be USD 600 million, a material financial risk that would appear in IFRS S2 climate scenario analysis.

**Indian context.** India has notified a Carbon Credit Trading Scheme (CCTS) with emission-intensity targets for energy-intensive sectors [VERIFY: CCTS 2023 notification and sector targets]. ICAI has issued sustainability assurance standards (SSAE 3000, 3410) [VERIFY: ICAI SSAE standards].

**Common mistakes.**
- Treating ESG reporting as marketing rather than risk disclosure.
- Ignoring Scope 3, which is often most of a company's footprint.
- Confusing ESG ratings (opinions that vary by provider) with ESG disclosures (data).

**Interview angle.**
1. *What is BRSR Core?* A set of key ESG KPIs within BRSR that large listed companies must report with third-party assurance, improving reliability and comparability.
2. *Why do investors care about climate disclosure?* Transition risks (carbon pricing, regulation, demand shifts) and physical risks (floods, heat) can impair assets and cash flows; disclosure lets investors price them.

**Related topics:** [5.4] Annual report, [20.1] Risk management, [9.5] Strategic finance.

---

## Module 5 Glossary

| Term | Definition |
|---|---|
| BRSR | SEBI-mandated Business Responsibility and Sustainability Report |
| CODM | Chief operating decision maker, whose reviews define operating segments |
| Control | Power over relevant activities, exposure to variable returns, and ability to affect returns |
| Equity method | One-line accounting for associates and joint ventures |
| Fair value | Exit price in an orderly transaction between market participants |
| IFRS | International Financial Reporting Standards issued by the IASB |
| Ind AS | IFRS-converged Indian Accounting Standards |
| Interim report | Financial statements for a period shorter than a year |
| Joint operation | Arrangement giving rights to assets and obligations for liabilities |
| Key audit matter | Most significant matters in the auditor's judgment |
| Level 3 | Fair value based on significant unobservable inputs |
| LIFO reserve | Difference between FIFO and LIFO inventory values |
| NCI | Non-controlling interest: minority shareholders' share of subsidiaries |
| NFRA | National Financial Reporting Authority |
| Scope 3 | Indirect value-chain greenhouse gas emissions |

## Module 5 Rapid-Fire Quiz

1. 25% stake with significant influence: accounting method? **Equity method**
2. Parent owns 70% of Sub with revenue ₹100 Cr: revenue consolidated? **₹100 Cr**
3. Associate dividend: P&L income under the equity method? **No; reduces investment**
4. Listed share prices are which fair value level? **Level 1**
5. Does US GAAP allow impairment reversals for PPE? **No**
6. Reportable segment revenue threshold? **10% of combined segment revenue**
7. Minimum external revenue coverage by reportable segments? **75%**
8. Who notifies Ind AS? **MCA (central government)**
9. Do banks in India report under Ind AS? **Not yet (deferred)**
10. Which ISSB standard covers climate? **IFRS S2**

## Module 5 [VERIFY] Items

1. Companies (Ind AS) Rules thresholds; RBI and IRDAI Ind AS status
2. Ind AS 1 carve-out on covenant breach classification
3. SEBI ICDR Schedule VI restated financial information requirements
4. Companies (Restriction on Number of Layers) Rules 2017
5. SEBI LODR Schedule V (MD&A and governance disclosures)
6. CARO 2020 applicability exemptions
7. LODR Regulation 33 result timelines and limited review
8. SEBI AIF valuation circular (2024)
9. SEBI mutual fund valuation norms
10. SEBI BRSR Core assurance and value chain timelines (including 2025 revisions)
11. India Carbon Credit Trading Scheme targets
12. ICAI sustainability assurance standards

---

# Module 6: Audit and Assurance

## 6A. Purpose and Process

### [6.1] What an Audit Is and the Types of Audit
<!-- tags: domain=audit; level=foundation; roles=Audit,CF,Consulting,ER; keywords=statutory audit, internal audit, tax audit, forensic audit, cost audit, secretarial audit, reasonable assurance, limited review, true and fair -->

**Definition.** An audit is an independent examination of financial information to express an opinion on whether it is prepared, in all material respects, in accordance with the applicable financial reporting framework and gives a true and fair view. Auditors provide **reasonable assurance** (high but not absolute), not a guarantee.

**Why it matters.** Capital markets depend on trust in reported numbers. Audit failures (Satyam, IL&FS, DHFL in India; Enron and Wirecard globally) destroyed investor value and led to regulatory overhauls. Audit is also the starting career for many finance professionals (Big 4 and mid-tier firms).

**Core mechanics.**

| Type | Who performs | Purpose | Indian basis |
|---|---|---|---|
| Statutory (external) audit | Independent chartered accountant firm | Opinion on financial statements | Companies Act s.139–148 |
| Internal audit | In-house team or outsourced firm | Evaluate controls, risk management, efficiency; reports to audit committee | Companies Act s.138 (specified companies) |
| Tax audit | Chartered accountant | Verify tax-relevant information, Form 3CD | Income Tax Act s.44AB (above turnover thresholds) |
| Cost audit | Cost accountant | Cost records of specified industries | Companies Act s.148 |
| Secretarial audit | Company secretary | Compliance with corporate laws | Companies Act s.204; SEBI LODR Reg 24A |
| Forensic audit | Specialists | Investigate suspected fraud, often for lenders or regulators | Engagement-based |
| Limited review | Statutory auditor | Moderate (negative) assurance on quarterly results | SEBI LODR Reg 33 |
| Bank branch / concurrent audit | Chartered accountants | Bank operations checks | RBI directions |

*Levels of assurance:*
- **Reasonable assurance (audit):** positive opinion ("in our opinion the financial statements give a true and fair view").
- **Limited assurance (review):** negative form ("nothing has come to our attention that causes us to believe...").

*Inherent limitations:* sampling, management judgment and estimates, collusion and forgery, time and cost constraints.

**Worked example.** A listed company publishes Q2 results with a limited review report and annual results with a full audit. An investor should place more reliance on the annual figures; quarterly reviews involve mainly inquiry and analytical procedures, not detailed testing.

**Indian context.** Tax audit thresholds under s.44AB are ₹1 Cr turnover, rising to ₹10 Cr where cash transactions are within 5% [VERIFY: s.44AB thresholds and equivalent under the Income-tax Act 2025]. The Standards on Auditing (SAs) issued by ICAI mirror the International Standards on Auditing (ISAs).

**Common mistakes.**
- Thinking auditors are responsible for preparing financial statements (management is).
- Thinking an audit guarantees no fraud.
- Confusing internal audit (management's tool) with statutory audit (shareholders' tool).

**Interview angle.**
1. *What does "true and fair" mean?* The statements are free from material misstatement and faithfully represent the company's position and performance under the applicable framework; it is not exact precision.
2. *Why can't an audit detect all fraud?* Sampling, reliance on management representations, sophisticated concealment and collusion. Auditors provide reasonable, not absolute, assurance.

**Related topics:** [6.2] Audit process, [6.10] Fraud, [6.9] Independence.

---

### [6.2] The Risk-Based Audit Process
<!-- tags: domain=audit; level=foundation; roles=Audit,Consulting,CF; keywords=audit process, engagement letter, planning, risk assessment, SA 315, SA 330, substantive procedures, tests of controls, audit evidence, completion, management representation -->

**Definition.** Modern audits follow a risk-based approach: auditors identify where material misstatements are most likely and focus work there.

**Why it matters.** Understanding the audit cycle is essential for audit careers and for finance teams who prepare for audits. It also explains what auditors can and cannot reasonably detect.

**Core mechanics: phases.**

1. **Client acceptance and engagement** (SA 210, SA 220): independence checks, integrity of management, engagement letter defining scope and responsibilities.
2. **Planning** (SA 300): understand the entity and its environment, set overall strategy, materiality (SA 320), team and timing.
3. **Risk assessment** (SA 315): understand internal control, identify risks of material misstatement at financial statement and assertion levels; identify **significant risks** (revenue recognition is presumed significant; management override is always a significant risk under SA 240).
4. **Response to assessed risks** (SA 330):
   - **Tests of controls:** check whether controls operate effectively, allowing reduced substantive work.
   - **Substantive procedures:** tests of details (vouching, confirmation, inspection, recalculation) and substantive analytics.
5. **Evidence evaluation** (SA 500 series): sufficiency (quantity) and appropriateness (relevance and reliability). External confirmations (SA 505) are more reliable than internal documents.
6. **Completion:** subsequent events (SA 560), going concern (SA 570), written representations (SA 580), evaluating misstatements (SA 450), forming the opinion (SA 700, 705, 706, 701).

*Financial statement assertions:*

| For transactions | For balances |
|---|---|
| Occurrence | Existence |
| Completeness | Completeness |
| Accuracy | Rights and obligations |
| Cut-off | Valuation and allocation |
| Classification | Classification and presentation |

*Directional testing:* overstatement risk (assets, revenue) is tested by vouching from ledger to source documents (existence/occurrence); understatement risk (liabilities, expenses) by tracing from source documents to ledger (completeness), e.g., search for unrecorded liabilities using post-year-end payments.

**Worked example: testing receivables.** Risk: overstated receivables from fictitious sales.
- Send external confirmations to a sample of customers (existence).
- For non-responses, check subsequent cash receipts and shipping documents.
- Review ageing and assess ECL provision (valuation).
- Test cut-off: invoices around year end matched with delivery dates.

**Indian context.** SA 315 was revised in line with ISA 315 (Revised 2019) [VERIFY: ICAI revised SA 315 effective date]. Auditors of listed and specified companies also report on internal financial controls over financial reporting (IFC) under s.143(3)(i).

**Common mistakes.**
- Testing completeness of liabilities by vouching recorded items (wrong direction).
- Relying on internal documents when external evidence is available.
- Ignoring management override (journal entry testing is mandatory).

**Interview angle.**
1. *Walk me through an audit.* Acceptance, planning and materiality, risk assessment including controls, tests of controls and substantive procedures, then completion work (subsequent events, going concern, representations) and the opinion.
2. *How would you test for unrecorded liabilities?* Review payments made after year end and unpaid invoices received after year end, and trace to ensure liabilities existing at year end were recorded.

**Related topics:** [6.3] Materiality, [6.4] Audit risk, [6.6] Evidence and sampling.

---

### [6.3] Materiality (SA 320)
<!-- tags: domain=audit; level=intermediate; roles=Audit,CF,ER; keywords=materiality, performance materiality, clearly trivial, benchmark, SA 320, SA 450, qualitative materiality -->

**Definition.** Materiality is the magnitude of misstatement (individually or in aggregate) that could reasonably be expected to influence the economic decisions of users. Auditors set overall materiality, performance materiality and a clearly trivial threshold.

**Why it matters.** Materiality determines sample sizes, which misstatements are corrected, and whether the opinion is modified. It also applies to management's disclosures.

**Core mechanics.**
- **Overall materiality:** a percentage of an appropriate benchmark. Common practice ranges (judgment, not rules):

| Benchmark | Typical range | When used |
|---|---|---|
| Profit before tax | 5% (3–10%) | Profit-oriented, stable earnings |
| Revenue | 0.5–1% | Loss-making or volatile profit entities |
| Total assets | 1–2% | Asset-based entities, investment companies |
| Equity | 1–5% | Some financial entities |
| Expenses | 1–2% | Not-for-profits |

- **Performance materiality:** set lower (commonly 50–75% of overall) to reduce the risk that aggregate uncorrected and undetected misstatements exceed overall materiality.
- **Clearly trivial threshold:** misstatements below this (commonly 3–5% of overall materiality) are not accumulated.
- **Qualitative factors:** misstatements may be material regardless of size, e.g., those that turn a loss into a profit, breach covenants, involve related parties or fraud, or affect regulatory ratios.

**Worked example.** A company's PBT is ₹120 Cr.
- Overall materiality = 5% × 120 = **₹6.0 Cr**
- Performance materiality at 75% = **₹4.5 Cr**
- Clearly trivial at 5% of overall = **₹0.3 Cr**
- At year end, uncorrected misstatements total ₹4 Cr. Below materiality, so the opinion is not affected, but they are communicated to those charged with governance. If one ₹0.8 Cr misstatement converts a covenant pass into a breach, it is material qualitatively.

**Indian context.** NFRA has scrutinised materiality judgments in its audit quality inspection reports, criticising inappropriately high thresholds and benchmark choices [VERIFY: NFRA AQR findings]. SEBI LODR also uses materiality thresholds for disclosure of events (Reg 30) and related-party transactions (Reg 23).

**Common mistakes.**
- Treating materiality as a fixed formula.
- Ignoring qualitative materiality.
- Forgetting to revise materiality when actual results differ significantly from planning estimates.

**Interview angle.**
1. *How would you set materiality for a loss-making startup?* Profit is not a meaningful benchmark; use revenue (say 0.5–1%) or total expenses, considering user focus (investors may focus on cash burn and revenue).
2. *Why is performance materiality lower than overall materiality?* To leave a buffer for undetected and uncorrected misstatements, so that their aggregate stays below overall materiality.

**Related topics:** [6.4] Audit risk model, [2.1] Materiality in the framework.

---

### [6.4] The Audit Risk Model
<!-- tags: domain=audit; level=intermediate; roles=Audit,CF; keywords=audit risk, inherent risk, control risk, detection risk, risk of material misstatement, audit risk model -->

**Definition.** Audit risk is the risk that the auditor expresses an inappropriate opinion when the financial statements are materially misstated. It is the product of the risk of material misstatement (inherent risk × control risk) and detection risk.

**Why it matters.** The model explains how auditors calibrate the amount of testing: when the client's risks are high or controls weak, auditors must lower detection risk by doing more and better substantive work.

**Core mechanics.**
- **AR = IR × CR × DR**
  - **Inherent risk (IR):** susceptibility to misstatement before controls (complex estimates, cash, new revenue streams).
  - **Control risk (CR):** risk that controls fail to prevent or detect misstatement.
  - **Detection risk (DR):** risk that the auditor's procedures fail to detect misstatement; the only component the auditor controls.
- Rearranged: **DR = AR / (IR × CR)**. Higher IR × CR → lower acceptable DR → more substantive testing (larger samples, more reliable evidence, testing closer to year end).

**Worked example.** Target audit risk is 5%. For revenue, inherent risk is assessed at 80% and control risk at 50%.
- DR = 0.05 / (0.80 × 0.50) = **12.5%**
- If controls are found ineffective (CR = 100%): DR = 0.05 / 0.80 = **6.25%**, requiring roughly twice as much substantive assurance.

**Indian context.** The same model underlies ICAI SAs. NFRA inspections frequently cite insufficient response to significant risks (e.g., revenue, related-party transactions, going concern) as findings.

**Common mistakes.**
- Thinking the auditor can reduce inherent or control risk (only management can change controls).
- Treating the model as precise arithmetic; in practice risks are assessed as high/medium/low.

**Interview angle.**
1. *Which component of audit risk can the auditor control?* Detection risk, by changing the nature, timing and extent of procedures.
2. *If control risk rises, what do you do?* Lower detection risk: more substantive testing, larger samples, more external evidence, testing at year end rather than interim.

**Related topics:** [6.3] Materiality, [6.5] Internal controls.

---

## 6B. Controls, Evidence and Reporting

### [6.5] Internal Controls: COSO, IFC and SOX
<!-- tags: domain=audit; level=intermediate; roles=Audit,CF,Consulting,Fintech-PM; keywords=internal control, COSO framework, internal financial controls, SOX 404, segregation of duties, preventive control, detective control, IT general controls, entity level controls -->

**Definition.** Internal control is a process designed by management to provide reasonable assurance about reliable financial reporting, effective and efficient operations, and compliance with laws.

**Why it matters.** Strong controls prevent errors and fraud before they reach financial statements. For fintech and payments businesses, controls (reconciliations, maker-checker, access controls) are core to the product. Indian law requires directors and auditors to report on internal financial controls.

**Core mechanics.**

*COSO 2013 framework: five components (17 principles):*
1. Control environment (tone at the top, integrity, board oversight)
2. Risk assessment
3. Control activities
4. Information and communication
5. Monitoring activities

*Types of controls:*

| Type | Example |
|---|---|
| Preventive | Maker-checker approval for payments above ₹10 lakh |
| Detective | Daily bank reconciliation; exception reports |
| Manual | Manager review of journal entries |
| Automated | ERP three-way match (PO, goods receipt, invoice) before payment |
| IT general controls (ITGCs) | User access management, change management, backups |
| Entity-level | Code of conduct, whistleblower mechanism, audit committee oversight |

*Key principle: segregation of duties.* No single person should authorise, record and have custody of the same asset (e.g., the person who creates vendors should not approve payments).

*Deficiency levels:* control deficiency → significant deficiency → material weakness (a reasonable possibility that a material misstatement will not be prevented or detected on time).

**Worked example: procure-to-pay controls.**
- Vendor master changes require approval by a person outside accounts payable (prevents fake vendors).
- Three-way match automated in ERP (prevents paying for goods not received).
- Payments above threshold need dual authorisation (prevents unauthorised payments).
- Monthly vendor statement reconciliation (detects errors).
- ITGC: payment-file access restricted and logged.

**Indian context.** Section 134(5)(e) requires directors of listed companies to state that internal financial controls are adequate and operating effectively; s.143(3)(i) requires auditors to report on IFC over financial reporting (exempt for certain small private companies) [VERIFY: IFC reporting exemptions]. SEBI LODR requires CEO/CFO certification of controls (Reg 17(8)). US-listed Indian companies (e.g., Infosys, HDFC Bank ADRs) also comply with SOX 404.

**Common mistakes.**
- Designing controls without testing that they operate.
- Ignoring ITGCs; if access controls fail, automated controls cannot be relied on.
- Over-relying on detective controls in high-volume processes where preventive controls are cheaper.

**Interview angle.**
1. *What is segregation of duties? Give an example.* Splitting incompatible duties so one person cannot both commit and conceal an error or fraud, e.g., separating vendor creation from payment approval.
2. *(Fintech PM) What controls would you build into a payout product?* Maker-checker for bulk payouts, beneficiary validation (penny drop), velocity limits, idempotency keys, daily reconciliation with bank statements, and access logs.

**Related topics:** [6.2] Audit process, [6.10] Fraud, [20.4] Operational risk.

---

### [6.6] Audit Evidence, Sampling and Data Analytics
<!-- tags: domain=audit; level=intermediate; roles=Audit,Consulting,CF; keywords=audit evidence, sampling, statistical sampling, monetary unit sampling, analytical procedures, journal entry testing, data analytics, CAATs, external confirmation -->

**Definition.** Audit evidence is the information auditors use to reach conclusions. Sampling applies procedures to less than 100% of a population to draw conclusions about the whole. Data analytics allows testing of entire populations.

**Why it matters.** Evidence quality determines audit quality. Analytics has changed audit from sampling to full-population testing in many areas, a skill now prized in audit and consulting hiring.

**Core mechanics.**

*Reliability hierarchy (generally):* external > internal; obtained directly by the auditor > indirectly; documentary > oral; original documents > copies; generated under strong controls > weak controls.

*Procedures:* inspection, observation (e.g., inventory count), external confirmation, recalculation, reperformance, analytical procedures, inquiry (never sufficient alone).

*Sampling (SA 530):*
- Statistical (random, systematic, monetary unit sampling) or non-statistical (haphazard, judgmental).
- **Monetary unit sampling (MUS):** each rupee is a sampling unit, so larger items are more likely to be selected; suited for overstatement testing.
- Sampling risk vs non-sampling risk (wrong procedure, misinterpreting evidence).

*Analytical procedures (SA 520):* compare recorded amounts with expectations (e.g., payroll = headcount × average salary). Large unexplained differences require investigation.

*Journal entry testing (management override):* filter entries posted on weekends, by senior management, just below approval limits, to unusual account combinations (e.g., Dr Revenue reversal posted after year end), or with round numbers.

**Worked example: substantive analytic for interest expense.** Average debt ₹500 Cr at an average rate of 9% → expected interest ₹45 Cr. Recorded interest ₹38 Cr. Difference ₹7 Cr exceeds the threshold (say ₹1.5 Cr). Investigation finds ₹7 Cr of interest capitalised to CWIP; auditor checks whether the projects qualify under Ind AS 23.

**Indian context.** Large Indian audit firms use analytics platforms on ERP data (SAP, Oracle); the Companies Act audit trail requirement now gives auditors edit logs to test [VERIFY: audit trail reporting under Rule 11(g) of Companies (Audit and Auditors) Rules].

**Common mistakes.**
- Relying only on inquiry.
- Using non-statistical samples and then extrapolating as if statistical.
- Investigating analytic differences without corroborating management's explanations.

**Interview angle.**
1. *How would you audit revenue for an e-commerce company with millions of transactions?* Use data analytics on the full population: reconcile order data to payment gateway settlements and bank receipts, test returns and cancellations, cut-off around year end, and test IT controls over the order system.
2. *What's monetary unit sampling?* A probability-proportional-to-size method where each rupee has an equal chance of selection, so high-value items are more likely to be tested.

**Related topics:** [6.2] Audit process, [4.9] Red flags.

---

### [6.7] The Auditor's Report: Opinions, KAMs and Going Concern
<!-- tags: domain=audit; level=foundation; roles=Audit,ER,IB,CF,Consulting; keywords=unmodified opinion, qualified opinion, adverse opinion, disclaimer of opinion, emphasis of matter, key audit matters, going concern, SA 700, SA 705, SA 706, SA 701, SA 570 -->

**Definition.** The auditor's report communicates the auditor's opinion on the financial statements and other required matters.

**Why it matters.** The opinion type is the first thing a careful investor or lender checks. Modified opinions or going concern doubts can trigger covenant breaches, stock price falls and regulatory action.

**Core mechanics.**

*Opinion types (SA 700, SA 705):*

| Situation | Misstatement or limitation is material but not pervasive | Material and pervasive |
|---|---|---|
| Financial statements materially misstated | **Qualified** ("except for") | **Adverse** ("do not give a true and fair view") |
| Unable to obtain sufficient appropriate evidence | **Qualified** ("except for" possible effects) | **Disclaimer** ("we do not express an opinion") |

No material issue → **Unmodified (clean)** opinion.

*Other paragraphs:*
- **Emphasis of matter (SA 706):** draws attention to a matter properly disclosed that is fundamental to users' understanding (e.g., a major litigation), without modifying the opinion.
- **Other matter:** relevant matters not presented in the statements (e.g., reliance on other auditors for subsidiaries).
- **Key audit matters (SA 701):** required for listed entities; describe the most significant matters and how the audit addressed them.
- **Material uncertainty related to going concern (SA 570):** separate section when events cast significant doubt but disclosure is adequate. If disclosure is inadequate, the opinion is modified.

*Going concern indicators:* net liability position, negative operating cash flows, loan defaults or covenant breaches, inability to pay creditors, loss of key customers or licences, pending litigation that could not be met.

**Worked example.** An auditor finds that a company did not provide for ₹20 Cr of doubtful receivables (materiality ₹6 Cr). The misstatement is material but confined to receivables and profit → **qualified opinion**. If the company also could not support ₹300 Cr of inventory and ₹200 Cr of cash balances in a company with ₹800 Cr total assets, the issues would be pervasive → **disclaimer** (inability to obtain evidence) or **adverse** (if misstatement is established).

**Indian context.** Listed companies with modified opinions must disclose a "Statement on Impact of Audit Qualifications" with results [VERIFY: SEBI circular on audit qualifications]. Auditors of Indian companies also issue the CARO report and IFC report as annexures, so read all three.

**Common mistakes.**
- Treating an emphasis of matter as a qualification (it is not).
- Ignoring KAMs; they map the riskiest areas.
- Assuming a clean opinion means the business is healthy (it speaks to reporting, not performance).

**Interview angle.**
1. *Difference between qualified, adverse and disclaimer?* Qualified: material but not pervasive issue. Adverse: material and pervasive misstatement. Disclaimer: auditor could not obtain sufficient evidence and possible effects are material and pervasive.
2. *What's an emphasis of matter?* A paragraph highlighting a properly disclosed, fundamental matter; it does not modify the opinion.

**Related topics:** [6.8] CARO, [5.4] Annual report, [4.9] Red flags.

---

### [6.8] CARO 2020 and Other Indian Statutory Reporting
<!-- tags: domain=audit; level=intermediate; roles=Audit,ER,CF; keywords=CARO 2020, Companies Auditor's Report Order, section 143, internal financial controls reporting, fraud reporting, wilful defaulter, benami, audit trail -->

**Definition.** The Companies (Auditor's Report) Order 2020 (CARO 2020) requires auditors of applicable companies to report on specific matters in addition to the main opinion.

**Why it matters.** CARO answers are a goldmine for analysts: they flag defaults to lenders, statutory dues outstanding, fraud, related-party lending and use of short-term funds for long-term purposes, all in one place.

**Core mechanics: selected CARO 2020 clauses** [VERIFY: CARO 2020 clause numbering and content].

| Area | What the auditor reports |
|---|---|
| PPE and intangibles | Records, physical verification, title deeds of immovable property in company's name, benami proceedings |
| Inventory | Physical verification; discrepancies ≥10%; quarterly returns to banks vs books for working capital limits above ₹5 Cr |
| Loans and guarantees | Loans and investments given, terms, overdue amounts, loans to promoters and related parties |
| Deposits | Compliance with deposit rules |
| Statutory dues | Undisputed dues outstanding over 6 months; disputed dues pending |
| Undisclosed income | Income surrendered in tax assessments not recorded |
| Repayment of loans | Defaults, wilful defaulter status, diversion of term loans, short-term funds used for long-term purposes, borrowing to fund subsidiaries |
| Fraud | Fraud by or on the company; whistleblower complaints |
| Related parties | Compliance with s.177 and s.188 |
| Internal audit | Adequacy of internal audit system |
| Cash losses | Cash losses in current or preceding year |
| Auditor resignation | Issues raised by outgoing auditors |
| Going concern ability | Material uncertainty on meeting liabilities within one year |
| CSR | Unspent CSR amounts |

*Other statutory reporting under s.143:* adequacy of IFC (s.143(3)(i)); fraud reporting to the central government for frauds of ₹1 Cr or more (s.143(12)), smaller frauds to the audit committee [VERIFY: Rule 13 Companies (Audit and Auditors) Rules threshold]; audit trail compliance.

**Worked example.** CARO for a mid-cap reports: (a) quarterly stock statements filed with banks show inventory 25% higher than books; (b) short-term borrowings of ₹80 Cr used for long-term capex. Interpretation: (a) suggests inflated drawing power, a red flag for the lender and possibly window dressing; (b) indicates an asset-liability mismatch and refinancing risk.

**Indian context.** CARO 2020 applies to most companies except banking, insurance, Section 8 companies, one-person companies, small companies and certain private companies below thresholds [VERIFY: CARO 2020 para 1(2) exemptions].

**Common mistakes.**
- Skipping CARO because the main opinion is clean.
- Ignoring disputed statutory dues listed in CARO, which may be large relative to net worth.

**Interview angle.**
1. *What is CARO and why would an analyst read it?* Additional auditor reporting under the Companies Act on matters like defaults, statutory dues, related-party loans and fraud; it surfaces risks not obvious in the statements.
2. *What does "short-term funds used for long-term purposes" signal?* Asset-liability mismatch and refinancing risk, the pattern behind several NBFC and corporate failures.

**Related topics:** [6.7] Auditor's report, [4.9] Red flags, [19.5] Credit appraisal.

---

### [6.9] Auditor Independence, Rotation and Regulation (NFRA, ICAI, PCAOB)
<!-- tags: domain=audit; level=intermediate; roles=Audit,Consulting,CF; keywords=auditor independence, auditor rotation, prohibited services, section 144, section 139, NFRA, ICAI, PCAOB, audit committee, audit fees -->

**Definition.** Independence means the auditor is free from relationships and interests that would compromise objectivity. Regulation sets rules on appointment, rotation, permitted services and oversight.

**Why it matters.** Audit failures often involve compromised independence (long tenure, large non-audit fees). Indian regulation tightened after Satyam and IL&FS, and NFRA has become an active enforcer.

**Core mechanics (India).**
- **Appointment (s.139):** shareholders appoint at the AGM for a five-year term; for government companies, the CAG appoints.
- **Rotation (s.139(2)):** for listed and specified companies, an individual auditor can serve one term of 5 years; an audit firm two terms of 5 years; then a 5-year cooling-off period [VERIFY: Companies (Audit and Auditors) Rules, Rule 5 applicability].
- **Prohibited services (s.144):** accounting and bookkeeping, internal audit, design and implementation of financial information systems, actuarial, investment advisory, investment banking, outsourced financial services, management services.
- **Removal (s.140):** before term requires central government approval and special resolution.
- **Audit committee (s.177):** recommends appointment and remuneration, reviews independence.
- **NFRA (s.132):** oversees audits of listed companies and large unlisted companies, can investigate, debar auditors and impose penalties.
- **ICAI:** professional body, issues standards, disciplinary authority for other entities.
- **Globally:** PCAOB (US) inspects auditors of US-listed companies; SOX section 201 prohibits similar non-audit services; EU mandates firm rotation (10 years, extendable).

**Worked example.** An audit firm has audited a listed company for 10 years (two terms). It must rotate out and cannot be reappointed for 5 years. A network firm of the auditor offering internal audit services to the same company would breach s.144.

**Indian context.** Under SEBI LODR, listed companies disclose audit fees and auditor resignations with reasons; auditors resigning must complete the limited review or audit for the quarter in specified circumstances [VERIFY: SEBI circular Oct 2019 on auditor resignation].

**Common mistakes.**
- Assuming tax advisory is prohibited (tax services are generally permitted with audit committee approval, though restrictions apply in some jurisdictions).
- Ignoring network firm services in independence analysis.

**Interview angle.**
1. *Why mandate audit firm rotation?* Long tenure can create familiarity threats and erode scepticism. Rotation brings fresh eyes; critics argue it loses client knowledge and raises costs.
2. *What is NFRA's role?* An independent regulator overseeing audit quality for listed and large companies, with powers to investigate and penalise auditors.

**Related topics:** [6.1] Audit types, [24.5] Regulators.

---

### [6.10] Fraud, Forensic Audit and Professional Scepticism
<!-- tags: domain=audit; level=advanced; roles=Audit,Consulting,ER,CF; keywords=fraud triangle, SA 240, fraudulent financial reporting, misappropriation of assets, forensic audit, professional scepticism, whistleblower, section 143(12), red flags -->

**Definition.** Fraud is an intentional act involving deception to gain an unjust or illegal advantage. In audit, it takes two forms: fraudulent financial reporting (manipulating statements) and misappropriation of assets (theft).

**Why it matters.** Frauds destroy enormous value. Auditors are required to approach every audit with professional scepticism and specific procedures for fraud risk. Forensic accounting is a growing career path within Big 4 firms.

**Core mechanics.**

*The fraud triangle:*
1. **Incentive / pressure:** earnings targets, debt covenants, personal financial pressure, market expectations.
2. **Opportunity:** weak controls, complex transactions, management override, related parties.
3. **Rationalisation:** "everyone does it", "it's temporary", "the company owes me".

*Common schemes:*

| Fraudulent reporting | Asset misappropriation |
|---|---|
| Fictitious revenue, round-tripping | Fake vendors, payroll ghosts |
| Premature revenue (bill-and-hold, side letters) | Skimming cash receipts |
| Capitalising expenses | Expense reimbursement fraud |
| Understating liabilities, hiding debt | Inventory theft |
| Overstating cash (fabricated bank statements) | Kickbacks from suppliers |
| Undisclosed related-party transactions | Misuse of company assets |

*Auditor responsibilities (SA 240):*
- Presume revenue recognition is a fraud risk (rebuttable).
- Always treat management override as a significant risk: test journal entries, review estimates for bias, evaluate unusual transactions.
- Team discussion ("brainstorming") on how fraud could occur.
- Inquire of management, internal audit and those charged with governance.

*Forensic audit:* reactive investigation using document review, data analytics (Benford's law, duplicate payments, vendor-employee address matching), interviews, digital forensics and fund tracing, producing evidence that can stand up in legal proceedings.

**Worked example: Benford's law.** In many natural datasets, the leading digit is 1 about 30.1% of the time, 2 about 17.6%, falling to 9 at about 4.6% (P(d) = log10(1 + 1/d)). An analysis of 50,000 expense claims shows the digit 4 leading 15% of the time against an expected 9.7%, concentrated just below a ₹5,000 approval limit. This suggests claims are split or inflated to stay under the threshold.

**Indian context.** Satyam (2009) involved fabricated cash and bank balances of over ₹5,000 Cr and fictitious invoices, leading to tighter Companies Act 2013 provisions [VERIFY: Satyam fraud figures]. Auditors must report frauds above the prescribed threshold to the central government under s.143(12). RBI requires banks to classify fraud accounts and lenders often commission forensic audits for stressed borrowers, with the Supreme Court (2023) requiring that borrowers be heard before fraud classification [VERIFY: SBI v Rajesh Agarwal, March 2023].

**Common mistakes.**
- Accepting management explanations without corroboration.
- Assuming small companies are low fraud risk.
- Confusing error (unintentional) with fraud (intentional); the distinction matters for reporting.

**Interview angle.**
1. *Explain the fraud triangle.* Pressure, opportunity and rationalisation together create fraud risk; controls mainly reduce opportunity.
2. *How would you detect fictitious revenue?* Rising DSO, revenue concentrated at period end, customers with no physical presence, confirmations failing, cash not matching revenue, round-tripping through related parties; test full populations with analytics.
3. *What is professional scepticism?* A questioning mind, alert to conditions that may indicate misstatement, and critical assessment of evidence, especially management explanations.

**Related topics:** [4.9] Red flags, [4.10] Beneish M-score, [6.5] Controls.

---

## Module 6 Glossary

| Term | Definition |
|---|---|
| Adverse opinion | Statements are materially and pervasively misstated |
| Audit risk | Risk of an inappropriate opinion on materially misstated statements |
| CARO 2020 | Order requiring additional auditor reporting on specific matters |
| Detection risk | Risk that audit procedures miss a material misstatement |
| Disclaimer | No opinion, owing to inability to obtain sufficient evidence |
| Emphasis of matter | Paragraph highlighting a disclosed, fundamental matter without modifying the opinion |
| Fraud triangle | Pressure, opportunity and rationalisation |
| Key audit matter | Most significant matters in the auditor's judgment, reported for listed entities |
| Limited review | Moderate-assurance engagement on interim results |
| Materiality | Misstatement size that could influence users' decisions |
| Monetary unit sampling | Sampling where each rupee is a sampling unit |
| Performance materiality | Lower threshold used to plan procedures |
| Professional scepticism | Questioning mind and critical assessment of evidence |
| Qualified opinion | "Except for" opinion for material, non-pervasive issues |
| Segregation of duties | Separating incompatible tasks to prevent and detect fraud |

## Module 6 Rapid-Fire Quiz

1. Material but not pervasive misstatement: opinion? **Qualified**
2. Which audit risk component does the auditor control? **Detection risk**
3. AR 5%, IR 100%, CR 50%: DR? **10%**
4. PBT ₹200 Cr at 5%: overall materiality? **₹10 Cr**
5. Is emphasis of matter a modification? **No**
6. Audit firm maximum tenure for a listed company? **Two terms of 5 years**
7. Can an auditor provide internal audit services to the same company? **No (s.144)**
8. What fraud risk is always significant under SA 240? **Management override of controls**
9. Expected frequency of leading digit 1 under Benford's law? **≈30.1%**
10. Which body inspects audit quality of Indian listed companies? **NFRA**

## Module 6 [VERIFY] Items

1. Income Tax Act s.44AB tax audit thresholds (and Income-tax Act 2025 equivalent)
2. ICAI revised SA 315 effective date
3. NFRA audit quality review findings on materiality
4. IFC reporting exemptions for small private companies
5. Audit trail reporting under Rule 11(g)
6. SEBI circular on impact of audit qualifications
7. CARO 2020 clauses and applicability exemptions
8. Rule 13 fraud reporting threshold (₹1 Cr)
9. Rule 5 auditor rotation applicability
10. SEBI circular on auditor resignation (October 2019)
11. Satyam fraud figures
12. Supreme Court SBI v Rajesh Agarwal (2023) on fraud classification

---

# Module 7: Cost and Management Accounting

### [7.1] Cost Concepts and Classification
<!-- tags: domain=cost-management-accounting; level=foundation; roles=CF,Consulting,Fintech-PM,PE; keywords=fixed cost, variable cost, semi-variable cost, direct cost, indirect cost, overheads, relevant cost, sunk cost, opportunity cost, step cost, unit economics -->

**Definition.** Cost classification groups costs by behaviour (how they change with activity), traceability (whether they can be assigned to a product), function (production, selling, administration) and decision relevance.

**Why it matters.** Pricing, product profitability, budgeting and unit economics all depend on correctly separating fixed from variable and direct from indirect costs. Most "product profitability" mistakes in consulting and product roles come from allocating fixed overheads as if they were variable.

**Core mechanics.**

| By behaviour | Example |
|---|---|
| Variable | Raw materials, payment gateway fees per transaction, delivery cost per order |
| Fixed | Rent, salaried staff, software licences |
| Semi-variable (mixed) | Electricity (fixed connection + usage), telecom plans |
| Step-fixed | A supervisor per 20 workers; a new server per 1 million users |

| By traceability | Example |
|---|---|
| Direct | Materials and labour directly in a product; cloud cost per tenant |
| Indirect (overheads) | Factory rent, HR, shared engineering |

| For decisions | Meaning |
|---|---|
| Relevant cost | Future, incremental cash cost that differs between alternatives |
| Sunk cost | Already incurred; irrelevant |
| Opportunity cost | Benefit forgone from the next-best alternative |
| Avoidable cost | Eliminated if an activity stops |
| Committed cost | Cannot be changed in the short term (leases) |

*Separating mixed costs: high-low method.* Variable cost per unit = (Cost at high activity − Cost at low activity) / (High activity − Low activity).

**Worked example: high-low.** Electricity cost is ₹1,30,000 at 10,000 machine hours and ₹90,000 at 6,000 hours.
- Variable rate = (1,30,000 − 90,000) / (10,000 − 6,000) = **₹10 per hour**
- Fixed = 1,30,000 − 10 × 10,000 = **₹30,000 per month**
- Cost at 8,000 hours = 30,000 + 80,000 = **₹1,10,000**

**Indian context.** Specified companies must maintain cost records and, above thresholds, have them audited by cost accountants under s.148 of the Companies Act and the Companies (Cost Records and Audit) Rules 2014 [VERIFY: cost audit thresholds]. The Institute of Cost Accountants of India (ICMAI) issues Cost Accounting Standards (CAS).

**Common mistakes.**
- Treating allocated fixed overhead as a per-unit cost that disappears if volume drops.
- Assuming costs are linear over all volumes (step costs break this).
- Including sunk costs in decisions.

**Interview angle.**
1. *(Fintech PM) What are the variable costs of a UPI payment for a payments app?* Largely switch and processing costs, customer support per transaction, fraud losses and any incentives or cashback; MDR on UPI P2M is currently zero, so revenue must come from other sources.
2. *Why does it matter whether a cost is fixed or variable?* It determines break-even, operating leverage, pricing floors and how profits respond to volume changes.

**Related topics:** [7.4] CVP analysis, [7.7] Relevant costing, [9.2] Unit economics.

---

### [7.2] Costing Methods: Job, Process and Activity-Based Costing
<!-- tags: domain=cost-management-accounting; level=intermediate; roles=CF,Consulting,PE; keywords=job costing, process costing, activity-based costing, ABC, cost driver, overhead allocation, cost pool, product profitability -->

**Definition.** Costing methods assign costs to products, services or customers. Job costing tracks costs per unique job; process costing averages costs over continuous production; activity-based costing (ABC) assigns overheads based on the activities that drive them.

**Why it matters.** Traditional volume-based overhead allocation often overcosts high-volume, simple products and undercosts low-volume, complex ones, leading to wrong pricing and product decisions. ABC is a staple consulting tool for product and customer profitability analysis.

**Core mechanics.**

| Method | Used for | Cost accumulation |
|---|---|---|
| Job costing | Customised work: construction, consulting, shipbuilding | Per job/order |
| Process costing | Continuous, homogeneous output: cement, chemicals, refining | Per process, averaged per unit (equivalent units) |
| Batch costing | Pharma batches, garments | Per batch |
| Activity-based costing | Diverse products with high overheads | Overheads pooled by activity, assigned by cost drivers |

*ABC steps:*
1. Identify activities (set-ups, inspections, order handling).
2. Pool overhead costs by activity.
3. Choose a cost driver for each (number of set-ups, inspections, orders).
4. Compute rate per driver unit.
5. Assign to products by driver consumption.

**Worked example.** Overheads ₹10 lakh: set-ups ₹6 lakh (100 set-ups) and inspections ₹4 lakh (200 inspections).

| | Product A | Product B |
|---|---|---|
| Units | 10,000 | 2,000 |
| Set-ups | 20 | 80 |
| Inspections | 50 | 150 |

*Traditional (per unit):* ₹10 lakh / 12,000 units = **₹83.3 per unit** for both.

*ABC:* set-up rate = ₹6,000; inspection rate = ₹2,000.
- A: 20 × 6,000 + 50 × 2,000 = ₹2,20,000 → **₹22 per unit**
- B: 80 × 6,000 + 150 × 2,000 = ₹7,80,000 → **₹390 per unit**

Traditional costing massively subsidised the complex, low-volume Product B. If B's price is ₹300, it looks profitable traditionally but loses money under ABC.

**Indian context.** Indian manufacturers often use process costing for continuous industries (steel, cement) and ABC in FMCG and banking for product and branch profitability. Banks use funds transfer pricing plus activity costs to compute product profitability.

**Common mistakes.**
- Using too many cost drivers (expensive, little added accuracy).
- Treating ABC costs as avoidable in the short term (many activity costs are fixed).
- Ignoring customer-level costs (some customers order small quantities often and are unprofitable).

**Interview angle.**
1. *When is ABC most useful?* When overheads are a large share of cost and products differ in complexity, volume, or service needs.
2. *A client says their best-selling product has the lowest margin. What could be happening?* Overhead allocation by volume may overcost it; run an ABC analysis to check real resource consumption.

**Related topics:** [7.1] Cost concepts, [7.7] Relevant costing, [9.4] Product profitability.

---

### [7.3] Marginal (Variable) Costing vs Absorption Costing
<!-- tags: domain=cost-management-accounting; level=intermediate; roles=CF,Consulting,Audit; keywords=marginal costing, absorption costing, contribution margin, fixed production overhead, inventory valuation, profit reconciliation -->

**Definition.** Absorption costing includes fixed production overheads in product cost (and therefore in inventory). Marginal (variable) costing treats fixed production overheads as period costs, expensed in full each period.

**Why it matters.** Under absorption costing, producing more than you sell defers fixed costs into inventory and raises reported profit, a known way to manage earnings. Financial reporting (Ind AS 2) requires absorption costing; internal decision-making is usually better served by marginal costing.

**Core mechanics.**
- Absorption cost per unit = Variable production cost + Fixed production overhead per unit (based on normal capacity).
- Marginal costing profit = Contribution (Sales − all variable costs) − all fixed costs.
- Profit difference = Change in inventory units × Fixed overhead per unit.
  - Production > Sales → absorption profit higher.
  - Production < Sales → marginal profit higher.

**Worked example.** Production 10,000 units; sales 8,000 units at ₹100. Variable cost ₹60 per unit. Fixed production overhead ₹2,00,000 (₹20 per unit at 10,000 units). No opening inventory.

| | Marginal costing | Absorption costing |
|---|---|---|
| Sales | 8,00,000 | 8,00,000 |
| Cost of sales | 8,000 × 60 = 4,80,000 | 8,000 × 80 = 6,40,000 |
| Fixed overhead expensed | 2,00,000 | included in cost of sales |
| **Profit** | **1,20,000** | **1,60,000** |
| Closing inventory | 2,000 × 60 = 1,20,000 | 2,000 × 80 = 1,60,000 |

Difference = 2,000 units × ₹20 = **₹40,000**, the fixed overhead carried in inventory.

**Indian context.** Ind AS 2 requires fixed production overheads to be allocated on normal capacity; unallocated overheads from low production are expensed. Cost Accounting Standard CAS-2 deals with capacity determination [VERIFY: CAS-2].

**Common mistakes.**
- Allocating fixed overhead on actual low production (inflates unit costs in downturns).
- Rewarding managers on absorption profit, encouraging overproduction.

**Interview angle.**
1. *How can a manager boost profit without selling more?* Under absorption costing, by producing more than demand, which parks fixed overhead in inventory.
2. *Why is marginal costing better for decisions?* Fixed costs don't change with short-term decisions; contribution shows the true incremental effect of volume.

**Related topics:** [2.5] Inventory, [7.4] CVP.

---

### [7.4] Cost-Volume-Profit Analysis, Break-Even and Operating Leverage
<!-- tags: domain=cost-management-accounting; level=foundation; roles=CF,Consulting,Fintech-PM,PE; keywords=CVP analysis, break-even point, contribution margin, contribution margin ratio, margin of safety, target profit, degree of operating leverage -->

**Definition.** Cost-volume-profit (CVP) analysis examines how changes in volume, price and costs affect profit. Break-even is the volume at which total revenue equals total cost.

**Why it matters.** Break-even analysis answers "how many units, orders or subscribers do we need to cover costs?", a question in every startup pitch, product launch business case and consulting market-entry case.

**Core mechanics.**
- Contribution margin (CM) per unit = Price − Variable cost per unit
- CM ratio = CM / Price
- Break-even units = Fixed costs / CM per unit
- Break-even revenue = Fixed costs / CM ratio
- Units for target profit = (Fixed costs + Target profit) / CM per unit
- Margin of safety = (Actual sales − Break-even sales) / Actual sales
- Degree of operating leverage (DOL) = Contribution / EBIT; % change in EBIT ≈ DOL × % change in sales

**Worked example.** Price ₹500; variable cost ₹300; fixed costs ₹20 lakh a year.
- CM = **₹200**; CM ratio = **40%**
- Break-even = 20,00,000 / 200 = **10,000 units** (₹50 lakh revenue)
- For ₹10 lakh profit: (20 + 10) lakh / 200 = **15,000 units**
- At actual sales of 14,000 units: profit = 14,000 × 200 − 20,00,000 = ₹8 lakh; margin of safety = 4,000 / 14,000 = **28.6%**
- DOL = 28,00,000 / 8,00,000 = **3.5x**: a 10% sales increase raises EBIT about 35%

*Multi-product break-even:* use a weighted average CM based on the sales mix.

**Indian context.** Quick-commerce and food-delivery companies discuss "contribution margin per order" and "breakeven at the dark store or city level" in investor communications, which is CVP in practice: fixed costs of a dark store are covered once order density crosses break-even.

**Common mistakes.**
- Forgetting that break-even assumes constant price, variable cost and mix.
- Including fixed costs in contribution.
- Ignoring step costs that shift break-even at higher volumes.

**Interview angle.**
1. *A new café has rent and salaries of ₹3 lakh a month, average bill ₹400 and variable cost ₹160. How many bills to break even?* CM = ₹240; 3,00,000 / 240 = 1,250 bills a month, about 42 a day.
2. *What is operating leverage and why does it matter?* The sensitivity of operating profit to sales, driven by the share of fixed costs. High operating leverage boosts profits in upturns and hurts in downturns.

**Related topics:** [7.1] Cost behaviour, [9.2] Unit economics, [8.7] Financial leverage.

---

### [7.5] Budgeting and Planning Systems
<!-- tags: domain=cost-management-accounting; level=foundation; roles=CF,Consulting,Fintech-PM; keywords=budgeting, master budget, flexible budget, zero-based budgeting, rolling forecast, incremental budgeting, beyond budgeting, capex budget, cash budget -->

**Definition.** A budget is a quantitative plan for a future period, usually a year, covering revenue, costs, capex and cash. Budgeting systems differ in how they set targets and adjust to reality.

**Why it matters.** Budgets allocate resources, set targets and enable performance evaluation. FP&A roles in companies and fintechs centre on budgeting and forecasting cycles.

**Core mechanics.**

*Master budget components:* sales budget → production budget → materials, labour and overhead budgets → cost of goods sold → operating expense budgets → budgeted P&L → capex budget → cash budget → budgeted balance sheet.

*Types:*

| Approach | How it works | Pros | Cons |
|---|---|---|---|
| Incremental | Last year ± adjustment | Simple | Perpetuates inefficiencies |
| Zero-based (ZBB) | Every cost justified from zero | Cuts waste | Time-consuming |
| Flexible | Adjusts allowed costs to actual activity | Fair performance evaluation | Needs cost behaviour data |
| Rolling forecast | Always looks 12–18 months ahead, updated quarterly | Responsive | Resource-intensive |
| Activity-based | Built from activity drivers | Links cost to output | Complex |
| Driver-based | Built from KPIs (orders, conversion, AOV) | Ties to operations | Needs good data |

*Cash budget:* opening cash + receipts − payments = closing cash; reveals funding gaps early.

**Worked example: flexible budget.** Static budget: 10,000 units, variable cost ₹60/unit (₹6 lakh), fixed ₹2 lakh. Actual: 12,000 units, variable cost ₹7.0 lakh, fixed ₹2.1 lakh.
- Static comparison: variable cost ₹1 lakh over budget (misleading).
- Flexible budget at 12,000 units: variable allowed = 12,000 × 60 = ₹7.2 lakh. Actual ₹7.0 lakh → **₹20,000 favourable**. Fixed: ₹10,000 adverse.

**Indian context.** Indian startups typically run driver-based monthly plans tied to board-approved annual operating plans (AOPs) and burn targets. Government budgeting uses outcome budgets alongside line-item budgets.

**Common mistakes.**
- Evaluating managers against a static budget when volumes changed.
- Budget padding ("slack") and "use it or lose it" spending at year end.
- Ignoring cash timing when budgeting profit.

**Interview angle.**
1. *What's the advantage of a rolling forecast over an annual budget?* It keeps a constant forward horizon and incorporates new information, reducing reliance on outdated assumptions.
2. *When would you use zero-based budgeting?* During cost transformation or when cost bases have grown without scrutiny; often applied to discretionary spend (marketing, travel, consultants).

**Related topics:** [7.6] Variance analysis, [9.1] FP&A.

---

### [7.6] Standard Costing and Variance Analysis
<!-- tags: domain=cost-management-accounting; level=intermediate; roles=CF,Consulting; keywords=standard costing, variance analysis, material price variance, material usage variance, labour rate variance, labour efficiency variance, sales volume variance, favourable, adverse -->

**Definition.** Standard costing sets expected costs per unit (standard quantity × standard price). Variance analysis compares actual results with standards (or budgets) and breaks differences into price and quantity effects.

**Why it matters.** Variances pinpoint where performance diverged and who is accountable (procurement for price, production for usage). FP&A teams present monthly variance bridges to management.

**Core mechanics.**
- Material price variance = (Standard price − Actual price) × Actual quantity
- Material usage variance = (Standard quantity for actual output − Actual quantity) × Standard price
- Labour rate variance = (Standard rate − Actual rate) × Actual hours
- Labour efficiency variance = (Standard hours for actual output − Actual hours) × Standard rate
- Sales price variance = (Actual price − Standard price) × Actual units sold
- Sales volume variance = (Actual units − Budgeted units) × Standard contribution (or profit) per unit
- Positive = favourable (F); negative = adverse (A).

**Worked example.** Standard: 2 kg of material at ₹50 per kg; 3 labour hours at ₹200 per hour. Actual output: 1,000 units, using 2,100 kg at ₹48 and 3,200 hours at ₹210.

*Materials:*
- Price: (50 − 48) × 2,100 = **₹4,200 F**
- Usage: (2,000 − 2,100) × 50 = **₹5,000 A**
- Total: ₹1,00,000 standard vs ₹1,00,800 actual = **₹800 A** ✓

*Labour:*
- Rate: (200 − 210) × 3,200 = **₹32,000 A**
- Efficiency: (3,000 − 3,200) × 200 = **₹40,000 A**
- Total: ₹6,00,000 standard vs ₹6,72,000 actual = **₹72,000 A** ✓

*Interpretation:* buying cheaper material saved ₹4,200 but extra usage cost ₹5,000, possibly lower-quality material causing wastage; the variances may be linked, so procurement should not be rewarded in isolation.

**Indian context.** Standard costing remains common in Indian manufacturing (auto components, FMCG, pharma). In services and tech, the same logic appears as price-volume-mix bridges in monthly business reviews.

**Common mistakes.**
- Using budgeted output instead of actual output for standard quantity.
- Treating variances in isolation when they are linked.
- Mixing up the sign convention.

**Interview angle.**
1. *Revenue missed budget by ₹10 Cr. How would you explain it?* Break into price, volume and mix variances; then dig into drivers (lower volume by region, discounting, mix shift to lower-priced products).
2. *Material price variance is favourable, usage variance adverse. What might be happening?* Cheaper, lower-quality material causing higher wastage.

**Related topics:** [7.5] Budgeting, [9.1] Performance management.

---

### [7.7] Relevant Costing for Decisions: Make or Buy, Special Orders, Shutdown
<!-- tags: domain=cost-management-accounting; level=intermediate; roles=CF,Consulting,Fintech-PM,PE; keywords=relevant costing, make or buy, outsourcing, special order, shutdown decision, limiting factor, opportunity cost, avoidable fixed costs -->

**Definition.** Relevant costing evaluates decisions using only future, incremental cash flows that differ between alternatives.

**Why it matters.** Make-or-buy, outsourcing, pricing a special order, dropping a product or closing a branch are common consulting cases. Getting the relevant costs right avoids classic errors like dropping a product that still covers its share of unavoidable fixed costs.

**Core mechanics.**
- Include: variable costs, avoidable fixed costs, opportunity costs, incremental revenues.
- Exclude: sunk costs, committed and unavoidable fixed costs, allocated overheads that don't change.
- **Limiting factor:** when a resource is scarce, rank products by contribution per unit of the scarce resource.

**Worked example 1: make or buy.** In-house cost per component: materials ₹40, labour ₹30, variable overhead ₹10, allocated fixed overhead ₹20 = ₹100. A supplier offers ₹90. Volume 10,000 units.
- Relevant cost to make = 40 + 30 + 10 = **₹80** (fixed overhead unavoidable) → **make** (saves ₹10 per unit).
- If buying frees space that can be rented for ₹1,00,000 a year: opportunity cost = ₹10 per unit → making costs effectively ₹90 → **indifferent**; qualitative factors (quality, supply risk, strategic know-how) decide.

**Worked example 2: special order.** Spare capacity exists. A customer offers ₹75 per unit for 2,000 units; variable cost is ₹70 and full cost ₹95.
- Incremental profit = (75 − 70) × 2,000 = **₹10,000** → accept, if it doesn't undercut regular pricing or use capacity needed for full-price sales.

**Worked example 3: limiting factor.** Machine hours are limited. Product X: contribution ₹60, 3 hours → ₹20/hour. Product Y: contribution ₹40, 1 hour → ₹40/hour. Prioritise **Y**, despite lower contribution per unit.

**Indian context.** Indian IT services and BPO industries were built on clients' make-vs-buy decisions; today, captive global capability centres (GCCs) in India reflect a reverse "make" decision by multinationals [VERIFY: GCC count estimates, e.g., NASSCOM].

**Common mistakes.**
- Dropping a product with positive contribution because it shows a loss after allocated overheads.
- Ignoring opportunity costs of capacity.
- Ignoring long-term strategic effects (losing capability, supplier dependence).

**Interview angle.**
1. *A product line shows a loss after allocated overhead. Should we drop it?* Only if its contribution is less than the fixed costs that would actually be avoided, and dropping it doesn't hurt sales of other products.
2. *How do you decide what to produce when capacity is limited?* Maximise contribution per unit of the constraint.

**Related topics:** [1.7] Opportunity cost, [7.1] Cost concepts, [7.4] CVP.

---

### [7.8] Transfer Pricing: Internal and Tax Perspectives
<!-- tags: domain=cost-management-accounting; level=advanced; roles=CF,Consulting,Audit; keywords=transfer pricing, arm's length price, market-based transfer price, cost-plus, negotiated price, OECD guidelines, Indian transfer pricing, safe harbour, APA -->

**Definition.** A transfer price is the price charged for goods, services or intellectual property between divisions or related entities of the same group. Internally it drives divisional performance and decisions; for tax, it must meet the arm's length standard.

**Why it matters.** For multinationals, transfer pricing determines where profits (and taxes) are reported. India is a major transfer pricing jurisdiction given its large IT, pharma and GCC sectors; disputes are among the largest sources of tax litigation.

**Core mechanics.**

*Internal (management accounting):*
- Minimum transfer price for the selling division = Variable cost + Opportunity cost (contribution lost on outside sales).
- Maximum for the buying division = External market price (or net revenue from the final product).
- Methods: market-based, cost-based (variable, full, cost-plus), negotiated, dual pricing.

*Tax (arm's length principle, OECD guidelines and Indian law):* methods include comparable uncontrolled price (CUP), resale price method, cost plus method, profit split method, transactional net margin method (TNMM, most used in India for services), and other methods.

**Worked example.** Division A makes a component with variable cost ₹60 and sells it externally at ₹100. Division B needs it.
- If A has spare capacity: minimum transfer price = **₹60**; any price between 60 and 100 benefits the group.
- If A is at full capacity: minimum = 60 + (100 − 60) = **₹100**; B should only buy internally if worth at least ₹100 to it.

*Tax illustration:* an Indian GCC provides software services to its US parent at cost plus 15%. If comparable independent companies earn an operating margin on costs of 18%, Indian tax authorities may adjust income upward to the arm's length margin.

**Indian context.** Indian transfer pricing provisions (ss.92–92F of the 1961 Act, carried into the Income-tax Act 2025) require documentation, an accountant's report (Form 3CEB) and allow safe harbour rules and advance pricing agreements (APAs) [VERIFY: Income-tax Act 2025 transfer pricing sections and current safe harbour margins]. India has signed numerous unilateral and bilateral APAs, reducing litigation.

**Common mistakes.**
- Setting transfer prices that make divisions suboptimise (e.g., a full-cost price that discourages profitable internal trade).
- Assuming internal and tax transfer prices must be the same (they can differ, though using one simplifies administration).

**Interview angle.**
1. *What's the ideal internal transfer price?* Between the seller's opportunity cost (variable cost plus lost contribution) and the buyer's alternative price, so both divisions act in the group's interest.
2. *What is the arm's length principle?* Related-party transactions should be priced as if between independent parties under comparable conditions.

**Related topics:** [23.6] Taxation, [22.6] International finance.

---

## Module 7 Glossary

| Term | Definition |
|---|---|
| Absorption costing | Product cost includes fixed production overhead |
| Activity-based costing | Overheads assigned using activity cost drivers |
| Break-even point | Volume where total revenue equals total cost |
| Contribution margin | Price minus variable cost |
| Cost driver | Factor that causes an activity's cost to change |
| DOL | Degree of operating leverage: contribution / EBIT |
| Flexible budget | Budget adjusted to actual activity level |
| Limiting factor | Scarce resource constraining output |
| Margin of safety | Share by which sales exceed break-even |
| Marginal costing | Fixed production overhead treated as a period cost |
| Relevant cost | Future incremental cash cost that differs between alternatives |
| Standard cost | Expected cost per unit (standard quantity × standard price) |
| Transfer price | Price for transactions between related units |
| Variance | Difference between actual and standard or budget |
| Zero-based budgeting | Budget built from zero with each cost justified |

## Module 7 Rapid-Fire Quiz

1. Price 200, variable cost 120, fixed 4 lakh: break-even units? **5,000**
2. Contribution ₹50 lakh, EBIT ₹10 lakh: DOL? **5x**
3. Production exceeds sales: which method shows higher profit? **Absorption costing**
4. Material standard price ₹10, actual ₹11, actual qty 1,000: price variance? **₹1,000 A**
5. Are allocated, unavoidable fixed costs relevant to make-or-buy? **No**
6. Special order price ₹80, variable cost ₹85, spare capacity: accept? **No (negative contribution)**
7. Scarce resource ranking basis? **Contribution per unit of the scarce resource**
8. Minimum transfer price at full capacity? **Variable cost + lost contribution (= market price)**
9. Most common Indian TP method for services? **TNMM**
10. Budget that justifies every cost from scratch? **Zero-based budget**

## Module 7 [VERIFY] Items

1. Cost audit thresholds (Companies (Cost Records and Audit) Rules 2014)
2. Cost Accounting Standard CAS-2 (capacity determination)
3. GCC count estimates in India
4. Income-tax Act 2025 transfer pricing sections and safe harbour margins

---

# Module 8: Corporate Finance

## 8A. Objectives and Investment Decisions

### [8.1] The Goal of the Firm, Agency Problems and Corporate Governance
<!-- tags: domain=corporate-finance; level=foundation; roles=CF,IB,PE,Consulting,ER; keywords=shareholder wealth maximisation, profit maximisation, stakeholder theory, agency problem, agency costs, principal-principal conflict, corporate governance, promoter -->

**Definition.** Corporate finance assumes the firm's financial objective is to maximise long-term shareholder value (the present value of future cash flows to owners), subject to legal, ethical and stakeholder constraints. Agency problems arise when those who run the firm (agents) have interests different from those who own it (principals).

**Why it matters.** Every corporate finance decision (investment, financing, payout) is judged against this objective. Agency conflicts explain empire-building acquisitions, excessive cash hoarding, related-party leakage and why governance matters to valuation, especially in promoter-led Indian companies.

**Core mechanics.**
- **Profit maximisation vs value maximisation:** profit ignores timing, risk and capital used; value maximisation incorporates all three through discounted cash flows.
- **Stakeholder view:** firms serve customers, employees, suppliers, communities and the environment. In practice long-term value maximisation and stakeholder interests mostly align, but trade-offs exist.
- **The three core decisions:**
  1. Investment: which projects to fund (capital budgeting)
  2. Financing: how to fund them (capital structure)
  3. Payout: how much cash to return (dividends and buybacks)
- **Agency conflicts:**
  - Shareholders vs managers (Type I): perquisites, empire building, short-termism, risk aversion
  - Majority vs minority shareholders (Type II, principal-principal): tunnelling through related-party transactions, preferential allotments, transfer pricing to group firms
  - Shareholders vs creditors: risk-shifting, asset substitution, excessive dividends near distress
- **Agency costs** = monitoring costs + bonding costs + residual loss.
- **Mitigants:** independent boards and audit committees, equity-linked pay, disclosure rules, activist and institutional investors, takeover market, debt covenants, proxy advisers.

**Worked example.** A cash-rich company with ₹2,000 Cr of surplus cash earning 6% pre-tax considers acquiring an unrelated business for ₹1,500 Cr, expected to earn 8% post-tax ROIC against a WACC of 12%.
- Value destroyed per year ≈ (12% − 8%) × 1,500 = **₹60 Cr** of economic profit forgone each year
- Management may still favour the deal (bigger empire, higher pay); shareholders would prefer a buyback or dividend. This is a Type I agency conflict, and the market often marks down the acquirer's share price on announcement.

**Indian context.** Most Indian listed companies are promoter-controlled, so the dominant conflict is promoter vs minority shareholder. SEBI's governance rules (independent directors, audit committee approval of related-party transactions, majority-of-minority approval for material RPTs, disclosures on pledges) target Type II conflicts [VERIFY: SEBI LODR Regulations 17, 18, 23]. Proxy advisers (IiAS, InGovern, SES) influence shareholder voting.

**Common mistakes.**
- Equating accounting profit growth with value creation.
- Assuming the Anglo-American manager-shareholder conflict is the main issue in India.
- Treating stakeholder value and shareholder value as necessarily opposed.

**Interview angle.**
1. *What is the objective of a firm in finance?* Maximise long-term shareholder value, measured as the present value of expected future free cash flows, while meeting obligations to other stakeholders.
2. *What's the principal-principal problem?* Conflict between controlling shareholders (promoters) and minority shareholders, typically through related-party transactions or unfair capital actions.
3. *How do debt covenants reduce agency costs?* They limit risk-shifting and excess payouts, protect creditors, and discipline managers by committing cash to debt service.

**Related topics:** [1.7] Cost of capital, [8.8] Payout policy, [12.7] Why M&A deals fail.

---

### [8.2] Capital Budgeting: Estimating Project Cash Flows
<!-- tags: domain=corporate-finance; level=intermediate; roles=CF,IB,PE,Consulting; keywords=capital budgeting, project cash flows, incremental cash flow, depreciation tax shield, working capital investment, terminal salvage value, NPV, IRR -->

**Definition.** Capital budgeting evaluates long-term investments by forecasting their incremental after-tax free cash flows and discounting them at a risk-appropriate cost of capital.

**Why it matters.** Capex decisions commit large sums for years and are hard to reverse. Cash flow estimation, not the discounting formula, is where most errors occur. Corporate finance, PE and consulting interviews often include a "build the project cash flows" exercise.

**Core mechanics.**
Project free cash flow each year:
- FCF = EBIT × (1 − t) + Depreciation − Capex − Change in net working capital
- Equivalently: (Revenue − Cash costs) × (1 − t) + t × Depreciation − Capex − ΔNWC, where t × Depreciation is the depreciation tax shield

Components:
- **Initial outlay (t = 0):** capex, installation, initial working capital, opportunity cost of assets used
- **Operating cash flows:** incremental revenue minus incremental costs, after tax
- **Working capital:** invested as the project grows; recovered at the end
- **Terminal cash flow:** after-tax salvage value (salvage − tax on gain over tax book value) plus NWC recovery
- Exclude sunk costs and financing costs (interest belongs in the discount rate)
- Include cannibalisation, synergies and opportunity costs

**Worked example.** A new plant (₹ Cr):
- Capex ₹100 Cr at t = 0, depreciated straight-line to zero over 5 years (₹20 Cr a year, same for tax)
- Revenue ₹80 Cr in year 1, growing 10% a year
- Variable costs 50% of revenue; fixed cash costs ₹10 Cr a year
- NWC = 10% of each year's revenue, invested at the start of that year, fully recovered at the end of year 5
- Salvage value ₹10 Cr at end of year 5 (fully taxable as book value is zero)
- Tax rate 25%; WACC 12%

| Year | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Revenue | | 80.00 | 88.00 | 96.80 | 106.48 | 117.13 |
| EBITDA (50% − 10) | | 30.00 | 34.00 | 38.40 | 43.24 | 48.56 |
| Depreciation | | 20.00 | 20.00 | 20.00 | 20.00 | 20.00 |
| EBIT | | 10.00 | 14.00 | 18.40 | 23.24 | 28.56 |
| NOPAT (× 0.75) | | 7.50 | 10.50 | 13.80 | 17.43 | 21.42 |
| + Depreciation | | 20.00 | 20.00 | 20.00 | 20.00 | 20.00 |
| − Capex | (100.00) | | | | | |
| − ΔNWC | (8.00) | (0.80) | (0.88) | (0.97) | (1.06) | +11.71 |
| + After-tax salvage (10 × 0.75) | | | | | | 7.50 |
| **FCF** | **(108.00)** | **26.70** | **29.62** | **32.83** | **36.37** | **60.64** |

- NPV at 12% = **₹20.34 Cr** → accept
- IRR = **18.4%** (above the 12% hurdle)

Year 5 FCF = 21.42 + 20 + 11.71 (NWC released) + 7.50 (salvage) = 60.64.

**Indian context.** Tax depreciation in India uses block-wise WDV rates (often 15% for general plant and machinery) with an additional depreciation allowance for new plant in manufacturing for companies not under section 115BAA, and only half the rate in the year of acquisition for assets used under 180 days [VERIFY: Income Tax Act depreciation rates, section 32(1)(iia) and the 180-day rule]. Large projects often involve production-linked incentive (PLI) schemes, which add incremental inflows to model [VERIFY: PLI scheme terms by sector].

**Common mistakes.**
- Subtracting interest in cash flows and also discounting at WACC.
- Forgetting NWC investment and its recovery.
- Ignoring tax on salvage gains.
- Using accounting profit instead of cash flow.

**Interview angle.**
1. *Why don't we subtract interest in project cash flows?* Financing costs are captured in the discount rate (WACC). Subtracting interest as well would double-count financing.
2. *What is the depreciation tax shield?* Depreciation is non-cash but tax-deductible, so it reduces tax by t × Depreciation, a real cash benefit.
3. *A project needs ₹10 Cr of working capital recovered at the end. Why does it still reduce NPV?* Cash tied up for years has a time-value cost; the PV of recovery is less than the initial outlay.

**Related topics:** [1.4] NPV, [1.5] IRR, [8.3] Capital budgeting under risk, [10.2] DCF.

---

### [8.3] Capital Budgeting under Uncertainty: Sensitivity, Scenarios, Simulation and Real Options
<!-- tags: domain=corporate-finance; level=advanced; roles=CF,PE,Consulting,IB; keywords=sensitivity analysis, scenario analysis, break-even analysis, Monte Carlo simulation, decision tree, real options, option to expand, option to abandon, option to delay -->

**Definition.** Techniques that show how a project's value changes when assumptions change, and how management flexibility (real options) adds value that a static NPV misses.

**Why it matters.** Forecasts are always wrong; the question is how wrong and with what consequence. Boards and investment committees ask "what has to be true?" and "what's the downside?" Real options explain why firms invest in pilots or phase rollouts, which is common in product and market-entry decisions.

**Core mechanics.**
- **Sensitivity analysis:** change one input at a time and observe NPV. Shows which variables matter most (presented as a tornado chart).
- **Break-even analysis:** find the value of a variable at which NPV = 0.
- **Scenario analysis:** change several inputs together in internally consistent scenarios (bear, base, bull), often probability-weighted.
- **Monte Carlo simulation:** assign probability distributions to inputs and simulate thousands of outcomes to get a distribution of NPV.
- **Decision trees:** map sequential decisions and chance events; roll back from the end using expected values.
- **Real options** (value of managerial flexibility):
  - Option to expand (follow-on investments if successful)
  - Option to abandon (sell assets or exit if unsuccessful)
  - Option to delay (wait for information)
  - Option to switch inputs or outputs
  - Expanded NPV = Static NPV + Value of options

**Worked example 1: sensitivity on the plant in [8.2]** (base NPV ₹20.34 Cr):

| Change | NPV (₹ Cr) |
|---|---|
| Base case | 20.34 |
| Variable cost 55% instead of 50% | 7.42 |
| Year-1 revenue 10% lower (₹72 Cr) | 7.83 |
| No revenue growth (0% instead of 10%) | −0.07 |
| Fixed costs ₹12 Cr instead of ₹10 Cr | 14.93 |

- Break-even year-1 revenue (holding other assumptions) ≈ **₹67 Cr**, about 16% below base
- Most sensitive: variable cost ratio and revenue growth; these deserve the most diligence

**Worked example 2: scenarios.**

| Scenario | Assumptions | NPV (₹ Cr) | Probability |
|---|---|---|---|
| Bear | Year-1 revenue ₹64 Cr, variable cost 55% | −15.02 | 25% |
| Base | As in [8.2] | 20.34 | 50% |
| Bull | Year-1 revenue ₹96 Cr, growth 15% | 59.38 | 25% |

Expected NPV = 0.25 × (−15.02) + 0.50 × 20.34 + 0.25 × 59.38 = **₹21.26 Cr**; a 25% chance of value loss.

**Worked example 3: option to abandon.** Invest ₹50 Cr today. With 50% probability demand is high (PV of future cash flows ₹90 Cr); with 50% it is low (PV ₹30 Cr).
- Static NPV = 0.5 × 90 + 0.5 × 30 − 50 = **₹10 Cr**
- If the assets can be sold for ₹40 Cr after one year when demand is low, management abandons in the low state: NPV = 0.5 × 90 + 0.5 × 40 − 50 = **₹15 Cr** (ignoring discounting between periods for simplicity)
- Value of the abandonment option = **₹5 Cr**

**Indian context.** Phased capacity additions (cement, steel, renewables) and pilot-then-scale product launches are real options in practice. Lenders' project appraisal typically requires sensitivity analysis on DSCR under adverse cases [VERIFY: bank project appraisal norms].

**Common mistakes.**
- Running sensitivities on variables that don't matter, while ignoring correlated risks.
- Building scenarios that are internally inconsistent (high volumes with high prices in a price-elastic market).
- Ignoring real options, which understates the value of staged investments and flexibility.

**Interview angle.**
1. *Sensitivity vs scenario analysis?* Sensitivity changes one variable at a time; scenarios change several together in a consistent story.
2. *Why might a negative-NPV pilot be worth doing?* It buys an option to expand if it succeeds; the option value can exceed the pilot's negative static NPV.
3. *What does Monte Carlo add?* A full distribution of outcomes and probabilities (e.g., probability of NPV below zero), rather than a few point estimates.

**Related topics:** [8.2] Project cash flows, [17.3] Options, [11.5] Scenario and sensitivity modelling.

---

## 8B. Cost of Capital

### [8.4] Cost of Equity: CAPM, Beta Estimation and Levering/Unlevering
<!-- tags: domain=corporate-finance; level=intermediate; roles=IB,ER,PE,CF; keywords=cost of equity, CAPM, beta, levered beta, unlevered beta, Hamada equation, equity risk premium, risk-free rate, country risk premium, size premium -->

**Definition.** The cost of equity is the return shareholders require to invest in a company's shares. It is usually estimated with the Capital Asset Pricing Model (CAPM).

**Why it matters.** It is typically the largest component of WACC and is unobservable, so its estimation drives valuation outcomes. Every DCF interview includes "how do you calculate the cost of equity?" and "how do you get beta for a private company?"

**Core mechanics.**
- **CAPM:** Ke = Rf + β × ERP (+ any additional premia)
  - Rf: yield on a long-term government bond in the same currency as the cash flows
  - ERP: equity risk premium = expected market return − Rf (historical or implied)
  - β: sensitivity of the stock's returns to market returns
- **Beta estimation:** regress stock returns on index returns (commonly 2 years of weekly or 5 years of monthly data). Adjusted (Blume) beta = 0.67 × raw beta + 0.33 × 1.
- **Levered vs unlevered beta (Hamada):**
  - Unlevered (asset) beta: βu = βL / [1 + (1 − t) × D/E]
  - Relevered beta: βL = βu × [1 + (1 − t) × D/E]
- **Private company or project beta (bottom-up):** take comparable listed peers' betas → unlever each → take the average or median → relever at the target's capital structure.
- **Other premia** (practitioner adjustments, debated): country risk premium for USD-based valuations of emerging-market companies, size premium for small companies, company-specific risk premium.
- **Alternatives:** dividend discount (Ke = D1/P0 + g), build-up method, multi-factor models.

**Worked example.** Valuing a private Indian company with target D/E of 0.4 and tax rate 25%. Peers:

| Peer | Levered beta | D/E | Unlevered beta = βL / (1 + 0.75 × D/E) |
|---|---|---|---|
| A | 1.20 | 0.50 | 0.873 |
| B | 1.00 | 0.20 | 0.870 |
| C | 1.40 | 0.80 | 0.875 |
| Average | | | **0.872** |

- Relevered beta = 0.872 × (1 + 0.75 × 0.4) = **1.134**
- With Rf = 7% and ERP = 6% (illustrative): Ke = 7% + 1.134 × 6% = **13.8%**

**Indian context.** The 10-year G-sec yield is the usual INR risk-free rate; Indian ERP estimates used by practitioners and Damodaran's country data vary (roughly 6–8% in recent years, depending on method) [VERIFY: current 10-year G-sec yield; current India ERP estimates]. Betas are typically regressed against the Nifty 50 or BSE Sensex; many Indian mid-caps have thin trading, which biases raw betas downward, so bottom-up betas are preferred.

**Common mistakes.**
- Mixing currencies: a USD risk-free rate with INR cash flows.
- Using a raw regression beta for an illiquid stock.
- Relevering at the current rather than the target capital structure in a long-term DCF.
- Double-counting risk by adding a country premium to an INR-based CAPM that already uses an Indian risk-free rate and Indian ERP.

**Interview angle.**
1. *How do you find beta for a private company?* Take listed comparables' betas, unlever them to remove capital structure effects, average, then relever at the target's capital structure.
2. *Why unlever beta?* Leverage increases equity risk; unlevering isolates business (asset) risk so it can be compared across companies with different debt levels.
3. *What happens to the cost of equity as debt rises?* It rises, because equity holders bear more financial risk (higher levered beta).

**Related topics:** [1.6] CAPM basics, [8.5] WACC, [18.3] CAPM and SML.

---

### [8.5] Cost of Debt and WACC in Practice
<!-- tags: domain=corporate-finance; level=intermediate; roles=IB,ER,PE,CF; keywords=WACC, cost of debt, yield to maturity, synthetic rating, after-tax cost of debt, market value weights, target capital structure, hurdle rate -->

**Definition.** The weighted average cost of capital (WACC) is the blended required return of all providers of capital, weighted by their market values. The cost of debt is the current borrowing rate the company would pay on new long-term debt.

**Why it matters.** WACC is the discount rate for free cash flow to the firm in a DCF and the hurdle rate for projects of average risk. Small changes in WACC can move a valuation by 10–20%.

**Core mechanics.**
- WACC = (E/V) × Ke + (D/V) × Kd × (1 − t) [+ (P/V) × Kp for preference capital]
- **Cost of debt (pre-tax, Kd):**
  - Yield to maturity on the company's traded bonds, or
  - Current interest rate on recent borrowings, or
  - Risk-free rate + credit spread for the company's rating (actual or synthetic rating from interest coverage)
- Use the marginal tax rate for the tax shield (only if the company is profitable enough to use it).
- **Weights:** market values (market capitalisation; market value of debt, often approximated by book value), ideally the target or long-run capital structure.
- Include lease liabilities in debt if lease cash flows are excluded from FCF (consistency with Ind AS 116).
- WACC must match the cash flows: nominal INR cash flows → nominal INR WACC.

**Worked example.** Market capitalisation ₹1,500 Cr; debt ₹300 Cr; Ke 13.8% (from [8.4]); pre-tax Kd 9%; tax 25%.
- E/V = 1,500 / 1,800 = 83.3%; D/V = 16.7%
- After-tax Kd = 9% × 0.75 = 6.75%
- WACC = 0.833 × 13.8% + 0.167 × 6.75% = 11.50% + 1.13% = **12.6%**

Synthetic rating approach: if interest coverage (EBIT / interest) is 4.7x, a rating-coverage table might map it to a single-A equivalent; add that rating's spread (say 1.5%) to a 7% risk-free rate to get Kd ≈ 8.5% [illustrative; use a current spread table].

**Indian context.** Indian corporate bond spreads over G-secs vary by rating and tenor; AAA corporates typically borrow at a modest spread while lower-rated issuers rely on bank loans priced off the bank's MCLR or an external benchmark [VERIFY: current FIMMDA/market corporate bond spreads by rating; bank lending rate benchmarks]. Many Indian companies have negligible net debt, so WACC is close to Ke.

**Common mistakes.**
- Using the coupon rate on old debt rather than the current market rate.
- Using book value of equity for weights.
- Applying a tax shield for a loss-making company that pays no tax.
- Using a single company-wide WACC for divisions with very different risks.

**Interview angle.**
1. *Why use market value weights?* WACC is the opportunity cost of capital at today's values; book values reflect history.
2. *Can WACC fall as you add debt?* Initially yes, because cheaper after-tax debt replaces equity; beyond a point, higher distress risk raises both Kd and Ke, so WACC rises (U-shaped curve).
3. *Which is usually higher, Ke or Kd? Why?* Ke, because equity is a residual claim and bears more risk; debt also gets a tax shield.

**Related topics:** [1.7] WACC basics, [8.4] Cost of equity, [8.6] Capital structure, [10.2] DCF.

---

## 8C. Financing and Payout Decisions

### [8.6] Capital Structure Theory: Modigliani-Miller, Trade-Off and Pecking Order
<!-- tags: domain=corporate-finance; level=advanced; roles=CF,IB,PE,ER; keywords=capital structure, Modigliani Miller, MM propositions, tax shield, trade-off theory, financial distress costs, pecking order theory, signalling, optimal capital structure -->

**Definition.** Capital structure is the mix of debt and equity a firm uses. Theory asks whether that mix affects firm value, and why.

**Why it matters.** Leverage decisions affect valuation, risk and flexibility. These theories underpin answers to questions like "why don't all firms load up on debt?" or "why do Indian startups raise equity rather than debt?"

**Core mechanics.**
**Modigliani-Miller (perfect markets, no taxes):**
- Proposition I: firm value is independent of capital structure. VL = VU.
- Proposition II: cost of equity rises linearly with leverage. Re = R0 + (R0 − Rd) × D/E, so WACC stays constant.

**MM with corporate taxes:**
- VL = VU + t × D (PV of interest tax shields, assuming permanent debt)
- Re = R0 + (R0 − Rd) × (1 − t) × D/E
- Implies 100% debt is optimal, which is clearly unrealistic, so other costs must matter.

**Trade-off theory:** firms balance the tax benefits of debt against the expected costs of financial distress (direct bankruptcy costs, lost customers and suppliers, underinvestment, management distraction). Optimal leverage is where marginal benefit equals marginal cost; stable, asset-rich, profitable firms can carry more debt.

**Pecking order theory (Myers-Majluf):** because of information asymmetry, firms prefer internal funds, then debt, then equity as a last resort. Equity issues signal that managers think shares are overvalued, so prices fall on announcement.

**Other perspectives:** agency theory (debt disciplines managers with free cash flow, per Jensen); market timing (issue equity when valuations are high); signalling (taking on debt signals confidence in future cash flows).

**Worked example.** Unlevered firm value ₹1,000 Cr; it borrows ₹400 Cr permanently to buy back shares; tax rate 25%.
- MM with taxes: VL = 1,000 + 0.25 × 400 = **₹1,100 Cr**
- Equity value after buyback = 1,100 − 400 = ₹700 Cr

Cost of equity with R0 = 12%, Rd = 8%, D/E = 0.5:
- No taxes: Re = 12% + (12% − 8%) × 0.5 = **14.0%**
- With taxes: Re = 12% + 4% × 0.75 × 0.5 = **13.5%**

**Indian context.** Indian startups rely on equity because they lack stable cash flows and collateral for bank debt; venture debt fills a niche. Post-IBC, promoters risk losing control on default, which has encouraged deleveraging among large Indian corporates since about 2018 [VERIFY: RBI/industry data on corporate leverage trends]. Public sector undertakings often have government-influenced capital structures.

**Common mistakes.**
- Concluding from MM that capital structure never matters; MM shows when and why it matters (taxes, distress, information).
- Ignoring distress costs in leverage recommendations.
- Applying the full t × D tax shield to firms that cannot use it.

**Interview angle.**
1. *Why don't firms use 100% debt if interest is tax-deductible?* Financial distress costs, agency costs, loss of flexibility, and limited ability to use tax shields outweigh the tax benefit beyond some point.
2. *Why do share prices often fall when a company announces an equity issue?* Pecking order signalling: investors infer management thinks shares are overvalued or that internal funds and debt capacity are exhausted.
3. *Which firms should carry more debt?* Stable, profitable firms with tangible assets and low growth options (utilities, infrastructure with contracted cash flows).

**Related topics:** [8.5] WACC, [8.7] Leverage, [14.2] LBO mechanics.

---

### [8.7] Operating, Financial and Combined Leverage; EBIT-EPS Analysis
<!-- tags: domain=corporate-finance; level=intermediate; roles=CF,ER,IB,Consulting; keywords=degree of operating leverage, degree of financial leverage, combined leverage, EBIT-EPS indifference point, financing choice, EPS sensitivity -->

**Definition.** Operating leverage measures how sensitive operating profit is to sales, driven by fixed operating costs. Financial leverage measures how sensitive EPS is to operating profit, driven by fixed financing costs (interest). Combined leverage is their product.

**Why it matters.** Together they explain why some companies' earnings swing sharply with the cycle. EBIT-EPS analysis is a classic tool for choosing between debt and equity financing.

**Core mechanics.**
- DOL = % change in EBIT / % change in sales = Contribution / EBIT
- DFL = % change in EPS / % change in EBIT = EBIT / (EBIT − Interest − Preference dividend / (1 − t))
- DCL = DOL × DFL = Contribution / (EBIT − Interest) (ignoring preference dividends)
- **EBIT-EPS indifference point:** the EBIT at which two financing plans give the same EPS:
  - (EBIT − I1) × (1 − t) / N1 = (EBIT − I2) × (1 − t) / N2
  - Above the indifference EBIT, debt financing gives higher EPS; below it, equity does.

**Worked example.** A firm has 10 Cr shares and no debt. It needs ₹500 Cr for expansion. Plan A: issue 5 Cr shares at ₹100. Plan B: borrow ₹500 Cr at 10% (interest ₹50 Cr). Tax 25%.

Indifference point:
- EBIT × 0.75 / 15 = (EBIT − 50) × 0.75 / 10
- 10 × EBIT = 15 × EBIT − 750 → **EBIT = ₹150 Cr**

At expected EBIT of ₹300 Cr:

| | Plan A (equity) | Plan B (debt) |
|---|---|---|
| EBIT | 300 | 300 |
| Interest | 0 | 50 |
| PBT | 300 | 250 |
| PAT (75%) | 225 | 187.5 |
| Shares (Cr) | 15 | 10 |
| **EPS** | **₹15.00** | **₹18.75** |
| DFL | 1.00 | 300/250 = 1.20 |

Plan B gives higher EPS but more risk: if EBIT fell 20% to ₹240 Cr, Plan B's EPS would fall 24% (DFL 1.2) to ₹14.25, while Plan A's would fall 20% to ₹12.00.

If DOL is 2.0, DCL for Plan B = 2.0 × 1.2 = **2.4**: a 10% fall in sales cuts EPS by 24%.

**Indian context.** Indian lenders and rating agencies consider operating leverage when assessing cyclical sectors (metals, cement, auto ancillaries); high DOL plus high DFL is a common precursor to stress in downturns.

**Common mistakes.**
- Choosing financing purely on EPS without considering risk, flexibility and the effect on cost of equity (P/E typically falls as leverage rises).
- Forgetting that DOL and DFL change with the level of EBIT (they are point estimates).

**Interview angle.**
1. *Debt increases EPS. Does it increase share price?* Not necessarily. Higher leverage raises risk and the cost of equity, which can lower the P/E. Value depends on the tax shield vs distress costs.
2. *Explain operating leverage with an example.* A software firm with mostly fixed costs: a 10% revenue increase might raise EBIT 30% (DOL 3), and the reverse in a downturn.
3. *What's the EBIT-EPS indifference point used for?* Choosing between financing plans: if expected EBIT is comfortably above the indifference point, debt boosts EPS.

**Related topics:** [7.4] CVP and DOL, [8.6] Capital structure, [12.3] Accretion/dilution.

---

### [8.8] Payout Policy: Dividends and Buybacks
<!-- tags: domain=corporate-finance; level=intermediate; roles=CF,ER,IB,PE; keywords=dividend policy, dividend irrelevance, bird in the hand, signalling, clientele effect, Lintner model, share buyback, sustainable growth rate, retention ratio -->

**Definition.** Payout policy decides how much cash a company returns to shareholders and in what form: dividends or share buybacks.

**Why it matters.** Payout reflects confidence in future cash flows and capital allocation discipline. Buybacks change EPS mechanics and are a common interview question, and Indian tax rules on both have changed recently.

**Core mechanics.**
- **MM dividend irrelevance:** in perfect markets, payout policy doesn't affect value; investors can create "homemade dividends" by selling shares.
- **Why it matters in practice:**
  - Bird-in-the-hand: investors may value certain dividends over uncertain capital gains (contested)
  - Taxes: payout form matters if dividends and capital gains are taxed differently
  - Signalling: dividend increases signal confidence; cuts are punished
  - Clientele effect: different investors prefer different payout policies
  - Agency: payouts reduce free cash flow available for value-destroying projects
- **Lintner model:** firms target a long-run payout ratio and smooth dividends toward it gradually.
- **Sustainable growth rate:** g = ROE × b, where b = retention ratio = 1 − payout ratio.
- **Buybacks:** return cash flexibly, signal undervaluation, offset ESOP dilution, raise EPS if the earnings yield on shares exceeds the after-tax yield on cash used.
  - Buyback is EPS-accretive if PAT/Market cap (earnings yield) > after-tax return on the cash spent (or after-tax cost of debt used to fund it).

**Worked example 1: sustainable growth.** EPS ₹20, payout ratio 40%, ROE 18%.
- Retention b = 60%; g = 18% × 60% = **10.8%**
- Dividend per share = ₹8

**Worked example 2: buyback EPS.** PAT ₹100 Cr; 10 Cr shares at ₹200 (market cap ₹2,000 Cr, EPS ₹10, earnings yield 5%). The company spends ₹200 Cr of cash, which was earning 6% pre-tax, to buy back 1 Cr shares at ₹200.
- Lost after-tax interest = 200 × 6% × 0.75 = ₹9 Cr → new PAT = ₹91 Cr
- New EPS = 91 / 9 = **₹10.11**: accretive by 1.1%, because the earnings yield (5%) exceeds the after-tax yield on cash (4.5%)
- Value per share is unchanged in a frictionless world; EPS accretion alone does not prove value creation

**Indian context.** Since 1 April 2020, dividends are taxed in shareholders' hands at their slab rates (dividend distribution tax abolished). From 1 October 2024, buyback proceeds are taxed in shareholders' hands as deemed dividend, with the cost of shares treated as a capital loss, replacing the earlier 20% buyback tax paid by companies [VERIFY: Finance (No. 2) Act 2024 buyback taxation]. SEBI phased out open-market buybacks through the stock exchange route, leaving the tender offer route as the main method [VERIFY: SEBI Buy-back Regulations 2018 amendments and phase-out date]. PSUs follow government guidelines on minimum dividend payout [VERIFY: DIPAM capital restructuring guidelines for CPSEs].

**Common mistakes.**
- Claiming buybacks always create value because EPS rises.
- Ignoring the signalling cost of cutting dividends.
- Confusing payout ratio with dividend yield.

**Interview angle.**
1. *Dividend or buyback: which is better?* Buybacks offer flexibility and can signal undervaluation; dividends signal stable commitment. The answer depends on taxes, valuation and investor base; in India the 2024 tax change made the two more similar for shareholders.
2. *When is a buyback EPS-accretive?* When the earnings yield on repurchased shares exceeds the after-tax cost of funds used.
3. *A company with 30% ROE pays out 90% of earnings. Is that good?* It depends on reinvestment opportunities. If it can reinvest at 30% ROE, retaining more would create value; high payout suggests limited opportunities or capital discipline.

**Related topics:** [8.1] Agency costs, [10.4] Dividend discount model, [23.3] Taxation of dividends.

---

### [8.9] Working Capital Management and Short-Term Finance
<!-- tags: domain=corporate-finance; level=intermediate; roles=CF,Consulting,Fintech-PM; keywords=working capital management, EOQ, credit policy, cost of trade credit, cash credit, overdraft, bill discounting, matching principle, conservative vs aggressive financing -->

**Definition.** Working capital management covers the policies for cash, receivables, inventory and payables, and how short-term needs are financed.

**Why it matters.** It determines liquidity day to day and frees cash for growth. Treasury, CFO office and consulting roles optimise it, and fintech lenders build products around its gaps.

**Core mechanics.**
- **Inventory:** Economic order quantity EOQ = √(2 × D × S / H), where D = annual demand, S = ordering cost per order, H = holding cost per unit per year. Safety stock covers demand and lead-time uncertainty. Reorder point = lead-time demand + safety stock.
- **Receivables (credit policy):** evaluate loosening or tightening credit by comparing incremental contribution with incremental bad debts, collection costs and financing cost of extra receivables.
- **Payables:** cost of forgoing an early-payment discount (terms "d/D net N"):
  - Approximate annual cost = d / (100 − d) × 365 / (N − D)
  - Effective annual cost = (1 + d / (100 − d))^(365 / (N − D)) − 1
- **Cash management:** forecasting, sweeps, pooling, minimum balance models (Baumol, Miller-Orr).
- **Financing approaches:**
  - Matching (hedging): permanent assets funded long-term, temporary needs short-term
  - Conservative: more long-term funding (safer, costlier)
  - Aggressive: more short-term funding (cheaper, riskier rollover)

**Bank working capital products in India:** cash credit (secured by stock and receivables, drawing power linked to stock statements), overdraft, working capital demand loans, bill discounting and purchase, letters of credit, bank guarantees, TReDS discounting, supply chain finance.

**Worked example 1: EOQ.** Annual demand 12,000 units; ordering cost ₹500 per order; holding cost ₹30 per unit per year.
- EOQ = √(2 × 12,000 × 500 / 30) = √4,00,000 = **632 units** (about 19 orders a year)

**Worked example 2: trade credit.** Supplier terms 2/10 net 30 (2% discount if paid in 10 days, otherwise full payment in 30 days).
- Approximate annual cost of skipping the discount = 2/98 × 365/20 = **37.2%**
- Effective = (1 + 2/98)^(18.25) − 1 = **44.6%**
- If the company can borrow at 12%, it should borrow and take the discount.

**Indian context.** RBI's guidelines on loan systems for delivery of bank credit require a portion of working capital limits above a threshold to be in the form of a loan component rather than cash credit [VERIFY: RBI guidelines on loan system for delivery of bank credit]. Banks assess working capital needs using the Nayak Committee turnover method (for smaller borrowers, about 25% of projected turnover, with 5% as margin) or the MPBF method (Tandon Committee) for larger ones [VERIFY: current bank practice and RBI deregulation of assessment methods].

**Common mistakes.**
- Skipping early-payment discounts while paying 12% on overdrafts.
- Funding long-term capex with short-term borrowing (asset-liability mismatch; a factor in IL&FS-type crises).
- Tightening credit so much that sales fall more than costs saved.

**Interview angle.**
1. *Should we pay suppliers early for a 1% discount on net-30 terms paid in 10 days?* The implied annual return is about 18–20%, so yes if your cost of funds is lower.
2. *What's the risk of an aggressive working capital financing policy?* Refinancing and interest rate risk: short-term lines may not roll over in a credit squeeze.
3. *How would you reduce a manufacturer's working capital by 20%?* Segment inventory (ABC/XYZ), reduce safety stock with better forecasting, tighten credit terms and collections, negotiate longer supplier terms, use supply-chain finance.

**Related topics:** [3.6] Cash conversion cycle, [19.5] Credit appraisal, [21.6] Lending tech.

---

### [8.10] Sources of Finance: Equity, Debt and Hybrid Instruments in India
<!-- tags: domain=corporate-finance; level=foundation; roles=CF,IB,PE,Fintech-PM,Consulting; keywords=sources of finance, equity capital, term loans, NCDs, commercial paper, ECB, CCPS, CCD, convertible notes, venture debt, mezzanine, InvIT, REIT, securitisation -->

**Definition.** Sources of finance are the instruments and channels through which companies raise capital: equity, debt, and hybrids that combine features of both.

**Why it matters.** Choosing the right instrument balances cost, control, flexibility and risk. Candidates for IB, PE, CFO-office and fintech roles should know the Indian instrument landscape and when each is used.

**Core mechanics.**

| Category | Instrument | Typical users | Key features |
|---|---|---|---|
| Equity | IPO, FPO, QIP, rights issue, preferential allotment | Listed and listing firms | Permanent capital; dilution; no fixed payments |
| Equity | Private equity and venture capital | Private firms, startups | Usually CCPS with investor rights |
| Debt | Bank term loans | Corporates, projects | Secured, amortising, covenants |
| Debt | Working capital facilities | Corporates, MSMEs | Cash credit, overdraft, WCDL |
| Debt | Non-convertible debentures (NCDs) / corporate bonds | Rated corporates, NBFCs | Listed or private placement; fixed or floating |
| Debt | Commercial paper (CP) | Highly rated corporates and NBFCs | Short-term (7 days to 1 year), unsecured |
| Debt | External commercial borrowings (ECB) | Eligible corporates | Foreign currency or INR (masala bonds); RBI framework |
| Debt | Venture debt | Venture-backed startups | Short tenor, high coupon, warrants |
| Hybrid | Compulsorily convertible preference shares (CCPS) | Startups (VC/PE rounds) | Liquidation preference, anti-dilution, convert to equity |
| Hybrid | Compulsorily convertible debentures (CCD) | Private deals | Debt-like coupon, mandatory conversion |
| Hybrid | Optionally convertible debentures / FCCBs | Listed and private firms | Conversion option at holder's choice |
| Hybrid | Mezzanine / structured debt | Mid-market, promoters | Subordinated, high yield, equity kicker |
| Asset-backed | Securitisation (PTCs), direct assignment | NBFCs, banks | Sell loan pools for liquidity |
| Asset-backed | InvITs and REITs | Infrastructure and real estate sponsors | Yield-bearing listed trusts holding assets |
| Other | Factoring, TReDS, sale-and-leaseback, revenue-based financing | MSMEs, D2C brands | Asset or revenue linked |

General ordering by cost and risk to the issuer: secured senior debt (cheapest) → unsecured debt → subordinated and mezzanine → preference capital → common equity (most expensive, most flexible).

**Worked example.** A D2C brand needs ₹20 Cr for 12 months to fund inventory for a festive season. Options:
- Equity at a ₹200 Cr pre-money valuation: dilution = 20 / 220 = **9.1%** of the company, permanent
- Venture debt at 14% with warrants worth about 0.5% of equity: cost ≈ ₹2.8 Cr interest plus the warrant dilution, repaid from season cash flows
- Inventory-linked or revenue-based financing: fees tied to sales, no dilution
For a temporary, self-liquidating need, debt-like options are usually better; equity suits long-term, uncertain uses.

**Indian context.** Foreign investment in Indian companies must use instruments compliant with FEMA (equity shares, CCPS, CCDs, share warrants); optionally convertible instruments are treated as debt (ECB) for foreign investors [VERIFY: FEMA (Non-Debt Instruments) Rules 2019]. ECBs are governed by RBI's ECB framework (eligible borrowers, all-in-cost ceilings, end-use restrictions, automatic route limits) [VERIFY: RBI ECB Master Direction and any 2025-26 revisions]. CP issuance requires minimum credit ratings under RBI directions [VERIFY: RBI Commercial Paper and NCD directions].

**Common mistakes.**
- Using permanent equity for temporary needs.
- Ignoring covenants and security when comparing headline interest rates.
- Treating CCPS as plain preference shares (they carry significant investor protections).

**Interview angle.**
1. *Why do Indian startups issue CCPS rather than common equity to investors?* CCPS give investors liquidation preference, anti-dilution and other protective rights, and comply with FEMA for foreign investors, while converting to equity at IPO.
2. *When would a company issue a QIP instead of a rights issue?* For speed and access to institutional investors without a lengthy offer document; a rights issue suits when existing shareholders should keep proportional ownership.
3. *What's the difference between CP and NCDs?* CP is short-term (up to a year), unsecured money-market paper; NCDs are typically longer-term bonds, often secured and listed.

**Related topics:** [13.3] IPO process, [13.5] QIP and rights issues, [14.4] VC term sheets, [16.7] Indian debt market.

---

## Module 8 Glossary

| Term | Definition |
|---|---|
| Agency cost | Value lost when agents' interests diverge from principals' |
| Beta (unlevered) | Business-risk beta with financing effects removed |
| CCPS | Compulsorily convertible preference shares |
| DFL | Degree of financial leverage = EBIT / (EBIT − Interest) |
| Depreciation tax shield | t × Depreciation: cash tax saved from depreciation |
| EBIT-EPS indifference point | EBIT at which two financing plans give equal EPS |
| EOQ | Economic order quantity = √(2DS/H) |
| ERP | Equity risk premium |
| Hamada equation | βL = βu × [1 + (1 − t) D/E] |
| MM Proposition I | Firm value independent of capital structure (no taxes) |
| Pecking order theory | Preference for internal funds, then debt, then equity |
| Real option | Value of managerial flexibility (expand, abandon, delay) |
| Sustainable growth rate | ROE × Retention ratio |
| Trade-off theory | Optimal debt balances tax shields against distress costs |
| WACC | Weighted average cost of capital |

## Module 8 Rapid-Fire Quiz

1. Levered beta 1.5, D/E 1.0, tax 25%. Unlevered beta? **0.857**
2. Rf 7%, beta 1.2, ERP 6%. Cost of equity? **14.2%**
3. MM with taxes: VU ₹500 Cr, debt ₹200 Cr, tax 30%. VL? **₹560 Cr**
4. ROE 20%, payout 30%. Sustainable growth? **14%**
5. Terms 1/10 net 30. Approximate annual cost of skipping the discount? **About 18.4%**
6. EBIT ₹100 Cr, interest ₹20 Cr. DFL? **1.25**
7. Should interest be deducted in project FCF discounted at WACC? **No**
8. Which theory predicts share prices fall on equity issue announcements? **Pecking order (signalling)**
9. E ₹800 Cr, D ₹200 Cr, Ke 15%, Kd 10%, tax 25%. WACC? **13.5%**
10. Expanded NPV equals? **Static NPV + value of real options**

## Module 8 [VERIFY] Items

1. SEBI LODR Regulations 17, 18 and 23 (board, audit committee, RPTs)
2. Income Tax Act depreciation rates, section 32(1)(iia) and the 180-day rule; PLI scheme terms
3. Bank project appraisal norms (sensitivity on DSCR)
4. Current 10-year G-sec yield; current India ERP estimates
5. Current corporate bond spreads by rating; bank lending rate benchmarks
6. Corporate leverage trends post-IBC
7. Finance (No. 2) Act 2024 buyback taxation; SEBI buyback route changes; DIPAM CPSE dividend guidelines
8. RBI loan system for delivery of bank credit; working capital assessment practices
9. FEMA (Non-Debt Instruments) Rules 2019; RBI ECB Master Direction (and revisions); RBI CP and NCD directions

---

# Module 9: Business and Strategic Finance

### [9.1] Financial Planning and Analysis (FP&A): Budgeting, Forecasting and Performance Management
<!-- tags: domain=business-finance; level=intermediate; roles=CF,Fintech-PM,Consulting; keywords=FP&A, driver-based forecasting, rolling forecast, annual operating plan, variance bridge, KPI tree, business partnering, scenario planning -->

**Definition.** FP&A is the finance function that plans, forecasts and analyses business performance to support decisions. It builds the annual operating plan (AOP), rolling forecasts, and monthly performance reviews, and partners with business leaders on trade-offs.

**Why it matters.** FP&A is where finance meets strategy and operations. Product managers work with FP&A on business cases and targets; consultants rebuild FP&A models in performance improvement work; many MBA finance roles start here.

**Core mechanics.**
- **Annual operating plan:** top-down targets (from strategy and investor expectations) reconciled with bottom-up plans (from business units).
- **Driver-based forecasting:** model the business from operational drivers rather than extrapolating financial lines.
  - Example tree: Revenue = Active users × Transactions per user × Average transaction value × Take rate
  - Costs linked to drivers: delivery cost per order, support cost per ticket, CAC per new user
- **Rolling forecasts:** re-forecast monthly or quarterly for the next 12–18 months; replace static annual budgets in fast-changing businesses.
- **Variance analysis and bridges:** explain the gap between actual and plan by driver (price, volume, mix, cost efficiency, one-offs); present as a waterfall chart.
- **KPI trees:** connect top-level financial goals (EBITDA, FCF) to operating metrics owned by specific teams.
- **Scenario planning:** base, upside, downside with explicit triggers and pre-agreed actions.
- **Business partnering:** challenge assumptions, quantify trade-offs, allocate resources (headcount, marketing, capex).

**Worked example.** A payments app's monthly revenue model:

| Driver | Plan | Actual |
|---|---|---|
| Monthly transacting users (lakh) | 100 | 95 |
| Transactions per user | 20 | 22 |
| Average transaction value (₹) | 500 | 480 |
| Monetisable share of TPV | 10% | 10% |
| Take rate on monetisable TPV | 1.0% | 1.0% |

- Plan revenue = 100 lakh × 20 × 500 × 10% × 1% = **₹10.00 Cr**
- Actual revenue = 95 lakh × 22 × 480 × 10% × 1% = **₹10.03 Cr**

Driver bridge (sequential substitution, users → frequency → ticket size):
- Users: (95 − 100) / 100 × 10.00 = **−₹0.50 Cr**
- Frequency at actual users: 9.50 × (22/20 − 1) = **+₹0.95 Cr**
- Ticket size at actual users and frequency: 10.45 × (480/500 − 1) = **−₹0.42 Cr**
- Total = +₹0.03 Cr. Headline revenue hit plan, but user acquisition missed; engagement covered the gap. Each driver has a different owner.

**Indian context.** Listed Indian companies don't usually publish formal guidance (IT services and some consumer companies are exceptions), but management commentary on earnings calls sets expectations that FP&A teams must track. Many Indian startups run monthly board packs on driver-based models, with contribution margin stacks (C1/C2/C3).

**Common mistakes.**
- Forecasting by adding a growth percentage to last year's lines.
- Variance reports that describe what changed without explaining why or who owns it.
- Budgets negotiated as political targets (sandbagging), which reduce forecast accuracy.

**Interview angle.**
1. *What does a good FP&A team do?* It turns strategy into a driver-based plan, forecasts accurately, explains variances by owner and driver, and helps leaders allocate resources by quantifying trade-offs.
2. *How would you forecast revenue for a subscription app?* Start with new subscribers (traffic × conversion), apply cohort retention curves, multiply by ARPU, and layer pricing changes and seasonality.
3. *Revenue hit plan but EBITDA missed. How do you investigate?* Build a bridge: gross margin (mix, pricing, input costs), opex by category (marketing efficiency, headcount timing), and one-offs.

**Related topics:** [7.5] Budgeting and variance, [9.2] Unit economics, [11.2] Revenue and cost drivers.

---

### [9.2] Unit Economics: Contribution Margin, CAC, LTV and Payback
<!-- tags: domain=business-finance; level=intermediate; roles=Fintech-PM,Consulting,PE,CF; keywords=unit economics, contribution margin, C1 C2 C3, customer acquisition cost, lifetime value, LTV to CAC, CAC payback, churn, cohort analysis -->

**Definition.** Unit economics measures revenue and costs for a single unit of the business (an order, a customer, a transaction, a loan) to test whether the model makes money as it scales.

**Why it matters.** For startups and fintechs, unit economics determines whether growth creates or destroys value. PM, strategy and VC interviewers routinely ask candidates to compute contribution per order or LTV/CAC.

**Core mechanics.**
- **Contribution margin stack (common in Indian startups):**
  - C1 = Revenue per unit − Direct variable costs (COGS, delivery, payment gateway)
  - C2 = C1 − Other variable costs (discounts, refunds, customer support)
  - C3 = C2 − Marketing and CAC-related spend (allocated per unit)
  - EBITDA = C3 − Fixed costs (tech, corporate)
  - Definitions vary by company; check each disclosure.
- **Customer acquisition cost (CAC)** = Total sales and marketing spend to acquire customers / New customers acquired. Blended CAC includes organic users; paid CAC uses only paid-channel customers.
- **Lifetime value (LTV):**
  - Simple: LTV = ARPU × Gross margin % / Churn rate (per period)
  - Discounted: LTV = ARPU × GM% × (1 + r) / (1 + r − retention rate) for a per-period retention model
  - Lending: LTV = Net interest income + fees − credit losses − servicing cost over the customer's life
- **LTV/CAC:** a common rule of thumb is 3x or more for a healthy model.
- **CAC payback** = CAC / (Monthly ARPU × Gross margin %), in months; under 12 months is often considered strong for SMB SaaS and consumer subscriptions.
- **Cohort analysis:** track retention, revenue and contribution by acquisition month to see if newer cohorts behave better or worse.

**Worked example 1: food delivery contribution per order (illustrative).** Average order value (AOV) ₹450.

| Item | ₹ per order |
|---|---|
| Restaurant commission (22% of AOV) | 99 |
| Customer delivery fee | 25 |
| Platform fee | 10 |
| Advertising revenue | 8 |
| **Revenue per order** | **142** |
| Delivery partner cost | (75) |
| Payment gateway (2% of AOV) | (9) |
| Discounts funded by platform | (12) |
| Refunds and support | (6) |
| **Contribution per order** | **40** |
| Contribution as % of AOV | 8.9% |

With fixed costs of ₹60 Cr a month, the platform needs 60 Cr / 40 = **1.5 Cr orders a month** to break even at the EBITDA level.

**Worked example 2: subscription LTV/CAC.** ARPU ₹500 a month; gross margin 70%; monthly churn 4%; CAC ₹3,000.
- Monthly gross profit per user = ₹350
- LTV (simple) = 350 / 0.04 = **₹8,750**
- LTV/CAC = 8,750 / 3,000 = **2.9x**
- CAC payback = 3,000 / 350 = **8.6 months**
- Reducing churn to 3% raises LTV to ₹11,667 (LTV/CAC 3.9x), which is often a better lever than cutting CAC.

**Indian context.** Indian quick-commerce, food delivery and fintech companies disclose contribution margins (as % of GOV or revenue) and adjusted EBITDA in shareholder letters [VERIFY: latest company shareholder letters for definitions]. For UPI-based payment apps, interchange on UPI is near zero, so unit economics depend on cross-sold products such as loans, insurance and merchant devices.

**Common mistakes.**
- Using blended CAC (including organic users) to justify paid marketing.
- Computing LTV on revenue rather than gross margin.
- Assuming churn stays constant; early-month churn is usually much higher.
- Ignoring the cost of capital in LTV for long-lived customers.

**Interview angle.**
1. *How would you assess if a quick-commerce company can be profitable?* Contribution per order (AOV × take rate + fees + ads − delivery − dark store costs − discounts), orders per store per day to absorb fixed store costs, and AOV trends.
2. *LTV/CAC is 5x but the company is burning cash. How?* Payback may be long (cash spent today, recovered over years), fixed costs may be high, or LTV assumptions (churn, margin) may be optimistic.
3. *What's the best lever to improve LTV?* Usually retention (lower churn) because it compounds; then ARPU through pricing or cross-sell; then margin.

**Related topics:** [7.4] CVP analysis, [9.6] Startup metrics, [21.1] Fintech business models.

---

### [9.3] Value Drivers: ROIC, Growth, Economic Value Added and the Value Driver Formula
<!-- tags: domain=business-finance; level=advanced; roles=Consulting,PE,ER,CF,IB; keywords=value drivers, ROIC, growth, RONIC, EVA, economic profit, value driver formula, McKinsey valuation, reinvestment rate -->

**Definition.** A company's value is driven by its return on invested capital (ROIC), its growth, and its cost of capital. Economic value added (EVA, or economic profit) measures profit after charging for all capital used.

**Why it matters.** This framework connects strategy to valuation: growth creates value only when returns on new investment exceed the cost of capital. It is central to McKinsey's valuation approach and to PE value creation plans, and it is a strong answer to "how does a company create value?"

**Core mechanics.**
- **Value driver formula** (steady state): Value = NOPAT₁ × (1 − g / RONIC) / (WACC − g)
  - NOPAT₁: next year's net operating profit after tax
  - g: growth in NOPAT and cash flows
  - RONIC: return on new invested capital
  - Reinvestment rate = g / RONIC; FCF = NOPAT × (1 − Reinvestment rate)
- Implications:
  - If RONIC > WACC, faster growth raises value
  - If RONIC = WACC, growth has no effect on value (Value = NOPAT / WACC)
  - If RONIC < WACC, growth destroys value
- **EVA / economic profit** = NOPAT − WACC × Invested capital = (ROIC − WACC) × Invested capital
- **Market value added (MVA)** = Market value of the firm − Invested capital ≈ PV of future economic profits
- Operational levers by driver: ROIC (pricing, cost, capital efficiency) and growth (market share, new markets, new products, M&A).

**Worked example.** NOPAT next year ₹100 Cr; WACC 10%; growth 5%.

| RONIC | Reinvestment rate (g / RONIC) | FCF | Value = FCF / (WACC − g) |
|---|---|---|---|
| 20% | 25% | 75 | **₹1,500 Cr** |
| 10% | 50% | 50 | **₹1,000 Cr** |
| 8% | 62.5% | 37.5 | **₹750 Cr** |

With zero growth, value = 100 / 10% = ₹1,000 Cr. Growth at 20% RONIC adds ₹500 Cr; growth at 8% RONIC destroys ₹250 Cr.

EVA: invested capital ₹700 Cr, NOPAT ₹105 Cr, WACC 11% → EVA = 105 − 0.11 × 700 = **₹28 Cr**.

**Indian context.** Indian consumer franchises (FMCG, paints, some private banks) have historically earned ROIC far above WACC and so command high multiples; capital-intensive PSUs often earn below WACC and trade below book value [VERIFY: current sector ROCE and valuation data]. EVA-style metrics have been used in some Indian companies' management incentive schemes.

**Common mistakes.**
- Valuing growth without checking the reinvestment it needs.
- Using historical ROIC as RONIC when competitive advantage is fading.
- Using the value driver formula when growth isn't yet in steady state (use a multi-stage DCF).

**Interview angle.**
1. *How does a company create value?* By earning ROIC above its cost of capital and growing at those returns. Growth below WACC returns destroys value.
2. *Two companies grow at 10%. One trades at 40x earnings, the other at 15x. Why?* Most likely different ROIC: the high-ROIC firm needs little reinvestment to grow, so more of its earnings become free cash flow.
3. *What is EVA?* Profit minus a capital charge for all capital used. Positive EVA means the business earns more than investors require.

**Related topics:** [4.3] ROIC, [10.3] Terminal value, [10.11] Justified multiples.

---

### [9.4] Pricing and Profitability Analysis: Price-Volume-Mix and Elasticity
<!-- tags: domain=business-finance; level=intermediate; roles=Consulting,Fintech-PM,CF,ER; keywords=price volume mix, PVM bridge, price elasticity, break-even volume for price change, value-based pricing, cost-plus pricing, pricing power -->

**Definition.** Price-volume-mix (PVM) analysis splits a change in revenue or profit into the effects of price changes, total volume changes and changes in product or customer mix. Price elasticity measures how demand responds to price.

**Why it matters.** Pricing is the most powerful profit lever: a 1% price increase typically lifts operating profit far more than a 1% cost cut or volume gain. PVM is a staple of consulting profitability cases and FP&A reviews.

**Core mechanics.**
- **PVM decomposition** (one common method):
  - Price effect = Σ (P₂ − P₁) × Q₂
  - Volume effect = (Total Q₂ − Total Q₁) × Average P₁
  - Mix effect = Σ (Q₂ × P₁) − Total Q₂ × Average P₁
  - Price + Volume + Mix = Revenue₂ − Revenue₁
- **Price elasticity of demand** = % change in quantity / % change in price. Elastic if |e| > 1.
- **Break-even volume change for a price change:** % volume change = −ΔP / (CM% + ΔP), where ΔP is the price change as a % and CM% is the contribution margin %.
- **Pricing approaches:** cost-plus, competitor-based, value-based (willingness to pay), dynamic pricing, freemium and tiered pricing, bundling.

**Worked example 1: PVM.**

| Product | Year 1 | Year 2 |
|---|---|---|
| A | 100 units at ₹10 | 90 units at ₹11 |
| B | 50 units at ₹20 | 70 units at ₹20 |
| Revenue | 2,000 | 2,390 |

- Average Year 1 price = 2,000 / 150 = ₹13.33
- Price effect = (11 − 10) × 90 + (20 − 20) × 70 = **+90**
- Volume effect = (160 − 150) × 13.33 = **+133.3**
- Mix effect = (90 × 10 + 70 × 20) − 160 × 13.33 = 2,300 − 2,133.3 = **+166.7**
- Total = 90 + 133.3 + 166.7 = **+390** ✓
- Story: most growth came from mix (shifting to higher-priced B) and volume, not price.

**Worked example 2: break-even volume.** Contribution margin 40%; considering a 5% price increase.
- Volume can fall by up to 0.05 / (0.40 + 0.05) = **11.1%** before contribution falls
- For a 5% price cut, volume must rise by 0.05 / (0.40 − 0.05) = **14.3%** just to break even

**Indian context.** Indian FMCG companies typically report volume growth separately from value growth, and analysts focus on whether growth is price-led or volume-led. Fintech pricing faces regulatory limits (zero MDR on UPI and RuPay debit; RBI's fair practices code and APR disclosure for lending) [VERIFY: current MDR rules; RBI Fair Practices Code and Key Fact Statement norms].

**Common mistakes.**
- Calling all revenue change "growth" without separating price and mix.
- Discounting to drive volume without checking the break-even volume increase.
- Ignoring that elasticity differs by segment.

**Interview angle.**
1. *A client wants to cut prices 10% to gain share. What do you check?* Contribution margin and the volume increase needed to break even, competitor response, elasticity by segment, brand effects.
2. *Revenue grew 12% but volume fell 3%. What happened?* Price increases and/or mix shift toward premium products drove growth. Check whether volume loss signals future share loss.
3. *Why is pricing such a powerful lever?* A price increase falls straight to operating profit if volume holds; on a 10% operating margin, a 1% price rise lifts operating profit by about 10%.

**Related topics:** [7.6] Variance analysis, [9.1] FP&A, [4.3] Profitability.

---

### [9.5] Finance for Strategic Decisions: Business Cases, Build-Buy-Partner and Capital Allocation
<!-- tags: domain=business-finance; level=advanced; roles=Consulting,CF,Fintech-PM,PE,IB; keywords=business case, market entry, build vs buy vs partner, capital allocation, portfolio strategy, hurdle rate, strategic NPV, TAM SAM SOM -->

**Definition.** Strategic finance applies valuation and investment tools to strategic choices: entering markets, launching products, choosing between building, buying or partnering, and allocating capital across businesses.

**Why it matters.** Consulting cases and PM strategy rounds often end with "should the company do this?" The strongest answers combine market sizing, unit economics and an NPV-style business case with strategic fit and risks.

**Core mechanics.**
**Business case structure:**
1. Objective and options (including "do nothing")
2. Market sizing: TAM (total addressable), SAM (serviceable), SOM (obtainable share)
3. Revenue build: customers × adoption curve × ARPU
4. Cost build: capex, opex, unit costs, customer acquisition
5. Cash flows, NPV, IRR, payback, peak funding need
6. Sensitivities, risks and mitigations
7. Strategic fit, capabilities, competitive response
8. Recommendation with milestones and kill criteria

**Build vs buy vs partner:**

| Option | Pros | Cons | When |
|---|---|---|---|
| Build | Control, IP, lower cash outlay upfront, culture fit | Slow, execution risk | Core capability, time available |
| Buy (M&A) | Speed, proven capability, customers | Premium paid, integration risk | Time-critical, scarce capability |
| Partner (JV, alliance, licensing) | Low cost, shared risk, flexibility | Less control, shared economics | Non-core, uncertain market, regulatory constraints |

**Capital allocation:** rank opportunities by risk-adjusted NPV per rupee invested, strategic importance and reversibility. Use different hurdle rates for different risk profiles. Compare with returning cash to shareholders. Portfolio tools: growth-share (BCG matrix), GE-McKinsey matrix, value-creation map (ROIC vs growth).

**Worked example: build vs buy (illustrative, ₹ Cr).** A payments company wants a lending capability.
- Build: invest 60 over 2 years; launch in year 3; PV of future cash flows 100 → NPV ≈ **+40**, but two years later to market
- Buy a small NBFC with a lending licence and team for 150; PV of cash flows including synergies 180 → NPV ≈ **+30**, immediate market entry and regulatory licence
- Partner with an existing NBFC (co-lending or loan service provider model): little investment; PV of fee income 35 → NPV ≈ **+35**, but shares economics and depends on partner's credit appetite

The partner route is close to build on NPV, needs far less capital, and keeps optionality; many firms partner first and buy or build later (a real option). Regulatory constraints may force the choice.

**Indian context.** Indian fintechs often begin as loan service providers (LSPs) partnering with banks and NBFCs, then acquire or apply for NBFC licences. RBI's digital lending rules govern the partnership economics (e.g., default loss guarantee caps) [VERIFY: RBI Digital Lending Directions on LSPs and DLG]. Conglomerates allocate capital across very different businesses, often justifying holding-company discounts.

**Common mistakes.**
- Presenting a single-point NPV without the assumptions that drive it.
- Ignoring the "do nothing" baseline (often declining, not flat).
- Using the corporate WACC for a risky new venture.
- Overlooking regulatory and capability constraints.

**Interview angle.**
1. *Should a fintech enter lending?* Assess market size and margins, its data advantage for underwriting, regulatory route (partner, buy or license), capital needs, credit risk appetite, and unit economics (yield minus cost of funds minus credit cost minus opex).
2. *How do you decide between building and buying?* Speed to market, cost (premium vs development cost), capability scarcity, integration risk and strategic control.
3. *How would you allocate capital across five business units?* By economic profit potential (ROIC − WACC × growth opportunity), strategic fit and risk, while funding maintenance needs and comparing with buybacks.

**Related topics:** [8.3] Real options, [9.2] Unit economics, [12.1] M&A rationale, [21.6] Digital lending.

---

### [9.6] Startup and Platform Finance Metrics
<!-- tags: domain=business-finance; level=intermediate; roles=Fintech-PM,PE,Consulting,ER; keywords=burn rate, runway, GMV, take rate, ARR, MRR, Rule of 40, net revenue retention, path to profitability, adjusted EBITDA, magic number -->

**Definition.** Startup metrics track growth, efficiency and survival for businesses that are often not yet profitable: how fast they burn cash, how long the money lasts, and how efficiently growth is bought.

**Why it matters.** Fintech and consumer internet interviews (Razorpay, PhonePe, CRED, Groww-type companies) expect fluency in these metrics, how they relate to the financial statements, and how investors use them.

**Core mechanics.**
- **Gross burn** = Total monthly cash operating expenses; **net burn** = Cash out − Cash in from operations
- **Runway** (months) = Cash / Net burn
- **GMV / GOV / TPV:** total value of transactions on the platform (not revenue)
- **Take rate** = Revenue / GMV
- **MRR / ARR:** monthly or annual recurring revenue (ARR = MRR × 12)
- **Net revenue retention (NRR)** = (Starting cohort revenue + expansion − contraction − churn) / Starting cohort revenue
- **Rule of 40** (SaaS): Revenue growth % + EBITDA (or FCF) margin % ≥ 40%
- **Magic number** (SaaS sales efficiency) = (Quarterly revenue increase × 4) / Prior quarter sales and marketing spend; above about 0.75 is commonly considered efficient
- **Burn multiple** = Net burn / Net new ARR (lower is better)
- **Path to profitability:** contribution margin positive → adjusted EBITDA positive → EBITDA positive (including ESOP cost) → FCF positive

**Worked example 1: runway.** Cash ₹120 Cr; monthly gross burn ₹15 Cr; monthly cash collections ₹5 Cr.
- Net burn = ₹10 Cr; runway = **12 months**
- If collections grow ₹0.5 Cr a month while costs stay flat, net burn falls by ₹0.5 Cr each month (10, 9.5, 9, ...) and reaches zero in month 21. Cumulative burn peaks at about ₹105 Cr, below the ₹120 Cr in the bank, so the company reaches cash breakeven without needing to raise. Runway on today's burn understates survival when burn is falling, and overstates it when burn is rising.

**Worked example 2: Rule of 40.**

| Company | Revenue growth | EBITDA margin | Score |
|---|---|---|---|
| A | 30% | −5% | 25 (below) |
| B | 15% | 28% | 43 (passes) |
| C | 60% | −15% | 45 (passes) |

**Worked example 3: NRR.** Customers who paid ₹10 Cr ARR a year ago now pay ₹11.5 Cr after ₹2.5 Cr expansion, ₹0.4 Cr downgrades and ₹0.6 Cr churn. NRR = 11.5 / 10 = **115%**.

**Indian context.** Indian new-age listed companies report adjusted EBITDA (usually excluding ESOP costs) and segment contribution margins; SEBI's ICDR requires KPI disclosures in IPO documents with auditor or chartered accountant certification [VERIFY: SEBI ICDR KPI disclosure requirements]. For lending fintechs, "AUM" (including partner-originated loans) and "disbursements" are key growth metrics, while credit costs determine profitability.

**Common mistakes.**
- Reporting GMV growth as revenue growth.
- Computing runway on gross burn (understates runway) or ignoring committed future costs (overstates it).
- Treating adjusted EBITDA (ex-ESOP) as true profitability.

**Interview angle.**
1. *How do you value a pre-profit fintech?* EV/Revenue or EV/Gross profit benchmarked to peers, adjusted for growth and margins, cross-checked with a DCF that models the path to steady-state margins and probability-weighted scenarios.
2. *What's the difference between GMV and revenue for a marketplace?* GMV is the total value transacted; revenue is what the marketplace earns (commissions, fees, ads), typically a small share of GMV.
3. *What does an NRR of 120% mean?* The existing customer base grows revenue 20% a year on its own, net of churn, which signals strong product-market fit and expansion potential.

**Related topics:** [9.2] Unit economics, [10.8] Startup valuation, [4.11] Sector metrics, [14.4] VC term sheets.

---

## Module 9 Glossary

| Term | Definition |
|---|---|
| ARR | Annual recurring revenue |
| Burn multiple | Net burn / Net new ARR |
| CAC | Customer acquisition cost |
| CAC payback | Months of gross profit needed to recover CAC |
| Contribution margin (C1/C2/C3) | Revenue less variable costs at progressive levels |
| Driver-based forecast | Forecast built from operational drivers |
| EVA | Economic value added = NOPAT − WACC × Invested capital |
| GMV | Gross merchandise value transacted |
| LTV | Lifetime gross profit from a customer |
| NRR | Net revenue retention |
| PVM | Price-volume-mix decomposition |
| RONIC | Return on new invested capital |
| Rule of 40 | Growth % + margin % ≥ 40 |
| Runway | Cash / Net burn (months) |
| Take rate | Revenue / GMV |

## Module 9 Rapid-Fire Quiz

1. ARPU ₹300/month, gross margin 60%, monthly churn 5%. LTV? **₹3,600**
2. CAC ₹2,000, monthly gross profit per user ₹200. Payback? **10 months**
3. Cash ₹60 Cr, net burn ₹4 Cr/month. Runway? **15 months**
4. NOPAT ₹50 Cr, WACC 10%, g 4%, RONIC 10%. Value? **₹500 Cr**
5. CM 30%, price cut 5%. Volume increase needed to break even? **20%**
6. Revenue growth 25%, EBITDA margin 10%. Rule of 40 score? **35**
7. GMV ₹1,000 Cr, revenue ₹80 Cr. Take rate? **8%**
8. Growth with RONIC below WACC does what to value? **Destroys it**
9. Invested capital ₹500 Cr, ROIC 15%, WACC 12%. EVA? **₹15 Cr**
10. Which usually drives LTV more: lower churn or lower CAC? **Lower churn (LTV itself rises); CAC affects the ratio but not LTV**

## Module 9 [VERIFY] Items

1. Company shareholder letters: contribution margin and adjusted EBITDA definitions
2. Sector ROCE and valuation data
3. Current MDR rules; RBI Fair Practices Code and Key Fact Statement norms
4. RBI Digital Lending Directions on LSPs and DLG
5. SEBI ICDR KPI disclosure requirements

---

# Module 10: Valuation

*Reference company for this module.* Omega Ltd (₹ Cr): LTM revenue 1,000; LTM EBITDA 190; LTM PAT 93.75; net debt 250; 10 Cr shares. Forecast: revenue growth 15%, 14%, 13%, 12%, 10% over FY+1 to FY+5; EBIT margin 15%; D&A 4% of revenue; capex 6% of revenue; NWC 10% of revenue; tax 25%; WACC 12%; terminal growth 5%.

## 10A. Intrinsic Valuation

### [10.1] Valuation Approaches: An Overview
<!-- tags: domain=valuation; level=foundation; roles=IB,PE,ER,CF,Consulting,Fintech-PM; keywords=intrinsic valuation, relative valuation, DCF, comparable companies, precedent transactions, asset-based valuation, LBO valuation, sum of the parts, price vs value -->

**Definition.** Valuation estimates what an asset or business is worth. The main approaches are intrinsic (DCF: value from expected cash flows), relative (multiples of comparable companies or transactions), and asset-based (value of net assets); specialised methods include LBO analysis, sum-of-the-parts and option-based methods.

**Why it matters.** Every IB, PE, ER and corporate development role uses valuation daily, and "how do you value a company?" is the most common finance interview question. Good answers show when each method works, what drives it and how to triangulate.

**Core mechanics.**

| Approach | Method | Best for | Weakness |
|---|---|---|---|
| Intrinsic | DCF (FCFF or FCFE), DDM, residual income | Stable, forecastable cash flows; strategic decisions | Sensitive to WACC, growth and terminal value |
| Relative | Trading comparables | Quick market-based view; listed peers exist | Market may misprice the whole sector; comparability |
| Relative | Precedent transactions | M&A pricing; includes control premium | Dated; deal-specific factors; limited data |
| Asset-based | Book value, adjusted NAV, liquidation value | Holding companies, real estate, distressed firms, financials | Ignores going-concern earning power |
| Sponsor | LBO analysis | Floor valuation for buyout-able firms | Depends on debt markets and return targets |
| Composite | Sum-of-the-parts (SOTP) | Conglomerates, holding companies | Requires segment data; holding discount judgement |
| Venture | VC method, scorecard, option-based | Early-stage startups | Highly assumption-driven |

- **Price vs value:** price is what the market pays today; value is an estimate of worth. Investment opportunities arise when they diverge.
- **Enterprise value (EV)** values the operating business for all capital providers; **equity value** is what belongs to shareholders. EV = Equity value + Net debt + other claims (see [10.5]).
- **Football field:** a chart showing the valuation range from each method, used to triangulate a recommended range (see [10.12]).

**Worked example.** Omega Ltd valued four ways (detailed in later topics), per share:

| Method | Range (₹/share) | Midpoint |
|---|---|---|
| DCF (WACC 11–13%, g 4–6%) | 112–210 | 147 |
| Trading comps (EV/EBITDA 10.0–12.0x LTM) | 165–203 | 182 |
| Trading comps (P/E 16.25x LTM) | — | 152 |
| Precedent transactions (12.75x LTM, control basis) | — | 217 |

The precedents sit highest because they include a control premium. The DCF sits lowest; its implied terminal multiple (about 6.6x year-5 EBITDA) is well below where peers trade, which prompts a review of terminal assumptions.

**Indian context.** Valuations for regulatory purposes in India (preferential allotments, FEMA pricing for foreign investment, schemes of arrangement, income tax fair market value) must follow prescribed methods and be done by registered valuers or SEBI-registered merchant bankers [VERIFY: Companies (Registered Valuers and Valuation) Rules 2017; FEMA pricing guidelines; SEBI ICDR preferential issue pricing].

**Common mistakes.**
- Relying on one method.
- Mixing equity-value multiples (P/E) with enterprise-value metrics (EBITDA).
- Treating a valuation as a single number rather than a range with key drivers.

**Interview angle.**
1. *How do you value a company?* Three main ways: intrinsic (DCF), relative (trading comps), and precedent transactions; for a sponsor, LBO analysis. Triangulate and explain why methods differ.
2. *Which method gives the highest value, usually?* Precedent transactions, because they include control premiums and synergies. LBO often sets a floor.
3. *When would you not use a DCF?* When cash flows are unpredictable or negative for a long time (early-stage startups), or for financial institutions where debt is operational (use FCFE, DDM or residual income).

**Related topics:** [10.2] DCF, [10.6] Trading comps, [10.7] Precedents, [10.12] Football field.

---

### [10.2] Discounted Cash Flow: Building FCFF and Discounting
<!-- tags: domain=valuation; level=intermediate; roles=IB,PE,ER,CF,Consulting; keywords=DCF, free cash flow to firm, FCFF, unlevered free cash flow, NOPAT, capex, change in NWC, WACC, mid-year convention, enterprise value -->

**Definition.** A DCF values a business as the present value of its expected future free cash flows. Free cash flow to the firm (FCFF, or unlevered FCF) is the cash available to all capital providers after operating costs, taxes and reinvestment, discounted at WACC to get enterprise value.

**Why it matters.** The DCF is the anchor of intrinsic valuation and the most tested technical skill in banking and PE interviews. It forces explicit assumptions about growth, margins, reinvestment and risk.

**Core mechanics.**
- FCFF = EBIT × (1 − t) + D&A − Capex − ΔNWC
- Alternative starting points:
  - From EBITDA: EBITDA × (1 − t) + D&A × t − Capex − ΔNWC
  - From net income: NI + Interest × (1 − t) + D&A − Capex − ΔNWC
- Steps:
  1. Forecast revenue (drivers) and operating margins over an explicit period (5–10 years, until steady state)
  2. Forecast reinvestment: capex, D&A, working capital
  3. Compute FCFF each year
  4. Estimate WACC
  5. Compute terminal value (see [10.3])
  6. Discount FCFF and TV to today → enterprise value
  7. Bridge to equity value and divide by diluted shares (see [10.5])
- **Mid-year convention:** discount each year's cash flow by (t − 0.5) years, reflecting cash arriving through the year rather than at year end. Raises value modestly.

**Worked example.** Omega Ltd (₹ Cr):

| Year | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Revenue | 1,150.0 | 1,311.0 | 1,481.4 | 1,659.2 | 1,825.1 |
| EBIT (15%) | 172.5 | 196.7 | 222.2 | 248.9 | 273.8 |
| NOPAT (× 0.75) | 129.4 | 147.5 | 166.7 | 186.7 | 205.3 |
| + D&A (4%) | 46.0 | 52.4 | 59.3 | 66.4 | 73.0 |
| − Capex (6%) | (69.0) | (78.7) | (88.9) | (99.6) | (109.5) |
| − ΔNWC (10% of Δrevenue) | (15.0) | (16.1) | (17.0) | (17.8) | (16.6) |
| **FCFF** | **91.4** | **105.2** | **120.0** | **135.7** | **152.2** |
| Discount factor at 12% | 0.893 | 0.797 | 0.712 | 0.636 | 0.567 |
| PV | 81.6 | 83.8 | 85.4 | 86.2 | 86.4 |

- Sum of PV of FCFF = **₹423.4 Cr**
- Terminal value (Gordon, g = 5%) = 152.2 × 1.05 / (0.12 − 0.05) = ₹2,283.5 Cr; PV = **₹1,295.7 Cr**
- Enterprise value = 423.4 + 1,295.7 = **₹1,719.2 Cr** (terminal value is 75% of EV)
- Equity value = 1,719.2 − 250 = **₹1,469.2 Cr** → **₹146.9 per share**
- With the mid-year convention (applied to both explicit flows and TV), EV ≈ ₹1,819 Cr and value ≈ ₹157 per share.

**Indian context.** Indian DCFs typically use INR cash flows, an INR risk-free rate (10-year G-sec) and Indian tax rates (25.17% under section 115BAA for many companies). For companies with tax holidays (SEZ units) or carried-forward losses, model the actual cash tax path [VERIFY: applicable tax regime and holidays for the company].

**Common mistakes.**
- Inconsistent growth: high revenue growth with low capex and NWC investment.
- Deducting interest from FCFF.
- Ignoring stock-based compensation (either treat it as a cash-like cost or include dilution).
- Forecast periods too short for high-growth companies, pushing too much value into the terminal value.

**Interview angle.**
1. *Walk me through a DCF.* Project unlevered free cash flows for 5–10 years, calculate a terminal value, discount both at WACC to get enterprise value, subtract net debt and other claims to get equity value, and divide by diluted shares.
2. *Why unlevered FCF with WACC?* Unlevered FCF is available to all capital providers, so it is discounted at the blended cost of all capital, producing enterprise value.
3. *What usually drives most of DCF value?* The terminal value (often 60–80%), so terminal growth, terminal margins and WACC assumptions deserve the most scrutiny.

**Related topics:** [8.2] Project cash flows, [8.5] WACC, [10.3] Terminal value, [10.5] EV bridge, [11.3] Three-statement model.

---

### [10.3] Terminal Value: Gordon Growth, Exit Multiples and Consistency Checks
<!-- tags: domain=valuation; level=advanced; roles=IB,PE,ER,CF; keywords=terminal value, Gordon growth method, perpetuity growth, exit multiple method, implied multiple, implied growth, reinvestment rate, RONIC, sensitivity table -->

**Definition.** Terminal value (TV) captures the value of all cash flows beyond the explicit forecast period. It is estimated with the perpetuity growth (Gordon) method or the exit multiple method.

**Why it matters.** TV usually makes up most of a DCF's value, so errors here dominate. Interviewers test the formulas, the cross-checks between methods, and whether growth and reinvestment assumptions are consistent.

**Core mechanics.**
- **Perpetuity growth:** TV_n = FCFF_(n+1) / (WACC − g) = FCFF_n × (1 + g) / (WACC − g)
  - g should not exceed long-run nominal GDP growth of the economy (and is usually below it for mature firms)
- **Exit multiple:** TV_n = Terminal-year metric × Multiple (e.g., EBITDA_n × EV/EBITDA)
- **Cross-checks:**
  - Implied exit multiple from Gordon TV = TV / EBITDA_n
  - Implied growth from exit multiple TV: g = (TV × WACC − FCFF_n) / (TV + FCFF_n)
- **Value-driver consistency:** in steady state, growth requires reinvestment: FCFF_(n+1) = NOPAT_(n+1) × (1 − g / RONIC). Simply growing the last FCFF by g implicitly assumes a reinvestment rate and therefore a RONIC.
- **Sensitivity tables** on WACC and g (or the exit multiple) are standard.

**Worked example.** Omega Ltd: FCFF₅ = 152.2; NOPAT₅ = 205.3; EBITDA₅ = 346.8; WACC 12%; g 5%.

1. Gordon TV = 152.2 × 1.05 / 0.07 = **₹2,283.5 Cr**
   - Implied EV/EBITDA on year-5 EBITDA = 2,283.5 / 346.8 = **6.6x**
2. Exit multiple of 7.0x year-5 EBITDA: TV = **₹2,427.6 Cr**; EV = 423.4 + 2,427.6 / 1.7623 = **₹1,800.9 Cr**
   - Implied perpetual growth = (2,427.6 × 0.12 − 152.2) / (2,427.6 + 152.2) = **5.4%**
3. Value-driver check: year-5 FCFF/NOPAT = 152.2 / 205.3 = 74.1%, a reinvestment rate of 25.9%. Growing at 5% with that reinvestment implies RONIC = 5% / 25.9% = **19.3%**, above the current 15% ROIC. If RONIC is set at 15%:
   - NOPAT₆ = 205.3 × 1.05 = 215.6; FCFF₆ = 215.6 × (1 − 5%/15%) = 143.7
   - TV = 143.7 / 0.07 = **₹2,053 Cr** → EV ₹1,588 Cr → **₹134 per share** (vs ₹147)

Sensitivity of value per share (₹) to WACC and g:

| WACC \ g | 4% | 5% | 6% |
|---|---|---|---|
| 11% | 152.7 | 176.6 | 210.0 |
| 12% | 129.6 | **146.9** | 170.0 |
| 13% | 111.7 | 124.7 | 141.3 |

A one-point change in WACC moves value by about 15–20%.

**Indian context.** Indian nominal GDP growth has historically been around 10–12%, so practitioners sometimes use terminal growth rates of 5–6% in INR; real growth plus long-run inflation (with RBI's 4% CPI target) gives a reasoned anchor [VERIFY: long-run nominal GDP growth estimates; RBI inflation target]. Using INR terminal growth above the risk-free rate deserves explicit justification.

**Common mistakes.**
- Terminal growth above the WACC (formula breaks) or above long-run nominal GDP.
- Using a current, cyclically high margin in the terminal year.
- Gordon TV and exit multiple TV implying wildly different assumptions without reconciliation.
- Discounting TV by n + 1 years instead of n.

**Interview angle.**
1. *Gordon growth vs exit multiple: which do you prefer?* Gordon is more intrinsic and forces explicit long-run assumptions; exit multiples anchor to the market but import its mispricing. Use one and cross-check with the other.
2. *If the implied exit multiple from your Gordon TV is 20x but peers trade at 10x, what does it mean?* Your growth or WACC assumptions are aggressive, or the terminal-year cash flow is too high. Revisit them.
3. *Why must growth require reinvestment in the terminal value?* Growth needs capital. Assuming growth without reinvestment implies infinite returns on new capital and overstates value.

**Related topics:** [9.3] Value driver formula, [10.2] DCF, [10.11] Justified multiples.

---

### [10.4] FCFE, Dividend Discount and Residual Income Models
<!-- tags: domain=valuation; level=intermediate; roles=ER,IB,CF,PE; keywords=free cash flow to equity, FCFE, dividend discount model, Gordon growth model, two-stage DDM, residual income model, cost of equity, equity valuation -->

**Definition.** Equity-side intrinsic models value shareholders' claims directly: FCFE discounts cash available to equity holders at the cost of equity; the dividend discount model (DDM) discounts expected dividends; the residual income model values equity as book value plus the PV of profits above the cost of equity.

**Why it matters.** These are the right tools for banks and financial companies (where debt is operational) and for stable dividend-paying firms. They also give an equity value directly, avoiding the EV bridge.

**Core mechanics.**
- **FCFE** = FCFF − Interest × (1 − t) + Net borrowing
  - Or = Net income + D&A − Capex − ΔNWC + Net borrowing
  - Discount at the cost of equity (Ke) to get equity value
- **Dividend discount model:**
  - Gordon: P₀ = D₁ / (Ke − g)
  - Two-stage: PV of dividends during high growth + PV of terminal price at the end of high growth, where P_n = D_(n+1) / (Ke − g_stable)
- **Residual income model:**
  - Residual income_t = Net income_t − Ke × Book value_(t−1) = (ROE_t − Ke) × BV_(t−1)
  - Equity value = BV₀ + Σ PV(Residual income)
  - With constant ROE and growth: P/B = (ROE − g) / (Ke − g)
- Consistency: FCFF/WACC and FCFE/Ke should give the same equity value if leverage assumptions are consistent.

**Worked example 1: FCFE.** Omega's year-1 FCFF is ₹91.4 Cr; interest ₹25 Cr; tax 25%; net new borrowing ₹10 Cr.
- FCFE = 91.4 − 25 × 0.75 + 10 = **₹82.65 Cr**

**Worked example 2: two-stage DDM.** Current dividend D₀ = ₹5; growth 20% for 3 years, then 6% forever; Ke = 13%.
- D₁ = 6.00; D₂ = 7.20; D₃ = 8.64; D₄ = 8.64 × 1.06 = 9.16
- P₃ = 9.16 / (0.13 − 0.06) = ₹130.83
- P₀ = 6.00/1.13 + 7.20/1.13² + (8.64 + 130.83)/1.13³ = 5.31 + 5.64 + 96.66 = **₹107.61**

**Worked example 3: residual income.** A bank's book value per share is ₹200; sustainable ROE 16%; growth 10%; Ke 13%.
- Justified P/B = (16% − 10%) / (13% − 10%) = **2.0x** → value ₹400 per share
- If ROE fell to 13% (= Ke), P/B would be 1.0x: the bank would be worth only its book value.

**Indian context.** Indian banks and NBFCs are typically valued on P/B, justified by ROE vs cost of equity and growth, or via residual income; PSU banks trade at lower P/B than leading private banks because of lower expected ROE and governance discounts [VERIFY: current P/B multiples for Indian banks]. Since dividends are taxed in shareholders' hands, investors' preferences between dividends and capital gains depend on their tax slabs.

**Common mistakes.**
- Discounting FCFE at WACC (mismatched).
- Using DDM for companies that pay little or irregular dividends.
- Ignoring that a growing bank needs to retain capital to grow (growth limits payout).

**Interview angle.**
1. *When would you use FCFE instead of FCFF?* For financial institutions, or when leverage will change significantly and is easier to model explicitly, such as in a bank or an LBO equity view.
2. *Why is P/B the key multiple for banks?* Book value is largely financial assets marked close to fair value, and ROE relative to cost of equity determines whether a bank deserves a premium or discount to book.
3. *What does the residual income model tell you that a P/E doesn't?* That value is created only when ROE exceeds the cost of equity; a bank earning below Ke should trade below book.

**Related topics:** [10.10] Valuing financial institutions, [8.8] Payout policy, [19.2] Bank metrics.

---

### [10.5] From Enterprise Value to Equity Value: The Bridge and Diluted Shares
<!-- tags: domain=valuation; level=intermediate; roles=IB,PE,ER,CF; keywords=enterprise value, equity value, net debt, EV bridge, minority interest, preference shares, lease liabilities, associates, diluted shares, treasury stock method -->

**Definition.** Enterprise value (EV) is the value of a company's core operations to all capital providers. Equity value is the residual for common shareholders. The bridge between them adds and subtracts non-operating assets and non-equity claims.

**Why it matters.** Getting the bridge wrong is one of the most common valuation errors. "Why do we subtract cash?" and "what goes into the EV bridge?" are standard interview questions.

**Core mechanics.**
- EV = Equity value + Debt + Preference shares + Non-controlling interest + Lease liabilities (if EBITDA excludes rent) + Other debt-like items (unfunded pensions, certain provisions) − Cash and equivalents − Non-operating assets (investments, surplus land) − Investments in associates and JVs
- Reverse it to go from DCF EV to equity value.
- **Consistency principle:** if a claim's or asset's earnings are in the denominator metric (EBITDA), its value belongs in EV; if not, adjust.
  - NCI is added because consolidated EBITDA includes 100% of subsidiaries
  - Associates are subtracted because their profits are not in EBITDA
- **Diluted shares:** basic shares + in-the-money options and warrants (treasury stock method) + convertible securities if in the money (if-converted). For a DCF, compute iteratively because dilution depends on the share price.

**Worked example 1: market EV.** A listed company (₹ Cr):

| Item | ₹ Cr |
|---|---|
| Market capitalisation | 1,500 |
| + Total debt | 300 |
| + Lease liabilities | 60 |
| + Preference shares | 20 |
| + Non-controlling interest | 80 |
| − Cash and equivalents | (50) |
| − Non-operating investments | (50) |
| − Investments in associates | (40) |
| **Enterprise value** | **1,820** |

**Worked example 2: diluted shares.** Basic shares 10 Cr; 0.5 Cr options with exercise price ₹100; share price ₹150.
- Treasury stock method: new shares = 0.5 × (150 − 100) / 150 = **0.167 Cr**
- Diluted shares = **10.167 Cr**

**Indian context.** Indian companies often hold large treasury investments (mutual funds, bonds) classified as current investments; these are typically treated as cash-like. Promoter-group cross-holdings and investments in listed group companies should be valued separately (often with a holding discount). Contingent liabilities (tax disputes) may warrant a probability-weighted deduction.

**Common mistakes.**
- Subtracting operating cash needed to run the business as "excess cash" (minor in most cases, but material for retailers and banks).
- Forgetting lease liabilities when EBITDA is post-Ind AS 116.
- Using basic shares instead of diluted shares.

**Interview angle.**
1. *Why subtract cash when calculating EV?* An acquirer gets the cash and could use it to pay down debt or reduce the effective price; EV values operations only, and cash is non-operating.
2. *A company raises ₹100 Cr of debt and holds it as cash. What happens to EV?* No change: debt and cash both rise by ₹100 Cr and offset. Equity value is also unchanged.
3. *Why add NCI to EV?* Consolidated EBITDA includes 100% of subsidiaries' EBITDA, so EV must include the value attributable to minority holders for EV/EBITDA to be consistent.

**Related topics:** [5.3] Consolidation, [2.8] Leases, [2.12] Diluted EPS, [10.6] Trading comps.

---

## 10B. Relative Valuation

### [10.6] Trading Comparables (Comps)
<!-- tags: domain=valuation; level=intermediate; roles=IB,ER,PE,Consulting; keywords=trading comps, comparable companies analysis, peer selection, EV/EBITDA, P/E, LTM, NTM, calendarisation, median multiple, comps table -->

**Definition.** Trading comparables value a company by applying valuation multiples from similar listed companies to the target's financial metrics.

**Why it matters.** Comps are fast, market-anchored and universally used in pitch books, equity research and IPO pricing. Interviewers test peer selection, multiple choice, and the matching of numerators and denominators.

**Core mechanics.**
1. **Select peers:** same industry, business model, growth, margins, size, geography, risk. Usually 5–15 names, with tiers by closeness.
2. **Gather data:** share price, diluted shares, debt, cash, NCI and other EV items; LTM (last twelve months) and NTM (next twelve months) or forward-year estimates.
3. **Calendarise** for different fiscal year ends (India's April–March vs calendar years).
4. **Normalise:** remove one-offs, adjust for accounting differences (leases, ESOP treatment).
5. **Compute multiples** and summary statistics (median, mean, quartiles).
6. **Apply** to the target's metrics, and bridge EV to equity value per share.

Matching rule:

| Numerator | Denominator must be | Examples |
|---|---|---|
| Enterprise value | Metrics before interest (all capital) | EV/Revenue, EV/EBITDA, EV/EBIT |
| Equity value | Metrics after interest (equity holders) | P/E, P/B, P/CF |

**Worked example.** Omega Ltd: LTM EBITDA ₹190 Cr; LTM PAT ₹93.75 Cr; net debt ₹250 Cr; 10 Cr shares.

| Peer | EV | EBITDA | EV/EBITDA | Market cap | PAT | P/E |
|---|---|---|---|---|---|---|
| P1 | 3,000 | 300 | 10.0x | 2,600 | 160 | 16.3x |
| P2 | 2,400 | 200 | 12.0x | 2,200 | 120 | 18.3x |
| P3 | 4,500 | 500 | 9.0x | 3,800 | 260 | 14.6x |
| P4 | 1,800 | 165 | 10.9x | 1,500 | 95 | 15.8x |
| P5 | 5,200 | 400 | 13.0x | 4,600 | 230 | 20.0x |
| **Median** | | | **10.9x** | | | **16.25x** |
| 25th–75th percentile | | | 10.0x–12.0x | | | 15.8x–18.3x |

- EV/EBITDA: EV = 10.9 × 190 = ₹2,071 Cr → equity ₹1,821 Cr → **₹182 per share** (range ₹165–203 at 10.0–12.0x)
- P/E: equity = 16.25 × 93.75 = ₹1,523 Cr → **₹152 per share**
- The gap suggests Omega has more leverage or lower net margins than peers; investigate before relying on either.

**Indian context.** For Indian targets, peers may include global companies, but differences in growth, cost of capital and liquidity mean Indian peers usually trade at different multiples; Indian consumer and financial services companies have often traded at premiums to global peers [VERIFY: current India vs global sector multiples]. Data sources include Capitaline, Prowess (CMIE), Bloomberg, CapIQ and exchange filings.

**Common mistakes.**
- Picking peers by industry label only, ignoring growth and margin differences.
- Mixing LTM and forward metrics across peers.
- Using the mean when one outlier distorts it (median is safer).
- Applying EV multiples to equity metrics or vice versa.

**Interview angle.**
1. *How do you choose comparables?* By business model, end markets, growth, margins, size and geography, then refine to the closest peers and explain differences.
2. *Why might EV/EBITDA and P/E give different values?* Different leverage, tax rates, D&A intensity, or non-operating income across companies.
3. *What does a company trading at a premium to peers tell you?* The market expects higher growth, better margins or returns, lower risk, or there's a scarcity premium (few listed peers).

**Related topics:** [10.5] EV bridge, [10.7] Precedents, [10.11] Choosing multiples, [13.4] IPO pricing.

---

### [10.7] Precedent Transactions
<!-- tags: domain=valuation; level=intermediate; roles=IB,PE,Consulting; keywords=precedent transactions, transaction comps, control premium, deal multiples, M&A valuation, synergies, deal screening -->

**Definition.** Precedent transaction analysis values a company using multiples paid in past acquisitions of similar companies.

**Why it matters.** It shows what buyers have actually paid for control, so sell-side bankers use it to anchor price expectations. It usually produces higher values than trading comps.

**Core mechanics.**
1. **Screen deals:** same or adjacent sector, similar size, recent (often last 3–5 years), similar deal type (control acquisitions).
2. **Collect data:** announced deal value, % acquired, target's LTM metrics at announcement, form of consideration, buyer type (strategic or financial).
3. **Compute multiples:** EV/Revenue, EV/EBITDA, sometimes P/E; and premiums paid (offer price vs undisturbed share price 1 day, 1 week, 1 month before announcement).
4. **Adjust for context:** market conditions, synergies, competitive tension, distressed sales.
5. **Apply** median or a range to the target.

- **Control premium:** the extra paid over the market price for control (often 20–40% in public deals, varying widely), reflecting synergies and control benefits.

**Worked example.**

| Deal (illustrative) | Year | EV/LTM EBITDA | Buyer |
|---|---|---|---|
| A acquires X | 2022 | 12.5x | Strategic |
| B acquires Y | 2023 | 11.0x | Financial |
| C acquires Z | 2024 | 14.0x | Strategic |
| D acquires W | 2025 | 13.0x | Strategic |
| **Median** | | **12.75x** | |

Omega: EV = 12.75 × 190 = ₹2,422.5 Cr → equity ₹2,172.5 Cr → **₹217 per share**, about 19% above the trading-comps midpoint of ₹182, consistent with a typical control premium.

**Indian context.** In India, acquiring 25% or more of a listed company triggers a mandatory open offer under SEBI SAST, and the minimum open offer price follows a formula (including the highest negotiated price and volume-weighted market prices) [VERIFY: SEBI SAST Regulations 2011, Regulation 8 pricing]. Deal data sources: VCCEdge, Venture Intelligence, Mergermarket, company announcements.

**Common mistakes.**
- Using stale deals from very different market conditions.
- Mixing minority stake deals with control deals.
- Ignoring that strategic buyers' multiples include synergies a financial buyer can't pay for.

**Interview angle.**
1. *Why do precedent multiples usually exceed trading multiples?* They include the control premium and expected synergies.
2. *When are precedents less useful?* When few comparable deals exist, deals are old, or market conditions have changed sharply.
3. *What is a control premium?* The amount above the pre-announcement market price paid to acquire control, reflecting synergies and the right to direct strategy and cash flows.

**Related topics:** [10.6] Trading comps, [12.2] Synergies, [12.6] SEBI SAST.

---

### [10.8] Valuing Startups and Early-Stage Companies
<!-- tags: domain=valuation; level=intermediate; roles=PE,Fintech-PM,Consulting,IB; keywords=startup valuation, VC method, pre-money, post-money, target return, dilution, scorecard method, revenue multiples, probability-weighted scenarios -->

**Definition.** Early-stage valuation estimates what a young, often loss-making company is worth when cash flows are highly uncertain. Common methods are the VC method, revenue or gross-profit multiples, scorecard methods and probability-weighted DCF scenarios.

**Why it matters.** Fintech and startup roles need fluency in pre-money, post-money, dilution and how VCs back into valuations from exit expectations. These concepts also explain why down rounds hurt.

**Core mechanics.**
- **Pre-money and post-money:** Post-money = Pre-money + New investment; Investor ownership = Investment / Post-money.
- **VC method:**
  1. Estimate exit value in year n (e.g., forecast revenue × exit multiple)
  2. Divide by the target multiple (1 + target IRR)^n to get today's post-money
  3. Adjust for expected future dilution: required ownership today = Required ownership at exit / Retention ratio
  4. Pre-money = Post-money − Investment
- Typical target IRRs are high (often 30–60% for early stages) to compensate for failure rates.
- **Scorecard and Berkus methods:** adjust an average regional pre-money valuation by qualitative factors (team, market, product, competition).
- **Multiples:** EV/ARR, EV/Revenue, EV/Gross profit, benchmarked to listed peers and recent rounds, adjusted for growth and margin.
- **Probability-weighted scenarios:** DCF for success, moderate and failure outcomes, weighted by probability.

**Worked example.** A VC invests ₹30 Cr in a fintech expected to reach ₹500 Cr revenue in 5 years, with an exit at 4x revenue (₹2,000 Cr). Target IRR 50%; expected dilution from future rounds 30%.
- Target multiple = 1.5⁵ = 7.59x
- Post-money (no dilution adjustment) = 2,000 / 7.59 = ₹263 Cr → ownership needed = 30 / 263 = 11.4%
- Adjusted for dilution: ownership needed today = 11.4% / 0.70 = **16.3%**
- Post-money = 30 / 0.163 = **₹184 Cr**; pre-money = **₹154 Cr**

Basic round math: ₹20 Cr raised at ₹80 Cr pre-money → post-money ₹100 Cr → investor owns **20%**; existing holders are diluted from 100% to 80%.

**Indian context.** For Indian startups, share issue pricing to residents and non-residents has tax and FEMA implications (fair market value reports by merchant bankers or valuers). The "angel tax" under section 56(2)(viib) was abolished from FY2025-26 [VERIFY: Finance (No. 2) Act 2024 abolition of section 56(2)(viib)]. Late-stage Indian startups are often valued off listed peers (e.g., Indian new-age listed companies) and global comparables.

**Common mistakes.**
- Treating headline post-money valuation as the value of common shares (preferred shares have liquidation preferences, so common is worth less).
- Ignoring future dilution in VC method calculations.
- Applying public-market multiples without discounting for illiquidity and risk.

**Interview angle.**
1. *A startup raises ₹50 Cr at a ₹200 Cr pre-money. What's the investor's stake?* 50 / 250 = 20%.
2. *Why do VCs require such high target returns?* Most investments fail or return little; a few winners must return the fund, so each deal is underwritten to a high multiple.
3. *How would you value a pre-revenue fintech?* Team, market size, regulatory moat and comparable round valuations; scenario-weighted outcomes; VC method from a plausible exit.

**Related topics:** [14.4] VC term sheets, [14.5] Cap tables, [9.6] Startup metrics.

---

### [10.9] Sum-of-the-Parts (SOTP) and Holding Company Discounts
<!-- tags: domain=valuation; level=intermediate; roles=IB,ER,PE,Consulting; keywords=sum of the parts, SOTP, conglomerate discount, holding company discount, segment valuation, listed subsidiaries, demerger value unlocking -->

**Definition.** SOTP values a diversified company by valuing each business separately (using the most suitable method for each), adding them up, and subtracting net debt and other claims at the parent level.

**Why it matters.** Indian conglomerates and holding companies are often valued this way; SOTP frames value-unlocking moves such as demergers and listings of subsidiaries, which are common Indian corporate actions.

**Core mechanics.**
1. Identify segments or holdings (from segment reporting and subsidiaries)
2. Value each using appropriate methods (EV/EBITDA for operating businesses, P/B for financial arms, market value for listed stakes, NAV for real estate)
3. Apply holding company discounts where appropriate (often 10–30% on listed stakes) for tax leakage, lack of control, double-layer costs and governance concerns
4. Subtract parent-level net debt and add unallocated assets; subtract corporate costs (capitalised)
5. Divide by diluted shares

- **Conglomerate discount:** the market often values a diversified group below its SOTP because of capital allocation concerns, complexity and cross-subsidisation.

**Worked example (₹ Cr).**

| Part | Basis | Value |
|---|---|---|
| Consumer business | EBITDA 200 × 25x | 5,000 |
| Cement business | EBITDA 300 × 10x | 3,000 |
| 51% stake in listed subsidiary | 51% × market cap 2,000 = 1,020, less 20% holding discount | 816 |
| Less: parent net debt | | (800) |
| **Equity value** | | **8,016** |
| Shares (Cr) | | 50 |
| **SOTP value per share** | | **₹160.3** |

If the stock trades at ₹130, the 19% gap to SOTP is the market's implied conglomerate discount; a demerger of the consumer business might narrow it.

**Indian context.** Several Indian groups have demerged or listed businesses to "unlock value" (via NCLT-approved schemes of arrangement), and holding-company discounts on Indian listed holding firms are often large [VERIFY: recent Indian demergers and holding company discount data]. Demergers that meet section 2(19AA) conditions can be tax-neutral [VERIFY: Income Tax Act section 2(19AA)].

**Common mistakes.**
- Double-counting corporate costs (already in segment EBITDA) or forgetting them.
- Applying the same multiple to very different segments.
- Ignoring tax leakage on monetising stakes.

**Interview angle.**
1. *When do you use SOTP?* When a company has distinct businesses with different growth, risk and valuation multiples, or holds listed stakes.
2. *Why do conglomerates trade at a discount?* Complexity, capital allocation concerns, cross-subsidies, holding company costs and limited investor choice.
3. *How can management close a conglomerate discount?* Demergers, spin-offs, separate listings, better disclosure, or divesting non-core businesses.

**Related topics:** [5.5] Segment reporting, [12.8] Demergers and divestitures, [10.6] Comps.

---

### [10.10] Valuing Financial Institutions and Special Situations
<!-- tags: domain=valuation; level=advanced; roles=ER,IB,PE,Fintech-PM; keywords=bank valuation, P/B, ROE, P/ABV, insurance valuation, embedded value, NBFC valuation, cyclical companies, distressed valuation, negative earnings -->

**Definition.** Some businesses need adapted valuation approaches: banks and NBFCs (debt is raw material), insurers (long-dated liabilities), cyclical companies (earnings swing with the cycle), and distressed or loss-making firms.

**Why it matters.** Applying EV/EBITDA or a standard DCF to a bank gives nonsense. Fintech, banking and ER interviews test whether you know the right tools.

**Core mechanics.**
**Banks and NBFCs:**
- Value equity directly: P/B, P/ABV (price to adjusted book value, net of net NPAs), P/E, residual income, DDM
- Justified P/B = (ROE − g) / (Ke − g)
- Key drivers: ROA, leverage, NIM, credit costs, growth, capital adequacy (growth needs capital)

**Insurance:**
- Life insurers: price to embedded value (P/EV) and value of new business (VNB) multiples; appraisal value = EV + VNB × multiplier
- General insurers: P/B and P/E, driven by combined ratio and investment yield

**Cyclical companies (metals, cement, chemicals):** use normalised or mid-cycle earnings, EV/capacity (e.g., EV per tonne for cement), replacement cost.

**Loss-making or distressed companies:** EV/Revenue or EV/Gross profit, DCF with explicit turnaround scenarios, liquidation value as a floor, probability of default.

**Platforms and fintech:** EV/Revenue, EV/Gross profit, P/B for lending-heavy fintechs, and SOTP across payments, lending and wealth arms.

**Worked example 1: bank P/ABV.** Book value ₹10,000 Cr; net NPAs ₹500 Cr. Adjusted book value (ABV) = 10,000 − 500 = **₹9,500 Cr** (some analysts deduct a further haircut on stressed assets). At 1.8x ABV, market value = **₹17,100 Cr**.

**Worked example 2: cement EV per tonne.** A cement company with 20 MTPA capacity trades at an EV of ₹16,000 Cr → **₹800 Cr per MTPA**. If greenfield replacement cost is about ₹700–900 Cr per MTPA (illustrative), the market values it near replacement cost [VERIFY: current cement replacement cost per tonne].

**Worked example 3: life insurer.** Embedded value ₹40,000 Cr; VNB ₹3,000 Cr; multiplier 15x → appraisal value = 40,000 + 3,000 × 15 = **₹85,000 Cr** (P/EV 2.1x).

**Indian context.** Indian bank valuations are driven by asset quality cycles (the NPA cycle of 2015–2020 compressed PSU bank valuations), and leading private banks have traded at substantial premiums to book [VERIFY: current P/ABV multiples]. Indian life insurers disclose Indian Embedded Value (IEV) and VNB margins [VERIFY: IEV disclosure practice and APS10 standards].

**Common mistakes.**
- Using EV/EBITDA for banks.
- Valuing cyclicals on peak earnings with peak multiples (double counting the cycle).
- Ignoring capital needs for growth in banks.

**Interview angle.**
1. *How would you value HDFC Bank or a similar bank?* P/B or P/ABV justified by sustainable ROE, cost of equity and growth; cross-check with residual income or DDM and peer multiples.
2. *Why does P/E often look low at a cyclical peak?* Earnings are temporarily high. Use mid-cycle earnings; low P/Es on peak earnings can be value traps.
3. *How would you value a payments fintech with a lending arm?* SOTP: payments on EV/Revenue or gross profit multiples; lending on P/B given ROE; add cash.

**Related topics:** [10.4] Residual income, [19.2] Bank metrics, [10.9] SOTP.

---

### [10.11] Choosing and Justifying Multiples
<!-- tags: domain=valuation; level=advanced; roles=IB,ER,PE,Consulting; keywords=justified P/E, PEG ratio, EV/EBITDA drivers, EV/Sales, P/B, forward vs trailing multiples, multiple selection, fundamentals of multiples -->

**Definition.** Every multiple is a shorthand DCF: it implicitly reflects growth, risk and return on capital. Choosing the right multiple and understanding what drives it lets you judge whether a company deserves a premium.

**Why it matters.** "Why does Company A trade at 40x and B at 15x?" is a classic interview question. Answering it requires linking multiples to fundamentals.

**Core mechanics.**
- **Justified forward P/E** = Payout ratio / (Ke − g) = (1 − g/ROE) / (Ke − g)
- **Justified trailing P/E** = Payout × (1 + g) / (Ke − g)
- **Justified P/B** = (ROE − g) / (Ke − g)
- **Justified EV/EBIT** ≈ (1 − t) × (1 − g/RONIC) / (WACC − g)
- **PEG ratio** = P/E / EPS growth (in %); below 1 is sometimes read as cheap relative to growth (crude)
- **Multiple choice by situation:**

| Situation | Preferred multiple |
|---|---|
| Mature, profitable, similar capital structures | P/E |
| Different leverage or D&A | EV/EBITDA, EV/EBIT |
| Capital-intensive with large D&A differences | EV/EBIT |
| Loss-making but growing | EV/Revenue, EV/Gross profit |
| Banks, insurers, asset-heavy financials | P/B, P/E, P/EV |
| Real estate, holding companies | P/NAV |
| Subscription businesses | EV/ARR |

- **Forward vs trailing:** forward multiples reflect expected earnings and are preferred for growing companies; trailing are factual.

**Worked example.** Company with ROE 15%, Ke 13%, g 9%:
- Payout = 1 − 9%/15% = 40%
- Justified forward P/E = 0.40 / (0.13 − 0.09) = **10.0x**
- If ROE rises to 25% at the same growth: payout = 64%, P/E = 0.64 / 0.04 = **16.0x**
- Same growth, higher return on capital, much higher multiple: high-ROE companies need to retain less to grow.

PEG: P/E 30x with 25% growth → PEG = 1.2; P/E 18x with 10% growth → PEG = 1.8. The first looks cheaper relative to growth, but PEG ignores risk, ROE and the duration of growth.

**Indian context.** India's market has traded at a premium to most emerging markets on P/E, attributed to higher expected earnings growth, a broad sectoral mix and strong domestic flows [VERIFY: current Nifty forward P/E vs MSCI EM]. Sector multiples in India vary widely (consumer staples often at very high P/Es, PSU banks and metals at low multiples).

**Common mistakes.**
- Comparing P/Es across companies with very different leverage.
- Using EV/Revenue across businesses with very different margins.
- Treating PEG as a valuation model rather than a rough screen.

**Interview angle.**
1. *What drives a company's P/E?* Growth, return on capital (via payout needed to grow), and risk (cost of equity). Higher growth and ROE and lower risk mean a higher P/E.
2. *Why might a company with lower growth have a higher P/E?* Higher ROE (less reinvestment needed), lower risk, more durable growth, or the market expects acceleration.
3. *Which multiple for a loss-making SaaS company?* EV/ARR or EV/Revenue, adjusted for growth and gross margin, and possibly net revenue retention.

**Related topics:** [9.3] Value drivers, [10.6] Trading comps, [10.10] Financial institutions.

---

### [10.12] Football Field, Triangulation and Common Valuation Interview Questions
<!-- tags: domain=valuation; level=intermediate; roles=IB,PE,ER,Consulting,CF; keywords=football field chart, triangulation, valuation range, fairness opinion, valuation interview questions, 52-week range, analyst targets -->

**Definition.** A football field is a horizontal bar chart showing valuation ranges from different methods side by side, used to triangulate a recommended range and communicate it to clients or committees.

**Why it matters.** It's the summary slide of nearly every pitch book and fairness opinion. Being able to explain why methods differ, and which you trust, shows judgement beyond mechanics.

**Core mechanics.**
- Typical bars: 52-week trading range, analyst price targets, trading comps (EV/EBITDA, P/E), precedent transactions, DCF (range from sensitivity tables), LBO analysis (price a sponsor could pay at target returns).
- Show the offer price or current price as a vertical line.
- Triangulate: weigh methods by data quality and relevance; explain outliers.
- Present a range, not a point; lead with the key drivers.

**Worked example: Omega Ltd football field (₹ per share).**

| Method | Low | High |
|---|---|---|
| DCF (WACC 11–13%, g 4–6%) | 112 | 210 |
| Trading comps EV/EBITDA (10.0x–12.0x) | 165 | 203 |
| Trading comps P/E (15.8x–18.3x) | 148 | 172 |
| Precedent transactions (11.0x–14.0x) | 184 | 241 |

- Overlap of most methods: roughly ₹165–200
- Precedents sit higher (control premium); the DCF range is wide (sensitivity to WACC and g)
- A buyer offering ₹200 is within the comps range and at the low end of precedents; a fairness opinion could reasonably support it

**Classic valuation questions and crisp answers.**
1. *Which is higher, EV or equity value?* Usually EV, unless the company has net cash (more cash than debt), in which case equity value is higher.
2. *Can a company have negative EV?* Yes, if cash exceeds market cap plus debt, which suggests the market expects cash burn or distrusts the cash.
3. *How does a ₹100 Cr dividend paid from cash affect EV and equity value?* Equity value falls by ₹100 Cr (cash leaves), net debt rises by ₹100 Cr, EV unchanged.
4. *Why might you use EV/EBIT rather than EV/EBITDA?* For capital-intensive businesses where D&A is a real economic cost and differs across peers.
5. *What is the most important DCF input?* The terminal value assumptions and WACC; also revenue growth and margins in the explicit period.
6. *If WACC rises, what happens to DCF value and to the terminal value share?* Value falls; the TV share of EV usually falls too, because distant cash flows are discounted more heavily.
7. *How do you value a company with negative EBITDA?* EV/Revenue or gross profit multiples, DCF with a path to profitability, or the VC method.
8. *Why are P/E ratios not meaningful for some companies?* Negative or tiny earnings, large one-offs, or very different leverage and tax rates.

**Indian context.** Fairness opinions in Indian listed company schemes of arrangement and certain transactions are provided by SEBI-registered merchant bankers, alongside valuation reports by registered valuers [VERIFY: SEBI circular on schemes of arrangement and valuation report requirements].

**Common mistakes.**
- Presenting ranges so wide they're meaningless.
- Failing to explain why the DCF diverges from market methods.
- Ignoring the current share price as a reality check.

**Interview angle.**
1. *Your DCF says ₹500, the stock trades at ₹300. What do you do?* Check assumptions vs consensus and peers (implied multiples, growth, margins, WACC); if they're defensible, articulate why the market may be wrong and what would close the gap.
2. *Which valuation method do you trust most?* It depends: for a stable business with good visibility, the DCF supported by comps; for an M&A sale, precedents; for an IPO, trading comps.
3. *What's a football field?* A chart comparing valuation ranges from multiple methods to triangulate value.

**Related topics:** [10.1] Valuation overview, [12.3] Accretion/dilution, [13.2] Sell-side process.

---

## Module 10 Glossary

| Term | Definition |
|---|---|
| Control premium | Price paid above market value for control |
| DDM | Dividend discount model |
| Enterprise value | Value of operations to all capital providers |
| Exit multiple method | TV = terminal-year metric × multiple |
| FCFE | Free cash flow to equity |
| FCFF | Free cash flow to firm (unlevered FCF) |
| Football field | Chart comparing valuation ranges by method |
| Gordon growth model | Value = Next cash flow / (r − g) |
| Holding company discount | Discount applied to stakes held via a parent |
| Justified multiple | Multiple derived from fundamentals |
| LTM / NTM | Last / next twelve months |
| P/ABV | Price to adjusted book value (net of net NPAs) |
| Post-money valuation | Pre-money valuation plus new investment |
| SOTP | Sum-of-the-parts valuation |
| Terminal value | Value of cash flows beyond the forecast period |

## Module 10 Rapid-Fire Quiz

1. FCFF next year ₹100 Cr, WACC 10%, g 4%. Terminal value? **₹1,666.7 Cr**
2. Market cap ₹800 Cr, debt ₹300 Cr, cash ₹100 Cr. EV? **₹1,000 Cr**
3. Is P/E an EV or equity multiple? **Equity**
4. ₹25 Cr invested at ₹100 Cr pre-money. Investor stake? **20%**
5. ROE 18%, g 10%, Ke 14%. Justified P/B? **2.0x**
6. Why do precedents exceed trading comps? **Control premium and synergies**
7. D₁ ₹10, Ke 12%, g 7%. Value? **₹200**
8. Why add NCI in the EV bridge? **EBITDA includes 100% of subsidiaries**
9. Which multiple for a bank? **P/B or P/ABV (and P/E)**
10. 1 Cr options at ₹50 strike, price ₹200. Treasury method new shares? **0.75 Cr**

## Module 10 [VERIFY] Items

1. Companies (Registered Valuers and Valuation) Rules 2017; FEMA pricing guidelines; SEBI ICDR preferential issue pricing
2. Applicable tax regimes and holidays in DCFs
3. Long-run nominal GDP growth estimates; RBI inflation target
4. Current P/B and P/ABV multiples for Indian banks
5. Current India vs global sector multiples; Nifty forward P/E vs MSCI EM
6. SEBI SAST Regulation 8 open offer pricing
7. Finance (No. 2) Act 2024 abolition of angel tax (section 56(2)(viib))
8. Recent Indian demergers; holding company discounts; Income Tax Act section 2(19AA)
9. Cement replacement cost per tonne
10. IEV disclosure practice and APS10
11. SEBI requirements on valuation reports and fairness opinions in schemes

---

# Module 11: Financial Modelling

### [11.1] Model Architecture and Best Practices
<!-- tags: domain=financial-modelling; level=foundation; roles=IB,PE,ER,CF,Consulting,Fintech-PM; keywords=financial model structure, inputs calculations outputs, FAST standard, colour coding, model audit, flexibility, transparency, Excel best practices -->

**Definition.** A financial model is a structured spreadsheet (or code) representation of a business that turns assumptions into financial statements, valuation and decision outputs. Good architecture makes it accurate, transparent and easy to change.

**Why it matters.** Analysts in IB, PE, ER, FP&A and strategy spend much of their time building or inheriting models. Modelling tests are common in hiring. Poor structure causes errors that can cost deals and credibility.

**Core mechanics.**
**Standard structure (left to right or sheet by sheet):**
1. **Cover and contents:** purpose, version, author, key outputs
2. **Inputs / assumptions:** all hard-coded numbers in one place, with sources and units
3. **Historical data:** cleaned financials (3–5 years)
4. **Calculations:** revenue build, cost build, working capital, capex and depreciation, debt and interest, tax, equity
5. **Financial statements:** income statement, balance sheet, cash flow statement
6. **Outputs:** valuation (DCF, comps), returns (IRR, MOIC), credit metrics, charts, dashboards
7. **Checks:** balance sheet balances, cash ties, error flags

**Best practices (FAST-style principles: flexible, appropriate, structured, transparent):**
- One formula per row, consistent across columns (no changing formulas mid-row)
- Separate inputs from calculations; never hard-code numbers inside formulas
- Colour conventions: blue font for hard-coded inputs, black for formulas, green for links to other sheets
- Clear time axis (consistent columns, flags for actual vs forecast periods)
- Label units (₹ Cr, %, days) and signs consistently
- Avoid merged cells, hidden rows with logic, very long nested formulas
- Use scenario switches rather than overwriting inputs
- Keep circular references controlled (with a breaker switch) or avoid them
- Version control and a change log

**Worked example: a revenue row done badly vs well.**
- Bad: `=C10*1.15` in one cell, `=D10*1.14` in the next (hard-coded growth inside formulas, different per column)
- Good: growth rates in an inputs row (row 5: 15%, 14%, 13%...), and revenue row formula `=C10*(1+D5)` copied across every column

**Indian context.** Indian analysts often model April–March fiscal years and need to calendarise for global peers; GST, section 115BAA tax choices, MAT credits and Ind AS 116 lease effects are common India-specific modelling items.

**Common mistakes.**
- Hard-coding plugs to force the balance sheet to balance.
- Building every possible detail before the key drivers are right.
- No checks, so errors go unnoticed.

**Interview angle.**
1. *What makes a model good?* Accurate, simple enough to follow, flexible for scenarios, transparent (inputs separated, formulas consistent), and checked.
2. *How do you review someone else's model?* Start with the checks and outputs, trace key outputs back to inputs, look for hard-codes and inconsistent formulas, and test with extreme inputs.
3. *What's your approach to building a model under time pressure?* Get the core drivers and three statements right first, add detail only where it changes the answer, and keep a balance check from the start.

**Related topics:** [11.2] Revenue and cost drivers, [11.3] Three-statement build, [11.6] Model checks.

---

### [11.2] Forecasting Revenue and Costs with Drivers
<!-- tags: domain=financial-modelling; level=intermediate; roles=IB,ER,CF,Consulting,Fintech-PM; keywords=revenue build, top-down vs bottom-up, volume times price, cohort model, cost drivers, operating leverage, forecast assumptions, consensus -->

**Definition.** Driver-based forecasting builds revenue and costs from operational drivers (volume, price, users, conversion, capacity) rather than applying growth rates to totals.

**Why it matters.** Forecasts are only as credible as their drivers. Interviewers and investment committees probe "what has to be true" for the numbers to work; driver-based builds make that explicit.

**Core mechanics.**
**Revenue approaches:**

| Approach | Formula | Typical use |
|---|---|---|
| Top-down | Market size × Market share | New markets, strategy cases |
| Bottom-up volume × price | Units × Price per unit (by product, region) | Manufacturing, consumer goods |
| Capacity-based | Capacity × Utilisation × Price | Cement, steel, power, hotels |
| Customer / cohort | New customers + retained cohorts × ARPU | SaaS, subscriptions, consumer apps |
| Transaction-based | Users × Frequency × Ticket size × Take rate | Payments, marketplaces |
| Store-based | Stores × Revenue per store (new vs mature, SSSG) | Retail, QSR |
| Loan book | Average AUM × Yield | Lending, NBFCs |

**Cost approaches:**
- Variable costs as % of revenue or per unit (COGS, delivery, payment processing)
- Semi-fixed costs stepping with capacity (stores, warehouses, headcount by team)
- Fixed costs growing with inflation and strategic investments
- Headcount build: heads × cost per head, by function
- Marketing: CAC × new customers, or % of revenue

**Sanity checks:** compare implied market share, margins and growth with history, peers and consensus; check that capex and working capital support the volume growth.

**Worked example: cohort revenue model for a subscription app.** New subscribers: 10,000 in month 1 and each month after. Retention: 70% after month 1, 55% after month 2, 50% after month 3 and flat after. ARPU ₹200 a month.

| Month | Cohort 1 | Cohort 2 | Cohort 3 | Cohort 4 | Active subs | Revenue (₹ lakh) |
|---|---|---|---|---|---|---|
| 1 | 10,000 | | | | 10,000 | 20.0 |
| 2 | 7,000 | 10,000 | | | 17,000 | 34.0 |
| 3 | 5,500 | 7,000 | 10,000 | | 22,500 | 45.0 |
| 4 | 5,000 | 5,500 | 7,000 | 10,000 | 27,500 | 55.0 |

Growth slows as early churn compounds; improving month-1 retention from 70% to 80% raises month-4 active subscribers to 28,500 (+1,000) and lifts every future month.

**Indian context.** For Indian consumer businesses, model festive-season seasonality (Q3 of the fiscal year for many categories) and rural vs urban demand separately. For lending fintechs, build disbursement → AUM (with tenure and run-off) → interest income, and link credit costs to vintage-wise delinquency curves.

**Common mistakes.**
- Revenue growth with no matching growth in capacity, headcount or working capital.
- Linear extrapolation of early hyper-growth.
- Ignoring seasonality in quarterly models.

**Interview angle.**
1. *How would you forecast revenue for a quick-commerce company?* Number of dark stores × orders per store per day × AOV × days, with ramp-up curves for new stores and city-wise maturity.
2. *Top-down or bottom-up?* Both: bottom-up for credibility and operational links, top-down to sanity-check implied market share.
3. *How do you forecast costs for a fast-growing startup?* Separate variable unit costs (which should fall with scale) from fixed costs (which step up), and build headcount plans by function.

**Related topics:** [9.1] FP&A, [9.2] Unit economics, [11.3] Three-statement build.

---

### [11.3] Building an Integrated Three-Statement Model
<!-- tags: domain=financial-modelling; level=intermediate; roles=IB,PE,ER,CF; keywords=three statement model, integrated model, balance sheet balancing, cash as plug, retained earnings link, PP&E schedule, working capital schedule, model integration -->

**Definition.** An integrated three-statement model links the income statement, balance sheet and cash flow statement so that every forecast assumption flows consistently through all three, and the balance sheet balances without plugs.

**Why it matters.** It is the foundation for DCF, LBO, merger and credit models, and a standard modelling test for IB and PE roles.

**Core mechanics: build order.**
1. **Historical statements:** input and clean 3 years; compute historical ratios (growth, margins, days, capex %).
2. **Assumptions:** revenue drivers, margins, working capital days, capex and D&A, tax rate, dividends, debt terms.
3. **Income statement to EBIT:** revenue, COGS, opex, D&A (from the PPE schedule).
4. **Supporting schedules:**
   - Working capital: receivables = revenue × DSO / 365; inventory = COGS × DIO / 365; payables = COGS × DPO / 365
   - PPE: opening + capex − depreciation = closing
   - Debt: opening + drawdowns − repayments = closing; interest
   - Equity: opening + net income − dividends + issuance − buybacks = closing
5. **Income statement below EBIT:** interest (from the debt schedule), tax, net income.
6. **Cash flow statement:** net income + D&A − ΔNWC (from the WC schedule) → CFO; − capex → CFI; ± debt and equity flows − dividends → CFF; net change in cash.
7. **Balance sheet:** cash = prior cash + net change in cash; all other lines from schedules.
8. **Check:** Total assets − (Liabilities + Equity) = 0 for every period.

- Cash is the result of the cash flow statement, not a plug. If cash goes negative, add a revolving credit facility (revolver) that draws automatically.

**Worked example: one forecast year (₹ Cr).**
Assumptions: revenue 1,100; EBITDA margin 18%; D&A ₹44 Cr; interest ₹27 Cr; tax 25%; dividends ₹20 Cr; capex ₹70 Cr; NWC increase ₹15 Cr; debt repayment ₹20 Cr; opening cash ₹50 Cr.

- EBITDA = 198 → EBIT = 154 → PBT = 127 → tax 31.75 → **net income 95.25**
- CFO = 95.25 + 44 − 15 = **124.25**
- CFI = **−70**
- CFF = −20 (debt) − 20 (dividends) = **−40**
- Net change in cash = **+14.25** → closing cash = **64.25**
- Balance sheet changes:
  - Assets: cash +14.25, PPE +26 (70 − 44), NWC assets net of liabilities +15 → total net assets **+55.25**
  - Liabilities and equity: debt −20; retained earnings +75.25 (95.25 − 20) → net **+55.25** ✓ balances

**Indian context.** Indian models must handle Schedule III line items (e.g., other financial assets and liabilities), GST receivables (input tax credit) in working capital, and the choice of tax regime. Many Indian companies disclose half-yearly balance sheets only, so quarterly models interpolate balance sheet items.

**Common mistakes.**
- Using cash as a plug to force balance (hides errors).
- Sign errors on working capital changes.
- Forgetting to link dividends to retained earnings or new debt to the cash flow statement.

**Interview angle.**
1. *Your balance sheet doesn't balance. How do you debug it?* Check the difference across periods (when it first appears), confirm cash on the balance sheet equals cash flow ending cash, check each balance sheet line's change against the cash flow statement, and look for sign errors.
2. *What's the role of the revolver?* It funds cash shortfalls automatically so cash never goes below a minimum, and repays when cash is available.
3. *Why model working capital with days rather than growth rates?* Days link balances to the activity that drives them and make efficiency assumptions explicit.

**Related topics:** [3.4] Statement linkages, [11.4] Debt schedules, [11.6] Model checks.

---

### [11.4] Debt Schedules, Interest Circularity and Cash Sweeps
<!-- tags: domain=financial-modelling; level=advanced; roles=IB,PE,CF; keywords=debt schedule, revolver, mandatory amortisation, cash sweep, interest on average balance, circular reference, iterative calculation, circuit breaker -->

**Definition.** A debt schedule tracks each tranche of borrowing (opening balance, drawdowns, repayments, interest, closing balance). When interest is computed on average balances and repayments depend on cash after interest, the model becomes circular.

**Why it matters.** Debt schedules drive LBO, project finance and credit models; mishandled circularity crashes models or hides errors. Cash sweep mechanics are a standard PE modelling test.

**Core mechanics.**
- **Per tranche:** Closing = Opening + Drawdowns − Mandatory amortisation − Optional prepayments (sweep)
- **Interest:** on opening balance (no circularity) or average balance (more accurate; creates circularity because the closing balance depends on cash after interest)
- **Cash available for debt repayment** = Opening cash + FCF (after interest and taxes) − Minimum cash − Mandatory repayments
- **Cash sweep:** a % of excess cash prepays debt in order of seniority/priority (e.g., term loan B before term loan A, as per the agreement)
- **Revolver:** draws when cash available is negative; repaid first when cash is positive
- **Handling circularity:** enable iterative calculation in Excel with a circuit-breaker switch (a cell that sets interest to zero to break loops if errors propagate), or use opening balances, or solve algebraically.

**Worked example.** Opening term loan ₹300 Cr; interest 9% on the average balance; mandatory repayment ₹40 Cr; cash flow before interest and debt repayment ₹100 Cr (tax effects ignored for simplicity); 50% of excess cash after interest and mandatory repayment is swept to prepay the loan.

Let s = sweep amount:
- Closing debt = 300 − 40 − s
- Interest = 9% × (300 + 260 − s) / 2 = 25.2 − 0.045s
- Excess cash = 100 − Interest − 40 = 34.8 + 0.045s
- Sweep: s = 50% × (34.8 + 0.045s) → s = 17.4 / 0.9775 = **₹17.80 Cr**
- Interest = **₹24.40 Cr**; closing debt = 300 − 40 − 17.80 = **₹242.20 Cr**
- Check: average balance (300 + 242.2) / 2 = 271.1; × 9% = 24.40 ✓

Excel would reach the same answer through iteration; the algebra shows why the circularity converges (each round changes interest by a small fraction).

**Indian context.** Indian term loans often have structured repayment schedules (ballooning in later years) and are priced at MCLR or external benchmark plus spread, so rate resets need modelling [VERIFY: RBI external benchmark and MCLR framework]. Project finance models for infrastructure use DSCR-sculpted repayments and debt service reserve accounts (DSRA).

**Common mistakes.**
- Leaving circularity on without a breaker; a single error turns everything into #REF!.
- Sweeping cash below the minimum cash requirement.
- Applying the sweep to the wrong tranche order.

**Interview angle.**
1. *Why does interest create a circular reference?* Interest depends on the average debt balance, the balance depends on repayments, and repayments depend on cash after interest.
2. *How do you handle circularity?* Enable iterative calculation with a circuit breaker, or calculate interest on the opening balance, or solve algebraically.
3. *What is a cash sweep and why do lenders want it?* A requirement to use excess cash to prepay debt, which reduces lenders' risk faster and speeds deleveraging.

**Related topics:** [11.3] Three-statement model, [14.2] LBO mechanics, [16.2] Bond pricing.

---

### [11.5] Scenarios, Sensitivities and Data Tables
<!-- tags: domain=financial-modelling; level=intermediate; roles=IB,PE,CF,Consulting,Fintech-PM; keywords=scenario manager, CHOOSE function, sensitivity table, data table, tornado chart, goal seek, break-even analysis, what-if analysis -->

**Definition.** Scenario and sensitivity tools let a model show how outputs change under different assumptions without rebuilding it.

**Why it matters.** Decision-makers care less about a single forecast than about the range of outcomes and the assumptions that matter most. Sensitivity tables are expected in every valuation and LBO output.

**Core mechanics.**
- **Scenario switch:** a single cell (1 = base, 2 = upside, 3 = downside) drives live assumptions through `CHOOSE(switch, base, upside, downside)` or `INDEX` on a scenario block.
- **One-way and two-way data tables (Excel "What-If Analysis"):** recalculate an output across a grid of input values (e.g., share price across WACC and terminal growth).
- **Tornado chart:** ranks inputs by their effect on the output when each moves across a defined range.
- **Goal seek:** finds the input value that achieves a target output (e.g., the revenue that makes NPV zero).
- **Break-even analysis:** the value of one driver at which a target metric (NPV, EBITDA, DSCR) hits a threshold.
- Keep data tables on the same sheet as their inputs (Excel limitation) and consider manual calculation mode for large models, since data tables recalculate often.

**Worked example: scenario switch.**

| Assumption | Base | Upside | Downside | Live (switch = 3) |
|---|---|---|---|---|
| Revenue growth | 12% | 18% | 5% | 5% |
| EBITDA margin | 18% | 20% | 15% | 15% |
| Capex % of revenue | 6% | 7% | 5% | 5% |

Live cell formula: `=CHOOSE($B$1, C5, D5, E5)`, where B1 holds the switch.

Tornado (from the plant project in [8.3], base NPV ₹20.3 Cr):

| Input (low / high) | NPV low | NPV high | Swing |
|---|---|---|---|
| Revenue growth (0% / 20%) | −0.1 | 44.8 | 44.9 |
| Variable cost % (55% / 45%) | 7.4 | 33.3 | 25.8 |
| Year-1 revenue (₹72 Cr / ₹88 Cr) | 7.8 | 32.8 | 25.0 |
| Fixed cost (₹12 Cr / ₹8 Cr) | 14.9 | 25.7 | 10.8 |

The tornado ranks revenue growth and variable cost as the drivers deserving the most diligence.

**Indian context.** Indian lenders' credit appraisal notes typically include sensitivity of DSCR to price, volume and interest rate changes; rating agencies publish stress-case assumptions in rating rationales [VERIFY: rating agency rationale formats].

**Common mistakes.**
- Sensitising variables that are tightly linked as if they were independent.
- Scenarios that are just base ±10% everywhere, with no story.
- Data tables referencing inputs on another sheet (they won't work in Excel).

**Interview angle.**
1. *How would you show the range of outcomes for this project?* A scenario switch with consistent bear/base/bull cases, two-way sensitivity tables for the top drivers, and a tornado chart.
2. *What's goal seek useful for?* Finding break-even points, such as the price at which IRR equals the hurdle rate.
3. *What's the difference between a sensitivity and a scenario?* Sensitivity flexes one or two inputs; a scenario changes many inputs together around a narrative.

**Related topics:** [8.3] Uncertainty in capital budgeting, [10.3] TV sensitivity, [11.6] Model checks.

---

### [11.6] Model Integrity: Checks, Error-Proofing and Essential Excel Functions
<!-- tags: domain=financial-modelling; level=foundation; roles=IB,PE,ER,CF,Consulting,Fintech-PM; keywords=model checks, error checks, balance check, XLOOKUP, INDEX MATCH, SUMIFS, XNPV, XIRR, PMT, IFERROR, OFFSET, Excel shortcuts, model audit -->

**Definition.** Model integrity covers the checks and practices that catch errors, plus the core spreadsheet functions that make models robust and efficient.

**Why it matters.** Studies of spreadsheets have repeatedly found errors in a large share of operational models; in finance, a small error can mean a mispriced deal. Interviewers test Excel fluency through modelling tests and quick function questions.

**Core mechanics.**
**Checks to build in:**
- Balance sheet check (assets − liabilities − equity = 0) every period
- Cash check (balance sheet cash = cash flow statement closing cash)
- Sources = uses check in transaction models
- Debt never negative; revolver within limit; minimum cash respected
- Sub-totals equal the sum of components; percentages sum to 100%
- A master check cell that aggregates all checks and shows "OK" or "ERROR" on the cover sheet

**Error-proofing practices:**
- Trace precedents and dependents to audit formulas
- Stress test with extreme values (zero revenue, very high growth)
- Avoid `IFERROR` wrappers that hide real errors
- Keep a change log; peer review before sharing

**Essential functions:**

| Function | Use |
|---|---|
| `SUMIFS`, `COUNTIFS`, `AVERAGEIFS` | Conditional aggregation |
| `XLOOKUP`, `INDEX`/`MATCH` | Robust lookups (avoid `VLOOKUP` column-number fragility) |
| `CHOOSE` | Scenario switches |
| `EOMONTH`, `EDATE`, `YEARFRAC` | Date logic |
| `NPV`, `XNPV` | Present values (`XNPV` with exact dates) |
| `IRR`, `XIRR`, `MIRR` | Returns (`XIRR` for irregular dates) |
| `PMT`, `IPMT`, `PPMT` | Loan payments and splits |
| `MIN`, `MAX` | Caps and floors (e.g., sweep limited to available cash) |
| `IF`, `AND`, `OR` | Logic and flags |
| `SUMPRODUCT` | Weighted sums |
| `OFFSET`, `INDIRECT` | Dynamic ranges (use sparingly; volatile) |

**Worked example.** Common pitfalls in Excel's `NPV` function: `=NPV(rate, values)` assumes the first value occurs at the end of period 1.
- For the project in [1.4] with −100 at t = 0 and 30, 35, 40, 45 in years 1–4: correct formula `=NPV(12%, C2:F2) + B2` = 111.76 − 100 = **11.76**
- Incorrect `=NPV(12%, B2:F2)` discounts the t = 0 outflow by a year and gives **10.50**, understating value by ₹1.26 Cr.

Loan EMI with `PMT`: `=PMT(9%/12, 240, -2000000)` returns **₹17,995**, matching [1.3].

**Indian context.** Indian dates (DD-MM-YYYY formats) and fiscal years ending 31 March require care with date functions and calendarisation. Lakh/crore number formats can be set with custom formats to avoid unit errors.

**Common mistakes.**
- Misusing `NPV` by including the t = 0 cash flow.
- `VLOOKUP` breaking when columns are inserted.
- Hidden `IFERROR` masking broken links.

**Interview angle.**
1. *What's wrong with `=NPV(r, A1:A6)` when A1 is today's investment?* It discounts the initial investment by one period; take it out of the range and add it separately.
2. *`XIRR` vs `IRR`?* `XIRR` uses actual dates for irregular cash flows; `IRR` assumes equal periods.
3. *What checks would you put in any model?* Balance check, cash tie-out, sources = uses, sign and range checks, and a summary error flag.

**Related topics:** [11.1] Model architecture, [11.3] Three-statement build, [1.4] NPV.

---

## Module 11 Glossary

| Term | Definition |
|---|---|
| Balance check | Assets minus liabilities minus equity; must be zero |
| Cash sweep | Mandatory prepayment of debt from excess cash |
| Circuit breaker | Switch that breaks circular calculations |
| Circular reference | Formula that depends on its own result |
| Data table | Excel tool recalculating an output over input grids |
| Driver-based model | Model built from operational drivers |
| FAST standard | Modelling standard: flexible, appropriate, structured, transparent |
| Goal seek | Finds the input that achieves a target output |
| Hard-code | A typed number rather than a formula |
| Revolver | Revolving credit facility that funds shortfalls |
| Scenario switch | Cell selecting the active assumption set |
| Tornado chart | Chart ranking inputs by impact on output |
| `XIRR` | IRR with exact dates |
| `XNPV` | NPV with exact dates |
| Cohort model | Revenue built from customer groups by start date |

## Module 11 Rapid-Fire Quiz

1. Should cash be used as a plug to balance the balance sheet? **No**
2. Colour convention for hard-coded inputs? **Blue font**
3. Function for IRR with irregular dates? **`XIRR`**
4. What creates interest circularity? **Interest on average balances that depend on repayments funded after interest**
5. Receivables formula from DSO? **Revenue × DSO / 365**
6. `NPV` function: is the first value treated as t = 0 or t = 1? **t = 1**
7. Why prefer `INDEX`/`MATCH` or `XLOOKUP` over `VLOOKUP`? **Robust to column insertion; flexible lookups**
8. A two-way data table typically sensitises valuation to which pair? **WACC and terminal growth (or exit multiple)**
9. Cash available for sweep excludes what? **Minimum cash and mandatory repayments**
10. First thing to check when a model doesn't balance? **The first period where the imbalance appears, and whether cash ties to the cash flow statement**

## Module 11 [VERIFY] Items

1. RBI external benchmark and MCLR framework
2. Rating agency rationale formats for stress cases

---

# Module 12: Mergers and Acquisitions

### [12.1] M&A Rationale, Deal Types and Value Creation Logic
<!-- tags: domain=mergers-acquisitions; level=foundation; roles=IB,PE,Consulting,CF,Fintech-PM; keywords=M&A rationale, horizontal merger, vertical merger, conglomerate, acqui-hire, synergies, strategic vs financial buyer, value creation, merger vs acquisition -->

**Definition.** M&A covers transactions that combine companies or transfer control of businesses: mergers (two entities combine into one), acquisitions (one buys control of another), and related moves such as asset purchases, demergers and joint ventures.

**Why it matters.** M&A is the core of investment banking advisory, corporate development and many consulting projects. Candidates must explain why companies buy, when deals create value, and how to evaluate a proposed deal.

**Core mechanics.**
**Deal types:**

| Type | Description | Example rationale |
|---|---|---|
| Horizontal | Same industry, same stage | Scale, market share, cost synergies |
| Vertical | Different stages of the value chain | Supply security, margin capture |
| Concentric / adjacent | Related products or customers | Cross-selling, capability extension |
| Conglomerate | Unrelated businesses | Diversification (often value-destroying) |
| Acqui-hire | Buying mainly for the team | Talent and capability |
| Asset purchase / slump sale | Buying a business undertaking or specific assets | Avoid legacy liabilities |

**Strategic rationales:** growth (faster than organic), scale economies, market power, capabilities and technology, geographic expansion, customer access, vertical integration, tax and financial benefits, defensive moves.

**Strategic vs financial buyers:** strategics can pay for synergies and typically hold indefinitely; financial sponsors (PE) rely on operational improvement, leverage and multiple expansion, and plan to exit.

**Value creation test:** an acquisition creates value for the acquirer's shareholders only if:
- Value of synergies > Premium paid + Transaction and integration costs
- Equivalently: NPV to acquirer = (Standalone value of target + PV of synergies) − Price paid − Costs > 0

**Worked example.** Target standalone value ₹1,000 Cr; acquirer pays ₹1,300 Cr (30% premium); PV of synergies, net of integration costs, estimated at ₹434 Cr (see [12.2]); advisory and transaction fees ₹10 Cr.
- NPV to acquirer = 1,000 + 434 − 1,300 − 10 = **+₹124 Cr**
- Target shareholders capture ₹300 Cr of the ₹434 Cr synergy value through the premium; acquirer keeps the rest. In competitive auctions, sellers often capture most or all synergy value (the "winner's curse").

**Indian context.** Indian M&A has featured consolidation in cement, banking (government-led PSU bank mergers in 2019–2020), telecom, and new-economy acquisitions (fintechs buying licences or capabilities). Large mergers need CCI approval, and listed-company deals trigger SEBI SAST and scheme approvals [VERIFY: CCI combination thresholds; SEBI SAST; recent Indian deal examples].

**Common mistakes.**
- Treating revenue growth from an acquisition as value creation regardless of price.
- Overestimating revenue synergies and underestimating integration costs.
- Ignoring the "do nothing" alternative and competitor responses.

**Interview angle.**
1. *Why do companies acquire?* To grow faster, gain scale and synergies, acquire capabilities or technology, enter markets, or defend position, when buying is faster or cheaper than building.
2. *Why do most acquisitions fail to create value for the acquirer?* Overpayment (premium exceeds synergies), poor integration, cultural clashes, and overestimated synergies.
3. *Who usually wins in M&A?* Target shareholders, on average, through the premium; acquirer returns are mixed and often negative for large, competitive deals.

**Related topics:** [12.2] Synergies, [12.7] Post-merger integration, [9.5] Build vs buy.

---

### [12.2] Valuing Synergies
<!-- tags: domain=mergers-acquisitions; level=intermediate; roles=IB,PE,Consulting,CF; keywords=cost synergies, revenue synergies, financial synergies, integration costs, synergy phasing, synergy NPV, maximum premium, dis-synergies -->

**Definition.** Synergies are the additional value created by combining two businesses beyond the sum of their standalone values: cost savings, revenue gains, and financial benefits, net of integration costs and dis-synergies.

**Why it matters.** Synergies justify the premium. Boards, investors and interviewers test whether synergy estimates are credible, how they're phased, and how they're valued.

**Core mechanics.**
**Types:**
- **Cost synergies** (more reliable): procurement scale, overlapping overheads (head office, IT, finance), plant and branch rationalisation, distribution, marketing
- **Revenue synergies** (less reliable): cross-selling, pricing power, combined offerings, new channels or geographies
- **Financial synergies:** tax benefits (using losses, subject to rules), lower cost of capital, better debt capacity
- **Dis-synergies:** customer losses, talent attrition, regulatory remedies (divestitures)

**Valuation steps:**
1. Estimate run-rate synergies (annual, pre-tax)
2. Phase them (e.g., 30% in year 1, 70% in year 2, 100% from year 3)
3. Subtract one-time integration costs (often 1–2x annual run-rate cost synergies)
4. Tax-effect the flows
5. Discount at an appropriate rate (higher for revenue synergies) and add a terminal value
6. Compare the PV of synergies with the premium paid: maximum justifiable premium = PV of synergies (net)

**Worked example.** Run-rate cost synergies ₹50 Cr a year (pre-tax), phased 30%/70%/100%; one-time integration cost ₹60 Cr in year 1; tax 25%; discount rate 10%; synergies grow 3% a year after year 3.

| Year | 1 | 2 | 3 |
|---|---|---|---|
| Synergies realised | 15.0 | 35.0 | 50.0 |
| Integration cost | (60.0) | — | — |
| Pre-tax net | (45.0) | 35.0 | 50.0 |
| After tax (× 0.75) | (33.75) | 26.25 | 37.50 |

- PV of years 1–3 = −33.75/1.10 + 26.25/1.21 + 37.50/1.331 = **₹19.19 Cr**
- Terminal value at year 3 = 37.50 × 1.03 / (0.10 − 0.03) = ₹551.79 Cr; PV = **₹414.56 Cr**
- **Total PV of synergies ≈ ₹434 Cr**, the maximum premium the acquirer could pay before value is destroyed (excluding fees).

**Indian context.** Indian bank and NBFC mergers emphasise branch rationalisation, lower funding costs and technology consolidation; telecom consolidation emphasised spectrum and network synergies. Carried-forward losses can be preserved in amalgamations only if section 72A conditions are met [VERIFY: Income Tax Act section 72A conditions].

**Common mistakes.**
- Counting revenue synergies at the same confidence as cost synergies.
- Ignoring integration costs and timing.
- Paying away 100% of synergies in the premium (no value left for the acquirer's shareholders).

**Interview angle.**
1. *Which synergies are more credible, cost or revenue? Why?* Cost synergies, because they're within management's control (closing duplicate functions); revenue synergies depend on customers and competitors.
2. *How do you value synergies?* Phase run-rate synergies, subtract integration costs, tax-effect, discount at a risk-appropriate rate, add terminal value.
3. *What's the maximum premium an acquirer should pay?* The PV of net synergies (after integration costs); paying more transfers value from acquirer to target shareholders.

**Related topics:** [12.1] M&A rationale, [12.3] Accretion/dilution, [10.7] Precedent transactions.

---

### [12.3] Accretion/Dilution Analysis
<!-- tags: domain=mergers-acquisitions; level=intermediate; roles=IB,PE,ER,CF; keywords=accretion dilution, pro forma EPS, stock deal, cash deal, debt-funded acquisition, P/E rule, cost of acquisition, breakeven synergies, purchase price allocation -->

**Definition.** Accretion/dilution analysis measures how an acquisition changes the acquirer's earnings per share (EPS). A deal is accretive if pro forma EPS rises and dilutive if it falls.

**Why it matters.** It is the most common merger model in IB interviews and a key board-level metric, even though EPS impact is not the same as value creation.

**Core mechanics.**
- Pro forma net income = Acquirer NI + Target NI + After-tax synergies − After-tax interest on new debt − After-tax forgone interest on cash used − After-tax amortisation of new intangibles − Other adjustments
- Pro forma shares = Acquirer shares + New shares issued
- Pro forma EPS = Pro forma NI / Pro forma shares
- **Quick rules (before synergies and amortisation):**
  - All-stock deal: accretive if acquirer's P/E > P/E paid for target
  - Debt-funded deal: accretive if target's earnings yield at the offer price (1/P/E paid) > acquirer's after-tax cost of debt
  - Cash-funded deal: accretive if target earnings yield > after-tax interest earned on the cash
- Cheapest "currency": compare after-tax cost of debt, forgone yield on cash, and the acquirer's earnings yield (cost of stock).

**Worked example 1: accretive deal.** Acquirer: PAT ₹500 Cr, 100 Cr shares, price ₹100 (EPS ₹5.00, P/E 20x). Target: PAT ₹100 Cr, 20 Cr shares, price ₹40 (P/E 8x). Offer ₹50 per share (25% premium) → purchase equity value ₹1,000 Cr (P/E paid 10x). Tax 25%.

| Funding | Calculation | Pro forma EPS | Accretion |
|---|---|---|---|
| All stock (issue 10 Cr shares at ₹100) | 600 / 110 | ₹5.45 | +9.1% |
| All debt at 9% | (600 − 1,000 × 9% × 0.75) / 100 = 532.5 / 100 | ₹5.33 | +6.5% |
| Cash earning 6% | (600 − 1,000 × 6% × 0.75) / 100 = 555 / 100 | ₹5.55 | +11.0% |

Target ownership in the stock deal = 10 / 110 = **9.1%** of the combined company.

**Worked example 2: dilutive deal.** Acquirer: PAT ₹500 Cr, 100 Cr shares at ₹60 (P/E 12x). It buys a target with PAT ₹100 Cr for ₹2,000 Cr (P/E 20x) in stock.
- New shares = 2,000 / 60 = 33.33 Cr
- Pro forma EPS = 600 / 133.33 = **₹4.50**, versus ₹5.00 standalone → **10% dilutive**
- Break-even synergies: needed NI = 5.00 × 133.33 = ₹666.67 Cr → extra ₹66.67 Cr after tax → **₹88.9 Cr pre-tax**

**Indian context.** Indian listed acquirers often fund deals with a mix of internal accruals, debt and QIPs; share-swap mergers through NCLT schemes use swap ratios based on registered valuers' reports [VERIFY: SEBI requirements on valuation reports for share swap ratios].

**Common mistakes.**
- Equating EPS accretion with value creation (a high-P/E acquirer can buy almost anything accretively in stock).
- Forgetting amortisation of acquired intangibles and the financing cost of cash.
- Ignoring transaction fees and integration costs.

**Interview angle.**
1. *Is an all-stock deal accretive or dilutive?* Compare P/Es: if the acquirer's P/E exceeds the P/E paid for the target, it's accretive (before synergies and adjustments).
2. *What's the cheapest way to fund an acquisition?* Usually cash or debt (low after-tax cost) unless the acquirer's stock is highly valued (high P/E means a low cost of stock).
3. *Can an accretive deal destroy value?* Yes. EPS can rise because of cheap debt or a high P/E currency even if the price exceeds the target's value plus synergies.

**Related topics:** [12.2] Synergies, [8.7] EBIT-EPS analysis, [2.12] EPS.

---

### [12.4] Deal Structuring: Consideration, Form of Transaction and Key Terms
<!-- tags: domain=mergers-acquisitions; level=intermediate; roles=IB,PE,CF; keywords=cash vs stock consideration, share purchase, asset purchase, slump sale, scheme of arrangement, merger, demerger, earn-out, escrow, locked box, completion accounts, representations and warranties -->

**Definition.** Deal structuring decides how a transaction is executed: what is bought (shares or assets), what is paid (cash, stock or mixed, upfront or deferred), the legal route, and the risk-allocation terms in the agreements.

**Why it matters.** Structure determines tax, liability transfer, approvals, timeline and who bears risk. Two deals at the same headline price can have very different economics.

**Core mechanics.**
**Consideration:**

| Form | Who bears post-deal risk | Considerations |
|---|---|---|
| Cash | Acquirer (seller exits fully) | Certainty for seller; requires funding |
| Stock | Shared (seller becomes shareholder) | Preserves cash; dilution; signals acquirer's view of its own valuation |
| Mixed | Shared | Balances both |
| Earn-out | Seller shares risk of future performance | Bridges valuation gaps; dispute risk |
| Deferred / escrow / holdback | Protects acquirer against claims | Ties up seller proceeds |

**What is acquired:**
- **Share purchase:** buy the shares; all assets and liabilities (known and unknown) come along; simpler licences and contracts transfer
- **Asset purchase / business transfer:** pick assets and liabilities; contracts and licences may need consent; can leave legacy liabilities behind
- **Slump sale (India):** transfer of an undertaking for a lump-sum consideration without values assigned to individual assets, with specific tax treatment
- **Merger / amalgamation / demerger (India):** through an NCLT-approved scheme of arrangement

**Price mechanisms:**
- **Locked box:** price fixed at a historical balance sheet date; seller guarantees no value leakage after it (common in competitive sales)
- **Completion accounts:** price adjusted after closing for actual net debt and working capital vs a target ("peg")

**Key agreement terms:** representations and warranties, indemnities, conditions precedent (approvals), material adverse change (MAC) clauses, non-compete, break fees, warranty and indemnity (W&I) insurance.

**Worked example: completion accounts adjustment.** Headline enterprise value ₹500 Cr; agreed working capital peg ₹60 Cr. At closing, net debt is ₹80 Cr and working capital is ₹52 Cr.
- Equity price = 500 − 80 + (52 − 60) = **₹412 Cr**
- The ₹8 Cr working capital shortfall reduces the price because the buyer must fund it.

**Indian context.** Mergers and demergers of companies go through sections 230–232 of the Companies Act (NCLT), with fast-track routes for small companies and holding-wholly owned subsidiary mergers (section 233) [VERIFY: Companies Act section 233 fast-track merger scope and timelines]. Slump sales are taxed under section 50B [VERIFY: Income Tax Act section 50B]. Cross-border deals must comply with FEMA pricing guidelines and sectoral caps [VERIFY: FDI policy sectoral caps and pricing].

**Common mistakes.**
- Ignoring the working capital peg (a common source of post-deal disputes).
- Choosing a share deal without enough diligence on unknown liabilities.
- Badly defined earn-out metrics that management can influence.

**Interview angle.**
1. *Why would a seller prefer cash and a buyer prefer stock?* Cash gives the seller certainty; stock lets the buyer share risk and preserve cash, especially if the buyer's shares are highly valued.
2. *Share deal vs asset deal?* Share deals transfer everything (simpler continuity, more liability risk); asset deals let the buyer pick assets and leave liabilities, but need consents and may be less tax-efficient for the seller.
3. *What is a locked box?* A price mechanism fixing value at a past balance sheet date with protections against leakage, giving price certainty and speed.

**Related topics:** [12.5] Due diligence, [12.6] Indian regulatory framework, [2.7] Purchase accounting.

---

### [12.5] Due Diligence
<!-- tags: domain=mergers-acquisitions; level=intermediate; roles=IB,PE,Audit,Consulting,CF; keywords=due diligence, financial due diligence, commercial due diligence, legal due diligence, tax due diligence, quality of earnings, red flags, data room, ESG diligence, tech diligence -->

**Definition.** Due diligence is the investigation a buyer (or investor or lender) conducts to verify the target's information, identify risks and value, and inform price and terms.

**Why it matters.** It protects buyers from overpaying or inheriting problems. Big 4 transaction services, consulting commercial diligence and PE deal teams are major MBA recruiters for this work.

**Core mechanics.**

| Workstream | Key questions | Typical outputs |
|---|---|---|
| Financial (FDD) | Are earnings real and sustainable? What's normalised EBITDA, net debt and NWC? | QoE report, net debt and NWC analysis |
| Commercial (CDD) | Is the market attractive? Is the business plan achievable? | Market model, customer interviews, competitive analysis |
| Legal | Are there litigation, contract, licence or ownership issues? | Legal DD report, risk list for SPA |
| Tax | Are there tax exposures? What's the optimal structure? | Tax risk quantification, structuring advice |
| Operational | Can operations scale? Where are cost savings? | Synergy and improvement plan |
| HR | Key people, compensation, culture, labour issues | Retention plans |
| Technology / cyber | Architecture, tech debt, security, data privacy | Tech risk assessment |
| ESG / environmental | Environmental liabilities, compliance, sustainability risks | ESG red flags |
| Regulatory | Licences, compliance history (e.g., RBI, SEBI for financial firms) | Regulatory risk memo |

- **Process:** virtual data room (VDR), management presentations, Q&A, site visits, expert calls, red-flag reports first, then full reports.
- **Findings feed into:** price (EV adjustments, debt-like items), structure (escrow, indemnities, specific conditions), and go/no-go.

**Worked example: debt-like items found in FDD (₹ Cr).** The seller presents net debt of ₹100 Cr. FDD finds:
- Unpaid statutory dues (overdue GST and PF): 12
- Deferred consideration for a past acquisition: 20
- Customer advances beyond normal levels: 8
- Gratuity liability not funded: 10
- Adjusted net debt = 100 + 12 + 20 + 8 + 10 = **₹150 Cr**, reducing equity value by ₹50 Cr at the same enterprise value.

**Indian context.** Common Indian diligence issues include related-party transactions, title defects in land, pending tax litigation, licence compliance (especially in financial services), labour law compliance and promoter-group arrangements. For regulated fintech targets, RBI approval may be required for change in control or management of NBFCs and payment entities [VERIFY: RBI prior approval requirements for change in control of NBFCs and PA/PSOs].

**Common mistakes.**
- Treating due diligence as a box-ticking exercise rather than testing the investment thesis.
- Missing debt-like items, inflating equity value.
- Not translating findings into price, structure or contract protections.

**Interview angle.**
1. *What does financial due diligence focus on?* Quality of earnings (normalised EBITDA), net debt and debt-like items, working capital normalisation, cash conversion and accounting policies.
2. *What would you look for in commercial due diligence of a fintech?* Market size and growth, regulatory risk, customer economics (CAC, retention, take rates), competition, distribution moats and technology scalability.
3. *A diligence finding reveals a ₹30 Cr tax exposure. How do you handle it?* Quantify probability and timing; negotiate a price reduction, specific indemnity, or escrow; consider W&I insurance.

**Related topics:** [4.9] Quality of earnings, [12.4] Deal structuring, [14.3] PE value creation.

---

### [12.6] The Indian M&A Regulatory Framework: SEBI SAST, CCI, NCLT, FEMA and Delisting
<!-- tags: domain=mergers-acquisitions; level=advanced; roles=IB,PE,CF,Consulting; keywords=SEBI takeover code, SAST, open offer, creeping acquisition, CCI merger control, deal value threshold, NCLT scheme, FEMA, delisting regulations, reverse book building -->

**Definition.** Indian M&A is governed by multiple regulators: SEBI (listed company takeovers, delisting, schemes), CCI (competition), NCLT (court-approved schemes under the Companies Act), RBI (FEMA for cross-border deals, and sector rules for financial firms) and sector regulators.

**Why it matters.** Regulatory triggers shape timelines, pricing and structure. Indian IB and PE interviews often test the open offer rules and when CCI approval is needed.

**Core mechanics.**
**SEBI Substantial Acquisition of Shares and Takeovers (SAST) Regulations, 2011:**
- Mandatory open offer when an acquirer (with persons acting in concert) acquires **25% or more** of voting rights, or acquires control
- **Creeping acquisition:** holders between 25% and 75% (maximum non-public shareholding) can acquire up to **5% per financial year** without an open offer
- Open offer size: at least **26%** of the total shares of the target
- Offer price: the highest of prescribed parameters (e.g., highest negotiated price, volume-weighted average prices over specified periods, highest price paid in the preceding 52 weeks)
- Disclosures at 5% and each 2% change thereafter

**Competition Commission of India (CCI):**
- Combinations above asset or turnover thresholds (or the deal value threshold) need prior approval; a suspensory regime (cannot close before approval)
- Deal value threshold: transactions valued above ₹2,000 Cr where the target has substantial business operations in India
- De minimis exemption for small targets

**NCLT schemes (Companies Act sections 230–232):** mergers, demergers and capital reorganisations require board approval, SEBI and stock exchange observations (for listed companies), shareholder and creditor approvals (majority in number representing three-fourths in value), and NCLT sanction. Typical timelines run several months.

**FEMA (cross-border):** sectoral caps and approval routes, pricing guidelines (no less than fair value for inbound, no more than fair value for outbound), downstream investment rules; Press Note 3 (2020) requires government approval for investment from countries sharing a land border with India.

**Delisting (SEBI Delisting Regulations, 2021):** promoter acquires shares through reverse book building (price discovered by shareholder bids), and the offer succeeds if promoter holding reaches 90%; a fixed-price route and other changes were introduced in 2024.

**Worked example.** An acquirer buys 30% of a listed company from its promoters at ₹500 per share. The 60-day volume-weighted average market price is ₹450.
- 30% exceeds the 25% threshold → open offer for at least 26% more
- Offer price must be at least the higher of ₹500 (negotiated) and the other prescribed parameters → at least **₹500**
- If fully subscribed, the acquirer reaches 56% (30% + 26%)
- If CCI thresholds are met, completion waits for CCI approval

**Indian context.** All thresholds, pricing parameters and timelines change periodically and must be checked against current regulations [VERIFY: SEBI SAST Regulations 2011 (as amended); Competition (Amendment) Act 2023 and CCI combination regulations 2024 including deal value threshold; SEBI Delisting Regulations 2021 and 2024 amendments; FEMA NDI Rules and Press Note 3 (2020)].

**Common mistakes.**
- Forgetting that indirect acquisitions (buying a parent) can trigger open offers for listed subsidiaries.
- Assuming small deals avoid CCI (the deal value threshold catches large-value, low-turnover tech deals).
- Underestimating scheme timelines.

**Interview angle.**
1. *What triggers an open offer in India?* Acquiring 25% or more voting rights, acquiring control, or creeping above 5% a year once between 25% and 75%.
2. *Why did India introduce a deal value threshold for merger control?* To catch acquisitions of high-value digital and tech businesses with small Indian turnover or assets.
3. *How does Indian delisting differ from many markets?* Reverse book building lets public shareholders bid the price, which can make delisting expensive and uncertain (with a fixed-price option now available).

**Related topics:** [12.4] Deal structuring, [24.3] SEBI, [13.3] IPO process.

---

### [12.7] Post-Merger Integration and Why Deals Fail
<!-- tags: domain=mergers-acquisitions; level=intermediate; roles=Consulting,CF,PE,IB; keywords=post-merger integration, PMI, integration management office, Day 1 readiness, synergy tracking, culture integration, deal failure, overpayment, talent retention -->

**Definition.** Post-merger integration (PMI) is the process of combining two organisations after a deal closes to capture the intended value: synergies, capabilities and growth.

**Why it matters.** Many deals fail to create value because of execution, not strategy. Consulting firms run large PMI practices; MBA hires often staff integration management offices (IMOs).

**Core mechanics.**
**Integration approaches** (by need for strategic interdependence and organisational autonomy, after Haspeslagh & Jemison):
- Preservation (keep separate, light touch): acqui-hires, distinct brands
- Absorption (full integration): horizontal mergers with cost synergies
- Symbiosis (gradual mutual integration): capability deals
- Holding (financial ownership only)

**PMI building blocks:**
1. Integration thesis and synergy targets with owners
2. Integration management office (IMO) with workstreams (finance, HR, IT, operations, sales)
3. Day 1 readiness: legal entity, payroll, banking, communications, customer continuity
4. 100-day plan: quick wins, organisation design, key decisions
5. Synergy tracking against baseline and run-rate targets
6. Culture and people: retention of key talent, leadership selection, communication
7. Systems integration (often the longest and costliest)

**Why deals fail:**
- Overpayment and winner's curse in auctions
- Overestimated synergies, underestimated costs and time
- Culture clashes and talent flight
- Loss of focus on the core business and customers during integration
- Poor due diligence
- Strategic misfit or changed market conditions

**Worked example: synergy tracking.** Target run-rate cost synergies ₹50 Cr by year 3.

| Lever | Target (₹ Cr) | Year 1 actual | Status |
|---|---|---|---|
| Procurement | 20 | 8 | On track |
| Overlapping corporate functions | 15 | 6 | On track |
| Plant consolidation | 10 | 0 | Delayed (regulatory approval) |
| Distribution network | 5 | 1 | At risk (customer pushback) |
| **Total** | **50** | **15** | 30% realised vs 30% planned |

Year 1 is on plan in aggregate, but delays in plant consolidation risk year 2 targets; the IMO escalates for a decision.

**Indian context.** Indian bank amalgamations required integrating technology platforms, branches and staff with different pay structures and unions; integration timelines and costs were significant [VERIFY: public disclosures on PSU bank merger integration]. Family-business cultures and promoter roles add PMI complexity in Indian deals.

**Common mistakes.**
- Starting integration planning only after closing.
- Tracking synergies without baselines or clear owners.
- Ignoring revenue protection while chasing cost cuts.

**Interview angle.**
1. *What are the first things you'd do after closing?* Ensure Day 1 continuity (customers, payroll, systems), communicate clearly, appoint leaders, secure key talent, launch the 100-day plan with synergy owners.
2. *Why do mergers fail?* Overpayment, overestimated synergies, culture clash, poor integration execution, talent loss.
3. *How should a large company integrate a startup acquisition?* Usually preserve its autonomy and culture while integrating selectively (distribution, compliance), with retention incentives for founders and key engineers.

**Related topics:** [12.2] Synergies, [12.1] M&A rationale, [14.3] PE value creation.

---

### [12.8] Defences, Hostile Bids, Demergers and Divestitures
<!-- tags: domain=mergers-acquisitions; level=intermediate; roles=IB,CF,Consulting,PE; keywords=hostile takeover, takeover defences, poison pill, white knight, demerger, spin-off, carve-out, divestiture, value unlocking, scheme of arrangement -->

**Definition.** Hostile bids are acquisition attempts opposed by the target's board; defences are measures to resist them. Demergers, spin-offs, carve-outs and divestitures are the reverse of M&A: separating businesses to unlock value or refocus.

**Why it matters.** Restructuring through separation is as common as acquisition in India, and interviews test why companies split and how hostile situations play out.

**Core mechanics.**
**Hostile bids and defences:**
- Tactics: tender or open offer directly to shareholders, proxy fights, creeping acquisition
- Defences (globally): poison pills (rights plans), staggered boards, white knight (friendly alternative buyer), white squire (friendly minority investor), crown jewel sale, Pac-Man defence, golden parachutes
- In India, SEBI SAST restricts target boards from taking material actions (e.g., selling assets, issuing shares) during an open offer without shareholder approval, which limits defensive tactics; high promoter holdings are the main defence

**Separations:**

| Form | Description | Outcome |
|---|---|---|
| Demerger / spin-off | Business transferred to a new entity; shareholders receive its shares pro rata | Two listed companies, same shareholders |
| Equity carve-out | Subsidiary sells a minority stake via IPO | Parent keeps control; raises cash; price discovery |
| Divestiture / sale | Business sold to a third party | Cash proceeds; exit |
| Split-off | Shareholders exchange parent shares for subsidiary shares | Different shareholder bases |

**Rationale for separation:** sharper focus, removal of conglomerate discount, tailored capital structures, management incentives tied to each business, easier M&A for each piece, regulatory requirements.

**Worked example: demerger value.** A conglomerate trades at ₹130 per share against an SOTP value of ₹160 (see [10.9]). After demerging its consumer business, the two listed companies together trade at ₹155 per original share.
- Value unlocked = ₹25 per share (19% gain), mainly from narrowing the conglomerate discount
- Shareholders hold both companies in the same proportion; no cash changes hands

**Indian context.** Indian groups have used NCLT-approved demergers to separate businesses into separately listed entities [VERIFY: recent Indian demergers]. Tax neutrality for demergers requires section 2(19AA) conditions (e.g., all assets and liabilities of the undertaking transferred at book values, shareholders holding at least three-fourths in value become shareholders of the resulting company) [VERIFY: Income Tax Act section 2(19AA)]. Hostile takeovers are rare in India; a notable example was the contested acquisition of an IT services company by a larger conglomerate in 2019 [VERIFY: details of contested Indian takeovers].

**Common mistakes.**
- Assuming separation automatically creates value (dis-synergies and stranded costs exist).
- Ignoring stranded corporate costs left in the parent.
- Underestimating the timeline and approvals for schemes.

**Interview angle.**
1. *Why would a company demerge a profitable business?* To let markets value it on its own merits (removing the conglomerate discount), sharpen focus, and enable separate capital raising or M&A.
2. *Spin-off vs carve-out?* A spin-off distributes the subsidiary's shares to existing shareholders (no cash); a carve-out sells a stake to new investors via IPO (raises cash).
3. *Why are hostile takeovers rare in India?* Concentrated promoter holdings, SEBI SAST rules, and the cultural and regulatory weight on negotiated deals.

**Related topics:** [10.9] SOTP, [12.6] Regulatory framework, [2.7] Common control combinations.

---

### [12.9] Approaching an M&A Case Interview
<!-- tags: domain=mergers-acquisitions; level=intermediate; roles=Consulting,IB,PE,Fintech-PM; keywords=M&A case framework, acquisition case, strategic fit, valuation, synergies, risks, integration, recommendation, consulting case interview -->

**Definition.** A structured approach to "should Company A acquire Company B?" questions in consulting, PE and corporate strategy interviews.

**Why it matters.** M&A cases are among the most common case types. Interviewers look for a hypothesis-driven structure, quantitative judgement on value and price, and a clear recommendation with risks.

**Core mechanics: five-part structure.**
1. **Objective and rationale:** what is the acquirer trying to achieve (growth, capability, cost, defence)? Is acquisition the best route vs build or partner?
2. **Target attractiveness:** market (size, growth, profitability, trends), target's position (share, differentiation, customers), financial performance (growth, margins, cash conversion).
3. **Fit and synergies:** cost synergies (overlaps), revenue synergies (cross-sell, channels), capabilities; dis-synergies and cannibalisation.
4. **Valuation and price:** standalone value (DCF, comps, precedents) + PV of synergies vs asking price; financing and accretion/dilution; returns vs hurdle rate.
5. **Risks and execution:** regulatory (CCI, sector approvals), integration and culture, key person, diligence red flags, competitor reaction; mitigations.

End with a recommendation: go / no-go / go with conditions (price ceiling, structure, earn-out), plus next steps.

**Worked example (illustrative).** A large Indian payments company considers acquiring a wealthtech app with 20 lakh active investors for ₹1,500 Cr.
- Rationale: monetise existing user base (cross-sell investments), capability faster than building, regulatory licences (broking, mutual fund distribution) in place.
- Attractiveness: retail investing growing; target revenue ₹150 Cr, EBITDA breakeven.
- Synergies: cross-sell to 10% of the acquirer's users with lower CAC (₹300 vs ₹1,500) → incremental revenue; cost synergies in tech and support.
- Valuation: standalone ₹1,100 Cr (10x revenue vs listed peers' 8–12x range, adjusted for growth) + PV of synergies ₹600 Cr → maximum price ~₹1,700 Cr; asking ₹1,500 Cr leaves ₹200 Cr of value for the acquirer.
- Risks: regulatory approvals for change in control (SEBI-registered entities), founder retention, integration of risk and compliance culture, market cyclicality of broking revenue.
- Recommendation: proceed, subject to diligence on compliance history, with part of consideration as an earn-out tied to cross-sell targets and founder retention.

**Indian context.** Change in control of SEBI-registered intermediaries (brokers, investment advisers) and RBI-regulated entities requires prior regulatory approval, which affects timelines [VERIFY: SEBI intermediaries change-in-control approval requirements].

**Common mistakes.**
- Jumping into valuation before establishing strategic rationale.
- Treating synergies as certain.
- Ending without a clear recommendation.

**Interview angle.**
1. *What's the first question you'd ask in an M&A case?* What is the acquirer's objective, and why acquisition rather than organic growth or partnership?
2. *How do you decide the maximum price?* Standalone value plus the PV of net synergies the acquirer can realistically capture, minus costs; compare with alternatives.
3. *What would make you say no to an attractive target?* Price above value plus synergies, unacceptable regulatory or integration risk, or a better alternative (build or partner).

**Related topics:** [12.1] M&A rationale, [12.2] Synergies, [10.12] Football field, [9.5] Build vs buy.

---

## Module 12 Glossary

| Term | Definition |
|---|---|
| Accretion / dilution | Increase / decrease in acquirer's EPS from a deal |
| CCI | Competition Commission of India |
| Completion accounts | Price adjusted at closing for actual net debt and working capital |
| Control premium | Premium over market price paid for control |
| Creeping acquisition | Up to 5% a year acquisition by 25–75% holders without an open offer |
| Demerger | Transfer of a business to a new entity owned by the same shareholders |
| Earn-out | Deferred consideration contingent on future performance |
| IMO | Integration management office |
| Locked box | Price fixed at a past balance sheet date with leakage protection |
| Open offer | Offer to public shareholders triggered by SAST thresholds |
| Reverse book building | Price discovery mechanism for delisting in India |
| SAST | SEBI Substantial Acquisition of Shares and Takeovers Regulations |
| Slump sale | Transfer of an undertaking for a lump sum |
| Synergies | Value from combining businesses beyond standalone values |
| Working capital peg | Target NWC level used in completion price adjustments |

## Module 12 Rapid-Fire Quiz

1. Acquirer P/E 25x pays 15x for target in stock. Accretive or dilutive (before adjustments)? **Accretive**
2. Target earnings yield at offer 6%; acquirer after-tax cost of debt 7%. Debt-funded deal? **Dilutive**
3. SAST open offer trigger? **25% of voting rights (or control)**
4. Minimum open offer size? **26%**
5. More credible synergy type? **Cost synergies**
6. EV ₹400 Cr, net debt ₹50 Cr, NWC ₹30 Cr vs peg ₹35 Cr. Equity price? **₹345 Cr**
7. Which body sanctions Indian schemes of arrangement? **NCLT**
8. Maximum premium an acquirer should pay? **PV of net synergies**
9. Spin-off raises cash for the parent: true or false? **False (carve-out does)**
10. CCI deal value threshold? **₹2,000 Cr with substantial business operations in India**

## Module 12 [VERIFY] Items

1. CCI combination thresholds; Competition (Amendment) Act 2023 and CCI combination regulations 2024
2. Income Tax Act section 72A (loss carry-forward in amalgamations)
3. SEBI requirements on valuation reports for share swap ratios
4. Companies Act section 233 fast-track mergers; Income Tax Act section 50B (slump sale); FDI sectoral caps and pricing
5. RBI prior approval for change in control of NBFCs and payment entities; SEBI intermediaries change-in-control
6. SEBI SAST Regulations 2011 (as amended); SEBI Delisting Regulations 2021 and 2024 amendments; FEMA NDI Rules; Press Note 3 (2020)
7. PSU bank merger integration disclosures
8. Recent Indian demergers; section 2(19AA); contested Indian takeovers

---

# Module 13: Investment Banking

### [13.1] Structure of an Investment Bank and How It Makes Money
<!-- tags: domain=investment-banking; level=foundation; roles=IB,PE,ER,Consulting; keywords=investment bank structure, front office, coverage, product groups, M&A advisory, ECM, DCM, leveraged finance, sales and trading, research, middle office, back office, bulge bracket, boutique -->

**Definition.** An investment bank helps companies, governments and institutions raise capital and execute strategic transactions, and serves investors through trading, research and market-making.

**Why it matters.** IB interviews begin with "what does an investment bank do?" and "which division do you want to join and why?" Knowing the structure, revenue model and how deal teams work is basic preparation.

**Core mechanics.**
**Front office:**
- **Investment banking division (IBD):**
  - Coverage (industry or country groups): own client relationships, originate deals
  - Product groups: M&A advisory; equity capital markets (ECM: IPOs, QIPs, block trades); debt capital markets (DCM: bonds, loans); leveraged finance; restructuring
- **Markets / global markets:** sales and trading in equities, fixed income, currencies and commodities (FICC); market-making; prime brokerage
- **Research:** equity and credit research (separated from banking by information barriers)
- **Asset and wealth management** (at some banks)

**Middle office:** risk management, compliance, treasury, product control.
**Back office:** operations, settlements, technology.

**Revenue sources:**
- Advisory fees (success fees on M&A, often a percentage of deal value with retainers)
- Underwriting fees and spreads (ECM, DCM)
- Trading revenue (bid-ask spreads, market-making, financing)
- Interest and lending income (for universal banks)

**Firm types:** bulge bracket (global full-service), elite boutiques (advisory-focused), middle-market banks, domestic Indian investment banks (often part of financial groups), regional boutiques.

**Deal team hierarchy:** Analyst → Associate → Vice President → Director / Executive Director → Managing Director. Analysts build models and pitch books; associates manage the analyst work and check outputs; VPs run deal execution; MDs own client relationships and origination.

**Worked example: advisory fee.** A sell-side mandate for a ₹2,000 Cr enterprise value company with a 1.0% success fee and a ₹50 lakh monthly retainer for 6 months credited against the success fee.
- Success fee = 1.0% × 2,000 = ₹20 Cr
- Retainers paid = ₹3 Cr, credited → final payment at closing = **₹17 Cr**; total fee **₹20 Cr**
- If the deal fails, the bank keeps only the retainers (₹3 Cr), which is why advisory is a high-risk, high-reward business.

**Indian context.** Merchant bankers in India must be registered with SEBI under the SEBI (Merchant Bankers) Regulations to manage public issues, open offers, buybacks and delistings [VERIFY: SEBI (Merchant Bankers) Regulations 1992 as amended in 2024]. India's IB market includes domestic houses and global banks; ECM league tables are dominated by domestic firms in many years [VERIFY: current league tables (e.g., Prime Database, LSEG)].

**Common mistakes.**
- Confusing investment banking with retail or commercial banking.
- Saying you want IB for "money and prestige" alone.
- Not knowing the difference between coverage and product groups.

**Interview angle.**
1. *What does an investment bank do?* Helps clients raise capital (equity and debt) and advises on strategic transactions (M&A, restructuring), while its markets business trades securities and makes markets for investors.
2. *What's the difference between ECM and DCM?* ECM handles equity raises (IPOs, QIPs, follow-ons, blocks); DCM handles debt raises (bonds, loans, commercial paper).
3. *What does an analyst do day to day?* Builds models (valuation, merger, LBO), prepares pitch books and marketing materials, manages data rooms and diligence, and supports execution.

**Related topics:** [13.2] Sell-side process, [13.3] IPO process, [13.7] Pitch books and IB interviews.

---

### [13.2] The M&A Advisory Process: Sell-Side and Buy-Side
<!-- tags: domain=investment-banking; level=intermediate; roles=IB,PE,CF; keywords=sell-side process, auction, teaser, CIM, information memorandum, NDA, non-binding offer, binding offer, data room, SPA, buy-side advisory, fairness opinion -->

**Definition.** Sell-side advisory helps owners sell a business at the best price and terms; buy-side advisory helps acquirers identify, value, negotiate and execute acquisitions.

**Why it matters.** The structured auction is the backbone of M&A execution; analysts and associates manage its documents and timelines. Interviewers ask candidates to walk through the process.

**Core mechanics: a typical two-round sell-side auction (4–6 months).**
1. **Preparation (4–8 weeks):** understand the business, prepare valuation, build the financial model, draft the teaser (anonymous one-pager) and confidential information memorandum (CIM / IM), identify buyers (strategic and financial), vendor due diligence where useful
2. **Marketing / Round 1 (4–6 weeks):** send teasers, sign NDAs, distribute the CIM and process letter; receive non-binding offers (NBOs / indications of interest) with valuation range and key assumptions
3. **Round 2 (6–8 weeks):** shortlist bidders; management presentations; virtual data room access; site visits; draft SPA circulated for markup; receive binding offers
4. **Negotiation and signing:** select preferred bidder; negotiate SPA terms (price, reps and warranties, indemnities, conditions); sign
5. **Closing:** regulatory approvals (CCI, sector regulators, SEBI if listed), conditions precedent, funds flow, completion

**Variants:** broad auction (maximises competition), targeted auction (selected buyers), negotiated sale (one buyer; speed and confidentiality).

**Buy-side advisory:** target screening, approach strategy, valuation and synergy analysis, bid strategy, financing, diligence coordination, negotiation, and sometimes a fairness opinion for the board.

**Worked example: comparing two binding bids.**

| Term | Bidder A (strategic) | Bidder B (PE) |
|---|---|---|
| Headline EV | ₹1,000 Cr | ₹1,050 Cr |
| Consideration | 100% cash at closing | ₹900 Cr cash + ₹150 Cr earn-out |
| Probability of earn-out being paid | — | 50% |
| Conditions | CCI approval (6 months) | Financing condition |
| Indemnity cap | 10% of price | 25% of price |

- Expected value of B = 900 + 0.5 × 150 = **₹975 Cr**, below A's ₹1,000 Cr, and B carries financing risk and a higher indemnity cap
- A's main risk is CCI timing; overall A is likely the stronger bid despite the lower headline

**Indian context.** Indian sell-side processes often involve promoter families with non-financial priorities (legacy, employees, brand), and require regulatory steps such as SEBI SAST open offers for listed targets, CCI approvals and, for financial services, RBI or SEBI change-in-control approvals [VERIFY: applicable approval requirements by sector].

**Common mistakes.**
- Comparing bids on headline price only.
- Leaking information through poor NDA discipline or data room controls.
- Running a broad auction for a business that needs confidentiality (e.g., with key customer concentration).

**Interview angle.**
1. *Walk me through a sell-side M&A process.* Preparation (teaser, CIM, model, buyer list), round one non-binding bids, round two diligence and binding bids with SPA markups, negotiation and signing, then regulatory approvals and closing.
2. *Why run an auction rather than negotiate with one buyer?* Competition maximises price and terms; a negotiated sale offers speed and confidentiality.
3. *What's in a CIM?* Business overview, market, competitive position, management, historical and projected financials, investment highlights, and process information.

**Related topics:** [12.4] Deal structuring, [12.5] Due diligence, [10.12] Football field.

---

### [13.3] Equity Capital Markets: The IPO Process in India
<!-- tags: domain=investment-banking; level=intermediate; roles=IB,ER,CF,Fintech-PM; keywords=IPO process, DRHP, RHP, SEBI observations, book running lead manager, ICDR eligibility, offer for sale, fresh issue, anchor investors, promoter lock-in, listing, T+3 -->

**Definition.** An initial public offering (IPO) is a company's first sale of shares to the public and listing on a stock exchange. It can include a fresh issue (new shares, money to the company) and/or an offer for sale (OFS) (existing shareholders sell, money to them).

**Why it matters.** India has been one of the world's busiest IPO markets in recent years, including many new-age tech and fintech listings. ECM, ER and fintech roles all need to understand the process, eligibility and pricing.

**Core mechanics.**
**Key parties:** book running lead managers (BRLMs, SEBI-registered merchant bankers), legal counsel, statutory auditors, registrar to the issue, syndicate members, bankers to the issue, SEBI, stock exchanges (NSE, BSE), depositories.

**Process (typical 6–12 months):**
1. **Preparation:** board and shareholder approvals, corporate restructuring, conversion to public company, appointment of intermediaries, restated financials (3 years), due diligence
2. **Draft red herring prospectus (DRHP)** filed with SEBI and exchanges; public comments; SEBI observations (a confidential pre-filing route is also available)
3. **Respond to observations;** update financials
4. **Marketing:** analyst presentations, roadshows, early-stage investor meetings
5. **Red herring prospectus (RHP)** filed with the Registrar of Companies (RoC); price band announced
6. **Anchor book** opens one working day before the issue
7. **Issue period:** typically 3 working days; bids through ASBA (application supported by blocked amount) and UPI for individual investors
8. **Basis of allotment,** refunds and unblocking, credit of shares
9. **Listing:** T+3 working days after issue close

**Eligibility (ICDR Regulation 6):**
- Regulation 6(1) profitability route: net tangible assets, average operating profit, and net worth track record thresholds (commonly cited: NTA ≥ ₹3 Cr, average operating profit ≥ ₹15 Cr over the preceding 3 years, net worth ≥ ₹1 Cr)
- Regulation 6(2) for companies not meeting 6(1) (e.g., loss-making tech companies): at least 75% of the issue to qualified institutional buyers (QIBs)

**Allocation (6(1) route):** QIBs up to 50% (of which anchors up to 60% of the QIB portion), non-institutional investors (NIIs) at least 15%, retail individual investors (RIIs, applications up to ₹2 lakh) at least 35%. Under 6(2): QIBs at least 75%, NIIs up to 15%, retail up to 10%.

**Lock-ins:** promoters' minimum contribution (20% of post-issue capital) locked in for 18 months (longer if proceeds fund capex), excess promoter holding for 6 months; anchor investors 50% for 30 days and 50% for 90 days.

**Worked example.** A ₹1,000 Cr IPO (6(1) route) at an upper band of ₹100 (10 Cr shares): ₹400 Cr fresh issue, ₹600 Cr OFS.
- QIB portion ₹500 Cr, of which anchors up to ₹300 Cr
- NII portion ₹150 Cr; retail ₹350 Cr
- Company receives ₹400 Cr (less its share of expenses); selling shareholders receive ₹600 Cr
- If retail is subscribed 10x with a minimum lot of ₹14,000 to ₹15,000, many retail applicants get allotment by lottery of one minimum lot.

**Indian context.** All thresholds, percentages and timelines here are under the SEBI ICDR Regulations 2018 and change frequently; recent amendments covered SME IPOs, minimum public shareholding for large issuers, and anchor allocation [VERIFY: SEBI ICDR Regulations 2018 (current version): Regulations 6, 14, 16, 32, anchor rules, T+3 timeline, MPS requirements under SCRR 19(2)(b)].

**Common mistakes.**
- Confusing fresh issue (company raises money) with OFS (sellers get money).
- Assuming subscription multiples reflect long-term value.
- Ignoring lock-in expiry dates, which often bring selling pressure.

**Interview angle.**
1. *Walk me through an IPO process in India.* Preparation and diligence, DRHP filing with SEBI, observations, marketing, RHP and price band, anchor book, three-day bidding, allotment, listing on T+3.
2. *Why do companies go public?* Raise growth capital, provide liquidity for existing investors and employees, enhance brand and governance, and access public markets for future funding and acquisitions.
3. *How can a loss-making company list in India?* Under ICDR Regulation 6(2), with at least 75% of the issue allocated to QIBs.

**Related topics:** [13.4] IPO pricing, [13.5] Follow-on offerings, [15.1] Market structure.

---

### [13.4] IPO Pricing, Book Building and After-Market Dynamics
<!-- tags: domain=investment-banking; level=intermediate; roles=IB,ER,PE,Fintech-PM; keywords=IPO pricing, book building, price band, IPO discount, anchor investors, subscription, grey market premium, listing gains, underpricing, greenshoe -->

**Definition.** IPO pricing sets the issue price through book building: bankers propose a price band based on valuation and investor feedback, investors bid within the band, and the final price is set where demand is strongest from quality investors.

**Why it matters.** Pricing balances the issuer's desire for a high valuation against investors' need for a reasonable return and a healthy after-market. Understanding underpricing, anchors and the grey market is common in ECM and fintech interviews.

**Core mechanics.**
- **Valuation basis:** trading comps of listed peers (Indian and global), DCF, and recent private rounds; then an **IPO discount** (often 10–20% vs fair value) to attract investors and support after-market performance.
- **Price band:** cap no more than 120% of the floor (and at least 105% of the floor under current rules).
- **Book building:** QIBs, NIIs and retail bid at prices within the band; retail can bid at "cut-off" (accepting the final price).
- **Anchor investors:** large institutions allocated shares a day before the issue opens; their participation signals quality and anchors demand.
- **Subscription levels** by category are published live; heavy oversubscription often signals listing gains but not long-term returns.
- **Greenshoe (over-allotment) option:** allows stabilisation by over-allotting shares and buying back in the market if the price falls below the issue price (used rarely in India).
- **Grey market premium (GMP):** unofficial, unregulated trading of IPO shares before listing; widely quoted, legally unsanctioned, and unreliable.
- **IPO underpricing** (first-day returns) is a global phenomenon, explained by information asymmetry, the winner's curse for uninformed investors, and bankers' incentives to ensure success.

**Worked example.** A fintech's listed peers trade at a median 30x FY27E P/E; the company's FY27E EPS is ₹4.
- Fair value = 30 × 4 = ₹120
- With a 15% IPO discount → ₹102; bankers set a price band of **₹95–₹100**
- At ₹100 and 50 Cr shares post-issue, market cap = ₹5,000 Cr (25x FY27E P/E)
- If the stock lists at ₹125, listing gain = 25%; the selling shareholders "left money on the table": the OFS of 10 Cr shares was sold ₹250 Cr below the first-day market value.

**Indian context.** India has seen very high subscription levels and listing gains in some periods, alongside poor post-listing performance for some richly priced new-age IPOs [VERIFY: Prime Database IPO performance statistics]. SEBI requires disclosure of KPIs and the price per share of recent primary and secondary transactions in offer documents, to help investors judge pricing [VERIFY: SEBI ICDR KPI and pre-IPO transaction disclosure rules].

**Common mistakes.**
- Treating oversubscription as proof of fair value.
- Relying on grey market premium as information.
- Comparing an IPO's valuation to peers without adjusting for growth and profitability.

**Interview angle.**
1. *How do bankers price an IPO?* Value the company using peer multiples and DCF, apply an IPO discount, test with investors in pre-marketing, set a band, and finalise the price based on the quality and price sensitivity of the book.
2. *Why are IPOs underpriced on average?* To compensate investors for information asymmetry and ensure a successful offering and after-market, which also helps banks' reputations and future deals.
3. *What role do anchor investors play?* They commit before the issue opens, signalling quality and price discovery to other investors; their lock-ins limit early selling.

**Related topics:** [13.3] IPO process, [10.6] Trading comps, [15.8] Market efficiency.

---

### [13.5] Follow-On Equity: QIPs, Rights Issues, Preferential Allotments, OFS and Block Deals
<!-- tags: domain=investment-banking; level=intermediate; roles=IB,CF,ER,PE; keywords=QIP, qualified institutions placement, rights issue, preferential allotment, offer for sale through stock exchange, block deal, bulk deal, pricing formula, lock-in -->

**Definition.** Follow-on equity transactions raise capital or provide liquidity for already-listed companies or their shareholders: QIPs, rights issues, preferential allotments, offers for sale through the stock exchange (OFS), and block or bulk deals.

**Why it matters.** Listed Indian companies raise large amounts via QIPs, and promoters and PE investors exit via blocks and OFS. ECM teams execute these deals quickly, often overnight.

**Core mechanics.**

| Instrument | Who can buy | Pricing (summary) | Speed / features |
|---|---|---|---|
| QIP | Only qualified institutional buyers | Floor based on average weekly high-low closing prices over two weeks before the relevant date; discount up to 5% allowed | Fast (days); no SEBI pre-approval; placement document |
| Rights issue | Existing shareholders, pro rata (renounceable) | Set by issuer, usually at a discount to market | Protects existing holders; rights entitlements tradeable |
| Preferential allotment | Identified investors (promoters, strategic, PE) | Floor based on volume-weighted average prices over prescribed look-back periods (e.g., 90 and 10 trading days) | Shareholder approval; lock-ins |
| OFS through stock exchange | Promoters/large holders sell; institutional and retail bid | Floor price set by seller | Separate exchange window; T+1 for non-retail and retail days |
| Block deal | Negotiated large trade | Within a band around the market price | Separate block window; minimum size |
| Bulk deal | Trade of more than 0.5% of shares in a day | Normal market | Disclosure required |

**Theoretical ex-rights price (TERP)** for a rights issue:
- TERP = (N × Market price + n × Subscription price) / (N + n), where n new shares are offered for every N held

**Worked example 1: rights issue.** 1 new share for every 4 held at ₹80; market price ₹100.
- TERP = (4 × 100 + 1 × 80) / 5 = **₹96**
- Value of one right = TERP − Subscription price = 96 − 80 = **₹16** per new share (₹4 per existing share)
- A shareholder who neither subscribes nor sells rights loses value; one who subscribes keeps proportional ownership.

**Worked example 2: QIP.** Two-week average price ₹500; issuer applies a 5% discount → QIP price **₹475**; raising ₹1,000 Cr issues about 2.1 Cr shares. If existing shares are 40 Cr, dilution ≈ 2.1 / 42.1 = **5.0%**.

**Indian context.** Pricing formulas, minimum allottees, lock-ins and windows are set by SEBI ICDR (Chapters III for rights, V for preferential, VI for QIP) and stock exchange circulars for block deals and OFS; SEBI has also shortened rights issue timelines [VERIFY: SEBI ICDR Chapters III, V, VI pricing and timelines; SEBI block deal framework and minimum order size; OFS through stock exchange mechanism].

**Common mistakes.**
- Ignoring dilution and the signalling effect of equity raises.
- Miscomputing TERP or treating rights as free value.
- Overlooking lock-in and disclosure rules for preferential allotments.

**Interview angle.**
1. *Why might a company choose a QIP over a rights issue?* Speed, lower cost and access to institutional demand without needing every shareholder to participate.
2. *What happens to your wealth if you ignore a rights issue?* You're diluted, and your shares fall to TERP; unless you sell the rights, you lose the rights' value.
3. *Why do promoters use OFS through the exchange?* To sell large stakes transparently (e.g., to meet minimum public shareholding) with price discovery and quick settlement.

**Related topics:** [13.3] IPO process, [8.10] Sources of finance, [15.4] Trading mechanics.

---

### [13.6] Debt Capital Markets: Bonds, Loans and the Role of Ratings
<!-- tags: domain=investment-banking; level=intermediate; roles=IB,CF,Fintech-PM,ER; keywords=debt capital markets, corporate bonds, NCD private placement, electronic bidding platform, credit spread, syndicated loans, commercial paper, ECB, credit rating, large corporate framework -->

**Definition.** Debt capital markets (DCM) help issuers raise debt through bonds, loans and money-market instruments, structuring the instrument, pricing it relative to benchmarks, and distributing it to investors.

**Why it matters.** Debt markets dwarf equity markets in issuance volume. Corporate finance, treasury, DCM and fintech lending roles need to understand pricing (spreads), ratings and Indian market mechanics.

**Core mechanics.**
- **Instruments:** NCDs / corporate bonds (secured or unsecured, fixed or floating), commercial paper (short-term), syndicated and bilateral loans, ECBs and foreign currency bonds, masala bonds (INR-denominated, issued abroad), green, social and sustainability-linked bonds, perpetual and subordinated bonds (bank capital instruments such as AT1 and Tier 2).
- **Pricing:** Yield = Benchmark yield (G-sec of matching tenor or OIS) + Credit spread (rating, sector, liquidity, structure).
- **Process:** mandate → rating(s) → term sheet and information memorandum → investor sounding → bidding (in India, private placements above specified sizes go through the electronic book provider (EBP) platforms of exchanges) → allotment → listing.
- **Investors:** banks, mutual funds, insurers, pension and provident funds, FPIs, corporates.
- **Covenants:** financial (leverage, DSCR), security cover, negative pledge, change of control.
- **Ratings:** opinions on credit risk by SEBI-registered credit rating agencies (CRISIL, ICRA, CARE, India Ratings, Acuité, Brickwork, Infomerics). Investment grade is BBB− and above. Ratings affect investor eligibility (many funds can buy only AA or above) and pricing.

**Worked example.** A AA-rated corporate wants 5-year funding. 5-year G-sec yields 6.4%; secondary-market AA spreads for similar issuers are 100–120 bps.
- Indicative coupon = 6.4% + 1.1% = **7.5%**
- On ₹500 Cr, annual interest = ₹37.5 Cr; post-tax cost at 25.17% ≈ 5.6%
- If the issuer were AAA, a spread of 50–70 bps would save about ₹2.5 Cr a year.

**Indian context.** Large corporates meeting SEBI's "large corporate" criteria must raise a minimum share of incremental borrowings through debt securities [VERIFY: SEBI large corporate framework thresholds (as revised)]. Private placement through EBP is mandatory above a threshold issue size [VERIFY: SEBI EBP threshold]. Indian bond market depth is concentrated in AAA and AA issuers; lower-rated companies rely more on bank loans. RBI's CP and NCD directions govern short-term issuance [VERIFY: RBI Commercial Paper and NCD Directions 2024].

**Common mistakes.**
- Comparing bond yields without matching tenor and rating.
- Treating ratings as guarantees (rating downgrades and defaults, e.g., in 2018–19, show otherwise).
- Ignoring covenant packages when comparing loans with bonds.

**Interview angle.**
1. *How is a corporate bond priced?* Benchmark government yield of the same tenor plus a credit spread reflecting rating, sector, liquidity, structure and market conditions.
2. *Why would a company issue bonds rather than take a bank loan?* Potentially lower cost (for highly rated issuers), longer tenor, diversified investor base, fewer restrictive covenants; loans offer flexibility and confidentiality.
3. *What happens to a bond's price if the issuer is downgraded?* The required spread widens, so the price falls; some investors may be forced to sell if the rating drops below their mandate.

**Related topics:** [16.6] Credit ratings and spreads, [16.7] Indian debt market, [8.10] Sources of finance.

---

### [13.7] Pitch Books, League Tables, Fees and the IB Interview
<!-- tags: domain=investment-banking; level=foundation; roles=IB,PE,ER; keywords=pitch book, league tables, IB fees, why investment banking, technical questions, deal discussion, fit questions, networking, superday -->

**Definition.** Pitch books are presentations banks use to win mandates; league tables rank banks by deal volume; fee structures reflect deal type and size. The IB interview tests motivation, technical knowledge and fit.

**Why it matters.** This is the practical layer candidates are expected to know, and it frames how to prepare for IB recruiting.

**Core mechanics.**
**Pitch book contents:** bank credentials (relevant deals, league table positions), market and sector update, company situation overview, strategic alternatives, valuation analysis (football field), potential buyers or investors, process recommendation and timeline, team.

**League tables:** rank banks by value or number of deals by product and region (ECM, DCM, M&A), using data providers' credit rules; used for marketing and benchmarking.

**Indicative fee ranges (vary by deal size and market):**
- M&A advisory: often 0.5–2% of deal value for mid-sized deals (lower for very large ones; minimum fees for small ones)
- IPOs: a percentage of issue size, typically lower in India for large issues than for small ones
- Bonds and loans: arrangement fees in basis points

**Interview structure:**
1. **Fit and motivation:** why IB, why this bank, why now; story of your background
2. **Technical:** accounting (three-statement walkthroughs), valuation (DCF, comps, EV vs equity value), M&A (accretion/dilution), LBO basics
3. **Market awareness:** a recent deal you followed (rationale, valuation, structure, outcome)
4. **Brain teasers / quick maths** (less common now)

**Worked example: discussing a deal (template).**
- *What happened:* Company A acquired a stake in Company B for ₹X Cr at Y times EBITDA.
- *Why:* strategic rationale (market access, capabilities, synergies).
- *Valuation:* how the multiple compares with trading comps and precedents; what premium was paid.
- *Structure and financing:* cash or stock, debt raised, approvals needed.
- *Your view:* does it create value? Key risks?
- Practise with 2–3 recent Indian deals in your target sector (fintech, consumer, industrials) and check facts before the interview.

**Indian context.** Indian IB recruiting from B-schools typically covers summer internships leading to pre-placement offers, with domestic and global banks hiring for IBD, ECM, DCM and markets roles [VERIFY: current campus recruiting patterns]. League table data for India is published by Prime Database (ECM) and global providers.

**Common mistakes.**
- Generic "why IB" answers (money, learning curve) without specifics.
- Discussing a deal without knowing the numbers or rationale.
- Over-rehearsed technical answers that fall apart on a follow-up.

**Interview angle.**
1. *Why investment banking?* Tie it to your experience (e.g., enterprise systems or strategy work), the steep learning on how companies create value through transactions, and the specific product or sector you want, then why this bank.
2. *Tell me about a deal you've followed.* Use the template: what, why, valuation, structure, your view.
3. *What makes a good analyst?* Accuracy and attention to detail, reliability under pressure, ownership of the work, and clear communication.

**Related topics:** [10.12] Valuation questions, [3.4] Three-statement walkthroughs, [12.3] Accretion/dilution.

---

## Module 13 Glossary

| Term | Definition |
|---|---|
| Anchor investor | Institution allocated IPO shares a day before the issue opens |
| ASBA | Application supported by blocked amount |
| Book building | Price discovery process using investor bids within a band |
| BRLM | Book running lead manager |
| CIM | Confidential information memorandum |
| DRHP / RHP | Draft red herring prospectus / red herring prospectus |
| EBP | Electronic book provider platform for private placements |
| Fresh issue | New shares issued; proceeds go to the company |
| Grey market premium | Unofficial pre-listing premium; unregulated |
| League table | Ranking of banks by deal volume |
| OFS | Offer for sale by existing shareholders |
| QIB | Qualified institutional buyer |
| QIP | Qualified institutions placement |
| TERP | Theoretical ex-rights price |
| Underpricing | First-day return above issue price |

## Module 13 Rapid-Fire Quiz

1. In an OFS, who receives the money? **The selling shareholders**
2. Rights issue 1-for-5 at ₹50; market ₹80. TERP? **₹75**
3. Retail portion under the 6(1) IPO route? **At least 35%**
4. Under 6(2), minimum QIB allocation? **75%**
5. Listing timeline after issue close? **T+3 working days**
6. Who can invest in a QIP? **Only QIBs**
7. 5-year G-sec 6.5%, spread 90 bps. Indicative coupon? **7.4%**
8. Main products of DCM? **Bonds, loans, commercial paper**
9. Bid A ₹500 Cr cash vs Bid B ₹480 Cr + ₹60 Cr earn-out at 40% probability. Expected value of B? **₹504 Cr**
10. Is grey market premium regulated? **No**

## Module 13 [VERIFY] Items

1. SEBI (Merchant Bankers) Regulations (as amended 2024); league table sources
2. Sector-specific approval requirements for M&A
3. SEBI ICDR Regulations 2018 (current): eligibility, allocation, lock-ins, anchors, price band, T+3; SCRR 19(2)(b) MPS
4. Prime Database IPO performance statistics; ICDR KPI and pre-IPO transaction disclosures
5. SEBI ICDR Chapters III, V, VI; block deal framework; OFS mechanism
6. SEBI large corporate framework; EBP threshold; RBI CP and NCD Directions
7. Campus recruiting patterns

---

# Module 14: Private Equity and Venture Capital

### [14.1] Fund Structure and Economics: GPs, LPs, Fees, Carry and Waterfalls
<!-- tags: domain=private-equity-vc; level=intermediate; roles=PE,IB,Fintech-PM,Consulting; keywords=private equity fund, general partner, limited partner, management fee, carried interest, hurdle rate, catch-up, distribution waterfall, European waterfall, American waterfall, J-curve, DPI, TVPI -->

**Definition.** A private equity or venture capital fund is a pooled vehicle in which limited partners (LPs, the investors) commit capital and a general partner (GP, the manager) invests it in private companies, earning management fees and a share of profits (carried interest).

**Why it matters.** Fund economics explain PE and VC behaviour: return targets, holding periods, exit pressure, and why IRR and MOIC are both tracked. PE and VC interviews test the waterfall and key fund metrics.

**Core mechanics.**
- **Lifecycle:** fundraising → investment period (typically 3–5 years) → value creation → exits (typical fund life around 10 years, plus extensions). Capital is called as needed (drawdowns), not upfront.
- **Management fee:** typically around 2% a year of committed capital during the investment period, then lower or on invested capital (varies; larger funds often charge less).
- **Carried interest:** typically 20% of profits, paid after LPs receive their capital back plus a hurdle (preferred return, often 8%).
- **Catch-up:** after the hurdle, the GP receives a large share (up to 100%) of distributions until it has received its full carry share of total profits.
- **Waterfall types:**
  - European (whole-fund): carry only after LPs get back all contributed capital plus the hurdle across the fund (LP-friendly)
  - American (deal-by-deal): carry earned on each deal as it exits (GP-friendly), usually with clawback provisions
- **J-curve:** early net returns are negative (fees, early write-downs) before exits drive returns up.
- **Performance metrics:**
  - DPI (distributions to paid-in) = Distributions / Paid-in capital (realised)
  - RVPI (residual value to paid-in) = NAV / Paid-in
  - TVPI (total value to paid-in) = DPI + RVPI
  - Net IRR (after fees and carry) vs gross IRR

**Worked example: European waterfall.** LPs contribute ₹1,000 Cr (fees ignored for simplicity). After 5 years the fund distributes ₹2,000 Cr. Hurdle 8% compounded; carry 20% with full catch-up.

| Tier | LP | GP |
|---|---|---|
| 1. Return of capital | 1,000.0 | — |
| 2. Preferred return: 1,000 × (1.08⁵ − 1) | 469.3 | — |
| 3. GP catch-up (until GP has 20% of profits so far): 469.3 × 0.25 | — | 117.3 |
| 4. Remaining 413.4 split 80/20 | 330.7 | 82.7 |
| **Total** | **1,800.0** | **200.0** |

- GP receives exactly 20% of the ₹1,000 Cr profit (₹200 Cr)
- Gross MOIC 2.0x; LP net MOIC 1.8x (before management fees)

**Indian context.** PE and VC funds in India are typically registered as Alternative Investment Funds (AIFs) with SEBI: Category I (VC funds, angel funds, social impact, infrastructure), Category II (PE and debt funds without leverage beyond operational needs), Category III (hedge-fund-like strategies) [VERIFY: SEBI AIF Regulations 2012 categories and minimum investment (₹1 Cr for most investors)]. Many foreign funds invest via offshore structures under FDI/FPI routes. GIFT City (IFSC) hosts a growing number of fund vehicles [VERIFY: IFSCA Fund Management Regulations 2022].

**Common mistakes.**
- Confusing gross and net returns.
- Assuming carry applies from the first rupee of profit (hurdles and catch-up matter).
- Comparing IRR across funds at different stages of the J-curve.

**Interview angle.**
1. *Explain "2 and 20".* A management fee of about 2% a year on committed capital and 20% carried interest on profits, usually above an 8% hurdle.
2. *What's the difference between DPI and TVPI?* DPI counts only cash returned (realised); TVPI adds unrealised NAV. LPs increasingly focus on DPI.
3. *Why do LPs prefer European waterfalls?* GPs earn carry only after LPs recover all capital plus the hurdle across the whole fund, reducing the risk of paying carry on early winners while later deals lose money.

**Related topics:** [14.2] LBO mechanics, [14.6] Exits, [1.5] IRR vs MOIC.

---

### [14.2] Leveraged Buyout (LBO) Mechanics: A Full Worked Example
<!-- tags: domain=private-equity-vc; level=advanced; roles=PE,IB,CF; keywords=LBO, leveraged buyout, sources and uses, debt capacity, senior debt, mezzanine, sponsor equity, cash sweep, exit multiple, IRR, MOIC, paper LBO -->

**Definition.** A leveraged buyout is the acquisition of a company using a significant amount of borrowed money, with the target's cash flows servicing and repaying the debt. The sponsor (PE fund) contributes equity and aims to sell after 3–7 years.

**Why it matters.** The LBO model is the core PE technical test, and a "paper LBO" (done by hand in minutes) is common in interviews. It also sets a floor valuation in M&A processes (what a financial buyer can pay).

**Core mechanics.**
**Steps:**
1. **Entry valuation:** EV = Entry multiple × EBITDA
2. **Sources and uses:** uses (purchase price, refinancing of existing debt, fees); sources (debt tranches, sponsor equity, management rollover)
3. **Debt capacity:** based on leverage multiples (Debt / EBITDA) and coverage (EBITDA / Interest) lenders will accept
4. **Operating projections:** EBITDA, D&A, capex, NWC, tax
5. **Debt schedule:** interest, mandatory amortisation, cash sweep
6. **Exit:** Exit EV = Exit multiple × Exit-year EBITDA; Exit equity = Exit EV − Net debt
7. **Returns:** MOIC = Exit equity / Initial equity; IRR = MOIC^(1/years) − 1 (if no interim cash flows)

**Ideal LBO candidate:** stable and predictable cash flows, low capex needs, strong market position, opportunities for operational improvement, low existing leverage, motivated management, clear exit routes.

**Worked example.** Target EBITDA ₹100 Cr. Entry at 8.0x → EV ₹800 Cr. Fees ₹16 Cr.

Sources and uses (₹ Cr):

| Uses | | Sources | |
|---|---|---|---|
| Purchase EV | 800 | Senior term loan (3.0x, 10%) | 300 |
| Fees | 16 | Subordinated debt (1.0x, 14%) | 100 |
| | | Sponsor equity | 416 |
| **Total** | **816** | **Total** | **816** |

Assumptions: EBITDA grows 10% a year; D&A ₹20 Cr; capex ₹25 Cr; NWC increase ₹5 Cr; tax 25%; interest on opening balances; all free cash flow sweeps the senior loan; exit at 8.0x after 5 years.

| Year | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| EBITDA | 110.0 | 121.0 | 133.1 | 146.4 | 161.1 |
| Interest | 44.0 | 41.6 | 38.1 | 33.5 | 27.5 |
| Net income | 34.5 | 44.6 | 56.3 | 69.7 | 85.2 |
| FCF (NI + D&A − capex − ΔNWC) | 24.5 | 34.6 | 46.3 | 59.7 | 75.2 |
| Senior debt (closing) | 275.5 | 240.9 | 194.7 | 135.0 | 59.8 |

Exit:
- Exit EV = 8.0 × 161.05 = **₹1,288.4 Cr**
- Net debt = 59.8 senior + 100 subordinated = ₹159.8 Cr
- Exit equity = **₹1,128.6 Cr**
- MOIC = 1,128.6 / 416 = **2.71x**; IRR = 2.71^(1/5) − 1 = **22.1%**

Exit multiple sensitivity: 7.0x → MOIC 2.33x, IRR 18.4%; 9.0x → MOIC 3.10x, IRR 25.4%.

**Paper LBO shortcuts:** a 2x MOIC over 5 years ≈ 15% IRR; 2.5x ≈ 20%; 3x ≈ 25% (more precisely 14.9%, 20.1%, 24.6%).

**Indian context.** Classic leveraged buyouts are less common in India than in the US and Europe, because of restrictions on Indian banks financing acquisitions of shares, promoter-controlled targets, and FEMA rules; Indian PE deals are often minority growth investments or control deals with modest leverage, sometimes using NBFC or offshore financing [VERIFY: RBI restrictions on bank finance for acquisition of shares; FEMA rules on leverage for acquisitions]. Control buyouts have increased in sectors such as IT services, healthcare and consumer [VERIFY: recent Indian buyout data].

**Common mistakes.**
- Forgetting fees in sources and uses.
- Using exit multiples higher than entry without justification (relying on multiple expansion).
- Ignoring minimum cash and mandatory amortisation in the sweep.

**Interview angle.**
1. *Walk me through an LBO.* Determine purchase price and sources and uses, project cash flows, use them to pay interest and repay debt, then at exit apply a multiple to EBITDA, subtract remaining net debt, and compute IRR and MOIC on the sponsor's equity.
2. *Why does leverage increase returns?* It reduces the equity cheque; as debt is repaid from the company's cash flows, the equity's share of EV grows. It also increases risk.
3. *What makes a good LBO candidate?* Stable cash flows, low capex, defensible market position, improvement levers, and a credible exit.

**Related topics:** [14.3] Value creation and returns attribution, [11.4] Debt schedules, [8.6] Capital structure.

---

### [14.3] PE Value Creation Levers and Returns Attribution
<!-- tags: domain=private-equity-vc; level=advanced; roles=PE,Consulting,CF; keywords=value creation plan, EBITDA growth, multiple expansion, deleveraging, operational improvement, 100-day plan, buy-and-build, returns attribution, add-on acquisitions -->

**Definition.** PE value creation is the set of levers a sponsor uses to grow equity value between entry and exit. Returns attribution breaks the equity gain into contributions from EBITDA growth, multiple expansion and debt paydown.

**Why it matters.** Modern PE returns depend more on operational improvement than on financial engineering. Interviewers ask how a fund would create value in a specific company, and how to attribute returns.

**Core mechanics.**
**Levers:**
- **Revenue growth:** pricing, new products, geographic expansion, sales force effectiveness, digital channels
- **Margin expansion:** procurement, operational excellence, footprint optimisation, SG&A efficiency
- **Capital efficiency:** working capital reduction, capex discipline
- **Buy-and-build:** acquire add-ons at lower multiples than the platform (multiple arbitrage) and integrate
- **Governance and talent:** professional management, incentive plans (management equity), board oversight
- **Financial:** optimal leverage, refinancing, recapitalisation
- **Exit:** positioning for IPO or strategic sale; timing

**Returns attribution (entry and exit at the same multiple):**
- EBITDA growth contribution = (Exit EBITDA − Entry EBITDA) × Entry multiple
- Multiple expansion contribution = (Exit multiple − Entry multiple) × Exit EBITDA
- Deleveraging contribution = Net debt at entry − Net debt at exit
- Less: fees and costs

**Worked example: attribution for the LBO in [14.2]** (₹ Cr):

| Source | Calculation | Value |
|---|---|---|
| EBITDA growth | (161.05 − 100) × 8.0 | 488.4 |
| Multiple expansion | (8.0 − 8.0) × 161.05 | 0.0 |
| Debt paydown | 400 − 159.8 | 240.2 |
| Fees | | (16.0) |
| **Total equity gain** | 1,128.6 − 416 | **712.6** |

About 69% of the gain comes from EBITDA growth and 34% from deleveraging, net of fees. A buy-and-build twist: acquiring an add-on with ₹20 Cr EBITDA at 6x (₹120 Cr) and exiting it within the platform at 8x creates ₹40 Cr of multiple arbitrage before any synergies.

**Indian context.** Indian PE investors increasingly take control and pursue operational value creation in mid-market companies, often professionalising promoter-run businesses (governance, systems, management depth) ahead of IPO exits [VERIFY: industry reports (e.g., Bain India PE report, IVCA)].

**Common mistakes.**
- Attributing returns to "operations" without separating multiple expansion driven by market conditions.
- Overpaying on entry assuming multiple expansion at exit.
- Neglecting management incentives.

**Interview angle.**
1. *What are the three sources of LBO returns?* EBITDA growth, multiple expansion and debt paydown (deleveraging).
2. *How would you create value in a mid-sized Indian consumer company?* Distribution expansion, premiumisation, procurement savings, working capital discipline, professional management and add-on acquisitions, positioning for an IPO.
3. *Why is multiple expansion considered low-quality return?* It depends on market conditions outside the sponsor's control rather than on improving the business.

**Related topics:** [14.2] LBO mechanics, [12.7] Post-merger integration, [4.9] Quality of earnings.

---

### [14.4] Venture Capital: Stages, Instruments and Term Sheets
<!-- tags: domain=private-equity-vc; level=intermediate; roles=PE,Fintech-PM,Consulting; keywords=venture capital stages, seed, Series A, term sheet, liquidation preference, participating preferred, anti-dilution, full ratchet, weighted average, pro rata rights, board seats, drag-along, tag-along, SAFE, convertible note -->

**Definition.** Venture capital funds early-stage, high-growth companies in exchange for equity (usually preferred shares). The term sheet sets the economic and control terms of each round.

**Why it matters.** Startup employees and PMs at venture-backed companies, as well as VC candidates, need to understand how preferences and anti-dilution affect who gets paid at exit, which is often very different from headline ownership percentages.

**Core mechanics.**
**Stages:** pre-seed / angel → seed → Series A (product-market fit) → Series B/C (scaling) → growth / late stage → pre-IPO.

**Instruments:** preferred shares (in India usually CCPS), convertible notes, SAFEs (simple agreements for future equity; in India, structures such as iSAFE notes are used within regulatory limits).

**Key economic terms:**
- **Valuation:** pre-money, post-money, option pool (often required to be created before the round, "pre-money", which dilutes existing holders)
- **Liquidation preference:** investors get their money back (1x or more) before common shareholders on a sale or liquidation
  - Non-participating: choose preference or conversion (whichever is higher)
  - Participating: get preference and then share pro rata in the remainder ("double dip")
- **Anti-dilution protection** in down rounds:
  - Full ratchet: conversion price drops to the new lower price
  - Broad-based weighted average: CP₂ = CP₁ × (A + B) / (A + C), where A = shares outstanding before the round (fully diluted), B = shares the new money would buy at CP₁, C = new shares actually issued
- **Dividends:** usually non-cumulative and rarely paid

**Key control terms:** board seats, protective provisions (veto rights), information rights, pro rata (pre-emptive) rights, right of first refusal (ROFR), tag-along, drag-along, founder vesting, non-compete.

**Worked example 1: liquidation preference.** Series A invested ₹30 Cr for 20% with a 1x non-participating preference.

| Exit value | Convert (20%) | Preference | Series A takes | Others get |
|---|---|---|---|---|
| ₹100 Cr | 20 | 30 | 30 (preference) | 70 |
| ₹300 Cr | 60 | 30 | 60 (convert) | 240 |
| ₹100 Cr, participating | — | 30 + 20% × 70 = 44 | 44 | 56 |

**Worked example 2: anti-dilution.** Series A price ₹840; 17,85,714 fully diluted shares before Series B. Series B raises ₹12 Cr at ₹600 (a down round): C = 2,00,000 new shares; B = 12 Cr / 840 = 1,42,857.
- Broad-based weighted average: CP₂ = 840 × (17,85,714 + 1,42,857) / (17,85,714 + 2,00,000) = **₹815.8**
  - Series A's 3,57,143 preferred shares convert into 3,57,143 × 840 / 815.8 = **3,67,725 shares** (+10,582)
- Full ratchet: CP₂ = ₹600 → converts into **5,00,000 shares** (+1,42,857), much more dilutive to founders

**Indian context.** Indian VC deals typically use CCPS for FEMA compliance, with shareholders' agreements (SHA) and share subscription agreements (SSA) carrying the terms. Indian law treats some investor rights (e.g., assured returns, put options at guaranteed prices for foreign investors) restrictively under FEMA [VERIFY: FEMA NDI Rules on optionality clauses and pricing]. Recent Indian VC activity data: Tracxn, Venture Intelligence, IVCA reports [VERIFY: current data].

**Common mistakes.**
- Treating headline valuation as the only important term.
- Ignoring preference stacks across multiple rounds (later investors often senior or pari passu).
- Underestimating the dilution from option pool top-ups.

**Interview angle.**
1. *What's a 1x non-participating liquidation preference?* The investor gets the higher of its money back or its pro rata share of proceeds as if converted.
2. *Why do founders resist full ratchet anti-dilution?* In a down round it reprices earlier investors' shares to the new low price, heavily diluting founders and employees.
3. *Which matters more, valuation or terms?* Both, but aggressive terms (participating preferences, high multiples, full ratchet) can make a higher headline valuation worse for founders than a lower clean one.

**Related topics:** [14.5] Cap tables, [10.8] Startup valuation, [8.10] Sources of finance.

---

### [14.5] Cap Tables, Dilution and the Option Pool Shuffle
<!-- tags: domain=private-equity-vc; level=intermediate; roles=PE,Fintech-PM,CF; keywords=cap table, capitalisation table, dilution, fully diluted shares, ESOP pool, option pool shuffle, price per share, round modelling, founder ownership -->

**Definition.** A capitalisation (cap) table lists a company's securities and who owns them, on a basic and fully diluted basis. Round modelling shows how each financing round changes ownership.

**Why it matters.** Founders, employees with ESOPs and investors all need to know what they will actually own after future rounds. PM candidates at startups often get asked about ESOP value and dilution.

**Core mechanics.**
- **Price per share** = Pre-money valuation / Pre-money fully diluted shares
- **New shares issued** = Investment / Price per share
- **Post-money ownership** = Investment / Post-money valuation (for the new investor)
- **Dilution** to existing holders = New shares / Post-money fully diluted shares
- **Option pool shuffle:** if investors require the ESOP pool to be created or expanded before the round (counted in pre-money), the dilution falls entirely on existing shareholders, so the effective pre-money is lower than the headline.

**Worked example.**
Start: founders hold 10,00,000 shares.

*Seed round:* ₹4 Cr at ₹16 Cr pre-money.
- Price = 16 Cr / 10,00,000 = **₹160**; new shares = 4 Cr / 160 = 2,50,000
- Post-money = ₹20 Cr; founders 80%, seed 20%

*Series A:* ₹30 Cr at ₹120 Cr pre-money; investors require a new ESOP pool of 10% of post-money, created pre-money.
- Post-money = ₹150 Cr; Series A owns 30 / 150 = **20%**; ESOP 10%; existing holders (founders + seed) 70%
- Total post-money shares = 12,50,000 / 0.70 = **17,85,714**
- Price per share = 150 Cr / 17,85,714 = **₹840**
- Series A shares = 3,57,143; ESOP pool = 1,78,571

| Holder | Shares | Ownership |
|---|---|---|
| Founders | 10,00,000 | 56.0% |
| Seed investor | 2,50,000 | 14.0% |
| ESOP pool | 1,78,571 | 10.0% |
| Series A | 3,57,143 | 20.0% |
| **Total** | **17,85,714** | **100%** |

Effective pre-money for existing holders = 70% × 150 = **₹105 Cr**, not the headline ₹120 Cr: the option pool shuffle shifted ₹15 Cr of value.

**Indian context.** Indian startups' ESOP schemes are governed by the Companies Act (section 62(1)(b)) and rules, and startups recognised by DPIIT have relaxations (e.g., ESOPs to promoters within a period) [VERIFY: Companies (Share Capital and Debentures) Rules, rule 12 and DPIIT startup relaxations]. Employees face perquisite tax on exercise (with deferral for eligible startups) [VERIFY: section 17(2)(vi) and section 192(1C)].

**Common mistakes.**
- Calculating ownership on basic rather than fully diluted shares.
- Ignoring that unallocated ESOP pools dilute everyone when granted.
- Forgetting to include convertible notes and SAFEs converting at the round.

**Interview angle.**
1. *What's the option pool shuffle?* Creating the ESOP pool in the pre-money valuation, which makes existing shareholders bear all the pool's dilution and lowers the effective pre-money.
2. *A founder owns 60% before raising ₹20 Cr at ₹80 Cr pre-money. Ownership after?* 60% × 80/100 = 48%.
3. *How would you value your ESOPs at a startup?* Number of options × (expected exit price per share − strike), discounted for time, probability of success and liquidation preferences ahead of common shares.

**Related topics:** [14.4] Term sheets, [2.11] ESOP accounting, [10.8] Startup valuation.

---

### [14.6] Exits, Secondaries and the Indian PE/VC Landscape
<!-- tags: domain=private-equity-vc; level=intermediate; roles=PE,IB,Fintech-PM,Consulting; keywords=exit routes, IPO exit, strategic sale, secondary sale, sponsor-to-sponsor, buyback exit, continuation fund, AIF categories, India PE trends, DPI pressure -->

**Definition.** An exit is how a PE or VC investor converts its stake into cash. Secondaries are sales of existing stakes (or fund interests) to other investors rather than new primary capital.

**Why it matters.** Funds are judged on realised returns (DPI). Exit routes and timing shape investment decisions from day one, and the Indian market's IPO activity has made public-market exits increasingly important.

**Core mechanics.**
**Exit routes:**

| Route | Description | Pros | Cons |
|---|---|---|---|
| IPO | List and sell over time (OFS at IPO, then blocks) | Often the highest valuation | Market-dependent; lock-ins; partial exits |
| Strategic sale | Sell to a corporate | Synergy-driven premium; full exit | Limited buyers; regulatory approval |
| Secondary (sponsor-to-sponsor) | Sell to another PE fund | Speed, certainty | Possibly lower price |
| Secondary sale of minority stakes | Sell to other investors in private rounds | Partial liquidity | Discount to primary |
| Buyback / promoter purchase | Company or promoter buys back | Simple | Depends on promoter funds; contractual put rights |
| Continuation fund | GP moves assets to a new vehicle with new LPs | More time for winners | Conflict-of-interest scrutiny |
| Write-off | Failure | Tax loss | Capital lost |

**Exit readiness:** audited, Ind AS-compliant financials; governance (independent directors, audit committee); clean cap table and legal structure; management depth; equity story.

**Worked example: exit mix effect on IRR.** A fund invested ₹100 Cr in year 0. Option A: strategic sale for ₹300 Cr in year 5 (MOIC 3.0x, IRR 24.6%). Option B: IPO in year 5 with 40% sold for ₹130 Cr, the rest sold for ₹220 Cr in year 7.
- Option B MOIC = (130 + 220) / 100 = **3.5x**; IRR solves 100 = 130/(1 + r)⁵ + 220/(1 + r)⁷ → **r ≈ 22.6%**
- Higher MOIC but lower IRR, because most of the cash arrives later. LPs focused on DPI and IRR may prefer A's earlier full exit; LPs focused on absolute gains may prefer B.

**Indian context.** Indian PE/VC exits via public markets (IPOs and block trades) have grown substantially in recent years, alongside secondary transactions as the ecosystem matures [VERIFY: IVCA/Bain/Venture Intelligence exit data]. SEBI rules require pre-IPO shareholders (other than certain exempt categories) to be locked in for six months after listing, which affects exit timing [VERIFY: SEBI ICDR Regulation 17 lock-in for pre-issue capital and exemptions for VCFs/AIFs]. Startup "reverse flipping" (moving domicile back to India before IPO) has become common [VERIFY: recent reverse-flip regulatory facilitation].

**Common mistakes.**
- Assuming an IPO is a full exit (it usually isn't immediately).
- Ignoring tax and lock-in effects on net proceeds.
- Neglecting exit preparation until late in the hold period.

**Interview angle.**
1. *What exit routes does a PE fund have?* IPO, strategic sale, secondary sale to another fund, buyback or promoter purchase, continuation funds; write-off in failures.
2. *Why might a fund accept a lower price from a strategic buyer than a potential IPO valuation?* Certainty, full exit, speed and DPI; an IPO involves market risk and lock-ins.
3. *What are secondaries and why are they growing?* Sales of existing stakes or fund interests to new investors; they provide liquidity to LPs and early investors as holding periods lengthen.

**Related topics:** [14.1] Fund metrics, [13.3] IPO process, [12.6] Regulatory framework.

---

## Module 14 Glossary

| Term | Definition |
|---|---|
| AIF | Alternative Investment Fund (SEBI-registered) |
| Anti-dilution | Protection adjusting conversion price in down rounds |
| Carried interest | GP's share of fund profits (typically 20%) |
| Catch-up | Tier giving the GP a high share until it reaches its full carry |
| DPI | Distributions / Paid-in capital |
| Drag-along | Right forcing minority holders to join a sale |
| Hurdle rate | Preferred return LPs receive before carry |
| J-curve | Early negative returns before exits |
| Liquidation preference | Right to proceeds before common shareholders |
| LBO | Leveraged buyout |
| MOIC | Multiple on invested capital |
| Option pool shuffle | Creating ESOP pool in pre-money, diluting existing holders |
| Sources and uses | Table showing how a deal is funded and where money goes |
| Tag-along | Right for minority holders to join a sale on the same terms |
| TVPI | (Distributions + NAV) / Paid-in capital |

## Module 14 Rapid-Fire Quiz

1. MOIC 2x over 5 years. Approximate IRR? **About 15%**
2. EV ₹600 Cr, debt ₹350 Cr, fees ₹10 Cr. Sponsor equity? **₹260 Cr**
3. Three sources of LBO returns? **EBITDA growth, multiple expansion, debt paydown**
4. ₹10 Cr invested at ₹40 Cr pre-money. Investor stake? **20%**
5. 1x non-participating preference, invested ₹50 Cr for 25%; exit ₹120 Cr. Investor takes? **₹50 Cr (preference)**
6. Which waterfall is more LP-friendly? **European (whole-fund)**
7. DPI of 0.4 means? **40% of paid-in capital returned in cash**
8. Founder owns 50%; raise at ₹90 Cr pre / ₹10 Cr investment. Founder after? **45%**
9. More founder-friendly anti-dilution? **Broad-based weighted average**
10. SEBI category for most VC funds? **Category I AIF**

## Module 14 [VERIFY] Items

1. SEBI AIF Regulations 2012: categories and minimum investment; IFSCA Fund Management Regulations 2022
2. RBI restrictions on bank finance for acquisitions of shares; FEMA rules on acquisition leverage; Indian buyout data
3. Industry reports on PE value creation in India
4. FEMA NDI Rules on optionality clauses; current VC activity data
5. Companies (Share Capital and Debentures) Rules rule 12; DPIIT startup ESOP relaxations; ESOP taxation and deferral
6. IVCA/Bain exit data; SEBI ICDR Regulation 17 lock-in; reverse-flip facilitation

---

# Module 15: Equity Markets

### [15.1] Indian Equity Market Structure: Exchanges, Clearing, Depositories and Settlement
<!-- tags: domain=equity-markets; level=foundation; roles=ER,IB,Fintech-PM,Consulting; keywords=market structure, primary market, secondary market, NSE, BSE, clearing corporation, depository, NSDL, CDSL, demat, T+1 settlement, market infrastructure institutions -->

**Definition.** Equity market structure is the set of institutions and processes through which shares are issued (primary market) and traded (secondary market): exchanges, brokers, clearing corporations, depositories and regulators.

**Why it matters.** Wealthtech and broking product managers (Groww, Zerodha-type firms), fintech strategy roles and equity analysts need to know how a trade flows from an app to settlement, and which institution does what.

**Core mechanics.**
- **Primary market:** companies issue new securities (IPOs, QIPs, rights).
- **Secondary market:** investors trade existing securities on exchanges.
- **Market infrastructure institutions (MIIs):**
  - Stock exchanges: NSE (largest by volumes, especially derivatives), BSE (oldest, large number of listed companies), MSE
  - Clearing corporations: NSE Clearing (NCL), Indian Clearing Corporation (ICCL); they become the central counterparty (novation), guaranteeing settlement and managing margins
  - Depositories: NSDL and CDSL hold securities in electronic (demat) form; investors access them through depository participants (DPs, usually brokers or banks)
- **Intermediaries:** stockbrokers (full-service and discount), depository participants, registrars and transfer agents (RTAs), custodians, investment advisers, research analysts
- **Trade lifecycle:**
  1. Investor places an order through a broker's app or terminal
  2. Exchange matches buy and sell orders (price-time priority in a continuous order book)
  3. Clearing corporation novates and calculates obligations and margins
  4. Settlement: funds and securities move; India settles equity trades on **T+1** (with an optional same-day T+0 cycle for selected stocks)
  5. Depository updates demat accounts
- **Trading sessions:** pre-open call auction (9:00–9:15 am, with order entry until about 9:08), normal market (9:15 am–3:30 pm), closing session
- **Risk controls:** upfront margins, peak margin reporting, price bands and circuit breakers, client fund segregation, mandatory upfront collection of margins

**Worked example.** An investor buys 100 shares at ₹500 on Monday (T).
- Order matched on the exchange; contract note issued the same day
- Funds blocked or debited (with UPI block mechanism or broker ledger)
- On Tuesday (T+1), the clearing corporation settles; shares credited to the investor's demat account
- If the investor sells the same shares on Monday itself (intraday), positions net off and no delivery occurs

**Indian context.** India moved fully to T+1 settlement in January 2023, among the first major markets to do so, and SEBI introduced an optional T+0 settlement for a limited set of stocks in 2024 [VERIFY: SEBI circulars on T+1 (2021–23) and T+0 beta (March 2024) and its extension]. SEBI also introduced the ASBA-like "UPI block mechanism" for secondary market trades [VERIFY: SEBI circular on ASBA facility in secondary market (2024–25)]. Demat accounts in India have grown rapidly, crossing well over 15 crore [VERIFY: current NSDL/CDSL demat account count].

**Common mistakes.**
- Confusing the exchange (matching) with the clearing corporation (settlement guarantee) and depository (holding).
- Thinking brokers hold investors' shares in their own names (shares sit in investors' demat accounts, though pledge and margin structures exist).
- Ignoring that intraday trades don't settle via delivery.

**Interview angle.**
1. *Walk me through what happens when I buy a share on an app.* The broker routes the order to the exchange, which matches it; the clearing corporation becomes the counterparty and collects margins; on T+1, funds and shares settle; the depository credits shares to my demat account.
2. *What's the role of a clearing corporation?* It acts as central counterparty to every trade (novation), guaranteeing settlement and managing default risk through margins and a settlement guarantee fund.
3. *Why did India move to T+1?* To reduce counterparty and settlement risk, free up capital faster for investors and brokers, and improve efficiency.

**Related topics:** [15.2] Market participants, [15.4] Trading mechanics, [21.8] Wealthtech and broking.

---

### [15.2] Market Participants and Flows: FPIs, DIIs, Retail and Mutual Funds
<!-- tags: domain=equity-markets; level=foundation; roles=ER,Fintech-PM,Consulting,IB; keywords=FPI, foreign portfolio investors, DII, domestic institutional investors, retail investors, mutual funds, SIP flows, promoters, HNI, market ownership -->

**Definition.** Market participants are the investor groups that own and trade shares: promoters, foreign portfolio investors (FPIs), domestic institutional investors (DIIs: mutual funds, insurers, pension funds, banks), retail and high-net-worth individuals (HNIs), and proprietary traders.

**Why it matters.** Who owns and trades the market shapes liquidity, volatility and valuations. India's shift toward domestic flows (SIPs) and retail participation is a major structural story for fintech, wealthtech and asset management roles.

**Core mechanics.**

| Participant | Characteristics | Market influence |
|---|---|---|
| Promoters | Founders and controlling groups; large, stable holdings | Governance, free float |
| FPIs | Foreign institutions registered with SEBI; Category I and II | Large, sometimes volatile flows linked to global risk appetite, USD and rates |
| DIIs: mutual funds | Pooled retail and institutional money; growing via SIPs | Steady domestic buying |
| DIIs: insurers (e.g., LIC) | Long-term investors | Stabilising, large holdings |
| DIIs: pension funds (EPFO, NPS) | Growing equity allocation | Long-term domestic flows |
| Retail investors | Individual investors (direct and via apps) | Rising participation; concentrated in small caps and derivatives |
| HNIs and family offices | Larger individual portfolios | PMS, AIFs, direct |
| Proprietary traders and HFTs | Trading for own account | Liquidity, derivatives volumes |

- **Free float:** shares not held by promoters or locked in; drives index weights and liquidity.
- **Flows:** FPI net flows often move with the dollar, US yields and global risk appetite; DII flows have offset FPI selling in recent years.
- **Ownership data:** quarterly shareholding patterns filed with exchanges.

**Worked example.** A stock has a market capitalisation of ₹50,000 Cr; promoters hold 55%, FPIs 20%, DIIs 15%, retail 10%.
- Free float ≈ 45% → free-float market cap ≈ ₹22,500 Cr (index weight is based on this)
- If FPIs cut their holding from 20% to 15% (₹2,500 Cr of selling) and DIIs absorb it, the price impact depends on how quickly and at what price DIIs buy; with SIP inflows running steadily, such absorption has become more common.

**Indian context.** Monthly SIP contributions to Indian mutual funds have grown to well above ₹25,000 Cr in recent periods, and DII ownership of listed Indian equities has risen to match or exceed FPI ownership [VERIFY: AMFI monthly SIP data; NSE market pulse ownership data]. FPI investment limits (generally below 10% per FPI per company, with aggregate limits up to sectoral caps) and registration are governed by SEBI FPI Regulations 2019 [VERIFY: SEBI FPI Regulations and investment limits].

**Common mistakes.**
- Assuming FPI selling always crashes markets (domestic flows have increasingly cushioned it).
- Ignoring free float when assessing liquidity.
- Treating retail participation growth as purely positive (much activity is in high-risk derivatives).

**Interview angle.**
1. *Why have Indian markets become less dependent on FPIs?* Steady domestic SIP inflows, growing insurance and pension allocations to equities, and rising direct retail participation.
2. *What drives FPI flows into India?* Global risk appetite, US interest rates and dollar strength, India's relative growth and valuations, and currency expectations.
3. *What's free float and why does it matter?* Shares available for trading (excluding promoters and locked-in holdings); it drives index weights and liquidity.

**Related topics:** [15.3] Indices, [15.9] Mutual funds, [22.4] Capital flows.

---

### [15.3] Stock Market Indices and Index Construction
<!-- tags: domain=equity-markets; level=foundation; roles=ER,Fintech-PM,Consulting; keywords=Nifty 50, Sensex, free-float market capitalisation, index weighting, index rebalancing, divisor, large cap mid cap small cap classification, sectoral indices -->

**Definition.** A stock market index tracks the performance of a basket of stocks. Most major indices are weighted by free-float market capitalisation.

**Why it matters.** Indices are benchmarks for fund performance, the basis of index funds, ETFs and derivatives, and a shorthand for market direction. Index inclusion drives passive flows into stocks.

**Core mechanics.**
- **Weighting methods:**
  - Free-float market cap weighted (Nifty 50, Sensex): larger free-float companies have bigger weights
  - Price weighted (Dow Jones): higher-priced stocks dominate
  - Equal weighted: each stock has the same weight
  - Factor or smart-beta indices: weights based on value, momentum, quality, low volatility
- **Index level** = Current free-float market cap of constituents / Base free-float market cap × Base index value. A divisor is adjusted for corporate actions (rights, buybacks, constituent changes) so that these don't change the index level.
- **Key Indian indices:** Nifty 50 (50 large companies, NSE), BSE Sensex (30 companies), Nifty Next 50, Nifty Midcap 150, Nifty Smallcap 250, Nifty Bank, sectoral and thematic indices.
- **Rebalancing:** periodic (Indian broad indices semi-annually) based on eligibility criteria (free-float market cap, liquidity, trading frequency).
- **SEBI cap classification for mutual funds:** large cap = top 100 companies by full market cap, mid cap = 101st–250th, small cap = 251st onwards (lists published by AMFI twice a year).

**Worked example.** A three-stock free-float index with base value 1,000.

| Stock | Price (base) | Price (now) | Free-float shares (Cr) | FF mcap base (₹ Cr) | FF mcap now (₹ Cr) |
|---|---|---|---|---|---|
| A | 100 | 110 | 10 | 1,000 | 1,100 |
| B | 50 | 45 | 20 | 1,000 | 900 |
| C | 200 | 240 | 5 | 1,000 | 1,200 |
| **Total** | | | | **3,000** | **3,200** |

- Index now = 3,200 / 3,000 × 1,000 = **1,066.7** (up 6.7%)
- Weights now: A 34.4%, B 28.1%, C 37.5%

**Indian context.** Index methodology documents are published by NSE Indices (NSE) and Asia Index (a BSE–S&P Dow Jones partnership) [VERIFY: current Nifty and Sensex methodology, rebalancing frequency]. SEBI has introduced concentration limits for indices used in derivatives (e.g., single-stock weight caps in sectoral indices) [VERIFY: SEBI circular on eligibility criteria for derivatives on non-benchmark indices (2025)].

**Common mistakes.**
- Assuming full market cap determines weight (it's free float).
- Ignoring that index returns are price returns unless a total return index (TRI) is used; fund benchmarks use TRI.
- Confusing Sensex (30 stocks) with Nifty 50 (50 stocks).

**Interview angle.**
1. *How is the Nifty 50 calculated?* Free-float market cap weighted index of 50 large, liquid NSE stocks, scaled to a base value, with a divisor adjusted for corporate actions.
2. *Why does index inclusion move a stock's price?* Passive funds and ETFs tracking the index must buy it, creating predictable demand.
3. *What's the difference between a price index and a total return index?* TRI assumes dividends are reinvested; it's the correct benchmark for fund performance.

**Related topics:** [15.9] Mutual funds and ETFs, [17.8] Index derivatives, [18.6] Performance measurement.

---

### [15.4] Trading Mechanics: Orders, Margins, Short Selling and Circuit Limits
<!-- tags: domain=equity-markets; level=intermediate; roles=Fintech-PM,ER,Consulting; keywords=market order, limit order, stop-loss order, bid-ask spread, margin trading facility, leverage, short selling, securities lending and borrowing, price bands, circuit breakers, intraday -->

**Definition.** Trading mechanics are the rules and tools for buying and selling shares: order types, margin and leverage, short selling, and price controls such as circuit limits.

**Why it matters.** Broking and wealthtech PMs design order flows, risk checks and margin products around these rules. Analysts need them to understand liquidity and price behaviour.

**Core mechanics.**
**Order types:**
- Market order: executes immediately at the best available price
- Limit order: executes only at the specified price or better
- Stop-loss (SL) order: becomes active when a trigger price is hit (SL-limit or SL-market)
- Good-till-cancelled (GTT) or good-till-triggered orders (broker-specific features)
- After-market orders (AMO): placed outside hours, sent at the open

**Liquidity:** bid-ask spread, market depth (order book), impact cost (the cost of executing a given order size).

**Margin and leverage:**
- Margin trading facility (MTF): broker funds part of a delivery purchase, charging interest, with shares pledged as collateral
- Leverage magnifies gains and losses; margin calls occur when equity falls below maintenance levels

**Short selling:**
- Selling shares you don't own, aiming to buy back cheaper
- India permits short selling for all investor classes, but naked short selling is not allowed in the cash segment (sellers must deliver at settlement); shares can be borrowed through the securities lending and borrowing (SLB) mechanism
- Intraday short sells must be squared off by the close

**Price controls:**
- Stock-level price bands (2%, 5%, 10%, 20%) for stocks not in derivatives; dynamic bands for F&O stocks
- Market-wide index circuit breakers at 10%, 15% and 20% moves (halts with durations depending on time of day)

**Worked example 1: margin leverage.** An investor buys ₹1,00,000 of shares with ₹50,000 own money and ₹50,000 MTF funding at 15% a year.
- Stock rises 10% in one month → position ₹1,10,000; interest ≈ ₹625; equity ≈ ₹59,375 → return ≈ **+18.8%**
- Stock falls 10% → position ₹90,000; equity ≈ ₹39,375 → return ≈ **−21.3%**

**Worked example 2: short sale.** A trader short-sells 100 shares at ₹500 intraday and buys back at ₹480: profit = 100 × 20 = **₹2,000** before costs. If the stock rose to ₹530 instead, loss = ₹3,000; losses are theoretically unlimited.

**Indian context.** SEBI's peak margin framework requires upfront collection of margins for intraday positions, which cut extreme intraday leverage offered by brokers from 2021 [VERIFY: SEBI peak margin circulars]. Transaction costs include brokerage, securities transaction tax (STT), exchange charges, GST, SEBI fees and stamp duty [VERIFY: current STT rates after Budget 2024 changes].

**Common mistakes.**
- Using market orders in illiquid stocks (large slippage).
- Ignoring interest and margin call risk in leveraged positions.
- Assuming circuit limits protect value (they can trap investors who can't exit).

**Interview angle.**
1. *Limit vs market order?* A market order guarantees execution but not price; a limit order guarantees price but not execution.
2. *How does short selling work in India?* You sell first and must deliver by settlement; for positions beyond the day you borrow shares through SLB; naked shorting in cash isn't allowed.
3. *As a PM at a broker, how would you design a margin product responsibly?* Clear disclosure of leverage and interest, real-time risk checks, automated margin alerts, conservative haircuts for volatile stocks, and suitability nudges.

**Related topics:** [15.1] Market structure, [17.8] F&O in India, [21.8] Wealthtech.

---

### [15.5] The Equity Research Process and Research Reports
<!-- tags: domain=equity-markets; level=intermediate; roles=ER,IB,PE,Consulting; keywords=equity research, sell-side, buy-side, initiation report, target price, rating, earnings model, channel checks, investment thesis, SEBI research analyst regulations -->

**Definition.** Equity research analyses companies and sectors to form investment views. Sell-side analysts (at brokers and banks) publish reports with ratings and target prices; buy-side analysts (at funds) make recommendations to portfolio managers.

**Why it matters.** ER is a common MBA finance destination, and the research process (thesis, model, valuation, catalysts) is useful for any investment-oriented interview, including "pitch me a stock".

**Core mechanics.**
**Research process:**
1. **Industry understanding:** market size, growth drivers, competitive structure (Porter's five forces), regulation
2. **Company analysis:** business model, moats, management quality, governance, capital allocation
3. **Financial model:** detailed forecasts (driver-based), three statements, segment build
4. **Valuation:** DCF, relative multiples, SOTP; target price typically 12 months out
5. **Thesis and variant perception:** what the market is missing
6. **Catalysts:** events that could re-rate the stock (results, launches, regulation, M&A)
7. **Risks:** what would break the thesis
8. **Monitoring:** quarterly results, management calls, channel checks, data tracking

**Report types:** initiation of coverage (deep dive), results updates, sector reports, thematic notes, flash notes.

**Ratings:** typically Buy / Hold (Neutral) / Sell (or Add / Reduce), based on expected return vs a threshold or benchmark.

**Worked example: target price.** FY28E EPS ₹50; target P/E 25x (vs 5-year average 23x, justified by improving ROE).
- Target price = 50 × 25 = **₹1,250**
- Current market price ₹1,000 → expected upside **25%** (plus dividend yield)
- Rating: **Buy** if the house's threshold is, say, above 15% upside
- Cross-check with DCF; state the bear case (e.g., P/E 18x on EPS ₹45 → ₹810, −19%).

"Pitch me a stock" structure (60–90 seconds): company and recommendation → 2–3 thesis points with numbers → valuation and upside → catalysts → key risk and what would change your mind.

**Indian context.** Research analysts in India must be registered under SEBI (Research Analysts) Regulations, 2014 with disclosures on conflicts of interest; SEBI has tightened rules on unregistered "finfluencers" giving advice [VERIFY: SEBI RA Regulations amendments (2024–25) and finfluencer restrictions].

**Common mistakes.**
- A thesis that simply repeats consensus ("strong management, good growth").
- Target prices built on an arbitrary multiple without justification.
- No clear catalysts or risks.

**Interview angle.**
1. *Pitch me a stock.* Lead with the recommendation and target, give 2–3 differentiated reasons with numbers, valuation, catalysts and the main risk.
2. *What's the difference between buy-side and sell-side research?* Sell-side publishes research for clients and earns through broking or banking relationships; buy-side analysts work for funds making actual investment decisions.
3. *How do you know your thesis is wrong?* Set measurable markers in advance (margin, growth, market share milestones) and review them each quarter.

**Related topics:** [15.6] Fundamental analysis, [5.4] Annual report analysis, [10.6] Comps.

---

### [15.6] Fundamental Analysis and Stock Screening
<!-- tags: domain=equity-markets; level=foundation; roles=ER,Fintech-PM,PE,Consulting; keywords=fundamental analysis, top-down, bottom-up, economy industry company, moat, competitive advantage, quality investing, value investing, growth investing, screening criteria -->

**Definition.** Fundamental analysis estimates a security's intrinsic value from economic, industry and company factors. Screening filters a universe of stocks using quantitative criteria to find candidates for deeper research.

**Why it matters.** It's the backbone of long-term investing and equity research, and the basis for stock-screening features in wealthtech apps.

**Core mechanics.**
- **Top-down (EIC):** Economy (growth, rates, inflation, currency) → Industry (growth, structure, cyclicality, regulation) → Company (position, financials, management).
- **Bottom-up:** start with individual company quality and valuation regardless of macro.
- **Sources of competitive advantage (moats):** brands, network effects, switching costs, cost advantages (scale, process), regulatory licences, intangible assets.
- **Investment styles:**
  - Value: buying below intrinsic value (low P/E, P/B, high dividend yield)
  - Growth: high earnings growth, often at higher multiples
  - Quality: high ROCE, low leverage, consistent earnings, good governance
  - GARP (growth at a reasonable price)
  - Momentum: buying recent winners
- **Screening criteria examples:** ROCE > 15% for 5 years; debt/equity < 0.5; revenue and PAT CAGR > 12%; CFO/PAT > 0.8; promoter pledge = 0; P/E below 5-year median.

**Worked example: quality-at-reasonable-price screen.**

| Criterion | Threshold | Company X | Company Y |
|---|---|---|---|
| 5-year average ROCE | > 18% | 24% ✓ | 14% ✗ |
| Debt / equity | < 0.5 | 0.2 ✓ | 0.3 ✓ |
| 5-year revenue CAGR | > 12% | 15% ✓ | 18% ✓ |
| CFO / PAT (5-year cumulative) | > 0.9 | 1.05 ✓ | 0.6 ✗ |
| P/E vs 5-year median | Below | 28x vs 32x ✓ | 20x vs 18x ✗ |

X passes and moves to deep research; Y's low cash conversion is a red flag despite faster growth.

**Indian context.** Indian investors widely use screening platforms (Screener, Tickertape, Trendlyne) built on exchange filings. Governance screens matter more in India (promoter pledges, related-party transactions, auditor history) [VERIFY: platform features]. SEBI-registered investment advisers and research analysts must follow suitability and disclosure rules when recommending stocks.

**Common mistakes.**
- Treating a screen as a buy list rather than a starting point.
- Over-fitting screens to past winners.
- Ignoring valuation for quality stocks (great companies can be poor investments at high prices).

**Interview angle.**
1. *What makes a company a good long-term investment?* Durable competitive advantage, high returns on capital with reinvestment opportunities, honest and capable management, sound balance sheet, and a reasonable price.
2. *What is a moat? Give an Indian example type.* A durable advantage protecting returns, such as network effects in payments platforms, distribution reach in FMCG, or low-cost deposit franchises in banking.
3. *Value vs growth investing?* Value buys cheap relative to fundamentals; growth pays up for high expected growth. Quality and GARP blend the two.

**Related topics:** [15.5] Equity research, [4.3] Return metrics, [18.4] Factor models.

---

### [15.7] Technical Analysis Basics
<!-- tags: domain=equity-markets; level=foundation; roles=Fintech-PM,ER; keywords=technical analysis, trend, support and resistance, moving averages, golden cross, RSI, MACD, volume, candlestick, Dow theory, chart patterns -->

**Definition.** Technical analysis studies price and volume patterns to forecast price movements, on the premise that prices reflect all information and move in trends.

**Why it matters.** A large share of retail trading in India uses technical tools; broking app PMs build charting and indicator features. Understanding it, and its limits, is useful for wealthtech roles.

**Core mechanics.**
- **Trend:** higher highs and higher lows (uptrend) or the reverse; Dow theory's primary, secondary and minor trends.
- **Support and resistance:** price levels where buying or selling has repeatedly emerged.
- **Moving averages:** simple (SMA) and exponential (EMA). A "golden cross" is the 50-day crossing above the 200-day; a "death cross" is the reverse.
- **Momentum oscillators:**
  - RSI (relative strength index) = 100 − 100 / (1 + RS), where RS = average gain / average loss over a period (often 14). Above 70 is "overbought", below 30 "oversold".
  - MACD = 12-day EMA − 26-day EMA, with a 9-day EMA signal line.
- **Volume:** confirms moves; price rises on high volume carry more weight.
- **Patterns:** head and shoulders, double tops and bottoms, triangles, flags; candlestick patterns (doji, engulfing).
- **Risk management:** stop-losses and position sizing are central to technical trading.

**Worked example: RSI.** Over 14 days, the average daily gain is ₹2 and the average daily loss is ₹1.
- RS = 2 / 1 = 2
- RSI = 100 − 100 / 3 = **66.7** (strong but not overbought)

Moving average signal: a stock's 50-day SMA rises from ₹480 to ₹505 while the 200-day SMA is ₹500 → golden cross; technical traders read this as a bullish trend signal.

**Indian context.** SEBI's studies of retail derivatives trading found that a large majority of individual traders lost money, a caution against short-term trading strategies based on technical signals [VERIFY: SEBI study on F&O trader profitability (2023, 2024)].

**Common mistakes.**
- Treating indicators as predictive in isolation.
- Ignoring transaction costs, which erode short-term strategies.
- Data-mining patterns that don't hold out of sample.

**Interview angle.**
1. *What's the difference between fundamental and technical analysis?* Fundamental analysis estimates intrinsic value from business economics; technical analysis forecasts price from price and volume patterns.
2. *Does technical analysis work?* Evidence is mixed: momentum effects are documented, but most simple trading rules fail after costs, and markets are fairly efficient for liquid stocks.
3. *As a PM, how would you design charting for retail investors responsibly?* Provide tools with clear explanations, highlight risk and costs, and avoid gamified nudges toward excessive trading.

**Related topics:** [15.8] Market efficiency, [15.4] Trading mechanics, [17.8] F&O in India.

---

### [15.8] Market Efficiency and Behavioural Finance
<!-- tags: domain=equity-markets; level=intermediate; roles=ER,Fintech-PM,Consulting,PE; keywords=efficient market hypothesis, weak form, semi-strong form, strong form, anomalies, momentum, value premium, behavioural biases, overconfidence, loss aversion, herding, disposition effect -->

**Definition.** The efficient market hypothesis (EMH) holds that prices reflect available information, so consistently beating the market on a risk-adjusted basis is difficult. Behavioural finance studies how psychological biases cause systematic deviations.

**Why it matters.** These ideas underpin the active vs passive debate, product design in wealthtech (nudges, defaults), and investor education. Interviewers like asking whether markets are efficient.

**Core mechanics.**
**EMH forms:**
- Weak form: prices reflect past price and volume data (technical analysis can't consistently beat the market)
- Semi-strong: prices reflect all public information (fundamental analysis of public data can't consistently beat the market)
- Strong form: prices reflect all information, including private (even insiders can't beat it; contradicted by insider trading evidence)

**Anomalies challenging EMH:** momentum, value premium, size effect, post-earnings announcement drift, low-volatility anomaly.

**Behavioural biases:**

| Bias | Description | Investment effect |
|---|---|---|
| Overconfidence | Overestimating one's skill | Excessive trading |
| Loss aversion | Losses hurt about twice as much as equal gains (prospect theory) | Holding losers, avoiding risk |
| Disposition effect | Selling winners too early, holding losers too long | Lower returns |
| Herding | Following the crowd | Bubbles and crashes |
| Anchoring | Over-relying on a reference point (e.g., purchase price) | Poor exits |
| Recency bias | Overweighting recent events | Chasing performance |
| Mental accounting | Treating money differently by source or label | Inconsistent decisions |
| Confirmation bias | Seeking confirming information | Thesis drift |

**Limits to arbitrage:** mispricings can persist because arbitrage is costly and risky (short-selling constraints, noise trader risk).

**Worked example: loss aversion.** An investor bought at ₹500; the stock is now ₹400 and fair value is ₹380. A rational investor sells (expected further loss); a loss-averse investor holds "until it gets back to ₹500", anchoring on purchase price. Meanwhile, they sell a winner bought at ₹300, now ₹450, with fair value ₹550, to "lock in gains". Both decisions reduce expected wealth (disposition effect).

**Indian context.** India's surge in retail participation, especially in options trading, has been accompanied by evidence of behavioural biases and heavy losses; SEBI introduced measures in 2024 to curb speculative excess in index derivatives [VERIFY: SEBI October 2024 F&O framework measures]. Wealthtech apps use defaults (SIP auto-debits) and friction (risk warnings) as behavioural tools.

**Common mistakes.**
- Claiming markets are perfectly efficient or wildly inefficient; reality is "mostly efficient with exploitable pockets" that vary by market segment.
- Confusing past outperformance with skill.

**Interview angle.**
1. *Are markets efficient?* Large, liquid markets are largely efficient for public information, so most active managers underperform after fees; inefficiencies persist in less-covered segments and through behavioural effects.
2. *Give an example of a behavioural bias you'd design around as a PM.* Loss aversion and the disposition effect: show portfolio-level goal progress rather than individual red losses, and offer rebalancing nudges.
3. *Why do anomalies persist?* Risk-based explanations, behavioural biases and limits to arbitrage.

**Related topics:** [15.9] Active vs passive, [18.4] Factor models, [21.8] Wealthtech.

---

### [15.9] Mutual Funds, ETFs and Passive vs Active Investing
<!-- tags: domain=equity-markets; level=foundation; roles=Fintech-PM,ER,Consulting; keywords=mutual funds, NAV, AUM, expense ratio, direct vs regular plans, SIP, ETF, index fund, tracking error, SEBI fund categorisation, AMFI, exit load -->

**Definition.** A mutual fund pools money from investors and invests in securities, with units priced at net asset value (NAV). Exchange-traded funds (ETFs) are funds that trade on exchanges like shares. Passive funds track an index; active funds try to beat one.

**Why it matters.** Mutual fund distribution and SIPs are core to Indian wealthtech (Groww, Paytm Money, Zerodha Coin, ET Money). PMs need to understand costs, categories and investor behaviour.

**Core mechanics.**
- **NAV** = (Market value of assets − Liabilities) / Units outstanding; computed daily for open-ended funds.
- **Expense ratio (TER):** annual fund costs as % of AUM, deducted from NAV. SEBI caps TER by fund size and type.
- **Direct vs regular plans:** direct plans have no distributor commission, so lower TER; regular plans pay trail commission to distributors.
- **Exit loads:** charges for early redemption.
- **SIP:** systematic investment plan; fixed periodic investment (rupee cost averaging).
- **SEBI categorisation:** equity (large cap, mid cap, small cap, flexi cap, multi cap, ELSS, sectoral/thematic, etc.), debt (by duration and credit), hybrid, solution-oriented, index funds and ETFs, fund of funds.
- **ETFs:** trade intraday on exchanges; creation and redemption by authorised participants keeps price close to NAV.
- **Index funds:** mutual funds tracking indices; transact at NAV.
- **Tracking error:** standard deviation of the difference between fund and index returns.
- **Active vs passive:** active funds charge more and must beat benchmarks after fees; persistence of outperformance is limited, especially in large caps.

**Worked example 1: NAV.** Fund assets ₹1,050 Cr; liabilities ₹50 Cr; units 50 Cr → NAV = 1,000 / 50 = **₹20.00**.

**Worked example 2: cost of fees.** ₹10 lakh invested for 15 years at a 12% gross return.
- Direct plan (TER 0.5%): 10 × 1.115¹⁵ ≈ **₹51.2 lakh**
- Regular plan (TER 1.5%): 10 × 1.105¹⁵ ≈ **₹44.7 lakh**
- A 1% annual fee difference costs about **₹6.5 lakh**, roughly 13% of the final corpus.

**Indian context.** Indian mutual fund AUM has grown rapidly, with SIPs and equity funds driving flows; AMFI publishes monthly data [VERIFY: current AMFI industry AUM and SIP figures]. SEBI regulates mutual funds under the SEBI (Mutual Funds) Regulations, 1996, with TER limits, categorisation (2017) and risk-o-meters [VERIFY: current TER slabs and any 2025 revisions; SEBI Specialised Investment Funds (SIF) framework 2025]. ELSS funds offer tax deductions only under the old personal tax regime [VERIFY: section 80C availability under the new regime].

**Common mistakes.**
- Comparing funds on past returns alone without risk, costs or benchmark.
- Ignoring the compounding drag of fees.
- Confusing ETF market price with NAV.

**Interview angle.**
1. *Direct or regular plan?* Direct is cheaper; regular pays for advice and convenience. For investors who don't need advice, direct is better over long horizons.
2. *How would you improve SIP retention as a PM?* Goal-based framing, auto-step-up, smart reminders before debits, education during market falls, frictionless pause instead of cancel.
3. *Active or passive for an Indian large-cap allocation?* Passive is increasingly hard to beat in large caps after fees; active management may add more value in mid and small caps, though with higher dispersion.

**Related topics:** [15.3] Indices, [18.6] Performance measurement, [21.8] Wealthtech.

---

## Module 15 Glossary

| Term | Definition |
|---|---|
| Circuit breaker | Market-wide trading halt triggered by index moves |
| Clearing corporation | Central counterparty guaranteeing trade settlement |
| Demat account | Electronic account holding securities |
| Depository | Institution holding securities electronically (NSDL, CDSL) |
| DII | Domestic institutional investor |
| EMH | Efficient market hypothesis |
| ETF | Exchange-traded fund |
| Expense ratio (TER) | Annual fund costs as % of assets |
| Free float | Shares available for public trading |
| FPI | Foreign portfolio investor |
| NAV | Net asset value per unit |
| RSI | Relative strength index |
| SLB | Securities lending and borrowing |
| T+1 | Settlement one business day after trade |
| Tracking error | Volatility of a fund's return difference from its index |

## Module 15 Rapid-Fire Quiz

1. India's standard equity settlement cycle? **T+1**
2. Which institutions hold shares in demat form? **NSDL and CDSL**
3. Avg gain ₹3, avg loss ₹1 over 14 days. RSI? **75**
4. Index weights in Nifty 50 are based on? **Free-float market cap**
5. Fund assets ₹520 Cr, liabilities ₹20 Cr, 25 Cr units. NAV? **₹20**
6. SEBI large cap definition? **Top 100 companies by full market cap**
7. Which EMH form says fundamental analysis of public data can't beat the market? **Semi-strong**
8. Market order guarantees? **Execution, not price**
9. Bias of selling winners early and holding losers? **Disposition effect**
10. Naked short selling in the Indian cash market: allowed? **No**

## Module 15 [VERIFY] Items

1. SEBI circulars on T+1, T+0 and secondary market ASBA/UPI block; current demat account count
2. AMFI SIP data; NSE ownership data; SEBI FPI Regulations and investment limits
3. Nifty and Sensex methodology; SEBI derivatives eligibility for non-benchmark indices
4. SEBI peak margin circulars; current STT rates
5. SEBI RA Regulations amendments and finfluencer restrictions
6. Screening platform features
7. SEBI F&O trader profitability studies; October 2024 F&O framework measures
8. AMFI industry AUM; SEBI TER slabs and SIF framework; section 80C under the new regime

---

# Module 16: Fixed Income

### [16.1] Bond Basics and Terminology
<!-- tags: domain=fixed-income; level=foundation; roles=ER,IB,CF,Fintech-PM; keywords=bond, face value, coupon, maturity, yield, clean price, dirty price, accrued interest, secured, unsecured, senior, subordinated, callable, puttable -->

**Definition.** A bond is a debt security in which the issuer borrows money from investors and promises to pay periodic interest (coupons) and repay the principal (face value) at maturity.

**Why it matters.** Bonds fund governments and companies, set the risk-free rate used in all valuation, and make up a large part of bank, insurer and mutual fund portfolios. Treasury, DCM, fixed income research and fintech investment products all start here.

**Core mechanics.**

| Term | Meaning |
|---|---|
| Face (par) value | Amount repaid at maturity (often ₹100 or ₹1,000; corporate NCDs commonly ₹1 lakh or more) |
| Coupon rate | Annual interest as % of face value |
| Coupon frequency | Annual, semi-annual (Indian G-secs), quarterly |
| Maturity / tenor | When principal is repaid |
| Yield to maturity (YTM) | Discount rate equating PV of cash flows to price |
| Clean price | Quoted price excluding accrued interest |
| Dirty (full) price | Clean price + accrued interest (what the buyer pays) |
| Accrued interest | Coupon earned since the last payment date |
| Seniority | Senior secured → senior unsecured → subordinated → hybrid/perpetual |
| Embedded options | Callable (issuer can redeem early), puttable (holder can sell back), convertible |
| Covenants | Issuer obligations and restrictions |

- Price and yield move inversely.
- Bonds trade at a premium when coupon > yield, at par when coupon = yield, and at a discount when coupon < yield.

**Worked example: accrued interest.** A G-sec with 7.10% coupon (semi-annual, ₹3.55 per half-year per ₹100) last paid a coupon 60 days ago; the coupon period uses a 30/360 convention (180 days).
- Accrued interest = 3.55 × 60/180 = **₹1.183**
- If the clean price is ₹101.50, the dirty price = **₹102.683** per ₹100 face

**Indian context.** Indian G-secs pay semi-annual coupons and use a 30/360 day count; T-bills are zero-coupon discounted instruments [VERIFY: RBI/FIMMDA market conventions]. Corporate bond face values for private placements were reduced to ₹1 lakh (from ₹10 lakh) to widen retail access [VERIFY: SEBI circular reducing face value of debt securities (2022, 2024)].

**Common mistakes.**
- Confusing the coupon rate with yield.
- Ignoring accrued interest when comparing prices.
- Assuming "secured" means risk-free (security value and enforcement matter).

**Interview angle.**
1. *Why do bond prices fall when interest rates rise?* Existing bonds pay fixed coupons; when market yields rise, their fixed cash flows are discounted at higher rates, so prices fall to give new buyers the market yield.
2. *What's the difference between clean and dirty price?* Dirty price includes accrued interest since the last coupon; clean price excludes it and is how bonds are usually quoted.
3. *When does a bond trade at a premium?* When its coupon exceeds the current market yield for its risk and tenor.

**Related topics:** [16.2] Pricing and yields, [16.7] Indian debt market, [1.1] TVM.

---

### [16.2] Bond Pricing and Yield Measures
<!-- tags: domain=fixed-income; level=intermediate; roles=ER,IB,CF,Fintech-PM; keywords=bond pricing, yield to maturity, current yield, yield to call, zero-coupon bond, T-bill yield, spot rates, bootstrapping, forward rates, semi-annual compounding -->

**Definition.** A bond's price is the present value of its future cash flows discounted at the market yield. Different yield measures (current yield, YTM, yield to call, spot and forward rates) capture different aspects of return.

**Why it matters.** Pricing bonds and converting between prices and yields is a core fixed income skill tested in treasury, markets and research interviews.

**Core mechanics.**
- **Price** = Σ C / (1 + y/m)^t + F / (1 + y/m)^n, with m coupon periods per year
- **Current yield** = Annual coupon / Price (ignores capital gains or losses)
- **YTM:** the internal rate of return of the bond's cash flows, assuming held to maturity, no default, and coupons reinvested at YTM
- **Yield to call (YTC):** yield assuming the bond is called at the first call date and call price; for callable bonds trading at a premium, investors consider yield to worst (the lower of YTM and YTC)
- **Zero-coupon bonds:** Price = F / (1 + y)^n
- **T-bill yield (Indian convention):** Yield = (100 − Price) / Price × 365 / Days to maturity
- **Spot (zero) rates:** yields on zero-coupon cash flows for each maturity, derived from coupon bond prices by **bootstrapping**
- **Forward rates:** implied future rates, e.g., (1 + s₂)² = (1 + s₁)(1 + f₁,₁)

**Worked example 1: pricing.** 5-year bond, 8% annual coupon, face ₹100, YTM 7%.
- Price = 8/1.07 + 8/1.07² + 8/1.07³ + 8/1.07⁴ + 108/1.07⁵ = **₹104.10**
- At YTM 8%: **₹100.00** (par); at 9%: **₹96.11**
- Current yield at ₹104.10 = 8 / 104.10 = **7.68%**

**Worked example 2: semi-annual G-sec.** 10-year G-sec, 7.25% coupon (semi-annual), market yield 6.80%: price = **₹103.23**.

**Worked example 3: T-bill.** A 91-day T-bill priced at ₹98.30: yield = 1.70 / 98.30 × 365/91 = **6.94%**.

**Worked example 4: yield to call.** A 10-year 9% bond, callable at ₹102 in 3 years, priced at ₹104.
- YTM = **8.39%**; YTC = **8.06%** → yield to worst = 8.06%

**Worked example 5: bootstrapping.** 1-year spot rate 6.00%; a 2-year 6.5% annual coupon bond trades at par (₹100).
- 100 = 6.5/1.06 + 106.5/(1 + s₂)² → s₂ = **6.52%**
- Implied 1-year rate one year forward = 1.0652² / 1.06 − 1 = **7.04%**

**Indian context.** RBI sells T-bills (91, 182, 364 days) and dated G-secs through auctions; market prices and yields are published by CCIL and FBIL, with FBIL also publishing benchmark rates and valuation curves [VERIFY: FBIL benchmarks and CCIL data].

**Common mistakes.**
- Using annual compounding for semi-annual bonds.
- Assuming YTM is the realised return regardless of reinvestment rates and holding period.
- Ignoring yield to worst for callable bonds.

**Interview angle.**
1. *What is YTM and what does it assume?* The single discount rate equating the bond's cash flows to its price; it assumes holding to maturity, no default, and reinvestment of coupons at the same yield.
2. *A bond's price is above par. Is its YTM above or below the coupon?* Below the coupon.
3. *What are forward rates?* Interest rates for future periods implied by today's spot rates; under the pure expectations hypothesis, they are the market's forecast of future spot rates.

**Related topics:** [16.3] Duration, [16.5] Yield curve, [1.3] Annuities.

---

### [16.3] Interest Rate Risk: Duration
<!-- tags: domain=fixed-income; level=intermediate; roles=ER,CF,Fintech-PM,IB; keywords=Macaulay duration, modified duration, price sensitivity, interest rate risk, DV01, PV01, portfolio duration, duration matching, immunisation -->

**Definition.** Duration measures a bond's sensitivity to interest rate changes. Macaulay duration is the weighted average time to receive cash flows; modified duration approximates the percentage price change for a 1% change in yield.

**Why it matters.** Duration is the main risk number for bond portfolios, debt mutual funds, bank treasuries and insurers' asset-liability management. Investors in debt funds see "modified duration" in factsheets.

**Core mechanics.**
- **Macaulay duration** = Σ [t × PV(CFₜ)] / Price
- **Modified duration** = Macaulay duration / (1 + y/m)
- **Approximate price change:** %ΔP ≈ −Modified duration × Δy
- **DV01 (PV01)** = Modified duration × Price × 0.0001: rupee change in price for a 1 basis point change in yield
- **Drivers:** longer maturity → higher duration; higher coupon → lower duration; higher yield → lower duration; a zero-coupon bond's Macaulay duration equals its maturity
- **Portfolio duration** ≈ weighted average of individual durations (by market value)
- **Immunisation:** matching the duration of assets to the investment horizon (or to liabilities) so rate changes offset reinvestment and price effects

**Worked example.** 5-year 8% annual coupon bond at YTM 7% (price ₹104.10).
- Macaulay duration = **4.33 years**
- Modified duration = 4.33 / 1.07 = **4.04**
- If yields rise 100 bps, estimated price change = −4.04 × 1% = **−4.04%** (actual −3.94%, see convexity in [16.4])
- DV01 = 4.04 × 104.10 × 0.0001 = **₹0.042** per ₹100 face; on a ₹100 Cr face holding, about **₹4.2 lakh** per basis point

Debt fund application: a gilt fund with modified duration 4.2 years loses about 4.2 × 0.5% = **2.1%** of NAV if yields rise 50 bps.

**Indian context.** SEBI requires debt mutual fund categories to maintain specified Macaulay duration ranges (e.g., short duration 1–3 years, medium 3–4 years, long duration above 7 years), and factsheets disclose portfolio duration and YTM [VERIFY: SEBI mutual fund categorisation circular (2017) duration ranges]. Banks manage interest rate risk in the banking book (IRRBB) using duration gap and earnings-at-risk measures [VERIFY: RBI IRRBB guidelines].

**Common mistakes.**
- Using Macaulay instead of modified duration for price sensitivity.
- Applying duration to large rate moves without convexity.
- Ignoring that duration changes as time passes and yields move.

**Interview angle.**
1. *What's duration?* A measure of a bond's price sensitivity to yield changes, and also the weighted average time to receive its cash flows.
2. *Which has higher duration: a 10-year zero or a 10-year 8% coupon bond?* The zero (duration 10 years); coupons bring cash earlier, reducing duration.
3. *RBI is expected to cut rates. Which debt fund benefits most?* Long-duration funds (gilt or long-duration categories), since prices rise most when yields fall, if the cut isn't already priced in.

**Related topics:** [16.4] Convexity, [16.9] Debt funds, [19.7] ALM.

---

### [16.4] Convexity and Measuring Bond Price Changes Accurately
<!-- tags: domain=fixed-income; level=advanced; roles=ER,CF,IB; keywords=convexity, positive convexity, negative convexity, callable bonds, mortgage-backed securities, duration-convexity approximation, effective duration -->

**Definition.** Convexity measures the curvature of the price-yield relationship: how duration itself changes as yields change. It improves the duration estimate for larger yield moves.

**Why it matters.** Duration alone understates gains when yields fall and overstates losses when yields rise for normal bonds. Convexity also explains why callable bonds and mortgage-backed securities behave differently.

**Core mechanics.**
- %ΔP ≈ −Modified duration × Δy + ½ × Convexity × (Δy)²
- Convexity = Σ [t(t + 1) × CFₜ / (1 + y)^(t+2)] / Price (annual compounding)
- **Positive convexity** (option-free bonds): prices rise more when yields fall than they fall when yields rise; valuable to investors
- **Negative convexity** (callable bonds, mortgage-backed securities): price gains are capped as yields fall because issuers call or borrowers prepay
- **Effective duration and effective convexity:** computed by repricing the bond at yields shifted up and down, used for bonds with embedded options
- Longer maturity and lower coupons → higher convexity

**Worked example.** 5-year 8% bond at YTM 7%: modified duration 4.04; convexity **21.54**.

| Yield change | Duration only | Duration + convexity | Actual |
|---|---|---|---|
| +100 bps | −4.04% | −4.04% + ½ × 21.54 × 0.0001 = **−3.94%** | −3.94% |
| −100 bps | +4.04% | +4.04% + 0.11% = **+4.15%** | +4.15% |

The asymmetry (+4.15% vs −3.94%) is the benefit of positive convexity.

Callable bond: if the 10-year 9% bond callable at ₹102 sees yields fall sharply, its price stays near ₹102–104 because the issuer is likely to call, while an otherwise identical non-callable bond would keep rising.

**Indian context.** Indian corporate bonds and some bank capital instruments (e.g., AT1 bonds with call options) carry call features; pass-through certificates from securitised retail loan pools carry prepayment risk [VERIFY: RBI Master Direction on Securitisation of Standard Assets (2021)].

**Common mistakes.**
- Ignoring convexity for large moves or long-dated bonds.
- Treating callable bonds as having the same duration as non-callable bonds.
- Forgetting that convexity is "paid for" with lower yields in efficient markets.

**Interview angle.**
1. *Why is positive convexity valuable?* Gains from falling yields exceed losses from rising yields of the same size, which helps in volatile rate environments.
2. *Why do callable bonds have negative convexity?* As yields fall, the issuer is likely to call, capping the price, so price appreciation slows exactly when it would otherwise accelerate.
3. *How do you estimate a bond's price change for a 200 bps move?* Use duration plus the convexity adjustment, or fully reprice the bond.

**Related topics:** [16.3] Duration, [16.8] Instruments with embedded options, [17.3] Options.

---

### [16.5] The Yield Curve and Term Structure Theories
<!-- tags: domain=fixed-income; level=intermediate; roles=ER,IB,CF,Fintech-PM,Consulting; keywords=yield curve, term structure, normal yield curve, inverted yield curve, flat curve, expectations hypothesis, liquidity premium, market segmentation, steepening, flattening, recession signal -->

**Definition.** The yield curve plots yields of bonds of the same credit quality (usually government) against maturity. Term structure theories explain its shape.

**Why it matters.** The curve sets the benchmark for pricing all debt, signals market expectations for policy rates and growth, and drives banks' and fintech lenders' funding and pricing strategies.

**Core mechanics.**
**Shapes:**
- Normal (upward sloping): longer maturities yield more (most common)
- Inverted: short rates above long rates; historically a recession signal in the US
- Flat: little difference
- Humped: intermediate maturities highest

**Theories:**
- **Pure expectations:** long rates equal the average of expected future short rates; forward rates are unbiased forecasts
- **Liquidity preference:** investors demand a premium for holding longer bonds, so curves slope up even if rates are expected to stay flat
- **Market segmentation:** separate supply and demand in each maturity segment set yields independently
- **Preferred habitat:** investors prefer certain maturities but will shift for enough extra yield

**Curve moves:**
- Parallel shift: all yields move by the same amount
- Steepening: long yields rise relative to short (often expectations of growth or inflation, or fiscal supply)
- Flattening: the gap narrows (often tighter monetary policy)
- **Curve trades:** e.g., a "steepener" buys short bonds and sells long bonds, duration-weighted

**Worked example.** Yields: 1-year 6.0%, 2-year 6.5%.
- Under pure expectations, the implied 1-year rate one year from now = 1.065² / 1.06 − 1 = **7.0%**, suggesting markets expect rates to rise
- Under liquidity preference, part of the 0.5% term spread is a premium, so the expected future rate is somewhat lower than 7.0%

Interpreting a policy move: if RBI cuts the repo rate 25 bps and short-term yields fall 25 bps while 10-year yields fall only 5 bps, the curve steepens (bull steepening); long yields are anchored by fiscal supply, inflation expectations and global yields.

**Indian context.** The Indian G-sec curve is influenced by RBI's policy rate and liquidity operations, government borrowing calendars, inflation expectations, and global factors including FPI flows after India's inclusion in global bond indices (JP Morgan GBI-EM from June 2024, phased; Bloomberg and FTSE indices subsequently) [VERIFY: index inclusion dates and weights]. FBIL publishes the benchmark G-sec curve [VERIFY: FBIL curve methodology].

**Common mistakes.**
- Reading the curve purely as rate expectations, ignoring term premia and supply effects.
- Assuming inversion predicts recessions in every market equally.
- Comparing yields across different credit qualities as one curve.

**Interview angle.**
1. *What does an inverted yield curve signal?* Markets expect policy rates to fall, often because of expected economic weakness; in the US it has preceded many recessions.
2. *How does an RBI rate cut affect the yield curve?* Short-term yields fall most directly; long-term yields depend on inflation expectations, fiscal supply and global yields, so the curve often steepens.
3. *How does the yield curve affect a bank's profitability?* Banks borrow short and lend long; a steeper curve generally widens margins, a flatter or inverted one compresses them.

**Related topics:** [16.2] Spot and forward rates, [25.2] Monetary policy, [19.2] Bank metrics.

---

### [16.6] Credit Risk, Spreads and Credit Ratings
<!-- tags: domain=fixed-income; level=intermediate; roles=ER,IB,CF,Fintech-PM; keywords=credit risk, credit spread, default probability, loss given default, expected loss, credit rating scale, investment grade, rating migration, credit rating agencies India, CRISIL, ICRA -->

**Definition.** Credit risk is the risk that a borrower fails to pay interest or principal. The credit spread is the extra yield investors demand over a risk-free bond of the same maturity. Credit ratings are agencies' opinions on relative credit risk.

**Why it matters.** Spreads price risk in corporate bonds, loans and fintech lending products. Credit research, DCM and lending PM roles all require reading spreads and ratings, and understanding their limits (India's 2018–19 NBFC defaults followed very late rating actions).

**Core mechanics.**
- **Spread components:** expected loss + credit risk premium + liquidity premium (+ tax and other effects)
- **Expected loss (EL)** = PD × LGD (annualised), with LGD = 1 − recovery rate
- **Rating scales (long term, Indian agencies):** AAA, AA, A, BBB (investment grade, BBB− and above); BB, B, C (speculative); D (default). Modifiers + and −. Short-term scale: A1+ to A4, D.
- **Rating outlook / watch:** positive, negative, stable; watch with developing implications.
- **Rating migration:** probability of moving between ratings over a year; downgrades raise spreads and can trigger forced selling.
- **Credit analysis (4–5 Cs):** character (management, track record), capacity (cash flows, coverage), capital (leverage), collateral (security), conditions (industry, macro).
- **Structural protections:** security cover, covenants, escrow, guarantees, credit enhancement (partial credit guarantees).

**Worked example.** A 3-year AA corporate bond yields 7.8%; the 3-year G-sec yields 6.5% → spread **130 bps**.
- If annual PD is 1% and recovery is 40% (LGD 60%), expected loss ≈ 1% × 60% = **0.6%**
- The remaining 0.7% compensates for liquidity, risk premium and uncertainty about the PD estimate

A downgrade to A might widen the spread to 200 bps; with modified duration 2.7, the price falls by about 2.7 × 0.7% = **1.9%**.

**Indian context.** SEBI regulates credit rating agencies (CRAs) under the SEBI (Credit Rating Agencies) Regulations, 1999 and requires disclosure of default and transition statistics; failures around IL&FS (2018) and DHFL (2019) led to tighter rules on rating actions and disclosures [VERIFY: SEBI CRA Regulations and post-2019 circulars]. RBI's IRACP norms and capital rules use external ratings for risk weights on corporate exposures [VERIFY: RBI Basel III standardised approach risk weights by rating].

**Common mistakes.**
- Treating ratings as precise default probabilities.
- Ignoring liquidity premiums in spreads (illiquid Indian corporate bonds trade wide).
- Relying on ratings without independent analysis (rating agencies lagged in past crises).

**Interview angle.**
1. *What drives a corporate bond spread?* Default probability, expected recovery, liquidity, risk premium for uncertainty and market conditions.
2. *What does investment grade mean?* Ratings of BBB− and above; many regulated investors can hold only investment grade (or higher thresholds such as AA).
3. *What did the IL&FS crisis teach about ratings?* Ratings can lag fundamentals, especially asset-liability mismatches and group-level risks; investors must analyse liquidity and structure independently.

**Related topics:** [20.3] Credit risk measurement, [19.5] Credit appraisal, [13.6] DCM.

---

### [16.7] The Indian Debt Market: G-secs, T-bills, SDLs, Corporate Bonds and Money Markets
<!-- tags: domain=fixed-income; level=intermediate; roles=CF,ER,Fintech-PM,IB; keywords=Indian debt market, G-sec, T-bill, state development loans, primary dealers, NDS-OM, CCIL, RBI Retail Direct, corporate bonds, commercial paper, certificates of deposit, TREPS, call money, FAR -->

**Definition.** India's debt market comprises government securities (central G-secs and T-bills, state development loans), corporate bonds, and money market instruments, traded and settled through specialised infrastructure.

**Why it matters.** Treasury roles, debt fund products, retail bond platforms (a growing fintech category) and macro analysis all need a clear map of instruments, participants and infrastructure.

**Core mechanics.**

| Segment | Instruments | Issuer | Key features |
|---|---|---|---|
| Central government | Dated G-secs (up to 40–50 years), T-bills (91/182/364 days), cash management bills, floating rate bonds, inflation-indexed bonds | Government of India (RBI manages issuance) | Auctions, sovereign risk-free |
| States | State development loans (SDLs) | State governments | Spread over G-secs |
| Corporates | NCDs, bonds, CP (up to 1 year) | Companies, NBFCs, PSUs | Rated; private placement dominant |
| Banks | Certificates of deposit (CDs), infrastructure bonds, AT1, Tier 2 | Banks | Funding and capital |
| Money market | Call money, TREPS (tri-party repo), market repo, CBLO (earlier) | Banks, MFs, others | Overnight to 1 year liquidity |

**Infrastructure:**
- RBI: debt manager for government, regulator of G-sec and money markets
- Primary dealers: underwrite G-sec auctions and make markets
- NDS-OM: electronic trading platform for G-secs
- CCIL: central counterparty for G-secs, repo and forex
- FBIL: benchmark rates
- Exchanges (NSE, BSE): corporate bond trading platforms and request-for-quote (RFQ) systems
- **RBI Retail Direct:** lets individuals open gilt accounts with RBI to buy G-secs directly
- Online bond platform providers (OBPPs): SEBI-registered platforms for retail access to corporate bonds

**Worked example.** A treasury manager has ₹100 Cr to park for 3 months.
- Options: 91-day T-bill at 6.9%, 3-month CD of a AAA bank at 7.3%, 3-month CP of a AA NBFC at 7.9%
- Extra yield for CP vs T-bill = 100 bps → about ₹25 lakh more over 3 months on ₹100 Cr, for taking NBFC credit and liquidity risk
- Post-2018 (IL&FS), many treasuries cap exposure to single NBFC CP and prefer bank CDs for liquidity buffers

**Indian context.** India's G-sec market is large and liquid in benchmark tenors, while the corporate bond market is concentrated in AAA/AA issuers and private placements [VERIFY: RBI/SEBI data on corporate bond market size and composition]. FPIs can invest in specified G-secs without limits through the Fully Accessible Route (FAR) [VERIFY: RBI FAR scheme]. SEBI regulates online bond platforms [VERIFY: SEBI OBPP framework (2022) and later changes].

**Common mistakes.**
- Treating all "safe" short-term instruments as equivalent (credit and liquidity differ).
- Ignoring state-level fiscal differences in SDL spreads.
- Overlooking tax treatment differences across instruments.

**Interview angle.**
1. *What's the difference between a T-bill and a dated G-sec?* T-bills are short-term (up to 364 days), zero-coupon and issued at a discount; dated G-secs are longer-term with periodic coupons.
2. *What is TREPS?* Tri-party repo through CCIL, the main overnight secured money market where mutual funds lend and banks and others borrow.
3. *How can a retail investor buy government bonds in India?* RBI Retail Direct, mutual funds (gilt funds, target maturity funds), stock exchange platforms, or online bond platforms.

**Related topics:** [16.6] Credit spreads, [25.2] Monetary policy and liquidity, [21.8] Wealthtech.

---

### [16.8] Other Fixed Income Instruments: Floaters, Zeros, Convertibles, Perpetuals and Securitisation
<!-- tags: domain=fixed-income; level=intermediate; roles=ER,IB,CF,Fintech-PM; keywords=floating rate bonds, zero coupon bonds, convertible bonds, AT1 bonds, perpetual bonds, securitisation, pass-through certificates, direct assignment, green bonds, inflation-indexed bonds -->

**Definition.** Beyond plain fixed-coupon bonds, fixed income includes floating rate notes, zero-coupon bonds, convertibles, perpetual and subordinated bank capital bonds, securitised instruments, and labelled bonds (green, social, sustainability-linked).

**Why it matters.** These instruments carry different risks (rate, credit, prepayment, write-down) and are central to bank capital, NBFC funding and structured finance. Fintech lenders often fund themselves through securitisation and co-lending.

**Core mechanics.**

| Instrument | Key feature | Main risk |
|---|---|---|
| Floating rate bond | Coupon resets to a benchmark + spread | Low rate risk; credit and basis risk |
| Zero-coupon bond | Issued at a discount, no coupons | High duration; no reinvestment risk |
| Inflation-indexed bond | Principal or coupon linked to inflation | Real rate risk |
| Convertible bond | Converts to equity at a set ratio | Equity-linked; lower coupon |
| Perpetual / AT1 bond | No maturity; coupons discretionary; can be written down if capital falls | Write-down and coupon skip risk |
| Tier 2 bond | Subordinated bank capital | Subordination; loss absorption at point of non-viability |
| Securitisation (PTCs) | Pool of loans sold to a trust; investors receive pass-through cash flows; tranching | Credit, prepayment, structure risk |
| Direct assignment (DA) | Lender sells loans directly to another lender | Credit risk transfer |
| Green / sustainability-linked bonds | Proceeds for green projects or coupons linked to KPIs | Greenwashing risk |

**Securitisation structure:** originator (NBFC) → special purpose vehicle (trust) → tranches (senior, mezzanine, equity/first loss) with credit enhancements (overcollateralisation, cash collateral, excess spread), with the originator retaining a minimum risk retention.

**Worked example 1: tranching.** A ₹100 Cr pool of personal loans is split into a senior tranche (₹85 Cr), mezzanine (₹10 Cr) and first-loss (₹5 Cr retained by the originator). If pool losses are ₹8 Cr, the first-loss tranche absorbs ₹5 Cr, mezzanine ₹3 Cr (30% of its value), and seniors lose nothing.

**Worked example 2: zero-coupon.** A 5-year zero priced at a 7% yield: price = 100 / 1.07⁵ = **₹71.30**; Macaulay duration = 5 years.

**Indian context.** RBI's securitisation directions (2021) set minimum retention requirements and minimum holding periods for originators [VERIFY: RBI Master Direction on Securitisation of Standard Assets (2021)]. AT1 bonds issued by Yes Bank were written down in the 2020 reconstruction, a landmark case for Indian investors in bank capital instruments [VERIFY: Yes Bank AT1 write-down and subsequent court rulings]. SEBI and RBI frameworks govern green bonds; the government issues sovereign green bonds [VERIFY: sovereign green bond framework].

**Common mistakes.**
- Treating AT1 bonds as fixed deposits (retail mis-selling was an issue).
- Ignoring prepayment risk in securitised retail pools.
- Assuming floaters carry no risk (credit spread and benchmark mismatch remain).

**Interview angle.**
1. *Why do NBFCs securitise loans?* To raise funds, manage ALM, free up capital, and diversify funding beyond bank loans and bonds.
2. *What made AT1 bonds risky?* They are perpetual, coupons can be skipped, and principal can be written down when a bank's capital falls or regulators intervene.
3. *When would an investor prefer floating rate bonds?* When expecting rates to rise, since coupons reset higher and prices stay stable.

**Related topics:** [16.6] Credit risk, [19.4] Basel III capital, [19.8] Co-lending.

---

### [16.9] Debt Mutual Funds and Managing Fixed Income Portfolios
<!-- tags: domain=fixed-income; level=intermediate; roles=Fintech-PM,ER,CF; keywords=debt mutual funds, liquid funds, gilt funds, credit risk funds, target maturity funds, duration strategy, credit strategy, roll-down, accrual vs duration, Franklin Templeton, debt fund taxation -->

**Definition.** Debt mutual funds invest in bonds and money market instruments; their returns come from accrual (interest income) and mark-to-market changes (duration and credit spread moves). Portfolio managers choose duration, credit quality and liquidity to deliver returns within mandates.

**Why it matters.** Debt funds are core to Indian wealth products and corporate treasury management. Wealthtech PMs must explain risk properly, a lesson reinforced by the 2020 Franklin Templeton scheme closures.

**Core mechanics.**
- **Return sources:**
  - Accrual: portfolio YTM (minus expenses) if yields stay unchanged
  - Duration: price changes from rate moves (≈ −Modified duration × Δy)
  - Credit: spread changes, defaults and rating migrations
  - Roll-down: gains as bonds age into lower-yield parts of a normal curve
- **Categories (SEBI):** overnight, liquid, ultra-short, low duration, money market, short, medium, medium-to-long, long duration, dynamic bond, corporate bond (mostly AA+ and above), credit risk (mostly below AA+), banking and PSU, gilt, floater, target maturity (passive, hold to a defined maturity)
- **Key metrics in factsheets:** YTM, modified duration, Macaulay duration, average maturity, credit quality mix, top issuer exposures
- **Risks:** interest rate, credit, liquidity (redemption pressure in illiquid markets), concentration
- **Strategies:** duration calls (extending duration ahead of expected rate cuts), credit selection, barbell vs bullet portfolios, laddering, roll-down

**Worked example: expected 1-year return.** A short-duration fund has YTM 7.6%, expense ratio 0.4%, modified duration 2.5.
- If yields are unchanged: return ≈ 7.6% − 0.4% = **7.2%**
- If yields fall 50 bps: ≈ 7.2% + 2.5 × 0.5% = **8.45%**
- If yields rise 50 bps: ≈ 7.2% − 1.25% = **5.95%**
- A credit event in a 3% holding with 50% recovery would subtract about **1.5%**

**Indian context.** In April 2020, Franklin Templeton wound up six Indian debt schemes holding lower-rated, illiquid paper amid redemptions, prompting SEBI to tighten liquidity, concentration and stress-testing rules [VERIFY: SEBI circulars post-Franklin Templeton (2020–21) and the Supreme Court-supervised distribution]. From 1 April 2023, gains on debt-oriented mutual funds (with ≤35% equity) bought after that date are taxed at slab rates regardless of holding period [VERIFY: Finance Act 2023 section 50AA and later amendments].

**Common mistakes.**
- Comparing debt funds only on recent returns (a fund that took more duration or credit risk looks best until it doesn't).
- Treating liquid funds as identical to bank deposits.
- Ignoring the portfolio's liquidity relative to investor concentration.

**Interview angle.**
1. *Where do debt fund returns come from?* Accrual (yield), duration (rate moves), credit (spreads and defaults), and roll-down, minus expenses.
2. *What lessons did the Franklin Templeton episode offer?* Liquidity risk matters as much as credit risk in open-ended funds; illiquid lower-rated paper can't be sold quickly when redemptions spike.
3. *As a wealthtech PM, how would you present debt fund risk?* Show YTM alongside duration and credit quality in plain language, scenario-based return ranges, and the risk-o-meter.

**Related topics:** [16.3] Duration, [16.6] Credit risk, [15.9] Mutual funds.

---

## Module 16 Glossary

| Term | Definition |
|---|---|
| Accrued interest | Coupon earned since the last payment date |
| AT1 bond | Additional Tier 1 perpetual bank capital bond |
| Bootstrapping | Deriving spot rates from coupon bond prices |
| Convexity | Curvature of the price-yield relationship |
| Credit spread | Yield over a risk-free bond of the same maturity |
| DV01 | Price change for a 1 bp yield change |
| Forward rate | Implied future interest rate |
| Macaulay duration | Weighted average time to cash flows |
| Modified duration | Approximate % price change per 1% yield change |
| PTC | Pass-through certificate in securitisation |
| SDL | State development loan |
| T-bill | Short-term zero-coupon government security |
| TREPS | Tri-party repo (overnight secured money market) |
| Yield curve | Plot of yields against maturity |
| YTM | Yield to maturity |

## Module 16 Rapid-Fire Quiz

1. Coupon 8%, YTM 9%: premium, par or discount? **Discount**
2. Modified duration 5, yields +40 bps. Approximate price change? **−2%**
3. 91-day T-bill at ₹98.50. Yield (Indian convention)? **About 6.1%**
4. Macaulay duration of a 7-year zero? **7 years**
5. PD 2%, recovery 40%. Expected loss? **1.2%**
6. Lowest investment grade rating? **BBB−**
7. Callable bonds have which convexity at low yields? **Negative**
8. Inverted curve typically signals? **Expected rate cuts / slowdown**
9. Fund YTM 7%, TER 0.5%, duration 3; yields fall 1%. Approximate return? **9.5%**
10. Platform where RBI lets retail buy G-secs directly? **RBI Retail Direct**

## Module 16 [VERIFY] Items

1. RBI/FIMMDA market conventions; SEBI debt security face value changes
2. FBIL benchmarks; CCIL data
3. SEBI mutual fund categorisation duration ranges; RBI IRRBB guidelines
4. RBI Master Direction on Securitisation of Standard Assets (2021)
5. Global bond index inclusion dates and weights; FBIL curve methodology
6. SEBI CRA Regulations and post-2019 circulars; RBI standardised risk weights by rating
7. Corporate bond market size data; RBI FAR scheme; SEBI OBPP framework
8. Yes Bank AT1 write-down and court rulings; sovereign green bond framework
9. SEBI post-Franklin Templeton circulars; Finance Act 2023 section 50AA

---

# Module 17: Derivatives

### [17.1] Derivatives Overview: Forwards vs Futures
<!-- tags: domain=derivatives; level=foundation; roles=ER,CF,Fintech-PM,IB; keywords=derivatives, underlying, forward contract, futures contract, OTC vs exchange-traded, margin, mark-to-market, hedging, speculation, arbitrage -->

**Definition.** A derivative is a contract whose value depends on an underlying asset, rate or index. Forwards and futures are agreements to buy or sell the underlying at a set price on a future date; forwards are private over-the-counter (OTC) contracts, futures are standardised and exchange-traded.

**Why it matters.** Derivatives let companies hedge currency, commodity and interest rate risk, let investors manage portfolio risk, and are a huge part of Indian market volumes (especially index options). Treasury, markets and fintech roles need the basics.

**Core mechanics.**
- **Uses:** hedging (reducing risk), speculation (taking leveraged views), arbitrage (exploiting price differences).
- **Main types:** forwards, futures, options, swaps.
- **Long vs short:** long a forward/future profits if the underlying rises; short profits if it falls.

| Feature | Forward | Future |
|---|---|---|
| Trading venue | OTC (bilateral) | Exchange |
| Terms | Customised | Standardised (lot size, expiry) |
| Counterparty risk | Bilateral | Central counterparty (clearing corporation) |
| Margin | Usually none or collateral agreements | Initial margin + daily mark-to-market |
| Settlement | At maturity | Daily MTM; final settlement at expiry |
| Liquidity | Low | High |
| Typical users in India | Corporates hedging FX with banks | Traders, investors, hedgers on NSE/BSE |

- **Payoff at expiry (long):** S_T − F₀; (short): F₀ − S_T.

**Worked example.** An importer must pay US$1 million in 3 months. Spot USD/INR is 84.00; the 3-month forward rate is 84.60.
- The importer buys USD forward at 84.60 → cost locked at **₹8.46 Cr**
- If spot at maturity is 86.00, the unhedged cost would be ₹8.60 Cr; the hedge saved **₹14 lakh**
- If spot is 83.00, the unhedged cost would have been ₹8.30 Cr; the hedge "cost" ₹16 lakh in hindsight, but removed uncertainty, which is the purpose of hedging.

**Indian context.** Exchange-traded derivatives in India trade on NSE and BSE (equity), MCX and NCDEX (commodities), and currency derivatives on exchanges; OTC FX and interest rate derivatives are regulated by RBI [VERIFY: RBI Master Direction on Risk Management and Inter-Bank Dealings; exchange-traded currency derivative rules on underlying exposure].

**Common mistakes.**
- Judging hedges by hindsight outcomes rather than risk reduction.
- Ignoring margin calls on futures, which can create liquidity strain even when the hedge is economically sound.
- Confusing notional value with capital at risk.

**Interview angle.**
1. *Forward vs future?* Same economics, but futures are standardised, exchange-traded, centrally cleared and marked to market daily; forwards are customised, OTC and carry counterparty risk.
2. *Why would a company hedge if it might lose on the hedge?* To reduce uncertainty in cash flows and margins, protecting planning and creditworthiness; the goal is stability, not profit.
3. *What is mark-to-market?* Daily settlement of gains and losses on futures positions through the margin account.

**Related topics:** [17.2] Futures pricing, [22.3] FX hedging, [17.8] F&O in India.

---

### [17.2] Futures Pricing: Cost of Carry, Basis and Margining
<!-- tags: domain=derivatives; level=intermediate; roles=ER,CF,Fintech-PM; keywords=cost of carry, futures fair value, basis, contango, backwardation, arbitrage, cash-and-carry, initial margin, maintenance margin, SPAN margin -->

**Definition.** The fair price of a futures contract reflects the spot price plus the cost of carrying the underlying until expiry (financing cost) minus any income from it (dividends, convenience yield).

**Why it matters.** Pricing explains arbitrage strategies (cash-and-carry used by arbitrage mutual funds in India), the basis between spot and futures, and how margining creates leverage.

**Core mechanics.**
- **Cost of carry:** F₀ = S₀ × e^((r − q) × T) (continuous) or ≈ S₀ × [1 + (r − q) × T] (simple), where r = financing rate, q = dividend yield, T = time to expiry in years
- For commodities: F₀ = S₀ × e^((r + storage − convenience yield) × T)
- **Basis** = Spot − Futures; converges to zero at expiry
- **Contango:** futures above spot (normal for financial assets when r > q); **backwardation:** futures below spot
- **Arbitrage:**
  - Cash-and-carry: if futures > fair value, buy spot and sell futures, earning a risk-free spread
  - Reverse cash-and-carry: if futures < fair value, sell spot (or holdings) and buy futures
- **Margining:** initial margin (SPAN + exposure margin in India), daily mark-to-market, margin calls if the account falls below the required level
- **Leverage** = Contract value / Margin

**Worked example 1: index futures fair value.** Nifty spot 25,000; financing rate 6.5%; dividend yield 1.2%; 30 days to expiry.
- F ≈ 25,000 × [1 + (0.065 − 0.012) × 30/365] = **25,108.9**
- If futures trade at 25,180, an arbitrageur buys the index basket and sells futures, locking in about 71 points (about 0.28% for a month, before costs)

**Worked example 2: margin and leverage.** One Nifty futures lot of 75 units at 25,000 = contract value ₹18.75 lakh. With total margin of about 12% (₹2.25 lakh):
- Leverage ≈ **8.3x**
- A 2% fall in Nifty (500 points) = loss of ₹37,500, about **17%** of margin, debited the same day

**Indian context.** Arbitrage mutual funds earn returns close to money market rates through cash-and-carry trades and are taxed as equity funds because of their hedged equity exposure [VERIFY: arbitrage fund taxation rules]. Margins are calculated by clearing corporations using SPAN-based methods plus exposure margins, with SEBI-mandated upfront collection [VERIFY: current SEBI/NSE Clearing margin framework]. Contract sizes and lot sizes are set by exchanges within SEBI's minimum contract value rules [VERIFY: current Nifty lot size and minimum contract value].

**Common mistakes.**
- Forgetting dividends in index futures pricing.
- Treating margin as the maximum possible loss.
- Assuming arbitrage is costless (transaction costs, taxes and execution risk matter).

**Interview angle.**
1. *How are futures priced?* Spot plus cost of carry (financing) minus income (dividends), so in normal conditions index futures trade above spot.
2. *What's an arbitrage fund?* A fund that buys stocks in the cash market and sells equivalent futures, capturing the spread as a near risk-free return.
3. *Why can futures losses exceed margin?* Margin is only a fraction of contract value; a large adverse move can wipe it out and require more funds.

**Related topics:** [17.1] Forwards vs futures, [17.8] F&O in India, [1.2] Compounding.

---

### [17.3] Options: Basics, Payoffs and Moneyness
<!-- tags: domain=derivatives; level=foundation; roles=ER,Fintech-PM,CF,IB; keywords=call option, put option, strike price, premium, expiry, European vs American, intrinsic value, time value, in the money, at the money, out of the money, payoff diagram -->

**Definition.** An option gives the buyer the right, but not the obligation, to buy (call) or sell (put) an underlying at a fixed price (strike) on or before expiry, in exchange for a premium paid to the seller (writer).

**Why it matters.** Options are the most traded derivatives in India by contracts. Wealthtech and broking PMs, risk managers and analysts must understand payoffs, risks and why most retail option buyers lose money.

**Core mechanics.**
- **Call payoff at expiry:** buyer = max(S_T − K, 0) − premium; seller = premium − max(S_T − K, 0)
- **Put payoff at expiry:** buyer = max(K − S_T, 0) − premium; seller = premium − max(K − S_T, 0)
- **Buyer:** limited loss (premium), potentially large gain. **Seller:** limited gain (premium), potentially large loss (unlimited for naked calls).
- **Moneyness (calls):** in the money (ITM) S > K; at the money (ATM) S ≈ K; out of the money (OTM) S < K. Reversed for puts.
- **Premium = Intrinsic value + Time value**
  - Intrinsic value (call) = max(S − K, 0); (put) = max(K − S, 0)
  - Time value: reflects the chance of becoming more valuable before expiry; decays to zero at expiry
- **European** options can be exercised only at expiry (Indian index and stock options are European-style and cash-settled for indices; stock options are physically settled); **American** options can be exercised any time.

**Worked example.** Nifty at 25,000. A trader buys a 25,200 call for ₹150 and a colleague buys a 24,800 put for ₹140 (both expiring in 2 weeks).

| Nifty at expiry | Call P&L (per unit) | Put P&L (per unit) |
|---|---|---|
| 24,500 | −150 | 300 − 140 = +160 |
| 25,000 | −150 | −140 |
| 25,350 | 150 − 150 = 0 (breakeven) | −140 |
| 25,600 | 400 − 150 = +250 | −140 |

- Call breakeven = 25,200 + 150 = **25,350**; put breakeven = 24,800 − 140 = **24,660**
- With a lot of 75 units, the call buyer's maximum loss is 150 × 75 = **₹11,250**

**Indian context.** SEBI studies found that around nine in ten individual F&O traders lost money in recent years, with option buying a major source of losses [VERIFY: SEBI F&O studies (January 2023, September 2024)]. Stock options in India are physically settled at expiry if in the money, so traders can be forced to take or give delivery [VERIFY: SEBI physical settlement of stock derivatives].

**Common mistakes.**
- Buying cheap far-OTM options expecting large payoffs (low probability; time decay).
- Writing naked options for "steady income" without managing tail risk.
- Ignoring physical settlement of stock options.

**Interview angle.**
1. *Explain a call option to a non-finance person.* Paying a small fee today for the right to buy something at a fixed price later; if the price rises above it, you profit; if not, you lose only the fee.
2. *Why do most option buyers lose money?* Time decay erodes value daily, OTM options rarely finish in the money, and costs and bid-ask spreads add up.
3. *What's the difference between intrinsic and time value?* Intrinsic is the value if exercised now; time value is the extra premium for the possibility of further favourable moves before expiry.

**Related topics:** [17.4] Option pricing, [17.5] Greeks, [17.6] Strategies.

---

### [17.4] Option Pricing: Put-Call Parity, Binomial Model and Black-Scholes
<!-- tags: domain=derivatives; level=advanced; roles=ER,CF,IB; keywords=option pricing, put-call parity, binomial model, risk-neutral probability, Black-Scholes, implied volatility, volatility smile, India VIX -->

**Definition.** Option pricing models estimate fair value from the underlying price, strike, time, interest rate, volatility and dividends. Put-call parity links call and put prices; the binomial and Black-Scholes models price options using no-arbitrage and risk-neutral valuation.

**Why it matters.** Pricing intuition (what makes options expensive) underpins trading, risk management, ESOP valuation and real options. Implied volatility is a key market indicator (India VIX).

**Core mechanics.**
- **Determinants of value:**

| Input increases | Call value | Put value |
|---|---|---|
| Underlying price | ↑ | ↓ |
| Strike | ↓ | ↑ |
| Time to expiry | ↑ (usually) | ↑ (usually) |
| Volatility | ↑ | ↑ |
| Interest rate | ↑ | ↓ |
| Dividends | ↓ | ↑ |

- **Put-call parity (European, no dividends):** C − P = S − K × e^(−rT)
- **One-step binomial model:**
  - Up factor u, down factor d; risk-neutral probability q = (e^(rT) − d) / (u − d) (or (1 + r − d)/(u − d) with discrete compounding)
  - Option value = [q × Payoff_up + (1 − q) × Payoff_down] discounted at the risk-free rate
- **Black-Scholes (European call, no dividends):**
  - C = S × N(d₁) − K × e^(−rT) × N(d₂)
  - d₁ = [ln(S/K) + (r + σ²/2) T] / (σ√T); d₂ = d₁ − σ√T
  - Put via parity: P = K × e^(−rT) × N(−d₂) − S × N(−d₁)
  - Assumptions: lognormal prices, constant volatility and rates, no transaction costs, continuous trading
- **Implied volatility (IV):** the volatility that makes the model price equal the market price. Volatility smile or skew: IV varies by strike (OTM puts often have higher IV, reflecting crash risk).
- **India VIX:** index of expected 30-day Nifty volatility derived from option prices.

**Worked example 1: put-call parity.** S = 100, K = 100, T = 1 year, r = 6% (continuous): C − P = 100 − 100 × e^(−0.06) = **5.82**. If a call trades at 10 and a put at 3 (difference 7), an arbitrage exists: sell the call, buy the put, buy the stock, borrow the PV of the strike.

**Worked example 2: binomial.** S = 100, u = 1.2, d = 0.8, r = 5% for one period (discrete), call K = 100.
- q = (1.05 − 0.8) / (1.2 − 0.8) = 0.625
- Payoffs: up 20, down 0
- C = 0.625 × 20 / 1.05 = **11.90**

**Worked example 3: Black-Scholes.** S = 100, K = 100, T = 0.5, r = 6.5%, σ = 20%.
- d₁ = 0.3005; d₂ = 0.1591
- Call = **₹7.29**; put = **₹4.09**
- Check: C − P = 3.20 = 100 − 100 × e^(−0.0325) ✓

**Indian context.** India VIX is published by NSE and typically spikes during market stress [VERIFY: NSE India VIX methodology]. Indian companies value ESOPs for Ind AS 102 using Black-Scholes or binomial models with adjustments for expected life and dividends.

**Common mistakes.**
- Assuming volatility is constant across strikes.
- Applying Black-Scholes to American options with dividends without adjustment.
- Confusing historical (realised) volatility with implied volatility.

**Interview angle.**
1. *What happens to option prices when volatility rises?* Both calls and puts become more valuable, because the chance of large favourable moves rises while losses for the buyer stay capped.
2. *What is put-call parity and why does it hold?* C − P = S − PV(K); a call minus a put with the same strike and expiry replicates a forward, so arbitrage keeps them aligned.
3. *What does implied volatility tell you?* The market's expectation of future volatility embedded in option prices, and the relative cost of options.

**Related topics:** [17.5] Greeks, [2.11] ESOP valuation, [8.3] Real options.

---

### [17.5] The Greeks: Delta, Gamma, Theta, Vega and Rho
<!-- tags: domain=derivatives; level=advanced; roles=ER,CF,Fintech-PM; keywords=option Greeks, delta, gamma, theta, vega, rho, delta hedging, gamma risk, time decay, volatility exposure -->

**Definition.** The Greeks measure how an option's price changes with each input: delta (underlying price), gamma (change in delta), theta (time), vega (volatility) and rho (interest rates).

**Why it matters.** Traders and risk managers manage option books through their Greeks, and retail traders often underestimate theta and gamma risk near expiry. Interviewers test whether you can explain each in plain language.

**Core mechanics.**

| Greek | Measures | Call | Put | Intuition |
|---|---|---|---|---|
| Delta (Δ) | Change in option price per ₹1 change in underlying | 0 to +1 (N(d₁)) | −1 to 0 (N(d₁) − 1) | Hedge ratio; rough probability of finishing ITM |
| Gamma (Γ) | Change in delta per ₹1 change in underlying | + | + | Highest for ATM options near expiry |
| Theta (Θ) | Change in price per day | Usually − | Usually − | Time decay; accelerates near expiry |
| Vega (ν) | Change in price per 1% change in volatility | + | + | Highest for ATM, longer-dated options |
| Rho (ρ) | Change in price per 1% change in rates | + | − | Usually small for short-dated options |

- Long options: positive gamma and vega, negative theta. Short options: the reverse.
- **Delta hedging:** hold −Δ units of the underlying per option to be neutral to small moves; rebalance as delta changes (gamma).
- Portfolio Greeks add up across positions.

**Worked example.** For the option in [17.4] (S = 100, K = 100, T = 0.5, r = 6.5%, σ = 20%, call = ₹7.29):
- Call delta = **0.618**; put delta = **−0.382**
- Gamma = **0.027** (delta rises by 0.027 per ₹1 rise in the stock)
- Vega = **₹0.27** per 1 point of volatility
- Call theta ≈ **−₹0.024 per day**

If the stock rises ₹2: estimated call change ≈ 0.618 × 2 + ½ × 0.027 × 2² = 1.236 + 0.054 = **+₹1.29**.

Delta hedge: a dealer who sold 1,000 calls buys 618 shares; if the stock rises, delta increases and the dealer buys more shares (gamma risk).

**Indian context.** Weekly index options in India concentrate gamma and theta near expiry, producing sharp intraday swings on expiry days; SEBI's 2024 measures (one weekly expiry per exchange, higher margins on expiry day, removal of calendar spread benefit on expiry day) targeted this [VERIFY: SEBI circular October 2024 on measures to strengthen the equity index derivatives framework].

**Common mistakes.**
- Treating delta as a fixed hedge ratio.
- Ignoring vega risk when volatility collapses after events (e.g., results, elections), which can make options lose value even if the direction was right.
- Underestimating gamma risk for short options near expiry.

**Interview angle.**
1. *What is delta?* How much the option price changes for a ₹1 change in the underlying; also the hedge ratio, and roughly the probability of expiring in the money.
2. *Why do option sellers fear expiry day?* Gamma is highest for ATM options near expiry, so small moves cause large P&L swings and hedges must be adjusted rapidly.
3. *You bought a call before results; the stock rose slightly but the call fell. Why?* Implied volatility collapsed after the event (vega loss) and time decay (theta) outweighed the small delta gain.

**Related topics:** [17.4] Option pricing, [17.6] Strategies, [20.2] Market risk.

---

### [17.6] Option Strategies
<!-- tags: domain=derivatives; level=intermediate; roles=ER,Fintech-PM,CF; keywords=covered call, protective put, collar, bull call spread, bear put spread, straddle, strangle, iron condor, butterfly, payoff -->

**Definition.** Option strategies combine options (and sometimes the underlying) to create payoffs that express a view on direction, volatility or both, with defined risk.

**Why it matters.** Strategies show how options are used for hedging (protective puts, collars) and income (covered calls), and how traders take volatility views (straddles, iron condors). Wealthtech PMs increasingly build strategy builders and risk visualisations.

**Core mechanics.**

| Strategy | Construction | View | Max profit | Max loss |
|---|---|---|---|---|
| Covered call | Long stock + short OTM call | Neutral to mildly bullish | Limited (strike − cost + premium) | Large (stock falls) |
| Protective put | Long stock + long put | Bullish with insurance | Unlimited | Limited (cost − strike + premium) |
| Collar | Long stock + long put + short call | Hedged | Limited | Limited |
| Bull call spread | Long lower-strike call + short higher-strike call | Moderately bullish | Strike difference − net premium | Net premium |
| Bear put spread | Long higher-strike put + short lower-strike put | Moderately bearish | Strike difference − net premium | Net premium |
| Long straddle | Long ATM call + long ATM put | Big move, either direction | Unlimited | Total premium |
| Long strangle | Long OTM call + long OTM put | Bigger move, cheaper | Unlimited | Total premium |
| Short straddle / strangle | Sell both | Low volatility | Premium | Unlimited |
| Iron condor | Short OTM call spread + short OTM put spread | Range-bound | Net premium | Width of spread − premium |
| Butterfly | Long 1 low + short 2 middle + long 1 high strike | Price near middle strike | Limited | Net premium |

**Worked example 1: long straddle.** Nifty at 25,000; buy the 25,000 call for ₹300 and the 25,000 put for ₹280 (total ₹580).
- Breakevens: 25,000 ± 580 → **24,420 and 25,580**
- Profitable only if Nifty moves more than 2.3% either way by expiry

**Worked example 2: bull call spread.** Buy the 25,000 call at ₹300, sell the 25,400 call at ₹120 → net cost ₹180.
- Maximum profit = 400 − 180 = **₹220** (if Nifty ≥ 25,400); maximum loss = **₹180**; breakeven = **25,180**
- Cheaper than an outright call, at the cost of capping upside.

**Worked example 3: protective put.** Hold a stock at ₹1,000; buy a ₹950 put for ₹20. Worst case at expiry = 950 − 20 = ₹930 effective value (maximum loss ₹70, or 7%), whatever happens to the stock.

**Indian context.** Option-selling strategies (short strangles, iron condors) are popular among Indian retail and prop traders on weekly index options; margin benefits for hedged positions encourage spreads over naked selling [VERIFY: current hedged position margin benefits].

**Common mistakes.**
- Selling options for "consistent income" without tail-risk controls.
- Ignoring that both legs have bid-ask costs.
- Forgetting early assignment or physical settlement issues for stock options.

**Interview angle.**
1. *How would you hedge a stock portfolio against a 10% fall for the next month?* Buy index puts (or a put spread to cut cost), sized by the portfolio's beta-adjusted exposure.
2. *Which strategy profits if a big announcement moves the stock but you don't know which way?* A long straddle or strangle, provided the move exceeds the premiums paid (and implied volatility doesn't collapse).
3. *Why use spreads instead of outright options?* Lower cost and defined risk in exchange for capped profit.

**Related topics:** [17.3] Option basics, [17.5] Greeks, [18.5] Asset allocation and hedging.

---

### [17.7] Swaps: Interest Rate and Currency Swaps
<!-- tags: domain=derivatives; level=intermediate; roles=CF,IB,ER; keywords=interest rate swap, fixed-for-floating, OIS, MIBOR, SOFR, currency swap, cross-currency swap, notional, swap valuation, hedging borrowing costs -->

**Definition.** A swap is an agreement to exchange cash flows over time. In an interest rate swap (IRS), one party pays fixed and receives floating rate payments on a notional amount. In a currency swap, parties exchange principal and interest in different currencies.

**Why it matters.** Swaps are the main tools corporates and banks use to manage interest rate and currency risk on borrowings, and they are among the largest derivative markets globally.

**Core mechanics.**
- **Plain vanilla IRS:** pay fixed, receive floating (or vice versa) on a notional; only net interest payments are exchanged; notional is not exchanged.
  - Payer swap (pay fixed): benefits if rates rise; used to convert floating-rate debt to fixed
  - Receiver swap (receive fixed): benefits if rates fall
- **Benchmarks:** in India, overnight MIBOR-based overnight indexed swaps (OIS) are most liquid; globally SOFR (USD), SONIA (GBP), €STR (EUR) after the LIBOR transition.
- **Swap rate:** the fixed rate that makes the swap's value zero at inception.
- **Valuation:** value = PV of remaining floating leg − PV of fixed leg (for the fixed payer).
- **Cross-currency swap:** exchange of principal at inception and maturity plus periodic interest in each currency; used to hedge foreign currency borrowings (e.g., ECBs).
- **Uses:** convert loan types, hedge assets and liabilities, take rate views, manage ALM.

**Worked example 1: converting floating to fixed.** A company has a ₹100 Cr loan at MIBOR-linked rate + 1.5%. It enters a pay-fixed swap at 6.8% vs receive overnight MIBOR (compounded).
- Effective cost = (MIBOR + 1.5%) − MIBOR + 6.8% = **8.3% fixed**
- In a year when compounded MIBOR averages 6.2%: loan interest = 7.7% (₹7.7 Cr); swap net payment = 6.8% − 6.2% = 0.6% (₹0.6 Cr paid); total = **₹8.3 Cr**

**Worked example 2: currency swap.** An Indian company borrows US$10 million at SOFR + 2% via ECB and swaps it into INR at 84.00 at a fixed INR rate of 9.5%.
- Effective liability: ₹84 Cr at 9.5% fixed INR, removing USD and floating rate exposure
- Without the swap, a rupee depreciation to 90 would raise the principal to ₹90 Cr (₹6 Cr loss)

**Indian context.** RBI regulates OTC rupee interest rate derivatives and permits users to hedge exposures with authorised dealers; ECB rules require hedging of a portion of foreign currency borrowing in some cases [VERIFY: RBI Master Direction on Rupee Interest Rate Derivatives (2025 revision) and ECB hedging requirements]. The MIBOR benchmark is administered by FBIL [VERIFY: FBIL MIBOR methodology and any new benchmark introduction].

**Common mistakes.**
- Confusing notional with the amount at risk.
- Ignoring counterparty credit risk and collateral (CSA) terms.
- Mismatches between the swap's benchmark and the loan's benchmark (basis risk).

**Interview angle.**
1. *What is an interest rate swap?* An agreement to exchange fixed and floating interest payments on a notional, used to change the interest profile of debt or investments.
2. *A company expects rates to rise and has floating-rate debt. What should it do?* Enter a pay-fixed swap to lock in its borrowing cost.
3. *Why use a cross-currency swap with an ECB?* To convert foreign currency debt into rupee debt, removing exchange rate risk on principal and interest.

**Related topics:** [16.5] Yield curve, [22.3] FX hedging, [19.7] ALM.

---

### [17.8] Equity Derivatives in India and Hedging Applications
<!-- tags: domain=derivatives; level=intermediate; roles=Fintech-PM,ER,CF,Consulting; keywords=F&O India, index options, weekly expiry, lot size, SEBI F&O measures, beta hedging, portfolio hedging, open interest, put-call ratio, retail losses -->

**Definition.** India's exchange-traded equity derivatives market (futures and options on indices and stocks) is among the largest in the world by contracts traded, dominated by index options. Hedging applications include beta hedging of portfolios and protecting stock positions.

**Why it matters.** F&O drives a large share of Indian brokers' revenues and is a central regulatory topic. Wealthtech and broking PMs need to understand the products, the risks to retail users and SEBI's responses.

**Core mechanics.**
- **Products:** index futures and options (Nifty 50, Bank Nifty, Sensex and others), stock futures and options (eligible stocks), with specified expiry cycles.
- **Market indicators:**
  - Open interest (OI): outstanding contracts; rising OI with rising price suggests new long positions
  - Put-call ratio (PCR): put OI / call OI, used as a sentiment indicator
  - India VIX: implied volatility
- **Beta hedging:** number of futures contracts to sell = (Portfolio value × Portfolio beta) / (Index futures price × Lot size)
- **Regulatory framework (SEBI 2024 measures):** higher minimum contract value, one weekly expiry per exchange for benchmark indices, upfront collection of option premiums, intraday monitoring of position limits, removal of calendar spread benefit on expiry day, additional extreme loss margin on expiry day.

**Worked example: beta hedge.** A portfolio worth ₹5 Cr with beta 1.2; Nifty futures at 25,000; lot size 75.
- Contracts to sell = (5,00,00,000 × 1.2) / (25,000 × 75) = 6,00,00,000 / 18,75,000 = **32 contracts**
- If Nifty falls 5%, the portfolio is expected to fall 6% (₹30 lakh); the short futures gain about 32 × 75 × 1,250 = ₹30 lakh, offsetting the loss (ignoring basis and beta error)

**Indian context.** SEBI's studies found that about 93% of individual F&O traders incurred losses over FY22–FY24, with aggregate losses well above ₹1 lakh Cr, prompting the October 2024 measures [VERIFY: SEBI study (September 2024) and circular (October 2024); current lot sizes, expiry days and contract values]. Exchange-level changes to expiry days and lot sizes occur frequently, so always check current specifications.

**Common mistakes.**
- Hedging with the wrong number of contracts (ignoring beta or lot size).
- Treating weekly options as investments rather than short-dated bets.
- Ignoring that hedges have costs (basis, rollover, premiums).

**Interview angle.**
1. *Why did SEBI tighten F&O rules in 2024?* Heavy retail losses and speculative volumes concentrated in weekly index options on expiry days; the measures raise contract sizes and margins and reduce expiry-day speculation.
2. *How would you hedge a mutual fund portfolio for a month?* Sell index futures sized by beta, or buy index puts for downside protection while keeping upside.
3. *As a broking PM, how would you balance F&O revenue with user wellbeing?* Risk disclosures and loss statistics at entry, suitability checks, cooling-off nudges after losses, and education, accepting some revenue trade-off for trust and regulatory alignment.

**Related topics:** [17.2] Futures pricing, [17.6] Strategies, [21.8] Wealthtech and broking.

---

## Module 17 Glossary

| Term | Definition |
|---|---|
| Basis | Spot price minus futures price |
| Black-Scholes | Closed-form European option pricing model |
| Cost of carry | Financing cost minus income from holding the underlying |
| Delta | Option price sensitivity to the underlying price |
| Gamma | Sensitivity of delta to the underlying price |
| Implied volatility | Volatility implied by option prices |
| Intrinsic value | Value of an option if exercised immediately |
| Mark-to-market | Daily settlement of futures gains and losses |
| Notional | Reference amount for computing swap payments |
| Open interest | Number of outstanding derivative contracts |
| Put-call parity | C − P = S − PV(K) |
| Straddle | Long call and put at the same strike |
| Theta | Option value lost per day from time decay |
| Vega | Option sensitivity to volatility |
| India VIX | Index of expected 30-day Nifty volatility |

## Module 17 Rapid-Fire Quiz

1. Spot 1,000, r 8%, dividend yield 2%, 6 months (simple). Futures fair value? **₹1,030**
2. Call strike 500, premium ₹20. Breakeven? **₹520**
3. Put strike 300, stock at 280. Intrinsic value? **₹20**
4. C − P for S 200, PV(K) 190? **₹10**
5. Which Greek is highest for ATM options near expiry? **Gamma**
6. Volatility rises. Effect on calls and puts? **Both rise**
7. Long straddle premiums total ₹500 at strike 20,000. Breakevens? **19,500 and 20,500**
8. Company with floating debt fears rate hikes. Which swap? **Pay fixed, receive floating**
9. Portfolio ₹2 Cr, beta 1.5, futures 25,000, lot 75. Contracts to hedge? **16**
10. Theta for a long option is usually? **Negative**

## Module 17 [VERIFY] Items

1. RBI Master Direction on Risk Management and Inter-Bank Dealings; exchange-traded currency derivative rules
2. Arbitrage fund taxation; SEBI/NSE Clearing margin framework; current lot sizes and minimum contract value
3. SEBI F&O studies (2023, 2024); physical settlement of stock derivatives
4. NSE India VIX methodology
5. SEBI October 2024 index derivatives measures; current expiry days
6. Hedged position margin benefits
7. RBI Rupee Interest Rate Derivatives Directions; ECB hedging requirements; FBIL MIBOR methodology

---

# Module 18: Portfolio Management

### [18.1] The Investment Process and the Investment Policy Statement
<!-- tags: domain=portfolio-management; level=foundation; roles=ER,Fintech-PM,PE,Consulting; keywords=investment process, investment policy statement, IPS, return objective, risk tolerance, risk capacity, constraints, time horizon, liquidity, suitability, goal-based investing -->

**Definition.** Portfolio management is the process of setting investment objectives, building a portfolio to meet them, and monitoring and adjusting it over time. The investment policy statement (IPS) documents the client's objectives, constraints and the rules for managing the portfolio.

**Why it matters.** Every wealth platform, mutual fund, pension fund and robo-adviser runs some version of this process. Wealthtech PMs translate it into onboarding flows (risk profiling questionnaires) and portfolio recommendations; regulators require suitability.

**Core mechanics.**

*The portfolio management cycle:*
1. **Planning:** understand the investor, write the IPS, form capital market expectations, set strategic asset allocation
2. **Execution:** select securities or funds, construct the portfolio, trade efficiently
3. **Feedback:** monitor, rebalance, measure and attribute performance, revisit the IPS when circumstances change

*IPS components (RRTTLLU):*

| Element | Question |
|---|---|
| **R**eturn objective | What return is required (to meet goals) and desired? |
| **R**isk tolerance | Willingness (attitude) and ability (capacity: income stability, wealth, horizon) to bear losses |
| **T**ime horizon | When will money be needed? Single or multiple stages? |
| **T**ax | Tax status and efficient structures |
| **L**iquidity | Near-term cash needs, emergency reserves |
| **L**egal / regulatory | Restrictions (e.g., trust rules, pension regulations) |
| **U**nique circumstances | Ethical preferences, concentrated holdings, family needs |

*Ability vs willingness:* when they conflict, the lower of the two usually governs, with client education where willingness is irrationally low.

**Worked example: required return.** A 30-year-old wants ₹1 Cr in 15 years for a child's education goal and can invest ₹2.5 lakh now plus ₹20,000 a month.
- Testing 10% a year (≈0.797% a month): FV of lump sum = 2.5 × 1.10^15 = ₹10.44 lakh; FV of SIP = 20,000 × [(1.00797^180 − 1) / 0.00797] ≈ ₹79.7 lakh; total ≈ **₹90.1 lakh**, short of the goal
- At about 11.2% the goal is met. With moderate risk tolerance and a 15-year horizon, an equity-heavy allocation (70–80% equity) is consistent; at lower tolerance, the client must save more or extend the horizon.

**Indian context.** SEBI-registered investment advisers (RIAs) must perform risk profiling and suitability assessment, and must separate advice from distribution [VERIFY: SEBI (Investment Advisers) Regulations 2013, 2020 amendments on advice-distribution segregation and 2024–25 changes]. Mutual fund distributors (ARN holders, AMFI-registered) sell regular plans and earn commissions; portfolio management services (PMS) require a minimum investment of ₹50 lakh [VERIFY: SEBI PMS minimum ticket size].

**Common mistakes.**
- Building portfolios from risk questionnaires alone, ignoring capacity (an investor with unstable income and no emergency fund has low capacity whatever they say).
- Setting return objectives disconnected from goals.
- Never revisiting the IPS after life events.

**Interview angle.**
1. *How would you design onboarding for a robo-advisory app?* Capture goals (amount, date), income stability, existing assets and liabilities, and attitude to losses; derive capacity and willingness separately; map to a model portfolio; explain trade-offs in plain language.
2. *What's the difference between risk tolerance and risk capacity?* Tolerance is psychological willingness to accept losses; capacity is the financial ability to absorb them without derailing goals.
3. *What goes into an IPS?* Return and risk objectives, time horizon, tax, liquidity, legal and unique constraints, plus the strategic asset allocation, rebalancing rules and review frequency.

**Related topics:** [18.5] Asset allocation, [18.8] Wealth management in India, [1.3] SIP maths.

---

### [18.2] Modern Portfolio Theory and the Efficient Frontier
<!-- tags: domain=portfolio-management; level=intermediate; roles=ER,PE,Fintech-PM,CF; keywords=modern portfolio theory, Markowitz, efficient frontier, minimum variance portfolio, correlation, diversification, covariance, optimal portfolio, mean-variance optimisation -->

**Definition.** Modern portfolio theory (MPT, Markowitz 1952) shows how combining assets with imperfect correlation reduces risk for a given expected return. The efficient frontier is the set of portfolios with the highest expected return for each level of risk.

**Why it matters.** MPT is the foundation of diversification, asset allocation and robo-advisory engines. Interviews test the intuition (correlation drives diversification) and its limitations.

**Core mechanics.**
- Portfolio return: E(Rp) = Σ wᵢ E(Rᵢ)
- Portfolio variance (two assets): σp² = wA²σA² + wB²σB² + 2wAwBρABσAσB
- For N assets: σp² = Σᵢ Σⱼ wᵢ wⱼ Covᵢⱼ; as N grows, variance approaches the average covariance (systematic risk remains)
- **Minimum variance weight (two assets):** wA* = (σB² − ρσAσB) / (σA² + σB² − 2ρσAσB)
- **Efficient frontier:** the upper part of the curve of attainable portfolios; portfolios below it are inefficient (same risk, lower return)
- **Mean-variance optimisation:** choose weights to maximise expected return for a target risk (or minimise risk for a target return), subject to constraints (no short sales, position limits)
- Investors choose a point on the frontier according to their risk aversion (indifference curves)

**Worked example.** Asset A: E(R) 10%, σ 20%. Asset B: E(R) 14%, σ 30%. Correlation 0.2.
- Minimum variance weight in A = (900 − 0.2 × 20 × 30) / (400 + 900 − 2 × 0.2 × 20 × 30) = 780 / 1,060 = **73.6%**
- Minimum variance portfolio: σ = **18.1%**, E(R) = 0.736 × 10% + 0.264 × 14% = **11.1%**
- This portfolio is less risky than Asset A alone (18.1% vs 20%) and earns more (11.1% vs 10%). Holding only A is therefore inefficient.

**Indian context.** Indian equity and G-sec returns have often shown low or negative correlation during equity stress, and gold has historically diversified INR portfolios, which is why many Indian multi-asset funds hold equity, debt and gold together [VERIFY: historical correlation data for Nifty, G-secs and gold in INR].

**Common mistakes.**
- Treating optimiser outputs as precise; small changes in expected returns produce extreme, unstable weights ("error maximisation").
- Assuming correlations are stable; they rise in crises.
- Using volatility as the only risk measure for assets with fat tails.

**Interview angle.**
1. *Why does diversification reduce risk?* Because assets don't move perfectly together; their idiosyncratic moves partly cancel, so portfolio volatility is less than the weighted average of individual volatilities when correlation is below 1.
2. *What are the limitations of mean-variance optimisation?* Sensitive to inputs, assumes normal returns and stable correlations, single-period, and ignores liquidity and investor preferences beyond variance.
3. *Can adding a risky asset reduce portfolio risk?* Yes, if its correlation with the portfolio is low or negative enough.

**Related topics:** [1.6] Risk and return, [18.3] CAPM and CML, [18.5] Asset allocation.

---

### [18.3] CAPM, the Capital Market Line and the Security Market Line
<!-- tags: domain=portfolio-management; level=intermediate; roles=ER,PE,CF,IB; keywords=CAPM, capital market line, security market line, tangency portfolio, market portfolio, beta, alpha, systematic risk, two-fund separation -->

**Definition.** The capital asset pricing model (CAPM) states that an asset's expected return equals the risk-free rate plus beta times the market risk premium. The capital market line (CML) shows efficient portfolios combining the risk-free asset and the market portfolio; the security market line (SML) shows the required return for any asset based on its beta.

**Why it matters.** CAPM is used to estimate the cost of equity, to judge whether securities are mispriced (alpha), and to evaluate managers. It is one of the most tested finance concepts.

**Core mechanics.**
- **Adding a risk-free asset:** the best risky portfolio to combine with it is the **tangency portfolio** (highest Sharpe ratio); in equilibrium, it is the market portfolio.
- **Two-fund separation:** all investors hold the same risky portfolio; they differ only in how much they lend or borrow at the risk-free rate.
- **CML:** E(Rp) = Rf + [(E(Rm) − Rf) / σm] × σp. Applies only to efficient portfolios; slope = market Sharpe ratio.
- **SML (CAPM):** E(Rᵢ) = Rf + βᵢ × (E(Rm) − Rf). Applies to every asset; risk measured by beta.
- **Beta** = Cov(Rᵢ, Rm) / σm² = ρᵢm × σᵢ / σm
- **Alpha** = Expected (or actual) return − CAPM required return. Positive alpha = undervalued (plots above the SML).

**Worked example.** Rf 7%; expected market return 13% (premium 6%).

| Stock | Beta | Analyst's expected return | CAPM required return | Alpha | View |
|---|---|---|---|---|---|
| X | 1.3 | 16.0% | 7% + 1.3 × 6% = 14.8% | +1.2% | Undervalued (buy) |
| Y | 0.8 | 11.0% | 7% + 0.8 × 6% = 11.8% | −0.8% | Overvalued (avoid) |

CML: with market σ of 15%, a portfolio with 60% in the market and 40% in the risk-free asset has σ = 9% and E(R) = 7% + (6%/15%) × 9% = **10.6%**.

**Indian context.** CAPM is the standard cost-of-equity model in Indian valuation practice, using the 10-year G-sec as Rf and Nifty or Sensex as the market proxy. Empirical tests in India, as elsewhere, find beta alone explains returns poorly, motivating multi-factor models [VERIFY: Indian factor model research, e.g., IIM Ahmedabad Fama-French factor data library].

**Common mistakes.**
- Using the CML for individual stocks (use the SML).
- Treating alpha estimates as precise when beta and expected returns are uncertain.
- Assuming high-volatility stocks must have high required returns (only beta matters in CAPM).

**Interview angle.**
1. *CML vs SML?* The CML relates return to total risk for efficient portfolios; the SML relates return to beta for any asset or portfolio.
2. *What does a stock above the SML mean?* It offers more expected return than its beta requires: positive alpha, so it looks undervalued.
3. *What are CAPM's main criticisms?* Unrealistic assumptions (single period, borrowing at Rf, homogeneous expectations), an unobservable true market portfolio, and weak empirical support relative to multi-factor models.

**Related topics:** [8.4] Cost of equity, [18.4] Factor models, [18.6] Performance measurement.

---

### [18.4] Multi-Factor Models, APT and Smart Beta
<!-- tags: domain=portfolio-management; level=advanced; roles=ER,PE,Fintech-PM; keywords=Fama-French three factor, five factor, Carhart momentum, arbitrage pricing theory, APT, factor investing, smart beta, size, value, momentum, quality, low volatility -->

**Definition.** Multi-factor models explain returns with several systematic risk factors rather than the market alone. Arbitrage pricing theory (APT) provides the theoretical basis; Fama-French and Carhart models are the best-known empirical versions. Smart beta (factor) products build portfolios tilted toward rewarded factors.

**Why it matters.** Factor exposures explain much of fund performance ("is it skill or just a value tilt?"), and factor ETFs and index funds are a fast-growing product category in India.

**Core mechanics.**
- **APT:** E(Rᵢ) = Rf + β₁λ₁ + β₂λ₂ + ... + βₖλₖ, where λ are factor risk premia; relies on no-arbitrage rather than CAPM's equilibrium assumptions.
- **Fama-French three-factor:** Rᵢ − Rf = α + β(Rm − Rf) + s × SMB + h × HML + ε
  - SMB (small minus big): size premium
  - HML (high minus low book-to-market): value premium
- **Carhart four-factor:** adds momentum (UMD / WML: winners minus losers)
- **Fama-French five-factor:** adds profitability (RMW: robust minus weak) and investment (CMA: conservative minus aggressive)
- **Common smart beta factors:** value, size, momentum, quality (profitability, low leverage), low volatility, dividend yield
- **Construction:** rules-based weighting (e.g., by factor score) instead of market cap; rebalanced periodically

**Worked example: expected return from a factor model.** Rf 7%; market premium 6%; SMB premium 2%; HML premium 3%. A small-cap value fund has β = 1.1, s = 0.4, h = 0.3.
- E(R) = 7% + 1.1 × 6% + 0.4 × 2% + 0.3 × 3% = **15.3%**
- If the fund delivered 15.5%, its factor-adjusted alpha is only 0.2%; most of its outperformance versus the market is explained by size and value exposure, not stock-picking skill.

**Indian context.** NSE publishes factor indices (e.g., Nifty 200 Momentum 30, Nifty 100 Low Volatility 30, Nifty 200 Quality 30, Nifty 50 Value 20), on which index funds and ETFs are based [VERIFY: current Nifty factor index list and methodologies]. Academic factor data for India is published by IIM Ahmedabad researchers.

**Common mistakes.**
- Assuming factor premia are persistent every year (factors can underperform for long periods, e.g., value globally in the 2010s).
- Data-mining new "factors" that don't survive out of sample.
- Ignoring turnover and costs in factor strategies (momentum is turnover-heavy).

**Interview angle.**
1. *How would you tell if a fund manager has skill?* Regress returns on factors (market, size, value, momentum, quality); a statistically significant positive alpha after factor exposures suggests skill.
2. *What is smart beta?* Rules-based strategies that tilt toward factors like value or momentum, sitting between passive market-cap indexing and active management.
3. *APT vs CAPM?* CAPM uses one factor (market) from equilibrium theory; APT allows multiple factors from no-arbitrage, without specifying which factors.

**Related topics:** [18.3] CAPM, [18.6] Performance measurement, [15.8] Market efficiency.

---

### [18.5] Asset Allocation and Rebalancing
<!-- tags: domain=portfolio-management; level=intermediate; roles=Fintech-PM,ER,Consulting,CF; keywords=strategic asset allocation, tactical asset allocation, rebalancing, glide path, core-satellite, lifecycle investing, 60/40 portfolio, risk parity, home bias -->

**Definition.** Asset allocation divides a portfolio among asset classes (equity, debt, gold, real estate, alternatives, cash). Strategic asset allocation (SAA) sets long-term target weights; tactical asset allocation (TAA) makes temporary deviations; rebalancing restores targets.

**Why it matters.** Asset allocation explains most of the variation in a portfolio's returns over time, far more than security selection for diversified portfolios. Robo-advisers, target-date funds and balanced advantage funds are asset-allocation products.

**Core mechanics.**
- **SAA:** based on IPS objectives and long-run capital market expectations
- **TAA:** short-term tilts based on valuations, momentum or macro views (within bands)
- **Rebalancing approaches:**
  - Calendar (e.g., annually)
  - Threshold (e.g., when weights drift by more than ±5 points)
  - Rebalancing enforces "buy low, sell high" discipline but incurs costs and taxes
- **Glide path:** equity allocation falling as a goal approaches (target-date / lifecycle funds)
- **Core-satellite:** low-cost passive core plus active or thematic satellites
- **Risk parity:** weights assets so each contributes equally to portfolio risk (usually leveraging lower-risk assets)
- **Home bias:** over-allocation to domestic assets; global diversification reduces country concentration

**Worked example: threshold rebalancing.** A ₹10 lakh portfolio at 60% equity / 40% debt. In a year, equity returns 30% and debt 5%.
- Equity = 6 × 1.30 = ₹7.8 lakh; debt = 4 × 1.05 = ₹4.2 lakh; total ₹12 lakh
- Equity weight = 7.8 / 12 = **65%**, breaching a ±5-point band
- Rebalance: target equity = 60% × 12 = ₹7.2 lakh → sell **₹0.6 lakh** of equity, buy debt
- Consider taxes: selling equity triggers capital gains tax; rebalancing through new SIP contributions into debt can avoid it

**Indian context.** Indian balanced advantage funds (dynamic asset allocation) vary equity exposure using valuation models; multi-asset allocation funds must hold at least three asset classes [VERIFY: SEBI hybrid fund categorisation rules]. Retail Indian household balance sheets have historically been dominated by real estate and gold, with financial assets growing [VERIFY: RBI household finance data]. Overseas investing via mutual funds is subject to industry-wide limits, and individuals can use the Liberalised Remittance Scheme [VERIFY: SEBI overseas investment limits for MFs; LRS limit USD 250,000].

**Common mistakes.**
- Never rebalancing, letting risk drift upward in bull markets.
- Rebalancing too frequently, raising costs and taxes.
- Making tactical bets so large that they override the strategic plan.

**Interview angle.**
1. *Why does asset allocation matter more than stock selection?* Asset classes have very different risk and return profiles and low correlations, so the mix dominates portfolio volatility and long-run returns for diversified investors.
2. *How would a robo-adviser rebalance efficiently in India?* Direct new contributions to underweight assets first, use threshold bands, and harvest tax losses where possible, minimising capital gains tax.
3. *What is a glide path?* A rule that reduces equity exposure as the goal date approaches, lowering the risk of a crash just before money is needed.

**Related topics:** [18.1] IPS, [18.2] MPT, [15.9] Mutual funds, [23.2] Capital gains tax.

---

### [18.6] Performance Measurement: Sharpe, Treynor, Jensen's Alpha, Information Ratio and Returns Calculation
<!-- tags: domain=portfolio-management; level=intermediate; roles=ER,Fintech-PM,PE,CF; keywords=Sharpe ratio, Treynor ratio, Jensen's alpha, information ratio, Sortino ratio, M-squared, tracking error, maximum drawdown, time-weighted return, money-weighted return, XIRR, performance attribution -->

**Definition.** Performance measurement evaluates portfolio returns relative to risk and benchmarks. Risk-adjusted ratios compare managers; return calculation methods separate the manager's skill from the investor's cash flow timing.

**Why it matters.** Fund selection, manager evaluation and wealth app dashboards all depend on correct return calculations and risk-adjusted comparisons. Many retail investors see XIRR in their apps without knowing what it means.

**Core mechanics.**

| Measure | Formula | Use |
|---|---|---|
| Sharpe ratio | (Rp − Rf) / σp | Total-risk-adjusted return; for whole portfolios |
| Treynor ratio | (Rp − Rf) / βp | Systematic-risk-adjusted; for well-diversified portfolios |
| Jensen's alpha | Rp − [Rf + βp(Rm − Rf)] | Return above CAPM expectation |
| M² (Modigliani) | Rf + Sharpe_p × σm | Return at market risk; comparable in % terms |
| Information ratio | Active return / Tracking error | Consistency of outperformance vs benchmark |
| Sortino ratio | (Rp − Target) / Downside deviation | Penalises only downside volatility |
| Maximum drawdown | Largest peak-to-trough fall | Pain measure |

*Return calculations:*
- **Time-weighted return (TWR):** compounds sub-period returns between cash flows; removes the effect of the investor's deposits and withdrawals. Used to evaluate managers (and required for fund performance reporting).
- **Money-weighted return (MWR / IRR / XIRR):** IRR of all cash flows; reflects the investor's actual experience including timing.

**Worked example 1: comparing funds.** Rf 7%; market return 12% with σ 15%.

| | Fund A | Fund B |
|---|---|---|
| Return | 15% | 13% |
| σ | 18% | 12% |
| β | 1.1 | 0.8 |
| Sharpe | 8/18 = **0.44** | 6/12 = **0.50** |
| Treynor | 8/1.1 = **7.27** | 6/0.8 = **7.50** |
| Jensen's alpha | 15 − (7 + 1.1 × 5) = **2.5%** | 13 − (7 + 0.8 × 5) = **2.0%** |
| M² | 7 + 0.44 × 15 = **13.7%** | 7 + 0.50 × 15 = **14.5%** |

Fund A has higher raw return and alpha, but Fund B delivers more return per unit of risk (Sharpe, Treynor, M²). For an investor holding only one fund, Sharpe and M² favour B.

**Worked example 2: TWR vs MWR.** An investor puts ₹100 in a fund. Year 1 return +50% (value ₹150). The investor adds ₹150 (value ₹300). Year 2 return −20% (value ₹240).
- TWR = 1.50 × 0.80 − 1 = 20% over two years = **9.5% a year**: the manager's performance
- MWR: solve −100 − 150/(1 + r) + 240/(1 + r)² = 0 → **r ≈ −2.9% a year**: the investor lost money overall because they added cash before the bad year

**Indian context.** SEBI requires mutual funds to show performance against benchmark total return indices (TRI) and has introduced standardised return disclosure formats [VERIFY: SEBI circular on TRI benchmarking (2018) and performance disclosure]. Indian investment apps typically show XIRR (money-weighted) for SIP portfolios; AMFI publishes scheme returns on a point-to-point, time-weighted basis.

**Common mistakes.**
- Comparing Sharpe ratios computed over different periods or frequencies.
- Using Treynor for undiversified portfolios.
- Judging a fund by an investor's XIRR, which reflects timing of SIPs and lump sums, not manager skill.

**Interview angle.**
1. *Sharpe vs Treynor: when to use which?* Sharpe for a portfolio that is the investor's whole wealth (total risk matters); Treynor for a portfolio that is one part of a diversified holding (only beta matters).
2. *Why can an investor lose money in a fund with positive returns?* Money-weighted returns can be negative if the investor added money before poor periods and withdrew before good ones.
3. *What does an information ratio of 0.5 mean?* Each 1% of tracking error earns 0.5% of active return a year; above about 0.5 is generally considered good for active managers.

**Related topics:** [18.3] CAPM, [18.4] Factor models, [1.5] IRR, [15.9] Mutual funds.

---

### [18.7] Portfolio Construction, Risk Budgeting and Behavioural Pitfalls
<!-- tags: domain=portfolio-management; level=advanced; roles=ER,PE,Fintech-PM; keywords=portfolio construction, position sizing, concentration, risk budgeting, tracking error budget, active share, liquidity management, turnover, conviction weighting, Kelly -->

**Definition.** Portfolio construction converts investment ideas into position sizes subject to risk, liquidity and benchmark constraints. Risk budgeting allocates the total risk (or tracking error) a portfolio may take across positions and strategies.

**Why it matters.** Good ideas sized badly produce poor results. Fund managers, PE portfolio teams and wealth platforms must manage concentration, liquidity and behavioural traps.

**Core mechanics.**
- **Position sizing approaches:** equal weight; conviction-weighted; risk-weighted (inverse volatility); benchmark-relative (active weights)
- **Constraints:** maximum single stock and sector weights, liquidity (days to exit at a % of average daily volume), minimum and maximum number of holdings
- **Active share:** % of portfolio holdings that differ from the benchmark; low active share with high fees signals "closet indexing"
- **Tracking error budget:** allocate expected tracking error across active bets; diversify sources of active risk
- **Liquidity management:** match portfolio liquidity to investor redemption patterns (key lesson from debt fund crises)
- **Turnover and costs:** higher turnover raises transaction costs and taxes, eroding returns

**Worked example: liquidity check.** A small-cap fund holds ₹200 Cr of a stock trading ₹10 Cr a day on average. Assuming the fund can trade 20% of daily volume without excessive impact:
- Days to exit = 200 / (10 × 20%) = **100 trading days**
- If the fund faces 10% redemptions in a month, it cannot sell this position quickly; it must sell liquid holdings first, which concentrates the remaining portfolio in illiquid names (a "liquidity spiral"). Position limits linked to liquidity prevent this.

**Indian context.** SEBI requires mutual funds to run liquidity stress tests for small and mid-cap schemes and disclose results (e.g., days to liquidate 25% and 50% of the portfolio) [VERIFY: SEBI/AMFI stress test disclosures for small and mid-cap funds (2024)]. Mutual fund schemes face single-issuer and sector concentration limits [VERIFY: SEBI MF Regulations Seventh Schedule investment limits].

**Common mistakes.**
- Sizing positions by conviction without considering correlation (several "different" ideas may be the same bet).
- Ignoring liquidity until redemptions arrive.
- High fees with low active share.

**Interview angle.**
1. *How would you size positions in a 25-stock portfolio?* Start with conviction and expected return, adjust for volatility and correlation, cap single-name and sector weights, and check liquidity against fund size and redemption risk.
2. *What is active share and why does it matter?* The share of holdings differing from the benchmark; it shows whether investors are paying active fees for genuinely active management.
3. *Why did liquidity become a regulatory focus for Indian small-cap funds?* Large inflows into small caps raised concerns that funds couldn't sell holdings quickly in a downturn without heavy losses.

**Related topics:** [18.6] Performance measurement, [15.8] Behavioural finance, [20.5] Liquidity risk.

---

### [18.8] Wealth Management, Advisory Models and Investment Products in India
<!-- tags: domain=portfolio-management; level=foundation; roles=Fintech-PM,Consulting,ER; keywords=wealth management, robo-advisory, RIA, mutual fund distributor, PMS, AIF, SIF, financial planning, goal-based investing, NPS, insurance, tax-efficient investing -->

**Definition.** Wealth management provides investment advice and products to individuals, from mass-market digital platforms to private banking for high-net-worth families. In India, advice and distribution are regulated separately, and product access depends on investment size.

**Why it matters.** Indian wealthtech (Groww, Zerodha, INDmoney, Kuvera, ET Money, Paytm Money, wealth arms of banks) is one of the fastest-growing fintech segments, and these product and regulatory distinctions shape business models.

**Core mechanics.**

*Product ladder by ticket size:*

| Product | Minimum ticket (indicative) | Regulator | Notes |
|---|---|---|---|
| Mutual funds, ETFs | ₹100–500 | SEBI | Pooled, daily liquidity, SIPs |
| Specialised Investment Funds (SIF) | ₹10 lakh | SEBI | Between MFs and PMS; long-short strategies allowed |
| Portfolio Management Services (PMS) | ₹50 lakh | SEBI | Separately managed account |
| Alternative Investment Funds (AIFs) | ₹1 Cr (most investors) | SEBI | Category I, II, III |
| National Pension System (NPS) | Low | PFRDA | Retirement, tax benefits, annuity at exit |
| Government schemes (PPF, SSY, SCSS) | Low | Government | Fixed, often tax-advantaged |
| Insurance (term, ULIPs) | Varies | IRDAI | Term insurance is protection, not investment |

[VERIFY: SEBI SIF framework (2025) minimum investment; PMS and AIF minimums]

*Business models:*
- **Distribution (commission):** earns trail commissions from AMCs on regular plans; conflicts of interest
- **Advisory (fee-only, SEBI RIA):** charges clients fees (fixed or % of AUA within SEBI caps); recommends direct plans
- **Execution-only / discount broker:** low-cost direct plans and broking; revenue from broking, float, margin funding, other services
- **Private banking / wealth:** relationship managers, bundled products, often commission-based

*Financial planning sequence:* emergency fund (6 months' expenses) → adequate term life and health insurance → high-interest debt repayment → goal-based investing (retirement, education, home) with asset allocation → tax optimisation → estate planning.

**Worked example: commission vs fee economics.** A client invests ₹50 lakh in equity funds.
- Regular plan via distributor: trail commission of about 0.8% a year → **₹40,000** a year paid indirectly through a higher expense ratio
- Direct plan with a fee-only RIA charging a flat ₹25,000 a year → client saves ₹15,000 a year, and the adviser has no incentive to push particular funds
- Over 15 years at 12% gross, the 0.8% annual difference compounds to roughly 10% of the final corpus

**Indian context.** SEBI's investment adviser rules cap fees (e.g., a percentage of assets under advice or a fixed fee per family) and require segregation of advisory and distribution at the group level [VERIFY: SEBI IA Regulations fee caps and 2024–25 amendments]. Mutual fund distributors cannot call themselves "advisers" [VERIFY: SEBI/AMFI naming rules]. Tax treatment differs by product and changes often (capital gains on equity and debt funds, NPS deductions under old vs new regime) [VERIFY: current Income-tax Act provisions for FY2026-27].

**Common mistakes.**
- Treating insurance products (endowment, ULIPs) as primary investment vehicles without comparing costs.
- Ignoring the conflict between commission income and client interest.
- Recommending complex products (PMS, AIF) for investors whose needs are met by low-cost funds.

**Interview angle.**
1. *How does a discount broker make money if brokerage on delivery is zero?* Intraday and F&O brokerage, interest on margin funding, float on client funds (where permitted), mutual fund distribution or other product fees, and premium subscriptions.
2. *Fee-only advisory vs commission-based distribution?* Fee-only aligns adviser incentives with clients and uses direct plans; distribution is easier to scale for small clients but creates conflicts.
3. *As a wealthtech PM, what feature would you build to improve long-term investor outcomes?* Goal-based dashboards with progress tracking, automatic SIP step-ups, rebalancing nudges, and friction on panic selling during market falls.

**Related topics:** [18.1] IPS, [15.9] Mutual funds, [21.8] Wealthtech, [24.1] Regulators.

---

## Module 18 Glossary

| Term | Definition |
|---|---|
| Active share | Share of portfolio holdings differing from the benchmark |
| APT | Arbitrage pricing theory: multi-factor pricing from no-arbitrage |
| Capital market line | Efficient portfolios combining the risk-free asset and market portfolio |
| Efficient frontier | Portfolios with the highest return for each risk level |
| Glide path | Planned reduction of equity exposure as a goal nears |
| Information ratio | Active return / Tracking error |
| IPS | Investment policy statement |
| Jensen's alpha | Return above the CAPM-predicted return |
| M² | Risk-adjusted return scaled to market volatility |
| Money-weighted return | IRR of an investor's cash flows (XIRR) |
| Security market line | CAPM relation between beta and required return |
| Sharpe ratio | Excess return per unit of total risk |
| Smart beta | Rules-based factor-tilted investing |
| Time-weighted return | Compounded sub-period returns, independent of cash flows |
| Treynor ratio | Excess return per unit of beta |

## Module 18 Rapid-Fire Quiz

1. Return 14%, Rf 6%, σ 16%. Sharpe? **0.5**
2. Return 14%, Rf 6%, β 1.6. Treynor? **5.0**
3. Rf 6%, β 1.2, market 11%, actual 13%. Jensen's alpha? **+1%**
4. Active return 3%, tracking error 6%. Information ratio? **0.5**
5. Which return measure evaluates a fund manager? **Time-weighted**
6. Asset above the SML is? **Undervalued (positive alpha)**
7. Portfolio 70/30 drifts to 76/24 with a ±5 band. Rebalance? **Yes**
8. Which factor captures small minus big? **SMB (size)**
9. Minimum ticket for PMS in India? **₹50 lakh**
10. Risk tolerance vs capacity: which usually governs if lower? **The lower of the two**

## Module 18 [VERIFY] Items

1. SEBI IA Regulations (advice-distribution segregation, fee caps, 2024–25 amendments); PMS minimum
2. Historical correlations of Nifty, G-secs and gold in INR
3. IIM Ahmedabad Indian factor data library
4. Nifty factor index list and methodologies
5. SEBI hybrid fund categorisation; RBI household finance data; MF overseas limits; LRS limit
6. SEBI TRI benchmarking and performance disclosure circulars
7. SEBI/AMFI stress test disclosures; MF Seventh Schedule investment limits
8. SEBI SIF framework (2025); AIF minimums; MFD naming rules; current Income-tax Act provisions

---

# Module 19: Banking and Credit

> **Reference bank for this module: Sigma Bank (₹ Cr).** Assets: advances 70,000 (average yield 9%); investments 25,000 (yield 7%); cash and other assets 5,000; total 1,00,000. Liabilities: deposits 85,000 (average cost 5%; CASA 40%); borrowings 5,000 (cost 7%); equity 10,000. Other income 1,200; operating expenses 2,100; provisions 700; tax 25%.

## 19A. How Banks Make Money

### [19.1] The Bank Business Model and Balance Sheet
<!-- tags: domain=banking-credit; level=foundation; roles=Fintech-PM,ER,Consulting,CF,IB; keywords=bank business model, deposits, CASA, advances, investments, CRR, SLR, maturity transformation, fee income, treasury, interest rate transmission, MCLR, EBLR -->

**Definition.** A bank takes deposits (short-term, low-cost liabilities) and lends or invests them (longer-term, higher-yielding assets), earning the spread, plus fees for services. This maturity and credit transformation is valuable to the economy but creates liquidity, credit and interest rate risk.

**Why it matters.** Banks are the core of India's financial system and the partners, competitors and regulators' reference point for every fintech (payments, lending, deposits). Understanding a bank's balance sheet is essential for fintech PM, banking, credit and consulting roles.

**Core mechanics.**

*Liabilities (sources of funds):*
- **Deposits:** current accounts (non-interest or low interest), savings accounts (low interest) = **CASA**, the cheapest, stickiest funding; term deposits (higher cost)
- **Borrowings:** interbank, refinance (NABARD, SIDBI, NHB), bonds (infrastructure bonds, AT1, Tier 2), RBI facilities
- **Equity:** capital and reserves

*Assets (uses of funds):*
- **Cash and balances with RBI:** including the **cash reserve ratio (CRR)**, held with RBI and earning no interest
- **Investments:** mainly G-secs, held partly to meet the **statutory liquidity ratio (SLR)**
- **Advances (loans):** retail (home, auto, personal, cards), MSME, agriculture, corporate; must meet **priority sector lending** targets
- **Fixed and other assets**

*Income streams:* net interest income (NII); fee income (processing fees, cards, third-party product distribution, transaction banking, forex); treasury gains; recoveries.

*Interest rate transmission:* floating retail and MSME loans are linked to external benchmarks (usually the repo rate) through the external benchmark lending rate (EBLR); older and corporate loans may be linked to the marginal cost of funds based lending rate (MCLR). Policy rate changes therefore pass to EBLR loans quickly, while deposit rates adjust more slowly.

**Worked example: Sigma Bank's balance sheet.**

| Liabilities | ₹ Cr | Assets | ₹ Cr |
|---|---|---|---|
| CASA deposits (40%) | 34,000 | Advances | 70,000 |
| Term deposits | 51,000 | Investments (G-secs) | 25,000 |
| Borrowings | 5,000 | Cash, RBI balances, other | 5,000 |
| Equity | 10,000 | | |
| **Total** | **1,00,000** | **Total** | **1,00,000** |

- Credit-deposit (CD) ratio = 70,000 / 85,000 = **82.4%**
- Leverage = Assets / Equity = **10x**

**Indian context.** CRR and SLR are set by RBI (CRR was reduced in phases in 2025 and SLR has stood at 18%) [VERIFY: current CRR and SLR]. Priority sector lending targets are 40% of adjusted net bank credit for domestic scheduled commercial banks, with sub-targets for agriculture and weaker sections; small finance banks have higher targets [VERIFY: RBI Master Directions on Priority Sector Lending]. Deposits are insured by DICGC up to ₹5 lakh per depositor per bank [VERIFY: DICGC cover limit].

**Common mistakes.**
- Treating deposits as the bank's assets (they are liabilities).
- Ignoring that CRR balances earn nothing, which raises the effective cost of deposits.
- Assuming policy rate cuts immediately lower deposit costs (term deposits reprice only on renewal).

**Interview angle.**
1. *How does a bank make money?* It earns the spread between lending and investment yields and its cost of deposits and borrowings (NII), plus fees, minus operating costs and credit losses.
2. *Why is CASA so important?* It's the cheapest and most stable funding; a higher CASA ratio lowers cost of funds and supports NIMs.
3. *How does an RBI repo rate cut affect a bank's margins in the short term?* EBLR-linked loans reprice down quickly while term deposits reprice slowly, so NIMs typically compress first, then recover as deposits reprice.

**Related topics:** [19.2] Bank profitability, [19.6] Liquidity regulation, [25.2] Monetary policy.

---

### [19.2] Bank Profitability: NII, NIM, Cost-to-Income, RoA and RoE
<!-- tags: domain=banking-credit; level=intermediate; roles=ER,Fintech-PM,Consulting,IB; keywords=net interest income, net interest margin, yield on advances, cost of funds, cost to income ratio, pre-provision operating profit, credit cost, return on assets, return on equity, bank DuPont -->

**Definition.** Bank profitability is analysed through a sequence of metrics: net interest income and margin, other income, operating efficiency, credit costs, and finally return on assets and equity.

**Why it matters.** Bank stocks are valued on RoE relative to cost of equity (P/B), and every analyst, consultant or fintech strategist working with banks uses this metric chain.

**Core mechanics.**
- **NII** = Interest earned − Interest expended
- **NIM** = NII / Average interest-earning assets
- **Spread** = Yield on assets − Cost of funds
- **Cost-to-income ratio** = Operating expenses / (NII + Other income)
- **Pre-provision operating profit (PPOP)** = NII + Other income − Operating expenses
- **Credit cost** = Provisions / Average advances
- **RoA** = PAT / Average total assets
- **RoE** = PAT / Average equity = RoA × Leverage (Assets / Equity)
- **Bank DuPont (all as % of average assets):** NII + Other income − Opex − Provisions − Tax = RoA

**Worked example: Sigma Bank P&L (₹ Cr).**

| Line | Calculation | ₹ Cr | % of assets |
|---|---|---|---|
| Interest earned | 70,000 × 9% + 25,000 × 7% | 8,050 | 8.05% |
| Interest expended | 85,000 × 5% + 5,000 × 7% | (4,600) | (4.60%) |
| **NII** | | **3,450** | 3.45% |
| Other income | | 1,200 | 1.20% |
| Operating expenses | | (2,100) | (2.10%) |
| **PPOP** | | **2,550** | 2.55% |
| Provisions (credit cost 1.0%) | | (700) | (0.70%) |
| PBT | | 1,850 | 1.85% |
| Tax at 25% | | (462.5) | (0.46%) |
| **PAT** | | **1,387.5** | **1.39% (RoA)** |

- NIM = 3,450 / 95,000 earning assets = **3.63%**
- Cost-to-income = 2,100 / 4,650 = **45.2%**
- RoE = 1.39% × 10 = **13.9%**

*Sensitivity:* if credit costs rise to 2% (₹1,400 Cr), PAT falls to ₹862.5 Cr: RoA 0.86%, RoE 8.6%. Credit costs are the main swing factor in bank earnings across cycles.

**Indian context.** Leading Indian private banks have generally reported RoAs around 1.5–2% and RoEs of 15–18% in good years, while PSU banks' RoAs recovered from losses during the 2015–2020 NPA cycle [VERIFY: latest bank-wise RoA/RoE data from RBI or company disclosures]. NIMs differ widely: retail and unsecured-heavy lenders and small finance banks report higher NIMs (and higher credit costs) than corporate-focused banks.

**Common mistakes.**
- Comparing NIMs without considering asset mix and risk (high NIM can mean risky lending).
- Ignoring treasury gains, which are volatile and rate-dependent.
- Looking at RoE without checking leverage and capital adequacy.

**Interview angle.**
1. *Walk me through a bank's P&L.* Interest earned minus interest expended gives NII; add fee and other income; subtract opex to get PPOP; subtract provisions and tax to get PAT.
2. *Bank A has a 4.5% NIM, Bank B 3.2%. Which is better?* Not necessarily A: check asset mix, credit costs and risk-adjusted returns. A higher NIM from unsecured lending can come with much higher losses.
3. *What drives bank RoE?* NIM, fee income, cost efficiency, credit costs and leverage, constrained by capital requirements.

**Related topics:** [4.11] Sector metrics, [10.10] Valuing banks, [19.3] Asset quality.

---

## 19B. Credit Quality and Capital

### [19.3] Asset Quality: NPAs, Provisioning, Restructuring and Write-offs
<!-- tags: domain=banking-credit; level=intermediate; roles=ER,Fintech-PM,Consulting,Audit; keywords=non-performing asset, NPA, SMA, 90 days past due, substandard, doubtful, loss asset, provisioning norms, GNPA, NNPA, PCR, slippage ratio, write-off, restructuring, ARC -->

**Definition.** A non-performing asset (NPA) is a loan where interest or principal is overdue for more than 90 days. Banks classify, provide for and eventually recover or write off such loans under RBI's income recognition, asset classification and provisioning (IRACP) norms.

**Why it matters.** Asset quality is the biggest determinant of bank health. India's twin balance sheet problem (stressed corporates and banks) in the 2010s showed how NPA cycles can depress credit growth for years. Lending fintechs track equivalent metrics (DPD buckets) daily.

**Core mechanics.**

*Early warning (special mention accounts):*

| Category | Days past due (DPD) |
|---|---|
| SMA-0 | 1–30 |
| SMA-1 | 31–60 |
| SMA-2 | 61–90 |
| NPA | >90 |

*NPA classification and indicative provisioning (banks, IRACP):*

| Category | Definition | Provision (indicative) |
|---|---|---|
| Standard | Performing | 0.25–1% depending on segment (commonly 0.4%) |
| Substandard | NPA for ≤12 months | 15% (higher for unsecured) |
| Doubtful D1 | Substandard for up to 1 year more | 25% of secured portion + 100% unsecured |
| Doubtful D2 | 1–3 years in doubtful | 40% of secured + 100% unsecured |
| Doubtful D3 | >3 years in doubtful | 100% |
| Loss | Identified as uncollectible | 100% |

[VERIFY: RBI Master Circular on IRACP, current provisioning percentages]

*Key metrics:*
- GNPA ratio = Gross NPAs / Gross advances
- NNPA ratio = (GNPA − Provisions) / (Gross advances − Provisions)
- PCR = Provisions / GNPA (with or without technical write-offs)
- Slippage ratio = Fresh NPAs during the period / Opening standard advances
- Credit cost = Provisions / Average advances

*Resolution routes:* recovery and upgrades, restructuring (under RBI's prudential framework for resolution of stressed assets, June 2019), sale to asset reconstruction companies (ARCs), SARFAESI enforcement, Debt Recovery Tribunals, IBC (see [19.9]), and write-offs (technical write-offs keep recovery efforts going).

**Worked example: NPA movement.** Opening GNPA ₹2,000 Cr; slippages ₹1,200 Cr; recoveries and upgrades ₹600 Cr; write-offs ₹400 Cr.
- Closing GNPA = 2,000 + 1,200 − 600 − 400 = **₹2,200 Cr**
- If gross advances are ₹70,000 Cr: GNPA ratio = **3.14%**
- With provisions of ₹1,540 Cr: PCR = **70%**; NNPA = 660 / (70,000 − 1,540) = **0.96%**
- If opening standard advances were ₹65,000 Cr: slippage ratio = 1,200 / 65,000 = **1.85%**

**Indian context.** Indian banks' gross NPAs peaked above 11% of advances around March 2018 after RBI's Asset Quality Review (2015–16) and have since fallen to multi-year lows [VERIFY: RBI Financial Stability Report latest GNPA figures]. RBI has proposed moving banks to an expected credit loss (ECL) framework from April 2027 [VERIFY: RBI ECL directions and timeline]. For NBFCs, the NPA recognition norm was harmonised to 90 days, with upgradation only after all arrears are cleared (November 2021 clarification) [VERIFY: RBI IRACP clarification for NBFCs].

**Common mistakes.**
- Looking at GNPA alone without PCR or slippages.
- Treating restructured loans as fully healthy.
- Ignoring "evergreening" (lending new money to repay old loans to avoid NPA recognition), which RBI and auditors watch for.

**Interview angle.**
1. *When does a loan become an NPA?* When interest or principal remains overdue for more than 90 days (with specific rules for agriculture and other segments).
2. *GNPA fell, but is asset quality improving?* Check whether it fell from recoveries and upgrades (good) or write-offs and sales to ARCs (accounting), and whether slippages and SMA-2 pools are falling.
3. *What is a high PCR good for?* It means NPAs are well provided for, so future losses on them are less likely to hit profits, and recoveries can be written back.

**Related topics:** [2.10] ECL accounting, [19.9] IBC, [20.3] Credit risk.

---

### [19.4] Capital Adequacy: Basel III, CET1, AT1, Tier 2 and Risk-Weighted Assets
<!-- tags: domain=banking-credit; level=intermediate; roles=ER,IB,Consulting,Fintech-PM; keywords=Basel III, capital adequacy ratio, CRAR, CET1, Additional Tier 1, Tier 2, risk-weighted assets, capital conservation buffer, D-SIB, leverage ratio, ICAAP, Pillar 1 2 3 -->

**Definition.** Capital adequacy rules require banks to hold minimum capital against their risk-weighted assets (RWA), so they can absorb losses without failing. Basel III, implemented in India by RBI, sets the definitions and minimums.

**Why it matters.** Capital constrains how fast a bank can grow, how much it can pay in dividends and when it must raise equity. Capital rules also shape fintech partnerships (e.g., co-lending, risk weights on consumer credit).

**Core mechanics.**

*Basel framework:*
- **Pillar 1:** minimum capital for credit, market and operational risk
- **Pillar 2:** supervisory review and the bank's internal capital adequacy assessment process (ICAAP)
- **Pillar 3:** market discipline through disclosures

*Capital tiers:*
- **Common Equity Tier 1 (CET1):** equity capital and retained earnings, minus deductions (intangibles, deferred tax assets, etc.)
- **Additional Tier 1 (AT1):** perpetual instruments with loss absorption (write-down or conversion)
- **Tier 2:** subordinated debt, certain provisions; loss-absorbing at the point of non-viability

*Ratios:* CET1 ratio = CET1 / RWA; Tier 1 ratio; CRAR (total capital ratio) = (Tier 1 + Tier 2) / RWA

*RBI minimums (indicative):*

| Measure | Minimum | With capital conservation buffer (2.5%) |
|---|---|---|
| CET1 | 5.5% | 8.0% |
| Tier 1 | 7.0% | 9.5% |
| Total capital (CRAR) | 9.0% | 11.5% |

Additional buffers for domestic systemically important banks (D-SIBs: SBI, HDFC Bank, ICICI Bank), a countercyclical buffer (currently not activated), and a leverage ratio floor apply [VERIFY: RBI Basel III Master Circular, D-SIB list and surcharges, leverage ratio minimum].

*Risk weights (standardised approach):* vary by exposure type and external rating: e.g., claims on the Government of India 0%; residential mortgages depend on loan-to-value and size; regulatory retail 75%; unrated corporates 100%; RBI raised risk weights on unsecured consumer credit and bank lending to NBFCs in November 2023 [VERIFY: RBI November 2023 risk weight circular and any 2025 rollbacks].

**Worked example: Sigma Bank's CRAR.**

| Exposure | Amount (₹ Cr) | Risk weight | RWA |
|---|---|---|---|
| Retail loans | 30,000 | 75% | 22,500 |
| Corporate loans | 40,000 | 100% | 40,000 |
| G-secs (credit risk) | 25,000 | 0% | 0 |
| Market risk (capital charge converted to RWA) | | | 2,000 |
| Operational risk RWA | | | 8,000 |
| **Total RWA** | | | **72,500** |

Capital: CET1 ₹9,000 Cr; AT1 ₹500 Cr; Tier 2 ₹1,000 Cr.
- CET1 ratio = 9,000 / 72,500 = **12.4%**
- Tier 1 ratio = 9,500 / 72,500 = **13.1%**
- CRAR = 10,500 / 72,500 = **14.5%**, comfortably above the 11.5% requirement

*Growth constraint:* to grow loans 20% (adding about ₹14,000 Cr of RWA at a blended 90% weight, ≈ ₹12,600 Cr) while keeping CET1 at 12%, the bank needs CET1 of about 12% × 85,100 = ₹10,212 Cr, i.e., ₹1,212 Cr more, which must come from retained earnings (PAT ₹1,387.5 Cr less dividends) or fresh equity.

**Indian context.** Indian banks report capital ratios quarterly in Pillar 3 disclosures. Government recapitalisation of PSU banks (including through recapitalisation bonds, 2017–2021) restored capital after the NPA cycle [VERIFY: PSU bank recapitalisation totals].

**Common mistakes.**
- Comparing capital ratios without considering the risk-weight methodology.
- Treating AT1 as equivalent to equity for investors (it ranks above common equity but can be written down).
- Ignoring that fast loan growth consumes capital.

**Interview angle.**
1. *What is CET1 and why is it the most important ratio?* Core equity capital as a share of RWA; it absorbs losses first and on a going-concern basis.
2. *How do higher risk weights on unsecured loans affect fintech partnerships?* Banks and NBFCs need more capital per rupee lent, so lending to fintech-originated unsecured loans becomes more expensive and partners tighten terms or pricing.
3. *What limits a bank's growth?* Capital (CET1), funding (deposits, especially CASA), liquidity ratios and risk appetite.

**Related topics:** [16.8] AT1 bonds, [19.2] Profitability, [20.1] Risk management framework.

---

### [19.5] Credit Appraisal: Corporate, MSME and Retail Lending
<!-- tags: domain=banking-credit; level=intermediate; roles=Fintech-PM,Consulting,CF,ER; keywords=credit appraisal, 5 Cs of credit, cash flow lending, collateral, FOIR, LTV ratio, DSCR, credit score, CIBIL, bureau, underwriting, scorecard, alternative data -->

**Definition.** Credit appraisal is the process of assessing a borrower's ability and willingness to repay, structuring the loan, and pricing it for risk.

**Why it matters.** Underwriting quality determines a lender's credit costs. Fintech lenders differentiate through data-driven underwriting (bank statement analysis, GST data, account aggregator data), so PMs and strategists must understand both traditional and digital approaches.

**Core mechanics.**

*The 5 Cs of credit:*
1. **Character:** willingness to repay (credit history, bureau score, management integrity)
2. **Capacity:** ability to repay from cash flows (DSCR for businesses, FOIR for individuals)
3. **Capital:** borrower's own stake (net worth, margin money)
4. **Collateral:** security and its realisable value (loan-to-value)
5. **Conditions:** loan purpose, industry and economic conditions

*Retail underwriting metrics:*
- **FOIR (fixed obligations to income ratio)** = Total EMIs (existing + proposed) / Net monthly income; caps typically 40–60% depending on income level
- **LTV (loan-to-value)** = Loan / Property or asset value (RBI caps LTV for home loans by loan size) [VERIFY: RBI home loan LTV caps]
- **Credit score:** CIBIL (TransUnion), Experian, Equifax and CRIF High Mark; scores range 300–900
- **Scorecards:** application scorecards predict probability of default from bureau and application data; behaviour scorecards use repayment history

*Business and MSME underwriting:*
- Financial statements, bank statements, GST returns, ITRs
- DSCR, leverage, working capital cycle
- Cash-flow-based lending using digital data trails (GST invoices, UPI collections), increasingly via account aggregators
- Collateral and guarantees (including CGTMSE credit guarantees for MSMEs)

*Corporate underwriting:* industry analysis, management quality, financial projections, sensitivity analysis, security structure, covenants, external rating, consortium arrangements.

*Risk-based pricing:* Loan rate ≈ Cost of funds + Operating cost + Expected loss (PD × LGD) + Capital charge (cost of equity on allocated capital) + Margin.

**Worked example 1: home loan eligibility.** Net monthly income ₹1,00,000; existing EMIs ₹15,000; FOIR cap 50%.
- Maximum total EMIs = ₹50,000 → maximum new EMI = **₹35,000**
- At 9% for 20 years, EMI per ₹1 lakh = ₹899.7 → maximum loan = 35,000 / 899.7 × 1 lakh ≈ **₹38.9 lakh**
- If the property costs ₹50 lakh and the LTV cap is 80% (₹40 lakh), the binding constraint is income (₹38.9 lakh); the buyer needs about ₹11.1 lakh of their own funds.

**Worked example 2: pricing a personal loan.** Cost of funds 7.0%; operating cost 2.0%; PD 3% and LGD 80% → expected loss 2.4%; capital charge (equity 12% of exposure × 15% cost of equity, net of funding benefit) ≈ 1.0%; target margin 1.0%.
- Required rate ≈ 7.0 + 2.0 + 2.4 + 1.0 + 1.0 = **13.4%**
- A lender pricing at 12% for this risk segment is underpricing unless its PD estimate is too high.

**Indian context.** Credit information companies (CICs) are regulated by RBI under the CICRA 2005; RBI requires lenders to report data to all four CICs and has moved to more frequent (fortnightly) reporting [VERIFY: RBI directions on CIC data reporting frequency]. The account aggregator framework enables consented sharing of financial data for underwriting (see [21.7]). RBI's fair practices code requires disclosure of reasons for loan rejection and transparent pricing (Key Fact Statement for retail and MSME loans) [VERIFY: RBI KFS circular (April 2024)].

**Common mistakes.**
- Relying on collateral instead of repayment capacity (collateral is a fallback, not the primary source).
- Ignoring correlation between borrowers in the same segment or geography.
- Using bureau scores alone for thin-file (new-to-credit) customers.

**Interview angle.**
1. *What are the 5 Cs of credit?* Character, capacity, capital, collateral and conditions.
2. *(Fintech PM) How would you underwrite a small merchant with no credit history?* Use transaction data (UPI and card collections, GST filings), bank statements via account aggregator, business vintage and stability, plus small initial limits that grow with repayment behaviour.
3. *How should a lender price a loan?* Cost of funds + operating cost + expected loss + cost of capital for unexpected loss + margin.

**Related topics:** [4.5] Solvency ratios, [20.3] Credit risk models, [21.6] Digital lending.

---

## 19C. Liquidity, NBFCs and Resolution

### [19.6] Liquidity Regulation: CRR, SLR, LCR and NSFR
<!-- tags: domain=banking-credit; level=intermediate; roles=ER,Consulting,Fintech-PM,CF; keywords=cash reserve ratio, statutory liquidity ratio, liquidity coverage ratio, net stable funding ratio, HQLA, run-off rates, deposit run, digital bank run, structural liquidity -->

**Definition.** Liquidity regulation requires banks to hold enough liquid assets and stable funding to survive stress. India uses traditional reserve requirements (CRR, SLR) alongside Basel III's liquidity coverage ratio (LCR) and net stable funding ratio (NSFR).

**Why it matters.** Banks fail from liquidity runs faster than from losses (as seen globally with Silicon Valley Bank in 2023). Digital banking makes deposit outflows faster, prompting RBI to propose higher run-off factors for digitally accessible deposits.

**Core mechanics.**
- **CRR:** % of net demand and time liabilities (NDTL) kept as cash with RBI; earns no interest; also a monetary policy tool
- **SLR:** % of NDTL held in liquid assets (mainly G-secs, cash, gold)
- **LCR** = Stock of high-quality liquid assets (HQLA) / Total net cash outflows over the next 30 days under stress ≥ **100%**
  - HQLA: Level 1 (cash, G-secs, including part of SLR holdings), Level 2A and 2B (with haircuts)
  - Outflows apply run-off rates to liabilities (stable retail deposits lower; wholesale and less stable deposits higher)
- **NSFR** = Available stable funding / Required stable funding ≥ **100%** over a one-year horizon
- **Structural liquidity statement:** maps inflows and outflows by time bucket; negative gaps in short buckets must stay within limits

**Worked example: LCR.** HQLA ₹20,000 Cr. Stressed 30-day outflows ₹22,000 Cr; inflows ₹6,000 Cr.
- Net outflows = 22,000 − 6,000 = 16,000
- LCR = 20,000 / 16,000 = **125%**
- If the regulator raises run-off on digitally accessible retail deposits, adding ₹2,000 Cr of outflows, LCR falls to 20,000 / 18,000 = **111%**, still compliant but with less headroom

**Indian context.** RBI's LCR requirement is 100%, and RBI issued revised draft LCR norms in 2024 with additional run-off for internet and mobile banking-enabled deposits, later finalised with modifications [VERIFY: RBI final LCR circular (2025) and effective date]. SLR holdings that are also HQLA count toward LCR within limits (FALLCR) [VERIFY: FALLCR carve-out percentages].

**Common mistakes.**
- Assuming a well-capitalised bank can't fail from illiquidity.
- Treating all deposits as equally stable.
- Ignoring mark-to-market losses on "liquid" bond holdings when rates rise (a lesson from SVB).

**Interview angle.**
1. *CRR vs SLR?* CRR is cash held with RBI (no interest); SLR is liquid assets, mainly G-secs, held by the bank itself (earning interest).
2. *What does LCR measure?* Whether a bank has enough high-quality liquid assets to cover 30 days of stressed net outflows.
3. *What did the 2023 US bank failures teach?* Concentrated, uninsured, fast-moving deposits and unhedged interest rate risk in bond portfolios can trigger rapid runs, amplified by social media and digital banking.

**Related topics:** [19.7] ALM, [20.5] Liquidity risk, [25.2] RBI liquidity operations.

---

### [19.7] Asset-Liability Management (ALM) and Interest Rate Risk in the Banking Book
<!-- tags: domain=banking-credit; level=advanced; roles=ER,Consulting,CF,Fintech-PM; keywords=asset liability management, ALM, maturity gap, repricing gap, rate sensitive assets, rate sensitive liabilities, earnings at risk, economic value of equity, IRRBB, ALCO -->

**Definition.** Asset-liability management (ALM) manages the mismatch between the timing and repricing of a financial institution's assets and liabilities to control liquidity and interest rate risk.

**Why it matters.** ALM failures (borrowing short to lend long) caused the IL&FS and DHFL crises in India and US savings and loan crises historically. NBFCs and fintech lenders must manage ALM closely because they lack deposit franchises.

**Core mechanics.**
- **Maturity (liquidity) gap:** inflows minus outflows by time bucket (e.g., 1–7 days, 8–14 days, ... 1–3 years, 3–5 years, over 5 years)
- **Repricing gap:** rate-sensitive assets (RSA) minus rate-sensitive liabilities (RSL) repricing within a period
  - Change in NII ≈ Repricing gap × Change in rates
  - Positive gap (asset-sensitive): NII rises when rates rise
  - Negative gap (liability-sensitive): NII falls when rates rise
- **Economic value of equity (EVE):** change in PV of assets minus liabilities for a rate shock; ≈ −(D_A − D_L × L/A) × A × Δy (duration gap)
- **ALCO (asset-liability committee):** sets limits, pricing and funding strategies
- **Tools:** match funding, interest rate swaps, securitisation, liquidity buffers, diversified funding

**Worked example 1: repricing gap.** Within one year, Sigma Bank has RSA of ₹40,000 Cr (EBLR loans, short investments) and RSL of ₹50,000 Cr (term deposits renewing, borrowings).
- Gap = **−₹10,000 Cr** (liability-sensitive)
- A 1% rise in rates → NII falls by about **₹100 Cr** (≈7% of PAT before tax effects)
- A 1% fall → NII rises about ₹100 Cr. (In practice, EBLR loans reprice faster than deposits, so the actual sign can differ; the gap must be measured carefully.)

**Worked example 2: duration gap.** Assets ₹1,00,000 Cr with duration 2.0 years; liabilities ₹90,000 Cr with duration 0.8 years.
- Duration gap = 2.0 − 0.8 × 0.9 = **1.28 years**
- A 1% rise in rates → change in EVE ≈ −1.28 × 1,00,000 × 1% = **−₹1,280 Cr**, about 13% of equity of ₹10,000 Cr

**Indian context.** RBI's ALM framework for NBFCs requires liquidity risk management, cumulative mismatch limits in short buckets (e.g., the 1–7, 8–14 and 15–30 day buckets) and LCR for larger NBFCs [VERIFY: RBI liquidity risk management framework for NBFCs (2019) and LCR glide path]. IL&FS (2018) funded long-gestation infrastructure assets with short-term borrowings, and its default triggered a funding freeze for NBFCs.

**Common mistakes.**
- Measuring contractual maturities only (behavioural maturities of savings deposits and prepayments matter).
- Ignoring off-balance-sheet commitments (undrawn credit lines).
- Funding long-term loans with commercial paper because it's cheap.

**Interview angle.**
1. *What's ALM and why does it matter for NBFCs?* Managing mismatches between asset and liability maturities and repricing; NBFCs lack stable deposits, so a funding market freeze can make even solvent NBFCs illiquid.
2. *A bank has a negative one-year repricing gap. What happens if rates rise?* Liabilities reprice faster than assets, so NII falls.
3. *What caused the IL&FS crisis?* Severe asset-liability mismatch, high leverage, complex group structure and governance failures, culminating in defaults that froze NBFC funding markets.

**Related topics:** [16.3] Duration, [17.7] Swaps, [19.8] NBFCs.

---

### [19.8] NBFCs, HFCs, MFIs and the Scale-Based Regulatory Framework
<!-- tags: domain=banking-credit; level=intermediate; roles=Fintech-PM,Consulting,ER,IB; keywords=NBFC, scale based regulation, base layer, middle layer, upper layer, NBFC-ICC, HFC, NBFC-MFI, microfinance, co-lending, NBFC funding, bank vs NBFC -->

**Definition.** Non-banking financial companies (NBFCs) are RBI-regulated companies that lend and invest but cannot accept demand deposits (most cannot accept any public deposits) or issue cheques. India regulates NBFCs through a scale-based framework, with stricter rules for larger and more systemically important entities.

**Why it matters.** NBFCs are central to Indian credit (vehicle finance, gold loans, microfinance, consumer and MSME lending) and are the licence of choice for many fintech lenders. Fintech PMs and strategists need to know NBFC economics, regulation and funding.

**Core mechanics.**

*Scale-based regulation (SBR, effective October 2022):*

| Layer | Who | Regulatory intensity |
|---|---|---|
| Base layer (NBFC-BL) | Non-deposit-taking NBFCs below ₹1,000 Cr assets; P2P, AA, NOFHC, etc. | Lightest |
| Middle layer (NBFC-ML) | Deposit-taking NBFCs; non-deposit NBFCs ≥ ₹1,000 Cr; HFCs, IFCs, CICs, SPDs | Moderate; capital and governance norms |
| Upper layer (NBFC-UL) | Largest NBFCs identified by RBI using a scoring methodology (top 10 by size always included) | Bank-like: CET1, large exposure, listing requirement within 3 years |
| Top layer | Empty unless RBI sees a specific risk | Highest |

[VERIFY: RBI SBR Master Direction; current NBFC-UL list; base layer threshold]

*Types:* investment and credit companies (NBFC-ICC), housing finance companies (HFCs, regulated by RBI with NHB supervision), microfinance institutions (NBFC-MFIs), infrastructure finance companies, core investment companies (CICs), account aggregators, P2P lending platforms.

*Bank vs NBFC:*

| Feature | Bank | NBFC |
|---|---|---|
| Demand deposits / CASA | Yes | No |
| Payment system participation | Full | Limited |
| CRR / SLR | Yes | No CRR; liquidity buffers for larger NBFCs |
| Priority sector targets | Yes | No (but banks can lend to NBFCs for on-lending as PSL) |
| Funding | Deposits | Bank loans, NCDs, CP, securitisation, ECBs |
| Cost of funds | Lower | Higher |
| Agility in niches | Lower | Higher |

*Co-lending:* banks and NBFCs share loans (often 80:20), combining banks' low-cost funds with NBFCs' origination reach [VERIFY: RBI co-lending directions (2025 revision) extending beyond priority sector].

**Worked example: NBFC vs bank economics on an MSME loan.** Loan yield 16%.
- NBFC: cost of funds 9.5%, opex 3%, credit cost 2% → pre-tax RoA ≈ 16 − 9.5 − 3 − 2 = **1.5%** before leverage; with 5x leverage, pre-tax RoE ≈ 7.5% plus return on the equity-funded portion
- Bank: cost of funds 6% (CASA advantage), opex 2.5%, credit cost 2% → spread **5.5%**
- Co-lending (bank 80%, NBFC 20%) lets the NBFC earn origination and servicing fees on the bank's share, improving its RoE without using its own balance sheet.

**Indian context.** NBFC-MFIs follow RBI's 2022 microfinance framework, which caps loan repayment obligations at 50% of household income for low-income households and removed interest rate caps in favour of board-approved pricing policies [VERIFY: RBI microfinance directions (March 2022)]. Upper-layer NBFCs must list within three years of classification [VERIFY: SBR listing requirement].

**Common mistakes.**
- Assuming NBFCs are lightly regulated (large NBFCs face near-bank regulation).
- Ignoring funding concentration (bank borrowings) as a risk.
- Comparing NIMs of NBFCs and banks without adjusting for cost of funds and risk.

**Interview angle.**
1. *Why would a fintech get an NBFC licence instead of partnering?* To own the balance sheet and economics, control underwriting and customer experience, and reduce dependence on partners, at the cost of capital, compliance and funding needs.
2. *How do NBFCs fund themselves?* Bank term loans, NCDs, commercial paper, securitisation and direct assignment, ECBs, and equity.
3. *What's co-lending?* A partnership where a bank and NBFC jointly fund loans, combining the bank's cheap funds with the NBFC's distribution and underwriting.

**Related topics:** [19.7] ALM, [21.6] Digital lending, [24.2] RBI.

---

### [19.9] The Indian Banking Landscape, Recovery Mechanisms and the IBC
<!-- tags: domain=banking-credit; level=intermediate; roles=Consulting,IB,PE,Fintech-PM,ER; keywords=public sector banks, private banks, small finance banks, payments banks, cooperative banks, IBC, CIRP, committee of creditors, resolution plan, SARFAESI, DRT, ARC, haircut -->

**Definition.** India's banking system comprises public sector banks, private banks, foreign banks, small finance banks, payments banks, regional rural banks and cooperative banks. Lenders recover bad loans through SARFAESI, Debt Recovery Tribunals, asset reconstruction companies and the Insolvency and Bankruptcy Code (IBC).

**Why it matters.** The structure of the industry shapes competition with fintechs and partnership opportunities. The IBC changed creditor-debtor dynamics in India and is a frequent topic in consulting, PE (distressed investing) and banking interviews.

**Core mechanics.**

*Banking licence types:*

| Type | Key features |
|---|---|
| Public sector banks (PSBs) | Government majority-owned; large branch networks |
| Private sector banks | Universal banks; generally higher RoE and technology investment |
| Foreign banks | Corporate, trade and wealth focus |
| Small finance banks (SFBs) | Serve underbanked segments; higher PSL targets; small-ticket loans |
| Payments banks | Deposits (capped balance per customer) and payments; cannot lend |
| Regional rural banks, cooperative banks | Rural and local credit; dual regulation for cooperatives (RBI and state/central registrars) |

[VERIFY: payments bank deposit cap; SFB to universal bank transition norms]

*Recovery mechanisms:*
- **SARFAESI Act 2002:** secured creditors can enforce security (take possession and sell) without court intervention after notice
- **Debt Recovery Tribunals (DRTs):** for recovery suits
- **Asset reconstruction companies (ARCs):** buy NPAs from lenders, typically paying partly in cash and partly in security receipts
- **IBC 2016:** time-bound insolvency resolution

*IBC corporate insolvency resolution process (CIRP):*
1. Default of ₹1 Cr or more → financial or operational creditor (or the company) files with NCLT
2. Admission → moratorium on recovery actions; interim resolution professional takes control of the company
3. Committee of creditors (CoC, financial creditors) formed
4. Resolution professional invites resolution plans; CoC approves a plan with **66%** of voting share
5. NCLT approves the plan; if no plan within the time limit (**180 days**, extendable to **330 days** including litigation), the company goes into liquidation
- Liquidation waterfall under section 53 prioritises insolvency costs, secured creditors and workmen dues, then employees, unsecured financial creditors, government dues, etc.
- **Pre-packaged insolvency** for MSMEs (2021)

**Worked example: recovery and haircut.** Lenders' admitted claims ₹10,000 Cr. The best resolution plan offers ₹3,200 Cr; liquidation value is ₹2,000 Cr.
- Recovery rate = **32%**; haircut = **68%**
- The CoC compares the plan with liquidation value (₹2,000 Cr) and the time value of further delay; approving the plan recovers ₹1,200 Cr more than liquidation.
- A lender holding a 15% share of claims recovers ₹480 Cr against a ₹1,500 Cr claim, and against existing provisions of, say, ₹1,200 Cr (PCR 80%) it writes back ₹180 Cr.

**Indian context.** IBC resolutions have recovered roughly a third of admitted claims on average, with long delays beyond statutory timelines in many cases [VERIFY: IBBI quarterly newsletter recovery and timeline statistics]. The default threshold for initiating CIRP was raised from ₹1 lakh to ₹1 Cr in 2020. The National Asset Reconstruction Company (NARCL) was set up in 2021 to acquire large stressed assets [VERIFY: NARCL status]. RBI has consolidated rules for bank licensing, including on-tap licensing for universal and small finance banks [VERIFY: RBI on-tap licensing guidelines].

**Common mistakes.**
- Treating IBC as purely a liquidation law (its primary aim is resolution as a going concern).
- Ignoring the time value of recovery delays when evaluating haircuts.
- Assuming payments banks can lend.

**Interview angle.**
1. *What changed with IBC?* Control shifted from debtor to creditor ("creditor in possession"), promoters risk losing their companies on default, and resolution became time-bound, improving credit discipline.
2. *Why have IBC recoveries been lower than hoped?* Many cases entered IBC late with heavily eroded value, litigation delayed timelines, and limited buyer interest in some sectors.
3. *What's the difference between a small finance bank and a payments bank?* SFBs take deposits and lend, focusing on underserved segments; payments banks take limited deposits and offer payments but cannot lend.

**Related topics:** [19.3] NPAs, [12.6] Regulatory framework, [24.1] Regulators.

---

## Module 19 Glossary

| Term | Definition |
|---|---|
| ALM | Asset-liability management |
| CASA | Current and savings account deposits |
| CET1 | Common Equity Tier 1 capital |
| CoC | Committee of creditors under the IBC |
| CRAR | Capital to risk-weighted assets ratio |
| CRR | Cash reserve ratio held with RBI |
| FOIR | Fixed obligations to income ratio |
| HQLA | High-quality liquid assets |
| LCR | Liquidity coverage ratio |
| NIM | Net interest margin |
| NPA | Loan overdue for more than 90 days |
| PCR | Provision coverage ratio |
| RWA | Risk-weighted assets |
| SLR | Statutory liquidity ratio |
| SMA | Special mention account (early stress bucket) |

## Module 19 Rapid-Fire Quiz

1. Interest earned 900, interest expended 550, earning assets 10,000. NIM? **3.5%**
2. RoA 1.2%, leverage 11x. RoE? **13.2%**
3. Loan 75 days overdue: classification? **SMA-2**
4. CET1 minimum including CCB in India? **8%**
5. HQLA 300, net outflows 250. LCR? **120%**
6. Income ₹80,000/month, existing EMIs ₹10,000, FOIR cap 50%. Max new EMI? **₹30,000**
7. RSA 500, RSL 700, rates +1%. ΔNII? **−₹2 (−200 × 1%)**
8. IBC CoC approval threshold? **66% of voting share**
9. Can payments banks lend? **No**
10. GNPA 400, provisions 300, advances 10,000. NNPA ratio? **About 1.03%**

## Module 19 [VERIFY] Items

1. Current CRR and SLR; RBI Priority Sector Lending Master Directions; DICGC cover limit
2. Latest bank-wise RoA/RoE data
3. RBI IRACP Master Circular provisioning percentages; RBI Financial Stability Report GNPA; RBI ECL directions and timeline; NBFC IRACP clarification
4. RBI Basel III Master Circular; D-SIB list and surcharges; leverage ratio; November 2023 risk weight circular and later changes; PSU recapitalisation totals
5. RBI home loan LTV caps; CIC reporting frequency; KFS circular (April 2024)
6. RBI final LCR circular (2025); FALLCR carve-out
7. RBI liquidity risk framework for NBFCs and LCR glide path
8. RBI SBR Master Direction; NBFC-UL list; base layer threshold; co-lending directions (2025); microfinance directions (2022)
9. Payments bank deposit cap; SFB transition norms; IBBI recovery statistics; NARCL status; on-tap licensing

---

# Module 20: Risk Management

### [20.1] Enterprise Risk Management: Frameworks, Risk Appetite and the Three Lines Model
<!-- tags: domain=risk-management; level=foundation; roles=Consulting,CF,Fintech-PM,Audit; keywords=enterprise risk management, ERM, risk appetite, risk taxonomy, three lines model, COSO ERM, ISO 31000, risk register, key risk indicators, chief risk officer -->

**Definition.** Enterprise risk management (ERM) is the organisation-wide process of identifying, assessing, responding to, monitoring and reporting risks in line with a board-approved risk appetite. The three lines model separates who owns, oversees and independently assures risk.

**Why it matters.** Banks, NBFCs, insurers and payment companies must have formal risk functions under regulation; corporates use ERM to protect strategy and value. Consulting risk practices and fintech risk teams are major employers.

**Core mechanics.**

*Risk taxonomy (typical):*

| Category | Examples |
|---|---|
| Strategic | Competition, technology disruption, regulation changes |
| Financial: market | Interest rates, FX, equity, commodity prices |
| Financial: credit | Borrower or counterparty default |
| Financial: liquidity | Funding and market liquidity |
| Operational | Process failures, fraud, people, systems, cyber, third parties |
| Compliance / legal | Regulatory breaches, litigation, AML/KYC failures |
| Reputational | Loss of trust, often a consequence of other risks |
| ESG / climate | Physical and transition risks |

*ERM process (ISO 31000 / COSO ERM 2017):*
1. Set context and objectives
2. Identify risks (risk register)
3. Assess: likelihood × impact (heat map), inherent vs residual risk
4. Respond: avoid, reduce (controls), transfer (insurance, hedging, outsourcing), accept
5. Monitor: key risk indicators (KRIs) with thresholds
6. Report to management and the board's risk committee

*Risk appetite:* the amount and type of risk the organisation is willing to take to meet objectives, expressed through limits (e.g., "credit cost not above 2.5% of AUM", "no more than 15% of book in any single state", "zero tolerance for regulatory KYC breaches").

*Three lines model (IIA 2020):*
- **First line:** business units own and manage risks (product, operations, lending teams)
- **Second line:** risk management and compliance functions set frameworks, monitor and challenge
- **Third line:** internal audit gives independent assurance to the board

**Worked example: risk heat map for a digital lender.**

| Risk | Likelihood (1–5) | Impact (1–5) | Score | Response |
|---|---|---|---|---|
| Credit losses rise in unsecured personal loans | 4 | 4 | 16 | Tighten scorecard cut-offs, cap segment exposure |
| Regulatory change to digital lending norms | 3 | 5 | 15 | Compliance monitoring, flexible partner model |
| Data breach of customer KYC data | 2 | 5 | 10 | Encryption, access controls, cyber insurance |
| Collection agent misconduct | 3 | 3 | 9 | Training, call recording, agent audits |
| Payment gateway outage | 2 | 3 | 6 | Multi-gateway redundancy |

**Indian context.** RBI requires banks and larger NBFCs to have a chief risk officer with independence safeguards and board risk management committees [VERIFY: RBI CRO guidelines for banks (2021) and NBFCs under SBR]. SEBI LODR requires the top 1,000 listed companies to have a risk management committee [VERIFY: LODR Reg 21 applicability]. RBI's integrated ombudsman and digital lending rules add conduct-risk expectations for regulated entities and their lending service providers.

**Common mistakes.**
- Treating ERM as a compliance checklist rather than input to strategy.
- Risk registers with no owners, KRIs or actions.
- Second-line risk functions that are not independent of the business they challenge.

**Interview angle.**
1. *Explain the three lines model.* Business owns risk (first line), risk and compliance oversee and challenge (second), internal audit provides independent assurance (third).
2. *What is risk appetite?* The board-approved level and type of risk the organisation will accept in pursuit of its goals, translated into measurable limits.
3. *(Fintech PM) What risks would you consider before launching a new credit product?* Credit (underwriting, fraud), regulatory (lending and data norms), operational (systems, collections conduct), liquidity (funding), and reputational risks.

**Related topics:** [6.5] Internal controls, [20.2] Market risk, [20.4] Operational risk.

---

### [20.2] Market Risk: Value at Risk, Expected Shortfall and Stress Testing
<!-- tags: domain=risk-management; level=advanced; roles=ER,CF,Consulting,IB; keywords=market risk, value at risk, VaR, parametric VaR, historical simulation, Monte Carlo VaR, expected shortfall, CVaR, backtesting, stress testing, square root of time -->

**Definition.** Market risk is the risk of losses from changes in market prices (interest rates, FX, equities, commodities). Value at Risk (VaR) estimates the maximum loss over a horizon at a given confidence level under normal conditions; expected shortfall (ES) estimates the average loss in the tail beyond VaR.

**Why it matters.** Trading desks, bank treasuries, mutual funds and corporate treasuries measure and limit market risk with VaR and stress tests. VaR is a standard interview question, including its limitations.

**Core mechanics.**

*VaR methods:*
- **Parametric (variance-covariance):** VaR = Portfolio value × z × σ (for the horizon); assumes normal returns. z = 1.645 (95%), 2.326 (99%)
- **Historical simulation:** revalue today's portfolio under actual past daily moves (e.g., last 500 days) and read off the loss percentile
- **Monte Carlo:** simulate thousands of scenarios from a model of risk factors
- **Square-root-of-time scaling:** VaR(T days) ≈ VaR(1 day) × √T (assumes independent returns)

*Expected shortfall (CVaR):* average loss given that the loss exceeds VaR. Under normality: ES = Portfolio value × σ × φ(z) / (1 − confidence). Basel's market risk framework (FRTB) uses 97.5% ES.

*Backtesting:* count days when actual losses exceed VaR; at 99%, about 2.5 exceptions in 250 days are expected; too many signals an underestimating model.

*Stress testing and scenario analysis:* historical scenarios (2008, March 2020 COVID crash, 2013 taper tantrum for INR) and hypothetical shocks (e.g., +200 bps rates, 20% equity fall, 10% INR depreciation).

**Worked example.** A ₹100 Cr equity portfolio with daily volatility of 1.5%.
- 1-day 99% VaR = 100 × 2.326 × 1.5% = **₹3.49 Cr**: on 99 days out of 100, the loss should not exceed ₹3.49 Cr
- 10-day 99% VaR = 3.49 × √10 = **₹11.03 Cr**
- 1-day 95% VaR = 100 × 1.645 × 1.5% = **₹2.47 Cr**
- 1-day 99% ES (normal) = 100 × 1.5% × φ(2.326) / 0.01 = **₹4.00 Cr**: average loss on the worst 1% of days

Historical simulation: with 500 days of history, the 99% 1-day VaR is approximately the 5th-worst simulated loss.

**Indian context.** Indian clearing corporations' margin systems are built on VaR-type models (SPAN-based initial margins plus extreme loss margins) [VERIFY: SEBI/NSE Clearing margin methodology]. RBI requires banks to hold capital for market risk in the trading book and conduct stress tests; RBI's Financial Stability Report publishes system-wide stress test results [VERIFY: RBI market risk capital framework and FRTB implementation status].

**Common mistakes.**
- Treating VaR as the maximum possible loss (it says nothing about how bad tail losses can be).
- Assuming normal distributions for fat-tailed assets.
- Scaling by √T when returns are autocorrelated or positions change.

**Interview angle.**
1. *What does a 1-day 99% VaR of ₹5 Cr mean?* There's a 1% chance of losing more than ₹5 Cr in a day under normal market conditions; it doesn't say how much more.
2. *What are VaR's limitations?* Ignores tail severity, depends on model and history, assumes liquidity, isn't sub-additive (diversification can appear to increase VaR), and can create false comfort.
3. *Why did regulators move from VaR to expected shortfall?* ES measures the average loss in the tail, capturing tail risk that VaR ignores, and is a coherent risk measure.

**Related topics:** [18.2] Portfolio risk, [20.7] Stress testing, [17.5] Greeks.

---

### [20.3] Credit Risk Measurement: PD, LGD, EAD, Expected and Unexpected Loss
<!-- tags: domain=risk-management; level=advanced; roles=Fintech-PM,ER,Consulting,CF; keywords=credit risk, probability of default, loss given default, exposure at default, expected loss, unexpected loss, credit VaR, concentration risk, scorecard, Gini, KS statistic, vintage analysis, roll rates -->

**Definition.** Credit risk measurement quantifies potential losses from borrower default using probability of default (PD), loss given default (LGD) and exposure at default (EAD). Expected loss (EL) is priced and provided for; unexpected loss (UL) is covered by capital.

**Why it matters.** Credit risk is the largest risk for lenders. Fintech lending products live or die on credit models, and PM, risk and strategy roles need to read scorecard performance, vintage curves and roll rates.

**Core mechanics.**
- **EL = PD × LGD × EAD** (provided for and priced into the loan)
- **UL (single exposure)** ≈ EAD × LGD × √[PD × (1 − PD)] (ignoring LGD volatility); portfolio UL depends on correlations between defaults
- **Credit VaR / economic capital:** loss at a high confidence level minus EL
- **Concentration risk:** large single-name, sector or geography exposures increase tail losses
- **Model types:**
  - Retail: logistic regression and machine learning scorecards using bureau, application and alternative data
  - Corporate: rating models, structural models (Merton: default when asset value falls below debt), market-implied PDs from bond spreads or CDS
- **Model performance metrics:** Gini coefficient and AUC (discrimination), KS statistic (max separation between good and bad cumulative distributions), population stability index (PSI, input drift), calibration (predicted vs actual default rates)
- **Portfolio monitoring:**
  - **Vintage analysis:** cumulative default or delinquency rates by origination month over months-on-book
  - **Roll rates:** % of accounts moving from one delinquency bucket to the next (current → 1–30 → 31–60 → 61–90 → 90+)
  - Early warning indicators: bounce rates on first EMI (FPD), utilisation spikes, bureau inquiries

**Worked example 1: portfolio expected loss (₹ Cr).**

| Segment | EAD | PD | LGD | EL |
|---|---|---|---|---|
| Secured home loans | 500 | 1% | 40% | 2.0 |
| Business loans | 300 | 3% | 60% | 5.4 |
| Unsecured personal loans | 200 | 6% | 70% | 8.4 |
| **Total** | **1,000** | | | **15.8 (1.58%)** |

Unsecured loans are 20% of exposure but 53% of expected loss.

**Worked example 2: unexpected loss.** A single ₹100 Cr exposure with PD 2% and LGD 45%:
- EL = **₹0.9 Cr**
- UL ≈ 100 × 45% × √(0.02 × 0.98) = **₹6.3 Cr**, seven times the EL. This is why capital, not provisions, absorbs surprises.

**Worked example 3: roll rates.** Of ₹100 Cr current loans, 4% roll to 1–30 DPD; 35% of those roll to 31–60; 50% to 61–90; 70% to 90+.
- Expected flow to NPA = 100 × 4% × 35% × 50% × 70% = **₹0.49 Cr** per month from this cohort, a basis for collections staffing and provisioning.

**Indian context.** RBI's model risk management expectations and the proposed ECL framework will require banks to build PD/LGD models [VERIFY: RBI draft ECL directions and model risk guidance]. Digital lenders use bureau data plus account aggregator bank statements and alternative data; RBI's digital lending directions restrict data collection to what is necessary, with consent [VERIFY: RBI Digital Lending Directions 2025 data provisions].

**Common mistakes.**
- Assuming EL covers all losses (UL needs capital).
- Ignoring correlation; defaults cluster in downturns.
- Judging new loan books before they season (early vintages look clean because loans haven't had time to default).

**Interview angle.**
1. *What's the difference between expected and unexpected loss?* EL is the average anticipated loss, covered by pricing and provisions; UL is the variability around it, covered by capital.
2. *How would you know if your credit model is degrading?* Falling Gini or KS on recent data, rising PSI (input drift), and actual default rates exceeding predicted ones in recent vintages.
3. *Why do fast-growing lending books look healthier than they are?* Denominator effect and seasoning: rapid disbursements inflate the book while defaults on new loans haven't appeared yet.

**Related topics:** [19.3] NPAs, [19.5] Credit appraisal, [2.10] ECL.

---

### [20.4] Operational, Cyber, Fraud and Third-Party Risk
<!-- tags: domain=risk-management; level=intermediate; roles=Fintech-PM,Consulting,Audit,CF; keywords=operational risk, Basel event types, fraud risk, cyber risk, outsourcing risk, third-party risk, RCSA, KRIs, loss event database, business continuity, operational resilience, payment fraud -->

**Definition.** Operational risk is the risk of loss from inadequate or failed internal processes, people and systems, or from external events, including legal risk. It covers fraud, cyber incidents, outages, errors and third-party failures.

**Why it matters.** For payments and fintech companies, operational risk is often the largest risk: an outage, a fraud wave or a data breach can cost money, licences and trust. RBI has penalised and restricted entities for technology and compliance lapses.

**Core mechanics.**

*Basel operational loss event types:* internal fraud; external fraud; employment practices and workplace safety; clients, products and business practices; damage to physical assets; business disruption and system failures; execution, delivery and process management.

*Management tools:*
- **RCSA (risk and control self-assessment):** business units assess their risks and controls
- **KRIs:** e.g., failed transactions %, fraud loss per ₹1 lakh TPV, system uptime, reconciliation breaks, staff attrition in critical roles
- **Loss event database:** record internal losses and near misses
- **Scenario analysis:** severe but plausible events (e.g., 24-hour UPI switch outage)
- **Business continuity and operational resilience:** recovery time objectives (RTO), recovery point objectives (RPO), disaster recovery sites
- **Third-party / outsourcing risk:** due diligence, contracts, audit rights, concentration on single cloud or vendor

*Fraud risk in payments and lending:* account takeover, SIM swap, phishing and social engineering (authorised push payment fraud), synthetic identities, first-party fraud ("bust-out"), merchant collusion, mule accounts.

*Capital:* Basel III's revised standardised approach for operational risk uses a business indicator component scaled by historical losses.

**Worked example: fraud KRI and business case.** A payments app processes ₹50,000 Cr TPV a month; fraud losses run at ₹1.5 per ₹1 lakh TPV.
- Monthly fraud loss = 50,000 Cr × 1.5 / 1,00,000 = **₹75 lakh**
- A device-binding and behavioural analytics upgrade costing ₹3 Cr a year is expected to cut fraud by 40% (₹30 lakh a month = ₹3.6 Cr a year) → net benefit ₹0.6 Cr a year plus reputational protection. Customer friction (false declines) must also be measured, since declines cost revenue and trust.

**Indian context.** RBI's Master Directions on IT governance, cyber security and outsourcing of IT services set requirements for regulated entities; CERT-In requires reporting of cyber incidents within 6 hours [VERIFY: RBI IT Governance Master Direction (2023); outsourcing of IT services (2023); CERT-In directions (April 2022)]. The Digital Personal Data Protection Act 2023 and its rules govern personal data processing [VERIFY: DPDP Rules notification and timelines]. RBI has used business restrictions on regulated entities for persistent IT and compliance lapses (e.g., stopping new customer onboarding or card issuance).

**Common mistakes.**
- Measuring fraud losses but not false-positive costs.
- Concentrating critical services on a single vendor without exit plans.
- Treating cyber risk as purely an IT problem rather than a board-level business risk.

**Interview angle.**
1. *What is operational risk? Give fintech examples.* Losses from failed processes, people, systems or external events: payment outages, reconciliation errors, fraud, data breaches, vendor failures.
2. *How would you reduce UPI fraud on your app?* Device binding, behavioural biometrics, risk-based step-up authentication, payee warnings and confirmation of payee names, velocity checks, mule account detection and user education.
3. *What is operational resilience?* The ability to continue critical services through disruptions, defined by impact tolerances and tested through scenarios, not just preventing failures.

**Related topics:** [6.5] Internal controls, [21.5] Payments, [6.10] Fraud.

---

### [20.5] Liquidity Risk and Contingency Funding
<!-- tags: domain=risk-management; level=intermediate; roles=CF,Fintech-PM,Consulting,ER; keywords=funding liquidity risk, market liquidity risk, contingency funding plan, survival horizon, liquidity buffer, cash runway, redemption risk, fire sale, wrong-way risk -->

**Definition.** Liquidity risk has two forms: funding liquidity risk (inability to meet obligations as they fall due) and market liquidity risk (inability to sell assets without large price concessions). A contingency funding plan (CFP) sets actions for stress.

**Why it matters.** Liquidity crises spread fast and kill solvent firms: IL&FS, Lehman, SVB, and open-ended debt funds facing redemptions. Startups face the same risk as "runway". Treasury, fintech and risk roles all deal with it.

**Core mechanics.**
- **Survival horizon:** days the firm can meet net outflows using available liquid resources under stress
- **Liquidity buffer:** unencumbered high-quality liquid assets plus committed undrawn lines
- **Stress scenarios:** idiosyncratic (rating downgrade, fraud headline), market-wide (credit freeze), combined
- **CFP components:** early warning indicators (spreads widening, deposit outflows, inability to roll CP), escalation triggers, actions (draw committed lines, sell or repo liquid assets, slow lending, securitise loans, raise equity), communication plan
- **Market liquidity:** bid-ask spreads, market depth, time to liquidate; illiquid assets require haircuts in stress
- **Wrong-way risk:** liquidity sources that disappear exactly when needed (e.g., credit lines from banks that are themselves stressed)

**Worked example: NBFC survival horizon.** Unencumbered liquid assets ₹1,200 Cr plus undrawn committed bank lines ₹500 Cr. Under stress, monthly contractual outflows (debt repayments, CP maturities, opex) are ₹900 Cr and collections are ₹550 Cr; new borrowing is assumed unavailable.
- Net monthly outflow = **₹350 Cr**
- Survival horizon = (1,200 + 500) / 350 = **4.9 months**
- If the bank lines are not truly committed (they can be cancelled), the horizon falls to 1,200 / 350 = **3.4 months**. A CFP might include slowing disbursements to raise collections net of new lending.

**Indian context.** After IL&FS, RBI introduced a liquidity risk management framework for NBFCs, including LCR for larger NBFCs and limits on short-term mismatches [VERIFY: RBI NBFC liquidity framework (November 2019)]. SEBI requires mutual funds to maintain liquid assets in debt schemes and run liquidity stress tests [VERIFY: SEBI liquidity risk management framework for MFs].

**Common mistakes.**
- Counting uncommitted lines as reliable liquidity.
- Assuming assets can be sold at book value in stress.
- Liquidity plans that are never tested.

**Interview angle.**
1. *Funding vs market liquidity risk?* Funding liquidity is about raising cash to meet obligations; market liquidity is about selling assets without big price impact. They reinforce each other in crises.
2. *What's in a contingency funding plan?* Early warning indicators, stress scenarios, survival horizon targets, prioritised funding actions, governance and communication.
3. *How should a startup think about liquidity?* Runway under base and stress cases, committed versus hoped-for funding, levers to cut burn, and fundraising at least 9–12 months before cash runs out.

**Related topics:** [19.6] Liquidity regulation, [19.7] ALM, [9.6] Runway.

---

### [20.6] Corporate Hedging: FX, Commodity and Interest Rate Risk
<!-- tags: domain=risk-management; level=intermediate; roles=CF,Consulting,IB; keywords=corporate hedging, transaction exposure, translation exposure, economic exposure, natural hedge, hedge ratio, minimum variance hedge, hedging policy, layered hedging, hedge accounting -->

**Definition.** Corporate hedging uses derivatives and operational measures to reduce the impact of FX, commodity and interest rate movements on cash flows, earnings and value, according to a board-approved hedging policy.

**Why it matters.** Exporters, importers, airlines, metals and FMCG companies face large price exposures. CFO-office, treasury and consulting roles design hedging policies, and analysts assess how hedging affects earnings stability.

**Core mechanics.**

*Types of exposure:*
- **Transaction:** known future foreign currency cash flows (receivables, payables)
- **Translation:** restating foreign subsidiaries' statements (accounting, OCI)
- **Economic (operating):** long-run effect of price changes on competitiveness and cash flows

*Hedging approaches:*
- **Natural hedges:** matching revenues and costs in the same currency, local sourcing, foreign currency borrowing against foreign revenue
- **Financial hedges:** forwards, futures, options, swaps, collars
- **Layered (rolling) hedging:** hedge a declining percentage of forecast exposure over time (e.g., 75% of next quarter, 50% of the following, 25% after)
- **Minimum variance hedge ratio** h* = ρ × σ_spot / σ_futures; number of contracts = h* × Exposure / Contract size
- **Hedge accounting (Ind AS 109):** cash flow and fair value hedges allow hedging gains and losses to be matched with the hedged item, reducing P&L volatility, if documentation and effectiveness criteria are met

*Hedging policy elements:* objectives, exposures covered, instruments allowed, hedge ratios and tenors, counterparties and limits, authority matrix, reporting, and prohibition of speculation.

**Worked example 1: minimum variance hedge.** An airline's jet fuel cost changes have volatility of 3% a month; the crude oil futures used for hedging have volatility 2.5%; correlation 0.9.
- h* = 0.9 × 3% / 2.5% = **1.08**: hedge ₹108 of futures per ₹100 of fuel exposure
- The hedge is imperfect (basis risk) because jet fuel and crude don't move one-for-one.

**Worked example 2: layered FX hedging for an IT exporter.** Forecast USD revenue: US$100 million a quarter. Policy: hedge 70% of the next quarter, 50% of quarters 2–3, 30% of quarter 4.
- Hedged amounts: US$70m, 50m, 50m, 30m over the next four quarters
- If INR appreciates 3%, unhedged revenue falls 3%; the hedged book offsets most of the near-term impact, giving management time to adjust pricing and costs.

**Indian context.** Indian IT services companies maintain large forward and option hedge books and disclose them; RBI's framework allows users to hedge contracted and anticipated exposures with authorised dealers, with simplified rules for small exposures [VERIFY: RBI Master Direction on Risk Management and Inter-Bank Dealings, hedging of FX risk]. Unhedged foreign currency exposure of borrowers affects bank provisioning and capital (UFCE framework) [VERIFY: RBI UFCE guidelines].

**Common mistakes.**
- Hedging to "beat the market" (speculation disguised as hedging).
- Over-hedging uncertain forecast exposures and creating new risk.
- Ignoring the liquidity effect of margin calls on exchange-traded hedges.

**Interview angle.**
1. *Should a company hedge?* In theory shareholders can diversify; in practice hedging reduces financial distress costs, stabilises cash flows for investment, lowers tax volatility and helps planning, so many companies hedge core exposures.
2. *Forward vs option for hedging FX?* Forwards lock in a rate (no upfront cost, no upside); options protect downside while keeping upside, for a premium.
3. *What's a natural hedge? Give an Indian example.* Matching currency of revenues and costs, e.g., an exporter borrowing in USD so that USD interest and principal are covered by USD revenues.

**Related topics:** [17.1] Forwards, [17.7] Swaps, [22.3] FX risk management.

---

### [20.7] Stress Testing, Scenario Analysis and Model Risk
<!-- tags: domain=risk-management; level=advanced; roles=Consulting,ER,CF,Fintech-PM; keywords=stress testing, scenario analysis, reverse stress testing, macroeconomic scenarios, model risk, model validation, sensitivity, climate stress test, RBI financial stability report -->

**Definition.** Stress testing estimates the impact of severe but plausible adverse scenarios on capital, liquidity and earnings. Model risk is the risk of loss from using incorrect or misapplied models.

**Why it matters.** Regulators use stress tests to judge whether banks can survive downturns; companies use them for planning. As models (including AI/ML credit models) drive more decisions, model risk management has become a core governance requirement.

**Core mechanics.**

*Stress testing types:*
- **Sensitivity analysis:** single-factor shocks (e.g., +200 bps)
- **Scenario analysis:** consistent multi-factor scenarios (recession: GDP −2%, unemployment up, defaults up, rates down, equity −30%)
- **Reverse stress testing:** start from failure (e.g., CET1 falls below minimum) and ask what scenario would cause it
- **Climate scenario analysis:** transition and physical risk pathways (e.g., NGFS scenarios)

*Process:* define scenarios → translate macro variables into risk parameters (PD, LGD, deposit run-off, market moves) → project P&L and balance sheet → assess capital and liquidity → define management actions.

*Model risk management:* model inventory, independent validation (conceptual soundness, data, outcomes analysis, benchmarking), ongoing monitoring, governance (approval and limits on use), documentation. Specific challenges for ML models: explainability, bias, drift.

**Worked example: bank stress test.** Sigma Bank (CET1 ₹9,000 Cr; RWA ₹72,500 Cr; CET1 ratio 12.4%). Severe scenario over one year:
- Credit cost rises to 4% of ₹70,000 Cr advances = ₹2,800 Cr (vs ₹700 Cr base)
- NIM compresses, cutting NII by ₹300 Cr; PPOP falls to ₹2,250 Cr
- Bond portfolio mark-to-market loss ₹400 Cr
- Pre-tax result = 2,250 − 2,800 − 400 = −₹950 Cr; after tax (with tax credit) ≈ −₹712.5 Cr
- Stressed CET1 = 9,000 − 712.5 = ₹8,287.5 Cr; if RWA rises 5% (rating migration) to ₹76,125 Cr → CET1 ratio = **10.9%**, above the 8% minimum (including CCB) but with reduced headroom; management actions would include suspending dividends.

**Indian context.** RBI publishes macro stress test results for scheduled commercial banks in its half-yearly Financial Stability Report, showing projected GNPA and CRAR under baseline and severe scenarios [VERIFY: latest RBI FSR stress test results]. RBI has issued guidance on stress testing for banks and climate risk disclosure frameworks [VERIFY: RBI stress testing guidelines; RBI climate-related financial risk disclosure framework (draft 2024)].

**Common mistakes.**
- Scenarios that are severe in one dimension but ignore second-round effects (funding stress, correlations).
- Treating model outputs as truth without validation.
- Stress tests run only for regulators, not used in planning.

**Interview angle.**
1. *What's reverse stress testing?* Starting from an outcome that would break the business and identifying the scenarios that would cause it, revealing hidden vulnerabilities.
2. *How would you stress test a lending fintech?* Shock default rates by vintage and segment, funding availability and cost, collection efficiency and partner concentration; check capital, liquidity runway and covenant headroom.
3. *What is model risk?* The risk of losses from flawed models or misuse, managed through validation, monitoring, governance and limits on use.

**Related topics:** [20.2] Market risk, [20.3] Credit risk, [19.4] Capital adequacy.

---

## Module 20 Glossary

| Term | Definition |
|---|---|
| Backtesting | Comparing VaR estimates with actual losses |
| Contingency funding plan | Pre-planned actions for liquidity stress |
| EAD | Exposure at default |
| Expected shortfall | Average loss beyond the VaR threshold |
| Hedge ratio | Size of hedge relative to exposure |
| KRI | Key risk indicator |
| LGD | Loss given default (1 − recovery rate) |
| Model risk | Losses from flawed or misused models |
| PD | Probability of default |
| Reverse stress test | Identifying scenarios that would cause failure |
| Risk appetite | Board-approved risk the firm will accept |
| Roll rate | Share of loans moving to a worse delinquency bucket |
| Survival horizon | Time a firm can meet stressed outflows from liquid resources |
| Three lines model | First line owns risk, second oversees, third assures |
| VaR | Value at Risk |

## Module 20 Rapid-Fire Quiz

1. ₹50 Cr portfolio, daily σ 2%, 95% one-day VaR? **₹1.645 Cr**
2. 1-day VaR ₹2 Cr. 25-day VaR (square-root rule)? **₹10 Cr**
3. EAD ₹200 Cr, PD 2%, LGD 50%. Expected loss? **₹2 Cr**
4. Which covers unexpected loss: provisions or capital? **Capital**
5. Expected exceptions at 99% VaR over 250 days? **About 2.5**
6. Spot σ 4%, futures σ 5%, correlation 0.8. Minimum variance hedge ratio? **0.64**
7. Which line of defence is internal audit? **Third**
8. Liquid assets ₹600 Cr, stressed net outflow ₹200 Cr/month. Survival horizon? **3 months**
9. CERT-In cyber incident reporting window? **6 hours**
10. Measure of credit model discrimination? **Gini / AUC (or KS)**

## Module 20 [VERIFY] Items

1. RBI CRO guidelines for banks and NBFCs; SEBI LODR Reg 21 risk management committee applicability
2. SEBI/NSE Clearing margin methodology; RBI market risk capital and FRTB status
3. RBI draft ECL directions and model risk guidance; Digital Lending Directions data provisions
4. RBI IT Governance and IT Outsourcing Master Directions (2023); CERT-In directions (2022); DPDP Rules
5. RBI NBFC liquidity framework (2019); SEBI MF liquidity risk management framework
6. RBI hedging Master Direction; UFCE guidelines
7. RBI FSR stress test results; RBI stress testing and climate disclosure frameworks

---

# Module 21: Fintech and Payments

## 21A. Landscape and Payment Rails

### [21.1] The Indian Fintech Landscape and How Fintechs Make Money
<!-- tags: domain=fintech-payments; level=foundation; roles=Fintech-PM,Consulting,PE,IB; keywords=fintech landscape, payments, digital lending, wealthtech, insurtech, neobanking, B2B fintech, payment orchestration, revenue models, take rate, cross-sell, distribution economics -->

**Definition.** Fintech covers companies that use technology to deliver financial services: payments, lending, investing, insurance, banking services and the infrastructure behind them. Indian fintech grew on public digital infrastructure (Aadhaar, UPI, account aggregators) and a large underbanked population.

**Why it matters.** Fintech product, strategy and growth roles (at companies such as PhonePe, Razorpay, Juspay, CRED, Groww, Paytm, Pine Labs, Zerodha, PolicyBazaar) need a clear map of segments, regulators and, above all, how each model makes money.

**Core mechanics.**

| Segment | Examples of business types | Main revenue sources | Key regulator |
|---|---|---|---|
| Consumer payments | UPI apps, wallets | Merchant fees on non-UPI rails, cross-sell (lending, insurance, investments), ads, rewards partnerships | RBI, NPCI |
| Merchant payments | Payment aggregators and gateways, POS, soundboxes | MDR net of interchange, device rental and subscriptions, value-added services | RBI |
| Payment infrastructure | Orchestration, switches, SDKs | SaaS or per-transaction fees from merchants, banks | RBI (indirectly), NPCI |
| Digital lending | NBFCs, LSPs, co-lending platforms | Net interest income, processing fees, sourcing and servicing fees | RBI |
| Wealthtech and broking | Discount brokers, MF platforms | Brokerage (F&O), margin interest, distribution, subscriptions | SEBI, AMFI |
| Insurtech | Aggregators, brokers, MGAs | Commissions, rewards, platform fees | IRDAI |
| Neobanks and B2B fintech | Banking UX layers, expense management, payroll | Interchange share, SaaS, float, FX | RBI via partner banks |
| Credit cards and rewards | Card-linked products, rewards platforms | Interchange share, merchant marketing, lending cross-sell | RBI |

*Monetisation logic:* payments are often a low-margin or zero-margin acquisition and engagement layer (UPI MDR is zero for most transactions); profits come from higher-margin products sold to the engaged base (credit, wealth, insurance, merchant services) and from scale efficiencies.

**Worked example: monetising a payments user base.** An app has 5 crore monthly transacting users and earns nothing on UPI P2P transfers.
- Lending cross-sell: 2% of users take loans averaging ₹50,000 a year; as a loan service provider earning 3% of disbursement → 5 Cr × 2% × 50,000 × 3% = **₹150 Cr**
- Insurance: 1% buy policies with average commission ₹800 → **₹40 Cr**
- Merchant services: 20 lakh merchants paying ₹100 a month for a soundbox → **₹24 Cr** a year
- Total ≈ **₹214 Cr** a year from cross-sell and merchant monetisation, versus near-zero from consumer payments themselves. Lending dominates the mix, which is why payments apps push hardest into credit.

**Indian context.** India has one of the world's largest fintech ecosystems by funding and users, led by payments and lending [VERIFY: latest fintech funding and user data (e.g., Tracxn, Inc42, BCG/FICCI reports)]. Regulation has tightened since 2022 across digital lending, payment aggregators, data protection and KYC, raising compliance costs and favouring well-capitalised players.

**Common mistakes.**
- Treating TPV or user count as value without a monetisation path.
- Ignoring regulatory dependency (licences, partner banks, NPCI rules).
- Underestimating customer acquisition and compliance costs.

**Interview angle.**
1. *How does PhonePe or a similar UPI app make money if UPI is free?* Cross-selling financial products (lending, insurance, mutual funds), merchant services (soundboxes, POS, payment gateway on non-UPI rails), advertising and partnerships, using UPI as the engagement layer.
2. *What's the difference between a payment gateway and a payment aggregator?* A gateway provides the technology to route transactions; an aggregator also collects funds from customers and settles them to merchants, so it handles money and is regulated by RBI.
3. *Which fintech segment do you find most attractive and why?* Pick one, state its economics (take rate, margins, unit economics), moat (data, distribution, licences), regulation and risks.

**Related topics:** [21.3] UPI, [21.5] Payment aggregators, [21.6] Digital lending, [9.2] Unit economics.

---

### [21.2] India's Payment Systems Architecture
<!-- tags: domain=fintech-payments; level=foundation; roles=Fintech-PM,Consulting,CF; keywords=payment systems, RTGS, NEFT, IMPS, UPI, NACH, AePS, BBPS, RuPay, NPCI, settlement, clearing, real-time payments, PSS Act -->

**Definition.** Payment systems are the rails that move money between payers and payees: the rules, infrastructure, clearing and settlement arrangements. In India, RBI regulates payment systems under the Payment and Settlement Systems Act 2007; RBI operates RTGS and NEFT, and the National Payments Corporation of India (NPCI) operates retail systems such as UPI, IMPS, NACH, RuPay and AePS.

**Why it matters.** Fintech PMs choose and combine rails based on speed, cost, limits, reliability and use case. Understanding who operates what and how settlement works is basic for payments roles.

**Core mechanics.**

| System | Operator | Use | Speed | Notes |
|---|---|---|---|---|
| RTGS | RBI | High-value transfers (min ₹2 lakh) | Real time, gross settlement | 24x7 |
| NEFT | RBI | Retail and corporate transfers | Half-hourly batches, 24x7 | No minimum |
| IMPS | NPCI | Instant transfers | Real time | 24x7; mobile, net banking |
| UPI | NPCI | P2P and P2M payments via VPA/QR | Real time | Interoperable; dominant retail rail |
| NACH | NPCI | Bulk debits and credits (EMIs, SIPs, salaries, subsidies) | Batch | e-mandates |
| AePS | NPCI | Aadhaar-authenticated banking at micro-ATMs | Real time | Rural access |
| BBPS (Bharat Connect) | NPCI Bharat BillPay | Bill payments | Varies | Interoperable billers |
| RuPay | NPCI | Domestic card network | Real time authorisation | Debit, credit, prepaid |
| Cards (Visa, Mastercard, Amex, Diners) | Private networks | Card payments | Real time authorisation | Interchange-based |
| FASTag / NETC | NPCI | Toll payments | Real time | |

*Clearing vs settlement:* clearing computes obligations between participants; settlement is the final transfer of funds, usually through banks' accounts with RBI. For UPI and IMPS, customer credits are instant, while interbank settlement happens in multiple cycles a day on a deferred net basis.

*Authorisation and risk:* two-factor authentication for digital payments, transaction limits by rail, and dispute and chargeback mechanisms.

**Worked example: choosing rails for a salary payout product.** A payroll fintech must pay 5,000 employees an average of ₹40,000 each on the 1st of the month.
- NEFT/IMPS bulk payouts through a bank's API: low cost, instant (IMPS) or batch (NEFT), good for one-to-many payouts
- RTGS unnecessary (below threshold per transfer for most)
- UPI payouts possible for smaller amounts within per-transaction limits
- Total ₹20 Cr: design for retries, idempotency and reconciliation against bank statements; failed credits (wrong account) handled through name validation ("penny drop") before payout

**Indian context.** RBI introduced 24x7 NEFT (December 2019) and RTGS (December 2020). NPCI is a not-for-profit company promoted by banks under RBI guidance. RBI has been working on new umbrella entities for retail payments and on payment system vision documents [VERIFY: RBI Payments Vision 2025 and successor; NUE status]. Transaction limits and charges differ by rail and change periodically [VERIFY: current IMPS, UPI and NEFT limits].

**Common mistakes.**
- Assuming instant customer credit means instant interbank settlement.
- Ignoring failure and reversal handling (timeouts, deemed approvals).
- Choosing rails on cost alone without considering success rates and user experience.

**Interview angle.**
1. *What is NPCI and what does it run?* A not-for-profit umbrella organisation for retail payments in India, operating UPI, IMPS, NACH, RuPay, AePS, Bharat BillPay and NETC.
2. *NEFT vs RTGS vs IMPS?* NEFT settles in half-hourly batches; RTGS settles high-value payments individually in real time; IMPS gives instant retail transfers 24x7.
3. *How would you design a reliable bulk payout system?* Beneficiary validation, idempotent APIs, intelligent routing across rails and banks, automatic retries, real-time status, and daily reconciliation.

**Related topics:** [21.3] UPI, [21.4] Cards, [6.5] Internal controls.

---

### [21.3] UPI Deep Dive: Architecture, Products and Economics
<!-- tags: domain=fintech-payments; level=intermediate; roles=Fintech-PM,Consulting,PE; keywords=UPI, unified payments interface, VPA, TPAP, PSP bank, remitter bank, beneficiary bank, collect request, intent, QR, UPI Lite, UPI AutoPay, credit on UPI, RuPay credit card on UPI, market share cap, zero MDR, P2P, P2M -->

**Definition.** The Unified Payments Interface (UPI) is NPCI's real-time, interoperable payment system that lets users link bank accounts (and some credit products) to apps and pay using a virtual payment address (VPA), QR code or phone number, authenticated by a UPI PIN.

**Why it matters.** UPI is the dominant retail payment rail in India, processing billions of transactions a month and reshaping consumer and merchant payments. Every payments PM interview expects fluency in UPI's architecture, products and the economics debate (zero MDR, market share caps).

**Core mechanics.**

*Participants:*
- **Payer (remitter) bank** and **payee (beneficiary) bank**: hold the accounts
- **PSP (payment service provider) bank:** sponsors the app on UPI and issues VPAs (e.g., @ybl, @okicici)
- **TPAP (third-party application provider):** consumer apps (PhonePe, Google Pay, Paytm, others) that connect via PSP banks
- **NPCI UPI switch:** routes and processes transactions
- **Merchants and acquirers / payment aggregators** for P2M

*Transaction flow (pay request, P2M QR):*
1. Customer scans merchant QR in a TPAP and enters amount and PIN
2. TPAP → PSP bank → NPCI switch → remitter bank debits the customer
3. NPCI → beneficiary bank credits the merchant
4. Confirmation flows back; interbank settlement happens later in net settlement cycles

*Payment types:* P2P (person to person), P2M (person to merchant: small offline merchants, large merchants, online via intent or collect flows). Collect requests for P2P have been curtailed to reduce fraud [VERIFY: NPCI P2P collect request phase-out (2025)].

*Products built on UPI:*
- **UPI AutoPay:** recurring mandates (subscriptions, SIPs, EMIs)
- **UPI Lite:** on-device wallet for small-value payments without PIN, reducing bank switch load
- **UPI 123PAY:** for feature phones (IVR, missed call, sound-based)
- **RuPay credit cards on UPI:** credit card payments via UPI QR (MDR applies)
- **Credit line on UPI:** pre-sanctioned bank credit lines linked to UPI
- **UPI Circle (delegated payments), UPI Global / international linkages**, ATM cash withdrawal via UPI (ICCW), and newer biometric and on-device authentication options [VERIFY: current NPCI product list and launch status]

*Economics:*
- **MDR on UPI P2M using bank accounts is zero** (by government notification since January 2020), so neither apps nor banks earn merchant fees on most UPI payments
- The government has provided an incentive scheme for low-value BHIM-UPI P2M transactions to partly compensate the ecosystem [VERIFY: current year incentive scheme amount and eligibility]
- Interchange applies to wallet (PPI) payments on UPI above ₹2,000 for certain merchant categories, and RuPay credit cards on UPI carry MDR [VERIFY: NPCI PPI interchange circular (2023); RuPay credit card on UPI MDR rules]
- Costs borne by apps and banks: technology, switching, customer support, fraud and disputes
- **Market share cap:** NPCI proposed capping any TPAP at 30% of UPI volumes; the compliance deadline has been extended (most recently to 31 December 2026) [VERIFY: NPCI market share cap deadline]

**Worked example: the cost of free.** A TPAP processes 900 crore transactions a month (illustrative). If fully loaded cost (tech, support, fraud, PSP bank fees) is ₹0.05 per transaction:
- Monthly cost = 900 Cr × ₹0.05 = **₹45 Cr**; annual ≈ **₹540 Cr**
- With zero MDR, this must be recovered through cross-sell, merchant services, advertising and incentives, or by charging large merchants a small fee if regulations change.
- Each 1 paisa of cost per transaction is worth ₹108 Cr a year at this scale, so infrastructure efficiency matters enormously.

**Indian context.** UPI processes on the order of 20 billion transactions a month, and P2M has overtaken P2P in transaction count [VERIFY: latest NPCI monthly UPI statistics]. Market share is concentrated in two TPAPs (over 80% combined), which drives the market share cap debate [VERIFY: NPCI app-wise market share data]. Per-transaction limits are generally ₹1 lakh, with higher limits for specified categories (e.g., capital markets, insurance, tax payments, hospitals, education) [VERIFY: current UPI limits by category (NPCI September 2025 changes)].

**Common mistakes.**
- Assuming UPI apps earn MDR on UPI payments.
- Confusing the TPAP (app) with the PSP bank.
- Ignoring the role of the remitter bank's uptime in success rates.

**Interview angle.**
1. *Walk me through what happens when I pay a merchant via UPI.* The app sends the request through its PSP bank to NPCI; NPCI asks my bank to debit me after PIN verification, credits the merchant's bank, confirms back to both apps; banks settle net later.
2. *Should UPI have MDR?* Arguments for: sustainability of investment, fraud prevention and innovation funding, especially for large merchants. Arguments against: UPI's growth and financial inclusion benefits came from zero cost; small merchants are price-sensitive. A middle ground is MDR for large merchants only.
3. *As a PM at a UPI app, how would you improve success rates?* Route via the best-performing PSP bank, show bank downtime alerts, offer UPI Lite for small payments, retry intelligently, and suggest alternative linked accounts.

**Related topics:** [21.2] Payment systems, [21.5] Payment aggregators, [21.10] Fintech regulation.

---

### [21.4] The Cards Ecosystem: Four-Party Model, MDR and Interchange
<!-- tags: domain=fintech-payments; level=intermediate; roles=Fintech-PM,Consulting,CF; keywords=card payments, four-party model, issuer, acquirer, card network, interchange, MDR, scheme fees, tokenisation, card-on-file, chargebacks, credit card economics, revolver, transactor -->

**Definition.** Card payments run on a four-party model: the cardholder, the issuer (cardholder's bank), the merchant, and the acquirer (merchant's bank or payment aggregator), connected by a card network (Visa, Mastercard, RuPay, Amex, Diners). The merchant discount rate (MDR) the merchant pays is split among these parties.

**Why it matters.** Card economics fund rewards programmes, co-branded cards and payment aggregator margins. Credit card businesses are among the most profitable in retail banking, and fintechs such as CRED build on card users.

**Core mechanics.**

*Transaction flow:* authorisation (merchant → acquirer → network → issuer approves), clearing, and settlement (issuer pays acquirer via the network, acquirer pays merchant net of MDR).

*MDR split (illustrative for a credit card):*

| Party | Share of a 1.9% MDR | Role |
|---|---|---|
| Issuer (interchange) | ≈1.5% | Funds rewards, credit risk, fraud, interest-free period |
| Network (scheme fees) | ≈0.1–0.2% | Network processing and brand |
| Acquirer / payment aggregator | ≈0.2–0.3% | Merchant onboarding, risk, settlement |

[VERIFY: indicative interchange rates by network and card type in India]

*Credit card issuer economics:* interchange income, interest from revolvers (customers who carry balances, often at 36–45% a year), fees (annual, late, forex), minus rewards, credit losses, cost of funds for the interest-free period, acquisition and operating costs. Transactors (pay in full) generate interchange; revolvers generate interest and higher risk.

*Security and regulation:* tokenisation (card-on-file tokenisation replaced stored card numbers with tokens for online merchants from October 2022), additional factor of authentication (AFA) for card-not-present transactions with exemptions for small values, e-mandate rules for recurring payments [VERIFY: RBI CoF tokenisation; RBI Authentication Mechanisms for Digital Payment Transactions Directions 2025; e-mandate limits].

*Chargebacks:* disputes allow cardholders to reverse transactions; merchants and acquirers bear the cost if they lose.

**Worked example: a ₹1,000 credit card purchase.**
- Merchant receives ₹1,000 − 1.9% MDR = **₹981** (plus 18% GST on the MDR, charged to the merchant)
- Issuer interchange ≈ ₹15; network ≈ ₹1.5; acquirer/PA ≈ ₹2.5
- If the issuer gives 1% rewards (₹10), it keeps ₹5 of interchange to cover fraud, funding the interest-free period and operations; revolver interest and fees are where issuers earn most of their profit

**Indian context.** India's credit card base has grown quickly (over 10 crore cards outstanding) but penetration remains low relative to debit cards and UPI [VERIFY: RBI monthly card statistics]. RBI's 2022 Master Direction on credit and debit cards governs issuance, billing, co-branding and closure rules, and a 2024 direction requires issuers to let customers choose the card network [VERIFY: RBI Credit Card and Debit Card Directions 2022 and network choice circular March 2024]. MDR on RuPay debit cards is zero, like UPI.

**Common mistakes.**
- Assuming the payment aggregator keeps the full MDR.
- Ignoring GST on MDR in merchant cost comparisons.
- Treating all cardholders as equally profitable (transactors vs revolvers differ sharply).

**Interview angle.**
1. *Explain the four-party card model.* The cardholder pays the merchant; the acquirer processes for the merchant; the network routes; the issuer approves and pays; the MDR is split as interchange (issuer), scheme fees (network) and acquirer margin.
2. *How do credit card issuers make money?* Interchange on spends, interest from revolving balances, and fees, minus rewards, credit losses, funding and operating costs.
3. *Why would an issuer partner with a fintech for co-branded cards?* Access to a large, engaged user base and lower acquisition cost; the fintech gets a share of interchange and engagement.

**Related topics:** [21.5] Payment aggregators, [21.9] Credit card rewards platforms, [19.5] Credit appraisal.

---

### [21.5] Payment Aggregators, Gateways and Payment Orchestration
<!-- tags: domain=fintech-payments; level=intermediate; roles=Fintech-PM,Consulting,PE; keywords=payment aggregator, payment gateway, RBI PA guidelines, escrow account, settlement cycle, merchant KYC, payment orchestration, success rate, smart routing, net take rate, value-added services, cross-border payments, PA-CB -->

**Definition.** A payment aggregator (PA) onboards merchants, accepts payments from their customers through multiple methods, pools the funds in an escrow account and settles them to merchants. A payment gateway (PG) provides the technology to process transactions without handling funds. Payment orchestration platforms route transactions across multiple PAs, gateways and banks to maximise success and minimise cost.

**Why it matters.** Merchant payments are a core fintech category in India. Understanding PA regulation, take rates and success-rate economics is essential for payments PM and strategy interviews.

**Core mechanics.**

*Payment aggregator vs gateway:*

| Feature | Payment aggregator | Payment gateway |
|---|---|---|
| Handles merchant funds | Yes (escrow) | No |
| RBI authorisation | Required | Not authorised separately (follows baseline technology guidelines) |
| Merchant KYC and due diligence | Yes | Via PA or bank |
| Settlement to merchants | Yes | No |

*Key RBI PA requirements (indicative):* authorisation under the PSS Act; minimum net worth (₹15 Cr at application, ₹25 Cr within three years); funds held in an escrow account with a scheduled commercial bank; settlement timelines; merchant due diligence and monitoring; data storage in India; governance and baseline cyber controls. Cross-border PAs (PA-CB) and physical point-of-sale aggregators (PA-P) are covered under updated directions [VERIFY: RBI Directions on Regulation of Payment Aggregators (2025 consolidated), net worth and settlement norms].

*Revenue model:*
- Gross MDR from merchants by payment method (cards, net banking, wallets, EMI, BNPL); UPI and RuPay debit at zero MDR for most merchants
- Costs: interchange and network fees (cards), bank fees (net banking), partner costs
- **Net take rate** = (Gross revenue − Payment processing costs) / TPV
- Value-added services: payouts, payment links, subscriptions, invoicing, checkout, fraud tools, lending to merchants, international payments, banking-as-a-service

*Payment orchestration and success rates:* success rate (SR) = successful transactions / attempted transactions. Smart routing sends each transaction to the gateway or bank most likely to succeed at the lowest cost, using real-time performance data; retries and fallbacks recover failed attempts.

**Worked example 1: PA net take rate.** Annual TPV ₹1,00,000 Cr.

| Method | TPV (₹ Cr) | Gross MDR | Gross revenue | Processing cost | Net revenue |
|---|---|---|---|---|---|
| UPI | 60,000 | 0% | 0 | 0 | 0 |
| Cards | 30,000 | 1.90% | 570 | 1.65% = 495 | 75 |
| Net banking and wallets | 10,000 | 1.50% | 150 | 1.00% = 100 | 50 |
| **Total** | **1,00,000** | | **720** | **595** | **125** |

- Gross take rate = 0.72%; **net take rate = 0.125% (12.5 bps)**
- As UPI's share grows, net take rate falls unless value-added services and pricing for large merchants offset it.

**Worked example 2: value of success rate.** An e-commerce merchant attempts ₹1,000 Cr of payments a month at an 85% success rate. Orchestration raises it to 88%.
- Recovered GMV = 3% × 1,000 = **₹30 Cr a month**
- At a 20% gross margin, extra gross profit = **₹6 Cr a month** (some failed payments would have been retried anyway, so the true gain is lower)
- This is why merchants pay for orchestration even when gateway fees are commoditised.

**Indian context.** Major Indian PAs and orchestrators include bank and non-bank players; several fintechs received final PA authorisation after a multi-year process, and some were temporarily barred from onboarding new merchants pending compliance [VERIFY: RBI list of authorised PAs and recent actions]. Juspay-type orchestration platforms serve large merchants and banks with routing, checkout and tokenisation services.

**Common mistakes.**
- Comparing gross take rates across PAs with different method mixes.
- Ignoring that UPI growth compresses PA revenue per rupee of TPV.
- Treating success rate as a gateway metric only (issuer bank downtime is a major cause of failure).

**Interview angle.**
1. *How does a payment aggregator make money in a UPI-dominated market?* Net margin on cards, net banking and wallets; pricing for large merchants; value-added services (payouts, subscriptions, credit, cross-border); and software products.
2. *What drives payment success rates?* Issuer bank uptime, gateway performance, network issues, authentication friction (OTP failures), user drop-off and fraud declines; orchestration and retries improve them.
3. *What does RBI require of payment aggregators?* Authorisation, minimum net worth, escrow handling of funds, merchant KYC and monitoring, settlement timelines, data localisation and cyber security controls.

**Related topics:** [21.3] UPI, [21.4] Cards, [21.11] Fintech metrics.

---

### [21.6] Digital Lending: Models, RBI Rules and Unit Economics
<!-- tags: domain=fintech-payments; level=intermediate; roles=Fintech-PM,Consulting,PE,ER; keywords=digital lending, loan service provider, LSP, default loss guarantee, DLG, FLDG, key fact statement, APR, cooling-off period, BNPL, co-lending, credit line on UPI, personal loans, merchant lending, collections -->

**Definition.** Digital lending is credit originated, underwritten, disbursed and serviced largely through digital channels. In India, only RBI-regulated entities (banks and NBFCs) can lend; fintechs either hold NBFC licences or act as lending service providers (LSPs) for regulated entities.

**Why it matters.** Lending is the main profit pool for many fintechs. RBI's digital lending rules reshaped business models from 2022, so candidates must understand permitted structures, disclosures and unit economics.

**Core mechanics.**

*Business models:*

| Model | Who holds the loan | Fintech revenue | Fintech risk |
|---|---|---|---|
| Own NBFC (balance sheet) | Fintech's NBFC | Net interest income + fees | Full credit and funding risk |
| LSP for a bank or NBFC | Regulated entity (RE) | Sourcing and servicing fees | Limited; DLG up to cap |
| Co-lending | Bank and NBFC share | NBFC earns interest share + fees | Proportional |
| Embedded credit (BNPL, checkout finance, credit line on UPI) | RE | Merchant subvention, fees | Varies |

*RBI digital lending rules (key points):*
- Disbursements and repayments must flow directly between the borrower's bank account and the RE (no pass-through via LSP accounts, with limited exceptions)
- **Key Fact Statement (KFS)** with all-inclusive **annual percentage rate (APR)** before signing
- **Cooling-off / look-up period** to exit the loan without penalty (paying principal and proportionate APR)
- **Default loss guarantee (DLG)** arrangements capped at **5%** of the loan portfolio
- Data collection only with explicit consent, need-based; no access to contacts, media or call logs
- Grievance redressal officers; LSP and digital lending app disclosures; RBI's public directory of digital lending apps

[VERIFY: RBI (Digital Lending) Directions 2025; DLG guidelines (June 2023); KFS circular (April 2024)]

*Unit economics of a digital personal loan (annual, % of average book):* yield 24%; cost of funds 10%; opex and servicing 4%; credit cost 5%; fee income (amortised) 2% → pre-tax RoA ≈ **7%**. With leverage of 4x, pre-tax RoE ≈ 28%, before considering growth-stage provisioning effects.

**Worked example 1: APR in the KFS.** Loan ₹50,000 for 12 months at a stated 20% interest (reducing balance), with a 2% processing fee (₹1,000) deducted upfront.
- EMI = **₹4,631.7**
- The borrower actually receives ₹49,000 and pays 12 × 4,631.7
- Solving for the monthly rate: 1.994% → **APR ≈ 23.9%** (effective annual ≈ 26.7%), well above the headline 20%; this is what the KFS must disclose.

**Worked example 2: DLG economics.** An LSP sources a ₹1,000 Cr portfolio for an NBFC with a 5% DLG (₹50 Cr, in cash or bank guarantee).
- If portfolio losses are 7% (₹70 Cr), the LSP's DLG absorbs ₹50 Cr and the NBFC bears ₹20 Cr.
- The LSP's fee income must cover its expected DLG payout; in a downturn, DLG losses can exceed fee income, so LSPs effectively take equity-like first-loss risk.

**Indian context.** Concerns about predatory digital lending apps (abusive collections, hidden charges) led to RBI's 2022 rules and enforcement; Google Play and RBI maintain lists of permitted lending apps [VERIFY: RBI digital lending apps directory (2025)]. RBI's November 2023 risk-weight increase on unsecured consumer credit slowed growth in small-ticket personal loans [VERIFY: subsequent changes]. Unified Lending Interface (ULI) is being developed to streamline credit data access [VERIFY: RBI ULI status].

**Common mistakes.**
- Judging lending growth without seasoning-adjusted delinquency (see vintage analysis).
- Ignoring the APR effect of fees.
- Assuming LSPs bear no credit risk (DLG and reputational exposure).

**Interview angle.**
1. *How can a fintech lend in India?* Get an NBFC licence, or partner with banks or NBFCs as a lending service provider, possibly with co-lending and a DLG up to 5%.
2. *What does the KFS do?* It standardises disclosure of loan terms, including an all-inclusive APR, so borrowers can compare offers.
3. *How would you design a credit product for gig workers?* Use alternative data (platform earnings, UPI inflows via account aggregator), daily or weekly repayment aligned with income, small initial limits that grow with repayment, and humane, regulated collections.

**Related topics:** [19.5] Credit appraisal, [20.3] Credit risk, [19.8] NBFCs, [21.7] Account aggregators.

---

## 21B. Infrastructure, Adjacent Models and Regulation

### [21.7] Digital Public Infrastructure: India Stack, Account Aggregators, ONDC, OCEN and ULI
<!-- tags: domain=fintech-payments; level=intermediate; roles=Fintech-PM,Consulting,PE; keywords=India Stack, digital public infrastructure, Aadhaar, eKYC, video KYC, DigiLocker, eSign, account aggregator, FIP, FIU, consent artefact, Sahamati, ONDC, OCEN, ULI, CKYC -->

**Definition.** India's digital public infrastructure (DPI), often called the India Stack, is a set of open, interoperable public platforms for identity (Aadhaar), payments (UPI), data sharing (account aggregators, DigiLocker) and commerce (ONDC) that private companies build products on.

**Why it matters.** DPI lowers the cost of onboarding, payments and underwriting, enabling business models that would be uneconomic elsewhere. Fintech PMs design products around these rails and their consent and data rules.

**Core mechanics.**

| Layer | Component | What it enables |
|---|---|---|
| Identity | Aadhaar authentication and eKYC (UIDAI); video KYC (V-CIP); Central KYC Registry (CKYCR) | Paperless, low-cost onboarding |
| Documents | DigiLocker, eSign | Verified documents, digital signatures |
| Payments | UPI, AePS, NACH, BBPS | Real-time, interoperable payments |
| Data | Account aggregator (AA) framework | Consent-based financial data sharing |
| Credit | OCEN (open credit enablement network), ULI (unified lending interface) | Standardised credit flows and data access for lenders |
| Commerce | ONDC (open network for digital commerce) | Unbundled, interoperable e-commerce |

*Account aggregator framework:*
- **Financial information providers (FIPs):** banks, NBFCs, AMCs, insurers, depositories, GSTN, etc., holding user data
- **Financial information users (FIUs):** lenders, wealth managers and other regulated entities using the data
- **Account aggregators:** RBI-licensed NBFC-AAs that carry encrypted data from FIPs to FIUs based on the user's consent; they are "data-blind" (cannot read or store the data)
- **Consent artefact:** specifies purpose, data types, duration, frequency and FIU; user can revoke
- Industry body Sahamati coordinates the ecosystem

**Worked example: AA-based underwriting flow.** A merchant applies for a ₹5 lakh working capital loan on a lending app.
1. The lender (FIU) requests 12 months of bank statements and GST data through an AA
2. The merchant approves the consent artefact in the AA app (purpose: loan underwriting; one-time fetch; 12 months)
3. FIPs (bank, GSTN) send encrypted data via the AA to the lender
4. The lender's model analyses average balance, inflow regularity, bounces and GST turnover; it offers a ₹4 lakh limit in minutes
- Without AA, the merchant would upload PDFs, the lender would parse them manually or with OCR, and fraud risk (tampered PDFs) would be higher.

**Indian context.** The AA ecosystem has grown to hundreds of millions of linked accounts and consent requests, driven mainly by lending use cases [VERIFY: Sahamati AA dashboard statistics]. Aadhaar authentication use by private entities is governed by the Aadhaar Act and UIDAI rules [VERIFY: Aadhaar authentication rules for private entities (2025 amendments)]. ONDC has grown in mobility and food categories, with retail adoption still developing [VERIFY: ONDC transaction data]. RBI and the Reserve Bank Innovation Hub developed the Unified Lending Interface [VERIFY: ULI rollout status].

**Common mistakes.**
- Thinking AAs store or sell user data (they are consent managers and data-blind conduits).
- Ignoring consent design: purpose limitation and revocation matter for compliance under the DPDP Act.
- Treating DPI as free of cost for businesses (integration, compliance and operations still cost money).

**Interview angle.**
1. *What is an account aggregator?* An RBI-licensed entity that enables consent-based, encrypted sharing of a user's financial data from institutions that hold it to institutions that need it, without seeing the data itself.
2. *How does India Stack lower costs for fintechs?* Instant eKYC cuts onboarding cost, UPI cuts payment costs, and AA data improves underwriting and reduces fraud, enabling small-ticket financial products.
3. *What product would you build using AA data?* E.g., a personal finance manager aggregating all accounts, cash-flow-based MSME lending, or automated wealth rebalancing, with clear consent and value exchange.

**Related topics:** [21.6] Digital lending, [21.10] Regulation and data protection, [21.3] UPI.

---

### [21.8] Wealthtech and Broking Business Models
<!-- tags: domain=fintech-payments; level=intermediate; roles=Fintech-PM,Consulting,PE,ER; keywords=discount broker, brokerage revenue, F&O revenue, margin trading facility, float income, true to label charges, MF distribution, direct plans, SIP platform, ARPU, activation, retention -->

**Definition.** Wealthtech companies provide digital investing: stock broking, mutual fund platforms, advisory and wealth management. Discount brokers offer low or zero brokerage on delivery trades and earn mainly from active traders and ancillary services.

**Why it matters.** Wealthtech is one of India's largest fintech categories by users (Groww, Zerodha, Angel One, Upstox and others). Regulatory changes to F&O and exchange charges have reshaped revenue, so PM and strategy candidates must understand the unit economics.

**Core mechanics.**

*Revenue streams for a discount broker:*
- Brokerage on intraday and F&O trades (flat fee per executed order, e.g., ₹20)
- Interest on margin trading facility (MTF) loans and other financing
- Interest on client funds where permitted (mostly curtailed by SEBI rules on client fund handling)
- Account opening and maintenance fees, DP charges on sells
- Mutual fund distribution (regular plans) or advisory fees; most discount platforms offer direct plans with no commission
- Subscriptions, research, fixed income and other products

*Regulatory shifts:*
- **True-to-label charges (October 2024):** exchanges must charge uniform fees to all brokers, ending volume-based rebates brokers used to keep as income
- **F&O measures (late 2024):** larger contract sizes, fewer weekly expiries, upfront premium collection, which reduced retail option volumes
- **Client fund rules:** upfront margin collection, quarterly settlement of running accounts, and requirements to hold client funds and securities with clearing corporations or in segregated accounts
[VERIFY: SEBI circular on uniform MII charges (July 2024, effective October 2024); SEBI F&O measures (October 2024); client funds and running account settlement rules]

*Key metrics:* active clients (traded at least once in a period, as defined by NSE), ARPU, activation rate, orders per client, share of F&O revenue, MTF book, customer acquisition cost, retention.

**Worked example: broker revenue sensitivity.** A broker has 1 crore active clients; 15% trade F&O, placing 40 orders a month at ₹20 each.
- F&O brokerage = 15 lakh × 40 × ₹20 = **₹12 Cr a month (₹144 Cr a year)**
- MTF book ₹2,000 Cr at 15% yield vs 9% funding cost → net interest ≈ **₹120 Cr a year**
- If F&O orders fall 30% after regulatory changes, F&O brokerage falls to ₹100.8 Cr a year: a ₹43 Cr hit, which the broker tries to offset by growing MTF, wealth products and subscriptions.

**Indian context.** India's demat accounts have grown to well over 15 crore, with active NSE clients a fraction of that [VERIFY: NSDL/CDSL and NSE active client data]. SEBI studies on F&O losses (about 9 in 10 individual traders losing money) have shaped policy and broker disclosures, including mandatory risk disclosures at login [VERIFY: SEBI risk disclosure requirement for F&O]. Mutual fund platforms distribute direct plans; their monetisation relies on scale, adjacent products and, in some cases, RIA advisory fees.

**Common mistakes.**
- Assuming zero-brokerage delivery means brokers don't make money from investors (F&O, MTF and ancillary fees carry the economics).
- Ignoring regulatory concentration risk (a single SEBI change can move revenue materially).
- Measuring growth by app downloads or demat accounts instead of active, transacting clients.

**Interview angle.**
1. *How does Zerodha or Groww make money?* Mainly brokerage on intraday and F&O trades, margin financing interest, account and DP charges, plus newer products (MTF, wealth, credit, subscriptions); delivery trades and direct mutual funds are low or zero revenue.
2. *How did SEBI's 2024 changes affect brokers?* True-to-label charges removed exchange rebate income; F&O measures reduced trading volumes, cutting brokerage revenue and pushing diversification.
3. *As a PM, how would you increase long-term investor value on a broking app?* Encourage SIPs and goal-based investing, provide clear risk warnings for derivatives, offer portfolio insights and rebalancing, and reduce gamified trading nudges.

**Related topics:** [15.1] Market structure, [15.9] Mutual funds, [18.8] Wealth management, [17.8] F&O in India.

---

### [21.9] Credit Cards and Rewards Platforms, Neobanks, Insurtech and B2B Fintech
<!-- tags: domain=fintech-payments; level=intermediate; roles=Fintech-PM,Consulting,PE; keywords=rewards platform, CRED, bill payments, co-branded cards, neobank, banking as a service, insurtech, insurance aggregator, MGA, B2B payments, expense management, cross-border payments, merchant lending, embedded finance -->

**Definition.** Beyond payments, lending and investing, fintech includes rewards and credit card platforms, neobanks (digital banking layers built on partner banks), insurtech (digital insurance distribution and underwriting support), and B2B fintech (payouts, expense management, invoicing, cross-border payments, embedded finance).

**Why it matters.** These are popular product domains for MBA PM hires and are often discussed in case interviews ("how should a rewards app make money?").

**Core mechanics.**

*Rewards and credit-card-centric platforms (CRED-type model):*
- Attract creditworthy users (e.g., high bureau score) with rewards for paying card bills and other bills
- Monetise the affluent base through: brand and merchant marketing (brands pay for access and offers), lending via partner REs (personal loans, credit lines), co-branded cards, commerce, insurance and investments
- Key metrics: monthly transacting users, share of card bill payments, engagement, cross-sell conversion, revenue per user
- Risk: high reward costs without monetisation; regulatory changes on bill payments (BBPS routing of credit card bill payments) [VERIFY: RBI mandate for credit card bill payments via BBPS (2024)]

*Neobanks and banking-as-a-service:*
- In India, neobanks are not licensed banks; they partner with licensed banks for accounts, cards and payments
- Revenue: interchange share on cards, fees, float share, subscription, lending cross-sell; B2B neobanks (SME banking, payroll, expense cards) often have better economics than consumer ones
- Regulatory focus: partner bank responsibility for KYC and compliance; RBI actions against partner banks have disrupted fintech partners

*Insurtech:*
- Models: aggregators (web aggregators like comparison platforms), insurance brokers, corporate agents, embedded insurance (point-of-sale covers), MGAs (managing general agents, less common in India)
- Revenue: commissions and rewards from insurers, platform fees
- IRDAI replaced fixed commission caps with an overall expense of management (EoM) limit for insurers (2023), giving flexibility in distributor payouts [VERIFY: IRDAI EoM regulations 2023 and commission rules]
- Key metrics: premium volume, renewal rates, claims experience (affects insurer appetite), CAC per policy

*B2B fintech:*
- Payouts and payment links, accounts payable and receivable automation, corporate cards, expense management, invoice discounting (TReDS), cross-border payments for exporters and freelancers (PA-CB), embedded finance in vertical SaaS
- Revenue: per-transaction fees, SaaS subscriptions, FX spreads, interchange, lending

**Worked example: rewards platform economics (illustrative).** 1 crore monthly active members.
- Brand marketing: 2,000 brands paying an average ₹5 lakh a year for campaigns → **₹100 Cr**
- Lending: 3% of members borrow; average loan ₹1.5 lakh; platform earns 4% of disbursement → 3 lakh × 1.5 lakh × 4% = **₹180 Cr**
- Rewards cost: ₹15 per member per month → **₹180 Cr a year**
- Contribution before fixed costs = 100 + 180 − 180 = **₹100 Cr**; lending cross-sell is the profit engine, and reward costs must be tied to engagement that drives it.

**Indian context.** Insurance penetration in India remains low relative to peers, motivating government and IRDAI initiatives such as Bima Sugam (an insurance marketplace) [VERIFY: Bima Sugam launch status; insurance penetration data; FDI limit in insurance (Budget 2025 proposed raising it from 74% to 100%; check enactment)]. Cross-border payment aggregators require RBI authorisation (PA-CB) [VERIFY: RBI PA-CB framework].

**Common mistakes.**
- Building a rewards business without a clear path from engagement to monetisation.
- Assuming neobanks can operate independently of partner banks' compliance.
- Ignoring claims experience in insurtech (insurers will stop partnering if loss ratios are poor).

**Interview angle.**
1. *How should a credit-card bill payment app make money?* Monetise its affluent, creditworthy base through lending, brand marketing, commerce and financial products, while controlling reward costs.
2. *What are the risks for a neobank in India?* Dependence on partner banks, thin interchange economics, regulatory actions on partners, and high acquisition costs relative to revenue per user.
3. *Why is embedded finance attractive?* It offers financial products at the point of need inside non-financial platforms (e.g., EMI at checkout, insurance with travel bookings), lowering acquisition costs and improving conversion.

**Related topics:** [21.4] Cards, [21.6] Digital lending, [21.1] Landscape.

---

### [21.10] Fintech Regulation and Compliance: Licences, KYC/AML, Data Protection and Sandboxes
<!-- tags: domain=fintech-payments; level=intermediate; roles=Fintech-PM,Consulting,Audit; keywords=fintech regulation, RBI licences, PPI, payment aggregator licence, NBFC licence, KYC Master Direction, PMLA, AML, CFT, DPDP Act, regulatory sandbox, SRO-FT, outsourcing, consumer protection -->

**Definition.** Fintech regulation in India is activity-based: the licence depends on what the company does (lend, hold customer money, process payments, distribute investments or insurance), and each regulator sets conduct, prudential, technology and customer protection rules.

**Why it matters.** Regulation determines what products are possible and how fast. Many fintech setbacks in India came from compliance failures (KYC lapses, payments bank restrictions, PA onboarding bans). PMs must design compliance into products.

**Core mechanics.**

*Licence map (activity → licence):*

| Activity | Licence / registration | Regulator |
|---|---|---|
| Lending | Bank, NBFC (or LSP partnering with one) | RBI |
| Holding customer money for payments (wallets, gift cards) | Prepaid payment instrument (PPI) issuer | RBI |
| Merchant payment aggregation | Payment aggregator (online, cross-border, physical) | RBI |
| Payment system operation | PSS Act authorisation (e.g., BBPOU, card networks) | RBI |
| Consent-based data sharing | NBFC-AA | RBI |
| Credit information | Credit information company | RBI |
| Stock broking | Stockbroker, depository participant | SEBI |
| Investment advice | Registered investment adviser | SEBI |
| MF distribution | ARN with AMFI | SEBI/AMFI |
| Insurance distribution | Broker, corporate agent, web aggregator | IRDAI |
| Pension distribution | Point of presence | PFRDA |

*KYC and AML:*
- The Prevention of Money Laundering Act (PMLA) and RBI's KYC Master Direction require customer due diligence, risk categorisation, periodic updation, transaction monitoring and suspicious transaction reporting to the Financial Intelligence Unit-India (FIU-IND)
- KYC options: Aadhaar eKYC (OTP or biometric) for eligible entities, video-based customer identification (V-CIP), CKYC records, offline Aadhaar XML, DigiLocker
- PPIs have tiered KYC (small PPIs with minimal KYC and limits; full-KYC PPIs with higher limits and interoperability)

*Data protection:* the Digital Personal Data Protection (DPDP) Act 2023 and rules require lawful processing based on consent or legitimate uses, notice, purpose limitation, data principal rights, breach notification and heavier obligations for significant data fiduciaries; RBI rules require payment system data to be stored only in India [VERIFY: DPDP Rules 2025 timelines; RBI payment data storage circular (2018)].

*Innovation channels:* RBI's regulatory sandbox (cohorts on themes such as cross-border payments and MSME lending), SEBI and IRDAI sandboxes, IFSCA (GIFT City) fintech framework, and a recognised self-regulatory organisation for fintech (SRO-FT) [VERIFY: RBI SRO-FT recognition (2024) and framework].

**Worked example: compliance-by-design for a wallet product.** A team wants to launch a closed-loop to open-loop wallet for gig workers.
- Licence: requires a PPI issuer authorisation (or partnering with an authorised bank/non-bank PPI issuer)
- KYC: start with small PPI (minimum details, low limits, conversion to full KYC within a set period), then full KYC via Aadhaar eKYC or V-CIP for higher limits and interoperability
- Limits: monthly load and balance caps by PPI type; cash withdrawal only for full-KYC PPIs
- Controls: transaction monitoring for mule activity, AML alerts, grievance redressal timelines, data storage in India
- Product implication: design onboarding to capture full KYC early, since limits on small PPIs constrain usage

**Indian context.** RBI's enforcement against a large payments bank in early 2024 (restrictions on deposits, top-ups and credit transactions after persistent compliance failures) showed how compliance lapses can halt a fintech's core business [VERIFY: RBI action on Paytm Payments Bank, January–March 2024]. RBI's PPI Master Directions govern wallet limits and interoperability [VERIFY: current PPI Master Directions].

**Common mistakes.**
- Designing products first and asking compliance later.
- Assuming a partner bank's licence covers all of a fintech's activities.
- Treating KYC as a one-time check rather than ongoing due diligence and monitoring.

**Interview angle.**
1. *Which licence would you need to launch a wallet, a lending product, and a stock broking feature?* PPI authorisation (or partner), NBFC licence or LSP partnership with an RE, and SEBI stockbroker and DP registrations (or partner).
2. *What can fintechs learn from RBI's action on a payments bank in 2024?* Compliance and KYC failures are existential risks; governance, independent compliance and regulator engagement must scale with the business.
3. *How does the DPDP Act affect fintech product design?* Clear consent and notice, collecting only necessary data, honouring withdrawal and erasure rights, security safeguards, and breach reporting.

**Related topics:** [24.1] Regulators, [6.5] Internal controls, [20.4] Operational risk.

---

### [21.11] Fintech Metrics, Unit Economics and Approaching Fintech Case Interviews
<!-- tags: domain=fintech-payments; level=intermediate; roles=Fintech-PM,Consulting,PE; keywords=fintech metrics, TPV, take rate, success rate, MAU, transacting users, contribution margin, cohort retention, CAC, LTV, fintech case interview, monetisation case, product sense, guesstimate -->

**Definition.** A practical toolkit of fintech metrics and a structured approach to fintech case and product interviews (monetisation, growth, product design and market entry questions).

**Why it matters.** Fintech PM and strategy interviews (payments, lending, wealth, rewards) combine product sense with financial reasoning. Strong candidates connect product decisions to metrics and unit economics.

**Core mechanics.**

*Metric tree by segment:*

| Segment | North-star metric | Driver metrics | Economics metrics |
|---|---|---|---|
| Consumer payments | Monthly transacting users | Transactions per user, success rate, new user activation | Cost per transaction, cross-sell conversion |
| Merchant payments | TPV | Active merchants, TPV per merchant, payment method mix, success rate | Net take rate, contribution margin, merchant churn |
| Lending | Disbursements / AUM | Approval rate, conversion, ticket size, tenure | Yield, cost of funds, credit cost by vintage, collection efficiency, RoA |
| Wealth / broking | Active investors, AUM | SIP book, orders per client, activation | ARPU, CAC payback, revenue mix |
| Rewards / engagement | Engaged users | Frequency, depth of use | Revenue per user, reward cost per user |

*Case approach (monetisation or growth question):*
1. **Clarify** the objective (revenue, profit, engagement, market share), time frame and constraints (regulation)
2. **Understand the user and the value chain** (who pays whom, where money flows)
3. **Size the opportunity** (TAM/SAM/SOM, or a quick revenue tree)
4. **Generate options** across segments (consumer, merchant, partner), prioritised by value, feasibility and risk
5. **Unit economics** for the top option (revenue per user, costs, CAC, payback)
6. **Risks and regulation** (RBI/SEBI/IRDAI rules, data, reputational)
7. **Metrics and experiment plan** (MVP, success metrics, guardrails)
8. **Recommendation**

**Worked example: "How should a UPI app increase revenue by ₹500 Cr in two years?"**
- Revenue tree: transacting users (5 Cr) × monetised products per user × revenue per product
- Options: (a) personal loans via partner NBFCs (2% of users × ₹50,000 average × 3% fee ≈ ₹150 Cr), (b) merchant soundboxes and POS for 30 lakh merchants at ₹1,200 a year (₹36 Cr) plus merchant loans (₹100 Cr), (c) insurance (₹50 Cr), (d) mutual fund and gold investments (₹40 Cr), (e) advertising and brand offers (₹80 Cr), (f) pricing large merchants on non-UPI rails and credit-on-UPI (₹60 Cr)
- Total ≈ **₹516 Cr**, with lending and merchant services as the largest, highest-risk pieces
- Risks: credit losses and DLG exposure, RBI digital lending rules, user trust; metrics: loan approval and default rates by vintage, merchant device activation and churn
- Recommendation: prioritise merchant services and partner lending with conservative risk limits; test insurance and investments through in-app placements

**Indian context.** Indian fintech companies increasingly report contribution margin and adjusted EBITDA; listed fintechs disclose segment-level KPIs (payments GMV, loans distributed, insurance premium) in shareholder letters [VERIFY: latest shareholder letter KPIs of listed Indian fintechs].

**Common mistakes.**
- Jumping to features without clarifying the objective and economics.
- Ignoring regulatory feasibility (e.g., proposing MDR on UPI P2M for small merchants).
- Big revenue numbers without unit economics or risk.

**Interview angle.**
1. *What's the right north-star metric for a payments app?* Monthly transacting users (or successful transactions per user), because they capture real engagement and are the base for monetisation.
2. *How would you evaluate whether to launch BNPL at checkout?* Merchant demand and subvention, user credit risk and approval rates, regulatory structure (partner RE, DLG), unit economics (subvention + interest − credit cost − funding), and impact on conversion.
3. *Estimate the annual revenue of a payment aggregator.* TPV × method mix × net take rate per method + value-added services; sanity-check against merchant count and average TPV per merchant.

**Related topics:** [9.2] Unit economics, [21.1] Landscape, [21.5] Payment aggregators, [21.6] Digital lending.

---

## Module 21 Glossary

| Term | Definition |
|---|---|
| Account aggregator | RBI-licensed consent manager for sharing financial data |
| APR | Annual percentage rate including fees, disclosed in the KFS |
| DLG / FLDG | Default loss guarantee (capped at 5% of the portfolio) |
| Interchange | Fee paid to the card issuer from the MDR |
| KFS | Key Fact Statement for loans |
| LSP | Lending service provider acting for a regulated lender |
| MDR | Merchant discount rate paid by merchants on payments |
| NPCI | National Payments Corporation of India |
| Payment aggregator | Entity collecting and settling merchant payments via escrow |
| PPI | Prepaid payment instrument (wallets, gift cards) |
| PSP bank | Bank sponsoring a UPI app and issuing VPAs |
| Success rate | Successful transactions / attempted transactions |
| Take rate | Revenue / TPV or GMV |
| TPAP | Third-party UPI application provider |
| VPA | Virtual payment address used in UPI |

## Module 21 Rapid-Fire Quiz

1. MDR on UPI P2M from bank accounts? **Zero**
2. Who is the PSP in a UPI transaction? **The bank sponsoring the app**
3. DLG cap in digital lending? **5% of the portfolio**
4. Card MDR 1.8%, interchange 1.4%, network 0.15%. Acquirer share? **0.25%**
5. ₹10,000 Cr TPV, net take rate 0.15%. Net revenue? **₹15 Cr**
6. Can an account aggregator read the data it carries? **No (data-blind)**
7. Which regulator licenses insurance web aggregators? **IRDAI**
8. Disclosure showing all-inclusive loan cost? **KFS with APR**
9. Main revenue for discount brokers? **F&O and intraday brokerage, margin interest**
10. Success rate rises from 80% to 84% on ₹500 Cr attempted GMV. Recovered GMV? **₹20 Cr**

## Module 21 [VERIFY] Items

1. Latest fintech funding and user data
2. RBI Payments Vision and NUE status; current IMPS/UPI/NEFT limits
3. NPCI P2P collect phase-out; current UPI products; BHIM-UPI incentive scheme; PPI interchange on UPI; RuPay credit on UPI MDR; market share cap deadline; NPCI monthly statistics and app shares; UPI category limits
4. Interchange rates by network; CoF tokenisation; RBI Authentication Directions 2025; e-mandate limits; RBI card statistics; card directions and network choice circular
5. RBI PA Directions (2025) including PA-CB and PA-P; list of authorised PAs and actions
6. RBI Digital Lending Directions 2025; DLG guidelines; KFS circular; digital lending apps directory; risk weight changes; ULI status
7. Sahamati AA statistics; Aadhaar authentication rules; ONDC data
8. SEBI uniform MII charges; F&O measures; client fund rules; demat and active client data; F&O risk disclosures
9. RBI BBPS credit card bill payment mandate; IRDAI EoM regulations; Bima Sugam; insurance penetration; insurance FDI limit
10. DPDP Rules timelines; RBI payment data storage; SRO-FT recognition; RBI action on Paytm Payments Bank; PPI Master Directions
11. Listed fintech KPI disclosures

---

# Module 22: International Finance

### [22.1] The Foreign Exchange Market: Quotes, Cross Rates and the INR Market
<!-- tags: domain=international-finance; level=foundation; roles=CF,Fintech-PM,ER,Consulting; keywords=foreign exchange market, exchange rate quote, direct quote, indirect quote, bid ask spread, cross rate, spot, forward, NDF market, USD INR, RBI intervention, managed float -->

**Definition.** The foreign exchange (FX) market is where currencies are traded. An exchange rate is the price of one currency in terms of another. Spot transactions settle in two business days; forwards settle at a future date at a rate fixed today.

**Why it matters.** Exporters, importers, investors, banks and cross-border fintechs all face currency risk. Treasury, international business and cross-border payments roles require fluency with quotes, cross rates and how the rupee is managed.

**Core mechanics.**
- **Quote conventions:** USD/INR = 84.00 means 1 USD costs ₹84 (base currency/quote currency). A **direct quote** (from India's view) gives the price of foreign currency in INR; an **indirect quote** gives foreign currency per rupee.
- **Bid-ask:** banks quote a bid (they buy the base currency) and an ask (they sell it). The spread is their margin and reflects liquidity.
- **Cross rates:** EUR/INR = EUR/USD × USD/INR (and similar for other pairs)
- **Appreciation / depreciation:** if USD/INR rises from 84 to 86, the rupee has depreciated (more rupees per dollar) by about 2.3%, and the dollar has appreciated.
- **Spot, forward, swap:** an FX swap combines a spot and an opposite forward transaction (used by banks and RBI for liquidity management).
- **Market participants:** banks (authorised dealers), corporates, FPIs, importers and exporters, RBI.
- **Onshore and offshore:** besides the onshore OTC and exchange-traded markets, an offshore non-deliverable forward (NDF) market trades INR forwards settled in USD; RBI has allowed Indian banks to participate in NDFs [VERIFY: RBI NDF participation rules].
- **Exchange rate regime:** India runs a managed float: the rupee is market-determined, with RBI intervening to curb excess volatility using its forex reserves.

**Worked example.**
- USD/INR 84.00 and EUR/USD 1.08 → EUR/INR = 1.08 × 84.00 = **90.72**
- A bank quotes USD/INR 83.95 / 84.05. An importer buying US$1 million pays ₹8.405 Cr; an exporter selling US$1 million receives ₹8.395 Cr. The ₹1 lakh spread is the bank's gross margin on the round trip.
- Retail remittance apps often add a markup of 1–3% over the interbank rate, so disclosed markup is a key product differentiator for cross-border fintechs.

**Indian context.** India's forex reserves are among the largest in the world, and RBI uses spot and forward interventions to smooth INR volatility [VERIFY: current RBI forex reserves and forward book]. FX benchmarks (FBIL reference rates) are published daily [VERIFY: FBIL reference rate publication].

**Common mistakes.**
- Confusing which currency appreciated when a quote rises.
- Computing percentage changes inconsistently (rupee depreciation ≠ dollar appreciation percentage, though close for small moves).
- Ignoring spreads and markups in cross-border pricing.

**Interview angle.**
1. *USD/INR goes from 82 to 84. What happened?* The rupee depreciated about 2.4% against the dollar; imports cost more in rupees and exporters earn more rupees per dollar.
2. *What is the NDF market?* An offshore market in non-deliverable forwards on currencies with capital controls, settled in USD, which can influence onshore rates.
3. *How does RBI manage the rupee?* A managed float: the market sets the rate, while RBI intervenes in spot and forward markets to curb volatility, without targeting a specific level.

**Related topics:** [22.2] Parity conditions, [22.3] FX risk management, [17.1] Forwards.

---

### [22.2] Parity Conditions: Interest Rate Parity, PPP and the International Fisher Effect
<!-- tags: domain=international-finance; level=intermediate; roles=CF,ER,IB,Consulting; keywords=covered interest parity, uncovered interest parity, forward premium, forward discount, purchasing power parity, relative PPP, real exchange rate, international Fisher effect, covered interest arbitrage, carry trade -->

**Definition.** Parity conditions are equilibrium relationships linking exchange rates, interest rates and inflation across countries. Covered interest parity (CIP) links forward rates to interest differentials and holds closely because of arbitrage; the others are long-run tendencies.

**Why it matters.** Parity conditions explain forward premiums (the cost of hedging), long-run currency trends and how to keep cross-border valuations consistent.

**Core mechanics.**
- **Covered interest parity (CIP):** F / S = (1 + i_domestic) / (1 + i_foreign) for matching tenors (with direct quotes in domestic currency)
  - Forward premium on USD ≈ i_INR − i_USD (annualised)
- **Covered interest arbitrage:** if the market forward differs from the CIP forward, borrow in one currency, convert, invest in the other, and lock in the forward to earn a riskless profit (until arbitrage closes the gap)
- **Uncovered interest parity (UIP):** expected future spot = forward rate; often violated in practice (the basis of carry trades)
- **Purchasing power parity (PPP):**
  - Absolute: exchange rate equals the ratio of price levels
  - Relative: % change in exchange rate ≈ inflation_domestic − inflation_foreign; E(S₁) = S₀ × (1 + π_d) / (1 + π_f)
- **Real exchange rate:** nominal rate adjusted for relative prices; a rising real rate (for the rupee) means Indian goods become less competitive
- **International Fisher effect:** expected currency change ≈ nominal interest differential (combining Fisher and PPP)

**Worked example 1: CIP.** Spot USD/INR 84.00; one-year INR rate 6.5%; one-year USD rate 4.5%.
- F = 84.00 × 1.065 / 1.045 = **85.61**: a forward premium on USD of about **1.91%**, which is the cost of hedging for an importer (and the gain for an exporter selling USD forward)
- 3-month forward = 84.00 × (1 + 0.065/4) / (1 + 0.045/4) = **84.42**

**Worked example 2: covered interest arbitrage.** The market one-year forward is 86.00 (above the CIP value of 85.61).
- Borrow ₹84 lakh × 100 = ₹8.4 Cr at 6.5% (repay ₹8.946 Cr)
- Convert to US$1 million at spot; invest at 4.5% → US$1.045 million
- Sell US$1.045 million forward at 86.00 → ₹8.987 Cr
- Riskless profit = 8.987 − 8.946 = **₹4.1 lakh** per US$1 million (before costs); arbitrage pushes the forward back toward 85.61

**Worked example 3: relative PPP.** India inflation 4.5%, US inflation 2.5%; spot 84.00.
- Expected rate in one year = 84 × 1.045 / 1.025 = **85.64** (about 2% rupee depreciation)
- Over long horizons, inflation differentials help explain the rupee's trend depreciation against the dollar.

**Indian context.** Because Indian interest rates have generally been higher than US rates, the USD/INR forward has typically traded at a premium, making hedging costly for importers and attractive for exporters [VERIFY: current USD/INR forward premia]. Capital controls and RBI intervention mean UIP and short-run PPP hold loosely for INR.

**Common mistakes.**
- Treating the forward rate as a forecast (under CIP it reflects interest differentials, not expectations of skill).
- Applying PPP to short-term exchange rate predictions.
- Mixing simple and compound interest across tenors.

**Interview angle.**
1. *Why does USD/INR trade at a forward premium?* Covered interest parity: Indian interest rates exceed US rates, so the forward rupee must be weaker to remove arbitrage.
2. *Does PPP predict exchange rates?* Poorly in the short run; better over long horizons, where inflation differentials explain trend moves.
3. *What's a carry trade and why does it work sometimes?* Borrowing in a low-yield currency to invest in a high-yield one; it profits when UIP fails (the high-yield currency doesn't depreciate as much as the rate gap), but suffers in sudden risk-off unwinds.

**Related topics:** [22.1] FX market, [17.2] Cost of carry, [1.2] Fisher equation.

---

### [22.3] Managing FX Risk: Exposures, Instruments and Hedge Choices
<!-- tags: domain=international-finance; level=intermediate; roles=CF,Consulting,Fintech-PM; keywords=FX risk management, importer hedge, exporter hedge, forward contract, currency option, collar, natural hedge, leading and lagging, invoicing currency, hedge cost -->

**Definition.** FX risk management identifies currency exposures and chooses whether and how to hedge them, using operational strategies and financial instruments, within a board-approved policy.

**Why it matters.** Currency moves can wipe out margins for importers, exporters and companies with foreign borrowings. Treasury and CFO-office roles, and fintechs serving exporters (cross-border payments, FX platforms), deal with these choices daily.

**Core mechanics.**
- **Exposures:** transaction (receivables and payables), translation (foreign subsidiaries), economic (competitive position)
- **Operational hedges:** invoicing in INR, matching currency of costs and revenues, leading and lagging payments, netting intercompany flows, local sourcing
- **Financial hedges:**
  - Forwards: lock the rate; no upfront cost; no upside
  - Options: protect against adverse moves while keeping upside; pay a premium
  - Collars / zero-cost structures: buy one option and sell another to fund it; limit both downside and upside
  - Currency swaps for long-term debt (see [17.7])
  - Exchange-traded currency futures and options
- **Choosing:** depends on certainty of the exposure (forwards for firm exposures, options for uncertain ones such as bids), risk appetite, cost, and accounting

**Worked example: importer with US$1 million payable in 6 months.** Spot 84.00; 6-month forward 84.90; 6-month USD call option at strike 85.00 with premium ₹0.60 per USD.

| Spot in 6 months | Unhedged cost (₹ per USD) | Forward | Call option (min(S, 85) + 0.60) |
|---|---|---|---|
| 83.00 | 83.00 | 84.90 | 83.60 |
| 85.00 | 85.00 | 84.90 | 85.60 |
| 87.00 | 87.00 | 84.90 | 85.60 |

- The forward gives certainty (₹8.49 Cr).
- The option caps cost at ₹85.60 while allowing the importer to benefit if the rupee strengthens, at the cost of the premium.
- Unhedged exposure would cost ₹8.70 Cr if spot reaches 87 (₹21 lakh worse than the forward).

**Indian context.** RBI's hedging framework lets residents hedge contracted and anticipated exposures with authorised dealers and on exchanges, with simplified rules for users with small exposures (e.g., up to US$10 million) [VERIFY: RBI Master Direction on Risk Management and Inter-Bank Dealings, user classification and limits]. Small exporters often remain unhedged because of cost and complexity, which is an opportunity for fintech FX platforms.

**Common mistakes.**
- Hedging uncertain exposures with forwards (creates new risk if the underlying doesn't materialise).
- Judging hedges by hindsight P&L.
- Ignoring the cost of the forward premium in pricing decisions.

**Interview angle.**
1. *An exporter expects USD receipts in 3 months. How can it hedge?* Sell USD forward, buy USD put options, use a collar, or borrow in USD (packing credit in foreign currency) and repay from receipts.
2. *When would you prefer an option over a forward?* When the exposure is uncertain (e.g., a tender bid) or the company wants to retain upside and can afford the premium.
3. *What's leading and lagging?* Accelerating or delaying payments and receipts based on expected currency moves; it's limited by contracts and supplier relationships.

**Related topics:** [20.6] Corporate hedging, [17.3] Options, [22.2] Parity.

---

### [22.4] Balance of Payments, Capital Flows and Exchange Rate Drivers
<!-- tags: domain=international-finance; level=intermediate; roles=Consulting,ER,CF,Fintech-PM; keywords=balance of payments, current account deficit, capital account, FDI, FPI, remittances, forex reserves, exchange rate determinants, twin deficits, terms of trade, oil prices -->

**Definition.** The balance of payments (BoP) records all economic transactions between residents of a country and the rest of the world. The current account covers trade in goods and services, income and transfers; the capital and financial account covers investment and borrowing flows; changes in reserves balance the two.

**Why it matters.** The BoP and capital flows drive the rupee, interest rates and equity markets. Macro-aware answers in consulting, banking and markets interviews connect oil prices, FPI flows and the current account deficit (CAD) to the rupee.

**Core mechanics.**
- **Current account** = Merchandise trade balance + Services balance + Primary income (interest, dividends) + Secondary income (remittances)
- **Financial account:** FDI, FPI (equity and debt), external commercial borrowings, NRI deposits, trade credit, other flows
- **Identity:** Current account + Capital and financial account + Change in reserves (with sign conventions) + Errors and omissions = 0. A CAD must be financed by net capital inflows or a drawdown of reserves.
- **Exchange rate drivers:** current account balance, capital flows (risk appetite, interest differentials, growth prospects), inflation differentials, terms of trade (oil prices for India), central bank policy and intervention, global dollar strength
- **Twin deficits:** fiscal deficit and current account deficit together increase vulnerability

**Worked example: oil shock.** India imports roughly 85% of its crude oil needs [VERIFY: current import dependence]. Suppose net oil imports are about US$100 billion a year at US$75 per barrel, and GDP is about US$4 trillion.
- A US$15 per barrel rise (20%) raises the import bill by about US$20 billion, widening the CAD by about **0.5% of GDP**
- If FPIs simultaneously sell because of global risk aversion, the rupee faces pressure from both accounts; RBI may sell reserves to smooth depreciation.

**Indian context.** India typically runs a merchandise trade deficit offset partly by a large services surplus (IT and business services) and remittances (India is the world's largest recipient), keeping the CAD modest in most years [VERIFY: latest RBI BoP data, services surplus and remittances]. FPI flows are volatile, while FDI is more stable. India's inclusion in global bond indices increased debt inflows from 2024 [VERIFY: index-related inflows].

**Common mistakes.**
- Assuming a current account deficit is always bad (it can finance productive investment if funded by stable flows).
- Ignoring services and remittances when discussing India's trade deficit.
- Treating FPI and FDI flows as equally stable.

**Interview angle.**
1. *What happens to the rupee when oil prices rise sharply?* India's import bill rises, the CAD widens and the rupee tends to weaken, often amplified if foreign investors become risk-averse.
2. *How is India's current account deficit financed?* Mainly through FDI, FPI, external borrowings and NRI deposits; reserves cover any shortfall.
3. *Why do remittances matter for India's BoP?* They are a large, stable inflow in the secondary income account that offsets a significant part of the merchandise trade deficit.

**Related topics:** [22.1] FX market, [25.7] Macroeconomics, [15.2] FPI flows.

---

### [22.5] FEMA and Cross-Border Investment Rules: FDI, ODI, ECB and LRS
<!-- tags: domain=international-finance; level=intermediate; roles=CF,IB,PE,Fintech-PM,Consulting; keywords=FEMA, capital account convertibility, FDI automatic route, government route, sectoral caps, Press Note 3, overseas direct investment, ODI rules 2022, ECB framework, LRS, TCS on LRS, FPI -->

**Definition.** The Foreign Exchange Management Act, 1999 (FEMA) governs foreign exchange transactions in India. The current account is largely convertible; the capital account is partially convertible, with rules for foreign investment into India, Indian investment abroad, foreign borrowing and individuals' remittances.

**Why it matters.** Cross-border deals, startup fundraising from foreign VCs, overseas expansion by Indian firms and cross-border fintech products (remittances, international investing) all operate within FEMA. IB, PE and fintech candidates need the structure.

**Core mechanics.**

| Area | Key rules (summary) |
|---|---|
| FDI (inbound) | Automatic route (no prior approval) for most sectors; government route for specified sectors; sectoral caps (e.g., insurance, defence, telecom, banking); prohibited sectors; pricing guidelines (not below fair value for issue to non-residents); reporting via FIRMS portal |
| Press Note 3 (2020) | Investments from entities of countries sharing a land border with India (or with beneficial owners there) need government approval |
| FPI | Portfolio investment by registered FPIs; individual FPI below 10% of a company's equity; aggregate limits up to sectoral caps; debt limits and routes (general, VRR, FAR) |
| ODI (outbound) | Overseas Investment Rules and Regulations 2022: financial commitment limits linked to net worth (e.g., up to 400% for automatic route), restrictions on round-tripping structures |
| ECB | External commercial borrowings under the automatic route within limits; eligibility, all-in-cost ceilings, minimum maturity, end-use restrictions; INR-denominated (masala) bonds |
| LRS | Resident individuals may remit up to US$250,000 per financial year for permitted current and capital account transactions (education, travel, investments) |

[VERIFY: FDI Policy (consolidated) and sectoral caps; FEMA NDI Rules 2019; FPI limits; Overseas Investment Rules 2022; RBI ECB Master Direction and 2025–26 revisions; LRS limit and TCS rates]

*Tax collected at source (TCS) on LRS:* applies above a threshold for many purposes (with lower or nil rates for education loans and medical) and is adjustable against tax liability [VERIFY: current TCS rates and thresholds under the Income-tax Act].

**Worked example: structuring a foreign VC investment.** A Singapore VC invests ₹100 Cr in an Indian fintech NBFC.
- Sector check: NBFCs are under the automatic route (100%) subject to RBI regulations; payments and lending fintechs may need RBI approval for change in control if thresholds are crossed
- Instrument: CCPS (FDI-compliant); conversion formula fixed upfront; pricing not below fair value by a merchant banker or chartered accountant valuation (DCF method commonly used)
- Press Note 3: if any beneficial owner of the fund is from a land-border country, government approval is required
- Reporting: Form FC-GPR on the FIRMS portal within 30 days of allotment

**Indian context.** RBI and the government have liberalised many rules over time (e.g., the 2022 ODI overhaul, rationalised ECB limits) while tightening others (Press Note 3, beneficial ownership scrutiny) [VERIFY: latest liberalisations]. Indian startups that had "flipped" their holding companies overseas have been returning ("reverse flipping") ahead of Indian IPOs, aided by faster merger approvals for cross-border inbound mergers [VERIFY: cross-border merger rules amendments (2024–25)].

**Common mistakes.**
- Issuing optionally convertible instruments to foreign investors as "equity" (they're treated as ECB/debt).
- Missing reporting deadlines (late submission fees and compounding).
- Overlooking Press Note 3 beneficial ownership tests in fund structures.

**Interview angle.**
1. *What's the difference between FDI and FPI?* FDI is a lasting investment typically of 10% or more in a company (or unlisted holdings), often with influence; FPI is portfolio investment below 10% in listed securities by registered foreign investors.
2. *What is LRS?* The Liberalised Remittance Scheme allowing resident individuals to send up to US$250,000 a year abroad for permitted purposes.
3. *Why do Indian startups issue CCPS to foreign investors?* FEMA permits fully and compulsorily convertible instruments as equity; they also carry investor protections.

**Related topics:** [8.10] Sources of finance, [12.6] Regulatory framework, [14.4] VC term sheets.

---

### [22.6] International Capital Budgeting and Cross-Border Valuation
<!-- tags: domain=international-finance; level=advanced; roles=CF,IB,PE,Consulting; keywords=international capital budgeting, foreign currency cash flows, home currency approach, foreign currency approach, country risk premium, political risk, repatriation, transfer pricing, withholding tax, cross-border DCF -->

**Definition.** International capital budgeting evaluates investments whose cash flows arise in foreign currencies and countries, adjusting for exchange rates, country risk, taxes and restrictions on moving cash.

**Why it matters.** Indian companies expanding abroad (and multinationals investing in India) need consistent cross-border valuation. Interviewers check whether candidates can avoid currency mismatches and double-counting of country risk.

**Core mechanics.**
- **Two consistent approaches:**
  1. **Foreign currency approach:** discount foreign currency cash flows at the foreign currency discount rate, then convert the PV at the spot rate
  2. **Home currency approach:** convert each year's cash flows at expected (or forward) exchange rates, then discount at the home currency discount rate
  - If interest rate parity holds and discount rates are consistent, both give the same answer
- **Country risk:** add a country risk premium (CRP) to the discount rate (common in USD-based valuations of emerging market assets), or model risk explicitly in cash flows through scenarios (preferred for project-specific risks like expropriation)
- **Parent vs project perspective:** value to the parent depends on repatriable cash flows after withholding taxes, transfer pricing and capital controls
- **Taxes:** foreign corporate taxes, withholding taxes on dividends, interest and royalties, tax treaties (DTAAs) and credits

**Worked example: consistency check.** A US project generates US$10 million a year for 3 years. USD discount rate 9%; spot USD/INR 84.00; INR rate 6.5% vs USD rate 4.5% (so forward rates follow CIP: about 85.61, 87.25, 88.92).
- Foreign currency approach: PV = 10 × (1/1.09 + 1/1.09² + 1/1.09³) = US$25.31 million × 84.00 = **₹212.6 Cr**
- Home currency approach: INR discount rate consistent with parity = (1.09 × 1.065/1.045) − 1 ≈ 11.09%; INR cash flows ₹85.61, 87.25, 88.92 Cr discounted at 11.09% → **≈ ₹212.6 Cr**
- Same answer, because the INR discount rate embeds the same inflation/interest differential as the forward rates.

**Indian context.** India's DTAAs (with Mauritius, Singapore, the Netherlands, the US, etc.) affect withholding taxes and structuring; treaty changes and anti-abuse rules (GAAR, principal purpose test under the MLI) have reduced treaty shopping [VERIFY: current DTAA rates and MLI provisions]. Indian outbound acquirers (e.g., in IT services, pharma, auto components) value targets in USD/EUR and convert, typically using CIP-consistent rates.

**Common mistakes.**
- Discounting foreign currency cash flows at a home currency rate (currency mismatch).
- Adding a country risk premium and also haircutting cash flows for the same risk.
- Ignoring withholding taxes and repatriation constraints.

**Interview angle.**
1. *How do you value a foreign subsidiary?* Either discount local currency cash flows at a local currency rate and convert at spot, or convert cash flows at forward rates and discount at the home rate; keep currency, inflation and discount rate consistent.
2. *How should country risk be handled?* Through a country risk premium in the discount rate for broad market-wide risk, or through explicit scenarios for specific risks; avoid double counting.
3. *Why might a project's value to the parent differ from its standalone value?* Repatriation limits, withholding taxes, transfer pricing, financing subsidies and currency controls.

**Related topics:** [8.2] Capital budgeting, [10.2] DCF, [22.2] Parity conditions.

---

### [22.7] Trade Finance: Letters of Credit, Guarantees and Export Credit
<!-- tags: domain=international-finance; level=intermediate; roles=CF,Fintech-PM,Consulting; keywords=trade finance, letter of credit, documentary collection, bank guarantee, standby LC, pre-shipment credit, post-shipment credit, packing credit, export factoring, forfaiting, ECGC, Incoterms -->

**Definition.** Trade finance covers instruments and credit that reduce payment risk and fund working capital in domestic and international trade: letters of credit, documentary collections, guarantees, export and import credit, factoring and forfaiting.

**Why it matters.** Exporters and importers rely on banks to bridge trust and timing gaps. Supply chain and trade finance are growing fintech categories (digital LCs, invoice discounting platforms, cross-border receivables financing).

**Core mechanics.**

*Payment methods (from least to most risky for the exporter):*
1. Cash in advance
2. Letter of credit (LC)
3. Documentary collection (documents against payment or acceptance)
4. Open account (exporter ships and waits for payment)

*Letter of credit:* a bank's undertaking to pay the exporter on presentation of compliant documents (bill of lading, invoice, insurance, certificate of origin). Types: sight vs usance, confirmed (a second bank adds its guarantee), revocable (rare) vs irrevocable, transferable, back-to-back, standby LC (functions like a guarantee). Governed by ICC rules (UCP 600).

*Bank guarantees:* performance, financial and bid guarantees backing obligations under contracts.

*Export credit:* pre-shipment (packing credit, in INR or foreign currency, to buy inputs and produce) and post-shipment credit (discounting export bills); interest equalisation schemes have subsidised rates for some exporters [VERIFY: status of interest equalisation scheme].

*Credit insurance:* ECGC (Export Credit Guarantee Corporation of India) insures exporters and banks against buyer and country risk.

*Factoring and forfaiting:* factoring sells short-term receivables (with or without recourse); forfaiting sells medium-term receivables without recourse, typically backed by bank guarantees or avals.

*Incoterms (ICC):* define who bears costs and risks at each stage of shipment (e.g., FOB: risk passes when goods are loaded; CIF: seller pays cost, insurance and freight to the destination port).

**Worked example: cost of an LC vs open account.** An exporter sells US$500,000 of goods with 90-day credit to a new buyer.
- Open account: no bank fees, but credit risk on an unknown buyer; ECGC cover costs, say, 0.5% (US$2,500)
- Confirmed usance LC: issuing bank fee (paid by buyer) plus confirmation fee for the exporter of, say, 0.75% annualised for 3 months (≈ US$940) plus discounting at 6% annualised for 90 days (≈ US$7,400 if the exporter wants cash immediately)
- For a new buyer in a higher-risk country, the LC's payment security usually justifies its cost; with a trusted buyer, open account with credit insurance may be cheaper.

**Indian context.** India's foreign trade policy and RBI's Master Direction on export of goods and services set realisation timelines (e.g., export proceeds to be realised within nine months, subject to change) [VERIFY: RBI export realisation period and FTP 2023]. Digital trade platforms (e.g., TReDS for domestic receivables, bank-led blockchain LC pilots, the GIFT City IFSC trade finance platforms) are growing [VERIFY: IFSCA ITFS platforms].

**Common mistakes.**
- Assuming an LC guarantees payment regardless of documents (discrepancies void the bank's obligation).
- Ignoring country and bank risk on the issuing bank (hence confirmation).
- Choosing Incoterms without understanding where risk passes.

**Interview angle.**
1. *How does a letter of credit protect an exporter?* The issuing bank promises payment if compliant documents are presented, substituting the bank's credit for the buyer's.
2. *Factoring vs forfaiting?* Factoring finances short-term receivables, often with recourse; forfaiting buys medium-term receivables without recourse, usually guaranteed by banks.
3. *(Fintech PM) What problems could a trade finance fintech solve for Indian MSME exporters?* Faster, cheaper working capital against export invoices, simpler documentation and compliance, FX conversion at fair spreads, and credit insurance bundled at the point of invoicing.

**Related topics:** [8.9] Working capital, [3.6] Cash conversion cycle, [22.3] FX risk.

---

## Module 22 Glossary

| Term | Definition |
|---|---|
| Balance of payments | Record of a country's transactions with the rest of the world |
| CIP | Covered interest parity linking forwards to interest differentials |
| Cross rate | Exchange rate derived from two other rates |
| Current account deficit | Shortfall of exports and income over imports and payments abroad |
| DTAA | Double taxation avoidance agreement |
| ECB | External commercial borrowing |
| FEMA | Foreign Exchange Management Act, 1999 |
| Forward premium | Excess of forward over spot rate |
| Letter of credit | Bank undertaking to pay on compliant documents |
| LRS | Liberalised Remittance Scheme |
| NDF | Non-deliverable forward settled in a convertible currency |
| ODI | Overseas direct investment |
| PPP | Purchasing power parity |
| Press Note 3 | 2020 rule requiring approval for investments from land-border countries |
| Real exchange rate | Nominal rate adjusted for relative price levels |

## Module 22 Rapid-Fire Quiz

1. USD/INR 83, GBP/USD 1.25. GBP/INR? **103.75**
2. Spot 80, INR rate 7%, USD rate 5%, 1 year. CIP forward? **≈ 81.52**
3. India inflation 5%, US 2%, spot 84. PPP-expected rate in a year? **≈ 86.47**
4. Importer with a firm payable: forward or option for certainty? **Forward**
5. LRS annual limit for individuals? **US$250,000**
6. Investments from land-border countries need what? **Government approval (Press Note 3)**
7. Most secure payment method for an exporter? **Cash in advance**
8. A rising USD/INR means the rupee has? **Depreciated**
9. Forward above CIP value: which leg does arbitrage borrow? **INR (buy USD spot, sell USD forward)**
10. Bank adding its guarantee to another bank's LC creates? **A confirmed LC**

## Module 22 [VERIFY] Items

1. RBI NDF participation rules; current forex reserves and forward book; FBIL reference rates
2. Current USD/INR forward premia
3. RBI hedging Master Direction user classification and limits
4. India oil import dependence; latest BoP, services surplus and remittances; index-related debt inflows
5. FDI policy and sectoral caps; FEMA NDI Rules; FPI limits; ODI Rules 2022; ECB Master Direction and revisions; LRS limit and TCS rates; recent liberalisations; cross-border merger rules
6. DTAA rates and MLI provisions
7. Interest equalisation scheme status; export realisation period and FTP 2023; IFSCA trade finance platforms

---

# Module 23: Taxation for Finance Professionals

> **Important:** Indian tax law changes every year through the Finance Act, and the Income-tax Act 2025 replaced the Income-tax Act 1961 from 1 April 2026, renumbering sections and introducing the "tax year" concept. All rates and thresholds below are illustrative of the position as last known and must be checked against the current law before use.

### [23.1] Indian Direct Tax Overview: Corporate and Personal Taxation
<!-- tags: domain=taxation; level=foundation; roles=CF,IB,Fintech-PM,Consulting,Audit; keywords=Income-tax Act 2025, corporate tax rate, section 115BAA, MAT, surcharge, cess, effective tax rate, new tax regime, old tax regime, tax slabs, TDS, advance tax, tax year -->

**Definition.** Direct taxes in India are levied on income under the Income-tax Act. Companies pay corporate income tax on profits; individuals pay tax on salary, business income, capital gains, house property and other income under either the new (default) regime or the old regime.

**Why it matters.** Tax rates feed every valuation (WACC, after-tax cash flows), every deal structure and every personal finance product. Candidates should know the headline corporate and personal structures and how effective rates are built.

**Core mechanics.**

*Corporate tax (domestic companies, illustrative):*

| Regime | Base rate | Effective rate with surcharge and cess (large companies) | Notes |
|---|---|---|---|
| Concessional (s.115BAA in the 1961 Act) | 22% | ≈ **25.17%** (10% surcharge, 4% cess) | No MAT; most exemptions and incentives forgone |
| New manufacturing (s.115BAB) | 15% | ≈ 17.16% | Only for companies that started manufacturing by the sunset date (31 March 2024) |
| Normal, turnover ≤ ₹400 Cr | 25% | ≈ 29.12% (12% surcharge above ₹10 Cr income) | MAT applies |
| Normal, other | 30% | ≈ 34.94% | MAT applies |
| MAT (book profit tax) | 15% | ≈ 17.47% | Credit can be carried forward; not applicable under concessional regime |

Effective rate = Base rate × (1 + Surcharge) × (1 + Cess): e.g., 22% × 1.10 × 1.04 = 25.168%.

*Personal tax (new regime, illustrative for recent years):* slabs of nil up to ₹4 lakh, then 5%, 10%, 15%, 20%, 25% in ₹4 lakh steps, and 30% above ₹24 lakh; a rebate makes income up to ₹12 lakh effectively tax-free; standard deduction for salaried individuals of ₹75,000; few other deductions. The old regime retains deductions (80C, 80D, HRA, home loan interest) with higher slab rates.

*Collection mechanisms:* tax deducted at source (TDS) and tax collected at source (TCS) on specified payments; advance tax in instalments; self-assessment; annual return; assessment and appeals.

**Worked example 1: effective corporate tax.** A company with PBT of ₹200 Cr under the concessional regime pays ≈ 200 × 25.168% = **₹50.3 Cr**. Under the normal 30% regime with MAT credits unused, it would pay ≈ ₹69.9 Cr unless deductions bring taxable income down; most large companies shifted to the concessional regime after 2019.

**Worked example 2: personal tax (new regime).** Salary ₹20 lakh; standard deduction ₹75,000 → taxable income ₹19.25 lakh.
- Tax = 0 (0–4 L) + ₹20,000 (4–8 L at 5%) + ₹40,000 (8–12 L at 10%) + ₹60,000 (12–16 L at 15%) + ₹65,000 (16–19.25 L at 20%) = **₹1,85,000**
- Plus 4% cess = **₹1,92,400** (effective ≈ 9.6% of gross salary)

**Indian context.** The Income-tax Act 2025 (in force from 1 April 2026) simplifies language and replaces "previous year / assessment year" with a single "tax year", largely preserving the tax policy of the 1961 Act at commencement [VERIFY: Income-tax Act 2025 commencement, section mapping, and rates for tax year 2026-27]. Personal slabs and rebates were revised in Budget 2025 [VERIFY: current slabs, rebate threshold and standard deduction].

**Common mistakes.**
- Using the 22% base rate instead of the 25.17% effective rate in valuations.
- Forgetting MAT for companies on the normal regime.
- Quoting section numbers from the 1961 Act without checking the 2025 Act equivalents.

**Interview angle.**
1. *What tax rate would you use in a DCF for an Indian company?* The effective marginal rate it actually pays, often about 25.17% for companies under the concessional regime; check for tax holidays, losses and MAT credits.
2. *Why did many Indian companies switch to the concessional regime?* The lower rate outweighed the value of exemptions and incentives for most companies, and it eliminated MAT.
3. *What's the difference between TDS and advance tax?* TDS is deducted by the payer when making specified payments; advance tax is paid by the taxpayer in instalments on estimated income.

**Related topics:** [2.9] Deferred tax, [1.7] WACC, [23.2] Capital gains.

---

### [23.2] Capital Gains Taxation on Securities and Other Assets
<!-- tags: domain=taxation; level=foundation; roles=Fintech-PM,ER,CF,PE; keywords=capital gains tax, STCG, LTCG, holding period, listed equity, equity mutual funds, debt mutual funds, indexation, grandfathering, STT, set-off of losses, tax harvesting -->

**Definition.** Capital gains are profits from the sale of capital assets (shares, mutual funds, property, gold, bonds). They are classified as short-term or long-term based on the holding period and taxed at different rates.

**Why it matters.** Capital gains rules drive investor behaviour, product design (tax harvesting features, SIP redemption ordering) and after-tax return comparisons. The rules changed significantly in July 2024 and April 2023.

**Core mechanics (as amended from 23 July 2024, illustrative):**

| Asset | Long-term if held | STCG rate | LTCG rate |
|---|---|---|---|
| Listed equity shares, equity-oriented MFs (STT paid) | > 12 months | 20% | 12.5% on gains above ₹1.25 lakh a year |
| Other listed securities (e.g., listed bonds) | > 12 months | Slab | 12.5% (no indexation) |
| Unlisted shares, property, gold, other assets | > 24 months | Slab | 12.5% without indexation (with a transitional option for land and buildings acquired before 23 July 2024 by resident individuals/HUFs) |
| Debt-oriented MFs (≤35% equity) bought on or after 1 April 2023, market-linked debentures | Any | Slab (deemed short-term) | Slab |

[VERIFY: Finance (No. 2) Act 2024 capital gains changes; section 50AA; grandfathering for gains before 1 February 2018 on listed equity; current rates under the Income-tax Act 2025]

*Other rules:* securities transaction tax (STT) on equity trades; short-term capital losses can be set off against short- and long-term gains, long-term losses only against long-term gains; carry-forward for 8 years; bonus stripping and dividend stripping rules; FIFO for units and shares held in demat.

**Worked example.** An investor buys shares for ₹5 lakh and sells for ₹8 lakh (gain ₹3 lakh), with no other gains in the year.
- Held 2 years (LTCG): taxable = 3 − 1.25 = ₹1.75 lakh × 12.5% = ₹21,875 + 4% cess = **₹22,750**
- Held 10 months (STCG): ₹3 lakh × 20% = ₹60,000 + 4% cess = **₹62,400**
- Waiting two more months saves about ₹39,650, a common nudge in wealth apps ("this lot turns long-term on...").

*Tax harvesting:* realising LTCG up to ₹1.25 lakh a year and repurchasing resets the cost basis tax-free (subject to anti-avoidance rules); realising losses offsets gains.

**Indian context.** The April 2023 change removed long-term capital gains treatment and indexation for debt funds bought after that date, reducing their tax advantage over bank deposits for high-bracket investors [VERIFY: subsequent amendments to section 50AA treatment]. Non-residents face withholding on capital gains, subject to treaty relief [VERIFY: DTAA capital gains provisions, e.g., India-Mauritius and India-Singapore post-2017].

**Common mistakes.**
- Applying old rates (10% LTCG, 15% STCG on equity) to sales after 23 July 2024.
- Assuming indexation still applies to debt funds and most assets.
- Forgetting the ₹1.25 lakh exemption is per year, across all equity LTCG.

**Interview angle.**
1. *How are equity gains taxed in India now?* STCG at 20% if held 12 months or less; LTCG at 12.5% above ₹1.25 lakh a year if held longer (rates as amended in 2024; check current law).
2. *Why did debt mutual funds become less attractive in 2023?* Gains on new investments are taxed at slab rates regardless of holding period, removing indexation benefits.
3. *(Wealthtech PM) What tax feature would you build?* Lot-level holding-period tracking with alerts before short-term lots become long-term, tax-loss and gain harvesting suggestions, and capital gains statements.

**Related topics:** [15.9] Mutual funds, [18.5] Rebalancing, [23.3] Dividends and buybacks.

---

### [23.3] Taxation of Dividends, Buybacks, Interest and Withholding Taxes
<!-- tags: domain=taxation; level=intermediate; roles=CF,IB,ER,Fintech-PM; keywords=dividend taxation, dividend distribution tax abolition, buyback tax, deemed dividend, TDS on dividend, interest income tax, withholding tax non-residents, DTAA rates -->

**Definition.** Dividends, buybacks and interest are taxed differently in the hands of companies and shareholders, and payments to non-residents attract withholding taxes subject to treaties.

**Why it matters.** Payout policy, investor returns and cross-border structures depend on these rules; Indian rules changed in 2020 (dividends) and 2024 (buybacks).

**Core mechanics.**
- **Dividends:** since 1 April 2020, dividend distribution tax (DDT) was abolished; dividends are taxed in shareholders' hands at their applicable rates. Companies deduct TDS (e.g., 10% for residents above a small threshold). Inter-corporate dividends can be deducted to the extent the receiving company redistributes them (to avoid cascading).
- **Buybacks:** from 1 October 2024, buyback proceeds are treated as deemed dividends taxed in shareholders' hands at their rates; the cost of the shares bought back is treated as a capital loss available to set off against capital gains. Earlier, companies paid a 20% (plus surcharge and cess) buyback tax on distributed income and shareholders were exempt.
- **Interest:** taxed at slab rates for individuals (fixed deposits, bonds); TDS on bank interest above thresholds.
- **Non-residents:** withholding tax on dividends, interest, royalties and fees for technical services under domestic law or a lower DTAA rate (with a tax residency certificate and other documentation).

[VERIFY: Finance (No. 2) Act 2024 buyback provisions; current TDS rates and thresholds; DTAA dividend and interest withholding rates]

**Worked example: dividend vs buyback for a high-income shareholder (post-October 2024).** A company returns ₹100 per share to a shareholder in the 30% slab (ignoring surcharge) whose cost of the shares is ₹40.
- Dividend: tax ≈ ₹30 (30% of ₹100); the ₹40 cost stays in the shares
- Buyback of one share at ₹100: deemed dividend ₹100 taxed ≈ ₹30; capital loss of ₹40 available to offset other capital gains (worth up to ₹40 × 12.5–20% ≈ ₹5–8 if the investor has gains)
- The two routes are now broadly similar for resident individuals, unlike before October 2024 when buybacks were tax-free for shareholders.

**Indian context.** Promoters and high-income shareholders historically preferred buybacks because the company-level buyback tax was lower than their dividend tax rates; the 2024 change removed this arbitrage [VERIFY: buyback activity data post-2024].

**Common mistakes.**
- Using the pre-2020 DDT framework in analysis.
- Ignoring the capital loss created on buybacks under the new rules.
- Forgetting treaty relief documentation requirements for non-residents.

**Interview angle.**
1. *How are dividends taxed in India today?* In shareholders' hands at their applicable rates, with TDS by the company; DDT was abolished in 2020.
2. *What changed for buybacks in 2024?* Proceeds became deemed dividends taxable for shareholders, with the share cost treated as a capital loss, instead of a company-level buyback tax.
3. *How does withholding tax affect a foreign investor's return?* It reduces cash received; treaties can lower rates, and investors may claim credits in their home country.

**Related topics:** [8.8] Payout policy, [2.12] Buybacks, [22.6] Cross-border taxes.

---

### [23.4] Goods and Services Tax (GST) Fundamentals
<!-- tags: domain=taxation; level=foundation; roles=CF,Fintech-PM,Consulting,Audit; keywords=GST, CGST, SGST, IGST, input tax credit, place of supply, reverse charge, GST rates, GST 2.0, e-invoicing, e-way bill, GST on financial services, GSTN -->

**Definition.** The Goods and Services Tax (GST), introduced on 1 July 2017, is a destination-based, multi-stage tax on the supply of goods and services, with credit for tax paid on inputs so that tax applies only to value added at each stage.

**Why it matters.** GST affects pricing, working capital (input tax credit timing), invoicing and compliance systems. Fintechs use GST data (GSTN) for underwriting and build GST compliance tools; finance teams manage GST cash flows.

**Core mechanics.**
- **Structure:** intra-state supplies attract CGST (central) + SGST (state); inter-state supplies attract IGST (central, shared with states); imports attract IGST
- **Rates:** after the September 2025 rate rationalisation ("GST 2.0"), most goods and services fall into a 5% merit rate and an 18% standard rate, with a 40% rate for specified luxury and sin goods, plus special rates (e.g., for precious metals) and exemptions [VERIFY: GST Council 56th meeting decisions effective 22 September 2025 and subsequent changes]
- **Input tax credit (ITC):** GST paid on inputs is credited against output GST, if conditions are met (valid invoice, supplier has filed returns, goods/services received, used for business); blocked credits apply to certain items
- **Place of supply:** determines whether a supply is intra- or inter-state and which state gets the tax
- **Reverse charge:** for certain supplies, the recipient pays GST instead of the supplier
- **Compliance:** registration, monthly/quarterly returns (GSTR-1 for outward supplies, GSTR-3B summary return), e-invoicing above turnover thresholds, e-way bills for movement of goods
- **Financial services:** most fee-based financial services attract 18% GST (e.g., MDR, processing fees, brokerage); interest on loans and deposits is exempt

**Worked example: value-added chain.** A manufacturer buys inputs for ₹100 + 18% GST (₹18) and sells to a retailer for ₹150 + ₹27 GST. The retailer sells to a consumer for ₹200 + ₹36 GST.

| Stage | Output GST | Input credit | Net GST paid |
|---|---|---|---|
| Input supplier | 18 | 0 | 18 |
| Manufacturer | 27 | 18 | 9 |
| Retailer | 36 | 27 | 9 |
| **Total to government** | | | **36** |

Total GST = ₹36 = 18% of the final price of ₹200; each stage pays tax only on its value addition.

**Indian context.** The GST Network (GSTN) runs the technology backbone; GST data is used by lenders via account aggregators for MSME underwriting. Compensation cess to states was being wound down and replaced in the 2025 reforms [VERIFY: compensation cess status]. GST on online gaming, crypto and other new sectors has been the subject of specific Council decisions [VERIFY: current GST on online money gaming and VDAs].

**Common mistakes.**
- Treating GST as a cost for businesses that can claim ITC (it is a cost mainly for final consumers and for exempt or blocked-credit supplies).
- Ignoring working capital effects when ITC is delayed by supplier non-compliance.
- Assuming interest income attracts GST.

**Interview angle.**
1. *What's input tax credit?* Credit for GST paid on purchases used in the business, offset against GST on sales, so tax is paid only on value added.
2. *CGST/SGST vs IGST?* Intra-state supplies carry CGST + SGST; inter-state supplies carry IGST, collected centrally and apportioned to the consuming state.
3. *How does GST affect a payment aggregator's merchant pricing?* MDR and fees attract 18% GST, so a 2% MDR costs the merchant 2.36% in total; merchants can claim ITC if registered.

**Related topics:** [21.7] GST data for lending, [3.1] Revenue net of GST, [23.5] Deal taxes.

---

### [23.5] Tax in Corporate Finance and Deals
<!-- tags: domain=taxation; level=advanced; roles=IB,PE,CF,Consulting; keywords=interest tax shield, tax losses, section 72A, section 79, slump sale tax, share sale vs asset sale, demerger tax neutrality, GAAR, indirect transfer, stamp duty, tax due diligence, thin capitalisation, interest limitation section 94B -->

**Definition.** Tax considerations shape financing (interest deductibility), deal structure (share vs asset purchase, mergers, demergers), the value of tax attributes (losses, credits) and the risks inherited in acquisitions.

**Why it matters.** Tax can make or break deal returns. IB, PE and corporate development roles must know the levers and the traps.

**Core mechanics.**
- **Interest tax shield:** interest is deductible, so debt reduces tax by Interest × t; India limits interest deductions on borrowings from non-resident associated enterprises to 30% of EBITDA (thin capitalisation rule, s.94B of the 1961 Act)
- **Tax losses:** business losses can be carried forward 8 years (unabsorbed depreciation indefinitely); a change in shareholding of more than 49% generally lapses carried-forward losses for closely held companies (s.79), with exceptions (e.g., eligible startups, IBC resolutions); amalgamations can preserve losses if s.72A conditions are met
- **Share sale vs asset sale vs slump sale:**
  - Share sale: seller pays capital gains tax; buyer inherits historical tax positions and liabilities; no step-up in asset tax bases
  - Asset (itemised) sale: buyer gets a step-up in tax bases (more depreciation); seller may face higher taxes; GST and stamp duty may apply to assets
  - Slump sale: transfer of an undertaking for a lump sum; taxed as capital gains on the undertaking's net worth (s.50B), generally outside GST as a going concern transfer
- **Mergers and demergers:** tax-neutral if statutory conditions are met (s.2(1B) amalgamation, s.2(19AA) demerger)
- **Anti-avoidance:** General Anti-Avoidance Rules (GAAR) for arrangements whose main purpose is a tax benefit; indirect transfer rules tax gains on transfers of foreign shares deriving substantial value from Indian assets
- **Stamp duty:** state-level duty on transfers of shares (physical and demat) and property, and on scheme orders
- **Tax due diligence:** pending assessments, disputes, withholding compliance, transfer pricing, GST exposures; protected through indemnities and escrows

**Worked example 1: value of a tax shield.** A company borrows ₹400 Cr at 9%, permanently, with a 25.17% tax rate.
- Annual interest = ₹36 Cr; annual tax saving = 36 × 25.17% = **₹9.06 Cr**
- PV of the perpetual tax shield (discounted at the cost of debt) = t × D = 25.17% × 400 = **₹100.7 Cr**

**Worked example 2: value of acquired losses.** A target has ₹200 Cr of carried-forward business losses. If the buyer's acquisition preserves them and they can be used evenly over 4 years at 25.17%:
- Tax saving = ₹50.3 Cr in total (₹12.6 Cr a year); PV at 12% ≈ **₹38.2 Cr**
- If the share acquisition breaches the 49% shareholding test (closely held company, no exemption), the losses lapse and this value is zero, which can change the price or structure (e.g., a merger route satisfying s.72A).

**Indian context.** The retrospective indirect transfer tax disputes (Vodafone, Cairn) were resolved through 2021 legislation withdrawing retrospective demands [VERIFY: Taxation Laws (Amendment) Act 2021]. Section numbers above refer to the 1961 Act; check corresponding provisions in the Income-tax Act 2025.

**Common mistakes.**
- Valuing tax losses at face value without considering usage timing and continuity rules.
- Ignoring stamp duty and GST in structuring comparisons.
- Overlooking inherited tax disputes in share deals.

**Interview angle.**
1. *Share deal or asset deal: tax considerations?* Share deals are simpler but carry historical tax risk and no step-up; asset deals give the buyer a step-up and leave liabilities behind, but may cost more tax for the seller and attract GST and stamp duty.
2. *How do you value a target's tax losses?* PV of expected tax savings, considering usage timing, profitability and legal continuity conditions.
3. *What's GAAR?* Rules allowing tax authorities to deny tax benefits from arrangements whose main purpose is tax avoidance and that lack commercial substance.

**Related topics:** [12.4] Deal structuring, [8.6] Capital structure, [12.5] Due diligence.

---

### [23.6] International Taxation: DTAAs, Permanent Establishment, Transfer Pricing and Global Minimum Tax
<!-- tags: domain=taxation; level=advanced; roles=CF,IB,Consulting; keywords=international tax, DTAA, permanent establishment, significant economic presence, transfer pricing, BEPS, Pillar One, Pillar Two, global minimum tax, equalisation levy, MLI, tax residency certificate -->

**Definition.** International tax rules allocate taxing rights between countries over cross-border income, relieve double taxation (through treaties and credits) and counter profit shifting.

**Why it matters.** Multinationals' effective tax rates, cross-border fintech business models (digital services) and global capability centres in India are all shaped by these rules.

**Core mechanics.**
- **DTAAs:** treaties define residence, allocate taxing rights on business profits (taxable in the source country only if there's a permanent establishment), dividends, interest, royalties and capital gains, and provide relief (exemption or credit)
- **Permanent establishment (PE):** fixed place of business, dependent agent, or service PE in the source country; India also has a significant economic presence (SEP) concept in domestic law for digital businesses
- **Transfer pricing:** related-party transactions at arm's length (see [7.8]); documentation, safe harbours, advance pricing agreements
- **BEPS (OECD/G20):** actions against base erosion and profit shifting; the Multilateral Instrument (MLI) modified treaties, including a principal purpose test
- **Pillar One:** reallocation of some taxing rights over very large multinationals to market countries (implementation uncertain)
- **Pillar Two (global minimum tax):** 15% minimum effective tax rate for groups with revenue of €750 million or more, through income inclusion and top-up rules in implementing jurisdictions
- **India's digital taxes:** the 2% equalisation levy on e-commerce operators was abolished from August 2024 and the 6% levy on online advertising from April 2025 [VERIFY: Finance Acts 2024 and 2025 equalisation levy abolition]

**Worked example: treaty withholding.** A US company receives ₹10 Cr royalty from its Indian subsidiary.
- Domestic withholding rate on royalties (illustrative 20% plus surcharge and cess) vs India-US DTAA rate of 15% (illustrative)
- With a tax residency certificate and Form 10F, the Indian company withholds at the lower treaty rate: ₹1.5 Cr instead of about ₹2.1 Cr
- The US parent claims a foreign tax credit for the ₹1.5 Cr against its US tax on the royalty

[VERIFY: domestic royalty rate and India-US DTAA royalty rate]

**Indian context.** India has a large network of DTAAs; amendments to the India-Mauritius and India-Singapore treaties moved capital gains taxation on shares to source-based taxation for investments after April 2017 [VERIFY: grandfathering provisions]. India hosts a large number of global capability centres whose cost-plus remuneration is a frequent transfer pricing issue.

**Common mistakes.**
- Assuming treaty rates apply automatically without documentation.
- Ignoring PE risk when employees habitually conclude contracts in another country.
- Assuming Pillar Two applies to all companies (only large groups above the threshold).

**Interview angle.**
1. *What is a permanent establishment and why does it matter?* A taxable presence in another country (office, dependent agent, service PE); without a PE, business profits are generally taxed only in the home country under treaties.
2. *What is Pillar Two?* A global minimum tax of 15% on large multinational groups, applied through top-up taxes where effective tax rates are lower.
3. *How do DTAAs prevent double taxation?* By allocating taxing rights between countries and requiring the residence country to give exemption or credit for tax paid at source.

**Related topics:** [7.8] Transfer pricing, [22.6] Cross-border valuation, [22.5] FEMA.

---

## Module 23 Glossary

| Term | Definition |
|---|---|
| Advance tax | Tax paid in instalments during the year |
| DTAA | Double taxation avoidance agreement |
| GAAR | General anti-avoidance rules |
| GST | Goods and services tax |
| IGST | Integrated GST on inter-state supplies |
| Input tax credit | Credit for GST paid on inputs |
| LTCG / STCG | Long-term / short-term capital gains |
| MAT | Minimum alternate tax on book profits |
| Permanent establishment | Taxable presence in a source country |
| Pillar Two | 15% global minimum tax for large groups |
| Slump sale | Sale of an undertaking for a lump sum |
| STT | Securities transaction tax |
| Surcharge | Additional tax on tax for higher incomes |
| TDS | Tax deducted at source |
| Tax shield | Tax saved due to deductible expenses (e.g., interest) |

## Module 23 Rapid-Fire Quiz

1. Effective rate under the 22% concessional regime (10% surcharge, 4% cess)? **≈25.17%**
2. LTCG ₹2.25 lakh on listed equity: taxable amount (₹1.25 lakh exemption)? **₹1 lakh**
3. Holding period for long-term status on listed shares? **More than 12 months**
4. Debt MF bought in 2024 and sold after 3 years: tax treatment? **Slab rate (deemed short-term)**
5. Who pays tax on dividends in India now? **Shareholders**
6. GST on a ₹2,000 MDR fee at 18%? **₹360**
7. Interest ₹50 Cr, tax 25%: annual tax shield? **₹12.5 Cr**
8. Carry-forward period for business losses? **8 years**
9. Pillar Two minimum effective rate? **15%**
10. Inter-state supply attracts which GST? **IGST**

## Module 23 [VERIFY] Items

1. Income-tax Act 2025 commencement, section mapping and tax year 2026-27 rates; current personal slabs, rebate and standard deduction
2. Finance (No. 2) Act 2024 capital gains changes; section 50AA; grandfathering; DTAA capital gains provisions
3. Buyback taxation provisions; TDS rates and thresholds; DTAA withholding rates; buyback activity data
4. GST Council decisions (September 2025) and later changes; compensation cess; GST on online gaming and VDAs
5. Thin capitalisation (s.94B), s.79 and s.72A conditions and Income-tax Act 2025 equivalents; Taxation Laws (Amendment) Act 2021
6. Equalisation levy abolition; India-US DTAA royalty rate and domestic rate; India-Mauritius/Singapore grandfathering

---

# Module 24: Regulators and Institutions

### [24.1] India's Financial Regulatory Architecture: Who Regulates What
<!-- tags: domain=regulators-institutions; level=foundation; roles=Fintech-PM,Consulting,CF,IB,Audit; keywords=financial regulators India, RBI, SEBI, IRDAI, PFRDA, IFSCA, MCA, NFRA, CCI, IBBI, FSDC, FIU-IND, Ministry of Finance, regulatory perimeter -->

**Definition.** India's financial system is regulated by several sector-specific regulators under the Ministry of Finance and other ministries, coordinated through the Financial Stability and Development Council (FSDC).

**Why it matters.** Every finance and fintech role interacts with regulators. Knowing who regulates which activity, and which regulator to approach for approvals, is basic professional knowledge and frequently tested in fintech and consulting interviews.

**Core mechanics.**

| Regulator / body | Domain | Key powers and examples |
|---|---|---|
| Reserve Bank of India (RBI) | Monetary policy, banks, NBFCs, payments, forex, government debt, money markets | Licensing banks, NBFCs, PAs, PPIs; prudential norms; FEMA administration |
| Securities and Exchange Board of India (SEBI) | Securities markets, intermediaries, listed companies, mutual funds, AIFs | ICDR, LODR, SAST, insider trading, MF and AIF regulations |
| Insurance Regulatory and Development Authority of India (IRDAI) | Insurers and insurance intermediaries | Licensing, solvency, product approval, distribution rules |
| Pension Fund Regulatory and Development Authority (PFRDA) | National Pension System, Atal Pension Yojana | Pension fund managers, points of presence |
| International Financial Services Centres Authority (IFSCA) | GIFT City IFSC | Unified regulator for banking, capital markets, insurance and funds in the IFSC |
| Ministry of Corporate Affairs (MCA) | Companies Act, LLPs | Company law, accounting standards notification, ROC |
| National Financial Reporting Authority (NFRA) | Audit quality of listed and large companies | Inspections, investigations, penalties on auditors |
| Insolvency and Bankruptcy Board of India (IBBI) | IBC ecosystem | Insolvency professionals, information utilities, regulations |
| Competition Commission of India (CCI) | Competition law, merger control | Combination approvals, anti-competitive conduct (including digital markets) |
| Financial Intelligence Unit-India (FIU-IND) | Anti-money laundering | Receives suspicious transaction reports under PMLA |
| National Housing Bank (NHB) | Housing finance | Supervision of HFCs (regulation moved to RBI in 2019) |
| NABARD, SIDBI, EXIM Bank | Development finance | Refinance, supervision of RRBs and cooperative banks (NABARD) |
| FSDC | Inter-regulatory coordination | Chaired by the Finance Minister |

*Regulatory perimeter by activity:* the licence and regulator depend on the activity, not the company's label (see [21.10]).

**Worked example: a fintech super-app's regulators.** A super-app offering UPI payments, wallets, personal loans, mutual funds, stock broking and insurance would deal with:
- RBI and NPCI: UPI (as TPAP via PSP banks), PPI licence, lending via NBFC or LSP partnerships, payment aggregator licence for merchant payments
- SEBI and AMFI: stock broking and DP, mutual fund distribution or advisory, research analyst rules
- IRDAI: corporate agency or broking licence for insurance
- Plus MCA (company law), FIU-IND (AML reporting), CERT-In and MeitY (cyber and data protection), and state laws (shops, labour)

**Indian context.** Proposals to unify or rationalise financial regulation (e.g., the Financial Sector Legislative Reforms Commission recommendations, 2013) have been implemented only partially; IFSCA (2020) is the main example of a unified regulator [VERIFY: current status of regulatory consolidation proposals].

**Common mistakes.**
- Assuming RBI regulates mutual funds or that SEBI regulates NBFCs.
- Forgetting that NPCI is an operator, not a statutory regulator (it operates under RBI's oversight).
- Ignoring state-level regulation (e.g., money lending acts, stamp duty).

**Interview angle.**
1. *Who regulates what in Indian finance?* RBI (banking, NBFCs, payments, forex, money markets), SEBI (securities markets, MFs, AIFs, listed companies), IRDAI (insurance), PFRDA (pensions), IFSCA (GIFT City), with MCA, NFRA, CCI and IBBI for company law, audit, competition and insolvency.
2. *Is NPCI a regulator?* No; it's an RBI-authorised operator of retail payment systems, though its rules (e.g., UPI market share cap) shape the industry.
3. *Why do fintechs need multiple licences?* Because Indian regulation is activity-based: each financial activity (payments, lending, investments, insurance) has its own regulator and licence.

**Related topics:** [21.10] Fintech regulation, [24.2] RBI, [24.3] SEBI.

---

### [24.2] The Reserve Bank of India: Functions, Instruments and Governance
<!-- tags: domain=regulators-institutions; level=foundation; roles=Fintech-PM,Consulting,ER,CF; keywords=RBI functions, monetary authority, monetary policy committee, banker to government, debt manager, currency management, regulator and supervisor, payment systems, FEMA, financial inclusion, RBI dividend -->

**Definition.** The Reserve Bank of India (RBI), established in 1935 under the RBI Act 1934, is India's central bank. It conducts monetary policy, regulates and supervises banks, NBFCs and payment systems, manages foreign exchange and government debt, and issues currency.

**Why it matters.** RBI decisions on rates, liquidity and regulation move every financial market and determine what fintechs and lenders can do.

**Core mechanics.**

| Function | Details |
|---|---|
| Monetary authority | Flexible inflation targeting (CPI 4% ± 2%); Monetary Policy Committee (6 members: 3 RBI, 3 external) sets the policy repo rate |
| Regulator and supervisor | Banks (under the Banking Regulation Act), NBFCs (RBI Act), cooperative banks (with dual control), ARCs, CICs |
| Payment systems | Regulator under the PSS Act; operates RTGS and NEFT; authorises PAs, PPIs, card networks, NPCI |
| Foreign exchange | Administers FEMA; manages forex reserves and intervenes in FX markets |
| Debt manager | Manages central and state government borrowing; issues G-secs and T-bills |
| Banker to government and banks | Maintains accounts; lender of last resort |
| Currency management | Issues banknotes (the government issues coins); digital rupee (e₹) pilots |
| Developmental role | Financial inclusion, priority sector lending, credit to MSMEs and agriculture |

*Key instruments:* repo and reverse repo, standing deposit facility (SDF), marginal standing facility (MSF), CRR, SLR, open market operations, variable rate repo/reverse repo auctions, FX swaps, macroprudential tools (risk weights, LTV caps).

*Supervisory tools:* on-site inspections and off-site surveillance, prompt corrective action (PCA) framework for weak banks, supervisory action frameworks for NBFCs and cooperative banks, penalties and business restrictions.

*RBI's balance sheet and surplus transfer:* RBI transfers surplus income to the government annually under the economic capital framework (Bimal Jalan Committee, 2019) [VERIFY: latest RBI surplus transfer and contingency risk buffer range].

**Worked example: policy rate corridor (illustrative).** If the repo rate is 5.50%, the SDF (floor) is 5.25% and the MSF (ceiling) is 5.75%. When system liquidity is in surplus, the overnight weighted average call rate tends toward the SDF; when in deficit, toward the repo or MSF. RBI's operating target is to keep the call rate close to the repo rate through liquidity operations.

[VERIFY: current repo, SDF and MSF rates]

**Indian context.** RBI's Governor heads the MPC; recent years have seen RBI consolidate regulations into Master Directions, introduce the scale-based framework for NBFCs, the digital lending directions, and the expected credit loss transition [VERIFY: latest RBI Statement on Developmental and Regulatory Policies].

**Common mistakes.**
- Saying RBI sets interest rates directly for all loans (it sets the policy rate; banks price loans off benchmarks and spreads).
- Confusing the RBI's inflation target with its forecast.
- Ignoring RBI's role as government debt manager when analysing bond markets.

**Interview angle.**
1. *What are RBI's main functions?* Monetary policy, regulation and supervision of banks, NBFCs and payments, foreign exchange management, government debt management, currency issuance and developmental functions.
2. *What is the MPC?* A six-member committee (three RBI, three external) that sets the repo rate to achieve the CPI inflation target of 4% within a 2–6% band.
3. *What is prompt corrective action?* A supervisory framework imposing restrictions (on lending, dividends, branch expansion) on banks breaching thresholds for capital, asset quality or leverage.

**Related topics:** [25.2] Monetary policy, [19.1] Banking, [21.2] Payment systems.

---

### [24.3] SEBI: Mandate, Key Regulations and Enforcement
<!-- tags: domain=regulators-institutions; level=foundation; roles=IB,ER,Fintech-PM,CF,PE; keywords=SEBI, ICDR, LODR, SAST, insider trading regulations, PIT, UPSI, trading window, mutual fund regulations, AIF regulations, intermediaries, SAT, settlement, consent order, investor protection -->

**Definition.** The Securities and Exchange Board of India (SEBI), a statutory body under the SEBI Act 1992, regulates the securities market to protect investors, develop the market and regulate intermediaries.

**Why it matters.** SEBI regulations govern IPOs, listed company disclosures, takeovers, insider trading, mutual funds, brokers and advisers, so they affect IB, ER, PE, wealthtech and corporate finance roles.

**Core mechanics.**

| Regulation | Covers |
|---|---|
| ICDR 2018 | Public issues, rights, preferential allotments, QIPs |
| LODR 2015 | Listed company obligations: disclosures, governance, related-party transactions, results |
| SAST 2011 | Takeovers and open offers |
| PIT 2015 | Prohibition of insider trading |
| Mutual Funds 1996 | AMCs, schemes, categorisation, expenses |
| AIF 2012 | Alternative investment funds |
| Delisting 2021 | Delisting of equity shares |
| Buy-back 2018 | Share buybacks |
| Intermediaries (brokers, DPs, RTAs, merchant bankers, IAs, RAs, CRAs, PMS) | Registration, conduct, capital |
| FPI 2019 | Foreign portfolio investors |

*Insider trading (PIT) essentials:*
- **Unpublished price sensitive information (UPSI):** information not generally available that is likely to materially affect the share price (results, dividends, M&A, capital changes, management changes)
- Insiders and connected persons cannot trade while in possession of UPSI
- **Trading window** closure for designated persons from the end of the quarter until 48 hours after results
- Pre-clearance of trades above thresholds; contra-trade restriction (6 months); trading plans allowed
- Structured digital database of UPSI sharing; disclosures of trades by promoters and designated persons

*Enforcement:* investigations, orders (disgorgement, bans, penalties), settlement proceedings, prosecution; appeals to the Securities Appellate Tribunal (SAT), then the Supreme Court.

**Worked example: insider trading check.** A company's CFO knows on 5 April that Q4 profits will beat estimates by 40%; results will be announced on 25 April. The CFO's spouse buys shares on 10 April.
- The CFO is a designated person; the information is UPSI; the trading window is closed from 1 April until 48 hours after the 25 April announcement
- The spouse is an immediate relative (a connected person); the trade violates PIT; SEBI can order disgorgement of gains, impose penalties and debar
- Permitted alternative: a pre-disclosed, SEBI-compliant trading plan set up well in advance

[VERIFY: SEBI PIT Regulations as amended (including trading plan rules 2024–25)]

**Indian context.** SEBI has increasingly used data analytics for surveillance (e.g., front-running, pump-and-dump via social media), regulated finfluencers, and expanded disclosure rules (e.g., verification of market rumours by top listed companies) [VERIFY: SEBI rumour verification requirement and finfluencer circulars].

**Common mistakes.**
- Thinking insider trading rules apply only to directors (they cover connected persons and anyone with UPSI).
- Confusing LODR (ongoing obligations) with ICDR (issuance).
- Ignoring that SEBI regulates intermediaries' conduct, not just listed companies.

**Interview angle.**
1. *What is UPSI?* Unpublished information likely to materially affect a security's price, such as results, M&A or dividends; insiders can't trade on it.
2. *What does LODR require of listed companies?* Timely disclosure of material events, quarterly results, governance standards (independent directors, committees), related-party transaction approvals and shareholding disclosures.
3. *Where do appeals against SEBI orders go?* To the Securities Appellate Tribunal, then the Supreme Court.

**Related topics:** [13.3] IPO process, [12.6] SAST, [15.1] Equity markets.

---

### [24.4] Insurance and Pension Regulation: IRDAI and PFRDA
<!-- tags: domain=regulators-institutions; level=intermediate; roles=Fintech-PM,Consulting,ER; keywords=IRDAI, insurance regulation, solvency ratio, expense of management, insurance distribution, bancassurance, PFRDA, NPS, pension funds, annuity, Atal Pension Yojana, insurance penetration -->

**Definition.** IRDAI regulates insurers and insurance intermediaries under the Insurance Act 1938 and the IRDA Act 1999. PFRDA regulates the National Pension System (NPS) and other pension schemes under the PFRDA Act 2013.

**Why it matters.** Insurance and pensions are large, underpenetrated long-term savings and protection markets in India; insurtech and wealthtech products depend on these regulators' distribution and product rules.

**Core mechanics.**

*Insurance (IRDAI):*
- **Insurer types:** life, general (non-life), health (standalone), reinsurers; public and private players
- **Solvency:** insurers must maintain a solvency ratio (available solvency margin / required solvency margin) of at least **150%**; India is moving toward risk-based capital [VERIFY: IRDAI risk-based capital roadmap]
- **Expense of management (EoM):** overall caps on expenses including commissions, replacing line-by-line commission caps (2023)
- **Distribution:** individual agents, corporate agents (banks: bancassurance), brokers, web aggregators, insurance marketing firms; open architecture allowing tie-ups with multiple insurers
- **Product regulation:** file-and-use / use-and-file regimes; standard products (e.g., Saral Jeevan Bima, Arogya Sanjeevani)
- **Policyholder protection:** free-look period, claims settlement timelines, ombudsman
- **Key metrics:** for life insurers, new business premium, VNB margin, persistency, embedded value; for general insurers, gross written premium, combined ratio (loss ratio + expense ratio), solvency

*Pensions (PFRDA):*
- **NPS:** defined-contribution scheme with Tier I (pension, restricted withdrawals) and Tier II (voluntary savings) accounts; choice of pension fund manager and asset allocation (active or auto/lifecycle choice); partial annuitisation at exit
- **Unified Pension Scheme (UPS)** for central government employees from April 2025, with assured payouts [VERIFY: UPS details and PFRDA regulations]
- **Atal Pension Yojana:** guaranteed pension for unorganised sector workers
- **Employees' Provident Fund (EPFO)** is under the Ministry of Labour, not PFRDA

**Worked example: general insurer combined ratio.** Net earned premium ₹10,000 Cr; claims incurred ₹7,500 Cr; operating expenses and commissions ₹2,800 Cr.
- Loss ratio = 75%; expense ratio = 28%; **combined ratio = 103%** → underwriting loss of ₹300 Cr
- Investment income on float (say ₹1,200 Cr) turns this into an overall profit; general insurers often run combined ratios above 100% and earn profits from investment income.

**Indian context.** India's insurance penetration (premiums / GDP) is around 4% and density is low compared with developed markets [VERIFY: IRDAI annual report penetration data]. The government and IRDAI aim for "Insurance for All by 2047", and Bima Sugam is planned as a unified insurance platform [VERIFY: Bima Sugam status]. Budget 2025 proposed raising the FDI limit in insurance companies to 100% [VERIFY: enactment status].

**Common mistakes.**
- Treating insurance products (endowment, ULIP) as equivalent to investment products without considering costs and protection.
- Ignoring persistency (renewal) as a driver of life insurer profitability.
- Confusing EPFO (labour ministry) with NPS (PFRDA).

**Interview angle.**
1. *What does a combined ratio above 100% mean?* The insurer pays more in claims and expenses than it earns in premiums; it relies on investment income for profit.
2. *What's the solvency ratio requirement for Indian insurers?* At least 150% of the required solvency margin.
3. *Why is insurance underpenetrated in India and what could fintech do?* Low awareness, trust issues, complex products and distribution costs; fintech can offer simple, embedded, low-premium products, easier claims and transparent comparison.

**Related topics:** [10.10] Valuing insurers, [21.9] Insurtech, [18.8] Wealth management.

---

### [24.5] Corporate, Audit, Competition and Insolvency Institutions: MCA, ICAI, NFRA, CCI, IBBI and IFSCA
<!-- tags: domain=regulators-institutions; level=intermediate; roles=Audit,IB,CF,Consulting,PE; keywords=MCA, ROC, MCA21, ICAI, NFRA, CCI, merger control, digital competition, IBBI, insolvency professionals, IFSCA, GIFT City, NCLT, NCLAT -->

**Definition.** Beyond financial sector regulators, a set of institutions governs company law (MCA), accounting and auditing standards and professional regulation (ICAI, NFRA), competition (CCI), insolvency (IBBI, NCLT) and the international financial services centre (IFSCA).

**Why it matters.** M&A, audit, restructuring and fundraising all touch these bodies. Interviewers expect candidates to know which approvals and filings are needed for common corporate actions.

**Core mechanics.**

| Institution | Role | Common interactions |
|---|---|---|
| MCA and Registrar of Companies (ROC) | Administers the Companies Act; company registration and filings (MCA21 portal) | Incorporation, annual filings, charge registration, schemes |
| NCLT / NCLAT | Tribunals for company law and IBC matters (NCLAT for appeals) | Mergers and demergers, oppression and mismanagement, insolvency |
| ICAI | Professional body for chartered accountants; issues standards (accounting, auditing) and disciplines members | Standards, auditor conduct (outside NFRA's domain) |
| NFRA | Oversees audits of listed and large companies | Audit quality reviews, investigations, penalties |
| ICSI, ICMAI | Professional bodies for company secretaries and cost accountants | Secretarial audit, cost audit |
| CCI | Enforces the Competition Act: anti-competitive agreements, abuse of dominance, merger control | Combination filings, dominance investigations (including Big Tech) |
| IBBI | Regulates insolvency professionals, agencies, information utilities, valuers | IBC process regulations |
| IFSCA | Unified regulator for GIFT City IFSC | Funds, banks, insurers, exchanges, fintech in the IFSC |

*Selected processes:*
- **Merger in India (scheme):** board approval → stock exchange and SEBI observations (listed) → NCLT application → shareholder and creditor meetings → objections from regional director, ROC, official liquidator, income tax → NCLT sanction → filing with ROC
- **CCI merger control:** notify combinations above thresholds (asset, turnover or deal value) before closing; Phase I review (prima facie opinion) within statutory timelines; green channel route for deals without overlaps [VERIFY: CCI Combination Regulations 2024 timelines and green channel]
- **Digital competition:** CCI has acted against digital platforms (e.g., Android, Play Store billing); a proposed Digital Competition Bill (ex-ante rules) was under consultation [VERIFY: status of Digital Competition Bill]

**Worked example: approvals map for a listed company acquiring a private target with a share swap merger.**
- Board approvals (both companies); valuation report by registered valuer and fairness opinion by merchant banker
- Stock exchange and SEBI observation letter
- CCI approval if thresholds are crossed
- NCLT sanction (sections 230–232) after shareholder and creditor meetings
- Sector approvals (e.g., RBI if an NBFC is involved)
- Typical timeline: 6–12 months

**Indian context.** NFRA was established in 2018 after high-profile audit failures and has issued orders against auditors of large companies [VERIFY: NFRA orders]. GIFT City IFSC hosts international banking units, funds, exchanges (NSE IX, India INX) and is the venue for direct listing of Indian companies abroad and of foreign currency bonds [VERIFY: IFSCA direct listing framework].

**Common mistakes.**
- Assuming CCI approval is needed only for very large deals (deal value threshold catches some smaller-turnover targets).
- Underestimating NCLT timelines.
- Confusing ICAI's and NFRA's jurisdictions.

**Interview angle.**
1. *What approvals does a merger of two listed Indian companies need?* Boards, valuation and fairness opinions, stock exchange and SEBI observation, CCI if thresholds are met, shareholders and creditors, NCLT sanction, and sector regulators where relevant.
2. *What does NFRA do?* Oversees audit quality for listed and large companies, investigates professional misconduct, and recommends accounting and auditing standards.
3. *What is IFSCA?* The unified regulator for financial services in GIFT City's international financial services centre.

**Related topics:** [12.6] M&A regulation, [6.9] Auditor regulation, [19.9] IBC.

---

### [24.6] Market Infrastructure Institutions and Financial Utilities
<!-- tags: domain=regulators-institutions; level=foundation; roles=Fintech-PM,ER,Consulting,IB; keywords=market infrastructure institutions, stock exchanges, clearing corporations, depositories, CCIL, NPCI, credit information companies, credit rating agencies, KYC registration agencies, FBIL, AMFI, information utilities -->

**Definition.** Market infrastructure institutions (MIIs) and financial utilities provide the shared plumbing of the financial system: exchanges, clearing corporations, depositories, payment system operators, credit bureaus, rating agencies, benchmark administrators and KYC registries.

**Why it matters.** Fintech products integrate with these utilities through APIs and data feeds; their rules and outages directly affect user experience and compliance.

**Core mechanics.**

| Utility | Examples | Function | Regulator |
|---|---|---|---|
| Stock exchanges | NSE, BSE, MSE; MCX, NCDEX (commodities) | Trading platforms | SEBI |
| Clearing corporations | NSE Clearing, ICCL, MCXCCL | Central counterparty, margins, settlement | SEBI |
| Depositories | NSDL, CDSL | Demat holdings and transfers | SEBI |
| Fixed income and FX infrastructure | CCIL (clearing for G-secs, repo, FX); NDS-OM; FX-Retail | Central counterparty for debt and FX | RBI |
| Payment operators | NPCI (UPI, IMPS, RuPay, NACH, AePS, NETC); card networks | Retail payment systems | RBI |
| Credit information companies | TransUnion CIBIL, Experian, Equifax, CRIF High Mark | Credit reports and scores | RBI |
| Credit rating agencies | CRISIL, ICRA, CARE, India Ratings, Acuité, Brickwork, Infomerics | Ratings of debt instruments | SEBI (and RBI recognition for bank capital) |
| Benchmark administrator | FBIL | MIBOR, FX reference rates, G-sec valuation | RBI |
| KYC registries | CKYCR (CERSAI); KRAs (KYC registration agencies for securities) | Central KYC records | Government / SEBI |
| Industry bodies | AMFI (mutual funds), FIMMDA, FEDAI, IBA, Sahamati, payments councils | Standards and self-regulation | Various |
| Information utilities | NeSL | Debt and default records for IBC | IBBI |

*MII governance:* SEBI requires public interest directors, ownership caps, ring-fencing of critical operations and technology resilience standards for exchanges, clearing corporations and depositories [VERIFY: SEBI SECC Regulations 2018 and MII governance circulars].

**Worked example: tracing a mutual fund SIP.** An investor's ₹5,000 SIP on a wealth app:
- KYC verified via KRA/CKYCR
- NACH or UPI AutoPay mandate debits the bank account (NPCI)
- Order routed via the exchange MF platform (BSE StAR MF or NSE NMF II) or directly to the RTA (CAMS, KFintech)
- RTA allots units at the applicable NAV; units appear in the statement (and in demat if opted)
- AMFI standards govern distributor codes and disclosures

**Indian context.** Outages or technical glitches at MIIs (e.g., exchange halts) have led SEBI to require business continuity plans and standard operating procedures, including switching to a disaster recovery site within set times [VERIFY: SEBI BCP-DR framework for MIIs].

**Common mistakes.**
- Confusing RTAs (CAMS, KFintech) with depositories.
- Assuming credit scores are regulated by SEBI (credit information companies are RBI-regulated; rating agencies are SEBI-regulated).
- Overlooking dependency on MIIs in product uptime planning.

**Interview angle.**
1. *What's the difference between a credit bureau and a credit rating agency?* Bureaus collect repayment data on individuals and businesses and provide credit reports and scores (RBI); rating agencies rate debt instruments and issuers (SEBI).
2. *What does CCIL do?* It acts as central counterparty for government securities, repo and forex transactions, reducing settlement risk.
3. *How does a SIP flow through India's infrastructure?* KYC through KRAs, mandate via NACH or UPI AutoPay, order via exchange platforms or RTAs, NAV-based allotment by the RTA.

**Related topics:** [15.1] Market structure, [21.2] Payment systems, [16.7] Debt market infrastructure.

---

### [24.7] Global Institutions and Standard Setters
<!-- tags: domain=regulators-institutions; level=foundation; roles=Consulting,IB,ER,CF; keywords=BIS, Basel Committee, FSB, IOSCO, IAIS, IASB, ISSB, IMF, World Bank, FATF, Federal Reserve, SEC, ECB, G20, CPMI -->

**Definition.** Global institutions and standard-setting bodies coordinate international financial regulation and stability, and their standards are implemented by national regulators such as RBI and SEBI.

**Why it matters.** Basel III, IFRS, FATF ratings and IMF assessments shape Indian rules; global central banks (especially the US Federal Reserve) drive capital flows into India.

**Core mechanics.**

| Body | Role | Indian relevance |
|---|---|---|
| Bank for International Settlements (BIS) | Central banks' bank; hosts committees | RBI is a member |
| Basel Committee on Banking Supervision (BCBS) | Bank capital and liquidity standards (Basel III) | RBI implements Basel III |
| Committee on Payments and Market Infrastructures (CPMI) | Payment and settlement standards (PFMI) | Applies to NPCI, CCIL, clearing corporations |
| Financial Stability Board (FSB) | Coordinates global financial regulation (G20 mandate) | India is a member |
| IOSCO | Securities regulation standards | SEBI is a member |
| IAIS | Insurance supervision standards | IRDAI is a member |
| IASB / ISSB (IFRS Foundation) | Accounting and sustainability disclosure standards | Ind AS converged with IFRS; BRSR alignment |
| International Monetary Fund (IMF) | Macroeconomic surveillance, lending, FSAP assessments | Article IV reviews of India |
| World Bank | Development finance | Projects and data |
| Financial Action Task Force (FATF) | AML/CFT standards and mutual evaluations | India's 2024 mutual evaluation outcome ("regular follow-up") [VERIFY: FATF India evaluation 2024] |
| US Federal Reserve, SEC; ECB; others | Major national and regional regulators | Fed policy drives global rates, dollar strength and FPI flows |

**Worked example: how Fed policy reaches Indian markets.** The Fed raises rates by 100 bps over a few months while RBI holds.
- The interest differential narrows; dollar strengthens; FPIs may sell Indian bonds and equities
- The rupee weakens; RBI may sell dollars from reserves, tightening domestic liquidity
- Indian bond yields may rise despite unchanged RBI policy; equity valuations (especially growth stocks) may compress
- This is why Indian markets react to US data and Fed meetings even when domestic fundamentals are unchanged.

**Indian context.** India is part of the G20, FSB, BCBS and FATF; Indian standards are often adapted to local conditions (e.g., higher CRAR minimums than Basel, Ind AS carve-outs) [VERIFY: RBI Basel III adaptations].

**Common mistakes.**
- Assuming global standards apply automatically (they must be adopted by national regulators).
- Ignoring global spillovers when analysing Indian rates and the rupee.

**Interview angle.**
1. *What is the Basel Committee and why does it matter for Indian banks?* It sets global bank capital and liquidity standards; RBI implements them (often more strictly), determining how much capital Indian banks hold.
2. *Why does a Fed rate hike affect Indian markets?* It changes global interest differentials and risk appetite, driving FPI flows, the rupee and Indian yields.
3. *What does FATF do?* Sets anti-money laundering and counter-terrorist financing standards and evaluates countries; poor ratings can raise the cost of cross-border finance.

**Related topics:** [19.4] Basel III, [22.4] Capital flows, [25.7] Global macro.

---

## Module 24 Glossary

| Term | Definition |
|---|---|
| CCI | Competition Commission of India |
| CCIL | Clearing Corporation of India Ltd (debt, repo, FX) |
| Combined ratio | Loss ratio + expense ratio for general insurers |
| FATF | Financial Action Task Force (AML/CFT standards) |
| FSDC | Financial Stability and Development Council |
| IBBI | Insolvency and Bankruptcy Board of India |
| IFSCA | Regulator for GIFT City IFSC |
| IRDAI | Insurance regulator |
| LODR | SEBI Listing Obligations and Disclosure Requirements |
| MII | Market infrastructure institution |
| MPC | RBI Monetary Policy Committee |
| NFRA | National Financial Reporting Authority |
| PFRDA | Pension regulator (NPS) |
| SAT | Securities Appellate Tribunal |
| UPSI | Unpublished price sensitive information |

## Module 24 Rapid-Fire Quiz

1. Which regulator licenses payment aggregators? **RBI**
2. Which regulator governs mutual funds? **SEBI**
3. Minimum solvency ratio for Indian insurers? **150%**
4. Number of MPC members? **Six**
5. Appeals against SEBI orders go first to? **Securities Appellate Tribunal**
6. Who regulates credit information companies? **RBI**
7. Who regulates credit rating agencies? **SEBI**
8. Loss ratio 70%, expense ratio 25%: combined ratio? **95%**
9. Unified regulator for GIFT City? **IFSCA**
10. Is EPFO regulated by PFRDA? **No (Ministry of Labour)**

## Module 24 [VERIFY] Items

1. Regulatory consolidation proposals status
2. RBI surplus transfer and risk buffer; current repo, SDF and MSF rates; latest RBI developmental and regulatory statement
3. SEBI PIT amendments (trading plans); rumour verification; finfluencer circulars
4. IRDAI risk-based capital roadmap; UPS details; insurance penetration; Bima Sugam; insurance FDI limit enactment
5. CCI Combination Regulations 2024; Digital Competition Bill status; NFRA orders; IFSCA direct listing framework
6. SEBI SECC Regulations and MII governance; BCP-DR framework
7. FATF India evaluation 2024; RBI Basel III adaptations

---

# Module 25: Macroeconomics for Finance

### [25.1] GDP, National Accounts and Growth
<!-- tags: domain=macroeconomics; level=foundation; roles=Consulting,ER,IB,Fintech-PM,CF; keywords=GDP, GVA, nominal GDP, real GDP, GDP deflator, expenditure approach, consumption, investment, government spending, net exports, potential growth, output gap, MoSPI -->

**Definition.** Gross domestic product (GDP) is the market value of all final goods and services produced within a country in a period. Nominal GDP uses current prices; real GDP adjusts for inflation. Gross value added (GVA) measures output by sector (GDP = GVA + product taxes − product subsidies).

**Why it matters.** GDP growth drives corporate revenues, credit demand and tax collections. Nominal GDP growth anchors long-term growth assumptions in valuations, and investors use GDP composition to understand demand.

**Core mechanics.**
- **Expenditure approach:** GDP = C (private consumption) + I (investment, gross fixed capital formation and inventories) + G (government consumption) + (X − M) (net exports)
- **Real vs nominal:** Real growth ≈ Nominal growth − Inflation (GDP deflator); exact: (1 + nominal) / (1 + deflator) − 1
- **Potential growth and output gap:** potential output is what the economy can produce without accelerating inflation; the output gap = actual − potential (positive gaps tend to raise inflation)
- **Growth drivers (long run):** labour force growth, capital accumulation, productivity (technology, institutions); demographic dividend matters for India
- **Per capita GDP** and purchasing power parity (PPP) comparisons for living standards
- **Data quality and revisions:** advance estimates, revisions and base-year changes

**Worked example.** Nominal GDP grows 10% and the GDP deflator is 4%.
- Real growth = 1.10 / 1.04 − 1 = **5.8%** (approximation: 6%)
- For a DCF, a mature company's terminal nominal INR growth near nominal GDP growth would be about 10%, but most practitioners use a lower rate (e.g., 5–6%) because individual companies rarely keep pace with the whole economy forever and long-run nominal growth may decline.

Composition: if private consumption is about 55–60% of GDP and investment about 30%, consumer demand and capex cycles dominate India's growth narrative [VERIFY: latest MoSPI GDP composition].

**Indian context.** MoSPI's National Statistics Office publishes quarterly GDP about two months after quarter end; India has been among the fastest-growing large economies [VERIFY: latest real GDP growth]. MoSPI has been revising the GDP base year (from 2011-12 to a more recent base) along with CPI and IIP [VERIFY: new GDP base year and release date].

**Common mistakes.**
- Comparing nominal growth in one country with real growth in another.
- Treating GVA and GDP growth as identical (product taxes and subsidies cause gaps).
- Assuming high GDP growth means high equity returns (valuations and profit share matter).

**Interview angle.**
1. *What's the difference between nominal and real GDP?* Nominal is at current prices; real removes inflation using the deflator, measuring volume growth.
2. *Why does nominal GDP growth matter for companies?* Corporate revenues are nominal; aggregate corporate sales tend to grow with nominal GDP over long periods.
3. *What drives India's long-term growth potential?* A large working-age population, rising investment, formalisation and digitisation, infrastructure, and productivity improvements, subject to execution on skills, jobs and institutions.

**Related topics:** [25.3] Inflation, [10.3] Terminal growth, [25.6] Business cycles.

---

### [25.2] Monetary Policy and Transmission
<!-- tags: domain=macroeconomics; level=intermediate; roles=ER,Fintech-PM,Consulting,CF,IB; keywords=monetary policy, inflation targeting, repo rate, liquidity adjustment facility, transmission, Taylor rule, real policy rate, neutral rate, policy stance, open market operations, CRR cut -->

**Definition.** Monetary policy is the central bank's use of interest rates and liquidity to achieve price stability (and support growth). Transmission is how policy changes pass through to market rates, lending and deposit rates, asset prices, the exchange rate and ultimately demand and inflation.

**Why it matters.** Rate cycles drive bank margins, lending growth, bond prices, equity valuations and fintech funding costs. Interviews often ask "what happens when RBI cuts rates?"

**Core mechanics.**
- **Framework:** India's flexible inflation targeting: CPI inflation target of 4% with a tolerance band of 2–6%; the six-member MPC sets the repo rate
- **Policy stance:** accommodative, neutral, or withdrawal of accommodation / tight
- **Instruments:** repo rate, liquidity adjustment facility (SDF floor, MSF ceiling), variable rate repos and reverse repos, open market operations (buying or selling G-secs), CRR changes, FX swaps
- **Transmission channels:**
  1. Interest rate channel: money market rates → bond yields → bank lending and deposit rates (EBLR loans reprice fastest)
  2. Credit channel: bank lending capacity and willingness
  3. Asset price channel: higher bond and equity prices when rates fall (wealth effect)
  4. Exchange rate channel: lower rates can weaken the currency, affecting exports and imported inflation
  5. Expectations channel: credible policy anchors inflation expectations
- **Real policy rate** = Policy rate − Expected inflation; the **neutral rate** neither stimulates nor restrains the economy
- **Taylor rule (illustrative):** Policy rate = r* + π + 0.5 × (π − π*) + 0.5 × Output gap

**Worked example 1: Taylor rule.** Neutral real rate r* = 1.5%; inflation 5%; target 4%; output gap −1%.
- Rate = 1.5 + 5 + 0.5 × 1 + 0.5 × (−1) = **6.5%**
- If inflation falls to 3% with the same gap: 1.5 + 3 − 0.5 − 0.5 = **3.5%**, suggesting room to cut. Real-world central banks use such rules only as guides.

**Worked example 2: real rate.** Repo 5.5%; expected CPI 3% → real rate = 1.055 / 1.03 − 1 = **2.4%**, above a neutral estimate of around 1–1.5%, which signals restrictive policy and room to cut if growth weakens.

**Worked example 3: transmission to a borrower.** RBI cuts the repo by 50 bps. A home loan linked to the repo (EBLR) at repo + 2.75% falls from 8.25% to 7.75% at the next reset; on a ₹50 lakh, 20-year loan, the EMI falls by about ₹1,500 a month (or tenure shortens). Term deposit rates fall more slowly, so bank NIMs compress at first.

**Indian context.** RBI eased policy significantly in 2025 after a tightening cycle in 2022–23, including repo cuts and a phased CRR reduction [VERIFY: current repo rate, stance and CRR; latest MPC decisions]. Liquidity conditions (surplus or deficit) influence how quickly policy changes reach market rates.

**Common mistakes.**
- Assuming rate cuts always boost equities (if cuts reflect a growth scare, earnings may fall).
- Ignoring the lag (12–18 months) between policy changes and inflation outcomes.
- Confusing liquidity measures with rate changes.

**Interview angle.**
1. *What happens when RBI cuts the repo rate?* Short-term rates and bond yields fall, EBLR loans reprice down, borrowing becomes cheaper, bond prices rise, equity valuations may improve, the rupee may soften; banks' NIMs may compress initially.
2. *What is inflation targeting?* A framework where the central bank's main goal is keeping inflation near a numerical target (4% CPI in India) over the medium term.
3. *Why might long-term yields not fall after a rate cut?* High fiscal borrowing, rising inflation expectations, global yields or FPI outflows can keep long rates elevated.

**Related topics:** [24.2] RBI, [16.5] Yield curve, [19.1] Bank margins.

---

### [25.3] Inflation: Measures, Drivers and Effects on Finance
<!-- tags: domain=macroeconomics; level=foundation; roles=ER,Consulting,Fintech-PM,CF; keywords=inflation, CPI, WPI, core inflation, food inflation, headline inflation, demand-pull, cost-push, inflation expectations, real returns, pricing power, input costs -->

**Definition.** Inflation is the sustained rise in the general price level. India tracks consumer price inflation (CPI), the RBI's target measure, and wholesale price inflation (WPI); core inflation excludes volatile food and fuel.

**Why it matters.** Inflation erodes real returns, drives interest rates, shapes corporate margins (input costs vs pricing power) and determines whether valuations expand or contract.

**Core mechanics.**
- **CPI (combined):** consumer basket with a large food weight (food and beverages around 45% in the 2012 base series) [VERIFY: weights in the revised CPI base]
- **WPI:** producer prices, heavier on manufactured goods and commodities
- **Core inflation:** CPI excluding food and fuel; reflects underlying demand pressures
- **Drivers:**
  - Demand-pull: demand exceeding supply capacity
  - Cost-push: input costs (oil, commodities, wages), supply shocks (monsoon, geopolitics)
  - Exchange rate pass-through: a weaker rupee raises import costs
  - Expectations: wage and price setting based on expected inflation
- **Effects on finance:**
  - Higher nominal interest rates and bond yields (Fisher effect)
  - Margin pressure for companies without pricing power; inventory gains for some
  - Real returns: deposit rate − inflation; negative real rates push savers into riskier assets
  - Valuation: higher inflation usually means higher discount rates and lower multiples

**Worked example: real return and pricing power.** Inflation rises from 4% to 6%.
- A fixed deposit at 7% now earns about 0.9% real (1.07 / 1.06 − 1) instead of 2.9%
- A consumer company facing 8% input cost inflation with gross margin 40%: if it can raise prices only 4%, gross margin falls to about (1.04 − 0.6 × 1.08) / 1.04 = **37.7%**; companies with strong brands that pass on costs fully protect margins, which is why pricing power is valued in inflationary periods.

**Indian context.** Food prices (vegetables, pulses, cereals) are the main source of CPI volatility in India; monsoon outcomes and supply management matter [VERIFY: latest CPI inflation and food contribution]. MoSPI has been revising the CPI base year and basket [VERIFY: revised CPI base and release].

**Common mistakes.**
- Using WPI to judge RBI policy (CPI is the target).
- Treating headline swings from food prices as demand-driven inflation.
- Ignoring that moderate inflation helps nominal revenue growth while hurting real returns on cash.

**Interview angle.**
1. *CPI vs WPI?* CPI measures consumer prices (RBI's target); WPI measures wholesale and producer prices; they can diverge, e.g., when commodity prices fall but services inflation persists.
2. *How does inflation affect equity valuations?* Higher inflation raises discount rates and uncertainty, compressing multiples, and can squeeze margins; companies with pricing power fare better.
3. *What's core inflation and why does RBI watch it?* Inflation excluding food and fuel; it signals underlying demand pressures and is less volatile.

**Related topics:** [1.2] Real vs nominal, [25.2] Monetary policy, [25.5] Rates and valuation.

---

### [25.4] Fiscal Policy, Government Debt and the Bond Market
<!-- tags: domain=macroeconomics; level=intermediate; roles=ER,Consulting,CF,IB; keywords=fiscal policy, fiscal deficit, primary deficit, revenue deficit, government debt, debt to GDP, FRBM Act, crowding out, government borrowing programme, debt dynamics, r minus g, capex push, Union Budget -->

**Definition.** Fiscal policy is the government's use of spending, taxation and borrowing to influence the economy. The fiscal deficit is the gap between total expenditure and non-debt receipts, financed mainly by borrowing.

**Why it matters.** Government borrowing affects bond yields, crowds in or out private investment, and drives sectors exposed to public capex (infrastructure, defence, railways). The Union Budget is a major market event.

**Core mechanics.**
- **Fiscal deficit** = Total expenditure − (Revenue receipts + Non-debt capital receipts)
- **Revenue deficit** = Revenue expenditure − Revenue receipts (borrowing to fund current spending)
- **Primary deficit** = Fiscal deficit − Interest payments
- **Debt dynamics:** change in debt-to-GDP ≈ [(r − g) / (1 + g)] × Debt ratio + Primary deficit, where r is the effective nominal interest rate on debt and g is nominal GDP growth. When g > r, debt ratios can fall even with modest primary deficits.
- **Crowding out:** heavy government borrowing can raise yields and reduce private investment; public capex can also crowd in private investment by improving infrastructure.
- **Fiscal rules:** India's FRBM Act sets targets; the central government shifted toward a debt-to-GDP anchor with fiscal deficit glide paths [VERIFY: current fiscal deficit target and debt anchor in the Union Budget].
- **Government borrowing calendar:** RBI conducts G-sec auctions per the borrowing calendar; supply affects yields.

**Worked example: debt dynamics.** General government debt 80% of GDP; effective interest rate 7%; nominal GDP growth 10%; primary deficit 2% of GDP.
- Δ Debt ratio = (0.07 − 0.10) / 1.10 × 80 + 2 = −2.18 + 2 = **−0.18 percentage points**: the debt ratio is roughly stable to slightly falling
- If nominal growth fell to 8%: (−0.01 / 1.08) × 80 + 2 = **+1.26 points** per year: debt rises; growth matters as much as deficits.

**Indian context.** India's central government fiscal deficit was brought down from pandemic highs (about 9% of GDP in FY21) toward a target below 4.5% by FY26, with a shift to a debt-to-GDP target thereafter; general government (centre plus states) debt is around 80% of GDP [VERIFY: Union Budget fiscal numbers and debt targets]. The central government has prioritised capital expenditure in recent budgets [VERIFY: latest capex allocation].

**Common mistakes.**
- Focusing on deficit size without considering spending quality (capex vs revenue spending).
- Ignoring state government borrowing (SDLs) in total supply.
- Assuming high debt is always unsustainable (r − g dynamics matter).

**Interview angle.**
1. *How does the fiscal deficit affect bond yields?* Larger deficits mean more government borrowing, increasing bond supply and pushing yields up, unless offset by demand (banks, insurers, FPIs after index inclusion) or RBI purchases.
2. *What's the difference between fiscal and revenue deficit?* The fiscal deficit is total borrowing need; the revenue deficit is borrowing to fund current (non-capital) spending, a lower-quality deficit.
3. *Which sectors benefit from a public capex push?* Infrastructure construction, capital goods, cement, steel, railways, defence manufacturing, and lenders to these sectors.

**Related topics:** [16.7] G-sec market, [25.2] Monetary policy, [22.4] Twin deficits.

---

### [25.5] From Interest Rates to Valuations: How Macro Moves Asset Prices
<!-- tags: domain=macroeconomics; level=intermediate; roles=ER,IB,PE,Fintech-PM,Consulting; keywords=interest rates and valuation, discount rate, equity duration, growth vs value, P/E sensitivity, bond equity relationship, earnings yield gap, sector sensitivity, rate-sensitive sectors -->

**Definition.** Interest rates affect asset values through discount rates, the cost of capital, earnings (via demand and financing costs) and investor flows. The sensitivity depends on how far into the future an asset's cash flows lie (its duration).

**Why it matters.** "How would rising rates affect this company or sector?" is a common interview question in ER, IB, PE and fintech strategy. A clear framework beats memorised answers.

**Core mechanics.**
- **Discount rate effect:** value = Σ CF / (1 + r)^t; higher r lowers value, more so for distant cash flows
- **Equity duration:** for a Gordon growth stock, % change in value ≈ −1 / (r − g) × Δr; long-duration (high-growth, low current cash flow) stocks are most rate-sensitive
- **Justified P/E** = Payout / (r − g) falls as r rises
- **Earnings effect:** higher rates raise interest costs (leveraged companies), slow demand (rate-sensitive consumption such as housing and autos), and change bank margins
- **Relative value:** equity earnings yield vs bond yield ("yield gap") shapes asset allocation
- **Sector sensitivities (typical):**

| Sector | Effect of rising rates |
|---|---|
| Banks | Often positive for NIMs initially (EBLR assets reprice faster); negative if credit costs rise or bond losses mount |
| NBFCs and fintech lenders | Negative (higher wholesale funding costs) |
| Real estate, autos, consumer durables | Negative (financed purchases) |
| Utilities, infrastructure (high debt, bond-like cash flows) | Negative |
| High-growth tech / new-age companies | Strongly negative (long duration) |
| Insurers | Mixed (higher reinvestment yields vs mark-to-market losses) |
| IT services exporters | Indirect (rates and USD/INR, global demand) |

**Worked example: P/E sensitivity.** Payout 40%, cost of equity 12%, growth 8% → justified P/E = 0.40 / 0.04 = **10x**.
- If the cost of equity rises by 1 point to 13%: P/E = 0.40 / 0.05 = **8x**, a **20% fall**, consistent with equity duration ≈ 1 / (r − g) = 25 → ≈ 25% for small changes (the exact fall is smaller because duration falls as r rises).
- A low-growth utility with r − g = 8% has duration ≈ 12.5, so a 1-point rate rise cuts value about 11–12%.

**Indian context.** Indian new-age tech stocks fell sharply during the 2022 global rate rise, while banks benefited from margin expansion; the reverse partly occurred during the 2025 easing cycle [VERIFY: sector performance data]. Domestic flows (SIPs) have dampened rate-driven volatility relative to the past.

**Common mistakes.**
- Treating all equities as equally rate-sensitive.
- Ignoring that rate changes usually come with changes in growth expectations (the earnings effect can dominate).
- Forgetting currency effects of rate differentials.

**Interview angle.**
1. *Why do growth stocks fall more when rates rise?* More of their value comes from distant cash flows, which are discounted more heavily; they have long equity duration.
2. *How would rising rates affect a lending fintech?* Higher cost of funds squeezes margins unless loan pricing adjusts; demand may slow and credit costs may rise; valuation multiples compress.
3. *If RBI cuts rates, which sectors would you expect to benefit?* Rate-sensitive consumption (housing, autos), NBFCs (lower funding costs), real estate, and long-duration growth stocks; banks may see short-term NIM pressure.

**Related topics:** [10.11] Justified multiples, [16.3] Duration, [25.2] Monetary policy.

---

### [25.6] Business Cycles, Leading Indicators and Reading Macro Data
<!-- tags: domain=macroeconomics; level=intermediate; roles=ER,Consulting,Fintech-PM,CF; keywords=business cycle, leading indicators, coincident indicators, lagging indicators, PMI, IIP, core sector, credit growth, GST collections, auto sales, sector rotation, macro data calendar India -->

**Definition.** The business cycle is the recurring pattern of expansion and contraction in economic activity. Indicators are classified as leading (move before the economy), coincident (move with it) and lagging (move after it).

**Why it matters.** Investors rotate sectors through the cycle; lenders and fintechs adjust credit appetite; strategy cases benefit from a quick read of macro conditions using high-frequency data.

**Core mechanics.**
- **Phases:** recovery → expansion → slowdown → contraction (recession)
- **Leading indicators:** PMIs (manufacturing and services, above 50 = expansion), new orders, credit growth, yield curve slope, equity markets, business and consumer confidence, building permits
- **Coincident indicators:** industrial production (IIP), core sector output (eight core industries), GST collections, e-way bills, electricity demand, retail sales, auto sales
- **Lagging indicators:** unemployment, CPI (core), bank NPAs, corporate capex completions
- **Sector rotation (stylised):**

| Phase | Typically outperforming |
|---|---|
| Early recovery | Banks, autos, consumer discretionary, real estate |
| Mid expansion | Industrials, capital goods, technology |
| Late cycle | Energy, materials, commodities |
| Slowdown / recession | Consumer staples, healthcare, utilities |

**Worked example: building a macro dashboard.** Data for a quarter: manufacturing PMI 57 (strong expansion); bank credit growth 12% y/y (slowing from 16%); GST collections +9% y/y; CPI 3.5%; 10-year G-sec yield falling; auto sales +6%.
- Reading: activity is expanding but credit growth is decelerating; low inflation and falling yields give room for easier policy
- Implications: lenders may compete harder for good borrowers (pricing pressure); rate-sensitive sectors may benefit from easing; watch credit costs in unsecured segments where growth slowed after regulatory tightening

**Indian context.** Key Indian data releases: GDP (quarterly, NSO), CPI (around the 12th of each month), IIP and core sector data (monthly), GST collections (first of the month), PMIs (HSBC/S&P Global, early each month), RBI bank credit data (fortnightly), trade data (monthly), auto sales (first of the month) [VERIFY: current release calendar and data sources].

**Common mistakes.**
- Over-reacting to a single data point.
- Ignoring base effects in year-on-year growth rates.
- Treating indicators as equally reliable (some are heavily revised).

**Interview angle.**
1. *Which indicators would you check to gauge the Indian economy quickly?* GDP and GVA trends, PMIs, GST collections, credit growth, CPI, IIP and core sector, auto sales, and the yield curve.
2. *What's a base effect?* When a year-on-year growth rate is distorted by an unusually low or high value in the same period last year.
3. *How would a lender adjust strategy late in the cycle?* Tighten underwriting in cyclical and unsecured segments, raise provisions, focus on collections and liquidity, and price for rising risk.

**Related topics:** [25.1] GDP, [25.5] Rates and valuation, [20.7] Stress testing.

---

### [25.7] Global Macro: The Dollar, Oil, the Fed and Spillovers to India
<!-- tags: domain=macroeconomics; level=intermediate; roles=ER,Consulting,IB,CF,Fintech-PM; keywords=global macro, US Federal Reserve, dollar index, oil prices, China slowdown, global risk appetite, capital flows, tariffs, supply chains, geopolitics, macro interview framework -->

**Definition.** Global macro factors (US monetary policy, the dollar, oil and commodity prices, China's economy, trade policy and geopolitics) transmit to India through capital flows, trade, commodity prices and sentiment.

**Why it matters.** A credible "macro view" in interviews connects global drivers to Indian rates, the rupee, sectors and companies. These factors also drive cross-border fintech volumes and FPI-sensitive valuations.

**Core mechanics: transmission map.**

| Global driver | Channel to India | Typical effect |
|---|---|---|
| Fed tightening / higher US yields | FPI outflows, stronger dollar | Weaker rupee, higher Indian yields, equity de-rating |
| Oil price spike | Import bill, inflation, fiscal subsidies | Wider CAD, higher CPI, weaker rupee; pressure on OMCs, airlines, paints; positive for upstream oil |
| Global risk-off (crises, wars) | Flows to safe havens | Equity sell-off, rupee weakness, gold up |
| China slowdown / overcapacity | Commodity prices, dumping risk | Lower metal prices; trade defence measures; supply chain diversification opportunity ("China+1") |
| US tariffs and trade policy | Export demand, supply chain shifts | Sector-specific: textiles, gems, auto parts, pharma and IT exposure |
| Strong global growth | Export demand, IT services spending | Positive for exporters and IT |

**Worked example: a structured macro answer.** Question: "Oil rises to US$100 and the Fed signals more hikes. What happens in India?"
1. Trade: India's oil import bill rises → CAD widens
2. Inflation: fuel and transport costs rise → CPI up; RBI likely more hawkish
3. Currency: CAD and FPI outflows → rupee weakens; RBI intervenes from reserves
4. Rates: bond yields rise (global and domestic factors)
5. Fiscal: higher subsidies or excise cuts → fiscal pressure
6. Markets and sectors: equities de-rate; OMCs, airlines, paints, tyres hurt; upstream oil, IT exporters (weaker rupee) relatively helped
7. Policy offsets: RBI liquidity and FX management; government taxes and subsidies

**Indian context.** India's large forex reserves, growing domestic investor base and services exports have improved resilience compared with the 2013 "taper tantrum", when the rupee fell sharply and India was labelled one of the "Fragile Five" [VERIFY: current reserves and external vulnerability indicators]. US tariff actions in 2025 created uncertainty for some Indian export sectors [VERIFY: current India-US trade arrangements and tariff rates].

**Common mistakes.**
- Giving one-directional answers without second-order effects and policy responses.
- Ignoring India's structural shifts (domestic flows, services surplus, reserves).
- Overstating precision in macro forecasts.

**Interview angle.**
1. *What's your view on the Indian economy for the next year?* Structure it: growth drivers, inflation and rates, fiscal position, external balance and the rupee, key risks (global and domestic), and implications for sectors relevant to the role.
2. *How does a strong dollar affect India?* It tends to weaken the rupee, raise import costs and inflation, pressure foreign-currency borrowers, and trigger FPI outflows, while helping exporters.
3. *Why did India fare better in recent global shocks than in 2013?* Larger reserves, lower CAD, inflation targeting credibility, stronger bank balance sheets and steady domestic investor flows.

**Related topics:** [22.4] BoP and capital flows, [24.7] Global institutions, [25.5] Rates and valuation.

---

## Module 25 Glossary

| Term | Definition |
|---|---|
| Base effect | Distortion in y/y growth from last year's unusual level |
| Core inflation | Inflation excluding food and fuel |
| CPI | Consumer price index (RBI's inflation target measure) |
| Fiscal deficit | Total expenditure minus non-debt receipts |
| GDP deflator | Price index converting nominal to real GDP |
| GVA | Gross value added by sector |
| Leading indicator | Indicator that moves before the economy |
| Neutral rate | Policy rate that neither stimulates nor restrains the economy |
| Output gap | Actual minus potential output |
| PMI | Purchasing managers' index (above 50 = expansion) |
| Primary deficit | Fiscal deficit minus interest payments |
| Real policy rate | Policy rate minus expected inflation |
| r − g | Interest rate minus growth rate, key to debt dynamics |
| Taylor rule | Rule of thumb linking policy rates to inflation and output gaps |
| Transmission | Pass-through of policy to market rates and the economy |

## Module 25 Rapid-Fire Quiz

1. Nominal growth 11%, deflator 5%. Real growth (exact)? **≈5.7%**
2. RBI's CPI inflation target? **4% (2–6% band)**
3. Repo 6%, expected inflation 4%. Real rate (approx.)? **About 2%**
4. Fiscal deficit 5.6%, interest 3.6% of GDP. Primary deficit? **2.0% of GDP**
5. Payout 50%, r 12%, g 7%. Justified P/E? **10x**
6. PMI of 48 means? **Contraction**
7. Which stocks fall most when rates rise? **Long-duration growth stocks**
8. Oil spike effect on India's CAD? **Widens**
9. Debt 60% of GDP, r 8%, g 11%, primary balance zero. Change in debt ratio? **≈ −1.6 points**
10. Inflation measure excluding food and fuel? **Core inflation**

## Module 25 [VERIFY] Items

1. MoSPI GDP composition, latest growth and new base year
2. Current repo rate, stance and CRR; latest MPC decisions
3. CPI weights in the revised base; latest CPI and food contribution
4. Union Budget fiscal deficit, debt targets and capex allocation
5. Sector performance across rate cycles
6. Macro data release calendar and sources
7. Forex reserves and external vulnerability indicators; India-US trade and tariff status

---

# Module 26: Master Glossary and Interview Bank

## Master A–Z Glossary

### [26.0.A] Glossary: A
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, A terms -->

| Term | Definition |
|---|---|
| Absorption costing | Product cost includes fixed production overhead |
| Account aggregator | RBI-licensed consent manager for sharing financial data |
| Accretion / dilution | Increase / decrease in acquirer's EPS from a deal |
| Accrual basis | Recording transactions when they occur, not when cash moves |
| Accruals ratio | (Net income − CFO) / Average total assets |
| Accrued interest | Coupon earned since the last payment date |
| Active share | Share of portfolio holdings differing from the benchmark |
| Activity-based costing | Overheads assigned using activity cost drivers |
| Advance tax | Tax paid in instalments during the year |
| Adverse opinion | Statements are materially and pervasively misstated |
| Agency cost | Value lost when agents' interests diverge from principals' |
| AIF | Alternative Investment Fund (SEBI-registered) |
| ALM | Asset-liability management |
| Altman Z-score | Bankruptcy prediction score from five ratios |
| Anchor investor | Institution allocated IPO shares a day before the issue opens |
| Annuity | Equal cash flows at regular intervals for a fixed number of periods |
| Annuity due | Annuity with payments at the start of each period |
| Anti-dilution | Protection adjusting conversion price in down rounds |
| APR | Stated annual interest rate before compounding effects |
| APT | Arbitrage pricing theory: multi-factor pricing from no-arbitrage |
| ARR | Annual recurring revenue |
| ASBA | Application supported by blocked amount |
| AT1 bond | Additional Tier 1 perpetual bank capital bond |
| Audit risk | Risk of an inappropriate opinion on materially misstated statements |

### [26.0.B] Glossary: B
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, B terms -->

| Term | Definition |
|---|---|
| Backtesting | Comparing VaR estimates with actual losses |
| Balance check | Assets minus liabilities minus equity; must be zero |
| Balance of payments | Record of a country's transactions with the rest of the world |
| Base effect | Distortion in y/y growth from last year's unusual level |
| Basis | Spot price minus futures price |
| Beneish M-score | Earnings manipulation likelihood score from eight indices |
| Beta (β) | Sensitivity of an asset's returns to market returns |
| Beta (unlevered) | Business-risk beta with financing effects removed |
| Black-Scholes | Closed-form European option pricing model |
| Book building | Price discovery process using investor bids within a band |
| Bootstrapping | Deriving spot rates from coupon bond prices |
| Break-even point | Volume where total revenue equals total cost |
| BRLM | Book running lead manager |
| BRSR | SEBI-mandated Business Responsibility and Sustainability Report |
| Burn multiple | Net burn / Net new ARR |

### [26.0.C] Glossary: C
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, C terms -->

| Term | Definition |
|---|---|
| CAC | Customer acquisition cost |
| CAC payback | Months of gross profit needed to recover customer acquisition cost |
| Capital employed | Equity plus debt (or total assets minus current liabilities) |
| Capital market line | Efficient portfolios combining the risk-free asset and market portfolio |
| CARO 2020 | Order requiring additional auditor reporting on specific matters |
| Carried interest | GP's share of fund profits (typically 20%) |
| CASA | Current and savings account deposits |
| Cash conversion cycle | DSO + DIO − DPO |
| Cash sweep | Mandatory prepayment of debt from excess cash |
| Catch-up | Tier giving the GP a high share until it reaches its full carry |
| CCI | Competition Commission of India |
| CCIL | Clearing Corporation of India Ltd (debt, repo, FX) |
| CCPS | Compulsorily convertible preference shares |
| CET1 | Common Equity Tier 1 capital |
| CFO / CFI / CFF | Cash from operating / investing / financing activities |
| CIM | Confidential information memorandum |
| CIP | Covered interest parity linking forwards to interest differentials |
| Circuit breaker | Switch that breaks circular calculations |
| Circular reference | Formula that depends on its own result |
| Clearing corporation | Central counterparty guaranteeing trade settlement |
| CoC | Committee of creditors under the IBC |
| CODM | Chief operating decision maker, whose reviews define operating segments |
| Cohort model | Revenue built from customer groups by start date |
| Combined ratio | Loss ratio + expense ratio for general insurers |
| Completion accounts | Price adjusted at closing for actual net debt and working capital |
| Contingency funding plan | Pre-planned actions for liquidity stress |
| Contingent liability | Possible obligation disclosed but not recognised |
| Contract liability | Consideration received before revenue is earned (deferred revenue) |
| Contribution margin | Price minus variable cost |
| Contribution margin (C1/C2/C3) | Revenue less variable costs at progressive levels |
| Control | Power over relevant activities, exposure to variable returns, and ability to affect returns |
| Control premium | Price paid above market value for control |
| Convexity | Curvature of the price-yield relationship |
| Core inflation | Inflation excluding food and fuel |
| Cost driver | Factor that causes an activity's cost to change |
| Cost of capital | Return investors require for an investment of given risk; the discount rate |
| Cost of carry | Financing cost minus income from holding the underlying |
| CPI | Consumer price index (RBI's inflation target measure) |
| CRAR | Capital to risk-weighted assets ratio |
| Credit spread | Yield over a risk-free bond of the same maturity |
| Creeping acquisition | Up to 5% a year acquisition by 25–75% holders without an open offer |
| Cross rate | Exchange rate derived from two other rates |
| CRR | Cash reserve ratio held with RBI |
| Current account deficit | Shortfall of exports and income over imports and payments abroad |

### [26.0.D] Glossary: D
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, D terms -->

| Term | Definition |
|---|---|
| Data table | Excel tool recalculating an output over input grids |
| DDM | Dividend discount model |
| Deferred tax liability | Future tax payable from taxable temporary differences |
| Delta | Option price sensitivity to the underlying price |
| Demat account | Electronic account holding securities |
| Demerger | Transfer of a business to a new entity owned by the same shareholders |
| Depository | Institution holding securities electronically (NSDL, CDSL) |
| Depreciation tax shield | t × Depreciation: cash tax saved from depreciation |
| Detection risk | Risk that audit procedures miss a material misstatement |
| DFL | Degree of financial leverage = EBIT / (EBIT − Interest) |
| DII | Domestic institutional investor |
| Disclaimer | No opinion, owing to inability to obtain sufficient evidence |
| Discount factor | 1 / (1 + r)^n; converts a future cash flow to present value |
| DLG / FLDG | Default loss guarantee (capped at 5% of the portfolio) |
| DOL | Degree of operating leverage: contribution / EBIT |
| DPI | Distributions / Paid-in capital |
| Drag-along | Right forcing minority holders to join a sale |
| DRHP / RHP | Draft red herring prospectus / red herring prospectus |
| Driver-based forecast | Forecast built from operational drivers |
| Driver-based model | Model built from operational drivers |
| DSCR | Cash available for debt service / scheduled debt service |
| DTAA | Double taxation avoidance agreement |
| DuPont analysis | Decomposition of ROE into margin, turnover and leverage |
| DV01 | Price change for a 1 bp yield change |

### [26.0.E] Glossary: E
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, E terms -->

| Term | Definition |
|---|---|
| EAD | Exposure at default |
| EAR | Effective annual rate: true annual return after compounding |
| Earn-out | Deferred consideration contingent on future performance |
| EBIT | Earnings before interest and tax |
| EBITDA | Earnings before interest, tax, depreciation and amortisation |
| EBIT-EPS indifference point | EBIT at which two financing plans give equal EPS |
| EBP | Electronic book provider platform for private placements |
| ECB | External commercial borrowing |
| Economic profit | (ROIC − WACC) × Invested capital |
| Efficient frontier | Portfolios with the highest return for each risk level |
| EMH | Efficient market hypothesis |
| Emphasis of matter | Paragraph highlighting a disclosed, fundamental matter without modifying the opinion |
| Enterprise value | Value of operations to all capital providers |
| EOQ | Economic order quantity = √(2DS/H) |
| Equity method | One-line accounting for associates and joint ventures |
| ERP | Equity risk premium |
| ETF | Exchange-traded fund |
| EVA | Economic value added = NOPAT − WACC × Invested capital |
| Exit multiple method | TV = terminal-year metric × multiple |
| Expected credit loss | Probability-weighted estimate of credit losses (PD × LGD × EAD) |
| Expected shortfall | Average loss beyond the VaR threshold |
| Expense ratio (TER) | Annual fund costs as % of assets |

### [26.0.F] Glossary: F
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, F terms -->

| Term | Definition |
|---|---|
| Fair value | Exit price in an orderly transaction between market participants |
| FAST standard | Modelling standard: flexible, appropriate, structured, transparent |
| FATF | Financial Action Task Force (AML/CFT standards) |
| FCFE | Free cash flow to equity |
| FCFF | Free cash flow to firm (unlevered FCF) |
| FEMA | Foreign Exchange Management Act, 1999 |
| Fiscal deficit | Total expenditure minus non-debt receipts |
| Fisher equation | (1 + nominal) = (1 + real) × (1 + inflation) |
| Flexible budget | Budget adjusted to actual activity level |
| FOIR | Fixed obligations to income ratio |
| Football field | Chart comparing valuation ranges by method |
| Forward premium | Excess of forward over spot rate |
| Forward rate | Implied future interest rate |
| FPI | Foreign portfolio investor |
| Fraud triangle | Pressure, opportunity and rationalisation |
| Free cash flow | CFO minus capital expenditure |
| Free float | Shares available for public trading |
| Fresh issue | New shares issued; proceeds go to the company |
| FSDC | Financial Stability and Development Council |
| FVOCI | Measurement at fair value with changes in other comprehensive income |

### [26.0.G] Glossary: G
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, G terms -->

| Term | Definition |
|---|---|
| GAAR | General anti-avoidance rules |
| Gamma | Sensitivity of delta to the underlying price |
| GDP deflator | Price index converting nominal to real GDP |
| Glide path | Planned reduction of equity exposure as a goal nears |
| GMV | Gross merchandise value transacted |
| Goal seek | Finds the input that achieves a target output |
| Goodwill | Price paid above fair value of identifiable net assets in an acquisition |
| Gordon growth model | Value = Next cash flow / (r − g) |
| Grey market premium | Unofficial pre-listing premium; unregulated |
| GST | Goods and services tax |
| GVA | Gross value added by sector |

### [26.0.H] Glossary: H
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, H terms -->

| Term | Definition |
|---|---|
| Hamada equation | βL = βu × [1 + (1 − t) D/E] |
| Hard-code | A typed number rather than a formula |
| Hedge ratio | Size of hedge relative to exposure |
| Holding company discount | Discount applied to stakes held via a parent |
| HQLA | High-quality liquid assets |
| Hurdle rate | Preferred return LPs receive before carry |

### [26.0.I] Glossary: I
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, I terms -->

| Term | Definition |
|---|---|
| IBBI | Insolvency and Bankruptcy Board of India |
| IFRS | International Financial Reporting Standards issued by the IASB |
| IFSCA | Regulator for GIFT City IFSC |
| IGST | Integrated GST on inter-state supplies |
| IMO | Integration management office |
| Impairment | Write-down of an asset whose carrying amount exceeds recoverable amount |
| Implied volatility | Volatility implied by option prices |
| Incremental cash flow | Cash flow that changes because of a decision |
| Ind AS | IFRS-converged Indian Accounting Standards |
| India VIX | Index of expected 30-day Nifty volatility |
| Indirect method | CFO derived from profit by adjusting non-cash items and working capital |
| Information ratio | Active return / Tracking error |
| Input tax credit | Credit for GST paid on inputs |
| Interchange | Fee paid to the card issuer from the MDR |
| Interest coverage | EBIT / Interest expense |
| Interim report | Financial statements for a period shorter than a year |
| Intrinsic value | Value of an option if exercised immediately |
| IPS | Investment policy statement |
| IRDAI | Insurance regulator |
| IRR | Discount rate at which NPV equals zero |

### [26.0.J] Glossary: J
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, J terms -->

| Term | Definition |
|---|---|
| J-curve | Early negative returns before exits |
| Jensen's alpha | Return above the CAPM-predicted return |
| Joint operation | Arrangement giving rights to assets and obligations for liabilities |
| Justified multiple | Multiple derived from fundamentals |

### [26.0.K] Glossary: K
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, K terms -->

| Term | Definition |
|---|---|
| Key audit matter | Most significant matters in the auditor's judgment |
| KFS | Key Fact Statement for loans |
| KRI | Key risk indicator |

### [26.0.L] Glossary: L
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, L terms -->

| Term | Definition |
|---|---|
| LBO | Leveraged buyout |
| LCR | Liquidity coverage ratio |
| Leading indicator | Indicator that moves before the economy |
| League table | Ranking of banks by deal volume |
| Letter of credit | Bank undertaking to pay on compliant documents |
| Level 3 | Fair value based on significant unobservable inputs |
| LGD | Loss given default (1 − recovery rate) |
| LIFO reserve | Difference between FIFO and LIFO inventory values |
| Limited review | Moderate-assurance engagement on interim results |
| Limiting factor | Scarce resource constraining output |
| Liquidation preference | Right to proceeds before common shareholders |
| Locked box | Price fixed at a past balance sheet date with leakage protection |
| LODR | SEBI Listing Obligations and Disclosure Requirements |
| LRS | Liberalised Remittance Scheme |
| LSP | Lending service provider acting for a regulated lender |
| LTCG / STCG | Long-term / short-term capital gains |
| LTM / NTM | Last / next twelve months |
| LTV | Lifetime gross profit from a customer |

### [26.0.M] Glossary: M
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, M terms -->

| Term | Definition |
|---|---|
| M² | Risk-adjusted return scaled to market volatility |
| Macaulay duration | Weighted average time to cash flows |
| Marginal costing | Fixed production overhead treated as a period cost |
| Margin of safety | Share by which sales exceed break-even |
| Mark-to-market | Daily settlement of futures gains and losses |
| MAT | Minimum alternate tax on book profits |
| Materiality | Misstatement size that could influence users' decisions |
| MDR | Merchant discount rate paid by merchants on payments |
| MII | Market infrastructure institution |
| MIRR | IRR variant with an explicit reinvestment rate |
| MM Proposition I | Firm value independent of capital structure (no taxes) |
| Model risk | Losses from flawed or misused models |
| Modified duration | Approximate % price change per 1% yield change |
| MOIC | Multiple on invested capital |
| Monetary unit sampling | Sampling where each rupee is a sampling unit |
| Money-weighted return | IRR of an investor's cash flows (XIRR) |
| MPC | RBI Monetary Policy Committee |

### [26.0.N] Glossary: N
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, N terms -->

| Term | Definition |
|---|---|
| NAV | Net asset value per unit |
| NCI | Non-controlling interest: minority shareholders' share of subsidiaries |
| NDF | Non-deliverable forward settled in a convertible currency |
| Net debt | Borrowings minus cash and liquid investments |
| Net realisable value | Expected selling price less costs to complete and sell |
| Net worth | Total assets minus total liabilities |
| Neutral rate | Policy rate that neither stimulates nor restrains the economy |
| NFRA | National Financial Reporting Authority |
| NIM | Net interest income / Average earning assets |
| Notional | Reference amount for computing swap payments |
| NPA | Loan overdue for more than 90 days |
| NPCI | National Payments Corporation of India |
| NPV | PV of future cash flows minus initial investment |
| NRR | Net revenue retention from the existing customer base |

### [26.0.O] Glossary: O
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, O terms -->

| Term | Definition |
|---|---|
| ODI | Overseas direct investment |
| OFS | Offer for sale by existing shareholders |
| Open interest | Number of outstanding derivative contracts |
| Open offer | Offer to public shareholders triggered by SAST thresholds |
| Operating working capital | Receivables + inventory + other operating assets − payables − other operating liabilities |
| Opportunity cost | Value of the best alternative given up |
| Option pool shuffle | Creating ESOP pool in pre-money, diluting existing holders |
| Other comprehensive income | Gains and losses bypassing profit |
| Output gap | Actual minus potential output |

### [26.0.P] Glossary: P
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, P terms -->

| Term | Definition |
|---|---|
| P/ABV | Price to adjusted book value (net of net NPAs) |
| PAT | Profit after tax |
| Payment aggregator | Entity collecting and settling merchant payments via escrow |
| PCR | Provision coverage ratio: NPA provisions / Gross NPAs |
| PD | Probability of default |
| Pecking order theory | Preference for internal funds, then debt, then equity |
| Performance materiality | Lower threshold used to plan procedures |
| Performance obligation | Distinct promise to transfer a good or service to a customer |
| Permanent establishment | Taxable presence in a source country |
| PFRDA | Pension regulator (NPS) |
| Pillar Two | 15% global minimum tax for large groups |
| Piotroski F-score | Nine-point financial strength score |
| PMI | Purchasing managers' index (above 50 = expansion) |
| Post-money valuation | Pre-money valuation plus new investment |
| PPI | Prepaid payment instrument (wallets, gift cards) |
| PPP | Purchasing power parity |
| Press Note 3 | 2020 rule requiring approval for investments from land-border countries |
| Primary deficit | Fiscal deficit minus interest payments |
| Professional scepticism | Questioning mind and critical assessment of evidence |
| Provision | Liability of uncertain timing or amount, recognised when probable and estimable |
| PSP bank | Bank sponsoring a UPI app and issuing VPAs |
| PTC | Pass-through certificate in securitisation |
| Put-call parity | C − P = S − PV(K) |
| PVM | Price-volume-mix decomposition |

### [26.0.Q] Glossary: Q
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, Q terms -->

| Term | Definition |
|---|---|
| QIB | Qualified institutional buyer |
| QIP | Qualified institutions placement |
| Qualified opinion | "Except for" opinion for material, non-pervasive issues |
| Quality of earnings | Degree to which profits are sustainable and cash-backed |

### [26.0.R] Glossary: R
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, R terms -->

| Term | Definition |
|---|---|
| Real exchange rate | Nominal rate adjusted for relative price levels |
| Real option | Value of managerial flexibility (expand, abandon, delay) |
| Real policy rate | Policy rate minus expected inflation |
| Recoverable amount | Higher of fair value less costs of disposal and value in use |
| Relevant cost | Future incremental cash cost that differs between alternatives |
| Retained earnings | Cumulative profits not distributed as dividends |
| Reverse book building | Price discovery mechanism for delisting in India |
| Reverse stress test | Identifying scenarios that would cause failure |
| Revolver | Revolving credit facility that funds shortfalls |
| r − g | Interest rate minus growth rate, key to debt dynamics |
| Right-of-use asset | Lessee's asset representing the right to use a leased item |
| Risk appetite | Board-approved risk the firm will accept |
| ROIC | NOPAT / Invested capital |
| Roll rate | Share of loans moving to a worse delinquency bucket |
| RONIC | Return on new invested capital |
| RSI | Relative strength index |
| Rule of 40 | Growth % + margin % ≥ 40 |
| Runway | Cash / Net burn (months) |
| RWA | Risk-weighted assets |

### [26.0.S] Glossary: S
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, S terms -->

| Term | Definition |
|---|---|
| SAST | SEBI Substantial Acquisition of Shares and Takeovers Regulations |
| SAT | Securities Appellate Tribunal |
| Scenario switch | Cell selecting the active assumption set |
| Scope 3 | Indirect value-chain greenhouse gas emissions |
| SDL | State development loan |
| Security market line | CAPM relation between beta and required return |
| Segregation of duties | Separating incompatible tasks to prevent and detect fraud |
| Sharpe ratio | Excess return per unit of total risk |
| SLB | Securities lending and borrowing |
| SLR | Statutory liquidity ratio |
| Slump sale | Transfer of an undertaking for a lump sum |
| SMA | Special mention account (early stress bucket) |
| Smart beta | Rules-based factor-tilted investing |
| SOCIE | Statement of changes in equity |
| SOTP | Sum-of-the-parts valuation |
| Sources and uses | Table showing how a deal is funded and where money goes |
| Standalone selling price | Price at which an item would be sold separately |
| Standard cost | Expected cost per unit (standard quantity × standard price) |
| Straddle | Long call and put at the same strike |
| STT | Securities transaction tax |
| Success rate | Successful transactions / attempted transactions |
| Sunk cost | Past, unrecoverable cost; irrelevant to future decisions |
| Surcharge | Additional tax on tax for higher incomes |
| Survival horizon | Time a firm can meet stressed outflows from liquid resources |
| Sustainable growth rate | ROE × retention ratio |
| Synergies | Value from combining businesses beyond standalone values |

### [26.0.T] Glossary: T
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, T terms -->

| Term | Definition |
|---|---|
| T+1 | Settlement one business day after trade |
| Tag-along | Right for minority holders to join a sale on the same terms |
| Take rate | Revenue / GMV |
| Tax shield | Tax saved due to deductible expenses (e.g., interest) |
| Taylor rule | Rule of thumb linking policy rates to inflation and output gaps |
| T-bill | Short-term zero-coupon government security |
| TDS | Tax deducted at source |
| Terminal value | Value of cash flows beyond the forecast period |
| TERP | Theoretical ex-rights price |
| Theta | Option value lost per day from time decay |
| Three lines model | First line owns risk, second oversees, third assures |
| Time-weighted return | Compounded sub-period returns, independent of cash flows |
| Tornado chart | Chart ranking inputs by impact on output |
| Total comprehensive income | Profit plus other comprehensive income |
| TPAP | Third-party UPI application provider |
| Tracking error | Volatility of a fund's return difference from its index |
| Trade-off theory | Optimal debt balances tax shields against distress costs |
| Transfer price | Price for transactions between related units |
| Transmission | Pass-through of policy to market rates and the economy |
| Treasury stock method | Diluted share calculation assuming option proceeds buy back shares |
| TREPS | Tri-party repo (overnight secured money market) |
| Treynor ratio | Excess return per unit of beta |
| TVPI | (Distributions + NAV) / Paid-in capital |

### [26.0.U] Glossary: U
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, U terms -->

| Term | Definition |
|---|---|
| Underpricing | First-day return above issue price |
| UPSI | Unpublished price sensitive information |

### [26.0.V] Glossary: V
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, V terms -->

| Term | Definition |
|---|---|
| VaR | Value at Risk |
| Variance | Difference between actual and standard or budget |
| Vega | Option sensitivity to volatility |
| VPA | Virtual payment address used in UPI |

### [26.0.W] Glossary: W
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, W terms -->

| Term | Definition |
|---|---|
| WACC | Weighted average of after-tax cost of debt and cost of equity |
| Working capital peg | Target NWC level used in completion price adjustments |

### [26.0.X] Glossary: X
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, X terms -->

| Term | Definition |
|---|---|
| XIRR | IRR with exact dates |
| XNPV | NPV with exact dates |

### [26.0.Y] Glossary: Y
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, Y terms -->

| Term | Definition |
|---|---|
| Yield curve | Plot of yields against maturity |
| YTM | Yield to maturity |

### [26.0.Z] Glossary: Z
<!-- tags: domain=glossary; level=foundation; roles=IB,PE,ER,CF,Audit,Fintech-PM,Consulting; keywords=finance glossary, definitions, Z terms -->

| Term | Definition |
|---|---|
| Zero-based budgeting | Budget built from zero with each cost justified |


## Cross-Module Interview Bank (150 Questions)

Each answer is a crisp model answer; topic references point to the full treatment.

## A. Accounting and Financial Statements (Q1–Q25)

### [26.1] Interview Bank: Accounting and Financial Statements
<!-- tags: domain=interview-bank; level=intermediate; roles=IB,PE,ER,CF,Audit,Consulting,Fintech-PM; keywords=accounting interview questions, three statements, revenue recognition, deferred tax, leases, working capital, quality of earnings -->

1. **Walk me through the three statements.** Revenue to net income on the income statement; net income starts the cash flow statement, adjusted for non-cash items and working capital, then investing and financing flows give the change in cash; ending cash and net income (via retained earnings) flow to the balance sheet, which balances. [3.4]
2. **Depreciation rises by ₹10 at a 25% tax rate. Effects?** Net income −7.5; CFO +2.5 (add back 10); cash +2.5; PP&E −10; retained earnings −7.5; balance sheet balances. [3.4]
3. **Which statement matters most?** The cash flow statement, since cash is hardest to manipulate; with two, the balance sheet and cash flow statement. [3.3]
4. **Can a profitable company go bankrupt?** Yes, if cash is tied up in working capital or capex and it cannot meet obligations; profit is not cash. [3.6]
5. **What is accrual accounting?** Recording revenue when earned and expenses when incurred, regardless of cash timing, to match performance to periods. [2.1]
6. **Explain Ind AS 115 in one line.** Recognise revenue when control of goods or services transfers, at the expected consideration, via the five-step model. [2.4]
7. **Gross vs net revenue?** A principal controlling the good records gross revenue; an agent arranging it records only its commission. [2.4]
8. **Why compare marketplaces on GMV and take rate?** Their revenue is net (commission) while retailers report gross; GMV and gross profit make them comparable. [2.4]
9. **FIFO vs weighted average in inflation?** FIFO gives lower COGS and higher profit and inventory values. [2.5]
10. **What creates a deferred tax liability?** Taxable temporary differences, typically faster tax depreciation than book depreciation. [2.9]
11. **How did Ind AS 116 change lessee accounts?** Leases moved on balance sheet (ROU asset and lease liability); EBITDA rose, debt rose, CFO rose and CFF fell. [2.8]
12. **What is goodwill and how is it tested?** Excess of purchase price over fair value of identifiable net assets; not amortised under Ind AS, tested annually for impairment. [2.7]
13. **Provision vs contingent liability?** A provision is recognised when outflow is probable and estimable; a contingent liability is disclosed only. [2.3]
14. **Explain the three ECL stages.** Stage 1: 12-month ECL; Stage 2: lifetime ECL after significant credit deterioration; Stage 3: credit-impaired, lifetime ECL. [2.10]
15. **Is ESOP expense a real cost?** Yes; it's non-cash but transfers value to employees via dilution. [2.11]
16. **When is a buyback EPS-accretive?** When the earnings yield on repurchased shares exceeds the after-tax return forgone on the cash used. [2.12]
17. **What does CFO persistently below PAT signal?** Possible aggressive revenue recognition, working capital build-up or capitalised costs; a red flag. [4.8]
18. **Receivables grow faster than revenue. What do you check?** DSO trend, ageing, bad debt provisions, customer concentration and revenue recognition. [4.2]
19. **Decompose ROE with DuPont.** Net margin × asset turnover × equity multiplier (or 5-step with tax and interest burden). [4.7]
20. **ROE vs ROIC?** ROE rises with leverage; ROIC measures returns on all capital and is compared with WACC. [4.3]
21. **What's a quality-of-earnings adjustment?** Normalising EBITDA by removing one-offs and correcting accounting, e.g., removing gains on asset sales. [4.9]
22. **What does an Altman Z below 1.81 mean?** Distress zone: elevated bankruptcy risk. [4.10]
23. **Name a key SaaS metric and why.** Net revenue retention; above 100% means the existing base grows on its own. [4.11]
24. **What is a key audit matter?** The auditor's most significant areas of judgement, reported for listed companies. [6.7]
25. **Qualified vs adverse opinion?** Qualified: material but not pervasive issue; adverse: material and pervasive misstatement. [6.7]

## B. Corporate Finance and Valuation (Q26–Q55)

### [26.2] Interview Bank: Corporate Finance and Valuation
<!-- tags: domain=interview-bank; level=intermediate; roles=IB,PE,ER,CF,Consulting; keywords=valuation interview questions, DCF, WACC, terminal value, multiples, EV vs equity value, capital structure, NPV IRR -->

26. **Why is NPV preferred to IRR?** NPV measures value in rupees, handles scale and multiple sign changes, and assumes realistic reinvestment at the cost of capital. [1.5]
27. **Walk me through a DCF.** Forecast unlevered FCF, compute terminal value, discount at WACC to EV, subtract net debt and other claims, divide by diluted shares. [10.2]
28. **How do you calculate FCFF?** EBIT × (1 − t) + D&A − capex − change in NWC. [10.2]
29. **Why discount FCFF at WACC?** FCFF belongs to all capital providers, so the blended cost of all capital applies. [10.2]
30. **What dominates DCF value?** Terminal value, often 60–80% of EV. [10.3]
31. **Gordon growth vs exit multiple?** Gordon is intrinsic and forces long-run assumptions; exit multiples anchor to market but import mispricing; cross-check both. [10.3]
32. **What growth rate for terminal value in India?** Below long-run nominal GDP growth, commonly 5–6% in INR, with reinvestment consistent with RONIC. [10.3]
33. **How do you get beta for a private company?** Unlever comparable betas, average, relever at the target's capital structure. [8.4]
34. **Why use market value weights in WACC?** WACC reflects current opportunity cost; book values reflect history. [8.5]
35. **Can WACC fall as debt increases?** Initially, yes (cheaper after-tax debt); beyond a point distress costs raise both Kd and Ke. [8.5]
36. **Why not 100% debt?** Financial distress costs, agency costs and loss of flexibility outweigh tax shields. [8.6]
37. **Why do share prices fall on equity issuance announcements?** Pecking order signalling: management may believe shares are overvalued. [8.6]
38. **Why subtract cash in EV?** EV values operations; cash is non-operating and offsets debt. [10.5]
39. **Debt raised and held as cash: effect on EV?** None; debt and cash offset. [10.5]
40. **Why add NCI to EV?** Consolidated EBITDA includes 100% of subsidiaries. [10.5]
41. **EV/EBITDA vs P/E?** EV/EBITDA is capital-structure neutral and ignores D&A and tax differences; P/E reflects leverage. [10.6]
42. **Why do precedents exceed trading comps?** Control premium and synergies. [10.7]
43. **How do you value a bank?** P/B or P/ABV justified by ROE, cost of equity and growth; residual income or DDM; not EV/EBITDA. [10.10]
44. **Justified P/B formula?** (ROE − g) / (Ke − g). [10.4]
45. **Two companies grow 10%; one trades at 40x, one at 15x. Why?** Different ROIC (reinvestment needs), risk and durability of growth. [9.3]
46. **How does a company create value?** Earning ROIC above WACC and growing at those returns. [9.3]
47. **What's EVA?** NOPAT − WACC × invested capital. [9.3]
48. **Value a pre-revenue startup?** VC method from exit value and target return, adjusted for dilution; scorecard; scenario-weighted outcomes; comparable rounds. [10.8]
49. **Startup raises ₹50 Cr at ₹200 Cr pre-money. Investor stake?** 20%. [10.8]
50. **What is SOTP and when used?** Valuing segments separately and summing; for conglomerates and holding companies. [10.9]
51. **Why do conglomerates trade at a discount?** Complexity, capital allocation concerns, holding layers; demergers can unlock value. [10.9]
52. **Your DCF says ₹500; stock trades at ₹300. What now?** Compare assumptions with consensus and implied multiples; identify what the market disagrees with and catalysts. [10.12]
53. **How does a ₹100 Cr dividend affect EV and equity value?** Equity value −100, net debt +100, EV unchanged. [10.12]
54. **What's the depreciation tax shield?** t × Depreciation: real cash saved because depreciation is deductible. [8.2]
55. **Why might a negative-NPV pilot be worth doing?** It buys a real option to expand if successful. [8.3]

## C. M&A, Investment Banking and PE/VC (Q56–Q80)

### [26.3] Interview Bank: M&A, Investment Banking and Private Equity
<!-- tags: domain=interview-bank; level=intermediate; roles=IB,PE,Consulting,CF,Fintech-PM; keywords=M&A interview questions, accretion dilution, synergies, LBO, IPO process, term sheets, fund economics -->

56. **Why do companies acquire?** Growth, scale and synergies, capabilities, market entry or defence, when faster or cheaper than building. [12.1]
57. **When does an acquisition create value?** When PV of synergies exceeds premium plus costs. [12.1]
58. **Cost vs revenue synergies?** Cost synergies are more controllable and credible; revenue synergies depend on customers and competitors. [12.2]
59. **Is an all-stock deal accretive?** If the acquirer's P/E exceeds the P/E paid for the target (before synergies and adjustments). [12.3]
60. **Can an accretive deal destroy value?** Yes; EPS can rise from cheap debt or a high-P/E currency even when overpaying. [12.3]
61. **Locked box vs completion accounts?** Locked box fixes price at a past balance sheet date with leakage protection; completion accounts adjust price at closing for net debt and working capital. [12.4]
62. **What's in FDD?** Normalised EBITDA, net debt and debt-like items, NWC normalisation, accounting policies. [12.5]
63. **What triggers an open offer in India?** Acquiring 25% voting rights or control, or creeping beyond 5% a year between 25% and 75%. [12.6]
64. **Why do mergers fail?** Overpayment, overestimated synergies, culture clashes, poor integration and talent loss. [12.7]
65. **Spin-off vs carve-out?** Spin-off distributes shares to existing holders (no cash); carve-out sells a stake via IPO (raises cash). [12.8]
66. **Structure an M&A case.** Rationale, target attractiveness, fit and synergies, valuation and price, risks and integration, recommendation. [12.9]
67. **What does an investment bank do?** Advises on M&A and raises equity and debt capital; markets businesses trade and make markets. [13.1]
68. **Walk through a sell-side process.** Preparation (teaser, CIM, model, buyer list), round-one NBOs, round-two diligence and binding bids, negotiation and signing, approvals and closing. [13.2]
69. **Walk through an Indian IPO.** DRHP to SEBI, observations, RHP and price band, anchor book, three-day issue, allotment, listing on T+3. [13.3]
70. **Fresh issue vs OFS?** Fresh issue funds the company; OFS pays selling shareholders. [13.3]
71. **Why are IPOs underpriced?** Information asymmetry, winner's curse and ensuring a successful after-market. [13.4]
72. **QIP vs rights issue?** QIP is fast and institutional; rights issue lets existing holders maintain ownership. [13.5]
73. **How is a corporate bond priced?** Benchmark G-sec yield of matching tenor plus a credit spread. [13.6]
74. **Explain "2 and 20".** 2% management fee and 20% carry above a hurdle, typically 8%. [14.1]
75. **DPI vs TVPI?** DPI counts cash returned; TVPI adds unrealised NAV. [14.1]
76. **Walk me through an LBO.** Entry price and sources and uses, project cash flows, repay debt, exit at a multiple, compute IRR and MOIC on sponsor equity. [14.2]
77. **Three sources of LBO returns?** EBITDA growth, multiple expansion, deleveraging. [14.3]
78. **2x MOIC over 5 years: IRR?** About 15%. [14.2]
79. **1x non-participating preference?** Investor takes the higher of its money back or its as-converted share. [14.4]
80. **Option pool shuffle?** Creating the ESOP pool pre-money so existing holders bear its dilution, lowering effective pre-money. [14.5]

## D. Markets: Equity, Fixed Income, Derivatives and Portfolios (Q81–Q105)

### [26.4] Interview Bank: Markets and Portfolio Management
<!-- tags: domain=interview-bank; level=intermediate; roles=ER,Fintech-PM,CF,IB,PE; keywords=markets interview questions, bonds, duration, options, Greeks, CAPM, Sharpe ratio, mutual funds, market structure -->

81. **What happens when I buy a share on an app?** Broker routes to exchange; match; clearing corporation novates and margins; T+1 settlement; depository credits shares. [15.1]
82. **Why did India move to T+1?** Lower settlement risk, faster capital release, efficiency. [15.1]
83. **How is the Nifty 50 weighted?** Free-float market capitalisation. [15.3]
84. **Limit vs market order?** Market guarantees execution not price; limit guarantees price not execution. [15.4]
85. **Pitch me a stock (structure).** Recommendation and target, 2–3 differentiated thesis points with numbers, valuation, catalysts, key risk. [15.5]
86. **Are markets efficient?** Large liquid markets are largely efficient; pockets of inefficiency and behavioural effects persist. [15.8]
87. **Direct vs regular MF plans?** Direct plans have no distributor commission, so lower expense ratios. [15.9]
88. **Why do bond prices fall when rates rise?** Fixed cash flows are discounted at higher yields. [16.1]
89. **Bond above par: YTM vs coupon?** YTM below coupon. [16.2]
90. **What's modified duration?** Approximate % price change for a 1% yield change. [16.3]
91. **Zero vs coupon bond duration (same maturity)?** The zero has higher duration. [16.3]
92. **Why is positive convexity valuable?** Gains when yields fall exceed losses when yields rise by the same amount. [16.4]
93. **What does an inverted yield curve signal?** Expected rate cuts, often from expected slowdown. [16.5]
94. **What drives a credit spread?** Default probability, recovery, liquidity and risk premium. [16.6]
95. **Forward vs future?** Same economics; futures are standardised, exchange-traded, cleared and marked to market. [17.1]
96. **How are index futures priced?** Spot × (1 + (r − dividend yield) × T). [17.2]
97. **Put-call parity?** C − P = S − PV(K). [17.4]
98. **What raises option prices for both calls and puts?** Higher volatility (and longer time, usually). [17.4]
99. **What is delta?** Option price change per ₹1 underlying change; hedge ratio; rough probability of finishing ITM. [17.5]
100. **Why do option buyers often lose?** Time decay, low probability of OTM options paying off, costs. [17.3]
101. **What's an interest rate swap used for?** Converting floating to fixed (or vice versa) to manage rate exposure. [17.7]
102. **CML vs SML?** CML: return vs total risk for efficient portfolios; SML: return vs beta for any asset. [18.3]
103. **Sharpe vs Treynor?** Sharpe for total-wealth portfolios (total risk); Treynor for diversified sub-portfolios (beta). [18.6]
104. **TWR vs XIRR?** TWR measures manager performance independent of cash flows; XIRR reflects the investor's timing. [18.6]
105. **Why does asset allocation matter most?** Asset class mix dominates portfolio risk and long-run returns for diversified investors. [18.5]

## E. Banking, Credit and Risk (Q106–Q120)

### [26.5] Interview Bank: Banking, Credit and Risk
<!-- tags: domain=interview-bank; level=intermediate; roles=Fintech-PM,ER,Consulting,CF; keywords=banking interview questions, NIM, NPA, CASA, Basel III, credit appraisal, VaR, ALM, NBFC -->

106. **How does a bank make money?** NII spread plus fees, minus opex and credit costs. [19.2]
107. **Why is CASA important?** Cheapest, stickiest funding; supports NIM. [19.1]
108. **When does a loan become an NPA?** Over 90 days overdue. [19.3]
109. **What does a high PCR indicate?** NPAs well provided for; less future P&L risk from existing bad loans. [19.3]
110. **What's CET1?** Core equity capital / RWA; first loss absorber. [19.4]
111. **The 5 Cs of credit?** Character, capacity, capital, collateral, conditions. [19.5]
112. **What does LCR measure?** HQLA / 30-day stressed net outflows; must be ≥100%. [19.6]
113. **Negative one-year repricing gap and rates rise?** NII falls. [19.7]
114. **Bank vs NBFC?** NBFCs lack demand deposits and CASA, have higher funding costs, no CRR/SLR, and are regulated under scale-based rules. [19.8]
115. **What changed with IBC?** Creditor-in-control, time-bound resolution, stronger credit discipline. [19.9]
116. **Three lines model?** Business owns risk; risk and compliance oversee; internal audit assures. [20.1]
117. **What does a 99% one-day VaR of ₹5 Cr mean?** 1% chance of losing more than ₹5 Cr in a day under normal conditions; says nothing about how much more. [20.2]
118. **Expected vs unexpected loss?** EL is priced and provided; UL is covered by capital. [20.3]
119. **Why do fast-growing loan books look healthier than they are?** New loans haven't seasoned; defaults appear later. [20.3]
120. **What's in a contingency funding plan?** Early warnings, stress scenarios, survival horizon, prioritised funding actions, governance. [20.5]

## F. Fintech and Payments (Q121–Q140)

### [26.6] Interview Bank: Fintech and Payments
<!-- tags: domain=interview-bank; level=intermediate; roles=Fintech-PM,Consulting,PE; keywords=fintech interview questions, UPI, MDR, payment aggregator, digital lending, account aggregator, wealthtech, unit economics -->

121. **How does a UPI app make money if UPI is free?** Cross-selling lending, insurance and investments, merchant services, ads and partnerships. [21.1]
122. **Walk through a UPI P2M payment.** App → PSP bank → NPCI → remitter bank debits after PIN → NPCI → beneficiary bank credits → confirmations; net interbank settlement later. [21.3]
123. **Should UPI have MDR?** For: sustainability and innovation funding, especially for large merchants. Against: inclusion and adoption came from zero cost. Middle path: MDR for large merchants. [21.3]
124. **What is the UPI market share cap?** NPCI's proposed 30% cap on any app's share of UPI volumes, with a deadline repeatedly extended. [21.3]
125. **Explain the four-party card model and MDR split.** Cardholder, merchant, acquirer, issuer, plus network; MDR splits into interchange, scheme fees and acquirer margin. [21.4]
126. **How do card issuers make money?** Interchange, revolver interest and fees, minus rewards, credit losses and costs. [21.4]
127. **Payment aggregator vs gateway?** PA handles funds via escrow and settles merchants (RBI-authorised); PG provides technology only. [21.5]
128. **What's net take rate for a PA?** (Gross revenue − processing costs) / TPV. [21.5]
129. **Why does success rate matter?** Each failed payment is lost GMV; small SR gains recover large revenue for merchants. [21.5]
130. **How can a fintech lend in India?** NBFC licence, or LSP partnership with a regulated entity, possibly with co-lending and DLG up to 5%. [21.6]
131. **What does the KFS show?** Standardised loan terms with an all-inclusive APR. [21.6]
132. **What is an account aggregator?** RBI-licensed, data-blind consent manager enabling encrypted sharing of financial data. [21.7]
133. **How does India Stack cut costs?** eKYC lowers onboarding cost, UPI lowers payment cost, AA data improves underwriting. [21.7]
134. **How do discount brokers make money?** F&O and intraday brokerage, margin financing, account and DP charges, ancillary products. [21.8]
135. **How did SEBI's 2024 changes hit brokers?** True-to-label charges removed rebates; F&O measures cut volumes. [21.8]
136. **How should a rewards app monetise?** Lending cross-sell, brand marketing, commerce and financial products, while controlling reward costs. [21.9]
137. **Which licences for wallet, lending, broking?** PPI authorisation, NBFC or LSP partnership, SEBI broker and DP registration. [21.10]
138. **North-star metric for a payments app?** Monthly transacting users (or successful transactions per user). [21.11]
139. **Evaluate BNPL at checkout.** Merchant subvention, credit risk, regulatory structure, unit economics, conversion impact. [21.11]
140. **Design credit for gig workers.** Alternative data via AA and UPI inflows, small limits that grow, repayment aligned to income, compliant collections. [21.6]

## G. Macro, Regulation and Tax (Q141–Q150)

### [26.7] Interview Bank: Macroeconomics, Regulation and Taxation
<!-- tags: domain=interview-bank; level=intermediate; roles=Consulting,ER,Fintech-PM,CF,IB; keywords=macro interview questions, repo rate, inflation, fiscal deficit, rupee, regulators, capital gains tax, GST -->

141. **What happens when RBI cuts the repo rate?** Short rates and yields fall, EBLR loans reprice, borrowing cheaper, bond prices rise, equities may re-rate, rupee may soften; bank NIMs compress briefly. [25.2]
142. **CPI vs WPI?** CPI measures consumer prices (RBI's target); WPI measures producer prices. [25.3]
143. **How does the fiscal deficit affect yields?** More borrowing increases bond supply, pushing yields up unless demand absorbs it. [25.4]
144. **Why do growth stocks fall more when rates rise?** Long equity duration: value is concentrated in distant cash flows. [25.5]
145. **Oil spikes: effect on India?** Wider CAD, higher inflation, weaker rupee, fiscal pressure; sector winners and losers. [25.7]
146. **Who regulates what in Indian finance?** RBI (banks, NBFCs, payments, forex), SEBI (securities, MFs), IRDAI (insurance), PFRDA (pensions), IFSCA (GIFT City). [24.1]
147. **What is UPSI?** Unpublished price-sensitive information; insiders can't trade on it. [24.3]
148. **Equity capital gains tax in India now?** STCG 20% (≤12 months); LTCG 12.5% above ₹1.25 lakh a year (per 2024 amendments; verify current law). [23.2]
149. **Input tax credit?** Credit for GST paid on inputs against output GST, so tax falls only on value added. [23.4]
150. **Share deal vs asset deal for tax?** Share deals are simpler but inherit tax history with no step-up; asset deals give a step-up and leave liabilities, with possible extra seller tax, GST and stamp duty. [23.5]

---

# Appendix: Consolidated [VERIFY] Register

Every time-sensitive fact in this compendium is tagged [VERIFY]. Check each item against the primary source (RBI, SEBI, IRDAI, PFRDA, MCA, ICAI, NPCI, Income Tax Department, CBIC/GST Council, NSO/MoSPI) before relying on it in Placewise answers.

## Module 1

1. Bank FD compounding conventions (individual bank terms / RBI interest rate directions)
2. RBI Digital Lending Directions: annualised cost of credit and Key Fact Statement requirements
3. RBI inflation target and tolerance band (RBI Act monetary policy framework)
4. SEBI mutual fund advertising rules on SIP return illustrations
5. RBI external benchmark lending rate framework for floating-rate loans
6. Income Tax Act depreciation rates and section 115BAA conditions
7. SEBI AIF Regulations: performance reporting and benchmarking
8. Current 10-year G-sec yield (RBI / CCIL)
9. Current India equity risk premium estimates
10. Section 115BAA effective rate (22% + 10% surcharge + 4% cess ≈ 25.17%) under the current Finance Act

## Module 2

1. Companies (Indian Accounting Standards) Rules 2015: applicability thresholds
2. RBI/IRDAI Ind AS implementation status for banks and insurers
3. Companies (Accounts) Rules 2014 audit-trail (edit log) requirement
4. Schedule III Division II disclosure requirements
5. DPIIT FDI policy on e-commerce inventory model
6. ICDS II on inventory valuation
7. CARO 2020 clause 3(ii) inventory verification threshold
8. Schedule II useful lives
9. Income-tax Act 2025 commencement and depreciation provisions
10. Ind AS 103 bargain purchase treatment (capital reserve)
11. AS 14 amalgamation goodwill amortisation
12. Finance Act 2021: goodwill no longer depreciable for tax
13. Section 115BAA / 115JB (MAT) and equivalents under the Income-tax Act 2025
14. RBI ECL framework for banks and effective date
15. RBI circular on Ind AS for NBFCs (impairment reserve)
16. SEBI SBEB and Sweat Equity Regulations 2021
17. ESOP perquisite tax and startup TDS deferral
18. Companies (Share Capital and Debentures) Rules, ESOPs to promoters
19. Companies Act s.68 buyback limits
20. Finance (No. 2) Act 2024 buyback taxation in shareholders' hands
21. SEBI phase-out of open-market buybacks
22. Ind AS 101 para D13AA exchange difference carve-out

## Module 3

1. SEBI LODR Regulation 33 result formats
2. IFRS 18 effective date and Ind AS adoption plan
3. Schedule III amendments (ageing schedules, ratios, promoter shareholding)
4. Income Tax Act s.43B deductions on payment basis, including s.43B(h) MSME payments
5. MSMED Act s.15 payment timelines
6. RBI-authorised TReDS platforms
7. SEBI LODR Reg 34 BRSR applicability
8. SEBI LODR Reg 23 related-party transaction materiality thresholds

## Module 4

1. Bank credit policy benchmarks on current ratio (MPBF legacy)
2. Infrastructure/project finance DSCR norms
3. SEBI circular on auditor resignation disclosures (October 2019)
4. NSE historical Nifty 50 P/E range

## Module 5

1. Companies (Ind AS) Rules thresholds; RBI and IRDAI Ind AS status
2. Ind AS 1 carve-out on covenant breach classification
3. SEBI ICDR Schedule VI restated financial information requirements
4. Companies (Restriction on Number of Layers) Rules 2017
5. SEBI LODR Schedule V (MD&A and governance disclosures)
6. CARO 2020 applicability exemptions
7. LODR Regulation 33 result timelines and limited review
8. SEBI AIF valuation circular (2024)
9. SEBI mutual fund valuation norms
10. SEBI BRSR Core assurance and value chain timelines (including 2025 revisions)
11. India Carbon Credit Trading Scheme targets
12. ICAI sustainability assurance standards

## Module 6

1. Income Tax Act s.44AB tax audit thresholds (and Income-tax Act 2025 equivalent)
2. ICAI revised SA 315 effective date
3. NFRA audit quality review findings on materiality
4. IFC reporting exemptions for small private companies
5. Audit trail reporting under Rule 11(g)
6. SEBI circular on impact of audit qualifications
7. CARO 2020 clauses and applicability exemptions
8. Rule 13 fraud reporting threshold (₹1 Cr)
9. Rule 5 auditor rotation applicability
10. SEBI circular on auditor resignation (October 2019)
11. Satyam fraud figures
12. Supreme Court SBI v Rajesh Agarwal (2023) on fraud classification

## Module 7

1. Cost audit thresholds (Companies (Cost Records and Audit) Rules 2014)
2. Cost Accounting Standard CAS-2 (capacity determination)
3. GCC count estimates in India
4. Income-tax Act 2025 transfer pricing sections and safe harbour margins

## Module 8

1. SEBI LODR Regulations 17, 18 and 23 (board, audit committee, RPTs)
2. Income Tax Act depreciation rates, section 32(1)(iia) and the 180-day rule; PLI scheme terms
3. Bank project appraisal norms (sensitivity on DSCR)
4. Current 10-year G-sec yield; current India ERP estimates
5. Current corporate bond spreads by rating; bank lending rate benchmarks
6. Corporate leverage trends post-IBC
7. Finance (No. 2) Act 2024 buyback taxation; SEBI buyback route changes; DIPAM CPSE dividend guidelines
8. RBI loan system for delivery of bank credit; working capital assessment practices
9. FEMA (Non-Debt Instruments) Rules 2019; RBI ECB Master Direction (and revisions); RBI CP and NCD directions

## Module 9

1. Company shareholder letters: contribution margin and adjusted EBITDA definitions
2. Sector ROCE and valuation data
3. Current MDR rules; RBI Fair Practices Code and Key Fact Statement norms
4. RBI Digital Lending Directions on LSPs and DLG
5. SEBI ICDR KPI disclosure requirements

## Module 10

1. Companies (Registered Valuers and Valuation) Rules 2017; FEMA pricing guidelines; SEBI ICDR preferential issue pricing
2. Applicable tax regimes and holidays in DCFs
3. Long-run nominal GDP growth estimates; RBI inflation target
4. Current P/B and P/ABV multiples for Indian banks
5. Current India vs global sector multiples; Nifty forward P/E vs MSCI EM
6. SEBI SAST Regulation 8 open offer pricing
7. Finance (No. 2) Act 2024 abolition of angel tax (section 56(2)(viib))
8. Recent Indian demergers; holding company discounts; Income Tax Act section 2(19AA)
9. Cement replacement cost per tonne
10. IEV disclosure practice and APS10
11. SEBI requirements on valuation reports and fairness opinions in schemes

## Module 11

1. RBI external benchmark and MCLR framework
2. Rating agency rationale formats for stress cases

## Module 12

1. CCI combination thresholds; Competition (Amendment) Act 2023 and CCI combination regulations 2024
2. Income Tax Act section 72A (loss carry-forward in amalgamations)
3. SEBI requirements on valuation reports for share swap ratios
4. Companies Act section 233 fast-track mergers; Income Tax Act section 50B (slump sale); FDI sectoral caps and pricing
5. RBI prior approval for change in control of NBFCs and payment entities; SEBI intermediaries change-in-control
6. SEBI SAST Regulations 2011 (as amended); SEBI Delisting Regulations 2021 and 2024 amendments; FEMA NDI Rules; Press Note 3 (2020)
7. PSU bank merger integration disclosures
8. Recent Indian demergers; section 2(19AA); contested Indian takeovers

## Module 13

1. SEBI (Merchant Bankers) Regulations (as amended 2024); league table sources
2. Sector-specific approval requirements for M&A
3. SEBI ICDR Regulations 2018 (current): eligibility, allocation, lock-ins, anchors, price band, T+3; SCRR 19(2)(b) MPS
4. Prime Database IPO performance statistics; ICDR KPI and pre-IPO transaction disclosures
5. SEBI ICDR Chapters III, V, VI; block deal framework; OFS mechanism
6. SEBI large corporate framework; EBP threshold; RBI CP and NCD Directions
7. Campus recruiting patterns

## Module 14

1. SEBI AIF Regulations 2012: categories and minimum investment; IFSCA Fund Management Regulations 2022
2. RBI restrictions on bank finance for acquisitions of shares; FEMA rules on acquisition leverage; Indian buyout data
3. Industry reports on PE value creation in India
4. FEMA NDI Rules on optionality clauses; current VC activity data
5. Companies (Share Capital and Debentures) Rules rule 12; DPIIT startup ESOP relaxations; ESOP taxation and deferral
6. IVCA/Bain exit data; SEBI ICDR Regulation 17 lock-in; reverse-flip facilitation

## Module 15

1. SEBI circulars on T+1, T+0 and secondary market ASBA/UPI block; current demat account count
2. AMFI SIP data; NSE ownership data; SEBI FPI Regulations and investment limits
3. Nifty and Sensex methodology; SEBI derivatives eligibility for non-benchmark indices
4. SEBI peak margin circulars; current STT rates
5. SEBI RA Regulations amendments and finfluencer restrictions
6. Screening platform features
7. SEBI F&O trader profitability studies; October 2024 F&O framework measures
8. AMFI industry AUM; SEBI TER slabs and SIF framework; section 80C under the new regime

## Module 16

1. RBI/FIMMDA market conventions; SEBI debt security face value changes
2. FBIL benchmarks; CCIL data
3. SEBI mutual fund categorisation duration ranges; RBI IRRBB guidelines
4. RBI Master Direction on Securitisation of Standard Assets (2021)
5. Global bond index inclusion dates and weights; FBIL curve methodology
6. SEBI CRA Regulations and post-2019 circulars; RBI standardised risk weights by rating
7. Corporate bond market size data; RBI FAR scheme; SEBI OBPP framework
8. Yes Bank AT1 write-down and court rulings; sovereign green bond framework
9. SEBI post-Franklin Templeton circulars; Finance Act 2023 section 50AA

## Module 17

1. RBI Master Direction on Risk Management and Inter-Bank Dealings; exchange-traded currency derivative rules
2. Arbitrage fund taxation; SEBI/NSE Clearing margin framework; current lot sizes and minimum contract value
3. SEBI F&O studies (2023, 2024); physical settlement of stock derivatives
4. NSE India VIX methodology
5. SEBI October 2024 index derivatives measures; current expiry days
6. Hedged position margin benefits
7. RBI Rupee Interest Rate Derivatives Directions; ECB hedging requirements; FBIL MIBOR methodology

## Module 18

1. SEBI IA Regulations (advice-distribution segregation, fee caps, 2024–25 amendments); PMS minimum
2. Historical correlations of Nifty, G-secs and gold in INR
3. IIM Ahmedabad Indian factor data library
4. Nifty factor index list and methodologies
5. SEBI hybrid fund categorisation; RBI household finance data; MF overseas limits; LRS limit
6. SEBI TRI benchmarking and performance disclosure circulars
7. SEBI/AMFI stress test disclosures; MF Seventh Schedule investment limits
8. SEBI SIF framework (2025); AIF minimums; MFD naming rules; current Income-tax Act provisions

## Module 19

1. Current CRR and SLR; RBI Priority Sector Lending Master Directions; DICGC cover limit
2. Latest bank-wise RoA/RoE data
3. RBI IRACP Master Circular provisioning percentages; RBI Financial Stability Report GNPA; RBI ECL directions and timeline; NBFC IRACP clarification
4. RBI Basel III Master Circular; D-SIB list and surcharges; leverage ratio; November 2023 risk weight circular and later changes; PSU recapitalisation totals
5. RBI home loan LTV caps; CIC reporting frequency; KFS circular (April 2024)
6. RBI final LCR circular (2025); FALLCR carve-out
7. RBI liquidity risk framework for NBFCs and LCR glide path
8. RBI SBR Master Direction; NBFC-UL list; base layer threshold; co-lending directions (2025); microfinance directions (2022)
9. Payments bank deposit cap; SFB transition norms; IBBI recovery statistics; NARCL status; on-tap licensing

## Module 20

1. RBI CRO guidelines for banks and NBFCs; SEBI LODR Reg 21 risk management committee applicability
2. SEBI/NSE Clearing margin methodology; RBI market risk capital and FRTB status
3. RBI draft ECL directions and model risk guidance; Digital Lending Directions data provisions
4. RBI IT Governance and IT Outsourcing Master Directions (2023); CERT-In directions (2022); DPDP Rules
5. RBI NBFC liquidity framework (2019); SEBI MF liquidity risk management framework
6. RBI hedging Master Direction; UFCE guidelines
7. RBI FSR stress test results; RBI stress testing and climate disclosure frameworks

## Module 21

1. Latest fintech funding and user data
2. RBI Payments Vision and NUE status; current IMPS/UPI/NEFT limits
3. NPCI P2P collect phase-out; current UPI products; BHIM-UPI incentive scheme; PPI interchange on UPI; RuPay credit on UPI MDR; market share cap deadline; NPCI monthly statistics and app shares; UPI category limits
4. Interchange rates by network; CoF tokenisation; RBI Authentication Directions 2025; e-mandate limits; RBI card statistics; card directions and network choice circular
5. RBI PA Directions (2025) including PA-CB and PA-P; list of authorised PAs and actions
6. RBI Digital Lending Directions 2025; DLG guidelines; KFS circular; digital lending apps directory; risk weight changes; ULI status
7. Sahamati AA statistics; Aadhaar authentication rules; ONDC data
8. SEBI uniform MII charges; F&O measures; client fund rules; demat and active client data; F&O risk disclosures
9. RBI BBPS credit card bill payment mandate; IRDAI EoM regulations; Bima Sugam; insurance penetration; insurance FDI limit
10. DPDP Rules timelines; RBI payment data storage; SRO-FT recognition; RBI action on Paytm Payments Bank; PPI Master Directions
11. Listed fintech KPI disclosures

## Module 22

1. RBI NDF participation rules; current forex reserves and forward book; FBIL reference rates
2. Current USD/INR forward premia
3. RBI hedging Master Direction user classification and limits
4. India oil import dependence; latest BoP, services surplus and remittances; index-related debt inflows
5. FDI policy and sectoral caps; FEMA NDI Rules; FPI limits; ODI Rules 2022; ECB Master Direction and revisions; LRS limit and TCS rates; recent liberalisations; cross-border merger rules
6. DTAA rates and MLI provisions
7. Interest equalisation scheme status; export realisation period and FTP 2023; IFSCA trade finance platforms

## Module 23

1. Income-tax Act 2025 commencement, section mapping and tax year 2026-27 rates; current personal slabs, rebate and standard deduction
2. Finance (No. 2) Act 2024 capital gains changes; section 50AA; grandfathering; DTAA capital gains provisions
3. Buyback taxation provisions; TDS rates and thresholds; DTAA withholding rates; buyback activity data
4. GST Council decisions (September 2025) and later changes; compensation cess; GST on online gaming and VDAs
5. Thin capitalisation (s.94B), s.79 and s.72A conditions and Income-tax Act 2025 equivalents; Taxation Laws (Amendment) Act 2021
6. Equalisation levy abolition; India-US DTAA royalty rate and domestic rate; India-Mauritius/Singapore grandfathering

## Module 24

1. Regulatory consolidation proposals status
2. RBI surplus transfer and risk buffer; current repo, SDF and MSF rates; latest RBI developmental and regulatory statement
3. SEBI PIT amendments (trading plans); rumour verification; finfluencer circulars
4. IRDAI risk-based capital roadmap; UPS details; insurance penetration; Bima Sugam; insurance FDI limit enactment
5. CCI Combination Regulations 2024; Digital Competition Bill status; NFRA orders; IFSCA direct listing framework
6. SEBI SECC Regulations and MII governance; BCP-DR framework
7. FATF India evaluation 2024; RBI Basel III adaptations

## Module 25

1. MoSPI GDP composition, latest growth and new base year
2. Current repo rate, stance and CRR; latest MPC decisions
3. CPI weights in the revised base; latest CPI and food contribution
4. Union Budget fiscal deficit, debt targets and capex allocation
5. Sector performance across rate cycles
6. Macro data release calendar and sources
7. Forex reserves and external vulnerability indicators; India-US trade and tariff status


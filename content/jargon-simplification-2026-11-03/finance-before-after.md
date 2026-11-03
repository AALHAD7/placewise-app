# Finance jargon simplification — before/after (readable)

Generated from `finance-diff.json` for manual review. 10 frameworks, 26 fields changed.
Only changed fields are shown — any field not listed for a framework was left untouched.

## 3 Financial Statements Integration

### example
**Before:** Question: Walk me through a $10 increase in depreciation at a 20% tax rate. (1) Income Statement: Operating income drops $10, tax drops $2, Net Income drops $8. (2) Cash Flow: Net income -$8, add back +$10 depreciation -> Cash up +$2. (3) Balance Sheet: Cash +$2, PP&E -$10 -> Assets down $8; Retained Earnings down $8 -> Balanced!

**After:** Question: Walk me through a $10 increase in depreciation (a non-cash expense reducing asset book value over time) at a 20% tax rate. (1) Income Statement: Operating income drops $10, tax drops $2, Net Income drops $8. (2) Cash Flow: Net income -$8, add back +$10 depreciation -> Cash up +$2. (3) Balance Sheet: Cash +$2, PP&E (Property, Plant, and Equipment, physical assets used in operations) -$10 -> Assets down $8; Retained Earnings down $8 -> Balanced!

### steps
**Before:**
- Net Income from the bottom of the Income Statement flows into: (1) Retained Earnings on the Balance Sheet, and (2) the top of Cash Flow from Operations (CFO).
- Non-cash expenses (Depreciation & Amortization) add back on the Cash Flow Statement and reduce Net PP&E on the Balance Sheet.
- Net Working Capital changes (Receivables, Inventory, Payables) on the Balance Sheet flow into Operating Cash Flow (Asset increase = cash outflow; Liability increase = cash inflow).
- Capital Expenditures (Capex) in Cash Flow from Investing (CFI) increase Gross PP&E on the Balance Sheet.
- Debt issuances/repayments, equity raises, and dividend payouts in Cash Flow from Financing (CFF) adjust Balance Sheet Debt and Equity balances.
- Sum of CFO + CFI + CFF = Net Change in Cash, which added to Beginning Cash equals Ending Cash on the Balance Sheet.

**After:**
- Net Income from the bottom of the Income Statement flows into: (1) Retained Earnings on the Balance Sheet, and (2) the top of Cash Flow from Operations (CFO, cash generated from core business activities).
- Non-cash expenses (Depreciation & Amortization, the gradual expensing of intangible assets over time) add back on the Cash Flow Statement and reduce Net PP&E on the Balance Sheet.
- Net Working Capital (current assets minus current liabilities, measuring short-term liquidity) changes (Receivables, Inventory, Payables) on the Balance Sheet flow into Operating Cash Flow (Asset increase = cash outflow; Liability increase = cash inflow).
- Capital Expenditures (Capex, funds used to acquire or upgrade physical assets) in Cash Flow from Investing (CFI, cash from investments and asset sales) increase Gross PP&E on the Balance Sheet.
- Debt issuances/repayments, equity raises, and dividend payouts in Cash Flow from Financing (CFF, cash flows between a company and its investors and creditors) adjust Balance Sheet Debt and Equity balances.
- Sum of CFO + CFI + CFF = Net Change in Cash, which added to Beginning Cash equals Ending Cash on the Balance Sheet.

---

## Beta & Capital Asset Pricing Model (CAPM)

### description
**Before:** Quantifies systematic market risk (Beta) and determines the required expected rate of return on equity (Ke) using CAPM: Ke = Rf + Beta × (Rm - Rf).

**After:** Quantifies systematic market risk (Beta) and determines the required expected rate of return on equity (Ke) using CAPM (Capital Asset Pricing Model, a formula relating a stock's risk to its expected return): Ke = Rf + Beta × (Rm - Rf).

### when_to_use
**Before:** Use to calculate the Cost of Equity (Ke) for WACC, discount levered cash flows, or analyze systematic risk.

**After:** Use to calculate the Cost of Equity (Ke) for WACC (Weighted Average Cost of Capital, a firm's average cost of capital from all sources), discount levered cash flows, or analyze systematic risk.

### steps
**Before:**
- Select Risk-Free Rate (Rf): Use current 10-year or 30-year government bond yield in the company's operating currency.
- Estimate Beta (β): Measures sensitivity of the stock's returns relative to the broad market portfolio (Cov(Ra,Rm) / Var(Rm)).
- Determine Equity Risk Premium (ERP = Rm - Rf): Historical or forward-looking spread of broad equities over the risk-free rate (typically 5-6%).
- Calculate Cost of Equity: Ke = Rf + β × ERP (add size premium or country risk premium if applicable).
- Unlever and Relever Beta when benchmarking against peer comps: Unlevered Beta (Asset Beta) = Levered Beta / [1 + (1 - t)(D/E)]; Relevered Beta = Asset Beta × [1 + (1 - t)(Target D/E)].

**After:**
- Select Risk-Free Rate (Rf): Use current 10-year or 30-year government bond yield in the company's operating currency.
- Estimate Beta (β): Measures sensitivity of the stock's returns relative to the broad market portfolio (Cov(Ra,Rm) / Var(Rm)).
- Determine Equity Risk Premium (ERP = Rm - Rf): Historical or forward-looking spread of broad equities over the risk-free rate (typically 5-6%).
- Calculate Cost of Equity: Ke = Rf + β × ERP (add size premium or country risk premium if applicable).
- Unlever and Relever Beta when benchmarking against peer comps (comparable companies used for benchmarking): Unlevered Beta (Asset Beta) = Levered Beta / [1 + (1 - t)(D/E)]; Relevered Beta = Asset Beta × [1 + (1 - t)(Target D/E)].

---

## Comparable Company Analysis

### description
**Before:** Values a company by looking at what similar, publicly-traded companies trade for (e.g. EV/Revenue, EV/EBITDA, P/E) and applying those multiples to the target.

**After:** Values a company by looking at what similar, publicly-traded companies trade for (e.g. EV/Revenue, EV/EBITDA, P/E) and applying those multiples (valuation metrics comparing a company's price to its financial results) to the target.

### when_to_use
**Before:** Use it for a quick, market-grounded valuation check, or when the interviewer wants a faster answer than a full DCF.

**After:** Use it for a quick, market-grounded valuation check, or when the interviewer wants a faster answer than a full DCF (Discounted Cash Flow, a method valuing a company from its projected future cash flows).

---

## DCF (Discounted Cash Flow)

### example
**Before:** Valuing a subscription business: project 5-10 years of free cash flow from subscriber growth and margins, estimate a terminal value beyond that, then discount everything back using a rate reflecting the business's risk (often via WACC).

**After:** Valuing a subscription business: project 5-10 years of free cash flow from subscriber growth and margins, estimate a terminal value (the estimated value of a company's cash flows beyond the explicit forecast period) beyond that, then discount everything back using a rate reflecting the business's risk (often via WACC, the average rate a company pays to finance its assets through debt and equity).

### when_to_use
**Before:** Use it when asked to value a company or investment from first principles, or to explain what actually drives a valuation rather than just quoting a multiple.

**After:** Use it when asked to value a company or investment from first principles, or to explain what actually drives a valuation rather than just quoting a multiple (a ratio comparing a company's financial metric to its share price or value).

### when_not_to_use
**Before:** Do not lean on it when reliable long-term cash flow projections are not realistic (early-stage/pre-revenue companies) - a comparables approach is usually more defensible there.

**After:** Do not lean on it when reliable long-term cash flow projections are not realistic (early-stage/pre-revenue companies) - a comparables approach (a valuation method comparing a company to similar publicly traded peers) is usually more defensible there.

### steps
**Before:**
- Project the company's free cash flows for an explicit forecast period (commonly 5-10 years).
- Estimate a terminal value for cash flows beyond the forecast period (perpetuity growth or exit-multiple method).
- Choose a discount rate reflecting the risk of those cash flows (often the Weighted Average Cost of Capital).
- Discount each year's cash flow and the terminal value back to present value and sum them.
- Stress-test the output against a plausible range of growth/discount-rate assumptions - a single-point answer is weaker than a defensible range.

**After:**
- Project the company's free cash flows for an explicit forecast period (commonly 5-10 years).
- Estimate a terminal value for cash flows beyond the forecast period (perpetuity growth or exit-multiple method).
- Choose a discount rate reflecting the risk of those cash flows (often the Weighted Average Cost of Capital).
- Discount each year's cash flow and the terminal value back to present value (the current worth of a future sum of money) and sum them.
- Stress-test the output against a plausible range of growth/discount-rate assumptions - a single-point answer is weaker than a defensible range.

---

## Enterprise Value & Equity Value (The Bridge)

### example
**Before:** Company has $50/share with 10M shares ($500M Equity Value), $150M debt, and $50M cash. Enterprise Value = $500M + $150M - $50M = $600M. With $60M EBITDA, it trades at 10x EV/EBITDA.

**After:** Company has $50/share with 10M shares ($500M Equity Value), $150M debt, and $50M cash. Enterprise Value = $500M + $150M - $50M = $600M. With $60M EBITDA (earnings before interest, taxes, depreciation, and amortization), it trades at 10x EV/EBITDA (Enterprise Value to EBITDA, a valuation multiple comparing operating value to core cash earnings).

### when_to_use
**Before:** Use whenever bridging between firm-wide valuation (DCF, trading comps) and share-level pricing, or analyzing an M&A offer price.

**After:** Use whenever bridging between firm-wide valuation (DCF, a method valuing a company from its projected future cash flows, and trading comps, comparisons of similar public companies) and share-level pricing, or analyzing an M&A (mergers and acquisitions) offer price.

### steps
**Before:**
- Start with Equity Value = Diluted Share Price × Fully Diluted Shares Outstanding (Market Cap).
- Add Total Debt (both short-term and long-term interest-bearing debt, notes payable).
- Add Preferred Stock and Non-Controlling / Minority Interest.
- Subtract Cash & Cash Equivalents (and liquid short-term investments) to get Enterprise Value.
- EV represents the cost to acquire the entire operating business debt-free and cash-free.
- Metric alignment: Multiples of EV (EV/EBITDA, EV/EBIT, EV/Sales) measure unlevered cash flows available to all capital providers; Equity Value metrics (P/E, Price/Book) measure cash flows after interest.

**After:**
- Start with Equity Value = Diluted Share Price × Fully Diluted Shares Outstanding (total shares including all potential options, warrants, and convertibles) (Market Cap).
- Add Total Debt (both short-term and long-term interest-bearing debt, notes payable).
- Add Preferred Stock and Non-Controlling / Minority Interest.
- Subtract Cash & Cash Equivalents (and liquid short-term investments) to get Enterprise Value.
- EV represents the cost to acquire the entire operating business debt-free and cash-free.
- Metric alignment: Multiples of EV (EV/EBITDA, EV/EBIT, EV/Sales) measure unlevered cash flows available to all capital providers; Equity Value metrics (P/E, price-to-earnings ratio, Price/Book) measure cash flows after interest.

---

## Income Statement Waterfall & P&L Walk

### description
**Before:** The line-by-line mathematical walk from gross revenues down to bottom-line net income, isolating Gross Profit, EBITDA, EBIT, and Pre-tax Profit.

**After:** The line-by-line mathematical walk from gross revenues down to bottom-line net income, isolating Gross Profit, EBITDA (earnings before interest, taxes, depreciation, and amortization), EBIT (earnings before interest and taxes), and Pre-tax Profit.

### steps
**Before:**
- Gross Revenue minus Returns, Allowances, and Discounts = Net Revenue (Top Line).
- Subtract Cost of Goods Sold (COGS: direct raw materials, direct labor, manufacturing overhead) = Gross Profit.
- Gross Margin % = Gross Profit / Net Revenue.
- Subtract Operating Expenses (SG&A, R&D, Sales & Marketing, Admin) = EBITDA (Earnings Before Interest, Taxes, Depreciation & Amortization).
- Subtract Depreciation (PP&E) and Amortization (Intangibles) = EBIT (Operating Income).
- Add/Subtract Net Interest Expense and Non-Operating Gains/Losses = EBT (Earnings Before Taxes).
- Subtract Corporate Income Tax Expense = Net Income (Bottom Line / Earnings Available to Shareholders).

**After:**
- Gross Revenue minus Returns, Allowances, and Discounts = Net Revenue (Top Line).
- Subtract Cost of Goods Sold (COGS: direct raw materials, direct labor, manufacturing overhead) = Gross Profit.
- Gross Margin % = Gross Profit / Net Revenue.
- Subtract Operating Expenses (SG&A, R&D, Sales & Marketing, Admin) = EBITDA.
- Subtract Depreciation (PP&E) and Amortization (Intangibles) = EBIT (Operating Income).
- Add/Subtract Net Interest Expense and Non-Operating Gains/Losses = EBT (Earnings Before Taxes).
- Subtract Corporate Income Tax Expense = Net Income (Bottom Line / Earnings Available to Shareholders).

---

## LBO Basics (Leveraged Buyout)

### example
**Before:** A PE firm buys a stable, cash-generative business using 70% debt and 30% equity, uses the company's own cash flow to pay down that debt over 5 years, then sells it - the equity return comes from debt paydown plus any operational improvement or multiple expansion.

**After:** A PE firm buys a stable, cash-generative business using 70% debt and 30% equity, uses the company's own cash flow to pay down that debt over 5 years, then sells it - the equity return comes from debt paydown plus any operational improvement or multiple expansion (an increase in the valuation multiple between entry and exit).

### when_to_use
**Before:** Use it for "why would a PE firm buy this company" or "what makes a good LBO target" questions.

**After:** Use it for "why would a PE firm buy this company" or "what makes a good LBO (Leveraged Buyout, an acquisition funded largely with borrowed money) target" questions.

### when_not_to_use
**Before:** Do not use it as a general M&A framework - a strategic acquirer buying for synergies is a different question than a financial sponsor buying for a leveraged return.

**After:** Do not use it as a general M&A (Mergers and Acquisitions) framework - a strategic acquirer buying for synergies (financial benefits from combining two companies) is a different question than a financial sponsor buying for a leveraged return.

---

## Terminal Value (Perpetuity vs Exit Multiple)

### description
**Before:** Represents the ongoing enterprise value beyond the discrete 5-10 year projection horizon, typically accounting for 65% to 85% of total DCF value.

**After:** Represents the ongoing enterprise value beyond the discrete 5-10 year projection horizon, typically accounting for 65% to 85% of total DCF (a method valuing a company from its projected future cash flows) value.

### example
**Before:** Year 5 FCF is $40M, WACC is 9%, and g is 2.5%. Year 6 FCF = $40M × 1.025 = $41M. Terminal Value = $41M / (0.09 - 0.025) = $630.8M. Discounted at 9% over 5 years: PV(TV) = $630.8M / (1.09)^5 = $409.9M.

**After:** Year 5 FCF is $40M, WACC (Weighted Average Cost of Capital, the average rate a company pays to finance its assets) is 9%, and g is 2.5%. Year 6 FCF = $40M × 1.025 = $41M. Terminal Value = $41M / (0.09 - 0.025) = $630.8M. Discounted at 9% over 5 years: PV(TV) = $630.8M / (1.09)^5 = $409.9M.

### steps
**Before:**
- Project discrete cash flows until the company reaches steady-state growth and sustainable margins.
- Method 1 — Gordon Growth (Perpetual Growth): TV = [FCF_final × (1 + g)] / (WACC - g), where g is long-term sustainable GDP growth (typically 2-3%).
- Method 2 — Exit Multiple Method: TV = Projected Year N EBITDA × Target EV/EBITDA Multiple based on mature peer multiples.
- Discount Terminal Value back to Present Value: PV(TV) = TV / (1 + WACC)^N.
- Cross-check: Calculate the implied perpetual growth rate from the exit multiple, and implied multiple from Gordon Growth to test realism.

**After:**
- Project discrete cash flows until the company reaches steady-state growth and sustainable margins.
- Method 1 — Gordon Growth (Perpetual Growth): TV = [FCF_final × (1 + g)] / (WACC - g), where g is long-term sustainable GDP growth (typically 2-3%).
- Method 2 — Exit Multiple Method: TV = Projected Year N EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization) × Target EV (Enterprise Value, a measure of total company value)/EBITDA Multiple based on mature peer multiples.
- Discount Terminal Value back to Present Value: PV(TV) = TV / (1 + WACC)^N.
- Cross-check: Calculate the implied perpetual growth rate from the exit multiple, and implied multiple from Gordon Growth to test realism.

---

## WACC (Weighted Average Cost of Capital)

### when_to_use
**Before:** Use in all DCF valuations to discount enterprise-level cash flows to present value, and in corporate finance to evaluate IRR vs hurdle rate.

**After:** Use in all DCF (a method valuing a company from its projected future cash flows) valuations to discount enterprise-level cash flows to present value, and in corporate finance to evaluate IRR (the annualized percentage return expected from an investment) vs hurdle rate.

### when_not_to_use
**Before:** Do not use WACC to discount Levered Free Cash Flow (FCFE); use Cost of Equity (Ke) for levered equity flows.

**After:** Do not use WACC (Weighted Average Cost of Capital, the blended rate a company pays to finance its assets) to discount Levered Free Cash Flow (FCFE); use Cost of Equity (Ke) for levered equity flows.

### steps
**Before:**
- Determine target capital structure weights: Equity weight (E/V) and Debt weight (D/V) at market values.
- Calculate Cost of Equity (Ke) using CAPM: Ke = Rf + β × ERP.
- Determine Pre-tax Cost of Debt (Kd) based on effective yield-to-maturity of company bonds or current credit rating spread.
- Apply the corporate interest tax shield: After-tax Cost of Debt = Kd × (1 - Marginal Tax Rate).
- Compute WACC = [E/V × Ke] + [D/V × Kd × (1 - t)].
- Use WACC as the hurdle rate for capital budgeting decisions and the discount rate for Unlevered Free Cash Flow (FCFF) in a DCF.

**After:**
- Determine target capital structure weights: Equity weight (E/V) and Debt weight (D/V) at market values.
- Calculate Cost of Equity (Ke) using CAPM (Capital Asset Pricing Model, a formula estimating the expected return on equity based on risk): Ke = Rf + β (Beta, a measure of how much a stock's price moves relative to the broader market) × ERP (Equity Risk Premium, the excess return investing in stocks offers over risk-free bonds).
- Determine Pre-tax Cost of Debt (Kd) based on effective yield-to-maturity of company bonds or current credit rating spread.
- Apply the corporate interest tax shield: After-tax Cost of Debt = Kd × (1 - Marginal Tax Rate).
- Compute WACC = [E/V × Ke] + [D/V × Kd × (1 - t)].
- Use WACC as the hurdle rate for capital budgeting decisions and the discount rate for Unlevered Free Cash Flow (FCFF) in a DCF.

---

## Working Capital & Cash Conversion Cycle

### steps
**Before:**
- Calculate Days Inventory Outstanding (DIO) = (Average Inventory / COGS) × 365 (how long inventory sits before selling).
- Calculate Days Sales Outstanding (DSO) = (Accounts Receivable / Total Credit Sales) × 365 (how long customers take to pay).
- Calculate Days Payable Outstanding (DPO) = (Accounts Payable / Cost of Goods Sold) × 365 (how long company takes to pay suppliers).
- Calculate Cash Conversion Cycle (CCC) = DIO + DSO - DPO.
- Calculate Operating Net Working Capital (NWC) = Current Operating Assets (excl. cash) - Current Operating Liabilities (excl. debt).
- A lower or negative CCC means the company generates cash from customers before paying vendors, funding growth for free (e.g., Amazon, Apple).

**After:**
- Calculate Days Inventory Outstanding (DIO, the average number of days inventory is held before being sold) = (Average Inventory / COGS) × 365 (how long inventory sits before selling).
- Calculate Days Sales Outstanding (DSO, the average number of days it takes to collect cash after a credit sale) = (Accounts Receivable / Total Credit Sales) × 365 (how long customers take to pay).
- Calculate Days Payable Outstanding (DPO, the average number of days a company takes to pay its suppliers) = (Accounts Payable / Cost of Goods Sold) × 365 (how long company takes to pay suppliers).
- Calculate Cash Conversion Cycle (CCC, the net time it takes to convert cash outflows into cash inflows from operations) = DIO + DSO - DPO.
- Calculate Operating Net Working Capital (NWC, the capital required for day-to-day operations excluding cash and debt) = Current Operating Assets (excl. cash) - Current Operating Liabilities (excl. debt).
- A lower or negative CCC means the company generates cash from customers before paying vendors, funding growth for free (e.g., Amazon, Apple).

---

# Prompt 5 Report: Category Formula Testing Against Moroccan Fatwa

Date: 2026-03-15  
Scope: Detailed calculator category behavior (`salary`, `livestock`, `produce`, `agri_other`, `trade_sector`, `industrial_sector`, `debt`)  
Primary fatwa source: Arabic fatwa `.docx` under `c:\projects\zakathub` (`تقديــــــم الفتوى.docx`)  
Helper source: `c:\projects\zakathub\Academic Analytical Summary of the Moroccan Fatwa on Zakat.docx`

## Evidence Used

- Fatwa text extraction from Arabic source (`word/document.xml` nodes) with direct clause checks.
- Calculation code and eligibility/debt aggregation logic:
  - `src/lib/zakat-calculation/salary.ts`
  - `src/lib/zakat-calculation/produce.ts`
  - `src/lib/zakat-calculation/livestock.ts`
  - `src/lib/zakat-calculation/debt.ts`
  - `src/lib/zakat-calculation/category-rules.ts`
  - `src/lib/zakat-calculation/hawl.ts`
  - `src/lib/zakat-calculation/detailedAggregation.ts`
  - `src/app/(public)/calculate/detailed.tsx`
- Automated tests (all passing):
  - `npx jest --runInBand src/tests/unit/categoryRules.test.ts src/tests/unit/hawl.test.ts src/tests/unit/detailedAggregation.test.ts src/tests/unit/salaryCalculation.test.ts src/tests/unit/produceCalculation.test.ts src/tests/unit/livestockCalculation.test.ts src/tests/unit/debtCalculation.test.ts`
  - `npx jest --runInBand src/tests/screens/DetailedCalculateScreen.test.tsx`
- Live UI check on `http://localhost:8081/calculate/detailed` (category debt-impact badges and detailed flow availability confirmed).

## Fatwa Clauses Checked Explicitly (Arabic -> English sense)

- Crops timing: zakat on crops is due at harvest/fruit picking.
- Livestock timing: livestock zakat is due after passage of a year (hawl).
- Offspring rule: offspring in livestock follow the hawl of their mothers.
- Debt categories: recoverable debt is handled differently from doubtful/unrecoverable debt.
- Debt deduction from owned base: debts you owe are deducted from your owned zakatable base; if remaining base stays at nisab, zakat is due.
- Due-now variance by category type is explicit in fatwa timing section.

## Category Results

## 1) `salary`

### App behavior observed

- **Raw category amount**: net savings = income minus living expense (annual or monthly mode), then 2.5% if net >= monetary nisab.
- **Hawl/event eligibility**: `hawl_required`; due-now only when hawl complete from start date + 354 days.
- **Debt adjustment**: debt-adjustable category (`debtAdjustable: true`), but only when due-now.
- **Final zakat due now**: included in due-now money pool, then impacted by debt adjustment and final nisab check.

### Expected fatwa/product behavior

- Service/salary zakat applies to retained net savings after essential expenses.
- 2.5% rate and nisab threshold apply.
- Hawl model for money categories applies in detailed flow.

### Verdict

`matches`

## 2) `livestock`

### App behavior observed

- **Raw category amount**: in-kind schedule by species/count (camels/cattle/sheep-goats thresholds) with optional user cash estimate.
- **Hawl/event eligibility**: `hawl_required`; due-now only if hawl completed.
- **Debt adjustment**: not debt-adjustable.
- **Final zakat due now**: enters due-now special group only when due-now; cash total uses user cash estimate, while in-kind due remains represented separately.

### Expected fatwa/product behavior

- Livestock is schedule-based (not flat 2.5%).
- Due after hawl.
- Offspring follows mothers' hawl.
- Cash-equivalent payment is allowed by fatwa framing.

### Verdict

`acceptable simplification`

Reason: offspring rule is disclosed in UI text and consistent with a shared hawl date model, but there is no explicit per-animal birth-tracking branch.

## 3) `produce`

### App behavior observed

- **Raw category amount**:
  - Harvest mode: crop nisab = 653kg; 10% natural / 5% paid irrigation, output in kg due.
  - Trade mode: market value with monetary nisab, 2.5%.
- **Hawl/event eligibility**: `event_based`; due-now by event date (required and validated).
- **Debt adjustment**: not debt-adjustable in either mode.
- **Final zakat due now**:
  - Future event date => not due, excluded.
  - Due-now harvest can show non-cash due (kg) and optional cash estimate.
  - Due-now trade mode contributes as independent non-debt-adjustable cash due.

### Expected fatwa/product behavior

- Crops due at harvest with 10%/5% rates and 653kg crop nisab.
- Crops held for trade are treated at 2.5% by value.
- Categories can be entered but not yet payable depending on due timing.

### Verdict

`acceptable simplification`

Reason: produce trade-mode stays under event-based timing rather than hawl-required trade timing; this is coherent with current product behavior but is stricter-fatwa-sensitive depending on interpretation.

## 4) `agri_other`

### App behavior observed

- **Raw category amount**: net value = market value - operating costs; 2.5% if net >= monetary nisab.
- **Hawl/event eligibility**: `hawl_required`.
- **Debt adjustment**: debt-adjustable when due-now.
- **Final zakat due now**: included in due-now money pool only if due-now.

### Expected fatwa/product behavior

- Non-grains/fruit agricultural products valued by price (not weight), 2.5%.
- Costs can be deducted before zakat on net commercial value.

### Verdict

`matches`

## 5) `trade_sector`

### App behavior observed

- **Raw category amount**: net commercial value = assets value - due operating costs; 2.5% if net >= nisab.
- **Hawl/event eligibility**: `hawl_required`.
- **Debt adjustment**: debt-adjustable when due-now.
- **Final zakat due now**: contributes to due-now money base and is affected by debt adjustment.

### Expected fatwa/product behavior

- Trade assets valued; due costs deducted (wages/rent/taxes due); 2.5%.
- Trade zakat tied to hawl and due-now filtering.

### Verdict

`matches`

## 6) `industrial_sector`

### App behavior observed

- **Raw category amount**: same net-value logic as trade in implementation (market value - production/operating costs), 2.5% if >= nisab.
- **Hawl/event eligibility**: `hawl_required`.
- **Debt adjustment**: debt-adjustable when due-now.
- **Final zakat due now**: included in due-now money pool and debt-adjusted.

### Expected fatwa/product behavior

- Industrial inventory/business value follows trade-like net-value model.
- Deduct production costs; apply 2.5%; hawl required.

### Verdict

`matches`

## 7) `debt`

### App behavior observed

- **Raw category amount**: adjustment values captured as:
  - collectible receivables current (+)
  - doubtful receivables (recorded, excluded from math)
  - debts owed due now (-)
  - net adjustment = collectible - owed due now
- **Hawl/event eligibility**: `adjustment` mode; debt row itself is not a payable zakat category.
- **Debt adjustment**: applied only when a positive eligible due-now money pool exists.
- **Final zakat due now**:
  - cannot create payable zakat by itself,
  - base is clamped to zero when negative,
  - does not alter livestock/produce or not-due items,
  - affects due-now money categories only.

### Expected fatwa/product behavior

- Debt is an adjustment, not standalone zakat due.
- Doubtful receivables deferred until collection.
- Debts owed reduce eligible owned wealth.
- Recoverable receivables count (with jurisprudential timing nuance).

### Verdict

`acceptable simplification`

Reason: app does not model the fatwa's near-hawl vs far-from-hawl branch for collectible receivables; it uses one current-cycle collectible input.

## Required Alignment Checks (Pass/Fail/Simplification)

- Crops due at harvest/event time: **PASS** (`produce` event-based due-now + future event exclusion test)
- Livestock due after hawl: **PASS** (`livestock` hawl gating in logic + screen tests)
- Offspring note for livestock: **ACCEPTABLE SIMPLIFICATION** (note present; no separate offspring timing model)
- Debt as adjustment, not standalone category: **PASS**
- Doubtful receivables excluded until collected: **PASS**
- Debts owed reduce eligible money base: **PASS**
- Categories may be entered but not all payable now: **PASS** (hawl/event due-now filtering and not-due grouping)

## Mismatches and Impact

- No hard mismatch found against the app's agreed interpretation baseline.
- Simplification risks to monitor:
  - `produce` trade-mode timing may differ from stricter trade-hawl readings in some jurisprudential interpretations.
  - `debt` receivable timing does not branch on proximity-to-hawl; this may over/under-include in edge cases if users do not input conservatively.

## Final Assessment

- Overall status: **Aligned with product interpretation, with documented acceptable simplifications.**
- Formula, due-now gating, debt-scoping, and final payable behavior are internally consistent and strongly covered by automated tests.

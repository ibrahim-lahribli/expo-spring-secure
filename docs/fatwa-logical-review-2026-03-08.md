# Full Logical Review: reactNativePro vs Fatwa
Date: 2026-03-08
Source fatwa: `C:\projects\zakathub\تقديــــــم الفتوى.docx`
Scope: strict fatwa compliance + whole-app logical review

## 1) Canonical Fatwa Checklist (Atomic Rules)

### `zakatable_assets`
- `ZA-001` (`mandatory_behavior`): Crop zakat on grains/fruits uses crop nisab (653kg) with 10% natural watering and 5% paid irrigation.
- `ZA-002` (`mandatory_behavior`): Produce held for trade is treated as trade goods with monetary nisab and 2.5%.
- `ZA-003` (`mandatory_behavior`): Livestock zakat follows in-kind schedules with species thresholds (camels, cattle, sheep/goats).
- `ZA-004` (`mandatory_behavior`): Monetary/assets zakat uses gold/silver nisab references.
- `ZA-005` (`mandatory_behavior`): Services/salary zakat applies to retained net wealth after essential expense deduction.
- `ZA-006` (`mandatory_behavior`): Trade sector zakat applies after deductible management obligations.
- `ZA-007` (`mandatory_behavior`): Industrial sector zakat applies after deductible production obligations.
- `ZA-008` (`mandatory_behavior`): Debt rulings require classification: collectible receivables, doubtful receivables, and debts owed by payer.
- `ZA-009` (`mandatory_behavior`): Mineral extraction has immediate/near-immediate treatment (not generic annual-only).
- `ZA-010` (`mandatory_behavior`): Forest/fishing/new productive sectors must be covered by equivalent rules.

### `nisab_basis`
- `NB-001` (`mandatory_behavior`): Silver (595g) is the proposed default reference.
- `NB-002` (`mandatory_behavior`): Gold (85g) is permitted alternative reference.
- `NB-003` (`mandatory_behavior`): Nisab values depend on current metal prices.

### `rates`
- `RT-001` (`mandatory_behavior`): 10% for naturally watered crops.
- `RT-002` (`mandatory_behavior`): 5% for paid irrigation.
- `RT-003` (`mandatory_behavior`): 2.5% for applicable trade/services/industry/monetary assets.
- `RT-004` (`mandatory_behavior`): Livestock is not flat percentage; it is schedule-based.

### `deductions`
- `DD-001` (`mandatory_behavior`): Debts currently owed are deducted before nisab check.
- `DD-002` (`mandatory_behavior`): Due operating/management/production obligations are deductible where applicable.
- `DD-003` (`mandatory_behavior`): Salary/services consider essential living expense floor (fatwa reference value 3266 MAD at issuance context).

### `timing_hawl`
- `TH-001` (`mandatory_behavior`): Crops due at harvest (can recur in same year).
- `TH-002` (`mandatory_behavior`): Livestock due after hawl.
- `TH-003` (`mandatory_behavior`): Trade/services/retained wealth due after hawl.
- `TH-004` (`mandatory_behavior`): Minerals due on extraction (delay constraints differ from standard annual assets).

### `debt_rules`
- `DR-001` (`mandatory_behavior`): Collectible receivable treatment depends on collectability/time horizon.
- `DR-002` (`mandatory_behavior`): Doubtful receivables are deferred until collection.
- `DR-003` (`mandatory_behavior`): Debts owed by payer are deducted from zakatable base.

### `recipients_eligibility`
- `RE-001` (`mandatory_disclosure`): Eligible recipients categories should be disclosed accurately.
- `RE-002` (`mandatory_disclosure`): Prioritization of poverty relief should be disclosed.
- `RE-003` (`mandatory_disclosure`): Non-eligible dependents (e.g., those financially obligatory on payer) should be disclosed.

### `exclusions`
- `EX-001` (`mandatory_disclosure`): Personal adornment jewelry exclusion should be disclosed.

### `sector_coverage`
- `SC-001` (`mandatory_behavior`): Coverage should not omit sectors explicitly discussed by fatwa (or should map them explicitly).

## 2) Rule Mapping to App Behavior (Strict)

| Rule ID | Status | Evidence |
|---|---|---|
| ZA-001 | Compliant | `src/lib/zakat-calculation/produce.ts:9`, `:10`, `:11`, `:40`, `:66` |
| ZA-002 | Partially Compliant | Trade produce 2.5% exists (`src/lib/zakat-calculation/produce.ts:12`, `:30`), but no receivable/debt classification inside produce path |
| ZA-003 | Compliant | Livestock thresholds/schedules implemented (`src/lib/zakat-calculation/livestock.ts:142`, `:144`, `:208`, `:209`, `:239`, `:240`) |
| ZA-004 | Compliant | Gold/silver basis implemented (`src/lib/zakat-calculation/nisab.ts:3`, `:4`, `:55`, `:71`) |
| ZA-005 | Partially Compliant | Salary net model + minimum expense exists (`src/lib/zakat-calculation/salary.ts:9`, `:23`, `:29`, `:32`) but hawl gating not modeled in inputs (`src/lib/zakat-calculation/types.ts:4-7`) |
| ZA-006 | Compliant | Trade sector subtracts operating costs then 2.5% (`src/app/(public)/calculate/detailed.tsx:221`, `:235`, `:236`, `:839`) |
| ZA-007 | Compliant | Industrial sector uses same net model (`src/app/(public)/calculate/detailed.tsx:850`, `:855`) |
| ZA-008 | Non-Compliant | Debt category has no computational path in detailed calculator (`src/app/(public)/calculate/detailed.tsx:877`, `:1069`, `:1175`) |
| ZA-009 | Non-Compliant | No mineral category/module detected in calculator/explanations category lists (`src/app/(public)/calculate/detailed.tsx:37`, `src/features/zakat-explanations/data.ts:12`, `:136`, `:247`, `:357`, `:466`, `:568`, `:675`) |
| ZA-010 | Partially Compliant | Broad categories exist but no explicit forest/fishing/mining logic mapping (same evidence as ZA-009) |
| NB-001 | Compliant | Silver grams/default price set (`src/lib/zakat-calculation/nisab.ts:1`, `:3`) and settings recommendation silver (`src/app/(public)/settings/index.tsx:56`) |
| NB-002 | Compliant | Gold grams/default price + selectable method (`src/lib/zakat-calculation/nisab.ts:2`, `:4`, `:55`) |
| NB-003 | Compliant | Market fetch available (`src/app/(public)/settings/index.tsx:20`, `:115`) |
| RT-001 | Compliant | 10% natural watering (`src/lib/zakat-calculation/produce.ts:10`, `:23`) |
| RT-002 | Compliant | 5% paid irrigation (`src/lib/zakat-calculation/produce.ts:11`, `:23`) |
| RT-003 | Compliant | 2.5% applied in salary/trade/quick paths (`src/lib/zakat-calculation/salary.ts:8`, `:32`; `src/app/(public)/calculate/detailed.tsx:236`; `src/components/zakat/QuickCalculatorForm.tsx:19`) |
| RT-004 | Compliant | Livestock non-percentage schedule logic (`src/lib/zakat-calculation/livestock.ts:142-252`) |
| DD-001 | Partially Compliant | Quick path deducts one debt field (`src/components/zakat/QuickCalculatorForm.tsx:18`) but no full debt classification treatment |
| DD-002 | Compliant | Trade/industry deductions modeled as operating costs (`src/app/(public)/calculate/detailed.tsx:235`, `:845`, `:861`) |
| DD-003 | Compliant | Minimum living expense default present (`src/lib/zakat-calculation/salary.ts:9`, `:23`) |
| TH-001 | Compliant | Harvest mode computes on crop quantity + rates (`src/lib/zakat-calculation/produce.ts:38-40`) |
| TH-002 | Non-Compliant | Livestock module has no hawl input/check (count only) (`src/lib/zakat-calculation/livestock.ts` public API uses only type+owned) |
| TH-003 | Non-Compliant | Trade/services/salary calculators do not model ownership duration dates (`src/lib/zakat-calculation/types.ts:4-7`, `:20-29`) |
| TH-004 | Non-Compliant | No mineral extraction timing logic exists (see ZA-009 evidence) |
| DR-001 | Non-Compliant | No collectible receivable input/logic in quick or detailed computational models (`src/components/zakat/QuickCalculatorForm.tsx:14-19`, `src/app/(public)/calculate/detailed.tsx:877`) |
| DR-002 | Non-Compliant | No doubtful receivable workflow/fields; only text disclosure in debt info (`src/app/(public)/calculate/detailed.tsx:1072-1077`, `src/i18n/locales/en/common.json:434`) |
| DR-003 | Partially Compliant | Deduct debt exists in quick (`src/components/zakat/QuickCalculatorForm.tsx:18`) but detailed debt engine is absent |
| RE-001 | Non-Compliant | No dedicated recipients model/disclosure screen found in app copy/data (`src/features/zakat-explanations/data.ts` categories list excludes recipient section) |
| RE-002 | Non-Compliant | Poverty-priority disclosure absent (no matching content found in localization/explanations) |
| RE-003 | Non-Compliant | Dependent ineligibility disclosure absent (no matching content found) |
| EX-001 | Non-Compliant | UI guidance says include jewelry value (`src/i18n/locales/en/common.json:80`) while fatwa excludes personal adornment jewelry from zakat base |
| SC-001 | Partially Compliant | Major sectors present, but no explicit mineral/forest/fishing handling (`src/features/zakat-explanations/data.ts:12`, `:136`, `:247`, `:357`, `:466`, `:568`, `:675`) |

## 3) Severity-Ranked Findings

### Critical
1. Debt jurisprudence is represented but not executable in detailed flow.
- Impact: Users can believe debt rules are being applied while calculator does nothing for debt category.
- Repro: Open detailed calculator, select debt category, observe informational cards only and no add/compute path.
- Evidence: `src/app/(public)/calculate/detailed.tsx:877`, `:1069`, `:1175`.
- Fatwa mapping: `ZA-008`, `DR-001`, `DR-002`, `DR-003`.

### High
2. Hawl/timing conditions are not modeled for most monetary/business categories.
- Impact: Over/under-estimation risk because annual eligibility is text-only, not enforced by input logic.
- Repro: Any salary/trade/industry calculation can be run without any date/holding-period input.
- Evidence: `src/lib/zakat-calculation/types.ts:4-7`, `:20-29`; `src/lib/zakat-calculation/salary.ts:27-32`; `src/app/(public)/calculate/detailed.tsx:221-241`.
- Fatwa mapping: `TH-002`, `TH-003`.

3. Jewelry guidance conflicts with fatwa exclusion.
- Impact: Users may include personal adornment jewelry in quick calculation contrary to fatwa exclusion.
- Repro: Quick calculator gold field description explicitly prompts jewelry inclusion.
- Evidence: `src/i18n/locales/en/common.json:80`; quick formula includes entire `goldValue` (`src/components/zakat/QuickCalculatorForm.tsx:18`).
- Fatwa mapping: `EX-001`.

4. Missing explicit mineral extraction sector and timing logic.
- Impact: Important fatwa asset class cannot be calculated with correct due-timing semantics.
- Repro: Review available categories in detailed and explanations; no minerals category.
- Evidence: `src/app/(public)/calculate/detailed.tsx:37`; `src/features/zakat-explanations/data.ts:12`, `:136`, `:247`, `:357`, `:466`, `:568`, `:675`.
- Fatwa mapping: `ZA-009`, `TH-004`, `SC-001`.

### Medium
5. Recipients/eligibility constraints are not surfaced despite being core fatwa outcomes.
- Impact: App computes due amounts but omits who can legally receive zakat and disallowed recipient relations.
- Repro: Navigate learning/explanations; no recipient-class section and no dependent-ineligibility guidance.
- Evidence: category coverage in `src/features/zakat-explanations/data.ts:12-675` lacks recipients module.
- Fatwa mapping: `RE-001`, `RE-002`, `RE-003`.

6. Preference state has unused fields (date/reminder/theme) with no runtime behavior.
- Impact: Users may assume features exist; increases product inconsistency risk.
- Repro: See persisted fields without corresponding functional usage.
- Evidence: defined in `src/store/appPreferencesStore.ts:15-18`, `:41-43`; no functional use outside settings/preferences grep.
- Non-fatwa logical risk.

7. Debt treatment consistency gap between quick and detailed experiences.
- Impact: Same user can get materially different treatment depending on chosen flow.
- Repro: Quick supports debt deduction; detailed debt category is informational only.
- Evidence: quick deduction formula `src/components/zakat/QuickCalculatorForm.tsx:18`; detailed debt no-compute `src/app/(public)/calculate/detailed.tsx:877`.
- Fatwa mapping: `DD-001`, `DR-*`.

### Low
8. “Auto” method is not dynamic; it is hardcoded to silver recommendation.
- Impact: Label suggests adaptive behavior but method is fixed recommendation.
- Repro: Select auto; method is set to constant `silver`.
- Evidence: `src/app/(public)/settings/index.tsx:56`, `:72-78`.
- Non-fatwa product clarity risk.

## 4) Whole-App Logical Pass (Non-Fatwa)
- History persistence and rendering are coherent across list/detail/PDF and preserve non-cash suffix context.
  - `src/features/history/types.ts:16-18`
  - `src/app/(public)/history/index.tsx:91-94`
  - `src/app/(public)/history/[id].tsx:72-75`
  - `src/features/history/pdf.ts:51-54`
- Nisab setting changes trigger recalculation for existing detailed line items.
  - `src/app/(public)/calculate/detailed.tsx:398-492`
- Quick draft recovery behavior is coherent.
  - `src/store/quickCalculationDraftStore.ts`
  - `src/components/zakat/QuickCalculatorForm.tsx:51-65`

## 5) Prioritized Remediation Roadmap

1. Build debt calculation engine (highest priority)
- Add typed debt inputs: collectible receivables, doubtful receivables, debts owed (due/near due).
- Implement deterministic rules matching fatwa debt clauses.
- Wire into detailed calculator with addable debt line item.
- Add unit + screen tests for all debt branches.

2. Introduce hawl/timing model
- Add optional/required timing fields per category where fatwa requires hawl/date gates.
- Enforce timing gates in salary/trade/industry/livestock paths.
- Keep crops as harvest-time model.

3. Correct jewelry guidance and asset-scope copy
- Update quick gold field wording to separate personal adornment jewelry vs zakatable holdings.
- Add explicit exclusion notice with local-fatwa framing.

4. Add missing sector modules/mappings
- Introduce minerals as explicit category with extraction timing behavior.
- Add explicit mapping notes for forest/fishing/new activities to existing trade/industry logic when not separate.

5. Add recipients/eligibility guidance module
- Add a read-only guidance section covering recipient categories, priority, and non-eligible dependents.
- Link from calculation result screen to reduce payout misuse.

6. Product consistency cleanup
- Either implement or remove currently unused preferences (date/reminder/theme) from persisted public settings.

## 6) Test Additions Required
- Unit: debt classification and calculation (`collectible`, `doubtful`, `owed-by-user`).
- Unit: hawl gating for salary/trade/industry/livestock.
- Screen: detailed debt category can compute and save line items.
- Consistency: copy-vs-logic assertions (jewelry exclusion, debt handling statements).
- Regression: quick vs detailed parity for shared concepts (debt deduction semantics).

## 7) Done Criteria Check
- Every rule ID above has explicit status and evidence: **Done**.
- Every Critical/High finding has concrete fix direction + test scenario: **Done**.
- Unresolved ambiguity in recommendation set: **None blocking** (policy-level choices remain: strict mandatory hawl UX vs optional expert mode).

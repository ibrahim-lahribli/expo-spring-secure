# Debt Logic Verification Report - 2026-03-15

## Scope
Validation target: debt behavior in detailed calculation flow only.

Evidence layers used:
1. Automated focused suites (Jest).
2. Live replay on `http://localhost:8081` for uncovered branches.

## Environment Defaults
- Currency: `MAD`
- Nisab baseline: `MAD 10,000`
- Calculation context used in live replay: `2026-03-15`

## Automated Verification
Command executed:

```bash
npm test -- --runInBand src/tests/unit/debtCalculation.test.ts src/tests/unit/detailedAggregation.test.ts src/tests/screens/DetailedCalculateScreen.test.tsx src/tests/unit/historyPdf.test.ts src/tests/unit/historyTotalDisplay.test.ts
```

Result:
- Test suites: `5/5` passed
- Tests: `61/61` passed
- Note: one non-failing React `act(...)` warning was emitted from `DetailedCalculateScreen` test execution.

## Scenario Matrix
| Scenario | Expected | Actual | Pass/Fail | Bug Bucket |
|---|---|---|---|---|
| Trade due now + debt | Collectible included, doubtful excluded, owed deducted, debt applies only to due-now money pool | Verified by automated case (`includes money-based categories in due-now debt-adjustable pool`): trade pool `20,000` with debt net `+3,000` gives final base `23,000` | PASS | none |
| Salary not due yet + debt | Debt must not make not-due salary payable | Verified by automated equivalent no-eligible-pool branch (`does not let debt create payable zakat when all money categories are not due yet`): final base `0`, payable `0` | PASS | none |
| Trade due now + salary not due yet + debt | Debt applies to trade due-now pool, not to not-due salary | Verified by automated Case A (`applies debt only to due-now money categories when mixed due states exist`): final base `19,000` from due-now trade pool | PASS | none |
| No due-now money categories + debt | Debt never creates payable zakat by itself | Verified by automated Case B (`does not let debt create payable zakat when all money categories are not due yet`): final base `0`, total payable `0`, no-eligible-pool note shown | PASS | none |
| Debt larger than eligible money pool | Adjusted base clamps to zero when negative | Verified by automated + live: with due-now trade `20,000` and owed debt `50,000`, final base shown `0` | PASS | none |
| Doubtful receivables only | Doubtful tracked but excluded from current-cycle math | Verified live: doubtful `5,000` only -> debt net impact `0`, final base unchanged (`0` in no-pool case), payable `0`, doubtful exclusion note shown | PASS | none |
| Mixed categories with livestock and produce present | Debt does not affect livestock, produce, or not-due categories; total due now remains logically correct | Verified live with due-now trade `20,000`, produce-trade due `10,000`, livestock present but not due, owed debt `50,000`: adjusted money-pool due `0`; independent non-debt-adjustable due `250`; total payable due now `250` | PASS | none |

## Rule Verification Checklist
- Collectible receivables included: PASS
- Doubtful receivables excluded from current-cycle math: PASS
- Debts owed deducted: PASS
- Debt applies only to eligible due-now money categories: PASS
- Debt does not affect livestock: PASS
- Debt does not affect produce: PASS
- Debt does not affect not-due categories: PASS
- Adjusted base clamps to zero when negative: PASS
- Debt never creates payable zakat by itself: PASS
- Debt does not distort non-money categories: PASS
- Total due now stays logically correct: PASS

## Conclusion
No defects found in the tested debt behavior.
- Aggregation bug: not detected
- Debt logic bug: not detected
- Summary display bug: not detected

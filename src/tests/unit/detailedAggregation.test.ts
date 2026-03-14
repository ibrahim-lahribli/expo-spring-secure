import {
  calculateDueNowMoneyBase,
  calculateIndependentCashDue,
  resolveDetailedLineItemMeta,
  shouldShowBelowNisabAfterDebt,
} from "../../lib/zakat-calculation/detailedAggregation";

describe("detailed aggregation", () => {
  it("maps money-based categories as debt-adjustable and due now", () => {
    expect(resolveDetailedLineItemMeta("salary")).toEqual({ dueNow: true, debtAdjustable: true });
    expect(resolveDetailedLineItemMeta("agri_other")).toEqual({ dueNow: true, debtAdjustable: true });
    expect(resolveDetailedLineItemMeta("trade_sector")).toEqual({ dueNow: true, debtAdjustable: true });
    expect(resolveDetailedLineItemMeta("industrial_sector")).toEqual({ dueNow: true, debtAdjustable: true });
  });

  it("maps livestock, produce, and debt as non-debt-adjustable", () => {
    expect(resolveDetailedLineItemMeta("livestock")).toEqual({ dueNow: true, debtAdjustable: false });
    expect(resolveDetailedLineItemMeta("produce")).toEqual({ dueNow: true, debtAdjustable: false });
    expect(resolveDetailedLineItemMeta("debt")).toEqual({ dueNow: true, debtAdjustable: false });
  });

  it("sums only due-now and debt-adjustable wealth", () => {
    const total = calculateDueNowMoneyBase([
      { meta: { dueNow: true, debtAdjustable: true }, result: { totalWealth: 12000 } },
      { meta: { dueNow: false, debtAdjustable: true }, result: { totalWealth: 9000 } },
      { meta: { dueNow: true, debtAdjustable: false }, result: { totalWealth: 7000 } },
      { meta: { dueNow: true, debtAdjustable: true }, result: { totalWealth: 3000 } },
    ]);

    expect(total).toBe(15000);
  });

  it("clamps invalid or negative wealth to zero during aggregation", () => {
    const total = calculateDueNowMoneyBase([
      { meta: { dueNow: true, debtAdjustable: true }, result: { totalWealth: -10 } },
      { meta: { dueNow: true, debtAdjustable: true }, result: { totalWealth: Number.NaN } },
      { meta: { dueNow: true, debtAdjustable: true }, result: { totalWealth: 50 } },
    ]);

    expect(total).toBe(50);
  });

  it("sums independent non-debt-adjustable cash due while excluding debt and non-due rows", () => {
    const total = calculateIndependentCashDue([
      {
        category: "produce",
        meta: { dueNow: true, debtAdjustable: false },
        result: { totalZakat: 250 },
      },
      {
        category: "livestock",
        meta: { dueNow: true, debtAdjustable: false },
        result: { totalZakat: 300 },
        dueItems: ["1 sheep"],
      },
      {
        category: "livestock",
        meta: { dueNow: true, debtAdjustable: false },
        result: { totalZakat: 900 },
        dueItems: [],
      },
      {
        category: "debt",
        meta: { dueNow: true, debtAdjustable: false },
        result: { totalZakat: 2000 },
      },
      {
        category: "salary",
        meta: { dueNow: true, debtAdjustable: true },
        result: { totalZakat: 100 },
      },
    ]);

    expect(total).toBe(550);
  });

  it("shows below-nisab-after-debt only when debt causes a crossing from above to below nisab", () => {
    expect(
      shouldShowBelowNisabAfterDebt({
        hasDebtLineItem: true,
        cashBaseBeforeDebt: 10000,
        finalZakatableBase: 6000,
        monetaryNisab: 7000,
        debtNetImpact: -2000,
      }),
    ).toBe(true);

    expect(
      shouldShowBelowNisabAfterDebt({
        hasDebtLineItem: true,
        cashBaseBeforeDebt: 6000,
        finalZakatableBase: 5000,
        monetaryNisab: 7000,
        debtNetImpact: -1000,
      }),
    ).toBe(false);

    expect(
      shouldShowBelowNisabAfterDebt({
        hasDebtLineItem: true,
        cashBaseBeforeDebt: 10000,
        finalZakatableBase: 6000,
        monetaryNisab: 7000,
        debtNetImpact: 0,
      }),
    ).toBe(false);
  });
});

import {
  calculateDueNowMoneyBase,
  calculateIndependentCashDue,
  hasEligibleDueNowMoneyPool,
  resolveDetailedLineItemMeta,
  splitHawlAwareLineItems,
  shouldShowBelowNisabAfterDebt,
} from "../../lib/zakat-calculation/detailedAggregation";
import type { DetailedCalculationContext } from "../../lib/zakat-calculation/detailedCalculationContext";

const context: DetailedCalculationContext = {
  calculationDate: "2026-03-14",
};

describe("detailed aggregation", () => {
  it("maps money-based categories as debt-adjustable and not due when hawl date is missing", () => {
    expect(resolveDetailedLineItemMeta("salary", context)).toEqual({
      obligationMode: "hawl_required",
      dueNow: false,
      debtAdjustable: true,
    });
    expect(resolveDetailedLineItemMeta("agri_other", context)).toEqual({
      obligationMode: "hawl_required",
      dueNow: false,
      debtAdjustable: true,
    });
    expect(resolveDetailedLineItemMeta("trade_sector", context)).toEqual({
      obligationMode: "hawl_required",
      dueNow: false,
      debtAdjustable: true,
    });
    expect(resolveDetailedLineItemMeta("industrial_sector", context)).toEqual({
      obligationMode: "hawl_required",
      dueNow: false,
      debtAdjustable: true,
    });
  });

  it("maps livestock, produce, and debt as non-debt-adjustable", () => {
    expect(resolveDetailedLineItemMeta("livestock", context)).toEqual({
      obligationMode: "hawl_required",
      dueNow: false,
      debtAdjustable: false,
    });
    expect(resolveDetailedLineItemMeta("produce", context)).toEqual({
      obligationMode: "event_based",
      dueNow: false,
      debtAdjustable: false,
      eventDate: undefined,
    });
    expect(resolveDetailedLineItemMeta("debt", context)).toEqual({
      obligationMode: "adjustment",
      dueNow: true,
      debtAdjustable: false,
    });
  });

  it("uses hawl completion to mark hawl-required categories as due or not due when start date exists", () => {
    expect(
      resolveDetailedLineItemMeta("salary", {
        calculationDate: "2026-12-20",
      }, {
        hawlStartDate: "2026-01-01",
      }),
    ).toEqual({
      obligationMode: "hawl_required",
      hawlStartDate: "2026-01-01",
      hawlDueDate: "2026-12-21",
      hawlCompleted: false,
      dueNow: false,
      debtAdjustable: true,
    });
    expect(
      resolveDetailedLineItemMeta("salary", {
        calculationDate: "2026-12-21",
      }, {
        hawlStartDate: "2026-01-01",
      }),
    ).toEqual({
      obligationMode: "hawl_required",
      hawlStartDate: "2026-01-01",
      hawlDueDate: "2026-12-21",
      hawlCompleted: true,
      dueNow: true,
      debtAdjustable: true,
    });
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

  it("detects whether a due-now money pool is eligible for debt application", () => {
    expect(
      hasEligibleDueNowMoneyPool([
        { meta: { dueNow: true, debtAdjustable: true }, result: { totalWealth: 0 } },
      ]),
    ).toBe(false);

    expect(
      hasEligibleDueNowMoneyPool([
        { meta: { dueNow: true, debtAdjustable: true }, result: { totalWealth: 1 } },
      ]),
    ).toBe(true);
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

  it("splits line items into due-now money, due-now special, and not-due groups", () => {
    const groups = splitHawlAwareLineItems([
      {
        category: "salary",
        meta: { dueNow: true, debtAdjustable: true },
        result: { totalWealth: 1000, totalZakat: 25 },
      },
      {
        category: "produce",
        meta: { dueNow: true, debtAdjustable: false },
        result: { totalWealth: 1000, totalZakat: 30 },
      },
      {
        category: "trade_sector",
        meta: { dueNow: false, debtAdjustable: true },
        result: { totalWealth: 5000, totalZakat: 125 },
      },
      {
        category: "debt",
        meta: { dueNow: true, debtAdjustable: false },
        result: { totalWealth: 0, totalZakat: 0 },
      },
    ]);

    expect(groups.moneyDueNowItems).toHaveLength(1);
    expect(groups.specialDueNowItems).toHaveLength(1);
    expect(groups.notDueItems).toHaveLength(1);
    expect(groups.specialDueNowItems[0]?.category).toBe("produce");
  });

  it("classifies livestock by hawl completion state across due-now special and not-due groups", () => {
    const groups = splitHawlAwareLineItems([
      {
        category: "livestock",
        meta: { dueNow: true, debtAdjustable: false },
        result: { totalWealth: 0, totalZakat: 100 },
        dueItems: ["1 sheep"],
      },
      {
        category: "livestock",
        meta: { dueNow: false, debtAdjustable: false },
        result: { totalWealth: 0, totalZakat: 0 },
        dueItems: [],
      },
    ]);

    expect(groups.specialDueNowItems).toHaveLength(1);
    expect(groups.specialDueNowItems[0]?.category).toBe("livestock");
    expect(groups.notDueItems).toHaveLength(1);
    expect(groups.notDueItems[0]?.category).toBe("livestock");
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

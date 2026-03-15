import type { ZakatCategory } from "./category-rules";
import type { DetailedCalculationContext } from "./detailedCalculationContext";
import {
  evaluateEligibility,
  type EvaluateEligibilityInput,
  type LineItemMeta,
} from "./hawl";

export type DetailedLineItemMeta = LineItemMeta;
export type DetailedAggregationCategory = ZakatCategory;
export type DetailedEligibilityOverrides = Pick<
  EvaluateEligibilityInput,
  "hawlStartDate" | "eventDate"
>;

type LineItemForAggregation = {
  meta: Pick<DetailedLineItemMeta, "dueNow" | "debtAdjustable">;
  result: {
    totalWealth: number;
  };
};

type LineItemForIndependentCashDue = {
  category: DetailedAggregationCategory;
  meta: Pick<DetailedLineItemMeta, "dueNow" | "debtAdjustable">;
  result: {
    totalWealth?: number;
    totalZakat: number;
  };
  dueItems?: unknown[];
  dueQuantityKg?: number;
};

export type DetailedLineItemForGrouping = LineItemForIndependentCashDue;

export type HawlAwareAggregationGroups = {
  moneyDueNowItems: DetailedLineItemForGrouping[];
  specialDueNowItems: DetailedLineItemForGrouping[];
  notDueItems: DetailedLineItemForGrouping[];
};

export function resolveDetailedLineItemMeta(
  category: DetailedAggregationCategory,
  context: DetailedCalculationContext,
  overrides?: DetailedEligibilityOverrides,
): DetailedLineItemMeta {
  return evaluateEligibility({
    category,
    calculationDate: context.calculationDate,
    hawlStartDate: overrides?.hawlStartDate,
    eventDate: overrides?.eventDate,
  });
}

export function calculateDueNowMoneyBase(items: LineItemForAggregation[]): number {
  return items.reduce((sum, item) => {
    if (!item.meta.dueNow || !item.meta.debtAdjustable) {
      return sum;
    }
    return sum + toNonNegativeNumber(item.result.totalWealth);
  }, 0);
}

export function hasEligibleDueNowMoneyPool(items: LineItemForAggregation[]): boolean {
  return calculateDueNowMoneyBase(items) > 0;
}

export function splitHawlAwareLineItems(
  items: DetailedLineItemForGrouping[],
): HawlAwareAggregationGroups {
  return {
    moneyDueNowItems: items.filter(
      (item) => item.meta.dueNow && item.meta.debtAdjustable,
    ),
    specialDueNowItems: items.filter(
      (item) => item.meta.dueNow && !item.meta.debtAdjustable && item.category !== "debt",
    ),
    notDueItems: items.filter((item) => item.meta.dueNow === false),
  };
}

export function calculateIndependentCashDue(items: LineItemForIndependentCashDue[]): number {
  return items.reduce((sum, item) => {
    if (!item.meta.dueNow || item.meta.debtAdjustable || item.category === "debt") {
      return sum;
    }
    if (item.category === "livestock" && (item.dueItems?.length ?? 0) === 0) {
      return sum;
    }
    if (item.category === "produce" && item.dueQuantityKg !== undefined && item.dueQuantityKg <= 0) {
      return sum;
    }
    return sum + toNonNegativeNumber(item.result.totalZakat);
  }, 0);
}

export function shouldShowBelowNisabAfterDebt(params: {
  hasDebtLineItem: boolean;
  cashBaseBeforeDebt: number;
  finalZakatableBase: number;
  monetaryNisab: number;
  debtNetImpact: number;
}): boolean {
  if (!params.hasDebtLineItem) {
    return false;
  }
  if (params.cashBaseBeforeDebt < params.monetaryNisab) {
    return false;
  }
  if (params.finalZakatableBase >= params.monetaryNisab) {
    return false;
  }
  return params.debtNetImpact < 0;
}

function toNonNegativeNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

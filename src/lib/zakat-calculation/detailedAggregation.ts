export type DetailedLineItemMeta = {
  dueNow: boolean;
  debtAdjustable: boolean;
};

export type DetailedAggregationCategory =
  | "salary"
  | "livestock"
  | "produce"
  | "agri_other"
  | "trade_sector"
  | "industrial_sector"
  | "debt";

type LineItemForAggregation = {
  meta: DetailedLineItemMeta;
  result: {
    totalWealth: number;
  };
};

type LineItemForIndependentCashDue = {
  category: DetailedAggregationCategory;
  meta: DetailedLineItemMeta;
  result: {
    totalZakat: number;
  };
  dueItems?: unknown[];
  dueQuantityKg?: number;
};

export function resolveDetailedLineItemMeta(category: DetailedAggregationCategory): DetailedLineItemMeta {
  if (
    category === "salary" ||
    category === "agri_other" ||
    category === "trade_sector" ||
    category === "industrial_sector"
  ) {
    return { dueNow: true, debtAdjustable: true };
  }
  return { dueNow: true, debtAdjustable: false };
}

export function calculateDueNowMoneyBase(items: LineItemForAggregation[]): number {
  return items.reduce((sum, item) => {
    if (!item.meta.dueNow || !item.meta.debtAdjustable) {
      return sum;
    }
    return sum + toNonNegativeNumber(item.result.totalWealth);
  }, 0);
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

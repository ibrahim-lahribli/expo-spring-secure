import type { SupportedCurrency } from "../../store/appPreferencesStore";

export type HistoryFlowType = "quick" | "detailed";

export type HistoryNisabSnapshot = {
  method: "silver" | "gold";
  silverPricePerGram: number;
  goldPricePerGram: number;
  override: number | null;
};

export type HistorySummary = {
  categoriesUsed: string[];
  itemCount: number;
  note?: string;
  nonCashDue?: {
    livestock: string[];
    produceKg: number;
  };
};

export type QuickHistoryPayload = {
  kind: "quick";
  inputs: {
    cash: number;
    goldValue: number;
    debt: number;
  };
  result: {
    nisab: number;
    totalWealth: number;
    totalZakat: number;
    hasZakatDue: boolean;
  };
};

export type DetailedHistoryLineItem = {
  id: string;
  category: string;
  label?: string;
  totalZakat: number;
  totalWealth: number;
  details: string[];
};

export type DetailedHistoryFinalCalculation = {
  cashBaseBeforeDebt: number;
  debtAdjustment: {
    collectibleReceivablesCurrent: number;
    doubtfulReceivables: number;
    debtsYouOweDueNow: number;
    netAdjustment: number;
  };
  finalZakatableBase: number;
  finalZakatRate: number;
  adjustedCashPoolZakatDue?: number;
  independentNonDebtAdjustableCashDue?: number;
  finalZakatDue: number;
  hasDebtLineItem: boolean;
};

export type DetailedHistoryPayload = {
  kind: "detailed";
  lineItems: DetailedHistoryLineItem[];
  combinedTotal: number;
  finalCalculation?: DetailedHistoryFinalCalculation;
};

export type HistoryPayload = QuickHistoryPayload | DetailedHistoryPayload;

export type HistoryEntry = {
  id: string;
  flowType: HistoryFlowType;
  createdAt: string;
  updatedAt: string;
  title?: string;
  totalZakat: number;
  currency: SupportedCurrency;
  nisabSnapshot: HistoryNisabSnapshot;
  summary: HistorySummary;
  payload: HistoryPayload;
};

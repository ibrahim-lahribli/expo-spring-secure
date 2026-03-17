import type { SupportedCurrency } from "../../store/appPreferencesStore";
import type { LineItemMeta } from "../../lib/zakat-calculation/hawl";
import type {
  DueItem,
  LivestockType,
  ProduceWateringMethod,
} from "../../lib/zakat-calculation";

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
    livestock: DetailedHistoryNonCashLivestockEntry[];
    produceKg: number;
  };
};

export type DetailedHistoryNonCashLivestockStructured = {
  livestockType: LivestockType;
  dueItems: DueItem[];
};

export type DetailedHistoryNonCashLivestockEntry =
  | string
  | DetailedHistoryNonCashLivestockStructured;

export type DetailedHistoryDetailRow =
  | { kind: "mode"; mode: "monthly" | "annual" | "trade" | "harvest" }
  | { kind: "nisab"; amount: number }
  | { kind: "type"; livestockType: LivestockType }
  | { kind: "owned"; count: number }
  | { kind: "due"; dueItems: DueItem[] }
  | { kind: "cash_estimate"; amount: number }
  | { kind: "watering"; method: ProduceWateringMethod }
  | { kind: "due_produce"; quantityKg: number }
  | { kind: "cash_equivalent"; amount: number }
  | { kind: "debt_collectible"; amount: number }
  | { kind: "debt_doubtful"; amount: number }
  | { kind: "debt_owed_now"; amount: number }
  | { kind: "debt_net_impact"; amount: number };

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
  detailRows?: DetailedHistoryDetailRow[];
  details?: string[];
  meta?: LineItemMeta;
};

export type DetailedHistoryLegacyReminder = {
  lineItemId: string;
  category: string;
  dueNow: boolean;
  dueDate: string;
  source: "hawl_due_date" | "event_date";
};

export type DetailedHistoryScheduledReminderStatus =
  | "scheduled"
  | "disabled_by_preference"
  | "permission_denied"
  | "not_supported";

export type DetailedHistoryScheduledReminder = {
  id: string;
  historyEntryId: string;
  lineItemId?: string;
  type: "hawl_due";
  reminderDate: string;
  scheduledNotificationId?: string;
  enabled: boolean;
  status: DetailedHistoryScheduledReminderStatus;
};

export type DetailedHistoryReminder =
  | DetailedHistoryLegacyReminder
  | DetailedHistoryScheduledReminder;

export type DetailedHistoryFinalGroupedTotals = {
  dueNowMoneyItemCount: number;
  dueNowSpecialItemCount: number;
  notDueItemCount: number;
  dueNowMoneyBaseBeforeDebt: number;
  dueNowSpecialCashDue: number;
  notDueTotalWealth: number;
  hasEligibleDueNowMoneyPool: boolean;
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
  groupedTotals?: DetailedHistoryFinalGroupedTotals;
};

export type DetailedHistoryPayload = {
  kind: "detailed";
  calculationContext?: {
    calculationDate: string;
  };
  lineItems: DetailedHistoryLineItem[];
  reminders?: DetailedHistoryReminder[];
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

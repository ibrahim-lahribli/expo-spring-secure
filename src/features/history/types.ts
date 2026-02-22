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
  label: string;
  totalZakat: number;
  totalWealth: number;
  details: string[];
};

export type DetailedHistoryPayload = {
  kind: "detailed";
  lineItems: DetailedHistoryLineItem[];
  combinedTotal: number;
};

export type HistoryPayload = QuickHistoryPayload | DetailedHistoryPayload;

export type HistoryEntry = {
  id: string;
  flowType: HistoryFlowType;
  createdAt: string;
  updatedAt: string;
  title?: string;
  totalZakat: number;
  currency: string;
  nisabSnapshot: HistoryNisabSnapshot;
  summary: HistorySummary;
  payload: HistoryPayload;
};

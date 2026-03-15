export type ZakatCategory =
  | "salary"
  | "livestock"
  | "produce"
  | "agri_other"
  | "trade_sector"
  | "industrial_sector"
  | "debt";

export type ObligationMode = "hawl_required" | "event_based" | "adjustment";

type CategoryRule = {
  obligationMode: ObligationMode;
  debtAdjustable: boolean;
};

export const CATEGORY_RULES: Record<ZakatCategory, CategoryRule> = {
  salary: {
    obligationMode: "hawl_required",
    debtAdjustable: true,
  },
  trade_sector: {
    obligationMode: "hawl_required",
    debtAdjustable: true,
  },
  industrial_sector: {
    obligationMode: "hawl_required",
    debtAdjustable: true,
  },
  agri_other: {
    obligationMode: "hawl_required",
    debtAdjustable: true,
  },
  livestock: {
    obligationMode: "hawl_required",
    debtAdjustable: false,
  },
  produce: {
    obligationMode: "event_based",
    debtAdjustable: false,
  },
  debt: {
    obligationMode: "adjustment",
    debtAdjustable: false,
  },
};

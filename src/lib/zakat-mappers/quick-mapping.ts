import { ZakatInput } from "../zakat-engine/src/core/types";

export interface QuickZakatFormInput {
  cash: number;
  goldValue: number;
  debt: number;
}

export function mapQuickToEngineInput(input: QuickZakatFormInput): ZakatInput {
  // Option B mapping:
  // inventoryValue = 0
  // cash = cash + goldValue
  // receivables = 0
  // liabilities = debt
  // expensesDue = 0

  return {
    trade: {
      cash: (input.cash || 0) + (input.goldValue || 0),
      inventoryValue: 0,
      receivables: 0,
      liabilities: input.debt || 0,
      expensesDue: 0,
    },
  };
}

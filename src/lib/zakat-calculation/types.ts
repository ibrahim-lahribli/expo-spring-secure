export type NisabMethod = "silver" | "gold";

export interface SalaryInput {
  monthlyIncome: number;
  livingExpense?: number;
}

export interface SalaryZakatInput {
  nisabMethod?: NisabMethod;
  silverPricePerGram?: number;
  goldPricePerGram?: number;
  nisabOverride?: number;
  salary: SalaryInput;
}

export interface CategoryZakatResult {
  zakatAmount: number;
  isApplicable: boolean;
  netWealth: number;
}

export interface ZakatCalculationResult {
  nisab: number;
  totalWealth: number;
  totalZakat: number;
  hasZakatDue: boolean;
  breakdown: {
    salary?: CategoryZakatResult;
  };
}

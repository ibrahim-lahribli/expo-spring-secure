export type NisabMethod = "silver" | "gold";
export type SalaryCalculationMode = "annual" | "monthly";

export interface SalaryInput {
  monthlyIncome: number;
  livingExpense?: number;
  calculationMode?: SalaryCalculationMode;
}

export interface SalaryZakatInput {
  nisabMethod?: NisabMethod;
  silverPricePerGram?: number;
  goldPricePerGram?: number;
  nisabOverride?: number;
  salary: SalaryInput;
}

export type ProduceWateringMethod = "natural" | "paid_irrigation";

export interface ProduceZakatInput {
  nisabMethod?: NisabMethod;
  silverPricePerGram?: number;
  goldPricePerGram?: number;
  nisabOverride?: number;
  produce: {
    isForTrade: boolean;
    quantityKg?: number;
    marketValue?: number;
    wateringMethod?: ProduceWateringMethod;
  };
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
    produce?: CategoryZakatResult;
  };
}

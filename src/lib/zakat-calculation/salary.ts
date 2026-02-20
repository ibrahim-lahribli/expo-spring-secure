import type {
  CategoryZakatResult,
  SalaryZakatInput,
  ZakatCalculationResult,
} from "./types";
import { calculateNisab, type NisabInput } from "./nisab";

const STANDARD_ZAKAT_RATE = 0.025;
const MINIMUM_LIVING_EXPENSE_MAD = 3266;

function toNonNegativeNumber(value: unknown): number {
  const parsed = typeof value === "string" ? Number(value) : Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function calculateSalaryBreakdown(input: SalaryZakatInput): CategoryZakatResult {
  const monthlyIncome = toNonNegativeNumber(input.salary.monthlyIncome);
  const monthlyExpense =
    input.salary.livingExpense === undefined
      ? MINIMUM_LIVING_EXPENSE_MAD
      : toNonNegativeNumber(input.salary.livingExpense);

  const yearlyIncome = monthlyIncome * 12;
  const yearlyExpenses = monthlyExpense * 12;
  const netWealth = Math.max(0, yearlyIncome - yearlyExpenses);

  const nisab = calculateNisab(toNisabInput(input));
  const zakatAmount = netWealth >= nisab ? netWealth * STANDARD_ZAKAT_RATE : 0;

  return {
    zakatAmount,
    isApplicable: zakatAmount > 0,
    netWealth,
  };
}

export function calculateSalaryZakat(
  input: SalaryZakatInput,
): ZakatCalculationResult {
  const nisab = calculateNisab(toNisabInput(input));
  const salaryResult = calculateSalaryBreakdown(input);

  return {
    nisab,
    totalWealth: salaryResult.netWealth,
    totalZakat: salaryResult.zakatAmount,
    hasZakatDue: salaryResult.isApplicable,
    breakdown: {
      salary: salaryResult,
    },
  };
}

function toNisabInput(input: SalaryZakatInput): NisabInput {
  return {
    nisabMethod: input.nisabMethod ?? "silver",
    silverPricePerGram: input.silverPricePerGram,
    goldPricePerGram: input.goldPricePerGram,
    nisabOverride: input.nisabOverride,
  };
}

import type {
  CategoryZakatResult,
  SalaryZakatInput,
  ZakatCalculationResult,
} from "./types";

const DEFAULT_SILVER_PRICE = 12;
const DEFAULT_GOLD_PRICE = 800;
const SILVER_NISAB_GRAMS = 595;
const GOLD_NISAB_GRAMS = 85;
const STANDARD_ZAKAT_RATE = 0.025;
const MINIMUM_LIVING_EXPENSE_MAD = 3266;

function toNonNegativeNumber(value: unknown): number {
  const parsed = typeof value === "string" ? Number(value) : Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function calculateNisab(input: SalaryZakatInput): number {
  const override = toNonNegativeNumber(input.nisabOverride);
  if (override > 0) {
    return override;
  }

  if (input.nisabMethod === "gold") {
    const goldPrice = toNonNegativeNumber(input.goldPricePerGram) || DEFAULT_GOLD_PRICE;
    return goldPrice * GOLD_NISAB_GRAMS;
  }

  const silverPrice =
    toNonNegativeNumber(input.silverPricePerGram) || DEFAULT_SILVER_PRICE;
  return silverPrice * SILVER_NISAB_GRAMS;
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

  const nisab = calculateNisab(input);
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
  const nisab = calculateNisab(input);
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

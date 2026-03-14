import { calculateNisab, type NisabInput } from "./nisab";
import type { CategoryZakatResult, DebtZakatInput, ZakatCalculationResult } from "./types";

function toNonNegativeNumber(value: unknown): number {
  const parsed = typeof value === "string" ? Number(value) : Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

export type DebtAdjustmentResult = {
  collectibleReceivablesCurrent: number;
  doubtfulReceivables: number;
  debtsYouOweDueNow: number;
  netAdjustment: number;
};

export function calculateDebtAdjustment(input: DebtZakatInput): DebtAdjustmentResult {
  const collectibleReceivablesCurrent = toNonNegativeNumber(input.debt.collectibleReceivablesCurrent);
  const doubtfulReceivables = toNonNegativeNumber(input.debt.doubtfulReceivables);
  const debtsYouOweDueNow = toNonNegativeNumber(input.debt.debtsYouOweDueNow);
  const netAdjustment = collectibleReceivablesCurrent - debtsYouOweDueNow;
  return {
    collectibleReceivablesCurrent,
    doubtfulReceivables,
    debtsYouOweDueNow,
    netAdjustment,
  };
}

export function applyDebtAdjustment(cashBaseBeforeDebt: number, netAdjustment: number): number {
  const base = toNonNegativeNumber(cashBaseBeforeDebt);
  const adjustment = Number.isFinite(netAdjustment) ? netAdjustment : 0;
  return Math.max(0, base + adjustment);
}

export function calculateDebtZakat(input: DebtZakatInput): ZakatCalculationResult {
  const adjustment = calculateDebtAdjustment(input);
  const debtResult: CategoryZakatResult = {
    // Debt is an adjustment layer, not a standalone due amount in v1.
    zakatAmount: 0,
    isApplicable: false,
    netWealth: adjustment.netAdjustment,
  };
  return {
    nisab: calculateNisab(toNisabInput(input)),
    totalWealth: adjustment.netAdjustment,
    totalZakat: 0,
    hasZakatDue: false,
    breakdown: {
      debt: debtResult,
    },
  };
}

function toNisabInput(input: DebtZakatInput): NisabInput {
  return {
    nisabMethod: input.nisabMethod ?? "silver",
    silverPricePerGram: input.silverPricePerGram,
    goldPricePerGram: input.goldPricePerGram,
    nisabOverride: input.nisabOverride,
  };
}


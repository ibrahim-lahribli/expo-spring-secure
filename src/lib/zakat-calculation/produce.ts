import { calculateNisab, type NisabInput } from "./nisab";
import type {
  CategoryZakatResult,
  ProduceWateringMethod,
  ProduceZakatInput,
  ZakatCalculationResult,
} from "./types";

const PRODUCE_NISAB_KG = 653;
const NATURAL_WATERING_RATE = 0.1;
const PAID_IRRIGATION_RATE = 0.05;
const TRADE_GOODS_RATE = 0.025;

function toNonNegativeNumber(value: unknown): number {
  const parsed = typeof value === "string" ? Number(value) : Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function getProduceRate(wateringMethod: ProduceWateringMethod | undefined): number {
  return wateringMethod === "paid_irrigation" ? PAID_IRRIGATION_RATE : NATURAL_WATERING_RATE;
}

function calculateProduceBreakdown(input: ProduceZakatInput): CategoryZakatResult {
  if (input.produce.isForTrade) {
    const marketValue = toNonNegativeNumber(input.produce.marketValue);
    const nisab = calculateNisab(toNisabInput(input));
    const zakatAmount = marketValue >= nisab ? marketValue * TRADE_GOODS_RATE : 0;
    return {
      zakatAmount,
      isApplicable: zakatAmount > 0,
      netWealth: marketValue,
    };
  }

  const quantityKg = toNonNegativeNumber(input.produce.quantityKg);
  const rate = getProduceRate(input.produce.wateringMethod);
  const zakatAmount = quantityKg >= PRODUCE_NISAB_KG ? quantityKg * rate : 0;

  return {
    zakatAmount,
    isApplicable: zakatAmount > 0,
    netWealth: quantityKg,
  };
}

export function calculateProduceZakat(input: ProduceZakatInput): ZakatCalculationResult {
  const produceResult = calculateProduceBreakdown(input);

  if (input.produce.isForTrade) {
    const nisab = calculateNisab(toNisabInput(input));
    return {
      nisab,
      totalWealth: produceResult.netWealth,
      totalZakat: produceResult.zakatAmount,
      hasZakatDue: produceResult.isApplicable,
      breakdown: {
        produce: produceResult,
      },
    };
  }

  return {
    nisab: PRODUCE_NISAB_KG,
    totalWealth: produceResult.netWealth,
    totalZakat: produceResult.zakatAmount,
    hasZakatDue: produceResult.isApplicable,
    breakdown: {
      produce: produceResult,
    },
  };
}

function toNisabInput(input: ProduceZakatInput): NisabInput {
  return {
    nisabMethod: input.nisabMethod ?? "silver",
    silverPricePerGram: input.silverPricePerGram,
    goldPricePerGram: input.goldPricePerGram,
    nisabOverride: input.nisabOverride,
  };
}


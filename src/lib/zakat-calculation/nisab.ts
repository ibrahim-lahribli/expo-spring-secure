const DEFAULT_SILVER_PRICE = 12;
const DEFAULT_GOLD_PRICE = 800;
const SILVER_NISAB_GRAMS = 595;
const GOLD_NISAB_GRAMS = 85;

function toNonNegativeNumber(value: unknown): number {
  const parsed = typeof value === "string" ? Number(value) : Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

export type NisabInput = {
  nisabMethod: "silver" | "gold";
  silverPricePerGram?: number;
  goldPricePerGram?: number;
  nisabOverride?: number;
};

export type NisabBreakdown = {
  usesOverride: boolean;
  method: "silver" | "gold";
  grams: number;
  pricePerGram: number;
  nisab: number;
  shortSummary: string;
  detailSummary: string;
};

function formatCompactValue(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function getNisabBreakdown(input: NisabInput): NisabBreakdown {
  const override = toNonNegativeNumber(input.nisabOverride);
  if (override > 0) {
    const formattedOverride = formatCompactValue(override);
    return {
      usesOverride: true,
      method: input.nisabMethod,
      grams: input.nisabMethod === "gold" ? GOLD_NISAB_GRAMS : SILVER_NISAB_GRAMS,
      pricePerGram:
        input.nisabMethod === "gold"
          ? toNonNegativeNumber(input.goldPricePerGram) || DEFAULT_GOLD_PRICE
          : toNonNegativeNumber(input.silverPricePerGram) || DEFAULT_SILVER_PRICE,
      nisab: override,
      shortSummary: `Override: ${formattedOverride}`,
      detailSummary: `Override used: ${formattedOverride}`,
    };
  }

  if (input.nisabMethod === "gold") {
    const goldPrice = toNonNegativeNumber(input.goldPricePerGram) || DEFAULT_GOLD_PRICE;
    const nisab = goldPrice * GOLD_NISAB_GRAMS;
    return {
      usesOverride: false,
      method: "gold",
      grams: GOLD_NISAB_GRAMS,
      pricePerGram: goldPrice,
      nisab,
      shortSummary: `Using Gold • ${GOLD_NISAB_GRAMS}g • ${formatCompactValue(goldPrice)}/gram • Nisab: ${formatCompactValue(nisab)}`,
      detailSummary: `Gold basis: ${GOLD_NISAB_GRAMS}g × ${formatCompactValue(goldPrice)}/gram = ${formatCompactValue(nisab)}`,
    };
  }

  const silverPrice =
    toNonNegativeNumber(input.silverPricePerGram) || DEFAULT_SILVER_PRICE;
  const nisab = silverPrice * SILVER_NISAB_GRAMS;
  return {
    usesOverride: false,
    method: "silver",
    grams: SILVER_NISAB_GRAMS,
    pricePerGram: silverPrice,
    nisab,
    shortSummary: `Using Silver • ${SILVER_NISAB_GRAMS}g • ${formatCompactValue(silverPrice)}/gram • Nisab: ${formatCompactValue(nisab)}`,
    detailSummary: `Silver basis: ${SILVER_NISAB_GRAMS}g × ${formatCompactValue(silverPrice)}/gram = ${formatCompactValue(nisab)}`,
  };
}

export function calculateNisab(input: NisabInput): number {
  return getNisabBreakdown(input).nisab;
}

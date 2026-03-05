import type { SupportedCurrency } from "../store/appPreferencesStore";

const GOLD_API_BASE_URL = "https://www.goldapi.io/api";
const TROY_OUNCE_IN_GRAMS = 31.1034768;

type MetalCode = "XAU" | "XAG";

type GoldApiQuoteResponse = {
  price?: number;
  timestamp?: number;
  error?: string;
};

export type GoldApiNisabPrices = {
  goldPricePerGram: number;
  silverPricePerGram: number;
  fetchedAt: string;
};

function toPricePerGram(pricePerOunce: number): number {
  return Number((pricePerOunce / TROY_OUNCE_IN_GRAMS).toFixed(4));
}

async function fetchMetalQuote(
  metal: MetalCode,
  currency: SupportedCurrency,
  apiKeyOverride?: string,
): Promise<GoldApiQuoteResponse> {
  const apiKey = apiKeyOverride || process.env["EXPO_PUBLIC_GOLDAPI_KEY"];

  if (!apiKey) {
    throw new Error("Missing GoldAPI key. Set EXPO_PUBLIC_GOLDAPI_KEY before fetching live prices.");
  }

  const response = await fetch(`${GOLD_API_BASE_URL}/${metal}/${currency}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-access-token": apiKey,
    },
  });

  const payload = (await response.json()) as GoldApiQuoteResponse;

  if (!response.ok) {
    throw new Error(payload.error || `GoldAPI request failed for ${metal}/${currency}.`);
  }

  if (typeof payload.price !== "number" || !Number.isFinite(payload.price) || payload.price <= 0) {
    throw new Error(`GoldAPI returned an invalid ${metal}/${currency} price.`);
  }

  return payload;
}

export async function fetchGoldApiNisabPrices(
  currency: SupportedCurrency,
  apiKeyOverride?: string,
): Promise<GoldApiNisabPrices> {
  const [goldQuote, silverQuote] = await Promise.all([
    fetchMetalQuote("XAU", currency, apiKeyOverride),
    fetchMetalQuote("XAG", currency, apiKeyOverride),
  ]);

  const latestTimestampSeconds = Math.max(goldQuote.timestamp ?? 0, silverQuote.timestamp ?? 0);

  return {
    goldPricePerGram: toPricePerGram(goldQuote.price!),
    silverPricePerGram: toPricePerGram(silverQuote.price!),
    fetchedAt: latestTimestampSeconds > 0 ? new Date(latestTimestampSeconds * 1000).toISOString() : new Date().toISOString(),
  };
}

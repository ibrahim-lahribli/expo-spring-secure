import type { SupportedCurrency } from "../store/appPreferencesStore";

export function formatMoney(value: number, currency: SupportedCurrency): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function getCurrencyInputPrefix(currency: SupportedCurrency): string {
  return currency;
}

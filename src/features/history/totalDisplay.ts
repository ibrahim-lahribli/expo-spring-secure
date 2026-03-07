import { formatMoney } from "../../lib/currency";
import type { SupportedCurrency } from "../../store/appPreferencesStore";

export type NonCashDueSummary = {
  livestock: string[];
  produceKg: number;
};

export type TotalDisplay = {
  primaryDisplay: string;
  suffixDisplay?: string;
  hasNonCash: boolean;
};

function normalizeNonCashDue(summary: NonCashDueSummary): NonCashDueSummary {
  return {
    livestock: summary.livestock.filter((item) => item.trim().length > 0),
    produceKg: Number.isFinite(summary.produceKg) && summary.produceKg > 0 ? summary.produceKg : 0,
  };
}

export function resolveNonCashDueSummary(summary: NonCashDueSummary | null | undefined): NonCashDueSummary | null {
  if (!summary) return null;
  const normalized = normalizeNonCashDue(summary);
  if (normalized.livestock.length > 0 || normalized.produceKg > 0) {
    return normalized;
  }
  return null;
}

export function formatNonCashDue(
  summary: NonCashDueSummary | null,
  labels?: { kgUnit?: string },
): string | null {
  if (!summary) return null;
  const normalized = normalizeNonCashDue(summary);
  const parts: string[] = [];

  if (normalized.livestock.length > 0) {
    parts.push(normalized.livestock.join(" | "));
  }
  if (normalized.produceKg > 0) {
    parts.push(`${normalized.produceKg.toFixed(2)} ${labels?.kgUnit ?? "kg"}`);
  }

  return parts.length > 0 ? parts.join(" | ") : null;
}

export function buildTotalDisplay(params: {
  cashTotal: number;
  currency: SupportedCurrency;
  nonCashDue: NonCashDueSummary | null;
  labels?: { kgUnit?: string };
}): TotalDisplay {
  const cashDisplay = formatMoney(params.cashTotal, params.currency);
  const nonCashDisplay = formatNonCashDue(params.nonCashDue, params.labels);
  if (!nonCashDisplay) {
    return {
      primaryDisplay: cashDisplay,
      hasNonCash: false,
    };
  }

  return {
    primaryDisplay: cashDisplay,
    suffixDisplay: nonCashDisplay,
    hasNonCash: true,
  };
}

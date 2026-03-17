import { formatMoney } from "../../lib/currency";
import type { SupportedCurrency } from "../../store/appPreferencesStore";
import { formatDueItems } from "../../lib/zakat-calculation";
import type {
  DetailedHistoryNonCashLivestockEntry,
  DetailedHistoryNonCashLivestockStructured,
} from "./types";

export type NonCashDueSummary = {
  livestock: DetailedHistoryNonCashLivestockEntry[];
  produceKg: number;
};

export type TotalDisplay = {
  primaryDisplay: string;
  suffixDisplay?: string;
  hasNonCash: boolean;
};

function normalizeNonCashDue(summary: NonCashDueSummary): NonCashDueSummary {
  return {
    livestock: summary.livestock.filter((item) => {
      if (typeof item === "string") {
        return item.trim().length > 0;
      }
      return Array.isArray(item.dueItems) && item.dueItems.length > 0;
    }),
    produceKg: Number.isFinite(summary.produceKg) && summary.produceKg > 0 ? summary.produceKg : 0,
  };
}

function isStructuredLivestockEntry(
  entry: DetailedHistoryNonCashLivestockEntry,
): entry is DetailedHistoryNonCashLivestockStructured {
  return typeof entry === "object" && entry !== null && "livestockType" in entry;
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
  labels?: {
    kgUnit?: string;
    resolveLivestockTypeLabel?: (type: DetailedHistoryNonCashLivestockStructured["livestockType"]) => string;
    formatDueItems?: (items: DetailedHistoryNonCashLivestockStructured["dueItems"]) => string;
  },
): string | null {
  if (!summary) return null;
  const normalized = normalizeNonCashDue(summary);
  const parts: string[] = [];

  if (normalized.livestock.length > 0) {
    const livestockParts = normalized.livestock
      .map((entry) => {
        if (!isStructuredLivestockEntry(entry)) {
          return entry;
        }
        const typeLabel = labels?.resolveLivestockTypeLabel?.(entry.livestockType) ?? entry.livestockType;
        const dueText = labels?.formatDueItems?.(entry.dueItems) ?? formatDueItems(entry.dueItems);
        return `${typeLabel}: ${dueText}`;
      })
      .filter((part) => part.trim().length > 0);
    if (livestockParts.length > 0) {
      parts.push(livestockParts.join(" | "));
    }
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

import { isValidIsoDate } from "../../lib/zakat-calculation/detailedCalculationContext";

const DEFAULT_HISTORY_LOCALE = "en-GB";

function resolveLocale(locale?: string): string {
  if (typeof locale === "string" && locale.trim().length > 0) {
    return locale;
  }
  return DEFAULT_HISTORY_LOCALE;
}

export function formatHistoryDateTime(value: string, locale?: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function formatHistoryIsoDate(value: string, locale?: string): string {
  if (!isValidIsoDate(value)) {
    return value;
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

import { formatMoney } from "../../lib/currency";
import {
  formatDueItems,
  getDueItemLabelKey,
} from "../../lib/zakat-calculation";
import type { SupportedCurrency } from "../../store/appPreferencesStore";
import type {
  DetailedHistoryDetailRow,
  DetailedHistoryLineItem,
} from "./types";
import { formatHistoryIsoDate } from "./dateFormatting";

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function splitLegacyDetailLine(value: string): { rawLabel: string; rawValue: string } | null {
  const separatorIndex = value.indexOf(":");
  if (separatorIndex <= 0) return null;
  return {
    rawLabel: value.slice(0, separatorIndex).trim(),
    rawValue: value.slice(separatorIndex + 1).trim(),
  };
}

function resolveLegacyLabelKey(rawLabel: string): DetailedHistoryDetailRow["kind"] | "due_status" | "hawl_due_date" | "event_date" | null {
  const normalized = normalizeToken(rawLabel);
  const labelMap: Record<string, DetailedHistoryDetailRow["kind"] | "due_status" | "hawl_due_date" | "event_date"> = {
    mode: "mode",
    "النمط": "mode",
    nisab: "nisab",
    "النصاب": "nisab",
    type: "type",
    "النوع": "type",
    owned: "owned",
    possede: "owned",
    "المملوك": "owned",
    due: "due",
    du: "due",
    "الواجب": "due",
    "cash estimate": "cash_estimate",
    "estimation en especes": "cash_estimate",
    "التقدير النقدي": "cash_estimate",
    watering: "watering",
    irrigation: "watering",
    "طريقة السقي": "watering",
    "due produce": "due_produce",
    "produit du": "due_produce",
    "الواجب من المحصول": "due_produce",
    "cash equivalent": "cash_equivalent",
    "equivalent en especes": "cash_equivalent",
    "المكافئ النقدي": "cash_equivalent",
    "collectible receivables": "debt_collectible",
    "creances recouvrables": "debt_collectible",
    "الديون المرجوة": "debt_collectible",
    "doubtful receivables (excluded)": "debt_doubtful",
    "creances douteuses (exclues)": "debt_doubtful",
    "الديون غير المرجوة (غير محتسبة)": "debt_doubtful",
    "debts currently due": "debt_owed_now",
    "dettes exigibles": "debt_owed_now",
    "الديون الحالة": "debt_owed_now",
    "net base impact": "debt_net_impact",
    "impact net": "debt_net_impact",
    "الأثر الصافي": "debt_net_impact",
    "due status": "due_status",
    statut: "due_status",
    "statut d'exigibilite": "due_status",
    "حالة الاستحقاق": "due_status",
    "hawl due date": "hawl_due_date",
    "date d'echeance du hawl": "hawl_due_date",
    "تاريخ استحقاق الحول": "hawl_due_date",
    "event date": "event_date",
    "date d'evenement": "event_date",
    "تاريخ الحدث": "event_date",
  };
  return labelMap[normalized] ?? null;
}

function localizeLegacyDetailValue(
  labelKey: ReturnType<typeof resolveLegacyLabelKey>,
  rawValue: string,
  t: TranslateFn,
  locale?: string,
): string {
  if (!labelKey) return rawValue;
  if (labelKey === "mode") {
    const normalized = normalizeToken(rawValue);
    if (["annual", "annuel", "سنوي"].includes(normalized)) {
      return t("detailedCalculator.modes.annual");
    }
    if (["monthly", "mensuel", "شهري"].includes(normalized)) {
      return t("detailedCalculator.modes.monthly");
    }
    if (
      ["trade goods", "biens commerciaux", "عروض تجارة"].includes(normalized)
    ) {
      return t("detailedCalculator.history.modeTrade");
    }
    if (
      ["agricultural harvest", "recolte agricole", "محصول زراعي"].includes(normalized)
    ) {
      return t("detailedCalculator.history.modeHarvest");
    }
    return rawValue;
  }
  if (labelKey === "watering") {
    const normalized = normalizeToken(rawValue);
    if (
      ["natural watering (10%)", "irrigation naturelle (10%)", "سقي طبيعي (10%)"].includes(
        normalized,
      )
    ) {
      return t("detailedCalculator.history.wateringNatural");
    }
    if (
      ["paid irrigation (5%)", "irrigation payante (5%)", "سقي بكلفة (5%)"].includes(
        normalized,
      )
    ) {
      return t("detailedCalculator.history.wateringPaidIrrigation");
    }
    return rawValue;
  }
  if (labelKey === "due_status") {
    const normalized = normalizeToken(rawValue);
    if (
      ["due now", "exigible maintenant", "مستحق الآن"].includes(normalized)
    ) {
      return t("history.groupedRows.dueNow");
    }
    if (
      ["not due yet", "pas encore exigible", "غير مستحق بعد"].includes(normalized)
    ) {
      return t("history.groupedRows.notDue");
    }
    if (
      [
        "hawl date missing / unknown",
        "date du hawl manquante / inconnue",
        "تاريخ الحول مفقود / غير معروف",
      ].includes(normalized)
    ) {
      return t("history.groupedRows.unknown");
    }
    if (
      [
        "event date missing / unknown",
        "date d'evenement manquante / inconnue",
        "ØªØ§Ø±ÙŠØ® Ø§Ù„Ø­Ø¯Ø« Ù…ÙÙ‚ÙˆØ¯ / ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ",
      ].includes(normalized)
    ) {
      return t("history.groupedRows.unknownEvent");
    }
    return rawValue;
  }
  if (labelKey === "hawl_due_date" || labelKey === "event_date") {
    return formatHistoryIsoDate(rawValue, locale);
  }
  return rawValue;
}

function localizeLegacyDetailLabel(labelKey: ReturnType<typeof resolveLegacyLabelKey>, t: TranslateFn): string | null {
  if (!labelKey) return null;
  const labelTranslationMap: Record<
    Exclude<ReturnType<typeof resolveLegacyLabelKey>, null>,
    string
  > = {
    mode: "detailedCalculator.history.mode",
    nisab: "detailedCalculator.history.nisab",
    type: "detailedCalculator.history.type",
    owned: "detailedCalculator.history.owned",
    due: "detailedCalculator.history.due",
    cash_estimate: "detailedCalculator.history.cashEstimate",
    watering: "detailedCalculator.history.watering",
    due_produce: "detailedCalculator.history.dueProduce",
    cash_equivalent: "detailedCalculator.history.cashEquivalent",
    debt_collectible: "detailedCalculator.history.debtCollectible",
    debt_doubtful: "detailedCalculator.history.debtDoubtful",
    debt_owed_now: "detailedCalculator.history.debtOwedNow",
    debt_net_impact: "detailedCalculator.history.debtNetImpact",
    due_status: "history.groupedRows.dueStatus",
    hawl_due_date: "history.groupedRows.hawlDueDate",
    event_date: "history.groupedRows.eventDate",
  };
  return t(labelTranslationMap[labelKey]);
}

export function renderStructuredHistoryDetailRows(params: {
  detailRows: DetailedHistoryDetailRow[];
  currency: SupportedCurrency;
  t: TranslateFn;
}): string[] {
  const { detailRows, currency, t } = params;
  return detailRows.map((row) => {
    if (row.kind === "mode") {
      const value =
        row.mode === "monthly"
          ? t("detailedCalculator.modes.monthly")
          : row.mode === "annual"
            ? t("detailedCalculator.modes.annual")
            : row.mode === "trade"
              ? t("detailedCalculator.history.modeTrade")
              : t("detailedCalculator.history.modeHarvest");
      return `${t("detailedCalculator.history.mode")}: ${value}`;
    }
    if (row.kind === "nisab") {
      return `${t("detailedCalculator.history.nisab")}: ${formatMoney(row.amount, currency)}`;
    }
    if (row.kind === "type") {
      return `${t("detailedCalculator.history.type")}: ${t(`detailedCalculator.livestock.types.${row.livestockType}`)}`;
    }
    if (row.kind === "owned") {
      return `${t("detailedCalculator.history.owned")}: ${row.count}`;
    }
    if (row.kind === "due") {
      return `${t("detailedCalculator.history.due")}: ${formatDueItems(row.dueItems, (item) =>
        t(getDueItemLabelKey(item))
      )}`;
    }
    if (row.kind === "cash_estimate") {
      return `${t("detailedCalculator.history.cashEstimate")}: ${formatMoney(row.amount, currency)}`;
    }
    if (row.kind === "watering") {
      const value =
        row.method === "natural"
          ? t("detailedCalculator.history.wateringNatural")
          : t("detailedCalculator.history.wateringPaidIrrigation");
      return `${t("detailedCalculator.history.watering")}: ${value}`;
    }
    if (row.kind === "due_produce") {
      return `${t("detailedCalculator.history.dueProduce")}: ${row.quantityKg.toFixed(2)} ${t("history.kgUnit")}`;
    }
    if (row.kind === "cash_equivalent") {
      return `${t("detailedCalculator.history.cashEquivalent")}: ${formatMoney(row.amount, currency)}`;
    }
    if (row.kind === "debt_collectible") {
      return `${t("detailedCalculator.history.debtCollectible")}: ${formatMoney(row.amount, currency)}`;
    }
    if (row.kind === "debt_doubtful") {
      return `${t("detailedCalculator.history.debtDoubtful")}: ${formatMoney(row.amount, currency)}`;
    }
    if (row.kind === "debt_owed_now") {
      return `${t("detailedCalculator.history.debtOwedNow")}: ${formatMoney(-Math.abs(row.amount), currency)}`;
    }
    return `${t("detailedCalculator.history.debtNetImpact")}: ${formatMoney(row.amount, currency)}`;
  });
}

export function renderLegacyHistoryDetailRows(params: {
  details: string[];
  t: TranslateFn;
  hasMeta?: boolean;
  locale?: string;
}): string[] {
  const { details, t, hasMeta, locale } = params;
  return details.map((line) => {
    const parsed = splitLegacyDetailLine(line);
    if (!parsed) return line;

    const labelKey = resolveLegacyLabelKey(parsed.rawLabel);
    if (!labelKey) return line;
    if (
      hasMeta &&
      (labelKey === "due_status" || labelKey === "hawl_due_date" || labelKey === "event_date")
    ) {
      return "";
    }

    const localizedLabel = localizeLegacyDetailLabel(labelKey, t);
    if (!localizedLabel) return line;
    const localizedValue = localizeLegacyDetailValue(labelKey, parsed.rawValue, t, locale);
    return `${localizedLabel}: ${localizedValue}`;
  }).filter((line) => line.trim().length > 0);
}

export function resolveLineItemDetailRows(params: {
  lineItem: DetailedHistoryLineItem;
  currency: SupportedCurrency;
  t: TranslateFn;
  locale?: string;
}): string[] {
  const { lineItem, currency, t, locale } = params;
  if (lineItem.detailRows?.length) {
    return renderStructuredHistoryDetailRows({
      detailRows: lineItem.detailRows,
      currency,
      t,
    });
  }
  return renderLegacyHistoryDetailRows({
    details: lineItem.details ?? [],
    t,
    hasMeta: Boolean(lineItem.meta),
    locale,
  });
}

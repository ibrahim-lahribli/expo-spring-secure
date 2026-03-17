import type { HistoryEntry } from "./types";
import { formatMoney } from "../../lib/currency";
import { resolveEligibilityDueStatus } from "../../lib/zakat-calculation/hawl";
import { buildTotalDisplay, resolveNonCashDueSummary } from "./totalDisplay";
import { resolveDetailedReminderDisplayState } from "./reminders";
import { normalizeHistoryCategoryId } from "./categoryLabels";
import { formatHistoryDateTime, formatHistoryIsoDate } from "./dateFormatting";
import type { DueItem, LivestockType } from "../../lib/zakat-calculation";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export type HistoryPdfLabels = {
  locale?: string;
  documentTitle: string;
  kgUnit: string;
  titleQuick: string;
  titleDetailed: string;
  savedPrefix: string;
  totalLabel: string;
  categoriesUsed: string;
  quickSnapshotTitle: string;
  detailedBreakdownTitle: string;
  finalCalculationTitle: string;
  debtAdjustmentTitle: string;
  fieldHeader: string;
  categoryHeader: string;
  valueHeader: string;
  netWealthHeader: string;
  zakatDueHeader: string;
  zakatBeforeAdjustmentsHeader: string;
  generatedNote: string;
  finalCalculationRows: {
    collectibleReceivables: string;
    doubtfulReceivablesExcluded: string;
    debtsDueNow: string;
    debtNetImpact: string;
    finalZakatableBase: string;
    adjustedCashPoolDue: string;
    independentCashDue: string;
    totalPayableDueNow: string;
    finalZakatDueRate: string;
    doubtfulExcludedNote: string;
  };
  groupedRows: {
    dueNowMoney: string;
    dueNowSpecial: string;
    notDueYet: string;
    debtAdjustment: string;
    dueStatus: string;
    dueNow: string;
    notDue: string;
    unknown: string;
    unknownEvent: string;
    hawlDueDate: string;
    eventDate: string;
  };
  quickRows: {
    cashBank: string;
    goldSilver: string;
    debtsOwed: string;
    netWealth: string;
  };
  reminderRows: {
    calculationDate: string;
    reminderScheduled: string;
    nextReminderDate: string;
    remindersDisabled: string;
    reminderNotScheduled: string;
    noUpcomingDueReminder: string;
  };
  resolveLivestockTypeLabel?: (type: LivestockType) => string;
  formatDueItems?: (items: DueItem[]) => string;
  resolveCategoryLabel?: (categoryIdOrLabel: string, fallbackLabel?: string) => string;
};

export function buildHistoryPdfHtml(
  entry: HistoryEntry,
  labels: HistoryPdfLabels,
): string {
  const locale = labels.locale;
  const totalDisplay = buildTotalDisplay({
    cashTotal: entry.totalZakat,
    currency: entry.currency,
    nonCashDue: resolveNonCashDueSummary(entry.summary.nonCashDue),
    labels: {
      kgUnit: labels.kgUnit,
      resolveLivestockTypeLabel: labels.resolveLivestockTypeLabel,
      formatDueItems: labels.formatDueItems,
    },
  });
  const categories = entry.summary.categoriesUsed
    .map((category) => {
      const canonicalCategory = normalizeHistoryCategoryId(category);
      return `<li>${escapeHtml(labels.resolveCategoryLabel?.(canonicalCategory, category) ?? category)}</li>`;
    })
    .join("");
  const detailedCalculationDate =
    entry.payload.kind === "detailed" ? entry.payload.calculationContext?.calculationDate : undefined;
  const reminderMetaLine =
    entry.payload.kind === "detailed" ? buildReminderMetaLine(entry, labels) : null;

  const body =
    entry.payload.kind === "quick"
      ? `
        <tr><td>${escapeHtml(labels.quickRows.cashBank)}</td><td>${formatMoney(entry.payload.inputs.cash, entry.currency)}</td></tr>
        <tr><td>${escapeHtml(labels.quickRows.goldSilver)}</td><td>${formatMoney(entry.payload.inputs.goldValue, entry.currency)}</td></tr>
        <tr><td>${escapeHtml(labels.quickRows.debtsOwed)}</td><td>${formatMoney(entry.payload.inputs.debt, entry.currency)}</td></tr>
        <tr><td>${escapeHtml(labels.quickRows.netWealth)}</td><td>${formatMoney(entry.payload.result.totalWealth, entry.currency)}</td></tr>
      `
      : (() => {
          const isMoneyCategory = (category: string) =>
            ["salary", "agri_other", "trade_sector", "industrial_sector"].includes(category);
          const classify = (item: (typeof entry.payload.lineItems)[number]) => {
            const canonicalCategory = normalizeHistoryCategoryId(item.category);
            if (canonicalCategory === "debt") return "debt";
            const dueNow = item.meta?.dueNow ?? true;
            const debtAdjustable = item.meta?.debtAdjustable ?? isMoneyCategory(canonicalCategory);
            if (!dueNow) return "not_due";
            if (debtAdjustable) return "due_money";
            return "due_special";
          };
          const grouped = {
            due_money: entry.payload.lineItems.filter((item) => classify(item) === "due_money"),
            due_special: entry.payload.lineItems.filter((item) => classify(item) === "due_special"),
            not_due: entry.payload.lineItems.filter((item) => classify(item) === "not_due"),
            debt: entry.payload.lineItems.filter((item) => classify(item) === "debt"),
          };
          const renderItemRow = (item: (typeof entry.payload.lineItems)[number]) => {
            const metaParts: string[] = [];
            if (item.meta) {
              const dueStatus = resolveEligibilityDueStatus(item.meta);
              metaParts.push(
                `${labels.groupedRows.dueStatus}: ${
                  dueStatus === "due_now"
                    ? labels.groupedRows.dueNow
                    : dueStatus === "unknown"
                      ? item.meta.obligationMode === "event_based"
                        ? labels.groupedRows.unknownEvent
                        : labels.groupedRows.unknown
                      : labels.groupedRows.notDue
                }`,
              );
              if (item.meta.hawlDueDate) {
                metaParts.push(
                  `${labels.groupedRows.hawlDueDate}: ${formatHistoryIsoDate(item.meta.hawlDueDate, locale)}`,
                );
              }
              if (item.meta.eventDate) {
                metaParts.push(
                  `${labels.groupedRows.eventDate}: ${formatHistoryIsoDate(item.meta.eventDate, locale)}`,
                );
              }
            }
            return `
              <tr>
                <td>
                  ${escapeHtml(labels.resolveCategoryLabel?.(normalizeHistoryCategoryId(item.category), item.label ?? item.category) ?? item.label ?? item.category)}
                  ${metaParts.length > 0 ? `<div class="meta-inline" dir="auto">${escapeHtml(metaParts.join(" | "))}</div>` : ""}
                </td>
                <td>${formatMoney(item.totalWealth, entry.currency)}</td>
                <td>${formatMoney(item.totalZakat, entry.currency)}</td>
              </tr>
            `;
          };
          const renderGroup = (title: string, items: (typeof entry.payload.lineItems)[number][]) => {
            if (items.length === 0) return "";
            return `
              <tr class="group-row"><td colspan="3"><strong>${escapeHtml(title)}</strong></td></tr>
              ${items.map((item) => renderItemRow(item)).join("")}
            `;
          };

          return [
            renderGroup(labels.groupedRows.dueNowMoney, grouped.due_money),
            renderGroup(labels.groupedRows.dueNowSpecial, grouped.due_special),
            renderGroup(labels.groupedRows.notDueYet, grouped.not_due),
            renderGroup(labels.groupedRows.debtAdjustment, grouped.debt),
          ].join("");
        })();
  const detailedFinalSection =
    entry.payload.kind === "detailed" && entry.payload.finalCalculation?.hasDebtLineItem
      ? `
        <h2>${escapeHtml(labels.finalCalculationTitle)}</h2>
        <table>
          <tbody>
            <tr><td>${escapeHtml(labels.debtAdjustmentTitle)}</td><td></td></tr>
            <tr><td>${escapeHtml(labels.finalCalculationRows.collectibleReceivables)}</td><td>${formatMoney(entry.payload.finalCalculation.debtAdjustment.collectibleReceivablesCurrent, entry.currency)}</td></tr>
            <tr><td>${escapeHtml(labels.finalCalculationRows.doubtfulReceivablesExcluded)}</td><td>${formatMoney(entry.payload.finalCalculation.debtAdjustment.doubtfulReceivables, entry.currency)}</td></tr>
            <tr><td>${escapeHtml(labels.finalCalculationRows.debtsDueNow)}</td><td>${formatMoney(-Math.abs(entry.payload.finalCalculation.debtAdjustment.debtsYouOweDueNow), entry.currency)}</td></tr>
            <tr><td>${escapeHtml(labels.finalCalculationRows.debtNetImpact)}</td><td>${formatMoney(entry.payload.finalCalculation.debtAdjustment.netAdjustment, entry.currency)}</td></tr>
            <tr><td><strong>${escapeHtml(labels.finalCalculationRows.finalZakatableBase)}</strong></td><td><strong>${formatMoney(entry.payload.finalCalculation.finalZakatableBase, entry.currency)}</strong></td></tr>
            <tr><td><strong>${escapeHtml(labels.finalCalculationRows.adjustedCashPoolDue)}</strong></td><td><strong>${formatMoney(entry.payload.finalCalculation.adjustedCashPoolZakatDue ?? entry.payload.finalCalculation.finalZakatDue, entry.currency)}</strong></td></tr>
            <tr><td>${escapeHtml(labels.finalCalculationRows.independentCashDue)}</td><td>${formatMoney(entry.payload.finalCalculation.independentNonDebtAdjustableCashDue ?? 0, entry.currency)}</td></tr>
            <tr><td><strong>${escapeHtml(labels.finalCalculationRows.totalPayableDueNow)}</strong></td><td><strong>${formatMoney(entry.payload.finalCalculation.finalZakatDue, entry.currency)}</strong></td></tr>
          </tbody>
        </table>
        <p class="note">${escapeHtml(labels.finalCalculationRows.doubtfulExcludedNote)}</p>
      `
      : "";

  return `
    <!DOCTYPE html>
    <html lang="auto" dir="auto">
      <head>
        <meta charset="utf-8" />
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>${escapeHtml(labels.documentTitle)}</title>
        <style>
          body {
            font-family: "Noto Sans", "Noto Naskh Arabic", "Noto Sans Arabic", "Arial Unicode MS", "Segoe UI", Tahoma, Arial, sans-serif;
            color: #173b34;
            padding: 32px;
          }
          h1 { margin: 0 0 8px; font-size: 28px; }
          h2 { margin: 28px 0 12px; font-size: 18px; }
          p, li, td, th { font-size: 14px; line-height: 1.5; }
          .meta { color: #57716b; margin: 0 0 20px; }
          .total { background: #0f6a57; color: #fff; border-radius: 12px; padding: 20px; }
          .total-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.85; }
          .total-value { font-size: 34px; font-weight: 700; margin-top: 6px; }
          .total-suffix { margin-top: 4px; color: #d8f1ec; font-size: 13px; font-weight: 600; }
          ul { margin: 0; padding-left: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border-bottom: 1px solid #d9e5e1; padding: 10px 0; text-align: left; }
          th:last-child, td:last-child { text-align: right; }
          .group-row td { background: #f4f7f6; border-bottom-color: #d0dfda; padding: 8px 10px; }
          .meta-inline { color: #57716b; font-size: 12px; margin-top: 2px; unicode-bidi: plaintext; }
          .note { margin-top: 24px; color: #57716b; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(entry.flowType === "quick" ? labels.titleQuick : labels.titleDetailed)}</h1>
        <p class="meta" dir="auto">${escapeHtml(labels.savedPrefix)} ${escapeHtml(formatHistoryDateTime(entry.createdAt, locale))}</p>
        ${
          detailedCalculationDate
            ? `<p class="meta" dir="auto">${escapeHtml(
                labels.reminderRows.calculationDate,
              )}: ${escapeHtml(formatHistoryIsoDate(detailedCalculationDate, locale))}</p>`
            : ""
        }
        ${reminderMetaLine ? `<p class="meta" dir="auto">${escapeHtml(reminderMetaLine)}</p>` : ""}
        <div class="total">
          <div class="total-label">${escapeHtml(labels.totalLabel)}</div>
          <div class="total-value">${escapeHtml(totalDisplay.primaryDisplay)}</div>
          ${totalDisplay.suffixDisplay ? `<div class="total-suffix">+ ${escapeHtml(totalDisplay.suffixDisplay)}</div>` : ""}
        </div>
        <h2>${escapeHtml(labels.categoriesUsed)}</h2>
        <ul>${categories}</ul>
        <h2>${escapeHtml(entry.payload.kind === "quick" ? labels.quickSnapshotTitle : labels.detailedBreakdownTitle)}</h2>
        <table>
          <thead>
            <tr>
              <th>${escapeHtml(entry.payload.kind === "quick" ? labels.fieldHeader : labels.categoryHeader)}</th>
              <th>${escapeHtml(entry.payload.kind === "quick" ? labels.valueHeader : labels.netWealthHeader)}</th>
              ${
                entry.payload.kind === "quick"
                  ? ""
                  : `<th>${escapeHtml(
                      entry.payload.finalCalculation?.hasDebtLineItem
                        ? labels.zakatBeforeAdjustmentsHeader
                        : labels.zakatDueHeader,
                    )}</th>`
              }
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
        ${detailedFinalSection}
        <p class="note">${escapeHtml(labels.generatedNote)}</p>
      </body>
    </html>
  `;
}

function buildReminderMetaLine(entry: HistoryEntry, labels: HistoryPdfLabels): string | null {
  if (entry.payload.kind !== "detailed") return null;
  const reminderState = resolveDetailedReminderDisplayState(entry.payload);
  const reminderLabels = labels.reminderRows;
  const locale = labels.locale;
  const formatReminderDate = (value: string) => formatHistoryIsoDate(value, locale);

  if (reminderState.state === "scheduled") {
    return `${reminderLabels.reminderScheduled} | ${reminderLabels.nextReminderDate}: ${formatReminderDate(reminderState.reminderDate)}`;
  }
  if (reminderState.state === "disabled") {
    return `${reminderLabels.remindersDisabled} | ${reminderLabels.nextReminderDate}: ${formatReminderDate(reminderState.reminderDate)}`;
  }
  if (reminderState.state === "not_scheduled") {
    if (reminderState.reminderDate) {
      return `${reminderLabels.reminderNotScheduled} | ${reminderLabels.nextReminderDate}: ${formatReminderDate(reminderState.reminderDate)}`;
    }
    return reminderLabels.reminderNotScheduled;
  }
  return reminderLabels.noUpcomingDueReminder;
}

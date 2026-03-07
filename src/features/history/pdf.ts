import type { HistoryEntry } from "./types";
import { formatMoney } from "../../lib/currency";
import { buildTotalDisplay, resolveNonCashDueSummary } from "./totalDisplay";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export type HistoryPdfLabels = {
  kgUnit: string;
  titleQuick: string;
  titleDetailed: string;
  savedPrefix: string;
  totalLabel: string;
  categoriesUsed: string;
  quickSnapshotTitle: string;
  detailedBreakdownTitle: string;
  fieldHeader: string;
  categoryHeader: string;
  valueHeader: string;
  netWealthHeader: string;
  zakatDueHeader: string;
  generatedNote: string;
  quickRows: {
    cashBank: string;
    goldSilver: string;
    debtsOwed: string;
    netWealth: string;
  };
};

export function buildHistoryPdfHtml(
  entry: HistoryEntry,
  labels: HistoryPdfLabels,
): string {
  const totalDisplay = buildTotalDisplay({
    cashTotal: entry.totalZakat,
    currency: entry.currency,
    nonCashDue: resolveNonCashDueSummary(entry.summary.nonCashDue),
    labels: { kgUnit: labels.kgUnit },
  });
  const categories = entry.summary.categoriesUsed
    .map((category) => `<li>${escapeHtml(category)}</li>`)
    .join("");

  const body =
    entry.payload.kind === "quick"
      ? `
        <tr><td>${escapeHtml(labels.quickRows.cashBank)}</td><td>${formatMoney(entry.payload.inputs.cash, entry.currency)}</td></tr>
        <tr><td>${escapeHtml(labels.quickRows.goldSilver)}</td><td>${formatMoney(entry.payload.inputs.goldValue, entry.currency)}</td></tr>
        <tr><td>${escapeHtml(labels.quickRows.debtsOwed)}</td><td>${formatMoney(entry.payload.inputs.debt, entry.currency)}</td></tr>
        <tr><td>${escapeHtml(labels.quickRows.netWealth)}</td><td>${formatMoney(entry.payload.result.totalWealth, entry.currency)}</td></tr>
      `
      : entry.payload.lineItems
          .map(
            (item) => `
              <tr>
                <td>${escapeHtml(item.label)}</td>
                <td>${formatMoney(item.totalWealth, entry.currency)}</td>
                <td>${formatMoney(item.totalZakat, entry.currency)}</td>
              </tr>
            `,
          )
          .join("");

  return `
    <!DOCTYPE html>
    <html lang="auto">
      <head>
        <meta charset="utf-8" />
        <title>History Details</title>
        <style>
          body { font-family: Arial, sans-serif; color: #173b34; padding: 32px; }
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
          .note { margin-top: 24px; color: #57716b; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(entry.flowType === "quick" ? labels.titleQuick : labels.titleDetailed)}</h1>
        <p class="meta">${escapeHtml(labels.savedPrefix)} ${escapeHtml(formatDate(entry.createdAt))}</p>
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
              ${entry.payload.kind === "quick" ? "" : `<th>${escapeHtml(labels.zakatDueHeader)}</th>`}
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
        <p class="note">${escapeHtml(labels.generatedNote)}</p>
      </body>
    </html>
  `;
}

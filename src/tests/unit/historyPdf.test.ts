import { buildHistoryPdfHtml } from "../../features/history/pdf";
import type { HistoryEntry } from "../../features/history/types";

const labels = {
  kgUnit: "kg",
  titleQuick: "Quick Calculation",
  titleDetailed: "Detailed Calculation",
  savedPrefix: "Saved",
  totalLabel: "Total Zakat Due",
  categoriesUsed: "Categories Used",
  quickSnapshotTitle: "Inputs Snapshot",
  detailedBreakdownTitle: "Calculation Breakdown",
  finalCalculationTitle: "Final Zakat Calculation",
  debtAdjustmentTitle: "Debt Adjustment",
  fieldHeader: "Field",
  categoryHeader: "Category",
  valueHeader: "Value",
  netWealthHeader: "Net Wealth",
  zakatDueHeader: "Zakat Due",
  zakatBeforeAdjustmentsHeader: "Zakat Before Adjustments",
  generatedNote: "Generated from local history on this device.",
  finalCalculationRows: {
    collectibleReceivables: "Collectible receivables",
    doubtfulReceivablesExcluded: "Doubtful receivables (excluded)",
    debtsDueNow: "Debts currently due",
    debtNetImpact: "Net base impact",
    finalZakatableBase: "Final zakatable base",
    adjustedCashPoolDue: "Adjusted cash-pool zakat due (2.5%)",
    independentCashDue: "Independent non-debt-adjustable cash due",
    totalPayableDueNow: "Total payable due now",
    finalZakatDueRate: "Final zakat due (2.5%)",
    doubtfulExcludedNote: "Doubtful receivables are excluded until they are collected.",
  },
  quickRows: {
    cashBank: "Cash & Bank",
    goldSilver: "Gold & Silver",
    debtsOwed: "Debts Owed",
    netWealth: "Net Wealth",
  },
  resolveCategoryLabel: (categoryIdOrLabel: string, fallbackLabel?: string) => {
    const map: Record<string, string> = {
      livestock: "Livestock",
      produce: "Grains & Fruits",
      agri_other: "Other Agricultural Products",
    };
    return map[categoryIdOrLabel] ?? fallbackLabel ?? categoryIdOrLabel;
  },
} as const;

function buildBaseDetailedEntry(): HistoryEntry {
  return {
    id: "entry-1",
    flowType: "detailed",
    createdAt: "2026-03-07T00:03:00.000Z",
    updatedAt: "2026-03-07T00:03:00.000Z",
    totalZakat: 0,
    currency: "MAD",
    nisabSnapshot: {
      method: "silver",
      silverPricePerGram: 12,
      goldPricePerGram: 800,
      override: null,
    },
    summary: {
      categoriesUsed: ["livestock", "produce"],
      itemCount: 2,
    },
    payload: {
      kind: "detailed",
      combinedTotal: 0,
      lineItems: [
        {
          id: "l1",
          category: "livestock",
          label: "Livestock",
          totalZakat: 0,
          totalWealth: 0,
          details: ["Type: camels", "Owned: 30", "Due: 1 bint makhad"],
        },
        {
          id: "p1",
          category: "produce",
          label: "Grains & Fruits",
          totalZakat: 0,
          totalWealth: 3000,
          details: ["Mode: harvest", "Due produce: 300.00 kg"],
        },
      ],
    },
  };
}

describe("buildHistoryPdfHtml total display", () => {
  it("keeps MAD 0.00 and shows non-cash as suffix when cash total is zero", () => {
    const entry = buildBaseDetailedEntry();
    entry.summary.nonCashDue = {
      livestock: ["Camels: 1 bint makhad"],
      produceKg: 300,
    };

    const html = buildHistoryPdfHtml(entry, labels).replace(/\u00a0/g, " ");

    expect(html).toContain('<div class="total-value">MAD 0.00</div>');
    expect(html).toContain('<div class="total-suffix">+ Camels: 1 bint makhad | 300.00 kg</div>');
  });

  it("does not include suffix when structured non-cash summary is absent", () => {
    const entry = buildBaseDetailedEntry();
    entry.totalZakat = 1200;
    if (entry.payload.kind === "detailed") {
      entry.payload.combinedTotal = 1200;
    }

    const html = buildHistoryPdfHtml(entry, labels);

    expect(html.replace(/\u00a0/g, " ")).toContain('<div class="total-value">MAD 1,200.00</div>');
    expect(html).not.toContain('class="total-suffix"');
  });

  it("renders debt adjustment and final calculation sections when finalCalculation exists", () => {
    const entry = buildBaseDetailedEntry();
    entry.totalZakat = 325;
    if (entry.payload.kind === "detailed") {
      entry.payload.lineItems = [
        {
          id: "c1",
          category: "agri_other",
          label: "Other Agricultural Products",
          totalZakat: 250,
          totalWealth: 10000,
          details: ["Net value: MAD 10,000.00"],
        },
      ];
      entry.payload.finalCalculation = {
        cashBaseBeforeDebt: 10000,
        debtAdjustment: {
          collectibleReceivablesCurrent: 10000,
          doubtfulReceivables: 0,
          debtsYouOweDueNow: 7000,
          netAdjustment: 3000,
        },
        finalZakatableBase: 13000,
        finalZakatRate: 0.025,
        adjustedCashPoolZakatDue: 325,
        independentNonDebtAdjustableCashDue: 0,
        finalZakatDue: 325,
        hasDebtLineItem: true,
      };
      entry.payload.combinedTotal = 325;
    }

    const html = buildHistoryPdfHtml(entry, labels).replace(/\u00a0/g, " ");

    expect(html).toContain("<th>Zakat Before Adjustments</th>");
    expect(html).toContain("<h2>Final Zakat Calculation</h2>");
    expect(html).toContain("Debt Adjustment");
    expect(html).toContain("Final zakatable base");
    expect(html).toContain("Adjusted cash-pool zakat due (2.5%)");
    expect(html).toContain("Independent non-debt-adjustable cash due");
    expect(html).toContain("Total payable due now");
    expect(html).toContain("Doubtful receivables (excluded)");
    expect(html).toContain("MAD 325.00");
  });

  it("re-localizes categories using category ids instead of saved labels", () => {
    const entry = buildBaseDetailedEntry();
    entry.summary.categoriesUsed = ["livestock"];
    if (entry.payload.kind === "detailed") {
      entry.payload.lineItems = [
        {
          id: "f1",
          category: "produce",
          label: "Saved English Label",
          totalZakat: 100,
          totalWealth: 4000,
          details: ["Mode: harvest"],
        },
      ];
    }
    const frenchLabels = {
      ...labels,
      resolveCategoryLabel: (categoryIdOrLabel: string, fallbackLabel?: string) => {
        const frMap: Record<string, string> = {
          livestock: "Betail",
          produce: "Cereales et Fruits",
        };
        return frMap[categoryIdOrLabel] ?? fallbackLabel ?? categoryIdOrLabel;
      },
    };

    const html = buildHistoryPdfHtml(entry, frenchLabels);

    expect(html).toContain("Betail");
    expect(html).toContain("Cereales et Fruits");
    expect(html).not.toContain("Saved English Label");
  });

  it("keeps legacy detailed output when finalCalculation is absent", () => {
    const entry = buildBaseDetailedEntry();

    const html = buildHistoryPdfHtml(entry, labels);

    expect(html).toContain("<th>Zakat Due</th>");
    expect(html).not.toContain("<h2>Final Zakat Calculation</h2>");
    expect(html).not.toContain("Zakat Before Adjustments");
  });
});

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
  fieldHeader: "Field",
  categoryHeader: "Category",
  valueHeader: "Value",
  netWealthHeader: "Net Wealth",
  zakatDueHeader: "Zakat Due",
  generatedNote: "Generated from local history on this device.",
  quickRows: {
    cashBank: "Cash & Bank",
    goldSilver: "Gold & Silver",
    debtsOwed: "Debts Owed",
    netWealth: "Net Wealth",
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
      categoriesUsed: ["Livestock", "Grains & Fruits"],
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
});

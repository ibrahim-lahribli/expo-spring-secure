import { buildHistoryPdfHtml } from "../../features/history/pdf";
import { formatHistoryIsoDate } from "../../features/history/dateFormatting";
import type { HistoryEntry } from "../../features/history/types";

const labels = {
  documentTitle: "History Details",
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
  groupedRows: {
    dueNowMoney: "Due now - money categories",
    dueNowSpecial: "Due now - special categories",
    notDueYet: "Not due yet",
    debtAdjustment: "Debt adjustment",
    dueStatus: "Due status",
    dueNow: "Due now",
    notDue: "Not due yet",
    unknown: "Hawl date missing / unknown",
    unknownEvent: "Event date missing / unknown",
    hawlDueDate: "Hawl due date",
    eventDate: "Event date",
  },
  quickRows: {
    cashBank: "Cash & Bank",
    goldSilver: "Gold & Silver",
    debtsOwed: "Debts Owed",
    netWealth: "Net Wealth",
  },
  reminderRows: {
    calculationDate: "Calculation date",
    reminderScheduled: "Reminder scheduled",
    nextReminderDate: "Next reminder date",
    remindersDisabled: "Reminders disabled",
    reminderNotScheduled: "Reminder not scheduled",
    noUpcomingDueReminder: "No upcoming due reminder",
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
      calculationContext: {
        calculationDate: "2026-03-07",
      },
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
    expect(html).toContain("Due now - special categories");
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
    expect(html).toContain("Due now - money categories");
    expect(html).toContain("Debt Adjustment");
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

  it("uses event-based unknown due-status text when event date is missing", () => {
    const entry = buildBaseDetailedEntry();
    if (entry.payload.kind !== "detailed") {
      throw new Error("Expected detailed payload");
    }
    entry.payload.lineItems = [
      {
        id: "missing-event-1",
        category: "produce",
        label: "Produce",
        totalZakat: 0,
        totalWealth: 3000,
        details: ["Mode: harvest"],
        meta: {
          obligationMode: "event_based",
          dueNow: false,
          debtAdjustable: false,
        },
      },
    ];

    const html = buildHistoryPdfHtml(entry, labels);

    expect(html).toContain("Due status: Event date missing / unknown");
    expect(html).not.toContain("Due status: Hawl date missing / unknown");
  });

  it("shows calculation date and reminder status metadata when scheduled reminder exists", () => {
    const entry = buildBaseDetailedEntry();
    if (entry.payload.kind !== "detailed") {
      throw new Error("Expected detailed payload");
    }
    entry.payload.reminders = [
      {
        id: "rem-1",
        historyEntryId: entry.id,
        lineItemId: "l1",
        type: "hawl_due",
        reminderDate: "2026-12-21",
        scheduledNotificationId: "notif-1",
        enabled: true,
        status: "scheduled",
      },
    ];

    const html = buildHistoryPdfHtml(entry, labels);
    const expectedReminderDate = formatHistoryIsoDate("2026-12-21", labels.locale);

    expect(html).toContain("Calculation date");
    expect(html).toContain("07 Mar 2026");
    expect(html).toContain("Reminder scheduled");
    expect(html).toContain(`Next reminder date: ${expectedReminderDate}`);
  });

  it("uses the localized document title for exported html", () => {
    const entry = buildBaseDetailedEntry();

    const html = buildHistoryPdfHtml(entry, {
      ...labels,
      documentTitle: "Détails de l'historique",
    });

    expect(html).toContain("<title>Détails de l&#39;historique</title>");
  });

  it("renders french accented labels without corruption", () => {
    const entry = buildBaseDetailedEntry();
    const frenchLabels = {
      ...labels,
      savedPrefix: "Enregistré",
      categoryHeader: "Catégorie",
      generatedNote: "Généré depuis l'historique local sur cet appareil.",
      resolveCategoryLabel: (categoryIdOrLabel: string, fallbackLabel?: string) => {
        const frMap: Record<string, string> = {
          livestock: "Bétail",
          produce: "Céréales et Fruits",
        };
        return frMap[categoryIdOrLabel] ?? fallbackLabel ?? categoryIdOrLabel;
      },
    };

    const html = buildHistoryPdfHtml(entry, frenchLabels);

    expect(html).toContain('<html lang="auto" dir="auto">');
    expect(html).toContain('<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />');
    expect(html).toContain("Noto Sans Arabic");
    expect(html).toContain("Enregistré");
    expect(html).toContain("<th>Catégorie</th>");
    expect(html).toContain("Céréales et Fruits");
    expect(html).toContain("Généré depuis l&#39;historique local sur cet appareil.");
  });

  it("renders arabic localized pdf labels and reminder metadata", () => {
    const entry = buildBaseDetailedEntry();
    if (entry.payload.kind !== "detailed") {
      throw new Error("Expected detailed payload");
    }
    entry.payload.reminders = [
      {
        id: "rem-ar-1",
        historyEntryId: entry.id,
        lineItemId: "l1",
        type: "hawl_due",
        reminderDate: "2026-12-21",
        scheduledNotificationId: "notif-ar-1",
        enabled: true,
        status: "scheduled",
      },
    ];

    const arabicLabels = {
      ...labels,
      savedPrefix: "تم الحفظ",
      categoryHeader: "الفئة",
      fieldHeader: "الحقل",
      valueHeader: "القيمة",
      generatedNote: "تم إنشاء هذا الملف من السجل المحلي على هذا الجهاز.",
      reminderRows: {
        calculationDate: "تاريخ الحساب",
        reminderScheduled: "تمت جدولة التذكير",
        nextReminderDate: "تاريخ التذكير القادم",
        remindersDisabled: "التذكيرات معطلة",
        reminderNotScheduled: "لم تتم جدولة التذكير",
        noUpcomingDueReminder: "لا يوجد تذكير استحقاق قادم",
      },
      resolveCategoryLabel: (categoryIdOrLabel: string, fallbackLabel?: string) => {
        const arMap: Record<string, string> = {
          livestock: "الأنعام",
          produce: "الحبوب والثمار",
        };
        return arMap[categoryIdOrLabel] ?? fallbackLabel ?? categoryIdOrLabel;
      },
    };

    const html = buildHistoryPdfHtml(entry, arabicLabels);
    const expectedReminderDate = formatHistoryIsoDate("2026-12-21", arabicLabels.locale);

    expect(html).toContain("تم الحفظ");
    expect(html).toContain("<th>الفئة</th>");
    expect(html).toContain("الأنعام");
    expect(html).toContain("تمت جدولة التذكير");
    expect(html).toContain(`تاريخ التذكير القادم: ${expectedReminderDate}`);
    expect(html).toContain("تم إنشاء هذا الملف من السجل المحلي على هذا الجهاز.");
  });

  it("renders mixed-language grouped sections with reminder metadata", () => {
    const entry = buildBaseDetailedEntry();
    if (entry.payload.kind !== "detailed") {
      throw new Error("Expected detailed payload");
    }
    entry.payload.lineItems = [
      {
        id: "mix-1",
        category: "salary",
        label: "Salaire",
        totalZakat: 100,
        totalWealth: 4000,
        details: ["Montant net: 4000"],
        meta: {
          obligationMode: "hawl_required",
          dueNow: true,
          debtAdjustable: true,
          hawlStartDate: "2025-10-12",
          hawlDueDate: "2026-10-01",
          hawlCompleted: true,
        },
      },
      {
        id: "mix-2",
        category: "livestock",
        label: "Livestock",
        totalZakat: 0,
        totalWealth: 0,
        details: ["Type: sheep"],
        meta: { obligationMode: "hawl_required", dueNow: true, debtAdjustable: false },
      },
      {
        id: "mix-3",
        category: "produce",
        label: "Produce",
        totalZakat: 0,
        totalWealth: 3000,
        details: ["Mode: harvest"],
        meta: {
          obligationMode: "event_based",
          dueNow: false,
          debtAdjustable: false,
          eventDate: "2026-08-01",
        },
      },
      {
        id: "mix-4",
        category: "debt",
        label: "Dette",
        totalZakat: 0,
        totalWealth: 0,
        details: ["Net: 0"],
      },
    ];
    entry.payload.reminders = [
      {
        id: "mix-rem-1",
        historyEntryId: entry.id,
        lineItemId: "mix-1",
        type: "hawl_due",
        reminderDate: "2026-12-21",
        scheduledNotificationId: "mix-notif-1",
        enabled: true,
        status: "scheduled",
      },
    ];

    const mixedLabels = {
      ...labels,
      groupedRows: {
        ...labels.groupedRows,
        dueNowMoney: "Due maintenant - money",
        dueNowSpecial: "الآن - فئات خاصة",
        notDueYet: "Pas encore exigible",
      },
      reminderRows: {
        calculationDate: "Date de calcul",
        reminderScheduled: "Rappel programmé",
        nextReminderDate: "موعد التذكير القادم",
        remindersDisabled: "Rappels désactivés",
        reminderNotScheduled: "Rappel non programmé",
        noUpcomingDueReminder: "Aucun rappel",
      },
    };

    const html = buildHistoryPdfHtml(entry, mixedLabels);
    const expectedReminderDate = formatHistoryIsoDate("2026-12-21", mixedLabels.locale);

    expect(html).toContain("Due maintenant - money");
    expect(html).toContain("الآن - فئات خاصة");
    expect(html).toContain("Pas encore exigible");
    expect(html).toContain("Debt adjustment");
    expect(html).toContain(`Rappel programmé | موعد التذكير القادم: ${expectedReminderDate}`);
  });
});

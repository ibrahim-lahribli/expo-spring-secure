import {
  getScheduledNotificationIdsFromEntry,
  resolveDetailedReminderDisplayState,
} from "../../features/history/reminders";
import type { HistoryEntry } from "../../features/history/types";

function buildDetailedEntry(): HistoryEntry {
  return {
    id: "entry-1",
    flowType: "detailed",
    createdAt: "2026-03-10T00:00:00.000Z",
    updatedAt: "2026-03-10T00:00:00.000Z",
    totalZakat: 100,
    currency: "MAD",
    nisabSnapshot: {
      method: "silver",
      silverPricePerGram: 12,
      goldPricePerGram: 800,
      override: null,
    },
    summary: {
      categoriesUsed: ["salary"],
      itemCount: 1,
    },
    payload: {
      kind: "detailed",
      calculationContext: {
        calculationDate: "2026-03-10",
      },
      combinedTotal: 100,
      lineItems: [
        {
          id: "line-1",
          category: "salary",
          totalZakat: 100,
          totalWealth: 4000,
          details: [],
          meta: {
            obligationMode: "hawl_required",
            hawlStartDate: "2026-01-01",
            hawlDueDate: "2026-12-21",
            dueNow: false,
            debtAdjustable: true,
          },
        },
      ],
    },
  };
}

describe("history reminder helpers", () => {
  it("extracts scheduled notification ids from detailed entries", () => {
    const entry = buildDetailedEntry();
    if (entry.payload.kind !== "detailed") {
      throw new Error("Expected detailed payload");
    }
    entry.payload.reminders = [
      {
        id: "rem-1",
        historyEntryId: entry.id,
        type: "hawl_due",
        reminderDate: "2026-12-21",
        scheduledNotificationId: "notif-1",
        enabled: true,
        status: "scheduled",
      },
    ];

    expect(getScheduledNotificationIdsFromEntry(entry)).toEqual(["notif-1"]);
  });

  it("resolves scheduled reminder display state", () => {
    const entry = buildDetailedEntry();
    if (entry.payload.kind !== "detailed") {
      throw new Error("Expected detailed payload");
    }
    entry.payload.reminders = [
      {
        id: "rem-1",
        historyEntryId: entry.id,
        type: "hawl_due",
        reminderDate: "2026-12-21",
        scheduledNotificationId: "notif-1",
        enabled: true,
        status: "scheduled",
      },
    ];

    expect(resolveDetailedReminderDisplayState(entry.payload, "2026-03-11")).toEqual({
      state: "scheduled",
      reminderDate: "2026-12-21",
    });
  });

  it("resolves disabled reminder display state", () => {
    const entry = buildDetailedEntry();
    if (entry.payload.kind !== "detailed") {
      throw new Error("Expected detailed payload");
    }
    entry.payload.reminders = [
      {
        id: "rem-1",
        historyEntryId: entry.id,
        type: "hawl_due",
        reminderDate: "2026-12-21",
        enabled: false,
        status: "disabled_by_preference",
      },
    ];

    expect(resolveDetailedReminderDisplayState(entry.payload, "2026-03-11")).toEqual({
      state: "disabled",
      reminderDate: "2026-12-21",
    });
  });

  it("resolves none when no future due reminder exists", () => {
    const entry = buildDetailedEntry();
    if (entry.payload.kind !== "detailed") {
      throw new Error("Expected detailed payload");
    }
    entry.payload.lineItems[0].meta = {
      obligationMode: "hawl_required",
      hawlStartDate: "2025-01-01",
      hawlDueDate: "2025-12-21",
      dueNow: true,
      debtAdjustable: true,
    };

    expect(resolveDetailedReminderDisplayState(entry.payload, "2026-03-11")).toEqual({
      state: "none",
    });
  });
});

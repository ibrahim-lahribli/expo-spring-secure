import {
  deleteGuestHistoryEntry,
  getGuestHistoryEntries,
  upsertGuestHistoryEntry,
} from "../../features/history/storage";
import type { HistoryEntry } from "../../features/history/types";

const mockCancelScheduledLocalNotification = jest.fn();

jest.mock("../../features/reminders/scheduling", () => ({
  cancelScheduledLocalNotification: (...args: unknown[]) =>
    mockCancelScheduledLocalNotification(...args),
}));

function buildDetailedEntry(
  id: string,
  scheduledNotificationId: string,
): HistoryEntry {
  return {
    id,
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
      combinedTotal: 100,
      lineItems: [
        {
          id: "line-1",
          category: "salary",
          totalZakat: 100,
          totalWealth: 4000,
          details: [],
        },
      ],
      reminders: [
        {
          id: `rem-${id}`,
          historyEntryId: id,
          type: "hawl_due",
          reminderDate: "2026-12-21",
          scheduledNotificationId,
          enabled: true,
          status: "scheduled",
        },
      ],
    },
  };
}

describe("history storage reminder lifecycle", () => {
  beforeEach(() => {
    localStorage.clear();
    mockCancelScheduledLocalNotification.mockReset();
    mockCancelScheduledLocalNotification.mockResolvedValue(undefined);
  });

  it("cancels stale scheduled notification when an entry is replaced", async () => {
    await upsertGuestHistoryEntry(buildDetailedEntry("entry-1", "notif-old"));
    const replacement = buildDetailedEntry("entry-1", "notif-new");
    replacement.updatedAt = "2026-03-11T00:00:00.000Z";

    await upsertGuestHistoryEntry(replacement);

    expect(mockCancelScheduledLocalNotification).toHaveBeenCalledWith("notif-old");
    const entries = await getGuestHistoryEntries();
    expect(entries).toHaveLength(1);
    const detailed = entries[0]?.payload.kind === "detailed" ? entries[0].payload : null;
    expect(detailed?.reminders?.[0]).toEqual(
      expect.objectContaining({
        scheduledNotificationId: "notif-new",
      }),
    );
  });

  it("cancels scheduled notification when deleting an entry", async () => {
    await upsertGuestHistoryEntry(buildDetailedEntry("entry-2", "notif-delete"));

    await deleteGuestHistoryEntry("entry-2");

    expect(mockCancelScheduledLocalNotification).toHaveBeenCalledWith("notif-delete");
    const entries = await getGuestHistoryEntries();
    expect(entries).toEqual([]);
  });
});

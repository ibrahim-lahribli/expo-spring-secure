import {
  buildReminderTriggerDateAtNineLocal,
  cancelScheduledLocalNotification,
  scheduleHawlDueReminderNotification,
  selectEarliestFutureHawlReminderCandidate,
} from "../../features/reminders/scheduling";

describe("reminder scheduling helpers", () => {
  it("selects earliest future hawl due candidate and ignores non-hawl categories", () => {
    const candidate = selectEarliestFutureHawlReminderCandidate(
      [
        {
          id: "produce-1",
          category: "produce",
          meta: {
            obligationMode: "event_based",
            eventDate: "2026-04-01",
            dueNow: false,
            debtAdjustable: false,
          },
        },
        {
          id: "debt-1",
          category: "debt",
          meta: {
            obligationMode: "adjustment",
            dueNow: true,
            debtAdjustable: false,
          },
        },
        {
          id: "salary-2",
          category: "salary",
          meta: {
            obligationMode: "hawl_required",
            hawlStartDate: "2026-01-05",
            hawlDueDate: "2026-12-25",
            dueNow: false,
            debtAdjustable: true,
          },
        },
        {
          id: "salary-1",
          category: "salary",
          meta: {
            obligationMode: "hawl_required",
            hawlStartDate: "2026-01-01",
            hawlDueDate: "2026-12-21",
            dueNow: false,
            debtAdjustable: true,
          },
        },
      ],
      "2026-03-11",
    );

    expect(candidate).toEqual({
      lineItemId: "salary-1",
      reminderDate: "2026-12-21",
    });
  });

  it("returns null when no future hawl due candidate exists", () => {
    const candidate = selectEarliestFutureHawlReminderCandidate(
      [
        {
          id: "salary-1",
          category: "salary",
          meta: {
            obligationMode: "hawl_required",
            hawlStartDate: "2025-01-01",
            hawlDueDate: "2025-12-21",
            dueNow: true,
            debtAdjustable: true,
          },
        },
      ],
      "2026-03-11",
    );

    expect(candidate).toBeNull();
  });

  it("builds a reminder trigger at 09:00 local time", () => {
    const trigger = buildReminderTriggerDateAtNineLocal("2026-12-21");
    expect(trigger.getFullYear()).toBe(2026);
    expect(trigger.getMonth()).toBe(11);
    expect(trigger.getDate()).toBe(21);
    expect(trigger.getHours()).toBe(9);
    expect(trigger.getMinutes()).toBe(0);
  });

  it("schedules local notification when permission is granted", async () => {
    const setNotificationChannelAsync = jest.fn().mockResolvedValue(undefined);
    const scheduleNotificationAsync = jest.fn().mockResolvedValue("notif-1");
    const result = await scheduleHawlDueReminderNotification({
      reminderDate: "2026-12-21",
      title: "Zakat reminder",
      body: "Next due date",
      platformOs: "android",
      notificationsModule: {
        AndroidImportance: { DEFAULT: 3 },
        getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
        requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
        scheduleNotificationAsync,
        cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
        setNotificationChannelAsync,
      },
    });

    expect(setNotificationChannelAsync).toHaveBeenCalledTimes(1);
    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      status: "scheduled",
      scheduledNotificationId: "notif-1",
    });
  });

  it("returns permission_denied when notification permission is rejected", async () => {
    const result = await scheduleHawlDueReminderNotification({
      reminderDate: "2026-12-21",
      title: "Zakat reminder",
      body: "Next due date",
      platformOs: "ios",
      notificationsModule: {
        getPermissionsAsync: jest.fn().mockResolvedValue({ status: "denied" }),
        requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "denied" }),
        scheduleNotificationAsync: jest.fn().mockResolvedValue("notif-1"),
        cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
      },
    });

    expect(result).toEqual({ status: "permission_denied" });
  });

  it("skips scheduling on web", async () => {
    const result = await scheduleHawlDueReminderNotification({
      reminderDate: "2026-12-21",
      title: "Zakat reminder",
      body: "Next due date",
      platformOs: "web",
      notificationsModule: null,
    });
    expect(result).toEqual({ status: "not_supported" });
  });

  it("cancels a scheduled notification when id exists", async () => {
    const cancelScheduledNotificationAsync = jest.fn().mockResolvedValue(undefined);
    await cancelScheduledLocalNotification("notif-1", {
      platformOs: "ios",
      notificationsModule: {
        getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
        requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
        scheduleNotificationAsync: jest.fn().mockResolvedValue("notif-1"),
        cancelScheduledNotificationAsync,
      },
    });
    expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith("notif-1");
  });
});

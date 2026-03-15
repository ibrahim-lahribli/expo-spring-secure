import { Platform } from "react-native";
import { isValidIsoDate } from "../../lib/zakat-calculation/detailedCalculationContext";
import { resolveEligibilityDueStatus } from "../../lib/zakat-calculation/hawl";
import type { DetailedLineItemMeta } from "../../lib/zakat-calculation/detailedAggregation";

const ZAKAT_REMINDER_CHANNEL_ID = "zakat-reminders";

type NotificationsPermissionResponse = {
  status?: string;
};

type NotificationsScheduleInput = {
  content: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  };
  trigger: Date;
};

type NotificationsModule = {
  AndroidImportance?: {
    DEFAULT?: number;
  };
  getPermissionsAsync: () => Promise<NotificationsPermissionResponse>;
  requestPermissionsAsync: () => Promise<NotificationsPermissionResponse>;
  scheduleNotificationAsync: (input: NotificationsScheduleInput) => Promise<string>;
  cancelScheduledNotificationAsync: (id: string) => Promise<void>;
  setNotificationChannelAsync?: (
    channelId: string,
    channelInput: { name: string; importance?: number },
  ) => Promise<void>;
};

export type ReminderSchedulingLineItem = {
  id: string;
  category: string;
  meta: DetailedLineItemMeta;
};

export type FutureHawlReminderCandidate = {
  lineItemId: string;
  reminderDate: string;
};

export type ReminderSchedulingResult =
  | {
      status: "scheduled";
      scheduledNotificationId: string;
    }
  | {
      status: "permission_denied" | "not_supported";
    };

export function selectEarliestFutureHawlReminderCandidate(
  lineItems: ReminderSchedulingLineItem[],
  todayIsoDate: string = getTodayIsoDateLocal(),
): FutureHawlReminderCandidate | null {
  const candidates = lineItems
    .filter((item) => item.category !== "debt")
    .filter((item) => item.meta.obligationMode === "hawl_required")
    .filter((item) => resolveEligibilityDueStatus(item.meta) === "not_due_yet")
    .filter((item) => isValidIsoDate(item.meta.hawlDueDate))
    .filter((item) => (item.meta.hawlDueDate as string) > todayIsoDate)
    .map((item) => ({
      lineItemId: item.id,
      reminderDate: item.meta.hawlDueDate as string,
    }))
    .sort((a, b) =>
      a.reminderDate === b.reminderDate
        ? a.lineItemId.localeCompare(b.lineItemId)
        : a.reminderDate.localeCompare(b.reminderDate),
    );

  return candidates[0] ?? null;
}

export async function scheduleHawlDueReminderNotification(params: {
  reminderDate: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  platformOs?: string;
  notificationsModule?: NotificationsModule | null;
}): Promise<ReminderSchedulingResult> {
  const platformOs = params.platformOs ?? Platform.OS;
  if (platformOs === "web") {
    return { status: "not_supported" };
  }

  const notifications = params.notificationsModule ?? loadNotificationsModule();
  if (!notifications) {
    return { status: "not_supported" };
  }

  try {
    const hasPermission = await ensureNotificationPermission(notifications);
    if (!hasPermission) {
      return { status: "permission_denied" };
    }

    if (platformOs === "android" && notifications.setNotificationChannelAsync) {
      await notifications.setNotificationChannelAsync(ZAKAT_REMINDER_CHANNEL_ID, {
        name: "Zakat reminders",
        importance: notifications.AndroidImportance?.DEFAULT,
      });
    }

    const scheduledNotificationId = await notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        data: params.data,
      },
      trigger: buildReminderTriggerDateAtNineLocal(params.reminderDate),
    });

    return {
      status: "scheduled",
      scheduledNotificationId,
    };
  } catch (error) {
    console.error("Failed to schedule reminder notification", error);
    return { status: "not_supported" };
  }
}

export async function cancelScheduledLocalNotification(
  scheduledNotificationId: string | undefined | null,
  options?: {
    platformOs?: string;
    notificationsModule?: NotificationsModule | null;
  },
): Promise<void> {
  if (!scheduledNotificationId) return;

  const platformOs = options?.platformOs ?? Platform.OS;
  if (platformOs === "web") return;

  const notifications = options?.notificationsModule ?? loadNotificationsModule();
  if (!notifications) return;

  try {
    await notifications.cancelScheduledNotificationAsync(scheduledNotificationId);
  } catch (error) {
    console.error("Failed to cancel scheduled reminder notification", error);
  }
}

export function buildReminderTriggerDateAtNineLocal(reminderDate: string): Date {
  const [year, month, day] = reminderDate.split("-").map(Number);
  return new Date(year, month - 1, day, 9, 0, 0, 0);
}

function loadNotificationsModule(): NotificationsModule | null {
  try {
    return require("expo-notifications") as NotificationsModule;
  } catch (error) {
    console.warn("expo-notifications is not available in this environment", error);
    return null;
  }
}

async function ensureNotificationPermission(
  notifications: NotificationsModule,
): Promise<boolean> {
  const current = await notifications.getPermissionsAsync();
  if (current.status === "granted") return true;
  const requested = await notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

function getTodayIsoDateLocal(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

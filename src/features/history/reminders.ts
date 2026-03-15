import {
  resolveEligibilityDueStatus,
  type LineItemMeta,
} from "../../lib/zakat-calculation/hawl";
import { isValidIsoDate } from "../../lib/zakat-calculation/detailedCalculationContext";
import type {
  DetailedHistoryLineItem,
  DetailedHistoryPayload,
  DetailedHistoryReminder,
  DetailedHistoryScheduledReminder,
  HistoryEntry,
} from "./types";

export type DetailedReminderDisplayState =
  | { state: "scheduled"; reminderDate: string }
  | { state: "disabled"; reminderDate: string }
  | { state: "not_scheduled"; reminderDate?: string }
  | { state: "none" };

export function isDetailedHistoryScheduledReminder(
  reminder: DetailedHistoryReminder,
): reminder is DetailedHistoryScheduledReminder {
  return (
    "type" in reminder &&
    reminder.type === "hawl_due" &&
    "historyEntryId" in reminder &&
    typeof reminder.historyEntryId === "string"
  );
}

export function getScheduledRemindersFromPayload(
  payload: DetailedHistoryPayload,
): DetailedHistoryScheduledReminder[] {
  if (!payload.reminders?.length) return [];
  return payload.reminders.filter(isDetailedHistoryScheduledReminder);
}

export function getPrimaryScheduledReminder(
  payload: DetailedHistoryPayload,
): DetailedHistoryScheduledReminder | null {
  const scheduled = getScheduledRemindersFromPayload(payload);
  if (scheduled.length === 0) return null;
  return [...scheduled].sort((a, b) =>
    a.reminderDate === b.reminderDate
      ? a.id.localeCompare(b.id)
      : a.reminderDate.localeCompare(b.reminderDate),
  )[0];
}

export function getScheduledNotificationIdsFromEntry(entry: HistoryEntry): string[] {
  if (entry.payload.kind !== "detailed") return [];
  return getScheduledRemindersFromPayload(entry.payload)
    .map((reminder) => reminder.scheduledNotificationId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}

export function getEarliestFutureHawlDueDateFromHistoryLineItems(
  lineItems: DetailedHistoryLineItem[],
  todayIsoDate: string = getTodayIsoDateLocal(),
): string | null {
  const candidates = lineItems
    .filter((item) => isFutureHawlDueCandidate(item.meta, todayIsoDate))
    .map((item) => item.meta?.hawlDueDate)
    .filter((date): date is string => typeof date === "string");

  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => a.localeCompare(b))[0];
}

export function resolveDetailedReminderDisplayState(
  payload: DetailedHistoryPayload,
  todayIsoDate: string = getTodayIsoDateLocal(),
): DetailedReminderDisplayState {
  const reminder = getPrimaryScheduledReminder(payload);
  if (reminder) {
    if (reminder.status === "scheduled" && reminder.enabled) {
      return { state: "scheduled", reminderDate: reminder.reminderDate };
    }
    if (reminder.status === "disabled_by_preference" || !reminder.enabled) {
      return { state: "disabled", reminderDate: reminder.reminderDate };
    }
    return { state: "not_scheduled", reminderDate: reminder.reminderDate };
  }

  const earliestFutureDueDate = getEarliestFutureHawlDueDateFromHistoryLineItems(
    payload.lineItems,
    todayIsoDate,
  );
  if (earliestFutureDueDate) {
    return { state: "not_scheduled", reminderDate: earliestFutureDueDate };
  }
  return { state: "none" };
}

function isFutureHawlDueCandidate(
  meta: LineItemMeta | undefined,
  todayIsoDate: string,
): meta is LineItemMeta & { hawlDueDate: string } {
  if (!meta || meta.obligationMode !== "hawl_required") return false;
  if (!isValidIsoDate(meta.hawlDueDate)) return false;
  if (resolveEligibilityDueStatus(meta) !== "not_due_yet") return false;
  return meta.hawlDueDate > todayIsoDate;
}

export function getTodayIsoDateLocal(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

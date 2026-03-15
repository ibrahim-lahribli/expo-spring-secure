import { CATEGORY_RULES, type ObligationMode, type ZakatCategory } from "./category-rules";
import { isValidIsoDate } from "./detailedCalculationContext";

const LUNAR_YEAR_DAYS = 354;

export type LineItemMeta = {
  obligationMode: ObligationMode;
  hawlStartDate?: string;
  hawlDueDate?: string;
  hawlCompleted?: boolean;
  eventDate?: string;
  dueNow: boolean;
  debtAdjustable: boolean;
};

export type EligibilityDueStatus = "due_now" | "not_due_yet" | "unknown";

export type EvaluateEligibilityInput = {
  category: ZakatCategory;
  calculationDate: string;
  hawlStartDate?: string;
  eventDate?: string;
};

export function getHawlDueDate(startDate: string): string {
  if (!isValidIsoDate(startDate)) return startDate;
  const parsed = parseIsoDateAsUtc(startDate);
  parsed.setUTCDate(parsed.getUTCDate() + LUNAR_YEAR_DAYS);
  return toIsoDateUtc(parsed);
}

export function isHawlComplete(startDate: string, calculationDate: string): boolean {
  if (!isValidIsoDate(startDate) || !isValidIsoDate(calculationDate)) {
    return false;
  }
  const dueDate = getHawlDueDate(startDate);
  if (!isValidIsoDate(dueDate)) {
    return false;
  }
  return calculationDate >= dueDate;
}

export function isEventDue(eventDate: string, calculationDate: string): boolean {
  if (!isValidIsoDate(eventDate) || !isValidIsoDate(calculationDate)) {
    return false;
  }
  return eventDate <= calculationDate;
}

export function evaluateEligibility(input: EvaluateEligibilityInput): LineItemMeta {
  const rule = CATEGORY_RULES[input.category];
  if (rule.obligationMode === "adjustment") {
    return {
      obligationMode: rule.obligationMode,
      dueNow: true,
      debtAdjustable: rule.debtAdjustable,
    };
  }

  if (rule.obligationMode === "event_based") {
    const normalizedEventDate = isValidIsoDate(input.eventDate) ? input.eventDate : undefined;
    return {
      obligationMode: rule.obligationMode,
      eventDate: normalizedEventDate,
      dueNow: normalizedEventDate
        ? isEventDue(normalizedEventDate, input.calculationDate)
        : false,
      debtAdjustable: rule.debtAdjustable,
    };
  }

  const normalizedHawlStartDate = isValidIsoDate(input.hawlStartDate)
    ? input.hawlStartDate
    : undefined;
  if (!normalizedHawlStartDate) {
    return {
      obligationMode: rule.obligationMode,
      dueNow: false,
      debtAdjustable: rule.debtAdjustable,
    };
  }

  const hawlDueDate = getHawlDueDate(normalizedHawlStartDate);
  const hawlCompleted =
    isValidIsoDate(hawlDueDate) && isHawlComplete(normalizedHawlStartDate, input.calculationDate);

  return {
    obligationMode: rule.obligationMode,
    hawlStartDate: normalizedHawlStartDate,
    hawlDueDate: isValidIsoDate(hawlDueDate) ? hawlDueDate : undefined,
    hawlCompleted,
    dueNow: Boolean(hawlCompleted),
    debtAdjustable: rule.debtAdjustable,
  };
}

export function resolveEligibilityDueStatus(meta: Pick<
  LineItemMeta,
  "obligationMode" | "dueNow" | "hawlStartDate" | "eventDate"
>): EligibilityDueStatus {
  if (meta.dueNow) return "due_now";
  if (meta.obligationMode === "hawl_required" && !isValidIsoDate(meta.hawlStartDate)) {
    return "unknown";
  }
  if (meta.obligationMode === "event_based" && !isValidIsoDate(meta.eventDate)) {
    return "unknown";
  }
  return "not_due_yet";
}

function parseIsoDateAsUtc(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toIsoDateUtc(value: Date): string {
  return value.toISOString().slice(0, 10);
}

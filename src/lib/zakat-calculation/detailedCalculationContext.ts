export type DetailedCalculationContext = {
  calculationDate: string;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function formatDateAsIso(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isValidIsoDate(value?: string): value is string {
  if (!value || !ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return false;
  }
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

export function resolveCalculationDate(params: {
  routeCalculationDate?: string;
  draftCalculationDate?: string;
  draftReferenceDate?: string;
  now?: Date;
}): string {
  if (isValidIsoDate(params.routeCalculationDate)) {
    return params.routeCalculationDate;
  }
  if (isValidIsoDate(params.draftCalculationDate)) {
    return params.draftCalculationDate;
  }
  if (isValidIsoDate(params.draftReferenceDate)) {
    return params.draftReferenceDate;
  }
  return formatDateAsIso(params.now ?? new Date());
}

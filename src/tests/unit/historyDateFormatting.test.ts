import {
  formatHistoryDateTime,
  formatHistoryIsoDate,
} from "../../features/history/dateFormatting";

describe("history date formatting", () => {
  it("formats ISO dates using locale-specific month/day rendering", () => {
    const date = "2026-03-07";
    const expectedEn = new Intl.DateTimeFormat("en", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(2026, 2, 7));
    const expectedFr = new Intl.DateTimeFormat("fr", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(2026, 2, 7));
    const expectedAr = new Intl.DateTimeFormat("ar", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(2026, 2, 7));

    expect(formatHistoryIsoDate(date, "en")).toBe(expectedEn);
    expect(formatHistoryIsoDate(date, "fr")).toBe(expectedFr);
    expect(formatHistoryIsoDate(date, "ar")).toBe(expectedAr);
  });

  it("formats date-time strings using locale-specific date-time rendering", () => {
    const value = "2026-03-07T12:34:00.000Z";
    const expectedFr = new Intl.DateTimeFormat("fr", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));

    expect(formatHistoryDateTime(value, "fr")).toBe(expectedFr);
  });

  it("uses en-GB fallback when locale is omitted", () => {
    const value = "2026-03-07T12:34:00.000Z";
    const expected = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));

    expect(formatHistoryDateTime(value)).toBe(expected);
  });

  it("returns non-ISO values unchanged for ISO-only formatting", () => {
    expect(formatHistoryIsoDate("not-a-date", "fr")).toBe("not-a-date");
    expect(formatHistoryIsoDate("2026/03/07", "fr")).toBe("2026/03/07");
  });
});

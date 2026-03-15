import {
  formatDateAsIso,
  isValidIsoDate,
  resolveCalculationDate,
} from "../../lib/zakat-calculation/detailedCalculationContext";

describe("detailedCalculationContext", () => {
  it("resolves calculation date using deterministic precedence", () => {
    expect(
      resolveCalculationDate({
        routeCalculationDate: "2026-03-10",
        draftCalculationDate: "2026-03-09",
        draftReferenceDate: "2026-03-08",
      }),
    ).toBe("2026-03-10");

    expect(
      resolveCalculationDate({
        routeCalculationDate: "invalid",
        draftCalculationDate: "2026-03-09",
        draftReferenceDate: "2026-03-08",
      }),
    ).toBe("2026-03-09");

    expect(
      resolveCalculationDate({
        routeCalculationDate: "invalid",
        draftCalculationDate: "also-invalid",
        draftReferenceDate: "2026-03-08",
      }),
    ).toBe("2026-03-08");
  });

  it("falls back to today when no valid session dates are available", () => {
    expect(
      resolveCalculationDate({
        routeCalculationDate: undefined,
        draftCalculationDate: undefined,
        draftReferenceDate: undefined,
        now: new Date(2026, 2, 14),
      }),
    ).toBe("2026-03-14");
  });

  it("validates and formats ISO calendar dates", () => {
    expect(isValidIsoDate("2026-03-14")).toBe(true);
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("03-14-2026")).toBe(false);
    expect(formatDateAsIso(new Date(2026, 2, 5))).toBe("2026-03-05");
  });
});

import {
  evaluateEligibility,
  getHawlDueDate,
  isEventDue,
  isHawlComplete,
} from "../../lib/zakat-calculation/hawl";

describe("hawl helpers", () => {
  it("computes hawl due date using a 354-day lunar year offset", () => {
    expect(getHawlDueDate("2026-01-01")).toBe("2026-12-21");
  });

  it("evaluates hawl completion boundaries", () => {
    expect(isHawlComplete("2026-01-01", "2026-12-20")).toBe(false);
    expect(isHawlComplete("2026-01-01", "2026-12-21")).toBe(true);
    expect(isHawlComplete("invalid", "2026-12-21")).toBe(false);
  });

  it("evaluates event due checks against calculation date", () => {
    expect(isEventDue("2026-03-09", "2026-03-09")).toBe(true);
    expect(isEventDue("2026-03-10", "2026-03-09")).toBe(false);
    expect(isEventDue("invalid", "2026-03-09")).toBe(false);
  });

  it("returns hawl-required metadata and computes due-now from hawl completion when date exists", () => {
    expect(
      evaluateEligibility({
        category: "salary",
        hawlStartDate: "2026-01-01",
        calculationDate: "2026-12-21",
      }),
    ).toEqual({
      obligationMode: "hawl_required",
      hawlStartDate: "2026-01-01",
      hawlDueDate: "2026-12-21",
      hawlCompleted: true,
      dueNow: true,
      debtAdjustable: true,
    });

    expect(
      evaluateEligibility({
        category: "salary",
        hawlStartDate: "2026-01-01",
        calculationDate: "2026-12-20",
      }),
    ).toEqual({
      obligationMode: "hawl_required",
      hawlStartDate: "2026-01-01",
      hawlDueDate: "2026-12-21",
      hawlCompleted: false,
      dueNow: false,
      debtAdjustable: true,
    });

    expect(
      evaluateEligibility({
        category: "salary",
        calculationDate: "2026-02-01",
      }),
    ).toEqual({
      obligationMode: "hawl_required",
      dueNow: false,
      debtAdjustable: true,
    });
  });

  it("returns event-based metadata and marks missing event date as not due", () => {
    expect(
      evaluateEligibility({
        category: "produce",
        calculationDate: "2026-03-10",
      }),
    ).toEqual({
      obligationMode: "event_based",
      eventDate: undefined,
      dueNow: false,
      debtAdjustable: false,
    });

    expect(
      evaluateEligibility({
        category: "produce",
        eventDate: "2026-04-01",
        calculationDate: "2026-03-10",
      }),
    ).toEqual({
      obligationMode: "event_based",
      eventDate: "2026-04-01",
      dueNow: false,
      debtAdjustable: false,
    });
  });

  it("returns adjustment-mode metadata", () => {
    expect(
      evaluateEligibility({
        category: "debt",
        calculationDate: "2026-03-10",
      }),
    ).toEqual({
      obligationMode: "adjustment",
      dueNow: true,
      debtAdjustable: false,
    });
  });
});

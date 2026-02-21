import { calculateSalaryZakat } from "../../lib/zakat-calculation/salary";

describe("calculateSalaryZakat", () => {
  it("calculates salary zakat using default silver nisab and default living expense", () => {
    const result = calculateSalaryZakat({
      salary: {
        monthlyIncome: 10000,
      },
    });

    expect(result.nisab).toBe(7140);
    expect(result.totalWealth).toBe(80808);
    expect(result.totalZakat).toBeCloseTo(2020.2);
    expect(result.hasZakatDue).toBe(true);
  });

  it("returns zero zakat when net yearly wealth is below nisab", () => {
    const result = calculateSalaryZakat({
      salary: {
        monthlyIncome: 3500,
      },
    });

    expect(result.totalWealth).toBe(2808);
    expect(result.totalZakat).toBe(0);
    expect(result.hasZakatDue).toBe(false);
  });

  it("supports custom living expense and gold nisab method", () => {
    const result = calculateSalaryZakat({
      nisabMethod: "gold",
      goldPricePerGram: 700,
      salary: {
        monthlyIncome: 12000,
        livingExpense: 4000,
      },
    });

    expect(result.nisab).toBe(59500);
    expect(result.totalWealth).toBe(96000);
    expect(result.totalZakat).toBe(2400);
    expect(result.hasZakatDue).toBe(true);
  });

  it("supports monthly mode and only charges when monthly net reaches nisab", () => {
    const belowMonthlyNisab = calculateSalaryZakat({
      salary: {
        monthlyIncome: 10000,
        calculationMode: "monthly",
      },
    });

    expect(belowMonthlyNisab.nisab).toBe(7140);
    expect(belowMonthlyNisab.totalWealth).toBe(6734);
    expect(belowMonthlyNisab.totalZakat).toBe(0);
    expect(belowMonthlyNisab.hasZakatDue).toBe(false);

    const aboveMonthlyNisab = calculateSalaryZakat({
      salary: {
        monthlyIncome: 11000,
        calculationMode: "monthly",
      },
    });

    expect(aboveMonthlyNisab.totalWealth).toBe(7734);
    expect(aboveMonthlyNisab.totalZakat).toBeCloseTo(193.35);
    expect(aboveMonthlyNisab.hasZakatDue).toBe(true);
  });

  it("sanitizes negative and invalid numbers", () => {
    const result = calculateSalaryZakat({
      silverPricePerGram: Number.NaN,
      salary: {
        monthlyIncome: -2000,
        livingExpense: -100,
      },
    });

    expect(result.nisab).toBe(7140);
    expect(result.totalWealth).toBe(0);
    expect(result.totalZakat).toBe(0);
    expect(result.hasZakatDue).toBe(false);
  });
});

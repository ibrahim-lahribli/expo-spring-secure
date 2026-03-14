import {
  applyDebtAdjustment,
  calculateDebtAdjustment,
  calculateDebtZakat,
} from "../../lib/zakat-calculation/debt";

describe("debt calculation", () => {
  it("computes positive net adjustment from collectible and due debt", () => {
    const result = calculateDebtAdjustment({
      debt: {
        collectibleReceivablesCurrent: 9000,
        doubtfulReceivables: 4000,
        debtsYouOweDueNow: 2000,
      },
    });

    expect(result.collectibleReceivablesCurrent).toBe(9000);
    expect(result.doubtfulReceivables).toBe(4000);
    expect(result.debtsYouOweDueNow).toBe(2000);
    expect(result.netAdjustment).toBe(7000);
  });

  it("computes negative net adjustment when debts owed exceed collectible", () => {
    const result = calculateDebtAdjustment({
      debt: {
        collectibleReceivablesCurrent: 3000,
        doubtfulReceivables: 1000,
        debtsYouOweDueNow: 7000,
      },
    });
    expect(result.netAdjustment).toBe(-4000);
  });

  it("clamps adjusted base to zero", () => {
    expect(applyDebtAdjustment(5000, -7000)).toBe(0);
    expect(applyDebtAdjustment(5000, 1000)).toBe(6000);
  });

  it("sanitizes invalid and negative values to zero", () => {
    const result = calculateDebtAdjustment({
      debt: {
        collectibleReceivablesCurrent: -1,
        doubtfulReceivables: Number.NaN,
        debtsYouOweDueNow: -5,
      },
    });
    expect(result.collectibleReceivablesCurrent).toBe(0);
    expect(result.doubtfulReceivables).toBe(0);
    expect(result.debtsYouOweDueNow).toBe(0);
    expect(result.netAdjustment).toBe(0);
  });

  it("returns debt result as adjustment-only in v1", () => {
    const result = calculateDebtZakat({
      debt: {
        collectibleReceivablesCurrent: 5000,
        doubtfulReceivables: 9000,
        debtsYouOweDueNow: 1000,
      },
    });

    expect(result.totalWealth).toBe(4000);
    expect(result.totalZakat).toBe(0);
    expect(result.hasZakatDue).toBe(false);
    expect(result.breakdown.debt?.netWealth).toBe(4000);
  });
});


import { buildTotalDisplay } from "../../features/history/totalDisplay";

function normalizeSpaces(value: string) {
  return value.replace(/\u00a0/g, " ");
}

describe("buildTotalDisplay", () => {
  it("returns cash only when there is no non-cash due", () => {
    const result = buildTotalDisplay({
      cashTotal: 1200,
      currency: "MAD",
      nonCashDue: null,
    });

    expect(normalizeSpaces(result.primaryDisplay)).toBe("MAD 1,200.00");
    expect(result.suffixDisplay).toBeUndefined();
    expect(result.hasNonCash).toBe(false);
  });

  it("returns cash with livestock suffix", () => {
    const result = buildTotalDisplay({
      cashTotal: 1200,
      currency: "MAD",
      nonCashDue: {
        livestock: ["Camels: 1 bint makhad"],
        produceKg: 0,
      },
    });

    expect(normalizeSpaces(result.primaryDisplay)).toBe("MAD 1,200.00");
    expect(result.suffixDisplay).toBe("Camels: 1 bint makhad");
    expect(result.hasNonCash).toBe(true);
  });

  it("returns cash with produce suffix", () => {
    const result = buildTotalDisplay({
      cashTotal: 1200,
      currency: "MAD",
      nonCashDue: {
        livestock: [],
        produceKg: 300,
      },
    });

    expect(normalizeSpaces(result.primaryDisplay)).toBe("MAD 1,200.00");
    expect(result.suffixDisplay).toBe("300.00 kg");
    expect(result.hasNonCash).toBe(true);
  });

  it("returns cash with combined livestock and produce suffix", () => {
    const result = buildTotalDisplay({
      cashTotal: 1200,
      currency: "MAD",
      nonCashDue: {
        livestock: ["Camels: 1 bint makhad"],
        produceKg: 300,
      },
    });

    expect(normalizeSpaces(result.primaryDisplay)).toBe("MAD 1,200.00");
    expect(result.suffixDisplay).toBe("Camels: 1 bint makhad | 300.00 kg");
    expect(result.hasNonCash).toBe(true);
  });

  it("keeps MAD 0.00 and adds non-cash as suffix when cash total is zero", () => {
    const result = buildTotalDisplay({
      cashTotal: 0,
      currency: "MAD",
      nonCashDue: {
        livestock: ["Camels: 1 bint makhad"],
        produceKg: 300,
      },
    });

    expect(normalizeSpaces(result.primaryDisplay)).toBe("MAD 0.00");
    expect(result.suffixDisplay).toBe("Camels: 1 bint makhad | 300.00 kg");
    expect(result.hasNonCash).toBe(true);
  });

  it("returns MAD 0.00 when there is no due at all", () => {
    const result = buildTotalDisplay({
      cashTotal: 0,
      currency: "MAD",
      nonCashDue: {
        livestock: [],
        produceKg: 0,
      },
    });

    expect(normalizeSpaces(result.primaryDisplay)).toBe("MAD 0.00");
    expect(result.suffixDisplay).toBeUndefined();
    expect(result.hasNonCash).toBe(false);
  });
});

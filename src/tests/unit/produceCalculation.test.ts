import { calculateProduceZakat } from "../../lib/zakat-calculation/produce";

describe("calculateProduceZakat", () => {
  it("applies 10% when naturally watered and above crop nisab", () => {
    const result = calculateProduceZakat({
      produce: {
        isForTrade: false,
        quantityKg: 700,
        wateringMethod: "natural",
      },
    });

    expect(result.nisab).toBe(653);
    expect(result.totalWealth).toBe(700);
    expect(result.totalZakat).toBe(70);
    expect(result.hasZakatDue).toBe(true);
  });

  it("applies 5% when irrigation is paid and above crop nisab", () => {
    const result = calculateProduceZakat({
      produce: {
        isForTrade: false,
        quantityKg: 700,
        wateringMethod: "paid_irrigation",
      },
    });

    expect(result.totalZakat).toBe(35);
    expect(result.hasZakatDue).toBe(true);
  });

  it("returns zero for crops below crop nisab", () => {
    const result = calculateProduceZakat({
      produce: {
        isForTrade: false,
        quantityKg: 650,
        wateringMethod: "natural",
      },
    });

    expect(result.nisab).toBe(653);
    expect(result.totalZakat).toBe(0);
    expect(result.hasZakatDue).toBe(false);
  });

  it("treats traded produce as trade goods and uses 2.5%", () => {
    const result = calculateProduceZakat({
      silverPricePerGram: 12,
      produce: {
        isForTrade: true,
        marketValue: 10000,
      },
    });

    expect(result.nisab).toBe(7140);
    expect(result.totalWealth).toBe(10000);
    expect(result.totalZakat).toBe(250);
    expect(result.hasZakatDue).toBe(true);
  });

  it("returns zero for traded produce below monetary nisab", () => {
    const result = calculateProduceZakat({
      silverPricePerGram: 12,
      produce: {
        isForTrade: true,
        marketValue: 5000,
      },
    });

    expect(result.nisab).toBe(7140);
    expect(result.totalZakat).toBe(0);
    expect(result.hasZakatDue).toBe(false);
  });
});


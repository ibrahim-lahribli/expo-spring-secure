import {
  calcCashEquivalent,
  calcLivestockZakat,
  type DueItem,
  type LivestockType,
} from "../../lib/zakat-calculation/livestock";

function toCountMap(items: DueItem[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key =
      item.kind === "sheep"
        ? "sheep"
        : item.kind === "camel_class"
          ? `camel_${item.class}`
          : `cattle_${item.class}`;
    acc[key] = (acc[key] ?? 0) + item.count;
    return acc;
  }, {});
}

describe("calcLivestockZakat - camel edge cases", () => {
  const run = (owned: number, choice?: "2_hiqqah" | "3_bint_labun") =>
    calcLivestockZakat("camels", owned, { camel121Choice: choice });

  it("handles camel thresholds including choice and 40/50 decomposition", () => {
    expect(run(4).isDue).toBe(false);
    expect(toCountMap(run(5).dueItems)).toEqual({ sheep: 1 });
    expect(toCountMap(run(24).dueItems)).toEqual({ sheep: 4 });
    expect(toCountMap(run(25).dueItems)).toEqual({ camel_bint_makhad: 1 });
    expect(toCountMap(run(120).dueItems)).toEqual({ camel_hiqqah: 2 });
    expect(toCountMap(run(121, "2_hiqqah").dueItems)).toEqual({ camel_hiqqah: 2 });
    expect(toCountMap(run(129, "3_bint_labun").dueItems)).toEqual({
      camel_bint_labun: 3,
    });
    expect(toCountMap(run(130).dueItems)).toEqual({
      camel_bint_labun: 2,
      camel_hiqqah: 1,
    });
    expect(toCountMap(run(150).dueItems)).toEqual({ camel_hiqqah: 3 });
    expect(toCountMap(run(200).dueItems)).toEqual({ camel_hiqqah: 4 });
  });
});

describe("calcLivestockZakat - cattle edge cases", () => {
  const run = (owned: number) => calcLivestockZakat("cattle", owned);

  it("handles cattle thresholds and 30/40 decomposition", () => {
    expect(run(29).isDue).toBe(false);
    expect(toCountMap(run(30).dueItems)).toEqual({ cattle_tabi: 1 });
    expect(toCountMap(run(39).dueItems)).toEqual({ cattle_tabi: 1 });
    expect(toCountMap(run(40).dueItems)).toEqual({ cattle_musinnah: 1 });
    expect(toCountMap(run(59).dueItems)).toEqual({ cattle_musinnah: 1 });
    expect(toCountMap(run(60).dueItems)).toEqual({ cattle_tabi: 2 });
    expect(toCountMap(run(70).dueItems)).toEqual({
      cattle_tabi: 1,
      cattle_musinnah: 1,
    });
    expect(toCountMap(run(80).dueItems)).toEqual({ cattle_musinnah: 2 });
    expect(toCountMap(run(120).dueItems)).toEqual({ cattle_musinnah: 3 });
  });
});

describe("calcLivestockZakat - sheep/goats edge cases", () => {
  const run = (owned: number) => calcLivestockZakat("sheep_goats", owned);

  it("handles sheep/goat thresholds and 400+ rule", () => {
    expect(run(39).isDue).toBe(false);
    expect(toCountMap(run(40).dueItems)).toEqual({ sheep: 1 });
    expect(toCountMap(run(120).dueItems)).toEqual({ sheep: 1 });
    expect(toCountMap(run(121).dueItems)).toEqual({ sheep: 2 });
    expect(toCountMap(run(200).dueItems)).toEqual({ sheep: 2 });
    expect(toCountMap(run(201).dueItems)).toEqual({ sheep: 3 });
    expect(toCountMap(run(399).dueItems)).toEqual({ sheep: 3 });
    expect(toCountMap(run(400).dueItems)).toEqual({ sheep: 4 });
    expect(toCountMap(run(999).dueItems)).toEqual({ sheep: 9 });
  });
});

describe("calcCashEquivalent", () => {
  it("calculates when all prices are present and valid", () => {
    const due = calcLivestockZakat("camels", 130).dueItems;
    const total = calcCashEquivalent(due, {
      camel_bint_labun: 1000,
      camel_hiqqah: 1500,
    });

    expect(total).toBe(3500);
  });

  it("returns undefined when any required due-item price is missing", () => {
    const due = calcLivestockZakat("cattle", 70).dueItems;
    const total = calcCashEquivalent(due, {
      cattle_tabi: 1200,
    });

    expect(total).toBeUndefined();
  });
});

describe("calcLivestockZakat - input sanitization", () => {
  it("sanitizes invalid or negative owned counts", () => {
    const cases: Array<{ type: LivestockType; owned: number }> = [
      { type: "camels", owned: Number.NaN },
      { type: "cattle", owned: -10 },
      { type: "sheep_goats", owned: Number.POSITIVE_INFINITY },
    ];

    for (const c of cases) {
      const result = calcLivestockZakat(c.type, c.owned);
      expect(result.isDue).toBe(false);
      expect(result.dueItems).toEqual([]);
    }
  });
});

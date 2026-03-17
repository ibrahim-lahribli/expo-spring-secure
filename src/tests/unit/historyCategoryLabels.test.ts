import {
  normalizeHistoryCategoryId,
  resolveHistoryCategoryLabel,
} from "../../features/history/categoryLabels";

describe("resolveHistoryCategoryLabel", () => {
  it("resolves known category ids through translation keys and falls back for legacy labels", () => {
    const t = (key: string) => `tr:${key}`;

    expect(resolveHistoryCategoryLabel("salary", t)).toBe("tr:detailedCalculator.categories.salary.title");
    expect(resolveHistoryCategoryLabel("cash", t)).toBe("tr:history.quickCategories.cash");
    expect(resolveHistoryCategoryLabel("quick_debt", t)).toBe("tr:history.quickCategories.debt");
    expect(resolveHistoryCategoryLabel("legacy English Label", t)).toBe("legacy English Label");
    expect(resolveHistoryCategoryLabel("unknown_id", t, "Fallback Label")).toBe("Fallback Label");
  });
});

describe("normalizeHistoryCategoryId", () => {
  it("maps legacy localized labels to canonical category ids", () => {
    expect(normalizeHistoryCategoryId("Salaires et Services")).toBe("salary");
    expect(normalizeHistoryCategoryId("الأجور والخدمات")).toBe("salary");
    expect(normalizeHistoryCategoryId("Cereales et Fruits")).toBe("produce");
    expect(normalizeHistoryCategoryId("Commerce et Affaires")).toBe("trade_sector");
  });
});

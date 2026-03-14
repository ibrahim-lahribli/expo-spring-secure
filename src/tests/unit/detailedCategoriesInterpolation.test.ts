import arCommon from "../../i18n/locales/ar/common.json";
import enCommon from "../../i18n/locales/en/common.json";
import frCommon from "../../i18n/locales/fr/common.json";

describe("detailedCalculator.hero.categoriesAdded interpolation", () => {
  it("renders numeric count in en/ar/fr", async () => {
    const interpolate = (template: string, count: number) =>
      template.replace(/\{(\w+)\}/g, (_, token) => (token === "count" ? String(count) : `{${token}}`));

    expect(interpolate(enCommon.detailedCalculator.hero.categoriesAdded, 3)).toContain("3");
    expect(interpolate(arCommon.detailedCalculator.hero.categoriesAdded, 4)).toContain("4");
    expect(interpolate(frCommon.detailedCalculator.hero.categoriesAdded, 5)).toContain("5");
  });
});

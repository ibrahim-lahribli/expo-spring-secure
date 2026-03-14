const CATEGORY_LABEL_KEYS: Record<string, string> = {
  cash: "history.quickCategories.cash",
  gold: "history.quickCategories.gold",
  quick_debt: "history.quickCategories.debt",
  debt: "detailedCalculator.categories.debt.title",
  salary: "detailedCalculator.categories.salary.title",
  livestock: "detailedCalculator.categories.livestock.title",
  produce: "detailedCalculator.categories.produce.title",
  agri_other: "detailedCalculator.categories.agri_other.title",
  trade_sector: "detailedCalculator.categories.trade_sector.title",
  industrial_sector: "detailedCalculator.categories.industrial_sector.title",
};

export function resolveHistoryCategoryLabel(
  categoryIdOrLabel: string,
  translate: (key: string) => string,
  fallbackLabel?: string,
): string {
  const translationKey = CATEGORY_LABEL_KEYS[categoryIdOrLabel];
  if (!translationKey) {
    return fallbackLabel ?? categoryIdOrLabel;
  }
  return translate(translationKey);
}

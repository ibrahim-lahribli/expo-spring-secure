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

function normalizeLabelToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

const LEGACY_CATEGORY_ALIAS_ENTRIES: Array<[string, string]> = [
  ["cash & bank", "cash"],
  ["cash & bank balance", "cash"],
  ["cash", "cash"],
  ["gold & silver", "gold"],
  ["gold", "gold"],
  ["debts owed", "quick_debt"],
  ["debt", "debt"],
  ["debts", "debt"],
  ["salary", "salary"],
  ["salaries & services", "salary"],
  ["salaires et services", "salary"],
  ["\u0627\u0644\u0623\u062c\u0648\u0631 \u0648\u0627\u0644\u062e\u062f\u0645\u0627\u062a", "salary"],
  ["livestock", "livestock"],
  ["betail", "livestock"],
  ["\u0627\u0644\u0623\u0646\u0639\u0627\u0645", "livestock"],
  ["produce", "produce"],
  ["grains & fruits", "produce"],
  ["cereales et fruits", "produce"],
  ["\u0627\u0644\u062d\u0628\u0648\u0628 \u0648\u0627\u0644\u062b\u0645\u0627\u0631", "produce"],
  ["agri other", "agri_other"],
  ["other agricultural products", "agri_other"],
  ["autres produits agricoles", "agri_other"],
  ["\u0645\u0646\u062a\u062c\u0627\u062a \u0632\u0631\u0627\u0639\u064a\u0629 \u0623\u062e\u0631\u0649", "agri_other"],
  ["trade sector", "trade_sector"],
  ["trade & business", "trade_sector"],
  ["commerce et affaires", "trade_sector"],
  ["\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0648\u0627\u0644\u0623\u0639\u0645\u0627\u0644", "trade_sector"],
  ["industrial sector", "industrial_sector"],
  ["secteur industriel", "industrial_sector"],
  ["\u0627\u0644\u0642\u0637\u0627\u0639 \u0627\u0644\u0635\u0646\u0627\u0639\u064a", "industrial_sector"],
  ["quick debt", "quick_debt"],
  ["dettes a court terme", "quick_debt"],
  ["\u0627\u0644\u062f\u064a\u0648\u0646 \u0642\u0635\u064a\u0631\u0629 \u0627\u0644\u0623\u062c\u0644", "quick_debt"],
  ["\u0627\u0644\u062f\u064a\u0648\u0646", "debt"],
  ["dettes", "debt"],
];

const LEGACY_CATEGORY_ALIASES: Record<string, string> = Object.fromEntries(
  LEGACY_CATEGORY_ALIAS_ENTRIES.map(([label, categoryId]) => [
    normalizeLabelToken(label),
    categoryId,
  ]),
);

export function normalizeHistoryCategoryId(categoryIdOrLabel: string): string {
  if (CATEGORY_LABEL_KEYS[categoryIdOrLabel]) {
    return categoryIdOrLabel;
  }
  const normalized = normalizeLabelToken(categoryIdOrLabel);
  return LEGACY_CATEGORY_ALIASES[normalized] ?? categoryIdOrLabel;
}

export function resolveHistoryCategoryLabel(
  categoryIdOrLabel: string,
  translate: (key: string) => string,
  fallbackLabel?: string,
): string {
  const canonicalCategoryId = normalizeHistoryCategoryId(categoryIdOrLabel);
  const translationKey = CATEGORY_LABEL_KEYS[canonicalCategoryId];
  if (!translationKey) {
    return fallbackLabel ?? canonicalCategoryId;
  }
  return translate(translationKey);
}

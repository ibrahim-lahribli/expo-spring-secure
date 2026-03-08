import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { appColors, appRadius, appSpacing } from "../../../theme/designSystem";
import { upsertGuestHistoryEntry } from "../../../features/history/storage";
import type { DetailedHistoryLineItem, HistoryEntry } from "../../../features/history/types";
import { buildTotalDisplay, type NonCashDueSummary } from "../../../features/history/totalDisplay";
import {
  calcLivestockZakat,
  calculateProduceZakat,
  calculateSalaryZakat,
  formatDueItems,
  getDueItemLabelKey,
  type Camel121Choice,
  type DueItem,
  type LivestockType,
  type ProduceWateringMethod,
  type ZakatCalculationResult,
} from "../../../lib/zakat-calculation";
import { formatMoney } from "../../../lib/currency";
import { calculateNisab } from "../../../lib/zakat-calculation/nisab";
import { useAppPreferencesStore, type SupportedCurrency } from "../../../store/appPreferencesStore";
import { useNisabSettingsStore } from "../../../store/nisabSettingsStore";

type CategoryId = "salary" | "livestock" | "produce" | "agri_other" | "trade_sector" | "industrial_sector" | "debt";
type StepId = "pick" | "form";
type SalaryCalculationMode = "annual" | "monthly";
type SalaryValues = { monthlyIncome: string; livingExpense: string; calculationMode: SalaryCalculationMode };
type AgriOtherValues = { marketValue: string; operatingCosts: string };
type TradeSectorValues = { marketValue: string; operatingCosts: string };
type IndustrialSectorValues = { marketValue: string; operatingCosts: string };
type ProduceValues = {
  isForTrade: boolean;
  quantityKg: string;
  marketValue: string;
  pricePerKg: string;
  wateringMethod: ProduceWateringMethod;
};
type LivestockValues = {
  livestockType: LivestockType;
  ownedCount: number;
  camel121Choice: Camel121Choice;
  cashEstimate?: number;
};
type SalaryLineItem = { id: string; category: "salary"; values: SalaryValues; result: ZakatCalculationResult };
type AgriOtherLineItem = {
  id: string;
  category: "agri_other";
  values: AgriOtherValues;
  result: ZakatCalculationResult;
};
type TradeSectorLineItem = {
  id: string;
  category: "trade_sector";
  values: TradeSectorValues;
  result: ZakatCalculationResult;
};
type IndustrialSectorLineItem = {
  id: string;
  category: "industrial_sector";
  values: IndustrialSectorValues;
  result: ZakatCalculationResult;
};
type ProduceLineItem = {
  id: string;
  category: "produce";
  values: ProduceValues;
  result: ZakatCalculationResult;
  dueQuantityKg?: number;
  cashEquivalent?: number;
};
type LivestockLineItem = {
  id: string;
  category: "livestock";
  values: LivestockValues;
  result: ZakatCalculationResult;
  dueItems: DueItem[];
  dueText: string;
};
type LineItem =
  | SalaryLineItem
  | LivestockLineItem
  | ProduceLineItem
  | AgriOtherLineItem
  | TradeSectorLineItem
  | IndustrialSectorLineItem;

const CATEGORY_ORDER: CategoryId[] = [
  "salary",
  "livestock",
  "produce",
  "agri_other",
  "trade_sector",
  "industrial_sector",
  "debt",
];
const CATEGORY_ICONS: Record<CategoryId, string> = {
  salary: "💼",
  livestock: "🐄",
  produce: "🌾",
  agri_other: "🌿",
  trade_sector: "🏪",
  industrial_sector: "🏭",
  debt: "📋",
};
function buildLivestockSchema(t: (key: string) => string) {
  return z
    .object({
      livestockType: z.enum(["camels", "cattle", "sheep_goats"]),
      ownedCount: z
        .string()
        .trim()
        .refine((v) => /^\d+$/.test(v), t("detailedCalculator.validation.ownedCountInteger")),
      camel121Choice: z.enum(["2_hiqqah", "3_bint_labun"]),
      cashEstimate: z.string().default(""),
    })
    .superRefine((v, ctx) => {
      if (!v.cashEstimate.trim()) return;
      const estimate = Number(v.cashEstimate);
      if (!Number.isFinite(estimate) || estimate <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cashEstimate"],
          message: t("detailedCalculator.validation.cashEstimatePositive"),
        });
      }
    });
}
type LivestockForm = {
  livestockType: LivestockType;
  ownedCount: string;
  camel121Choice: Camel121Choice;
  cashEstimate?: string;
};

const defaultLivestockForm: LivestockForm = {
  livestockType: "camels",
  ownedCount: "",
  camel121Choice: "2_hiqqah",
  cashEstimate: "",
};
const defaultProduceValues: ProduceValues = {
  isForTrade: false,
  quantityKg: "",
  marketValue: "",
  pricePerKg: "",
  wateringMethod: "natural",
};
const defaultAgriOtherValues: AgriOtherValues = {
  marketValue: "",
  operatingCosts: "",
};
const defaultTradeSectorValues: TradeSectorValues = {
  marketValue: "",
  operatingCosts: "",
};
const defaultIndustrialSectorValues: IndustrialSectorValues = {
  marketValue: "",
  operatingCosts: "",
};

function formatDueItemsLocalized(
  items: DueItem[],
  t: (key: any, options?: any) => string,
): string {
  if (items.length === 0) {
    return t("detailedCalculator.livestock.noDue");
  }
  return formatDueItems(items, (item) => t(getDueItemLabelKey(item)));
}

function parseOptionalPositive(v: string): number | undefined {
  if (!v.trim()) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
function toNonNegative(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
function buildId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function calculateAgriOtherZakat(input: {
  nisabMethod: "silver" | "gold";
  silverPricePerGram: number;
  goldPricePerGram: number;
  nisabOverride?: number;
  marketValue: number;
  operatingCosts: number;
}): ZakatCalculationResult {
  const nisab = calculateNisab({
    nisabMethod: input.nisabMethod,
    silverPricePerGram: input.silverPricePerGram,
    goldPricePerGram: input.goldPricePerGram,
    nisabOverride: input.nisabOverride,
  });
  const netValue = Math.max(0, input.marketValue - input.operatingCosts);
  const totalZakat = netValue >= nisab ? netValue * 0.025 : 0;
  return {
    nisab,
    totalWealth: netValue,
    totalZakat,
    hasZakatDue: totalZakat > 0,
    breakdown: {},
  };
}

function calculateTradeSectorZakat(input: {
  nisabMethod: "silver" | "gold";
  silverPricePerGram: number;
  goldPricePerGram: number;
  nisabOverride?: number;
  marketValue: number;
  operatingCosts: number;
}): ZakatCalculationResult {
  const nisab = calculateNisab({
    nisabMethod: input.nisabMethod,
    silverPricePerGram: input.silverPricePerGram,
    goldPricePerGram: input.goldPricePerGram,
    nisabOverride: input.nisabOverride,
  });
  const netValue = Math.max(0, input.marketValue - input.operatingCosts);
  const totalZakat = netValue >= nisab ? netValue * 0.025 : 0;
  return {
    nisab,
    totalWealth: netValue,
    totalZakat,
    hasZakatDue: totalZakat > 0,
    breakdown: {},
  };
}

function buildDetailedHistoryLineItem(
  item: LineItem,
  currency: SupportedCurrency,
  labels: {
    categoryLabel: (category: CategoryId) => string;
    livestockTypeLabel: (type: LivestockType) => string;
    dueText: (items: DueItem[]) => string;
    modeMonthly: string;
    modeAnnual: string;
    detailMode: string;
    detailNisab: string;
    detailType: string;
    detailOwned: string;
    detailDue: string;
    detailCashEstimate: string;
    detailWatering: string;
    detailDueProduce: string;
    detailCashEquivalent: string;
    modeTrade: string;
    modeHarvest: string;
    wateringNatural: string;
    wateringPaidIrrigation: string;
    kgUnit: string;
  },
): DetailedHistoryLineItem {
  if (item.category === "salary") {
    return {
      id: item.id,
      category: item.category,
      label: labels.categoryLabel(item.category),
      totalZakat: item.result.totalZakat,
      totalWealth: item.result.totalWealth,
      details: [
        `${labels.detailMode}: ${item.values.calculationMode === "monthly" ? labels.modeMonthly : labels.modeAnnual}`,
        `${labels.detailNisab}: ${formatMoney(item.result.nisab, currency)}`,
      ],
    };
  }

  if (item.category === "livestock") {
    return {
      id: item.id,
      category: item.category,
      label: labels.categoryLabel(item.category),
      totalZakat: item.result.totalZakat,
      totalWealth: item.result.totalWealth,
      details: [
        `${labels.detailType}: ${labels.livestockTypeLabel(item.values.livestockType)}`,
        `${labels.detailOwned}: ${item.values.ownedCount}`,
        `${labels.detailDue}: ${labels.dueText(item.dueItems)}`,
        `${labels.detailCashEstimate}: ${formatMoney(item.values.cashEstimate ?? 0, currency)}`,
      ],
    };
  }

  if (item.category === "produce") {
    const details = [
      `${labels.detailMode}: ${item.values.isForTrade ? labels.modeTrade : labels.modeHarvest}`,
      `${labels.detailWatering}: ${
        item.values.wateringMethod === "natural"
          ? labels.wateringNatural
          : labels.wateringPaidIrrigation
      }`,
      !item.values.isForTrade
        ? `${labels.detailDueProduce}: ${(item.dueQuantityKg ?? 0).toFixed(2)} ${labels.kgUnit}`
        : null,
      !item.values.isForTrade
        ? `${labels.detailCashEquivalent}: ${formatMoney(item.cashEquivalent ?? 0, currency)}`
        : null,
    ].filter((line): line is string => Boolean(line));
    return {
      id: item.id,
      category: item.category,
      label: labels.categoryLabel(item.category),
      totalZakat: item.result.totalZakat,
      totalWealth: item.result.totalWealth,
      details,
    };
  }

  return {
    id: item.id,
    category: item.category,
    label: labels.categoryLabel(item.category),
    totalZakat: item.result.totalZakat,
    totalWealth: item.result.totalWealth,
    details: [`${labels.detailNisab}: ${formatMoney(item.result.nisab, currency)}`],
  };
}

export default function DetailedCalculateScreen() {
  const { t } = useTranslation("common");
  const currency = useAppPreferencesStore((s) => s.currency);
  const livestockSchema = useMemo(() => buildLivestockSchema(t), [t]);
  const [step, setStep] = useState<StepId>("pick");
  const [activeCategory, setActiveCategory] = useState<CategoryId>("salary");
  const [salaryValues, setSalaryValues] = useState<SalaryValues>({
    monthlyIncome: "",
    livingExpense: "",
    calculationMode: "annual",
  });
  const [agriOtherValues, setAgriOtherValues] = useState<AgriOtherValues>(defaultAgriOtherValues);
  const [tradeSectorValues, setTradeSectorValues] = useState<TradeSectorValues>(defaultTradeSectorValues);
  const [industrialSectorValues, setIndustrialSectorValues] = useState<IndustrialSectorValues>(
    defaultIndustrialSectorValues,
  );
  const [produceValues, setProduceValues] = useState<ProduceValues>(defaultProduceValues);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isHowCalculatedOpen, setIsHowCalculatedOpen] = useState(false);
  const [showHistorySavedToast, setShowHistorySavedToast] = useState(false);

  const categoryLabel = (category: CategoryId) => t(`detailedCalculator.categories.${category}.title`);
  const categoryDescription = (category: CategoryId) =>
    t(`detailedCalculator.categories.${category}.description`);
  const livestockTypeLabel = (type: LivestockType) => t(`detailedCalculator.livestock.types.${type}`);
  const dueText = (items: DueItem[]) => formatDueItemsLocalized(items, t);

  const nisabMethod = useNisabSettingsStore((s) => s.nisabMethod);
  const silverPricePerGram = useNisabSettingsStore((s) => s.silverPricePerGram);
  const goldPricePerGram = useNisabSettingsStore((s) => s.goldPricePerGram);
  const nisabOverride = useNisabSettingsStore((s) => s.nisabOverride);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LivestockForm>({
    resolver: zodResolver(livestockSchema),
    defaultValues: defaultLivestockForm,
  });

  const livestockType = useWatch({ control, name: "livestockType" }) ?? "camels";
  const livestockOwned = useWatch({ control, name: "ownedCount" }) ?? "";
  const camel121Choice = useWatch({ control, name: "camel121Choice" }) ?? "2_hiqqah";
  const watchedCashEstimate = useWatch({ control, name: "cashEstimate" }) ?? "";

  const livestockPreview = useMemo(() => {
    const due = calcLivestockZakat(livestockType, /^\d+$/.test(livestockOwned) ? Number(livestockOwned) : 0, {
      camel121Choice,
    });
    const cashEstimate = parseOptionalPositive(watchedCashEstimate);
    return { due, cashEstimate };
  }, [livestockType, livestockOwned, camel121Choice, watchedCashEstimate]);

  useEffect(() => {
    if (!showHistorySavedToast) return;
    const t = setTimeout(() => setShowHistorySavedToast(false), 1800);
    return () => clearTimeout(t);
  }, [showHistorySavedToast]);

  useEffect(() => {
    if (lineItems.length === 0) return;
    setLineItems((prev) =>
      prev.map((item) =>
        item.category === "salary"
          ? {
              ...item,
              result: calculateSalaryZakat({
                nisabMethod,
                silverPricePerGram,
                goldPricePerGram,
                nisabOverride: nisabOverride > 0 ? nisabOverride : undefined,
                salary: {
                  monthlyIncome: toNonNegative(item.values.monthlyIncome),
                  livingExpense: parseOptionalPositive(item.values.livingExpense),
                  calculationMode: item.values.calculationMode,
                },
              }),
            }
          : item.category === "produce"
            ? {
                ...item,
                ...(() => {
                  const produceResult = calculateProduceZakat({
                    nisabMethod,
                    silverPricePerGram,
                    goldPricePerGram,
                    nisabOverride: nisabOverride > 0 ? nisabOverride : undefined,
                    produce: {
                      isForTrade: item.values.isForTrade,
                      quantityKg: toNonNegative(item.values.quantityKg),
                      marketValue: toNonNegative(item.values.marketValue),
                      wateringMethod: item.values.wateringMethod,
                    },
                  });
                  if (item.values.isForTrade) {
                    return {
                      result: produceResult,
                      dueQuantityKg: undefined,
                      cashEquivalent: produceResult.totalZakat,
                    };
                  }
                  const dueKg = produceResult.totalZakat;
                  const pricePerKg = parseOptionalPositive(item.values.pricePerKg);
                  const cashEquivalent = pricePerKg ? dueKg * pricePerKg : undefined;
                  return {
                    result: {
                      ...produceResult,
                      totalZakat: cashEquivalent ?? 0,
                    },
                    dueQuantityKg: dueKg,
                    cashEquivalent,
                  };
                })(),
              }
            : item.category === "agri_other"
              ? {
                  ...item,
                  result: calculateAgriOtherZakat({
                    nisabMethod,
                    silverPricePerGram,
                    goldPricePerGram,
                    nisabOverride: nisabOverride > 0 ? nisabOverride : undefined,
                    marketValue: toNonNegative(item.values.marketValue),
                    operatingCosts: toNonNegative(item.values.operatingCosts),
                  }),
                }
              : item.category === "trade_sector"
                ? {
                    ...item,
                    result: calculateTradeSectorZakat({
                      nisabMethod,
                      silverPricePerGram,
                      goldPricePerGram,
                      nisabOverride: nisabOverride > 0 ? nisabOverride : undefined,
                      marketValue: toNonNegative(item.values.marketValue),
                      operatingCosts: toNonNegative(item.values.operatingCosts),
                    }),
                  }
                : item.category === "industrial_sector"
                  ? {
                      ...item,
                      result: calculateTradeSectorZakat({
                        nisabMethod,
                        silverPricePerGram,
                        goldPricePerGram,
                        nisabOverride: nisabOverride > 0 ? nisabOverride : undefined,
                        marketValue: toNonNegative(item.values.marketValue),
                        operatingCosts: toNonNegative(item.values.operatingCosts),
                      }),
                    }
            : item,
      ),
    );
  }, [nisabMethod, silverPricePerGram, goldPricePerGram, nisabOverride, lineItems.length]);

  const combinedTotal = useMemo(() => lineItems.reduce((sum, i) => sum + i.result.totalZakat, 0), [lineItems]);
  const addedCategoryCount = useMemo(() => new Set(lineItems.map((item) => item.category)).size, [lineItems]);
  const livestockInKindBreakdown = useMemo(
    () =>
      lineItems
        .filter((item): item is LivestockLineItem => item.category === "livestock")
        .filter((item) => item.dueItems.length > 0)
        .map((item) => `${livestockTypeLabel(item.values.livestockType)}: ${dueText(item.dueItems)}`),
    [lineItems, t],
  );
  const produceDueKgTotal = useMemo(
    () =>
      lineItems
        .filter((item): item is ProduceLineItem => item.category === "produce")
        .filter((item) => !item.values.isForTrade)
        .reduce((sum, item) => sum + (item.dueQuantityKg ?? 0), 0),
    [lineItems],
  );
  const nonCashDueSummary = useMemo<NonCashDueSummary>(
    () => ({
      livestock: livestockInKindBreakdown,
      produceKg: produceDueKgTotal,
    }),
    [livestockInKindBreakdown, produceDueKgTotal],
  );
  const totalDisplay = useMemo(
    () =>
      buildTotalDisplay({
        cashTotal: combinedTotal,
        currency,
        nonCashDue: nonCashDueSummary,
        labels: { kgUnit: t("history.kgUnit") },
      }),
    [combinedTotal, currency, nonCashDueSummary, t],
  );

  const livePreview = useMemo(() => {
    if (activeCategory === "salary") {
      const result = calculateSalaryZakat({
        nisabMethod,
        silverPricePerGram,
        goldPricePerGram,
        nisabOverride: nisabOverride > 0 ? nisabOverride : undefined,
        salary: {
          monthlyIncome: toNonNegative(salaryValues.monthlyIncome),
          livingExpense: parseOptionalPositive(salaryValues.livingExpense),
          calculationMode: salaryValues.calculationMode,
        },
      });
      return {
        netLabel: t("detailedCalculator.preview.netZakatableAmount"),
        netValue: formatMoney(result.totalWealth, currency),
        dueLabel: t("detailedCalculator.preview.zakatDue"),
        dueValue: formatMoney(result.totalZakat, currency),
      };
    }
    if (activeCategory === "livestock") {
      return {
        netLabel: t("detailedCalculator.preview.animalsDue"),
        netValue: dueText(livestockPreview.due.dueItems),
        dueLabel: t("detailedCalculator.preview.cashEquivalent"),
        dueValue:
          livestockPreview.cashEstimate !== undefined
            ? formatMoney(livestockPreview.cashEstimate, currency)
            : t("detailedCalculator.notSet"),
      };
    }
    if (activeCategory === "agri_other" || activeCategory === "trade_sector" || activeCategory === "industrial_sector") {
      const values =
        activeCategory === "agri_other"
          ? agriOtherValues
          : activeCategory === "trade_sector"
            ? tradeSectorValues
            : industrialSectorValues;
      const result = calculateTradeSectorZakat({
        nisabMethod,
        silverPricePerGram,
        goldPricePerGram,
        nisabOverride: nisabOverride > 0 ? nisabOverride : undefined,
        marketValue: toNonNegative(values.marketValue),
        operatingCosts: toNonNegative(values.operatingCosts),
      });
      return {
        netLabel: t("detailedCalculator.preview.netZakatableAmount"),
        netValue: formatMoney(result.totalWealth, currency),
        dueLabel: t("detailedCalculator.preview.zakatDue"),
        dueValue: formatMoney(result.totalZakat, currency),
      };
    }
    if (activeCategory === "produce") {
      const result = calculateProduceZakat({
        nisabMethod,
        silverPricePerGram,
        goldPricePerGram,
        nisabOverride: nisabOverride > 0 ? nisabOverride : undefined,
        produce: {
          isForTrade: produceValues.isForTrade,
          quantityKg: toNonNegative(produceValues.quantityKg),
          marketValue: toNonNegative(produceValues.marketValue),
          wateringMethod: produceValues.wateringMethod,
        },
      });
      if (produceValues.isForTrade) {
        return {
          netLabel: t("detailedCalculator.preview.netZakatableAmount"),
          netValue: formatMoney(result.totalWealth, currency),
          dueLabel: t("detailedCalculator.preview.zakatDue"),
          dueValue: formatMoney(result.totalZakat, currency),
        };
      }
      const dueKg = result.totalZakat;
      const pricePerKg = parseOptionalPositive(produceValues.pricePerKg);
      const cashEquivalent = pricePerKg ? dueKg * pricePerKg : undefined;
      if (cashEquivalent !== undefined) {
        return {
          netLabel: t("detailedCalculator.preview.harvestQuantity"),
          netValue: `${toNonNegative(produceValues.quantityKg).toFixed(2)} ${t("history.kgUnit")}`,
          dueLabel: t("detailedCalculator.preview.zakatDueCashEstimate"),
          dueValue: formatMoney(cashEquivalent, currency),
          extraLabel: t("detailedCalculator.preview.zakatDueProduce"),
          extraValue: `${dueKg.toFixed(2)} ${t("history.kgUnit")}`,
        };
      }
      return {
        netLabel: t("detailedCalculator.preview.harvestQuantity"),
        netValue: `${toNonNegative(produceValues.quantityKg).toFixed(2)} ${t("history.kgUnit")}`,
        dueLabel: t("detailedCalculator.preview.zakatDue"),
        dueValue: `${result.totalZakat.toFixed(2)} ${t("history.kgUnit")}`,
      };
    }
    return null;
  }, [
    activeCategory,
    agriOtherValues,
    currency,
    goldPricePerGram,
    industrialSectorValues,
    livestockPreview.cashEstimate,
    livestockPreview.due.dueItems,
    nisabMethod,
    nisabOverride,
    produceValues,
    salaryValues,
    silverPricePerGram,
    tradeSectorValues,
  ]);

  const openCategory = (category: CategoryId) => {
    setValidationError(null);
    setIsHowCalculatedOpen(false);
    setActiveCategory(category);
    if (category === "salary") {
      setSalaryValues({ monthlyIncome: "", livingExpense: "", calculationMode: "annual" });
    }
    if (category === "livestock") reset(defaultLivestockForm);
    if (category === "agri_other") setAgriOtherValues(defaultAgriOtherValues);
    if (category === "trade_sector") setTradeSectorValues(defaultTradeSectorValues);
    if (category === "industrial_sector") setIndustrialSectorValues(defaultIndustrialSectorValues);
    if (category === "produce") setProduceValues(defaultProduceValues);
    setStep("form");
  };

  const onSaveToHistory = async () => {
    if (lineItems.length === 0) {
      return;
    }

    const now = new Date().toISOString();
    const categoriesUsed = Array.from(new Set(lineItems.map((item) => categoryLabel(item.category))));
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      flowType: "detailed",
      createdAt: now,
      updatedAt: now,
      totalZakat: combinedTotal,
      currency,
      nisabSnapshot: {
        method: nisabMethod,
        silverPricePerGram,
        goldPricePerGram,
        override: nisabOverride > 0 ? nisabOverride : null,
      },
      summary: {
        categoriesUsed,
        itemCount: lineItems.length,
        nonCashDue: nonCashDueSummary,
      },
      payload: {
        kind: "detailed",
        lineItems: lineItems.map((item) =>
          buildDetailedHistoryLineItem(item, currency, {
            categoryLabel,
            livestockTypeLabel,
            dueText,
            modeMonthly: t("detailedCalculator.modes.monthly"),
            modeAnnual: t("detailedCalculator.modes.annual"),
            detailMode: t("detailedCalculator.history.mode"),
            detailNisab: t("detailedCalculator.history.nisab"),
            detailType: t("detailedCalculator.history.type"),
            detailOwned: t("detailedCalculator.history.owned"),
            detailDue: t("detailedCalculator.history.due"),
            detailCashEstimate: t("detailedCalculator.history.cashEstimate"),
            detailWatering: t("detailedCalculator.history.watering"),
            detailDueProduce: t("detailedCalculator.history.dueProduce"),
            detailCashEquivalent: t("detailedCalculator.history.cashEquivalent"),
            modeTrade: t("detailedCalculator.history.modeTrade"),
            modeHarvest: t("detailedCalculator.history.modeHarvest"),
            wateringNatural: t("detailedCalculator.history.wateringNatural"),
            wateringPaidIrrigation: t("detailedCalculator.history.wateringPaidIrrigation"),
            kgUnit: t("history.kgUnit"),
          }),
        ),
        combinedTotal,
      },
    };

    await upsertGuestHistoryEntry(entry);
    setShowHistorySavedToast(true);
  };

  const onCalculateSalary = () => {
    if (!(Number(salaryValues.monthlyIncome) > 0)) {
      setValidationError(t("detailedCalculator.validation.monthlyIncomeRequired"));
      return;
    }
    const result = calculateSalaryZakat({
      nisabMethod,
      silverPricePerGram,
      goldPricePerGram,
      nisabOverride: nisabOverride > 0 ? nisabOverride : undefined,
      salary: {
        monthlyIncome: toNonNegative(salaryValues.monthlyIncome),
        livingExpense: parseOptionalPositive(salaryValues.livingExpense),
        calculationMode: salaryValues.calculationMode,
      },
    });
    setLineItems((p) => [...p, { id: buildId(), category: "salary", values: { ...salaryValues }, result }]);
    setStep("pick");
  };

  const onCalculateLivestock = handleSubmit((values) => {
    const due = calcLivestockZakat(values.livestockType, Number(values.ownedCount), {
      camel121Choice: values.camel121Choice,
    });
    const cashEstimate = parseOptionalPositive(values.cashEstimate ?? "");
    const result: ZakatCalculationResult = {
      nisab: 0,
      totalWealth: 0,
      totalZakat: cashEstimate ?? 0,
      hasZakatDue: (cashEstimate ?? 0) > 0,
      breakdown: {},
    };
    const line: LivestockLineItem = {
      id: buildId(),
      category: "livestock",
      values: {
        livestockType: values.livestockType,
        ownedCount: Number(values.ownedCount),
        camel121Choice: values.camel121Choice,
        cashEstimate,
      },
      result,
      dueItems: due.dueItems,
      dueText: dueText(due.dueItems),
    };
    setLineItems((p) => [...p, line]);
    setStep("pick");
  });

  const onCalculateProduce = () => {
    if (produceValues.isForTrade && !(Number(produceValues.marketValue) > 0)) {
      setValidationError(t("detailedCalculator.validation.produceMarketValueRequired"));
      return;
    }
    if (!produceValues.isForTrade && !(Number(produceValues.quantityKg) > 0)) {
      setValidationError(t("detailedCalculator.validation.harvestQuantityRequired"));
      return;
    }

    const produceResult = calculateProduceZakat({
      nisabMethod,
      silverPricePerGram,
      goldPricePerGram,
      nisabOverride: nisabOverride > 0 ? nisabOverride : undefined,
      produce: {
        isForTrade: produceValues.isForTrade,
        quantityKg: toNonNegative(produceValues.quantityKg),
        marketValue: toNonNegative(produceValues.marketValue),
        wateringMethod: produceValues.wateringMethod,
      },
    });

    if (produceValues.isForTrade) {
      setLineItems((p) => [
        ...p,
        {
          id: buildId(),
          category: "produce",
          values: { ...produceValues },
          result: produceResult,
          dueQuantityKg: undefined,
          cashEquivalent: produceResult.totalZakat,
        },
      ]);
      setStep("pick");
      return;
    }

    const dueKg = produceResult.totalZakat;
    const pricePerKg = parseOptionalPositive(produceValues.pricePerKg);
    const cashEquivalent = pricePerKg ? dueKg * pricePerKg : undefined;
    setLineItems((p) => [
      ...p,
      {
        id: buildId(),
        category: "produce",
        values: { ...produceValues },
        result: { ...produceResult, totalZakat: cashEquivalent ?? 0 },
        dueQuantityKg: dueKg,
        cashEquivalent,
      },
    ]);
    setStep("pick");
  };
  const onCalculateAgriOther = () => {
    if (!(Number(agriOtherValues.marketValue) > 0)) {
      setValidationError(t("detailedCalculator.validation.marketValueRequired"));
      return;
    }
    const result = calculateAgriOtherZakat({
      nisabMethod,
      silverPricePerGram,
      goldPricePerGram,
      nisabOverride: nisabOverride > 0 ? nisabOverride : undefined,
      marketValue: toNonNegative(agriOtherValues.marketValue),
      operatingCosts: toNonNegative(agriOtherValues.operatingCosts),
    });
    setLineItems((p) => [...p, { id: buildId(), category: "agri_other", values: { ...agriOtherValues }, result }]);
    setStep("pick");
  };
  const onCalculateTradeSector = () => {
    if (!(Number(tradeSectorValues.marketValue) > 0)) {
      setValidationError(t("detailedCalculator.validation.marketValueRequired"));
      return;
    }
    const result = calculateTradeSectorZakat({
      nisabMethod,
      silverPricePerGram,
      goldPricePerGram,
      nisabOverride: nisabOverride > 0 ? nisabOverride : undefined,
      marketValue: toNonNegative(tradeSectorValues.marketValue),
      operatingCosts: toNonNegative(tradeSectorValues.operatingCosts),
    });
    setLineItems((p) => [...p, { id: buildId(), category: "trade_sector", values: { ...tradeSectorValues }, result }]);
    setStep("pick");
  };
  const onCalculateIndustrialSector = () => {
    if (!(Number(industrialSectorValues.marketValue) > 0)) {
      setValidationError(t("detailedCalculator.validation.marketValueRequired"));
      return;
    }
    const result = calculateTradeSectorZakat({
      nisabMethod,
      silverPricePerGram,
      goldPricePerGram,
      nisabOverride: nisabOverride > 0 ? nisabOverride : undefined,
      marketValue: toNonNegative(industrialSectorValues.marketValue),
      operatingCosts: toNonNegative(industrialSectorValues.operatingCosts),
    });
    setLineItems((p) => [
      ...p,
      { id: buildId(), category: "industrial_sector", values: { ...industrialSectorValues }, result },
    ]);
    setStep("pick");
  };

  const onCalculate = () => {
    setValidationError(null);
    if (activeCategory === "salary") onCalculateSalary();
    else if (activeCategory === "livestock") onCalculateLivestock();
    else if (activeCategory === "agri_other") onCalculateAgriOther();
    else if (activeCategory === "trade_sector") onCalculateTradeSector();
    else if (activeCategory === "industrial_sector") onCalculateIndustrialSector();
    else if (activeCategory === "debt") return;
    else onCalculateProduce();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroOverline}>{t("detailedCalculator.hero.overline")}</Text>
        <Text style={styles.heroTitle}>
          {step === "pick"
            ? t("detailedCalculator.hero.selectCategory")
            : categoryLabel(activeCategory)}
        </Text>
        <Text style={styles.heroSubTitle}>
          {t("detailedCalculator.hero.categoriesAdded", {
            count: addedCategoryCount,
          })}{" "}
          - {t("detailedCalculator.total.label")}: {totalDisplay.primaryDisplay}
          {totalDisplay.suffixDisplay ? ` + ${totalDisplay.suffixDisplay}` : ""}
        </Text>
      </View>

      {step === "pick" ? (
        <>
          <Text style={styles.instructions}>{t("detailedCalculator.instructions")}</Text>
          {CATEGORY_ORDER.map((category) => {
            const added = lineItems.some((item) => item.category === category);
            return (
              <Pressable key={category} style={styles.categoryCard} onPress={() => openCategory(category)}>
                <Text style={styles.categoryIcon}>{CATEGORY_ICONS[category]}</Text>
                <View style={styles.categoryContent}>
                  <View style={styles.categoryRow}>
                    <Text style={styles.categoryTitle}>{categoryLabel(category)}</Text>
                    {added ? <Text style={styles.addedPill}>{t("detailedCalculator.addedPill")}</Text> : null}
                  </View>
                  <Text style={styles.categoryDesc}>{categoryDescription(category)}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          })}
        </>
      ) : (
        <>
          <Pressable style={styles.backButton} onPress={() => setStep("pick")}>
            <Ionicons name="arrow-back" size={18} color={appColors.textPrimary} />
            <Text style={styles.backButtonText}>
              {t("detailedCalculator.backToCategories")}
            </Text>
          </Pressable>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{categoryLabel(activeCategory)}</Text>
            <Text style={styles.caption}>{categoryDescription(activeCategory)}</Text>
            {activeCategory === "salary" ? (
          <>
            <View style={styles.rowWrap}>
              <Pressable
                style={[styles.chip, salaryValues.calculationMode === "annual" && styles.chipActive]}
                onPress={() => setSalaryValues((p) => ({ ...p, calculationMode: "annual" }))}
              >
                <Text>{t("detailedCalculator.form.salary.annualMode")}</Text>
              </Pressable>
              <Pressable
                style={[styles.chip, salaryValues.calculationMode === "monthly" && styles.chipActive]}
                onPress={() => setSalaryValues((p) => ({ ...p, calculationMode: "monthly" }))}
              >
                <Text>{t("detailedCalculator.form.salary.monthlyMode")}</Text>
              </Pressable>
            </View>
            <TextInput style={styles.input} keyboardType="numeric" value={salaryValues.monthlyIncome} onChangeText={(v) => setSalaryValues((p) => ({ ...p, monthlyIncome: v }))} placeholder={t("detailedCalculator.form.salary.monthlyIncomePlaceholder")} />
            <TextInput style={styles.input} keyboardType="numeric" value={salaryValues.livingExpense} onChangeText={(v) => setSalaryValues((p) => ({ ...p, livingExpense: v }))} placeholder={t("detailedCalculator.form.salary.livingExpensePlaceholder")} />
            <Text style={styles.caption}>
              {t("detailedCalculator.form.salary.scope")}
            </Text>
            <Text style={styles.caption}>
              {t("detailedCalculator.form.salary.modeHint")}
            </Text>
          </>
        ) : activeCategory === "livestock" ? (
          <>
            <Controller control={control} name="livestockType" render={({ field: { value, onChange } }) => (
              <View style={styles.rowWrap}>
                {(["camels", "cattle", "sheep_goats"] as LivestockType[]).map((t) => (
                  <Pressable key={t} style={[styles.chip, value === t && styles.chipActive]} onPress={() => onChange(t)}><Text>{livestockTypeLabel(t)}</Text></Pressable>
                ))}
              </View>
            )} />
            <Controller control={control} name="ownedCount" render={({ field: { value, onChange } }) => (
              <TextInput style={styles.input} keyboardType="numeric" value={value} onChangeText={onChange} placeholder={t("detailedCalculator.form.livestock.ownedCountPlaceholder")} />
            )} />
            {errors.ownedCount ? <Text style={styles.error}>{errors.ownedCount.message}</Text> : null}

            {livestockPreview.due.camel121ChoiceOptions ? (
              <Controller control={control} name="camel121Choice" render={({ field: { value, onChange } }) => (
                <View style={styles.rowWrap}>
                  <Pressable style={[styles.chip, value === "2_hiqqah" && styles.chipActive]} onPress={() => onChange("2_hiqqah")}><Text>{t("detailedCalculator.form.livestock.camel121Option2Hiqqah")}</Text></Pressable>
                  <Pressable style={[styles.chip, value === "3_bint_labun" && styles.chipActive]} onPress={() => onChange("3_bint_labun")}><Text>{t("detailedCalculator.form.livestock.camel121Option3BintLabun")}</Text></Pressable>
                </View>
              )} />
            ) : null}

            <Text style={styles.caption}>
              {t("detailedCalculator.summary.dueAnimalsValue", { value: dueText(livestockPreview.due.dueItems) })}
            </Text>
            <Controller control={control} name="cashEstimate" render={({ field: { value, onChange } }) => (
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
                placeholder={t("detailedCalculator.form.livestock.cashEstimatePlaceholder", { currency })}
              />
            )} />
            {errors.cashEstimate ? <Text style={styles.error}>{errors.cashEstimate.message}</Text> : null}
            <Text style={styles.caption}>
              {livestockPreview.cashEstimate === undefined
                ? t("detailedCalculator.summary.cashEquivalentNotSet")
                : t("detailedCalculator.summary.cashEquivalentValue", { value: formatMoney(livestockPreview.cashEstimate, currency) })}
            </Text>
          </>
        ) : activeCategory === "agri_other" ? (
          <>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={agriOtherValues.marketValue}
              onChangeText={(v) => setAgriOtherValues((p) => ({ ...p, marketValue: v }))}
              placeholder={t("detailedCalculator.form.agriOther.marketValuePlaceholder")}
            />
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={agriOtherValues.operatingCosts}
              onChangeText={(v) => setAgriOtherValues((p) => ({ ...p, operatingCosts: v }))}
              placeholder={t("detailedCalculator.form.agriOther.operatingCostsPlaceholder")}
            />
            <Text style={styles.caption}>
              {t("detailedCalculator.form.agriOther.scope")}
            </Text>
            <Text style={styles.caption}>
              {t("detailedCalculator.form.agriOther.rule")}
            </Text>
          </>
        ) : activeCategory === "trade_sector" ? (
          <>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={tradeSectorValues.marketValue}
              onChangeText={(v) => setTradeSectorValues((p) => ({ ...p, marketValue: v }))}
              placeholder={t("detailedCalculator.form.trade.marketValuePlaceholder")}
            />
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={tradeSectorValues.operatingCosts}
              onChangeText={(v) => setTradeSectorValues((p) => ({ ...p, operatingCosts: v }))}
              placeholder={t("detailedCalculator.form.trade.operatingCostsPlaceholder")}
            />
            <Text style={styles.caption}>
              {t("detailedCalculator.form.trade.scopeMain")}
            </Text>
            <Text style={styles.caption}>
              {t("detailedCalculator.form.trade.scopeSecondary")}
            </Text>
            <Text style={styles.caption}>
              {t("detailedCalculator.form.trade.rule")}
            </Text>
          </>
        ) : activeCategory === "industrial_sector" ? (
          <>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={industrialSectorValues.marketValue}
              onChangeText={(v) => setIndustrialSectorValues((p) => ({ ...p, marketValue: v }))}
              placeholder={t("detailedCalculator.form.industrial.marketValuePlaceholder")}
            />
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={industrialSectorValues.operatingCosts}
              onChangeText={(v) => setIndustrialSectorValues((p) => ({ ...p, operatingCosts: v }))}
              placeholder={t("detailedCalculator.form.industrial.productionCostsPlaceholder")}
            />
            <Text style={styles.caption}>
              {t("detailedCalculator.form.industrial.scope")}
            </Text>
            <Text style={styles.caption}>
              {t("detailedCalculator.form.industrial.rule")}
            </Text>
          </>
        ) : activeCategory === "debt" ? (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.bold}>{t("detailedCalculator.form.debt.owedToYouTitle")}</Text>
              <Text style={styles.caption}>{t("detailedCalculator.form.debt.owedToYouBody")}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.bold}>{t("detailedCalculator.form.debt.youOweTitle")}</Text>
              <Text style={styles.caption}>{t("detailedCalculator.form.debt.youOweBody")}</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.rowWrap}>
              <Pressable
                style={[styles.chip, !produceValues.isForTrade && styles.chipActive]}
                onPress={() =>
                  setProduceValues((p) => ({ ...p, isForTrade: false, marketValue: "" }))
                }
              >
                <Text>{t("detailedCalculator.form.produce.harvestMode")}</Text>
              </Pressable>
              <Pressable
                style={[styles.chip, produceValues.isForTrade && styles.chipActive]}
                onPress={() =>
                  setProduceValues((p) => ({ ...p, isForTrade: true, quantityKg: "", pricePerKg: "" }))
                }
              >
                <Text>{t("detailedCalculator.form.produce.tradeMode")}</Text>
              </Pressable>
            </View>

            {produceValues.isForTrade ? (
              <>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={produceValues.marketValue}
                  onChangeText={(v) => setProduceValues((p) => ({ ...p, marketValue: v }))}
                  placeholder={t("detailedCalculator.form.produce.marketValuePlaceholder")}
                />
                <Text style={styles.caption}>
                  {t("detailedCalculator.form.produce.tradeRule")}
                </Text>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={produceValues.quantityKg}
                  onChangeText={(v) => setProduceValues((p) => ({ ...p, quantityKg: v }))}
                  placeholder={t("detailedCalculator.form.produce.quantityPlaceholder")}
                />
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={produceValues.pricePerKg}
                  onChangeText={(v) => setProduceValues((p) => ({ ...p, pricePerKg: v }))}
                  placeholder={t("detailedCalculator.form.produce.pricePerKgPlaceholder")}
                />
                <View style={styles.rowWrap}>
                  <Pressable
                    style={[styles.chip, produceValues.wateringMethod === "natural" && styles.chipActive]}
                    onPress={() => setProduceValues((p) => ({ ...p, wateringMethod: "natural" }))}
                  >
                    <Text>{t("detailedCalculator.form.produce.naturalWatering")}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.chip, produceValues.wateringMethod === "paid_irrigation" && styles.chipActive]}
                    onPress={() => setProduceValues((p) => ({ ...p, wateringMethod: "paid_irrigation" }))}
                  >
                    <Text>{t("detailedCalculator.form.produce.paidIrrigation")}</Text>
                  </Pressable>
                </View>
                <Text style={styles.caption}>
                  {t("detailedCalculator.form.produce.harvestRule")}
                </Text>
              </>
            )}
          </>
            )}
            {livePreview ? (
              <View style={styles.previewBox}>
                <Text style={styles.previewTitle}>
                  {t("detailedCalculator.preview.title")}
                </Text>
                <View style={styles.row}><Text style={styles.previewLabel}>{livePreview.netLabel}</Text><Text style={styles.previewValue}>{livePreview.netValue}</Text></View>
                <View style={styles.row}><Text style={styles.previewLabel}>{livePreview.dueLabel}</Text><Text style={styles.previewValue}>{livePreview.dueValue}</Text></View>
                {"extraLabel" in livePreview && livePreview.extraLabel && livePreview.extraValue ? (
                  <View style={styles.row}><Text style={styles.previewLabel}>{livePreview.extraLabel}</Text><Text style={styles.previewValue}>{livePreview.extraValue}</Text></View>
                ) : null}
              </View>
            ) : null}
            <Pressable style={styles.accordionHeader} onPress={() => setIsHowCalculatedOpen((p) => !p)}>
              <Text style={styles.bold}>
                {t("detailedCalculator.howCalculated")}
              </Text>
              <Text style={styles.link}>
                {isHowCalculatedOpen
                  ? t("detailedCalculator.hide")
                  : t("detailedCalculator.show")}
              </Text>
            </Pressable>
            {isHowCalculatedOpen ? <Text style={styles.caption}>{categoryDescription(activeCategory)}</Text> : null}
            {validationError ? <Text style={styles.error}>{validationError}</Text> : null}
            {activeCategory !== "debt" ? (
              <TouchableOpacity style={styles.button} onPress={onCalculate}>
                <Text style={styles.buttonText}>
                  {t("detailedCalculator.addCategory")}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </>
      )}

      {lineItems.length > 0 ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryHeader}>
            {t("detailedCalculator.summary.title")}
          </Text>
          {lineItems.map((item) => (
            <View key={item.id} style={styles.summaryItem}>
              <View style={styles.row}>
                <Text style={styles.bold}>{categoryLabel(item.category)}</Text>
                <Pressable onPress={() => setLineItems((p) => p.filter((x) => x.id !== item.id))}>
                  <Text style={styles.link}>{t("delete")}</Text>
                </Pressable>
              </View>
              {item.category === "salary" ? (
                <>
                  <Text>{t("detailedCalculator.summary.modeValue", { value: item.values.calculationMode === "monthly" ? t("detailedCalculator.modes.monthly") : t("detailedCalculator.modes.annual") })}</Text>
                  <Text>{t("detailedCalculator.summary.nisabValue", { value: formatMoney(item.result.nisab, currency) })}</Text>
                  <Text>{t("detailedCalculator.summary.netWealthValue", { value: formatMoney(item.result.totalWealth, currency) })}</Text>
                  <Text>{t("detailedCalculator.summary.zakatDueValue", { value: formatMoney(item.result.totalZakat, currency) })}</Text>
                </>
              ) : item.category === "livestock" ? (
                <>
                  <Text>{t("detailedCalculator.summary.typeValue", { value: livestockTypeLabel(item.values.livestockType) })}</Text>
                  <Text>{t("detailedCalculator.summary.ownedValue", { value: item.values.ownedCount })}</Text>
                  <Text>{t("detailedCalculator.summary.dueAnimalsValue", { value: dueText(item.dueItems) })}</Text>
                  <Text>{t("detailedCalculator.summary.cashIncludedValue", { value: formatMoney(item.values.cashEstimate ?? 0, currency) })}</Text>
                </>
              ) : item.category === "agri_other" ? (
                <>
                  <Text>{t("detailedCalculator.summary.marketValueValue", { value: formatMoney(Number(item.values.marketValue || 0), currency) })}</Text>
                  <Text>{t("detailedCalculator.summary.operatingCostsValue", { value: formatMoney(Number(item.values.operatingCosts || 0), currency) })}</Text>
                  <Text>{t("detailedCalculator.summary.netValueValue", { value: formatMoney(item.result.totalWealth, currency) })}</Text>
                  <Text>{t("detailedCalculator.summary.ruleAgriOther")}</Text>
                  <Text>{t("detailedCalculator.summary.nisabValue", { value: formatMoney(item.result.nisab, currency) })}</Text>
                  <Text>{t("detailedCalculator.summary.zakatDueValue", { value: formatMoney(item.result.totalZakat, currency) })}</Text>
                </>
              ) : item.category === "trade_sector" ? (
                <>
                  <Text>{t("detailedCalculator.summary.tradeAssetsValue", { value: formatMoney(Number(item.values.marketValue || 0), currency) })}</Text>
                  <Text>{t("detailedCalculator.summary.dueOperatingCostsValue", { value: formatMoney(Number(item.values.operatingCosts || 0), currency) })}</Text>
                  <Text>{t("detailedCalculator.summary.netZakatableAmountValue", { value: formatMoney(item.result.totalWealth, currency) })}</Text>
                  <Text>{t("detailedCalculator.summary.ruleTradeSector")}</Text>
                  <Text>{t("detailedCalculator.summary.nisabValue", { value: formatMoney(item.result.nisab, currency) })}</Text>
                  <Text>{t("detailedCalculator.summary.zakatDueValue", { value: formatMoney(item.result.totalZakat, currency) })}</Text>
                </>
              ) : item.category === "industrial_sector" ? (
                <>
                  <Text>{t("detailedCalculator.summary.industrialAssetsValue", { value: formatMoney(Number(item.values.marketValue || 0), currency) })}</Text>
                  <Text>{t("detailedCalculator.summary.productionCostsValue", { value: formatMoney(Number(item.values.operatingCosts || 0), currency) })}</Text>
                  <Text>{t("detailedCalculator.summary.netZakatableAmountValue", { value: formatMoney(item.result.totalWealth, currency) })}</Text>
                  <Text>{t("detailedCalculator.summary.ruleIndustrial")}</Text>
                  <Text>{t("detailedCalculator.summary.nisabValue", { value: formatMoney(item.result.nisab, currency) })}</Text>
                  <Text>{t("detailedCalculator.summary.zakatDueValue", { value: formatMoney(item.result.totalZakat, currency) })}</Text>
                </>
              ) : (
                <>
                  <Text>{t("detailedCalculator.summary.modeValue", { value: item.values.isForTrade ? t("detailedCalculator.form.produce.tradeMode") : t("detailedCalculator.form.produce.harvestMode") })}</Text>
                  {item.values.isForTrade ? (
                    <>
                      <Text>{t("detailedCalculator.summary.marketValueValue", { value: formatMoney(Number(item.values.marketValue || 0), currency) })}</Text>
                      <Text>{t("detailedCalculator.summary.ruleProduceTrade")}</Text>
                      <Text>{t("detailedCalculator.summary.nisabValue", { value: formatMoney(item.result.nisab, currency) })}</Text>
                      <Text>{t("detailedCalculator.summary.zakatDueValue", { value: formatMoney(item.result.totalZakat, currency) })}</Text>
                    </>
                  ) : (
                    <>
                      <Text>{t("detailedCalculator.summary.harvestQuantityValue", { value: `${Number(item.values.quantityKg || 0).toFixed(2)} ${t("history.kgUnit")}` })}</Text>
                      <Text>{t("detailedCalculator.summary.ruleWateringValue", { value: item.values.wateringMethod === "natural" ? t("detailedCalculator.form.produce.naturalWatering") : t("detailedCalculator.form.produce.paidIrrigation") })}</Text>
                      <Text>{t("detailedCalculator.summary.nisabValue", { value: `${item.result.nisab.toFixed(2)} ${t("history.kgUnit")}` })}</Text>
                      <Text>{t("detailedCalculator.summary.zakatDueProduceValue", { value: `${(item.dueQuantityKg ?? 0).toFixed(2)} ${t("history.kgUnit")}` })}</Text>
                      <Text>{t("detailedCalculator.summary.pricePerKgValue", { value: parseOptionalPositive(item.values.pricePerKg) ? formatMoney(parseOptionalPositive(item.values.pricePerKg)!, currency) : t("detailedCalculator.notSet") })}</Text>
                      <Text>{t("detailedCalculator.summary.cashEquivalentIncludedValue", { value: formatMoney(item.cashEquivalent ?? 0, currency) })}</Text>
                    </>
                  )}
                </>
              )}
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.bold}>{t("history.totalZakatDue")}</Text>
            <View style={styles.totalValueWrap}>
              <Text style={styles.totalValue}>{totalDisplay.primaryDisplay}</Text>
              {totalDisplay.suffixDisplay ? <Text style={styles.totalSuffix}>+ {totalDisplay.suffixDisplay}</Text> : null}
            </View>
          </View>
          <TouchableOpacity style={styles.saveHistoryButton} onPress={onSaveToHistory}>
              <Text style={styles.buttonText}>
              {t("detailedCalculator.saveToHistory")}
              </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {showHistorySavedToast ? (
        <View style={styles.toast}>
            <Text style={styles.toastText}>
            {t("quickResult.saved.body")}
            </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: appColors.background },
  content: { paddingBottom: appSpacing.xxl },
  hero: { backgroundColor: appColors.primary, paddingHorizontal: appSpacing.lg, paddingVertical: appSpacing.lg, marginBottom: appSpacing.md },
  heroOverline: { color: "#D4F0EA", fontSize: 11, fontWeight: "700", letterSpacing: 0.7 },
  heroTitle: { color: "#fff", fontSize: 34, fontWeight: "800", marginTop: appSpacing.xs },
  heroSubTitle: { color: "#D7EFE9", fontSize: 14, marginTop: appSpacing.xs, fontWeight: "600" },
  instructions: { marginHorizontal: appSpacing.lg, marginBottom: appSpacing.sm, color: appColors.textPrimary, fontSize: 15 },
  card: { backgroundColor: appColors.surface, borderRadius: appRadius.md, padding: appSpacing.sm, marginBottom: appSpacing.sm, borderWidth: 1, borderColor: appColors.border },
  sectionTitle: { fontWeight: "700", marginBottom: appSpacing.xs, fontSize: 18, color: appColors.textPrimary },
  backButton: { marginHorizontal: appSpacing.lg, marginBottom: appSpacing.sm, flexDirection: "row", alignItems: "center", gap: appSpacing.xs },
  backButtonText: { color: appColors.textPrimary, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: appColors.border, borderRadius: appRadius.sm, padding: appSpacing.sm, marginBottom: appSpacing.xs, backgroundColor: appColors.surface, color: appColors.textPrimary, minHeight: 48, fontSize: 16 },
  button: { backgroundColor: appColors.primary, borderRadius: appRadius.sm, alignItems: "center", paddingVertical: appSpacing.sm, marginBottom: appSpacing.sm, minHeight: 48, justifyContent: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: appSpacing.xs },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", marginBottom: appSpacing.xs },
  chip: { borderWidth: 1, borderColor: appColors.border, borderRadius: appRadius.sm, paddingVertical: appSpacing.xs, paddingHorizontal: appSpacing.sm, marginRight: appSpacing.xs, marginBottom: appSpacing.xs, backgroundColor: appColors.surface },
  chipActive: { backgroundColor: "#E8F1EF", borderColor: appColors.primary },
  link: { color: appColors.primary, fontWeight: "600" },
  caption: { color: appColors.textSecondary, fontSize: 13, marginBottom: appSpacing.xs },
  error: { color: appColors.error, marginBottom: appSpacing.xs, fontSize: 13 },
  lineItem: { borderWidth: 1, borderColor: appColors.border, borderRadius: appRadius.sm, padding: appSpacing.sm, marginBottom: appSpacing.xs },
  categoryCard: { marginHorizontal: appSpacing.lg, marginBottom: appSpacing.sm, borderRadius: appRadius.md, borderWidth: 1, borderColor: "#BAC7C2", backgroundColor: appColors.surface, padding: appSpacing.md, flexDirection: "row", alignItems: "center", minHeight: 84 },
  categoryIcon: { fontSize: 22, marginRight: appSpacing.sm },
  categoryContent: { flex: 1 },
  categoryRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  categoryTitle: { color: appColors.textPrimary, fontSize: 21, fontWeight: "800", flexShrink: 1 },
  categoryDesc: { color: appColors.textSecondary, fontSize: 13 },
  addedPill: { color: "#1F6A5E", fontWeight: "700", fontSize: 12, marginLeft: appSpacing.xs, backgroundColor: "#E0F3EE", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  chevron: { color: appColors.primary, fontSize: 24, marginLeft: appSpacing.sm },
  infoBox: { borderWidth: 1, borderColor: appColors.border, borderRadius: appRadius.sm, padding: appSpacing.sm, backgroundColor: "#F8FAF8", marginBottom: appSpacing.xs },
  previewBox: { backgroundColor: appColors.primary, borderRadius: appRadius.sm, padding: appSpacing.sm, marginTop: appSpacing.xs, marginBottom: appSpacing.xs },
  previewTitle: { color: "#DDF6F2", fontSize: 12, fontWeight: "700", marginBottom: appSpacing.xs, textTransform: "uppercase" },
  previewLabel: { color: "#E5FAF6", fontSize: 14, fontWeight: "600" },
  previewValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
  accordionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderColor: appColors.border, paddingTop: appSpacing.sm, marginTop: appSpacing.xs },
  summaryCard: { backgroundColor: appColors.surface, borderRadius: appRadius.md, borderWidth: 1, borderColor: appColors.primary, marginHorizontal: appSpacing.lg, marginBottom: appSpacing.sm, overflow: "hidden" },
  summaryHeader: { backgroundColor: appColors.primary, color: "#fff", fontSize: 18, fontWeight: "800", paddingHorizontal: appSpacing.md, paddingVertical: appSpacing.sm },
  summaryItem: { borderBottomWidth: 1, borderBottomColor: appColors.border, padding: appSpacing.sm },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#E2EFEA", borderRadius: appRadius.sm, margin: appSpacing.sm, padding: appSpacing.sm },
  totalValueWrap: { alignItems: "flex-end", flex: 1, marginLeft: appSpacing.sm },
  totalValue: { color: appColors.primary, fontWeight: "800", fontSize: 20, textAlign: "right" },
  totalSuffix: { color: appColors.textSecondary, fontSize: 12, textAlign: "right", marginTop: 2 },
  bold: { fontWeight: "700" },
  saveHistoryButton: { marginTop: appSpacing.xs, backgroundColor: appColors.success, borderRadius: appRadius.sm, alignItems: "center", paddingVertical: appSpacing.sm, minHeight: 48, justifyContent: "center" },
  toast: { position: "absolute", bottom: 18, left: 16, right: 16, backgroundColor: appColors.textPrimary, borderRadius: appRadius.sm, paddingVertical: appSpacing.xs, alignItems: "center" },
  toastText: { color: "#fff", fontWeight: "600" },
});

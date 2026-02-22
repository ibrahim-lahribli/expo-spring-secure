import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { upsertGuestHistoryEntry } from "../../../features/history/storage";
import type { DetailedHistoryLineItem, HistoryEntry } from "../../../features/history/types";
import {
  calcCashEquivalent,
  calcLivestockZakat,
  calculateProduceZakat,
  calculateSalaryZakat,
  getDueItemLabel,
  getDueItemPriceKey,
  type Camel121Choice,
  type DueItem,
  type DueItemPriceKey,
  type DueItemPrices,
  type LivestockType,
  type ProduceWateringMethod,
  type ZakatCalculationResult,
} from "../../../lib/zakat-calculation";
import { calculateNisab, getNisabBreakdown } from "../../../lib/zakat-calculation/nisab";
import { useNisabSettingsStore } from "../../../store/nisabSettingsStore";

const DEFAULT_SILVER_PRICE_PER_GRAM = 12;
const DEFAULT_GOLD_PRICE_PER_GRAM = 800;

type CategoryId = "salary" | "livestock" | "produce" | "agri_other" | "trade_sector" | "industrial_sector" | "debt";
type LivestockPaymentMethod = "in_kind" | "cash";
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
  paymentMethod: LivestockPaymentMethod;
  camel121Choice: Camel121Choice;
  prices: DueItemPrices;
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

const CATEGORY_LABELS: Record<CategoryId, string> = {
  debt: "Debt is of two kinds",
  industrial_sector: "Industrial Sector",
  salary: "Services Sector (Salaries and Service Income)",
  livestock: "Livestock",
  produce: "Grains and Fruits (Agricultural Produce)",
  agri_other: "Agricultural Products (Other than Grains/Fruits)",
  trade_sector: "Trade Sector and Related Activities (قطاع التجارة وتوابعها)",
};
const LIVESTOCK_LABELS: Record<LivestockType, string> = {
  camels: "Camels",
  cattle: "Cattle",
  sheep_goats: "Sheep/Goats",
};

const livestockSchema = z
  .object({
    livestockType: z.enum(["camels", "cattle", "sheep_goats"]),
    ownedCount: z.string().trim().refine((v) => /^\d+$/.test(v), "Owned must be an integer >= 0."),
    paymentMethod: z.enum(["in_kind", "cash"]),
    camel121Choice: z.enum(["2_hiqqah", "3_bint_labun"]),
    prices: z.record(z.string(), z.string().optional()).default({}),
  })
  .superRefine((v, ctx) => {
    if (v.paymentMethod !== "cash") return;
    const due = calcLivestockZakat(v.livestockType, Number(v.ownedCount), {
      camel121Choice: v.camel121Choice,
    });
    for (const item of due.dueItems) {
      const key = getDueItemPriceKey(item);
      const price = Number(v.prices[key]);
      if (!Number.isFinite(price) || price <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["prices", key],
          message: "Enter a price > 0.",
        });
      }
    }
  });
type LivestockForm = {
  livestockType: LivestockType;
  ownedCount: string;
  paymentMethod: LivestockPaymentMethod;
  camel121Choice: Camel121Choice;
  prices?: Record<string, string | undefined>;
};

const defaultLivestockForm: LivestockForm = {
  livestockType: "camels",
  ownedCount: "",
  paymentMethod: "in_kind",
  camel121Choice: "2_hiqqah",
  prices: {},
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

function parseOptionalPositive(v: string): number | undefined {
  if (!v.trim()) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
function toNonNegative(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
function toPriceMap(prices: Record<string, string | undefined>): DueItemPrices {
  const out: DueItemPrices = {};
  for (const [k, v] of Object.entries(prices)) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) out[k as DueItemPriceKey] = n;
  }
  return out;
}
function buildId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function requiredPriceKeys(dueItems: DueItem[]): DueItemPriceKey[] {
  return Array.from(new Set(dueItems.map((item) => getDueItemPriceKey(item))));
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

function buildDetailedHistoryLineItem(item: LineItem): DetailedHistoryLineItem {
  if (item.category === "salary") {
    return {
      id: item.id,
      category: item.category,
      label: CATEGORY_LABELS[item.category],
      totalZakat: item.result.totalZakat,
      totalWealth: item.result.totalWealth,
      details: [
        `Mode: ${item.values.calculationMode}`,
        `Nisab: ${item.result.nisab.toFixed(2)}`,
      ],
    };
  }

  if (item.category === "livestock") {
    return {
      id: item.id,
      category: item.category,
      label: CATEGORY_LABELS[item.category],
      totalZakat: item.result.totalZakat,
      totalWealth: item.result.totalWealth,
      details: [
        `Type: ${item.values.livestockType}`,
        `Owned: ${item.values.ownedCount}`,
        `Due: ${item.dueText}`,
      ],
    };
  }

  if (item.category === "produce") {
    return {
      id: item.id,
      category: item.category,
      label: CATEGORY_LABELS[item.category],
      totalZakat: item.result.totalZakat,
      totalWealth: item.result.totalWealth,
      details: [
        `Mode: ${item.values.isForTrade ? "trade" : "harvest"}`,
        `Watering: ${item.values.wateringMethod}`,
      ],
    };
  }

  return {
    id: item.id,
    category: item.category,
    label: CATEGORY_LABELS[item.category],
    totalZakat: item.result.totalZakat,
    totalWealth: item.result.totalWealth,
    details: [`Nisab: ${item.result.nisab.toFixed(2)}`],
  };
}

export default function DetailedCalculateScreen() {
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
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isNisabAdvancedOpen, setIsNisabAdvancedOpen] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showHistorySavedToast, setShowHistorySavedToast] = useState(false);

  const nisabMethod = useNisabSettingsStore((s) => s.nisabMethod);
  const silverPricePerGram = useNisabSettingsStore((s) => s.silverPricePerGram);
  const goldPricePerGram = useNisabSettingsStore((s) => s.goldPricePerGram);
  const nisabOverride = useNisabSettingsStore((s) => s.nisabOverride);
  const setNisabMethod = useNisabSettingsStore((s) => s.setNisabMethod);
  const setSilverPricePerGram = useNisabSettingsStore((s) => s.setSilverPricePerGram);
  const setGoldPricePerGram = useNisabSettingsStore((s) => s.setGoldPricePerGram);
  const setNisabOverride = useNisabSettingsStore((s) => s.setNisabOverride);

  const [draftNisabMethod, setDraftNisabMethod] = useState(nisabMethod);
  const [draftSilver, setDraftSilver] = useState("");
  const [draftGold, setDraftGold] = useState("");
  const [draftOverride, setDraftOverride] = useState("");

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
  const paymentMethod = useWatch({ control, name: "paymentMethod" }) ?? "in_kind";
  const camel121Choice = useWatch({ control, name: "camel121Choice" }) ?? "2_hiqqah";
  const watchedPrices = useWatch({ control, name: "prices" }) ?? {};

  const livestockPreview = useMemo(() => {
    const due = calcLivestockZakat(livestockType, /^\d+$/.test(livestockOwned) ? Number(livestockOwned) : 0, {
      camel121Choice,
    });
    const cashEquivalent = calcCashEquivalent(due.dueItems, toPriceMap(watchedPrices));
    return { due, cashEquivalent, keys: requiredPriceKeys(due.dueItems) };
  }, [livestockType, livestockOwned, camel121Choice, watchedPrices]);

  const nisabBreakdown = useMemo(
    () => getNisabBreakdown({ nisabMethod, silverPricePerGram, goldPricePerGram, nisabOverride }),
    [nisabMethod, silverPricePerGram, goldPricePerGram, nisabOverride],
  );

  useEffect(() => {
    if (!isNisabAdvancedOpen) {
      setDraftNisabMethod(nisabMethod);
      setDraftSilver(silverPricePerGram > 0 ? String(silverPricePerGram) : "");
      setDraftGold(goldPricePerGram > 0 ? String(goldPricePerGram) : "");
      setDraftOverride(nisabOverride > 0 ? String(nisabOverride) : "");
    }
  }, [isNisabAdvancedOpen, nisabMethod, silverPricePerGram, goldPricePerGram, nisabOverride]);

  useEffect(() => {
    if (!showSavedToast) return;
    const t = setTimeout(() => setShowSavedToast(false), 1800);
    return () => clearTimeout(t);
  }, [showSavedToast]);

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

  const onSaveToHistory = async () => {
    if (lineItems.length === 0) {
      return;
    }

    const now = new Date().toISOString();
    const categoriesUsed = Array.from(new Set(lineItems.map((item) => CATEGORY_LABELS[item.category])));
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      flowType: "detailed",
      createdAt: now,
      updatedAt: now,
      totalZakat: combinedTotal,
      currency: "USD",
      nisabSnapshot: {
        method: nisabMethod,
        silverPricePerGram,
        goldPricePerGram,
        override: nisabOverride > 0 ? nisabOverride : null,
      },
      summary: {
        categoriesUsed,
        itemCount: lineItems.length,
      },
      payload: {
        kind: "detailed",
        lineItems: lineItems.map(buildDetailedHistoryLineItem),
        combinedTotal,
      },
    };

    await upsertGuestHistoryEntry(entry);
    setShowHistorySavedToast(true);
  };

  const onCalculateSalary = () => {
    if (!(Number(salaryValues.monthlyIncome) > 0)) {
      setValidationError("Please enter your monthly income.");
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
  };

  const onCalculateLivestock = handleSubmit((values) => {
    const due = calcLivestockZakat(values.livestockType, Number(values.ownedCount), {
      camel121Choice: values.camel121Choice,
    });
    const pricesMap = toPriceMap(values.prices ?? {});
    const cashEquivalent = calcCashEquivalent(due.dueItems, pricesMap);
    const payment = values.paymentMethod;
    const result: ZakatCalculationResult = {
      nisab: 0,
      totalWealth: 0,
      totalZakat: payment === "cash" ? cashEquivalent ?? 0 : 0,
      hasZakatDue: payment === "cash" ? (cashEquivalent ?? 0) > 0 : false,
      breakdown: {},
    };
    const line: LivestockLineItem = {
      id: buildId(),
      category: "livestock",
      values: {
        livestockType: values.livestockType,
        ownedCount: Number(values.ownedCount),
        paymentMethod: payment,
        camel121Choice: values.camel121Choice,
        prices: pricesMap,
      },
      result,
      dueItems: due.dueItems,
      dueText: due.dueText,
    };
    setLineItems((p) => [...p, line]);
  });

  const onCalculateProduce = () => {
    if (produceValues.isForTrade && !(Number(produceValues.marketValue) > 0)) {
      setValidationError("Please enter the produce market value.");
      return;
    }
    if (!produceValues.isForTrade && !(Number(produceValues.quantityKg) > 0)) {
      setValidationError("Please enter harvested quantity in kg.");
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
  };
  const onCalculateAgriOther = () => {
    if (!(Number(agriOtherValues.marketValue) > 0)) {
      setValidationError("Please enter the market value.");
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
  };
  const onCalculateTradeSector = () => {
    if (!(Number(tradeSectorValues.marketValue) > 0)) {
      setValidationError("Please enter the market value.");
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
  };
  const onCalculateIndustrialSector = () => {
    if (!(Number(industrialSectorValues.marketValue) > 0)) {
      setValidationError("Please enter the market value.");
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

  const onSaveNisab = () => {
    const silver = parseOptionalPositive(draftSilver) ?? DEFAULT_SILVER_PRICE_PER_GRAM;
    const gold = parseOptionalPositive(draftGold) ?? DEFAULT_GOLD_PRICE_PER_GRAM;
    const override = parseOptionalPositive(draftOverride) ?? 0;
    setNisabMethod(draftNisabMethod);
    setSilverPricePerGram(silver);
    setGoldPricePerGram(gold);
    setNisabOverride(override);
    setIsNisabAdvancedOpen(false);
    setShowSavedToast(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Detailed Calculate</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Nisab Settings</Text>
        <View style={styles.row}>
          <Pressable style={[styles.chip, (isNisabAdvancedOpen ? draftNisabMethod : nisabMethod) === "silver" && styles.chipActive]} onPress={() => (isNisabAdvancedOpen ? setDraftNisabMethod("silver") : setNisabMethod("silver"))}><Text>Silver</Text></Pressable>
          <Pressable style={[styles.chip, (isNisabAdvancedOpen ? draftNisabMethod : nisabMethod) === "gold" && styles.chipActive]} onPress={() => (isNisabAdvancedOpen ? setDraftNisabMethod("gold") : setNisabMethod("gold"))}><Text>Gold</Text></Pressable>
          <Pressable onPress={() => setIsNisabAdvancedOpen((p) => !p)}><Text style={styles.link}>{isNisabAdvancedOpen ? "Collapse" : "Advanced"}</Text></Pressable>
        </View>
        {!isNisabAdvancedOpen ? <Text style={styles.caption}>{nisabBreakdown.shortSummary}</Text> : (
          <>
            <TextInput style={styles.input} keyboardType="numeric" value={draftSilver} onChangeText={setDraftSilver} placeholder="Silver price/g" />
            <TextInput style={styles.input} keyboardType="numeric" value={draftGold} onChangeText={setDraftGold} placeholder="Gold price/g" />
            <TextInput style={styles.input} keyboardType="numeric" value={draftOverride} onChangeText={setDraftOverride} placeholder="Nisab override" />
            <TouchableOpacity style={styles.button} onPress={onSaveNisab}><Text style={styles.buttonText}>Save</Text></TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Category</Text>
        <Pressable style={styles.selector} onPress={() => setIsCategoryPickerVisible(true)}>
          <Text>{CATEGORY_LABELS[activeCategory]}</Text>
          <Text style={styles.link}>Change</Text>
        </Pressable>

        {activeCategory === "salary" ? (
          <>
            <View style={styles.rowWrap}>
              <Pressable
                style={[styles.chip, salaryValues.calculationMode === "annual" && styles.chipActive]}
                onPress={() => setSalaryValues((p) => ({ ...p, calculationMode: "annual" }))}
              >
                <Text>Annual mode</Text>
              </Pressable>
              <Pressable
                style={[styles.chip, salaryValues.calculationMode === "monthly" && styles.chipActive]}
                onPress={() => setSalaryValues((p) => ({ ...p, calculationMode: "monthly" }))}
              >
                <Text>Monthly mode</Text>
              </Pressable>
            </View>
            <TextInput style={styles.input} keyboardType="numeric" value={salaryValues.monthlyIncome} onChangeText={(v) => setSalaryValues((p) => ({ ...p, monthlyIncome: v }))} placeholder="Monthly services income" />
            <TextInput style={styles.input} keyboardType="numeric" value={salaryValues.livingExpense} onChangeText={(v) => setSalaryValues((p) => ({ ...p, livingExpense: v }))} placeholder="Monthly essential expense (optional)" />
            <Text style={styles.caption}>
              Scope: salaries/wages and service-based earnings (healthcare, legal, consulting, telecom, media rights, and similar services).
            </Text>
            <Text style={styles.caption}>
              Annual mode: checks yearly net savings against nisab. Monthly mode: checks each month&apos;s net against nisab.
            </Text>
          </>
        ) : activeCategory === "livestock" ? (
          <>
            <Controller control={control} name="livestockType" render={({ field: { value, onChange } }) => (
              <View style={styles.rowWrap}>
                {(["camels", "cattle", "sheep_goats"] as LivestockType[]).map((t) => (
                  <Pressable key={t} style={[styles.chip, value === t && styles.chipActive]} onPress={() => onChange(t)}><Text>{LIVESTOCK_LABELS[t]}</Text></Pressable>
                ))}
              </View>
            )} />
            <Controller control={control} name="ownedCount" render={({ field: { value, onChange } }) => (
              <TextInput style={styles.input} keyboardType="numeric" value={value} onChangeText={onChange} placeholder="Owned count" />
            )} />
            {errors.ownedCount ? <Text style={styles.error}>{errors.ownedCount.message}</Text> : null}

            <Controller control={control} name="paymentMethod" render={({ field: { value, onChange } }) => (
              <View style={styles.rowWrap}>
                <Pressable style={[styles.chip, value === "in_kind" && styles.chipActive]} onPress={() => onChange("in_kind")}><Text>In-kind</Text></Pressable>
                <Pressable style={[styles.chip, value === "cash" && styles.chipActive]} onPress={() => onChange("cash")}><Text>Cash</Text></Pressable>
              </View>
            )} />

            {livestockPreview.due.camel121ChoiceOptions ? (
              <Controller control={control} name="camel121Choice" render={({ field: { value, onChange } }) => (
                <View style={styles.rowWrap}>
                  <Pressable style={[styles.chip, value === "2_hiqqah" && styles.chipActive]} onPress={() => onChange("2_hiqqah")}><Text>2 hiqqah</Text></Pressable>
                  <Pressable style={[styles.chip, value === "3_bint_labun" && styles.chipActive]} onPress={() => onChange("3_bint_labun")}><Text>3 bint labun</Text></Pressable>
                </View>
              )} />
            ) : null}

            <Text style={styles.caption}>Due: {livestockPreview.due.dueText}</Text>
            {paymentMethod === "cash" ? livestockPreview.keys.map((key) => (
              <Controller key={key} control={control} name={`prices.${key}`} render={({ field: { value, onChange } }) => (
                <View>
                  <TextInput style={styles.input} keyboardType="numeric" value={value ?? ""} onChangeText={onChange} placeholder={`Price for ${key}`} />
                  {(errors.prices as Record<string, { message?: string }> | undefined)?.[key]?.message ? <Text style={styles.error}>{(errors.prices as Record<string, { message?: string }>)[key].message}</Text> : null}
                </View>
              )} />
            )) : null}
            {paymentMethod === "cash" ? <Text style={styles.caption}>{livestockPreview.cashEquivalent === undefined ? "Cash equivalent: missing price" : `Cash equivalent: ${livestockPreview.cashEquivalent.toFixed(2)}`}</Text> : null}
          </>
        ) : activeCategory === "agri_other" ? (
          <>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={agriOtherValues.marketValue}
              onChangeText={(v) => setAgriOtherValues((p) => ({ ...p, marketValue: v }))}
              placeholder="Total market/sale value"
            />
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={agriOtherValues.operatingCosts}
              onChangeText={(v) => setAgriOtherValues((p) => ({ ...p, operatingCosts: v }))}
              placeholder="Operating costs/expenses (optional)"
            />
            <Text style={styles.caption}>
              Includes cultivated products for market (vegetables, ornamental/aromatic/medicinal plants, seedlings,
              animal feed, spices, coffee/tea and by-products), forest products (timber, wood extracts, mushrooms/fungi),
              fishing products, and traded animal-production activities (horses, poultry, eggs, turkeys, rabbits, beekeeping, pets).
            </Text>
            <Text style={styles.caption}>
              Rule: treated as trade assets. Zakat is on market value, not weight. If net value reaches nisab, due is
              one quarter of a tenth (2.5%).
            </Text>
          </>
        ) : activeCategory === "trade_sector" ? (
          <>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={tradeSectorValues.marketValue}
              onChangeText={(v) => setTradeSectorValues((p) => ({ ...p, marketValue: v }))}
              placeholder="Total value of trade/business assets"
            />
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={tradeSectorValues.operatingCosts}
              onChangeText={(v) => setTradeSectorValues((p) => ({ ...p, operatingCosts: v }))}
              placeholder="Due operating costs (wages, rent, taxes, etc.)"
            />
            <Text style={styles.caption}>
              Includes commercial exchange of goods (buying/selling products), assets with financial value, and lawful
              wealth that can be converted into money.
            </Text>
            <Text style={styles.caption}>
              Also includes trading in stocks (shares), trading in currencies, and income/proceeds of commercial
              companies and similar business earnings.
            </Text>
            <Text style={styles.caption}>
              Calculation: subtract due business expenses (workers&apos; wages, rent, taxes already due before zakat date,
              and similar operating costs), then pay 2.5% (one quarter of a tenth) if the remaining amount reaches nisab.
            </Text>
          </>
        ) : activeCategory === "industrial_sector" ? (
          <>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={industrialSectorValues.marketValue}
              onChangeText={(v) => setIndustrialSectorValues((p) => ({ ...p, marketValue: v }))}
              placeholder="Total value of industrial/manufacturing assets/output"
            />
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={industrialSectorValues.operatingCosts}
              onChangeText={(v) => setIndustrialSectorValues((p) => ({ ...p, operatingCosts: v }))}
              placeholder="Production costs (raw materials, manufacturing, etc.)"
            />
            <Text style={styles.caption}>
              Includes food manufacturing (food products and canned foods, canned meat/fruit, processed foods, oils/fats,
              tomato sauce, nuts, jam, pickles, jellies, juice concentrates, plant/animal oils and fats, dairy, beverages, etc.).
              Also includes construction/building materials, metal, mechanical, chemical, electronics, textile, leather,
              printing/copying, energy industries/equipment, and furniture manufacturing (all types).
            </Text>
            <Text style={styles.caption}>
              Rule: treated as commercial/productive business assets, not crop-harvest zakat. Determine industrial value,
              deduct production costs (raw materials, manufacturing expenses, and similar costs), then if net value reaches
              nisab pay 2.5% (one quarter of a tenth).
            </Text>
          </>
        ) : activeCategory === "debt" ? (
          <>
            <Text style={styles.caption}>The fatwa says debt is either:</Text>
            <Text style={styles.caption}>1) Debt owed to you (someone owes you money), or</Text>
            <Text style={styles.caption}>2) Debt you owe to others</Text>

            <Text style={styles.caption}>1) Debt owed to you (الذي لك)</Text>
            <Text style={styles.caption}>This is divided into two types:</Text>
            <Text style={styles.caption}>A) Collectible / expected debt (دين مرجو)</Text>
            <Text style={styles.caption}>This is when the person who owes you money is known to repay and financially able to pay (solvent).</Text>
            <Text style={styles.caption}>Zakat ruling:</Text>
            <Text style={styles.caption}>If repayment is near the zakat year (hawl), include it and pay zakat on it.</Text>
            <Text style={styles.caption}>If repayment is far (not expected soon), pay zakat when you actually receive it.</Text>
            <Text style={styles.caption}>Simple meaning: if the debt is realistically recoverable soon, treat it like your zakatable wealth. If not soon, then pay when it comes in.</Text>

            <Text style={styles.caption}>B) Uncollectible / doubtful debt (دين ميؤوس منه)</Text>
            <Text style={styles.caption}>This is when the debtor is always in hardship/insolvent, or known for not repaying.</Text>
            <Text style={styles.caption}>Zakat ruling: no zakat on this debt unless you actually receive it.</Text>
            <Text style={styles.caption}>Simple meaning: if the money is basically not expected, you do not pay zakat on it while it is stuck. You only deal with zakat when/if it is finally collected.</Text>

            <Text style={styles.caption}>2) Debt you owe (الدين الذي عليك)</Text>
            <Text style={styles.caption}>This is money you owe to others.</Text>
            <Text style={styles.caption}>Zakat ruling: no zakat is due on it, because it is not really your wealth.</Text>
            <Text style={styles.caption}>So you deduct it from what you have (trade money or other assets), then check what remains:</Text>
            <Text style={styles.caption}>If after deduction a nisab or more remains, you pay zakat on the remainder.</Text>
            <Text style={styles.caption}>If less than nisab remains, no zakat.</Text>
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
                <Text>Farmer harvest</Text>
              </Pressable>
              <Pressable
                style={[styles.chip, produceValues.isForTrade && styles.chipActive]}
                onPress={() =>
                  setProduceValues((p) => ({ ...p, isForTrade: true, quantityKg: "", pricePerKg: "" }))
                }
              >
                <Text>Trade stock</Text>
              </Pressable>
            </View>

            {produceValues.isForTrade ? (
              <>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={produceValues.marketValue}
                  onChangeText={(v) => setProduceValues((p) => ({ ...p, marketValue: v }))}
                  placeholder="Market value"
                />
                <Text style={styles.caption}>
                  Treated as trade goods: zakat is 2.5% if market value reaches nisab.
                </Text>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={produceValues.quantityKg}
                  onChangeText={(v) => setProduceValues((p) => ({ ...p, quantityKg: v }))}
                  placeholder="Harvest quantity (kg)"
                />
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={produceValues.pricePerKg}
                  onChangeText={(v) => setProduceValues((p) => ({ ...p, pricePerKg: v }))}
                  placeholder="Price per kg (optional)"
                />
                <View style={styles.rowWrap}>
                  <Pressable
                    style={[styles.chip, produceValues.wateringMethod === "natural" && styles.chipActive]}
                    onPress={() => setProduceValues((p) => ({ ...p, wateringMethod: "natural" }))}
                  >
                    <Text>Natural watering (10%)</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.chip, produceValues.wateringMethod === "paid_irrigation" && styles.chipActive]}
                    onPress={() => setProduceValues((p) => ({ ...p, wateringMethod: "paid_irrigation" }))}
                  >
                    <Text>Paid irrigation (5%)</Text>
                  </Pressable>
                </View>
                <Text style={styles.caption}>
                  Crop-zakat nisab is 653 kg (5 awsuq). If reached: 10% natural watering, 5% paid irrigation.
                  Add price/kg to include a cash estimate in combined total.
                </Text>
              </>
            )}
          </>
        )}
      </View>

      {validationError ? <Text style={styles.error}>{validationError}</Text> : null}
      {activeCategory !== "debt" ? (
        <TouchableOpacity style={styles.button} onPress={onCalculate}><Text style={styles.buttonText}>Calculate Zakat</Text></TouchableOpacity>
      ) : null}

      {lineItems.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          {lineItems.map((item) => (
            <View key={item.id} style={styles.lineItem}>
              <View style={styles.row}>
                <Text style={styles.bold}>{CATEGORY_LABELS[item.category]}</Text>
                <Pressable onPress={() => setLineItems((p) => p.filter((x) => x.id !== item.id))}><Text style={styles.link}>Remove</Text></Pressable>
              </View>
              {item.category === "salary" ? (
                <>
                  <Text>Mode: {item.values.calculationMode === "monthly" ? "Monthly" : "Annual"}</Text>
                  <Text>Nisab: {item.result.nisab.toFixed(2)}</Text>
                  <Text>Net Wealth: {item.result.totalWealth.toFixed(2)}</Text>
                  <Text>Zakat Due: {item.result.totalZakat.toFixed(2)}</Text>
                </>
              ) : item.category === "livestock" ? (
                <>
                  <Text>Type: {LIVESTOCK_LABELS[item.values.livestockType]}</Text>
                  <Text>Owned: {item.values.ownedCount}</Text>
                  <Text>Due animals: {item.dueText}</Text>
                  <Text>Payment: {item.values.paymentMethod}</Text>
                  <Text>Cash Included: {item.result.totalZakat.toFixed(2)}</Text>
                </>
              ) : item.category === "agri_other" ? (
                <>
                  <Text>Market value: {Number(item.values.marketValue || 0).toFixed(2)}</Text>
                  <Text>Operating costs: {Number(item.values.operatingCosts || 0).toFixed(2)}</Text>
                  <Text>Net value: {item.result.totalWealth.toFixed(2)}</Text>
                  <Text>Rule: 2.5% (one quarter of a tenth) if net value reaches nisab</Text>
                  <Text>Nisab: {item.result.nisab.toFixed(2)}</Text>
                  <Text>Zakat Due: {item.result.totalZakat.toFixed(2)}</Text>
                </>
              ) : item.category === "trade_sector" ? (
                <>
                  <Text>Trade/business assets: {Number(item.values.marketValue || 0).toFixed(2)}</Text>
                  <Text>Due operating costs: {Number(item.values.operatingCosts || 0).toFixed(2)}</Text>
                  <Text>Net zakatable amount: {item.result.totalWealth.toFixed(2)}</Text>
                  <Text>Rule: 2.5% (one quarter of a tenth) if net amount reaches nisab</Text>
                  <Text>Nisab: {item.result.nisab.toFixed(2)}</Text>
                  <Text>Zakat Due: {item.result.totalZakat.toFixed(2)}</Text>
                </>
              ) : item.category === "industrial_sector" ? (
                <>
                  <Text>Industrial assets/output value: {Number(item.values.marketValue || 0).toFixed(2)}</Text>
                  <Text>Production costs: {Number(item.values.operatingCosts || 0).toFixed(2)}</Text>
                  <Text>Net zakatable amount: {item.result.totalWealth.toFixed(2)}</Text>
                  <Text>Rule: 2.5% after deducting production costs if net amount reaches nisab</Text>
                  <Text>Nisab: {item.result.nisab.toFixed(2)}</Text>
                  <Text>Zakat Due: {item.result.totalZakat.toFixed(2)}</Text>
                </>
              ) : (
                <>
                  <Text>Mode: {item.values.isForTrade ? "Trade goods" : "Agricultural harvest"}</Text>
                  {item.values.isForTrade ? (
                    <>
                      <Text>Market value: {Number(item.values.marketValue || 0).toFixed(2)}</Text>
                      <Text>Rule: 2.5% as trade goods</Text>
                      <Text>Nisab: {item.result.nisab.toFixed(2)}</Text>
                      <Text>Zakat Due: {item.result.totalZakat.toFixed(2)}</Text>
                    </>
                  ) : (
                    <>
                      <Text>Harvest quantity (kg): {Number(item.values.quantityKg || 0).toFixed(2)}</Text>
                      <Text>Rule: {item.values.wateringMethod === "natural" ? "10% (natural watering)" : "5% (paid irrigation)"}</Text>
                      <Text>Nisab: {item.result.nisab.toFixed(2)} kg</Text>
                      <Text>Zakat Due (produce): {(item.dueQuantityKg ?? 0).toFixed(2)} kg</Text>
                      <Text>Price/kg: {parseOptionalPositive(item.values.pricePerKg)?.toFixed(2) ?? "Not set"}</Text>
                      <Text>Cash Equivalent Included: {(item.cashEquivalent ?? 0).toFixed(2)}</Text>
                    </>
                  )}
                </>
              )}
            </View>
          ))}
          <Text style={styles.bold}>Combined Total Zakat Due: {combinedTotal.toFixed(2)}</Text>
          <TouchableOpacity style={styles.saveHistoryButton} onPress={onSaveToHistory}>
            <Text style={styles.buttonText}>Save to History</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {showSavedToast ? <View style={styles.toast}><Text style={styles.toastText}>Nisab settings saved</Text></View> : null}
      {showHistorySavedToast ? <View style={styles.toast}><Text style={styles.toastText}>Saved to local history</Text></View> : null}

      <Modal transparent animationType="fade" visible={isCategoryPickerVisible} onRequestClose={() => setIsCategoryPickerVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setIsCategoryPickerVisible(false)}>
          <Pressable style={styles.modalCard}>
            {(["salary", "livestock", "agri_other", "trade_sector", "industrial_sector", "produce", "debt"] as CategoryId[]).map((category) => (
              <Pressable key={category} style={styles.modalOption} onPress={() => {
                setActiveCategory(category);
                setValidationError(null);
                if (category === "salary") {
                  setSalaryValues({ monthlyIncome: "", livingExpense: "", calculationMode: "annual" });
                }
                if (category === "livestock") reset(defaultLivestockForm);
                if (category === "agri_other") setAgriOtherValues(defaultAgriOtherValues);
                if (category === "trade_sector") setTradeSectorValues(defaultTradeSectorValues);
                if (category === "industrial_sector") setIndustrialSectorValues(defaultIndustrialSectorValues);
                if (category === "produce") setProduceValues(defaultProduceValues);
                setIsCategoryPickerVisible(false);
              }}>
                <Text>{CATEGORY_LABELS[category]}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#ececec" },
  sectionTitle: { fontWeight: "700", marginBottom: 8, fontSize: 16 },
  selector: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 12, flexDirection: "row", justifyContent: "space-between" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: "#fff" },
  button: { backgroundColor: "#007AFF", borderRadius: 10, alignItems: "center", paddingVertical: 12, marginBottom: 12 },
  buttonText: { color: "#fff", fontWeight: "700" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  chip: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, marginRight: 8, marginBottom: 8, backgroundColor: "#f8f8f8" },
  chipActive: { backgroundColor: "#EBF4FF", borderColor: "#9CC7FF" },
  link: { color: "#007AFF", fontWeight: "600" },
  caption: { color: "#666", fontSize: 12, marginBottom: 8 },
  error: { color: "#C30000", marginBottom: 8, fontSize: 12 },
  lineItem: { borderWidth: 1, borderColor: "#ececec", borderRadius: 8, padding: 10, marginBottom: 8 },
  bold: { fontWeight: "700" },
  saveHistoryButton: { marginTop: 10, backgroundColor: "#0a7d32", borderRadius: 10, alignItems: "center", paddingVertical: 12 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#fff", borderRadius: 12, padding: 12 },
  modalOption: { borderWidth: 1, borderColor: "#ececec", borderRadius: 8, padding: 12, marginBottom: 8 },
  toast: { position: "absolute", bottom: 18, left: 16, right: 16, backgroundColor: "#1f1f1f", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  toastText: { color: "#fff", fontWeight: "600" },
});

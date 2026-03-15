import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
  I18nManager,
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
import type {
  DetailedHistoryLineItem,
  DetailedHistoryScheduledReminder,
  HistoryEntry,
} from "../../../features/history/types";
import {
  scheduleHawlDueReminderNotification,
  selectEarliestFutureHawlReminderCandidate,
} from "../../../features/reminders/scheduling";
import { buildTotalDisplay, type NonCashDueSummary } from "../../../features/history/totalDisplay";
import {
  calculateDueNowMoneyBase,
  calculateIndependentCashDue,
  hasEligibleDueNowMoneyPool,
  resolveDetailedLineItemMeta,
  splitHawlAwareLineItems,
  shouldShowBelowNisabAfterDebt,
  type DetailedLineItemForGrouping,
  type DetailedLineItemMeta,
} from "../../../lib/zakat-calculation/detailedAggregation";
import {
  isValidIsoDate,
  resolveCalculationDate,
  type DetailedCalculationContext,
} from "../../../lib/zakat-calculation/detailedCalculationContext";
import {
  applyDebtAdjustment,
  calcLivestockZakat,
  calculateDebtAdjustment,
  calculateDebtZakat,
  calculateProduceZakat,
  calculateSalaryZakat,
  formatDueItems,
  getDueItemLabelKey,
  resolveEligibilityDueStatus,
  type Camel121Choice,
  type DueItem,
  type LivestockType,
  type ProduceWateringMethod,
  type ZakatCalculationResult,
} from "../../../lib/zakat-calculation";
import { formatMoney } from "../../../lib/currency";
import { calculateNisab } from "../../../lib/zakat-calculation/nisab";
import { useAppPreferencesStore, type SupportedCurrency } from "../../../store/appPreferencesStore";
import {
  useDetailedHawlSetupDraftStore,
  type HawlTrackingMode,
} from "../../../store/detailedHawlSetupDraftStore";
import { useNisabSettingsStore } from "../../../store/nisabSettingsStore";

type CategoryId = "salary" | "livestock" | "produce" | "agri_other" | "trade_sector" | "industrial_sector" | "debt";
type HawlCategoryId = Exclude<CategoryId, "produce" | "debt">;
type CategoryIconName = React.ComponentProps<typeof Ionicons>["name"];
type StepId = "pick" | "form";
type SalaryCalculationMode = "annual" | "monthly";
type SalaryValues = { monthlyIncome: string; livingExpense: string; calculationMode: SalaryCalculationMode };
type AgriOtherValues = { marketValue: string; operatingCosts: string };
type TradeSectorValues = { marketValue: string; operatingCosts: string };
type IndustrialSectorValues = { marketValue: string; operatingCosts: string };
type DebtValues = {
  collectibleReceivablesCurrent: string;
  doubtfulReceivables: string;
  debtsYouOweDueNow: string;
};
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
type SalaryLineItem = {
  id: string;
  category: "salary";
  values: SalaryValues;
  result: ZakatCalculationResult;
  meta: DetailedLineItemMeta;
};
type AgriOtherLineItem = {
  id: string;
  category: "agri_other";
  values: AgriOtherValues;
  result: ZakatCalculationResult;
  meta: DetailedLineItemMeta;
};
type TradeSectorLineItem = {
  id: string;
  category: "trade_sector";
  values: TradeSectorValues;
  result: ZakatCalculationResult;
  meta: DetailedLineItemMeta;
};
type IndustrialSectorLineItem = {
  id: string;
  category: "industrial_sector";
  values: IndustrialSectorValues;
  result: ZakatCalculationResult;
  meta: DetailedLineItemMeta;
};
type ProduceLineItem = {
  id: string;
  category: "produce";
  values: ProduceValues;
  result: ZakatCalculationResult;
  meta: DetailedLineItemMeta;
  dueQuantityKg?: number;
  cashEquivalent?: number;
};
type LivestockLineItem = {
  id: string;
  category: "livestock";
  values: LivestockValues;
  result: ZakatCalculationResult;
  meta: DetailedLineItemMeta;
  dueItems: DueItem[];
  dueText: string;
};
type DebtLineItem = {
  id: string;
  category: "debt";
  values: DebtValues;
  result: ZakatCalculationResult;
  meta: DetailedLineItemMeta;
};
type LineItem =
  | SalaryLineItem
  | LivestockLineItem
  | ProduceLineItem
  | AgriOtherLineItem
  | TradeSectorLineItem
  | IndustrialSectorLineItem
  | DebtLineItem;

const CATEGORY_ORDER: CategoryId[] = [
  "salary",
  "livestock",
  "produce",
  "agri_other",
  "trade_sector",
  "industrial_sector",
  "debt",
];
const CATEGORY_ICONS: Record<CategoryId, CategoryIconName> = {
  salary: "briefcase-outline",
  livestock: "paw-outline",
  produce: "leaf-outline",
  agri_other: "nutrition-outline",
  trade_sector: "storefront-outline",
  industrial_sector: "business-outline",
  debt: "receipt-outline",
};
const HAWL_REQUIRED_CATEGORIES: CategoryId[] = [
  "salary",
  "livestock",
  "agri_other",
  "trade_sector",
  "industrial_sector",
];

type HawlTimingDraft = {
  useSessionDate: boolean;
  customDate: string;
};

function buildDefaultHawlTimingDrafts(): Record<HawlCategoryId, HawlTimingDraft> {
  return {
    salary: { useSessionDate: true, customDate: "" },
    livestock: { useSessionDate: true, customDate: "" },
    agri_other: { useSessionDate: true, customDate: "" },
    trade_sector: { useSessionDate: true, customDate: "" },
    industrial_sector: { useSessionDate: true, customDate: "" },
  };
}

function isHawlRequiredCategory(category: CategoryId): boolean {
  return HAWL_REQUIRED_CATEGORIES.includes(category);
}
function buildLivestockSchema() {
  return z
    .object({
      livestockType: z.enum(["camels", "cattle", "sheep_goats"]),
      ownedCount: z
        .string()
        .trim()
        .refine(
          (v) => /^\d+$/.test(v),
          "detailedCalculator.validation.ownedCountInteger",
        ),
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
          message: "detailedCalculator.validation.cashEstimatePositive",
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
const defaultDebtValues: DebtValues = {
  collectibleReceivablesCurrent: "",
  doubtfulReceivables: "",
  debtsYouOweDueNow: "",
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
function toSingleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return toSingleParam(value[0]);
  }
  return typeof value === "string" ? value : undefined;
}
function parseBooleanFlag(value: string | undefined): boolean | undefined {
  if (value === "1") return true;
  if (value === "0") return false;
  return undefined;
}
function normalizeIsoDate(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  if (!normalized || !isValidIsoDate(normalized)) return undefined;
  return normalized;
}
function toHawlTrackingMode(value: string | undefined): HawlTrackingMode | undefined {
  if (
    value === "yearly_zakat_date" ||
    value === "nisab_reached_date" ||
    value === "estimated"
  ) {
    return value;
  }
  return undefined;
}
function formatIsoDateForDisplay(value: string, locale?: string): string {
  if (!isValidIsoDate(value)) return value;
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(locale ?? "en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(year, month - 1, day));
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

function buildHistoryMetaDetails(
  meta: DetailedLineItemMeta,
  labels: {
    detailDueStatus: string;
    dueStatusDueNow: string;
    dueStatusNotDueYet: string;
    dueStatusUnknown: string;
    detailHawlDueDate: string;
    detailEventDate: string;
  },
): string[] {
  const dueStatus = resolveEligibilityDueStatus(meta);
  const dueStatusLabel =
    dueStatus === "due_now"
      ? labels.dueStatusDueNow
      : dueStatus === "unknown"
        ? labels.dueStatusUnknown
        : labels.dueStatusNotDueYet;
  const details = [
    `${labels.detailDueStatus}: ${dueStatusLabel}`,
  ];
  if (isValidIsoDate(meta.hawlDueDate)) {
    details.push(`${labels.detailHawlDueDate}: ${meta.hawlDueDate}`);
  }
  if (isValidIsoDate(meta.eventDate)) {
    details.push(`${labels.detailEventDate}: ${meta.eventDate}`);
  }
  return details;
}

function buildDetailedHistoryLineItem(
  item: LineItem,
  currency: SupportedCurrency,
  labels: {
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
    detailDebtCollectible: string;
    detailDebtDoubtful: string;
    detailDebtOwedNow: string;
    detailDebtNetImpact: string;
    detailDueStatus: string;
    detailHawlDueDate: string;
    detailEventDate: string;
    dueStatusDueNow: string;
    dueStatusNotDueYet: string;
    dueStatusUnknown: string;
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
      meta: item.meta,
      totalZakat: item.result.totalZakat,
      totalWealth: item.result.totalWealth,
      details: [
        `${labels.detailMode}: ${item.values.calculationMode === "monthly" ? labels.modeMonthly : labels.modeAnnual}`,
        `${labels.detailNisab}: ${formatMoney(item.result.nisab, currency)}`,
        ...buildHistoryMetaDetails(item.meta, labels),
      ],
    };
  }

  if (item.category === "livestock") {
    return {
      id: item.id,
      category: item.category,
      meta: item.meta,
      totalZakat: item.result.totalZakat,
      totalWealth: item.result.totalWealth,
      details: [
        `${labels.detailType}: ${labels.livestockTypeLabel(item.values.livestockType)}`,
        `${labels.detailOwned}: ${item.values.ownedCount}`,
        `${labels.detailDue}: ${labels.dueText(item.dueItems)}`,
        `${labels.detailCashEstimate}: ${formatMoney(item.values.cashEstimate ?? 0, currency)}`,
        ...buildHistoryMetaDetails(item.meta, labels),
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
      ...buildHistoryMetaDetails(item.meta, labels),
    ].filter((line): line is string => Boolean(line));
    return {
      id: item.id,
      category: item.category,
      meta: item.meta,
      totalZakat: item.result.totalZakat,
      totalWealth: item.result.totalWealth,
      details,
    };
  }

  if (item.category === "debt") {
    const adjustment = calculateDebtAdjustment({
      debt: {
        collectibleReceivablesCurrent: toNonNegative(item.values.collectibleReceivablesCurrent),
        doubtfulReceivables: toNonNegative(item.values.doubtfulReceivables),
        debtsYouOweDueNow: toNonNegative(item.values.debtsYouOweDueNow),
      },
    });
    return {
      id: item.id,
      category: item.category,
      meta: item.meta,
      totalZakat: item.result.totalZakat,
      totalWealth: item.result.totalWealth,
      details: [
        `${labels.detailDebtCollectible}: ${formatMoney(adjustment.collectibleReceivablesCurrent, currency)}`,
        `${labels.detailDebtDoubtful}: ${formatMoney(adjustment.doubtfulReceivables, currency)}`,
        `${labels.detailDebtOwedNow}: ${formatMoney(-Math.abs(adjustment.debtsYouOweDueNow), currency)}`,
        `${labels.detailDebtNetImpact}: ${formatMoney(adjustment.netAdjustment, currency)}`,
      ],
    };
  }

  return {
    id: item.id,
    category: item.category,
    meta: item.meta,
    totalZakat: item.result.totalZakat,
    totalWealth: item.result.totalWealth,
    details: [
      `${labels.detailNisab}: ${formatMoney(item.result.nisab, currency)}`,
      ...buildHistoryMetaDetails(item.meta, labels),
    ],
  };
}

export default function DetailedCalculateScreen() {
  const router = useRouter();
  const {
    openCategory: openCategoryParam,
    calculationDate: calculationDateParam,
    hawlTrackingMode: hawlTrackingModeParam,
    hawlReferenceDate: hawlReferenceDateParam,
    hawlUseToday: hawlUseTodayParam,
    hawlSaveAsDefault: hawlSaveAsDefaultParam,
  } = useLocalSearchParams<{
    openCategory?: string | string[];
    calculationDate?: string | string[];
    hawlTrackingMode?: string | string[];
    hawlReferenceDate?: string | string[];
    hawlUseToday?: string | string[];
    hawlSaveAsDefault?: string | string[];
  }>();
  const { t, i18n } = useTranslation("common");
  const currency = useAppPreferencesStore((s) => s.currency);
  const zakatReminderEnabled = useAppPreferencesStore((s) => s.zakatReminderEnabled);
  const hawlDraft = useDetailedHawlSetupDraftStore((s) => s.draft);
  const setDetailedHawlDraft = useDetailedHawlSetupDraftStore((s) => s.setDraft);
  const livestockSchema = useMemo(() => buildLivestockSchema(), []);
  const isRTL = I18nManager.isRTL;
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
  const [debtValues, setDebtValues] = useState<DebtValues>(defaultDebtValues);
  const [produceValues, setProduceValues] = useState<ProduceValues>(defaultProduceValues);
  const [hawlTimingDrafts, setHawlTimingDrafts] = useState<Record<HawlCategoryId, HawlTimingDraft>>(
    () => buildDefaultHawlTimingDrafts(),
  );
  const [produceEventDate, setProduceEventDate] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [validationErrorKey, setValidationErrorKey] = useState<string | null>(null);
  const [isHowCalculatedOpen, setIsHowCalculatedOpen] = useState(false);
  const [showHistorySavedToast, setShowHistorySavedToast] = useState(false);
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const isSavingHistoryRef = useRef(false);
  const handledOpenCategoryParam = useRef<string | null>(null);
  const [calculationContext] = useState<DetailedCalculationContext>(() => ({
    calculationDate: resolveCalculationDate({
      routeCalculationDate: toSingleParam(calculationDateParam),
      draftCalculationDate: hawlDraft?.calculationDate,
      draftReferenceDate: hawlDraft?.referenceDate,
    }),
  }));
  const resolveLineItemMeta = (
    category: CategoryId,
    options?: {
      hawlStartDate?: string;
      eventDate?: string;
    },
  ): DetailedLineItemMeta =>
    resolveDetailedLineItemMeta(category, calculationContext, {
      hawlStartDate: normalizeIsoDate(options?.hawlStartDate),
      eventDate: normalizeIsoDate(options?.eventDate),
    });

  const categoryLabel = (category: CategoryId) => t(`detailedCalculator.categories.${category}.title`);
  const categoryDescription = (category: CategoryId) =>
    t(`detailedCalculator.categories.${category}.description`);
  const debtImpactBadgeLabel = (category: CategoryId) => {
    if (category === "debt") return null;
    const meta = resolveLineItemMeta(category, {
      hawlStartDate: normalizeIsoDate(sessionHawlStartDate),
    });
    return meta.debtAdjustable
      ? t("detailedCalculator.summary.debtImpactAppliedBadge")
      : t("detailedCalculator.summary.debtImpactNotAppliedBadge");
  };
  const livestockTypeLabel = (type: LivestockType) => t(`detailedCalculator.livestock.types.${type}`);
  const dueText = (items: DueItem[]) => formatDueItemsLocalized(items, t);
  const hawlTrackingMode = useMemo(() => {
    const fromParams = toHawlTrackingMode(toSingleParam(hawlTrackingModeParam));
    if (fromParams) return fromParams;
    return hawlDraft?.trackingMode ?? undefined;
  }, [hawlDraft?.trackingMode, hawlTrackingModeParam]);
  const hawlReferenceDate = useMemo(() => {
    const fromParams = toSingleParam(hawlReferenceDateParam);
    if (isValidIsoDate(fromParams)) return fromParams;
    return isValidIsoDate(hawlDraft?.referenceDate) ? hawlDraft.referenceDate : undefined;
  }, [hawlDraft?.referenceDate, hawlReferenceDateParam]);
  const hawlUseToday = useMemo(() => {
    const fromParams = parseBooleanFlag(toSingleParam(hawlUseTodayParam));
    return fromParams ?? hawlDraft?.useToday;
  }, [hawlDraft?.useToday, hawlUseTodayParam]);
  const hawlModeLabel = useMemo(() => {
    if (hawlTrackingMode === "yearly_zakat_date") {
      return t("detailedSetup.form.options.yearly");
    }
    if (hawlTrackingMode === "nisab_reached_date") {
      return t("detailedSetup.form.options.nisab");
    }
    if (hawlTrackingMode === "estimated") {
      return t("detailedSetup.form.options.estimated");
    }
    return "";
  }, [hawlTrackingMode, t]);
  const hawlSummaryText = useMemo(() => {
    if (!hawlTrackingMode) {
      return t("detailedCalculator.hero.hawlSummaryNotSet");
    }
    if (hawlTrackingMode === "estimated" && hawlUseToday === true) {
      return t("detailedCalculator.hero.hawlSummaryEstimatedToday", {
        mode: hawlModeLabel,
      });
    }
    if (hawlReferenceDate) {
      return t("detailedCalculator.hero.hawlSummaryWithDate", {
        mode: hawlModeLabel,
        date: formatIsoDateForDisplay(
          hawlReferenceDate,
          i18n?.resolvedLanguage ?? i18n?.language,
        ),
      });
    }
    return t("detailedCalculator.hero.hawlSummaryModeOnly", {
      mode: hawlModeLabel,
    });
  }, [
    hawlModeLabel,
    hawlReferenceDate,
    hawlTrackingMode,
    hawlUseToday,
    i18n?.language,
    i18n?.resolvedLanguage,
    t,
  ]);
  const sessionHawlStartDate = useMemo(() => {
    if (isValidIsoDate(hawlReferenceDate)) {
      return hawlReferenceDate;
    }
    if (hawlTrackingMode === "estimated" && hawlUseToday === true) {
      return calculationContext.calculationDate;
    }
    return undefined;
  }, [calculationContext.calculationDate, hawlReferenceDate, hawlTrackingMode, hawlUseToday]);
  const hawlReferenceDateDisplay = useMemo(() => {
    if (!sessionHawlStartDate) {
      return t("detailedCalculator.notSet");
    }
    return formatIsoDateForDisplay(
      sessionHawlStartDate,
      i18n?.resolvedLanguage ?? i18n?.language,
    );
  }, [i18n?.language, i18n?.resolvedLanguage, sessionHawlStartDate, t]);
  const activeHawlTimingDraft = useMemo(() => {
    if (!isHawlRequiredCategory(activeCategory)) return null;
    return hawlTimingDrafts[activeCategory as HawlCategoryId];
  }, [activeCategory, hawlTimingDrafts]);
  const resolvedCurrentHawlStartDate = useMemo(() => {
    if (!isHawlRequiredCategory(activeCategory)) return undefined;
    if (activeHawlTimingDraft?.useSessionDate ?? true) {
      return normalizeIsoDate(sessionHawlStartDate);
    }
    return normalizeIsoDate(activeHawlTimingDraft?.customDate);
  }, [activeCategory, activeHawlTimingDraft, sessionHawlStartDate]);
  const resolvedCurrentProduceEventDate = useMemo(
    () => normalizeIsoDate(produceEventDate),
    [produceEventDate],
  );
  const activeTimingMeta = useMemo(
    () =>
      resolveLineItemMeta(activeCategory, {
        hawlStartDate: resolvedCurrentHawlStartDate,
        eventDate: activeCategory === "produce" ? resolvedCurrentProduceEventDate : undefined,
      }),
    [activeCategory, resolvedCurrentHawlStartDate, resolvedCurrentProduceEventDate],
  );
  const getDueStatusLabel = (meta: DetailedLineItemMeta) => {
    const dueStatus = resolveEligibilityDueStatus(meta);
    if (dueStatus === "due_now") {
      return t("detailedCalculator.summary.dueNowStatus");
    }
    if (dueStatus === "unknown") {
      return t("detailedCalculator.summary.dueStatusUnknown");
    }
    return t("detailedCalculator.summary.notDueYetStatus");
  };
  const getDueStatusTone = (meta: DetailedLineItemMeta): "due" | "unknown" | "not_due" => {
    const dueStatus = resolveEligibilityDueStatus(meta);
    if (dueStatus === "due_now") return "due";
    if (dueStatus === "unknown") return "unknown";
    return "not_due";
  };
  const getHawlStartContextLabel = (meta: DetailedLineItemMeta) =>
    t("detailedCalculator.summary.hawlStartDateValue", {
      value: isValidIsoDate(meta.hawlStartDate)
        ? formatIsoDateForDisplay(meta.hawlStartDate, i18n?.resolvedLanguage ?? i18n?.language)
        : t("detailedCalculator.notSet"),
    });
  const getDueDateContextLabel = (meta: DetailedLineItemMeta) => {
    if (isValidIsoDate(meta.hawlDueDate)) {
      return t("detailedCalculator.summary.hawlDueDateValue", {
        value: formatIsoDateForDisplay(meta.hawlDueDate, i18n?.resolvedLanguage ?? i18n?.language),
      });
    }
    if (isValidIsoDate(meta.eventDate)) {
      return t("detailedCalculator.summary.eventDateValue", {
        value: formatIsoDateForDisplay(meta.eventDate, i18n?.resolvedLanguage ?? i18n?.language),
      });
    }
    return null;
  };

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
                  : item.category === "debt"
                    ? {
                        ...item,
                        result: calculateDebtZakat({
                          nisabMethod,
                          silverPricePerGram,
                          goldPricePerGram,
                          nisabOverride: nisabOverride > 0 ? nisabOverride : undefined,
                          debt: {
                            collectibleReceivablesCurrent: toNonNegative(item.values.collectibleReceivablesCurrent),
                            doubtfulReceivables: toNonNegative(item.values.doubtfulReceivables),
                            debtsYouOweDueNow: toNonNegative(item.values.debtsYouOweDueNow),
                          },
                        }),
                      }
            : item,
      ),
    );
  }, [nisabMethod, silverPricePerGram, goldPricePerGram, nisabOverride, lineItems.length]);

  const monetaryNisab = useMemo(
    () =>
      calculateNisab({
        nisabMethod,
        silverPricePerGram,
        goldPricePerGram,
        nisabOverride: nisabOverride > 0 ? nisabOverride : undefined,
      }),
    [goldPricePerGram, nisabMethod, nisabOverride, silverPricePerGram],
  );
  const debtLineItem = useMemo(
    () => lineItems.find((item): item is DebtLineItem => item.category === "debt"),
    [lineItems],
  );
  const hasDebtLineItem = useMemo(() => Boolean(debtLineItem), [debtLineItem]);
  const debtAdjustment = useMemo(
    () =>
      calculateDebtAdjustment({
        debt: {
          collectibleReceivablesCurrent: toNonNegative(debtLineItem?.values.collectibleReceivablesCurrent ?? ""),
          doubtfulReceivables: toNonNegative(debtLineItem?.values.doubtfulReceivables ?? ""),
          debtsYouOweDueNow: toNonNegative(debtLineItem?.values.debtsYouOweDueNow ?? ""),
        },
      }),
    [debtLineItem],
  );
  const hawlAwareGroups = useMemo(
    () => splitHawlAwareLineItems(lineItems as DetailedLineItemForGrouping[]),
    [lineItems],
  );
  const dueNowMoneyLineItems = useMemo(
    () => lineItems.filter((item) => item.meta.dueNow && item.meta.debtAdjustable),
    [lineItems],
  );
  const dueNowSpecialLineItems = useMemo(
    () =>
      lineItems.filter(
        (item) => item.meta.dueNow && !item.meta.debtAdjustable && item.category !== "debt",
      ),
    [lineItems],
  );
  const notDueLineItems = useMemo(
    () => lineItems.filter((item) => item.meta.dueNow === false),
    [lineItems],
  );
  const dueNowMoneyBase = useMemo(
    () => calculateDueNowMoneyBase(dueNowMoneyLineItems),
    [dueNowMoneyLineItems],
  );
  const cashBaseBeforeDebt = dueNowMoneyBase;
  const hasEligibleDueNowMoney = useMemo(
    () => hasEligibleDueNowMoneyPool(dueNowMoneyLineItems),
    [dueNowMoneyLineItems],
  );
  const finalZakatableBase = useMemo(
    () =>
      hasEligibleDueNowMoney
        ? applyDebtAdjustment(cashBaseBeforeDebt, debtAdjustment.netAdjustment)
        : cashBaseBeforeDebt,
    [cashBaseBeforeDebt, debtAdjustment.netAdjustment, hasEligibleDueNowMoney],
  );
  const finalCashZakat = useMemo(
    () => (finalZakatableBase >= monetaryNisab ? finalZakatableBase * 0.025 : 0),
    [finalZakatableBase, monetaryNisab],
  );
  const independentNonDebtAdjustableCashDue = useMemo(
    () => calculateIndependentCashDue(hawlAwareGroups.specialDueNowItems),
    [hawlAwareGroups.specialDueNowItems],
  );
  const combinedTotal = useMemo(
    () => Math.max(0, finalCashZakat) + Math.max(0, independentNonDebtAdjustableCashDue),
    [finalCashZakat, independentNonDebtAdjustableCashDue],
  );
  const isBelowNisabAfterDebt = useMemo(
    () =>
      shouldShowBelowNisabAfterDebt({
        hasDebtLineItem,
        cashBaseBeforeDebt,
        finalZakatableBase,
        monetaryNisab,
        debtNetImpact: debtAdjustment.netAdjustment,
      }),
    [cashBaseBeforeDebt, debtAdjustment.netAdjustment, finalZakatableBase, hasDebtLineItem, monetaryNisab],
  );
  const addedCategoryCount = useMemo(() => new Set(lineItems.map((item) => item.category)).size, [lineItems]);
  const livestockInKindBreakdown = useMemo(
    () =>
      dueNowSpecialLineItems
        .filter((item): item is LivestockLineItem => item.category === "livestock")
        .filter((item) => item.dueItems.length > 0)
        .map((item) => `${livestockTypeLabel(item.values.livestockType)}: ${dueText(item.dueItems)}`),
    [dueNowSpecialLineItems, t],
  );
  const produceDueKgTotal = useMemo(
    () =>
      dueNowSpecialLineItems
        .filter((item): item is ProduceLineItem => item.category === "produce")
        .filter((item) => !item.values.isForTrade)
        .reduce((sum, item) => sum + (item.dueQuantityKg ?? 0), 0),
    [dueNowSpecialLineItems],
  );
  const notDueTotalWealth = useMemo(
    () => notDueLineItems.reduce((sum, item) => sum + Math.max(0, item.result.totalWealth), 0),
    [notDueLineItems],
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
    if (activeCategory === "debt") {
      const adjustment = calculateDebtAdjustment({
        debt: {
          collectibleReceivablesCurrent: toNonNegative(debtValues.collectibleReceivablesCurrent),
          doubtfulReceivables: toNonNegative(debtValues.doubtfulReceivables),
          debtsYouOweDueNow: toNonNegative(debtValues.debtsYouOweDueNow),
        },
      });
      const previewFinalBase = hasEligibleDueNowMoney
        ? applyDebtAdjustment(cashBaseBeforeDebt, adjustment.netAdjustment)
        : cashBaseBeforeDebt;
      const previewFinalZakat = previewFinalBase >= monetaryNisab ? previewFinalBase * 0.025 : 0;
      return {
        netLabel: t("detailedCalculator.preview.debtNetImpact"),
        netValue: formatMoney(adjustment.netAdjustment, currency),
        dueLabel: t("detailedCalculator.preview.finalZakatableBase"),
        dueValue: formatMoney(previewFinalBase, currency),
        extraLabel: t("detailedCalculator.preview.zakatDue"),
        extraValue: formatMoney(previewFinalZakat, currency),
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
    debtValues,
    cashBaseBeforeDebt,
    hasEligibleDueNowMoney,
    monetaryNisab,
    produceValues,
    salaryValues,
    silverPricePerGram,
    tradeSectorValues,
  ]);

  const openCategory = (category: CategoryId) => {
    setValidationErrorKey(null);
    setIsHowCalculatedOpen(false);
    setActiveCategory(category);
    if (category === "salary") {
      setSalaryValues({ monthlyIncome: "", livingExpense: "", calculationMode: "annual" });
    }
    if (category === "livestock") reset(defaultLivestockForm);
    if (category === "agri_other") setAgriOtherValues(defaultAgriOtherValues);
    if (category === "trade_sector") setTradeSectorValues(defaultTradeSectorValues);
    if (category === "industrial_sector") setIndustrialSectorValues(defaultIndustrialSectorValues);
    if (category === "debt") {
      const existingDebt = lineItems.find((item): item is DebtLineItem => item.category === "debt");
      setDebtValues(existingDebt ? { ...existingDebt.values } : defaultDebtValues);
    }
    if (category === "produce") setProduceValues(defaultProduceValues);
    setStep("form");
  };

  const resolveSelectedHawlStartDate = (category: CategoryId): string | undefined => {
    if (!isHawlRequiredCategory(category)) return undefined;
    const timingDraft = hawlTimingDrafts[category as HawlCategoryId];
    if (timingDraft?.useSessionDate ?? true) {
      return normalizeIsoDate(sessionHawlStartDate);
    }
    return normalizeIsoDate(timingDraft?.customDate);
  };

  const validateTimingInputs = (category: CategoryId): boolean => {
    if (isHawlRequiredCategory(category)) {
      const timingDraft = hawlTimingDrafts[category as HawlCategoryId];
      if (timingDraft?.useSessionDate ?? true) {
        return true;
      }
      if (!normalizeIsoDate(timingDraft?.customDate)) {
        setValidationErrorKey("detailedCalculator.validation.hawlDateRequired");
        return false;
      }
      return true;
    }

    if (category === "produce") {
      if (!produceEventDate.trim()) {
        setValidationErrorKey("detailedCalculator.validation.eventDateRequired");
        return false;
      }
      if (!normalizeIsoDate(produceEventDate)) {
        setValidationErrorKey("detailedCalculator.validation.eventDateInvalid");
        return false;
      }
    }

    return true;
  };

  useEffect(() => {
    const trackingModeParam = toSingleParam(hawlTrackingModeParam);
    if (!trackingModeParam) return;
    if (
      trackingModeParam !== "yearly_zakat_date" &&
      trackingModeParam !== "nisab_reached_date" &&
      trackingModeParam !== "estimated"
    ) {
      return;
    }
    const referenceDateParam = toSingleParam(hawlReferenceDateParam);
    const normalizedReferenceDate =
      isValidIsoDate(referenceDateParam)
        ? referenceDateParam
        : undefined;
    const calculationDateValue = toSingleParam(calculationDateParam);
    const normalizedCalculationDate = resolveCalculationDate({
      routeCalculationDate: calculationDateValue,
      draftCalculationDate: undefined,
      draftReferenceDate: normalizedReferenceDate,
    });

    setDetailedHawlDraft({
      trackingMode: trackingModeParam as HawlTrackingMode,
      referenceDate: normalizedReferenceDate,
      calculationDate: normalizedCalculationDate,
      useToday: parseBooleanFlag(toSingleParam(hawlUseTodayParam)),
      saveAsDefault: parseBooleanFlag(toSingleParam(hawlSaveAsDefaultParam)),
    });
  }, [
    calculationDateParam,
    hawlReferenceDateParam,
    hawlSaveAsDefaultParam,
    hawlTrackingModeParam,
    hawlUseTodayParam,
    setDetailedHawlDraft,
  ]);

  useEffect(() => {
    const requestedCategory = Array.isArray(openCategoryParam) ? openCategoryParam[0] : openCategoryParam;
    if (!requestedCategory) return;
    if (handledOpenCategoryParam.current === requestedCategory) return;
    if (!CATEGORY_ORDER.includes(requestedCategory as CategoryId)) {
      handledOpenCategoryParam.current = requestedCategory;
      return;
    }
    handledOpenCategoryParam.current = requestedCategory;
    openCategory(requestedCategory as CategoryId);
  }, [openCategoryParam, openCategory]);

  const onSaveToHistory = async () => {
    if (lineItems.length === 0 || isSavingHistoryRef.current) {
      return;
    }
    isSavingHistoryRef.current = true;
    setIsSavingHistory(true);

    try {
      const now = new Date().toISOString();
      const historyEntryId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const categoriesUsed = Array.from(new Set(lineItems.map((item) => item.category)));
      const reminderCandidate = selectEarliestFutureHawlReminderCandidate(
        lineItems.map((item) => ({
          id: item.id,
          category: item.category,
          meta: item.meta,
        })),
      );
      let scheduledReminder: DetailedHistoryScheduledReminder | undefined;

      if (reminderCandidate) {
        const baseReminder: Omit<
          DetailedHistoryScheduledReminder,
          "status" | "enabled" | "scheduledNotificationId"
        > = {
          id: buildId(),
          historyEntryId,
          lineItemId: reminderCandidate.lineItemId,
          type: "hawl_due",
          reminderDate: reminderCandidate.reminderDate,
        };
        if (!zakatReminderEnabled) {
          scheduledReminder = {
            ...baseReminder,
            enabled: false,
            status: "disabled_by_preference",
          };
        } else {
          const reminderDateDisplay = formatIsoDateForDisplay(
            reminderCandidate.reminderDate,
            i18n?.resolvedLanguage ?? i18n?.language,
          );
          const schedulingResult = await scheduleHawlDueReminderNotification({
            reminderDate: reminderCandidate.reminderDate,
            title: t("history.reminderNotification.title"),
            body: t("history.reminderNotification.body", { date: reminderDateDisplay }),
            data: {
              historyEntryId,
              lineItemId: reminderCandidate.lineItemId,
              reminderDate: reminderCandidate.reminderDate,
              type: "hawl_due",
            },
          });
          scheduledReminder =
            schedulingResult.status === "scheduled"
              ? {
                  ...baseReminder,
                  enabled: true,
                  status: "scheduled",
                  scheduledNotificationId: schedulingResult.scheduledNotificationId,
                }
              : {
                  ...baseReminder,
                  enabled: true,
                  status: schedulingResult.status,
                };
        }
      }

      const entry: HistoryEntry = {
        id: historyEntryId,
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
          calculationContext: {
            calculationDate: calculationContext.calculationDate,
          },
          reminders: scheduledReminder ? [scheduledReminder] : undefined,
          lineItems: lineItems.map((item) =>
            buildDetailedHistoryLineItem(item, currency, {
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
              detailDebtCollectible: t("detailedCalculator.history.debtCollectible"),
              detailDebtDoubtful: t("detailedCalculator.history.debtDoubtful"),
              detailDebtOwedNow: t("detailedCalculator.history.debtOwedNow"),
              detailDebtNetImpact: t("detailedCalculator.history.debtNetImpact"),
              detailDueStatus: t("detailedCalculator.history.dueStatus"),
              detailHawlDueDate: t("detailedCalculator.history.hawlDueDate"),
              detailEventDate: t("detailedCalculator.history.eventDate"),
              dueStatusDueNow: t("detailedCalculator.summary.dueNowStatus"),
              dueStatusNotDueYet: t("detailedCalculator.summary.notDueYetStatus"),
              dueStatusUnknown: t("detailedCalculator.summary.dueStatusUnknown"),
              modeTrade: t("detailedCalculator.history.modeTrade"),
              modeHarvest: t("detailedCalculator.history.modeHarvest"),
              wateringNatural: t("detailedCalculator.history.wateringNatural"),
              wateringPaidIrrigation: t("detailedCalculator.history.wateringPaidIrrigation"),
              kgUnit: t("history.kgUnit"),
            }),
          ),
          combinedTotal,
          finalCalculation: hasDebtLineItem
            ? {
                cashBaseBeforeDebt,
                debtAdjustment: {
                  collectibleReceivablesCurrent: debtAdjustment.collectibleReceivablesCurrent,
                  doubtfulReceivables: debtAdjustment.doubtfulReceivables,
                  debtsYouOweDueNow: debtAdjustment.debtsYouOweDueNow,
                  netAdjustment: debtAdjustment.netAdjustment,
                },
                finalZakatableBase,
                finalZakatRate: 0.025,
                adjustedCashPoolZakatDue: finalCashZakat,
                independentNonDebtAdjustableCashDue: independentNonDebtAdjustableCashDue,
                finalZakatDue: combinedTotal,
                hasDebtLineItem: true,
                groupedTotals: {
                  dueNowMoneyItemCount: dueNowMoneyLineItems.length,
                  dueNowSpecialItemCount: dueNowSpecialLineItems.length,
                  notDueItemCount: notDueLineItems.length,
                  dueNowMoneyBaseBeforeDebt: cashBaseBeforeDebt,
                  dueNowSpecialCashDue: independentNonDebtAdjustableCashDue,
                  notDueTotalWealth,
                  hasEligibleDueNowMoneyPool: hasEligibleDueNowMoney,
                },
              }
            : undefined,
        },
      };

      await upsertGuestHistoryEntry(entry);
      setShowHistorySavedToast(true);
    } finally {
      isSavingHistoryRef.current = false;
      setIsSavingHistory(false);
    }
  };

  const onCalculateSalary = () => {
    if (!(Number(salaryValues.monthlyIncome) > 0)) {
      setValidationErrorKey("detailedCalculator.validation.monthlyIncomeRequired");
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
    setLineItems((p) => [
      ...p,
      {
        id: buildId(),
        category: "salary",
        values: { ...salaryValues },
        result,
        meta: resolveLineItemMeta("salary", {
          hawlStartDate: resolveSelectedHawlStartDate("salary"),
        }),
      },
    ]);
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
      meta: resolveLineItemMeta("livestock", {
        hawlStartDate: resolveSelectedHawlStartDate("livestock"),
      }),
      dueItems: due.dueItems,
      dueText: dueText(due.dueItems),
    };
    setLineItems((p) => [...p, line]);
    setStep("pick");
  });

  const onCalculateProduce = () => {
    if (produceValues.isForTrade && !(Number(produceValues.marketValue) > 0)) {
      setValidationErrorKey("detailedCalculator.validation.produceMarketValueRequired");
      return;
    }
    if (!produceValues.isForTrade && !(Number(produceValues.quantityKg) > 0)) {
      setValidationErrorKey("detailedCalculator.validation.harvestQuantityRequired");
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
          meta: resolveLineItemMeta("produce", {
            eventDate: normalizeIsoDate(produceEventDate),
          }),
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
        meta: resolveLineItemMeta("produce", {
          eventDate: normalizeIsoDate(produceEventDate),
        }),
        dueQuantityKg: dueKg,
        cashEquivalent,
      },
    ]);
    setStep("pick");
  };
  const onCalculateAgriOther = () => {
    if (!(Number(agriOtherValues.marketValue) > 0)) {
      setValidationErrorKey("detailedCalculator.validation.marketValueRequired");
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
    setLineItems((p) => [
      ...p,
      {
        id: buildId(),
        category: "agri_other",
        values: { ...agriOtherValues },
        result,
        meta: resolveLineItemMeta("agri_other", {
          hawlStartDate: resolveSelectedHawlStartDate("agri_other"),
        }),
      },
    ]);
    setStep("pick");
  };
  const onCalculateTradeSector = () => {
    if (!(Number(tradeSectorValues.marketValue) > 0)) {
      setValidationErrorKey("detailedCalculator.validation.marketValueRequired");
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
    setLineItems((p) => [
      ...p,
      {
        id: buildId(),
        category: "trade_sector",
        values: { ...tradeSectorValues },
        result,
        meta: resolveLineItemMeta("trade_sector", {
          hawlStartDate: resolveSelectedHawlStartDate("trade_sector"),
        }),
      },
    ]);
    setStep("pick");
  };
  const onCalculateIndustrialSector = () => {
    if (!(Number(industrialSectorValues.marketValue) > 0)) {
      setValidationErrorKey("detailedCalculator.validation.marketValueRequired");
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
      {
        id: buildId(),
        category: "industrial_sector",
        values: { ...industrialSectorValues },
        result,
        meta: resolveLineItemMeta("industrial_sector", {
          hawlStartDate: resolveSelectedHawlStartDate("industrial_sector"),
        }),
      },
    ]);
    setStep("pick");
  };
  const onCalculateDebt = () => {
    const collectibleReceivablesCurrent = toNonNegative(debtValues.collectibleReceivablesCurrent);
    const doubtfulReceivables = toNonNegative(debtValues.doubtfulReceivables);
    const debtsYouOweDueNow = toNonNegative(debtValues.debtsYouOweDueNow);
    if (collectibleReceivablesCurrent <= 0 && doubtfulReceivables <= 0 && debtsYouOweDueNow <= 0) {
      setValidationErrorKey("detailedCalculator.validation.debtAnyRequired");
      return;
    }
    const result = calculateDebtZakat({
      nisabMethod,
      silverPricePerGram,
      goldPricePerGram,
      nisabOverride: nisabOverride > 0 ? nisabOverride : undefined,
      debt: {
        collectibleReceivablesCurrent,
        doubtfulReceivables,
        debtsYouOweDueNow,
      },
    });

    setLineItems((prev) => {
      const existingDebt = prev.find((item): item is DebtLineItem => item.category === "debt");
      if (!existingDebt) {
        return [
          ...prev,
          {
            id: buildId(),
            category: "debt",
            values: { ...debtValues },
            result,
            meta: resolveLineItemMeta("debt"),
          },
        ];
      }
      return prev.map((item) =>
        item.category === "debt"
          ? {
              ...item,
              values: { ...debtValues },
              result,
            }
          : item,
      );
    });
    setStep("pick");
  };

  const onCalculate = () => {
    setValidationErrorKey(null);
    if (!validateTimingInputs(activeCategory)) {
      return;
    }
    if (activeCategory === "salary") onCalculateSalary();
    else if (activeCategory === "livestock") onCalculateLivestock();
    else if (activeCategory === "agri_other") onCalculateAgriOther();
    else if (activeCategory === "trade_sector") onCalculateTradeSector();
    else if (activeCategory === "industrial_sector") onCalculateIndustrialSector();
    else if (activeCategory === "debt") onCalculateDebt();
    else onCalculateProduce();
  };
  const summaryText = `${t("detailedCalculator.hero.categoriesAdded", {
    count: addedCategoryCount,
  })} - ${t("detailedCalculator.total.label")}: ${totalDisplay.primaryDisplay}${
    totalDisplay.suffixDisplay ? ` + ${totalDisplay.suffixDisplay}` : ""
  }`;
  const renderSummaryLineItem = (item: LineItem) => (
    <View key={item.id} style={styles.summaryItem}>
      <View style={[styles.summaryItemHeader, isRTL && styles.rowReverse]}>
        <View style={[styles.summaryItemTitleWrap, isRTL && styles.rowReverse]}>
          <Text style={styles.bold}>{categoryLabel(item.category)}</Text>
          {item.category !== "debt" ? (
            <View
              style={[
                styles.debtImpactBadge,
                item.meta.debtAdjustable
                  ? styles.debtImpactBadgeApplied
                  : styles.debtImpactBadgeNotApplied,
              ]}
            >
              <Text
                style={[
                  styles.debtImpactBadgeText,
                  item.meta.debtAdjustable
                    ? styles.debtImpactBadgeTextApplied
                    : styles.debtImpactBadgeTextNotApplied,
                ]}
              >
                {item.meta.debtAdjustable
                  ? t("detailedCalculator.summary.debtImpactAppliedBadge")
                  : t("detailedCalculator.summary.debtImpactNotAppliedBadge")}
              </Text>
            </View>
          ) : null}
        </View>
        <Pressable onPress={() => setLineItems((p) => p.filter((x) => x.id !== item.id))}>
          <Text style={styles.link}>{t("delete")}</Text>
        </Pressable>
      </View>
      {item.category !== "debt" ? (
        <>
          <Text style={styles.caption}>
            {t("detailedCalculator.summary.dueStatusValue", {
              value: getDueStatusLabel(item.meta),
            })}
          </Text>
          {getDueDateContextLabel(item.meta) ? (
            <Text style={styles.caption}>{getDueDateContextLabel(item.meta)}</Text>
          ) : null}
        </>
      ) : null}
      {item.category === "salary" ? (
        <>
          <Text>{t("detailedCalculator.summary.modeValue", { value: item.values.calculationMode === "monthly" ? t("detailedCalculator.modes.monthly") : t("detailedCalculator.modes.annual") })}</Text>
          <Text>{t("detailedCalculator.summary.nisabValue", { value: formatMoney(item.result.nisab, currency) })}</Text>
          <Text>{t("detailedCalculator.summary.netWealthValue", { value: formatMoney(item.result.totalWealth, currency) })}</Text>
          <Text>
            {t(
              hasDebtLineItem && item.meta.debtAdjustable
                ? "detailedCalculator.summary.zakatBeforeAdjustmentsValue"
                : "detailedCalculator.summary.zakatDueValue",
              { value: formatMoney(item.result.totalZakat, currency) },
            )}
          </Text>
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
          <Text>
            {t(
              hasDebtLineItem && item.meta.debtAdjustable
                ? "detailedCalculator.summary.zakatBeforeAdjustmentsValue"
                : "detailedCalculator.summary.zakatDueValue",
              { value: formatMoney(item.result.totalZakat, currency) },
            )}
          </Text>
        </>
      ) : item.category === "trade_sector" ? (
        <>
          <Text>{t("detailedCalculator.summary.tradeAssetsValue", { value: formatMoney(Number(item.values.marketValue || 0), currency) })}</Text>
          <Text>{t("detailedCalculator.summary.dueOperatingCostsValue", { value: formatMoney(Number(item.values.operatingCosts || 0), currency) })}</Text>
          <Text>{t("detailedCalculator.summary.netZakatableAmountValue", { value: formatMoney(item.result.totalWealth, currency) })}</Text>
          <Text>{t("detailedCalculator.summary.ruleTradeSector")}</Text>
          <Text>{t("detailedCalculator.summary.nisabValue", { value: formatMoney(item.result.nisab, currency) })}</Text>
          <Text>
            {t(
              hasDebtLineItem && item.meta.debtAdjustable
                ? "detailedCalculator.summary.zakatBeforeAdjustmentsValue"
                : "detailedCalculator.summary.zakatDueValue",
              { value: formatMoney(item.result.totalZakat, currency) },
            )}
          </Text>
        </>
      ) : item.category === "industrial_sector" ? (
        <>
          <Text>{t("detailedCalculator.summary.industrialAssetsValue", { value: formatMoney(Number(item.values.marketValue || 0), currency) })}</Text>
          <Text>{t("detailedCalculator.summary.productionCostsValue", { value: formatMoney(Number(item.values.operatingCosts || 0), currency) })}</Text>
          <Text>{t("detailedCalculator.summary.netZakatableAmountValue", { value: formatMoney(item.result.totalWealth, currency) })}</Text>
          <Text>{t("detailedCalculator.summary.ruleIndustrial")}</Text>
          <Text>{t("detailedCalculator.summary.nisabValue", { value: formatMoney(item.result.nisab, currency) })}</Text>
          <Text>
            {t(
              hasDebtLineItem && item.meta.debtAdjustable
                ? "detailedCalculator.summary.zakatBeforeAdjustmentsValue"
                : "detailedCalculator.summary.zakatDueValue",
              { value: formatMoney(item.result.totalZakat, currency) },
            )}
          </Text>
        </>
      ) : item.category === "debt" ? (
        <>
          <Text style={styles.caption}>{t("detailedCalculator.summary.debtAdjustmentSeeSection")}</Text>
        </>
      ) : (
        <>
          <Text>{t("detailedCalculator.summary.modeValue", { value: item.values.isForTrade ? t("detailedCalculator.form.produce.tradeMode") : t("detailedCalculator.form.produce.harvestMode") })}</Text>
          {item.values.isForTrade ? (
            <>
              <Text>{t("detailedCalculator.summary.marketValueValue", { value: formatMoney(Number(item.values.marketValue || 0), currency) })}</Text>
              <Text>{t("detailedCalculator.summary.ruleProduceTrade")}</Text>
              <Text>{t("detailedCalculator.summary.nisabValue", { value: formatMoney(item.result.nisab, currency) })}</Text>
              <Text>
                {t("detailedCalculator.summary.zakatDueValue", {
                  value: formatMoney(item.result.totalZakat, currency),
                })}
              </Text>
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
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroOverline}>{t("detailedCalculator.hero.overline")}</Text>
        <Text style={styles.heroTitle}>
          {step === "pick"
            ? t("detailedCalculator.hero.hawlSetup")
            : categoryLabel(activeCategory)}
        </Text>
        <Text style={styles.heroSubTitle}>
          {step === "pick" ? hawlSummaryText : summaryText}
        </Text>
      </View>

      {step === "pick" ? (
        <>
          <Pressable
            style={[styles.backButton, isRTL && styles.rowReverse]}
            onPress={() => router.push("/(public)/calculate/detailed/setup" as never)}
            testID="detailed-pick-back-to-setup"
          >
            <Ionicons
              name={isRTL ? "arrow-forward" : "arrow-back"}
              size={18}
              color={appColors.textPrimary}
            />
            <Text style={styles.backButtonText}>
              {t("detailedCalculator.backToSetup")}
            </Text>
          </Pressable>
          <Text style={styles.instructions}>{t("detailedCalculator.instructions")}</Text>
          {CATEGORY_ORDER.map((category) => {
            const added = lineItems.some((item) => item.category === category);
            const debtImpactBadge = debtImpactBadgeLabel(category);
            const debtImpactMeta = resolveLineItemMeta(category, {
              hawlStartDate: normalizeIsoDate(sessionHawlStartDate),
            });
            return (
              <Pressable
                key={category}
                style={[styles.categoryCard, isRTL && styles.rowReverse]}
                onPress={() => openCategory(category)}
              >
                <Ionicons
                  name={CATEGORY_ICONS[category]}
                  size={24}
                  color={appColors.textPrimary}
                  style={[styles.categoryIcon, isRTL && styles.categoryIconRtl]}
                />
                <View style={styles.categoryContent}>
                  <View style={[styles.categoryRow, isRTL && styles.rowReverse]}>
                    <Text style={styles.categoryTitle}>{categoryLabel(category)}</Text>
                    {added ? <Text style={styles.addedPill}>{t("detailedCalculator.addedPill")}</Text> : null}
                  </View>
                  <Text style={styles.categoryDesc}>{categoryDescription(category)}</Text>
                  {debtImpactBadge ? (
                    <View
                      style={[
                        styles.debtImpactBadge,
                        debtImpactMeta.debtAdjustable
                          ? styles.debtImpactBadgeApplied
                          : styles.debtImpactBadgeNotApplied,
                      ]}
                    >
                      <Text
                        style={[
                          styles.debtImpactBadgeText,
                          debtImpactMeta.debtAdjustable
                            ? styles.debtImpactBadgeTextApplied
                            : styles.debtImpactBadgeTextNotApplied,
                        ]}
                      >
                        {debtImpactBadge}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Ionicons
                  name={isRTL ? "chevron-back" : "chevron-forward"}
                  size={22}
                  color={appColors.primary}
                  style={styles.chevron}
                />
              </Pressable>
            );
          })}
        </>
      ) : (
        <>
          <Pressable
            style={[styles.backButton, isRTL && styles.rowReverse]}
            onPress={() => setStep("pick")}
          >
            <Ionicons
              name={isRTL ? "arrow-forward" : "arrow-back"}
              size={18}
              color={appColors.textPrimary}
            />
            <Text style={styles.backButtonText}>
              {t("detailedCalculator.backToCategories")}
            </Text>
          </Pressable>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{categoryLabel(activeCategory)}</Text>
            <Text style={styles.caption}>{categoryDescription(activeCategory)}</Text>
            {isHawlRequiredCategory(activeCategory) ? (
              <View style={styles.infoBox}>
                <Text style={styles.bold}>{t("detailedCalculator.form.hawl.sectionTitle")}</Text>
                <View style={[styles.rowWrap, isRTL && styles.rowWrapRtl]}>
                  <Pressable
                    style={[styles.chip, (activeHawlTimingDraft?.useSessionDate ?? true) && styles.chipActive]}
                    onPress={() => {
                      const hawlCategory = activeCategory as HawlCategoryId;
                      setHawlTimingDrafts((prev) => ({
                        ...prev,
                        [hawlCategory]: {
                          ...prev[hawlCategory],
                          useSessionDate: true,
                        },
                      }));
                      setValidationErrorKey(null);
                    }}
                  >
                    <Text>
                      {t("detailedCalculator.form.hawl.useSessionDate", {
                        date: hawlReferenceDateDisplay,
                      })}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.chip, !(activeHawlTimingDraft?.useSessionDate ?? true) && styles.chipActive]}
                    onPress={() => {
                      const hawlCategory = activeCategory as HawlCategoryId;
                      setHawlTimingDrafts((prev) => ({
                        ...prev,
                        [hawlCategory]: {
                          ...prev[hawlCategory],
                          useSessionDate: false,
                        },
                      }));
                      setValidationErrorKey(null);
                    }}
                  >
                    <Text>{t("detailedCalculator.form.hawl.useCustomCategoryDate")}</Text>
                  </Pressable>
                </View>
                {activeHawlTimingDraft?.useSessionDate ? (
                  <Text style={styles.caption}>
                    {t("detailedCalculator.form.hawl.inheritedDatePreview", {
                      date: hawlReferenceDateDisplay,
                    })}
                  </Text>
                ) : null}
                {!(activeHawlTimingDraft?.useSessionDate ?? true) ? (
                  <TextInput
                    style={styles.input}
                    value={activeHawlTimingDraft?.customDate ?? ""}
                    onChangeText={(value) => {
                      const hawlCategory = activeCategory as HawlCategoryId;
                      setHawlTimingDrafts((prev) => ({
                        ...prev,
                        [hawlCategory]: {
                          ...prev[hawlCategory],
                          customDate: value,
                        },
                      }));
                      setValidationErrorKey(null);
                    }}
                    placeholder={t("detailedCalculator.form.hawl.customDatePlaceholder")}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                ) : null}
                <Text style={styles.caption}>
                  {getHawlStartContextLabel(activeTimingMeta)}
                </Text>
                <Text style={styles.caption}>
                  {t("detailedCalculator.summary.hawlDueDateValue", {
                    value: isValidIsoDate(activeTimingMeta.hawlDueDate)
                      ? formatIsoDateForDisplay(
                          activeTimingMeta.hawlDueDate,
                          i18n?.resolvedLanguage ?? i18n?.language,
                        )
                      : t("detailedCalculator.notSet"),
                  })}
                </Text>
                <View
                  style={[
                    styles.dueStatusBadge,
                    getDueStatusTone(activeTimingMeta) === "due"
                      ? styles.dueStatusBadgeDue
                      : getDueStatusTone(activeTimingMeta) === "unknown"
                        ? styles.dueStatusBadgeUnknown
                        : styles.dueStatusBadgeNotDue,
                  ]}
                >
                  <Text
                    style={[
                      styles.dueStatusBadgeText,
                      getDueStatusTone(activeTimingMeta) === "due"
                        ? styles.dueStatusBadgeTextDue
                        : getDueStatusTone(activeTimingMeta) === "unknown"
                          ? styles.dueStatusBadgeTextUnknown
                          : styles.dueStatusBadgeTextNotDue,
                    ]}
                  >
                    {getDueStatusLabel(activeTimingMeta)}
                  </Text>
                </View>
              </View>
            ) : null}
            {activeCategory === "produce" ? (
              <View style={styles.infoBox}>
                <Text style={styles.bold}>{t("detailedCalculator.form.produce.eventDateLabel")}</Text>
                <TextInput
                  style={styles.input}
                  value={produceEventDate}
                  onChangeText={(value) => {
                    setProduceEventDate(value);
                    setValidationErrorKey(null);
                  }}
                  placeholder={t("detailedCalculator.form.produce.eventDatePlaceholder")}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.caption}>{t("detailedCalculator.form.produce.dueAtEventNote")}</Text>
                <Text style={styles.caption}>
                  {t("detailedCalculator.summary.eventDateValue", {
                    value: resolvedCurrentProduceEventDate
                      ? formatIsoDateForDisplay(
                          resolvedCurrentProduceEventDate,
                          i18n?.resolvedLanguage ?? i18n?.language,
                        )
                      : t("detailedCalculator.notSet"),
                  })}
                </Text>
                <View
                  style={[
                    styles.dueStatusBadge,
                    getDueStatusTone(activeTimingMeta) === "due"
                      ? styles.dueStatusBadgeDue
                      : getDueStatusTone(activeTimingMeta) === "unknown"
                        ? styles.dueStatusBadgeUnknown
                        : styles.dueStatusBadgeNotDue,
                  ]}
                >
                  <Text
                    style={[
                      styles.dueStatusBadgeText,
                      getDueStatusTone(activeTimingMeta) === "due"
                        ? styles.dueStatusBadgeTextDue
                        : getDueStatusTone(activeTimingMeta) === "unknown"
                          ? styles.dueStatusBadgeTextUnknown
                          : styles.dueStatusBadgeTextNotDue,
                    ]}
                  >
                    {getDueStatusLabel(activeTimingMeta)}
                  </Text>
                </View>
              </View>
            ) : null}
            {activeCategory === "salary" ? (
          <>
            <View style={[styles.rowWrap, isRTL && styles.rowWrapRtl]}>
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
              <View style={[styles.rowWrap, isRTL && styles.rowWrapRtl]}>
                {(["camels", "cattle", "sheep_goats"] as LivestockType[]).map((t) => (
                  <Pressable key={t} style={[styles.chip, value === t && styles.chipActive]} onPress={() => onChange(t)}><Text>{livestockTypeLabel(t)}</Text></Pressable>
                ))}
              </View>
            )} />
            <Controller control={control} name="ownedCount" render={({ field: { value, onChange } }) => (
              <TextInput style={styles.input} keyboardType="numeric" value={value} onChangeText={onChange} placeholder={t("detailedCalculator.form.livestock.ownedCountPlaceholder")} />
            )} />
            {errors.ownedCount?.message ? (
              <Text style={styles.error}>{t(String(errors.ownedCount.message) as never)}</Text>
            ) : null}

            {livestockPreview.due.camel121ChoiceOptions ? (
              <Controller control={control} name="camel121Choice" render={({ field: { value, onChange } }) => (
                <View style={[styles.rowWrap, isRTL && styles.rowWrapRtl]}>
                  <Pressable style={[styles.chip, value === "2_hiqqah" && styles.chipActive]} onPress={() => onChange("2_hiqqah")}><Text>{t("detailedCalculator.form.livestock.camel121Option2Hiqqah")}</Text></Pressable>
                  <Pressable style={[styles.chip, value === "3_bint_labun" && styles.chipActive]} onPress={() => onChange("3_bint_labun")}><Text>{t("detailedCalculator.form.livestock.camel121Option3BintLabun")}</Text></Pressable>
                </View>
              )} />
            ) : null}

            <Text style={styles.caption}>
              {t("detailedCalculator.summary.dueAnimalsValue", { value: dueText(livestockPreview.due.dueItems) })}
            </Text>
            <Text style={styles.caption}>
              {t("detailedCalculator.form.livestock.offspringHawlNote")}
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
            {errors.cashEstimate?.message ? (
              <Text style={styles.error}>{t(String(errors.cashEstimate.message) as never)}</Text>
            ) : null}
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
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={debtValues.collectibleReceivablesCurrent}
              onChangeText={(v) => setDebtValues((p) => ({ ...p, collectibleReceivablesCurrent: v }))}
              placeholder={t("detailedCalculator.form.debt.collectiblePlaceholder")}
            />
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={debtValues.doubtfulReceivables}
              onChangeText={(v) => setDebtValues((p) => ({ ...p, doubtfulReceivables: v }))}
              placeholder={t("detailedCalculator.form.debt.doubtfulPlaceholder")}
            />
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={debtValues.debtsYouOweDueNow}
              onChangeText={(v) => setDebtValues((p) => ({ ...p, debtsYouOweDueNow: v }))}
              placeholder={t("detailedCalculator.form.debt.owedNowPlaceholder")}
            />
            <View style={styles.infoBox}>
              <Text style={styles.bold}>{t("detailedCalculator.form.debt.owedToYouTitle")}</Text>
              <Text style={styles.caption}>{t("detailedCalculator.form.debt.owedToYouBody")}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.bold}>{t("detailedCalculator.form.debt.youOweTitle")}</Text>
              <Text style={styles.caption}>{t("detailedCalculator.form.debt.youOweBody")}</Text>
            </View>
            <Pressable
              onPress={() =>
                router.push(
                  {
                    pathname: "/(public)/zakat-explanations/[slug]",
                    params: {
                      slug: "debt",
                      returnTo: "/(public)/calculate/detailed?openCategory=debt",
                    },
                  } as never,
                )
              }
            >
              <Text style={styles.link}>{t("detailedCalculator.form.debt.whatCountsLink")}</Text>
            </Pressable>
            <Text style={styles.caption}>{t("detailedCalculator.form.debt.whatCountsExamples")}</Text>
          </>
        ) : (
          <>
            <View style={[styles.rowWrap, isRTL && styles.rowWrapRtl]}>
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
                <View style={[styles.rowWrap, isRTL && styles.rowWrapRtl]}>
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
                <View style={[styles.row, isRTL && styles.rowReverse]}><Text style={styles.previewLabel}>{livePreview.netLabel}</Text><Text style={styles.previewValue}>{livePreview.netValue}</Text></View>
                <View style={[styles.row, isRTL && styles.rowReverse]}><Text style={styles.previewLabel}>{livePreview.dueLabel}</Text><Text style={styles.previewValue}>{livePreview.dueValue}</Text></View>
                {"extraLabel" in livePreview && livePreview.extraLabel && livePreview.extraValue ? (
                  <View style={[styles.row, isRTL && styles.rowReverse]}><Text style={styles.previewLabel}>{livePreview.extraLabel}</Text><Text style={styles.previewValue}>{livePreview.extraValue}</Text></View>
                ) : null}
              </View>
            ) : null}
            <Pressable style={[styles.accordionHeader, isRTL && styles.rowReverse]} onPress={() => setIsHowCalculatedOpen((p) => !p)}>
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
            {validationErrorKey ? <Text style={styles.error}>{t(validationErrorKey as never)}</Text> : null}
            <TouchableOpacity style={styles.button} onPress={onCalculate}>
              <Text style={styles.buttonText}>
                {activeCategory === "debt" && lineItems.some((item) => item.category === "debt")
                  ? t("detailedCalculator.updateDebt")
                  : t("detailedCalculator.addCategory")}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {lineItems.length > 0 ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryHeader}>
            {t("detailedCalculator.summary.title")}
          </Text>
          {dueNowMoneyLineItems.length > 0 ? (
            <>
              <View style={styles.summaryGroupHeader}>
                <Text style={styles.summaryGroupTitle}>{t("detailedCalculator.summary.groupDueNowMoney")}</Text>
              </View>
              {dueNowMoneyLineItems.map((item) => renderSummaryLineItem(item))}
            </>
          ) : null}
          {dueNowSpecialLineItems.length > 0 ? (
            <>
              <View style={styles.summaryGroupHeader}>
                <Text style={styles.summaryGroupTitle}>{t("detailedCalculator.summary.groupDueNowSpecial")}</Text>
              </View>
              {dueNowSpecialLineItems.map((item) => renderSummaryLineItem(item))}
            </>
          ) : null}
          {notDueLineItems.length > 0 ? (
            <>
              <View style={styles.summaryGroupHeader}>
                <Text style={styles.summaryGroupTitle}>{t("detailedCalculator.summary.groupNotDueYet")}</Text>
              </View>
              {notDueLineItems.map((item) => renderSummaryLineItem(item))}
            </>
          ) : null}
          {hasDebtLineItem ? (
            <>
              <View style={styles.summaryGroupHeader}>
                <Text style={styles.summaryGroupTitle}>{t("detailedCalculator.summary.groupDebtAdjustment")}</Text>
              </View>
              {lineItems
                .filter((item) => item.category === "debt")
                .map((item) => renderSummaryLineItem(item))}
            </>
          ) : null}
          {hasDebtLineItem ? (
            <View style={styles.summaryItem}>
              <Text style={styles.bold}>{t("detailedCalculator.summary.debtAdjustmentTitle")}</Text>
              <Text>
                {t("detailedCalculator.summary.debtCollectibleAppliedValue", {
                  value: formatMoney(debtAdjustment.collectibleReceivablesCurrent, currency),
                })}
              </Text>
              <Text>
                {t("detailedCalculator.summary.debtOwedNowAppliedValue", {
                  value: formatMoney(debtAdjustment.debtsYouOweDueNow, currency),
                })}
              </Text>
              <Text>
                {t("detailedCalculator.summary.debtDoubtfulExcludedValue", {
                  value: formatMoney(debtAdjustment.doubtfulReceivables, currency),
                })}
              </Text>
              <Text style={styles.caption}>{t("detailedCalculator.summary.debtDoubtfulExcludedNote")}</Text>
              <Text>
                {t("detailedCalculator.summary.debtNetImpactValue", {
                  value: formatMoney(debtAdjustment.netAdjustment, currency),
                })}
              </Text>
              <Text>
                {t("detailedCalculator.summary.finalZakatableBaseValue", {
                  value: formatMoney(finalZakatableBase, currency),
                })}
              </Text>
              <Text>
                {t("detailedCalculator.summary.finalZakatDueRateValue", {
                  value: formatMoney(finalCashZakat, currency),
                })}
              </Text>
              <Text>
                {t("detailedCalculator.summary.independentCashDueValue", {
                  value: formatMoney(independentNonDebtAdjustableCashDue, currency),
                })}
              </Text>
              <Text>
                {t("detailedCalculator.summary.totalPayableDueNowValue", {
                  value: formatMoney(combinedTotal, currency),
                })}
              </Text>
              <Text style={styles.caption}>{t("detailedCalculator.summary.debtScopeNote")}</Text>
              {!hasEligibleDueNowMoney ? (
                <Text style={styles.caption}>
                  {t("detailedCalculator.summary.debtNoEligiblePoolNote")}
                </Text>
              ) : null}
              {isBelowNisabAfterDebt ? (
                <View style={styles.belowNisabBox}>
                  <Text style={styles.belowNisabTitle}>
                    {t("detailedCalculator.summary.belowNisabAfterDebtTitle")}
                  </Text>
                  <Text style={styles.caption}>
                    {t("detailedCalculator.summary.belowNisabAfterDebtBody")}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
          <View style={[styles.totalRow, isRTL && styles.rowReverse]}>
            <Text style={styles.bold}>{t("history.totalZakatDue")}</Text>
            <View style={styles.totalValueWrap}>
              <Text style={styles.totalValue}>{totalDisplay.primaryDisplay}</Text>
              {totalDisplay.suffixDisplay ? <Text style={styles.totalSuffix}>+ {totalDisplay.suffixDisplay}</Text> : null}
            </View>
          </View>
          <Pressable
            style={[styles.saveHistoryButton, isSavingHistory && styles.saveHistoryButtonDisabled]}
            onPress={onSaveToHistory}
            disabled={isSavingHistory}
          >
              <Text style={styles.buttonText}>
              {isSavingHistory ? t("loading") : t("detailedCalculator.saveToHistory")}
              </Text>
          </Pressable>
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
  summaryItemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: appSpacing.xs },
  summaryItemTitleWrap: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: appSpacing.xs, flex: 1, marginEnd: appSpacing.sm },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", marginBottom: appSpacing.xs },
  rowWrapRtl: { flexDirection: "row-reverse" },
  chip: { borderWidth: 1, borderColor: appColors.border, borderRadius: appRadius.sm, paddingVertical: appSpacing.xs, paddingHorizontal: appSpacing.sm, marginEnd: appSpacing.xs, marginBottom: appSpacing.xs, backgroundColor: appColors.surface },
  chipActive: { backgroundColor: "#E8F1EF", borderColor: appColors.primary },
  link: { color: appColors.primary, fontWeight: "600" },
  caption: { color: appColors.textSecondary, fontSize: 13, marginBottom: appSpacing.xs },
  error: { color: appColors.error, marginBottom: appSpacing.xs, fontSize: 13 },
  lineItem: { borderWidth: 1, borderColor: appColors.border, borderRadius: appRadius.sm, padding: appSpacing.sm, marginBottom: appSpacing.xs },
  categoryCard: { marginHorizontal: appSpacing.lg, marginBottom: appSpacing.sm, borderRadius: appRadius.md, borderWidth: 1, borderColor: "#BAC7C2", backgroundColor: appColors.surface, padding: appSpacing.md, flexDirection: "row", alignItems: "center", minHeight: 84 },
  categoryIcon: { fontSize: 22, marginEnd: appSpacing.sm },
  categoryIconRtl: { marginEnd: 0, marginStart: appSpacing.sm },
  categoryContent: { flex: 1 },
  categoryRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  categoryTitle: { color: appColors.textPrimary, fontSize: 21, fontWeight: "800", flexShrink: 1 },
  categoryDesc: { color: appColors.textSecondary, fontSize: 13 },
  addedPill: { color: "#1F6A5E", fontWeight: "700", fontSize: 12, marginStart: appSpacing.xs, backgroundColor: "#E0F3EE", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  debtImpactBadge: { borderRadius: appRadius.pill, paddingHorizontal: 8, paddingVertical: 2, marginTop: appSpacing.xs, alignSelf: "flex-start" },
  debtImpactBadgeApplied: { backgroundColor: "#E6F5EA" },
  debtImpactBadgeNotApplied: { backgroundColor: "#F4F5F6" },
  debtImpactBadgeText: { fontSize: 11, fontWeight: "700" },
  debtImpactBadgeTextApplied: { color: "#1F6A5E" },
  debtImpactBadgeTextNotApplied: { color: appColors.textSecondary },
  dueStatusBadge: { borderRadius: appRadius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start", marginTop: appSpacing.xs },
  dueStatusBadgeDue: { backgroundColor: "#E6F5EA" },
  dueStatusBadgeNotDue: { backgroundColor: "#F4F5F6" },
  dueStatusBadgeUnknown: { backgroundColor: "#FEF6E8" },
  dueStatusBadgeText: { fontSize: 11, fontWeight: "700" },
  dueStatusBadgeTextDue: { color: "#1F6A5E" },
  dueStatusBadgeTextNotDue: { color: appColors.textSecondary },
  dueStatusBadgeTextUnknown: { color: "#9A6A00" },
  chevron: { color: appColors.primary, marginStart: appSpacing.sm },
  infoBox: { borderWidth: 1, borderColor: appColors.border, borderRadius: appRadius.sm, padding: appSpacing.sm, backgroundColor: "#F8FAF8", marginBottom: appSpacing.xs },
  previewBox: { backgroundColor: appColors.primary, borderRadius: appRadius.sm, padding: appSpacing.sm, marginTop: appSpacing.xs, marginBottom: appSpacing.xs },
  previewTitle: { color: "#DDF6F2", fontSize: 12, fontWeight: "700", marginBottom: appSpacing.xs, textTransform: "uppercase" },
  previewLabel: { color: "#E5FAF6", fontSize: 14, fontWeight: "600" },
  previewValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
  accordionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderColor: appColors.border, paddingTop: appSpacing.sm, marginTop: appSpacing.xs },
  summaryCard: { backgroundColor: appColors.surface, borderRadius: appRadius.md, borderWidth: 1, borderColor: appColors.primary, marginHorizontal: appSpacing.lg, marginBottom: appSpacing.sm, overflow: "hidden" },
  summaryHeader: { backgroundColor: appColors.primary, color: "#fff", fontSize: 18, fontWeight: "800", paddingHorizontal: appSpacing.md, paddingVertical: appSpacing.sm },
  summaryGroupHeader: { backgroundColor: "#F4F7F6", paddingHorizontal: appSpacing.sm, paddingVertical: appSpacing.xs, borderBottomWidth: 1, borderBottomColor: appColors.border },
  summaryGroupTitle: { color: appColors.textSecondary, fontSize: 12, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  summaryItem: { borderBottomWidth: 1, borderBottomColor: appColors.border, padding: appSpacing.sm },
  belowNisabBox: { borderWidth: 1, borderColor: "#E8CACA", borderRadius: appRadius.sm, backgroundColor: "#FCF4F4", padding: appSpacing.sm, marginTop: appSpacing.xs },
  belowNisabTitle: { color: appColors.error, fontWeight: "800", marginBottom: appSpacing.xs },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#E2EFEA", borderRadius: appRadius.sm, margin: appSpacing.sm, padding: appSpacing.sm },
  totalValueWrap: { alignItems: "flex-end", flex: 1, marginStart: appSpacing.sm },
  totalValue: { color: appColors.primary, fontWeight: "800", fontSize: 20, textAlign: "right" },
  totalSuffix: { color: appColors.textSecondary, fontSize: 12, textAlign: "right", marginTop: 2 },
  rowReverse: { flexDirection: "row-reverse" },
  bold: { fontWeight: "700" },
  saveHistoryButton: { marginTop: appSpacing.xs, backgroundColor: appColors.success, borderRadius: appRadius.sm, alignItems: "center", paddingVertical: appSpacing.sm, minHeight: 48, justifyContent: "center" },
  saveHistoryButtonDisabled: { opacity: 0.7 },
  toast: { position: "absolute", bottom: 18, left: 16, right: 16, backgroundColor: appColors.textPrimary, borderRadius: appRadius.sm, paddingVertical: appSpacing.xs, alignItems: "center" },
  toastText: { color: "#fff", fontWeight: "600" },
});




import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, I18nManager, Platform, StyleSheet, Text, View } from "react-native";
import {
  AppCard,
  AppHeader,
  AppScreen,
  SecondaryButton,
} from "../../../components/ui";
import { buildHistoryPdfHtml } from "../../../features/history/pdf";
import { resolveHistoryCategoryLabel } from "../../../features/history/categoryLabels";
import { buildTotalDisplay, resolveNonCashDueSummary } from "../../../features/history/totalDisplay";
import { resolveDetailedReminderDisplayState } from "../../../features/history/reminders";
import { getGuestHistoryEntryById } from "../../../features/history/storage";
import type { HistoryEntry } from "../../../features/history/types";
import { formatMoney } from "../../../lib/currency";
import { resolveEligibilityDueStatus } from "../../../lib/zakat-calculation";
import { appColors, appRadius, appSpacing, appTypography } from "../../../theme/designSystem";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function HistoryDetailsScreen() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const isRTL = I18nManager.isRTL;
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) return;
      const found = await getGuestHistoryEntryById(id);
      if (mounted) {
        setEntry(found);
        setHasLoaded(true);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const detailRows = useMemo(() => {
    if (!entry) return [];
    if (entry.payload.kind === "quick") {
      return [
        { label: t("history.detailRows.cashBank"), value: entry.payload.inputs.cash, negative: false },
        { label: t("history.detailRows.goldSilver"), value: entry.payload.inputs.goldValue, negative: false },
        { label: t("history.detailRows.debtsOwed"), value: entry.payload.inputs.debt, negative: true },
        { label: t("history.detailRows.netWealth"), value: entry.payload.result.totalWealth, negative: false, emphasized: true },
      ];
    }

    const wealthTotal = entry.payload.lineItems.reduce((sum, item) => sum + item.totalWealth, 0);
    return [
      { label: t("history.detailRows.assetCategories"), value: entry.summary.categoriesUsed.length, negative: false },
      { label: t("history.detailRows.lineItems"), value: entry.payload.lineItems.length, negative: false },
      { label: t("history.detailRows.netWealth"), value: wealthTotal, negative: false, emphasized: true },
    ];
  }, [entry, t]);
  const totalDisplay = useMemo(() => {
    if (!entry) return null;
    return buildTotalDisplay({
      cashTotal: entry.totalZakat,
      currency: entry.currency,
      nonCashDue: resolveNonCashDueSummary(entry.summary.nonCashDue),
      labels: { kgUnit: t("history.kgUnit", { defaultValue: "kg" }) },
    });
  }, [entry, t]);
  const detailedPayload = entry?.payload.kind === "detailed" ? entry.payload : null;
  const detailedReminderState = useMemo(() => {
    if (!detailedPayload) return null;
    return resolveDetailedReminderDisplayState(detailedPayload);
  }, [detailedPayload]);
  const detailedLineItemGroups = useMemo(() => {
    if (!detailedPayload) return [];
    const isMoneyCategory = (category: string) =>
      ["salary", "agri_other", "trade_sector", "industrial_sector"].includes(category);
    const classify = (item: (typeof detailedPayload.lineItems)[number]) => {
      if (item.category === "debt") return "debt";
      const dueNow = item.meta?.dueNow ?? true;
      const debtAdjustable = item.meta?.debtAdjustable ?? isMoneyCategory(item.category);
      if (!dueNow) return "not_due";
      if (debtAdjustable) return "due_money";
      return "due_special";
    };

    return [
      {
        key: "due_money",
        title: t("history.groupedRows.dueNowMoney"),
        items: detailedPayload.lineItems.filter((item) => classify(item) === "due_money"),
      },
      {
        key: "due_special",
        title: t("history.groupedRows.dueNowSpecial"),
        items: detailedPayload.lineItems.filter((item) => classify(item) === "due_special"),
      },
      {
        key: "not_due",
        title: t("history.groupedRows.notDueYet"),
        items: detailedPayload.lineItems.filter((item) => classify(item) === "not_due"),
      },
      {
        key: "debt",
        title: t("history.groupedRows.debtAdjustment"),
        items: detailedPayload.lineItems.filter((item) => classify(item) === "debt"),
      },
    ].filter((group) => group.items.length > 0);
  }, [detailedPayload, t]);
  const resolveCategoryLabel = useMemo(
    () => (categoryIdOrLabel: string, fallbackLabel?: string) =>
      resolveHistoryCategoryLabel(categoryIdOrLabel, (key) => t(key as never), fallbackLabel),
    [t],
  );

  const handleBackToHistory = () => {
    router.replace("/(public)/history");
  };

  const handleExportPdf = async () => {
    if (!entry || isExporting) return;

    const html = buildHistoryPdfHtml(entry, {
      kgUnit: t("history.kgUnit", { defaultValue: "kg" }),
      titleQuick: t("history.quickCalculation"),
      titleDetailed: t("history.detailedCalculation"),
      savedPrefix: t("history.savedPrefix", { defaultValue: "Saved" }),
      totalLabel: t("history.totalZakatDue"),
      categoriesUsed: t("history.categoriesUsed"),
      quickSnapshotTitle: t("history.inputsSnapshot"),
      detailedBreakdownTitle: t("history.lineItemBreakdown"),
      finalCalculationTitle: t("history.finalCalculation.title"),
      debtAdjustmentTitle: t("history.finalCalculation.debtAdjustmentTitle"),
      fieldHeader: t("history.pdf.field", { defaultValue: "Field" }),
      categoryHeader: t("history.pdf.category", { defaultValue: "Category" }),
      valueHeader: t("history.pdf.value", { defaultValue: "Value" }),
      netWealthHeader: t("history.detailRows.netWealth"),
      zakatDueHeader: t("history.zakatDue"),
      zakatBeforeAdjustmentsHeader: t("history.zakatBeforeAdjustments"),
      generatedNote: t("history.pdf.generatedNote", {
        defaultValue: "Generated from local history on this device.",
      }),
      finalCalculationRows: {
        collectibleReceivables: t("history.finalCalculation.collectibleReceivables"),
        doubtfulReceivablesExcluded: t("history.finalCalculation.doubtfulReceivablesExcluded"),
        debtsDueNow: t("history.finalCalculation.debtsDueNow"),
        debtNetImpact: t("history.finalCalculation.debtNetImpact"),
        finalZakatableBase: t("history.finalCalculation.finalZakatableBase"),
        adjustedCashPoolDue: t("history.finalCalculation.adjustedCashPoolDue"),
        independentCashDue: t("history.finalCalculation.independentCashDue"),
        totalPayableDueNow: t("history.finalCalculation.totalPayableDueNow"),
        finalZakatDueRate: t("history.finalCalculation.finalZakatDueRate"),
        doubtfulExcludedNote: t("history.finalCalculation.doubtfulExcludedNote"),
      },
      groupedRows: {
        dueNowMoney: t("history.groupedRows.dueNowMoney"),
        dueNowSpecial: t("history.groupedRows.dueNowSpecial"),
        notDueYet: t("history.groupedRows.notDueYet"),
        debtAdjustment: t("history.groupedRows.debtAdjustment"),
        dueStatus: t("history.groupedRows.dueStatus"),
        dueNow: t("history.groupedRows.dueNow"),
        notDue: t("history.groupedRows.notDue"),
        unknown: t("history.groupedRows.unknown"),
        hawlDueDate: t("history.groupedRows.hawlDueDate"),
        eventDate: t("history.groupedRows.eventDate"),
      },
      quickRows: {
        cashBank: t("history.detailRows.cashBank"),
        goldSilver: t("history.detailRows.goldSilver"),
        debtsOwed: t("history.detailRows.debtsOwed"),
        netWealth: t("history.detailRows.netWealth"),
      },
      reminderRows: {
        calculationDate: t("history.reminders.calculationDate"),
        reminderScheduled: t("history.reminders.scheduled"),
        nextReminderDate: t("history.reminders.nextDate"),
        remindersDisabled: t("history.reminders.disabled"),
        reminderNotScheduled: t("history.reminders.notScheduled"),
        noUpcomingDueReminder: t("history.reminders.none"),
      },
      resolveCategoryLabel,
    });
    if (Platform.OS === "web") {
      const popup = globalThis.open?.("", "_blank");
      if (!popup) {
        Alert.alert(t("history.exportBlockedTitle"), t("history.exportBlockedBody"));
        return;
      }
      popup.document.write(html);
      popup.document.close();
      popup.focus();
      popup.print();
      return;
    }

    try {
      setIsExporting(true);
      const { printToFileAsync } = require("expo-print") as {
        printToFileAsync: (options: { html: string }) => Promise<{ uri: string }>;
      };
      const sharingModule = require("expo-sharing") as {
        isAvailableAsync: () => Promise<boolean>;
        shareAsync: (
          uri: string,
          options?: {
            mimeType?: string;
            dialogTitle?: string;
            UTI?: string;
          },
        ) => Promise<void>;
      };
      const file = await printToFileAsync({ html });
      const canShare = await sharingModule.isAvailableAsync();

      if (canShare) {
        await sharingModule.shareAsync(file.uri, {
          mimeType: "application/pdf",
          dialogTitle: t("history.exportPdf"),
          UTI: "com.adobe.pdf",
        });
        return;
      }

      Alert.alert(t("history.pdfCreatedTitle"), t("history.pdfCreatedBody", { uri: file.uri }));
    } catch (error) {
      console.error("Failed to export history PDF", error);
      Alert.alert(t("history.exportFailedTitle"), t("history.exportFailedBody"));
    } finally {
      setIsExporting(false);
    }
  };

  if (!hasLoaded) {
    return (
      <AppScreen contentContainerStyle={styles.screenContent}>
        <AppCard>
          <Text style={styles.missingBody}>{t("history.loadingDetails")}</Text>
        </AppCard>
      </AppScreen>
    );
  }

  if (!entry) {
    return (
      <AppScreen contentContainerStyle={styles.screenContent}>
        <AppCard>
          <Text style={styles.missingTitle}>{t("history.notFoundTitle")}</Text>
          <Text style={styles.missingBody}>{t("history.notFoundBody")}</Text>
          <SecondaryButton label={t("history.backToHistory")} onPress={handleBackToHistory} />
        </AppCard>
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.screenContent}>
      <AppHeader
        title={t("history.historyDetails")}
        subtitle={t(
          entry.flowType === "quick"
            ? "history.savedQuickSubtitle"
            : "history.savedDetailedSubtitle",
          { date: formatDate(entry.createdAt) },
        )}
      />

      <AppCard style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>{t("history.totalZakatDue")}</Text>
        <Text style={styles.summaryAmount}>{totalDisplay?.primaryDisplay ?? formatMoney(entry.totalZakat, entry.currency)}</Text>
        {totalDisplay?.suffixDisplay ? <Text style={styles.summarySuffix}>+ {totalDisplay.suffixDisplay}</Text> : null}
      </AppCard>

      <AppCard style={styles.categoriesCard}>
        <Text style={styles.sectionTitle}>{t("history.categoriesUsed")}</Text>
        <View style={[styles.categoryList, isRTL && styles.rowReverse]}>
          {entry.summary.categoriesUsed.map((category) => (
            <View key={category} style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{resolveCategoryLabel(category, category)}</Text>
            </View>
          ))}
        </View>
      </AppCard>

      <AppCard style={styles.snapshotCard}>
        <Text style={styles.sectionTitle}>{t("history.inputsSnapshot")}</Text>
        {detailRows.map((row) => {
          const formattedValue =
            typeof row.value === "number" &&
            row.label !== t("history.detailRows.assetCategories") &&
            row.label !== t("history.detailRows.lineItems")
              ? formatMoney(row.negative ? -Math.abs(row.value) : row.value, entry.currency)
              : `${row.value}`;

          return (
            <View key={row.label} style={[styles.snapshotRow, isRTL && styles.rowReverse]}>
              <Text style={[styles.snapshotRowLabel, row.emphasized && styles.snapshotRowLabelStrong]}>
                {row.label}
              </Text>
              <Text
                style={[
                  styles.snapshotRowValue,
                  row.negative && styles.snapshotNegativeValue,
                  row.emphasized && styles.snapshotStrongValue,
                ]}
              >
                {formattedValue}
              </Text>
            </View>
          );
        })}
        {detailedPayload?.calculationContext?.calculationDate ? (
          <View style={[styles.snapshotRow, isRTL && styles.rowReverse]}>
            <Text style={styles.snapshotRowLabel}>{t("history.reminders.calculationDate")}</Text>
            <Text style={styles.snapshotRowValue}>{detailedPayload.calculationContext.calculationDate}</Text>
          </View>
        ) : null}
      </AppCard>

      {detailedPayload ? (
        <AppCard style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>{t("history.lineItemBreakdown")}</Text>
          {detailedLineItemGroups.map((group) => (
            <View key={group.key} style={styles.groupSection}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              {group.items.map((item) => (
                <View key={item.id} style={styles.lineItem}>
                  <View style={[styles.lineItemHeader, isRTL && styles.rowReverse]}>
                    <Text style={styles.lineItemTitle}>
                      {resolveCategoryLabel(item.category, item.label)}
                    </Text>
                    <Text style={styles.lineItemAmount}>{formatMoney(item.totalZakat, entry.currency)}</Text>
                  </View>
                  {detailedPayload.finalCalculation?.hasDebtLineItem &&
                  ["salary", "agri_other", "trade_sector", "industrial_sector"].includes(item.category) ? (
                    <Text style={styles.lineItemMeta}>
                      {t("history.categoryZakatBeforeAdjustmentsValue", {
                        value: formatMoney(item.totalZakat, entry.currency),
                      })}
                    </Text>
                  ) : null}
                  {item.meta ? (
                    <Text style={styles.lineItemMeta}>
                      {t("history.groupedRows.dueStatus")}: {
                        resolveEligibilityDueStatus(item.meta) === "due_now"
                          ? t("history.groupedRows.dueNow")
                          : resolveEligibilityDueStatus(item.meta) === "unknown"
                            ? t("history.groupedRows.unknown")
                            : t("history.groupedRows.notDue")
                      }
                    </Text>
                  ) : null}
                  {item.meta?.hawlDueDate ? (
                    <Text style={styles.lineItemMeta}>
                      {t("history.groupedRows.hawlDueDate")}: {item.meta.hawlDueDate}
                    </Text>
                  ) : null}
                  {item.meta?.eventDate ? (
                    <Text style={styles.lineItemMeta}>
                      {t("history.groupedRows.eventDate")}: {item.meta.eventDate}
                    </Text>
                  ) : null}
                  <Text style={styles.lineItemMeta}>
                    {t("history.netWealthValue", {
                      value: formatMoney(item.totalWealth, entry.currency),
                    })}
                  </Text>
                  {item.details.map((detail) => (
                    <Text key={`${item.id}-${detail}`} style={styles.lineItemMeta}>
                      {detail}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          ))}
        </AppCard>
      ) : null}
      {detailedPayload ? (
        <AppCard style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>{t("history.reminders.title")}</Text>
          {detailedReminderState?.state === "scheduled" ? (
            <>
              <Text style={styles.lineItemMeta}>{t("history.reminders.scheduled")}</Text>
              <Text style={styles.lineItemMeta}>
                {t("history.reminders.nextDate")}: {detailedReminderState.reminderDate}
              </Text>
            </>
          ) : null}
          {detailedReminderState?.state === "disabled" ? (
            <>
              <Text style={styles.lineItemMeta}>{t("history.reminders.disabled")}</Text>
              <Text style={styles.lineItemMeta}>
                {t("history.reminders.nextDate")}: {detailedReminderState.reminderDate}
              </Text>
            </>
          ) : null}
          {detailedReminderState?.state === "not_scheduled" ? (
            <>
              <Text style={styles.lineItemMeta}>{t("history.reminders.notScheduled")}</Text>
              {detailedReminderState.reminderDate ? (
                <Text style={styles.lineItemMeta}>
                  {t("history.reminders.nextDate")}: {detailedReminderState.reminderDate}
                </Text>
              ) : null}
            </>
          ) : null}
          {detailedReminderState?.state === "none" ? (
            <Text style={styles.lineItemMeta}>{t("history.reminders.none")}</Text>
          ) : null}
        </AppCard>
      ) : null}
      {detailedPayload?.finalCalculation?.hasDebtLineItem ? (
        <AppCard style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>{t("history.finalCalculation.title")}</Text>
          <View style={[styles.snapshotRow, isRTL && styles.rowReverse]}>
            <Text style={styles.snapshotRowLabel}>{t("history.finalCalculation.debtAdjustmentTitle")}</Text>
          </View>
          <View style={[styles.snapshotRow, isRTL && styles.rowReverse]}>
            <Text style={styles.snapshotRowLabel}>{t("history.finalCalculation.collectibleReceivables")}</Text>
            <Text style={styles.snapshotRowValue}>
              {formatMoney(detailedPayload.finalCalculation.debtAdjustment.collectibleReceivablesCurrent, entry.currency)}
            </Text>
          </View>
          <View style={[styles.snapshotRow, isRTL && styles.rowReverse]}>
            <Text style={styles.snapshotRowLabel}>{t("history.finalCalculation.doubtfulReceivablesExcluded")}</Text>
            <Text style={styles.snapshotRowValue}>
              {formatMoney(detailedPayload.finalCalculation.debtAdjustment.doubtfulReceivables, entry.currency)}
            </Text>
          </View>
          <View style={[styles.snapshotRow, isRTL && styles.rowReverse]}>
            <Text style={styles.snapshotRowLabel}>{t("history.finalCalculation.debtsDueNow")}</Text>
            <Text style={[styles.snapshotRowValue, styles.snapshotNegativeValue]}>
              {formatMoney(-Math.abs(detailedPayload.finalCalculation.debtAdjustment.debtsYouOweDueNow), entry.currency)}
            </Text>
          </View>
          <View style={[styles.snapshotRow, isRTL && styles.rowReverse]}>
            <Text style={styles.snapshotRowLabel}>{t("history.finalCalculation.debtNetImpact")}</Text>
            <Text
              style={[
                styles.snapshotRowValue,
                detailedPayload.finalCalculation.debtAdjustment.netAdjustment < 0 ? styles.snapshotNegativeValue : null,
              ]}
            >
              {formatMoney(detailedPayload.finalCalculation.debtAdjustment.netAdjustment, entry.currency)}
            </Text>
          </View>
          <View style={[styles.snapshotRow, isRTL && styles.rowReverse]}>
            <Text style={[styles.snapshotRowLabel, styles.snapshotRowLabelStrong]}>
              {t("history.finalCalculation.finalZakatableBase")}
            </Text>
            <Text style={[styles.snapshotRowValue, styles.snapshotStrongValue]}>
              {formatMoney(detailedPayload.finalCalculation.finalZakatableBase, entry.currency)}
            </Text>
          </View>
          <View style={[styles.snapshotRow, isRTL && styles.rowReverse]}>
            <Text style={[styles.snapshotRowLabel, styles.snapshotRowLabelStrong]}>
              {t("history.finalCalculation.adjustedCashPoolDue")}
            </Text>
            <Text style={[styles.snapshotRowValue, styles.snapshotStrongValue]}>
              {formatMoney(
                detailedPayload.finalCalculation.adjustedCashPoolZakatDue ?? detailedPayload.finalCalculation.finalZakatDue,
                entry.currency,
              )}
            </Text>
          </View>
          <View style={[styles.snapshotRow, isRTL && styles.rowReverse]}>
            <Text style={styles.snapshotRowLabel}>{t("history.finalCalculation.independentCashDue")}</Text>
            <Text style={styles.snapshotRowValue}>
              {formatMoney(detailedPayload.finalCalculation.independentNonDebtAdjustableCashDue ?? 0, entry.currency)}
            </Text>
          </View>
          <View style={styles.snapshotRow}>
            <Text style={[styles.snapshotRowLabel, styles.snapshotRowLabelStrong]}>
              {t("history.finalCalculation.totalPayableDueNow")}
            </Text>
            <Text style={[styles.snapshotRowValue, styles.snapshotStrongValue]}>
              {formatMoney(detailedPayload.finalCalculation.finalZakatDue, entry.currency)}
            </Text>
          </View>
          <Text style={styles.lineItemMeta}>{t("history.finalCalculation.doubtfulExcludedNote")}</Text>
        </AppCard>
      ) : null}

      <SecondaryButton
        label={isExporting ? t("history.exporting") : t("history.exportPdf")}
        iconName="document-outline"
        disabled={isExporting}
        onPress={() => void handleExportPdf()}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingTop: appSpacing.sm,
    paddingHorizontal: appSpacing.md,
    paddingBottom: appSpacing.xl,
  },
  summaryCard: {
    backgroundColor: appColors.primary,
    alignItems: "center",
    paddingVertical: appSpacing.lg,
    gap: appSpacing.xs,
  },
  summaryLabel: {
    color: "#BEE2DD",
    fontSize: 15,
    fontWeight: "700",
  },
  summaryAmount: {
    color: "#FFFFFF",
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "900",
    textAlign: "center",
  },
  summarySuffix: {
    color: "#D8F1EC",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  categoriesCard: {
    gap: appSpacing.sm,
  },
  sectionTitle: {
    ...appTypography.body,
    fontWeight: "700",
    color: appColors.textPrimary,
  },
  categoryList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appSpacing.xs,
  },
  categoryChip: {
    borderRadius: appRadius.pill,
    backgroundColor: "#E8F1EF",
    paddingHorizontal: appSpacing.sm,
    paddingVertical: appSpacing.xs,
  },
  categoryChipText: {
    color: appColors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  snapshotCard: {
    gap: appSpacing.sm,
  },
  snapshotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: appSpacing.sm,
  },
  snapshotRowLabel: {
    ...appTypography.body,
    color: "#2C4B45",
    flex: 1,
  },
  snapshotRowLabelStrong: {
    fontWeight: "800",
  },
  snapshotRowValue: {
    ...appTypography.body,
    fontWeight: "700",
    color: "#244D46",
    textAlign: "right",
  },
  snapshotStrongValue: {
    color: appColors.primary,
    fontWeight: "900",
  },
  snapshotNegativeValue: {
    color: appColors.error,
  },
  breakdownCard: {
    gap: appSpacing.sm,
  },
  groupSection: {
    gap: appSpacing.xs,
  },
  groupTitle: {
    ...appTypography.caption,
    fontWeight: "800",
    color: appColors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  lineItem: {
    borderWidth: 1,
    borderColor: "#E1E8E4",
    borderRadius: appRadius.sm,
    padding: appSpacing.sm,
    gap: appSpacing.xxs,
  },
  lineItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: appSpacing.sm,
  },
  lineItemTitle: {
    ...appTypography.body,
    fontWeight: "700",
    flex: 1,
  },
  lineItemAmount: {
    ...appTypography.body,
    fontWeight: "800",
    color: appColors.primary,
  },
  lineItemMeta: {
    ...appTypography.caption,
    color: appColors.textSecondary,
  },
  missingTitle: {
    ...appTypography.section,
    fontSize: 22,
  },
  missingBody: {
    ...appTypography.body,
    color: appColors.textSecondary,
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
});

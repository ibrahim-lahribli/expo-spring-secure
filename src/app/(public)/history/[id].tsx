import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import {
  AppCard,
  AppHeader,
  AppScreen,
  SecondaryButton,
} from "../../../components/ui";
import { buildHistoryPdfHtml } from "../../../features/history/pdf";
import { getGuestHistoryEntryById } from "../../../features/history/storage";
import type { HistoryEntry } from "../../../features/history/types";
import { formatMoney } from "../../../lib/currency";
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

  const handleBackToHistory = () => {
    router.replace("/(public)/history");
  };

  const handleExportPdf = async () => {
    if (!entry || isExporting) return;

    const html = buildHistoryPdfHtml(entry);
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
        <Text style={styles.summaryAmount}>{formatMoney(entry.totalZakat, entry.currency)}</Text>
      </AppCard>

      <AppCard style={styles.categoriesCard}>
        <Text style={styles.sectionTitle}>{t("history.categoriesUsed")}</Text>
        <View style={styles.categoryList}>
          {entry.summary.categoriesUsed.map((category) => (
            <View key={category} style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{category}</Text>
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
            <View key={row.label} style={styles.snapshotRow}>
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
      </AppCard>

      {entry.payload.kind === "detailed" ? (
        <AppCard style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>{t("history.lineItemBreakdown")}</Text>
          {entry.payload.lineItems.map((item) => (
            <View key={item.id} style={styles.lineItem}>
              <View style={styles.lineItemHeader}>
                <Text style={styles.lineItemTitle}>{item.label}</Text>
                <Text style={styles.lineItemAmount}>{formatMoney(item.totalZakat, entry.currency)}</Text>
              </View>
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
});

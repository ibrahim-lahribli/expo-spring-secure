import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { I18nManager, Pressable, StyleSheet, Text, View } from "react-native";
import { upsertGuestHistoryEntry } from "../../../features/history/storage";
import type { HistoryEntry } from "../../../features/history/types";
import { formatMoney } from "../../../lib/currency";
import { useAppPreferencesStore } from "../../../store/appPreferencesStore";
import { useNisabSettingsStore } from "../../../store/nisabSettingsStore";
import { useQuickCalculationDraftStore } from "../../../store/quickCalculationDraftStore";
import { appColors, appRadius, appSpacing, appTypography } from "../../../theme/designSystem";
import { AppScreen, InfoNotice, PrimaryButton, SecondaryButton } from "../../../components/ui";

function toNumber(value: string | string[] | undefined): number {
  if (Array.isArray(value)) {
    return toNumber(value[0]);
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toParamString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return toParamString(value[0]);
  }
  return typeof value === "string" ? value : "";
}

export default function QuickCalculationResultScreen() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const isRTL = I18nManager.isRTL;
  const setDraft = useQuickCalculationDraftStore((state) => state.setDraft);
  const currency = useAppPreferencesStore((state) => state.currency);
  const params = useLocalSearchParams<{
    cash?: string;
    goldValue?: string;
    debt?: string;
    nisab?: string;
    totalWealth?: string;
    totalZakat?: string;
    hasZakatDue?: string;
  }>();
  const [saved, setSaved] = useState(false);

  const nisabMethod = useNisabSettingsStore((state) => state.nisabMethod);
  const silverPricePerGram = useNisabSettingsStore((state) => state.silverPricePerGram);
  const goldPricePerGram = useNisabSettingsStore((state) => state.goldPricePerGram);
  const nisabOverride = useNisabSettingsStore((state) => state.nisabOverride);

  const inputs = {
    cash: toNumber(params.cash),
    goldValue: toNumber(params.goldValue),
    debt: toNumber(params.debt),
  };

  const result = {
    nisab: toNumber(params.nisab),
    totalWealth: toNumber(params.totalWealth),
    totalZakat: toNumber(params.totalZakat),
    hasZakatDue: params.hasZakatDue === "1" || toNumber(params.totalZakat) > 0,
  };

  const saveToHistory = async () => {
    const now = new Date().toISOString();
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      flowType: "quick",
      createdAt: now,
      updatedAt: now,
      totalZakat: result.totalZakat,
      currency,
      nisabSnapshot: {
        method: nisabMethod,
        silverPricePerGram,
        goldPricePerGram,
        override: nisabOverride > 0 ? nisabOverride : null,
      },
      summary: {
        categoriesUsed: ["cash", "gold", "quick_debt"],
        itemCount: 3,
      },
      payload: {
        kind: "quick",
        inputs,
        result: {
          nisab: result.nisab,
          totalWealth: result.totalWealth,
          totalZakat: result.totalZakat,
          hasZakatDue: result.hasZakatDue,
        },
      },
    };

    await upsertGuestHistoryEntry(entry);
    setSaved(true);
  };

  const handleEditInputs = () => {
    setDraft({
      cash: toParamString(params.cash),
      goldValue: toParamString(params.goldValue),
      debt: toParamString(params.debt),
    });
    router.push("/calculate");
  };

  return (
    <AppScreen>
      <View style={styles.container}>
        <Text style={styles.heading}>{t("quickResult.title")}</Text>

        <View style={styles.resultCard}>
          <View
            style={[
              styles.statusPill,
              isRTL && styles.rowReverse,
              result.hasZakatDue ? styles.statusPillAbove : styles.statusPillBelow,
            ]}
          >
            <Ionicons name={result.hasZakatDue ? "checkmark-circle-outline" : "alert-circle-outline"} size={14} color="#fff" />
            <Text style={styles.statusText}>
              {result.hasZakatDue
                ? t("quickResult.status.above")
                : t("quickResult.status.below")}
            </Text>
          </View>

          <View style={[styles.row, isRTL && styles.rowReverse]}>
            <Text style={styles.label}>{t("quickResult.rows.netWealth")}</Text>
            <Text style={styles.value}>{formatMoney(result.totalWealth, currency)}</Text>
          </View>

          <View style={[styles.row, isRTL && styles.rowReverse]}>
            <Text style={styles.label}>{t("quickResult.rows.nisabThreshold")}</Text>
            <Text style={styles.value}>{formatMoney(result.nisab, currency)}</Text>
          </View>

          <View style={styles.totalWrap}>
            <Text style={styles.totalLabel}>{t("quickResult.rows.totalZakatDue")}</Text>
            <Text style={styles.totalValue}>{formatMoney(result.totalZakat, currency)}</Text>
          </View>

          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              {result.hasZakatDue
                ? t("quickResult.dueNotice")
                : t("quickResult.notDueNotice")}
            </Text>
          </View>
        </View>

        <PrimaryButton
          label={t("quickResult.actions.save")}
          iconName="save-outline"
          onPress={saveToHistory}
        />

        <SecondaryButton
          label={t("quickResult.actions.edit")}
          iconName="create-outline"
          onPress={handleEditInputs}
        />

        <Pressable onPress={() => router.push("/calculate/detailed/setup")} style={styles.linkWrap}>
          <Text style={styles.linkText}>{t("quickResult.actions.goToDetailed")}</Text>
        </Pressable>

        {saved ? (
          <InfoNotice
            title={t("quickResult.saved.title")}
            body={t("quickResult.saved.body")}
          />
        ) : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: appSpacing.md,
  },
  heading: {
    ...appTypography.section,
  },
  resultCard: {
    borderRadius: appRadius.md,
    borderWidth: 1,
    borderColor: "#7AB68E",
    backgroundColor: "#F5FBF7",
    padding: appSpacing.md,
    gap: appSpacing.sm,
  },
  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: appSpacing.xs,
    paddingHorizontal: appSpacing.sm,
    paddingVertical: appSpacing.xs,
    borderRadius: appRadius.pill,
  },
  statusPillAbove: {
    backgroundColor: appColors.success,
  },
  statusPillBelow: {
    backgroundColor: "#8A9A94",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: appSpacing.sm,
  },
  label: {
    ...appTypography.body,
    color: appColors.textSecondary,
  },
  value: {
    ...appTypography.body,
    fontWeight: "700",
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  totalWrap: {
    alignItems: "center",
    gap: appSpacing.xxs,
    paddingVertical: appSpacing.sm,
  },
  totalLabel: {
    ...appTypography.caption,
    fontWeight: "700",
    color: appColors.primary,
  },
  totalValue: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "800",
    color: appColors.accent,
  },
  notice: {
    borderRadius: appRadius.sm,
    backgroundColor: "#E6F4EB",
    padding: appSpacing.sm,
  },
  noticeText: {
    ...appTypography.caption,
    color: "#27563A",
  },
  linkWrap: {
    alignItems: "center",
    paddingVertical: appSpacing.xs,
  },
  linkText: {
    ...appTypography.body,
    color: appColors.primary,
    fontWeight: "600",
  },
});

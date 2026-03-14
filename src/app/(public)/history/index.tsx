import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { I18nManager, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Dialog, Portal } from "react-native-paper";
import { AppScreen, PrimaryButton } from "../../../components/ui";
import {
  deleteGuestHistoryEntry,
  getGuestHistoryEntries,
} from "../../../features/history/storage";
import { buildTotalDisplay, resolveNonCashDueSummary } from "../../../features/history/totalDisplay";
import type { HistoryEntry, HistoryFlowType } from "../../../features/history/types";
import { appColors, appRadius, appSpacing, appTypography } from "../../../theme/designSystem";

type FilterMode = "all" | HistoryFlowType;

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function HistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const isRTL = I18nManager.isRTL;
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [entryIdPendingDelete, setEntryIdPendingDelete] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    const data = await getGuestHistoryEntries();
    setEntries(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  const filteredEntries = useMemo(() => {
    if (filterMode === "all") return entries;
    return entries.filter((entry) => entry.flowType === filterMode);
  }, [entries, filterMode]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteGuestHistoryEntry(id);
    await loadHistory();
  }, [loadHistory]);

  const confirmDelete = useCallback((id: string) => {
    setEntryIdPendingDelete(id);
  }, []);

  const dismissDeleteDialog = useCallback(() => {
    setEntryIdPendingDelete(null);
  }, []);

  const submitDelete = useCallback(async () => {
    if (!entryIdPendingDelete) return;

    await handleDelete(entryIdPendingDelete);
    setEntryIdPendingDelete(null);
  }, [entryIdPendingDelete, handleDelete]);

  return (
    <AppScreen contentContainerStyle={styles.screenContent}>
      <View style={[styles.filterContainer, isRTL && styles.rowReverse]}>
        {(["all", "quick", "detailed"] as FilterMode[]).map((mode) => {
          const isActive = filterMode === mode;
          const label = t(`history.filters.${mode}`);
          return (
            <Pressable
              key={mode}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              onPress={() => setFilterMode(mode)}
            >
              <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {filteredEntries.map((entry) => {
        const totalDisplay = buildTotalDisplay({
          cashTotal: entry.totalZakat,
          currency: entry.currency,
          nonCashDue: resolveNonCashDueSummary(entry.summary.nonCashDue),
          labels: { kgUnit: t("history.kgUnit", { defaultValue: "kg" }) },
        });
        return (
          <View key={entry.id} style={styles.entryCard}>
            <View style={[styles.entryMetaRow, isRTL && styles.rowReverse]}>
              <View style={[styles.dateRow, isRTL && styles.rowReverse]}>
                <Ionicons name="calendar-outline" size={12} color={appColors.textSecondary} />
                <Text style={styles.metaText}>{formatDate(entry.createdAt)}</Text>
              </View>
            </View>

            <Text style={styles.entryTitle}>
              {entry.flowType === "quick"
                ? t("history.quickCalculation")
                : t("history.detailedCalculation")}
            </Text>
            <View style={[styles.amountRow, isRTL && styles.rowReverse]}>
              <Text style={styles.amountText}>{totalDisplay.primaryDisplay}</Text>
              {totalDisplay.suffixDisplay ? <Text style={styles.amountSuffix}>+ {totalDisplay.suffixDisplay}</Text> : null}
              <Text style={styles.amountMeta}>{t("history.zakatDue")}</Text>
            </View>

            <View style={[styles.actionsRow, isRTL && styles.rowReverse]}>
              <Pressable
                style={[styles.actionBtn, isRTL && styles.rowReverse]}
                onPress={() => router.push(`/(public)/history/${entry.id}` as never)}
              >
                <Ionicons name="eye-outline" size={14} color={appColors.textSecondary} />
                <Text style={styles.actionLabel}>{t("history.view")}</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.actionDeleteBtn, isRTL && styles.rowReverse]}
                onPress={() => confirmDelete(entry.id)}
              >
                <Ionicons name="trash-outline" size={14} color={appColors.error} />
                <Text style={styles.actionDeleteLabel}>{t("delete")}</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      {filteredEntries.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyStateLabel}>{t("history.emptyStateLabel")}</Text>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="folder-open-outline" size={24} color={appColors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t("history.emptyTitle")}</Text>
            <Text style={styles.emptyBody}>
              {t("history.emptyBody")}
            </Text>
            <PrimaryButton label={t("history.startQuickCalculation")} onPress={() => router.push("/(public)/calculate")} iconName="add-outline" />
          </View>
        </View>
      ) : null}

      <Portal>
        <Dialog visible={entryIdPendingDelete !== null} onDismiss={dismissDeleteDialog}>
          <Dialog.Title>{t("history.deleteDialog.title")}</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogBody}>{t("history.deleteDialog.body")}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={dismissDeleteDialog}>{t("cancel")}</Button>
            <Button textColor={appColors.error} onPress={() => void submitDelete()}>
              {t("delete")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingTop: appSpacing.sm,
  },
  filterContainer: {
    flexDirection: "row",
    borderRadius: appRadius.sm,
    backgroundColor: "#EEF1EF",
    padding: 4,
    gap: 4,
  },
  filterPill: {
    flex: 1,
    minHeight: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPillActive: {
    backgroundColor: "#FFFFFF",
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#74837D",
  },
  filterLabelActive: {
    color: "#24514A",
  },
  entryCard: {
    backgroundColor: appColors.surface,
    borderRadius: appRadius.sm,
    borderWidth: 1,
    borderColor: "#E3E8E5",
    padding: appSpacing.sm,
    gap: appSpacing.sm,
  },
  entryMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: appColors.textSecondary,
  },
  entryTitle: {
    ...appTypography.body,
    fontWeight: "700",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: appSpacing.xs,
  },
  amountText: {
    color: appColors.primary,
    fontSize: 30,
    fontWeight: "800",
  },
  amountSuffix: {
    color: appColors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  amountMeta: {
    color: appColors.textSecondary,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: appSpacing.xs,
  },
  actionBtn: {
    flex: 1,
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E4E9E6",
    backgroundColor: "#F9FBFA",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },
  actionDeleteBtn: {
    backgroundColor: "#FFF8F7",
    borderColor: "#F4D5D2",
  },
  actionLabel: {
    fontSize: 12,
    color: appColors.textSecondary,
    fontWeight: "600",
  },
  actionDeleteLabel: {
    fontSize: 12,
    color: appColors.error,
    fontWeight: "600",
  },
  dialogBody: {
    ...appTypography.body,
    color: appColors.textSecondary,
  },
  emptyStateLabel: {
    ...appTypography.caption,
    textAlign: "center",
    letterSpacing: 1.2,
  },
  emptyWrap: {
    gap: appSpacing.sm,
    marginTop: appSpacing.sm,
  },
  emptyCard: {
    borderRadius: appRadius.md,
    borderWidth: 1,
    borderColor: "#E1E7E3",
    backgroundColor: "#F8FAF9",
    padding: appSpacing.lg,
    alignItems: "center",
    gap: appSpacing.sm,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7F1EE",
  },
  emptyTitle: {
    ...appTypography.section,
    fontSize: 24,
  },
  emptyBody: {
    ...appTypography.body,
    textAlign: "center",
    color: appColors.textSecondary,
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
});

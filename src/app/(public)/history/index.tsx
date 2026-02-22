import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  deleteGuestHistoryEntry,
  duplicateGuestHistoryEntry,
  getGuestHistoryEntries,
} from "../../../features/history/storage";
import type { HistoryEntry, HistoryFlowType } from "../../../features/history/types";

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
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

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

  const handleDelete = async (id: string) => {
    await deleteGuestHistoryEntry(id);
    await loadHistory();
  };

  const handleDuplicate = async (id: string) => {
    await duplicateGuestHistoryEntry(id);
    await loadHistory();
  };

  const handleSignInPress = () => {
    router.push("/auth/login");
  };

  const renderCard = (entry: HistoryEntry) => {
    const flowLabel = entry.flowType === "quick" ? "Quick" : "Detailed";
    const summaryLabel = `${entry.summary.itemCount} categories - ${entry.summary.categoriesUsed.slice(0, 3).join(", ")}`;

    return (
      <View key={entry.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardDate}>{formatDate(entry.createdAt)}</Text>
          <Text style={styles.flowBadge}>{flowLabel}</Text>
        </View>
        <Text style={styles.cardTitle}>
          Total Zakat Due: {entry.currency} {entry.totalZakat.toFixed(2)}
        </Text>
        <Text style={styles.cardSummary}>{summaryLabel}</Text>
        <Text style={styles.cardMeta}>Nisab: {entry.nisabSnapshot.method}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/(public)/history/${entry.id}` as never)}
          >
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDuplicate(entry.id)}>
            <Text style={styles.actionButtonText}>Duplicate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteAction]}
            onPress={() =>
              Alert.alert("Delete entry?", "This removes this snapshot from this device only.", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => handleDelete(entry.id) },
              ])
            }
          >
            <Text style={[styles.actionButtonText, styles.deleteActionText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Saved on this device only</Text>
          <TouchableOpacity style={styles.ctaButton} onPress={handleSignInPress}>
            <Text style={styles.ctaButtonText}>Sign in to sync</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoLine}>Saved locally on this device</Text>
          <Text style={styles.infoLine}>Can view and recalculate</Text>
          <Text style={styles.infoLine}>Deleted if app is uninstalled or phone is changed</Text>
          <Text style={styles.infoLine}>Sign in to sync across devices</Text>
        </View>

        <View style={styles.segmentRow}>
          {(["all", "quick", "detailed"] as FilterMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.segmentButton, filterMode === mode && styles.segmentButtonActive]}
              onPress={() => setFilterMode(mode)}
            >
              <Text style={[styles.segmentLabel, filterMode === mode && styles.segmentLabelActive]}>
                {mode === "all" ? "All" : mode === "quick" ? "Quick" : "Detailed"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptyText}>Start a calculation and save it to build your local history.</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => router.push("/(public)/calculate")}>
              <Text style={styles.emptyButtonText}>Start Quick Calculation</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.emptyButton, styles.emptySecondaryButton]}
              onPress={() => router.push("/(public)/calculate/detailed")}
            >
              <Text style={styles.emptySecondaryButtonText}>Start Detailed Calculation</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredEntries.map(renderCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fb" },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  header: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e6ebf2", padding: 14 },
  title: { fontSize: 26, fontWeight: "700", color: "#132039" },
  subtitle: { marginTop: 4, color: "#4d5f80" },
  ctaButton: {
    marginTop: 12,
    backgroundColor: "#113f95",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10,
  },
  ctaButtonText: { color: "#fff", fontWeight: "700" },
  infoBox: {
    borderWidth: 1,
    borderColor: "#d7e4f7",
    backgroundColor: "#ecf4ff",
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  infoLine: { color: "#2f4466", fontSize: 13 },
  segmentRow: { flexDirection: "row", gap: 8 },
  segmentButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cdd8ea",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  segmentButtonActive: { backgroundColor: "#113f95", borderColor: "#113f95" },
  segmentLabel: { color: "#243a61", fontWeight: "600" },
  segmentLabelActive: { color: "#fff" },
  card: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e6ebf2", padding: 12, gap: 6 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardDate: { color: "#4d5f80", fontSize: 13 },
  flowBadge: {
    fontSize: 12,
    color: "#113f95",
    backgroundColor: "#e6efff",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontWeight: "600",
  },
  cardTitle: { color: "#12223d", fontWeight: "700", fontSize: 16 },
  cardSummary: { color: "#314a73", fontSize: 13 },
  cardMeta: { color: "#5f7396", fontSize: 12 },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 6 },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cdd8ea",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  actionButtonText: { color: "#1f3761", fontWeight: "600", fontSize: 13 },
  deleteAction: { borderColor: "#e7c9c9", backgroundColor: "#fff5f5" },
  deleteActionText: { color: "#af3030" },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6ebf2",
    padding: 16,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#132039" },
  emptyText: { color: "#4d5f80", textAlign: "center", marginTop: 4, marginBottom: 12 },
  emptyButton: {
    width: "100%",
    backgroundColor: "#113f95",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 8,
  },
  emptyButtonText: { color: "#fff", fontWeight: "700" },
  emptySecondaryButton: { backgroundColor: "#ecf4ff" },
  emptySecondaryButtonText: { color: "#113f95", fontWeight: "700" },
});

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getGuestHistoryEntryById } from "../../../features/history/storage";
import type { HistoryEntry } from "../../../features/history/types";

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

export default function HistoryDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) return;
      const found = await getGuestHistoryEntryById(id);
      if (mounted) setEntry(found);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const detailRows = useMemo(() => {
    if (!entry) return [];
    if (entry.payload.kind === "quick") {
      return [
        `Cash: ${entry.payload.inputs.cash.toFixed(2)}`,
        `Gold/Silver: ${entry.payload.inputs.goldValue.toFixed(2)}`,
        `Debt: ${entry.payload.inputs.debt.toFixed(2)}`,
        `Net wealth: ${entry.payload.result.totalWealth.toFixed(2)}`,
        `Nisab threshold: ${entry.payload.result.nisab.toFixed(2)}`,
      ];
    }

    return entry.payload.lineItems.map((item) => {
      const detail = item.details.length > 0 ? ` (${item.details.join(" | ")})` : "";
      return `${item.label}: ${item.totalZakat.toFixed(2)}${detail}`;
    });
  }, [entry]);

  if (!entry) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>History entry not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>History Details</Text>
        <Text style={styles.subtitle}>Read-only snapshot</Text>
        <Text style={styles.rowLabel}>Total Zakat</Text>
        <Text style={styles.totalValue}>
          {entry.currency} {entry.totalZakat.toFixed(2)}
        </Text>
        <Text style={styles.meta}>Date: {formatDate(entry.createdAt)}</Text>
        <Text style={styles.meta}>Flow: {entry.flowType === "quick" ? "Quick" : "Detailed"}</Text>
        <Text style={styles.meta}>Nisab method: {entry.nisabSnapshot.method}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Breakdown</Text>
        {detailRows.map((row, index) => (
          <Text key={`${row}-${index}`} style={styles.breakdownLine}>
            {row}
          </Text>
        ))}
      </View>

      <TouchableOpacity
        style={styles.recalculateButton}
        onPress={() => router.push(entry.flowType === "quick" ? "/(public)/calculate" : "/(public)/calculate/detailed")}
      >
        <Text style={styles.recalculateButtonText}>Recalculate</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fb" },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f5f7fb", padding: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#132039", marginBottom: 12 },
  backButton: { backgroundColor: "#113f95", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  backButtonText: { color: "#fff", fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6ebf2",
    borderRadius: 12,
    padding: 14,
  },
  title: { fontSize: 24, fontWeight: "700", color: "#132039" },
  subtitle: { color: "#4d5f80", marginTop: 2, marginBottom: 10 },
  rowLabel: { color: "#4d5f80", fontSize: 13 },
  totalValue: { color: "#132039", fontSize: 26, fontWeight: "700", marginTop: 2, marginBottom: 6 },
  meta: { color: "#314a73", fontSize: 13, marginBottom: 2 },
  sectionTitle: { color: "#132039", fontWeight: "700", fontSize: 16, marginBottom: 8 },
  breakdownLine: { color: "#314a73", fontSize: 13, marginBottom: 6 },
  recalculateButton: { backgroundColor: "#0a7d32", borderRadius: 10, alignItems: "center", paddingVertical: 12 },
  recalculateButtonText: { color: "#fff", fontWeight: "700" },
});

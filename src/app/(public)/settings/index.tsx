import React, { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { changeLanguage } from "../../../i18n/i18n";
import { fetchMockNisabPrices } from "../../../lib/mockNisabPricesApi";
import { useAppPreferencesStore } from "../../../store/appPreferencesStore";
import { useNisabSettingsStore } from "../../../store/nisabSettingsStore";

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SettingsScreen() {
  const nisabMethod = useNisabSettingsStore((s) => s.nisabMethod);
  const silverPricePerGram = useNisabSettingsStore((s) => s.silverPricePerGram);
  const goldPricePerGram = useNisabSettingsStore((s) => s.goldPricePerGram);
  const nisabOverride = useNisabSettingsStore((s) => s.nisabOverride);
  const setNisabMethod = useNisabSettingsStore((s) => s.setNisabMethod);
  const setSilverPricePerGram = useNisabSettingsStore((s) => s.setSilverPricePerGram);
  const setGoldPricePerGram = useNisabSettingsStore((s) => s.setGoldPricePerGram);
  const setNisabOverride = useNisabSettingsStore((s) => s.setNisabOverride);

  const nisabMethodPreference = useAppPreferencesStore((s) => s.nisabMethodPreference);
  const nisabPricesSource = useAppPreferencesStore((s) => s.nisabPricesSource);
  const customNisabEnabled = useAppPreferencesStore((s) => s.customNisabEnabled);
  const customNisabAmount = useAppPreferencesStore((s) => s.customNisabAmount);
  const currency = useAppPreferencesStore((s) => s.currency);
  const language = useAppPreferencesStore((s) => s.language);
  const datePreference = useAppPreferencesStore((s) => s.datePreference);
  const zakatReminderEnabled = useAppPreferencesStore((s) => s.zakatReminderEnabled);
  const theme = useAppPreferencesStore((s) => s.theme);
  const marketPricesLastUpdatedAt = useAppPreferencesStore(
    (s) => s.marketPricesLastUpdatedAt,
  );

  const setNisabMethodPreference = useAppPreferencesStore((s) => s.setNisabMethodPreference);
  const setNisabPricesSource = useAppPreferencesStore((s) => s.setNisabPricesSource);
  const setCustomNisabEnabled = useAppPreferencesStore((s) => s.setCustomNisabEnabled);
  const setCustomNisabAmount = useAppPreferencesStore((s) => s.setCustomNisabAmount);
  const setCurrency = useAppPreferencesStore((s) => s.setCurrency);
  const setLanguage = useAppPreferencesStore((s) => s.setLanguage);
  const setDatePreference = useAppPreferencesStore((s) => s.setDatePreference);
  const setZakatReminderEnabled = useAppPreferencesStore((s) => s.setZakatReminderEnabled);
  const setTheme = useAppPreferencesStore((s) => s.setTheme);
  const setMarketPricesLastUpdatedAt = useAppPreferencesStore(
    (s) => s.setMarketPricesLastUpdatedAt,
  );

  const [isFetchingPrices, setIsFetchingPrices] = useState(false);

  const recommendedMethod = "silver";

  const computedNisabValues = useMemo(() => {
    const silverNisab = silverPricePerGram * 595;
    const goldNisab = goldPricePerGram * 85;
    return { silverNisab, goldNisab };
  }, [silverPricePerGram, goldPricePerGram]);

  const effectiveMethodLabel =
    nisabMethodPreference === "auto" ? `Auto (${recommendedMethod})` : nisabMethod;

  const handleMethodChange = (value: "silver" | "gold" | "auto") => {
    setNisabMethodPreference(value);
    if (value === "auto") {
      setNisabMethod(recommendedMethod);
      return;
    }
    setNisabMethod(value);
  };

  const handleFetchMockPrices = async () => {
    setIsFetchingPrices(true);
    try {
      const response = await fetchMockNisabPrices();
      setGoldPricePerGram(response.goldPricePerGram);
      setSilverPricePerGram(response.silverPricePerGram);
      setMarketPricesLastUpdatedAt(response.fetchedAt);
    } finally {
      setIsFetchingPrices(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nisab Method</Text>
          <View style={styles.segmentRow}>
            {(["gold", "silver", "auto"] as const).map((option) => (
              <Pressable
                key={option}
                style={[
                  styles.segment,
                  nisabMethodPreference === option && styles.segmentActive,
                ]}
                onPress={() => handleMethodChange(option)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    nisabMethodPreference === option && styles.segmentTextActive,
                  ]}
                >
                  {option === "gold"
                    ? "Gold-based"
                    : option === "silver"
                      ? "Silver-based"
                      : "Auto"}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.helperText}>Effective method: {effectiveMethodLabel}</Text>
          {nisabMethodPreference === "auto" ? (
            <View style={styles.autoBox}>
              <Text style={styles.helperText}>
                Recommended: Silver (more inclusive threshold).
              </Text>
              <Text style={styles.helperText}>
                Silver Nisab: {formatCurrency(computedNisabValues.silverNisab, currency)}
              </Text>
              <Text style={styles.helperText}>
                Gold Nisab: {formatCurrency(computedNisabValues.goldNisab, currency)}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nisab Prices Source</Text>
          <View style={styles.segmentRow}>
            <Pressable
              style={[styles.segment, nisabPricesSource === "manual" && styles.segmentActive]}
              onPress={() => setNisabPricesSource("manual")}
            >
              <Text
                style={[
                  styles.segmentText,
                  nisabPricesSource === "manual" && styles.segmentTextActive,
                ]}
              >
                Manual entry
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segment, nisabPricesSource === "market" && styles.segmentActive]}
              onPress={() => setNisabPricesSource("market")}
            >
              <Text
                style={[
                  styles.segmentText,
                  nisabPricesSource === "market" && styles.segmentTextActive,
                ]}
              >
                Market source
              </Text>
            </Pressable>
          </View>
          {nisabPricesSource === "market" ? (
            <>
              <Pressable style={styles.primaryButton} onPress={handleFetchMockPrices}>
                <Text style={styles.primaryButtonText}>
                  {isFetchingPrices ? "Fetching prices..." : "Fetch Mock Gold/Silver Prices"}
                </Text>
              </Pressable>
              {marketPricesLastUpdatedAt ? (
                <Text style={styles.helperText}>
                  Last updated: {formatDate(marketPricesLastUpdatedAt)}
                </Text>
              ) : (
                <Text style={styles.helperText}>No market update fetched yet.</Text>
              )}
            </>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gold Price / Silver Price</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>Gold price ({currency}/g)</Text>
            <TextInput
              style={styles.input}
              value={String(goldPricePerGram)}
              onChangeText={(value) => setGoldPricePerGram(Number(value) || 0)}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>Silver price ({currency}/g)</Text>
            <TextInput
              style={styles.input}
              value={String(silverPricePerGram)}
              onChangeText={(value) => setSilverPricePerGram(Number(value) || 0)}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Nisab Override</Text>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Enable custom override</Text>
            <Switch
              value={customNisabEnabled}
              onValueChange={(enabled) => {
                setCustomNisabEnabled(enabled);
                setNisabOverride(enabled ? customNisabAmount : 0);
              }}
            />
          </View>
          <Text style={styles.helperText}>
            Helpful for local scholars/community standards.
          </Text>
          {customNisabEnabled ? (
            <View style={styles.fieldRow}>
              <Text style={styles.label}>Override amount ({currency})</Text>
              <TextInput
                style={styles.input}
                value={String(customNisabAmount || nisabOverride)}
                onChangeText={(value) => {
                  const amount = Number(value) || 0;
                  setCustomNisabAmount(amount);
                  setNisabOverride(amount);
                }}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Currency</Text>
          <View style={styles.segmentRow}>
            {(["USD", "EUR", "SAR", "PKR"] as const).map((option) => (
              <Pressable
                key={option}
                style={[styles.segment, currency === option && styles.segmentActive]}
                onPress={() => setCurrency(option)}
              >
                <Text style={[styles.segmentText, currency === option && styles.segmentTextActive]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <View style={styles.segmentRow}>
            {(
              [
                { label: "English", value: "en" },
                { label: "Arabic", value: "ar" },
                { label: "French", value: "fr" },
              ] as const
            ).map((option) => (
              <Pressable
                key={option.value}
                style={[styles.segment, language === option.value && styles.segmentActive]}
                onPress={async () => {
                  setLanguage(option.value);
                  await changeLanguage(option.value);
                }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    language === option.value && styles.segmentTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date Preference</Text>
          <View style={styles.segmentRow}>
            <Pressable
              style={[styles.segment, datePreference === "hijri" && styles.segmentActive]}
              onPress={() => setDatePreference("hijri")}
            >
              <Text
                style={[styles.segmentText, datePreference === "hijri" && styles.segmentTextActive]}
              >
                Hijri
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segment, datePreference === "gregorian" && styles.segmentActive]}
              onPress={() => setDatePreference("gregorian")}
            >
              <Text
                style={[
                  styles.segmentText,
                  datePreference === "gregorian" && styles.segmentTextActive,
                ]}
              >
                Gregorian
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zakat Reminder</Text>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Enable reminder</Text>
            <Switch
              value={zakatReminderEnabled}
              onValueChange={(value) => setZakatReminderEnabled(value)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme</Text>
          <View style={styles.segmentRow}>
            {(["system", "light", "dark"] as const).map((option) => (
              <Pressable
                key={option}
                style={[styles.segment, theme === option && styles.segmentActive]}
                onPress={() => setTheme(option)}
              >
                <Text style={[styles.segmentText, theme === option && styles.segmentTextActive]}>
                  {option[0].toUpperCase() + option.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f8fa",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  section: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  segment: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  segmentActive: {
    backgroundColor: "#1d4ed8",
    borderColor: "#1d4ed8",
  },
  segmentText: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 13,
  },
  segmentTextActive: {
    color: "#fff",
  },
  helperText: {
    color: "#475569",
    fontSize: 13,
  },
  autoBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  fieldRow: {
    gap: 6,
  },
  label: {
    color: "#0f172a",
    fontWeight: "600",
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0f172a",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  primaryButton: {
    backgroundColor: "#0f766e",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});


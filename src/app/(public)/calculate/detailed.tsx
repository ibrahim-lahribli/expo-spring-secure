import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  calculateSalaryZakat,
  type ZakatCalculationResult,
} from "../../../lib/zakat-calculation";
import { getNisabBreakdown } from "../../../lib/zakat-calculation/nisab";
import { useNisabSettingsStore } from "../../../store/nisabSettingsStore";

const DEFAULT_SILVER_PRICE_PER_GRAM = 12;
const DEFAULT_GOLD_PRICE_PER_GRAM = 800;

type DraftValue = {
  value?: number;
  isValid: boolean;
};

export default function DetailedCalculateScreen() {
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [livingExpense, setLivingExpense] = useState("");
  const nisabMethod = useNisabSettingsStore((state) => state.nisabMethod);
  const silverPricePerGram = useNisabSettingsStore((state) => state.silverPricePerGram);
  const goldPricePerGram = useNisabSettingsStore((state) => state.goldPricePerGram);
  const nisabOverride = useNisabSettingsStore((state) => state.nisabOverride);
  const setNisabMethod = useNisabSettingsStore((state) => state.setNisabMethod);
  const setSilverPricePerGram = useNisabSettingsStore(
    (state) => state.setSilverPricePerGram,
  );
  const setGoldPricePerGram = useNisabSettingsStore(
    (state) => state.setGoldPricePerGram,
  );
  const setNisabOverride = useNisabSettingsStore((state) => state.setNisabOverride);
  const [isNisabAdvancedOpen, setIsNisabAdvancedOpen] = useState(false);
  const [draftNisabMethod, setDraftNisabMethod] = useState(nisabMethod);
  const [draftSilverPriceInput, setDraftSilverPriceInput] = useState("");
  const [draftGoldPriceInput, setDraftGoldPriceInput] = useState("");
  const [draftNisabOverrideInput, setDraftNisabOverrideInput] = useState("");
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [result, setResult] = useState<ZakatCalculationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const parseNonNegative = (value: string): number => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0;
    }
    return parsed;
  };

  const parseOptionalPositive = (value: string): number | undefined => {
    if (!value.trim()) {
      return undefined;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return undefined;
    }
    return parsed;
  };

  const parseDraftOptionalPositive = (value: string): DraftValue => {
    if (!value.trim()) {
      return { value: undefined, isValid: true };
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return { value: undefined, isValid: false };
    }
    return { value: parsed, isValid: true };
  };

  const syncDraftWithSaved = () => {
    setDraftNisabMethod(nisabMethod);
    setDraftSilverPriceInput(silverPricePerGram > 0 ? String(silverPricePerGram) : "");
    setDraftGoldPriceInput(goldPricePerGram > 0 ? String(goldPricePerGram) : "");
    setDraftNisabOverrideInput(nisabOverride > 0 ? String(nisabOverride) : "");
  };

  useEffect(() => {
    if (!isNisabAdvancedOpen) {
      syncDraftWithSaved();
    }
  }, [
    nisabMethod,
    silverPricePerGram,
    goldPricePerGram,
    nisabOverride,
    isNisabAdvancedOpen,
  ]);

  useEffect(() => {
    if (!showSavedToast) {
      return;
    }
    const timeout = setTimeout(() => setShowSavedToast(false), 1800);
    return () => clearTimeout(timeout);
  }, [showSavedToast]);

  const calculateResultWithSavedSettings = () =>
    calculateSalaryZakat({
      nisabMethod,
      silverPricePerGram: silverPricePerGram > 0 ? silverPricePerGram : undefined,
      goldPricePerGram: goldPricePerGram > 0 ? goldPricePerGram : undefined,
      nisabOverride: nisabOverride > 0 ? nisabOverride : undefined,
      salary: {
        monthlyIncome: parseNonNegative(monthlyIncome),
        livingExpense: parseOptionalPositive(livingExpense),
      },
    });

  useEffect(() => {
    if (!result) {
      return;
    }
    setResult(calculateResultWithSavedSettings());
  }, [nisabMethod, silverPricePerGram, goldPricePerGram, nisabOverride]);

  const savedNisabBreakdown = useMemo(
    () =>
      getNisabBreakdown({
        nisabMethod,
        silverPricePerGram,
        goldPricePerGram,
        nisabOverride,
      }),
    [nisabMethod, silverPricePerGram, goldPricePerGram, nisabOverride],
  );

  const draftSilverParsed = parseDraftOptionalPositive(draftSilverPriceInput);
  const draftGoldParsed = parseDraftOptionalPositive(draftGoldPriceInput);
  const draftOverrideParsed = parseDraftOptionalPositive(draftNisabOverrideInput);
  const advancedFormValid =
    draftSilverParsed.isValid &&
    draftGoldParsed.isValid &&
    draftOverrideParsed.isValid;
  const silverToSave = draftSilverParsed.value ?? DEFAULT_SILVER_PRICE_PER_GRAM;
  const goldToSave = draftGoldParsed.value ?? DEFAULT_GOLD_PRICE_PER_GRAM;
  const overrideToSave = draftOverrideParsed.value ?? 0;
  const isNisabDirty =
    draftNisabMethod !== nisabMethod ||
    silverToSave !== silverPricePerGram ||
    goldToSave !== goldPricePerGram ||
    overrideToSave !== nisabOverride;
  const saveDisabled = !advancedFormValid || !isNisabDirty;

  const handleNisabMethodChange = (method: "silver" | "gold") => {
    if (isNisabAdvancedOpen) {
      setDraftNisabMethod(method);
      return;
    }
    setNisabMethod(method);
  };

  const handleSaveNisabSettings = () => {
    if (saveDisabled) {
      return;
    }
    setNisabMethod(draftNisabMethod);
    setSilverPricePerGram(silverToSave);
    setGoldPricePerGram(goldToSave);
    setNisabOverride(overrideToSave);
    setIsNisabAdvancedOpen(false);
    setShowSavedToast(true);
  };

  const handleCancelNisabSettings = () => {
    syncDraftWithSaved();
    setIsNisabAdvancedOpen(false);
  };

  const handleCalculate = () => {
    setValidationError(null);
    setResult(null);

    const monthlyIncomeValue = parseNonNegative(monthlyIncome);
    if (monthlyIncomeValue <= 0) {
      setValidationError("Please enter your monthly income.");
      return;
    }

    setResult(calculateResultWithSavedSettings());
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Detailed Calculate</Text>
      <Text style={styles.subtitle}>Salary category only</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Nisab Settings</Text>
        <View style={styles.compactHeaderRow}>
          <View style={styles.compactSegmentRow}>
            <Pressable
              style={[
                styles.compactSegmentBtn,
                (isNisabAdvancedOpen ? draftNisabMethod : nisabMethod) === "silver" &&
                  styles.compactSegmentBtnActive,
              ]}
              onPress={() => handleNisabMethodChange("silver")}
            >
              <Text
                style={[
                  styles.compactSegmentText,
                  (isNisabAdvancedOpen ? draftNisabMethod : nisabMethod) === "silver" &&
                    styles.compactSegmentTextActive,
                ]}
              >
                Silver
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.compactSegmentBtn,
                (isNisabAdvancedOpen ? draftNisabMethod : nisabMethod) === "gold" &&
                  styles.compactSegmentBtnActive,
              ]}
              onPress={() => handleNisabMethodChange("gold")}
            >
              <Text
                style={[
                  styles.compactSegmentText,
                  (isNisabAdvancedOpen ? draftNisabMethod : nisabMethod) === "gold" &&
                    styles.compactSegmentTextActive,
                ]}
              >
                Gold
              </Text>
            </Pressable>
          </View>
          <Pressable
            hitSlop={8}
            onPress={() => setIsNisabAdvancedOpen((prev) => !prev)}
          >
            <Text style={styles.advancedBtnText}>
              {isNisabAdvancedOpen ? "Collapse" : "Advanced"}
            </Text>
          </Pressable>
        </View>

        {!isNisabAdvancedOpen ? (
          <Text style={styles.compactCaption}>{savedNisabBreakdown.shortSummary}</Text>
        ) : (
          <View>
            <Text style={styles.label}>Silver Price per Gram (optional)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={draftSilverPriceInput}
              onChangeText={setDraftSilverPriceInput}
              placeholder="12"
            />

            <Text style={styles.label}>Gold Price per Gram (optional)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={draftGoldPriceInput}
              onChangeText={setDraftGoldPriceInput}
              placeholder="800"
            />

            <Text style={styles.label}>Nisab Override (optional)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={draftNisabOverrideInput}
              onChangeText={setDraftNisabOverrideInput}
              placeholder="0.00"
            />

            {!advancedFormValid ? (
              <Text style={styles.inlineErrorText}>
                Use a positive number or leave optional fields empty.
              </Text>
            ) : null}

            <View style={styles.nisabActionsRow}>
              <TouchableOpacity
                style={[styles.saveBtn, saveDisabled && styles.saveBtnDisabled]}
                onPress={handleSaveNisabSettings}
                disabled={saveDisabled}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
              <Pressable onPress={handleCancelNisabSettings}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Salary</Text>

        <Text style={styles.label}>Monthly Income</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={monthlyIncome}
          onChangeText={setMonthlyIncome}
          placeholder="0.00"
        />

        <Text style={styles.label}>Monthly Living Expense (optional)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={livingExpense}
          onChangeText={setLivingExpense}
          placeholder="3266"
        />
      </View>

      {validationError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{validationError}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.calculateBtn} onPress={handleCalculate}>
        <Text style={styles.calculateBtnText}>Calculate Zakat</Text>
      </TouchableOpacity>

      {result ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Salary Result</Text>
          <Row label="Nisab Threshold" value={result.nisab} />
          <View style={styles.nisabBreakdownSection}>
            <Text style={styles.nisabBreakdownTitle}>How this was calculated</Text>
            <Text style={styles.nisabBreakdownText}>
              {savedNisabBreakdown.detailSummary}
            </Text>
          </View>
          <Row label="Net Yearly Wealth" value={result.totalWealth} />
          <Row label="Total Zakat Due" value={result.totalZakat} />
          {!result.hasZakatDue ? (
            <Text style={styles.infoText}>
              No Zakat is due because your net wealth is below Nisab.
            </Text>
          ) : null}
        </View>
      ) : null}
      {showSavedToast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>Nisab settings saved</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: "700", color: "#1a1a1a" },
  subtitle: { marginTop: 4, marginBottom: 12, color: "#666", fontSize: 14 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ececec",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f1f1f",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: "#fff",
    color: "#111",
    marginBottom: 12,
  },
  compactHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  compactSegmentRow: {
    flexDirection: "row",
    flex: 1,
    marginRight: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
  },
  compactSegmentBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
  },
  compactSegmentBtnActive: {
    backgroundColor: "#EBF4FF",
  },
  compactSegmentText: { color: "#666", fontWeight: "600" },
  compactSegmentTextActive: { color: "#007AFF" },
  advancedBtnText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  compactCaption: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  inlineErrorText: {
    marginTop: -4,
    marginBottom: 10,
    color: "#C30000",
    fontSize: 12,
  },
  nisabActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  saveBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  saveBtnDisabled: {
    backgroundColor: "#9EC8FF",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  cancelBtnText: {
    color: "#666",
    fontWeight: "600",
  },
  errorBox: {
    backgroundColor: "#FFF3F3",
    borderWidth: 1,
    borderColor: "#FFC9C9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: "#C30000", fontWeight: "600" },
  calculateBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 14,
    marginBottom: 12,
  },
  calculateBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ececec",
  },
  resultTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rowLabel: { color: "#444", fontSize: 14 },
  rowValue: { color: "#1a1a1a", fontSize: 14, fontWeight: "700" },
  nisabBreakdownSection: {
    marginBottom: 8,
  },
  nisabBreakdownTitle: {
    fontSize: 13,
    color: "#555",
    marginBottom: 2,
    fontWeight: "600",
  },
  nisabBreakdownText: {
    fontSize: 13,
    color: "#666",
  },
  infoText: {
    marginTop: 4,
    fontSize: 13,
    color: "#666",
  },
  toast: {
    position: "absolute",
    bottom: 18,
    left: 16,
    right: 16,
    backgroundColor: "#1f1f1f",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  toastText: {
    color: "#fff",
    fontWeight: "600",
  },
});

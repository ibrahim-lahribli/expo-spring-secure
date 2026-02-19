import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  calculateSalaryZakat,
  type NisabMethod,
  type ZakatCalculationResult,
} from "../../../lib/zakat-calculation";

export default function DetailedCalculateScreen() {
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [livingExpense, setLivingExpense] = useState("");
  const [nisabMethod, setNisabMethod] = useState<NisabMethod>("silver");
  const [silverPricePerGram, setSilverPricePerGram] = useState("");
  const [goldPricePerGram, setGoldPricePerGram] = useState("");
  const [nisabOverride, setNisabOverride] = useState("");
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

  const handleCalculate = () => {
    setValidationError(null);
    setResult(null);

    const monthlyIncomeValue = parseNonNegative(monthlyIncome);
    if (monthlyIncomeValue <= 0) {
      setValidationError("Please enter your monthly income.");
      return;
    }

    const calculationResult = calculateSalaryZakat({
      nisabMethod,
      silverPricePerGram: parseOptionalPositive(silverPricePerGram),
      goldPricePerGram: parseOptionalPositive(goldPricePerGram),
      nisabOverride: parseOptionalPositive(nisabOverride),
      salary: {
        monthlyIncome: monthlyIncomeValue,
        livingExpense: parseOptionalPositive(livingExpense),
      },
    });

    setResult(calculationResult);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Detailed Calculate</Text>
      <Text style={styles.subtitle}>Salary category only</Text>

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

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Nisab Settings</Text>
        <View style={styles.methodRow}>
          <TouchableOpacity
            style={[
              styles.methodBtn,
              nisabMethod === "silver" && styles.methodBtnActive,
            ]}
            onPress={() => setNisabMethod("silver")}
          >
            <Text
              style={[
                styles.methodBtnText,
                nisabMethod === "silver" && styles.methodBtnTextActive,
              ]}
            >
              Silver
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.methodBtn,
              nisabMethod === "gold" && styles.methodBtnActive,
            ]}
            onPress={() => setNisabMethod("gold")}
          >
            <Text
              style={[
                styles.methodBtnText,
                nisabMethod === "gold" && styles.methodBtnTextActive,
              ]}
            >
              Gold
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Silver Price per Gram (optional)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={silverPricePerGram}
          onChangeText={setSilverPricePerGram}
          placeholder="12"
        />

        <Text style={styles.label}>Gold Price per Gram (optional)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={goldPricePerGram}
          onChangeText={setGoldPricePerGram}
          placeholder="800"
        />

        <Text style={styles.label}>Nisab Override (optional)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={nisabOverride}
          onChangeText={setNisabOverride}
          placeholder="0.00"
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
          <Row label="Net Yearly Wealth" value={result.totalWealth} />
          <Row label="Total Zakat Due" value={result.totalZakat} />
          {!result.hasZakatDue ? (
            <Text style={styles.infoText}>
              No Zakat is due because your net wealth is below Nisab.
            </Text>
          ) : null}
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
    marginBottom: 10,
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
  methodRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  methodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  methodBtnActive: {
    borderColor: "#007AFF",
    backgroundColor: "#EBF4FF",
  },
  methodBtnText: { color: "#666", fontWeight: "600" },
  methodBtnTextActive: { color: "#007AFF" },
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
  infoText: {
    marginTop: 4,
    fontSize: 13,
    color: "#666",
  },
});

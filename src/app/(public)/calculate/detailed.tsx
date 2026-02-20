import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
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
import { calculateNisab, getNisabBreakdown } from "../../../lib/zakat-calculation/nisab";
import { useNisabSettingsStore } from "../../../store/nisabSettingsStore";

const DEFAULT_SILVER_PRICE_PER_GRAM = 12;
const DEFAULT_GOLD_PRICE_PER_GRAM = 800;
const LIVESTOCK_UNIT_VALUE = 1200;
const STANDARD_ZAKAT_RATE = 0.025;

type DraftValue = {
  value?: number;
  isValid: boolean;
};

type CategoryId = "salary" | "livestock";

type SalaryValues = {
  monthlyIncome: string;
  livingExpense: string;
};

type LivestockValues = {
  animalCount: string;
};

type CategoryValuesMap = {
  salary: SalaryValues;
  livestock: LivestockValues;
};

type SalaryLineItem = {
  id: string;
  category: "salary";
  values: SalaryValues;
  result: ZakatCalculationResult;
};

type LivestockLineItem = {
  id: string;
  category: "livestock";
  values: LivestockValues;
  result: ZakatCalculationResult;
};

type LineItem = SalaryLineItem | LivestockLineItem;

type NisabSettingsSnapshot = {
  nisabMethod: "silver" | "gold";
  silverPricePerGram: number;
  goldPricePerGram: number;
  nisabOverride: number;
};

type CategoryDefinition<K extends CategoryId> = {
  label: string;
  defaultValues: CategoryValuesMap[K];
  validate: (values: CategoryValuesMap[K]) => string | null;
  calculate: (
    values: CategoryValuesMap[K],
    nisabSettings: NisabSettingsSnapshot,
  ) => ZakatCalculationResult;
};

const CATEGORY_ORDER: CategoryId[] = ["salary", "livestock"];

const CATEGORY_DEFS: { [K in CategoryId]: CategoryDefinition<K> } = {
  salary: {
    label: "Salary",
    defaultValues: {
      monthlyIncome: "",
      livingExpense: "",
    },
    validate: (values) => {
      const monthlyIncomeValue = Number(values.monthlyIncome);
      if (!Number.isFinite(monthlyIncomeValue) || monthlyIncomeValue <= 0) {
        return "Please enter your monthly income.";
      }
      return null;
    },
    calculate: (values, nisabSettings) =>
      calculateSalaryZakat({
        nisabMethod: nisabSettings.nisabMethod,
        silverPricePerGram:
          nisabSettings.silverPricePerGram > 0
            ? nisabSettings.silverPricePerGram
            : undefined,
        goldPricePerGram:
          nisabSettings.goldPricePerGram > 0 ? nisabSettings.goldPricePerGram : undefined,
        nisabOverride: nisabSettings.nisabOverride > 0 ? nisabSettings.nisabOverride : undefined,
        salary: {
          monthlyIncome: parseNonNegative(values.monthlyIncome),
          livingExpense: parseOptionalPositive(values.livingExpense),
        },
      }),
  },
  livestock: {
    label: "Livestock (mock)",
    defaultValues: {
      animalCount: "",
    },
    validate: (values) => {
      const animalCount = Number(values.animalCount);
      if (!Number.isFinite(animalCount) || animalCount <= 0) {
        return "Please enter a livestock count greater than zero.";
      }
      return null;
    },
    calculate: (values, nisabSettings) => {
      const animalCount = parseNonNegative(values.animalCount);
      const totalWealth = animalCount * LIVESTOCK_UNIT_VALUE;
      const nisab = calculateNisab({
        nisabMethod: nisabSettings.nisabMethod,
        silverPricePerGram:
          nisabSettings.silverPricePerGram > 0
            ? nisabSettings.silverPricePerGram
            : undefined,
        goldPricePerGram:
          nisabSettings.goldPricePerGram > 0 ? nisabSettings.goldPricePerGram : undefined,
        nisabOverride: nisabSettings.nisabOverride > 0 ? nisabSettings.nisabOverride : undefined,
      });
      const totalZakat = totalWealth >= nisab ? totalWealth * STANDARD_ZAKAT_RATE : 0;

      return {
        nisab,
        totalWealth,
        totalZakat,
        hasZakatDue: totalZakat > 0,
        breakdown: {},
      };
    },
  },
};

function parseNonNegative(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function parseOptionalPositive(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

function buildLineItemId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getInitialValuesByCategory(): CategoryValuesMap {
  return {
    salary: { ...CATEGORY_DEFS.salary.defaultValues },
    livestock: { ...CATEGORY_DEFS.livestock.defaultValues },
  };
}

function recalculateLineItem(
  item: LineItem,
  nisabSettings: NisabSettingsSnapshot,
): ZakatCalculationResult {
  if (item.category === "salary") {
    return CATEGORY_DEFS.salary.calculate(item.values, nisabSettings);
  }
  return CATEGORY_DEFS.livestock.calculate(item.values, nisabSettings);
}

export default function DetailedCalculateScreen() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("salary");
  const [valuesByCategory, setValuesByCategory] = useState<CategoryValuesMap>(
    getInitialValuesByCategory(),
  );
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);
  const nisabMethod = useNisabSettingsStore((state) => state.nisabMethod);
  const silverPricePerGram = useNisabSettingsStore((state) => state.silverPricePerGram);
  const goldPricePerGram = useNisabSettingsStore((state) => state.goldPricePerGram);
  const nisabOverride = useNisabSettingsStore((state) => state.nisabOverride);
  const setNisabMethod = useNisabSettingsStore((state) => state.setNisabMethod);
  const setSilverPricePerGram = useNisabSettingsStore(
    (state) => state.setSilverPricePerGram,
  );
  const setGoldPricePerGram = useNisabSettingsStore((state) => state.setGoldPricePerGram);
  const setNisabOverride = useNisabSettingsStore((state) => state.setNisabOverride);
  const [isNisabAdvancedOpen, setIsNisabAdvancedOpen] = useState(false);
  const [draftNisabMethod, setDraftNisabMethod] = useState(nisabMethod);
  const [draftSilverPriceInput, setDraftSilverPriceInput] = useState("");
  const [draftGoldPriceInput, setDraftGoldPriceInput] = useState("");
  const [draftNisabOverrideInput, setDraftNisabOverrideInput] = useState("");
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

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

  const nisabSettings = useMemo(
    () => ({
      nisabMethod,
      silverPricePerGram,
      goldPricePerGram,
      nisabOverride,
    }),
    [nisabMethod, silverPricePerGram, goldPricePerGram, nisabOverride],
  );

  useEffect(() => {
    if (lineItems.length === 0) {
      return;
    }
    setLineItems((prev) =>
      prev.map((item) => ({
        ...item,
        result: recalculateLineItem(item, nisabSettings),
      })),
    );
  }, [nisabSettings, lineItems.length]);

  const combinedTotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.result.totalZakat, 0),
    [lineItems],
  );

  const draftSilverParsed = parseDraftOptionalPositive(draftSilverPriceInput);
  const draftGoldParsed = parseDraftOptionalPositive(draftGoldPriceInput);
  const draftOverrideParsed = parseDraftOptionalPositive(draftNisabOverrideInput);
  const advancedFormValid =
    draftSilverParsed.isValid && draftGoldParsed.isValid && draftOverrideParsed.isValid;
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

  const resetCategoryForm = (category: CategoryId) => {
    if (category === "salary") {
      setValuesByCategory((prev) => ({
        ...prev,
        salary: { ...CATEGORY_DEFS.salary.defaultValues },
      }));
      return;
    }
    setValuesByCategory((prev) => ({
      ...prev,
      livestock: { ...CATEGORY_DEFS.livestock.defaultValues },
    }));
  };

  const handleSelectCategory = (category: CategoryId) => {
    setActiveCategory(category);
    resetCategoryForm(category);
    setValidationError(null);
    setIsCategoryPickerVisible(false);
  };

  const handleCalculate = () => {
    setValidationError(null);

    if (activeCategory === "salary") {
      const salaryValues = valuesByCategory.salary;
      const maybeError = CATEGORY_DEFS.salary.validate(salaryValues);
      if (maybeError) {
        setValidationError(maybeError);
        return;
      }
      const result = CATEGORY_DEFS.salary.calculate(salaryValues, nisabSettings);
      setLineItems((prev) => [
        ...prev,
        {
          id: buildLineItemId(),
          category: "salary",
          values: { ...salaryValues },
          result,
        },
      ]);
      return;
    }

    const livestockValues = valuesByCategory.livestock;
    const maybeError = CATEGORY_DEFS.livestock.validate(livestockValues);
    if (maybeError) {
      setValidationError(maybeError);
      return;
    }
    const result = CATEGORY_DEFS.livestock.calculate(livestockValues, nisabSettings);
    setLineItems((prev) => [
      ...prev,
      {
        id: buildLineItemId(),
        category: "livestock",
        values: { ...livestockValues },
        result,
      },
    ]);
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Detailed Calculate</Text>
      <Text style={styles.subtitle}>Single active form with stacked category results</Text>

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
          <Pressable hitSlop={8} onPress={() => setIsNisabAdvancedOpen((prev) => !prev)}>
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
        <Text style={styles.sectionTitle}>Category</Text>
        <Pressable style={styles.categoryPickerBtn} onPress={() => setIsCategoryPickerVisible(true)}>
          <Text style={styles.categoryPickerText}>{CATEGORY_DEFS[activeCategory].label}</Text>
          <Text style={styles.categoryPickerAction}>Change</Text>
        </Pressable>

        {activeCategory === "salary" ? (
          <>
            <Text style={styles.label}>Monthly Income</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={valuesByCategory.salary.monthlyIncome}
              onChangeText={(text) =>
                setValuesByCategory((prev) => ({
                  ...prev,
                  salary: { ...prev.salary, monthlyIncome: text },
                }))
              }
              placeholder="0.00"
            />

            <Text style={styles.label}>Monthly Living Expense (optional)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={valuesByCategory.salary.livingExpense}
              onChangeText={(text) =>
                setValuesByCategory((prev) => ({
                  ...prev,
                  salary: { ...prev.salary, livingExpense: text },
                }))
              }
              placeholder="3266"
            />
          </>
        ) : null}

        {activeCategory === "livestock" ? (
          <>
            <Text style={styles.label}>Number of Livestock (mock)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={valuesByCategory.livestock.animalCount}
              onChangeText={(text) =>
                setValuesByCategory((prev) => ({
                  ...prev,
                  livestock: { ...prev.livestock, animalCount: text },
                }))
              }
              placeholder="0"
            />
            <Text style={styles.compactCaption}>
              Mock category: each animal is treated as 1200 in wealth value.
            </Text>
          </>
        ) : null}
      </View>

      {validationError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{validationError}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.calculateBtn} onPress={handleCalculate}>
        <Text style={styles.calculateBtnText}>Calculate Zakat</Text>
      </TouchableOpacity>

      {lineItems.length > 0 ? (
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => setIsCategoryPickerVisible(true)}
        >
          <Text style={styles.secondaryBtnText}>Add another category</Text>
        </TouchableOpacity>
      ) : null}

      {lineItems.length > 0 ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Category Breakdown</Text>
          <View style={styles.nisabBreakdownSection}>
            <Text style={styles.nisabBreakdownTitle}>How this was calculated</Text>
            <Text style={styles.nisabBreakdownText}>{savedNisabBreakdown.detailSummary}</Text>
          </View>

          {lineItems.map((item) => (
            <View key={item.id} style={styles.lineItemCard}>
              <View style={styles.lineItemHeader}>
                <Text style={styles.lineItemTitle}>{CATEGORY_DEFS[item.category].label}</Text>
                <Pressable onPress={() => handleRemoveLineItem(item.id)}>
                  <Text style={styles.removeBtnText}>Remove</Text>
                </Pressable>
              </View>
              <Row label="Nisab Threshold" value={item.result.nisab} />
              <Row label="Net Wealth" value={item.result.totalWealth} />
              <Row label="Zakat Due" value={item.result.totalZakat} />
              {!item.result.hasZakatDue ? (
                <Text style={styles.infoText}>Below nisab. Zakat due is 0.</Text>
              ) : null}
            </View>
          ))}

          <View style={styles.totalDivider} />
          <Row label="Combined Total Zakat Due" value={combinedTotal} />
        </View>
      ) : null}

      {showSavedToast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>Nisab settings saved</Text>
        </View>
      ) : null}

      <Modal
        transparent
        animationType="fade"
        visible={isCategoryPickerVisible}
        onRequestClose={() => setIsCategoryPickerVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsCategoryPickerVisible(false)}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select a category</Text>
            {CATEGORY_ORDER.map((category) => (
              <Pressable
                key={category}
                style={styles.modalOption}
                onPress={() => handleSelectCategory(category)}
              >
                <Text style={styles.modalOptionText}>{CATEGORY_DEFS[category].label}</Text>
              </Pressable>
            ))}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setIsCategoryPickerVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  categoryPickerBtn: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  categoryPickerText: {
    color: "#1f1f1f",
    fontSize: 15,
    fontWeight: "600",
  },
  categoryPickerAction: {
    color: "#007AFF",
    fontWeight: "700",
    fontSize: 14,
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
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  secondaryBtnText: {
    color: "#007AFF",
    fontSize: 15,
    fontWeight: "700",
  },
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
  lineItemCard: {
    borderWidth: 1,
    borderColor: "#ececec",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  lineItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  lineItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  removeBtnText: {
    color: "#C30000",
    fontSize: 13,
    fontWeight: "600",
  },
  totalDivider: {
    borderTopWidth: 1,
    borderTopColor: "#ececec",
    marginVertical: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
  },
  modalTitle: {
    fontSize: 16,
    color: "#1f1f1f",
    fontWeight: "700",
    marginBottom: 10,
  },
  modalOption: {
    borderWidth: 1,
    borderColor: "#ececec",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  modalOptionText: {
    color: "#1f1f1f",
    fontSize: 15,
    fontWeight: "600",
  },
  modalCloseBtn: {
    marginTop: 4,
    alignSelf: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  modalCloseBtnText: {
    color: "#666",
    fontWeight: "700",
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

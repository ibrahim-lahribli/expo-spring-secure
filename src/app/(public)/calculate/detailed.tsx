import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
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
  calcCashEquivalent,
  calcLivestockZakat,
  calculateSalaryZakat,
  getDueItemLabel,
  getDueItemPriceKey,
  type Camel121Choice,
  type DueItem,
  type DueItemPriceKey,
  type DueItemPrices,
  type LivestockType,
  type ZakatCalculationResult,
} from "../../../lib/zakat-calculation";
import { getNisabBreakdown } from "../../../lib/zakat-calculation/nisab";
import { useNisabSettingsStore } from "../../../store/nisabSettingsStore";

const DEFAULT_SILVER_PRICE_PER_GRAM = 12;
const DEFAULT_GOLD_PRICE_PER_GRAM = 800;

type CategoryId = "salary" | "livestock";
type LivestockPaymentMethod = "in_kind" | "cash";
type SalaryValues = { monthlyIncome: string; livingExpense: string };
type LivestockValues = {
  livestockType: LivestockType;
  ownedCount: number;
  paymentMethod: LivestockPaymentMethod;
  camel121Choice: Camel121Choice;
  prices: DueItemPrices;
};
type SalaryLineItem = { id: string; category: "salary"; values: SalaryValues; result: ZakatCalculationResult };
type LivestockLineItem = {
  id: string;
  category: "livestock";
  values: LivestockValues;
  result: ZakatCalculationResult;
  dueItems: DueItem[];
  dueText: string;
};
type LineItem = SalaryLineItem | LivestockLineItem;

const CATEGORY_LABELS: Record<CategoryId, string> = { salary: "Salary", livestock: "Livestock" };
const LIVESTOCK_LABELS: Record<LivestockType, string> = {
  camels: "Camels",
  cattle: "Cattle",
  sheep_goats: "Sheep/Goats",
};

const livestockSchema = z
  .object({
    livestockType: z.enum(["camels", "cattle", "sheep_goats"]),
    ownedCount: z.string().trim().refine((v) => /^\d+$/.test(v), "Owned must be an integer >= 0."),
    paymentMethod: z.enum(["in_kind", "cash"]),
    camel121Choice: z.enum(["2_hiqqah", "3_bint_labun"]),
    prices: z.record(z.string(), z.string().optional()).default({}),
  })
  .superRefine((v, ctx) => {
    if (v.paymentMethod !== "cash") return;
    const due = calcLivestockZakat(v.livestockType, Number(v.ownedCount), {
      camel121Choice: v.camel121Choice,
    });
    for (const item of due.dueItems) {
      const key = getDueItemPriceKey(item);
      const price = Number(v.prices[key]);
      if (!Number.isFinite(price) || price <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["prices", key],
          message: "Enter a price > 0.",
        });
      }
    }
  });
type LivestockForm = {
  livestockType: LivestockType;
  ownedCount: string;
  paymentMethod: LivestockPaymentMethod;
  camel121Choice: Camel121Choice;
  prices?: Record<string, string | undefined>;
};

const defaultLivestockForm: LivestockForm = {
  livestockType: "camels",
  ownedCount: "",
  paymentMethod: "in_kind",
  camel121Choice: "2_hiqqah",
  prices: {},
};

function parseOptionalPositive(v: string): number | undefined {
  if (!v.trim()) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
function toNonNegative(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
function toPriceMap(prices: Record<string, string | undefined>): DueItemPrices {
  const out: DueItemPrices = {};
  for (const [k, v] of Object.entries(prices)) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) out[k as DueItemPriceKey] = n;
  }
  return out;
}
function buildId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function requiredPriceKeys(dueItems: DueItem[]): DueItemPriceKey[] {
  return Array.from(new Set(dueItems.map((item) => getDueItemPriceKey(item))));
}

export default function DetailedCalculateScreen() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("salary");
  const [salaryValues, setSalaryValues] = useState<SalaryValues>({ monthlyIncome: "", livingExpense: "" });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isNisabAdvancedOpen, setIsNisabAdvancedOpen] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const nisabMethod = useNisabSettingsStore((s) => s.nisabMethod);
  const silverPricePerGram = useNisabSettingsStore((s) => s.silverPricePerGram);
  const goldPricePerGram = useNisabSettingsStore((s) => s.goldPricePerGram);
  const nisabOverride = useNisabSettingsStore((s) => s.nisabOverride);
  const setNisabMethod = useNisabSettingsStore((s) => s.setNisabMethod);
  const setSilverPricePerGram = useNisabSettingsStore((s) => s.setSilverPricePerGram);
  const setGoldPricePerGram = useNisabSettingsStore((s) => s.setGoldPricePerGram);
  const setNisabOverride = useNisabSettingsStore((s) => s.setNisabOverride);

  const [draftNisabMethod, setDraftNisabMethod] = useState(nisabMethod);
  const [draftSilver, setDraftSilver] = useState("");
  const [draftGold, setDraftGold] = useState("");
  const [draftOverride, setDraftOverride] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LivestockForm>({
    resolver: zodResolver(livestockSchema),
    defaultValues: defaultLivestockForm,
  });

  const livestockType = useWatch({ control, name: "livestockType" }) ?? "camels";
  const livestockOwned = useWatch({ control, name: "ownedCount" }) ?? "";
  const paymentMethod = useWatch({ control, name: "paymentMethod" }) ?? "in_kind";
  const camel121Choice = useWatch({ control, name: "camel121Choice" }) ?? "2_hiqqah";
  const watchedPrices = useWatch({ control, name: "prices" }) ?? {};

  const livestockPreview = useMemo(() => {
    const due = calcLivestockZakat(livestockType, /^\d+$/.test(livestockOwned) ? Number(livestockOwned) : 0, {
      camel121Choice,
    });
    const cashEquivalent = calcCashEquivalent(due.dueItems, toPriceMap(watchedPrices));
    return { due, cashEquivalent, keys: requiredPriceKeys(due.dueItems) };
  }, [livestockType, livestockOwned, camel121Choice, watchedPrices]);

  const nisabBreakdown = useMemo(
    () => getNisabBreakdown({ nisabMethod, silverPricePerGram, goldPricePerGram, nisabOverride }),
    [nisabMethod, silverPricePerGram, goldPricePerGram, nisabOverride],
  );

  useEffect(() => {
    if (!isNisabAdvancedOpen) {
      setDraftNisabMethod(nisabMethod);
      setDraftSilver(silverPricePerGram > 0 ? String(silverPricePerGram) : "");
      setDraftGold(goldPricePerGram > 0 ? String(goldPricePerGram) : "");
      setDraftOverride(nisabOverride > 0 ? String(nisabOverride) : "");
    }
  }, [isNisabAdvancedOpen, nisabMethod, silverPricePerGram, goldPricePerGram, nisabOverride]);

  useEffect(() => {
    if (!showSavedToast) return;
    const t = setTimeout(() => setShowSavedToast(false), 1800);
    return () => clearTimeout(t);
  }, [showSavedToast]);

  useEffect(() => {
    if (lineItems.length === 0) return;
    setLineItems((prev) =>
      prev.map((item) =>
        item.category === "salary"
          ? {
              ...item,
              result: calculateSalaryZakat({
                nisabMethod,
                silverPricePerGram,
                goldPricePerGram,
                nisabOverride: nisabOverride > 0 ? nisabOverride : undefined,
                salary: {
                  monthlyIncome: toNonNegative(item.values.monthlyIncome),
                  livingExpense: parseOptionalPositive(item.values.livingExpense),
                },
              }),
            }
          : item,
      ),
    );
  }, [nisabMethod, silverPricePerGram, goldPricePerGram, nisabOverride, lineItems.length]);

  const combinedTotal = useMemo(() => lineItems.reduce((sum, i) => sum + i.result.totalZakat, 0), [lineItems]);

  const onCalculateSalary = () => {
    if (!(Number(salaryValues.monthlyIncome) > 0)) {
      setValidationError("Please enter your monthly income.");
      return;
    }
    const result = calculateSalaryZakat({
      nisabMethod,
      silverPricePerGram,
      goldPricePerGram,
      nisabOverride: nisabOverride > 0 ? nisabOverride : undefined,
      salary: {
        monthlyIncome: toNonNegative(salaryValues.monthlyIncome),
        livingExpense: parseOptionalPositive(salaryValues.livingExpense),
      },
    });
    setLineItems((p) => [...p, { id: buildId(), category: "salary", values: { ...salaryValues }, result }]);
  };

  const onCalculateLivestock = handleSubmit((values) => {
    const due = calcLivestockZakat(values.livestockType, Number(values.ownedCount), {
      camel121Choice: values.camel121Choice,
    });
    const pricesMap = toPriceMap(values.prices ?? {});
    const cashEquivalent = calcCashEquivalent(due.dueItems, pricesMap);
    const payment = values.paymentMethod;
    const result: ZakatCalculationResult = {
      nisab: 0,
      totalWealth: 0,
      totalZakat: payment === "cash" ? cashEquivalent ?? 0 : 0,
      hasZakatDue: payment === "cash" ? (cashEquivalent ?? 0) > 0 : false,
      breakdown: {},
    };
    const line: LivestockLineItem = {
      id: buildId(),
      category: "livestock",
      values: {
        livestockType: values.livestockType,
        ownedCount: Number(values.ownedCount),
        paymentMethod: payment,
        camel121Choice: values.camel121Choice,
        prices: pricesMap,
      },
      result,
      dueItems: due.dueItems,
      dueText: due.dueText,
    };
    setLineItems((p) => [...p, line]);
  });

  const onCalculate = () => {
    setValidationError(null);
    if (activeCategory === "salary") onCalculateSalary();
    else onCalculateLivestock();
  };

  const onSaveNisab = () => {
    const silver = parseOptionalPositive(draftSilver) ?? DEFAULT_SILVER_PRICE_PER_GRAM;
    const gold = parseOptionalPositive(draftGold) ?? DEFAULT_GOLD_PRICE_PER_GRAM;
    const override = parseOptionalPositive(draftOverride) ?? 0;
    setNisabMethod(draftNisabMethod);
    setSilverPricePerGram(silver);
    setGoldPricePerGram(gold);
    setNisabOverride(override);
    setIsNisabAdvancedOpen(false);
    setShowSavedToast(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Detailed Calculate</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Nisab Settings</Text>
        <View style={styles.row}>
          <Pressable style={[styles.chip, (isNisabAdvancedOpen ? draftNisabMethod : nisabMethod) === "silver" && styles.chipActive]} onPress={() => (isNisabAdvancedOpen ? setDraftNisabMethod("silver") : setNisabMethod("silver"))}><Text>Silver</Text></Pressable>
          <Pressable style={[styles.chip, (isNisabAdvancedOpen ? draftNisabMethod : nisabMethod) === "gold" && styles.chipActive]} onPress={() => (isNisabAdvancedOpen ? setDraftNisabMethod("gold") : setNisabMethod("gold"))}><Text>Gold</Text></Pressable>
          <Pressable onPress={() => setIsNisabAdvancedOpen((p) => !p)}><Text style={styles.link}>{isNisabAdvancedOpen ? "Collapse" : "Advanced"}</Text></Pressable>
        </View>
        {!isNisabAdvancedOpen ? <Text style={styles.caption}>{nisabBreakdown.shortSummary}</Text> : (
          <>
            <TextInput style={styles.input} keyboardType="numeric" value={draftSilver} onChangeText={setDraftSilver} placeholder="Silver price/g" />
            <TextInput style={styles.input} keyboardType="numeric" value={draftGold} onChangeText={setDraftGold} placeholder="Gold price/g" />
            <TextInput style={styles.input} keyboardType="numeric" value={draftOverride} onChangeText={setDraftOverride} placeholder="Nisab override" />
            <TouchableOpacity style={styles.button} onPress={onSaveNisab}><Text style={styles.buttonText}>Save</Text></TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Category</Text>
        <Pressable style={styles.selector} onPress={() => setIsCategoryPickerVisible(true)}>
          <Text>{CATEGORY_LABELS[activeCategory]}</Text>
          <Text style={styles.link}>Change</Text>
        </Pressable>

        {activeCategory === "salary" ? (
          <>
            <TextInput style={styles.input} keyboardType="numeric" value={salaryValues.monthlyIncome} onChangeText={(v) => setSalaryValues((p) => ({ ...p, monthlyIncome: v }))} placeholder="Monthly income" />
            <TextInput style={styles.input} keyboardType="numeric" value={salaryValues.livingExpense} onChangeText={(v) => setSalaryValues((p) => ({ ...p, livingExpense: v }))} placeholder="Monthly expense (optional)" />
          </>
        ) : (
          <>
            <Controller control={control} name="livestockType" render={({ field: { value, onChange } }) => (
              <View style={styles.rowWrap}>
                {(["camels", "cattle", "sheep_goats"] as LivestockType[]).map((t) => (
                  <Pressable key={t} style={[styles.chip, value === t && styles.chipActive]} onPress={() => onChange(t)}><Text>{LIVESTOCK_LABELS[t]}</Text></Pressable>
                ))}
              </View>
            )} />
            <Controller control={control} name="ownedCount" render={({ field: { value, onChange } }) => (
              <TextInput style={styles.input} keyboardType="numeric" value={value} onChangeText={onChange} placeholder="Owned count" />
            )} />
            {errors.ownedCount ? <Text style={styles.error}>{errors.ownedCount.message}</Text> : null}

            <Controller control={control} name="paymentMethod" render={({ field: { value, onChange } }) => (
              <View style={styles.rowWrap}>
                <Pressable style={[styles.chip, value === "in_kind" && styles.chipActive]} onPress={() => onChange("in_kind")}><Text>In-kind</Text></Pressable>
                <Pressable style={[styles.chip, value === "cash" && styles.chipActive]} onPress={() => onChange("cash")}><Text>Cash</Text></Pressable>
              </View>
            )} />

            {livestockPreview.due.camel121ChoiceOptions ? (
              <Controller control={control} name="camel121Choice" render={({ field: { value, onChange } }) => (
                <View style={styles.rowWrap}>
                  <Pressable style={[styles.chip, value === "2_hiqqah" && styles.chipActive]} onPress={() => onChange("2_hiqqah")}><Text>2 hiqqah</Text></Pressable>
                  <Pressable style={[styles.chip, value === "3_bint_labun" && styles.chipActive]} onPress={() => onChange("3_bint_labun")}><Text>3 bint labun</Text></Pressable>
                </View>
              )} />
            ) : null}

            <Text style={styles.caption}>Due: {livestockPreview.due.dueText}</Text>
            {paymentMethod === "cash" ? livestockPreview.keys.map((key) => (
              <Controller key={key} control={control} name={`prices.${key}`} render={({ field: { value, onChange } }) => (
                <View>
                  <TextInput style={styles.input} keyboardType="numeric" value={value ?? ""} onChangeText={onChange} placeholder={`Price for ${key}`} />
                  {(errors.prices as Record<string, { message?: string }> | undefined)?.[key]?.message ? <Text style={styles.error}>{(errors.prices as Record<string, { message?: string }>)[key].message}</Text> : null}
                </View>
              )} />
            )) : null}
            {paymentMethod === "cash" ? <Text style={styles.caption}>{livestockPreview.cashEquivalent === undefined ? "Cash equivalent: missing price" : `Cash equivalent: ${livestockPreview.cashEquivalent.toFixed(2)}`}</Text> : null}
          </>
        )}
      </View>

      {validationError ? <Text style={styles.error}>{validationError}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={onCalculate}><Text style={styles.buttonText}>Calculate Zakat</Text></TouchableOpacity>

      {lineItems.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          {lineItems.map((item) => (
            <View key={item.id} style={styles.lineItem}>
              <View style={styles.row}>
                <Text style={styles.bold}>{CATEGORY_LABELS[item.category]}</Text>
                <Pressable onPress={() => setLineItems((p) => p.filter((x) => x.id !== item.id))}><Text style={styles.link}>Remove</Text></Pressable>
              </View>
              {item.category === "salary" ? (
                <>
                  <Text>Nisab: {item.result.nisab.toFixed(2)}</Text>
                  <Text>Net Wealth: {item.result.totalWealth.toFixed(2)}</Text>
                  <Text>Zakat Due: {item.result.totalZakat.toFixed(2)}</Text>
                </>
              ) : (
                <>
                  <Text>Type: {LIVESTOCK_LABELS[item.values.livestockType]}</Text>
                  <Text>Owned: {item.values.ownedCount}</Text>
                  <Text>Due animals: {item.dueText}</Text>
                  <Text>Payment: {item.values.paymentMethod}</Text>
                  <Text>Cash Included: {item.result.totalZakat.toFixed(2)}</Text>
                </>
              )}
            </View>
          ))}
          <Text style={styles.bold}>Combined Total Zakat Due: {combinedTotal.toFixed(2)}</Text>
        </View>
      ) : null}

      {showSavedToast ? <View style={styles.toast}><Text style={styles.toastText}>Nisab settings saved</Text></View> : null}

      <Modal transparent animationType="fade" visible={isCategoryPickerVisible} onRequestClose={() => setIsCategoryPickerVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setIsCategoryPickerVisible(false)}>
          <Pressable style={styles.modalCard}>
            {(["salary", "livestock"] as CategoryId[]).map((category) => (
              <Pressable key={category} style={styles.modalOption} onPress={() => {
                setActiveCategory(category);
                setValidationError(null);
                if (category === "salary") setSalaryValues({ monthlyIncome: "", livingExpense: "" });
                else reset(defaultLivestockForm);
                setIsCategoryPickerVisible(false);
              }}>
                <Text>{CATEGORY_LABELS[category]}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#ececec" },
  sectionTitle: { fontWeight: "700", marginBottom: 8, fontSize: 16 },
  selector: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 12, flexDirection: "row", justifyContent: "space-between" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: "#fff" },
  button: { backgroundColor: "#007AFF", borderRadius: 10, alignItems: "center", paddingVertical: 12, marginBottom: 12 },
  buttonText: { color: "#fff", fontWeight: "700" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  chip: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, marginRight: 8, marginBottom: 8, backgroundColor: "#f8f8f8" },
  chipActive: { backgroundColor: "#EBF4FF", borderColor: "#9CC7FF" },
  link: { color: "#007AFF", fontWeight: "600" },
  caption: { color: "#666", fontSize: 12, marginBottom: 8 },
  error: { color: "#C30000", marginBottom: 8, fontSize: 12 },
  lineItem: { borderWidth: 1, borderColor: "#ececec", borderRadius: 8, padding: 10, marginBottom: 8 },
  bold: { fontWeight: "700" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#fff", borderRadius: 12, padding: 12 },
  modalOption: { borderWidth: 1, borderColor: "#ececec", borderRadius: 8, padding: 12, marginBottom: 8 },
  toast: { position: "absolute", bottom: 18, left: 16, right: 16, backgroundColor: "#1f1f1f", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  toastText: { color: "#fff", fontWeight: "600" },
});

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

import { calculateTotalZakat } from "../../../lib/zakat-engine/src/calculateTotalZakat";
import type {
  CategoryZakatResult,
  ZakatCalculationResult,
} from "../../../lib/zakat-engine/src/core/types";
import {
  CategoryToggles,
  DetailedAgricultureProductsForm,
  DetailedCropsForm,
  DetailedFormState,
  DetailedGlobalSettingsForm,
  DetailedIndustryForm,
  DetailedLivestockForm,
  DetailedMineralsForm,
  DetailedSalaryForm,
  DetailedTradeForm,
  mapDetailedToEngine,
} from "../../../lib/zakat-mappers/mapDetailedToEngine";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Default form state ──────────────────────────────────────────────────────

const defaultGlobal: DetailedGlobalSettingsForm = {
  nisabMethod: "silver",
  silverPricePerGram: "",
  goldPricePerGram: "",
  nisabOverride: "",
};

const defaultSalary: DetailedSalaryForm = {
  monthlyIncome: "",
};

const defaultTrade: DetailedTradeForm = {
  inventoryValue: "",
  cash: "",
  receivables: "",
  liabilities: "",
  expensesDue: "",
};

const defaultIndustry: DetailedIndustryForm = {
  inventoryValue: "",
  cash: "",
  receivables: "",
  liabilities: "",
  productionCosts: "",
  salariesDue: "",
  rentDue: "",
  taxesDue: "",
};

const defaultCrops: DetailedCropsForm = {
  harvestKg: "",
  irrigationMethod: "rain",
  soldCommercially: false,
  marketValuePerKg: "",
};

const defaultLivestock: DetailedLivestockForm = {
  sheep: "",
  goats: "",
  cattle: "",
  camels: "",
  marketPricePerSheep: "",
  marketPricePerGoat: "",
  marketPricePerCattle: "",
  marketPricePerCamel: "",
  marketPricePerCalf: "",
};

const defaultAgricultureProducts: DetailedAgricultureProductsForm = {
  revenue: "",
  costs: "",
};

const defaultMinerals: DetailedMineralsForm = {
  extractedValue: "",
  extractionCosts: "",
};

// ─── Helpers: derive toggles from form state (AUTO include) ──────────────────

function safeNum(v: unknown) {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function hasAnyPositive(obj: object, keys?: string[]) {
  const record = obj as Record<string, unknown>;
  const entries = keys
    ? keys.map((k) => [k, record[k]] as const)
    : Object.entries(record);
  return entries.some(([, v]) => safeNum(v) > 0);
}

function deriveCategoryToggles(state: DetailedFormState): CategoryToggles {
  return {
    salary: hasAnyPositive(state.salary),
    trade: hasAnyPositive(state.trade),
    industry: hasAnyPositive(state.industry),
    crops:
      safeNum(state.crops.harvestKg) > 0 ||
      (state.crops.soldCommercially &&
        safeNum(state.crops.marketValuePerKg) > 0),
    livestock: hasAnyPositive(state.livestock, [
      "sheep",
      "goats",
      "cattle",
      "camels",
      "marketPricePerSheep",
      "marketPricePerGoat",
      "marketPricePerCattle",
      "marketPricePerCamel",
      "marketPricePerCalf",
    ]),
    agricultureProducts: hasAnyPositive(state.agricultureProducts),
    minerals: hasAnyPositive(state.minerals),
  };
}

// ─── Small reusable field component ─────────────────────────────────────────

function Field({
  label,
  value,
  onChangeText,
  placeholder = "0.00",
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
      />
    </View>
  );
}

// ─── Category breakdown row ───────────────────────────────────────────────────

function BreakdownRow({
  label,
  data,
}: {
  label: string;
  data: CategoryZakatResult;
}) {
  // For non-commercial crops with no market price, the engine sets zakatAmount = 0
  // and zakatAmountKg carries the physical obligation (paid in kind, not in MAD).
  const isPhysicalOnly =
    data.zakatAmountKg !== undefined && data.zakatAmount === 0;

  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownHeader}>
        <Text style={styles.breakdownLabel}>{label}</Text>
        {data.isApplicable ? (
          <Text style={styles.breakdownApplicable}>✓ Applicable</Text>
        ) : (
          <Text style={styles.breakdownNotApplicable}>Below Nisab</Text>
        )}
      </View>
      <View style={styles.breakdownDetail}>
        <Text style={styles.breakdownDetailText}>
          Net Wealth: {data.netWealth.toFixed(2)}
        </Text>
        {isPhysicalOnly ? (
          <Text style={styles.breakdownDetailText}>
            Zakat: {data.zakatAmountKg!.toFixed(2)} kg (in kind)
          </Text>
        ) : (
          <Text style={styles.breakdownDetailText}>
            Zakat: {data.zakatAmount.toFixed(2)}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Accordion Card (NO switches; included derived automatically) ────────────

function AccordionCard({
  title,
  subtitle,
  icon,
  expanded,
  onToggle,
  included,
  onClear,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  expanded: boolean;
  onToggle: () => void;
  included: boolean;
  onClear?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          onToggle();
        }}
        style={styles.cardHeader}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={styles.iconBubble}>
            <MaterialCommunityIcons name={icon} size={18} color="#007AFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{title}</Text>
            {subtitle ? (
              <Text style={styles.cardSubtitle}>{subtitle}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.cardHeaderRight}>
          <View
            style={[styles.badge, included ? styles.badgeOn : styles.badgeOff]}
          >
            <Text
              style={[
                styles.badgeText,
                included ? styles.badgeTextOn : styles.badgeTextOff,
              ]}
            >
              {included ? "Included" : "Empty"}
            </Text>
          </View>

          <MaterialCommunityIcons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={22}
            color="#666"
            style={{ marginLeft: 10 }}
          />
        </View>
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.cardBody}>
          {onClear ? (
            <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={16}
                color="#D00"
              />
              <Text style={styles.clearBtnText}>Clear section</Text>
            </TouchableOpacity>
          ) : null}

          {children}
        </View>
      ) : null}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DetailedCalculateScreen() {
  const [global, setGlobal] =
    useState<DetailedGlobalSettingsForm>(defaultGlobal);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [salary, setSalary] = useState<DetailedSalaryForm>(defaultSalary);
  const [trade, setTrade] = useState<DetailedTradeForm>(defaultTrade);
  const [industry, setIndustry] =
    useState<DetailedIndustryForm>(defaultIndustry);
  const [crops, setCrops] = useState<DetailedCropsForm>(defaultCrops);
  const [livestock, setLivestock] =
    useState<DetailedLivestockForm>(defaultLivestock);
  const [agricultureProducts, setAgricultureProducts] =
    useState<DetailedAgricultureProductsForm>(defaultAgricultureProducts);
  const [minerals, setMinerals] =
    useState<DetailedMineralsForm>(defaultMinerals);

  const [expanded, setExpanded] = useState<
    Record<keyof CategoryToggles, boolean>
  >({
    salary: true,
    trade: false,
    industry: false,
    crops: false,
    livestock: false,
    agricultureProducts: false,
    minerals: false,
  });

  const [result, setResult] = useState<ZakatCalculationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const formState: DetailedFormState = useMemo(
    () => ({
      global,
      salary,
      trade,
      industry,
      crops,
      livestock,
      agricultureProducts,
      minerals,
    }),
    [
      global,
      salary,
      trade,
      industry,
      crops,
      livestock,
      agricultureProducts,
      minerals,
    ],
  );

  const derivedToggles = useMemo(
    () => deriveCategoryToggles(formState),
    [formState],
  );
  const enabledCount = useMemo(
    () => Object.values(derivedToggles).filter(Boolean).length,
    [derivedToggles],
  );

  function handleCalculate() {
    setValidationError(null);
    setResult(null);

    const { zakatInput, validationError: err } = mapDetailedToEngine(
      formState,
      derivedToggles,
    );

    if (err || !zakatInput) {
      setValidationError(err ?? "An unknown error occurred.");
      return;
    }

    try {
      const calcResult = calculateTotalZakat(zakatInput);
      setResult(calcResult);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Calculation failed.";
      setValidationError(message);
    }
  }

  // Helpers: update nested field
  function updateGlobal(key: keyof DetailedGlobalSettingsForm, value: string) {
    setGlobal((prev) => ({ ...prev, [key]: value }));
  }
  function updateSalary(key: keyof DetailedSalaryForm, value: string) {
    setSalary((prev) => ({ ...prev, [key]: value }));
  }
  function updateTrade(key: keyof DetailedTradeForm, value: string) {
    setTrade((prev) => ({ ...prev, [key]: value }));
  }
  function updateIndustry(key: keyof DetailedIndustryForm, value: string) {
    setIndustry((prev) => ({ ...prev, [key]: value }));
  }
  function updateCrops<K extends keyof DetailedCropsForm>(
    key: K,
    value: DetailedCropsForm[K],
  ) {
    setCrops((prev) => ({ ...prev, [key]: value }));
  }
  function updateLivestock(key: keyof DetailedLivestockForm, value: string) {
    setLivestock((prev) => ({ ...prev, [key]: value }));
  }
  function updateAgricultureProducts(
    key: keyof DetailedAgricultureProductsForm,
    value: string,
  ) {
    setAgricultureProducts((prev) => ({ ...prev, [key]: value }));
  }
  function updateMinerals(key: keyof DetailedMineralsForm, value: string) {
    setMinerals((prev) => ({ ...prev, [key]: value }));
  }

  const cattleCount = parseFloat(livestock.cattle) || 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{ title: "Detailed Zakat Calculator", headerShown: true }}
      />

      {/* ── Global Settings (compact + advanced collapse) ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.iconBubble}>
              <MaterialCommunityIcons
                name="tune-variant"
                size={18}
                color="#007AFF"
              />
            </View>
            <Text style={styles.sectionTitle}>Global Settings</Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              );
              setShowAdvanced((v) => !v);
            }}
            style={styles.advancedBtn}
          >
            <MaterialCommunityIcons
              name="cog-outline"
              size={16}
              color="#007AFF"
            />
            <Text style={styles.advancedBtnText}>
              {showAdvanced ? "Hide advanced" : "Advanced"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.fieldLabel}>Nisab Method</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.methodBtn,
              global.nisabMethod === "silver" && styles.methodBtnActive,
            ]}
            onPress={() => updateGlobal("nisabMethod", "silver")}
          >
            <Text
              style={[
                styles.methodBtnText,
                global.nisabMethod === "silver" && styles.methodBtnTextActive,
              ]}
            >
              Silver
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.methodBtn,
              global.nisabMethod === "gold" && styles.methodBtnActive,
            ]}
            onPress={() => updateGlobal("nisabMethod", "gold")}
          >
            <Text
              style={[
                styles.methodBtnText,
                global.nisabMethod === "gold" && styles.methodBtnTextActive,
              ]}
            >
              Gold
            </Text>
          </TouchableOpacity>
        </View>

        {showAdvanced ? (
          <View style={{ marginTop: 4 }}>
            <Field
              label="Silver Price per Gram (optional)"
              value={global.silverPricePerGram}
              onChangeText={(v) => updateGlobal("silverPricePerGram", v)}
              hint="Leave empty to use engine default"
            />
            <Field
              label="Gold Price per Gram (optional)"
              value={global.goldPricePerGram}
              onChangeText={(v) => updateGlobal("goldPricePerGram", v)}
              hint="Leave empty to use engine default"
            />
            <Field
              label="Nisab Override (optional)"
              value={global.nisabOverride}
              onChangeText={(v) => updateGlobal("nisabOverride", v)}
              hint="Manually set Nisab threshold"
            />
          </View>
        ) : (
          <Text style={styles.compactHint}>
            Tip: you can override metal prices in Advanced.
          </Text>
        )}
      </View>

      <Text style={styles.pageSubtitle}>Categories</Text>

      {/* ── Salary ── */}
      <AccordionCard
        title="Salary / Services"
        subtitle="Income and expenses"
        icon="briefcase-outline"
        expanded={expanded.salary}
        onToggle={() => setExpanded((p) => ({ ...p, salary: !p.salary }))}
        included={derivedToggles.salary}
        onClear={() => setSalary(defaultSalary)}
      >
        <Field
          label="Monthly Income"
          value={salary.monthlyIncome}
          onChangeText={(v) => updateSalary("monthlyIncome", v)}
          hint="Living expense deduction (SMIG × 12 = 39,192 MAD) is applied automatically per the fatwa"
        />
      </AccordionCard>

      {/* ── Trade ── */}
      <AccordionCard
        title="Trade / Business"
        subtitle="Inventory, cash, receivables"
        icon="storefront-outline"
        expanded={expanded.trade}
        onToggle={() => setExpanded((p) => ({ ...p, trade: !p.trade }))}
        included={derivedToggles.trade}
        onClear={() => setTrade(defaultTrade)}
      >
        <Field
          label="Inventory Value"
          value={trade.inventoryValue}
          onChangeText={(v) => updateTrade("inventoryValue", v)}
        />
        <Field
          label="Cash (on hand & in bank)"
          value={trade.cash}
          onChangeText={(v) => updateTrade("cash", v)}
        />
        <Field
          label="Receivables"
          value={trade.receivables}
          onChangeText={(v) => updateTrade("receivables", v)}
        />
        <Field
          label="Liabilities / Debts"
          value={trade.liabilities}
          onChangeText={(v) => updateTrade("liabilities", v)}
        />
        <Field
          label="Expenses Due"
          value={trade.expensesDue}
          onChangeText={(v) => updateTrade("expensesDue", v)}
        />
      </AccordionCard>

      {/* ── Industry ── */}
      <AccordionCard
        title="Industry / Manufacturing"
        subtitle="Production costs & liabilities"
        icon="factory"
        expanded={expanded.industry}
        onToggle={() => setExpanded((p) => ({ ...p, industry: !p.industry }))}
        included={derivedToggles.industry}
        onClear={() => setIndustry(defaultIndustry)}
      >
        <Field
          label="Inventory Value"
          value={industry.inventoryValue}
          onChangeText={(v) => updateIndustry("inventoryValue", v)}
        />
        <Field
          label="Cash"
          value={industry.cash}
          onChangeText={(v) => updateIndustry("cash", v)}
        />
        <Field
          label="Receivables"
          value={industry.receivables}
          onChangeText={(v) => updateIndustry("receivables", v)}
        />
        <Field
          label="Liabilities / Debts"
          value={industry.liabilities}
          onChangeText={(v) => updateIndustry("liabilities", v)}
        />
        <Field
          label="Production Costs"
          value={industry.productionCosts}
          onChangeText={(v) => updateIndustry("productionCosts", v)}
        />
        <Field
          label="Salaries Due"
          value={industry.salariesDue}
          onChangeText={(v) => updateIndustry("salariesDue", v)}
        />
        <Field
          label="Rent Due"
          value={industry.rentDue}
          onChangeText={(v) => updateIndustry("rentDue", v)}
        />
        <Field
          label="Taxes Due"
          value={industry.taxesDue}
          onChangeText={(v) => updateIndustry("taxesDue", v)}
        />
      </AccordionCard>

      {/* ── Crops ── */}
      <AccordionCard
        title="Crops"
        subtitle="Harvest and irrigation"
        icon="sprout"
        expanded={expanded.crops}
        onToggle={() => setExpanded((p) => ({ ...p, crops: !p.crops }))}
        included={derivedToggles.crops}
        onClear={() => setCrops(defaultCrops)}
      >
        <Field
          label="Harvest (kg)"
          value={crops.harvestKg}
          onChangeText={(v) => updateCrops("harvestKg", v)}
          placeholder="kg"
        />

        <Text style={styles.fieldLabel}>Irrigation Method</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.methodBtn,
              crops.irrigationMethod === "rain" && styles.methodBtnActive,
            ]}
            onPress={() => updateCrops("irrigationMethod", "rain")}
          >
            <Text
              style={[
                styles.methodBtnText,
                crops.irrigationMethod === "rain" && styles.methodBtnTextActive,
              ]}
            >
              Rain-fed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.methodBtn,
              crops.irrigationMethod === "artificial" && styles.methodBtnActive,
            ]}
            onPress={() => updateCrops("irrigationMethod", "artificial")}
          >
            <Text
              style={[
                styles.methodBtnText,
                crops.irrigationMethod === "artificial" &&
                  styles.methodBtnTextActive,
              ]}
            >
              Artificial
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inlineRow}>
          <Text style={styles.fieldLabel}>Sold Commercially?</Text>
          <Switch
            value={crops.soldCommercially}
            onValueChange={(v) => updateCrops("soldCommercially", v)}
            trackColor={{ false: "#ccc", true: "#007AFF" }}
            thumbColor="#fff"
          />
        </View>

        {crops.soldCommercially && (
          <Field
            label="Market Value per kg (optional)"
            value={crops.marketValuePerKg}
            onChangeText={(v) => updateCrops("marketValuePerKg", v)}
          />
        )}
      </AccordionCard>

      {/* ── Livestock ── */}
      <AccordionCard
        title="Livestock"
        subtitle="Counts and market prices"
        icon="cow"
        expanded={expanded.livestock}
        onToggle={() => setExpanded((p) => ({ ...p, livestock: !p.livestock }))}
        included={derivedToggles.livestock}
        onClear={() => setLivestock(defaultLivestock)}
      >
        <Field
          label="Number of Sheep"
          value={livestock.sheep}
          onChangeText={(v) => updateLivestock("sheep", v)}
          placeholder="0"
        />
        <Field
          label="Market Price per Sheep (optional)"
          value={livestock.marketPricePerSheep}
          onChangeText={(v) => updateLivestock("marketPricePerSheep", v)}
        />
        <Field
          label="Number of Goats"
          value={livestock.goats}
          onChangeText={(v) => updateLivestock("goats", v)}
          placeholder="0"
        />
        <Field
          label="Market Price per Goat (optional)"
          value={livestock.marketPricePerGoat}
          onChangeText={(v) => updateLivestock("marketPricePerGoat", v)}
        />
        <Field
          label="Number of Cattle"
          value={livestock.cattle}
          onChangeText={(v) => updateLivestock("cattle", v)}
          placeholder="0"
        />
        <Field
          label="Market Price per Cattle (optional)"
          value={livestock.marketPricePerCattle}
          onChangeText={(v) => updateLivestock("marketPricePerCattle", v)}
        />

        {cattleCount > 0 && (
          <Field
            label="Market Price per Calf (required)"
            value={livestock.marketPricePerCalf}
            onChangeText={(v) => updateLivestock("marketPricePerCalf", v)}
            hint="Required when cattle > 0"
          />
        )}

        <Field
          label="Number of Camels"
          value={livestock.camels}
          onChangeText={(v) => updateLivestock("camels", v)}
          placeholder="0"
        />
        <Field
          label="Market Price per Camel (optional)"
          value={livestock.marketPricePerCamel}
          onChangeText={(v) => updateLivestock("marketPricePerCamel", v)}
        />
      </AccordionCard>

      {/* ── Agriculture Products ── */}
      <AccordionCard
        title="Agriculture Products"
        subtitle="Revenue and costs"
        icon="basket-outline"
        expanded={expanded.agricultureProducts}
        onToggle={() =>
          setExpanded((p) => ({
            ...p,
            agricultureProducts: !p.agricultureProducts,
          }))
        }
        included={derivedToggles.agricultureProducts}
        onClear={() => setAgricultureProducts(defaultAgricultureProducts)}
      >
        <Field
          label="Revenue"
          value={agricultureProducts.revenue}
          onChangeText={(v) => updateAgricultureProducts("revenue", v)}
        />
        <Field
          label="Costs"
          value={agricultureProducts.costs}
          onChangeText={(v) => updateAgricultureProducts("costs", v)}
        />
      </AccordionCard>

      {/* ── Minerals ── */}
      <AccordionCard
        title="Minerals / Natural Resources"
        subtitle="الثروة المعدنية — 2.5% after extraction costs"
        icon="diamond-stone"
        expanded={expanded.minerals}
        onToggle={() => setExpanded((p) => ({ ...p, minerals: !p.minerals }))}
        included={derivedToggles.minerals}
        onClear={() => setMinerals(defaultMinerals)}
      >
        <Field
          label="Extracted Value (MAD)"
          value={minerals.extractedValue}
          onChangeText={(v) => updateMinerals("extractedValue", v)}
          hint="Total market value of extracted minerals"
        />
        <Field
          label="Extraction Costs (MAD)"
          value={minerals.extractionCosts}
          onChangeText={(v) => updateMinerals("extractionCosts", v)}
          hint="Extraction and processing costs to deduct"
        />
      </AccordionCard>

      {/* ── Validation Error ── */}
      {validationError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {validationError}</Text>
        </View>
      )}

      {/* ── Calculate Button ── */}
      <TouchableOpacity
        style={[
          styles.calculateBtn,
          enabledCount === 0 && styles.calculateBtnDisabled,
        ]}
        onPress={handleCalculate}
        disabled={enabledCount === 0}
      >
        <Text style={styles.calculateBtnText}>
          {enabledCount === 0
            ? "Enter a value in any category to calculate"
            : "Calculate Zakat"}
        </Text>
      </TouchableOpacity>

      {/* ── Results ── */}
      {result && (
        <View style={styles.resultSection}>
          <Text style={styles.resultTitle}>📊 Zakat Calculation Result</Text>

          {!result.hasZakatDue && (
            <View style={styles.noZakatBox}>
              <Text style={styles.noZakatText}>
                🌙 No Zakat is due. Your wealth is below the Nisab threshold.
              </Text>
            </View>
          )}

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Nisab Threshold:</Text>
            <Text style={styles.resultValue}>{result.nisab.toFixed(2)}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Total Wealth:</Text>
            <Text style={styles.resultValue}>
              {result.totalWealth.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.resultRow, styles.resultTotalRow]}>
            <Text style={styles.resultTotalLabel}>Total Zakat Due:</Text>
            <Text style={styles.resultTotalValue}>
              {result.totalZakat.toFixed(2)}
            </Text>
          </View>

          {Object.keys(result.breakdown).length > 0 && (
            <View style={styles.breakdownSection}>
              <Text style={styles.breakdownTitle}>Category Breakdown</Text>

              {result.breakdown.salary && (
                <BreakdownRow
                  label="💼 Salary"
                  data={result.breakdown.salary}
                />
              )}
              {result.breakdown.trade && (
                <BreakdownRow label="🏪 Trade" data={result.breakdown.trade} />
              )}
              {result.breakdown.industry && (
                <BreakdownRow
                  label="🏭 Industry"
                  data={result.breakdown.industry}
                />
              )}
              {result.breakdown.crops && (
                <BreakdownRow label="🌾 Crops" data={result.breakdown.crops} />
              )}
              {result.breakdown.livestock && (
                <BreakdownRow
                  label="🐄 Livestock"
                  data={result.breakdown.livestock}
                />
              )}
              {result.breakdown.agricultureProducts && (
                <BreakdownRow
                  label="🧺 Agriculture Products"
                  data={result.breakdown.agricultureProducts}
                />
              )}
              {result.breakdown.minerals && (
                <BreakdownRow
                  label="⛏️ Minerals"
                  data={result.breakdown.minerals}
                />
              )}
            </View>
          )}
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  content: { padding: 16 },

  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a1a" },

  advancedBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EBF4FF",
    borderWidth: 1,
    borderColor: "#CFE4FF",
  },
  advancedBtnText: { color: "#007AFF", fontWeight: "700", fontSize: 13 },

  compactHint: { marginTop: 2, color: "#777", fontSize: 12 },

  pageSubtitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
    marginBottom: 10,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  iconBubble: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "#EBF4FF",
    borderWidth: 1,
    borderColor: "#CFE4FF",
    alignItems: "center",
    justifyContent: "center",
  },

  fieldGroup: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  fieldHint: { fontSize: 12, color: "#888", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: "#fdfdfd",
    color: "#222",
  },

  toggleRow: { flexDirection: "row", gap: 10, marginBottom: 8 },

  methodBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#ddd",
    backgroundColor: "#f5f5f5",
  },
  methodBtnActive: { borderColor: "#007AFF", backgroundColor: "#EBF4FF" },
  methodBtnText: { fontSize: 14, fontWeight: "600", color: "#666" },
  methodBtnTextActive: { color: "#007AFF" },

  inlineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },

  // Accordion cards
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  cardHeaderRight: { flexDirection: "row", alignItems: "center" },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#1a1a1a" },
  cardSubtitle: { fontSize: 12, color: "#777", marginTop: 2 },
  cardBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeOn: {
    backgroundColor: "#F0FFF4",
    borderColor: "#B2EAC8",
  },
  badgeOff: {
    backgroundColor: "#F7F7F7",
    borderColor: "#E3E3E3",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  badgeTextOn: {
    color: "#1A7A3C",
  },
  badgeTextOff: {
    color: "#777",
  },

  clearBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFF3F3",
    borderWidth: 1,
    borderColor: "#FFB3B3",
    marginTop: 12,
    marginBottom: 8,
  },
  clearBtnText: {
    color: "#D00",
    fontSize: 13,
    fontWeight: "800",
  },

  // Errors
  errorBox: {
    backgroundColor: "#FFF3F3",
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#FFB3B3",
  },
  errorText: { color: "#D00", fontSize: 14, fontWeight: "500" },

  // Calculate button
  calculateBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 24,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  calculateBtnDisabled: {
    backgroundColor: "#A7CFFF",
    shadowOpacity: 0,
    elevation: 0,
  },
  calculateBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  // Results
  resultSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 14,
  },

  noZakatBox: {
    backgroundColor: "#F0FFF4",
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#B2EAC8",
  },
  noZakatText: { color: "#1A7A3C", fontSize: 14, fontWeight: "500" },

  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  resultLabel: { fontSize: 15, color: "#555" },
  resultValue: { fontSize: 15, fontWeight: "600", color: "#222" },
  resultTotalRow: {
    marginTop: 6,
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: "#007AFF",
    paddingTop: 10,
  },
  resultTotalLabel: { fontSize: 17, fontWeight: "700", color: "#1a1a1a" },
  resultTotalValue: { fontSize: 17, fontWeight: "700", color: "#007AFF" },

  breakdownSection: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 14,
  },
  breakdownTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#444",
    marginBottom: 10,
  },
  breakdownRow: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ebebeb",
  },
  breakdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  breakdownLabel: { fontSize: 14, fontWeight: "700", color: "#222" },
  breakdownApplicable: { fontSize: 12, color: "#1A7A3C", fontWeight: "600" },
  breakdownNotApplicable: { fontSize: 12, color: "#888", fontWeight: "500" },
  breakdownDetail: { flexDirection: "row", justifyContent: "space-between" },
  breakdownDetailText: { fontSize: 13, color: "#555" },

  bottomPadding: { height: 40 },
});

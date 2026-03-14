import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { I18nManager, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { getCurrencyInputPrefix } from "../../lib/currency";
import { calculateNisab } from "../../lib/zakat-calculation/nisab";
import { ZakatCalculationResult } from "../../lib/zakat-calculation/types";
import { useAppPreferencesStore } from "../../store/appPreferencesStore";
import { useNisabSettingsStore } from "../../store/nisabSettingsStore";
import { useQuickCalculationDraftStore } from "../../store/quickCalculationDraftStore";
import { appColors, appRadius, appSpacing, appTypography } from "../../theme/designSystem";
import { PrimaryButton } from "../ui";

function calculateQuickResult(cash: number, goldValue: number, debt: number, nisab: number): ZakatCalculationResult {
  const safeCash = Math.max(0, cash);
  const safeGoldValue = Math.max(0, goldValue);
  const safeDebt = Math.max(0, debt);
  const totalWealth = Math.max(0, safeCash + safeGoldValue - safeDebt);
  const totalZakat = totalWealth >= nisab ? totalWealth * 0.025 : 0;

  return {
    nisab,
    totalWealth,
    totalZakat,
    hasZakatDue: totalZakat > 0,
    breakdown: {},
  };
}

export function QuickCalculatorForm() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const [cash, setCash] = useState("");
  const [goldValue, setGoldValue] = useState("");
  const [debt, setDebt] = useState("");
  const [debtErrorKey, setDebtErrorKey] = useState<string | undefined>();
  const currency = useAppPreferencesStore((state) => state.currency);
  const consumeDraft = useQuickCalculationDraftStore((state) => state.consumeDraft);
  const nisabMethod = useNisabSettingsStore((state) => state.nisabMethod);
  const silverPricePerGram = useNisabSettingsStore((state) => state.silverPricePerGram);
  const goldPricePerGram = useNisabSettingsStore((state) => state.goldPricePerGram);
  const nisabOverride = useNisabSettingsStore((state) => state.nisabOverride);

  const resetForm = useCallback(() => {
    setCash("");
    setGoldValue("");
    setDebt("");
    setDebtErrorKey(undefined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const draft = consumeDraft();
      if (draft) {
        setCash(draft.cash);
        setGoldValue(draft.goldValue);
        setDebt(draft.debt);
        setDebtErrorKey(undefined);
        return;
      }

      resetForm();
    }, [consumeDraft, resetForm]),
  );

  const calculateResult = (): ZakatCalculationResult => {
    const parsedCash = parseFloat(cash) || 0;
    const parsedGoldValue = parseFloat(goldValue) || 0;
    const parsedDebt = parseFloat(debt) || 0;
    const nisab = calculateNisab({
      nisabMethod,
      silverPricePerGram,
      goldPricePerGram,
      nisabOverride,
    });
    return calculateQuickResult(parsedCash, parsedGoldValue, parsedDebt, nisab);
  };

  const handleCalculate = () => {
    const parsedDebt = Number(debt);
    if (debt.trim() && (!Number.isFinite(parsedDebt) || parsedDebt < 0)) {
      setDebtErrorKey("quickCalculator.validation.positiveNumber");
      return;
    }

    setDebtErrorKey(undefined);
    const result = calculateResult();
    router.push(
      {
        pathname: "/calculate/result",
        params: {
          cash: String(Math.max(0, parseFloat(cash) || 0)),
          goldValue: String(Math.max(0, parseFloat(goldValue) || 0)),
          debt: String(Math.max(0, parseFloat(debt) || 0)),
          nisab: String(result.nisab),
          totalWealth: String(result.totalWealth),
          totalZakat: String(result.totalZakat),
          hasZakatDue: result.hasZakatDue ? "1" : "0",
        },
      } as never,
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>{t("quickCalculator.title")}</Text>

      <InputSection
        title={t("quickCalculator.fields.cash.title")}
        description={t("quickCalculator.fields.cash.description")}
        value={cash}
        onChangeText={setCash}
        currencyPrefix={getCurrencyInputPrefix(currency)}
      />

      <InputSection
        title={t("quickCalculator.fields.gold.title")}
        description={t("quickCalculator.fields.gold.description")}
        value={goldValue}
        onChangeText={setGoldValue}
        currencyPrefix={getCurrencyInputPrefix(currency)}
      />

      <InputSection
        title={t("quickCalculator.fields.debt.title")}
        description={t("quickCalculator.fields.debt.description")}
        value={debt}
        onChangeText={setDebt}
        errorKey={debtErrorKey}
        currencyPrefix={getCurrencyInputPrefix(currency)}
      />

      <PrimaryButton label={t("quickCalculator.calculate")} onPress={handleCalculate} />
    </ScrollView>
  );
}

function InputSection({
  title,
  description,
  value,
  onChangeText,
  errorKey,
  currencyPrefix,
}: {
  title: string;
  description: string;
  value: string;
  onChangeText: (text: string) => void;
  errorKey?: string;
  currencyPrefix: string;
}) {
  const { t } = useTranslation("common");
  const isRTL = I18nManager.isRTL;
  return (
    <View style={styles.inputSection}>
      <Text style={styles.inputTitle}>{title}</Text>
      <Text style={styles.inputDescription}>{description}</Text>
      <View
        style={[
          styles.currencyWrap,
          isRTL && styles.currencyWrapRtl,
          errorKey ? styles.currencyWrapError : undefined,
        ]}
      >
        <Text style={[styles.currencyPrefix, errorKey ? styles.currencyPrefixError : undefined]}>
          {currencyPrefix}
        </Text>
        <TextInput
          keyboardType="numeric"
          value={value}
          onChangeText={onChangeText}
          placeholder={t("quickCalculator.placeholder")}
          placeholderTextColor={appColors.textSecondary}
          style={styles.currencyInput}
        />
      </View>
      {errorKey ? <Text style={styles.errorText}>! {t(errorKey as never)}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: appSpacing.md,
    gap: appSpacing.md,
    paddingBottom: appSpacing.lg,
  },
  headerTitle: {
    ...appTypography.section,
    textAlign: "center",
  },
  inputSection: {
    gap: appSpacing.xs,
  },
  inputTitle: {
    ...appTypography.body,
    fontWeight: "700",
    fontSize: 15,
  },
  inputDescription: {
    ...appTypography.caption,
  },
  currencyWrap: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: appRadius.sm,
    backgroundColor: appColors.surface,
    paddingHorizontal: appSpacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: appSpacing.xs,
  },
  currencyWrapRtl: {
    flexDirection: "row-reverse",
  },
  currencyWrapError: {
    borderColor: appColors.error,
    backgroundColor: "#FDF3F2",
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: "700",
    color: appColors.textSecondary,
  },
  currencyPrefixError: {
    color: appColors.error,
  },
  currencyInput: {
    flex: 1,
    paddingVertical: appSpacing.xs,
    fontSize: 18,
    color: appColors.textPrimary,
  },
  errorText: {
    ...appTypography.caption,
    color: appColors.error,
    fontWeight: "600",
  },
});

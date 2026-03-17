import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DatePickerModal } from "react-native-paper-dates";
import {
  formatDateAsIso,
  isValidIsoDate,
} from "../../lib/zakat-calculation/detailedCalculationContext";
import { appColors, appRadius, appSpacing } from "../../theme/designSystem";

type AppDatePickerFieldProps = {
  label: string;
  placeholder: string;
  valueIso?: string;
  onChangeIso: (iso: string) => void;
  locale: string;
  testID: string;
  isArabic?: boolean;
};

function parseIsoDate(value?: string): Date | undefined {
  if (!isValidIsoDate(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function AppDatePickerField({
  label,
  placeholder,
  valueIso,
  onChangeIso,
  locale,
  testID,
  isArabic = false,
}: AppDatePickerFieldProps) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => parseIsoDate(valueIso), [valueIso]);
  const modalDate = selectedDate ?? new Date();

  const displayValue = useMemo(() => {
    if (!selectedDate) return placeholder;
    return new Intl.DateTimeFormat(locale || "en", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(selectedDate);
  }, [locale, placeholder, selectedDate]);

  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.fieldLabel, isArabic && styles.rtlText]}>{label}</Text>
      <Pressable
        testID={testID}
        style={styles.dateTrigger}
        onPress={() => setOpen(true)}
      >
        <Text
          style={[
            styles.dateValue,
            !selectedDate && styles.placeholderValue,
            isArabic && styles.rtlText,
          ]}
        >
          {displayValue}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={appColors.primary} />
      </Pressable>
      <DatePickerModal
        {...({ testID: `${testID}-modal` } as { testID: string })}
        mode="single"
        locale={locale || "en"}
        visible={open}
        date={modalDate}
        onDismiss={() => setOpen(false)}
        onConfirm={({ date }) => {
          setOpen(false);
          if (!date) return;
          onChangeIso(formatDateAsIso(date));
        }}
        label={label}
        saveLabel={t("save")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fieldBlock: {
    gap: appSpacing.xs,
  },
  fieldLabel: {
    color: appColors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  dateTrigger: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: appRadius.md,
    backgroundColor: appColors.surface,
    paddingHorizontal: appSpacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: appSpacing.sm,
  },
  dateValue: {
    color: appColors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  placeholderValue: {
    color: appColors.textSecondary,
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
});

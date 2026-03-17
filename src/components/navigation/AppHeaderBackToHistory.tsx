import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { I18nManager, Pressable, StyleSheet, Text, View } from "react-native";
import { appColors, appSpacing } from "../../theme/designSystem";

export function AppHeaderBackToHistory() {
  const router = useRouter();
  const { t, i18n } = useTranslation("common");
  const isRTL = I18nManager.isRTL;
  const isArabicLocale = (i18n.resolvedLanguage ?? i18n.language ?? "en").startsWith("ar");
  const showLabel = !(isRTL || isArabicLocale);

  return (
    <Pressable
      onPress={() => router.replace("/(public)/history")}
      style={[styles.button, isRTL && styles.buttonRtl]}
      hitSlop={8}
    >
      <Ionicons
        name={isRTL ? "arrow-forward" : "arrow-back"}
        size={18}
        color={appColors.textPrimary}
      />
      {showLabel ? (
        <View>
          <Text style={styles.label}>{t("navigation.history")}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 36,
    minWidth: 36,
    paddingHorizontal: appSpacing.xs,
    borderRadius: 18,
    gap: appSpacing.xs,
  },
  label: {
    color: appColors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  buttonRtl: {
    justifyContent: "center",
    paddingHorizontal: appSpacing.xxs,
  },
});

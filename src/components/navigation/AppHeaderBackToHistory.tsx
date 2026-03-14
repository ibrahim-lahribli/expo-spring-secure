import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { I18nManager, Pressable, StyleSheet, Text, View } from "react-native";
import { appColors, appSpacing } from "../../theme/designSystem";

export function AppHeaderBackToHistory() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const isRTL = I18nManager.isRTL;

  return (
    <Pressable
      onPress={() => router.replace("/(public)/history")}
      style={[styles.button, isRTL && styles.rowReverse]}
    >
      <Ionicons
        name={isRTL ? "arrow-forward" : "arrow-back"}
        size={18}
        color={appColors.textPrimary}
      />
      <View>
        <Text style={styles.label}>{t("navigation.history")}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: appSpacing.xs,
  },
  label: {
    color: appColors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
});

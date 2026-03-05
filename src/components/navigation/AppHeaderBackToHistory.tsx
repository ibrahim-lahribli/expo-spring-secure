import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { appColors, appSpacing } from "../../theme/designSystem";

export function AppHeaderBackToHistory() {
  const router = useRouter();
  const { t } = useTranslation("common");

  return (
    <Pressable onPress={() => router.replace("/(public)/history")} style={styles.button}>
      <Ionicons name="arrow-back" size={18} color={appColors.textPrimary} />
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
});

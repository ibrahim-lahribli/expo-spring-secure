import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { I18nManager, StyleSheet, Text, View } from "react-native";
import { appColors, appSpacing } from "../../theme/designSystem";

export function AppHeaderBrand() {
  const isRTL = I18nManager.isRTL;
  return (
    <View style={[styles.brandWrap, isRTL && styles.rowReverse]}>
      <Ionicons name="moon-outline" size={18} color={appColors.primary} />
      <Text style={styles.brandName}>ZakatCalc</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: appSpacing.xs,
    marginStart: appSpacing.sm,
  },
  brandName: {
    color: appColors.primary,
    fontWeight: "700",
    fontSize: 20,
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
});

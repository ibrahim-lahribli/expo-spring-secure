import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { appColors, appSpacing } from "../../theme/designSystem";

export function AppHeaderBrand() {
  return (
    <View style={styles.brandWrap}>
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
    marginLeft: appSpacing.sm,
  },
  brandName: {
    color: appColors.primary,
    fontWeight: "700",
    fontSize: 20,
  },
});

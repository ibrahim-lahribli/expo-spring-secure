import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useAuthStore } from "../../store/authStore";
import { appColors, appSpacing, minTouchHeight } from "../../theme/designSystem";

export function AppHeaderRight() {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <TouchableOpacity
      style={styles.profileButton}
      onPress={() => router.push({ pathname: user ? "/(protected)/account" : "/auth/login" })}
    >
      <Ionicons name={user ? "person-circle-outline" : "log-in-outline"} size={26} color={appColors.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  profileButton: {
    minHeight: minTouchHeight,
    minWidth: minTouchHeight,
    justifyContent: "center",
    alignItems: "center",
    marginEnd: appSpacing.sm,
  },
});

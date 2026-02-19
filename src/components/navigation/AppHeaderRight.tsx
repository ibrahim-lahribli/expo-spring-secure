import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuthStore } from "../../store/authStore";

export function AppHeaderRight() {
  const router = useRouter();
  const { user } = useAuthStore();

  if (user) {
    // Logged in: show profile icon
    return (
      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => router.push({ pathname: "/(protected)/account" })}
      >
        <Ionicons name="person-circle-outline" size={28} color="#007AFF" />
      </TouchableOpacity>
    );
  }

  // Guest: show Login and Sign up buttons
  return (
    <View style={styles.authButtons}>
      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => router.push({ pathname: "/auth/login" })}
      >
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.signupButton}
        onPress={() => router.push({ pathname: "/auth/signup" })}
      >
        <Text style={styles.signupButtonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  profileButton: {
    padding: 8,
    marginRight: 8,
  },
  authButtons: {
    flexDirection: "row",
    gap: 8,
    marginRight: 8,
  },
  loginButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  loginButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  signupButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#007AFF",
  },
  signupButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

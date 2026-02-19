import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuthStore } from "../../../store/authStore";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🕌</Text>
        <Text style={styles.title}>Welcome to Zakat Calculator</Text>
        <Text style={styles.description}>
          Calculate your Zakat obligations easily and accurately. Our app helps
          you determine the correct Zakat amount based on your assets, following
          Islamic principles and guidelines.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/(public)/calculate")}
        >
          <Text style={styles.primaryButtonText}>Calculate Zakat</Text>
        </TouchableOpacity>

        {!user ? (
          <View style={styles.authButtons}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/auth/login")}
            >
              <Text style={styles.secondaryButtonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/auth/signup")}
            >
              <Text style={styles.secondaryButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.accountButton}
            onPress={() => router.push("/(protected)/account")}
          >
            <Text style={styles.accountButtonText}>View Account</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#1a1a1a",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    lineHeight: 24,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
    minWidth: 200,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  authButtons: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minWidth: 100,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  accountButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minWidth: 160,
    alignItems: "center",
  },
  accountButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

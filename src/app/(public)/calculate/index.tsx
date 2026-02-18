import { Link, Stack, useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { QuickCalculatorForm } from "../../../components/zakat/QuickCalculatorForm";

export default function CalculateScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Calculate Zakat" }} />

      <View style={styles.header}>
        <Text style={styles.title}>Calculate Zakat</Text>
        <Link href="/(protected)/account" asChild>
          <TouchableOpacity style={styles.testButton}>
            <Text style={styles.testButtonText}>Account (Test)</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Quick Calculator */}
      <View style={styles.content}>
        <QuickCalculatorForm />
      </View>

      {/* Detailed Calculate button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.detailedBtn}
          onPress={() => router.push("/calculate/detailed")}
        >
          <Text style={styles.detailedBtnText}>📋 Detailed Calculate</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  testButton: {
    padding: 8,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
  testButtonText: {
    fontSize: 12,
    color: "#007AFF",
  },
  content: {
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  detailedBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  detailedBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});

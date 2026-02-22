import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { QuickCalculatorForm } from "../../../components/zakat/QuickCalculatorForm";

export default function CalculateScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <QuickCalculatorForm />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/(public)/zakat-explanations" as never)}
        >
          <Text style={styles.secondaryBtnText}>Zakat Explanations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.detailedBtn}
          onPress={() => router.push("/(public)/calculate/detailed")}
        >
          <Text style={styles.detailedBtnText}>Detailed Calculate</Text>
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
  content: {
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 10,
  },
  secondaryBtn: {
    backgroundColor: "#e8f1ff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#0a4fb7",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
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

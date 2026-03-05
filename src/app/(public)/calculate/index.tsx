import React from "react";
import { StyleSheet } from "react-native";
import { AppScreen } from "../../../components/ui";
import { QuickCalculatorForm } from "../../../components/zakat/QuickCalculatorForm";
import { appSpacing } from "../../../theme/designSystem";

export default function CalculateScreen() {
  return (
    <AppScreen scrollable={false} contentContainerStyle={styles.content}>
      <QuickCalculatorForm />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: appSpacing.sm,
    paddingBottom: 0,
    gap: 0,
  }
});

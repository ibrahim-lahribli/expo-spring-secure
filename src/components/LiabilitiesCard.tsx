import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { Button, Card } from "react-native-paper";
import { QuickAddDebtSheet } from "./QuickAddDebtSheet";
import { useDebtsStore } from "../store/debtsStore";
import { formatNumberDisplay } from "../utils/currency";

interface LiabilitiesCardProps {
  locale?: string;
  currencyCode?: string;
}

// Simple analytics tracking (can be replaced with actual analytics library)
const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  console.log(`[Analytics] ${eventName}`, properties);
};

export function LiabilitiesCard({
  locale = "en",
  currencyCode = "USD",
}: LiabilitiesCardProps) {
  const { t, i18n } = useTranslation(["calculate"]);
  const router = useRouter();
  const { liabilitiesItems, liabilitiesTotal, addLiability } = useDebtsStore();
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  const handleManagePress = useCallback(() => {
    // Navigate to Manage debts screen (to be implemented)
    // For now, just log the action
    console.log("Navigate to Manage debts");
    // router.push("/(tabs)/manage/debts");
  }, []);

  const handleAddDebtPress = useCallback(() => {
    trackEvent("liability_quick_add_opened", { source: "quick_calculate" });
    setIsSheetVisible(true);
  }, []);

  const handleSheetDismiss = useCallback(() => {
    trackEvent("liability_quick_add_cancelled", { source: "quick_calculate" });
    setIsSheetVisible(false);
  }, []);

  const handleSaveDebt = useCallback(
    (amount: number, note?: string) => {
      addLiability(amount, note);

      trackEvent("liability_quick_add_saved", {
        amount,
        currency: currencyCode,
        totalItems: liabilitiesItems.length + 1,
        source: "quick_calculate",
      });
    },
    [addLiability, currencyCode, liabilitiesItems.length],
  );

  const formattedTotal = formatNumberDisplay(liabilitiesTotal, i18n.language);

  return (
    <>
      <Card style={styles.card}>
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>
                {t("liabilities.title", { defaultValue: "Liabilities" })}
              </Text>
              <Text style={styles.helper}>
                {t("liabilities.helper", {
                  defaultValue: "Debts and obligations",
                })}
              </Text>
            </View>
            <Button
              mode="text"
              onPress={handleManagePress}
              textColor="#1F7A6B"
              compact={true}
              style={styles.manageButton}
              labelStyle={styles.manageLabel}
            >
              {t("liabilities.manage", { defaultValue: "Manage" })}
            </Button>
          </View>

          {/* Total Section */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>
              {t("liabilities.total", { defaultValue: "Total liabilities" })}
            </Text>
            <Text
              style={[
                styles.totalAmount,
                liabilitiesTotal === 0 ? styles.zeroAmount : null,
              ]}
            >
              {formattedTotal}
            </Text>
          </View>

          {/* Add Debt Action */}
          <Button
            mode="outlined"
            icon="plus"
            onPress={handleAddDebtPress}
            style={styles.addButton}
            textColor="#1F7A6B"
            buttonColor="transparent"
            labelStyle={styles.addButtonLabel}
            testID="add-debt-button"
          >
            {t("liabilities.addDebt", { defaultValue: "Add debt" })}
          </Button>
        </View>
      </Card>

      <QuickAddDebtSheet
        visible={isSheetVisible}
        onDismiss={handleSheetDismiss}
        onSave={handleSaveDebt}
        currencyCode={currencyCode}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: "white",
    marginHorizontal: 0,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  helper: {
    fontSize: 13,
    color: "#6B7280",
  },
  manageButton: {
    marginLeft: 8,
    alignSelf: "flex-start",
  },
  manageLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginHorizontal: 0,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  zeroAmount: {
    color: "#9CA3AF",
  },
  addButton: {
    borderColor: "#1F7A6B",
    borderRadius: 8,
    borderWidth: 1.5,
  },
  addButtonLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
});

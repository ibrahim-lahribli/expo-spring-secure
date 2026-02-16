import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Appbar, Card, IconButton } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LiabilitiesCard } from "../../../components/LiabilitiesCard";

// Simple Assets Card component
function AssetsCard() {
  const { t } = useTranslation(["calculate"]);

  return (
    <Card style={styles.assetsCard}>
      <View style={styles.assetsContent}>
        <View style={styles.assetsHeader}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="wallet" size={24} color="#1F7A6B" />
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.assetsTitle}>
              {t("assets.title", { defaultValue: "Assets" })}
            </Text>
            <Text style={styles.assetsHelper}>
              {t("assets.helper", {
                defaultValue: "Cash, gold, savings, etc.",
              })}
            </Text>
          </View>
        </View>

        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>
            {t("assets.total", { defaultValue: "Total assets" })}
          </Text>
          <Text style={[styles.totalAmount, styles.zeroAmount]}>0.00</Text>
        </View>

        <Text style={styles.placeholderText}>
          {t("assets.placeholder", {
            defaultValue: "Tap + to add your assets",
          })}
        </Text>
      </View>
    </Card>
  );
}

// Summary Card showing Zakat calculation preview
function SummaryCard() {
  const { t } = useTranslation(["calculate"]);

  return (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryContent}>
        <Text style={styles.summaryTitle}>
          {t("summary.title", { defaultValue: "Zakat Summary" })}
        </Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            {t("summary.totalAssets", { defaultValue: "Total Assets" })}
          </Text>
          <Text style={styles.summaryValue}>0.00</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            {t("summary.totalLiabilities", {
              defaultValue: "Total Liabilities",
            })}
          </Text>
          <Text style={[styles.summaryValue, styles.negativeValue]}>0.00</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.netWorthLabel}>
            {t("summary.netWorth", { defaultValue: "Net Worth" })}
          </Text>
          <Text style={styles.netWorthValue}>0.00</Text>
        </View>

        <View style={styles.nisabSection}>
          <MaterialCommunityIcons
            name="information"
            size={16}
            color="#F59E0B"
          />
          <Text style={styles.nisabText}>
            {t("summary.nisabCheck", {
              defaultValue: "Nisab not set. Configure in Settings.",
            })}
          </Text>
        </View>
      </View>
    </Card>
  );
}

export default function QuickCalculateScreen() {
  const { t, i18n } = useTranslation(["calculate"]);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Appbar.Header style={styles.appbar}>
        <IconButton
          icon="arrow-left"
          iconColor="#111827"
          size={24}
          onPress={handleBack}
        />
        <Appbar.Content
          title={t("quickCalculate", { defaultValue: "Quick Calculate" })}
          titleStyle={styles.appbarTitle}
        />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Assets Section */}
        <Text style={styles.sectionTitle}>
          {t("sections.assets", { defaultValue: "Your Assets" })}
        </Text>
        <AssetsCard />

        <View style={styles.spacer} />

        {/* Liabilities Section */}
        <Text style={styles.sectionTitle}>
          {t("sections.liabilities", { defaultValue: "Your Liabilities" })}
        </Text>
        <LiabilitiesCard locale={i18n.language} currencyCode="USD" />

        <View style={styles.spacer} />

        {/* Summary Section */}
        <SummaryCard />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  appbar: {
    backgroundColor: "transparent",
    elevation: 0,
  },
  appbarTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  spacer: {
    height: 24,
  },
  bottomSpacer: {
    height: 40,
  },

  // Assets Card Styles
  assetsCard: {
    borderRadius: 12,
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  assetsContent: {
    padding: 16,
  },
  assetsHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  titleSection: {
    flex: 1,
  },
  assetsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  assetsHelper: {
    fontSize: 13,
    color: "#6B7280",
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
  placeholderText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
  },

  // Summary Card Styles
  summaryCard: {
    borderRadius: 12,
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryContent: {
    padding: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  negativeValue: {
    color: "#EF4444",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  netWorthLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  netWorthValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F7A6B",
  },
  nisabSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 10,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
  },
  nisabText: {
    fontSize: 12,
    color: "#92400E",
    marginLeft: 8,
    flex: 1,
  },
});

import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useBottomTabSpacing } from "../../hooks/useBottomTabSpacing";

export default function HistoryScreen() {
  const { t } = useTranslation();
  const bottomSpacing = useBottomTabSpacing();

  return (
    <View style={styles.container}>
      <View style={{ paddingBottom: bottomSpacing }}>
        <Text style={styles.title}>{t("history:title", "History")}</Text>
        <Text style={styles.subtitle}>
          {t("history:description", "Your activity history will appear here")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

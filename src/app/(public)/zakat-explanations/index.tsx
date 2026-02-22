import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { CategoryCard } from "../../../features/zakat-explanations/components";
import { useTranslation } from "react-i18next";
import { zakatCategories } from "../../../features/zakat-explanations/data";
import { ZAKAT_UI } from "../../../features/zakat-explanations/ui";
import type { LocalizedText } from "../../../features/zakat-explanations/types";

export default function ZakatExplanationsHubScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const tr = (value: LocalizedText) => t(value.key, { defaultValue: value.defaultText });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Text variant="labelMedium" style={styles.eyebrow}>
            {t("zakatExplanations.hub.eyebrow", { defaultValue: "Guided Reference" })}
          </Text>
          <Text variant="headlineSmall" style={styles.title}>
            {t("zakatExplanations.hub.title", { defaultValue: "Zakat Categories" })}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {t("zakatExplanations.hub.subtitle", {
              defaultValue: "Choose a category to review clear rulings, conditions, and calculation guidance.",
            })}
          </Text>
        </View>

        <View style={styles.cardList}>
          {zakatCategories.map((category) => (
            <CategoryCard
              key={category.slug}
              title={tr(category.title)}
              summary={tr(category.shortSummary)}
              icon={category.icon}
              badges={category.rates.map((rate) => rate.value)}
              accentColor={ZAKAT_UI.categoryAccents[category.slug] ?? ZAKAT_UI.colors.accent}
              onPress={() =>
                router.push(
                  {
                    pathname: "/(public)/zakat-explanations/[slug]",
                    params: { slug: category.slug },
                  } as never,
                )
              }
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ZAKAT_UI.colors.background,
  },
  content: {
    padding: ZAKAT_UI.spacing.lg,
    paddingBottom: ZAKAT_UI.spacing.xl,
    gap: ZAKAT_UI.spacing.md,
  },
  headerCard: {
    backgroundColor: ZAKAT_UI.colors.surface,
    borderWidth: 1,
    borderColor: ZAKAT_UI.colors.border,
    borderRadius: ZAKAT_UI.radius.lg,
    padding: ZAKAT_UI.spacing.md,
    gap: ZAKAT_UI.spacing.xs,
  },
  eyebrow: {
    color: ZAKAT_UI.colors.accent,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  title: {
    color: ZAKAT_UI.colors.textPrimary,
    fontWeight: "700",
  },
  subtitle: {
    color: ZAKAT_UI.colors.textSecondary,
    lineHeight: 21,
  },
  cardList: {
    gap: ZAKAT_UI.spacing.md,
  },
});

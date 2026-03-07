import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { zakatCategories } from "../../../features/zakat-explanations/data";
import { ZAKAT_UI } from "../../../features/zakat-explanations/ui";
import type { LocalizedText } from "../../../features/zakat-explanations/types";

export default function ZakatExplanationsHubScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isArabic = (i18n.resolvedLanguage ?? "en").startsWith("ar");

  const tr = (value: LocalizedText) => {
    const lang = i18n.resolvedLanguage ?? "en";
    const localizedDefault =
      lang.startsWith("ar") ? value.arText ?? value.defaultText : lang.startsWith("fr") ? value.frText ?? value.defaultText : value.defaultText;
    return t(value.key, { defaultValue: localizedDefault });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.introCard}>
          <Text variant="titleLarge" style={[styles.introTitle, isArabic && styles.rtlText]}>
            {t("zakatExplanations.hub.introduction.title", { defaultValue: "Introduction" })}
          </Text>
          <Text variant="bodyMedium" style={[styles.introText, isArabic && styles.rtlText]}>
            {t("zakatExplanations.hub.introduction.paragraph1", {
              defaultValue:
                "Zakat is given by the believer in response to the command of Allah. The Quran clarifies that its purpose is not only to help those in need but also to benefit the giver by purifying the soul and freeing it from greed and miserliness.",
            })}
          </Text>
          <View style={styles.verseCard}>
            <Text variant="bodyMedium" style={[styles.verseText, isArabic && styles.rtlText, isArabic && styles.verseTextArabic]}>
              {t("zakatExplanations.hub.introduction.verse", {
                defaultValue: "\"Take from their wealth a charity by which you cleanse and purify them.\" (Quran 9:103)",
              })}
            </Text>
          </View>
          <Text variant="bodyMedium" style={[styles.introText, isArabic && styles.rtlText]}>
            {t("zakatExplanations.hub.introduction.paragraph2", {
              defaultValue:
                "Therefore, Zakat is one of the pillars of Islam, one of its greatest obligations, and a fundamental foundation upon which many other rulings of Islamic life are built.",
            })}
          </Text>
          <Text variant="labelLarge" style={[styles.categoriesLabel, isArabic && styles.rtlText]}>
            {t("zakatExplanations.hub.title", { defaultValue: "Zakat Categories" })}
          </Text>
          <Text variant="bodySmall" style={[styles.introSubtitle, isArabic && styles.rtlText]}>
            {t("zakatExplanations.hub.subtitle", {
              defaultValue: "Choose a category to view the fatwa-based explanation.",
            })}
          </Text>
        </View>

        <View style={styles.cardList}>
          {zakatCategories.map((category) => {
            const accent = ZAKAT_UI.categoryAccents[category.slug] ?? ZAKAT_UI.colors.accent;
            return (
              <Pressable
                key={category.slug}
                onPress={() =>
                  router.push(
                    {
                      pathname: "/(public)/zakat-explanations/[slug]",
                      params: { slug: category.slug },
                    } as never,
                  )
                }
                style={({ pressed }) => [styles.topicCard, isArabic && styles.topicCardRtl, pressed && styles.topicCardPressed]}
                accessibilityRole="button"
              >
                <View style={[styles.topicIconWrap, isArabic && styles.topicIconWrapRtl, { backgroundColor: `${accent}1A` }]}>
                  <MaterialCommunityIcons name={category.icon} size={16} color={accent} />
                </View>
                <View style={styles.topicBody}>
                  <Text variant="titleMedium" style={[styles.topicTitle, isArabic && styles.rtlText]}>
                    {tr(category.title)}
                  </Text>
                  <Text variant="bodySmall" style={[styles.topicSummary, isArabic && styles.rtlText]} numberOfLines={2}>
                    {tr(category.shortSummary)}
                  </Text>
                </View>
                <View style={[styles.topicChevronWrap, isArabic && styles.topicChevronWrapRtl]}>
                  <MaterialCommunityIcons name={isArabic ? "chevron-left" : "chevron-right"} size={20} color={ZAKAT_UI.colors.textTertiary} />
                </View>
              </Pressable>
            );
          })}
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
    gap: ZAKAT_UI.spacing.lg,
  },
  introCard: {
    backgroundColor: ZAKAT_UI.colors.surface,
    borderWidth: 1,
    borderColor: ZAKAT_UI.colors.border,
    borderRadius: ZAKAT_UI.radius.lg,
    padding: ZAKAT_UI.spacing.md,
    gap: ZAKAT_UI.spacing.sm,
  },
  introTitle: {
    color: ZAKAT_UI.colors.textPrimary,
    fontWeight: "700",
    fontSize: 22,
  },
  introSubtitle: {
    color: ZAKAT_UI.colors.textSecondary,
    lineHeight: 18,
    fontSize: 12,
  },
  introText: {
    color: ZAKAT_UI.colors.textSecondary,
    lineHeight: 22,
    fontSize: 14,
  },
  verseCard: {
    backgroundColor: ZAKAT_UI.colors.surfaceMuted,
    borderRadius: ZAKAT_UI.radius.md,
    borderWidth: 1,
    borderColor: ZAKAT_UI.colors.border,
    padding: ZAKAT_UI.spacing.sm,
  },
  verseText: {
    color: ZAKAT_UI.colors.textPrimary,
    fontStyle: "italic",
    lineHeight: 24,
    fontSize: 14,
  },
  verseTextArabic: {
    fontStyle: "normal",
  },
  categoriesLabel: {
    color: ZAKAT_UI.colors.textPrimary,
    fontWeight: "700",
    marginTop: ZAKAT_UI.spacing.xs,
  },
  cardList: {
    gap: ZAKAT_UI.spacing.sm,
  },
  topicCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: ZAKAT_UI.colors.border,
    borderRadius: ZAKAT_UI.radius.md,
    backgroundColor: ZAKAT_UI.colors.surface,
    padding: ZAKAT_UI.spacing.sm,
    minHeight: 84,
  },
  topicCardRtl: {
    flexDirection: "row-reverse",
  },
  topicCardPressed: {
    opacity: 0.9,
  },
  topicIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: ZAKAT_UI.spacing.sm,
  },
  topicIconWrapRtl: {
    marginRight: 0,
    marginLeft: ZAKAT_UI.spacing.sm,
  },
  topicBody: {
    flex: 1,
    gap: 3,
  },
  topicTitle: {
    color: ZAKAT_UI.colors.textPrimary,
    fontWeight: "700",
    fontSize: 17,
  },
  topicSummary: {
    color: ZAKAT_UI.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  topicChevronWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ZAKAT_UI.colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: ZAKAT_UI.spacing.sm,
  },
  topicChevronWrapRtl: {
    marginLeft: 0,
    marginRight: ZAKAT_UI.spacing.sm,
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
});

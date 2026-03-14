import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { BulletRow, InfoBadge, SectionCard } from "../../../features/zakat-explanations/components";
import { getZakatCategoryBySlug } from "../../../features/zakat-explanations/data";
import { ZAKAT_UI } from "../../../features/zakat-explanations/ui";
import type { LocalizedText, ZakatCategory } from "../../../features/zakat-explanations/types";

export default function ZakatCategoryDetailScreen() {
  const router = useRouter();
  const { slug, returnTo } = useLocalSearchParams<{ slug?: string; returnTo?: string }>();
  const { t, i18n } = useTranslation();
  const isArabic = (i18n.resolvedLanguage ?? "en").startsWith("ar");

  const category = slug ? getZakatCategoryBySlug(slug) : undefined;
  const tr = (value: LocalizedText) => {
    const lang = i18n.resolvedLanguage ?? "en";
    const localizedDefault =
      lang.startsWith("ar") ? value.arText ?? value.defaultText : lang.startsWith("fr") ? value.frText ?? value.defaultText : value.defaultText;
    return t(value.key, { defaultValue: localizedDefault });
  };

  if (!category) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFoundWrap}>
          <Text variant="headlineSmall" style={styles.notFoundTitle}>
            {t("zakatExplanations.detail.notFound.title", { defaultValue: "Category not found" })}
          </Text>
          <Button mode="contained" onPress={() => router.replace("/(public)/zakat-explanations" as never)}>
            {t("zakatExplanations.detail.notFound.back", { defaultValue: "Back to categories" })}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <HeaderSection category={category} tr={tr} />

          <SectionCard
            title={tr({ key: "zakatExplanations.detail.overview.title", defaultText: "Overview" })}
            icon="information-outline"
            style={styles.sectionCardCompact}
          >
            <Text variant="bodyMedium" style={[styles.sectionBodyText, isArabic && styles.rtlText]}>
              {tr(category.overview.whatItCovers)}
            </Text>
            <Text variant="bodyMedium" style={[styles.sectionBodyText, isArabic && styles.rtlText]}>
              {tr(category.overview.whenDue)}
            </Text>
          </SectionCard>

          <SectionCard
            title={tr({ key: "zakatExplanations.detail.included.title", defaultText: "Included Items" })}
            icon="format-list-bulleted-square"
            style={styles.sectionCardCompact}
          >
            {category.includedItems.map((item) => (
              <BulletRow key={item.key} text={tr(item)} icon="circle-small" />
            ))}
          </SectionCard>

          <SectionCard
            title={tr({ key: "zakatExplanations.detail.overview.conditions", defaultText: "Conditions" })}
            icon="clipboard-check-outline"
            style={styles.sectionCardCompact}
          >
            {category.conditions.map((condition) => (
              <BulletRow key={condition.key} text={tr(condition)} icon="circle-small" />
            ))}
          </SectionCard>

          <SectionCard
            title={tr({ key: "zakatExplanations.detail.steps.title", defaultText: "Steps" })}
            icon="calculator-variant-outline"
            style={styles.sectionCardCompact}
          >
            {category.calculationSteps.map((step, index) => (
              <View key={step.title.key} style={[styles.stepRow, isArabic && styles.stepRowRtl]}>
                <Text variant="labelLarge" style={[styles.stepIndex, isArabic && styles.rtlText]}>
                  {`${index + 1}. ${tr(step.title)}`}
                </Text>
                <Text variant="bodyMedium" style={[styles.stepDescription, isArabic && styles.rtlText]}>
                  {tr(step.description)}
                </Text>
              </View>
            ))}
          </SectionCard>

          {category.notes.length > 0 || category.deductions.length > 0 ? (
            <SectionCard
              title={tr({ key: "zakatExplanations.detail.notes.title", defaultText: "Notes / FAQ" })}
              icon="alert-circle-outline"
              style={styles.notesCard}
            >
              {category.notes.map((note) => (
                <BulletRow key={note.key} text={tr(note)} icon="circle-small" />
              ))}
              {category.deductions.map((deduction) => (
                <BulletRow key={deduction.key} text={tr(deduction)} icon="circle-small" />
              ))}
            </SectionCard>
          ) : null}

          <View style={styles.spacer} />
        </ScrollView>

        <View style={styles.footer}>
          <Button
            mode="contained"
            style={styles.ctaButton}
            contentStyle={styles.ctaButtonContent}
            onPress={() =>
              router.push(
                typeof returnTo === "string" && returnTo.length > 0
                  ? (returnTo as never)
                  : ("/(public)/calculate/detailed/setup" as never),
              )
            }
          >
            {t("zakatExplanations.detail.cta", { defaultValue: "Calculate this category" })}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

function HeaderSection({ category, tr }: { category: ZakatCategory; tr: (value: LocalizedText) => string }) {
  const { i18n } = useTranslation();
  const isArabic = (i18n.resolvedLanguage ?? "en").startsWith("ar");
  const accent = ZAKAT_UI.categoryAccents[category.slug] ?? ZAKAT_UI.colors.accent;

  return (
    <View style={styles.headerCard}>
      <View style={[styles.headerTopRow, isArabic && styles.headerTopRowRtl]}>
        <View style={[styles.headerIconWrap, { backgroundColor: `${accent}1A` }]}>
          <MaterialCommunityIcons name={category.icon} size={24} color={accent} />
        </View>
        <View style={styles.headerTitleWrap}>
          <Text variant="headlineSmall" style={[styles.headerTitle, isArabic && styles.rtlText]}>
            {tr(category.title)}
          </Text>
          <Text variant="bodyMedium" style={[styles.headerSubtitle, isArabic && styles.rtlText]}>
            {tr(category.shortSummary)}
          </Text>
        </View>
      </View>
      {category.rates.length > 0 ? (
        <View style={styles.badgesRow}>
          {category.rates.map((rate) => (
            <InfoBadge key={`${category.slug}-${rate.value}-${rate.label.key}`} label={`${rate.value} ${tr(rate.label)}`} tone="accent" />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ZAKAT_UI.colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: ZAKAT_UI.spacing.lg,
    paddingBottom: 100,
    gap: ZAKAT_UI.spacing.md,
  },
  notFoundWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: ZAKAT_UI.spacing.md,
    padding: ZAKAT_UI.spacing.lg,
  },
  notFoundTitle: {
    color: ZAKAT_UI.colors.textPrimary,
    textAlign: "center",
  },
  headerCard: {
    backgroundColor: ZAKAT_UI.colors.surface,
    borderWidth: 1,
    borderColor: ZAKAT_UI.colors.border,
    borderRadius: ZAKAT_UI.radius.lg,
    padding: ZAKAT_UI.spacing.sm,
    gap: ZAKAT_UI.spacing.sm,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: ZAKAT_UI.spacing.sm,
  },
  headerTopRowRtl: {
    flexDirection: "row-reverse",
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    color: ZAKAT_UI.colors.textPrimary,
    fontWeight: "700",
    fontSize: 28,
  },
  headerSubtitle: {
    color: ZAKAT_UI.colors.textSecondary,
    lineHeight: 20,
    fontSize: 13,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ZAKAT_UI.spacing.xs,
  },
  sectionCardCompact: {
    borderRadius: ZAKAT_UI.radius.md,
    padding: ZAKAT_UI.spacing.sm,
  },
  sectionBodyText: {
    color: ZAKAT_UI.colors.textSecondary,
    lineHeight: 20,
    fontSize: 13,
  },
  stepRow: {
    gap: 4,
  },
  stepRowRtl: {
    alignItems: "flex-end",
  },
  stepIndex: {
    color: ZAKAT_UI.colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  stepDescription: {
    color: ZAKAT_UI.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  notesCard: {
    borderColor: ZAKAT_UI.colors.calculationBorder,
    backgroundColor: ZAKAT_UI.colors.calculationBg,
  },
  spacer: {
    height: ZAKAT_UI.spacing.xs,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: ZAKAT_UI.spacing.lg,
    paddingTop: ZAKAT_UI.spacing.xs,
    paddingBottom: ZAKAT_UI.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ZAKAT_UI.colors.border,
    backgroundColor: ZAKAT_UI.colors.surface,
  },
  ctaButton: {
    backgroundColor: ZAKAT_UI.colors.ctaBg,
    borderRadius: ZAKAT_UI.radius.md,
  },
  ctaButtonContent: {
    minHeight: 44,
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
});

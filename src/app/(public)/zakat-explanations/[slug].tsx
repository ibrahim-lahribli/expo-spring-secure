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
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const { t } = useTranslation();

  const category = slug ? getZakatCategoryBySlug(slug) : undefined;
  const tr = (value: LocalizedText) => t(value.key, { defaultValue: value.defaultText });

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

          <SectionCard title={tr({ key: "zakatExplanations.detail.overview.title", defaultText: "Overview" })} icon="information-outline">
            <InfoPair
              label={tr({ key: "zakatExplanations.detail.overview.covers", defaultText: "What this category covers" })}
              value={tr(category.overview.whatItCovers)}
            />
            <InfoPair
              label={tr({ key: "zakatExplanations.detail.overview.whenDue", defaultText: "When zakat is due" })}
              value={tr(category.overview.whenDue)}
            />
          </SectionCard>

          <SectionCard
            title={tr({ key: "zakatExplanations.detail.included.title", defaultText: "Included Items" })}
            icon="format-list-bulleted-square"
          >
            {category.includedItems.map((item) => (
              <BulletRow key={item.key} text={tr(item)} />
            ))}
          </SectionCard>

          <SectionCard
            title={tr({ key: "zakatExplanations.detail.overview.conditions", defaultText: "Conditions" })}
            icon="clipboard-check-outline"
          >
            {category.conditions.map((condition) => (
              <BulletRow key={condition.key} text={tr(condition)} icon="checkbox-marked-circle-outline" />
            ))}
          </SectionCard>

          <SectionCard title={tr({ key: "zakatExplanations.detail.steps.title", defaultText: "How to Calculate" })} icon="calculator-variant-outline">
            <View style={styles.calculationMethodBlock}>
              <Text variant="labelLarge" style={styles.calculationMethodTitle}>
                {tr({ key: "zakatExplanations.detail.overview.calculation", defaultText: "Calculation method" })}
              </Text>
              <Text variant="bodyMedium" style={styles.calculationMethodBody}>
                {tr(category.overview.calculationMethod)}
              </Text>
            </View>
            {category.calculationSteps.map((step, index) => (
              <View key={step.title.key} style={styles.stepCard}>
                <Text variant="labelLarge" style={styles.stepIndex}>
                  {`${index + 1}. ${tr(step.title)}`}
                </Text>
                <Text variant="bodyMedium" style={styles.stepDescription}>
                  {tr(step.description)}
                </Text>
              </View>
            ))}
            {category.deductions.length > 0 ? (
              <View style={styles.subSection}>
                <Text variant="titleSmall" style={styles.subSectionTitle}>
                  {tr({ key: "zakatExplanations.detail.overview.deductions", defaultText: "Deductions allowed" })}
                </Text>
                {category.deductions.map((deduction) => (
                  <BulletRow key={deduction.key} text={tr(deduction)} icon="minus-circle-outline" />
                ))}
              </View>
            ) : null}
          </SectionCard>

          {category.notes.length > 0 ? (
            <SectionCard title={tr({ key: "zakatExplanations.detail.notes.title", defaultText: "Notes / Exceptions" })} icon="alert-circle-outline">
              {category.notes.map((note) => (
                <BulletRow key={note.key} text={tr(note)} icon="information-outline" />
              ))}
            </SectionCard>
          ) : null}

          {category.examples.length > 0 ? (
            <SectionCard title={tr({ key: "zakatExplanations.detail.examples.title", defaultText: "Example(s)" })} icon="lightbulb-on-outline">
              {category.examples.map((example) => (
                <View key={example.title.key} style={styles.exampleCard}>
                  <Text variant="titleSmall" style={styles.exampleTitle}>
                    {tr(example.title)}
                  </Text>
                  {example.inputs.map((input) => (
                    <BulletRow key={input.key} text={tr(input)} icon="circle-small" />
                  ))}
                  <Text variant="bodyMedium" style={styles.exampleResult}>
                    {tr(example.result)}
                  </Text>
                </View>
              ))}
            </SectionCard>
          ) : null}

          {category.fatwaExcerptArabic.length > 0 ? (
            <SectionCard title={tr({ key: "zakatExplanations.detail.fatwa.title", defaultText: "Fatwa Basis (Arabic Excerpt)" })} icon="book-open-page-variant-outline">
              <View style={styles.fatwaBlock}>
                {category.fatwaExcerptArabic.map((line, index) => (
                  <Text key={`${category.slug}-fatwa-${index}`} variant="bodyMedium" style={styles.arabicText}>
                    {line}
                  </Text>
                ))}
              </View>
              {category.fatwaExplanation ? (
                <Text variant="bodySmall" style={styles.fatwaExplanation}>
                  {tr(category.fatwaExplanation)}
                </Text>
              ) : null}
            </SectionCard>
          ) : null}

          {category.faq && category.faq.length > 0 ? (
            <SectionCard title={tr({ key: "zakatExplanations.detail.faq.title", defaultText: "FAQ" })} icon="help-circle-outline">
              {category.faq.map((item) => (
                <View key={item.question.key} style={styles.faqCard}>
                  <Text variant="titleSmall" style={styles.faqQuestion}>
                    {tr(item.question)}
                  </Text>
                  <Text variant="bodyMedium" style={styles.faqAnswer}>
                    {tr(item.answer)}
                  </Text>
                </View>
              ))}
            </SectionCard>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button mode="contained" style={styles.ctaButton} contentStyle={styles.ctaButtonContent} onPress={() => router.push("/(public)/calculate/detailed")}>
            {t("zakatExplanations.detail.cta", { defaultValue: "Go to Calculator" })}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

function HeaderSection({ category, tr }: { category: ZakatCategory; tr: (value: LocalizedText) => string }) {
  const accent = ZAKAT_UI.categoryAccents[category.slug] ?? ZAKAT_UI.colors.accent;

  return (
    <View style={styles.headerCard}>
      <View style={styles.headerTopRow}>
        <View style={[styles.headerIconWrap, { backgroundColor: `${accent}1A` }]}>
          <MaterialCommunityIcons name={category.icon} size={24} color={accent} />
        </View>
        <View style={styles.headerTitleWrap}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            {tr(category.title)}
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            {tr(category.shortSummary)}
          </Text>
        </View>
      </View>
      <View style={styles.badgesRow}>
        {category.rates.map((rate) => (
          <InfoBadge key={`${category.slug}-${rate.value}-${rate.label.key}`} label={`${rate.value} ${tr(rate.label)}`} tone="accent" />
        ))}
      </View>
    </View>
  );
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoPair}>
      <Text variant="titleSmall" style={styles.infoLabel}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={styles.infoValue}>
        {value}
      </Text>
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
    paddingBottom: 120,
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
    padding: ZAKAT_UI.spacing.md,
    gap: ZAKAT_UI.spacing.sm,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: ZAKAT_UI.spacing.sm,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  },
  headerSubtitle: {
    color: ZAKAT_UI.colors.textSecondary,
    lineHeight: 21,
    fontSize: 15,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ZAKAT_UI.spacing.xs,
  },
  infoPair: {
    gap: 4,
    paddingBottom: ZAKAT_UI.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: ZAKAT_UI.colors.border,
  },
  infoLabel: {
    color: ZAKAT_UI.colors.textPrimary,
    fontWeight: "700",
  },
  infoValue: {
    color: ZAKAT_UI.colors.textSecondary,
    lineHeight: 21,
    fontSize: 15,
  },
  calculationMethodBlock: {
    borderRadius: ZAKAT_UI.radius.md,
    borderWidth: 1,
    borderColor: ZAKAT_UI.colors.calculationBorder,
    backgroundColor: ZAKAT_UI.colors.calculationBg,
    padding: ZAKAT_UI.spacing.sm,
    gap: 4,
  },
  calculationMethodTitle: {
    color: ZAKAT_UI.colors.textPrimary,
    fontWeight: "700",
  },
  calculationMethodBody: {
    color: ZAKAT_UI.colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
  },
  stepCard: {
    backgroundColor: ZAKAT_UI.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: ZAKAT_UI.colors.border,
    borderRadius: ZAKAT_UI.radius.md,
    padding: ZAKAT_UI.spacing.sm,
    gap: 4,
  },
  stepIndex: {
    color: ZAKAT_UI.colors.textPrimary,
    fontWeight: "700",
  },
  stepDescription: {
    color: ZAKAT_UI.colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
  },
  subSection: {
    gap: ZAKAT_UI.spacing.xs,
    marginTop: ZAKAT_UI.spacing.xs,
  },
  subSectionTitle: {
    color: ZAKAT_UI.colors.textPrimary,
    fontWeight: "700",
  },
  exampleCard: {
    borderRadius: ZAKAT_UI.radius.md,
    borderWidth: 1,
    borderColor: ZAKAT_UI.colors.border,
    backgroundColor: ZAKAT_UI.colors.surfaceMuted,
    padding: ZAKAT_UI.spacing.sm,
    gap: ZAKAT_UI.spacing.xs,
  },
  exampleTitle: {
    color: ZAKAT_UI.colors.textPrimary,
    fontWeight: "700",
  },
  exampleResult: {
    color: ZAKAT_UI.colors.success,
    fontWeight: "700",
    lineHeight: 21,
  },
  fatwaBlock: {
    borderRadius: ZAKAT_UI.radius.md,
    borderWidth: 1,
    borderColor: ZAKAT_UI.colors.border,
    padding: ZAKAT_UI.spacing.sm,
    backgroundColor: ZAKAT_UI.colors.surfaceMuted,
    gap: ZAKAT_UI.spacing.xs,
  },
  arabicText: {
    textAlign: "right",
    writingDirection: "rtl",
    color: ZAKAT_UI.colors.textPrimary,
    lineHeight: 24,
  },
  fatwaExplanation: {
    color: ZAKAT_UI.colors.textSecondary,
    lineHeight: 20,
  },
  faqCard: {
    borderRadius: ZAKAT_UI.radius.md,
    borderWidth: 1,
    borderColor: ZAKAT_UI.colors.border,
    padding: ZAKAT_UI.spacing.sm,
    gap: 4,
  },
  faqQuestion: {
    color: ZAKAT_UI.colors.textPrimary,
    fontWeight: "700",
  },
  faqAnswer: {
    color: ZAKAT_UI.colors.textSecondary,
    lineHeight: 21,
    fontSize: 15,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: ZAKAT_UI.spacing.lg,
    paddingTop: ZAKAT_UI.spacing.sm,
    paddingBottom: ZAKAT_UI.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ZAKAT_UI.colors.border,
    backgroundColor: ZAKAT_UI.colors.surface,
  },
  ctaButton: {
    backgroundColor: ZAKAT_UI.colors.ctaBg,
    borderRadius: ZAKAT_UI.radius.md,
  },
  ctaButtonContent: {
    minHeight: 48,
  },
});

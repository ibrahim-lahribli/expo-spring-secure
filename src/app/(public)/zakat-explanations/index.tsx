import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { zakatCategories } from "../../../features/zakat-explanations/data";
import { ZAKAT_UI } from "../../../features/zakat-explanations/ui";
import type { LocalizedText } from "../../../features/zakat-explanations/types";

export default function ZakatExplanationsHubScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const tr = (value: LocalizedText) => t(value.key, { defaultValue: value.defaultText });
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCategories = useMemo(
    () =>
      normalizedQuery.length === 0
        ? zakatCategories
        : zakatCategories.filter((category) => {
            const title = tr(category.title).toLowerCase();
            const summary = tr(category.shortSummary).toLowerCase();
            return title.includes(normalizedQuery) || summary.includes(normalizedQuery);
          }),
    [normalizedQuery, t],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text variant="headlineSmall" style={styles.heroTitle}>
            {t("zakatExplanations.hub.title", { defaultValue: "Learn About Zakat" })}
          </Text>
          <Text variant="bodyMedium" style={styles.heroSubtitle}>
            {t("zakatExplanations.hub.subtitle", {
              defaultValue: "Tap a topic to read clear, step-by-step guidance.",
            })}
          </Text>
          <View style={styles.searchWrap}>
            <MaterialCommunityIcons name="magnify" size={18} color={ZAKAT_UI.colors.textTertiary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("zakatExplanations.hub.search", { defaultValue: "Search topics..." })}
              placeholderTextColor={ZAKAT_UI.colors.textTertiary}
              style={styles.searchInput}
            />
          </View>
        </View>

        <View style={styles.cardList}>
          {filteredCategories.map((category) => {
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
                style={({ pressed }) => [styles.topicCard, pressed && styles.topicCardPressed]}
                accessibilityRole="button"
              >
                <View style={[styles.topicIconWrap, { backgroundColor: `${accent}1A` }]}>
                  <MaterialCommunityIcons name={category.icon} size={16} color={accent} />
                </View>
                <View style={styles.topicBody}>
                  <Text variant="titleMedium" style={styles.topicTitle}>
                    {tr(category.title)}
                  </Text>
                  <Text variant="bodySmall" style={styles.topicSummary} numberOfLines={2}>
                    {tr(category.shortSummary)}
                  </Text>
                </View>
                <View style={styles.topicChevronWrap}>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={ZAKAT_UI.colors.textTertiary} />
                </View>
              </Pressable>
            );
          })}
          {filteredCategories.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="bodyMedium" style={styles.emptyStateText}>
                {t("zakatExplanations.hub.empty", { defaultValue: "No topics matched your search." })}
              </Text>
            </View>
          ) : null}
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
  heroCard: {
    backgroundColor: ZAKAT_UI.colors.surface,
    borderWidth: 1,
    borderColor: ZAKAT_UI.colors.border,
    borderRadius: ZAKAT_UI.radius.lg,
    padding: ZAKAT_UI.spacing.md,
    gap: ZAKAT_UI.spacing.sm,
  },
  heroTitle: {
    color: ZAKAT_UI.colors.textPrimary,
    fontWeight: "700",
    fontSize: 25,
  },
  heroSubtitle: {
    color: ZAKAT_UI.colors.textSecondary,
    lineHeight: 20,
    fontSize: 13,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: ZAKAT_UI.spacing.xs,
    borderWidth: 1,
    borderColor: ZAKAT_UI.colors.border,
    borderRadius: ZAKAT_UI.radius.md,
    paddingHorizontal: ZAKAT_UI.spacing.sm,
    height: 44,
    backgroundColor: ZAKAT_UI.colors.surfaceMuted,
  },
  searchInput: {
    flex: 1,
    color: ZAKAT_UI.colors.textPrimary,
    fontSize: 14,
    paddingVertical: 0,
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
  emptyState: {
    borderWidth: 1,
    borderColor: ZAKAT_UI.colors.border,
    borderRadius: ZAKAT_UI.radius.md,
    backgroundColor: ZAKAT_UI.colors.surface,
    padding: ZAKAT_UI.spacing.md,
  },
  emptyStateText: {
    color: ZAKAT_UI.colors.textSecondary,
  },
});

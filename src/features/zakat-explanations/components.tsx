import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { Text } from "react-native-paper";
import { ZAKAT_UI } from "./ui";
import type { IconName } from "./types";

const CARD_SHADOW = {
  shadowColor: ZAKAT_UI.colors.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 10,
  elevation: 2,
} as const;

export function InfoBadge({ label, tone = "default" }: { label: string; tone?: "default" | "accent" }) {
  return (
    <View style={[styles.badge, tone === "accent" && styles.badgeAccent]}>
      <Text style={[styles.badgeText, tone === "accent" && styles.badgeTextAccent]}>{label}</Text>
    </View>
  );
}

export function BulletRow({
  text,
  icon = "check-circle-outline",
}: {
  text: string;
  icon?: IconName;
}) {
  return (
    <View style={styles.bulletRow}>
      <MaterialCommunityIcons name={icon} size={18} color={ZAKAT_UI.colors.accent} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

export function SectionCard({
  title,
  icon,
  children,
  style,
}: {
  title: string;
  icon?: IconName;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.sectionCard, CARD_SHADOW, style]}>
      <View style={styles.sectionHeader}>
        {icon ? (
          <View style={styles.sectionIconWrap}>
            <MaterialCommunityIcons name={icon} size={18} color={ZAKAT_UI.colors.accent} />
          </View>
        ) : null}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {title}
        </Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export function CategoryCard({
  title,
  summary,
  icon,
  badges,
  accentColor,
  onPress,
}: {
  title: string;
  summary: string;
  icon: IconName;
  badges: string[];
  accentColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.categoryCard,
        CARD_SHADOW,
        { borderLeftColor: accentColor },
        pressed && styles.categoryCardPressed,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryIconWrap, { backgroundColor: `${accentColor}1A` }]}>
          <MaterialCommunityIcons name={icon} size={20} color={accentColor} />
        </View>
        <View style={styles.categoryTitleWrap}>
          <Text variant="titleMedium" style={styles.categoryTitle}>
            {title}
          </Text>
          <Text variant="bodySmall" style={styles.categorySummary}>
            {summary}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={ZAKAT_UI.colors.textTertiary} />
      </View>
      <View style={styles.badgesWrap}>
        {badges.map((badge) => (
          <InfoBadge key={`${title}-${badge}`} label={badge} />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: ZAKAT_UI.spacing.sm,
    paddingVertical: 5,
    borderRadius: ZAKAT_UI.radius.pill,
    borderWidth: 1,
    borderColor: ZAKAT_UI.colors.border,
    backgroundColor: ZAKAT_UI.colors.badgeBg,
    alignSelf: "flex-start",
  },
  badgeAccent: {
    borderColor: ZAKAT_UI.colors.accent,
    backgroundColor: ZAKAT_UI.colors.accentSoft,
  },
  badgeText: {
    color: ZAKAT_UI.colors.badgeText,
    fontSize: 12,
    fontWeight: "700",
  },
  badgeTextAccent: {
    color: ZAKAT_UI.colors.accent,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: ZAKAT_UI.spacing.sm,
  },
  bulletText: {
    flex: 1,
    color: ZAKAT_UI.colors.textSecondary,
    lineHeight: 21,
    fontSize: 15,
  },
  sectionCard: {
    backgroundColor: ZAKAT_UI.colors.surface,
    borderWidth: 1,
    borderColor: ZAKAT_UI.colors.border,
    borderRadius: ZAKAT_UI.radius.lg,
    padding: ZAKAT_UI.spacing.md,
    gap: ZAKAT_UI.spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: ZAKAT_UI.spacing.sm,
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ZAKAT_UI.colors.accentSoft,
  },
  sectionTitle: {
    color: ZAKAT_UI.colors.textPrimary,
    fontWeight: "700",
  },
  sectionBody: {
    gap: ZAKAT_UI.spacing.sm,
  },
  categoryCard: {
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: ZAKAT_UI.colors.border,
    borderRadius: ZAKAT_UI.radius.lg,
    backgroundColor: ZAKAT_UI.colors.surface,
    padding: ZAKAT_UI.spacing.md,
    gap: ZAKAT_UI.spacing.sm,
  },
  categoryCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: ZAKAT_UI.spacing.sm,
  },
  categoryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTitleWrap: {
    flex: 1,
    gap: 4,
  },
  categoryTitle: {
    color: ZAKAT_UI.colors.textPrimary,
    fontWeight: "700",
  },
  categorySummary: {
    color: ZAKAT_UI.colors.textSecondary,
    lineHeight: 19,
  },
  badgesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ZAKAT_UI.spacing.xs,
  },
});

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  I18nManager,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewProps,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { appColors, appRadius, appShadows, appSpacing, appTypography, minTouchHeight } from "../../theme/designSystem";

type AppScreenProps = {
  children: React.ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
};

export function AppScreen({ children, scrollable = true, contentContainerStyle }: AppScreenProps) {
  return (
    <SafeAreaView style={styles.screen}>
      {scrollable ? (
        <ScrollView contentContainerStyle={[styles.screenContent, contentContainerStyle]}>{children}</ScrollView>
      ) : (
        <View style={[styles.screenContent, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function AppHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTextWrap}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  iconName?: keyof typeof Ionicons.glyphMap;
  testID?: string;
};

export function PrimaryButton({ label, onPress, disabled, loading, style, iconName, testID }: ButtonProps) {
  const { t } = useTranslation("common");
  const isRTL = I18nManager.isRTL;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      style={({ pressed }) => [
        styles.primaryButton,
        (pressed || loading) && styles.primaryButtonPressed,
        (disabled || loading) && styles.disabledButton,
        isRTL && styles.rowReverse,
        style,
      ]}
    >
      {iconName ? <Ionicons name={iconName} size={18} color="#fff" /> : null}
      <Text style={styles.primaryButtonText}>{loading ? t("loading") : label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled, loading, style, iconName, testID }: ButtonProps) {
  const { t } = useTranslation("common");
  const isRTL = I18nManager.isRTL;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      style={({ pressed }) => [
        styles.secondaryButton,
        (pressed || loading) && styles.secondaryButtonPressed,
        (disabled || loading) && styles.disabledButton,
        isRTL && styles.rowReverse,
        style,
      ]}
    >
      {iconName ? <Ionicons name={iconName} size={18} color={appColors.primary} /> : null}
      <Text style={styles.secondaryButtonText}>{loading ? t("loading") : label}</Text>
    </Pressable>
  );
}

export function IconTileButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.iconTile, pressed && styles.pressed]}>
      <View style={styles.iconTileIconWrap}>
        <Ionicons name={icon} size={20} color={appColors.primary} />
      </View>
      <Text style={styles.iconTileLabel}>{label}</Text>
    </Pressable>
  );
}

export function AppCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function NisabCard({ amount, helper }: { amount: string; helper: string }) {
  const { t } = useTranslation("common");
  const isRTL = I18nManager.isRTL;
  return (
    <View style={styles.nisabCard}>
      <View style={[styles.nisabTitleWrap, isRTL && styles.rowReverse]}>
        <Ionicons name="link-outline" size={16} color={appColors.accent} />
        <Text style={styles.nisabTitle}>{t("nisab.current")}</Text>
      </View>
      <Text style={styles.nisabAmount}>{amount}</Text>
      <Text style={styles.nisabHelper}>{helper}</Text>
    </View>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function LabeledInput({
  label,
  helper,
  error,
  ...inputProps
}: {
  label: string;
  helper?: string;
  error?: string;
} & TextInputProps) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput {...inputProps} style={[styles.input, error ? styles.inputError : undefined, inputProps.style]} />
      {error ? <Text style={styles.errorText}>{error}</Text> : helper ? <Text style={styles.helperText}>{helper}</Text> : null}
    </View>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
}) {
  const isRTL = I18nManager.isRTL;
  return (
    <View style={[styles.segmentRow, isRTL && styles.rowReverse]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.segmentItem, active && styles.segmentItemActive]}>
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function ResultSummaryCard({
  title,
  rows,
  footerLabel,
}: {
  title: string;
  rows: { label: string; value: string }[];
  footerLabel?: string;
}) {
  const isRTL = I18nManager.isRTL;
  return (
    <AppCard>
      <Text style={styles.resultTitle}>{title}</Text>
      {rows.map((row) => (
        <View key={`${row.label}-${row.value}`} style={[styles.resultRow, isRTL && styles.rowReverse]}>
          <Text style={styles.resultLabel}>{row.label}</Text>
          <Text style={styles.resultValue}>{row.value}</Text>
        </View>
      ))}
      {footerLabel ? <Text style={styles.resultFooter}>{footerLabel}</Text> : null}
    </AppCard>
  );
}

export function ListRow({
  title,
  subtitle,
  onPress,
  danger = false,
  rightLabel,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
  rightLabel?: string;
}) {
  const isRTL = I18nManager.isRTL;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.listRow, isRTL && styles.rowReverse]}
    >
      <View style={styles.listRowLeft}>
        <Text style={[styles.listRowTitle, danger && styles.listRowDanger]}>{title}</Text>
        {subtitle ? <Text style={styles.listRowSubtitle}>{subtitle}</Text> : null}
      </View>
      {rightLabel ? (
        <Text style={styles.listRowRight}>{rightLabel}</Text>
      ) : (
        <MaterialCommunityIcons
          name={isRTL ? "chevron-left" : "chevron-right"}
          size={20}
          color={appColors.textSecondary}
        />
      )}
    </Pressable>
  );
}

export function EmptyStateCard({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <AppCard style={styles.emptyStateCard}>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateBody}>{body}</Text>
      {action}
    </AppCard>
  );
}

export function InfoNotice({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  screenContent: {
    padding: appSpacing.md,
    paddingBottom: appSpacing.xl,
    gap: appSpacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: appSpacing.sm,
  },
  headerTextWrap: {
    flex: 1,
    gap: appSpacing.xs,
  },
  headerTitle: {
    ...appTypography.title,
    fontSize: 30,
  },
  headerSubtitle: {
    ...appTypography.body,
    color: appColors.textSecondary,
  },
  primaryButton: {
    minHeight: minTouchHeight,
    borderRadius: appRadius.md,
    backgroundColor: appColors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: appSpacing.md,
    gap: appSpacing.xs,
    flexDirection: "row",
  },
  primaryButtonPressed: {
    backgroundColor: appColors.primaryPressed,
  },
  primaryButtonText: {
    ...appTypography.button,
    color: "#fff",
  },
  secondaryButton: {
    minHeight: minTouchHeight,
    borderRadius: appRadius.md,
    borderWidth: 1,
    borderColor: appColors.primary,
    backgroundColor: "#F0F6F5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: appSpacing.md,
    gap: appSpacing.xs,
    flexDirection: "row",
  },
  secondaryButtonPressed: {
    backgroundColor: "#E8F0EE",
  },
  secondaryButtonText: {
    ...appTypography.button,
    color: appColors.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.9,
  },
  card: {
    ...appShadows.card,
    borderRadius: appRadius.lg,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    padding: appSpacing.md,
    gap: appSpacing.sm,
  },
  nisabCard: {
    borderRadius: appRadius.md,
    borderWidth: 1,
    borderColor: "#E2CC91",
    backgroundColor: appColors.accentSoft,
    padding: appSpacing.md,
    gap: appSpacing.xs,
  },
  nisabTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: appSpacing.xs,
  },
  nisabTitle: {
    color: "#9E7517",
    fontWeight: "700",
    fontSize: 16,
  },
  nisabAmount: {
    color: appColors.textPrimary,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
  },
  nisabHelper: {
    ...appTypography.caption,
    color: "#8D7A49",
  },
  sectionWrap: {
    gap: appSpacing.xxs,
  },
  sectionTitle: {
    ...appTypography.section,
  },
  sectionSubtitle: {
    ...appTypography.caption,
  },
  inputWrap: {
    gap: appSpacing.xs,
  },
  inputLabel: {
    ...appTypography.body,
    fontWeight: "600",
    fontSize: 15,
  },
  input: {
    minHeight: minTouchHeight,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: appRadius.md,
    paddingHorizontal: appSpacing.sm,
    paddingVertical: appSpacing.sm,
    fontSize: 17,
    backgroundColor: appColors.surface,
    color: appColors.textPrimary,
  },
  inputError: {
    borderColor: appColors.error,
  },
  helperText: {
    ...appTypography.caption,
  },
  errorText: {
    ...appTypography.caption,
    color: appColors.error,
  },
  segmentRow: {
    flexDirection: "row",
    gap: appSpacing.xs,
    padding: appSpacing.xxs,
    borderRadius: appRadius.md,
    backgroundColor: "#E9EEEC",
  },
  segmentItem: {
    minHeight: minTouchHeight,
    flex: 1,
    borderRadius: appRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: appSpacing.xs,
  },
  segmentItemActive: {
    backgroundColor: appColors.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "700",
    color: appColors.textSecondary,
    textAlign: "center",
  },
  segmentTextActive: {
    color: "#fff",
  },
  chip: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: appRadius.pill,
    backgroundColor: appColors.surface,
    paddingHorizontal: appSpacing.sm,
    justifyContent: "center",
  },
  chipActive: {
    borderColor: appColors.primary,
    backgroundColor: "#E8F1EF",
  },
  chipText: {
    color: appColors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  chipTextActive: {
    color: appColors.primary,
  },
  resultTitle: {
    ...appTypography.section,
    fontSize: 18,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: appSpacing.sm,
  },
  resultLabel: {
    ...appTypography.body,
    color: appColors.textSecondary,
    flex: 1,
  },
  resultValue: {
    ...appTypography.body,
    fontWeight: "700",
    textAlign: "right",
  },
  resultFooter: {
    ...appTypography.caption,
    marginTop: appSpacing.xs,
  },
  listRow: {
    minHeight: minTouchHeight,
    borderBottomWidth: 1,
    borderBottomColor: "#ECF1EE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: appSpacing.sm,
    paddingVertical: appSpacing.sm,
  },
  listRowLeft: {
    flex: 1,
    gap: appSpacing.xxs,
  },
  listRowTitle: {
    ...appTypography.body,
    fontWeight: "600",
  },
  listRowDanger: {
    color: appColors.error,
  },
  listRowSubtitle: {
    ...appTypography.caption,
  },
  listRowRight: {
    ...appTypography.caption,
    color: appColors.primary,
    fontWeight: "700",
  },
  emptyStateCard: {
    alignItems: "center",
  },
  emptyStateTitle: {
    ...appTypography.section,
    fontSize: 22,
    textAlign: "center",
  },
  emptyStateBody: {
    ...appTypography.body,
    color: appColors.textSecondary,
    textAlign: "center",
  },
  notice: {
    borderRadius: appRadius.md,
    borderWidth: 1,
    borderColor: "#E7D8AE",
    backgroundColor: "#FCF7EA",
    padding: appSpacing.sm,
    gap: appSpacing.xxs,
  },
  noticeTitle: {
    color: "#8E6E20",
    fontSize: 14,
    fontWeight: "700",
  },
  noticeBody: {
    ...appTypography.caption,
    color: "#7A6B45",
  },
  iconTile: {
    flex: 1,
    borderRadius: appRadius.md,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    minHeight: 88,
    padding: appSpacing.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: appSpacing.xs,
  },
  iconTileIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECF4F2",
  },
  iconTileLabel: {
    ...appTypography.caption,
    fontSize: 14,
    fontWeight: "600",
    color: appColors.textPrimary,
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
});

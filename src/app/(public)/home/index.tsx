import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { I18nManager, StyleSheet, Text, View } from "react-native";
import {
  AppCard,
  AppScreen,
  IconTileButton,
  NisabCard,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
} from "../../../components/ui";
import { formatMoney } from "../../../lib/currency";
import { calculateNisab } from "../../../lib/zakat-calculation/nisab";
import { useAuthStore } from "../../../store/authStore";
import { useAppPreferencesStore } from "../../../store/appPreferencesStore";
import { useNisabSettingsStore } from "../../../store/nisabSettingsStore";
import { appColors, appSpacing } from "../../../theme/designSystem";

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation(["common", "home"]);
  const { user } = useAuthStore();
  const isRTL = I18nManager.isRTL;
  const currency = useAppPreferencesStore((s) => s.currency);
  const nisabMethod = useNisabSettingsStore((s) => s.nisabMethod);
  const silverPricePerGram = useNisabSettingsStore((s) => s.silverPricePerGram);
  const goldPricePerGram = useNisabSettingsStore((s) => s.goldPricePerGram);
  const nisabOverride = useNisabSettingsStore((s) => s.nisabOverride);

  const nisabValue = calculateNisab({ nisabMethod, silverPricePerGram, goldPricePerGram, nisabOverride });

  return (
    <AppScreen>
      <View style={styles.greetingWrap}>
        <Text style={[styles.greetingTitle, isRTL && styles.rtlText]}>{t("home:greetingTitle")}</Text>
        <Text style={[styles.greetingSubtitle, isRTL && styles.rtlText]}>
          {t("home:greetingSubtitle")}
        </Text>
      </View>

      <PrimaryButton label={t("home:actions.calculate")} iconName="calculator-outline" onPress={() => router.push("/(public)/calculate")} />
      <SecondaryButton
        label={t("home:actions.detailed")}
        onPress={() => router.push("/(public)/calculate/detailed/setup")}
      />

      <NisabCard
        amount={formatMoney(nisabValue, currency)}
        helper={t("home:nisabHelper", {
          basis:
            nisabMethod === "gold"
              ? t("home:nisabBasis.gold")
              : t("home:nisabBasis.silver"),
        })}
      />

      <SectionTitle title={t("home:quickLinksTitle")} />
      <View style={[styles.quickLinks, isRTL && styles.rowReverse]}>
        <IconTileButton label={t("common:navigation.history")} icon="time-outline" onPress={() => router.push("/(public)/history")} />
        <IconTileButton label={t("common:navigation.learn")} icon="book-outline" onPress={() => router.push("/(public)/zakat-explanations")} />
        <IconTileButton label={t("home:quickLinks.nisab")} icon="options-outline" onPress={() => router.push("/(public)/settings")} />
      </View>

      <AppCard>
        {user ? (
          <>
            <SectionTitle title={t("home:account.title")} subtitle={user.email ?? ""} />
            <PrimaryButton label={t("home:account.view")} onPress={() => router.push("/(protected)/account")} />
          </>
        ) : (
          <>
            <SectionTitle title={t("home:guest.title")} subtitle={t("home:guest.subtitle")} />
            <View style={[styles.authButtons, isRTL && styles.rowReverse]}>
              <SecondaryButton style={styles.halfButton} label={t("common:login")} onPress={() => router.push("/auth/login")} />
              <PrimaryButton style={styles.halfButton} label={t("common:signup")} onPress={() => router.push("/auth/signup")} />
            </View>
          </>
        )}
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  greetingWrap: {
    gap: appSpacing.xs,
  },
  greetingTitle: {
    fontSize: 38,
    lineHeight: 43,
    fontWeight: "800",
    color: appColors.textPrimary,
  },
  greetingSubtitle: {
    fontSize: 16,
    lineHeight: 23,
    color: appColors.textSecondary,
  },
  quickLinks: {
    flexDirection: "row",
    gap: appSpacing.sm,
  },
  authButtons: {
    flexDirection: "row",
    gap: appSpacing.sm,
  },
  halfButton: {
    flex: 1,
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
});

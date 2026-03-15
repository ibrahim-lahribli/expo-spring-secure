import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AppCard,
  AppScreen,
  InfoNotice,
  LabeledInput,
  PrimaryButton,
  SectionTitle,
  SegmentedControl,
} from "../../../components/ui";
import { changeLanguage } from "../../../i18n/i18n";
import {
  DEFAULT_GOLD_PRICE_PER_GRAM,
  DEFAULT_SILVER_PRICE_PER_GRAM,
  GOLD_NISAB_GRAMS,
  SILVER_NISAB_GRAMS,
} from "../../../lib/nisabDefaults";
import { formatMoney } from "../../../lib/currency";
import { fetchGoldApiNisabPrices } from "../../../lib/goldApi";
import { useAppPreferencesStore } from "../../../store/appPreferencesStore";
import { useNisabSettingsStore } from "../../../store/nisabSettingsStore";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SettingsScreen() {
  const { t, i18n } = useTranslation("common");
  const nisabMethod = useNisabSettingsStore((s) => s.nisabMethod);
  const silverPricePerGram = useNisabSettingsStore((s) => s.silverPricePerGram);
  const goldPricePerGram = useNisabSettingsStore((s) => s.goldPricePerGram);
  const setNisabMethod = useNisabSettingsStore((s) => s.setNisabMethod);
  const setSilverPricePerGram = useNisabSettingsStore((s) => s.setSilverPricePerGram);
  const setGoldPricePerGram = useNisabSettingsStore((s) => s.setGoldPricePerGram);
  const setNisabOverride = useNisabSettingsStore((s) => s.setNisabOverride);

  const nisabMethodPreference = useAppPreferencesStore((s) => s.nisabMethodPreference);
  const nisabPricesSource = useAppPreferencesStore((s) => s.nisabPricesSource);
  const currency = useAppPreferencesStore((s) => s.currency);
  const marketPricesLastUpdatedAt = useAppPreferencesStore((s) => s.marketPricesLastUpdatedAt);
  const zakatReminderEnabled = useAppPreferencesStore((s) => s.zakatReminderEnabled);

  const setNisabMethodPreference = useAppPreferencesStore((s) => s.setNisabMethodPreference);
  const setNisabPricesSource = useAppPreferencesStore((s) => s.setNisabPricesSource);
  const setCurrency = useAppPreferencesStore((s) => s.setCurrency);
  const setMarketPricesLastUpdatedAt = useAppPreferencesStore((s) => s.setMarketPricesLastUpdatedAt);
  const setZakatReminderEnabled = useAppPreferencesStore((s) => s.setZakatReminderEnabled);

  const [isFetchingPrices, setIsFetchingPrices] = useState(false);
  const [priceSyncError, setPriceSyncError] = useState<string | null>(null);
  const recommendedMethod = "silver";
  const language = (i18n.resolvedLanguage ?? "ar") as "ar" | "fr" | "en";

  const computedNisabValues = useMemo(() => {
    const silverNisab = silverPricePerGram * SILVER_NISAB_GRAMS;
    const goldNisab = goldPricePerGram * GOLD_NISAB_GRAMS;
    return { silverNisab, goldNisab };
  }, [silverPricePerGram, goldPricePerGram]);

  const effectiveMethodLabel =
    nisabMethodPreference === "auto"
      ? t("settingsScreen.methods.autoWithMethod", {
          method: t(`settingsScreen.methods.${recommendedMethod}`),
        })
      : t(`settingsScreen.methods.${nisabMethod}`);

  const handleMethodChange = (value: "silver" | "gold" | "auto") => {
    setNisabMethodPreference(value);
    if (value === "auto") {
      setNisabMethod(recommendedMethod);
      return;
    }
    setNisabMethod(value);
  };

  const applyFatwaDefaults = () => {
    setGoldPricePerGram(DEFAULT_GOLD_PRICE_PER_GRAM);
    setSilverPricePerGram(DEFAULT_SILVER_PRICE_PER_GRAM);
    setMarketPricesLastUpdatedAt(null);
    setNisabOverride(0);
  };

  const handlePricesSourceChange = (value: "manual" | "market" | "fatwa") => {
    setPriceSyncError(null);
    setNisabPricesSource(value);
    setNisabOverride(0);

    if (value === "fatwa") {
      applyFatwaDefaults();
    }
  };

  useEffect(() => {
    if (nisabPricesSource !== "fatwa") {
      return;
    }

    if (
      goldPricePerGram !== DEFAULT_GOLD_PRICE_PER_GRAM ||
      silverPricePerGram !== DEFAULT_SILVER_PRICE_PER_GRAM
    ) {
      applyFatwaDefaults();
    }
  }, [nisabPricesSource, goldPricePerGram, silverPricePerGram]);

  const handleFetchMarketPrices = async () => {
    setIsFetchingPrices(true);
    setPriceSyncError(null);
    try {
      const response = await fetchGoldApiNisabPrices(currency);
      setGoldPricePerGram(response.goldPricePerGram);
      setSilverPricePerGram(response.silverPricePerGram);
      setMarketPricesLastUpdatedAt(response.fetchedAt);
      setNisabOverride(0);
    } catch (error) {
      setPriceSyncError(
        error instanceof Error
          ? error.message
          : t("settingsScreen.market.fetchFailedBody"),
      );
    } finally {
      setIsFetchingPrices(false);
    }
  };

  return (
    <AppScreen>
      <SectionTitle
        title={t("settingsScreen.title")}
        subtitle={t("settingsScreen.subtitle")}
      />

      <AppCard>
        <SectionTitle title={t("settingsScreen.nisabMethod")} />
        <SegmentedControl
          value={nisabMethodPreference}
          onChange={handleMethodChange}
          options={[
            { label: t("settingsScreen.methods.gold"), value: "gold" },
            { label: t("settingsScreen.methods.silver"), value: "silver" },
            { label: t("settingsScreen.methods.auto"), value: "auto" },
          ]}
        />
        <InfoNotice
          title={t("settingsScreen.effectiveMethod", { method: effectiveMethodLabel })}
          body={t("settingsScreen.effectiveMethodBody")}
        />
        {nisabMethodPreference === "auto" ? (
          <InfoNotice
            title={t("settingsScreen.autoRecommendation")}
            body={`Silver: ${formatMoney(computedNisabValues.silverNisab, currency)} | Gold: ${formatMoney(
              computedNisabValues.goldNisab,
              currency,
            )}`}
          />
        ) : null}
      </AppCard>

      <AppCard>
        <SectionTitle title={t("settingsScreen.nisabPricesSource")} />
        <SegmentedControl
          value={nisabPricesSource}
          onChange={handlePricesSourceChange}
          options={[
            { label: t("settingsScreen.sources.manual"), value: "manual" },
            { label: t("settingsScreen.sources.market"), value: "market" },
            { label: t("settingsScreen.sources.fatwa"), value: "fatwa" },
          ]}
        />
        {nisabPricesSource === "market" ? (
          <>
            <PrimaryButton
              label={isFetchingPrices ? t("settingsScreen.market.fetching") : t("settingsScreen.market.fetchAction")}
              onPress={handleFetchMarketPrices}
              disabled={isFetchingPrices}
            />
            <InfoNotice
              title={t("settingsScreen.market.title")}
              body={
                marketPricesLastUpdatedAt
                  ? t("settingsScreen.market.lastUpdated", {
                      value: formatDate(marketPricesLastUpdatedAt),
                    })
                  : t("settingsScreen.market.empty")
              }
            />
            {priceSyncError ? (
              <InfoNotice title={t("settingsScreen.market.fetchFailed")} body={priceSyncError} />
            ) : null}
          </>
        ) : null}
        {nisabPricesSource === "fatwa" ? (
          <>
            <InfoNotice
              title={t("settingsScreen.fatwaApplied")}
              body={`Gold: ${formatMoney(DEFAULT_GOLD_PRICE_PER_GRAM, currency)}/g | Silver: ${formatMoney(
                DEFAULT_SILVER_PRICE_PER_GRAM,
                currency,
              )}/g`}
            />
            <InfoNotice
              title={t("settingsScreen.defaultNisabValues")}
              body={`Silver: ${formatMoney(computedNisabValues.silverNisab, currency)} | Gold: ${formatMoney(
                computedNisabValues.goldNisab,
                currency,
              )}`}
            />
          </>
        ) : null}
      </AppCard>

      <AppCard>
        <SectionTitle
          title={t(
            nisabPricesSource === "manual"
              ? "settingsScreen.priceCards.manualTitle"
              : "settingsScreen.priceCards.currentTitle",
          )}
        />
        {nisabPricesSource === "manual" ? (
          <>
            <LabeledInput
              label={t("settingsScreen.priceCards.goldPrice", { currency })}
              value={String(goldPricePerGram)}
              onChangeText={(value) => {
                setGoldPricePerGram(Number(value) || 0);
                setNisabOverride(0);
              }}
              keyboardType="decimal-pad"
              placeholder={t("settingsScreen.priceCards.placeholder")}
            />
            <LabeledInput
              label={t("settingsScreen.priceCards.silverPrice", { currency })}
              value={String(silverPricePerGram)}
              onChangeText={(value) => {
                setSilverPricePerGram(Number(value) || 0);
                setNisabOverride(0);
              }}
              keyboardType="decimal-pad"
              placeholder={t("settingsScreen.priceCards.placeholder")}
            />
          </>
        ) : (
          <LabeledInput
            label={t("settingsScreen.priceCards.goldReadonly", { currency })}
            value={String(goldPricePerGram)}
            editable={false}
          />
        )}
        {nisabPricesSource !== "manual" ? (
          <LabeledInput
            label={t("settingsScreen.priceCards.silverReadonly", { currency })}
            value={String(silverPricePerGram)}
            editable={false}
          />
        ) : null}
      </AppCard>

      <AppCard>
        <SectionTitle title={t("settingsScreen.currency")} />
        <SegmentedControl
          value={currency}
          onChange={setCurrency}
          options={[
            { label: "MAD", value: "MAD" },
            { label: "USD", value: "USD" },
            { label: "EURO", value: "EUR" },
          ]}
        />
      </AppCard>

      <AppCard>
        <SectionTitle title={t("settingsScreen.zakatReminder")} />
        <SegmentedControl
          value={zakatReminderEnabled ? "on" : "off"}
          onChange={(value) => setZakatReminderEnabled(value === "on")}
          options={[
            { label: t("yes"), value: "on" },
            { label: t("no"), value: "off" },
          ]}
        />
      </AppCard>

      <AppCard>
        <SectionTitle title={t("settingsScreen.language")} />
        <SegmentedControl
          value={language}
          onChange={changeLanguage}
          options={[
            { label: t("languages.ar"), value: "ar" },
            { label: t("languages.fr"), value: "fr" },
            { label: t("languages.en"), value: "en" },
          ]}
        />
      </AppCard>

    </AppScreen>
  );
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";
import i18n from "i18next";
import ICU from "i18next-icu";
import { initReactI18next, useTranslation } from "react-i18next";
import { I18nManager } from "react-native";
import type { SupportedLanguage } from "../types/i18n";
import arAuth from "./locales/ar/auth.json";
import arCommon from "./locales/ar/common.json";
import arErrors from "./locales/ar/errors.json";
import arHome from "./locales/ar/home.json";
import enAuth from "./locales/en/auth.json";
import enCommon from "./locales/en/common.json";
import enErrors from "./locales/en/errors.json";
import enHome from "./locales/en/home.json";
import frAuth from "./locales/fr/auth.json";
import frCommon from "./locales/fr/common.json";
import frErrors from "./locales/fr/errors.json";
import frHome from "./locales/fr/home.json";

export const LANGUAGE_STORAGE_KEY = "@app_language_v3";
export const SUPPORTED_LANGUAGES = ["ar", "fr", "en"] as const;

export const getLanguagePriority = (
  currentLanguage?: string | null,
): SupportedLanguage[] => {
  const normalizedLanguage =
    currentLanguage && SUPPORTED_LANGUAGES.includes(currentLanguage as SupportedLanguage)
      ? (currentLanguage as SupportedLanguage)
      : null;

  if (!normalizedLanguage) {
    return [...SUPPORTED_LANGUAGES];
  }

  return [
    normalizedLanguage,
    ...SUPPORTED_LANGUAGES.filter((language) => language !== normalizedLanguage),
  ];
};

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    home: enHome,
    errors: enErrors,
  },
  ar: {
    common: arCommon,
    auth: arAuth,
    home: arHome,
    errors: arErrors,
  },
  fr: {
    common: frCommon,
    auth: frAuth,
    home: frHome,
    errors: frErrors,
  },
};

export const isRTL = (language: string): boolean => language === "ar";

const initializeRTL = (language: SupportedLanguage): void => {
  const shouldBeRTL = isRTL(language);

  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.forceRTL(shouldBeRTL);
    I18nManager.allowRTL(shouldBeRTL);
  }
};

const loadSavedLanguage = async (): Promise<SupportedLanguage | null> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage as SupportedLanguage)) {
      return savedLanguage as SupportedLanguage;
    }
    return null;
  } catch (error) {
    console.warn("Failed to load saved language:", error);
    return null;
  }
};

const saveLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.warn("Failed to save language:", error);
  }
};

export const initializeI18n = async (): Promise<void> => {
  const savedLanguage = await loadSavedLanguage();
  const [initialLanguage] = getLanguagePriority(savedLanguage);

  initializeRTL(initialLanguage);

  await i18n.use(ICU).use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: (code) => getLanguagePriority(code).slice(1),
    supportedLngs: SUPPORTED_LANGUAGES,
    compatibilityJSON: "v4",
    ns: ["common", "auth", "home", "errors"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
      bindI18n: "languageChanged",
      bindI18nStore: "",
    },
  });

  if (!savedLanguage) {
    await saveLanguage(initialLanguage);
  }
};

export const changeLanguage = async (
  language: SupportedLanguage,
): Promise<void> => {
  try {
    const currentLanguage = i18n.resolvedLanguage as SupportedLanguage | undefined;
    if (currentLanguage === language) return;

    await saveLanguage(language);
    await i18n.changeLanguage(language);

    const currentRTL = I18nManager.isRTL;
    const newRTL = isRTL(language);

    if (currentRTL !== newRTL) {
      I18nManager.forceRTL(newRTL);
      I18nManager.allowRTL(newRTL);

      try {
        await Updates.reloadAsync();
      } catch (error) {
        console.warn(
          "RTL change detected but the app could not reload automatically.",
          error,
        );
      }
    }
  } catch (error) {
    console.error("Failed to change language:", error);
    throw error;
  }
};

export const getCurrentLanguage = (): SupportedLanguage => {
  return (i18n.resolvedLanguage as SupportedLanguage) || SUPPORTED_LANGUAGES[0];
};

export const useLanguageSwitcher = () => {
  const { i18n: i18next } = useTranslation();
  const currentLanguage =
    (i18next.resolvedLanguage as SupportedLanguage) || getCurrentLanguage();

  const switchLanguage = async (language: SupportedLanguage) => {
    await changeLanguage(language);
  };

  return {
    currentLanguage,
    switchLanguage,
    isRTL: isRTL(currentLanguage),
    supportedLanguages: [...SUPPORTED_LANGUAGES],
  };
};

export default i18n;

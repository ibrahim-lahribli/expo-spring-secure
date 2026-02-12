import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import * as Updates from "expo-updates";
import i18n from "i18next";
import ICU from "i18next-icu";
import { initReactI18next } from "react-i18next";
import { I18nManager } from "react-native";
import type { SupportedLanguage } from "../types/i18n";

// Import all translation files for namespaces
// English
import enAuth from "./locales/en/auth.json";
import enCommon from "./locales/en/common.json";
import enErrors from "./locales/en/errors.json";
import enHome from "./locales/en/home.json";
// Arabic
import arAuth from "./locales/ar/auth.json";
import arCommon from "./locales/ar/common.json";
import arErrors from "./locales/ar/errors.json";
import arHome from "./locales/ar/home.json";
// French
import frAuth from "./locales/fr/auth.json";
import frCommon from "./locales/fr/common.json";
import frErrors from "./locales/fr/errors.json";
import frHome from "./locales/fr/home.json";

// Language storage key
const LANGUAGE_STORAGE_KEY = "@app_language_v3"; // Bumped version for new structure

// Supported languages with priority order
export const SUPPORTED_LANGUAGES = ["ar", "fr", "en"] as const;

// Translation resources by namespace
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

// Get device language code only (e.g., 'en' from 'en-US')
const getDeviceLanguage = (): SupportedLanguage => {
  const deviceLocale = Localization.getLocales()[0]?.languageCode || "en";

  // Check if device language is supported
  if (SUPPORTED_LANGUAGES.includes(deviceLocale as SupportedLanguage)) {
    return deviceLocale as SupportedLanguage;
  }

  // Default to English if device language is not supported
  return "en";
};

// Check if language is RTL
export const isRTL = (language: string): boolean => {
  return language === "ar";
};

// Initialize RTL for a language
const initializeRTL = (language: SupportedLanguage): void => {
  const shouldBeRTL = isRTL(language);

  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.forceRTL(shouldBeRTL);
    I18nManager.allowRTL(shouldBeRTL);
  }
};

// Load saved language from storage
const loadSavedLanguage = async (): Promise<SupportedLanguage | null> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return savedLanguage as SupportedLanguage | null;
  } catch (error) {
    console.warn("Failed to load saved language:", error);
    return null;
  }
};

// Save language to storage
const saveLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.warn("Failed to save language:", error);
  }
};

// Initialize i18n
export const initializeI18n = async (): Promise<void> => {
  // Try to load saved language first
  const savedLanguage = await loadSavedLanguage();

  // Determine initial language
  const initialLanguage = savedLanguage || getDeviceLanguage();

  // Initialize RTL for the initial language
  initializeRTL(initialLanguage);

  // Initialize i18next
  await i18n
    .use(ICU) // Add ICU support for complex plurals (especially Arabic)
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: {
        ar: ["fr", "en"],
        fr: ["en"],
        default: ["en"],
      },
      supportedLngs: SUPPORTED_LANGUAGES,
      compatibilityJSON: "v4", // Adjusted to match current library types
      ns: ["common", "auth", "home", "errors"],
      defaultNS: "common",
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      react: {
        useSuspense: false, // Disable suspense mode for React Native
        bindI18n: "languageChanged", // Performance tweak: only re-render on language change
        bindI18nStore: "",
      },
    });
};

// Change language function
export const changeLanguage = async (
  language: SupportedLanguage,
): Promise<void> => {
  try {
    const currentLanguage = i18n.language;
    if (currentLanguage === language) return;

    // Save the new language
    await saveLanguage(language);

    // Check if RTL needs to change
    const currentRTL = I18nManager.isRTL;
    const newRTL = isRTL(language);

    // Update RTL settings
    if (currentRTL !== newRTL) {
      I18nManager.forceRTL(newRTL);
      I18nManager.allowRTL(newRTL);

      // MANDATORY: Full app reload for RTL/LTR changes in React Native
      if (!__DEV__) {
        await Updates.reloadAsync();
      } else {
        console.warn(
          "RTL change detected. In production, the app will reload automatically.",
        );
        // Even in dev, we should probably reload if we want to see it work
        // but it might disconnect the debugger. 
        // For now, let's just change language and warn.
        await i18n.changeLanguage(language);
      }
    } else {
      // Just change language if RTL stays the same
      await i18n.changeLanguage(language);
    }
  } catch (error) {
    console.error("Failed to change language:", error);
    throw error;
  }
};

// Get current language
export const getCurrentLanguage = (): SupportedLanguage => {
  return (i18n.language as SupportedLanguage) || "en";
};

// Helper hook for language switching
export const useLanguageSwitcher = () => {
  const currentLanguage = getCurrentLanguage();

  const switchLanguage = async (language: SupportedLanguage) => {
    await changeLanguage(language);
  };

  return {
    currentLanguage,
    switchLanguage,
    isRTL: isRTL(currentLanguage),
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
};

// Export i18n instance for direct usage
export default i18n;

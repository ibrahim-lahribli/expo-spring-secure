import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ssrSafeStorage } from "../lib/storage";
import type { SupportedLanguage } from "../types/i18n";

export type NisabMethodPreference = "gold" | "silver" | "auto";
export type NisabPricesSource = "manual" | "market";
export type DatePreference = "hijri" | "gregorian";
export type ThemePreference = "system" | "light" | "dark";
export type SupportedCurrency = "USD" | "EUR" | "SAR" | "PKR";

interface AppPreferencesState {
  nisabMethodPreference: NisabMethodPreference;
  nisabPricesSource: NisabPricesSource;
  customNisabEnabled: boolean;
  customNisabAmount: number;
  currency: SupportedCurrency;
  language: SupportedLanguage;
  datePreference: DatePreference;
  zakatReminderEnabled: boolean;
  theme: ThemePreference;
  marketPricesLastUpdatedAt: string | null;
  setNisabMethodPreference: (value: NisabMethodPreference) => void;
  setNisabPricesSource: (value: NisabPricesSource) => void;
  setCustomNisabEnabled: (value: boolean) => void;
  setCustomNisabAmount: (value: number) => void;
  setCurrency: (value: SupportedCurrency) => void;
  setLanguage: (value: SupportedLanguage) => void;
  setDatePreference: (value: DatePreference) => void;
  setZakatReminderEnabled: (value: boolean) => void;
  setTheme: (value: ThemePreference) => void;
  setMarketPricesLastUpdatedAt: (value: string | null) => void;
}

function toNonNegativeNumber(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

export const useAppPreferencesStore = create<AppPreferencesState>()(
  persist(
    (set) => ({
      nisabMethodPreference: "silver",
      nisabPricesSource: "manual",
      customNisabEnabled: false,
      customNisabAmount: 0,
      currency: "USD",
      language: "en",
      datePreference: "gregorian",
      zakatReminderEnabled: false,
      theme: "system",
      marketPricesLastUpdatedAt: null,
      setNisabMethodPreference: (value) => set({ nisabMethodPreference: value }),
      setNisabPricesSource: (value) => set({ nisabPricesSource: value }),
      setCustomNisabEnabled: (value) => set({ customNisabEnabled: value }),
      setCustomNisabAmount: (value) =>
        set({ customNisabAmount: toNonNegativeNumber(value) }),
      setCurrency: (value) => set({ currency: value }),
      setLanguage: (value) => set({ language: value }),
      setDatePreference: (value) => set({ datePreference: value }),
      setZakatReminderEnabled: (value) => set({ zakatReminderEnabled: value }),
      setTheme: (value) => set({ theme: value }),
      setMarketPricesLastUpdatedAt: (value) =>
        set({ marketPricesLastUpdatedAt: value }),
    }),
    {
      name: "app-preferences",
      storage: createJSONStorage(() => ssrSafeStorage),
      partialize: (state) => ({
        nisabMethodPreference: state.nisabMethodPreference,
        nisabPricesSource: state.nisabPricesSource,
        customNisabEnabled: state.customNisabEnabled,
        customNisabAmount: state.customNisabAmount,
        currency: state.currency,
        language: state.language,
        datePreference: state.datePreference,
        zakatReminderEnabled: state.zakatReminderEnabled,
        theme: state.theme,
        marketPricesLastUpdatedAt: state.marketPricesLastUpdatedAt,
      }),
    },
  ),
);

